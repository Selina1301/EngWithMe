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
        'SELECT id, full_name, email, password, role, level, learning_goal, avatar_path, status, created_at, last_login_at, login_attempts, attempt_lock_until
         FROM users
         WHERE email = ?
         LIMIT 1'
    );
    $statement->execute([$email]);
    $user = $statement->fetch();

    $storedPassword = $user ? (string) $user['password'] : '';
    
    // Check Rate Limiting First
    if ($user && !empty($user['attempt_lock_until'])) {
        $lockUntil = strtotime($user['attempt_lock_until']);
        if (time() < $lockUntil) {
            json_response(['ok' => false, 'message' => 'Tài khoản bị tạm khóa 15 phút do nhập sai quá nhiều lần.'], 429);
        }
    }

    $passwordIsValid = $user && password_verify($password, $storedPassword);

    if (!$passwordIsValid && $user && hash_equals($storedPassword, $password)) {
        $passwordIsValid = true;
        $rehash = db()->prepare('UPDATE users SET password = ? WHERE id = ?');
        $rehash->execute([password_hash($password, PASSWORD_DEFAULT), (int) $user['id']]);
    }

    if (!$user || !$passwordIsValid) {
        if ($user) {
            // Increment failed attempts
            $attempts = (int) $user['login_attempts'] + 1;
            if ($attempts >= 5) {
                $lock = db()->prepare('UPDATE users SET login_attempts = ?, attempt_lock_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?');
                $lock->execute([$attempts, (int) $user['id']]);
            } else {
                $inc = db()->prepare('UPDATE users SET login_attempts = ? WHERE id = ?');
                $inc->execute([$attempts, (int) $user['id']]);
            }
        }
        log_user_activity('login_failed', ['email' => $email, 'reason' => 'invalid_credentials']);
        json_response(['ok' => false, 'message' => 'Email hoặc mật khẩu không đúng.'], 401);
    }

    if (($user['status'] ?? 'active') === 'pending') {
        json_response(['ok' => false, 'message' => 'Tài khoản chưa được kích hoạt email. Vui lòng xác thực qua liên kết kích hoạt đã gửi tới email của bạn.'], 403);
    }

    if (($user['status'] ?? 'active') !== 'active') {
        json_response(['ok' => false, 'message' => 'Tài khoản đang bị khóa.'], 403);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    setcookie('ewm_logged_in', '1', time() + 86400 * 30, '/');

    $updateLogin = db()->prepare('UPDATE users SET last_login_at = NOW(), login_attempts = 0, attempt_lock_until = NULL WHERE id = ?');
    $updateLogin->execute([(int) $user['id']]);
    $loginTime = db()->prepare('SELECT last_login_at FROM users WHERE id = ? LIMIT 1');
    $loginTime->execute([(int) $user['id']]);
    $user['last_login_at'] = $loginTime->fetch()['last_login_at'] ?? null;

    log_user_activity('login_success', ['email' => $email, 'role' => $user['role'] ?? 'user']);

    json_response([
        'ok' => true,
        'message' => 'Đăng nhập thành công.',
        'redirect' => (($user['role'] ?? 'user') === 'admin') ? 'admin.html' : 'profile.html#dashboard',
        'user' => current_user_payload($user),
    ]);
} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Không thể đăng nhập lúc này. Kiểm tra kết nối database.'], 500);
}
