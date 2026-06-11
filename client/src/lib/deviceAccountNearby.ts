import type { Account, WeChatAccount } from '@/lib/deviceAccountVault';

export type NearbyAccountState = 'eligible' | 'upcoming' | 'none';

export const NEARBY_UPCOMING_DAYS = 3;
export const NEARBY_ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
export const NEARBY_UPCOMING_MS = NEARBY_UPCOMING_DAYS * 24 * 60 * 60 * 1000;

export function isAccountOverOneYear(acc: Account, now = Date.now()): boolean {
  return !!(acc.isOneYearOld || (acc.createdAt && now - acc.createdAt >= NEARBY_ONE_YEAR_MS));
}

export function getNearbyAccountState(acc: Account, now = Date.now()): NearbyAccountState {
  if (!acc) return 'none';
  if (acc.status === 'Die' || acc.status === 'Risk') return 'none';
  if (!isAccountOverOneYear(acc, now)) return 'none';

  const wc = acc as WeChatAccount;

  if (!wc.nearbyPeopleDueDate || wc.nearbyPeopleDueDate <= now) {
    return 'eligible';
  }

  const diff = wc.nearbyPeopleDueDate - now;
  if (diff > 0 && diff <= NEARBY_UPCOMING_MS) {
    return 'upcoming';
  }

  return 'none';
}

export function hasNearbyRelevantAccount(accounts: Account[], now = Date.now()): boolean {
  return accounts.some(acc => getNearbyAccountState(acc, now) !== 'none');
}

export function getNearestNearbyHours(accounts: Account[], now = Date.now()): number {
  let nearest = Number.POSITIVE_INFINITY;

  for (const acc of accounts) {
    const state = getNearbyAccountState(acc, now);
    if (state === 'none') continue;

    const wc = acc as WeChatAccount;
    const hours = wc.nearbyPeopleDueDate
      ? Math.max(0, (wc.nearbyPeopleDueDate - now) / (1000 * 60 * 60))
      : 0;

    nearest = Math.min(nearest, hours);
  }

  return nearest;
}

export function hasNearbyEligibleAccount(accounts: Account[], now = Date.now()): boolean {
  return accounts.some(acc => getNearbyAccountState(acc, now) === 'eligible');
}

