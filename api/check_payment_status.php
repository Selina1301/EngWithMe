<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/payos_config.php';

$orderCode = (int) ($_GET['orderCode'] ?? $_POST['orderCode'] ?? 0);

if ($orderCode <= 0) {
    json_response(['ok' => false, 'message' => 'Mã đơn hàng không hợp lệ.'], 400);
}

ensure_payment_tables();

try {
    $pdo = db();
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_code = :order_code LIMIT 1");
    $stmt->execute([':order_code' => $orderCode]);
    $order = $stmt->fetch();

    if (!$order) {
        json_response(['ok' => false, 'message' => 'Không tìm thấy đơn hàng.'], 404);
    }

    if ($order['status'] === 'PAID') {
        json_response([
            'ok' => true,
            'is_paid' => true,
            'status' => 'PAID',
            'orderCode' => $orderCode,
            'message' => 'Thanh toán thành công! Bạn đã là thành viên VIP!'
        ]);
    }

    // Kiểm tra trực tiếp với PayOS Server API v2
    $payosRes = payos_request("payment-requests/{$orderCode}", [], 'GET');

    if (isset($payosRes['code']) && $payosRes['code'] === '00' && isset($payosRes['data'])) {
        $status = $payosRes['data']['status'] ?? 'PENDING';
        if ($status === 'PAID') {
            // Cập nhật Đơn hàng & Tài khoản VIP trong CSDL MySQL
            $updateOrder = $pdo->prepare("UPDATE orders SET status = 'PAID' WHERE order_code = :order_code");
            $updateOrder->execute([':order_code' => $orderCode]);

            activate_user_vip((int) $order['user_id'], (string) ($order['plan_id'] ?? 'pro'));

            json_response([
                'ok' => true,
                'is_paid' => true,
                'status' => 'PAID',
                'orderCode' => $orderCode,
                'message' => 'Thanh toán thành công! Bạn đã là thành viên VIP!'
            ]);
        }
    }

    json_response([
        'ok' => true,
        'is_paid' => false,
        'status' => $order['status'],
        'orderCode' => $orderCode
    ]);

} catch (\Throwable $e) {
    json_response(['ok' => false, 'message' => 'Lỗi kiểm tra đơn hàng: ' . $e->getMessage()], 500);
}
