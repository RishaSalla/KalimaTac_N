"use strict";

document.addEventListener("DOMContentLoaded", () => {
    
    // --- [1] تعريف العناصر (Selectors) ---
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    
    const appContainer = $("#app-container");
    const playerNameXInput = $("#player-name-x"); 
    const playerNameOInput = $("#player-name-o");
    const accessCodeInput = $("#access-code");
    const rememberMeCheck = $("#remember-me");
    const loginBtn = $("#login-btn");
    const timerSelectHome = $("#settings-timer-home"); 
    const roundsSelectHome = $("#settings-rounds-home");
    const inputCatsHome = $("#input-cats-home");
    const chipContainerCatsHome = $("#chip-container-cats-home");
    const soundsToggleHome = $("#toggle-sounds-home");
    const themeToggleHome = $("#toggle-theme-home"); 
    const startGameBtn = $("#start-game-btn"); 
    const resumeGameBtn = $("#resume-game-btn");
    const gameTitle = $("#game-title"); 
    const roundInfo = $("#round-info");
    const scoreXDisplay = $("#game-scores .score-tag.score-x"); 
    const scoreODisplay = $("#game-scores .score-tag.score-o");
    const restartRoundBtn = $("#restart-round-btn"); 
    const endMatchBtn = $("#end-match-btn"); 
    const newRoundBtn = $("#new-round-btn"); 
    const themeToggleGame = $("#toggle-theme-game");
    const playerTagX = $("#player-tag-x");
    const playerTagO = $("#player-tag-o"); 
    const timerText = $("#timer-text"); 
    const gameBoard = $("#game-board"); 
    const modalAnswer = $("#modal-answer"); 
    const answerLetter = $("#answer-letter");
    const answerCategory = $("#answer-category"); 
    const answerTimerBar = $("#answer-timer-bar");
    const answerTurnHint = $("#answer-turn-hint"); 
    const answerCorrectBtn = $("#answer-correct-btn");
    const answerWrongBtn = $("#answer-wrong-btn"); 
    const confirmRestartBtn = $("#confirm-restart-btn");
    const confettiCanvas = $("#confetti-canvas");
    const confettiCtx = confettiCanvas.getContext("2d"); 
    const roundWinnerMessage = $("#round-winner-message");
    const playerXMemberDisplay = $("#player-x-member");
    const playerOMemberDisplay = $("#player-o-member");

    // --- [2] إعدادات اللعبة الأساسية ---
    const BASE_CATEGORIES = ["إنسان", "حيوان", "جماد", "نبات", "بلاد"];
    const ARABIC_LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];
    
    const DEFAULT_STATE = {
        settings: { 
            secs: 10, sounds: true, theme: "light", extraCats: [], 
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

    // --- [3] نظام الدخول (Auth) - متوافق مع valid_hashes ---
    async function hashSHA256(str) {
        const utf8 = new TextEncoder().encode(str);
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

            if (data.valid_hashes && data.valid_hashes.includes(hashedInput)) {
                if (rememberMeCheck.checked) localStorage.setItem("kalimatac_auth", "true");
                switchView("home");
                if (state.settings.sounds) initAudio();
            } else {
                accessCodeInput.classList.add("shake");
                setTimeout(() => accessCodeInput.classList.remove("shake"), 500);
                playSound(200, 0.1, 0.1, "square");
            }
        } catch (e) {
            console.error("Auth error:", e);
            alert("خطأ في جلب بيانات الأكواد السريّة.");
        }
    }

    // --- [4] منطق الحروف الذكي (Unique Combination) ---
    function getUniqueCombination(excludeLetters = []) {
        const allCats = [...BASE_CATEGORIES, ...state.settings.extraCats];
        let attempts = 0;
        
        while (attempts < 150) {
            const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
            // التأكد أن الحرف ليس من ضمن الممنوعات (الموجودة على اللوحة)
            if (excludeLetters.includes(letter)) {
                attempts++;
                continue;
            }
            
            let cats = [...allCats];
            if (['ض', 'ظ'].includes(letter)) cats = cats.filter(c => c !== 'نبات');
            const category = cats[Math.floor(Math.random() * cats.length)];
            
            return { letter, category };
        }
        return { letter: "أ", category: "إنسان" }; 
    }

    function generateBoard() {
        state.roundState.board = [];
        const currentLetters = [];
        for (let i = 0; i < 9; i++) {
            const combo = getUniqueCombination(currentLetters);
            currentLetters.push(combo.letter);
            state.roundState.board.push({ 
                letter: combo.letter, 
                category: combo.category, 
                owner: null, 
                revealed: false, 
                tried: new Set() 
            });
        }
    }

    // --- [5] نظام الصوت والاحتفال (Audio & Confetti) ---
    let audioCtx;
    function initAudio() {
        if (!audioCtx && state.settings.sounds) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playSound(freq, gain, duration, type = "sine", delay = 0) {
        if (!state.settings.sounds) return;
        initAudio();
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        g.gain.setValueAtTime(gain, audioCtx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + duration);
    }

    function runConfetti() {
        if (!confettiCanvas) return;
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        let particles = Array.from({ length: 150 }, () => ({
            x: Math.random() * confettiCanvas.width,
            y: -20,
            size: Math.random() * 7 + 4,
            color: ["#60a5fa", "#34d399", "#fbbf24"][Math.floor(Math.random() * 3)],
            vx: Math.random() * 4 - 2,
            vy: Math.random() * 3 + 2,
            angle: Math.random() * 6
        }));

        let start = Date.now();
        function animate() {
            if (Date.now() - start > 3000) {
                confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
                return;
            }
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.vy += 0.03;
                confettiCtx.fillStyle = p.color;
                confettiCtx.fillRect(p.x, p.y, p.size, p.size);
            });
            requestAnimationFrame(animate);
        }
        animate();
    }

    // --- [6] إدارة الواجهة (UI Management) ---
    function switchView(view) { appContainer.setAttribute("data-view", view); }
    
    function toggleModal(id) { 
        $$(".modal-overlay.visible").forEach(m => m.classList.remove("visible")); 
        if (id) {
            const modal = $(`#${id}`);
            if (modal) modal.classList.add("visible");
        }
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
            playerXMemberDisplay.textContent = members && turn === "X" ? `(${memberName})` : "";
            playerOMemberDisplay.textContent = members && turn === "O" ? `(${memberName})` : "";
        }
    }

    function updateScoreboard() {
        roundInfo.textContent = `الجولة ${state.match.round} (Best of ${state.match.totalRounds})`;
        scoreXDisplay.textContent = `${state.settings.playerNames.X}: ${state.match.totalScore.X}`;
        scoreODisplay.textContent = `${state.settings.playerNames.O}: ${state.match.totalScore.O}`;
    }

    // --- [7] منطق اللعب (Core Gameplay) ---
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
        const cellIndex = state.roundState.activeCell;
        const cell = state.roundState.board[cellIndex];
        const player = state.roundState.phase;

        if (isCorrect) {
            playSound(523, 0.1, 0.2, "sine");
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
            playSound(200, 0.1, 0.2, "square");
            if (!cell.tried.has(player)) {
                cell.tried.add(player);
                state.roundState.phase = (player === "X") ? "O" : "X";
                updateTurnUI();
                answerTurnHint.textContent = `دور ${state.settings.playerNames[state.roundState.phase]}`;
                startAnswerTimer();
                return;
            } else {
                // فشل الطرفان -> تغيير الحرف بمنطق منع التكرار
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

    function endRound(winner, line) {
        state.roundState.gameActive = false;
        if (winner) {
            state.match.totalScore[winner]++;
            state.roundState.winInfo = { winner, line };
            roundWinnerMessage.textContent = `🎉 الفائز بالجولة: ${state.settings.playerNames[winner]}!`;
            roundWinnerMessage.style.display = 'block';
            playSound(800, 0.1, 0.5);
            setTimeout(runConfetti, 500);
        } else {
            roundWinnerMessage.textContent = "🤝 تعادل!";
            roundWinnerMessage.style.display = 'block';
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

    function drawWinLine(line) {
        const cells = $$(".board-cell");
        const s = cells[line[0]], e = cells[line[2]];
        const lineEl = document.createElement('div');
        lineEl.className = 'win-line';
        const rS = s.getBoundingClientRect(), rE = e.getBoundingClientRect(), b = gameBoard.getBoundingClientRect();
        const x1 = rS.left + rS.width/2 - b.left, y1 = rS.top + rS.height/2 - b.top;
        const x2 = rE.left + rE.width/2 - b.left, y2 = rE.top + rE.height/2 - b.top;
        const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        lineEl.style.width = `${dist}px`;
        lineEl.style.left = `${x1}px`;
        lineEl.style.top = `${y1}px`;
        lineEl.style.transform = `rotate(${Math.atan2(y2-y1, x2-x1)}rad)`;
        gameBoard.appendChild(lineEl);
    }

    // --- [8] المزامنة والمؤقت ---
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

    function saveStateToLocalStorage() {
        const copy = JSON.parse(JSON.stringify(state));
        copy.timer = { intervalId: null };
        copy.roundState.board.forEach(c => c.tried = Array.from(c.tried));
        localStorage.setItem("kalimatac_state", JSON.stringify(copy));
    }

    // --- [9] بدء التشغيل (Initialization) ---
    function init() {
        loginBtn.onclick = handleLogin;
        startGameBtn.onclick = () => {
            state.settings.secs = parseInt(timerSelectHome.value);
            state.match.totalRounds = parseInt(roundsSelectHome.value);
            state.settings.playerNames.X = playerNameXInput.value.trim() || "فريق X";
            state.settings.playerNames.O = playerNameOInput.value.trim() || "فريق O";
            state.match.round = 1;
            state.match.totalScore = { X: 0, O: 0 };
            initNewRound();
            switchView("game");
        };

        themeToggleHome.onclick = themeToggleGame.onclick = () => {
            state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", state.settings.theme);
            saveStateToLocalStorage();
        };

        answerCorrectBtn.onclick = () => handleAnswer(true);
        answerWrongBtn.onclick = () => handleAnswer(false);
        newRoundBtn.onclick = () => initNewRound();
        backToHomeBtn.onclick = () => { localStorage.removeItem("kalimatac_state"); location.reload(); };

        // التحقق من الدخول المحفوظ
        if (localStorage.getItem("kalimatac_auth") === "true") switchView("home");

        // استرجاع حالة اللعبة
        const saved = localStorage.getItem("kalimatac_state");
        if (saved) {
            state = JSON.parse(saved);
            state.roundState.board.forEach(c => c.tried = new Set(c.tried));
            resumeGameBtn.style.display = "inline-flex";
            resumeGameBtn.onclick = () => { renderBoard(); updateScoreboard(); updateTurnUI(); switchView("game"); };
        }
        
        // ربط إغلاق النوافذ
        modalCloseBtns.forEach(b => b.onclick = () => toggleModal(null));
    }

    function initNewRound() {
        state.roundState.gameActive = true;
        state.roundState.phase = null;
        state.roundState.winInfo = null;
        generateBoard();
        renderBoard();
        updateTurnUI();
        updateScoreboard();
        newRoundBtn.style.display = 'none';
        roundWinnerMessage.style.display = 'none';
    }

    init();
});
