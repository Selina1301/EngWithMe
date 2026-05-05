const vocabularies = [
  {
    word: "hello",
    pronunciation: "/heˈləʊ/",
    meaning: "xin chào",
    example: "Hello, my name is Anna.",
    category: "greetings"
  },
  {
    word: "improve",
    pronunciation: "/ɪmˈpruːv/",
    meaning: "cải thiện",
    example: "I want to improve my English.",
    category: "study"
  },
  {
    word: "listen",
    pronunciation: "/ˈlɪsən/",
    meaning: "lắng nghe",
    example: "Listen to the audio and repeat.",
    category: "study"
  },
  {
    word: "breakfast",
    pronunciation: "/ˈbrekfəst/",
    meaning: "bữa sáng",
    example: "I have breakfast at seven o'clock.",
    category: "daily"
  },
  {
    word: "introduce",
    pronunciation: "/ˌɪntrəˈduːs/",
    meaning: "giới thiệu",
    example: "Please introduce yourself.",
    category: "greetings"
  },
  {
    word: "practice",
    pronunciation: "/ˈpræktɪs/",
    meaning: "luyện tập",
    example: "Practice speaking every day.",
    category: "study"
  }
];

const quizQuestions = [
  {
    id: "q1",
    question: "She ___ to school every day.",
    options: ["go", "goes", "going", "gone"],
    answer: "goes"
  },
  {
    id: "q2",
    question: "Nice to meet you có nghĩa là gì?",
    options: ["Bạn tên gì?", "Rất vui được gặp bạn", "Tạm biệt", "Tôi đến từ Việt Nam"],
    answer: "Rất vui được gặp bạn"
  },
  {
    id: "q3",
    question: "Từ nào có nghĩa là cải thiện?",
    options: ["listen", "practice", "improve", "introduce"],
    answer: "improve"
  },
  {
    id: "q4",
    question: "I ___ English in the evening.",
    options: ["study", "studies", "studying", "studied"],
    answer: "study"
  },
  {
    id: "q5",
    question: "Where are you from?",
    options: ["I am from Vietnam.", "I am fine.", "My name is Anna.", "Good morning."],
    answer: "I am from Vietnam."
  }
];

document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  setActiveNav();
  initVocabulary();
  initQuiz();
  initMiniQuizzes();
  initProgressButtons();
  initAuthForms();
  initDashboard();
  initResults();
  initRecorder();
  initHomeSuggestion();
  initHomeInteractions();
  initContactForm();
  updateHomeFaq();
});

function setCurrentYear() {
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}

function setActiveNav() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage || href === `${currentPage}#`) {
      link.classList.add("is-active");
    }
  });
}

function getSavedWords() {
  return JSON.parse(localStorage.getItem("englishPathSavedWords") || "[]");
}

function setSavedWords(words) {
  localStorage.setItem("englishPathSavedWords", JSON.stringify(words));
}

function updateSavedCount() {
  const count = getSavedWords().length;
  document.querySelectorAll("[data-saved-count]").forEach((element) => {
    element.textContent = `${count} từ đã lưu`;
  });
}

function initVocabulary() {
  const list = document.querySelector("[data-vocab-list]");
  const filter = document.querySelector("#vocabFilter");
  if (!list) return;

  const render = () => {
    const selected = filter ? filter.value : "all";
    const savedWords = getSavedWords();
    const visibleWords = selected === "all"
      ? vocabularies
      : vocabularies.filter((item) => item.category === selected);

    list.innerHTML = visibleWords.map((item) => {
      const isSaved = savedWords.includes(item.word);
      return `
        <article class="vocab-card" data-word="${item.word}">
          <div class="vocab-card-inner">
            <div class="vocab-front">
              <div>
                <div class="vocab-word">${item.word}</div>
                <div class="vocab-pronunciation">${item.pronunciation}</div>
                <p>${item.example}</p>
              </div>
              <div class="vocab-card-actions">
                <button class="btn btn-secondary" type="button" data-flip-card>Lật thẻ</button>
                <button class="btn btn-primary" type="button" data-save-word>${isSaved ? "Đã lưu" : "Lưu từ"}</button>
              </div>
            </div>
            <div class="vocab-back">
              <div>
                <p class="eyebrow">Nghĩa tiếng Việt</p>
                <div class="vocab-word">${item.meaning}</div>
                <p>Chủ đề: ${formatCategory(item.category)}</p>
              </div>
              <button class="btn btn-secondary" type="button" data-flip-card>Quay lại</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
    updateSavedCount();
  };

  render();
  filter?.addEventListener("change", render);

  list.addEventListener("click", (event) => {
    const flipButton = event.target.closest("[data-flip-card]");
    const saveButton = event.target.closest("[data-save-word]");
    const card = event.target.closest(".vocab-card");
    if (!card) return;

    if (flipButton) {
      card.classList.toggle("is-flipped");
    }

    if (saveButton) {
      const word = card.dataset.word;
      const savedWords = getSavedWords();
      const nextWords = savedWords.includes(word)
        ? savedWords.filter((item) => item !== word)
        : [...savedWords, word];
      setSavedWords(nextWords);
      render();
    }
  });
}

function formatCategory(category) {
  const labels = {
    greetings: "Greetings",
    daily: "Daily activities",
    study: "Study"
  };
  return labels[category] || category;
}

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
    localStorage.setItem("englishPathLastScore", `${correct}/${quizQuestions.length}`);
    localStorage.setItem("englishPathLevel", level);

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

function initProgressButtons() {
  const completed = JSON.parse(localStorage.getItem("englishPathProgress") || "[]");

  document.querySelectorAll("[data-progress-id]").forEach((button) => {
    const id = button.dataset.progressId;
    if (completed.includes(id)) {
      button.textContent = "Đã hoàn thành";
      button.classList.remove("btn-secondary");
      button.classList.add("btn-primary");
    }

    button.addEventListener("click", () => {
      const current = JSON.parse(localStorage.getItem("englishPathProgress") || "[]");
      const next = current.includes(id) ? current : [...current, id];
      localStorage.setItem("englishPathProgress", JSON.stringify(next));
      button.textContent = "Đã hoàn thành";
      button.classList.remove("btn-secondary");
      button.classList.add("btn-primary");
    });
  });
}

function initHomeSuggestion() {
  const section = document.querySelector("[data-today-suggestion]");
  if (!section) return;

  const plans = [
    {
      title: "Học nhanh 10 phút",
      description: "Một phiên học gọn gồm 4 phút ôn từ vựng, 4 phút nghe mẫu và 2 phút quiz nhanh để giữ nhịp mỗi ngày."
    },
    {
      title: "Học chuẩn 25 phút",
      description: "Một buổi học cân bằng gồm 10 phút từ vựng, 10 phút ngữ pháp hoặc nghe, 5 phút quiz nhanh để chốt kiến thức."
    },
    {
      title: "Tăng tốc 40 phút",
      description: "Một phiên học sâu gồm 15 phút nghe đọc, 15 phút luyện cấu trúc câu và 10 phút làm bài kiểm tra ngắn."
    }
  ];
  const focusSkills = ["Listening", "Vocabulary", "Grammar", "Speaking", "Reading"];
  const plan = plans[Math.floor(Math.random() * plans.length)];
  const textPanel = section.firstElementChild;
  const heading = textPanel?.querySelector("h2");
  const description = Array.from(textPanel?.querySelectorAll("p") || [])
    .find((element) => !element.classList.contains("eyebrow"));
  const statItems = section.querySelectorAll(".stat-panel div");

  if (heading) heading.textContent = plan.title;
  if (description) description.textContent = plan.description;
  if (statItems[0]) statItems[0].querySelector("strong").textContent = `${getRandomInt(42, 94)}%`;
  if (statItems[1]) statItems[1].querySelector("strong").textContent = `${getRandomInt(1, 12)} ngày`;
  if (statItems[2]) {
    statItems[2].querySelector("strong").textContent = focusSkills[Math.floor(Math.random() * focusSkills.length)];
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initHomeInteractions() {
  const pathSteps = document.querySelectorAll(".path-guide .path-step");
  const cards = document.querySelectorAll(".home-feature-grid .feature-card");
  if (!pathSteps.length || !cards.length) return;

  const clearActive = () => pathSteps.forEach((step) => step.classList.remove("is-active"));
  cards.forEach((card, index) => {
    card.tabIndex = 0;
    const activate = () => {
      clearActive();
      pathSteps[index]?.classList.add("is-active");
    };
    card.addEventListener("mouseenter", activate);
    card.addEventListener("focusin", activate);
    card.addEventListener("mouseleave", clearActive);
    card.addEventListener("focusout", clearActive);
  });
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const feedback = form.querySelector("[data-contact-feedback]");
    if (feedback) {
      feedback.textContent = "Đã nhận góp ý demo. Khi có backend, form này sẽ gửi dữ liệu về admin.";
      feedback.style.color = "var(--success)";
    }
    form.reset();
  });
}

function updateHomeFaq() {
  const thirdFaq = document.querySelector(".faq-list details:nth-of-type(3)");
  if (!thirdFaq) return;

  const summary = thirdFaq.querySelector("summary");
  const answer = thirdFaq.querySelector("p");
  if (summary) summary.textContent = "Tôi nên học bao lâu mỗi ngày để thấy tiến bộ?";
  if (answer) answer.textContent = "Bạn có thể bắt đầu với 10 phút nếu bận, duy trì 25 phút để học đều, hoặc chọn 40 phút khi muốn tăng tốc trước kỳ kiểm tra.";
}

function initAuthForms() {
  const registerForm = document.querySelector("[data-register-form]");
  const loginForm = document.querySelector("[data-login-form]");

  registerForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(registerForm);
    localStorage.setItem("englishPathStudentName", data.get("name") || "Nguyễn Văn A");
    localStorage.setItem("englishPathGoal", data.get("goal") || "Giao tiếp hằng ngày");
    showAuthFeedback(registerForm, "Đăng ký demo thành công. Đang chuyển sang dashboard...");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 700);
  });

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    showAuthFeedback(loginForm, "Đăng nhập demo thành công. Đang chuyển sang dashboard...");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 700);
  });
}

function showAuthFeedback(form, message) {
  const feedback = form.querySelector("[data-auth-feedback]");
  if (feedback) {
    feedback.textContent = message;
    feedback.style.color = "var(--success)";
  }
}

function initDashboard() {
  const nameElement = document.querySelector("[data-student-name]");
  const levelElement = document.querySelector("[data-student-level]");
  const progressElement = document.querySelector("[data-dashboard-progress]");
  if (!nameElement && !levelElement && !progressElement) return;

  const name = localStorage.getItem("englishPathStudentName") || "Nguyễn Văn A";
  const level = localStorage.getItem("englishPathLevel") || "A2";
  const completed = JSON.parse(localStorage.getItem("englishPathProgress") || "[]");
  const progress = Math.min(100, 65 + completed.length * 8);

  if (nameElement) nameElement.textContent = name;
  if (levelElement) levelElement.textContent = level;
  if (progressElement) progressElement.textContent = `${progress}%`;
}

function initResults() {
  const lastScore = localStorage.getItem("englishPathLastScore");
  const savedWords = getSavedWords().length;

  document.querySelectorAll("[data-last-score], [data-last-score-table]").forEach((element) => {
    element.textContent = lastScore || "Chưa có";
  });

  document.querySelectorAll("[data-saved-words-result]").forEach((element) => {
    element.textContent = savedWords;
  });
}

function initRecorder() {
  const startButton = document.querySelector("[data-record-start]");
  const stopButton = document.querySelector("[data-record-stop]");
  const audio = document.querySelector("[data-record-audio]");
  const feedback = document.querySelector("[data-record-feedback]");
  if (!startButton || !stopButton || !audio) return;

  let mediaRecorder;
  let chunks = [];

  startButton.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (feedback) feedback.textContent = "Trình duyệt chưa hỗ trợ ghi âm.";
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];
      mediaRecorder.addEventListener("dataavailable", (event) => chunks.push(event.data));
      mediaRecorder.addEventListener("stop", () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        audio.src = URL.createObjectURL(blob);
        stream.getTracks().forEach((track) => track.stop());
        if (feedback) feedback.textContent = "Đã ghi âm. Hãy nghe lại và so sánh với câu mẫu.";
      });
      mediaRecorder.start();
      startButton.disabled = true;
      stopButton.disabled = false;
      if (feedback) feedback.textContent = "Đang ghi âm...";
    } catch (error) {
      if (feedback) feedback.textContent = "Không thể mở micro. Hãy chạy bằng localhost và cấp quyền micro.";
    }
  });

  stopButton.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      startButton.disabled = false;
      stopButton.disabled = true;
    }
  });
}
