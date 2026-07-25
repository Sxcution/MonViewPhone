export type ControlModeValue = 'sdk' | 'uhid';

export type ControlMode = {
  mouseMode: ControlModeValue;
  keyboardMode: ControlModeValue;
};

export const SDK_CONTROL_MODE: ControlMode = {
  mouseMode: 'sdk',
  keyboardMode: 'sdk',
};

export const UHID_CONTROL_MODE: ControlMode = {
  mouseMode: 'uhid',
  keyboardMode: 'uhid',
};

export const CONTROL_MODE_GLOBAL_KEY = 'monviewphone:control-mode-default-v1';
export const CONTROL_MODE_BY_UDID_KEY = 'monviewphone:control-mode-by-udid-v1';
export const CONTROL_MODE_EVENT = 'monviewphone:control-mode-changed';

export function normalizeControlMode(value: unknown): ControlMode {
  if (!value || typeof value !== 'object') return SDK_CONTROL_MODE;
  const raw = value as Partial<ControlMode>;
  return {
    mouseMode: raw.mouseMode === 'uhid' ? 'uhid' : 'sdk',
    keyboardMode: raw.keyboardMode === 'uhid' ? 'uhid' : 'sdk',
  };
}

export function controlModePreset(mode: ControlMode): 'sdk' | 'uhid' {
  return mode.mouseMode === 'uhid' && mode.keyboardMode === 'uhid' ? 'uhid' : 'sdk';
}

export function controlModeLabel(mode: ControlMode): 'SDK' | 'UHID' {
  return controlModePreset(mode) === 'uhid' ? 'UHID' : 'SDK';
}

export function loadGlobalControlMode(): ControlMode {
  try {
    const raw = localStorage.getItem(CONTROL_MODE_GLOBAL_KEY);
    return raw ? normalizeControlMode(JSON.parse(raw)) : SDK_CONTROL_MODE;
  } catch {
    return SDK_CONTROL_MODE;
  }
}

export function saveGlobalControlMode(mode: ControlMode): ControlMode {
  const next = normalizeControlMode(mode);
  try {
    localStorage.setItem(CONTROL_MODE_GLOBAL_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CONTROL_MODE_EVENT));
  } catch {}
  return next;
}

export function loadControlModeByUdid(): Record<string, ControlMode> {
  try {
    const raw = localStorage.getItem(CONTROL_MODE_BY_UDID_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, ControlMode> = {};
    for (const [udid, mode] of Object.entries(parsed)) {
      out[udid] = normalizeControlMode(mode);
    }
    return out;
  } catch {
    return {};
  }
}

export function saveControlModeByUdid(map: Record<string, ControlMode>) {
  try {
    localStorage.setItem(CONTROL_MODE_BY_UDID_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(CONTROL_MODE_EVENT));
  } catch {}
}
