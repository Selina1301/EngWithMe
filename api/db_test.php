<?php
require_once __DIR__ . '/helpers.php';

try {
    $pdo = db();
    $tablesStmt = $pdo->query("SHOW TABLES");
    $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

    $report = [];
    foreach ($tables as $table) {
        $countStmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
        $count = $countStmt->fetchColumn();
        
        // Fetch a few rows to inspect encoding
        $sample = [];
        try {
            $sampleStmt = $pdo->query("SELECT * FROM `$table` LIMIT 3");
            $sample = $sampleStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $sample = ['error' => $e->getMessage()];
        }

        $report[$table] = [
            'row_count' => $count,
            'sample' => $sample
        ];
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => true,
        'tables' => $report
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Exception $e) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}
