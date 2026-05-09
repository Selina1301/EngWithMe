<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

try {
    $user = require_current_user();
    json_response(['ok' => true, 'user' => current_user_payload($user)]);
} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Không thể tải thông tin tài khoản.'], 500);
}
