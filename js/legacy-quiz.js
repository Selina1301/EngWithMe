// Legacy quiz form and generic mini-quiz interactions.
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
