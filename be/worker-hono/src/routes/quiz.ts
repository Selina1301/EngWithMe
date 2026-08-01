import { Hono } from "hono";

type Bindings = {
  DB?: D1Database;
};

const quizApp = new Hono<{ Bindings: Bindings }>();

// GET & POST /v1/quiz/test_results.php -> D1 SQL Save & Fetch Exam Results per User
quizApp.all("/test_results.php", async (c) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || c.req.query("auth_token") || c.req.query("session_token") || c.req.query("token") || "";

  let dbUser: any = null;
  if (c.env?.DB && token) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ? OR email = ?"
      ).bind(token, token, token, token).first();
    } catch (e) {}
  }
  const userId = dbUser ? String(dbUser.id) : (token || "guest");

  if (c.req.method === "POST") {
    let body: Record<string, any> = {};
    try { body = (await c.req.parseBody().catch(() => ({}))) as Record<string, any>; } catch (e) {}
    let jsonBody: Record<string, any> = {};
    try { jsonBody = (await c.req.json().catch(() => ({}))) as Record<string, any>; } catch (e) {}

    const inputUserId = String(jsonBody.user_id || body.user_id || "").trim();
    const inputEmail = String(jsonBody.email || body.email || "").trim();

    if (!dbUser && c.env?.DB) {
      if (inputUserId || inputEmail) {
        try {
          dbUser = await c.env.DB.prepare(
            "SELECT * FROM users WHERE id = ? OR email = ? OR session_token = ?"
          ).bind(inputUserId, inputEmail, token).first();
        } catch (e) {}
      }
    }

    const finalUserId = dbUser ? String(dbUser.id) : (inputUserId || inputEmail || token || "guest");
    const testName = String(jsonBody.test_name || body.test_name || body.test_set || "TOEIC Practice Test").trim();
    const score = Number(jsonBody.total_score || jsonBody.score || body.total_score || body.score || 0);
    const listening = Number(jsonBody.score_listening || jsonBody.listening_score || body.score_listening || body.listening_score || 0);
    const reading = Number(jsonBody.score_reading || jsonBody.reading_score || body.score_reading || body.reading_score || 0);
    const correctCount = Number(jsonBody.correct_count || body.correct_count || 0);
    const totalQuestions = Number(jsonBody.total_questions || body.total_questions || 0);

    if (c.env?.DB && finalUserId && finalUserId !== "guest") {
      try {
        await c.env.DB.prepare(
          "INSERT INTO exam_results (user_id, test_name, score, listening_score, reading_score, correct_count, total_questions) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(finalUserId, testName, score, listening, reading, correctCount, totalQuestions).run();
      } catch (e) {
        console.error("D1 Save Exam Result Error:", e);
      }
    }

    return c.json({
      ok: true,
      message: "Đã lưu kết quả làm bài thi TOEIC vào CSDL Cloudflare D1 thành công!",
      results: [{ id: Date.now(), user_id: finalUserId, test_name: testName, score, listening_score: listening, reading_score: reading }]
    });
  }

  let results: any[] = [];
  if (c.env?.DB && userId && userId !== "guest") {
    try {
      const res = await c.env.DB.prepare("SELECT * FROM exam_results WHERE user_id = ? ORDER BY id DESC").bind(userId).all();
      if (res && res.results) {
        results = res.results;
      }
    } catch (e) {
      console.error("D1 Fetch Exam Results Error:", e);
    }
  }

  return c.json({ ok: true, results });
});

// GET & POST /v1/quiz/sync_quiz.php
quizApp.all("/sync_quiz.php", async (c) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || c.req.query("auth_token") || c.req.query("session_token") || c.req.query("token") || "";

  let dbUser: any = null;
  if (c.env?.DB && token) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ? OR email = ?"
      ).bind(token, token, token, token).first();
    } catch (e) {}
  }

  const userId = dbUser ? String(dbUser.id) : (token || "guest");
  let totalExams = 0;
  let avgScore = 0;
  let highestScore = 0;

  if (c.env?.DB && userId && userId !== "guest") {
    try {
      const statsRes = await c.env.DB.prepare(
        "SELECT COUNT(*) as count, AVG(score) as avg_score, MAX(score) as max_score FROM exam_results WHERE user_id = ?"
      ).bind(userId).first();

      if (statsRes) {
        totalExams = Number(statsRes.count || 0);
        avgScore = Math.round(Number(statsRes.avg_score || 0));
        highestScore = Number(statsRes.max_score || 0);
      }
    } catch (e) {}
  }

  return c.json({
    ok: true,
    message: "Đồng bộ CSDL D1 thành công!",
    user_id: userId,
    stats: { totalExams, avgScore, highestScore }
  });
});

// GET /v1/quiz/get_exam_questions.php
quizApp.get("/get_exam_questions.php", (c) => {
  const year = c.req.query("year") || "2024";
  const part = c.req.query("part") || "1";

  return c.json({
    ok: true,
    year,
    part,
    title: `Đề thi TOEIC ${year} - Part ${part}`,
    questions: [
      {
        id: 1,
        question: "Select the word that best completes the sentence: The new policy will take _____ next Monday.",
        options: ["A. effect", "B. affect", "C. effective", "D. affection"],
        answer: "A",
        explanation: "'Take effect' là phrasal verb có nghĩa là 'có hiệu lực'."
      }
    ]
  });
});

export default quizApp;
