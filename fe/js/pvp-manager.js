// fe/js/pvp-manager.js

class PvPManager {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.isHost = false;
    this.players = [];
    this.serverUrl = 'https://engwithme.onrender.com'; // Deployed on Render
    this.amIReady = false;
    
    // Attempt to parse room or action from URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");
    const actionParam = urlParams.get("action");

    if (roomParam) {
      if (window.location.pathname.includes("vocabulary-study.html") || urlParams.get("mode") === "pvp") {
        this.roomId = roomParam;
        this.connect();
      } else {
        this.joinRoom(roomParam);
      }
    } else if (actionParam === "create" && !window.location.pathname.includes("vocabulary-study.html")) {
      setTimeout(() => {
        if (typeof createPvPRoom === "function") {
          createPvPRoom();
        } else {
          this.createRoom();
        }
      }, 150);
    }
  }

  connect() {
    if (this.socket) return;
    
    this.socket = io(this.serverUrl);

    this.socket.on('connect', () => {
      console.log('Connected to PvP server', this.socket.id);
      
      // If we already have a room ID but just connected
      if (this.roomId) {
        let playerName = 'Guest ' + Math.floor(Math.random() * 1000);
        let playerAvatar = null;
        const getUserFn = typeof getCurrentUser === 'function' ? getCurrentUser : (typeof getCachedAuthUser === 'function' ? getCachedAuthUser : null);
        if (getUserFn) {
          const user = getUserFn();
          if (user && user.id !== 'user' && user.id !== 'guest') {
            playerName = user.name || user.email || playerName;
            playerAvatar = user.avatar || null;
          }
        }
        
        this.socket.emit('join_room', {
          roomId: this.roomId,
          playerName: playerName,
          playerAvatar: playerAvatar
        });
      }
    });

    this.socket.on('room_update', (data) => {
      this.players = data.players;
      if (data.players && data.players.length > 0) {
        this.isHost = (data.players[0].id === this.socket.id);
      }
      if (data.gameConfig) {
        this.gameMode = data.gameConfig.mode;
        this.level = data.gameConfig.level;
        this.topic = data.gameConfig.topic;
      }
      this.updateLobbyUI(data);
    });

    this.socket.on('room_full', (data) => {
      if (window.location.pathname.includes("vocabulary-study.html")) {
        console.warn("Ignored room_full on study page:", data.message);
        return;
      }
      alert(data.message);
      window.location.href = 'game.html?tab=online';
    });
    
    this.socket.on('error_msg', (data) => {
      alert(data.message);
      this.amIReady = false;
      const btn = document.getElementById('pvp-ready-btn');
      if (btn) btn.innerHTML = 'Sẵn sàng';
    });

    this.socket.on('player_left', (data) => {
      if (window.location.pathname.includes("vocabulary-study.html")) {
        alert(data.message);
        window.location.href = 'game.html?tab=online';
        return;
      }
      alert(data.message);
      this.players = data.players;
      this.amIReady = false;
      const btn = document.getElementById('pvp-ready-btn');
      if (btn) {
        btn.innerHTML = 'Sẵn sàng';
        btn.classList.remove('btn-success');
        btn.classList.add('btn-primary');
      }
      this.updateLobbyUI(data);
    });

    this.socket.on('game_start', (data) => {
      this.startGame(data.gameConfig);
    });
    
    // In-game events
    this.socket.on('score_update', (data) => {
      this.players = data.players;
      if (typeof window.updatePvPHud === 'function') {
         window.updatePvPHud(this.players);
      }
      if (typeof window.render === 'function') {
         window.render();
      }
    });
    
    this.socket.on('game_over', (data) => {
      if (typeof window.showPvPResult === 'function') {
         window.showPvPResult(data);
      }
    });

    this.socket.on('game_action', (data) => {
      if (typeof window.onPvPActionReceived === 'function') {
        window.onPvPActionReceived(data);
      }
    });

    this.socket.on('pvp_rematch_requested', (data) => {
      if (typeof window.onPvPRematchRequested === 'function') {
        window.onPvPRematchRequested(data);
      }
    });

    this.socket.on('pvp_rematch_start', (data) => {
      if (typeof window.onPvPRematchStart === 'function') {
        window.onPvPRematchStart(data);
      }
    });
  }

  createRoom() {
    this.isHost = true;
    this.roomId = "EW-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // Push state so URL changes without reload
    const newUrl = `${window.location.origin}${window.location.pathname}?tab=online&room=${this.roomId}`;
    window.history.pushState({path: newUrl}, '', newUrl);
    
    this.showLobby();
    this.connect();
  }

  joinRoom(roomId) {
    const getUserFn = typeof getCurrentUser === 'function' ? getCurrentUser : (typeof getCachedAuthUser === 'function' ? getCachedAuthUser : null);
    if (getUserFn) {
      const user = getUserFn();
      if (!user || user.id === 'user' || user.id === 'guest') {
        alert("Vui lòng đăng nhập hoặc đăng ký tài khoản để tham gia phòng thi đấu!");
        window.location.href = "login.html?redirect=game.html?tab=online&room=" + roomId;
        return;
      }
    }

    this.isHost = false;
    this.roomId = roomId;
    
    // Ensure we are on the online tab
    document.querySelectorAll(".game-tab-btn").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".game-section").forEach(s => s.classList.remove("active"));
    
    const tabBtn = document.querySelector(`.game-tab-btn[data-tab="online"]`);
    const section = document.getElementById("tab-online");
    
    if (tabBtn) tabBtn.classList.add("active");
    if (section) section.classList.add("active");
    
    this.showLobby();
    this.connect();
  }

  showLobby() {
    const hero = document.getElementById("pvp-create-view");
    const container = document.getElementById("pvp-room-container");
    const linkInput = document.getElementById("pvpRoomLink");
    const roomTitleSpan = document.querySelector("#pvp-room-title span");
    
    if (hero) hero.style.display = "none";
    if (container) container.style.display = "block";
    
    // Hide game-hub-header as requested by user
    const hubHeader = document.querySelector(".game-hub-header");
    if (hubHeader) hubHeader.style.display = "none";
    
    if (linkInput) {
      linkInput.value = `${window.location.origin}${window.location.pathname}?tab=online&room=${this.roomId}`;
    }
    if (roomTitleSpan) {
      roomTitleSpan.innerText = this.roomId;
    }
    
    // Hide link section for guest
    if (!this.isHost) {
      const linkBox = document.getElementById('pvp-link-section');
      if (linkBox) linkBox.style.display = 'none';
      
      const hostConfig = document.getElementById('pvp-host-config');
      const guestConfig = document.getElementById('pvp-guest-config');
      if (hostConfig) hostConfig.style.display = 'none';
      if (guestConfig) guestConfig.style.display = 'block';
    } else {
      const hostConfig = document.getElementById('pvp-host-config');
      if (hostConfig) hostConfig.style.display = 'block';
      this.populateTopicsForHost('easy'); // default
    }
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  populateTopicsForHost(level) {
    const topicSelect = document.getElementById('pvp-topic-select');
    if (!topicSelect || !vocabularyData || !vocabularyData[level]) return;
    
    let html = '<option value="random">🎲 Ngẫu Nhiên (Random)</option>';
    vocabularyData[level].topics.forEach(t => {
      html += `<option value="${t.id}">${t.name}</option>`;
    });
    topicSelect.innerHTML = html;
    topicSelect.value = 'random';
    this.sendHostConfig();
  }

  sendHostConfig() {
    if (!this.isHost) return;
    const modeSelect = document.getElementById('pvp-mode-select');
    const levelSelect = document.getElementById('pvp-level-select');
    const topicSelect = document.getElementById('pvp-topic-select');
    
    if (levelSelect && topicSelect && topicSelect.value && this.socket) {
      const selectedLevel = levelSelect.value;
      const selectedMode = modeSelect ? modeSelect.value : 'match';
      this.socket.emit('configure_room', {
        roomId: this.roomId,
        gameMode: selectedMode,
        level: selectedLevel,
        topic: topicSelect.value
      });
    }
  }

  onHostConfigChange() {
    if (!this.isHost) return;
    
    const levelSelect = document.getElementById('pvp-level-select');
    
    if (levelSelect) {
      const selectedLevel = levelSelect.value;
      
      if (selectedLevel === 'hard' && typeof checkHardModeAccess === 'function') {
        if (!checkHardModeAccess(null, 'Từ vựng Nâng cao C1-C2 (Hard Mode)')) {
          levelSelect.value = this.currentConfigLevel || 'easy';
          return;
        }
      }

      // If level changed, repopulate topics
      if (this.currentConfigLevel !== selectedLevel) {
         this.currentConfigLevel = selectedLevel;
         this.populateTopicsForHost(selectedLevel);
         return;
      }
    }
    this.sendHostConfig();
  }

  updateLobbyUI(data) {
    const p1Slot = document.getElementById('player1-slot');
    const p2Slot = document.getElementById('player2-slot');
    const readyBtn = document.getElementById('pvp-ready-btn');
    
    if (!p1Slot || !p2Slot) return;

    // Determine who is me and who is opponent
    let me = data.players.find(p => p.id === this.socket.id);
    let opponent = data.players.find(p => p.id !== this.socket.id);
    
    // Update Me
    if (me) {
      const nameEl = p1Slot.querySelector('h4');
      const statusEl = p1Slot.querySelector('.pvp-ready-status');
      const avatarEl = p1Slot.querySelector('.pvp-avatar');
      
      if (nameEl) nameEl.innerText = `${me.name} (Bạn)`;
      if (statusEl) {
        statusEl.innerText = me.ready ? 'Đã sẵn sàng' : 'Chưa sẵn sàng';
        statusEl.className = `pvp-ready-status ${me.ready ? 'ready' : 'not-ready'}`;
      }
      if (avatarEl) {
        avatarEl.style.borderColor = me.color;
        if (me.avatar) {
          avatarEl.innerHTML = `<img src="${me.avatar}" alt="${me.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
          avatarEl.innerHTML = `<i data-lucide="user"></i>`;
          if (typeof lucide !== 'undefined') lucide.createIcons({root: avatarEl});
        }
      }
      
      // Enable ready button if I have joined successfully
      if (readyBtn) readyBtn.disabled = false;
    }

    // Update Opponent
    if (opponent) {
      const nameEl = p2Slot.querySelector('h4');
      const statusEl = p2Slot.querySelector('.pvp-ready-status');
      const avatarEl = p2Slot.querySelector('.pvp-avatar');
      
      if (nameEl) nameEl.innerText = opponent.name;
      if (statusEl) {
        statusEl.innerText = opponent.ready ? 'Đã sẵn sàng' : 'Chưa sẵn sàng';
        statusEl.className = `pvp-ready-status ${opponent.ready ? 'ready' : 'not-ready'}`;
      }
      if (avatarEl) {
        avatarEl.style.borderColor = opponent.color;
        if (opponent.avatar) {
          avatarEl.innerHTML = `<img src="${opponent.avatar}" alt="${opponent.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
          avatarEl.innerHTML = `<i data-lucide="user"></i>`;
          if (typeof lucide !== 'undefined') lucide.createIcons({root: avatarEl});
        }
      }
    } else {
      // Opponent hasn't joined or left
      const nameEl = p2Slot.querySelector('h4');
      const statusEl = p2Slot.querySelector('.pvp-ready-status');
      const avatarEl = p2Slot.querySelector('.pvp-avatar');
      
      if (nameEl) nameEl.innerText = 'Đang chờ...';
      if (statusEl) {
        statusEl.innerText = 'Chưa tham gia';
        statusEl.className = 'pvp-ready-status not-ready';
      }
      if (avatarEl) {
        avatarEl.style.borderColor = 'transparent';
        avatarEl.innerHTML = `<i data-lucide="user"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons({root: avatarEl});
      }
    }
    
    // Update Guest UI with host's selection
    if (!this.isHost && data.gameConfig && data.gameConfig.topic) {
       const guestConfig = document.getElementById('pvp-guest-config');
       if (guestConfig) {
          guestConfig.innerHTML = `<p style="color: #4ade80;">Chủ phòng đã chọn bài: <strong>${data.gameConfig.topic}</strong> (Level: ${data.gameConfig.level})</p>`;
       }
    }
  }

  toggleReady() {
    this.amIReady = !this.amIReady;
    
    const btn = document.getElementById('pvp-ready-btn');
    if (btn) {
      if (this.amIReady) {
        btn.innerHTML = '<i data-lucide="check"></i> Đang chờ...';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
      } else {
        btn.innerHTML = 'Sẵn sàng';
        btn.classList.remove('btn-success');
        btn.classList.add('btn-primary');
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    if (this.socket) {
      this.socket.emit('player_ready', {
        roomId: this.roomId,
        isReady: this.amIReady
      });
    }
  }

  leaveRoom() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    window.location.href = 'game.html?tab=online';
  }

  startGame(config) {
    if (!config) {
      alert("Invalid game configuration!");
      return;
    }
    const level = config.level || 'easy';
    let topic = config.topic || 'random';

    // Resolve random topic on client
    if (topic === 'random' && typeof vocabularyData !== 'undefined' && vocabularyData[level]) {
      const topics = vocabularyData[level].topics;
      if (topics && topics.length > 0) {
        const randItem = topics[Math.floor(Math.random() * topics.length)];
        topic = randItem ? randItem.id : 'family';
      } else {
        topic = 'family';
      }
    }
    const mode = config.mode || 'match';

    // Redirect to vocabulary-study.html with PvP parameters
    const starterId = config.starterId || '';
    window.location.href = `vocabulary-study.html?level=${level}&topic=${topic}&mode=pvp&game=${mode}&room=${this.roomId}&sid=${this.socket.id}&starter=${starterId}`;
  }
}

// Initialize globally
window.pvpManager = new PvPManager();
