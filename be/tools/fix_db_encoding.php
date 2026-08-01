<?php
require_once __DIR__ . '/helpers.php';

try {
    $pdo = db();

    // 1. Disable foreign key checks to allow clearing/resetting tables safely
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    // 2. Clear corrupted tables/rows
    $pdo->exec("TRUNCATE TABLE vocabularies;");
    $pdo->exec("TRUNCATE TABLE lessons;");
    $pdo->exec("TRUNCATE TABLE modules;");
    $pdo->exec("TRUNCATE TABLE courses;");
    
    // Clear blogs (only contains seed blogs)
    $pdo->exec("TRUNCATE TABLE blogs;");
    
    // Delete seed users to avoid conflicts, preserving other test users (id > 2)
    $pdo->exec("DELETE FROM users WHERE id IN (1, 2);");

    // 3. Read seeds SQL file
    $seedsFile = dirname(__DIR__) . '/database/database_seeds.sql';
    if (!file_exists($seedsFile)) {
        throw new Exception("Không tìm thấy file database_seeds.sql tại: " . $seedsFile);
    }
    
    $sql = file_get_contents($seedsFile);
    
    // Remove "USE engwithme_db;" statement if present, to avoid issues
    $sql = preg_replace('/USE\s+engwithme_db\s*;/i', '', $sql);

    // 4. Execute the seed SQL (PDO will run it with utf8mb4 connection charset)
    $pdo->exec($sql);

    // 5. Re-enable foreign key checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => true,
        'message' => 'Đã khắc phục lỗi hiển thị tiếng Việt và nạp lại dữ liệu mẫu thành công!'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Exception $e) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
