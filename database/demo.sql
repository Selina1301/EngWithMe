CREATE DATABASE IF NOT EXISTS english_learning
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE english_learning;

DROP TABLE IF EXISTS test_results;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS vocabularies;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS tests;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('guest', 'student', 'admin') NOT NULL DEFAULT 'student',
  level ENUM('A1', 'A2', 'B1', 'B2', 'C1') DEFAULT 'A1',
  learning_goal VARCHAR(255),
  status ENUM('active', 'locked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'IELTS', 'TOEIC') NOT NULL,
  thumbnail VARCHAR(255),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  order_number INT NOT NULL DEFAULT 1,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT,
  video_url VARCHAR(255),
  audio_url VARCHAR(255),
  lesson_type ENUM('vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'quiz') NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy',
  duration_minutes INT NOT NULL DEFAULT 15,
  order_number INT NOT NULL DEFAULT 1,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE vocabularies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  word VARCHAR(100) NOT NULL,
  pronunciation VARCHAR(100),
  meaning VARCHAR(255) NOT NULL,
  example TEXT,
  audio_url VARCHAR(255),
  image_url VARCHAR(255),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice', 'fill_blank', 'arrange_sentence', 'listening', 'reading', 'writing') NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  level ENUM('A1', 'A2', 'B1', 'B2', 'C1') DEFAULT 'A1',
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
);

CREATE TABLE answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  level ENUM('A1', 'A2', 'B1', 'B2', 'C1') DEFAULT 'A1',
  duration INT NOT NULL DEFAULT 30,
  total_questions INT NOT NULL DEFAULT 20,
  test_type ENUM('placement', 'module', 'final') NOT NULL DEFAULT 'module',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id INT NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  score DECIMAL(5, 2) DEFAULT 0,
  completed_at DATETIME,
  UNIQUE KEY unique_user_lesson (user_id, lesson_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE test_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  test_id INT NOT NULL,
  score DECIMAL(5, 2) NOT NULL,
  correct_count INT DEFAULT 0,
  wrong_count INT DEFAULT 0,
  recommended_level ENUM('A1', 'A2', 'B1', 'B2', 'C1'),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

CREATE TABLE blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  excerpt TEXT,
  content LONGTEXT,
  author_id INT,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at DATETIME,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_name ENUM('free', 'pro', 'premium') NOT NULL DEFAULT 'free',
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method ENUM('manual', 'stripe', 'paypal', 'vnpay', 'momo') NOT NULL DEFAULT 'manual',
  status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  paid_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (name, email, password_hash, role, level, learning_goal) VALUES
('Nguyen Van A', 'student@example.com', '$2y$demo_student_hash', 'student', 'A2', 'Giao tiep hang ngay'),
('Admin Demo', 'admin@example.com', '$2y$demo_admin_hash', 'admin', 'B2', 'Quan tri noi dung');

INSERT INTO courses (title, description, level, thumbnail, price, status) VALUES
('English for Beginners', 'Khoa hoc A1 cho nguoi moi bat dau.', 'A1', 'images/course-beginner.jpg', 0, 'published'),
('Daily Communication', 'Luyen hoi thoai doi song va phan xa nghe noi.', 'A2', 'images/course-communication.jpg', 99000, 'published'),
('IELTS Foundation', 'Xay nen tu vung hoc thuat, nghe va doc hieu.', 'B1', 'images/course-ielts.jpg', 199000, 'published');

INSERT INTO modules (course_id, title, order_number) VALUES
(1, 'Greetings', 1),
(1, 'Daily Activities', 2),
(1, 'Basic Conversations', 3);

INSERT INTO lessons (module_id, title, content, audio_url, lesson_type, difficulty, duration_minutes, order_number) VALUES
(1, 'Hello, Hi, Good morning', 'Hoc cach chao hoi co ban bang tieng Anh.', 'assets/audio/greeting.mp3', 'vocabulary', 'easy', 15, 1),
(1, 'Introducing yourself', 'Hoc cach gioi thieu ten, tuoi va que quan.', NULL, 'speaking', 'easy', 20, 2),
(2, 'Present Simple', 'Cong thuc: S + V(s/es). Dung de noi ve thoi quen.', NULL, 'grammar', 'easy', 25, 1),
(3, 'Asking for directions', 'Nghe va luyen hoi thoai hoi duong.', 'assets/audio/directions.mp3', 'listening', 'medium', 25, 1);

INSERT INTO vocabularies (lesson_id, word, pronunciation, meaning, example, audio_url, image_url) VALUES
(1, 'hello', '/he-lo/', 'xin chao', 'Hello, my name is Anna.', 'assets/audio/hello.mp3', 'images/hello.jpg'),
(1, 'improve', '/im-pru:v/', 'cai thien', 'I want to improve my English.', 'assets/audio/improve.mp3', 'images/improve.jpg'),
(1, 'introduce', '/in-tro-du:s/', 'gioi thieu', 'Please introduce yourself.', 'assets/audio/introduce.mp3', 'images/introduce.jpg');

INSERT INTO questions (lesson_id, question_text, question_type, correct_answer, explanation, level) VALUES
(3, 'She ___ to school every day.', 'multiple_choice', 'goes', 'Chu ngu She di voi dong tu them s/es trong Present Simple.', 'A2'),
(1, 'Nice to meet you co nghia la gi?', 'multiple_choice', 'Rat vui duoc gap ban', 'Day la cau chao khi gap lan dau.', 'A1'),
(1, 'Tu nao co nghia la cai thien?', 'multiple_choice', 'improve', 'Improve nghia la cai thien.', 'A1');

INSERT INTO answers (question_id, answer_text, is_correct) VALUES
(1, 'go', FALSE),
(1, 'goes', TRUE),
(1, 'going', FALSE),
(1, 'gone', FALSE),
(2, 'Ban ten gi?', FALSE),
(2, 'Rat vui duoc gap ban', TRUE),
(2, 'Tam biet', FALSE),
(3, 'listen', FALSE),
(3, 'practice', FALSE),
(3, 'improve', TRUE);

INSERT INTO tests (title, level, duration, total_questions, test_type) VALUES
('Placement Test A1-A2', 'A1', 30, 20, 'placement'),
('Module 1 Quiz', 'A1', 15, 10, 'module');

INSERT INTO user_progress (user_id, lesson_id, status, score, completed_at) VALUES
(1, 1, 'completed', 90, NOW()),
(1, 2, 'in_progress', 40, NULL);

INSERT INTO test_results (user_id, test_id, score, correct_count, wrong_count, recommended_level) VALUES
(1, 1, 70, 14, 6, 'A2');

INSERT INTO blog_posts (title, slug, excerpt, content, author_id, status, published_at) VALUES
('Cach luyen nghe cho nguoi mat goc', 'cach-luyen-nghe-cho-nguoi-mat-goc', 'Bat dau bang hoi thoai ngan va transcript.', 'Noi dung bai viet mau.', 2, 'published', NOW());
