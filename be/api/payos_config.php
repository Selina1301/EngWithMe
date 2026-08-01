<?php
declare(strict_types=1);

// Cấu hình PayOS Credentials (Sandbox / Production)
// Bạn có thể đăng ký tài khoản miễn phí tại https://payos.vn để lấy 3 mã dưới đây
if (!defined('PAYOS_CLIENT_ID')) {
    define('PAYOS_CLIENT_ID', 'f3ac6ab0-612e-4bb0-b53a-d883cbd4eff0');
}
if (!defined('PAYOS_API_KEY')) {
    define('PAYOS_API_KEY', 'fab8a588-3f9c-4159-ad25-bbccf9721701');
}
if (!defined('PAYOS_CHECKSUM_KEY')) {
    define('PAYOS_CHECKSUM_KEY', 'dc77a3c14beb5d1683fd1eeca0b8c0c840d7aff558fd1a050f7f12def57c4866');
}
if (!defined('PAYOS_BANK_ACCOUNT')) {
    define('PAYOS_BANK_ACCOUNT', '0971629106');
}
if (!defined('PAYOS_BANK_NAME')) {
    define('PAYOS_BANK_NAME', 'NGUYEN TUNG DUONG');
}
if (!defined('PAYOS_BANK_SHORT_NAME')) {
    define('PAYOS_BANK_SHORT_NAME', 'MB');
}

/**
 * Hàm tạo chữ ký HMAC-SHA256 chuẩn quy định PayOS v2
 */
function payos_create_signature(array $data, string $checksumKey): string
{
    $sigData = [];
    // Nếu là Webhook payload
    if (isset($data['orderCode']) && !isset($data['cancelUrl']) && !isset($data['returnUrl'])) {
        ksort($data);
        foreach ($data as $key => $val) {
            if ($val === null || $val === '') continue;
            if (is_array($val)) {
                $dataToSign[] = $key . '=' . json_encode($val, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            } else {
                $dataToSign[] = $key . '=' . $val;
            }
        }
        $queryStr = implode('&', $dataToSign);
        return hash_hmac('sha256', $queryStr, $checksumKey);
    }

    // Nếu là Payment Link Request creation (POST /v2/payment-requests)
    $sigFields = ['amount', 'cancelUrl', 'description', 'orderCode', 'returnUrl'];
    foreach ($sigFields as $field) {
        if (isset($data[$field])) {
            $sigData[$field] = $data[$field];
        }
    }
    ksort($sigData);
    $dataToSign = [];
    foreach ($sigData as $key => $val) {
        if ($val === null || $val === '') continue;
        $dataToSign[] = $key . '=' . $val;
    }
    $queryStr = implode('&', $dataToSign);
    return hash_hmac('sha256', $queryStr, $checksumKey);
}

/**
 * Hàm gọi API PayOS v2 tới hệ thống payos.vn
 */
function payos_request(string $endpoint, array $payload = [], string $method = 'POST'): array
{
    $url = "https://api-merchant.payos.vn/v2/" . ltrim($endpoint, '/');
    $ch = curl_init();

    $headers = [
        'x-client-id: ' . PAYOS_CLIENT_ID,
        'x-api-key: ' . PAYOS_API_KEY,
        'Content-Type: application/json'
    ];

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    }

    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        return ['code' => '99', 'desc' => 'CURL Error: ' . $error, 'data' => null];
    }

    $resData = json_decode((string) $response, true);
    return is_array($resData) ? $resData : ['code' => '99', 'desc' => 'Invalid response from PayOS', 'data' => null];
}
