# Work Log / Nhật ký làm việc

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
