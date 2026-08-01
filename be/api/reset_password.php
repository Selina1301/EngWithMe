<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$token = (string) ($_POST['token'] ?? '');
$password = (string) ($_POST['password'] ?? '');
$confirm = (string) ($_POST['confirm_password'] ?? '');

if ($token === '' || $password === '') {
    json_response(['ok' => false, 'message' => 'Dữ liệu không hợp lệ.'], 422);
}

if ($password !== $confirm) {
    json_response(['ok' => false, 'message' => 'Mật khẩu nhập lại không khớp.'], 422);
}

try {
    $statement = db()->prepare('SELECT id FROM users WHERE reset_token = ? AND reset_token_expires_at > NOW() LIMIT 1');
    $statement->execute([$token]);
    $user = $statement->fetch();

    if (!$user) {
        json_response(['ok' => false, 'message' => 'Link khôi phục đã hết hạn hoặc không hợp lệ.'], 400);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $update = db()->prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?');
    $update->execute([$hash, (int) $user['id']]);

    json_response([
        'ok' => true,
        'message' => 'Đổi mật khẩu thành công. Đang chuyển về trang đăng nhập...',
        'redirect' => 'login.html'
    ]);

} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống.'], 500);
}
