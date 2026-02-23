"use strict";

document.addEventListener("DOMContentLoaded", () => {
    
    // --- [1] تعريف العناصر الأساسية (DOM Selectors) ---
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    
    const appContainer = $("#app-container");
    const playerNameXInput = $("#player-name-x"); 
    const playerNameOInput = $("#player-name-o");
    
    // عناصر نظام الدخول الجديد
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
    
    const roundWinnerMessage = $("#round-winner-message");
    const playerXMemberDisplay = $("#player-x-member");
    const playerOMemberDisplay = $("#player-o-member");

    // --- [2] حالة اللعبة (Game State) ---
    const BASE_CATEGORIES = ["إنسان", "حيوان", "جماد", "نبات", "بلاد"];
    const ARABIC_LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];
    
    const DEFAULT_STATE = {
        settings: { 
            secs: 10, sounds: true, theme: "dark", extraCats: [], 
            playerNames: { X: "فريق X", O: "فريق O" },
            playMode: "team", teamMembers: { X: [], O: [] } 
        },
        match: { round: 1, totalScore: { X: 0, O: 0 }, totalRounds: 3 }, 
        roundState: { 
            board: [], scores: { X: 0, O: 0 }, starter: "X", phase: null, 
            activeCell: null, gameActive: true, winInfo: null, 
            teamMemberIndex: { X: 0, O: 0 } 
        },
        timer: { intervalId: null, deadline: 0 }
    };
    
    let state = JSON.parse(JSON.stringify(DEFAULT_STATE)); 

    // --- [3] نظام الدخول والتحقق (Auth & Security) ---
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

            // التحقق من وجود الهاش داخل مصفوفة valid_hashes
            if (data.valid_hashes && data.valid_hashes.includes(hashedInput)) {
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
            console.error("Auth error:", error);
            alert("خطأ في الاتصال بقاعدة بيانات الأكواد.");
        }
    }

    // --- [4] المنطق الذكي للحروف (Unique Logic) ---
    function getUniqueCombination(excludeLetters = []) {
        const allCats = [...BASE_CATEGORIES, ...state.settings.extraCats];
        let attempts = 0;
        
        while (attempts < 200) {
            const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
            
            // التأكد من أن الحرف ليس موجوداً حالياً على أي خانة في اللوحة
            if (excludeLetters.includes(letter)) {
                attempts++;
                continue;
            }
            
            let availableCats = [...allCats];
            // منطق استثناء لبعض الحروف الصعبة في فئات معينة
            if (['ض', 'ظ'].includes(letter)) {
                availableCats = availableCats.filter(c => c !== 'نبات');
            }
            
            const category = availableCats[Math.floor(Math.random() * availableCats.length)];
            return { letter, category };
        }
        // Fallback في حال تعذر السحب (نادر جداً)
        return { letter: ARABIC_LETTERS[0], category: allCats[0] };
    }

    function generateBoard() {
        state.roundState.board = [];
        const usedLetters = [];
        for (let i = 0; i < 9; i++) {
            const combo = getUniqueCombination(usedLetters);
            usedLetters.push(combo.letter);
            state.roundState.board.push({ 
                letter: combo.letter, 
                category: combo.category, 
                owner: null, 
                revealed: false, 
                tried: new Set() 
            });
        }
    }

    // --- [5] نظام الصوت (Audio Engine) ---
    let audioCtx;
    const sounds = { 
        click: () => {}, success: () => {}, fail: () => {}, 
        win: () => {}, draw: () => {}, timerTick: () => {} 
    };

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
        const osc = audioCtx.createOscillator();
        const gNode = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        gNode.gain.setValueAtTime(gain, audioCtx.currentTime + delay);
        gNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
        osc.connect(gNode); gNode.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + delay); osc.stop(audioCtx.currentTime + delay + duration);
    }

    // --- [6] إدارة الجولات واللعب (Game Logic) ---
    function startNewMatch() {
        initAudio();
        state.settings.secs = parseInt(timerSelectHome.value, 10);
        state.match.totalRounds = parseInt(roundsSelectHome.value, 10);
        
        const isTeam = state.settings.playMode === 'team';
        state.settings.playerNames.X = playerNameXInput.value.trim() || (isTeam ? "فريق X" : "لاعب X");
        state.settings.playerNames.O = playerNameOInput.value.trim() || (isTeam ? "فريق O" : "لاعب O");
        
        state.match.round = 1;
        state.match.totalScore = { X: 0, O: 0 };
        
        initNewRound();
        updatePlayerTags();
        switchView("game");
        if (state.settings.sounds) sounds.click();
    }

    function initNewRound(isRestart = false) {
        stopTimer();
        roundWinnerMessage.style.display = 'none';
        if (!isRestart) state.roundState.starter = (state.match.round % 2 === 1) ? "X" : "O";
        
        state.roundState.phase = null;
        state.roundState.activeCell = null;
        state.roundState.gameActive = true;
        state.roundState.winInfo = null;
        state.roundState.scores = { X: 0, O: 0 };
        
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

    function onCellClick(i) {
        if (!state.roundState.gameActive || state.roundState.phase !== null) return;
        const cell = state.roundState.board[i];
        if (cell.owner) return;

        if (state.settings.sounds) sounds.click();
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
            if (state.settings.sounds) sounds.success();
            cell.owner = player;
            cell.revealed = false;
            state.roundState.scores[player]++;
            if (state.settings.playMode === 'team') advanceMember(player);
            
            state.roundState.starter = (player === "X") ? "O" : "X";
            const winLine = checkWin();
            
            if (winLine) {
                endRound(player, winLine);
            } else if (state.roundState.board.every(c => c.owner)) {
                endRound(null);
            } else {
                toggleModal(null);
                state.roundState.phase = null;
            }
        } else {
            if (state.settings.sounds) sounds.fail();
            if (!cell.tried.has(player)) {
                cell.tried.add(player);
                state.roundState.phase = (player === "X") ? "O" : "X";
                updateTurnUI();
                answerTurnHint.textContent = `دور ${state.settings.playerNames[state.roundState.phase]}`;
                startAnswerTimer();
                return;
            } else {
                // فشل الفريقين: تغيير الحرف بمنطق منع التكرار
                const allLettersOnBoard = state.roundState.board.map(c => c.letter);
                const newCombo = getUniqueCombination(allLettersOnBoard);
                
                cell.letter = newCombo.letter;
                cell.category = newCombo.category;
                cell.revealed = false;
                cell.tried.clear();
                
                if (state.settings.playMode === 'team') advanceMember(state.roundState.starter);
                state.roundState.starter = (state.roundState.starter === "X") ? "O" : "X";
                toggleModal(null);
                state.roundState.phase = null;
            }
        }
        renderBoard();
        updateTurnUI();
        updateScoreboard();
        saveStateToLocalStorage();
    }

    // --- [7] وظائف المزامنة والحفظ (Persistence) ---
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
            state = data;
            return true;
        }
        return false;
    }

    // --- [8] دوال مساعدة للواجهة (UI Helpers) ---
    function switchView(view) { appContainer.setAttribute("data-view", view); }
    
    function toggleModal(id) { 
        $$(".modal-overlay.visible").forEach(m => m.classList.remove("visible")); 
        if (id) $(`#${id}`).classList.add("visible");
    }

    function renderBoard() {
        gameBoard.innerHTML = '';
        state.roundState.board.forEach((cell, i) => {
            const cellEl = document.createElement('div');
            cellEl.className = `board-cell ${cell.owner ? 'owned player-' + cell.owner.toLowerCase() : ''} ${cell.revealed ? 'revealed' : ''}`;
            
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

    function updateTurnUI() {
        const turn = state.roundState.phase || state.roundState.starter;
        const isTeam = state.settings.playMode === 'team';
        const members = state.settings.teamMembers[turn];
        const memberName = isTeam && members.length > 0 ? members[state.roundState.teamMemberIndex[turn]] : "";
        
        timerText.textContent = memberName ? `دور ${state.settings.playerNames[turn]} (${memberName})` : `دور ${state.settings.playerNames[turn]}`;
        playerTagX.classList.toggle("active", turn === "X");
        playerTagO.classList.toggle("active", turn === "O");

        if (isTeam) {
            playerXMemberDisplay.textContent = members && turn === "X" ? `(${memberName})` : (members && turn === "O" ? "" : "");
            playerOMemberDisplay.textContent = members && turn === "O" ? `(${memberName})` : "";
        }
    }

    function updateScoreboard() {
        roundInfo.textContent = `الجولة ${state.match.round} (Best of ${state.match.totalRounds})`;
        scoreXDisplay.textContent = `${state.settings.playerNames.X}: ${state.match.totalScore.X} فوز`;
        scoreODisplay.textContent = `${state.settings.playerNames.O}: ${state.match.totalScore.O} فوز`;
    }

    function advanceMember(p) {
        const members = state.settings.teamMembers[p];
        if (members && members.length > 0) {
            state.roundState.teamMemberIndex[p] = (state.roundState.teamMemberIndex[p] + 1) % members.length;
        }
    }

    function checkWin() {
        const b = state.roundState.board;
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let l of lines) {
            if (b[l[0]].owner && b[l[0]].owner === b[l[1]].owner && b[l[0]].owner === b[l[2]].owner) return l;
        }
        return null;
    }

    function drawWinLine(line) {
        const cells = $$(".board-cell");
        const s = cells[line[0]], e = cells[line[2]];
        const lineEl = document.createElement('div');
        lineEl.className = 'win-line';
        const rS = s.getBoundingClientRect(), rE = e.getBoundingClientRect(), bRect = gameBoard.getBoundingClientRect();
        const x1 = rS.left + rS.width/2 - bRect.left, y1 = rS.top + rS.height/2 - bRect.top;
        const x2 = rE.left + rE.width/2 - bRect.left, y2 = rE.top + rE.height/2 - bRect.top;
        const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        lineEl.style.width = `${dist}px`;
        lineEl.style.left = `${x1}px`;
        lineEl.style.top = `${y1}px`;
        lineEl.style.transform = `rotate(${Math.atan2(y2-y1, x2-x1)}rad)`;
        gameBoard.appendChild(lineEl);
    }

    function endRound(winner, line) {
        state.roundState.gameActive = false;
        if (winner) {
            state.match.totalScore[winner]++;
            state.roundState.winInfo = { winner, line };
            roundWinnerMessage.textContent = `🎉 الفائز بالجولة: ${state.settings.playerNames[winner]}!`;
            roundWinnerMessage.style.display = 'block';
            if (state.settings.sounds) sounds.win();
            setTimeout(runConfetti, 500);
        } else {
            roundWinnerMessage.textContent = "🤝 تعادل!";
            roundWinnerMessage.style.display = 'block';
            if (state.settings.sounds) sounds.draw();
        }

        const winGoal = Math.ceil(state.match.totalRounds / 2);
        if (state.match.totalScore.X === winGoal || state.match.totalScore.O === winGoal) {
            setTimeout(() => toggleModal("modal-final-score"), 2500);
        } else {
            state.match.round++;
            newRoundBtn.style.display = 'inline-flex';
        }
        renderBoard();
        saveStateToLocalStorage();
    }

    // --- [9] المؤقت (Timer System) ---
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

    function stopTimer() { 
        clearInterval(state.timer.intervalId); 
        answerTimerBar.classList.remove("animating"); 
    }

    function runConfetti() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        let particles = Array.from({ length: 150 }, () => ({
            x: Math.random() * confettiCanvas.width,
            y: -20,
            size: Math.random() * 7 + 4,
            color: ["#60a5fa", "#34d399", "#fbbf24"][Math.floor(Math.random() * 3)],
            vx: Math.random() * 4 - 2,
            vy: Math.random() * 3 + 2
        }));

        let start = Date.now();
        function anim() {
            if (Date.now() - start > 3000) {
                confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
                return;
            }
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.vy += 0.05;
                confettiCtx.fillStyle = p.color;
                confettiCtx.fillRect(p.x, p.y, p.size, p.size);
            });
            requestAnimationFrame(anim);
        }
        anim();
    }

    // --- [10] بدء التشغيل وربط الأحداث (Initialization) ---
    function init() {
        loginBtn.onclick = handleLogin;
        startGameBtn.onclick = startNewMatch;
        
        themeToggleHome.onclick = themeToggleGame.onclick = () => {
            state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", state.settings.theme);
            saveStateToLocalStorage();
        };

        answerCorrectBtn.onclick = () => handleAnswer(true);
        answerWrongBtn.onclick = () => handleAnswer(false);
        newRoundBtn.onclick = () => initNewRound();
        restartRoundBtn.onclick = () => toggleModal("modal-confirm-restart");
        confirmRestartBtn.onclick = () => { toggleModal(null); initNewRound(true); };
        endMatchBtn.onclick = () => toggleModal("modal-final-score");
        newMatchBtn.onclick = () => { localStorage.removeItem("kalimatac_state"); location.reload(); };
        backToHomeBtn.onclick = () => { switchView("home"); resumeGameBtn.style.display = "none"; };
        
        instructionsBtnHome.onclick = instructionsBtnGame.onclick = () => toggleModal("modal-instructions");
        modalCloseBtns.forEach(b => b.onclick = () => toggleModal(null));

        // التحقق من الدخول المحفوظ
        if (localStorage.getItem("kalimatac_auth") === "true") switchView("home");

        // استرجاع حالة اللعبة
        if (loadState()) {
            resumeGameBtn.style.display = "inline-flex";
            resumeGameBtn.onclick = () => { renderBoard(); updateScoreboard(); updateTurnUI(); switchView("game"); };
        }
    }

    init();
});
