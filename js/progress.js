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
