document.addEventListener("DOMContentLoaded", () => {
  initPricingPage();
});

let currentPollingInterval = null;

function initPricingPage() {
  const buyBtns = document.querySelectorAll("[data-buy-plan]");
  const modal = document.getElementById("payos-modal");
  const modalCloseBtn = document.getElementById("payos-modal-close");

  buyBtns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const plan = btn.getAttribute("data-buy-plan");
      if (plan === "free") {
        window.location.href = "register.html";
        return;
      }

      // XÁC THỰC LẠI VỚI SERVER API ME.PHP THẬT 100% ĐỂ ĐẢM BẢO KHÔNG BỊ LỖI CACHE SANG TÊN MIỀN KHÁC (SSO TOKEN SYNC)
      let activeUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;

      try {
        const storedToken = localStorage.getItem("engWithMeAuthToken") || "";
        const headers = storedToken ? { "Authorization": `Bearer ${storedToken}` } : {};
        const url = storedToken ? `api/me.php?auth_token=${encodeURIComponent(storedToken)}` : "api/me.php";

        const meRes = await fetch(url, { headers, credentials: "same-origin", cache: "no-store" });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData && meData.ok && meData.user) {
            activeUser = meData.user;
            if (typeof persistAuthUser === "function") persistAuthUser(meData.user);
          } else {
            activeUser = null;
          }
        } else if (meRes.status === 401) {
          activeUser = null;
        }
      } catch (err) {
        console.warn("Could not verify session with me.php:", err);
      }

      // 1. Nếu chưa đăng nhập -> Hiển thị Popup Yêu cầu Đăng nhập và chuyển sang login.html
      if (!activeUser || !activeUser.id) {
        showCustomPricingModal({
          title: "Yêu Cầu Đăng Nhập",
          message: "Vui lòng đăng nhập tài khoản để thực hiện nâng cấp VIP!",
          icon: "🔑",
          buttonText: "🔑 Đăng Nhập Ngay",
          onConfirm: () => { window.location.href = "login.html?redirect=pricing.html"; }
        });
        return;
      }

      // 2. Kiểm tra cảnh báo gói Pro / VIP đang hoạt động trên Frontend
      const isVip = activeUser.is_vip == 1 || activeUser.is_vip === true;
      if (isVip) {
        if (!activeUser.vip_expires_at) {
          showCustomPricingModal({
            title: "Đã Có VIP Trọn Đời",
            message: "👑 Tài khoản của bạn đã sở hữu VIP Elite Trọn Đời! Bạn có toàn quyền sử dụng tất cả các tính năng vĩnh viễn mà không cần đăng ký thêm.",
            icon: "👑",
            buttonText: "Đã Hiểu"
          });
          return;
        } else {
          const expiresDate = new Date(activeUser.vip_expires_at);
          if (expiresDate > new Date()) {
            const formattedDate = expiresDate.toLocaleDateString("vi-VN");
            showCustomPricingModal({
              title: "Gói Pro Đang Hoạt Động",
              message: `⚠️ Tài khoản của bạn hiện đang có gói Pro active (Hạn sử dụng đến ngày ${formattedDate}). Vui lòng đợi hết hạn gói Pro hiện tại rồi hãy đăng ký tiếp nhé!`,
              icon: "⚠️",
              buttonText: "Đã Hiểu"
            });
            return;
          }
        }
      }

      await handleOpenPayment(plan, btn);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", () => {
      closePayosModal();
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closePayosModal();
      }
    });
  }
}

async function handleOpenPayment(plan, btn) {
  const originalText = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = `<span class="ti-reload spin"></span> Đang tạo VietQR PayOS...`;

    const storedToken = localStorage.getItem("engWithMeAuthToken") || "";
    const headers = { "Content-Type": "application/json" };
    if (storedToken) headers["Authorization"] = `Bearer ${storedToken}`;
    const url = storedToken ? `api/create_payment.php?auth_token=${encodeURIComponent(storedToken)}` : "api/create_payment.php";

    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ plan: plan }),
      credentials: "same-origin"
    });

    const result = await res.json();

    if (!res.ok || !result.ok) {
      if (res.status === 401) {
        showCustomPricingModal({
          title: "Yêu Cầu Đăng Nhập",
          message: "Vui lòng đăng nhập tài khoản để thực hiện nâng cấp VIP!",
          icon: "🔑",
          buttonText: "🔑 Đăng Nhập Ngay",
          onConfirm: () => { window.location.href = "login.html?redirect=pricing.html"; }
        });
        return;
      }
      showCustomPricingModal({
        title: "Cảnh Báo Nâng Cấp",
        message: result.message || "Không thể tạo đơn hàng thanh toán.",
        icon: "⚠️",
        buttonText: "Đóng"
      });
      return;
    }

    renderPayosModal(result);

  } catch (err) {
    showCustomPricingModal({
      title: "Lỗi Kết Nối",
      message: "Không thể kết nối máy lưu trữ khi tạo mã QR. Vui lòng thử lại sau.",
      icon: "❌",
      buttonText: "Đóng"
    });
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

function showCustomPricingModal({ title = "Thông Báo", message = "", icon = "⚠️", buttonText = "Đã Hiểu", onConfirm = null }) {
  let modal = document.getElementById("custom-pricing-alert-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "custom-pricing-alert-modal";
    modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 20px;";
    document.body.appendChild(modal);
  }

  const safeTitle = typeof escapeHtml === "function" ? escapeHtml(title) : title;
  const safeMessage = typeof escapeHtml === "function" ? escapeHtml(message) : message;
  const safeBtnText = typeof escapeHtml === "function" ? escapeHtml(buttonText) : buttonText;

  modal.innerHTML = `
    <div style="background: #0f172a; border: 1.5px solid rgba(239, 68, 68, 0.5); border-radius: 20px; max-width: 440px; width: 100%; padding: 28px; text-align: center; box-shadow: 0 20px 50px rgba(239, 68, 68, 0.15), 0 10px 30px rgba(0,0,0,0.8); position: relative; animation: modalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
      <button type="button" class="close-btn" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.08); border: none; color: #94a3b8; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;">✕</button>
      <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.05)); border: 1.5px solid rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px auto; font-size: 2rem; box-shadow: 0 0 20px rgba(239, 68, 68, 0.25);">
        ${icon}
      </div>
      <h3 style="color: #ffffff; font-size: 1.35rem; font-weight: 800; margin: 0 0 10px 0;">${safeTitle}</h3>
      <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">${safeMessage}</p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button type="button" class="confirm-btn btn btn-primary" style="padding: 12px 24px; font-weight: 800; border-radius: 12px; flex: 1; background: linear-gradient(135deg, #ef4444, #dc2626); border: none; color: #ffffff; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4); cursor: pointer;">
          ${safeBtnText}
        </button>
      </div>
    </div>
  `;

  modal.style.display = "flex";

  const closeFn = () => {
    modal.style.display = "none";
    if (typeof onConfirm === "function") onConfirm();
  };

  modal.querySelector(".confirm-btn").onclick = closeFn;
  modal.querySelector(".close-btn").onclick = () => { modal.style.display = "none"; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
}

function renderPayosModal(data) {
  const modal = document.getElementById("payos-modal");
  if (!modal) return;

  const modalBox = modal.querySelector(".payos-modal-box");
  const qrImgUrl = data.qr_code || data.vietqr_img;

  modalBox.innerHTML = `
    <button type="button" class="payos-close-btn" id="payos-modal-close" title="Đóng">✕</button>
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px;">
      <img src="https://payos.vn/wp-content/uploads/2023/07/payos-logo.svg" alt="PayOS" style="height: 24px;" onerror="this.style.display='none'">
      <span style="font-size: 1.1rem; font-weight: 800; color: #ffffff;">Thanh Toán VietQR Tự Động</span>
    </div>

    <div class="qr-frame">
      <img src="${qrImgUrl}" alt="VietQR PayOS">
    </div>

    <div style="font-size: 0.9rem; color: #2ee878; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; justify-content: center;">
      <span class="qr-pulse-dot"></span> Đang chờ hệ thống ngân hàng ghi nhận tiền...
    </div>

    <div class="bank-info-table">
      <div class="bank-info-row">
        <span>Gói đăng ký:</span>
        <strong style="color: #00ff87;">${data.plan_name}</strong>
      </div>
      <div class="bank-info-row">
        <span>Số tiền thanh toán:</span>
        <strong style="font-size: 1.1rem; color: #ffd700;">${data.amount_formatted}</strong>
      </div>
      <div class="bank-info-row">
        <span>Ngân hàng:</span>
        <strong>${data.bank_info.bank_name}</strong>
      </div>
      <div class="bank-info-row">
        <span>Số tài khoản:</span>
        <strong style="font-family: monospace; font-size: 1rem; color: #38bdf8;">${data.bank_info.account_number}</strong>
      </div>
      <div class="bank-info-row">
        <span>Chủ tài khoản:</span>
        <strong>${data.bank_info.account_name}</strong>
      </div>
      <div class="bank-info-row">
        <span>Nội dung CK:</span>
        <strong style="color: #ff7b00; font-family: monospace; font-size: 1.05rem;">${data.description}</strong>
      </div>
    </div>
  `;

  modal.classList.add("active");

  // Bind close btn
  document.getElementById("payos-modal-close")?.addEventListener("click", closePayosModal);

  // Start Real-time Polling every 2 seconds
  startPaymentPolling(data.orderCode, data);
}

function startPaymentPolling(orderCode, data) {
  if (currentPollingInterval) clearInterval(currentPollingInterval);

  currentPollingInterval = setInterval(async () => {
    try {
      const storedToken = localStorage.getItem("engWithMeAuthToken") || "";
      const headers = storedToken ? { "Authorization": `Bearer ${storedToken}` } : {};
      const url = storedToken
        ? `api/check_payment_status.php?orderCode=${orderCode}&auth_token=${encodeURIComponent(storedToken)}`
        : `api/check_payment_status.php?orderCode=${orderCode}`;

      const res = await fetch(url, {
        headers,
        credentials: "same-origin",
        cache: "no-store"
      });
      const result = await res.json();

      if (result.ok && result.is_paid) {
        clearInterval(currentPollingInterval);
        currentPollingInterval = null;

        // Đồng bộ lại dữ liệu học viên mới từ máy chủ me.php ngay lập tức
        try {
          const meUrl = storedToken ? `api/me.php?auth_token=${encodeURIComponent(storedToken)}` : "api/me.php";
          const meRes = await fetch(meUrl, { headers, credentials: "same-origin", cache: "no-store" });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData && meData.ok && meData.user && typeof persistAuthUser === "function") {
              persistAuthUser(meData.user);
            }
          }
        } catch (e) {}

        showPaymentSuccessState(data);
      }
    } catch (err) {
      console.warn("Polling payment status error:", err);
    }
  }, 2000);
}

function showPaymentSuccessState(data) {
  if (currentPollingInterval) {
    clearInterval(currentPollingInterval);
    currentPollingInterval = null;
  }

  // Cập nhật ngay bộ nhớ tạm LocalStorage để isUserVip() nhận diện VIP tức thì
  try {
    const cachedUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
    if (cachedUser && typeof cachedUser === "object") {
      cachedUser.is_vip = 1;
      localStorage.setItem("auth_user", JSON.stringify(cachedUser));
    }
  } catch (e) {}

  const modalBox = document.querySelector("#payos-modal .payos-modal-box");
  if (!modalBox) return;

  modalBox.innerHTML = `
    <div style="text-align: center; padding: 20px 10px;">
      <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(46, 232, 120, 0.2); border: 2px solid #2ee878; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 2.5rem; color: #00ff87; box-shadow: 0 0 30px rgba(46, 232, 120, 0.5);">
        ✓
      </div>
      <h2 style="color: #ffffff; margin: 0 0 8px 0; font-size: 1.6rem; font-weight: 900;">THANH TOÁN THÀNH CÔNG!</h2>
      <p style="color: #2ee878; font-weight: 700; font-size: 1.1rem; margin-bottom: 16px;">
        🎉 Bạn đã chính thức nâng cấp thành công ${data.plan_name}!
      </p>
      <p style="color: #cbd5e1; font-size: 0.95rem; margin-bottom: 24px; line-height: 1.6;">
        Tài khoản của bạn đã được mở khóa toàn bộ bài học, từ vựng, ngữ pháp và tính năng luyện tập Trọn Đời.
      </p>
      <button type="button" class="btn btn-primary" onclick="window.location.href='profile.html'" style="padding: 14px 28px; font-weight: 800; font-size: 1rem; border-radius: 12px; width: 100%;">
        👤 Đến Trang Thông Tin Cá Nhân Ngay
      </button>
    </div>
  `;

  setTimeout(() => {
    window.location.href = "profile.html";
  }, 3000);
}

function closePayosModal() {
  if (currentPollingInterval) {
    clearInterval(currentPollingInterval);
    currentPollingInterval = null;
  }
  const modal = document.getElementById("payos-modal");
  if (modal) modal.classList.remove("active");
}
