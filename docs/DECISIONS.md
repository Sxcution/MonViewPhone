# DECISIONS.md - Design Decisions

Tài liệu này lưu lại các quyết định thiết kế kiến trúc chính được đưa ra trong quá trình xây dựng MCP Workspace Server.

## 1. Lựa chọn Stack: Node.js + TypeScript
*   **Quyết định**: Sử dụng Node.js, TypeScript và Express cùng với SDK chính thức `@modelcontextprotocol/sdk`.
*   **Bối cảnh**: Mặc dù dự án `MonViewPhone` có phần backend chính viết bằng Go (`server-go`) và frontend viết bằng React, việc tạo một MCP server riêng bằng Node.js + TypeScript là tối ưu nhất vì:
    *   SDK chính thức của Model Context Protocol cho TypeScript rất trưởng thành, được cập nhật liên tục và cung cấp đầy đủ các lớp như `Server`, `SSEServerTransport`.
    *   Giúp giữ mã nguồn MCP tách biệt, dễ bảo trì và nâng cấp độc lập mà không ảnh hưởng tới logic vận hành thiết bị của Go backend hiện tại.
    *   TypeScript mang lại sự an toàn về kiểu dữ liệu (type safety) cao khi định nghĩa schema cho các input/output của tools.

## 2. Lựa chọn SSE (Server-Sent Events) Transport thay vì Stdio trực tiếp cho Server HTTP
*   **Quyết định**: Hỗ trợ đồng thời SSE Transport qua Express HTTP Server (cho các client chạy cloud như ChatGPT) và Stdio (để gọi trực tiếp qua Node CLI cho local clients như Antigravity/Cursor).
*   **Bối cảnh**: ChatGPT bắt buộc giao tiếp qua giao thức mạng HTTPS/SSE, trong khi Antigravity chạy local ưu tiên stdio để có độ trễ cực thấp và không tốn tài nguyên quản lý cổng mạng. Việc xây dựng Express server tích hợp `SSEServerTransport` của MCP giải quyết hoàn hảo cả hai nhu cầu này.

## 3. Không cho phép shell tự do, bắt buộc dùng allowlist
*   **Quyết định**: Từ chối các đề xuất về các tool kiểu `run_shell` nhận lệnh tùy ý. Thay vào đó, thiết kế tool `run_workspace_command` ánh xạ từ enum đầu vào sang mảng tham số cố định.
*   **Bối cảnh**: Đây là chốt chặn an toàn quan trọng nhất. Nếu cho phép shell tự do, AI client có thể bị tấn công Prompt Injection và thực thi các lệnh phá hoại hệ thống (ví dụ: `rm -rf`, cài mã độc, đánh cắp SSH keys). Việc đóng băng tập lệnh cho phép chạy (như npm test, npm lint) đảm bảo an toàn tuyệt đối.

## 4. Xử lý Truncate Log Output thông minh
*   **Quyết định**: Cắt log output dài bằng cách giữ lại 20% phần đầu (thông tin khởi động lệnh) và 70% phần cuối (thông tin lỗi chi tiết, stack trace), loại bỏ phần giữa.
*   **Bối cảnh**: Giới hạn context window của AI đòi hỏi chúng ta không được trả về log quá lớn (gây chậm mạng và tốn token). Tuy nhiên, nếu chỉ cắt cụt phần cuối, AI sẽ hoàn toàn mất đi thông tin lỗi (thường xuất hiện ở cuối tiến trình build/test). Thuật toán này giúp AI nắm bắt được nguyên nhân lỗi chính xác nhất.
