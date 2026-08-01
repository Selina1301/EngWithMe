/**
 * EngWithMe - Centralized Enterprise ApiClient Module
 * Encapsulates all REST API communications, CORS headers, token authentication, and error handling.
 */
(function (window) {
  class ApiClient {
    constructor() {
      this.config = window.EWM_CONFIG || { API_BASE_URL: "/projects/EngWithMe/be/api/v1/" };
    }

    getBaseUrl() {
      return this.config.API_BASE_URL || "/projects/EngWithMe/be/api/v1/";
    }

    async request(endpoint, options = {}) {
      const baseUrl = this.getBaseUrl();
      const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

      const headers = {
        ...options.headers
      };

      const token = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token");
      if (token && !headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const defaultOptions = {
        credentials: "include",
        headers: headers,
        ...options
      };

      try {
        const response = await fetch(url, defaultOptions);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`[ApiClient Error] Request to ${endpoint} failed:`, error);
        return { ok: false, message: "Không thể kết nối đến máy chủ API." };
      }
    }

    // 1. Auth Module
    auth = {
      login: (email, password) => {
        const body = new FormData();
        body.append("email", email);
        body.append("password", password);
        return this.request("auth/login.php", { method: "POST", body });
      },
      verifyOtp: (email, otp) => {
        const body = new FormData();
        body.append("email", email);
        body.append("otp", otp);
        return this.request("auth/verify_otp.php", { method: "POST", body });
      },
      register: (fullName, email, password, level = "A1", goal = "") => {
        const body = new FormData();
        body.append("full_name", fullName);
        body.append("email", email);
        body.append("password", password);
        body.append("level", level);
        body.append("learning_goal", goal);
        return this.request("auth/register.php", { method: "POST", body });
      },
      logout: () => this.request("auth/logout.php", { method: "POST" }),
      forgotPassword: (email) => {
        const body = new FormData();
        body.append("email", email);
        return this.request("auth/forgot_password.php", { method: "POST", body });
      },
      resetPassword: (email, otp, newPassword) => {
        const body = new FormData();
        body.append("email", email);
        body.append("otp", otp);
        body.append("new_password", newPassword);
        return this.request("auth/reset_password.php", { method: "POST", body });
      }
    };

    // 2. User Module
    user = {
      getMe: () => this.request("user/me.php"),
      getProfile: () => this.request("user/profile.php"),
      updateProfile: (formData) => this.request("user/profile.php", { method: "POST", body: formData }),
      changePassword: (currentPassword, newPassword, confirmPassword) => {
        const body = new FormData();
        body.append("current_password", currentPassword);
        body.append("new_password", newPassword);
        body.append("confirm_password", confirmPassword);
        return this.request("user/change_password.php", { method: "POST", body });
      }
    };

    // 3. Notification Module
    notification = {
      list: () => this.request("notification/notifications.php"),
      markRead: (id = 0) => this.request("notification/notifications.php?action=mark_read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      }),
      deleteAll: () => this.request("notification/notifications.php?action=delete_all", { method: "POST" }),
      generate: () => this.request("notification/notifications.php?action=generate_personalized", { method: "POST" })
    };

    // 4. Blog Module
    blog = {
      list: () => this.request("blog/get_blogs.php"),
      submit: (title, content, rating = 5) => {
        const body = new FormData();
        body.append("title", title);
        body.append("content", content);
        body.append("rating", rating);
        return this.request("blog/submit_blog.php", { method: "POST", body });
      },
      like: (id) => {
        const body = new FormData();
        body.append("id", id);
        return this.request("blog/toggle_blog_like.php", { method: "POST", body });
      },
      incrementView: (id) => {
        const body = new FormData();
        body.append("id", id);
        return this.request("blog/increment_blog_view.php", { method: "POST", body });
      }
    };

    // 5. Learning Module
    learning = {
      getContent: (section) => this.request(`learning/learning_content.php?section=${encodeURIComponent(section)}`),
      getExamQuestions: (set, parts) => this.request(`learning/get_exam_questions.php?set=${encodeURIComponent(set)}&parts=${encodeURIComponent(parts)}`),
      getLeaderboard: () => this.request("learning/leaderboard.php"),
      saveTestResult: (data) => {
        const body = new FormData();
        Object.entries(data).forEach(([key, val]) => body.append(key, val));
        return this.request("learning/test_results.php", { method: "POST", body });
      }
    };

    // 6. Payment Module
    payment = {
      createPayment: (planId) => {
        const body = new FormData();
        body.append("plan", planId);
        return this.request("payment/create_payment.php", { method: "POST", body });
      },
      checkStatus: (orderCode) => this.request(`payment/check_payment_status.php?order_code=${encodeURIComponent(orderCode)}`)
    };
  }

  window.apiClient = new ApiClient();
})(window);
