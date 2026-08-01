<?php
declare(strict_types=1);

namespace EngWithMe\Services;

use PDO;

class AuthService
{
    public static function authenticate(PDO $pdo, string $email, string $password): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([trim(strtolower($email))]);
        $user = $stmt->fetch();

        if (!$user) return null;

        $storedHash = (string)($user['password'] ?? '');
        if (!password_verify($password, $storedHash) && !hash_equals($storedHash, $password)) {
            return null;
        }

        return $user;
    }

    public static function createRememberToken(PDO $pdo, int $userId): string
    {
        $token = bin2hex(random_bytes(32));
        $update = $pdo->prepare('UPDATE users SET remember_token = ?, remember_until = DATE_ADD(NOW(), INTERVAL 30 DAY), last_login_at = NOW(), login_attempts = 0 WHERE id = ?');
        $update->execute([$token, $userId]);
        return $token;
    }
}
