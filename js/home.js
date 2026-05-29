function initHomeSuggestion() {
  const section = document.querySelector("[data-today-suggestion]");
  if (!section) return;

  const roadmap = [
    ...Array.from({ length: 7 }, (_, index) => ({
      day: index + 1,
      skill: "Vocabulary",
      label: "Từ vựng",
      href: "vocabulary.html",
      tasks: ["Học 12 từ mới theo chủ đề", "Ôn flashcard trong 8 phút", "Lưu lại 3 từ khó để xem lại"]
    })),
    ...Array.from({ length: 3 }, (_, index) => ({
      day: index + 8,
      skill: "Reading",
      label: "Đọc hiểu",
      href: "reading.html",
      tasks: ["Đọc 1 đoạn ngắn", "Trả lời câu hỏi kiểm tra ý chính", "Ghi lại 3 cụm từ hoặc cấu trúc hay"]
    })),
    ...Array.from({ length: 7 }, (_, index) => ({
      day: index + 11,
      skill: "Grammar",
      label: "Ngữ pháp",
      href: "grammar.html",
      tasks: ["Ôn 1 điểm ngữ pháp trọng tâm", "Làm 10 câu luyện tập", "Xem lại lỗi sai và ghi chú quy tắc"]
    }))
  ];

  const state = updateHomeLearningStreak();
  const planProgress = getHomePlanProgress(roadmap.length);
  const completedDays = planProgress.completedDays;
  const planDay = Math.min(completedDays + 1, roadmap.length);
  const todayPlan = roadmap[planDay - 1];
  const progress = Math.round((completedDays / roadmap.length) * 100);
  const heading = section.querySelector("[data-today-title]");
  const description = section.querySelector("[data-today-description]");
  const progressCard = section.querySelector("[data-plan-progress-card]");
  const streakCard = section.querySelector("[data-streak-card]");
  const skillCard = section.querySelector("[data-skill-card]");
  const taskButton = section.querySelector("[data-today-task-toggle]");
  const taskPanel = section.querySelector("[data-today-tasks]");

  if (heading) heading.textContent = `Ngày ${planDay}: học ${todayPlan.label}`;
  if (description) {
    description.textContent = `Bạn đã hoàn thành ${completedDays}/${roadmap.length} ngày. Bài tiếp theo là ngày ${planDay}: ${todayPlan.label.toLowerCase()}. Bài sau chỉ mở khi bài trước được hoàn thành thật trong khu học.`;
  }
  if (progressCard) {
    progressCard.querySelector("strong").textContent = `${progress}%`;
    progressCard.querySelector("span").textContent = `${completedDays}/${roadmap.length} ngày hoàn thành`;
  }
  if (streakCard) {
    streakCard.querySelector("strong").textContent = `${state.streak} ngày`;
    streakCard.querySelector("span").textContent = "Streak học tập";
  }
  if (skillCard) {
    skillCard.querySelector("strong").textContent = todayPlan.skill;
    skillCard.querySelector("span").textContent = `Ngày ${planDay}: ${todayPlan.label}`;
  }
  if (taskButton) {
    taskButton.textContent = "Nhiệm vụ hôm nay";
    if (taskButton.tagName !== "A") {
      taskButton.setAttribute("aria-expanded", "false");
    }
  }
  if (taskPanel) {
    taskPanel.innerHTML = `
      <h3>Nhiệm vụ ngày ${planDay}</h3>
      <ul>
        ${todayPlan.tasks.map((task) => `<li>${task}</li>`).join("")}
      </ul>
      <a class="btn btn-light" href="${todayPlan.href}">Vào học ${todayPlan.label.toLowerCase()}</a>
    `;
  }

  if (taskButton?.tagName === "A") return;

  taskButton?.addEventListener("click", () => {
    const isHidden = taskPanel?.hasAttribute("hidden");
    taskPanel?.toggleAttribute("hidden", !isHidden);
    taskButton.setAttribute("aria-expanded", String(Boolean(isHidden)));
  });
}

function updateHomeLearningStreak() {
  const storageKey = typeof getAccountKey === "function"
    ? getAccountKey("engWithMeHomeLearningStreak")
    : "engWithMeHomeLearningStreak_guest";
  const today = getLocalDateKey(new Date());
  const saved = getStoredHomeLearningState(storageKey);
  const yesterday = getLocalDateKey(addDays(new Date(), -1));
  let streak = Number(saved.streak) || 0;

  if (saved.lastOnlineDate === today) {
    streak = Math.max(streak, 1);
  } else if (saved.lastOnlineDate === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  const nextState = {
    streak,
    firstOnlineDate: saved.firstOnlineDate || today,
    lastOnlineDate: today
  };
  localStorage.setItem(storageKey, JSON.stringify(nextState));
  return nextState;
}

function getHomePlanProgress(totalDays) {
  const storageKey = typeof getAccountKey === "function"
    ? getAccountKey("engWithMeLearningPlanProgress")
    : "engWithMeLearningPlanProgress_guest";
  const saved = getStoredHomeLearningState(storageKey);
  const completedDays = Math.min(Math.max(Number(saved.completedDays) || 0, 0), totalDays);
  return { completedDays };
}

function getStoredHomeLearningState(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch (error) {
    return {};
  }
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
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
      const response = await fetch("api/send_contact.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (feedback) {
          feedback.textContent = result.message || "Gửi góp ý thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.";
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
