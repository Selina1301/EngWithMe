// TOEIC quiz page and practice-session behavior.
// Exam data is loaded from toeic-reading-data.js before this file.
function initQuiz() {
  initExamOverviewV2();
  initExamPractice();
  initLegacyQuizForm();
}

function getExamCompletionKey(set, part) {
  return getAccountKey(`engWithMeExamCompleted_${set}_${part}`);
}

const TOEIC_READING_PARTS = ["5", "6", "7"];
const TOEIC_LISTENING_PARTS = ["1", "2", "3", "4"];
const TOEIC_PART_CONFIG = {
  1: { label: "Part 1 - 6 câu (1-6)", shortLabel: "Part 1" },
  2: { label: "Part 2 - 25 câu (7-31)", shortLabel: "Part 2" },
  3: { label: "Part 3 - 39 câu (32-70)", shortLabel: "Part 3" },
  4: { label: "Part 4 - 30 câu (71-100)", shortLabel: "Part 4" },
  5: { label: "Part 5 - 30 câu (101-130)", shortLabel: "Part 5" },
  6: { label: "Part 6 - 16 câu (131-146)", shortLabel: "Part 6" },
  7: { label: "Part 7 - 54 câu (147-200)", shortLabel: "Part 7" }
};

function getListeningExam(setId) {
  if (typeof TOEIC_LISTENING_EXAMS === "undefined") return null;
  return TOEIC_LISTENING_EXAMS[setId] || null;
}

function hasListeningExam(setId) {
  const exam = getListeningExam(setId);
  return Array.isArray(exam?.questions) && exam.questions.length > 0;
}

function getExamPartsForSet(setId) {
  return hasListeningExam(setId) ? [...TOEIC_LISTENING_PARTS, ...TOEIC_READING_PARTS] : [...TOEIC_READING_PARTS];
}

function getSetMeta(setId) {
  const readingMeta = TOEIC_READING_SETS.find((set) => set.id === setId) || TOEIC_READING_SETS[TOEIC_READING_SETS.length - 1];
  const listeningMeta = getListeningExam(setId)?.meta;
  if (!listeningMeta) return readingMeta;
  return {
    ...readingMeta,
    ...listeningMeta,
    label: listeningMeta.fullLabel || readingMeta?.label || listeningMeta.label
  };
}

function getExamTitle(setId, year) {
  const displayYear = year || setId.replace("y", "");
  return hasListeningExam(setId) ? `TOEIC Test ${displayYear}` : `TOEIC Reading Test ${displayYear}`;
}

function formatToeicPartSelection(parts) {
  const numbers = parts
    .map((partNumber) => Number(partNumber))
    .filter(Number.isFinite)
    .sort((first, second) => first - second);

  if (!numbers.length) return "Part";
  if (numbers.length === 1) return `Part ${numbers[0]}`;

  const isConsecutive = numbers.every((partNumber, index) => index === 0 || partNumber === numbers[index - 1] + 1);
  if (isConsecutive) return `Parts ${numbers[0]}-${numbers[numbers.length - 1]}`;

  return `Parts ${numbers.join(", ")}`;
}

function initExamOverview() {
  document.querySelectorAll("[data-exam-link]").forEach((link) => {
    const [set, part] = link.dataset.examLink.split("-");
    if (localStorage.getItem(getExamCompletionKey(set, part)) === "done") {
      link.classList.add("is-completed");
      link.setAttribute("aria-label", `${link.textContent.trim()} đã làm`);
    }
  });

  const partNote = document.querySelector("[data-exam-part-note]");
  document.querySelectorAll("[data-select-part]").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      if (partNote) partNote.textContent = `${item.textContent.trim()} đang được mở cho đề 2025.`;
    });
  });
}

function initExamOverviewV2() {
  const modal = document.querySelector("[data-exam-config-modal]");
  const form = document.querySelector("[data-exam-config-form]");
  const title = document.querySelector("[data-exam-config-title]");
  const error = document.querySelector("[data-exam-config-error]");
  const customMinutes = document.querySelector("[data-custom-minutes]");
  const partOptions = document.querySelector("[data-exam-part-options]");
  const partNote = document.querySelector("[data-exam-part-note]");
  let selectedSet = "y2025";

  function renderPartOptions(setId) {
    if (!partOptions) return;
    const parts = getExamPartsForSet(setId);
    partOptions.innerHTML = parts.map((partNumber, index) => {
      const partConfig = TOEIC_PART_CONFIG[partNumber] || { label: `Part ${partNumber}`, shortLabel: `Part ${partNumber}` };
      return `
        <label><input type="checkbox" name="part" value="${partNumber}" ${index === 0 ? "checked" : ""}> <span>${partConfig.label}</span></label>
      `;
    }).join("");
  }

  renderPartOptions(selectedSet);

  document.querySelectorAll("[data-exam-set]").forEach((card) => {
    const setId = card.dataset.examSet;
    const availableParts = getExamPartsForSet(setId);
    const completedParts = availableParts.filter((part) => localStorage.getItem(getExamCompletionKey(setId, part)) === "done");
    const completedText = completedParts.length ? `Đã làm ${completedParts.length}/${availableParts.length} Part` : "Chưa làm Part nào";
    const partStatus = availableParts.map((part) => `
      <span class="${completedParts.includes(part) ? "is-done" : ""}">Part ${part}</span>
    `).join("");
    card.insertAdjacentHTML("beforeend", `
      <div class="exam-card-status" aria-label="Trạng thái làm bài">
        <strong>${completedText}</strong>
        <span class="exam-card-status-parts">${partStatus}</span>
      </div>
    `);

    card.addEventListener("click", () => {
      selectedSet = setId;
      document.querySelectorAll("[data-exam-set]").forEach((item) => item.classList.toggle("is-selected", item === card));
      renderPartOptions(selectedSet);
      if (title) title.textContent = getExamTitle(setId, card.dataset.examYear);
      if (partNote) partNote.textContent = `Đang chọn đề ${card.dataset.examYear || setId.replace("y", "")}.`;
      if (error) error.hidden = true;
      if (typeof modal?.showModal === "function") modal.showModal();
      else modal?.setAttribute("open", "");
    });
  });

  document.querySelectorAll("[data-exam-modal-close]").forEach((button) => {
    button.addEventListener("click", () => modal?.close());
  });

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });

  customMinutes?.addEventListener("input", () => {
    form?.querySelector('input[name="minutes"][value="custom"]')?.click();
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const parts = [...form.querySelectorAll('input[name="part"]:checked')].map((input) => input.value);
    const selectedTime = form.querySelector('input[name="minutes"]:checked')?.value || "30";
    const minutes = selectedTime === "custom" ? Number(customMinutes?.value) : Number(selectedTime);

    if (!parts.length || !Number.isFinite(minutes) || minutes < 1) {
      if (error) error.hidden = false;
      return;
    }

    const url = new URL("exam-practice.html", window.location.href);
    url.searchParams.set("set", selectedSet);
    url.searchParams.set("parts", parts.join(","));
    url.searchParams.set("minutes", String(Math.min(minutes, 180)));
    window.location.href = url.toString();
  });
}

function initExamPractice() {
  const root = document.querySelector("[data-exam-practice]");
  if (!root) return;

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

  const validSets = TOEIC_READING_SETS.map((set) => set.id);
  const params = new URLSearchParams(window.location.search);
  let selectedSet = validSets.includes(params.get("set")) ? params.get("set") : "y2025";
  const availableParts = getExamPartsForSet(selectedSet);
  let selectedParts = (params.get("parts") || params.get("part") || availableParts[0] || "5")
    .split(",")
    .filter((part, index, parts) => availableParts.includes(part) && parts.indexOf(part) === index);
  if (!selectedParts.length) selectedParts = [availableParts[0] || "5"];
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
  const responses = new Map();
  const audioRateOptions = [0.75, 1, 1.25, 1.5];
  const audioRateKey = getAccountKey("engWithMeToeicAudioRate");
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
      <div class="exam-audio-speed" aria-label="Audio playback speed">
        <span>Speed</span>
        <div>
          ${audioRateOptions.map((rate) => `
            <button class="${rate === audioRate ? "is-active" : ""}" type="button" data-audio-rate="${rate}">
              ${getAudioRateLabel(rate)}
            </button>
          `).join("")}
        </div>
      </div>
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
          ${renderAudioSpeedControls()}
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

  function renderOptions(item) {
    const answerSheetOnly = item.section === "listening" && ["1", "2"].includes(item.partNumber);
    return `
      <div class="exam-option-list${answerSheetOnly ? " exam-answer-sheet" : ""}">
        ${item.displayOptions.map((option, optionIndex) => `
          <label class="${responses.get(item.id) === option ? "is-selected" : ""}"${answerSheetOnly ? ` aria-label="Answer ${String.fromCharCode(65 + optionIndex)}"` : ""}>
            <input type="radio" name="${item.id}" value="${escapeHtml(option)}" data-exam-answer-id="${item.id}" data-exam-answer-value="${escapeHtml(option)}">
            ${answerSheetOnly
              ? `<span class="exam-option-letter">${String.fromCharCode(65 + optionIndex)}</span>`
              : `<span>${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option)}</span>`}
          </label>
        `).join("")}
      </div>
    `;
  }

  function renderExamCard(item, questionIndex) {
    return `
      <fieldset class="exam-question-card" id="question-${item.id}" data-exam-question-item>
        <legend>Câu ${item.questionNo || questionIndex + 1}${item.group ? ` - ${escapeHtml(item.group)}` : ""}</legend>
        <div class="exam-question-body">${renderAttemptQuestionText(item)}</div>
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
                <div class="exam-question-body">
                  <strong>Câu ${item.questionNo}</strong>
                  ${renderQuestionPrompt(item)}
                </div>
                ${renderOptions(item)}
              </section>
            `).join("")}
          </div>
        </fieldset>
      `;
    }

    return `
      <fieldset class="exam-question-card exam-passage-card">
        <legend>Câu ${range}${first.group ? ` - ${escapeHtml(first.group)}` : ""}</legend>
        <div class="exam-passage">${escapeHtml(first.passage)}</div>
        <div class="exam-grouped-question-list">
          ${groupItems.map((item) => `
            <section class="exam-grouped-question" id="question-${item.id}" data-exam-question-item>
              <div class="exam-question-body">
                <strong>Câu ${item.questionNo}</strong>
                ${renderQuestionPrompt(item)}
              </div>
              ${renderOptions(item)}
            </section>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function renderExamCards() {
    const cards = [];
    for (let index = 0; index < questions.length; index += 1) {
      const item = questions[index];
      
      if (item.partNumber !== activePartNumber) continue;

      const shouldGroup = (
        (item.section === "reading" && item.partNumber === "7" && item.passage) ||
        (item.section === "listening" && ["3", "4"].includes(item.partNumber) && item.group)
      );

      if (shouldGroup) {
        const groupItems = [item];
        while (
          questions[index + 1]?.section === item.section &&
          questions[index + 1]?.partNumber === item.partNumber &&
          questions[index + 1]?.passage === item.passage &&
          questions[index + 1]?.group === item.group
        ) {
          index += 1;
          groupItems.push(questions[index]);
        }
        cards.push(renderGroupedQuestionSet(groupItems));
        continue;
      }

      cards.push(renderExamCard(item, index));
    }
    return cards.join("");
  }

  function getQuestions() {
    const bank = Array.isArray(window.toeicExamQuestionBank)
      ? window.toeicExamQuestionBank
      : (typeof toeicExamQuestionBank !== "undefined" ? toeicExamQuestionBank : toeicReadingQuestionBank);

    return bank.filter((item) => item.set === selectedSet && selectedParts.includes(item.partNumber))
      .map((item) => ({
        ...item,
        displayOptions: item.section === "listening" ? [...item.options] : shuffle(item.options)
      }));
  }

  function tick() {
    timeLeft -= 1;
    countdown.textContent = formatTime(Math.max(timeLeft, 0));
    part.querySelectorAll("[data-exam-side-countdown]").forEach((item) => {
      item.textContent = formatTime(Math.max(timeLeft, 0));
    });
    if (timeLeft <= 0) finishExam();
  }

  function renderQuestion() {
    const current = questions[currentIndex];
    const total = questions.length;
    const setMeta = getSetMeta(selectedSet);
    question.closest(".wireframe-question")?.removeAttribute("hidden");


    countdown.textContent = formatTime(timeLeft);
    progress.textContent = `Question ${currentIndex + 1} / ${total}`;
    part.textContent = current.part;
    question.hidden = false;
    question.innerHTML = renderAttemptQuestionText(current);
    explain.hidden = true;
    explain.textContent = "";
    explain.classList.remove("is-reviewing", "is-correct", "is-wrong");
    result.hidden = true;
    result.innerHTML = "";

    const selectedAnswer = responses.get(current.id);
    answers.innerHTML = current.displayOptions.map((option, index) => `
      <button class="${selectedAnswer === option ? "is-selected" : ""}" type="button" data-exam-answer-index="${index}">
        ${String.fromCharCode(65 + index)}. ${escapeHtml(option)}
      </button>
    `).join("");
  }

  function moveToNextQuestion() {
    if (finished) return;
    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
      renderQuestion();
      return;
    }
    finishExam();
  }

  function chooseAnswer(button) {
    if (finished || !questions[currentIndex]) return;
    const current = questions[currentIndex];
    const selected = current.displayOptions[Number(button.dataset.examAnswerIndex)];
    responses.set(current.id, selected);
    answers.querySelectorAll("button").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    window.setTimeout(moveToNextQuestion, 180);
  }

  function renderMinimap() {
    const total = questions.length;
    const done = responses.size;
    const skipped = total - done;
    const minimap = questions.map((item, index) => `
      <button class="${responses.has(item.id) ? "is-done" : ""}" type="button" data-exam-jump="${item.id}" aria-label="Câu ${item.questionNo || index + 1}">
        ${item.questionNo || index + 1}
      </button>
    `).join("");

    progress.innerHTML = `
      <span>Đã làm ${done} / ${total}</span>
      <span>Còn ${skipped} câu</span>
    `;
    part.innerHTML = `
      <div class="exam-side-head">
        <span>${formatToeicPartSelection(selectedParts)}</span>
        <small>Answer sheet</small>
      </div>
      <div class="exam-side-tools">
        <span class="exam-side-timer" data-exam-side-countdown>${formatTime(timeLeft)}</span>
        <span class="exam-side-progress">Đã làm ${done}/${total}</span>
        <button type="button" class="exam-side-submit" data-side-submit-exam>Nộp bài</button>
      </div>
      <span class="exam-minimap">${minimap}</span>
      <span class="exam-minimap-status" aria-label="Chú thích trạng thái câu hỏi">
        <span class="is-done">Đã chọn đáp án</span>
        <span>Chưa làm</span>
      </span>
    `;
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
    const setMeta = getSetMeta(selectedSet);
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
      renderMinimap();
      return;
    }
    responses.set(qId, aVal);

    const questionItem = input.closest("[data-exam-question-item]");
    questionItem?.querySelectorAll(".exam-option-list label").forEach((label) => label.classList.remove("is-selected"));
    input.closest("label")?.classList.add("is-selected");
    renderMinimap();
  }

  function finishExam() {
    if (finished) return;
    closeSubmitConfirm();
    stopActiveTts();
    window.clearInterval(timerId);
    timerId = null;
    finished = true;
    correct = questions.reduce((total, item) => total + (responses.get(item.id) === item.answer ? 1 : 0), 0);
    const total = questions.length;
    const skipped = total - responses.size;
    const percent = Math.round((correct / total) * 100);
    const level = getRecommendedLevel(correct, total);

    const completedPartNumbers = selectedParts.filter((partNumber) => {
      const partQuestions = questions.filter((item) => item.partNumber === partNumber);
      return partQuestions.length > 0 && partQuestions.every((item) => responses.has(item.id));
    });

    localStorage.setItem(getAccountKey("engWithMeLastScore"), `${correct}/${total}`);
    completedPartNumbers.forEach((partNumber) => localStorage.setItem(getExamCompletionKey(selectedSet, partNumber), "done"));
    localStorage.setItem("engWithMeLevel", level);

    // Sync to DB
    const userId = localStorage.getItem("engWithMeUserId");
    if (userId) {
      try {
        const body = new FormData();
        body.append("test_set", selectedSet);
        body.append("test_parts", selectedParts.join(","));
        body.append("score", `${correct}/${total}`);
        body.append("correct_count", correct);
        body.append("total_questions", total);
        body.append("recommended_level", level);
        fetch("api/test_results.php", {
          method: "POST",
          body,
          credentials: "same-origin"
        });
      } catch (e) {
        console.error("Failed to save test result to database:", e);
      }
    }

    progress.textContent = `Hoàn thành ${responses.size} / ${total}`;
    countdown.textContent = formatTime(Math.max(timeLeft, 0));
    part.textContent = "Kết quả";
    question.innerHTML = "";
    question.closest(".wireframe-question")?.setAttribute("hidden", "");
    answers.innerHTML = "";
    explain.textContent = "";
    explain.hidden = true;
    result.hidden = false;
    result.innerHTML = `
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 class="exam-finished-title" style="font-size: calc(var(--title-size, clamp(1.18rem, 2.2vw, 1.65rem)) + 10px);">Congratulations on completing the TOEIC practice test!</h2>
      </div>
      <h3>Kết quả: ${correct}/${total} câu đúng (${percent}%)</h3>
      <div class="exam-score-grid">
        <div><span>Đúng</span><strong>${correct}</strong></div>
        <div><span>Sai</span><strong>${total - skipped - correct}</strong></div>
        <div><span>Chưa làm</span><strong>${skipped}</strong></div>
        <div><span>Tỷ lệ đúng</span><strong>${percent}%</strong></div>
      </div>
      <p>Trình độ đề xuất: <strong>${level}</strong>. Bài nên học tiếp: ${getRecommendedLesson(level)}.</p>
      <div class="exam-review-list">
        ${questions.map((item, index) => {
          const selected = responses.get(item.id);
          const isCorrect = selected === item.answer;
          return `
            <details ${!isCorrect ? "open" : ""}>
<<<<<<< HEAD
              <summary>Câu ${item.questionNo || index + 1}: ${selected ? (isCorrect ? "Đúng" : "Sai") : "Chưa làm"} - đáp án ${escapeHtml(item.answer)}</summary>
              <div class="exam-review-question">${renderReviewQuestionText(item)}</div>
=======
              <summary class="${selected ? (isCorrect ? "is-correct" : "is-wrong") : "is-missing"}">Câu ${item.questionNo || index + 1}: ${selected ? (isCorrect ? "Đúng" : "Sai") : "Chưa làm"} - đáp án ${escapeHtml(item.answer)}</summary>
              <div class="exam-review-question">${renderQuestionText(item)}</div>
>>>>>>> 3ffe208 (update_Navi&Exam)
              <p>Đáp án của bạn: <strong>${selected ? escapeHtml(selected) : "Chưa chọn"}</strong></p>
              <p>${escapeHtml(item.explain)}</p>
            </details>
          `;
        }).join("")}
      </div>
      <button class="btn btn-primary" type="button" data-restart-exam>Làm lại đề</button>
    `;
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startExam() {
    const setMeta = getSetMeta(selectedSet);
    stopActiveTts();
    questions = getQuestions();
    correct = 0;
    finished = false;
    timeLeft = readingSeconds;
    responses.clear();
    window.clearInterval(timerId);

    const hasSelectedListening = selectedParts.some((partNumber) => TOEIC_LISTENING_PARTS.includes(partNumber));
    const hasSelectedReading = selectedParts.some((partNumber) => TOEIC_READING_PARTS.includes(partNumber));
    const sectionLabel = hasSelectedListening && hasSelectedReading
      ? "Listening + Reading"
      : (hasSelectedListening ? "Listening" : "Reading");

    if (practiceLabel) practiceLabel.textContent = `${setMeta.label} - ${sectionLabel}`;
    if (practiceTitle) practiceTitle.textContent = `Làm ${formatToeicPartSelection(selectedParts)}`;
    submitButton.textContent = "Nộp bài";

    if (!questions.length) {
      window.clearInterval(timerId);
      progress.textContent = "Không có câu hỏi";
      part.textContent = "Chưa có dữ liệu";
      question.hidden = false;
      question.innerHTML = "Đề này chưa có dữ liệu cho Part đã chọn.";
      answers.innerHTML = "";
      result.hidden = true;
      return;
    }

    renderFullExam();
    timerId = window.setInterval(tick, 1000);
  }

  submitButton?.addEventListener("click", openSubmitConfirm);
  
  answers.addEventListener("click", (event) => {
    const rateButton = event.target.closest("[data-audio-rate]");
    if (rateButton) {
      setAudioRate(Number(rateButton.dataset.audioRate));
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
  }, true);

  part.addEventListener("click", (event) => {
    if (event.target.closest("[data-side-submit-exam]")) {
      openSubmitConfirm();
      return;
    }
    const jumpButton = event.target.closest("[data-exam-jump]");
    if (!jumpButton) return;
    
    const questionId = jumpButton.dataset.examJump;
    const targetQuestion = questions.find(q => q.id === questionId);
    
    if (targetQuestion && targetQuestion.partNumber !== activePartNumber) {
      activePartNumber = targetQuestion.partNumber;
      renderFullExam();
    }
    
    setTimeout(() => {
      document.getElementById(`question-${questionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  });

  result.addEventListener("click", (event) => {
    if (event.target.closest("[data-restart-exam]")) startExam();
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-submit-confirm-close]") || event.target.matches("[data-submit-confirm-modal]")) {
      closeSubmitConfirm();
      return;
    }
    const jumpButton = event.target.closest("[data-confirm-jump]");
    if (jumpButton) {
      closeSubmitConfirm();
      
      const questionId = jumpButton.dataset.confirmJump;
      const targetQuestion = questions.find(q => q.id === questionId);
      
      if (targetQuestion && targetQuestion.partNumber !== activePartNumber) {
        activePartNumber = targetQuestion.partNumber;
        renderFullExam();
      }

      setTimeout(() => {
        document.getElementById(`question-${questionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    if (event.target.closest("[data-submit-confirm-accept]")) finishExam();
  });

  loadEnglishSpeechVoices();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = loadEnglishSpeechVoices;
  }
  window.addEventListener("beforeunload", stopActiveTts);

  startExam();
}

function initLegacyQuizForm() {
  const form = document.querySelector("[data-quiz-form]");
  const list = document.querySelector("[data-quiz-list]");
  const result = document.querySelector("[data-quiz-result]");
  const resetButton = document.querySelector("[data-reset-quiz]");
  if (!form || !list || !result || !Array.isArray(window.quizQuestions)) return;

  list.innerHTML = quizQuestions.map((question, index) => `
    <fieldset class="question-card">
      <legend><strong>Câu ${index + 1}:</strong> ${question.question}</legend>
      <div class="question-options">
        ${question.options.map((option) => `
          <label>
            <input type="radio" name="${question.id}" value="${option}" required>
            <span>${option}</span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `).join("");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let correct = 0;

    quizQuestions.forEach((question) => {
      const selected = form.querySelector(`input[name="${question.id}"]:checked`);
      if (selected?.value === question.answer) correct += 1;
    });

    const level = getRecommendedLevel(correct, quizQuestions.length);
    const percent = Math.round((correct / quizQuestions.length) * 100);
    localStorage.setItem(getAccountKey("engWithMeLastScore"), `${correct}/${quizQuestions.length}`);
    localStorage.setItem("engWithMeLevel", level);

    // Sync to DB
    const userId = localStorage.getItem("engWithMeUserId");
    if (userId) {
      try {
        const body = new FormData();
        body.append("test_set", "placement");
        body.append("test_parts", "all");
        body.append("score", `${correct}/${quizQuestions.length}`);
        body.append("correct_count", correct);
        body.append("total_questions", quizQuestions.length);
        body.append("recommended_level", level);
        fetch("api/test_results.php", {
          method: "POST",
          body,
          credentials: "same-origin"
        });
      } catch (e) {
        console.error("Failed to save quiz result to database:", e);
      }
    }

    result.hidden = false;
    result.innerHTML = `
      <h2>Kết quả: ${correct}/${quizQuestions.length} câu đúng (${percent}%)</h2>
      <p>Trình độ đề xuất: <strong>${level}</strong></p>
      <p>Bài nên học tiếp: ${getRecommendedLesson(level)}</p>
      <a class="btn btn-primary" href="dashboard.html">Xem dashboard</a>
    `;
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  resetButton?.addEventListener("click", () => {
    form.reset();
    result.hidden = true;
    result.innerHTML = "";
  });
}

function getRecommendedLevel(correct, total) {
  const ratio = total ? correct / total : 0;
  if (ratio >= 0.9) return "B2";
  if (ratio >= 0.7) return "B1";
  if (ratio >= 0.45) return "A2";
  return "A1";
}

function getRecommendedLesson(level) {
  const lessons = {
    A1: "Greetings and Introductions",
    A2: "Present Simple và Daily Activities",
    B1: "TOEIC Reading Strategies",
    B2: "Advanced Business Reading"
  };
  return lessons[level] || lessons.A1;
}

function initMiniQuizzes() {
  document.querySelectorAll(".mini-quiz").forEach((quiz) => {
    quiz.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-answer]");
      if (!button) return;
      const feedback = quiz.querySelector(".feedback") || quiz.querySelector("[data-vocab-feedback]");
      const isCorrect = button.dataset.answer === "correct";
      if (feedback) {
        feedback.textContent = isCorrect ? "Chính xác. Bạn có thể chuyển sang bài tiếp theo." : "Chưa đúng. Hãy thử lại hoặc xem lại ví dụ.";
        feedback.style.color = isCorrect ? "var(--success)" : "var(--accent)";
      }
    });
  });
}

