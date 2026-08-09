window.meteorGameState = {
  initialized: false,
  myLives: 3,
  opponentLives: 3,
  words: [],
  meteors: [],
  inputValue: '',
  frameId: null,
  lastTime: 0,
  baseSpeed: 30, // pixels per second
  spawnTimer: 0,
  spawnInterval: 4000 // spawn one every 4s by default
};

window.onMeteorAction = function(data) {
  if (data.action === 'send_meteor') {
    // Opponent successfully typed a meteor, so it is sent to us!
    spawnMeteor(1.5); // Spawn a fast meteor
  } else if (data.action === 'life_lost') {
    meteorGameState.opponentLives--;
    if (typeof window.render === 'function') window.render();
    checkMeteorWinCondition();
  } else if (data.action === 'meteor_win') {
     // I win!
     if (typeof pvpManager !== 'undefined' && pvpManager.socket) {
        pvpManager.socket.emit('update_score', {
           roomId: window.pvpRoomId || pvpManager.roomId,
           score: 1,
           maxScore: 1
        });
     }
  }
};

function checkMeteorWinCondition() {
  if (meteorGameState.myLives <= 0) {
    // I lose
    if (meteorGameState.frameId) cancelAnimationFrame(meteorGameState.frameId);
    pvpManager?.socket?.emit('game_action', {
       roomId: window.pvpRoomId || pvpManager.roomId,
       action: 'meteor_win'
    });
  }
}

function spawnMeteor(speedMultiplier = 1) {
  if (meteorGameState.words.length === 0) return;
  const wordObj = meteorGameState.words[Math.floor(Math.random() * meteorGameState.words.length)];
  
  meteorGameState.meteors.push({
    id: Math.random().toString(36).substr(2, 9),
    word: wordObj.word,
    meaning: wordObj.meaning,
    x: Math.random() * 80 + 10, // 10% to 90%
    y: -50,
    speed: meteorGameState.baseSpeed * speedMultiplier
  });
}

function updateMeteorGame(timestamp) {
  if (!meteorGameState.lastTime) meteorGameState.lastTime = timestamp;
  const dt = (timestamp - meteorGameState.lastTime) / 1000;
  meteorGameState.lastTime = timestamp;
  
  meteorGameState.spawnTimer -= dt * 1000;
  if (meteorGameState.spawnTimer <= 0) {
    spawnMeteor(1);
    meteorGameState.spawnTimer = meteorGameState.spawnInterval;
    // slightly decrease spawn interval to make it harder over time
    meteorGameState.spawnInterval = Math.max(1000, meteorGameState.spawnInterval - 100);
  }
  
  let livesLostThisFrame = 0;
  
  // Update positions
  for (let i = meteorGameState.meteors.length - 1; i >= 0; i--) {
    let m = meteorGameState.meteors[i];
    m.y += m.speed * dt;
    
    // Check ground collision (e.g., y > 400)
    if (m.y > 400) {
      meteorGameState.meteors.splice(i, 1);
      livesLostThisFrame++;
    }
  }
  
  if (livesLostThisFrame > 0) {
    meteorGameState.myLives -= livesLostThisFrame;
    pvpManager?.socket?.emit('game_action', {
       roomId: window.pvpRoomId || pvpManager.roomId,
       action: 'life_lost'
    });
    
    if (typeof window.render === 'function') window.render();
    checkMeteorWinCondition();
  }
  
  // Re-render canvas
  drawMeteorCanvas();
  
  if (meteorGameState.myLives > 0) {
    meteorGameState.frameId = requestAnimationFrame(updateMeteorGame);
  }
}

function drawMeteorCanvas() {
  const canvas = document.getElementById('meteor-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw ground
  ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
  ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
  
  // Draw meteors
  meteorGameState.meteors.forEach(m => {
     const px = (m.x / 100) * canvas.width;
     const py = m.y;
     
     // Draw meteor body
     ctx.beginPath();
     ctx.arc(px, py, 15, 0, Math.PI * 2);
     ctx.fillStyle = '#f59e0b'; // amber
     ctx.shadowColor = '#f59e0b';
     ctx.shadowBlur = 10;
     ctx.fill();
     ctx.closePath();
     
     ctx.shadowBlur = 0;
     
     // Draw text
     ctx.fillStyle = 'white';
     ctx.font = 'bold 14px sans-serif';
     ctx.textAlign = 'center';
     ctx.fillText(m.word, px, py - 20);
     
     ctx.font = '12px sans-serif';
     ctx.fillStyle = '#94a3b8';
     ctx.fillText(m.meaning, px, py - 35);
  });
}

window.onMeteorInput = function(val) {
   meteorGameState.inputValue = val;
   
   // Check if input matches any meteor's word exactly
   const typedStr = val.toLowerCase().trim();
   const index = meteorGameState.meteors.findIndex(m => m.word.toLowerCase() === typedStr);
   
   if (index !== -1) {
      // Destroy meteor
      meteorGameState.meteors.splice(index, 1);
      meteorGameState.inputValue = '';
      
      // Send to opponent
      pvpManager?.socket?.emit('game_action', {
         roomId: window.pvpRoomId || pvpManager.roomId,
         action: 'send_meteor'
      });
      
      // Update UI (input box)
      const inputEl = document.getElementById('meteor-input');
      if (inputEl) inputEl.value = '';
   }
};

window.renderMeteorGame = function(topic) {
  if (!meteorGameState.initialized) {
    meteorGameState.words = topic.words;
    meteorGameState.initialized = true;
    meteorGameState.myLives = 3;
    meteorGameState.opponentLives = 3;
    meteorGameState.meteors = [];
    meteorGameState.spawnTimer = 2000;
    
    if (meteorGameState.frameId) cancelAnimationFrame(meteorGameState.frameId);
    meteorGameState.lastTime = 0;
    meteorGameState.frameId = requestAnimationFrame(updateMeteorGame);
  }
  
  // Heart rendering
  const renderHearts = (lives) => {
    let str = '';
    for (let i = 0; i < 3; i++) {
       str += i < lives ? '❤️ ' : '🖤 ';
    }
    return str;
  };

  return `
    <div style="max-width: 720px; margin: 30px auto 0 auto;">
      
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 4px 8px; color: #cbd5e1;">
        <a href="game.html?tab=online" style="text-decoration: none; color: rgba(255,255,255,0.4); font-weight: 500;">
          <span style="font-size: 1.7rem; line-height: 1;">←</span> Back
        </a>
      </div>

      <!-- GAME BOARD -->
      <div class="game-board" style="background: rgba(15, 23, 42, 0.9); border-radius: 20px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <div style="text-align: left;">
            <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px;">MẠNG CỦA BẠN</div>
            <div style="font-size: 1.2rem;">${renderHearts(meteorGameState.myLives)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px;">MẠNG ĐỐI THỦ</div>
            <div style="font-size: 1.2rem;">${renderHearts(meteorGameState.opponentLives)}</div>
          </div>
        </div>

        <!-- CANVAS -->
        <div style="position: relative; width: 100%; height: 400px; background: rgba(0,0,0,0.4); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px;">
           <canvas id="meteor-canvas" width="680" height="400" style="width: 100%; height: 100%;"></canvas>
        </div>
        
        <!-- INPUT -->
        <input id="meteor-input" type="text" 
               oninput="window.onMeteorInput(this.value)"
               placeholder="Gõ từ để phá hủy thiên thạch..."
               autofocus
               autocomplete="off"
               style="width: 80%; padding: 15px; font-size: 1.2rem; text-align: center; border-radius: 12px; border: 2px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; outline: none;" />
      </div>
    </div>
  `;
};
