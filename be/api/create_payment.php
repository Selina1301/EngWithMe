<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/payos_config.php';

require_post();
$user = require_auth_user();

ensure_payment_tables();

// Kiểm tra xem user có đang còn hạn Pro hay đã có VIP Trọn Đời không
$isVip = (int) ($user['is_vip'] ?? 0) === 1;
$vipExpires = !empty($user['vip_expires_at']) ? strtotime((string) $user['vip_expires_at']) : 0;
$now = time();

if ($isVip) {
    if (empty($user['vip_expires_at'])) {
        // VIP Trọn Đời
        json_response(['ok' => false, 'message' => '👑 Tài khoản của bạn đã là VIP Elite Trọn Đời! Bạn không cần mua thêm gói nào nữa.'], 400);
    } else if ($vipExpires > $now) {
        // Pro còn hạn
        $formattedDate = date('d/m/Y', $vipExpires);
        json_response(['ok' => false, 'message' => "⚠️ Tài khoản của bạn hiện đang có gói Pro còn hạn đến ngày {$formattedDate}. Vui lòng đợi hết hạn gói Pro hiện tại rồi hãy đăng ký tiếp nhé!"], 400);
    }
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$plan = strtolower(trim((string) ($input['plan'] ?? 'pro')));

$planConfig = [
    'pro' => [
        'plan_id' => 'pro_monthly',
        'name' => 'Gói Pro - 7.777đ',
        'amount' => 7777
    ],
    'premium' => [
        'plan_id' => 'premium_lifetime',
        'name' => 'Gói Premium VIP Trọn Đời - 999.999đ',
        'amount' => 999999
    ]
];

if (!isset($planConfig[$plan])) {
    json_response(['ok' => false, 'message' => 'Gói thanh toán không hợp lệ.'], 400);
}

$selectedPlan = $planConfig[$plan];
$amount = $selectedPlan['amount'];

// 🌟 BẢO VỆ & CỐ ĐỊNH MÃ QR TRONG 15 PHÚT:
// Nếu người dùng đã mở QR cho gói này trong vòng 15 phút vừa qua mà chưa thanh toán (PENDING),
// Hệ thống sẽ Giữ Nguyên Đơn Hàng & Mã QR cũ thay vì tạo rác đơn mới!
$pdo = db();
$stmtExisting = $pdo->prepare(
    "SELECT * FROM orders 
     WHERE user_id = :user_id 
       AND plan_id = :plan_id 
       AND status = 'PENDING' 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
     ORDER BY id DESC LIMIT 1"
);
$stmtExisting->execute([
    ':user_id' => $user['id'],
    ':plan_id' => $selectedPlan['plan_id']
]);
$existingOrder = $stmtExisting->fetch();

if ($existingOrder) {
    $orderCode = (int) $existingOrder['order_code'];
    $description = 'EngWithMe ' . strtoupper($plan) . ' ' . $orderCode;
    if (mb_strlen($description) > 25) {
        $description = mb_substr($description, 0, 25);
    }
    $qrCode = $existingOrder['qr_code'];
    $checkoutUrl = $existingOrder['payment_link_id'];
    $accountNumber = defined('PAYOS_BANK_ACCOUNT') ? PAYOS_BANK_ACCOUNT : '0971629106';
    $accountName = defined('PAYOS_BANK_NAME') ? PAYOS_BANK_NAME : 'NGUYEN TUNG DUONG';
    $bankName = 'MBBank (Ngân Hàng Quân Đội)';
    $bankShort = defined('PAYOS_BANK_SHORT_NAME') ? PAYOS_BANK_SHORT_NAME : 'MB';
    $vietqrImage = $qrCode ?: "https://img.vietqr.io/image/{$bankShort}-{$accountNumber}-compact2.png?amount={$amount}&addInfo=" . urlencode($description) . "&accountName=" . urlencode($accountName);

    json_response([
        'ok' => true,
        'reused' => true,
        'orderCode' => $orderCode,
        'amount' => $amount,
        'amount_formatted' => number_format($amount, 0, ',', '.') . 'đ',
        'plan_name' => $selectedPlan['name'],
        'description' => $description,
        'checkout_url' => $checkoutUrl,
        'qr_code' => $qrCode,
        'vietqr_img' => $vietqrImage,
        'bank_info' => [
            'bank_name' => $bankName,
            'account_number' => $accountNumber,
            'account_name' => $accountName
        ]
    ]);
}

$orderCode = (int) (substr((string) time(), 3) . rand(10, 99));

// Host origin
$scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$baseUrl = $scheme . '://' . $host . rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\') . '/..';

$returnUrl = $baseUrl . '/profile.html?payment=success&orderCode=' . $orderCode;
$cancelUrl = $baseUrl . '/pricing.html?payment=cancelled';
$description = 'EngWithMe ' . strtoupper($plan) . ' ' . $orderCode;
if (mb_strlen($description) > 25) {
    $description = mb_substr($description, 0, 25);
}

// Payload cho PayOS v2 (Đặt thời gian tự động hủy sau 15 phút)
$expiredAt = time() + (15 * 60);

$requestData = [
    'orderCode' => $orderCode,
    'amount' => $amount,
    'description' => $description,
    'cancelUrl' => $cancelUrl,
    'returnUrl' => $returnUrl,
    'expiredAt' => $expiredAt
];

// Chữ ký bảo mật Signature PayOS
$signature = payos_create_signature($requestData, PAYOS_CHECKSUM_KEY);
$requestData['signature'] = $signature;
$requestData['items'] = [
    [
        'name' => $selectedPlan['name'],
        'quantity' => 1,
        'price' => $amount
    ]
];

// Gọi PayOS API tạo Payment Link
$payosRes = payos_request('payment-requests', $requestData, 'POST');

$checkoutUrl = null;
$qrCode = null;
$paymentLinkId = null;
$accountNumber = defined('PAYOS_BANK_ACCOUNT') ? PAYOS_BANK_ACCOUNT : '0971629106';
$accountName = defined('PAYOS_BANK_NAME') ? PAYOS_BANK_NAME : 'NGUYEN TUNG DUONG';
$bankName = 'MBBank (Ngân Hàng Quân Đội)';

if (isset($payosRes['code']) && $payosRes['code'] === '00' && isset($payosRes['data'])) {
    $checkoutUrl = $payosRes['data']['checkoutUrl'] ?? null;
    $qrCodeRaw = $payosRes['data']['qrCode'] ?? null;
    $paymentLinkId = $payosRes['data']['paymentLinkId'] ?? null;

    if (!empty($payosRes['data']['description'])) {
        $description = (string) $payosRes['data']['description'];
    }
    if (!empty($payosRes['data']['accountNumber'])) {
        $accountNumber = (string) $payosRes['data']['accountNumber'];
    }
    if (!empty($payosRes['data']['accountName'])) {
        $accountName = (string) $payosRes['data']['accountName'];
    }

    if ($qrCodeRaw !== null) {
        if (str_starts_with($qrCodeRaw, '000201')) {
            $qrCode = "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" . urlencode($qrCodeRaw);
        } else {
            $qrCode = $qrCodeRaw;
        }
    }
}

// VietQR / PayOS Image dự phòng
$bankShort = defined('PAYOS_BANK_SHORT_NAME') ? PAYOS_BANK_SHORT_NAME : 'MB';
$vietqrImage = $qrCode ?: "https://img.vietqr.io/image/{$bankShort}-{$accountNumber}-compact2.png?amount={$amount}&addInfo=" . urlencode($description) . "&accountName=" . urlencode($accountName);

try {
    $pdo = db();
    $stmt = $pdo->prepare(
        "INSERT INTO orders (order_code, user_id, plan_id, amount, status, payment_link_id, qr_code)
         VALUES (:order_code, :user_id, :plan_id, :amount, 'PENDING', :payment_link_id, :qr_code)"
    );
    $stmt->execute([
        ':order_code' => $orderCode,
        ':user_id' => $user['id'],
        ':plan_id' => $selectedPlan['plan_id'],
        ':amount' => $amount,
        ':payment_link_id' => $paymentLinkId,
        ':qr_code' => $qrCode ?: $vietqrImage
    ]);
} catch (\Throwable $e) {
    json_response(['ok' => false, 'message' => 'Không thể khởi tạo đơn hàng: ' . $e->getMessage()], 500);
}

json_response([
    'ok' => true,
    'orderCode' => $orderCode,
    'amount' => $amount,
    'amount_formatted' => number_format($amount, 0, ',', '.') . 'đ',
    'plan_name' => $selectedPlan['name'],
    'description' => $description,
    'checkout_url' => $checkoutUrl,
    'qr_code' => $qrCode ?: $vietqrImage,
    'vietqr_img' => $vietqrImage,
    'bank_info' => [
        'bank_name' => $bankName,
        'account_number' => $accountNumber,
        'account_name' => $accountName
    ]
]);
