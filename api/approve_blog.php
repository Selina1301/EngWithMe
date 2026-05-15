<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$admin = require_admin_user();

$id = (int) ($_POST['id'] ?? 0);
$action = trim((string) ($_POST['action'] ?? '')); // 'approve', 'reject', or 'delete'

if ($id <= 0 || ($action !== 'approve' && $action !== 'reject' && $action !== 'delete')) {
    json_response(['ok' => false, 'message' => 'Dữ liệu yêu cầu không hợp lệ.'], 422);
}

try {
    if ($action === 'delete') {
        $statement = db()->prepare('DELETE FROM blogs WHERE id = ?');
        $statement->execute([$id]);

        json_response([
            'ok' => true,
            'message' => 'Đã xóa bài viết khỏi hệ thống thành công!'
        ]);
    }

    $status = ($action === 'approve') ? 'approved' : 'rejected';
    $statement = db()->prepare('UPDATE blogs SET status = ? WHERE id = ?');
    $statement->execute([$status, $id]);

    json_response([
        'ok' => true,
        'message' => ($action === 'approve') ? 'Đã duyệt bài viết thành công!' : 'Đã từ chối bài viết.'
    ]);

} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi xử lý yêu cầu.'], 500);
}
