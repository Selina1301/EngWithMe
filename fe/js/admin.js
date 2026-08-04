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

async function initAdminDashboard() {
  const root = document.querySelector("[data-admin-dashboard]");
  if (!root) return;

  // 1. Sidebar Toggle Logic ([ ☰ ] <-> EngWithMe [ ◀ ])
  const sidebar = document.getElementById("adminSidebar");
  const toggleBtn = document.getElementById("btnSidebarToggle");
  const toggleIcon = document.getElementById("sidebarToggleIcon");

  if (sidebar && toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isCollapsed = sidebar.classList.toggle("collapsed");
      if (toggleIcon) {
        toggleIcon.className = isCollapsed ? "ti-menu" : "ti-arrow-left";
      }
    });
  }

  // 2. Tab Isolation Navigation Logic
  const navItems = document.querySelectorAll("[data-admin-tab]");
  const tabSections = document.querySelectorAll(".admin-tab-section, .admin-tab-content");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTabId = item.dataset.adminTab;

      navItems.forEach((nav) => nav.classList.remove("is-active"));
      item.classList.add("is-active");

      tabSections.forEach((section) => {
        const isTarget = section.id === `tab-${targetTabId}` || section.dataset.adminPanel === targetTabId;
        if (isTarget) {
          section.classList.add("is-active");
          section.style.display = "block";
        } else {
          section.classList.remove("is-active");
          section.style.display = "none";
        }
      });

      if (targetTabId === "payments") {
        fetchAndRenderAdminPayments();
      }
    });
  });

  // Always pre-fetch payment stats so data is ready
  fetchAndRenderAdminPayments();

  // 3. Role Selector Change Listener (User - Manager - Admin)
  root.addEventListener("change", async (event) => {
    const roleSelect = event.target.closest("[data-role-select]");
    if (!roleSelect) return;

    const userId = roleSelect.dataset.userId;
    const newRole = roleSelect.value;
    if (!userId || !newRole) return;

    const body = new FormData();
    body.set("action", "set_role");
    body.set("user_id", userId);
    body.set("role", newRole);

    try {
      roleSelect.disabled = true;
      const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
      const response = await fetcher("api/admin_users.php", {
        method: "POST",
        body
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        showAdminFeedback(root, result.message || "Không thể cập nhật vai trò.", false);
        return;
      }

      renderAdminDashboard(root, result);
      showAdminFeedback(root, result.message || `Đã cập nhật vai trò tài khoản thành ${newRole.toUpperCase()}.`, true);
    } catch (error) {
      showAdminFeedback(root, "Không thể kết nối đến máy chủ.", false);
    } finally {
      roleSelect.disabled = false;
    }
  });

  fetchAndRenderAdminReports();
  bindAdminReportButtons();
  bindBroadcastNotificationForm();
  fetchAndRenderPendingBlogs();
  fetchAndRenderStudentFeedbacks();

  // Bind dynamic filters for instant client-side search and filtering
  const searchInput = document.getElementById("admin-search");
  const roleSelectFilter = document.getElementById("filter-role");
  const statusSelectFilter = document.getElementById("filter-status");

  const onFilterChange = () => {
    applyAdminFilters(root);
  };

  searchInput?.addEventListener("input", onFilterChange);
  roleSelectFilter?.addEventListener("change", onFilterChange);
  statusSelectFilter?.addEventListener("change", onFilterChange);

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-admin-action]");
    if (!button) return;

    const action = button.dataset.adminAction;
    const userId = button.dataset.userId;
    if (!action || !userId) return;

    if (action === "delete" && !confirm("Bạn có chắc chắn muốn xóa tài khoản này?\nThao tác này sẽ xóa toàn bộ dữ liệu (bài thi, tiến trình học, thông báo, bài viết) liên quan đến tài khoản này!")) {
      return;
    }

    const body = new FormData();
    body.set("action", action);
    body.set("user_id", userId);

    try {
      button.disabled = true;
      const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
      const response = await fetcher("api/admin_users.php", {
        method: "POST",
        body
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
    const cachedUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
    const userRole = String(cachedUser?.role || "").toLowerCase();
    const userEmail = String(cachedUser?.email || "").toLowerCase();
    const isAllowedAdmin = userRole === "admin" || userRole === "manager" || userEmail === "admin1301@gmail.com";

    if (!cachedUser || !isAllowedAdmin) {
      alert("⚠️ Rất tiếc, tài khoản của bạn không có quyền truy cập Trang Quản Trị (Admin). Hệ thống sẽ chuyển hướng về Trang Chủ!");
      window.location.href = "index.html";
      return;
    }

    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const response = await fetcher("api/admin_users.php");
    if (!response.ok || response.status === 401) {
      alert("⚠️ Rất tiếc, tài khoản của bạn không có quyền truy cập Trang Quản Trị (Admin).");
      window.location.href = "index.html";
      return;
    }

    const result = await response.json();
    if (!result || !result.ok) {
      alert("⚠️ " + ((result && result.message) ? result.message : "Không thể tải dữ liệu quản trị."));
      window.location.href = "index.html";
      return;
    }

    renderAdminDashboard(root, result);
  } catch (error) {
    showAdminFeedback(root, "Không tải được dữ liệu quản trị từ backend.", false);
  }

  const pendingBlogsContainer = document.getElementById("admin-pending-blogs");
  if (pendingBlogsContainer) {
    loadPendingBlogs(pendingBlogsContainer);
    setupBlogApprovalListener(pendingBlogsContainer);
  }

  setupLearningContentAdmin(root);
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
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--muted); font-size: 14px; font-weight: 500;">
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
  const userRole = user.role || "user";
  const statusLabel = user.status === "active" ? "Active" : "Locked";
  const safeName = escapeHtml(user.name || "");
  const safeEmail = escapeHtml(user.email || "");
  const safeGoal = escapeHtml(user.goal || "Chưa đặt");
  
  // Format level cleanly as LV.N (converting A1 -> LV.1, A2 -> LV.2, etc.)
  function formatAdminUserLevel(lvl) {
    if (!lvl) return "LV.1";
    let s = String(lvl).trim().toUpperCase();
    const cefrMap = { "A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5, "C2": 6 };
    if (cefrMap[s]) return `LV.${cefrMap[s]}`;
    let n = parseInt(s.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(n) && n > 0) return `LV.${n}`;
    return "LV.1";
  }
  let safeLevel = formatAdminUserLevel(user.level);
  
  const createdAt = formatDateTime(user.createdAt);

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
      <td><span class="level-badge">${safeLevel}</span></td>
      <td><span class="status-pill ${user.status === "active" ? "is-active" : "is-locked"}">${statusLabel}</span></td>
      <td>${createdAt}</td>
      <td>
        <div class="table-actions" style="justify-content: flex-end;">
          <select class="role-select" data-role-select data-user-id="${user.id}" data-role="${userRole}" ${isSelf ? 'disabled title="Không thể tự sửa vai trò của chính mình"' : ''}>
            <option value="user" ${userRole === "user" ? "selected" : ""}>👤 Học viên</option>
            <option value="manager" ${userRole === "manager" ? "selected" : ""}>⭐ Manager</option>
            <option value="admin" ${userRole === "admin" ? "selected" : ""}>👑 Admin</option>
          </select>
          ${user.status === "active"
            ? actionButton("lock", user.id, "Khóa", isSelf, "warning")
            : actionButton("unlock", user.id, "Mở khóa", false, "success")}
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

function setupLearningContentAdmin(root) {
  const list = root.querySelector("[data-content-list]");
  const editor = root.querySelector("[data-content-editor]");
  if (!list || !editor || root.learningContentBound) return;

  root.learningContentBound = true;
  root.learningContentState = {
    section: "reading",
    items: [],
    selectedKey: "",
    search: ""
  };

  root.querySelectorAll("[data-content-section]").forEach((button) => {
    button.addEventListener("click", () => {
      root.learningContentState.section = button.dataset.contentSection || "reading";
      root.learningContentState.selectedKey = "";
      syncLearningContentTabs(root);
      loadLearningContentItems(root);
    });
  });

  root.querySelector("[data-content-search]")?.addEventListener("input", (event) => {
    root.learningContentState.search = event.target.value.trim().toLowerCase();
    renderLearningContentList(root);
  });

  root.querySelector("[data-content-new]")?.addEventListener("click", () => {
    selectLearningContentItem(root, createBlankLearningContent(root.learningContentState.section));
  });

  root.querySelector("[data-content-reload]")?.addEventListener("click", () => {
    loadLearningContentItems(root);
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-content-key]");
    if (!button) return;
    const item = root.learningContentState.items.find((entry) => entry.key === button.dataset.contentKey);
    if (item) selectLearningContentItem(root, item);
  });

  editor.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveLearningContentItem(root);
  });

  root.querySelector("[data-content-delete]")?.addEventListener("click", async () => {
    await deleteLearningContentItem(root);
  });

  loadLearningContentItems(root);
}

async function loadLearningContentItems(root) {
  const state = root.learningContentState;
  const feedback = root.querySelector("[data-content-feedback]");
  const list = root.querySelector("[data-content-list]");
  if (!state || !list) return;

  list.innerHTML = '<p class="admin-content-empty">Đang tải nội dung...</p>';
  if (feedback) {
    feedback.textContent = "";
    feedback.style.color = "";
  }

  try {
    const response = await fetch(`api/learning_content.php?section=${encodeURIComponent(state.section)}&include_drafts=1`, {
      credentials: "same-origin"
    });
    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    const result = await response.json();
    if (!response.ok || !result.ok) {
      showLearningContentFeedback(root, result.message || "Không tải được nội dung.", false);
      list.innerHTML = '<p class="admin-content-empty">Không tải được nội dung.</p>';
      return;
    }

    state.items = (result.items || []).map(normalizeLearningContentItem);
    state.selectedKey = state.items[0]?.key || "";
    renderLearningContentList(root);
    if (state.selectedKey) {
      selectLearningContentItem(root, state.items[0]);
    } else {
      selectLearningContentItem(root, createBlankLearningContent(state.section));
    }
  } catch (error) {
    showLearningContentFeedback(root, "Không gọi được API nội dung học.", false);
    list.innerHTML = '<p class="admin-content-empty">API nội dung học chưa sẵn sàng.</p>';
  }
}

function normalizeLearningContentItem(item) {
  const payload = item?.payload && typeof item.payload === "object" ? item.payload : {};
  return {
    section: item.section || "reading",
    key: item.key || payload.id || "",
    title: item.title || payload.title || item.key || "",
    description: item.description || payload.description || "",
    level: item.level || payload.level || "",
    goal: item.goal || payload.goal || "",
    sortOrder: Number(item.sortOrder || 0),
    status: item.status || "published",
    updatedAt: item.updatedAt || "",
    payload
  };
}

function renderLearningContentList(root) {
  const state = root.learningContentState;
  const list = root.querySelector("[data-content-list]");
  if (!state || !list) return;

  const query = state.search || "";
  const items = state.items.filter((item) => {
    if (!query) return true;
    return [
      item.key,
      item.title,
      item.description,
      item.level,
      item.goal,
      item.status
    ].join(" ").toLowerCase().includes(query);
  });

  if (!items.length) {
    list.innerHTML = '<p class="admin-content-empty">Không có nội dung phù hợp.</p>';
    return;
  }

  list.innerHTML = items.map((item) => `
    <button class="admin-content-item ${item.key === state.selectedKey ? "is-active" : ""}" type="button" data-content-key="${escapeHtml(item.key)}">
      <strong>${escapeHtml(item.title || item.key)}</strong>
      <small>${escapeHtml(item.key)}</small>
      <span class="admin-content-item-meta">
        <span>${escapeHtml(item.status)}</span>
        ${item.level ? `<span>${escapeHtml(item.level)}</span>` : ""}
        ${item.goal ? `<span>${escapeHtml(item.goal)}</span>` : ""}
        <span>#${Number(item.sortOrder || 0)}</span>
      </span>
    </button>
  `).join("");
}

function selectLearningContentItem(root, item) {
  const normalized = normalizeLearningContentItem(item);
  const state = root.learningContentState;
  if (state) state.selectedKey = normalized.key;

  setContentField(root, "section", normalized.section);
  setContentField(root, "key", normalized.key);
  setContentField(root, "level", normalized.level);
  setContentField(root, "goal", normalized.goal);
  setContentField(root, "sortOrder", normalized.sortOrder);
  setContentField(root, "status", normalized.status);
  setContentField(root, "title", normalized.title);
  setContentField(root, "description", normalized.description);
  setContentField(root, "payload", JSON.stringify(normalized.payload || {}, null, 2));

  setText("[data-content-editor-title]", normalized.title || "Nội dung mới");
  setText("[data-content-editor-status]", normalized.status || "draft");
  renderLearningContentList(root);
}

function createBlankLearningContent(section) {
  if (section === "grammar") {
    const payload = {
      id: "new-grammar-topic",
      order: "99",
      title: "New Grammar Topic",
      level: "Core",
      time: "20 phút",
      summary: "Short grammar topic summary.",
      theory: [
        "Explain the grammar point in a short, practical way."
      ],
      formulas: [
        "Subject + Verb + Object"
      ],
      examples: [
        { en: "She checks the report every morning.", vi: "Câu ví dụ minh họa cách dùng." }
      ],
      mistakes: [
        "Common mistake to avoid."
      ],
      exercises: [
        {
          prompt: "Choose the correct answer.",
          options: ["A", "B", "C", "D"],
          answer: 0,
          hint: "Look at the grammar form around the blank.",
          explanation: "Correct answer: A."
        }
      ]
    };

    return normalizeLearningContentItem({
      section,
      key: payload.id,
      title: payload.title,
      description: payload.summary,
      level: payload.level,
      goal: "",
      sortOrder: Number(payload.order),
      status: "draft",
      payload
    });
  }

  if (section === "listening") {
    const payload = {
      id: "new-listening-session",
      title: "New Listening Session",
      goal: "work-career",
      level: "B1",
      tone: "green",
      icon: "ti-headphone-alt",
      accent: "American",
      noise: "None",
      badge: "Listener",
      baseScore: 72,
      opening: "Short real-life listening context.",
      story: "Listen and choose the best response.",
      role: "Learner",
      target: "Understand the main idea.",
      transcript: "Could you send me the updated report before lunch?",
      nativeLine: "Couldja send me the updated report before lunch?",
      connectedSpeech: "Could you -> Couldja",
      hardPart: "updated report before lunch",
      questionTitle: "What does the speaker ask for?",
      context: "Choose the correct response.",
      options: [
        { key: "A", text: "Send the updated report before lunch.", correct: true },
        { key: "B", text: "Cancel the meeting tomorrow.", correct: false },
        { key: "C", text: "Buy lunch for the team.", correct: false }
      ],
      keywords: ["send", "updated", "report", "lunch"],
      gapParts: ["Could you send me the updated ", { answer: "report" }, " before ", { answer: "lunch" }, "?"],
      phrases: ["Could you send me", "the updated report", "before lunch"],
      whyHard: ["Could you often links into Couldja.", "Updated report carries the key information."],
      missReason: "Focus on the object after send.",
      mistakes: ["connected", "fast"]
    };
    return normalizeLearningContentItem({
      section,
      key: payload.id,
      title: payload.title,
      description: payload.opening,
      level: payload.level,
      goal: payload.goal,
      sortOrder: 0,
      status: "draft",
      payload
    });
  }

  const payload = {
    id: "new-reading-lesson",
    level: "easy",
    title: "New Reading Lesson",
    description: "Short reading lesson description.",
    lines: [
      ["The team will review the new schedule this afternoon.", "Nhóm sẽ xem lại lịch mới vào chiều nay."]
    ],
    vocab: ["review = xem lại", "schedule = lịch trình"]
  };

  return normalizeLearningContentItem({
    section: "reading",
    key: payload.id,
    title: payload.title,
    description: payload.description,
    level: payload.level,
    goal: "",
    sortOrder: 0,
    status: "draft",
    payload
  });
}

async function saveLearningContentItem(root) {
  const section = getContentField(root, "section");
  const key = getContentField(root, "key").trim();
  const title = getContentField(root, "title").trim();
  const description = getContentField(root, "description").trim();
  const level = getContentField(root, "level").trim();
  const goal = getContentField(root, "goal").trim();
  const sortOrder = Number(getContentField(root, "sortOrder") || 0);
  const status = getContentField(root, "status") || "published";
  let payload = null;

  if (!/^[a-z0-9][a-z0-9-]*$/i.test(key)) {
    showLearningContentFeedback(root, "Content key chỉ nên dùng chữ, số và dấu gạch ngang.", false);
    return;
  }

  try {
    payload = JSON.parse(getContentField(root, "payload") || "{}");
  } catch (error) {
    showLearningContentFeedback(root, "Payload JSON đang sai cú pháp.", false);
    return;
  }

  payload.id = key;
  if (title) payload.title = title;
  if (description) payload.description = description;
  if (level) payload.level = level;
  if (goal) payload.goal = goal;

  try {
    const response = await fetch("api/learning_content.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        action: "upsert",
        section,
        key,
        title,
        description,
        level,
        goal,
        sortOrder,
        status,
        payload
      })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      showLearningContentFeedback(root, result.message || "Không lưu được nội dung.", false);
      return;
    }

    root.learningContentState.section = section;
    root.learningContentState.selectedKey = key;
    syncLearningContentTabs(root);
    await loadLearningContentItems(root);
    const saved = root.learningContentState.items.find((item) => item.key === key);
    if (saved) selectLearningContentItem(root, saved);
    showLearningContentFeedback(root, result.message || "Đã lưu nội dung.", true);
  } catch (error) {
    showLearningContentFeedback(root, "Không gọi được API lưu nội dung.", false);
  }
}

async function deleteLearningContentItem(root) {
  const section = getContentField(root, "section");
  const key = getContentField(root, "key").trim();
  if (!key) return;
  if (!confirm(`Xóa vĩnh viễn nội dung "${key}"?`)) return;

  try {
    const response = await fetch("api/learning_content.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "delete", section, key })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      showLearningContentFeedback(root, result.message || "Không xóa được nội dung.", false);
      return;
    }

    root.learningContentState.section = section;
    root.learningContentState.selectedKey = "";
    await loadLearningContentItems(root);
    showLearningContentFeedback(root, result.message || "Đã xóa nội dung.", true);
  } catch (error) {
    showLearningContentFeedback(root, "Không gọi được API xóa nội dung.", false);
  }
}

function syncLearningContentTabs(root) {
  const section = root.learningContentState?.section || "reading";
  root.querySelectorAll("[data-content-section]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.contentSection === section);
  });
}

function getContentField(root, name) {
  return root.querySelector(`[data-content-field="${name}"]`)?.value || "";
}

function setContentField(root, name, value) {
  const field = root.querySelector(`[data-content-field="${name}"]`);
  if (field) field.value = value ?? "";
}

function showLearningContentFeedback(root, message, isSuccess = true) {
  const feedback = root.querySelector("[data-content-feedback]");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.style.color = isSuccess ? "var(--success)" : "var(--danger)";
}

async function loadPendingBlogs(container) {
  try {
    const res = await fetch("api/get_pending_blogs.php", { credentials: "same-origin" });
    const result = await res.json();

    if (!res.ok || !result.ok) {
      container.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Không thể tải danh sách bài viết.</td></tr>`;
      return;
    }

    if (!result.blogs || result.blogs.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--muted); padding: 30px;">✓ Không có cảm nhận nào trên hệ thống.</td></tr>`;
      return;
    }

    container.innerHTML = result.blogs.map((blog) => {
      const starsHtml = Array(5).fill(0).map((_, i) => 
        i < blog.rating
          ? `<span style="background: linear-gradient(135deg, #2ee878, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; font-size: 1.25rem; line-height: 1; filter: drop-shadow(0 0 3px rgba(46, 232, 120, 0.45));">★</span>`
          : `<span style="color: rgba(166,180,201,0.15); display: inline-block; font-size: 1.25rem; line-height: 1;">★</span>`
      ).join('');

      const formattedDate = new Date(blog.created_at).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      // Status badge
      let statusBadge = "";
      if (blog.status === "pending") {
        statusBadge = `<span style="background: rgba(250, 204, 21, 0.15); color: var(--warning); padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid rgba(250, 204, 21, 0.25); white-space: nowrap;">Chờ duyệt</span>`;
      } else if (blog.status === "approved") {
        statusBadge = `<span style="background: rgba(46, 232, 120, 0.15); color: var(--primary); padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid rgba(46, 232, 120, 0.25); white-space: nowrap;">Đã duyệt</span>`;
      } else {
        statusBadge = `<span style="background: rgba(248, 113, 113, 0.15); color: var(--danger); padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid rgba(248, 113, 113, 0.25); white-space: nowrap;">Từ chối</span>`;
      }

      // Action buttons based on status
      let actionButtons = "";
      if (blog.status === "pending") {
        actionButtons = `
          <button class="btn btn-primary" data-blog-id="${blog.id}" data-blog-action="approve" style="padding: 6px 12px; font-size: 12px; white-space: nowrap !important; display: inline-flex; align-items: center; gap: 4px;">
            <span class="ti-check"></span> Duyệt
          </button>
          <button class="btn btn-ghost" data-blog-id="${blog.id}" data-blog-action="reject" style="padding: 6px 12px; font-size: 12px; border-color: rgba(248, 113, 113, 0.3); color: var(--danger); white-space: nowrap !important; display: inline-flex; align-items: center; gap: 4px;">
            <span class="ti-close"></span> Từ chối
          </button>
        `;
      } else if (blog.status === "approved") {
        actionButtons = `
          <button class="btn btn-ghost" data-blog-id="${blog.id}" data-blog-action="reject" style="padding: 6px 12px; font-size: 12px; border-color: rgba(248, 113, 113, 0.3); color: var(--danger); white-space: nowrap !important; display: inline-flex; align-items: center; gap: 4px;">
            <span class="ti-close"></span> Từ chối
          </button>
        `;
      } else {
        actionButtons = `
          <button class="btn btn-primary" data-blog-id="${blog.id}" data-blog-action="approve" style="padding: 6px 12px; font-size: 12px; white-space: nowrap !important; display: inline-flex; align-items: center; gap: 4px;">
            <span class="ti-check"></span> Duyệt
          </button>
        `;
      }

      // Add permanent delete button
      actionButtons += `
        <button class="btn btn-ghost" data-blog-id="${blog.id}" data-blog-action="delete" style="padding: 6px 12px; font-size: 12px; border-color: rgba(248, 113, 113, 0.5); color: var(--danger); background: rgba(248, 113, 113, 0.05); white-space: nowrap !important; display: inline-flex; align-items: center; gap: 4px;">
          <span class="ti-trash"></span> Xóa vĩnh viễn
        </button>
      `;

      const displayTitle = blog.title.length > 15
        ? blog.title.substring(0, 15) + "..."
        : blog.title;

      const displayContent = blog.content.length > 20
        ? blog.content.substring(0, 20) + "..."
        : blog.content;

      return `
        <tr data-blog-row-id="${blog.id}">
          <td style="padding: 10px 4px;">
            <strong style="font-size: 0.88rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${escapeHtml(blog.author_name)}</strong>
            <small style="color: var(--muted); font-size: 0.76rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${escapeHtml(blog.author_email)}</small>
          </td>
          <td style="text-align: center; padding: 10px 2px;">
            <div style="display: inline-flex; justify-content: center; gap: 1px;">${starsHtml}</div>
          </td>
          <td class="admin-blog-content-cell" style="padding: 10px 4px;">
            <div class="content-preview" style="font-weight: bold; color: #ffffff;">${escapeHtml(displayTitle)}</div>
            <div class="content-full-popup"><strong style="color: #00ff87;">Tiêu đề:</strong> ${escapeHtml(blog.title)}</div>
          </td>
          <td class="admin-blog-content-cell" style="padding: 10px 4px;">
            <div class="content-preview">${escapeHtml(displayContent)}</div>
            <div class="content-full-popup"><strong style="color: #38bdf8;">Nội dung:</strong> ${escapeHtml(blog.content)}</div>
          </td>
          <td style="text-align: center; padding: 10px 2px;">${statusBadge}</td>
          <td style="color: var(--muted); font-size: 11px; line-height: 1.3; padding: 10px 2px;">${formattedDate}</td>
          <td style="padding: 10px 4px;">
            <div style="display: flex; gap: 4px; align-items: center; flex-wrap: nowrap;">
              ${actionButtons}
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Lỗi máy chủ khi tải danh sách bài viết.</td></tr>`;
  }
}

function setupBlogApprovalListener(container) {
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const blogId = btn.getAttribute("data-blog-id");
    const action = btn.getAttribute("data-blog-action");
    const feedback = document.getElementById("blog-admin-feedback");

    if (!blogId || !action) return;

    if (action === "reject" && !confirm("Bạn có chắc chắn muốn từ chối/hủy duyệt bài viết này không?")) {
      return;
    }

    if (action === "delete" && !confirm("Bạn có chắc chắn muốn XÓA VĨNH VIỄN bài viết này khỏi hệ thống không? Hành động này không thể hoàn tác!")) {
      return;
    }

    try {
      btn.disabled = true;
      if (feedback) {
        feedback.textContent = "Đang xử lý...";
        feedback.style.color = "var(--primary)";
      }

      const body = new FormData();
      body.append("id", blogId);
      body.append("action", action);

      const res = await fetch("api/approve_blog.php", {
        method: "POST",
        body,
        credentials: "same-origin"
      });
      const result = await res.json();

      if (!res.ok || !result.ok) {
        if (feedback) {
          feedback.textContent = result.message || "Thao tác thất bại.";
          feedback.style.color = "var(--danger)";
        }
        return;
      }

      if (feedback) {
        feedback.textContent = "✓ " + result.message;
        feedback.style.color = "var(--primary)";
      }

      // Reload list
      loadPendingBlogs(container);

    } catch (err) {
      if (feedback) {
        feedback.textContent = "Lỗi kết nối máy chủ.";
        feedback.style.color = "var(--danger)";
      }
    } finally {
      btn.disabled = false;
    }
  });
}

let currentReportData = null;

async function fetchAndRenderAdminReports() {
  const summaryBox = document.getElementById("report-summary-box");
  const timeEl = document.getElementById("report-timestamp");

  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const res = await fetcher("api/admin_reports.php");
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.ok || !data.report) return;

    currentReportData = data.report;
    const report = data.report;
    const m = report.metrics;

    if (timeEl) {
      timeEl.textContent = `Cập nhật lúc: ${formatDateTime(report.generated_at)}`;
    }

    if (summaryBox) {
      summaryBox.textContent = report.summary;
    }

    const revEl = document.getElementById("report-metric-revenue");
    if (revEl) revEl.textContent = `${m.estimated_revenue_vnd.toLocaleString("vi-VN")} VNĐ`;

    const healthEl = document.getElementById("report-metric-health");
    if (healthEl) healthEl.textContent = `${m.system_health_score}%`;

    const examsEl = document.getElementById("report-metric-exams");
    if (examsEl) examsEl.textContent = `${m.total_exams} bài`;

    const avgScoreEl = document.getElementById("report-metric-avgscore");
    if (avgScoreEl) avgScoreEl.textContent = `${m.avg_exam_score} điểm`;

  } catch (err) {
    console.error("Failed to load admin reports:", err);
  }
}

function bindAdminReportButtons() {
  document.getElementById("btn-export-csv")?.addEventListener("click", () => {
    if (!currentReportData) {
      alert("Đang tải dữ liệu báo cáo, vui lòng thử lại sau giây lát.");
      return;
    }
    const m = currentReportData.metrics;
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + "Chi So Năng Luc,Gia Tri\n"
      + `Tong So Tai Khoan,${m.total_users}\n`
      + `Thanh Vien VIP Premium,${m.vip_users}\n`
      + `Doanh Thu VIP Uoc Tinh (VND),${m.estimated_revenue_vnd}\n`
      + `Tong Bai Thi TOEIC Da Nop,${m.total_exams}\n`
      + `Diem Thi Trung Binh,${m.avg_exam_score}\n`
      + `Diem Thi Cao Nhat,${m.highest_exam_score}\n`
      + `Tong Tien Do Hoc Tap,${m.total_progress_items}\n`
      + `Ty Le Hoat Dong System,${m.system_health_score}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bao_Cao_EngWithMe_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  document.getElementById("btn-copy-report")?.addEventListener("click", () => {
    if (!currentReportData) return;
    navigator.clipboard.writeText(currentReportData.summary);
    alert("✓ Đã sao chép bản báo cáo hệ thống vào Clipboard!");
  });

  document.getElementById("btn-print-report")?.addEventListener("click", () => {
    window.print();
  });

  bindBroadcastNotificationForm();
}

function bindBroadcastNotificationForm() {
  const form = document.getElementById("form-broadcast-notification");
  const feedback = document.getElementById("broadcast-feedback");
  if (!form || form._broadcastBound) return;
  form._broadcastBound = true;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("broadcast-title")?.value.trim();
    const tag = document.getElementById("broadcast-tag")?.value;
    const target = document.getElementById("broadcast-target")?.value;
    const message = document.getElementById("broadcast-message")?.value.trim();
    const btn = document.getElementById("btn-submit-broadcast");

    if (!title || !message) {
      if (feedback) {
        feedback.textContent = "Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!";
        feedback.style.color = "var(--danger)";
      }
      return;
    }

    try {
      if (btn) btn.disabled = true;
      if (feedback) {
        feedback.textContent = "Đang phát thông báo tới hệ thống CSDL Cloudflare D1...";
        feedback.style.color = "#00f0ff";
      }

      const payload = {
        title,
        status_tag: tag,
        target,
        message
      };

      const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
      const res = await fetcher("api/broadcast_notification.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (feedback) {
          feedback.textContent = data.message || "Gửi thông báo thất bại.";
          feedback.style.color = "var(--danger)";
        }
        return;
      }

      if (feedback) {
        feedback.textContent = "✓ " + (data.message || "Đã phát thông báo thành công!");
        feedback.style.color = "#10b981";
      }

      form.reset();
    } catch (err) {
      if (feedback) {
        feedback.textContent = "Lỗi kết nối máy chủ khi phát thông báo.";
        feedback.style.color = "var(--danger)";
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

// Community Blog Moderation Queue Handler
async function fetchAndRenderPendingBlogs() {
  const container = document.getElementById("pending-blogs-list");
  const feedback = document.getElementById("blog-moderation-feedback");
  if (!container) return;

  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const res = await fetcher("api/pending_blogs.php");
    const data = await res.json();

    if (!res.ok || !data.ok || !Array.isArray(data.blogs) || data.blogs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: #10b981; padding: 20px; font-weight: 700;">
          🎉 Không có bài viết nào đang chờ duyệt! Tất cả bài viết đã được xử lý.
        </div>
      `;
      return;
    }

    container.innerHTML = data.blogs.map((b) => {
      const stars = Array(5).fill(0).map((_, i) => i < (b.rating || 5) ? '★' : '☆').join('');
      return `
        <div class="pending-blog-card" style="background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 280px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <strong style="color: #38bdf8; font-size: 0.95rem;">${escapeHtml(b.author_name)} (ID: ${escapeHtml(b.user_id)})</strong>
              <span style="color: #ffd700; font-size: 0.9rem;">${stars}</span>
              <small style="color: #94a3b8; font-size: 0.78rem;">${formatDateTime(b.created_at)}</small>
            </div>
            <h4 style="margin: 0 0 6px 0; color: #ffffff; font-size: 1.05rem;">${escapeHtml(b.title)}</h4>
            <p style="margin: 0; color: #cbd5e1; font-size: 0.88rem; line-height: 1.5;">${escapeHtml(b.content)}</p>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="btn btn-primary" data-blog-action="approve" data-blog-id="${b.id}" style="padding: 8px 16px; background: #10b981; border: none; font-weight: 700; border-radius: 8px; cursor: pointer;">
              ✅ Phê duyệt
            </button>
            <button class="btn btn-danger" data-blog-action="reject" data-blog-id="${b.id}" style="padding: 8px 16px; background: #ef4444; border: none; font-weight: 700; border-radius: 8px; cursor: pointer;">
              🗑️ Từ chối
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind action buttons
    container.querySelectorAll("[data-blog-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const action = btn.dataset.blogAction;
        const blogId = btn.dataset.blogId;
        const endpoint = action === "approve" ? "api/approve_blog.php" : "api/reject_blog.php";
        
        if (action === "reject" && !confirm("Bạn có chắc muốn từ chối và xóa bài viết này?")) return;

        try {
          btn.disabled = true;
          const formData = new FormData();
          formData.append("blog_id", blogId);
          formData.append("id", blogId);

          const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
          const res = await fetcher(endpoint, { method: "POST", body: formData });
          const resData = await res.json();

          if (res.ok && resData.ok) {
            if (feedback) {
              feedback.textContent = resData.message || "Thao tác thành công!";
              feedback.style.color = action === "approve" ? "#10b981" : "#f59e0b";
            }
            fetchAndRenderPendingBlogs();
          } else if (feedback) {
            feedback.textContent = resData.message || "Lỗi thao tác bài viết.";
            feedback.style.color = "var(--danger)";
          }
        } catch (e) {
          if (feedback) {
            feedback.textContent = "Lỗi kết nối máy chủ.";
            feedback.style.color = "var(--danger)";
          }
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 16px;">Lỗi tải bài viết chờ duyệt.</div>`;
  }
}

async function fetchAndRenderStudentFeedbacks() {
  const container = document.getElementById("student-feedbacks-list");
  if (!container) return;

  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const res = await fetcher("api/student_feedbacks.php");
    if (!res.ok) return;
    const data = await res.json();
    const feedbacks = data.feedbacks || [];

    if (feedbacks.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: #94a3b8; padding: 24px; font-weight: 600;">
          🎉 Hiện chưa có góp ý hay yêu cầu hỗ trợ mới nào từ học viên.
        </div>
      `;
      return;
    }

    container.innerHTML = feedbacks.map((fb) => `
      <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 8px;">
          <strong style="color: #a855f7; font-size: 15px;">${escapeHtml(fb.title)}</strong>
          <span style="font-size: 12px; color: #94a3b8;">${formatDateTime(fb.created_at)}</span>
        </div>
        <p style="color: #e2e8f0; font-size: 14px; margin: 0; line-height: 1.5;">${escapeHtml(fb.message)}</p>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 16px;">Lỗi tải danh sách góp ý của học viên.</div>`;
  }
}

/* ==========================================================================
   💳 ADMIN PAYMENTS & REVENUE ANALYTICS DASHBOARD
   ========================================================================== */
let globalAdminPaymentsData = [];

async function fetchAndRenderAdminPayments() {
  const tbody = document.getElementById("admin-payments-tbody");
  if (!tbody) return;

  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const res = await fetcher("api/payments.php");
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #f87171; padding: 24px;">Lỗi tải dữ liệu thanh toán từ máy chủ.</td></tr>`;
      return;
    }

    const data = await res.json();
    if (!data || !data.ok) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #f87171; padding: 24px;">${escapeHtml(data.message || "Không thể tải dữ liệu thanh toán.")}</td></tr>`;
      return;
    }

    const stats = data.stats || {};
    globalAdminPaymentsData = data.orders || [];

    // 1. Update KPI metric cards
    setText("#payment-kpi-total-revenue", stats.totalRevenueFormatted || "0đ");
    setText("#payment-kpi-total-orders", `${stats.totalOrders || 0} đơn`);
    setText("#payment-kpi-pro-revenue", stats.proRevenueFormatted || "0đ");
    setText("#payment-kpi-pro-count", `${stats.proCount || 0} lượt đăng ký Pro`);
    setText("#payment-kpi-premium-revenue", stats.premiumRevenueFormatted || "0đ");
    setText("#payment-kpi-premium-count", `${stats.premiumCount || 0} lượt Premium Trọn Đời`);

    // 2. Update visual chart progress bars
    const totalRev = stats.totalRevenue || 1;
    const proPct = Math.round((stats.proRevenue / totalRev) * 100);
    const premiumPct = Math.round((stats.premiumRevenue / totalRev) * 100);

    const proBar = document.getElementById("payment-chart-pro-bar");
    const proLabel = document.getElementById("payment-chart-pro-label");
    if (proBar && proLabel) {
      proBar.style.width = `${proPct}%`;
      proLabel.textContent = `${proPct}% (${stats.proRevenueFormatted || "0đ"})`;
    }

    const premiumBar = document.getElementById("payment-chart-premium-bar");
    const premiumLabel = document.getElementById("payment-chart-premium-label");
    if (premiumBar && premiumLabel) {
      premiumBar.style.width = `${premiumPct}%`;
      premiumLabel.textContent = `${premiumPct}% (${stats.premiumRevenueFormatted || "0đ"})`;
    }

    const summaryText = document.getElementById("payment-analytics-summary");
    if (summaryText) {
      summaryText.innerHTML = `🔥 Tổng doanh thu ghi nhận: <strong style="color:#ffd700;">${stats.totalRevenueFormatted}</strong> từ <strong>${stats.totalOrders}</strong> đơn hàng. Gói Premium đóng góp <strong>${premiumPct}%</strong> doanh thu toàn hệ thống.`;
    }

    // 3. Render transactions table
    renderAdminPaymentsTable(globalAdminPaymentsData);

    // 4. Render 2 SVG Line Trend Charts
    renderAdminTrendLineCharts(currentTrendTimeRange, currentTrendPlanFilter);

    // 5. Bind search, status filter & time/plan switchers
    bindAdminPaymentFilters();

  } catch (err) {
    console.error("fetchAndRenderAdminPayments error:", err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #f87171; padding: 24px;">Lỗi kết nối khi tải thanh toán.</td></tr>`;
  }
}

let currentTrendTimeRange = "week";
let currentTrendPlanFilter = "all";

function renderAdminTrendLineCharts(timeRange = "week", planFilter = "all") {
  currentTrendTimeRange = timeRange;
  currentTrendPlanFilter = planFilter;

  // Update time button active states
  document.querySelectorAll(".chart-time-btn").forEach((btn) => {
    if (btn.dataset.timeRange === timeRange) {
      btn.classList.add("active");
      btn.style.background = "linear-gradient(135deg, #10b981, #059669)";
      btn.style.color = "#ffffff";
    } else {
      btn.classList.remove("active");
      btn.style.background = "transparent";
      btn.style.color = "#94a3b8";
    }
  });

  // Update plan button active states
  document.querySelectorAll(".chart-plan-btn").forEach((btn) => {
    if (btn.dataset.planFilter === planFilter) {
      btn.classList.add("active");
      btn.style.background = "linear-gradient(135deg, #38bdf8, #0284c7)";
      btn.style.color = "#ffffff";
    } else {
      btn.classList.remove("active");
      btn.style.background = "transparent";
      btn.style.color = "#94a3b8";
    }
  });

  // Filter orders by plan
  const paidOrders = globalAdminPaymentsData.filter((ord) => {
    const isPaid = ord.status === "PAID" || ord.status === "SUCCESS";
    if (!isPaid) return false;
    const plan = String(ord.plan_id || ord.plan_name || "").toLowerCase();
    if (planFilter === "pro") return !plan.includes("premium");
    if (planFilter === "premium") return plan.includes("premium");
    return true; // "all"
  });

  let labels = [];
  let revenueData = [];
  let ordersData = [];

  const parseOrderDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (typeof dateStr === "number") return new Date(dateStr);
    const normalized = String(dateStr).trim().replace(" ", "T");
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const now = new Date();

  if (timeRange === "week") {
    labels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
    revenueData = [0, 0, 0, 0, 0, 0, 0];
    ordersData = [0, 0, 0, 0, 0, 0, 0];

    const currentDayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const distToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const mondayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distToMonday, 0, 0, 0, 0);
    const sundayEnd = new Date(mondayStart.getTime() + 7 * 86400000);

    paidOrders.forEach((ord) => {
      const d = parseOrderDate(ord.created_at);
      if (d >= mondayStart && d < sundayEnd) {
        const dayIdx = d.getDay();
        const idx = dayIdx === 0 ? 6 : dayIdx - 1;
        revenueData[idx] += Number(ord.amount || 0);
        ordersData[idx] += 1;
      }
    });
  } else if (timeRange === "month") {
    labels = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
    revenueData = [0, 0, 0, 0];
    ordersData = [0, 0, 0, 0];

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    paidOrders.forEach((ord) => {
      const d = parseOrderDate(ord.created_at);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const dateNum = d.getDate();
        let weekIdx = Math.min(3, Math.floor((dateNum - 1) / 7));
        revenueData[weekIdx] += Number(ord.amount || 0);
        ordersData[weekIdx] += 1;
      }
    });
  } else {
    labels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    revenueData = new Array(12).fill(0);
    ordersData = new Array(12).fill(0);

    const currentYear = now.getFullYear();

    paidOrders.forEach((ord) => {
      const d = parseOrderDate(ord.created_at);
      if (d.getFullYear() === currentYear) {
        const monthIdx = d.getMonth();
        revenueData[monthIdx] += Number(ord.amount || 0);
        ordersData[monthIdx] += 1;
      }
    });
  }

  // Peak Headers
  const maxRev = Math.max(...revenueData);
  const maxOrd = Math.max(...ordersData);
  setText("#chart1-peak-val", `Đỉnh: ${maxRev.toLocaleString("vi-VN")}đ`);
  setText("#chart2-peak-val", `Đỉnh: ${maxOrd} đơn`);

  let strokeColor1 = "#10b981";
  let dotColor1 = "#ffd700";
  let gradStart1 = "rgba(16, 185, 129, 0.45)";

  if (planFilter === "pro") {
    strokeColor1 = "#10b981";
    dotColor1 = "#34d399";
    gradStart1 = "rgba(16, 185, 129, 0.45)";
  } else if (planFilter === "premium") {
    strokeColor1 = "#ffd700";
    dotColor1 = "#f59e0b";
    gradStart1 = "rgba(255, 215, 0, 0.45)";
  }

  // Render SVG Charts into Containers
  const c1 = document.getElementById("revenue-trend-chart-container");
  if (c1) {
    c1.innerHTML = generateSvgSmoothLineChart({
      labels,
      data: revenueData,
      strokeColor: strokeColor1,
      dotColor: dotColor1,
      gradientId: "revGradArea",
      gradientStart: gradStart1,
      gradientEnd: "rgba(16, 185, 129, 0.0)",
      unit: "đ"
    });
  }

  const c2 = document.getElementById("orders-trend-chart-container");
  if (c2) {
    c2.innerHTML = generateSvgSmoothLineChart({
      labels,
      data: ordersData,
      strokeColor: "#38bdf8",
      dotColor: "#c084fc",
      gradientId: "ordGradArea",
      gradientStart: "rgba(56, 189, 248, 0.45)",
      gradientEnd: "rgba(56, 189, 248, 0.0)",
      unit: " đơn"
    });
  }
}

function generateSvgSmoothLineChart({ labels, data, strokeColor, dotColor, gradientId, gradientStart, gradientEnd, unit }) {
  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 40, left: 55 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data, 0);
  const effectiveMax = maxVal === 0 ? 1 : maxVal;
  const minVal = 0;

  const points = data.map((val, idx) => {
    const x = padding.left + (idx / Math.max(1, data.length - 1)) * chartW;
    const y = maxVal === 0
      ? padding.top + chartH
      : padding.top + chartH - ((val - minVal) / (effectiveMax - minVal)) * chartH;
    return { x, y, val, label: labels[idx] };
  });

  // Generate Smooth Curved Path (Cubic Bezier Spline)
  let dPath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    dPath += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  // Closed Path for Gradient Area Fill
  const areaPath = `${dPath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Grid Lines
  const gridRatios = [0, 0.33, 0.66, 1];
  const gridLines = gridRatios.map((ratio) => {
    const y = padding.top + chartH * ratio;
    const rawVal = Math.round(maxVal * (1 - ratio));
    let valFormatted = "0";
    if (unit === "đ") {
      if (rawVal >= 1000000) valFormatted = `${(rawVal / 1000000).toFixed(1)}M`;
      else if (rawVal >= 1000) valFormatted = `${(rawVal / 1000).toFixed(0)}k`;
      else valFormatted = `${rawVal}đ`;
    } else {
      valFormatted = `${rawVal}`;
    }
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4" />
      <text x="${padding.left - 8}" y="${y + 4}" fill="#64748b" font-size="10" text-anchor="end" font-weight="600">${valFormatted}</text>
    `;
  }).join("");

  // X-Axis Labels & Point Dots
  const xLabelsHtml = points.map((p) => `
    <text x="${p.x}" y="${height - 10}" fill="#94a3b8" font-size="11" text-anchor="middle" font-weight="700">${p.label}</text>
  `).join("");

  const dotsHtml = points.map((p) => {
    const valText = unit === "đ" ? `${p.val.toLocaleString("vi-VN")}đ` : `${p.val}${unit}`;
    return `
      <g class="chart-point-group" style="cursor: pointer;">
        <circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${dotColor}" stroke="#0f172a" stroke-width="2.5" />
        <title>${p.label}: ${valText}</title>
      </g>
    `;
  }).join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;" preserveAspectRatio="none">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${gradientStart}" />
          <stop offset="100%" stop-color="${gradientEnd}" />
        </linearGradient>
      </defs>

      <!-- Background Grid -->
      ${gridLines}

      <!-- Filled Gradient Area -->
      <path d="${areaPath}" fill="url(#${gradientId})" />

      <!-- Smooth Curved Trend Line (Dây đi) -->
      <path d="${dPath}" fill="none" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round" filter="drop-shadow(0 4px 10px ${strokeColor})" />

      <!-- X-Axis Labels -->
      ${xLabelsHtml}

      <!-- Interactive Data Node Dots -->
      ${dotsHtml}
    </svg>
  `;
}

function renderAdminPaymentsTable(orders) {
  const tbody = document.getElementById("admin-payments-tbody");
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 40px;">Chưa có lịch sử giao dịch thanh toán nào.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map((ord) => {
    const isPaid = ord.status === "PAID" || ord.status === "SUCCESS";
    const statusTag = isPaid
      ? `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; font-size: 0.8rem;">✓ Thành công</span>`
      : `<button type="button" style="background: rgba(234, 179, 8, 0.2); color: #eab308; padding: 4px 12px; border-radius: 6px; border: 1px solid rgba(234, 179, 8, 0.5); font-weight: 700; font-size: 0.8rem; cursor: pointer;" onclick="updateAdminOrderStatus(${ord.id}, 'PAID', '${escapeHtml(ord.user_id)}')">⏳ Duyệt Đơn (PENDING)</button>`;

    const isPremium = String(ord.plan_name || ord.plan_id || "").toLowerCase().includes("premium");
    const planBadge = isPremium
      ? `<span style="color: #ffd700; font-weight: 800;">👑 ${escapeHtml(ord.plan_name || "Gói Premium VIP Trọn Đời")}</span>`
      : `<span style="color: #10b981; font-weight: 700;">⚡ ${escapeHtml(ord.plan_name || "Gói Pro (30 Ngày)")}</span>`;

    return `
      <tr>
        <td style="font-family: monospace; font-weight: 700; color: #38bdf8;">${escapeHtml(ord.order_code)}</td>
        <td><strong style="color: #f8fafc;">${escapeHtml(ord.user_name)}</strong></td>
        <td style="color: #94a3b8;">${escapeHtml(ord.user_email)}</td>
        <td>${planBadge}</td>
        <td style="font-weight: 800; color: #ffd700;">${escapeHtml(ord.amount_formatted || ord.amount + 'đ')}</td>
        <td>${statusTag}</td>
        <td style="font-size: 0.85rem; color: #94a3b8;">${formatDateTime(ord.created_at)}</td>
      </tr>
    `;
  }).join("");
}

function bindAdminPaymentFilters() {
  const searchInput = document.getElementById("admin-payment-search");
  const filterSelect = document.getElementById("admin-payment-filter-status");
  const reloadBtn = document.getElementById("admin-payments-reload");

  const filterFn = () => {
    const q = (searchInput ? searchInput.value : "").toLowerCase().trim();
    const st = filterSelect ? filterSelect.value : "all";

    const filtered = globalAdminPaymentsData.filter((ord) => {
      const matchSearch = !q || String(ord.order_code).toLowerCase().includes(q) || String(ord.user_name).toLowerCase().includes(q) || String(ord.user_email).toLowerCase().includes(q);
      const matchStatus = st === "all" || ord.status === st;
      return matchSearch && matchStatus;
    });

    renderAdminPaymentsTable(filtered);
  };

  if (searchInput) searchInput.oninput = filterFn;
  if (filterSelect) filterSelect.onchange = filterFn;
  if (reloadBtn) reloadBtn.onclick = () => fetchAndRenderAdminPayments();

  // Bind chart time period switcher buttons (Tuần / Tháng / Năm)
  document.querySelectorAll(".chart-time-btn").forEach((btn) => {
    btn.onclick = () => {
      const range = btn.dataset.timeRange || "week";
      renderAdminTrendLineCharts(range, currentTrendPlanFilter);
    };
  });

  // Bind chart plan filter switcher buttons (Tất Cả / Gói Pro / Premium Trọn Đời)
  document.querySelectorAll(".chart-plan-btn").forEach((btn) => {
    btn.onclick = () => {
      const plan = btn.dataset.planFilter || "all";
      renderAdminTrendLineCharts(currentTrendTimeRange, plan);
    };
  });
}

async function updateAdminOrderStatus(orderId, status, userId) {
  if (!confirm(`Bạn có chắc chắn muốn cập nhật đơn hàng #${orderId} thành ${status} không?`)) return;

  const body = new FormData();
  body.set("order_id", orderId);
  body.set("status", status);
  if (userId) body.set("user_id", userId);

  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const res = await fetcher("api/update_order_status.php", { method: "POST", body });
    const data = await res.json();
    if (res.ok && data.ok) {
      alert(data.message || "Cập nhật thành công!");
      fetchAndRenderAdminPayments();
    } else {
      alert(data.message || "Lỗi cập nhật đơn hàng.");
    }
  } catch (e) {
    alert("Không thể kết nối máy chủ.");
  }
}
window.updateAdminOrderStatus = updateAdminOrderStatus;

async function clearAdminTestOrders() {
  if (!confirm("⚠️ Bạn có chắc chắn muốn xóa TOÀN BỘ đơn hàng mẫu test cũ trong Database không? Hành động này sẽ làm sạch Database để sẵn sàng đón nhận giao dịch thực tế của học viên.")) return;

  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const res = await fetcher("api/clear_test_orders.php", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.ok) {
      alert(data.message || "Đã xóa sạch đơn hàng test thành công!");
      fetchAndRenderAdminPayments();
    } else {
      alert(data.message || "Không thể xóa đơn hàng test.");
    }
  } catch (e) {
    alert("Lỗi kết nối khi dọn dẹp đơn test.");
  }
}
window.clearAdminTestOrders = clearAdminTestOrders;
