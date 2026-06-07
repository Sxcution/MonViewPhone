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

Khi code bất kỳ modal thông báo nào (Xác nhận xoá, Đổi tên, Tạo mới, Nhập dữ liệu...), PHẢI tuân thủ:

1. **Luôn overlay trên tất cả modal/panel khác.** Modal thông báo phải có z-index cao hơn mọi layer trong app:
   - Automation floating layer: `z-index: 26001`
   - → Modal backdrop: **`z-index: 27000`**
   - → Modal overlay: **`z-index: 27001`**
   - → Context menu trên modal: **`z-index: 27000`**

2. **Dùng `createPortal(jsx, document.body)`** để render modal ra ngoài DOM tree của component cha. Không render modal bên trong các container có `transform`, `position: relative`, hoặc `overflow: hidden` — sẽ bị clip/lệch vị trí.

3. **Tuyệt đối không dùng Bootstrap CSS classes cho positioning modal** (`modal`, `modal-dialog-centered`, `modal-backdrop`...) vì project không cài Bootstrap CSS. Dùng **inline styles tự chủ hoàn toàn**:
   - Backdrop: `position: fixed; inset: 0;`
   - Overlay: `position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;`
   - Card: inline `background`, `border`, `border-radius`, `box-shadow`

4. **Không dùng native browser dialogs:** Tuyệt đối không `window.prompt()`, `window.confirm()`, `alert()`, `confirm()`. Thay bằng custom modal (InputModal / ConfirmDeleteModal).

## UI/UX Styling Standard

Lấy **Automation modal** làm chuẩn thiết kế cho toàn bộ project (style giống Bootstrap 5 dark theme):

1. **Bảng màu chuẩn:**
   - Card background: `#1f1f1f`
   - Header/Footer background: `#242424`
   - Border: `1px solid #3c3c3c` (divider: `#343434`)
   - Text chính: `#f3f4f6`
   - Text phụ/label: `#c9d4e5`
   - Shadow: `0 24px 70px rgba(0,0,0,0.58)`
   - Backdrop: `rgba(0,0,0,0.62)`

2. **Button chuẩn:**
   - Base: `height: 34px; font-size: 13px; font-weight: 600; border-radius: 6px; background: #2b2b2b; border: 1px solid #3b3b3b; color: #f8fafc`
   - Active/Primary: `background: rgba(13,110,253,0.22); border-color: rgba(13,110,253,0.75); color: #8ec5ff`
   - Danger: `background: #c0392b; border-color: rgba(192,57,43,0.6); color: #fff`
   - Close button: `30x30, background: #2b2b2b, border: 1px solid #454545, border-radius: 4px`

3. **Input chuẩn:**
   - `background: #181818; border: 1px solid #3c3c3c; border-radius: 4px; color: #f3f4f6; font-size: 14px`

4. **Border-radius:** `6px` cho card/panel/button, `4px` cho input/close button.

5. **Tham chiếu CSS classes chuẩn** (đã định nghĩa trong `styles.css`):
   - `.automationContent`, `.automationHeader`, `.automationBody`, `.automationBtn`, `.automationClose`
   - Khi tạo component mới, style phải khớp với các class trên.
