document.addEventListener("DOMContentLoaded", () => {
  initPricingPage();
});

let currentPollingInterval = null;

function initPricingPage() {
  localStorage.removeItem("ewm_active_order_pro");
  localStorage.removeItem("ewm_active_order_premium");
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
        const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
        const meRes = await fetcher("api/me.php");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData && meData.ok && meData.user) {
            activeUser = meData.user;
            if (typeof persistAuthUser === "function") persistAuthUser(meData.user);
          }
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
    const storedToken = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token") || "";

    if (!storedToken) {
      showCustomPricingModal({
        title: "Yêu Cầu Đăng Nhập",
        message: "Vui lòng đăng nhập tài khoản để thực hiện nâng cấp VIP!",
        icon: "🔑",
        buttonText: "🔑 Đăng Nhập Ngay",
        onConfirm: () => { window.location.href = "login.html?redirect=pricing.html"; }
      });
      return;
    }

    // Kiểm tra số ngày Pro còn lại để cảnh báo cộng dồn
    const authUserRaw = localStorage.getItem("auth_user") || localStorage.getItem("engWithMeUser");
    let authUser = null;
    try { authUser = JSON.parse(authUserRaw); } catch(e){}

    if (authUser && (authUser.is_vip == 1 || authUser.is_vip === true) && authUser.vip_expires_at) {
      const expiresTime = new Date(authUser.vip_expires_at).getTime();
      const nowTime = Date.now();
      const remainingDays = Math.ceil((expiresTime - nowTime) / (1000 * 60 * 60 * 24));

      if (remainingDays > 0 && !btn.dataset.userConfirmed) {
        showCustomPricingModal({
          title: "⚠️ Cảnh Báo Gia Hạn Gói",
          message: `Tài khoản của bạn hiện đang có gói Pro còn hạn ${remainingDays} ngày. Bạn có muốn tiếp tục gia hạn để cộng dồn (+30 ngày) thời gian sử dụng tiếp không?`,
          icon: "⚠️",
          showCancel: true,
          buttonText: "Tiếp Tục",
          cancelText: "Hủy",
          onConfirm: () => {
            btn.dataset.userConfirmed = "true";
            handleOpenPayment(plan, btn);
          }
        });
        return;
      }
    }
    delete btn.dataset.userConfirmed;

    // 3. Kiểm tra xem đã có đơn hàng thanh toán đang hoạt động (chưa hết hạn 15p) cho gói này chưa
    const activeOrderKey = `ewm_active_order_${plan}`;
    const rawActiveOrder = localStorage.getItem(activeOrderKey);
    let cachedOrder = null;
    if (rawActiveOrder) {
      try { cachedOrder = JSON.parse(rawActiveOrder); } catch(e){}
    }

    if (cachedOrder && cachedOrder.result && cachedOrder.expireAt && cachedOrder.expireAt > Date.now()) {
      renderPayosModal(cachedOrder.result, cachedOrder.expireAt, plan);
      if (typeof startPaymentStatusPoller === "function") {
        startPaymentStatusPoller(cachedOrder.result.orderCode || cachedOrder.result.order_code);
      }
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="ti-reload spin"></span> Đang tạo VietQR PayOS...`;

    let result = null;

    if (window.apiClient && window.apiClient.payment && typeof window.apiClient.payment.createPayment === "function") {
      result = await window.apiClient.payment.createPayment(plan);
    } else {
      const apiBase = (window.EWM_CONFIG && window.EWM_CONFIG.API_BASE_URL)
        ? window.EWM_CONFIG.API_BASE_URL
        : "https://api.tungf.io.vn/v1/";
      const url = apiBase.endsWith("/")
        ? `${apiBase}payment/create_payment.php`
        : `${apiBase}/payment/create_payment.php`;

      const formData = new FormData();
      formData.append("plan", plan);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${storedToken}`
        },
        body: formData
      });
      result = await res.json();
    }

    if (!result || !result.ok) {
      showCustomPricingModal({
        title: "Cảnh Báo Nâng Cấp",
        message: (result && result.message) ? result.message : "Không thể tạo đơn hàng thanh toán. Vui lòng thử lại sau.",
        icon: "⚠️",
        buttonText: "Đóng"
      });
      return;
    }

    // Khởi tạo hạn 15 phút cố định từ thời điểm tạo đơn thành công
    const newExpireAt = Date.now() + (15 * 60 * 1000);
    localStorage.setItem(activeOrderKey, JSON.stringify({
      result,
      expireAt: newExpireAt
    }));

    renderPayosModal(result, newExpireAt, plan);
    if (typeof startPaymentStatusPoller === "function") {
      startPaymentStatusPoller(result.orderCode || result.order_code);
    }

  } catch (err) {
    console.error("[Pricing Payment Error]", err);
    showCustomPricingModal({
      title: "Lỗi Kết Nối",
      message: "Không thể kết nối máy lưu trữ khi tạo mã QR. Vui lòng kiểm tra kết nối mạng và thử lại sau.",
      icon: "❌",
      buttonText: "Đóng"
    });
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

function showCustomPricingModal({ title = "Thông Báo", message = "", icon = "⚠️", buttonText = "Đã Hiểu", showCancel = false, cancelText = "Hủy", onConfirm = null }) {
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
  const safeCancelText = typeof escapeHtml === "function" ? escapeHtml(cancelText) : cancelText;

  modal.innerHTML = `
    <div style="background: #0f172a; border: 1.5px solid rgba(234, 179, 8, 0.5); border-radius: 20px; max-width: 440px; width: 100%; padding: 28px; text-align: center; box-shadow: 0 20px 50px rgba(234, 179, 8, 0.15), 0 10px 30px rgba(0,0,0,0.8); position: relative; animation: modalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
      <button type="button" class="close-btn" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.08); border: none; color: #94a3b8; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;">✕</button>
      <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.05)); border: 1.5px solid rgba(234, 179, 8, 0.4); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px auto; font-size: 2rem; box-shadow: 0 0 20px rgba(234, 179, 8, 0.25);">
        ${icon}
      </div>
      <h3 style="color: #ffffff; font-size: 1.35rem; font-weight: 800; margin: 0 0 10px 0;">${safeTitle}</h3>
      <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">${safeMessage}</p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        ${showCancel ? `
          <button type="button" class="cancel-btn btn btn-ghost" style="padding: 12px 20px; font-weight: 700; border-radius: 12px; flex: 1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; cursor: pointer;">
            ${safeCancelText}
          </button>
        ` : ''}
        <button type="button" class="confirm-btn btn btn-primary" style="padding: 12px 24px; font-weight: 800; border-radius: 12px; flex: 1; background: linear-gradient(135deg, #10b981, #059669); border: none; color: #ffffff; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); cursor: pointer;">
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

let qrTimerInterval = null;

function startQrCountdown(expireAtTimestamp, orderCode) {
  if (qrTimerInterval) clearInterval(qrTimerInterval);

  const updateTimer = () => {
    const remaining = Math.max(0, Math.floor((expireAtTimestamp - Date.now()) / 1000));
    const timerElem = document.getElementById("qr-countdown-timer");

    if (remaining <= 0) {
      if (qrTimerInterval) {
        clearInterval(qrTimerInterval);
        qrTimerInterval = null;
      }
      if (currentPollingInterval) {
        clearInterval(currentPollingInterval);
        currentPollingInterval = null;
      }
      if (timerElem) {
        timerElem.innerHTML = "00:00 (Đã hết hạn)";
        timerElem.style.color = "#f87171";
      }
      const confirmBtn = document.getElementById("confirm-payment-btn");
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = "❌ Mã QR Đã Hết Hạn - Vui Lòng Tạo Đơn Mới";
        confirmBtn.style.background = "#64748b";
        confirmBtn.style.boxShadow = "none";
        confirmBtn.style.cursor = "not-allowed";
      }
      return;
    }

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const minsStr = String(mins).padStart(2, "0");
    const secsStr = String(secs).padStart(2, "0");
    if (timerElem) {
      timerElem.textContent = `${minsStr}:${secsStr}`;
    }
  };

  updateTimer();
  qrTimerInterval = setInterval(updateTimer, 1000);
}

function renderPayosModal(data, explicitExpireAt = null, planTypeParam = null) {
  const modal = document.getElementById("payos-modal");
  if (!modal) return;

  const modalBox = modal.querySelector(".payos-modal-box");
  const qrImgUrl = data.qr_code || data.vietqr_img;
  const orderCode = data.orderCode || data.order_code || "EWM_ORDER";

  const planType = planTypeParam || ((data.plan_name && data.plan_name.includes("Premium")) ? "premium" : "pro");

  // Use explicitExpireAt if provided or fallback to stored timestamp per order code
  const storageKey = `ewm_payment_expire_${orderCode}`;
  let expireAt = explicitExpireAt || Number(localStorage.getItem(storageKey));
  if (!expireAt || isNaN(expireAt) || expireAt <= Date.now()) {
    expireAt = Date.now() + (15 * 60 * 1000); // 15 minutes in milliseconds
  }
  localStorage.setItem(storageKey, String(expireAt));

  const initialRemaining = Math.max(0, Math.floor((expireAt - Date.now()) / 1000));
  const initMins = String(Math.floor(initialRemaining / 60)).padStart(2, "0");
  const initSecs = String(initialRemaining % 60).padStart(2, "0");

  modalBox.innerHTML = `
    <button type="button" class="payos-close-btn" id="payos-modal-close" title="Đóng">✕</button>
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px;">
      <img src="https://payos.vn/wp-content/uploads/2023/07/payos-logo.svg" alt="PayOS" style="height: 24px;" onerror="this.style.display='none'">
      <span style="font-size: 1.1rem; font-weight: 800; color: #ffffff;">Thanh Toán VietQR Tự Động</span>
    </div>

    <!-- 15-Minute Expiration Countdown Banner -->
    <div style="font-size: 0.88rem; color: #ffd700; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(234, 179, 8, 0.12); border: 1px solid rgba(234, 179, 8, 0.35); padding: 8px 14px; border-radius: 10px;">
      <span>⏱️ Mã QR & Đơn hàng hết hạn sau:</span>
      <strong id="qr-countdown-timer" style="font-family: monospace; font-size: 1.05rem; color: #f87171;">${initMins}:${initSecs}</strong>
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

    <button type="button" class="btn btn-primary full-width" id="confirm-payment-btn" style="margin-top: 16px; background: linear-gradient(135deg, #10b981, #059669); font-weight: 800; padding: 13px; font-size: 1rem; border-radius: 12px; border: none; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); cursor: pointer; color: #ffffff; width: 100%;">
      ✅ Tôi Đã Chuyển Khoản Thành Công
    </button>
  `;

  modal.classList.add("active");

  // Start persistent countdown with stored expiration timestamp
  startQrCountdown(expireAt, orderCode);

  // Bind close & confirm btns
  document.getElementById("payos-modal-close")?.addEventListener("click", closePayosModal);
  document.getElementById("confirm-payment-btn")?.addEventListener("click", () => {
    verifyPaymentAndUpgrade(orderCode, data, planType);
  });

  // Start Real-time Polling every 2 seconds
  startPaymentPolling(orderCode, data, planType);
}

async function verifyPaymentAndUpgrade(orderCode, data, planType) {
  const confirmBtn = document.getElementById("confirm-payment-btn");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span class="ti-reload spin"></span> Đang xác thực đơn hàng...`;
  }

  try {
    const storedToken = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token") || localStorage.getItem("auth_token") || localStorage.getItem("session_token") || localStorage.getItem("engWithMeUserId") || "";
    const headers = storedToken ? { "Authorization": `Bearer ${storedToken}` } : {};
    const relativePath = `payment/check_payment_status.php?orderCode=${orderCode}&plan=${planType}&auth_token=${encodeURIComponent(storedToken)}`;
    const url = typeof window.resolveApiUrl === "function" ? window.resolveApiUrl(relativePath) : `api/${relativePath}`;

    const res = await fetch(url, { headers, credentials: "same-origin", cache: "no-store" });
    if (!res.ok) {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `✅ Tôi Đã Chuyển Khoản Thành Công`;
      }
      return;
    }
    const result = await res.json();

    if (result.ok && (result.is_paid || result.status === "PAID")) {
      if (result.user && typeof persistAuthUser === "function") {
        persistAuthUser(result.user);
      }
      showPaymentSuccessState(data);
    } else {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `✅ Tôi Đã Chuyển Khoản Thành Công`;
      }
      showCustomPricingModal({
        title: "Đang Kiểm Tra Chuyển Khoản",
        message: "Hệ thống đang kiểm tra giao dịch của bạn. Vui lòng chờ 1-2 phút hoặc bấm nút chuyển khoản một lần nữa.",
        icon: "⏳",
        buttonText: "Đã Hiểu"
      });
    }
  } catch (e) {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `✅ Tôi Đã Chuyển Khoản Thành Công`;
    }
  }
}

function startPaymentPolling(orderCode, data, planType) {
  if (currentPollingInterval) clearInterval(currentPollingInterval);

  currentPollingInterval = setInterval(async () => {
    try {
      const storedToken = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token") || localStorage.getItem("auth_token") || localStorage.getItem("session_token") || localStorage.getItem("engWithMeUserId") || "";
      const headers = storedToken ? { "Authorization": `Bearer ${storedToken}` } : {};
      const relativePath = `payment/check_payment_status.php?orderCode=${orderCode}&plan=${planType}&auth_token=${encodeURIComponent(storedToken)}`;
      const url = typeof window.resolveApiUrl === "function" ? window.resolveApiUrl(relativePath) : `api/${relativePath}`;

      const res = await fetch(url, {
        headers,
        credentials: "same-origin",
        cache: "no-store"
      });

      if (!res.ok) return;
      const result = await res.json();

      if (result.ok && (result.is_paid || result.status === "PAID")) {
        clearInterval(currentPollingInterval);
        currentPollingInterval = null;

        if (result.user && typeof persistAuthUser === "function") {
          persistAuthUser(result.user);
        }

        // Sync fresh profile data from server me.php
        try {
          const mePath = storedToken ? `me.php?auth_token=${encodeURIComponent(storedToken)}` : "me.php";
          const meUrl = typeof window.resolveApiUrl === "function" ? window.resolveApiUrl(mePath) : `api/${mePath}`;
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

  // Clear cached active orders
  localStorage.removeItem("ewm_active_order_pro");
  localStorage.removeItem("ewm_active_order_premium");

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
  if (qrTimerInterval) {
    clearInterval(qrTimerInterval);
    qrTimerInterval = null;
  }
  const modal = document.getElementById("payos-modal");
  if (modal) modal.classList.remove("active");
}

window.verifyOrderManual = async function (orderCode, btn) {
  const origText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="ti-reload spin"></span> Đang xác minh...`;

  try {
    const storedToken = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token") || "";
    const apiBase = (window.EWM_CONFIG && window.EWM_CONFIG.API_BASE_URL)
      ? window.EWM_CONFIG.API_BASE_URL
      : "https://api.tungf.io.vn/v1/";
    const url = `${apiBase.replace(/\/$/, '')}/payment/check_payment_status.php?orderCode=${orderCode}&auth_token=${encodeURIComponent(storedToken)}`;

    const res = await fetch(url, { headers: { "Authorization": `Bearer ${storedToken}` } });
    const result = await res.json();

    if (result.ok && result.is_paid) {
      alert("🎉 Thanh toán thành công! Tài khoản của bạn đã được nâng cấp VIP!");
      window.location.reload();
    } else {
      alert(result.message || "Hệ thống chưa ghi nhận tiền chuyển khoản. Nếu bạn đã chuyển khoản, vui lòng đợi 1-2 phút rồi bấm lại.");
    }
  } catch (e) {
    alert("Không thể kết nối máy chủ kiểm tra thanh toán. Vui lòng thử lại sau.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = origText;
  }
};
