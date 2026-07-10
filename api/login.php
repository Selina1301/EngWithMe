<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$email = strtolower(trim((string) ($_POST['email'] ?? '')));
$password = (string) ($_POST['password'] ?? '');

if ($email === '' || $password === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng nhập email và mật khẩu.'], 422);
}

try {
    $statement = db()->prepare(
        'SELECT id, full_name, email, password, role, level, learning_goal, avatar_path, status, created_at, last_login_at, login_attempts, attempt_lock_until
         FROM users
         WHERE email = ?
         LIMIT 1'
    );
    $statement->execute([$email]);
    $user = $statement->fetch();

    $storedPassword = $user ? (string) $user['password'] : '';
    
    // Check Rate Limiting First
    if ($user && !empty($user['attempt_lock_until'])) {
        $lockUntil = strtotime($user['attempt_lock_until']);
        if (time() < $lockUntil) {
            json_response(['ok' => false, 'message' => 'Tài khoản bị tạm khóa 15 phút do nhập sai quá nhiều lần.'], 429);
        }
    }

    $passwordIsValid = $user && password_verify($password, $storedPassword);

    if (!$passwordIsValid && $user && hash_equals($storedPassword, $password)) {
        $passwordIsValid = true;
        $rehash = db()->prepare('UPDATE users SET password = ? WHERE id = ?');
        $rehash->execute([password_hash($password, PASSWORD_DEFAULT), (int) $user['id']]);
    }

    if (!$user || !$passwordIsValid) {
        if ($user) {
            // Increment failed attempts
            $attempts = (int) $user['login_attempts'] + 1;
            if ($attempts >= 5) {
                $lock = db()->prepare('UPDATE users SET login_attempts = ?, attempt_lock_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?');
                $lock->execute([$attempts, (int) $user['id']]);
            } else {
                $inc = db()->prepare('UPDATE users SET login_attempts = ? WHERE id = ?');
                $inc->execute([$attempts, (int) $user['id']]);
            }
        }
        log_user_activity('login_failed', ['email' => $email, 'reason' => 'invalid_credentials']);
        json_response(['ok' => false, 'message' => 'Email hoặc mật khẩu không đúng.'], 401);
    }

    if (($user['status'] ?? 'active') === 'pending') {
        json_response(['ok' => false, 'message' => 'Tài khoản chưa được kích hoạt email. Vui lòng xác thực qua liên kết kích hoạt đã gửi tới email của bạn.'], 403);
    }

    if (($user['status'] ?? 'active') !== 'active') {
        json_response(['ok' => false, 'message' => 'Tài khoản đang bị khóa.'], 403);
    }

    // Kiểm tra nếu là Admin -> Bỏ qua OTP, đăng nhập trực tiếp
    if (($user['role'] ?? 'user') === 'admin') {
        // Xóa mã OTP cũ (nếu có), cập nhật log đăng nhập cuối, reset login_attempts
        $updateAdmin = db()->prepare('UPDATE users SET verification_token = NULL, last_login_at = NOW(), login_attempts = 0, attempt_lock_until = NULL WHERE id = ?');
        $updateAdmin->execute([(int) $user['id']]);

        // Đọc trạng thái Ghi nhớ từ client (nếu có)
        // Dữ liệu client gửi lên dưới dạng JSON hoặc Form Data
        $inputData = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $remember = isset($inputData['remember']) && ($inputData['remember'] === '1' || $inputData['remember'] === true || $inputData['remember'] === 1 || $inputData['remember'] === 'true');

        // Tạo session đăng nhập chính thức
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $user['id'];

        if ($remember) {
            $cookieParams = session_get_cookie_params();
            setcookie(
                session_name(),
                session_id(),
                time() + 86400 * 30,
                $cookieParams['path'],
                $cookieParams['domain'],
                $cookieParams['secure'],
                $cookieParams['httponly']
            );
            setcookie('ewm_logged_in', '1', time() + 86400 * 30, '/');
        } else {
            setcookie('ewm_logged_in', '1', 0, '/');
        }

        log_user_activity('login_success_direct_admin', ['email' => $user['email']]);

        json_response([
            'ok' => true,
            'requires_otp' => false,
            'message' => 'Đăng nhập Admin thành công. Đang chuyển hướng...',
            'redirect' => 'index.html',
            'user' => [
                'id' => (int) $user['id'],
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'level' => $user['level']
            ]
        ]);
    }

    // Mỗi lần đăng nhập đều bắt buộc xác thực OTP (Bảo mật 2FA chuẩn các web lớn)
    $otp = (string) rand(100000, 999999);
    
    $updateOtp = db()->prepare('UPDATE users SET verification_token = ? WHERE id = ?');
    $updateOtp->execute([$otp, (int) $user['id']]);
    
    $subject = 'EngWithMe - Hoàn tất yêu cầu đăng nhập của bạn';
    $htmlBody = '
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03); text-align: center;">
        <div style="margin-bottom: 25px;">
            <h2 style="color: #2e86de; margin: 0; font-size: 28px; font-weight: bold;">EngWithMe</h2>
            <p style="font-size: 14px; color: #475569; font-weight: bold; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Xác nhận bảo mật đăng nhập</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 25px;">
        <div style="text-align: left; font-size: 15px; color: #334155; line-height: 1.6;">
            <p>Chào <strong>' . htmlspecialchars($user['full_name']) . '</strong>,</p>
            <p>Chúng tôi đã nhận được yêu cầu đăng nhập vào tài khoản học tiếng Anh EngWithMe của bạn. Để xác thực đây là bạn và tiếp tục phiên làm việc, vui lòng nhập mã xác nhận gồm 6 chữ số dưới đây:</p>
        </div>
        <div style="margin: 30px auto; background-color: #f8fafc; padding: 20px 40px; border-radius: 10px; display: inline-block; border: 1px solid #cbd5e1;">
            <span style="font-size: 34px; font-weight: bold; color: #1e3a8a; letter-spacing: 8px; font-family: monospace;">' . $otp . '</span>
        </div>
        <div style="text-align: left; font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 25px;">
            <p>Mã xác nhận này sẽ hết hiệu lực sau 10 phút. Để giữ an toàn cho tài khoản của bạn, vui lòng tuyệt đối không chia sẻ mã này với người khác.</p>
            <p style="margin-top: 10px;">Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email một cách an toàn hoặc liên hệ hỗ trợ để khóa tài khoản tạm thời.</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 20px;">
        <div style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
            <p>Đây là email tự động gửi từ hệ thống học tiếng Anh trực tuyến EngWithMe.</p>
            <p>Toà nhà Innovation, Công viên phần mềm Quang Trung, Quận 12, TP. Hồ Chí Minh | Hỗ trợ: support@engwithme.com</p>
        </div>
    </div>';
    
    $mailSent = send_mail($user['email'], $subject, $htmlBody);
    
    if (!$mailSent) {
        json_response(['ok' => false, 'message' => 'Không thể gửi mã xác thực đăng nhập qua email. Vui lòng thử lại.'], 500);
    }
    
    log_user_activity('login_otp_generated', ['email' => $user['email']]);
    
    json_response([
        'ok' => true,
        'requires_otp' => true,
        'email' => $user['email'],
        'message' => 'Một mã OTP gồm 6 số đã được gửi thẳng tới Gmail của bạn. Vui lòng nhập mã để hoàn tất đăng nhập.'
    ]);
} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Không thể đăng nhập lúc này. Kiểm tra kết nối database.'], 500);
}
