<?php
declare(strict_types=1);

require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/payos_config.php';

$user = require_auth_user();
ensure_payment_tables();

try {
    $pdo = db();
    $stmt = $pdo->prepare(
        "SELECT id, order_code, plan_id, amount, status, payment_link_id, qr_code, created_at 
         FROM orders 
         WHERE user_id = :user_id 
         ORDER BY id DESC LIMIT 50"
    );
    $stmt->execute([':user_id' => $user['id']]);
    $rawOrders = $stmt->fetchAll();

    $accountNumber = defined('PAYOS_BANK_ACCOUNT') ? PAYOS_BANK_ACCOUNT : '0971629106';
    $accountName = defined('PAYOS_BANK_NAME') ? PAYOS_BANK_NAME : 'NGUYEN TUNG DUONG';
    $bankName = 'MBBank (Ngân Hàng Quân Đội)';

    $orders = array_map(function ($ord) use ($accountNumber, $accountName, $bankName) {
        $planId = strtolower((string) ($ord['plan_id'] ?? 'pro'));
        $isPremium = str_contains($planId, 'premium');
        $planName = $isPremium ? 'Gói Premium VIP Trọn Đời' : 'Gói Pro - 7.777đ';
        $orderCode = (int) $ord['order_code'];
        $amount = (int) $ord['amount'];
        $description = 'EngWithMe ' . ($isPremium ? 'PREMIUM' : 'PRO') . ' ' . $orderCode;

        return [
            'id' => (int) $ord['id'],
            'order_code' => $orderCode,
            'plan_id' => $ord['plan_id'],
            'plan_name' => $planName,
            'amount' => $amount,
            'amount_formatted' => number_format($amount, 0, ',', '.') . 'đ',
            'status' => strtoupper((string) ($ord['status'] ?? 'PENDING')),
            'created_at' => $ord['created_at'],
            'description' => $description,
            'bank_info' => [
                'bank_name' => $bankName,
                'account_number' => $accountNumber,
                'account_name' => $accountName
            ],
            'qr_code' => $ord['qr_code'] ?? null
        ];
    }, $rawOrders);

    json_response([
        'ok' => true,
        'orders' => $orders
    ]);

} catch (\Throwable $e) {
    json_response(['ok' => false, 'message' => 'Lỗi khi truy xuất lịch sử giao dịch: ' . $e->getMessage()], 500);
}
