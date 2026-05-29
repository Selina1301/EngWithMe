USE engwithme_db;

ALTER TABLE learning_content_items
  MODIFY section ENUM('reading', 'listening', 'grammar') NOT NULL;
