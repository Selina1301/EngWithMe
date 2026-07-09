<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

// Kiểm tra cấu hình trong .env
$clientId = getenv('GOOGLE_CLIENT_ID');
$redirectUri = getenv('GOOGLE_REDIRECT_URI');

if (!$clientId || !$redirectUri) {
    http_response_code(400);
    echo '
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cấu hình Google OAuth2 chưa hoàn tất</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; line-height: 1.6; }
            .card { max-width: 600px; margin: 40px auto; background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid rgba(125, 211, 252, 0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
            h1 { color: #38bdf8; font-size: 22px; margin-top: 0; }
            code { background: #020617; padding: 4px 8px; border-radius: 4px; color: #f43f5e; font-family: monospace; font-size: 14px; }
            ol { padding-left: 20px; }
            li { margin-bottom: 12px; font-size: 15px; }
            .btn { display: inline-block; background: #10ac84; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; transition: background 0.2s; }
            .btn:hover { background: #0e906f; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Cấu hình Đăng nhập Google (OAuth2) chưa hoàn tất</h1>
            <p>Hệ thống Đăng nhập Google đã được chuẩn bị sẵn sàng, tuy nhiên bạn cần cấu hình Google Client ID của riêng mình để chạy thực tế:</p>
            <ol>
                <li>Truy cập <a href="https://console.cloud.google.com/" target="_blank" style="color: #38bdf8; text-decoration: none;">Google Cloud Console</a>.</li>
                <li>Tạo một dự án mới và tạo thông tin xác thực <strong>OAuth Client ID</strong> (chọn loại ứng dụng: <em>Web Application</em>).</li>
                <li>Thêm URI chuyển hướng được ủy quyền là: <br><code>' . htmlspecialchars($redirectUri ?: 'http://localhost/projects/Demo_Study_English/api/google_callback.php') . '</code></li>
                <li>Mở file <code>.env</code> trong thư mục dự án và thêm các trường sau:
                    <pre style="background:#020617; padding:15px; border-radius:6px; overflow-x:auto; color: #a5b4fc; font-family: monospace; font-size: 13px; border: 1px solid rgba(255,255,255,0.05);">GOOGLE_CLIENT_ID="MÃ_CLIENT_ID_CỦA_BẠN"
GOOGLE_CLIENT_SECRET="MÃ_CLIENT_SECRET_CỦA_BẠN"
GOOGLE_REDIRECT_URI="http://localhost/projects/Demo_Study_English/api/google_callback.php"</pre>
                </li>
            </ol>
            <a href="../login.html" class="btn">Quay lại Trang Đăng Nhập</a>
        </div>
    </body>
    </html>';
    exit;
}

// Sinh Google Auth URL
$authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" . http_build_query([
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'response_type' => 'code',
    'scope' => 'openid email profile',
    'state' => bin2hex(random_bytes(16)),
    'prompt' => 'select_account'
]);

header("Location: " . $authUrl);
exit;
