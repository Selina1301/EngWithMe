import { Hono } from "hono";
import { getCookie } from "hono/cookie";

type Bindings = {
  DB?: D1Database;
};

const notificationApp = new Hono<{ Bindings: Bindings }>();

// Handler for notifications per User
const handleNotifications = async (c: any) => {
  const authHeader = c.req.header("Authorization") || "";const token = authHeader.replace("Bearer ", "").trim() || c.req.query("auth_token") || getCookie(c, "auth_token") || "";

  // Identify Canonical User ID, Email and Role from D1
  let userId = token || "guest";
  let userEmail = "";
  let userRole = "user";
  let userCreatedAt = "";
  if (token && c.env?.DB) {
    try {
      const u = await c.env.DB.prepare(
        "SELECT id, email, role, created_at FROM users WHERE session_token = ? OR remember_token = ? OR id = ? OR email = ?"
      ).bind(token, token, token, token).first();
      if (u) {
        if (u.id) userId = String(u.id);
        if (u.email) userEmail = String(u.email);
        if (u.role) userRole = String(u.role);
        if (u.created_at) userCreatedAt = String(u.created_at);
      }
    } catch (e) {}
  }

  const action = c.req.query("action") || "";
  const mode = c.req.query("mode") || c.req.query("view") || "";

  // Handle POST Action: purge (Permanent delete single item from profile history)
  if (action === "purge") {
    let body: any = {};
    try { body = await c.req.json(); } catch (e) { try { body = await c.req.parseBody(); } catch (e2) {} }
    const notifId = Number(body.id || c.req.query("id") || 0);
    if (notifId > 0 && c.env?.DB) {
      try {
        await c.env.DB.prepare(
          "INSERT INTO notification_reads (user_id, notification_id, is_deleted) VALUES (?, ?, 2) ON CONFLICT(user_id, notification_id) DO UPDATE SET is_deleted = 2"
        ).bind(userId, notifId).run();
        await c.env.DB.prepare("DELETE FROM notifications WHERE id = ? AND (user_id = ? OR user_id = ?)").bind(notifId, userId, userEmail || userId).run();
      } catch (e) {}
    }
    return c.json({ ok: true, message: "Đã xóa vĩnh viễn thông báo khỏi lịch sử!" });
  }

  // Handle POST Action: purge_all (Permanent delete all items from profile history)
  if (action === "purge_all") {
    if (c.env?.DB) {
      try {
        const visibleRes = await c.env.DB.prepare(
          "SELECT id FROM notifications WHERE user_id = ? OR user_id = ? OR user_id = ? OR user_id = 'all'"
        ).bind(userId, userEmail || userId, token).all();

        if (visibleRes && visibleRes.results && visibleRes.results.length > 0) {
          const inserts = visibleRes.results.map((n: any) =>
            c.env.DB!.prepare(
              "INSERT INTO notification_reads (user_id, notification_id, is_deleted) VALUES (?, ?, 2) ON CONFLICT(user_id, notification_id) DO UPDATE SET is_deleted = 2"
            ).bind(userId, Number(n.id))
          );
          await c.env.DB.batch(inserts);
        }
        await c.env.DB.prepare("DELETE FROM notifications WHERE user_id = ? OR user_id = ?")
          .bind(userId, userEmail || userId).run();
      } catch (e) {}
    }
    return c.json({ ok: true, unread_count: 0, items: [], message: "Đã xóa vĩnh viễn tất cả thông báo khỏi lịch sử!" }, 200);
  }

  // Handle POST Action: delete_all (Dismiss from Bell popup, preserve in Profile history)
  if (action === "delete_all") {
    if (c.env?.DB) {
      try {
        const visibleRes = await c.env.DB.prepare(
          "SELECT id FROM notifications WHERE user_id = ? OR user_id = ? OR user_id = ? OR user_id = 'all'"
        ).bind(userId, userEmail || userId, token).all();

        if (visibleRes && visibleRes.results && visibleRes.results.length > 0) {
          const inserts = visibleRes.results.map((n: any) =>
            c.env.DB!.prepare(
              "INSERT INTO notification_reads (user_id, notification_id, is_deleted) VALUES (?, ?, 1) ON CONFLICT(user_id, notification_id) DO UPDATE SET is_deleted = 1"
            ).bind(userId, Number(n.id))
          );
          await c.env.DB.batch(inserts);
        }
        await c.env.DB.prepare("DELETE FROM notifications WHERE user_id = ? OR user_id = ?")
          .bind(userId, userEmail || userId).run();
      } catch (e) {
        console.error("D1 delete_all error:", e);
      }
    }
    return c.json({ ok: true, unread_count: 0, items: [], message: "Đã ẩn thông báo khỏi cửa sổ chuông!" }, 200);
  }

  // Handle POST Action: mark_read
  if (action === "mark_read") {
    let body: any = {};
    try {
      body = await c.req.json();
    } catch (e) {
      try {
        body = await c.req.parseBody();
      } catch (e2) {}
    }

    const notifId = Number(body.id || c.req.query("id") || 0);

    if (c.env?.DB) {
      try {
        if (notifId > 0) {
          await c.env.DB.prepare(
            "INSERT INTO notification_reads (user_id, notification_id, is_deleted) VALUES (?, ?, 0) ON CONFLICT(user_id, notification_id) DO UPDATE SET is_deleted = 0"
          ).bind(userId, notifId).run();
          await c.env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id = ?)").bind(notifId, userId, userEmail || userId).run();
        } else {
          const visibleRes = await c.env.DB.prepare(
            "SELECT id FROM notifications WHERE user_id = ? OR user_id = ? OR user_id = ? OR user_id = 'all'"
          ).bind(userId, userEmail || userId, token).all();

          if (visibleRes && visibleRes.results && visibleRes.results.length > 0) {
            const inserts = visibleRes.results.map((n: any) =>
              c.env.DB!.prepare(
                "INSERT INTO notification_reads (user_id, notification_id, is_deleted) VALUES (?, ?, 0) ON CONFLICT(user_id, notification_id) DO UPDATE SET is_deleted = 0"
              ).bind(userId, Number(n.id))
            );
            await c.env.DB.batch(inserts);
          }
          await c.env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id = ?")
            .bind(userId, userEmail || userId).run();
        }
      } catch (e) {
        console.error("D1 mark_read error:", e);
      }
    }
  }

  // Query Notifications from D1 Database for this User
  let items: any[] = [];
  if (c.env?.DB) {
    // 1. Try to auto-generate daily roadmap suggestion if applicable (isolated try/catch)
    try {
      if (token && userId !== "guest") {
        const progRes = await c.env.DB.prepare(
          "SELECT COUNT(DISTINCT topic_id) as count FROM user_progress WHERE user_id = ? OR user_id = ? OR user_id = ?"
        ).bind(userId, userEmail || userId, token).first();

        const completedDays = Math.min(17, Number(progRes?.count || 0));
        const currentDayNumber = Math.min(17, completedDays + 1);

        const roadmapTopics = [
          { day: 1, type: "Vocabulary", title: "Ngày 1: Học Từ Vựng TOEIC", link: "vocabulary.html", icon: "🚀" },
          { day: 2, type: "Listening", title: "Ngày 2: Luyện Nghe Part 3 Conversations", link: "listening.html", icon: "🎧" },
          { day: 3, type: "Reading", title: "Ngày 3: Đọc Hiểu Mệnh Đề Quan Hệ", link: "reading.html", icon: "📖" },
          { day: 4, type: "Grammar", title: "Ngày 4: Ngữ Pháp Thì Hiện Tại Hoàn Thành", link: "grammar.html", icon: "✍️" },
          { day: 5, type: "Vocabulary", title: "Ngày 5: Từ Vựng Business & Văn Phòng", link: "vocabulary.html", icon: "💼" },
          { day: 6, type: "Listening", title: "Ngày 6: Luyện Nghe Part 4 Short Talks", link: "listening.html", icon: "🎙️" },
          { day: 7, type: "Quiz", title: "Ngày 7: Thi Thử Mini TOEIC Test 1", link: "quiz.html", icon: "📝" },
          { day: 8, type: "Vocabulary", title: "Ngày 8: Từ Vựng Tài Chính & Ngân Hàng", link: "vocabulary.html", icon: "💰" },
          { day: 9, type: "Reading", title: "Ngày 9: Đọc Hiểu Email & Thông Báo Công Ty", link: "reading.html", icon: "📧" },
          { day: 10, type: "Grammar", title: "Ngày 10: Ngữ Pháp Câu Điều Kiện 1 & 2", link: "grammar.html", icon: "⚡" },
          { day: 11, type: "Listening", title: "Ngày 11: Luyện Nghe Phản Xạ Nhanh Part 1 & 2", link: "listening.html", icon: "🔊" },
          { day: 12, type: "Vocabulary", title: "Ngày 12: Từ Vựng Du Lịch & Khách Sạn", link: "vocabulary.html", icon: "✈️" },
          { day: 13, type: "Reading", title: "Ngày 13: Đọc Hiểu Đoạn Văn Kép (Double Passages)", link: "reading.html", icon: "📚" },
          { day: 14, type: "Grammar", title: "Ngày 14: Ngữ Pháp Câu Bị Động (Passive Voice)", link: "grammar.html", icon: "🛠️" },
          { day: 15, type: "Listening", title: "Ngày 15: Luyện Nghe Giọng Anh - Mỹ Chi Tiết", link: "listening.html", icon: "🌍" },
          { day: 16, type: "Vocabulary", title: "Ngày 16: Ôn Tập 300 Từ Vựng Trọng Tâm", link: "vocabulary.html", icon: "🎯" },
          { day: 17, type: "Quiz", title: "Ngày 17: Thi Thử Full Test 200 Câu TOEIC", link: "quiz.html", icon: "🏆" }
        ];

        const currentTask = roadmapTopics[currentDayNumber - 1] || roadmapTopics[0];
        const dailyCheck = await c.env.DB.prepare(
          "SELECT id FROM notifications WHERE (user_id = ? OR user_id = ?) AND status_tag = ?"
        ).bind(userId, token, `Gợi ý Ngày ${currentDayNumber}`).first();

        if (!dailyCheck) {
          await c.env.DB.prepare(
            `INSERT INTO notifications (user_id, title, message, status_tag, is_read) VALUES (?, ?, ?, ?, 0)`
          ).bind(
            userId,
            `🎯 GỢI Ý HÔM NAY - ${currentTask.title}`,
            `Bạn đã hoàn thành ${completedDays}/17 ngày. Bài tiếp theo là ${currentTask.title}.`,
            `Gợi ý Ngày ${currentDayNumber}`
          ).run();
        }
      }
    } catch (roadmapErr) {
      console.warn("Roadmap suggestion pass:", roadmapErr);
    }

    // Ensure D1 Tables exist safely
    try {
      await c.env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, title TEXT, message TEXT, status_tag TEXT, is_read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
      ).run();
      await c.env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS notification_reads (user_id TEXT, notification_id INTEGER, is_deleted INTEGER DEFAULT 0, PRIMARY KEY(user_id, notification_id))"
      ).run();
    } catch (eTbl) {}

    // 2. Query all notifications for user or broadcast ('all') with per-user read/deleted join
    try {
      const limit = mode === "history" ? 100 : 25;
      const sql = `SELECT n.*, nr.is_deleted, nr.user_id as read_user_id 
             FROM notifications n 
             LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND (nr.user_id = ? OR nr.user_id = ?) 
             WHERE (n.user_id = ? OR n.user_id = ? OR n.user_id = ? OR (n.user_id = 'all' AND datetime(n.created_at) >= datetime(?)) OR n.user_id IS NULL OR n.user_id = '') 
               AND (n.status_tag IS NULL OR n.status_tag NOT IN ('Góp ý học viên', 'Báo cáo vi phạm', 'Hệ thống Admin')) 
             ORDER BY n.id DESC LIMIT ${limit}`;
      const params = [userId, userEmail || userId, userId, userEmail || userId, token, userCreatedAt || '2000-01-01 00:00:00'];

      let res: any = null;
      try {
        res = await c.env.DB.prepare(sql).bind(...params).all();
      } catch (eJoin) {
        console.error("D1 Notification Join Error, trying fallback:", eJoin);
        res = await c.env.DB.prepare(
          `SELECT * FROM notifications WHERE (user_id = ? OR user_id = ? OR (user_id = 'all' AND created_at >= ?)) ORDER BY id DESC LIMIT ${limit}`
        ).bind(userId, userEmail || userId, userCreatedAt || '2000-01-01').all();
      }

      if (res && res.results) {
        const seenIds = new Set<number>();
        const uniqueResults: any[] = [];
        
        res.results.forEach((n: any) => {
          const nId = Number(n.id);
          const delState = Number(n.is_deleted || 0);

          // Permanently deleted items (delState === 2) are always excluded
          if (delState === 2) return;

          // For Bell popup (mode !== 'history'), exclude items hidden from bell (delState === 1)
          if (mode !== "history" && delState === 1) return;

          if (!seenIds.has(nId)) {
            seenIds.add(nId);
            uniqueResults.push(n);
          }
        });

        items = uniqueResults.map((n: any) => {
          const tag = String(n.status_tag || "Thông báo");
          const titleStr = String(n.title || "");
          const isUserRead = Number(n.is_read || 0) === 1 || Boolean(n.read_user_id);
          const isDismissedFromBell = Number(n.is_deleted || 0) === 1;
          
          let icon = "📢";
          let statusLevel = "info";
          if (tag.includes("Bảo trì")) {
            icon = "🛠️";
            statusLevel = "warning";
          } else if (tag.includes("VIP") || tag.includes("Khuyến mãi")) {
            icon = "💎";
            statusLevel = "success";
          } else if (tag.includes("Cập nhật")) {
            icon = "🚀";
            statusLevel = "info";
          } else if (titleStr.includes("Từ Vựng")) {
            icon = "🚀";
          } else if (titleStr.includes("Nghe")) {
            icon = "🎧";
          } else if (titleStr.includes("Đọc")) {
            icon = "📖";
          } else if (titleStr.includes("Ngữ Pháp")) {
            icon = "✍️";
          }

          return {
            id: Number(n.id),
            title: titleStr,
            message: String(n.message || ""),
            status_tag: tag,
            status_level: statusLevel,
            icon,
            time_ago: "Vừa xong",
            is_read: isUserRead ? 1 : 0,
            is_dismissed_from_bell: isDismissedFromBell,
            created_at: n.created_at || "",
            link: titleStr.includes("Nghe") ? "listening.html" : (titleStr.includes("Đọc") ? "reading.html" : (titleStr.includes("Ngữ Pháp") ? "grammar.html" : (titleStr.includes("Thi") ? "quiz.html" : "vocabulary.html")))
          };
        });
      }
    } catch (e) {
      console.error("D1 Notifications Query Error:", e);
    }
  }

  const unreadCount = items.filter((n) => n.is_read === 0).length;

  return c.json({
    ok: true,
    unread_count: unreadCount,
    items,
    grouped: {
      today: {
        label: "Hôm nay",
        items
      }
    }
  }, 200);
};

notificationApp.all("/notifications.php", handleNotifications);
notificationApp.all("/notification/notifications.php", handleNotifications);
notificationApp.all("/notifications", handleNotifications);
notificationApp.all("*", handleNotifications);

export default notificationApp;
