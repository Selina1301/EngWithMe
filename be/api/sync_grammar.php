<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

function ensure_grammar_practice_table(): void
{
    try {
        $pdo = db();
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS user_grammar_practice (
                user_id INT PRIMARY KEY,
                state_json LONGTEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );
    } catch (\Throwable $e) {
        error_log("Failed to ensure user_grammar_practice table: " . $e->getMessage());
    }
}

ensure_grammar_practice_table();

$user = require_current_user();
$userId = (int) $user['id'];
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare('SELECT state_json FROM user_grammar_practice WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        $state = $row ? json_decode((string) $row['state_json'], true) : [];
        if (!is_array($state)) {
            $state = [];
        }

        json_response([
            'ok' => true,
            'state' => $state
        ]);
    } catch (\Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi tải tiến độ ngữ pháp.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stateJson = $_POST['state_json'] ?? '{}';
    $decoded = json_decode((string) $stateJson, true);
    if (!is_array($decoded)) {
        $decoded = [];
    }

    try {
        $stmt = $pdo->prepare('
            INSERT INTO user_grammar_practice (user_id, state_json)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)
        ');
        $stmt->execute([$userId, json_encode($decoded)]);

        json_response([
            'ok' => true,
            'message' => 'Đã lưu tiến độ ngữ pháp vào CSDL.'
        ]);
    } catch (\Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi lưu tiến độ ngữ pháp.'], 500);
    }
}
