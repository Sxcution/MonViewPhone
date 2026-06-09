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
- `client/src/App.tsx`: Main UI, device grid, right control panel, group filtering, stream settings, quick controls, context menus, global device actions, Middle Mouse Button (MMB) toggle handler, Sync Time hotkey binding setting, and online/all device display filters.
- `client/src/components/DeviceViewer.tsx`: Expanded single-device viewer, supports Middle Mouse Button click to close and return to grid.
- `client/src/components/ViewerSidePanel.tsx`: Viewer-side controls for profiles, APK install, file import/export, and ADB commands.
- `client/src/components/SyncPanel.tsx`: Device synchronization UI.
- [NEW] [SyncTimeSettingsModal.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/SyncTimeSettingsModal.tsx): Standalone non-blocking Sync Time settings component. Features draggable headers, vertical line separator, and toggle buttons positioned before the input fields. Handles input locking/disabling when settings are off. Decoupled from Automation namespace.
- `client/src/components/AutomationModal.tsx`: Refactored Automation modal focusing only on WeChat/Line/Tantan/Setting App Actions execution and coordinates recorder/playback Macro setting. Obsolete nested device selection list and Seeding jobs removed. Sync Macro settings integrated with custom SyncTimeSettingsModal overlay. Exposes playAppAction and playing state via forwardRef useImperativeHandle.
- [NEW] [AutomationPanel.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/AutomationPanel.tsx): Quick action slots sidebar panel. Features grid of empty slot buttons (`+`), action selection popovers, context menus to trigger/remove action bindings, settings gear shortcut to show the main modal, and panel toggle state.
- [NEW] [automationData.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/automationData.ts): Shared data types, constants, default seeding list, and local storage read/write functions for the Automation subsystem.
- [NEW] [syncMacroSettings.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/syncMacroSettings.ts): Local storage persistence, normalization, and delay helpers for Sync Macro.
- [MODIFY] [VisualAlertPanel.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/VisualAlertPanel.tsx): Visual Alert UI panel for multi-ROI red-dot notification detection. Settings, Multi-ROI setup modal with canvas preview and multiple draggable ROI overlays, per-ROI test results, inline rename, toast notifications, and confirm delete ROI overlay modal. Rendered in right config panel.
- `client/src/components/tile/`: Tile-specific helpers, headers, stream hook, and phone controls.
- `client/src/context/ActiveContext.tsx`: Active device, multi-control, and focus state.
- `client/src/context/I18nContext.tsx`: Translation helper.
- `client/src/context/ServerContext.tsx`: Backend URL state.
- `client/src/hooks/useVisualAlert.ts`: React hook managing stagger-scan loop, per-device confirm count, cooldown tracking, and alert triggering for Visual Alert. Uses `scanCanvasROIs` for multi-ROI detection.
- `client/src/lib/visualAlertEngine.ts`: Pure logic engine for Visual Alert — supports Multi-ROI scanning via `scanCanvasROIs` (iterates each ROI, getImageData per region, counts red pixels per ROI), single-ROI `scanCanvasROI` for modal testing, AudioContext beep sound, browser Notification API. Includes migration from old single-ROI `roi` to new `rois[]` format. Settings persisted in localStorage key: `visualAlertGlobalSettingsV1`.
- `client/src/lib/serverApi.ts`: HTTP API client for the Go backend.
- `client/src/store/useTileOrder.ts`: Persistent device numbering and ordering.
- `client/src/styles.css`: Main application styling. Defines design tokens, layout styles, and the standardized, unified CSS overlay confirm modal styling system.
- `client/public/audio/`: Directory containing static audio assets, including `notification_new.mp3` for the default alert sound.


## Go Backend
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


