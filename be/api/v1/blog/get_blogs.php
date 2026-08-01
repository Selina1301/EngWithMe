<?php
declare(strict_types=1);

require_once __DIR__ . '/../../helpers.php';

start_app_session();

ensure_blog_social_table();

try {
    $userIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $userId = $_SESSION['user_id'] ?? null;

    $statement = db()->prepare(
        'SELECT b.id, b.title, b.content, b.rating, b.created_at, b.views, b.likes, u.full_name as author_name 
         FROM blogs b 
         JOIN users u ON b.user_id = u.id 
         WHERE b.status = "approved" 
         ORDER BY b.created_at DESC'
    );
    $statement->execute();
    $blogs = $statement->fetchAll();

    // Check user liked status
    $likedStmt = db()->prepare('SELECT blog_id FROM blog_likes WHERE user_ip = ? OR (user_id IS NOT NULL AND user_id = ?)');
    $likedStmt->execute([$userIp, (int) $userId]);
    $likedRows = $likedStmt->fetchAll();
    $likedBlogIds = array_flip(array_column($likedRows, 'blog_id'));

    foreach ($blogs as &$blog) {
        $blog['id'] = (int) $blog['id'];
        $blog['rating'] = (int) $blog['rating'];
        $blog['views'] = max(1, (int) ($blog['views'] ?? 1));
        $blog['likes'] = max(0, (int) ($blog['likes'] ?? 0));
        $blog['is_liked'] = isset($likedBlogIds[$blog['id']]);
    }
    unset($blog);

    json_response([
        'ok' => true,
        'blogs' => $blogs
    ]);

} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi tải bài viết: ' . $error->getMessage()], 500);
}
