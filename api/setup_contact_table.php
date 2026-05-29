<?php
/**
 * Database Setup Script for Contact Messages Table
 * Run this once to create the contact_messages table
 */

require_once __DIR__ . '/helpers.php';

try {
    $pdo = db();
    
    $sql = "CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(150) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message LONGTEXT NOT NULL,
        status ENUM('new', 'read', 'replied') NOT NULL DEFAULT 'new',
        admin_reply TEXT,
        replied_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_created_at (created_at),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
    
    echo "✅ Table 'contact_messages' created successfully!<br>";
    echo "ℹ️  Feedback sẽ được gửi đến: kingcute5x@gmail.com<br>";
    echo "✨ Hệ thống contact form đã sẵn sàng!";
    
} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage();
}
