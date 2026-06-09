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
5. Any child modal opened from inside a parent modal, including settings/config modals like Sync Macro opened from Thiết Lập Macro, must render through `createPortal(..., document.body)` and use the same top overlay layer (`z-index: 27000+`) so it appears above the parent, never behind it.

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
5. Inputs/selects:
   - `background: rgba(255,255,255,.055); border: 1px solid var(--md-border); border-radius: 8px; color: var(--md-text)`.
6. Context menus and modals:
   - Keep all Context Menu Quality Rules and Modal Overlay Rules above unchanged.
   - Only change colors, border, radius, shadow, spacing, and hover states unless behavior changes are explicitly requested.
