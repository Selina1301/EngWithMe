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

// Tự động nhận diện Redirect URI động theo domain và giao thức hiện tại (HTTP/HTTPS)
$protocol = "http";
if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
    (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')) {
    $protocol = "https";
}
$host = $_SERVER['HTTP_HOST'];
$scriptPath = $_SERVER['SCRIPT_NAME'];
$projectPath = str_replace('api/google_callback.php', '', $scriptPath);
$redirectUri = $protocol . "://" . $host . $projectPath . "api/google_callback.php";

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
    
    // 4. Kiểm tra tài khoản đã tồn tại trong DB chưa
    $statement = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $statement->execute([$email]);
    $user = $statement->fetch();
    
    if (!$user) {
        // Tự động đăng ký mới vì Google đã xác thực email này là thật
        $randomPassword = bin2hex(random_bytes(16)); // Mật khẩu ngẫu nhiên an toàn
        $insert = $pdo->prepare(
            'INSERT INTO users (full_name, email, password, role, level, status, avatar_path)
             VALUES (?, ?, ?, "user", "A1", "active", ?)'
        );
        $insert->execute([
            $fullName,
            $email,
            password_hash($randomPassword, PASSWORD_DEFAULT),
            $avatar !== '' ? $avatar : null
        ]);
        
        $userId = (int) $pdo->lastInsertId();
        
        // Lấy thông tin user vừa tạo
        $statement = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $statement->execute([$userId]);
        $user = $statement->fetch();
    } else {
        // Tự động kích hoạt nếu tài khoản đang ở trạng thái chờ (pending)
        if (($user['status'] ?? 'active') === 'pending') {
            $activate = $pdo->prepare('UPDATE users SET status = "active", verification_token = NULL WHERE id = ?');
            $activate->execute([(int) $user['id']]);
            $user['status'] = 'active';
        }
        
        // Cập nhật ảnh đại diện từ Google nếu người dùng chưa có ảnh
        if (empty($user['avatar_path']) && $avatar !== '') {
            $updateAvatar = $pdo->prepare('UPDATE users SET avatar_path = ? WHERE id = ?');
            $updateAvatar->execute([$avatar, (int) $user['id']]);
            $user['avatar_path'] = $avatar;
        }
    }
    
    // Kiểm tra tài khoản có bị khóa không
    if (($user['status'] ?? 'active') !== 'active') {
        throw new Exception('Tài khoản của bạn hiện đang bị khóa.');
    }
    
    // 5. Lưu phiên làm việc (Session) đăng nhập
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    setcookie('ewm_logged_in', '1', time() + 86400 * 30, '/');
    
    $updateLogin = $pdo->prepare('UPDATE users SET last_login_at = NOW(), login_attempts = 0, attempt_lock_until = NULL WHERE id = ?');
    $updateLogin->execute([(int) $user['id']]);

    log_user_activity('google_login_success', ['email' => $email]);
    
    // Chuyển hướng trực tiếp về Dashboard/Profile (initAuthNav của frontend sẽ tự gọi api/me.php đồng bộ localStorage)
    $redirectUrl = ($user['role'] === 'admin') ? '../admin.html' : '../profile.html#dashboard';
    header("Location: " . $redirectUrl);
    exit;

} catch (Throwable $e) {
    error_log("Google OAuth Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    log_user_activity('google_login_failed', ['error' => $e->getMessage()]);
    
    header("Location: ../login.html?error=google_failed");
    exit;
}
