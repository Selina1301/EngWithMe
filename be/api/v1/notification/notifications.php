<?php
declare(strict_types=1);

require_once __DIR__ . '/../../helpers.php';
start_app_session();
ensure_notifications_table();

$user = find_current_user();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? $_POST['action'] ?? 'get';

if ($method === 'POST') {
    if (!$user) {
        json_response(['ok' => false, 'message' => 'Bạn chưa đăng nhập.'], 401);
    }

    $userId = (int) $user['id'];
    $pdo = db();

    if ($action === 'mark_read') {
        $rawInput = json_decode(file_get_contents('php://input'), true) ?? [];
        $notifId = isset($rawInput['id']) ? (int) $rawInput['id'] : (isset($_POST['id']) ? (int) $_POST['id'] : 0);

        if ($notifId > 0) {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
            $stmt->execute([$notifId, $userId]);
        } else {
            // Mark all as read
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
            $stmt->execute([$userId]);
        }

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
        $countStmt->execute([$userId]);
        $unreadCount = (int) $countStmt->fetchColumn();

        json_response(['ok' => true, 'unread_count' => $unreadCount]);
    }

    if ($action === 'delete_all') {
        $stmt = $pdo->prepare("DELETE FROM notifications WHERE user_id = ?");
        $stmt->execute([$userId]);

        json_response(['ok' => true, 'unread_count' => 0]);
    }

    if ($action === 'generate_personalized') {
        seed_personalized_user_notifications($userId, $user);
        // Fallthrough to return updated notifications list
        $action = 'get';
    }
}

// Default GET or fallback: fetch notifications list
if ($user) {
    $userId = (int) $user['id'];
    $pdo = db();

    // Check if user has notifications, if not seed initial personalized notifications
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ?");
    $checkStmt->execute([$userId]);
    if ((int) $checkStmt->fetchColumn() === 0) {
        seed_personalized_user_notifications($userId, $user);
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
    $unreadCount = (int) $countStmt->fetchColumn();
} else {
    // Visitor / Guest fallback demo notifications
    $rawItems = get_guest_demo_notifications();
    $unreadCount = count(array_filter($rawItems, fn($item) => empty($item['is_read'])));
}

// Process relative time and grouping
$formattedItems = [];
$grouped = [
    'today' => [],
    'yesterday' => [],
    'earlier' => [],
];

$now = time();

foreach ($rawItems as $item) {
    $timestamp = strtotime((string) $item['created_at']);
    $diff = max(0, $now - $timestamp);
    $timeAgo = format_relative_time($diff, $timestamp);
    $groupKey = get_date_group_key($timestamp);

    $processed = [
        'id' => (int) $item['id'],
        'title' => $item['title'],
        'message' => $item['message'],
        'category' => $item['category'],
        'status_level' => $item['status_level'],
        'link' => $item['link'] ?? '#',
        'is_read' => (int) $item['is_read'] === 1,
        'created_at' => $item['created_at'],
        'time_ago' => $timeAgo,
        'icon' => get_category_icon($item['category']),
        'status_tag' => get_status_tag($item['status_level'], $item['category']),
    ];

    $formattedItems[] = $processed;
    if (isset($grouped[$groupKey])) {
        $grouped[$groupKey][] = $processed;
    } else {
        $grouped['earlier'][] = $processed;
    }
}

json_response([
    'ok' => true,
    'unread_count' => $unreadCount,
    'items' => $formattedItems,
    'grouped' => [
        'today' => [
            'label' => 'Hôm nay',
            'items' => $grouped['today'],
        ],
        'yesterday' => [
            'label' => 'Hôm qua',
            'items' => $grouped['yesterday'],
        ],
        'earlier' => [
            'label' => 'Trước đó',
            'items' => $grouped['earlier'],
        ],
    ],
]);

// Helper Functions
function format_relative_time(int $diff, int $timestamp): string
{
    if ($diff < 60) {
        return 'Vừa xong';
    }
    if ($diff < 3600) {
        $mins = (int) floor($diff / 60);
        return "{$mins} phút trước";
    }
    if ($diff < 86400) {
        $hours = (int) floor($diff / 3600);
        return "{$hours} giờ trước";
    }

    $days = (int) floor($diff / 86400);
    if ($days === 1) {
        return 'Hôm qua';
    }
    if ($days < 7) {
        return "{$days} ngày trước";
    }

    return date('d/m/Y', $timestamp);
}

function get_date_group_key(int $timestamp): string
{
    $todayStart = strtotime('today 00:00:00');
    $yesterdayStart = strtotime('yesterday 00:00:00');

    if ($timestamp >= $todayStart) {
        return 'today';
    }
    if ($timestamp >= $yesterdayStart) {
        return 'yesterday';
    }
    return 'earlier';
}

function get_category_icon(string $cat): string
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

function get_status_tag(string $level, string $category): string
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

/**
 * Sinh thông báo cá nhân hóa tự động cho học viên EngWithMe
 */
function seed_personalized_user_notifications(int $userId, array $user): void
{
    $pdo = db();
    $level = strtoupper($user['level'] ?? 'A1');
    $userName = $user['full_name'] ?? 'Học viên';
    $isVip = (int) ($user['is_vip'] ?? 0) === 1;

    // 1. Level & Personalized content recommendation
    add_user_notification(
        $userId,
        "Bộ từ vựng trình độ {$level} mới!",
        "Có 25 từ vựng mới phù hợp với mục tiêu trình độ {$level} của bạn. Luyện tập ngay hôm nay!",
        'vocabulary',
        'info',
        'vocabulary.html'
    );

    // 2. Daily listening practice reminder
    add_user_notification(
        $userId,
        "🔥 Nhắc nhở luyện tập Listening",
        "Hôm nay bạn chưa luyện Listening Part 3 & 4. Dành 10 phút để giữ vững phong độ nhé!",
        'listening',
        'warning',
        'listening.html'
    );

    // 3. Exam & TOEIC Practice recommendation
    add_user_notification(
        $userId,
        "Bài TOEIC Full Test Part 7 mới",
        "Đã cập nhật đề thi TOEIC Part 7 chuẩn định dạng 2026. Kiểm tra trình độ ngay!",
        'exam',
        'info',
        'exam-practice.html'
    );

    // 4. Streak / Achievement notification
    add_user_notification(
        $userId,
        "⭐ Chúc mừng thành tích học tập!",
        "Bạn đã xuất sắc hoàn thành mục tiêu học tập liên tục. Tiếp tục phát huy nhé {$userName}!",
        'achievement',
        'success',
        'profile.html#achievements'
    );

    // 5. VIP / Premium notification
    if ($isVip) {
        add_user_notification(
            $userId,
            "💎 Đặc quyền Premium VIP đã kích hoạt",
            "Cảm ơn bạn đã đồng hành! Bạn có toàn quyền truy cập 100% tài nguyên luyện nghe & đề thi KHÓ.",
            'premium',
            'success',
            'pricing.html'
        );
    } else {
        add_user_notification(
            $userId,
            "🟡 Gói Pro / Premium ưu đãi học viên",
            "Mở khóa toàn bộ 120+ bài luyện nghe chuẩn Mỹ & kho từ vựng nâng cao chỉ từ 7.777đ/tháng.",
            'premium',
            'warning',
            'pricing.html'
        );
    }

    // 6. Blog & Community interaction
    add_user_notification(
        $userId,
        "📖 Mẹo luyện nói IELTS Speaking Part 2",
        "Bài viết blog mới từ Admin: 'Bí quyết trả lời 2 phút tự nhiên không lo bí từ'.",
        'blog',
        'info',
        'blog.html'
    );

    // 7. Security log
    add_user_notification(
        $userId,
        "🔴 [Quan trọng] Đăng nhập tài khoản",
        "Tài khoản của bạn vừa đăng nhập thành công vào EngWithMe.",
        'security',
        'danger',
        'profile.html#security'
    );
}

/**
 * Trả về thông báo mẫu cho người dùng chưa đăng nhập (Khách)
 */
function get_guest_demo_notifications(): array
{
    $now = date('Y-m-d H:i:s');
    $oneHourAgo = date('Y-m-d H:i:s', time() - 3600);
    $yesterday = date('Y-m-d H:i:s', time() - 86400);

    return [
        [
            'id' => 101,
            'title' => 'Cập nhật bài Listening Part 3 mới',
            'message' => 'Hệ thống vừa bổ sung 15 bài luyện nghe chuẩn giọng Mỹ & Anh!',
            'category' => 'listening',
            'status_level' => 'info',
            'link' => 'listening.html',
            'is_read' => 0,
            'created_at' => $now,
        ],
        [
            'id' => 102,
            'title' => '⭐ Chúc mừng bạn ghé thăm EngWithMe',
            'message' => 'Đăng ký tài khoản ngay để nhận 50 XP và trải nghiệm kho bài học phong phú.',
            'category' => 'achievement',
            'status_level' => 'success',
            'link' => 'register.html',
            'is_read' => 0,
            'created_at' => $oneHourAgo,
        ],
        [
            'id' => 103,
            'title' => '💎 Ưu đãi tài khoản VIP Pro',
            'message' => 'Nâng cấp VIP chỉ từ 7.777đ/tháng mở khóa trọn bộ kho bài thi KHÓ & Từ vựng B2-C1.',
            'category' => 'premium',
            'status_level' => 'warning',
            'link' => 'pricing.html',
            'is_read' => 1,
            'created_at' => $yesterday,
        ]
    ];
}
