CREATE DATABASE IF NOT EXISTS engwithme_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE engwithme_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  level ENUM('A1', 'A2', 'B1', 'B2', 'C1') NOT NULL DEFAULT 'A1',
  learning_goal VARCHAR(255) NULL,
  avatar_path VARCHAR(255) NULL,
  status ENUM('active', 'locked') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS level ENUM('A1', 'A2', 'B1', 'B2', 'C1') NOT NULL DEFAULT 'A1' AFTER role,
  ADD COLUMN IF NOT EXISTS learning_goal VARCHAR(255) NULL AFTER level,
  ADD COLUMN IF NOT EXISTS avatar_path VARCHAR(255) NULL AFTER learning_goal,
  ADD COLUMN IF NOT EXISTS status ENUM('active', 'locked') NOT NULL DEFAULT 'active' AFTER learning_goal,
  ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL AFTER status;

INSERT INTO users (full_name, email, password, role, level, learning_goal, status)
VALUES
  ('Admin EngWithMe', 'admin1301@gmail.com', '$2y$10$b07Nhzk9RFjreLkTPru7E.jMAFBD9IclEQ1y/7VsJNGYuXHApz.3S', 'admin', 'B2', CONVERT(0x5175e1baa36e207472e1bb8b206e67c6b0e1bb9d692064c3b96e67 USING utf8mb4), 'active'),
  ('Nguyen Van A', 'student@example.com', '$2y$10$2VxF6amxjS2XNin8TQtMXeff4jaWLx7t7b2G8D7RvNWZlmiuKsOIO', 'user', 'A2', CONVERT(0x4769616f207469e1babf702068e1bab16e67206e67c3a079 USING utf8mb4), 'active')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password = VALUES(password),
  role = VALUES(role),
  level = VALUES(level),
  learning_goal = VALUES(learning_goal),
  status = VALUES(status);
