function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

async function initProfile() {
  const form = document.querySelector("[data-profile-form]");
  if (!form) return;

  const feedback = form.querySelector("[data-auth-feedback]");
  const avatarInput = form.querySelector("[data-avatar-input]");

  avatarInput?.addEventListener("change", () => {
    const file = avatarInput.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showAuthFeedback(form, "Ảnh đại diện tối đa 2MB.", false);
      avatarInput.value = "";
      return;
    }

    const previewUser = {
      name: form.elements.name.value || localStorage.getItem("engWithMeStudentName") || "Tài khoản",
      avatar: URL.createObjectURL(file)
    };
    renderProfileAvatars(previewUser);
  });

  try {
    const response = await fetch("api/me.php", { credentials: "same-origin" });
    if (!response.ok) {
      window.location.href = "login.html";
      return;
    }

    const result = await response.json();
    if (!result.ok) {
      window.location.href = "login.html";
      return;
    }

    if (typeof persistAuthUser === "function") {
      persistAuthUser(result.user);
    }
    fillProfileForm(form, result.user);
  } catch (error) {
    if (feedback) {
      feedback.textContent = "Không tải được hồ sơ. Hãy chạy web bằng localhost/XAMPP.";
      feedback.style.color = "var(--danger)";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton?.textContent;

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Đang lưu...";
      }

      const response = await fetch("api/profile.php", {
        method: "POST",
        body: new FormData(form),
        credentials: "same-origin"
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        showAuthFeedback(form, result.message || "Không thể lưu hồ sơ.", false);
        return;
      }

      if (typeof persistAuthUser === "function") {
        persistAuthUser(result.user);
      }
      fillProfileForm(form, result.user);
      if (typeof renderAuthenticatedNav === "function") renderAuthenticatedNav(result.user);
      showAuthFeedback(form, result.message || "Đã lưu hồ sơ.", true);
    } catch (error) {
      showAuthFeedback(form, "Không gọi được backend hồ sơ.", false);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}

function fillProfileForm(form, user) {
  form.elements.name.value = user.name || "";
  form.elements.email.value = user.email || "";
  form.elements.level.value = user.level || "A1";
  form.elements.goal.value = user.goal || "";
  renderProfileAvatars(user);

  setText("[data-profile-name]", user.name || "Học viên");
  setText("[data-profile-email]", user.email || "");
  setText("[data-profile-role]", user.role === "admin" ? "Quản trị viên" : "Học viên");
  setText("[data-profile-level]", user.level || "A1");
  setText("[data-profile-goal]", user.goal || "Chưa đặt mục tiêu");
  setText("[data-profile-status]", user.status === "active" ? "Đang hoạt động" : "Đang khóa");
}

function renderProfileAvatars(user) {
  if (typeof renderAvatarTargets === "function") {
    renderAvatarTargets("[data-profile-avatar], [data-profile-form-avatar]", user);
  }
}

function showAuthFeedback(form, message, isSuccess = true) {
  const feedback = form.querySelector("[data-auth-feedback]");
  if (feedback) {
    feedback.textContent = message;
    feedback.style.color = isSuccess ? "var(--success)" : "var(--danger)";
  }
}
