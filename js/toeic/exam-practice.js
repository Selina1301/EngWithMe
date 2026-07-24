// TOEIC practice-session runtime: rendering, answer sheet, timer, audio, and review.
function initToeicExamPractice() {
  const root = document.querySelector("[data-exam-practice]");
  if (!root) return;
  if (root.dataset.initialized === "true") return;
  root.dataset.initialized = "true";

  const countdown = root.querySelector("[data-exam-countdown]");
  const progress = root.querySelector("[data-exam-progress]");
  const part = root.querySelector("[data-exam-part]");
  const question = root.querySelector("[data-exam-question]");
  const explain = root.querySelector("[data-exam-explain]");
  const answers = root.querySelector("[data-exam-answers]");
  const result = root.querySelector("[data-exam-result]");
  const submitButton = root.querySelector("[data-submit-exam]");
  const practiceLabel = document.querySelector("[data-exam-practice-label]");
  const practiceTitle = document.querySelector("[data-exam-practice-title]");

  function safeGetAccountKey(baseKey) {
    if (typeof getAccountKey === "function") return getAccountKey(baseKey);
    if (typeof window !== "undefined" && typeof window.getAccountKey === "function") return window.getAccountKey(baseKey);
    const userId = typeof localStorage !== "undefined" ? localStorage.getItem("engWithMeUserId") : null;
    return userId ? `${baseKey}_user_${userId}` : `${baseKey}_guest`;
  }

  function safeGetExamPartsForSet(setId) {
    if (typeof getExamPartsForSet === "function") return getExamPartsForSet(setId);
    if (typeof window !== "undefined" && typeof window.getExamPartsForSet === "function") return window.getExamPartsForSet(setId);
    return ["1", "2", "3", "4", "5", "6", "7"];
  }

  function safeGetSetMeta(setId) {
    if (typeof getSetMeta === "function") return getSetMeta(setId);
    if (typeof window !== "undefined" && typeof window.getSetMeta === "function") return window.getSetMeta(setId);
    return { id: setId, label: `TOEIC Exam ${setId.replace("y", "")}` };
  }

  function safeFormatToeicPartSelection(parts) {
    if (typeof formatToeicPartSelection === "function") return formatToeicPartSelection(parts);
    if (typeof window !== "undefined" && typeof window.formatToeicPartSelection === "function") return window.formatToeicPartSelection(parts);
    return `Parts ${Array.isArray(parts) ? parts.join(", ") : parts}`;
  }

  function safeGetRecommendedLevel(correct, total) {
    if (typeof getRecommendedLevel === "function") return getRecommendedLevel(correct, total);
    if (typeof window !== "undefined" && typeof window.getRecommendedLevel === "function") return window.getRecommendedLevel(correct, total);
    return "A1";
  }

  function safeGetRecommendedLesson(level) {
    if (typeof getRecommendedLesson === "function") return getRecommendedLesson(level);
    if (typeof window !== "undefined" && typeof window.getRecommendedLesson === "function") return window.getRecommendedLesson(level);
    return "Basic Lesson";
  }

  function normalizeSetId(rawSet) {
    if (!rawSet) return "y2017";
    let s = String(rawSet).trim();
    if (s.startsWith("y")) return s;
    if (/^\d{4}/.test(s)) return `y${s}`;
    return s;
  }

  const validSets = (typeof TOEIC_READING_SETS !== "undefined" && Array.isArray(TOEIC_READING_SETS) && TOEIC_READING_SETS.length)
    ? TOEIC_READING_SETS.map((set) => set.id)
    : ["y2017", "y2018", "y2019", "y2020", "y2021", "y2022", "y2023", "y2024", "y2025"];

  const params = new URLSearchParams(window.location.search);
  const rawSet = params.get("set");
  const normalizedSet = normalizeSetId(rawSet);
  let selectedSet = validSets.includes(normalizedSet) ? normalizedSet : "y2017";
  const ALL_TOEIC_PARTS = ["1", "2", "3", "4", "5", "6", "7"];
  const availableParts = safeGetExamPartsForSet(selectedSet);
  let selectedParts = (params.get("parts") || params.get("part") || availableParts[0] || "5")
    .split(",")
    .map((p) => p.trim())
    .filter((part, index, parts) => ALL_TOEIC_PARTS.includes(part) && parts.indexOf(part) === index);
  if (!selectedParts.length) selectedParts = ["5"];
  let selectedPart = selectedParts.join(",");
  const selectedMinutes = Number(params.get("minutes"));
  const readingSeconds = (Number.isFinite(selectedMinutes) && selectedMinutes > 0 ? Math.min(selectedMinutes, 180) : 75) * 60;
  let questions = [];
  let currentIndex = 0;
  let correct = 0;
  let timerId = null;
  let timeLeft = readingSeconds;
  let finished = false;
  let activePartNumber = selectedParts[0];
  let activeGroupIndex = 0;
  const responses = new Map();
  const flaggedQuestions = new Set();
  const unlockedAudioQuestions = new Set();
  let currentMinimapFilter = "all";
  let heartbeatTimerId = null;
  const activeExamStateKey = safeGetAccountKey("engWithMeExamActiveState");

  const audioRateOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const audioRateKey = safeGetAccountKey("engWithMeToeicAudioRate");
  let audioRate = audioRateOptions.includes(Number(localStorage.getItem(audioRateKey)))
    ? Number(localStorage.getItem(audioRateKey))
    : 1;
  let englishSpeechVoices = [];
  const ttsAssignments = new Map();
  let activeUtterance = null;
  let activeTtsButton = null;
  const ttsVoiceProfiles = Array.from({ length: 30 }, (_, index) => ({
    id: index + 1,
    voiceOffset: index,
    pitch: [0.86, 0.92, 0.98, 1.04, 1.1, 1.16][index % 6],
    volume: 1
  }));

  function getToeicListeningScore(correctPercent) {
    if (correctPercent <= 0) return 5;
    if (correctPercent >= 95) return 495;
    const table = {
      1:10, 5:25, 10:45, 15:70, 20:100, 25:130, 30:160, 35:190, 40:220, 45:250,
      50:275, 55:305, 60:330, 65:360, 70:385, 75:410, 80:435, 85:460, 90:475, 94:490
    };
    if (table[correctPercent]) return table[correctPercent];
    const keys = Object.keys(table).map(Number).sort((a,b)=>a-b);
    let lower = 1;
    for (let k of keys) { if (k <= correctPercent) lower = k; }
    let upper = 95;
    for (let k of keys) { if (k > correctPercent) { upper = k; break; } }
    const ratio = (correctPercent - lower) / (upper - lower);
    return Math.round(table[lower] + ratio * (table[upper] - table[lower]));
  }

  function getToeicReadingScore(correctPercent) {
    if (correctPercent <= 0) return 5;
    if (correctPercent >= 95) return 495;
    const table = {
      1:5, 5:15, 10:35, 15:60, 20:85, 25:110, 30:140, 35:165, 40:195, 45:220,
      50:250, 55:280, 60:305, 65:335, 70:360, 75:385, 80:415, 85:440, 90:460, 94:485
    };
    if (table[correctPercent]) return table[correctPercent];
    const keys = Object.keys(table).map(Number).sort((a,b)=>a-b);
    let lower = 1;
    for (let k of keys) { if (k <= correctPercent) lower = k; }
    let upper = 95;
    for (let k of keys) { if (k > correctPercent) { upper = k; break; } }
    const ratio = (correctPercent - lower) / (upper - lower);
    return Math.round(table[lower] + ratio * (table[upper] - table[lower]));
  }

  let isExamStateLoaded = false;

  function saveExamState() {
    if (finished || !questions.length) return;
    try {
      const state = {
        selectedSet,
        selectedParts,
        selectedMinutes,
        activePartNumber,
        activeGroupIndex,
        timeLeft,
        responses: Array.from(responses.entries()),
        flaggedQuestions: Array.from(flaggedQuestions),
        unlockedAudioQuestions: Array.from(unlockedAudioQuestions),
        savedAt: Date.now()
      };
      localStorage.setItem(activeExamStateKey, JSON.stringify(state));
    } catch (e) {}
  }

  function loadExamState() {
    if (isExamStateLoaded) return true;
    try {
      const raw = localStorage.getItem(activeExamStateKey);
      if (!raw) return false;
      const state = JSON.parse(raw);
      const partsMatch = Array.isArray(state.selectedParts) && state.selectedParts.join(",") === selectedParts.join(",");
      const minutesMatch = !state.selectedMinutes || Number(state.selectedMinutes) === selectedMinutes;

      if (state && state.selectedSet === selectedSet && partsMatch && minutesMatch && Date.now() - state.savedAt < 12 * 3600 * 1000) {
        const elapsedSeconds = Math.floor((Date.now() - state.savedAt) / 1000);
        const remaining = (state.timeLeft !== undefined ? state.timeLeft : readingSeconds) - elapsedSeconds;
        
        if (remaining > 0) {
          timeLeft = remaining;
        } else {
          timeLeft = 0;
        }

        if (state.activePartNumber && selectedParts.includes(String(state.activePartNumber))) {
          activePartNumber = String(state.activePartNumber);
        } else {
          activePartNumber = selectedParts[0];
        }
        if (Number.isInteger(state.activeGroupIndex)) activeGroupIndex = state.activeGroupIndex;
        if (Array.isArray(state.responses)) {
          responses.clear();
          state.responses.forEach(([k, v]) => responses.set(k, v));
        }
        if (Array.isArray(state.flaggedQuestions)) {
          flaggedQuestions.clear();
          state.flaggedQuestions.forEach(k => flaggedQuestions.add(k));
        }
        if (Array.isArray(state.unlockedAudioQuestions)) {
          unlockedAudioQuestions.clear();
          state.unlockedAudioQuestions.forEach(k => unlockedAudioQuestions.add(k));
        }
        isExamStateLoaded = true;
        return true;
      }
    } catch (e) {}
    return false;
  }

  function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  function formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getAudioRateLabel(rate) {
    return `${Number(rate).toFixed(rate % 1 === 0 ? 0 : 2)}x`;
  }

  function renderAudioSpeedControls() {
    return `
      <details class="exam-audio-speed" aria-label="Audio playback speed">
        <summary title="Audio Settings">⋮ SPEED</summary>
        <div class="exam-audio-speed-popup">
          <span>Speed</span>
          <div class="speed-options">
            ${audioRateOptions.map((rate) => `
              <button class="${rate === audioRate ? "is-active" : ""}" type="button" data-audio-rate="${rate}">
                ${getAudioRateLabel(rate)}
              </button>
            `).join("")}
          </div>
        </div>
      </details>
    `;
  }

  function loadEnglishSpeechVoices() {
    if (!("speechSynthesis" in window)) return [];
    englishSpeechVoices = window.speechSynthesis.getVoices()
      .filter((voice) => /^en[-_]/i.test(voice.lang || ""))
      .sort((first, second) => {
        const firstLocal = first.localService ? 0 : 1;
        const secondLocal = second.localService ? 0 : 1;
        return firstLocal - secondLocal || first.name.localeCompare(second.name);
      });
    return englishSpeechVoices;
  }

  function getSpeechVoiceProfile(itemId) {
    if (!ttsAssignments.has(itemId)) {
      ttsAssignments.set(itemId, Math.floor(Math.random() * ttsVoiceProfiles.length));
    }
    return ttsVoiceProfiles[ttsAssignments.get(itemId)];
  }

  function getSpeechVoiceForProfile(profile) {
    const voices = englishSpeechVoices.length ? englishSpeechVoices : loadEnglishSpeechVoices();
    if (!voices.length) return null;
    return voices[profile.voiceOffset % voices.length];
  }

  function getTtsText(item) {
    return [
      item.transcript || item.passage || "",
      item.transcript || item.passage ? "" : item.question || ""
    ].filter(Boolean).join("\n");
  }

  function setAudioRate(rate) {
    if (!audioRateOptions.includes(rate)) return;
    audioRate = rate;
    localStorage.setItem(audioRateKey, String(rate));
    answers.querySelectorAll("audio").forEach((audio) => {
      audio.playbackRate = audioRate;
    });
    answers.querySelectorAll("[data-audio-rate]").forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.audioRate) === audioRate);
    });
    if (activeUtterance && activeTtsButton) {
      const button = activeTtsButton;
      stopActiveTts();
      toggleTts(button);
    }
  }

  function stopActiveTts() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (activeTtsButton) {
      activeTtsButton.classList.remove("is-playing");
      activeTtsButton.textContent = "Play AI voice";
    }
    activeUtterance = null;
    activeTtsButton = null;
  }

  function toggleTts(button) {
    if (!("speechSynthesis" in window)) return;
    if (button === activeTtsButton && activeUtterance) {
      stopActiveTts();
      return;
    }

    stopActiveTts();
    const text = button.dataset.ttsText || "";
    if (!text.trim()) return;

    const profile = ttsVoiceProfiles[Number(button.dataset.ttsProfile || 1) - 1] || ttsVoiceProfiles[0];
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getSpeechVoiceForProfile(profile);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-US";
    }
    utterance.rate = audioRate;
    utterance.pitch = profile.pitch;
    utterance.volume = profile.volume;
    utterance.onend = stopActiveTts;
    utterance.onerror = stopActiveTts;

    activeUtterance = utterance;
    activeTtsButton = button;
    button.classList.add("is-playing");
    button.textContent = "Stop AI voice";
    window.speechSynthesis.speak(utterance);
  }

  function renderAudioBlock(item) {
    if (item.audioUrl) {
      return `
        <div class="exam-audio-box exam-audio-native">
          <audio controls preload="none" src="${escapeHtml(item.audioUrl)}" data-exam-audio></audio>
        </div>
      `;
    }

    const ttsText = getTtsText(item);
    const profile = getSpeechVoiceProfile(item.id || `${item.partNumber}-${item.questionNo || item.group || "audio"}`);
    return `
      <div class="exam-audio-box exam-audio-tts">
        <div class="exam-tts-player">
          <button type="button" data-tts-play data-tts-profile="${profile.id}" data-tts-text="${escapeHtml(ttsText)}">Play AI voice</button>
          <span>AI voice ${String(profile.id).padStart(2, "0")} / 30</span>
        </div>
        ${renderAudioSpeedControls()}
        <small>Browser Text-to-Speech fallback</small>
      </div>
    `;

    return `
      <div class="exam-audio-box is-missing">
        <strong>Audio chưa có</strong>
        <span>File audio sẽ được phát ở đây sau khi được thêm vào đề.</span>
      </div>
    `;
  }

  function renderAttemptQuestionText(item) {
    if (item.section !== "listening") {
      if (!item.passage) return escapeHtml(item.question);
      return `
        <span class="exam-passage">${escapeHtml(item.passage)}</span>
        <span class="exam-question-text">${escapeHtml(item.question)}</span>
      `;
    }

    const audioBlock = renderAudioBlock(item);
    const imageBlock = item.imageUrl
      ? `<img class="exam-listening-image" src="${escapeHtml(item.imageUrl)}" alt="TOEIC Part 1 question ${item.questionNo}">`
      : "";

    if (item.partNumber === "1") {
      return `
        ${audioBlock}
        ${imageBlock}
        <span class="exam-question-text">Look at the picture and mark your answer on the answer sheet.</span>
      `;
    }

    if (item.partNumber === "2") {
      return `
        ${audioBlock}
        <span class="exam-question-text">Listen to the question and mark the best response.</span>
      `;
    }

    return `
      ${audioBlock}
      <span class="exam-question-text">${escapeHtml(item.group || "Listening set")}. Listen and choose the best answer.</span>
      <span class="exam-question-text">${escapeHtml(item.question)}</span>
    `;
  }

  function renderReviewQuestionText(item) {
    if (item.section !== "listening") {
      if (!item.passage) return escapeHtml(item.question);
      return `
        <span class="exam-passage">${escapeHtml(item.passage)}</span>
        <span class="exam-question-text">${escapeHtml(item.question)}</span>
      `;
    }

    const imageBlock = item.imageUrl
      ? `<img class="exam-listening-image" src="${escapeHtml(item.imageUrl)}" alt="TOEIC Part 1 question ${item.questionNo}">`
      : "";
    const transcript = item.transcript || item.passage || "";
    const meta = [
      item.trapType ? `Trap: ${item.trapType}` : "",
      item.skill ? `Skill: ${item.skill}` : "",
      item.talkType ? `Talk type: ${item.talkType}` : ""
    ].filter(Boolean).join(" | ");

    return `
      ${imageBlock}
      ${transcript ? `<span class="exam-passage"><strong>Transcript</strong>\n${escapeHtml(transcript)}</span>` : ""}
      <span class="exam-question-text">${escapeHtml(item.question)}</span>
      ${meta ? `<span class="exam-review-meta">${escapeHtml(meta)}</span>` : ""}
    `;
  }

  function renderQuestionPrompt(item) {
    return `<span class="exam-question-text">${escapeHtml(item.question)}</span>`;
  }

  function formatPart6Passage(passage) {
    if (!passage) return "";
    return escapeHtml(passage).replace(/\{gap_(\d+)\}|\((\d{3})\)/g, (match, g1, g2) => {
      const qNo = g1 || g2;
      return `<span class="gap-marker" data-gap-qno="${qNo}">(${qNo})</span>`;
    });
  }

  function renderOptions(item) {
    const answerSheetOnly = item.section === "listening" && ["1", "2"].includes(item.partNumber);
    const isAudioLocked = item.section === "listening" && ["1", "2"].includes(item.partNumber) && !unlockedAudioQuestions.has(item.id);
    let optionsToRender = item.displayOptions;
    if (item.partNumber === "2") {
      optionsToRender = item.displayOptions.slice(0, 3);
    }

    return `
      <div class="exam-option-list${answerSheetOnly ? " exam-answer-sheet" : ""}${isAudioLocked ? " is-audio-locked" : ""}">
        ${optionsToRender.map((option, optionIndex) => `
          <label class="${responses.get(item.id) === option ? "is-selected" : ""}"${answerSheetOnly ? ` aria-label="Answer ${String.fromCharCode(65 + optionIndex)}"` : ""}>
            <input type="radio" name="${item.id}" value="${escapeHtml(option)}" data-exam-answer-id="${item.id}" data-exam-answer-value="${escapeHtml(option)}" ${responses.get(item.id) === option ? "checked" : ""} ${isAudioLocked ? "disabled" : ""}>
            ${answerSheetOnly
              ? `<span class="exam-option-letter">${String.fromCharCode(65 + optionIndex)}</span>`
              : `<span>${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option)}</span>`}
          </label>
        `).join("")}
      </div>
    `;
  }

  function renderExamCard(item, questionIndex) {
    const isFlagged = flaggedQuestions.has(item.id);
    return `
      <fieldset class="exam-question-card" id="question-${item.id}" data-exam-question-item>
        <div class="exam-question-head">
          <div class="exam-question-title-group">
            <legend class="exam-question-no">Câu ${item.questionNo || questionIndex + 1}${item.group ? ` - ${escapeHtml(item.group)}` : ""}</legend>
            ${item.section !== "listening" ? `<span class="exam-question-inline-prompt">${escapeHtml(item.question)}</span>` : ""}
          </div>
          <button type="button" class="btn-flag-question ${isFlagged ? "is-flagged" : ""}" data-toggle-flag="${item.id}">
            ${isFlagged ? "🚩 Đã cờ" : "🚩 Cờ"}
          </button>
        </div>
        ${item.section === "listening" ? `<div class="exam-question-body">${renderAttemptQuestionText(item)}</div>` : ""}
        ${renderOptions(item)}
      </fieldset>
    `;
  }

  function renderGroupedQuestionSet(groupItems) {
    const first = groupItems[0];
    const questionNumbers = groupItems.map((item) => item.questionNo).filter(Boolean);
    const range = questionNumbers.length > 1
      ? `${questionNumbers[0]}-${questionNumbers[questionNumbers.length - 1]}`
      : `${questionNumbers[0] || ""}`;

    if (first.section === "listening") {
      return `
        <fieldset class="exam-question-card exam-passage-card exam-listening-set">
          <legend>Câu ${range}${first.group ? ` - ${escapeHtml(first.group)}` : ""}</legend>
          ${renderAudioBlock(first)}
          <p class="exam-listening-note">Listen to the audio and choose the best answer for each question.</p>
          <div class="exam-grouped-question-list">
            ${groupItems.map((item) => `
              <section class="exam-grouped-question" id="question-${item.id}" data-exam-question-item>
                <div class="exam-question-head">
                  <div class="exam-question-title-group">
                    <strong class="exam-question-no">Câu ${item.questionNo}</strong>
                    <span class="exam-question-inline-prompt">${escapeHtml(item.question)}</span>
                  </div>
                  <button type="button" class="btn-flag-question ${flaggedQuestions.has(item.id) ? "is-flagged" : ""}" data-toggle-flag="${item.id}">
                    ${flaggedQuestions.has(item.id) ? "🚩 Đã cờ" : "🚩 Cờ"}
                  </button>
                </div>
                ${renderOptions(item)}
              </section>
            `).join("")}
          </div>
        </fieldset>
      `;
    }

    if (first.partNumber === "7") {
      return `
        <fieldset class="exam-question-card exam-passage-card exam-split-view">
          <div class="exam-passage-pane" data-passage-pane>
            <legend style="margin-bottom: 12px; display: block; color: #a7fbc0; font-weight: 900;">Câu ${range}${first.group ? ` - ${escapeHtml(first.group)}` : ""}</legend>
            <div class="exam-passage">${escapeHtml(first.passage)}</div>
          </div>
          <div class="exam-questions-pane">
            <div class="exam-grouped-question-list">
              ${groupItems.map((item) => `
                <section class="exam-grouped-question" id="question-${item.id}" data-exam-question-item>
                  <div class="exam-question-head">
                    <div class="exam-question-title-group">
                      <strong class="exam-question-no">Câu ${item.questionNo}</strong>
                      <span class="exam-question-inline-prompt">${escapeHtml(item.question)}</span>
                    </div>
                    <button type="button" class="btn-flag-question ${flaggedQuestions.has(item.id) ? "is-flagged" : ""}" data-toggle-flag="${item.id}">
                      ${flaggedQuestions.has(item.id) ? "🚩 Đã cờ" : "🚩 Cờ"}
                    </button>
                  </div>
                  ${renderOptions(item)}
                </section>
              `).join("")}
            </div>
          </div>
        </fieldset>
      `;
    }

    return `
      <fieldset class="exam-question-card exam-passage-card">
        <legend>Câu ${range}${first.group ? ` - ${escapeHtml(first.group)}` : ""}</legend>
        <div class="exam-passage">${first.partNumber === "6" ? formatPart6Passage(first.passage) : escapeHtml(first.passage)}</div>
        <div class="exam-grouped-question-list">
          ${groupItems.map((item) => `
            <section class="exam-grouped-question" id="question-${item.id}" data-exam-question-item>
              <div class="exam-question-head">
                <div class="exam-question-title-group">
                  <strong class="exam-question-no">Câu ${item.questionNo}</strong>
                  <span class="exam-question-inline-prompt">${escapeHtml(item.question)}</span>
                </div>
                <button type="button" class="btn-flag-question ${flaggedQuestions.has(item.id) ? "is-flagged" : ""}" data-toggle-flag="${item.id}">
                  ${flaggedQuestions.has(item.id) ? "🚩 Đã cờ" : "🚩 Cờ"}
                </button>
              </div>
              ${renderOptions(item)}
            </section>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function getPartQuestionGroups(partNumber) {
    const partQuestions = questions.filter((item) => String(item.partNumber) === String(partNumber));
    const groups = [];

    for (let index = 0; index < partQuestions.length; index += 1) {
      const item = partQuestions[index];
      const shouldGroup = (
        (item.section === "reading" && ["6", "7"].includes(item.partNumber) && (item.passage || item.group)) ||
        (item.section === "listening" && ["3", "4"].includes(item.partNumber) && (item.group || item.audioUrl))
      );

      if (shouldGroup) {
        const groupItems = [item];
        while (
          partQuestions[index + 1] &&
          (
            (item.group && partQuestions[index + 1]?.group === item.group) ||
            (item.passage && partQuestions[index + 1]?.passage && partQuestions[index + 1]?.passage === item.passage)
          )
        ) {
          index += 1;
          groupItems.push(partQuestions[index]);
        }
        groups.push({
          id: `group-${groupItems[0].id}`,
          type: "passage_group",
          items: groupItems
        });
        continue;
      }

      const groupItems = [item];
      const maxSingleGroupSize = item.partNumber === "1" ? 3 : 5;
      while (
        partQuestions[index + 1] &&
        groupItems.length < maxSingleGroupSize &&
        !partQuestions[index + 1].passage &&
        !partQuestions[index + 1].group
      ) {
        index += 1;
        groupItems.push(partQuestions[index]);
      }
      groups.push({
        id: `group-${groupItems[0].id}`,
        type: "single_cluster",
        items: groupItems
      });
    }

    return groups;
  }

  function renderGroupNavControls(groups, groupIndex, position = "top") {
    if (!groups || groups.length <= 1) return "";
    const currentGroup = groups[groupIndex];
    if (!currentGroup) return "";

    const qNoList = currentGroup.items.map(i => i.questionNo).filter(Boolean);
    const rangeLabel = qNoList.length > 1
      ? `Câu ${qNoList[0]} - ${qNoList[qNoList.length - 1]}`
      : (qNoList.length === 1 ? `Câu ${qNoList[0]}` : `Cụm ${groupIndex + 1}`);

    return `
      <div class="exam-group-nav nav-${position}">
        <button class="group-nav-btn" type="button" data-nav-group="prev" ${groupIndex === 0 ? "disabled" : ""}>
          ← Cụm trước
        </button>
        <div class="group-nav-info">
          <span class="group-badge">Cụm ${groupIndex + 1} / ${groups.length}</span>
          <span>${rangeLabel}</span>
        </div>
        <button class="group-nav-btn" type="button" data-nav-group="next" ${groupIndex === groups.length - 1 ? "disabled" : ""}>
          Cụm tiếp →
        </button>
      </div>
    `;
  }

  function renderExamCards() {
    const groups = getPartQuestionGroups(activePartNumber);
    if (!groups.length) {
      return `<div class="exam-question-card">Không có câu hỏi cho Part này.</div>`;
    }

    if (!Number.isInteger(activeGroupIndex) || activeGroupIndex < 0) activeGroupIndex = 0;
    if (activeGroupIndex >= groups.length) activeGroupIndex = groups.length - 1;

    const currentGroup = groups[activeGroupIndex] || groups[0];
    if (!currentGroup) {
      return `<div class="exam-question-card">Không có nhóm câu hỏi cho Part này.</div>`;
    }
    let groupHtml = "";
    if (currentGroup.type === "passage_group") {
      groupHtml = renderGroupedQuestionSet(currentGroup.items);
    } else {
      groupHtml = (currentGroup.items || []).map((item, idx) => renderExamCard(item, idx)).join("");
    }

    const topNav = renderGroupNavControls(groups, activeGroupIndex, "top");
    const bottomNav = renderGroupNavControls(groups, activeGroupIndex, "bottom");

    return topNav + groupHtml + bottomNav;
  }

  function getQuestions() {
    const buildR = typeof buildToeicReadingQuestionBank === "function" ? buildToeicReadingQuestionBank : (window.buildToeicReadingQuestionBank || (() => []));
    const buildL = typeof buildToeicListeningQuestionBank === "function" ? buildToeicListeningQuestionBank : (window.buildToeicListeningQuestionBank || (() => []));

    let bank = [...buildL(), ...buildR()];
    if (!bank.length && typeof window !== "undefined" && Array.isArray(window.toeicExamQuestionBank)) {
      bank = window.toeicExamQuestionBank;
    } else if (typeof window !== "undefined") {
      window.toeicExamQuestionBank = bank;
    }

    return bank.filter((item) => item.set === selectedSet && selectedParts.includes(String(item.partNumber)))
      .map((item) => ({
        ...item,
        displayOptions: item.section === "listening" ? [...item.options] : shuffle(item.options)
      }));
  }

  function tick() {
    timeLeft -= 1;
    const timeFormatted = formatTime(Math.max(timeLeft, 0));
    if (countdown) countdown.textContent = timeFormatted;
    document.querySelectorAll("[data-exam-side-countdown]").forEach((item) => {
      item.textContent = timeFormatted;
    });
    if (timeLeft <= 0) finishExam();
  }

  function renderSubmitReviewGrid() {
    return questions.map((item, index) => `
      <button class="${responses.has(item.id) ? "is-done" : "is-missing"}" type="button" data-confirm-jump="${item.id}" aria-label="Câu ${item.questionNo || index + 1}">
        ${item.questionNo || index + 1}
      </button>
    `).join("");
  }

  function closeSubmitConfirm() {
    document.querySelector("[data-submit-confirm-modal]")?.remove();
  }

  function openSubmitConfirm() {
    if (finished) return;
    const total = questions.length;
    const done = responses.size;
    const missing = total - done;
    const canSubmit = done > 0;

    closeSubmitConfirm();
    document.body.insertAdjacentHTML("beforeend", `
      <div class="exam-submit-modal" data-submit-confirm-modal role="dialog" aria-modal="true" aria-labelledby="submit-confirm-title">
        <div class="exam-submit-card">
          <div class="exam-submit-head">
            <div>
              <p class="eyebrow">Xác nhận nộp bài</p>
              <h2 id="submit-confirm-title">Kiểm tra trạng thái câu hỏi</h2>
            </div>
            <button type="button" class="exam-submit-close" data-submit-confirm-close aria-label="Đóng">×</button>
          </div>
          <div class="exam-submit-summary">
            <span>Đã làm <strong>${done}/${total}</strong></span>
            <span>Còn <strong>${missing}</strong> câu</span>
          </div>
          <div class="exam-submit-grid" aria-label="Trạng thái câu hỏi trước khi nộp">
            ${renderSubmitReviewGrid()}
          </div>
          <p class="exam-submit-question">Bạn chắc chắn muốn nộp bài?</p>
          ${canSubmit ? "" : `<p class="exam-submit-warning">Bạn hãy hoàn thành ít nhất 1 câu để nộp bài.</p>`}
          <div class="exam-submit-actions">
            <button type="button" class="btn btn-ghost" data-submit-confirm-close>Quay lại làm bài</button>
            <button type="button" class="btn btn-primary" data-submit-confirm-accept ${canSubmit ? "" : "disabled"}>Nộp bài</button>
          </div>
        </div>
      </div>
    `);
  }

  function renderMinimap() {
    const sidebarEl = root.querySelector(".wireframe-question") || part;
    if (!sidebarEl) return;

    sidebarEl.removeAttribute("hidden");

    const total = questions.length;
    const done = responses.size;

    const partsMap = new Map();
    selectedParts.forEach(p => partsMap.set(p, []));
    questions.forEach(q => {
      const p = String(q.partNumber);
      if (!partsMap.has(p)) partsMap.set(p, []);
      partsMap.get(p).push(q);
    });

    let partsHtml = "";
    partsMap.forEach((partQuestions, partNum) => {
      if (!partQuestions.length) return;
      const partDoneCount = partQuestions.filter(q => responses.has(q.id)).length;
      partsHtml += `
        <div class="exam-sidebar-part-group">
          <div class="exam-sidebar-part-title">
            <span>Part ${partNum}</span>
            <small>${partDoneCount}/${partQuestions.length}</small>
          </div>
          <div class="exam-sidebar-grid">
            ${partQuestions.map((q, idx) => {
              const isAnswered = responses.has(q.id);
              const isFlagged = flaggedQuestions.has(q.id);
              let statusCls = isAnswered ? "is-answered" : "is-unanswered";
              if (isFlagged) statusCls += " is-flagged";
              return `
                <button type="button" 
                        class="exam-sidebar-qbtn ${statusCls}" 
                        data-exam-jump="${q.id}" 
                        title="Câu ${q.questionNo || idx + 1}${isAnswered ? ' - Đã chọn: ' + responses.get(q.id) : ' - Chưa chọn'}">
                  ${q.questionNo || idx + 1}
                  ${isFlagged ? '<span class="flag-dot">🚩</span>' : ''}
                </button>
              `;
            }).join("")}
          </div>
        </div>
      `;
    });

    sidebarEl.innerHTML = `
      <div class="exam-sidebar-panel">
        <div class="exam-sidebar-header">
          <div class="sidebar-timer-box">
            <span class="timer-label">⏱️ THỜI GIAN CÒN LẠI</span>
            <strong data-exam-side-countdown class="sidebar-timer-value">${formatTime(Math.max(timeLeft, 0))}</strong>
          </div>
          <div class="sidebar-progress-bar-wrap">
            <div class="sidebar-progress-info">
              <span>Tiến độ bài làm</span>
              <strong>${done} / ${total} câu</strong>
            </div>
            <div class="sidebar-progress-track">
              <div class="sidebar-progress-fill" style="width: ${total > 0 ? Math.round((done / total) * 100) : 0}%"></div>
            </div>
          </div>
        </div>

        <div class="exam-sidebar-legend">
          <span class="legend-badge legend-answered">🟩 Đã chọn</span>
          <span class="legend-badge legend-unanswered">⬛ Chưa chọn</span>
          <span class="legend-badge legend-flag">🚩 Cờ</span>
        </div>

        <div class="exam-sidebar-body custom-scrollbar">
          ${partsHtml}
        </div>

        <div class="exam-sidebar-footer">
          <button type="button" class="btn-sidebar-submit" data-side-submit-exam>
            📝 Nộp bài thi
          </button>
        </div>
      </div>
    `;
  }

  function renderPartTabs() {
    if (selectedParts.length <= 1) return "";
    return `
      <div class="exam-part-tabs">
        ${selectedParts.map(partNum => `
          <button type="button" class="exam-part-tab ${activePartNumber === partNum ? "is-active" : ""}" data-tab-part="${partNum}">
            Part ${partNum}
          </button>
        `).join("")}
      </div>
    `;
  }


  function renderFullExam() {
    const setMeta = safeGetSetMeta(selectedSet);
    stopActiveTts();
    question.closest(".wireframe-question")?.removeAttribute("hidden");
    countdown.textContent = formatTime(timeLeft);
    question.hidden = true;
    question.innerHTML = "";
    explain.hidden = true;
    explain.textContent = "";
    explain.classList.remove("is-reviewing", "is-correct", "is-wrong");
    result.hidden = true;
    result.innerHTML = "";

    if (!selectedParts.includes(String(activePartNumber))) {
      activePartNumber = selectedParts[0];
      activeGroupIndex = 0;
    }

    answers.innerHTML = renderPartTabs() + renderExamCards();
    renderMinimap();
    setAudioRate(audioRate);
  }

  function chooseFullExamAnswer(input) {
    if (finished) return;
    const qId = input.dataset.examAnswerId;
    const aVal = input.dataset.examAnswerValue;
    if (responses.get(qId) === aVal) {
      responses.delete(qId);
      input.closest("[data-exam-question-item]")?.querySelectorAll(".exam-option-list label").forEach(l => l.classList.remove("is-selected"));
      saveExamState();
      renderMinimap();
      return;
    }
    responses.set(qId, aVal);

    const questionItem = input.closest("[data-exam-question-item]");
    questionItem?.querySelectorAll(".exam-option-list label").forEach((label) => label.classList.remove("is-selected"));
    input.closest("label")?.classList.add("is-selected");
    saveExamState();
    renderMinimap();
  }

  function finishExam() {
    if (finished) return;
    closeSubmitConfirm();
    stopActiveTts();
    window.clearInterval(timerId);
    if (heartbeatTimerId) window.clearInterval(heartbeatTimerId);
    timerId = null;
    finished = true;

    const total = questions.length;
    correct = questions.reduce((total, item) => total + (responses.get(item.id) === item.answer ? 1 : 0), 0);
    const skipped = total - responses.size;
    const percent = Math.round((correct / total) * 100);

    const listeningQuestions = questions.filter(q => q.section === "listening");
    const readingQuestions = questions.filter(q => q.section === "reading");
    const listeningCorrect = listeningQuestions.reduce((t, q) => t + (responses.get(q.id) === q.answer ? 1 : 0), 0);
    const readingCorrect = readingQuestions.reduce((t, q) => t + (responses.get(q.id) === q.answer ? 1 : 0), 0);

    const listeningScore = listeningQuestions.length > 0 ? getToeicListeningScore(Math.round((listeningCorrect / Math.max(listeningQuestions.length, 1)) * 100)) : 0;
    const readingScore = readingQuestions.length > 0 ? getToeicReadingScore(Math.round((readingCorrect / Math.max(readingQuestions.length, 1)) * 100)) : 0;
    const totalScore = listeningScore + readingScore;

    const level = safeGetRecommendedLevel(correct, total);

    try { localStorage.removeItem(activeExamStateKey); } catch (e) {}
    localStorage.setItem(safeGetAccountKey("engWithMeLastScore"), `${correct}/${total}`);

    if (typeof addXP === "function" && correct > 0) {
      addXP(correct * 2, "Luyện đề TOEIC");
    }

    const userId = typeof localStorage !== "undefined" ? localStorage.getItem("engWithMeUserId") : null;
    if (userId) {
      try {
        const body = new FormData();
        body.append("test_set", selectedSet);
        body.append("test_parts", selectedParts.join(","));
        body.append("score", `${correct}/${total}`);
        body.append("score_listening", listeningScore);
        body.append("score_reading", readingScore);
        body.append("total_score", totalScore);
        body.append("correct_count", correct);
        body.append("total_questions", total);
        body.append("recommended_level", level);
        fetch("api/test_results.php", { method: "POST", body, credentials: "same-origin" });
      } catch (e) {}
    }

    progress.textContent = `Hoàn thành ${responses.size} / ${total}`;
    countdown.textContent = "00:00";
    part.textContent = "Kết quả";
    question.innerHTML = "";
    question.closest(".wireframe-question")?.setAttribute("hidden", "");
    answers.innerHTML = "";
    explain.textContent = "";
    explain.hidden = true;
    result.hidden = false;

    result.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 class="exam-finished-title" style="font-size: clamp(1.4rem, 2.5vw, 2rem); color:#00f0ff;">🎉 Kết Quả Bài Thi TOEIC</h2>
        <p style="color:#94a3b8;">Đề: ${safeGetSetMeta(selectedSet).label} | ${safeFormatToeicPartSelection(selectedParts)}</p>
      </div>
      <div class="exam-score-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 24px;">
        <div><span>Điểm TOEIC</span><strong style="font-size:1.6rem;color:#00f0ff;">${totalScore || (correct + "/" + total)}</strong></div>
        <div><span>Listening</span><strong style="color:#38bdf8;">${listeningScore} pts</strong></div>
        <div><span>Reading</span><strong style="color:#a7fbc0;">${readingScore} pts</strong></div>
        <div><span>Đúng / Tổng</span><strong>${correct} / ${total} (${percent}%)</strong></div>
      </div>
      <p style="margin-bottom:20px;color:#e2e8f0;">Trình độ đề xuất: <strong style="color:#00f0ff;">${level}</strong>. Bài nên học tiếp: ${safeGetRecommendedLesson(level)}.</p>
      
      <h3 style="color:#ffffff;margin-bottom:16px;">Chi tiết đáp án & Giải thích (3 Chế độ màu):</h3>
      <div class="exam-review-list">
        ${questions.map((item, index) => {
          const selected = responses.get(item.id);
          const isCorrect = selected === item.answer;
          const statusText = selected ? (isCorrect ? "🟩 ĐÚNG" : "🟥 SAI") : "⚪ BỎ TRỐNG";

          return `
            <details class="exam-review-card" ${!isCorrect ? "open" : ""}>
              <summary class="${isCorrect ? "is-correct" : "is-wrong"}" style="font-size:1.05rem;">
                Câu ${item.questionNo || index + 1}: ${statusText} - Đáp án chuẩn: <strong>${escapeHtml(item.answer)}</strong>
              </summary>
              <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.1);">
                <div class="exam-review-question">${renderReviewQuestionText(item)}</div>
                <div style="margin:12px 0;">
                  ${item.displayOptions.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    let cls = "exam-review-option";
                    let prefix = `${letter}. `;
                    if (selected === opt && opt === item.answer) {
                      cls += " review-ans-correct";
                      prefix += "✔ (Bạn chọn đúng) ";
                    } else if (selected === opt && opt !== item.answer) {
                      cls += " review-ans-wrong";
                      prefix += "✖ (Bạn chọn sai) ";
                    } else if (opt === item.answer) {
                      cls += " review-ans-target";
                      prefix += "★ (Đáp án đúng chuẩn) ";
                    }
                    return `<div class="${cls}"><span>${prefix}${escapeHtml(opt)}</span></div>`;
                  }).join("")}
                </div>
                ${item.explain ? `<p style="background:rgba(56,189,248,0.08);border-left:3px solid #00f0ff;padding:8px 12px;border-radius:6px;color:#dbeafe;"><strong>Giải thích:</strong> ${escapeHtml(item.explain)}</p>` : ""}
              </div>
            </details>
          `;
        }).join("")}
      </div>
      <div style="margin-top:24px;text-align:center;">
        <button class="btn btn-primary" type="button" data-restart-exam style="padding:12px 32px;font-size:1.05rem;">Làm lại đề</button>
      </div>
    `;

    result.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function fetchQuestionsFromApi(setId, parts) {
    try {
      const partsStr = Array.isArray(parts) ? parts.join(",") : parts;
      const apiPath = new URL("api/get_exam_questions.php", window.location.href).href;
      const res = await fetch(`${apiPath}?set=${encodeURIComponent(setId)}&parts=${encodeURIComponent(partsStr)}`, {
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.questions) && data.questions.length > 0) {
          return data.questions.map((item) => ({
            ...item,
            displayOptions: item.section === "listening" ? [...(item.options || [])] : shuffle(item.options || [])
          }));
        }
      }
    } catch (e) {
      console.warn("Database API offline or unreachable:", e);
    }
    return null;
  }

  async function startExam() {
    const setMeta = safeGetSetMeta(selectedSet);
    stopActiveTts();

    correct = 0;
    finished = false;
    timeLeft = readingSeconds;
    activeGroupIndex = 0;
    responses.clear();
    flaggedQuestions.clear();
    unlockedAudioQuestions.clear();
    window.clearInterval(timerId);
    if (heartbeatTimerId) window.clearInterval(heartbeatTimerId);

    const listeningParts = typeof TOEIC_LISTENING_PARTS !== "undefined" ? TOEIC_LISTENING_PARTS : ["1","2","3","4"];
    const readingParts = typeof TOEIC_READING_PARTS !== "undefined" ? TOEIC_READING_PARTS : ["5","6","7"];
    const hasSelectedListening = selectedParts.some((partNumber) => listeningParts.includes(partNumber));
    const hasSelectedReading = selectedParts.some((partNumber) => readingParts.includes(partNumber));
    const sectionLabel = hasSelectedListening && hasSelectedReading
      ? "Listening + Reading"
      : (hasSelectedListening ? "Listening" : "Reading");

    if (practiceLabel) practiceLabel.textContent = `${setMeta.label} - ${sectionLabel}`;
    if (practiceTitle) practiceTitle.textContent = `Làm ${safeFormatToeicPartSelection(selectedParts)}`;
    if (submitButton) submitButton.textContent = "Nộp bài";

    let localQuestions = getQuestions();
    if (localQuestions && localQuestions.length > 0) {
      questions = localQuestions;
      loadExamState();
      renderFullExam();
      if (!timerId) timerId = window.setInterval(tick, 1000);
      if (!heartbeatTimerId) heartbeatTimerId = window.setInterval(saveExamState, 15000);
    } else {
      if (question) {
        question.hidden = false;
        question.innerHTML = `<div style="text-align:center;padding:32px 16px;color:#00f0ff;font-size:1.1rem;font-weight:600;"><span class="spinner" style="display:inline-block;animation:spin 1s linear infinite;margin-right:8px;">⏳</span> Đang kết nối Database và tải dữ liệu câu hỏi đề thi...</div>`;
      }
      if (answers) answers.innerHTML = "";
    }

    const apiQuestions = await fetchQuestionsFromApi(selectedSet, selectedParts);
    if (apiQuestions && apiQuestions.length > 0) {
      questions = apiQuestions;
      loadExamState();
      renderFullExam();
      if (!timerId) timerId = window.setInterval(tick, 1000);
      if (!heartbeatTimerId) heartbeatTimerId = window.setInterval(saveExamState, 15000);
    } else if (!questions || !questions.length) {
      window.clearInterval(timerId);
      timerId = null;
      if (progress) progress.textContent = "0 / 0";
      if (part) part.textContent = "Chưa có dữ liệu";
      if (question) {
        question.hidden = false;
        question.innerHTML = `<span style="color:#f87171;font-size:1.05rem;">⚠️ Bộ đề <strong>${escapeHtml(selectedSet.replace("y", ""))}</strong> hiện chưa có dữ liệu câu hỏi cho <strong>${safeFormatToeicPartSelection(selectedParts)}</strong>.<br><br>Vui lòng chọn Part khác (ví dụ: Part 5 hoặc Part 6) hoặc chọn năm đề thi khác (2017, 2018...).</span>`;
      }
      if (answers) answers.innerHTML = "";
      if (result) result.hidden = true;
    }
  }

  function handleQuestionJump(questionId) {
    if (!questionId) return;
    const targetQuestion = questions.find(q => q.id === questionId);
    if (!targetQuestion) return;

    if (targetQuestion.partNumber !== activePartNumber) {
      activePartNumber = targetQuestion.partNumber;
    }

    const groups = getPartQuestionGroups(activePartNumber);
    const targetGroupIdx = groups.findIndex(g => g.items.some(i => i.id === questionId));
    activeGroupIndex = targetGroupIdx >= 0 ? targetGroupIdx : 0;

    renderFullExam();

    setTimeout(() => {
      const targetEl = document.getElementById(`question-${questionId}`) || document.querySelector(`[data-exam-question-item]`);
      if (targetEl) {
        targetEl.classList.add("highlight-target");
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => targetEl.classList.remove("highlight-target"), 1600);
      }
    }, 60);
  }

  submitButton?.addEventListener("click", openSubmitConfirm);
  
  answers.addEventListener("click", (event) => {
    const flagBtn = event.target.closest("[data-toggle-flag]");
    if (flagBtn) {
      const qId = flagBtn.dataset.toggleFlag;
      if (flaggedQuestions.has(qId)) flaggedQuestions.delete(qId);
      else flaggedQuestions.add(qId);
      saveExamState();
      renderFullExam();
      return;
    }

    const navBtn = event.target.closest("[data-nav-group]");
    if (navBtn) {
      const dir = navBtn.dataset.navGroup;
      const currentGroups = getPartQuestionGroups(activePartNumber);
      if (dir === "prev" && activeGroupIndex > 0) {
        activeGroupIndex -= 1;
        saveExamState();
        renderFullExam();
        window.scrollTo({ top: 160, behavior: "smooth" });
      } else if (dir === "next" && activeGroupIndex < currentGroups.length - 1) {
        activeGroupIndex += 1;
        saveExamState();
        renderFullExam();
        window.scrollTo({ top: 160, behavior: "smooth" });
      }
      return;
    }

    const rateButton = event.target.closest("[data-audio-rate]");
    if (rateButton) {
      setAudioRate(Number(rateButton.dataset.audioRate));
      rateButton.closest("details")?.removeAttribute("open");
      return;
    }

    const ttsButton = event.target.closest("[data-tts-play]");
    if (ttsButton) {
      toggleTts(ttsButton);
      return;
    }

    const tabBtn = event.target.closest("[data-tab-part]");
    if (tabBtn) {
      const clickedPart = tabBtn.dataset.tabPart;
      if (clickedPart !== activePartNumber) {
        activePartNumber = clickedPart;
        activeGroupIndex = 0;
        saveExamState();
        renderFullExam();
      }
      return;
    }

    const input = event.target.closest("[data-exam-answer-id]");
    if (input) chooseFullExamAnswer(input);
  });

  answers.addEventListener("play", (event) => {
    const audio = event.target.closest?.("audio");
    if (!audio) return;
    stopActiveTts();
    answers.querySelectorAll("audio").forEach((item) => {
      if (item !== audio) item.pause();
      item.playbackRate = audioRate;
    });

    audio.onended = () => {
      const card = audio.closest("[data-exam-question-item], .exam-question-card");
      if (card) {
        card.querySelectorAll("input[data-exam-answer-id]").forEach(inp => {
          unlockedAudioQuestions.add(inp.dataset.examAnswerId);
        });
        renderFullExam();
      }
    };
  }, true);

  answers.addEventListener("ratechange", (event) => {
    const audio = event.target.closest?.("audio");
    if (!audio) return;
    if (audio.playbackRate !== audioRate) {
      setAudioRate(audio.playbackRate);
    }
  }, true);

  part.addEventListener("click", (event) => {
    const filterBtn = event.target.closest("[data-minimap-filter]");
    if (filterBtn) {
      currentMinimapFilter = filterBtn.dataset.minimapFilter;
      renderMinimap();
      return;
    }

    if (event.target.closest("[data-side-submit-exam]")) {
      openSubmitConfirm();
      return;
    }
    const jumpButton = event.target.closest("[data-exam-jump]");
    if (!jumpButton) return;
    
    handleQuestionJump(jumpButton.dataset.examJump);
  });

  result.addEventListener("click", (event) => {
    if (event.target.closest("[data-restart-exam]")) startExam();
  });

  document.addEventListener("click", (event) => {
    const gapMarker = event.target.closest("[data-gap-qno]");
    if (gapMarker) {
      const qNo = gapMarker.dataset.gapQno;
      document.querySelectorAll(".gap-marker").forEach(m => m.classList.remove("is-active-gap"));
      gapMarker.classList.add("is-active-gap");

      const targetQ = questions.find(q => String(q.questionNo) === String(qNo));
      if (targetQ) handleQuestionJump(targetQ.id);
      return;
    }

    if (event.target.closest("[data-submit-confirm-close]") || event.target.matches("[data-submit-confirm-modal]")) {
      closeSubmitConfirm();
      return;
    }
    const jumpButton = event.target.closest("[data-confirm-jump]");
    if (jumpButton) {
      closeSubmitConfirm();
      handleQuestionJump(jumpButton.dataset.confirmJump);
      return;
    }
    if (event.target.closest("[data-submit-confirm-accept]")) finishExam();
  });

  document.addEventListener("mouseup", (event) => {
    const passagePane = event.target.closest(".exam-passage-pane");
    if (!passagePane) {
      document.querySelector(".exam-highlight-toolbar")?.remove();
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      document.querySelector(".exam-highlight-toolbar")?.remove();
      return;
    }

    document.querySelector(".exam-highlight-toolbar")?.remove();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const paneRect = passagePane.getBoundingClientRect();

    const toolbar = document.createElement("div");
    toolbar.className = "exam-highlight-toolbar";
    toolbar.style.top = `${rect.top - paneRect.top + passagePane.scrollTop - 8}px`;
    toolbar.style.left = `${rect.left - paneRect.left + rect.width / 2}px`;
    toolbar.innerHTML = `<button type="button" data-action-highlight>🖊️ Tô màu</button>`;
    passagePane.appendChild(toolbar);

    toolbar.querySelector("[data-action-highlight]").addEventListener("click", (e) => {
      e.stopPropagation();
      try {
        const mark = document.createElement("mark");
        mark.className = "exam-user-highlight";
        range.surroundContents(mark);
      } catch (err) {}
      toolbar.remove();
      window.getSelection()?.removeAllRanges();
    });
  });

  loadEnglishSpeechVoices();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = loadEnglishSpeechVoices;
  }
  window.addEventListener("beforeunload", stopActiveTts);

  try {
    startExam();
  } catch (err) {
    console.error("Critical error in initToeicExamPractice:", err);
    if (question) {
      question.hidden = false;
      question.innerHTML = `<span style="color:#f87171;">⚠️ Có lỗi xảy ra khi nạp câu hỏi: ${escapeHtml(err.message || err)}. Vui lòng tải lại trang.</span>`;
    }
  }
}

if (typeof window !== "undefined") {
  window.initToeicExamPractice = initToeicExamPractice;
  window.initExamPractice = initToeicExamPractice;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initToeicExamPractice);
} else {
  initToeicExamPractice();
}
