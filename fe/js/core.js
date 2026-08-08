function setCurrentYear() {
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}

function formatDateTime(value) {
  if (!value) return "";
  let str = String(value).trim();
  if (str.includes(" ") && !str.includes("T")) str = str.replace(" ", "T") + "Z";
  else if (!str.endsWith("Z") && !str.includes("+")) str += "Z";

  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function setActiveNav() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const mainNavItems = [
    { href: "index.html", label: "Home" },
    { href: "vocabulary.html", label: "Vocabulary" },
    { href: "listening.html", label: "Listening" },
    { href: "reading.html", label: "Reading" },
    { href: "grammar.html", label: "Grammar" },
    { href: "quiz.html", label: "Exam" },
    { href: "rank.html", label: "Rank" },
    { href: "blog.html", label: "Blog" },
    { href: "pricing.html", label: "Premium" }
  ];

  const adminNavItems = [
    { href: "admin.html", label: "Tổng quan" },
    { href: "admin.html#users", label: "Người dùng" },
    { href: "admin.html#learning-content", label: "Nội dung" },
    { href: "admin.html#settings", label: "Cài đặt" }
  ];

  const navItems = document.body.classList.contains("admin-page")
    ? adminNavItems
    : mainNavItems;

  document.querySelectorAll(".nav-links").forEach((nav) => {
    nav.setAttribute("aria-label", "Menu chính");
    nav.innerHTML = navItems
      .map((item) => `<a href="${item.href}">${item.label}</a>`)
      .join("");

    const links = nav.querySelectorAll("a");
    
    let activePage = currentPage;
    if (currentPage === "vocabulary-study.html") {
      activePage = "vocabulary.html";
    } else if (currentPage === "quiz.html" || currentPage === "exam-practice.html") {
      activePage = "quiz.html";
    }

    links.forEach((link) => {
      const href = link.getAttribute("href");
      const linkPage = href.split("#")[0];
      if (href === activePage || linkPage === activePage) {
        link.classList.add("is-active");
      }
    });
  });

  // Khởi tạo menu điều hướng cho điện thoại
  initMobileMenu();
}

function initMobileMenu() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  // Đảm bảo nút hamburger tồn tại
  let navToggle = header.querySelector(".nav-toggle");
  if (!navToggle) {
    navToggle = document.createElement("button");
    navToggle.className = "nav-toggle";
    navToggle.setAttribute("aria-label", "Mở menu");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    const navActions = header.querySelector(".nav-actions");
    if (navActions) {
      header.insertBefore(navToggle, navActions);
    } else {
      header.appendChild(navToggle);
    }
  }

  // Đảm bảo lớp phủ backdrop tồn tại
  let backdrop = document.querySelector(".nav-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    document.body.appendChild(backdrop);
  }

  // Hàm chuyển đổi trạng thái menu
  const toggleMenu = (open) => {
    const shouldOpen = open !== undefined ? open : !document.body.classList.contains("nav-open");
    document.body.classList.toggle("nav-open", shouldOpen);
    navToggle.setAttribute("aria-expanded", String(shouldOpen));
    navToggle.setAttribute("aria-label", shouldOpen ? "Đóng menu" : "Mở menu");
  };

  // Ngăn chặn việc liên kết sự kiện nhiều lần
  if (!window.engWithMeMobileMenuBound) {
    window.engWithMeMobileMenuBound = true;
    
    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    backdrop.addEventListener("click", () => {
      toggleMenu(false);
    });

    // Tự động đóng menu khi nhấp vào liên kết
    const navLinks = header.querySelector(".nav-links");
    if (navLinks) {
      navLinks.addEventListener("click", (e) => {
        if (e.target.tagName === "A") {
          toggleMenu(false);
        }
      });
    }
  }
}


function initEnhancedFooter() {
  document.querySelectorAll(".site-footer").forEach((footer) => {
    footer.innerHTML = getEnhancedFooterMarkup();
  });

  setCurrentYear();
}

function getEnhancedFooterMarkup() {
  return `
    <section class="footer-main" aria-label="Liên kết chính">
      <div class="footer-brand-panel">
        <a class="footer-logo" href="index.html">
          <span class="footer-logo-mark" aria-hidden="true"></span>
          <span>EngWithMe</span>
        </a>
        <p>Học tiếng Anh theo lộ trình cá nhân, luyện từ vựng, nghe, đọc và ngữ pháp.</p>
        <div class="footer-socials" aria-label="Mạng xã hội">
          <a href="https://www.facebook.com/share/g/1Bm2e1thmb/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><span class="ti-facebook"></span></a>
          <a href="blog.html" aria-label="YouTube"><span class="ti-youtube"></span></a>
          <a href="blog.html" aria-label="Instagram"><span class="ti-instagram"></span></a>
        </div>
      </div>

      ${getFooterColumnMarkup("Học tập", [
        ["vocabulary.html", "ti-bookmark-alt", "Từ vựng"],
        ["listening.html", "ti-headphone-alt", "Listening"],
        ["reading.html", "ti-book", "Reading"],
        ["grammar.html", "ti-pencil-alt", "Grammar"]
      ])}

      ${getFooterColumnMarkup("Cộng đồng", [
        ["blog.html", "ti-comments", "Blog học viên"],
        ["speaking.html", "ti-microphone", "Luyện nói"],
        ["profile.html", "ti-user", "Trang cá nhân"]
      ])}

      ${getFooterColumnMarkup("Hỗ trợ", [
        ["index.html#contact-admin", "ti-help-alt", "Trung tâm hỗ trợ"],
        ["pricing.html", "ti-credit-card", "Gói Premium"],
        ["index.html#contact-admin", "ti-email", "Liên hệ"]
      ])}
    </section>

    <section class="footer-trust" aria-label="Thông tin đáng tin cậy">
      <div class="footer-trust-item">
        <span class="ti-lock"></span>
        <strong>SSL mã hóa</strong>
      </div>
      <div class="footer-trust-item">
        <span class="ti-shield"></span>
        <strong>PDPA-ready</strong>
      </div>
      <div class="footer-trust-item">
        <span class="ti-heart"></span>
        <strong>Hoàn tiền 7 ngày</strong>
      </div>
      <div class="footer-trust-item">
        <span class="ti-headphone-alt"></span>
        <strong>Hỗ trợ 24/7</strong>
      </div>
      <div class="footer-trust-item">
        <span class="ti-user"></span>
        <strong>1301+ học viên</strong>
      </div>
    </section>

    <section class="footer-bottom" aria-label="Thông tin pháp lý">
      <nav aria-label="Liên kết pháp lý">
        <a href="javascript:void(0)" onclick="document.getElementById('termsModal').style.display='flex'">Điều khoản</a>
        <a href="javascript:void(0)" onclick="document.getElementById('termsModal').style.display='flex'">Bảo mật</a>
        <a href="index.html#contact-admin">Liên hệ</a>
      </nav>
      <p class="footer-made">© <span data-current-year></span> EngWithMe. Made in Vietnam.</p>
    </section>

    <!-- Terms Modal -->
    <div id="termsModal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; justify-content: center; align-items: center; backdrop-filter: blur(4px);">
      <div class="modal-content" style="background: #0b1220; border: 1px solid rgba(46, 232, 120, 0.3); border-radius: 16px; padding: 32px; max-width: 600px; width: 90%; color: #fff; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <h2 style="text-align: center; margin-top: 0; color: #70f59d; font-size: 24px;">EngWithMe - Điều khoản</h2>
        <div style="text-align: left; max-height: 80vh; overflow-y: auto; padding-right: 10px; margin: 24px 0;">
          <h3 style="color: #38bdf8; font-size: 16px; margin-top: 0; margin-bottom: 8px;">Quy tắc ứng xử chung</h3>
          <ul style="line-height: 1.8; margin: 0 0 16px 0; padding-left: 20px; color: #e2e8f0; font-size: 15px;">
            <li><strong>Tôn trọng:</strong> Cư xử lịch sự, không xúc phạm hay gây gổ với người khác.</li>
            <li><strong>Đúng chủ đề:</strong> Đăng bài và thảo luận đúng nội dung chính mà cộng đồng hướng tới.</li>
            <li><strong>Không toxic:</strong> Tránh dùng lời lẽ thô tục, châm chọc hay kích động bạo lực.</li>
          </ul>
          <h3 style="color: #38bdf8; font-size: 16px; margin-top: 0; margin-bottom: 8px;">Quy tắc đăng bài và nội dung</h3>
          <ul style="line-height: 1.8; margin: 0 0 16px 0; padding-left: 20px; color: #e2e8f0; font-size: 15px;">
            <li><strong>Cấm spam:</strong> Không đăng lặp lại nhiều lần một nội dung hoặc gửi tin nhắn rác.</li>
            <li><strong>Hạn chế quảng cáo:</strong> Không tự ý bán hàng hay PR dịch vụ khi chưa có sự cho phép của quản trị viên.</li>
            <li><strong>Bảo mật thông tin:</strong> Không chia sẻ thông tin riêng tư của người khác lên mạng.</li>
          </ul>
        </div>
        <div style="text-align: center;">
          <button onclick="document.getElementById('termsModal').style.display='none'" style="background: #2ee878; color: #022212; border: none; padding: 12px 32px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 16px; transition: 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Đã hiểu & Đồng ý</button>
        </div>
      </div>
    </div>
  `;
}

function getFooterColumnMarkup(title, links) {
  return `
    <div class="footer-column">
      <h3>${title}</h3>
      <nav aria-label="${title}">
        ${links.map(([href, icon, label, badge]) => `
          <a href="${href}">
            <span class="${icon}"></span>${label}
            ${badge ? `<em>${badge}</em>` : ""}
          </a>
        `).join("")}
      </nav>
    </div>
  `;
}


// State Management & Cache Controller (Memory + Disk Cache)
const AppCache = {
  memoryStore: new Map(),

  get(key) {
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key);
    }
    try {
      const data = localStorage.getItem(`ewm_cache_${key}`);
      if (data) {
        const parsed = JSON.parse(data);
        this.memoryStore.set(key, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn("Lỗi đọc cache disk:", e);
    }
    return null;
  },

  set(key, value) {
    this.memoryStore.set(key, value);
    try {
      localStorage.setItem(`ewm_cache_${key}`, JSON.stringify(value));
      localStorage.setItem(`ewm_cache_invalid_${key}`, "false");
      localStorage.setItem(`ewm_cache_time_${key}`, Date.now().toString());
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }
  },

  invalidate(key) {
    localStorage.setItem(`ewm_cache_invalid_${key}`, "true");
    this.memoryStore.delete(key);
  },

  isInvalid(key) {
    return localStorage.getItem(`ewm_cache_invalid_${key}`) === "true";
  },

  getLastSyncTime(key) {
    return parseInt(localStorage.getItem(`ewm_cache_time_${key}`) || "0", 10);
  },

  invalidateUser(userId) {
    if (!userId) return;
    this.invalidate(`vocab_user_${userId}`);
    this.invalidate(`progress_user_${userId}`);
    this.invalidate(`quiz_user_${userId}`);
    console.log(`[Cache] Invalidated all data caches for user: ${userId}`);
  }
};

window.AppCache = AppCache;

function resolveApiUrl(url) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = (window.EWM_CONFIG && window.EWM_CONFIG.API_BASE_URL) ? window.EWM_CONFIG.API_BASE_URL : "https://api.tungf.io.vn/v1/";
  
  let cleanPath = url.replace(/^\/?api\//, "");
  if (cleanPath === "me.php") cleanPath = "user/me.php";
  if (cleanPath === "profile.php") cleanPath = "user/profile.php";
  if (cleanPath === "change_password.php") cleanPath = "user/change_password.php";
  if (cleanPath === "user_payments.php") cleanPath = "user/user_payments.php";
  if (cleanPath.startsWith("notifications.php")) cleanPath = cleanPath.replace("notifications.php", "notification/notifications.php");
  if (cleanPath === "login.php") cleanPath = "auth/login.php";
  if (cleanPath === "logout.php") cleanPath = "auth/logout.php";
  if (cleanPath === "register.php") cleanPath = "auth/register.php";
  if (cleanPath === "forgot_password.php") cleanPath = "auth/forgot_password.php";
  if (cleanPath === "reset_password.php") cleanPath = "auth/reset_password.php";
  if (cleanPath === "google_login.php") cleanPath = "auth/google_login.php";
  if (cleanPath === "google_callback.php") cleanPath = "auth/google_callback.php";
  if (cleanPath === "get_blogs.php") cleanPath = "blog/get_blogs.php";
  if (cleanPath === "submit_blog.php") cleanPath = "blog/submit_blog.php";
  if (cleanPath === "toggle_blog_like.php") cleanPath = "blog/toggle_blog_like.php";
  if (cleanPath === "increment_blog_view.php") cleanPath = "blog/increment_blog_view.php";
  if (cleanPath === "get_pending_blogs.php" || cleanPath === "pending_blogs.php" || cleanPath === "admin_pending.php") cleanPath = "admin/pending_blogs.php";
  if (cleanPath === "approve_blog.php" || cleanPath === "admin_approve.php") cleanPath = "admin/approve_blog.php";
  if (cleanPath === "reject_blog.php" || cleanPath === "admin_reject.php") cleanPath = "admin/reject_blog.php";
  if (cleanPath === "get_leaderboard.php" || cleanPath === "leaderboard.php") cleanPath = "blog/get_leaderboard.php";
  if (cleanPath === "learning_content.php") cleanPath = "learning/learning_content.php";
  if (cleanPath === "sync_progress.php") cleanPath = "learning/sync_progress.php";
  if (cleanPath === "sync_vocab.php") cleanPath = "learning/sync_vocab.php";
  if (cleanPath === "sync_grammar.php") cleanPath = "learning/sync_grammar.php";
  if (cleanPath === "user_level.php") cleanPath = "learning/user_level.php";
  if (cleanPath === "send_contact.php") cleanPath = "learning/send_contact.php";
  if (cleanPath === "test_results.php") cleanPath = "quiz/test_results.php";
  if (cleanPath === "sync_quiz.php") cleanPath = "quiz/sync_quiz.php";
  if (cleanPath === "get_exam_questions.php") cleanPath = "quiz/get_exam_questions.php";
  if (cleanPath === "admin_users.php") cleanPath = "admin/admin_users.php";
  if (cleanPath === "admin_reports.php") cleanPath = "admin/admin_reports.php";
  if (cleanPath === "broadcast_notification.php") cleanPath = "admin/broadcast_notification.php";
  if (cleanPath === "create_payment.php" || cleanPath === "check_payment_status.php") cleanPath = "payment/create_payment.php";

  return `${base}${cleanPath}`;
}

window.resolveApiUrl = resolveApiUrl;

// Tự động nhận diện, lưu auth_token từ Google Redirect và dọn dẹp URL thanh địa chỉ ngay lập tức
(function syncUrlAuthToken() {
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const token = params.get("auth_token") || params.get("token");
    const googleAuth = params.get("google_auth");
    const userId = params.get("user_id");
    const email = params.get("email");
    const name = params.get("name") || params.get("full_name");
    const avatar = params.get("avatar");

    if (token) {
      localStorage.setItem("engWithMeAuthToken", token);
      localStorage.setItem("ewm_token", token);
    }
    if (userId) {
      localStorage.setItem("engWithMeUserId", userId);
    }
    if (email) {
      localStorage.setItem("engWithMeUserEmail", email);
    }
    if (name) {
      localStorage.setItem("engWithMeStudentName", name);
    }
    if (avatar) {
      localStorage.setItem("engWithMeUserAvatar", avatar);
    }
    const hasPasswordParam = params.get("has_password");
    if (hasPasswordParam !== null && hasPasswordParam !== undefined) {
      localStorage.setItem("engWithMeUserHasPassword", hasPasswordParam === "1" ? "1" : "0");
    }

    if (token || email || name) {
      if (typeof persistAuthUser === "function") {
        persistAuthUser({
          id: userId || localStorage.getItem("engWithMeUserId") || "user",
          email: email || localStorage.getItem("engWithMeUserEmail") || "",
          name: name || localStorage.getItem("engWithMeStudentName") || "",
          avatar: avatar || localStorage.getItem("engWithMeUserAvatar") || "",
          has_password: hasPasswordParam !== null ? (hasPasswordParam === "1" ? 1 : 0) : undefined,
          session_token: token || localStorage.getItem("engWithMeAuthToken") || ""
        });
      }
    }

    // Dọn dẹp thanh địa chỉ browser chuyên nghiệp (xóa ?auth_token=...&google_auth=success)
    if (token || googleAuth || userId || email || name || hasPasswordParam || params.has("auth_token") || params.has("google_auth") || params.has("user_id") || params.has("email")) {
      params.delete("auth_token");
      params.delete("token");
      params.delete("google_auth");
      params.delete("user_id");
      params.delete("email");
      params.delete("name");
      params.delete("full_name");
      params.delete("avatar");
      params.delete("has_password");

      const cleanSearch = params.toString();
      const cleanUrl = url.pathname + (cleanSearch ? "?" + cleanSearch : "") + url.hash;
      window.history.replaceState(null, "", cleanUrl);

      if (googleAuth === "success") {
        setTimeout(() => {
          if (typeof showToast === "function") {
            showToast("✨ Đăng nhập tài khoản Google thành công!", "success");
          }
        }, 300);
      }
    }
  } catch (e) {
    console.error("URL Auth Token Sync Error:", e);
  }
})();

async function fetchAuth(url, options = {}) {
  const targetUrl = resolveApiUrl(url);
  const urlParams = new URLSearchParams(window.location.search);
  const token = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token") || urlParams.get("auth_token") || urlParams.get("token") || "";
  
  if (token && !localStorage.getItem("engWithMeAuthToken")) {
    try { localStorage.setItem("engWithMeAuthToken", token); } catch (e) {}
  }

  const fetchOpts = { credentials: "same-origin", cache: "no-store", ...options };
  const headers = { ...(fetchOpts.headers || {}) };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  fetchOpts.headers = headers;

  let finalUrl = targetUrl;
  if (token && !finalUrl.includes("auth_token=")) {
    const sep = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${sep}auth_token=${encodeURIComponent(token)}`;
  }

  return fetch(finalUrl, fetchOpts);
}

window.fetchAuth = fetchAuth;

// Global Fetch Interceptor to catch all legacy relative fetch("api/...") calls across all JS modules
(function () {
  const originalFetch = window.fetch;
  window.fetch = function (resource, options = {}) {
    let url = typeof resource === "string" ? resource : (resource && resource.url) ? resource.url : "";

    if (typeof url === "string" && (url.startsWith("api/") || url.startsWith("/api/"))) {
      const resolvedUrl = resolveApiUrl(url);
      const token = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token") || "";
      const fetchOpts = { credentials: "same-origin", ...options };
      const headers = { ...(fetchOpts.headers || {}) };

      if (token && !headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      fetchOpts.headers = headers;

      let finalUrl = resolvedUrl;
      if (token && !finalUrl.includes("auth_token=")) {
        const sep = finalUrl.includes("?") ? "&" : "?";
        finalUrl = `${finalUrl}${sep}auth_token=${encodeURIComponent(token)}`;
      }

      return originalFetch.call(window, finalUrl, fetchOpts);
    }

    return originalFetch.call(this, resource, options);
  };
})();

async function fetchWithSWR(url, cacheKey, onDataReady, options = {}) {
  const cachedData = AppCache.get(cacheKey);
  const isInvalid = AppCache.isInvalid(cacheKey);
  const lastSync = AppCache.getLastSyncTime(cacheKey);
  const now = Date.now();
  const cacheDuration = options.ttl || 2 * 60 * 1000; // Mặc định 2 phút
  const targetUrl = resolveApiUrl(url);

  // 1. Trả về cache ngay lập tức nếu có
  if (cachedData) {
    onDataReady(cachedData, true);
  }

  // 2. Chạy ngầm nếu chưa có cache, cache bị invalid, hoặc quá thời gian cacheDuration
  const expired = now - lastSync > cacheDuration;
  if (!cachedData || expired || isInvalid) {
    try {
      const fetchOpts = { credentials: "same-origin", ...(options.fetchOptions || {}) };
      const headers = { ...(fetchOpts.headers || {}) };
      const tokenAtRequest = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token");
      if (tokenAtRequest && !headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${tokenAtRequest}`;
      }
      fetchOpts.headers = headers;

      const response = await fetch(targetUrl, fetchOpts);
      if (response.ok) {
        const result = await response.json();
        
        // Prevent race condition: If the token changed during the fetch (e.g. user just logged in or registered), abort!
        const tokenNow = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token");
        if (tokenAtRequest !== tokenNow) {
          console.warn(`SWR aborted for ${targetUrl}: Auth token changed during request`);
          return;
        }

        if (result.ok) {
          const hasChanged = JSON.stringify(cachedData) !== JSON.stringify(result);
          AppCache.set(cacheKey, result);
          if (hasChanged || !cachedData) {
            onDataReady(result, false);
          }
        } else if (result.user === null || result.status === 401) {
          onDataReady(result, false);
        }
      }
    } catch (error) {
      console.warn(`SWR background fetch failed for ${targetUrl}:`, error);
    }
  }
}

function initAuthNav() {
  // Automatic token extraction from URL (Google OAuth / SSO redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const urlAuthToken = urlParams.get("auth_token") || urlParams.get("token");
  const urlUserId = urlParams.get("user_id");
  const urlHasPassword = urlParams.get("has_password");

  if (urlAuthToken) {
    localStorage.setItem("engWithMeAuthToken", urlAuthToken);
    localStorage.setItem("ewm_token", urlAuthToken);
    if (urlUserId) {
      localStorage.setItem("engWithMeUserId", urlUserId);
    }
  }
  if (urlHasPassword !== null && urlHasPassword !== undefined) {
    localStorage.setItem("engWithMeUserHasPassword", String(urlHasPassword));
  }

  // Bind global event listeners for auth nav, logout, and notifications
  bindAuthNavInteractions();

  const header = document.querySelector(".site-header");
  if (header) {
    ensureNavActions(header);
  }

  // If URL has payment=success parameter, flush stale cache
  const isPaymentSuccess = window.location.search.includes("payment=success");
  if (isPaymentSuccess) {
    if (typeof AppCache !== "undefined" && AppCache.invalidate) {
      AppCache.invalidate("me");
      if (AppCache.memoryStore) AppCache.memoryStore.clear();
    }
    localStorage.removeItem("ewm_cache_me");
  }

  // Render cached user & notifications immediately if token present
  const cachedUser = getCachedAuthUser();
  if (cachedUser) {
    if (header) renderAuthenticatedNav(cachedUser);
    fetchAndRenderNotifications();
  }

  // Fetch me.php in background to verify / refresh user session
  fetchWithSWR("api/me.php", "me", (result, isCached) => {
    if (result && result.ok && result.user) {
      persistAuthUser(result.user);
      renderAuthenticatedNav(result.user);
      redirectAuthPages(result.user, isCached);
      triggerRouteBasedFetch();
    } else if (result && (result.status === 401 || result.ok === false || !result.user)) {
      const hadToken = !!localStorage.getItem("engWithMeAuthToken");
      clearAuthUser();
      renderGuestNav();
      const protectedPages = ["profile.html", "dashboard.html", "admin.html"];
      if (protectedPages.includes(getCurrentPage()) || (hadToken && !isCached)) {
        window.location.replace("login.html");
      }
    }
  }, { ttl: 2 * 60 * 1000 });
}

function refreshPageAfterUserDataSync() {
  const page = getCurrentPage();

  if (page === "vocabulary.html") {
    if (typeof window.refreshVocabularyStateFromStorage === "function") {
      window.refreshVocabularyStateFromStorage();
      return;
    }

    if (typeof updateProgressView === "function") {
      const savedStorageKey = getAccountKey("engWithMeSavedVocabularyWords");
      const quizStatsKey = getAccountKey("engWithMeVocabQuizStats");
      if (typeof normalizeSavedWordRecords === "function") {
        savedWordRecords = normalizeSavedWordRecords(JSON.parse(localStorage.getItem(savedStorageKey) || "[]"));
        savedWords = new Set(savedWordRecords.keys());
      }
      if (typeof normalizeQuizStats === "function") {
        const rawQuiz = JSON.parse(localStorage.getItem(quizStatsKey) || "null");
        Object.assign(quizStats, normalizeQuizStats(rawQuiz));
      }
      updateSavedCount();
      updateProgressView();
      renderTopics();
      renderMyVocab();
    }
    return;
  }

  if (page === "vocabulary-study.html" && typeof window.refreshVocabularyStudyState === "function") {
    window.refreshVocabularyStudyState();
    return;
  }

  if (page === "dashboard.html" && typeof initDashboard === "function") {
    initDashboard();
  }
}

async function triggerRouteBasedFetch(force = false) {
  const currentPage = getCurrentPage();
  const userId = localStorage.getItem("engWithMeUserId");
  if (!userId) return;

  const needsVocab = force || ["vocabulary.html", "vocabulary-study.html"].includes(currentPage);
  const needsProgress = force || ["dashboard.html", "listening.html", "reading.html", "grammar.html", "quiz.html"].includes(currentPage);
  const needsQuiz = force || ["quiz.html", "dashboard.html", "results.html"].includes(currentPage);

  if (!needsVocab && !needsProgress && !needsQuiz) {
    return;
  }

  // 1. Tải từ vựng (SWR) - TTL 3 phút
  if (needsVocab) {
    const vocabCacheKey = `vocab_user_${userId}`;
    if (force) AppCache.invalidate(vocabCacheKey);
    
    fetchWithSWR("api/sync_vocab.php", vocabCacheKey, (vocabData) => {
      localStorage.setItem(
        `engWithMeSavedVocabularyWords_user_${userId}`,
        JSON.stringify(vocabData.saved || [])
      );
      localStorage.setItem(
        `engWithMeViewedTopics_user_${userId}`,
        JSON.stringify(vocabData.viewed || [])
      );
      refreshPageAfterUserDataSync();
    }, { ttl: 3 * 60 * 1000 });
  }

  // 2. Tải tiến trình khóa học (SWR) - TTL 2 phút
  if (needsProgress) {
    const progressCacheKey = `progress_user_${userId}`;
    if (force) AppCache.invalidate(progressCacheKey);

    fetchWithSWR("api/sync_progress.php", progressCacheKey, (progData) => {
      const progressList = progData.progress || [];
      localStorage.setItem(`engWithMeProgress_user_${userId}`, JSON.stringify(progressList));
      
      const readingTopics = [];
      const listeningTopics = [];
      
      progressList.forEach(p => {
        if (p.topic_id.startsWith("reading_")) {
          readingTopics.push(p.topic_id.replace("reading_", ""));
        } else if (p.topic_id.startsWith("listening_")) {
          listeningTopics.push(p.topic_id.replace("listening_", ""));
        }
      });
      
      localStorage.setItem(`engWithMeViewedReadingTopics_user_${userId}`, JSON.stringify(readingTopics));
      localStorage.setItem(`engWithMeRewardedReadingTopics_user_${userId}`, JSON.stringify(readingTopics));
      localStorage.setItem(`engWithMeListeningProgress_user_${userId}`, JSON.stringify(listeningTopics));
      refreshPageAfterUserDataSync();
    }, { ttl: 2 * 60 * 1000 });
  }

  // 3. Tải kết quả thi trắc nghiệm (SWR) - TTL 1 phút
  if (needsQuiz) {
    const quizCacheKey = `quiz_user_${userId}`;
    if (force) AppCache.invalidate(quizCacheKey);

    fetchWithSWR("api/sync_quiz.php", quizCacheKey, (quizData) => {
      if (quizData.stats) {
        const { activityDays, ...quizStats } = quizData.stats;
        localStorage.setItem(
          `engWithMeVocabQuizStats_user_${userId}`,
          JSON.stringify(quizStats)
        );
        if (Array.isArray(activityDays)) {
          const activityKey = `engWithMeVocabActivityDays_user_${userId}`;
          let localActivityDays = [];
          try {
            const parsed = JSON.parse(localStorage.getItem(activityKey) || "[]");
            localActivityDays = Array.isArray(parsed) ? parsed : [];
          } catch (error) {
            localActivityDays = [];
          }
          localStorage.setItem(
            activityKey,
            JSON.stringify(Array.from(new Set([...localActivityDays, ...activityDays])).sort())
          );
        }
      }
      refreshPageAfterUserDataSync();
    }, { ttl: 1 * 60 * 1000 });
  }
}

// Bắt sự kiện người dùng quay lại tab để tự động cập nhật dữ liệu nền
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    triggerRouteBasedFetch();
  }
});

// Giữ hàm cũ tương thích ngược nhưng gọi logic route mới
async function syncUserDataFromServer() {
  return triggerRouteBasedFetch(false);
}

window.triggerRouteBasedFetch = triggerRouteBasedFetch;

function ensureNavActions(header) {
  if (header.querySelector(".nav-actions, .auth-buttons, #auth-actions")) return;

  const actions = document.createElement("div");
  actions.className = "nav-actions";
  header.appendChild(actions);
}

function renderGuestNav() {
  document.querySelectorAll(".nav-actions, .auth-buttons, #auth-actions").forEach((actions) => {
    actions.innerHTML = `
      <a class="btn btn-ghost" href="login.html">Đăng nhập</a>
      <a class="btn btn-primary" href="register.html">Đăng ký</a>
    `;
  });
}

function renderAuthenticatedNav(user) {
  const dashboardHref = user.role === "admin" ? "admin.html" : "profile.html#dashboard";
  const isVip = typeof isUserVip === "function" ? isUserVip(user) : (user.is_vip || user.vip_type === "pro" || user.vip_type === "pre" || user.vip_type === "premium");
  const levelNum = user.level || 1;

  // Determine exact plan & role label & badge styling:
  const planStr = String(
    user.plan_id ||
    user.plan ||
    user.plan_name ||
    user.vip_type ||
    localStorage.getItem("engWithMeUserPlan") ||
    ""
  ).toLowerCase();

  const expiresAt = String(user.vip_expires_at || "");
  const isPremium = planStr.includes("premium") || planStr.includes("pre") || expiresAt.includes("2099") || localStorage.getItem("engWithMeUserIsPremium") === "true";

  let roleLabel = `Lv. ${levelNum}`;
  let roleBadgeStyle = 'background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 10.5px; font-weight: 800; padding: 1px 7px; border-radius: 99px;';

  if (user.role === "admin") {
    roleLabel = "Admin";
    roleBadgeStyle = 'background: rgba(250, 204, 21, 0.15); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.35); font-size: 10.5px; font-weight: 800; padding: 1px 7px; border-radius: 99px;';
  } else if (isPremium) {
    roleLabel = "👑 Premium";
    roleBadgeStyle = 'background: rgba(255, 215, 0, 0.15); color: #ffd700; border: 1px solid rgba(255, 215, 0, 0.4); font-size: 10.5px; font-weight: 800; padding: 1px 7px; border-radius: 99px;';
  } else if (isVip || planStr.includes("pro")) {
    roleLabel = "⚡ Pro";
    roleBadgeStyle = 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.35); font-size: 10.5px; font-weight: 800; padding: 1px 7px; border-radius: 99px;';
  }

  const rawName = user.name || user.full_name || "Tài khoản";
  const cleanName = rawName.replace(/\s*\(Admin\)\s*/gi, "").trim() || "Tài khoản";
  const adminLink = user.role === "admin"
    ? '<a href="admin.html"><span class="ti-shield"></span> Quản trị</a>'
    : "";

  document.querySelectorAll(".nav-actions, .auth-buttons, #auth-actions").forEach((actions) => {
    actions.innerHTML = `
      <div class="user-nav-wrapper" style="display: flex; align-items: center; gap: 12px;">
        ${user.role !== "admin" ? `
        <!-- Notification Bell Button & Popover -->
        <div class="notification-dropdown" data-notification-dropdown>
          <button type="button" class="notification-bell-btn" data-notification-toggle title="Thông báo hệ thống">
            <span class="ti-bell"></span>
            <span class="notification-badge is-hidden" data-notification-badge>0</span>
          </button>

          <!-- Notification Popover Menu -->
          <div class="notification-panel" data-notification-panel>
            <div class="notification-panel-header">
              <h4 class="notification-title">
                <span class="ti-bell"></span> Thông Báo Hệ Thống
              </h4>
              <div class="notification-header-actions">
                <button type="button" class="notif-action-btn" data-mark-all-read title="Đánh dấu tất cả là đã đọc">
                  ✓ Đã đọc
                </button>
                <button type="button" class="notif-action-btn danger" data-delete-all-notif title="Xóa tất cả thông báo">
                  🗑 Xóa
                </button>
              </div>
            </div>

            <div class="notification-list" data-notification-list>
              <div class="notification-empty">
                <div class="empty-icon">🔔</div>
                <p>Đang tải thông báo...</p>
              </div>
            </div>

            <div class="notification-panel-footer">
              <button type="button" class="notif-action-btn" data-notif-settings title="Cài đặt thông báo">
                ⚙ Cài đặt
              </button>
              <a href="profile.html#notifications" class="notif-footer-link">
                Xem tất cả <span class="ti-arrow-right"></span>
              </a>
            </div>
          </div>
        </div>
        ` : ""}

        <!-- GitHub-Style Circular User Menu Dropdown -->
        <div class="user-menu" data-user-menu>
          <button class="user-menu-trigger" type="button" data-user-menu-toggle aria-haspopup="true" aria-expanded="false" title="${escapeHtml(cleanName)}">
            ${getAvatarMarkup({ ...user, name: cleanName }, "user-avatar")}
          </button>
          <div class="user-menu-panel" role="menu" style="width: 240px; padding: 12px 8px; background: rgba(13, 17, 23, 0.98); border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 14px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
            <div style="padding: 8px 12px 12px 12px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 8px;">
              ${getAvatarMarkup({ ...user, name: cleanName }, "user-avatar user-avatar-lg")}
              <div style="overflow: hidden;">
                <div style="font-weight: 800; color: #f8fafc; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;">${escapeHtml(cleanName)}</div>
                <div style="margin-top: 4px;"><span style="${roleBadgeStyle}">${escapeHtml(roleLabel)}</span></div>
              </div>
            </div>

            ${user.role === "admin" ? `
            <a href="admin.html" role="menuitem" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; color: #e2e8f0; font-size: 13.5px; font-weight: 600; border-radius: 8px; text-decoration: none;">
              <span class="ti-shield" style="color: #f59e0b; font-size: 15px;"></span> Admin
            </a>
            ` : `
            <a href="profile.html#dashboard" role="menuitem" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; color: #e2e8f0; font-size: 13.5px; font-weight: 600; border-radius: 8px; text-decoration: none;">
              <span class="ti-user" style="color: #38bdf8; font-size: 15px;"></span> Profile
            </a>
            <a href="profile.html#payments" role="menuitem" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; color: #e2e8f0; font-size: 13.5px; font-weight: 600; border-radius: 8px; text-decoration: none;">
              <span class="ti-credit-card" style="color: #10b981; font-size: 15px;"></span> Payment
            </a>
            <a href="profile.html#notifications" role="menuitem" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; color: #e2e8f0; font-size: 13.5px; font-weight: 600; border-radius: 8px; text-decoration: none;">
              <span class="ti-bell" style="color: #a855f7; font-size: 15px;"></span> Notifications
            </a>
            <a href="profile.html#security" role="menuitem" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; color: #e2e8f0; font-size: 13.5px; font-weight: 600; border-radius: 8px; text-decoration: none;">
              <span class="ti-settings" style="color: #94a3b8; font-size: 15px;"></span> Settings
            </a>
            `}

            <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 6px 0;"></div>

            <button type="button" data-logout-button role="menuitem" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 12px; color: #f87171; font-size: 13.5px; font-weight: 700; background: transparent; border: none; border-radius: 8px; cursor: pointer; text-align: left;">
              <span class="ti-power-off" style="font-size: 15px;"></span> Sign out
            </button>
          </div>
        </div>
      </div>
    `;
  });

  // Tải dữ liệu thông báo mới nhất từ Backend API
  fetchAndRenderNotifications();
}

// --- Notification Engine Helper Functions ---
let cachedNotificationData = null;

async function fetchAndRenderNotifications() {
  const token = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token");
  if (!token) {
    updateNotificationBadge(0);
    document.querySelectorAll("[data-notification-list]").forEach((el) => {
      el.innerHTML = `
        <div class="notification-empty">
          <div class="empty-icon">🔔</div>
          <p>Vui lòng đăng nhập để xem thông báo cá nhân của bạn!</p>
        </div>
      `;
    });
    return;
  }

  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const res = await fetcher("api/notifications.php");
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.ok) return;

    cachedNotificationData = data;
    window.cachedNotificationData = data;
    updateNotificationBadge(data.unread_count || 0);
    renderNotificationPanelList(data);
    if (typeof window.syncProfileNotificationsUI === "function") {
      window.syncProfileNotificationsUI(data);
    }
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
  }
}

function updateNotificationBadge(unreadCount) {
  document.querySelectorAll("[data-notification-badge]").forEach((badge) => {
    badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
    if (unreadCount <= 0) {
      badge.classList.add("is-hidden");
      badge.style.display = "none";
    } else {
      badge.classList.remove("is-hidden");
      badge.style.display = "inline-flex";
    }
  });
}

function renderSingleNotificationItemHtml(item) {
  const readClass = item.is_read ? "read" : "unread";
  const levelClass = `notif-level-${item.status_level || "info"}`;
  const itemLink = item.link && item.link !== "#" ? escapeHtml(item.link) : "javascript:void(0);";

  return `
    <a class="notification-item ${readClass} ${levelClass}" 
       data-notif-id="${item.id}" 
       href="${itemLink}">
      <span class="notif-status-dot"></span>
      <div class="notif-icon-box">${item.icon || "🔔"}</div>
      <div class="notif-body">
        <div class="notif-item-header">
          <span class="notif-status-tag">${escapeHtml(item.status_tag || "")}</span>
          <span class="notif-time-ago">${escapeHtml(item.time_ago || "")}</span>
        </div>
        <div class="notif-item-title">${escapeHtml(item.title)}</div>
        <div class="notif-item-desc" data-full-msg="${escapeHtml(item.message)}">${escapeHtml(item.message)}</div>
      </div>
    </a>
  `;
}

function renderProfileCardNotificationsHtml(items) {
  if (!items || items.length === 0) {
    return `
      <div style="text-align: center; color: #94a3b8; padding: 32px; font-weight: 600; background: rgba(2, 6, 23, 0.4); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
        <div style="font-size: 28px; margin-bottom: 8px;">🔔</div>
        <p style="margin: 0; color: #e2e8f0;">Lịch sử thông báo trống.</p>
        <small style="color: #64748b;">Tất cả thông báo cá nhân mới sẽ được hiển thị tại đây.</small>
      </div>
    `;
  }

  return items.map((item) => {
    const isUnread = Number(item.is_read) === 0;
    const icon = item.icon || "📢";
    const statusTag = item.status_tag || "Thông báo";

    let statusBadge = `<span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px;">${escapeHtml(statusTag)}</span>`;
    if (isUnread) {
      statusBadge += ` <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px;">● Mới chưa đọc</span>`;
    }

    return `
      <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 12px; padding: 16px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
        <div style="display: flex; gap: 14px; align-items: flex-start;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
            ${icon}
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <strong style="color: #f8fafc; font-size: 15px;">${escapeHtml(item.title)}</strong>
              ${statusBadge}
            </div>
            <p style="color: #cbd5e1; font-size: 13.5px; margin: 2px 0 0 0; line-height: 1.5;">${escapeHtml(item.message)}</p>
            <small style="color: #64748b; font-size: 11.5px; margin-top: 4px;">${item.created_at ? formatDateTime(item.created_at) : (item.time_ago || "Vừa xong")}</small>
          </div>
        </div>
        <button type="button" class="btn-purge-single-notif" data-notif-id="${item.id}" title="Xóa vĩnh viễn khỏi lịch sử" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; flex-shrink: 0;">
          ❌ Xóa vĩnh viễn
        </button>
      </div>
    `;
  }).join("");
}

function renderNotificationPanelList(data) {
  const lists = document.querySelectorAll("[data-notification-list]");
  if (!lists.length) return;

  const items = data.items || [];
  if (!items.length) {
    lists.forEach((el) => {
      if (el.id === "profile-notifications-list") {
        el.innerHTML = renderProfileCardNotificationsHtml([]);
      } else {
        el.innerHTML = `
          <div class="notification-empty">
            <div class="empty-icon">🔔</div>
            <p>Bạn không có thông báo nào!</p>
          </div>
        `;
      }
    });
    return;
  }

  let html = "";
  const grouped = data.grouped || {};
  const groupOrder = ["today", "yesterday", "earlier"];

  groupOrder.forEach((gKey) => {
    const groupData = grouped[gKey];
    if (groupData && Array.isArray(groupData.items) && groupData.items.length > 0) {
      html += `<div class="notification-group-header">${escapeHtml(groupData.label)}</div>`;

      groupData.items.forEach((item) => {
        html += renderSingleNotificationItemHtml(item);
      });
    }
  });

  // Fallback: If grouped loop produced empty string, render all items directly
  if (!html.trim()) {
    html = `<div class="notification-group-header">Thông báo mới nhất</div>`;
    items.forEach((item) => {
      html += renderSingleNotificationItemHtml(item);
    });
  }

  lists.forEach((el) => {
    if (el.id === "profile-notifications-list") {
      el.innerHTML = renderProfileCardNotificationsHtml(items);
    } else {
      el.innerHTML = html;
    }
  });

  // Attach Hover Pop-up Card Listeners for Full Messages
  document.querySelectorAll(".notification-item").forEach((itemEl) => {
    itemEl.addEventListener("mouseenter", (e) => {
      let card = document.getElementById("notif-hover-card");
      if (!card) {
        card = document.createElement("div");
        card.id = "notif-hover-card";
        card.className = "notif-hover-card";
        document.body.appendChild(card);
      }
      const title = itemEl.querySelector(".notif-item-title")?.textContent || "";
      const message = itemEl.querySelector(".notif-item-desc")?.getAttribute("data-full-msg") || itemEl.querySelector(".notif-item-desc")?.textContent || "";

      card.innerHTML = `
        <div class="notif-hover-title">${escapeHtml(title)}</div>
        <div class="notif-hover-body">${escapeHtml(message)}</div>
      `;

      const rect = itemEl.getBoundingClientRect();
      card.style.left = Math.max(10, Math.min(rect.left - 220, window.innerWidth - 340)) + "px";
      card.style.top = Math.max(10, rect.top) + "px";
      card.classList.add("is-visible");
    });

    itemEl.addEventListener("mouseleave", () => {
      const card = document.getElementById("notif-hover-card");
      if (card) {
        card.classList.remove("is-visible");
      }
    });
  });
}

async function handleNotificationItemClick(itemEl, event) {
  const notifId = itemEl.getAttribute("data-notif-id");
  const isUnread = itemEl.classList.contains("unread");

  if (isUnread && notifId) {
    itemEl.classList.remove("unread");
    itemEl.classList.add("read");

    try {
      const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
      const resp = await fetcher("api/notifications.php?action=mark_read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: parseInt(notifId, 10) })
      });
      const resData = await resp.json();
      if (resData && typeof resData.unread_count === "number") {
        updateNotificationBadge(resData.unread_count);
      }
    } catch (e) {
      console.error("Error marking read:", e);
    }
  }
}

async function markAllNotificationsAsRead() {
  document.querySelectorAll(".notification-item.unread").forEach((el) => {
    el.classList.remove("unread");
    el.classList.add("read");
  });
  updateNotificationBadge(0);

  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    await fetcher("api/notifications.php?action=mark_read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 0 })
    });
    fetchAndRenderNotifications();
  } catch (e) {
    console.error("Error marking all read:", e);
  }
}

async function deleteAllNotifications() {
  if (!confirm("Bạn có chắc chắn muốn xóa tất cả thông báo không?")) return;

  document.querySelectorAll("[data-notification-list]").forEach((el) => {
    el.innerHTML = `
      <div class="notification-empty">
        <div class="empty-icon">🗑️</div>
        <p>Đã xóa tất cả thông báo!</p>
      </div>
    `;
  });
  updateNotificationBadge(0);

  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    await fetcher("api/notifications.php?action=delete_all", {
      method: "POST"
    });
    fetchAndRenderNotifications();
  } catch (e) {
    console.error("Error deleting notifications:", e);
  }
}

function bindAuthNavInteractions() {
  if (window.engWithMeAuthNavBound) return;
  window.engWithMeAuthNavBound = true;

  document.addEventListener("click", (event) => {
    const menuToggle = event.target.closest("[data-user-menu-toggle]");
    const logoutButton = event.target.closest("[data-logout-button]");
    const notifToggle = event.target.closest("[data-notification-toggle]");
    const markReadBtn = event.target.closest("[data-mark-all-read]");
    const deleteAllBtn = event.target.closest("[data-delete-all-notif]");
    const notifSettingsBtn = event.target.closest("[data-notif-settings]");
    const notifItem = event.target.closest(".notification-item");

    if (markReadBtn) {
      event.preventDefault();
      markAllNotificationsAsRead();
      return;
    }

    if (deleteAllBtn) {
      event.preventDefault();
      deleteAllNotifications();
      return;
    }

    if (notifSettingsBtn) {
      event.preventDefault();
      alert("⚙ Cài đặt thông báo: Bạn đang bật nhận tất cả thông báo học tập, kết quả bài thi và ưu đãi VIP.");
      return;
    }

    if (notifItem) {
      handleNotificationItemClick(notifItem, event);
      // Let standard link navigation proceed if item has href
    }

    if (notifToggle) {
      event.preventDefault();
      event.stopPropagation();
      const notifWrapper = notifToggle.closest("[data-notification-dropdown]");
      const panel = notifWrapper?.querySelector("[data-notification-panel]");
      if (panel) {
        const isShown = panel.classList.contains("is-open");
        document.querySelectorAll("[data-notification-panel].is-open").forEach((p) => p.classList.remove("is-open"));
        closeUserMenus();
        if (!isShown) {
          panel.classList.add("is-open");
          fetchAndRenderNotifications();
        }
      }
      return;
    }

    if (!event.target.closest("[data-notification-dropdown]")) {
      document.querySelectorAll("[data-notification-panel].is-open").forEach((p) => p.classList.remove("is-open"));
    }

    if (logoutButton) {
      event.preventDefault();
      event.stopPropagation();
      logoutAuthenticatedUser();
      return;
    }

    if (menuToggle) {
      event.preventDefault();
      document.querySelectorAll("[data-notification-panel].is-open").forEach((p) => p.classList.remove("is-open"));
      const menu = menuToggle.closest("[data-user-menu]");
      const willOpen = !menu?.classList.contains("is-open");
      closeUserMenus();
      if (menu && willOpen) {
        menu.classList.add("is-open");
        menuToggle.setAttribute("aria-expanded", "true");
      }
      return;
    }

    if (!event.target.closest("[data-user-menu]")) {
      closeUserMenus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeUserMenus();
  });
}

function closeUserMenus() {
  document.querySelectorAll("[data-user-menu].is-open").forEach((menu) => {
    menu.classList.remove("is-open");
    menu.querySelector("[data-user-menu-toggle]")?.setAttribute("aria-expanded", "false");
  });
}

async function logoutAuthenticatedUser() {
  clearAuthUser();

  try {
    if (typeof window.fetchAuth === "function") {
      await window.fetchAuth("auth/logout.php", {
        method: "POST",
        cache: "no-store"
      });
    } else {
      await fetch(window.resolveApiUrl("auth/logout.php"), {
        method: "POST",
        credentials: "include",
        cache: "no-store"
      });
    }
  } catch (error) {
    console.warn("Logout API failed:", error);
  }

  clearAuthUser();
  window.location.replace("login.html");
}

function getCachedAuthUser() {
  const id = localStorage.getItem("engWithMeUserId");
  const name = localStorage.getItem("engWithMeStudentName");
  const email = localStorage.getItem("engWithMeUserEmail");
  const token = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token");
  if (!email && !name && !id) return null;

  const hasPassLocal = localStorage.getItem("engWithMeUserHasPassword");
  const hasPasswordVal = hasPassLocal === "1" ? 1 : (hasPassLocal === "0" ? 0 : undefined);

  return {
    id: id || "user",
    name: name || email || "Học viên",
    email: email || "",
    role: localStorage.getItem("engWithMeUserRole") || "user",
    level: localStorage.getItem("engWithMeLevel") || "A1",
    goal: localStorage.getItem("engWithMeGoal") || "",
    status: localStorage.getItem("engWithMeUserStatus") || "active",
    avatar: localStorage.getItem("engWithMeUserAvatar") || "",
    is_vip: localStorage.getItem("engWithMeUserIsVip") || "0",
    vip_expires_at: localStorage.getItem("engWithMeUserVipExpires") || null,
    has_password: hasPasswordVal
  };
}

function showVipUpgradeModal(featureName = "chế độ KHÓ (HARD Mode)") {
  const existingModal = document.getElementById("vip-upgrade-modal");
  if (existingModal) existingModal.remove();

  const modalHtml = `
    <div id="vip-upgrade-modal" style="position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 20px; animation: fadeIn 0.25s ease;">
      <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 2px solid #10b981; border-radius: 20px; max-width: 440px; width: 100%; padding: 28px 24px; text-align: center; box-shadow: 0 0 35px rgba(16, 185, 129, 0.4), 0 20px 50px rgba(0,0,0,0.6); position: relative;">
        <button type="button" onclick="document.getElementById('vip-upgrade-modal').remove()" style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; line-height: 1;">&times;</button>
        <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px auto; font-size: 2.2rem; color: #00ff87; box-shadow: 0 0 25px rgba(16, 185, 129, 0.5);">
          🔒
        </div>
        <h3 style="color: #ffffff; margin: 0 0 10px 0; font-size: 1.4rem; font-weight: 800;">Tính Năng Dành Cho Học Viên PRO / PREMIUM</h3>
        <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">
          Vui lòng nâng cấp gói <strong style="color: #00ff87;">Pro</strong> hoặc <strong style="color: #fbbf24;">Premium</strong> để mở khóa <strong style="color: #00ff87;">${featureName}</strong> trong phần Luyện nghe!
        </p>
        <div style="display: flex; gap: 12px;">
          <button type="button" onclick="document.getElementById('vip-upgrade-modal').remove()" style="flex: 1; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: #cbd5e1; font-weight: 700; cursor: pointer;">Để Sau</button>
          <button type="button" onclick="window.location.href='pricing.html'" style="flex: 1.5; padding: 12px; border-radius: 12px; border: none; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-weight: 800; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.4);">⚡ Nâng Cấp Ngay</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
}
window.showVipUpgradeModal = showVipUpgradeModal;

function persistAuthUser(user) {
  if (!user) return;
  const name = user.name || user.full_name || "";
  const goal = user.goal || user.learning_goal || "";
  const avatar = user.avatar || user.avatar_path || "";
  const isVip = user.is_vip == 1 || user.is_vip === true ? "1" : "0";
  const vipExpires = user.vip_expires_at || "";

  localStorage.setItem("engWithMeUserId", String(user.id || ""));
  localStorage.setItem("engWithMeStudentName", name);
  localStorage.setItem("engWithMeUserEmail", user.email || "");
  localStorage.setItem("engWithMeUserRole", user.role || "user");
  localStorage.setItem("engWithMeLevel", user.level || "A1");
  localStorage.setItem("engWithMeGoal", goal);
  localStorage.setItem("engWithMeUserStatus", user.status || "active");
  localStorage.setItem("engWithMeUserAvatar", avatar);
  localStorage.setItem("engWithMeUserIsVip", isVip);
  localStorage.setItem("engWithMeUserVipExpires", vipExpires);
  if (user.has_password !== undefined && user.has_password !== null) {
    const hasPassVal = (user.has_password === 1 || user.has_password === true || user.has_password === "1") ? "1" : "0";
    localStorage.setItem("engWithMeUserHasPassword", hasPassVal);
  }
  if (user.session_token || user.remember_token) {
    localStorage.setItem("engWithMeAuthToken", String(user.session_token || user.remember_token));
  }

  if (typeof AppCache !== "undefined" && AppCache.set) {
    AppCache.set("me", { ok: true, user: { ...user, name, goal, avatar, is_vip: isVip, vip_expires_at: vipExpires } });
  }

  if (typeof renderAuthenticatedNav === "function") {
    renderAuthenticatedNav({ ...user, name, goal, avatar, is_vip: isVip, vip_expires_at: vipExpires });
  }
}

function clearAuthUser() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("engWithMe") || key.startsWith("ewm_") || key.startsWith("progress_") || key.startsWith("vocab_"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.push("user_id"); // Legacy key
    
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {}

  if (typeof AppCache !== "undefined" && AppCache.clear) {
    AppCache.clear();
  }

  document.cookie = "ewm_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.tungf.io.vn;";
}

function redirectAuthPages(user, isCached = false) {
  const currentPage = getCurrentPage();
  if (!["login.html", "register.html"].includes(currentPage)) return;
  // NEVER perform automatic redirect from login/register pages based on client-side cache!
  // Only redirect if live server response from api/me.php confirms an active session.
  if (isCached) return;
  window.location.href = "index.html";
}

function getCurrentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function getAvatarMarkup(user, className = "user-avatar") {
  const name = user?.name || user?.email || "U";
  const avatar = user?.avatar || "";
  if (avatar) {
    return `<span class="${className} has-image"><img src="${escapeAttribute(avatar)}" alt="Ảnh đại diện của ${escapeAttribute(name)}"></span>`;
  }

  return `<span class="${className}" aria-hidden="true">${escapeHtml(getInitials(name))}</span>`;
}

function renderAvatarTarget(target, user) {
  const element = typeof target === "string" ? document.querySelector(target) : target;
  if (!element) return;

  const avatar = user?.avatar || "";
  element.classList.toggle("has-image", Boolean(avatar));
  element.innerHTML = avatar
    ? `<img src="${escapeAttribute(avatar)}" alt="Ảnh đại diện của ${escapeAttribute(user?.name || "tài khoản")}">`
    : escapeHtml(getInitials(user?.name || user?.email || "U"));
}

function renderAvatarTargets(selector, user) {
  document.querySelectorAll(selector).forEach((element) => renderAvatarTarget(element, user));
}

function getInitials(name) {
  const cleanStr = String(name || "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
  const parts = cleanStr.split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

function getAccountKey(baseKey) {
  const userId = localStorage.getItem("engWithMeUserId");
  return userId ? `${baseKey}_user_${userId}` : `${baseKey}_guest`;
}
window.getAccountKey = getAccountKey;

function getSavedWords() {
  return JSON.parse(localStorage.getItem(getAccountKey("engWithMeSavedWords")) || "[]");
}
function setSavedWords(words) {
  localStorage.setItem(getAccountKey("engWithMeSavedWords"), JSON.stringify(words));
}
function updateSavedCount() {
  const count = getSavedWords().length;
  document.querySelectorAll("[data-saved-count]").forEach((element) => {
    element.textContent = `${count} từ đã lưu`;
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
function initLogoutButtons() {
  if (typeof bindAuthNavInteractions === "function") bindAuthNavInteractions();
}

function isUserVip() {
  const cachedUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
  if (cachedUser) {
    if (cachedUser.is_vip == 1 || cachedUser.is_vip === true || cachedUser.role === 'admin') return true;
  }
  const isVipLocal = localStorage.getItem("engWithMeUserIsVip");
  const isRoleLocal = localStorage.getItem("engWithMeUserRole");
  return isVipLocal === "1" || isVipLocal === "true" || isRoleLocal === "admin";
}

function showVipLockModal(sectionName = "nội dung Khó (Hard Mode)") {
  let modal = document.getElementById("vip-lock-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "vip-lock-modal";
    modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px;";
    modal.innerHTML = `
      <div style="background: #0f172a; border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 20px; max-width: 440px; width: 100%; padding: 28px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8); position: relative;">
        <button type="button" onclick="document.getElementById('vip-lock-modal').style.display='none'" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.1); border: none; color: #94a3b8; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">✕</button>
        <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 1.8rem; color: #f87171;">🔒</div>
        <h3 style="color: #ffffff; font-size: 1.35rem; font-weight: 800; margin: 0 0 10px 0;">Yêu Cầu Nâng Cấp VIP</h3>
        <p style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.6; margin-bottom: 20px;">
          Nội dung (<strong id="vip-lock-target">${escapeHtml(sectionName)}</strong>) chỉ dành riêng cho học viên đã nâng cấp gói <strong>Pro (7.777đ)</strong> hoặc <strong>Premium (999.999đ Trọn Đời)</strong>.
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <a href="pricing.html" class="btn btn-primary" style="padding: 12px; font-weight: 800; border-radius: 10px; width: 100%;">⚡ Nâng cấp VIP Ngay (Từ 7.777đ)</a>
          <button type="button" onclick="document.getElementById('vip-lock-modal').style.display='none'" class="btn btn-ghost" style="color: #94a3b8;">Đóng</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    const targetEl = modal.querySelector("#vip-lock-target");
    if (targetEl) targetEl.textContent = sectionName;
    modal.style.display = "flex";
  }
}

function checkHardModeAccess(e, targetSectionName = "nội dung Khó (Hard Mode)") {
  if (isUserVip()) return true;

  if (e && typeof e.preventDefault === "function") {
    e.preventDefault();
    e.stopPropagation();
  }

  showVipLockModal(targetSectionName);
  return false;
}

function handleGoogleOAuthClick(event) {
  if (event) event.preventDefault();

  if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
    try {
      google.accounts.id.initialize({
        client_id: "992122170428-ookq5v3r930tqkgh24pccp2nsb18b1rj.apps.googleusercontent.com",
        callback: async (response) => {
          if (response && response.credential) {
            try {
              const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
              const res = await fetcher("api/google_callback.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ credential: response.credential })
              });
              const data = await res.json();
              if (data && data.ok && data.token) {
                localStorage.setItem("engWithMeAuthToken", data.token);
                localStorage.setItem("ewm_token", data.token);
                if (data.user && typeof persistAuthUser === "function") persistAuthUser(data.user);
                window.location.href = "profile.html#dashboard";
              }
            } catch (err) {
              console.error("Google Auth error:", err);
            }
          }
        }
      });
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          window.location.href = window.resolveApiUrl ? window.resolveApiUrl('auth/google_login.php') : 'api/google_login.php';
        }
      });
      return;
    } catch (e) {
      console.warn("GIS Init fallback:", e);
    }
  }

  window.location.href = window.resolveApiUrl ? window.resolveApiUrl('auth/google_login.php') : 'api/google_login.php';
}
window.handleGoogleOAuthClick = handleGoogleOAuthClick;

/* ==========================================================================
   Smart Polling Background Auto-Refresh (Option 1 Implementation)
   Silently updates Notifications 🔔, Leaderboard (BXH) 🏆, Blog Views 📖 & Admin Stats 📊
   without triggering page reloads or Ctrl+F5.
   ========================================================================== */

function initSmartPollingLoop() {
  const POLLING_INTERVAL_MS = 10000; // Auto refresh every 10 seconds

  async function performSilentRefresh() {
    // 1. Skip refresh if user is viewing another tab or browser is minimized
    if (document.hidden) return;

    try {
      // 2. Silently update Notification Bell & Panel if logged in
      const cachedUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
      if (cachedUser && typeof fetchAndRenderNotifications === "function") {
        await fetchAndRenderNotifications();
      }

      // 3. Silently update Leaderboard (BXH) if present on page
      if (typeof renderLeaderboard === "function" && (document.getElementById("blog-leaderboard-list") || document.querySelector("[data-leaderboard-list]"))) {
        await renderLeaderboard();
      }

      // 4. Silently update Admin Statistics & User Table if on admin page
      if (typeof fetchAndRenderAdminReports === "function" && document.querySelector("[data-admin-dashboard]")) {
        const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
        const res = await fetcher("api/admin_users.php");
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok && typeof renderAdminDashboard === "function") {
            renderAdminDashboard(document.querySelector("[data-admin-dashboard]"), data);
          }
        }
      }
    } catch (err) {
      // Silent catch: network passes do not disrupt user interaction
    }
  }

  // Fire an immediate refresh when user switches back to this tab
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      performSilentRefresh();
    }
  });

// Start background interval loop
  setInterval(performSilentRefresh, POLLING_INTERVAL_MS);
}

/* Global Event Delegation for Password Toggle Eye Button across all pages */
document.addEventListener("click", function (e) {
  const toggleBtn = e.target.closest(".toggle-password");
  if (!toggleBtn) return;

  const wrapper = toggleBtn.closest(".input-password-wrapper") || toggleBtn.parentElement;
  if (!wrapper) return;

  const input = wrapper.querySelector("input");
  if (!input) return;

  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  if (isPassword) {
    toggleBtn.classList.remove("ti-eye");
    toggleBtn.classList.add("ti-close");
    toggleBtn.style.color = "#00f0ff";
  } else {
    toggleBtn.classList.remove("ti-close");
    toggleBtn.classList.add("ti-eye");
    toggleBtn.style.color = "";
  }
});

// Automatically start smart polling when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSmartPollingLoop);
} else {
  initSmartPollingLoop();
}

