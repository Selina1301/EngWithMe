-- Migration: Create Notifications Table for EngWithMe
-- Date: 2026-07-28

USE engwithme_db;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category ENUM('blog', 'listening', 'vocabulary', 'grammar', 'exam', 'premium', 'comment', 'security', 'streak', 'achievement', 'system') NOT NULL DEFAULT 'system',
  status_level ENUM('info', 'success', 'warning', 'danger') NOT NULL DEFAULT 'info',
  link VARCHAR(255) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_read_created (user_id, is_read, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
