export type ThemeColorRole = {
  key: string;
  label: string;
  selector: string;
  cssVar: string;
  property: string;
};

export type ThemeOverrideMap = Record<string, string>;

export const COLOR_ROLES: ThemeColorRole[] = [
  // Badges & status widgets (Priority 1)
  {
    key: 'badge.generic',
    label: 'Badge / Status notification',
    selector: '.dav-total-badge, .dav-daily-reminder-tooltip, .dav-account-type-badge, [class*="badge"], [class*="Badge"]',
    cssVar: '--md-info',
    property: 'background-color'
  },

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
    selector: '.rightConfigPanel, .viewerSidePanel, [class^="vsp-"], .automationPanel, .macroPlaybackPanel',
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
    selector: '.confirmPanel, .appSettingsPanel, .dav-modal-card, .themeInspectorPanel, .visualAlertPanel',
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

  // Tile & device account headers
  {
    key: 'tile.header',
    label: 'Tile header / Device info',
    selector: '.tile, .tileHeader, .deviceName, .overlayHeader, [class^="dav-"]',
    cssVar: '--md-card',
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



export interface ThemeVariableCandidate {
  cssVar: string;
  property: string;
  value: string;
  priority: number;
}

export type ThemeColorMatch = {
  role?: ThemeColorRole;
  element: HTMLElement;
  cssVar: string;
  property: string;
  currentColor?: string;
  source: 'role' | 'computed-style' | 'inline-style' | 'fallback';
  matchedSelector?: string;
  className?: string;
  id?: string;
  candidates?: Array<{ cssVar: string; property: string; value: string; priority: number }>;
  
  // Logic Target & new requirements
  inspectorId: string;
  label: string;
  selector: string;
  classNameExact: string;
  component: string;
  uiText?: string;
  title?: string;
  ariaLabel?: string;
};

function collectMatchedCssVars(el: HTMLElement): ThemeVariableCandidate[] {
  const candidates: ThemeVariableCandidate[] = [];
  const seen = new Set<string>();

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules || sheet.rules;
    } catch (e) {
      continue;
    }
    if (!rules) continue;

    function processRules(ruleList: any) {
      for (const rule of Array.from(ruleList)) {
        if (!rule) continue;
        if (rule instanceof CSSStyleRule) {
          try {
            if (el.matches(rule.selectorText)) {
              const style = rule.style;
              if (style) {
                for (let i = 0; i < style.length; i++) {
                  const propName = style[i];
                  const val = style.getPropertyValue(propName);
                  const varMatch = val.match(/var\((--[^),\s]+)/);
                  if (varMatch) {
                    const cssVar = varMatch[1].trim();
                    const key = `${propName}:${cssVar}`;
                    if (!seen.has(key)) {
                      seen.add(key);
                      candidates.push({
                        cssVar,
                        property: propName,
                        value: val,
                        priority: 9
                      });
                    }
                  }
                }
              }
            }
          } catch (e) {
            // matches() fail on complex/invalid selectors
          }
        } else if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
          try {
            const subRules = (rule as any).cssRules || (rule as any).rules;
            if (subRules) {
              processRules(subRules);
            }
          } catch (e) {}
        }
      }
    }

    processRules(rules);
  }
  return candidates;
}

function getCandidatePriority(c: ThemeVariableCandidate): number {
  let propScore = 0;
  const prop = c.property.toLowerCase();
  if (prop === 'background-color' || prop === 'background') {
    propScore = 100;
  } else if (prop === 'color') {
    propScore = 80;
  } else if (prop.includes('border-') && prop.includes('color')) {
    propScore = 60;
  } else if (prop === 'border-color') {
    propScore = 60;
  } else if (prop === 'box-shadow') {
    propScore = 40;
  } else {
    propScore = 20;
  }

  let varScore = 0;
  const cssVar = c.cssVar.toLowerCase();
  if (cssVar.startsWith('--mvp-')) {
    varScore = 10;
  } else if (cssVar.startsWith('--md-')) {
    varScore = 8;
  } else if (cssVar.startsWith('--modal-')) {
    varScore = 6;
  } else {
    varScore = 2;
  }

  return propScore + varScore;
}

function sortThemeCandidates(candidates: ThemeVariableCandidate[]): ThemeVariableCandidate[] {
  return [...candidates].sort((a, b) => {
    const prioA = getCandidatePriority(a);
    const prioB = getCandidatePriority(b);
    return prioB - prioA;
  });
}

function getCleanClassSelector(el: HTMLElement | null): string {
  if (!el) return '';

  const excluded = new Set([
    'themeInspectorHoverTarget',
    'themeInspectorRoot',
    'themeInspectorTooltip',
    'themeInspectorOverlay',
    'themeInspectorPanel'
  ]);

  return Array.from(el.classList)
    .filter(Boolean)
    .filter(cls => !excluded.has(cls))
    .filter(cls => !cls.startsWith('themeInspector'))
    .map(cls => `.${cls}`)
    .join('');
}

function getCleanText(el: HTMLElement | null): string {
  if (!el) return '';
  return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

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

  // 1. Resolve Inspector ID & component & label
  const logicTargetEl = el.closest('[data-inspector-id]') as HTMLElement | null;
  let inspectorId = '';
  let label = '';
  let component = '';
  let selector = '';

  if (logicTargetEl) {
    inspectorId = logicTargetEl.getAttribute('data-inspector-id') || '';
    label = logicTargetEl.getAttribute('data-inspector-label') || '';
    component = logicTargetEl.getAttribute('data-inspector-component') || '';
    selector = `[data-inspector-id="${inspectorId}"]`;
  }

  // 2. Style Info: find matches up the ancestor tree
  let current: HTMLElement | null = el;
  let foundMatch: Partial<ThemeColorMatch> | null = null;

  while (current && !foundMatch) {
    // A. Check exact COLOR_ROLES
    for (const role of COLOR_ROLES) {
      try {
        if (current.matches(role.selector)) {
          if (role.key === 'app.background') {
            if (el.closest('.automationFloatingLayer, .automationModal, .automationCoordinatePanel, .automationContent, .syncTimeOverlay, .syncTimeCard, .themeInspectorRoot, .confirmOverlay, .appSettingsOverlay, .dav-overlay, .dav-ctx-menu, .contextMenuPanel')) {
              continue;
            }
          }
          foundMatch = {
            role,
            element: current,
            cssVar: role.cssVar,
            property: role.property,
            source: 'role',
            matchedSelector: role.selector
          };
          break;
        }
      } catch (err) {}
    }

    // B. Check dynamic computed style
    if (!foundMatch) {
      const dynCandidates = collectMatchedCssVars(current);
      if (dynCandidates.length > 0) {
        const sorted = sortThemeCandidates(dynCandidates);
        const best = sorted[0];
        foundMatch = {
          element: current,
          cssVar: best.cssVar,
          property: best.property,
          source: 'computed-style',
          matchedSelector: getCleanClassSelector(current) || current.tagName.toLowerCase(),
          candidates: sorted
        };
      }
    }

    // C. Check inline style
    if (!foundMatch) {
      const styleAttr = current.getAttribute('style') || '';
      const inlineVars: ThemeVariableCandidate[] = [];
      const varRegex = /(--[^:\s]+)\s*:\s*([^;]+)/g;
      let inlineMatch;
      while ((inlineMatch = varRegex.exec(styleAttr)) !== null) {
        inlineVars.push({
          cssVar: inlineMatch[1].trim(),
          property: 'custom-property',
          value: inlineMatch[2].trim(),
          priority: 1
        });
      }
      if (inlineVars.length > 0) {
        const sorted = sortThemeCandidates(inlineVars);
        const best = sorted[0];
        foundMatch = {
          element: current,
          cssVar: best.cssVar,
          property: best.property,
          source: 'inline-style',
          candidates: sorted
        };
      }
    }

    if (!foundMatch) {
      current = current.parentElement;
    }
  }

  // D. Fallback if no style match found at all
  if (!foundMatch) {
    const id = el.id || '';
    foundMatch = {
      element: el,
      cssVar: '--md-border',
      property: 'background-color',
      source: 'fallback',
      matchedSelector: id ? `#${id}` : (getCleanClassSelector(el) || el.tagName.toLowerCase())
    };
  }

  const classSourceEl = logicTargetEl || (foundMatch?.element as HTMLElement | null) || el;
  const classNameExact = getCleanClassSelector(classSourceEl);

  // Fallback Selector logic:
  // data-inspector-id > exact class of element > COLOR_ROLES selector > generic selector
  if (!selector) {
    if (el.id) {
      selector = `#${el.id}`;
    } else if (classNameExact) {
      selector = classNameExact;
    } else if (foundMatch.matchedSelector) {
      selector = foundMatch.matchedSelector;
    } else {
      selector = el.tagName.toLowerCase();
    }
  }

  // Fallbacks for inspectorId & label & component
  if (!inspectorId) {
    if (foundMatch.role) {
      inspectorId = foundMatch.role.key;
      label = foundMatch.role.label;
    } else {
      inspectorId = selector;
      label = `Selector matching: ${selector}`;
    }
  }

  const textSourceEl = logicTargetEl || (foundMatch?.element as HTMLElement | null) || el;
  const uiText = getCleanText(textSourceEl);
  const title = textSourceEl?.getAttribute('title') || undefined;
  const ariaLabel = textSourceEl?.getAttribute('aria-label') || undefined;

  const finalMatch: ThemeColorMatch = {
    role: foundMatch.role,
    element: foundMatch.element || el,
    cssVar: foundMatch.cssVar || '',
    property: foundMatch.property || '',
    source: foundMatch.source || 'fallback',
    matchedSelector: foundMatch.matchedSelector,
    className: el.className || undefined,
    id: el.id || undefined,
    candidates: foundMatch.candidates,
    
    // logicTarget values
    inspectorId,
    label,
    selector,
    classNameExact,
    component,
    uiText,
    title,
    ariaLabel
  };

  if (finalMatch.element && finalMatch.property && finalMatch.property !== 'custom-property') {
    try {
      const comp = window.getComputedStyle(finalMatch.element);
      finalMatch.currentColor = comp.getPropertyValue(finalMatch.property) || '';
    } catch (e) {}
  }

  return finalMatch;
}
