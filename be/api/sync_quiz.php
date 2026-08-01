<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

ensure_vocab_quiz_tables();

$user = require_current_user();
$userId = (int) $user['id'];
$pdo = db();

function normalize_day_key(string $value): ?string
{
    $value = trim($value);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        return null;
    }

    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date && $date->format('Y-m-d') === $value ? $value : null;
}

function normalize_wrong_words(array $input): array
{
    $normalized = [];
    foreach ($input as $wordKey => $count) {
        $wordKey = trim((string) $wordKey);
        $count = max(0, (int) $count);
        if ($wordKey === '' || strlen($wordKey) > 180 || $count <= 0) {
            continue;
        }

        $normalized[$wordKey] = $count;
        if (count($normalized) >= 500) {
            break;
        }
    }

    return $normalized;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare('SELECT correct_count, total_count, fast_streak FROM user_vocab_quiz_stats WHERE user_id = ?');
        $stmt->execute([$userId]);
        $stats = $stmt->fetch();

        $correct = $stats ? (int) $stats['correct_count'] : 0;
        $total = $stats ? (int) $stats['total_count'] : 0;
        $fastStreak = $stats ? (int) ($stats['fast_streak'] ?? 0) : 0;

        $stmt = $pdo->prepare('SELECT word_key, wrong_count FROM user_vocab_wrong_words WHERE user_id = ?');
        $stmt->execute([$userId]);
        $wrongRows = $stmt->fetchAll();

        $wrongWords = [];
        foreach ($wrongRows as $row) {
            $wrongWords[$row['word_key']] = (int) $row['wrong_count'];
        }

        $activityDays = [];
        try {
            $stmt = $pdo->prepare('SELECT activity_day FROM user_vocab_activity_days WHERE user_id = ? ORDER BY activity_day ASC');
            $stmt->execute([$userId]);
            foreach ($stmt->fetchAll() as $row) {
                $activityDays[] = (string) $row['activity_day'];
            }
        } catch (Throwable $e) {
            $activityDays = [];
        }

        json_response([
            'ok' => true,
            'stats' => [
                'correct' => $correct,
                'total' => $total,
                'fastStreak' => $fastStreak,
                'wrongWords' => $wrongWords,
                'activityDays' => $activityDays
            ]
        ]);
    } catch (Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi tải kết quả quiz.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $correct = max(0, (int) ($_POST['correct'] ?? 0));
    $total = max(0, (int) ($_POST['total'] ?? 0));
    $fastStreak = max(0, (int) ($_POST['fast_streak'] ?? 0));
    if ($correct > $total) {
        $correct = $total;
    }
    
    $wrongWordsInput = $_POST['wrong_words'] ?? '{}';
    $wrongWords = json_decode((string) $wrongWordsInput, true);
    if (!is_array($wrongWords)) {
        $wrongWords = [];
    }
    $wrongWords = normalize_wrong_words($wrongWords);
    $activityDay = normalize_day_key((string) ($_POST['activity_day'] ?? ''));
    $canSyncActivity = false;

    if ($activityDay) {
        $canSyncActivity = true;
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('INSERT INTO user_vocab_quiz_stats (user_id, correct_count, total_count, fast_streak) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE correct_count = VALUES(correct_count), total_count = VALUES(total_count), fast_streak = VALUES(fast_streak)');
        $stmt->execute([$userId, $correct, $total, $fastStreak]);

        $stmt = $pdo->prepare('DELETE FROM user_vocab_wrong_words WHERE user_id = ?');
        $stmt->execute([$userId]);

        if (!empty($wrongWords)) {
            $stmt = $pdo->prepare('INSERT INTO user_vocab_wrong_words (user_id, word_key, wrong_count) VALUES (?, ?, ?)');
            foreach ($wrongWords as $wordKey => $count) {
                if (trim((string) $wordKey) !== '') {
                    $stmt->execute([$userId, trim((string) $wordKey), (int) $count]);
                }
            }
        }

        if ($activityDay && $canSyncActivity) {
            $stmt = $pdo->prepare('INSERT IGNORE INTO user_vocab_activity_days (user_id, activity_day) VALUES (?, ?)');
            $stmt->execute([$userId, $activityDay]);
        }

        $pdo->commit();
        json_response([
            'ok' => true,
            'message' => 'Đã lưu kết quả quiz vào máy chủ.'
        ]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi lưu kết quả quiz.'], 500);
    }
}
