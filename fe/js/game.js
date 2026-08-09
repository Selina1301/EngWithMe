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
  if (e.target.classList.contains("level-btn")) {
    const levelBtns = document.querySelectorAll(".level-btn");
    levelBtns.forEach(btn => btn.classList.remove("active"));
    e.target.classList.add("active");
    renderTopics(e.target.dataset.level);
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
    <div class="topic-item" onclick="startOfflineGame('${level}', '${topic.id}')">
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
  // Simulate API call to Cloudflare Worker to create a room
  const btn = document.querySelector(".pvp-actions .btn");
  if (btn) {
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Đang tạo phòng...';
    btn.disabled = true;
  }

  setTimeout(() => {
    // Generate a random room ID (in reality, from server)
    const roomId = "EW-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    const link = `${window.location.origin}${window.location.pathname}?tab=online&room=${roomId}`;
    
    document.querySelector(".pvp-lobby-hero").style.display = "none";
    const roomContainer = document.getElementById("pvp-room-container");
    const linkInput = document.getElementById("pvpRoomLink");
    
    if (roomContainer && linkInput) {
      linkInput.value = link;
      roomContainer.style.display = "block";
    }

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }, 800);
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
