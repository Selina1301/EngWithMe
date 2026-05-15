function initGrammarLearning() {
  const rail = document.querySelector("[data-grammar-topic-rail]");
  const detail = document.querySelector("[data-grammar-detail]");
  if (!rail || !detail || typeof grammarTopics === "undefined") return;

  const grammarModeTabs = document.querySelectorAll("[data-grammar-mode]");
  const grammarStudyView = document.querySelector("[data-grammar-study-view]");
  const grammarProgressView = document.querySelector("[data-grammar-progress-view]");
  const grammarProgressScore = document.querySelector("[data-grammar-progress-score]");
  const grammarProgressSummary = document.querySelector("[data-grammar-progress-summary]");
  const grammarProgressBar = document.querySelector("[data-grammar-progress-bar]");
  const grammarTopicComplete = document.querySelector("[data-grammar-topic-complete]");
  const grammarQuestionComplete = document.querySelector("[data-grammar-question-complete]");
  const grammarQuestionRemaining = document.querySelector("[data-grammar-question-remaining]");
  const stateKey = getAccountKey("engWithMeGrammarPractice");
  const modeKey = getAccountKey("engWithMeGrammarMode");
  let practiceState = getGrammarPracticeState(stateKey);
  let activeGrammarMode = localStorage.getItem(modeKey) === "progress" ? "progress" : "study";
  if (window.location.hash) activeGrammarMode = "study";

  const getTopic = (topicId) => grammarTopics.find((topic) => topic.id === topicId) || grammarTopics[0];
  const getSolvedQuestions = (topicId) => new Set(practiceState[topicId] || []);
  const savePracticeState = () => localStorage.setItem(stateKey, JSON.stringify(practiceState));

  function getGrammarProgressSnapshot() {
    const totalTopics = grammarTopics.length;
    const totalQuestions = grammarTopics.reduce((sum, topic) => sum + topic.exercises.length, 0);
    const solvedQuestions = grammarTopics.reduce((sum, topic) => sum + getSolvedQuestions(topic.id).size, 0);
    const completedTopics = grammarTopics.filter((topic) => getSolvedQuestions(topic.id).size === topic.exercises.length).length;
    const progress = totalQuestions ? Math.round((solvedQuestions / totalQuestions) * 100) : 0;

    return {
      totalTopics,
      totalQuestions,
      solvedQuestions,
      completedTopics,
      progress,
      remainingQuestions: Math.max(0, totalQuestions - solvedQuestions)
    };
  }

  function updateGrammarProgress() {
    const snapshot = getGrammarProgressSnapshot();
    grammarProgressScore.textContent = `${snapshot.progress}%`;
    grammarProgressBar.style.width = `${snapshot.progress}%`;
    grammarTopicComplete.textContent = `${snapshot.completedTopics}/${snapshot.totalTopics}`;
    grammarQuestionComplete.textContent = `${snapshot.solvedQuestions}/${snapshot.totalQuestions}`;
    grammarQuestionRemaining.textContent = snapshot.remainingQuestions;
    grammarProgressSummary.textContent = snapshot.totalQuestions
      ? `Bạn đã làm đúng ${snapshot.solvedQuestions}/${snapshot.totalQuestions} câu. Điểm này tính từ bài tập thật đã hoàn thành.`
      : "Chưa có dữ liệu bài tập.";
  }

  function syncGrammarModeTabs() {
    grammarModeTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.grammarMode === activeGrammarMode);
    });
  }

  function setGrammarMode(mode) {
    activeGrammarMode = mode === "progress" ? "progress" : "study";
    localStorage.setItem(modeKey, activeGrammarMode);
    syncGrammarModeTabs();
    if (grammarStudyView) grammarStudyView.hidden = activeGrammarMode !== "study";
    if (grammarProgressView) grammarProgressView.hidden = activeGrammarMode !== "progress";
    if (activeGrammarMode === "progress") updateGrammarProgress();
  }

  const renderRail = (activeId) => {
    const previousScroll = rail.scrollLeft;
    const orderedTopics = [...grammarTopics].sort((a, b) => {
      const aDone = getSolvedQuestions(a.id).size === a.exercises.length;
      const bDone = getSolvedQuestions(b.id).size === b.exercises.length;
      if (aDone !== bDone) return aDone ? 1 : -1;
      return Number(a.order) - Number(b.order);
    });

    rail.innerHTML = orderedTopics.map((topic) => {
      const solvedCount = getSolvedQuestions(topic.id).size;
      const total = topic.exercises.length;
      const isActive = topic.id === activeId;
      const isDone = solvedCount === total;

      return `
        <button class="grammar-topic-card${isActive ? " is-active" : ""}${isDone ? " is-completed" : ""}" type="button" data-grammar-topic="${topic.id}" role="listitem" aria-pressed="${isActive}">
          <span class="grammar-card-index">${topic.order} · ${topic.level}</span>
          <h3>${topic.title}</h3>
          <p>${topic.summary}</p>
          <span class="grammar-card-stats">
            <span>${solvedCount}/${total} câu đúng</span>
            <i class="${isDone ? "ti-check" : "ti-angle-right"}" aria-hidden="true"></i>
          </span>
        </button>
      `;
    }).join("");
    rail.scrollLeft = previousScroll;
  };

  const renderGrammarSections = (topic) => {
    if (!topic.sections?.length) return "";

    return `
      <section class="grammar-theory-section grammar-tense-section" data-grammar-extra-memory-section>
        <h3>Bảng tổng hợp 12 thì</h3>
        <div class="grammar-tense-groups">
          ${topic.sections.map((section) => `
            <article class="grammar-tense-group">
              <h4>${section.title}</h4>
              <div class="grammar-tense-list">
                ${section.items.map((tense, index) => `
                  <section class="grammar-tense-card">
                    <div class="grammar-tense-head">
                      <span>${index + 1}</span>
                      <div>
                        <h5>${tense.name}</h5>
                        <p>${tense.viName}</p>
                      </div>
                    </div>
                    <div class="grammar-tense-block">
                      <strong>Công thức</strong>
                      <div class="grammar-tense-formulas">
                        ${Object.entries(tense.formulas).map(([label, formula]) => `<code><span>${label}:</span> ${formula}</code>`).join("")}
                      </div>
                    </div>
                    <div class="grammar-tense-block">
                      <strong>Cách dùng</strong>
                      <ul>${tense.uses.map((item) => `<li>${item}</li>`).join("")}</ul>
                    </div>
                    <div class="grammar-tense-block">
                      <strong>Dấu hiệu nhận biết</strong>
                      <div class="grammar-signal-list">${tense.signals.map((signal) => `<span>${signal}</span>`).join("")}</div>
                    </div>
                    <div class="grammar-tense-block">
                      <strong>Ví dụ</strong>
                      <ul>${tense.examples.map((example) => `<li>${example}</li>`).join("")}</ul>
                    </div>
                  </section>
                `).join("")}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  };

  const renderTopic = (topicId, shouldScroll = false, shouldUpdateHash = true) => {
    const topic = getTopic(topicId);
    const solvedQuestions = getSolvedQuestions(topic.id);

    renderRail(topic.id);
    detail.innerHTML = `
      <article class="grammar-detail-content" data-active-grammar-topic="${topic.id}">
        <header class="grammar-detail-head">
          <div>
            <p class="eyebrow">Chủ đề ${topic.order}</p>
            <h2>${topic.title}</h2>
            <p>${topic.summary}</p>
            <div class="grammar-detail-meta">
              <span>${topic.level}</span>
              <span>${topic.time}</span>
              <span>${solvedQuestions.size}/${topic.exercises.length} bài tập đúng</span>
            </div>
          </div>
          <button class="schedule-button" type="button" data-grammar-back>
            <i class="ti-layout-column3"></i>
            Xem danh mục
          </button>
        </header>

        <div class="grammar-detail-grid">
          <div class="grammar-theory-panel" data-grammar-theory-panel>
            <section class="grammar-theory-section" data-theory-memory-section>
              <div class="grammar-theory-title-row">
                <h3>Lý thuyết trọng tâm</h3>
                <button class="grammar-theory-toggle" type="button" data-toggle-grammar-theory aria-pressed="false">
                  Che lý thuyết
                </button>
              </div>
              <ul data-theory-memory-content>${topic.theory.map((item) => `<li>${item}</li>`).join("")}</ul>
            </section>

            <section class="grammar-theory-section" data-formula-memory-section>
              <h3>Công thức cần nhớ</h3>
              <div class="grammar-formula-list">${topic.formulas.map((formula) => `<code>${formula}</code>`).join("")}</div>
            </section>

            ${renderGrammarSections(topic)}

            <section class="grammar-theory-section">
              <h3>Ví dụ mẫu</h3>
              <div class="grammar-example-list">
                ${topic.examples.map((example) => `
                  <div class="grammar-example">
                    <strong>${example.en}</strong>
                    <span>${example.vi}</span>
                  </div>
                `).join("")}
              </div>
            </section>

            <section class="grammar-theory-section">
              <h3>Lỗi cần tránh</h3>
              <ul class="grammar-mistake-list">${topic.mistakes.map((mistake) => `<li>${mistake}</li>`).join("")}</ul>
            </section>
          </div>

          <aside class="grammar-practice-panel">
            <h3>Bài tập thực hành</h3>
            <p>Chọn đáp án đúng. Nếu sai, hệ thống sẽ gợi ý để bạn thử lại ngay.</p>
            <div class="grammar-exercise-list">
              ${topic.exercises.map((exercise, questionIndex) => {
                const isSolved = solvedQuestions.has(questionIndex);
                return `
                  <article class="grammar-exercise${isSolved ? " is-correct" : ""}" data-grammar-question="${questionIndex}">
                    <div class="grammar-check-row">
                      <strong>${questionIndex + 1}. ${exercise.prompt}</strong>
                      <span>${isSolved ? "Đã đúng" : "Chưa làm"}</span>
                    </div>
                    <div class="grammar-options">
                      ${exercise.options.map((option, optionIndex) => `
                        <button class="grammar-option${isSolved && optionIndex === exercise.answer ? " is-correct" : ""}" type="button" data-grammar-option data-topic-id="${topic.id}" data-question-index="${questionIndex}" data-option-index="${optionIndex}" ${isSolved ? "disabled" : ""}>${option}</button>
                      `).join("")}
                    </div>
                    <p class="grammar-feedback" data-grammar-feedback="${topic.id}-${questionIndex}">${isSolved ? `Chính xác. ${exercise.explanation}` : ""}</p>
                  </article>
                `;
              }).join("")}
            </div>
          </aside>
        </div>
      </article>
    `;

    if (shouldUpdateHash) window.history.replaceState(null, "", `#${topic.id}`);
    if (shouldScroll) detail.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  rail.addEventListener("click", (event) => {
    const topicButton = event.target.closest("[data-grammar-topic]");
    if (topicButton) renderTopic(topicButton.dataset.grammarTopic, true);
  });

  detail.addEventListener("click", (event) => {
    const backButton = event.target.closest("[data-grammar-back]");
    if (backButton) {
      rail.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const theoryToggle = event.target.closest("[data-toggle-grammar-theory]");
    if (theoryToggle) {
      const panel = theoryToggle.closest("[data-grammar-theory-panel]");
      const isHidden = panel?.classList.toggle("is-theory-hidden");
      theoryToggle.setAttribute("aria-pressed", String(Boolean(isHidden)));
      theoryToggle.textContent = isHidden ? "Hiện lý thuyết" : "Che lý thuyết";
      return;
    }

    const optionButton = event.target.closest("[data-grammar-option]");
    if (!optionButton) return;

    const topic = getTopic(optionButton.dataset.topicId);
    const questionIndex = Number(optionButton.dataset.questionIndex);
    const optionIndex = Number(optionButton.dataset.optionIndex);
    const exercise = topic.exercises[questionIndex];
    const question = optionButton.closest("[data-grammar-question]");
    const feedback = question?.querySelector("[data-grammar-feedback]");
    const status = question?.querySelector(".grammar-check-row span");
    if (!exercise || !question || !feedback) return;

    question.querySelectorAll("[data-grammar-option]").forEach((button) => button.classList.remove("is-wrong"));

    if (optionIndex === exercise.answer) {
      const solved = getSolvedQuestions(topic.id);
      solved.add(questionIndex);
      practiceState[topic.id] = Array.from(solved).sort((a, b) => a - b);
      savePracticeState();

      question.classList.add("is-correct");
      question.querySelectorAll("[data-grammar-option]").forEach((button) => {
        button.disabled = true;
        if (Number(button.dataset.optionIndex) === exercise.answer) button.classList.add("is-correct");
      });
      if (status) status.textContent = "Đã đúng";
      feedback.textContent = `Chính xác. ${exercise.explanation}`;

      const progressMeta = detail.querySelector(".grammar-detail-meta span:last-child");
      if (progressMeta) progressMeta.textContent = `${practiceState[topic.id].length}/${topic.exercises.length} bài tập đúng`;
      renderRail(topic.id);
      updateGrammarProgress();
      return;
    }

    optionButton.classList.add("is-wrong");
    optionButton.disabled = true;
    if (status) status.textContent = "Thử lại";
    feedback.textContent = `Chưa đúng. Gợi ý: ${exercise.hint}`;
  });

  document.querySelectorAll("[data-scroll-grammar]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.scrollGrammar === "left" ? -1 : 1;
      rail.scrollBy({ left: direction * 420, behavior: "smooth" });
    });
  });

  window.addEventListener("hashchange", () => {
    const topicId = window.location.hash.replace("#", "");
    if (topicId) renderTopic(topicId, false, false);
  });

  grammarModeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setGrammarMode(tab.dataset.grammarMode);
    });
  });

  renderTopic(window.location.hash.replace("#", "") || grammarTopics[0].id, false, false);
  updateGrammarProgress();
  setGrammarMode(activeGrammarMode);
}

function getGrammarPracticeState(stateKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(stateKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}
