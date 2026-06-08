# MonViewPhone Project Structure

## Current Shape
- `client/`: React + Vite frontend. This is the only frontend source used by `server-go/Start_PhoneFarm.bat`.
- `server-go/`: Go backend. This is the only backend kept in the main project.
- `APK Build/`: Android helper APK source.
- `rule.md`: Local development rules and UI interaction notes.

Removed legacy layers:
- Root Electron wrapper.
- Legacy Node backend folder.
- Generated frontend build output (`client/dist`).
- Old root launcher scripts.

## Frontend
- `client/src/App.tsx`: Main UI, device grid, right control panel, group filtering, stream settings, quick controls, context menus, global device actions, and Middle Mouse Button (MMB) toggle handler.
- `client/src/components/DeviceViewer.tsx`: Expanded single-device viewer, supports Middle Mouse Button click to close and return to grid.
- `client/src/components/ViewerSidePanel.tsx`: Viewer-side controls for profiles, APK install, file import/export, and ADB commands.
- `client/src/components/SyncPanel.tsx`: Device synchronization UI.
- `client/src/components/AutomationModal.tsx`: Automation modal with Action + Device Profile + Macro binding system. Manages macro recording/playback, app actions (WeChat/Line/Tantan/Setting), and device profile assignment. Data persisted in localStorage keys: `automationMacrosV1`, `automationAppActionsV1`, `automationDeviceProfilesV1`.
- [MODIFY] [VisualAlertPanel.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/VisualAlertPanel.tsx): Visual Alert UI panel for multi-ROI red-dot notification detection. Settings, Multi-ROI setup modal with canvas preview and multiple draggable ROI overlays, per-ROI test results, inline rename, toast notifications, and confirm delete ROI overlay modal. Rendered in right config panel.
- `client/src/components/tile/`: Tile-specific helpers, headers, stream hook, and phone controls.
- `client/src/context/ActiveContext.tsx`: Active device, multi-control, and focus state.
- `client/src/context/I18nContext.tsx`: Translation helper.
- `client/src/context/ServerContext.tsx`: Backend URL state.
- `client/src/hooks/useVisualAlert.ts`: React hook managing stagger-scan loop, per-device confirm count, cooldown tracking, and alert triggering for Visual Alert. Uses `scanCanvasROIs` for multi-ROI detection.
- `client/src/lib/visualAlertEngine.ts`: Pure logic engine for Visual Alert — supports Multi-ROI scanning via `scanCanvasROIs` (iterates each ROI, getImageData per region, counts red pixels per ROI), single-ROI `scanCanvasROI` for modal testing, AudioContext beep sound, browser Notification API. Includes migration from old single-ROI `roi` to new `rois[]` format. Settings persisted in localStorage key: `visualAlertGlobalSettingsV1`.
- `client/src/lib/serverApi.ts`: HTTP API client for the Go backend.
- `client/src/store/useTileOrder.ts`: Persistent device numbering and ordering.
- `client/src/styles.css`: Main application styling.
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
