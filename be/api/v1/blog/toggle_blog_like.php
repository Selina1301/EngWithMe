<?php
declare(strict_types=1);

require_once __DIR__ . '/../../helpers.php';

start_app_session();
require_post();

ensure_blog_social_table();

$id = (int) ($_POST['id'] ?? 0);

if ($id <= 0) {
    json_response(['ok' => false, 'message' => 'ID bài viết không hợp lệ.'], 422);
}

try {
    $pdo = db();
    $userIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $userId = $_SESSION['user_id'] ?? null;

    $checkStmt = $pdo->prepare('SELECT id FROM blog_likes WHERE blog_id = ? AND (user_ip = ? OR (user_id IS NOT NULL AND user_id = ?)) LIMIT 1');
    $checkStmt->execute([$id, $userIp, (int) $userId]);
    $existing = $checkStmt->fetch();

    if ($existing) {
        // Unlike
        $delStmt = $pdo->prepare('DELETE FROM blog_likes WHERE id = ?');
        $delStmt->execute([(int) $existing['id']]);

        $decStmt = $pdo->prepare('UPDATE blogs SET likes = GREATEST(0, likes - 1) WHERE id = ?');
        $decStmt->execute([$id]);
        $isLiked = false;
    } else {
        // Like
        $insStmt = $pdo->prepare('INSERT IGNORE INTO blog_likes (blog_id, user_id, user_ip) VALUES (?, ?, ?)');
        $insStmt->execute([$id, $userId ? (int) $userId : null, $userIp]);

        $incStmt = $pdo->prepare('UPDATE blogs SET likes = likes + 1 WHERE id = ?');
        $incStmt->execute([$id]);
        $isLiked = true;
    }

    $fetchStmt = $pdo->prepare('SELECT likes FROM blogs WHERE id = ? LIMIT 1');
    $fetchStmt->execute([$id]);
    $row = $fetchStmt->fetch();

    json_response([
        'ok' => true,
        'liked' => $isLiked,
        'likes' => (int) ($row['likes'] ?? 0)
    ]);
} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi yêu thích bài viết.'], 500);
}
