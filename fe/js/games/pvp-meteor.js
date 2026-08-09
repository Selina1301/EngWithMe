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

     // Draw readable floating Pill Card for word & meaning
     const wordText = m.word || '';
     const meaningText = m.meaning || '';
     ctx.font = 'bold 14px system-ui, sans-serif';
     const wordWidth = ctx.measureText(wordText).width;
     ctx.font = '600 12px system-ui, sans-serif';
     const meaningWidth = ctx.measureText(meaningText).width;
     const cardWidth = Math.max(80, Math.max(wordWidth, meaningWidth) + 24);
     const cardHeight = 44;
     const cardX = Math.max(10, Math.min(canvas.width - cardWidth - 10, px - cardWidth / 2));
     const cardY = Math.max(10, py - 55);

     // Pill Card Background
     ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
     ctx.strokeStyle = '#38bdf8';
     ctx.lineWidth = 1.5;
     ctx.beginPath();
     ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 10);
     ctx.fill();
     ctx.stroke();

     // Draw Meaning (Top line)
     ctx.fillStyle = '#f59e0b';
     ctx.font = 'bold 12px system-ui, sans-serif';
     ctx.textAlign = 'center';
     ctx.fillText(meaningText, cardX + cardWidth / 2, cardY + 16);

     // Draw Word (Bottom line)
     ctx.fillStyle = '#ffffff';
     ctx.font = 'bold 14px system-ui, sans-serif';
     ctx.fillText(wordText, cardX + cardWidth / 2, cardY + 34);
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
    <div style="width: 100%; max-width: 800px; margin: 0 auto;">
      <div class="pvp-game-board" style="background: rgba(15, 23, 42, 0.95); border-radius: 20px; padding: 24px; border: 1.5px solid rgba(16, 185, 129, 0.3); text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
        
        <!-- HEART STATUS BAR -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background: rgba(0,0,0,0.3); padding: 10px 20px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="text-align: left;">
            <div style="font-size: 0.75rem; color: #3b82f6; font-weight: 800; letter-spacing: 1px; margin-bottom: 2px;">MẠNG CỦA BẠN</div>
            <div style="font-size: 1.3rem;">${renderHearts(meteorGameState.myLives)}</div>
          </div>
          <div style="font-size: 1.6rem; color: #f59e0b; font-weight: 900;">☄️</div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: #ef4444; font-weight: 800; letter-spacing: 1px; margin-bottom: 2px;">MẠNG ĐỐI THỦ</div>
            <div style="font-size: 1.3rem;">${renderHearts(meteorGameState.opponentLives)}</div>
          </div>
        </div>

        <!-- CANVAS -->
        <div style="position: relative; width: 100%; height: 380px; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 18px;">
           <canvas id="meteor-canvas" width="732" height="380" style="width: 100%; height: 100%; display: block;"></canvas>
        </div>
        
        <!-- INPUT -->
        <div style="width: 100%;">
          <input id="meteor-input" type="text" 
                 oninput="window.onMeteorInput(this.value)"
                 placeholder="Gõ từ vựng tiếng Anh để bắn vỡ thiên thạch..."
                 autofocus
                 autocomplete="off"
                 style="width: 100%; padding: 14px 20px; font-size: 1.25rem; text-align: center; border-radius: 14px; border: 2px solid rgba(16, 185, 129, 0.4); background: rgba(15, 23, 42, 0.8); color: white; outline: none; transition: border-color 0.2s;" />
        </div>
      </div>
    </div>
  `;
};
