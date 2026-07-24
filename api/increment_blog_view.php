<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

ensure_blog_social_table();

$id = (int) ($_POST['id'] ?? 0);

if ($id <= 0) {
    json_response(['ok' => false, 'message' => 'ID bài viết không hợp lệ.'], 422);
}

try {
    $pdo = db();
    $updateStmt = $pdo->prepare('UPDATE blogs SET views = views + 1 WHERE id = ?');
    $updateStmt->execute([$id]);

    $fetchStmt = $pdo->prepare('SELECT views FROM blogs WHERE id = ? LIMIT 1');
    $fetchStmt->execute([$id]);
    $row = $fetchStmt->fetch();

    json_response([
        'ok' => true,
        'views' => (int) ($row['views'] ?? 1)
    ]);
} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi tăng lượt xem.'], 500);
}
