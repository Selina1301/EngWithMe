<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

start_app_session();

$pdo = db();

function valid_learning_section(string $section): bool
{
    return in_array($section, ['reading', 'listening', 'grammar'], true);
}

function valid_content_key(string $value): bool
{
    return $value !== ''
        && strlen($value) <= 150
        && (bool) preg_match('/^[a-z0-9][a-z0-9-]*$/i', $value);
}

function decode_payload(string $payload): array
{
    $decoded = json_decode($payload, true);
    return is_array($decoded) ? $decoded : [];
}

function request_json_payload(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return $_POST;
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $_POST;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $section = trim((string) ($_GET['section'] ?? ''));
    if (!valid_learning_section($section)) {
        json_response(['ok' => false, 'message' => 'Section không hợp lệ.'], 422);
    }
    $key = trim((string) ($_GET['key'] ?? ''));
    $lazy = (($_GET['lazy'] ?? '') === '1');

    if ($key !== '') {
        $stmt = $pdo->prepare(
            'SELECT section, content_key, level_key, goal_key, title, description, payload_json, sort_order, status, updated_at
             FROM learning_content_items
             WHERE section = ? AND content_key = ?'
        );
        $stmt->execute([$section, $key]);
        $row = $stmt->fetch();
        if (!$row) {
            json_response(['ok' => false, 'message' => 'Nội dung không tồn tại.'], 404);
        }
        $payload = decode_payload((string) $row['payload_json']);
        json_response([
            'ok' => true,
            'section' => $section,
            'item' => [
                'section' => $row['section'],
                'key' => $row['content_key'],
                'level' => $row['level_key'],
                'goal' => $row['goal_key'],
                'title' => $row['title'],
                'description' => $row['description'],
                'sortOrder' => (int) $row['sort_order'],
                'status' => $row['status'],
                'updatedAt' => $row['updated_at'],
                'payload' => $payload,
            ]
        ]);
    }

    $includeDrafts = (($_GET['include_drafts'] ?? '') === '1');
    if ($includeDrafts) {
        $user = require_admin_user();
        unset($user);
        $stmt = $pdo->prepare(
            'SELECT section, content_key, level_key, goal_key, title, description, ' . ($lazy ? 'NULL as payload_json' : 'payload_json') . ', sort_order, status, updated_at
             FROM learning_content_items
             WHERE section = ?
             ORDER BY sort_order ASC, id ASC'
        );
        $stmt->execute([$section]);
    } else {
        $stmt = $pdo->prepare(
            'SELECT section, content_key, level_key, goal_key, title, description, ' . ($lazy ? 'NULL as payload_json' : 'payload_json') . ', sort_order, status, updated_at
             FROM learning_content_items
             WHERE section = ? AND status = "published"
             ORDER BY sort_order ASC, id ASC'
        );
        $stmt->execute([$section]);
    }

    $items = [];
    foreach ($stmt->fetchAll() as $row) {
        $payload = null;
        if (!$lazy && isset($row['payload_json'])) {
            $payload = decode_payload((string) $row['payload_json']);
        }
        $items[] = [
            'section' => $row['section'],
            'key' => $row['content_key'],
            'level' => $row['level_key'],
            'goal' => $row['goal_key'],
            'title' => $row['title'],
            'description' => $row['description'],
            'sortOrder' => (int) $row['sort_order'],
            'status' => $row['status'],
            'updatedAt' => $row['updated_at'],
            'payload' => $payload,
        ];
    }

    json_response([
        'ok' => true,
        'section' => $section,
        'source' => count($items) ? 'database' : 'empty',
        'items' => $items,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_admin_user();
    $input = request_json_payload();
    $action = trim((string) ($input['action'] ?? 'upsert'));
    $section = trim((string) ($input['section'] ?? ''));
    $contentKey = trim((string) ($input['key'] ?? $input['content_key'] ?? ''));

    if (!valid_learning_section($section) || !valid_content_key($contentKey)) {
        json_response(['ok' => false, 'message' => 'Dữ liệu content không hợp lệ.'], 422);
    }

    if ($action === 'delete') {
        $stmt = $pdo->prepare('DELETE FROM learning_content_items WHERE section = ? AND content_key = ?');
        $stmt->execute([$section, $contentKey]);
        json_response(['ok' => true, 'message' => 'Đã xóa nội dung.']);
    }

    if ($action !== 'upsert') {
        json_response(['ok' => false, 'message' => 'Action không hợp lệ.'], 400);
    }

    $payload = $input['payload'] ?? null;
    if (!is_array($payload)) {
        json_response(['ok' => false, 'message' => 'Payload phải là JSON object.'], 422);
    }

    $title = trim((string) ($input['title'] ?? $payload['title'] ?? $contentKey));
    $description = trim((string) ($input['description'] ?? $payload['description'] ?? ''));
    $levelKey = trim((string) ($input['level'] ?? $payload['level'] ?? ''));
    $goalKey = trim((string) ($input['goal'] ?? $payload['goal'] ?? ''));
    $sortOrder = (int) ($input['sortOrder'] ?? $input['sort_order'] ?? 0);
    $status = trim((string) ($input['status'] ?? 'published'));

    if (!in_array($status, ['draft', 'published', 'archived'], true)) {
        $status = 'published';
    }

    $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!$payloadJson) {
        json_response(['ok' => false, 'message' => 'Không thể mã hóa payload.'], 422);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO learning_content_items
            (section, content_key, level_key, goal_key, title, description, payload_json, sort_order, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            level_key = VALUES(level_key),
            goal_key = VALUES(goal_key),
            title = VALUES(title),
            description = VALUES(description),
            payload_json = VALUES(payload_json),
            sort_order = VALUES(sort_order),
            status = VALUES(status)'
    );

    $stmt->execute([
        $section,
        $contentKey,
        $levelKey !== '' ? $levelKey : null,
        $goalKey !== '' ? $goalKey : null,
        $title,
        $description !== '' ? $description : null,
        $payloadJson,
        $sortOrder,
        $status,
    ]);

    json_response(['ok' => true, 'message' => 'Đã lưu nội dung học.']);
}

json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
