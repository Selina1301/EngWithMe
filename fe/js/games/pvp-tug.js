window.tugGameState = {
  initialized: false,
  flagPos: 0, // 0 is center. > 0 is towards me. < 0 is towards opponent.
  words: [],
  currentWordIndex: 0,
  options: [],
  target: 10
};

window.onTugAction = function(data) {
  if (data.action === 'pull') {
    // Opponent pulled
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
    
    // Mix them
    tugGameState.options = [correctWord.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);
  }
}

function checkTugWinCondition() {
  if (tugGameState.flagPos >= tugGameState.target) {
    // I win!
    pvpManager?.socket?.emit('update_score', {
        roomId: window.pvpRoomId || pvpManager.roomId,
        score: 1,
        maxScore: 1
    });
  } else if (tugGameState.flagPos <= -tugGameState.target) {
    // I lose! Opponent's pull will trigger their win on their screen, but just in case:
    // we do nothing and wait for their update_score to trigger game_over.
  }
}

window.renderTugGame = function(topic) {
  if (!tugGameState.initialized) {
    tugGameState.words = topic.words;
    tugGameState.initialized = true;
    tugGameState.flagPos = 0;
    pickNewTugQuestion();
  }
  
  window.onTugAnswer = function(selectedMeaning) {
     const correctWord = tugGameState.words[tugGameState.currentWordIndex];
     if (selectedMeaning === correctWord.meaning) {
        tugGameState.flagPos++;
        pvpManager?.socket?.emit('game_action', {
           roomId: window.pvpRoomId || pvpManager.roomId,
           action: 'pull'
        });
        checkTugWinCondition();
     } else {
        // Penalty for wrong answer? Maybe flag moves to opponent?
        // Let's just do a small stun or just ignore.
     }
     pickNewTugQuestion();
     if (typeof window.render === 'function') window.render();
  };
  
  const correctWord = tugGameState.words[tugGameState.currentWordIndex];
  
  // Calculate flag percentage position (50% is center)
  // flagPos: -10 to 10
  // percent: 0 to 100. If flagPos = 0 -> 50%. If flagPos = 10 -> 100%. If flagPos = -10 -> 0%.
  let percent = 50 + (tugGameState.flagPos * (50 / tugGameState.target));
  percent = Math.max(0, Math.min(100, percent));

  return `
    <div style="max-width: 720px; margin: 30px auto 0 auto;">
      
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 4px 8px; color: #cbd5e1;">
        <a href="game.html?tab=online" style="text-decoration: none; color: rgba(255,255,255,0.4); font-weight: 500;">
          <span style="font-size: 1.7rem; line-height: 1;">←</span> Back
        </a>
      </div>

      <!-- GAME BOARD -->
      <div class="game-board" style="background: rgba(15, 23, 42, 0.9); border-radius: 20px; padding: 30px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
        
        <!-- ROPE AREA -->
        <div style="margin: 40px 0 60px 0; position: relative;">
          <!-- Labels -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold; color: #94a3b8;">
            <span style="color: #ef4444;">ĐỐI THỦ</span>
            <span style="color: #4ade80;">BẠN</span>
          </div>
          
          <!-- Rope Background -->
          <div style="height: 12px; background: #64748b; border-radius: 6px; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
            <!-- Center mark -->
            <div style="position: absolute; left: 50%; top: -10px; bottom: -10px; width: 4px; background: rgba(255,255,255,0.2); transform: translateX(-50%);"></div>
            
            <!-- The Flag -->
            <div style="position: absolute; left: ${percent}%; top: 50%; transform: translate(-50%, -50%); transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);">
               <div style="font-size: 2.5rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">🚩</div>
            </div>
          </div>
        </div>

        <!-- QUESTION AREA -->
        <div style="margin-top: 20px;">
           <div style="font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 20px; letter-spacing: 1px;">
             ${correctWord ? correctWord.word : ''}
           </div>
           
           <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
             ${tugGameState.options.map(opt => `
               <button onclick="window.onTugAnswer('${opt.replace(/'/g, "\\'")}')" 
                       style="padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: white; cursor: pointer; font-size: 1rem; transition: background 0.2s;">
                 ${opt}
               </button>
             `).join('')}
           </div>
        </div>
      </div>
    </div>
  `;
};
