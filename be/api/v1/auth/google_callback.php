<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../helpers.php';

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

    if (!$user) {
        $randomPassword = bin2hex(random_bytes(16));
        $insert = $pdo->prepare(
            'INSERT INTO users (full_name, email, password, role, level, status, avatar_path, created_at)
             VALUES (?, ?, ?, "user", "A1", "active", ?, NOW())'
        );
        $insert->execute([
            $fullName,
            $email,
            password_hash($randomPassword, PASSWORD_DEFAULT),
            $avatar !== '' ? $avatar : null
        ]);
        $newId = (int) $pdo->lastInsertId();

        $stmtNew = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $stmtNew->execute([$newId]);
        $user = $stmtNew->fetch();
    } else {
        if (($user['status'] ?? 'active') === 'locked') {
            throw new Exception('Tài khoản của bạn hiện đang bị khóa.');
        }

        if (($user['status'] ?? 'active') === 'pending') {
            $activate = $pdo->prepare('UPDATE users SET status = "active", verification_token = NULL WHERE id = ?');
            $activate->execute([(int) $user['id']]);
            $user['status'] = 'active';
        }

        if (empty($user['avatar_path']) && $avatar !== '') {
            $updateAvatar = $pdo->prepare('UPDATE users SET avatar_path = ? WHERE id = ?');
            $updateAvatar->execute([$avatar, (int) $user['id']]);
            $user['avatar_path'] = $avatar;
        }
    }
    
    // 5. Lưu phiên làm việc (Session) & Token đăng nhập đa tên miền (SSO Multi-domain)
    $_SESSION = [];
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];

    $token = generate_remember_token();

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
    
    $updateLogin = $pdo->prepare('UPDATE users SET last_login_at = NOW(), login_attempts = 0, attempt_lock_until = NULL, verification_token = NULL, remember_token = ?, remember_until = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE id = ?');
    $updateLogin->execute([$token, (int) $user['id']]);

    log_user_activity('google_login_success', ['email' => $email]);
    
    // Chuyển hướng trực tiếp về trang yêu cầu hoặc Dashboard/Profile kèm auth_token và user_id
    $baseRedirect = ($user['role'] === 'admin') ? '../admin.html' : '../profile.html';
    if (!empty($_SESSION['auth_redirect'])) {
        $baseRedirect = '../' . ltrim($_SESSION['auth_redirect'], '/');
        unset($_SESSION['auth_redirect']);
    }

    $sep = str_contains($baseRedirect, '?') ? '&' : '?';
    $redirectUrl = $baseRedirect . $sep . 'login=google_success&auth_token=' . urlencode($token) . '&user_id=' . $user['id'] . '#dashboard';
    header("Location: " . $redirectUrl);
    exit;

} catch (Throwable $e) {
    error_log("Google OAuth Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    log_user_activity('google_login_failed', ['error' => $e->getMessage()]);
    
    header("Location: ../login.html?error=google_failed");
    exit;
}
