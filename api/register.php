<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$name = trim((string) ($_POST['name'] ?? $_POST['full_name'] ?? ''));
$email = strtolower(trim((string) ($_POST['email'] ?? '')));
$password = (string) ($_POST['password'] ?? '');
$goal = trim((string) ($_POST['goal'] ?? ''));

if ($name === '' || $email === '' || $password === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng nhập đầy đủ thông tin.'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['ok' => false, 'message' => 'Email không hợp lệ.'], 422);
}

if (strlen($password) < 6) {
    json_response(['ok' => false, 'message' => 'Mật khẩu cần tối thiểu 6 ký tự.'], 422);
}

try {
    $pdo = db();

    $check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $check->execute([$email]);

    if ($check->fetch()) {
        json_response(['ok' => false, 'message' => 'Email này đã được đăng ký.'], 409);
    }

    $insert = $pdo->prepare(
        'INSERT INTO users (full_name, email, password, role, level, learning_goal, status)
         VALUES (?, ?, ?, "user", "A1", ?, "active")'
    );
    $insert->execute([
        $name,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $goal !== '' ? $goal : null,
    ]);

    $userId = (int) $pdo->lastInsertId();
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;

    $user = [
        'id' => $userId,
        'full_name' => $name,
        'email' => $email,
        'role' => 'user',
        'level' => 'A1',
        'learning_goal' => $goal,
        'avatar_path' => '',
        'status' => 'active',
    ];

    json_response([
        'ok' => true,
        'message' => 'Đăng ký thành công. Đang chuyển sang dashboard...',
        'redirect' => 'profile.html#dashboard',
        'user' => current_user_payload($user),
    ], 201);
} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Không thể đăng ký lúc này. Kiểm tra kết nối database.'], 500);
}
