# MonViewPhone Project Structure

## Current Shape
- `client/`: React + Vite frontend. This is the only frontend source used by `server-go/Start_PhoneFarm.bat`.
- `server-go/`: Go backend. This is the only backend kept in the main project.
- `APK Build/`: Android helper APK source.
- [NEW] [assets/](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/assets): Project assets directory. Contains `IconMonViewPhone.png` (original image) and `IconMonViewPhone.ico` (multi-size Windows icon file).
- `rule.md`: Local development rules and UI interaction notes.
- [NEW] [run.pyw](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/run.pyw): Windows tray launcher and process manager for starting backend and frontend in the background. Handles standalone browser app window launch and loads the custom tray icon from `assets/IconMonViewPhone.png`.

Removed legacy layers:
- Root Electron wrapper.
- Legacy Node backend folder.
- Generated frontend build output (`client/dist`).
- Old root launcher scripts.

## Frontend
- `client/src/App.tsx`: Main UI, device grid, right control panel, group filtering, stream settings, quick controls, context menus, global device actions, Middle Mouse Button (MMB) toggle handler, Sync Time hotkey binding setting, online/all device display filters, global device account search & statistics filtering, parallel quick ADB command execution with bounded concurrency, and WebSocket-based Power key optimization.
- `client/src/components/DeviceViewer.tsx`: Expanded single-device viewer, supports Middle Mouse Button click to close and return to grid.
- `client/src/components/ViewerSidePanel.tsx`: Viewer-side controls for profiles, APK install, file import/export, and ADB commands.
- `client/src/components/SyncPanel.tsx`: Device synchronization UI.
- [NEW] [SyncTimeSettingsModal.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/SyncTimeSettingsModal.tsx): Standalone non-blocking Sync Time settings component. Features draggable headers, vertical line separator, and toggle buttons positioned before the input fields. Handles input locking/disabling when settings are off. Decoupled from Automation namespace.
- [NEW] [DeviceAccountOverlay.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/DeviceAccountOverlay.tsx): Standalone full-screen account manager overlay ("Quản lý tài khoản") for connected devices. Supports persistent drag-to-move repositioning of the overlay card (saved in localStorage), adding/viewing/modifying social media accounts mapped per device UDID. WeChat is the default platform (Tantan, Line, Telegram, and Khác are removed), with dynamic custom group creation (`+` button) and right-click deletion. Supports hover tooltips for device headers showing active notice text, clicking the bell icon (which displays if any account has a notice) to cycle through notice accounts (prioritizing due notices), and turning the account count badge blue when the active WeChat account is eligible for Nearby People. Also flattens the right-click "Tài Khoản" list to switch active accounts immediately on click. Optimized for high-performance rendering: panels are memoized using React.memo, account overlays on tiles are lazy mounted, and localStorage vault loading is centralized to run once in App.tsx to avoid parsing 35 times.
- `client/src/components/AutomationModal.tsx`: Refactored Automation modal focusing only on WeChat/Line/Tantan/Setting App Actions execution and coordinates recorder/playback Macro setting. Features customizable app action renaming/deletion, centralized parent app tabs, separate main/macro status notification states in headers, and togglable click-to-bind macro lists. Exposes playAppAction and playing state via forwardRef useImperativeHandle.
- [NEW] [AutomationPanel.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/AutomationPanel.tsx): Quick action slots sidebar panel. Features grid of empty slot buttons (`+`), action selection popovers, context menus to trigger/remove action bindings, settings gear shortcut to show the main modal, and panel toggle state.
- [NEW] [automationData.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/automationData.ts): Shared data types, constants, default seeding list, and local storage read/write functions for the Automation subsystem.
- [NEW] [syncMacroSettings.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/syncMacroSettings.ts): Local storage persistence, normalization, and delay helpers for Sync Macro.
- [NEW] [themeInspector.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/themeInspector.ts): Logic and definitions for Theme Inspector mode, manages COLOR_ROLES, matches hovered elements to active CSS variables, and reads/writes overrides to local storage.
- [MODIFY] [VisualAlertPanel.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/VisualAlertPanel.tsx): Visual Alert UI panel for multi-ROI red-dot notification detection. Settings, Multi-ROI setup modal with canvas preview and multiple draggable ROI overlays, per-ROI test results, inline rename, toast notifications, and confirm delete ROI overlay modal. Rendered in right config panel.
- [NEW] [ThemeInspector.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/ThemeInspector.tsx): Theme color inspector UI. When active, hovers elements to show active theme variables and actual colors, clicking overrides them via a custom floating editor card.
- `client/src/components/tile/`: Tile-specific helpers, headers, stream hook, phone controls, and account overlay filter dimming wrapper.
- `client/src/context/ActiveContext.tsx`: Active device, multi-control, and focus state.
- `client/src/context/I18nContext.tsx`: Translation helper.
- `client/src/context/ServerContext.tsx`: Backend URL state.
- `client/src/hooks/useVisualAlert.ts`: React hook managing stagger-scan loop, per-device confirm count, cooldown tracking, and alert triggering for Visual Alert. Uses `scanCanvasROIs` for multi-ROI detection.
- `client/src/lib/visualAlertEngine.ts`: Pure logic engine for Visual Alert — supports Multi-ROI scanning via `scanCanvasROIs` (iterates each ROI, getImageData per region, counts red pixels per ROI), single-ROI `scanCanvasROI` for modal testing, AudioContext beep sound, browser Notification API. Includes migration from old single-ROI `roi` to new `rois[]` format. Settings persisted in localStorage key: `visualAlertGlobalSettingsV1`.
- `client/src/lib/serverApi.ts`: HTTP API client for the Go backend.
- `client/src/store/useTileOrder.ts`: Persistent device numbering and ordering.
- `client/src/styles.css`: Main application styling. Defines design tokens, layout styles, and the standardized, unified CSS overlay confirm modal styling system.
- [NEW] [deviceAccountNearby.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/deviceAccountNearby.ts): Centralized helper for Nearby People logic. Exports `getNearbyAccountState()` (returns `'eligible'`, `'upcoming'`, or `'none'`), `hasNearbyRelevantAccount()`, and `getNearestNearbyHours()`. Uses 3-day window for upcoming state. Imported by both App.tsx and DeviceAccountOverlay.tsx.
- `client/public/audio/`: Directory containing static audio assets, including `notification_new.mp3` for the default alert sound.
- 
- 
- ## Go Backend
- `server-go/main.go`: HTTP/WebSocket entry point and CORS setup.
- `server-go/rest.go`: REST endpoints used by the frontend, including profile listing, APK install, file import/export, and ADB command execution.
- `server-go/adb/`: ADB helpers and device tracker.
- `server-go/scrcpy/`: Scrcpy server launch/config helpers.
- `server-go/websocket/`: Device-list and stream proxy WebSocket handlers.
- `server-go/server-go.exe`: Current compiled Go backend binary.
- `server-go/Start_PhoneFarm.bat`: Starts Go backend and Vite frontend.
- `server-go/Start_PhoneFarm_Air.bat`: Optional Go hot-reload launcher for backend development.
- [NEW] [settings.json](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/settings.json): Unified storage for all user settings, device ordering, groups, and automation profiles, persisted directly inside the project directory.
- [NEW] [SetWallpaper.java](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/wallpaper/SetWallpaper.java): Java source file compiled into a dex-based JAR helper (`wallpaper_helper.jar`) which runs on the device via `app_process` to apply wallpapers.
- [MODIFY] [main.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/main.go) & [rest.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/rest.go): Added the `/api/goog/device/set-wallpaper` endpoint to push the helper JAR and image, then run `app_process` to silently apply the generated wallpaper.
- [NEW] [DisplayPower.java](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/displaypower/helper/src/com/monviewphone/displaypower/DisplayPower.java): Java source file compiled into a dex-based JAR helper running on the device via `app_process` to control display power modes using the `SurfaceControl` API.
- [NEW] [build-helper.ps1](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/displaypower/helper/build-helper.ps1): Build script to compile and package the display power helper JAR.
- [NEW] [display_power.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/display_power.go): Go backend service file implementing the `/api/goog/device/display-power` endpoint, including caching of the helper JAR per device and optimized single-shell-call command execution.
- [MODIFY] [main.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/main.go): Registered the `/api/goog/device/display-power` route.
- [NEW] [build-scrcpy-server.ps1](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/build-scrcpy-server.ps1): PowerShell script to recompile and package scrcpy-server.jar from decompiled sources after patching reflection signatures.
- [MODIFY] [scrcpy-server.jar](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/scrcpy-server.jar): Patched scrcpy server JAR containing the updated ClipboardManager class supporting Android 12+ / Pixel ROM clipboard signatures.



