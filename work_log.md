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
