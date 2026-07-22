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
      const primary = (window.LISTENING_LAB_MISSIONS || []).map((spec, index) => createMissionFromSpec(spec, spec.sessionOrder || index + 1));
      const seenIds = new Set(primary.map((m) => m.id).filter(Boolean));
      
      const expansionItems = [...(window.LISTENING_LAB_MISSION_EXPANSIONS || []), ...(window.LISTENING_LAB_SUPPLEMENTAL_EXPANSIONS || [])];
      const filteredExpansions = expansionItems
        .filter((spec) => spec && spec.id && !seenIds.has(spec.id))
        .map((spec, index) => createMissionFromSpec(spec, primary.length + index + 1));

      missions.splice(0, missions.length, ...primary, ...filteredExpansions);
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
    let currentHintPercent = 0;
    let lastRenderedMissionId = null;

    syncStickyOffset();
    generateWaveform();
    renderDashboard();
    bindDashboard();
    bindWorkspace();
    setupVoiceEngine();
    openInitialMissionFromHash();
    fetchProgressFromDatabase();

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
        stage2: document.getElementById("stage-panel-2") || document.getElementById("stage-2"),
        keywordHints: document.getElementById("breakdown-keywords") || document.querySelector("[data-keyword-hints]"),
        dictation: document.querySelector("[data-dictation]"),
        revealLetterBtn: document.getElementById("reveal-letter"),
        reveal2WordsBtn: document.getElementById("reveal-2-words"),
        reveal3WordsBtn: document.getElementById("reveal-3-words"),
        playSlowerBtn: document.getElementById("play-slower"),
        showConnectedBtn: document.getElementById("show-connected"),
        showAnswerBtn: document.getElementById("show-answer"),
        checkBlanksBtn: document.getElementById("check-dictation-btn") || document.getElementById("check-blanks"),
        connectedPanel: document.querySelector("[data-connected-panel]"),
        connectedSpeech: document.querySelector("[data-connected-speech]"),
        stage3: document.getElementById("stage-panel-3") || document.getElementById("stage-3"),
        transcript: document.querySelector("[data-transcript]"),
        nativeLine: document.querySelector("[data-native-line]"),
        translationText: document.querySelector("[data-translation-text]"),
        phraseTimeline: document.querySelector("[data-phrase-timeline]"),
        whyHard: document.querySelector("[data-why-hard]"),
        missReason: document.querySelector("[data-miss-reason]"),
        finishBtn: document.getElementById("finish-mission"),
        resultPanel: document.getElementById("completion-panel") || document.querySelector("[data-result-panel]"),
        resultTitle: document.querySelector("[data-result-title]"),
        resultCopy: document.querySelector("[data-result-copy]"),
        earnedBadges: document.querySelector("[data-earned-badges]"),
        activeTopicName: document.getElementById("active-topic-name"),
        sidebarSubtitle: document.getElementById("sidebar-subtitle"),
        sidebarSessionList: document.getElementById("sidebar-session-list"),
        toolbarStatusText: document.getElementById("toolbar-status-text"),
        miniIndexText: document.getElementById("mini-index-text"),
        studyProgressText: document.getElementById("study-progress-text"),
        workspaceTabs: document.querySelectorAll(".workspace-tab"),
        hintLevelBtns: document.querySelectorAll(".toolbar-hints .hint-btn"),
        playbackSpeedBtns: document.querySelectorAll(".playback-speed-selector .playback-speed-btn"),
        resetDictationBtn: document.getElementById("reset-dictation-btn"),
        stage1: document.getElementById("stage-panel-1"),
        stage2: document.getElementById("stage-panel-2"),
        stage3: document.getElementById("stage-panel-3")
      };
    }

    function bindDashboard() {
      els.startFeatured?.addEventListener("click", () => openMission(getRecommendedMission().id));

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

      // Bind Mode Tabs: "Chủ đề", "Toeic", "Tiến độ"
      const listeningModeTabs = document.querySelectorAll("[data-listening-mode]");
      const studyView = document.querySelector("[data-listening-study-view]");
      const toeicView = document.querySelector("[data-listening-toeic-view]");
      const progressView = document.querySelector("[data-listening-progress-view]");

      const heroBanner = document.querySelector(".command-hero");

      listeningModeTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const mode = tab.dataset.listeningMode;
          listeningModeTabs.forEach((t) => t.classList.toggle("is-active", t === tab));

          if (heroBanner) heroBanner.hidden = mode !== "study";
          if (studyView) studyView.hidden = mode !== "study";
          if (toeicView) toeicView.hidden = mode !== "toeic";
          if (progressView) progressView.hidden = mode !== "progress";

          if (mode === "progress") {
            renderDashboard();
          } else if (mode === "toeic") {
            renderToeicMissionGrid();
          } else {
            renderDashboard();
          }
        });
      });

      bindToeicEvents();

      els.missionSearch?.addEventListener("input", () => {
        missionSearch = els.missionSearch.value.trim().toLowerCase();
        renderMissionGrid();
      });

      window.addEventListener("resize", syncStickyOffset);
    }

    function switchWorkspaceTab(stage) {
      if (els.workspaceTabs) {
        els.workspaceTabs.forEach((tab) => {
          tab.classList.toggle("is-active", tab.dataset.workspaceStage === String(stage));
          if (tab.dataset.workspaceStage === "1") {
            tab.style.display = currentToeicTest ? "none" : "";
          }
        });
      }
      if (els.stage1) els.stage1.hidden = String(stage) !== "1";
      if (els.stage2) els.stage2.hidden = String(stage) !== "2";
      if (els.stage3) {
        els.stage3.hidden = String(stage) !== "3";
        if (String(stage) === "3") {
          const studyBreakdown = document.getElementById("study-breakdown-container");
          const toeicFull = document.getElementById("toeic-full-listening");
          if (currentToeicTest) {
             if (studyBreakdown) studyBreakdown.hidden = true;
             if (toeicFull) {
                toeicFull.hidden = false;
                renderToeicFullScript();
             }
          } else {
             if (studyBreakdown) studyBreakdown.hidden = false;
             if (toeicFull) toeicFull.hidden = true;
          }
        }
      }
    }

    function scrollToMissionMap() {
      window.requestAnimationFrame(() => {
        const missionMap = document.querySelector(".mission-map") || document.querySelector(".goal-selector") || els.dashboard;
        if (missionMap) {
          const headerHeight = document.querySelector(".site-header")?.offsetHeight || 70;
          const targetY = missionMap.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
          window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }

    function bindWorkspace() {
      els.backBtn.addEventListener("click", () => {
        stopSpeech();
        stopTimer();
        els.workspace.hidden = true;
        
        const modeSwitch = document.querySelector(".listening-mode-switch");
        if (modeSwitch) modeSwitch.hidden = false;

        const activeTab = document.querySelector(".listening-mode-tab.is-active")?.dataset.listeningMode;
        const toeicView = document.querySelector("[data-listening-toeic-view]");
        const progressView = document.querySelector("[data-listening-progress-view]");

        const heroBanner = document.querySelector(".command-hero");
        if (heroBanner) heroBanner.hidden = (activeTab !== "study");

        const mainDashboard = document.querySelector(".lab-dashboard-grid");

        if (activeTab === "toeic" && toeicView) {
          if (els.dashboard) els.dashboard.hidden = false;
          if (mainDashboard) mainDashboard.hidden = true;
          toeicView.hidden = false;
          if (progressView) progressView.hidden = true;
        } else if (activeTab === "progress" && progressView) {
          if (els.dashboard) els.dashboard.hidden = false;
          if (mainDashboard) mainDashboard.hidden = true;
          progressView.hidden = false;
          if (toeicView) toeicView.hidden = true;
        } else {
          if (els.dashboard) els.dashboard.hidden = false;
          if (mainDashboard) mainDashboard.hidden = false;
          if (toeicView) toeicView.hidden = true;
          if (progressView) progressView.hidden = true;
        }

        document.body.classList.remove("workspace-active");
        scrollToMissionMap();
      });

      if (els.workspaceTabs) {
        els.workspaceTabs.forEach((tab) => {
          tab.addEventListener("click", () => switchWorkspaceTab(tab.dataset.workspaceStage));
        });
      }

      if (els.hintLevelBtns) {
        els.hintLevelBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            els.hintLevelBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            applyDictationHint(parseInt(btn.dataset.hint, 10));
          });
        });
      }

      if (els.playbackSpeedBtns) {
        els.playbackSpeedBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            els.playbackSpeedBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentPlaybackSpeed = parseFloat(btn.dataset.speed) || 1.0;
          });
        });
      }

      els.modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          selectedMode = tab.dataset.mode || "natural";
          els.modeTabs.forEach((item) => item.classList.toggle("active", item === tab));
          updateModeStatus();
        });
      });

      els.playBtn.addEventListener("click", () => {
        if (isPlaying) {
          stopSpeech();
          return;
        }
        
        if (currentToeicTest && els.stage3 && !els.stage3.hidden) {
          playToeicFullAudio();
          return;
        }

        if (!currentMission) return;
        listenCount += 1;
        updateListenLayers();
        speak(getCurrentAudioText());
      });

      els.replayHardBtn?.addEventListener("click", () => currentMission && speak(currentMission.hardPart, false));
      els.playSlowerBtn?.addEventListener("click", () => currentMission && speak(currentMission.transcript, false, "slow"));
      els.revealLetterBtn?.addEventListener("click", () => revealWords(1));
      els.reveal2WordsBtn?.addEventListener("click", () => revealWords(2));
      els.reveal3WordsBtn?.addEventListener("click", () => revealWords(3));
      els.showConnectedBtn?.addEventListener("click", toggleConnectedPanel);
      els.showAnswerBtn?.addEventListener("click", showFullAnswer);
      els.resetDictationBtn?.addEventListener("click", resetDictationInputs);
      els.checkBlanksBtn?.addEventListener("click", checkDictation);
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

      // Calculate REAL user metrics from state & API sync
      const validCompletedMissions = missions.filter((m) => (state.scores[m.id] || (state.completed.includes(m.id) ? 85 : 0)) >= 70);
      const totalCompletedCount = validCompletedMissions.length;
      const totalMissionsCount = missions.length || 78;
      const completionPercentage = Math.round((totalCompletedCount / totalMissionsCount) * 100);

      // Real average score computed dynamically from state & database records
      const scoredMissions = missions.filter((m) => typeof state.scores[m.id] === "number" && state.scores[m.id] > 0);
      const avgScore = scoredMissions.length > 0
        ? Math.round(scoredMissions.reduce((sum, m) => sum + state.scores[m.id], 0) / scoredMissions.length)
        : (totalCompletedCount > 0 ? 85 : 0);

      // Update Circle Ring & Overall Progress Score
      const progressScoreEl = document.querySelector("[data-listening-progress-score]");
      if (progressScoreEl) progressScoreEl.textContent = `${completionPercentage}%`;

      const progressBarEl = document.querySelector("[data-listening-progress-bar]");
      if (progressBarEl) progressBarEl.style.width = `${completionPercentage}%`;

      const progressSummaryEl = document.querySelector("[data-listening-progress-summary]");
      if (progressSummaryEl) {
        progressSummaryEl.textContent = totalCompletedCount > 0
          ? `Bạn đã hoàn thành ${totalCompletedCount}/${totalMissionsCount} session luyện nghe (đạt ≥ 70% điểm) với độ chính xác trung bình ${avgScore}%.`
          : `Bạn chưa hoàn thành session nào. Hãy chọn một chủ đề bên trên và bắt đầu luyện nghe!`;
      }

      // Inside circle ring text shows total completed count vs overall (e.g. 9/78)
      if (els.nativeScore) els.nativeScore.textContent = `${totalCompletedCount}/${totalMissionsCount}`;
      if (els.scoreRing) els.scoreRing.setAttribute("stroke-dasharray", `${completionPercentage}, 100`);

      // Accuracy Metric
      const accuracyEl = document.querySelector("[data-listening-accuracy]");
      if (accuracyEl) accuracyEl.textContent = `${avgScore}%`;

      // Streak
      if (els.streakCount) els.streakCount.textContent = `${state.streak || 1} ngày`;

      // Session Completed Ratio
      const ratioEl = document.querySelector("[data-listening-completed-ratio]");
      if (ratioEl) ratioEl.textContent = `${totalCompletedCount}/${totalMissionsCount}`;

      const totalCompletedStatEl = document.querySelector("[data-listening-completed-total]");
      if (totalCompletedStatEl) totalCompletedStatEl.textContent = `${totalCompletedCount}/${totalMissionsCount}`;

      // Distinct mistake types count (100% Real Data)
      const activeMistakes = Object.entries(state.mistakes || {}).filter(([_, count]) => count > 0);
      const mistakesTypesEl = document.querySelector("[data-listening-mistakes-types]");
      if (mistakesTypesEl) {
        mistakesTypesEl.textContent = `${activeMistakes.length} dạng`;
      }

      // Current Goal Progress (100% Real Data)
      const goalTitleEl = document.querySelector("[data-listening-goal-title]");
      if (goalTitleEl) {
        goalTitleEl.textContent = goalText[state.goal] || "Giới thiệu bản thân";
      }

      const goalStatusEl = document.querySelector("[data-listening-goal-status]");
      if (goalStatusEl) {
        const goalMissions = missions.filter((m) => m.goal === state.goal);
        const goalDone = goalMissions.filter((m) => (state.scores[m.id] || 0) >= 70).length;
        goalStatusEl.textContent = `${goalDone}/${goalMissions.length} bài hoàn thành`;
      }

      // Level
      let levelTitle = "Level 0: Chưa làm bài nào";
      let shortLevel = "Level 0";
      if (totalCompletedCount > 0) {
        if (totalCompletedCount < 10) {
          levelTitle = `Level 1: Nhận biết âm`;
          shortLevel = "Level 1";
        } else if (totalCompletedCount < 30) {
          levelTitle = `Level 2: Nối âm & Cụm từ`;
          shortLevel = "Level 2";
        } else if (totalCompletedCount < 60) {
          levelTitle = `Level 3: Thâm nhập câu`;
          shortLevel = "Level 3";
        } else {
          levelTitle = `Level 4: Bản xứ thành thạo`;
          shortLevel = "Level 4";
        }
      }

      const shortLevelEl = document.querySelector("[data-listening-level-short]");
      if (shortLevelEl) shortLevelEl.textContent = shortLevel;

      const levelNameEl = document.querySelector("[data-listening-level-name]");
      if (levelNameEl) levelNameEl.textContent = levelTitle;

      const levelSubEl = document.querySelector("[data-listening-level-sub]");
      if (levelSubEl) levelSubEl.textContent = `${completionPercentage}% tổng bài lab`;

      if (els.listeningLevel) els.listeningLevel.textContent = `${levelTitle} (${totalCompletedCount}/${totalMissionsCount} bài)`;

      const topMistake = getTopMistake();
      if (els.weaknessSummary) {
        els.weaknessSummary.textContent = totalCompletedCount > 0 ? `Hay miss: ${mistakeLabels[topMistake] || "nối âm"}` : "Chưa có dữ liệu lỗi";
      }
      if (els.nextDrill) {
        els.nextDrill.textContent = getDrillSuggestion(topMistake);
      }
      if (els.openingScenario) {
        els.openingScenario.textContent = getGoalScenario(state.goal);
      }

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
      const completedCount = missions.filter((m) => (state.scores[m.id] || 0) >= 70).length;
      if (els.missionCount) {
        els.missionCount.textContent = `${completedCount}/${missions.length} sessions`;
      }

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
        const score = state.scores[mission.id] || 0;
        const completed = score >= 70;
        const recommended = mission.goal === state.goal;
        const progressLabel = score > 0 ? `${score}% completed` : "Ready";

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

    let activeToeicPart = "all";
    let toeicSearchQuery = "";
    let currentToeicTest = null;
    let currentToeicGroupIdx = 0;
    let currentPlaybackSpeed = 1.0;
    let toeicAudioTimeout = null;
    let currentToeicItemIdx = 0;

    function bindToeicEvents() {
      const toeicPartCards = document.querySelectorAll("[data-toeic-part]");
      const toeicSearchInput = document.querySelector("[data-toeic-search]");
      const toggleSidebarBtn = document.getElementById("toggle-sidebar-btn");

      toeicPartCards.forEach((card) => {
        card.addEventListener("click", () => {
          activeToeicPart = card.dataset.toeicPart;
          toeicPartCards.forEach((c) => {
            const isActive = c === card;
            c.classList.toggle("active", isActive);
            c.style.borderColor = isActive ? "rgba(56, 189, 248, 0.4)" : "rgba(255, 255, 255, 0.08)";
            c.style.background = isActive ? "rgba(30, 41, 59, 0.6)" : "rgba(30, 41, 59, 0.4)";
          });
          renderToeicMissionGrid();
        });
      });

      if (toeicSearchInput) {
        toeicSearchInput.addEventListener("input", () => {
          toeicSearchQuery = toeicSearchInput.value.trim().toLowerCase();
          renderToeicMissionGrid();
        });
      }

      if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener("click", () => {
          const sidebar = document.querySelector(".workspace-sidebar");
          if (sidebar) {
            sidebar.classList.toggle("is-hidden");
            const isHidden = sidebar.classList.contains("is-hidden");
            toggleSidebarBtn.innerHTML = isHidden 
              ? `<span class="ti-layout-sidebar-left" style="font-weight: bold; font-size: 13px;"></span> Hiện sidebar`
              : `<span class="ti-layout-sidebar-left" style="font-weight: bold; font-size: 13px;"></span> Ẩn sidebar`;
          }
        });
      }
    }

    function renderToeicMissionGrid() {
      const toeicGrid = document.querySelector("[data-toeic-mission-grid]");
      const toeicCount = document.querySelector("[data-toeic-mission-count]");
      if (!toeicGrid) return;

      const tests = window.TOEIC_PART1_TESTS || [];
      const part2Counts = ["100 câu", "100 câu", "100 câu", "100 câu", "100 câu", "100 câu", "100 câu"];
      const part3Counts = ["111 câu", "132 câu", "111 câu", "125 câu", "118 câu", "120 câu", "130 câu"];
      const part4Counts = ["75 câu", "79 câu", "75 câu", "80 câu", "78 câu", "82 câu", "85 câu"];

      let html = "";
      let visibleCount = 0;

      tests.forEach((test, idx) => {
        const testNum = test.testNumber || (idx + 1);
        const p1Count = test.totalItems || "20 câu";

        const partsData = [
          { partKey: "part1", partNum: 1, label: "Part 1", badgeClass: "part1-badge", count: p1Count },
          { partKey: "part2", partNum: 2, label: "Part 2", badgeClass: "part2-badge", count: part2Counts[idx % part2Counts.length] },
          { partKey: "part3", partNum: 3, label: "Part 3", badgeClass: "part3-badge", count: part3Counts[idx % part3Counts.length] },
          { partKey: "part4", partNum: 4, label: "Part 4", badgeClass: "part4-badge", count: part4Counts[idx % part4Counts.length] }
        ];

        const matchingParts = partsData.filter((p) => {
          if (activeToeicPart !== "all" && activeToeicPart !== p.partKey) return false;
          if (toeicSearchQuery) {
            const query = toeicSearchQuery.toLowerCase();
            return `test ${testNum} ${p.label} ${test.title}`.toLowerCase().includes(query);
          }
          return true;
        });

        if (matchingParts.length > 0) {
          visibleCount += matchingParts.length;
          matchingParts.forEach((p) => {
            const isPremium = p.partNum === 3 || p.partNum === 4;
            const statusHtml = isPremium
              ? `<span class="toeic-card-status" style="color: #f59e0b; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span class="ti-crown"></span> PRO</span>`
              : `<span class="toeic-card-status">Chưa bắt đầu</span>`;
            const btnHtml = isPremium
              ? `<button class="toeic-card-btn premium-lock-btn" type="button" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3)); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24;" data-open-toeic-test="${test.id}" data-toeic-part-num="${p.partNum}">
                  <span class="ti-lock" style="margin-right: 4px;"></span> Premium
                </button>`
              : `<button class="toeic-card-btn" type="button" data-open-toeic-test="${test.id}" data-toeic-part-num="${p.partNum}">
                  Luyện tập <span class="ti-angle-right"></span>
                </button>`;

            html += `
              <article class="toeic-grid-card ${isPremium ? 'is-premium-card' : ''}">
                <div class="toeic-card-header">
                  <div class="toeic-card-badges">
                    <span class="toeic-badge test-badge">Test ${testNum}</span>
                    <span class="toeic-badge ${p.badgeClass}">${p.label}</span>
                  </div>
                  <span class="toeic-folder-icon"><span class="ti-folder"></span> 0</span>
                </div>
                <div class="toeic-card-body">
                  <h3 class="toeic-card-count">
                    <span class="ti-headphone" style="color: #38bdf8; font-size: 1.2rem;"></span> ${p.count}
                  </h3>
                </div>
                <div class="toeic-card-footer">
                  ${statusHtml}
                  ${btnHtml}
                </div>
              </article>
            `;
          });
        }
      });

      if (toeicCount) {
        toeicCount.textContent = `${visibleCount} phần nghe TOEIC`;
      }

      if (!html) {
        toeicGrid.innerHTML = `
          <div class="mission-empty" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #94a3b8;">
            <strong>Không tìm thấy bài nghe TOEIC phù hợp.</strong>
            <p style="margin-top: 6px; font-size: 13px;">Thử chọn Part khác hoặc từ khóa tìm kiếm khác.</p>
          </div>
        `;
        return;
      }

      toeicGrid.innerHTML = html;

      toeicGrid.querySelectorAll("[data-open-toeic-test]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const testId = btn.dataset.openToeicTest;
          const partNum = parseInt(btn.dataset.toeicPartNum, 10);
          openToeicTest(testId, partNum);
        });
      });
    }

    function showPremiumUpgradeModal(partNum) {
      let modal = document.getElementById("premium-upgrade-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "premium-upgrade-modal";
        modal.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,0.8);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;";
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div style="background:#1e293b;border:1px solid rgba(245,158,11,0.4);border-radius:20px;max-width:440px;width:100%;padding:32px 28px;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.6), 0 0 30px rgba(245,158,11,0.2);position:relative;">
          <button type="button" onclick="document.getElementById('premium-upgrade-modal').style.display='none'" style="position:absolute;top:16px;right:16px;background:transparent;border:none;color:#94a3b8;font-size:20px;cursor:pointer;line-height:1;">✕</button>
          
          <div style="width:64px;height:64px;margin:0 auto 18px;background:rgba(245,158,11,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#f59e0b;font-size:32px;border:1px solid rgba(245,158,11,0.3);">
            👑
          </div>
          
          <h3 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 10px;">Cần nâng cấp Premium</h3>
          <p style="font-size:14px;color:#cbd5e1;margin:0 0 24px;line-height:1.6;">
            Tính năng luyện nghe <strong style="color:#f59e0b;">Part ${partNum}</strong> dành riêng cho tài khoản cao cấp. Nâng cấp Premium ngay để mở khóa toàn bộ bài nghe TOEIC & tính năng không giới hạn!
          </p>
          
          <div style="display:flex;gap:12px;justify-content:center;">
            <button type="button" onclick="document.getElementById('premium-upgrade-modal').style.display='none'" style="padding:10px 20px;border-radius:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;font-weight:600;cursor:pointer;font-size:14px;">Để sau</button>
            <a href="pricing.html" style="padding:10px 24px;border-radius:10px;background:linear-gradient(135deg, #f59e0b, #d97706);color:#fff;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 14px rgba(245,158,11,0.35);font-size:14px;">Nâng cấp ngay ✨</a>
          </div>
        </div>
      `;
      modal.style.display = "flex";
    }

    function openToeicTest(testId, partNum) {
      if (partNum === 3 || partNum === 4) {
        showPremiumUpgradeModal(partNum);
        return;
      }

      let tests = window.TOEIC_PART1_TESTS || [];
      if (partNum === 2 && window.TOEIC_PART2_TESTS) tests = window.TOEIC_PART2_TESTS;
      else if (partNum === 3 && window.TOEIC_PART3_TESTS) tests = window.TOEIC_PART3_TESTS;
      else if (partNum === 4 && window.TOEIC_PART4_TESTS) tests = window.TOEIC_PART4_TESTS;

      const testNum = parseInt(testId.replace(/\D/g, ''), 10);
      const test = tests.find((t) => t.id === testId || t.testNumber === testNum) || tests[0];
      if (!test) return;

      currentToeicTest = test;
      currentToeicGroupIdx = 0;
      currentToeicItemIdx = 0;

      const mainDashboard = document.querySelector(".lab-dashboard-grid");
      const toeicView = document.querySelector("[data-listening-toeic-view]");
      const progressView = document.querySelector("[data-listening-progress-view]");
      const workspace = document.getElementById("lab-workspace");

      if (els.dashboard) els.dashboard.hidden = true;
      if (mainDashboard) mainDashboard.hidden = true;
      if (toeicView) toeicView.hidden = true;
      if (progressView) progressView.hidden = true;
      if (workspace) workspace.hidden = false;
      document.body.classList.add("workspace-active");

      const modeSwitch = document.querySelector(".listening-mode-switch");
      if (modeSwitch) modeSwitch.hidden = true;

      const topicNameEl = document.getElementById("active-topic-name");
      const subtitleEl = document.getElementById("sidebar-subtitle");

      if (topicNameEl) topicNameEl.textContent = test.title.toUpperCase();
      if (subtitleEl) subtitleEl.textContent = `${test.groups.length} bài • ${test.totalItems}`;

      switchWorkspaceTab(2);
      renderToeicSidebarTree();
      loadToeicSentence(0, 0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderToeicSidebarTree() {
      const sidebarList = document.getElementById("sidebar-session-list");
      if (!sidebarList || !currentToeicTest) return;

      let html = "";
      currentToeicTest.groups.forEach((group, gIdx) => {
        const isGroupActive = gIdx === currentToeicGroupIdx;
        html += `
          <div class="sidebar-group-block" style="margin-bottom: 6px;">
            <button class="sidebar-group-header ${isGroupActive ? "is-active" : ""}" type="button" data-group-idx="${gIdx}">
              <span><span class="ti-headphone" style="margin-right: 6px;"></span> ${group.groupTitle}</span>
            </button>
            <div class="sidebar-group-items" ${isGroupActive ? "" : 'style="display: none;"'}>
        `;

        group.items.forEach((item, iIdx) => {
          const isItemActive = isGroupActive && iIdx === currentToeicItemIdx;
          const missionId = `toeic-${currentToeicTest.id}-${gIdx}-${iIdx}`;
          const isCompleted = (state.scores[missionId] || 0) >= 70;
          html += `
            <div class="sidebar-item-row ${isItemActive ? "is-active" : ""}" data-group-idx="${gIdx}" data-item-idx="${iIdx}" style="display: flex; justify-content: space-between; align-items: center;">
              <span>${item.label}</span>
              ${isCompleted ? '<span class="ti-check" style="color: #10b981; font-weight: bold;"></span>' : ''}
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

      sidebarList.innerHTML = html;

      sidebarList.querySelectorAll(".sidebar-group-header").forEach((hdr) => {
        hdr.addEventListener("click", () => {
          const gIdx = parseInt(hdr.dataset.groupIdx, 10);
          currentToeicGroupIdx = gIdx;
          currentToeicItemIdx = 0;
          renderToeicSidebarTree();
          loadToeicSentence(currentToeicGroupIdx, currentToeicItemIdx);
        });
      });

      sidebarList.querySelectorAll(".sidebar-item-row").forEach((row) => {
        row.addEventListener("click", () => {
          const gIdx = parseInt(row.dataset.groupIdx, 10);
          const iIdx = parseInt(row.dataset.itemIdx, 10);
          currentToeicGroupIdx = gIdx;
          currentToeicItemIdx = iIdx;
          renderToeicSidebarTree();
          loadToeicSentence(gIdx, iIdx);
        });
      });
    }

    function loadToeicSentence(gIdx, iIdx) {
      if (!currentToeicTest || !currentToeicTest.groups[gIdx]) return;
      const item = currentToeicTest.groups[gIdx].items[iIdx];
      if (!item) return;

      currentMission = {
        id: `toeic-${currentToeicTest.id}-${gIdx}-${iIdx}`,
        transcript: item.text,
        partNum: currentToeicTest.partNum,
      };

      currentHintPercent = 0;
      if (els.hintLevelBtns) {
        els.hintLevelBtns.forEach(b => b.classList.toggle("active", parseInt(b.dataset.hint, 10) === 0));
      }

      switchWorkspaceTab(2);
      renderDictationForHint(currentMission, currentHintPercent);
    }

    function speakText(text) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = currentPlaybackSpeed;
        window.speechSynthesis.speak(utterance);
      }
    }

    function renderToeicFullScript() {
      const container = document.getElementById("toeic-full-script");
      if (!container || !currentToeicTest) return;
      
      const group = currentToeicTest.groups[currentToeicGroupIdx];
      if (!group) return;
      
      let html = "";
      group.items.forEach((item, idx) => {
        html += `
          <div class="toeic-full-item" data-full-item-idx="${idx}" style="padding: 12px; border-radius: 8px; background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(125, 211, 252, 0.1); display: flex; gap: 12px; transition: all 0.3s ease;">
            <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-weight: 800; padding: 4px 10px; border-radius: 8px; height: fit-content; border: 1px solid rgba(56, 189, 248, 0.4);">${item.option}</span>
            <span style="color: #ffffff; font-size: 1.05rem; line-height: 1.6;">${item.text}</span>
          </div>
        `;
      });
      container.innerHTML = html;
    }

    function playToeicFullAudio() {
       if (!currentToeicTest || !currentToeicTest.groups[currentToeicGroupIdx]) return;
       const group = currentToeicTest.groups[currentToeicGroupIdx];
       let currentIndex = 0;

       isPlaying = true;
       if (els.waveform) els.waveform.classList.add("playing");
       if (els.playBtn) els.playBtn.innerHTML = '<span class="ti-control-pause"></span>';

       function playNext() {
         if (!isPlaying || currentIndex >= group.items.length) {
            stopSpeech();
            return;
         }
         
         const text = group.items[currentIndex].text;
         const items = document.querySelectorAll(".toeic-full-item");
         items.forEach((el, i) => {
            el.style.borderColor = i === currentIndex ? "#38bdf8" : "rgba(125, 211, 252, 0.1)";
            el.style.background = i === currentIndex ? "rgba(56, 189, 248, 0.15)" : "rgba(15, 23, 42, 0.4)";
         });

         if ('speechSynthesis' in window) {
           window.speechSynthesis.cancel();
           const utterance = new SpeechSynthesisUtterance(text);
           utterance.lang = 'en-US';
           utterance.rate = currentPlaybackSpeed;
           utterance.onend = () => {
             if (!isPlaying) return;
             currentIndex++;
             toeicAudioTimeout = setTimeout(playNext, 2000);
           };
           utterance.onerror = () => {
             if (!isPlaying) return;
             currentIndex++;
             toeicAudioTimeout = setTimeout(playNext, 2000);
           };
           window.speechSynthesis.speak(utterance);
         }
       }
       
       playNext();
    }

    function renderMistakeBank() {
      if (!els.mistakeBank) return;
      const entries = Object.entries(state.mistakes || {}).filter(([_, count]) => count > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
      // Top mistake count acts as 420px benchmark bar length (approx 3/7 of card width)
      const maxCount = entries.length > 0 && entries[0][1] > 0 ? entries[0][1] : 1;

      if (entries.length === 0) {
        els.mistakeBank.innerHTML = `<li class="mistake-empty" style="color: #94a3b8; padding: 12px 0; font-size: 0.92rem;">Chưa ghi nhận lỗi nào. Hãy hoàn thành thêm các bài luyện nghe!</li>`;
        return;
      }

      els.mistakeBank.innerHTML = entries
        .map(([key, count]) => {
          // Benchmark scale: max count = 420px bar length
          // Lower counts scale proportionally: ratio * 420px
          const ratio = Math.max(0.08, count / maxCount);
          const barPx = Math.round(ratio * 420);
          const label = mistakeLabels[key] || key;
          return `
            <li class="mistake-item">
              <span class="mistake-label">${escapeHtml(label)}</span>
              <div class="mistake-bar-row">
                <div class="mistake-track" style="width: ${barPx}px; min-width: ${barPx}px;">
                  <div class="mistake-fill"></div>
                </div>
                <span class="mistake-count">${count} lần</span>
              </div>
            </li>
          `;
        })
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
      const foundMission = missions.find(m => m.id === id);
      if (foundMission && typeof foundMission.sessionOrder === "number") {
        return foundMission.sessionOrder;
      }
      const input = `${sessionShuffleSeed}:${goal}:${id}`;
      let hash = 0;
      for (let index = 0; index < input.length; index += 1) {
        hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
      }
      return hash;
    }

    const translationMap = {
      "coffee-shop": "Bạn đã sẵn sàng gọi món chưa, hay bạn cần thêm vài phút nữa?",
      "airport": "Chuyến bay nối chuyến của bạn sẽ khởi hành từ cổng 24 trong 15 phút nữa.",
      "office-call": "Bạn có thể chuyển cuộc họp khách hàng sang 3:30 và gửi lại chương trình họp mới không?",
      "movie-sarcasm": "Đó thực sự là màn trình diễn tuyệt vời nhất mà tôi từng thấy.",
      "asking-directions": "Xin lỗi, bạn có thể chỉ đường cho tôi tới ga tàu điện ngầm gần nhất không?",
      "doctor-appointment": "Tôi muốn đặt lịch hẹn gặp bác sĩ vào chiều thứ Hai tới.",
      "hotel-checkin": "Tôi đã đặt một phòng đơn dưới tên Nguyen cho 2 đêm.",
      "job-interview": "Hãy kể cho tôi nghe về một lần bạn phải làm việc với một đồng nghiệp khó tính?"
    };

    function getTranslation(mission) {
      if (!mission) return "";
      if (mission.translation) return mission.translation;
      if (translationMap[mission.id]) return translationMap[mission.id];
      if (mission.story) return mission.story;
      return mission.transcript;
    }

    function getTopicSessions(goal) {
      return missions
        .filter((mission) => mission.goal === goal)
        .sort((a, b) => getSessionRank(a.id, goal) - getSessionRank(b.id, goal));
    }

    function getTopicSessionsSorted(goal) {
      return getTopicSessions(goal).slice().sort((a, b) => {
        const scoreA = state.scores[a.id] || 0;
        const scoreB = state.scores[b.id] || 0;

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
        return getSessionRank(a.id, goal) - getSessionRank(b.id, goal);
      });
    }

    function getTopicSessionLabel(mission) {
      const topicSessions = getTopicSessions(mission.goal);
      const index = topicSessions.findIndex((item) => item.id === mission.id);
      return `Session ${index >= 0 ? index + 1 : 1}`;
    }

    function openMission(id, options = {}) {
      const mission = missions.find((item) => item.id === id) || missions[0];
      currentMission = mission;
      currentToeicTest = null;
      selectedMode = "natural";
      listenCount = 0;
      wrongOptionAttempted = false;
      answerWasCorrect = false;
      blankWrongAttempts = 0;
      usedFullAnswer = false;

      stopSpeech();
      stopTimer();
      currentHintPercent = 0;
      resetStages();
      populateMission(mission);
      renderOptions(mission);
      renderKeywordHints(mission);
      renderDictation(mission);
      renderBreakdown(mission);
      resetModeTabs();
      updateListenLayers();
      updateModeStatus();

      els.dashboard.hidden = true;
      els.workspace.hidden = false;
      document.body.classList.add("workspace-active");
      
      const modeSwitch = document.querySelector(".listening-mode-switch");
      if (modeSwitch) modeSwitch.hidden = true;

      switchWorkspaceTab(1);
      if (els.resultPanel) els.resultPanel.hidden = true;

      if (options.challenge) startTimer();
      else if (els.challengeBox) els.challengeBox.hidden = true;

      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openInitialMissionFromHash() {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const missionId = params.get("mission");
      if (!missionId || !missions.some((mission) => mission.id === missionId)) return;
      window.requestAnimationFrame(() => openMission(missionId));
    }

    function populateMission(mission) {
      if (els.missionKicker) els.missionKicker.textContent = `${goalText[mission.goal]} · ${getTopicSessionLabel(mission)}`;
      if (els.missionTitle) els.missionTitle.textContent = mission.title;
      if (els.stickySessionTitle) els.stickySessionTitle.textContent = `${getTopicSessionLabel(mission)} · ${mission.title}`;
      if (els.missionStory) els.missionStory.textContent = mission.story;
      if (els.missionRole) els.missionRole.textContent = mission.role;
      if (els.missionAccent) els.missionAccent.textContent = mission.accent;
      if (els.missionNoise) els.missionNoise.textContent = mission.noise;
      if (els.missionTarget) els.missionTarget.textContent = mission.target;
      if (els.questionTitle) els.questionTitle.textContent = mission.questionTitle;
      if (els.questionContext) els.questionContext.textContent = mission.context;
      if (els.connectedSpeech) els.connectedSpeech.textContent = mission.connectedSpeech;
      if (els.transcript) els.transcript.textContent = `"${mission.transcript}"`;
      if (els.nativeLine) els.nativeLine.textContent = mission.nativeLine;
      if (els.translationText) els.translationText.textContent = getTranslation(mission);
      if (els.missReason) els.missReason.textContent = mission.missReason;
      if (els.answerFeedback) els.answerFeedback.textContent = "";

      if (els.activeTopicName) els.activeTopicName.textContent = goalText[mission.goal];
      const topicSessions = getTopicSessionsSorted(mission.goal);
      if (els.sidebarSubtitle) els.sidebarSubtitle.textContent = `${topicSessions.length} bài`;
      
      const sessionIndex = topicSessions.findIndex(m => m.id === mission.id);
      if (els.studyProgressText) els.studyProgressText.textContent = `${sessionIndex + 1}/${topicSessions.length} bài`;
      if (els.miniIndexText) els.miniIndexText.textContent = `${sessionIndex + 1}/${topicSessions.length}`;
      if (els.sidebarSessionList) {
        els.sidebarSessionList.innerHTML = topicSessions.map((s, idx) => {
          const isActive = s.id === mission.id;
          const score = state.scores[s.id] || 0;
          return `
            <button class="sidebar-session-btn" type="button" data-mission="${escapeAttr(s.id)}" style="display: flex; flex-direction: column; width: 100%; padding: 10px 12px; border: none; text-align: left; background: ${isActive ? 'rgba(46, 232, 120, 0.15)' : 'transparent'}; border-left: 3px solid ${isActive ? '#2ee878' : 'transparent'}; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.03); border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 8px;">
                <span style="color: ${isActive ? '#2ee878' : '#cbd5e1'}; font-weight: 700; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
                  ${escapeHtml(s.title || '')}
                </span>
                <span style="color: ${score > 0 ? '#2ee878' : '#64748b'}; font-size: 11px; font-weight: 700; flex-shrink: 0;">${score}%</span>
              </div>
            </button>
          `;
        }).join("");

        els.sidebarSessionList.querySelectorAll(".sidebar-session-btn").forEach(btn => {
          btn.addEventListener("click", () => openMission(btn.dataset.mission));
        });
      }

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
      if (!els.options) return;
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
      if (!els.keywordHints) return;
      els.keywordHints.innerHTML = mission.keywords.map((keyword) => `<span>${escapeHtml(maskKeyword(keyword))}</span>`).join("");
      els.keywordHints.classList.add("is-hidden");
    }

    function renderDictation(mission) {
      renderDictationForHint(mission, currentHintPercent);
    }

    function renderBreakdown(mission) {
      if (els.whyHard) els.whyHard.innerHTML = mission.whyHard.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      if (els.phraseTimeline) {
        els.phraseTimeline.innerHTML = mission.phrases.map((phrase) => `
          <button class="phrase-chip" type="button" data-phrase="${escapeAttr(phrase)}"><span class="ti-control-play"></span>${escapeHtml(phrase)}</button>
        `).join("");

        els.phraseTimeline.querySelectorAll("[data-phrase]").forEach((button) => {
          button.addEventListener("click", () => speak(button.dataset.phrase, false));
        });
      }
    }

    function resetStages() {
      currentHintPercent = 0;
      if (els.stage2) els.stage2.classList.remove("stage-locked");
      if (els.stage3) els.stage3.classList.remove("stage-locked");
      if (els.finishBtn) els.finishBtn.disabled = false;
      if (els.connectedPanel) els.connectedPanel.hidden = true;
      if (els.hintLevelBtns) {
        els.hintLevelBtns.forEach((b) => b.classList.toggle("active", b.dataset.hint === "0"));
      }
      setDictationControls(true);
      if (els.options) {
        els.options.querySelectorAll(".roleplay-btn").forEach((button) => {
          button.disabled = false;
          button.classList.remove("correct", "wrong");
        });
      }
      const medium = document.querySelector('input[name="confidence"][value="medium"]');
      if (medium) medium.checked = true;
    }

    function resetModeTabs() {
      selectedMode = "natural";
      els.modeTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === "natural"));
    }

    function updateModeStatus() {
      const mode = modes[selectedMode] || modes.natural;
      if (els.currentMode) els.currentMode.textContent = mode.label;
      if (els.audioNote) els.audioNote.textContent = mode.note;
      updateVoiceStatus();
    }

    function updateListenLayers() {
      const capped = Math.min(listenCount, 3);
      if (els.listenCount) els.listenCount.textContent = capped;

      if (els.layerSteps) {
        els.layerSteps.forEach((step) => {
          const index = Number(step.dataset.layerStep);
          step.classList.toggle("done", capped >= index);
          step.classList.toggle("active", capped + 1 === index || (capped === 3 && index === 3));
        });
      }

      if (listenCount >= 2) {
        if (els.stage2) els.stage2.classList.remove("stage-locked");
        if (els.keywordHints) els.keywordHints.classList.remove("is-hidden");
      }

      setDictationControls(listenCount >= 3);

      if (els.answerFeedback) {
        if (listenCount === 1) els.answerFeedback.textContent = "Lần 1: cố đoán ý chính trước, chưa cần transcript.";
        if (listenCount === 2) els.answerFeedback.textContent = "Lần 2: từ khóa đã mở. Hãy nghe xem câu đang hỏi điều gì.";
        if (listenCount >= 3) els.answerFeedback.textContent = "Lần 3: gap transcript đã mở. Điền chỗ trống trước khi xem breakdown.";
      }
    }

    function setDictationControls(enabled = true) {
      [els.revealLetterBtn, els.reveal2WordsBtn, els.reveal3WordsBtn, els.playSlowerBtn, els.showConnectedBtn, els.showAnswerBtn, els.checkBlanksBtn, els.resetDictationBtn].forEach((button) => {
        if (button) button.disabled = false;
      });
      getBlankInputs().forEach((input) => {
        if (input) {
          input.disabled = false;
        }
      });
    }

    function handleOption(button) {
      const correct = button.dataset.correct === "true";
      if (els.options) {
        els.options.querySelectorAll(".roleplay-btn").forEach((item) => item.classList.remove("correct", "wrong"));
      }

      if (correct) {
        answerWasCorrect = true;
        button.classList.add("correct");

        const inputs = getBlankInputs();
        let dictationScore = 0;
        if (inputs.length) {
          let correctCount = 0;
          inputs.forEach((input) => {
            const val = normalize(input.value);
            const ans = normalize(input.dataset.answer);
            if (val !== "" && val === ans) correctCount += 1;
          });
          dictationScore = Math.round((correctCount / inputs.length) * 85);
        }

        const totalScore = Math.min(100, dictationScore + 15);
        state.scores[currentMission.id] = Math.max(state.scores[currentMission.id] || 0, totalScore);

        if (totalScore >= 70) {
          state.completed = unique([...state.completed, currentMission.id]);
        }

        if (els.answerFeedback) els.answerFeedback.textContent = `Chính xác! Đã cộng +15% điểm Question. Tổng điểm: ${totalScore}%.`;
        saveState();
        renderDashboard();
        if (currentMission) populateMission(currentMission);
        return;
      }

      wrongOptionAttempted = true;
      answerWasCorrect = false;
      button.classList.add("wrong");
      addMistakes(currentMission.mistakes, 1);
      if (els.answerFeedback) els.answerFeedback.textContent = `Bạn có thể đã miss phần khó: ${currentMission.missReason}`;
      saveState();
      renderDashboard();
    }

    function checkDictation() {
      const inputs = getBlankInputs();
      if (!inputs.length) return;

      let correctCount = 0;

      inputs.forEach((input) => {
        const val = normalize(input.value);
        const ans = normalize(input.dataset.answer);
        const isCorrect = (val !== "") && (val === ans);

        if (isCorrect) {
          correctCount += 1;
          input.classList.add("correct");
          input.classList.remove("wrong");
          input.style.border = "1.5px solid #10b981";
          input.style.borderColor = "#10b981";
          input.style.color = "#10b981";
          input.style.background = "rgba(16, 185, 129, 0.15)";
          input.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.35)";
        } else {
          input.classList.remove("correct");
          input.classList.add("wrong");
          input.style.border = "1.5px solid #ef4444";
          input.style.borderColor = "#ef4444";
          input.style.color = "#ef4444";
          input.style.background = "rgba(239, 68, 68, 0.15)";
          input.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.35)";
        }
      });

      // Max dictation score is 85%
      const dictationScore = Math.round((correctCount / inputs.length) * 85);
      const questionBonus = answerWasCorrect ? 15 : 0;
      const totalScore = Math.min(100, dictationScore + questionBonus);

      state.scores[currentMission.id] = Math.max(state.scores[currentMission.id] || 0, totalScore);

      if (totalScore >= 70) {
        state.completed = unique([...state.completed, currentMission.id]);
      }

      saveState();
      renderDashboard();
      if (currentToeicTest) {
        renderToeicSidebarTree();
      } else if (currentMission) {
        populateMission(currentMission);
      }

      if (correctCount === inputs.length) {
        if (els.answerFeedback) {
          els.answerFeedback.textContent = answerWasCorrect
            ? `Chính xác 100%! Đã lưu tiến độ.`
            : `Đã điền đúng toàn bộ từ! Đạt ${dictationScore}% (Hoàn thành phần Question để đạt 100%).`;
        }
        unlockStage3();
        return;
      }

      blankWrongAttempts += 1;
      addMistakes(currentMission.mistakes, 1);

      if (els.answerFeedback) {
        els.answerFeedback.textContent = `Bạn đã điền đúng ${correctCount}/${inputs.length} từ (${dictationScore}%). Ô sai có viền đỏ.`;
      }
    }

    function resetDictationInputs() {
      if (!currentMission) return;
      const inputs = getBlankInputs();
      inputs.forEach((input) => {
        let hintPrefix = "";
        if (currentHintPercent > 0 && currentHintPercent < 100) {
          const answer = input.dataset.answer;
          const revealLetters = Math.floor(answer.length * (currentHintPercent / 100));
          if (revealLetters > 0) {
            hintPrefix = answer.substring(0, revealLetters);
          }
        }
        input.value = hintPrefix;
        input.classList.remove("correct", "wrong");
        input.style.border = "1.5px dashed rgba(56, 189, 248, 0.5)";
        input.style.borderColor = "rgba(56, 189, 248, 0.5)";
        input.style.color = "#38bdf8";
        input.style.background = "rgba(15, 23, 42, 0.4)";
        input.style.boxShadow = "none";
      });

      delete state.scores[currentMission.id];
      state.completed = state.completed.filter((id) => id !== currentMission.id);
      answerWasCorrect = false;

      if (els.answerFeedback) els.answerFeedback.textContent = "Đã làm mới dữ liệu của session này.";

      saveState();
      deleteProgressFromDatabase(currentMission.id);
      renderDashboard();
      if (currentToeicTest) {
        renderToeicSidebarTree();
      } else if (currentMission) {
        populateMission(currentMission);
      }
    }

    function renderDictationForHint(mission, percent) {
      if (!els.dictation || !mission || !mission.transcript) return;
      
      const isSameMission = (lastRenderedMissionId === mission.id);
      lastRenderedMissionId = mission.id;
      currentHintPercent = percent;

      const userInputsMap = {};
      if (isSameMission) {
        getBlankInputs().forEach((input) => {
          if (input.dataset.wordIndex !== undefined) {
            userInputsMap[input.dataset.wordIndex] = input.value;
          }
        });
      }

      els.dictation.innerHTML = "";
      els.dictation.style.lineHeight = "1.9";
      els.dictation.style.display = "flex";
      els.dictation.style.flexWrap = "wrap";
      els.dictation.style.alignItems = "center";
      els.dictation.style.gap = "6px 4px";
      els.dictation.style.fontSize = "16px";
      els.dictation.style.fontWeight = "500";
      els.dictation.style.color = "#e2e8f0";

      const transcript = mission.transcript;
      const regex = /([a-zA-Z0-9'-]+)|([^a-zA-Z0-9'-]+)/g;
      const tokens = [];
      let match;
      while ((match = regex.exec(transcript)) !== null) {
        if (match[1]) {
          tokens.push({ type: "word", text: match[1] });
        } else if (match[2]) {
          tokens.push({ type: "sep", text: match[2] });
        }
      }

      const wordTokens = tokens.filter((t) => t.type === "word");
      const totalWords = wordTokens.length;

      let blankRatio = (100 - percent) / 100;
      let numBlanks = Math.round(totalWords * blankRatio);
      if (percent === 0) numBlanks = totalWords;
      if (percent === 100) numBlanks = 0;

      const isBlankMap = {};
      if (numBlanks >= totalWords) {
        wordTokens.forEach((_, idx) => {
          isBlankMap[idx] = true;
        });
      } else if (numBlanks > 0) {
        const step = totalWords / numBlanks;
        for (let i = 0; i < numBlanks; i++) {
          const targetIndex = Math.min(totalWords - 1, Math.floor(i * step + step / 2));
          isBlankMap[targetIndex] = true;
        }
      }

      let wordIndex = 0;
      tokens.forEach((token) => {
        if (token.type === "sep") {
          const span = document.createElement("span");
          span.style.color = "#94a3b8";
          span.style.whiteSpace = "pre";
          span.textContent = token.text;
          els.dictation.appendChild(span);
        } else {
          const currentWordIdx = wordIndex;
          wordIndex++;

          if (isBlankMap[currentWordIdx]) {
            const answer = token.text;
            const input = document.createElement("input");
            input.type = "text";
            input.dataset.answer = answer;
            input.dataset.wordIndex = currentWordIdx;
            input.disabled = false;
            input.setAttribute("aria-label", `Điền từ: ${answer}`);

            let hintPrefix = "";
            if (percent > 0 && percent < 100) {
              const revealLetters = Math.floor(answer.length * (percent / 100));
              if (revealLetters > 0) {
                hintPrefix = answer.substring(0, revealLetters);
              }
            }

            const prevValue = userInputsMap[currentWordIdx];
            if (prevValue !== undefined && prevValue !== "") {
              input.value = prevValue;
            } else {
              input.value = hintPrefix;
            }

            const minWidth = Math.max(42, answer.length * 13 + 14);
            input.style.width = `${minWidth}px`;
            input.style.background = "rgba(15, 23, 42, 0.4)";
            input.style.border = "1.5px dashed rgba(56, 189, 248, 0.5)";
            input.style.color = "#38bdf8";
            input.style.textAlign = "center";
            input.style.fontWeight = "700";
            input.style.outline = "none";
            input.style.margin = "0 2px";
            input.style.borderRadius = "6px";
            input.style.padding = "4px 6px";
            input.style.fontSize = "15px";
            input.style.transition = "all 0.2s ease";

            input.addEventListener("input", () => {
              input.classList.remove("correct", "wrong");
              input.style.border = "1.5px dashed #22d3ee";
              input.style.borderColor = "#22d3ee";
              input.style.color = "#38bdf8";
              input.style.background = "rgba(34, 211, 238, 0.08)";
              input.style.boxShadow = "0 0 8px rgba(34, 211, 238, 0.3)";
            });

            input.addEventListener("focus", () => {
              if (!input.classList.contains("correct") && !input.classList.contains("wrong")) {
                input.style.borderColor = "#22d3ee";
                input.style.boxShadow = "0 0 10px rgba(34, 211, 238, 0.35)";
                input.style.background = "rgba(34, 211, 238, 0.1)";
              }
            });
            input.addEventListener("blur", () => {
              if (!input.classList.contains("correct") && !input.classList.contains("wrong")) {
                input.style.border = "1.5px dashed rgba(56, 189, 248, 0.5)";
                input.style.borderColor = "rgba(56, 189, 248, 0.5)";
                input.style.boxShadow = "none";
                input.style.background = "rgba(15, 23, 42, 0.4)";
              }
            });

            input.addEventListener("keyup", (event) => {
              if (event.key === "Enter") els.checkBlanksBtn.click();
            });

            els.dictation.appendChild(input);
          } else {
            const span = document.createElement("span");
            span.style.color = "#f8fafc";
            span.style.fontWeight = "600";
            span.textContent = token.text;
            els.dictation.appendChild(span);
          }
        }
      });

      if (percent === 100) {
        usedFullAnswer = true;
        unlockStage3();
      }
    }

    function applyDictationHint(percent) {
      renderDictationForHint(currentMission, percent);
    }

    function revealWords(count) {
      const inputs = getBlankInputs();
      const targets = inputs.filter((input) => normalize(input.value) !== normalize(input.dataset.answer));
      if (!targets.length) return;
      
      const countToReveal = Math.min(count, targets.length);
      for (let i = 0; i < countToReveal; i++) {
        const target = targets[i];
        target.value = target.dataset.answer;
        target.classList.add("correct");
        target.classList.remove("wrong");
        target.style.border = "1.5px solid #10b981";
        target.style.borderColor = "#10b981";
        target.style.color = "#10b981";
        target.style.background = "rgba(16, 185, 129, 0.15)";
        target.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.35)";
      }
      
      const nextTarget = inputs.find((input) => normalize(input.value) !== normalize(input.dataset.answer));
      if (nextTarget) {
        nextTarget.focus();
      } else {
        if (els.answerFeedback) els.answerFeedback.textContent = "Bạn đã mở hết các từ. Bấm Check hoặc chuyển sang Breakdown để xem lý do!";
        unlockStage3();
      }
    }

    function toggleConnectedPanel() {
      if (!els.connectedPanel) return;
      const willShow = els.connectedPanel.hidden;
      els.connectedPanel.hidden = !willShow;
      if (willShow && currentMission && els.connectedSpeech) {
        els.connectedSpeech.textContent = currentMission.connectedSpeech || "Nối âm tự nhiên trong câu.";
        els.connectedPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }



    function showFullAnswer() {
      usedFullAnswer = true;
      if (els.hintLevelBtns) {
        els.hintLevelBtns.forEach((b) => b.classList.toggle("active", b.dataset.hint === "100"));
      }
      applyDictationHint(100);
      unlockStage3();
    }

    function unlockStage3() {
      if (els.stage3) els.stage3.classList.remove("stage-locked");
      if (els.finishBtn) els.finishBtn.disabled = false;
      if (els.connectedPanel) els.connectedPanel.hidden = false;
      switchWorkspaceTab("3");
    }

    function finishMission() {
      saveState();
      renderDashboard();

      // Auto Advance to the TOP session in the sidebar list (lowest % score first)
      const sortedSessions = getTopicSessionsSorted(currentMission.goal);
      let nextMission = sortedSessions.find(m => m.id !== currentMission.id);
      if (!nextMission) {
        nextMission = sortedSessions[0];
      }

      const allCompleted100 = sortedSessions.every(s => (state.scores[s.id] || (state.completed.includes(s.id) ? 100 : 0)) >= 100);

      if (nextMission && !allCompleted100) {
        openMission(nextMission.id);
        switchWorkspaceTab("2");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        if (els.resultTitle) els.resultTitle.textContent = `Bạn đã hoàn thành chủ đề "${goalText[currentMission.goal]}" với kết quả xuất sắc!`;
        if (els.resultCopy) els.resultCopy.textContent = "Bạn đã hoàn thành 100% tất cả các session trong chủ đề này.";
        if (els.earnedBadges) els.earnedBadges.innerHTML = [currentMission.badge, "+40 XP", getLevelBadge(finalScore)]
          .map((badge) => `<span>${escapeHtml(badge)}</span>`)
          .join("");
        if (els.resultPanel) els.resultPanel.hidden = false;
        if (els.finishBtn) els.finishBtn.disabled = true;
        stopTimer();
      }
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
      if (els.waveform) els.waveform.classList.add("playing");
      if (els.playBtn) els.playBtn.innerHTML = '<span class="ti-control-pause"></span>';
      if (els.currentMode) els.currentMode.textContent = `Speaking · ${modes[modeOverride || selectedMode]?.label || "Audio"}`;

      if (mode.noise) startNoise();

      if (!("speechSynthesis" in window)) {
        window.setTimeout(stopSpeech, Math.max(1200, text.split(/\s+/).length * 260));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getMissionVoiceRoute(currentMission).lang;
      utterance.rate = (mode.rate * currentPlaybackSpeed) || 1.0;
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
      if (toeicAudioTimeout) {
         clearTimeout(toeicAudioTimeout);
         toeicAudioTimeout = null;
      }
      stopNoise();
      isPlaying = false;
      if (els.waveform) els.waveform.classList.remove("playing");
      if (els.playBtn) els.playBtn.innerHTML = '<span class="ti-control-play"></span>';
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

    function getStorageKey() {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      const userId = currentUser?.id || currentUser?.email || localStorage.getItem("engWithMeUserId") || localStorage.getItem("user_id");
      return userId ? `engWithMeListeningLabState_user_${userId}` : "engWithMeListeningLabState";
    }

    function loadState() {
      const fallback = {
        nativeScore: 0,
        streak: 0,
        xp: 0,
        goal: defaultGoal,
        completed: [],
        scores: {},
        mistakes: {}
      };

      try {
        const key = getStorageKey();
        const parsed = JSON.parse(localStorage.getItem(key) || "null");
        if (!parsed) return fallback;

        const loadedScores = parsed.scores || {};
        const rawCompleted = Array.isArray(parsed.completed) ? parsed.completed : [];
        // Only keep completed items whose score is >= 70
        const validCompleted = rawCompleted.filter(id => (loadedScores[id] || 0) >= 70);

        return {
          ...fallback,
          ...parsed,
          completed: validCompleted,
          scores: loadedScores,
          mistakes: parsed.mistakes || {}
        };
      } catch (error) {
        return fallback;
      }
    }

    function saveState() {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(state));
      syncProgressToDatabase();
    }

    async function syncProgressToDatabase() {
      const userId = localStorage.getItem("engWithMeUserId") || localStorage.getItem("user_id");
      if (!userId || !currentMission) return;

      const currentScore = state.scores[currentMission.id] || 0;
      if (currentScore < 70) return; // Strictly block DB sync if score is under 70%

      try {
        const body = new FormData();
        body.append("progress_id", `listening_${currentMission.id}`);
        await fetch("api/sync_progress.php", {
          method: "POST",
          body,
          credentials: "same-origin"
        });
        if (typeof AppCache !== "undefined") {
          AppCache.invalidate(`progress_user_${userId}`);
        }
      } catch (e) {
        console.warn("Lỗi sync DB Listening Lab:", e);
      }
    }

    async function deleteProgressFromDatabase(missionId) {
      const userId = localStorage.getItem("engWithMeUserId") || localStorage.getItem("user_id");
      if (!userId || !missionId) return;

      try {
        const body = new FormData();
        body.append("progress_id", `listening_${missionId}`);
        body.append("action", "delete");
        await fetch("api/sync_progress.php", {
          method: "POST",
          body,
          credentials: "same-origin"
        });
        if (typeof AppCache !== "undefined") {
          AppCache.invalidate(`progress_user_${userId}`);
        }
      } catch (e) {
        console.warn("Lỗi delete DB Listening Lab:", e);
      }
    }

    async function fetchProgressFromDatabase() {
      const userId = localStorage.getItem("engWithMeUserId") || localStorage.getItem("user_id");
      if (!userId) return;

      try {
        const res = await fetch("api/sync_progress.php", { credentials: "same-origin" });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.progress)) {
            let changed = false;
            data.progress.forEach((pId) => {
              if (typeof pId === "string" && pId.startsWith("listening_")) {
                const missionId = pId.replace("listening_", "");
                if (!state.completed.includes(missionId)) {
                  state.completed.push(missionId);
                  if (state.scores[missionId] === undefined) {
                    state.scores[missionId] = 85;
                  }
                  changed = true;
                }
              }
            });
            if (changed) {
              const key = getStorageKey();
              localStorage.setItem(key, JSON.stringify(state));
              renderDashboard();
              if (currentMission) populateMission(currentMission);
            }
          }
        }
      } catch (e) {
        console.warn("Lỗi fetch DB Listening Lab:", e);
      }
    }

    function storageAvailable() {
      try {
        const key = getStorageKey();
        localStorage.setItem(`${key}Check`, "1");
        localStorage.removeItem(`${key}Check`);
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
