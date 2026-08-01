<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

// Chỉ chấp nhận POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'message' => 'Yêu cầu không hợp lệ.'], 405);
}

// Lấy email từ POST hoặc JSON input
$data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$email = strtolower(trim((string) ($data['email'] ?? '')));

if ($email === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng cung cấp địa chỉ email.'], 422);
}

try {
    $pdo = db();
    
    // Tìm user theo email (active hoặc pending)
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? AND status IN ("active", "pending") LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        json_response(['ok' => false, 'message' => 'Tài khoản không tồn tại hoặc đã bị khóa.'], 404);
    }

    // Tạo mã OTP 6 số ngẫu nhiên mới
    $newOtp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    // Cập nhật OTP mới vào cơ sở dữ liệu và reset lượt thử sai
    $updateStmt = $pdo->prepare('UPDATE users SET verification_token = ?, login_attempts = 0 WHERE id = ?');
    $updateStmt->execute([$newOtp, (int) $user['id']]);

    // Gửi email OTP mới qua Gmail SMTP
    $name = $user['full_name'] ?: 'Học viên';
    $sent = send_otp_mail($email, $name, $newOtp);

    if ($sent) {
        json_response([
            'ok' => true,
            'message' => 'Mã OTP mới đã được gửi thành công đến ' . $email
        ]);
    } else {
        json_response([
            'ok' => false,
            'message' => 'Không thể gửi email OTP. Vui lòng kiểm tra lại cấu hình SMTP.'
        ], 500);
    }
} catch (\Throwable $e) {
    json_response([
        'ok' => false,
        'message' => 'Lỗi hệ thống: ' . $e->getMessage()
    ], 500);
}
