<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$email = strtolower(trim((string) ($_POST['email'] ?? '')));
$password = (string) ($_POST['password'] ?? '');

if ($email === '' || $password === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng nhập email và mật khẩu.'], 422);
}

try {
    $statement = db()->prepare(
        'SELECT id, full_name, email, password, role, level, learning_goal, avatar_path, status, created_at, last_login_at
         FROM users
         WHERE email = ?
         LIMIT 1'
    );
    $statement->execute([$email]);
    $user = $statement->fetch();

    $storedPassword = $user ? (string) $user['password'] : '';
    $passwordIsValid = $user && password_verify($password, $storedPassword);

    if (!$passwordIsValid && $user && hash_equals($storedPassword, $password)) {
        $passwordIsValid = true;
        $rehash = db()->prepare('UPDATE users SET password = ? WHERE id = ?');
        $rehash->execute([password_hash($password, PASSWORD_DEFAULT), (int) $user['id']]);
    }

    if (!$user || !$passwordIsValid) {
        json_response(['ok' => false, 'message' => 'Email hoặc mật khẩu không đúng.'], 401);
    }

    if (($user['status'] ?? 'active') !== 'active') {
        json_response(['ok' => false, 'message' => 'Tài khoản đang bị khóa.'], 403);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];

    $updateLogin = db()->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?');
    $updateLogin->execute([(int) $user['id']]);
    $loginTime = db()->prepare('SELECT last_login_at FROM users WHERE id = ? LIMIT 1');
    $loginTime->execute([(int) $user['id']]);
    $user['last_login_at'] = $loginTime->fetch()['last_login_at'] ?? null;

    json_response([
        'ok' => true,
        'message' => 'Đăng nhập thành công.',
        'redirect' => (($user['role'] ?? 'user') === 'admin') ? 'admin.html' : 'profile.html#dashboard',
        'user' => current_user_payload($user),
    ]);
} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Không thể đăng nhập lúc này. Kiểm tra kết nối database.'], 500);
}
