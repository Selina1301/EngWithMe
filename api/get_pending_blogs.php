<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

$user = require_admin_user();

try {
    $statement = db()->prepare(
        'SELECT b.id, b.title, b.content, b.rating, b.status, b.created_at, u.full_name as author_name, u.email as author_email 
         FROM blogs b 
         JOIN users u ON b.user_id = u.id 
         ORDER BY CASE b.status WHEN "pending" THEN 1 WHEN "approved" THEN 2 ELSE 3 END, b.created_at DESC'
    );
    $statement->execute();
    $blogs = $statement->fetchAll();

    json_response([
        'ok' => true,
        'blogs' => $blogs
    ]);

} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi tải dữ liệu.'], 500);
}
