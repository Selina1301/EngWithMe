(function () {
  const levelStorageKey = "engWithMeReadingMode";
  const modeStorageKey = "engWithMeReadingViewMode";
  const viewedStorageKey = "engWithMeViewedReadingTopics";

  const getAccountKey = (baseKey) => {
    if (typeof window.getAccountKey === "function") {
      return window.getAccountKey(baseKey);
    }
    try {
      const userId = localStorage.getItem("engWithMeUserId") || localStorage.getItem("user_id");
      return userId ? `${baseKey}_user_${userId}` : `${baseKey}_guest`;
    } catch (e) {
      return baseKey;
    }
  };

  const rewardedReadingKey = getAccountKey("engWithMeRewardedReadingTopics");
  let readingLessons = window.READING_LESSONS_FALLBACK || [];
  let activeReadingLevel = localStorage.getItem(levelStorageKey) || "easy";
  let activeReadingMode = localStorage.getItem(modeStorageKey) || "study";
  let viewedTopics = new Set(JSON.parse(localStorage.getItem(viewedStorageKey) || "[]"));
  let rewardedReadingTopics = new Set(JSON.parse(localStorage.getItem(rewardedReadingKey) || "[]"));
  viewedTopics.forEach(id => rewardedReadingTopics.add(id));

  const readingStudyView = document.querySelector("[data-reading-study-view]");
  const readingProgressView = document.querySelector("[data-reading-progress-view]");
  const readingStudyControls = document.querySelector("[data-reading-study-controls]");
  const readingModeTabs = document.querySelectorAll("[data-reading-mode]");
  const readingLevelTabs = document.querySelectorAll("[data-reading-level-tab]");
  const readingSearch = document.querySelector("[data-reading-search]");
  const readingProgressScore = document.querySelector("[data-reading-progress-score]");
  const readingProgressBar = document.querySelector("[data-reading-progress-bar]");
  const readingViewedCount = document.querySelector("[data-reading-viewed-count]");
  const readingCurrentLevel = document.querySelector("[data-reading-current-level]");
  const readingRemaining = document.querySelector("[data-reading-remaining]");
  const readingProgressSummary = document.querySelector("[data-reading-progress-summary]");
  const topicListEl = document.querySelector(".reading-topic-list");
  const passageListEl = document.querySelector("[data-reading-passages]");

  async function loadReadingLessonsFromApi(fallbackLessons) {
    try {
      const response = await fetch("api/learning_content.php?section=reading", {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!response.ok) return fallbackLessons;

      const result = await response.json();
      const loaded = Array.isArray(result.items)
        ? result.items.map(normalizeReadingLesson).filter(Boolean)
        : [];

      return loaded.length ? loaded : fallbackLessons;
    } catch (error) {
      console.warn("Reading content API unavailable; using fallback lessons.", error);
      return fallbackLessons;
    }
  }

  function normalizeReadingLesson(item) {
    const payload = item?.payload && typeof item.payload === "object" ? item.payload : item;
    if (!payload || typeof payload !== "object") return null;

    const lesson = {
      ...payload,
      id: item.key || payload.id,
      level: payload.level || item.level || "easy",
      title: payload.title || item.title || item.key,
      description: payload.description || item.description || "",
      lines: Array.isArray(payload.lines) ? payload.lines : [],
      vocab: Array.isArray(payload.vocab) ? payload.vocab : []
    };

    return lesson.id && lesson.title && lesson.lines.length ? lesson : null;
  }

  function safeText(value) {
    return typeof escapeHtml === "function"
      ? escapeHtml(value)
      : String(value).replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[char]));
  }

  function renderReadingLessons() {
    const topicList = document.querySelector(".reading-topic-list");
    const passageList = document.querySelector("[data-reading-passages]");
    if (!topicList || !passageList) return;

    const query = readingSearch ? readingSearch.value.trim().toLowerCase() : "";

    // Lazy Level Filtering: ONLY render lessons matching activeReadingLevel
    const filteredLessons = readingLessons.filter((lesson) => {
      if (lesson.level !== activeReadingLevel) return false;
      if (!query) return true;
      const searchableText = `${lesson.title} ${lesson.description} ${lesson.lines.flat().join(" ")} ${lesson.vocab.join(" ")}`.toLowerCase();
      return searchableText.includes(query);
    });

    if (filteredLessons.length === 0) {
      topicList.innerHTML = `<div class="empty-state" style="padding:16px; color:rgba(255,255,255,0.6); font-size: 0.9rem;">Không tìm thấy bài nào.</div>`;
      passageList.innerHTML = `<div class="empty-state" style="padding:40px; text-align:center; color:rgba(255,255,255,0.6);">Không tìm thấy bài đọc phù hợp cho từ khóa tìm kiếm.</div>`;
      updateReadingProgress();
      return;
    }

    // Sort lessons: uncompleted topics at top, completed topics at bottom
    const sortedLessons = [...filteredLessons].sort((a, b) => {
      const aViewed = viewedTopics.has(a.id) ? 1 : 0;
      const bViewed = viewedTopics.has(b.id) ? 1 : 0;
      return aViewed - bViewed;
    });

    // Render ONLY topic cards for active level (Lazy Rendering)
    topicList.innerHTML = sortedLessons
      .map((lesson, index) => {
        const isViewed = viewedTopics.has(lesson.id);
        return `
        <article class="reading-topic-card${index === 0 ? " is-active" : ""}${isViewed ? " is-viewed" : ""}" data-reading-topic-link="${safeText(lesson.id)}" data-reading-level="${safeText(lesson.level)}" data-original-index="${index}">
          <button class="reading-topic-open" type="button" data-reading-topic-open aria-label="Mở bài ${safeText(lesson.title)}"></button>
          <span>${safeText(lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1))}</span>
          <strong>${safeText(lesson.title)}</strong>
          <small>${lesson.lines.length} dòng đọc</small>
          <i class="topic-check ti-check" aria-hidden="true"></i>
        </article>
      `;
      })
      .join("");

    // Render ONLY passages for active level (Lazy Rendering)
    passageList.innerHTML = sortedLessons
      .map((lesson, index) => {
        const isViewed = viewedTopics.has(lesson.id);
        return `
        <article class="reading-passage translations-muted${isViewed ? " is-viewed" : ""}" id="${safeText(lesson.id)}" data-reading-level="${safeText(lesson.level)}" data-original-index="${index}" data-reading-topic>
          <div class="reading-passage-head">
            <div>
              <span class="level-chip ${safeText(lesson.level)}">${safeText(lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1))}</span>
              <h2>${safeText(lesson.title)}</h2>
              <p>${safeText(lesson.description)}</p>
            </div>
            <div class="reading-passage-head-actions">
              <span class="reading-points-badge" title="Điểm kinh nghiệm nhận được"><i class="ti-star"></i> +10 XP</span>
              <button class="translation-toggle" type="button" data-toggle-translation="${safeText(lesson.id)}">
                <i class="ti-eye"></i>
                Bật dịch
              </button>
            </div>
          </div>
          <div class="sentence-stack dialogue-card">
            ${lesson.lines.map(([en, vi]) => `<div class="sentence-row"><p class="sentence-en">${safeText(en)}</p><p class="sentence-vi">${safeText(vi)}</p></div>`).join("")}
            <div class="sentence-row"><p class="sentence-en">Key vocabulary: ${safeText(lesson.vocab.map((item) => item.split(" = ")[0]).join("; "))}</p><p class="sentence-vi">Từ hay: ${safeText(lesson.vocab.join("; "))}</p></div>
          </div>
          <div class="reading-passage-foot">
            <button class="btn btn-ghost btn-sm${isViewed ? " is-active" : ""}" type="button" data-reading-mark-read="${safeText(lesson.id)}">
              <i class="ti-check"></i> Done
            </button>
          </div>
        </article>
      `;
      })
      .join("");

    setActiveTopic(sortedLessons[0].id, false);
    updateReadingProgress();
  }

  function updateViewedCards() {
    document.querySelectorAll(".reading-topic-card").forEach((card) => {
      const isViewed = viewedTopics.has(card.dataset.readingTopicLink);
      card.classList.toggle("is-viewed", isViewed);
    });
    document.querySelectorAll(".reading-passage").forEach((passage) => {
      const isViewed = viewedTopics.has(passage.id);
      passage.classList.toggle("is-viewed", isViewed);
      const markBtn = passage.querySelector("[data-reading-mark-read]");
      if (markBtn) {
        markBtn.classList.toggle("is-active", isViewed);
        markBtn.innerHTML = '<i class="ti-check"></i> Done';
      }
    });
  }

  function saveViewedTopics() {
    const list = [...viewedTopics];
    localStorage.setItem(viewedStorageKey, JSON.stringify(list));
    localStorage.setItem("engWithMeReadingProgress", JSON.stringify(list));
  }

  function updateReadingProgress() {
    const totalInApp = readingLessons.length;
    const viewedCount = Array.from(viewedTopics).length;
    const progress = totalInApp ? Math.round((viewedCount / totalInApp) * 100) : 0;
    const remaining = Math.max(0, totalInApp - viewedCount);

    if (readingProgressScore) readingProgressScore.textContent = `${progress}%`;
    if (readingProgressBar) readingProgressBar.style.width = `${progress}%`;
    if (readingViewedCount) readingViewedCount.textContent = `${viewedCount}/${totalInApp}`;
    if (readingCurrentLevel) readingCurrentLevel.textContent = activeReadingLevel.charAt(0).toUpperCase() + activeReadingLevel.slice(1);
    if (readingRemaining) readingRemaining.textContent = remaining;
    if (readingProgressSummary) {
      readingProgressSummary.textContent = totalInApp
        ? `Bạn đã tự đánh dấu ${viewedCount}/${totalInApp} bài đọc. Chế độ lọc hiện tại: ${activeReadingLevel.toUpperCase()}.`
        : "Chưa có dữ liệu bài đọc.";
    }
  }

  function syncReadingModeTabs() {
    readingModeTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.readingMode === activeReadingMode);
    });
  }

  function setReadingMode(mode) {
    activeReadingMode = mode === "progress" ? "progress" : "study";
    localStorage.setItem(modeStorageKey, activeReadingMode);
    syncReadingModeTabs();
    if (readingStudyView) readingStudyView.hidden = activeReadingMode !== "study";
    if (readingProgressView) readingProgressView.hidden = activeReadingMode !== "progress";
    if (readingStudyControls) readingStudyControls.style.display = activeReadingMode === "progress" ? "none" : "flex";
    if (activeReadingMode === "progress") updateReadingProgress();
  }

  function setActiveTopic(topicId, shouldScroll = false) {
    const cards = document.querySelectorAll(".reading-topic-card");
    const passages = document.querySelectorAll(".reading-passage");
    if (!cards.length || !passages.length) return;

    let activeCard = document.querySelector(`[data-reading-topic-link="${topicId}"]`);
    if (!activeCard) {
      activeCard = cards[0];
      topicId = activeCard.dataset.readingTopicLink;
    }

    cards.forEach((card) => {
      const isTarget = card.dataset.readingTopicLink === topicId;
      card.classList.toggle("is-active", isTarget);
    });

    passages.forEach((passage) => {
      const isTarget = passage.id === topicId;
      passage.style.display = isTarget ? "block" : "none";
    });

    if (shouldScroll) {
      const targetPassage = document.getElementById(topicId);
      if (targetPassage) {
        targetPassage.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function bindEvents() {
    // Topic card clicks
    if (topicListEl) {
      topicListEl.addEventListener("click", (e) => {
        const card = e.target.closest(".reading-topic-card");
        if (!card) return;
        const topicId = card.dataset.readingTopicLink;
        const isOpenBtn = e.target.closest("[data-reading-topic-open]");
        setActiveTopic(topicId, !!isOpenBtn || e.target.tagName !== "BUTTON");
      });
    }

    // Passage card clicks (mark read, toggle translation)
    if (passageListEl) {
      passageListEl.addEventListener("click", (e) => {
        const markBtn = e.target.closest("[data-reading-mark-read]");
        if (markBtn) {
          const topicId = markBtn.dataset.readingMarkRead;
          if (viewedTopics.has(topicId)) {
            viewedTopics.delete(topicId);
          } else {
            viewedTopics.add(topicId);
            if (!rewardedReadingTopics.has(topicId)) {
              rewardedReadingTopics.add(topicId);
              localStorage.setItem(rewardedReadingKey, JSON.stringify([...rewardedReadingTopics]));
              if (typeof addXP === "function") {
                addXP(10, "Hoàn thành bài đọc");
              }
            }
          }
          saveViewedTopics();
          updateViewedCards();
          updateReadingProgress();
          return;
        }

        const toggleBtn = e.target.closest("[data-toggle-translation]");
        if (toggleBtn) {
          const target = document.getElementById(toggleBtn.dataset.toggleTranslation);
          if (!target) return;
          const isHidden = target.classList.toggle("translations-muted");
          target.querySelectorAll(".sentence-vi").forEach((el) => el.classList.remove("is-revealed"));
          toggleBtn.classList.toggle("is-showing", !isHidden);
          toggleBtn.innerHTML = isHidden ? '<i class="ti-eye"></i> Bật dịch' : '<i class="ti-eye"></i> Tắt dịch';
          return;
        }

        const sentenceVi = e.target.closest(".sentence-vi");
        if (sentenceVi && sentenceVi.closest(".translations-muted")) {
          sentenceVi.classList.toggle("is-revealed");
        }
      });
    }

    // Level Tab Switching
    readingLevelTabs.forEach((tab) => {
      if (tab.dataset.readingLevelTab === activeReadingLevel) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
      tab.addEventListener("click", () => {
        activeReadingLevel = tab.dataset.readingLevelTab;
        localStorage.setItem(levelStorageKey, activeReadingLevel);
        readingLevelTabs.forEach((item) => item.classList.remove("active"));
        tab.classList.add("active");
        renderReadingLessons();
      });
    });

    // Reading Mode Switching (Học / Tiến độ)
    readingModeTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setReadingMode(tab.dataset.readingMode);
      });
    });

    // Search input
    if (readingSearch) {
      readingSearch.addEventListener("input", () => renderReadingLessons());
    }
  }

  async function initReadingLab() {
    readingLessons = await loadReadingLessonsFromApi(readingLessons);
    bindEvents();
    renderReadingLessons();
    setReadingMode(activeReadingMode);
    initReadingCalendarModal();

    const initialReadingTopic = window.location.hash.replace("#", "");
    if (initialReadingTopic && document.getElementById(initialReadingTopic)) {
      setActiveTopic(initialReadingTopic, true);
    }
  }

  function initReadingCalendarModal() {
    const modal = document.getElementById("readingCalendarModal");
    const scheduleBtn = document.querySelector(".schedule-button");
    const closeBtn = document.querySelector("[data-close-reading-modal]");
    const monthLabel = document.querySelector("[data-cal-month-label]");
    const daysGrid = document.querySelector("[data-cal-days-grid]");
    const prevBtn = document.querySelector('[data-cal-nav="prev"]');
    const nextBtn = document.querySelector('[data-cal-nav="next"]');
    const streakCountEl = document.querySelector("[data-reading-streak-count]");
    const todayTitleEl = document.querySelector("[data-today-title]");
    const todayDescEl = document.querySelector("[data-today-desc]");
    const goTodayBtn = document.querySelector("[data-go-today-topic]");

    if (!modal || !scheduleBtn) return;

    let now = new Date();
    let currentCalYear = now.getFullYear();
    let currentCalMonth = now.getMonth();
    let todayLessonTarget = null;

    function getLevelForDayOfWeek(dow) {
      // dow: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
      if (dow === 0 || dow === 2 || dow === 4) return "easy";
      if (dow === 1 || dow === 3 || dow === 5) return "medium";
      return "hard";
    }

    function getDayName(dow) {
      const names = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
      return names[dow] || "";
    }

    function calculateStreak() {
      const viewedCount = Array.from(viewedTopics).length;
      if (viewedCount === 0) return 0;
      // Calculate streak based on viewed topics count or consecutive study dates
      let dates = JSON.parse(localStorage.getItem("engWithMeStudyDates") || "[]");
      const todayStr = new Date().toISOString().slice(0, 10);
      if (viewedCount > 0 && !dates.includes(todayStr)) {
        dates.push(todayStr);
        localStorage.setItem("engWithMeStudyDates", JSON.stringify(dates));
      }
      return Math.max(1, dates.length);
    }

    function updateTodayAssignment() {
      const todayNow = new Date();
      // JavaScript getDay(): 0=Sun, 1=Mon, ..., 6=Sat
      const jsDay = todayNow.getDay();
      const dow = jsDay === 0 ? 6 : jsDay - 1; // convert to 0=Mon, 6=Sun
      const level = getLevelForDayOfWeek(dow);

      const lesson = readingLessons.find((l) => l.level === level) || readingLessons[0];
      todayLessonTarget = lesson;

      if (todayTitleEl) todayTitleEl.textContent = lesson ? lesson.title : "Bài đọc hôm nay";
      if (todayDescEl) {
        todayDescEl.textContent = `Cấp độ: ${level.toUpperCase()} • Lịch ${getDayName(dow)}`;
      }
    }

    function renderCalendarGrid(year, month) {
      if (!daysGrid || !monthLabel) return;

      const monthNames = [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
      ];
      monthLabel.textContent = `${monthNames[month]}, ${year}`;

      // Get first day of month (Monday index: 0..6)
      const firstDay = new Date(year, month, 1);
      let firstDayDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const todayNow = new Date();
      const isCurrentMonth = todayNow.getFullYear() === year && todayNow.getMonth() === month;
      const todayDate = todayNow.getDate();

      const studyDates = new Set(JSON.parse(localStorage.getItem("engWithMeStudyDates") || "[]"));

      let html = "";

      // Empty lead cells
      for (let i = 0; i < firstDayDow; i++) {
        html += `<div class="calendar-day-cell is-empty"></div>`;
      }

      // Days cells
      for (let d = 1; d <= daysInMonth; d++) {
        const cellDow = (firstDayDow + d - 1) % 7;
        const level = getLevelForDayOfWeek(cellDow);
        const isToday = isCurrentMonth && d === todayDate;
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const isDone = studyDates.has(dateStr) || (isToday && viewedTopics.size > 0);

        let cellClasses = "calendar-day-cell";
        if (isToday) cellClasses += " is-today";
        if (isDone) cellClasses += " is-done";

        html += `
          <div class="${cellClasses}">
            ${isDone ? '<i class="ti-check done-check"></i>' : ""}
            <span>${d}</span>
            <span class="day-level-dot ${level}" title="${level.toUpperCase()}"></span>
          </div>
        `;
      }

      daysGrid.innerHTML = html;
      if (streakCountEl) streakCountEl.textContent = calculateStreak();
    }

    function openModal() {
      const todayNow = new Date();
      currentCalYear = todayNow.getFullYear();
      currentCalMonth = todayNow.getMonth();
      updateTodayAssignment();
      renderCalendarGrid(currentCalYear, currentCalMonth);
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }

    scheduleBtn.addEventListener("click", openModal);

    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        currentCalMonth--;
        if (currentCalMonth < 0) {
          currentCalMonth = 11;
          currentCalYear--;
        }
        renderCalendarGrid(currentCalYear, currentCalMonth);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentCalMonth++;
        if (currentCalMonth > 11) {
          currentCalMonth = 0;
          currentCalYear++;
        }
        renderCalendarGrid(currentCalYear, currentCalMonth);
      });
    }

    if (goTodayBtn) {
      goTodayBtn.addEventListener("click", () => {
        closeModal();
        if (todayLessonTarget) {
          activeReadingLevel = todayLessonTarget.level;
          localStorage.setItem(levelStorageKey, activeReadingLevel);
          readingLevelTabs.forEach((tab) => {
            tab.classList.toggle("active", tab.dataset.readingLevelTab === activeReadingLevel);
          });
          renderReadingLessons();
          setActiveTopic(todayLessonTarget.id, true);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReadingLab);
  } else {
    initReadingLab();
  }
})();
