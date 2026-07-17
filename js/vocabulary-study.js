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
  let pendingSaveWord = null;

  // Word Cannon Game State Variables
  let cannonScore = 0;
  let cannonLives = 3;
  let cannonHits = 0;
  let cannonTotalTargets = 4;
  let cannonLevel = 1;
  let cannonQuestionsList = [];
  let cannonQuestionsPlayed = 0;
  let cannonCurrentQuestion = null;
  let cannonTargets = [];
  let cannonProjectiles = [];
  let cannonAngle = -Math.PI / 2;
  let cannonRequestFrameId = null;
  let cannonWrongFlashTimeout = null;
  let cannonMissedWords = [];
  let cannonTotalHits = 0;
  let cannonCurrentStreak = 0;
  let cannonMaxStreak = 0;

  let isAnswered = false;
  let lastAnswerIsCorrect = false;
  let lastTypedAnswer = "";
  let lastQuizSelectedIndex = -1;
  let currentQuizOptions = [];

  function initWordState(item, topic) {
    isWordRevealed = false;
    isAnswered = false;
    lastAnswerIsCorrect = false;
    lastTypedAnswer = "";
    lastQuizSelectedIndex = -1;
    
    if (item && topic) {
      const wrongCandidates = topic.words.filter(w => w.word !== item.word);
      const chosenWrong = shuffle(wrongCandidates).slice(0, 3);
      currentQuizOptions = shuffle([item, ...chosenWrong]);
    } else {
      currentQuizOptions = [];
    }
  }
  
  let autoSpeak = localStorage.getItem("vocab_settings_autoSpeak") !== "false";
  let showExamples = localStorage.getItem("vocab_settings_showExamples") !== "false";
  let showCollocations = localStorage.getItem("vocab_settings_showCollocations") !== "false";
  let showSynonyms = localStorage.getItem("vocab_settings_showSynonyms") !== "false";
  let showWordClass = localStorage.getItem("vocab_settings_showWordClass") !== "false";
  let preferredVoice = localStorage.getItem("vocab_settings_preferredVoice") || "en-US";
  let isStudySettingsOpen = false;
  let isModesSettingsOpen = false;
  let lastSpokenKey = "";

  let confirmMasteredWordKey = null;
  let activeReportWord = null;
  let selectedReportOptions = new Set();
  let reportDescription = "";

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
        const inputEl = document.activeElement;
        if (inputEl && inputEl.value.trim() !== "") {
          root.querySelector("[data-check-type]")?.click();
        }
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
  const getStudyWords = (topic) => topic ? topic.words.filter(w => !savedWords.has(getWordKey(topic, w))) : [];
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

    // Reset cannon game variables
    cannonScore = 0;
    cannonLives = 3;
    cannonHits = 0;
    cannonTotalTargets = 4;
    cannonLevel = 1;
    cannonQuestionsList = [];
    cannonQuestionsPlayed = 0;
    cannonCurrentQuestion = null;
    cannonTargets = [];
    cannonProjectiles = [];
    cannonAngle = -Math.PI / 2;
    if (cannonRequestFrameId) {
      cancelAnimationFrame(cannonRequestFrameId);
      cannonRequestFrameId = null;
    }
    if (cannonWrongFlashTimeout) {
      clearTimeout(cannonWrongFlashTimeout);
      cannonWrongFlashTimeout = null;
    }
    cannonMissedWords = [];
    cannonTotalHits = 0;
    cannonCurrentStreak = 0;
    cannonMaxStreak = 0;
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

  if (typeof window !== "undefined" && window.VOCAB_EXTRAS) {
    for (const [word, data] of Object.entries(window.VOCAB_EXTRAS)) {
      const lowerWord = word.toLowerCase();
      if (!closeMeaningHints[lowerWord]) {
        closeMeaningHints[lowerWord] = [];
      }
      if (data.synonym) {
        if (!closeMeaningHints[lowerWord].includes(data.synonym)) {
          closeMeaningHints[lowerWord].push(data.synonym);
        }
      }
    }
  }

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

  function showUndoToast(wordText, wordKey) {
    const existing = document.querySelector(".vocab-toast-undo");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "vocab-toast-undo";
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      opacity: 0;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 2000;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    toast.innerHTML = `
      <span style="color: #e2e8f0; font-size: 0.9rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Đã đánh dấu thành thạo từ <strong style="color: #ffffff;">${wordText}</strong>
      </span>
      <button type="button" class="undo-btn" style="background: none; border: none; color: #10b981; font-weight: bold; cursor: pointer; font-size: 0.9rem; padding: 0; display: inline-flex; align-items: center; gap: 4px; transition: color 0.2s; font-family: inherit;">
        <i class="ti-back-left" style="font-size: 0.85rem; position: relative; top: 1px;"></i> Hoàn tác
      </button>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = "translateX(-50%) translateY(0)";
      toast.style.opacity = "1";
    });

    let dismissTimer = setTimeout(() => {
      dismissToast();
    }, 4500);

    function dismissToast() {
      toast.style.transform = "translateX(-50%) translateY(100px)";
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.remove();
      }, 400);
    }

    toast.querySelector(".undo-btn").addEventListener("click", () => {
      clearTimeout(dismissTimer);
      savedWords.delete(wordKey);
      savedWordRecords.delete(wordKey);
      saveSavedWords("remove", wordKey);
      dismissToast();
      render();
    });
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

    root.dataset.workspaceMode = currentWorkspaceMode;
    const pageContainer = document.querySelector(".vocab-study-page");
    if (pageContainer) {
      pageContainer.setAttribute("data-mode", currentWorkspaceMode);
    }

    const getTabsGridStyle = () => {
      return currentWorkspaceMode === "study" ? "grid-template-columns: repeat(3, minmax(83px, 1fr)) 44px;" : "";
    };

    let confirmPopupHtml = "";
    if (confirmMasteredWordKey) {
      confirmPopupHtml = `
        <div class="modal-overlay" data-close-confirm style="position: fixed; inset: 0; background: rgba(2, 6, 23, 0.75); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000;">
          <div class="confirm-modal-card" style="width: min(90vw, 410px); min-height: 180px; background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.08); padding: 24px; border-radius: 16px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #ffffff; margin: 0 0 8px 0;">Đánh dấu thành thạo?</h3>
            <p style="font-size: 0.88rem; color: #94a3b8; line-height: 1.5; margin: 0 0 20px 0;">
               Từ này sẽ được đánh dấu là đã thành thạo và không xuất hiện trong hàng đợi ôn tập nữa. Bạn có chắc chắn không?
            </p>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button class="modal-btn-cancel" type="button" data-close-confirm style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.88rem; transition: background 0.2s;">Hủy</button>
              <button class="modal-btn-confirm" type="button" data-confirm-mastered style="background: #0ea5e9; border: none; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.88rem; transition: background 0.2s;">Xác nhận</button>
            </div>
          </div>
        </div>
      `;
    }

    let reportPopupHtml = "";
    if (activeReportWord) {
      const options = [
        "Ảnh không đúng nghĩa",
        "Từ vựng sai",
        "Ví dụ sai",
        "Lỗi âm thanh",
        "Khác"
      ];
      const descVal = reportDescription || "";
      const charCount = descVal.length;
      const wordCount = descVal.trim() === "" ? 0 : descVal.trim().split(/\s+/).length;
      
      const isSelected = selectedReportOptions.size > 0;
      const hasOther = selectedReportOptions.has(4);
      const isSubmitActive = isSelected && (!hasOther || wordCount >= 5);

      const descriptionBoxHtml = hasOther ? `
        <div style="margin-top: 14px; margin-bottom: 14px;">
          <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #ffffff; margin-bottom: 6px;">Mô tả chi tiết <span style="color: #ef4444;">*</span></label>
          <textarea data-report-desc style="width: 100%; height: 72px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; color: #ffffff; padding: 10px; font-family: inherit; font-size: 0.85rem; resize: none; outline: none; transition: border-color 0.2s; box-sizing: border-box;" placeholder="Ví dụ: Bấm loa không nghe gì, đã reload trang 2 lần. Đang dùng Chrome trên iPhone, mạng 4G.">${descVal}</textarea>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <span data-report-word-req-text style="font-size: 0.78rem; color: #ef4444; font-weight: 500;">
              ${wordCount < 5 ? `Cần thêm ${5 - wordCount} từ nữa (tối thiểu 5)` : ""}
            </span>
            <span data-report-char-counter style="font-size: 0.78rem; color: #64748b;">${charCount}/500</span>
          </div>
        </div>
      ` : "";

      reportPopupHtml = `
        <div class="modal-overlay" data-close-report style="position: fixed; inset: 0; background: rgba(2, 6, 23, 0.75); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: flex-start; justify-content: center; padding-top: calc(10vh + 20px); z-index: 1000; overflow-y: auto;">
          <div class="report-modal-card" style="width: min(95vw, 400px); background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.08); padding: 20px; border-radius: 16px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); text-align: left; position: relative; display: flex; flex-direction: column;">
            <button class="report-close-cross" type="button" data-close-report style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 1rem;"><i class="ti-close"></i></button>
            
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#redGradient)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <defs>
                  <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ef4444" />
                    <stop offset="100%" stop-color="#f87171" />
                  </linearGradient>
                </defs>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: #ffffff; margin: 0;">Báo lỗi</h3>
            </div>
            <p style="font-size: 0.85rem; color: #94a3b8; margin: 0 0 16px 0;">Bạn đang báo lỗi: <strong style="color: #ffffff;">${activeReportWord}</strong></p>
            
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
              ${options.map((opt, idx) => {
                const isSelectedOption = selectedReportOptions.has(idx);
                const optStyle = isSelectedOption
                  ? "border: 1px solid transparent; background-image: linear-gradient(#0f172a, #0f172a), linear-gradient(135deg, #ef4444, #f87171); background-origin: border-box; background-clip: padding-box, border-box; color: #ffffff;"
                  : "border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.02); color: #cbd5e1;";
                return `
                  <button class="report-opt-btn" type="button" data-report-opt="${idx}" style="width: 100%; text-align: left; padding: 10px 14px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.88rem; display: flex; align-items: center; justify-content: space-between; ${optStyle}">
                    <span>${opt}</span>
                    ${isSelectedOption ? `<span style="background: linear-gradient(135deg, #10b981, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 1.1rem; font-weight: bold;">✓</span>` : ""}
                  </button>
                `;
              }).join("")}
            </div>

            ${descriptionBoxHtml}
            
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px;">
              <button class="modal-btn-cancel-text" type="button" data-close-report style="background: transparent; border: none; color: #94a3b8; font-weight: bold; cursor: pointer; font-size: 0.88rem; transition: color 0.2s;">Hủy</button>
              <button class="modal-btn-submit-report" type="button" data-submit-report ${isSubmitActive ? "" : "disabled"} style="background: ${isSubmitActive ? '#ef4444' : 'rgba(239, 68, 68, 0.15)'}; border: none; color: ${isSubmitActive ? '#ffffff' : 'rgba(255,255,255,0.3)'}; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: ${isSubmitActive ? 'pointer' : 'not-allowed'}; font-size: 0.88rem; transition: all 0.2s;">Gửi báo cáo</button>
            </div>
          </div>
        </div>
      `;
    }

    root.innerHTML = `
      <div class="vocab-workspace mode-${currentWorkspaceMode}">
        <div class="workspace-top-bar">
          <div class="top-bar-left">
            <a class="workspace-back" href="${getListHref()}">← Quay lại chủ đề</a>
          </div>
          <div class="top-bar-center">
            <div class="workspace-tabs-wrap" style="position: relative; display: inline-block;">
              <div class="workspace-tabs" style="${getTabsGridStyle()}" aria-label="Chức năng học chủ đề">
                ${workspaceTabTemplate("view", "ti-eye", "Read")}
                ${workspaceTabTemplate("study", "ti-book", "Study")}
                ${workspaceTabTemplate("play", "ti-game", "Play")}
                ${currentWorkspaceMode === "study" ? `
                  <button class="workspace-tab settings-tab-btn ${isModesSettingsOpen ? 'settings-active' : ''}" type="button" data-toggle-modes-settings title="Tùy chỉnh chế độ học">
                    <svg class="settings-sliders-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;">
                      <line x1="4" y1="7" x2="20" y2="7"></line>
                      <circle cx="16" cy="7" r="2.5" fill="currentColor"></circle>
                      <line x1="4" y1="17" x2="20" y2="17"></line>
                      <circle cx="8" cy="17" r="2.5" fill="currentColor"></circle>
                    </svg>
                  </button>
                ` : ""}
              </div>
              
              ${currentWorkspaceMode === "study" ? `
                <div class="study-settings-panel" data-modes-settings style="position: absolute; top: calc(100% + 10px); right: 0; z-index: 100; width: 320px; display: ${isModesSettingsOpen ? 'block' : 'none'}; text-align: left;">
                  <label class="study-setting-row"><input type="checkbox" ${enabledStudyModes.has("flashcard") ? "checked" : ""} data-study-option="flashcard"> <span><strong>Flashcard</strong><br>Xem từ → lật xem nghĩa</span></label>
                  <label class="study-setting-row"><input type="checkbox" ${enabledStudyModes.has("quiz") ? "checked" : ""} data-study-option="quiz"> <span><strong>Trắc nghiệm</strong><br>Xem từ → chọn nghĩa đúng</span></label>
                  <label class="study-setting-row"><input type="checkbox" ${enabledStudyModes.has("type") ? "checked" : ""} data-study-option="type"> <span><strong>Gõ từ</strong><br>Xem nghĩa → gõ từ tiếng Anh</span></label>
                  <label class="study-setting-row"><input type="checkbox" ${enabledStudyModes.has("speak") ? "checked" : ""} data-study-option="speak"> <span><strong>Phát âm</strong><br>Nghe phát âm → đọc to để máy nhận dạng</span></label>
                </div>
              ` : ""}
            </div>
          </div>
          <div class="top-bar-right" style="display: flex; align-items: center; justify-content: flex-end;">
            <div class="study-score-wrap" style="display: flex; align-items: center; gap: 4px; font-family: inherit; font-size: 0.85rem; font-weight: 600; padding: 4px 10px; border-radius: 99px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="fill: #f97316;">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span class="study-points-add" style="color: #f97316; font-weight: 800;">+0</span>
              <span class="study-progress-text" style="color: #94a3b8; font-weight: 500; margin-left: 2px;">${counts.learned}/${topic.words.length} từ</span>
            </div>
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
        ${confirmPopupHtml}
        ${reportPopupHtml}
      </div>
    `;

    syncUrl();
    attachEvents(topic);
    if (currentGameMode === "cannon") {
      initCannonCanvas(topic);
    }
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

  function triggerAutoSpeak(word, mode) {
    if (!autoSpeak) return;
    if (mode === "type") return;
    
    const speakKey = `${word.word}-${mode}`;
    if (lastSpokenKey !== speakKey) {
      lastSpokenKey = speakKey;
      speakWord(word.word, preferredVoice);
    }
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
    const studyWords = getStudyWords(topic);
    if (studyWords.length === 0) {
      return `
        <div class="study-card" style="width: min(95vw, 400px); background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.08); padding: 40px 24px; border-radius: 16px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 40px auto 0 auto; box-sizing: border-box;">
          <i class="ti-cup" style="font-size: 3.5rem; background: linear-gradient(135deg, #ffd700, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px; display: block;"></i>
          <h3 style="color: #ffffff; font-size: 1.4rem; font-weight: 700; margin: 0 0 10px 0;">Chủ đề hoàn thành!</h3>
          <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin: 0 0 24px 0;">
            Tuyệt vời! Bạn đã đánh dấu thành thạo tất cả ${topic.words.length} từ trong chủ đề này.
          </p>
          <a href="${getListHref()}" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); border: none; padding: 10px 24px; font-size: 0.95rem; border-radius: 8px; color: white; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            Quay lại Vocabulary
          </a>
        </div>
      `;
    }

    if (currentWordIndex >= studyWords.length) {
      currentWordIndex = 0;
    }
    const item = studyWords[currentWordIndex];
    const wordKey = getWordKey(topic, item);
    const isSaved = savedWords.has(wordKey);
    const activeStudyModes = getActiveStudyModes();
    if (!activeStudyModes.includes(currentStudyMode)) currentStudyMode = activeStudyModes[0];

    // Trigger auto-speak
    triggerAutoSpeak(item, currentStudyMode);

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

    const studySettingsPanel = `
      <div class="study-settings-panel card-settings-panel" data-study-settings style="position: absolute; top: 58px; right: 20px; z-index: 100; width: 280px; text-align: left; display: ${isStudySettingsOpen ? 'block' : 'none'};">
        <div style="font-weight: bold; font-size: 0.95rem; margin-bottom: 12px; color: #ffffff; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.08);">Cài đặt</div>
        
        <label class="setting-toggle-row">
          <span class="setting-label-with-icon"><i class="ti-volume"></i> Tự động phát âm</span>
          <input type="checkbox" class="toggle-checkbox" ${autoSpeak ? "checked" : ""} data-study-setting="autoSpeak">
        </label>
        
        <label class="setting-toggle-row">
          <span class="setting-label-with-icon"><i class="ti-eye"></i> Hiện ví dụ</span>
          <input type="checkbox" class="toggle-checkbox" ${showExamples ? "checked" : ""} data-study-setting="showExamples">
        </label>
        
        <label class="setting-toggle-row">
          <span class="setting-label-with-icon"><i class="ti-comment"></i> Hiện cụm từ</span>
          <input type="checkbox" class="toggle-checkbox" ${showCollocations ? "checked" : ""} data-study-setting="showCollocations">
        </label>
        
        <label class="setting-toggle-row">
          <span class="setting-label-with-icon"><span style="display: inline-block; width: 14px; text-align: center; font-weight: bold; margin-right: 6px;">#</span> Hiện từ đồng nghĩa</span>
          <input type="checkbox" class="toggle-checkbox" ${showSynonyms ? "checked" : ""} data-study-setting="showSynonyms">
        </label>
        
        <label class="setting-toggle-row">
          <span class="setting-label-with-icon"><i class="ti-book"></i> Hiển thị loại từ</span>
          <input type="checkbox" class="toggle-checkbox" ${showWordClass ? "checked" : ""} data-study-setting="showWordClass">
        </label>
        
        <div class="setting-select-row" style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08);">
          <span style="font-size: 0.9rem; color: #cbd5e1;">Giọng đọc</span>
          <select class="setting-select" data-study-setting="preferredVoice" style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.15); color: #ffffff; border-radius: 6px; padding: 4px 8px; font-size: 0.85rem; cursor: pointer; outline: none;">
            <option value="en-US" ${preferredVoice === "en-US" ? "selected" : ""}>US us</option>
            <option value="en-GB" ${preferredVoice === "en-GB" ? "selected" : ""}>UK uk</option>
          </select>
        </div>
      </div>
    `;

    const cardHeader = `
      <div class="study-card-header">
        <button class="card-action-btn check-btn ${isSaved ? 'active' : ''}" type="button" data-save-word="${wordKey}" title="${isSaved ? 'Bỏ lưu từ này' : 'Lưu từ này'}">
          <i class="ti-check"></i>
        </button>
        <button class="card-action-btn ${isStudySettingsOpen ? 'settings-active' : ''}" type="button" data-toggle-study-settings title="Tùy chỉnh cách học">
          <i class="ti-settings"></i>
        </button>
        <button class="card-action-btn report-btn" type="button" data-report-word="${item.word}" title="Báo cáo lỗi từ vựng">
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
      const optionsHtml = currentQuizOptions.map((w, optIdx) => {
        const isCorrectOpt = w.word === item.word;
        let btnClass = "study-answer-btn";
        if (isAnswered) {
          if (isCorrectOpt) {
            btnClass += " correct";
          } else if (optIdx === lastQuizSelectedIndex) {
            btnClass += " wrong";
          }
        }
        return `
          <button class="${btnClass}" type="button" data-study-answer="${w.word}" data-correct="${isCorrectOpt}" data-answer-index="${optIdx}" ${isAnswered ? "disabled" : ""}>
            ${w.meaning}
          </button>
        `;
      }).join("");

      cardBody = `
        <div class="study-card-body quiz-body">
          <div class="word-info-wrap" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <div class="word-title-wrap" style="margin-bottom: 0;">
              <h3 class="vocab-word">${item.word}</h3>
              ${showWordClass ? `<span class="vocab-class">(${getWordClass(item.word)})</span>` : ""}
            </div>
            <div class="phonetics-row">
              <button class="pronounce-btn us" type="button" data-speak-word="${item.word}" data-lang="en-US">
                <i class="ti-volume"></i> <span>US /${item.phonetic.replace(/\//g, '')}/</span>
              </button>
              <button class="pronounce-btn uk" type="button" data-speak-word="${item.word}" data-lang="en-GB">
                <i class="ti-volume"></i> <span>UK /${item.phonetic.replace(/\//g, '')}/</span>
              </button>
            </div>
          </div>
          <div class="study-options">${optionsHtml}</div>
        </div>
      `;

      if (isAnswered) {
        actionsHtml = `
          <div class="study-action-row fade-in">
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
        actionsHtml = ``;
        shortcutText = ``;
      }
    } else if (currentStudyMode === "type") {
      if (isAnswered) {
        if (lastAnswerIsCorrect) {
          const wordClassBadge = showWordClass 
            ? `<div style="display: flex; justify-content: center; margin-top: 4px; margin-bottom: 2px;">
                <span class="vocab-class-badge" style="background: rgba(255, 255, 255, 0.08); padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; color: #94a3b8; font-style: italic; font-weight: 500;">
                  ${getWordClass(item.word)}
                </span>
               </div>`
            : "";

          cardBody = `
            <div class="study-card-body type-checked-body correct-spelling-body" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; height: 100%;">
              ${wordClassBadge}
              <h2 class="meaning-word" style="font-size: 2.2rem !important; font-weight: 700; color: #ffffff; margin: 4px 0 2px 0; text-align: center;">
                ${item.meaning}
              </h2>
              <div class="status-indicator-row" style="margin: 4px 0; color: #2ee878; font-weight: 600; font-size: 1.3rem; display: inline-flex; align-items: center; gap: 8px;">
                <i class="ti-check"></i> Chính xác!
              </div>
              <h2 class="vocab-word" style="font-size: 2.2rem !important; font-weight: 800; color: #2ee878; margin: 2px 0 0 0;">
                ${item.word}
              </h2>
            </div>
          `;
        } else {
          cardBody = `
            <div class="study-card-body type-checked-body incorrect-spelling-body" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; height: 100%;">
              <h2 class="vocab-word" style="font-size: 2.2rem !important; font-weight: 800; color: #ffffff; margin: 0; display: flex; align-items: baseline; justify-content: center; gap: 8px; flex-wrap: wrap;">
                <span>${item.word}</span>
                ${showWordClass ? `<span class="vocab-class" style="font-size: 1.1rem; font-style: italic; color: #38bdf8; font-weight: 600;">(${getWordClass(item.word)})</span>` : ""}
                <span style="color: #94a3b8; font-weight: 400; font-size: 1.8rem; margin: 0 6px;">-</span>
                <span style="font-size: 1.8rem; color: #cbd5e1; font-weight: 600;">${item.meaning}</span>
              </h2>
              <div class="status-indicator-row" style="margin: 4px 0; color: #ef4444; font-weight: 600; font-size: 1.3rem; display: inline-flex; align-items: center; gap: 6px;">
                <i class="ti-close"></i> Chưa đúng
              </div>
              <p class="typed-answer-line" style="font-size: 0.9rem; color: #94a3b8; margin: 4px 0 0 0;">
                Bạn gõ: <span style="color: #ef4444; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); padding: 4px 10px; border-radius: 6px; font-weight: 600; font-family: monospace;">${lastTypedAnswer || "(trống)"}</span>
              </p>
            </div>
          `;
        }

        actionsHtml = `
          <div class="study-action-row fade-in">
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
          <div class="study-card-body type-body">
            <p class="instruction-text">Gõ từ tiếng Anh có nghĩa là:</p>
            <h3 class="meaning-word">${item.meaning}</h3>
            <input class="type-answer" type="text" data-type-answer placeholder="Nhập từ tiếng Anh" autocomplete="off" autofocus>
            <button class="primary-study-action" type="button" data-check-type disabled style="opacity: 0.5; cursor: not-allowed;">Kiểm tra</button>
            <p data-study-feedback class="study-feedback-text"></p>
          </div>
        `;
        actionsHtml = ``;
        shortcutText = "<kbd>Enter</kbd> Kiểm tra";
      }
    } else if (currentStudyMode === "speak") {
      cardBody = `
        <div class="study-card-body speak-body">
          <div class="word-info-wrap" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <div class="word-title-wrap" style="margin-bottom: 0;">
              <h3 class="vocab-word">${item.word}</h3>
              ${showWordClass ? `<span class="vocab-class">(${getWordClass(item.word)})</span>` : ""}
            </div>
            <div class="phonetics-row">
              <button class="pronounce-btn us" type="button" data-speak-word="${item.word}" data-lang="en-US">
                <i class="ti-volume"></i> <span>US /${item.phonetic.replace(/\//g, '')}/</span>
              </button>
              <button class="pronounce-btn uk" type="button" data-speak-word="${item.word}" data-lang="en-GB">
                <i class="ti-volume"></i> <span>UK /${item.phonetic.replace(/\//g, '')}/</span>
              </button>
            </div>
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
        const extra = (window.VOCAB_EXTRAS && window.VOCAB_EXTRAS[item.word.toLowerCase()]);
        let extrasHtml = "";
        if (extra) {
          const collocationsHtml = (extra.collocations || []).map(col => `
            <span class="collocation-badge" style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.25); color: #38bdf8; padding: 4px 10px; border-radius: 99px; font-size: 0.85rem; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">
              ${col}
            </span>
          `).join("");

          const synonymHtml = extra.synonym ? `
            <div class="synonym-line" style="margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.85rem; color: #94a3b8;">
              <span>Đồng nghĩa:</span>
              <span class="synonym-badge" style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); color: #c084fc; padding: 4px 10px; border-radius: 99px; font-weight: 500;">
                ${extra.synonym}
              </span>
            </div>
          ` : "";

          extrasHtml = `
            <div class="extras-section" style="margin-top: 18px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
              <div class="collocations-row" style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                ${collocationsHtml}
              </div>
              ${synonymHtml}
            </div>
          `;
        } else {
          const hints = closeMeaningHints[item.word.toLowerCase()];
          if (hints && hints.length && showSynonyms) {
            extrasHtml = `
              <div class="collocations-row" style="margin-top: 14px; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                ${hints.map(hint => `<span class="collocation-badge" style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.2); color: #38bdf8; padding: 4px 10px; border-radius: 99px; font-size: 0.85rem;">${hint}</span>`).join("")}
              </div>
            `;
          }
        }

        cardBody = `
          <div class="study-card-body flashcard-body">
            <h3 class="meaning-word" style="color: #ffffff; margin-top: 14px; font-size: 2.2rem !important; font-weight: 800; display: flex; align-items: baseline; justify-content: center; gap: 8px; flex-wrap: wrap;">
              <span>${item.word}</span>
              ${showWordClass ? `<span style="font-size: 1.1rem; font-style: italic; color: #38bdf8; font-weight: 600;">(${getWordClass(item.word)})</span>` : ""}
              <span style="color: #94a3b8; font-weight: 400; font-size: 1.8rem; margin: 0 6px;">-</span>
              <span style="font-size: 1.8rem; color: #cbd5e1; font-weight: 600;">${item.meaning}</span>
            </h3>
            ${showExamples ? `
              <p class="example-text" style="font-size: 1rem; color: #cbd5e1; font-style: italic; margin-top: 14px; font-weight: 500;">
                "${item.example}"
              </p>
              ${translation ? `<p class="example-translation-text" style="color: #64748b; font-size: 0.88rem; margin-top: 8px;">(${translation})</p>` : ""}
            ` : ""}
            ${extrasHtml}
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
          <div class="study-card-body flashcard-body">
            <div class="word-info-wrap" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div class="word-title-wrap" style="margin-bottom: 0;">
                <h3 class="vocab-word">${item.word}</h3>
                ${showWordClass ? `<span class="vocab-class">(${getWordClass(item.word)})</span>` : ""}
              </div>
              <div class="phonetics-row">
                <button class="pronounce-btn us" type="button" data-speak-word="${item.word}" data-lang="en-US">
                  <i class="ti-volume"></i> <span>US /${item.phonetic.replace(/\//g, '')}/</span>
                </button>
                <button class="pronounce-btn uk" type="button" data-speak-word="${item.word}" data-lang="en-GB">
                  <i class="ti-volume"></i> <span>UK /${item.phonetic.replace(/\//g, '')}/</span>
                </button>
              </div>
            </div>
            <div class="meaning-section">
              <p class="flip-prompt">Nhấn hoặc phím Space để xem nghĩa</p>
            </div>
          </div>
        `;

        actionsHtml = "";
        shortcutText = "";
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

    const hasActiveOverlay = isStudySettingsOpen || !!confirmMasteredWordKey || !!activeReportWord;

    let borderClass = "";
    if (isAnswered) {
      borderClass = lastAnswerIsCorrect ? "correct-card" : "wrong-card";
    }

    return `
      ${subTabs}
      <section class="study-card study-card-step ${currentStudyMode}-step ${borderClass} ${hasActiveOverlay ? 'settings-open' : ''}" ${currentStudyMode === 'flashcard' ? 'data-flip-view' : ''} style="position: relative;">
        ${cardHeader}
        ${studySettingsPanel}
        ${cardBody}
      </section>
      <div class="study-actions-container">
        ${actionsHtml}
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
    
    // Reset answers but keep quiz options since it's the same word
    isWordRevealed = false;
    isAnswered = false;
    lastAnswerIsCorrect = false;
    lastTypedAnswer = "";
    lastQuizSelectedIndex = -1;
    render();
  }

  function nextWord(topic) {
    isClassifyingWord = false;
    const activeWords = currentWorkspaceMode === "study" ? getStudyWords(topic) : topic.words;
    if (activeWords.length > 0) {
      currentWordIndex = (currentWordIndex + 1) % activeWords.length;
    } else {
      currentWordIndex = 0;
    }
    const activeStudyModes = getActiveStudyModes();
    currentStudyMode = activeStudyModes[0];
    
    initWordState(activeWords[currentWordIndex], topic);
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
        <div class="game-selection-wrapper">
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
            <button class="game-choice" type="button" data-start-game="cannon">
              <i class="ti-target"></i>
              <h3>Word Cannon</h3>
              <p>Bắn pháo từ vựng chính xác để ghi điểm</p>
            </button>
          </div>
        </div>
      `;
    }

    if (currentGameMode === "cannon") {
      return renderCannonGame(topic);
    }

    return renderMatchGame(topic);
  }

  function renderCannonGame(topic) {
    const isGameOver = cannonLives <= 0;
    if (isGameOver) {
      if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
      }
      if (cannonRequestFrameId) {
        cancelAnimationFrame(cannonRequestFrameId);
        cannonRequestFrameId = null;
      }
    }

    if (cannonHits >= cannonTotalTargets && !isGameOver) {
      cannonLevel++;
      cannonHits = 0;
      cannonQuestionsList = shuffle([...topic.words]);
      cannonQuestionsPlayed = 0;
      cannonCurrentQuestion = null;
    }

    if (!cannonCurrentQuestion && !isGameOver) {
      if (cannonQuestionsList.length === 0) {
        let list = [...topic.words];
        while (list.length < 12) {
          list = [...list, ...topic.words];
        }
        cannonQuestionsList = shuffle(list);
        cannonQuestionsPlayed = 0;
      }
      cannonCurrentQuestion = cannonQuestionsList[cannonQuestionsPlayed % cannonQuestionsList.length];
      
      const wrongCandidates = topic.words.filter(w => w.word !== cannonCurrentQuestion.word);
      const chosenWrong = shuffle(wrongCandidates).slice(0, 3);
      const options = shuffle([cannonCurrentQuestion, ...chosenWrong]);
      
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.font = "bold 14px system-ui, sans-serif";

      cannonTargets = options.map((opt, i) => {
        const textWidth = tempCtx.measureText(opt.word).width;
        const width = Math.max(130, textWidth + 36);
        const colWidth = 620 / 4;
        const x = 50 + i * colWidth + Math.random() * 20;
        const y = 40 + Math.random() * 40;
        return {
          x: x,
          y: y,
          width: width,
          height: 46,
          text: opt.word,
          isCorrect: opt.word === cannonCurrentQuestion.word,
          isHitIncorrect: false,
          gradientIndex: i,
          vx: (Math.random() - 0.5) * 0.7,
          vy: (Math.random() - 0.5) * 0.5
        };
      });
      
      cannonProjectiles = [];
    }

    const minutes = String(Math.floor(gameTimeSeconds / 60)).padStart(2, "0");
    const seconds = String(gameTimeSeconds % 60).padStart(2, "0");

    let livesHtml = "";
    for (let i = 1; i <= 3; i++) {
      if (i <= cannonLives) {
        livesHtml += `<i class="ti-heart" style="color: #00f0ff; font-size: 1.1rem; filter: drop-shadow(0 0 4px rgba(0, 240, 255, 0.6)); margin-right: 4px;"></i>`;
      } else {
        livesHtml += `<i class="ti-heart" style="color: rgba(255,255,255,0.15); font-size: 1.1rem; margin-right: 4px;"></i>`;
      }
    }

    const currentMeaning = cannonCurrentQuestion ? cannonCurrentQuestion.meaning : "";

    return `
      <style>
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      </style>
      <div style="position: relative; max-width: 720px; margin: 0 auto; width: 100%;">
        <!-- Background Game Board (blurred if isGameOver) -->
        <div style="${isGameOver ? 'filter: blur(5px) brightness(0.35); pointer-events: none; transition: filter 0.3s ease;' : 'transition: filter 0.3s ease;'}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 4px 8px; color: #cbd5e1; font-weight: 600; font-size: 0.95rem; width: 100%;">
            <div style="display: flex; align-items: center;">
              <span style="color: #ffd700; font-size: 0.85rem; letter-spacing: 0.5px; background: rgba(255, 215, 0, 0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255, 215, 0, 0.2); display: flex; align-items: center; gap: 4px; font-weight: 700;">
                🏆 BXH: ___ - Rank 1
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-weight: 700; color: #00f0ff; font-size: 0.95rem; letter-spacing: 1px;">
              <span>LVL.${String(cannonLevel).padStart(2, '0')}</span>
              <span style="color: rgba(255,255,255,0.2);">|</span>
              <span style="color: #38bdf8; display: flex; align-items: center; gap: 4px;"><i class="ti-cup" style="color: #ffd700;"></i>${cannonScore}</span>
            </div>
          </div>
          
          <div class="game-panel study-card cannon-game-panel" style="position: relative; overflow: hidden; padding: 0; min-height: 360px; display: flex; flex-direction: column; align-items: stretch; justify-content: start;">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: rgba(15, 23, 42, 0.4); border-bottom: 1px solid rgba(255, 255, 255, 0.05); z-index: 5;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <button type="button" data-game-menu style="background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; padding: 0 4px 0 0; font-size: 1.15rem; line-height: 1; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">←</button>
                ${livesHtml}
              </div>
              <div style="font-weight: 700; color: #38bdf8; font-size: 0.95rem; display: flex; align-items: center; gap: 4px;">
                <i class="ti-time"></i> <span data-game-timer>${minutes}:${seconds}</span>
              </div>
              <div style="font-size: 0.8rem; font-weight: 600; color: #cbd5e1;">
                ${cannonHits} HIT // ${cannonTotalTargets} TARGETS
              </div>
            </div>

            <div style="text-align: center; margin-top: 8px; margin-bottom: 4px; z-index: 5;">
              <h2 style="color: #ffffff; font-size: 1.8rem; font-weight: 800; text-shadow: 0 0 12px rgba(255,255,255,0.25); margin: 0;">
                ${currentMeaning}
              </h2>
            </div>

            <div class="canvas-container-wrap" style="flex: 1; position: relative; width: 100%; min-height: 234px;">
              <canvas id="cannon-canvas" style="display: block; width: 100%; height: 100%; cursor: crosshair;"></canvas>
            </div>
          </div>
        </div>

        <!-- Overlaid Game Over Modal -->
        ${isGameOver ? `
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; padding: 12px;">
          <div class="game-panel study-card" style="width: 100%; max-width: 360px; padding: 24px 20px; display: flex; flex-direction: column; align-items: center; background: rgba(15, 23, 42, 0.95); border: 1.5px solid rgba(56, 189, 248, 0.25); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6); animation: modalFadeIn 0.3s ease-out; border-radius: 20px;">
            
            <!-- Wave Illustration Icon -->
            <div style="font-size: 3.5rem; filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.4)); margin-bottom: 4px; line-height: 1;">🌊</div>
            
            <!-- Game Over Title -->
            <h2 style="font-size: 1.6rem; font-weight: 900; color: #00f0ff; letter-spacing: 2px; margin: 4px 0 2px 0; text-transform: uppercase; text-align: center; text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);">GAME OVER</h2>
            <p style="color: #94a3b8; font-size: 0.85rem; font-weight: 600; letter-spacing: 1px; margin: 0 0 18px 0; text-align: center;">SCORE: ${cannonScore} // LEVEL: ${cannonLevel}</p>
            
            <!-- Stats Grid -->
            <div style="display: flex; gap: 8px; width: 100%; justify-content: center; margin-bottom: 20px;">
              <!-- PTS -->
              <div style="flex: 1; background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255, 255, 255, 0.06); padding: 8px 4px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <i class="ti-cup" style="color: #00f0ff; font-size: 1.1rem;"></i>
                <div style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin-top: 3px; line-height: 1.1;">${cannonScore}</div>
                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 2px;">PTS</div>
              </div>
              
              <!-- HIT -->
              <div style="flex: 1; background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255, 255, 255, 0.06); padding: 8px 4px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <i class="ti-bolt" style="color: #38bdf8; font-size: 1.1rem;"></i>
                <div style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin-top: 3px; line-height: 1.1;">${cannonTotalHits}</div>
                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 2px;">HIT</div>
              </div>
              
              <!-- MAX combo -->
              <div style="flex: 1; background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255, 255, 255, 0.06); padding: 8px 4px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <i class="ti-crown" style="color: #f43f5e; font-size: 1.1rem;"></i>
                <div style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin-top: 3px; line-height: 1.1;">x${(1 + cannonMaxStreak * 0.1).toFixed(1)}</div>
                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 2px;">MAX</div>
              </div>
            </div>

            <!-- Words To Review -->
            ${cannonMissedWords.length > 0 ? `
            <div style="text-align: left; width: 100%;">
              <p style="color: #f43f5e; font-size: 0.78rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 8px 0; border-left: 2.5px solid #f43f5e; padding-left: 6px;">
                &gt; TỪ CẦN ÔN (${cannonMissedWords.length})
              </p>
              <div style="display: flex; flex-direction: column; gap: 6px; max-height: 105px; overflow-y: auto; padding-right: 4px; margin-bottom: 4px; scrollbar-width: thin;">
                ${cannonMissedWords.map(w => `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.04); padding: 5px 10px; border-radius: 6px;">
                    <span style="font-weight: 700; color: #ffffff; font-size: 0.82rem;">${w.word}</span>
                    <span style="color: #94a3b8; font-size: 0.8rem;">${w.meaning}</span>
                  </div>
                `).join("")}
              </div>
            </div>
            ` : ''}

            <!-- Restart Button -->
            <button class="btn btn-primary" type="button" data-start-game="cannon" style="margin-top: 18px; background: linear-gradient(135deg, #00f0ff, #3b82f6); border: none; width: 100%; padding: 10px 20px; font-size: 0.95rem; border-radius: 99px; color: white; cursor: pointer; font-weight: 700; box-shadow: 0 4px 14px rgba(0, 240, 255, 0.35); transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <i class="ti-reload" style="font-weight: 900;"></i> RESTART
            </button>
            
            <button class="btn" type="button" data-game-menu style="margin-top: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.15); width: 100%; padding: 8px 20px; font-size: 0.90rem; border-radius: 99px; color: #cbd5e1; cursor: pointer; font-weight: 600; transition: all 0.2s;">
              MENU GAME
            </button>

          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  function initCannonCanvas(topic) {
    const canvas = document.getElementById("cannon-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const container = canvas.parentElement;
    
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = rect.height || 234;
    
    let lastTime = performance.now();
    let mouseX = canvas.width / 2;
    let mouseY = 50;
    let lastFireTime = 0;

    const cannonX = canvas.width / 2;
    const cannonY = canvas.height - 15;

    const gradients = [
      {
        start: "rgba(139, 92, 246, 0.22)", // purple
        end: "rgba(59, 130, 246, 0.22)",   // blue
        border: "rgba(167, 139, 250, 0.75)"
      },
      {
        start: "rgba(20, 184, 166, 0.22)",  // teal
        end: "rgba(16, 185, 129, 0.22)",   // emerald
        border: "rgba(45, 212, 191, 0.75)"
      },
      {
        start: "rgba(244, 63, 94, 0.22)",   // rose
        end: "rgba(139, 92, 246, 0.22)",   // purple
        border: "rgba(251, 113, 133, 0.75)"
      },
      {
        start: "rgba(245, 158, 11, 0.18)",  // amber
        end: "rgba(217, 70, 239, 0.18)",   // fuchsia
        border: "rgba(252, 211, 77, 0.75)"
      }
    ];

    if (cannonRequestFrameId) {
      cancelAnimationFrame(cannonRequestFrameId);
      cannonRequestFrameId = null;
    }

    function getMousePos(evt) {
      const cRect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if (evt.touches && evt.touches.length > 0) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
      } else {
        clientX = evt.clientX;
        clientY = evt.clientY;
      }
      return {
        x: (clientX - cRect.left) * (canvas.width / cRect.width),
        y: (clientY - cRect.top) * (canvas.height / cRect.height)
      };
    }

    function handleMove(e) {
      const pos = getMousePos(e);
      mouseX = pos.x;
      mouseY = pos.y;
      
      const dx = mouseX - cannonX;
      const dy = mouseY - cannonY;
      let angle = Math.atan2(dy, dx);
      if (angle > 0) {
        if (angle < Math.PI / 2) {
          angle = 0;
        } else {
          angle = -Math.PI;
        }
      }
      cannonAngle = angle;
    }

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("touchmove", handleMove, { passive: true });

    function handleShoot(e) {
      e.preventDefault();
      if (cannonLives <= 0) return;
      const gamePanel = root.querySelector(".cannon-game-panel");
      if (gamePanel && gamePanel.classList.contains("game-wrong-flash")) return;

      const now = performance.now();
      if (now - lastFireTime < 450) return;
      lastFireTime = now;

      if (!isTimerStarted) {
        isTimerStarted = true;
        startGameTimer();
      }

      const speed = 12;
      const vx = Math.cos(cannonAngle) * speed;
      const vy = Math.sin(cannonAngle) * speed;
      
      cannonProjectiles.push({
        x: cannonX + Math.cos(cannonAngle) * 45,
        y: cannonY + Math.sin(cannonAngle) * 45,
        vx: vx,
        vy: vy,
        radius: 6
      });
    }

    canvas.addEventListener("mousedown", handleShoot);
    canvas.addEventListener("touchstart", handleShoot, { passive: false });

    function update(time) {
      if (currentGameMode !== "cannon" || cannonLives <= 0 || !document.getElementById("cannon-canvas")) {
        if (cannonRequestFrameId) {
          cancelAnimationFrame(cannonRequestFrameId);
          cannonRequestFrameId = null;
        }
        return;
      }

      const dt = (time - lastTime) / 1000;
      lastTime = time;

      for (let i = cannonProjectiles.length - 1; i >= 0; i--) {
        const p = cannonProjectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          cannonProjectiles.splice(i, 1);
          continue;
        }
        
        let hitTarget = null;
        for (let j = 0; j < cannonTargets.length; j++) {
          const t = cannonTargets[j];
          if (t.isHitIncorrect) continue;
          if (p.x >= t.x && p.x <= t.x + t.width && p.y >= t.y && p.y <= t.y + t.height) {
            hitTarget = t;
            break;
          }
        }
        
        if (hitTarget) {
          cannonProjectiles.splice(i, 1);
          
          if (hitTarget.isCorrect) {
            cannonScore += 10;
            cannonHits++;
            cannonTotalHits++;
            cannonCurrentStreak++;
            if (cannonCurrentStreak > cannonMaxStreak) {
              cannonMaxStreak = cannonCurrentStreak;
            }
            cannonQuestionsPlayed++;
            cannonCurrentQuestion = null;
            setTimeout(() => {
              render();
            }, 100);
            return;
          } else {
            if (!hitTarget.isHitIncorrect) {
              hitTarget.isHitIncorrect = true;
              hitTarget.vx = 0;
              hitTarget.vy = 0;
              cannonLives--;
              cannonCurrentStreak = 0;

              if (cannonCurrentQuestion && !cannonMissedWords.some(w => w.word === cannonCurrentQuestion.word)) {
                cannonMissedWords.push(cannonCurrentQuestion);
              }
              
              const gamePanel = root.querySelector(".cannon-game-panel");
              if (gamePanel) {
                gamePanel.classList.add("game-wrong-flash");
                if (cannonWrongFlashTimeout) clearTimeout(cannonWrongFlashTimeout);
                cannonWrongFlashTimeout = setTimeout(() => {
                  gamePanel.classList.remove("game-wrong-flash");
                }, 1300);
              }
              
              setTimeout(() => {
                render();
              }, 100);
              return;
            }
          }
        }
      }

      cannonTargets.forEach(t => {
        t.x += t.vx;
        t.y += t.vy;
        
        if (t.x < 10 || t.x + t.width > canvas.width - 10) {
          t.vx *= -1;
          t.x = Math.max(10, Math.min(t.x, canvas.width - t.width - 10));
        }
        if (t.y < 40 || t.y + t.height > canvas.height - 80) {
          t.vy *= -1;
          t.y = Math.max(40, Math.min(t.y, canvas.height - t.height - 80));
        }
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.height; i += 6) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(cannonX, cannonY);
      ctx.lineTo(mouseX, mouseY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 7, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(mouseX - 10, mouseY);
      ctx.lineTo(mouseX + 10, mouseY);
      ctx.moveTo(mouseX, mouseY - 10);
      ctx.lineTo(mouseX, mouseY + 10);
      ctx.stroke();

      cannonTargets.forEach(t => {
        ctx.save();
        
        let glowColor = "rgba(0, 240, 255, 0.4)";
        
        if (t.isHitIncorrect) {
          glowColor = "rgba(239, 68, 68, 1.0)";
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 8;
          ctx.strokeStyle = glowColor;
          ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
          ctx.lineWidth = 1.5;
          
          const radius = 10;
          ctx.beginPath();
          ctx.moveTo(t.x + radius, t.y);
          ctx.lineTo(t.x + t.width - radius, t.y);
          ctx.quadraticCurveTo(t.x + t.width, t.y, t.x + t.width, t.y + radius);
          ctx.lineTo(t.x + t.width, t.y + t.height - radius);
          ctx.quadraticCurveTo(t.x + t.width, t.y + t.height, t.x + t.width - radius, t.y + t.height);
          ctx.lineTo(t.x + radius, t.y + t.height);
          ctx.quadraticCurveTo(t.x, t.y + t.height, t.x, t.y + t.height - radius);
          ctx.lineTo(t.x, t.y + radius);
          ctx.quadraticCurveTo(t.x, t.y, t.x + radius, t.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          
          ctx.save();
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(t.text, t.x + t.width / 2, t.y + t.height / 2);
          ctx.restore();
        } else {
          const gradInfo = gradients[t.gradientIndex] || gradients[0];
          glowColor = gradInfo.border;
          
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 6;
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 1.5;
          
          const linearGrad = ctx.createLinearGradient(t.x, t.y, t.x, t.y + t.height);
          linearGrad.addColorStop(0, gradInfo.start);
          linearGrad.addColorStop(1, gradInfo.end);
          ctx.fillStyle = linearGrad;
          
          const radius = 10;
          ctx.beginPath();
          ctx.moveTo(t.x + radius, t.y);
          ctx.lineTo(t.x + t.width - radius, t.y);
          ctx.quadraticCurveTo(t.x + t.width, t.y, t.x + t.width, t.y + radius);
          ctx.lineTo(t.x + t.width, t.y + t.height - radius);
          ctx.quadraticCurveTo(t.x + t.width, t.y + t.height, t.x + t.width - radius, t.y + t.height);
          ctx.lineTo(t.x + radius, t.y + t.height);
          ctx.quadraticCurveTo(t.x, t.y + t.height, t.x, t.y + t.height - radius);
          ctx.lineTo(t.x, t.y + radius);
          ctx.quadraticCurveTo(t.x, t.y, t.x + radius, t.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(t.text, t.x + t.width / 2, t.y + t.height / 2);
          ctx.restore();
        }
      });

      cannonProjectiles.forEach(p => {
        ctx.save();
        ctx.fillStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.save();
      ctx.translate(cannonX, cannonY);
      ctx.rotate(cannonAngle + Math.PI / 2);
      
      const barrelGrad = ctx.createLinearGradient(-8, -40, 8, 0);
      barrelGrad.addColorStop(0, "#00f0ff");
      barrelGrad.addColorStop(1, "#2563eb");
      ctx.fillStyle = barrelGrad;
      
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-8, -42, 16, 42, 4) : ctx.rect(-8, -42, 16, 42);
      ctx.fill();
      
      ctx.restore();

      ctx.save();
      ctx.shadowColor = "rgba(0, 240, 255, 0.3)";
      ctx.shadowBlur = 6;
      ctx.strokeStyle = "#00f0ff";
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.arc(cannonX - 14, cannonY + 6, 7, 0, Math.PI * 2);
      ctx.arc(cannonX + 14, cannonY + 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cannonX, cannonY + 4, 11, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      cannonRequestFrameId = requestAnimationFrame(update);
    }

    cannonRequestFrameId = requestAnimationFrame(update);
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
        <div class="game-victory-panel" style="text-align: center; padding: 40px 20px; max-width: 720px; margin: 0 auto;">
          <i class="ti-cup" style="font-size: 3.5rem; color: #ffd700; margin-bottom: 20px; display: block;"></i>
          <h3 style="font-size: 1.8rem; margin-bottom: 10px; color: #fff;">Chúc mừng!</h3>
          <p style="font-size: 1.1rem; color: #a0aec0; margin-bottom: 25px;">Bạn đã ghép đúng tất cả các từ trong <strong>${minutes}:${seconds}</strong>!</p>
          <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
            <button class="btn btn-primary" type="button" data-start-game="match" style="background: linear-gradient(135deg, #319795, #2b6cb0); border: none; padding: 10px 24px; font-size: 1rem; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(49, 151, 149, 0.3); transition: all 0.2s;">Chơi lại</button>
            <button class="btn" type="button" data-game-menu style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 10px 24px; font-size: 1rem; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; transition: all 0.2s;">Menu Game</button>
          </div>
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
      <div style="max-width: 720px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 4px 8px; color: #cbd5e1; font-weight: 600; font-size: 0.95rem;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" data-game-menu style="background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; padding: 0; font-size: 1.25rem; line-height: 1; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">←</button>
            <span>${matchedPairs.size} / ${gameWords.length} cặp đúng</span>
          </div>
          <span>⏱️ <span data-game-timer>00:00</span></span>
        </div>
        <div class="game-board" style="gap: 12px;">
          ${currentMatchTiles.map(tile => {
            const isMatched = matchedPairs.has(tile.id);
            return `
              <button class="game-tile ${tile.type} ${isMatched ? "is-matched" : ""}" 
                      type="button" 
                      data-match-id="${tile.id}" 
                      data-match-type="${tile.type}"
                      style="padding: 12px 14px; font-size: 0.95rem; min-height: 52px;">
                ${tile.text}
              </button>
            `;
          }).join("")}
        </div>
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
        <div class="game-victory-panel" style="text-align: center; padding: 40px 20px; max-width: 720px; margin: 0 auto;">
          <i class="ti-cup" style="font-size: 3.5rem; color: #ffd700; margin-bottom: 20px; display: block;"></i>
          <h3 style="font-size: 1.8rem; margin-bottom: 10px; color: #fff;">Hoàn thành trò chơi!</h3>
          <p style="font-size: 1.25rem; color: #e2e8f0; margin-bottom: 8px;">
            Kết quả của bạn: <strong style="color: #2ee878; font-size: 1.5rem;">${blastCorrectAnswers} / 12</strong> câu đúng
          </p>
          <p style="font-size: 1.1rem; color: #a0aec0; margin-bottom: 25px;">Thời gian hoàn thành: <strong>${minutes}:${seconds}</strong></p>
          <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
            <button class="btn btn-primary" type="button" data-start-game="blast" style="background: linear-gradient(135deg, #319795, #2b6cb0); border: none; padding: 10px 24px; font-size: 1rem; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(49, 151, 149, 0.3); transition: all 0.2s;">Chơi lại</button>
            <button class="btn" type="button" data-game-menu style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 10px 24px; font-size: 1rem; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; transition: all 0.2s;">Menu Game</button>
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
      <div style="max-width: 720px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 4px 8px; color: #cbd5e1; font-weight: 600; font-size: 0.95rem;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" data-game-menu style="background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; padding: 0; font-size: 1.25rem; line-height: 1; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">←</button>
            <span>Câu ${blastQuestionsPlayed + 1} / 12</span>
          </div>
          <span>⏱️ <span data-game-timer>00:00</span></span>
        </div>
        <div class="game-panel study-card" style="padding: 16px; min-height: auto;">
          <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 1.8rem; text-align: center; color: #ffffff;">${item.word}</h3>
          <div class="blast-options" style="gap: 12px;">
            ${options.map(option => `
              <button class="game-tile meaning" type="button" data-blast-correct="${option.word === item.word}" style="padding: 12px 14px; font-size: 0.95rem; min-height: 52px;">
                ${option.meaning}
              </button>
            `).join("")}
          </div>
          <p data-study-feedback style="margin-top: 10px; margin-bottom: 0;"></p>
        </div>
      </div>
    `;

    attachEvents(topic);
    updateTimerDisplay();
  }

  function attachEvents(topic) {
    const activeWords = currentWorkspaceMode === "study" ? getStudyWords(topic) : topic.words;
    root.querySelectorAll("[data-workspace-mode]").forEach(button => {
      button.addEventListener("click", () => {
        currentWorkspaceMode = button.dataset.workspaceMode;
        isWordRevealed = false;
        isClassifyingWord = false;
        resetGameState();
        render();
      });
    });

    root.querySelector("[data-toggle-modes-settings]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      isModesSettingsOpen = !isModesSettingsOpen;
      isStudySettingsOpen = false;
      render();
    });

    root.querySelector("[data-toggle-study-settings]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      isStudySettingsOpen = !isStudySettingsOpen;
      isModesSettingsOpen = false;
      render();
    });

    // Close settings panels on outside click
    const handleGlobalClick = (e) => {
      let changed = false;
      if (isModesSettingsOpen && !e.target.closest("[data-modes-settings]") && !e.target.closest("[data-toggle-modes-settings]")) {
        isModesSettingsOpen = false;
        changed = true;
      }
      if (isStudySettingsOpen && !e.target.closest("[data-study-settings]") && !e.target.closest("[data-toggle-study-settings]")) {
        isStudySettingsOpen = false;
        changed = true;
      }
      if (changed) {
        render();
      }
    };
    if (window._vocabStudyClickHandler) {
      window.removeEventListener("click", window._vocabStudyClickHandler);
    }
    window._vocabStudyClickHandler = handleGlobalClick;
    window.addEventListener("click", handleGlobalClick);

    root.querySelectorAll("[data-study-setting]").forEach(input => {
      input.addEventListener("change", () => {
        const setting = input.dataset.studySetting;
        if (input.type === "checkbox") {
          const val = input.checked;
          if (setting === "autoSpeak") autoSpeak = val;
          if (setting === "showExamples") showExamples = val;
          if (setting === "showCollocations") showCollocations = val;
          if (setting === "showSynonyms") showSynonyms = val;
          if (setting === "showWordClass") showWordClass = val;
          localStorage.setItem(`vocab_settings_${setting}`, val);
        } else if (input.tagName === "SELECT") {
          const val = input.value;
          if (setting === "preferredVoice") preferredVoice = val;
          localStorage.setItem(`vocab_settings_${setting}`, val);
        }
        render();
      });
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

    root.querySelectorAll("[data-flip-view]").forEach(element => {
      element.addEventListener("click", (e) => {
        if (element.classList.contains("flashcard-step")) {
          if (e.target.closest("button") || e.target.closest("input") || e.target.closest("a") || e.target.closest("select") || e.target.closest(".study-settings-panel") || e.target.closest(".confirm-modal-card") || e.target.closest(".report-modal-card") || e.target.closest(".modal-overlay")) {
            return;
          }
        }
        isWordRevealed = !isWordRevealed;
        render();
      });
    });

    root.querySelectorAll("[data-save-word]").forEach(button => {
      button.addEventListener("click", () => {
        const wordKey = button.dataset.saveWord;
        if (!wordKey) return;

        if (savedWords.has(wordKey)) {
          savedWords.delete(wordKey);
          savedWordRecords.delete(wordKey);
          saveSavedWords("remove", wordKey);
          render();
        } else {
          confirmMasteredWordKey = wordKey;
          render();
        }
      });
    });

    root.querySelectorAll("[data-report-word]").forEach(button => {
      button.addEventListener("click", () => {
        activeReportWord = button.dataset.reportWord;
        selectedReportOptions.clear();
        reportDescription = "";
        render();
      });
    });

    // Confirm Mastered Modal Events
    root.querySelectorAll("[data-close-confirm]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        if (e.target === btn || btn.tagName === "BUTTON") {
          confirmMasteredWordKey = null;
          render();
        }
      });
    });

    root.querySelector("[data-confirm-mastered]")?.addEventListener("click", () => {
      if (confirmMasteredWordKey) {
        const wordKey = confirmMasteredWordKey;
        const wordText = wordKey.split("-").pop();
        savedWords.add(wordKey);
        savedWordRecords.set(wordKey, {
          key: wordKey,
          studyLevel: "easy"
        });
        saveSavedWords("save", wordKey, "easy");
        confirmMasteredWordKey = null;
        render();
        showUndoToast(wordText, wordKey);
      }
    });

    // Report Modal Events
    root.querySelectorAll("[data-close-report]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        if (e.target === btn || btn.tagName === "BUTTON" || btn.classList.contains("modal-btn-cancel-text") || btn.closest(".report-close-cross")) {
          activeReportWord = null;
          selectedReportOptions.clear();
          reportDescription = "";
          render();
        }
      });
    });

    root.querySelectorAll("[data-report-opt]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.reportOpt);
        if (selectedReportOptions.has(idx)) {
          selectedReportOptions.delete(idx);
        } else {
          selectedReportOptions.add(idx);
        }
        render();
      });
    });

    const reportTextarea = root.querySelector("[data-report-desc]");
    if (reportTextarea) {
      reportTextarea.addEventListener("input", (e) => {
        reportDescription = e.target.value;
        const text = reportDescription;
        const charCount = text.length;
        const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
        
        const counterEl = root.querySelector("[data-report-char-counter]");
        if (counterEl) counterEl.textContent = `${charCount}/500`;
        
        const reqEl = root.querySelector("[data-report-word-req-text]");
        if (reqEl) {
          if (wordCount < 5) {
            reqEl.textContent = `Cần thêm ${5 - wordCount} từ nữa (tối thiểu 5)`;
            reqEl.style.color = "#ef4444";
          } else {
            reqEl.textContent = "";
          }
        }
        
        const submitBtn = root.querySelector("[data-submit-report]");
        if (submitBtn) {
          const isSelected = selectedReportOptions.size > 0;
          const hasOther = selectedReportOptions.has(4);
          const isSubmitActive = isSelected && (!hasOther || wordCount >= 5);
          submitBtn.disabled = !isSubmitActive;
          if (isSubmitActive) {
            submitBtn.style.background = "#ef4444";
            submitBtn.style.color = "#ffffff";
            submitBtn.style.cursor = "pointer";
          } else {
            submitBtn.style.background = "rgba(239, 68, 68, 0.15)";
            submitBtn.style.color = "rgba(255, 255, 255, 0.3)";
            submitBtn.style.cursor = "not-allowed";
          }
        }
      });
    }

    root.querySelector("[data-submit-report]")?.addEventListener("click", () => {
      const text = reportDescription || "";
      const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
      
      const isSelected = selectedReportOptions.size > 0;
      const hasOther = selectedReportOptions.has(4);
      const isSubmitActive = isSelected && (!hasOther || wordCount >= 5);

      if (isSubmitActive) {
        const optionNames = ["Ảnh không đúng nghĩa", "Từ vựng sai", "Ví dụ sai", "Lỗi âm thanh", "Khác"];
        const selectedNames = Array.from(selectedReportOptions).map(idx => optionNames[idx]);
        alert(`Báo cáo của bạn đã được ghi nhận: "${selectedNames.join(", ")}" cho từ "${activeReportWord}".`);
        activeReportWord = null;
        selectedReportOptions.clear();
        reportDescription = "";
        render();
      }
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
        if (isAnswered) return;
        const isCorrect = button.dataset.correct === "true";
        
        isAnswered = true;
        lastAnswerIsCorrect = isCorrect;
        lastQuizSelectedIndex = parseInt(button.dataset.answerIndex);

        render();
      });
    });

    root.querySelectorAll("[data-check-type]").forEach(button => {
      button.addEventListener("click", () => {
        if (isAnswered) return;
        const card = button.closest(".study-card");
        const input = card?.querySelector("[data-type-answer]");
        const item = activeWords[currentWordIndex];
        const isCorrect = input?.value.trim().toLowerCase() === item.word.toLowerCase();

        isAnswered = true;
        lastAnswerIsCorrect = isCorrect;
        lastTypedAnswer = input?.value.trim() || "";

        render();
      });
    });

    root.querySelectorAll("[data-type-answer]").forEach(input => {
      const card = input.closest(".study-card");
      const checkBtn = card?.querySelector("[data-check-type]");
      
      const updateButtonState = () => {
        if (!checkBtn) return;
        const val = input.value.trim();
        if (val === "") {
          checkBtn.disabled = true;
          checkBtn.style.opacity = "0.5";
          checkBtn.style.cursor = "not-allowed";
        } else {
          if (!input.disabled) {
            checkBtn.disabled = false;
            checkBtn.style.opacity = "1";
            checkBtn.style.cursor = "pointer";
          }
        }
      };

      input.addEventListener("input", updateButtonState);

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (input.value.trim() !== "") {
            checkBtn?.click();
          }
        }
      });
    });

    root.querySelectorAll("[data-start-game]").forEach(button => {
      button.addEventListener("click", () => {
        resetGameState();
        if (button.dataset.startGame === "blast") {
          startBlastGame(topic);
          return;
        }
        if (button.dataset.startGame === "cannon") {
          currentGameMode = "cannon";
          cannonLives = 3;
          cannonHits = 0;
          cannonScore = 0;
          cannonLevel = 1;
          cannonCurrentQuestion = null;
          cannonMissedWords = [];
          cannonTotalHits = 0;
          cannonCurrentStreak = 0;
          cannonMaxStreak = 0;
          render();
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
        const item = activeWords[currentWordIndex];
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



    root.querySelector("[data-start-speech]")?.addEventListener("click", () => {
      if (!recognition) {
        const resText = root.querySelector("[data-speech-result]");
        if (resText) resText.innerHTML = `<span style="color: #fc8181;">Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.</span>`;
        return;
      }
      
      const item = activeWords[currentWordIndex];
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

  const startTopic = getTopic();
  if (startTopic) {
    const activeWords = currentWorkspaceMode === "study" ? getStudyWords(startTopic) : startTopic.words;
    if (activeWords && activeWords[currentWordIndex]) {
      initWordState(activeWords[currentWordIndex], startTopic);
    }
  }

  render();
}
