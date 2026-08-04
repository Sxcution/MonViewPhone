import { saveDeviceAccountVaultToBackend } from './backendSettings';

export type AccountStatus = 'Live' | 'Die' | 'Verify' | 'Risk' | 'Unverified';
export type PhoneRegion = 'VN' | 'HK' | 'Unknown';
export type PlatformType = string;

export function getSavedPlatforms(): { id: string; label: string }[] {
  try {
    const saved = localStorage.getItem('monviewphone:device-account-platforms');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const REMOVED = new Set(['tantan', 'line', 'telegram', 'other', 'khác']);
        return parsed.map((p: any) => {
          if (typeof p === 'string') {
            return { id: p, label: p === 'wechat' ? 'WeChat' : p };
          }
          if (p && p.id) {
            return { id: p.id, label: p.label || p.id };
          }
          return p;
        }).filter(p => p && !REMOVED.has(p.id.toLowerCase()));
      }
    }
  } catch {}
  return [{ id: 'wechat', label: 'WeChat' }];
}

export function saveSavedPlatforms(platforms: { id: string; label: string }[]): void {
  try {
    localStorage.setItem('monviewphone:device-account-platforms', JSON.stringify(platforms));
  } catch (err) {
    console.error('Failed to save platforms:', err);
  }
}

export interface AccountNotice {
  title: string;
  content: string;
  dueDate: number | null; // Timestamp
  days?: number;
  startDate?: number | null;
}

export type AccountHistoryAction = 'Live' | 'Die' | 'Risk' | 'Open Nearby' | 'Open Nearby People' | 'Risk Nearby' | 'Login';

export interface AccountHistoryEntry {
  id: string;
  action: AccountHistoryAction;
  timestamp: number;
}

export interface WechatLaunchProfile {
  userId: number;
  name: string;
  appType: 'main' | 'shelter' | 'clone' | 'secure' | 'unknown';
  packageName: 'com.tencent.mm';
  activityName: 'com.tencent.mm.ui.LauncherUI';
  assignedAt: number;
}

export interface BaseAccount {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  email: string;
  note: string;
  status: AccountStatus;
  notice: AccountNotice | null;
  history?: AccountHistoryEntry[];
  appType?: 'main' | 'clone' | 'secure' | 'shelter' | 'unknown';
  dieAt?: number | null;
  wechatLaunchProfile?: WechatLaunchProfile;
}

export interface WeChatAccount extends BaseAccount {
  createdAt: number | null; // Timestamp
  isOneYearOld?: boolean; // Computed or manually overridden
  isNew?: boolean; // Computed or manually overridden
  verifyStatus: 'Verified' | 'Unverified' | 'Unknown';
  phoneRegion: PhoneRegion;
  scanCount: number;
  lastScanDate: number | null; // Timestamp
  nearbyPeopleEnabled: boolean;
  nearbyPeopleDueDate: number | null; // Timestamp
}

// We use an intersection type for flexibility, but strictly platforms other than WeChat just use BaseAccount fields
export type Account = BaseAccount & Partial<WeChatAccount>;

export type WechatNewStatus = 'New' | 'New 1' | 'New 2';

const WECHAT_NEW_ACCOUNT_MS = 30 * 24 * 60 * 60 * 1000;
const WECHAT_NEW_1_ACCOUNT_MS = 60 * 24 * 60 * 60 * 1000;
const WECHAT_NEW_2_ACCOUNT_MS = 90 * 24 * 60 * 60 * 1000;

export function getWechatNewStatus(account: Account, now = Date.now()): WechatNewStatus | null {
  if (typeof account.createdAt !== 'number' || !Number.isFinite(account.createdAt)) {
    return account.isNew ? 'New' : null;
  }

  const ageMs = now - account.createdAt;
  if (ageMs < WECHAT_NEW_ACCOUNT_MS) return 'New';
  if (ageMs < WECHAT_NEW_1_ACCOUNT_MS) return 'New 1';
  if (ageMs < WECHAT_NEW_2_ACCOUNT_MS) return 'New 2';
  return null;
}

export function getNextWechatNewStatusChangeAt(account: Account, now = Date.now()): number | null {
  if (typeof account.createdAt !== 'number' || !Number.isFinite(account.createdAt)) return null;
  for (const ageMs of [WECHAT_NEW_ACCOUNT_MS, WECHAT_NEW_1_ACCOUNT_MS, WECHAT_NEW_2_ACCOUNT_MS]) {
    const changeAt = account.createdAt + ageMs;
    if (changeAt > now) return changeAt;
  }
  return null;
}

export interface DeviceAccountData {
  udid: string;
  displayName: string;
  defaultPlatform: PlatformType;
  selectedAccountByPlatform: Partial<Record<PlatformType, string>>;
  platforms: Record<PlatformType, Account[]>;
  updatedAt: number;
}

export interface VaultData {
  version: number;
  devices: Record<string, DeviceAccountData>;
}

const STORAGE_KEY = 'monviewphone:device-account-vault';

export function expireDueRiskAccounts(vault: VaultData, now = Date.now()) {
  const changedUdids: string[] = [];
  let nextDueDate: number | null = null;

  for (const [udid, device] of Object.entries(vault.devices || {})) {
    let changed = false;
    for (const accounts of Object.values(device.platforms || {})) {
      for (const account of accounts) {
        const notice = account.notice;
        if (account.status !== 'Risk' || typeof notice?.dueDate !== 'number') continue;

        if (notice.dueDate > now) {
          nextDueDate = nextDueDate === null
            ? notice.dueDate
            : Math.min(nextDueDate, notice.dueDate);
          continue;
        }

        account.status = 'Live';
        account.history = [
          ...(Array.isArray(account.history) ? account.history : []),
          {
            id: `risk_due_${account.id}_${now}`,
            action: 'Live',
            timestamp: now,
          },
        ];
        changed = true;
      }
    }
    if (changed) {
      device.updatedAt = now;
      changedUdids.push(udid);
    }
  }

  return { changedUdids, nextDueDate };
}

export function loadDeviceAccountVault(): VaultData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as VaultData;
      // Provide defaults for newly added fields if migrating from older versions
      if (!data.devices) data.devices = {};
      return data;
    }
  } catch (err) {
    console.error('Failed to load device account vault:', err);
  }
  return { version: 1, devices: {} };
}

export function saveDeviceAccountVault(data: VaultData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    saveDeviceAccountVaultToBackend(data);
  } catch (err) {
    console.error('Failed to save device account vault:', err);
  }
}

export async function saveDeviceAccountVaultAsync(data: VaultData): Promise<boolean> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return await saveDeviceAccountVaultToBackend(data);
  } catch (err) {
    console.error('Failed to save device account vault async:', err);
    return false;
  }
}

export function getDeviceAccountDataFromVault(vault: VaultData, udid: string): DeviceAccountData {
  const platformsList = getSavedPlatforms();
  if (vault && vault.devices && vault.devices[udid]) {
    const device = vault.devices[udid];
    if (!device.platforms) device.platforms = {};
    platformsList.forEach(p => {
      if (!device.platforms[p.id]) {
        device.platforms[p.id] = [];
      }
    });
    if (!device.selectedAccountByPlatform) device.selectedAccountByPlatform = {};
    return device;
  }

  const initialPlatforms: Record<string, Account[]> = {};
  platformsList.forEach(p => {
    initialPlatforms[p.id] = [];
  });

  return {
    udid,
    displayName: '',
    defaultPlatform: 'wechat',
    selectedAccountByPlatform: {},
    platforms: initialPlatforms,
    updatedAt: Date.now(),
  };
}

export function getDeviceAccountData(udid: string): DeviceAccountData {
  const vault = loadDeviceAccountVault();
  return getDeviceAccountDataFromVault(vault, udid);
}

export function saveDeviceAccountData(udid: string, data: DeviceAccountData): void {
  const vault = loadDeviceAccountVault();
  data.updatedAt = Date.now();
  vault.devices[udid] = data;
  saveDeviceAccountVault(vault);
}

export async function saveDeviceAccountDataAsync(udid: string, data: DeviceAccountData): Promise<boolean> {
  const vault = loadDeviceAccountVault();
  data.updatedAt = Date.now();
  vault.devices[udid] = data;
  return await saveDeviceAccountVaultAsync(vault);
}

export function generateAccountId(): string {
  return Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

export function createNewAccount(isWeChat: boolean): Account {
  const base: BaseAccount = {
    id: generateAccountId(),
    name: '',
    nickname: '',
    phone: '',
    email: '',
    note: '',
    status: 'Live',
    notice: null,
    history: [],
    dieAt: null,
  };
  
  if (isWeChat) {
    return {
      ...base,
      createdAt: Date.now(),
      verifyStatus: 'Unknown',
      phoneRegion: 'Unknown',
      scanCount: 0,
      lastScanDate: null,
      nearbyPeopleEnabled: false,
      nearbyPeopleDueDate: null,
    } as WeChatAccount;
  }
  
  return base;
}
