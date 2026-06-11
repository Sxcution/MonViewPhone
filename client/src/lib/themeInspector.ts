export type ThemeColorRole = {
  key: string;
  label: string;
  selector: string;
  cssVar: string;
  property: string;
};

export type ThemeOverrideMap = Record<string, string>;

export const COLOR_ROLES: ThemeColorRole[] = [
  {
    key: 'app.background',
    label: 'App background',
    selector: 'body, #root, #main',
    cssVar: '--md-bg',
    property: 'background-color'
  },
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
    key: 'modal.background',
    label: 'Modal / confirm panel',
    selector: '.confirmPanel, .appSettingsPanel, .syncModalPanel, .automationModalPanel, .dav-modal-card',
    cssVar: '--md-card',
    property: 'background-color'
  },
  {
    key: 'context.menu.background',
    label: 'Context menu',
    selector: '.contextMenuPanel, .dav-ctx-menu, .pageContextLayer',
    cssVar: '--md-card',
    property: 'background-color'
  },
  {
    key: 'border.normal',
    label: 'Normal border',
    selector: '.rcpSection, .rightConfigPanel, .confirmPanel, .appSettingsPanel, .modalInput',
    cssVar: '--md-border',
    property: 'border-color'
  },
  {
    key: 'text.primary',
    label: 'Primary text',
    selector: '.rcpTitle, .confirmTitle, .modalBtn, body',
    cssVar: '--md-text',
    property: 'color'
  },
  {
    key: 'text.muted',
    label: 'Muted text',
    selector: '.rcpToggleRow, .confirmText, .modalHint',
    cssVar: '--md-muted',
    property: 'color'
  },
  {
    key: 'accent.info',
    label: 'Info / blue accent',
    selector: '.modalBtnPrimary, .rcpToggleBtn.on, .rcpMiniBtn:hover, .rcpIconBtn:hover',
    cssVar: '--md-info',
    property: 'background-color'
  },
  {
    key: 'danger',
    label: 'Danger / delete color',
    selector: '.modalBtnDanger',
    cssVar: '--modal-danger-bg',
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
