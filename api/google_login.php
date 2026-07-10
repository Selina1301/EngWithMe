<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

// Kiểm tra cấu hình Client ID và Secret trong .env
$clientId = getenv('GOOGLE_CLIENT_ID');
$clientSecret = getenv('GOOGLE_CLIENT_SECRET');

// Tự động nhận diện Redirect URI động theo domain hoặc lấy từ cấu hình .env
$redirectUri = getenv('GOOGLE_REDIRECT_URI');
$currentHost = $_SERVER['HTTP_HOST'] ?? 'localhost';
$isLocalhost = (str_starts_with($currentHost, 'localhost') || str_starts_with($currentHost, '127.0.0.1'));

// Nếu cấu hình .env là localhost nhưng người dùng đang truy cập qua Tunnel (như Cloudflare, ngrok...)
// ta sẽ tự động chuyển sang sử dụng Redirect URI động theo domain thực tế để tránh lỗi redirect_uri_mismatch
if (empty($redirectUri) || (!$isLocalhost && str_contains($redirectUri, 'localhost'))) {
    $protocol = "http";
    if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
        (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')) {
        $protocol = "https";
    }
    $host = $_SERVER['HTTP_HOST'];
    $scriptPath = $_SERVER['SCRIPT_NAME'];
    $projectPath = str_replace('api/google_login.php', '', $scriptPath);
    $redirectUri = $protocol . "://" . $host . $projectPath . "api/google_callback.php";
}

$isConfigured = (!empty($clientId) && !empty($clientSecret));

if (!$isConfigured) {
    header("Location: ../login.html?error=google_failed");
    exit;
}

// Thực hiện luồng chuyển hướng Google thật
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
