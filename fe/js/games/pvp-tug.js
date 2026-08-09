window.tugGameState = {
  initialized: false,
  flagPos: 0, // 0 is center. > 0 is towards me. < 0 is towards opponent.
  words: [],
  currentWordIndex: 0,
  options: [],
  target: 10,
  gameOverSent: false
};

window.onTugAction = function(data) {
  if (data.action === 'pull') {
    // Opponent pulled towards them (-1)
    tugGameState.flagPos--;
    if (typeof window.render === 'function') window.render();
    checkTugWinCondition();
  }
};

function pickNewTugQuestion() {
  if (tugGameState.words.length > 0) {
    tugGameState.currentWordIndex = Math.floor(Math.random() * tugGameState.words.length);
    const correctWord = tugGameState.words[tugGameState.currentWordIndex];
    
    // Generate 3 wrong options
    let wrongOptions = [];
    while (wrongOptions.length < 3 && tugGameState.words.length > 3) {
      let r = Math.floor(Math.random() * tugGameState.words.length);
      if (r !== tugGameState.currentWordIndex && !wrongOptions.includes(tugGameState.words[r].meaning)) {
        wrongOptions.push(tugGameState.words[r].meaning);
      }
    }
    
    // Mix options
    tugGameState.options = [correctWord.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);
  }
}

function checkTugWinCondition() {
  if (tugGameState.gameOverSent) return;

  const myId = pvpManager?.socket?.id;
  const oppPlayer = pvpManager?.players?.find(p => p.id !== myId);

  if (tugGameState.flagPos >= tugGameState.target) {
    tugGameState.gameOverSent = true;
    pvpManager?.socket?.emit('finish_game', {
       roomId: window.pvpRoomId || pvpManager?.roomId,
       winnerId: myId
    });
  } else if (tugGameState.flagPos <= -tugGameState.target) {
    tugGameState.gameOverSent = true;
    pvpManager?.socket?.emit('finish_game', {
       roomId: window.pvpRoomId || pvpManager?.roomId,
       winnerId: oppPlayer ? oppPlayer.id : null
    });
  }
}

window.renderTugGame = function(topic) {
  if (!tugGameState.initialized) {
    tugGameState.words = topic.words;
    tugGameState.initialized = true;
    tugGameState.flagPos = 0;
    tugGameState.gameOverSent = false;
    pickNewTugQuestion();
  }
  
  window.onTugAnswer = function(selectedMeaning) {
     if (!window.pvpCountdownDone) return;

     const correctWord = tugGameState.words[tugGameState.currentWordIndex];
     if (selectedMeaning === correctWord.meaning) {
        tugGameState.flagPos++;
        pvpManager?.socket?.emit('game_action', {
           roomId: window.pvpRoomId || pvpManager.roomId,
           action: 'pull'
        });
        checkTugWinCondition();
     } else {
        tugGameState.flagPos = Math.max(-tugGameState.target, tugGameState.flagPos - 1);
        pvpManager?.socket?.emit('game_action', {
           roomId: window.pvpRoomId || pvpManager.roomId,
           action: 'pull'
        });
        checkTugWinCondition();
     }
     pickNewTugQuestion();
     if (typeof window.render === 'function') window.render();
  };
  
  const correctWord = tugGameState.words[tugGameState.currentWordIndex];
  
  let percent = 50 + (tugGameState.flagPos * (50 / tugGameState.target));
  percent = Math.max(0, Math.min(100, percent));

  const myPullText = tugGameState.flagPos > 0 ? `+${tugGameState.flagPos}` : `${tugGameState.flagPos}`;
  const oppPullText = tugGameState.flagPos < 0 ? `+${Math.abs(tugGameState.flagPos)}` : `${-tugGameState.flagPos}`;

  return `
    <div style="width: 100%; max-width: 960px; margin: 0 auto;">
      <div class="pvp-game-board" style="background: rgba(15, 23, 42, 0.95); border-radius: 20px; padding: 24px; border: 1.5px solid rgba(59, 130, 246, 0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
        
        <div style="display: grid; grid-template-columns: 210px 1fr; gap: 24px; align-items: start;">
          
          <!-- COL 1: 5-ROW TUG STATUS PANEL -->
          <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 24px 14px; text-align: center; display: flex; flex-direction: column; gap: 16px; align-items: center; justify-content: center; min-height: 440px;">
            <!-- Row 1: MẠNG CỦA BẠN -->
            <div style="font-size: 0.82rem; color: #38bdf8; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;">LỰC KÉO CỦA BẠN</div>
            
            <!-- Row 2: My Tug Distance -->
            <div style="font-size: 2rem; font-weight: 900; color: ${tugGameState.flagPos > 0 ? '#10b981' : '#cbd5e1'}; font-family: monospace;">${myPullText} / ${tugGameState.target}</div>
            
            <!-- Row 3: Tug Swords Icon Separator -->
            <div style="font-size: 2.6rem; color: #38bdf8; margin: 4px 0; filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.6));">⚔️</div>
            
            <!-- Row 4: MẠNG ĐỐI THỦ -->
            <div style="font-size: 0.82rem; color: #ef4444; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;">LỰC KÉO ĐỐI THỦ</div>
            
            <!-- Row 5: Opponent Tug Distance -->
            <div style="font-size: 2rem; font-weight: 900; color: ${tugGameState.flagPos < 0 ? '#ef4444' : '#cbd5e1'}; font-family: monospace;">${oppPullText} / ${tugGameState.target}</div>
          </div>

          <!-- COL 2: TUG ROPE & QUESTION CONTAINER -->
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 24px; min-height: 440px; display: flex; flex-direction: column; justify-content: space-between;">
             
             <!-- ROPE AREA -->
             <div style="background: rgba(15, 23, 42, 0.8); padding: 18px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
               <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: 800; font-size: 0.95rem; letter-spacing: 1px;">
                 <span style="color: #ef4444; display: flex; align-items: center; gap: 6px;">🚩 ĐỐI THỦ</span>
                 <span style="color: #f59e0b; font-weight: 700;">VỊ TRÍ CỜ (${tugGameState.flagPos > 0 ? '+' + tugGameState.flagPos : tugGameState.flagPos})</span>
                 <span style="color: #10b981; display: flex; align-items: center; gap: 6px;">BẠN 🚩</span>
               </div>
               
               <div style="height: 16px; background: linear-gradient(90deg, #ef4444 0%, #3b82f6 50%, #10b981 100%); border-radius: 99px; position: relative; box-shadow: inset 0 2px 6px rgba(0,0,0,0.6);">
                 <div style="position: absolute; left: 50%; top: -8px; bottom: -8px; width: 4px; background: #ffffff; transform: translateX(-50%); border-radius: 2px; box-shadow: 0 0 8px rgba(255,255,255,0.8);"></div>
                 
                 <div style="position: absolute; left: ${percent}%; top: 50%; transform: translate(-50%, -50%); transition: left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    <div style="font-size: 2.2rem; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.8)); transform: translateY(-4px);">🚩</div>
                 </div>
               </div>
             </div>

             <!-- QUESTION AREA -->
             <div style="margin-top: 20px;">
                <div style="font-size: 0.85rem; color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; text-align: center;">Chọn nghĩa đúng của từ:</div>
                <div style="font-size: 2.3rem; font-weight: 900; color: #ffffff; margin-bottom: 24px; text-align: center; text-shadow: 0 0 20px rgba(255,255,255,0.2);">
                  ${correctWord ? correctWord.word : ''}
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; text-align: left;">
                  ${tugGameState.options.map(opt => `
                    <button onclick="window.onTugAnswer('${opt.replace(/'/g, "\\'")}')" 
                            style="padding: 16px 18px; min-height: 60px; border-radius: 14px; border: 1.5px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: #f8fafc; cursor: pointer; font-size: 1.02rem; font-weight: 600; transition: all 0.25s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"
                            onmouseover="this.style.borderColor='#38bdf8'; this.style.background='rgba(56, 189, 248, 0.12)'; this.style.transform='translateY(-2px)';"
                            onmouseout="this.style.borderColor='rgba(255,255,255,0.12)'; this.style.background='rgba(255,255,255,0.04)'; this.style.transform='none';">
                      ${opt}
                    </button>
                  `).join('')}
                </div>
             </div>

          </div>

        </div>
      </div>
    </div>
  `;
};
