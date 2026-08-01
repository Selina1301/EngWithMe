<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

ensure_leaderboard_table();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $topicId = trim((string) ($_GET['topic_id'] ?? ''));
    if ($topicId === '') {
        json_response(['ok' => false, 'message' => 'Thiếu topic_id.'], 400);
    }

    try {
        $pdo = db();
        $stmt = $pdo->prepare('SELECT topic_id, user_name, correct_count, time_seconds, score FROM topic_leaderboard WHERE topic_id = ? LIMIT 1');
        $stmt->execute([$topicId]);
        $row = $stmt->fetch();

        if ($row) {
            json_response([
                'ok' => true,
                'topic_id' => $topicId,
                'champion' => [
                    'user_name' => $row['user_name'],
                    'correct_count' => (int) $row['correct_count'],
                    'time_seconds' => (int) $row['time_seconds'],
                    'score' => (int) $row['score']
                ]
            ]);
        } else {
            json_response([
                'ok' => true,
                'topic_id' => $topicId,
                'champion' => null
            ]);
        }
    } catch (\Throwable $e) {
        json_response([
            'ok' => true,
            'topic_id' => $topicId,
            'champion' => null
        ]);
    }
}

if ($method === 'POST') {
    $user = find_current_user();
    $topicId = trim((string) ($_POST['topic_id'] ?? ''));
    $correctCount = max(0, (int) ($_POST['correct_count'] ?? 0));
    $timeSeconds = max(1, (int) ($_POST['time_seconds'] ?? 999));
    $score = max(0, (int) ($_POST['score'] ?? 0));
    $userName = trim((string) ($_POST['user_name'] ?? ''));

    if ($topicId === '') {
        json_response(['ok' => false, 'message' => 'Thiếu thông tin topic_id.'], 400);
    }

    if ($user) {
        $userId = (int) $user['id'];
        if ($userName === '') {
            $userName = !empty($user['name']) ? $user['name'] : (!empty($user['email']) ? explode('@', $user['email'])[0] : 'Học viên');
        }
    } else {
        $userId = null;
        if ($userName === '') {
            $userName = 'Học viên ẩn danh';
        }
    }

    try {
        $pdo = db();

        // Lấy kỷ lục Top 1 hiện tại của chủ đề này
        $stmt = $pdo->prepare('SELECT user_name, correct_count, time_seconds, score FROM topic_leaderboard WHERE topic_id = ? LIMIT 1');
        $stmt->execute([$topicId]);
        $currentRecord = $stmt->fetch();

        $isNewRecord = false;
        if (!$currentRecord) {
            $isNewRecord = true;
        } else {
            $oldCorrect = (int) $currentRecord['correct_count'];
            $oldTime = (int) $currentRecord['time_seconds'];

            // Tiêu chuẩn xếp hạng Top 1:
            // 1. Số câu trả lời đúng nhiều hơn
            // 2. Nếu bằng số câu đúng -> Thời gian chơi ít hơn
            if ($correctCount > $oldCorrect) {
                $isNewRecord = true;
            } elseif ($correctCount === $oldCorrect && $timeSeconds < $oldTime) {
                $isNewRecord = true;
            }
        }

        if ($isNewRecord) {
            $upsert = $pdo->prepare('
                INSERT INTO topic_leaderboard (topic_id, user_id, user_name, correct_count, time_seconds, score)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    user_id = VALUES(user_id),
                    user_name = VALUES(user_name),
                    correct_count = VALUES(correct_count),
                    time_seconds = VALUES(time_seconds),
                    score = VALUES(score)
            ');
            $upsert->execute([$topicId, $userId, $userName, $correctCount, $timeSeconds, $score]);

            json_response([
                'ok' => true,
                'is_new_record' => true,
                'champion' => [
                    'user_name' => $userName,
                    'correct_count' => $correctCount,
                    'time_seconds' => $timeSeconds,
                    'score' => $score
                ],
                'message' => '🎉 Chúc mừng! Bạn đã xác lập kỷ lục Top 1 BXH cho chủ đề này!'
            ]);
        }

        json_response([
            'ok' => true,
            'is_new_record' => false,
            'champion' => [
                'user_name' => $currentRecord['user_name'],
                'correct_count' => (int) $currentRecord['correct_count'],
                'time_seconds' => (int) $currentRecord['time_seconds'],
                'score' => (int) $currentRecord['score']
            ]
        ]);
    } catch (\Throwable $e) {
        json_response([
            'ok' => true,
            'is_new_record' => false,
            'champion' => [
                'user_name' => $userName,
                'correct_count' => $correctCount,
                'time_seconds' => $timeSeconds,
                'score' => $score
            ]
        ]);
    }
}

json_response(['ok' => false, 'message' => 'Phương thức không được hỗ trợ.'], 405);
