<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();
require_post();

$email = strtolower(trim((string) ($_POST['email'] ?? '')));

if ($email === '') {
    json_response(['ok' => false, 'message' => 'Vui lòng nhập email.'], 422);
}

try {
    $statement = db()->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $statement->execute([$email]);
    $user = $statement->fetch();

    if ($user) {
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour

        $update = db()->prepare('UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?');
        $update->execute([$token, $expires, (int) $user['id']]);

        // Tạo đường dẫn đổi mật khẩu tuyệt đối (sử dụng APP_URL từ .env hoặc tự động nhận diện)
        if (defined('APP_URL') && APP_URL !== '') {
            $resetLink = rtrim(APP_URL, '/') . "/reset-password.html?token=" . $token;
        } else {
            $protocol = (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') 
                || (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') 
                ? "https" : "http";
            $host = $_SERVER['HTTP_HOST'];
            $scriptPath = $_SERVER['SCRIPT_NAME'];
            $projectPath = str_replace('api/forgot_password.php', '', $scriptPath);
            $resetLink = $protocol . "://" . $host . $projectPath . "reset-password.html?token=" . $token;
        }

        // Nội dung Email HTML cao cấp
        $subject = 'EngWithMe - Khôi phục mật khẩu tài khoản';
        $htmlBody = '
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #2e86de; margin: 0; font-size: 26px; font-weight: bold;">EngWithMe</h2>
                <p style="font-size: 14px; color: #5f27cd; font-weight: bold; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Lộ trình học Tiếng Anh cá nhân hóa</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #f1f2f6; margin-bottom: 25px;">
            <p style="font-size: 16px; color: #2f3542; line-height: 1.6;">Xin chào,</p>
            <p style="font-size: 16px; color: #2f3542; line-height: 1.6;">Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với địa chỉ email này của bạn trên hệ thống EngWithMe.</p>
            <p style="font-size: 16px; color: #2f3542; line-height: 1.6;">Vui lòng nhấn vào nút bên dưới để tiến hành đổi mật khẩu mới (Liên kết này có hiệu lực trong vòng 1 giờ):</p>
            <div style="text-align: center; margin: 35px 0;">
                <a href="' . htmlspecialchars($resetLink) . '" style="background-color: #10ac84; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(16,172,132,0.2);">Đổi Mật Khẩu Mới</a>
            </div>
            <p style="font-size: 13px; color: #747d8c; line-height: 1.5;">Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên kết dưới đây vào trình duyệt của mình:</p>
            <p style="font-size: 13px; color: #2f3542; word-break: break-all; background: #f1f2f6; padding: 10px; border-radius: 6px;"><a href="' . htmlspecialchars($resetLink) . '" style="color: #2980b9; text-decoration: none;">' . htmlspecialchars($resetLink) . '</a></p>
            <hr style="border: 0; border-top: 1px solid #f1f2f6; margin-top: 35px; margin-bottom: 25px;">
            <p style="font-size: 12px; color: #a4b0be; text-align: center;">Nếu bạn không yêu cầu thay đổi mật khẩu này, bạn có thể bỏ qua email này một cách an toàn.</p>
        </div>';

        // Gửi email thật
        $mailSent = send_mail($email, $subject, $htmlBody);

        if (!$mailSent) {
            json_response([
                'ok' => false,
                'message' => 'Không thể gửi email khôi phục mật khẩu. Vui lòng kiểm tra cấu hình SMTP hoặc thử lại sau.'
            ], 500);
        }

        json_response([
            'ok' => true,
            'message' => 'Một liên kết khôi phục mật khẩu đã được gửi đến email của bạn.'
        ], 200);
    } else {
        // Generic response even if email doesn't exist for security
        json_response([
            'ok' => true, 
            'message' => 'Nếu email này có trong hệ thống, chúng tôi sẽ gửi link khôi phục.',
        ]);
    }

} catch (Throwable $error) {
    json_response([
        'ok' => false, 
        'message' => 'Lỗi hệ thống: ' . $error->getMessage()
    ], 500);
}
