import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const assert = (ok, message) => { if (!ok) throw new Error(message) }
const cssFiles = ['src/styles.css', 'src/components/ViewerAppsMenu.css']
const files = {
  css: cssFiles.map(read).join('\n'),
  app: read('src/App.tsx'),
  settings: read('src/components/AppSettingsModal.tsx'),
  menu: read('src/components/DeviceContextMenu.tsx'),
  apps: read('src/components/ViewerAppsMenu.tsx'),
  adb: read('src/components/ViewerAdbTools.tsx'),
  automation: read('src/components/AutomationModal.tsx'),
  automationPanel: read('src/components/AutomationPanel.tsx'),
  automationOverlays: read('src/components/AutomationModalOverlays.tsx'),
  stream: read('src/components/StreamSettingsPanel.tsx'),
  viewerSide: read('src/components/ViewerSidePanel.tsx'),
  visualAlert: read('src/components/VisualAlertPanel.tsx'),
  themeUi: read('src/components/ThemeInspector.tsx'),
  account: read('src/components/DeviceAccountPanel.tsx'),
  overlay: read('src/components/DeviceAccountOverlay.tsx'),
  inspector: read('src/lib/themeInspector.ts'),
}

for (const value of ['--md-primary:', '--md-danger:', '--md-control-height:', '--md-layer-menu:',
  '--md-layer-confirm:', '.appSettingsPanel', '.uiMenuSurface', '.vsp-apps-submenu-panel', '.dav-settings-toggle-control']) {
  assert(files.css.includes(value), `Missing UI contract: ${value}`)
}
const layerNames = ['workspace', 'modal', 'modal-child', 'notification', 'menu', 'confirm', 'inspector']
const layers = layerNames.map(name => Number(files.css.match(new RegExp(`--md-layer-${name}:\\s*(\\d+)`))?.[1]))
assert(layers.every(Number.isFinite), 'Missing numeric UI layer token')
assert(layers.every((value, index) => index === 0 || value > layers[index - 1]), 'UI layers must increase from workspace to inspector')

const cssBlock = selector => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return files.css.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`))?.[1] || ''
}
for (const selector of ['.pageContextLayer', '.vsp-adb-submenu', '.vsp-apps-submenu-cap2', '.vsp-ctx-menu',
  '.automationMacroSortMenu', '.automationContextMenuPanel', '.uiMenuLayer', '.groupContextMenuSurface',
  '.rcpAutomationSelectDropdown', '.dav-ctx-menu', '.dav-ctx-submenu', '.vsp-file-context-menu',
  '.notesPopoverOverlay', '.notesFontSizeMenu', '.dav-nearby-filter-dropdown', '.dav-context-layer', '.rcpDisplayFilterMenu']) {
  assert(cssBlock(selector).includes('--md-layer-menu'), `Context menu is outside the menu layer: ${selector}`)
}
for (const selector of ['.confirmOverlay.confirmOverlay--top', '.visualAlertDeleteConfirmOverlay',
  '.vsp-file-confirm-overlay', '.notesReminderOverlay', '.dav-confirm-overlay-layer', '.vsp-apps-modal-overlay']) {
  assert(cssBlock(selector).includes('--md-layer-confirm'), `Confirmation is outside the confirm layer: ${selector}`)
}
for (const [name, count] of Object.entries({ app: 2, automationOverlays: 1, overlay: 1, stream: 1, adb: 1, apps: 1, viewerSide: 2, visualAlert: 1 })) {
  assert((files[name].match(/confirmOverlay--top/g) || []).length >= count, `Missing top confirmation layer in ${name}`)
}
assert(files.automationPanel.includes('contextMenu && createPortal('), 'Automation panel context menu must portal outside the sidebar')
assert(files.adb.includes("Boolean(warn || ['#ef4444', '#ff9c9c', 'red'].includes"), 'ADB red/warn risk guard is missing')
assert((files.adb.match(/requestAdbExecution\(/g) || []).length >= 4, 'ADB preset execution bypasses the shared risk guard')
assert((files.adb.match(/executeAdbCommand\(/g) || []).length === 2, 'ADB command executes outside the guard or confirmation')
assert(files.adb.includes('else if (oldIdx > idx) next[oldIdx - 1] = color'), 'Deleting an ADB preset must remap saved colors')
assert(!files.css.includes('unified component contract'), 'Duplicate EOF UI contract returned')
assert(!files.css.includes('.cp-overlay {') && !files.css.includes('.syncModalOverlay {'), 'Dead legacy CSS returned')
assert(!/z-index:\s*\d{4,}/.test(files.css), 'Hard-coded global CSS z-index')
for (const [name, source] of Object.entries(files).filter(([name]) => name !== 'css' && name !== 'inspector')) {
  assert(!/zIndex\s*:\s*\d{4,}/.test(source), `Hard-coded global z-index in ${name}`)
}
assert(!files.settings.includes('style={{'), 'App Settings contains visual inline styles')
assert(!files.menu.includes('uiMenuItemHidden'), 'Hidden profile menu code returned')
assert(!files.menu.includes('currentTarget.style') && !files.account.includes('currentTarget.style')
  && !files.app.includes('currentTarget.style'), 'Hover styling must stay in CSS')
assert(files.inspector.includes('monviewphone:theme-inspector-overrides:v2'), 'Theme Inspector storage is not v2')

console.log('UI contract check passed')
