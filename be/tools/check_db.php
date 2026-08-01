<?php
require_once __DIR__ . '/../api/helpers.php';
try {
    $pdo = db();
    $stmt = $pdo->query('SELECT id, full_name, email, status, verification_token, created_at FROM users ORDER BY id DESC LIMIT 5');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
