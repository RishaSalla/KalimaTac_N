"use strict";
document.addEventListener("DOMContentLoaded", () => {
    
    // --- [1] تعريف العناصر الأساسية ---
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    
    const appContainer = $("#app-container");
    const playerNameXInput = $("#player-name-x"); 
    const playerNameOInput = $("#player-name-o");
    
    // عناصر الدخول الجديدة
    const accessCodeInput = $("#access-code");
    const rememberMeCheck = $("#remember-me");
    const loginBtn = $("#login-btn");

    const timerSelectHome = $("#settings-timer-home"); 
    const roundsSelectHome = $("#settings-rounds-home");
    const inputCatsHome = $("#input-cats-home");
    const chipContainerCatsHome = $("#chip-container-cats-home");

    const soundsToggleHome = $("#toggle-sounds-home");
    const themeToggleHome = $("#toggle-theme-home"); 
    const themeToggleTextHome = $("#theme-toggle-text-home");
    
    const startGameBtn = $("#start-game-btn"); 
    const resumeGameBtn = $("#resume-game-btn");
    const instructionsBtnHome = $("#open-instructions-home-btn"); 

    const gameTitle = $("#game-title"); 
    const roundInfo = $("#round-info");
    const scoreXDisplay = $("#game-scores .score-tag.score-x"); 
    const scoreODisplay = $("#game-scores .score-tag.score-o");
    const instructionsBtnGame = $("#open-instructions-game-btn");
    const restartRoundBtn = $("#restart-round-btn"); 
    const endMatchBtn = $("#end-match-btn"); 
    const newRoundBtn = $("#new-round-btn"); 
    const themeToggleGame = $("#toggle-theme-game");
    const themeToggleTextGame = $("#theme-toggle-text-game"); 
    const playerTagX = $("#player-tag-x");
    const playerTagO = $("#player-tag-o"); 
    const timerText = $("#timer-text"); 
    const timerHint = $("#timer-hint");
    
    const gameBoard = $("#game-board"); 
    const modalAnswer = $("#modal-answer"); 
    const answerLetter = $("#answer-letter");
    const answerCategory = $("#answer-category"); 
    const answerTimerBar = $("#answer-timer-bar");
    const answerTurnHint = $("#answer-turn-hint"); 
    const answerCorrectBtn = $("#answer-correct-btn");
    const answerWrongBtn = $("#answer-wrong-btn"); 

    const finalWinnerText = $("#final-winner-text");
    const finalWinsX = $("#final-wins-x");
    const finalWinsO = $("#final-wins-o");
    const newMatchBtn = $("#new-match-btn"); 
    const backToHomeBtn = $("#back-to-home-btn"); 
    const confirmRestartBtn = $("#confirm-restart-btn");
    const modalCloseBtns = $$(".modal-close-btn"); 
    const confettiCanvas = $("#confetti-canvas");
    const confettiCtx = confettiCanvas.getContext("2d"); 
    let confettiParticles = [];
    const roundWinnerMessage = $("#round-winner-message");
    const playerXMemberDisplay = $("#player-x-member");
    const playerOMemberDisplay = $("#player-o-member");

    // --- [2] حالة اللعبة (State Model) ---
    const BASE_CATEGORIES = ["إنسان", "حيوان", "جماد", "نبات", "بلاد"];
    const ARABIC_LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];
    const DEFAULT_STATE = {
        settings: { 
            secs: 10, sounds: true, theme: "light", extraCats: [], 
            playerNames: { X: "فريق X", O: "فريق O" },
            playMode: "team", teamMembers: { X: [], O: [] }, 
        },
        match: { round: 1, totalScore: { X: 0, O: 0 }, totalRounds: 3, usedCombinations: [] }, 
        roundState: { board: [], scores: { X: 0, O: 0 }, starter: "X", phase: null, activeCell: null, gameActive: true, winInfo: null, teamMemberIndex: { X: 0, O: 0 } },
        timer: { intervalId: null, deadline: 0 }
    };
    let state = JSON.parse(JSON.stringify(DEFAULT_STATE)); 

    // --- [3] نظام الدخول والتحقق (Auth Logic) ---
    async function hashSHA256(string) {
        const utf8 = new TextEncoder().encode(string);
        const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function handleLogin() {
        const inputCode = accessCodeInput.value.trim();
        if (!inputCode) return;
        
        try {
            const response = await fetch('data/hashedCodes.json');
            const data = await response.json();
            const hashedInput = await hashSHA256(inputCode);

            if (data.codes.includes(hashedInput)) {
                if (rememberMeCheck.checked) {
                    localStorage.setItem("kalimatac_auth", "true");
                }
                switchView("home");
                if (state.settings.sounds) sounds.success();
            } else {
                accessCodeInput.classList.add("shake");
                setTimeout(() => accessCodeInput.classList.remove("shake"), 500);
                if (state.settings.sounds) sounds.fail();
            }
        } catch (error) {
            console.error("Error loading auth data:", error);
            alert("خطأ في الاتصال بقاعدة بيانات الأكواد.");
        }
    }

    // --- [4] نظام الصوت والاحتفال (Audio & Confetti) ---
    let audioCtx;
    const sounds = { click: () => {}, success: () => {}, fail: () => {}, win: () => {}, draw: () => {}, timerTick: () => {} };
    function initAudio() {
        if (audioCtx || !state.settings.sounds) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            sounds.click = () => playSound(200, 0.1, 0.05, "triangle");
            sounds.success = () => { playSound(523, 0.1, 0.08, "sine"); playSound(659, 0.1, 0.08, "sine", 0.1); };
            sounds.fail = () => { playSound(200, 0.1, 0.1, "square"); playSound(160, 0.1, 0.1, "square", 0.1); };
            sounds.win = () => { [523, 659, 784, 1046].forEach((f, i) => playSound(f, 0.1, 0.1 + (i*0.1), "sine", i*0.1)); };
            sounds.draw = () => { [440, 349, 261].forEach((f, i) => playSound(f, 0.1, 0.1, "sawtooth", i*0.1)); };
            sounds.timerTick = () => playSound(440, 0.2, 0.05, "square");
        } catch (e) { state.settings.sounds = false; }
    }
    function playSound(freq, gain, duration, type = "sine", delay = 0) {
        if (!audioCtx || !state.settings.sounds) return;
        const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        g.gain.setValueAtTime(gain, audioCtx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + delay); osc.stop(audioCtx.currentTime + delay + duration);
    }
    function runConfetti() { 
        if (!confettiCanvas) return; confettiParticles = []; confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight;
        const colors = ["#60a5fa", "#34d399", "#faf089"];
        for (let i = 0; i < 150; i++) {
            confettiParticles.push({ x: Math.random() * confettiCanvas.width, y: -20, size: Math.random() * 8 + 4, color: colors[Math.floor(Math.random() * colors.length)], speedX: Math.random() * 4 - 2, speedY: Math.random() * 3 + 2, angle: Math.random() * 6, spin: Math.random() * 0.2 - 0.1 });
        }
        let start = Date.now();
        function anim() {
            if (Date.now() - start > 3000) { confettiCtx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height); return; }
            confettiCtx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
            confettiParticles.forEach(p => {
                p.x += p.speedX; p.y += p.speedY; p.angle += p.spin; p.speedY += 0.02;
                confettiCtx.fillStyle = p.color; confettiCtx.save();
                confettiCtx.translate(p.x, p.y); confettiCtx.rotate(p.angle);
                confettiCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size); confettiCtx.restore();
            });
            requestAnimationFrame(anim);
        }
        anim();
    }

    // --- [5] منطق اللعبة الذكي (Unique Combination Logic) ---
    function getUniqueCombination(excludeLetters = []) {
        const allCats = [...BASE_CATEGORIES, ...state.settings.extraCats];
        let attempts = 0;
        while (attempts < 100) {
            const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
            if (excludeLetters.includes(letter)) { attempts++; continue; }
            
            let availableCats = [...allCats];
            if (['ض', 'ظ'].includes(letter)) availableCats = availableCats.filter(c => c !== 'نبات');
            const category = availableCats[Math.floor(Math.random() * availableCats.length)];
            
            return { letter, category };
        }
        return { letter: ARABIC_LETTERS[0], category: allCats[0] }; // Fallback
    }

    // --- [6] إدارة الواجهة والشرائح (UI & Chips) ---
    function switchView(view) { appContainer.setAttribute("data-view", view); }
    function toggleModal(id) { 
        $$(".modal-overlay.visible").forEach(m => m.classList.remove("visible")); 
        if (id) { const m = $(`#${id}`); if (m) m.classList.add("visible"); }
    }

    function renderChips(team) {
        const container = (team === 'X' ? $("#chip-container-x-home") : $("#chip-container-o-home"));
        if (!container) return;
        const input = container.querySelector('input');
        container.querySelectorAll('.chip').forEach(c => c.remove());
        state.settings.teamMembers[team].forEach(name => {
            const chip = document.createElement('span'); chip.className = 'chip'; chip.textContent = name;
            const rm = document.createElement('span'); rm.className = 'chip-remove'; rm.textContent = '×';
            rm.onclick = () => { 
                state.settings.teamMembers[team] = state.settings.teamMembers[team].filter(n => n !== name);
                renderChips(team); saveStateToLocalStorage();
            };
            chip.appendChild(rm); container.insertBefore(chip, input);
        });
    }

    window.handleChipInput = function(e, team, ignore, isBtn) {
        const input = isBtn ? $(`#input-team-${team.toLowerCase()}-home`) : e.target;
        const val = input.value.trim();
        if ((isBtn || e.key === 'Enter') && val) {
            if (!state.settings.teamMembers[team].includes(val)) {
                state.settings.teamMembers[team].push(val);
                input.value = ''; renderChips(team); saveStateToLocalStorage();
            }
        }
    }

    window.handleChipInputCategories = function(isBtn, e) {
        const input = $("#input-cats-home");
        const val = input.value.trim();
        if ((isBtn || (e && e.key === 'Enter')) && val) {
            if (!state.settings.extraCats.includes(val) && !BASE_CATEGORIES.includes(val)) {
                state.settings.extraCats.push(val);
                input.value = ''; renderChipsCategories(); saveStateToLocalStorage();
            }
        }
    }

    function renderChipsCategories() {
        if (!chipContainerCatsHome) return;
        const input = $("#input-cats-home");
        chipContainerCatsHome.querySelectorAll('.chip').forEach(c => c.remove());
        state.settings.extraCats.forEach(cat => {
            const chip = document.createElement('span'); chip.className = 'chip'; chip.textContent = cat;
            const rm = document.createElement('span'); rm.className = 'chip-remove'; rm.textContent = '×';
            rm.onclick = () => {
                state.settings.extraCats = state.settings.extraCats.filter(c => c !== cat);
                renderChipsCategories(); saveStateToLocalStorage();
            };
            chip.appendChild(rm); chipContainerCatsHome.insertBefore(chip, input);
        });
    }

    function updatePlayerInputLabels(mode) {
        const isTeam = mode === 'team';
        $$('.team-members-group').forEach(g => g.style.display = isTeam ? 'flex' : 'none');
        playerNameXInput.placeholder = isTeam ? "اسم فريق X" : "اسم اللاعب X";
        playerNameOInput.placeholder = isTeam ? "اسم فريق O" : "اسم اللاعب O";
    }

    window.togglePlayMode = function(ignore, mode) {
        state.settings.playMode = mode;
        $$('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        updatePlayerInputLabels(mode);
        saveStateToLocalStorage();
    }

    function applyTheme() {
        const t = state.settings.theme; document.documentElement.setAttribute("data-theme", t);
        const txt = t === "dark" ? "ثيم فاتح" : "ثيم غامق";
        if (themeToggleTextHome) themeToggleTextHome.textContent = txt;
        if (themeToggleTextGame) themeToggleTextGame.textContent = txt;
    }

    function toggleTheme() { 
        state.settings.theme = state.settings.theme === "light" ? "dark" : "light"; 
        applyTheme(); saveStateToLocalStorage(); sounds.click(); 
    }

    // --- [7] إدارة المباراة والجولات (Match Management) ---
    function startNewMatch() {
        initAudio();
        state.settings.secs = parseInt(timerSelectHome.value, 10);
        state.match.totalRounds = parseInt(roundsSelectHome.value, 10);
        state.settings.playerNames.X = playerNameXInput.value.trim() || (state.settings.playMode === 'team' ? "فريق X" : "لاعب X");
        state.settings.playerNames.O = playerNameOInput.value.trim() || (state.settings.playMode === 'team' ? "فريق O" : "لاعب O");
        
        const currentSettings = JSON.parse(JSON.stringify(state.settings));
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        state.settings = currentSettings;
        state.match.totalRounds = parseInt(roundsSelectHome.value, 10);

        initNewRound();
        updatePlayerTags();
        switchView("game");
    }

    function initNewRound(isRestart = false) {
        stopTimer();
        roundWinnerMessage.style.display = 'none';
        if (!isRestart) state.roundState.starter = (state.match.round % 2 === 1) ? "X" : "O";
        state.roundState.phase = null; state.roundState.activeCell = null; state.roundState.gameActive = true;
        state.roundState.winInfo = null; state.roundState.scores = { X: 0, O: 0 };
        if (!isRestart) state.roundState.teamMemberIndex = { X: 0, O: 0 };

        generateBoard();
        renderBoard();
        updateScoreboard();
        updateTurnUI();
        
        newRoundBtn.style.display = 'none';
        restartRoundBtn.style.display = 'inline-flex';
        endMatchBtn.style.display = 'inline-flex';
        saveStateToLocalStorage();
    }

    function generateBoard() {
        state.roundState.board = [];
        const currentLetters = [];
        for (let i = 0; i < 9; i++) {
            const { letter, category } = getUniqueCombination(currentLetters);
            currentLetters.push(letter);
            state.roundState.board.push({ letter, category, owner: null, revealed: false, tried: new Set() });
        }
    }

    function renderBoard() {
        gameBoard.innerHTML = '';
        state.roundState.board.forEach((cell, i) => {
            const cellEl = document.createElement('div');
            cellEl.className = `board-cell ${cell.owner ? 'owned player-'+cell.owner.toLowerCase() : ''} ${cell.revealed ? 'revealed' : ''}`;
            cellEl.dataset.index = i;
            
            const letterEl = document.createElement('span');
            letterEl.className = 'cell-letter';
            letterEl.textContent = cell.owner || cell.letter;
            
            const catEl = document.createElement('span');
            catEl.className = 'cell-category';
            catEl.textContent = cell.owner ? '' : cell.category;
            
            cellEl.append(letterEl, catEl);
            cellEl.onclick = () => onCellClick(i);
            gameBoard.appendChild(cellEl);
        });
        if (state.roundState.winInfo) drawWinLine(state.roundState.winInfo.line);
    }

    function onCellClick(i) {
        if (!state.roundState.gameActive || state.roundState.phase !== null) return;
        const cell = state.roundState.board[i];
        if (cell.owner) return;

        stopTimer();
        state.roundState.activeCell = i;
        state.roundState.phase = state.roundState.starter;
        cell.revealed = true;
        renderBoard();
        updateTurnUI();
        
        answerLetter.textContent = cell.letter;
        answerCategory.textContent = cell.category;
        answerTurnHint.textContent = `دور ${state.settings.playerNames[state.roundState.phase]}`;
        toggleModal("modal-answer");
        startAnswerTimer();
    }

    function handleAnswer(isCorrect) {
        stopTimer();
        const cell = state.roundState.board[state.roundState.activeCell];
        const player = state.roundState.phase;

        if (isCorrect) {
            cell.owner = player; cell.revealed = false;
            state.roundState.scores[player]++;
            if (state.settings.playMode === 'team') advanceMember(player);
            state.roundState.starter = (player === "X") ? "O" : "X";
            
            const win = checkWin();
            if (win) endRound(player, win);
            else if (state.roundState.board.every(c => c.owner)) endRound(null);
            else { toggleModal(null); state.roundState.phase = null; }
        } else {
            if (!cell.tried.has(player)) {
                cell.tried.add(player);
                state.roundState.phase = (player === "X") ? "O" : "X";
                updateTurnUI();
                answerTurnHint.textContent = `دور ${state.settings.playerNames[state.roundState.phase]}`;
                startAnswerTimer();
                return;
            } else {
                // فشل كلاهما -> تغيير الحرف بمنطق "الاستثناء"
                const lettersOnBoard = state.roundState.board.map(c => c.letter);
                const { letter, category } = getUniqueCombination(lettersOnBoard);
                cell.letter = letter; cell.category = category;
                cell.revealed = false; cell.tried.clear();
                if (state.settings.playMode === 'team') advanceMember(state.roundState.starter);
                state.roundState.starter = (state.roundState.starter === "X") ? "O" : "X";
                toggleModal(null);
                state.roundState.phase = null;
            }
        }
        renderBoard(); updateTurnUI(); updateScoreboard(); saveStateToLocalStorage();
    }

    function advanceMember(p) {
        const members = state.settings.teamMembers[p];
        if (members.length) state.roundState.teamMemberIndex[p] = (state.roundState.teamMemberIndex[p] + 1) % members.length;
    }

    function checkWin() {
        const b = state.roundState.board;
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let l of lines) { if (b[l[0]].owner && b[l[0]].owner === b[l[1]].owner && b[l[0]].owner === b[l[2]].owner) return l; }
        return null;
    }

    function endRound(winner, line) {
        state.roundState.gameActive = false;
        if (winner) {
            state.match.totalScore[winner]++;
            state.roundState.winInfo = { winner, line };
            roundWinnerMessage.textContent = `الفائز بالجولة: ${state.settings.playerNames[winner]}!`;
            roundWinnerMessage.style.display = 'block';
            setTimeout(runConfetti, 500);
        } else {
            roundWinnerMessage.textContent = "تعادل!";
            roundWinnerMessage.style.display = 'block';
        }

        const winGoal = Math.ceil(state.match.totalRounds / 2);
        if (state.match.totalScore.X === winGoal || state.match.totalScore.O === winGoal) {
            setTimeout(() => toggleModal("modal-final-score"), 2000);
        } else {
            state.match.round++;
            newRoundBtn.style.display = 'inline-flex';
        }
        renderBoard(); saveStateToLocalStorage();
    }

    // --- [8] المزامنة والحفظ (Persistence) ---
    function saveStateToLocalStorage() {
        const copy = JSON.parse(JSON.stringify(state));
        copy.timer = { intervalId: null, deadline: 0 };
        copy.roundState.board.forEach(c => c.tried = Array.from(c.tried));
        localStorage.setItem("kalimatac_state", JSON.stringify(copy));
    }

    function loadState() {
        const saved = localStorage.getItem("kalimatac_state");
        if (saved) {
            const data = JSON.parse(saved);
            data.roundState.board.forEach(c => c.tried = new Set(c.tried));
            state = data; return true;
        }
        return false;
    }

    // --- [9] المؤقت والمساعدة (Timer Helpers) ---
    function startAnswerTimer() {
        stopTimer();
        const dur = state.settings.secs * 1000;
        state.timer.deadline = Date.now() + dur;
        answerTimerBar.style.setProperty('--timer-duration', `${state.settings.secs}s`);
        answerTimerBar.classList.add("animating");
        state.timer.intervalId = setInterval(() => {
            if (Date.now() >= state.timer.deadline) handleAnswer(false);
        }, 100);
    }
    function stopTimer() { clearInterval(state.timer.intervalId); answerTimerBar.classList.remove("animating"); }

    function updateScoreboard() {
        roundInfo.textContent = `الجولة ${state.match.round} (Best of ${state.match.totalRounds})`;
        scoreXDisplay.textContent = `${state.settings.playerNames.X}: ${state.match.totalScore.X}`;
        scoreODisplay.textContent = `${state.settings.playerNames.O}: ${state.match.totalScore.O}`;
    }

    function updatePlayerTags() {
        playerTagX.querySelector('.player-name-text').textContent = state.settings.playerNames.X;
        playerTagO.querySelector('.player-name-text').textContent = state.settings.playerNames.O;
        updateTurnUI();
    }

    function updateTurnUI() {
        const turn = state.roundState.phase || state.roundState.starter;
        const isTeam = state.settings.playMode === 'team';
        const member = isTeam ? state.settings.teamMembers[turn][state.roundState.teamMemberIndex[turn]] : "";
        timerText.textContent = member ? `دور ${state.settings.playerNames[turn]} (${member})` : `دور ${state.settings.playerNames[turn]}`;
        
        playerTagX.classList.toggle("active", turn === "X");
        playerTagO.classList.toggle("active", turn === "O");

        if (isTeam) {
            playerXMemberDisplay.textContent = `(${state.settings.teamMembers.X[state.roundState.teamMemberIndex.X] || ""})`;
            playerOMemberDisplay.textContent = `(${state.settings.teamMembers.O[state.roundState.teamMemberIndex.O] || ""})`;
        }
    }

    function drawWinLine(line) {
        const cells = $$(".board-cell");
        const s = cells[line[0]], e = cells[line[2]];
        const lineEl = document.createElement('div'); lineEl.className = 'win-line';
        const rectS = s.getBoundingClientRect(), rectE = e.getBoundingClientRect(), board = gameBoard.getBoundingClientRect();
        const x1 = rectS.left + rectS.width/2 - board.left, y1 = rectS.top + rectS.height/2 - board.top;
        const x2 = rectE.left + rectE.width/2 - board.left, y2 = rectE.top + rectE.height/2 - board.top;
        const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        lineEl.style.width = `${dist}px`; lineEl.style.left = `${x1}px`; lineEl.style.top = `${y1}px`;
        lineEl.style.transform = `rotate(${Math.atan2(y2-y1, x2-x1)}rad)`;
        gameBoard.appendChild(lineEl);
    }

    // --- [10] بدء التشغيل وربط الأحداث ---
    function init() {
        loginBtn.onclick = handleLogin;
        startGameBtn.onclick = startNewMatch;
        themeToggleHome.onclick = toggleTheme;
        themeToggleGame.onclick = toggleTheme;
        soundsToggleHome.onclick = () => { state.settings.sounds = !state.settings.sounds; soundsToggleHome.setAttribute("data-active", state.settings.sounds); };
        instructionsBtnHome.onclick = () => toggleModal("modal-instructions");
        instructionsBtnGame.onclick = () => toggleModal("modal-instructions");
        answerCorrectBtn.onclick = () => handleAnswer(true);
        answerWrongBtn.onclick = () => handleAnswer(false);
        newRoundBtn.onclick = () => initNewRound(false);
        restartRoundBtn.onclick = () => toggleModal("modal-confirm-restart");
        confirmRestartBtn.onclick = () => { toggleModal(null); initNewRound(true); };
        endMatchBtn.onclick = () => toggleModal("modal-final-score");
        newMatchBtn.onclick = () => { localStorage.removeItem("kalimatac_state"); location.reload(); };
        backToHomeBtn.onclick = () => switchView("home");

        modalCloseBtns.forEach(b => b.onclick = () => toggleModal(null));

        if (localStorage.getItem("kalimatac_auth") === "true") {
            switchView("home");
        }
        
        if (loadState()) {
            resumeGameBtn.style.display = "inline-flex";
            resumeGameBtn.onclick = () => { updatePlayerTags(); updateScoreboard(); renderBoard(); switchView("game"); };
        }
        
        renderChipsCategories();
        applyTheme();
    }

    init();
});
