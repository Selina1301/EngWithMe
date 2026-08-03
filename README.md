EngWithMe/
|
├── fe/                                    # KIẾN TRÚC FRONTEND (Giao Diện Glassmorphic Tốc Độ Cao)
│   ├── css/                               # Bộ Thiết Kế Giao Diện Vanilla CSS Độc Quyền
│   │   ├── base/ & base.css               # Biến Màu CSS (Design Tokens), Khởi Tạo & Chế Độ Dark Mode
│   │   ├── components/                    # CSS Cho Các Thành Phần UI (Nút Bấm, Thẻ, Phù Hiệu, Modal)
│   │   ├── pages/                         # CSS Riêng Cho Chi Tiết Trang (admin.css, profile.css, v.v.)
│   │   └── responsive/                    # Tương Thích Giao Diện Cho Mobile, Tablet & Desktop
│   ├── js/                                # Động Cơ Logic JavaScript Phía Client (ES6+ Modular)
│   │   ├── admin.js                       # Không Gian Quản Trị Admin & Xử Lý Thời Gian Thực
│   │   ├── api.js                         # HTTP Client Trung Tâm Tự Động Gắn Bearer Token JWT
│   │   ├── auth.js                        # Quản Lý Trạng Thái Đăng Nhập Client & LocalStorage
│   │   ├── blog.js                        # Động Cơ Tương Tác & Hiển Thị Blog Cộng Đồng
│   │   ├── core.js                        # Khởi Tạo Ứng Dụng Core, Thông Báo Toast & Popup Modal
│   │   ├── level-system.js                # Công Thức Điểm XP, Cấp Độ Level, Danh Hiệu & Đồng Bộ Server
│   │   ├── listening-lab.js               # Trình Phát Audio & Phòng Luyện Nghe TOEIC Listening
│   │   ├── pricing.js                     # Nâng Cấp VIP, Modal VietQR & Tự Động Kiểm Tra Thanh Toán
│   │   ├── profile.js                     # Hồ Sơ Học Viên, Thống Kê & Cài Đặt Bảo Mật
│   │   ├── reading.js                     # Động Cơ Luyện Bài Đọc TOEIC Reading
│   │   ├── vocabulary-study.js            # Động Cơ Học Từ Vựng 4 Chế Độ (Flashcard, Quiz, Match, Dictation)
│   │   ├── grammar.js                     # Động Cơ Luyện Bài Tập Ngữ Pháp
│   │   ├── rank.js                        # Bảng Xếp Hạng Bảng Vàng Học Viên toàn cầu
│   │   └── data fallbacks/                # Bộ Dữ Liệu TOEIC Tĩnh & Dự Phòng Offline
│   ├── components/                        # Tệp HTML Header/Footer Nhúng Tự Động
│   ├── assets/ & audio/                   # Phát Âm Từ Vựng Tĩnh, Hình Ảnh & Đồ Họa
│   ├── 24 Trang File HTML:
│   │   ├── index.html                     # Trang Chủ Landing Page
│   │   ├── login.html, register.html      # Không Gian Đăng Nhập & Đăng Ký
│   │   ├── verify.html, forgot-password.html # Xác Thực Mã OTP Gmail & Khôi Phục Mật Khẩu
│   │   ├── dashboard.html, profile.html   # Bảng Điều Khiển Học Viên & Hồ Sơ Cá Nhân
│   │   ├── admin.html                     # Bảng Điều Khiển Quản Trị Viên Doanh Nghiệp
│   │   ├── vocabulary-study.html          # Không Gian Học Từ Vựng Tương Tác
│   │   ├── listening.html, reading.html   # Phòng Luyện Kỹ Năng Nghe & Đọc TOEIC
│   │   ├── quiz.html, exam-practice.html  # Động Cơ Mô Phỏng Đề Thi TOEIC Đầy Đủ
│   │   ├── pricing.html                   # Không Gian Thanh Toán VIP Pro & Premium
│   │   ├── blog.html, rank.html           # Blog Cộng Đồng & Bảng Vàng Xếp Hạng
│   │   └── about.html, lessons.html       # Thông Tin Giới Thiệu & Danh Sách Bài Học Tĩnh
│   └── .vercel/                           # Cấu Hình Triển Khai Hạ Tầng Vercel CDN
|
|
├── be/                                    # HỆ THỐNG BACKEND (Serverless Edge & Dịch Vụ Phụ Trợ)
│   ├── worker-hono/                       # Động Cơ API Edge Cốt Lõi (Cloudflare Workers + Hono.js)
│   │   ├── src/
│   │   │   ├── index.ts                   # Định Tuyến Trung Tâm, Middleware CORS & Chuyển Tiếp Tương Thích
│   │   │   └── routes/                    # Các Mô-đun Micro-service Con
│   │   │       ├── admin.ts               # Bảng Điều Khiển Admin, Quản Lý User & Động Cơ Xóa Dây Chuyền
│   │   │       ├── auth.ts                # Xác Thực Email/Mật Khẩu, Google OAuth 2.0, Gửi OTP Gmail
│   │   │       ├── blog.ts                # Blog Cộng Đồng, Thả Tim, Lượt Xem & Quy Trình Duyệt Bài
│   │   │       ├── learning.ts            # Từ Vựng, Ngữ Pháp, Tiến Trình & Đồng Bộ Level
│   │   │       ├── notification.ts        # Thông Báo Hệ Thống & Phát Tin Broadcast Từ Admin
│   │   │       ├── payment.ts             # Tạo Mã VietQR Thanh Toán, Đơn Hàng & Nâng Cấp VIP
│   │   │       ├── quiz.ts                # Ngân Hàng Đề Thi TOEIC, Chấm Điểm Auto & Lưu Kết Quả
│   │   │       └── user.ts                # Hồ Sơ Cá Nhân, Đổi Mật Khẩu & Thống Kê Học Viên
│   │   ├── schema.sql                     # Cấu Trúc CSDL Quan Hệ Cloudflare D1 (SQLite at Edge)
│   │   ├── wrangler.toml                  # File Cấu Hình Cloudflare Worker & Liên Kết CSDL D1
│   │   ├── package.json                   # Thư Viện Backend Edge (Hono ^4.0, v.v.)
│   │   └── tsconfig.json                  # Cấu Hình Biên Dịch TypeScript
│   ├── tools/                             # Kịch Bản Tự Động Hóa (Tạo Audio TTS)
│   │   └── generate_toeic_2017_audio.js   # Pipeline Chuyển Văn Bản Thành Giọng Nói Edge-TTS Luyện Nghe TOEIC
│   ├── database/                          # File Migration SQL Cũ & Bản Sao Lưu CSDL
│   ├── uploads/                           # Thư Mục Tải Lên Tệp Tĩnh & Avatar Nổi
│   └── package.json                       # Thư Viện Backend & Lệnh Chạy Scripts│
├── docs/                                  # TÀI LIỆU KỸ THUẬT & THIẾT KẾ HỆ THỐNG
│   ├── system-architecture.md             # Bản Thiết Kế Kiến Trúc & Thông Số Kỹ Thuật Edge
│   ├── database-design.md                 # Sơ Đồ CSDL D1 SQLite & Thông Số Bảng Dữ Liệu
│   ├── api-documentation.md               # Tài Liệu Chuẩn REST API Serverless Edge
│   ├── deployment-and-security.md         # Quy Trình Triển Khai Pipeline & Tiêu Chuẩn Bảo Mật
│   └── tts-pipeline.md                    # Tài Liệu Kiến Trúc Pipeline Chuyển Âm Thanh Edge-TTS
│
├── start_tunnel.bat                       # File Lệnh Batch Chạy Tunnel Tự Động Hóa Môi Trường Dev
├── README.md                              # Báo Cáo Tổng Quan Dự Án & Hướng Dẫn Cài Đặt
└── .gitignore                             # Quy Tắc Loại Trừ File Không Đưa Lên Git
