# Project Rules

## Context Menu Quality Rules

These rules exist because context menus/submenus can easily close before the intended click handler runs.

1. Context menu panels must have a stable wrapper class, such as `contextMenuPanel`, and global outside-click handlers must treat that wrapper as inside the menu.
2. Do not control submenu visibility by mutating DOM styles with `nextElementSibling.style.display`. Use React state instead.
3. Keep submenus open from the parent wrapper, not only from the parent button. The hover area must include both the trigger row and the submenu.
4. Avoid gaps between the parent menu and submenu. If needed, overlap by a few pixels, for example `left: calc(100% - 4px)`.
5. For menu actions that can close/unmount the menu, prefer `onPointerDown` with `preventDefault()` and `stopPropagation()` so the action runs before outside-click logic can close the menu.
6. The menu panel should stop `mousedown`, `click`, and `contextmenu` propagation.
7. Reset submenu state whenever the main context menu closes or switches target.
8. Disabled menu items should be visibly disabled and must return early in the handler.
9. When adding devices to an existing group:
   - If the right-clicked device is part of the current selection, apply the action to the current selection.
   - Otherwise, apply the action only to the right-clicked device.
   - Add only devices that are not already in the target group.
10. After changing context menu behavior, run `npm run build` in `client/` and manually test:
   - Open context menu.
   - Hover submenu trigger.
   - Move into submenu without it disappearing.
   - Click an enabled submenu item.
   - Confirm the state changed and the menu closed.
   - Click a disabled item and confirm nothing changes.

## Modal Overlay Rules

When coding any notification modal such as confirm delete, rename, create, or input, follow these rules:

1. Always overlay above all other modals/panels. Notification modals must use z-index values higher than every other app layer:
   - Automation floating layer: `z-index: 26001`
   - Modal backdrop: `z-index: 27000`
   - Modal overlay/card content: `z-index: 27001`
   - Context menu on modal: `z-index: 27000`
2. Use `createPortal(jsx, document.body)` to render modals outside the parent component DOM tree. Do not render modals inside containers with `transform`, `position: relative`, or `overflow: hidden`, because they can be clipped or positioned incorrectly.
3. Do not use Bootstrap CSS classes for modal positioning (`modal`, `modal-dialog-centered`, `modal-backdrop`) because this project does not install Bootstrap CSS. Use fully controlled app styles:
   - Backdrop: `position: fixed; inset: 0;`
   - Overlay: `position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;`
   - Card: app-owned `background`, `border`, `border-radius`, and `box-shadow`
4. Do not use native browser dialogs: no `window.prompt()`, `window.confirm()`, `alert()`, or `confirm()`. Use custom app modals such as `InputModal` or `ConfirmDeleteModal`.
5. Any child modal opened from inside a parent modal, including settings/config modals like Sync Macro opened from Thi·∫øt L·∫≠p Macro, must render through `createPortal(..., document.body)` and use the same top overlay layer (`z-index: 27000+`) so it appears above the parent, never behind it.

## UI/UX Styling Standard

Use the MonDashboard Home / Dashboard command-center theme as the project styling standard. The old Automation modal gray theme is no longer the source of truth.

1. Design tokens:
   - All new UI styling must use the `--md-*` tokens defined in `client/src/styles.css`.
   - Core tokens: `--md-bg`, `--md-bg-soft`, `--md-header`, `--md-surface`, `--md-card`, `--md-panel`, `--md-border`, `--md-border-strong`, `--md-text`, `--md-muted`, `--md-info`, `--md-blue`, `--md-danger`, `--md-radius-sm`, `--md-shadow-soft`, `--md-shadow-panel`.
   - Compatibility tokens such as `--bg-base`, `--bg-panel`, `--border-color`, `--text-main`, and `--accent-color` must map back to the `--md-*` tokens.
2. Surfaces:
   - Body/app background: `var(--md-bg)` with only very subtle cyan/blue radial accents.
   - Card/panel/modal background: `var(--md-card)`.
   - Border: `1px solid var(--md-border)`.
   - Strong/hover border: `var(--md-border-strong)`.
   - Shadow: `var(--md-shadow-soft)` for panels/cards and `var(--md-shadow-panel)` for modal/overlay surfaces.
   - Main border-radius: `8px`.
3. Text:
   - Primary text: `var(--md-text)`.
   - Secondary text/labels: `var(--md-muted)` or `var(--md-text-soft)`.
   - Accent states: cyan/blue via `var(--md-info)` and `var(--md-blue)`.
4. Buttons:
   - Base: `height: 34px; border-radius: 8px; background: rgba(255,255,255,.055); border: 1px solid var(--md-border); color: var(--md-text)`.
   - Hover: `background: rgba(255,255,255,.09); border-color: var(--md-border-strong)`.
   - Primary/active: `background: linear-gradient(135deg, var(--md-info), var(--md-blue))`.
   - Danger: use `var(--md-danger)`.
   - Shadow/Glow: Never use custom box-shadow, outer glows (h·∫Øc s√°ng), or radial-gradient overlays. All buttons must remain clean, flat, and aligned with design tokens.
5. Inputs/selects:
   - `background: rgba(255,255,255,.055); border: 1px solid var(--md-border); border-radius: 8px; color: var(--md-text)`.
6. Context menus and modals:
   - Keep all Context Menu Quality Rules and Modal Overlay Rules above unchanged.
   - Only change colors, border, radius, shadow, spacing, and hover states unless behavior changes are explicitly requested.
## Strict UI Consistency Rules

These rules are mandatory. Do not create new visual styles, colors, modal behavior, panel backgrounds, or button variants unless the user explicitly asks for a new design system.

### 1. Single Source of Truth for Colors

All UI colors must come from `client/src/styles.css` design tokens.

Allowed main tokens:

- App background: `var(--md-bg)`
- Deep background: `var(--md-bg-soft)`
- Header/sidebar dark surface: `var(--md-header)` or `var(--md-surface)`
- Card/panel/modal surface: `var(--md-card)` or `var(--md-panel)`
- Nested/secondary surface: `var(--md-surface-2)`
- Normal border: `var(--md-border)`
- Strong/hover border: `var(--md-border-strong)`
- Primary text: `var(--md-text)`
- Secondary text: `var(--md-text-soft)`
- Muted text: `var(--md-muted)`
- Blue/cyan accent: `var(--md-info)` or `var(--md-blue)`
- Success: `var(--md-success)`
- Warning: `var(--md-warning)`
- Danger/delete: `var(--md-danger)`

Do not hardcode new gray colors such as:

- `#202020`
- `#242424`
- `#252525`
- `#2b2b2b`
- random `rgba(255,255,255,...)` values

Exception: legacy code may still contain old values, but any new change must migrate the touched area back to tokens.

### 2. Surface Hierarchy

Every new UI block must follow this hierarchy:

- Main app/page background: `var(--md-bg)`
- Large section container: `var(--md-card)`
- Inner/nested section: `var(--md-surface-2)`
- Input/select/field: `rgba(255,255,255,.055)` with `var(--md-border)`
- Hover row: `rgba(255,255,255,.06)` or `rgba(255,255,255,.09)`
- Border: always `1px solid var(--md-border)`

Do not make one section lighter/darker than sibling sections unless it is an intentional active/selected state.

Example:
Automation section and Profile section must use the same base surface color. Do not style Profile with a lighter gray background while Automation uses the standard dark card background.

### 3. No Inline Visual Styling for Shared UI

Do not add inline styles for common UI appearance.

Forbidden for shared UI:

- `style={{ background: ... }}`
- `style={{ borderColor: ... }}`
- `style={{ color: ... }}`
- `style={{ borderRadius: ... }}`
- `style={{ boxShadow: ... }}`

Use CSS classes instead.

Allowed inline styles only for dynamic positioning or measured values, for example:

- `left`
- `top`
- `width`
- `height`
- `transform`
- CSS variables like `--x`, `--y`, `--viewer-width`

### 4. Standard Buttons

All new buttons must use shared classes.

Required classes:

- `.modalBtn` for cancel/neutral
- `.modalBtnPrimary` for save/apply/confirm normal action
- `.modalBtnDanger` for delete/remove/reset-danger action
- `.rcpBtn` / `.rcpIconBtn` / `.rcpMiniBtn` for right panel buttons
- Never apply outer box-shadows, hover float translation (translateY), or radial gradients to buttons. Keep them flat.

Danger buttons must use real red, not pink.

Danger color:

- Default: `#dc2626`
- Hover: `#b91c1c`
- Active: `#991b1b`

Do not use `#e94560` for delete buttons because it looks pink in the current theme.

### 5. Standard Panel / Section Style

All right-panel sections must use one shared visual contract.

Required section style:

- background: `var(--md-card)`
- border: `1px solid var(--md-border)`
- border-radius: `var(--md-radius-sm)`
- text: `var(--md-text)`
- title/header background must not introduce a lighter gray strip unless all sibling sections use the same header treatment

If adding a new section such as Profile, Automation, ADB, Sync, Visual Alert, or Stream Config, it must visually match existing `.rcpSection`.

### 6. Modal Behavior Rules

All new modals must follow this behavior:

- Render with `createPortal(..., document.body)`
- Must appear above all current panels/modals
- Opening a child modal from another modal must place the child modal above the parent modal
- Do not close when clicking outside the modal card
- Do not close when clicking the transparent overlay
- The overlay may block interaction behind the modal, but must not visually dim or blur the app
- Do not use dark blurred/m·ªù background overlays unless the user explicitly asks
- Close only by explicit buttons such as `Hu·ª∑`, `ƒê√≥ng`, `X`, or a confirmed action
- Escape-to-close is allowed only for non-destructive input/config modals; destructive confirm modals should close only by explicit button unless user requests otherwise

Required modal overlay style:

- Overlay/backdrop: `position: fixed; inset: 0; background: transparent; pointer-events: auto`
- Modal layer: centered/floating by app CSS
- Modal card: `var(--md-card)`, `var(--md-border)`, `var(--md-shadow-panel)`

### 7. Modal Stacking Rules

Use z-index layers consistently.

Base app layers:

- Normal UI: below `10000`
- Context menu: `20000+`
- Automation floating layer: `26001`
- Parent modal overlay: `27000`
- Parent modal card: `27001`
- Child modal overlay: `28000`
- Child modal card: `28001`
- Emergency confirm/delete modal: `29000+`

Never render a child modal inside the DOM of a parent modal if the parent has transform, overflow, or positioning that can clip it.

### 8. Standard Modal Types

All confirm/delete/warning/input modals must reuse shared modal components or shared CSS classes.

Required modal types:

- Confirm modal
- Delete/Danger confirm modal
- Input modal
- Warning/info modal

Do not create another one-off modal with its own colors and spacing.

Before creating a new modal, check if one of these already exists:

- `confirmOverlay`
- `confirmPanel`
- `confirmText`
- `confirmActions`
- `modalBtn`
- `modalBtnPrimary`
- `modalBtnDanger`
- existing input modal component

### 9. Native Dialogs Are Forbidden

Never use:

- `alert()`
- `window.alert()`
- `confirm()`
- `window.confirm()`
- `prompt()`
- `window.prompt()`

Use app modal components only.

### 10. Required Audit Before Finishing UI Work

After any UI/style/modal change, search the touched files for:

- `background: '#`
- `background: "#`
- `borderColor: '#`
- `color: '#`
- `#e94560`
- `#202020`
- `#242424`
- `confirmOverlay`
- `modalBtnPrimary`
- `window.alert`
- `window.confirm`
- `window.prompt`

If any hardcoded value remains in the touched UI area, either replace it with a token/class or explain why it is dynamic and unavoidable.

### 11. Build Requirement

After UI/style/modal changes, run:

`cd client && npm run build`

Do not report the task as finished if the build fails.

### 12. Dynamic List Scrolling Rules

All UI lists, grids, or containers that display dynamic data (such as profile lists, macro lists, device tables, etc.) must always be styled with scrolling constraints to prevent layout explosion when the number of items grows:
- Use a container with a fixed or maximum height (`height` or `max-height`).
- Use `display: flex` and `flex-direction: column` on the column/panel wrappers, and set `height: 100%` on these column wrappers if they reside within grid cells or flex cells.
- Set `flex: 1; min-height: 0; overflow-y: auto;` on the list/grid content wrappers to force scrollbars to appear and prevent them from stretching their parent containers.
## Scrcpy Server Build Rules

Thu m?c server-go/scrcpy-decompiled l‡ source code Java cÛ ch?a do?n code ClipboardManager.java d„ du?c fix tham s? deviceId + Looper c?a Android 14. 
NÛ dÛng vai trÚ nhu b?n backup m„ ngu?n d? sau n‡y n?u c?n nghiÍn c?u thÍm cÛ th? m? ra xem, nhung TUY?T –?I KH‘NG –U?C d˘ng script d? build l?i to‡n b? scrcpy-server.jar t? thu m?c dÛ n?a (do WebSocket Core s? b? h?ng v‡ g‚y l?i "Waiting for response").
N?u c?n s?a file jar, h„y d˘ng phuong ph·p Smali Injection: gi?i nÈn classes.dex t? file scrcpy-server.jar g?c dang ch?y, d?ch ngu?c b?ng baksmali, chÈp dË file smali c?n s?a, r?i build l?i classes.dex b?ng smali v‡ dÛng gÛi l?i v‡o jar b?ng l?nh jar uf.


## SCRCPY BUILD RULE
Tuy?t d?i KH‘NG d˘ng script d? build l?i to‡n b? scrcpy-server.jar t? thu m?c scrcpy-decompiled (vÏ s? l‡m h?ng WebSocket Core). Thu m?c scrcpy-decompiled ch? gi? l?i d? tham kh?o m„ ngu?n (ch?a do?n code fix ClipboardManager v‡ Android 14/15). N?u c?n patch scrcpy-server.jar, h„y d˘ng cÙng c? apktool d? decompile ra file .smali, s?a file .smali, v‡ recompile l?i b?ng apktool b.

## Rules for Number Inputs
1. Trong c·c Ù nh?p S?, luÙn luÙn b? thanh Tang/Gi?m (spinner controls).
   - Web (CSS): input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
   - Desktop (QSS): QSpinBox::up-button, QSpinBox::down-button { width: 0; }

