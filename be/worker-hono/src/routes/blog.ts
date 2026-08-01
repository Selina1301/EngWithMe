import { Hono } from "hono";

type Bindings = {
  DB?: D1Database;
};

const blogApp = new Hono<{ Bindings: Bindings }>();

// Helper to resolve D1 User from Session / Auth Header
async function getAuthenticatedUser(c: any): Promise<any | null> {
  if (!c.env?.DB) return null;
  const authHeader = c.req.header("Authorization") || "";
  let token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    token = c.req.header("X-Session-Token") || "";
  }

  if (!token) {
    try {
      const body = await c.req.parseBody();
      token = String(body.session_token || body.token || body.user_id || "").trim();
    } catch (e) {}
  }

  if (!token) return null;

  try {
    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ? OR email = ?"
    )
      .bind(token, token, token, token)
      .first();
    return user || null;
  } catch (e) {
    return null;
  }
}

function getBadgeByLevel(levelNum: number): string {
  if (levelNum >= 500) return "🌌 Bậc Thầy Tối Cao Vô Song";
  if (levelNum >= 400) return "👑 Chí Tôn Ngôn Ngữ Vĩnh Cửu";
  if (levelNum >= 270) return "⚡ Thánh Tri Thức Thần Thoại";
  if (levelNum >= 200) return "💎 Thần Thoại Bất Tử EngWithMe";
  if (levelNum >= 150) return "🔥 Bá Chủ Ngôn Ngữ Bất Bại";
  if (levelNum >= 100) return "🌟 Đại Sứ Tiếng Anh Toàn Cầu";
  if (levelNum >= 70) return "🔮 Cao Thủ Thông Thái";
  if (levelNum >= 50) return "⚡ Tướng Quân Từ Vựng";
  if (levelNum >= 30) return "👑 Huyền Thoại EngWithMe";
  if (levelNum >= 10) return "🛡️ Học Sinh Chăm Chỉ";
  return "🥉 Học Viên Tập Sự";
}

// GET /v1/blog/get_blogs.php & /list
blogApp.get("/get_blogs.php", async (c) => {
  let blogs: any[] = [];
  const user = await getAuthenticatedUser(c);
  const userId = user ? String(user.id) : null;
  const likedSet = new Set<string>();

  if (c.env?.DB) {
    try {
      // Ensure blog_likes table exists
      await c.env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS blog_likes (id INTEGER PRIMARY KEY AUTOINCREMENT, blog_id INTEGER, user_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(blog_id, user_id))"
      ).run();

      if (userId) {
        const { results: likedRows } = await c.env.DB.prepare(
          "SELECT blog_id FROM blog_likes WHERE user_id = ?"
        ).bind(userId).all();
        if (likedRows) {
          likedRows.forEach((r: any) => likedSet.add(String(r.blog_id)));
        }
      }

      const { results } = await c.env.DB.prepare(
        "SELECT id, user_id, author_name, title, content, likes_count, views_count, rating, created_at FROM blogs WHERE status = 'approved' ORDER BY id DESC LIMIT 50"
      ).all();

      if (results && results.length > 0) {
        blogs = results.map((b: any) => ({
          ...b,
          likes: Number(b.likes_count || 0),
          views: Number(b.views_count || 0),
          is_liked: likedSet.has(String(b.id))
        }));
      }
    } catch (e) {
      console.error("D1 Fetch Blogs Error:", e);
    }
  }

  return c.json({ ok: true, blogs });
});

blogApp.get("/list", async (c) => {
  let blogs: any[] = [];
  if (c.env?.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        "SELECT id, user_id, author_name, title, content, likes_count, views_count, rating, created_at FROM blogs WHERE status = 'approved' ORDER BY id DESC LIMIT 50"
      ).all();
      if (results && results.length > 0) {
        blogs = results.map((b: any) => ({
          ...b,
          likes: Number(b.likes_count || 0),
          views: Number(b.views_count || 0)
        }));
      }
    } catch (e) {
      console.error("D1 List Blogs Error:", e);
    }
  }
  return c.json({ ok: true, blogs });
});

// GET /v1/blog/get_leaderboard.php -> Pure Real D1 Database Data (No Mock/Fake Data)
blogApp.get("/get_leaderboard.php", async (c) => {
  let leaderboard: any[] = [];
  let topXp: any[] = [];
  let topBloggers: any[] = [];
  let topToeic: any[] = [];

  const defaultAvatars = [
    "assets/icons/theme/logoEW.png",
    "assets/icons/theme/logoEW.png"
  ];

  if (c.env?.DB) {
    try {
      // Query REAL active users from D1 Database
      const { results } = await c.env.DB.prepare(
        "SELECT id, full_name, level, avatar, is_vip, email FROM users WHERE status != 'locked' LIMIT 50"
      ).all();

      if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
          const u: any = results[i];
          const lvl = Math.max(1, parseInt(String(u.level || "1"), 10));
          const nameStr = u.full_name || u.name || (u.email ? u.email.split("@")[0] : `Học viên #${u.id}`);
          
          let blogCount = 0;
          let totalLikes = 0;
          let totalViews = 0;
          try {
            const blogStats = await c.env.DB.prepare(
              "SELECT COUNT(*) as cnt, SUM(COALESCE(likes_count, 0)) as likes, SUM(COALESCE(views_count, 0)) as views FROM blogs WHERE user_id = ? AND status = 'approved'"
            ).bind(String(u.id)).first();
            if (blogStats) {
              blogCount = Number(blogStats.cnt || 0);
              totalLikes = Number(blogStats.likes || 0);
              totalViews = Number(blogStats.views || 0);
            }
          } catch (e2) {}

          let accumulativeToeicPts = 0;
          let totalCorrectSum = 0;
          let totalQuestionsSum = 0;
          let examsCompleted = 0;

          try {
            const { results: examSets } = await c.env.DB.prepare(
              "SELECT test_name, MAX(score) as max_score, MAX(correct_count) as max_correct, MAX(total_questions) as max_total FROM exam_results WHERE user_id = ? OR user_id = ? OR user_id = ? GROUP BY test_name"
            ).bind(String(u.id), String(u.email || ""), String(u.session_token || "")).all();

            if (examSets && examSets.length > 0) {
              examsCompleted = examSets.length;
              for (const row of examSets as any[]) {
                accumulativeToeicPts += Number(row.max_score || 0);
                totalCorrectSum += Number(row.max_correct || 0);
                totalQuestionsSum += Number(row.max_total || 0);
              }
            }
          } catch (e3) {}

          let userProgressXp = 0;
          try {
            const xpRow = await c.env.DB.prepare(
              "SELECT SUM(COALESCE(score, 0)) as total_score FROM user_progress WHERE user_id = ?"
            ).bind(String(u.id)).first();
            if (xpRow) {
              userProgressXp = Number(xpRow.total_score || 0);
            }
          } catch (eXp) {}

          const userXp = Math.max(userProgressXp, (lvl * 180) + (blogCount * 50) + (totalLikes * 10));
          const toeicAccuracy = totalQuestionsSum > 0 
            ? Math.min(100, Math.round((totalCorrectSum / totalQuestionsSum) * 100)) 
            : (accumulativeToeicPts > 0 && examsCompleted > 0 
                ? Math.min(100, Math.round((accumulativeToeicPts / (examsCompleted * 990)) * 100)) 
                : 0);

          leaderboard.push({
            id: String(u.id),
            name: nameStr,
            level: lvl,
            badge: getBadgeByLevel(lvl),
            avatar: u.avatar || defaultAvatars[i % defaultAvatars.length],
            is_vip: Number(u.is_vip || 0),
            count: `${blogCount} bài viết`,
            blog_count: blogCount,
            total_likes: totalLikes,
            total_views: totalViews,
            xp: userXp,
            xp_formatted: `${userXp.toLocaleString()} XP`,
            toeic_score: accumulativeToeicPts,
            toeic_accuracy: toeicAccuracy,
            total_correct_sum: totalCorrectSum,
            total_questions_sum: totalQuestionsSum,
            exams_completed: examsCompleted
          });
        }
      }
    } catch (e) {
      console.error("D1 Get Leaderboard Error:", e);
    }
  }

  // 1. Top XP: Sort strictly by xp DESC (Max 10)
  topXp = [...leaderboard]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));

  // 2. Top Bloggers: Sort by total_likes DESC, total_views DESC, blog_count DESC (Max 10)
  topBloggers = [...leaderboard]
    .sort((a, b) => (b.total_likes - a.total_likes) || (b.total_views - a.total_views) || (b.blog_count - a.blog_count))
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));

  // 3. Top TOEIC: Accumulative TOEIC PTS DESC, then Accuracy DESC, then Exams Completed DESC
  topToeic = [...leaderboard]
    .sort((a, b) => (b.toeic_score - a.toeic_score) || (b.toeic_accuracy - a.toeic_accuracy) || (b.exams_completed - a.exams_completed))
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));

  return c.json({
    ok: true,
    leaderboard: topXp,
    categories: {
      xp: topXp,
      bloggers: topBloggers,
      toeic: topToeic
    }
  });
});

// POST /v1/blog/submit_blog.php -> Insert with status='pending' for Admin Approval
blogApp.post("/submit_blog.php", async (c) => {
  let body: Record<string, any> = {};
  try {
    body = await c.req.parseBody();
  } catch (e) {
    try {
      body = await c.req.json();
    } catch (e2) {}
  }

  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  const rating = Math.min(5, Math.max(1, parseInt(String(body.rating || "5"), 10)));

  if (!title || !content) {
    return c.json({ ok: false, message: "Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết." }, 400);
  }

  const user = await getAuthenticatedUser(c);
  if (!user) {
    return c.json({ ok: false, message: "Vui lòng đăng nhập để gửi bài viết chia sẻ!" }, 401);
  }

  const userId = String(user.id);
  const authorName = user.full_name || user.name || "Học viên EngWithMe";
  const initialStatus = user.role === "admin" ? "approved" : "pending";

  if (c.env?.DB) {
    try {
      await c.env.DB.prepare(
        "INSERT INTO blogs (user_id, author_name, title, content, rating, status, likes_count, views_count) VALUES (?, ?, ?, ?, ?, ?, 0, 1)"
      ).bind(userId, authorName, title, content, rating, initialStatus).run();
    } catch (e) {
      console.error("D1 Submit Blog Error:", e);
      return c.json({ ok: false, message: "Lỗi lưu bài viết vào CSDL." }, 500);
    }
  }

  const msg = initialStatus === "approved"
    ? "Đã xuất bản bài viết thành công!"
    : "Đã gửi bài viết thành công! Bài viết của bạn đã chuyển tới Admin để kiểm duyệt trước khi hiển thị.";

  return c.json({ ok: true, status: initialStatus, message: msg });
});

// POST /v1/blog/toggle_blog_like.php -> Real Per-User Likes in D1
blogApp.post("/toggle_blog_like.php", async (c) => {
  let body: Record<string, any> = {};
  try {
    body = await c.req.parseBody();
  } catch (e) {
    try {
      body = await c.req.json();
    } catch (e2) {}
  }
  const blogId = body.blog_id || body.id;
  if (!blogId) {
    return c.json({ ok: false, message: "Thiếu ID bài viết." }, 400);
  }

  const user = await getAuthenticatedUser(c);
  if (!user) {
    return c.json({ ok: false, message: "Vui lòng đăng nhập để thả tim bài viết!" }, 401);
  }
  const userId = String(user.id);

  let isLiked = false;
  let newLikes = 0;

  if (c.env?.DB) {
    try {
      await c.env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS blog_likes (id INTEGER PRIMARY KEY AUTOINCREMENT, blog_id INTEGER, user_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(blog_id, user_id))"
      ).run();

      const existing = await c.env.DB.prepare(
        "SELECT id FROM blog_likes WHERE blog_id = ? AND user_id = ?"
      ).bind(blogId, userId).first();

      if (existing) {
        // User un-likes
        await c.env.DB.prepare("DELETE FROM blog_likes WHERE blog_id = ? AND user_id = ?").bind(blogId, userId).run();
        await c.env.DB.prepare("UPDATE blogs SET likes_count = MAX(0, likes_count - 1) WHERE id = ?").bind(blogId).run();
        isLiked = false;
      } else {
        // User likes
        await c.env.DB.prepare("INSERT INTO blog_likes (blog_id, user_id) VALUES (?, ?)").bind(blogId, userId).run();
        await c.env.DB.prepare("UPDATE blogs SET likes_count = likes_count + 1 WHERE id = ?").bind(blogId).run();
        isLiked = true;
      }

      const updated = await c.env.DB.prepare("SELECT likes_count FROM blogs WHERE id = ?").bind(blogId).first();
      if (updated) newLikes = Number(updated.likes_count || 0);
    } catch (e) {
      console.error("D1 Toggle Like Error:", e);
    }
  }

  return c.json({ ok: true, liked: isLiked, likes: newLikes, likes_count: newLikes });
});

// POST /v1/blog/increment_blog_view.php -> Strict Per-User Views Deduplication in D1
blogApp.post("/increment_blog_view.php", async (c) => {
  let body: Record<string, any> = {};
  try {
    body = await c.req.parseBody();
  } catch (e) {
    try {
      body = await c.req.json();
    } catch (e2) {}
  }
  const blogId = body.blog_id || body.id;
  let newViews = 1;

  if (!blogId) {
    return c.json({ ok: false, message: "Thiếu ID bài viết." }, 400);
  }

  const user = await getAuthenticatedUser(c);
  const clientIp = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "127.0.0.1";
  const viewerId = user ? `user_${user.id}` : `guest_${clientIp.split(",")[0].trim()}`;

  if (c.env?.DB) {
    try {
      await c.env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS blog_views (id INTEGER PRIMARY KEY AUTOINCREMENT, blog_id INTEGER, viewer_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(blog_id, viewer_id))"
      ).run();

      const existing = await c.env.DB.prepare(
        "SELECT id FROM blog_views WHERE blog_id = ? AND viewer_id = ?"
      ).bind(blogId, viewerId).first();

      if (!existing) {
        // First time this user/IP views this article -> Add to blog_views & increment views_count
        await c.env.DB.prepare("INSERT INTO blog_views (blog_id, viewer_id) VALUES (?, ?)").bind(blogId, viewerId).run();
        await c.env.DB.prepare("UPDATE blogs SET views_count = views_count + 1 WHERE id = ?").bind(blogId).run();
      }

      const updated = await c.env.DB.prepare("SELECT views_count FROM blogs WHERE id = ?").bind(blogId).first();
      if (updated) newViews = Number(updated.views_count || 1);
    } catch (e) {
      console.error("D1 View Error:", e);
    }
  }

  return c.json({ ok: true, views: newViews, views_count: newViews });
});

// Admin Blog Moderation Routes
blogApp.get("/admin_pending.php", async (c) => {
  let blogs: any[] = [];
  if (c.env?.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        "SELECT id, user_id, author_name, title, content, rating, status, created_at FROM blogs WHERE status = 'pending' ORDER BY id DESC"
      ).all();
      if (results) blogs = results;
    } catch (e) {}
  }
  return c.json({ ok: true, blogs });
});

blogApp.post("/admin_approve.php", async (c) => {
  let body: Record<string, any> = {};
  try { body = await c.req.parseBody(); } catch (e) { try { body = await c.req.json(); } catch (e2) {} }
  const blogId = body.blog_id || body.id;
  if (!blogId || !c.env?.DB) return c.json({ ok: false, message: "Thiếu ID bài viết." }, 400);

  try {
    await c.env.DB.prepare("UPDATE blogs SET status = 'approved' WHERE id = ?").bind(blogId).run();
    return c.json({ ok: true, message: "Đã duyệt xuất bản bài viết thành công!" });
  } catch (e) {
    return c.json({ ok: false, message: "Lỗi duyệt bài viết." }, 500);
  }
});

blogApp.post("/admin_reject.php", async (c) => {
  let body: Record<string, any> = {};
  try { body = await c.req.parseBody(); } catch (e) { try { body = await c.req.json(); } catch (e2) {} }
  const blogId = body.blog_id || body.id;
  if (!blogId || !c.env?.DB) return c.json({ ok: false, message: "Thiếu ID bài viết." }, 400);

  try {
    await c.env.DB.prepare("DELETE FROM blogs WHERE id = ?").bind(blogId).run();
    return c.json({ ok: true, message: "Đã xóa bài viết thành công!" });
  } catch (e) {
    return c.json({ ok: false, message: "Lỗi xóa bài viết." }, 500);
  }
});

export default blogApp;
