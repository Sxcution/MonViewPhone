# Work Log / Nhật ký làm việc

## 2026-07-11

- **12:50**: User report lỗi 1: thiết bị đã xoá (Bluestacks emulator-5554) tự động kết nối và xuất hiện lại. Lỗi 2: hide/minimize cửa sổ MonViewPhone thì stream bị ngừng/lag, khi mở lại thì thông báo nổ hàng loạt (bị sleep).
- **12:51**: Bắt đầu nghiên cứu codebase. Tìm hiểu `device_tracker.go` và `App.tsx`, cùng cơ chế stream khi ẩn cửa sổ.
- **12:55**: Đã tìm ra nguyên nhân:
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

## Ngày 13/07/2026

- Yêu cầu: đổi shortcut `C:\Users\Mon\Desktop\run.lnk` sang chế độ dev để sửa giao diện thấy ngay, nhưng không tạo log dev quá ồn.
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
