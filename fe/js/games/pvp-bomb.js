window.bombGameState = {
  initialized: false,
  myTimer: 60,
  opponentTimer: 60,
  hasBomb: false,
  words: [],
  currentWordIndex: 0,
  inputValue: '',
  timerInterval: null
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
    // I win because opponent exploded!
    if (typeof pvpManager !== 'undefined' && pvpManager.socket) {
      pvpManager.socket.emit('update_score', {
        roomId: window.pvpRoomId || pvpManager.roomId,
        score: 1,
        maxScore: 1
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
    pickNewBombWord();

    bombGameState.timerInterval = setInterval(() => {
      if (bombGameState.hasBomb) {
        bombGameState.myTimer--;
        
        // Sync every 3 seconds to keep opponent UI updated without spamming
        if (bombGameState.myTimer % 3 === 0) {
           pvpManager?.socket?.emit('game_action', {
             roomId: window.pvpRoomId || pvpManager.roomId,
             action: 'timer_sync',
             payload: { timer: bombGameState.myTimer }
           });
        }
        
        if (bombGameState.myTimer <= 0) {
          clearInterval(bombGameState.timerInterval);
          pvpManager?.socket?.emit('game_action', {
             roomId: window.pvpRoomId || pvpManager.roomId,
             action: 'boom'
          });
          // I lose, so my score is 0, opponent score is 1
          // Let the opponent's 'boom' handler claim the win to avoid race conditions.
        }
        
        if (typeof window.render === 'function') window.render();
      }
    }, 1000);
  }
  
  // Clean up previous listeners if any (simple hack for React-like render)
  window.onBombInput = function(val) {
     bombGameState.inputValue = val;
     const targetWord = bombGameState.words[bombGameState.currentWordIndex];
     
     if (val.toLowerCase().trim() === targetWord.word.toLowerCase().trim() && bombGameState.hasBomb) {
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
  const myTimerColor = bombGameState.myTimer <= 10 ? '#ef4444' : '#4ade80';
  const oppTimerColor = bombGameState.opponentTimer <= 10 ? '#ef4444' : '#4ade80';

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
    <div style="width: 100%; max-width: 800px; margin: 0 auto;">
      <div class="pvp-game-board ${bgClass}" style="background: rgba(15, 23, 42, 0.95); border-radius: 24px; padding: 32px; border: 1.5px solid rgba(239, 68, 68, 0.3); text-align: center; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
        
        <!-- STATUS TIMERS -->
        <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 1; text-align: center; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 0.8rem; font-weight: 800; color: #3b82f6; letter-spacing: 1px; margin-bottom: 4px;">BẠN HỮU</div>
            <div style="font-size: 2.8rem; font-weight: 900; color: ${myTimerColor}; font-family: monospace;">${bombGameState.myTimer}s</div>
            ${bombGameState.hasBomb ? '<div style="font-size: 2.2rem; margin-top: 6px; animation: pulseRed 0.5s infinite alternate;">💣 (Cầm bom)</div>' : '<div style="font-size: 0.85rem; color: #94a3b8; margin-top: 6px;">An toàn</div>'}
          </div>
          
          <div style="flex: 1; text-align: center; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 0.8rem; font-weight: 800; color: #ef4444; letter-spacing: 1px; margin-bottom: 4px;">ĐỐI THỦ</div>
            <div style="font-size: 2.8rem; font-weight: 900; color: ${oppTimerColor}; font-family: monospace;">${bombGameState.opponentTimer}s</div>
            ${!bombGameState.hasBomb ? '<div style="font-size: 2.2rem; margin-top: 6px;">💣 (Cầm bom)</div>' : '<div style="font-size: 0.85rem; color: #94a3b8; margin-top: 6px;">An toàn</div>'}
          </div>
        </div>

        <!-- MEANING & INPUT -->
        <div style="margin: 30px 0 10px 0;">
           <div style="font-size: 0.85rem; color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Nghĩa tiếng Việt của từ:</div>
           <div style="font-size: 2.2rem; font-weight: 900; color: #ffffff; margin-bottom: 24px;">
             ${targetWord ? targetWord.meaning : ''}
           </div>
           
           <input id="bomb-input" type="text" 
                  value="${bombGameState.inputValue}"
                  oninput="window.onBombInput(this.value)"
                  placeholder="${bombGameState.hasBomb ? '💣 Gõ từ tiếng Anh để chuyền bom sang đối thủ...' : '⏳ Chờ đối thủ gõ để chuyền bom...'}"
                  ${!bombGameState.hasBomb ? 'disabled' : 'autofocus'}
                  autocomplete="off"
                  style="width: 100%; padding: 16px 20px; font-size: 1.25rem; text-align: center; border-radius: 14px; border: 2px solid ${bombGameState.hasBomb ? '#ef4444' : 'rgba(255,255,255,0.15)'}; background: rgba(0,0,0,0.4); color: white; outline: none; transition: border-color 0.2s;" />
        </div>
      </div>
    </div>
  `;
};
