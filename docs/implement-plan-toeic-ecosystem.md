# Implement Plan – TOEIC Self-Learning Ecosystem

Mục tiêu: triển khai 3 phần cốt lõi theo hướng “không chạm logic hiện có, chỉ nối vào các core route sẵn có”.

## 1) Hệ sinh thái tự học TOEIC toàn diện

### Core code hiện có
- [be/worker-hono/src/routes/learning.ts](../be/worker-hono/src/routes/learning.ts)
  - Route /content
  - Route /learning_content.php
  - Route /sync_progress.php
  - Route /sync_vocab.php
  - Route /sync_grammar.php
  - Route /user_level.php
- [be/worker-hono/src/routes/quiz.ts](../be/worker-hono/src/routes/quiz.ts)
  - Route /test_results.php
  - Route /sync_quiz.php

### Implement plan
1. Giữ nguyên các route hiện tại làm “backend core”.
2. Tạo một API tổng hợp duy nhất để frontend lấy toàn bộ hành trình học:
   - từ vựng
   - ngữ pháp
   - listening
   - reading
   - bài thi thử
   - tiến trình học
3. Dùng các route hiện có như nguồn dữ liệu:
   - progress từ /sync_progress.php
   - vocab từ /sync_vocab.php
   - grammar từ /sync_grammar.php
   - exam result từ /test_results.php
4. Chỉ cần thêm một endpoint mới hoặc mở rộng response của các route hiện có để frontend nhận dữ liệu theo cấu trúc thống nhất.
5. Mục tiêu cuối cùng: một màn hình học “one-page journey” với các block:
   - Recommended lesson
   - Recent progress
   - Practice next
   - Exam history

---

## 2) Gamification – XP, level, badge, leaderboard

### Core code hiện có
- [be/worker-hono/src/routes/learning.ts](../be/worker-hono/src/routes/learning.ts)
  - Hàm getXpForLevelServer
  - Biến LEVEL_TITLES_SERVER
  - Route /user_level.php
- [be/worker-hono/src/routes/blog.ts](../be/worker-hono/src/routes/blog.ts)
  - Hàm getBadgeByLevel
  - Route /get_leaderboard.php

### Implement plan
1. Dùng logic XP hiện có làm nền tảng, không cần thay cấu trúc cũ.
2. Thêm các rule mới nhưng vẫn nối vào các điểm sau:
   - XP tăng khi hoàn thành lesson / quiz / exam
   - Level được tính từ total_xp
   - Badge/title được lấy từ level hiện tại
3. Mở rộng leaderboard thành các nhóm:
   - XP leaderboard
   - TOEIC leaderboard
   - Community/blog leaderboard
4. Để giữ động lực lâu dài, có thể bổ sung:
   - daily streak
   - weekly challenge
   - achievement unlock
5. Frontend chỉ cần gọi các endpoint hiện có và render UI theo các dữ liệu đã có.

### Code mẫu mở rộng gamification
#### 1) Mở rộng `learning.ts` để tính XP từ tương tác học tập
```ts
// helper mới trong be/worker-hono/src/routes/learning.ts
function calculateActionXp(action: string): number {
  switch (action) {
    case "complete_lesson":
      return 20;
    case "complete_quiz":
      return 35;
    case "complete_exam":
      return 50;
    case "review_vocab":
      return 10;
    case "review_grammar":
      return 10;
    default:
      return 5;
  }
}

learningApp.post("/user_level.php", async (c) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || c.req.query("auth_token") || getCookie(c, "auth_token") || "";
  let dbUser: any = null;

  if (c.env?.DB && token) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ? OR email = ?"
      ).bind(token, token, token, token).first();
    } catch (e) {}
  }

  const userId = dbUser ? String(dbUser.id) : token;
  let postedXp = 0;
  let actionXp = 0;

  if (c.req.method === "POST") {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, any>;
    postedXp = Number(body.total_xp || body.xp || 0);
    actionXp = calculateActionXp(String(body.action || ""));
  }

  let totalXp = Number(dbUser?.total_xp || dbUser?.xp || 0) + actionXp;
  if (postedXp > totalXp) totalXp = postedXp;

  if (c.env?.DB && dbUser?.id) {
    try {
      await c.env.DB.prepare("UPDATE users SET total_xp = ? WHERE id = ?").bind(totalXp, dbUser.id).run();
    } catch (e) {}
  }

  const levelValue = calculateLevelFromXp(totalXp);
  const title = getTitleByLevel(levelValue);

  return c.json({
    ok: true,
    user_id: userId,
    total_xp: totalXp,
    level_number: levelValue,
    level_title: title,
    action_xp: actionXp
  });
});
```

#### 2) Mở rộng `blog.ts` để trả về ba nhóm leaderboard
```ts
// phần mới trong be/worker-hono/src/routes/blog.ts
blogApp.get("/get_leaderboard.php", async (c) => {
  const xpLeaderboard: any[] = [];
  const toeicLeaderboard: any[] = [];
  const communityLeaderboard: any[] = [];

  if (c.env?.DB) {
    const usersRes = await c.env.DB.prepare("SELECT id, email, full_name, total_xp, level FROM users ORDER BY total_xp DESC LIMIT 50").all();
    const xpUsers = usersRes?.results || [];
    xpUsers.forEach((user: any) => {
      xpLeaderboard.push({
        user_id: String(user.id),
        name: user.full_name || user.email || `Học viên #${user.id}`,
        xp: Number(user.total_xp || 0),
        level: String(user.level || calculateLevelFromXp(Number(user.total_xp || 0)))
      });
    });

    const toeicRes = await c.env.DB.prepare(
      `SELECT user_id, MAX(score) as best_score, COUNT(*) as exams_taken
       FROM exam_results
       GROUP BY user_id
       ORDER BY best_score DESC, exams_taken DESC
       LIMIT 50`
    ).all();
    (toeicRes?.results || []).forEach((row: any) => {
      toeicLeaderboard.push({
        user_id: String(row.user_id),
        best_score: Number(row.best_score || 0),
        exams_taken: Number(row.exams_taken || 0)
      });
    });

    const communityRes = await c.env.DB.prepare(
      `SELECT user_id, COUNT(*) as posts, SUM(COALESCE(likes_count,0)) as likes
       FROM blogs
       WHERE status = 'approved'
       GROUP BY user_id
       ORDER BY likes DESC, posts DESC
       LIMIT 50`
    ).all();
    (communityRes?.results || []).forEach((row: any) => {
      communityLeaderboard.push({
        user_id: String(row.user_id),
        posts: Number(row.posts || 0),
        likes: Number(row.likes || 0)
      });
    });
  }

  return c.json({
    ok: true,
    leaderboards: {
      xp: xpLeaderboard,
      toeic: toeicLeaderboard,
      community: communityLeaderboard
    }
  });
});
```

#### 3) Gợi ý frontend gọi API gamification
- `POST /v1/learning/user_level.php` với body `{ action: 'complete_lesson' }` để cộng XP ngay khi hoàn thành.
- `GET /v1/blog/get_leaderboard.php` để hiển thị ba bảng xếp hạng riêng.

---

## 3) AI đồng hành trong quá trình học

### Core code hiện có
- [be/worker-hono/src/routes/ai.ts](../be/worker-hono/src/routes/ai.ts)
  - Hằng SYSTEM_PROMPT
  - Route /chat

### Implement plan
1. Giữ route AI hiện tại làm entry point chính.
2. Bổ sung context cho prompt từ các dữ liệu học hiện tại:
   - lesson đang học
   - progress hiện tại
   - lỗi sai gần nhất
   - điểm thi gần nhất
3. Khi người dùng hỏi về lỗi sai hoặc bài tập, AI sẽ trả về format gọn:
   - Explanation
   - Correct answer
   - Why it is wrong
   - Suggested next practice
4. Kết nối AI với frontend ở các chỗ:
   - khi làm quiz
   - khi học grammar/vocabulary
   - khi xem kết quả exam
5. Nếu cần, có thể thêm một endpoint phụ để AI nhận context theo userId và lessonId.

### Code mẫu AI đồng hành
#### 1) Thêm endpoint `ai/context` trong `be/worker-hono/src/routes/ai.ts`
```ts
async function getUserLearningContext(c: any): Promise<Record<string, any>> {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || c.req.query("auth_token") || c.req.query("session_token") || "";
  let user: any = null;

  if (c.env?.DB && token) {
    try {
      user = await c.env.DB.prepare(
        "SELECT id, email, full_name, level, total_xp FROM users WHERE session_token = ? OR remember_token = ? OR id = ? OR email = ?"
      ).bind(token, token, token, token).first();
    } catch (e) {}
  }

  const userId = user ? String(user.id) : token;
  const context: any = {
    user_id: userId,
    user_name: user?.full_name || user?.email || "Học viên EngWithMe",
    user_level: user?.level || "1",
    user_xp: Number(user?.total_xp || 0)
  };

  if (c.env?.DB && userId) {
    try {
      const progress = await c.env.DB.prepare(
        "SELECT topic_id, progress_percent FROM user_progress WHERE user_id = ? ORDER BY id DESC LIMIT 5"
      ).bind(userId).all();
      context.recent_progress = progress?.results || [];

      const exam = await c.env.DB.prepare(
        "SELECT test_name, score, listening_score, reading_score, created_at FROM exam_results WHERE user_id = ? ORDER BY id DESC LIMIT 1"
      ).bind(userId).first();
      if (exam) context.latest_exam = exam;
    } catch (e) {}
  }

  return context;
}

aiApp.post("/context", async (c) => {
  const context = await getUserLearningContext(c);
  return c.json({ ok: true, context });
});
```

#### 2) Nâng cấp `/chat` để đính kèm context vào prompt
```ts
function formatLearningContext(context: Record<string, any>): string {
  const lines = [
    "User Context:",
    `- Name: ${context.user_name}`,
    `- Level: ${context.user_level}`,
    `- Total XP: ${context.user_xp}`
  ];

  if (context.latest_exam) {
    lines.push(`- Latest exam: ${context.latest_exam.test_name} (${context.latest_exam.score} điểm)`);
  }

  if (Array.isArray(context.recent_progress) && context.recent_progress.length) {
    const last = context.recent_progress[0];
    lines.push(`- Recent progress: ${last.topic_id} ${last.progress_percent}%`);
  }

  return lines.join("\n");
}

aiApp.post("/chat", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const userMessages = Array.isArray(body?.messages) ? body.messages : [];
  if (userMessages.length === 0 && body?.prompt) {
    userMessages.push({ role: "user", content: String(body.prompt) });
  }

  const context = body.context || (await getUserLearningContext(c));
  const contextText = formatLearningContext(context);
  const injectedSystemPrompt = `${SYSTEM_PROMPT}\n\n${contextText}`;

  const formattedMessages = [
    { role: "system", content: injectedSystemPrompt },
    ...userMessages.slice(-10)
  ];

  // Phần còn lại giữ nguyên logic gọi AI
});
```

#### 3) Gợi ý frontend gọi AI
- Trước khi gửi câu hỏi, gọi `POST /v1/ai/context` để lấy trạng thái học tập hiện tại.
- Gửi `POST /v1/ai/chat` cùng `context` và `messages`/`prompt`.
- Khi user hỏi về lỗi sai, backend có thể chèn thêm prompt:
  `"Explain the error, the correct answer, why it is wrong, and suggest the next practice."`

---

## Gắn vào triển khai thực tế

### Ưu tiên triển khai theo thứ tự
1. Learning journey API tổng hợp
2. XP + level + badge + leaderboard
3. AI tutor context-aware

### Điểm tích hợp an toàn
- [be/worker-hono/src/index.ts](../be/worker-hono/src/index.ts) là nơi các route đã được đăng ký sẵn, nên rất phù hợp để nối thêm alias hoặc endpoint mới.

### Ghi chú
- Không cần sửa logic cũ ngay từ đầu.
- Chỉ cần “đóng vai trò như adapter” giữa frontend và các core route hiện có.
- Nếu muốn, phần tiếp theo có thể chuyển thành một checklist task theo từng file và từng API để dev bắt đầu làm ngay.
