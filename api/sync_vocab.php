<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

// Users must be logged in to sync with the database
$user = require_current_user();
$userId = (int) $user['id'];
$pdo = db();

function is_valid_vocab_key(string $value): bool
{
    return $value !== ''
        && strlen($value) <= 180
        && (bool) preg_match("/^[a-z0-9][a-z0-9 _'\\/.:-]*$/i", $value);
}

function is_valid_vocab_level(string $value): bool
{
    return in_array($value, ['easy', 'medium', 'hard'], true);
}

function is_valid_topic_id(string $value): bool
{
    return $value !== ''
        && strlen($value) <= 100
        && (bool) preg_match('/^[a-z0-9][a-z0-9-]*$/i', $value);
}

function normalize_day_key(string $value): ?string
{
    $value = trim($value);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        return null;
    }

    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date && $date->format('Y-m-d') === $value ? $value : null;
}

function record_vocab_activity_day(PDO $pdo, int $userId, ?string $day): void
{
    try {
        $day = normalize_day_key((string) $day) ?? date('Y-m-d');

        $stmt = $pdo->prepare('INSERT IGNORE INTO user_vocab_activity_days (user_id, activity_day) VALUES (?, ?)');
        $stmt->execute([$userId, $day]);
    } catch (Throwable $e) {
        // Activity sync is supplemental; never fail the primary vocabulary action for it.
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Fetch saved vocabulary
        $stmt = $pdo->prepare('SELECT vocab_key, study_level FROM user_saved_vocab WHERE user_id = ? ORDER BY saved_at ASC');
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
        $stmt = $pdo->prepare('SELECT level_key, topic_id, viewed_at FROM user_viewed_topics WHERE user_id = ? ORDER BY viewed_at ASC');
        $stmt->execute([$userId]);
        $viewedRows = $stmt->fetchAll();

        $viewed = [];
        foreach ($viewedRows as $row) {
            $viewed[] = [
                'level' => $row['level_key'],
                'id' => $row['topic_id'],
                'timestamp' => $row['viewed_at'] ? strtotime((string) $row['viewed_at']) * 1000 : null
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

            if (!is_valid_vocab_key($vocabKey)) {
                json_response(['ok' => false, 'message' => 'Mã từ vựng không hợp lệ.'], 422);
            }

            if (!is_valid_vocab_level($studyLevel)) {
                $studyLevel = 'easy';
            }

            $stmt = $pdo->prepare('INSERT INTO user_saved_vocab (user_id, vocab_key, study_level) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE study_level = VALUES(study_level)');
            $stmt->execute([$userId, $vocabKey, $studyLevel]);
            record_vocab_activity_day($pdo, $userId, $_POST['activity_day'] ?? null);
            log_user_activity('vocabulary_saved', ['word' => $vocabKey, 'level' => $studyLevel]);

            json_response(['ok' => true, 'message' => 'Đã lưu từ vựng vào tài khoản.']);
        } elseif ($action === 'remove') {
            $vocabKey = trim((string) ($_POST['vocab_key'] ?? ''));

            if (!is_valid_vocab_key($vocabKey)) {
                json_response(['ok' => false, 'message' => 'Mã từ vựng không hợp lệ.'], 422);
            }

            $stmt = $pdo->prepare('DELETE FROM user_saved_vocab WHERE user_id = ? AND vocab_key = ?');
            $stmt->execute([$userId, $vocabKey]);
            record_vocab_activity_day($pdo, $userId, $_POST['activity_day'] ?? null);
            log_user_activity('vocabulary_removed', ['word' => $vocabKey]);

            json_response(['ok' => true, 'message' => 'Đã bỏ lưu từ vựng.']);
        } elseif ($action === 'view_topic') {
            $levelKey = trim((string) ($_POST['level_key'] ?? ''));
            $topicId = trim((string) ($_POST['topic_id'] ?? ''));

            if (!is_valid_vocab_level($levelKey) || !is_valid_topic_id($topicId)) {
                json_response(['ok' => false, 'message' => 'Chủ đề không hợp lệ.'], 422);
            }

            $stmt = $pdo->prepare('INSERT INTO user_viewed_topics (user_id, level_key, topic_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP');
            $stmt->execute([$userId, $levelKey, $topicId]);
            record_vocab_activity_day($pdo, $userId, $_POST['activity_day'] ?? null);
            log_user_activity('vocabulary_topic_viewed', ['level' => $levelKey, 'topic' => $topicId]);

            json_response(['ok' => true, 'message' => 'Đã ghi nhận chủ đề đã học.']);
        } else {
            json_response(['ok' => false, 'message' => 'Hành động không hợp lệ.'], 400);
        }
    } catch (Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi cập nhật từ vựng.'], 500);
    }
}
