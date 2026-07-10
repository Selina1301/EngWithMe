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
    
    // Tìm user đang hoạt động theo email
    $statement = $pdo->prepare('SELECT * FROM users WHERE email = ? AND status = "active" LIMIT 1');
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
            json_response(['ok' => false, 'message' => 'Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng đăng nhập lại để nhận mã mới.'], 400);
        } else {
            $inc = $pdo->prepare('UPDATE users SET login_attempts = ? WHERE id = ?');
            $inc->execute([$attempts, (int) $user['id']]);
            json_response(['ok' => false, 'message' => 'Mã OTP đăng nhập không chính xác. Bạn còn ' . (5 - $attempts) . ' lần thử.'], 400);
        }
    }
    
    // Xóa mã OTP sau khi xác thực thành công
    $update = $pdo->prepare('UPDATE users SET verification_token = NULL WHERE id = ?');
    $update->execute([(int) $user['id']]);
    
    // Đọc trạng thái Ghi nhớ từ client
    $remember = isset($data['remember']) && ($data['remember'] === '1' || $data['remember'] === true || $data['remember'] === 1 || $data['remember'] === 'true');

    // Tạo session đăng nhập chính thức
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    
    if ($remember) {
        // Ghi nhớ thiết bị: Cấu hình cookie session PHPSESSID tồn tại 30 ngày giống các web lớn
        $cookieParams = session_get_cookie_params();
        setcookie(
            session_name(),
            session_id(),
            time() + 86400 * 30, // 30 ngày
            $cookieParams['path'],
            $cookieParams['domain'] ?? '',
            $cookieParams['secure'],
            $cookieParams['httponly']
        );
        // Đặt cookie đăng nhập cho frontend tồn tại 30 ngày
        setcookie('ewm_logged_in', '1', time() + 86400 * 30, '/');
    } else {
        // Không ghi nhớ: Cookie session biến mất khi đóng trình duyệt
        setcookie('ewm_logged_in', '1', 0, '/');
    }
    
    // Cập nhật log đăng nhập cuối
    $updateLogin = $pdo->prepare('UPDATE users SET last_login_at = NOW(), login_attempts = 0, attempt_lock_until = NULL WHERE id = ?');
    $updateLogin->execute([(int) $user['id']]);
    
    log_user_activity('login_otp_verify_success', ['email' => $email]);
    
    json_response([
        'ok' => true,
        'message' => 'Đăng nhập thành công! Đang chuyển hướng...',
        'redirect' => (($user['role'] ?? 'user') === 'admin') ? 'admin.html' : 'profile.html#dashboard',
        'user' => current_user_payload($user)
    ]);
    
} catch (Throwable $e) {
    log_user_activity('login_otp_verify_failed', ['email' => $email, 'error' => $e->getMessage()]);
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
}
