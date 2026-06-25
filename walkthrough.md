# Walkthrough - raw-v2 Stream Integration (Xiaowei Style)

We have successfully integrated the `raw-v2` streaming engine, resembling the Xiaowei-style raw H.264 stream pipe.

## Changes Implemented

### 1. scrcpy-server v3.3.4 Preparation
- Created the folder `server-go/bin`.
- Downloaded and placed the official `scrcpy-server-v3.3.4.jar` release binary in `server-go/bin/scrcpy-server-v3.3.4.jar`.

### 2. Backend (server-go)
- **Implement HandleProxyScrcpyRaw**: Replaced `server-go/websocket/proxy_raw.go` with a complete implementation that:
  - Pushes `scrcpy-server-v3.3.4.jar` to the device as `/data/local/tmp/monview-scrcpy-server-v3.3.4.jar` (checked via MD5 verification).
  - Removes any existing instances of our raw-v2 server via `pkill`.
  - Sets up ADB forward matching a safe socket name derived from the device UDID.
  - Starts the scrcpy server on the device in standalone mode with options: `video=true`, `audio=false`, `control=false`, `raw_stream=true` (outputs raw H.264 and removes genymobile metadata headers).
  - Connects to the local forward TCP port and pipes the raw H.264 bytes directly into the client's WebSocket connection.
- **Route action**: Added routing for action `proxy-scrcpy-raw` inside `server-go/main.go`.

### 3. Frontend (client)
- **STREAM_MODE default configuration**: Switched `STREAM_MODE` in `client/src/lib/config.ts` from `'ws6'` to `'raw-v2'`.
- **WS URL creation updates**: Modified `makeWsUrl` in `client/src/lib/video.ts` to output `action=proxy-scrcpy-raw` and skip redundant query parameters when `STREAM_MODE === 'raw-v2'`.
- **Skip config binary push**: Modified `ws.onopen` in `client/src/components/tile/useTileStream.ts` to bypass sending the config binary when running in `raw-v2` mode (since configs are already set in the backend's server execution command).

## Verification & Validation
- Ran `go build -o ../server-go.exe .` inside `server-go` which compiled successfully.
- Ran `npm run build` inside `client` which completed with zero errors.
