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
  const completed = JSON.parse(localStorage.getItem(getAccountKey("engWithMeProgress")) || "[]");

  document.querySelectorAll("[data-progress-id]").forEach((button) => {
    const id = button.dataset.progressId;
    if (completed.includes(id)) {
      button.textContent = "Đã hoàn thành";
      button.classList.remove("btn-secondary");
      button.classList.add("btn-primary");
    }

    button.addEventListener("click", async () => {
      const current = JSON.parse(localStorage.getItem(getAccountKey("engWithMeProgress")) || "[]");
      const next = current.includes(id) ? current : [...current, id];
      localStorage.setItem(getAccountKey("engWithMeProgress"), JSON.stringify(next));
      button.textContent = "Đã hoàn thành";
      button.classList.remove("btn-secondary");
      button.classList.add("btn-primary");
      updateDashboardProgressDisplay(getCourseProgressPercent(next));

      // Sync to database if logged in
      const userId = localStorage.getItem("engWithMeUserId");
      if (userId) {
        try {
          const body = new FormData();
          body.append("progress_id", id);
          await fetch("api/sync_progress.php", {
            method: "POST",
            body,
            credentials: "same-origin"
          });
        } catch (e) {
          console.error("Failed to sync progress to database:", e);
        }
      }
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

  // Toggle Password Visibility
  document.querySelectorAll(".toggle-password").forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", () => {
      const input = toggleBtn.previousElementSibling;
      if (!input || input.tagName !== "INPUT") return;
      
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggleBtn.classList.toggle("slashed", !isPassword); // Add slash when visible (text)
    });
  });

  const forgotForm = document.querySelector("[data-forgot-form]");
  const resetForm = document.querySelector("[data-reset-form]");

  forgotForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitForgotForm(forgotForm);
  });

  resetForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAuthForm(resetForm, "api/reset_password.php");
  });
}

async function submitForgotForm(form) {
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent;
  
  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Đang gửi...";
    }
    showAuthFeedback(form, "Đang kết nối server...", true);

    const response = await fetch("api/forgot_password.php", {
      method: "POST",
      body: new FormData(form),
      credentials: "same-origin"
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      showAuthFeedback(form, result.message || "Thao tác không thành công.", false);
      return;
    }

    showAuthFeedback(form, result.message, true);
    
    // Display demo link if provided
    const demoLinkEl = document.getElementById('demo-reset-link');
    if (demoLinkEl && result.demo_link) {
        demoLinkEl.style.display = 'block';
        demoLinkEl.innerHTML = `<strong>Demo Link:</strong> <a href="${result.demo_link}" target="_blank">${result.demo_link}</a>`;
    }

  } catch (error) {
    showAuthFeedback(form, "Không gọi được backend.", false);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
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
    showAuthFeedback(form, result.message || "Thành công. Đang chuyển hướng về trang chủ...", true);
    const redirect = "index.html";
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
  const roadmapElement = document.querySelector("[data-dashboard-roadmap]");
  if (!nameElement && !levelElement && !progressElement && !roadmapElement) return;

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
  const roadmap = getDashboardLearningRoadmap();
  const streakState = updateDashboardLearningStreak();
  const completedDays = getDashboardCompletedPlanDays(roadmap);
  const planDay = Math.min(completedDays + 1, roadmap.length);
  const todayPlan = roadmap[planDay - 1];
  const progress = Math.round((completedDays / roadmap.length) * 100);

  if (nameElement) nameElement.textContent = name;
  if (levelElement) levelElement.textContent = level;
  updateDashboardProgressDisplay(progress);
  renderDashboardLearningPlan({
    roadmap,
    todayPlan,
    planDay,
    completedDays,
    streak: streakState.streak,
    progress,
    isPlanFinished: completedDays >= roadmap.length
  });
}

function getDashboardLearningRoadmap() {
  const vocabTargets = getDashboardVocabularyTargets();
  const readingTargets = getDashboardReadingTargets();
  const grammarTargets = getDashboardGrammarTargets();

  return [
    ...vocabTargets.map((target, index) => ({
      day: index + 1,
      type: "vocabulary",
      skill: "Vocabulary",
      label: "Từ vựng",
      href: `vocabulary-study.html?level=${target.levelKey}&topic=${target.id}&mode=study&planDay=${index + 1}`,
      title: `Ngày ${index + 1}: ${target.name}`,
      description: `Học chủ đề ${target.name} (${target.levelLabel}). Hoàn thành khi bạn mở đúng chủ đề này trong khu Vocabulary.`,
      target
    })),
    ...readingTargets.map((target, index) => ({
      day: index + 8,
      type: "reading",
      skill: "Reading",
      label: "Đọc hiểu",
      href: `reading.html#${target.id}`,
      title: `Ngày ${index + 8}: ${target.title}`,
      description: "Hoàn thành khi bạn vào bài đọc này và bật dấu Đã đọc trong khu Reading.",
      target
    })),
    ...grammarTargets.map((target, index) => ({
      day: index + 11,
      type: "grammar",
      skill: "Grammar",
      label: "Ngữ pháp",
      href: `grammar.html#${target.id}`,
      title: `Ngày ${index + 11}: ${target.title}`,
      description: "Hoàn thành khi bạn làm đúng toàn bộ bài tập của chủ đề ngữ pháp này.",
      target
    }))
  ];
}

function getDashboardVocabularyTargets() {
  const storageKey = typeof getAccountKey === "function"
    ? getAccountKey("engWithMePlanVocabularyTargets")
    : "engWithMePlanVocabularyTargets_guest";
  const allTopics = getDashboardAllVocabularyTopics();
  const stored = getStoredDashboardLearningState(storageKey);
  const storedTargets = Array.isArray(stored.targets) ? stored.targets : [];
  const allKeys = new Set(allTopics.map((topic) => `${topic.levelKey}:${topic.id}`));
  const validStoredTargets = storedTargets
    .filter((topic) => topic && allKeys.has(`${topic.levelKey}:${topic.id}`))
    .slice(0, 7);

  if (validStoredTargets.length === 7) return validStoredTargets;

  const preferred = ["easy", "easy", "medium", "medium", "hard", "hard", "hard"];
  const seed = localStorage.getItem("engWithMeUserId")
    || localStorage.getItem("engWithMeUserEmail")
    || "guest";
  const shuffled = seededDashboardShuffle(allTopics, seed);
  const selected = [];

  preferred.forEach((levelKey) => {
    const target = shuffled.find((topic) =>
      topic.levelKey === levelKey && !selected.some((item) => item.levelKey === topic.levelKey && item.id === topic.id)
    );
    if (target) selected.push(target);
  });

  shuffled.forEach((topic) => {
    if (selected.length >= 7) return;
    if (!selected.some((item) => item.levelKey === topic.levelKey && item.id === topic.id)) selected.push(topic);
  });

  const targets = selected.slice(0, 7);
  localStorage.setItem(storageKey, JSON.stringify({ targets }));
  return targets;
}

function getDashboardAllVocabularyTopics() {
  if (typeof vocabularyData === "undefined") return [];
  return Object.entries(vocabularyData).flatMap(([levelKey, levelData]) =>
    (levelData.topics || []).map((topic) => ({
      levelKey,
      levelLabel: levelData.label || levelKey,
      id: topic.id,
      name: topic.name
    }))
  );
}

function getDashboardReadingTargets() {
  return [
    { id: "schedule-change", title: "Schedule Change" },
    { id: "office-supplies", title: "Office Supplies" },
    { id: "client-visit", title: "Client Visit" }
  ];
}

function getDashboardGrammarTargets() {
  const topics = typeof grammarTopics !== "undefined" ? grammarTopics : [];
  return topics
    .slice()
    .sort((a, b) => Number(a.order) - Number(b.order))
    .slice(0, 7)
    .map((topic) => ({ id: topic.id, title: topic.title, exerciseCount: topic.exercises?.length || 0 }));
}

function seededDashboardShuffle(items, seedText) {
  const result = [...items];
  let seed = 0;
  String(seedText).split("").forEach((char) => {
    seed = ((seed << 5) - seed + char.charCodeAt(0)) >>> 0;
  });

  for (let index = result.length - 1; index > 0; index--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function updateDashboardLearningStreak() {
  const storageKey = typeof getAccountKey === "function"
    ? getAccountKey("engWithMeHomeLearningStreak")
    : "engWithMeHomeLearningStreak_guest";
  const today = getDashboardLocalDateKey(new Date());
  const saved = getStoredDashboardLearningState(storageKey);
  const yesterday = getDashboardLocalDateKey(addDashboardDays(new Date(), -1));
  let streak = Number(saved.streak) || 0;

  if (saved.lastOnlineDate === today) {
    streak = Math.max(streak, 1);
  } else if (saved.lastOnlineDate === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  const nextState = {
    streak,
    firstOnlineDate: saved.firstOnlineDate || today,
    lastOnlineDate: today
  };
  localStorage.setItem(storageKey, JSON.stringify(nextState));
  return nextState;
}

function getDashboardCompletedPlanDays(roadmap) {
  let completedDays = 0;

  for (const item of roadmap) {
    if (!isDashboardPlanItemComplete(item)) break;
    completedDays += 1;
  }

  return completedDays;
}

function isDashboardPlanItemComplete(item) {
  if (item.type === "vocabulary") return isDashboardVocabularyComplete(item.target);
  if (item.type === "reading") return isDashboardReadingComplete(item.target);
  if (item.type === "grammar") return isDashboardGrammarComplete(item.target);
  return false;
}

function isDashboardVocabularyComplete(target) {
  const viewed = getStoredDashboardLearningState(getAccountKey("engWithMeViewedTopics"));
  if (!Array.isArray(viewed)) return false;
  return viewed.some((topic) => topic?.level === target.levelKey && topic?.id === target.id);
}

function isDashboardReadingComplete(target) {
  const viewed = getStoredDashboardLearningState(getAccountKey("engWithMeViewedReadingTopics"));
  return Array.isArray(viewed) && viewed.includes(target.id);
}

function isDashboardGrammarComplete(target) {
  const practiceState = getStoredDashboardLearningState(getAccountKey("engWithMeGrammarPractice"));
  const solved = Array.isArray(practiceState[target.id]) ? practiceState[target.id] : [];
  return target.exerciseCount > 0 && solved.length >= target.exerciseCount;
}

function renderDashboardLearningPlan({ roadmap, todayPlan, planDay, completedDays, streak, progress, isPlanFinished }) {
  const summary = document.querySelector("[data-dashboard-today-summary]");
  const heroLink = document.querySelector("[data-dashboard-today-link]");
  const streakElement = document.querySelector("[data-dashboard-streak]");
  const streakBar = document.querySelector("[data-dashboard-streak-bar]");
  const todaySkill = document.querySelector("[data-dashboard-today-skill]");
  const todayStudyLink = document.querySelector("[data-dashboard-today-study-link]");
  const planDayElement = document.querySelector("[data-dashboard-plan-day]");
  const roadmapElement = document.querySelector("[data-dashboard-roadmap]");

  if (summary) {
    summary.textContent = isPlanFinished
      ? `Bạn đã hoàn thành lộ trình ${roadmap.length} ngày. Streak online hiện tại là ${streak} ngày.`
      : `Streak online hiện tại là ${streak} ngày. Bài cần làm tiếp là ngày ${planDay}/${roadmap.length}: ${todayPlan.title}.`;
  }
  if (heroLink) heroLink.href = todayPlan.href;
  if (streakElement) streakElement.textContent = `${streak} ngày`;
  if (streakBar) streakBar.style.width = `${Math.min(progress, 100)}%`;
  if (todaySkill) todaySkill.textContent = todayPlan.skill;
  if (todayStudyLink) {
    todayStudyLink.href = todayPlan.href;
    todayStudyLink.textContent = `Học ${todayPlan.label.toLowerCase()}`;
  }
  if (planDayElement) planDayElement.textContent = isPlanFinished ? "Hoàn thành" : `Ngày ${planDay}/${roadmap.length}`;

  if (!roadmapElement) return;
  roadmapElement.innerHTML = roadmap.map((item) => {
    const isComplete = item.day <= completedDays;
    const isCurrent = !isPlanFinished && item.day === planDay;
    const isUnlocked = isComplete || isCurrent;
    const stateClass = isCurrent ? "is-current" : isUnlocked ? "is-complete" : "is-locked";
    const stateText = isCurrent ? "Cần hoàn thành" : isComplete ? "Đã hoàn thành" : "Đang khóa";
    const action = isCurrent
      ? `<div class="roadmap-actions"><a href="${item.href}">Vào học hôm nay</a><span class="roadmap-requirement">${getDashboardRequirementText(item)}</span></div>`
      : isComplete
        ? `<a href="${item.href}">Ôn lại bài này</a>`
        : `<span class="roadmap-lock" aria-label="Bài này đang khóa">Khóa - hoàn thành ngày ${item.day - 1} trước</span>`;
    return `
      <article class="${stateClass}">
        <span>${item.day}</span>
        <div>
          <p class="roadmap-status">${stateText} - ${item.label}</p>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          ${action}
        </div>
      </article>
    `;
  }).join("");
}

function getDashboardRequirementText(item) {
  if (item.type === "vocabulary") return "Mở đúng chủ đề Vocabulary này để hoàn thành.";
  if (item.type === "reading") return "Tích Đã đọc trong bài Reading này để hoàn thành.";
  if (item.type === "grammar") return "Làm đúng toàn bộ bài tập Grammar này để hoàn thành.";
  return "Hoàn thành bài này để mở bài tiếp theo.";
}

function getStoredDashboardLearningState(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch (error) {
    return {};
  }
}

function getDashboardLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDashboardDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
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

async function initResults() {
  const lastScore = localStorage.getItem(getAccountKey("engWithMeLastScore"));
  const savedWords = getSavedWords().length;

  document.querySelectorAll("[data-last-score], [data-last-score-table]").forEach((element) => {
    element.textContent = lastScore || "Chưa có";
  });

  document.querySelectorAll("[data-saved-words-result]").forEach((element) => {
    element.textContent = savedWords;
  });

  const tbody = document.querySelector("[data-results-tbody]");
  const userId = localStorage.getItem("engWithMeUserId");
  if (tbody && userId) {
    try {
      const response = await fetch("api/test_results.php", { credentials: "same-origin" });
      if (response.ok) {
        const result = await response.json();
        if (result.ok && Array.isArray(result.results) && result.results.length > 0) {
          tbody.innerHTML = result.results.map((row) => {
            let testName = "TOEIC Reading Test";
            if (row.test_set === "placement") {
              testName = "Placement Test (Đánh giá năng lực)";
            } else if (row.test_set.startsWith("y")) {
              testName = `TOEIC Practice Set ${row.test_set.substring(1)} (Part ${row.test_parts})`;
            }

            return `
              <tr>
                <td><strong>${escapeHtml(testName)}</strong></td>
                <td>${escapeHtml(row.score)}</td>
                <td><span class="modal-level-pill ${escapeHtml(row.recommended_level)}" style="padding: 2px 8px; border-radius: 4px; font-weight: bold;">${escapeHtml(row.recommended_level)}</span></td>
                <td>${formatDateTime(row.submitted_at)}</td>
              </tr>
            `;
          }).join("");
        }
      }
    } catch (e) {
      console.error("Failed to load test history from server:", e);
    }
  }
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

function initBlogPage() {
  const reviewWrapper = document.getElementById("review-form-wrapper");
  const approvedFeed = document.getElementById("approved-blogs-feed");

  if (approvedFeed) {
    loadApprovedBlogs(approvedFeed);
  }

  if (!reviewWrapper) return;

  const cachedUser = getCachedAuthUser();
  if (cachedUser) {
    renderReviewForm(reviewWrapper, cachedUser);
  } else {
    // Check with server to verify
    fetch("api/me.php", { credentials: "same-origin" })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((result) => {
        if (result.ok && result.user) {
          persistAuthUser(result.user);
          renderReviewForm(reviewWrapper, result.user);
        } else {
          renderGuestReviewBanner(reviewWrapper);
        }
      })
      .catch(() => {
        renderGuestReviewBanner(reviewWrapper);
      });
  }
}

function renderGuestReviewBanner(container) {
  const bloggerUsername = document.getElementById("blogger-username");
  if (bloggerUsername) bloggerUsername.textContent = "Blogger: Khách";

  container.innerHTML = `
    <div style="text-align: center; padding: 30px 15px; background: rgba(56, 189, 248, 0.05); border-radius: var(--radius); border: 1px dashed rgba(56, 189, 248, 0.25);">
      <p style="color: var(--muted); margin-bottom: 18px; font-size: 15px;">Bạn cần đăng nhập tài khoản để có thể đăng cảm nhận và đánh giá website.</p>
      <a class="btn btn-primary" href="login.html" style="display: inline-flex; align-items: center; gap: 8px;">
        <span class="ti-shift-right"></span> Đăng nhập để viết blog
      </a>
    </div>
  `;
}

function renderReviewForm(container, user) {
  const bloggerUsername = document.getElementById("blogger-username");
  if (bloggerUsername) bloggerUsername.textContent = `Blogger: ${user.name || 'Học viên'}`;

  container.innerHTML = `
    <form id="submit-review-form" style="display: grid; gap: 14px;">
      <label style="display: grid; gap: 6px;">Tiêu đề bài viết
        <input type="text" name="title" placeholder="Nhập tiêu đề ngắn gọn (ví dụ: Trải nghiệm học tuyệt vời)" required style="background: rgba(2, 6, 23, 0.4);">
      </label>
      
      <label style="display: grid; gap: 6px;">Đánh giá chất lượng
        <div class="star-rating" style="display: flex; gap: 6px; font-size: 1.2rem; margin-top: 4px;">
          <span class="star-btn" data-value="1" style="cursor: pointer; transition: all 0.2s; display: inline-block; font-size: 1.5rem; line-height: 1;">★</span>
          <span class="star-btn" data-value="2" style="cursor: pointer; transition: all 0.2s; display: inline-block; font-size: 1.5rem; line-height: 1;">★</span>
          <span class="star-btn" data-value="3" style="cursor: pointer; transition: all 0.2s; display: inline-block; font-size: 1.5rem; line-height: 1;">★</span>
          <span class="star-btn" data-value="4" style="cursor: pointer; transition: all 0.2s; display: inline-block; font-size: 1.5rem; line-height: 1;">★</span>
          <span class="star-btn" data-value="5" style="cursor: pointer; transition: all 0.2s; display: inline-block; font-size: 1.5rem; line-height: 1;">★</span>
        </div>
        <input type="hidden" name="rating" id="review-rating-value" value="5">
      </label>

      <label style="display: grid; gap: 6px;">Nội dung cảm nhận
        <textarea name="content" rows="4" placeholder="Nhập những suy nghĩ, cảm nhận hay bài viết chia sẻ kinh nghiệm học tập của bạn..." required style="background: rgba(2, 6, 23, 0.4); width: 100%; border: 1px solid rgba(125, 211, 252, 0.24); border-radius: var(--radius); color: #f8fbff; padding: 11px 12px; resize: vertical; font-family: inherit; font-size: 14px;"></textarea>
      </label>

      <button class="btn btn-primary" type="submit" style="margin-top: 8px;">
        <span class="ti-check"></span> Gửi bài viết
      </button>
      <p class="feedback" id="review-feedback" style="min-height: 20px; font-weight: 800; font-size: 14px; margin: 0;"></p>
    </form>
  `;

  // Init stars
  const form = container.querySelector("#submit-review-form");
  const stars = form.querySelectorAll(".star-btn");
  let currentRating = 5;

  const updateStars = (rating) => {
    stars.forEach((s) => {
      const val = parseInt(s.getAttribute("data-value"));
      if (val <= rating) {
        s.style.background = "linear-gradient(135deg, #2ee878, #38bdf8)";
        s.style.webkitBackgroundClip = "text";
        s.style.webkitTextFillColor = "transparent";
        s.style.filter = "drop-shadow(0 0 4px rgba(46, 232, 120, 0.7))";
        s.style.opacity = "1";
      } else {
        s.style.background = "none";
        s.style.webkitBackgroundClip = "initial";
        s.style.webkitTextFillColor = "rgba(166, 180, 201, 0.15)";
        s.style.filter = "none";
        s.style.opacity = "0.4";
      }
    });
  };

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      currentRating = parseInt(star.getAttribute("data-value"));
      form.querySelector("#review-rating-value").value = currentRating;
      updateStars(currentRating);
    });
    star.addEventListener("mouseover", () => {
      updateStars(parseInt(star.getAttribute("data-value")));
    });
    star.addEventListener("mouseleave", () => {
      updateStars(currentRating);
    });
  });

  // Handle submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const feedback = form.querySelector("#review-feedback");
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      feedback.textContent = "Đang gửi bài viết...";
      feedback.style.color = "var(--primary)";

      const formData = new FormData(form);
      const res = await fetch("api/submit_blog.php", {
        method: "POST",
        body: formData,
        credentials: "same-origin"
      });
      const result = await res.json();

      if (!res.ok || !result.ok) {
        feedback.textContent = result.message || "Không thể gửi cảm nhận.";
        feedback.style.color = "var(--danger)";
        return;
      }

      feedback.textContent = "✓ " + result.message;
      feedback.style.color = "var(--primary)";
      form.reset();
      currentRating = 5;
      updateStars(5);

    } catch (err) {
      feedback.textContent = "Lỗi kết nối máy chủ.";
      feedback.style.color = "var(--danger)";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

async function loadApprovedBlogs(container) {
  try {
    const res = await fetch("api/get_blogs.php");
    const result = await res.json();

    if (!res.ok || !result.ok || !result.blogs || result.blogs.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted); border: 1px dashed var(--line); border-radius: var(--radius);">
          Chưa có cảm nhận cộng đồng nào được duyệt. Hãy là người đầu tiên chia sẻ!
        </div>
      `;
      return;
    }

    container.innerHTML = result.blogs.map((blog) => {
      const starsHtml = Array(5).fill(0).map((_, i) => 
        i < blog.rating
          ? `<span style="background: linear-gradient(135deg, #2ee878, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; font-size: 0.95rem; line-height: 1; filter: drop-shadow(0 0 3px rgba(46, 232, 120, 0.45));">★</span>`
          : `<span style="color: rgba(166,180,201,0.15); display: inline-block; font-size: 0.95rem; line-height: 1;">★</span>`
      ).join('');

      const formattedDate = new Date(blog.created_at).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      return `
        <article class="article-card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: 220px;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px;">
              <span style="font-weight: 800; font-size: 13px; color: var(--secondary); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span class="ti-user" style="margin-right: 4px;"></span>${escapeHtml(blog.author_name)}
              </span>
              <div style="display: flex;">${starsHtml}</div>
            </div>
            <h3 style="margin: 0 0 10px; font-size: 18px; line-height: 1.3; color: #ffffff;">${escapeHtml(blog.title)}</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: var(--muted); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;">${escapeHtml(blog.content)}</p>
          </div>
          <span style="display: block; margin-top: 15px; font-size: 12px; color: rgba(166,180,201,0.5);">${formattedDate}</span>
        </article>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--danger);">Không thể tải cảm nhận từ cộng đồng.</div>`;
  }
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
