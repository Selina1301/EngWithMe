const courseProgressIds = ["course-a1", "course-a2", "course-b1", "lesson-greetings"];

function getCourseProgressPercent(completed) {
  const completedCount = completed.filter(id => courseProgressIds.includes(id)).length;
  return courseProgressIds.length ? Math.round((completedCount / courseProgressIds.length) * 100) : 0;
}

function updateDashboardProgressDisplay(progress) {
  document.querySelectorAll("[data-dashboard-progress]").forEach((element) => {
    element.textContent = `${progress}%`;
    const progressBar = element.closest(".stat-card")?.querySelector(".progress-track span");
    if (progressBar) progressBar.style.width = `${progress}%`;
  });
}

function initProgressButtons() {
  const completed = JSON.parse(localStorage.getItem("engWithMeProgress") || "[]");

  document.querySelectorAll("[data-progress-id]").forEach((button) => {
    const id = button.dataset.progressId;
    if (completed.includes(id)) {
      button.textContent = "Đã hoàn thành";
      button.classList.remove("btn-secondary");
      button.classList.add("btn-primary");
    }

    button.addEventListener("click", () => {
      const current = JSON.parse(localStorage.getItem("engWithMeProgress") || "[]");
      const next = current.includes(id) ? current : [...current, id];
      localStorage.setItem("engWithMeProgress", JSON.stringify(next));
      button.textContent = "Đã hoàn thành";
      button.classList.remove("btn-secondary");
      button.classList.add("btn-primary");
      updateDashboardProgressDisplay(getCourseProgressPercent(next));
    });
  });
}

function initAuthForms() {
  const registerForm = document.querySelector("[data-register-form]");
  const loginForm = document.querySelector("[data-login-form]");

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAuthForm(registerForm, "api/register.php");
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAuthForm(loginForm, "api/login.php");
  });
}

async function submitAuthForm(form, endpoint) {
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent;
  const password = form.elements.password?.value || "";
  const confirmPassword = form.elements.confirm_password?.value || "";

  if (confirmPassword && password !== confirmPassword) {
    showAuthFeedback(form, "Mật khẩu nhập lại chưa khớp.", false);
    return;
  }

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Đang xử lý...";
    }
    showAuthFeedback(form, "Đang kết nối server...", true);

    const response = await fetch(endpoint, {
      method: "POST",
      body: new FormData(form),
      credentials: "same-origin"
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      showAuthFeedback(form, result.message || "Thao tác không thành công.", false);
      return;
    }

    saveAuthenticatedUser(result.user);
    showAuthFeedback(form, result.message || "Thành công. Đang chuyển sang dashboard...", true);
    const redirect = result.redirect || (result.user?.role === "admin" ? "admin.html" : "profile.html#dashboard");
    setTimeout(() => {
      window.location.href = redirect;
    }, 550);
  } catch (error) {
    showAuthFeedback(form, "Không gọi được backend. Hãy mở web bằng Apache/XAMPP qua localhost.", false);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

function saveAuthenticatedUser(user) {
  if (!user) return;
  if (typeof persistAuthUser === "function") {
    persistAuthUser(user);
    return;
  }
  localStorage.setItem("engWithMeStudentName", user.name || "Nguyễn Văn A");
  localStorage.setItem("engWithMeGoal", user.goal || "Giao tiếp hằng ngày");
  localStorage.setItem("engWithMeLevel", user.level || "A1");
  localStorage.setItem("engWithMeUserEmail", user.email || "");
  localStorage.setItem("engWithMeUserRole", user.role || "user");
  localStorage.setItem("engWithMeUserStatus", user.status || "active");
  localStorage.setItem("engWithMeUserId", String(user.id || ""));
  localStorage.setItem("engWithMeUserAvatar", user.avatar || "");
}

function showAuthFeedback(form, message, isSuccess = true) {
  const feedback = form.querySelector("[data-auth-feedback]");
  if (feedback) {
    feedback.textContent = message;
    feedback.style.color = isSuccess ? "var(--success)" : "var(--danger)";
  }
}

async function initDashboard() {
  const nameElement = document.querySelector("[data-student-name]");
  const levelElement = document.querySelector("[data-student-level]");
  const progressElement = document.querySelector("[data-dashboard-progress]");
  if (!nameElement && !levelElement && !progressElement) return;

  let hasServerUser = false;
  try {
    const response = await fetch("api/me.php", { credentials: "same-origin" });
    if (response.ok) {
      const result = await response.json();
      if (result.ok) {
        saveAuthenticatedUser(result.user);
        hasServerUser = true;
      }
    }
  } catch (error) {
    // Static file fallback: keep the last local values when PHP is not running.
  }

  if (!hasServerUser && window.location.pathname.endsWith("dashboard.html")) {
    window.location.href = "login.html";
    return;
  }

  const name = localStorage.getItem("engWithMeStudentName") || "Nguyễn Văn A";
  const level = localStorage.getItem("engWithMeLevel") || "A2";
  const completed = JSON.parse(localStorage.getItem("engWithMeProgress") || "[]");
  const progress = getCourseProgressPercent(completed);

  if (nameElement) nameElement.textContent = name;
  if (levelElement) levelElement.textContent = level;
  updateDashboardProgressDisplay(progress);
}

async function initProfile() {
  const form = document.querySelector("[data-profile-form]");
  if (!form) return;

  const feedback = form.querySelector("[data-auth-feedback]");
  const avatarInput = form.querySelector("[data-avatar-input]");

  avatarInput?.addEventListener("change", () => {
    const file = avatarInput.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showAuthFeedback(form, "Ảnh đại diện tối đa 2MB.", false);
      avatarInput.value = "";
      return;
    }

    const previewUser = {
      name: form.elements.name.value || localStorage.getItem("engWithMeStudentName") || "Tài khoản",
      avatar: URL.createObjectURL(file)
    };
    renderProfileAvatars(previewUser);
  });

  try {
    const response = await fetch("api/me.php", { credentials: "same-origin" });
    if (!response.ok) {
      window.location.href = "login.html";
      return;
    }

    const result = await response.json();
    if (!result.ok) {
      window.location.href = "login.html";
      return;
    }

    saveAuthenticatedUser(result.user);
    fillProfileForm(form, result.user);
  } catch (error) {
    if (feedback) {
      feedback.textContent = "Không tải được hồ sơ. Hãy chạy web bằng localhost/XAMPP.";
      feedback.style.color = "var(--danger)";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton?.textContent;

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Đang lưu...";
      }

      const response = await fetch("api/profile.php", {
        method: "POST",
        body: new FormData(form),
        credentials: "same-origin"
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        showAuthFeedback(form, result.message || "Không thể lưu hồ sơ.", false);
        return;
      }

      saveAuthenticatedUser(result.user);
      fillProfileForm(form, result.user);
      if (typeof renderAuthenticatedNav === "function") renderAuthenticatedNav(result.user);
      showAuthFeedback(form, result.message || "Đã lưu hồ sơ.", true);
    } catch (error) {
      showAuthFeedback(form, "Không gọi được backend hồ sơ.", false);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}

function fillProfileForm(form, user) {
  form.elements.name.value = user.name || "";
  form.elements.email.value = user.email || "";
  form.elements.level.value = user.level || "A1";
  form.elements.goal.value = user.goal || "";
  renderProfileAvatars(user);

  setText("[data-profile-name]", user.name || "Học viên");
  setText("[data-profile-email]", user.email || "");
  setText("[data-profile-role]", user.role === "admin" ? "Quản trị viên" : "Học viên");
  setText("[data-profile-level]", user.level || "A1");
  setText("[data-profile-goal]", user.goal || "Chưa đặt mục tiêu");
  setText("[data-profile-status]", user.status === "active" ? "Đang hoạt động" : "Đang khóa");
}

function renderProfileAvatars(user) {
  if (typeof renderAvatarTargets === "function") {
    renderAvatarTargets("[data-profile-avatar], [data-profile-form-avatar]", user);
  }
}

async function initAdminDashboard() {
  const root = document.querySelector("[data-admin-dashboard]");
  if (!root) return;

  // Bind dynamic filters for instant client-side search and filtering
  const searchInput = document.getElementById("admin-search");
  const roleSelect = document.getElementById("filter-role");
  const statusSelect = document.getElementById("filter-status");

  const onFilterChange = () => {
    applyAdminFilters(root);
  };

  searchInput?.addEventListener("input", onFilterChange);
  roleSelect?.addEventListener("change", onFilterChange);
  statusSelect?.addEventListener("change", onFilterChange);

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-admin-action]");
    if (!button) return;

    const action = button.dataset.adminAction;
    const userId = button.dataset.userId;
    if (!action || !userId) return;

    if (action === "delete" && !confirm("Xóa tài khoản này khỏi hệ thống?")) {
      return;
    }

    const body = new FormData();
    body.set("action", action);
    body.set("user_id", userId);

    try {
      button.disabled = true;
      const response = await fetch("api/admin_users.php", {
        method: "POST",
        body,
        credentials: "same-origin"
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        showAdminFeedback(root, result.message || "Không thể cập nhật người dùng.", false);
        return;
      }

      renderAdminDashboard(root, result);
      showAdminFeedback(root, result.message || "Đã cập nhật người dùng.", true);
    } catch (error) {
      showAdminFeedback(root, "Không gọi được API quản trị.", false);
    } finally {
      button.disabled = false;
    }
  });

  try {
    const response = await fetch("api/admin_users.php", { credentials: "same-origin" });
    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    const result = await response.json();
    if (!response.ok || !result.ok) {
      showAdminFeedback(root, result.message || "Không có quyền truy cập trang quản trị.", false);
      return;
    }

    renderAdminDashboard(root, result);
  } catch (error) {
    showAdminFeedback(root, "Không tải được dữ liệu quản trị từ backend.", false);
  }
}

function renderAdminDashboard(root, data) {
  const stats = data.stats || {};
  Object.entries({
    total: stats.total ?? 0,
    admins: stats.admins ?? 0,
    learners: stats.learners ?? 0,
    active: stats.active ?? 0,
    locked: stats.locked ?? 0,
    newToday: stats.newToday ?? 0
  }).forEach(([key, value]) => {
    setText(`[data-admin-stat="${key}"]`, value);
  });

  setText("[data-admin-name]", data.admin?.name || "Admin");
  setText("[data-admin-email]", data.admin?.email || "");

  // Cache user data and current admin ID on the root element
  root.adminUsersData = data.users || [];
  root.currentAdminId = Number(data.admin?.id || 0);

  // Apply filters and render the rows
  applyAdminFilters(root);
}

function applyAdminFilters(root) {
  const tbody = root.querySelector("[data-admin-users]");
  if (!tbody) return;

  const users = root.adminUsersData || [];
  const currentAdminId = root.currentAdminId || 0;

  const searchInput = document.getElementById("admin-search");
  const roleSelect = document.getElementById("filter-role");
  const statusSelect = document.getElementById("filter-status");

  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const filterRole = roleSelect ? roleSelect.value : "all";
  const filterStatus = statusSelect ? statusSelect.value : "all";

  const filteredUsers = users.filter((user) => {
    // 1. Instant search text filter
    if (searchQuery) {
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const goal = (user.goal || "").toLowerCase();
      const level = (user.level || "").toLowerCase();
      if (!name.includes(searchQuery) &&
          !email.includes(searchQuery) &&
          !goal.includes(searchQuery) &&
          !level.includes(searchQuery)) {
        return false;
      }
    }

    // 2. Role filter
    if (filterRole !== "all") {
      if (user.role !== filterRole) {
        return false;
      }
    }

    // 3. Status filter
    if (filterStatus !== "all") {
      if (user.status !== filterStatus) {
        return false;
      }
    }

    return true;
  });

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: var(--muted); font-size: 14px; font-weight: 500;">
          Không tìm thấy tài khoản nào phù hợp với bộ lọc.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = filteredUsers.map((user) => renderAdminUserRow(user, currentAdminId)).join("");
  }
}

function renderAdminUserRow(user, currentAdminId) {
  const isSelf = Number(user.id) === currentAdminId;
  const roleLabel = user.role === "admin" ? "Admin" : "User";
  const statusLabel = user.status === "active" ? "Active" : "Locked";
  const safeName = escapeHtml(user.name || "");
  const safeEmail = escapeHtml(user.email || "");
  const safeGoal = escapeHtml(user.goal || "Chưa đặt");
  const createdAt = formatDateTime(user.createdAt);
  const lastLoginAt = formatDateTime(user.lastLoginAt) || "Chưa đăng nhập";

  return `
    <tr>
      <td>
        <span class="admin-user-cell">
          ${typeof getAvatarMarkup === "function" ? getAvatarMarkup(user, "table-avatar") : ""}
          <span>
            <strong>${safeName}</strong>
            ${isSelf ? '<span class="mini-badge">Bạn</span>' : ""}
          </span>
        </span>
      </td>
      <td>${safeEmail}</td>
      <td><span class="role-pill ${user.role === "admin" ? "is-admin" : ""}">${roleLabel}</span></td>
      <td>${escapeHtml(user.level || "A1")}</td>
      <td>${safeGoal}</td>
      <td><span class="status-pill ${user.status === "active" ? "is-active" : "is-locked"}">${statusLabel}</span></td>
      <td>${createdAt}</td>
      <td>${lastLoginAt}</td>
      <td>
        <div class="table-actions">
          ${user.status === "active"
            ? actionButton("lock", user.id, "Khóa", isSelf, "warning")
            : actionButton("unlock", user.id, "Mở khóa", false, "success")}
          ${user.role === "admin"
            ? actionButton("make_user", user.id, "Hạ quyền", isSelf, "warning")
            : actionButton("make_admin", user.id, "Lên admin", false, "success")}
          ${actionButton("delete", user.id, "Xóa", isSelf, "danger")}
        </div>
      </td>
    </tr>
  `;
}

function actionButton(action, userId, label, disabled = false, tone = "") {
  const icons = {
    lock: "ti-lock",
    unlock: "ti-unlock",
    make_admin: "ti-shield",
    make_user: "ti-user",
    delete: "ti-trash"
  };
  const icon = icons[action] || "ti-settings";
  return `<button class="admin-action ${tone}" type="button" data-admin-action="${action}" data-user-id="${userId}" ${disabled ? "disabled" : ""}><span class="${icon}"></span>${label}</button>`;
}

function showAdminFeedback(root, message, isSuccess = true) {
  const feedback = root.querySelector("[data-admin-feedback]");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.style.color = isSuccess ? "var(--success)" : "var(--danger)";
}

function initLogoutButtons() {
  if (typeof bindAuthNavInteractions === "function") bindAuthNavInteractions();
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
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

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function initResults() {
  const lastScore = localStorage.getItem("engWithMeLastScore");
  const savedWords = getSavedWords().length;

  document.querySelectorAll("[data-last-score], [data-last-score-table]").forEach((element) => {
    element.textContent = lastScore || "Chưa có";
  });

  document.querySelectorAll("[data-saved-words-result]").forEach((element) => {
    element.textContent = savedWords;
  });
}

function initRecorder() {
  const startButton = document.querySelector("[data-record-start]");
  const stopButton = document.querySelector("[data-record-stop]");
  const audio = document.querySelector("[data-record-audio]");
  const feedback = document.querySelector("[data-record-feedback]");
  if (!startButton || !stopButton || !audio) return;

  let mediaRecorder;
  let chunks = [];

  startButton.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (feedback) feedback.textContent = "Trình duyệt chưa hỗ trợ ghi âm.";
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];
      mediaRecorder.addEventListener("dataavailable", (event) => chunks.push(event.data));
      mediaRecorder.addEventListener("stop", () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        audio.src = URL.createObjectURL(blob);
        stream.getTracks().forEach((track) => track.stop());
        if (feedback) feedback.textContent = "Đã ghi âm. Hãy nghe lại và so sánh với câu mẫu.";
      });
      mediaRecorder.start();
      startButton.disabled = true;
      stopButton.disabled = false;
      if (feedback) feedback.textContent = "Đang ghi âm...";
    } catch (error) {
      if (feedback) feedback.textContent = "Không thể mở micro. Hãy chạy bằng localhost và cấp quyền micro.";
    }
  });

  stopButton.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      startButton.disabled = false;
      stopButton.disabled = true;
    }
  });
}
