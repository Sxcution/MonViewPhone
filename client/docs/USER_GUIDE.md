# MonViewPhone - Hướng dẫn sử dụng nhanh

> Lưu ý: Mình không thể tự chụp ảnh màn hình trong phiên làm việc này. Bạn có thể mở ứng dụng và chụp lại nếu cần minh họa.

## 1. Khởi chạy & tham số
- Mở ứng dụng (Vite dev hoặc bản build) với backend ws ở `ws://127.0.0.1:11000/` (mặc định).
- Có thể truyền `?device=<udid>` để chỉ mở 1 thiết bị hoặc `?ws=<ws-url>` để đổi endpoint.

## 2. Lưới thiết bị
- Mỗi tile hiển thị stream của thiết bị, có badge “USB”.
- Header tile: số thứ tự, UDID, trạng thái. Nút:
  - `⠿` (move): kéo để đổi vị trí tile; thả lên tile khác để chèn vào vị trí đó.
  - `↻`: reload stream.
  - `⋯`: menu (reload, shell, file list, power/volume, screenshot, mở viewer 👁).
- Thanh nút dưới mỗi tile: Back, Home, Recent.
- Lưu kích thước tile (width) vào localStorage, chiều cao tự tính theo tỉ lệ.
- Khi mở viewer (👁), tile đó bị làm mờ/ẩn click.

## 3. Kéo sắp xếp tile
- Giữ nút `⠿` trên header và kéo qua tile khác để đổi thứ tự. Danh sách được lưu (localStorage `tileOrder`).

## 4. Viewer (xem thiết bị riêng)
- Mở qua menu `👁` (⋯). Viewer nổi, kéo bằng header.
- Cấu hình viewer (width) nằm ở cột phải (Cấu hình stream).
- Viewer dùng stream hiện có (không mở WS mới), tự fit khung; có tab Files/Apps mirror từ tile.
- Đóng viewer để bỏ override và trả tile về trạng thái bình thường.

## 5. Cột phải (panel cấu hình)
- Header thương hiệu + ô tìm kiếm (trang trí).
- Tabs/Pills mô phỏng xiao-wei (không chức năng phụ, chỉ style).
- **Kích thước tile**: slider Width (100–2000px), chiều cao tự tính.
- **Cấu hình stream**: nếu viewer mở, tiêu đề “Cấu hình stream (viewer)”, các slider áp dụng riêng cho thiết bị đang xem; nếu không, áp dụng global.
  - View width (viewer).
  - Bitrate, FPS, Chiều rộng stream (height auto), Khóa xoay.
  - Đặt lại mặc định.
- **Điều khiển nhanh**: Power, Vol+/-, Mute, Back, Home, Recent, Screenshot (tác động device active).
- **Sync thiết bị**:
  - Bật/tắt sync.
  - Chọn device chính (radio).
  - Chọn follower (lưới checkbox, có “Tất cả”, “Hiển thị tất cả/đã chọn” trang trí).
  - Dừng sync.
  - Khối “Điện thoại không có thẻ” chỉ minh họa (disabled).
- **Lọc thiết bị** (trang trí): Cục bộ/Trực tuyến, Tất cả/USB/WIFI/OTG/Tiếp cận, danh sách thẻ (hiện registeredUdids).

## 6. Sync thiết bị
- Bật sync trong panel phải -> chọn main và follower.
- Khi sync bật: thao tác trên device chính broadcast tới follower (qua ActiveContext).
- Tắt sync để trở về điều khiển đơn lẻ.

## 7. File & Shell
- Hash actions:
  - `#!action=shell&udid=<id>`: mở trang Shell (multiplex WS).
  - `#!action=list-files&udid=<id>&path=/...`: trang File listing (FSLS).
- Trong tile menu: mở Shell/File list ở tab mới với udid hiện tại.

## 8. Cấu hình stream
- Bitrate: 524,288–8,388,608 bps (cảnh báo >60%).
- FPS: 1–60.
- Bounds width: 400–1200 px, height tự tính theo aspect hiện tại.
- Locked orientation: Auto/0/90/180/270.
- Mỗi lần đổi (global hoặc viewer) sẽ reload tile tương ứng.

## 9. Lưu trữ cục bộ
- `deviceDimensions`: width/height tile.
- `tileOrder`: thứ tự tile.
- `viewerWidthPx`: độ rộng viewer.
- `viewerOverride` (state runtime, không lưu): config riêng cho viewer.
- `syncAll`, `syncMain`, `syncTargets`: trong ActiveContext.

## 10. Phím tắt/điều khiển
- Quick controls gửi keycode tới device active (hoặc nhóm sync).
- Canvas tile/viewer hỗ trợ touch/scroll, keyboard mapping từ `useDirectKeyboard`.

## 11. Khác
- Overlay viewer nền mờ nhẹ, chỉ một viewer tại một thời điểm.
- Kéo viewer bằng header, không ảnh hưởng điều khiển canvas.
- Reorder: hành vi kéo-thả tức thời, không có FLIP animation (đã gỡ).

## 12. Troubleshooting
- Màn hình đen: kiểm tra ws backend, log “WS mở → gửi config BINARY…”. Reload tile (↻) hoặc giảm bitrate/FPS.
- Không thấy thiết bị: kiểm tra backend device tracker, hoặc thêm `?device=<udid>`.
- Reorder không lưu: kiểm tra localStorage `tileOrder`.

