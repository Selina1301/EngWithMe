<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
$admin = require_admin_user();

function admin_users_payload(): array
{
    $stats = db()->query(
        'SELECT
            COUNT(*) AS total,
            SUM(role = "admin") AS admins,
            SUM(role = "user") AS learners,
            SUM(status = "active") AS active,
            SUM(status = "locked") AS locked,
            SUM(DATE(created_at) = CURDATE()) AS new_today
         FROM users'
    )->fetch() ?: [];

    $statement = db()->query(
        'SELECT id, full_name, email, role, level, learning_goal, avatar_path, status, created_at, last_login_at
         FROM users
         ORDER BY created_at DESC, id DESC'
    );

    return [
        'stats' => [
            'total' => (int) ($stats['total'] ?? 0),
            'admins' => (int) ($stats['admins'] ?? 0),
            'learners' => (int) ($stats['learners'] ?? 0),
            'active' => (int) ($stats['active'] ?? 0),
            'locked' => (int) ($stats['locked'] ?? 0),
            'newToday' => (int) ($stats['new_today'] ?? 0),
        ],
        'users' => array_map('current_user_payload', $statement->fetchAll()),
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string) ($_POST['action'] ?? '');
    $targetId = (int) ($_POST['user_id'] ?? 0);

    if ($targetId <= 0) {
        json_response(['ok' => false, 'message' => 'Người dùng không hợp lệ.'], 422);
    }

    $isSelf = $targetId === (int) $admin['id'];

    try {
        if ($action === 'lock') {
            if ($isSelf) {
                json_response(['ok' => false, 'message' => 'Không thể khóa chính tài khoản admin đang dùng.'], 422);
            }
            $statement = db()->prepare('UPDATE users SET status = "locked" WHERE id = ?');
            $statement->execute([$targetId]);
        } elseif ($action === 'unlock') {
            $statement = db()->prepare('UPDATE users SET status = "active" WHERE id = ?');
            $statement->execute([$targetId]);
        } elseif ($action === 'make_admin') {
            $statement = db()->prepare('UPDATE users SET role = "admin" WHERE id = ?');
            $statement->execute([$targetId]);
        } elseif ($action === 'make_user') {
            if ($isSelf) {
                json_response(['ok' => false, 'message' => 'Không thể hạ quyền chính tài khoản admin đang dùng.'], 422);
            }
            $statement = db()->prepare('UPDATE users SET role = "user" WHERE id = ?');
            $statement->execute([$targetId]);
        } elseif ($action === 'delete') {
            if ($isSelf) {
                json_response(['ok' => false, 'message' => 'Không thể xóa chính tài khoản admin đang dùng.'], 422);
            }
            $statement = db()->prepare('DELETE FROM users WHERE id = ?');
            $statement->execute([$targetId]);
        } else {
            json_response(['ok' => false, 'message' => 'Hành động không hợp lệ.'], 422);
        }

        json_response(['ok' => true, 'message' => 'Đã cập nhật người dùng.'] + admin_users_payload());
    } catch (Throwable $error) {
        json_response(['ok' => false, 'message' => 'Không thể cập nhật người dùng.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
}

json_response(['ok' => true, 'admin' => current_user_payload($admin)] + admin_users_payload());
