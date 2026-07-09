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
    { href: "exam-practice.html", label: "Exam" },
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
    let activeLink = null;
    const activePage = currentPage === "vocabulary-study.html" ? "vocabulary.html" : currentPage;

    const updateIndicator = (target) => {
      if (target) {
        nav.style.setProperty("--nav-indicator-x", `${target.offsetLeft}px`);
        nav.style.setProperty("--nav-indicator-y", `${target.offsetTop}px`);
        nav.style.setProperty("--nav-indicator-w", `${target.offsetWidth}px`);
        nav.style.setProperty("--nav-indicator-h", `${target.offsetHeight}px`);
        nav.style.setProperty("--nav-indicator-opacity", "1");
      } else {
        nav.style.setProperty("--nav-indicator-opacity", "0");
      }
    };

    links.forEach((link) => {
      const href = link.getAttribute("href");
      const linkPage = href.split("#")[0];
      if (href === activePage || linkPage === activePage) {
        link.classList.add("is-active");
        activeLink = link;
      }

      link.addEventListener("mouseenter", () => updateIndicator(link));
    });

    nav.addEventListener("mouseleave", () => updateIndicator(activeLink));

    // Initial position
    setTimeout(() => updateIndicator(activeLink), 50);
  });
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

  fetch("api/me.php", { credentials: "same-origin" })
    .then((response) => response.ok ? response.json() : Promise.reject(response))
    .then((result) => {
      if (!result.ok || !result.user) throw new Error("Unauthenticated");
      persistAuthUser(result.user);
      renderAuthenticatedNav(result.user);
      redirectAuthPages(result.user);
      syncUserDataFromServer().then(() => {
        refreshPageAfterUserDataSync();
      });
    })
    .catch(() => {
      clearAuthUser();
      renderGuestNav();
    });
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

async function syncUserDataFromServer() {
  const userId = localStorage.getItem("engWithMeUserId");
  if (!userId) return;

  try {
    // 1. Sync Vocab & Viewed Topics
    const vocabRes = await fetch("api/sync_vocab.php", { credentials: "same-origin" });
    if (vocabRes.ok) {
      const vocabData = await vocabRes.json();
      if (vocabData.ok) {
        localStorage.setItem(
          `engWithMeSavedVocabularyWords_user_${userId}`,
          JSON.stringify(vocabData.saved || [])
        );
        localStorage.setItem(
          `engWithMeViewedTopics_user_${userId}`,
          JSON.stringify(vocabData.viewed || [])
        );
      }
    }

    // 2. Sync Course Progress
    const progRes = await fetch("api/sync_progress.php", { credentials: "same-origin" });
    if (progRes.ok) {
      const progData = await progRes.json();
      if (progData.ok) {
        localStorage.setItem(
          `engWithMeProgress_user_${userId}`,
          JSON.stringify(progData.progress || [])
        );
      }
    }

    // 3. Sync Vocabulary Quiz Stats
    const quizRes = await fetch("api/sync_quiz.php", { credentials: "same-origin" });
    if (quizRes.ok) {
      const quizData = await quizRes.json();
      if (quizData.ok && quizData.stats) {
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
    }
  } catch (error) {
    console.error("Failed to sync user data from server:", error);
  }
}

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
