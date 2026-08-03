<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_post();
ensure_payment_tables();

try {
    $pdo = db();
    $pdo->exec("DELETE FROM orders");
    json_response(['ok' => true, 'message' => 'Đã làm sạch toàn bộ dữ liệu đơn hàng mẫu test trong Database thành công!']);
} catch (\Throwable $e) {
    json_response(['ok' => false, 'message' => 'Lỗi dọn dẹp đơn test: ' . $e->getMessage()], 500);
}
