# MCP Workspace Server - Implementation Plan

Dự án này nhằm xây dựng một MCP (Model Context Protocol) Server production-ready để ChatGPT Developer Mode và Antigravity có thể sử dụng chung nhằm tương tác an toàn với workspace `MonViewPhone`.

## 1. Stack công nghệ lựa chọn
- **Ngôn ngữ**: TypeScript & Node.js
- **Framework**: Express (phục vụ HTTP endpoint `/health`, `/mcp` với Server-Sent Events - SSE)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Testing**: Vitest (cho phép chạy test nhanh và an toàn)
- **Linter**: ESLint

## 2. Các rào cản Bảo mật (Security Sandbox)
- **Path Traversal Prevention**: Toàn bộ đường dẫn đầu vào sẽ được normalize và giải quyết thông qua `path.resolve`. Hệ thống sẽ chặn đứng mọi truy cập vượt ra khỏi `WORKSPACE_ROOT` hoặc giải quyết trỏ tới các thư mục nhạy cảm.
- **Denylist Files**: Chặn truy cập trực tiếp tới các tệp nhạy cảm (như `.env`, `id_rsa`, `id_ed25519`, `*.pem`, `*.key`, `*.p12`) và các thư mục đặc biệt (`node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`).
- **Command Whitelist (run_workspace_command)**: Chỉ cho phép các lệnh an toàn đã định trước (`npm_test`, `npm_lint`, `git_status`, v.v.). Không cho phép tham số tự do (args).
- **Authentication**: Bắt buộc có header `Authorization: Bearer <MCP_AUTH_TOKEN>` khi truy cập vào `/mcp`.

## 3. Các Tool sẽ được Expose
1. `get_project_tree`: Trả về cây thư mục dưới dạng text (cho phép độ sâu tối đa, ẩn/hiển file ẩn).
2. `list_workspace_files`: Trả về danh sách file có kích thước và thời gian sửa đổi (hỗ trợ đệ quy, filter extension).
3. `read_file`: Đọc nội dung file văn bản trong phạm vi dòng (startLine -> endLine). Chặn đọc file nhị phân (binary).
4. `search_text`: Tìm kiếm văn bản trong các file không thuộc denylist.
5. `get_git_status`: Trả về git status của workspace.
6. `get_git_diff`: Trả về git diff (hoặc diff của file cụ thể).
7. `run_workspace_command`: Chạy các lệnh kiểm thử và kiểm tra mã nguồn an toàn từ allowlist.

## 4. Kế hoạch triển khai chi tiết
### Giai đoạn 1: Khởi tạo và Thiết lập Project
- Tạo thư mục `mcp-workspace-server/`.
- Tạo `package.json`, `tsconfig.json`, `.env.example`.
- Cấu hình npm scripts: `dev`, `build`, `start`, `test`, `lint`.

### Giai đoạn 2: Phát triển các Module tiện ích bảo mật (Utils)
- `src/utils/paths.ts`: Quản lý đường dẫn, chống path traversal, kiểm tra denylist.
- `src/utils/commandAllowlist.ts`: Bản đồ ánh xạ enum command sang command thực thi thực tế (ví dụ: `npm_test` -> `npm test`).
- `src/utils/logger.ts`: Logger bảo mật, không log token.
- `src/utils/limits.ts`: Giới hạn kích thước file đọc, thời gian timeout lệnh.

### Giai đoạn 3: Hiện thực hóa MCP Server & HTTP Endpoints
- `src/auth.ts`: Middleware xác thực Bearer token.
- `src/server.ts`: Thiết lập MCP server bằng `@modelcontextprotocol/sdk`, tích hợp các công cụ (Tools).
- `src/index.ts`: Khởi động Express HTTP Server hỗ trợ SSE transport của MCP tại `/mcp` và endpoint `/health`.

### Giai đoạn 4: Viết Tests và Tài liệu
- Viết unit tests trong `tests/` để xác thực cơ chế an toàn và tính đúng đắn của các tool.
- Tạo các tệp tài liệu: `docs/SECURITY.md`, `docs/CHATGPT_SETUP.md`, `docs/ANTIGRAVITY_SETUP.md`, `docs/DECISIONS.md`.

## 5. Kế hoạch xác minh (Verification Plan)
- Chạy `npm run build` để kiểm tra TypeScript compilation.
- Chạy `npm test` để kiểm tra tất cả các trường hợp bảo mật (path traversal, check auth, command execution).
- Chạy server và test bằng curl để kiểm tra endpoint `/health` và `/mcp`.
