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

  // Bảo mật Password fields: Không cho phép copy từ ô Mật khẩu và không cho phép paste vào ô Nhập lại mật khẩu
  if (registerForm) {
    const passwordInput = registerForm.querySelector('input[name="password"]');
    const confirmInput = registerForm.querySelector('input[name="confirm_password"]');
    if (passwordInput && confirmInput) {
      passwordInput.addEventListener("copy", (e) => {
        e.preventDefault();
        showAuthFeedback(registerForm, "Vì lý do bảo mật, không được phép copy mật khẩu.", false);
      });
      passwordInput.addEventListener("cut", (e) => {
        e.preventDefault();
      });
      confirmInput.addEventListener("paste", (e) => {
        e.preventDefault();
        showAuthFeedback(registerForm, "Vui lòng tự gõ lại mật khẩu xác nhận, không được paste.", false);
      });
      confirmInput.addEventListener("drop", (e) => {
        e.preventDefault();
      });
    }
  }

  // Xử lý lỗi trả về từ Google OAuth/Redirect parameters
  if (loginForm) {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      let message = "Đã xảy ra lỗi khi đăng nhập.";
      if (error === "csrf_mismatch") {
        message = "Yêu cầu đã hết hạn hoặc không hợp lệ (CSRF). Vui lòng thử lại.";
      } else if (error === "google_failed") {
        message = "Đăng nhập bằng Google thất bại. Vui lòng thử lại.";
      } else if (error === "code_missing") {
        message = "Không nhận được mã xác thực từ Google.";
      }
      showAuthFeedback(loginForm, message, false);
      
      // Xóa tham số lỗi trên thanh địa chỉ để tránh lặp lại thông báo khi F5
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

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
  const originalButtonText = submitButton?.innerHTML;
  
  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner"></span> Đang gửi...';
    }
    showAuthFeedback(form, ""); // Ẩn thông báo cũ khi bắt đầu tải

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

  } catch (error) {
    showAuthFeedback(form, "Không gọi được backend.", false);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }
}

async function submitAuthForm(form, endpoint) {
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.innerHTML;
  const password = form.elements.password?.value || "";
  const confirmPassword = form.elements.confirm_password?.value || "";

  if (confirmPassword && password !== confirmPassword) {
    showAuthFeedback(form, "Mật khẩu nhập lại chưa khớp.", false);
    return;
  }

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner"></span> Đang xử lý...';
    }
    showAuthFeedback(form, ""); // Ẩn thông báo cũ khi bắt đầu tải

    const response = await fetch(endpoint, {
      method: "POST",
      body: new FormData(form),
      credentials: "same-origin"
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      if (result.conflict) {
        openConflictModal(form.elements.email?.value || "");
      }
      showAuthFeedback(form, result.message || "Thao tác không thành công.", false);
      return;
    }

    if (result.requires_otp) {
      showAuthFeedback(form, ""); // Ẩn thông báo cũ, không hiện box màu xanh lá vì modal OTP đã có hướng dẫn chi tiết
      const isLoginOtp = endpoint.includes("login.php");
      openOtpModal(result.email, form, isLoginOtp);
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
      submitButton.innerHTML = originalButtonText;
    }
  }
}

function saveAuthenticatedUser(user) {
  if (!user) return;
  if (typeof AppCache !== "undefined" && AppCache.clear) {
    AppCache.clear();
  }
  if (typeof persistAuthUser === "function") {
    persistAuthUser(user);
    return;
  }
  const name = user.name || user.full_name || "Học viên";
  const goal = user.goal || user.learning_goal || "";
  const avatar = user.avatar || user.avatar_path || "";
  localStorage.setItem("engWithMeStudentName", name);
  localStorage.setItem("engWithMeGoal", goal);
  localStorage.setItem("engWithMeLevel", user.level || "A1");
  localStorage.setItem("engWithMeUserEmail", user.email || "");
  localStorage.setItem("engWithMeUserRole", user.role || "user");
  localStorage.setItem("engWithMeUserStatus", user.status || "active");
  localStorage.setItem("engWithMeUserId", String(user.id || ""));
  localStorage.setItem("engWithMeUserAvatar", avatar);
}

function showAuthFeedback(form, message, isSuccess = true) {
  const feedback = form.querySelector("[data-auth-feedback]");
  if (feedback) {
    if (!message) {
      feedback.className = "feedback";
      feedback.innerHTML = "";
      return;
    }
    
    // Sử dụng icon chuẩn của dự án (Themify Icons)
    const iconClass = isSuccess ? "ti-info-alt" : "ti-alert";
    feedback.innerHTML = `<span class="${iconClass}" style="margin-right: 8px; font-size: 14px;"></span><span>${message}</span>`;
    
    feedback.className = `feedback visible ${isSuccess ? "success" : "danger"}`;
  }
}

function openOtpModal(email, originalForm, isLoginOtp = false) {
  const verifyEndpoint = isLoginOtp ? "api/verify_login_otp.php" : "api/verify_otp.php";
  const resendEndpoint = isLoginOtp ? "api/login.php" : "api/register.php";

  document.getElementById("otpFormEmail").value = email;
  document.getElementById("otpEmailTarget").textContent = email;
  
  const otpModal = document.getElementById("otpModal");
  if (otpModal) {
    otpModal.style.display = "flex";
  }
  
  const digits = document.querySelectorAll(".otp-digit");
  digits.forEach((input, index) => {
    input.value = "";
    
    // Auto-advance
    input.oninput = () => {
      if (input.value.length > 1) {
        input.value = input.value.slice(-1);
      }
      if (input.value && index < digits.length - 1) {
        digits[index + 1].focus();
      }
    };
    
    // Auto-backspace
    input.onkeydown = (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        digits[index - 1].focus();
      }
    };
  });
  
  if (digits[0]) {
    setTimeout(() => digits[0].focus(), 100);
  }
  
  document.getElementById("otpErrorMsg").textContent = "";
  
  let countdown = 60;
  const resendBtn = document.getElementById("resendOtpBtn");
  const countdownSpan = document.getElementById("otpCountdown");
  
  resendBtn.classList.add("disabled");
  countdownSpan.textContent = `(${countdown}s)`;
  
  clearInterval(window.otpInterval);
  window.otpInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(window.otpInterval);
      resendBtn.classList.remove("disabled");
      countdownSpan.textContent = "";
    } else {
      countdownSpan.textContent = `(${countdown}s)`;
    }
  }, 1000);
  
  // Resend OTP API handler
  resendBtn.onclick = async (e) => {
    e.preventDefault();
    if (resendBtn.classList.contains("disabled")) return;
    
    const targetEmail = document.getElementById("otpFormEmail")?.value || email || "";
    if (!targetEmail) {
      const errEl = document.getElementById("otpErrorMsg");
      if (errEl) {
        errEl.textContent = "Không tìm thấy địa chỉ email để gửi lại mã.";
        errEl.style.color = "var(--danger)";
      }
      return;
    }

    try {
      resendBtn.classList.add("disabled");
      const errEl = document.getElementById("otpErrorMsg");
      if (errEl) {
        errEl.textContent = "Đang gửi lại mã OTP mới...";
        errEl.style.color = "var(--success)";
      }
      
      const formData = new FormData();
      formData.append("email", targetEmail);

      const response = await fetch("api/resend_otp.php", {
        method: "POST",
        body: formData,
        credentials: "same-origin"
      });
      const res = await response.json();

      if (res.ok) {
        if (errEl) {
          errEl.textContent = res.message || "Mã OTP mới đã được gửi thành công!";
          errEl.style.color = "var(--success)";
        }
        
        countdown = 60;
        countdownSpan.textContent = `(${countdown}s)`;
        clearInterval(window.otpInterval);
        window.otpInterval = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(window.otpInterval);
            resendBtn.classList.remove("disabled");
            countdownSpan.textContent = "";
          } else {
            countdownSpan.textContent = `(${countdown}s)`;
          }
        }, 1000);
      } else {
        if (errEl) {
          errEl.textContent = res.message || "Không thể gửi lại mã OTP.";
          errEl.style.color = "var(--danger)";
        }
        resendBtn.classList.remove("disabled");
      }
    } catch (err) {
      const errEl = document.getElementById("otpErrorMsg");
      if (errEl) {
        errEl.textContent = "Lỗi kết nối mạng. Vui lòng thử lại.";
        errEl.style.color = "var(--danger)";
      }
      resendBtn.classList.remove("disabled");
    }
  };
  
  // Cancel button
  document.getElementById("cancelOtpBtn").onclick = (e) => {
    e.preventDefault();
    clearInterval(window.otpInterval);
    otpModal.style.display = "none";
  };
  
  // Submit OTP Verification Form
  const otpVerifyForm = document.getElementById("otpVerifyForm");
  otpVerifyForm.onsubmit = async (e) => {
    e.preventDefault();
    
    let otpCode = "";
    digits.forEach(input => {
      otpCode += input.value;
    });
    
    if (otpCode.length !== 6) {
      document.getElementById("otpErrorMsg").textContent = "Vui lòng nhập đủ 6 chữ số.";
      document.getElementById("otpErrorMsg").style.color = "var(--danger)";
      return;
    }
    
    const submitBtn = otpVerifyForm.querySelector('button[type="submit"]');
    const origBtnText = submitBtn.innerHTML;
    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Đang xác thực...';
      document.getElementById("otpErrorMsg").textContent = "";
      
      const payload = { email, otp: otpCode };
      if (isLoginOtp && originalForm) {
        const rememberCheckbox = originalForm.querySelector('input[name="remember"]');
        payload.remember = (rememberCheckbox && rememberCheckbox.checked) ? 1 : 0;
      }
      
      const response = await fetch(verifyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        credentials: "same-origin"
      });
      const res = await response.json();
      
      if (!response.ok || !res.ok) {
        document.getElementById("otpErrorMsg").textContent = res.message || "Mã OTP không hợp lệ.";
        document.getElementById("otpErrorMsg").style.color = "var(--danger)";
        return;
      }
      
      saveAuthenticatedUser(res.user);
      document.getElementById("otpErrorMsg").textContent = res.message;
      document.getElementById("otpErrorMsg").style.color = "var(--success)";
      
      setTimeout(() => {
        clearInterval(window.otpInterval);
        window.location.href = res.redirect || "profile.html#dashboard";
      }, 1500);
      
    } catch (err) {
      document.getElementById("otpErrorMsg").textContent = "Không thể kết nối đến máy chủ.";
      document.getElementById("otpErrorMsg").style.color = "var(--danger)";
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origBtnText;
    }
  };
}

function openConflictModal(email) {
  const conflictModal = document.getElementById("conflictModal");
  const emailTarget = document.getElementById("conflictEmailTarget");
  if (emailTarget) {
    emailTarget.textContent = email;
  }
  if (conflictModal) {
    conflictModal.style.display = "flex";
  }
  
  const closeBtn = document.getElementById("closeConflictBtn");
  const backdrop = document.getElementById("conflictBackdrop");
  
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      if (conflictModal) conflictModal.style.display = "none";
    };
  }
  if (backdrop) {
    backdrop.onclick = () => {
      if (conflictModal) conflictModal.style.display = "none";
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const otpSent = urlParams.get("otp_sent");
  const email = urlParams.get("email");

  if (otpSent === "1" && email) {
    const form = document.querySelector("[data-login-form]") || document.querySelector("form");
    if (typeof openOtpModal === "function") {
      setTimeout(() => {
        openOtpModal(email, form, true);
        const feedback = document.getElementById("otpErrorMsg");
        if (feedback) {
          feedback.textContent = `Mã OTP 6 số đã được gửi tới email Google: ${email}`;
          feedback.style.color = "var(--success)";
        }
      }, 250);
    }
  }
});

