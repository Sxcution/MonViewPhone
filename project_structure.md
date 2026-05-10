# MonViewPhone Project Structure

## Core Features
- **Alt-Solo Precision**: Hover-based individual device control via Alt key (using `PointerEnter`/`PointerLeave`).
- **Sidebar & UI Stability**: Robust event handling to prevent unintended sidebar hiding during context menu interactions.
- **Modern Dark Theme**: Comprehensive design system using CSS variables (`--bg-base`, `--bg-panel`, etc.) for a consistent anti-glare UI.

## Client (React/Vite)

### Core Files
- `client/src/App.tsx`: Main application component. Manages the device grid, sidebar states (pinned/auto-hide), and global event listeners. Now includes advanced device group management (focus mode, reordering, and renaming).
- `client/src/main.tsx`: React entry point.
- `client/src/styles.css`: Global CSS with high-density UI optimizations, theme tokens, and soothing Dark Mode (Anti-glare) support.

### Components
- `client/src/components/DeviceViewer.tsx`: Displays a single device in the expanded viewer mode; UI is optimized to hide redundant controls now present in HeaderBar.
- `client/src/components/HeaderBar.tsx`: Top navigation bar hosting centralized device numbering, reordering controls, and server restart functions. Now includes robust server restart polling (via `/health`) and status feedback.
- `client/src/components/RightBar.tsx`: Thin right sidebar containing quick action icons (Power, Volume, Home, etc.).
- `client/src/components/SyncPanel.tsx`: Panel for device synchronization settings and group selection.
- `client/src/components/ViewerSidePanel.tsx`: Right-side panel specifically for the `DeviceViewer`. Handles context menu closure with robust click-outside detection.

#### Tile Components (Phone Cards)
- `client/src/components/tile/Tile.tsx`: Main component representing a single phone card. Includes onPointerEnter/Leave hover focus logic and Alt keyup restoration for solo control.
- `client/src/components/tile/TileHeader.tsx`: Header of the phone card (UDID, status, user profile selection).
- `client/src/components/tile/TileMenu.tsx`: Context menu for the phone card.
- `client/src/components/tile/TileNav.tsx`: Bottom navigation buttons on the phone card.
- `client/src/components/tile/types.ts`: TypeScript definitions for tile components.
- `client/src/components/tile/useTileStream.ts`: Custom hook handling the streaming pipeline (WebSocket, decoding, rendering).

### Context & State
- `client/src/context/ActiveContext.tsx`: Manages active/selected devices, synchronization state, and Alt-solo focus.
- `client/src/context/I18nContext.tsx`: Handles internationalization/translations.
- `client/src/context/ServerContext.tsx`: Manages backend server API connections.
- `client/src/store/useSyncStore.ts`: Zustand store for sync state.
- `client/src/store/useTileOrder.ts`: Zustand store for managing the order and numbering of device tiles.

### Hooks & Libraries
- `client/src/hooks/useDirectKeyboard.ts`: Hook for capturing and forwarding keyboard inputs.
- `client/src/lib/adbStub.ts`: ADB command utilities.
- `client/src/lib/control.ts`: Functions for encoding Scrcpy control messages.
- `client/src/lib/keyEvent.ts`: Android keycode mappings.
- `client/src/lib/serverApi.ts`: API client for the Node.js backend.
- `client/src/lib/touchControls.ts`: Logic for capturing mouse/touch events. Supports isolated control when holding Alt.
- `client/src/lib/video.ts`: Video stream processing utilities.

### Workers
- `client/src/workers/device_worker.worker.ts`: Web Worker for H264 decoding (using tinyh264).
- `client/src/workers/yuvRender.worker.ts`: Web Worker for rendering YUV frames to ImageBitmap.

## Server (Node.js)
- `server/`: Backend service that interfaces with Scrcpy and ADB (Legacy Backend).
  - `server/src/server/services/HttpServer.ts`: Manages REST API endpoints, including `/health` for status checks and `/api/server/restart` for PM2/Launcher-aware reboots.

## Server Go (Golang Backend)
- `server-go/`: New highly-concurrent backend service written in Go.
  - `server-go/main.go`: Entry point, includes ADB warm-up logic and HTTP/WebSocket server initialization.
  - `server-go/adb/tracker.go`: ADB device tracker utilizing goroutines.
  - `server-go/websocket/handler.go`: WebSocket communication handler.

## APK Build (MonKeyboard IME)
- `APK Build/MonKeyboard/`: Android project for the lightweight invisible keyboard (IME).
  - `MonKeyboard/app/src/main/java/com/monkeyboard/ime/MonKeyboardService.java`: Core IME logic.
  - `MonKeyboard/app/src/main/java/com/monkeyboard/ime/MainActivity.java`: Setup guide UI.

## Documentation
- `client/docs/UI_STYLE_GUIDE.md`: Mandatory design standards for the Modern Dark Theme.
- `naming_registry.json`: Single source of truth for UI identifiers and variable naming conventions.
