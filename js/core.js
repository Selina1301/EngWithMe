function setCurrentYear() {
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
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
          <a href="blog.html" aria-label="Facebook"><span class="ti-facebook"></span></a>
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
        ["about.html#support", "ti-help-alt", "Trung tâm hỗ trợ"],
        ["pricing.html", "ti-credit-card", "Gói Premium"],
        ["about.html#contact", "ti-email", "Liên hệ"]
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
        <a href="about.html#terms">Điều khoản</a>
        <a href="about.html#privacy">Bảo mật</a>
        <a href="about.html#contact">Liên hệ</a>
      </nav>
      <p class="footer-made">© <span data-current-year></span> EngWithMe. Made in Vietnam.</p>
    </section>
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

async function fetchWithSWR(url, cacheKey, onDataReady, options = {}) {
  const cachedData = AppCache.get(cacheKey);
  const isInvalid = AppCache.isInvalid(cacheKey);
  const lastSync = AppCache.getLastSyncTime(cacheKey);
  const now = Date.now();
  const cacheDuration = options.ttl || 2 * 60 * 1000; // Mặc định 2 phút

  // 1. Trả về cache ngay lập tức nếu có
  if (cachedData) {
    onDataReady(cachedData, true);
  }

  // 2. Chạy ngầm nếu chưa có cache, cache bị invalid, hoặc quá thời gian cacheDuration
  const expired = now - lastSync > cacheDuration;
  if (!cachedData || expired || isInvalid) {
    try {
      const response = await fetch(url, { credentials: "same-origin", ...options.fetchOptions });
      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          const hasChanged = JSON.stringify(cachedData) !== JSON.stringify(result);
          AppCache.set(cacheKey, result);
          if (hasChanged || !cachedData) {
            onDataReady(result, false);
          }
        }
      }
    } catch (error) {
      console.warn(`SWR background fetch failed for ${url}:`, error);
    }
  }
}

function initAuthNav() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  ensureNavActions(header);
  bindAuthNavInteractions();

  // If URL has login parameter or payment=success parameter, flush stale user cache completely
  const isFreshLogin = window.location.search.includes("login=") || window.location.search.includes("payment=success");
  if (isFreshLogin) {
    if (typeof AppCache !== "undefined" && AppCache.invalidate) {
      AppCache.invalidate("me");
      if (AppCache.memoryStore) AppCache.memoryStore.clear();
    }
    localStorage.removeItem("ewm_cache_me");
    localStorage.removeItem("engWithMeUserId");
    localStorage.removeItem("engWithMeStudentName");
    localStorage.removeItem("engWithMeUserEmail");
    localStorage.removeItem("engWithMeUserAvatar");
    localStorage.removeItem("engWithMeAuthToken");
  }

  // Kiểm tra nhanh cache đăng nhập trước khi gọi API me.php
  const cachedUser = !isFreshLogin ? getCachedAuthUser() : null;
  if (cachedUser) {
    renderAuthenticatedNav(cachedUser);
  }

  // Fetch me.php using SWR (10 phút cache cho trạng thái đăng nhập)
  fetchWithSWR("api/me.php", "me", (result, isCached) => {
    if (!result.ok || !result.user) {
      clearAuthUser();
      renderGuestNav();
      return;
    }
    persistAuthUser(result.user);
    renderAuthenticatedNav(result.user);
    redirectAuthPages(result.user, isCached);
    
    // Tải dữ liệu tương thích dựa theo Route
    triggerRouteBasedFetch();
  }, { ttl: 0 });
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
      localStorage.setItem(
        `engWithMeProgress_user_${userId}`,
        JSON.stringify(progData.progress || [])
      );
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
  const currentPage = getCurrentPage();
  const authPages = ["login.html", "register.html"];
  if (authPages.includes(currentPage)) return;

  document.querySelectorAll(".nav-actions, .auth-buttons, #auth-actions").forEach((actions) => {
    actions.innerHTML = `
      <a class="btn btn-ghost" href="login.html">Đăng nhập</a>
      <a class="btn btn-primary" href="register.html">Đăng ký</a>
    `;
  });
}

function renderAuthenticatedNav(user) {
  const dashboardHref = user.role === "admin" ? "admin.html" : "profile.html#dashboard";
  const roleLabel = user.role === "admin" ? "Admin" : (user.level || "User");
  const adminLink = user.role === "admin"
    ? '<a href="admin.html"><span class="ti-shield"></span> Quản trị</a>'
    : "";

  document.querySelectorAll(".nav-actions, .auth-buttons, #auth-actions").forEach((actions) => {
    actions.innerHTML = `
      <div class="user-nav-wrapper" style="display: flex; align-items: center; gap: 12px;">
        <!-- Notification Bell Button & Popover -->
        <div class="notification-dropdown" data-notification-dropdown style="position: relative;">
          <button type="button" class="notification-bell-btn" data-notification-toggle style="position: relative; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.12); color: #cbd5e1; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; font-size: 1.15rem;" title="Thông báo hệ thống">
            <span class="ti-bell"></span>
            <span class="notification-badge" data-notification-badge style="position: absolute; top: 0px; right: 0px; background: #ef4444; color: #ffffff; font-size: 0.68rem; font-weight: 800; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #0f172a; box-shadow: 0 0 10px rgba(239,68,68,0.8);">3</span>
          </button>

          <!-- Notification Popover Menu -->
          <div class="notification-panel" data-notification-panel style="display: none; position: absolute; right: 0; top: calc(100% + 12px); width: 340px; background: #1e293b; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); z-index: 1000; overflow: hidden; backdrop-filter: blur(12px); animation: fadeIn 0.2s ease;">
            <div style="padding: 14px 18px; background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between;">
              <h4 style="margin: 0; color: #ffffff; font-size: 0.95rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                <span class="ti-bell" style="color: #38bdf8;"></span> Thông Báo Hệ Thống
              </h4>
              <button type="button" data-mark-all-read style="background: none; border: none; color: #38bdf8; font-size: 0.78rem; font-weight: 700; cursor: pointer;">Đánh dấu đã đọc</button>
            </div>

            <div class="notification-list" style="max-height: 320px; overflow-y: auto; padding: 6px 0;">
              <div class="notification-item unread" style="padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; gap: 12px; transition: background 0.2s ease; cursor: pointer; background: rgba(56, 189, 248, 0.06);">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; display: flex; align-items: center; justify-content: center; color: #00ff87; font-size: 1rem; flex-shrink: 0;">⚡</div>
                <div style="flex: 1;">
                  <div style="font-size: 0.85rem; font-weight: 700; color: #ffffff; margin-bottom: 2px;">Nâng cấp VIP Ưu Đãi!</div>
                  <div style="font-size: 0.78rem; color: #94a3b8; line-height: 1.4;">Gói Pro chỉ 7.777đ/tháng mở khóa toàn bộ chế độ KHÓ Luyện nghe & Từ vựng.</div>
                  <div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;">10 phút trước</div>
                </div>
              </div>

              <div class="notification-item unread" style="padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; gap: 12px; transition: background 0.2s ease; cursor: pointer; background: rgba(56, 189, 248, 0.06);">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 1rem; flex-shrink: 0;">🎧</div>
                <div style="flex: 1;">
                  <div style="font-size: 0.85rem; font-weight: 700; color: #ffffff; margin-bottom: 2px;">78 Bài Luyện Nghe Mới</div>
                  <div style="font-size: 0.78rem; color: #94a3b8; line-height: 1.4;">Hệ thống vừa cập nhật danh sách bài luyện nghe chuẩn giọng Mỹ & Anh!</div>
                  <div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;">1 giờ trước</div>
                </div>
              </div>

              <div class="notification-item unread" style="padding: 12px 18px; display: flex; gap: 12px; transition: background 0.2s ease; cursor: pointer; background: rgba(56, 189, 248, 0.06);">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-size: 1rem; flex-shrink: 0;">🎉</div>
                <div style="flex: 1;">
                  <div style="font-size: 0.85rem; font-weight: 700; color: #ffffff; margin-bottom: 2px;">Chào mừng Học viên!</div>
                  <div style="font-size: 0.78rem; color: #94a3b8; line-height: 1.4;">Chúc bạn có một hành trình bứt phá tiếng Anh thành công rực rỡ cùng EngWithMe.</div>
                  <div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;">Hôm nay</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Menu Dropdown -->
        <div class="user-menu" data-user-menu>
          <button class="user-menu-trigger" type="button" data-user-menu-toggle aria-haspopup="true" aria-expanded="false">
            ${getAvatarMarkup(user, "user-avatar")}
            <span class="user-menu-meta">
              <strong>${escapeHtml(user.name || "Tài khoản")}</strong>
              <small>${escapeHtml(roleLabel)}</small>
            </span>
            <span class="ti-angle-down user-menu-caret"></span>
          </button>
          <div class="user-menu-panel" role="menu">
            <a href="profile.html" role="menuitem"><span class="ti-user"></span> Hồ sơ cá nhân</a>
            ${adminLink}
            <button type="button" data-logout-button role="menuitem"><span class="ti-power-off"></span> Đăng xuất</button>
          </div>
        </div>
      </div>
    `;
  });
}

function bindAuthNavInteractions() {
  if (window.engWithMeAuthNavBound) return;
  window.engWithMeAuthNavBound = true;

  document.addEventListener("click", (event) => {
    const menuToggle = event.target.closest("[data-user-menu-toggle]");
    const logoutButton = event.target.closest("[data-logout-button]");
    const notifToggle = event.target.closest("[data-notification-toggle]");
    const markReadBtn = event.target.closest("[data-mark-all-read]");

    if (markReadBtn) {
      event.preventDefault();
      const notifWrapper = markReadBtn.closest("[data-notification-dropdown]");
      if (notifWrapper) {
        const badge = notifWrapper.querySelector("[data-notification-badge]");
        if (badge) badge.style.display = "none";
        const items = notifWrapper.querySelectorAll(".notification-item");
        items.forEach((item) => item.style.background = "none");
      }
      return;
    }

    if (notifToggle) {
      event.preventDefault();
      event.stopPropagation();
      const notifWrapper = notifToggle.closest("[data-notification-dropdown]");
      const panel = notifWrapper?.querySelector("[data-notification-panel]");
      if (panel) {
        const isShown = panel.style.display === "block";
        document.querySelectorAll("[data-notification-panel]").forEach((p) => p.style.display = "none");
        closeUserMenus();
        if (!isShown) {
          panel.style.display = "block";
        }
      }
      return;
    }

    if (!event.target.closest("[data-notification-dropdown]")) {
      document.querySelectorAll("[data-notification-panel]").forEach((p) => p.style.display = "none");
    }

    if (logoutButton) {
      event.preventDefault();
      event.stopPropagation();
      logoutAuthenticatedUser();
      return;
    }

    if (menuToggle) {
      event.preventDefault();
      document.querySelectorAll("[data-notification-panel]").forEach((p) => p.style.display = "none");
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
    await fetch("api/logout.php", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store"
    });
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
  if (!id && !name && !email) return null;

  return {
    id,
    name,
    email,
    role: localStorage.getItem("engWithMeUserRole") || "user",
    level: localStorage.getItem("engWithMeLevel") || "A1",
    goal: localStorage.getItem("engWithMeGoal") || "",
    status: localStorage.getItem("engWithMeUserStatus") || "active",
    avatar: localStorage.getItem("engWithMeUserAvatar") || "",
    is_vip: localStorage.getItem("engWithMeUserIsVip") || "0",
    vip_expires_at: localStorage.getItem("engWithMeUserVipExpires") || null
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
  [
    "engWithMeStudentName",
    "engWithMeGoal",
    "engWithMeLevel",
    "engWithMeUserEmail",
    "engWithMeUserRole",
    "engWithMeUserStatus",
    "engWithMeUserId",
    "engWithMeUserAvatar",
    "engWithMeUserIsVip",
    "engWithMeUserVipExpires"
  ].forEach((key) => localStorage.removeItem(key));

  if (typeof AppCache !== "undefined" && AppCache.clear) {
    AppCache.clear();
  }

  document.cookie = "ewm_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "ewm_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
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
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
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
  if (!cachedUser) return false;
  return cachedUser.is_vip == 1 || cachedUser.is_vip === true || cachedUser.role === 'admin';
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
          Chế độ Khó (<strong id="vip-lock-target">${escapeHtml(sectionName)}</strong>) chỉ dành riêng cho học viên đã nâng cấp gói <strong>Pro (7.777đ)</strong> hoặc <strong>Premium (999.999đ Trọn Đời)</strong>.
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
