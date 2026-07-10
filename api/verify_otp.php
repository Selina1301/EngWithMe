<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

// Chỉ chấp nhận POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'message' => 'Yêu cầu không hợp lệ.'], 405);
}

// Nhận dữ liệu JSON từ body hoặc POST thông thường
$data = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$email = strtolower(trim((string) ($data['email'] ?? '')));
$otp = trim((string) ($data['otp'] ?? ''));

if ($email === '' || $otp === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng cung cấp email và mã OTP.'], 422);
}

try {
    $pdo = db();
    
    // Tìm user theo email và status = pending
    $statement = $pdo->prepare('SELECT * FROM users WHERE email = ? AND status = "pending" LIMIT 1');
    $statement->execute([$email]);
    $user = $statement->fetch();
    
    if (!$user) {
        json_response(['ok' => false, 'message' => 'Yêu cầu kích hoạt không hợp lệ hoặc tài khoản đã kích hoạt.'], 400);
    }
    
    if (empty($user['verification_token'])) {
        json_response(['ok' => false, 'message' => 'Mã OTP không hợp lệ hoặc đã hết hạn.'], 400);
    }
    
    if ($user['verification_token'] !== $otp) {
        $attempts = (int) $user['login_attempts'] + 1;
        if ($attempts >= 5) {
            // Hủy mã OTP đăng ký và reset lượt thử
            $clear = $pdo->prepare('UPDATE users SET verification_token = NULL, login_attempts = 0 WHERE id = ?');
            $clear->execute([(int) $user['id']]);
            json_response(['ok' => false, 'message' => 'Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng đăng ký/gửi lại yêu cầu để nhận mã mới.'], 400);
        } else {
            $inc = $pdo->prepare('UPDATE users SET login_attempts = ? WHERE id = ?');
            $inc->execute([$attempts, (int) $user['id']]);
            json_response(['ok' => false, 'message' => 'Mã OTP không chính xác. Bạn còn ' . (5 - $attempts) . ' lần thử.'], 400);
        }
    }
    
    // Kích hoạt tài khoản và xóa mã OTP
    $update = $pdo->prepare('UPDATE users SET status = "active", verification_token = NULL WHERE id = ?');
    $update->execute([(int) $user['id']]);
    
    // Tạo session đăng nhập tự động ngay lập tức
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    
    // Đặt cookie trạng thái đăng nhập cho frontend
    setcookie('ewm_logged_in', '1', time() + 86400 * 30, '/');
    
    // Cập nhật log đăng nhập cuối
    $updateLogin = $pdo->prepare('UPDATE users SET last_login_at = NOW(), login_attempts = 0, attempt_lock_until = NULL WHERE id = ?');
    $updateLogin->execute([(int) $user['id']]);
    
    log_user_activity('otp_verify_success', ['email' => $email]);
    
    json_response([
        'ok' => true,
        'message' => 'Xác thực tài khoản thành công! Đang chuyển hướng...',
        'redirect' => 'profile.html#dashboard',
        'user' => current_user_payload($user)
    ]);
    
} catch (Throwable $e) {
    log_user_activity('otp_verify_failed', ['email' => $email, 'error' => $e->getMessage()]);
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
}
