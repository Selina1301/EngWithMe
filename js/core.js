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
        ["dashboard.html", "ti-dashboard", "Dashboard"]
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

  // Kiểm tra nhanh cookie đăng nhập trước khi gọi API để tiết kiệm tài nguyên
  const hasCookie = document.cookie.split(';').some((item) => item.trim().startsWith('ewm_logged_in='));
  if (!hasCookie) {
    clearAuthUser();
    renderGuestNav();
    return;
  }

  const cachedUser = getCachedAuthUser();
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
    redirectAuthPages(result.user);
    
    // Tải dữ liệu tương thích dựa theo Route
    triggerRouteBasedFetch();
  }, { ttl: 10 * 60 * 1000 });
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
  if (header.querySelector(".nav-actions")) return;

  const actions = document.createElement("div");
  actions.className = "nav-actions";
  header.appendChild(actions);
}

function renderGuestNav() {
  const currentPage = getCurrentPage();
  const authPages = ["login.html", "register.html"];
  if (authPages.includes(currentPage)) return;

  document.querySelectorAll(".nav-actions").forEach((actions) => {
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

  document.querySelectorAll(".nav-actions").forEach((actions) => {
    actions.innerHTML = `
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
          <a href="${dashboardHref}" role="menuitem"><span class="ti-dashboard"></span> Dashboard</a>
          ${adminLink}
          <button type="button" data-logout-button role="menuitem"><span class="ti-power-off"></span> Đăng xuất</button>
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

    if (logoutButton) {
      event.preventDefault();
      event.stopPropagation();
      logoutAuthenticatedUser();
      return;
    }

    if (menuToggle) {
      event.preventDefault();
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
  try {
    await fetch("api/logout.php", {
      method: "POST",
      credentials: "same-origin"
    });
  } catch (error) {
    // Local state is still cleared so the UI cannot keep showing a stale user.
  }

  clearAuthUser();
  window.location.href = "login.html";
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
    avatar: localStorage.getItem("engWithMeUserAvatar") || ""
  };
}

function persistAuthUser(user) {
  if (!user) return;
  localStorage.setItem("engWithMeUserId", String(user.id || ""));
  localStorage.setItem("engWithMeStudentName", user.name || "");
  localStorage.setItem("engWithMeUserEmail", user.email || "");
  localStorage.setItem("engWithMeUserRole", user.role || "user");
  localStorage.setItem("engWithMeLevel", user.level || "A1");
  localStorage.setItem("engWithMeGoal", user.goal || "");
  localStorage.setItem("engWithMeUserStatus", user.status || "active");
  localStorage.setItem("engWithMeUserAvatar", user.avatar || "");
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
    "engWithMeUserAvatar"
  ].forEach((key) => localStorage.removeItem(key));
}

function redirectAuthPages(user) {
  const currentPage = getCurrentPage();
  if (!["login.html", "register.html"].includes(currentPage)) return;
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
