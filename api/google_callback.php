<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

start_app_session();

$code = trim((string) ($_GET['code'] ?? ''));
if ($code === '') {
    exit('Authorization code not provided.');
}

$clientId = getenv('GOOGLE_CLIENT_ID');
$clientSecret = getenv('GOOGLE_CLIENT_SECRET');
$redirectUri = getenv('GOOGLE_REDIRECT_URI');

try {
    // 1. Trao đổi mã code lấy Access Token qua cURL
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
    
    // 2. Lấy thông tin hồ sơ của người dùng từ API Google
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
    
    $email = strtolower(trim($profile['email']));
    $fullName = trim($profile['name'] ?? 'Học viên Google');
    $avatar = trim($profile['picture'] ?? '');

    $pdo = db();
    
    // 3. Kiểm tra xem người dùng đã tồn tại trong DB chưa
    $statement = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $statement->execute([$email]);
    $user = $statement->fetch();
    
    if (!$user) {
        // Tự động đăng ký mới vì Google đã xác thực email này là thật
        $randomPassword = bin2hex(random_bytes(16)); // Tạo mật khẩu ngẫu nhiên bảo mật
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
        
        // Lấy lại dữ liệu người dùng vừa tạo
        $statement = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $statement->execute([$userId]);
        $user = $statement->fetch();
    } else {
        // Nếu người dùng đang ở trạng thái pending, tự động kích hoạt tài khoản ngay vì họ dùng Google Login thành công
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
    
    // Kiểm tra nếu tài khoản bị khóa
    if (($user['status'] ?? 'active') !== 'active') {
        throw new Exception('Tài khoản của bạn hiện đang bị khóa.');
    }
    
    // Lưu session đăng nhập
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    
    $updateLogin = $pdo->prepare('UPDATE users SET last_login_at = NOW(), login_attempts = 0, attempt_lock_until = NULL WHERE id = ?');
    $updateLogin->execute([(int) $user['id']]);

    log_user_activity('google_login_success', ['email' => $email]);
    
    // Trả về trang trung gian đồng bộ LocalStorage và chuyển hướng
    $payload = current_user_payload($user);
    $payloadJson = json_encode($payload, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
    
    echo '
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>Đang đồng bộ hóa đăng nhập...</title>
        <style>
            body { font-family: sans-serif; background: #0f172a; color: #ffffff; display: flex; height: 100vh; align-items: center; justify-content: center; margin: 0; }
            .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #10ac84; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .container { text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="loader" style="margin: 0 auto 20px;"></div>
            <p>Đăng nhập bằng Google thành công. Đang tải dữ liệu hồ sơ cá nhân của bạn...</p>
        </div>
        <script>
            const user = ' . $payloadJson . ';
            localStorage.setItem("engWithMeStudentName", user.name || "");
            localStorage.setItem("engWithMeGoal", user.goal || "");
            localStorage.setItem("engWithMeLevel", user.level || "A1");
            localStorage.setItem("engWithMeUserEmail", user.email || "");
            localStorage.setItem("engWithMeUserRole", user.role || "user");
            localStorage.setItem("engWithMeUserStatus", user.status || "active");
            localStorage.setItem("engWithMeUserId", String(user.id || ""));
            localStorage.setItem("engWithMeUserAvatar", user.avatar || "");
            
            // Chuyển hướng về trang dashboard tương ứng
            const redirectUrl = (user.role === "admin") ? "../admin.html" : "../profile.html#dashboard";
            window.location.href = redirectUrl;
        </script>
    </body>
    </html>';
    exit;

} catch (Throwable $e) {
    log_user_activity('google_login_failed', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo '
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>Lỗi Đăng Nhập Google</title>
        <style>
            body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }
            .card { max-width: 500px; margin: 50px auto; background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #ef4444; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
            h1 { color: #ef4444; font-size: 20px; margin-top: 0; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 20px; transition: background 0.2s; }
            .btn:hover { background: #2563eb; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Đăng nhập Google thất bại</h1>
            <p>Mô tả lỗi: ' . htmlspecialchars($e->getMessage()) . '</p>
            <a href="../login.html" class="btn">Quay lại Trang Đăng Nhập</a>
        </div>
    </body>
    </html>';
    exit;
}
