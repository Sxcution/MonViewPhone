# MonViewPhone UI Style Guide

Tài liệu này quy định ngôn ngữ thiết kế cho toàn bộ dự án. Mọi AI hoặc lập trình viên khi thêm mới/chỉnh sửa UI **bắt buộc** phải tuân thủ các quy tắc sau để đảm bảo tính đồng bộ (Modern Dark Theme).

## 1. CSS Variables (Biến màu sắc)
Luôn sử dụng các biến CSS đã định nghĩa trong `:root` của `styles.css`. Tuyệt đối không hard-code các mã màu (như `#FFF` hay `#000`) trực tiếp vào component.

- `--bg-base`: `#181818` (Màu nền tổng thể của ứng dụng)
- `--bg-panel`: `#202020` (Màu nền của các bảng điều khiển, thẻ thiết bị)
- `--bg-hover`: `#2a2a2a` (Màu nền khi di chuột qua item/menu)
- `--text-main`: `#e0e0e0` (Màu chữ chính, xám sáng chống chói)
- `--text-muted`: `#9e9e9e` (Màu chữ phụ, chú thích)
- `--border-color`: `#333333` (Màu viền phân cách)
- `--accent-color`: `#5a5a5a` (Màu nhấn khi active/focus)

## 2. Component Rules
- **RightBar / Panels:** Phải dùng nền `--bg-panel`, có viền `--border-color` và đổ bóng nhẹ để nổi bật trên `--bg-base`.
- **Context Menu (Menu chuột phải):** Nền `--bg-panel`, viền `--border-color`, các item bên trong khi hover phải chuyển sang `--bg-hover`. Góc bo (border-radius) chuẩn là `6px`.
- **Button / Input:** Chữ `--text-main`, nền `--bg-base` hoặc `--bg-panel`, viền `--border-color`. Khi focus hoặc hover cần thay đổi độ sáng nền, không dùng outline màu gắt (tránh outline xanh mặc định của trình duyệt).
- **Scrollbar:** Phải làm tối màu và thu mỏng để không phá vỡ thiết kế tổng thể.
