import { Hono } from "hono";

type Bindings = {
  DB?: D1Database;
};

const userApp = new Hono<{ Bindings: Bindings }>();

const handleMe = async (c: any) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim() || c.req.query("auth_token") || "";

  if (!token) {
    return c.json({ ok: false, user: null, guest: true, message: "Chưa đăng nhập." }, 200);
  }

  let dbUser: any = null;
  if (c.env?.DB) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ?"
      ).bind(token, token, token).first();
    } catch (e) {
      console.error("D1 me Error:", e);
    }
  }

  // Strictly reject deleted or locked users!
  if (!dbUser || dbUser.status === "locked") {
    return c.json({
      ok: false,
      user: null,
      message: dbUser?.status === "locked" ? "Tài khoản của bạn đã bị khóa bởi Admin." : "Tài khoản không tồn tại hoặc đã bị xóa."
    }, 401);
  }

  const isGoogle = String(dbUser.id || "").startsWith("google_") || String(dbUser.session_token || "").startsWith("google_token_") || String(dbUser.auth_provider || "") === "google";
  const passVal = String(dbUser.password || dbUser.password_hash || "").trim();
  const hasPassword = Boolean(passVal.length > 0);

  return c.json({
    ok: true,
    user: {
      id: String(dbUser.id),
      name: String(dbUser.full_name || "Học viên"),
      full_name: String(dbUser.full_name || "Học viên"),
      email: String(dbUser.email || ""),
      role: String(dbUser.role || "user"),
      level: String(dbUser.level || "A1"),
      goal: String(dbUser.learning_goal || "Giao tiếp hàng ngày"),
      learning_goal: String(dbUser.learning_goal || "Giao tiếp hàng ngày"),
      status: String(dbUser.status || "active"),
      avatar: String(dbUser.avatar || ""),
      is_vip: String(dbUser.is_vip || 0),
      vip_expires_at: dbUser.vip_expires_at || null,
      auth_provider: isGoogle ? "google" : "email",
      is_google: isGoogle ? 1 : 0,
      has_password: hasPassword ? 1 : 0,
      session_token: token
    }
  }, 200);
};

userApp.get("/me.php", handleMe);
userApp.get("/me", handleMe);

const handleProfile = async (c: any) => {
  const body = (await c.req.parseBody().catch(() => ({}))) as Record<string, any>;
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim() || c.req.query("auth_token") || "";

  const name = String(body.full_name || body.name || "").trim();
  const goal = String(body.learning_goal || body.goal || "").trim();
  const level = String(body.level || "").trim();

  let dbUser: any = null;
  if (c.env?.DB && token) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ?"
      ).bind(token, token, token).first();

      if (dbUser) {
        const newName = name || dbUser.full_name || "Học viên";
        const newGoal = goal || dbUser.learning_goal || "Giao tiếp hàng ngày";
        const newLevel = level || dbUser.level || "A1";

        await c.env.DB.prepare(
          "UPDATE users SET full_name = ?, level = ?, learning_goal = ? WHERE id = ?"
        ).bind(newName, newLevel, newGoal, dbUser.id).run();

        dbUser.full_name = newName;
        dbUser.level = newLevel;
        dbUser.learning_goal = newGoal;
      }
    } catch (e) {
      console.error("D1 profile update Error:", e);
    }
  }

  if (!dbUser) {
    return c.json({ ok: false, message: "Phiên làm việc hết hạn hoặc không tìm thấy tài khoản." }, 401);
  }

  const hasPassword = Boolean(dbUser.password && String(dbUser.password).trim() !== "");

  return c.json({
    ok: true,
    message: "Đã lưu hồ sơ cá nhân thành công!",
    user: {
      id: String(dbUser.id),
      name: String(dbUser.full_name || "Học viên"),
      full_name: String(dbUser.full_name || "Học viên"),
      email: String(dbUser.email || ""),
      role: String(dbUser.role || "user"),
      level: String(dbUser.level || "A1"),
      goal: String(dbUser.learning_goal || "Giao tiếp hàng ngày"),
      learning_goal: String(dbUser.learning_goal || "Giao tiếp hàng ngày"),
      status: String(dbUser.status || "active"),
      avatar: String(dbUser.avatar || ""),
      is_vip: String(dbUser.is_vip || 0),
      vip_expires_at: dbUser.vip_expires_at || null,
      has_password: hasPassword ? 1 : 0
    }
  });
};

userApp.post("/profile.php", handleProfile);
userApp.post("/profile", handleProfile);

const handleChangePassword = async (c: any) => {
  let body: Record<string, any> = {};
  let jsonBody: Record<string, any> = {};
  const contentType = c.req.header("content-type") || "";
  if (contentType.includes("application/json")) {
    try { jsonBody = await c.req.json(); } catch (e) {}
  } else {
    try { body = (await c.req.parseBody().catch(() => ({}))) as Record<string, any>; } catch (e) {}
  }

  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim() || c.req.query("auth_token") || body.auth_token || jsonBody.auth_token || "";

  const currentPassword = String(body.current_password || jsonBody.current_password || "").trim();
  const newPassword = String(body.new_password || jsonBody.new_password || "").trim();
  const confirmPassword = String(body.confirm_password || jsonBody.confirm_password || "").trim();

  if (!token) {
    return c.json({ ok: false, message: "Vui lòng đăng nhập để đổi mật khẩu." }, 401);
  }

  if (!newPassword || newPassword.length < 6) {
    return c.json({ ok: false, message: "Mật khẩu mới phải có tối thiểu 6 ký tự." }, 400);
  }

  if (newPassword !== confirmPassword) {
    return c.json({ ok: false, message: "Mật khẩu xác nhận không khớp." }, 400);
  }

  let dbUser: any = null;
  if (c.env?.DB) {
    try {
      dbUser = await c.env.DB.prepare(
        "SELECT * FROM users WHERE session_token = ? OR remember_token = ? OR id = ? OR email = ?"
      ).bind(token, token, token, token).first();
    } catch (e) {}
  }

  if (!dbUser) {
    return c.json({ ok: false, message: "Tài khoản không tồn tại hoặc phiên làm việc hết hạn." }, 401);
  }

  const existingPassword = String(dbUser.password || dbUser.password_hash || "").trim();
  const userHadPassword = existingPassword.length > 0;

  if (userHadPassword) {
    if (!currentPassword) {
      return c.json({ ok: false, has_password: 1, message: "Tài khoản này đã có mật khẩu. Vui lòng nhập Mật khẩu hiện tại để đổi mật khẩu!" }, 400);
    }
    if (currentPassword !== existingPassword) {
      return c.json({ ok: false, has_password: 1, message: "Mật khẩu hiện tại không chính xác." }, 400);
    }
  }

  if (c.env?.DB) {
    let updateSuccess = false;
    const targetId = String(dbUser.id || "");
    const targetEmail = String(dbUser.email || "");
    const passStr = String(newPassword || "").trim();

    try {
      await c.env.DB.prepare("UPDATE users SET password = ? WHERE id = ? OR email = ?").bind(passStr, targetId, targetEmail).run();
      updateSuccess = true;
    } catch (e1) {}

    try {
      await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ? OR email = ?").bind(passStr, targetId, targetEmail).run();
      updateSuccess = true;
    } catch (e2) {}

    if (!updateSuccess) {
      return c.json({ ok: false, message: "Lỗi cập nhật CSDL." }, 500);
    }
  }

  const msg = userHadPassword
    ? "🔑 Đã cập nhật mật khẩu mới thành công!"
    : "🎉 Đã tạo mật khẩu thành công cho tài khoản Google! Bây giờ bạn có thể dùng Email & Mật khẩu này để đăng nhập.";

  return c.json({ ok: true, has_password: 1, message: msg });
};

userApp.post("/change_password.php", handleChangePassword);
userApp.post("/change-password", handleChangePassword);

export default userApp;
