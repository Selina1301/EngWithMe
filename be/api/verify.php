<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

$token = trim((string) ($_GET['token'] ?? $_POST['token'] ?? ''));

if ($token === '') {
    json_response(['ok' => false, 'message' => 'Mã xác thực không hợp lệ.'], 400);
}

try {
    $pdo = db();
    
    // Tìm người dùng có token tương ứng
    $statement = $pdo->prepare('SELECT id, status FROM users WHERE verification_token = ? LIMIT 1');
    $statement->execute([$token]);
    $user = $statement->fetch();
    
    if (!$user) {
        json_response(['ok' => false, 'message' => 'Liên kết xác thực không tồn tại hoặc đã hết hạn.'], 404);
    }
    
    if (($user['status'] ?? 'pending') === 'active') {
        json_response(['ok' => true, 'message' => 'Tài khoản của bạn đã được kích hoạt từ trước.'], 200);
    }
    
    // Cập nhật trạng thái người dùng thành active và xóa token
    $update = $pdo->prepare('UPDATE users SET status = "active", verification_token = NULL WHERE id = ?');
    $update->execute([(int) $user['id']]);
    
    json_response(['ok' => true, 'message' => 'Kích hoạt tài khoản thành công! Bây giờ bạn có thể đăng nhập.'], 200);
} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống: ' . $error->getMessage()], 500);
}
