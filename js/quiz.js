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

function getSetMeta(setId) {
  return TOEIC_READING_SETS.find((set) => set.id === setId) || TOEIC_READING_SETS[TOEIC_READING_SETS.length - 1];
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
  const partNote = document.querySelector("[data-exam-part-note]");
  let selectedSet = "y2025";

  document.querySelectorAll("[data-exam-set]").forEach((card) => {
    const setId = card.dataset.examSet;
    const completedParts = ["5", "6", "7"].filter((part) => localStorage.getItem(getExamCompletionKey(setId, part)) === "done");
    const completedText = completedParts.length ? `Đã làm ${completedParts.length}/3 Part` : "Chưa làm Part nào";
    const partStatus = ["5", "6", "7"].map((part) => `
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
      if (title) title.textContent = `TOEIC Reading Test ${card.dataset.examYear || setId.replace("y", "")}`;
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
  let selectedParts = (params.get("parts") || params.get("part") || "5")
    .split(",")
    .filter((part, index, parts) => ["5", "6", "7"].includes(part) && parts.indexOf(part) === index);
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
  const responses = new Map();

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

  function renderQuestionText(item) {
    if (!item.passage) return escapeHtml(item.question);
    return `
      <span class="exam-passage">${escapeHtml(item.passage)}</span>
      <span class="exam-question-text">${escapeHtml(item.question)}</span>
    `;
  }

  function renderQuestionPrompt(item) {
    return `<span class="exam-question-text">${escapeHtml(item.question)}</span>`;
  }

  function renderOptions(item) {
    return `
      <div class="exam-option-list">
        ${item.displayOptions.map((option, optionIndex) => `
          <label class="${responses.get(item.id) === option ? "is-selected" : ""}">
            <input type="radio" name="${item.id}" value="${escapeHtml(option)}" data-exam-answer-id="${item.id}" data-exam-answer-value="${escapeHtml(option)}">
            <span>${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option)}</span>
          </label>
        `).join("")}
      </div>
    `;
  }

  function renderExamCard(item, questionIndex) {
    return `
      <fieldset class="exam-question-card" id="question-${item.id}" data-exam-question-item>
        <legend>Câu ${item.questionNo || questionIndex + 1}${item.group ? ` - ${escapeHtml(item.group)}` : ""}</legend>
        <div class="exam-question-body">${renderQuestionText(item)}</div>
        ${renderOptions(item)}
      </fieldset>
    `;
  }

  function renderPart7Group(groupItems) {
    const first = groupItems[0];
    const questionNumbers = groupItems.map((item) => item.questionNo).filter(Boolean);
    const range = questionNumbers.length > 1
      ? `${questionNumbers[0]}-${questionNumbers[questionNumbers.length - 1]}`
      : `${questionNumbers[0] || ""}`;

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

      if (item.partNumber === "7" && item.passage) {
        const groupItems = [item];
        while (
          questions[index + 1]?.partNumber === "7" &&
          questions[index + 1]?.passage === item.passage &&
          questions[index + 1]?.group === item.group
        ) {
          index += 1;
          groupItems.push(questions[index]);
        }
        cards.push(renderPart7Group(groupItems));
        continue;
      }

      cards.push(renderExamCard(item, index));
    }
    return cards.join("");
  }

  function getQuestions() {
    return toeicReadingQuestionBank.filter((item) => item.set === selectedSet && selectedParts.includes(item.partNumber))
      .map((item) => ({ ...item, displayOptions: shuffle(item.options) }));
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
    question.innerHTML = renderQuestionText(current);
    explain.hidden = false;
    explain.textContent = `${setMeta.label} - chọn đáp án đúng nhất. Kết quả và giải thích sẽ hiển thị sau khi nộp bài.`;
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
        <span>${selectedParts.map((partNumber) => `Part ${partNumber}`).join(" + ")}</span>
        <small>MiniMap trạng thái</small>
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
          <p class="exam-submit-question">U a ready submit ?</p>
          ${canSubmit ? "" : `<p class="exam-submit-warning">Bạn hãy hoàn thành ít nhất 1 câu để nộp bài.</p>`}
          <div class="exam-submit-actions">
            <button type="button" class="btn btn-ghost" data-submit-confirm-close>Quay lại làm bài</button>
            <button type="button" class="btn btn-primary" data-submit-confirm-accept ${canSubmit ? "" : "disabled"}>Nộp bài</button>
          </div>
        </div>
      </div>
    `);
  }

  function renderFullExam() {
    const setMeta = getSetMeta(selectedSet);
    question.closest(".wireframe-question")?.removeAttribute("hidden");
    countdown.textContent = formatTime(timeLeft);

    question.innerHTML = `
      <span class="exam-all-title">${setMeta.label}</span>
      <span class="exam-question-text">Tất cả câu hỏi được hiển thị cùng lúc. Chọn đủ đáp án rồi bấm Nộp bài.</span>
    `;
    explain.hidden = false;
    explain.textContent = "Minimap bên phải cho biết câu nào đã làm và câu nào chưa làm.";
    explain.classList.remove("is-reviewing", "is-correct", "is-wrong");
    result.hidden = true;
    result.innerHTML = "";
    answers.innerHTML = renderExamCards();
    renderMinimap();
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
        <h2 class="exam-finished-title" style="font-size: calc(var(--title-size, clamp(1.18rem, 2.2vw, 1.65rem)) + 10px);">Congratulations on completing the reading section!</h2>
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
              <summary>Câu ${item.questionNo || index + 1}: ${selected ? (isCorrect ? "Đúng" : "Sai") : "Chưa làm"} - đáp án ${escapeHtml(item.answer)}</summary>
              <div class="exam-review-question">${renderQuestionText(item)}</div>
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
    questions = getQuestions();
    correct = 0;
    finished = false;
    timeLeft = readingSeconds;
    responses.clear();
    window.clearInterval(timerId);

    if (practiceLabel) practiceLabel.textContent = `${setMeta.label} - Reading`;
    if (practiceTitle) practiceTitle.textContent = `Làm ${selectedParts.map((partNumber) => `Part ${partNumber}`).join(" + ")}`;
    submitButton.textContent = "Nộp bài";

    renderFullExam();
    timerId = window.setInterval(tick, 1000);
  }

  submitButton?.addEventListener("click", openSubmitConfirm);
    answers.addEventListener("click", (event) => {
    const input = event.target.closest("[data-exam-answer-id]");
    if (input) chooseFullExamAnswer(input);
  });
  part.addEventListener("click", (event) => {
    if (event.target.closest("[data-side-submit-exam]")) {
      openSubmitConfirm();
      return;
    }
    const jumpButton = event.target.closest("[data-exam-jump]");
    if (!jumpButton) return;
    document.getElementById(`question-${jumpButton.dataset.examJump}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
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
      document.getElementById(`question-${jumpButton.dataset.confirmJump}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (event.target.closest("[data-submit-confirm-accept]")) finishExam();
  });

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

