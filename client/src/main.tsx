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

    // Config keys to synchronize
    const configKeysToSync = [
      'automationMacrosV1',
      'automationAppActionsV1',
      'automationDeviceProfilesV1',
      'automationSettingsV1',
      'automationQuickSlotsV1',
      'manualSyncTimeSettingsV1',
      'manualSyncMacroSettingsV1',
      'syncTimeHotkey',
      'monviewphone:sync-time-hotkey',
      'monviewphone:device-account-hotkey',
      'monviewphone:account-manager-hotkey',
      'monviewphone:overlay-header-hotkey',
      'visualAlertGlobalSettingsV1',
      'monviewphone:dav-hide-phone',
      'monviewphone:dav-hide-email',
      'monviewphone:dav-hide-qr',
      'monviewphone:dav-hide-created-at',
      'monviewphone:dav-always-show-header'
    ];

    const patch: Record<string, string> = {};
    for (const key of configKeysToSync) {
      const localVal = localStorage.getItem(key);
      const backendVal = data[key];

      // Consider backend empty if it is missing, empty, or "[]", "{}", "[null]"
      const isBackendEmpty = !backendVal || backendVal === '' || backendVal === '[]' || backendVal === '{}' || backendVal === '[null]';
      const isLocalValValid = localVal && localVal !== '' && localVal !== '[]' && localVal !== '{}' && localVal !== '[null]';

      if (isBackendEmpty && isLocalValValid) {
        // Backend is empty/default, client has data -> upload to backend
        patch[key] = localVal;
      } else if (!isBackendEmpty) {
        // Backend has valid data -> overwrite client localStorage
        localStorage.setItem(key, backendVal as string);
      }
    }

    // Populate all other non-config keys from backend
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'string' && !configKeysToSync.includes(key)) {
        localStorage.setItem(key, val);
      }
    }

    if (Object.keys(patch).length > 0) {
      console.log('[Sync] Uploading missing/valid local config keys to backend:', Object.keys(patch));
      try {
        await fetch(settingsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
      } catch (err) {
        console.error('[Sync] Failed to upload missing config keys to backend:', err);
      }
    }

    return true;
  } catch (err: any) {
    console.error('Failed to load settings from server:', err);
    return true;
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
