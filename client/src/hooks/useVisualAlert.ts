/**
 * useVisualAlert.ts
 * React hook managing the stagger-scan loop, per-device confirm count,
 * cooldown tracking, and alert triggering.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type VisualAlertConfig,
  scanCanvasROI,
  playAlertSound,
  showAlertNotification,
  requestNotificationPermission,
} from '@/lib/visualAlertEngine';

type DeviceScanState = {
  consecutiveHits: number;
  lastAlertAt: number;
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

  // Core scan function for a single device
  const scanDevice = useCallback(
    (udid: string): { detected: boolean; pixelCount: number } => {
      const cfg = configRef.current;
      const canvas = getCanvasRef.current(udid);
      if (!canvas) return { detected: false, pixelCount: 0 };

      const result = scanCanvasROI(canvas, cfg.roi, cfg.redThreshold);
      if (!result.scanned) return { detected: false, pixelCount: 0 };

      const state = deviceStateRef.current.get(udid) ?? { consecutiveHits: 0, lastAlertAt: 0 };

      // Check cooldown
      const now = Date.now();
      if (now - state.lastAlertAt < cfg.cooldownSec * 1000) {
        return { detected: false, pixelCount: result.redPixelCount };
      }

      if (result.redPixelCount >= cfg.redThreshold.minPixels) {
        state.consecutiveHits++;
      } else {
        state.consecutiveHits = 0;
      }

      deviceStateRef.current.set(udid, state);

      if (state.consecutiveHits >= cfg.confirmCount) {
        // Alert triggered
        state.consecutiveHits = 0;
        state.lastAlertAt = now;
        deviceStateRef.current.set(udid, state);

        const deviceNumber = orderMapRef.current.get(udid) ?? 0;
        playAlertSound();
        showAlertNotification(deviceNumber);
        setLastAlert({
          deviceNumber,
          message: `Máy ${String(deviceNumber).padStart(2, '0')} phát hiện chấm đỏ`,
          timestamp: now,
        });

        return { detected: true, pixelCount: result.redPixelCount };
      }

      return { detected: false, pixelCount: result.redPixelCount };
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

  // Test scan: scan a specific device and return result
  const testScanDevice = useCallback(
    (udid: string): { pixelCount: number; scanned: boolean } => {
      const cfg = configRef.current;
      const canvas = getCanvasRef.current(udid);
      if (!canvas) return { pixelCount: 0, scanned: false };
      const result = scanCanvasROI(canvas, cfg.roi, cfg.redThreshold);
      return { pixelCount: result.redPixelCount, scanned: result.scanned };
    },
    [],
  );

  const testSound = useCallback(() => {
    playAlertSound();
  }, []);

  return { scanning, lastAlert, testScanDevice, testSound };
}
