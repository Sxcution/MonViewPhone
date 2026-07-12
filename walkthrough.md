# DeviceViewer Landscape Scaling & Custom Joystick Walkthrough

This walkthrough details the changes made to improve the layout and scaling of the single-device `DeviceViewer`, persist the Game Mode setting, and style the joystick overlay.

## Changes Implemented

### 1. Dynamic Scaling & Layout
- Added dynamic orientation classes (`is-landscape` / `is-portrait`) to `#viewerPanel` in [DeviceViewer.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/DeviceViewer.tsx).
- In [styles.css](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/styles.css), we added calculations using the CSS `:has()` selector to expand the parent wrapper bounds when a device is in landscape mode.
- Sized the landscape viewer dynamically based on the large screen size slider (`var(--viewer-width)`):
  `--viewer-landscape-height: calc(min(72vh, calc(100vh - 160px)) * var(--viewer-width, 900px) / 900px)`.

### 2. Game Mode Persistence
- Modified [DeviceViewer.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/DeviceViewer.tsx) to persist the `gameModeEnabled` state per device under `localStorage` key `monviewphone:game-mode:${udid}`.
- Added a `useEffect` hook to dynamically reload the correct persisted game mode state whenever the active viewer device `udid` changes.
- Updated `handleToggleGameMode` and `handleShowWasdKeySetting` to write the correct state back to `localStorage`.
- Passed the `gameModeEnabled`, `onToggleGameMode`, and `onShowWasdKeySetting` props to `<ViewerSidePanel>` inside `DeviceViewer.tsx` to restore full sidebar button functionality.

### 3. Custom Joystick Redesign (Square & Transparent)
- Added `aspect-ratio: 1 !important` and `height: auto !important` to `.gameWasdOverlay` to prevent stretching and maintain a perfect square shape on all aspect-ratio canvas layouts.
- Set the background of the outer pad `.gameWasdPad` to `transparent` and updated the border to a square border with a small `12px` corner radius.
- Redesigned the D-pad (`+` shape) keys (`W`, `A`, `S`, `D`) to have a fully transparent background (`background: transparent`) and white borders (`border: 1.5px solid rgba(255, 255, 255, 0.2)`), connecting them into a single connected transparent cross shape.
- `.gameWasdCenter` is updated to merge the cross shape and uses pseudo-elements (`::before` and `::after`) to render the central dark horizontal pill and the central white horizontal pill.

### 4. Separate Controls & 5-Second Fade Preview
- Separated the Close and Resize functions:
  - **Close button (`×`)**: Placed in the top-right corner as a dedicated button. Clicking it instantly closes the edit mode.
  - **Resize handle**: Positioned in the bottom-right corner as a classic diagonal resize handle.
- Modified the pointerup handler so that releasing the drag or resize handle no longer closes the edit mode immediately.
- Added a **5-second fade preview** mechanism:
  - When the user releases the joystick from dragging or resizing, the overlay enters a preview state (represented by the `is-preview` class).
  - While in preview, the overlay fades out smoothly over 5 seconds (`opacity: 0.15`) via a slow CSS transition, and has `pointer-events: none` so the user can click through it.
  - After 5 seconds, the overlay is hidden automatically.
  - If the user interacts with the overlay again before the 5 seconds are up, the timer is cleared and the overlay returns to full opacity.

### 5. Accurate Joystick Touch Coordinates & Action Flow Fixes
- Added `getWasdTouchGeometry` to convert the client center coordinates of the overlay relative to the wrapper into normalized coordinates relative to the actual rendered canvas bounding rect (`canvasRef.current.getBoundingClientRect()`), resolving stretching/offset errors caused by canvas borders and padding.
- Added `lastWasdTouchRef` to track the last sent touch event coordinate.
- Corrected the touch action flow inside `updateWasdJoystickTouch`:
  - When a WASD key is first pressed, it sends an `ACTION_DOWN` at the **center** of the joystick.
  - Immediately following this, it sends an `ACTION_MOVE` to the target offset direction.
  - When directions change or keys are held, it sends an `ACTION_MOVE` to the new offset coordinate.
  - When all keys are released, it sends an `ACTION_UP` at the last sent coordinate (falling back to the center).
- Reset joystick refs and cleared active pressed keys on `udid` changes.

## Verification

We verified the build compiles without issues:
- `cd client && npm run build` (Completed successfully with 0 errors).

## Custom Key Mapping (+ Key) Walkthrough

### 1. Unified Edit Mode & Visual Mappings
- Renamed `+ Key` to `+ WASD` for the joystick overlay, and added a new `+ Key` button to the sidebar.
- Added support for custom key touch mappings saved in `localStorage` under `monviewphone:game:keys:${udid}`.
- Clicking either `+ WASD` or `+ Key` enters **Edit Mode** (`wasdEditVisible === true`).
- In Edit Mode:
  - The WASD joystick overlay AND all custom key circles are **always displayed**.
  - There is **no auto-hide timer** when dragging or resizing.
  - A new **Lưu (Save)** button is displayed at the top right of the stream canvas wrapper. Clicking it instantly closes Edit Mode, hiding all key mapping indicators.
  - In normal view mode (non-editing), the mapping shapes are hidden but continue to function when keys are pressed.

### 2. Inline Click-to-Bind Flow (No Modals)
- Removed the popup overlay modal completely.
- Clicking the stream canvas now renders a temporary **pulsing orange indicator circle** with `?` at the exact click coordinates.
- Pressing any key immediately binds that key to the coordinates, saves it, and opens Edit Mode to visually display it.
- In Edit Mode, clicking any existing key mapping circle turns it into a pulsing `?` circle, allowing the user to press any key to **re-bind/change** it to a new key instantly.
- Pressing `Escape` while binding cancels the operation and returns to the previous state.

### 3. Portrait Scaling Optimization
- Solved the issue where vertical/portrait devices were too small when using the same width slider value.
- Implemented a custom CSS scaling formula for `.is-portrait` devices matching the logic of `.is-landscape`:
  `--viewer-portrait-width: min(calc(var(--viewer-width, 900px) * 0.8), calc(calc(100vh - 140px) * var(--viewer-aspect)), calc(100vw - 340px));`
- This ensures that:
  1. The portrait phone expands dynamically and proportionally according to the slider value (making it much wider and readable).
  2. The height dynamically guards against viewport height overflow (`100vh - 140px`) to prevent vertical clipping.
  3. The width leaves enough room for the side panel controls (`100vw - 340px`) to prevent horizontal layout breakages.



