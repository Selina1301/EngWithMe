function initHomeSuggestion() {
  const section = document.querySelector("[data-today-suggestion]");
  if (!section) return;

  const plans = [
    {
      title: "Học nhanh 10 phút",
      description: "Một phiên học gọn gồm 4 phút ôn từ vựng, 4 phút đọc mẫu và 2 phút xem lại dạng đề để giữ nhịp mỗi ngày."
    },
    {
      title: "Học chuẩn 25 phút",
      description: "Một buổi học cân bằng gồm 10 phút từ vựng, 10 phút ngữ pháp hoặc đọc, 5 phút xem lại dạng đề để chốt kiến thức."
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
