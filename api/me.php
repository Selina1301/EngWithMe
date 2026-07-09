<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

try {
    $user = find_current_user();
    if ($user) {
        json_response(['ok' => true, 'user' => current_user_payload($user)]);
    } else {
        json_response(['ok' => false, 'user' => null, 'message' => 'Chưa đăng nhập.'], 401);
    }
} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Không thể tải thông tin tài khoản.'], 500);
}
