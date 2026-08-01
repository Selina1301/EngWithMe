-- Cloudflare D1 Database Schema for EngWithMe

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  level TEXT DEFAULT 'A1',
  learning_goal TEXT DEFAULT 'Giao tiếp hàng ngày',
  status TEXT DEFAULT 'active',
  avatar TEXT DEFAULT '',
  is_vip INTEGER DEFAULT 0,
  vip_expires_at TEXT,
  remember_token TEXT,
  session_token TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  section TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT DEFAULT '',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 5,
  status TEXT DEFAULT 'approved',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. Exam Results Table
CREATE TABLE IF NOT EXISTS exam_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  listening_score INTEGER DEFAULT 0,
  reading_score INTEGER DEFAULT 0,
  completed_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status_tag TEXT DEFAULT 'Thông báo',
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code INTEGER UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  plan_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING',
  payment_link_id TEXT,
  qr_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Admin User
INSERT OR IGNORE INTO users (id, full_name, email, role, level, learning_goal, status, is_vip)
VALUES ('1', 'Nguyễn Tùng Dương (Admin)', 'admin1301@gmail.com', 'admin', 'C1', 'Quản trị hệ thống EngWithMe', 'active', 1);

-- Seed Initial Blog Post
INSERT OR IGNORE INTO blogs (id, user_id, author_name, author_avatar, title, content, likes_count, views_count, rating)
VALUES (1, '1', 'Thầy Dương TOEIC', 'uploads/avatars/teacher_duong.jpg', 'Bí quyết tăng 200 điểm TOEIC Listening trong 30 ngày', 'Luyện nghe phản xạ ngắn mỗi ngày...', 142, 1250, 5);
