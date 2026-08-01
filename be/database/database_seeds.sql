-- Database Seed Data for EngWithMe
-- Compatible with XAMPP MySQL / MariaDB

USE engwithme_db;

-- 1. Seed Users
-- admin1301@gmail.com -> password: admin1301 (hashed)
-- student@example.com -> password: student (hashed)
INSERT INTO users (id, full_name, email, password, role, level, learning_goal, status)
VALUES
  (1, 'Admin EngWithMe', 'admin1301@gmail.com', '$2y$10$b07Nhzk9RFjreLkTPru7E.jMAFBD9IclEQ1y/7VsJNGYuXHApz.3S', 'admin', 'B2', 'Quản trị hệ thống', 'active'),
  (2, 'Nguyễn Văn A', 'student@example.com', '$2y$10$2VxF6amxjS2XNin8TQtMXeff4jaWLx7t7b2G8D7RvNWZlmiuKsOIO', 'user', 'A2', 'Giao tiếp hàng ngày', 'active')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password = VALUES(password),
  role = VALUES(role),
  level = VALUES(level),
  learning_goal = VALUES(learning_goal),
  status = VALUES(status);

-- 2. Seed Blogs / Reviews (pre-filled approved reviews for community section)
INSERT INTO blogs (user_id, title, content, rating, status, created_at)
VALUES
  (2, 'Khóa học tuyệt vời và dễ hiểu', 'Giao diện cực kỳ đẹp mắt, nhiều chủ đề từ vựng đa dạng từ dễ đến khó. Có cả hệ thống thống kê tiến độ học giúp mình duy trì thói quen học tiếng Anh mỗi ngày.', 5, 'approved', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (2, 'Phương pháp ôn tập hiệu quả', 'Mình rất thích chức năng Mini Quiz từ vựng nhanh. Nó giúp mình nhớ từ rất lâu thông qua các câu hỏi đa dạng.', 4, 'approved', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- 3. Seed Courses
INSERT INTO courses (id, title, description, level, thumbnail, price, status)
VALUES
  (1, 'Tiếng Anh Giao Tiếp Cơ Bản A1-A2', 'Học cách chào hỏi, giới thiệu bản thân và các chủ đề giao tiếp cơ bản.', 'A1', 'images/course-beginner.jpg', 0.00, 'published'),
  (2, 'Luyện Nghe Phản Xạ Đời Sống B1', 'Nâng cao khả năng nghe hiểu thông qua các bài hội thoại thực tế.', 'B1', 'images/course-communication.jpg', 99000.00, 'published'),
  (3, 'IELTS Academic Vocabulary B2', 'Bộ từ vựng học thuật dành cho kỳ thi IELTS.', 'B2', 'images/course-ielts.jpg', 199000.00, 'published');

-- 4. Seed Modules
INSERT INTO modules (id, course_id, title, order_number)
VALUES
  (1, 1, 'Bài học chào hỏi (Greetings)', 1),
  (2, 1, 'Sinh hoạt đời sống (Daily Activities)', 2);

-- 5. Seed Lessons
INSERT INTO lessons (id, module_id, title, content, lesson_type, difficulty, duration_minutes, order_number)
VALUES
  (1, 1, 'Chào hỏi căn bản', 'Học cách chào hỏi bằng tiếng Anh như Hello, Good Morning.', 'vocabulary', 'easy', 15, 1),
  (2, 1, 'Giới thiệu bản thân', 'Thực hành nói giới thiệu tên tuổi, quê quán.', 'speaking', 'easy', 20, 2);

-- 6. Seed Vocabularies
INSERT INTO vocabularies (lesson_id, word, pronunciation, meaning, example, audio_url, image_url)
VALUES
  (1, 'hello', '/həˈloʊ/', 'xin chào', 'Hello, nice to meet you!', 'assets/audio/hello.mp3', 'images/hello.jpg'),
  (1, 'routine', '/ruːˈtiːn/', 'thói quen', 'My daily routine starts early.', 'assets/audio/routine.mp3', 'images/routine.jpg');
