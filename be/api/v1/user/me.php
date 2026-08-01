<?php
declare(strict_types=1);

require_once __DIR__ . '/../../helpers.php';

start_app_session();

try {
    $user = find_current_user();
    if ($user) {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') 
            || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');

        setcookie('ewm_logged_in', '1', [
            'expires' => time() + 86400 * 30,
            'path' => '/',
            'secure' => $isHttps,
            'httponly' => false,
            'samesite' => 'Lax'
        ]);
        if (!empty($user['remember_token'])) {
            setcookie('ewm_trusted_device', $user['id'] . ':' . $user['remember_token'], [
                'expires' => time() + 86400 * 30,
                'path' => '/',
                'secure' => $isHttps,
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
        }
        json_response(['ok' => true, 'user' => current_user_payload($user)]);
    } else {
        json_response(['ok' => false, 'user' => null, 'message' => 'Chưa đăng nhập.']);
    }
} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Không thể tải thông tin tài khoản.'], 500);
}
