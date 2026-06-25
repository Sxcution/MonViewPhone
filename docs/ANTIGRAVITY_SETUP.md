# ANTIGRAVITY_SETUP.md - Cấu hình Kết nối với Antigravity

Tài liệu này hướng dẫn cách khai báo MCP Workspace Server này trong Antigravity để hỗ trợ bạn lập trình và kiểm soát mã nguồn trực tiếp.

## 1. Cơ chế kết nối
Antigravity hỗ trợ hai hình thức kết nối tới MCP Server:
1.  **Stdio Transport (Khuyên dùng khi chạy local)**: Antigravity tự động chạy server như một tiến trình con (child process) qua lệnh node. Không cần chạy server thủ công và không cần expose internet.
2.  **SSE Transport (Kết nối từ xa / HTTPS)**: Kết nối tới server đang chạy thông qua HTTP SSE endpoint.

## 2. Cách cấu hình qua file `mcp_config.json`

Khai báo MCP server trong cấu hình của Antigravity bằng cách thêm cấu hình tương ứng vào tệp cấu hình MCP của client (thường là `mcp_config.json` nằm trong thư mục cấu hình của trình soạn thảo hoặc cài đặt của Antigravity).

### Tùy chọn 1: Cấu hình Stdio Transport (Đơn giản nhất cho Local)
Antigravity sẽ tự động khởi động và giao tiếp với tiến trình MCP server khi bạn mở Workspace.

```json
{
  "mcpServers": {
    "workspace-mcp-local": {
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

*Lưu ý*: Hãy đảm bảo đã build dự án trước khi sử dụng (`npm run build` trong `mcp-workspace-server`) để sinh ra tệp biên dịch JavaScript trong `dist/`.

### Tùy chọn 2: Cấu hình Remote SSE Transport (HTTPS)
Sử dụng khi MCP Server chạy độc lập (hoặc deploy trên cloud / expose qua tunnel).

```json
{
  "mcpServers": {
    "workspace-mcp-remote": {
      "serverUrl": "https://your-domain.ngrok-free.app/mcp",
      "headers": {
        "Authorization": "Bearer test-token-123-abc"
      }
    }
  }
}
```

*Lưu ý*: Với Antigravity, hãy thay thế `test-token-123-abc` bằng `MCP_AUTH_TOKEN` thật đã cấu hình trong tệp `.env` của server.

## 3. Cách kiểm tra hoạt động trên Antigravity
Khi mở trình soạn thảo có tích hợp Antigravity, bạn có thể kiểm tra danh sách MCP servers đã kết nối thành công. Thử gọi các lệnh MCP trực tiếp bằng cách đề xuất AI thực hiện:
*   "Hãy tìm trong workspace các file TypeScript bằng tool `list_workspace_files`."
*   "Hãy lấy trạng thái git status hiện tại của dự án."
