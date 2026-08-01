<?php
declare(strict_types=1);

require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/payos_config.php';

header('Content-Type: application/json');

$rawInput = file_get_contents('php://input');
$webhookData = json_decode((string) $rawInput, true);

if (!is_array($webhookData) || !isset($webhookData['data'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid webhook payload']);
    exit;
}

$data = $webhookData['data'];
$signature = $webhookData['signature'] ?? '';

// Xác thực chữ ký mã hóa Webhook PayOS
$calculatedSignature = payos_create_signature($data, PAYOS_CHECKSUM_KEY);
if ($signature !== $calculatedSignature) {
    echo json_encode(['success' => false, 'message' => 'Invalid PayOS Signature']);
    exit;
}

ensure_payment_tables();

$orderCode = (int) ($data['orderCode'] ?? 0);
$code = (string) ($webhookData['code'] ?? '00');

if ($orderCode > 0 && ($code === '00' || $code === '0')) {
    try {
        $pdo = db();
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_code = :order_code LIMIT 1");
        $stmt->execute([':order_code' => $orderCode]);
        $order = $stmt->fetch();

        if ($order) {
            // Cập nhật Đơn hàng
            $updateOrder = $pdo->prepare("UPDATE orders SET status = 'PAID' WHERE order_code = :order_code");
            $updateOrder->execute([':order_code' => $orderCode]);

            // Kích hoạt / Gia hạn VIP chuẩn xác theo gói đăng ký
            activate_user_vip((int) $order['user_id'], (string) ($order['plan_id'] ?? 'pro'));
        }
    } catch (\Throwable $e) {
        error_log("Webhook Error: " . $e->getMessage());
    }
}

echo json_encode(['success' => true]);
