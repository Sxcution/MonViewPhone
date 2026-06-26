# Báo cáo chuyển giao lỗi stream/viewer MonViewPhoneV2

Thời điểm: 2026-06-26

Phạm vi: từ lúc user nói **“fix nhẹ thôi nha, đừng mạnh tay quá vì đang stream ngon”** đến hiện tại.

Mục tiêu file này: ghi lại chính xác đã sửa gì, sửa nào có thể gây side effect, vì sao hiện tại nhiều máy grid bị đơ, vì sao dropdown **Bộ giải mã video (Stream Engine)** không áp dụng, và hướng fix tiếp theo cho cửa sổ chat mới.

---

## 1. Trạng thái hiện tại user báo

User báo:

- Mở/phóng to thiết bị bằng Viewer vẫn còn cảm giác đơ.
- Sau khi sửa race condition, chữ lỗi đỏ `session cancelled after adb transport` đã biến mất.
- Sau bản sửa “Viewer instant mode”, nhiều máy grid bị đơ.
- Dropdown **Bộ giải mã video (Stream Engine)** trong Cài Đặt Hệ Thống không thấy áp dụng.

Các thiết bị user nhắc để kiểm tra log:

```text
28083aacbd217ece
3b87f833
xklrgm6tj74pnruc
```

---

## 2. Những thay đổi đã làm từ lúc “fix nhẹ thôi”

### 2.1. Sửa overlay status hiện khi resize/phóng to/thu nhỏ

File:

```text
client/src/components/tile/Tile.tsx
```

Mục tiêu ban đầu: khi phóng to/thu nhỏ, overlay info tạm thời như:

```text
Đã nhận WS, vào hàng đợi stream Tango...
```

hiện khoảng 0.5 giây dù canvas vẫn có frame. Sửa để nếu tile đã từng render frame thì không hiện overlay info nữa.

Thay đổi chính:

```ts
const [hasRenderedFrame, setHasRenderedFrame] = useState(false);
...
const showTransientInfoOverlay = !(hasRenderedFrame && statusTone === 'info');
const showLoadingOverlay = loading && showTransientInfoOverlay;
const showStatusOverlay = Boolean(statusTrimmed) && showTransientInfoOverlay;
```

Đánh giá:

- Đây là sửa UI nhẹ.
- Không đụng stream-node/scrcpy/control.
- Ít khả năng là nguyên nhân grid đơ.

---

### 2.2. Copy data/config từ MonViewPhone cũ sang V2

Đã copy:

```text
MonViewPhone/server-go/data/Data.db       -> MonViewPhoneV2/server-go/data/Data.db
MonViewPhone/server-go/Data.db            -> MonViewPhoneV2/server-go/Data.db
MonViewPhone/server-go/settings.json      -> MonViewPhoneV2/server-go/settings.json
MonViewPhone/server-go/wifi_mapping.json  -> MonViewPhoneV2/server-go/wifi_mapping.json
```

Có backup V2 cũ trong:

```text
MonViewPhoneV2/backups/
```

Đánh giá:

- Tài khoản đã sang OK.
- Nhóm/Automation không nằm trong DB mà nằm ở browser localStorage.

---

### 2.3. Sửa localStorage origin `127.0.0.1` vs `localhost`

File:

```text
run.pyw
```

Đổi:

```py
BASE_URL = "http://127.0.0.1:11000/"
```

thành:

```py
BASE_URL = "http://localhost:11000/"
```

Lý do: nhóm thiết bị / automation / macro / profile cũ nằm trong localStorage của origin:

```text
http://localhost:11000
```

Chrome coi `localhost` và `127.0.0.1` là 2 kho localStorage khác nhau.

Đánh giá:

- Có thể làm app dùng lại config cũ trong localStorage, bao gồm cả `streamConfig`/`viewerStreamConfig` cũ.
- Đây là một lý do khiến encoder cũ `OMX.google.h264.encoder` xuất hiện lại trong log nếu localStorage cũ còn lưu.

---

### 2.4. Dọn file debug/rác trong MonViewPhoneV2

Đã xoá nhiều file debug/temp như:

```text
scratch/
scripts/
tmp_* files
*.bak debug cũ
server-go scrcpy-decompiled/smali/uploads
stream-node *.bak
.gemini/
.refact/
```

Giữ lại data/config/backups/source chính.

Đổi tên:

```text
stream-node/src/debug.ts -> stream-node/src/runtime.ts
```

và sửa import.

Build sau dọn từng pass:

```text
stream-node build OK
client build OK
server-go build OK
```

Đánh giá:

- Việc dọn file không trực tiếp gây freeze.
- Nhưng đổi `debug.ts -> runtime.ts` là đổi source stream-node, đã build pass.

---

### 2.5. Sửa encoderName cũ chỉ gửi khi custom

File:

```text
client/src/components/tile/useTileStream.ts
client/src/App.tsx
```

Trong log vẫn thấy FE gửi:

```text
&encoder=OMX.google.h264.encoder
```

Dù UI đang chọn:

```text
Bộ mã hoá thiết bị: Tự động (Ưu tiên Hardware)
```

Đã sửa `useTileStream.ts`:

```ts
encoderName: cfg.encoderMode === 'custom' ? cfg.encoderName : undefined,
```

Đã sửa normalize config trong `App.tsx`:

```ts
const encoderMode = cfg.encoderMode || 'auto'
...
encoderMode,
encoderName: encoderMode === 'custom' ? cfg.encoderName : undefined
```

Đánh giá:

- Source hiện tại đã đúng.
- `client/dist` sau build mới không còn chuỗi `OMX.google.h264.encoder`.
- Nếu log vẫn còn `&encoder=OMX.google.h264.encoder` thì có khả năng app/browser đang chạy bundle cũ hoặc chưa hard reload/restart đúng bản mới.

---

### 2.6. Sửa race condition WebSocket cũ giết session mới

Files:

```text
stream-node/src/sessionManager.ts
stream-node/src/index.ts
stream-node/src/runtime.ts
run.pyw
```

Vấn đề:

- Khi mở Viewer, WS cũ đóng.
- WS mới cho Viewer mở ngay sau đó.
- `ws.on('close')` của WS cũ gọi `sessionManager.close(udid)`.
- Vì sessionManager lưu theo `udid`, WS cũ có thể đóng nhầm session mới của WS Viewer.
- Gây lỗi:

```text
session cancelled after adb transport
```

Đã thêm:

```ts
async closeIfCurrent(udid: string, session: ScrcpySession) {
  const current = this.#sessions.get(udid);
  if (current !== session) {
    session.trace.step('MANAGER_SKIP_CLOSE_STALE_SESSION');
    return false;
  }
  this.#sessions.delete(udid);
  session.trace.step('MANAGER_CLOSE_CURRENT_SESSION');
  await session.close();
  return true;
}
```

Đổi trong `index.ts`:

```ts
void sessionManager.closeIfCurrent(udid, session);
```

Bỏ close mù trong catch:

```ts
// Do not close by udid here...
```

Bump build id:

```text
tango-v2-race-safe-close-1
```

Đánh giá:

- Đây là sửa đúng.
- User xác nhận chữ lỗi đỏ biến mất.
- Không giải quyết độ đơ do restart stream khi Viewer đổi cấu hình.

---

### 2.7. Sửa “Viewer instant mode” để giống MonViewPhone cũ

File:

```text
client/src/App.tsx
```

Vấn đề phát hiện từ log:

Khi mở Viewer, App đổi stream từ grid config sang viewer config:

```text
Grid:   bitrate=786432, maxSize=500, fps=24
Viewer: bitrate=6029312, maxSize=1017, fps=40
```

Điều này làm V2 đóng scrcpy cũ và start scrcpy mới. Android MediaCodec phải khởi động lại, gây đứng hình 0.7-2 giây hoặc lâu hơn.

Đã sửa:

- Không reload tile khi `viewerUdid` thay đổi.
- Không dùng `viewerStreamConfig` cho tile đang viewing.
- Luôn truyền `streamConfig={streamConfig}`.

Block hiện tại trong `App.tsx`:

```ts
// Viewer instant mode: opening/closing Viewer must not restart scrcpy.
// Keep the existing grid stream alive and only scale the canvas/UI.
// This matches old MonViewPhone behavior: immediate control, no MediaCodec restart.
useEffect(() => {
  prevViewerRef.current = viewerUdid
}, [viewerUdid])
```

Và props Tile hiện tại:

```tsx
streamConfig={streamConfig}
```

Đánh giá quan trọng:

- Đây là thay đổi có khả năng gây side effect hiện tại.
- Nếu `viewerUdid` làm thay đổi layout/render/mount mà không reload đúng cách, có thể khiến vài tile giữ session cũ/canvas cũ hoặc không restart khi cần.
- User báo sau thay đổi này “nhiều máy bị đơ grid”, nên đây là thay đổi cần được xem lại đầu tiên.
- Có thể cần revert hoặc làm đúng hơn: Viewer dùng lại cùng session/canvas thay vì chỉ bỏ reload nửa chừng.

---

## 3. Vì sao nhiều máy grid có thể bị đơ hiện tại?

Các khả năng chính, theo thứ tự nghi ngờ:

### 3.1. App/browser vẫn đang chạy bundle cũ hoặc state localStorage cũ

Log vẫn thấy:

```text
&encoder=OMX.google.h264.encoder
```

Trong khi source hiện tại đã chặn gửi encoder nếu mode không phải custom, và bundle mới không còn chuỗi `OMX.google.h264.encoder`.

Điều này nghĩa là một trong các điều sau đang xảy ra:

- App window chưa hard reload sau build mới.
- Go backend/browser đang giữ asset JS cũ trong cache.
- Cửa sổ app `--app=http://localhost:11000` còn session cũ.
- LocalStorage cũ vẫn chứa `streamConfig.encoderName`, và bundle cũ đang dùng nó.

Hành động kiểm tra:

```text
1. Restart V2 hoàn toàn từ tray Exit.
2. Mở lại run.pyw.
3. Ctrl+F5/hard reload app window.
4. Check logs/stream-node-current.log, query /stream mới không được còn &encoder=OMX.google.h264.encoder.
```

Nếu vẫn còn `&encoder=...` sau hard reload thì cần tìm đường code khác đang gửi encoder.

---

### 3.2. Sửa Viewer instant mode có thể làm lifecycle Tile lệch

Trước đó, khi mở/đóng Viewer, code reload tile silently để đổi profile stream. Dù gây delay, nó cũng reset lifecycle sạch.

Sau sửa instant mode, Viewer không reload nữa nhưng vẫn có các state UI khác đổi:

```tsx
isViewing={viewerUdid === udid}
streamConfig={streamConfig}
```

Nếu CSS/layout hoặc component viewer làm canvas bị resize/remount mà stream engine không biết refresh size đúng lúc, có thể thấy grid đơ hoặc control/video mismatch.

Hướng an toàn cho chat mới:

- Revert riêng thay đổi `Viewer instant mode` để grid ổn lại.
- Sau đó làm giải pháp đúng hơn: tách Viewer overlay dùng cùng canvas/session hoặc tạo viewer clone chỉ render frame từ stream hiện tại, không đóng WS.

---

### 3.3. Queue/start concurrency và encoder cũ gây nghẽn khi nhiều máy reconnect

Trong log trước đó có các máy start/restart nhiều lần. Nếu nhiều tile reconnect cùng lúc:

```text
MAX_START_CONCURRENCY = 2
```

thì máy đứng chờ queue có thể nhìn như đơ. Nếu đồng thời vẫn gửi encoder Google software thì một số máy start rất chậm hoặc fail.

Hướng kiểm tra:

```text
Search logs:
- QUEUE enqueued
- QUEUE dequeued/start
- SCRCPY_START_BEGIN
- SCRCPY_START_OK
- FIRST_VIDEO_DATA_PACKET
- VIDEO_STREAM_FAILED
- scrcpy server exited prematurely
```

---

## 4. Vì sao dropdown “Bộ giải mã video (Stream Engine)” không áp dụng?

Lý do chính: trong V2/Tango hiện tại, dropdown này là UI cũ nhưng pipeline mới không thật sự dùng nó.

Source hiện tại:

```text
client/src/lib/config.ts
```

có type:

```ts
engine?: 'auto' | 'webcodecs' | 'legacy-tinyh264' | 'tango-scrcpy';
```

và default:

```ts
engine: 'tango-scrcpy'
```

Nhưng pipeline thực tế trong V2 là:

```text
TangoStreamEngine -> WebCodecsH264Engine -> Browser VideoDecoder -> Canvas
```

Source:

```text
client/src/stream/tango/TangoStreamEngine.ts
```

luôn import và dùng:

```ts
import { WebCodecsH264Engine } from '../webcodecs/WebCodecsH264Engine';
...
this.inner = new WebCodecsH264Engine(this.canvas, this.callbacks);
```

Vì vậy:

- Chọn `WebCodecs` hay `Legacy tinyh264` trong UI không đổi decoder thực tế của V2 Tango.
- `legacy-tinyh264` hiện là nhãn/đường cũ, không nối vào `TangoStreamEngine`.
- Muốn dropdown áp dụng thật, cần sửa `makeStreamEngine()`/stream engine factory để nếu chọn legacy thì tạo decoder khác tương thích Tango packet, hoặc ẩn dropdown khi dùng `tango-scrcpy`.

Kết luận: user cảm nhận đúng. Config decoder hiện tại **không áp dụng thật cho V2 Tango**.

---

## 5. Log quan trọng đã thấy

### 5.1. Encoder cũ vẫn xuất hiện trong log runtime

Ví dụ:

```text
[WS] accepted ... query=?udid=28083aacbd217ece&bitrate=786432&maxFps=24&maxSize=500&displayId=0&encoder=OMX.google.h264.encoder
```

Điều này không khớp với source/bundle mới, nên phải kiểm tra reload/cache.

### 5.2. Viewer cũ restart stream khi mở

Ví dụ:

```text
Grid:   bitrate=786432&maxSize=500
Viewer: bitrate=6029312&maxSize=1017
```

Điều này giải thích đơ 1-2 giây khi Viewer.

### 5.3. Race condition đã được fix

Sau build id:

```text
tango-v2-race-safe-close-1
```

user nói lỗi đỏ biến mất. Code có `closeIfCurrent`.

---

## 6. Build/trạng thái hiện tại

Các build đã chạy sau sửa:

```text
stream-node build: pass
client build: pass
server-go build: pass trước đó sau dọn file
```

Build id stream-node hiện tại:

```text
tango-v2-race-safe-close-1
```

File cần check khi mở app:

```text
http://127.0.0.1:11080/healthz
```

Phải thấy:

```json
"buildId": "tango-v2-race-safe-close-1"
```

---

## 7. Hướng fix tiếp theo đề xuất cho chat mới

### Bước 1: Đừng sửa rộng, xác nhận app đang chạy đúng bundle mới

Kiểm tra sau restart/hard reload:

```text
logs/stream-node-current.log
```

Query `/stream` mới không được còn:

```text
&encoder=OMX.google.h264.encoder
```

Nếu còn, phải tìm nguồn khác hoặc cache.

---

### Bước 2: Revert hoặc chỉnh lại Viewer instant mode

Vì user báo nhiều grid đơ sau thay đổi này, ưu tiên:

- Revert block viewer instant mode về bản trước để grid ổn lại.
- Hoặc làm giải pháp chuẩn hơn:
  - Viewer không đổi stream config.
  - Không remount/close tile WS.
  - Viewer chỉ phóng to canvas/session hiện tại.
  - Control vẫn route vào WS hiện tại.

Cần xem kỹ CSS/layout/viewer logic, không chỉ bỏ reload.

---

### Bước 3: Làm decoder dropdown đúng sự thật

Có 2 lựa chọn:

1. Ẩn/disable dropdown decoder khi stream engine là `tango-scrcpy`, ghi rõ đang dùng WebCodecs.
2. Hoặc implement thật:
   - `tango-scrcpy + WebCodecs`
   - `tango-scrcpy + tinyh264` nếu có decoder compatible Annex-B packets.

Hiện tại UI dropdown gây hiểu nhầm vì không đổi decoder của Tango.

---

### Bước 4: Nếu muốn Viewer nét hơn nhưng không đơ

Không nên tự restart stream khi mở Viewer. Làm tùy chọn riêng:

```text
Nút: Nâng chất lượng Viewer
```

Khi bấm thì mới reload stream `maxSize=1017`. Mặc định Viewer instant dùng stream grid để điều khiển ngay.

Hoặc nâng grid config vừa đủ, ví dụ:

```text
maxSize=640/720
fps=20-24
bitrate=1-2M
```

để Viewer phóng to vẫn chấp nhận được mà không restart.

---

## 8. Các file bị ảnh hưởng chính

```text
client/src/components/tile/Tile.tsx
client/src/components/tile/useTileStream.ts
client/src/App.tsx
client/src/stream/tango/TangoStreamEngine.ts
client/src/stream/webcodecs/WebCodecsH264Engine.ts
client/src/lib/config.ts
stream-node/src/index.ts
stream-node/src/sessionManager.ts
stream-node/src/runtime.ts
run.pyw
```

---

## 9. Kết luận ngắn

- Lỗi race condition thật đã sửa đúng.
- Lỗi đỏ `session cancelled after adb transport` biến mất.
- Viewer đơ ban đầu không chỉ là “delay phần cứng”; là do V2 tự restart stream khi mở Viewer.
- Sửa “Viewer instant mode” nhằm giống MonViewPhone cũ nhưng có thể đang gây side effect grid đơ; cần được xem lại/revert một phần.
- Dropdown “Bộ giải mã video” hiện không áp dụng thật cho V2 Tango vì `TangoStreamEngine` luôn dùng `WebCodecsH264Engine`.
- Log vẫn thấy encoder Google software cũ, trong khi source mới không gửi nữa; cần hard reload/restart hoặc kiểm tra cache/bundle.
