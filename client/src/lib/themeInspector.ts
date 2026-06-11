export type ThemeColorRole = {
  key: string;
  label: string;
  selector: string;
  cssVar: string;
  property: string;
};

export type ThemeOverrideMap = Record<string, string>;

export const COLOR_ROLES: ThemeColorRole[] = [
  // Automation modal surfaces
  {
    key: 'automation.modal.surface',
    label: 'Automation modal surface',
    selector: '.automationContent, .automationModal, .automationCoordinatePanel',
    cssVar: '--mvp-automation-surface',
    property: 'background-color'
  },
  {
    key: 'automation.header',
    label: 'Automation modal header',
    selector: '.automationHeader',
    cssVar: '--mvp-automation-header',
    property: 'background-color'
  },
  {
    key: 'automation.block',
    label: 'Automation block / section',
    selector: '.automationProfileBlock, .automationDeviceBlock, .automationCoordinateRow, .automationCoordinateContext',
    cssVar: '--mvp-automation-block',
    property: 'background-color'
  },
  {
    key: 'automation.table.cell',
    label: 'Automation table cell',
    selector: '.automationMacroTable th, .automationMacroTable td, .automationSavedTable th, .automationSavedTable td',
    cssVar: '--mvp-automation-table-cell',
    property: 'background-color'
  },
  {
    key: 'automation.button',
    label: 'Automation button',
    selector: '.automationBtn, .automationCoordinateBtn, .automationArrowBtn, .automationProfileNameBtn, .automationProfileActionBtn, .automationProfileMacroBtn, .automationProfileIconBtn, .automationSavedMacroBtn, .automationDetailsBtn, .automationClose',
    cssVar: '--mvp-button-bg',
    property: 'background-color'
  },
  {
    key: 'automation.input',
    label: 'Automation input / select',
    selector: '.automationDelayInput, .automationNoteInput, .automationActionSelect',
    cssVar: '--mvp-input-bg',
    property: 'background-color'
  },

  // Sync Macro / Sync Time modal
  {
    key: 'sync.modal.surface',
    label: 'Sync modal surface',
    selector: '.syncTimeCard',
    cssVar: '--mvp-sync-card',
    property: 'background-color'
  },
  {
    key: 'sync.modal.header',
    label: 'Sync modal header',
    selector: '.syncTimeHeader',
    cssVar: '--mvp-sync-header',
    property: 'background-color'
  },
  {
    key: 'sync.modal.row',
    label: 'Sync modal row',
    selector: '.syncTimeRow',
    cssVar: '--mvp-sync-row',
    property: 'background-color'
  },
  {
    key: 'sync.modal.input',
    label: 'Sync modal input',
    selector: '.syncTimeInput',
    cssVar: '--mvp-input-bg',
    property: 'background-color'
  },

  // Right sidebar / config
  {
    key: 'right.panel.background',
    label: 'Right config panel',
    selector: '.rightConfigPanel',
    cssVar: '--md-card',
    property: 'background-color'
  },
  {
    key: 'section.background',
    label: 'Right panel section',
    selector: '.rcpSection',
    cssVar: '--md-card',
    property: 'background-color'
  },
  {
    key: 'right.panel.button',
    label: 'Right panel button',
    selector: '.rcpMiniBtn, .rcpIconBtn, .rcpStepBtn, .rcpToggleBtn, .btn-pin, .btn-setting, .rb-btn',
    cssVar: '--mvp-button-bg',
    property: 'background-color'
  },
  {
    key: 'right.panel.input',
    label: 'Right panel input',
    selector: '.modalInput, .rcpSearch, .cp-search, .confirmInput',
    cssVar: '--mvp-input-bg',
    property: 'background-color'
  },

  // Device selection grid
  {
    key: 'device.grid.item',
    label: 'Device grid item',
    selector: '.rcpGridItem, .rcpSavedGroupBtn, .rcpGroupDeviceItem',
    cssVar: '--mvp-grid-item-bg',
    property: 'background-color'
  },
  {
    key: 'device.grid.item.active',
    label: 'Device grid item active',
    selector: '.rcpGridItem.on, .rcpSavedGroupBtn.active, .rcpSavedGroupBtn.focused',
    cssVar: '--mvp-grid-item-active-bg',
    property: 'background-color'
  },

  // Generic modal / confirm / app settings
  {
    key: 'modal.background',
    label: 'Modal / confirm panel',
    selector: '.confirmPanel, .appSettingsPanel, .dav-modal-card',
    cssVar: '--md-card',
    property: 'background-color'
  },
  {
    key: 'modal.button',
    label: 'Modal button',
    selector: '.modalBtn, .modalBtnPrimary, .modalBtnDanger',
    cssVar: '--mvp-button-bg',
    property: 'background-color'
  },

  // Context menus
  {
    key: 'context.menu.background',
    label: 'Context menu',
    selector: '.contextMenuPanel, .dav-ctx-menu, .pageContextLayer, .automationContextMenuPanel, .automationMacroCtxPanel, .automationRowDelayCtxPanel, .automationMacroSortMenu, .vsp-ctx-menu',
    cssVar: '--md-card',
    property: 'background-color'
  },
  {
    key: 'context.menu.item',
    label: 'Context menu item',
    selector: '.ctxMenuItem, .automationContextMenuItem, .automationMacroSortItem, .vsp-ctx-item, .dropdown-item',
    cssVar: '--mvp-menu-item-bg',
    property: 'background-color'
  },

  // Generic inputs/buttons fallback, phải để gần cuối nhưng trước app background
  {
    key: 'button.generic',
    label: 'Generic button',
    selector: 'button:not(.themeInspectorRoot button)',
    cssVar: '--mvp-button-bg',
    property: 'background-color'
  },
  {
    key: 'input.generic',
    label: 'Generic input / select',
    selector: 'input:not(.sr-only), select, textarea',
    cssVar: '--mvp-input-bg',
    property: 'background-color'
  },

  // Borders/text
  {
    key: 'border.normal',
    label: 'Normal border',
    selector: '.rcpSection, .rightConfigPanel, .confirmPanel, .appSettingsPanel, .modalInput, .automationContent, .automationProfileBlock, .automationCoordinateRow, .syncTimeCard, .rcpGridItem',
    cssVar: '--md-border',
    property: 'border-color'
  },
  {
    key: 'text.primary',
    label: 'Primary text',
    selector: '.rcpTitle, .confirmTitle, .automationTitle, .automationSectionTitle, .syncTimeTitle, body',
    cssVar: '--md-text',
    property: 'color'
  },
  {
    key: 'text.muted',
    label: 'Muted text',
    selector: '.rcpToggleRow, .confirmText, .modalHint, .automationStatus, .automationProfileEmpty, .syncTimeLabel',
    cssVar: '--md-muted',
    property: 'color'
  },

  // App background để CUỐI CÙNG
  {
    key: 'app.background',
    label: 'App background',
    selector: 'body, #root, #main, #gridScroll',
    cssVar: '--md-bg',
    property: 'background-color'
  }
];

export const STORAGE_KEY = 'monviewphone:theme-inspector-overrides:v1';

export function normalizeHexColor(value: string): string | null {
  const hex = value.trim();
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
    return null;
  }
  if (hex.length === 4) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

export function loadThemeOverrides(): ThemeOverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Lỗi load theme overrides:', e);
  }
  return {};
}

export function saveThemeOverrides(overrides: ThemeOverrideMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Lỗi save theme overrides:', e);
  }
}

export function applyThemeOverrides(overrides: ThemeOverrideMap): void {
  COLOR_ROLES.forEach(role => {
    document.documentElement.style.removeProperty(role.cssVar);
  });
  Object.entries(overrides).forEach(([cssVar, color]) => {
    document.documentElement.style.setProperty(cssVar, color);
  });
}

export function setThemeOverride(cssVar: string, color: string): ThemeOverrideMap {
  const overrides = loadThemeOverrides();
  const normalized = normalizeHexColor(color);
  if (normalized) {
    overrides[cssVar] = normalized;
    saveThemeOverrides(overrides);
    applyThemeOverrides(overrides);
  }
  return overrides;
}

export function removeThemeOverride(cssVar: string): ThemeOverrideMap {
  const overrides = loadThemeOverrides();
  delete overrides[cssVar];
  saveThemeOverrides(overrides);
  applyThemeOverrides(overrides);
  return overrides;
}

export function clearThemeOverrides(): void {
  localStorage.removeItem(STORAGE_KEY);
  applyThemeOverrides({});
}

export type ThemeColorMatch = {
  role: ThemeColorRole;
  element: HTMLElement;
};

export function getThemeRoleForElement(el: HTMLElement): ThemeColorMatch | null {
  if (!el) return null;

  if (el.classList && el.classList.contains('sr-only') && el.parentElement) {
    el = el.parentElement as HTMLElement;
  }

  if (el.closest('.themeInspectorRoot')) {
    return null;
  }

  if (el.tagName === 'CANVAS' || el.closest('.tileVideoFrame')) {
    return null;
  }

  let current: HTMLElement | null = el;
  while (current) {
    for (const role of COLOR_ROLES) {
      try {
        if (current.matches(role.selector)) {
          // Rule: don't return app.background if inside modal/floating overlay
          if (role.key === 'app.background') {
            if (el.closest('.automationFloatingLayer, .automationModal, .automationCoordinatePanel, .automationContent, .syncTimeOverlay, .syncTimeCard, .themeInspectorRoot, .confirmOverlay, .appSettingsOverlay, .dav-overlay, .dav-ctx-menu, .contextMenuPanel')) {
              return null;
            }
          }
          return { role, element: current };
        }
      } catch (err) {
        // selector might not match on this node type
      }
    }
    current = current.parentElement;
  }
  return null;
}
