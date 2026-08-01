<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
ensure_user_level_table();

$user = find_current_user();
if (!$user) {
    json_response(['ok' => false, 'message' => 'Bạn chưa đăng nhập.'], 401);
}

$userId = (int) $user['id'];
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        $pdo = db();
        $stmt = $pdo->prepare('SELECT total_xp, level FROM user_levels WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        if ($row) {
            json_response([
                'ok' => true,
                'user_id' => $userId,
                'total_xp' => (int) $row['total_xp'],
                'level' => (int) $row['level']
            ]);
        } else {
            json_response([
                'ok' => true,
                'user_id' => $userId,
                'total_xp' => 0,
                'level' => 1
            ]);
        }
    } catch (\Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi kết nối CSDL.'], 500);
    }
}

if ($method === 'POST') {
    $totalXp = isset($_POST['total_xp']) ? max(0, (int) $_POST['total_xp']) : null;
    $xpAdd = isset($_POST['xp_add']) ? max(0, (int) $_POST['xp_add']) : 0;

    try {
        $pdo = db();
        $stmt = $pdo->prepare('SELECT total_xp FROM user_levels WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        $currentXp = $row ? (int) $row['total_xp'] : 0;

        if ($totalXp !== null) {
            $newTotalXp = max($currentXp, $totalXp);
        } else {
            $newTotalXp = $currentXp + $xpAdd;
        }

        // Calculate Level formula matching frontend:
        $remainingXp = $newTotalXp;
        $lvl = 1;
        while (true) {
            $bracket = (int) floor(($lvl - 1) / 10);
            $cost = ($bracket + 1) * 10;
            if ($remainingXp >= $cost) {
                $remainingXp -= $cost;
                $lvl++;
            } else {
                break;
            }
        }

        $upsert = $pdo->prepare('
            INSERT INTO user_levels (user_id, total_xp, level)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                total_xp = VALUES(total_xp),
                level = VALUES(level)
        ');
        $upsert->execute([$userId, $newTotalXp, $lvl]);

        json_response([
            'ok' => true,
            'user_id' => $userId,
            'total_xp' => $newTotalXp,
            'level' => $lvl
        ]);
    } catch (\Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi cập nhật CSDL.'], 500);
    }
}

json_response(['ok' => false, 'message' => 'Phương thức không được hỗ trợ.'], 405);
