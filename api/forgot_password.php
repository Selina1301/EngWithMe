<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$email = strtolower(trim((string) ($_POST['email'] ?? '')));

if ($email === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng nhập email.'], 422);
}

try {
    $statement = db()->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $statement->execute([$email]);
    $user = $statement->fetch();

    if ($user) {
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour

        $update = db()->prepare('UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?');
        $update->execute([$token, $expires, (int) $user['id']]);

        // Simulating email send
        $resetLink = "reset-password.html?token=" . $token;
        json_response([
            'ok' => true, 
            'message' => 'Đã tạo link khôi phục (Demo).',
            'demo_link' => $resetLink
        ]);
    } else {
        // Generic response even if email doesn't exist
        json_response([
            'ok' => true, 
            'message' => 'Nếu email này có trong hệ thống, chúng tôi sẽ gửi link khôi phục.',
        ]);
    }

} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống.'], 500);
}
