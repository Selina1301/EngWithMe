<?php
declare(strict_types=1);

namespace EngWithMe\Services;

class LoggerService
{
    private static string $logDir = __DIR__ . '/../storage/logs';

    public static function log(string $channel, string $message, array $context = []): void
    {
        try {
            if (!is_dir(self::$logDir)) {
                @mkdir(self::$logDir, 0775, true);
            }

            $logFile = self::$logDir . '/' . preg_replace('/[^a-z0-9_-]/i', '', $channel) . '.log';
            $timestamp = date('Y-m-d H:i:s');
            $contextJson = !empty($context) ? ' ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '';
            $line = "[{$timestamp}] {$message}{$contextJson}" . PHP_EOL;

            @file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
        } catch (\Throwable $e) {
            error_log("Logger error: " . $e->getMessage());
        }
    }

    public static function info(string $channel, string $message, array $context = []): void
    {
        self::log($channel, "[INFO] " . $message, $context);
    }

    public static function error(string $channel, string $message, array $context = []): void
    {
        self::log($channel, "[ERROR] " . $message, $context);
    }

    public static function warning(string $channel, string $message, array $context = []): void
    {
        self::log($channel, "[WARN] " . $message, $context);
    }
}
