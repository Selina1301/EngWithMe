function initAuthForms() {
  const registerForm = document.querySelector("[data-register-form]");
  const loginForm = document.querySelector("[data-login-form]");

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAuthForm(registerForm, "api/register.php");
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAuthForm(loginForm, "api/login.php");
  });

  // Toggle Password Visibility
  document.querySelectorAll(".toggle-password").forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", () => {
      const input = toggleBtn.previousElementSibling;
      if (!input || input.tagName !== "INPUT") return;
      
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggleBtn.classList.toggle("slashed", !isPassword); // Add slash when visible (text)
    });
  });

  const forgotForm = document.querySelector("[data-forgot-form]");
  const resetForm = document.querySelector("[data-reset-form]");

  forgotForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitForgotForm(forgotForm);
  });

  resetForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAuthForm(resetForm, "api/reset_password.php");
  });
}

async function submitForgotForm(form) {
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent;
  
  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Đang gửi...";
    }
    showAuthFeedback(form, "Đang kết nối server...", true);

    const response = await fetch("api/forgot_password.php", {
      method: "POST",
      body: new FormData(form),
      credentials: "same-origin"
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      showAuthFeedback(form, result.message || "Thao tác không thành công.", false);
      return;
    }

    showAuthFeedback(form, result.message, true);
    
    // Display debug link if provided in development/local mode
    const demoLinkEl = document.getElementById('demo-reset-link');
    const resetLink = result.debug_reset_link || result.demo_link;
    if (demoLinkEl && resetLink) {
        demoLinkEl.style.display = 'block';
        demoLinkEl.innerHTML = `<strong>Link khôi phục (Debug):</strong> <a href="${resetLink}" target="_blank">${resetLink}</a>`;
    }

  } catch (error) {
    showAuthFeedback(form, "Không gọi được backend.", false);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

async function submitAuthForm(form, endpoint) {
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent;
  const password = form.elements.password?.value || "";
  const confirmPassword = form.elements.confirm_password?.value || "";

  if (confirmPassword && password !== confirmPassword) {
    showAuthFeedback(form, "Mật khẩu nhập lại chưa khớp.", false);
    return;
  }

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Đang xử lý...";
    }
    showAuthFeedback(form, "Đang kết nối server...", true);

    const response = await fetch(endpoint, {
      method: "POST",
      body: new FormData(form),
      credentials: "same-origin"
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      showAuthFeedback(form, result.message || "Thao tác không thành công.", false);
      return;
    }

    if (result.user) {
      saveAuthenticatedUser(result.user);
    }
    showAuthFeedback(form, result.message || "Thành công. Đang chuyển hướng...", true);
    
    // Hiển thị link kích hoạt dự phòng (Debug) nếu đang ở môi trường local/dev
    if (result.debug_verify_link) {
      let debugLinkEl = document.getElementById('debug-verify-link');
      if (!debugLinkEl) {
        debugLinkEl = document.createElement('div');
        debugLinkEl.id = 'debug-verify-link';
        debugLinkEl.style.marginTop = '15px';
        debugLinkEl.style.fontSize = '13px';
        debugLinkEl.style.background = 'rgba(46, 232, 120, 0.1)';
        debugLinkEl.style.padding = '10px';
        debugLinkEl.style.borderRadius = '8px';
        debugLinkEl.style.wordBreak = 'break-all';
        debugLinkEl.style.color = 'var(--text)';
        form.appendChild(debugLinkEl);
      }
      debugLinkEl.innerHTML = `<strong>Link kích hoạt (Debug):</strong> <a href="${result.debug_verify_link}" target="_blank">${result.debug_verify_link}</a>`;
    }

    const redirect = result.redirect || "index.html";
    setTimeout(() => {
      if (!result.debug_verify_link) {
        window.location.href = redirect;
      }
    }, result.debug_verify_link ? 15000 : 2500);
  } catch (error) {
    showAuthFeedback(form, "Không gọi được backend. Hãy mở web bằng Apache/XAMPP qua localhost.", false);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

function saveAuthenticatedUser(user) {
  if (!user) return;
  if (typeof persistAuthUser === "function") {
    persistAuthUser(user);
    return;
  }
  localStorage.setItem("engWithMeStudentName", user.name || "Nguyễn Văn A");
  localStorage.setItem("engWithMeGoal", user.goal || "Giao tiếp hằng ngày");
  localStorage.setItem("engWithMeLevel", user.level || "A1");
  localStorage.setItem("engWithMeUserEmail", user.email || "");
  localStorage.setItem("engWithMeUserRole", user.role || "user");
  localStorage.setItem("engWithMeUserStatus", user.status || "active");
  localStorage.setItem("engWithMeUserId", String(user.id || ""));
  localStorage.setItem("engWithMeUserAvatar", user.avatar || "");
}

function showAuthFeedback(form, message, isSuccess = true) {
  const feedback = form.querySelector("[data-auth-feedback]");
  if (feedback) {
    feedback.textContent = message;
    feedback.style.color = isSuccess ? "var(--success)" : "var(--danger)";
  }
}
