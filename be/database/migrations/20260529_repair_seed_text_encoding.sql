USE engwithme_db;

UPDATE users
SET
  full_name = 'Nguyễn Văn A',
  learning_goal = 'Giao tiếp hàng ngày'
WHERE id = 2 AND email = 'student@example.com';

UPDATE blogs
SET
  title = 'Khóa học tuyệt vời và dễ hiểu',
  content = 'Giao diện cực kỳ đẹp mắt, nhiều chủ đề từ vựng đa dạng từ dễ đến khó. Có cả hệ thống thống kê tiến độ học giúp mình duy trì thói quen học tiếng Anh mỗi ngày.'
WHERE id = 1 AND user_id = 2;

UPDATE blogs
SET
  title = 'Phương pháp ôn tập hiệu quả',
  content = 'Mình rất thích chức năng Mini Quiz từ vựng nhanh. Nó giúp mình nhớ từ rất lâu thông qua các câu hỏi đa dạng.'
WHERE id = 2 AND user_id = 2;
