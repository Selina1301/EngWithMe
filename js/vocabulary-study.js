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
  let gameTimerInterval = null;
  let gameTimeSeconds = 0;
  let currentMatchTiles = [];
  let isProcessingMatch = false;
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
        })
        .then(response => {
          if (response.ok && typeof AppCache !== "undefined") {
            AppCache.invalidate(`vocab_user_${userId}`);
          }
        })
        .catch(e => console.error("Failed to sync vocab action to server:", e));
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
    if (gameTimerInterval) {
      clearInterval(gameTimerInterval);
      gameTimerInterval = null;
    }
    gameTimeSeconds = 0;
    currentMatchTiles = [];
    isProcessingMatch = false;
  }

  function startGameTimer() {
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimeSeconds = 0;
    updateTimerDisplay();
    gameTimerInterval = setInterval(() => {
      gameTimeSeconds++;
      if (gameTimeSeconds >= 3600) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
        const topic = getTopic();
        resetGameState();
        if (currentGameMode === "blast") {
          startBlastGame(topic);
          startGameTimer();
        } else if (currentGameMode === "match") {
          currentGameMode = "match";
          const gameWords = topic.words.slice(0, 6);
          currentMatchTiles = shuffle([
            ...gameWords.map(word => ({ type: "word", id: word.word, text: word.word })),
            ...gameWords.map(word => ({ type: "meaning", id: word.word, text: word.meaning }))
          ]);
          render();
          startGameTimer();
        } else {
          render();
        }
        return;
      }
      updateTimerDisplay();
    }, 1000);
  }

  function updateTimerDisplay() {
    const minutes = String(Math.floor(gameTimeSeconds / 60)).padStart(2, "0");
    const seconds = String(gameTimeSeconds % 60).padStart(2, "0");
    const timerSpan = root.querySelector("[data-game-timer]");
    if (timerSpan) {
      timerSpan.textContent = `${minutes}:${seconds}`;
    }
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
    routine: ["habit: thói quen", "daily pattern: nếp sinh hoạt"],
    subject: ["course: môn học/khóa học", "discipline: lĩnh vực học"],
    homework: ["assignment: bài tập được giao", "schoolwork: bài học/bài tập"],
    classroom: ["learning space: không gian học", "lecture room: phòng học"],
    assignment: ["task: nhiệm vụ được giao", "homework: bài tập"],
    presentation: ["talk: bài nói/thuyết trình", "pitch: bài trình bày"],
    semester: ["term: học kỳ", "school term: kỳ học"],
    curriculum: ["syllabus: đề cương/chương trình học", "course plan: kế hoạch môn học"],
    assessment: ["evaluation: đánh giá", "test: bài kiểm tra/đánh giá"],
    scholarship: ["grant: học bổng/khoản tài trợ", "study grant: học bổng học tập"],
    appointment: ["meeting: cuộc hẹn", "scheduled visit: lịch hẹn"],
    responsibility: ["duty: bổn phận/trách nhiệm", "obligation: nghĩa vụ"],
    balance: ["equilibrium: trạng thái cân bằng", "stability: sự ổn định"],
    schedule: ["timetable: thời khóa biểu/lịch trình", "plan: kế hoạch"],
    independence: ["self-reliance: sự tự lập", "autonomy: quyền tự chủ"],
    discipline: ["order: kỷ luật", "self-control: sự tự chủ"],
    transit: ["layover: sự dừng chân/quá cảnh", "transfer: trung chuyển"],
    luggage: ["baggage: hành lý", "bags: túi hành lý"],
    reservation: ["booking: sự đặt chỗ trước", "appointment: cuộc hẹn"],
    destination: ["goal: điểm đến", "endpoint: điểm kết thúc"],
    itinerary: ["travel plan: lịch trình chuyến đi", "route: lộ trình"],
    accommodation: ["lodging: chỗ ở nơi lưu trú", "housing: nhà ở/nơi ở"],
    career: ["profession: nghề nghiệp", "occupation: công việc/sự nghiệp"],
    employee: ["worker: người lao động", "staff member: nhân viên"],
    deadline: ["due date: hạn chót", "time limit: thời hạn"],
    colleague: ["coworker: đồng nghiệp", "teammate: người cùng nhóm"],
    productivity: ["efficiency: năng suất/hiệu quả", "output: sản lượng"],
    collaboration: ["partnership: sự cộng tác", "cooperation: sự hợp tác"],
    resignation: ["departure: sự thôi việc", "quitting: sự từ chức"],
    clinic: ["medical center: phòng khám", "dispensary: trạm y tế"],
    treatment: ["therapy: liệu trình điều trị", "care: sự chăm sóc y tế"],
    recovery: ["healing: sự phục hồi", "recuperation: sự tĩnh dưỡng"],
    nutrition: ["nourishment: chất dinh dưỡng", "diet: chế độ ăn uống"],
    diagnosis: ["identification: sự chẩn đoán", "analysis: sự phân tích bệnh"],
    prescription: ["recipe: đơn thuốc", "instruction: hướng dẫn điều trị"],
    reply: ["respond: phản hồi", "answer: câu trả lời"],
    explain: ["clarify: giải thích/làm rõ", "describe: mô tả"],
    conversation: ["talk: cuộc trò chuyện", "dialogue: cuộc đối thoại"],
    discussion: ["debate: cuộc thảo luận", "consultation: sự tham khảo ý kiến"],
    opinion: ["view: quan điểm/ý kiến", "standpoint: lập trường"],
    clarify: ["explain: làm rõ/giải thích", "simplify: làm đơn giản hóa"],
    respond: ["reply: trả lời/phản hồi", "react: phản ứng lại"],
    persuade: ["convince: thuyết phục", "influence: ảnh hưởng/thuyết phục"],
    negotiation: ["bargaining: sự thương lượng", "dialogue: đàm phán"],
    cash: ["paper money: tiền giấy", "ready money: tiền mặt"],
    bill: ["invoice: hóa đơn thanh toán", "statement: bảng kê nợ"],
    income: ["earnings: thu nhập", "revenue: doanh thu/lợi tức"],
    budget: ["spending plan: kế hoạch chi tiêu", "allowance: hạn mức chi tiêu"],
    expense: ["expenditure: chi phí tiêu dùng", "cost: khoản chi"],
    financial: ["monetary: thuộc tài chính", "economic: thuộc kinh tế"],
    ecology: ["ecosystem: hệ sinh thái", "environment: môi trường"],
    pollution: ["contamination: sự ô nhiễm", "dirtiness: sự vấy bẩn"],
    recycle: ["reuse: tái chế/tái sử dụng", "reprocess: xử lý lại"],
    sustainability: ["viability: sự phát triển bền vững", "endurance: sự trường tồn"],
    conservation: ["preservation: sự bảo tồn", "protection: sự bảo vệ"],
    custom: ["tradition: phong tục", "practice: thông lệ"],
    tradition: ["custom: truyền thống/phong tục", "heritage: di sản"],
    identity: ["individuality: bản sắc/cá tính", "character: đặc trưng"],
    diversity: ["variety: sự đa dạng", "multiplicity: sự phong phú"],
    purchase: ["buy: mua sắm", "acquisition: sự mua được"],
    receipt: ["proof of purchase: biên lai", "slip: phiếu thu"],
    customer: ["buyer: khách hàng/người mua", "client: thân chủ"],
    discount: ["reduction: khoản giảm giá", "markdown: sự hạ giá"],
    product: ["goods: sản phẩm/hàng hóa", "merchandise: hàng hóa"],
    consumer: ["buyer: người tiêu dùng", "customer: khách hàng"],
    transaction: ["deal: giao dịch", "exchange: sự trao đổi"],
    refund: ["repayment: sự hoàn tiền", "compensation: khoản đền bù"],
    course: ["program: khóa học", "class: lớp học"],
    lecture: ["talk: bài giảng", "address: bài nói chuyện"],
    knowledge: ["information: kiến thức", "understanding: sự hiểu biết"],
    skill: ["ability: kỹ năng/khả năng", "expertise: sự tinh thông"],
    memory: ["recalls: trí nhớ", "remembrance: ký ức"],
    vehicle: ["transport: phương tiện", "car: xe cộ"],
    commute: ["travel: đi lại đi học/đi làm", "journey: hành trình"],
    congestion: ["traffic jam: sự tắc nghẽn", "blockage: sự tắc nghẽn"],
    infrastructure: ["foundation: cơ sở hạ tầng", "framework: khung nền tảng"],
    recipe: ["formula: công thức nấu ăn", "directions: hướng dẫn thực hiện"],
    cuisine: ["culinary style: ẩm thực", "cooking style: phong cách nấu nướng"],
    ingredient: ["component: nguyên liệu/thành phần", "element: yếu tố"],
    flavor: ["taste: hương vị", "aroma: mùi thơm"],
    culinary: ["cooking: thuộc bếp núc", "gastronomic: thuộc ẩm thực"],
    suburb: ["outskirts: vùng ngoại ô", "residential area: khu dân cư ngoại vi"],
    metropolis: ["mega-city: siêu đô thị", "capital: thủ đô lớn"],
    urbanization: ["city growth: sự đô thị hóa", "development: sự phát triển đô thị"],
    mood: ["temper: tâm trạng", "frame of mind: trạng thái tinh thần"],
    emotion: ["feeling: cảm xúc", "passion: niềm say mê/cảm xúc mạnh"],
    stress: ["tension: sự căng thẳng", "pressure: áp lực"],
    anxiety: ["worry: sự lo âu", "nervousness: sự bồn chồn"],
    empathy: ["compassion: sự thấu cảm", "sympathy: sự đồng cảm"],
    depression: ["sadness: sự trầm cảm/u sầu", "melancholy: sự u uất"],
    software: ["program: phần mềm", "applications: các ứng dụng"],
    database: ["data store: cơ sở dữ liệu", "repository: kho lưu trữ dữ liệu"],
    interface: ["connection: giao diện/kết nối", "dashboard: bảng điều khiển"],
    encryption: ["coding: sự mã hóa", "ciphering: sự mật mã hóa"],
    algorithm: ["procedure: thuật toán", "computation rules: quy tắc tính toán"],
    authentication: ["verification: sự xác thực", "validation: sự phê chuẩn"],
    scalability: ["expansibility: khả năng mở rộng", "growth potential: tiềm năng tăng trưởng"],
    revenue: ["income: doanh thu", "earnings: thu nhập"],
    strategy: ["policy: chiến lược/chính sách", "master plan: kế hoạch tổng thể"],
    thesis: ["dissertation: luận văn", "academic paper: bài báo học thuật"],
    evidence: ["proof: bằng chứng/dẫn chứng", "data: dữ liệu minh chứng"],
    significant: ["important: đáng kể/quan trọng", "meaningful: có ý nghĩa"],
    analysis: ["examination: sự phân tích", "study: nghiên cứu/phân tích"],
    research: ["study: nghiên cứu", "investigation: điều tra/nghiên cứu"],
    methodology: ["procedure: phương pháp luận", "system of methods: hệ phương pháp"],
    hypothesis: ["theory: giả thuyết", "assumption: giả định"],
    regulation: ["rule: quy định", "guideline: quy tắc hướng dẫn"],
    statute: ["written law: đạo luật", "ordinance: sắc lệnh"],
    contract: ["agreement: hợp đồng/thỏa thuận", "pact: hiệp ước"],
    legal: ["lawful: hợp pháp", "statutory: thuộc luật định"],
    jurisdiction: ["authority: thẩm quyền pháp lý", "control area: khu vực quản hạt"],
    compliance: ["obedience: sự tuân thủ", "conformity: sự phù hợp"],
    behavior: ["conduct: hành vi/tác phong", "actions: các hành động"],
    motivation: ["incentive: động lực/sự khuyến khích", "drive: sức đẩy nội tại"],
    cognition: ["perception: nhận thức", "mental capability: năng lực trí tuệ"],
    cognitive: ["mental: thuộc nhận thức/trí tuệ", "intellectual: thuộc trí thức"],
    subconscious: ["unconscious: tiềm thức/vô thức", "hidden mind: tâm trí ẩn giấu"],
    resilience: ["flexibility: khả năng phục hồi", "toughness: tính kiên cường"],
    audience: ["viewers: khán giả", "listeners: thính giả"],
    misinformation: ["false info: thông tin sai lệch", "fake news: tin giả"],
    capital: ["funds: nguồn vốn", "financial resources: tài nguyên tài chính"],
    asset: ["property: tài sản", "possession: tài sản sở hữu"],
    inflation: ["price rise: lạm phát", "devaluation: sự mất giá tiền tệ"],
    ethics: ["morals: đạo đức학", "moral principles: nguyên tắc đạo đức"],
    existentialism: ["human existence philosophy: thuyết hiện sinh", "existential theory: lý thuyết hiện sinh"],
    epistemology: ["theory of knowledge: nhận thức luận", "philosophical study of belief: nghiên cứu tri thức"],
    government: ["administration: chính phủ", "regime: chính quyền"],
    sovereignty: ["independence: chủ quyền tối cao", "supreme power: quyền lực tối cao"],
    bureaucracy: ["red tape: bộ máy hành chính", "administration: hệ quản trị hành chính"],
    legislation: ["lawmaking: hoạt động lập pháp", "body of laws: hệ thống luật"],
    vaccine: ["immunization: vắc-xin", "inoculation: sự tiêm chủng"],
    epidemiology: ["study of disease spread: dịch tễ học", "epidemic control: kiểm soát dịch bệnh"],
    pathology: ["study of disease: bệnh lý học", "medical diagnostics: chẩn đoán y khoa"],
    chronic: ["long-lasting: mãn tính kéo dài", "persistent: dai dẳng"],
    novel: ["book: tiểu thuyết/sách", "fiction story: truyện hư cấu"],
    author: ["writer: tác giả/nhà văn", "creator: nhà văn/tác giả"],
    metaphor: ["figure of speech: phép ẩn dụ", "symbolic expression: cách nói tượng trưng"],
    aesthetic: ["artistic: thẩm mỹ", "beautiful: đẹp đẽ/thẩm mỹ"],
    protagonist: ["main character: nhân vật chính", "lead role: vai chính"],
    genre: ["category: thể loại", "style: phong cách nghệ thuật"],
    galaxy: ["star system: thiên hà", "star cluster: cụm sao"],
    orbit: ["path: quỹ đạo", "course: đường quay quanh"],
    supernova: ["star explosion: siêu tân tinh", "stellar blast: vụ nổ sao"],
    nebula: ["cosmic cloud: tinh vân", "dust cloud: đám mây bụi vũ trụ"],
    astrophysics: ["space physics: vật lý thiên văn", "stellar science: khoa học thiên thể"]
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
    if (currentGameMode && gameTimerInterval) {
      updateTimerDisplay();
    }
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
    const gameWords = topic.words.slice(0, 8);
    const isFinished = matchedPairs.size === gameWords.length;

    if (isFinished) {
      if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
      }
      const minutes = String(Math.floor(gameTimeSeconds / 60)).padStart(2, "0");
      const seconds = String(gameTimeSeconds % 60).padStart(2, "0");

      return `
        <div class="game-board-top">
          <button class="workspace-back" type="button" data-game-menu>← Chọn game khác</button>
          <strong>Hoàn thành! • Thời gian: ${minutes}:${seconds}</strong>
        </div>
        <div class="game-victory-panel" style="text-align: center; padding: 40px 20px;">
          <i class="ti-cup" style="font-size: 3.5rem; color: #ffd700; margin-bottom: 20px; display: block;"></i>
          <h3 style="font-size: 1.8rem; margin-bottom: 10px; color: #fff;">Chúc mừng!</h3>
          <p style="font-size: 1.1rem; color: #a0aec0; margin-bottom: 25px;">Bạn đã ghép đúng tất cả các từ trong <strong>${minutes}:${seconds}</strong>!</p>
          <button class="btn btn-primary" type="button" data-start-game="match" style="background: linear-gradient(135deg, #319795, #2b6cb0); border: none; padding: 10px 24px; font-size: 1rem; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(49, 151, 149, 0.3); transition: all 0.2s;">Chơi lại</button>
        </div>
      `;
    }

    if (!currentMatchTiles || currentMatchTiles.length === 0) {
      currentMatchTiles = shuffle([
        ...gameWords.map(word => ({ type: "word", id: word.word, text: word.word })),
        ...gameWords.map(word => ({ type: "meaning", id: word.word, text: word.meaning }))
      ]);
    }

    return `
      <div class="game-board-top">
        <button class="workspace-back" type="button" data-game-menu>← Chọn game khác</button>
        <strong>${matchedPairs.size} / ${gameWords.length} cặp đúng • Thời gian: <span data-game-timer>00:00</span></strong>
      </div>
      <div class="game-board">
        ${currentMatchTiles.map(tile => {
          const isMatched = matchedPairs.has(tile.id);
          return `
            <button class="game-tile ${tile.type} ${isMatched ? "is-matched" : ""}" 
                    type="button" 
                    data-match-id="${tile.id}" 
                    data-match-type="${tile.type}"
                    style="${isMatched ? 'visibility: hidden;' : ''}">
              ${tile.text}
            </button>
          `;
        }).join("")}
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
        <strong>Thời gian: <span data-game-timer>00:00</span></strong>
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
    updateTimerDisplay();
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
          startGameTimer();
          return;
        }
        currentGameMode = "match";
        const gameWords = topic.words.slice(0, 8);
        currentMatchTiles = shuffle([
          ...gameWords.map(word => ({ type: "word", id: word.word, text: word.word })),
          ...gameWords.map(word => ({ type: "meaning", id: word.word, text: word.meaning }))
        ]);
        render();
        startGameTimer();
      });
    });

    root.querySelector("[data-game-menu]")?.addEventListener("click", () => {
      resetGameState();
      render();
    });

    root.querySelectorAll("[data-match-id]").forEach(button => {
      button.addEventListener("click", () => {
        if (isProcessingMatch) return;
        if (button.classList.contains("is-matched")) return;
        if (!selectedMatchTile) {
          selectedMatchTile = button;
          button.classList.add("is-selected");
          return;
        }

        if (selectedMatchTile === button) {
          button.classList.remove("is-selected");
          selectedMatchTile = null;
          return;
        }

        const isPair = selectedMatchTile.dataset.matchId === button.dataset.matchId
          && selectedMatchTile.dataset.matchType !== button.dataset.matchType;

        if (isPair) {
          matchedPairs.add(button.dataset.matchId);
          selectedMatchTile.classList.remove("is-selected");
          selectedMatchTile = null;
          render();
        } else {
          isProcessingMatch = true;
          const firstTile = selectedMatchTile;
          const secondTile = button;
          
          firstTile.classList.remove("is-selected");
          firstTile.classList.add("shake-wrong");
          secondTile.classList.add("shake-wrong");
          
          selectedMatchTile = null;
          
          setTimeout(() => {
            firstTile.classList.remove("shake-wrong");
            secondTile.classList.remove("shake-wrong");
            isProcessingMatch = false;
            render();
          }, 800);
        }
      });
    });

    root.querySelectorAll("[data-blast-correct]").forEach(button => {
      button.addEventListener("click", () => {
        const feedback = root.querySelector("[data-study-feedback]");
        const isCorrect = button.dataset.blastCorrect === "true";
        button.classList.add(isCorrect ? "correct" : "wrong");
        if (feedback) feedback.textContent = isCorrect ? "Đúng." : "Chưa đúng. Chuyển câu tiếp theo.";
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
        })
        .then(response => {
          if (response.ok && typeof AppCache !== "undefined") {
            AppCache.invalidate(`vocab_user_${userId}`);
          }
        })
        .catch(e => console.error("Failed to sync viewed topic to database:", e));
      }
    } catch (err) {
      console.error("Error writing to viewedList:", err);
    }
  }

  recordCurrentTopicView();

  render();
}
