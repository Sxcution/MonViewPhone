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
  scanCanvasROIs,
  playAlertSound,
  showAlertNotification,
  requestNotificationPermission,
} from '@/lib/visualAlertEngine';

type DeviceScanState = {
  consecutiveHits: number;
  lastAlertAt: number;
  currentlyAlerting: boolean;
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
};

const STAGGER_MS = 150;

export function useVisualAlert({
  config,
  getCanvasForUdid,
  registeredUdids,
  orderMap,
}: UseVisualAlertOpts) {
  const [scanning, setScanning] = useState(false);
  const [lastAlert, setLastAlert] = useState<AlertEvent | null>(null);

  // Keep mutable refs to avoid stale closures in setInterval
  const configRef = useRef(config);
  configRef.current = config;

  const registeredRef = useRef(registeredUdids);
  registeredRef.current = registeredUdids;

  const orderMapRef = useRef(orderMap);
  orderMapRef.current = orderMap;

  const getCanvasRef = useRef(getCanvasForUdid);
  getCanvasRef.current = getCanvasForUdid;

  // Per-device scan state (consecutiveHits + lastAlertAt)
  const deviceStateRef = useRef(new Map<string, DeviceScanState>());

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
      // Skip if no ROIs configured
      if (!cfg.rois.length) return { detected: false, totalPixelCount: 0 };

      const canvas = getCanvasRef.current(udid);
      if (!canvas) return { detected: false, totalPixelCount: 0 };

      const result: MultiROIResult = scanCanvasROIs(canvas, cfg.rois, cfg.redThreshold);
      if (!result.scanned) return { detected: false, totalPixelCount: 0 };

      const state = deviceStateRef.current.get(udid) ?? { consecutiveHits: 0, lastAlertAt: 0, currentlyAlerting: false };

      if (result.detected) {
        state.consecutiveHits++;
      } else {
        state.consecutiveHits = 0;
        if (state.currentlyAlerting) {
          state.currentlyAlerting = false;
          window.dispatchEvent(new CustomEvent('visualAlertCleared', { detail: { udid } }));
        }
      }

      deviceStateRef.current.set(udid, state);

      if (state.consecutiveHits >= cfg.confirmCount) {
        const now = Date.now();
        const deviceNumber = orderMapRef.current.get(udid) ?? 0;
        const hitNames = result.hits.filter(h => h.detected).map(h => h.roiName);
        const roiSuffix = hitNames.length ? `: ${hitNames.slice(0, 2).join(', ')}` : '';

        if (!state.currentlyAlerting) {
          state.currentlyAlerting = true;
          state.lastAlertAt = now;

          playAlertSound();
          showAlertNotification(udid, deviceNumber, hitNames);

          setLastAlert({
            deviceNumber,
            message: `Máy ${String(deviceNumber).padStart(2, '0')} phát hiện chấm đỏ${roiSuffix}`,
            timestamp: now,
          });
        } else {
          // Already alerting, check cooldown for repeated sound/OS notification
          if (now - state.lastAlertAt >= cfg.cooldownSec * 1000) {
            state.lastAlertAt = now;
            playAlertSound();
            showAlertNotification(udid, deviceNumber, hitNames);
          }
        }

        return { detected: true, totalPixelCount: result.totalRedPixelCount };
      }

      return { detected: false, totalPixelCount: result.totalRedPixelCount };
    },
    [],
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
      return scanCanvasROIs(canvas, cfg.rois, cfg.redThreshold);
    },
    [],
  );

  const testSound = useCallback(() => {
    playAlertSound();
  }, []);

  return { scanning, lastAlert, testScanDevice, testSound };
}
