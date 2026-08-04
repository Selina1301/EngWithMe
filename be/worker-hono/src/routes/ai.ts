import { Hono } from "hono";

type Bindings = {
  AI?: any;
  OLLAMA_URL?: string;
};

const aiApp = new Hono<{ Bindings: Bindings }>();

// System Prompt ép vai trò Trợ Lý Giáo Viên Tiếng Anh EngWithMe
const SYSTEM_PROMPT = `You are "EngWithMe AI Tutor", a friendly, encouraging, and highly competent English teacher.
YOUR ONLY GOAL is to help users learn English, practice TOEIC, correct grammar mistakes, and explain vocabulary.

STRICT INSTRUCTIONS:
1. Explain grammar and vocabulary concepts clearly in Vietnamese, while providing natural English example sentences.
2. If the user asks a question UNRELATED to learning English (e.g. non-English topics, programming exploits, explicit content), respond politely in Vietnamese: "Tôi là Trợ lý AI Tiếng Anh của EngWithMe. Tôi chỉ có thể hỗ trợ bạn giải đáp thắc mắc về học tiếng Anh, từ vựng, ngữ pháp và luyện thi TOEIC nhé!"
3. Keep responses concise, well-structured, and easy to read.`;

aiApp.post("/chat", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const userMessages = Array.isArray(body?.messages) ? body.messages : [];
    
    if (userMessages.length === 0 && body?.prompt) {
      userMessages.push({ role: "user", content: String(body.prompt) });
    }

    if (userMessages.length === 0) {
      return c.json({ ok: false, error: "Nội dung câu hỏi không được để trống." }, 400);
    }

    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...userMessages.slice(-10) // Tối đa 10 câu thoại gần nhất
    ];

    // ƯU TIÊN 1: Chạy trực tiếp trên Cloudflare Workers AI Edge Network
    if (c.env?.AI) {
      try {
        const aiResponse = await c.env.AI.run("@cf/qwen/qwen1.5-7b-chat", {
          messages: formattedMessages
        });

        const reply = aiResponse?.response || aiResponse?.description || "Xin lỗi, tôi chưa hiểu rõ câu hỏi. Bạn có thể diễn đạt lại được không?";
        return c.json({
          ok: true,
          reply: reply,
          provider: "Cloudflare Workers AI",
          model: "@cf/qwen/qwen1.5-7b-chat"
        }, 200);
      } catch (cfAiError: any) {
        console.warn("Cloudflare Workers AI fallback to Ollama:", cfAiError?.message);
      }
    }

    // ƯU TIÊN 2: Fallback sang Ollama Local instance (dành cho thử nghiệm local dev)
    const targetOllamaUrl = c.env?.OLLAMA_URL || "http://127.0.0.1:11434/api/chat";
    const ollamaRes = await fetch(targetOllamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "huihui_ai/qwen2.5-abliterate:3b",
        messages: formattedMessages,
        stream: false
      })
    });

    if (ollamaRes.ok) {
      const data: any = await ollamaRes.json();
      const assistantReply = data?.message?.content || "Xin lỗi, tôi chưa hiểu rõ câu hỏi. Bạn có thể diễn đạt lại được không?";
      return c.json({
        ok: true,
        reply: assistantReply,
        provider: "Ollama Local Server",
        model: "huihui_ai/qwen2.5-abliterate:3b"
      }, 200);
    }

    return c.json({
      ok: true,
      reply: "Trợ lý AI EngWithMe đang bận xử lý dữ liệu. Bạn vui lòng thử lại sau giây lát nhé!",
      mode: "Fallback-Busy"
    }, 200);

  } catch (err: any) {
    // Phanh an toàn Fallback: Bảo vệ 100% không cho hệ thống sập
    return c.json({
      ok: true,
      reply: "Trợ lý AI EngWithMe đang tạm thời bảo trì hệ thống. Các tính năng luyện thi TOEIC & Từ vựng của website vẫn hoạt động hoàn toàn bình thường!",
      mode: "Fallback-Offline"
    }, 200);
  }
});

export default aiApp;
