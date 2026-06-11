import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const dashboardDbPath = path.resolve(repoRoot, '..', 'Mon Dashboard', 'data', 'Data.db');
const monViewDataDir = path.resolve(repoRoot, 'server-go', 'data');
const monViewDbPath = path.join(monViewDataDir, 'Data.db');
const settingsPath = path.resolve(repoRoot, 'server-go', 'settings.json');

const PLATFORM_KEYS = ['wechat', 'line', 'tantan', 'telegram', 'other'];

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseDateToMs(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function createdAtFromWeChatParts(row) {
  const year = Number(row.wechat_created_year);
  if (!Number.isFinite(year) || year <= 0) return null;
  const month = Number(row.wechat_created_month) || 1;
  const day = Number(row.wechat_created_day) || 1;
  return new Date(year, month - 1, day).getTime();
}

function mapStatus(row) {
  const status = String(row.status || '').toLowerCase();
  const wechatStatus = String(row.wechat_status || '').toLowerCase();
  if (status === 'disabled' || status === 'die' || row.disabled_date || row.die_date) return 'Die';
  if (wechatStatus === 'unverified') return 'Unverified';
  if (wechatStatus === 'risk' || status === 'risk') return 'Risk';
  if (wechatStatus === 'verify' || status === 'verify') return 'Verify';
  return 'Live';
}

function mapVerifyStatus(row) {
  const wechatStatus = String(row.wechat_status || '').toLowerCase();
  if (wechatStatus === 'unverified') return 'Unverified';
  if (wechatStatus === 'active' || wechatStatus === 'available') return 'Verified';
  return 'Unknown';
}

function mapPhoneRegion(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (clean.startsWith('852')) return 'HK';
  if (clean.startsWith('84') || clean.startsWith('0')) return 'VN';
  return 'Unknown';
}

function mapContainerType(type) {
  const normalized = String(type || '').toLowerCase();
  if (normalized === 'clone_app' || normalized === 'clone') return 'clone';
  if (normalized === 'security_folder' || normalized === 'secure') return 'secure';
  if (normalized === 'shelter') return 'shelter';
  return 'main';
}

function mapNotice(rawNotice) {
  const notice = parseJson(rawNotice, null);
  if (!notice || notice.enabled === false) return null;
  const dueDate = parseDateToMs(notice.due_date || notice.dueDate);
  const startDate = parseDateToMs(notice.start_at || notice.startDate);
  return {
    title: String(notice.title || 'Thông báo'),
    content: String(notice.note || notice.content || notice.title || ''),
    days: Number.isFinite(Number(notice.days)) ? Number(notice.days) : undefined,
    startDate,
    dueDate,
  };
}

function ensureDevice(vault, udid) {
  if (!vault.devices[udid]) {
    vault.devices[udid] = {
      udid,
      displayName: '',
      defaultPlatform: 'wechat',
      selectedAccountByPlatform: {},
      platforms: Object.fromEntries(PLATFORM_KEYS.map((key) => [key, []])),
      updatedAt: Date.now(),
    };
  }

  const device = vault.devices[udid];
  device.defaultPlatform = device.defaultPlatform || 'wechat';
  device.selectedAccountByPlatform = device.selectedAccountByPlatform || {};
  device.platforms = device.platforms || {};
  for (const key of PLATFORM_KEYS) {
    if (!Array.isArray(device.platforms[key])) device.platforms[key] = [];
  }
  return device;
}

function dashboardRowToAccount(row) {
  const importedId = `dashboard-wechat-${row.id}`;
  const createdAt = createdAtFromWeChatParts(row);
  const nearbyPeopleDueDate = parseDateToMs(row.nearby_people_until);
  return {
    id: importedId,
    name: String(row.username || row.account_name || ''),
    nickname: String(row.wechat_nickname || ''),
    phone: String(row.phone || ''),
    email: String(row.email || ''),
    note: String(row.notes || ''),
    status: mapStatus(row),
    notice: mapNotice(row.notice),
    appType: mapContainerType(row.container_type),
    createdAt,
    verifyStatus: mapVerifyStatus(row),
    phoneRegion: mapPhoneRegion(row.phone),
    scanCount: Number(row.wechat_scan_count || 0),
    lastScanDate: parseDateToMs(row.wechat_last_scan_date),
    nearbyPeopleEnabled: nearbyPeopleDueDate ? nearbyPeopleDueDate > Date.now() : false,
    nearbyPeopleDueDate,
    importedFrom: 'Mon Dashboard',
    dashboardAccountId: Number(row.id),
    dashboardCardName: String(row.card_name || ''),
    dashboardCardId: Number(row.card_id),
  };
}

function getOrderToUdid(settings) {
  const orderBackup = parseJson(settings.tileOrderNumbersBackupV1, {});
  const orderNumbers = orderBackup.orderNumbers || orderBackup;
  const entries = Object.entries(orderNumbers)
    .map(([udid, order]) => [Number(order), udid])
    .filter(([order, udid]) => Number.isFinite(order) && order > 0 && typeof udid === 'string')
    .sort((a, b) => a[0] - b[0]);
  return new Map(entries);
}

function initMonViewDb(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS devices (
      udid TEXT PRIMARY KEY,
      device_order INTEGER,
      display_name TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      udid TEXT NOT NULL,
      platform TEXT NOT NULL,
      name TEXT,
      nickname TEXT,
      phone TEXT,
      email TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'Live',
      app_type TEXT,
      notice_json TEXT,
      created_at_ms INTEGER,
      verify_status TEXT,
      phone_region TEXT,
      scan_count INTEGER NOT NULL DEFAULT 0,
      last_scan_date_ms INTEGER,
      nearby_people_enabled INTEGER NOT NULL DEFAULT 0,
      nearby_people_due_date_ms INTEGER,
      source TEXT,
      source_account_id TEXT,
      source_card_name TEXT,
      source_card_id TEXT,
      imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (udid) REFERENCES devices(udid) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_accounts_udid_platform ON accounts(udid, platform);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_source ON accounts(source, source_account_id);
  `);
}

function insertImportedAccount(db, udid, deviceOrder, account) {
  db.prepare(`
    INSERT INTO devices (udid, device_order, display_name)
    VALUES (?, ?, ?)
    ON CONFLICT(udid) DO UPDATE SET device_order = excluded.device_order, updated_at = CURRENT_TIMESTAMP
  `).run(udid, deviceOrder, `P${deviceOrder}`);

  db.prepare(`
    INSERT INTO accounts (
      id, udid, platform, name, nickname, phone, email, note, status, app_type,
      notice_json, created_at_ms, verify_status, phone_region, scan_count,
      last_scan_date_ms, nearby_people_enabled, nearby_people_due_date_ms,
      source, source_account_id, source_card_name, source_card_id
    ) VALUES (?, ?, 'wechat', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    account.id,
    udid,
    account.name,
    account.nickname,
    account.phone,
    account.email,
    account.note,
    account.status,
    account.appType,
    account.notice ? JSON.stringify(account.notice) : null,
    account.createdAt,
    account.verifyStatus,
    account.phoneRegion,
    account.scanCount,
    account.lastScanDate,
    account.nearbyPeopleEnabled ? 1 : 0,
    account.nearbyPeopleDueDate,
    account.importedFrom,
    String(account.dashboardAccountId),
    account.dashboardCardName,
    String(account.dashboardCardId),
  );
}

function main() {
  if (!fs.existsSync(dashboardDbPath)) {
    throw new Error(`Dashboard DB not found: ${dashboardDbPath}`);
  }
  if (!fs.existsSync(settingsPath)) {
    throw new Error(`MonViewPhone settings not found: ${settingsPath}`);
  }

  const settings = parseJson(fs.readFileSync(settingsPath, 'utf8'), {});
  const backupPath = `${settingsPath}.bak_${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  fs.copyFileSync(settingsPath, backupPath);

  fs.mkdirSync(monViewDataDir, { recursive: true });

  const orderToUdid = getOrderToUdid(settings);
  const dashboard = new DatabaseSync(dashboardDbPath, { readOnly: true });
  const monview = new DatabaseSync(monViewDbPath);

  initMonViewDb(monview);
  monview.exec('BEGIN IMMEDIATE');
  try {
    monview.exec("DELETE FROM accounts WHERE platform = 'wechat'");
    monview.exec('DELETE FROM devices');

    const rows = dashboard.prepare(`
      SELECT a.*, c.card_name, c.platform, c.group_id
      FROM mxh_accounts a
      JOIN mxh_cards c ON a.card_id = c.id
      WHERE lower(c.platform) = 'wechat'
      ORDER BY CAST(c.card_name AS INTEGER), c.card_name, a.is_primary DESC, a.id ASC
    `).all();

    const vault = { version: 1, devices: {} };
    const imported = [];
    const skipped = [];

    for (const row of rows) {
      const deviceOrder = Number.parseInt(String(row.card_name || ''), 10);
      const udid = orderToUdid.get(deviceOrder);
      if (!udid) {
        skipped.push({ dashboardAccountId: row.id, cardName: row.card_name, reason: 'missing target device order' });
        continue;
      }

      const account = dashboardRowToAccount(row);
      insertImportedAccount(monview, udid, deviceOrder, account);

      const device = ensureDevice(vault, udid);
      device.displayName = `P${deviceOrder}`;
      device.defaultPlatform = 'wechat';
      device.platforms.wechat.push(account);
      if (!device.selectedAccountByPlatform.wechat || row.is_primary) {
        device.selectedAccountByPlatform.wechat = account.id;
      }
      device.updatedAt = Date.now();
      imported.push({ udid, deviceOrder, dashboardAccountId: row.id, cardName: row.card_name });
    }

    monview.exec('COMMIT');

    settings['monviewphone:device-account-vault'] = JSON.stringify(vault);
    settings['monviewphone:device-account-db'] = path.relative(path.resolve(repoRoot, 'server-go'), monViewDbPath).replaceAll(path.sep, '/');
    settings['monviewphone:device-account-imported-at'] = new Date().toISOString();
    settings['monviewphone:device-account-import-source'] = dashboardDbPath;
    fs.writeFileSync(settingsPath, JSON.stringify(settings), 'utf8');

    const byDevice = new Map();
    for (const item of imported) byDevice.set(item.deviceOrder, (byDevice.get(item.deviceOrder) || 0) + 1);
    console.log(JSON.stringify({
      ok: true,
      dashboardDbPath,
      monViewDbPath,
      settingsBackup: backupPath,
      dashboardRows: rows.length,
      importedAccounts: imported.length,
      importedDevices: byDevice.size,
      skipped,
      importedByDeviceOrder: Object.fromEntries([...byDevice.entries()].sort((a, b) => a[0] - b[0])),
    }, null, 2));
  } catch (err) {
    try {
      monview.exec('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    throw err;
  } finally {
    dashboard.close();
    monview.close();
  }
}

main();
