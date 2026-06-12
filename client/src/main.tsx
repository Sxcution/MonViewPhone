import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { ActiveProvider } from '@/context/ActiveContext';
import { ServerProvider } from '@/context/ServerContext';
import { readHashAction, readPageParams } from '@/lib/params';
import { ShellPage } from '@/pages/ShellPage';
import { FileListingPage } from '@/pages/FileListingPage';
import { I18nProvider } from '@/context/I18nContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Fix mobile rotation / address-bar resize issues by mapping the *visual* viewport height
// to a CSS variable. Some browsers keep `100vh` stale after orientation changes.
function installViewportHeightVar() {
  const setVh = () => {
    const h = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
  };

  setVh();

  window.addEventListener('resize', setVh, { passive: true } as any);
  window.addEventListener('orientationchange', setVh, { passive: true } as any);
  window.visualViewport?.addEventListener('resize', setVh, { passive: true } as any);
  // iOS Safari sometimes only updates visualViewport during scroll after rotation.
  window.visualViewport?.addEventListener('scroll', setVh, { passive: true } as any);
}

installViewportHeightVar();

function getSettingsUrl(wsServer: string): string {
  try {
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

function validateVaultData(vault: any) {
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

function validateBackendSettings(settings: any) {
  if (!settings || typeof settings !== 'object') {
    return { valid: false, reason: 'Settings is not an object' };
  }

  const vaultStr = settings['monviewphone:device-account-vault'];
  if (!vaultStr) {
    return { valid: false, reason: 'Missing vault key (monviewphone:device-account-vault)' };
  }

  let vault;
  try {
    vault = JSON.parse(vaultStr);
  } catch (e: any) {
    return { valid: false, reason: `Vault is not valid JSON: ${e.message}` };
  }

  const vaultResult = validateVaultData(vault);
  if (!vaultResult.valid) {
    return {
      valid: false,
      reason: `Vault verification failed. Devices: ${vaultResult.deviceCount}/35, WeChat accounts: ${vaultResult.wechatAccountCount}/104, Emma Zhao: ${vaultResult.hasEmmaZhao ? 'Yes' : 'No'}`
    };
  }

  const tileOrderStr = settings['tileOrder'];
  if (!tileOrderStr) {
    if (!vaultResult.valid) {
      return { valid: false, reason: 'Missing tileOrder key' };
    }
    console.warn('Missing tileOrder key, but vault is healthy. Proceeding...');
  } else {
    let tileOrder;
    try {
      tileOrder = JSON.parse(tileOrderStr);
      if (!Array.isArray(tileOrder) || tileOrder.length < 35) {
        if (!vaultResult.valid) {
          return { valid: false, reason: `tileOrder length is ${tileOrder ? tileOrder.length : 0} (expected >= 35)` };
        }
        console.warn(`tileOrder length is ${tileOrder ? tileOrder.length : 0} (expected >= 35), but vault is healthy. Proceeding...`);
      }
    } catch (e: any) {
      if (!vaultResult.valid) {
        return { valid: false, reason: `tileOrder is not valid JSON: ${e.message}` };
      }
      console.warn(`tileOrder is not valid JSON: ${e.message}, but vault is healthy. Proceeding...`);
    }
  }

  const tileOrderNumbersStr = settings['tileOrderNumbers'];
  if (!tileOrderNumbersStr) {
    if (!vaultResult.valid) {
      return { valid: false, reason: 'Missing tileOrderNumbers key' };
    }
    console.warn('Missing tileOrderNumbers key, but vault is healthy. Proceeding...');
  } else {
    let tileOrderNumbers;
    try {
      tileOrderNumbers = JSON.parse(tileOrderNumbersStr);
      if (!tileOrderNumbers || typeof tileOrderNumbers !== 'object' || Object.keys(tileOrderNumbers).length < 35) {
        if (!vaultResult.valid) {
          return { valid: false, reason: `tileOrderNumbers keys length is ${tileOrderNumbers ? Object.keys(tileOrderNumbers).length : 0} (expected >= 35)` };
        }
        console.warn(`tileOrderNumbers keys length is ${tileOrderNumbers ? Object.keys(tileOrderNumbers).length : 0} (expected >= 35), but vault is healthy. Proceeding...`);
      }
    } catch (e: any) {
      if (!vaultResult.valid) {
        return { valid: false, reason: `tileOrderNumbers is not valid JSON: ${e.message}` };
      }
      console.warn(`tileOrderNumbers is not valid JSON: ${e.message}, but vault is healthy. Proceeding...`);
    }
  }

  return { valid: true };
}

function showErrorScreen(msg: string) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background: #111; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; box-sizing: border-box;">
        <div style="background: rgba(220, 38, 38, 0.1); border: 1px solid #dc2626; border-radius: 8px; max-width: 600px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <h2 style="color: #dc2626; margin-top: 0; font-size: 22px;">⚠️ CẢNH BÁO AN TOÀN DỮ LIỆU</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #eee; margin-bottom: 20px;">
            ${msg}
          </p>
          <p style="font-size: 14px; color: #888; margin-bottom: 0;">
            Vui lòng kiểm tra lại server-go/settings.json hoặc khôi phục từ bản backup mới nhất để tránh mất dữ liệu.
          </p>
        </div>
      </div>
    `;
  }
}

async function syncSettingsWithBackend(): Promise<boolean> {
  const { wsServer } = readPageParams();
  const settingsUrl = getSettingsUrl(wsServer);

  // 1. Fetch settings from backend
  try {
    const res = await fetch(settingsUrl);
    if (!res.ok) {
      throw new Error(`HTTP status ${res.status}`);
    }
    const data = await res.json();
    if (!data || typeof data !== 'object') {
      throw new Error('Backend settings is not an object');
    }

    // Run safety checks on backend settings
    const checkResult = validateBackendSettings(data);
    if (!checkResult.valid) {
      showErrorScreen(`DỮ LIỆU BACKEND KHÔNG AN TOÀN: ${checkResult.reason}`);
      return false;
    }

    // Parse backend vault to get counts
    const backendVaultStr = data['monviewphone:device-account-vault'];
    let backendWechatCount = 0;
    try {
      const backendVault = JSON.parse(backendVaultStr);
      backendWechatCount = validateVaultData(backendVault).wechatAccountCount;
    } catch(e){}

    // Compare with local vault
    const localVaultStr = localStorage.getItem('monviewphone:device-account-vault');
    let localWechatCount = 0;
    if (localVaultStr) {
      try {
        const localVault = JSON.parse(localVaultStr);
        localWechatCount = validateVaultData(localVault).wechatAccountCount;
      } catch(e){}
    }

    // Populate localStorage with backend keys
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'string') {
        localStorage.setItem(key, val);
      }
    }

    return true;
  } catch (err: any) {
    console.error('Failed to load settings from server:', err);
    showErrorScreen(`Không thể tải cấu hình từ Backend: ${err.message || err}`);
    return false;
  }
}

async function startApp() {
  const ok = await syncSettingsWithBackend();
  if (!ok) {
    return;
  }

  // Serve static docs without mounting SPA
  if (window.location.pathname.startsWith('/docs')) {
    window.location.replace('/docs/index.html');
  } else {
    const { wsServer } = readPageParams();
    const hashAction = readHashAction();

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <ErrorBoundary>
        <I18nProvider>
          {hashAction.action === 'shell' ? (
            <ShellPage wsServer={wsServer} udid={hashAction.params.get('udid') || ''} />
          ) : hashAction.action === 'list-files' ? (
            <FileListingPage
              wsServer={wsServer}
              udid={hashAction.params.get('udid') || ''}
              initialPath={hashAction.params.get('path') || '/'}
            />
          ) : (
            <ActiveProvider>
              <ServerProvider wsServer={wsServer}>
                <App />
              </ServerProvider>
            </ActiveProvider>
          )}
        </I18nProvider>
      </ErrorBoundary>,
    );
  }
}

startApp();
