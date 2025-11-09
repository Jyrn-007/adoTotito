// game.js — limpio y robusto
document.addEventListener('DOMContentLoaded', () => {
  // Elements (select safely)
  const boardEl = document.getElementById('board');
  const statusTurn = document.getElementById('turn');
  const resetBtn = document.getElementById('reset');
  const swapBtn = document.getElementById('swap');
  const soundToggle = document.getElementById('soundToggle');
  const modeAiBtn = document.getElementById('modeAI');
  const scoreXEl = document.getElementById('scoreX');
  const scoreOEl = document.getElementById('scoreO');
  const scoreDEl = document.getElementById('scoreD');
  const difficultySelect = document.getElementById('difficulty');

  // guard clause: required elements
  if(!boardEl || !statusTurn || !resetBtn) {
    console.error('Elementos HTML faltantes. Asegúrate de que index.html contenga board, turn y reset.');
    return;
  }

  // Game state
  let currentPlayer = 'X';
  let board = Array(9).fill(null);
  let soundOn = true;
  let scores = { X: 0, O: 0, D: 0 };
  let modeAI = true;
  let difficulty = difficultySelect ? difficultySelect.value : 'hard';

  // Create 9 cells
  function createCells() {
    boardEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', `Celda ${i+1}`);
      cell.addEventListener('click', () => makeMove(i));
      boardEl.appendChild(cell);
    }
  }

  createCells();

  // Audio
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const aCtx = new AudioCtx();
  function playTone(freq, type='sine', duration=0.12){
    if(!soundOn) return;
    const o = aCtx.createOscillator();
    const g = aCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(aCtx.destination);
    const now = aCtx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.start(now); o.stop(now + duration + 0.02);
  }
  function markSound(player){
    if(player === 'X'){
      playTone(480,'sawtooth',0.12);
      setTimeout(()=>playTone(760,'square',0.08),40);
    }else{
      playTone(320,'triangle',0.12);
      setTimeout(()=>playTone(240,'sine',0.08),40);
    }
  }
  function winSound(){
    playTone(880,'sine',0.15);
    setTimeout(()=>playTone(660,'sine',0.12),90);
  }
  function drawSound(){
    playTone(330,'sine',0.18);
    setTimeout(()=>playTone(290,'sine',0.12),120);
  }

  // Winning lines
  const winningLines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  // Render board
  function renderBoard(){
    Array.from(boardEl.children).forEach((cellEl, idx) => {
      const val = board[idx];
      cellEl.classList.remove('X','O');
      cellEl.textContent = ''; // no text, we use background images
      if(val) cellEl.classList.add(val);
    });
  }

  // Check winner
  function checkWinner(b){
    for(const line of winningLines){
      if(b[line[0]] && b[line[0]] === b[line[1]] && b[line[1]] === b[line[2]]){
        return { player: b[line[0]], line };
      }
    }
    return null;
  }

  // Highlight win line
  let lineEl = null;
  function highlightWin(line){
    if(lineEl){ lineEl.remove(); lineEl = null; }
    const coords = lineToCoords(line);
    if(!coords) return;
    lineEl = document.createElement('div');
    lineEl.className = 'line';
    document.body.appendChild(lineEl);
    lineEl.style.width = coords.length + 'px';
    lineEl.style.left = coords.left + 'px';
    lineEl.style.top = coords.top + 'px';
    lineEl.style.transform = `rotate(${coords.angle}deg)`;
    lineEl.style.opacity = '0.98';
    setTimeout(()=> {
      if(lineEl) lineEl.style.opacity = '0';
      setTimeout(()=> { lineEl && lineEl.remove(); lineEl = null; }, 500);
    }, 900);
  }

  // Calculate coordinates for win line
  function lineToCoords(line){
    if(!boardEl) return null;
    const rect = boardEl.getBoundingClientRect();
    // gap must match CSS gap (we used 12px default); if the board is computed differently this still works approx
    const gap = 12;
    const cellW = (rect.width - gap*2) / 3;
    const cellH = (rect.height - gap*2) / 3;
    const centers = Array.from({length:9}, (_, i) => {
      const r = Math.floor(i/3), c = i%3;
      const left = rect.left + gap + c*(cellW + gap) + cellW/2;
      const top  = rect.top + gap + r*(cellH + gap) + cellH/2;
      return { left, top };
    });
    const a = centers[line[0]], b = centers[line[2]];
    const length = Math.hypot(b.left - a.left, b.top - a.top);
    const angle = Math.atan2(b.top - a.top, b.left - a.left) * 180 / Math.PI;
    const left = (a.left + b.left)/2 - length/2;
    const top = (a.top + b.top)/2 - 3;
    return { length, angle, left, top };
  }

  // Reset board
  function resetBoard(clearScores = true){
    board = Array(9).fill(null);
    renderBoard();
    currentPlayer = 'X';
    statusTurn.textContent = currentPlayer;
    if(clearScores){ scores = { X:0, O:0, D:0 }; updateScores(); }
  }

  // Update scores UI
  function updateScores(){
    if(scoreXEl) scoreXEl.textContent = scores.X;
    if(scoreOEl) scoreOEl.textContent = scores.O;
    if(scoreDEl) scoreDEl.textContent = scores.D;
  }

  // Controls listeners
  if(resetBtn) resetBtn.addEventListener('click', () => resetBoard(true));
  if(swapBtn) swapBtn.addEventListener('click', () => { currentPlayer = (currentPlayer === 'X') ? 'O' : 'X'; statusTurn.textContent = currentPlayer; });
  if(soundToggle) soundToggle.addEventListener('click', () => { soundOn = !soundOn; soundToggle.textContent = 'Sonido: ' + (soundOn ? 'ON' : 'OFF'); if(soundOn) playTone(440,'sine',0.08); });
  if(modeAiBtn) modeAiBtn.addEventListener('click', () => { modeAI = !modeAI; modeAiBtn.textContent = 'Modo AI: ' + (modeAI ? 'ON' : 'OFF'); });

  if(difficultySelect) difficultySelect.addEventListener('change', (e) => { difficulty = e.target.value; });

  // Move logic
  function makeMove(i){
    if(board[i] || checkWinner(board)) return;
    board[i] = currentPlayer;
    renderBoard();
    markSound(currentPlayer);

    const win = checkWinner(board);
    if(win){
      highlightWin(win.line);
      winSound();
      scores[win.player] = (scores[win.player] || 0) + 1;
      updateScores();
      setTimeout(()=> resetBoard(false), 900);
      return;
    }

    if(board.every(Boolean)){
      drawSound();
      scores.D++;
      updateScores();
      setTimeout(()=> resetBoard(false), 700);
      return;
    }

    currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
    statusTurn.textContent = currentPlayer;

    if(modeAI && currentPlayer === 'O'){
      setTimeout(() => {
        let pick;
        if(difficulty === 'easy') {
          pick = randomMove(board);
        } else if(difficulty === 'medium') {
          pick = findSmartMove(board) ?? randomMove(board);
        } else {
          pick = bestMove(board, 'O');
        }
        if(typeof pick === 'number') makeMove(pick);
      }, 260);
    }
  }

  // Random move helper
  function randomMove(b){
    const empties = b.map((v,i) => v ? null : i).filter(v=>v!==null);
    return empties[Math.floor(Math.random() * empties.length)];
  }

  // Smart helper (tries to win or block)
  function findSmartMove(b){
    // try win
    for(const line of winningLines){
      const [a, c, d] = line; // using different var names not to shadow
      const vals = [b[line[0]], b[line[1]], b[line[2]]];
      if(vals.filter(v=>v==='O').length === 2 && vals.includes(null)) return line[vals.indexOf(null)];
    }
    // try block
    for(const line of winningLines){
      const vals = [b[line[0]], b[line[1]], b[line[2]]];
      if(vals.filter(v=>v==='X').length === 2 && vals.includes(null)) return line[vals.indexOf(null)];
    }
    return null;
  }

  // MINIMAX for perfect play
  function bestMove(boardState, player){
    if(boardState.every(v => v === null)) return 4; // center first
    const result = minimax(boardState.slice(), player, 0);
    return result.index;
  }

  function minimax(b, player, depth){
    const winner = checkWinner(b);
    if(winner){
      if(winner.player === 'O') return { score: 10 - depth };
      if(winner.player === 'X') return { score: depth - 10 };
    }
    if(b.every(Boolean)) return { score: 0 };

    const avail = b.map((v,i) => v ? null : i).filter(v => v !== null);
    const isMax = (player === 'O');
    let best = isMax ? { score: -Infinity, index: null } : { score: Infinity, index: null };

    for(const idx of avail){
      b[idx] = player;
      const next = player === 'O' ? 'X' : 'O';
      const res = minimax(b, next, depth + 1);
      b[idx] = null;

      if(isMax){
        if(res.score > best.score) best = { score: res.score, index: idx };
      } else {
        if(res.score < best.score) best = { score: res.score, index: idx };
      }
    }
    return best;
  }

  // Initialize UI
  renderBoard();
  updateScores();

  // Resume audio context on first user gesture (mobile)
  document.addEventListener('click', () => { if(aCtx.state === 'suspended') aCtx.resume(); }, { once: true });

  // Small entrance animation
  Array.from(document.querySelectorAll('.cell')).forEach((c, idx) => {
    c.style.transform = 'translateY(20px)';
    setTimeout(() => c.style.transform = 'translateY(0)', 40 * idx);
  });

  // Handle window resize: re-render line if present after resize to reposition
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // remove any lingering line and recalc position if there is a winner
      const w = checkWinner(board);
      if(w) highlightWin(w.line);
    }, 120);
  });

}); // DOMContentLoaded
