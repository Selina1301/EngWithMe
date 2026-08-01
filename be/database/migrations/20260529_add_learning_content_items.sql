USE engwithme_db;

CREATE TABLE IF NOT EXISTS learning_content_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section ENUM('reading', 'listening', 'grammar') NOT NULL,
  content_key VARCHAR(150) NOT NULL,
  level_key VARCHAR(50) NULL,
  goal_key VARCHAR(100) NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  payload_json LONGTEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_learning_content (section, content_key),
  KEY idx_learning_content_section_status (section, status),
  KEY idx_learning_content_level (section, level_key),
  KEY idx_learning_content_goal (section, goal_key)
) ENGINE=InnoDB;
