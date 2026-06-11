export type AccountStatus = 'Live' | 'Die' | 'Verify' | 'Risk' | 'Unverified';
export type PhoneRegion = 'VN' | 'HK' | 'Unknown';
export type PlatformType = 'wechat' | 'line' | 'tantan' | 'telegram' | 'other';

export interface AccountNotice {
  title: string;
  content: string;
  dueDate: number | null; // Timestamp
  days?: number;
  startDate?: number | null;
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
  appType?: 'main' | 'clone' | 'secure' | 'shelter';
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
  } catch (err) {
    console.error('Failed to save device account vault:', err);
  }
}

export function getDeviceAccountData(udid: string): DeviceAccountData {
  const vault = loadDeviceAccountVault();
  if (vault.devices[udid]) {
    // Ensure all platform keys exist
    const device = vault.devices[udid];
    if (!device.platforms) device.platforms = { wechat: [], line: [], tantan: [], telegram: [], other: [] };
    if (!device.platforms.wechat) device.platforms.wechat = [];
    if (!device.platforms.line) device.platforms.line = [];
    if (!device.platforms.tantan) device.platforms.tantan = [];
    if (!device.platforms.telegram) device.platforms.telegram = [];
    if (!device.platforms.other) device.platforms.other = [];
    if (!device.selectedAccountByPlatform) device.selectedAccountByPlatform = {};
    return device;
  }
  return {
    udid,
    displayName: '',
    defaultPlatform: 'wechat',
    selectedAccountByPlatform: {},
    platforms: {
      wechat: [],
      line: [],
      tantan: [],
      telegram: [],
      other: [],
    },
    updatedAt: Date.now(),
  };
}

export function saveDeviceAccountData(udid: string, data: DeviceAccountData): void {
  const vault = loadDeviceAccountVault();
  data.updatedAt = Date.now();
  vault.devices[udid] = data;
  saveDeviceAccountVault(vault);
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
  };
  
  if (isWeChat) {
    return {
      ...base,
      createdAt: null,
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
