<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

$user = require_current_user();
$userId = (int) $user['id'];
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare('SELECT progress_id FROM user_progress WHERE user_id = ?');
        $stmt->execute([$userId]);
        $progress = $stmt->fetchAll(PDO::FETCH_COLUMN);

        json_response([
            'ok' => true,
            'progress' => $progress
        ]);
    } catch (Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi tải tiến độ.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $progressId = trim((string) ($_POST['progress_id'] ?? ''));

    if ($progressId === '') {
        json_response(['ok' => false, 'message' => 'Mã tiến độ không hợp lệ.'], 422);
    }

    try {
        $stmt = $pdo->prepare('INSERT IGNORE INTO user_progress (user_id, progress_id) VALUES (?, ?)');
        $stmt->execute([$userId, $progressId]);

        json_response([
            'ok' => true,
            'message' => 'Đã lưu tiến độ học tập.'
        ]);
    } catch (Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi lưu tiến độ.'], 500);
    }
}
