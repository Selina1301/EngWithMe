<?php
declare(strict_types=1);

namespace EngWithMe\Services;

class RateLimiter
{
    private static string $storageFile = __DIR__ . '/../storage/logs/ratelimit.json';

    public static function isAllowed(string $key, int $maxAttempts = 5, int $decaySeconds = 300): bool
    {
        $data = self::loadData();
        $now = time();

        if (isset($data[$key])) {
            $attempts = array_filter($data[$key], fn($time) => ($now - $time) < $decaySeconds);
            $data[$key] = array_values($attempts);
        } else {
            $data[$key] = [];
        }

        if (count($data[$key]) >= $maxAttempts) {
            self::saveData($data);
            return false;
        }

        $data[$key][] = $now;
        self::saveData($data);
        return true;
    }

    private static function loadData(): array
    {
        if (file_exists(self::$storageFile)) {
            $content = @file_get_contents(self::$storageFile);
            return json_decode((string)$content, true) ?? [];
        }
        return [];
    }

    private static function saveData(array $data): void
    {
        $dir = dirname(self::$storageFile);
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        @file_put_contents(self::$storageFile, json_encode($data), LOCK_EX);
    }
}
