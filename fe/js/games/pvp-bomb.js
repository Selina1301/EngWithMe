window.bombGameState = {
  initialized: false,
  myTimer: 60,
  opponentTimer: 60,
  hasBomb: false,
  words: [],
  currentWordIndex: 0,
  inputValue: '',
  timerInterval: null,
  gameOverSent: false,
  wordHoldTime: 0,
  lastTickTimestamp: Date.now()
};

function getPvpRoomId() {
  return pvpManager?.roomId || window.pvpRoomId || new URLSearchParams(window.location.search).get("room") || "";
}

window.onBombAction = function(data) {
  if (data.action === 'pass_bomb') {
    bombGameState.hasBomb = true;
    bombGameState.opponentTimer = data.payload.timer;
    bombGameState.wordHoldTime = 0;
    bombGameState.lastTickTimestamp = Date.now();
    
    if (data.payload && data.payload.wordIndex !== undefined && bombGameState.words[data.payload.wordIndex]) {
      bombGameState.currentWordIndex = data.payload.wordIndex;
      bombGameState.inputValue = '';
    } else {
      pickNewBombWord();
    }
    if (typeof window.render === 'function') window.render();
  } else if (data.action === 'timer_sync') {
    bombGameState.opponentTimer = data.payload.timer;
    const oppEl = document.getElementById('bomb-opp-timer');
    if (oppEl) oppEl.innerText = bombGameState.opponentTimer + 's';
  } else if (data.action === 'boom') {
    // Opponent exploded! I win!
    if (!bombGameState.gameOverSent) {
      bombGameState.gameOverSent = true;
      if (bombGameState.timerInterval) clearInterval(bombGameState.timerInterval);
      const myId = pvpManager?.socket?.id;
      pvpManager?.socket?.emit('finish_game', {
        roomId: getPvpRoomId(),
        winnerId: myId
      });
    }
  }
};

function pickNewBombWord() {
  if (bombGameState.words.length > 0) {
    let nextIndex = Math.floor(Math.random() * bombGameState.words.length);
    if (nextIndex === bombGameState.currentWordIndex && bombGameState.words.length > 1) {
      nextIndex = (nextIndex + 1) % bombGameState.words.length;
    }
    bombGameState.currentWordIndex = nextIndex;
  }
  bombGameState.inputValue = '';
  bombGameState.wordHoldTime = 0;
}

// Background Tab Visibility Change Handler
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && bombGameState.initialized && bombGameState.hasBomb && !bombGameState.gameOverSent) {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - bombGameState.lastTickTimestamp) / 1000);
    if (elapsedSeconds > 0) {
      bombGameState.myTimer = Math.max(0, bombGameState.myTimer - elapsedSeconds);
      bombGameState.wordHoldTime += elapsedSeconds;
      bombGameState.lastTickTimestamp = now;

      const myEl = document.getElementById('bomb-my-timer');
      if (myEl) {
        myEl.innerText = bombGameState.myTimer + 's';
        if (bombGameState.myTimer <= 10) myEl.style.color = '#ef4444';
      }

      if (bombGameState.myTimer <= 0) {
        if (bombGameState.timerInterval) clearInterval(bombGameState.timerInterval);
        bombGameState.gameOverSent = true;
        const myId = pvpManager?.socket?.id;
        const oppPlayer = pvpManager?.players?.find(p => p.id !== myId);

        pvpManager?.socket?.emit('game_action', {
           roomId: getPvpRoomId(),
           action: 'boom'
        });
        pvpManager?.socket?.emit('finish_game', {
           roomId: getPvpRoomId(),
           winnerId: oppPlayer ? oppPlayer.id : null
        });
      }
    }
  }
});

window.renderBombGame = function(topic) {
  if (!bombGameState.initialized) {
    bombGameState.words = topic.words;
    const urlParams = new URLSearchParams(window.location.search);
    const starterParam = urlParams.get("starter");
    const mySid = urlParams.get("sid") || pvpManager?.socket?.id;
    let startsWithBomb = false;

    if (starterParam && mySid) {
      startsWithBomb = (starterParam === mySid);
    } else {
      startsWithBomb = (pvpManager?.players?.[0]?.id === pvpManager?.socket?.id) || pvpManager?.isHost || false;
    }

    bombGameState.hasBomb = startsWithBomb;
    bombGameState.myTimer = 60;
    bombGameState.opponentTimer = 60;
    bombGameState.gameOverSent = false;
    bombGameState.wordHoldTime = 0;
    bombGameState.lastTickTimestamp = Date.now();
    bombGameState.initialized = true;
    pickNewBombWord();

    if (bombGameState.timerInterval) clearInterval(bombGameState.timerInterval);
    bombGameState.timerInterval = setInterval(() => {
      if (!window.pvpCountdownDone) {
        bombGameState.lastTickTimestamp = Date.now();
        return;
      }

      if (bombGameState.hasBomb) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - bombGameState.lastTickTimestamp) / 1000);

        if (elapsedSeconds >= 1) {
          bombGameState.myTimer = Math.max(0, bombGameState.myTimer - elapsedSeconds);
          bombGameState.wordHoldTime += elapsedSeconds;
          bombGameState.lastTickTimestamp += elapsedSeconds * 1000;

          // Direct DOM update for timer to prevent input focus loss
          const myEl = document.getElementById('bomb-my-timer');
          if (myEl) {
            myEl.innerText = bombGameState.myTimer + 's';
            if (bombGameState.myTimer <= 10) myEl.style.color = '#ef4444';
          }

          // 10s auto-refresh word if player is stuck
          if (bombGameState.wordHoldTime >= 10) {
            pickNewBombWord();
            const wordEl = document.getElementById('bomb-target-meaning');
            const inputEl = document.getElementById('bomb-input');
            const tipEl = document.getElementById('bomb-skip-tip');
            if (wordEl && bombGameState.words[bombGameState.currentWordIndex]) {
              wordEl.innerText = bombGameState.words[bombGameState.currentWordIndex].meaning;
            }
            if (inputEl) {
              inputEl.value = '';
              inputEl.focus();
            }
            if (tipEl) {
              tipEl.style.opacity = '1';
              setTimeout(() => { if (tipEl) tipEl.style.opacity = '0'; }, 2000);
            }
          }

          // Sync every 3 seconds to keep opponent UI updated
          if (bombGameState.myTimer % 3 === 0) {
             pvpManager?.socket?.emit('game_action', {
               roomId: getPvpRoomId(),
               action: 'timer_sync',
               payload: { timer: bombGameState.myTimer }
             });
          }

          // Explosion check
          if (bombGameState.myTimer <= 0) {
            clearInterval(bombGameState.timerInterval);
            if (!bombGameState.gameOverSent) {
              bombGameState.gameOverSent = true;
              const myId = pvpManager?.socket?.id;
              const oppPlayer = pvpManager?.players?.find(p => p.id !== myId);

              pvpManager?.socket?.emit('game_action', {
                 roomId: getPvpRoomId(),
                 action: 'boom'
              });
              pvpManager?.socket?.emit('finish_game', {
                 roomId: getPvpRoomId(),
                 winnerId: oppPlayer ? oppPlayer.id : null
              });
            }
          }
        }
      }
    }, 500);
  }

  window.onBombInput = function(val) {
     bombGameState.inputValue = val;
     const targetWord = bombGameState.words[bombGameState.currentWordIndex];

     if (targetWord && val.toLowerCase().trim() === targetWord.word.toLowerCase().trim() && bombGameState.hasBomb) {
        // Correct answer! Pick next word index for opponent and pass bomb
        bombGameState.hasBomb = false;
        
        let nextWordIndex = Math.floor(Math.random() * bombGameState.words.length);
        if (nextWordIndex === bombGameState.currentWordIndex && bombGameState.words.length > 1) {
          nextWordIndex = (nextWordIndex + 1) % bombGameState.words.length;
        }

        pvpManager?.socket?.emit('game_action', {
           roomId: getPvpRoomId(),
           action: 'pass_bomb',
           payload: { timer: bombGameState.myTimer, wordIndex: nextWordIndex }
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
            <div id="bomb-my-timer" style="font-size: 2.2rem; font-weight: 900; color: ${myTimerColor}; font-family: monospace;">${bombGameState.myTimer}s</div>
            <div style="font-size: 0.85rem; font-weight: 700; color: ${bombGameState.hasBomb ? '#ef4444' : '#4ade80'};">${bombGameState.hasBomb ? '💣 Cầm Bom' : '✅ An Toàn'}</div>

            <!-- Row 3: Bomb Icon Separator -->
            <div style="font-size: 2.6rem; color: #ef4444; margin: 4px 0; filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.6));">💣</div>

            <!-- Row 4: MẠNG ĐỐI THỦ -->
            <div style="font-size: 0.82rem; color: #ef4444; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;">THỜI GIAN ĐỐI THỦ</div>

            <!-- Row 5: Timer P2 -->
            <div id="bomb-opp-timer" style="font-size: 2.2rem; font-weight: 900; color: ${oppTimerColor}; font-family: monospace;">${bombGameState.opponentTimer}s</div>
            <div style="font-size: 0.85rem; font-weight: 700; color: ${!bombGameState.hasBomb ? '#ef4444' : '#4ade80'};">${!bombGameState.hasBomb ? '💣 Cầm Bom' : '✅ An Toàn'}</div>
          </div>

          <!-- COL 2: BOMB GAME PLAY CONTAINER -->
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 30px 24px; min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative;">

             <div id="bomb-skip-tip" style="position: absolute; top: 16px; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; opacity: 0; transition: opacity 0.3s ease;">
                ⏱️ Đã qua 10s: Tự động đổi sang từ mới!
             </div>

             <div style="font-size: 0.85rem; color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Nghĩa tiếng Việt của từ:</div>
             <div id="bomb-target-meaning" style="font-size: 2.3rem; font-weight: 900; color: #ffffff; margin-bottom: 28px; text-shadow: 0 0 20px rgba(255,255,255,0.2);">
               ${targetWord ? targetWord.meaning : ''}
             </div>

             <input id="bomb-input" type="text"
                    value="${bombGameState.inputValue}"
                    oninput="window.onBombInput(this.value)"
                    placeholder="${bombGameState.hasBomb ? '💣 Gõ từ tiếng Anh tương ứng để chuyền bom sang đối thủ...' : '⏳ Chờ đối thủ gõ để chuyền bom...'}"
                    ${!bombGameState.hasBomb ? 'disabled' : ''}
                    autocomplete="off"
                    style="width: 100%; max-width: 540px; padding: 16px 20px; font-size: 1.25rem; text-align: center; border-radius: 14px; border: 2px solid ${bombGameState.hasBomb ? '#ef4444' : 'rgba(255,255,255,0.15)'}; background: rgba(15, 23, 42, 0.8); color: white; outline: none; transition: border-color 0.2s;" />
          </div>

        </div>
      </div>
    </div>
  `;
};
