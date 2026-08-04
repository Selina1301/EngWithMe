import { Hono } from "hono";

type Bindings = {
  GROQ_API_KEY?: string;
  AI?: any;
  OLLAMA_URL?: string;
};

const aiApp = new Hono<{ Bindings: Bindings }>();

// System Prompt ép vai trò Trợ Lý Giáo Viên Tiếng Anh EngWithMe
const SYSTEM_PROMPT = `You are "EngWithMe AI Tutor", a friendly, encouraging, and highly competent English teacher.
YOUR ONLY GOAL is to help users learn English, practice TOEIC, correct grammar mistakes, and explain vocabulary.

STRICT INSTRUCTIONS:
1. Explain grammar and vocabulary concepts clearly in Vietnamese, while providing natural English example sentences.
2. If the user asks a question UNRELATED to learning English, respond politely in Vietnamese: "Tôi là Trợ lý AI Tiếng Anh của EngWithMe. Tôi chỉ có thể hỗ trợ bạn giải đáp thắc mắc về học tiếng Anh, từ vựng, ngữ pháp và luyện thi TOEIC nhé!"
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

    const groqKey = c.env?.GROQ_API_KEY || "";

    // ƯU TIÊN 1: Gọi sang Groq Cloud AI API (Siêu tốc 0.3s, Siêu thông minh 100% Free Quota)
    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: formattedMessages,
            temperature: 0.6,
            max_tokens: 1024
          })
        });

        if (groqRes.ok) {
          const groqData: any = await groqRes.json();
          const reply = groqData?.choices?.[0]?.message?.content;
          if (reply) {
            return c.json({
              ok: true,
              reply: reply,
              provider: "Groq Cloud LPU AI",
              model: "llama-3.1-8b-instant"
            }, 200);
          }
        }
      } catch (groqErr: any) {
        console.warn("Groq API error fallback:", groqErr?.message);
      }
    }

    // ƯU TIÊN 2: Chạy trực tiếp trên Cloudflare Workers AI Edge Network
    if (c.env?.AI) {
      const models = [
        "@cf/qwen/qwen1.5-7b-chat",
        "@cf/meta/llama-3-8b-instruct",
        "@cf/qwen/qwen1.5-0.5b-chat"
      ];

      for (const modelName of models) {
        try {
          const aiResponse = await c.env.AI.run(modelName, {
            messages: formattedMessages
          });

          const reply = aiResponse?.response || aiResponse?.description || (typeof aiResponse === "string" ? aiResponse : null);
          if (reply) {
            return c.json({
              ok: true,
              reply: reply,
              provider: "Cloudflare Workers AI Cloud",
              model: modelName
            }, 200);
          }
        } catch (modelErr: any) {
          console.warn(`Cloudflare Workers AI model ${modelName} failed:`, modelErr?.message || modelErr);
        }
      }
    }

    // ƯU TIÊN 3: Fallback sang Ollama Local
    const targetTunnelUrl = c.env?.OLLAMA_URL || "http://127.0.0.1:11434/api/chat";
    try {
      const ollamaRes = await fetch(targetTunnelUrl, {
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
        const reply = data?.message?.content || data?.reply;
        if (reply) {
          return c.json({
            ok: true,
            reply: reply,
            provider: "GPU Local via Ollama",
            model: "huihui_ai/qwen2.5-abliterate:3b"
          }, 200);
        }
      }
    } catch (tunnelErr) {
      // Tunnel offline
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
