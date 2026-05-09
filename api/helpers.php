<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function start_app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $sessionPath = __DIR__ . '/sessions';
    if (!is_dir($sessionPath)) {
        mkdir($sessionPath, 0775, true);
    }
    session_save_path($sessionPath);

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);

    session_start();
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function require_post(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
}

function current_user_payload(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'name' => $user['full_name'] ?? $user['name'] ?? '',
        'email' => $user['email'] ?? '',
        'role' => $user['role'] ?? 'user',
        'level' => $user['level'] ?? 'A1',
        'goal' => $user['learning_goal'] ?? '',
        'avatar' => $user['avatar_path'] ?? '',
        'status' => $user['status'] ?? 'active',
        'createdAt' => $user['created_at'] ?? null,
        'lastLoginAt' => $user['last_login_at'] ?? null,
    ];
}

function find_current_user(): ?array
{
    $userId = (int) ($_SESSION['user_id'] ?? 0);
    if ($userId <= 0) {
        return null;
    }

    $statement = db()->prepare(
        'SELECT id, full_name, email, role, level, learning_goal, avatar_path, status, created_at, last_login_at
         FROM users
         WHERE id = ?
         LIMIT 1'
    );
    $statement->execute([$userId]);
    $user = $statement->fetch();

    if (!$user || ($user['status'] ?? 'active') !== 'active') {
        unset($_SESSION['user_id']);
        return null;
    }

    return $user;
}

function require_current_user(): array
{
    $user = find_current_user();
    if (!$user) {
        json_response(['ok' => false, 'message' => 'Chưa đăng nhập.'], 401);
    }

    return $user;
}

function require_admin_user(): array
{
    $user = require_current_user();
    if (($user['role'] ?? 'user') !== 'admin') {
        json_response(['ok' => false, 'message' => 'Bạn không có quyền quản trị.'], 403);
    }

    return $user;
}
