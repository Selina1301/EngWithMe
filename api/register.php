<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$name = trim((string) ($_POST['name'] ?? $_POST['full_name'] ?? ''));
$email = strtolower(trim((string) ($_POST['email'] ?? '')));
$password = (string) ($_POST['password'] ?? '');
$goal = trim((string) ($_POST['goal'] ?? ''));

if ($name === '' || $email === '' || $password === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng nhập đầy đủ thông tin.'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['ok' => false, 'message' => 'Email không hợp lệ.'], 422);
}

// 1. Kiểm tra bản ghi MX của tên miền email (DNS MX check) để chặn email ảo
$domain = substr(strrchr($email, "@"), 1);
if (!checkdnsrr($domain, 'MX')) {
    json_response(['ok' => false, 'message' => 'Tên miền email "' . htmlspecialchars($domain) . '" không tồn tại hoặc không thể nhận thư.'], 422);
}

if (strlen($password) < 6) {
    json_response(['ok' => false, 'message' => 'Mật khẩu cần tối thiểu 6 ký tự.'], 422);
}

try {
    $pdo = db();

    $check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $check->execute([$email]);

    if ($check->fetch()) {
        json_response(['ok' => false, 'message' => 'Email này đã được đăng ký.'], 409);
    }

    $verificationToken = bin2hex(random_bytes(32));

    $insert = $pdo->prepare(
        'INSERT INTO users (full_name, email, password, role, level, learning_goal, status, verification_token)
         VALUES (?, ?, ?, "user", "A1", ?, "pending", ?)'
    );
    $insert->execute([
        $name,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $goal !== '' ? $goal : null,
        $verificationToken
    ]);

    $userId = (int) $pdo->lastInsertId();

    log_user_activity('register_success', ['email' => $email]);

    // 2. Tạo đường dẫn kích hoạt tuyệt đối gửi qua mail
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $scriptPath = $_SERVER['SCRIPT_NAME'];
    $projectPath = str_replace('api/register.php', '', $scriptPath);
    $verifyLink = $protocol . "://" . $host . $projectPath . "verify.html?token=" . $verificationToken;

    // Gửi email xác thực thực sự
    $subject = 'EngWithMe - Xác thực tài khoản của bạn';
    $htmlBody = '
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #2e86de; margin: 0; font-size: 26px; font-weight: bold;">EngWithMe</h2>
            <p style="font-size: 14px; color: #5f27cd; font-weight: bold; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Xác thực tài khoản thành viên</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #f1f2f6; margin-bottom: 25px;">
        <p style="font-size: 16px; color: #2f3542; line-height: 1.6;">Chào <strong>' . htmlspecialchars($name) . '</strong>,</p>
        <p style="font-size: 16px; color: #2f3542; line-height: 1.6;">Cảm ơn bạn đã đăng ký thành viên trên EngWithMe. Vui lòng bấm vào nút bên dưới để xác thực địa chỉ email và kích hoạt tài khoản của bạn:</p>
        <div style="text-align: center; margin: 35px 0;">
            <a href="' . htmlspecialchars($verifyLink) . '" style="background-color: #10ac84; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(16,172,132,0.2);">Kích Hoạt Tài Khoản</a>
        </div>
        <p style="font-size: 13px; color: #747d8c; line-height: 1.5;">Nếu nút trên không hoạt động, bạn có thể sao chép liên kết dưới đây vào trình duyệt:</p>
        <p style="font-size: 13px; color: #2f3542; word-break: break-all; background: #f1f2f6; padding: 10px; border-radius: 6px;"><a href="' . htmlspecialchars($verifyLink) . '" style="color: #2980b9; text-decoration: none;">' . htmlspecialchars($verifyLink) . '</a></p>
    </div>';

    $mailSent = send_mail($email, $subject, $htmlBody);

    $response = [
        'ok' => true,
        'message' => 'Đăng ký thành công! Một email kích hoạt đã được gửi. Vui lòng xác thực trước khi đăng nhập.',
        'redirect' => 'login.html'
    ];

    if (defined('APP_DEBUG') && APP_DEBUG) {
        $response['debug_verify_link'] = $verifyLink;
        $response['mail_sent'] = $mailSent;
    }

    json_response($response, 201);

} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Không thể đăng ký lúc này. Lỗi: ' . $error->getMessage()], 500);
}
