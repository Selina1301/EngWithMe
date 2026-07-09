<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

log_user_activity('logout');
$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool) $params['secure'], (bool) $params['httponly']);
}

session_destroy();

json_response(['ok' => true, 'message' => 'Đã đăng xuất.']);
