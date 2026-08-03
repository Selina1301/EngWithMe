function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

async function initProfile() {
  const profileForm = document.querySelector("[data-profile-form]");
  const passwordForm = document.querySelector("[data-password-form]");

  // 0. Fill profile form & sidebar immediately from cached auth user
  const cachedUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
  if (cachedUser) {
    fillProfileForm(profileForm, cachedUser);
    updatePasswordFormForGoogleUser(cachedUser);
  }

  // 1. Quản lý Chuyển Tab (Tab Navigation)
  initProfileTabs();

  // 2. Render Dashboard Progress UI safely
  try {
    renderDashboardProgressUI();
  } catch (e) {
    console.warn("Dashboard progress error:", e);
  }

  // 3. Tải thông tin người dùng mới nhất từ API me.php
  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const response = await fetcher("api/me.php");
    if (response.ok) {
      const result = await response.json();
      if (result && result.ok && result.user) {
        if (typeof persistAuthUser === "function") persistAuthUser(result.user);
        if (typeof renderAuthenticatedNav === "function") renderAuthenticatedNav(result.user);
        fillProfileForm(profileForm, result.user);
        updatePasswordFormForGoogleUser(result.user);

        // Tự động chuyển thẳng tới Tab Bảo Mật (Tạo Mật Khẩu) nếu đăng nhập Google chưa có mật khẩu
        const isGoogleAccount = result.user.is_google === 1 || result.user.auth_provider === "google";
        const noPasswordYet = result.user.has_password === 0 || result.user.has_password === false;
        if (isGoogleAccount && noPasswordYet && !window.location.hash) {
          const securityTabBtn = document.querySelector('[data-tab-target="security"]');
          if (securityTabBtn) securityTabBtn.click();
        }
      } else {
        const hasToken = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token");
        if (!hasToken && !cachedUser) {
          window.location.href = "login.html";
        } else if (cachedUser) {
          fillProfileForm(profileForm, cachedUser);
        }
      }
    } else {
      const hasToken = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token");
      if (response.status === 401 || !hasToken) {
        if (typeof clearAuthUser === "function") clearAuthUser();
        window.location.href = "login.html";
        return;
      }
      if (cachedUser) fillProfileForm(profileForm, cachedUser);
    }
  } catch (error) {
    if (cachedUser) fillProfileForm(profileForm, cachedUser);
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

  // 7. Xử lý Submit Form Đổi/Tạo mật khẩu & Chống Copy-Paste bảo mật
  if (passwordForm) {
    // 🔒 Chống Copy / Paste / Cut vào các ô Mật khẩu để bắt buộc học viên tự gõ thủ công
    const passInputs = passwordForm.querySelectorAll('input[type="password"]');
    passInputs.forEach((input) => {
      input.addEventListener("paste", (e) => {
        e.preventDefault();
        showProfileFeedback(passwordForm, "🔒 Vì lý do bảo mật, vui lòng tự gõ mật khẩu (không cho phép dán/paste).", false);
      });
      input.addEventListener("copy", (e) => e.preventDefault());
      input.addEventListener("cut", (e) => e.preventDefault());
    });

    passwordForm.noValidate = true;
    passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = passwordForm.querySelector('.btn-save-password');

      const currentGroup = document.getElementById("currentPasswordGroup");
      const currentPass = passwordForm.elements.current_password?.value || "";
      const newPass = passwordForm.elements.new_password?.value || "";
      const confirmPass = passwordForm.elements.confirm_password?.value || "";

      // Nếu đang ở chế độ Đổi mật khẩu (currentGroup hiển thị), bắt buộc kiểm tra Mật khẩu hiện tại
      const isCurrentPasswordVisible = currentGroup && currentGroup.style.display !== "none";
      if (isCurrentPasswordVisible && !currentPass) {
        showProfileFeedback(passwordForm, "Vui lòng nhập Mật khẩu hiện tại.", false);
        return;
      }

      if (!newPass || newPass.length < 6) {
        showProfileFeedback(passwordForm, "Mật khẩu mới phải có tối thiểu 6 ký tự.", false);
        return;
      }

      if (newPass !== confirmPass) {
        showProfileFeedback(passwordForm, "Mật khẩu mới và Mật khẩu xác nhận chưa trùng khớp. Vui lòng kiểm tra lại!", false);
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner"></span> Đang xử lý...';
        }

        const token = localStorage.getItem("engWithMeAuthToken") || new URLSearchParams(window.location.search).get("auth_token") || "";

        const payload = {
          auth_token: token,
          current_password: currentPass,
          new_password: newPass,
          confirm_password: confirmPass
        };

        const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
        const response = await fetcher("api/change_password.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          if (result && (result.has_password === 1 || result.has_password === "1")) {
            try { localStorage.setItem("engWithMeUserHasPassword", "1"); } catch (e) {}
            updatePasswordFormForGoogleUser({ has_password: 1 });
          }
          showProfileFeedback(passwordForm, result.message || "Không thể xử lý mật khẩu.", false);
          return;
        }

        showProfileFeedback(passwordForm, result.message || "Đã lưu mật khẩu bảo mật thành công!", true);
        passwordForm.reset();
        
        // Cập nhật trạng thái người dùng & Chuyển giao diện sang chế độ Đổi mật khẩu ngay lập tức!
        try { localStorage.setItem("engWithMeUserHasPassword", "1"); } catch (e) {}
        const cachedUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : {};
        if (cachedUser) {
          cachedUser.has_password = 1;
          if (typeof persistAuthUser === "function") persistAuthUser(cachedUser);
        }
        updatePasswordFormForGoogleUser({ has_password: 1 });

        const strengthBox = document.getElementById("passwordStrengthBox");
        if (strengthBox) strengthBox.style.display = "none";
      } catch (error) {
        showProfileFeedback(passwordForm, "Lỗi kết nối khi cập nhật mật khẩu.", false);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          const hasPassStored = localStorage.getItem("engWithMeUserHasPassword");
          const cachedUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
          const userState = (hasPassStored === "1" || (cachedUser && (cachedUser.has_password === 1 || cachedUser.has_password === "1"))) 
            ? { ...(cachedUser || {}), has_password: 1 } 
            : cachedUser;
          updatePasswordFormForGoogleUser(userState);
        }
      }
    });
  }
}

// 8. Tự động nhận diện tài khoản Google chưa có mật khẩu để hiển thị Form "Tạo mật khẩu" hay "Đổi mật khẩu"
function updatePasswordFormForGoogleUser(user) {
  const passwordForm = document.querySelector("[data-password-form]");
  if (!passwordForm) return;

  const titleEl = passwordForm.querySelector("[data-password-title]");
  const currentGroup = document.getElementById("currentPasswordGroup");
  const currentInput = passwordForm.elements.current_password;
  const submitBtn = passwordForm.querySelector(".btn-save-password");

  // Đọc trạng thái lưu trữ đáng tin cậy từ localStorage
  const storedHasPass = localStorage.getItem("engWithMeUserHasPassword");

  let hasPassword = true;

  if (storedHasPass === "1") {
    hasPassword = true;
  } else if (storedHasPass === "0") {
    hasPassword = false;
  } else if (user) {
    if (user.has_password === 1 || user.has_password === true || user.has_password === "1") {
      hasPassword = true;
    } else if (user.has_password === 0 || user.has_password === false || user.has_password === "0") {
      hasPassword = false;
    } else if (user.is_google === 1 || user.auth_provider === "google") {
      hasPassword = false;
    } else {
      hasPassword = true;
    }
  }

  if (!hasPassword) {
    // Mode 1: USER IS GOOGLE USER WITHOUT PASSWORD YET ("TẠO MẬT KHẨU BẢO MẬT")
    if (titleEl) {
      titleEl.innerHTML = '🔒 Tạo mật khẩu riêng cho tài khoản Google';
    }
    if (currentGroup) {
      currentGroup.style.display = "none";
    }
    if (currentInput) {
      currentInput.value = "";
    }
    if (submitBtn) {
      submitBtn.innerHTML = '<span class="ti-lock"></span> Tạo mật khẩu bảo mật ngay';
    }
  } else {
    // Mode 2: USER ALREADY HAS A PASSWORD ("ĐỔI MẬT KHẨU BẢO MẬT")
    if (titleEl) {
      titleEl.innerHTML = '🔑 Đổi mật khẩu bảo mật';
    }
    if (currentGroup) {
      currentGroup.style.display = "block";
    }
    if (submitBtn) {
      submitBtn.innerHTML = '<span class="ti-key"></span> Cập nhật mật khẩu bảo mật';
    }
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
    if (tabId === "notifications" && typeof fetchAndRenderProfileNotificationHistory === "function") {
      fetchAndRenderProfileNotificationHistory();
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
  if (!user) return;

  const rawDisplayName = user.name || user.full_name || localStorage.getItem("engWithMeStudentName") || "";
  const displayName = rawDisplayName.replace(/\s*\(Admin\)\s*/gi, "").trim();
  const displayEmail = user.email || localStorage.getItem("engWithMeUserEmail") || "";
  const safeName = displayName && displayName !== "Đang tải..." ? displayName : (displayEmail ? displayEmail.split("@")[0] : "Học viên");

  if (form && form.elements) {
    if (form.elements.name && displayName && displayName !== "Đang tải...") form.elements.name.value = displayName;
    if (form.elements.email && displayEmail) form.elements.email.value = displayEmail;
    if (form.elements.level && user.level) form.elements.level.value = user.level;
    if (form.elements.goal && (user.goal || user.learning_goal)) form.elements.goal.value = user.goal || user.learning_goal;
    if (form.elements.phone && user.phone) form.elements.phone.value = user.phone;
    if (form.elements.bio && user.bio) form.elements.bio.value = user.bio;
    if (form.elements.gender && user.gender) form.elements.gender.value = user.gender;
  }

  renderProfileAvatars({ ...user, name: safeName, avatar: user.avatar || localStorage.getItem("engWithMeUserAvatar") });

  const genderLabels = { male: "Nam 👨", female: "Nữ 👩", other: "Khác 🌈" };
  const genderText = genderLabels[user.gender] || "Nam 👨";

  setText("[data-profile-name]", safeName);
  if (displayEmail) setText("[data-profile-email]", displayEmail);
  setText("[data-profile-role]", user.role === "admin" ? "Quản trị viên" : "Học viên");
  setText("[data-profile-goal]", user.goal || user.learning_goal || "Chưa đặt mục tiêu");
  setText("[data-profile-gender]", genderText);
  setText("[data-profile-status]", user.status === "active" ? "Đang hoạt động" : "Đang khóa");
  setText("[data-profile-bio-text]", user.bio ? user.bio : "Sẵn sàng chinh phục tiếng Anh!");

  setText("[data-student-name]", safeName);

  if (typeof LevelSystem !== "undefined" && LevelSystem.updateLevelUI) {
    LevelSystem.updateLevelUI();
  }
}

function renderProfileAvatars(user) {
  if (typeof renderAvatarTargets === "function") {
    renderAvatarTargets("[data-profile-avatar], [data-profile-form-avatar]", user);
  }
}

function updatePasswordFormForGoogleUser(user) {
  if (!user) return;
  const currentPasswordGroup = document.getElementById("currentPasswordGroup");
  const passwordTitle = document.querySelector("[data-password-title]");
  const passwordSubmitBtn = document.querySelector('[data-password-form] button[type="submit"]');

  const isGoogle = user.is_google === 1 || user.is_google === "1" || user.auth_provider === "google";
  const hasPasswordLocal = localStorage.getItem("engWithMeUserHasPassword");
  const hasPassword = (user.has_password === 1 || user.has_password === "1" || user.has_password === true || hasPasswordLocal === "1");

  if (isGoogle && !hasPassword) {
    // Mode 1: TẠO MẬT KHẨU RIÊNG (Không cần nhập mật khẩu hiện tại!)
    if (currentPasswordGroup) currentPasswordGroup.style.display = "none";
    if (passwordTitle) passwordTitle.textContent = "🔑 Tạo mật khẩu riêng cho tài khoản Google";
    if (passwordSubmitBtn) passwordSubmitBtn.innerHTML = '<span class="ti-key"></span> Tạo mật khẩu bảo mật';
  } else {
    // Mode 2: ĐỔI MẬT KHẨU BẢO MẬT (Yêu cầu mật khẩu hiện tại)
    if (currentPasswordGroup) currentPasswordGroup.style.display = "block";
    if (passwordTitle) passwordTitle.textContent = "🔑 Đổi mật khẩu bảo mật";
    if (passwordSubmitBtn) passwordSubmitBtn.innerHTML = '<span class="ti-key"></span> Cập nhật mật khẩu bảo mật';
  }
}

function showProfileFeedback(container, message, isSuccess = true) {
  const feedback = container.querySelector("[data-auth-feedback], [data-password-feedback]");
  if (feedback) {
    const iconClass = isSuccess ? "ti-check" : "ti-alert";
    feedback.innerHTML = `<span class="${iconClass}" style="margin-right: 6px; font-size: 1.1rem;"></span><span>${message}</span>`;
    feedback.style.color = isSuccess ? "#34d399" : "#f87171";
    feedback.style.display = "flex";
    feedback.style.alignItems = "center";
    feedback.style.opacity = "1";
    feedback.style.maxHeight = "200px";
    feedback.style.padding = "12px 16px";
    feedback.style.marginTop = "14px";
    feedback.style.marginBottom = "16px";
    feedback.style.borderRadius = "10px";
    feedback.style.fontSize = "0.9rem";
    feedback.style.fontWeight = "600";
    feedback.style.background = isSuccess ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)";
    feedback.style.border = isSuccess ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)";
    feedback.classList.add("visible");
    if (isSuccess) {
      feedback.classList.add("success");
      feedback.classList.remove("danger");
    } else {
      feedback.classList.add("danger");
      feedback.classList.remove("success");
    }
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

  // 2. Listening (Total: 100 sessions = 78 Topic + 22 TOEIC)
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
    const rawExam = localStorage.getItem(accountKeyFn("engWithMeExamProgress")) || 
                    localStorage.getItem("engWithMeExamProgress");
    if (rawExam) {
      const examList = JSON.parse(rawExam);
      if (Array.isArray(examList)) {
        const toeicCount = new Set(examList.filter((id) => String(id).includes("exam"))).size;
        listeningCount += toeicCount;
      }
    }
  } catch (e) {}
  const listeningTotal = 100; // 78 Topic + 22 TOEIC
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

async function fetchAndRenderProfileNotificationHistory() {
  const container = document.getElementById("profile-notifications-list");
  if (!container) return;

  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const res = await fetcher("api/notifications.php?mode=history");
    if (!res.ok) return;
    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: #94a3b8; padding: 32px; font-weight: 600; background: rgba(2, 6, 23, 0.4); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
          <div style="font-size: 28px; margin-bottom: 8px;">🔔</div>
          <p style="margin: 0; color: #e2e8f0;">Lịch sử thông báo trống.</p>
          <small style="color: #64748b;">Tất cả thông báo cá nhân sẽ được lưu trữ an toàn tại đây.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map((item) => {
      const isUnread = Number(item.is_read) === 0;
      const isHiddenFromBell = Boolean(item.is_dismissed_from_bell);
      const icon = item.icon || "📢";

      let statusBadge = `<span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px;">Lịch sử</span>`;
      if (isUnread) {
        statusBadge += ` <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px;">● Mới chưa đọc</span>`;
      }
      if (isHiddenFromBell) {
        statusBadge += ` <span style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px;">Đã ẩn khỏi chuông</span>`;
      }

      return `
        <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 12px; padding: 16px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
          <div style="display: flex; gap: 14px; align-items: flex-start;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
              ${icon}
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <strong style="color: #f8fafc; font-size: 15px;">${escapeHtml(item.title)}</strong>
                ${statusBadge}
              </div>
              <p style="color: #cbd5e1; font-size: 13.5px; margin: 2px 0 0 0; line-height: 1.5;">${escapeHtml(item.message)}</p>
              <small style="color: #64748b; font-size: 11.5px; margin-top: 4px;">${item.created_at ? formatDateTime(item.created_at) : "Vừa xong"}</small>
            </div>
          </div>
          <button type="button" class="btn-purge-single-notif" data-notif-id="${item.id}" title="Xóa vĩnh viễn khỏi lịch sử" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; flex-shrink: 0;">
            ❌ Xóa vĩnh viễn
          </button>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".btn-purge-single-notif").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const notifId = btn.dataset.notifId;
        if (!notifId) return;
        if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn thông báo này khỏi lịch sử không?")) return;

        try {
          btn.disabled = true;
          await fetcher("api/notifications.php?action=purge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: parseInt(notifId, 10) })
          });
          fetchAndRenderProfileNotificationHistory();
        } catch (e) {
          console.error("Purge error:", e);
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 16px;">Lỗi tải lịch sử thông báo.</div>`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initProfile();
    document.getElementById("btn-purge-all-notifs")?.addEventListener("click", async () => {
      if (!confirm("⚠️ Bạn có chắc chắn muốn XÓA VĨNH VIỄN TOÀN BỘ thông báo khỏi lịch sử cá nhân không? Hành động này không thể hoàn tác.")) return;

      try {
        const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
        await fetcher("api/notifications.php?action=purge_all", { method: "POST" });
        fetchAndRenderProfileNotificationHistory();
      } catch (e) {
        console.error("Purge all error:", e);
      }
    });
  });
} else {
  initProfile();
  document.getElementById("btn-purge-all-notifs")?.addEventListener("click", async () => {
    if (!confirm("⚠️ Bạn có chắc chắn muốn XÓA VĨNH VIỄN TOÀN BỘ thông báo khỏi lịch sử cá nhân không? Hành động này không thể hoàn tác.")) return;

    try {
      const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
      await fetcher("api/notifications.php?action=purge_all", { method: "POST" });
      fetchAndRenderProfileNotificationHistory();
    } catch (e) {
      console.error("Purge all error:", e);
    }
  });
}
