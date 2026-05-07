function initVocabularyStudy() {
  const root = document.querySelector("[data-vocab-study-root]");
  if (!root || typeof vocabularyData === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  let activeLevel = vocabularyData[params.get("level")] ? params.get("level") : "easy";
  let currentTopicId = params.get("topic") || vocabularyData[activeLevel].topics[0]?.id;
  let currentWorkspaceMode = ["view", "study", "play"].includes(params.get("mode")) ? params.get("mode") : "study";
  let currentStudyMode = "flashcard";
  const studyModeOrder = ["flashcard", "quiz", "type"];
  const enabledStudyModes = new Set(studyModeOrder);
  let currentWordIndex = 0;
  let isWordRevealed = false;
  let studyAdvanceTimer = null;
  let currentGameMode = null;
  let selectedMatchTile = null;
  let matchedPairs = new Set();
  let gameScore = 0;

  const getTopic = () => vocabularyData[activeLevel]?.topics.find(topic => topic.id === currentTopicId);
  const getListHref = () => `vocabulary.html?level=${activeLevel}`;
  const syncUrl = () => {
    window.history.replaceState(null, "", `vocabulary-study.html?level=${activeLevel}&topic=${currentTopicId}&mode=${currentWorkspaceMode}`);
  };

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function resetGameState() {
    currentGameMode = null;
    selectedMatchTile = null;
    matchedPairs = new Set();
    gameScore = 0;
  }

  function getRelatedHints(topic, item) {
    const near = topic.words
      .filter(word => word.word !== item.word)
      .slice(0, 2)
      .map(word => `${word.word}: ${word.meaning}`);

    while (near.length < 2) near.push(`${item.meaning} trong ngữ cảnh`);

    return {
      near,
      exact: `${item.word}: ${item.meaning}`
    };
  }

  function workspaceTabTemplate(mode, icon, label) {
    return `
      <button class="workspace-tab ${currentWorkspaceMode === mode ? "is-active" : ""}" type="button" data-workspace-mode="${mode}">
        <i class="${icon}"></i> ${label}
      </button>
    `;
  }

  function render() {
    const topic = getTopic();
    if (!topic) {
      root.innerHTML = `
        <div class="vocab-workspace">
          <div class="workspace-topline">
            <a class="workspace-back" href="vocabulary.html">← Quay lại từ vựng</a>
          </div>
          <section class="study-card">
            <h3>Không tìm thấy chủ đề</h3>
            <p>Chủ đề này có thể đã được đổi tên hoặc không thuộc cấp độ hiện tại.</p>
          </section>
        </div>
      `;
      return;
    }

    root.dataset.workspaceMode = currentWorkspaceMode;
    root.innerHTML = `
      <div class="vocab-workspace mode-${currentWorkspaceMode}">
        <div class="workspace-topline">
          <a class="workspace-back" href="${getListHref()}">← Quay lại chủ đề</a>
          <a class="close-modal-btn" href="${getListHref()}">Đóng</a>
        </div>

        <div class="workspace-title">
          <span class="modal-level-pill ${activeLevel}">${vocabularyData[activeLevel].label}</span>
          <h2><i class="${topic.icon || "ti-book"}"></i><span>${topic.name}</span></h2>
          <p>${topic.desc}</p>
        </div>

        <div class="workspace-tabs" aria-label="Chức năng học chủ đề">
          ${workspaceTabTemplate("view", "ti-eye", "Xem từ")}
          ${workspaceTabTemplate("study", "ti-book", "Học")}
          ${workspaceTabTemplate("play", "ti-game", "Chơi")}
        </div>

        <div class="workspace-panel">
          ${renderWorkspacePanel(topic)}
        </div>
      </div>
    `;

    syncUrl();
    attachEvents(topic);
  }

  function renderWorkspacePanel(topic) {
    if (currentWorkspaceMode === "study") return renderStudyPanel(topic);
    if (currentWorkspaceMode === "play") return renderPlayPanel(topic);
    return renderViewPanel(topic);
  }

  function renderViewPanel(topic) {
    const item = topic.words[currentWordIndex];
    const hints = getRelatedHints(topic, item);
    const list = topic.words.map((word, index) => `
      <article class="word-list-card">
        <div>
          <span class="word-level ${word.difficulty}">${index + 1}. ${word.difficulty}</span>
          <h4>${word.word}</h4>
          <p>${word.phonetic}</p>
        </div>
        <div>
          <p><strong>${word.meaning}</strong></p>
          <p>${word.example}</p>
        </div>
      </article>
    `).join("");

    return `
      <button class="word-view-card" type="button" data-flip-view>
        ${isWordRevealed ? `
          <div>
            <p class="meaning">${item.meaning}</p>
            <p class="example"><strong>${item.word}</strong> ${item.phonetic}</p>
            <p class="example">${item.example}</p>
            <div class="hint-tags">
              ${hints.near.map(text => `<span class="hint-tag near">${text}</span>`).join("")}
              <span class="hint-tag exact">${hints.exact}</span>
            </div>
          </div>
        ` : `
          <div>
            <h3>${item.word}</h3>
            <p class="phonetic">${item.phonetic}</p>
            <p class="example">Nhấn để xem nghĩa, ví dụ và các gợi ý liên quan</p>
          </div>
        `}
      </button>

      <div class="viewer-controls">
        <button type="button" data-prev-word>‹</button>
        <strong>${currentWordIndex + 1} / ${topic.words.length}</strong>
        <button type="button" data-next-word>›</button>
      </div>

      <h3 class="word-list-title">Từ mới trong chủ đề này (${topic.words.length})</h3>
      <div class="word-list">${list}</div>
    `;
  }

  function renderStudyPanel(topic) {
    return `
      <div class="study-toolbar unified-study-toolbar">
        <div class="study-settings-wrap">
          <button class="study-settings-btn" type="button" data-toggle-study-settings><i class="ti-settings"></i> Tùy chỉnh cách học</button>
          <div class="study-settings-panel" data-study-settings>
            <label class="study-setting-row"><input type="checkbox" ${enabledStudyModes.has("flashcard") ? "checked" : ""} data-study-option="flashcard"> <span><strong>Flashcard</strong><br>Xem từ → lật xem nghĩa</span></label>
            <label class="study-setting-row"><input type="checkbox" ${enabledStudyModes.has("quiz") ? "checked" : ""} data-study-option="quiz"> <span><strong>Trắc nghiệm</strong><br>Xem từ → chọn nghĩa đúng</span></label>
            <label class="study-setting-row"><input type="checkbox" ${enabledStudyModes.has("type") ? "checked" : ""} data-study-option="type"> <span><strong>Gõ từ</strong><br>Xem nghĩa → gõ từ tiếng Anh</span></label>
          </div>
        </div>
      </div>

      ${renderStudyCard(topic)}
    `;
  }

  function renderStudyCard(topic) {
    const item = topic.words[currentWordIndex];
    const activeStudyModes = getActiveStudyModes();
    if (!activeStudyModes.includes(currentStudyMode)) currentStudyMode = activeStudyModes[0];

    const options = shuffle([
      item,
      ...topic.words.filter(word => word.word !== item.word).slice(0, 3)
    ]).map(word => `
      <button class="study-answer-btn" type="button" data-study-answer="${word.word}" data-correct="${word.word === item.word}">
        ${word.meaning}
      </button>
    `).join("");

    const firstMode = activeStudyModes[0];
    const centerControl = currentStudyMode === firstMode
      ? `<strong>${currentWordIndex + 1} / ${topic.words.length}</strong>`
      : `<button class="review-word-btn" type="button" data-review-current-word>Học lại</button>`;

    if (currentStudyMode === "quiz") {
      return `
        <section class="study-card study-card-step quiz-step">
          <span class="study-step-pill"><i class="ti-target"></i> Trắc nghiệm</span>
          <p>Chọn nghĩa đúng cho từ:</p>
          <h3>${item.word}</h3>
          <p>${item.phonetic}</p>
          <div class="study-options">${options}</div>
          <p data-study-feedback></p>
        </section>
        <div class="viewer-controls">
          <button type="button" data-prev-word>‹</button>
          ${centerControl}
          <button type="button" data-next-word>›</button>
        </div>
      `;
    }

    if (currentStudyMode === "type") {
      return `
        <section class="study-card study-card-step type-step">
          <span class="study-step-pill"><i class="ti-key"></i> Gõ từ</span>
          <p>Gõ từ tiếng Anh có nghĩa là:</p>
          <h3>${item.meaning}</h3>
          <input class="type-answer" type="text" data-type-answer placeholder="Nhập từ tiếng Anh">
          <button class="primary-study-action" type="button" data-check-type>Kiểm tra</button>
          <p data-study-feedback></p>
        </section>
        <div class="viewer-controls">
          <button type="button" data-prev-word>‹</button>
          ${centerControl}
          <button type="button" data-next-word>›</button>
        </div>
      `;
    }

    return `
      <button class="study-card study-card-step flashcard-step" type="button" data-flip-view>
        <span class="study-step-pill"><i class="ti-reload"></i> Flashcard</span>
        ${isWordRevealed ? `
          <p class="meaning">${item.meaning}</p>
          <p>${item.example}</p>
        ` : `
          <h3>${item.word}</h3>
          <p>${item.phonetic}</p>
          <p>Nhấn để lật thẻ và xem nghĩa</p>
        `}
      </button>
      <div class="viewer-controls">
        <button type="button" data-prev-word>‹</button>
        ${centerControl}
        <button type="button" data-next-word>›</button>
      </div>
    `;
  }

  function getActiveStudyModes() {
    const activeModes = studyModeOrder.filter(mode => enabledStudyModes.has(mode));
    return activeModes.length ? activeModes : ["flashcard"];
  }

  function moveStudyStep(direction, topic) {
    if (studyAdvanceTimer) clearTimeout(studyAdvanceTimer);
    studyAdvanceTimer = null;

    const activeStudyModes = getActiveStudyModes();
    if (!activeStudyModes.includes(currentStudyMode)) currentStudyMode = activeStudyModes[0];

    const currentModeIndex = activeStudyModes.indexOf(currentStudyMode);
    let nextModeIndex = currentModeIndex + direction;

    if (nextModeIndex < 0) {
      currentWordIndex = (currentWordIndex - 1 + topic.words.length) % topic.words.length;
      nextModeIndex = activeStudyModes.length - 1;
    }

    if (nextModeIndex >= activeStudyModes.length) {
      currentWordIndex = (currentWordIndex + 1) % topic.words.length;
      nextModeIndex = 0;
    }

    currentStudyMode = activeStudyModes[nextModeIndex];
    isWordRevealed = false;
    render();
  }

  function scheduleStudyAdvance(topic) {
    if (studyAdvanceTimer) clearTimeout(studyAdvanceTimer);
    studyAdvanceTimer = setTimeout(() => {
      if (currentWorkspaceMode === "study" && currentTopicId === topic.id) moveStudyStep(1, topic);
    }, 1100);
  }

  function renderPlayPanel(topic) {
    if (!currentGameMode) {
      return `
        <h3 class="word-list-title">Chọn game</h3>
        <div class="game-menu">
          <button class="game-choice" type="button" data-start-game="blast">
            <i class="ti-game"></i>
            <h3>Word Blast</h3>
            <p>Chọn nghĩa đúng trước khi chuyển câu</p>
          </button>
          <button class="game-choice" type="button" data-start-game="match">
            <i class="ti-layout-grid2"></i>
            <h3>Word Match</h3>
            <p>Ghép từ tiếng Anh với nghĩa tiếng Việt</p>
          </button>
        </div>
      `;
    }

    return renderMatchGame(topic);
  }

  function renderMatchGame(topic) {
    const gameWords = topic.words.slice(0, 6);
    const tiles = shuffle([
      ...gameWords.map(word => ({ type: "word", id: word.word, text: word.word })),
      ...gameWords.map(word => ({ type: "meaning", id: word.word, text: word.meaning }))
    ]);

    return `
      <div class="game-board-top">
        <button class="workspace-back" type="button" data-game-menu>← Chọn game khác</button>
        <strong>${matchedPairs.size} / ${gameWords.length} cặp đúng • ${gameScore} pts</strong>
      </div>
      <div class="game-board">
        ${tiles.map(tile => `
          <button class="game-tile ${tile.type} ${matchedPairs.has(tile.id) ? "is-matched" : ""}" type="button" data-match-id="${tile.id}" data-match-type="${tile.type}">
            ${tile.text}
          </button>
        `).join("")}
      </div>
    `;
  }

  function startBlastGame(topic) {
    currentGameMode = "blast";
    const item = topic.words[currentWordIndex];
    const options = shuffle([
      item,
      ...topic.words.filter(word => word.word !== item.word).slice(0, 3)
    ]);

    root.querySelector(".workspace-panel").innerHTML = `
      <div class="game-board-top">
        <button class="workspace-back" type="button" data-game-menu>← Chọn game khác</button>
        <strong>${gameScore} pts</strong>
      </div>
      <div class="game-panel study-card">
        <p>Chọn nghĩa đúng cho:</p>
        <h3>${item.word}</h3>
        <div class="blast-options">
          ${options.map(option => `
            <button class="game-tile meaning" type="button" data-blast-correct="${option.word === item.word}">
              ${option.meaning}
            </button>
          `).join("")}
        </div>
        <p data-study-feedback></p>
      </div>
    `;

    attachEvents(topic);
  }

  function attachEvents(topic) {
    root.querySelectorAll("[data-workspace-mode]").forEach(button => {
      button.addEventListener("click", () => {
        currentWorkspaceMode = button.dataset.workspaceMode;
        isWordRevealed = false;
        resetGameState();
        render();
      });
    });

    root.querySelector("[data-toggle-study-settings]")?.addEventListener("click", () => {
      root.querySelector("[data-study-settings]")?.classList.toggle("is-open");
    });

    root.querySelectorAll("[data-study-option]").forEach(input => {
      input.addEventListener("change", () => {
        const checkedInputs = Array.from(root.querySelectorAll("[data-study-option]:checked"));
        if (!checkedInputs.length) {
          input.checked = true;
          return;
        }

        enabledStudyModes.clear();
        checkedInputs.forEach(item => enabledStudyModes.add(item.dataset.studyOption));
        if (!enabledStudyModes.has(currentStudyMode)) {
          currentStudyMode = getActiveStudyModes()[0];
          isWordRevealed = false;
          render();
        }
      });
    });

    root.querySelectorAll("[data-flip-view]").forEach(button => {
      button.addEventListener("click", () => {
        isWordRevealed = !isWordRevealed;
        render();
      });
    });

    root.querySelector("[data-prev-word]")?.addEventListener("click", () => {
      if (currentWorkspaceMode === "study") {
        moveStudyStep(-1, topic);
        return;
      }

      currentWordIndex = (currentWordIndex - 1 + topic.words.length) % topic.words.length;
      isWordRevealed = false;
      render();
    });

    root.querySelector("[data-next-word]")?.addEventListener("click", () => {
      if (currentWorkspaceMode === "study") {
        moveStudyStep(1, topic);
        return;
      }

      currentWordIndex = (currentWordIndex + 1) % topic.words.length;
      isWordRevealed = false;
      render();
    });

    root.querySelector("[data-review-current-word]")?.addEventListener("click", () => {
      if (studyAdvanceTimer) clearTimeout(studyAdvanceTimer);
      studyAdvanceTimer = null;
      currentStudyMode = "flashcard";
      if (!enabledStudyModes.has(currentStudyMode)) currentStudyMode = getActiveStudyModes()[0];
      isWordRevealed = false;
      render();
    });

    root.querySelectorAll("[data-study-answer]").forEach(button => {
      button.addEventListener("click", () => {
        const isCorrect = button.dataset.correct === "true";
        const card = button.closest(".study-card");
        const item = topic.words[currentWordIndex];
        const feedback = card?.querySelector("[data-study-feedback]");

        card?.querySelectorAll("[data-study-answer]").forEach(answerButton => {
          answerButton.disabled = true;
          if (answerButton.dataset.correct === "true") answerButton.classList.add("correct");
        });

        if (!isCorrect) button.classList.add("wrong");
        if (feedback) {
          feedback.textContent = isCorrect
            ? `Đúng. Đáp án: ${item.meaning}.`
            : `Chưa đúng. Đáp án đúng: ${item.meaning}.`;
        }

        scheduleStudyAdvance(topic);
      });
    });

    root.querySelectorAll("[data-check-type]").forEach(button => {
      button.addEventListener("click", () => {
        const card = button.closest(".study-card");
        const input = card?.querySelector("[data-type-answer]");
        const item = topic.words[currentWordIndex];
        const feedback = card?.querySelector("[data-study-feedback]");
        const isCorrect = input?.value.trim().toLowerCase() === item.word.toLowerCase();

        input?.classList.add(isCorrect ? "correct" : "wrong");
        button.disabled = true;
        if (input) input.disabled = true;
        if (feedback) {
          feedback.textContent = isCorrect
            ? `Chính xác. Đáp án: ${item.word}.`
            : `Chưa đúng. Đáp án đúng là ${item.word}.`;
        }

        scheduleStudyAdvance(topic);
      });
    });

    root.querySelectorAll("[data-start-game]").forEach(button => {
      button.addEventListener("click", () => {
        resetGameState();
        if (button.dataset.startGame === "blast") {
          startBlastGame(topic);
          return;
        }
        currentGameMode = "match";
        render();
      });
    });

    root.querySelector("[data-game-menu]")?.addEventListener("click", () => {
      resetGameState();
      render();
    });

    root.querySelectorAll("[data-match-id]").forEach(button => {
      button.addEventListener("click", () => {
        if (!selectedMatchTile) {
          selectedMatchTile = button;
          button.classList.add("is-selected");
          return;
        }

        const isPair = selectedMatchTile.dataset.matchId === button.dataset.matchId
          && selectedMatchTile.dataset.matchType !== button.dataset.matchType;

        if (isPair) {
          matchedPairs.add(button.dataset.matchId);
          gameScore += 10;
        } else {
          gameScore = Math.max(0, gameScore - 2);
        }

        selectedMatchTile = null;
        render();
      });
    });

    root.querySelectorAll("[data-blast-correct]").forEach(button => {
      button.addEventListener("click", () => {
        const feedback = root.querySelector("[data-study-feedback]");
        const isCorrect = button.dataset.blastCorrect === "true";
        gameScore += isCorrect ? 10 : 0;
        button.classList.add(isCorrect ? "correct" : "wrong");
        if (feedback) feedback.textContent = isCorrect ? "Đúng. +10 pts" : "Chưa đúng. Chuyển câu tiếp theo.";
        setTimeout(() => {
          currentWordIndex = (currentWordIndex + 1) % topic.words.length;
          startBlastGame(topic);
        }, 700);
      });
    });
  }

  if (!getTopic()) {
    const fallbackLevel = Object.keys(vocabularyData).find(levelKey =>
      vocabularyData[levelKey].topics.some(topic => topic.id === currentTopicId)
    );

    if (fallbackLevel) activeLevel = fallbackLevel;
    if (!getTopic()) currentTopicId = vocabularyData[activeLevel].topics[0]?.id;
  }

  localStorage.setItem(
    "englishPathViewedVocabTopics",
    JSON.stringify(Array.from(new Set([
      ...JSON.parse(localStorage.getItem("englishPathViewedVocabTopics") || "[]"),
      `${activeLevel}-${currentTopicId}`
    ])))
  );

  render();
}
