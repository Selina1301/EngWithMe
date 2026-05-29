function initVocabularyStudy() {
  const root = document.querySelector("[data-vocab-study-root]");
  if (!root || typeof vocabularyData === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  let activeLevel = vocabularyData[params.get("level")] ? params.get("level") : "easy";
  let currentTopicId = params.get("topic") || vocabularyData[activeLevel].topics[0]?.id;
  let currentWorkspaceMode = ["view", "study", "play"].includes(params.get("mode")) ? params.get("mode") : "view";
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
  let pendingSaveWord = null;
  const getSavedWordsKey = () => getAccountKey("engWithMeSavedVocabularyWords");
  let savedWordRecords = normalizeSavedWordRecords(readLocalArray(getSavedWordsKey()));
  let savedWords = new Set(savedWordRecords.keys());

  const getTopic = () => vocabularyData[activeLevel]?.topics.find(topic => topic.id === currentTopicId);
  const getListHref = () => `vocabulary.html?level=${activeLevel}`;
  const getWordKey = (topic, word) => `${activeLevel}-${topic.id}-${word.word}`;
  const saveSavedWords = (action, vocabKey, studyLevel) => {
    savedWords = new Set(savedWordRecords.keys());
    localStorage.setItem(getSavedWordsKey(), JSON.stringify(Array.from(savedWordRecords.values())));
    recordVocabActivity();

    const userId = localStorage.getItem("engWithMeUserId");
    if (userId && action && vocabKey) {
      try {
        const body = new FormData();
        body.append("action", action);
        body.append("vocab_key", vocabKey);
        if (studyLevel) {
          body.append("study_level", studyLevel);
        }
        body.append("activity_day", todayKey());
        fetch("api/sync_vocab.php", {
          method: "POST",
          body,
          credentials: "same-origin"
        }).catch(e => console.error("Failed to sync vocab action to server:", e));
      } catch (e) {
        console.error("Failed to sync vocab action to server:", e);
      }
    }
  };
  const reloadSavedWordsFromStorage = () => {
    savedWordRecords = normalizeSavedWordRecords(readLocalArray(getSavedWordsKey()));
    savedWords = new Set(savedWordRecords.keys());
  };
  window.refreshVocabularyStudyState = () => {
    reloadSavedWordsFromStorage();
    recordCurrentTopicView();
    render();
  };
  const syncUrl = () => {
    window.history.replaceState(null, "", `vocabulary-study.html?level=${activeLevel}&topic=${currentTopicId}&mode=${currentWorkspaceMode}`);
  };

  function readLocalArray(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function todayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function recordVocabActivity() {
    const activityKey = getAccountKey("engWithMeVocabActivityDays");
    const days = new Set(readLocalArray(activityKey));
    days.add(todayKey());
    localStorage.setItem(activityKey, JSON.stringify(Array.from(days).sort()));
  }

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

  const closeMeaningHints = {
    classroom: ["class: lớp học/phòng học", "learning space: không gian học"],
    subject: ["course: môn học/khóa học", "discipline: lĩnh vực học"],
    homework: ["assignment: bài tập được giao", "schoolwork: bài học/bài tập"],
    notebook: ["exercise book: vở ghi", "copybook: vở viết"],
    teacher: ["instructor: giáo viên/giảng viên", "educator: nhà giáo"],
    assignment: ["task: nhiệm vụ được giao", "homework: bài tập"],
    presentation: ["talk: bài nói", "speech: bài thuyết trình"],
    project: ["assignment: bài làm/dự án", "task: nhiệm vụ"],
    semester: ["term: học kỳ", "school term: kỳ học"],
    curriculum: ["syllabus: đề cương/chương trình học", "course plan: kế hoạch môn học"],
    assessment: ["evaluation: đánh giá", "test: bài kiểm tra/đánh giá"],
    scholarship: ["grant: học bổng/khoản tài trợ", "study grant: học bổng học tập"],
    routine: ["habit: thói quen", "daily pattern: nếp sinh hoạt"],
    housework: ["chores: việc nhà", "domestic work: việc trong nhà"],
    appointment: ["meeting: cuộc hẹn", "scheduled visit: lịch hẹn"],
    responsibility: ["duty: bổn phận", "obligation: nghĩa vụ"],
    balance: ["equilibrium: trạng thái cân bằng", "stability: sự ổn định"],
    schedule: ["timetable: thời khóa biểu/lịch trình", "plan: kế hoạch"],
    independence: ["self-reliance: sự tự lập", "autonomy: quyền tự chủ"],
    job: ["work: công việc", "position: vị trí công việc"],
    meeting: ["session: buổi họp", "appointment: cuộc hẹn"],
    manager: ["supervisor: người giám sát", "leader: người quản lý/lãnh đạo"],
    deadline: ["due date: hạn nộp", "time limit: thời hạn"],
    colleague: ["coworker: đồng nghiệp", "teammate: người cùng nhóm"],
    doctor: ["physician: bác sĩ", "medical practitioner: người hành nghề y"],
    medicine: ["medication: thuốc", "remedy: phương thuốc"],
    symptom: ["sign: dấu hiệu", "indication: biểu hiện"],
    treatment: ["therapy: liệu pháp", "care: điều trị/chăm sóc"],
    reply: ["respond: phản hồi", "answer: trả lời"],
    agree: ["accept: đồng ý/chấp nhận", "consent: tán thành"],
    explain: ["clarify: làm rõ", "describe: giải thích/mô tả"],
    listen: ["hear: nghe", "pay attention: chú ý lắng nghe"],
    opinion: ["view: quan điểm", "point of view: góc nhìn"],
    money: ["cash: tiền mặt", "funds: tiền/quỹ"],
    price: ["cost: giá/chi phí", "rate: mức giá"],
    budget: ["spending plan: kế hoạch chi tiêu", "allowance: khoản chi cho phép"],
    expense: ["cost: chi phí", "expenditure: khoản chi"],
    clean: ["tidy: gọn gàng/sạch sẽ", "unpolluted: không ô nhiễm"],
    protect: ["preserve: gìn giữ", "safeguard: bảo vệ"],
    tradition: ["custom: phong tục", "heritage practice: tập tục truyền thống"],
    identity: ["character: bản sắc/đặc điểm", "sense of self: ý thức bản thân"],
    device: ["gadget: thiết bị", "tool: công cụ"],
    app: ["application: ứng dụng", "software app: phần mềm ứng dụng"],
    interface: ["UI: giao diện", "control surface: bề mặt điều khiển"],
    customer: ["client: khách hàng", "buyer: người mua"],
    profit: ["earnings: lợi nhuận", "gain: khoản lời"],
    revenue: ["income: doanh thu/thu nhập", "sales: doanh số"],
    strategy: ["plan: chiến lược/kế hoạch", "approach: cách tiếp cận"],
    topic: ["subject: chủ đề", "theme: đề tài"],
    example: ["instance: ví dụ/trường hợp", "sample: mẫu minh họa"],
    idea: ["thought: ý tưởng", "concept: khái niệm"],
    result: ["outcome: kết quả", "consequence: hệ quả"],
    evidence: ["proof: bằng chứng", "supporting data: dữ liệu hỗ trợ"],
    significant: ["important: quan trọng", "notable: đáng chú ý"],
    analysis: ["examination: sự phân tích", "study: nghiên cứu/phân tích"],
    research: ["study: nghiên cứu", "investigation: điều tra/nghiên cứu"],
    rule: ["regulation: quy định", "guideline: hướng dẫn/quy tắc"],
    law: ["rule: luật/quy tắc", "legislation: luật pháp"],
    legal: ["lawful: hợp pháp", "permitted: được phép"],
    feeling: ["emotion: cảm xúc", "sense: cảm giác"],
    stress: ["pressure: áp lực", "strain: sự căng thẳng"],
    mind: ["mental state: trạng thái tâm trí", "thoughts: suy nghĩ"],
    habit: ["routine: thói quen", "pattern: nếp sinh hoạt"],
    fear: ["anxiety: lo âu", "worry: nỗi lo"],
    memory: ["recollection: ký ức", "recall: sự nhớ lại"],
    video: ["clip: video ngắn", "recording: bản ghi hình"],
    post: ["article: bài viết", "update: bài cập nhật"],
    news: ["report: bản tin", "information: thông tin"],
    photo: ["picture: bức ảnh", "image: hình ảnh"],
    share: ["distribute: chia sẻ/phân phối", "pass on: chuyển tiếp"]
  };

  function getAllVocabularyEntries() {
    return Object.entries(vocabularyData).flatMap(([levelKey, levelData]) =>
      levelData.topics.flatMap(topic =>
        topic.words.map(word => ({
          ...word,
          levelKey,
          topicId: topic.id,
          topicName: topic.name
        }))
      )
    );
  }

  function getRelatedHints(topic, item) {
    const normalize = (value) => String(value || "").trim().toLowerCase();
    const currentWord = normalize(item.word);
    const currentMeaning = normalize(item.meaning);
    const seen = new Set([currentWord]);
    const toHint = (type, label, text) => ({ type, label, text });

    const takeUnique = (hints, limit) => {
      const unique = [];
      hints.forEach(hint => {
        const key = normalize(hint.text);
        if (!key || seen.has(key)) return;
        seen.add(key);
        unique.push(hint);
      });
      return unique.slice(0, limit);
    };

    const closeHints = takeUnique(
      (closeMeaningHints[currentWord] || []).map(text => toHint("near", "Đồng nghĩa", text)),
      2
    );

    const sameMeaningHints = takeUnique(
      getAllVocabularyEntries()
        .filter(word => normalize(word.word) !== currentWord)
        .filter(word => normalize(word.meaning) === currentMeaning)
        .map(word => toHint("same", "Cùng nghĩa", `${word.word}: ${word.meaning}`)),
      2
    );

    const contextHints = takeUnique(
      topic.words
        .filter(word => normalize(word.word) !== currentWord)
        .sort((a, b) => {
          if (a.difficulty === item.difficulty && b.difficulty !== item.difficulty) return -1;
          if (a.difficulty !== item.difficulty && b.difficulty === item.difficulty) return 1;
          return topic.words.indexOf(a) - topic.words.indexOf(b);
        })
        .map(word => toHint("context", "Cùng chủ đề", `${word.word}: ${word.meaning}`)),
      2
    );

    const related = [...closeHints, ...sameMeaningHints].slice(0, 2);
    const fallbackRelated = related.length ? related : contextHints.slice(0, 2);

    return {
      related: fallbackRelated
    };
  }

  function hintTagTemplate(hint) {
    return `
      <span class="hint-tag ${hint.type}">
        <small>${hint.label}</small>
        <span>${hint.text}</span>
      </span>
    `;
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
    const pageContainer = document.querySelector(".vocab-study-page");
    if (pageContainer) {
      pageContainer.setAttribute("data-mode", currentWorkspaceMode);
    }
    root.innerHTML = `
      <div class="vocab-workspace mode-${currentWorkspaceMode}">
        <div class="workspace-topline">
          <a class="workspace-back" href="${getListHref()}">← Quay lại chủ đề</a>
          <a class="close-modal-btn" href="${getListHref()}">Đóng</a>
        </div>

        <div class="workspace-title">
          <div class="workspace-title-head">
            <span class="modal-level-pill ${activeLevel}">${vocabularyData[activeLevel].label}</span>
            <span class="workspace-topic-icon" aria-hidden="true"><i class="${topic.icon || "ti-book"}"></i></span>
          </div>
          <h2><span>${topic.name}</span></h2>
          <p>${topic.desc}</p>
        </div>

        <div class="workspace-tabs" aria-label="Chức năng học chủ đề">
          ${workspaceTabTemplate("view", "ti-eye", "Read")}
          ${workspaceTabTemplate("study", "ti-book", "Study")}
          ${workspaceTabTemplate("play", "ti-game", "Play")}
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
    const list = topic.words.map((word, index) => {
      const wordKey = getWordKey(topic, word);
      const isSaved = savedWords.has(wordKey);

      return `
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
          <div class="word-save-col">
            <button class="save-word-btn ${isSaved ? "saved" : ""}" type="button" data-save-word="${wordKey}">
              ${isSaved ? `Đã lưu (${(savedWordRecords.get(wordKey)?.studyLevel || "easy").toUpperCase()})` : "Lưu từ"}
            </button>
          </div>
        </article>
      `;
    }).join("");

    return `
      <button class="word-view-card" type="button" data-flip-view>
        ${isWordRevealed ? `
          <div>
            <p class="meaning">${item.meaning}</p>
            <p class="example"><strong>${item.word}</strong> ${item.phonetic}</p>
            <p class="example">${item.example}</p>
            <div class="hint-tags">
              ${hints.related.map(hintTagTemplate).join("")}
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
      ${pendingSaveWord ? renderSaveLevelDialog() : ""}
    `;
  }

  function renderSaveLevelDialog() {
    if (pendingSaveWord.requireLogin) {
      return `
        <div class="save-level-dialog" role="dialog" aria-modal="true" aria-labelledby="saveLevelTitle">
          <div class="save-level-backdrop" data-cancel-save-level></div>
          <section class="save-level-panel">
            <p class="eyebrow">Yêu cầu đăng nhập</p>
            <h3 id="saveLevelTitle">Vui lòng đăng nhập</h3>
            <p>Bạn cần phải đăng nhập trước mới có thể lưu từ mới <strong>${pendingSaveWord.word.word}</strong> vào danh sách học tập.</p>
            <div style="margin-top: 20px; display: flex; justify-content: center;">
              <a href="login.html" class="btn btn-primary" style="text-decoration: none; display: inline-block;">Đăng nhập ngay</a>
            </div>
            <button class="saved-words-close" type="button" data-cancel-save-level aria-label="Đóng">
              <i class="ti-close"></i>
            </button>
          </section>
        </div>
      `;
    }

    return `
      <div class="save-level-dialog" role="dialog" aria-modal="true" aria-labelledby="saveLevelTitle">
        <div class="save-level-backdrop" data-cancel-save-level></div>
        <section class="save-level-panel">
          <p class="eyebrow">My vocab</p>
          <h3 id="saveLevelTitle">Chọn mức cho từ mới</h3>
          <p><strong>${pendingSaveWord.word.word}</strong> sẽ được lưu vào Từ vựng của tôi.</p>
          <div class="save-level-options">
            <button class="level-tab active" type="button" data-save-level="easy">Easy</button>
            <button class="level-tab" type="button" data-save-level="medium">Medium</button>
            <button class="level-tab" type="button" data-save-level="hard">Hard</button>
          </div>
          <button class="saved-words-close" type="button" data-cancel-save-level aria-label="Đóng chọn mức">
            <i class="ti-close"></i>
          </button>
        </section>
      </div>
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
          <p class="example">${item.example}</p>
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

    root.querySelectorAll("[data-save-word]").forEach(button => {
      button.addEventListener("click", () => {
        const wordKey = button.dataset.saveWord;
        if (!wordKey) return;

        const isLoggedIn = !!localStorage.getItem("engWithMeUserId");
        if (!isLoggedIn) {
          const word = topic.words.find(item => getWordKey(topic, item) === wordKey);
          if (!word) return;
          pendingSaveWord = { key: wordKey, word, requireLogin: true };
          render();
          return;
        }

        if (savedWords.has(wordKey)) {
          savedWordRecords.delete(wordKey);
          saveSavedWords("remove", wordKey);
          render();
        } else {
          const word = topic.words.find(item => getWordKey(topic, item) === wordKey);
          if (!word) return;
          pendingSaveWord = { key: wordKey, word };
          render();
        }
      });
    });

    root.querySelectorAll("[data-save-level]").forEach(button => {
      button.addEventListener("click", () => {
        if (!pendingSaveWord) return;
        const key = pendingSaveWord.key;
        const lvl = button.dataset.saveLevel;
        savedWordRecords.set(key, {
          key: key,
          studyLevel: lvl
        });
        pendingSaveWord = null;
        saveSavedWords("save", key, lvl);
        render();
      });
    });

    root.querySelectorAll("[data-cancel-save-level]").forEach(button => {
      button.addEventListener("click", () => {
        pendingSaveWord = null;
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

  function recordCurrentTopicView() {
    try {
      const viewedKey = getAccountKey("engWithMeViewedTopics");
      let viewedList = readLocalArray(viewedKey);
      const topicRecord = { level: activeLevel, id: currentTopicId, timestamp: Date.now() };
      viewedList = viewedList.filter(item => item && typeof item === "object" && !(item.level === activeLevel && item.id === currentTopicId));
      viewedList.push(topicRecord);
      localStorage.setItem(viewedKey, JSON.stringify(viewedList));
      recordVocabActivity();

      const userId = localStorage.getItem("engWithMeUserId");
      if (userId) {
        const body = new FormData();
        body.append("action", "view_topic");
        body.append("level_key", activeLevel);
        body.append("topic_id", currentTopicId);
        body.append("activity_day", todayKey());
        fetch("api/sync_vocab.php", {
          method: "POST",
          body,
          credentials: "same-origin"
        }).catch(e => console.error("Failed to sync viewed topic to database:", e));
      }
    } catch (err) {
      console.error("Error writing to viewedList:", err);
    }
  }

  recordCurrentTopicView();

  render();
}
