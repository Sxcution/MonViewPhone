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

1. Always use the shared layer tokens instead of one-off z-index values:
   - Automation/floating workspace: `var(--md-layer-workspace)`
   - Parent modal: `var(--md-layer-modal)`
   - Child modal/popover: `var(--md-layer-modal-child)`
   - Notification/emergency confirm: `var(--md-layer-notification)`
   - Context menu: `var(--md-layer-menu)`; a menu owned by a modal may use the child-modal layer.
2. Use `createPortal(jsx, document.body)` to render modals outside the parent component DOM tree. Do not render modals inside containers with `transform`, `position: relative`, or `overflow: hidden`, because they can be clipped or positioned incorrectly.
3. Do not use Bootstrap CSS classes for modal positioning (`modal`, `modal-dialog-centered`, `modal-backdrop`) because this project does not install Bootstrap CSS. Use fully controlled app styles:
   - Backdrop: `position: fixed; inset: 0;`
   - Overlay: `position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;`
   - Card: app-owned `background`, `border`, `border-radius`, and `box-shadow`
4. Do not use native browser dialogs: no `window.prompt()`, `window.confirm()`, `alert()`, or `confirm()`. Use custom app modals such as `InputModal` or `ConfirmDeleteModal`.
5. Any child modal opened from inside a parent modal, including settings/config modals like Sync Macro opened from Thiết Lập Macro, must render through `createPortal(..., document.body)` and use `var(--md-layer-modal-child)` so it appears above the parent, never behind it.

## UI/UX Styling Standard

Use the MonDashboard Home / Dashboard command-center theme as the project styling standard. The old Automation modal gray theme is no longer the source of truth.

1. Design tokens:
   - All new UI styling must use the `--md-*` tokens defined in `client/src/styles.css`.
   - Core tokens: `--md-bg`, `--md-bg-soft`, `--md-header`, `--md-surface`, `--md-surface-2`, `--md-card`, `--md-panel`, `--md-border`, `--md-border-strong`, `--md-text`, `--md-muted`, `--md-primary`, `--md-primary-hover`, `--md-primary-soft`, `--md-danger`, `--md-danger-hover`, `--md-danger-active`, `--md-radius-sm`, `--md-radius-md`, `--md-shadow-soft`, `--md-shadow-panel`.
   - Semantic status tokens: `--md-success`, `--md-warning`, `--md-danger`, `--md-risk`, `--md-verify`, `--md-nearby`, and `--md-wechat`.
   - Typography, control, spacing, and layer values must use the `--md-font-*`, `--md-control-*`, `--md-space-*`, and `--md-layer-*` scales. Do not create one-off pixel values for shared UI.
   - Compatibility tokens such as `--bg-base`, `--bg-panel`, `--border-color`, `--text-main`, and `--accent-color` must map back to the `--md-*` tokens.
2. Surfaces:
   - Body/app background: `var(--md-bg)` with only very subtle cyan/blue radial accents.
   - Card/panel/modal background: `var(--md-card)`.
   - Border: `1px solid var(--md-border)`.
   - Strong/hover border: `var(--md-border-strong)`.
   - Shadow: `var(--md-shadow-soft)` for panels/cards and `var(--md-shadow-panel)` for modal/overlay surfaces.
   - Control/menu border-radius: `var(--md-radius-sm)` (`8px`).
   - Card/modal border-radius: `var(--md-radius-md)` (`12px`).
3. Text:
   - Primary text: `var(--md-text)`.
   - Secondary text/labels: `var(--md-muted)` or `var(--md-text-soft)`.
   - Main accent: `var(--md-primary)`; legacy `--md-info` and `--md-blue` must alias back to that token.
   - Metadata: `var(--md-font-meta)` (`11px`).
   - Help/secondary: `var(--md-font-help)` (`12px`).
   - Body/menu/button: `var(--md-font-body)` (`13px`).
   - Section/field heading: `var(--md-font-section)` (`14px`).
   - Modal/panel title: `var(--md-font-title)` (`16px`).
4. Buttons:
   - Base: `height: var(--md-control-height); border-radius: var(--md-radius-sm); background: var(--md-control-bg); border: 1px solid var(--md-border); color: var(--md-text)`.
   - Compact controls may use `var(--md-control-compact)`; `var(--md-control-large)` is reserved for deliberate large quick actions.
   - Hover: `background: var(--md-control-hover); border-color: var(--md-border-strong)`.
   - Primary/active: `background: var(--md-primary)`; hover uses `var(--md-primary-hover)`.
   - Danger: use `var(--md-danger)`.
   - Shadow/Glow: Never use custom box-shadow, outer glows (hắc sáng), or radial-gradient overlays. All buttons must remain clean, flat, and aligned with design tokens.
5. Inputs/selects:
   - `height: var(--md-control-height); background: var(--md-control-bg); border: 1px solid var(--md-border); border-radius: var(--md-radius-sm); color: var(--md-text)`.
6. Context menus and modals:
   - Keep all Context Menu Quality Rules and Modal Overlay Rules above unchanged.
   - Only change colors, border, radius, shadow, spacing, and hover states unless behavior changes are explicitly requested.
   - Context menus must reuse `.uiMenuSurface`, `.uiMenuItem`, `.uiMenuDivider`, and their semantic variants. Inline styles are allowed only for clamped dynamic `top`/`left` positioning.
7. Spacing:
   - Shared UI spacing is limited to `var(--md-space-1)` (`4px`), `--md-space-2` (`8px`), `--md-space-3` (`12px`), `--md-space-4` (`16px`), and `--md-space-6` (`24px`).
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
- Input/select/field: `var(--md-control-bg)` with `var(--md-border)`
- Hover row: `var(--md-control-hover)`
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

- Default: `var(--md-danger)`
- Hover: `var(--md-danger-hover)`
- Active: `var(--md-danger-active)`

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
- Do not use dark blurred/mờ background overlays unless the user explicitly asks
- Close only by explicit buttons such as `Huỷ`, `Đóng`, `X`, or a confirmed action
- Escape-to-close is allowed only for non-destructive input/config modals; destructive confirm modals should close only by explicit button unless user requests otherwise

Required modal overlay style:

- Overlay/backdrop: `position: fixed; inset: 0; background: transparent; pointer-events: auto`
- Modal layer: centered/floating by app CSS
- Modal card: `var(--md-card)`, `var(--md-border)`, `var(--md-shadow-panel)`

### 7. Modal Stacking Rules

Use z-index layers consistently.

Base app layers:

- Normal UI: below `var(--md-layer-menu)`
- Context menu: `var(--md-layer-menu)`
- Automation/floating workspace: `var(--md-layer-workspace)`
- Parent modal: `var(--md-layer-modal)`
- Child modal/popover: `var(--md-layer-modal-child)`
- Notification/emergency confirm: `var(--md-layer-notification)`
- Inspector/debug tools: `var(--md-layer-inspector)`

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

### 13. Tooltip Display Rules

All tooltips in the application must follow these rules:
- They must display immediately on hover without any delay.
- Use custom floating tooltips (such as portals with `.dav-bell-tooltip-floating` style that follow the mouse cursor) instead of browser-native `title` attribute tooltips to ensure a premium UI/UX experience.

## Scrcpy Server Build Rules

Thu m?c server-go/scrcpy-decompiled l  source code Java c  ch?a do?n code ClipboardManager.java d  du?c fix tham s? deviceId + Looper c?a Android 14. 
N  d ng vai tr  nhu b?n backup m  ngu?n d? sau n y n?u c?n nghi n c?u th m c  th? m? ra xem, nhung TUY?T  ?I KH NG  U?C d ng script d? build l?i to n b? scrcpy-server.jar t? thu m?c d  n?a (do WebSocket Core s? b? h?ng v  g y l?i "Waiting for response").
N?u c?n s?a file jar, h y d ng phuong ph p Smali Injection: gi?i n n classes.dex t? file scrcpy-server.jar g?c dang ch?y, d?ch ngu?c b?ng baksmali, ch p d  file smali c?n s?a, r?i build l?i classes.dex b?ng smali v  d ng g i l?i v o jar b?ng l?nh jar uf.


## SCRCPY BUILD RULE
Tuy?t d?i KH NG d ng script d? build l?i to n b? scrcpy-server.jar t? thu m?c scrcpy-decompiled (v  s? l m h?ng WebSocket Core). Thu m?c scrcpy-decompiled ch? gi? l?i d? tham kh?o m  ngu?n (ch?a do?n code fix ClipboardManager v  Android 14/15). N?u c?n patch scrcpy-server.jar, h y d ng c ng c? apktool d? decompile ra file .smali, s?a file .smali, v  recompile l?i b?ng apktool b.

## Rules for Number Inputs
1. Trong c c   nh?p S?, lu n lu n b? thanh Tang/Gi?m (spinner controls).
   - Web (CSS): input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
   - Desktop (QSS): QSpinBox::up-button, QSpinBox::down-button { width: 0; }

## Account Overlay — Two Distinct UI States (CRITICAL: Do NOT confuse these)

This project has two completely different UI concepts that are both related to "account overlay".
Future AI sessions MUST understand the distinction before modifying any filtering,
border-highlight, or overlay-related logic.

---

### 1. Account Manager Panel (always visible, left side)

- **Variable:** `accountManagerOpen` (boolean state in App.tsx)
- **Trigger:** Toggled by a persistent button/tab in the UI — NOT a hotkey.
- **What it is:** The main left-side panel that lists all accounts per device.
  It stays open in the DOM when active and does NOT disappear on hotkey press.
- **Role in filtering:** When `accountManagerOpen === true`, the filter toolbar
  (platform tab + filter dropdown) becomes active.
  `davActiveTab` (e.g. `wechat`) and `davActiveFilter`
  (e.g. `nearby_people`, `die`, `risk`, `default`) are only meaningful when this panel is open.
- **If `accountManagerOpen === false`:** No border highlights appear on any tile.

---

### 2. Device Account Overlay — Hotkey-toggled per-tile floating card

- **Variable:** `deviceAccountOverlayOpen` (boolean state in App.tsx)
- **Trigger:** A global hotkey (e.g. Alt+A). Press once = OPEN. Press again = CLOSE.
- **What it is:** A floating account card rendered ON TOP OF each device tile in the grid,
  showing account info directly on the tile. This is what the user means by
  "Overlay On" and "Overlay Off".

#### Overlay ON (`deviceAccountOverlayOpen === true`):
- The full account overlay card is shown on each tile (CSS class: `is-open`).
- Tiles whose accounts do NOT match the active filter are dimmed (grayscale + low brightness),
  but opacity stays at 1.0 (NOT transparent).
- Tiles whose accounts DO match show a colored border via `highlightFilterMatched`.

#### Overlay OFF (`deviceAccountOverlayOpen === false`):
- The overlay card collapses to a compact header strip at the top of each tile
  (CSS class: `is-header-only`). Only the account name row is visible.
- Tiles are NOT dimmed at all — no opacity or grayscale changes.
- Matched tiles still show a colored border highlight (`highlightFilterMatched`).
- No visual penalty for non-matching tiles.

---

### 3. Border Highlight Color Rules (`highlightFilterMatched` prop on `<Tile>`)

Border colors are determined by the ACTIVE filter, not by account status alone.
Die/Risk colors do NOT always show — they only show when their filter is selected.

| `davActiveFilter` value | Condition on tile | Border color |
|---|---|---|
| `nearby_people` | Account group state = `eligible` | Blue |
| `nearby_people` | Account group state = `upcoming` | Yellow |
| `die` | Any account has `status === "Die"` | Red |
| `risk` | Any account has `status === "Risk"` | Orange |
| any other / no match | — | No border (`false`) |

**Priority rule:** `nearby_people` is evaluated FIRST.
If a tile has Die accounts AND also qualifies for the nearby_people filter,
and the user has selected `nearby_people` filter → show Blue/Yellow (nearby color), NOT Red.
Die/Risk colors only show when their respective filter (`die` / `risk`) is explicitly active.

**Guard rule:** `accountManagerOpen` must be `true` for any border to appear.
If the Account Manager Panel is closed → always return `false` (no borders at all).

---

### 4. State variable reference

| Variable | Type | Meaning |
|---|---|---|
| `accountManagerOpen` | boolean | Is the left Account Manager Panel open? |
| `deviceAccountOverlayOpen` | boolean | Is the per-tile hotkey overlay currently ON? |
| `davActiveTab` | string | Platform tab (e.g. `wechat`) |
| `davActiveFilter` | string | Filter mode: `default`, `nearby_people`, `die`, `risk` |
| `isFilteredOut` | boolean per tile | Tile does NOT match filter (used to dim tile when overlay ON) |
| `isAccountMatched` | boolean per tile | Tile DOES match filter (used for border highlight) |
| `highlightFilterMatched` | `false` or color string | Border color: `blue`, `yellow`, `red`, `orange`, or `false` |
## UI Inspector ID / Data Attribute Rules

Khi tạo mới hoặc chỉnh sửa bất kỳ UI nào trong frontend, đặc biệt là button, badge, modal, panel, sidebar, context menu, dropdown, tooltip, tab, input, card, section hoặc overlay, bắt buộc phải gắn đầy đủ Inspector ID để sau này có thể dùng Inspector ID click vào UI và copy đúng target cho AI IDE sửa code.

Mỗi UI target quan trọng phải có đủ các thuộc tính:

```tsx
data-inspector-id="domain.area.element"
data-inspector-label="Human readable label"
data-inspector-component="client/src/path/to/Component.tsx"
```

Quy tắc đặt tên:

* `data-inspector-id` phải là tên kỹ thuật ổn định, không dùng tiếng Việt, không dùng khoảng trắng, không dùng text hiển thị làm ID chính
* Format chuẩn: `domain.area.element`
* Ví dụ đúng:

  * `visualAlert.modalSaveButton`
  * `visualAlert.modalTitle`
  * `rightSidebar.settingsButton`
  * `deviceAccount.totalAccountsBadge`
  * `automation.actionButton`
  * `syncTime.settingsModal`
* Không dùng tên quá chung cho UI cụ thể:

  * Sai: `button.generic`
  * Sai: `text.primary`
  * Sai: `section.background`
  * Sai: `modal.background`
* Nếu nhiều element dùng chung class, bắt buộc phải có Inspector ID riêng cho từng element để tránh AI IDE không biết đang chỉ nút nào

Ví dụ button chuẩn:

```tsx
<button
  className="visualAlertModalBtn primary"
  data-inspector-id="visualAlert.modalSaveButton"
  data-inspector-label="Visual Alert modal save button"
  data-inspector-component="client/src/components/VisualAlertPanel.tsx"
>
  Lưu
</button>
```

Ví dụ badge chuẩn:

```tsx
<span
  className="dav-total-badge"
  data-inspector-id="deviceAccount.totalAccountsBadge"
  data-inspector-label="Device account total accounts badge"
  data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
>
  {totalAccounts}
</span>
```

Ví dụ modal chuẩn:

```tsx
<div
  className="visualAlertModalCard visualAlertModalCardWide"
  data-inspector-id="visualAlert.modalCard"
  data-inspector-label="Visual Alert modal card"
  data-inspector-component="client/src/components/VisualAlertPanel.tsx"
>
```

Với list item render động, có thể dùng chung `data-inspector-id` theo loại element, nhưng `data-inspector-label` nên kèm tên item thực tế nếu có.

Ví dụ:

```tsx
<div
  className="visualAlertROIItem"
  data-inspector-id="visualAlert.roiItem"
  data-inspector-label={`Visual Alert ROI item: ${roi.name}`}
  data-inspector-component="client/src/components/VisualAlertPanel.tsx"
>
```

Khi sửa hoặc tạo UI mới, không được chỉ tạo class CSS mà bỏ qua Inspector ID. Class CSS dùng cho style, còn Inspector ID dùng để định danh UI target cho AI IDE sửa đúng logic.

Mục tiêu bắt buộc: khi bật Inspector ID và click vào UI, clipboard phải cho ra target rõ ràng như:

```text
Inspector ID Target: visualAlert.modalSaveButton
Label: Visual Alert modal save button
Selector: [data-inspector-id="visualAlert.modalSaveButton"]
Class: .visualAlertModalBtn.primary
Component: client/src/components/VisualAlertPanel.tsx
UI Text: Lưu
Title:
Aria Label:
Style Variable: --mvp-button-bg
Property: background-color
```

Nếu output vẫn ra các target chung như `button.generic`, `text.primary`, `section.background`, `modal.background` cho một UI cụ thể thì xem như UI đó chưa được đặt Inspector ID đầy đủ và cần bổ sung ngay.

## Mon WeChat Notify Helper

Media batch import and the standalone-compatible WeChat notification listener
share one APK:

```text
server-go\mediaimport\bin\Monhelper.apk
```

Keep package `com.monviewphone.mediaimport` and provider authority
`content://com.monviewphone.mediaimport` for upgrade compatibility. The owner
listener component is
`com.monviewphone.mediaimport/com.monviewphone.mediaimport.WechatNotificationListener`.
Do not enable it fleet-wide while Nova's
`com.teslacoilsw.launcher/mon.space.WechatNotificationListener` is active.
Never disable Nova's own notification-dots listener.

`client/src/lib/wechatNotifyLog.ts` parses the compatible `MonWechatNotify`
format, but it currently has no active `App.tsx` caller. Do not restore the old
3.5-second fleet logcat poll because it caused long-session lag.

Detailed notes live in `docs/WECHAT_NOTIFY_HELPER.md`.

## Work Logging Protocol (Nhật ký làm việc)

1. **Mandatory Work Log File (`work_log.md`):** Whenever the AI performs coding, development, or research tasks in this project, it MUST maintain a `work_log.md` file at the root of the project.
2. **Date Grouping:** Group all entries by date (`## YYYY-MM-DD` based on local system time). If today's block exists, append under it directly. Do not duplicate the date heading.
3. **Timestamped Entries:** Every entry must start with a `HH:MM` timestamp (local time) in the format: `- **HH:MM**: [Description in Vietnamese/bilingual]`.
4. **Content Requirements:** Record bug discoveries (symptom + root cause), failed attempts (what was tried, why it failed), successful solutions (what worked, why it resolved), and crucial learnings/gotchas to avoid.


