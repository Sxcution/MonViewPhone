import { useEffect, useRef, useCallback } from 'react';
import { encodeKeycodeMessage, encodeTextMessage, encodeSetClipboardMessage, KeyEventAction } from '@/lib/control';
import { AndroidKeycode, KeyToCodeMap } from '@/lib/keyEvent';
import { useActive } from '@/context/ActiveContext';

type GlobalWithToggle = typeof window & { __disableDirectKeyboard?: boolean };

/**
 * Tạo một textarea ẩn (invisible) trong DOM để trình duyệt có nơi nhận
 * sự kiện paste khi user bấm Ctrl+V. Không có element editable nào được
 * focus thì browser sẽ KHÔNG bắn event paste.
 */
function getOrCreateHiddenPasteTarget(): HTMLTextAreaElement {
  const ID = '__scrcpy_paste_sink';
  let el = document.getElementById(ID) as HTMLTextAreaElement | null;
  if (!el) {
    el = document.createElement('textarea');
    el.id = ID;
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
  const { sendToActive, activeUdid } = useActive();

  // buffer text (optional quick input)
  const kbBufRef = useRef('');
  const flushTimerRef = useRef<number | null>(null);
  const repeatCounterRef = useRef<Map<number, number>>(new Map());

  function flushText() {
    const buf = kbBufRef.current;
    if (!buf) return;
    sendToActive(encodeTextMessage(buf));
    kbBufRef.current = '';
    flushTimerRef.current = null;
  }

  function queueText(s: string) {
    kbBufRef.current += s;
    if (flushTimerRef.current != null) return;
    flushTimerRef.current = window.setTimeout(flushText, 35);
  }

  // Paste thủ công qua navigator.clipboard.readText (dùng cho nút bấm)
  const manualPaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        sendToActive(encodeSetClipboardMessage(text, true));
      }
    } catch (err) {
      console.warn('[manualPaste] clipboard.readText failed:', err);
    }
  }, [sendToActive]);

  // Giữ hidden textarea luôn focus khi có device active
  useEffect(() => {
    if (!enabled || !activeUdid) return;
    const sink = getOrCreateHiddenPasteTarget();

    // Focus sink ban đầu
    sink.focus({ preventScroll: true });

    // Re-focus khi click ra ngoài (trừ khi click vào input/textarea thật)
    const refocus = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }
      // Delay 1 frame để DOM events hoàn tất rồi mới focus lại
      requestAnimationFrame(() => {
        if (document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA' ||
          document.activeElement?.tagName === 'SELECT') {
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
      if (!enabled || (window as GlobalWithToggle).__disableDirectKeyboard) return;

      // Skip when user is typing in any input/textarea/select
      const ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || (ae as HTMLElement).isContentEditable)) return;

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

      sendToActive(encodeKeycodeMessage(KeyEventAction.DOWN, keyCode, repeatCount, metaState));
      e.preventDefault();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!enabled || (window as GlobalWithToggle).__disableDirectKeyboard) return;

      const ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || (ae as HTMLElement).isContentEditable)) return;

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
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || (ae as HTMLElement).isContentEditable)) return;
      if (allowedContainer && e.target instanceof Node && allowedContainer.contains(e.target)) {
        return;
      }
      const text = e.clipboardData?.getData('text/plain');
      if (text) {
        sendToActive(encodeSetClipboardMessage(text, true));
        e.preventDefault();
        // Xóa nội dung textarea ẩn để không lưu rác
        const sink = document.getElementById('__scrcpy_paste_sink') as HTMLTextAreaElement | null;
        if (sink) sink.value = '';
      }
    };
    window.addEventListener('paste', onPaste, { capture: true });

    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
      window.removeEventListener('keyup', onKeyUp, { capture: true } as any);
      window.removeEventListener('paste', onPaste, { capture: true } as any);
    };
  }, [enabled, allowedContainer, sendToActive]);

  return { queueText, flushText, manualPaste };
}
