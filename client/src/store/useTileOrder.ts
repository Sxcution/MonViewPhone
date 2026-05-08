import { useEffect, useMemo, useState } from 'react';

const TILE_NUMBER_KEY = 'tileOrderNumbers';

function loadTileNumbers(): Record<string, number> {
  try {
    const raw = localStorage.getItem(TILE_NUMBER_KEY);
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
  } catch {
    return {};
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
      localStorage.setItem('tileOrder', JSON.stringify(mergedOrder));
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
      localStorage.setItem(TILE_NUMBER_KEY, JSON.stringify(orderNumbers));
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

  const setTileNumber = (udid: string, nextNumber: number) => {
    if (!defaultDevices.includes(udid)) return;
    const normalized = Math.max(1, Math.floor(nextNumber));
    setOrderNumbers((prev) => ({ ...prev, [udid]: normalized }));
  };

  const moveTile = (udid: string, toIndex: number) => {
    const idx = mergedOrder.indexOf(udid);
    if (idx < 0) return;
    const clampedIndex = Math.max(0, Math.min(mergedOrder.length - 1, toIndex));
    if (idx === clampedIndex) return;
    const next = [...mergedOrder];
    next.splice(idx, 1);
    next.splice(clampedIndex, 0, udid);
    setOrder(next);
  };

  const getTileNumber = (udid: string, fallback: number) => orderNumbers[udid] ?? fallback;

  return { mergedOrder: sortedOrder, moveTile, getTileNumber, setTileNumber };
}
