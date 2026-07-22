(() => {
  const modeTabs = document.querySelectorAll("[data-vocab-mode]");
  const studyView = document.querySelector("[data-vocab-study-view]");
  const progressView = document.querySelector("[data-vocab-progress-view]");
  const myVocabView = document.querySelector("[data-my-vocab-view]");
  const quizSection = document.querySelector("[data-vocab-quiz-section]");
  const levelTabs = document.querySelectorAll(".level-tab");
  const levelIntro = document.querySelector("[data-level-intro]");
  const unseenTrack = document.querySelector("[data-unseen-track]");
  const unseenCount = document.querySelector("[data-unseen-count]");
  const visitedBlock = document.querySelector("[data-visited-block]");
  const visitedTrack = document.querySelector("[data-visited-track]");
  const visitedCount = document.querySelector("[data-visited-count]");
  const savedCount = document.querySelector("[data-saved-count]");
  const topicSearch = document.querySelector("[data-topic-search]");
  const quizQuestion = document.querySelector("[data-quiz-question]");
  const quizOptions = document.querySelector("[data-quiz-options]");

  const progressScore = document.querySelector("[data-vocab-progress-score]");
  const progressSummary = document.querySelector("[data-vocab-progress-summary]");
  const progressBar = document.querySelector("[data-vocab-progress-bar]");
  const progressAccuracy = document.querySelector("[data-vocab-accuracy]");
  const progressStreak = document.querySelector("[data-vocab-streak]");
  const progressSavedWords = document.querySelector("[data-vocab-saved-words]");
  const progressQuizTotal = document.querySelector("[data-vocab-quiz-total]");
  const progressSavedWordsTotal = document.querySelector("[data-vocab-saved-words-total]");
  const progressViewedTopics = document.querySelector("[data-vocab-viewed-topics]");
  const progressViewedTopicsNote = document.querySelector("[data-vocab-viewed-topics-note]");
  const progressWrongTotal = document.querySelector("[data-vocab-wrong-total]");
  const progressQuizDone = document.querySelector("[data-vocab-quiz-done]");
  const progressScoreLarge = document.querySelector("[data-vocab-progress-score-large]");
  const progressBarLarge = document.querySelector("[data-vocab-progress-bar-large]");
  const progressViewedContribution = document.querySelector("[data-vocab-viewed-contribution]");
  const progressSavedContribution = document.querySelector("[data-vocab-saved-contribution]");
  const progressQuizContribution = document.querySelector("[data-vocab-quiz-contribution]");
  const focusQuizButton = document.querySelector("[data-vocab-focus-quiz]");
  const randomTopicButton = document.querySelector("[data-vocab-random-topic]");
  const savedWordsOpenButtons = document.querySelectorAll("[data-saved-words-open]");
  const savedWordsPopover = document.querySelector("[data-saved-words-popover]");
  const savedWordsList = document.querySelector("[data-saved-words-list]");
  const savedWordsCloseButtons = document.querySelectorAll("[data-saved-words-close]");
  const myVocabLevelTabs = document.querySelectorAll("[data-my-vocab-level]");
  const myVocabList = document.querySelector("[data-my-vocab-list]");
  const myVocabTotal = document.querySelector("[data-my-vocab-total]");

  if (typeof vocabularyData === "undefined") return;

  const initialLevel = new URLSearchParams(window.location.search).get("level");
  const modeStorageKey = getAccountKey("engWithMeVocabMode");
  const savedStorageKey = getAccountKey("engWithMeSavedVocabularyWords");
  const quizStatsKey = getAccountKey("engWithMeVocabQuizStats");
  const fastStreakKey = getAccountKey("engWithMeFastStreak");
  const activityStorageKey = getAccountKey("engWithMeVocabActivityDays");
  let activeLevel = vocabularyData[initialLevel] ? initialLevel : "easy";
  let activeMode = ["study", "progress", "my-vocab"].includes(localStorage.getItem(modeStorageKey)) ? localStorage.getItem(modeStorageKey) : "study";
  let activeMyVocabLevel = "easy";
  let savedWordRecords = normalizeSavedWordRecords(readLocalArray(savedStorageKey));
  let savedWords = new Set(savedWordRecords.keys());
  const quizStats = normalizeQuizStats(readLocalObject(quizStatsKey));
  let quizTimer = null;
  let fastQuestionStreak = Math.max(0, parseInt(localStorage.getItem(fastStreakKey) || "0", 10));

  function normalizeQuizStats(value) {
    if (!value || typeof value !== "object") {
      return {
        correct: 0,
        total: 0,
        wrongWords: {}
      };
    }

    return {
      correct: Number(value.correct || 0),
      total: Number(value.total || 0),
      wrongWords: value.wrongWords && typeof value.wrongWords === "object" ? value.wrongWords : {}
    };
  }

  function normalizeSavedWordRecords(value) {
    const records = new Map();
    if (!Array.isArray(value)) return records;

    value.forEach(item => {
      if (typeof item === "string") {
        records.set(item, { key: item, studyLevel: "easy" });
        return;
      }

      if (!item || typeof item !== "object" || !item.key) return;
      const studyLevel = ["easy", "medium", "hard"].includes(item.studyLevel) ? item.studyLevel : "easy";
      records.set(item.key, { key: item.key, studyLevel });
    });

    return records;
  }

  function saveSavedWordRecords() {
    savedWords = new Set(savedWordRecords.keys());
    localStorage.setItem(savedStorageKey, JSON.stringify(Array.from(savedWordRecords.values())));
  }

  function saveArray(key, set) {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  }

  function todayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseDayKey(key) {
    const parts = String(key || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function isNextDay(previousKey, nextKey) {
    const previous = parseDayKey(previousKey);
    const next = parseDayKey(nextKey);
    if (!previous || !next) return false;
    const diff = next.getTime() - previous.getTime();
    return diff === 24 * 60 * 60 * 1000;
  }

  function calculateStreak(days) {
    const uniqueDays = Array.from(new Set(days)).sort();
    if (!uniqueDays.length) {
      return { current: 0, best: 0 };
    }

    let current = 0;
    let cursor = todayKey();
    while (uniqueDays.includes(cursor)) {
      current += 1;
      const currentDate = parseDayKey(cursor);
      if (!currentDate) break;
      currentDate.setDate(currentDate.getDate() - 1);
      cursor = todayKey(currentDate);
    }

    let best = 0;
    let chain = 0;
    uniqueDays.forEach((day, index) => {
      if (index === 0 || isNextDay(uniqueDays[index - 1], day)) {
        chain += 1;
      } else {
        chain = 1;
      }
      best = Math.max(best, chain);
    });

    return { current, best };
  }

  function readLocalArray(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  // Read local storage object with safety fallback
  function readLocalObject(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function recordVocabActivity() {
    const days = new Set(readLocalArray(activityStorageKey));
    days.add(todayKey());
    localStorage.setItem(activityStorageKey, JSON.stringify(Array.from(days).sort()));
  }

  function saveQuizStats() {
    localStorage.setItem(quizStatsKey, JSON.stringify(quizStats));
    localStorage.setItem(fastStreakKey, String(fastQuestionStreak));

    const userId = localStorage.getItem("engWithMeUserId");
    if (userId) {
      try {
        const body = new FormData();
        body.append("correct", quizStats.correct || 0);
        body.append("total", quizStats.total || 0);
        body.append("fast_streak", fastQuestionStreak || 0);
        body.append("wrong_words", JSON.stringify(quizStats.wrongWords || {}));
        body.append("activity_day", todayKey());
        fetch("api/sync_quiz.php", {
          method: "POST",
          body,
          credentials: "same-origin"
        })
        .then(response => {
          if (response.ok && typeof AppCache !== "undefined") {
            AppCache.invalidate(`quiz_user_${userId}`);
          }
        });
      } catch (e) {
        console.error("Failed to sync quiz stats to database:", e);
      }
    }
  }

  // Sync quiz stats & fast streak from server DB on init
  const userIdForInit = localStorage.getItem("engWithMeUserId");
  if (userIdForInit) {
    fetch("api/sync_quiz.php", { credentials: "same-origin" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.ok && data.stats) {
          if (typeof data.stats.fastStreak === "number") {
            fastQuestionStreak = Math.max(fastQuestionStreak, data.stats.fastStreak);
            localStorage.setItem(fastStreakKey, String(fastQuestionStreak));
            const streakTextEl = document.querySelector("[data-fast-streak-text]");
            if (streakTextEl) {
              streakTextEl.textContent = `Streak: ${fastQuestionStreak} (+2 XP)`;
            }
          }
        }
      })
      .catch(() => {});
  }

  function updateSavedCount() {
    if (!savedCount) return;
    const validSavedCount = getSavedWordEntries().length;
    savedCount.textContent = `${validSavedCount} từ đã lưu`;
    savedCount.setAttribute("aria-label", `Mở danh sách ${validSavedCount} từ đã lưu`);
  }

  function getAllWordEntries() {
    return Object.entries(vocabularyData).flatMap(([levelKey, levelData]) =>
      levelData.topics.flatMap(topic =>
        topic.words.map(word => ({
          key: `${levelKey}-${topic.id}-${word.word}`,
          levelKey,
          levelLabel: levelData.label,
          topicName: topic.name,
          ...word
        }))
      )
    );
  }

  function getSavedWordEntries() {
    const entriesByKey = new Map(getAllWordEntries().map(entry => [entry.key, entry]));
    return Array.from(savedWordRecords.values())
      .map(record => {
        const entry = entriesByKey.get(record.key);
        if (entry) return { ...entry, studyLevel: record.studyLevel };
        if (record.key && record.key.startsWith("custom-")) {
          return {
            key: record.key,
            studyLevel: record.studyLevel || "easy",
            levelKey: record.studyLevel || "easy",
            levelLabel: (record.studyLevel || "easy").toUpperCase(),
            topicName: record.topicName || "Listening Lab",
            word: record.word || "",
            phonetic: record.phonetic || "/.../",
            meaning: record.meaning || "Từ vựng từ bài nghe",
            example: record.example || ""
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  function getQuizAccuracy() {
    return quizStats.total ? Math.round((quizStats.correct / quizStats.total) * 100) : 0;
  }

  function getAllTopicEntries() {
    return Object.entries(vocabularyData).flatMap(([levelKey, levelData]) =>
      levelData.topics.map(topic => ({
        key: `${levelKey}-${topic.id}`,
        levelKey,
        id: topic.id
      }))
    );
  }

  function getViewedTopicStats() {
    let viewedList = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(getAccountKey("engWithMeViewedTopics")) || "[]");
      viewedList = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      viewedList = [];
    }

    const allTopicKeys = new Set(getAllTopicEntries().map(topic => topic.key));
    const viewedKeys = new Set(
      viewedList
        .filter(item => item && typeof item === "object")
        .map(item => `${item.level}-${item.id}`)
        .filter(key => allTopicKeys.has(key))
    );
    const totalTopics = allTopicKeys.size;
    const viewedTopicCount = viewedKeys.size;
    const viewedPercent = totalTopics ? Math.round((viewedTopicCount / totalTopics) * 100) : 0;

    return { totalTopics, viewedTopicCount, viewedPercent };
  }

  function getProgressSnapshot() {
    const totalWords = getAllWordEntries().length;
    const savedWordCount = getSavedWordEntries().length;
    const savedPercent = totalWords ? Math.round((savedWordCount / totalWords) * 100) : 0;
    const viewedTopics = getViewedTopicStats();
    const accuracy = getQuizAccuracy();
    const quizPracticePercent = Math.min(100, Math.round((quizStats.total / 30) * 100));
    const quizScore = quizStats.total ? Math.round((accuracy * 0.7) + (quizPracticePercent * 0.3)) : 0;
    const viewedContribution = Math.round(viewedTopics.viewedPercent * 0.3);
    const savedContribution = Math.round(savedPercent * 0.4);
    const quizContribution = Math.round(quizScore * 0.3);
    const progressScoreValue = Math.round(
      viewedContribution +
      savedContribution +
      quizContribution
    );
    const activityDays = readLocalArray(activityStorageKey);
    const streak = calculateStreak(activityDays);
    const wrongTotal = Math.max(0, quizStats.total - quizStats.correct);
    const wrongUnique = Object.keys(quizStats.wrongWords || {}).length;

    return {
      totalWords,
      savedWordCount,
      savedPercent,
      viewedTopics,
      accuracy,
      quizPracticePercent,
      quizScore,
      viewedContribution,
      savedContribution,
      quizContribution,
      progressScoreValue,
      streak,
      wrongTotal,
      wrongUnique
    };
  }

  function updateProgressView() {
    const snapshot = getProgressSnapshot();
    const scoreText = `${snapshot.progressScoreValue}%`;
    const savedWordText = `${snapshot.savedWordCount}/${snapshot.totalWords}`;
    const wrongReviewCount = snapshot.wrongUnique || snapshot.wrongTotal;

    if (progressScore) progressScore.textContent = scoreText;
    if (progressScoreLarge) progressScoreLarge.textContent = scoreText;
    if (progressBar) progressBar.style.width = `${snapshot.progressScoreValue}%`;
    if (progressBarLarge) progressBarLarge.style.width = `${snapshot.progressScoreValue}%`;
    if (progressAccuracy) progressAccuracy.textContent = `${snapshot.accuracy}%`;
    if (progressStreak) progressStreak.textContent = `${snapshot.streak.current} ngày`;
    if (progressSavedWords) progressSavedWords.textContent = savedWordText;
    if (progressQuizTotal) progressQuizTotal.textContent = quizStats.total;
    if (progressSavedWordsTotal) progressSavedWordsTotal.textContent = snapshot.savedWordCount;
    if (progressViewedTopics) progressViewedTopics.textContent = `${snapshot.viewedTopics.viewedTopicCount}/${snapshot.viewedTopics.totalTopics}`;
    if (progressViewedTopicsNote) progressViewedTopicsNote.textContent = `${snapshot.viewedTopics.viewedPercent}% chủ đề đã mở`;
    if (progressWrongTotal) progressWrongTotal.textContent = wrongReviewCount;
    if (progressQuizDone) progressQuizDone.textContent = quizStats.total;

    if (progressSummary) {
      progressSummary.textContent = snapshot.totalWords
        ? `Bạn đã xem ${snapshot.viewedTopics.viewedTopicCount}/${snapshot.viewedTopics.totalTopics} chủ đề, lưu ${savedWordText} từ và đạt ${snapshot.accuracy}% độ chính xác quiz.`
        : "Chưa có dữ liệu học tập.";
    }
    if (progressViewedContribution) progressViewedContribution.textContent = `${snapshot.viewedContribution}% / 30%`;
    if (progressSavedContribution) progressSavedContribution.textContent = `${snapshot.savedContribution}% / 40%`;
    if (progressQuizContribution) progressQuizContribution.textContent = `${snapshot.quizContribution}% / 30%`;
  }

  function refreshVocabularyStateFromStorage() {
    savedWordRecords = normalizeSavedWordRecords(readLocalArray(savedStorageKey));
    savedWords = new Set(savedWordRecords.keys());
    Object.assign(quizStats, normalizeQuizStats(readLocalObject(quizStatsKey)));

    updateSavedCount();
    renderTopics();
    renderMyVocab();
    updateProgressView();
  }

  window.refreshVocabularyStateFromStorage = refreshVocabularyStateFromStorage;

  function renderSavedWordsList() {
    if (!savedWordsList) return;
    const entries = getSavedWordEntries();
    const isLoggedIn = !!localStorage.getItem("engWithMeUserId");

    savedWordsList.innerHTML = entries.length
      ? entries.map(entry => `
          <article class="saved-word-item">
            <div>
              <span>${entry.studyLevel.toUpperCase()} · ${entry.levelLabel} · ${entry.topicName}</span>
              <h3>${entry.word}</h3>
              <p>${entry.phonetic} · ${entry.meaning}</p>
              <small>${entry.example}</small>
            </div>
            <button type="button" data-remove-saved-word="${entry.key}">Bỏ lưu</button>
          </article>
        `).join("")
      : (!isLoggedIn
        ? `
          <article class="saved-word-empty">
            <h3>Bạn chưa đăng nhập</h3>
            <p>Vui lòng đăng nhập tài khoản trước mới có thể lưu và ôn tập các từ vựng mới.</p>
            <a href="login.html" class="btn btn-primary" style="display: inline-block; margin-top: 15px; text-decoration: none;">Đăng nhập ngay</a>
          </article>
        `
        : `
          <article class="saved-word-empty">
            <h3>Chưa có từ nào được lưu</h3>
            <p>Vào phần Xem từ trong từng chủ đề và bấm Lưu từ để tạo danh sách ôn nhanh.</p>
          </article>
        `);

    savedWordsList.querySelectorAll("[data-remove-saved-word]").forEach(button => {
      button.addEventListener("click", () => {
        const vocabKey = button.dataset.removeSavedWord;
        savedWordRecords.delete(vocabKey);
        saveSavedWordRecords();
        recordVocabActivity();
        updateSavedCount();
        renderSavedWordsList();
        renderMyVocab();
        updateProgressView();

        // Sync to DB
        const userId = localStorage.getItem("engWithMeUserId");
        if (userId) {
          const body = new FormData();
          body.append("action", "remove");
          body.append("vocab_key", vocabKey);
          body.append("activity_day", todayKey());
          fetch("api/sync_vocab.php", {
            method: "POST",
            body,
            credentials: "same-origin"
          })
          .then(response => {
            if (response.ok && typeof AppCache !== "undefined") {
              AppCache.invalidate(`vocab_user_${userId}`);
            }
          })
          .catch(e => console.error("Failed to sync vocab removal:", e));
        }
      });
    });
  }

  function renderMyVocab() {
    if (!myVocabList) return;
    const entries = getSavedWordEntries();
    const filteredEntries = entries.filter(entry => entry.studyLevel === activeMyVocabLevel);

    if (myVocabTotal) myVocabTotal.textContent = `${entries.length} từ`;

    myVocabLevelTabs.forEach(tab => {
      tab.classList.toggle("active", tab.dataset.myVocabLevel === activeMyVocabLevel);
    });

    const isLoggedIn = !!localStorage.getItem("engWithMeUserId");

    myVocabList.innerHTML = filteredEntries.length
      ? filteredEntries.map(entry => `
          <article class="my-vocab-card ${entry.studyLevel}">
            <div>
              <span>${entry.topicName}</span>
              <h3>${entry.word}</h3>
              <p>${entry.phonetic} · ${entry.meaning}</p>
              <small>${entry.example}</small>
            </div>
            <button type="button" data-remove-my-vocab="${entry.key}">Bỏ lưu</button>
          </article>
        `).join("")
      : (!isLoggedIn
        ? `
          <article class="saved-word-empty my-vocab-empty">
            <h3>Bạn chưa đăng nhập</h3>
            <p>Vui lòng đăng nhập tài khoản trước mới có thể lưu và ôn tập các từ vựng mới.</p>
            <a href="login.html" class="btn btn-primary" style="display: inline-block; margin-top: 15px; text-decoration: none;">Đăng nhập ngay</a>
          </article>
        `
        : `
          <article class="saved-word-empty my-vocab-empty">
            <h3>Chưa có từ mức ${activeMyVocabLevel.toUpperCase()}</h3>
            <p>Khi bấm Lưu từ, hãy chọn mức Easy, Medium hoặc Hard để đưa từ vào danh sách này.</p>
          </article>
        `);

    myVocabList.querySelectorAll("[data-remove-my-vocab]").forEach(button => {
      button.addEventListener("click", () => {
        const vocabKey = button.dataset.removeMyVocab;
        savedWordRecords.delete(vocabKey);
        saveSavedWordRecords();
        recordVocabActivity();
        updateSavedCount();
        renderMyVocab();
        updateProgressView();

        // Sync to DB
        const userId = localStorage.getItem("engWithMeUserId");
        if (userId) {
          const body = new FormData();
          body.append("action", "remove");
          body.append("vocab_key", vocabKey);
          body.append("activity_day", todayKey());
          fetch("api/sync_vocab.php", {
            method: "POST",
            body,
            credentials: "same-origin"
          })
          .then(response => {
            if (response.ok && typeof AppCache !== "undefined") {
              AppCache.invalidate(`vocab_user_${userId}`);
            }
          })
          .catch(e => console.error("Failed to sync my-vocab removal:", e));
        }
      });
    });
  }

  function openSavedWords() {
    renderSavedWordsList();
    if (savedWordsPopover) savedWordsPopover.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeSavedWords() {
    if (savedWordsPopover) savedWordsPopover.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function syncLevelTabs() {
    levelTabs.forEach(tab => {
      tab.classList.toggle("active", tab.dataset.level === activeLevel);
    });
  }

  function syncModeTabs() {
    modeTabs.forEach(tab => {
      tab.classList.toggle("is-active", tab.dataset.vocabMode === activeMode);
    });
  }

  function setVocabMode(mode) {
    activeMode = ["study", "progress", "my-vocab"].includes(mode) ? mode : "study";
    localStorage.setItem(modeStorageKey, activeMode);
    syncModeTabs();

    if (studyView) studyView.hidden = activeMode !== "study";
    if (quizSection) quizSection.hidden = activeMode !== "study";
    if (progressView) progressView.hidden = activeMode !== "progress";
    if (myVocabView) myVocabView.hidden = activeMode !== "my-vocab";

    if (activeMode === "progress") {
      updateProgressView();
    }

    if (activeMode === "my-vocab") {
      renderMyVocab();
    }
  }

  function renderLevelIntro() {
    if (!levelIntro) return;
    const level = vocabularyData[activeLevel];

    levelIntro.innerHTML = `
      <div class="level-heading ${activeLevel}">
        <span>${level.label}</span>
        <h2>${level.title}</h2>
        <p>${level.subtitle}</p>
      </div>
    `;
  }

  function topicCardTemplate(topic) {
    return `
      <article class="topic-card rail-card ${activeLevel}" data-topic-id="${topic.id}">
        <button class="topic-card-open" type="button" data-topic-open data-topic-id="${topic.id}" aria-label="Mở chủ đề ${topic.name}"></button>
        <span class="topic-level-chip">${vocabularyData[activeLevel].label}</span>
        <div class="topic-icon" aria-hidden="true"><i class="${topic.icon || "ti-book"}"></i></div>
        <div class="topic-card-body">
          <h3>${topic.name}</h3>
          <p>${topic.desc}</p>
        </div>
        <span class="topic-card-footer">
          <small>${topic.words.length} từ mới</small>
          <i class="ti-arrow-right" aria-hidden="true"></i>
        </span>
      </article>
    `;
  }

  function doneCardTemplate(sectionName, emptyType = "done") {
    const isNoHope = emptyType === "no-hope";
    const isSearch = emptyType === "search";
    const pillText = isSearch ? "Tìm kiếm" : (isNoHope ? "Trống" : "Hoàn tất");
    const title = isSearch ? "Không có chủ đề phù hợp" : (isNoHope ? "Chưa có chủ đề" : `Hoàn thành ${vocabularyData[activeLevel].title}`);
    const description = isNoHope
      ? `Chưa có chủ đề nào được mở ở mức ${vocabularyData[activeLevel].title}.`
      : isSearch
        ? "Thử đổi từ khóa tìm kiếm hoặc chuyển sang cấp độ khác."
        : `${sectionName} không còn chủ đề nào cần xử lý ở mức ${vocabularyData[activeLevel].title}.`;

    return `
      <article class="topic-done-card ${activeLevel} ${isNoHope ? "no-hope" : ""} ${isSearch ? "search" : ""}">
        <div>
          <span class="done-pill">${pillText}</span>
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
      </article>
    `;
  }

  function attachTopicEvents() {
    document.querySelectorAll("[data-topic-open]").forEach(button => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        window.location.href = `vocabulary-study.html?level=${activeLevel}&topic=${button.dataset.topicId}`;
      });
    });

    document.querySelectorAll(".topic-card[data-topic-id]").forEach(card => {
      card.addEventListener("click", (event) => {
        window.location.href = `vocabulary-study.html?level=${activeLevel}&topic=${card.dataset.topicId}`;
      });
    });
  }

  function renderTopics() {
    try {
      if (!unseenTrack) return;
      const searchQuery = topicSearch?.value.trim().toLowerCase() || "";
      const topics = vocabularyData[activeLevel].topics.filter(topic => {
        if (!searchQuery) return true;
        return [topic.name, topic.desc, ...topic.words.map(word => `${word.word} ${word.meaning}`)]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery);
      });
      const emptyType = searchQuery ? "search" : "done";

      // Split into unseen and visited topics
      const viewedKey = getAccountKey("engWithMeViewedTopics");
      let viewedList = [];
      try {
        const parsed = JSON.parse(localStorage.getItem(viewedKey) || "[]");
        viewedList = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        viewedList = [];
      }
      const viewedSet = new Set(
        viewedList
          .filter(item => item && typeof item === "object" && item.level === activeLevel)
          .map(item => item.id)
      );

      const unseenTopics = topics.filter(t => !viewedSet.has(t.id));
      const visitedTopics = topics.filter(t => viewedSet.has(t.id));

      console.log("=== [DEBUG] renderTopics ===");
      console.log("activeLevel:", activeLevel);
      console.log("viewedKey:", viewedKey);
      console.log("viewedSet size:", viewedSet.size);
      console.log("unseenTopics count:", unseenTopics.length);
      console.log("visitedTopics count:", visitedTopics.length);

      // Sort visited topics by most recently viewed first
      const viewedOrder = viewedList
        .filter(item => item && typeof item === "object" && item.level === activeLevel)
        .reduce((map, item, index) => {
          map.set(item.id, index);
          return map;
        }, new Map());

      visitedTopics.sort((a, b) => {
        const indexA = viewedOrder.has(a.id) ? viewedOrder.get(a.id) : -1;
        const indexB = viewedOrder.has(b.id) ? viewedOrder.get(b.id) : -1;
        return indexB - indexA;
      });

      // Render unseen track
      unseenTrack.innerHTML = unseenTopics.length
        ? unseenTopics.map(topicCardTemplate).join("")
        : doneCardTemplate("Chủ đề", emptyType);
      unseenTrack.dataset.remainder = unseenTopics.length % 4;
      if (unseenCount) unseenCount.textContent = `${unseenTopics.length} chủ đề`;

      // Robust dynamic selectors for visited elements
      const vBlock = visitedBlock || document.querySelector("[data-visited-block]");
      const vTrack = visitedTrack || document.querySelector("[data-visited-track]");
      const vCount = visitedCount || document.querySelector("[data-visited-count]");

      console.log("Visited elements in DOM:", { vBlock, vTrack, vCount });

      // Render visited track
      if (vBlock && vTrack) {
        if (visitedTopics.length > 0) {
          vBlock.style.display = "block";
          vTrack.innerHTML = visitedTopics.map(topicCardTemplate).join("")
          vTrack.dataset.remainder = visitedTopics.length % 4;
          if (vCount) vCount.textContent = `${visitedTopics.length} chủ đề`;
        } else {
          vBlock.style.display = "none";
          vTrack.innerHTML = "";
        }
      }

      attachTopicEvents();
    } catch (err) {
      console.error("Error inside renderTopics:", err);
    }
  }

  levelTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      levelTabs.forEach(item => item.classList.remove("active"));
      tab.classList.add("active");

      activeLevel = tab.dataset.level;
      syncLevelTabs();
      renderLevelIntro();
      renderTopics();
      updateProgressView();
    });
  });

  topicSearch?.addEventListener("input", () => {
    renderTopics();
    updateProgressView();
  });

  function getAllWords() {
    const allWords = [];

    Object.values(vocabularyData).forEach(levelData => {
      levelData.topics.forEach(topic => {
        topic.words.forEach(word => {
          allWords.push({
            ...word,
            topicName: topic.name
          });
        });
      });
    });

    return allWords;
  }

  const allQuizWords = getAllWords();

  function shuffle(array) {
    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }

  function createQuiz() {
    if (!quizQuestion || !quizOptions) return;
    if (quizTimer) {
      clearTimeout(quizTimer);
      quizTimer = null;
    }

    const streakTextEl = document.querySelector("[data-fast-streak-text]");
    if (streakTextEl) {
      streakTextEl.textContent = `Streak: ${fastQuestionStreak} (+2 XP)`;
    }

    const correctWord = allQuizWords[Math.floor(Math.random() * allQuizWords.length)];
    const wrongPool = allQuizWords.filter(item => item.meaning !== correctWord.meaning);
    const wrongAnswers = shuffle(wrongPool).slice(0, 3).map(item => item.meaning);

    const options = shuffle([
      { word: correctWord, correct: true },
      ...wrongPool.slice(0, 3).map(item => ({ word: item, correct: false }))
    ]);

    quizQuestion.innerHTML = `
      <p><strong>${correctWord.word}</strong> có nghĩa là gì?</p>
    `;

    quizOptions.innerHTML = options.map(option => `
      <div class="quiz-option-wrapper" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
        <button
          type="button"
          class="quiz-option-btn"
          style="width: 100%;"
          data-correct="${option.correct}"
        >
          ${option.word.meaning}
        </button>
        <span class="option-word" style="display: block; font-size: 0.9rem; font-weight: 700; color: transparent; opacity: 0; transform: translateY(-3px); transition: all 0.2s ease; pointer-events: none; white-space: nowrap; margin-top: 6px; text-align: center;">
          ${option.word.word}
        </span>
      </div>
    `).join("");

    quizOptions.querySelectorAll(".quiz-option-btn").forEach(button => {
      button.addEventListener("click", () => {
        const isCorrect = button.dataset.correct === "true";
        const wrappers = quizOptions.querySelectorAll(".quiz-option-wrapper");

        quizStats.total += 1;
        if (isCorrect) {
          quizStats.correct += 1;
          fastQuestionStreak += 1;
          const addXpFn = typeof addXP === "function" ? addXP : (window.LevelSystem && window.LevelSystem.addXP);
          if (typeof addXpFn === "function") {
            addXpFn(2, "Trả lời đúng Fast Question");
          }
        } else {
          quizStats.wrongWords[correctWord.word] = (quizStats.wrongWords[correctWord.word] || 0) + 1;
          fastQuestionStreak = 0;
        }

        const streakTextEl = document.querySelector("[data-fast-streak-text]");
        if (streakTextEl) {
          streakTextEl.textContent = `Streak: ${fastQuestionStreak} (+2 XP)`;
        }

        saveQuizStats();
        recordVocabActivity();
        updateProgressView();

        wrappers.forEach(wrapper => {
          const btn = wrapper.querySelector(".quiz-option-btn");
          const wordSpan = wrapper.querySelector(".option-word");
          const isBtnCorrect = btn.dataset.correct === "true";
          
          btn.disabled = true;
          if (isBtnCorrect) btn.classList.add("correct");
          if (btn === button && !isCorrect) btn.classList.add("wrong");
          
          // Show the English word below the button with conditional color and smooth fade-in
          if (wordSpan) {
            wordSpan.style.color = isBtnCorrect ? "#70f59d" : "#f87171";
            wordSpan.style.opacity = "1";
            wordSpan.style.transform = "translateY(0)";
          }
        });

        quizTimer = setTimeout(() => {
          createQuiz();
        }, 8000);
      });
    });
  }

  modeTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      setVocabMode(tab.dataset.vocabMode);
    });
  });

  myVocabLevelTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      activeMyVocabLevel = tab.dataset.myVocabLevel;
      renderMyVocab();
    });
  });

  focusQuizButton?.addEventListener("click", (event) => {
    event.preventDefault();
    setVocabMode("study");
    quizSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  randomTopicButton?.addEventListener("click", (event) => {
    event.preventDefault();
    const allTopics = Object.entries(vocabularyData).flatMap(([levelKey, levelData]) =>
      levelData.topics.map(topic => ({ levelKey, topic }))
    );
    const target = allTopics.find(({ levelKey, topic }) =>
      topic.words.some(word => !savedWords.has(`${levelKey}-${topic.id}-${word.word}`))
    ) || allTopics[0];
    if (!target) return;
    window.location.href = `vocabulary-study.html?level=${target.levelKey}&topic=${target.topic.id}`;
  });

  savedWordsOpenButtons.forEach(button => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openSavedWords();
    });
  });
  savedWordsCloseButtons.forEach(button => {
    button.addEventListener("click", closeSavedWords);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !savedWordsPopover.hidden) closeSavedWords();
  });

  updateSavedCount();
  syncLevelTabs();
  renderLevelIntro();
  renderTopics();
  createQuiz();
  updateProgressView();
  setVocabMode(activeMode);
})();
