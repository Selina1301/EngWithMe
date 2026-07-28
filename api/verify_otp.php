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
    
    // Tìm user theo email (bao gồm cả tài khoản mới chưa kích hoạt - pending)
    $statement = $pdo->prepare('SELECT * FROM users WHERE email = ? AND status IN ("active", "pending") LIMIT 1');
    $statement->execute([$email]);
    $user = $statement->fetch();
    
    if (!$user) {
        json_response(['ok' => false, 'message' => 'Yêu cầu không hợp lệ hoặc tài khoản đã bị khóa.'], 400);
    }
    
    if (empty($user['verification_token'])) {
        json_response(['ok' => false, 'message' => 'Mã OTP không hợp lệ hoặc đã hết hạn.'], 400);
    }
    
    if ($user['verification_token'] !== $otp) {
        $attempts = (int) $user['login_attempts'] + 1;
        if ($attempts >= 5) {
            // Hủy mã OTP và reset lượt thử
            $lock = $pdo->prepare('UPDATE users SET verification_token = NULL, login_attempts = 0 WHERE id = ?');
            $lock->execute([(int) $user['id']]);
            json_response(['ok' => false, 'message' => 'Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng gửi lại yêu cầu để nhận mã mới.'], 400);
        } else {
            $inc = $pdo->prepare('UPDATE users SET login_attempts = ? WHERE id = ?');
            $inc->execute([$attempts, (int) $user['id']]);
            json_response(['ok' => false, 'message' => 'Mã OTP không chính xác. Bạn còn ' . (5 - $attempts) . ' lần thử.'], 400);
        }
    }
    
    $token = generate_remember_token();
    $update = $pdo->prepare('UPDATE users SET status = "active", verification_token = NULL, last_login_at = NOW(), login_attempts = 0, attempt_lock_until = NULL, remember_token = ?, remember_until = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE id = ?');
    $update->execute([$token, (int) $user['id']]);
    $user['remember_token'] = $token;
    $user['status'] = 'active';

    // Tạo session đăng nhập chính thức
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') 
        || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');

    setcookie('ewm_logged_in', '1', [
        'expires' => time() + 86400 * 30,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => false,
        'samesite' => 'Lax'
    ]);
    setcookie('ewm_trusted_device', $user['id'] . ':' . $token, [
        'expires' => time() + 86400 * 30,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    
    log_user_activity('otp_verify_success', ['email' => $email]);
    
    json_response([
        'ok' => true,
        'message' => 'Xác thực tài khoản thành công! Đang chuyển hướng...',
        'redirect' => (($user['role'] ?? 'user') === 'admin') ? 'admin.html' : 'profile.html',
        'user' => current_user_payload($user)
    ]);
    
} catch (Throwable $e) {
    log_user_activity('otp_verify_failed', ['email' => $email, 'error' => $e->getMessage()]);
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
}
