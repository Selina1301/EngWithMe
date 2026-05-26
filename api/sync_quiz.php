<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

$user = require_current_user();
$userId = (int) $user['id'];
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare('SELECT correct_count, total_count FROM user_vocab_quiz_stats WHERE user_id = ?');
        $stmt->execute([$userId]);
        $stats = $stmt->fetch();

        $correct = $stats ? (int) $stats['correct_count'] : 0;
        $total = $stats ? (int) $stats['total_count'] : 0;

        $stmt = $pdo->prepare('SELECT word_key, wrong_count FROM user_vocab_wrong_words WHERE user_id = ?');
        $stmt->execute([$userId]);
        $wrongRows = $stmt->fetchAll();

        $wrongWords = [];
        foreach ($wrongRows as $row) {
            $wrongWords[$row['word_key']] = (int) $row['wrong_count'];
        }

        json_response([
            'ok' => true,
            'stats' => [
                'correct' => $correct,
                'total' => $total,
                'wrongWords' => $wrongWords
            ]
        ]);
    } catch (Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi tải kết quả quiz.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $correct = (int) ($_POST['correct'] ?? 0);
    $total = (int) ($_POST['total'] ?? 0);
    
    $wrongWordsInput = $_POST['wrong_words'] ?? '{}';
    $wrongWords = json_decode((string) $wrongWordsInput, true);
    if (!is_array($wrongWords)) {
        $wrongWords = [];
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('INSERT INTO user_vocab_quiz_stats (user_id, correct_count, total_count) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE correct_count = VALUES(correct_count), total_count = VALUES(total_count)');
        $stmt->execute([$userId, $correct, $total]);

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
