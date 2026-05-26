<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

$user = require_current_user();
$userId = (int) $user['id'];
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare('SELECT test_set, test_parts, score, correct_count, total_questions, recommended_level, submitted_at FROM test_results WHERE user_id = ? ORDER BY submitted_at DESC');
        $stmt->execute([$userId]);
        $results = $stmt->fetchAll();

        json_response([
            'ok' => true,
            'results' => $results
        ]);
    } catch (Throwable $e) {
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi tải lịch sử làm bài.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $testSet = trim((string) ($_POST['test_set'] ?? ''));
    $testParts = trim((string) ($_POST['test_parts'] ?? ''));
    $score = trim((string) ($_POST['score'] ?? ''));
    $correctCount = (int) ($_POST['correct_count'] ?? 0);
    $totalQuestions = (int) ($_POST['total_questions'] ?? 0);
    $recommendedLevel = strtoupper(trim((string) ($_POST['recommended_level'] ?? 'A1')));

    if ($testSet === '' || $score === '' || $totalQuestions <= 0) {
        json_response(['ok' => false, 'message' => 'Dữ liệu kết quả không hợp lệ.'], 422);
    }

    $validLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];
    if (!in_array($recommendedLevel, $validLevels, true)) {
        $recommendedLevel = 'A1';
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('INSERT INTO test_results (user_id, test_set, test_parts, score, correct_count, total_questions, recommended_level) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $userId,
            $testSet,
            $testParts,
            $score,
            $correctCount,
            $totalQuestions,
            $recommendedLevel
        ]);

        // Dynamically update the user's level in their main profile to the recommended level
        $updateUser = $pdo->prepare('UPDATE users SET level = ? WHERE id = ?');
        $updateUser->execute([$recommendedLevel, $userId]);

        $pdo->commit();

        json_response([
            'ok' => true,
            'message' => 'Đã lưu kết quả bài thi thành công!'
        ]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi lưu kết quả thi.'], 500);
    }
}
