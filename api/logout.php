<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

log_user_activity('logout');
$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'] ?? '/', $params['domain'] ?? '', (bool) ($params['secure'] ?? false), (bool) ($params['httponly'] ?? true));
}

setcookie('ewm_logged_in', '', time() - 3600, '/');
setcookie('ewm_trusted_device', '', time() - 3600, '/');
if (isset($_COOKIE['ewm_logged_in'])) {
    unset($_COOKIE['ewm_logged_in']);
}
if (isset($_COOKIE['ewm_trusted_device'])) {
    unset($_COOKIE['ewm_trusted_device']);
}

session_destroy();

json_response(['ok' => true, 'message' => 'Đã đăng xuất.']);
