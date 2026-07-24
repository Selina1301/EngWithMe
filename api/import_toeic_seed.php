<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

try {
    $pdo = db();
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

    $seedFile = dirname(__DIR__) . '/database/toeic_seed_data.json';
    if (!file_exists($seedFile)) {
        die("File seed không tồn tại.\n");
    }

    $raw = file_get_contents($seedFile);
    $data = json_decode((string) $raw, true);
    if (!is_array($data)) {
        die("Dữ liệu seed rỗng.\n");
    }

    $pdo->exec("TRUNCATE TABLE toeic_questions;");

    $pdo->beginTransaction();
    $stmt = $pdo->prepare("
        INSERT INTO toeic_questions 
        (test_set, section, part_number, question_no, question_text, options_json, answer_text, explain_text, image_url, audio_url, transcript, passage_text, group_label)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $count = 0;
    foreach ($data as $q) {
        $set = trim((string) ($q['set'] ?? 'y2017'));
        $section = trim((string) ($q['section'] ?? 'reading'));
        $partNumber = (string) ($q['partNumber'] ?? '5');
        $questionNo = (int) ($q['questionNo'] ?? 1);
        $question = trim((string) ($q['question'] ?? ''));
        $optionsJson = json_encode(is_array($q['options'] ?? null) ? $q['options'] : []);
        $answer = trim((string) ($q['answer'] ?? ''));
        $explain = trim((string) ($q['explain'] ?? ''));
        $imageUrl = !empty($q['imageUrl']) ? trim((string) $q['imageUrl']) : null;
        $audioUrl = !empty($q['audioUrl']) ? trim((string) $q['audioUrl']) : null;
        $transcript = !empty($q['transcript']) ? trim((string) $q['transcript']) : null;
        $passage = !empty($q['passage']) ? trim((string) $q['passage']) : null;
        $group = !empty($q['group']) ? trim((string) $q['group']) : null;

        if ($set !== '' && $question !== '') {
            $stmt->execute([
                $set, $section, $partNumber, $questionNo, $question,
                $optionsJson, $answer, $explain, $imageUrl, $audioUrl,
                $transcript, $passage, $group
            ]);
            $count++;
        }
    }
    $pdo->commit();

    echo "SUCCESSFULLY SEEDED $count TOEIC QUESTIONS INTO MYSQL DATABASE!\n";
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "ERROR SEEDING MYSQL: " . $e->getMessage() . "\n";
}
