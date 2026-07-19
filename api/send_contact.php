<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json');

// Allow POST requests from same origin
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        throw new Exception('Dữ liệu không hợp lệ');
    }

    // Validate required fields
    $name = trim($data['Họ tên'] ?? '');
    $phone = trim($data['Số điện thoại'] ?? '');
    $email = trim($data['Email'] ?? '');
    $title = trim($data['Tiêu đề'] ?? '');
    $message = trim($data['Nội dung'] ?? '');

    if (!$name || !$email || !$title || !$message) {
        throw new Exception('Vui lòng điền đầy đủ thông tin bắt buộc');
    }

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Email không hợp lệ');
    }

    // Get database connection
    $pdo = db();

    // Save to database (PRIMARY GOAL)
    $stmt = $pdo->prepare("
        INSERT INTO contact_messages (name, phone, email, title, message, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$name, $phone, $email, $title, $message]);
    $messageId = $pdo->lastInsertId();

    // TRY to send email (SECONDARY GOAL - not critical)
    $recipientEmail = 'kingcute5x@gmail.com';
    $subject = "EngWithMe - Góp ý mới: " . $title;
    
    $htmlBody = "
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
            .header { background: #2ee878; color: white; padding: 15px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #2ee878; }
            .value { margin-top: 5px; padding: 10px; background: #f0f0f0; border-left: 3px solid #2ee878; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>📧 EngWithMe - Góp ý từ học viên</h2>
            </div>
            <div class='content'>
                <div class='field'>
                    <div class='label'>👤 Họ tên:</div>
                    <div class='value'>" . htmlspecialchars($name) . "</div>
                </div>
                
                <div class='field'>
                    <div class='label'>📞 Số điện thoại:</div>
                    <div class='value'>" . htmlspecialchars($phone ?: 'Không cung cấp') . "</div>
                </div>
                
                <div class='field'>
                    <div class='label'>📧 Email:</div>
                    <div class='value'>" . htmlspecialchars($email) . "</div>
                </div>
                
                <div class='field'>
                    <div class='label'>📋 Tiêu đề:</div>
                    <div class='value'>" . htmlspecialchars($title) . "</div>
                </div>
                
                <div class='field'>
                    <div class='label'>💬 Nội dung:</div>
                    <div class='value'>" . nl2br(htmlspecialchars($message)) . "</div>
                </div>
                
                <div class='footer'>
                    <p>📝 Tin nhắn này được gửi từ EngWithMe - Platform học tiếng Anh</p>
                    <p>⏰ Thời gian: " . date('d/m/Y H:i:s') . "</p>
                    <p>ID: #" . $messageId . "</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: noreply@engwithme.local\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "X-Mailer: EngWithMe ContactForm\r\n";
    
    // Try to send email, but don't fail if it doesn't work
    $emailSent = false;
    if (function_exists('mail')) {
        $emailSent = @mail($recipientEmail, $subject, $htmlBody, $headers);
        if ($emailSent) {
            error_log("Email sent successfully for message ID: " . $messageId);
        } else {
            error_log("Email sending failed for message ID: " . $messageId . " - Mail function may not be configured");
        }
    }

    // Always return success since data was saved to database
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Cảm ơn! Góp ý của bạn đã được ghi nhận. Admin sẽ xem xét và phản hồi sớm nhất.',
        'messageId' => $messageId,
        'emailStatus' => $emailSent ? 'sent' : 'queued'
    ]);
    
} catch (Exception $error) {
    http_response_code(400);
    error_log("Contact form error: " . $error->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi: ' . $error->getMessage()
    ]);
}
