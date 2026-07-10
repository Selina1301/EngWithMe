<?php
declare(strict_types=1);

require_once __DIR__ . '/api/helpers.php';

$email = 'testregistration2026@gmail.com';
$otp = '581867';

try {
    $pdo = db();
    $statement = $pdo->prepare('SELECT * FROM users WHERE email = ? AND verification_token = ? AND status = "pending" LIMIT 1');
    $statement->execute([$email, $otp]);
    $user = $statement->fetch();
    
    echo "USER FOUND: " . json_encode($user) . "\n";
    
    // Dump actual DB values for this email
    $stmt2 = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt2->execute([$email]);
    $all = $stmt2->fetchAll();
    echo "ALL ROWS WITH THIS EMAIL: " . json_encode($all) . "\n";
    
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
