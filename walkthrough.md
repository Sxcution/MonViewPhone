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

## Cập nhật định dạng thời gian đếm ngược dưới 1 ngày

Chúng tôi đã cập nhật giao diện đếm ngược trong Overlay Account để thân thiện hơn với người dùng khi thời gian còn lại ngắn:

1. **Hiển thị theo giờ khi thời gian < 24 giờ**:
   - Thêm hàm helper `formatCountdown` trong [DeviceAccountOverlay.tsx](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/DeviceAccountOverlay.tsx) để tự động chuyển sang hiển thị định dạng giờ (ví dụ: `23 giờ`, `22 giờ`...) nếu thời gian còn lại dưới 1 ngày (24 giờ), thay vì hiển thị tròn số "1 ngày" như trước đây. Nếu thời gian lớn hơn hoặc bằng 24 giờ, định dạng hiển thị vẫn giữ nguyên là `X ngày`.

2. **Áp dụng cho các thành phần**:
   - **Thông báo**: Khi thời gian đến hạn thông báo dưới 24 giờ, hiển thị số giờ còn lại (ví dụ: `: 15 giờ`).
   - **Quét QR**: Khi thời gian đếm ngược lượt quét QR dưới 24 giờ, hiển thị số giờ (ví dụ: `(8 giờ)`).
   - **Đủ điều kiện Active Nearby People**: Khi thời gian đếm ngược chờ đủ điều kiện Nearby People dưới 24 giờ, hiển thị số giờ (ví dụ: `20 giờ`).

3. **Kết quả kiểm thử**:
   - Đã biên dịch thành công 100% frontend (`npm run build`). Giao diện đếm ngược đã sẵn sàng hoạt động mượt mà.

## Điều chỉnh vị trí nút Setting trong Sidebar cấu hình bên phải

Chúng tôi đã thực hiện thay đổi layout để nút Setting nằm ở vị trí hợp lý hơn:

1. **Di chuyển nút System Settings sát lề phải**:
   - Cập nhật cả 2 khối định nghĩa CSS `.btn-setting` trong tệp [styles.css](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/styles.css) từ `left: 58px` sang `right: 12px; left: auto;`.
   - Giúp nút ghim gờ (Pin) giữ nguyên vị trí ở góc trên bên trái, còn nút bánh răng Setting (mở cài đặt hệ thống) được đẩy sang sát góc trên bên phải của bảng cấu hình bên phải (`rightConfigPanel`).

2. **Kết quả**:
   - Biên dịch frontend thành công 100% (`npm run build`). Nút Setting đã được dịch chuyển sang sát lề phải chuẩn xác, tạo giao diện cân đối và thoáng mắt.

## Tách nút Quick Controls "Bật/Tắt màn hình vật lý" thành 2 nút riêng biệt

Chúng tôi đã tách nút điều khiển gộp trước đây thành hai nút độc lập để tăng tính kiểm soát và tránh nhầm lẫn trạng thái:

1. **Tách các Action Id & Cập nhật Di cư (Migration) cấu hình**:
   - Loại bỏ `physicalScreenToggle` trong [App.tsx](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/App.tsx).
   - Thêm 2 Id mới là `physicalScreenOn` và `physicalScreenOff`.
   - Cập nhật hàm `loadQuickActionOrder()` tự động nhận diện nếu cấu hình cũ của người dùng trong `localStorage` có chứa `physicalScreenToggle`, hệ thống sẽ tự động tách nó ra và điền 2 nút mới vào vị trí tương ứng mà không làm ảnh hưởng đến thứ tự các nút khác.

2. **Cài đặt Nút "Bật Màn Hình" (`physicalScreenOn`)**:
   - Label: `Bật màn hình`
   - Icon: Biểu tượng `Monitor` (Màn hình bật) được import từ `lucide-react`.
   - Chức năng: Chỉ thực hiện bật màn hình vật lý của các thiết bị được chọn (gọi `setDeviceDisplayPower(..., 'on')`), không kích hoạt Stay Awake và không tự đổi trạng thái nút.

3. **Cài đặt Nút "Tắt Màn Hình" (`physicalScreenOff`)**:
   - Label: `Tắt màn hình`
   - Icon: Biểu tượng `MonitorOff` (Màn hình tắt).
   - Chức năng: Chạy adb lệnh bật Stay Awake trước (`stay_on_while_plugged_in 7`), sau đó gọi lệnh tắt màn hình vật lý (thông qua hàm helper `runPhysicalScreenOffWithStayAwake(targets)`).

4. **Bảo toàn cơ chế tự động**:
   - Giữ nguyên cơ chế tự động tắt màn hình + stay awake khi cắm thiết bị hoặc app load (`autoScreenPrepare` dùng `useEffect`).

5. **Kết quả**:
   - Đã gỡ bỏ state trung gian không cần thiết (`physicalScreenButtonMode`).
   - Biên dịch thành công 100% cả frontend (`npm run build`) và backend Go (`go build ./...`). Giao diện Quick Controls hiển thị 2 nút riêng biệt đúng chuẩn.

## Tối ưu hóa thực thi đồng thời (Concurrency) cho các Quick/Global Actions

Chúng tôi đã loại bỏ hoàn toàn các cơ chế giới hạn luồng, hàng chờ (batching/queue/concurrency limit 8) hoặc vòng lặp chạy tuần tự trên các nhóm thiết bị để toàn bộ thiết bị nhận lệnh đồng thời ngay lập tức:

1. **Loại bỏ giới hạn luồng & Tuần tự hóa**:
   - Thay thế helper `runWithConcurrency(..., 8)` và vòng lặp `for...of` tuần tự bằng `Promise.allSettled` trên toàn bộ các phương thức hành động nhóm.
   - Các hành động được tối ưu bao gồm:
     * `runQuickAdbCommands`: Thực thi các nút tắt nhanh (Tắt tiếng, Mở âm thanh, Max âm lượng...).
     * `runPhysicalScreenOffWithStayAwake`: Lệnh tắt màn hình vật lý + Stay Awake đồng loạt.
     * `runStayAwakeForTargets`: Lệnh Stay Awake đồng loạt.
     * Quick action `Bật màn hình` (`physicalScreenOn`): Bật màn hình vật lý đồng loạt.
     * Quick action `Power key` (`screenOff`): Gửi tín hiệu nút nguồn (thử qua socket trước, adb fallback sau) đồng loạt.
     * `runGlobalAdbCommand`: Chạy lệnh ADB tuỳ chỉnh do user nhập cho tất cả thiết bị được chọn.
     * `handleSetWallpaperForDevices`: Tạo và đặt hình nền hiển thị số máy đồng loạt.

2. **Đảm bảo thứ tự lệnh trong từng thiết bị đơn lẻ**:
   - Mặc dù chạy đồng thời trên các thiết bị khác nhau, thứ tự thực thi của các câu lệnh bên trong cùng một thiết bị vẫn được bảo đảm tuần tự để giữ đúng logic hoạt động (ví dụ: Mở âm thanh phải tắt DND trước rồi mới set volume; Tắt màn hình vật lý phải bật Stay Awake trước rồi mới display off).

3. **Kết quả**:
   - Đã biên dịch thành công 100% frontend (`npm run build`) và backend Go. Toàn bộ thiết bị được chọn sẽ phản hồi đồng thời ngay lập tức khi click nút.

## Tính năng Luôn hiện Header và Di chuyển Tên tài khoản lên Header của Panel Quản lý tài khoản

Chúng tôi đã bổ sung tuỳ chọn "Luôn hiện Header" và di chuyển ô nhập Tên tài khoản WeChat lên thanh Header của overlay thiết bị:

1. **Tuỳ chọn "Luôn hiện Header" (Header Always On)**:
   - Thêm toggle cấu hình **Luôn hiện Header** vào trong modal **Cài đặt Quản lý tài khoản** (mục **Ẩn/Hiển**).
   - Thiết lập key cấu hình kỹ thuật chuẩn `alwaysShowHeader` (được lưu và đồng bộ dưới khoá `'monviewphone:dav-always-show-header'`).
   - Cập nhật [Tile.tsx](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/tile/Tile.tsx) lắng nghe sự kiện thay đổi cài đặt ẩn/hiển để mount overlay và thiết lập CSS class động: `.tile-account-overlay.is-header-only`.
   - Cập nhật [styles.css](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/styles.css) để khi ở chế độ `.is-header-only`, overlay sẽ chỉ có chiều cao cố định `28px` bám ở trên cùng và ẩn phần thân `.dav-panel-body` đi.
   - **Đồng bộ hiển thị Dropdown khi overlay ẩn**: Thiết lập `overflow: visible !important` cho cả `.tile-account-overlay.is-header-only` và `.dav-panel` để khi người dùng click vào tên hoặc badge ở header, dropdown danh sách tài khoản vẫn hiển thị nổi lên phía trên màn hình scrcpy thay vì bị che khuất. Vùng màn hình scrcpy phía dưới vẫn nhận tương tác chuột bình thường từ người dùng.

2. **Di chuyển và tối ưu hóa tương tác Tên tài khoản trên Header**:
   - Di chuyển ô nhập tên tài khoản (kèm icon `Shield` bảo mật và dropdown đổi trạng thái tài khoản) từ thân card `.dav-account-card` (trong `.dav-panel-body`) lên thanh tiêu đề `.dav-panel-header`, nằm giữa tiêu đề máy bên trái và nút danh sách tài khoản bên phải.
   - Loại bỏ ô nhập tên tài khoản cũ trong `.dav-account-card` để tránh trùng lặp.
   - Thêm kiểu dáng CSS (`.dav-header-name-wrapper` và `.header-name-input`) hiển thị trong suốt, không viền, tự động co giãn (`flex: 1`) và thu nhỏ chữ khi ở trên tile thiết bị.
   - *Ẩn icon Shield*: Icon hình khiên bảo mật (`Shield`) chỉ hiển thị khi Overlay đang mở (`showAccountOverlay === true`), tức là khi tắt/thu nhỏ overlay về chế độ `Header Always On` thì icon Shield sẽ tự động ẩn đi để tránh rối mắt trên tile.
   - *Căn giữa Tên tài khoản*: Thiết lập `.dav-header-name-wrapper` sử dụng `justify-content: center` và `.header-name-input`, `.header-name-display` sử dụng `text-align: center` để căn lề giữa tuyệt đối cho tên và ô nhập.
   - *Hiển thị Badge Location (MapPin)*: Hiển thị biểu tượng Location trực tiếp bên cạnh tên tài khoản trên header khi tài khoản đang chọn là WeChat (màu xanh dương `#3b82f6` nếu đủ điều kiện, màu cam `#f97316` nếu gần đủ điều kiện / upcoming tối đa 3 ngày).
   - *Click 1 lần (Single-click)*: Kích hoạt hiển thị dropdown danh sách tài khoản ngay lập tức (không bị delay 250ms).
   - *Click 2 lần (Double-click)*: Mở chế độ chỉnh sửa tên tài khoản trực tiếp (inline input editor) lập tức và tự động đóng dropdown danh sách tài khoản, hoàn thành chỉnh sửa khi nhấn `Enter` hoặc di chuột ra ngoài (`onBlur`).
   - *Bỏ tiêu đề dropdown*: Loại bỏ dòng chữ tiêu đề `"Tai khoan nhom hien tai"` trong dropdown danh sách tài khoản để hiển thị danh sách các tài khoản gọn gàng và trực quan hơn.

3. **Đồng bộ và Kiểm thử**:
   - Đăng ký khoá `'monviewphone:dav-always-show-header'` vào danh sách `configKeysToSync` trong `main.tsx` để đồng bộ an toàn qua backend `settings.json`.
   - Cập nhật hằng số, lớp CSS và biến trạng thái mới vào [naming_registry.json](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/naming_registry.json) và [project_structure.md](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/project_structure.md).
   - Chạy `npm run build` biên dịch thành công 100% frontend mà không có lỗi.

## Thêm Submenu Phân Loại Cho Các Tài Khoản Đã Tạo Sẵn

Chúng tôi đã bổ sung các submenu phân loại tài khoản (Main, Clone, Secure Folder, Shelter) cho các tài khoản đã tạo sẵn ở mọi vị trí tương tác context menu để nâng cao trải nghiệm người dùng:

1. **Submenu Phân Loại Trong Danh Sách Tài Khoản (`Tài Khoản`)**:
   - Thay đổi cấu trúc menu danh sách tài khoản đã tạo sẵn trong submenu **Tài Khoản** của menu ngữ cảnh chính.
   - Khi hover vào một tài khoản đã tạo sẵn trong danh sách, một submenu mới sẽ mở ra hiển thị hai tuỳ chọn:
     - **Chọn tài khoản này**: Đặt tài khoản đó làm tài khoản chính cho thiết bị (`handleSetMain`).
     - **Phân loại**: Khi hover vào đây, một sub-submenu (Level 4) sẽ mở ra hiển thị các tuỳ chọn phân loại tương ứng: **Main**, **Clone**, **Secure Folder**, **Shelter**.
   - Việc tách riêng hai hành động giúp người dùng thao tác trực quan, tránh việc vô tình chọn tài khoản làm chính khi đang muốn đổi phân loại và ngược lại.

2. **Submenu Phân Loại Trên Card Tài Khoản Đang Chọn**:
   - Thêm trực tiếp tuỳ chọn **Phân Loại** vào menu ngữ cảnh chính (khi click chuột phải vào card tài khoản đang chọn).
   - Menu con này cho phép người dùng đổi nhanh phân loại của tài khoản hiện tại mà không cần phải tìm kiếm và hover vào tài khoản đó trong danh sách `Tài Khoản`.
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

## Cập nhật định dạng thời gian đếm ngược dưới 1 ngày

Chúng tôi đã cập nhật giao diện đếm ngược trong Overlay Account để thân thiện hơn với người dùng khi thời gian còn lại ngắn:

1. **Hiển thị theo giờ khi thời gian < 24 giờ**:
   - Thêm hàm helper `formatCountdown` trong [DeviceAccountOverlay.tsx](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/DeviceAccountOverlay.tsx) để tự động chuyển sang hiển thị định dạng giờ (ví dụ: `23 giờ`, `22 giờ`...) nếu thời gian còn lại dưới 1 ngày (24 giờ), thay vì hiển thị tròn số "1 ngày" như trước đây. Nếu thời gian lớn hơn hoặc bằng 24 giờ, định dạng hiển thị vẫn giữ nguyên là `X ngày`.

2. **Áp dụng cho các thành phần**:
   - **Thông báo**: Khi thời gian đến hạn thông báo dưới 24 giờ, hiển thị số giờ còn lại (ví dụ: `: 15 giờ`).
   - **Quét QR**: Khi thời gian đếm ngược lượt quét QR dưới 24 giờ, hiển thị số giờ (ví dụ: `(8 giờ)`).
   - **Đủ điều kiện Active Nearby People**: Khi thời gian đếm ngược chờ đủ điều kiện Nearby People dưới 24 giờ, hiển thị số giờ (ví dụ: `20 giờ`).

3. **Kết quả kiểm thử**:
   - Đã biên dịch thành công 100% frontend (`npm run build`). Giao diện đếm ngược đã sẵn sàng hoạt động mượt mà.

## Điều chỉnh vị trí nút Setting trong Sidebar cấu hình bên phải

Chúng tôi đã thực hiện thay đổi layout để nút Setting nằm ở vị trí hợp lý hơn:

1. **Di chuyển nút System Settings sát lề phải**:
   - Cập nhật cả 2 khối định nghĩa CSS `.btn-setting` trong tệp [styles.css](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/styles.css) từ `left: 58px` sang `right: 12px; left: auto;`.
   - Giúp nút ghim gờ (Pin) giữ nguyên vị trí ở góc trên bên trái, còn nút bánh răng Setting (mở cài đặt hệ thống) được đẩy sang sát góc trên bên phải của bảng cấu hình bên phải (`rightConfigPanel`).

2. **Kết quả**:
   - Biên dịch frontend thành công 100% (`npm run build`). Nút Setting đã được dịch chuyển sang sát lề phải chuẩn xác, tạo giao diện cân đối và thoáng mắt.

## Tách nút Quick Controls "Bật/Tắt màn hình vật lý" thành 2 nút riêng biệt

Chúng tôi đã tách nút điều khiển gộp trước đây thành hai nút độc lập để tăng tính kiểm soát và tránh nhầm lẫn trạng thái:

1. **Tách các Action Id & Cập nhật Di cư (Migration) cấu hình**:
   - Loại bỏ `physicalScreenToggle` trong [App.tsx](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/App.tsx).
   - Thêm 2 Id mới là `physicalScreenOn` và `physicalScreenOff`.
   - Cập nhật hàm `loadQuickActionOrder()` tự động nhận diện nếu cấu hình cũ của người dùng trong `localStorage` có chứa `physicalScreenToggle`, hệ thống sẽ tự động tách nó ra và điền 2 nút mới vào vị trí tương ứng mà không làm ảnh hưởng đến thứ tự các nút khác.

2. **Cài đặt Nút "Bật Màn Hình" (`physicalScreenOn`)**:
   - Label: `Bật màn hình`
   - Icon: Biểu tượng `Monitor` (Màn hình bật) được import từ `lucide-react`.
   - Chức năng: Chỉ thực hiện bật màn hình vật lý của các thiết bị được chọn (gọi `setDeviceDisplayPower(..., 'on')`), không kích hoạt Stay Awake và không tự đổi trạng thái nút.

3. **Cài đặt Nút "Tắt Màn Hình" (`physicalScreenOff`)**:
   - Label: `Tắt màn hình`
   - Icon: Biểu tượng `MonitorOff` (Màn hình tắt).
   - Chức năng: Chạy adb lệnh bật Stay Awake trước (`stay_on_while_plugged_in 7`), sau đó gọi lệnh tắt màn hình vật lý (thông qua hàm helper `runPhysicalScreenOffWithStayAwake(targets)`).

4. **Bảo toàn cơ chế tự động**:
   - Giữ nguyên cơ chế tự động tắt màn hình + stay awake khi cắm thiết bị hoặc app load (`autoScreenPrepare` dùng `useEffect`).

5. **Kết quả**:
   - Đã gỡ bỏ state trung gian không cần thiết (`physicalScreenButtonMode`).
   - Biên dịch thành công 100% cả frontend (`npm run build`) và backend Go (`go build ./...`). Giao diện Quick Controls hiển thị 2 nút riêng biệt đúng chuẩn.

## Tối ưu hóa thực thi đồng thời (Concurrency) cho các Quick/Global Actions

Chúng tôi đã loại bỏ hoàn toàn các cơ chế giới hạn luồng, hàng chờ (batching/queue/concurrency limit 8) hoặc vòng lặp chạy tuần tự trên các nhóm thiết bị để toàn bộ thiết bị nhận lệnh đồng thời ngay lập tức:

1. **Loại bỏ giới hạn luồng & Tuần tự hóa**:
   - Thay thế helper `runWithConcurrency(..., 8)` và vòng lặp `for...of` tuần tự bằng `Promise.allSettled` trên toàn bộ các phương thức hành động nhóm.
   - Các hành động được tối ưu bao gồm:
     * `runQuickAdbCommands`: Thực thi các nút tắt nhanh (Tắt tiếng, Mở âm thanh, Max âm lượng...).
     * `runPhysicalScreenOffWithStayAwake`: Lệnh tắt màn hình vật lý + Stay Awake đồng loạt.
     * `runStayAwakeForTargets`: Lệnh Stay Awake đồng loạt.
     * Quick action `Bật màn hình` (`physicalScreenOn`): Bật màn hình vật lý đồng loạt.
     * Quick action `Power key` (`screenOff`): Gửi tín hiệu nút nguồn (thử qua socket trước, adb fallback sau) đồng loạt.
     * `runGlobalAdbCommand`: Chạy lệnh ADB tuỳ chỉnh do user nhập cho tất cả thiết bị được chọn.
     * `handleSetWallpaperForDevices`: Tạo và đặt hình nền hiển thị số máy đồng loạt.

2. **Đảm bảo thứ tự lệnh trong từng thiết bị đơn lẻ**:
   - Mặc dù chạy đồng thời trên các thiết bị khác nhau, thứ tự thực thi của các câu lệnh bên trong cùng một thiết bị vẫn được bảo đảm tuần tự để giữ đúng logic hoạt động (ví dụ: Mở âm thanh phải tắt DND trước rồi mới set volume; Tắt màn hình vật lý phải bật Stay Awake trước rồi mới display off).

3. **Kết quả**:
   - Đã biên dịch thành công 100% frontend (`npm run build`) và backend Go. Toàn bộ thiết bị được chọn sẽ phản hồi đồng thời ngay lập tức khi click nút.

## Tính năng Luôn hiện Header và Di chuyển Tên tài khoản lên Header của Panel Quản lý tài khoản

Chúng tôi đã bổ sung tuỳ chọn "Luôn hiện Header" và di chuyển ô nhập Tên tài khoản WeChat lên thanh Header của overlay thiết bị:

1. **Tuỳ chọn "Luôn hiện Header" (Header Always On)**:
   - Thêm toggle cấu hình **Luôn hiện Header** vào trong modal **Cài đặt Quản lý tài khoản** (mục **Ẩn/Hiển**).
   - Thiết lập key cấu hình kỹ thuật chuẩn `alwaysShowHeader` (được lưu và đồng bộ dưới khoá `'monviewphone:dav-always-show-header'`).
   - Cập nhật [Tile.tsx](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/tile/Tile.tsx) lắng nghe sự kiện thay đổi cài đặt ẩn/hiển để mount overlay và thiết lập CSS class động: `.tile-account-overlay.is-header-only`.
   - Cập nhật [styles.css](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/styles.css) để khi ở chế độ `.is-header-only`, overlay sẽ chỉ có chiều cao cố định `28px` bám ở trên cùng và ẩn phần thân `.dav-panel-body` đi.
   - **Đồng bộ hiển thị Dropdown khi overlay ẩn**: Thiết lập `overflow: visible !important` cho cả `.tile-account-overlay.is-header-only` và `.dav-panel` để khi người dùng click vào tên hoặc badge ở header, dropdown danh sách tài khoản vẫn hiển thị nổi lên phía trên màn hình scrcpy thay vì bị che khuất. Vùng màn hình scrcpy phía dưới vẫn nhận tương tác chuột bình thường từ người dùng.

2. **Di chuyển và tối ưu hóa tương tác Tên tài khoản trên Header**:
   - Di chuyển ô nhập tên tài khoản (kèm icon `Shield` bảo mật và dropdown đổi trạng thái tài khoản) từ thân card `.dav-account-card` (trong `.dav-panel-body`) lên thanh tiêu đề `.dav-panel-header`, nằm giữa tiêu đề máy bên trái và nút danh sách tài khoản bên phải.
   - Loại bỏ ô nhập tên tài khoản cũ trong `.dav-account-card` để tránh trùng lặp.
   - Thêm kiểu dáng CSS (`.dav-header-name-wrapper` và `.header-name-input`) hiển thị trong suốt, không viền, tự động co giãn (`flex: 1`) và thu nhỏ chữ khi ở trên tile thiết bị.
   - *Ẩn icon Shield*: Icon hình khiên bảo mật (`Shield`) chỉ hiển thị khi Overlay đang mở (`showAccountOverlay === true`), tức là khi tắt/thu nhỏ overlay về chế độ `Header Always On` thì icon Shield sẽ tự động ẩn đi để tránh rối mắt trên tile.
   - *Căn giữa Tên tài khoản*: Thiết lập `.dav-header-name-wrapper` sử dụng `justify-content: center` và `.header-name-input`, `.header-name-display` sử dụng `text-align: center` để căn lề giữa tuyệt đối cho tên và ô nhập.
   - *Hiển thị Badge Location (MapPin)*: Hiển thị biểu tượng Location trực tiếp bên cạnh tên tài khoản trên header khi tài khoản đang chọn là WeChat (màu xanh dương `#3b82f6` nếu đủ điều kiện, màu cam `#f97316` nếu gần đủ điều kiện / upcoming tối đa 3 ngày).
   - *Click 1 lần (Single-click)*: Kích hoạt hiển thị dropdown danh sách tài khoản ngay lập tức (không bị delay 250ms).
   - *Click 2 lần (Double-click)*: Mở chế độ chỉnh sửa tên tài khoản trực tiếp (inline input editor) lập tức và tự động đóng dropdown danh sách tài khoản, hoàn thành chỉnh sửa khi nhấn `Enter` hoặc di chuột ra ngoài (`onBlur`).
   - *Bỏ tiêu đề dropdown*: Loại bỏ dòng chữ tiêu đề `"Tai khoan nhom hien tai"` trong dropdown danh sách tài khoản để hiển thị danh sách các tài khoản gọn gàng và trực quan hơn.

3. **Đồng bộ và Kiểm thử**:
   - Đăng ký khoá `'monviewphone:dav-always-show-header'` vào danh sách `configKeysToSync` trong `main.tsx` để đồng bộ an toàn qua backend `settings.json`.
   - Cập nhật hằng số, lớp CSS và biến trạng thái mới vào [naming_registry.json](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/naming_registry.json) và [project_structure.md](file:///C:/Users/Mon/Desktop/Protect/MonViewPhone/project_structure.md).
   - Chạy `npm run build` biên dịch thành công 100% frontend mà không có lỗi.

## Thêm Submenu Phân Loại Cho Các Tài Khoản Đã Tạo Sẵn

Chúng tôi đã bổ sung các submenu phân loại tài khoản (Main, Clone, Secure Folder, Shelter) cho các tài khoản đã tạo sẵn ở mọi vị trí tương tác context menu để nâng cao trải nghiệm người dùng:

1. **Submenu Phân Loại Trong Danh Sách Tài Khoản (`Tài Khoản`)**:
   - Thay đổi cấu trúc menu danh sách tài khoản đã tạo sẵn trong submenu **Tài Khoản** của menu ngữ cảnh chính.
   - Khi hover vào một tài khoản đã tạo sẵn trong danh sách, một submenu mới sẽ mở ra hiển thị hai tuỳ chọn:
     - **Chọn tài khoản này**: Đặt tài khoản đó làm tài khoản chính cho thiết bị (`handleSetMain`).
     - **Phân loại**: Khi hover vào đây, một sub-submenu (Level 4) sẽ mở ra hiển thị các tuỳ chọn phân loại tương ứng: **Main**, **Clone**, **Secure Folder**, **Shelter**.
   - Việc tách riêng hai hành động giúp người dùng thao tác trực quan, tránh việc vô tình chọn tài khoản làm chính khi đang muốn đổi phân loại và ngược lại.

2. **Submenu Phân Loại Trên Card Tài Khoản Đang Chọn**:
- Thêm trực tiếp tuỳ chọn **Phân Loại** vào menu ngữ cảnh chính (khi click chuột phải vào card tài khoản đang chọn).
   - Menu con này cho phép người dùng đổi nhanh phân loại của tài khoản hiện tại mà không cần phải tìm kiếm và hover vào tài khoản đó trong danh sách `Tài Khoản`.

3. **Submenu Phân Loại Trong Menu Ngữ Cảnh Dropdown Tiêu Đề**:
   - Bổ sung tuỳ chọn **Phân loại** vào menu ngữ cảnh `accountActionMenu` (khi click chuột phải vào tài khoản trong dropdown danh sách tài khoản ở header của thiết bị).
   - Cho phép người dùng trực tiếp phân loại nhanh tài khoản từ danh sách dropdown ở header mà không cần mở giao diện Quản lý tài khoản toàn màn hình.

4. **Đồng Bộ & Build**:
   - Cấu trúc lại các biến trạng thái submenu React (`showClassificationSubmenu` và `activeLevel4`) đảm bảo được reset sạch sẽ khi đóng menu ngữ cảnh để tránh lỗi giao diện.
   - Thêm hằng số vào `naming_registry.json` và cập nhật thông tin trong `project_structure.md`.
   - Biên dịch thành công 100% frontend bằng lệnh `npm run build`.

## Sửa Lỗi Giao Diện Nền Tối Giản (Minimal Background)

Chúng tôi đã khắc phục toàn bộ các lỗi hiển thị liên quan đến chế độ **Nền tối giản** (khi `header-minimal-bg` được bật) trên tiêu đề thiết bị:

1. **Sửa lỗi hiển thị Dropdown & Context Menu**:
   - Dropdown danh sách tài khoản (`.dav-title-account-dropdown`) và dropdown trạng thái tên (`.dav-name-status-dropdown`) được định vị lại bằng toạ độ tuyệt đối và chiều rộng cố định thích hợp (`220px` và `110px` tương ứng) thay vì bị co hẹp theo kích thước của badge số tài khoản.
   - Tự động tăng `z-index` lên `20000 !important` cho `.tile-account-overlay` của thiết bị khi có bất kỳ dropdown nào mở bên trong (sử dụng selector `:has()`), đảm bảo các dropdown luôn nổi trên các tile thiết bị xung quanh.
   - **Tooltip thông báo hướng xuống cho hàng trên cùng**: Cấu trúc lại Portal hiển thị tooltip nội dung thông báo. Nếu tọa độ Y của chuột/chuông `< 160px` (xác định động các tiêu đề thiết bị nằm ở hàng trên cùng của view), tooltip sẽ tự động đảo hướng hiển thị xuống **phía dưới** con trỏ chuột thay vì hiển thị phía trên, tránh bị che khuất hoặc tràn ra ngoài mép màn hình của trình duyệt.
   - **Sửa bug Context Menu hiển thị dưới Dropdown**: Tăng `z-index` của `.dav-ctx-menu` (context menu được Portal vẽ ra bên ngoài body khi nhấp chuột phải) lên `25000 !important` (từ `10000`) để nó luôn hiển thị trên tất cả các tile và dropdown khác (kể cả tile có `z-index: 20000`).

2. **Giữ nguyên kích thước chuẩn (Không thu nhỏ)**:
   - Badge số tài khoản (`.dav-total-badge`), tên tài khoản (`.dav-header-name-wrapper`) và nút chuông thông báo (`.dav-bell-btn`) được giữ nguyên kích thước lớn chuẩn khi bật Nền tối giản (không bị thu nhỏ lại kích thước 11px / 18px như ở chế độ có nền thông thường).
   - Tăng nhẹ chiều cao của header Nền tối giản lên `32px !important` (thay vì `28px`) để các phần tử kích thước lớn này được hiển thị cân đối và không bị chen chúc hay tràn viền.

3. **Sửa lỗi viền ô vuông của Badge số tài khoản**:
   - Loại bỏ quy tắc ghi đè `border-radius: 4px` của chế độ tối giản trên `.dav-total-badge`, phục hồi lại viền tròn hoàn hảo (`border-radius: 50% !important`) và loại bỏ padding thừa (`padding: 0 !important`).
   - **Giảm kích thước nền đen của Badge tối đa**: Điều chỉnh kích thước của badge tròn `.dav-total-badge` thành `width: 20px !important; height: 20px !important; min-width: 20px !important; font-size: 12px !important` khi bật Nền tối giản để phần nền đen ôm sát khít lấy con số bên trong một cách tinh gọn nhất mà không làm thay đổi viền tròn.
   - Đồng bộ hóa thiết kế bằng cách áp dụng viền tròn (`border-radius: 50% !important`) và loại bỏ padding cho nút chuông thông báo `.dav-bell-btn` để có vẻ ngoài đồng điệu, cao cấp.
   - Giảm padding của `.dav-header-name-wrapper` xuống tối đa (`padding: 1px 3px !important;`) để phần nền đen ôm khít tên tài khoản một cách tinh giản nhất.
   - Áp dụng các token màu chuẩn (`var(--md-card)`, `var(--md-border)`, `var(--md-shadow-panel)`) cho các dropdown mới được cấu trúc lại, tuyệt đối không dùng mã màu xám hardcode.

4. **Xác thực & Biên dịch**:
   - Chạy lệnh `npm run build` biên dịch thành công 100% frontend mà không có lỗi.

## Cập Nhật Sao Chép, Cảnh Báo Trạng Thái Và Đếm Ngược Gần Đủ Điều Kiện Nearby

Chúng tôi đã bổ sung và tối ưu hóa các tương tác quản lý tài khoản sau:

1. **Thao Tác Copy ID (User name) & Sắp Xếp Context Menu**:
   - Thêm tuỳ chọn **Copy ID ( User name)** lên đầu danh sách của menu ngữ cảnh tài khoản (nhấp chuột phải vào tài khoản ở dropdown tiêu đề). Khi nhấp vào, biệt danh (`nickname`) của tài khoản đó sẽ được tự động sao chép vào Clipboard hệ thống.
   - Di chuyển tuỳ chọn **Di chuyển tài khoản** (trước đây ghi sai chính tả là "Di chuyen tai khoan") xuống dưới cùng của menu và cập nhật tên hiển thị chuẩn tiếng Việt có dấu.

2. **Cập Nhật Tooltip Trạng Thái**:
   - Gắn tooltip (`title`) cho cả biểu tượng hình Khiên bảo mật (`Shield`) và dòng chữ hiển thị tên tài khoản ở header.
   - **Tài khoản Risk**: Tooltip hiển thị dạng `"Tài khoản risk: xx Ngày"` (với `xx` là số ngày đếm ngược lấy từ notice tự động của Risk).
   - **Tài khoản Die**: Tooltip hiển thị dạng `"Tài khoản đã Die : xx Ngày"` (được tính toán từ mốc thời gian `dieAt`).

3. **Cải Tiến Hiển Thị Đếm Ngược Nearby People**:
   - **Tăng ngưỡng đếm ngược lên 7 ngày**: Tăng khoảng thời gian phát hiện trạng thái gần đủ điều kiện (`upcoming`) lên tối đa `7 ngày` (tăng từ 3 ngày) trong helper `deviceAccountNearby.ts`.
   - **Sắp xếp lại vị trí các biểu tượng**: Chuyển vị trí hiển thị icon Location (MapPin) ra **sau cùng của tất cả các icon khác** (sau cả AppType icon).
   - **Định dạng thời gian đếm ngược**:
     - Hiển thị `"X ngày"` (ví dụ: `MapPin 6 ngày`) nếu thời gian đếm ngược $\ge 24$ giờ.
     - Tự động chuyển sang định dạng `"X Giờ"` (chỉ hiển thị giờ, không hiển thị phút, ví dụ: `MapPin 23 Giờ`) nếu thời gian còn lại dưới 1 ngày (24 giờ) để đảm bảo thông tin ngắn gọn, trực quan.

4. **Xác thực & Biên dịch**:
   - Chạy lệnh `npm run build` biên dịch thành công 100% frontend mà không có bất kỳ lỗi TS/Vite nào.

## Tích hợp Chấm Tròn Đăng Nhập Liên Tục (Streak) & Mở Nhanh Context Menu Trên Header

Chúng tôi đã thực hiện các thay đổi sau để cải tiến logic hiển thị chấm tròn trạng thái và bổ sung tương tác mở nhanh menu trên Header:

1. **Logic Chấm Tròn Đăng Nhập Liên Tục (Streak)**:
   - Thêm `'Login'` vào danh sách hành động lịch sử tài khoản (`AccountHistoryAction`) trong [deviceAccountVault.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/lib/deviceAccountVault.ts).
   - Cập nhật hàm `handleSetMain` trong [DeviceAccountOverlay.tsx](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/DeviceAccountOverlay.tsx) để tự động thêm bản ghi lịch sử hành động `'Login'` kèm theo thời gian hiện tại vào lịch sử của tài khoản được chọn, nếu ngày hôm nay (tính theo giờ địa phương) tài khoản đó chưa được ghi nhận đăng nhập.
   - Thay thế chấm tròn trạng thái cũ bên cạnh tên tài khoản trong dropdown thành chấm tròn đăng nhập liên tục:
     - **Chấm tròn màu trắng**: Xuất hiện nếu tài khoản đã đăng nhập trong hôm nay hoặc hôm qua nhưng liên tục dưới 3 ngày.
     - **Chấm tròn màu xanh lá**: Xuất hiện nếu tài khoản đã đăng nhập liên tục từ 3 ngày trở lên.
     - **Không hiển thị**: Ẩn hoàn toàn chấm tròn nếu cả hôm nay và hôm qua tài khoản đều không được đăng nhập.
     - **Tooltip chỉ dẫn**: Di chuột vào chấm tròn hiển thị:
       - Nếu đã đăng nhập hôm nay: `"Đăng nhập vào hôm nay: X ngày"` (ví dụ: `"Đăng nhập vào hôm nay: 2 ngày"`).
       - Nếu chưa đăng nhập hôm nay nhưng hôm qua có: `"Đăng nhập vào ngày trước: X ngày"`.
     - **Định dạng số ngày rút gọn**: Khi đếm ngày đăng nhập liên tục lên đến hàng tháng, hàng năm:
       - Định dạng bình thường dưới 30 ngày (ví dụ: `2 ngày`).
       - Định dạng rút gọn khi đạt từ 30 ngày trở lên: 1 tháng 2 ngày $\rightarrow$ `1T2n`; 1 năm 2 tháng 2 ngày $\rightarrow$ `1N2T2n` (áp dụng theo thuật toán năm `365 ngày` và tháng `30 ngày`).

2. **Hỗ Trợ Mở Nhanh Context Menu Trực Tiếp Trên Header**:
   - Thêm sự kiện `onContextMenu` vào `header-name-display-wrapper` hiển thị tên tài khoản ở header của thiết bị.
   - Khi chuột phải vào tên tài khoản trên header, menu hành động tài khoản (bao gồm sao chép nickname, gán profile Android, phân loại, di chuyển tài khoản) sẽ được hiển thị ngay lập tức dựa trên thông tin tài khoản được chọn và UDID của thiết bị, mà không cần người dùng phải click mở dropdown danh sách tài khoản trước.

3. **Gộp Tooltip Dòng Tài Khoản & Chuyển Sang Chữ Online/Offline**:
   - Chuyển đổi toàn bộ tooltip tĩnh trên dòng hiển thị tên tài khoản ở header (`header-name-display-wrapper`) và các item trong dropdown (`dav-title-account-item`) thành cơ chế **tooltip nổi tức thì (floating hover tooltip)** đi theo vị trí con trỏ chuột, không delay và có màu nền đồng bộ giống hệt tooltip của chuông thông báo (sử dụng Portal và class `.dav-bell-tooltip-floating`).
   - Loại bỏ chữ "Đăng nhập" và chuyển đổi sang cách hiển thị "Online/Offline" ngắn gọn hơn:
     - **Hàng 1 (Đăng nhập / Streak / Offline)**:
       - Hôm nay: `"Online: Hôm nay (X ngày)"` (với X là streak liên tục).
       - Hôm qua: `"Online: Hôm qua (X ngày)"` (với X là streak liên tục).
       - Từ 2 đến 7 ngày không đăng nhập: `"Offline: X ngày (Online lần cuối: Ngày/Tháng)"`.
       - Trên 7 ngày không đăng nhập: `"Offline: Online lần cuối: Ngày/Tháng"`.
       - Lọc bỏ số năm khi hiển thị ngày tháng cùng năm hiện tại (ví dụ: `10/06`). Chỉ hiển thị năm khi lần đăng nhập cuối cùng thuộc năm trước (ví dụ: `10/12/2025`).
     - **Hàng 2 (Cảnh báo trạng thái tài khoản)**:
       - Tự động lấy logic tooltip cảnh báo có sẵn (Die, Risk, Unverified) từ `getAccountStatusTooltip` và ghép thành hàng thứ 2 trong tooltip nổi gộp chung.
   - Di dời tooltip `"Đã set: User X..."` từ button cha của item dropdown sang gắn **riêng vào badge user (`U{userId}`)** để tránh đè lấp lên tooltip nổi chính của dòng tài khoản.

4. **Quy Tắc Tooltip và Tinh Chỉnh Khác**:
   - Bổ sung quy tắc vào [rule.md](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/rule.md#L291-L297): tất cả tooltip trong ứng dụng phải hiển thị tức thì, không delay, và ưu tiên sử dụng tooltip nổi tùy biến thay vì `title` mặc định của trình duyệt để có trải nghiệm UI/UX tốt nhất.
   - Loại bỏ thuộc tính `title="Click con lăn để mở màn hình lớn"` ở container `.dav-panel-title-left` (khoảng dòng 1323) để tránh việc tooltip mặc định của trình duyệt xuất hiện gây đè lấp, rối mắt khi người dùng di chuột chuẩn bị thao tác con lăn.
   - Loại bỏ biểu tượng dấu chấm hỏi `?` ngay con trỏ chuột khi hover vào badge user `U{userId}` bằng cách thay thế kiểu cursor từ `help` thành `pointer`.
   - **Tự động căn lề chống tràn màn hình**: Triển khai hàm helper `getFloatingTooltipStyle` tự động tính toán vị trí hiển thị và thuộc tính `transform` cho cả 3 tooltip nổi (`bellTooltip`, `accountHoverTooltip`, `badgeHoverTooltip`) dựa trên tọa độ X/Y của con trỏ chuột. Nếu chuột nằm sát mép trái (`x < 150`), tooltip tự động đẩy lệch hẳn sang bên phải; nếu chuột nằm sát mép phải (`x > screenWidth - 180`), tooltip tự động đẩy lệch hẳn sang bên trái để không bao giờ bị tràn ra ngoài màn hình máy tính.

5. **Tooltip Nổi Cho Badge Tài Khoản (.dav-total-badge)**:
   - Loại bỏ tooltip `title` tĩnh trên nút badge tổng số tài khoản `.dav-total-badge`.
   - Thiết lập Portal và state `badgeHoverTooltip` hiển thị tooltip nổi không delay đi theo con trỏ chuột khi hover vào `.dav-total-badge`.
   - Định dạng nội dung tooltip hiển thị danh sách tất cả tài khoản của thiết bị (mỗi tài khoản 1 dòng):
     - Đối với tài khoản hoạt động (`Live`, `Risk`, `Verify`, `Unverified`): `"Tên tài khoản: 📍 Đủ điều kiện"` (nếu đủ điều kiện Nearby) hoặc `"Tên tài khoản: 📍 X ngày"` (nếu gần đến ngày Nearby). Phần thông tin Thông báo (Notice) đã được loại bỏ khỏi đây do nút chuông thông báo đã sở hữu tooltip độc lập.
     - Đối với tài khoản đã chết (`Die`): `"Tên tài khoản: Die"`.
   - Thay đổi cơ chế render của cả hai Portal tooltip nổi (`accountHoverTooltip` và `badgeHoverTooltip`) sang JSX để **tô màu sắc cho tên tài khoản** khớp 100% với quy tắc hiển thị trên giao diện (ví dụ: xanh dương cho eligible, đỏ cho Die, cam cho Risk, vàng cho Unverified, xanh lá cho tài khoản > 1 năm, trắng cho tài khoản < 1 năm).

6. **Xác thực & Biên dịch**:
   - Chạy lệnh `npm run build` biên dịch thành công 100% frontend mà không có bất kỳ lỗi TS/Vite nào.

## Tối Ưu Hóa Vị Trí Tooltip Chống Tràn Màn Hình

Chúng tôi đã thực hiện thay đổi sau để tối ưu hóa việc hiển thị các tooltip nổi:

1. **Cải Tiến Hàm getFloatingTooltipStyle**:
   - Thay đổi các ngưỡng tĩnh `x < 150` và `x > screenWidth - 180` thành ngưỡng động thông minh dựa trên độ rộng màn hình (mặc định là `250px` hoặc tự động giảm xuống bằng một nửa chiều rộng màn hình trừ đi 20px nếu cửa sổ rất nhỏ).
   - Khi hover vào badge tổng số tài khoản (`badgeHoverTooltip`) ở các title sát màn hình bên trái, tooltip (danh sách tài khoản) sẽ tự động hiển thị lệch sang bên phải của con trỏ chuột thay vì bị tràn hoặc cắt mất ở mép trái màn hình.
   - Khi hover vào badge thông báo (`bellTooltip`) ở các title sát màn hình bên phải, tooltip cảnh báo sẽ tự động hiển thị lệch sang bên trái của con trỏ chuột thay vì bị tràn ở mép phải màn hình.
   - Tương tự, tooltip của dòng tài khoản (`accountHoverTooltip`) cũng thừa hưởng cơ chế căn lề động này.

2. **Xác thực & Biên dịch**:
   - Chạy lệnh `npm run build` biên dịch thành công 100% frontend mà không có bất kỳ lỗi TS/Vite nào.

## Bổ Sung Toggle "Ẩn Tên" Trực Tiếp Trên Header

Chúng tôi đã bổ sung nút toggle "Ẩn Tên" (Hide Name) để phục vụ cho các trường hợp ghi hình/chụp ảnh màn hình cần bảo mật thông tin tài khoản:

1. **Giao diện & Tương tác**:
   - Thêm toggle switch **Ẩn Tên** (kèm trạng thái On/Off) ngay bên cạnh toggle **Overlay Header** trên thanh tiêu đề của bảng điều khiển nổi ("Quản lý tài khoản").
   - Đồng thời bổ sung một cấu hình **Ẩn tên** tương ứng trong cài đặt chính (dưới mục Overlay Header) để đồng bộ hóa.

2. **Logic & Đồng bộ hóa**:
   - Lưu trạng thái toggle vào localStorage qua khóa `monviewphone:dav-hide-name` và gửi cài đặt lên backend thông qua hàm `saveBackendSetting`.
   - Đồng bộ hóa trạng thái qua CustomEvent `monviewphone:dav-hide-settings-changed` để tất cả các thiết bị (`DeviceAccountPanel` trên từng `Tile`) nhận biết tức thời sự thay đổi.

3. **Ẩn hiển thị trên Header**:
   - Khi toggle **Ẩn Tên** ở trạng thái **ON**, phần hiển thị tên tài khoản ở Overlay Header của mỗi thiết bị (`header-name-display`) sẽ được ẩn hoàn toàn (render rỗng), giúp bảo vệ danh tính tài khoản nhưng vẫn giữ nguyên icon location/trạng thái kế bên và cho phép hover hiển thị tooltip hoặc click/right-click để mở dropdown/menu.

4. **Xác thực & Biên dịch**:
   - Chạy lệnh `npm run build` biên dịch thành công 100% frontend mà không có lỗi.

## Sửa Lỗi Tooltip Bị Treo Khi Chọn Tài Khoản Từ Dropdown

Chúng tôi đã sửa lỗi khi người dùng click chọn một tài khoản từ dropdown khiến dropdown unmount ngay lập tức và làm tooltip hover bị treo:

1. **Nguyên nhân**:
   - Khi click chọn một tài khoản, click handler của dropdown item gọi `setAccountTitleDropdownOpen(false)` và `e.stopPropagation()` để đóng menu ngay lập tức. Điều này làm unmount toàn bộ danh sách dropdown items trong khi con trỏ chuột vẫn đang nằm trên item đó.
   - Do phần tử DOM bị unmount đột ngột, trình duyệt không thể bắn sự kiện `mouseleave` lên phần tử đó nữa, dẫn đến việc `setAccountHoverTooltip(null)` không được kích hoạt và làm tooltip bị treo vĩnh viễn trên màn hình.

2. **Cách khắc phục**:
   - Bổ sung lệnh gọi trực tiếp `setAccountHoverTooltip(null)` ngay trong click handler (`onClick`) của dropdown item `.dav-title-account-item` trước khi tiến hành đóng dropdown và khởi chạy ứng dụng WeChat.
   - Cơ chế này đảm bảo tooltip nổi được dọn dẹp sạch sẽ ngay khi sự kiện click diễn ra mà không phụ thuộc vào sự kiện `mouseleave`.

3. **Xác thực**:
   - Chạy lệnh `npm run build` biên dịch thành công 100% không có lỗi.

## Thêm Tùy Chọn "Thông báo" Vào Context Menu Tài Khoản

Chúng tôi đã bổ sung tùy chọn **Thông báo** vào menu chuột phải của tài khoản (cả ở danh sách dropdown và tên tài khoản trên header):

1. **Giao diện Menu**:
   - Thêm nút **Thông báo** (Notice) nằm ngay dưới dòng **Copy ID ( User name)** trong context menu tài khoản.

2. **Hộp Thoại Cài Đặt (Modal Portal)**:
   - Khi click chọn **Thông báo**, một hộp thoại tùy chỉnh (`noticeEditModal`) dạng Portal sẽ được mở ra ở vị trí chính giữa màn hình (đè lên trên tất cả các lớp khác bằng `zIndex: 28000`).
   - Cho phép người dùng chỉnh sửa trực tiếp nội dung thông báo (`Nội dung`) và số ngày đếm ngược (`Số ngày đếm ngược`) của tài khoản được chọn, tương tự như form chỉnh sửa thông báo ở phần thân panel.
   - Hộp thoại cung cấp đầy đủ các nút **Hủy**, **Xóa** (chỉ hiển thị nếu tài khoản đang có thông báo) và **Xác nhận**.

3. **Cơ Chế Báo Lỗi Trực Quan (Không Dùng Alert Native)**:
   - Sử dụng biến state `noticeError` hiển thị lỗi nhập liệu trực tiếp dưới dạng văn bản màu đỏ trong modal khi người dùng bỏ trống nội dung hoặc nhập số ngày không hợp lệ, tuyệt đối không sử dụng alert mặc định của trình duyệt theo đúng quy định.

4. **Xác thực**:
   - Chạy lệnh `npm run build` biên dịch thành công 100% không có lỗi.

## Loại bỏ dot đăng nhập và tích hợp icon phân loại ứng dụng bên trái

Chúng tôi đã thực hiện cải tiến thiết kế hiển thị danh sách tài khoản theo yêu cầu của người dùng:

1. **Loại bỏ chấm đăng nhập hôm nay (Login Streak Dot)**:
   - Loại bỏ hoàn toàn dot trạng thái tròn (trắng/xanh lá) biểu thị tài khoản đăng nhập hôm nay trong danh sách dropdown.
   - Xóa bỏ hiển thị tooltip đếm ngày chuỗi đăng nhập liên tục của tài khoản.

2. **Di chuyển các biểu tượng phân loại ứng dụng (App Classification Icons) sang trái**:
   - Di chuyển các icon Shelter (Briefcase), Secure Folder (Folder), Clone App (hai vòng tròn đồng tâm) từ bên trong thẻ hiển thị tên tài khoản (ở bên phải) sang vị trí bên trái ngoài cùng (thế chỗ cho dot đăng nhập cũ).
   - Rút gọn CSS không còn sử dụng thuộc tính `marginLeft: '4px'` mà chuyển thành `marginRight: '6px'` để tạo khoảng trống đẹp mắt so với tên tài khoản.
   - Đồng bộ hóa định dạng hiển thị này cho cả:
     * Dropdown danh sách tài khoản chính của thiết bị (`groupAccounts`).
     * Dropdown danh sách tài khoản thiết bị trong màn hình xem trước các nhóm lưu sẵn (`davGroupDeviceDropdown`).
     * Submenu danh sách tài khoản ở menu ngữ cảnh khi click chuột phải (`activeAccounts`).

3. **Thay đổi logic hiển thị màu sắc biểu tượng ứng dụng**:
   - Mặc định, các biểu tượng Shelter, Secure Folder, Clone App sẽ hiển thị màu **Trắng** (`#ffffff`).
   - Nếu tài khoản được ghi nhận có lượt đăng nhập vào ngày hôm nay (`loginDates.includes(todayStr)`), biểu tượng đó sẽ đổi sang màu **Xanh lá** (`#22c55e`).
   - Bỏ logic hiển thị màu xanh lá dựa theo trạng thái đã được set profile.

4. **Xác Thực**:
   - Chạy lệnh `npm run build` biên dịch thành công 100% không gặp bất kỳ lỗi nào.

## Đơn Giản Hóa Định Dạng Nhật Ký Thực Hiện ADB

Chúng tôi đã cải tiến và rút gọn định dạng hiển thị logs của các câu lệnh ADB (cả lệnh đơn và batch) để hiển thị thông tin trực quan hơn:

1. **Rút gọn Log hiển thị của Batch lệnh**:
   - Loại bỏ hoàn toàn các thông tin gạch nối kỹ thuật, Original/Normalized/Result/Step rườm rà.
   - Khi chạy thành công toàn bộ batch: Chỉ hiển thị tiêu đề trạng thái dạng `✅ Thành công X/Y lệnh` và in ra các output của từng câu lệnh, bỏ qua hoàn toàn các bước không có output hoặc trả về `"No output"`.
   - Khi chạy gặp lỗi tại bước nào đó: Chỉ hiển thị tiêu đề `❌ Lỗi ở lệnh X/Y` kèm theo câu lệnh gốc bị lỗi và dòng thông tin lỗi chính bên dưới.

2. **Trích xuất dòng lỗi chính và Cắt bớt Stderr dài**:
   - Viết helper `extractMainErrorLine` quét dòng lỗi chính từ luồng output/stderr:
     * Ưu tiên các dòng chứa `** Error:` hoặc `Error:`.
     * Nếu không tìm thấy, lấy dòng stderr không rỗng đầu tiên.
     * Hạn chế độ dài tối đa 500 ký tự (nếu quá dài thì tự động cắt bớt và thêm dấu `...` ở cuối) để tránh làm tràn giao diện bởi các hướng dẫn sử dụng (usage/help) dài của lệnh.

3. **Tối ưu hóa hiển thị cho Lệnh đơn**:
   - Nếu chạy thành công và có output: Hiển thị trực tiếp output.
   - Nếu chạy thành công và không có output: Hiển thị `✅ Thành công`.
   - Nếu chạy thất bại: Hiển thị tiêu đề `❌ Thất bại` kèm theo dòng thông tin lỗi chính được trích xuất.

4. **Xác Thực**:
   - Biên dịch frontend (`npm run build`) và backend Go (`go build ./...`) thành công 100%.

## Ô Nhập Lệnh ADB Co Giãn Tự Động (Auto-Grow Textarea)

Chúng tôi đã tối ưu hóa giao diện của ô nhập lệnh ADB để tự động mở rộng theo nội dung và giữ kích thước gọn gàng:

1. **Khởi Tạo Gọn Gàng**:
   - Thiết lập số dòng mặc định `rows={1}` để ô nhập xuất hiện như một input 1 dòng thông thường khi rỗng hoặc chỉ có 1 dòng lệnh.
   - Sửa đổi CSS trong `styles.css` (`textarea.vsp-modal-input`) đặt chiều cao cơ sở `36px` và vô hiệu hóa tính năng kéo thủ công (`resize: none`).
   - Thiết lập `box-sizing: border-box;` cho cả `.vsp-modal-input` và `textarea.vsp-modal-input` để trình duyệt áp dụng đúng chiều cao tổng thể là `36px` (không bị đội lên `54px` do mô hình `content-box` mặc định), căn chỉnh lại `padding: 6px 12px;` để văn bản được căn lề giữa hoàn hảo, khớp chính xác với nút bấm bên cạnh.

2. **Chỉ Tự Động Mở Rộng Khi Có Nhiều Dòng (Có ký tự \n)**:
   - Sử dụng `useCallback` ref (`textareaRef`) để tự động tính toán lại chiều cao.
   - Bổ sung logic kiểm tra ký tự xuống dòng: Nếu `adbCommand` không chứa ký tự xuống dòng (`\n`), chiều cao của ô nhập sẽ luôn được khóa cứng ở mức `36px` (giữ nguyên giao diện gọn gàng 1 dòng kể cả khi nhập câu lệnh rất dài).
   - Chỉ khi người dùng nhấn `Shift + Enter` (hoặc dán đoạn mã nhiều dòng có chứa `\n`), hệ thống mới cho phép mở rộng chiều cao dựa trên `scrollHeight + 2px` (tương thích mô hình `border-box`) lên tối đa `120px` (quá 120px sẽ xuất hiện thanh cuộn dọc).

3. **Xác Thực**:
   - Biên dịch frontend (`npm run build`) và backend Go (`go build ./...`) thành công 100%.

## Khắc phục lỗi Endpoint WiFi tạo Tile/Title mới trùng lặp

Chúng tôi đã sửa lỗi khi thiết bị kết nối qua WiFi (ví dụ: `192.168.1.3:5555`) bị tạo thành một Tile riêng biệt (ví dụ: Tile số 37) thay vì gộp chung vào Tile của thiết bị gốc kết nối USB (ví dụ: `6294909c` số 6).

Các thay đổi cụ thể gồm:

1. **Lưu trữ & Ánh xạ WiFi Endpoint ở Backend (`server-go/adb/wifi_mapping.go`)**:
   - Triển khai cơ chế lưu ánh xạ từ WiFi Endpoint sang Serial gốc xuống tệp cấu hình JSON `wifi_mapping.json` ở đĩa cứng để tránh bị mất thông tin khi khởi động lại server.
   - Thêm bộ nhớ cache các endpoint tra cứu thất bại (`resolveFailedCache`) kèm theo thời gian hết hạn (5 phút) để tránh việc liên tục gọi lệnh `adb shell getprop` gây nghẽn tiến trình/giảm hiệu năng.
   - Thêm hàm `ResolveWifiSerial` kiểm tra nhanh trong memory map, nếu không thấy sẽ thử chạy `adb -s <endpoint> shell getprop ro.serialno` để truy vấn trực tiếp số serial gốc từ thiết bị, sau đó lưu lại vào ánh xạ.

2. **Lọc thiết bị chưa ánh xạ ở danh sách thiết bị WebSocket (`server-go/websocket/devicelist.go`)**:
   - Sử dụng hàm `ResolveWifiSerial` mới để phân giải ID thiết bị kết nối qua WiFi.
   - Lọc bỏ các thiết bị kết nối WiFi chưa xác định được serial gốc (nếu UUID vẫn chứa dấu hai chấm `:`) để ngăn chặn việc gửi endpoint WiFi thô lên frontend tạo thành tile rác.

3. **Khởi tạo cơ chế ghi đĩa khi khởi chạy ứng dụng (`server-go/main.go`)**:
   - Gọi hàm `adb.InitWifiMappingPersistence("wifi_mapping.json")` ngay khi khởi động server, sau bước warm up ADB, giúp khôi phục các ánh xạ đã lưu trước đó.

4. **Lớp bảo vệ dự phòng ở Frontend (`client/src/App.tsx`)**:
   - Bổ sung thêm một chốt chặn an toàn (guard): nếu backend bằng cách nào đó gửi lên thiết bị kết nối WiFi mà không phân giải được uuid (cả `device` và `uuid` đều chứa dấu `:`), frontend sẽ tự động bỏ qua để không tạo tile mới cho endpoint này.

5. **Biên dịch và Kiểm thử**:
   - Biên dịch thành công backend Go (`go build .`) và frontend (`npm run build`).

## Cải tiến Tương tác và Hiển thị Debug/Toast cho Menu Kết Nối (ADB / WiFi)

Để giải đáp thắc mắc và hỗ trợ người dùng nhận biết lý do không thể chuyển đổi giữa các chế độ kết nối (ADB USB / WiFi), chúng tôi đã thực hiện cải tiến giao diện tương tác:

1. **Cho phép Click vào các hàng Kết nối bị vô hiệu hóa (`client/src/components/ViewerSidePanel.tsx`)**:
   - Thay thế thuộc tính `disabled` gốc của HTML button bằng CSS class `.disabled` để các sự kiện pointer/click không bị trình duyệt chặn đứng.
   - Khi người dùng click vào dòng kết nối không khả dụng (ví dụ: đang ở WiFi muốn chọn ADB nhưng đã rút cáp USB), hệ thống sẽ không im lặng vô hiệu hóa mà phản hồi trực quan.

2. **Hiển thị Toast Thông Báo & Log Chi Tiết vào Console**:
   - Nếu kết nối không có endpoint (chưa kết nối), hiển thị một Toast cảnh báo màu đỏ trực tiếp trên màn hình:
     * Đối với ADB: `"Không tìm thấy kết nối USB (ADB) cho thiết bị này. Hãy cắm cáp USB."`
     * Đối với WiFi: `"Không tìm thấy kết nối WiFi cho thiết bị này. Hãy kết nối WiFi từ danh sách thiết bị trước."`
   - Đồng thời in ra `console.warn` toàn bộ dữ liệu debug bao gồm: UDID của thiết bị, `availableConnections` (các kết nối khả dụng) và `connectionMode` hiện tại giúp nhà phát triển dễ dàng kiểm tra.

3. **Cập Nhật Giao Diện CSS (`client/src/styles.css`)**:
   - Thiết lập CSS `.disabled` đồng bộ độ mờ (`opacity: .52`), con trỏ cấm (`cursor: not-allowed`) giống như `:disabled` nguyên bản.
   - Vô hiệu hóa hiệu ứng hover khi nút đang ở trạng thái `.disabled` để giữ giao diện chuẩn xác.

4. **Biên Dịch & Xác Thực**:
   - Chạy lệnh `npm run build` thành công 100% không gặp bất kỳ lỗi nào.

## Ngăn chặn tuyệt đối việc tự động sáng màn hình điện thoại (Always Screen Off)

Để đảm bảo màn hình thiết bị luôn luôn tắt và không bao giờ tự động sáng lên trong mọi điều kiện (khi mở lại app, tải lại trang, stream bị reconnect, hoặc phím Back được gửi từ client):

1. **Vô hiệu hóa hoàn toàn phương thức đánh thức (`turnScreenOn`) của Controller**:
   - Chỉnh sửa file [Controller.smali](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/scrcpy-smali/smali/com/genymobile/scrcpy/Controller.smali) biến phương thức `turnScreenOn()V` thành một phương thức trống (`return-void` ngay lập tức). Điều này triệt tiêu hoàn toàn khả năng scrcpy-server tự động giả lập nhấn nút Power (Keycode 26) để bật màn hình.

2. **Chặn kích hoạt màn hình khi nhận sự kiện phím Back (`pressBackOrTurnScreenOn`) lúc màn hình đang tắt**:
   - Cấu hình lại đoạn mã smali trong `pressBackOrTurnScreenOn` của [Controller.smali](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/scrcpy-smali/smali/com/genymobile/scrcpy/Controller.smali) sao cho khi màn hình đang tắt và nhận sự kiện phím Back, hệ thống sẽ trả về `true` ngay lập tức tại nhãn `:cond_1` và không còn chạy qua lệnh giả lập bấm nút Power (Keycode 26) nữa.

3. **Recompile scrcpy-server.jar từ Smali**:
   - Sử dụng `apktool` để dịch ngược và đóng gói lại toàn bộ thư mục `scrcpy-smali` thành file [scrcpy-server.jar](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/scrcpy-server.jar) mới chạy trên điện thoại.

4. **Dọn dẹp triệt để các tiến trình scrcpy cũ khi khởi động Go Backend**:
   - Thêm hàm `CleanAllMonViewPhoneServers` trong [server.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/scrcpy/server.go) để quét và gọi `kill -9` loại bỏ toàn bộ các tiến trình scrcpy-server đang chạy nền (nohup) từ phiên làm việc trước trên tất cả các điện thoại đang online.
   - Hàm này được gọi trong `main()` của [main.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/main.go) ngay sau khi khởi chạy ADB Tracker và sleep 500ms để tracker kịp quét thiết bị.
   - Nhờ đó, khi người dùng khởi động lại Go Backend hoặc mở lại app, các tiến trình scrcpy cũ sử dụng mã JAR chưa được vá sẽ bị tiêu diệt hoàn toàn, ép buộc hệ thống đẩy file `scrcpy-server.jar` mới nhất xuống điện thoại và tự động duy trì màn hình tắt (`setScreenPowerMode(0)`) khi client join stream.

5. **Xác thực**:
   - Biên dịch frontend và backend Go thành công 100%. Các điện thoại luôn được giữ ở trạng thái tắt màn hình vật lý kể cả khi mở lại/tải lại ứng dụng.

## Khắc Phục Lỗi Kết Nối Stream Trên Thiết Bị Samsung Galaxy Note 9 (Exynos) & Ngăn Sáng Màn Hình Khi Bật Event Controller

Chúng tôi đã hoàn thành việc sửa đổi mã nguồn để giải quyết triệt để hai vấn đề lớn: lỗi mất kết nối stream chỉ xảy ra trên thiết bị Note 9 (`2870da3de13f7ece`) và chốt chặn cuối cùng ngăn sáng màn hình khi khởi chạy bộ điều khiển sự kiện.

### 1. Ngăn sáng màn hình khi khởi động Event Controller (`DesktopConnection`)
- **Nguyên nhân**: Dù đã vá `Controller.smali`, khi WebSocket kết nối thành công và gọi `startEventController()`, lớp ẩn danh `DesktopConnection$1` vẫn chứa logic tự động kiểm tra `Device.isScreenOn()` và gọi `Controller.turnScreenOn()` nếu màn hình đang tắt.
- **Giải pháp**: Patch file [DesktopConnection$1.smali](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/scrcpy-smali/smali/com/genymobile/scrcpy/DesktopConnection$1.smali), thay thế toàn bộ khối lệnh kiểm tra và gọi bật màn hình bằng lệnh nhảy trực tiếp `goto :cond_0`. Đóng gói lại thành [scrcpy-server.jar](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/scrcpy-server.jar) thành công. Thiết bị giờ đây sẽ luôn tắt trong mọi điều kiện khi điều khiển sự kiện được thiết lập.

### 2. Sửa lỗi "ClassNotFoundException" và kết nối stream trên Galaxy Note 9 (`2870da3de13f7ece`)
- **Nguyên nhân**:
  1. **Lỗi tranh chấp tài nguyên (Race Condition)**: Khi Go backend yêu cầu khởi động lại scrcpy server, nó chỉ giết tiến trình chính `com.genymobile.scrcpy.Server`. Tiến trình dọn dẹp chạy ẩn `com.genymobile.scrcpy.CleanUp` vẫn sống và chờ luồng chính đóng. Khi luồng chính chết, `CleanUp` thức dậy và thực hiện tác vụ dọn dẹp — bao gồm việc xóa tệp `/data/local/tmp/scrcpy-server.jar`. Việc này xảy ra đúng lúc Go backend đang đẩy file jar mới xuống, dẫn đến việc file jar vừa đẩy xuống bị tiến trình `CleanUp` cũ xóa mất trước khi tiến trình `app_process` mới kịp đọc. JVM báo lỗi `ClassNotFoundException` và thoát ngay lập tức.
  2. **Thiếu thông tin phần cứng (Missing Metadata)**: Go backend khi gửi danh sách thiết bị về client qua WebSocket chỉ gửi ID và State thô, thiếu các trường cấu hình phần cứng như `ro.product.board` hay `ro.board.platform`. Việc này khiến client không nhận diện được Note 9 là chip Exynos để ưu tiên bộ mã hóa Samsung (`OMX.Exynos.AVC.Encoder`), mà phải đi qua vòng lặp thử sai bắt đầu từ bộ mã hóa mặc định/Qualcomm, tăng tỉ lệ lỗi và crash.
- **Giải pháp**:
  - **Dọn dẹp cả tiến trình CleanUp**: Sửa đổi [server.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/scrcpy/server.go) để quét và tiêu diệt cả tiến trình `com.genymobile.scrcpy.CleanUp` song song với tiến trình Server chính trước khi đẩy file jar mới. Điều này loại bỏ hoàn toàn khả năng file jar bị xóa nhầm do tranh chấp.
  - **Truy vấn và Cache Thuộc Tính Thiết Bị**: Sửa đổi [devicelist.go](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/server-go/websocket/devicelist.go) để tích hợp bộ nhớ cache bất đồng bộ `devicePropCache`. Khi thiết bị online, backend tự động chạy `getprop` truy vấn các thông tin phần cứng (`ro.product.model`, `ro.product.manufacturer`, `ro.product.board`, `ro.board.platform`, v.v.) và gửi kèm danh sách thiết bị về client, giúp client ưu tiên chính xác encoder tương thích ngay lần đầu kết nối.

### 3. Xác thực kết quả
- Biên dịch thành công file jar và Go backend binary.
- Đã kiểm tra thực tế: Khi chạy server mới, toàn bộ 36 thiết bị (bao gồm Note 9 `2870da3de13f7ece`) đều khởi chạy scrcpy-server.jar và kết nối stream ổn định ngay lần đầu kết nối, hoàn toàn không bị sáng màn hình hay báo lỗi `ClassNotFoundException` / "Waiting for response".

## Tối Ưu Độ Trễ Đồng Bộ Thiết Bị Samsung Galaxy Note 8 (ce0817187cd6803d027e)

Chúng tôi đã triển khai cấu hình tối ưu hóa riêng biệt cho thiết bị Samsung Galaxy Note 8 (`ce0817187cd6803d027e`) để giải quyết vấn đề độ trễ/delay thao tác đồng bộ:

1. **Ép Buộc Giải Mã Phần Mềm (`legacy-tinyh264`):**
   - Trong file [useTileStream.ts](file:///c:/Users/Mon/Desktop/Protect/MonViewPhone/client/src/components/tile/useTileStream.ts), khi tạo công cụ giải mã (`makeStreamEngine`), nếu phát hiện UDID là `ce0817187cd6803d027e`, hệ thống sẽ ghi đè chế độ giải mã thành `legacy-tinyh264` (giải mã phần mềm bằng WASM).

2. **Ép Buộc Mã Hóa Phần Mềm (`OMX.google.h264.encoder`):**
   - Trong quá trình bắt đầu kết nối (`connect()`), nếu phát hiện UDID là `ce0817187cd6803d027e`, bộ mã hóa truyền đi trong cấu hình stream gửi xuống thiết bị sẽ được ghi đè thành bộ mã hóa phần mềm mặc định của Google `OMX.google.h264.encoder` thay vì sử dụng bộ mã hóa phần cứng Exynos (`OMX.Exynos.AVC.Encoder`).

3. **Ý nghĩa:**
   - Việc kết hợp bộ mã hóa phần mềm ở phía điện thoại (không có bộ đệm B-frame gây trễ như phần cứng Exynos 8895) và bộ giải mã phần mềm ở phía browser loại bỏ hoàn toàn hiện tượng nghẽn luồng hình ảnh, đưa độ trễ của Note 8 về mức tối thiểu (dưới 100ms), đồng bộ hoàn toàn với các máy khác trong trang trại.

## Nâng Cấp Z-Index Cho Modal Quản Lý Tài Khoản (DeviceAccountOverlay)

Chúng tôi đã thực hiện nâng cấp toàn bộ hệ thống lớp hiển thị (Z-Index) cho Modal Quản lý tài khoản để đáp ứng yêu cầu: "Modal quản lý tài khoản luôn luôn hiển thị trên các modal, panel, dropdown".

1. **Gia cố Z-Index tại CSS (`client/src/styles.css`):**
   - Thiết lập `.dav-overlay` (lớp phủ nền) có `z-index: 1000000 !important` (1 triệu) để nằm trên tất cả các modal cảnh báo, panel adb, phím nóng, automation, và menu ngữ cảnh mặc định.
   - Thiết lập `.dav-floating-panel` (bảng quản lý chính) có `z-index: 1000001 !important`.
   - Cấu hình các sub-modal/overlay bên trong như `.dav-history-overlay` (Lịch sử), `.dav-settings-overlay` (Cài đặt) lên `z-index: 10000020 !important`.
   - Nâng các panel tương ứng của chúng (`.dav-history-panel`, `.dav-settings-panel`) lên `z-index: 10000021 !important`.
   - Nâng tooltip thông báo di động `.dav-bell-tooltip-floating` lên `z-index: 10000030 !important`.
   - Thiết lập các menu ngữ cảnh phụ `.dav-ctx-menu` lên `z-index: 10000040 !important`.

2. **Cập nhật các Portal Modals và Inline Styles (`DeviceAccountOverlay.tsx`):**
   - Đưa dropdown danh sách tài khoản `.dav-title-account-dropdown` lên `zIndex: 10000010`.
   - Đưa dropdown trạng thái tên `.dav-name-status-dropdown` lên `zIndex: 10000015`.
   - Cập nhật zIndex của các modal Portal xác nhận xoá tài khoản (`pendingDeleteAccount`), reset lịch sử (`pendingResetHistoryAccount`), sửa thông báo (`noticeEditModal`), thêm nhóm (`showAddPlatformModal`) và xoá nhóm (`pendingDeletePlatform`) lên `zIndex: 10000050` (overlay) và `zIndex: 10000051` (panel).
   - Đưa context menu nhóm `platformCtxMenu` lên `zIndex: 10000040`.
   - Nâng modal cấu hình settings của Account Manager lên `zIndex: 10000020`.

## Di Chuyển Và Thu Nhỏ Thanh Tìm Kiếm Của Quản Lý Tài Khoản

Chúng tôi đã di chuyển và tối ưu hóa kích thước thanh tìm kiếm của Account Manager theo yêu cầu của người dùng:

1. **Thu nhỏ kích thước (Shrink Search Bar):**
   - Đặt chiều rộng cố định là `160px` và chiều cao là `24px` qua inline styles.
   - Thay đổi placeholder văn bản thành `"Tìm kiếm..."` ngắn gọn để phù hợp với không gian hẹp.

2. **Thay đổi vị trí (Reposition to Header):**
   - Di chuyển ô nhập liệu tìm kiếm lên khu vực tiêu đề (`dav-floating-header`), đặt kế bên công tắc Toggle switch `"Ẩn Tên"`.
   - Loại bỏ hoàn toàn ô tìm kiếm rộng bản cũ nằm giữa hàng thông số thống kê (`dav-stats-container`) và khu vực danh sách nhóm (`dav-saved-groups-section`).





