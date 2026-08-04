# MonViewPhone Project Structure

## Current Shape
- `client/`: React + Vite frontend. This is the only frontend source used by `server-go/Start_PhoneFarm.bat`.
- `server-go/`: Go backend. This is the only backend kept in the main project.
- `APK Build/`: Android helper APK source.
- [NEW] [assets/](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/assets): Project assets directory. Contains `IconMonViewPhone.png` (original image) and `IconMonViewPhone.ico` (multi-size Windows icon file).
- `rule.md`: Local development rules and UI interaction notes.
- [NEW] [run.pyw](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/run.pyw): One-click Windows tray launcher and process manager. Validates required files, automatically builds stream-node if missing, manages port conflict resolution, redirects stdout/stderr to `logs/`, starts backend and stream-node, opens Chrome App, and supports automatically closing existing Chrome App windows on restart/exit using PowerShell command execution.
- [NEW] [build_v2_all.bat](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/build_v2_all.bat): Developer batch script to compile and build all components (client frontend, Go backend, and stream-node) in one click.
- [NEW] [logs/](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/logs): Directory containing logs: `launcher.log` (launcher process), `server-go.log` (Go backend stdout/stderr), and `stream-node.log` (stream-node server stdout/stderr).
- [NEW] [Backup/](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/Backup): Local directory for backup data (ignored by Git). Contains `Backup/adb/` for copying and restoring ADB host keys (`adbkey` and `adbkey.pub`) when starting the application.
- [NEW] [packages/apps/CloneAppProxy/](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/packages/apps/CloneAppProxy): Android 13 AOSP privileged proxy app. Launches WeChat clone inside the clone profile from user 0 launcher icon.


Removed legacy layers:
- Root Electron wrapper.
- Legacy Node backend folder.
- Generated frontend build output (`client/dist`).
- Old root launcher scripts.

## Frontend
- `client/src/App.tsx`: Top-level grid/viewer orchestration, device lifecycle, groups, global hotkeys/actions, account-vault expiry scheduling, and composition of the extracted settings, stream, and context-menu modules.
- [NEW] [client/src/components/ui/](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/ui): Core overlay architecture primitives (`OverlayPortal`, `OverlayManager`, `ModalLayer`, `ConfirmDialog`, `ContextMenuLayer`, `AnchoredPopover`, `Tooltip`). Features single `#overlay-root` portal, unified CSS layer token hierarchy (`--md-layer-*`), focus trap, Escape key stack popping, background scroll locking, and viewport edge clamping.
- `client/src/components/AppSettingsModal.tsx`: System settings, hotkey recording, and seeding-content settings.
- `client/src/components/StreamSettingsPanel.tsx`: Grid/viewer stream drafts, validation, auto-apply, reload controls, and bitrate confirmation.
- `client/src/components/DeviceContextMenu.tsx`: Device/group/account right-click actions and their input dialogs.
- `client/src/components/DeviceViewer.tsx`: Expanded single-device viewer, supports Middle Mouse Button click to close and return to grid, features custom keyboard mapping overlays (+ Key) with canvas click coordinates capture, inline key binding input, persistent display toggling, a top-right Save button, and portrait-specific responsive scaling calculations to ensure large display sizes matching landscape.
- `client/src/components/ViewerSidePanel.tsx`: Viewer-side profiles, APK/file import-export, phone file browser, connection selection, and game/key controls.
- `client/src/components/ViewerAdbTools.tsx`: ADB quick-command submenu, draggable console, history, presets, batch execution, logs, and risk confirmation.
- `client/src/components/ViewerAppsMenu.css`: Viewer Apps Menu styles loaded after the global stylesheet to preserve cascade order.
- `client/src/components/SyncPanel.tsx`: Device synchronization UI.
- [NEW] [MacroPlaybackPanel.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/MacroPlaybackPanel.tsx): Standalone component for Macro Playback progress overlay, drag-to-move panel, and interval clock updates. Bypasses re-rendering load from App root.
- [NEW] [SyncTimeSettingsModal.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/SyncTimeSettingsModal.tsx): Standalone non-blocking Sync Time settings component. Features draggable headers, vertical line separator, and toggle buttons positioned before the input fields. Handles input locking/disabling when settings are off. Decoupled from Automation namespace.
- [NEW] [NotesModal.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/NotesModal.tsx): Standalone split sidebar notes modal component. Left side sidebar lists notes with search filter and add button, right side houses the main content text editor, with custom popovers in toolbar for setting datetime reminders and font size zoom level.
- `client/src/components/DeviceAccountOverlay.tsx`: Account Manager window, device/group overview, search/filter/settings, saved-group actions, and vault coordination. Re-exports the per-device panel for existing callers.
- `client/src/components/DeviceAccountPanel.tsx`: Memoized per-device account UI, account/history/context actions, notices, profile mapping, and Risk Nearby behavior. Risk Nearby keeps its 31-day notice and only changes `Risk` to `Live` when due.
- `client/src/components/AutomationModal.tsx`: Automation controller/editor for app actions, macro recording, playback, device assignment, and synchronization.
- `client/src/components/AutomationModalOverlays.tsx`: Delete, input, and device-assignment modal overlays.
- `client/src/components/automationModalUtils.ts`: Automation constants, persistence, sorting, delay, row conversion, and seeding helpers.
- [NEW] [AutomationPanel.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/AutomationPanel.tsx): Quick action slots sidebar panel. Features grid of empty slot buttons (`+`), action selection popovers, context menus to trigger/remove action bindings, settings gear shortcut to show the main modal, and panel toggle state.
- [NEW] [automationData.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/automationData.ts): Shared data types, constants, default seeding list, and local storage read/write functions for the Automation subsystem.
- [NEW] [syncMacroSettings.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/syncMacroSettings.ts): Local storage persistence, normalization, and delay helpers for Sync Macro.
- [NEW] [themeInspector.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/themeInspector.ts): Logic and definitions for Theme Inspector mode, manages COLOR_ROLES, matches hovered elements to active CSS variables via dynamic stylesheet scans, resolves data-inspector-id logic targets, and reads/writes overrides to local storage.
- [MODIFY] [VisualAlertPanel.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/VisualAlertPanel.tsx): Simplified Visual Alert UI panel for multi-ROI red-dot notification detection. Removed sidebar expand behavior, status notification feeds, and action buttons. Settings inputs (Chu kỳ, Lần check, Báo lại) are moved into the Multi-ROI setup modal (renamed to 'Thiết lập Visual Alert'). A Settings gear icon button is added in the panel header actions.
- [NEW] [ThemeInspector.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/ThemeInspector.tsx): Theme color inspector UI. When active, hovers elements to show active theme variables, property matches, and logical target details. Handles normal clicks to copy logical targets, Alt/Shift+Click to copy CSS variables, and Ctrl+Click to open the color editor card.
- `client/src/components/tile/`: Tile-specific helpers, headers, phone controls, and account overlay filter dimming wrapper.
-   - [MODIFY] `Tile.tsx`: Integrates the per-tile Stream Debug Overlay displaying engine, active encoder, resolution, FPS, drops, queue size, and reconnect stats.
-   - [MODIFY] `useTileStream.ts`: Orchestrates the active Tango stream lifecycle, retries, renderer state, reloads, and per-device stream diagnostics.
- `client/src/context/ActiveContext.tsx`: Active device, multi-control, and focus state.
- `client/src/context/I18nContext.tsx`: Translation helper.
- `client/src/context/ServerContext.tsx`: Backend URL state.
- `client/src/hooks/useVisualAlert.ts`: React hook managing stagger-scan loop, per-device confirm count, cooldown tracking, and alert triggering for Visual Alert. Uses `scanCanvasROIs` for multi-ROI detection.
- `client/src/lib/visualAlertEngine.ts`: Pure logic engine for Visual Alert — supports Multi-ROI scanning via `scanCanvasROIs` (iterates each ROI, getImageData per region, counts red pixels per ROI), single-ROI `scanCanvasROI` for modal testing, AudioContext beep sound, browser Notification API. Includes migration from old single-ROI `roi` to new `rois[]` format. Settings persisted in localStorage key: `visualAlertGlobalSettingsV1`.
- `client/src/lib/serverApi.ts`: HTTP API client for the Go backend, containing smart ADB batch parsing helpers (splitCommandBatchSmart and normalizeAdbSegment) and type definitions.
- [MODIFY] `client/src/lib/config.ts`: Defines `STREAM_CONFIG` with `tango-scrcpy` as the only engine, `auto` encoder mode, and defaults of 786,432 bitrate, 15 FPS, and 500 bounds width.
- [NEW] `client/src/stream/StreamEngine.ts`: Interface and types defining start/stop, feedBytes, stats reporting, and callback hooks.
- [NEW] `client/src/stream/render/VideoFrameRenderer.ts`: Abstract base interface for presenting video frames.
- [NEW] `client/src/stream/render/Canvas2DVideoFrameRenderer.ts`: Hardware-accelerated frame rendering using 2D Canvas context for high stability.
- [NEW] `client/src/stream/h264/AccessUnitAssembler.ts`: Re-assembles H.264 slice NAL units into proper Annex-B Access Units required by WebCodecs, with all debug console logging disabled.
- [NEW] `client/src/stream/webcodecs/WebCodecsH264Engine.ts`: Integrates the browser hardware `VideoDecoder` engine with active frame dropping for backpressure control, with all debug console logging disabled.
- [NEW] [backendSettings.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/backendSettings.ts): Client-side REST API poster for device account vault data to `settings` endpoint.
- `client/src/store/useTileOrder.ts`: Persistent device numbering and ordering.
- [MODIFY] `client/src/styles.css`: Ordered global UI styles; the exact duplicate `vsp-ctx-*` block was removed and component-specific Viewer Apps styles now live in `ViewerAppsMenu.css`.
- [NEW] [deviceAccountNearby.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/deviceAccountNearby.ts): Centralized helper for Nearby People logic. Exports `getNearbyAccountState()` (returns `'eligible'`, `'upcoming'`, or `'none'`), `hasNearbyRelevantAccount()`, and `getNearestNearbyHours()`. Uses 3-day window for upcoming state. Imported by both App.tsx and DeviceAccountOverlay.tsx.
- `client/public/audio/`: Directory containing static audio assets, including `notification_new.mp3` for the default alert sound.
- ## Go Backend
- [MODIFY] [main.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/main.go): HTTP/WebSocket entry point, CORS setup, serves React static files, and executes a startup clean-up of stale/leftover scrcpy-server processes on all connected devices.
- [MODIFY] [rest.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/rest.go): REST endpoints used by the frontend, including profile listing, APK install, file import/export, and ADB command execution. Added explicit DB-backed endpoints `/api/goog/device/account-vault` and `/api/goog/device/order`, refactored `/api/goog/device/settings` to act as a pure compatibility wrapper, and added a prioritized fallback MediaStore volume candidate list with sequential try-and-log handling.
- [MODIFY] [account_db.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/account_db.go): SQLite database layer for device accounts (mapped to Data.db). Implements database initialization, syncing client vaults to SQLite tables without destroying `device_order`, and auto-repairing missing device orders. Supports serialization/deserialization of `wechat_launch_profile_json` for WeChat user profile launch mapping.
- [MODIFY] [main.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/main.tsx): App entry point. Refactored startup synchronization logic to always hydrate browser localStorage cache from backend database state, ensuring backend Data.db remains the sole source of truth, and implemented two-way sync on startup to upload local configuration keys (macros, device profiles, quick action slot bindings) to settings.json if they are missing on the backend.
- `server-go/adb/`: ADB helpers and device tracker.
- [MODIFY] `server-go/scrcpy/`: Scrcpy server launch/config helpers. Added `CleanAllMonViewPhoneServers` in `server.go` to cleanly kill any running scrcpy servers on devices during startup.
- `server-go/websocket/`: Device-list and stream proxy WebSocket handlers.
- `server-go/server-go.exe`: Current compiled Go backend binary.
- `server-go/Start_PhoneFarm.bat`: Starts the Go backend server by running the launcher script `run.pyw`.
- `server-go/Start_PhoneFarm_Air.bat`: Optional Go hot-reload launcher for backend development.
- [NEW] [settings.json](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/settings.json): Unified storage for all user settings, device ordering, groups, and automation profiles, persisted directly inside the project directory.
- [NEW] [SetWallpaper.java](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/wallpaper/SetWallpaper.java): Java source file compiled into a dex-based JAR helper (`wallpaper_helper.jar`) which runs on the device via `app_process` to apply wallpapers.
- [MODIFY] [main.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/main.go) & [rest.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/rest.go): Added the `/api/goog/device/set-wallpaper` endpoint to push the helper JAR and image, then run `app_process` to silently apply the generated wallpaper.
- [NEW] [DisplayPower.java](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/displaypower/helper/src/com/monviewphone/displaypower/DisplayPower.java): Java source file compiled into a dex-based JAR helper running on the device via `app_process` to control display power modes using the `SurfaceControl` API.
- [NEW] [build-helper.ps1](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/displaypower/helper/build-helper.ps1): Build script to compile and package the display power helper JAR.
- [NEW] [display_power.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/display_power.go): Go backend service file implementing the `/api/goog/device/display-power` endpoint, including caching of the helper JAR per device and optimized single-shell-call command execution.
- [MODIFY] [main.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/main.go): Registered the `/api/goog/device/display-power` route.
- [NEW] [build-scrcpy-server.ps1](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/build-scrcpy-server.ps1): PowerShell script to recompile and package scrcpy-server.jar from decompiled sources after patching reflection signatures.
- [MODIFY] [scrcpy-server.jar](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/scrcpy-server.jar): Patched scrcpy server JAR containing the updated ClipboardManager class supporting Android 12+ / Pixel ROM clipboard signatures, disabled screen wake-on-join logic in `WebSocketConnection`, disabled screen wake-ups in `Controller` (`turnScreenOn` and `pressBackOrTurnScreenOn` calls disabled), and disabled screen wake-ups in `DesktopConnection$1` on event controller start.
- [NEW] `server-go/scrcpy-smali/`: Decompiled smali source directory of the patched scrcpy server used for applying modifications/patches via apktool.
- [MODIFY] [wifi_mapping.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/adb/wifi_mapping.go): WiFi endpoint-to-serial mapping module. Now persists mappings to `wifi_mapping.json` on disk (survives server restarts), auto-resolves unmapped WiFi endpoints via ADB `getprop ro.serialno` (with fallbacks to `ro.boot.serialno` and `ro.product.serial`), and includes a failed-resolution cache to avoid spamming getprop every 2 seconds.
- [NEW] [wifi_mapping.json](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/wifi_mapping.json): Auto-generated JSON file persisting WiFi endpoint-to-USB-serial mappings. Created/updated automatically by the backend when WiFi connections are established.
- [MODIFY] [ViewerAppsMenu.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/ViewerAppsMenu.tsx): Component sidebar hiển thị "DS ứng dụng" với hover submenus cấp 1 và cấp 2, hỗ trợ các thao tác ghim app, trích xuất APK, đóng app, xóa cache và gỡ cài đặt app kèm modal xác nhận. Được nâng cấp để hỗ trợ ẩn ứng dụng hệ thống qua toggle "Ẩn System", lọc tìm kiếm tên ứng dụng qua thanh search, và kích hoạt mở ứng dụng trực tiếp khi click vào hàng ứng dụng.
- [MODIFY] [app_management.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/app_management.go): Endpoint backend xử lý các tác vụ quản lý ứng dụng Android (danh sách ứng dụng, trích xuất APK, đóng ứng dụng, xóa cache, gỡ cài đặt, và mở/chạy ứng dụng thông qua lệnh monkey).
- [NEW] [AppManagerHelper.java](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/appmanagement/helper/src/com/monviewphone/appmanagement/AppManagerHelper.java): Mã nguồn Java helper chạy trên thiết bị thông qua app_process để lấy danh sách ứng dụng nhanh chóng kèm nhãn và ảnh icon Base64.
- [NEW] [monview-app-management.jar](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/appmanagement/bin/monview-app-management.jar): File build DEX compiled JAR của helper quản lý ứng dụng để đẩy vào thiết bị Android.
- [MODIFY] [devicelist.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/websocket/devicelist.go): Updated `physicalUUIDForDevice` to use `ResolveWifiSerial` (tries in-memory map, then ADB getprop). WiFi entries whose serial cannot be resolved are now skipped entirely from the device list emission to prevent frontend from creating rogue tiles. Also added device hardware properties (model, manufacturer, release version, SDK version, board name, and platform platform) caching and emission, allowing the frontend to immediately detect and prioritize appropriate hardware encoders.

## MCP Server (REST API Gateway)
- [NEW] [C:\Users\Mon\Desktop\Start_MCP_Server.bat](file:///C:/Users/Mon/Desktop/Start_MCP_Server.bat): Desktop Batch script shortcut to quickly start both the Node.js REST server and localtunnel/ngrok from Desktop.
- [NEW] [c:\Users\Mon\Desktop\Protect\MCP Server\](file:///c:/Users/Mon/Desktop/Protect/MCP%20Server): Tách biệt độc lập với MonViewPhone. Chứa mã nguồn REST API server TypeScript + Express, bảo mật sandbox và file cấu hình `.env` trỏ ngược lại `MonViewPhone` workspace.
- [NEW] [docs/MCP_IMPLEMENTATION_PLAN.md](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/docs/MCP_IMPLEMENTATION_PLAN.md): Implementation details for building the MCP server.
- [NEW] [docs/SECURITY.md](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/docs/SECURITY.md): Threat model and sandboxing rules for safe AI workspace access.
- [NEW] [docs/CHATGPT_SETUP.md](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/docs/CHATGPT_SETUP.md): Guide to connect the MCP server to ChatGPT (via ngrok/localtunnel HTTPS mapping).
- [NEW] [docs/ANTIGRAVITY_SETUP.md](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/docs/ANTIGRAVITY_SETUP.md): Configuration guide to connect the MCP server to Antigravity via stdio/SSE.
- [NEW] [docs/DECISIONS.md](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/docs/DECISIONS.md): Architectural decisions and framework selection records.


