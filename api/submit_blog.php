<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$user = require_current_user();

$title = trim((string) ($_POST['title'] ?? ''));
$content = trim((string) ($_POST['content'] ?? ''));
$rating = (int) ($_POST['rating'] ?? 5);

if ($title === '' || $content === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng nhập đầy đủ tiêu đề và nội dung.'], 422);
}

if ($rating < 1 || $rating > 5) {
    json_response(['ok' => false, 'message' => 'Đánh giá phải từ 1 đến 5 sao.'], 422);
}

try {
    $statement = db()->prepare('INSERT INTO blogs (user_id, title, content, rating, status) VALUES (?, ?, ?, ?, "pending")');
    $statement->execute([
        (int) $user['id'],
        $title,
        $content,
        $rating
    ]);

    json_response([
        'ok' => true,
        'message' => 'Đã gửi cảm nhận về cho admin. Vui lòng chờ xét duyệt!'
    ]);

} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi lưu bài viết.'], 500);
}
