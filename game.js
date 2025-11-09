
    // --- Juego ---
    const boardEl = document.getElementById('board');
    const statusTurn = document.getElementById('turn');
    const resetBtn = document.getElementById('reset');
    const swapBtn = document.getElementById('swap');
    const soundToggle = document.getElementById('soundToggle');
    const modeAiBtn = document.getElementById('modeAI');
    const scoreXEl = document.getElementById('scoreX');
    const scoreOEl = document.getElementById('scoreO');
    const scoreDEl = document.getElementById('scoreD');
        let difficulty = "hard";
    document.getElementById("difficulty").addEventListener("change", (e)=>{
  difficulty = e.target.value;
});


    let currentPlayer = 'X';
    let board = Array(9).fill(null);
    let soundOn = true;
    let scores = { X:0, O:0, D:0 };
    let modeAI = true; // El Jugador O ahora es automático siempre (IA perfecta)

    // Create 9 cells
    for(let i=0;i<9;i++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      cell.addEventListener('click', ()=> makeMove(i));
      boardEl.appendChild(cell);
    }

    // --- Audio: simple synth using WebAudio API (no files needed) ---
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

    // short glitchy sound for mark
    function markSound(player){
      if(player === 'X'){
        playTone(480,'sawtooth',0.12);
        setTimeout(()=>playTone(760,'square',0.08),40);
      }else{
        // AI mark has slightly different flavor
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

    // --- Game logic ---
    const winningLines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    function makeMove(i){
      // ignore invalid clicks
      if(board[i] || checkWinner(board)) return;
      board[i] = currentPlayer;
      renderBoard();
      markSound(currentPlayer);

      const win = checkWinner(board);
      if(win){
        highlightWin(win.line);
        winSound();
        scores[win.player]++;
        updateScores();
        setTimeout(()=> resetBoard(false),800);
        return;
      }
      if(board.every(Boolean)){
        drawSound();
        scores.D++;
        updateScores();
        setTimeout(()=> resetBoard(false),700);
        return;
      }

      // swap turn
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      statusTurn.textContent = currentPlayer;

      if(modeAI && currentPlayer === 'O'){
  setTimeout(()=>{

    let pick;

    if(difficulty === "easy"){
      // IA aleatoria
      const empties = board.map((v,i)=> v?null:i).filter(v=>v!==null);
      pick = empties[Math.floor(Math.random()*empties.length)];

    } else if(difficulty === "medium"){
      // IA intermedia: intenta ganar o bloquear
      pick = findSmartMove(board) ?? randomMove(board);

    } else {
      // IA difícil (Minimax perfecto)
      pick = bestMove(board, 'O');
    }

    if(typeof pick === 'number') makeMove(pick);
  }, 260);
}

    }

    function renderBoard(){
      Array.from(boardEl.children).forEach((cellEl, idx)=>{
        const val = board[idx];

        // Limpiamos texto (ya no usamos letras)
        cellEl.textContent = '';

        // Quitamos clases anteriores
        cellEl.classList.remove('X','O');

        // Si hay una ficha, aplicamos la imagen correspondiente
        if(val){
          cellEl.classList.add(val);
        }
      });
    }

    function checkWinner(b){
      for(const line of winningLines){
        if(b[line[0]] && b[line[0]] === b[line[1]] && b[line[1]] === b[line[2]]){
          return { player: b[line[0]], line };
        }
      }
      return null;
    }

    // draw an animated line across the board to show the win
    let lineEl = null;
    function highlightWin(line){
      if(lineEl) lineEl.remove();
      const coords = lineToCoords(line);
      lineEl = document.createElement('div');
      lineEl.className = 'line';
      document.body.appendChild(lineEl);
      lineEl.style.width = coords.length + 'px';
      lineEl.style.left = coords.left + 'px';
      lineEl.style.top = coords.top + 'px';
      lineEl.style.transform = `rotate(${coords.angle}deg)`;
      lineEl.style.opacity = '0.95';
      setTimeout(()=>{ if(lineEl) lineEl.style.opacity='0'; lineEl && setTimeout(()=>lineEl.remove(),500); },900);
    }

    function lineToCoords(line){
      // compute relative positions
      const rect = boardEl.getBoundingClientRect();
      const gap = 10;
      const cellW = (rect.width - gap*2) / 3;
      const cellH = (rect.height - gap*2) / 3;
      const centers = Array.from({length:9},(_,i)=>{
        const r = Math.floor(i/3), c = i%3;
        const left = rect.left + gap + c*(cellW + gap) + cellW/2;
        const top  = rect.top + gap + r*(cellH + gap) + cellH/2;
        return {left,top};
      });
      const a = centers[line[0]]; const b = centers[line[2]];
      const length = Math.hypot(b.left - a.left, b.top - a.top);
      const angle = Math.atan2(b.top - a.top, b.left - a.left) * 180 / Math.PI;
      const left = (a.left + b.left)/2 - length/2;
      const top = (a.top + b.top)/2 - 3; // center the 6px line
      return {length, angle, left, top};
    }

    function resetBoard(clearScores=true){
      board = Array(9).fill(null);
      renderBoard();
      currentPlayer = 'X';
      statusTurn.textContent = currentPlayer;
      if(clearScores){ scores = {X:0,O:0,D:0}; updateScores(); }
    }

    function updateScores(){
      scoreXEl.textContent = scores.X;
      scoreOEl.textContent = scores.O;
      scoreDEl.textContent = scores.D;
    }

    // Controls
    resetBtn.addEventListener('click', ()=>{ resetBoard(true); });
    swapBtn.addEventListener('click', ()=>{ currentPlayer = currentPlayer === 'X'? 'O' : 'X'; statusTurn.textContent = currentPlayer; });
    soundToggle.addEventListener('click', ()=>{ soundOn = !soundOn; soundToggle.textContent = 'Sonido: ' + (soundOn? 'ON':'OFF'); if(soundOn) playTone(440,'sine',0.08)});
    modeAiBtn.addEventListener('click', ()=>{ modeAI = !modeAI; modeAiBtn.textContent = 'Modo AI: ' + (modeAI? 'ON':'OFF'); });


    function randomMove(b){
  const empties = b.map((v,i)=> v?null:i).filter(v=>v!==null);
  return empties[Math.floor(Math.random()*empties.length)];
}

// IA Intermedia: intenta ganar o bloquear
function findSmartMove(b){
  // primero intenta ganar
  for(const line of winningLines){
    const [a,b1,c] = line;
    const vals = [b[a], b[b1], b[c]];
    if(vals.filter(v=>v==='O').length===2 && vals.includes(null))
      return line[vals.indexOf(null)];
  }
  // luego intenta bloquear
  for(const line of winningLines){
    const [a,b1,c] = line;
    const vals = [b[a], b[b1], b[c]];
    if(vals.filter(v=>v==='X').length===2 && vals.includes(null))
      return line[vals.indexOf(null)];
  }
  return null;
}

    // --- MINIMAX (IA perfecta) ---
    // returns best index for player ('X' or 'O') on the current board
    function bestMove(boardState, player){
      // if first move and center empty, choose center for stronger play
      if(boardState.every(v=>v===null)){
        return 4; // center
      }
      const result = minimax(boardState.slice(), player, 0);
      return result.index;
    }

    // minimax returns {score, index}
    function minimax(b, player, depth){
      const winner = checkWinner(b);
      if(winner){
        // terminal
        if(winner.player === 'O') return {score: 10 - depth};
        if(winner.player === 'X') return {score: depth - 10};
      }
      if(b.every(Boolean)){
        return {score: 0}; // draw
      }

      const avail = b.map((v,i)=> v? null : i).filter(v=>v!==null);

      const isMaximizing = (player === 'O'); // O is maximizer
      let best = isMaximizing ? {score: -Infinity, index: null} : {score: Infinity, index: null};

      for(const idx of avail){
        b[idx] = player;
        const nextPlayer = player === 'O' ? 'X' : 'O';
        const res = minimax(b, nextPlayer, depth+1);
        b[idx] = null;

        // pick best depending on maximizing/minimizing
        if(isMaximizing){
          if(res.score > best.score){
            best = {score: res.score, index: idx};
          }
        } else {
          if(res.score < best.score){
            best = {score: res.score, index: idx};
          }
        }
      }

      return best;
    }

    // Initialize
    renderBoard(); updateScores();

    // ensure audio context resumed on first interaction (mobile rules)
    document.addEventListener('click', ()=>{ if(aCtx.state === 'suspended') aCtx.resume(); }, {once:true});

    // small UX: animate entrance
    document.querySelectorAll('.cell').forEach((c,idx)=>{ c.style.transform='translateY(20px)'; setTimeout(()=> c.style.transform='translateY(0)', 60*idx); });
