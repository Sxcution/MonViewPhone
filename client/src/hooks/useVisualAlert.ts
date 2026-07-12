/**
 * useVisualAlert.ts
 * React hook managing the stagger-scan loop, per-device confirm count,
 * cooldown tracking, and alert triggering.
 * Supports Multi-ROI scanning.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type VisualAlertConfig,
  type MultiROIResult,
  scanCanvasVisualAlert,
  playAlertSound,
  showAlertNotification,
  requestNotificationPermission,
} from '@/lib/visualAlertEngine';

type DeviceScanState = {
  consecutiveHits: number;
  lastAlertAt: number;
  currentlyAlerting: boolean;
  verifyInFlight: boolean;
  lastVerifyAt: number;
  lastVerifiedOk: boolean;
};

type AlertEvent = {
  deviceNumber: number;
  message: string;
  timestamp: number;
};

type UseVisualAlertOpts = {
  config: VisualAlertConfig;
  getCanvasForUdid: (udid: string) => HTMLCanvasElement | null;
  registeredUdids: string[];
  orderMap: Map<string, number>;
  viewerUdid?: string | null;
  verifyWeChatNotification?: (udid: string) => Promise<boolean>;
};

const STAGGER_MS = 150;

function getAlertLabelFromHits(hits: MultiROIResult['hits']): string {
  const detectedModes = new Set(
    hits
      .filter(hit => hit.detected)
      .map(hit => hit.detectionMode ?? 'red-dot'),
  );
  if (detectedModes.size === 1 && detectedModes.has('wechat-status')) return 'icon WeChat';
  if (detectedModes.size === 1 && detectedModes.has('red-dot')) return 'chấm đỏ';
  return 'thông báo';
}

export function useVisualAlert({
  config,
  getCanvasForUdid,
  registeredUdids,
  orderMap,
  viewerUdid,
  verifyWeChatNotification,
}: UseVisualAlertOpts) {
  const [scanning, setScanning] = useState(false);
  const [lastAlert, setLastAlert] = useState<AlertEvent | null>(null);

  const viewerUdidRef = useRef(viewerUdid);
  viewerUdidRef.current = viewerUdid;

  // Keep mutable refs to avoid stale closures in setInterval
  const configRef = useRef(config);
  configRef.current = config;

  const registeredRef = useRef(registeredUdids);
  registeredRef.current = registeredUdids;

  const orderMapRef = useRef(orderMap);
  orderMapRef.current = orderMap;

  const getCanvasRef = useRef(getCanvasForUdid);
  getCanvasRef.current = getCanvasForUdid;

  const verifyWeChatNotificationRef = useRef(verifyWeChatNotification);
  verifyWeChatNotificationRef.current = verifyWeChatNotification;

  // Per-device scan state (consecutiveHits + lastAlertAt)
  const deviceStateRef = useRef(new Map<string, DeviceScanState>());

  const makeDeviceState = useCallback((): DeviceScanState => ({
    consecutiveHits: 0,
    lastAlertAt: 0,
    currentlyAlerting: false,
    verifyInFlight: false,
    lastVerifyAt: 0,
    lastVerifiedOk: false,
  }), []);

  const clearDeviceAlert = useCallback((udid: string, state: DeviceScanState) => {
    state.currentlyAlerting = false;
    state.consecutiveHits = 0;
    state.lastVerifiedOk = false;
    window.dispatchEvent(new CustomEvent('visualAlertCleared', { detail: { udid } }));
  }, []);

  const emitAlert = useCallback((
    udid: string,
    state: DeviceScanState,
    result: MultiROIResult,
    cfg: VisualAlertConfig,
    now: number,
  ) => {
    if (!configRef.current.enabled) return;

    const deviceNumber = orderMapRef.current.get(udid) ?? 0;
    const detectedHits = result.hits.filter(h => h.detected);
    const hitNames = detectedHits.map(h => h.roiName);
    const roiSuffix = hitNames.length ? `: ${hitNames.slice(0, 2).join(', ')}` : '';
    const alertLabel = getAlertLabelFromHits(detectedHits);

    if (!state.currentlyAlerting) {
      state.currentlyAlerting = true;
      state.lastAlertAt = now;

      playAlertSound();
      showAlertNotification(udid, deviceNumber, hitNames, alertLabel);

      setLastAlert({
        deviceNumber,
        message: `Máy ${String(deviceNumber).padStart(2, '0')} phát hiện ${alertLabel}${roiSuffix}`,
        timestamp: now,
      });
      return;
    }

    if (now - state.lastAlertAt >= cfg.cooldownSec * 1000) {
      state.lastAlertAt = now;
      playAlertSound();
      showAlertNotification(udid, deviceNumber, hitNames, alertLabel);
    }
  }, []);

  // Clear alert state immediately when a device enters Viewer mode
  useEffect(() => {
    if (viewerUdid) {
      const state = deviceStateRef.current.get(viewerUdid);
      if (state && state.currentlyAlerting) {
        clearDeviceAlert(viewerUdid, state);
      }
    }
  }, [viewerUdid, clearDeviceAlert]);

  // Request notification permission once when enabled
  useEffect(() => {
    if (config.enabled) {
      requestNotificationPermission();
    }
  }, [config.enabled]);

  // Core scan function for a single device (multi-ROI)
  const scanDevice = useCallback(
    (udid: string): { detected: boolean; totalPixelCount: number } => {
      const cfg = configRef.current;
      if (!cfg.enabled) {
        return { detected: false, totalPixelCount: 0 };
      }

      // Skip scanning if this device is currently in Viewer mode
      if (viewerUdidRef.current && udid === viewerUdidRef.current) {
        const state = deviceStateRef.current.get(udid);
        if (state && state.currentlyAlerting) {
          clearDeviceAlert(udid, state);
        }
        return { detected: false, totalPixelCount: 0 };
      }
      // Skip if no ROIs configured
      if (!cfg.rois.length) return { detected: false, totalPixelCount: 0 };

      const canvas = getCanvasRef.current(udid);
      if (!canvas) return { detected: false, totalPixelCount: 0 };

      const result: MultiROIResult = scanCanvasVisualAlert(canvas, cfg);
      if (!result.scanned) return { detected: false, totalPixelCount: 0 };

      const state = deviceStateRef.current.get(udid) ?? makeDeviceState();

      if (result.detected) {
        state.consecutiveHits++;
      } else {
        if (state.currentlyAlerting) {
          clearDeviceAlert(udid, state);
        } else {
          state.consecutiveHits = 0;
          state.lastVerifiedOk = false;
        }
      }

      deviceStateRef.current.set(udid, state);

      if (state.consecutiveHits >= cfg.confirmCount) {
        const now = Date.now();
        const detectedHits = result.hits.filter(h => h.detected);
        const needsAdbVerify = cfg.wechatStatus.adbVerify
          && detectedHits.length > 0
          && detectedHits.every(h => h.detectionMode === 'wechat-status');

        if (needsAdbVerify) {
          const verifyCooldownMs = cfg.wechatStatus.adbCooldownSec * 1000;
          const verifier = verifyWeChatNotificationRef.current;
          const hasFreshVerify = state.lastVerifiedOk && now - state.lastVerifyAt < verifyCooldownMs;

          if (!hasFreshVerify) {
            const canVerifyNow = !!verifier && !state.verifyInFlight && now - state.lastVerifyAt >= verifyCooldownMs;
            if (canVerifyNow) {
              state.verifyInFlight = true;
              state.lastVerifyAt = now;
              deviceStateRef.current.set(udid, state);

              verifier(udid)
                .then(ok => {
                  const latest = deviceStateRef.current.get(udid) ?? makeDeviceState();
                  latest.verifyInFlight = false;
                  latest.lastVerifiedOk = ok;
                  latest.lastVerifyAt = Date.now();

                  if (!ok) {
                    if (latest.currentlyAlerting) {
                      clearDeviceAlert(udid, latest);
                    } else {
                      latest.consecutiveHits = 0;
                    }
                    deviceStateRef.current.set(udid, latest);
                    return;
                  }

                  deviceStateRef.current.set(udid, latest);
                  const latestCfg = configRef.current;
                  if (
                    latestCfg.enabled &&
                    latest.consecutiveHits >= latestCfg.confirmCount
                  ) {
                    emitAlert(udid, latest, result, latestCfg, Date.now());
                    deviceStateRef.current.set(udid, latest);
                  }
                })
                .catch(() => {
                  const latest = deviceStateRef.current.get(udid) ?? makeDeviceState();
                  latest.verifyInFlight = false;
                  latest.lastVerifiedOk = false;
                  latest.consecutiveHits = 0;
                  latest.lastVerifyAt = Date.now();
                  deviceStateRef.current.set(udid, latest);
                });
            }

            return { detected: false, totalPixelCount: result.totalRedPixelCount };
          }
        }

        emitAlert(udid, state, result, cfg, now);
        deviceStateRef.current.set(udid, state);
        return { detected: true, totalPixelCount: result.totalRedPixelCount };
      }

      return { detected: false, totalPixelCount: result.totalRedPixelCount };
    },
    [clearDeviceAlert, emitAlert, makeDeviceState],
  );

  // Main scan loop with stagger
  useEffect(() => {
    if (!config.enabled) {
      setScanning(false);
      return;
    }

    setScanning(true);

    const intervalMs = Math.max(1000, config.scanIntervalSec * 1000);
    const staggerTimers: number[] = [];

    const runScan = () => {
      const udids = registeredRef.current;
      if (!udids.length) return;

      // Clear previous stagger timers
      staggerTimers.forEach(t => window.clearTimeout(t));
      staggerTimers.length = 0;

      udids.forEach((udid, i) => {
        const timer = window.setTimeout(() => {
          scanDevice(udid);
        }, i * STAGGER_MS);
        staggerTimers.push(timer);
      });
    };

    // Run initial scan after a short delay
    const initialTimer = window.setTimeout(runScan, 500);

    const intervalId = window.setInterval(runScan, intervalMs);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalId);
      staggerTimers.forEach(t => window.clearTimeout(t));
      staggerTimers.length = 0;
      setScanning(false);
    };
  }, [config.enabled, config.scanIntervalSec, scanDevice]);

  // Test scan: scan a specific device and return multi-ROI result
  const testScanDevice = useCallback(
    (udid: string): MultiROIResult => {
      const cfg = configRef.current;
      const canvas = getCanvasRef.current(udid);
      if (!canvas || !cfg.rois.length) {
        return { scanned: false, detected: false, totalRedPixelCount: 0, hits: [] };
      }
      return scanCanvasVisualAlert(canvas, cfg);
    },
    [],
  );

  const testSound = useCallback(() => {
    playAlertSound();
  }, []);

  return { scanning, lastAlert, testScanDevice, testSound };
}
