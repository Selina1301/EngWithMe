window.bombGameState = {
  initialized: false,
  myTimer: 60,
  opponentTimer: 60,
  hasBomb: false,
  words: [],
  currentWordIndex: 0,
  inputValue: '',
  timerInterval: null,
  gameOverSent: false
};

window.onBombAction = function(data) {
  if (data.action === 'pass_bomb') {
    bombGameState.hasBomb = true;
    bombGameState.opponentTimer = data.payload.timer;
    pickNewBombWord();
    if (typeof window.render === 'function') window.render();
  } else if (data.action === 'timer_sync') {
    bombGameState.opponentTimer = data.payload.timer;
    if (typeof window.render === 'function') window.render();
  } else if (data.action === 'boom') {
    // Opponent exploded! I win!
    if (!bombGameState.gameOverSent) {
      bombGameState.gameOverSent = true;
      if (bombGameState.timerInterval) clearInterval(bombGameState.timerInterval);
      const myId = pvpManager?.socket?.id;
      pvpManager?.socket?.emit('finish_game', {
        roomId: window.pvpRoomId || pvpManager?.roomId,
        winnerId: myId
      });
    }
  }
};

function pickNewBombWord() {
  if (bombGameState.words.length > 0) {
    bombGameState.currentWordIndex = Math.floor(Math.random() * bombGameState.words.length);
  }
  bombGameState.inputValue = '';
}

window.renderBombGame = function(topic) {
  if (!bombGameState.initialized) {
    bombGameState.words = topic.words;
    bombGameState.initialized = true;
    bombGameState.myTimer = 60;
    bombGameState.opponentTimer = 60;
    bombGameState.hasBomb = window.pvpManager?.isHost || false; // Host starts with bomb
    bombGameState.gameOverSent = false;
    pickNewBombWord();

    if (bombGameState.timerInterval) clearInterval(bombGameState.timerInterval);
    bombGameState.timerInterval = setInterval(() => {
      if (!window.pvpCountdownDone) return;

      if (bombGameState.hasBomb) {
        bombGameState.myTimer--;
        
        // Sync every 3 seconds to keep opponent UI updated
        if (bombGameState.myTimer % 3 === 0) {
           pvpManager?.socket?.emit('game_action', {
             roomId: window.pvpRoomId || pvpManager.roomId,
             action: 'timer_sync',
             payload: { timer: bombGameState.myTimer }
           });
        }
        
        if (bombGameState.myTimer <= 0) {
          clearInterval(bombGameState.timerInterval);
          if (!bombGameState.gameOverSent) {
            bombGameState.gameOverSent = true;
            const myId = pvpManager?.socket?.id;
            const oppPlayer = pvpManager?.players?.find(p => p.id !== myId);
            
            pvpManager?.socket?.emit('game_action', {
               roomId: window.pvpRoomId || pvpManager.roomId,
               action: 'boom'
            });
            pvpManager?.socket?.emit('finish_game', {
               roomId: window.pvpRoomId || pvpManager.roomId,
               winnerId: oppPlayer ? oppPlayer.id : null
            });
          }
        }
        
        if (typeof window.render === 'function') window.render();
      }
    }, 1000);
  }
  
  window.onBombInput = function(val) {
     bombGameState.inputValue = val;
     const targetWord = bombGameState.words[bombGameState.currentWordIndex];
     
     if (targetWord && val.toLowerCase().trim() === targetWord.word.toLowerCase().trim() && bombGameState.hasBomb) {
        bombGameState.hasBomb = false;
        pvpManager?.socket?.emit('game_action', {
           roomId: window.pvpRoomId || pvpManager.roomId,
           action: 'pass_bomb',
           payload: { timer: bombGameState.myTimer }
        });
        if (typeof window.render === 'function') window.render();
     }
  };
  
  const targetWord = bombGameState.words[bombGameState.currentWordIndex];
  
  const bgClass = bombGameState.hasBomb ? 'bomb-active pulse-red' : '';
  const myTimerColor = bombGameState.myTimer <= 10 ? '#ef4444' : '#38bdf8';
  const oppTimerColor = bombGameState.opponentTimer <= 10 ? '#ef4444' : '#f87171';

  return `
    <style>
      .bomb-active {
        box-shadow: 0 0 35px rgba(239, 68, 68, 0.6);
        border: 2px solid #ef4444 !important;
      }
      @keyframes pulseRed {
        0% { background-color: rgba(15, 23, 42, 0.95); }
        50% { background-color: rgba(239, 68, 68, 0.2); }
        100% { background-color: rgba(15, 23, 42, 0.95); }
      }
      .pulse-red {
        animation: pulseRed 1s infinite alternate;
      }
    </style>
    <div style="width: 100%; max-width: 960px; margin: 0 auto;">
      <div class="pvp-game-board ${bgClass}" style="background: rgba(15, 23, 42, 0.95); border-radius: 20px; padding: 24px; border: 1.5px solid rgba(239, 68, 68, 0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
        
        <div style="display: grid; grid-template-columns: 210px 1fr; gap: 24px; align-items: start;">
          
          <!-- COL 1: 5-ROW BOMB STATUS PANEL -->
          <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 24px 14px; text-align: center; display: flex; flex-direction: column; gap: 16px; align-items: center; justify-content: center; min-height: 400px;">
            <!-- Row 1: MẠNG CỦA BẠN -->
            <div style="font-size: 0.82rem; color: #38bdf8; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;">THỜI GIAN BẠN</div>
            
            <!-- Row 2: Timer P1 -->
            <div style="font-size: 2.2rem; font-weight: 900; color: ${myTimerColor}; font-family: monospace;">${bombGameState.myTimer}s</div>
            <div style="font-size: 0.85rem; font-weight: 700; color: ${bombGameState.hasBomb ? '#ef4444' : '#4ade80'};">${bombGameState.hasBomb ? '💣 Cầm Bom' : '✅ An Toàn'}</div>

            <!-- Row 3: Bomb Icon Separator -->
            <div style="font-size: 2.6rem; color: #ef4444; margin: 4px 0; filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.6));">💣</div>
            
            <!-- Row 4: MẠNG ĐỐI THỦ -->
            <div style="font-size: 0.82rem; color: #ef4444; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;">THỜI GIAN ĐỐI THỦ</div>
            
            <!-- Row 5: Timer P2 -->
            <div style="font-size: 2.2rem; font-weight: 900; color: ${oppTimerColor}; font-family: monospace;">${bombGameState.opponentTimer}s</div>
            <div style="font-size: 0.85rem; font-weight: 700; color: ${!bombGameState.hasBomb ? '#ef4444' : '#4ade80'};">${!bombGameState.hasBomb ? '💣 Cầm Bom' : '✅ An Toàn'}</div>
          </div>

          <!-- COL 2: BOMB GAME PLAY CONTAINER -->
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 30px 24px; min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
             <div style="font-size: 0.85rem; color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Nghĩa tiếng Việt của từ:</div>
             <div style="font-size: 2.3rem; font-weight: 900; color: #ffffff; margin-bottom: 28px; text-shadow: 0 0 20px rgba(255,255,255,0.2);">
               ${targetWord ? targetWord.meaning : ''}
             </div>
             
             <input id="bomb-input" type="text" 
                    value="${bombGameState.inputValue}"
                    oninput="window.onBombInput(this.value)"
                    placeholder="${bombGameState.hasBomb ? '💣 Gõ từ tiếng Anh tương ứng để chuyền bom sang đối thủ...' : '⏳ Chờ đối thủ gõ để chuyền bom...'}"
                    ${!bombGameState.hasBomb ? 'disabled' : 'autofocus'}
                    autocomplete="off"
                    style="width: 100%; max-width: 540px; padding: 16px 20px; font-size: 1.25rem; text-align: center; border-radius: 14px; border: 2px solid ${bombGameState.hasBomb ? '#ef4444' : 'rgba(255,255,255,0.15)'}; background: rgba(15, 23, 42, 0.8); color: white; outline: none; transition: border-color 0.2s;" />
          </div>

        </div>
      </div>
    </div>
  `;
};
