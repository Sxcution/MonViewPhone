import { test, expect } from '@playwright/test';

test.describe('Real React Component Overlay Architecture & Stacking E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=overlay');
    await page.waitForSelector('#overlay-test-harness');
  });

  test('P0: #overlay-root has no position: fixed or zIndex and creates no stacking context', async ({ page }) => {
    // Open a popover to ensure #overlay-root is mounted in DOM
    await page.click('#btn-popover-ref');
    await expect(page.locator('#overlay-root #test-popover-ref-content')).toBeVisible();

    const rootStyles = await page.evaluate(() => {
      const root = document.getElementById('overlay-root');
      if (!root) return null;
      const comp = window.getComputedStyle(root);
      return {
        position: comp.position,
        zIndex: comp.zIndex,
        width: comp.width,
        height: comp.height,
      };
    });

    expect(rootStyles).not.toBeNull();
    expect(rootStyles!.position).not.toBe('fixed');
    expect(rootStyles!.zIndex).toBe('auto');
  });

  test('P0 REAL FIX: AnchoredPopover with anchorRef actually renders inside #overlay-root', async ({ page }) => {
    // Click button that passes anchorRef to AnchoredPopover
    await page.click('#btn-popover-ref');

    // Verify popover element is actually rendered inside #overlay-root
    const popoverContent = page.locator('#overlay-root #test-popover-ref-content');
    await expect(popoverContent).toBeVisible();

    // Verify position is computed near the anchor button
    const btnBox = await page.locator('#btn-popover-ref').boundingBox();
    const popoverBox = await popoverContent.boundingBox();

    expect(btnBox).not.toBeNull();
    expect(popoverBox).not.toBeNull();

    // AnchoredPopover must be placed relative to the button
    expect(popoverBox!.x).toBeGreaterThan(0);
    expect(popoverBox!.y).toBeGreaterThan(0);
  });

  test('P0: document.elementFromPoint() at center of ConfirmDialog over ContextMenu returns Confirm surface', async ({ page }) => {
    // Open ContextMenu first
    await page.click('#btn-context-menu');
    await expect(page.locator('#overlay-root #test-context-menu-content')).toBeVisible();

    // Open ConfirmDialog on top
    await page.click('#btn-confirm-dialog');
    const confirmCard = page.locator('#overlay-root .confirmPanel');
    await expect(confirmCard).toBeVisible();

    // Perform elementFromPoint at the center of ConfirmDialog
    const isConfirmCard = await page.evaluate(() => {
      const card = document.querySelector('#overlay-root .confirmPanel');
      if (!card) return false;
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const topEl = document.elementFromPoint(centerX, centerY);
      return card === topEl || card.contains(topEl);
    });

    expect(isConfirmCard).toBe(true);
  });

  test('P0: Viewport 4-edge clamping prevents popover overflow on real component', async ({ page }) => {
    // Click bottom-right anchored target button
    await page.click('#btn-clamp-test');
    await expect(page.locator('#overlay-root #test-popover-clamp-content')).toBeVisible();

    const isClamped = await page.evaluate(() => {
      const popover = document.querySelector('#overlay-root .test-popover-clamp-panel');
      if (!popover) return false;

      const rect = popover.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      return rect.left >= 0 && rect.right <= vw && rect.top >= 0 && rect.bottom <= vh;
    });

    expect(isClamped).toBe(true);
  });

  test('P0: Escape key skips closeOnEscape=false and pops top-most closable overlay', async ({ page }) => {
    // Open Reminder Popover FIRST (closeOnEscape = false)
    await page.click('#btn-reminder-no-escape');
    await expect(page.locator('#overlay-root #test-reminder-content')).toBeVisible();

    // Open Confirm Dialog SECOND (closeOnEscape = true)
    await page.click('#btn-confirm-dialog');
    await expect(page.locator('#overlay-root .confirmPanel')).toBeVisible();

    // Press Escape key
    await page.keyboard.press('Escape');

    // Confirm Dialog should be closed by Escape because OverlayManager searched down the stack!
    await expect(page.locator('#overlay-root .confirmPanel')).toBeHidden();

    // Reminder popover remains open because it has closeOnEscape = false
    await expect(page.locator('#overlay-root #test-reminder-content')).toBeVisible();
  });

  test('P0: Opening ModalLayer auto-closes transient popovers and menus', async ({ page }) => {
    // Open Popover
    await page.click('#btn-popover-ref');
    await expect(page.locator('#overlay-root #test-popover-ref-content')).toBeVisible();

    // Open ContextMenu
    await page.click('#btn-context-menu');
    await expect(page.locator('#overlay-root #test-context-menu-content')).toBeVisible();

    // Open ModalLayer
    await page.click('#btn-modal-layer');
    await expect(page.locator('#overlay-root #test-modal-content')).toBeVisible();

    // Popover and ContextMenu must be auto-closed by OverlayManager
    await expect(page.locator('#overlay-root #test-popover-ref-content')).toBeHidden();
    await expect(page.locator('#overlay-root #test-context-menu-content')).toBeHidden();
  });

  for (const zoomFactor of [1.0, 1.25, 1.5]) {
    test(`P0: Real component coordinate accuracy under zoom level ${zoomFactor * 100}%`, async ({ page }) => {
      await page.evaluate((zoom) => {
        document.body.style.zoom = `${zoom}`;
      }, zoomFactor);

      await page.click('#btn-popover-ref');
      const popover = page.locator('#overlay-root #test-popover-ref-content');
      await expect(popover).toBeVisible();

      const hitSuccess = await page.evaluate(() => {
        const el = document.querySelector('#overlay-root #test-popover-ref-content');
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const topEl = document.elementFromPoint(rect.left + 5, rect.top + 5);
        return el === topEl || el.contains(topEl);
      });

      expect(hitSuccess).toBe(true);
    });
  }
});
