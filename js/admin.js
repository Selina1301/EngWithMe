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

      const displayContent = blog.content.length > 23
        ? blog.content.substring(0, 23) + "..."
        : blog.content;

      return `
        <tr data-blog-row-id="${blog.id}">
          <td>
            <strong>${escapeHtml(blog.author_name)}</strong><br>
            <small style="color: var(--muted);">${escapeHtml(blog.author_email)}</small>
          </td>
          <td style="text-align: center;">
            <div style="display: inline-flex; justify-content: center; gap: 2px;">${starsHtml}</div>
          </td>
          <td style="font-weight: bold; color: #ffffff;">${escapeHtml(blog.title)}</td>
          <td class="admin-blog-content-cell">
            <div class="content-preview">${escapeHtml(displayContent)}</div>
            <div class="content-full-popup">${escapeHtml(blog.content)}</div>
          </td>
          <td style="text-align: center;">${statusBadge}</td>
          <td style="color: var(--muted); font-size: 12px; line-height: 1.3;">${formattedDate}</td>
          <td>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: nowrap;">
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
