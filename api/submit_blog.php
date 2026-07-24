<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$user = require_current_user();

$title = trim((string) ($_POST['title'] ?? ''));
$content = trim((string) ($_POST['content'] ?? ''));
$rating = (int) ($_POST['rating'] ?? 5);

if ($title === '' || $content === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng nhập đầy đủ tiêu đề và nội dung.'], 422);
}

if (mb_strlen($title) > 36) {
    json_response(['ok' => false, 'message' => 'Tiêu đề không được vượt quá 36 ký tự.'], 422);
}

if (mb_strlen($content) > 100) {
    json_response(['ok' => false, 'message' => 'Nội dung cảm nhận không được vượt quá 100 ký tự.'], 422);
}

if ($rating < 1 || $rating > 5) {
    json_response(['ok' => false, 'message' => 'Đánh giá phải từ 1 đến 5 sao.'], 422);
}

try {
    $userId = (int) $user['id'];

    // Kiểm tra giới hạn 24h cho thưởng +50 XP
    $checkXp = db()->prepare('SELECT created_at FROM blogs WHERE user_id = ? ORDER BY id DESC LIMIT 1');
    $checkXp->execute([$userId]);
    $lastBlog = $checkXp->fetch();

    $earnedXp = true;
    if ($lastBlog && isset($lastBlog['created_at'])) {
        $lastTime = strtotime((string) $lastBlog['created_at']);
        if ((time() - $lastTime) < 86400) {
            $earnedXp = false;
        }
    }

    // Nếu đủ điều kiện 24h, cộng ngay 50 XP thật vào DB CSDL user_levels
    if ($earnedXp) {
        ensure_user_level_table();
        $stmtLvl = db()->prepare('SELECT total_xp, level FROM user_levels WHERE user_id = ? LIMIT 1');
        $stmtLvl->execute([$userId]);
        $lvlRow = $stmtLvl->fetch();

        if ($lvlRow) {
            $newXp = (int) $lvlRow['total_xp'] + 50;
            $updateXp = db()->prepare('UPDATE user_levels SET total_xp = ? WHERE user_id = ?');
            $updateXp->execute([$newXp, $userId]);
        } else {
            $insertXp = db()->prepare('INSERT INTO user_levels (user_id, total_xp, level) VALUES (?, 50, 1)');
            $insertXp->execute([$userId]);
        }
    }

    $statement = db()->prepare('INSERT INTO blogs (user_id, title, content, rating, status) VALUES (?, ?, ?, ?, "pending")');
    $statement->execute([
        $userId,
        $title,
        $content,
        $rating
    ]);

    json_response([
        'ok' => true,
        'earned_xp' => $earnedXp,
        'message' => $earnedXp 
            ? '🎉 Đã gửi bài viết thành công! Bạn nhận được +50 XP THẬT vào tài khoản.' 
            : '⚠️ Bài viết đã được gửi chờ Admin duyệt! (Lưu ý: Bạn đã nhận 50 XP trong 24h qua, lượt thưởng XP tiếp theo sẽ sau 24h).'
    ]);

} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Lỗi hệ thống khi lưu bài viết: ' . $error->getMessage()], 500);
}
