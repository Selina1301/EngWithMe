import { Hono } from "hono";
import { cors } from "hono/cors";
import learningApp from "./routes/learning";
import blogApp from "./routes/blog";
import authApp from "./routes/auth";
import userApp from "./routes/user";
import notificationApp from "./routes/notification";
import quizApp from "./routes/quiz";
import adminApp from "./routes/admin";
import paymentApp from "./routes/payment";

type Bindings = {
  PHP_FALLBACK_URL?: string;
  GOOGLE_REDIRECT_URI?: string;
  DB?: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Global Edge CORS Middleware
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Auth-Token"],
    credentials: true,
  })
);

// Health check endpoints
app.get("/", (c) => {
  return c.json({
    status: "online",
    engine: "Cloudflare-Worker-Hono-v4",
    message: "EngWithMe Native Edge API is running live at 300+ Edge locations globally!",
  });
});

app.get("/v1/health", (c) => {
  return c.json({
    status: "online",
    engine: "Cloudflare-Worker-Hono-v4",
    message: "EngWithMe Native Edge API Health OK",
  });
});

// Native Edge API Routes (0ms Cold Start)
app.route("/v1/learning", learningApp);
app.route("/v1/blog", blogApp);
app.route("/v1/auth", authApp);
app.route("/v1/user", userApp);
app.route("/v1/notification", notificationApp);
app.route("/v1/quiz", quizApp);
app.route("/v1/admin", adminApp);
app.route("/v1/payment", paymentApp);

// Helper to forward top-level legacy route aliases (/v1/login.php) to sub-apps (/v1/auth/login.php)
const forwardTo = (subApp: any, prefix: string) => async (c: any) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace("/v1/", `/v1/${prefix}/`);
  const isPost = c.req.method !== "GET" && c.req.method !== "HEAD";
  const reqInit: any = {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: isPost ? c.req.raw.clone().body : null,
    duplex: "half"
  };
  const newReq = new Request(url.toString(), reqInit);
  return subApp.fetch(newReq, c.env, c.executionCtx);
};

// Direct Top-Level Route Aliases for Legacy Compatibility (Catches all relative fetch calls)
app.all("/v1/google_callback.php", forwardTo(authApp, "auth"));
app.all("/v1/google_login.php", forwardTo(authApp, "auth"));
app.all("/v1/login.php", forwardTo(authApp, "auth"));
app.all("/v1/register.php", forwardTo(authApp, "auth"));
app.all("/v1/logout.php", forwardTo(authApp, "auth"));
app.all("/v1/verify_otp.php", forwardTo(authApp, "auth"));
app.all("/v1/resend_otp.php", forwardTo(authApp, "auth"));
app.all("/v1/forgot_password.php", forwardTo(authApp, "auth"));
app.all("/v1/reset_password.php", forwardTo(authApp, "auth"));

app.all("/v1/me.php", forwardTo(userApp, "user"));
app.all("/v1/profile.php", forwardTo(userApp, "user"));
app.all("/v1/change_password.php", forwardTo(userApp, "user"));

app.all("/v1/admin_users.php", forwardTo(adminApp, "admin"));
app.all("/v1/admin_reports.php", forwardTo(adminApp, "admin"));
app.all("/v1/broadcast_notification.php", forwardTo(adminApp, "admin"));
app.all("/v1/admin/broadcast_notification.php", forwardTo(adminApp, "admin"));
app.all("/v1/student_feedbacks.php", forwardTo(adminApp, "admin"));
app.all("/v1/admin/student_feedbacks.php", forwardTo(adminApp, "admin"));
app.all("/v1/payments.php", (c) => adminApp.fetch(c.req.raw, c.env, c.executionCtx));
app.all("/v1/admin/payments.php", (c) => adminApp.fetch(c.req.raw, c.env, c.executionCtx));
app.all("/v1/update_order_status.php", (c) => adminApp.fetch(c.req.raw, c.env, c.executionCtx));
app.all("/v1/admin/update_order_status.php", (c) => adminApp.fetch(c.req.raw, c.env, c.executionCtx));
app.all("/v1/clear_test_orders.php", (c) => adminApp.fetch(c.req.raw, c.env, c.executionCtx));
app.all("/v1/admin/clear_test_orders.php", (c) => adminApp.fetch(c.req.raw, c.env, c.executionCtx));

app.all("/v1/learning_content.php", (c) => learningApp.fetch(c.req.raw, c.env, c.executionCtx));
app.all("/v1/sync_progress.php", (c) => learningApp.fetch(c.req.raw, c.env, c.executionCtx));
app.all("/v1/sync_vocab.php", (c) => learningApp.fetch(c.req.raw, c.env, c.executionCtx));
app.all("/v1/sync_grammar.php", (c) => learningApp.fetch(c.req.raw, c.env, c.executionCtx));
app.all("/v1/user_level.php", (c) => learningApp.fetch(c.req.raw, c.env, c.executionCtx));
app.all("/v1/send_contact.php", (c) => learningApp.fetch(c.req.raw, c.env, c.executionCtx));

app.all("/v1/test_results.php", forwardTo(quizApp, "quiz"));
app.all("/v1/sync_quiz.php", forwardTo(quizApp, "quiz"));
app.all("/v1/get_exam_questions.php", forwardTo(quizApp, "quiz"));

app.all("/v1/get_blogs.php", forwardTo(blogApp, "blog"));
app.all("/v1/submit_blog.php", forwardTo(blogApp, "blog"));
app.all("/v1/toggle_blog_like.php", forwardTo(blogApp, "blog"));
app.all("/v1/increment_blog_view.php", forwardTo(blogApp, "blog"));
app.all("/v1/get_pending_blogs.php", forwardTo(blogApp, "blog"));
app.all("/v1/approve_blog.php", forwardTo(blogApp, "blog"));
app.all("/v1/get_leaderboard.php", forwardTo(blogApp, "blog"));

app.all("/v1/notifications.php", forwardTo(notificationApp, "notification"));
app.all("/v1/notification/notifications.php", forwardTo(notificationApp, "notification"));
app.all("/v1/notifications", forwardTo(notificationApp, "notification"));

app.all("/v1/create_payment.php", (c) => paymentApp.fetch(c.req.raw, c.env, c.executionCtx));
app.all("/v1/check_payment_status.php", (c) => paymentApp.fetch(c.req.raw, c.env, c.executionCtx));

// Proxy fallback for stateful PHP endpoints
app.all("/v1/*", async (c) => {
  const fallbackBase = c.env?.PHP_FALLBACK_URL || "https://engwithme-dev.tungf.io.vn/be/api";
  const url = new URL(c.req.url);
  const targetUrl = `${fallbackBase}${url.pathname.replace(/^\/v1/, "")}${url.search}`;

  try {
    const forwardHeaders = new Headers(c.req.raw.headers);
    forwardHeaders.delete("host");

    const reqInit: RequestInit = {
      method: c.req.method,
      headers: forwardHeaders
    };

    if (!["GET", "HEAD"].includes(c.req.method)) {
      reqInit.body = await c.req.raw.arrayBuffer();
    }

    const res = await fetch(targetUrl, reqInit);

    return new Response(res.body, {
      status: res.status,
      headers: res.headers
    });
  } catch (err: any) {
    return c.json({
      ok: false,
      mode: "Edge-Fallback",
      message: "Origin PHP Server offline",
      endpoint: url.pathname,
      error: err?.message || "Origin PHP Server offline"
    }, 200);
  }
});

export default app;
