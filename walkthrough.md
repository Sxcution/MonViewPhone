- Đã loại bỏ hoàn toàn việc tìm kiếm/lọc theo Model máy thiết bị khỏi chức năng Tìm kiếm Quản lý tài khoản (Quản lý tài khoản).
- Thêm cơ chế lọc sạch các phần tử null/undefined trong danh sách tài khoản để tránh lỗi crash JS làm mờ/ẩn tất cả thiết bị trên Grid khi tìm kiếm.
- Cập nhật placeholder chỉ dẫn tìm kiếm thành "Tìm theo Tên, Nickname, SĐT, Email, Ghi chú...".
- Đổi màu số máy trong Overlay Account (phần `.dav-order` nằm trong `DeviceAccountPanel`) thành màu xanh dương khi có bất kỳ tài khoản WeChat nào trong panel đó đủ điều kiện Active Nearby People (eligible). Mặc định số máy là màu trắng bình thường.
- Cập nhật tooltip cảnh báo thông báo (warning bell) trên header của `DeviceAccountPanel` hiển thị ngay lập tức không có delay khi hover chuột và đi theo vị trí của con trỏ chuột sử dụng Portal.
- Loại bỏ menu dropdown chọn WeChat/Nhóm WeChat trên header của từng DeviceAccountPanel để tối ưu hóa không gian.
- Loại bỏ chấm trạng thái kế bên số máy trên header từng DeviceAccountPanel.
- Tích hợp tính năng ẩn/hiện thông tin nhạy cảm (biệt danh, SĐT, email) khi nhấp chuột vào icon/badge định danh tương ứng, đồng thời khóa nhập liệu (`readOnly`) khi đang ở trạng thái ẩn để tránh lỗi ghi đè dữ liệu.
- Cập nhật màu sắc của badge đếm số tài khoản (`.dav-total-badge`) tự động chuyển màu dựa theo trạng thái Nearby của toàn bộ tài khoản WeChat trong panel (xanh nếu có tài khoản eligible, cam nếu chỉ có tài khoản upcoming, mặc định nếu không có) với giao diện nền trong suốt, viền in đậm và chữ in đậm.
- Sửa lỗi căn lề của biểu tượng chuông thông báo trên tiêu đề panel giúp giữ nguyên chiều cao chuẩn của header khi có/không có cảnh báo.
- Thêm modal Portal xác nhận "Huỷ/Xác nhận xoá tài khoản" để tránh click nhầm trong menu ngữ cảnh.
- Thay đổi màu sắc của icon QR Code và số lượt quét mã QR thành màu trắng khi tài khoản vẫn đủ điều kiện quét (< 3 lượt).
- Cập nhật tệp `naming_registry.json` và `project_structure.md` để đồng bộ các hằng số, lớp CSS và biến trạng thái mới.
- Chạy `npm run build` thành công trên frontend.
- Di chuyển hiển thị số ngày đã Die (dạng `Die: X ngày`) xuống ngay bên dưới dòng ngày tạo "Đã tạo: ...".
- Bỏ chữ "Còn/còn" tại các trạng thái đếm ngược (QR countdown, thông báo, Nearby countdown).
- Chặn modal Quản lý tài khoản kéo lọt lên trên màn hình bằng cách clamp vị trí (đảm bảo `top >= 12px` và header luôn nhìn thấy được), tự động sửa lỗi vị trí khi load từ localStorage hoặc thay đổi kích thước màn hình, và hỗ trợ nhấp đúp vào header để reset vị trí về trung tâm màn hình.
- Xác thực và chạy `npm run build` thành công trên frontend.
- Cập nhật màu sắc tên tài khoản trong danh sách badge đếm số tài khoản và context menu "Tài Khoản" theo các điều kiện:
  - Account `Die` -> đỏ `#ef4444`
  - Account `Risk` -> cam `#f97316`
  - Account không Die/Risk, trên 1 năm tuổi -> xanh lá `#22c55e`
  - Account không Die/Risk, dưới 1 năm tuổi hoặc chưa có ngày tạo -> trắng `#ffffff`
- Ưu tiên trạng thái màu tên tài khoản và badge dot cho WeChat Active Nearby eligible với màu xanh dương (`#3b82f6` cho tên, class `.nearby` cho dot).
- Sửa lỗi dot màu trạng thái cho tài khoản dưới 1 năm: Thêm class `.under-one-year` để dot có nền màu trắng thay vì bị fallback sang xanh lá (live).
- Tích hợp Location icon (cho cả eligible/upcoming) và Notice Bell icon (đỏ nếu hết hạn, vàng nếu chưa) vào Context Menu và Danh sách badge đếm số tài khoản.
- Sắp xếp thứ tự các icon hiển thị sau tên tài khoản đúng chuẩn: Tên tài khoản $\rightarrow$ Location Nearby $\rightarrow$ Chuông thông báo $\rightarrow$ AppType icon.
- Đảm bảo logic Open Nearby People không bị ảnh hưởng, tự động chuyển về trạng thái thường khi set 30 ngày.
- Sửa bug khoảng hở/khe giữa context menu cha và submenu trong Overlay Account:
  - Thay đổi `.dav-ctx-has-sub` thành `position: static` để submenu bám toạ độ theo `.dav-ctx-submenu-container` (ngăn cản khoảng hở do padding/margin của menu item).
  - Căn chỉnh lại `left: calc(100% - 1px)` và `top: 0` cho submenu dính sát vào menu cha.
  - Hỗ trợ `.dav-ctx-submenu::before` làm cầu nối vô hình rộng 8px ở mép của submenu để duy trì trạng thái hover liên tục khi di chuột.
  - Đồng bộ hoá cho cả menu thông thường và menu đổi hướng sang bên trái (`.direction-left`).
- Tự động điền ngày/tháng/năm hiện tại của hệ thống PC (`Date.now()`) vào trường ngày tạo (`createdAt`) của tài khoản mới khi nhấn "Thêm tài khoản" ở cả context menu và giao diện trống.
- Sửa lại tuỳ chọn "Set UnVerify" ở submenu "Trạng Thái" trong context menu:
  - Khi tài khoản chưa UnVerify: hiển thị dòng "Set UnVerify" (màu vàng `#eab308`).
  - Khi tài khoản đã là UnVerify: dòng đó sẽ tự động chuyển thành dòng chữ "Verify Success" (màu xanh lá `#22c55e`). Khi click vào dòng này, tài khoản sẽ được chuyển sang trạng thái "Verify".
- Cập nhật màu tên tài khoản (`getAccountListNameColor`), màu icon bảo mật (`shieldColor`) và màu trường tên tài khoản (`nameColor`) trong panel thành màu vàng (`#eab308`) khi tài khoản đang ở trạng thái `Unverified`.
- Thêm icon hình màu vàng dấu chấm than (sử dụng `ShieldAlert` từ `lucide-react`) vào sau tên của tài khoản đang ở trạng thái `Unverified` ở cả danh sách badge đếm số tài khoản và context menu "Tài Khoản".
- Cho phép tương tác bàn phím và điều khiển trực tiếp trên `DeviceViewer` khi `DeviceAccountOverlay` đang mở (không khoá phím toàn cục qua `__disableDirectKeyboard` nữa, chỉ khoá khi `ThemeInspector` hoạt động).
- Hỗ trợ nhấp nút con lăn chuột (middle-click/auxclick) vào vùng số thứ tự/tiêu đề `.dav-panel-title-left` hoặc các tài khoản trong danh sách dropdown `.dav-title-account-item` để mở hoặc chuyển đổi trực tiếp `DeviceViewer` sang thiết bị tương ứng mà không đóng Overlay Account.
- Đồng bộ hoá callback qua `onOpenDeviceViewer` prop từ `App.tsx` $\rightarrow$ `Tile.tsx` $\rightarrow$ `DeviceAccountPanel`.
- Xác thực và chạy `npm run build` thành công trên frontend.

## Chuyển sang chế độ chạy production local 1 server duy nhất

Đã thực hiện chuyển MonViewPhone sang chế độ chạy local production trên cổng 11000:

- **Backend Go serve static**: Cập nhật [server-go/main.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/main.go) tự động tìm kiếm thư mục `client/dist` theo nhiều hướng để serve tệp tĩnh của React, và cấu hình SPA routing fallback về `index.html`.
- **Loại bỏ sync hai chiều nguy hiểm**: Cập nhật [client/src/main.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/main.tsx) bỏ cơ chế ghi đè thô bạo `localStorage.clear()` khi khởi chạy app và monkey-patching của `localStorage`. Thiết lập Change Detector loop định kỳ (1.5 giây) chỉ đồng bộ các key thay đổi thực tế lên backend.
- **Preflight data safety check**: Tích hợp bộ lọc an toàn `validateBackendSettings` kiểm tra chặt chẽ cấu hình ở cả frontend và launcher [run.pyw](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/run.pyw). Yêu cầu tối thiểu >= 35 thiết bị, >= 104 tài khoản WeChat, tồn tại tài khoản "Emma Zhao" và có cấu hình `tileOrder`/`tileOrderNumbers` hợp lệ.
- **Launcher tối giản**: Sửa đổi launcher `run.pyw` chỉ khởi động `server-go.exe` (không chạy NPM/Vite dev server) và mở Chrome App Mode vào cổng `11000`.
- **Biên dịch & Kiểm thử**: Biên dịch thành công frontend (`npm run build`) và backend (`go build`). Launcher đã kiểm chứng hoạt động tốt, mở giao diện cổng 11000 mượt mà và không sinh tiến trình `node.exe`/`vite.exe`.

## Tăng an toàn dữ liệu: Backend Guard và Client Explicit Save

Nhằm tránh nguy cơ mất mát dữ liệu hoặc hạ cấp số lượng tài khoản/thiết bị bất thường, chúng tôi đã triển khai các nâng cấp sau:

1. **Bộ lọc an toàn ở Backend Go (Backend Guard)**:
   - Triển khai hàm `validateNewVaultAgainstDB` trong [server-go/account_db.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/account_db.go) để kiểm tra các điều kiện an toàn trước khi cho phép ghi đè cơ sở dữ liệu `Data.db` và tệp `settings.json`.
   - Các điều kiện bảo vệ bao gồm:
     - Số lượng thiết bị trong dữ liệu mới không được thấp hơn 35 (nếu cơ sở dữ liệu hiện tại có >= 35 thiết bị).
     - Số lượng tài khoản WeChat mới không được thấp hơn 104 (nếu cơ sở dữ liệu hiện tại có >= 104 tài khoản).
     - Dữ liệu mới không được làm mất tài khoản cực kỳ quan trọng mang tên `Emma Zhao` (nếu cơ sở dữ liệu hiện tại có chứa tài khoản này).
     - Dữ liệu mới phải được giải mã (parse JSON) thành công.
   - Khi dữ liệu mới không đạt điều kiện bảo vệ, API POST `/api/goog/device/settings` sẽ chặn ghi đè và phản hồi mã lỗi `400 Bad Request` kèm thông báo chi tiết lý do (ví dụ: `Refusing to downgrade account vault...`).

2. **Cơ chế lưu rõ ràng ở Client (Client Explicit Save)**:
   - Thêm tệp tiện ích [client/src/lib/backendSettings.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/backendSettings.ts) chứa hàm `saveDeviceAccountVaultToBackend` để thực hiện việc validate dữ liệu phía Client trước khi POST và tiến hành gửi API POST tường minh lên backend với riêng khóa `monviewphone:device-account-vault`.
   - Cập nhật hàm `saveDeviceAccountVault` trong [client/src/lib/deviceAccountVault.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/deviceAccountVault.ts) để ghi dữ liệu vào cả `localStorage` làm cache và tự động gọi API POST đồng bộ lên backend ngay lập tức.
   - Giữ nguyên cơ chế `setInterval` trong `client/src/main.tsx` để làm lớp đồng bộ dự phòng phụ cho các trạng thái khác, không sửa đổi/bỏ đi trong bước này. (Đã được nâng cấp triệt để ở bước sau).

3. **Kiểm thử tự động và biên dịch**:
   - Biên dịch frontend (`npm run build`) và backend Go (`go build -o server-go.exe`) đều thành công 100%.
   - Chạy kịch bản test tự động `test_backend_guard.py` thành công:
     - Thử gửi dữ liệu chứa 70 tài khoản WeChat -> bị từ chối với HTTP 400 (Chính xác).
     - Thử gửi dữ liệu thiếu Emma Zhao -> bị từ chối với HTTP 400 (Chính xác).
     - Thêm tài khoản test mới thành công, kiểm tra dữ liệu trên SQLite lưu thành công (106 accounts).
     - Xoá tài khoản test thành công, dữ liệu khôi phục về 105 accounts.

## Hoàn thiện cơ chế Explicit Save và Loại bỏ sync ngầm (setInterval)

Chúng tôi đã chuyển hoàn toàn cơ chế đồng bộ dữ liệu của MonViewPhone sang mô hình **Explicit Save (Lưu tường minh)** 100%, đồng thời loại bỏ hoàn toàn vòng lặp quét định kỳ (`setInterval`) ở frontend:

1. **Chuẩn hoá helper ở Client (`client/src/lib/backendSettings.ts`)**:
   - Khắc phục lỗi dependency vòng (circular import) bằng cách sử dụng `import type { VaultData }` từ `deviceAccountVault.ts`.
   - Viết các hàm helper đồng bộ an toàn:
     - `saveBackendSetting(key, value)` và `saveBackendSettings(patch)`: Kiểm tra kỹ key rỗng, value null/undefined. Chỉ cho phép giá trị rỗng cho các key trong allowlist (`syncTimeHotkey`, `monviewphone:sync-time-hotkey`, `monviewphone:device-account-hotkey`).
     - `saveTileOrderToBackend(value)`: Đảm bảo payload là mảng có độ dài >= 35.
     - `saveTileOrderNumbersToBackend(value)`: Đảm bảo payload là đối tượng có số lượng keys >= 35.
     - `saveAutomationSettingToBackend`, `saveVisualAlertSettingToBackend`, `saveSyncTimeSettingToBackend`, `saveHotkeySettingToBackend`: Kiểm tra chặt chẽ các key hợp lệ trước khi cho phép gửi POST lên backend.

2. **Áp dụng Explicit Save cho các nhóm chức năng**:
   - **Thứ tự thiết bị (Tile Order)**: Tích hợp `saveTileOrderToBackend` và `saveTileOrderNumbersToBackend` vào các `useEffect` của `client/src/store/useTileOrder.ts` ngay khi ghi `localStorage`.
   - **Tự động hoá (Automation)**: Cập nhật `saveSavedMacros`, `saveAppActions`, `saveDeviceProfiles` trong `client/src/lib/automationData.ts` và `saveAutomationSettings` trong `client/src/components/AutomationModal.tsx`, `client/src/components/AutomationPanel.tsx` để đồng bộ trực tiếp lên backend.
   - **Thời gian đồng bộ (Sync Time/Sync Macro)**: Cập nhật `saveSyncTimeSettings` trong `client/src/lib/syncTimeSettings.ts` và `saveSyncMacroSettings` trong `client/src/lib/syncMacroSettings.ts` để đồng bộ ngay lập tức.
   - **Visual Alert**: Cập nhật `saveVisualAlertConfig` trong `client/src/lib/visualAlertEngine.ts` để đồng bộ cấu hình vùng quét lên backend.
   - **Tổ hợp phím (Hotkey)**: Cập nhật các hàm gán phím nóng và xoá phím nóng trong `client/src/App.tsx` để đồng bộ tức thì lên backend (hỗ trợ lưu giá trị rỗng khi xoá).

3. **Gia cố bảo vệ phía Backend (`server-go/rest.go`)**:
   - Nâng cấp handler `/api/goog/device/settings` phương thức `POST`:
     - Chặn payload rỗng `{}`.
     - Chặn key rỗng hoặc giá trị null.
     - Nếu POST chứa `tileOrder`, kiểm tra định dạng mảng và độ dài >= 35.
     - Nếu POST chứa `tileOrderNumbers`, kiểm tra định dạng map và số lượng keys >= 35.
     - Đảm bảo merge cấu hình cũ và patch mới an toàn, không làm mất các trường cấu hình khác.

4. **Ngắt bỏ hoàn toàn vòng lặp quét sync ngầm (`client/src/main.tsx`)**:
   - Loại bỏ hoàn toàn hằng số `SYNCED_KEYS`, đối tượng cache `lastSyncedValues` và vòng lặp `setInterval(..., 1500)`.
   - Giữ lại đầy đủ cơ chế tải cấu hình ban đầu từ backend (bootstrap settings), kiểm tra an toàn dữ liệu đầu vào (validateBackendSettings), và ghi đè an toàn vào `localStorage` lúc tải trang.

5. **Kiểm thử tự động**:
   - Biên dịch thành công 100% frontend (`npm run build`) và backend Go.
   - Chạy kiểm thử tự động thành công 100% các trường hợp: chặn payload rỗng, chặn key rỗng/null, chặn tileOrder/tileOrderNumbers thiếu máy (<35), kiểm tra lưu và xoá hotkey thành công.

## Di chuyển dữ liệu sang Data.db làm Source of Truth duy nhất

Chúng tôi đã hoàn thành quá trình chuyển đổi toàn diện để biến cơ sở dữ liệu `server-go/data/Data.db` thành nguồn dữ liệu đáng tin cậy duy nhất (Source of Truth) cho thông tin tài khoản và thứ tự hiển thị của thiết bị:

1. **Chuẩn hoá SQLite Schema & Bảo vệ thứ tự máy (`server-go/account_db.go`)**:
   - Bỏ lệnh `DELETE FROM devices` trong quá trình đồng bộ `syncDeviceAccountVaultToDB` nhằm bảo toàn cột `device_order` (thứ tự hiển thị số máy) tránh bị mất mát khi lưu tài khoản.
   - Thêm cơ chế tự động sửa lỗi (auto-repair) trong `getDeviceOrderFromDB`: Nếu thứ tự thiết bị thiếu, tự động đánh số tuần tự `1..N` theo danh sách UDID hiện có trong cơ sở dữ liệu và cập nhật lại vào DB.

2. **Triển khai API đồng bộ Database trực tiếp (`server-go/rest.go` & `main.go`)**:
   - Đăng ký endpoint `/api/goog/device/account-vault` (GET/POST) thực hiện việc đọc/ghi dữ liệu account vault trực tiếp từ cơ sở dữ liệu SQLite, tích hợp cơ chế bảo vệ backend chặn hạ cấp (Refuse downgrade) dưới 35 thiết bị, dưới 104 WeChat accounts hoặc mất Emma Zhao.
   - Đăng ký endpoint `/api/goog/device/order` (GET/POST) để lưu trữ trực tiếp số thứ tự máy của thiết bị vào cột `device_order` trong bảng `devices`.

3. **Chuyển `/api/goog/device/settings` thành Compatibility Endpoint**:
   - Cập nhật handler GET `/api/goog/device/settings` để tự động dựng dữ liệu account vault, `tileOrder` và `tileOrderNumbers` trực tiếp từ SQLite trước khi gửi về client (kể cả khi file `settings.json` hoàn toàn không tồn tại hoặc bị lỗi).
   - Cập nhật POST `/api/goog/device/settings` loại bỏ hoàn toàn các trường dữ liệu `monviewphone:device-account-vault` và `tileOrderNumbers` ra khỏi tệp `settings.json` khi ghi đè, đồng thời điều hướng việc lưu trữ các khoá này sang DB.

4. **Đồng bộ phía Frontend (`client/`)**:
   - Cập nhật `client/src/lib/backendSettings.ts` để `saveDeviceAccountVaultToBackend` gửi yêu cầu POST trực tiếp đến endpoint chuyên biệt `/api/goog/device/account-vault` thay vì API cấu hình chung.
   - Điều chỉnh logic khởi động trong `client/src/main.tsx` để luôn ghi đè và đồng bộ dữ liệu `localStorage` từ backend settings.
   - Nới lỏng kiểm tra `tileOrder`/`tileOrderNumbers` trong `main.tsx` (`validateBackendSettings`): Không coi việc thiếu/sai độ dài các trường này là lỗi chết làm crash app nếu cơ sở dữ liệu tài khoản (`vaultResult.valid`) khoẻ mạnh và có thể repair được.

5. **Launcher Preflight Auto-Repair (`run.pyw`)**:
   - Sửa đổi kịch bản kiểm tra an toàn dữ liệu trước khi mở app: Chỉ chặn ứng dụng khi thông tin cốt lõi thất bại (devices < 35, WeChat accounts < 104 hoặc mất Emma Zhao).
   - Không còn coi việc thiếu `tileOrder`/`tileOrderNumbers` là lỗi chết chặn app.

6. **Loại bỏ ghi ngược từ API Order**:
   - Cập nhật `/api/goog/device/order` POST trong [rest.go](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/rest.go) không ghi ngược trường `tileOrderNumbers` vào `settings.json` nữa.

7. **Kết quả kiểm thử**:
   - Đã biên dịch thành công 100% frontend (`npm run build`) và backend Go (`go build -o server-go.exe`).
   - Chạy kịch bản tích hợp `test_fallback.py` và `test_launcher_preflight.py` thành công tốt đẹp:
     - Khi xoá/thiếu `settings.json`, API GET `/api/goog/device/settings` vẫn tự động dựng đầy đủ `tileOrder`, `tileOrderNumbers` và account vault từ SQLite.
     - Tệp `settings.json` hoàn toàn sạch sẽ, không còn chứa các trường dữ liệu lớn hoặc nhạy cảm của tài khoản và thứ tự hiển thị sau khi cập nhật order.
     - Launcher khởi động và tự repair dữ liệu thành công không gặp lỗi chặn đứng.
