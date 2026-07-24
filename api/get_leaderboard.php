<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
ensure_user_level_table();

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db();
    $stmt = $pdo->query('
        SELECT u.id, u.full_name AS name, COALESCE(ul.total_xp, 0) AS total_xp, COALESCE(ul.level, u.level, 1) AS level
        FROM users u
        LEFT JOIN user_levels ul ON u.id = ul.user_id
        WHERE u.status IN ("active", "pending")
        ORDER BY total_xp DESC, level DESC, u.id ASC
        LIMIT 5
    ');
    $users = $stmt->fetchAll();

    $leaderboard = [];
    foreach ($users as $index => $row) {
        $leaderboard[] = [
            'rank' => $index + 1,
            'id' => (int) $row['id'],
            'name' => trim((string)($row['name'] ?? '')) ?: 'Học viên EngWithMe',
            'total_xp' => (int) $row['total_xp'],
            'level' => max(1, (int) $row['level'])
        ];
    }

    json_response([
        'ok' => true,
        'leaderboard' => $leaderboard
    ]);
} catch (\Throwable $e) {
    json_response([
        'ok' => false,
        'message' => 'Không thể tải bảng xếp hạng: ' . $e->getMessage(),
        'leaderboard' => []
    ], 500);
}
