function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

async function initProfile() {
  const profileForm = document.querySelector("[data-profile-form]");
  const passwordForm = document.querySelector("[data-password-form]");

  // 1. Quản lý Chuyển Tab (Tab Navigation)
  initProfileTabs();

  // Render Dashboard Progress UI
  renderDashboardProgressUI();

  // 2. Tải thông tin người dùng từ API me.php
  try {
    const response = await fetch("api/me.php", { credentials: "same-origin" });
    if (!response.ok) {
      window.location.href = "login.html";
      return;
    }

    const result = await response.json();
    if (!result.ok || !result.user) {
      window.location.href = "login.html";
      return;
    }

    if (typeof persistAuthUser === "function") {
      persistAuthUser(result.user);
    }
    if (typeof renderAuthenticatedNav === "function") {
      renderAuthenticatedNav(result.user);
    }

    if (profileForm) {
      fillProfileForm(profileForm, result.user);
    }
  } catch (error) {
    const feedback = profileForm?.querySelector("[data-auth-feedback]");
    if (feedback) {
      feedback.textContent = "Không tải được thông tin hồ sơ. Vui lòng kiểm tra kết nối server.";
      feedback.style.color = "var(--danger)";
    }
  }

  // 3. Xử lý Live Avatar Upload Preview
  initAvatarPreview(profileForm);

  // 4. Xử lý Nút chọn Mục tiêu nhanh (Goal Chips)
  initGoalPresets();

  // 5. Xử lý Đo độ mạnh mật khẩu (Password Strength Meter)
  initPasswordStrength();

  // 6. Xử lý Submit Form Cập nhật Thông tin cá nhân (Save & Back)
  if (profileForm) {
    let lastSubmitAction = "save_and_back";
    
    profileForm.querySelectorAll('[data-submit-action]').forEach((btn) => {
      btn.addEventListener("click", () => {
        lastSubmitAction = btn.dataset.submitAction || "save_and_back";
      });
    });

    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtns = profileForm.querySelectorAll('button[type="submit"]');

      try {
        submitBtns.forEach((btn) => {
          btn.disabled = true;
        });

        const response = await fetch("api/profile.php", {
          method: "POST",
          body: new FormData(profileForm),
          credentials: "same-origin"
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          showProfileFeedback(profileForm, result.message || "Không thể lưu hồ sơ.", false);
          return;
        }

        if (typeof persistAuthUser === "function") {
          persistAuthUser(result.user);
        }
        fillProfileForm(profileForm, result.user);
        if (typeof renderAuthenticatedNav === "function") {
          renderAuthenticatedNav(result.user);
        }
        showProfileFeedback(profileForm, result.message || "Đã lưu hồ sơ cá nhân thành công!", true);

        // Nếu bấm "Save & Back" -> Tự động chuyển về trang Tổng quan Profile
        if (lastSubmitAction === "save_and_back") {
          setTimeout(() => {
            const dashboardTabBtn = document.querySelector('[data-tab-target="dashboard"]');
            dashboardTabBtn?.click();
          }, 600);
        }
      } catch (error) {
        showProfileFeedback(profileForm, "Không thể kết nối đến máy chủ.", false);
      } finally {
        submitBtns.forEach((btn) => {
          btn.disabled = false;
        });
      }
    });
  }

  // 7. Xử lý Submit Form Đổi mật khẩu
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = passwordForm.querySelector('.btn-save-password');
      const originalText = submitBtn ? submitBtn.innerHTML : "Đổi mật khẩu";

      const currentPass = passwordForm.elements.current_password?.value || "";
      const newPass = passwordForm.elements.new_password?.value || "";
      const confirmPass = passwordForm.elements.confirm_password?.value || "";

      if (newPass.length < 6) {
        showProfileFeedback(passwordForm, "Mật khẩu mới phải có tối thiểu 6 ký tự.", false);
        return;
      }

      if (newPass !== confirmPass) {
        showProfileFeedback(passwordForm, "Mật khẩu xác nhận chưa trùng khớp.", false);
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner"></span> Đang cập nhật mật khẩu...';
        }

        const response = await fetch("api/change_password.php", {
          method: "POST",
          body: new FormData(passwordForm),
          credentials: "same-origin"
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          showProfileFeedback(passwordForm, result.message || "Không thể đổi mật khẩu.", false);
          return;
        }

        showProfileFeedback(passwordForm, result.message || "Đã đổi mật khẩu bảo mật thành công!", true);
        passwordForm.reset();
        const strengthBox = document.getElementById("passwordStrengthBox");
        if (strengthBox) strengthBox.style.display = "none";
      } catch (error) {
        showProfileFeedback(passwordForm, "Lỗi kết nối khi đổi mật khẩu.", false);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }
}

// Chuyển đổi Tab linh hoạt & Tự động nhận diện URL Hash (#dashboard, #info, #security)
function initProfileTabs() {
  const tabButtons = document.querySelectorAll("[data-tab-target]");
  const tabContents = document.querySelectorAll(".profile-tab-content");

  function switchTab(tabId) {
    if (!document.getElementById(`tab-${tabId}`)) return;

    tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tabTarget === tabId);
    });
    tabContents.forEach((content) => {
      content.classList.toggle("active", content.id === `tab-${tabId}`);
    });

    if (tabId === "dashboard" && typeof renderDashboardProgressUI === "function") {
      renderDashboardProgressUI();
    }
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tabTarget;
      switchTab(target);
      if (history.pushState) {
        history.pushState(null, null, `#${target}`);
      } else {
        location.hash = `#${target}`;
      }
    });
  });

  function applyHashTab() {
    const hash = (window.location.hash || "").replace("#", "");
    if (hash && document.getElementById(`tab-${hash}`)) {
      switchTab(hash);
    }
  }

  window.addEventListener("hashchange", applyHashTab);

  // Delegate click sự kiện cho tất cả các link chứa hash (ví dụ menu Header click Dashboard -> #dashboard)
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href*='#']");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (href.includes("#")) {
      const hashPart = href.split("#")[1];
      if (hashPart && document.getElementById(`tab-${hashPart}`)) {
        switchTab(hashPart);
      }
    }
  });

  applyHashTab();
}

// Live Avatar Preview khi người dùng chọn file ảnh mới
function initAvatarPreview(form) {
  if (!form) return;
  const avatarInputs = form.querySelectorAll('input[type="file"][name="avatar"], input[type="file"][name="avatar_button"]');

  avatarInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        showProfileFeedback(form, "Ảnh đại diện tối đa 2MB. Vui lòng chọn ảnh nhỏ hơn.", false);
        input.value = "";
        return;
      }

      // Đảm bảo cả 2 input đều có cùng file để submit form chuẩn
      avatarInputs.forEach((inp) => {
        if (inp !== input && input.files) {
          inp.files = input.files;
        }
      });

      const previewUser = {
        name: form.elements.name?.value || localStorage.getItem("engWithMeStudentName") || "Tài khoản",
        avatar: URL.createObjectURL(file)
      };
      renderProfileAvatars(previewUser);
    });
  });
}

// Điền nhanh Mục tiêu học tập
function initGoalPresets() {
  const goalInput = document.getElementById("goalInput");
  if (!goalInput) return;

  document.querySelectorAll("[data-goal-preset]").forEach((chip) => {
    chip.addEventListener("click", () => {
      goalInput.value = chip.dataset.goalPreset || "";
      goalInput.focus();
    });
  });
}

// Thanh đo độ mạnh mật khẩu & khớp mật khẩu
function initPasswordStrength() {
  const newPassInput = document.getElementById("newPasswordInput");
  const confirmPassInput = document.getElementById("confirmPasswordInput");
  const strengthBox = document.getElementById("passwordStrengthBox");
  const strengthFill = document.getElementById("strengthBarFill");
  const strengthText = document.getElementById("strengthText");

  if (!newPassInput || !strengthBox || !strengthFill || !strengthText) return;

  newPassInput.addEventListener("input", () => {
    const val = newPassInput.value;
    if (!val) {
      strengthBox.style.display = "none";
      return;
    }

    strengthBox.style.display = "flex";
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;

    strengthFill.className = "strength-bar-fill";
    strengthText.className = "strength-text";

    if (score <= 2) {
      strengthFill.classList.add("weak");
      strengthText.classList.add("weak");
      strengthText.textContent = "Độ bảo mật: Yếu (Nên thêm số và chữ hoa)";
    } else if (score <= 4) {
      strengthFill.classList.add("medium");
      strengthText.classList.add("medium");
      strengthText.textContent = "Độ bảo mật: Trung bình";
    } else {
      strengthFill.classList.add("strong");
      strengthText.classList.add("strong");
      strengthText.textContent = "Độ bảo mật: Rất mạnh 🔒";
    }
  });

  // Toggle Password Eye Icons
  document.querySelectorAll(".input-password-wrapper .toggle-password").forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", () => {
      const input = toggleBtn.previousElementSibling;
      if (!input || input.tagName !== "INPUT") return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggleBtn.classList.toggle("ti-eye", !isPassword);
      toggleBtn.classList.toggle("ti-close", isPassword);
    });
  });
}

function fillProfileForm(form, user) {
  if (!form || !user) return;

  if (form.elements.name) form.elements.name.value = user.name || "";
  if (form.elements.email) form.elements.email.value = user.email || "";
  if (form.elements.level) form.elements.level.value = user.level || "A1";
  if (form.elements.goal) form.elements.goal.value = user.goal || "";
  if (form.elements.phone) form.elements.phone.value = user.phone || "";
  if (form.elements.bio) form.elements.bio.value = user.bio || "";
  if (form.elements.gender) form.elements.gender.value = user.gender || "male";

  renderProfileAvatars(user);

  const genderLabels = { male: "Nam 👨", female: "Nữ 👩", other: "Khác 🌈" };
  const genderText = genderLabels[user.gender] || "Nam 👨";

  setText("[data-profile-name]", user.name || "Học viên");
  setText("[data-profile-email]", user.email || "");
  setText("[data-profile-role]", user.role === "admin" ? "Quản trị viên" : "Học viên");
  setText("[data-profile-goal]", user.goal || "Chưa đặt mục tiêu");
  setText("[data-profile-gender]", genderText);
  setText("[data-profile-status]", user.status === "active" ? "Đang hoạt động" : "Đang khóa");
  setText("[data-profile-bio-text]", user.bio ? user.bio : "Sẵn sàng chinh phục tiếng Anh!");

  setText("[data-student-name]", user.name || "Học viên");

  if (typeof LevelSystem !== "undefined") {
    LevelSystem.updateLevelUI();
  }
}

function renderProfileAvatars(user) {
  if (typeof renderAvatarTargets === "function") {
    renderAvatarTargets("[data-profile-avatar], [data-profile-form-avatar]", user);
  }
}

function showProfileFeedback(container, message, isSuccess = true) {
  const feedback = container.querySelector("[data-auth-feedback], [data-password-feedback]");
  if (feedback) {
    const iconClass = isSuccess ? "ti-check" : "ti-alert";
    feedback.innerHTML = `<span class="${iconClass}" style="margin-right: 6px;"></span><span>${message}</span>`;
    feedback.style.color = isSuccess ? "var(--success)" : "var(--danger)";
    feedback.style.display = "block";
  }
}

function renderDashboardProgressUI() {
  const accountKeyFn = typeof getAccountKey === "function" ? getAccountKey : (k) => k;

  // 1. Vocabulary (Total: 468 words across 39 topics)
  let masteredVocab = [];
  try {
    const raw = localStorage.getItem(accountKeyFn("engWithMeSavedVocabularyWords")) || 
                localStorage.getItem("engWithMeSavedVocabularyWords") || "[]";
    masteredVocab = JSON.parse(raw);
    if (!Array.isArray(masteredVocab)) masteredVocab = [];
  } catch (e) {
    masteredVocab = [];
  }
  const vocabCount = masteredVocab.length;
  const vocabTotal = 468;
  const vocabPercent = Math.min(100, Math.round((vocabCount / vocabTotal) * 100));

  // 2. Listening (Total: 78 sessions)
  let listeningCount = 0;
  try {
    const rawState = localStorage.getItem(accountKeyFn("engWithMeListeningLabState")) || 
                     localStorage.getItem("engWithMeListeningLabState");
    if (rawState) {
      const parsed = JSON.parse(rawState);
      if (parsed && parsed.completed) {
        if (Array.isArray(parsed.completed)) {
          listeningCount = parsed.completed.length;
        } else if (typeof parsed.completed === "object") {
          listeningCount = Object.keys(parsed.completed).filter((k) => parsed.completed[k]).length;
        }
      }
    }
    const rawList = localStorage.getItem(accountKeyFn("engWithMeListeningProgress")) || 
                    localStorage.getItem("engWithMeListeningProgress");
    if (rawList) {
      const list = JSON.parse(rawList);
      if (Array.isArray(list)) {
        listeningCount = Math.max(listeningCount, list.length);
      }
    }
  } catch (e) {}
  const listeningTotal = 78;
  const listeningPercent = Math.min(100, Math.round((listeningCount / listeningTotal) * 100));

  // 3. Reading (Total: 22 passages)
  let readingCount = 0;
  try {
    const rawRead = localStorage.getItem(accountKeyFn("engWithMeReadingViewedTopics")) || 
                    localStorage.getItem("engWithMeReadingViewedTopics") || 
                    localStorage.getItem(accountKeyFn("engWithMeReadingProgress")) || 
                    localStorage.getItem("engWithMeReadingProgress") || "[]";
    const readArr = JSON.parse(rawRead);
    if (Array.isArray(readArr)) {
      readingCount = readArr.length;
    }
  } catch (e) {}
  const readingTotal = 22;
  const readingPercent = Math.min(100, Math.round((readingCount / readingTotal) * 100));

  // 4. Grammar (Total: 180 questions across 18 core topics)
  let grammarCount = 0;
  try {
    const rawGrammar = localStorage.getItem(accountKeyFn("engWithMeGrammarPracticeState")) || 
                       localStorage.getItem("engWithMeGrammarPracticeState") || "{}";
    const grammarState = JSON.parse(rawGrammar);
    if (grammarState && typeof grammarState === "object") {
      Object.values(grammarState).forEach((arr) => {
        if (Array.isArray(arr)) grammarCount += arr.length;
      });
    }
  } catch (e) {}
  const grammarTotal = 180;
  const grammarPercent = Math.min(100, Math.round((grammarCount / grammarTotal) * 100));

  // Calculate Overall Progress (4 Skills)
  let completedModules = 0;
  if (vocabPercent > 0) completedModules++;
  if (listeningPercent > 0) completedModules++;
  if (readingPercent > 0) completedModules++;
  if (grammarPercent > 0) completedModules++;

  const overallPercent = Math.round((vocabPercent + listeningPercent + readingPercent + grammarPercent) / 4);

  // Hiển thị Banner Tiến độ tổng (0/4)
  setText("[data-overall-count]", `${completedModules}/4`);
  setText("[data-overall-percent]", `${overallPercent}%`);
  const overallFill = document.querySelector("[data-overall-fill]");
  if (overallFill) overallFill.style.width = `${overallPercent}%`;

  // Skill 1: Từ vựng (468 từ)
  setText("[data-vocab-count]", `${vocabCount}/${vocabTotal} từ`);
  setText("[data-vocab-percent]", `${vocabPercent}%`);
  const vocabFill = document.querySelector("[data-vocab-fill]");
  if (vocabFill) vocabFill.style.width = `${vocabPercent}%`;

  // Skill 2: Nghe (78 bài)
  setText("[data-listening-count]", `${listeningCount}/${listeningTotal} bài`);
  setText("[data-listening-percent]", `${listeningPercent}%`);
  const listeningFill = document.querySelector("[data-listening-fill]");
  if (listeningFill) listeningFill.style.width = `${listeningPercent}%`;

  // Skill 3: Đọc (22 bài)
  setText("[data-reading-count]", `${readingCount}/${readingTotal} bài`);
  setText("[data-reading-percent]", `${readingPercent}%`);
  const readingFill = document.querySelector("[data-reading-fill]");
  if (readingFill) readingFill.style.width = `${readingPercent}%`;

  // Skill 4: Ngữ pháp (180 câu)
  setText("[data-grammar-count]", `${grammarCount}/${grammarTotal} câu`);
  setText("[data-grammar-percent]", `${grammarPercent}%`);
  const grammarFill = document.querySelector("[data-grammar-fill]");
  if (grammarFill) grammarFill.style.width = `${grammarPercent}%`;

  // 5. Render Exam History List
  renderExamHistoryUI();

  if (typeof LevelSystem !== "undefined") {
    LevelSystem.updateLevelUI();
  }
}

function renderExamHistoryUI() {
  const container = document.querySelector("[data-exam-history-container]");
  if (!container) return;

  const accountKeyFn = typeof getAccountKey === "function" ? getAccountKey : (k) => k;
  let historyList = [];
  try {
    historyList = JSON.parse(localStorage.getItem(accountKeyFn("engWithMeExamHistoryList")) || "[]");
    if (!Array.isArray(historyList)) historyList = [];
  } catch (e) {
    historyList = [];
  }

  if (historyList.length === 0) {
    container.innerHTML = `
      <div class="exam-empty-state" style="text-align: center; padding: 28px 16px; color: #94a3b8; font-size: 0.92rem; background: rgba(2, 6, 23, 0.4); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
        <span class="ti-info-alt" style="font-size: 1.5rem; color: #38bdf8; display: block; margin-bottom: 8px;"></span>
        Sau khi bạn hoàn thành đề thi thì sẽ đươc lưu ở đây!
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      ${historyList.map((item) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: rgba(2, 6, 23, 0.5); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; transition: border-color 0.2s;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); display: flex; align-items: center; justify-content: center; color: #00f0ff; font-size: 1.1rem;">
              <span class="ti-calendar"></span>
            </div>
            <div>
              <div style="font-weight: 800; color: #f8fafc; font-size: 0.95rem;">Đề TOEIC (${(item.test_set || "y2025").toUpperCase()} - Part ${item.test_parts || "5"})</div>
              <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">🕒 ngày ${item.timestamp || "Mới làm"}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 900; color: #00f0ff; font-size: 1.05rem;">🎯 ${item.correct_count}/${item.total_questions} câu (${item.score_percent || Math.round((item.correct_count / item.total_questions) * 100)}%)</div>
            <span style="font-size: 0.78rem; font-weight: 800; color: #ffd700; background: rgba(255, 215, 0, 0.1); padding: 2px 8px; border-radius: 99px; border: 1px solid rgba(255, 215, 0, 0.3);">Cấp độ: ${item.level || "A1"}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}
