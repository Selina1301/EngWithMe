<?php
declare(strict_types=1);
require_once __DIR__ . '/../api/helpers.php';

try {
    $pdo = db();
    
    // Đảm bảo cả admin1301@gmail.com và admin@gmail.com đều hoạt động với password 'admin1301'
    $emails = ['admin1301@gmail.com', 'admin@gmail.com'];
    $passwordHash = password_hash('admin1301', PASSWORD_DEFAULT);
    
    foreach ($emails as $email) {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Cập nhật tài khoản hiện có làm admin hoạt động và mở khóa
            $update = $pdo->prepare('
                UPDATE users 
                SET role = "admin", password = ?, status = "active", login_attempts = 0, attempt_lock_until = NULL, verification_token = NULL 
                WHERE id = ?
            ');
            $update->execute([$passwordHash, (int) $user['id']]);
            echo "Đã cập nhật/mở khóa tài khoản admin: <strong>$email</strong> với mật khẩu: <strong>admin1301</strong><br>";
        } else {
            // Tạo mới tài khoản admin
            $insert = $pdo->prepare('
                INSERT INTO users (full_name, email, password, role, level, learning_goal, status) 
                VALUES (?, ?, ?, "admin", "B2", "Quản trị hệ thống", "active")
            ');
            $insert->execute(["Admin EngWithMe", $email, $passwordHash]);
            echo "Đã tạo mới tài khoản admin: <strong>$email</strong> với mật khẩu: <strong>admin1301</strong><br>";
        }
    }
    
    echo "<br><span style='color: green;'><strong>Khôi phục thành công!</strong></span> Hãy thử đăng nhập lại bằng một trong hai tài khoản trên với mật khẩu là <strong>admin1301</strong>.<br>";
    echo "<p style='color: red;'><em>* Lưu ý bảo mật: Sau khi đăng nhập thành công, bạn hãy xóa tệp tin 'reset_admin.php' khỏi thư mục tools/.</em></p>";
} catch (Exception $e) {
    echo "Lỗi: " . $e->getMessage();
}
