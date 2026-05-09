function initQuiz() {
  const form = document.querySelector("[data-quiz-form]");
  const list = document.querySelector("[data-quiz-list]");
  const result = document.querySelector("[data-quiz-result]");
  const resetButton = document.querySelector("[data-reset-quiz]");
  if (!form || !list || !result) return;

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
    localStorage.setItem("engWithMeLastScore", `${correct}/${quizQuestions.length}`);
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
  const ratio = correct / total;
  if (ratio >= 0.9) return "B2";
  if (ratio >= 0.7) return "B1";
  if (ratio >= 0.45) return "A2";
  return "A1";
}

function getRecommendedLesson(level) {
  const lessons = {
    A1: "Greetings and Introductions",
    A2: "Present Simple và Daily Activities",
    B1: "Listening for Main Ideas",
    B2: "IELTS Foundation Reading"
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
