<?php
declare(strict_types=1);

namespace EngWithMe\Services;

use PDO;

class UserService
{
    public static function getUserPayload(array $user): array
    {
        $isVip = (int)($user['is_vip'] ?? 0);
        $plan = 'free';
        if ($isVip === 1) {
            $expires = $user['vip_expires_at'] ?? null;
            if (empty($expires) || str_starts_with((string)$expires, '2099')) {
                $plan = 'premium';
            } else {
                $plan = 'pro';
            }
        }

        return [
            'id' => (int)$user['id'],
            'name' => $user['full_name'] ?? $user['name'] ?? '',
            'email' => $user['email'] ?? '',
            'role' => $user['role'] ?? 'user',
            'level' => $user['level'] ?? 'A1',
            'goal' => $user['learning_goal'] ?? '',
            'phone' => $user['phone'] ?? '',
            'bio' => $user['bio'] ?? '',
            'gender' => $user['gender'] ?? 'male',
            'avatar' => $user['avatar_path'] ?? '',
            'status' => $user['status'] ?? 'active',
            'is_vip' => $isVip,
            'plan' => $plan,
            'vip_expires_at' => $user['vip_expires_at'] ?? null,
            'session_token' => $user['remember_token'] ?? null,
            'createdAt' => $user['created_at'] ?? null,
            'lastLoginAt' => $user['last_login_at'] ?? null,
        ];
    }

    public static function hasRole(array $user, array $allowedRoles): bool
    {
        $userRole = strtolower($user['role'] ?? 'user');
        return in_array($userRole, array_map('strtolower', $allowedRoles), true);
    }
}
