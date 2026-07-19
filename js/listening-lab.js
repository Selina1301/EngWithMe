(function () {
  const STORAGE_KEY = "engWithMeListeningLabState";

  const modes = {
    slow: { label: "Slow Mode", note: "Nghe rõ từng chữ, tốc độ chậm để bắt âm.", rate: 0.78, native: false, noise: false },
    natural: { label: "Natural Mode", note: "Tốc độ hội thoại thực tế.", rate: 1, native: false, noise: false },
    native: { label: "Native Mode", note: "Tốc độ nhanh hơn, có nối âm và dạng nói thật.", rate: 1.24, native: true, noise: false },
    chaos: { label: "Chaos Mode", note: "Có tiếng nền nhẹ để mô phỏng đời thật.", rate: 1.08, native: false, noise: true }
  };

  const mistakeLabels = {
    connected: "Nối âm",
    ending: "Âm cuối",
    fast: "Tốc độ nhanh",
    reduced: "Nuốt âm",
    numbers: "Số / thời gian",
    accent: "Khác accent",
    noise: "Tiếng ồn nền",
    emotion: "Nghe sắc thái"
  };

  const defaultGoal = "self-introduction";

  const goalText = {
    "self-introduction": "Giới thiệu bản thân",
    "family-friends": "Gia đình & bạn bè",
    "work-career": "Công việc & nghề nghiệp",
    "study-school": "Học tập & trường lớp",
    "daily-routine": "Thói quen hằng ngày",
    "shopping-prices": "Mua sắm & giá cả",
    "food-restaurant": "Ăn uống & nhà hàng",
    "travel-directions": "Du lịch & hỏi đường",
    "health-doctor": "Sức khỏe & đi khám",
    "weather-seasons": "Thời tiết & mùa",
    "hobbies-free-time": "Sở thích & thời gian rảnh",
    "news-society": "Tin tức & đời sống",
    "tech-internet": "Công nghệ & Internet"
  };

  const voiceRoutes = [
    { label: "American", lang: "en-US", fallbackLang: "en-US" },
    { label: "British", lang: "en-GB", fallbackLang: "en-GB" },
    { label: "Australian", lang: "en-AU", fallbackLang: "en-GB" },
    { label: "Indian", lang: "en-IN", fallbackLang: "en-GB" },
    { label: "Canadian", lang: "en-CA", fallbackLang: "en-US" },
    { label: "Irish", lang: "en-IE", fallbackLang: "en-GB" }
  ];

  const missions = [];
  const missionExpansions = [];
  const supplementalSessionExpansions = [];

  function loadFallbackSync() {
    if (typeof window !== "undefined") {
      missions.splice(0, missions.length, ...(window.LISTENING_LAB_MISSIONS || []));
      missionExpansions.splice(0, missionExpansions.length, ...(window.LISTENING_LAB_MISSION_EXPANSIONS || []));
      supplementalSessionExpansions.splice(0, supplementalSessionExpansions.length, ...(window.LISTENING_LAB_SUPPLEMENTAL_EXPANSIONS || []));
      
      // Process fallbacks
      missions.push(...[...missionExpansions, ...supplementalSessionExpansions].map((spec, index) => createMissionFromSpec(spec, index + 7)));
      assignSessionVoiceRoutes();
      window.LISTENING_MISSIONS_FALLBACK = cloneContentList(missions);
    }
  }

  async function loadFallback() {
    const success = await loadFallbackScript();
    if (success) {
      loadFallbackSync();
      return true;
    }
    return false;
  }

  async function loadFallbackScript() {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "js/listening-data-fallback.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  if (typeof document === "undefined") {
    loadFallbackSync();
  }


  async function loadListeningMissionsFromApi() {
    try {
      const response = await fetch("api/learning_content.php?section=listening", {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!response.ok) return await loadFallback();

      const result = await response.json();
      const loaded = Array.isArray(result.items)
        ? result.items.map((item, index) => normalizeListeningMission(item, index)).filter(Boolean)
        : [];

      if (!loaded.length) return await loadFallback();
      missions.splice(0, missions.length, ...loaded);
      assignSessionVoiceRoutes();
      window.LISTENING_MISSIONS_SOURCE = result.source || "database";
      return true;
    } catch (error) {
      console.warn("Listening content API unavailable; using fallback.", error);
      return await loadFallback();
    }
  }

  function getToneFromGoal(goal) {
    const easyGoals = ["self-introduction", "family-friends", "daily-routine", "weather-seasons", "hobbies-free-time"];
    const mediumGoals = ["shopping-prices", "food-restaurant", "travel-directions", "study-school", "health-doctor"];
    const hardGoals = ["work-career", "news-society", "tech-internet"];
    if (easyGoals.includes(goal)) return "green";
    if (mediumGoals.includes(goal)) return "warm";
    if (hardGoals.includes(goal)) return "danger";
    return "green";
  }

  function normalizeListeningMission(item, index) {
    const payload = item?.payload && typeof item.payload === "object" ? item.payload : item;
    if (!payload || typeof payload !== "object") return null;

    const goal = payload.goal || item.goal || defaultGoal;
    const tone = getToneFromGoal(goal);

    const mission = {
      ...payload,
      id: item.key || payload.id,
      title: payload.title || item.title || item.key,
      goal: goal,
      level: payload.level || item.level || "B1",
      opening: payload.opening || payload.description || item.description || "",
      story: payload.story || payload.description || item.description || "",
      tone: tone,
      icon: payload.icon || "ti-headphone-alt"
    };

    if (!mission.id || !mission.title || !mission.transcript) return null;

    return mission.options?.length
      ? mission
      : createMissionFromSpec(mission, index + 1);
  }

  function cloneContentList(items) {
    try {
      return JSON.parse(JSON.stringify(items));
    } catch (error) {
      return items.map((item) => ({ ...item }));
    }
  }

  function createMissionFromSpec(spec, number) {
    const mission = { ...spec };
    const keywords = Array.isArray(mission.keywords) ? mission.keywords : [];
    const gapParts = mission.gapParts || createGapParts(mission.transcript, keywords);
    const phrases = mission.phrases || createPhraseTimeline(mission.transcript);
    const whyHard = mission.whyHard || createDefaultWhyHard(mission);

    return {
      ...mission,
      label: mission.label || `Session ${number}`,
      options: mission.options || [
        { key: "A", text: mission.correct, correct: true },
        { key: "B", text: mission.distractors[0], correct: false },
        { key: "C", text: mission.distractors[1], correct: false }
      ],
      gapParts,
      phrases,
      whyHard
    };
  }

  function createGapParts(transcript, keywords) {
    const answers = keywords
      .filter(Boolean)
      .filter((keyword) => transcript.toLowerCase().includes(String(keyword).toLowerCase()))
      .slice(-2);

    if (!answers.length) return [transcript];

    const parts = [];
    let cursor = 0;
    answers.forEach((answer) => {
      const lowerTranscript = transcript.toLowerCase();
      const lowerAnswer = String(answer).toLowerCase();
      const index = lowerTranscript.indexOf(lowerAnswer, cursor);
      if (index < 0) return;
      if (index > cursor) parts.push(transcript.slice(cursor, index));
      parts.push({ answer: transcript.slice(index, index + String(answer).length) });
      cursor = index + String(answer).length;
    });
    if (cursor < transcript.length) parts.push(transcript.slice(cursor));
    return parts.length ? parts : [transcript];
  }

  function createPhraseTimeline(transcript) {
    const clean = transcript.replace(/[?.!]$/g, "");
    const words = clean.split(/\s+/).filter(Boolean);
    const phrases = [];
    for (let index = 0; index < words.length; index += 4) {
      phrases.push(words.slice(index, index + 4).join(" "));
    }
    return phrases.filter(Boolean).slice(0, 4);
  }

  function createDefaultWhyHard(mission) {
    return [
      mission.connectedSpeech || "Câu có nối âm và dạng nói nhanh như hội thoại thật.",
      `"${mission.hardPart}" là đoạn cần loop riêng vì chứa thông tin quyết định đáp án.`,
      "Hãy nghe từ khóa nội dung trước, rồi mới mở transcript để kiểm tra chi tiết."
    ];
  }

  function stableHash(value) {
    const input = String(value || "");
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
      hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
    }
    return hash;
  }

  function assignSessionVoiceRoutes() {
    Object.keys(goalText).forEach((goal) => {
      const topicMissions = missions
        .filter((mission) => mission.goal === goal)
        .sort((a, b) => a.id.localeCompare(b.id));
      const startIndex = stableHash(goal) % voiceRoutes.length;

      topicMissions.forEach((mission, index) => {
        const route = voiceRoutes[(startIndex + index) % voiceRoutes.length];
        mission.accent = route.label;
        mission.voiceRoute = route;
      });
    });
  }

  window.initListeningLab = async function initListeningLab() {
    const page = document.querySelector(".audio-lab-page");
    if (!page) return;

    await loadListeningMissionsFromApi();

    const state = loadState();
    if (!goalText[state.goal]) state.goal = defaultGoal;
    const els = collectElements();
    let currentMission = null;
    let selectedMode = "natural";
    let listenCount = 0;
    let wrongOptionAttempted = false;
    let answerWasCorrect = false;
    let blankWrongAttempts = 0;
    let usedFullAnswer = false;
    let isPlaying = false;
    let timer = null;
    let remaining = 30;
    let missionSearch = "";
    const sessionShuffleSeed = `${Date.now()}-${Math.random()}`;
    let availableVoices = [];
    let noiseContext = null;
    let noiseSource = null;

    syncStickyOffset();
    generateWaveform();
    renderDashboard();
    bindDashboard();
    bindWorkspace();
    setupVoiceEngine();
    openInitialMissionFromHash();

    function collectElements() {
      return {
        dashboard: document.getElementById("lab-dashboard"),
        workspace: document.getElementById("lab-workspace"),
        missionGrid: document.querySelector("[data-mission-grid]"),
        missionSearch: document.querySelector("[data-mission-search]"),
        missionCount: document.querySelector("[data-mission-count]"),
        startFeatured: document.querySelector("[data-start-featured]"),
        dailyButtons: document.querySelectorAll("[data-daily-challenge]"),
        goalChips: document.querySelectorAll("[data-goal]"),
        openingScenario: document.querySelector("[data-opening-scenario]"),
        nativeScore: document.querySelector("[data-native-score]"),
        scoreRing: document.querySelector("[data-score-ring]"),
        listeningLevel: document.querySelector("[data-listening-level]"),
        streakCount: document.querySelector("[data-streak-count]"),
        weaknessSummary: document.querySelector("[data-weakness-summary]"),
        nextDrill: document.querySelector("[data-next-drill]"),
        mistakeBank: document.querySelector("[data-mistake-bank]"),
        backBtn: document.getElementById("back-to-map"),
        missionKicker: document.querySelector("[data-mission-kicker]"),
        missionTitle: document.querySelector("[data-mission-title]"),
        missionStory: document.querySelector("[data-mission-story]"),
        missionRole: document.querySelector("[data-mission-role]"),
        missionAccent: document.querySelector("[data-mission-accent]"),
        missionNoise: document.querySelector("[data-mission-noise]"),
        missionTarget: document.querySelector("[data-mission-target]"),
        challengeBox: document.querySelector("[data-challenge-box]"),
        challengeTimer: document.querySelector("[data-challenge-timer]"),
        sessionAudit: document.querySelector("[data-session-audit]"),
        layerSteps: document.querySelectorAll("[data-layer-step]"),
        listenCount: document.querySelector("[data-listen-count]"),
        currentMode: document.querySelector("[data-current-mode]"),
        audioNote: document.querySelector("[data-audio-note]"),
        stickySessionTitle: document.querySelector("[data-sticky-session-title]"),
        voiceRoute: document.querySelector("[data-voice-route]"),
        waveform: document.getElementById("waveform"),
        modeTabs: document.querySelectorAll("[data-mode]"),
        playBtn: document.getElementById("master-play"),
        replayHardBtn: document.getElementById("replay-hard"),
        questionTitle: document.querySelector("[data-question-title]"),
        questionContext: document.querySelector("[data-question-context]"),
        options: document.getElementById("roleplay-options"),
        answerFeedback: document.querySelector("[data-answer-feedback]"),
        stage2: document.getElementById("stage-2"),
        keywordHints: document.querySelector("[data-keyword-hints]"),
        dictation: document.querySelector("[data-dictation]"),
        revealLetterBtn: document.getElementById("reveal-letter"),
        playSlowerBtn: document.getElementById("play-slower"),
        showConnectedBtn: document.getElementById("show-connected"),
        showAnswerBtn: document.getElementById("show-answer"),
        checkBlanksBtn: document.getElementById("check-blanks"),
        connectedPanel: document.querySelector("[data-connected-panel]"),
        connectedSpeech: document.querySelector("[data-connected-speech]"),
        stage3: document.getElementById("stage-3"),
        transcript: document.querySelector("[data-transcript]"),
        nativeLine: document.querySelector("[data-native-line]"),
        phraseTimeline: document.querySelector("[data-phrase-timeline]"),
        whyHard: document.querySelector("[data-why-hard]"),
        missReason: document.querySelector("[data-miss-reason]"),
        finishBtn: document.getElementById("finish-mission"),
        resultPanel: document.querySelector("[data-result-panel]"),
        resultTitle: document.querySelector("[data-result-title]"),
        resultCopy: document.querySelector("[data-result-copy]"),
        earnedBadges: document.querySelector("[data-earned-badges]")
      };
    }

    function bindDashboard() {
      els.startFeatured.addEventListener("click", () => openMission(getRecommendedMission().id));

      els.dailyButtons.forEach((button) => {
        button.addEventListener("click", () => openMission(getRecommendedMission().id, { challenge: true }));
      });

      els.goalChips.forEach((chip) => {
        chip.addEventListener("click", () => {
          state.goal = chip.dataset.goal || "travel";
          saveState();
          renderDashboard();
        });
      });

      els.missionSearch?.addEventListener("input", () => {
        missionSearch = els.missionSearch.value.trim().toLowerCase();
        renderMissionGrid();
      });

      window.addEventListener("resize", syncStickyOffset);
    }

    function bindWorkspace() {
      els.backBtn.addEventListener("click", () => {
        stopSpeech();
        stopTimer();
        els.workspace.hidden = true;
        els.dashboard.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      els.modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          selectedMode = tab.dataset.mode || "natural";
          els.modeTabs.forEach((item) => item.classList.toggle("active", item === tab));
          updateModeStatus();
        });
      });

      els.playBtn.addEventListener("click", () => {
        if (!currentMission) return;
        if (isPlaying) {
          stopSpeech();
          return;
        }
        listenCount += 1;
        updateListenLayers();
        speak(getCurrentAudioText());
      });

      els.replayHardBtn.addEventListener("click", () => currentMission && speak(currentMission.hardPart, false));
      els.playSlowerBtn.addEventListener("click", () => currentMission && speak(currentMission.transcript, false, "slow"));
      els.revealLetterBtn.addEventListener("click", revealFirstLetter);
      els.showConnectedBtn.addEventListener("click", () => { els.connectedPanel.hidden = false; });
      els.showAnswerBtn.addEventListener("click", showFullAnswer);
      els.checkBlanksBtn.addEventListener("click", checkDictation);
      els.finishBtn.addEventListener("click", finishMission);
    }

    function setupVoiceEngine() {
      if (!("speechSynthesis" in window)) {
        updateVoiceStatus();
        return;
      }

      const refreshVoices = () => {
        availableVoices = window.speechSynthesis.getVoices().filter((voice) => voice.lang?.startsWith("en"));
        updateVoiceStatus();
      };

      refreshVoices();
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }

    function updateVoiceStatus() {
      if (!els.voiceRoute) return;
      const route = getMissionVoiceRoute(currentMission);

      if (!("speechSynthesis" in window)) {
        els.voiceRoute.textContent = "Browser không hỗ trợ auto voice";
        els.voiceRoute.title = "";
        return;
      }

      const selected = pickVoice(route.lang, currentMission);
      els.voiceRoute.textContent = `${route.label} voice`;
      els.voiceRoute.title = selected ? `${selected.name} (${selected.lang})` : `${route.label} (${route.lang})`;
    }

    function renderDashboard() {
      els.goalChips.forEach((chip) => chip.classList.toggle("active", chip.dataset.goal === state.goal));

      const score = Math.round(state.nativeScore || 72);
      els.nativeScore.textContent = `${score}%`;
      els.scoreRing.setAttribute("stroke-dasharray", `${score}, 100`);
      els.listeningLevel.textContent = getLevelName(score);
      els.streakCount.textContent = `Streak ${state.streak || 3} ngày`;

      const topMistake = getTopMistake();
      els.weaknessSummary.textContent = `Hay miss: ${mistakeLabels[topMistake] || "nối âm"}`;
      els.nextDrill.textContent = getDrillSuggestion(topMistake);
      els.openingScenario.textContent = getGoalScenario(state.goal);

      renderMissionGrid();
      renderMistakeBank();
    }

    function syncStickyOffset() {
      const header = document.querySelector(".site-header");
      const headerBottom = header ? Math.ceil(header.getBoundingClientRect().bottom) : 77;
      page.style.setProperty("--listening-sticky-top", `${Math.max(headerBottom, 0)}px`);
    }

    function renderMissionGrid() {
      const visibleMissions = getVisibleMissions();
      els.missionCount.textContent = `${visibleMissions.length}/${missions.length} sessions`;

      if (!visibleMissions.length) {
        els.missionGrid.innerHTML = `
          <div class="mission-empty">
            <strong>Không tìm thấy session phù hợp.</strong>
            <span>Thử đổi mục tiêu hoặc xóa từ khóa tìm kiếm.</span>
          </div>
        `;
        return;
      }

      els.missionGrid.innerHTML = visibleMissions.map((mission) => {
        const completed = state.completed.includes(mission.id);
        const score = state.scores[mission.id] || 0;
        const recommended = mission.goal === state.goal;
        const progressLabel = completed ? `${score}% completed` : "Ready";

        return `
          <button class="mission-card ${recommended ? "active" : ""}" type="button" data-mission="${escapeAttr(mission.id)}" data-tone="${escapeAttr(mission.tone)}">
            <span class="mission-icon ${escapeAttr(mission.icon)}" aria-hidden="true"></span>
            <span class="mission-info">
              <h3>${escapeHtml(getTopicSessionLabel(mission))}: ${escapeHtml(mission.title)}</h3>
              <p>${escapeHtml(mission.opening)}</p>
              <span class="mission-tags">
                <span>${escapeHtml(mission.level)}</span>
                <span>${escapeHtml(mission.accent)}</span>
                <span>${escapeHtml(goalText[mission.goal])}</span>
                ${recommended ? "<span>Recommended</span>" : ""}
              </span>
              <span class="mission-progress">
                <span>${escapeHtml(progressLabel)}</span>
                <span class="progress-track"><i style="width: ${completed ? score : 0}%"></i></span>
              </span>
            </span>
          </button>
        `;
      }).join("");

      els.missionGrid.querySelectorAll("[data-mission]").forEach((card) => {
        card.addEventListener("click", () => {
          const mission = missions.find((item) => item.id === card.dataset.mission);
          if (!mission) return;
          openMission(mission.id);
        });
      });
    }

    function renderMistakeBank() {
      els.mistakeBank.innerHTML = Object.entries(state.mistakes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, count]) => `<li><span>${escapeHtml(mistakeLabels[key] || key)}</span><strong>${count} lần</strong></li>`)
        .join("");
    }

    function getVisibleMissions() {
      return missions.filter((mission) => {
        const matchesGoal = mission.goal === state.goal;
        if (!matchesGoal) return false;
        if (!missionSearch) return true;

        const searchTarget = [
          mission.title,
          mission.opening,
          mission.accent,
          mission.noise,
          mission.level,
          mission.transcript,
          mission.keywords.join(" ")
        ].join(" ").toLowerCase();

        return searchTarget.includes(missionSearch);
      }).sort((a, b) => getSessionRank(a.id, a.goal) - getSessionRank(b.id, b.goal));
    }

    function getSessionRank(id, goal = state.goal) {
      const input = `${sessionShuffleSeed}:${goal}:${id}`;
      let hash = 0;
      for (let index = 0; index < input.length; index += 1) {
        hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
      }
      return hash;
    }

    function getTopicSessions(goal) {
      return missions
        .filter((mission) => mission.goal === goal)
        .sort((a, b) => getSessionRank(a.id, goal) - getSessionRank(b.id, goal));
    }

    function getTopicSessionLabel(mission) {
      const topicSessions = getTopicSessions(mission.goal);
      const index = topicSessions.findIndex((item) => item.id === mission.id);
      return `Session ${index >= 0 ? index + 1 : 1}`;
    }

    function openMission(id, options = {}) {
      const mission = missions.find((item) => item.id === id) || missions[0];
      currentMission = mission;
      selectedMode = "natural";
      listenCount = 0;
      wrongOptionAttempted = false;
      answerWasCorrect = false;
      blankWrongAttempts = 0;
      usedFullAnswer = false;

      stopSpeech();
      stopTimer();
      populateMission(mission);
      renderOptions(mission);
      renderKeywordHints(mission);
      renderDictation(mission);
      renderBreakdown(mission);
      resetStages();
      resetModeTabs();
      updateListenLayers();
      updateModeStatus();

      els.dashboard.hidden = true;
      els.workspace.hidden = false;
      els.resultPanel.hidden = true;

      if (options.challenge) startTimer();
      else els.challengeBox.hidden = true;

      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openInitialMissionFromHash() {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const missionId = params.get("mission");
      if (!missionId || !missions.some((mission) => mission.id === missionId)) return;
      window.requestAnimationFrame(() => openMission(missionId));
    }

    function populateMission(mission) {
      els.missionKicker.textContent = `${goalText[mission.goal]} · ${getTopicSessionLabel(mission)}`;
      els.missionTitle.textContent = mission.title;
      els.stickySessionTitle.textContent = `${getTopicSessionLabel(mission)} · ${mission.title}`;
      els.missionStory.textContent = mission.story;
      els.missionRole.textContent = mission.role;
      els.missionAccent.textContent = mission.accent;
      els.missionNoise.textContent = mission.noise;
      els.missionTarget.textContent = mission.target;
      els.questionTitle.textContent = mission.questionTitle;
      els.questionContext.textContent = mission.context;
      els.connectedSpeech.textContent = mission.connectedSpeech;
      els.transcript.textContent = `"${mission.transcript}"`;
      els.nativeLine.textContent = mission.nativeLine;
      els.missReason.textContent = mission.missReason;
      els.answerFeedback.textContent = "";
      updateVoiceStatus();
      renderSessionAudit();
    }

    function renderSessionAudit() {
      if (!currentMission || !els.sessionAudit) return;
      const hasTts = "speechSynthesis" in window;
      const route = getMissionVoiceRoute(currentMission);
      const checks = [
        { label: "Session data", ok: Boolean(currentMission.transcript && currentMission.options?.length === 3) },
        { label: `${route.label} voice`, ok: hasTts },
        { label: "Progress save", ok: storageAvailable() },
        { label: "Unlock flow", ok: Boolean(currentMission.gapParts?.length && currentMission.whyHard?.length) }
      ];

      els.sessionAudit.innerHTML = `
        <h3>Session quality check</h3>
        <ul>
          ${checks.map((check) => `<li class="${check.ok ? "ok" : "warn"}"><span>${check.ok ? "OK" : "!"}</span>${escapeHtml(check.label)}</li>`).join("")}
        </ul>
        <p>${hasTts ? `Auto voice route: ${escapeHtml(route.label)} (${escapeHtml(route.lang)})` : "Browser này không hỗ trợ Web Speech API."}</p>
      `;
    }

    function renderOptions(mission) {
      els.options.innerHTML = mission.options.map((option) => `
        <button class="roleplay-btn" type="button" data-correct="${option.correct}">
          <span class="option-key">${escapeHtml(option.key)}</span>
          <span>${escapeHtml(option.text)}</span>
        </button>
      `).join("");

      els.options.querySelectorAll(".roleplay-btn").forEach((button) => {
        button.addEventListener("click", () => handleOption(button));
      });
    }

    function renderKeywordHints(mission) {
      els.keywordHints.innerHTML = mission.keywords.map((keyword) => `<span>${escapeHtml(maskKeyword(keyword))}</span>`).join("");
      els.keywordHints.classList.add("is-hidden");
    }

    function renderDictation(mission) {
      els.dictation.innerHTML = "";
      mission.gapParts.forEach((part) => {
        if (typeof part === "string") {
          els.dictation.appendChild(document.createTextNode(part));
          return;
        }

        const input = document.createElement("input");
        input.type = "text";
        input.dataset.answer = part.answer;
        input.disabled = true;
        input.setAttribute("aria-label", `Điền: ${part.answer}`);
        input.addEventListener("keyup", (event) => {
          if (event.key === "Enter") els.checkBlanksBtn.click();
        });
        els.dictation.appendChild(input);
      });
    }

    function renderBreakdown(mission) {
      els.whyHard.innerHTML = mission.whyHard.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      els.phraseTimeline.innerHTML = mission.phrases.map((phrase) => `
        <button class="phrase-chip" type="button" data-phrase="${escapeAttr(phrase)}"><span class="ti-control-play"></span>${escapeHtml(phrase)}</button>
      `).join("");

      els.phraseTimeline.querySelectorAll("[data-phrase]").forEach((button) => {
        button.addEventListener("click", () => speak(button.dataset.phrase, false));
      });
    }

    function resetStages() {
      els.stage2.classList.add("stage-locked");
      els.stage3.classList.add("stage-locked");
      els.finishBtn.disabled = true;
      els.connectedPanel.hidden = true;
      setDictationControls(false);
      els.options.querySelectorAll(".roleplay-btn").forEach((button) => {
        button.disabled = false;
        button.classList.remove("correct", "wrong");
      });
      const medium = document.querySelector('input[name="confidence"][value="medium"]');
      if (medium) medium.checked = true;
    }

    function resetModeTabs() {
      selectedMode = "natural";
      els.modeTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === "natural"));
    }

    function updateModeStatus() {
      const mode = modes[selectedMode] || modes.natural;
      els.currentMode.textContent = mode.label;
      els.audioNote.textContent = mode.note;
      updateVoiceStatus();
    }

    function updateListenLayers() {
      const capped = Math.min(listenCount, 3);
      els.listenCount.textContent = capped;

      els.layerSteps.forEach((step) => {
        const index = Number(step.dataset.layerStep);
        step.classList.toggle("done", capped >= index);
        step.classList.toggle("active", capped + 1 === index || (capped === 3 && index === 3));
      });

      if (listenCount >= 2) {
        els.stage2.classList.remove("stage-locked");
        els.keywordHints.classList.remove("is-hidden");
      }

      setDictationControls(listenCount >= 3);

      if (listenCount === 1) els.answerFeedback.textContent = "Lần 1: cố đoán ý chính trước, chưa cần transcript.";
      if (listenCount === 2) els.answerFeedback.textContent = "Lần 2: từ khóa đã mở. Hãy nghe xem câu đang hỏi điều gì.";
      if (listenCount >= 3) els.answerFeedback.textContent = "Lần 3: gap transcript đã mở. Điền chỗ trống trước khi xem breakdown.";
    }

    function setDictationControls(enabled) {
      [els.revealLetterBtn, els.playSlowerBtn, els.showConnectedBtn, els.showAnswerBtn, els.checkBlanksBtn].forEach((button) => {
        button.disabled = !enabled;
      });
      getBlankInputs().forEach((input) => {
        input.disabled = !enabled;
        if (!enabled) {
          input.value = "";
          input.classList.remove("correct", "wrong");
        }
      });
    }

    function handleOption(button) {
      const correct = button.dataset.correct === "true";
      els.options.querySelectorAll(".roleplay-btn").forEach((item) => item.classList.remove("correct", "wrong"));

      if (correct) {
        answerWasCorrect = true;
        button.classList.add("correct");
        els.answerFeedback.textContent = "Đúng ngữ cảnh. Tiếp tục nghe lần 2 và lần 3 để bóc tách âm thanh.";
        return;
      }

      wrongOptionAttempted = true;
      answerWasCorrect = false;
      button.classList.add("wrong");
      addMistakes(currentMission.mistakes, 1);
      els.answerFeedback.textContent = `Bạn có thể đã miss phần khó: ${currentMission.missReason}`;
      saveState();
      renderDashboard();
    }

    function checkDictation() {
      let allCorrect = true;
      getBlankInputs().forEach((input) => {
        const isCorrect = normalize(input.value) === normalize(input.dataset.answer);
        input.classList.toggle("correct", isCorrect);
        input.classList.toggle("wrong", !isCorrect);
        if (!isCorrect) allCorrect = false;
      });

      if (allCorrect) {
        els.answerFeedback.textContent = "Dictation đúng. Breakdown đã mở để xem vì sao câu này khó nghe.";
        unlockStage3();
        return;
      }

      blankWrongAttempts += 1;
      addMistakes(currentMission.mistakes, 1);
      saveState();
      renderDashboard();
      els.answerFeedback.textContent = "Chưa đúng. Hãy dùng Replay hard part hoặc Show connected speech trước khi hiện đáp án.";
    }

    function revealFirstLetter() {
      const target = getBlankInputs().find((input) => normalize(input.value) !== normalize(input.dataset.answer));
      if (!target) return;
      target.value = target.dataset.answer.charAt(0);
      target.focus();
    }

    function showFullAnswer() {
      usedFullAnswer = true;
      getBlankInputs().forEach((input) => {
        input.value = input.dataset.answer;
        input.classList.add("correct");
        input.classList.remove("wrong");
      });
      unlockStage3();
    }

    function unlockStage3() {
      els.stage3.classList.remove("stage-locked");
      els.finishBtn.disabled = false;
      els.connectedPanel.hidden = false;
    }

    function finishMission() {
      const confidence = document.querySelector('input[name="confidence"]:checked')?.value || "medium";
      let score = currentMission.baseScore;

      if (answerWasCorrect && !wrongOptionAttempted) score += 8;
      if (wrongOptionAttempted) score -= 8;
      if (blankWrongAttempts === 0 && !usedFullAnswer) score += 8;
      if (blankWrongAttempts > 0) score -= Math.min(10, blankWrongAttempts * 4);
      if (usedFullAnswer) score -= 6;
      if (selectedMode === "native") score += 3;
      if (selectedMode === "chaos") score += 4;
      if (confidence === "high" && wrongOptionAttempted) score -= 4;
      if (confidence === "low" && answerWasCorrect) score += 2;
      score = clamp(Math.round(score), 48, 96);

      state.completed = unique([...state.completed, currentMission.id]);
      state.scores[currentMission.id] = Math.max(state.scores[currentMission.id] || 0, score);
      state.nativeScore = computeNativeScore(state.scores);
      state.xp = (state.xp || 120) + 40;
      state.streak = Math.max(state.streak || 3, 3);
      saveState();

      els.resultTitle.textContent = `Bạn hiểu được ${score}% session "${currentMission.title}" ở ${modes[selectedMode].label}.`;
      els.resultCopy.textContent = score >= 85
        ? "Bạn đã đủ điều kiện mở các session khó hơn ở Native Mode."
        : `Mục tiêu tiếp theo: đạt 85%. Gợi ý luyện tiếp: ${getDrillSuggestion(getTopMistake())}`;
      els.earnedBadges.innerHTML = [currentMission.badge, "+40 XP", getLevelBadge(score)]
        .map((badge) => `<span>${escapeHtml(badge)}</span>`)
        .join("");
      els.resultPanel.hidden = false;
      els.finishBtn.disabled = true;
      stopTimer();
      renderDashboard();
    }

    function getCurrentAudioText() {
      const mode = modes[selectedMode] || modes.natural;
      return mode.native ? currentMission.nativeLine : currentMission.transcript;
    }

    function speak(text, countListen = false, modeOverride = null) {
      const mode = modes[modeOverride || selectedMode] || modes.natural;
      if (countListen) listenCount += 1;
      stopSpeech();
      isPlaying = true;
      els.waveform.classList.add("playing");
      els.playBtn.innerHTML = '<span class="ti-control-pause"></span> Stop audio';
      els.currentMode.textContent = `Speaking · ${modes[modeOverride || selectedMode]?.label || "Audio"}`;

      if (mode.noise) startNoise();

      if (!("speechSynthesis" in window)) {
        window.setTimeout(stopSpeech, Math.max(1200, text.split(/\s+/).length * 260));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getMissionVoiceRoute(currentMission).lang;
      utterance.rate = mode.rate;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voice = pickVoice(utterance.lang, currentMission);
      if (voice) utterance.voice = voice;
      utterance.onend = stopSpeech;
      utterance.onerror = stopSpeech;
      window.speechSynthesis.speak(utterance);
    }

    function stopSpeech() {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      stopNoise();
      isPlaying = false;
      els.waveform?.classList.remove("playing");
      if (els.playBtn) els.playBtn.innerHTML = '<span class="ti-control-play"></span> Play session audio';
      updateModeStatus();
    }

    function startNoise() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        noiseContext = noiseContext || new AudioContext();
        if (noiseContext.state === "suspended") noiseContext.resume();
        const buffer = noiseContext.createBuffer(1, noiseContext.sampleRate * 2, noiseContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let index = 0; index < output.length; index += 1) output[index] = (Math.random() * 2 - 1) * 0.08;
        const source = noiseContext.createBufferSource();
        const gain = noiseContext.createGain();
        gain.gain.value = 0.08;
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain).connect(noiseContext.destination);
        source.start();
        noiseSource = source;
      } catch (error) {
        noiseSource = null;
      }
    }

    function stopNoise() {
      if (!noiseSource) return;
      try {
        noiseSource.stop();
        noiseSource.disconnect();
      } catch (error) {
        // The node may already be stopped by the browser.
      }
      noiseSource = null;
    }

    function startTimer() {
      els.challengeBox.hidden = false;
      remaining = 30;
      els.challengeTimer.textContent = `${remaining}s`;
      timer = window.setInterval(() => {
        remaining -= 1;
        els.challengeTimer.textContent = `${remaining}s`;
        if (remaining <= 0) {
          stopTimer();
          els.answerFeedback.textContent = "Hết 30 giây. Hãy hoàn thành câu đang nghe để nhận điểm Quick Listen.";
        }
      }, 1000);
    }

    function stopTimer() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    function generateWaveform() {
      if (!els.waveform || els.waveform.children.length) return;
      [28, 52, 34, 70, 42, 64, 36, 78, 48, 58, 30, 66, 74, 40, 56, 34, 82, 46, 62, 38, 72, 52, 36, 68, 44, 76, 32, 58, 84, 48, 60, 40, 70, 54, 36, 64].forEach((height, index) => {
        const bar = document.createElement("span");
        bar.className = "wave-bar";
        bar.style.height = `${height}%`;
        bar.style.animationDelay = `${(index % 8) * 0.06}s`;
        els.waveform.appendChild(bar);
      });
    }

    function getBlankInputs() {
      return Array.from(els.dictation.querySelectorAll("input"));
    }

    function addMistakes(keys, amount) {
      keys.forEach((key) => {
        state.mistakes[key] = (state.mistakes[key] || 0) + amount;
      });
    }

    function getTopMistake() {
      return Object.entries(state.mistakes).sort((a, b) => b[1] - a[1])[0]?.[0] || "connected";
    }

    function getRecommendedMission() {
      return missions.find((mission) => mission.goal === state.goal) || missions[0];
    }

    function getGoalScenario(goal) {
      return (missions.find((mission) => mission.goal === goal) || missions[0]).opening;
    }

    function getLevelName(score) {
      if (score >= 88) return "Level 5: Native Speed Survivor";
      if (score >= 78) return "Level 4: Real-life Listener";
      if (score >= 68) return "Level 3: Sentence Decoder";
      if (score >= 58) return "Level 2: Phrase Hunter";
      return "Level 1: Word Catcher";
    }

    function getLevelBadge(score) {
      if (score >= 88) return "Native Speed Survivor";
      if (score >= 78) return "Real-life Listener";
      if (score >= 68) return "Sentence Decoder";
      if (score >= 58) return "Phrase Hunter";
      return "Word Catcher";
    }

    function getDrillSuggestion(key) {
      return {
        connected: "Luyện 5 phút với did you -> didja, want to -> wanna, let me -> lemme.",
        ending: "Luyện âm cuối /t/, /d/, /s/ bằng cách loop từng cụm ngắn.",
        fast: "Nghe Natural Mode trước, sau đó tăng lên Native Mode và replay hard part.",
        reduced: "Tập nhận diện dạng nói thật: gonna, wanna, shoulda, kinda.",
        numbers: "Luyện cặp fifteen/fifty, thirteen/thirty và giờ hẹn trong voicemail.",
        accent: "Nghe cùng một câu bằng American, British và Australian accent.",
        noise: "Bật Chaos Mode ở âm lượng thấp rồi tăng dần độ khó.",
        emotion: "Luyện Movie Mode: nghe pitch, ngữ cảnh và câu sau để đoán ý ngầm."
      }[key] || "Luyện 5 phút với did you -> didja, want to -> wanna, let me -> lemme.";
    }

    function loadState() {
      const fallback = {
        nativeScore: 72,
        streak: 3,
        xp: 120,
        goal: defaultGoal,
        completed: [],
        scores: {},
        mistakes: { connected: 3, ending: 2, fast: 2, numbers: 1, noise: 1 }
      };

      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!parsed) return fallback;
        return {
          ...fallback,
          ...parsed,
          completed: Array.isArray(parsed.completed) ? parsed.completed : [],
          scores: parsed.scores || {},
          mistakes: { ...fallback.mistakes, ...(parsed.mistakes || {}) }
        };
      } catch (error) {
        return fallback;
      }
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function storageAvailable() {
      try {
        localStorage.setItem(`${STORAGE_KEY}Check`, "1");
        localStorage.removeItem(`${STORAGE_KEY}Check`);
        return true;
      } catch (error) {
        return false;
      }
    }

    function computeNativeScore(scores) {
      const values = Object.values(scores).map(Number);
      if (!values.length) return 72;
      return Math.round(clamp(values.reduce((sum, value) => sum + value, 0) / values.length, 52, 96));
    }

    function pickVoice(lang, mission = currentMission) {
      const route = getMissionVoiceRoute(mission);
      const voices = availableVoices.length ? availableVoices : (window.speechSynthesis?.getVoices?.() || []);
      return pickVoiceFromPool(voices.filter((voice) => voice.lang === lang), mission?.id)
        || pickVoiceFromPool(voices.filter((voice) => voice.lang === route.fallbackLang), mission?.id)
        || pickVoiceFromPool(voices.filter((voice) => voice.lang?.startsWith(lang.slice(0, 2))), mission?.id)
        || pickVoiceFromPool(voices.filter((voice) => voice.lang?.startsWith("en")), mission?.id);
    }

    function pickVoiceFromPool(voices, seed) {
      if (!voices.length) return null;
      return voices[stableHash(seed || currentMission?.id || "voice") % voices.length];
    }

    function getMissionVoiceRoute(mission) {
      return mission?.voiceRoute
        || voiceRoutes.find((route) => route.label === mission?.accent)
        || voiceRoutes[0];
    }

    function maskKeyword(keyword) {
      if (keyword.length <= 4) return `${keyword.charAt(0)}__`;
      return `${keyword.slice(0, 2)}${"_".repeat(Math.min(5, keyword.length - 2))}`;
    }

    function normalize(value) {
      return String(value || "").trim().toLowerCase().replace(/[.,!?']/g, "").replace(/\s+/g, " ");
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function unique(values) {
      return Array.from(new Set(values));
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

    function escapeAttr(value) {
      return escapeHtml(value).replace(/`/g, "&#096;");
    }
  };
})();
