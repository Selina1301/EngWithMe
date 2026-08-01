<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_post();
$user = require_auth_user();

ensure_payment_tables();

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$orderCode = (int) ($input['orderCode'] ?? 0);

if ($orderCode <= 0) {
    json_response(['ok' => false, 'message' => 'Mã đơn hàng không hợp lệ.'], 400);
}

try {
    $updateOrder = $pdo->prepare("UPDATE orders SET status = 'PAID' WHERE order_code = :order_code");
    $updateOrder->execute([':order_code' => $orderCode]);

    // Lấy thông tin đơn hàng để xem gói nào (Pro hay Premium)
    $stmtOrder = $pdo->prepare("SELECT plan_id FROM orders WHERE order_code = ? LIMIT 1");
    $stmtOrder->execute([$orderCode]);
    $orderInfo = $stmtOrder->fetch();

    activate_user_vip((int) $user['id'], (string) ($orderInfo['plan_id'] ?? 'pro'));

    json_response([
        'ok' => true,
        'message' => 'Giả lập thanh toán VietQR thành công! Tài khoản đã được nâng cấp VIP Trọn Đời!'
    ]);
} catch (\Throwable $e) {
    json_response(['ok' => false, 'message' => 'Lỗi giả lập thanh toán: ' . $e->getMessage()], 500);
}
