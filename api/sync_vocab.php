<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

// Users must be logged in to sync with the database
$user = require_current_user();
$userId = (int) $user['id'];
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Fetch saved vocabulary
        $stmt = $pdo->prepare('SELECT vocab_key, study_level FROM user_saved_vocab WHERE user_id = ?');
        $stmt->execute([$userId]);
        $savedRows = $stmt->fetchAll();

        $saved = [];
        foreach ($savedRows as $row) {
            $saved[] = [
                'key' => $row['vocab_key'],
                'studyLevel' => $row['study_level']
            ];
        }

        // Fetch viewed topics
        $stmt = $pdo->prepare('SELECT level_key, topic_id FROM user_viewed_topics WHERE user_id = ?');
        $stmt->execute([$userId]);
        $viewedRows = $stmt->fetchAll();

        $viewed = [];
        foreach ($viewedRows as $row) {
            $viewed[] = [
                'level' => $row['level_key'],
                'id' => $row['topic_id']
            ];
        }

        json_response([
            'ok' => true,
            'saved' => $saved,
            'viewed' => $viewed
        ]);
    } catch (Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi tải từ vựng.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = trim((string) ($_POST['action'] ?? ''));

    try {
        if ($action === 'save') {
            $vocabKey = trim((string) ($_POST['vocab_key'] ?? ''));
            $studyLevel = trim((string) ($_POST['study_level'] ?? 'easy'));

            if ($vocabKey === '') {
                json_response(['ok' => false, 'message' => 'Mã từ vựng không hợp lệ.'], 422);
            }

            if (!in_array($studyLevel, ['easy', 'medium', 'hard'], true)) {
                $studyLevel = 'easy';
            }

            $stmt = $pdo->prepare('INSERT INTO user_saved_vocab (user_id, vocab_key, study_level) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE study_level = VALUES(study_level)');
            $stmt->execute([$userId, $vocabKey, $studyLevel]);

            json_response(['ok' => true, 'message' => 'Đã lưu từ vựng vào tài khoản.']);
        } elseif ($action === 'remove') {
            $vocabKey = trim((string) ($_POST['vocab_key'] ?? ''));

            if ($vocabKey === '') {
                json_response(['ok' => false, 'message' => 'Mã từ vựng không hợp lệ.'], 422);
            }

            $stmt = $pdo->prepare('DELETE FROM user_saved_vocab WHERE user_id = ? AND vocab_key = ?');
            $stmt->execute([$userId, $vocabKey]);

            json_response(['ok' => true, 'message' => 'Đã bỏ lưu từ vựng.']);
        } elseif ($action === 'view_topic') {
            $levelKey = trim((string) ($_POST['level_key'] ?? ''));
            $topicId = trim((string) ($_POST['topic_id'] ?? ''));

            if ($levelKey === '' || $topicId === '') {
                json_response(['ok' => false, 'message' => 'Chủ đề không hợp lệ.'], 422);
            }

            $stmt = $pdo->prepare('INSERT IGNORE INTO user_viewed_topics (user_id, level_key, topic_id) VALUES (?, ?, ?)');
            $stmt->execute([$userId, $levelKey, $topicId]);

            json_response(['ok' => true, 'message' => 'Đã ghi nhận chủ đề đã học.']);
        } else {
            json_response(['ok' => false, 'message' => 'Hành động không hợp lệ.'], 400);
        }
    } catch (Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi cập nhật từ vựng.'], 500);
    }
}
