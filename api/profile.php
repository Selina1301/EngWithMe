<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$currentUser = require_current_user();
$name = trim((string) ($_POST['name'] ?? ''));
$level = strtoupper(trim((string) ($_POST['level'] ?? 'A1')));
$goal = trim((string) ($_POST['goal'] ?? ''));
$validLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];

if ($name === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng nhập họ tên.'], 422);
}

if (!in_array($level, $validLevels, true)) {
    json_response(['ok' => false, 'message' => 'Trình độ không hợp lệ.'], 422);
}

try {
    $avatarPath = $currentUser['avatar_path'] ?? null;

    if (isset($_FILES['avatar']) && is_array($_FILES['avatar']) && ($_FILES['avatar']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        $avatarPath = save_avatar_upload($_FILES['avatar'], (int) $currentUser['id']);
    }

    $update = db()->prepare(
        'UPDATE users
         SET full_name = ?, level = ?, learning_goal = ?, avatar_path = ?
         WHERE id = ?'
    );
    $update->execute([
        $name,
        $level,
        $goal !== '' ? $goal : null,
        $avatarPath ?: null,
        (int) $currentUser['id'],
    ]);

    $user = require_current_user();
    log_user_activity('profile_updated', [
        'name' => $name,
        'level' => $level,
        'has_avatar_changed' => (isset($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE)
    ]);
    json_response([
        'ok' => true,
        'message' => 'Đã lưu hồ sơ cá nhân.',
        'user' => current_user_payload($user),
    ]);
} catch (Throwable $error) {
    $message = $error instanceof RuntimeException
        ? $error->getMessage()
        : 'Không thể lưu hồ sơ lúc này.';
    json_response(['ok' => false, 'message' => $message], 500);
}

function save_avatar_upload(array $file, int $userId): string
{
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Không thể tải ảnh đại diện lên.');
    }

    if (($file['size'] ?? 0) > 2 * 1024 * 1024) {
        throw new RuntimeException('Ảnh đại diện tối đa 2MB.');
    }

    $tmpPath = (string) ($file['tmp_name'] ?? '');
    if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
        throw new RuntimeException('File ảnh không hợp lệ.');
    }

    $imageInfo = @getimagesize($tmpPath);
    if (!$imageInfo || empty($imageInfo['mime'])) {
        throw new RuntimeException('Vui lòng chọn file ảnh hợp lệ.');
    }

    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    $mime = (string) $imageInfo['mime'];
    if (!isset($extensions[$mime])) {
        throw new RuntimeException('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.');
    }

    // Tích hợp Cloudinary nếu có cấu hình trong file .env
    $cloudinaryCloud = trim($_ENV['CLOUDINARY_CLOUD_NAME'] ?? getenv('CLOUDINARY_CLOUD_NAME') ?: '');
    $cloudinaryPreset = trim($_ENV['CLOUDINARY_UPLOAD_PRESET'] ?? getenv('CLOUDINARY_UPLOAD_PRESET') ?: '');

    if ($cloudinaryCloud !== '' && $cloudinaryPreset !== '') {
        try {
            $url = 'https://api.cloudinary.com/v1_1/' . urlencode($cloudinaryCloud) . '/image/upload';
            $cfile = new CURLFile($tmpPath, $mime, basename($tmpPath));
            
            $postData = [
                'file' => $cfile,
                'upload_preset' => $cloudinaryPreset,
                'public_id' => 'user-' . $userId . '-' . bin2hex(random_bytes(4))
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Tránh lỗi chứng chỉ SSL trên XAMPP local
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200) {
                $data = json_decode($response ?: '', true);
                if (!empty($data['secure_url'])) {
                    return (string) $data['secure_url'];
                }
            }
        } catch (Throwable $e) {
            // Nếu upload cloud lỗi, tự động trượt về phương án lưu local phía dưới
        }
    }

    // Phương án dự phòng (Fallback): Lưu trữ cục bộ
    $uploadDir = dirname(__DIR__) . '/uploads/avatars';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
        throw new RuntimeException('Không thể tạo thư mục lưu ảnh.');
    }

    $filename = sprintf('user-%d-%s.%s', $userId, bin2hex(random_bytes(8)), $extensions[$mime]);
    $targetPath = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($tmpPath, $targetPath)) {
        throw new RuntimeException('Không thể lưu ảnh đại diện.');
    }

    return 'uploads/avatars/' . $filename;
}
