# Work Log / Nhật ký làm việc

## Ngày 27/07/2026

- Yêu cầu: sửa hiện tượng sau nhiều giờ stream, `Select all` vẫn điều khiển đồng bộ tốt nhưng nhiều tile WebCodecs/canvas bị đứng hình và báo `render Tango đang hồi`.
- Bằng chứng live trước sửa: burst điều khiển vẫn có đủ video heartbeat và `35` WebSocket hoạt động; stream-node không có congestion, drop, timeout hay queue backlog. Root cause nằm ở pipeline render chung của Chrome, không phải ADB/scrcpy.
- Fix tối giản, không thêm dependency: `Canvas2DVideoFrameRenderer` chỉ giữ `VideoFrame` mới nhất và vẽ tối đa một lần mỗi `requestAnimationFrame`; frame bị thay, đã vẽ hoặc pending khi đóng đều được `close()`, callback chỉ chạy sau `drawImage()` thành công.
- Cập nhật `WebCodecsH264Engine` theo ownership mới: không đóng frame hai lần, chỉ tính `renderedFps`/`onFrame` sau khi canvas thật sự present, và bỏ pending frame cũ khi recreate decoder.
- Broadcast touch chỉ giới hạn `MOVE` nhiều máy ở `30Hz` và luôn giữ tọa độ mới nhất; `DOWN`, `UP`, MOVE cuối và chế độ Sync Time delay giữ nguyên hành vi. Đồng thời xóa ba `console.log` tạo mảng follower trên mỗi pointer-down.
- Watchdog render chỉ restart decoder một lần; nếu sau `12s + jitter 0-3s` vẫn không có frame thì silent reconnect riêng tile đó. Tái dùng queue có sẵn nên toàn bộ reconnect vẫn bị chặn ở `3` tile mỗi `1200ms`, tránh recovery herd.
- Self-check PASS: `node --experimental-strip-types scripts/check-canvas-renderer.mts` và `node --experimental-strip-types scripts/check-touch-move-coalescing.mts`.
- Lần đầu chạy check MVTS bằng `--experimental-strip-types` fail vì source có `const enum`; lệnh đúng là `node --experimental-transform-types scripts/check-tango-protocol.mts`, kết quả PASS.
- Build/deploy PASS: `npm run build`; server cổng `11000` phục vụ asset mới `index-CRyPHmjT.js`. Đã reload MonViewPhone, `35/35` WebSocket stream online lên lại và log sau reload không có congestion/error; hai tile ngắt kết nối là thiết bị offline sẵn có.

## Ngày 26/07/2026

- Yêu cầu: rà lại kết luận Gemini về stream chậm trên Note 9 A13 và gỡ workaround MonViewPhone không đúng root cause.
- Root cause thuộc ROM: `framework.jar` N15 không khớp `boot-framework.oat/vdex/art`; ART báo `ValidateOatFile ... checksum mismatch` rồi chạy lại `dex2oat` khoảng `6-8s` cho mỗi `app_process`.
- Bằng chứng cpuset bác bỏ workaround: ADB shell và scrcpy `app_process` trên `27f30c41a3217ece` đều ở cpuset `/`, `Cpus_allowed_list: 0-7`; `dex2oat` cũng chạy `-j8 --cpu-set=0..7`.
- Hoàn tác có chọn lọc `taskset ff` trong stream-node dependency và ba Go helper; trả queue khởi động về batch `3`, delay `1200ms`, bỏ ép concurrency `5`. Không revert UHID hay sửa `setScreenPowerMode`.
- Build ID đổi từ `tango-v2-taskset-ff-1` thành `tango-v2-uhid-control-1`.
- Build kiểm tra đạt: client `npm run build`, stream-node `npm run build`, server Go `go build -o server-go.exe .`; `git diff --check` sạch, chỉ còn cảnh báo chunk client lớn hơn `500 kB`.
- Yêu cầu: sửa stream lag tăng dần khi điều khiển nhiều thiết bị, ưu tiên realtime và giữ nguyên protocol MVTS v1.
- Xác nhận root cause trong tuyến thật `stream-node` → WebSocket → WebCodecs: server không chặn `bufferedAmount`, client drop delta rời rạc, watchdog replay keyframe cũ, timestamp video bị ghi `0`, và có các bản copy buffer không cần thiết.
- Fix server: thêm high/low-water theo từng WebSocket (mặc định xấp xỉ `0.5s` bitrate, có `MONVIEW_WS_HIGH_WATER_BYTES`/`MONVIEW_WS_LOW_WATER_BYTES`), drop video trước encode khi nghẽn, chỉ phục hồi ở IDR mới sau low-water và gửi SPS/PPS thành packet riêng trước IDR.
- Fix client: queue quá ngưỡng sẽ recreate decoder rồi bỏ toàn bộ delta đến IDR sống; không replay keyframe cũ; parser MVTS dùng view đúng `byteOffset` không copy; chỉ giữ bản copy SPS/PPS nhỏ; thêm log/overlay queue, drop, recovery, decode latency và relative transport backlog.
- Nối `iFrameInterval` hiện có từ UI xuống `ScrcpyCodecOptions`, chuyển timestamp MVTS sang `value.pts`, và đổi build ID launcher/stream-node thành `tango-v2-realtime-backpressure-1` để không tái sử dụng process cũ.
- Kiểm tra đạt: `stream-node npm run selfcheck:backpressure`, `stream-node npm run build`, `client node --experimental-transform-types scripts/check-tango-protocol.mts`, `client npm run build`, syntax `run.pyw`/`rundev.pyw`, và `git diff --check`; chỉ còn cảnh báo Vite chunk lớn hơn `500 kB`.
- Chưa restart launcher/stream live để tránh ngắt các thiết bị đang chạy; lần mở launcher tiếp theo sẽ nạp build ID mới.
- Follow-up live ba serial `27f30c41a3217ece`, `25f5db2d04057ece`, `2a7daa5dee3f7ece`: ADB/scrcpy đều khỏe và video heartbeat vẫn tăng khi Grid hiện `render Tango đang hồi…`; `27f...` start chậm khoảng `7.7s`, hai máy còn lại khoảng `0.3-0.4s`. Người dùng đã reboot thủ công nên trạng thái process/crash buffer sau reboot chỉ là bằng chứng hiện tại, không phủ định lỗi trước đó.
- Regression server: gate dùng `bufferedAmount + packetBytes`, nên keyframe `70-98KB` tự kích hoạt congestion ở `bufferedAmount=0`, rồi drop delta dù WebSocket không nghẽn. Đã sửa high-water chỉ xét backlog thật `ws.bufferedAmount`; self-check có case packet lớn khi backlog bằng `0`.
- Regression Grid: watchdog đặt cảnh báo nhưng không xóa khi frame hồi; `.tileStatusOverlay` phủ toàn tile và bắt pointer nên Grid không điều khiển được. Đã thêm `pointer-events: none` và chỉ xóa cảnh báo ở frame phục hồi đầu tiên.
- Race Grid/Viewer: scrcpy dùng chung remote JAR trong khi `CleanUp` của phiên cũ xóa file, từng gây `ClassNotFoundException: com.genymobile.scrcpy.Server`. Đã dùng remote JAR riêng theo `scid`, vẫn giữ cleanup chuẩn của scrcpy và xóa best-effort JAR đang push nếu start bị hủy/lỗi.
- Build ID nâng thành `tango-v2-realtime-backpressure-2`. Kiểm tra đạt: backpressure self-check, build client/stream-node, syntax launcher và `git diff --check`; chưa restart launcher live để tránh ngắt đồng loạt khoảng `32` thiết bị.
- Yêu cầu: sửa lỗi Viewer trên `RFCRB1CQ2VE` báo `AppManagerHelper` exit `134` với assertion `gDefaultTypeface`.
- Root cause live từ tombstone: `ApplicationInfo.loadIcon()` gọi Samsung Calendar `LiveIconLoader`, icon động đo chữ bằng `Paint.measureText()` trong standalone `app_process` Android 15 chưa có default Typeface nên native `SIGABRT`; JAR remote và local có cùng hash, không phải file hỏng.
- Fix tối giản: `AppManagerHelper.java` đọc trực tiếp icon resource tĩnh qua `Resources.getDrawable()` để bỏ qua vendor live-icon hook; backend chỉ repush/rerun helper khi lỗi nhắc đúng class helper hoặc đúng remote JAR bị thiếu/không mở được, không retry `SIGABRT`.
- Rebuild DEX JAR thành công, SHA-256 `df60a232a4663c6a34c1348bcd03df84a0e67580bc8ca6f04c598b84dec8d37d`; `go test ./...`, `go build` và review độc lập đều pass.
- Test trực tiếp rồi test qua API Viewer thật trên `RFCRB1CQ2VE` đều pass: `478` app, Samsung Calendar có icon Base64 `1892` ký tự, số assertion crash giữ nguyên trước/sau. Đã deploy JAR canonical và restart riêng `server-go` sang PID `5464`.
- Gotcha: restart `server-go` chạy startup cleanup trên `35` thiết bị và dừng các tiến trình `CleanUp` mà nó nhận là của MonViewPhone; các scrcpy Server của stream-node được giữ vì nhận là foreign. Sau restart, health stream-node vẫn `tango-v2-realtime-backpressure-2`, `devices=35`.
- Yêu cầu: sửa toàn bộ finding của review và gỡ tính năng tự start user MonSpaceV2 vì không còn dùng.
- Fix stream-node: bỏ probe dùng API không tồn tại `spawnAndWaitLegacy`, dùng `adb.rm(path, { force: true })`, và giới hạn push/cleanup ở `10s` để close/start thay thế không thể chờ vô hạn; self-check timeout, typecheck và backpressure self-check đều pass.
- Fix AppManager: `shouldRepushAppHelper()` chỉ ghép marker lỗi với helper class/JAR trên cùng một dòng; thêm regression test cho stack trace thiếu Samsung `LiveIconLoader`, `go test ./...` pass.
- Xác nhận autostart từng được gọi thật theo chuỗi `run.pyw`/`rundev.pyw` → `server-go.exe` → ADB tracker → `runMonSpaceV2Autostart()` → `sprict/Start-MonSpaceV2Users.ps1`; log cũ còn ghi lần chạy lúc `14:14:52`.
- Đã xóa hook khỏi `server-go/adb/tracker.go`, xóa module `server-go/adb/monspace_autostart.go`, hai file trong `sprict`, rồi xóa thư mục rỗng `sprict`; giữ các dòng log/backup lịch sử vì không phải caller.
- Rebuild và restart launcher hoàn tất: backend PID `29388`, stream-node PID `38892`, health build `tango-v2-realtime-backpressure-2`; source, `server-go.exe` hiện hành và log backend mới đều không còn marker autostart.

## 2026-07-25

- **18:25**: Phân tích bottleneck stream chậm khi 15+ devices kết nối. Phát hiện pipeline 3 tầng hàng đợi: frontend batch=3/1.2s, stream-node MAX_START_CONCURRENCY=2, server-go semaphore=12. Bottleneck chính: stream-node chỉ cho 2 scrcpy session start đồng thời → 16 device chờ ~40 giây.
- **18:29**: Fix: (1) run.pyw set env MONVIEW_STREAM_START_CONCURRENCY=5 khi spawn stream-node. (2) useTileStream.ts tăng STREAM_CONNECT_BATCH_SIZE 3→5, giảm BATCH_DELAY 1200→800ms. Ước tính cải thiện: 30 devices từ ~50s xuống ~15-20s.
- **18:30**: Phân tích sâu từ stream-node-current.log: (a) Không có scrcpy crash. (b) Samsung Note 9 tốn 6.6-8.3s/device start, gấp 20x Redmi. (c) Push JAR mỗi lần 8-32ms (không nghẽn). (d) Bug setDisplayPower trên scrcpy 3.3.4 (TypeError). (e) Device 2808133db6217ece reconnect 5 lần nhưng không gây nghẽn.
- **18:33**: Fix bổ sung: (1) scrcpySession.ts skip pushServer nếu JAR đã có trên device (check size match) → giảm ADB contention khi 5 sessions đồng thời. (2) Fix setDisplayPower → setScreenPowerMode theo API @yume-chan/scrcpy 3.3.4.
- **18:46**: Phát hiện nguyên nhân gốc máy Samsung Note 9 (Exynos 9810) khởi động scrcpy lâu (~7.8s): ADB shell bị ROM xếp vào `background` cpuset cgroup (chỉ chạy 2 nhân nhỏ 0-1 @ 500MHz). Đã benchmark cả 20 máy Note 9: ép nhân lớn `taskset ff` giúp thời gian start giảm từ **7.8s xuống 0.07s (70ms) - tăng tốc 100 lần**. Đã tích hợp `taskset ff` tự động vào `adb-scrcpy/client.js`, `scrcpy/server.go`, `display_power.go`, và `app_management.go`.
- **18:57**: Kiểm tra thiết bị `2851aa1728017ece` khi mở Viewer mode. Phát hiện tiến trình `stream-node` (PID 19644) cũ chạy từ 18:35 chưa được thay thế. Đã nâng `STREAM_NODE_BUILD_ID` thành `tango-v2-taskset-ff-1`, kill tiến trình node cũ và kích hoạt `stream-node` mới chạy trực tiếp build có `taskset ff`.
- **18:58**: Fix lỗi `scrcpy-server 3.3.4 jar not found`: Bổ sung đường dẫn tìm kiếm `SERVER_CANDIDATES` trong `scrcpySession.ts` bao gồm cả đường dẫn tuyệt đối/tương đối khi chạy từ thư mục gốc `MonViewPhone` lẫn thư mục `stream-node`. Đã rebuild `stream-node` và khởi chạy thành công.
- **19:41**: Fix cú pháp `taskset` trong Go backend helpers (`app_management.go`, `display_power.go`, `scrcpy/server.go`): Chuyển `CLASSPATH=...` lên trước `taskset ff` để khắc phục lỗi exit 127 `taskset: exec CLASSPATH...: No such file or directory` khi mở Viewer Device. Đã biên dịch lại `server-go.exe` thành công.

## 2026-07-16

- **06:55**: Nghiên cứu sự cố mất config local của người dùng khi tắt/mở lại MonViewPhone. Phát hiện nguyên nhân do sự khác biệt về Chrome profile (mặc định vs ChromeAppProfile) và origin (http://localhost:11000 vs http://127.0.0.1:5173) khi chạy các launcher khác nhau (run.pyw vs rundev.pyw). Đã hướng dẫn người dùng chạy run.pyw để kích hoạt cơ chế đồng bộ hai chiều từ profile cũ lên server-go/settings.json.

## 2026-07-15

- **15:19**: Fix bug auto screen-off không hoạt động khi device mới kết nối ADB trong khi app đang chạy. Root cause: auto effect dùng `orderedRegistered` (cần Tile mount) thay vì `connectedUdids` (ADB online ngay), và đánh dấu done trước khi async thành công. Fix: dùng `connectedUdids` trực tiếp, thêm inflight guard + 3s delay, chỉ mark done khi REST API thành công.

## 2026-07-14

- **13:09**: Fix bug button "Tắt màn hình" Quick Controls. Root cause: WS fire-and-forget trả true → skip REST API fallback. Fix: luôn chạy REST API.

## 2026-07-11

- **12:50**: User report lỗi thiết bị đã xoá tự xuất hiện lại + stream bị ngừng khi minimize.
  1. Server liên tục track ADB devices, đẩy device status qua websocket. Giao diện xoá nhưng bản tin `devices-list` đẩy lại sẽ làm thiết bị hiển thị lại vì app không lưu danh sách blacklist/bỏ qua.
  2. Ứng dụng chạy trên nền Chrome/Chromium (`run.pyw` gọi `chrome.exe --app=...`). Khi ẩn/minimize, Chrome tự động throttle (giới hạn) timer, animation frame và render để tiết kiệm pin. Nhưng server vẫn gửi stream data về liên tục, gây ùn ứ socket và DOM event. Khi mở lại, toàn bộ data ùa vào gây quá tải.
- **12:59**: Fix lỗi 1: Thêm `blacklistedUdids` vào React State & LocalStorage trong `App.tsx`. Hàm `removeUiDeviceEntries` sẽ push UDID bị xoá vào blacklist. Sự kiện websocket `devices-list` sẽ filter bỏ qua thiết bị nằm trong blacklist này.
- **13:00**: Fix lỗi 2: Thêm các flags chống ngủ đông vào `run.pyw` khi mở Chrome: `--disable-background-timer-throttling`, `--disable-backgrounding-occluded-windows`, `--disable-renderer-backgrounding`. Đảm bảo luồng render vẫn chạy 100% khi ẩn cửa sổ.
- **13:01**: Compile lại app (npm run build). Thành công.
- **13:03**: Phát hiện Bluestacks vẫn tự xuất hiện lại dưới dạng Tile `closed` dù đã xóa. Lý do: Khi `remoteDevices` rỗng, `discoveredDevices` trong `App.tsx` fallback lấy dữ liệu từ `androidDevices` (được đẩy từ endpoint `device-tracker` và chưa được filter qua `blacklistedUdids`). Điều này làm thiết bị Bluestacks (emulator-5554) vẫn lọt vào danh sách hiển thị.
- **13:04**: Fix bổ sung: Cập nhật hàm memo `discoveredDevices` trong `App.tsx` để lọc toàn bộ thiết bị trong danh sách blacklist từ cả `remoteDevices` lẫn `androidDevices`.
- **13:05**: Build lại client thành công.

## 2026-07-12

- **11:29**: Thực hiện tìm hiểu và giải thích chức năng của thư mục `packages/` trong dự án.
- **12:55**: Chạy lệnh build_v2_all.bat để tiến hành rebuild toàn bộ các thành phần của dự án.
- **13:38**: Kiểm tra git và phát hiện toàn bộ code tính năng mới nằm ở commit `2864f229` trên nhánh `codex/rollback-tango-initial-20260627`, trong khi workspace đang ở nhánh `main`.
- **13:40**: Đồng bộ nhánh main về commit `2864f229` của nhánh codex để lấy lại đầy đủ mã nguồn tính năng và tránh xung đột nhánh.
- **13:54**: Viết và biên dịch helper Java (AppManagerHelper.java) dùng để lấy danh sách ứng dụng, nhãn, và ảnh icon dưới dạng Base64 trên thiết bị Android qua app_process.
- **13:55**: Triển khai các API backend mới trong server-go/app_management.go và đăng ký route trong server-go/main.go.
- **13:56**: Tạo component ViewerAppsMenu.tsx phía frontend, tích hợp vào ViewerSidePanel.tsx để hiển thị "DS ứng dụng" với hover submenus cấp 1 và cấp 2.
- **13:57**: Build frontend thành công, chạy thử nghiệm backend.
- **14:00**: Xử lý lỗi push lên GitHub do lịch sử chứa file APK lớn. Dùng filter-branch để dọn dẹp lịch sử, cập nhật .gitignore và force push thành công.
- **14:12**: Sửa lỗi submenu cấp 2 của danh sách ứng dụng bị co rút chiều cao bằng cách ghi đè thuộc tính `bottom: 'auto'` vào inline style (do bị ghi đè bởi class `.vsp-adb-submenu` có `bottom: 100%`).
- **14:13**: Thu gọn chiều cao header của danh sách ứng dụng (giảm padding từ 8px xuống 3px, giảm font-size của tiêu đề xuống 11px) theo yêu cầu tối giản giao diện. Build và push các thay đổi lên GitHub thành công.
- Yêu cầu: kiểm tra MonViewPhone khi chọn `User 0 - Owner` để cài APK có còn làm package xuất hiện ở work profiles không.
- Root cause: route cũ `install-uploaded` truyền `nil` vào `adbInstallUploaded()`, backend chạy `pm install -r <apk>` trần; trên Android 13 có thể thành cài cho nhiều user.
- Sửa tối giản tại `server-go/rest.go`: `adbInstallUploaded()` luôn map `nil userID` thành `--user 0`, còn user cụ thể vẫn dùng đúng `--user <id>`.
- Build/test: `go test ./...` pass, `go build -o server-go.exe .` pass, đã restart `server-go.exe`.
- Test route thật qua `http://127.0.0.1:11000/api/goog/device/install-uploaded` với `Messenger_Lite.apk`: API trả `Success`; sau cài chỉ `user 0` có `com.facebook.mlite`, `user 11/user 13` không có; đã uninstall app test khỏi `user 0`.
- User báo các APK target mới như `Super_Proxy.apk` fail khi cài qua MonViewPhone dù chọn `User 0 - Owner`.
- Root cause: backend dùng đường `pm install`/ADB install đúng user nhưng ROM Android 13 reject nhiều APK `targetSdkVersion >= 30` với lỗi `Failure [-124] resources.arsc`; nhóm target 27 như `Messenger_Lite.apk` vẫn cài được.
- Sửa `server-go/adb/utils.go` để khi ADB command fail vẫn trả stdout/stderr thật về UI, không còn `output=""`.
- Sửa `server-go/rest.go`: cài APK bằng `adb install --user <id> -r <local.apk>`; nếu gặp lỗi `resources.arsc`, fallback dùng `apktool.jar` rebuild APK tạm với `targetSdkVersion: 29`, `zipalign`, ký debug keystore rồi install lại đúng user.
- Test route thật với `Super_Proxy.apk`: API trả `Success` kèm `Installed after APK resource alignment/sign repair`; chỉ `user 0` có `com.scheler.superproxy`, `user 11/user 13` không có; đã uninstall app test khỏi `user 0`.
- Log device: crash `Settings Services` là `com.google.android.settings.intelligence` lỗi provider `com.google.android.gsf.gservices`, không phải do Super Proxy install.

## 2026-07-13

- **05:30**: Thực hiện thay đổi cơ chế và vị trí hiển thị thông báo toast:
  - Di chuyển `.vsp-toast-container` từ góc trên bên phải (`right: 12px`) ra giữa trên (`left: 50%; transform: translateX(-50%)`) trong `client/src/styles.css`.
  - Tách logic hiển thị toast trong `client/src/components/ViewerSidePanel.tsx` thành component `ToastItem`.
  - Thực hiện tính năng: Khi rê chuột vào thông báo (hover), toast giữ nguyên không tự ẩn. Khi chuột rời đi, đếm ngược tự động ẩn sau 2 giây.
  - Build frontend biên dịch thành công. Đăng ký inspector ID `viewerSidePanel.toastItem` trong `naming_registry.json`.
- **06:00**: Yêu cầu: đổi shortcut `C:\Users\Mon\Desktop\run.lnk` sang chế độ dev để sửa giao diện thấy ngay, nhưng không tạo log dev quá ồn.
- Chọn cách tối giản: dùng launcher sẵn có `rundev.pyw`, chỉ đổi shortcut thay vì tạo shortcut/script mới.
- Giữ `server-go-current.log`, `stream-node-current.log`, `vite-current.log` vì đây là log `current` bị ghi đè mỗi lần mở và cần cho AI debug lỗi; riêng Vite chạy với `--logLevel warn` để giảm log frontend.
- Kiểm tra: `python -m py_compile rundev.pyw` pass; `run.lnk` hiện trỏ tới `C:\Users\Mon\Desktop\Protect\MonViewPhone\rundev.pyw`.
- Yêu cầu: thêm `DS Profile` vào Viewer sidebar để tạo profile bằng setup managed profile chuẩn Android và xoá profile đang chọn qua modal xác nhận.
- Chọn cách tối giản: tái dùng `runAdbCommandApi`/ADB shell hiện có, không thêm backend endpoint mới; `Cài đặt APK` và `Nhập tệp` đã dùng đúng `selectedProfile`.
- Sửa `client/src/components/ViewerSidePanel.tsx`: thêm submenu `DS Profile`, action `Tạo Profile` gọi `android.app.action.PROVISION_MANAGED_PROFILE`, action `Xoá Profile` yêu cầu nhập `Delete` rồi chạy `pm remove-user <id>`.
- Sửa `client/src/styles.css`: thêm style nhỏ cho submenu profile và trạng thái disabled.
- Build/test: `npm run build` trong `client` pass; chỉ còn warning Vite chunk size lớn.
- Bug: bấm `DS Profile > Tạo Profile` từ MonViewPhone làm điện thoại báo `Can't set up device / Contact your IT admin`.
- Root cause: `ManagedProvisioning` reject intent mở bằng `adb shell am start` vì `Calling package is null. Was startActivityForResult used to start this activity?`; lỗi lặp lại trên Pixel ROM A12/A13/A14, không phải do version Android riêng lẻ.
- Test tuyến thay thế trên `27f30c41a3217ece`: `pm create-user --profileOf 0 --managed`, `cmd package install-existing`, `dpm set-profile-owner`, `am start-user`, rồi mở `MonspaceV2Activity --ez finish_only true`; tạo được `UserInfo{10:MonSpace:1030}` và profile owner là `com.mon.monspacev2/.MonDeviceAdminReceiver`.
- Sửa `client/src/components/ViewerSidePanel.tsx`: đổi `Tạo Profile` sang tuyến ADB trực tiếp ở trên, bỏ đường mở `android.app.action.PROVISION_MANAGED_PROFILE` từ shell.
- Build/test: `npm run build` trong `client` pass; `/api/goog/device/adb-command` với `pm list users` trả success và thấy user 10 running.
- Bug tiếp theo: bấm `Tạo Profile` lần nữa trên `27f30c41a3217ece` báo `Cannot add more profiles of type android.os.usertype.profile.MANAGED for user 0`.
- Root cause: lần test trước để lại `UserInfo{10:MonSpace:1030}`; live `dumpsys user` hiện báo `android.os.usertype.profile.MANAGED` có `mMaxAllowedPerParent: 1`, không có `com.mon.monspacev2.usertype.overlay`, và MonSpaceV2 đang chạy từ `/data/app`.
- Sửa `client/src/components/ViewerSidePanel.tsx`: thêm preflight `dumpsys user` trước `pm create-user`; nếu đã hết slot managed profile thì báo lỗi rõ ràng thay vì phun lỗi ADB thô.
- Build/test: `npm run build` trong `client` pass.
- 10:26 13/07/2026: Added `sprict/Start-MonSpaceV2Users.ps1` plus allowlist `sprict/monspacev2-autostart-serials.txt` for `27f30c41a3217ece`; backend ADB tracker now runs it only when that serial is newly online. Script starts MonSpaceV2 managed profiles for that device only and logs to `logs/monspacev2-autostart-<serial>.log`.
- Build/test: script run on `27f30c41a3217ece` found users `10/11` and both reached `RUNNING_UNLOCKED`; `go test ./...` pass; rebuilt `server-go/server-go.exe`.

## 2026-07-14

- **06:25**: Bắt đầu rà soát toàn bộ dự án để tìm nguyên nhân gây ra 2 bug:
  1. Thỉnh thoảng thiết bị (tile) khác tự nhận bàn phím hoặc click chuột khi không được click chọn (focus).
  2. Ở chế độ Viewer, người dùng không click vào dãy Serial ở config sidebar nhưng vẫn nhận thông báo đã copy thiết bị.
- **06:30**: Phát hiện nguyên nhân bug nhận phím ở thiết bị khác:
  - Khi hover pointer qua Tile khác, `onPointerEnter` trong `Tile.tsx` tự động gọi `selectOnly(udid)` và gọi `canvasRef.current?.focus()`, thay đổi `activeUdid` hệ thống.
  - Các sự kiện gõ phím từ `useDirectKeyboard` gửi đến `activeUdid` thông qua `sendToActive(...)`. Do hover chuột tự thay đổi `activeUdid` nên phím gõ lập tức bị chuyển tiếp sang thiết bị mới dù người dùng chưa hề click chọn nó.
- **06:35**: Phát hiện nguyên nhân bug nhận touch/click ở thiết bị khác khi đang kéo/drag chuột:
  - Trong `touchControls.ts` ở hàm `onPointerMove`, nếu người dùng đè chuột (ví dụ để swipe/drag màn hình) trên thiết bị A rồi vô tình lướt pointer qua canvas của thiết bị B:
  - Sự kiện `onPointerMove` trên canvas B thấy `!active.has(e.pointerId)` và `(e.buttons ?? 0) !== 0`, nó sẽ tự động kích hoạt `onPointerDown(e)` giả lập trên canvas B.
  - Điều này làm thiết bị B nhận Touch Down (click) và các Touch Move tiếp theo ngoài ý muốn của người dùng.
- **06:40**: Phát hiện nguyên nhân bug tự động copy Serial (báo Toast "Đã copy: ...") ở chế độ Viewer:
  - Toast "Đã copy: <udid>" được kích hoạt bởi sự kiện click của `.device-serial-title` trong `ViewerSidePanel.tsx`.
  - Do `.device-serial-title` là một `div` (block element) có `display: flex` và có sự kiện `onClick` copy, nằm trong `.vsp-header` có `justify-content: space-between`.
  - Không có thuộc tính giới hạn chiều rộng hay ngăn chặn bubble, hitbox click của Serial-title này có thể chiếm khoảng trống khá lớn ở header. Khi người dùng click gần nút Close hoặc click vào khoảng trống phía bên phải của tiêu đề Serial, click event vẫn trúng vào `.device-serial-title` và kích hoạt sao chép Serial của thiết bị (trong nhiều trường hợp Serial của thiết bị là một chuỗi số trông giống số điện thoại nên người dùng thấy báo đã copy điện thoại).

## 2026-07-15

- **02:43**: Nhận yêu cầu sửa submenu danh sách ứng dụng trong Viewertile (ẩn system apps qua toggle, thêm search bar, click vào hàng ứng dụng để mở app). Trả lời các câu hỏi về Force stop và Clear Cache.
- **02:45**: Triển khai backend: thêm endpoint `/api/goog/device/apps/open` sử dụng lệnh `monkey` để khởi chạy ứng dụng. Compile thành công Go backend.
- **02:47**: Triển khai frontend: thêm state `hideSystem` và `searchQuery`, cập nhật UI Header của submenu, cập nhật hàm lọc/sắp xếp ứng dụng, gắn sự kiện `onClick` mở app trên mỗi hàng ứng dụng và thêm Inspector IDs tương ứng. Build thành công frontend.
- **02:49**: Cập nhật cơ chế hiển thị submenu trong ViewerSidePanel.tsx và ViewerAppsMenu.tsx: lấy toạ độ mouseY từ chuột để hiển thị submenu cao hơn vị trí chuột 30px (có giới hạn biên màn hình để không tràn lên/xuống). Biên dịch frontend thành công.
- **02:54**: Thay đổi định vị submenu sang `rect.top - 30` cố định để không bị giật/lệch vị trí khi di chuyển chuột từ trên xuống. Sắp xếp lại Header của submenu DS ứng dụng trên cùng một hàng (Tìm ứng dụng bên trái, Ẩn System toggle và Refresh bên phải), giảm padding chiều cao và chuyển background sang transparent để đồng màu với sidebar. Đổi màu nút "Xoá Profile" và các nút cảnh báo (`vsp-cmd-warn`) sang màu đỏ thực tế `#ef4444`. Build frontend thành công.
- **02:56**: Khắc phục triệt để màu của "Xoá Profile": thêm thuộc tính `!important` vào class `.vsp-adb-submenu-item.vsp-cmd-warn` trong `styles.css` và bổ sung trực tiếp inline style `color: '#ef4444'` khi nút ở trạng thái active (selectedProfile > 0) trong `ViewerSidePanel.tsx`. Build frontend thành công.
- **02:58**: Loại bỏ trạng thái làm mờ (disabled/opacity) của nút "Xoá Profile": nút luôn hiển thị màu đỏ tươi `#ef4444` rõ nét ở mọi trạng thái. Nếu bấm vào lúc chưa chọn profile thì hiển thị thông báo toast hướng dẫn thay vì tắt phản hồi. Build frontend thành công.
- **03:00**: Loại bỏ khoảng cách (gap) giữa viewer panel và sidebar config: sửa `.viewerOverlayPanel` từ `gap: 10px !important;` thành `gap: 0 !important;` trong `styles.css`. Build frontend thành công.
- **03:04**: Tăng kích cỡ chữ trong bảng config (sidebar) thêm 20%: sửa `.vsp-header-title` (18px), `.vsp-section-title` (17px), `.vsp-section-title-inline` (17px), `.vsp-select` (16px), `.vsp-label` (17px), `.vsp-input` (16px), `.vsp-btn` (16px) và `.device-serial-title` (17px). Điều chỉnh chiều cao của input/select/button lên 36px-38px và tăng chiều rộng `.vsp-panel` lên 280px cùng với các tham số tính toán viewport rộng tương ứng trong `styles.css`. Build frontend thành công.
- **06:21**: Thực hiện cải tiến Ghi chú (NotesModal.tsx): thay đổi cỡ chữ mặc định ban đầu từ 14px xuống 12px để hiển thị logs/text từ AI gọn và dễ nhìn hơn. Đồng thời mở rộng thêm các lựa chọn cỡ chữ nhỏ hơn bao gồm [9, 10, 11, 12, 13, 14, 16, 18, 20, 24] trong menu Cỡ chữ.
- **06:22**: Cập nhật CSS cho `.notesTextarea` trong `styles.css`: đặt font-family là bộ font lập trình monospaced chuẩn (`'Consolas', 'Menlo', 'Monaco', 'Courier New', Courier, monospace !important`) và chỉnh font-size mặc định thành 12px.
- **06:23**: Tiến hành chạy build lại client (`npm run build` trong `client/`).
- **06:24**: Thực hiện hoàn tác (rollback) toàn bộ các thay đổi về cỡ chữ và font của Ghi chú (NotesModal.tsx và styles.css) về nguyên bản (Cỡ mặc định 14px, danh sách lựa chọn [12, 14, 16, 18, 20, 24] và font-family inherit) theo yêu cầu.
- **06:25**: Tiến hành chạy build lại client (`npm run build`).
- **07:10**: Sửa lỗi "Unknown option: --user" của lệnh `monkey` trên một số dòng máy Android bằng cách chuyển sang giải pháp thông minh hơn:
  - Trước tiên, truy xuất tên Launcher Activity cụ thể của gói ứng dụng thông qua lệnh `cmd package resolve-activity --brief --user <userId> <packageName>`.
  - Nếu lấy được Activity, thực thi mở ứng dụng chính xác qua lệnh `am start --user <userId> -n <packageName>/<activity>`.
  - Nếu gặp sự cố, tự động fallback quay về lệnh `monkey` (bỏ `--user` đối với user 0).
- **07:11**: Cưỡng chế tắt backend cũ, thực hiện build lại file `server-go/server-go.exe` thành công và khởi động lại toàn bộ hệ thống launcher `rundev.pyw`.
- **21:04**: Đảo vị trí hiển thị của hàng "DS ứng dụng" và "Cài đặt APK" trong ViewerSidePanel.tsx. Thứ tự hiển thị mới là: DS ứng dụng -> Nhập tệp vào điện thoại -> Cài đặt APK. Build frontend thành công.
- **21:07**: Sửa đổi cơ chế hover submenu: thêm sự kiện `onMouseMove` trên các hàng trigger trong ViewerSidePanel.tsx và ViewerAppsMenu.tsx giúp duy trì submenu mở ổn định khi di chuyển chuột từ submenu quay về lại hàng chức năng tương ứng. Bổ sung xóa `hoverTimer` khi hover chuột trở lại các app items trong danh sách ứng dụng. Loại bỏ khoảng trống (gap 4px) giữa Level 1 submenu và Level 2 submenu (app actions) bằng cách cho chúng chồng đè nhẹ lên nhau 4px. Build frontend thành công.
- **21:18**: Đổi trạng thái mặc định của toggle "Ẩn System" từ Off sang On (`hideSystem` mặc định là `true`). Build frontend thành công.
- **21:28**: Theo yêu cầu của người dùng, tải về và cài đặt Apktool phiên bản mới nhất v3.0.2 tại thư mục `C:\Users\Mon\Desktop\Protect\Tool\apktool_3.0.2.jar`. Giữ nguyên phiên bản cũ `apktool_2.12.0.jar` để dự phòng tính tương thích ngược.
- **04:05**: Khắc phục lỗi hiển thị thông báo toast khi thiết bị chưa kết nối hoặc mất kết nối ADB (lỗi 'device not found' / 'device offline'). Trong `ViewerAppsMenu.tsx` ở hàm `fetchApps`, nếu lỗi trả về chứa các từ khóa 'not found', 'offline', 'device', ứng dụng sẽ bỏ qua việc hiển thị thông báo toast lỗi để tránh làm phiền người dùng lúc thiết bị chưa sẵn sàng kết nối. Build frontend thành công.
- Yêu cầu chẩn đoán read-only: `27f30c41a3217ece` nhận stream chậm; không sửa code, reboot hay flash.
- Root cause chính được chứng minh live: `framework.jar` checksum `0x5bdb7081` nhưng `boot-framework.oat` còn chờ `0xa9727315`; mỗi `app_process` bị ART từ chối boot image và chạy `dex2oat64` lại trong `6.1-8.0s`.
- Trace MonViewPhone khớp trực tiếp: lần start sạch cuối mất `8.152s` từ `SCRCPY_START_BEGIN` đến `SCRCPY_START_OK`, first frame ở `8.287s`. Live benchmark mặc định `8.583s`; `taskset ff` vẫn `7.375s`, nên cpuset không phải root cause hiện tại.
- Lý do riêng máy này còn lỗi: báo cáo N16.2 ghi rõ `27f30c41a3217ece` được giữ làm máy đối chiếu read-only và chưa từng flash; 13 máy đã flash N16.2 không còn mismatch/per-launch dex2oat.
- Lỗi phụ MonViewPhone làm thời gian xấu thêm: nhiều WebSocket cùng serial với profile `894/30fps` và `500/24fps` đóng session đang start, tạo retry; cleanup gọi API không tồn tại `spawnAndWaitLegacy`, để lại 4 JAR session trong `/data/local/tmp`. Lỗi phụ không giải thích được 8 giây của lần start cuối không bị ngắt.
- Sau khi người dùng cho phép sửa ROM, đã flash N16.2 no-wipe lên `27f30c41a3217ece`; best `app_process64/32` còn `1.148s/1.199s`, ART không còn checksum mismatch hoặc per-launch `dex2oat`.
- Trace MonViewPhone thật sau flash: `SCRCPY_START_BEGIN -> SCRCPY_START_OK` còn `0.441s` (trước `8.152s`), first video data ở `1.116s`; root cause ROM được xác nhận đã sửa.
- Race WebSocket/cleanup `spawnAndWaitLegacy` là vấn đề phụ riêng, chưa sửa trong lượt flash ROM này.

## Ngày 18/07/2026

- Yêu cầu: kiểm tra read-only vì đổi trạng thái tài khoản trong MonViewPhone không làm Nova vẽ lại badge/icon WeChat.
- Nguyên nhân: `DeviceAccountOverlay.tsx` và `Tile.tsx` vẫn có `onSyncNovaWechat`, nhưng `App.tsx` bị thiếu phần callback thực tế (`syncNovaWechatForDevices`, URI provider Nova, builder lệnh sync), nên đổi trạng thái chỉ cập nhật data mà không đẩy snapshot xuống phone.
- Fix: khôi phục logic sync Nova trong `client/src/App.tsx`, nối callback xuống `Tile` và `DeviceAccountOverlay`; sync chỉ chạy khi được gọi bởi đổi trạng thái/tác vụ liên quan hoặc nút `Sync Nova`, không có vòng auto-sync theo `vault`.
- Build client thành công với `npm run build`.
- Kiểm tra `R58N22VK5RL`: crash buffer có `com.genymobile.scrcpy.CleanUp` `SIGABRT` kèm `ClassNotFoundException`, nhưng `ps` không còn tiến trình cleanup live.
- Trace stream backend cho `R58N22VK5RL` có một lần `scrcpy server exited prematurely` rồi retry thành công; sau đó nhận video packets bình thường, không thấy lỗi framework thiếu file.
- Profile stream của `R58N22VK5RL` đang nặng hơn các máy khác (`maxSize=1000`, `maxFps=60`, `videoBitRate=8388608`), nên lag nghiêng về cấu hình stream/backend hơn là `services.jar`.

## Ngày 19/07/2026

- Yêu cầu: phân biệt lỗi WhatsApp không nhận click/nhập trong MonViewPhone trên `R58N22VK5RL`; không patch tiếp `services.jar` khi chưa có bằng chứng.
- Kết quả test: video/capture hoạt động; `adb shell input tap` và đường control SDK của MonViewPhone không mở được màn WhatsApp registration.
- Test quyết định: official `scrcpy 3.3.4` với `--mouse=uhid --keyboard=uhid` cho phép người dùng click và nhập số điện thoại được, nên lỗi nằm ở kiểu input SDK/MonViewPhone control, không phải ROM/`FLAG_SECURE`.
- Đã thử candidate backend `inputMode=uhid` bằng HID touchscreen và HID mouse, nhưng chưa pass absolute click từ browser; đã gỡ candidate khỏi source để không để lại nhánh fail.
- Giữ công cụ test official tại `tools/scrcpy-v3.3.4`; log/UI dump lưu trong `logs/`. Hướng fix đúng nếu tích hợp vào MonViewPhone là làm chế độ UHID pointer-lock/relative mouse giống scrcpy, hoặc dùng official scrcpy UHID làm đường tạm.
- Yêu cầu tiếp: thêm chế độ điều khiển UHID tuỳ chọn trong MonViewPhone, giữ video pipeline hiện tại và SDK là mặc định.
- Backup trước sửa: `backups/uhid_control_20260719_011012` kèm hash các file quan trọng.
- Fix hiện tại: thêm setting global `ControlMode { mouseMode, keyboardMode }`, UI chọn trong modal `Cài Đặt Hệ Thống`; bỏ badge `SDK/UHID` khỏi màn stream theo yêu cầu.
- Backend `stream-node`: thêm control packet `uhidTouch` và `uhidKeyboard`, dùng `controller.uHidCreate/uHidInput/uHidDestroy` của `@yume-chan/scrcpy`; không mở `scrcpy.exe` riêng và không tạo video pipeline thứ hai.
- Root cause lệch touch: UHID raw ban đầu map vào full panel `deviceSize=[1440,3200]`, còn video stream là logical viewport trong `physicalFrame=[0,400,1440,2800]`.
- Fix lệch touch: `ScrcpySession` parse `dumpsys input` một lần để lấy `Viewport INTERNAL`, rồi map video 0..1 qua `physicalFrame` trước khi gửi raw 0..32767; log xác nhận trên `R58N22VK5RL`: `xOffset=0`, `yOffset=0.125`, `xScale=1`, `yScale=0.75`.
- Dọn nhánh UHID mouse/pointer-lock cũ trong `touchControls.ts` và `useTileStream.ts`: click/swipe vẫn dùng flow SDK-like hiện có, chỉ đổi packet gửi ra thành `uhidTouch` khi mode là UHID.
- Build pass: `npm run build` trong `client` và `stream-node`; đã restart riêng stream-node port `11080`.

## Ngày 27/07/2026

- Yêu cầu: kiểm tra báo cáo N16 bằng live reboot và xác nhận MonViewPhone nhận stream nhanh; lượt này không sửa code MonViewPhone.
- Reboot `2870da3de13f7ece`: ADB disconnect sau `2435 ms`, trở lại sau `27069 ms`, `sys.boot_completed=1` và boot animation stopped sau `40549 ms`.
- Auto-reconnect bắt đầu khi máy chưa boot hoàn tất: `SCRCPY_START_OK=458 ms`, first video packet `1115 ms`; đây là bằng chứng reconnect, không dùng thay mốc boot.
- Clean reload khi máy đã ổn định: vì dashboard mở đồng thời 35 máy nên target chờ queue; sau khi session target bắt đầu, `SCRCPY_START_OK=1782 ms`, first video packet `1933 ms`.
- Canvas đổi từ mặc định `300x150` sang frame thật `296x496` và hiển thị live; first packet trong log là H.264 phía server, không phải timestamp draw đầu tiên phía browser.
- Gotcha: script đo lần đầu dùng `$PID`, là biến read-only của PowerShell, nên in PID host thay vì `system_server`; live PID thật sau boot là `4975`. Boot timing vẫn được gate độc lập bằng `sys.boot_completed` và `init.svc.bootanim`.
- Kết luận: N16.2 đã sửa regression ART gây stream chậm; thời gian khởi tạo stream sau request hiện dưới `2 s`. Delay khi reload toàn dashboard chủ yếu là queue `max=2`, không phải boot-framework mismatch.
- Yêu cầu: reset `scrcpy` riêng máy `28b85ba51b1c7ece` vì MonViewPhone đã nhận WebSocket nhưng không có hình; không sửa code và không ảnh hưởng stream máy khác.
- Kill `com.genymobile.scrcpy.Server` và xoá JAR session chưa đủ: tiến trình mới vẫn dừng trước encoder, `videoPackets=0`; kiểm tra trực tiếp thấy `dumpsys SurfaceFlinger --list` treo quá `10 s`, trong khi máy A12 tốt `269c5ad06a0d7ece` trả trong `0,07 s`.
- Máy là user build, không có `su`; `setprop ctl.restart surfaceflinger` bị từ chối. Đã reboot đúng serial `28b85ba51b1c7ece` để reset graphics stack.
- PASS sau reboot: `SurfaceFlinger` trả trong `0,061 s`; `SCRCPY_START_OK=431 ms`, encoder `OMX.Exynos.AVC.Encoder`, `FIRST_VIDEO_DATA_PACKET=1304 ms`; heartbeat đạt `300` packet và control key/touch tiếp tục hoạt động.
- Yêu cầu: sửa warning Grid `render Tango đang hồi...` còn xuất hiện ngẫu nhiên; đổi Viewer/Grid thủ công làm `R58N22VK5RL` hồi ngay.
- Baseline live: cả `35/35` tile tự đóng/mở cùng profile gần đúng mỗi `120 s`; các lần đóng đều có `bufferedAmount=0`, `droppedFrames=0`, nên không phải nghẽn WebSocket/backpressure.
- Root cause: watchdog dùng tuổi bitmap và packet gần nhất nên nhầm màn hình tĩnh là stream chết; deadline reconnect `12 s` lại bị lồng trong điều kiện packet mới, còn timeout `90 s` sau first frame coi video tĩnh không phát packet là mất kết nối.
- Fix tối giản: theo dõi riêng video data đã đến nhưng chưa present bằng `pendingRenderSince`, kiểm deadline reconnect độc lập, bỏ timeout im lặng sau first frame nhưng giữ startup guard; không thêm dependency.
- Regression PASS: `check-stream-watchdog.mts`, `check-canvas-renderer.mts`, `check-tango-protocol.mts` và `npm run build`; port `11000` đang phục vụ bundle mới `index-7SApAzR6.js`.
- Không ép reload khi `Automation Playback` còn chạy `Seeding`; launcher restart sạch MonViewPhone lúc `13:24:15` sau khi job kết thúc và nạp bundle mới.
- Live PASS từ `13:24:18` đến `13:29:54`: đủ `35/35` first frame, `35` serial unique, `0` close, `0` accept lặp; `R58N22VK5RL` giữ đúng một session. Grid cuối không còn overlay recovery và đã vượt hơn hai lần chu kỳ lỗi cũ `120 s`.
- Yêu cầu: bỏ nút `Automation` và `Max âm lượng` khỏi Quick controls; giữ `Tắt tiếng` và `Mở âm lượng`, trong đó mở âm lượng phải tự nâng đúng max trên nhiều hãng/ROM/Android.
- Root cause code cũ: `Mở Âm Thanh`/`Max âm lượng` hard-code index `7/15`, không đúng các máy có media max `25`; `Tắt tiếng` chỉ dùng `cmd notification`, lệnh này không tồn tại trên MIUI Android 10; helper Quick controls còn nuốt kết quả API `success=false`.
- Inventory live có `35/35` ADB online. Chọn `11` nhóm đại diện Samsung/Xiaomi, stock/Pixel ROM, Android `10/12/13/14/15`; hiện không có Android 11 online để test trực tiếp.
- Test trước sửa PASS đủ `11/11` nhóm: DND total silence + streams `1..5` về min hiệu dụng, sau đó DND off + đọc range từng stream và nâng đúng max; snapshot zen/ringer/volume của từng máy đều được hoàn nguyên.
- Khác biệt đã xử lý: SDK 29 dùng legacy `media volume` và Binder notification transaction `96`; SDK 31+ dùng `cmd media_session`/`cmd notification`; PixelOS Android 14 `R58N22VK5RL` trả success nhưng bỏ qua set volume chuẩn nên cần readback và fallback `service call audio 12`.
- Review phát hiện transaction audio thay đổi theo SDK (`setStreamVolume` là `10` trên Android 10, không phải `12`); đã khóa Binder audio fallback chỉ cho SDK `34` đã decompile/test live. SDK khác không đạt readback sẽ báo lỗi, không gọi nhầm Binder method.
- Sửa `App.tsx`: Quick controls còn `6` action, localStorage order cũ tự lọc hai ID đã bỏ; panel Automation riêng vẫn giữ nguyên. Thêm `quickAudio.ts` tạo một multiline shell action/device với capability probe, range động, readback và lỗi rõ ràng.
- Live qua API backend thật port `11000` PASS trên MIUI Android 10 `1d65d69e`, Samsung stock Android 13 `RFCN30H078F` và PixelOS Android 14 `R58N22VK5RL`: mute có `mZenMode=ZEN_MODE_NO_INTERRUPTIONS`; mở lại đạt max mọi stream. Mọi snapshot sau test đều restore PASS.
- Hai lỗi chỉ thuộc harness: lần đầu chạy `.mts` thiếu Node flag nên đã đổi self-check sang `.mjs`; PowerShell `OrderedDictionary` hiểu key volume là index và tạm để `R58N22VK5RL` ở mức mute, đã khôi phục ngay về `5,5,5,6,5`/zen `0` rồi rerun PASS.
- Kiểm tra cuối PASS: `node scripts/check-quick-audio.mjs`, `npm run build`, `git diff --check`; port `11000` đang phục vụ bundle mới `index-VrHFPFpl.js`.

## Ngày 28/07/2026

- Yêu cầu: sửa toast nhập nhiều ảnh bị xếp chồng thành hàng dài, che kín Viewer/Grid.
- Root cause: helper chung `showToast` nối từng thông báo vào mảng; mỗi file tạo một toast sống riêng `4 s`, nên batch lớn làm toàn bộ toast cùng xuất hiện.
- Fix tối giản trong `ViewerSidePanel.tsx`: chỉ giữ một toast, thông báo mới thay thông báo cũ; khóa theo `id` để timer cũ không xóa nhầm toast mới. Thêm `overflow-wrap: anywhere` để tên file dài tự xuống dòng.
- Kiểm tra PASS: `npm run build`; trên app thật port `11000`, bấm tạo toast `8` lần liên tiếp thì DOM luôn có đúng `1` `.vsp-toast`, timer mới vẫn còn sau deadline của timer cũ, style thực tế là `overflow-wrap: anywhere`.
- Yêu cầu: chẩn đoán ảnh nhập từ MonViewPhone không hiện trong Photos trên `2a7daa5dee3f7ece`, đồng thời tìm nguyên nhân nhiều màn hình vật lý tự bật lại.
- Ảnh `61321312.png`, `6132321321.jpg`, `624262432432.png` đã nằm thật trong `/storage/emulated/0/DCIM/Camera`, nhưng MediaStore giữ `is_pending=1`, `width/height=NULL`; Photos ẩn đúng các row pending này.
- Root cause phía máy: `ModernMediaScanner` thất bại đúng lúc nhập với `IllegalArgumentException: Volume external_primary not found` và `Didn't find cached volume scan paths`. Fast path user 0 trong `server-go/rest.go` bỏ qua lỗi của broadcast scan nên MonViewPhone vẫn báo push thành công.
- Root cause màn hình tự bật: mọi scrcpy session đang hard-code `powerOn: true`, `stayAwake: true`; `SessionManager.start` đóng session cũ trước khi tạo session mới. Log lúc `19:07` cho thấy `29` máy bị tạo lại session trong cùng phút, nên màn hình vật lý đã tắt bị bật lại. Tab browser kiểm thử toast mở ở lượt trước tạo một grid client thứ hai và là tác nhân trực tiếp của đợt restart vừa quan sát.
- Lượt này chỉ đọc code/log/ADB; không sửa code, không restart MediaProvider và không đổi trạng thái điện thoại. Hai lỗi harness đã xử lý: PowerShell từng lấy ký tự đầu `C` khi mảng ADB co thành scalar; truy vấn MediaStore ban đầu sai quoting/column, đã đổi sang executable path cố định và query toàn bộ row theo projection hợp lệ.
- Yêu cầu tiếp: sửa dứt điểm việc đóng/mở Grid/Viewer hoặc reconnect stream làm toàn bộ màn hình vật lý tự bật.
- Root cause đầy đủ: ngoài `powerOn: true`, đường tắt panel qua control WebSocket của scrcpy còn đăng ký `CleanUp` khôi phục display về `NORMAL` khi session đóng; `stayAwake: true` cũng để scrcpy sở hữu/hoàn tác trạng thái thức dù frontend đã persist `stay_on_while_plugged_in=7`.
- Fix tối giản: `client/src/App.tsx` bỏ lệnh screen-power qua scrcpy, chỉ dùng helper REST `surfacecontrol`; `stream-node/src/scrcpySession.ts` đặt `powerOn: false`, `stayAwake: false`. Android vẫn thức bằng setting ADB sẵn có, nhưng vòng đời scrcpy không còn quyền bật lại panel.
- Live PASS: log bản cuối có `35` session `powerOn=false/stayAwake=false`, `0` screen-power packet, `0` cờ true. Cưỡng bức đóng/mở session `R58N22VK5RL` ba lần cho `100/100` mẫu SurfaceFlinger giữ `Off`; full restart MonViewPhone cho `150/150` mẫu giữ `Off`; sau restart đủ `35/35` máy online báo panel vật lý `Off`.
- Build/test PASS: `npm run build` và self-check `scrcpySession.ts` trong `stream-node`, `npm run build` trong `client`, `go test ./...`, health port `11000/11080`.
- Chẩn đoán ảnh được chốt là lỗi riêng clone user `12` trên `2a7daa5dee3f7ece`: khi user chạy, MediaProvider báo `Volume external_primary not found`; stop user thì push/scan thành công và các row cũ đã về `is_pending=0`. Theo yêu cầu không giữ patch MediaStore; đã gỡ hoàn toàn nhánh code thử, dọn toàn bộ ảnh test, rồi mở lại user `12` thành `RUNNING_UNLOCKED`.
- Vá trường hợp reboot/reconnect hiếm: sau khi ADB online, frontend chờ `3 s` rồi thử tắt panel tối đa `3` lần, cách nhau `2 s`; chỉ đánh dấu máy đã chuẩn bị sau khi helper `surfacecontrol` thành công. Bundle production mới đã nạp và kiểm tra hiện tại đủ `35/35` panel vật lý ở trạng thái `Off`.
- Yêu cầu: tải và đánh giá Fossify Gallery trên máy mẫu `R58N22VK5RL`.
- Tải APK chính thức Fossify Gallery `1.13.1` (`versionCode 28`) vào `C:\Users\Mon\Downloads\Fossify-Gallery-1.13.1.apk`; SHA-256 `ae7e699599e81f70e2b82626bb1dfa883fe096cd938387133e123c116e5641d9` khớp digest release, chữ ký APK hợp lệ.
- Cài riêng user `0`; user `10/11/12` không cài và Google Photos không bị thay đổi. Chỉ cấp `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `ACCESS_MEDIA_LOCATION`, `MANAGE_MEDIA`; `MANAGE_EXTERNAL_STORAGE` vẫn không được cấp và manifest không có `INTERNET`.
- Live PASS: mở bằng launcher entry chính thức, app giữ foreground, không crash/permission prompt, đọc đúng album `Internal` (`14`) và `WeChat` (`4`). Dấu hiệu tự về launcher trong phép thử ban đầu là pointer/Back-HOME hoặc mở thẳng `MainActivity`, không phải timer/crash của app.
- Đo live khi mở: APK/code khoảng `37.8 MB`, `TOTAL PSS 71,436 KB`, `TOTAL RSS 196,156 KB`; có một `NewPhotoFetcher` content-trigger job đang `Ready=false`, không có active job. Kết luận: phù hợp làm gallery offline dễ dùng, nhưng không phải loại siêu nhẹ.
- Sau test đã gọi đúng endpoint display-power; helper trả `OK display power off`, SurfaceFlinger xác nhận power mode `0`, stream/app vẫn chạy.
- Yêu cầu: thêm hàng `Xuất Tệp` ngay dưới `Nhập tệp vào điện thoại`; mở trình duyệt thư mục theo profile, chuột phải tệp có đúng `Xuất Tệp` và `Xoá Tệp`.
- Chọn cách tối giản: tái dùng modal/context menu/toast/API pattern hiện có, không thêm dependency; bỏ luồng file-browser `multiplex` cũ vì backend hiện tại không còn hỗ trợ.
- Frontend: mặc định mở `/storage/emulated/<profile>/Download`, có nhập đường dẫn, lên thư mục cha, refresh, folder-first, trạng thái loading/error/empty, xác nhận xoá trong app và hiển thị đường dẫn máy tính sau khi xuất.
- Backend: thêm ba endpoint `files/list`, `files/export`, `files/delete`; mọi lệnh ADB khóa theo serial. Listing dùng record NUL + metadata thật để giữ tên có khoảng trắng/xuống dòng; xoá chỉ cho tệp trong shared storage và chặn root/system.
- Tệp xuất được kéo vào `.part` rồi mới publish nguyên tử tại `exports/<safe-udid>/`; tên trùng tự tăng `(1)`, `(2)` và `exports/` đã được Git bỏ qua.
- Kiểm tra PASS: `npm run build`, `go test -count=1 ./...`, `git diff --check`; probe read-only trên `27f30c41a3217ece` đọc được `9` entry cùng metadata thật.
- Đã build `client/dist` và `server-go/server-go.exe`. Theo yêu cầu không restart/mở test; PID backend hiện tại giữ nguyên, bản Go mới sẽ được nạp khi người dùng restart MonViewPhone.

## Ngày 29/07/2026

- Yêu cầu: chẩn đoán vì sao chuột phải/`Back` trong MonViewPhone không đánh thức `R58N22VK5RL` như Laixi/Xiaowei.
- Live ADB thuần đọc xác nhận Owner không bị keyguard khóa (`deviceLocked=0`, keyguard không showing); máy đang ngủ thật (`mWakefulness=Dozing`, input non-interactive, panel vật lý `OFF`) sau timeout.
- Log phiên hiện tại xác nhận cú chuột phải đã tới backend và được chuyển tiếp thành control `keycode`; lỗi không nằm ở UI/WebSocket. `touchControls.ts` chỉ gửi `KEYCODE_BACK`, trong khi `Back` không phải wake key.
- Nguyên nhân chồng lớp: scrcpy được khởi tạo đúng chủ đích với `powerOn=false`, `stayAwake=false`, còn guard giữ thức của frontend hiện không còn hiệu lực trên máy (`stay_on_while_plugged_in=0`, timeout `30000 ms`), nên máy được phép rơi vào doze.
- Laixi/Xiaowei nhiều khả năng có bước wake/power-on riêng trước `Back`; lượt này không gửi input, không wake/unlock máy và chưa sửa code.
- Follow-up reboot: `R58N22VK5RL` boot lúc `23:59:56` với boot reason `recovery`; sau boot setting giữ thức là `0`, trong khi bốn máy y2s cùng nhóm vẫn là `7`.
- Root cause luồng chống ngủ: `ensureStayAwakeForDevice` chạy chỉ `3 s` sau ADB online, không đợi `sys.boot_completed`, không readback và đánh dấu serial đã chuẩn bị ngay cả khi `runAdbCommandApi` trả `{ success: false }`; retry chỉ chạy khi Promise bị reject. Vì vậy reboot/early-ADB có thể để máy ở `0` nhưng frontend vẫn tưởng đã áp dụng thành công.
- Hướng sửa tối giản: gate theo boot-complete, kiểm tra `success`, đọc lại setting phải bằng `7` rồi mới cache/tiếp tục tắt panel; lượt follow-up vẫn chỉ đọc và chưa patch code.
- Fix hoàn tất trong `App.tsx`: lệnh shell chờ `sys.boot_completed=1`, đặt và readback `stay_on_while_plugged_in=7`, propagate `{ success:false }`, bỏ cache Stay Awake theo serial; chỉ đánh dấu auto-prepare khi ADB endpoint thật có state `device`, nên `recovery`/offline kể cả Viewer `deviceParam` đều invalidate trạng thái cũ.
- Thêm self-check `client/scripts/check-stay-awake.mjs`; self-check và `npm run build` PASS. Production port `11000` đang phục vụ bundle `assets/index-s9rRfg29.js`.
- Live PASS trên `R58N22VK5RL`: API thật trả `7`, PowerManager báo `mWakefulness=Awake`, `mStayOn=true`; chỉ gửi `KEYCODE_WAKEUP` một lần, không dismiss/unlock keyguard, rồi helper tắt lại panel.
- Trạng thái cuối đúng mục tiêu: SurfaceFlinger built-in `powerMode=Off`, `isPoweredOn=0`, hai virtual display vẫn `On`; `dumpsys display mActualState=ON` là state logic của PowerManager và không đại diện panel vật lý sau helper SurfaceControl.
- Yêu cầu: thử cả SHARE user và importer ảnh batch trên crownlte `27f30c41a3217ece`; giữ nguyên các space/WeChat hiện tại, user `0` tiếp tục dùng đường push cũ và không sửa ROM.
- Chọn cách tối giản: APK Java thuần chứa `ContentProvider` native, không dependency/foreground service; Android tự khởi động provider theo user và backend giữ warm-cache. Helper v3 chỉ cài ở user `0` + user đích theo nhu cầu.
- Frontend dùng một batch cho tối đa `100` ảnh `png/jpg/jpeg/webp/gif` của user phụ; owner `0`, `QR.*`, file hỗn hợp/không hỗ trợ và batch quá giới hạn vẫn đi đúng đường legacy.
- Batch protocol kiểm tên/kích thước/SHA-256, từ chối tên trùng, rollback kiểm đúng số row; kết quả provider giữ `60 phút` để status retry an toàn, parse field exact và coi commit provider là authoritative trước lỗi transport muộn.
- Các lỗi trong lúc làm đã sửa: chọn SDK PowerShell từng ép sai kiểu version; locator APK từng lặp `server-go\server-go`; review bắt batch browser đặt nhầm trong handler APK; chữ ký v4 sinh `.idsig` thừa; lệnh deploy gộp bị policy chặn trước khi chạy nên đã tách bước có kiểm PID/path.
- Build/deploy PASS: `go test -count=1 ./...`, `go build ./...`, client `npm run build`, APK v3 signature; backend port `11000` đang chạy đúng binary final và phục vụ bundle `index-BS1VmjmE.js`.
- Benchmark cùng ba ảnh `1,295,568 B`: owner `0` legacy mất `902 ms`; user `11` legacy cũ khoảng `12,540.6 ms`; batch warm v3 mất `2,620 ms` (`provider=1,353 ms`) — nhanh hơn đường user phụ cũ khoảng `4.79x`, nhưng vẫn chậm hơn raw owner khoảng `2.90x`. Lần đầu nâng/cài helper v3 mất `10,460 ms`.
- Live integrity PASS: `12/12` row batch v2/v3 đọc ngược đúng SHA-256 `FA6BF27F...BE2EAC7`, `_size=1295568`, `is_pending=0`; mọi file/row benchmark đã xoá đúng ID/prefix.
- SHARE user `13` (`CodexShareTest`) giữ nguyên để thử, nhưng hướng thư viện dùng chung hiện FAIL trên ROM này: khi SHARE chạy, MediaStore owner tạo row `is_pending=1`, `_size=NULL`; vì vậy chưa nên dùng SHARE làm production nếu chưa vá ROM/MediaProvider.
- Trạng thái cuối: users `0/10/11/12/13` đều running; WeChat còn ở `10/11/12`; helper v3 chỉ có ở `0/11`, user khác sẽ được enable on-demand. Do lỗi finalize của SHARE, provider đang publish metadata trước khi ghi bytes nên có cửa sổ thấy ảnh một phần rất ngắn; muốn atomic hoàn toàn cần sửa ROM rồi trả về flow `IS_PENDING`.
- Yêu cầu: kiểm tra `R58N22PK6XH` đang ngủ hay khoá và vì sao chuột phải/`Back` của MonViewPhone không mở máy như Laixi/Xiaowei.
- Live trước tác động: `mWakefulness=Dozing`, display `OFF`, SurfaceFlinger `isPoweredOn=0`; keyguard `showing=false`, `mInputRestricted=false`, nên máy chỉ ngủ chứ không bị khoá. Setting vẫn là `stay_on_while_plugged_in=7`, timeout `30000 ms`.
- Đã gửi đúng serial một lần `input keyevent 224` (`KEYCODE_WAKEUP`), không dismiss/unlock keyguard. PASS sau `800 ms`: `Awake`, display `ON`, `isPoweredOn=1`, Nova Launcher resumed; trạng thái vẫn giữ sau lần kiểm tra tiếp theo.
- Root cause code: chuột phải trong `touchControls.ts` chỉ gọi `sendBackKey()` và gửi `KEYCODE_BACK`; `BACK` không phải wake key. Hướng sửa tối thiểu nếu được yêu cầu: gửi `KEYCODE_WAKEUP` trước rồi mới `BACK`, không dùng `KEYCODE_POWER` vì có thể toggle ngược.
- Yêu cầu chốt: mọi box-phone stream qua MonViewPhone phải giữ Android luôn `Awake`, còn panel vật lý luôn `OFF`.
- Root cause `screen_off_timeout=30000`: đây là mặc định ROM/framework; nhánh từng ép `2147483647` bị mất khi `main` reset sang lineage rollback ngày `12/07/2026`, không có bằng chứng code hiện tại ghi lại `30000`.
- Fix tối giản tại shared path `ensureStayAwakeForDevice`: chờ boot hoàn tất, chạy `svc power stayon true`, đặt/readback `stay_on_while_plugged_in=7` và `screen_off_timeout=2147483647`, chỉ gửi `KEYCODE_WAKEUP` khi PowerManager chưa `Awake`, rồi mới gọi helper `SurfaceControl` ép panel `OFF`.
- Xoá helper Stay Awake không có caller; ban đầu hiểu quá cứng yêu cầu nền nên đã bỏ Quick Action `Bật màn hình` và `Power key`, sau đó khôi phục ngay khi người dùng làm rõ đây là hai override thủ công cho máy được chọn. Không thêm dependency hay watchdog polling.
- Self-check `node scripts/check-stay-awake.mjs`, frontend `npm run build` và `git diff --check` PASS; bundle cuối có đủ hai override thủ công là `assets/index-Dz9i5Tum.js`.
- Theo yêu cầu cuối, không reload cửa sổ MonViewPhone và không chạy batch ghi trạng thái lên điện thoại; người dùng sẽ tự reload để bundle mới tự áp dụng cho các máy online.
- Yêu cầu: cài `Fossify-Gallery-1.13.1.apk` lên toàn bộ thiết bị ADB đang online.
- APK xác nhận là `org.fossify.gallery`, `versionName=1.13.1`, `versionCode=28`, `minSdk=26`; cài song song bằng lệnh serial-pinned, kết quả `35/35` máy `Success`, không có máy lỗi và không cấp thêm runtime permission.
- Xác minh độc lập `dumpsys package` + `pm path` PASS `35/35`; kiểm tra mẫu multi-user `2a7daa5dee3f7ece` cho thấy package hiện diện ở toàn bộ user `0/10/11/13/14/15`.
- Yêu cầu: rà helper WeChat cũ và gộp với media batch importer thành một APK, sau đó đổi tên dễ quản lý thành `Monhelper`.
- Audit read-only `35` máy xác nhận standalone `com.mon.wechatnotify` không còn; WeChat listener hiện nằm trong Nova `com.teslacoilsw.launcher/mon.space.WechatNotificationListener` và đang bật trên `25/35` máy. APK Nova live `27f30c41a3217ece` khớp SHA-256 với baseline đúng ROM crownlte tại `PixelExperience_crownlte-13.0-20231216-1149-OFFICIAL`.
- Chọn cách ít rủi ro: không nhét importer vào Nova A13/A14; giữ package/authority `com.monviewphone.mediaimport` để nâng cấp v3 tại chỗ, bump v4 và thêm `WechatNotificationListener` tương thích log tag `MonWechatNotify`. Bỏ `EventStore` không có reader và không khôi phục poll logcat fleet mỗi `3.5 s` từng gây lag.
- Artifact/app label đổi thành `server-go/mediaimport/bin/Monhelper.apk` / `Monhelper`; build script tự xoá artifact tên cũ sau khi bản mới đã ký và tự kiểm đủ provider/service trong manifest.
- Build đầu thất bại vì public Android SDK stub không lộ `UserHandle.getIdentifier()`; đã dùng reflection giống helper cũ để đọc đúng clone user mà không compile hidden API.
- Kiểm tra PASS: APK v4 `16,727 B`, SHA-256 `bfdb7d2ce48f49aa2dc95f3f1bddcefa5c699babfc6181ef30eae2db6616043b`, signer SHA-256 `680f998e...03bf4`; chữ ký khớp APK v3 đang cài read-only trên `27f30c41a3217ece`; `go test ./...` và `go build ./...` PASS.
- Chưa cài v4 hoặc đổi notification-listener state trên máy. Giữ Nova listener khi canary; chỉ tắt riêng `mon.space.WechatNotificationListener` sau khi `Monhelper` thấy notification clone, không được tắt listener notification-dots gốc của Nova.
- Follow-up N19.1 trên `27f30c41a3217ece`: sau ROM patch, Monhelper v4 batch vào SHARE user `13` PASS `3` ảnh / `233799 B`, provider `1048 ms`, tổng `3485 ms`; user `0/13` đọc cùng ba MediaStore `_id`.
- Root cause importer không test được owner là hai guard `userID <= 0` còn sót trong `handleLocalMediaImport` và `ensureMediaImporter`; sửa tối thiểu thành chỉ từ chối user ID âm, không đổi protocol/dependency/install flow.
- Live owner batch sau sửa PASS `3` ảnh / `233799 B`, provider `1060 ms`, tổng `3650 ms`; user `0/13` cùng thấy `_id` `1000000135..137`, `_data` duy nhất dưới `/storage/emulated/0/DCIM/Camera/`.
- Xóa exact URI từ user `13` làm row biến mất ở cả user `0/13` và backing owner không còn đọc được; toàn bộ test row/file đã được dọn. `go test .` PASS.
- Kết luận triển khai: MonViewPhone nên luôn nhập thư viện chung qua Monhelper user `0`; SHARE users sử dụng cùng MediaStore, không cần đẩy/copy ảnh N lần hoặc chạy sync daemon.

## Ngày 30/07/2026

- Yêu cầu chốt: `Risk Nearby` dùng notice `31` ngày; khi notice đến hạn chỉ tự động chuyển `Risk` sang `Live`, không xóa notice.
- Root cause: chưa có luồng xử lý trạng thái khi notice hết hạn; hai menu tạo `Risk Nearby` bằng code lặp.
- Fix tối giản: dùng chung builder 31 ngày cho hai menu; scheduler tại `App` tự chờ hạn gần nhất, chỉ đổi status, thêm history `Live`, lưu vault/`Data.db` và đồng bộ Nova cho máy online.
- Lần đầu hiểu yêu cầu là chuẩn hóa về 30 ngày và xóa notice khi đổi `Live`; đã sửa lại ngay theo yêu cầu chốt, không giữ hành vi đó.
- Kiểm tra PASS: `node --experimental-strip-types scripts/check-risk-nearby-expiry.mts`, `npm run build`, và `git diff --check`; build chỉ còn cảnh báo chunk Vite lớn hơn `500 kB`.
- Trước khi dọn/refactor toàn repo, đã tạo bản sao đầy đủ tại `C:\Users\Mon\Desktop\Protect\MonViewPhone_Backup_20260730_040720`, gồm `.git`, file chưa commit và file ignored. Đối chiếu PASS: `18.626` file, `2.508.906.289` byte, dry-run `robocopy` không còn chênh lệch, hash các file quan trọng và `git status` khớp hoàn toàn.
- Audit import graph ban đầu tìm thấy `13` module TS/TSX không còn reachable: xóa `12` module (`1.577` dòng) gồm pipeline `tinyh264`/worker legacy, component cũ và wrapper `Tile.tsx`; giữ parser `wechatNotifyLog.ts` dormant theo tài liệu dự án. Audit cuối có `65` module, `64` reachable từ `main.tsx` và đúng `1` parser dormant có chủ ý, không còn module unreachable ngoài dự kiến.
- Dọn dependency tối thiểu: bỏ `tinyh264` và `xterm-addon-attach`, chuyển `javascript-obfuscator` sang `devDependencies`, xóa coverage tạm `server-go/$cover` và ignore đúng tên này; `npm ci` PASS. Không chạy auto-fix cho `npm audit` vì còn `9` cảnh báo từ dependency và force-upgrade có thể làm lệch runtime.
- Chuyển dữ liệu tham chiếu ra ngoài repo thay vì hủy: `backups/` sang `C:\Users\Mon\Desktop\Protect\MonViewPhone_LegacyBackups_20260730` (`21` file), `xiaowei/` sang `C:\Users\Mon\Desktop\Protect\MonViewPhone_Reference_xiaowei_20260730` (`138` file, `277.031.152` byte). Giữ nguyên `Backup/` vì backend dùng `Backup/adb/adbkey`.
- Refactor `App.tsx` theo domain, không thêm dependency: tách `AppSettingsModal`, `StreamSettingsPanel`, `DeviceContextMenu`; chuyển normalize/read stream config về `lib/config.ts`. `App.tsx` giảm từ `7.320` xuống `4.743` dòng, phần render giảm hơn một nửa.
- Refactor các component lớn: `AutomationModal.tsx` còn `2.216` dòng sau khi tách overlays/utilities; `DeviceAccountOverlay.tsx` còn `1.181` dòng sau khi tách nguyên khối `DeviceAccountPanel.tsx`; `ViewerSidePanel.tsx` còn `1.678` dòng sau khi tách `ViewerAdbTools.tsx`. Logic Risk Nearby được chuyển nguyên trạng và self-check vẫn PASS.
- CSS/I18n: xóa block `vsp-ctx-*` trùng tuyệt đối `70` dòng, tách `280` dòng `ViewerAppsMenu.css` và bỏ `5` chuỗi dịch YUV worker đã hết caller; import CSS sau `styles.css` trong `main.tsx` để giữ nguyên cascade. Cập nhật `.gitignore` và `project_structure.md` theo cấu trúc mới.
- Validation cuối PASS: toàn bộ `7` client self-check, `npm run build`, reachability audit, `git diff --check`, `go test -count=1 ./...`, `go build ./...`, `stream-node npm run build` và `npm run selfcheck:backpressure`.
- Gotcha self-check: Node `--experimental-strip-types` không chạy trực tiếp `check-tango-protocol.mts` vì `TangoProtocol.ts` dùng `const enum`; bundle self-check trong bộ nhớ bằng `esbuild` có sẵn rồi chạy Node thì PASS, không thêm dependency hoặc file tạm.
- Runtime read-only: cổng `11000` trả HTTP `200`; JS `assets/index-a9w3CLDM.js` và CSS `assets/index-1a6uX-dH.css` khớp byte/hash với `client/dist`, trang React render được. Không restart tiến trình; cổng `11080` không có listener tại lúc smoke test nên không chốt luồng stream tương tác.
- Lần mở trang smoke test kích hoạt startup sync đúng thiết kế: `9` tài khoản Risk đã quá hạn được đổi sang `Live`, mỗi tài khoản thêm đúng một history `Live`, còn nguyên notice. Đã đối chiếu từng cột với backup: ngoài timestamp đồng bộ, không có thay đổi dữ liệu nào khác; hai ID offline từng bị rút khỏi `tileOrder` đã được phục hồi đúng vị trí, tổng thứ tự trở lại `37` ID. Sau đó startup sync nạp thêm `17` khóa cấu hình có sẵn trong localStorage đúng allowlist `configKeysToSync`; giữ lại vì đây là dữ liệu automation/hotkey/UI của người dùng, không phải rác smoke test.
- Yêu cầu phụ trợ Shared Media A14: tái dùng Monhelper hiện có làm APK probe test-only, không tạo project/dependency mới.
- Thêm `probe_media` vào `MediaImportProvider`: báo PID/UID/user, generation, row metadata/count, PFD bytes và SHA-256; giữ shell gate, package/authority/protocol v4 và signer cũ. Manifest thêm quyền read media cần cho probe.
- Build cuối PASS: `Monhelper.apk` size `20823`, SHA-256 `5c074b361633d2ae91aa109ac7a1e529be88e803e0eeec976734d25b171eb425`, signer SHA-256 `680f998e...03bf4`.
- Chỉ cài probe trên pilot `R58N22VK5RL` user `10`; user `0/11/12` không cài. UID thật `1010221` tái hiện stack `MediaStore.getGeneration/query -> Volume external_primary not found`, giúp định vị gate mới trong MediaProvider; đây không phải dependency production.

## Ngày 01/08/2026

- Yêu cầu: tách source Monhelper sang `C:\Users\Mon\Desktop\Protect\Build APK\Monhelper`, giữ APK runtime trong MonViewPhone; Visual Alert chỉ phát âm một lần cho mỗi đợt thông báo; Nova chỉ phân tích trước về cập nhật nóng trạng thái tài khoản.
- Chuyển nguyên source/build script `server-go\mediaimport\helper` sang `..\Build APK\Monhelper`; sửa `build_v2_all.bat` và tài liệu để build vẫn xuất thẳng `server-go\mediaimport\bin\Monhelper.apk`, backend không đổi đường cài APK.
- Build Monhelper từ vị trí source mới PASS; artifact giữ size `20823`, SHA-256 `5c074b361633d2ae91aa109ac7a1e529be88e803e0eeec976734d25b171eb425`, chữ ký v3 PASS.
- Root cause Visual Alert lặp âm: nhánh nhắc lại theo `cooldownSec` gọi lại `playAlertSound()` khi cùng một dấu hiệu vẫn còn. Fix tối thiểu: nhánh đầu vẫn phát âm + notification, các lần cooldown sau chỉ cập nhật notification; khi dấu hiệu biến mất state được clear nên đợt mới vẫn phát đúng một lần.
- Frontend `npm run build` PASS; chỉ còn cảnh báo bundle Vite lớn hơn `500 kB` đã có từ trước.
- Nova report-only: MonViewPhone hiện tự gây full reload bằng `am force-stop com.teslacoilsw.launcher` + `input keyevent HOME` sau khi thay toàn bộ provider rows. Provider Nova chỉ commit SharedPreferences, không `notifyChange`/invalidate; đồng thời `BubbleTextView.O` đang bake status vào bitmap cache dù `onDraw` đã có overlay động.
- Hướng hot-update đề xuất, chưa triển khai: bỏ đường bake status cho workspace icon, giữ overlay `onDraw`, theo dõi weak reference các WeChat view và gửi một refresh action sau batch để `postInvalidate()` đúng icon; sau đó bỏ `force-stop`/`HOME`. Không cần tách code A12/A13/A14 hay mô phỏng notification dot giả.
- Đã triển khai hướng hot-update: `buildNovaWechatSyncCommand` giữ nguyên batch delete/insert provider nhưng thay `force-stop` + `HOME` bằng explicit broadcast `REFRESH_WECHAT_STATUS` tới `mon.space.WechatStatusReceiver`.
- Frontend production `npm run build` PASS; bundle mới `assets/index-D_BK8Rhz.js`, chỉ còn cảnh báo chunk Vite lớn hơn `500 kB`.
- Live canary A14 `R58N42JX8VH` PASS với Nova mới: broadcast không restart launcher (PID `16655` giữ nguyên), HOME/top-resumed vẫn là Nova và không có runtime/crash error. Người dùng sẽ tự kiểm tra thay đổi badge trực quan.
- Yêu cầu: nhận notification WeChat không phụ thuộc Visual Alert; báo âm một lần, giữ badge đến khi mở đúng profile; nếu nhiều profile cùng có tin thì hiện đồng thời bằng tên profile thay vì chỉ user ID.
- Chọn luồng tối giản đã có sẵn: giữ parser/âm thanh/`openApp`, nâng Monhelper lên v5 và nối backend bằng SSE native; không thêm dependency và không khôi phục vòng `logcat -d` mỗi `3.5 s` từng gây lag dài phiên.
- Monhelper v5 phát `eventId` ổn định theo post time, notification key và nội dung; callback phát lại bị dedupe nhưng nội dung tin mới vẫn tạo event mới. Backend tự nâng helper, `install-existing` và cấp notification-listener cho từng user có `com.tencent.mm`, rồi giữ một `adb logcat` stream cho mỗi máy được browser đăng ký.
- UI độc lập Visual Alert: mỗi tile giữ một item cho từng profile, ví dụ `WeChat (Owner)`, `WeChat1 (Space 1)`, `WeChatWork (Work profile)`; click từng tên gọi API mở `com.tencent.mm` đúng `userId`, chỉ clear item đó sau khi mở thành công và giữ nguyên các profile còn lại.
- Canary A14 `R58N42JX8VH`: Monhelper v5 có ở users `0/13/14/15`, listener đều live; ngắt-bật lại riêng user `0` ghi được `HELPER_V5 LISTENER_CONNECTED user=0`, trạng thái cuối vẫn enabled. Không mở WeChat hoặc xóa notification thật.
- Validation PASS: self-check đa profile, frontend production build, `go test -count=1 ./...`, backend build; APK v5 `20.823 B`, SHA-256 `F6DEDBECF75A9DE5058BBF2D56E13FCDAF01B4ACF882E4093B4FA0BB31B8E6E2`, v3 signature và signer SHA-256 `680f998e...03bf4`. Vite chỉ còn cảnh báo chunk lớn đã có từ trước. Gotcha: self-check `.mts` cần `node --experimental-strip-types`; cú pháp Settings đúng là `settings --user <id> get ...`, còn `settings get ... --user` báo `Too many arguments`.
- Runtime đã kích hoạt: backend cũ PID `30472` trả `404` cho SSE nên được restart riêng; binary cuối sau guard chống trùng đang chạy PID `51636`. `/healthz` và `/api/goog/wechat-notify/events` đều HTTP `200`, SSE trả `: connected`, frontend đang phục vụ bundle `assets/index-bPrkT9nL.js`. Log backend cũ được giữ tại `logs/server-go-before-wechat-restart-20260801-0138.log`.
- Guard chống báo trùng: backend chỉ parse event có marker `HELPER_V5`; dòng legacy từ listener WeChat cũ trong Nova dù dùng chung logcat tag cũng bị bỏ qua. Thêm unit test khóa hành vi này.
- Yêu cầu: click title stream phải tắt thông báo của WeChat đang foreground; thông báo profile khác chỉ tắt khi mở đúng profile bằng toast hoặc thủ công.
- Root cause: `Tile` cố ý bỏ nhánh WeChat khỏi cơ chế clear của Visual Alert, còn backend chỉ parse `WECHAT_POSTED/ACTIVE` nên bỏ qua `HELPER_V5 WECHAT_REMOVED` mà Monhelper đã phát sẵn.
- Fix tối thiểu, không đổi APK: click title gọi ADB read-only để đọc `topResumedActivity/mResumedActivity`, chỉ clear khi package là `com.tencent.mm` và `userId` trùng pending item; backend chuyển tiếp `WECHAT_REMOVED` và frontend chỉ clear đúng `userId + notification key`.
- Validation PASS: `node --experimental-strip-types scripts/check-wechat-alerts.mts`, `npm run build`, `go test -count=1 ./...`; runtime mới PID `54152`, `/healthz` HTTP `200`, SSE trả `: connected`, frontend phục vụ bundle `assets/index-vp9OFESt.js`. Không cần rebuild/cài lại Monhelper.
- Yêu cầu: đồng bộ UI/UX toàn MonViewPhone, ưu tiên bảng Cài đặt, context menu, ADB và Account Manager; chuẩn hóa màu, typography, control, spacing và layer.
- Chọn cách tối giản: giữ `rule.md` + `styles.css` làm source of truth, không tạo `design.md`, framework hay dependency mới; mọi alias Theme Inspector/legacy quy về cùng bộ `--md-*`.
- Root cause lệch tông: nhiều hard-code/inline hover, hai accent xanh khác nhau, màu status rải rác, control 24/26/28/34/42 px không có scale và z-index từ `1000` đến `100000xx` tự cạnh tranh.
- Fix: thêm primary/semantic/type/control/spacing/layer tokens; chuẩn hóa shared modal/menu/input/button/right-panel contract; bỏ high z-index và DOM hover mutation trong các menu đã rà; App Settings, device context menu, per-device ADB và Account Manager dùng class/token chung.
- Theme Inspector nâng storage lên `monviewphone:theme-inspector-overrides:v2`; chỉ xoá override `v1` cũ khi chưa có `v2`, tránh palette cũ ghi đè contract mới.
- Runtime QA ở `1440x900` và viewport `1152x720` mô phỏng zoom `125%`: context menu PASS `180px`, item `34px/13px`, radius `8px`; phát hiện modal Account Manager cao `766.98px` bị cắt ở viewport `720px`, đã sửa `max-height: calc(100dvh - 24px)` + scroll, retest PASS nằm trọn `y=12..708`.
- Thêm self-check `npm run check:ui`; self-check và production `npm run build` PASS, server `11000` trả HTTP `200` và phục vụ bundle cuối `assets/index-q9fFQT2x.js` + `assets/index-gaVaWN5V.css`. Vite chỉ còn cảnh báo chunk `>500 kB` đã có từ trước.
- Runtime QA ghi nhận warning riêng `SQLITE_BUSY/database is locked` khi startup lưu `tileOrder`; không liên quan CSS/UI và lượt này không sửa backend.
- Rà lại theo phản hồi LOC: bản đầu tăng ròng `863` dòng (`+1421/-558`) vì thêm contract override ở cuối CSS thay vì sửa rule gốc; đồng thời còn giữ menu profile bị ẩn vĩnh viễn và nhiều CSS legacy không còn caller.
- Thu gọn thật: `styles.css` từ `13.473` còn `11.904` dòng, `DeviceContextMenu.tsx` từ `945` còn `596`, `AppSettingsModal.tsx` từ `499` còn `360`, self-check từ `84` còn `35`; xóa contract trùng/dead CSS/dead JSX và dùng lại primitive sẵn có. Phát hiện CSS `ViewerAppsMenu` bị mất trong bản đầu, đã khôi phục bản tối thiểu dựa trên `vsp-adb-submenu` + `confirm*` thay vì mang lại block cũ gần `300` dòng.
- Validation cuối PASS: `npm run check:ui`, TypeScript build và `npm run build`; CSS syntax warning đã được xử lý, artifact cuối `assets/index-D7oELzk5.css` (`190.33 kB`) + `assets/index-YVkuyY2r.js`. Chỉ còn cảnh báo chunk JavaScript `>500 kB` đã có từ trước.
- Yêu cầu: rút nhãn thông báo Work profile và audit read-only máy A12 `25f5db2d04057ece` không hiện cảnh báo WeChat.
- Sửa tối thiểu tại formatter dùng chung: Work profile giờ chỉ hiện `WeChatWork`; không đổi logic nhận, clear hoặc mở đúng Android user. Cập nhật self-check và tài liệu tương ứng.
- Audit thiết bị: WeChat có ở users `0/10/11/12`, nhưng Monhelper v5 + notification listener chỉ có/live ở `0/10`; users `11` (Space 1) và `12` (Space 2) chưa cài package nên chắc chắn không thể phát sự kiện. Hai notification đang active lúc kiểm tra thuộc user `0` và được enqueue `14:22:11-14:22:12`.
- Audit host: backend PID `16176` và collector serial-pinned cho máy đã chạy từ `14:21:06`, trước notification khoảng `65` giây; SSE subscriber/collector không thiếu. Backend hiện chỉ ensure profile một lần khi collector khởi động, không heartbeat/retry listener và không lưu journal từng event, nên không thể tự hồi phục hoặc truy ngược event user `0` sau khi logcat main buffer đã trôi.
- Không thay đổi gì trên điện thoại. Self-check `node --experimental-strip-types scripts/check-wechat-alerts.mts` và `npm run build` PASS; lần gọi Node không có cờ strip-types báo `ERR_UNKNOWN_FILE_EXTENSION` đúng gotcha đã biết. Vite chỉ còn cảnh báo chunk `>500 kB` cũ.
- Audit read-only title WeChat: không giống Visual Alert clear ngay ở `onPointerDown`; title gọi `acknowledgeFocusedWechatAlert`, chờ ADB đọc foreground rồi chỉ clear alert cùng `userId`. Máy `25f5db2d04057ece` hiện foreground `com.tencent.mm` user `10`, trong khi hai notification đang active đã xác nhận ở user `0`, nên guard cố ý không xóa nhầm thông báo owner. Header cũng chỉ chạy tại `click`, nên luôn có độ trễ ADB ngay cả khi đúng user.
- Audit UI read-only: WeChat và Visual Alert cùng dùng `.tileVisualAlertBadge` cho font/padding/màu base, nhưng WeChat còn có modifier `.tileWechatAlertBadge` tách rời: đổi `span` sang flex, cho wrap, bỏ `max-width`/ellipsis và cho overflow visible để chứa nhiều profile clickable. Vì vậy text/button có thể xuống dòng và kích thước badge khác Visual Alert; đây là trade-off cũ để hiển thị nhiều profile, không phải token UI chung bị lỗi.
- Theo yêu cầu đồng bộ UI: xóa modifier layout WeChat và separator flex; badge WeChat giờ dùng đúng width, font, padding, single-line ellipsis của `.tileVisualAlertBadge`, vẫn giữ từng profile là button mở đúng user. Không thêm component/state/menu; badge nhiều profile quá dài sẽ ellipsis giống Visual Alert.
- Validation PASS: `npm run check:ui`, `npm run build`, `git diff --check`; bundle mới `assets/index-B4_EFv-o.css` + `assets/index-BydMusxk.js`. Chỉ còn warning chunk JavaScript `>500 kB` cũ.
- Audit read-only WeChat row height A13: `28083aacbd217ece` và reference `2619e1eb2a057ece` cùng display override `1440x2400`/density `720`, owner `font_scale=1.3`; WeChat process thực tế trên target nhận `fontScale=1.3`, `691dpi`, trùng reference A13. Khác biệt là APK: target `8.0.72`/`3084`/targetSdk `35`, reference `8.0.68`/`3003`/targetSdk `34`; cùng signer `962f5b7` nhưng base APK hash khác. Kết luận row/nav cao là layout của WeChat bản mới, không phải Nova/ROM/display scaling. Không đổi máy.
- Correction audit version fleet: trong ba nhóm A12/A13/A14, chỉ `28083aacbd217ece` chạy WeChat `8.0.72`; nhưng quét toàn bộ `35` máy online còn thấy `RFCN30H078F` cũng `8.0.72`. Vì vậy version `8.0.72` là khác biệt duy nhất trong nhóm A13 nhưng chưa đủ chứng minh một mình nó gây row height; không nên downgrade/upgrade chỉ từ kết luận đó.
- Chốt root cause bằng ảnh + window metrics: phần tab của `28083aacbd217ece` không lớn font/icon mà dư khoảng `27 px` đáy trong ảnh; tỷ lệ stream quy đổi đúng gần `216 px`, bằng navigation-bar inset của ROM. Target và A13 chuẩn `27f30c41a3217ece` cùng `navigation_mode=0`, nav `216 px`, frame WeChat fullscreen `1440x2400`, font `1.3`, density `720` và window flags; chỉ target `8.0.72` tự chừa thêm bottom inset trong layout. Đây là lỗi tương thích xử lý inset của WeChat `8.0.72` trên PixelExperience A13/3-button nav, không phải text size. Máy `RFCN30H078F` cùng version không phải control tương đương vì Samsung config `1440x1900`, density `710`, appBounds/nav khác. Không đổi thiết bị.
- Correction sau kiểm tra live ngay trước khi sửa: `28083aacbd217ece` thực tế đang bật overlay `navbar.gestural`, tắt `navbar.threebutton` và `navigation_mode=2` dù SystemUI vẫn vẽ thanh 3 nút; trạng thái overlay/UI lệch nhau mới là nguyên nhân hợp lý khiến WeChat áp dụng dư gesture inset. Nhận định trước đó rằng target đã ở mode `0` bị thay thế bởi bằng chứng live này.
- Sửa bằng native overlay, serial-pinned: `adb -s 28083aacbd217ece shell cmd overlay enable-exclusive --category com.android.internal.systemui.navbar.threebutton`. Xác minh PASS: `navbar.threebutton [x]`, `navbar.gestural [ ]`, `navigation_mode=0`; WeChat `com.tencent.mm/.ui.LauncherUI` user `10` vẫn foreground. Không reboot, không force-stop và không đổi máy khác.
- Theo yêu cầu, reset override display trên riêng `28083aacbd217ece` bằng `wm size reset` và `wm density reset`: từ `1440x2400`/`720 dpi` về physical `1440x2960`/`560 dpi`. Xác minh sau reset không còn dòng `Override`; không đổi `font_scale`, không reboot và không đụng dữ liệu app.
- Yêu cầu: nâng WeChat trên `27f30c41a3217ece` lên đúng bản của `28083aacbd217ece` để so sánh chiều cao thanh tab, bắt buộc update tại chỗ và giữ mọi tài khoản.
- Preflight: máy nguồn `8.0.72`/`3084`, máy đích `8.0.68`/`3003`; cùng signer `[962f5b7]` và cùng bộ 6 split APK. Kéo bộ APK từ máy nguồn read-only rồi chạy `adb -s 27f30c41a3217ece install-multiple -r <6 APK>`; không uninstall, không `pm clear`.
- Update PASS: đích thành `8.0.72`/`3084`/targetSdk `35`; SHA-256 của cả 6 APK sau cài khớp nguồn. Users `0/10/11/12/13` vẫn `installed=true`, các `ceDataInode` giữ nguyên (`5641186`, `1311168`, `1312862`, `1314207`, `1446954`), xác nhận data/tài khoản không bị thay thế. Đã xoá riêng thư mục APK tạm do lượt này tạo.
- Regression UI Xuất Tệp: context menu `Xuất Tệp/Xoá Tệp` vẫn render nhưng `.vsp-ctx-menu` dùng `--md-layer-menu` (`20000`), thấp hơn `.vsp-modal-overlay` dùng `--md-layer-modal` (`27000`), nên menu nằm khuất sau modal. Đây là hậu quả trực tiếp của lần chuẩn hoá z-index trước.
- Fix tối thiểu tại `client/src/styles.css`: riêng `.vsp-file-context-menu` dùng `--md-layer-modal-child` (`28000`); không nâng các context menu toàn cục. `npm run check:ui` và production build PASS; server `11000` đang phục vụ bundle mới `assets/index-DBh4zqlh.js` + `assets/index-DzM-ZTk8.css`, CSS minified đã xác nhận chứa rule mới. Chỉ còn warning chunk JavaScript `>500 kB` cũ.

## Ngày 02/08/2026

- Yêu cầu: phân loại WeChat theo ngày tạo: dưới `30` ngày là `New`, `30–<60` là `New 1`, `60–<90` là `New 2`; badge Nova phải vẽ đúng và tự cập nhật khi qua mốc.
- Chọn một hàm dùng chung `getWechatNewStatus()` trong `client/src/lib/deviceAccountVault.ts` để Nova sync, lọc/highlight `TK mới` và thống kê Overlay không lệch mốc. Ngày tạo hợp lệ luôn ưu tiên; cờ `isNew` cũ chỉ fallback cho account legacy thiếu ngày tạo.
- Thêm timer đồng bộ Nova khi browser mở/kết nối máy và đúng các mốc `30/60/90` ngày; giữ `Risk`/`Die` ưu tiên như trước.
- Validation PASS: `node --experimental-strip-types scripts/check-wechat-new-status.mts` kiểm boundary `30/60/90`, sau đó `npm run build` PASS. Vite chỉ còn cảnh báo chunk lớn đã có.
- **07:56**: Yêu cầu tối ưu độ trễ khi đổi status/gán user WeChat để Nova cập nhật ngay; chỉ sửa MonViewPhone, không đụng thiết bị hoặc rebuild Nova.
- **07:56**: Root cause: mỗi thay đổi đang `delete` toàn bộ rồi insert từng profile; fingerprint khác nhau trên cùng UDID được chạy song song nên snapshot cũ có thể ghi đè snapshot mới; danh sách rỗng còn bị skip và panel trong Device Viewer thiếu fast-path sync.
- **07:56**: Fix tối thiểu: thêm delta sync dùng provider hiện có, tombstone `status=''`/`nearby=false` cho mapping bị bỏ, full sync chỉ lần đầu/Force, và queue `latest-wins` serialize riêng từng UDID; request sau lỗi tự full sync để phục hồi trạng thái có thể ghi dở. Nối `onSyncNovaWechat` vào Device Viewer; không thêm dependency.
- **07:56**: Self-check mới `node --experimental-strip-types scripts/check-nova-wechat-sync.mts`, self-check mốc New và `npm run build` đều PASS; Vite chỉ còn warning chunk `>500 kB` cũ. Thử import thẳng `App.tsx` cho test bị `ReferenceError: self is not defined` từ `xterm`, nên tách leaf `lib/novaWechatSync.ts` để test đúng logic production.
- Yêu cầu: rà toàn bộ layer UI; mọi context menu phải nổi trên panel/modal, mọi hộp xác nhận/cảnh báo phải nổi trên menu và modal; khôi phục menu chỉnh màu ADB và đỏ phải luôn hỏi xác nhận.
- Root cause: `--md-layer-menu=20000` thấp hơn workspace/modal `26000/27000`; hai menu Automation còn inline `27000`, menu Automation Panel bị kẹt trong sidebar `overflow:auto`, `ViewerAppsMenu.css` ghi đè confirm về `27000`, còn actual confirm dùng chung tầng modal. ADB chỉ guard màu đỏ ở quick submenu, bỏ qua `warn:true`, Run/Enter/Edit/history; xoá preset còn làm lệch map màu theo index.
- Chuẩn hoá một hierarchy duy nhất: workspace `26000` < modal `27000` < modal-child `28000` < notification `29000` < menu `30000` < confirm `31000` < inspector `32000`; mọi selector menu/context chuyển sang token menu, actual confirm dùng `confirmOverlay--top`/token confirm, CSS Viewer Apps bỏ hard-code.
- Portal context menu Automation Panel ra `document.body`, bỏ ba inline z-index Automation. ADB dùng chung `requestAdbExecution`: `warn:true` hoặc đỏ `#ef4444/#ff9c9c/red` đều phải xác nhận từ quick menu, Run/Enter, Edit và lịch sử; placeholder giữ metadata rủi ro, xoá preset remap màu đúng index.
- Mở rộng `npm run check:ui` để quét cả CSS component, assert thứ tự layer, selector menu/confirm, portal Automation và mọi đường guard ADB. `npm run check:ui`, production `npm run build` và `git diff --check` PASS; server `11000` trả HTTP `200` và phục vụ `assets/index-DOB8lFce.js` + `assets/index-Cau2lqLs.css` chứa đúng menu `30000`, confirm `31000`. Chỉ còn warning chunk JavaScript `>500 kB` cũ.

## Ngày 04/08/2026

- Yêu cầu: lấy đúng WhatsApp từ máy nguồn `R58N42JX8VH` và cài cho toàn bộ máy ADB đang online; máy nguồn chỉ đọc.
- Nguồn là `com.whatsapp` `2.26.30.80` (`versionCode=263008000`, `minSdk=23`, `arm64-v8a`), gồm `base.apk` và ba split `config.arm64_v8a`, `config.xxhdpi`, `i18n_vi`; đã kéo đủ bộ và xác minh APK/signature/hash trước cài.
- Preflight có `32` máy ở trạng thái `device` gồm máy nguồn, tức `31` đích; tất cả dùng `arm64-v8a`, SDK `29–34`, không có máy nào đang version mới hơn. Canary update `R58N22VK5RL` và cài mới `R58N30MBK4F` đều PASS.
- Triển khai serial-pinned bằng `adb -s <serial> install-multiple -r --user 0 --no-incremental <4 APK>`, throttle `4`; không uninstall, không `pm clear`, không đụng dữ liệu tài khoản. Client ADB của `1d65d69e` không tự thoát sau commit; đã xác minh version/4 hash/user 0 PASS rồi mới dừng đúng PID client bị kẹt, không dừng ADB server hay huỷ package.
- Verification độc lập cuối PASS `32/32`, FAIL `0`: mọi máy online đều đúng `versionCode=263008000`, đủ `4` APK active có SHA-256 khớp nguồn, installed cho user `0`, và resolve được `com.whatsapp/.Main`.
- Cảnh báo runtime: `eubqcykrhm8dw8hy` ghi hai crash JNI lúc `01:32:36–01:32:37`, `UnsatisfiedLinkError` tại `AbortHooks.init()` ngay sau update cùng version; app tự phục hồi, hai process WhatsApp chạy ổn hơn `11` phút và không có crash lặp lại sau `01:32:38`. Không rollback, clear data hoặc cài lại ngoài phạm vi yêu cầu.
- **17:19**: Thực hiện build lại toàn bộ hệ thống MonViewPhone theo yêu cầu người dùng (`client` frontend Vite, `server-go` Go backend, `stream-node`). Tất cả đều kết thúc thành công với mã 0 (`dist/` mới và `server-go.exe` đã được tạo).
- **17:54**: Hoàn thành tái cấu trúc kiến trúc hệ thống overlay toàn bộ MonViewPhone theo chuẩn portal primitives (`OverlayPortal`, `OverlayManager`, `ModalLayer`, `ConfirmDialog`, `ContextMenuLayer`, `AnchoredPopover`, `Tooltip`). Mọi menu, submenu, popover, tooltip, modal và confirm dialog được render trực tiếp vào duy nhất một container `#overlay-root` ở cuối `document.body` bằng React Portal. Đảm bảo 100% không bị cắt (clipping) bởi `overflow: hidden`, scroll container hay viewer/tile. Đã chuẩn hoá tầng z-index với hierarchy rõ ràng (`--md-layer-modal: 27000`, `modal-child: 28000`, `menu: 30000`, `tooltip: 30500`, `confirm: 31000`). Đã tích hợp focus trap, focus restoration, Escape key popping stack, và body scroll lock. Chạy `npm run check:ui` và `npm run build` thành công 100%.

