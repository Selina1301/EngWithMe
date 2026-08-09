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
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        border: 2px solid #ef4444 !important;
      }
      @keyframes pulseRed {
        0% { background-color: rgba(15, 23, 42, 0.9); }
        50% { background-color: rgba(239, 68, 68, 0.15); }
        100% { background-color: rgba(15, 23, 42, 0.9); }
      }
      .pulse-red {
        animation: pulseRed 1s infinite;
      }
    </style>
    <div style="max-width: 720px; margin: 30px auto 0 auto;">
      
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 4px 8px; color: #cbd5e1;">
        <a href="game.html?tab=online" style="text-decoration: none; color: rgba(255,255,255,0.4); font-weight: 500;">
          <span style="font-size: 1.7rem; line-height: 1;">←</span> Back
        </a>
      </div>

      <!-- GAME BOARD -->
      <div class="game-board ${bgClass}" style="background: rgba(15, 23, 42, 0.9); border-radius: 20px; padding: 30px; border: 1px solid rgba(255,255,255,0.1); text-align: center; position: relative;">
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 5px;">BẠN</div>
            <div style="font-size: 2.5rem; font-weight: 800; color: ${myTimerColor}; font-family: monospace;">${bombGameState.myTimer}s</div>
            ${bombGameState.hasBomb ? '<div style="font-size: 2rem; margin-top: 10px; animation: pulseRed 0.5s infinite alternate;">💣</div>' : ''}
          </div>
          
          <div style="flex: 1; text-align: center; border-left: 1px solid rgba(255,255,255,0.1);">
            <div style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 5px;">ĐỐI THỦ</div>
            <div style="font-size: 2.5rem; font-weight: 800; color: ${oppTimerColor}; font-family: monospace;">${bombGameState.opponentTimer}s</div>
            ${!bombGameState.hasBomb ? '<div style="font-size: 2rem; margin-top: 10px;">💣</div>' : ''}
          </div>
        </div>

        <div style="margin: 40px 0;">
           <div style="font-size: 1.5rem; font-weight: 600; color: #fff; margin-bottom: 20px;">
             ${targetWord ? targetWord.meaning : ''}
           </div>
           
           <input id="bomb-input" type="text" 
                  value="${bombGameState.inputValue}"
                  oninput="window.onBombInput(this.value)"
                  placeholder="${bombGameState.hasBomb ? 'Gõ từ tiếng Anh...' : 'Chờ đối thủ gõ...'}"
                  ${!bombGameState.hasBomb ? 'disabled' : 'autofocus'}
                  autocomplete="off"
                  style="width: 80%; padding: 15px; font-size: 1.5rem; text-align: center; border-radius: 12px; border: 2px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; outline: none;" />
        </div>
      </div>
    </div>
  `;
};
