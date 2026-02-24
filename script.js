"use strict";

document.addEventListener("DOMContentLoaded", () => {
    
    // --- [1] تعريف العناصر الأساسية (DOM Selectors) ---
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    
    const appContainer = $("#app-container");
    
    // عناصر نظام الدخول
    const accessCodeInput = $("#access-code");
    const rememberMeCheck = $("#remember-me");
    const loginBtn = $("#login-btn");

    // عناصر الشاشة الرئيسية
    const playerNameXInput = $("#player-name-x"); 
    const playerNameOInput = $("#player-name-o");
    const inputTeamXHome = $("#input-team-x-home");
    const inputTeamOHome = $("#input-team-o-home");
    const chipContainerXHome = $("#chip-container-x-home");
    const chipContainerOHome = $("#chip-container-o-home");
    
    const modeBtnTeamHome = $("#mode-team-home");
    const modeBtnIndividualHome = $("#mode-individual-home");
    
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

    // عناصر شاشة اللعبة
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
    
    // نافذة الإجابة
    const modalAnswer = $("#modal-answer"); 
    const answerLetter = $("#answer-letter");
    const answerCategory = $("#answer-category"); 
    const answerTimerBar = $("#answer-timer-bar");
    const answerTurnHint = $("#answer-turn-hint"); 
    const answerCorrectBtn = $("#answer-correct-btn");
    const answerWrongBtn = $("#answer-wrong-btn"); 

    // شاشات النهاية والتأكيد
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
            secs: 10, 
            sounds: true, 
            theme: "dark", 
            extraCats: [], 
            playerNames: { X: "فريق X", O: "فريق O" },
            playMode: "team",
            teamMembers: { X: [], O: [] } 
        },
        match: { 
            round: 1, 
            totalScore: { X: 0, O: 0 },
            totalRounds: 3,
            usedCombinations: []
        }, 
        roundState: { 
            board: [], 
            scores: { X: 0, O: 0 }, 
            starter: "X", 
            phase: null, 
            activeCell: null, 
            gameActive: true, 
            winInfo: null, 
            teamMemberIndex: { X: 0, O: 0 } 
        },
        timer: { intervalId: null, deadline: 0 }
    };
    
    let state = JSON.parse(JSON.stringify(DEFAULT_STATE)); 

    // --- [3] نظام الدخول والتحقق (Auth Logic) ---
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
        } catch (e) {
            console.error("Auth failed:", e);
            alert("خطأ: تعذر الوصول لملف الأكواد المشفره.");
        }
    }

    // --- [4] منطق الحروف الذكي (Unique Combination Logic) ---
    function getNewCombination(excludeLetters = []) {
        const allCats = [...BASE_CATEGORIES, ...state.settings.extraCats];
        let attempts = 0;
        
        while (attempts < 200) {
            const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
            
            // التأكد أن الحرف ليس موجوداً حالياً في القائمة الممنوعة (الموجودة على اللوحة)
            if (excludeLetters.includes(letter)) {
                attempts++;
                continue;
            }
            
            let availableCats = [...new Set(allCats)];
            // استثناء لبعض الحروف الصعبة
            if (['ض', 'ظ'].includes(letter)) {
                availableCats = availableCats.filter(cat => cat !== 'نبات');
            }
            
            const category = availableCats[Math.floor(Math.random() * availableCats.length)];
            return { letter, category };
        }
        // Fallback
        return { letter: ARABIC_LETTERS[0], category: allCats[0] }; 
    }

    function generateBoard() {
        state.roundState.board = [];
        const currentLettersOnBoard = [];
        
        for (let i = 0; i < 9; i++) {
            const combo = getNewCombination(currentLettersOnBoard);
            currentLettersOnBoard.push(combo.letter); // إضافة الحرف للممنوعات في هذه اللوحة
            
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
    const sounds = { 
        click: () => playSound(200, 0.1, 0.05, "triangle"), 
        success: () => { playSound(523, 0.1, 0.08, "sine"); playSound(659, 0.1, 0.08, "sine", 0.1); }, 
        fail: () => { playSound(200, 0.1, 0.1, "square"); playSound(160, 0.1, 0.1, "square", 0.1); }, 
        win: () => { [523, 659, 784, 1046].forEach((f, i) => playSound(f, 0.1, 0.1 + (i*0.1), "sine", i*0.1)); }, 
        draw: () => { [440, 349, 261].forEach((f, i) => playSound(f, 0.1, 0.1, "sawtooth", i*0.1)); }, 
        timerTick: () => playSound(440, 0.2, 0.05, "square") 
    };

    function initAudio() {
        if (!audioCtx && state.settings.sounds) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { console.error("Audio API error", e); }
        }
    }

    function playSound(freq, gain, duration, type = "sine", delay = 0) {
        if (!state.settings.sounds) return;
        initAudio();
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        gainNode.gain.setValueAtTime(gain, audioCtx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
        oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
        oscillator.start(audioCtx.currentTime + delay); oscillator.stop(audioCtx.currentTime + delay + duration);
    }

    function runConfetti() {
        if (!confettiCanvas) return;
        confettiParticles = [];
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        const colors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"];
        
        for (let i = 0; i < 150; i++) {
            confettiParticles.push({
                x: Math.random() * confettiCanvas.width,
                y: -20,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: Math.random() * 4 - 2,
                vy: Math.random() * 3 + 2,
                angle: Math.random() * 6
            });
        }

        let start = Date.now();
        function frame() {
            if (Date.now() - start > 3000) {
                confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
                return;
            }
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            confettiParticles.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.vy += 0.03;
                confettiCtx.fillStyle = p.color;
                confettiCtx.fillRect(p.x, p.y, p.size, p.size);
            });
            requestAnimationFrame(frame);
        }
        frame();
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

    function onCellClick(e) {
        const cellIndex = parseInt(e.currentTarget.dataset.index, 10);
        if (!state.roundState.gameActive || state.roundState.phase !== null) return;
        
        const cell = state.roundState.board[cellIndex];
        if (cell.owner) return;

        if (state.settings.sounds) sounds.click();
        stopTimer();
        state.roundState.activeCell = cellIndex;
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
                // فشل الطرفان: تبديل الحرف بحرف جديد تماماً غير موجود على اللوحة الحالية
                const allCurrentLetters = state.roundState.board.map(c => c.letter);
                const combo = getNewCombination(allCurrentLetters);
                
                cell.letter = combo.letter;
                cell.category = combo.category;
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
            roundWinnerMessage.textContent = `الفائز بالجولة: ${state.settings.playerNames[winner]}!`;
            roundWinnerMessage.style.display = 'block';
            if (state.settings.sounds) sounds.win();
            setTimeout(runConfetti, 500);
        } else {
            roundWinnerMessage.textContent = "تعادل!";
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

    // --- [7] وظائف الواجهة (UI Rendering) ---
    function switchView(view) { appContainer.setAttribute("data-view", view); }
    
    function toggleModal(id) { 
        $$(".modal-overlay.visible").forEach(m => m.classList.remove("visible")); 
        if (id) {
            const m = $(`#${id}`);
            if (m) m.classList.add("visible");
        }
    }

    function renderBoard() {
        gameBoard.innerHTML = '';
        state.roundState.board.forEach((cell, i) => {
            const cellEl = document.createElement('div');
            cellEl.className = `board-cell ${cell.owner ? 'owned player-' + cell.owner.toLowerCase() : ''} ${cell.revealed ? 'revealed' : ''}`;
            cellEl.dataset.index = i;
            
            const letterEl = document.createElement('span');
            letterEl.className = 'cell-letter';
            letterEl.textContent = cell.owner || cell.letter;
            
            const catEl = document.createElement('span');
            catEl.className = 'cell-category';
            catEl.textContent = cell.owner ? '' : cell.category;
            
            cellEl.append(letterEl, catEl);
            cellEl.onclick = onCellClick;
            gameBoard.appendChild(cellEl);
        });
        if (state.roundState.winInfo) drawWinLine(state.roundState.winInfo.line);
    }

    function updateTurnUI() {
        const turn = state.roundState.phase || state.roundState.starter;
        const isTeam = state.settings.playMode === 'team';
        const members = state.settings.teamMembers[turn];
        const memberName = (isTeam && members.length > 0) ? members[state.roundState.teamMemberIndex[turn]] : "";
        
        timerText.textContent = memberName ? `دور ${state.settings.playerNames[turn]} (${memberName})` : `دور ${state.settings.playerNames[turn]}`;
        playerTagX.classList.toggle("active", turn === "X");
        playerTagO.classList.toggle("active", turn === "O");

        if (isTeam) {
            playerXMemberDisplay.textContent = (members && turn === "X") ? `(${memberName})` : "";
            playerOMemberDisplay.textContent = (members && turn === "O") ? `(${memberName})` : "";
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

    function drawWinLine(line) {
        const cells = $$(".board-cell");
        const s = cells[line[0]], e = cells[line[2]];
        const lineEl = document.createElement('div');
        lineEl.className = 'win-line';
        const rS = s.getBoundingClientRect(), rE = e.getBoundingClientRect(), bRect = gameBoard.getBoundingClientRect();
        const x1 = rS.left + rS.width/2 - bRect.left, y1 = rS.top + rS.height/2 - bRect.top;
        const x2 = rE.left + rE.width/2 - bRect.left, y2 = rE.top + rE.height/2 - bRect.top;
        const dist = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
        lineEl.style.width = `${dist}px`;
        lineEl.style.left = `${x1}px`;
        lineEl.style.top = `${y1}px`;
        lineEl.style.transform = `rotate(${Math.atan2(y2-y1, x2-x1)}rad)`;
        gameBoard.appendChild(lineEl);
    }

    // --- [8] إدارة المؤقت والحفظ (Timer & Persistence) ---
    function startAnswerTimer() {
        stopTimer();
        const dur = state.settings.secs * 1000;
        state.timer.deadline = Date.now() + dur;
        answerTimerBar.style.setProperty('--timer-duration', `${state.settings.secs}s`);
        answerTimerBar.classList.add("animating");
        state.timer.intervalId = setInterval(() => {
            const rem = state.timer.deadline - Date.now();
            if (rem <= 0) {
                stopTimer();
                handleAnswer(false);
            } else if (rem <= 3000 && (rem % 1000 < 100)) {
                if (state.settings.sounds) sounds.timerTick();
            }
        }, 100);
    }

    function stopTimer() { 
        if (state.timer.intervalId) {
            clearInterval(state.timer.intervalId);
            state.timer.intervalId = null;
        }
        answerTimerBar.classList.remove("animating"); 
    }

    function saveStateToLocalStorage() {
        const copy = JSON.parse(JSON.stringify(state));
        copy.timer = { intervalId: null, deadline: 0 };
        copy.roundState.board.forEach(c => c.tried = Array.from(c.tried));
        localStorage.setItem("ticTacCategoriesGameState", JSON.stringify(copy));
    }

    function loadState() {
        const saved = localStorage.getItem("ticTacCategoriesGameState");
        if (saved) {
            try {
                const data = JSON.parse(saved);
                data.roundState.board.forEach(c => c.tried = new Set(c.tried || []));
                state = data;
                return true;
            } catch (e) { localStorage.removeItem("ticTacCategoriesGameState"); }
        }
        return false;
    }

    // --- [9] إدارة شرائح الإدخال (Chips) ---
    function renderChips(team) {
        const container = (team === 'X' ? chipContainerXHome : chipContainerOHome);
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
        const input = isBtn ? document.getElementById(`input-team-${team.toLowerCase()}-home`) : e.target;
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
        state.settings.extraCats.forEach(name => {
            const chip = document.createElement('span'); chip.className = 'chip'; chip.textContent = name;
            const rm = document.createElement('span'); rm.className = 'chip-remove'; rm.textContent = '×';
            rm.onclick = () => {
                state.settings.extraCats = state.settings.extraCats.filter(c => c !== name);
                renderChipsCategories(); saveStateToLocalStorage();
            };
            chip.appendChild(rm); chipContainerCatsHome.insertBefore(chip, input);
        });
    }

    window.togglePlayMode = function(ignore, mode) {
        state.settings.playMode = mode;
        $$('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        $$('.team-members-group').forEach(g => g.style.display = (mode === 'team' ? 'flex' : 'none'));
        saveStateToLocalStorage();
    }

    // --- [10] الربط والتشغيل (Initialization) ---
    function init() {
        loginBtn.onclick = handleLogin;
        startGameBtn.onclick = startNewMatch;
        
        themeToggleHome.onclick = themeToggleGame.onclick = () => {
            state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", state.settings.theme);
            const txt = state.settings.theme === "dark" ? "ثيم فاتح" : "ثيم غامق";
            themeToggleTextHome.textContent = themeToggleTextGame.textContent = txt;
            saveStateToLocalStorage();
        };

        soundsToggleHome.onclick = () => {
            state.settings.sounds = !state.settings.sounds;
            soundsToggleHome.setAttribute("data-active", state.settings.sounds);
            soundsToggleHome.querySelector(".switch-text").textContent = state.settings.sounds ? "مفعلة" : "معطلة";
            saveStateToLocalStorage();
        };

        answerCorrectBtn.onclick = () => handleAnswer(true);
        answerWrongBtn.onclick = () => handleAnswer(false);
        newRoundBtn.onclick = () => initNewRound();
        restartRoundBtn.onclick = () => toggleModal("modal-confirm-restart");
        confirmRestartBtn.onclick = () => { toggleModal(null); initNewRound(true); };
        endMatchBtn.onclick = () => toggleModal("modal-final-score");
        newMatchBtn.onclick = () => { localStorage.removeItem("ticTacCategoriesGameState"); location.reload(); };
        backToHomeBtn.onclick = () => switchView("home");
        
        instructionsBtnHome.onclick = instructionsBtnGame.onclick = () => toggleModal("modal-instructions");
        modalCloseBtns.forEach(b => b.onclick = () => toggleModal(null));

        // نظام الدخول
        if (localStorage.getItem("kalimatac_auth") === "true") switchView("home");

        // استرجاع الحالة
        if (loadState()) {
            resumeGameBtn.style.display = "inline-flex";
            resumeGameBtn.onclick = () => { renderBoard(); updateScoreboard(); updateTurnUI(); switchView("game"); };
            playerNameXInput.value = state.settings.playerNames.X;
            playerNameOInput.value = state.settings.playerNames.O;
            timerSelectHome.value = state.settings.secs;
            roundsSelectHome.value = state.match.totalRounds;
        }
        
        renderChips('X'); renderChips('O'); renderChipsCategories();
        document.documentElement.setAttribute("data-theme", state.settings.theme);
    }

    init();
});
