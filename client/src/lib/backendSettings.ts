import { readPageParams } from './params';
import type { VaultData } from './deviceAccountVault';

const ALLOWED_EMPTY_KEYS = [
  'syncTimeHotkey',
  'monviewphone:sync-time-hotkey',
  'monviewphone:device-account-hotkey'
];

function getSettingsUrl(): string {
  try {
    const { wsServer } = readPageParams();
    const url = new URL(wsServer);
    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    url.pathname = '/api/goog/device/settings';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch (e) {
    return 'http://localhost:11000/api/goog/device/settings';
  }
}

export async function saveBackendSetting(key: string, value: string): Promise<boolean> {
  if (!key || typeof key !== 'string') {
    console.error('[BackendSettings] Invalid key', key);
    return false;
  }
  if (value === null || value === undefined) {
    console.error(`[BackendSettings] Refusing to save key "${key}" with null/undefined value`);
    return false;
  }
  if (value === '' && !ALLOWED_EMPTY_KEYS.includes(key)) {
    console.error(`[BackendSettings] Refusing to save key "${key}" with empty string (not in allowlist)`);
    return false;
  }

  const settingsUrl = getSettingsUrl();
  try {
    const res = await fetch(settingsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP status ${res.status}: ${errText}`);
    }
    console.log(`[BackendSettings] Successfully saved key "${key}" explicitly to backend.`);
    return true;
  } catch (err) {
    console.error(`[BackendSettings] Failed to save key "${key}" explicitly to backend:`, err);
    return false;
  }
}

export async function saveBackendSettings(patch: Record<string, string>): Promise<boolean> {
  if (!patch || typeof patch !== 'object' || Object.keys(patch).length === 0) {
    console.error('[BackendSettings] Refusing to save empty patch object');
    return false;
  }

  // Check keys and values
  for (const [key, value] of Object.entries(patch)) {
    if (!key) {
      console.error('[BackendSettings] Empty key in patch');
      return false;
    }
    if (value === null || value === undefined) {
      console.error(`[BackendSettings] Refusing to save key "${key}" with null/undefined value in patch`);
      return false;
    }
    if (value === '' && !ALLOWED_EMPTY_KEYS.includes(key)) {
      console.error(`[BackendSettings] Refusing to save key "${key}" with empty string in patch`);
      return false;
    }
  }

  const settingsUrl = getSettingsUrl();
  try {
    const res = await fetch(settingsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP status ${res.status}: ${errText}`);
    }
    console.log('[BackendSettings] Successfully saved patch explicitly to backend.', Object.keys(patch));
    return true;
  } catch (err) {
    console.error('[BackendSettings] Failed to save patch explicitly to backend:', err);
    return false;
  }
}

export function validateVaultData(vault: VaultData) {
  if (!vault || typeof vault !== 'object' || !vault.devices || typeof vault.devices !== 'object') {
    return { valid: false, deviceCount: 0, wechatAccountCount: 0, totalAccountCount: 0, hasEmmaZhao: false };
  }

  let deviceCount = 0;
  let wechatAccountCount = 0;
  let totalAccountCount = 0;
  let hasEmmaZhao = false;

  for (const udid of Object.keys(vault.devices)) {
    deviceCount++;
    const dev = vault.devices[udid];
    if (dev && dev.platforms && typeof dev.platforms === 'object') {
      for (const platform of Object.keys(dev.platforms)) {
        const accounts = dev.platforms[platform];
        if (Array.isArray(accounts)) {
          totalAccountCount += accounts.length;
          if (platform === 'wechat') {
            wechatAccountCount += accounts.length;
          }
          for (const acc of accounts) {
            if (acc && acc.name && acc.name.includes('Emma Zhao')) {
              hasEmmaZhao = true;
            }
          }
        }
      }
    }
  }

  const valid = deviceCount >= 35 && wechatAccountCount >= 104 && hasEmmaZhao;
  return { valid, deviceCount, wechatAccountCount, totalAccountCount, hasEmmaZhao };
}

export async function saveDeviceAccountVaultToBackend(vault: VaultData): Promise<void> {
  const result = validateVaultData(vault);
  if (!result.valid) {
    console.error(
      `[Vault Client Guard] Refusing to POST vault: safety thresholds not met. Devices: ${result.deviceCount}/35, WeChat accounts: ${result.wechatAccountCount}/104, Emma Zhao: ${result.hasEmmaZhao ? 'Yes' : 'No'}`
    );
    return;
  }

  const { wsServer } = readPageParams();
  let urlStr = 'http://localhost:11000/api/goog/device/account-vault';
  try {
    const url = new URL(wsServer);
    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    url.pathname = '/api/goog/device/account-vault';
    url.search = '';
    url.hash = '';
    urlStr = url.toString();
  } catch(e) {}

  try {
    const res = await fetch(urlStr, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vault: vault })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP status ${res.status}: ${errText}`);
    }
    console.log('[Vault Client Guard] Successfully saved vault explicitly to backend.');
  } catch (err) {
    console.error('[Vault Client Guard] Failed to save vault explicitly to backend:', err);
  }
}

export async function saveTileOrderToBackend(value: string): Promise<boolean> {
  try {
    const list = JSON.parse(value);
    if (!Array.isArray(list)) {
      console.error('[BackendSettings] tileOrder is not an array:', value);
      return false;
    }
    if (list.length < 35) {
      console.error(`[BackendSettings] Refusing to save tileOrder: length ${list.length} < 35`);
      return false;
    }
    return await saveBackendSetting('tileOrder', value);
  } catch (e) {
    console.error('[BackendSettings] Failed to parse tileOrder JSON:', e);
    return false;
  }
}

export async function saveTileOrderNumbersToBackend(value: string): Promise<boolean> {
  try {
    const obj = JSON.parse(value);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      console.error('[BackendSettings] tileOrderNumbers is not an object:', value);
      return false;
    }
    if (Object.keys(obj).length < 35) {
      console.error(`[BackendSettings] Refusing to save tileOrderNumbers: keys length ${Object.keys(obj).length} < 35`);
      return false;
    }
    
    // Call the new dedicated device order API
    const { wsServer } = readPageParams();
    const url = new URL(wsServer);
    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    url.pathname = '/api/goog/device/order';
    url.search = '';
    url.hash = '';

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumbers: obj })
    });

    if (!res.ok) {
      throw new Error(`HTTP status ${res.status}`);
    }
    
    return true;
  } catch (e) {
    console.error('[BackendSettings] Failed to parse tileOrderNumbers JSON or save order:', e);
    return false;
  }
}

export async function saveAutomationSettingToBackend(key: string, value: string): Promise<boolean> {
  const allowed = [
    'automationMacrosV1',
    'automationAppActionsV1',
    'automationDeviceProfilesV1',
    'automationSettingsV1',
    'automationQuickSlotsV1'
  ];
  if (!allowed.includes(key)) {
    console.error(`[BackendSettings] Key "${key}" is not an allowed automation setting`);
    return false;
  }
  return await saveBackendSetting(key, value);
}

export async function saveVisualAlertSettingToBackend(key: string, value: string): Promise<boolean> {
  if (key !== 'visualAlertGlobalSettingsV1') {
    console.error(`[BackendSettings] Key "${key}" is not visualAlertGlobalSettingsV1`);
    return false;
  }
  return await saveBackendSetting(key, value);
}

export async function saveSyncTimeSettingToBackend(key: string, value: string): Promise<boolean> {
  const allowed = [
    'manualSyncTimeSettingsV1',
    'manualSyncMacroSettingsV1',
    'syncTimeHotkey',
    'monviewphone:sync-time-hotkey'
  ];
  if (!allowed.includes(key)) {
    console.error(`[BackendSettings] Key "${key}" is not an allowed sync time setting`);
    return false;
  }
  return await saveBackendSetting(key, value);
}

export async function saveHotkeySettingToBackend(key: string, value: string): Promise<boolean> {
  const allowed = [
    'monviewphone:device-account-hotkey',
    'monviewphone:sync-time-hotkey',
    'syncTimeHotkey'
  ];
  if (!allowed.includes(key)) {
    console.error(`[BackendSettings] Key "${key}" is not an allowed hotkey setting`);
    return false;
  }
  return await saveBackendSetting(key, value);
}
