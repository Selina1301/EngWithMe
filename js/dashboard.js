function updateDashboardProgressDisplay(progress) {
  document.querySelectorAll("[data-dashboard-progress]").forEach((element) => {
    element.textContent = `${progress}%`;
    const progressBar = element.closest(".stat-card")?.querySelector(".progress-track span");
    if (progressBar) progressBar.style.width = `${progress}%`;
  });
}

async function initDashboard() {
  if (typeof renderDashboardProgressUI === "function") {
    renderDashboardProgressUI();
  }

  const nameElement = document.querySelector("[data-student-name]");
  const levelElement = document.querySelector("[data-student-level]");
  const progressElement = document.querySelector("[data-dashboard-progress]");
  const roadmapElement = document.querySelector("[data-dashboard-roadmap]");
  if (!nameElement && !levelElement && !progressElement && !roadmapElement) return;

  if (typeof window.loadGrammarTopicsFromApi === "function") {
    await window.loadGrammarTopicsFromApi();
  }

  let hasServerUser = false;
  try {
    const response = await fetch("api/me.php", { credentials: "same-origin" });
    if (response.ok) {
      const result = await response.json();
      if (result.ok) {
        if (typeof persistAuthUser === "function") {
          persistAuthUser(result.user);
        } else {
          localStorage.setItem("engWithMeStudentName", result.user.name || "Nguyễn Văn A");
          localStorage.setItem("engWithMeGoal", result.user.goal || "Giao tiếp hằng ngày");
          localStorage.setItem("engWithMeLevel", result.user.level || "A1");
          localStorage.setItem("engWithMeUserEmail", result.user.email || "");
          localStorage.setItem("engWithMeUserRole", result.user.role || "user");
          localStorage.setItem("engWithMeUserStatus", result.user.status || "active");
          localStorage.setItem("engWithMeUserId", String(result.user.id || ""));
          localStorage.setItem("engWithMeUserAvatar", result.user.avatar || "");
        }
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
