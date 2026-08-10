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
    const oppLivesEl = document.getElementById('meteor-opp-lives');
    if (oppLivesEl) {
      let str = '';
      for (let i = 0; i < 3; i++) {
         str += i < meteorGameState.opponentLives ? '❤️ ' : '🖤 ';
      }
      oppLivesEl.innerHTML = str;
    }
    checkMeteorWinCondition();
  }
};

function checkMeteorWinCondition() {
  if (meteorGameState.gameOverSent) return;

  const myId = pvpManager?.socket?.id;
  const oppPlayer = pvpManager?.players?.find(p => p.id !== myId);

  if (meteorGameState.myLives <= 0) {
    meteorGameState.gameOverSent = true;
    if (meteorGameState.frameId) cancelAnimationFrame(meteorGameState.frameId);
    pvpManager?.socket?.emit('finish_game', {
       roomId: window.pvpRoomId || pvpManager?.roomId,
       winnerId: oppPlayer ? oppPlayer.id : null
    });
  } else if (meteorGameState.opponentLives <= 0) {
    meteorGameState.gameOverSent = true;
    if (meteorGameState.frameId) cancelAnimationFrame(meteorGameState.frameId);
    pvpManager?.socket?.emit('finish_game', {
       roomId: window.pvpRoomId || pvpManager?.roomId,
       winnerId: myId
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
  if (!window.pvpCountdownDone) {
    meteorGameState.frameId = requestAnimationFrame(updateMeteorGame);
    return;
  }

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
    
    const myLivesEl = document.getElementById('meteor-my-lives');
    if (myLivesEl) {
      let str = '';
      for (let i = 0; i < 3; i++) {
         str += i < meteorGameState.myLives ? '❤️ ' : '🖤 ';
      }
      myLivesEl.innerHTML = str;
    }
    checkMeteorWinCondition();
  }
  
  // Re-render canvas
  drawMeteorCanvas();
  
  if (meteorGameState.myLives > 0 && !meteorGameState.gameOverSent) {
    meteorGameState.frameId = requestAnimationFrame(updateMeteorGame);
  }
}

function drawMeteorCanvas() {
  const canvas = document.getElementById('meteor-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw warning ground line
  ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
  ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 24);
  ctx.lineTo(canvas.width, canvas.height - 24);
  ctx.stroke();
  
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚠️ PHÒNG THỦ MẶT ĐẤT', canvas.width / 2, canvas.height - 8);

  // Draw meteors
  meteorGameState.meteors.forEach(m => {
     const px = (m.x / 100) * canvas.width;
     const py = m.y;
     
     // Draw flame tail
     const flameGrad = ctx.createLinearGradient(px, py - 40, px, py);
     flameGrad.addColorStop(0, 'transparent');
     flameGrad.addColorStop(1, '#f97316');
     ctx.fillStyle = flameGrad;
     ctx.beginPath();
     ctx.moveTo(px - 14, py);
     ctx.lineTo(px, py - 45);
     ctx.lineTo(px + 14, py);
     ctx.fill();

     // Draw glowing meteor core
     ctx.beginPath();
     ctx.arc(px, py, 18, 0, Math.PI * 2);
     ctx.fillStyle = '#f59e0b';
     ctx.shadowColor = '#f59e0b';
     ctx.shadowBlur = 16;
     ctx.fill();
     ctx.closePath();
     ctx.shadowBlur = 0;
     
     // Draw rocket icon inside meteor
     ctx.font = '16px sans-serif';
     ctx.textAlign = 'center';
     ctx.fillText('🚀', px, py + 6);

     // Draw floating Pill Card for VIETNAMESE MEANING ONLY (English answer is hidden!)
     const meaningText = m.meaning || '';
     ctx.font = 'bold 14px system-ui, sans-serif';
     const meaningWidth = ctx.measureText(meaningText).width;
     const cardWidth = Math.max(90, meaningWidth + 28);
     const cardHeight = 36;
     const cardX = Math.max(10, Math.min(canvas.width - cardWidth - 10, px - cardWidth / 2));
     const cardY = Math.max(10, py - 48);

     // Pill Card Background
     ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
     ctx.strokeStyle = '#f59e0b';
     ctx.lineWidth = 1.5;
     ctx.beginPath();
     ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 10);
     ctx.fill();
     ctx.stroke();

     // Draw Meaning ONLY (Centered)
     ctx.fillStyle = '#f59e0b';
     ctx.font = 'bold 14px system-ui, sans-serif';
     ctx.textAlign = 'center';
     ctx.fillText(meaningText, cardX + cardWidth / 2, cardY + 23);
  });
}

window.onMeteorInput = function(val) {
   meteorGameState.inputValue = val;
   
   const typedStr = val.toLowerCase().trim();
   const index = meteorGameState.meteors.findIndex(m => m.word.toLowerCase().trim() === typedStr);
   
   if (index !== -1) {
      meteorGameState.meteors.splice(index, 1);
      meteorGameState.inputValue = '';
      
      pvpManager?.socket?.emit('game_action', {
         roomId: window.pvpRoomId || pvpManager.roomId,
         action: 'send_meteor'
      });
      
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
    meteorGameState.gameOverSent = false;
    
    if (meteorGameState.frameId) cancelAnimationFrame(meteorGameState.frameId);
    meteorGameState.lastTime = 0;
    meteorGameState.frameId = requestAnimationFrame(updateMeteorGame);
  }
  
  const renderHearts = (lives) => {
    let str = '';
    for (let i = 0; i < 3; i++) {
       str += i < lives ? '❤️ ' : '🖤 ';
    }
    return str;
  };

  return `
    <div style="width: 100%; max-width: 960px; margin: 0 auto;">
      <div class="pvp-game-board" style="background: rgba(15, 23, 42, 0.95); border-radius: 20px; padding: 24px; border: 1.5px solid rgba(16, 185, 129, 0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
        
        <div style="display: grid; grid-template-columns: 210px 1fr; gap: 24px; align-items: start;">
          
          <!-- COL 1: 5-ROW HEART STATUS PANEL -->
          <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 24px 14px; text-align: center; display: flex; flex-direction: column; gap: 16px; align-items: center; justify-content: center; min-height: 440px;">
            <!-- Row 1: MẠNG CỦA BẠN -->
            <div style="font-size: 0.82rem; color: #38bdf8; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;">MẠNG CỦA BẠN</div>
            
            <!-- Row 2: Hearts P1 -->
            <div id="meteor-my-lives" style="font-size: 1.6rem; letter-spacing: 4px;">${renderHearts(meteorGameState.myLives)}</div>
            
            <!-- Row 3: Meteor Icon Separator -->
            <div style="font-size: 2.6rem; color: #f59e0b; margin: 8px 0; filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.6));">☄️</div>
            
            <!-- Row 4: MẠNG ĐỐI THỦ -->
            <div style="font-size: 0.82rem; color: #ef4444; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;">MẠNG ĐỐI THỦ</div>
            
            <!-- Row 5: Hearts P2 -->
            <div id="meteor-opp-lives" style="font-size: 1.6rem; letter-spacing: 4px;">${renderHearts(meteorGameState.opponentLives)}</div>
          </div>

          <!-- COL 2 & 3: GAME CANVAS & INPUT -->
          <div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">
            <!-- CANVAS -->
            <div style="position: relative; width: 100%; height: 420px; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
               <canvas id="meteor-canvas" width="680" height="420" style="width: 100%; height: 100%; display: block;"></canvas>
            </div>
            
            <!-- INPUT -->
            <div style="width: 100%;">
              <input id="meteor-input" type="text" 
                     oninput="window.onMeteorInput(this.value)"
                     placeholder="Gõ từ vựng tiếng Anh tương ứng để bắn phá rocket..."
                     autofocus
                     autocomplete="off"
                     style="width: 100%; padding: 14px 20px; font-size: 1.25rem; text-align: center; border-radius: 14px; border: 2px solid rgba(16, 185, 129, 0.4); background: rgba(15, 23, 42, 0.8); color: white; outline: none; transition: border-color 0.2s;" />
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
};
