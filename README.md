# NgaOS — Kế Hoạch Học Tập & Quản Lý Tài Chính Cá Nhân

> Không gian số thanh lịch, tối giản và thực tế dành riêng cho việc lập kế hoạch học tập theo nhịp sinh học và theo dõi chi tiêu tuần.

---

## 🌟 Tổng quan phiên bản MVP Thực Tế

Ứng dụng được thiết kế lại hoàn toàn theo tinh thần **"Thực tế, không ảo"**:
- **Loại bỏ**: Các thành phần giả lập rườm rà (canvas cá voi nặng nề, âm thanh dao động 432Hz chói tai, chatbot kịch bản ảo).
- **Tập trung vào giá trị cốt lõi**:
  1. **Lịch trình học tập & sinh hoạt theo 3 buổi** (Sáng - Chiều - Tối) với tiến độ hoàn thành trực quan.
  2. **Quản lý thu chi & ngân sách tuần** với hệ thống cảnh báo bội chi và mục tiêu tích lũy cuối năm.
  3. **Lưu trữ dữ liệu bền vững** qua `localStorage`, hỗ trợ sao lưu (Export) và phục hồi (Import) file JSON an toàn.

---

## 🚀 Các Chức Năng Cốt Lõi

### 1. 📅 Lịch Trình Học Tập (Schedule & Tasks)
- **3 Ca trong ngày**:
  - 🌅 **Buổi Sáng** (06:00 — 11:30): Khởi đầu nhẹ nhàng & tập trung cao.
  - ☀️ **Buổi Chiều** (12:00 — 17:30): Nạp năng lượng, đề án & vận động.
  - 🌙 **Buổi Tối** (18:00 — 23:00): Ôn bài, thư giãn & ngủ ngon.
- **Thao tác nhanh**: Thêm việc mới, tick chọn hoàn thành (kèm âm thanh chime nhẹ nhàng), xóa việc.
- **Thanh đo tiến độ hôm nay**: Tự động tính toán % công việc đã xong trong ngày (VD: `5/8 việc (63%)`).
- **3 Mẫu lịch dựng sẵn (Presets)**:
  - 🏫 *Ngày Học Trên Trường*: Lịch học giảng đường, thư viện, ôn bài.
  - 💻 *Ngày Tự Học & Đề Án*: Khối giờ tập trung sâu (Deep Work), làm báo cáo/đề án.
  - 🌿 *Cuối Tuần Hồi Phục*: Dọn dẹp, tổng kết tuần, thư giãn.

### 2. 💰 Quản Lý Tài Chính & Sổ Tay Chi Tiêu (Finance & Budget)
- **Hạn Mức Tuần (Weekly Budget)**:
  - Tự động nhận diện tuần hiện tại trong năm (VD: `Tuần 42 / 52 Tuần (Năm 2026)`).
  - Tính toán số tiền còn lại được chi tiêu, thanh đo ngân sách đổi màu theo mức độ (Xanh: An toàn, Vàng: Cần chú ý, Đỏ: Bội chi).
  - Tùy chỉnh hạn mức tuần bất cứ lúc nào.
- **Sổ Tay Thu / Chi (Cashflow Ledger)**:
  - Nhập khoản chi (-) hoặc khoản thu (+) tức thì.
  - Phân loại danh mục: Ăn uống & Cafe, Học tập & Sách, Mua sắm, Di chuyển, Sức khỏe...
  - Xem danh sách giao dịch gần nhất, xóa giao dịch ghi nhầm hoặc làm mới tuần.
- **Mục Tiêu Tích Lũy Cuối Năm (Savings Goal)**:
  - Đặt mục tiêu tích lũy (mặc định 25.000.000 đ).
  - Tự động tính số tuần còn lại trong năm và số tiền cần tích lũy trung bình mỗi tuần.
  - Nút nạp nhanh (+200k, +500k, +1.000k) cập nhật tiến độ ngay lập tức.

### 3. 💾 Quản Lý Dữ Liệu An Toàn (Persistence Engine)
- Toàn bộ dữ liệu được lưu tức thì vào `localStorage`, không lo mất khi tải lại trang.
- **Sao Lưu (Export)**: Tải file `ngaos_backup_YYYY-MM-DD.json` về máy.
- **Khôi Phục (Import)**: Nạp file JSON sao lưu để chuyển dữ liệu sang thiết bị khác hoặc khi đổi máy.
- **Dữ Liệu Mẫu (Reset Demo)**: Đặt lại dữ liệu mẫu chuẩn chỉ với 1 click.

---

## 📂 Cấu Trúc Thư Mục

```
D:\QL_Ngaan\
├── index.html          # Trang ứng dụng duy nhất, chuẩn HTML5 Semantic
├── css\
│   ├── style.css       # Giao diện tươi sáng (Apple Calendar / Notion Light), Toast, Modals
│   └── responsive.css  # Tối ưu hiển thị cho cả Điện thoại và Máy tính
├── js\
│   ├── storage.js      # Module quản lý State, LocalStorage, Presets, Export/Import
│   ├── schedule.js     # Module quản lý Lịch trình 3 buổi, Tasks và Tiến độ
│   ├── finance.js      # Module quản lý Hạn mức tuần, Sổ thu chi và Mục tiêu tích lũy
│   └── app.js          # Controller điều phối: Tabs, Ngày giờ, Toast, Âm thanh phản hồi
├── _legacy\            # Nơi lưu trữ các file cũ/ảo (canvas cá voi, âm thanh cũ) để dự phòng
└── README.md           # Tài liệu hướng dẫn
```

---

## 🛠️ Hướng Dẫn Sử Dụng

1. Mở trực tiếp file `index.html` bằng bất kỳ trình duyệt hiện đại nào (Chrome, Edge, Safari, Firefox).
2. Hoặc mở qua VS Code Extension `Live Server` nếu muốn chạy qua local server.
3. Ứng dụng chạy hoàn toàn ở phía client (Static Web App), tốc độ mở trang tức thì và hoạt động mượt mà cả khi offline.
