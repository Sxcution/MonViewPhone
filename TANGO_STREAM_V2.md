# MonViewPhoneV2 - Tango / ya-webadb Stream Notes

## Tóm tắt nhanh

MonViewPhoneV2 hiện đang stream bằng kiến trúc mới:

```text
Frontend React tile
  -> WebSocket local: ws://127.0.0.1:11080/stream?udid=...
  -> stream-node TypeScript sidecar
  -> ADB server local 127.0.0.1:5037
  -> @yume-chan/adb + @yume-chan/adb-scrcpy
  -> scrcpy-server v3.3.4 trên Android
  -> H.264 video packets
  -> FE WebCodecs render vào canvas
```

Nói ngắn gọn: **V2 đã chuyển lõi stream sang Tango/ya-webadb + scrcpy 3.3.4**, không còn dùng stream WebSocket/proxy cũ của MonViewPhone gốc cho video chính.

Go backend vẫn còn dùng để quản lý app, UI, device list, account, setting, automation, static frontend, v.v. Nhưng đường video stream chính đã đi qua `stream-node`.

---

## V2 khác MonViewPhone cũ ở đâu?

### MonViewPhone cũ

MonViewPhone cũ dùng Go backend trực tiếp làm phần lớn pipeline stream:

```text
Frontend
  -> Go backend websocket/proxy
  -> adb forward tcp:8886 hoặc localabstract cũ
  -> scrcpy server cũ
  -> H.264 về FE
```

Các vấn đề từng gặp ở bản cũ:

```text
- Nhiều adb forward stale localabstract:scrcpy_* không được dọn sạch.
- Mở nhiều máy cùng lúc dễ tạo TIME_WAIT / port exhaustion trên Windows.
- waitForServer spam ADB shell.
- Hardcode encoder OMX.google.h264.encoder gây lỗi trên nhiều máy.
- scrcpy server cũ không tương thích tốt Android 14/15, đặc biệt Samsung.
- Android 14/15 có lỗi SurfaceControl.getInternalDisplayToken với server cũ.
```

### MonViewPhoneV2 hiện tại

V2 dùng `stream-node` làm sidecar riêng cho stream:

```text
Frontend
  -> stream-node port 11080
  -> ADB transport theo serial
  -> push scrcpy-server-v3.3.4.jar
  -> start scrcpy qua @yume-chan/adb-scrcpy
  -> localabstract:scrcpy_<scid>
  -> video/control socket Tango
  -> FE decode bằng WebCodecs
```

Điểm khác chính:

```text
- Stream không đi qua Go backend nữa.
- Không dùng adb forward tcp:8886 legacy cho stream chính.
- Dùng scrcpy protocol mới qua ya-webadb/Tango.
- Dùng scrcpy-server 3.3.4 thay vì server cũ.
- Mỗi session có scid riêng dạng localabstract:scrcpy_<id>.
- Audio đang tắt để tránh nghẽn multiplex ADB.
- Control vẫn đi cùng scrcpy controller socket.
```

---

## Các thành phần chính

### 1. Go backend

Vẫn chạy ở:

```text
http://127.0.0.1:11000
```

Vai trò:

```text
- Serve frontend build.
- Quản lý danh sách thiết bị.
- Các API app cũ.
- Account/settings/automation.
- Không còn là video stream core chính của V2.
```

### 2. stream-node

Chạy ở:

```text
http://127.0.0.1:11080
```

Health check:

```text
http://127.0.0.1:11080/healthz
```

Vai trò:

```text
- Kết nối ADB server 127.0.0.1:5037.
- Lấy transport theo serial thiết bị.
- Push scrcpy-server-v3.3.4.jar vào /data/local/tmp.
- Start scrcpy server qua @yume-chan/adb-scrcpy.
- Nhận H.264 packet từ scrcpy.
- Đóng gói packet sang định dạng MVTS nội bộ.
- Gửi packet về frontend qua WebSocket.
- Nhận touch/key/scroll từ FE và chuyển sang scrcpy controller.
```

### 3. Frontend stream tile

File chính:

```text
client/src/components/tile/useTileStream.ts
client/src/stream/tango/TangoStreamEngine.ts
client/src/stream/tango/TangoProtocol.ts
client/src/stream/webcodecs/WebCodecsH264Engine.ts
```

Vai trò:

```text
- Mỗi tile mở WebSocket tới stream-node.
- Nhận MVTS packet.
- Tách H.264 payload.
- Decode bằng WebCodecs.
- Render frame lên canvas.
- Gửi touch/key/scroll ngược lại cùng WebSocket.
```

---

## Flow start stream từng bước

Khi một tile cần stream thiết bị `UDID`, flow hiện tại là:

```text
1. FE tạo WebSocket:
   ws://127.0.0.1:11080/stream?udid=<UDID>&bitrate=...&maxFps=...&maxSize=...

2. stream-node nhận WS.

3. stream-node kiểm tra ADB devices.

4. stream-node tạo ADB transport theo serial.

5. stream-node tìm scrcpy-server-v3.3.4.jar.

6. stream-node push jar:
   /data/local/tmp/monviewphone-scrcpy-server-3.3.4.jar

7. stream-node tạo scrcpy options:
   - video: true
   - audio: false
   - control: true
   - videoCodec: h264
   - maxSize: theo setting FE
   - maxFps: theo setting FE
   - bitrate: theo setting FE
   - tunnelForward: false
   - sendDummyByte: true
   - sendCodecMeta: true
   - sendDeviceMeta: true

8. stream-node start scrcpy-server.

9. scrcpy-server mở socket localabstract:scrcpy_<scid>.

10. stream-node nhận video stream.

11. stream-node gửi packet về FE theo envelope MVTS.

12. FE parse MVTS, lấy H.264 payload.

13. FE WebCodecs decode H.264.

14. FE render frame lên canvas.
```

---

## MVTS packet nội bộ

V2 dùng envelope nhị phân riêng giữa stream-node và FE để bọc packet H.264.

Header 20 bytes:

```text
magic       4 bytes   "MVTS"
version     1 byte    1
packetType  1 byte    1=config, 2=video
flags       1 byte    bit 0 = keyframe
reserved    1 byte
 timestamp  8 bytes   timestamp us
length      4 bytes   payload length
payload     N bytes   raw H.264 Annex-B payload
```

File liên quan:

```text
stream-node/src/protocol.ts
client/src/stream/tango/TangoProtocol.ts
```

---

## Control/touch hiện tại

Control vẫn đi cùng WebSocket stream.

FE gửi binary control message:

```text
KEYCODE
TEXT
TOUCH
SCROLL
SET_SCREEN_POWER_MODE
```

stream-node parse rồi gọi scrcpy controller:

```text
controller.injectKeyCode(...)
controller.injectText(...)
controller.injectTouch(...)
controller.injectScroll(...)
controller.setDisplayPower(...)
```

Lưu ý: control path đã xác nhận hoạt động. Lỗi lúc trước “điều khiển lúc được lúc không” chủ yếu do stream tile/FE tự reconnect làm WS bị đóng, không phải do control protocol.

---

## Các lỗi đã phát hiện và đã sửa

### 1. Stale scrcpy forward ở MonViewPhone gốc

Bản cũ chỉ dọn một phần forward, bỏ sót dạng:

```text
localabstract:scrcpy_XXXX
```

Đã sửa cleanup để nhận cả:

```text
tcp:8886
localabstract:scrcpy
localabstract:scrcpy_
```

### 2. Hardcoded encoder

Bỏ hardcode:

```text
OMX.google.h264.encoder
```

V2 để encoder auto, tránh lỗi trên Samsung/Xiaomi/Android mới.

### 3. scid overflow làm scrcpy-server crash

Bug từng gặp:

```text
java.lang.NumberFormatException: For input string: "bc63a66c" under radix 16
```

Nguyên nhân:

```text
scid sinh random 32-bit hex có thể > 0x7fffffff.
scrcpy-server parse bằng Java Integer.parseInt(..., 16).
Giá trị > 7fffffff bị overflow signed int và server crash.
```

Đã sửa:

```text
scid luôn nằm trong 00000000..7fffffff
```

### 4. FE reconnect storm khi render đứng

Bug cũ trong FE:

```text
Nếu packet vẫn về nhưng canvas không render frame trong 8s,
FE tự đóng WebSocket và reconnect.
```

Điều này làm:

```text
stream đơ vài giây
-> FE đóng WS
-> scrcpy session bị đóng
-> reconnect random
-> control lúc được lúc không
```

Đã sửa:

```text
Nếu packet vẫn về thì không đóng WS.
Chỉ restart decoder/canvas cục bộ.
Chỉ reconnect thật khi không còn packet trong thời gian dài.
```

### 5. H.264 nhiễu hình do đưa sai buffer vào WebCodecs

Bug cũ:

```ts
data: frameBytes.buffer
```

Nếu `frameBytes` là `Uint8Array.subarray()`, `.buffer` có thể chứa dư byte ngoài frame thật.

Hậu quả:

```text
- hình vỡ block
- nhiễu màu
- rớt frame
- decoder mất đồng bộ
```

Đã sửa bằng cách đưa đúng byte frame vào decoder:

```ts
data: frameCopy
```

Đồng thời nếu decoder mất sync:

```text
- drop delta frame
- chờ keyframe tiếp theo
- không decode bừa gây nhiễu thêm
```

---

## Setting stream hiện tại

Config mặc định trong V2:

```text
engine: tango-scrcpy
encoderMode: auto
bitrate: 786432 mặc định trong code, UI có thể chỉnh
maxFps: 15 mặc định trong code, UI có thể chỉnh
maxSize: theo bounds setting
codec: H.264
audio: off
control: on
```

Trong UI có thể chỉnh:

```text
- bitrate
- FPS
- độ nét / maxSize
- kích thước tile
- encoder mode
- stream engine
```

Nếu mở nhiều máy, khuyến nghị:

```text
FPS: 15-25
Bitrate: 700k-1.2M
Độ nét: 400-600px
```

Nếu chỉ mở ít máy, có thể tăng FPS/bitrate.

---

## Debug log

Log chính:

```text
logs/launcher.log
logs/server-go-current.log
logs/stream-node-current.log
logs/stream-trace-current.log
```

Các mốc trace quan trọng:

```text
ADB_LIST_DEVICES_OK
ADB_CREATE_TRANSPORT_OK
PUSH_JAR_OK
SCRCPY_START_OK
VIDEO_STREAM_GET_OK
FIRST_VIDEO_CONFIGURATION_PACKET
FIRST_VIDEO_DATA_PACKET
VIDEO_PACKET_HEARTBEAT
SESSION_START_FAILED
SCRCPY_SERVER_EXITED
VIDEO_STREAM_FAILED
```

Cách đọc nhanh:

```text
Có SCRCPY_START_OK nhưng không có FIRST_VIDEO_DATA_PACKET:
  -> scrcpy server start được nhưng video chưa ra hoặc stream-node chưa nhận frame.

Có FIRST_VIDEO_DATA_PACKET nhưng FE vẫn chờ frame:
  -> lỗi FE decoder/render.

Có VIDEO_PACKET_HEARTBEAT nhưng canvas đơ:
  -> packet vẫn về, lỗi render/WebCodecs/canvas, không nên reconnect WS.

Có SESSION_START_FAILED:
  -> lỗi ADB/push/start scrcpy.
```

---

## Tình trạng hiện tại

Tính tới bản hiện tại:

```text
- Lõi Tango/ya-webadb stream chạy được.
- scrcpy 3.3.4 start được trên nhiều máy.
- Video packet về FE.
- Control hoạt động.
- Reconnect storm do FE render watchdog đã được giảm/chặn.
- Nhiễu hình do sai buffer WebCodecs đã được vá.
```

Vấn đề còn cần theo dõi:

```text
- Một số máy có thể start scrcpy nhưng chờ frame lâu.
- Một số máy/ROM có thể encoder H.264 ra stream không ổn định.
- Khi mở nhiều máy, giới hạn thật nằm ở CPU/GPU decode của Chrome + ADB throughput.
- FE hiện vẫn dùng WebCodecs engine tự tích hợp, chưa thay hoàn toàn bằng package @yume-chan/scrcpy-decoder-webcodecs.
```

---

## Kết luận

MonViewPhoneV2 hiện không còn stream giống MonViewPhone cũ.

Bản cũ:

```text
Go backend + scrcpy/proxy legacy + server cũ
```

Bản V2:

```text
stream-node TypeScript + ya-webadb/Tango + scrcpy-server 3.3.4 + WebCodecs FE
```

Lợi ích chính:

```text
- Tương thích Android mới tốt hơn.
- Tránh hardcoded encoder cũ.
- Tránh phụ thuộc stream proxy cũ trong Go.
- Dễ trace từng bước ADB/push/start/video/control.
- Có thể mở rộng thêm retry profile/fallback theo từng device sau này.
```

Điểm cần nhớ:

```text
Go backend vẫn là app backend.
stream-node mới là video stream backend.
Frontend mới là nơi decode/render H.264.
Nếu packet vẫn về thì không được đóng WS bừa, vì như vậy sẽ phá session scrcpy.
```
