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

// 1. Chỉ chấp nhận các địa chỉ Gmail thật (@gmail.com)
if (!str_ends_with($email, '@gmail.com')) {
    json_response(['ok' => false, 'message' => 'Hệ thống chỉ chấp nhận đăng ký bằng tài khoản Gmail thật (@gmail.com).'], 422);
}

// 2. Kiểm tra bản ghi MX của Gmail (DNS MX check) để đảm bảo domain hoạt động
$domain = substr(strrchr($email, "@"), 1);
if (!checkdnsrr($domain, 'MX')) {
    json_response(['ok' => false, 'message' => 'Tên miền email "' . htmlspecialchars($domain) . '" không tồn tại hoặc không thể nhận thư.'], 422);
}

if (strlen($password) < 6) {
    json_response(['ok' => false, 'message' => 'Mật khẩu cần tối thiểu 6 ký tự.'], 422);
}

try {
    $pdo = db();

    // Kiểm tra xem email đã được đăng ký chưa
    $check = $pdo->prepare('SELECT id, status FROM users WHERE email = ? LIMIT 1');
    $check->execute([$email]);
    $existingUser = $check->fetch();

    if ($existingUser) {
        if ($existingUser['status'] === 'active') {
            json_response(['ok' => false, 'message' => 'Email này đã được đăng ký và kích hoạt trước đó.'], 409);
        } else {
            // Nếu tài khoản tồn tại nhưng chưa kích hoạt (status = pending),
            // ta cho phép gửi lại mã OTP mới thay vì chặn.
            $otp = (string) rand(100000, 999999);
            
            $update = $pdo->prepare('UPDATE users SET full_name = ?, password = ?, learning_goal = ?, verification_token = ? WHERE id = ?');
            $update->execute([
                $name,
                password_hash($password, PASSWORD_DEFAULT),
                $goal !== '' ? $goal : null,
                $otp,
                (int) $existingUser['id']
            ]);
        }
    } else {
        // Tạo mã OTP ngẫu nhiên gồm 6 chữ số
        $otp = (string) rand(100000, 999999);

        // Tạo tài khoản mới với trạng thái "pending" (chờ xác thực)
        $insert = $pdo->prepare(
            'INSERT INTO users (full_name, email, password, role, level, learning_goal, status, verification_token)
             VALUES (?, ?, ?, "user", "A1", ?, "pending", ?)'
        );
        $insert->execute([
            $name,
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            $goal !== '' ? $goal : null,
            $otp
        ]);
    }

    log_user_activity('register_otp_generated', ['email' => $email]);

    // Gửi email chứa mã OTP 6 số bằng SMTP
    $subject = 'EngWithMe - Mã xác thực đăng ký tài khoản';
    $htmlBody = '
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
        <div style="margin-bottom: 25px;">
            <h2 style="color: #2e86de; margin: 0; font-size: 28px; font-weight: bold;">EngWithMe</h2>
            <p style="font-size: 14px; color: #5f27cd; font-weight: bold; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Mã Xác Thực Đăng Ký Tài Khoản</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #f1f2f6; margin-bottom: 25px;">
        <div style="text-align: left; font-size: 16px; color: #2f3542; line-height: 1.6;">
            <p>Chào <strong>' . htmlspecialchars($name) . '</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký thành viên trên EngWithMe. Để xác thực địa chỉ Gmail của bạn và kích hoạt tài khoản học, vui lòng sử dụng mã xác thực OTP dưới đây:</p>
        </div>
        <div style="margin: 30px auto; background-color: #f1f2f6; padding: 20px 40px; border-radius: 10px; display: inline-block; border: 1px solid #dcdde1;">
            <span style="font-size: 36px; font-weight: bold; color: #10ac84; letter-spacing: 8px; font-family: monospace;">' . $otp . '</span>
        </div>
        <p style="font-size: 14px; color: #747d8c; line-height: 1.5; margin-top: 25px;">Mã này có hiệu lực trong vòng 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai để bảo vệ an toàn thông tin tài khoản.</p>
    </div>';

    $mailSent = send_mail($email, $subject, $htmlBody);

    if (!$mailSent) {
        json_response(['ok' => false, 'message' => 'Không thể gửi email xác thực OTP. Vui lòng kiểm tra lại cấu hình SMTP trong file .env hoặc thử lại.'], 500);
    }

    $response = [
        'ok' => true,
        'requires_otp' => true,
        'email' => $email,
        'message' => 'Một mã OTP gồm 6 số đã được gửi thẳng tới Gmail của bạn. Vui lòng nhập mã để kích hoạt tài khoản học.'
    ];

    json_response($response, 200);

} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Không thể gửi mã xác thực lúc này. Lỗi: ' . $error->getMessage()], 500);
}
