<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$currentUser = require_current_user();

$currentPassword = (string) ($_POST['current_password'] ?? '');
$newPassword = (string) ($_POST['new_password'] ?? '');
$confirmPassword = (string) ($_POST['confirm_password'] ?? '');

if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận.'], 422);
}

if (strlen($newPassword) < 6) {
    json_response(['ok' => false, 'message' => 'Mật khẩu mới phải có tối thiểu 6 ký tự.'], 422);
}

if ($newPassword !== $confirmPassword) {
    json_response(['ok' => false, 'message' => 'Xác nhận mật khẩu mới chưa trùng khớp.'], 422);
}

try {
    $pdo = db();
    
    // Lấy mật khẩu lưu trong CSDL của người dùng
    $stmt = $pdo->prepare('SELECT password FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([(int) $currentUser['id']]);
    $userRecord = $stmt->fetch();
    
    $storedHash = (string) ($userRecord['password'] ?? '');
    
    // Kiểm tra mật khẩu hiện tại có chính xác không
    if (!password_verify($currentPassword, $storedHash) && !hash_equals($storedHash, $currentPassword)) {
        json_response(['ok' => false, 'message' => 'Mật khẩu hiện tại không chính xác.'], 400);
    }
    
    // Mã hóa mật khẩu mới bằng password_hash
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $updateStmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
    $updateStmt->execute([$newHash, (int) $currentUser['id']]);
    
    log_user_activity('password_changed', ['user_id' => (int) $currentUser['id']]);

    json_response([
        'ok' => true,
        'message' => 'Đã đổi mật khẩu bảo mật thành công!'
    ]);
} catch (\Throwable $e) {
    json_response([
        'ok' => false,
        'message' => 'Không thể đổi mật khẩu lúc này. Lỗi: ' . $e->getMessage()
    ], 500);
}
