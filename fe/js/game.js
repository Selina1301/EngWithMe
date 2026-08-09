// game.js - Logic for Game Arena

document.addEventListener("DOMContentLoaded", () => {
  initGameArena();
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

function initGameArena() {
  const tabs = document.querySelectorAll(".game-tab-btn");
  const sections = document.querySelectorAll(".game-section");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs and sections
      tabs.forEach(t => t.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));

      // Add active class to clicked tab and corresponding section
      tab.classList.add("active");
      const targetId = `tab-${tab.dataset.tab}`;
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add("active");
      }
    });
  });

  // Check URL params for auto-open tab (e.g. ?tab=online)
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");
  if (tabParam) {
    const tabBtn = document.querySelector(`.game-tab-btn[data-tab="${tabParam}"]`);
    if (tabBtn) tabBtn.click();
  }
}

// --- OFFLINE MODE LOGIC ---
let selectedOfflineGame = null;

function openTopicModal(gameType) {
  selectedOfflineGame = gameType;
  const modal = document.getElementById("topicModal");
  if (modal) {
    modal.style.display = "flex";
    // Reset active tab to easy
    document.querySelectorAll(".topic-level-btn").forEach(b => {
      if (b.dataset.level === "easy") {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
    // Default load easy topics
    renderTopics("easy");
  }
}

function closeTopicModal() {
  const modal = document.getElementById("topicModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Handle Level Selection inside Modal
document.addEventListener("click", (e) => {
  const levelBtn = e.target.closest(".level-btn");
  if (levelBtn) {
    const targetLvl = levelBtn.dataset.level;
    if (targetLvl === "hard" && typeof checkHardModeAccess === "function") {
      if (!checkHardModeAccess(e, "Từ vựng Nâng cao C1-C2 (Hard Mode)")) return;
    }

    const levelBtns = document.querySelectorAll(".level-btn");
    levelBtns.forEach(btn => btn.classList.remove("active"));
    levelBtn.classList.add("active");
    renderTopics(targetLvl);
  }
  
  // Close modal when clicking outside
  if (e.target.classList.contains("modal-overlay")) {
    closeTopicModal();
  }
});

function renderTopics(level) {
  const container = document.getElementById("topicGridContainer");
  if (!container) return;

  if (typeof vocabularyData === "undefined" || !vocabularyData[level]) {
    container.innerHTML = "<p>Đang tải dữ liệu...</p>";
    return;
  }

  const topics = vocabularyData[level].topics;
  if (!topics || topics.length === 0) {
    container.innerHTML = "<p>Không tìm thấy chủ đề nào.</p>";
    return;
  }

  container.innerHTML = topics.map(topic => `
    <div class="topic-item ${level}" onclick="startOfflineGame('${level}', '${topic.id}')">
      <div class="topic-icon-game"><i class="${topic.icon || 'ti-book'}"></i></div>
      <h4>${topic.name}</h4>
      <p>${topic.desc.substring(0, 40)}...</p>
    </div>
  `).join("");
}

function startOfflineGame(level, topicId) {
  // Redirect to vocabulary-study.html but pass the mode=play and the gameType
  // We'll pass game=... so we can auto-start it if we modify vocabulary-study.js later, 
  // or the user can just click it again.
  window.location.href = `vocabulary-study.html?level=${level}&topic=${topicId}&mode=play&game=${selectedOfflineGame}`;
}


// --- ONLINE PVP LOGIC ---
function createPvPRoom() {
  if (typeof getCurrentUser === 'function') {
    const user = getCurrentUser();
    if (!user || user.id === 'user' || user.id === 'guest') {
      alert("Vui lòng đăng nhập hoặc đăng ký tài khoản để tạo phòng thi đấu!");
      window.location.href = "login.html?redirect=game.html?tab=online";
      return;
    }
  }

  if (typeof pvpManager !== 'undefined') {
    pvpManager.createRoom();
  } else {
    alert("PvP system is initializing, please wait.");
  }
}

function copyPvPLink() {
  const linkInput = document.getElementById("pvpRoomLink");
  if (linkInput) {
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(linkInput.value).then(() => {
      alert("Đã copy link! Hãy gửi cho bạn bè nhé.");
    });
  }
}
