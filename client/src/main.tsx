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

async function syncSettingsWithBackend() {
  const { wsServer } = readPageParams();
  const settingsUrl = getSettingsUrl(wsServer);
  let isSyncingFromServer = false;

  const pushChangesToServer = async () => {
    try {
      const payload: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key);
          if (val !== null) {
            payload[key] = val;
          }
        }
      }
      
      await fetch(settingsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to save settings to server:', err);
    }
  };

  // 1. Fetch settings from backend (Server is the absolute source of truth)
  try {
    isSyncingFromServer = true;
    const res = await fetch(settingsUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        // ALWAYS overwrite client localStorage with whatever the server has.
        // No bidirectional sync or fallback checks.
        localStorage.clear();
        for (const [key, val] of Object.entries(data)) {
          if (typeof val === 'string') {
            localStorage.setItem(key, val);
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to load settings from server:', err);
  } finally {
    isSyncingFromServer = false;
  }

  // 2. Intercept localStorage methods to auto-save to server
  const originalSetItem = localStorage.setItem;
  let saveTimeout: any = null;

  localStorage.setItem = function(key, value) {
    originalSetItem.call(localStorage, key, value);
    if (isSyncingFromServer) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(pushChangesToServer, 1000);
  };
  
  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function(key) {
    originalRemoveItem.call(localStorage, key);
    if (isSyncingFromServer) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(pushChangesToServer, 1000);
  };
  
  const originalClear = localStorage.clear;
  localStorage.clear = function() {
    originalClear.call(localStorage);
    if (isSyncingFromServer) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(pushChangesToServer, 1000);
  };
}

async function startApp() {
  await syncSettingsWithBackend();

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
