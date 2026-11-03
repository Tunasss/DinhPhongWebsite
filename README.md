# Đình Phong Apple — Hệ thống Quản lý Kho MacBook & iPad (Google Sheets + Drive + Gemini AI)

Website quản lý nội bộ chuyên biệt cho cửa hàng kinh doanh **MacBook & iPad**, tối ưu cho cả **Điện thoại (iPhone/Android)** và **Máy tính**.

## Tính năng nổi bật

1. **Đọc Mã Serial & Cấu hình tự động từ Ảnh chụp (Gemini Vision AI)**:
   - Chụp hoặc tải ảnh màn hình `About This Mac`, `Giới thiệu iPad`, hoặc tem Serial trên máy.
   - AI tự động bóc tách: **Mã Serial**, **Loại máy** (`MacBook Air`, `MacBook Pro`, `iPad Pro`, `iPad Air`, `iPad Gen`, `iPad Mini`), **Dòng Chip** (`M1`, `M1 Pro/Max`, `M2`, `M2 Pro/Max`, `M3`, `M3 Pro/Max`, `M4`, `A-Series`, `Intel`), **RAM**, **SSD**, **Kích thước màn hình**, **Màu sắc**, **Tình trạng Pin**.
   - Cho phép nhân viên kiểm tra và chỉnh sửa lại trước khi lưu.

2. **Tự động tạo Folder con theo Serial trong Google Drive Tổng**:
   - Khi lưu máy, hệ thống tự động tạo thư mục con theo cấu trúc:
     `Folder Drive Tổng / [Loại máy] / [SERIAL - Tên máy]` (hoặc trực tiếp `Folder Drive Tổng / [SERIAL - Tên máy]`).
   - Toàn bộ ảnh ngoại hình và ảnh thông tin máy được tự động đặt tên theo mã Serial (`C02F94X8Q6L4_1.jpg`, `C02F94X8Q6L4_2.jpg`...) và tải vào đúng thư mục con đó.

3. **Tải ảnh về Điện thoại siêu tốc (1 chạm)**:
   - Tích hợp **Web Share API (Files)** cho iPhone (iOS Safari) và Android: bấm nút **"Tải X ảnh"** sẽ mở menu hệ thống của điện thoại, chọn **"Lưu X hình ảnh" (Save X Images)** là toàn bộ ảnh máy lưu thẳng vào Album Ảnh của điện thoại (không cần giải nén ZIP hay mở từng ảnh trong Google Drive).
   - Nút **"Copy báo khách"** giúp copy ngay cấu hình + tình trạng ngoại hình + giá bán để dán vào Zalo/Messenger gửi khách.

4. **Quản lý đầy đủ Nhân sự & Giá tiền + Ngoại hình phân biệt**:
   - Quản lý 4 vai trò nhân sự trên từng máy: **Người lấy**, **Người kiếm**, **Người bán**, **Người giao**.
   - Quản lý **Giá nhập (Giá vốn)** (có nút ẩn/hiện nhanh trên thanh điều hướng), **Giá bán**, tự động tính lợi nhuận dự kiến.
   - Ô **Mô tả ngắn tình trạng ngoại hình** nổi bật trên thẻ giúp phân biệt dễ dàng các máy có cùng cấu hình.

5. **Phân loại trực quan như Website bán hàng**:
   - Lọc theo dòng máy: `MacBook Air`, `MacBook Pro`, `iPad Pro`, `iPad Air`, `iPad Gen`, `iPad Mini`.
   - Lọc theo dòng Chip: `M1`, `M2`, `M3`, `M4`, `A-Series`, `Intel`.
   - Lọc theo Trạng thái (`Sẵn hàng`, `Đã cọc`, `Đã bán`) và theo **Nhân sự phụ trách**.

## Hướng dẫn Deploy lên GitHub & Vercel (Miễn phí 100%)

### 1. Đẩy mã nguồn lên GitHub
Dự án đã được cấu hình bảo mật:
- Toàn bộ mật khẩu tài khoản khởi tạo được lưu dưới dạng **mã băm mật mã học một chiều SHA-256 (có Salt)**. Tuyệt đối không có mật khẩu thô trong mã nguồn.
- Thư mục `.gitignore` đã loại trừ `node_modules`, `dist`, và thư mục dữ liệu cá nhân `DinhPhongData/`.

Các lệnh đẩy code lên GitHub:
```bash
git init
git add .
git commit -m "feat: Dinh Phong Apple Inventory - Vercel Ready"
git branch -M main
git remote add origin https://github.com/<tai-khoan-github-cua-ban>/<ten-repo>.git
git push -u origin main
```

### 2. Triển khai (Deploy) lên Vercel
1. Đăng nhập vào [Vercel](https://vercel.com) bằng tài khoản GitHub.
2. Bấm **"Add New..." -> "Project"** và chọn repository vừa đẩy lên.
3. Vercel sẽ tự động nhận diện Vite project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Bấm **Deploy**. Trong vòng 1 phút, trang web sẽ có tên miền trực tuyến miễn phí (dạng `dinhphong-apple.vercel.app` có chứng chỉ bảo mật HTTPS).

> [!NOTE]
> File [vercel.json](file:///d:/DinhPhongWebsite/vercel.json) và Serverless Proxy [api/gas-proxy.ts](file:///d:/DinhPhongWebsite/api/gas-proxy.ts) đã được cấu hình sẵn để tránh lỗi 404 khi tải lại trang SPA và giải quyết triệt để lỗi chặn CORS khi gọi Google Apps Script.

```bash
npm install
npm run dev
```

## Cách kết nối Google Sheets & Google Drive (Miễn phí)

1. Mở file [google-apps-script/Code.gs](file:///d:/DinhPhongWebsite/google-apps-script/Code.gs).
2. Tạo một file **Google Sheets** mới trên tài khoản Google của shop, vào menu **Tiện ích mở rộng (Extensions) -> Apps Script** và dán toàn bộ nội dung `Code.gs` vào.
3. Bấm **Triển khai (Deploy) -> Tạo bản triển khai mới (New deployment)**, chọn **Ứng dụng Web (Web App)**, quyền truy cập **Bất kỳ ai (Anyone)**.
4. Mở Website, bấm nút **"Cấu hình Drive & AI"** ở góc trên bên phải và dán:
   - **URL Google Apps Script Web App**
   - **ID Folder Google Drive Tổng**
   - **Gemini API Key** (lấy tại `aistudio.google.com`)
