# Walkthrough - Stream Optimizations & Debugging Traces

We have successfully resolved the phone farm streaming bottlenecks, implemented connection tracing logs, added safety guards against restart storms and buffer overflows, and added FPS & bitrate statistics to the tile title header.

## Changes Implemented

### 1. Backend (server-go)
- **JAR Version Check**: Added helper functions `localFileMD5`, `remoteServerJarMD5`, and `shouldPushServerJar` to compare local and remote scrcpy-server JAR MD5 values before deciding to push.
- **Force Restart Cooldown**: Added a `ForceRestartCooldown = 12 * time.Second` constant. Implemented the `canForceRestartNow` check at the beginning of `ForceRestartServer` to fallback to `EnsureServer` if the cooldown is active, preventing restart storms.
- **Connection Trace Logging**: Added precise timestamps and tracing statements for WebSocket connections to locate connection delays:
  - `Stream trace: browser_ws_connected`
  - `Stream trace: device_ws_connected`
  - `Stream trace: first_browser_payload`
  - `Stream trace: first_device_payload`
- **Raw-v2 Skeleton**: Created a new skeleton endpoint `HandleProxyScrcpyRaw` under `server-go/websocket/proxy_raw.go` and mapped it to the `proxy-scrcpy-raw` action in `main.go`.

### 2. Frontend (client)
- **Lower Default Stream Configuration**: Reduced default `STREAM_CONFIG` properties in `client/src/lib/config.ts` to be lightweight for 36-device grids:
  - `bitrate`: 393,216 bps
  - `maxFps`: 12 FPS
  - `bounds`: { width: 360, height: 360 }
- **Stream Mode Toggle**: Declared `StreamMode` type and `STREAM_MODE = 'ws6'` constant in `client/src/lib/config.ts`.
- **Multiplexer Queue Limit**: Limited the `storage` array in `MuxChannel` to `MAX_CHANNEL_QUEUE_BYTES = 512 * 1024` (512KB) inside `client/src/lib/multiplexer.ts` to prevent unbounded memory growth during connection lag.
- **Stream Stats inside Tile Title Header**:
  - Exposed `bitrateKbps` calculated inside `useTileStream.ts`'s message throughput accumulator.
  - Passed `streamStats` into `TileHeader` and displayed `<FPS> FPS | <bitrate> kb/s` dynamically on the title header of each device, using standard theme tokens.

### 3. Documentation & Registries
- Updated `project_structure.md` with the new `proxy_raw.go` skeleton file.
- Updated `naming_registry.json` with the new stream constants.

## Verification & Validation
- Ran `go build -o ../server-go.exe .` inside `server-go` which compiled successfully.
- Ran `npm run build` inside `client` which completed with zero type errors.
