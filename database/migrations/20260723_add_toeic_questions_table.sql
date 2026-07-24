-- Migration: Create toeic_questions table for MySQL Database API
CREATE TABLE IF NOT EXISTS toeic_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_set VARCHAR(30) NOT NULL,
  section VARCHAR(20) NOT NULL,
  part_number VARCHAR(10) NOT NULL,
  question_no INT NOT NULL,
  question_text TEXT NOT NULL,
  options_json JSON NOT NULL,
  answer_text TEXT NOT NULL,
  explain_text TEXT NULL,
  image_url VARCHAR(255) NULL,
  audio_url VARCHAR(255) NULL,
  transcript TEXT NULL,
  passage_text LONGTEXT NULL,
  group_label VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_set_part (test_set, part_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
