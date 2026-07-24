<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

header('Content-Type: application/json; charset=utf-8');

$setId = trim((string) ($_GET['set'] ?? 'y2017'));
if ($setId === '' || !preg_match('/^y?\d{4}$/', $setId)) {
    $setId = 'y2017';
}
if (!str_starts_with($setId, 'y')) {
    $setId = 'y' . $setId;
}

$rawParts = trim((string) ($_GET['parts'] ?? $_GET['part'] ?? '1,2,3,4,5,6,7'));
$partsList = array_values(array_filter(array_map('trim', explode(',', $rawParts)), function ($p) {
    return in_array($p, ['1', '2', '3', '4', '5', '6', '7'], true);
}));
if (empty($partsList)) {
    $partsList = ['1', '2', '3', '4', '5', '6', '7'];
}

try {
    $pdo = db();
    
    // Ensure table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS toeic_questions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_set VARCHAR(30) NOT NULL,
          section VARCHAR(20) NOT NULL,
          part_number VARCHAR(10) NOT NULL,
          question_no INT NOT NULL,
          question_text TEXT NOT NULL,
          options_json JSON NOT NULL,
          answer_text TEXT NOT NULL,
          explain_text TEXT NULL,
          image_url VARCHAR(255) NULL,
          audio_url VARCHAR(255) NULL,
          transcript TEXT NULL,
          passage_text LONGTEXT NULL,
          group_label VARCHAR(100) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_set_part (test_set, part_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $inPlaceholders = implode(',', array_fill(0, count($partsList), '?'));
    $params = array_merge([$setId], $partsList);

    $stmt = $pdo->prepare("
        SELECT 
            id, test_set AS `set`, section, part_number AS partNumber, question_no AS questionNo,
            question_text AS question, options_json AS options, answer_text AS answer,
            explain_text AS `explain`, image_url AS imageUrl, audio_url AS audioUrl,
            transcript, passage_text AS passage, group_label AS `group`
        FROM toeic_questions
        WHERE test_set = ? AND part_number IN ($inPlaceholders)
        ORDER BY CAST(part_number AS UNSIGNED) ASC, question_no ASC
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $questions = [];
    foreach ($rows as $row) {
        $options = json_decode((string) $row['options'], true);
        if (!is_array($options)) {
            $options = [];
        }
        $questions[] = [
            'id' => $row['set'] . '-' . $row['partNumber'] . '-' . $row['questionNo'],
            'set' => $row['set'],
            'section' => $row['section'],
            'partNumber' => (string) $row['partNumber'],
            'questionNo' => (int) $row['questionNo'],
            'question' => (string) $row['question'],
            'options' => $options,
            'answer' => (string) $row['answer'],
            'explain' => (string) ($row['explain'] ?? ''),
            'imageUrl' => $row['imageUrl'] ?: null,
            'audioUrl' => $row['audioUrl'] ?: null,
            'transcript' => $row['transcript'] ?: null,
            'passage' => $row['passage'] ?: null,
            'group' => $row['group'] ?: null,
        ];
    }

    json_response([
        'ok' => true,
        'set' => $setId,
        'parts' => $partsList,
        'total' => count($questions),
        'questions' => $questions,
        'source' => 'mysql_database'
    ]);
} catch (Throwable $e) {
    json_response([
        'ok' => false,
        'message' => 'Lỗi kết nối MySQL Database: ' . $e->getMessage(),
        'questions' => []
    ], 200);
}
