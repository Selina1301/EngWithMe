<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

// Kiểm tra cấu hình Client ID và Secret trong .env
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
$projectPath = str_replace('api/google_login.php', '', $scriptPath);
$redirectUri = $protocol . "://" . $host . $projectPath . "api/google_callback.php";

$isConfigured = (!empty($clientId) && !empty($clientSecret));

// Xử lý đăng nhập giả lập (Mock Google Login) làm phương án dự phòng khi CHƯA có Client Secret
$errorMsg = '';
if (!$isConfigured && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = strtolower(trim($_POST['email'] ?? ''));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errorMsg = "Địa chỉ email không hợp lệ. Vui lòng thử lại.";
    } else {
        try {
            $pdo = db();
            
            // Tìm tài khoản theo email
            $statement = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
            $statement->execute([$email]);
            $user = $statement->fetch();
            
            if (!$user) {
                // Tự động đăng ký tài khoản mới giả lập Google
                $parts = explode('@', $email);
                $fullName = ucwords(str_replace(['.', '_', '-'], ' ', $parts[0]));
                $randomPassword = bin2hex(random_bytes(16));
                
                $insert = $pdo->prepare(
                    'INSERT INTO users (full_name, email, password, role, level, status)
                     VALUES (?, ?, ?, "user", "A1", "active")'
                );
                $insert->execute([
                    $fullName,
                    $email,
                    password_hash($randomPassword, PASSWORD_DEFAULT)
                ]);
                
                $userId = (int) $pdo->lastInsertId();
                
                $statement = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
                $statement->execute([$userId]);
                $user = $statement->fetch();
            }
            
            if (($user['status'] ?? 'active') !== 'active') {
                $errorMsg = "Tài khoản của bạn hiện đang bị khóa.";
            } else {
                // Đăng nhập thành công và lưu session
                start_app_session();
                session_regenerate_id(true);
                $_SESSION['user_id'] = (int) $user['id'];
                setcookie('ewm_logged_in', '1', time() + 86400 * 30, '/');
                
                $updateLogin = $pdo->prepare('UPDATE users SET last_login_at = NOW(), login_attempts = 0, attempt_lock_until = NULL WHERE id = ?');
                $updateLogin->execute([(int) $user['id']]);
                
                log_user_activity('google_login_success', ['email' => $email, 'mode' => 'mock']);
                
                // Điều hướng về trang dashboard tương ứng
                $redirectUrl = ($user['role'] === 'admin') ? '../admin.html' : '../profile.html#dashboard';
                header("Location: " . $redirectUrl);
                exit;
            }
        } catch (Throwable $e) {
            $errorMsg = "Lỗi hệ thống: " . $e->getMessage();
        }
    }
}

// NẾU ĐÃ CẤU HÌNH ĐẦY ĐỦ -> Thực hiện luồng chuyển hướng Google thật
if ($isConfigured) {
    start_app_session();
    $state = bin2hex(random_bytes(16));
    $_SESSION['oauth_state'] = $state;

    $authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" . http_build_query([
        'client_id' => $clientId,
        'redirect_uri' => $redirectUri,
        'response_type' => 'code',
        'scope' => 'openid email profile',
        'state' => $state,
        'prompt' => 'select_account'
    ]);

    header("Location: " . $authUrl);
    exit;
}

// NẾU CHƯA CẤU HÌNH -> Hiển thị Form Đăng nhập Google giả lập
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng nhập bằng tài khoản Google (Bản Demo)</title>
    <link rel="icon" href="../assets/icons/theme/logoEW.png" type="image/png">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #0f172a;
            color: #f1f5f9;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .login-card {
            background: #1e293b;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            width: 100%;
            max-width: 420px;
            padding: 40px 30px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        .google-logo {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 24px;
        }
        .google-logo svg {
            width: 48px;
            height: 48px;
        }
        h1 {
            font-size: 24px;
            font-weight: 500;
            margin-bottom: 8px;
            color: #f8fafc;
        }
        .subtitle {
            font-size: 15px;
            color: #94a3b8;
            margin-bottom: 30px;
        }
        .demo-badge {
            display: inline-block;
            background: rgba(245, 158, 11, 0.15);
            color: #fbbf24;
            padding: 4px 10px;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 15px;
            border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .form-group {
            margin-bottom: 24px;
            text-align: left;
        }
        .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #94a3b8;
            margin-bottom: 8px;
        }
        .input-control {
            width: 100%;
            background: #0f172a;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 6px;
            padding: 12px 16px;
            color: #ffffff;
            font-size: 15px;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-control:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }
        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #f87171;
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            margin-bottom: 20px;
            text-align: left;
        }
        .btn-submit {
            width: 100%;
            background: #2563eb;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            padding: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        .btn-submit:hover {
            background: #1d4ed8;
        }
        .footer-links {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            font-size: 13px;
        }
        .footer-links a {
            color: #3b82f6;
            text-decoration: none;
        }
        .footer-links a:hover {
            text-decoration: underline;
        }
        .notice {
            margin-top: 25px;
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="login-card">
        <div class="google-logo">
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48C21.68,11.87 21.56,11.23 21.35,11.1Z" fill="#4285F4" />
                    <path d="M12,21.9c2.43,0 4.47,-0.81 5.96,-2.18l-3.3,-2.58c-0.9,0.6 -2.07,0.98 -2.66,0.98 -2.34,0 -4.33,-1.58 -5.04,-3.71H3.54v2.33C5.02,18.73 8.3,21.9 12,21.9Z" fill="#34A853" />
                    <path d="M6.96,14.41c-0.18,-0.54 -0.28,-1.11 -0.28,-1.71c0,-0.6 0.1,-1.17 0.28,-1.71V8.67H3.54C2.93,9.88 2.58,11.25 2.58,12.7c0,1.45 0.35,2.82 0.96,4.03L6.96,14.41Z" fill="#FBBC05" />
                    <path d="M12,6.02c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,3.29 14.43,2.49 12,2.49C8.3,2.49 5.02,5.66 3.54,8.67l3.42,2.33C7.67,7.6 9.66,6.02,12,6.02Z" fill="#EA4335" />
                </g>
            </svg>
        </div>
        
        <span class="demo-badge">Chế độ Demo Tunnels</span>
        
        <h1>Đăng nhập</h1>
        <p class="subtitle">Sử dụng Tài khoản Google để tiếp tục học</p>

        <?php if ($errorMsg !== ''): ?>
            <div class="error-message">
                <?= htmlspecialchars($errorMsg) ?>
            </div>
        <?php endif; ?>

        <form action="" method="POST">
            <div class="form-group">
                <label for="email">Địa chỉ Gmail</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    class="input-control" 
                    placeholder="user@gmail.com" 
                    required 
                    autocomplete="email"
                    focus
                >
            </div>
            
            <button type="submit" class="btn-submit">Tiếp theo</button>
        </form>

        <div class="footer-links">
            <a href="../login.html">Quay lại đăng nhập thường</a>
            <a href="#" onclick="alert('Ở chế độ Demo, bạn chỉ cần điền bất kỳ Gmail nào để đăng nhập ngay mà không cần mật khẩu.'); return false;">Trợ giúp</a>
        </div>

        <p class="notice">
            * Hệ thống tự động chuyển sang chế độ Demo do phát hiện dự án chưa được điền Google Client Secret trong file .env.
        </p>
    </div>
</body>
</html>
