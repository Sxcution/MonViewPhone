# SECURITY.md - MCP Workspace Server Security Analysis

Tài liệu này mô tả mô hình đe dọa (Threat Model), các rủi ro bảo mật tiềm ẩn và các biện pháp giảm thiểu được áp dụng trong MCP Workspace Server để đảm bảo an toàn tuyệt đối khi chia sẻ quyền truy cập workspace với AI clients (ChatGPT, Antigravity).

## 1. Threat Model (Mô hình đe dọa)

### Đe dọa từ bên ngoài (External Threats)
*   **Rò rỉ URL Endpoint**: Kẻ xấu phát hiện ra URL của MCP server và cố gắng thực hiện các hành động tùy ý đối với workspace của bạn.
*   **Biện pháp giảm thiểu**: Xác thực bằng Bearer token bắt buộc (`Authorization: Bearer <MCP_AUTH_TOKEN>`) cho tất cả các endpoint ngoại trừ `/health`. Cấu hình CORS chặt chẽ và không lưu trữ token công khai.

### Đe dọa từ AI Client (AI Agent Risks)
*   **Path Traversal**: AI có thể bị lừa (Prompt Injection) hoặc tự ý truy cập các tệp nhạy cảm bên ngoài thư mục workspace (ví dụ: `C:\Users\Username\.ssh`, tệp hệ thống, tệp cấu hình toàn cục).
*   **Biện pháp giảm thiểu**: Hàm `resolveSafePath` giải quyết mọi đường dẫn và normalize chúng để kiểm tra xem có nằm trong `WORKSPACE_ROOT` hay không. Mọi truy cập vượt biên sẽ bị ném lỗi và từ chối ngay lập tức.
*   **Đọc dữ liệu nhạy cảm**: AI truy cập các tệp cấu hình bí mật chứa private keys, API keys, credentials trong dự án.
*   **Biện pháp giảm thiểu**: Cơ chế Denylist kiểm tra tên tệp và phần mở rộng. Chặn đứng các tệp `.env`, `.env.*`, `id_rsa`, `id_ed25519`, `*.pem`, `*.key`, `*.p12` và các thư mục phát triển lớn (`node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`).

### Thực thi lệnh tùy ý (Remote Code Execution - RCE)
*   **RCE qua Command**: AI cố gắng chạy lệnh hệ thống tùy ý (ví dụ: `rm -rf`, `curl | sh`, `format`).
*   **Biện pháp giảm thiểu**: `runWorkspaceCommand` **không bao giờ** chấp nhận chuỗi lệnh tự do từ phía client. Lệnh chạy bắt buộc phải được ánh xạ qua một enum allowlist (`COMMAND_ALLOWLIST`) cố định trong mã nguồn. Không có đối số bổ sung (arguments) nào từ phía client được truyền trực tiếp vào shell.

## 2. Thiết kế An toàn của các Tools

1.  **`get_project_tree`**: Quét có giới hạn độ sâu tối đa (mặc định 3) và giới hạn số lượng nodes tối đa (2000) để chống tấn công cạn kiệt tài nguyên (DoS) bởi các thư mục quá sâu hoặc quá nhiều file.
2.  **`list_workspace_files`**: Giới hạn số lượng tệp tối đa trả về (`maxFiles` mặc định 2000). Luôn bỏ qua thư mục `node_modules` và `.git` khi duyệt đệ quy.
3.  **`read_file`**:
    *   Tự động kiểm tra file nhị phân (Binary Detection) bằng cách đọc 512 bytes đầu tiên và từ chối nếu có ký tự NULL hoặc điều khiển.
    *   Giới hạn dung lượng đọc tối đa là `MAX_FILE_BYTES` (mặc định 200KB).
    *   Yêu cầu bắt buộc line range hoặc tự động cắt ngắn đối với tệp quá lớn để tránh quá tải bộ nhớ và token context của AI.
4.  **`search_text`**: Tìm kiếm nội dung chỉ trong các tệp văn bản hợp lệ, bỏ qua các thư mục denylist và tệp nhị phân.
5.  **`run_workspace_command`**:
    *   Chạy trong tiến trình con cô lập thông qua `child_process.spawn`.
    *   Có cơ chế timeout tự động (`MAX_COMMAND_TIMEOUT_MS` mặc định 2 phút) để tắt tiến trình nếu bị treo hoặc chạy vô hạn.
    *   Giới hạn dung lượng log output và áp dụng thuật toán truncate thông minh giữ lại 20% log đầu và 70% log cuối (nơi chứa thông tin lỗi chính).

## 3. Quản lý Môi trường & Token
*   Không bao giờ lưu trực tiếp `MCP_AUTH_TOKEN` thật vào repo git.
*   Luôn sử dụng tệp `.env` riêng cục bộ và thêm nó vào `.gitignore`.
*   Logger server được lập trình để tự động phát hiện và che giấu (redact) Bearer token hoặc các tham số nhạy cảm trong siêu dữ liệu (meta).
