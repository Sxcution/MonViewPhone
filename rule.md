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

