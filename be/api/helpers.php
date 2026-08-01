<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Cấu hình Error & Exception Handling chuẩn Production
(function () {
    if (defined('APP_DEBUG') && APP_DEBUG) {
        error_reporting(E_ALL);
        ini_set('display_errors', '1');
        ini_set('display_startup_errors', '1');
    } else {
        error_reporting(0);
        ini_set('display_errors', '0');
        ini_set('display_startup_errors', '0');
    }

    $logDir = dirname(__DIR__) . '/storage/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0775, true);
    }
    ini_set('log_errors', '1');
    ini_set('error_log', $logDir . '/error.log');

    // Chuyển PHP errors thành ErrorException
    set_error_handler(function (int $severity, string $message, string $file, int $line) {
        if (!(error_reporting() & $severity)) {
            return false;
        }
        throw new \ErrorException($message, 0, $severity, $file, $line);
    });

    // Global Exception Handler trả về JSON đồng bộ và bảo mật
    set_exception_handler(function (\Throwable $exception) {
        error_log(sprintf(
            "Exception: %s in %s:%d\nStack trace:\n%s",
            $exception->getMessage(),
            $exception->getFile(),
            $exception->getLine(),
            $exception->getTraceAsString()
        ));

        if (defined('APP_DEBUG') && APP_DEBUG) {
            json_response([
                'ok' => false,
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => explode("\n", $exception->getTraceAsString())
            ], 500);
        } else {
            json_response([
                'ok' => false,
                'message' => 'Đã có lỗi hệ thống xảy ra. Vui lòng liên hệ quản trị viên.'
            ], 500);
        }
    });
})();

// Register PSR-4 Autoloader for EngWithMe Services
spl_autoload_register(function ($class) {
    $prefix = 'EngWithMe\\Services\\';
    $baseDir = dirname(__DIR__) . '/services/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

function send_cors_headers(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: {$origin}");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token");

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

function start_app_session(): void
{
    send_cors_headers();

    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $sessionPath = dirname(__DIR__) . '/storage/sessions';
    if (!is_dir($sessionPath)) {
        @mkdir($sessionPath, 0775, true);
    }
    session_save_path($sessionPath);

    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') 
        || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');

    session_set_cookie_params([
        'lifetime' => 86400 * 30,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => $secure,
    ]);

    session_start();
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', DB_HOST, DB_PORT, DB_NAME, DB_CHARSET);

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function require_post(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
}

function require_post_method(): void
{
    require_post();
}

function current_user_payload(array $user): array
{
    $isVip = (int) ($user['is_vip'] ?? 0);
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
        'id' => (int) $user['id'],
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

function generate_remember_token(): string
{
    return bin2hex(random_bytes(32));
}

function ensure_user_remember_column(): void
{
    static $checked = false;
    if ($checked) return;
    $checked = true;
    try {
        db()->exec("ALTER TABLE users ADD COLUMN remember_until DATETIME NULL AFTER attempt_lock_until;");
    } catch (\Throwable $e) {}
    try {
        db()->exec("ALTER TABLE users ADD COLUMN remember_token VARCHAR(64) NULL AFTER remember_until;");
    } catch (\Throwable $e) {}
}

function ensure_user_profile_columns(): void
{
    static $checked = false;
    if ($checked) return;
    $checked = true;
    try {
        db()->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER learning_goal;");
    } catch (\Throwable $e) {}
    try {
        db()->exec("ALTER TABLE users ADD COLUMN bio TEXT NULL AFTER phone;");
    } catch (\Throwable $e) {}
    try {
        db()->exec("ALTER TABLE users ADD COLUMN gender VARCHAR(10) NULL AFTER bio;");
    } catch (\Throwable $e) {}
}

function find_current_user(): ?array
{
    ensure_user_profile_columns();
    ensure_payment_tables();
    $pdo = db();

    $userId = (int) ($_SESSION['user_id'] ?? 0);

    // 🌟 SSO Multi-Domain Token Auto-Login Support:
    if ($userId <= 0) {
        $cookieUserId = 0;
        $authToken = '';
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if ($authHeader !== '' && str_starts_with($authHeader, 'Bearer ')) {
            $authToken = trim(substr($authHeader, 7));
        } else if (!empty($_REQUEST['auth_token'])) {
            $authToken = trim((string) $_REQUEST['auth_token']);
        } else if (!empty($_COOKIE['ewm_trusted_device']) && str_contains($_COOKIE['ewm_trusted_device'], ':')) {
            list($cookieUserIdStr, $authToken) = explode(':', $_COOKIE['ewm_trusted_device'], 2);
            $cookieUserId = (int) $cookieUserIdStr;
        }

        if ($authToken !== '') {
            if ($cookieUserId > 0) {
                $stmtToken = $pdo->prepare(
                    'SELECT id FROM users WHERE id = ? AND remember_token = ? AND status = "active" LIMIT 1'
                );
                $stmtToken->execute([$cookieUserId, $authToken]);
            } else {
                $stmtToken = $pdo->prepare(
                    'SELECT id FROM users WHERE remember_token = ? AND status = "active" LIMIT 1'
                );
                $stmtToken->execute([$authToken]);
            }
            $tokenUser = $stmtToken->fetch();
            if ($tokenUser && !empty($tokenUser['id'])) {
                $userId = (int) $tokenUser['id'];
                $_SESSION['user_id'] = $userId;
            }
        }
    }

    if ($userId <= 0) {
        if (isset($_COOKIE['ewm_logged_in'])) {
            setcookie('ewm_logged_in', '', time() - 3600, '/');
        }
        if (isset($_COOKIE['ewm_trusted_device'])) {
            setcookie('ewm_trusted_device', '', time() - 3600, '/');
        }
        return null;
    }

    $statement = $pdo->prepare(
        'SELECT id, full_name, email, role, level, learning_goal, phone, bio, gender, avatar_path, status, is_vip, vip_expires_at, remember_token, created_at, last_login_at
         FROM users
         WHERE id = ?
         LIMIT 1'
    );
    $statement->execute([$userId]);
    $user = $statement->fetch();

    if (!$user || ($user['status'] ?? 'active') !== 'active') {
        unset($_SESSION['user_id']);
        if (isset($_COOKIE['ewm_logged_in'])) {
            setcookie('ewm_logged_in', '', time() - 3600, '/');
        }
        if (isset($_COOKIE['ewm_trusted_device'])) {
            setcookie('ewm_trusted_device', '', time() - 3600, '/');
        }
        return null;
    }

    if (!isset($_COOKIE['ewm_logged_in'])) {
        setcookie('ewm_logged_in', '1', time() + 86400 * 30, '/');
    }

    return $user;
}

function require_current_user(): array
{
    $user = find_current_user();
    if (!$user) {
        json_response(['ok' => false, 'message' => 'Chưa đăng nhập.'], 401);
    }

    return $user;
}

function require_auth_user(): array
{
    return require_current_user();
}

function require_admin_user(): array
{
    $user = require_current_user();
    if (($user['role'] ?? 'user') !== 'admin') {
        json_response(['ok' => false, 'message' => 'Bạn không có quyền quản trị.'], 403);
    }

    return $user;
}

/**
 * Gửi email thật sử dụng thư viện PHPMailer thông qua cấu hình SMTP trong .env
 */
function send_mail(string $to, string $subject, string $htmlBody, string $altBody = ''): bool
{
    require_once __DIR__ . '/libs/PHPMailer/Exception.php';
    require_once __DIR__ . '/libs/PHPMailer/PHPMailer.php';
    require_once __DIR__ . '/libs/PHPMailer/SMTP.php';

    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        
        if (strtolower(MAIL_ENCRYPTION) === 'ssl') {
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port       = MAIL_PORT ?: 465;
        } else {
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = MAIL_PORT ?: 587;
        }
        
        $mail->CharSet = 'UTF-8';

        // Cấu hình người gửi và người nhận
        $mail->setFrom(MAIL_FROM_ADDRESS, MAIL_FROM_NAME);
        $mail->addReplyTo(MAIL_FROM_ADDRESS, MAIL_FROM_NAME);
        $mail->Sender = MAIL_FROM_ADDRESS; // Thiết lập Return-Path để tránh lỗi SPF
        $mail->addAddress($to);

        // Nội dung thư
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = $altBody ?: strip_tags($htmlBody);

        // Thiết lập các header chống spam và tăng độ tin cậy của email giao dịch (transactional)
        $mail->addCustomHeader('X-Mailer', 'PHP/' . phpversion());
        $mail->addCustomHeader('List-Unsubscribe', '<mailto:' . MAIL_FROM_ADDRESS . '?subject=unsubscribe>');
        $mail->addCustomHeader('X-Auto-Response-Suppress', 'All');
        $mail->addCustomHeader('Auto-Submitted', 'auto-generated');
        $mail->addCustomHeader('Precedence', 'bulk');
        
        // Đặt độ ưu tiên cao cho email OTP/giao dịch khẩn cấp
        $mail->Priority = 1;
        $mail->addCustomHeader('X-Priority', '1');

        return $mail->send();
    } catch (\Exception $e) {
        error_log("PHPMailer Error: " . $mail->ErrorInfo . " | Exception: " . $e->getMessage());
        return false;
    }
}

/**
 * Gửi email chứa mã xác thực OTP dùng chung cho Đăng ký, Đăng nhập & Gửi lại mã OTP
 */
function send_otp_mail(string $to, string $name, string $otp): bool
{
    $subject = "Mã xác thực OTP của bạn - EngWithMe";
    $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $safeOtp = htmlspecialchars($otp, ENT_QUOTES, 'UTF-8');

    $htmlBody = "
        <div style='font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;'>
            <div style='text-align: center; margin-bottom: 20px;'>
                <h2 style='color: #0f172a; margin: 0 0 8px; font-size: 22px;'>Xác Thực Tài Khoản EngWithMe</h2>
                <p style='color: #64748b; font-size: 14px; margin: 0;'>Nền tảng học tiếng Anh thông minh</p>
            </div>
            <div style='background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; margin-bottom: 20px;'>
                <p style='margin: 0 0 12px; color: #334155; font-size: 15px;'>Xin chào <strong>{$safeName}</strong>,</p>
                <p style='margin: 0 0 16px; color: #475569; font-size: 14px;'>Mã xác thực OTP 6 chữ số của bạn là:</p>
                <div style='font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #16a34a; background: #0f172a; padding: 18px; text-align: center; border-radius: 12px; margin: 16px 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);'>
                    {$safeOtp}
                </div>
                <p style='margin: 0; color: #e11d48; font-size: 13px; font-weight: 600;'>⏱ Mã này có hiệu lực trong vòng 10 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
            </div>
            <p style='color: #94a3b8; font-size: 12px; text-align: center; margin: 0;'>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
        </div>
    ";

    return send_mail($to, $subject, $htmlBody);
}

/**
 * Ghi nhận sự kiện hoạt động của người dùng phục vụ telemetry phân tích dữ liệu (BigQuery/Analytics)
 */
function log_user_activity(string $eventName, array $payload = []): void
{
    try {
        $pdo = db();

        // Xác thực người dùng hiện tại (nếu có)
        $userId = null;
        if (isset($_SESSION['user_id'])) {
            $userId = (int) $_SESSION['user_id'];
        }

        $sessionId = session_id();
        $pageUrl = $_SERVER['HTTP_REFERER'] ?? $_SERVER['REQUEST_URI'] ?? '';
        $payloadJson = !empty($payload) ? json_encode($payload, JSON_UNESCAPED_UNICODE) : null;
        
        // Nhận diện IP của Client
        $ipAddress = $_SERVER['HTTP_CLIENT_IP'] 
            ?? $_SERVER['HTTP_X_FORWARDED_FOR'] 
            ?? $_SERVER['REMOTE_ADDR'] 
            ?? '';
            
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $stmt = $pdo->prepare(
            'INSERT INTO user_activity_logs (user_id, session_id, event_name, page_url, payload_json, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $sessionId ?: null,
            $eventName,
            substr($pageUrl, 0, 255),
            $payloadJson,
            substr($ipAddress, 0, 45),
            substr($userAgent, 0, 255)
        ]);
    } catch (\Throwable $e) {
        // Luồng ghi log phụ trợ không được làm crash luồng nghiệp vụ chính
        error_log("Telemetry logging error: " . $e->getMessage());
    }
}

/**
 * Đảm bảo bảng topic_leaderboard phục vụ BXH Vinh Danh Top 1 theo từng chủ đề bài học
 */
function ensure_leaderboard_table(): void
{
    try {
        $pdo = db();
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS topic_leaderboard (
                id INT AUTO_INCREMENT PRIMARY KEY,
                topic_id VARCHAR(64) NOT NULL,
                user_id INT NULL,
                user_name VARCHAR(100) NOT NULL,
                correct_count INT NOT NULL DEFAULT 0,
                time_seconds INT NOT NULL DEFAULT 999,
                score INT NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_topic (topic_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );
    } catch (\Throwable $e) {
        error_log("Failed to ensure topic_leaderboard table: " . $e->getMessage());
    }
}

/**
 * Đảm bảo bảng user_levels lưu trữ XP và Level vô hạn của người dùng
 */
function ensure_user_level_table(): void
{
    try {
        $pdo = db();
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS user_levels (
                user_id INT PRIMARY KEY,
                total_xp INT NOT NULL DEFAULT 0,
                level INT NOT NULL DEFAULT 1,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );
    } catch (\Throwable $e) {
        error_log("Failed to ensure user_levels table: " . $e->getMessage());
    }
}

/**
 * Đảm bảo bảng user_vocab_quiz_stats lưu trữ điểm quiz & streak fast question
 */
function ensure_vocab_quiz_tables(): void
{
    try {
        $pdo = db();
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS user_vocab_quiz_stats (
                user_id INT PRIMARY KEY,
                correct_count INT NOT NULL DEFAULT 0,
                total_count INT NOT NULL DEFAULT 0,
                fast_streak INT NOT NULL DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );

        try {
            $pdo->exec('ALTER TABLE user_vocab_quiz_stats ADD COLUMN fast_streak INT NOT NULL DEFAULT 0');
        } catch (\Throwable $e) {
            // Column already exists
        }
    } catch (\Throwable $e) {
        error_log("Failed to ensure user_vocab_quiz_stats table: " . $e->getMessage());
    }
}

/**
 * Đảm bảo bảng blogs có cột views, likes và tạo bảng blog_likes lưu trữ lượt thích chuẩn CSDL
 */
function ensure_blog_social_table(): void
{
    try {
        $pdo = db();
        try {
            $pdo->exec("ALTER TABLE blogs ADD COLUMN views INT NOT NULL DEFAULT 1");
        } catch (\Throwable $e) {}

        try {
            $pdo->exec("ALTER TABLE blogs ADD COLUMN likes INT NOT NULL DEFAULT 0");
        } catch (\Throwable $e) {}

        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS blog_likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                blog_id INT NOT NULL,
                user_id INT NULL,
                user_ip VARCHAR(64) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_like (blog_id, user_ip)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;'
        );
    } catch (\Throwable $e) {
        error_log("Failed to ensure blog_social_table: " . $e->getMessage());
    }
}

/**
 * Đảm bảo bảng orders tồn tại và bổ sung cột is_vip, vip_expires_at vào bảng users
 */
function ensure_payment_tables(): void
{
    try {
        $pdo = db();
        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN is_vip TINYINT(1) NOT NULL DEFAULT 0");
        } catch (\Throwable $e) {}

        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN vip_expires_at DATETIME NULL AFTER is_vip;");
        } catch (\Throwable $e) {}

        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_code BIGINT NOT NULL UNIQUE,
                user_id INT NOT NULL,
                plan_id VARCHAR(32) NOT NULL,
                amount INT NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT "PENDING",
                payment_link_id VARCHAR(128) NULL,
                qr_code TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;'
        );
    } catch (\Throwable $e) {
        error_log("Failed to ensure payment_tables: " . $e->getMessage());
    }
}

/**
 * Nâng cấp hoặc Gia hạn VIP cho người dùng theo gói đăng ký
 */
function activate_user_vip(int $userId, string $planId): bool
{
    if ($userId <= 0) return false;
    ensure_payment_tables();
    $pdo = db();

    $stmt = $pdo->prepare("SELECT id, is_vip, vip_expires_at FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) return false;

    $isCurrentlyVip = (int) ($user['is_vip'] ?? 0) === 1;
    $currentExpires = !empty($user['vip_expires_at']) ? strtotime((string) $user['vip_expires_at']) : 0;
    $now = time();

    $cleanPlan = strtolower(trim($planId));
    if ($cleanPlan === 'premium' || $cleanPlan === 'premium_lifetime') {
        // Premium: VIP Trọn Đời (Lifetime - vip_expires_at = NULL)
        $update = $pdo->prepare("UPDATE users SET is_vip = 1, vip_expires_at = NULL WHERE id = ?");
        return $update->execute([$userId]);
    } else {
        // Pro: VIP Theo Tháng (+30 ngày)
        // Nếu user đang còn hạn Pro, cộng dồn +30 ngày từ mốc hết hạn cũ
        if ($isCurrentlyVip && $currentExpires > $now) {
            $newExpire = date('Y-m-d H:i:s', $currentExpires + (30 * 86400));
        } else {
            $newExpire = date('Y-m-d H:i:s', $now + (30 * 86400));
        }

        $update = $pdo->prepare("UPDATE users SET is_vip = 1, vip_expires_at = ? WHERE id = ?");
        return $update->execute([$newExpire, $userId]);
    }
}

/**
 * Đảm bảo bảng notifications tồn tại trong MySQL
 */
function ensure_notifications_table(): void
{
    static $checked = false;
    if ($checked) return;

    try {
        $pdo = db();
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS notifications (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              category ENUM('blog', 'listening', 'vocabulary', 'grammar', 'exam', 'premium', 'comment', 'security', 'streak', 'achievement', 'system') NOT NULL DEFAULT 'system',
              status_level ENUM('info', 'success', 'warning', 'danger') NOT NULL DEFAULT 'info',
              link VARCHAR(255) NULL,
              is_read TINYINT(1) NOT NULL DEFAULT 0,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_user_read_created (user_id, is_read, created_at),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        $checked = true;
    } catch (\Throwable $e) {
        error_log("Failed to ensure_notifications_table: " . $e->getMessage());
    }
}

/**
 * Thêm thông báo mới cho người dùng
 */
function add_user_notification(
    int $userId,
    string $title,
    string $message,
    string $category = 'system',
    string $statusLevel = 'info',
    ?string $link = null
): bool {
    if ($userId <= 0) return false;
    ensure_notifications_table();
    try {
        $pdo = db();
        $validCategories = ['blog', 'listening', 'vocabulary', 'grammar', 'exam', 'premium', 'comment', 'security', 'streak', 'achievement', 'system'];
        $validLevels = ['info', 'success', 'warning', 'danger'];

        $cat = in_array($category, $validCategories, true) ? $category : 'system';
        $level = in_array($statusLevel, $validLevels, true) ? $statusLevel : 'info';

        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, category, status_level, link)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        return $stmt->execute([$userId, $title, $message, $cat, $level, $link]);
    } catch (\Throwable $e) {
        error_log("Failed to add notification for user {$userId}: " . $e->getMessage());
        return false;
    }
}

