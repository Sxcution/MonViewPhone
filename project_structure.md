# Project Structure

This file documents the structure of the `stream-phonefarm-solumate-main` project.

## Client (React/Vite)

### Core Files
- `client/src/App.tsx`: Main application component, handles the device grid, drag & drop, and centralized HeaderBar integration. Now includes advanced device group management (focus mode, reordering, and renaming).
- `client/src/main.tsx`: React entry point.
- `client/src/styles.css`: Global CSS with high-density UI optimizations and theme tokens.

### Components
- `client/src/components/DeviceViewer.tsx`: Displays a single device in the expanded viewer mode; UI is optimized to hide redundant controls now present in HeaderBar.
- `client/src/components/HeaderBar.tsx`: Top navigation bar; now hosts centralized device numbering and reordering controls.
- `client/src/components/RightBar.tsx`: Thin right sidebar containing quick action icons (Power, Volume, Home, etc.).
- `client/src/components/SyncPanel.tsx`: Panel for device synchronization settings.
- `client/src/components/ViewerSidePanel.tsx`: Right-side panel specifically for the `DeviceViewer`.

#### Tile Components (Phone Cards)
- `client/src/components/tile/Tile.tsx`: Main component representing a single phone card. Includes onPointerEnter hover focus for Alt-Solo control.
- `client/src/components/tile/TileHeader.tsx`: Header of the phone card (UDID, status, user profile selection).
- `client/src/components/tile/TileMenu.tsx`: Context menu for the phone card.
- `client/src/components/tile/TileNav.tsx`: Bottom navigation buttons on the phone card.
- `client/src/components/tile/types.ts`: TypeScript definitions for tile components.
- `client/src/components/tile/useTileStream.ts`: Custom hook handling the streaming pipeline (WebSocket, decoding, rendering).

### Context & State
- `client/src/context/ActiveContext.tsx`: Manages active/selected devices and synchronization state.
- `client/src/context/I18nContext.tsx`: Handles internationalization/translations.
- `client/src/context/ServerContext.tsx`: Manages backend server API connections.
- `client/src/store/useSyncStore.ts`: Zustand store for sync state.
- `client/src/store/useTileOrder.ts`: Zustand store for managing the order of phone cards.

### Hooks & Libraries
- `client/src/hooks/useDirectKeyboard.ts`: Hook for capturing and forwarding keyboard inputs.
- `client/src/lib/adbStub.ts`: ADB command utilities.
- `client/src/lib/control.ts`: Functions for encoding Scrcpy control messages.
- `client/src/lib/keyEvent.ts`: Android keycode mappings.
- `client/src/lib/serverApi.ts`: API client for the Node.js backend.
- `client/src/lib/touchControls.ts`: Logic for capturing mouse/touch events and sending to device. Now supports isolated control when holding Alt.
- `client/src/lib/video.ts`: Video stream processing utilities.

### Workers
- `client/src/workers/device_worker.worker.ts`: Web Worker for H264 decoding (using tinyh264).
- `client/src/workers/yuvRender.worker.ts`: Web Worker for rendering YUV frames to ImageBitmap.

## Server (Node.js)
- `server/`: Backend service that interfaces with Scrcpy and ADB (Legacy Backend).

## Server Go (Golang Backend)
- `server-go/`: New highly-concurrent backend service written in Go (in active development).
  - `server-go/main.go`: Entry point, includes ADB warm-up logic and HTTP/WebSocket server initialization.
  - `server-go/adb/tracker.go`: ADB device tracker utilizing goroutines.
  - `server-go/websocket/handler.go`: WebSocket communication handler.

## APK Build
- `APK Build/MonKeyboard/`: Android project for the lightweight invisible keyboard (IME).
  - `MonKeyboard/app/src/main/java/com/monkeyboard/ime/MonKeyboardService.java`: Core IME logic.
  - `MonKeyboard/app/src/main/java/com/monkeyboard/ime/MainActivity.java`: Setup guide UI.

