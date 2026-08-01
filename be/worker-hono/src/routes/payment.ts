import { Hono } from "hono";

type Bindings = {
  DB?: D1Database;
};

const paymentApp = new Hono<{ Bindings: Bindings }>();

// Helper to ensure D1 orders table exists
const ensureOrdersTable = async (db: D1Database) => {
  try {
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code INTEGER UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        user_email TEXT,
        plan_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'PENDING',
        payment_link_id TEXT,
        qr_code TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    ).run();
  } catch (e) {}
};

// POST /v1/payment/create_payment.php
paymentApp.post("/create_payment.php", async (c) => {
  let body: Record<string, any> = {};
  try { body = (await c.req.parseBody()) as Record<string, any>; } catch (e) {}
  let jsonBody: Record<string, any> = {};
  try { jsonBody = (await c.req.json()) as Record<string, any>; } catch (e) {}

  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || c.req.query("auth_token") || c.req.query("token") || "";
  const plan = String(jsonBody.plan || body.plan || c.req.query("plan") || "pro").toLowerCase();
  const orderCode = Math.floor(100000 + Math.random() * 900000);

  let dbUser: any = null;
  if (c.env?.DB && token) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ?"
      ).bind(token, token, token).first();
    } catch (e) {}
  }

  const isPremium = plan === "premium";
  const amount = isPremium ? 999999 : 7777;
  const planName = isPremium ? "Gói Premium VIP Trọn Đời - 999.999đ" : "Gói Pro - 7.777đ";
  const description = `EngWithMe ${plan.toUpperCase()} ${orderCode}`.slice(0, 25);
  
  const bankShort = "MB";
  const accountNumber = "0971629106";
  const accountName = "NGUYEN TUNG DUONG";
  const vietqrImage = `https://img.vietqr.io/image/${bankShort}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;

  if (c.env?.DB) {
    try {
      await ensureOrdersTable(c.env.DB);
      const userIdStr = dbUser?.id ? String(dbUser.id) : (token || "guest");
      const userEmailStr = dbUser?.email || jsonBody.email || body.email || "";
      await c.env.DB.prepare(
        `INSERT INTO orders (order_code, user_id, user_email, plan_id, amount, status, qr_code, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'PENDING', ?, datetime('now'), datetime('now'))`
      ).bind(orderCode, userIdStr, userEmailStr, plan, amount, vietqrImage).run();
    } catch (e) {
      console.error("D1 Insert Order Error:", e);
    }
  }

  return c.json({
    ok: true,
    orderCode: orderCode,
    amount: amount,
    amount_formatted: `${amount.toLocaleString("vi-VN")}đ`,
    plan_name: planName,
    description: description,
    checkout_url: vietqrImage,
    qr_code: vietqrImage,
    vietqr_img: vietqrImage,
    bank_info: {
      bank_name: "MBBank (Ngân Hàng Quân Đội)",
      account_number: accountNumber,
      account_name: accountName
    },
    user_id: dbUser?.id || null
  });
});

// GET /v1/payment/check_payment_status.php -> Update D1 user to VIP per User
paymentApp.get("/check_payment_status.php", async (c) => {
  const orderCode = c.req.query("orderCode") || c.req.query("order_code") || "";
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || c.req.query("auth_token") || c.req.query("session_token") || c.req.query("token") || c.req.query("user_id") || "";
  const planParam = String(c.req.query("plan") || "pro").toLowerCase();
  const isPremium = planParam === "premium";

  const expiresAt = isPremium
    ? "2099-12-31 23:59:59"
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);

  let dbUser: any = null;
  if (c.env?.DB) {
    try {
      await ensureOrdersTable(c.env.DB);
      if (orderCode) {
        await c.env.DB.prepare(
          "UPDATE orders SET status = 'PAID', updated_at = datetime('now') WHERE order_code = ?"
        ).bind(Number(orderCode)).run();
      }

      if (token) {
        dbUser = await c.env.DB.prepare(
          "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ? OR email = ?"
        ).bind(token, token, token, token).first();

        if (dbUser) {
          await c.env.DB.prepare(
            "UPDATE users SET is_vip = 1, vip_expires_at = ? WHERE id = ?"
          ).bind(expiresAt, dbUser.id).run();

          dbUser.is_vip = 1;
          dbUser.vip_expires_at = expiresAt;
        }
      }
    } catch (e) {
      console.error("D1 Update VIP & Order Error:", e);
    }
  }

  if (!dbUser) {
    return c.json({ ok: false, message: "Không tìm thấy tài khoản người dùng để nâng cấp VIP." }, 401);
  }

  const successMessage = isPremium
    ? "Thanh toán thành công! Tài khoản của bạn đã được nâng cấp VIP Premium Trọn Đời 👑."
    : "Thanh toán thành công! Tài khoản của bạn đã được kích hoạt gói VIP Pro (30 ngày) ⚡.";

  return c.json({
    ok: true,
    orderCode,
    status: "PAID",
    is_paid: true,
    message: successMessage,
    user: {
      id: String(dbUser.id),
      name: String(dbUser.full_name || "Học viên"),
      email: String(dbUser.email || ""),
      role: String(dbUser.role || "user"),
      level: String(dbUser.level || "A1"),
      is_vip: "1",
      plan: isPremium ? "premium" : "pro",
      vip_expires_at: expiresAt
    }
  });
});

// GET /v1/payment/user_transactions.php -> User Transaction History
paymentApp.get("/user_transactions.php", async (c) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || c.req.query("auth_token") || "";

  const bankShort = "MB";
  const accountNumber = "0971629106";
  const accountName = "NGUYEN TUNG DUONG";

  let orders: any[] = [];
  if (c.env?.DB && token) {
    try {
      await ensureOrdersTable(c.env.DB);
      const dbUser: any = await c.env.DB.prepare(
        "SELECT id, email FROM users WHERE session_token = ? OR remember_token = ? OR id = ?"
      ).bind(token, token, token).first();

      if (dbUser) {
        const rows: any = await c.env.DB.prepare(
          "SELECT * FROM orders WHERE user_id = ? OR user_email = ? ORDER BY id DESC LIMIT 50"
        ).bind(String(dbUser.id), String(dbUser.email || "")).all();
        
        if (rows && rows.results) {
          orders = rows.results.map((ord: any) => ({
            id: ord.id,
            order_code: ord.order_code,
            plan_id: ord.plan_id,
            plan_name: String(ord.plan_id).includes("premium") ? "Gói Premium VIP Trọn Đời" : "Gói Pro - 7.777đ",
            amount: ord.amount,
            amount_formatted: `${Number(ord.amount).toLocaleString("vi-VN")}đ`,
            status: String(ord.status || "PENDING").toUpperCase(),
            created_at: ord.created_at,
            description: `EngWithMe ${ord.order_code}`,
            bank_info: {
              bank_name: "MBBank (Ngân Hàng Quân Đội)",
              account_number: accountNumber,
              account_name: accountName
            },
            qr_code: ord.qr_code
          }));
        }
      }
    } catch (e) {
      console.error("D1 Transactions Query Error:", e);
    }
  }

  return c.json({
    ok: true,
    orders: orders
  });
});

export default paymentApp;
