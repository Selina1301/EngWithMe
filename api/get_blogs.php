<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

try {
    $statement = db()->prepare(
        'SELECT b.id, b.title, b.content, b.rating, b.created_at, u.full_name as author_name 
         FROM blogs b 
         JOIN users u ON b.user_id = u.id 
         WHERE b.status = "approved" 
         ORDER BY b.created_at DESC'
    );
    $statement->execute();
    $blogs = $statement->fetchAll();

    json_response([
        'ok' => true,
        'blogs' => $blogs
    ]);

} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi tải bài viết.'], 500);
}
