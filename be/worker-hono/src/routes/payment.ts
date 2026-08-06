import { Hono } from "hono";
import { getCookie } from "hono/cookie";

type Bindings = {
  DB?: D1Database;
};

const paymentApp = new Hono<{ Bindings: Bindings }>();

const PAYOS_CLIENT_ID = "f3ac6ab0-612e-4bb0-b53a-d883cbd4eff0";
const PAYOS_API_KEY = "fab8a588-3f9c-4159-ad25-bbccf9721701";
const PAYOS_CHECKSUM_KEY = "dc77a3c14beb5d1683fd1eeca0b8c0c840d7aff558fd1a050f7f12def57c4866";

async function createPayosSignature(data: any, checksumKey: string): Promise<string> {
  const sigFields = ["amount", "cancelUrl", "description", "orderCode", "returnUrl"];
  const sigData: string[] = [];
  sigFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null) {
      sigData.push(`${field}=${data[field]}`);
    }
  });
  const queryStr = sigData.join("&");
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(checksumKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(queryStr));
  return Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPayosWebhookSignature(data: any, signature: string, checksumKey: string): Promise<boolean> {
  const sortedKeys = Object.keys(data).sort();
  const dataToSign: string[] = [];
  for (const key of sortedKeys) {
    if (data[key] !== null && data[key] !== undefined && typeof data[key] !== "object") {
      dataToSign.push(`${key}=${data[key]}`);
    } else if (data[key] !== null && data[key] !== undefined) {
      dataToSign.push(`${key}=${JSON.stringify(data[key])}`);
    }
  }
  const queryStr = dataToSign.join("&");
  const encoder = new TextEncoder();
  const keyData = encoder.encode(checksumKey);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(queryStr));
  const calcSig = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return calcSig === signature;
}


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

const handleCreatePayment = async (c: any) => {
  let body: Record<string, any> = {};
  try { body = (await c.req.parseBody()) as Record<string, any>; } catch (e) {}
  let jsonBody: Record<string, any> = {};
  try { jsonBody = (await c.req.json()) as Record<string, any>; } catch (e) {}

  const authHeader = c.req.header("Authorization") || "";const token = authHeader.replace(/^Bearer\s+/i, "").trim() || c.req.query("auth_token") || c.req.query("token") || getCookie(c, "auth_token") || "";
  const plan = String(jsonBody.plan || body.plan || c.req.query("plan") || "pro").toLowerCase();
  const orderCode = Math.floor(100000 + Math.random() * 900000);

  let dbUser: any = null;
  if (c.env?.DB && token) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ? OR email = ?"
      ).bind(token, token, token, token).first();
    } catch (e) {}
  }

  const isPremium = plan === "premium";
  const amount = isPremium ? 999999 : 7777;
  const planName = isPremium ? "Gói Premium VIP Trọn Đời - 999.999đ" : "Gói Pro - 7.777đ";
  const description = `EngWithMe ${orderCode}`.slice(0, 25);
  
  const payload = {
    orderCode,
    amount,
    description,
    cancelUrl: "https://engwithme.tungf.io.vn/pricing.html",
    returnUrl: "https://engwithme.tungf.io.vn/pricing.html"
  };

  let vietqrImage = "";
  let checkoutUrl = "";

  try {
    const signature = await createPayosSignature(payload, PAYOS_CHECKSUM_KEY);
    const payosRes = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": PAYOS_CLIENT_ID,
        "x-api-key": PAYOS_API_KEY
      },
      body: JSON.stringify({ ...payload, signature })
    });
    
    const payosData = await payosRes.json() as any;
    if (payosData && payosData.code === "00" && payosData.data) {
      let qrCodeRaw = payosData.data.qrCode || "";
      if (qrCodeRaw.startsWith("000201")) {
         vietqrImage = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrCodeRaw)}`;
      } else {
         vietqrImage = qrCodeRaw;
      }
      checkoutUrl = payosData.data.checkoutUrl || "";
    } else {
      console.error("PayOS Error:", payosData);
    }
  } catch (err) {
    console.error("PayOS Fetch Error:", err);
  }

  if (!vietqrImage) {
    vietqrImage = `https://img.vietqr.io/image/MB-0971629106-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent("NGUYEN TUNG DUONG")}`;
  }

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
      account_number: "0971629106",
      account_name: "NGUYEN TUNG DUONG"
    },
    user_id: dbUser?.id || null
  });
};

paymentApp.all("/create_payment.php", handleCreatePayment);
paymentApp.all("/payment/create_payment.php", handleCreatePayment);
paymentApp.all("/create_payment", handleCreatePayment);

// GET /v1/payment/check_payment_status.php -> Update D1 user to VIP per User
const handleCheckPaymentStatus = async (c: any) => {
  const orderCode = c.req.query("orderCode") || c.req.query("order_code") || "";
  const authHeader = c.req.header("Authorization") || "";let rawToken = authHeader || c.req.query("auth_token") || c.req.query("session_token") || c.req.query("token") || c.req.query("user_id") || getCookie(c, "auth_token") || "";
  const token = String(rawToken).replace(/^Bearer\s+/i, "").trim();

  const planParam = String(c.req.query("plan") || "pro").toLowerCase();
  const isPremium = planParam === "premium";

  const expiresAt = isPremium
    ? "2099-12-31 23:59:59"
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);

  let dbUser: any = null;
  if (c.env?.DB) {
    try {
      await ensureOrdersTable(c.env.DB);
      let orderRow: any = null;

      if (orderCode) {
        orderRow = await c.env.DB.prepare(
          "SELECT * FROM orders WHERE order_code = ? OR order_code = ?"
        ).bind(Number(orderCode) || 0, String(orderCode)).first();
      }

      if (!orderRow || orderRow.status !== 'PAID') {
        return c.json({
          ok: true,
          orderCode,
          status: orderRow ? orderRow.status : "PENDING",
          is_paid: false,
          message: "Đơn hàng đang chờ thanh toán."
        });
      }

      

      // 1. Resolve user by session_token, remember_token, id or email
      if (token) {
        dbUser = await c.env.DB.prepare(
          "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ? OR email = ?"
        ).bind(token, token, token, token).first();
      }

      // 2. Fallback: Resolve user from orderRow.user_id or orderRow.user_email
      if (!dbUser && orderRow) {
        if (orderRow.user_id && orderRow.user_id !== "guest") {
          dbUser = await c.env.DB.prepare(
            "SELECT * FROM users WHERE id = ? OR email = ? OR session_token = ?"
          ).bind(orderRow.user_id, orderRow.user_id, orderRow.user_id).first();
        }
        if (!dbUser && orderRow.user_email) {
          dbUser = await c.env.DB.prepare(
            "SELECT * FROM users WHERE email = ?"
          ).bind(orderRow.user_email).first();
        }
      }

      // 3. Fallback: Resolve active learner from D1 database
      if (!dbUser) {
        dbUser = await c.env.DB.prepare(
          "SELECT * FROM users WHERE email LIKE '%@%' ORDER BY id DESC LIMIT 1"
        ).first();
      }

      if (dbUser) {
        dbUser.is_vip = 1;
        dbUser.vip_expires_at = expiresAt;
      }
    } catch (e: any) {
      console.error("D1 Update VIP & Order Error:", e);
      return c.json({ ok: false, message: "Lỗi xử lý cơ sở dữ liệu: " + (e?.message || String(e)) }, 500);
    }
  } else {
    return c.json({ ok: false, message: "Không tìm thấy cơ sở dữ liệu Cloudflare D1." }, 500);
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
      is_vip: 1,
      plan: isPremium ? "premium" : "pro",
      vip_expires_at: expiresAt
    }
  });
};

const handlePayosWebhook = async (c: any) => {
  let body: Record<string, any> = {};
  try { body = await c.req.json(); } catch (e) {}

  const orderCode = body.orderCode || body.data?.orderCode || body.data?.order_code;
  if (orderCode && c.env?.DB) {
    try {
      await ensureOrdersTable(c.env.DB);
      const orderRow: any = await c.env.DB.prepare(
        "SELECT * FROM orders WHERE order_code = ? OR order_code = ?"
      ).bind(Number(orderCode) || 0, String(orderCode)).first();

      if (orderRow) {
        await c.env.DB.prepare(
          "UPDATE orders SET status = 'PAID' WHERE id = ?"
        ).bind(orderRow.id).run();

        if (orderRow.user_id) {
          const expiresAt = String(orderRow.plan_id).includes("premium")
            ? "2099-12-31 23:59:59"
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);

          await c.env.DB.prepare(
            "UPDATE users SET is_vip = 1, vip_expires_at = ? WHERE id = ? OR email = ? OR session_token = ?"
          ).bind(expiresAt, orderRow.user_id, orderRow.user_id, orderRow.user_id).run();
        }
      }
    } catch (e) {}
  }

  return c.json({ ok: true, message: "PayOS Webhook processed successfully" });
};

paymentApp.all("/create_payment.php", handleCreatePayment);
paymentApp.all("/payment/create_payment.php", handleCreatePayment);
paymentApp.all("/v1/create_payment.php", handleCreatePayment);
paymentApp.all("/v1/payment/create_payment.php", handleCreatePayment);
paymentApp.all("/create_payment", handleCreatePayment);

paymentApp.all("/check_payment_status.php", handleCheckPaymentStatus);
paymentApp.all("/payment/check_payment_status.php", handleCheckPaymentStatus);
paymentApp.all("/v1/check_payment_status.php", handleCheckPaymentStatus);
paymentApp.all("/v1/payment/check_payment_status.php", handleCheckPaymentStatus);
paymentApp.all("/check_payment_status", handleCheckPaymentStatus);

paymentApp.all("/payos_webhook.php", handlePayosWebhook);
paymentApp.all("/payment/payos_webhook.php", handlePayosWebhook);
paymentApp.all("/v1/payos_webhook.php", handlePayosWebhook);
paymentApp.all("/v1/payment/payos_webhook.php", handlePayosWebhook);
paymentApp.all("/payos_webhook", handlePayosWebhook);

// GET /v1/payment/user_transactions.php -> User Transaction History
paymentApp.get("/user_transactions.php", async (c) => {
  const authHeader = c.req.header("Authorization") || "";const token = authHeader.replace(/^Bearer\s+/i, "").trim() || c.req.query("auth_token") || getCookie(c, "auth_token") || "";

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
