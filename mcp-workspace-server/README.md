# MCP Workspace Server - MonViewPhone

MCP (Model Context Protocol) Server production-ready cho phép ChatGPT Developer Mode, custom MCP apps và Antigravity kết nối an toàn để đọc cấu trúc thư mục, xem logs, tìm kiếm văn bản và thực thi các câu lệnh kiểm thử được phê duyệt trong workspace `MonViewPhone`.

## Các Tính năng Chính

*   Expose endpoint HTTPS-compatible `/mcp` sử dụng giao thức Server-Sent Events (SSE).
*   Endpoint health check `/health` nhanh chóng.
*   Cơ chế xác thực mạnh mẽ qua Bearer Token (`Authorization: Bearer <MCP_AUTH_TOKEN>`).
*   **Sandbox Bảo mật tuyệt đối**:
    *   Chống path traversal và symlink escape vượt ra ngoài workspace.
    *   Denylist tự động các tệp tin nhạy cảm (`.env`, SSH keys, chứng chỉ SSL) và các thư mục phát triển lớn (`node_modules`, `.git`, `dist`, v.v.).
    *   **Không có shell tự do**: Chỉ chạy các lệnh kiểm thử/build an toàn có sẵn trong allowlist (`npm_test`, `npm_lint`, `git_status`, v.v.).
    *   Giới hạn dung lượng tệp tin đọc và thuật toán truncate thông minh giữ thông tin lỗi chính của logs.

## Danh sách các Tools hỗ trợ

1.  `get_project_tree`: Trả về cây thư mục trực quan theo độ sâu tùy chọn.
2.  `list_workspace_files`: Trả về danh sách tệp đệ quy kèm metadata (kích thước, thời gian sửa đổi).
3.  `read_file`: Đọc nội dung tệp tin văn bản trong phạm vi dòng chỉ định (chặn file nhị phân).
4.  `search_text`: Tìm kiếm văn bản trong toàn bộ workspace.
5.  `get_git_status`: Trả về trạng thái Git hiện tại.
6.  `get_git_diff`: Trả về diff thay đổi (của toàn repo hoặc tệp tin cụ thể).
7.  `run_workspace_command`: Thực thi lệnh kiểm thử/build an toàn từ danh sách được duyệt.

---

## Hướng dẫn cài đặt và vận hành

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
Sao chép cấu hình mẫu và điền token bảo mật:
```bash
cp .env.example .env
```
Mở file `.env` và cập nhật:
*   `MCP_AUTH_TOKEN`: Mã token bí mật dùng để xác thực các request từ AI client.
*   `WORKSPACE_ROOT`: Đường dẫn tuyệt đối tới thư mục dự án `MonViewPhone`.

### 3. Khởi động môi trường phát triển (Hot-reload)
```bash
npm run dev
```

### 4. Build sản phẩm
Biên dịch TypeScript sang JavaScript trong thư mục `dist/`:
```bash
npm run build
```

### 5. Chạy Server Production
```bash
npm run start
```

### 6. Khởi chạy bộ kiểm thử (Tests)
Chạy unit tests kiểm tra bảo mật và hoạt động của tools:
```bash
npm run test
```

---

## Kết nối với ChatGPT (Cloud)

Do ChatGPT chạy trên Cloud của OpenAI, bạn cần expose local port 3000 ra môi trường Internet bằng HTTPS tunnel:

```bash
ngrok http 3000
```
Sau đó khai báo URL sau vào ChatGPT custom MCP app / Custom GPTs:
```text
https://your-ngrok-subdomain.ngrok-free.app/mcp
```
*Lưu ý*: Nhập Authorization Bearer Token là giá trị `MCP_AUTH_TOKEN` bạn cấu hình trong `.env`.

Chi tiết xem tại [docs/CHATGPT_SETUP.md](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/docs/CHATGPT_SETUP.md).

---

## Kết nối với Antigravity (Local)

Thêm cấu hình sau vào tệp tin cấu hình MCP của Antigravity client (ví dụ `mcp_config.json`):

```json
{
  "mcpServers": {
    "workspace-mcp": {
      "command": "node",
      "args": [
        "c:/Users/Mon/Desktop/Protect/MonViewPhone/mcp-workspace-server/dist/index.js"
      ],
      "env": {
        "WORKSPACE_ROOT": "c:/Users/Mon/Desktop/Protect/MonViewPhone",
        "MCP_AUTH_TOKEN": "test-token-123-abc",
        "PORT": "3000"
      }
    }
  }
}
```

Chi tiết xem tại [docs/ANTIGRAVITY_SETUP.md](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/docs/ANTIGRAVITY_SETUP.md).

---

## Lưu ý về Bảo mật (Security Notes)

*   **Tuyệt đối không chia sẻ `MCP_AUTH_TOKEN` thật lên Git**. File `.env` đã được đưa vào danh sách bỏ qua của git.
*   Mọi tệp tin cấu hình nhạy cảm được bảo vệ thông qua kiểm tra đường dẫn giải quyết tuyệt đối.
*   Thông tin chi tiết về threat model xem tại [docs/SECURITY.md](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/docs/SECURITY.md).
