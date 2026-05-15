function setCurrentYear() {
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}
function setActiveNav() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const mainNavItems = [
    { href: "index.html", label: "Trang chủ" },
    { href: "vocabulary.html", label: "Từ vựng" },
    { href: "reading.html", label: "Đọc" },
    { href: "grammar.html", label: "Ngữ pháp" },
    { href: "quiz.html", label: "Đề thi" },
    { href: "blog.html", label: "Blog" },
    { href: "pricing.html", label: "Bảng giá" }
  ];
  const adminNavItems = [
    { href: "admin.html", label: "Tổng quan" },
    { href: "admin.html#users", label: "Người dùng" },
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
  });

  const activePage = currentPage === "vocabulary-study.html" ? "vocabulary.html" : currentPage;
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    const linkPage = href.split("#")[0];
    if (href === activePage || linkPage === activePage) {
      link.classList.add("is-active");
    }
  });
}

function initAuthNav() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  ensureNavActions(header);
  bindAuthNavInteractions();

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
    })
    .catch(() => {
      clearAuthUser();
      renderGuestNav();
    });
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

