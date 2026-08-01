<?php
declare(strict_types=1);

namespace EngWithMe\Services;

use PDO;

class NotificationService
{
    public static function getUserNotifications(PDO $pdo, int $userId): array
    {
        // Auto-seed if user has no notifications
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ?");
        $checkStmt->execute([$userId]);
        if ((int)$checkStmt->fetchColumn() === 0) {
            self::seedPersonalized($pdo, $userId);
        }

        $stmt = $pdo->prepare("
            SELECT id, title, message, category, status_level, link, is_read, created_at 
            FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 100
        ");
        $stmt->execute([$userId]);
        $rawItems = $stmt->fetchAll();

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
        $countStmt->execute([$userId]);
        $unreadCount = (int)$countStmt->fetchColumn();

        $now = time();
        $formattedItems = [];
        $grouped = ['today' => [], 'yesterday' => [], 'earlier' => []];

        foreach ($rawItems as $item) {
            $timestamp = strtotime((string)$item['created_at']);
            $diff = max(0, $now - $timestamp);
            $timeAgo = self::formatRelativeTime($diff, $timestamp);
            $groupKey = self::getDateGroupKey($timestamp);

            $processed = [
                'id' => (int)$item['id'],
                'title' => $item['title'],
                'message' => $item['message'],
                'category' => $item['category'],
                'status_level' => $item['status_level'],
                'link' => $item['link'] ?? '#',
                'is_read' => (int)$item['is_read'] === 1,
                'created_at' => $item['created_at'],
                'time_ago' => $timeAgo,
                'icon' => self::getCategoryIcon($item['category']),
                'status_tag' => self::getStatusTag($item['status_level'], $item['category']),
            ];

            $formattedItems[] = $processed;
            if (isset($grouped[$groupKey])) {
                $grouped[$groupKey][] = $processed;
            } else {
                $grouped['earlier'][] = $processed;
            }
        }

        return [
            'unread_count' => $unreadCount,
            'items' => $formattedItems,
            'grouped' => [
                'today' => ['label' => 'Hôm nay', 'items' => $grouped['today']],
                'yesterday' => ['label' => 'Hôm qua', 'items' => $grouped['yesterday']],
                'earlier' => ['label' => 'Trước đó', 'items' => $grouped['earlier']],
            ]
        ];
    }

    public static function markAsRead(PDO $pdo, int $userId, int $notifId = 0): int
    {
        if ($notifId > 0) {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
            $stmt->execute([$notifId, $userId]);
        } else {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
            $stmt->execute([$userId]);
        }

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
        $countStmt->execute([$userId]);
        return (int)$countStmt->fetchColumn();
    }

    public static function deleteAll(PDO $pdo, int $userId): bool
    {
        $stmt = $pdo->prepare("DELETE FROM notifications WHERE user_id = ?");
        return $stmt->execute([$userId]);
    }

    public static function addNotification(
        PDO $pdo,
        int $userId,
        string $title,
        string $message,
        string $category = 'system',
        string $statusLevel = 'info',
        ?string $link = null
    ): bool {
        if ($userId <= 0) return false;
        try {
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, category, status_level, link)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            return $stmt->execute([$userId, $title, $message, $category, $statusLevel, $link]);
        } catch (\Throwable $e) {
            LoggerService::error('notification', 'Failed to add notification: ' . $e->getMessage());
            return false;
        }
    }

    public static function seedPersonalized(PDO $pdo, int $userId): void
    {
        $stmt = $pdo->prepare("SELECT full_name, level, is_vip FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $user = $stmt->fetch() ?: [];

        $level = strtoupper($user['level'] ?? 'A1');
        $userName = $user['full_name'] ?? 'Học viên';
        $isVip = (int)($user['is_vip'] ?? 0) === 1;

        self::addNotification($pdo, $userId, "Bộ từ vựng trình độ {$level} mới!", "Có 25 từ vựng mới phù hợp với mục tiêu trình độ {$level} của bạn.", 'vocabulary', 'info', 'vocabulary.html');
        self::addNotification($pdo, $userId, "🔥 Nhắc nhở luyện tập Listening", "Hôm nay bạn chưa luyện Listening Part 3 & 4. Dành 10 phút để giữ vững phong độ nhé!", 'listening', 'warning', 'listening.html');
        self::addNotification($pdo, $userId, "Bài TOEIC Full Test Part 7 mới", "Đã cập nhật đề thi TOEIC Part 7 chuẩn định dạng 2026.", 'exam', 'info', 'exam-practice.html');
        self::addNotification($pdo, $userId, "⭐ Chúc mừng thành tích học tập!", "Bạn đã xuất sắc hoàn thành mục tiêu học tập liên tục. Tiếp tục phát huy nhé {$userName}!", 'achievement', 'success', 'profile.html#achievements');

        if ($isVip) {
            self::addNotification($pdo, $userId, "💎 Đặc quyền Premium VIP đã kích hoạt", "Cảm ơn bạn đã đồng hành! Bạn có toàn quyền truy cập 100% tài nguyên luyện nghe & đề thi KHÓ.", 'premium', 'success', 'pricing.html');
        } else {
            self::addNotification($pdo, $userId, "🟡 Gói Pro / Premium ưu đãi học viên", "Mở khóa toàn bộ 120+ bài luyện nghe chuẩn Mỹ & kho từ vựng nâng cao chỉ từ 7.777đ/tháng.", 'premium', 'warning', 'pricing.html');
        }
    }

    private static function formatRelativeTime(int $diff, int $timestamp): string
    {
        if ($diff < 60) return 'Vừa xong';
        if ($diff < 3600) return ((int)floor($diff / 60)) . ' phút trước';
        if ($diff < 86400) return ((int)floor($diff / 3600)) . ' giờ trước';
        $days = (int)floor($diff / 86400);
        if ($days === 1) return 'Hôm qua';
        if ($days < 7) return "{$days} ngày trước";
        return date('d/m/Y', $timestamp);
    }

    private static function getDateGroupKey(int $timestamp): string
    {
        $todayStart = strtotime('today 00:00:00');
        $yesterdayStart = strtotime('yesterday 00:00:00');
        if ($timestamp >= $todayStart) return 'today';
        if ($timestamp >= $yesterdayStart) return 'yesterday';
        return 'earlier';
    }

    private static function getCategoryIcon(string $cat): string
    {
        return match ($cat) {
            'blog' => '📖',
            'listening' => '🎧',
            'vocabulary' => '🔤',
            'grammar' => '📚',
            'exam' => '📝',
            'achievement' => '⭐',
            'premium' => '💎',
            'security' => '🔒',
            'comment' => '💬',
            'streak' => '🔥',
            default => '🔔',
        };
    }

    private static function getStatusTag(string $level, string $category): string
    {
        return match ($level) {
            'danger' => '🔴 [Quan trọng]',
            'warning' => '🟡 [Cảnh báo]',
            'success' => '🟢 [Thành công]',
            default => match ($category) {
                'blog' => '🔵 [Blog mới]',
                'listening' => '🔵 [Luyện nghe]',
                'vocabulary' => '🔵 [Từ vựng]',
                'exam' => '🔵 [Bài thi mới]',
                'streak' => '🔥 [Chuỗi học]',
                default => '🔵 [Thông tin]',
            },
        };
    }
}
