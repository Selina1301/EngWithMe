function initHomeSuggestion() {
  const section = document.querySelector("[data-today-suggestion]");
  if (!section) return;

  const planProgress = getHomePlanProgress(17);
  const completedDays = planProgress.completedDays;
  const planDay = Math.min(completedDays + 1, 17);

  // Get active targets to build dynamic links
  const accountKeyFn = typeof getAccountKey === "function" ? getAccountKey : (k) => k + "_guest";
  const vocabTargetsKey = accountKeyFn("engWithMePlanVocabularyTargets");
  
  let vocabTargets = [];
  try {
    const stored = JSON.parse(localStorage.getItem(vocabTargetsKey) || "{}");
    vocabTargets = Array.isArray(stored.targets) ? stored.targets : [];
  } catch (e) {}

  if (vocabTargets.length === 0) {
    vocabTargets = [
      { id: "daily-life", levelKey: "easy", name: "Đời sống hằng ngày" },
      { id: "school", levelKey: "easy", name: "Trường học" },
      { id: "food", levelKey: "easy", name: "Ăn uống" },
      { id: "fruits", levelKey: "easy", name: "Loại quả" },
      { id: "flowers", levelKey: "easy", name: "Loài hoa" },
      { id: "plants", levelKey: "easy", name: "Cây cối" },
      { id: "animals", levelKey: "easy", name: "Con vật" }
    ];
  }

  const readingTargets = [
    { id: "schedule-change", title: "Schedule Change" },
    { id: "office-supplies", title: "Office Supplies" },
    { id: "client-visit", title: "Client Visit" }
  ];

  const grammarTargets = [
    { id: "tu-loai", title: "Từ loại" },
    { id: "thi", title: "Thì" },
    { id: "danh-tu", title: "Danh từ" },
    { id: "dong-tu", title: "Động từ" },
    { id: "tinh-tu", title: "Tính từ" },
    { id: "trang-tu", title: "Trạng từ" },
    { id: "mao-tu", title: "Mạo từ" }
  ];

  const roadmap = [
    ...Array.from({ length: 7 }, (_, index) => {
      const target = vocabTargets[index] || { id: "daily-life", levelKey: "easy", name: "Từ vựng" };
      return {
        day: index + 1,
        skill: "Vocabulary",
        label: "Từ vựng",
        href: `vocabulary-study.html?level=${target.levelKey}&topic=${target.id}&mode=study&planDay=${index + 1}`,
        tasks: [`Học chủ đề ${target.name || "Từ vựng"}`, "Ôn flashcard trong 8 phút", "Lưu lại 3 từ khó để xem lại"]
      };
    }),
    ...Array.from({ length: 3 }, (_, index) => {
      const target = readingTargets[index];
      return {
        day: index + 8,
        skill: "Reading",
        label: "Đọc hiểu",
        href: `reading.html#${target.id}`,
        tasks: [`Đọc bài "${target.title}"`, "Trả lời câu hỏi kiểm tra ý chính", "Ghi lại 3 cụm từ hoặc cấu trúc hay"]
      };
    }),
    ...Array.from({ length: 7 }, (_, index) => {
      const target = grammarTargets[index];
      return {
        day: index + 11,
        skill: "Grammar",
        label: "Ngữ pháp",
        href: `grammar.html#${target.id}`,
        tasks: [`Ôn chủ đề "${target.title}"`, "Làm 10 câu luyện tập", "Xem lại lỗi sai và ghi chú quy tắc"]
      };
    })
  ];

  const state = updateHomeLearningStreak();
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
  const accountKeyFn = typeof getAccountKey === "function" ? getAccountKey : (k) => k + "_guest";
  
  // 1. Get Vocabulary completion
  const vocabTargetsKey = accountKeyFn("engWithMePlanVocabularyTargets");
  let vocabTargets = [];
  try {
    const stored = JSON.parse(localStorage.getItem(vocabTargetsKey) || "{}");
    vocabTargets = Array.isArray(stored.targets) ? stored.targets : [];
  } catch (e) {}

  if (vocabTargets.length === 0) {
    vocabTargets = [
      { id: "daily-life", levelKey: "easy" },
      { id: "school", levelKey: "easy" },
      { id: "food", levelKey: "easy" },
      { id: "fruits", levelKey: "easy" },
      { id: "flowers", levelKey: "easy" },
      { id: "plants", levelKey: "easy" },
      { id: "animals", levelKey: "easy" }
    ];
  }

  const viewedVocabKey = accountKeyFn("engWithMeViewedTopics");
  let viewedVocab = [];
  try {
    viewedVocab = JSON.parse(localStorage.getItem(viewedVocabKey) || "[]");
    if (!Array.isArray(viewedVocab)) viewedVocab = [];
  } catch (e) {}

  const isVocabularyComplete = (target) => {
    return viewedVocab.some((topic) => topic?.level === target.levelKey && topic?.id === target.id);
  };

  // 2. Get Reading completion
  const viewedReadingKey = accountKeyFn("engWithMeViewedReadingTopics");
  let viewedReading = [];
  try {
    viewedReading = JSON.parse(localStorage.getItem(viewedReadingKey) || "[]");
    if (!Array.isArray(viewedReading)) viewedReading = [];
  } catch (e) {}

  const readingTargets = [
    { id: "schedule-change" },
    { id: "office-supplies" },
    { id: "client-visit" }
  ];

  const isReadingComplete = (target) => {
    return viewedReading.includes(target.id);
  };

  // 3. Get Grammar completion
  const grammarPracticeKey = accountKeyFn("engWithMeGrammarPractice");
  let grammarPractice = {};
  try {
    grammarPractice = JSON.parse(localStorage.getItem(grammarPracticeKey) || "{}");
    if (typeof grammarPractice !== "object" || grammarPractice === null) grammarPractice = {};
  } catch (e) {}

  const grammarTargets = [
    { id: "tu-loai", exerciseCount: 10 },
    { id: "thi", exerciseCount: 10 },
    { id: "danh-tu", exerciseCount: 10 },
    { id: "dong-tu", exerciseCount: 10 },
    { id: "tinh-tu", exerciseCount: 10 },
    { id: "trang-tu", exerciseCount: 10 },
    { id: "mao-tu", exerciseCount: 10 }
  ];

  const isGrammarComplete = (target) => {
    const solved = Array.isArray(grammarPractice[target.id]) ? grammarPractice[target.id] : [];
    return solved.length >= target.exerciseCount;
  };

  // 4. Calculate completedDays sequentially
  let completedDays = 0;

  // Check Vocabulary Days (Days 1 to 7)
  for (let i = 0; i < 7; i++) {
    const target = vocabTargets[i];
    if (target && isVocabularyComplete(target)) {
      completedDays += 1;
    } else {
      break;
    }
  }

  // Check Reading Days (Days 8 to 10)
  if (completedDays === 7) {
    for (let i = 0; i < 3; i++) {
      const target = readingTargets[i];
      if (isReadingComplete(target)) {
        completedDays += 1;
      } else {
        break;
      }
    }
  }

  // Check Grammar Days (Days 11 to 17)
  if (completedDays === 10) {
    for (let i = 0; i < 7; i++) {
      const target = grammarTargets[i];
      if (isGrammarComplete(target)) {
        completedDays += 1;
      } else {
        break;
      }
    }
  }

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

function initScrollIndicator() {
  const indicator = document.querySelector(".hero-scroll-indicator");
  if (!indicator) return;

  const handleScroll = () => {
    // Hide when scrolled past 65% of the total scrollable height of the home page
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const threshold = maxScroll > 0 ? maxScroll * 0.65 : window.innerHeight * 0.70;
    if (window.scrollY > threshold) {
      indicator.classList.add("fade-out");
    } else {
      indicator.classList.remove("fade-out");
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
}
