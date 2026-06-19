import { useCallback, useEffect, useMemo, useState } from 'react';
import { saveTileOrderToBackend, saveTileOrderNumbersToBackend } from '../lib/backendSettings';

const TILE_NUMBER_KEY = 'tileOrderNumbers';
const TILE_NUMBER_BACKUP_KEY = 'tileOrderNumbersBackupV1';
const TILE_NUMBER_RESTORE_KEY = 'tileOrderNumbersRestoredKnownFarmV1';
const TILE_NUMBER_PRE_RESTORE_KEY = 'tileOrderNumbersBeforeKnownRestoreV1';

const KNOWN_FARM_TILE_NUMBERS: Record<string, number> = {
  '27f30c41a3217ece': 1,
  '2793a9a5021c7ece': 2,
  '2870da3de13f7ece': 3,
  '28083aacbd217ece': 4,
  R58N22PK6XH: 5,
  R58R12B2NLZ: 6,
  '2851aa1728017ece': 7,
  '289cabc94e1c7ece': 8,
  kvrcpvx4w86hnvci: 9,
  '2760466d28217ece': 10,
  '2a7daa5dee3f7ece': 11,
  R58N30MBK4F: 12,
  '28c42e85853f7ece': 13,
  RFCN30H078F: 14,
  '269c5ad06a0d7ece': 15,
  '2808133db6217ece': 16,
  '28548fcc38017ece': 17,
  xklrgm6tj74pnruc: 18,
  '2619e1eb2a057ece': 19,
  '24c24e6c370c7ece': 20,
  ce0817187cd6803d027e: 21,
  '6294909c': 22,
  '28b85ba51b1c7ece': 23,
  '3b87f833': 24,
  '27fda9ec9e217ece': 25,
  '1264215f': 26,
  eubqcykrhm8dw8hy: 27,
  '33c8cd7e': 28,
  '27119d12': 29,
  '2a0bab48843f7ece': 30,
  '28d96cc4ce0c7ece': 31,
  '1d65d69e': 32,
  R3CR200MXTR: 33,
  RFCRB1CQ2VE: 34,
  '25f5db2d04057ece': 35,
};

const KNOWN_FARM_TILE_ORDER = Object.entries(KNOWN_FARM_TILE_NUMBERS)
  .sort((a, b) => a[1] - b[1])
  .map(([udid]) => udid);

function parseTileNumbers(raw: string | null): Record<string, number> {
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const out: Record<string, number> = {};
  for (const [id, value] of Object.entries(parsed)) {
    const n = Number(value);
    if (typeof id === 'string' && Number.isFinite(n) && n > 0) {
      out[id] = Math.floor(n);
    }
  }
  return out;
}

function loadTileNumbersBackup(): Record<string, number> {
  try {
    const raw = localStorage.getItem(TILE_NUMBER_BACKUP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parseTileNumbers(JSON.stringify(parsed?.orderNumbers ?? parsed));
  } catch {
    return {};
  }
}

function saveTileNumbersSnapshot(key: string, orderNumbers: Record<string, number>) {
  try {
    if (Object.keys(orderNumbers).length === 0) return;
    localStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        orderNumbers,
      }),
    );
  } catch {
    // ignore
  }
}

function shouldRestoreKnownFarmOrder(orderNumbers: Record<string, number>): boolean {
  if (typeof window === 'undefined' || window.location.protocol !== 'file:') return false;

  try {
    if (localStorage.getItem(TILE_NUMBER_RESTORE_KEY) === '1') return false;
  } catch {
    return false;
  }

  const knownKeys = Object.keys(KNOWN_FARM_TILE_NUMBERS);
  const presentKeys = knownKeys.filter((id) => Number.isFinite(orderNumbers[id]));
  if (presentKeys.length === 0) return true;
  if (presentKeys.length < 20) return false;

  const mismatchCount = presentKeys.filter((id) => orderNumbers[id] !== KNOWN_FARM_TILE_NUMBERS[id]).length;
  if (mismatchCount === 0) {
    try {
      localStorage.setItem(TILE_NUMBER_RESTORE_KEY, '1');
    } catch {
      // ignore
    }
    return false;
  }
  return mismatchCount >= 5;
}

function restoreKnownFarmOrder(previous: Record<string, number>): Record<string, number> {
  try {
    saveTileNumbersSnapshot(TILE_NUMBER_PRE_RESTORE_KEY, previous);
    localStorage.setItem(TILE_NUMBER_KEY, JSON.stringify(KNOWN_FARM_TILE_NUMBERS));
    localStorage.setItem('tileOrder', JSON.stringify(KNOWN_FARM_TILE_ORDER));
    localStorage.setItem(TILE_NUMBER_RESTORE_KEY, '1');
  } catch {
    // ignore
  }
  return { ...KNOWN_FARM_TILE_NUMBERS };
}

function loadTileNumbers(): Record<string, number> {
  try {
    const current = parseTileNumbers(localStorage.getItem(TILE_NUMBER_KEY));
    const loaded = Object.keys(current).length > 0 ? current : loadTileNumbersBackup();
    return shouldRestoreKnownFarmOrder(loaded) ? restoreKnownFarmOrder(loaded) : loaded;
  } catch {
    const backup = loadTileNumbersBackup();
    return shouldRestoreKnownFarmOrder(backup) ? restoreKnownFarmOrder(backup) : backup;
  }
}

// Manage ordering of device tiles. Persists to localStorage.
export function useTileOrder(defaultDevices: string[]) {
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('tileOrder');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
    } catch {
      // ignore
    }
    return [];
  });
  const [orderNumbers, setOrderNumbers] = useState<Record<string, number>>(loadTileNumbers);

  // Keep order in sync with discovered devices
  const mergedOrder = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of order) {
      if (defaultDevices.includes(id) && !seen.has(id)) {
        out.push(id);
        seen.add(id);
      }
    }
    for (const id of defaultDevices) {
      if (!seen.has(id)) {
        out.push(id);
        seen.add(id);
      }
    }
    return out;
  }, [order, defaultDevices]);

  useEffect(() => {
    try {
      const value = JSON.stringify(mergedOrder);
      localStorage.setItem('tileOrder', value);
      saveTileOrderToBackend(value);
    } catch {
      // ignore
    }
  }, [mergedOrder]);

  useEffect(() => {
    setOrderNumbers((prev) => {
      const next = { ...prev };
      const used = new Set<number>();
      let changed = false;

      for (const id of defaultDevices) {
        const n = next[id];
        if (Number.isFinite(n) && n > 0) used.add(n);
      }

      let candidate = 1;
      for (const id of mergedOrder) {
        if (Number.isFinite(next[id]) && next[id] > 0) continue;
        while (used.has(candidate)) candidate += 1;
        next[id] = candidate;
        used.add(candidate);
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [defaultDevices, mergedOrder]);

  useEffect(() => {
    try {
      const value = JSON.stringify(orderNumbers);
      localStorage.setItem(TILE_NUMBER_KEY, value);
      saveTileNumbersSnapshot(TILE_NUMBER_BACKUP_KEY, orderNumbers);
      saveTileOrderNumbersToBackend(value);
    } catch {
      // ignore
    }
  }, [orderNumbers]);

  const sortedOrder = useMemo(() => {
    const stableIndex = new Map<string, number>();
    mergedOrder.forEach((id, idx) => stableIndex.set(id, idx));
    return [...mergedOrder].sort((a, b) => {
      const na = orderNumbers[a] ?? Number.MAX_SAFE_INTEGER;
      const nb = orderNumbers[b] ?? Number.MAX_SAFE_INTEGER;
      if (na !== nb) return na - nb;
      return (stableIndex.get(a) ?? 0) - (stableIndex.get(b) ?? 0);
    });
  }, [mergedOrder, orderNumbers]);

  const setTileNumber = useCallback((udid: string, nextNumber: number) => {
    if (!defaultDevices.includes(udid)) return;
    const normalized = Math.max(1, Math.floor(nextNumber));
    setOrderNumbers((prev) => ({ ...prev, [udid]: normalized }));
  }, [defaultDevices]);

  const moveTile = useCallback((udid: string, toIndex: number) => {
    const idx = mergedOrder.indexOf(udid);
    if (idx < 0) return;
    const clampedIndex = Math.max(0, Math.min(mergedOrder.length - 1, toIndex));
    if (idx === clampedIndex) return;
    const next = [...mergedOrder];
    next.splice(idx, 1);
    next.splice(clampedIndex, 0, udid);
    setOrder(next);
  }, [mergedOrder]);

  const removeTile = useCallback((udid: string) => {
    setOrder((prev) => (prev.includes(udid) ? prev.filter((id) => id !== udid) : prev));
    setOrderNumbers((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, udid)) return prev;
      const next = { ...prev };
      delete next[udid];
      return next;
    });
  }, []);

  const getTileNumber = useCallback(
    (udid: string, fallback: number) => orderNumbers[udid] ?? fallback,
    [orderNumbers]
  );

  return { mergedOrder: sortedOrder, moveTile, removeTile, getTileNumber, setTileNumber };
}
