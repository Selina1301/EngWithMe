<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

start_app_session();

// 1. Kiểm tra mã Authorization Code và State bảo mật (Chống CSRF)
$code = trim((string) ($_GET['code'] ?? ''));
$state = trim((string) ($_GET['state'] ?? ''));
$sessionState = $_SESSION['oauth_state'] ?? '';

// Hủy state trong session ngay để ngăn chặn Replay Attack
unset($_SESSION['oauth_state']);

if ($state === '' || $sessionState === '' || $state !== $sessionState) {
    error_log("Google OAuth CSRF token mismatch or session expired.");
    header("Location: ../login.html?error=csrf_mismatch");
    exit;
}

if ($code === '') {
    header("Location: ../login.html?error=code_missing");
    exit;
}

$clientId = getenv('GOOGLE_CLIENT_ID');
$clientSecret = getenv('GOOGLE_CLIENT_SECRET');

// Sử dụng cấu hình GOOGLE_REDIRECT_URI chuẩn từ .env để khớp 100% với Google Console
$redirectUri = trim((string) getenv('GOOGLE_REDIRECT_URI'));
if ($redirectUri !== '') {
    // Tự động làm sạch các tiền tố trùng lặp như https://https://
    while (preg_match('#^https?://https?://#i', $redirectUri)) {
        $redirectUri = preg_replace('#^https?://#i', '', $redirectUri);
    }
}

if (empty($redirectUri)) {
    $protocol = "http";
    if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
        (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')) {
        $protocol = "https";
    }
    $host = $_SERVER['HTTP_HOST'];
    $scriptPath = $_SERVER['SCRIPT_NAME'];
    $projectPath = str_replace('api/google_callback.php', '', $scriptPath);
    $redirectUri = $protocol . "://" . $host . $projectPath . "api/google_callback.php";
}

try {
    // 2. Trao đổi Authorization Code lấy Access Token
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'code' => $code,
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'redirect_uri' => $redirectUri,
        'grant_type' => 'authorization_code'
    ]));
    
    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        throw new Exception('Lỗi kết nối mạng cURL: ' . curl_error($ch));
    }
    curl_close($ch);
    
    $tokenData = json_decode($response, true);
    if (!isset($tokenData['access_token'])) {
        throw new Exception('Không lấy được Token từ Google: ' . ($tokenData['error_description'] ?? json_encode($tokenData)));
    }
    
    $accessToken = $tokenData['access_token'];
    
    // 3. Lấy thông tin hồ sơ người dùng từ Google API
    $ch = curl_init('https://www.googleapis.com/oauth2/v3/userinfo');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken
    ]);
    
    $profileResponse = curl_exec($ch);
    curl_close($ch);
    
    $profile = json_decode($profileResponse, true);
    if (!isset($profile['email'])) {
        throw new Exception('Không thể lấy thông tin Email từ tài khoản Google.');
    }

    // Đảm bảo tài khoản Google đã xác thực email này
    $emailVerified = filter_var($profile['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
    if (!$emailVerified) {
        throw new Exception('Tài khoản Google này chưa được xác minh email.');
    }
    
    $email = strtolower(trim($profile['email']));
    $fullName = trim($profile['name'] ?? 'Học viên Google');
    $avatar = trim($profile['picture'] ?? '');

    $pdo = db();
    
    $statement = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $statement->execute([$email]);
    $user = $statement->fetch();

    $trustedCookie = (string) ($_COOKIE['ewm_trusted_device'] ?? '');
    $isDeviceTrusted = false;
    if ($user && $trustedCookie !== '' && str_contains($trustedCookie, ':')) {
        list($cookieUserId, $cookieToken) = explode(':', $trustedCookie, 2);
        if ((int) $cookieUserId === (int) $user['id'] 
            && !empty($user['remember_token']) 
            && hash_equals((string) $user['remember_token'], $cookieToken)
            && !empty($user['remember_until'])
            && strtotime($user['remember_until']) > time()) {
            $isDeviceTrusted = true;
        }
    }

    $isAdmin = $user && ($user['role'] ?? 'user') === 'admin';

    // Nếu thiết bị chưa được Ghi nhớ 7 ngày -> BẮT BUỘC gửi mã OTP về Email và hiện Modal OTP trên login.html
    if (!$isDeviceTrusted && !$isAdmin) {
        $otp = (string) rand(100000, 999999);
        if (!$user) {
            $randomPassword = bin2hex(random_bytes(16));
            $insert = $pdo->prepare(
                'INSERT INTO users (full_name, email, password, role, level, status, verification_token, avatar_path)
                 VALUES (?, ?, ?, "user", "A1", "pending", ?, ?)'
            );
            $insert->execute([
                $fullName,
                $email,
                password_hash($randomPassword, PASSWORD_DEFAULT),
                $otp,
                $avatar !== '' ? $avatar : null
            ]);
        } else {
            $updateOtp = $pdo->prepare('UPDATE users SET verification_token = ?, status = IF(status = "locked", "locked", "pending") WHERE id = ?');
            $updateOtp->execute([$otp, (int) $user['id']]);
        }

        // Kiểm tra tài khoản có bị khóa không
        if ($user && ($user['status'] ?? 'active') === 'locked') {
            throw new Exception('Tài khoản của bạn hiện đang bị khóa.');
        }

        // Gửi email chứa mã OTP xác thực
        $subject = 'EngWithMe - Mã OTP xác thực Đăng nhập Google';
        $htmlBody = '
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; text-align: center;">
            <h2 style="color: #2e86de; margin: 0;">EngWithMe</h2>
            <p style="font-size: 14px; color: #475569; font-weight: bold; text-transform: uppercase;">Mã OTP xác thực đăng nhập Google</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="text-align: left; color: #334155;">Chào <strong>' . htmlspecialchars($user['full_name'] ?? $fullName) . '</strong>,</p>
            <p style="text-align: left; color: #334155;">Mã xác thực OTP 6 số để đăng nhập tài khoản EngWithMe qua Google của bạn là:</p>
            <div style="margin: 25px auto; background-color: #f8fafc; padding: 15px 30px; border-radius: 10px; display: inline-block; border: 1px solid #cbd5e1;">
                <span style="font-size: 32px; font-weight: bold; color: #1e3a8a; letter-spacing: 6px; font-family: monospace;">' . $otp . '</span>
            </div>
            <p style="text-align: left; font-size: 13px; color: #64748b;">Mã này có hiệu lực trong 10 phút.</p>
        </div>';

        send_mail($email, $subject, $htmlBody);
        log_user_activity('google_login_otp_generated', ['email' => $email]);

        // Chuyển hướng về login.html kèm cờ otp_sent=1 và email để tự động bật Modal OTP
        header("Location: ../login.html?otp_sent=1&email=" . urlencode($email));
        exit;
    }

    // Tự động kích hoạt nếu tài khoản đang ở trạng thái chờ (pending)
    if ($user && ($user['status'] ?? 'active') === 'pending') {
        $activate = $pdo->prepare('UPDATE users SET status = "active", verification_token = NULL WHERE id = ?');
        $activate->execute([(int) $user['id']]);
        $user['status'] = 'active';
    }
    
    // Cập nhật ảnh đại diện từ Google nếu người dùng chưa có ảnh
    if ($user && empty($user['avatar_path']) && $avatar !== '') {
        $updateAvatar = $pdo->prepare('UPDATE users SET avatar_path = ? WHERE id = ?');
        $updateAvatar->execute([$avatar, (int) $user['id']]);
        $user['avatar_path'] = $avatar;
    }
    
    // Kiểm tra tài khoản có bị khóa không
    if (($user['status'] ?? 'active') !== 'active') {
        throw new Exception('Tài khoản của bạn hiện đang bị khóa.');
    }
    
    // 5. Lưu phiên làm việc (Session) đăng nhập
    $_SESSION = [];
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    setcookie('ewm_logged_in', '1', time() + 86400 * 30, '/');
    
    $updateLogin = $pdo->prepare('UPDATE users SET last_login_at = NOW(), login_attempts = 0, attempt_lock_until = NULL, verification_token = NULL WHERE id = ?');
    $updateLogin->execute([(int) $user['id']]);

    log_user_activity('google_login_success', ['email' => $email]);
    
    // Chuyển hướng trực tiếp về Dashboard/Profile (initAuthNav của frontend sẽ tự gọi api/me.php đồng bộ localStorage)
    $redirectUrl = ($user['role'] === 'admin') ? '../admin.html?login=google' : '../profile.html?login=google#dashboard';
    header("Location: " . $redirectUrl);
    exit;

} catch (Throwable $e) {
    error_log("Google OAuth Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    log_user_activity('google_login_failed', ['error' => $e->getMessage()]);
    
    header("Location: ../login.html?error=google_failed");
    exit;
}
