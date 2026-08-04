export type OverlayType = 'modal' | 'modal-child' | 'confirm' | 'menu' | 'popover' | 'tooltip';

export interface OverlayEntry {
  id: string;
  type: OverlayType;
  onClose: () => void;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
}

class OverlayManagerService {
  private stack: OverlayEntry[] = [];
  private isListening = false;

  private initListeners() {
    if (this.isListening || typeof window === 'undefined') return;
    this.isListening = true;

    window.addEventListener('keydown', this.handleKeyDown, true);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const top = this.getTopOverlay();
      if (top && top.closeOnEscape !== false) {
        e.preventDefault();
        e.stopPropagation();
        top.onClose();
      }
    }
  };

  public register(entry: OverlayEntry): () => void {
    this.initListeners();

    // When a modal or confirm dialog opens, auto-close all active menus, popovers, and tooltips
    if (entry.type === 'modal' || entry.type === 'modal-child' || entry.type === 'confirm') {
      this.closeAllTransient();
    }

    // Remove any existing entry with same ID
    this.stack = this.stack.filter(item => item.id !== entry.id);
    this.stack.push(entry);
    this.updateBodyScrollLock();

    return () => {
      this.unregister(entry.id);
    };
  }

  public unregister(id: string) {
    this.stack = this.stack.filter(item => item.id !== id);
    this.updateBodyScrollLock();
  }

  public closeAllTransient() {
    const transientEntries = this.stack.filter(
      item => item.type === 'menu' || item.type === 'popover' || item.type === 'tooltip'
    );
    transientEntries.reverse().forEach(entry => entry.onClose());
  }

  public getTopOverlay(): OverlayEntry | undefined {
    return this.stack[this.stack.length - 1];
  }

  public isTopOverlay(id: string): boolean {
    const top = this.getTopOverlay();
    return top ? top.id === id : false;
  }

  private originalOverflow: string | null = null;

  private updateBodyScrollLock() {
    if (typeof document === 'undefined') return;
    const modalCount = this.stack.filter(
      item => item.type === 'modal' || item.type === 'modal-child' || item.type === 'confirm'
    ).length;

    if (modalCount > 0) {
      if (this.originalOverflow === null) {
        this.originalOverflow = document.body.style.overflow || '';
      }
      document.body.style.overflow = 'hidden';
    } else if (this.originalOverflow !== null) {
      document.body.style.overflow = this.originalOverflow;
      this.originalOverflow = null;
    }
  }
}

export const OverlayManager = new OverlayManagerService();
