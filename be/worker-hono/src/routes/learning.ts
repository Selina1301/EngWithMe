import { Hono } from "hono";

type Bindings = {
  DB?: D1Database;
  RESEND_API_KEY?: string;
};

const learningApp = new Hono<{ Bindings: Bindings }>();

// GET /v1/learning/content
learningApp.get("/content", (c) => {
  const section = c.req.query("section") || "all";

  const contentData = {
    section,
    source: "Cloudflare-Edge-Hono-v1",
    timestamp: new Date().toISOString(),
    items: [
      {
        id: 1,
        title: "TOEIC Listening Part 3: Short Conversations",
        category: "listening",
        level: "B1-B2",
        duration: "15 mins",
        audio_url: "audio/listening_part3_sample.mp3"
      },
      {
        id: 2,
        title: "Essential Business Vocabulary 300+",
        category: "vocabulary",
        level: "A2-B1",
        count: 320,
        badge: "HOT"
      },
      {
        id: 3,
        title: "Grammar Master: Relative Clauses & Passive Voice",
        category: "grammar",
        level: "B1",
        lessonsCount: 12
      }
    ]
  };

  return c.json({ ok: true, data: contentData });
});

// GET /v1/learning/learning_content.php
learningApp.get("/learning_content.php", (c) => {
  const section = c.req.query("section") || "all";
  const items = [
    { id: 1, title: "300 từ vựng TOEIC cơ bản", category: "vocabulary", section: "vocabulary", level: "A1-A2" },
    { id: 2, title: "Luyện nghe Part 3 - Short Conversations", category: "listening", section: "listening", level: "B1-B2" },
    { id: 3, title: "Ngữ pháp Mệnh đề quan hệ & Thì hiện tại hoàn thành", category: "grammar", section: "grammar", level: "B1" }
  ];
  return c.json({ ok: true, section, items, data: items, content: items });
});

// GET & POST /v1/learning/sync_progress.php -> D1 user_progress per User
learningApp.all("/sync_progress.php", async (c) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim() || c.req.query("auth_token") || "";

  let dbUser: any = null;
  if (c.env?.DB && token) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ?"
      ).bind(token, token, token).first();
    } catch (e) {}
  }
  const userId = dbUser ? String(dbUser.id) : token;

  if (c.req.method === "POST" && c.env?.DB && userId) {
    const body = (await c.req.parseBody().catch(() => ({}))) as Record<string, any>;
    const topicId = String(body.topic_id || "general").trim();
    const percent = Number(body.progress_percent || 100);

    try {
      const existing = await c.env.DB.prepare("SELECT * FROM user_progress WHERE user_id = ? AND topic_id = ?")
        .bind(userId, topicId).first();
      if (existing) {
        await c.env.DB.prepare("UPDATE user_progress SET progress_percent = ? WHERE id = ?")
          .bind(percent, existing.id).run();
      } else {
        await c.env.DB.prepare(
          "INSERT INTO user_progress (user_id, topic_id, progress_percent) VALUES (?, ?, ?)"
        ).bind(userId, topicId, percent).run();
      }
    } catch (e) {}
  }

  let progress: any[] = [];
  if (c.env?.DB && userId) {
    try {
      const res = await c.env.DB.prepare("SELECT * FROM user_progress WHERE user_id = ?").bind(userId).all();
      if (res && res.results) progress = res.results;
    } catch (e) {}
  }

  return c.json({ ok: true, progress, message: "Đã đồng bộ tiến độ." });
});

// GET & POST /v1/learning/sync_vocab.php per User
learningApp.all("/sync_vocab.php", async (c) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim() || c.req.query("auth_token") || "";

  let dbUser: any = null;
  if (c.env?.DB && token) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ?"
      ).bind(token, token, token).first();
    } catch (e) {}
  }
  const userId = dbUser ? String(dbUser.id) : token;

  let words: any[] = [];
  if (c.env?.DB && userId) {
    try {
      const res = await c.env.DB.prepare("SELECT * FROM user_progress WHERE user_id = ? AND (topic_id LIKE 'vocab_%' OR topic_id LIKE 'word_%')").bind(userId).all();
      if (res && res.results) words = res.results;
    } catch (e) {}
  }

  return c.json({ ok: true, words, user_id: userId, message: "Đã đồng bộ từ vựng cá nhân." });
});

// GET & POST /v1/learning/sync_grammar.php per User
learningApp.all("/sync_grammar.php", async (c) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim() || c.req.query("auth_token") || "";

  let dbUser: any = null;
  if (c.env?.DB && token) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ?"
      ).bind(token, token, token).first();
    } catch (e) {}
  }
  const userId = dbUser ? String(dbUser.id) : token;

  let topics: any[] = [];
  if (c.env?.DB && userId) {
    try {
      const res = await c.env.DB.prepare("SELECT * FROM user_progress WHERE user_id = ? AND (topic_id LIKE 'grammar_%' OR topic_id LIKE 'rule_%')").bind(userId).all();
      if (res && res.results) topics = res.results;
    } catch (e) {}
  }

  return c.json({ ok: true, topics, user_id: userId, message: "Đã đồng bộ ngữ pháp cá nhân." });
});

// Helper for XP per level tier calculation
function getXpForLevelServer(lvlInput: number): number {
  const lvl = Math.max(1, Math.floor(Number(lvlInput) || 1));
  if (lvl < 10) return 15;
  if (lvl < 30) return 25;
  if (lvl < 70) return 40;
  if (lvl < 120) return 60;
  if (lvl < 180) return 80;

  const bracketIndex = Math.floor((lvl - 180) / 70) + 1;
  return 80 + (bracketIndex * 20);
}

const LEVEL_TITLES_SERVER = [
  { minLevel: 500, title: "🌌 Bậc Thầy Tối Cao Vô Song" },
  { minLevel: 400, title: "👑 Chí Tôn Ngôn Ngữ Vĩnh Cửu" },
  { minLevel: 270, title: "⚡ Thánh Tri Thức Thần Thoại" },
  { minLevel: 200, title: "💎 Thần Thoại Bất Tử EngWithMe" },
  { minLevel: 150, title: "🔥 Bá Chủ Ngôn Ngữ Bất Bại" },
  { minLevel: 100, title: "🌟 Đại Sứ Tiếng Anh Toàn Cầu" },
  { minLevel: 70,  title: "🔮 Cao Thủ Thông Thái" },
  { minLevel: 50,  title: "⚡ Tướng Quân Từ Vựng" },
  { minLevel: 30,  title: "👑 Huyền Thoại EngWithMe" },
  { minLevel: 10,  title: "🛡️ Học Sinh Chăm Chỉ" },
  { minLevel: 1,   title: "🥉 Học Viên Tập Sự" }
];

// GET & POST /v1/learning/user_level.php -> Unlimited Numeric Level (1-999) + Prestigious Titles per User
learningApp.all("/user_level.php", async (c) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim() || c.req.query("auth_token") || "";

  let dbUser: any = null;
  if (c.env?.DB && token) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ?"
      ).bind(token, token, token).first();
    } catch (e) {}
  }

  if (!dbUser) {
    return c.json({ ok: true, level: "1", level_number: 1, level_title: "🥉 Học Viên Tập Sự", score: 0, xp: 0 });
  }

  let totalXp = 0;
  if (c.env?.DB && dbUser.id) {
    try {
      const progRes = await c.env.DB.prepare("SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?").bind(dbUser.id).first();
      const examRes = await c.env.DB.prepare("SELECT COUNT(*) as count, SUM(score) as total_score FROM exam_results WHERE user_id = ?").bind(dbUser.id).first();

      const progCount = Number(progRes?.count || 0);
      const examCount = Number(examRes?.count || 0);
      const examScoreSum = Number(examRes?.total_score || 0);

      totalXp = (progCount * 25) + (examCount * 50) + Math.floor(examScoreSum / 10);
    } catch (e) {}
  }

  // Calculate Numeric Level (1 - 999)
  let calculatedLevel = 1;
  let remainingXp = Math.max(0, totalXp);
  let costForNext = getXpForLevelServer(calculatedLevel);

  while (remainingXp >= costForNext && calculatedLevel < 999) {
    remainingXp -= costForNext;
    calculatedLevel++;
    costForNext = getXpForLevelServer(calculatedLevel);
  }

  let title = "🥉 Học Viên Tập Sự";
  for (const t of LEVEL_TITLES_SERVER) {
    if (calculatedLevel >= t.minLevel) {
      title = t.title;
      break;
    }
  }

  const levelStr = String(calculatedLevel);
  if (c.env?.DB && dbUser.id && levelStr !== String(dbUser.level)) {
    try {
      await c.env.DB.prepare("UPDATE users SET level = ? WHERE id = ?").bind(levelStr, dbUser.id).run();
    } catch (e) {}
  }

  return c.json({
    ok: true,
    user_id: String(dbUser.id),
    level: levelStr,
    level_number: calculatedLevel,
    level_title: title,
    current_level_xp: remainingXp,
    xp_for_next_level: costForNext,
    score: totalXp,
    xp: totalXp
  });
});

// POST /v1/learning/send_contact.php -> Send Contact / Feedback email to tungduong5x@gmail.com
learningApp.post("/send_contact.php", async (c) => {
  let body: Record<string, any> = {};
  try {
    body = await c.req.json();
  } catch (e) {
    try {
      body = (await c.req.parseBody().catch(() => ({}))) as Record<string, any>;
    } catch (e2) {}
  }

  const name = String(body.name || body["Họ tên"] || "Học viên EngWithMe").trim();
  const phone = String(body.phone || body["Số điện thoại"] || "Chưa cung cấp").trim();
  const email = String(body.email || body["Email"] || "Chưa cung cấp").trim();
  const title = String(body.title || body["Tiêu đề"] || body.subject || "Góp ý cải thiện website").trim();
  const message = String(body.message || body["Nội dung"] || "").trim();

  if (!message) {
    return c.json({ ok: false, success: false, message: "Vui lòng nhập nội dung góp ý của bạn." }, 400);
  }

  // 1. Dispatch Email to Admin Inbox (tungduong5x@gmail.com) via Resend API
  const adminEmail = "tungduong5x@gmail.com";
  const apiKey = c.env?.RESEND_API_KEY;
  let emailSent = false;

  if (apiKey) {
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "EngWithMe Feedback <auth@tungf.io.vn>",
          to: [adminEmail],
          subject: `[EngWithMe - Góp ý mới từ Học viên] ${title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #ffffff; border-radius: 16px; border: 2px solid #38bdf8;">
              <h2 style="color: #38bdf8; text-align: center; margin-top: 0;">📩 NỘI DUNG GÓP Ý TỪ HỌC VIÊN</h2>
              <div style="background: rgba(30, 41, 59, 0.8); padding: 18px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 20px;">
                <p style="margin: 6px 0;">👤 <strong>Họ tên:</strong> ${name}</p>
                <p style="margin: 6px 0;">📞 <strong>Số điện thoại:</strong> ${phone}</p>
                <p style="margin: 6px 0;">📧 <strong>Email học viên:</strong> ${email}</p>
                <p style="margin: 6px 0;">📌 <strong>Tiêu đề:</strong> <span style="color: #38bdf8; font-weight: bold;">${title}</span></p>
              </div>
              <div style="background: rgba(2, 6, 23, 0.6); padding: 20px; border-radius: 12px; border-left: 4px solid #10b981;">
                <h4 style="margin: 0 0 10px 0; color: #10b981;">📝 Nội dung góp ý / Phản hồi:</h4>
                <p style="white-space: pre-wrap; line-height: 1.6; color: #f1f5f9; margin: 0;">${message}</p>
              </div>
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">Email được gửi tự động từ Hệ thống EngWithMe Feedback Center.</p>
            </div>
          `
        })
      });

      if (resendRes.ok) {
        emailSent = true;
        console.log(`[Resend Feedback Success] Sent email to ${adminEmail}`);
      } else {
        const errTxt = await resendRes.text();
        console.warn(`[Resend Feedback Warning]: ${errTxt}`);
      }
    } catch (err) {
      console.error("Resend API Feedback error:", err);
    }
  }

  // 2. Fallback to MailChannels if needed
  if (!emailSent) {
    try {
      await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: adminEmail, name: "Admin EngWithMe" }] }],
          from: { email: "auth@tungf.io.vn", name: "EngWithMe Feedback" },
          subject: `[EngWithMe Góp ý] ${title}`,
          content: [
            {
              type: "text/html",
              value: `<div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #fff;"><h3>Góp ý mới từ ${name} (${phone} - ${email}):</h3><p><b>Tiêu đề:</b> ${title}</p><p><b>Nội dung:</b> ${message}</p></div>`
            }
          ]
        })
      });
    } catch (e) {}
  }

  // 3. Save notification record for Admin in D1 database
  if (c.env?.DB) {
    try {
      await c.env.DB.prepare(
        "INSERT INTO notifications (user_id, title, message, status_tag, is_read) VALUES ('admin', ?, ?, 'Góp ý học viên', 0)"
      ).bind(`📩 Góp ý mới từ ${name}`, `[${title}]: ${message} (SĐT: ${phone}, Email: ${email})`).run();
    } catch (e) {}
  }

  return c.json({
    ok: true,
    success: true,
    message: "🎉 Cảm ơn bạn đã đóng góp ý kiến! Phản hồi của bạn đã được gửi trực tiếp tới hòm thư Admin (tungduong5x@gmail.com)."
  });
});

export default learningApp;
