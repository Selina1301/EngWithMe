<?php
declare(strict_types=1);

namespace EngWithMe\Services;

class UploadService
{
    private static string $uploadDir = __DIR__ . '/../uploads/avatars';

    public static function saveAvatar(array $file, int $userId): ?string
    {
        if (empty($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
            return null;
        }

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $allowedMimes, true)) {
            return null;
        }

        if (!is_dir(self::$uploadDir)) {
            @mkdir(self::$uploadDir, 0775, true);
        }

        $ext = match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'jpg'
        };

        $filename = "avatar_{$userId}_" . time() . ".{$ext}";
        $targetPath = self::$uploadDir . '/' . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            return "uploads/avatars/{$filename}";
        }

        return null;
    }
}
