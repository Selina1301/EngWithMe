<?php
declare(strict_types=1);

// Mock a POST request in $_POST
$_POST['name'] = 'Test Registration';
$_POST['email'] = 'testregistration2026@gmail.com';
$_POST['password'] = 'password123';
$_POST['confirmPassword'] = 'password123';
$_POST['goal'] = 'Giao tiếp hằng ngày';

$_SERVER['REQUEST_METHOD'] = 'POST';

try {
    include __DIR__ . '/../api/register.php';
} catch (Throwable $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
