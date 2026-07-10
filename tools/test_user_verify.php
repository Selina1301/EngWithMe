<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/helpers.php';

$email = 'johndoo120502@gmail.com';
$otp = '450609';

try {
    $pdo = db();
    $statement = $pdo->prepare('SELECT * FROM users WHERE email = ? AND verification_token = ? AND status = "pending" LIMIT 1');
    $statement->execute([$email, $otp]);
    $user = $statement->fetch();
    
    if (!$user) {
        echo "USER NOT FOUND OR ALREADY ACTIVE\n";
    } else {
        echo "USER FOUND! ID: " . $user['id'] . "\n";
        
        // Try the update
        $update = $pdo->prepare('UPDATE users SET status = "active", verification_token = NULL WHERE id = ?');
        $update->execute([(int) $user['id']]);
        echo "STATUS UPDATED TO ACTIVE!\n";
    }
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
