<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

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

function start_app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $sessionPath = __DIR__ . '/sessions';
    if (!is_dir($sessionPath)) {
        mkdir($sessionPath, 0775, true);
    }
    session_save_path($sessionPath);

    $secure = defined('SESSION_SECURE') && SESSION_SECURE !== null 
        ? SESSION_SECURE 
        : (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

    session_set_cookie_params([
        'lifetime' => 0,
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

function current_user_payload(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'name' => $user['full_name'] ?? $user['name'] ?? '',
        'email' => $user['email'] ?? '',
        'role' => $user['role'] ?? 'user',
        'level' => $user['level'] ?? 'A1',
        'goal' => $user['learning_goal'] ?? '',
        'avatar' => $user['avatar_path'] ?? '',
        'status' => $user['status'] ?? 'active',
        'createdAt' => $user['created_at'] ?? null,
        'lastLoginAt' => $user['last_login_at'] ?? null,
    ];
}

function find_current_user(): ?array
{
    $userId = (int) ($_SESSION['user_id'] ?? 0);
    if ($userId <= 0) {
        if (isset($_COOKIE['ewm_logged_in'])) {
            setcookie('ewm_logged_in', '', time() - 3600, '/');
        }
        return null;
    }

    $statement = db()->prepare(
        'SELECT id, full_name, email, role, level, learning_goal, avatar_path, status, created_at, last_login_at
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
 * Ghi nhận sự kiện hoạt động của người dùng phục vụ telemetry phân tích dữ liệu (BigQuery/Analytics)
 */
function log_user_activity(string $eventName, array $payload = []): void
{
    try {
        $pdo = db();
        
        // Tự động kiểm tra và tạo bảng lưu trữ logs hoạt động
        static $tableChecked = false;
        if (!$tableChecked) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS user_activity_logs (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  user_id INT NULL,
                  session_id VARCHAR(100) NULL,
                  event_name VARCHAR(100) NOT NULL,
                  page_url VARCHAR(255) NULL,
                  payload_json TEXT NULL,
                  ip_address VARCHAR(45) NULL,
                  user_agent VARCHAR(255) NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                ) ENGINE=InnoDB;"
            );
            $tableChecked = true;
        }

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
    } catch (Throwable $e) {
        // Luồng ghi log phụ trợ không được làm crash luồng nghiệp vụ chính
        error_log("Telemetry logging error: " . $e->getMessage());
    }
}
