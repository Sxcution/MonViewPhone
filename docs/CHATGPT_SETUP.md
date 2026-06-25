# CHATGPT_SETUP.md - Cấu hình Kết nối với ChatGPT

Tài liệu này hướng dẫn cách kết nối MCP Workspace Server này với ChatGPT (Developer Mode / Custom MCP Application).

## 1. Yêu cầu chuẩn bị
*   Server cần được chạy và expose thông qua một public HTTPS endpoint (do ChatGPT chạy trên cloud của OpenAI nên nó bắt buộc phải kết nối qua HTTPS).
*   Công cụ expose local nhanh nhất là dùng `ngrok` hoặc `localtunnel`.

### Khởi động local server
```bash
cd mcp-workspace-server
npm run start
```
(Server mặc định chạy tại `http://localhost:3000`)

### Expose qua ngrok
```bash
ngrok http 3000
```
Sau khi chạy ngrok, bạn sẽ nhận được một URL HTTPS tương tự như:
`https://abcd-123-45-67.ngrok-free.app`

Đường dẫn MCP endpoint tương ứng sẽ là:
`https://abcd-123-45-67.ngrok-free.app/mcp`

## 2. Các bước cấu hình trên ChatGPT

Hiện tại, việc cấu hình MCP server trên ChatGPT có thể thực hiện thông qua **Custom GPTs** hoặc giao diện tích hợp **Developer Mode / MCP Client** trong tương lai:

### Tùy chọn A: Kết nối qua Custom GPT (Actions)
1.  Truy cập ChatGPT, chọn **Explore GPTs** -> **Create a GPT**.
2.  Chuyển sang tab **Configure**, đặt tên cho GPT (ví dụ: `MonViewPhone Workspace Assistant`).
3.  Cuộn xuống và nhấn **Create new action**.
4.  Ở mục **Authentication**, chọn **Bearer** và nhập mã token tương ứng với biến `MCP_AUTH_TOKEN` bạn đã cấu hình trong file `.env`.
5.  Trong phần **Schema**, nhập tài liệu OpenAPI định nghĩa endpoint `/health`, `/mcp` và `/messages` (hoặc cấu hình SSE connection trực tiếp).
    > *Lưu ý*: Với giao thức MCP SSE chuẩn, client sẽ thực hiện kết nối GET tới `/mcp` với header `Authorization: Bearer <token>`, từ đó nhận stream SSE và gửi command POST tới `/messages`.

### Tùy chọn B: Sử dụng các Client MCP hỗ trợ giao diện ChatGPT
Nếu bạn đang dùng ứng dụng chat / Developer Mode hỗ trợ trực tiếp MCP Server:
1.  Mở phần cài đặt **MCP Servers** hoặc **Developer Tools**.
2.  Nhấn **Add New Server**.
3.  Chọn loại transport là **SSE**.
4.  Nhập URL endpoint: `https://your-domain.ngrok-free.app/mcp`
5.  Thêm Header:
    *   Key: `Authorization`
    *   Value: `Bearer <MCP_AUTH_TOKEN>` (Thay `<MCP_AUTH_TOKEN>` bằng token thật của bạn).
6.  Lưu cấu hình và bật kết nối.

## 3. Thử nghiệm kết nối

Sau khi cấu hình xong, bạn có thể gửi các câu lệnh prompt sau tới ChatGPT để kiểm tra xem server hoạt động bình thường không:

### Test xem cấu trúc dự án:
> Hãy gọi MCP tool `get_project_tree` để xem cấu trúc dự án này.

### Test đọc file:
> Dùng MCP tool `list_workspace_files` rồi đọc nội dung file `README.vi.md`.

### Test kiểm thử mã nguồn:
> Hãy gọi tool `run_workspace_command` để chạy lệnh kiểm thử `npm_test`.
