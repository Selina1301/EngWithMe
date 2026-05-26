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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const feedback = form.querySelector("[data-contact-feedback]");
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton?.innerHTML;

    // Set loading state
    if (feedback) {
      feedback.textContent = "Đang gửi góp ý của bạn...";
      feedback.style.color = "var(--muted)";
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="ti-reload spinner"></span> Đang gửi...';
    }

    const formData = new FormData(form);

    // Prepare payload formatted for FormSubmit API
    const payload = {
      "Họ tên": formData.get("name"),
      "Số điện thoại": formData.get("phone"),
      "Email": formData.get("email"),
      "Tiêu đề": formData.get("title"),
      "Nội dung": formData.get("message"),
      "_subject": "EngWithMe - Góp ý mới: " + formData.get("title"),
      "_captcha": "false" // Disable captcha for smooth user experience
    };

    try {
      const response = await fetch("https://formsubmit.co/ajax/efd4322bff58b17e507bbc634769ef5a", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success === "true") {
        if (feedback) {
          feedback.textContent = "Gửi góp ý thành công! Thông tin đã được gửi trực tiếp đến email của Admin.";
          feedback.style.color = "var(--success)";
        }
        form.reset();
      } else {
        throw new Error(result.message || "Không gửi được qua API.");
      }
    } catch (error) {
      if (feedback) {
        feedback.textContent = "Gửi thất bại. Hãy kiểm tra kết nối mạng của bạn và thử lại.";
        feedback.style.color = "var(--danger)";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText || '<i class="ti-email"></i> Gửi góp ý';
      }
    }
  });
}


