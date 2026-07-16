function initVocabularyStudy() {
  const root = document.querySelector("[data-vocab-study-root]");
  if (!root || typeof vocabularyData === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  let activeLevel = vocabularyData[params.get("level")] ? params.get("level") : "easy";
  let currentTopicId = params.get("topic") || vocabularyData[activeLevel].topics[0]?.id;
  let currentWorkspaceMode = ["view", "study", "play"].includes(params.get("mode")) ? params.get("mode") : "view";
  let currentStudyMode = "flashcard";
  const studyModeOrder = ["flashcard", "quiz", "type", "speak"];
  const enabledStudyModes = new Set(studyModeOrder);
  let currentWordIndex = 0;
  let isWordRevealed = false;
  let isClassifyingWord = false;
  let studyAdvanceTimer = null;
  let currentGameMode = null;
  let selectedMatchTile = null;
  let matchedPairs = new Set();
  let gameScore = 0;
  let gameTimerInterval = null;
  let gameTimeSeconds = 0;
  let currentMatchTiles = [];
  let isProcessingMatch = false;
  let isTimerStarted = false;
  let pendingSaveWord = null;
  
  let recognition = null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  }

  const handleGlobalKeydown = (e) => {
    if (currentWorkspaceMode !== "study") return;
    const isInputActive = document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA");
    
    if (isClassifyingWord) {
      if (e.key === "1") {
        e.preventDefault();
        root.querySelector('[data-classify="again"]')?.click();
      } else if (e.key === "2") {
        e.preventDefault();
        root.querySelector('[data-classify="hard"]')?.click();
      } else if (e.key === "3") {
        e.preventDefault();
        root.querySelector('[data-classify="good"]')?.click();
      } else if (e.key === "4") {
        e.preventDefault();
        root.querySelector('[data-classify="easy"]')?.click();
      }
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      root.querySelector("[data-mark-learned]")?.click();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isInputActive) {
        root.querySelector("[data-check-type]")?.click();
      } else {
        root.querySelector("[data-next-step]")?.click();
      }
    } else if (e.key === " " && !isInputActive) {
      e.preventDefault();
      root.querySelector("[data-flip-view]")?.click();
    }
  };

  if (window._vocabStudyKeydownHandler) {
    window.removeEventListener("keydown", window._vocabStudyKeydownHandler);
  }
  window._vocabStudyKeydownHandler = handleGlobalKeydown;
  window.addEventListener("keydown", handleGlobalKeydown);

  let blastQuestionsList = [];
  let blastQuestionsPlayed = 0;
  let blastCorrectAnswers = 0;
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
    isTimerStarted = false;
    blastQuestionsList = [];
    blastQuestionsPlayed = 0;
    blastCorrectAnswers = 0;
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
        <div class="workspace-top-bar">
          <div class="top-bar-left">
            <a class="workspace-back" href="${getListHref()}">← Quay lại chủ đề</a>
          </div>
          <div class="top-bar-center">
            <div class="workspace-tabs" aria-label="Chức năng học chủ đề">
              ${workspaceTabTemplate("view", "ti-eye", "Read")}
              ${workspaceTabTemplate("study", "ti-book", "Study")}
              ${workspaceTabTemplate("play", "ti-game", "Play")}
            </div>
          </div>
          <div class="top-bar-right">
            ${currentWorkspaceMode === "study" ? `
              <div class="study-settings-wrap">
                <button class="study-settings-btn" type="button" data-toggle-study-settings><i class="ti-settings"></i> Tùy chỉnh cách học</button>
                <div class="study-settings-panel" data-study-settings>
                  <label class="study-setting-row"><input type="checkbox" ${enabledStudyModes.has("flashcard") ? "checked" : ""} data-study-option="flashcard"> <span><strong>Flashcard</strong><br>Xem từ → lật xem nghĩa</span></label>
                  <label class="study-setting-row"><input type="checkbox" ${enabledStudyModes.has("quiz") ? "checked" : ""} data-study-option="quiz"> <span><strong>Trắc nghiệm</strong><br>Xem từ → chọn nghĩa đúng</span></label>
                  <label class="study-setting-row"><input type="checkbox" ${enabledStudyModes.has("type") ? "checked" : ""} data-study-option="type"> <span><strong>Gõ từ</strong><br>Xem nghĩa → gõ từ tiếng Anh</span></label>
                  <label class="study-setting-row"><input type="checkbox" ${enabledStudyModes.has("speak") ? "checked" : ""} data-study-option="speak"> <span><strong>Phát âm</strong><br>Nghe phát âm → đọc to để máy nhận dạng</span></label>
                </div>
              </div>
            ` : ""}
            <a class="close-modal-btn" href="${getListHref()}">Đóng</a>
          </div>
        </div>

        <div class="workspace-title">
          <div class="workspace-title-head">
            <span class="modal-level-pill ${activeLevel}">${vocabularyData[activeLevel].label}</span>
            <span class="workspace-topic-icon" aria-hidden="true"><i class="${topic.icon || "ti-book"}"></i></span>
          </div>
          <h2><span>${topic.name}</span></h2>
          <p>${topic.desc}</p>
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
    return renderStudyCard(topic);
  }

  function getWordClass(word) {
    const nounSuffixes = ["tion", "sion", "ness", "ment", "ity", "ance", "ence", "ship", "hood"];
    const adjSuffixes = ["ful", "less", "able", "ible", "ive", "ous", "al", "ic", "y"];
    const verbSuffixes = ["ate", "ify", "ize", "ise", "en"];
    
    const w = word.toLowerCase();
    if (nounSuffixes.some(s => w.endsWith(s))) return "noun";
    if (adjSuffixes.some(s => w.endsWith(s))) return "adjective";
    if (verbSuffixes.some(s => w.endsWith(s))) return "verb";
    
    const commonNouns = ["routine", "neighbor", "housework", "breakfast", "laundry", "appointment", "schedule", "chore", "balance", "responsibility", "independence", "discipline", "subject", "homework", "notebook", "teacher", "classroom", "assignment", "presentation", "project", "semester", "curriculum", "assessment", "scholarship", "meal", "drink", "snack", "menu", "dessert", "allergy", "apple", "banana", "orange", "mango", "grape", "pineapple", "watermelon", "coconut", "lemon", "pomegranate", "persimmon", "avocado", "rose", "flower", "garden", "lily", "sunflower", "orchid", "tulip", "blossom", "petal", "bouquet", "tree", "plant", "grass", "leaf", "forest", "branch", "seed", "root", "soil", "harvest", "vegetation", "dog", "cat", "bird", "fish", "cow", "horse", "rabbit", "monkey", "tiger", "mammal", "species", "predator", "hobby", "music", "movie", "sport", "drawing", "painting", "instrument", "collection", "family", "parent", "child", "relative", "sibling", "cousin", "uncle", "marriage"];
    const commonAdjs = ["friendly", "busy", "pure", "elegant", "sweet", "sour", "delicious", "hungry", "spicy", "organic", "nutritious", "healthy", "rare", "powerful"];
    
    if (commonNouns.includes(w)) return "noun";
    if (commonAdjs.includes(w)) return "adjective";
    
    return "noun";
  }

  function speakWord(word, lang = "en-US") {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  }

  function getExampleTranslation(example) {
    const translations = {
      "My morning routine starts at 6 a.m.": "Thói quen buổi sáng của tôi bắt đầu lúc 6 giờ sáng.",
      "My neighbor is very friendly.": "Hàng xóm của tôi rất thân thiện.",
      "I do housework every weekend.": "Tôi làm việc nhà mỗi cuối tuần.",
      "I usually have breakfast at 7 a.m.": "Tôi thường ăn sáng lúc 7 giờ sáng.",
      "I need to do the laundry tonight.": "Tôi cần giặt đồ tối nay.",
      "I have a doctor appointment tomorrow.": "Tôi có một cuộc hẹn với bác sĩ vào ngày mai.",
      "My daily schedule is quite busy.": "Lịch trình hàng ngày của tôi khá bận rộn.",
      "Doing chores is part of our daily routine.": "Làm việc nhà là một phần trong thói quen hàng ngày của chúng tôi.",
      "Work-life balance is very important.": "Cân bằng giữa công việc và cuộc sống là rất quan trọng.",
      "Cleaning the kitchen is my responsibility.": "Dọn dẹp nhà bếp là trách nhiệm của tôi.",
      "Living alone taught her independence.": "Sống một mình đã dạy cô ấy sự tự lập.",
      "Self-discipline helps you achieve your goals.": "Kỷ luật bản thân giúp bạn đạt được các mục tiêu của mình.",
      "English is my favorite subject.": "Tiếng Anh là môn học yêu thích của tôi.",
      "I finish my homework before dinner.": "Tôi hoàn thành bài tập về nhà trước bữa tối.",
      "Please open your notebook.": "Vui lòng mở vở của bạn ra.",
      "Our teacher is very kind.": "Giáo viên của chúng tôi rất tốt bụng.",
      "The students are in the classroom.": "Các học sinh đang ở trong lớp học.",
      "I submitted the assignment yesterday.": "Tôi đã nộp bài tập được giao vào ngày hôm qua.",
      "We have a group presentation next week.": "Chúng tôi có một bài thuyết trình nhóm vào tuần tới.",
      "Our science project won first prize.": "Dự án khoa học của chúng tôi đã giành giải nhất.",
      "This semester is more difficult than the last.": "Học kỳ này khó hơn học kỳ trước.",
      "The curriculum focuses on communication.": "Chương trình học tập trung vào giao tiếp.",
      "Students took part in a speaking assessment.": "Học sinh đã tham gia một bài đánh giá nói.",
      "She received a scholarship to study abroad.": "Cô ấy đã nhận được học bổng để đi du học.",
      "Dinner is the biggest meal of the day.": "Bữa tối là bữa ăn lớn nhất trong ngày.",
      "Would you like a cold drink?": "Bạn có muốn một thức uống lạnh không?",
      "I am very hungry after class.": "Tôi rất đói bụng sau giờ học.",
      "This chocolate cake is delicious.": "Bánh sô-cô-la này thật thơm ngon.",
      "I usually have a healthy snack in the afternoon.": "Tôi thường ăn nhẹ lành mạnh vào buổi chiều.",
      "The waiter handed us the dessert menu.": "Người phục vụ đưa cho chúng tôi thực đơn tráng miệng.",
      "This curry is very hot and spicy.": "Món cà ri này rất nóng và cay nồng.",
      "I want to order fried rice.": "Tôi muốn gọi món cơm chiên.",
      "We had ice cream for dessert.": "Chúng tôi đã ăn kem làm món tráng miệng.",
      "We prefer buying fresh organic vegetables.": "Chúng tôi thích mua rau hữu cơ tươi sạch.",
      "A nutritious breakfast gives you energy.": "Một bữa sáng bổ dưỡng cung cấp năng lượng cho bạn.",
      "She has an allergy to seafood.": "Cô ấy bị dị ứng với hải sản."
    };
    return translations[example] || "";
  }

  function renderStudyCard(topic) {
    const item = topic.words[currentWordIndex];
    const wordKey = getWordKey(topic, item);
    const isSaved = savedWords.has(wordKey);
    const activeStudyModes = getActiveStudyModes();
    if (!activeStudyModes.includes(currentStudyMode)) currentStudyMode = activeStudyModes[0];

    const counts = topic.words.reduce((acc, w) => {
      const wKey = getWordKey(topic, w);
      const record = savedWordRecords.get(wKey);
      if (!record) {
        acc.newWords++;
      } else if (record.studyLevel === "hard") {
        acc.review++;
      } else {
        acc.learned++;
      }
      return acc;
    }, { newWords: 0, learned: 0, review: 0 });

    const getModeNumber = () => {
      const idx = activeStudyModes.indexOf(currentStudyMode);
      return idx >= 0 ? idx + 1 : 1;
    };
    
    const getModeName = () => {
      switch (currentStudyMode) {
        case "flashcard": return "Flashcard";
        case "quiz": return "Trắc nghiệm";
        case "type": return "Gõ từ";
        case "speak": return "Phát âm";
        default: return "";
      }
    };

    const subTabs = `
      <div class="study-sub-tabs">
        <div class="study-sub-tab ${currentStudyMode === 'flashcard' ? 'active' : ''}">
          <i class="ti-reload"></i> <span>Flashcard</span>
        </div>
        <div class="study-sub-tab ${currentStudyMode === 'quiz' ? 'active' : ''}">
          <i class="ti-target"></i> <span>Trắc nghiệm</span>
        </div>
        <div class="study-sub-tab ${currentStudyMode === 'type' ? 'active' : ''}">
          <i class="ti-key"></i> <span>Gõ từ</span>
        </div>
        <div class="study-sub-tab ${currentStudyMode === 'speak' ? 'active' : ''}">
          <i class="ti-microphone"></i> <span>Phát âm</span>
        </div>
      </div>
    `;

    const cardHeader = `
      <div class="study-card-header">
        <button class="card-action-btn ${isSaved ? 'active' : ''}" type="button" data-save-word="${wordKey}" title="${isSaved ? 'Bỏ lưu từ này' : 'Lưu từ này'}">
          <i class="${isSaved ? 'ti-check' : 'ti-plus'}"></i>
        </button>
        <button class="card-action-btn" type="button" data-toggle-study-settings title="Tùy chỉnh cách học">
          <i class="ti-settings"></i>
        </button>
        <button class="card-action-btn" type="button" data-report-word="${item.word}" title="Báo cáo lỗi từ vựng">
          <i class="ti-alert"></i>
        </button>
      </div>
    `;

    let cardBody = "";
    let actionsHtml = "";
    let shortcutText = "";

    const options = shuffle([
      item,
      ...topic.words.filter(w => w.word !== item.word).slice(0, 3)
    ]).map(w => `
      <button class="study-answer-btn" type="button" data-study-answer="${w.word}" data-correct="${w.word === item.word}">
        ${w.meaning}
      </button>
    `).join("");

    if (currentStudyMode === "quiz") {
      cardBody = `
        <div class="study-card-body quiz-body">
          <div class="word-title-wrap">
            <h3 class="vocab-word">${item.word}</h3>
            <span class="vocab-class">(${getWordClass(item.word)})</span>
          </div>
          <div class="phonetics-row">
            <button class="pronounce-btn us" type="button" data-speak-word="${item.word}" data-lang="en-US">
              <i class="ti-volume"></i> <span>US /${item.phonetic.replace(/\//g, '')}/</span>
            </button>
            <button class="pronounce-btn uk" type="button" data-speak-word="${item.word}" data-lang="en-GB">
              <i class="ti-volume"></i> <span>UK /${item.phonetic.replace(/\//g, '')}/</span>
            </button>
          </div>
          <p class="instruction-text">Chọn nghĩa đúng cho từ:</p>
          <div class="study-options">${options}</div>
          <p data-study-feedback class="study-feedback-text"></p>
        </div>
      `;
      actionsHtml = `
        <div class="study-action-row">
          <button class="study-action-btn learned-btn" type="button" data-mark-learned>
            <i class="ti-check"></i> Đã thuộc
          </button>
          <button class="study-action-btn continue-btn" type="button" data-next-step>
            Học tiếp
          </button>
        </div>
      `;
      shortcutText = "<kbd>Tab</kbd> Đã thuộc · <kbd>Enter</kbd> Học tiếp";
    } else if (currentStudyMode === "type") {
      cardBody = `
        <div class="study-card-body type-body">
          <p class="instruction-text">Gõ từ tiếng Anh có nghĩa là:</p>
          <h3 class="meaning-word">${item.meaning}</h3>
          <input class="type-answer" type="text" data-type-answer placeholder="Nhập từ tiếng Anh" autocomplete="off" autofocus>
          <button class="primary-study-action" type="button" data-check-type>Kiểm tra</button>
          <p data-study-feedback class="study-feedback-text"></p>
        </div>
      `;
      actionsHtml = `
        <div class="study-action-row">
          <button class="study-action-btn learned-btn" type="button" data-mark-learned>
            <i class="ti-check"></i> Đã thuộc
          </button>
          <button class="study-action-btn continue-btn" type="button" data-next-step>
            Học tiếp
          </button>
        </div>
      `;
      shortcutText = "<kbd>Enter</kbd> Kiểm tra · <kbd>Tab</kbd> Đã thuộc / Học tiếp";
    } else if (currentStudyMode === "speak") {
      cardBody = `
        <div class="study-card-body speak-body">
          <div class="word-title-wrap">
            <h3 class="vocab-word">${item.word}</h3>
            <span class="vocab-class">(${getWordClass(item.word)})</span>
          </div>
          <div class="phonetics-row">
            <button class="pronounce-btn us" type="button" data-speak-word="${item.word}" data-lang="en-US">
              <i class="ti-volume"></i> <span>US /${item.phonetic.replace(/\//g, '')}/</span>
            </button>
            <button class="pronounce-btn uk" type="button" data-speak-word="${item.word}" data-lang="en-GB">
              <i class="ti-volume"></i> <span>UK /${item.phonetic.replace(/\//g, '')}/</span>
            </button>
          </div>
          
          <div class="speech-controls">
            <button class="microphone-btn" type="button" data-start-speech>
              <i class="ti-microphone"></i>
            </button>
            <p class="speech-prompt">Nhấn mic và đọc từ tiếng Anh</p>
            <p data-speech-result class="speech-result-text"></p>
          </div>
        </div>
      `;
      actionsHtml = `
        <div class="study-action-row">
          <button class="study-action-btn learned-btn" type="button" data-mark-learned>
            <i class="ti-check"></i> Đã thuộc
          </button>
          <button class="study-action-btn continue-btn" type="button" data-next-step>
            Học tiếp
          </button>
        </div>
      `;
      shortcutText = "<kbd>Tab</kbd> Đã thuộc · <kbd>Enter</kbd> Học tiếp";
    } else {
      // Flashcard Mode
      if (isWordRevealed) {
        const translation = getExampleTranslation(item.example);
        const hints = closeMeaningHints[item.word.toLowerCase()];
        let hintsHtml = "";
        if (hints && hints.length) {
          hintsHtml = `
            <div class="collocations-row" style="margin-top: 14px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
              ${hints.map(hint => `<span class="collocation-badge" style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.2); color: #38bdf8; padding: 4px 10px; border-radius: 99px; font-size: 0.85rem;">${hint}</span>`).join("")}
            </div>
          `;
        }

        cardBody = `
          <div class="study-card-body flashcard-body" data-flip-view style="cursor: pointer;">
            <h3 class="meaning-word" style="color: #ffffff; margin-top: 10px; font-size: 2.2rem !important; font-weight: 800;">${item.meaning}</h3>
            <p class="example-text" style="font-size: 1rem; color: #cbd5e1; font-style: italic; margin-top: 12px; font-weight: 500;">
              "${item.example}"
            </p>
            ${translation ? `<p class="example-translation-text" style="color: #64748b; font-size: 0.88rem; margin-top: 4px;">(${translation})</p>` : ""}
            ${hintsHtml}
          </div>
        `;

        actionsHtml = `
          <div class="study-action-row">
            <button class="study-action-btn learned-btn" type="button" data-mark-learned>
              <i class="ti-check"></i> Đã thuộc
            </button>
            <button class="study-action-btn continue-btn" type="button" data-next-step>
              Học tiếp
            </button>
          </div>
        `;
        shortcutText = "<kbd>Tab</kbd> Đã thuộc · <kbd>Enter</kbd> Học tiếp";
      } else {
        cardBody = `
          <div class="study-card-body flashcard-body" data-flip-view style="cursor: pointer;">
            <div class="word-title-wrap">
              <h3 class="vocab-word">${item.word}</h3>
              <span class="vocab-class">(${getWordClass(item.word)})</span>
            </div>
            <div class="phonetics-row">
              <button class="pronounce-btn us" type="button" data-speak-word="${item.word}" data-lang="en-US">
                <i class="ti-volume"></i> <span>US /${item.phonetic.replace(/\//g, '')}/</span>
              </button>
              <button class="pronounce-btn uk" type="button" data-speak-word="${item.word}" data-lang="en-GB">
                <i class="ti-volume"></i> <span>UK /${item.phonetic.replace(/\//g, '')}/</span>
              </button>
            </div>
            <div class="meaning-section">
              <p class="flip-prompt">Nhấn hoặc phím Space để xem nghĩa</p>
            </div>
          </div>
        `;

        actionsHtml = `
          <div class="study-action-row">
            <button class="study-action-btn reveal-btn solo" type="button" data-flip-view>
              Xem nghĩa
            </button>
          </div>
        `;
        shortcutText = "<kbd>Space</kbd> Xem nghĩa";
      }
    }

    if (isClassifyingWord) {
      actionsHtml = `
        <div class="study-action-row classification-row" style="display: flex; gap: 10px; width: 100%; justify-content: center; max-width: 680px; margin: 0 auto;">
          <button class="study-action-btn class-again-btn" type="button" data-classify="again" style="background: #ef4444 !important; border: 1px solid rgba(239, 68, 68, 0.4) !important; color: white !important; flex: 1; padding: 10px 14px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 0.95rem; line-height: 1.25; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; min-height: 48px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);">
            Học lại <small style="display: block; font-size: 0.75rem; font-weight: normal; opacity: 0.85; margin-top: 2px;">1m</small>
          </button>
          <button class="study-action-btn class-hard-btn" type="button" data-classify="hard" style="background: #f59e0b !important; border: 1px solid rgba(245, 158, 11, 0.4) !important; color: white !important; flex: 1; padding: 10px 14px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 0.95rem; line-height: 1.25; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; min-height: 48px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
            Khó <small style="display: block; font-size: 0.75rem; font-weight: normal; opacity: 0.85; margin-top: 2px;">2d</small>
          </button>
          <button class="study-action-btn class-good-btn" type="button" data-classify="good" style="background: #10b981 !important; border: 1px solid rgba(16, 185, 129, 0.4) !important; color: white !important; flex: 1; padding: 10px 14px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 0.95rem; line-height: 1.25; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; min-height: 48px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
            Tốt <small style="display: block; font-size: 0.75rem; font-weight: normal; opacity: 0.85; margin-top: 2px;">3d</small>
          </button>
          <button class="study-action-btn class-easy-btn" type="button" data-classify="easy" style="background: #3b82f6 !important; border: 1px solid rgba(59, 130, 246, 0.4) !important; color: white !important; flex: 1; padding: 10px 14px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 0.95rem; line-height: 1.25; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; min-height: 48px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);">
            Dễ <small style="display: block; font-size: 0.75rem; font-weight: normal; opacity: 0.85; margin-top: 2px;">4d</small>
          </button>
        </div>
      `;
      shortcutText = "<kbd>1</kbd> Học lại · <kbd>2</kbd> Khó · <kbd>3</kbd> Tốt · <kbd>4</kbd> Dễ";
    }

    return `
      ${subTabs}
      <section class="study-card study-card-step ${currentStudyMode}-step">
        ${cardHeader}
        ${cardBody}
      </section>
      <div class="study-actions-container">
        ${actionsHtml}
        <p class="study-shortcut-hint">${shortcutText}</p>
        <p class="study-mode-indicator">Chế độ ${getModeNumber()}/4: ${getModeName()}</p>
        <div class="study-bottom-stats">
          <span class="stat-badge new-words"><strong>${counts.newWords}</strong> Từ mới</span>
          <span class="stat-badge learned-words"><strong>${counts.learned}</strong> Đã học</span>
          <span class="stat-badge review-words"><strong>${counts.review}</strong> Ôn tập</span>
        </div>
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
      nextModeIndex = activeStudyModes.length - 1;
    }

    if (nextModeIndex >= activeStudyModes.length) {
      nextModeIndex = 0;
    }

    currentStudyMode = activeStudyModes[nextModeIndex];
    isWordRevealed = false;
    render();
  }

  function nextWord(topic) {
    isClassifyingWord = false;
    currentWordIndex = (currentWordIndex + 1) % topic.words.length;
    const activeStudyModes = getActiveStudyModes();
    currentStudyMode = activeStudyModes[0];
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
                    data-match-type="${tile.type}">
              ${tile.text}
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function startBlastGame(topic) {
    currentGameMode = "blast";
    
    // Initialize the 12-question list if it hasn't been initialized yet
    if (blastQuestionsList.length === 0) {
      let list = [...topic.words];
      while (list.length < 12) {
        list = [...list, ...topic.words];
      }
      blastQuestionsList = shuffle(list).slice(0, 12);
      blastQuestionsPlayed = 0;
      blastCorrectAnswers = 0;
    }

    // Check if the game is finished
    if (blastQuestionsPlayed >= 12) {
      if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
      }
      const minutes = String(Math.floor(gameTimeSeconds / 60)).padStart(2, "0");
      const seconds = String(gameTimeSeconds % 60).padStart(2, "0");

      root.querySelector(".workspace-panel").innerHTML = `
        <div class="game-board-top">
          <button class="workspace-back" type="button" data-game-menu>← Chọn game khác</button>
          <strong>Hoàn thành! • Thời gian: ${minutes}:${seconds}</strong>
        </div>
        <div class="game-victory-panel" style="text-align: center; padding: 40px 20px;">
          <i class="ti-cup" style="font-size: 3.5rem; color: #ffd700; margin-bottom: 20px; display: block;"></i>
          <h3 style="font-size: 1.8rem; margin-bottom: 10px; color: #fff;">Hoàn thành trò chơi!</h3>
          <p style="font-size: 1.25rem; color: #e2e8f0; margin-bottom: 8px;">
            Kết quả của bạn: <strong style="color: #2ee878; font-size: 1.5rem;">${blastCorrectAnswers} / 12</strong> câu đúng
          </p>
          <p style="font-size: 1.1rem; color: #a0aec0; margin-bottom: 25px;">Thời gian hoàn thành: <strong>${minutes}:${seconds}</strong></p>
          <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
            <button class="btn btn-primary" type="button" data-start-game="blast" style="background: linear-gradient(135deg, #319795, #2b6cb0); border: none; padding: 10px 24px; font-size: 1rem; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(49, 151, 149, 0.3); transition: all 0.2s;">Chơi lại</button>
            <a href="${getListHref()}" class="btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 10px 24px; font-size: 1rem; border-radius: 8px; color: white; text-decoration: none; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center;">Quay lại Vocabulary</a>
          </div>
        </div>
      `;
      attachEvents(topic);
      return;
    }

    const item = blastQuestionsList[blastQuestionsPlayed];
    const options = shuffle([
      item,
      ...topic.words.filter(word => word.word !== item.word).slice(0, 3)
    ]);

    root.querySelector(".workspace-panel").innerHTML = `
      <div class="game-board-top">
        <button class="workspace-back" type="button" data-game-menu>← Chọn game khác</button>
        <strong>Thời gian: <span data-game-timer>00:00</span> • Câu ${blastQuestionsPlayed + 1} / 12</strong>
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
        isClassifyingWord = false;
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
        const gameWords = topic.words.slice(0, 8);
        currentMatchTiles = shuffle([
          ...gameWords.map(word => ({ type: "word", id: word.word, text: word.word })),
          ...gameWords.map(word => ({ type: "meaning", id: word.word, text: word.meaning }))
        ]);
        render();
      });
    });

    root.querySelector("[data-game-menu]")?.addEventListener("click", () => {
      resetGameState();
      render();
    });

    root.querySelectorAll("[data-match-id]").forEach(button => {
      button.addEventListener("click", () => {
        if (!isTimerStarted) {
          isTimerStarted = true;
          startGameTimer();
        }
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
        if (!isTimerStarted) {
          isTimerStarted = true;
          startGameTimer();
        }
        const feedback = root.querySelector("[data-study-feedback]");
        if (feedback) feedback.textContent = "";

        // Prevent further clicks during transition
        const buttons = root.querySelectorAll("[data-blast-correct]");
        buttons.forEach(btn => {
          btn.style.pointerEvents = "none";
        });

        const isCorrect = button.dataset.blastCorrect === "true";
        if (isCorrect) {
          blastCorrectAnswers++;
          button.classList.add("correct-border");
          setTimeout(() => {
            blastQuestionsPlayed++;
            startBlastGame(topic);
          }, 1000);
        } else {
          button.classList.add("wrong-border");
          const correctBtn = Array.from(buttons).find(btn => btn.dataset.blastCorrect === "true");
          if (correctBtn) {
            correctBtn.classList.add("correct-border");
          }
          setTimeout(() => {
            blastQuestionsPlayed++;
            startBlastGame(topic);
          }, 1500);
        }
      });
    });

    root.querySelectorAll("[data-mark-learned]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        isClassifyingWord = true;
        render();
      });
    });

    root.querySelectorAll("[data-classify]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const lvl = btn.dataset.classify;
        const item = topic.words[currentWordIndex];
        const wordKey = getWordKey(topic, item);
        savedWordRecords.set(wordKey, { key: wordKey, studyLevel: lvl });
        saveSavedWords("save", wordKey, lvl);
        nextWord(topic);
      });
    });

    root.querySelectorAll("[data-next-step]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        moveStudyStep(1, topic);
      });
    });

    root.querySelectorAll("[data-speak-word]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const word = btn.dataset.speakWord;
        const lang = btn.dataset.lang || "en-US";
        speakWord(word, lang);
      });
    });

    root.querySelectorAll("[data-report-word]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        alert(`Đã gửi báo cáo phản hồi về từ vựng "${btn.dataset.reportWord}". Cảm ơn đóng góp của bạn!`);
      });
    });

    root.querySelector("[data-start-speech]")?.addEventListener("click", () => {
      if (!recognition) {
        const resText = root.querySelector("[data-speech-result]");
        if (resText) resText.innerHTML = `<span style="color: #fc8181;">Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.</span>`;
        return;
      }
      
      const item = topic.words[currentWordIndex];
      const micBtn = root.querySelector("[data-start-speech]");
      const resText = root.querySelector("[data-speech-result]");
      
      micBtn.classList.add("recording");
      if (resText) resText.innerHTML = `<span style="color: #63b3ed;">Đang lắng nghe... Hãy đọc to từ vựng.</span>`;
      
      try {
        recognition.start();
      } catch (err) {
        // Already running
      }
      
      recognition.onresult = (event) => {
        micBtn.classList.remove("recording");
        const spokenWord = event.results[0][0].transcript.trim().toLowerCase();
        const cleanSpoken = spokenWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        const cleanTarget = item.word.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        
        const isCorrect = cleanSpoken === cleanTarget;
        if (resText) {
          resText.innerHTML = isCorrect 
            ? `<span style="color: #68d391; font-weight: bold;"><i class="ti-check"></i> Chính xác! Bạn nói: "${spokenWord}"</span>`
            : `<span style="color: #fc8181;"><i class="ti-close"></i> Chưa khớp. Bạn nói: "${spokenWord}". Hãy thử lại!</span>`;
        }
        
        if (isCorrect) {
          scheduleStudyAdvance(topic);
        }
      };
      
      recognition.onerror = (err) => {
        micBtn.classList.remove("recording");
        if (resText) resText.innerHTML = `<span style="color: #fc8181;">Lỗi nhận dạng (Error: ${err.error}). Hãy thử lại!</span>`;
      };
      
      recognition.onspeechend = () => {
        recognition.stop();
      };
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
