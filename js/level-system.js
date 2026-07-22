/**
 * EngWithMe - Unlimited Level, XP & Prestigious Titles System
 */
(function (global) {
  "use strict";

  const getAccountStorageKey = (baseKey) => {
    try {
      if (typeof global.getAccountKey === "function") {
        return global.getAccountKey(baseKey);
      }
      const userId = localStorage.getItem("engWithMeUserId") || localStorage.getItem("user_id");
      return userId ? `${baseKey}_user_${userId}` : baseKey;
    } catch (e) {
      return baseKey;
    }
  };

  /**
   * Bảng Danh Hiệu Học Viên theo các mốc Level từ 1 đến 200+
   */
  const LEVEL_TITLES = [
    { minLevel: 200, title: "💎 Thần Thoại Bất Tử EngWithMe", color: "linear-gradient(135deg, #a855f7, #ec4899, #00f0ff)", border: "rgba(236, 72, 153, 0.6)" },
    { minLevel: 150, title: "🔥 Bá Chủ Ngôn Ngữ Bất Bại", color: "linear-gradient(135deg, #ef4444, #f97316, #eab308)", border: "rgba(249, 115, 22, 0.6)" },
    { minLevel: 100, title: "🌟 Đại Sứ Tiếng Anh Toàn Cầu", color: "linear-gradient(135deg, #ffd700, #3b82f6, #00f0ff)", border: "rgba(255, 215, 0, 0.6)" },
    { minLevel: 70,  title: "🔮 Cao Thủ Thông Thái", color: "linear-gradient(135deg, #8b5cf6, #00f0ff)", border: "rgba(139, 92, 246, 0.6)" },
    { minLevel: 50,  title: "⚡ Thánh Bắn Pháo Từ Vựng", color: "linear-gradient(135deg, #00f0ff, #eab308)", border: "rgba(0, 240, 255, 0.6)" },
    { minLevel: 30,  title: "👑 Huyền Thoại EngWithMe", color: "linear-gradient(135deg, #ffd700, #ff8c00)", border: "rgba(255, 215, 0, 0.6)" },
    { minLevel: 20,  title: "🗡️ Chiến Sĩ Ngôn Ngữ", color: "linear-gradient(135deg, #3b82f6, #00f0ff)", border: "rgba(59, 130, 246, 0.6)" },
    { minLevel: 15,  title: "📘 Bậc Thầy Từ Vựng", color: "linear-gradient(135deg, #10b981, #00f0ff)", border: "rgba(16, 185, 129, 0.6)" },
    { minLevel: 10,  title: "🛡️ Học Sinh Chăm Chỉ", color: "linear-gradient(135deg, #38bdf8, #818cf8)", border: "rgba(56, 189, 248, 0.6)" },
    { minLevel: 5,   title: "🎗️ Tân Binh Tiếng Anh", color: "linear-gradient(135deg, #38bdf8, #cbd5e1)", border: "rgba(148, 163, 184, 0.6)" },
    { minLevel: 1,   title: "🥉 Học Viên Tập Sự", color: "linear-gradient(135deg, #94a3b8, #64748b)", border: "rgba(148, 163, 184, 0.4)" }
  ];

  function getUserTitleInfo(level) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    for (const t of LEVEL_TITLES) {
      if (safeLevel >= t.minLevel) {
        return t;
      }
    }
    return LEVEL_TITLES[LEVEL_TITLES.length - 1];
  }

  function getXpForLevel(level) {
    const bracket = Math.floor((level - 1) / 10);
    return (bracket + 1) * 10;
  }

  function calculateLevelFromXP(totalXp) {
    const safeTotalXp = Math.max(0, Math.floor(Number(totalXp) || 0));
    let level = 1;
    let remainingXp = safeTotalXp;
    let costForNext = getXpForLevel(level);

    while (remainingXp >= costForNext) {
      remainingXp -= costForNext;
      level++;
      costForNext = getXpForLevel(level);
    }

    const percent = Math.min(100, Math.round((remainingXp / costForNext) * 100));

    return {
      level,
      currentLevelXp: remainingXp,
      xpForNextLevel: costForNext,
      percent,
      totalXp: safeTotalXp
    };
  }

  function getUserTotalXP() {
    const key = getAccountStorageKey("engWithMeUserXP");
    const val = localStorage.getItem(key);
    return Math.max(0, Math.floor(Number(val) || 0));
  }

  function getUserLevelInfo() {
    return calculateLevelFromXP(getUserTotalXP());
  }

  function updateLevelUI() {
    const info = getUserLevelInfo();
    const titleInfo = getUserTitleInfo(info.level);

    // 1. Cập nhật nhãn Level
    const levelBadgeElements = document.querySelectorAll("[data-profile-user-level], [data-user-level]");
    levelBadgeElements.forEach(el => {
      el.textContent = `LV ${info.level}`;
    });

    // 2. Cập nhật nhãn Danh hiệu (Title)
    const titleBadgeElements = document.querySelectorAll("[data-user-title]");
    titleBadgeElements.forEach(el => {
      el.textContent = titleInfo.title;
      el.style.background = titleInfo.color;
      el.style.webkitBackgroundClip = "text";
      el.style.webkitTextFillColor = "transparent";
      el.style.filter = `drop-shadow(0 0 6px ${titleInfo.border})`;
    });

    // 3. Cập nhật text XP
    const xpTextElements = document.querySelectorAll("[data-level-xp-text]");
    xpTextElements.forEach(el => {
      el.textContent = `${info.currentLevelXp}/${info.xpForNextLevel} XP`;
    });

    // 4. Cập nhật thanh Fill XP
    const xpFillElements = document.querySelectorAll("[data-level-xp-fill]");
    xpFillElements.forEach(el => {
      el.style.width = `${info.percent}%`;
    });
  }

  function showXpToast(amount, sourceName) {
    let toastContainer = document.getElementById("xp-toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "xp-toast-container";
      toastContainer.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = "xp-toast-item";
    toast.style.cssText = `
      background: rgba(15, 23, 42, 0.94);
      border: 1.5px solid #00f0ff;
      box-shadow: 0 10px 30px rgba(0, 240, 255, 0.35), 0 0 15px rgba(0, 240, 255, 0.2);
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 99px;
      font-weight: 800;
      font-size: 0.88rem;
      display: flex;
      align-items: center;
      gap: 8px;
      transform: translateY(20px) scale(0.9);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    toast.innerHTML = `
      <span style="color: #ffd700; font-size: 1.05rem;">✨</span>
      <span>+${amount} XP</span>
      ${sourceName ? `<span style="color: #94a3b8; font-weight: 500; font-size: 0.78rem;">(${sourceName})</span>` : ""}
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = "translateY(0) scale(1)";
      toast.style.opacity = "1";
    });

    setTimeout(() => {
      toast.style.transform = "translateY(-10px) scale(0.95)";
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2400);
  }

  function syncXpToServer(totalXp) {
    const userId = localStorage.getItem("engWithMeUserId") || localStorage.getItem("user_id");
    if (!userId) return;

    try {
      const body = new FormData();
      body.append("total_xp", String(totalXp));
      fetch("api/user_level.php", {
        method: "POST",
        body,
        credentials: "same-origin"
      }).catch(e => console.error("Failed to sync XP to server:", e));
    } catch (e) {}
  }

  function addXP(amount, sourceName) {
    const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
    const currentTotal = getUserTotalXP();
    const oldInfo = calculateLevelFromXP(currentTotal);
    const newTotal = currentTotal + safeAmount;
    const newInfo = calculateLevelFromXP(newTotal);

    const key = getAccountStorageKey("engWithMeUserXP");
    localStorage.setItem(key, String(newTotal));

    // Toast XP
    showXpToast(safeAmount, sourceName);

    // Level Up!
    if (newInfo.level > oldInfo.level) {
      showLevelUpModal(newInfo.level, oldInfo.level);
    }

    updateLevelUI();
    syncXpToServer(newTotal);

    return newInfo;
  }

  function showLevelUpModal(newLevel, oldLevel) {
    const oldTitleInfo = getUserTitleInfo(oldLevel);
    const newTitleInfo = getUserTitleInfo(newLevel);
    const isNewTitleUnlocked = newTitleInfo.title !== oldTitleInfo.title;

    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(2, 6, 23, 0.88);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    modal.innerHTML = `
      <div style="background: linear-gradient(145deg, #0f172a, #020617); border: 2px solid #ffd700; box-shadow: 0 0 60px rgba(255, 215, 0, 0.45); border-radius: 24px; padding: 32px 28px; text-align: center; max-width: 380px; width: 90%;">
        <div style="font-size: 3.5rem; margin-bottom: 6px; filter: drop-shadow(0 0 20px rgba(255,215,0,0.6));">👑</div>
        <h2 style="color: #ffd700; font-size: 1.8rem; font-weight: 900; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">THẮNG CẤP!</h2>
        <p style="color: #94a3b8; font-size: 0.95rem; margin: 0 0 16px 0;">Chúc mừng bạn đã đạt tới cấp độ mới!</p>
        
        <div style="font-size: 2.8rem; font-weight: 900; color: #00f0ff; text-shadow: 0 0 20px rgba(0,240,255,0.6); margin-bottom: 12px;">LV ${newLevel}</div>
        
        ${isNewTitleUnlocked ? `
          <div style="background: rgba(255, 215, 0, 0.08); border: 1.5px dashed #ffd700; border-radius: 16px; padding: 12px; margin-bottom: 20px;">
            <span style="font-size: 0.78rem; font-weight: 800; color: #ffd700; text-transform: uppercase; letter-spacing: 1px;">🎉 MỞ KHÓA DANH HIỆU MỚI!</span>
            <div style="font-size: 1.1rem; font-weight: 900; margin-top: 4px; background: ${newTitleInfo.color}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              ${newTitleInfo.title}
            </div>
          </div>
        ` : `
          <div style="font-size: 0.9rem; font-weight: 700; color: #cbd5e1; margin-bottom: 20px;">
            Danh hiệu hiện tại: <span style="background: ${newTitleInfo.color}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900;">${newTitleInfo.title}</span>
          </div>
        `}

        <button type="button" style="background: linear-gradient(135deg, #00f0ff, #3b82f6); border: none; color: #ffffff; padding: 12px 28px; border-radius: 99px; font-weight: 800; font-size: 1rem; cursor: pointer; box-shadow: 0 6px 20px rgba(0, 240, 255, 0.4);">Tiếp tục học</button>
      </div>
    `;

    modal.querySelector("button").addEventListener("click", () => {
      modal.remove();
    });

    document.body.appendChild(modal);
  }

  // Auto init
  document.addEventListener("DOMContentLoaded", () => {
    updateLevelUI();
    const userId = localStorage.getItem("engWithMeUserId") || localStorage.getItem("user_id");
    if (userId) {
      fetch(`api/user_level.php`, { credentials: "same-origin" })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.ok && typeof data.total_xp === "number") {
            const key = getAccountStorageKey("engWithMeUserXP");
            localStorage.setItem(key, String(data.total_xp));
            updateLevelUI();
          }
        })
        .catch(() => {});
    }
  });

  global.LevelSystem = {
    calculateLevelFromXP,
    getUserTotalXP,
    getUserLevelInfo,
    getUserTitleInfo,
    addXP,
    updateLevelUI
  };
  global.addXP = addXP;

})(typeof window !== "undefined" ? window : this);
