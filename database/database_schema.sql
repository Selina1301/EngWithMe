-- Database Initialization Schema for EngWithMe
-- Compatible with XAMPP MySQL / MariaDB

CREATE DATABASE IF NOT EXISTS engwithme_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE engwithme_db;

-- Clear legacy tables if existing (preserving foreign key constraints order)
DROP TABLE IF EXISTS user_viewed_topics;
DROP TABLE IF EXISTS user_vocab_wrong_words;
DROP TABLE IF EXISTS user_vocab_quiz_stats;
DROP TABLE IF EXISTS test_results;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS user_saved_vocab;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS vocabularies;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS tests;
DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS users;

-- 1. Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  level ENUM('A1', 'A2', 'B1', 'B2', 'C1') NOT NULL DEFAULT 'A1',
  learning_goal VARCHAR(255) NULL,
  avatar_path VARCHAR(255) NULL,
  status ENUM('active', 'locked') NOT NULL DEFAULT 'active',
  login_attempts INT NOT NULL DEFAULT 0,
  attempt_lock_until DATETIME NULL,
  reset_token VARCHAR(255) NULL,
  reset_token_expires_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Blogs Table (User reviews and posts)
CREATE TABLE blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Courses Table
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'IELTS', 'TOEIC') NOT NULL,
  thumbnail VARCHAR(255) NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Modules Table
CREATE TABLE modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  order_number INT NOT NULL DEFAULT 1,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Lessons Table
CREATE TABLE lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT NULL,
  video_url VARCHAR(255) NULL,
  audio_url VARCHAR(255) NULL,
  lesson_type ENUM('vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'quiz') NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy',
  duration_minutes INT NOT NULL DEFAULT 15,
  order_number INT NOT NULL DEFAULT 1,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Vocabularies Table
CREATE TABLE vocabularies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  word VARCHAR(100) NOT NULL,
  pronunciation VARCHAR(100) NULL,
  meaning VARCHAR(255) NOT NULL,
  example TEXT NULL,
  audio_url VARCHAR(255) NULL,
  image_url VARCHAR(255) NULL,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Questions Table
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice', 'fill_blank', 'arrange_sentence', 'listening', 'reading', 'writing') NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NULL,
  level ENUM('A1', 'A2', 'B1', 'B2', 'C1') DEFAULT 'A1',
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 8. Answers Table
CREATE TABLE answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Tests Table
CREATE TABLE tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  level ENUM('A1', 'A2', 'B1', 'B2', 'C1') DEFAULT 'A1',
  duration INT NOT NULL DEFAULT 30,
  total_questions INT NOT NULL DEFAULT 20,
  test_type ENUM('placement', 'module', 'final') NOT NULL DEFAULT 'module',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 10. Payments Table
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_name ENUM('free', 'pro', 'premium') NOT NULL DEFAULT 'free',
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method ENUM('manual', 'stripe', 'paypal', 'vnpay', 'momo') NOT NULL DEFAULT 'manual',
  status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  paid_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. User Saved Vocabulary Bookmarks
CREATE TABLE user_saved_vocab (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vocab_key VARCHAR(150) NOT NULL,
  study_level ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy',
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_vocab (user_id, vocab_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. User Lesson/Course Progress
CREATE TABLE user_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  progress_id VARCHAR(100) NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_progress (user_id, progress_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Test Results (TOEIC Practice and Placement test history)
CREATE TABLE test_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  test_set VARCHAR(50) NOT NULL,
  test_parts VARCHAR(50) NOT NULL,
  score VARCHAR(20) NOT NULL,
  correct_count INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  recommended_level ENUM('A1', 'A2', 'B1', 'B2', 'C1') NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. Vocabulary Quiz Stats
CREATE TABLE user_vocab_quiz_stats (
  user_id INT PRIMARY KEY,
  correct_count INT NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Vocabulary Quiz Incorrect Words Review
CREATE TABLE user_vocab_wrong_words (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  word_key VARCHAR(150) NOT NULL,
  wrong_count INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_wrong_word (user_id, word_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16. User Viewed Topics Track
CREATE TABLE user_viewed_topics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  level_key VARCHAR(50) NOT NULL,
  topic_id VARCHAR(100) NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_viewed (user_id, level_key, topic_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
