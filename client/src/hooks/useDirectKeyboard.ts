import { useEffect, useRef, useCallback } from 'react';
import { encodeKeycodeMessage, encodeTextMessage, encodeSetClipboardMessage, KeyEventAction } from '@/lib/control';
import { AndroidKeycode, KeyToCodeMap } from '@/lib/keyEvent';
import { useActive } from '@/context/ActiveContext';
import { matchesHotkey } from '@/lib/syncTimeSettings';
import { emitAutomationKey, emitAutomationText } from '@/lib/automation';

type GlobalWithToggle = typeof window & { __disableDirectKeyboard?: boolean };
const PASTE_SINK_ID = '__scrcpy_paste_sink';

function isUserEditableElement(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.id === PASTE_SINK_ID) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/**
 * Tạo một textarea ẩn (invisible) trong DOM để trình duyệt có nơi nhận
 * sự kiện paste khi user bấm Ctrl+V. Không có element editable nào được
 * focus thì browser sẽ KHÔNG bắn event paste.
 */
function getOrCreateHiddenPasteTarget(): HTMLTextAreaElement {
  let el = document.getElementById(PASTE_SINK_ID) as HTMLTextAreaElement | null;
  if (!el) {
    el = document.createElement('textarea');
    el.id = PASTE_SINK_ID;
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('spellcheck', 'false');
    el.setAttribute('tabindex', '-1');
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, {
      position: 'fixed',
      left: '-9999px',
      top: '-9999px',
      width: '1px',
      height: '1px',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '-1',
    });
    document.body.appendChild(el);
  }
  return el;
}

export function useDirectKeyboard(enabled: boolean, allowedContainer?: HTMLElement | null) {
  const {
    sendToActive,
    activeUdid,
    altSoloUdid,
    syncAll,
    syncMain,
    syncTargets,
    getTargetsByUdids
  } = useActive();

  // buffer text (optional quick input)
  const kbBufRef = useRef('');
  const flushTimerRef = useRef<number | null>(null);
  const repeatCounterRef = useRef<Map<number, number>>(new Map());

  function flushText() {
    const buf = kbBufRef.current;
    if (!buf) return;
    if (activeUdid) {
      emitAutomationText({ udid: activeUdid, text: buf, timestamp: Date.now() });
    }
    sendToActive(encodeTextMessage(buf));
    kbBufRef.current = '';
    flushTimerRef.current = null;
  }

  function queueText(s: string) {
    kbBufRef.current += s;
    if (flushTimerRef.current != null) return;
    flushTimerRef.current = window.setTimeout(flushText, 35);
  }

  // helper uniq
  function uniq(arr: string[]): string[] {
    const s = new Set<string>();
    const out: string[] = [];
    for (const x of arr) {
      if (!s.has(x)) {
        s.add(x);
        out.push(x);
      }
    }
    return out;
  }

  // performUnicodePaste: Tách set clipboard và dán phím ảo với delay 120ms
  const performUnicodePaste = useCallback(async (text: string) => {
    if (!activeUdid) return;

    // Resolve targets
    let targetUdids: string[] = [];
    if (altSoloUdid !== null) {
      if (activeUdid === altSoloUdid) {
        targetUdids = [activeUdid];
      }
    } else {
      const isInSyncGroup =
        syncTargets.includes(activeUdid) ||
        (syncMain !== null && activeUdid === syncMain);

      if (isInSyncGroup) {
        targetUdids = uniq([
          ...(syncMain ? [syncMain] : []),
          ...syncTargets,
        ]);
      } else if (syncAll) {
        targetUdids = uniq([activeUdid, ...syncTargets.filter(Boolean)]);
      } else {
        targetUdids = [activeUdid];
      }
    }

    const targets = getTargetsByUdids(targetUdids);
    if (!targets.length) return;

    // Gửi clipboard và dán cho từng device
    for (const t of targets) {
      try {
        const mode = localStorage.getItem(`monviewphone:paste-mode:${t.udid}`) || 'clipboard-auto';
        const isError = localStorage.getItem(`monviewphone:paste-error:${t.udid}`) === 'true';

        // Gửi clipboard (paste = false)
        t.ws.send(encodeSetClipboardMessage(text, false));

        const useCtrlV = mode === 'clipboard-ctrl-v' || (mode === 'clipboard-auto' && isError);

        setTimeout(() => {
          try {
            if (useCtrlV) {
              // Gửi Ctrl+V phần cứng
              t.ws.send(encodeKeycodeMessage(KeyEventAction.DOWN, AndroidKeycode.KEYCODE_V, 0, AndroidKeycode.META_CTRL_ON));
              t.ws.send(encodeKeycodeMessage(KeyEventAction.UP, AndroidKeycode.KEYCODE_V, 0, AndroidKeycode.META_CTRL_ON));
            } else {
              // Gửi KEYCODE_PASTE
              t.ws.send(encodeKeycodeMessage(KeyEventAction.DOWN, AndroidKeycode.KEYCODE_PASTE, 0, 0));
              t.ws.send(encodeKeycodeMessage(KeyEventAction.UP, AndroidKeycode.KEYCODE_PASTE, 0, 0));
            }
          } catch (e) {
            console.warn('[performUnicodePaste] key trigger failed for', t.udid, e);
          }
        }, 120);
      } catch (err) {
        console.warn('[performUnicodePaste] failed for target', t.udid, err);
      }
    }
  }, [activeUdid, altSoloUdid, syncTargets, syncMain, syncAll, getTargetsByUdids]);

  // Paste thủ công qua navigator.clipboard.readText (dùng cho nút bấm)
  const manualPaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (activeUdid) {
          emitAutomationText({ udid: activeUdid, text, timestamp: Date.now() });
        }
        await performUnicodePaste(text);
      }
    } catch (err) {
      console.warn('[manualPaste] clipboard.readText failed:', err);
    }
  }, [activeUdid, performUnicodePaste]);

  // Giữ hidden textarea luôn focus khi có device active
  useEffect(() => {
    if (!enabled || !activeUdid) return;
    const sink = getOrCreateHiddenPasteTarget();

    // Focus sink ban đầu
    sink.focus({ preventScroll: true });

    // Re-focus khi click ra ngoài (trừ khi click vào input/textarea thật)
    const refocus = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isUserEditableElement(target)) {
        return;
      }
      // Delay 1 frame để DOM events hoàn tất rồi mới focus lại
      requestAnimationFrame(() => {
        if (isUserEditableElement(document.activeElement)) {
          return;
        }
        sink.focus({ preventScroll: true });
      });
    };
    document.addEventListener('mouseup', refocus, true);
    return () => {
      document.removeEventListener('mouseup', refocus, true);
    };
  }, [enabled, activeUdid]);

  useEffect(() => {
    // cleanup any pending timer when disabling
    if (!enabled) {
      kbBufRef.current = '';
      if (flushTimerRef.current != null) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      repeatCounterRef.current.clear();
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't block F12 key (allow browser dev tools)
      if (e.code === 'F12') return;

      // Don't block the assigned Sync Time hotkey
      const syncTimeHotkey = localStorage.getItem('monviewphone:sync-time-hotkey') || '';
      if (syncTimeHotkey && matchesHotkey(e, syncTimeHotkey)) {
        return;
      }

      if (!enabled || (window as GlobalWithToggle).__disableDirectKeyboard) return;

      // Skip when user is typing in any input/textarea/select
      const ae = document.activeElement;
      if (isUserEditableElement(ae)) return;

      // Allow typing into the on-screen input/textarea
      if (allowedContainer && e.target instanceof Node && allowedContainer.contains(e.target)) {
        return;
      }

      // Không chặn Ctrl + A để App.tsx có thể bắt sự kiện Select All
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
        return;
      }

      // Cho phép Copy / Paste (Ctrl+C, Ctrl+V, Ctrl+X) đi qua để trình duyệt kích hoạt event native
      const isCopyPaste = (e.ctrlKey || e.metaKey) && (e.code === 'KeyC' || e.code === 'KeyV' || e.code === 'KeyX');
      if (isCopyPaste) {
        return;
      }

      const isWin = e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight';
      const isAlt = e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight';
      const isCtrl = e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight';
      const isTab = e.key === 'Tab';
      const isFn = e.key === 'Fn' || e.code === 'Fn';

      const hasModifierCombo = e.altKey || e.ctrlKey || e.metaKey; // Shift still allowed

      if (isWin || isAlt || isCtrl || isFn || hasModifierCombo || isTab) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
      }

      // Map physical key code -> Android keycode
      const keyCode = KeyToCodeMap.get(e.code) ?? null;
      if (keyCode == null) {
        // For printable chars not in mapping, you can optionally send text.
        // This matches original behaviour (it just ignores unknown keys).
        return;
      }

      let repeatCount = 0;
      if (e.repeat) {
        const prev = repeatCounterRef.current.get(keyCode) ?? 0;
        const next = prev <= 0 ? 1 : prev + 1;
        repeatCount = next;
        repeatCounterRef.current.set(keyCode, next);
      }

      const metaState =
        // LƯU Ý: Xóa/comment dòng getModifierState('Alt') để tránh kẹt shortcut Android khi đè Alt điều khiển đơn
        // (e.getModifierState('Alt') ? AndroidKeycode.META_ALT_ON : 0) |
        (e.getModifierState('Shift') ? AndroidKeycode.META_SHIFT_ON : 0) |
        (e.getModifierState('Control') ? AndroidKeycode.META_CTRL_ON : 0) |
        (e.getModifierState('Meta') ? AndroidKeycode.META_META_ON : 0) |
        (e.getModifierState('CapsLock') ? AndroidKeycode.META_CAPS_LOCK_ON : 0) |
        (e.getModifierState('ScrollLock') ? AndroidKeycode.META_SCROLL_LOCK_ON : 0) |
        (e.getModifierState('NumLock') ? AndroidKeycode.META_NUM_LOCK_ON : 0);

      if (!e.repeat && activeUdid) {
        emitAutomationKey({ udid: activeUdid, keycode: keyCode, timestamp: Date.now() });
      }
      sendToActive(encodeKeycodeMessage(KeyEventAction.DOWN, keyCode, repeatCount, metaState));
      e.preventDefault();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'F12') return;

      const syncTimeHotkey = localStorage.getItem('monviewphone:sync-time-hotkey') || '';
      if (syncTimeHotkey && matchesHotkey(e, syncTimeHotkey)) {
        return;
      }

      if (!enabled || (window as GlobalWithToggle).__disableDirectKeyboard) return;

      const ae = document.activeElement;
      if (isUserEditableElement(ae)) return;

      if (allowedContainer && e.target instanceof Node && allowedContainer.contains(e.target)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') return;
      const isCopyPaste = (e.ctrlKey || e.metaKey) && (e.code === 'KeyC' || e.code === 'KeyV' || e.code === 'KeyX');
      if (isCopyPaste) return;

      const isWin = e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight';
      const isAlt = e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight';
      const isCtrl = e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight';
      const isFn = e.key === 'Fn' || e.code === 'Fn';
      const hasModifierCombo = e.altKey || e.ctrlKey || e.metaKey;

      if (isWin || isAlt || isCtrl || isFn || hasModifierCombo) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
      }

      const keyCode = KeyToCodeMap.get(e.code) ?? null;
      if (keyCode == null) return;
      repeatCounterRef.current.delete(keyCode);

      const metaState =
        // LƯU Ý: Xóa/comment dòng getModifierState('Alt') để tránh kẹt shortcut Android khi đè Alt điều khiển đơn
        // (e.getModifierState('Alt') ? AndroidKeycode.META_ALT_ON : 0) |
        (e.getModifierState('Shift') ? AndroidKeycode.META_SHIFT_ON : 0) |
        (e.getModifierState('Control') ? AndroidKeycode.META_CTRL_ON : 0) |
        (e.getModifierState('Meta') ? AndroidKeycode.META_META_ON : 0) |
        (e.getModifierState('CapsLock') ? AndroidKeycode.META_CAPS_LOCK_ON : 0) |
        (e.getModifierState('ScrollLock') ? AndroidKeycode.META_SCROLL_LOCK_ON : 0) |
        (e.getModifierState('NumLock') ? AndroidKeycode.META_NUM_LOCK_ON : 0);

      sendToActive(encodeKeycodeMessage(KeyEventAction.UP, keyCode, 0, metaState));
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown, { capture: true, passive: false });
    window.addEventListener('keyup', onKeyUp, { capture: true, passive: false });

    // Paste handler: bắt event paste từ hidden textarea hoặc bất kỳ đâu
    const onPaste = (e: ClipboardEvent) => {
      if (!enabled || (window as GlobalWithToggle).__disableDirectKeyboard) return;
      const ae = document.activeElement;
      if (isUserEditableElement(ae)) return;
      if (allowedContainer && e.target instanceof Node && allowedContainer.contains(e.target)) {
        return;
      }
      const text = e.clipboardData?.getData('text/plain');
      if (text) {
        if (activeUdid) {
          emitAutomationText({ udid: activeUdid, text, timestamp: Date.now() });
        }
        performUnicodePaste(text);
        e.preventDefault();
        // Xóa nội dung textarea ẩn để không lưu rác
        const sink = document.getElementById(PASTE_SINK_ID) as HTMLTextAreaElement | null;
        if (sink) sink.value = '';
      }
    };
    window.addEventListener('paste', onPaste, { capture: true });

    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
      window.removeEventListener('keyup', onKeyUp, { capture: true } as any);
      window.removeEventListener('paste', onPaste, { capture: true } as any);
    };
  }, [enabled, allowedContainer, activeUdid, sendToActive, performUnicodePaste]);

  return { queueText, flushText, manualPaste };
}
