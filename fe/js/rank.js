/**
 * EngWithMe Rank Leaderboard Logic
 * Realtime Auto-Polling & Dynamic Category Switcher (Vertical Top 10 List)
 */

(function () {
  "use strict";

  let currentCategory = "xp";
  let cachedData = null;
  let updateTimer = null;

  document.addEventListener("DOMContentLoaded", () => {
    initRankTabs();
    fetchLeaderboardData();
    initUserRankBanner();

    // Auto-polling every 12 seconds to keep rankings fresh
    updateTimer = setInterval(() => {
      fetchLeaderboardData(true);
    }, 12000);
  });

  function getApiBaseUrl() {
    if (window.EWM_CONFIG && window.EWM_CONFIG.API_BASE_URL) {
      let url = window.EWM_CONFIG.API_BASE_URL;
      if (!url.endsWith("/")) url += "/";
      return url;
    }
    return "https://engwithme-hono-edge.tungduong-dev.workers.dev/v1/";
  }

  function initRankTabs() {
    const tabs = document.querySelectorAll(".rank-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const cat = tab.getAttribute("data-rank-tab");
        if (!cat || cat === currentCategory) return;

        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        currentCategory = cat;

        updateSectionTitles();
        renderRankings();
      });
    });
  }

  function updateSectionTitles() {
    const titleEl = document.getElementById("rank-section-title");
    if (!titleEl) return;

    if (currentCategory === "xp") {
      titleEl.textContent = "📊 Top 10 Học Viên Cần Cù (XP)";
    } else if (currentCategory === "bloggers") {
      titleEl.textContent = "✍️ Top 10 Học Viên Tích Cực (Tym & Đọc)";
    } else if (currentCategory === "toeic") {
      titleEl.textContent = "🎯 Top 10 Cao Thủ TOEIC";
    }
  }

  async function fetchLeaderboardData(isSilent = false) {
    const syncTag = document.getElementById("rank-sync-tag");
    if (syncTag && !isSilent) {
      syncTag.textContent = "🔄 Đang đồng bộ dữ liệu mới...";
    }

    // Sync local user XP to server if available
    try {
      if (typeof LevelSystem !== "undefined" && typeof LevelSystem.getUserTotalXP === "function") {
        LevelSystem.getUserTotalXP();
      }
    } catch (eXpSync) {}

    try {
      const relativePath = "blog/get_leaderboard.php";
      const endpoint = typeof window.resolveApiUrl === "function"
        ? window.resolveApiUrl(relativePath)
        : `${getApiBaseUrl()}${relativePath}`;

      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(`Leaderboard API returned status ${res.status}`);
      const data = await res.json();

      if (data && data.ok) {
        cachedData = data.categories || {
          xp: data.leaderboard || [],
          bloggers: data.topBloggers || data.leaderboard || [],
          toeic: data.topToeic || data.leaderboard || []
        };

        renderRankings();

        if (syncTag) {
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          syncTag.textContent = `⚡ Cập nhật lúc ${timeStr}`;
        }
        return;
      }
    } catch (err) {
      console.warn("Fetch Rank error:", err);
    }

    // Fallback: Empty array if network fails so no fake data is ever rendered
    if (!cachedData) {
      cachedData = { xp: [], bloggers: [], toeic: [] };
      renderRankings();
      if (syncTag) {
        syncTag.textContent = "⚡ Chưa có dữ liệu bảng xếp hạng";
      }
    }
  }

  function renderRankings() {
    if (!cachedData) return;

    const list = (cachedData[currentCategory] || []).slice(0, 10);
    const container = document.getElementById("rank-vertical-list");
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: #94a3b8;">
          <p style="font-size: 1rem; color: #cbd5e1;">Chưa có dữ liệu xếp hạng Top 10.</p>
        </div>
      `;
      updateUserPositionInList([]);
      return;
    }

    const myId = String(localStorage.getItem("engWithMeUserId") || "");
    const myEmail = String(localStorage.getItem("engWithMeUserEmail") || "").toLowerCase();
    const myXp = typeof LevelSystem !== "undefined" && typeof LevelSystem.getUserTotalXP === "function" ? LevelSystem.getUserTotalXP() : 0;
    const myLevelInfo = typeof LevelSystem !== "undefined" && typeof LevelSystem.getUserLevelInfo === "function" ? LevelSystem.getUserLevelInfo() : null;

    list.forEach(item => {
      const itemId = String(item.id || "");
      const itemEmail = String(item.email || "").toLowerCase();
      const isMe = (myId && itemId === myId) || (myEmail && itemEmail === myEmail);
      if (isMe) {
        if (myXp > 0) item.xp = Math.max(Number(item.xp || 0), myXp);
        if (myLevelInfo && myLevelInfo.level) item.level = myLevelInfo.level;
      }
    });

    container.innerHTML = list.map((item, index) => {
      const rank = index + 1;
      const name = escapeHtml(item.name || item.full_name || "Học viên");
      const avatar = item.avatar || "assets/icons/theme/logoEW.png";
      const badge = escapeHtml(item.badge || "🥉 Học Viên Tập Sự");
      const statText = getFormattedStat(item);

      const isVip = Number(item.is_vip) === 1;
      const planId = String(item.plan || item.plan_id || "").toLowerCase();
      let planTagHtml = "";
      if (planId.includes("pro")) {
        planTagHtml = `<span class="plan-tag tag-pro" title="Gói Pro (30 Ngày)">⚡ Pro</span>`;
      } else if (planId.includes("premium") || (isVip && !planId.includes("pro"))) {
        planTagHtml = `<span class="plan-tag tag-pre" title="Gói Premium VIP Trọn Đời">👑 Pre</span>`;
      }

      const userLevel = item.level || 1;

      let cardClass = "rank-item-card";
      let medalBadge = `#${rank}`;
      if (rank === 1) {
        cardClass += " rank-top-1";
        medalBadge = "No.1";
      } else if (rank === 2) {
        cardClass += " rank-top-2";
        medalBadge = "No.2";
      } else if (rank === 3) {
        cardClass += " rank-top-3";
        medalBadge = "No.3";
      }

      return `
        <div class="${cardClass}">
          <div class="rank-card-left">
            <div class="rank-medal-badge">${medalBadge}</div>
            <div class="rank-avatar-wrapper">
              ${rank === 1 ? '<span class="crown-icon-1h" title="Quán quân No.1">👑</span>' : ''}
              <img class="rank-avatar" src="${escapeHtml(avatar)}" alt="${name}">
            </div>
            <div class="rank-user-info">
              <div class="rank-user-name-row">
                <span class="rank-user-name">${name}</span>
                <span class="rank-user-level">Lv.${userLevel}</span>
                ${planTagHtml}
              </div>
              <div class="rank-badge-tag">${badge}</div>
            </div>
          </div>
          <div class="rank-card-right">
            <div class="rank-stat-value">${statText}</div>
          </div>
        </div>
      `;
    }).join("");

    updateUserPositionInList(list);
  }

  function getFormattedStat(item) {
    if (currentCategory === "xp") {
      const rawXp = Number(item.xp);
      const safeXp = isNaN(rawXp) ? 0 : rawXp;
      return `${safeXp.toLocaleString()} XP`;
    } else if (currentCategory === "bloggers") {
      return `❤️ ${item.total_likes || 0} tym (${item.blog_count || 0} bài)`;
    } else if (currentCategory === "toeic") {
      const score = typeof item.toeic_score === "number" ? item.toeic_score : (item.toeic_score ? Number(item.toeic_score) : 0);
      const accuracy = typeof item.toeic_accuracy === "number" ? item.toeic_accuracy : (item.toeic_accuracy ? Number(item.toeic_accuracy) : 0);
      const correct = Number(item.total_correct_sum || 0);
      const total = Number(item.total_questions_sum || 0);
      const examsCount = Number(item.exams_completed || 0);

      if (score > 0) {
        let details = [];
        if (examsCount > 0) details.push(`${examsCount} đề thi`);
        if (accuracy > 0) {
          details.push(`Đúng ${accuracy}%`);
        }
        const detailStr = details.length > 0 ? details.join(" • ") : `Đúng ${accuracy}%`;
        return `🎯 ${score.toLocaleString()} pts (${detailStr})`;
      } else {
        return `🎯 Chưa thi (0 pts)`;
      }
    }
    return `${(item.xp || 0).toLocaleString()} XP`;
  }

  function updateRankActionButton() {
    const btn = document.getElementById("my-rank-action-btn");
    if (!btn) return;

    if (currentCategory === "xp") {
      btn.innerHTML = `⚡ Học ngay tăng Rank`;
      btn.onclick = () => {
        const practicePages = ["vocabulary.html", "listening.html", "reading.html", "grammar.html"];
        const randomPage = practicePages[Math.floor(Math.random() * practicePages.length)];
        window.location.href = randomPage;
      };
    } else if (currentCategory === "bloggers") {
      btn.innerHTML = `✍️ Viết bài tăng Rank`;
      btn.onclick = () => {
        window.location.href = "blog.html";
      };
    } else if (currentCategory === "toeic") {
      btn.innerHTML = `🎯 Luyện đề tăng Rank`;
      btn.onclick = () => {
        window.location.href = "exam.html";
      };
    }
  }

  async function initUserRankBanner() {
    const nameEl = document.getElementById("my-rank-name");
    const badgeEl = document.getElementById("my-rank-badge");
    const avatarEl = document.getElementById("my-rank-avatar");
    const xpEl = document.getElementById("my-rank-xp");
    const posEl = document.getElementById("my-rank-pos");

    updateRankActionButton();

    const authUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
    const token = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token") || localStorage.getItem("auth_token") || localStorage.getItem("session_token");

    if (!token && !authUser) {
      if (nameEl) nameEl.textContent = "Khách ghé thăm";
      if (badgeEl) badgeEl.textContent = "Đăng nhập để xem xếp hạng của bạn";
      if (posEl) posEl.textContent = "#--";
      if (xpEl) xpEl.textContent = "0 XP";
      return;
    }

    // Render cached user immediately for 0ms delay UI response
    if (authUser) {
      if (nameEl) nameEl.textContent = authUser.name || authUser.full_name || "Học viên";
      if (badgeEl) badgeEl.textContent = `${authUser.is_vip == 1 ? "👑 VIP • " : ""}${authUser.level || "A1"}`;
      if (avatarEl && authUser.avatar) avatarEl.src = authUser.avatar;
    }

    // Fetch real-time fresh DB profile from /v1/me.php
    try {
      const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
      const res = await fetcher("me.php");
      const data = await res.json();

      if (data && data.ok && data.user) {
        const u = data.user;
        if (typeof persistAuthUser === "function") {
          persistAuthUser(u);
        }
        if (nameEl) nameEl.textContent = u.full_name || u.name || "Học viên";
        if (badgeEl) badgeEl.textContent = `${u.is_vip == 1 ? "👑 VIP • " : ""}${u.level || "A1"}`;
        if (avatarEl && u.avatar) avatarEl.src = u.avatar;
      }
    } catch (e) {
      console.error("Error loading user rank profile:", e);
    }
  }

  function updateUserPositionInList(fullList) {
    const posEl = document.getElementById("my-rank-pos");
    const statLabelEl = document.getElementById("my-rank-stat-label");
    const statValueEl = document.getElementById("my-rank-xp");

    updateRankActionButton();

    if (statLabelEl) {
      if (currentCategory === "xp") statLabelEl.textContent = "Tổng XP";
      else if (currentCategory === "bloggers") statLabelEl.textContent = "Tương tác Blog";
      else if (currentCategory === "toeic") statLabelEl.textContent = "Điểm TOEIC";
    }

    if (!fullList) return;

    const authUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
    const token = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token") || localStorage.getItem("auth_token");

    if (!token && !authUser) {
      if (posEl) posEl.textContent = "#--";
      if (statValueEl) statValueEl.textContent = currentCategory === "xp" ? "0 XP" : (currentCategory === "bloggers" ? "❤️ 0 tym" : "🎯 0 pts");
      return;
    }

    const myId = String(authUser?.id || localStorage.getItem("engWithMeUserId") || "");
    const myEmail = String(authUser?.email || localStorage.getItem("engWithMeUserEmail") || "").toLowerCase();

    const foundIndex = fullList.findIndex(item => {
      const itemId = String(item.id || "");
      const itemEmail = String(item.email || "").toLowerCase();
      return (myId && itemId === myId) || (myEmail && itemEmail === myEmail);
    });

    if (foundIndex !== -1) {
      const myItem = fullList[foundIndex];
      if (posEl) posEl.textContent = `#${foundIndex + 1}`;
      if (statValueEl) statValueEl.textContent = getFormattedStat(myItem);
    } else {
      if (posEl) posEl.textContent = fullList.length > 0 ? `#${fullList.length + 1}+` : "#--";
      if (statValueEl) {
        if (currentCategory === "xp") {
          const totalXp = typeof LevelSystem !== "undefined" && LevelSystem.getUserTotalXP ? LevelSystem.getUserTotalXP() : 0;
          statValueEl.textContent = `${totalXp.toLocaleString()} XP`;
        } else if (currentCategory === "bloggers") {
          statValueEl.textContent = "❤️ 0 tym (0 bài)";
        } else if (currentCategory === "toeic") {
          statValueEl.textContent = "🎯 Chưa thi (0 pts)";
        }
      }
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

})();
