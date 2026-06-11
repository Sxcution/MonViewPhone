import { readPageParams } from './params';
import { VaultData } from './deviceAccountVault';

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

  const settingsUrl = getSettingsUrl();
  const rawVault = JSON.stringify(vault);

  try {
    const res = await fetch(settingsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'monviewphone:device-account-vault': rawVault })
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
