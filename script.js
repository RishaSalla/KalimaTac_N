"use strict";
document.addEventListener("DOMContentLoaded", () => {
    
    // --- [1] تعريف العناصر الأساسية ---
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    
    const appContainer = $("#app-container");
    const playerNameXInput = $("#player-name-x"); const playerNameOInput = $("#player-name-o");
    
    const inputTeamXHome = $("#input-team-x-home");
    const inputTeamOHome = $("#input-team-o-home");
    const chipContainerXHome = $("#chip-container-x-home");
    const chipContainerOHome = $("#chip-container-o-home");

    // (تم حذف عناصر modal-settings)
    
    const modeBtnTeamHome = $("#mode-team-home");
    const modeBtnIndividualHome = $("#mode-individual-home");
    
    const timerSelectHome = $("#settings-timer-home"); 
    // (تمت إضافة العناصر الجديدة)
    const roundsSelectHome = $("#settings-rounds-home");
    
    // [تم التعديل] استبدال حقل الفئات النصي بالعناصر الجديدة
    const inputCatsHome = $("#input-cats-home");
    const chipContainerCatsHome = $("#chip-container-cats-home");


    const soundsToggleHome = $("#toggle-sounds-home");
    const themeToggleHome = $("#toggle-theme-home"); const themeToggleTextHome = $("#toggle-theme-text-home");
    const startGameBtn = $("#start-game-btn"); const resumeGameBtn = $("#resume-game-btn");
    const instructionsBtnHome = $("#open-instructions-home-btn"); 
    const gameTitle = $("#game-title"); const roundInfo = $("#round-info");
    const scoreXDisplay = $("#game-scores .score-tag.score-x"); 
    const scoreODisplay = $("#game-scores .score-tag.score-o");
    // (تم حذف settingsBtnGame)
    const instructionsBtnGame = $("#open-instructions-game-btn");
    const restartRoundBtn = $("#restart-round-btn"); const endMatchBtn = $("#end-match-btn"); 
    const newRoundBtn = $("#new-round-btn"); const themeToggleGame = $("#toggle-theme-game");
    const themeToggleTextGame = $("#theme-toggle-text-game"); const playerTagX = $("#player-tag-x");
    const playerTagO = $("#player-tag-o"); const timerText = $("#timer-text"); const timerHint = $("#timer-hint");
    const gameBoard = $("#game-board"); const modalAnswer = $("#modal-answer"); const answerLetter = $("#answer-letter");
    const answerCategory = $("#answer-category"); const answerTimerBar = $("#answer-timer-bar");
    const answerTurnHint = $("#answer-turn-hint"); const answerCorrectBtn = $("#answer-correct-btn");
    const answerWrongBtn = $("#answer-wrong-btn"); 
    
    // (تم حذف عناصر modal-settings)

    const finalWinnerText = $("#final-winner-text");
    const finalWinsX = $("#final-wins-x");
    const finalWinsO = $("#final-wins-o");
    
    const newMatchBtn = $("#new-match-btn"); 
    const backToHomeBtn = $("#back-to-home-btn"); 
    const modalConfirmRestart = $("#modal-confirm-restart"); const confirmRestartBtn = $("#confirm-restart-btn");
    const modalCloseBtns = $$(".modal-close-btn"); const confettiCanvas = $("#confetti-canvas");
    const confettiCtx = confettiCanvas.getContext("2d"); let confettiParticles = [];
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
            theme: "light", 
            extraCats: [], 
            playerNames: { X: "فريق X", O: "فريق O" },
            playMode: "team",
            teamMembers: { X: [], O: [] }, 
        },
        match: { 
            round: 1, 
            totalScore: { X: 0, O: 0 },
            totalRounds: 3, // (تمت الإضافة)
            usedCombinations: [] // (تمت الإضافة)
        }, 
        roundState: { 
            board: [], scores: { X: 0, O: 0 }, 
            // (تم حذف usedLetters)
            starter: "X", phase: null, 
            activeCell: null, gameActive: true, winInfo: null,
            teamMemberIndex: { X: 0, O: 0 } 
        },
        timer: { intervalId: null, deadline: 0 }
    };
    let state = JSON.parse(JSON.stringify(DEFAULT_STATE)); 
    // (تم حذف usedLetters)

    // --- [3] نظام الصوت (Audio Engine) ---
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
            sounds.success = () => {
                playSound(523, 0.1, 0.08, "sine");
                playSound(659, 0.1, 0.08, "sine", 0.1);
            };
            sounds.fail = () => {
                playSound(200, 0.1, 0.1, "square");
                playSound(160, 0.1, 0.1, "square", 0.1);
            };
            sounds.win = () => {
                playSound(523, 0.1, 0.1);
                playSound(659, 0.1, 0.1, "sine", 0.1);
                playSound(784, 0.1, 0.1, "sine", 0.2);
                playSound(1046, 0.1, 0.2, "sine", 0.3);
            };
            sounds.draw = () => {
                playSound(440, 0.1, 0.1, "sawtooth");
                playSound(349, 0.1, 0.1, "sawtooth", 0.1);
                playSound(261, 0.1, 0.1, "sawtooth", 0.2);
            };
            sounds.timerTick = () => playSound(440, 0.2, 0.05, "square");

        } catch (e) {
            console.error("Web Audio API not supported.", e);
            state.settings.sounds = false; 
            updateSoundToggles();
        }
    }

    function playSound(freq, gain, duration, type = "sine", delay = 0) { 
        if (!audioCtx || !state.settings.sounds) return; 
        const oscillator = audioCtx.createOscillator(); const gainNode = audioCtx.createGain(); oscillator.type = type; oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + delay); gainNode.gain.setValueAtTime(gain, audioCtx.currentTime + delay); gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration); oscillator.connect(gainNode); gainNode.connect(audioCtx.destination); oscillator.start(audioCtx.currentTime + delay); oscillator.stop(audioCtx.currentTime + delay + duration);
    }

    // --- [4] نظام الكونفيتي (Confetti Engine) ---
    function runConfetti() { 
         if (!confettiCanvas) return; confettiParticles = []; confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight; const colors = [ getComputedStyle(document.documentElement).getPropertyValue('--player-x-color'), getComputedStyle(document.documentElement).getPropertyValue('--player-o-color'), "#faf089" ]; for (let i = 0; i < 200; i++) { confettiParticles.push({ x: Math.random() * confettiCanvas.width, y: Math.random() * confettiCanvas.height - confettiCanvas.height, size: Math.random() * 10 + 5, color: colors[Math.floor(Math.random() * colors.length)], speedX: Math.random() * 6 - 3, speedY: Math.random() * 5 + 2, angle: Math.random() * 2 * Math.PI, spin: Math.random() * 0.2 - 0.1 }); } let startTime = Date.now(); function animateConfetti() { if (Date.now() - startTime > 2500) { confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); return; } confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); confettiParticles.forEach(p => { p.x += p.speedX; p.y += p.speedY; p.angle += p.spin; p.speedY += 0.05; confettiCtx.save(); confettiCtx.fillStyle = p.color; confettiCtx.translate(p.x + p.size / 2, p.y + p.size / 2); confettiCtx.rotate(p.angle); confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); confettiCtx.restore(); if (p.y > confettiCanvas.height) { p.y = -p.size; p.x = Math.random() * confettiCanvas.width; } }); requestAnimationFrame(animateConfetti); } animateConfetti();
    }
    
    // --- [4.5] إدارة شرائح الإدخال (Chips) ---
    // (تم تبسيط الدالة بإزالة isHome)
    function createChip(name, team) {
        const chip = document.createElement('span');
        chip.classList.add('chip');
        chip.textContent = name;
        
        const removeBtn = document.createElement('span');
        removeBtn.classList.add('chip-remove');
        removeBtn.textContent = '×';
        removeBtn.onclick = () => {
            const index = state.settings.teamMembers[team].indexOf(name);
            if (index > -1) {
                state.settings.teamMembers[team].splice(index, 1);
                renderChips('X'); // (تم التبسيط)
                renderChips('O'); // (تم التبسيط)
                saveStateToLocalStorage();
                if (state.settings.sounds) sounds.click();
            }
        };
        
        chip.appendChild(removeBtn);
        return chip;
    }

    // (تم تبسيط الدالة بإزالة isHome)
    function renderChips(team) {
        const container = (team === 'X' ? chipContainerXHome : chipContainerOHome);
            
        if (!container) return;
            
        const inputId = `input-team-${team.toLowerCase()}-home`;
        const inputEl = container.querySelector(`#${inputId}`);

        container.querySelectorAll('.chip').forEach(chip => chip.remove());
        
        state.settings.teamMembers[team].forEach(name => {
            if (inputEl) {
                container.insertBefore(createChip(name, team), inputEl);
            }
        });
        
        if (document.activeElement === inputEl) {
             inputEl.focus();
        }
    }

    // (تم تعديل الدالة لـ "تجاهل" البارامتر isHome المرسل من HTML)
    window.handleChipInput = function(event, team, isHome_ignored, isButton = false) {
        const inputEl = isButton ? document.getElementById(`input-team-${team.toLowerCase()}-home`) : event.target;
        
        if (!inputEl) return; 
        
        const name = inputEl.value.trim();

        if (isButton || event.key === 'Enter' || event.type === 'blur') {
            event.preventDefault();
            if (name && state.settings.teamMembers[team].indexOf(name) === -1) {
                state.settings.teamMembers[team].push(name);
                inputEl.value = ''; 
                renderChips('X'); // (تم التبسيط)
                renderChips('O'); // (تم التبسيط)
                saveStateToLocalStorage();
                if (inputEl) inputEl.focus(); 
            } else if (name) {
                 inputEl.value = ''; 
            }
        }
    }

    // --- [4.6] إدارة شرائح الفئات (Category Chips) ---
    // [تمت الإضافة] دوال جديدة لإدارة شرائح الفئات
    
    function createChipCategory(name) {
        const chip = document.createElement('span');
        chip.classList.add('chip');
        chip.textContent = name;
        
        const removeBtn = document.createElement('span');
        removeBtn.classList.add('chip-remove');
        removeBtn.textContent = '×';
        removeBtn.onclick = () => {
            const index = state.settings.extraCats.indexOf(name);
            if (index > -1) {
                state.settings.extraCats.splice(index, 1);
                renderChipsCategories(); // إعادة رسم شرائح الفئات
                saveStateToLocalStorage();
                if (state.settings.sounds) sounds.click();
            }
        };
        
        chip.appendChild(removeBtn);
        return chip;
    }

    function renderChipsCategories() {
        if (!chipContainerCatsHome) return;
            
        const inputEl = chipContainerCatsHome.querySelector('#input-cats-home');
        chipContainerCatsHome.querySelectorAll('.chip').forEach(chip => chip.remove());
        
        state.settings.extraCats.forEach(name => {
            if (inputEl) {
                chipContainerCatsHome.insertBefore(createChipCategory(name), inputEl);
            }
        });
        
        if (document.activeElement === inputEl) {
             inputEl.focus();
        }
    }

    window.handleChipInputCategories = function(isButton = false, event = null) {
        const inputEl = $("#input-cats-home");
        if (!inputEl) return;
        const name = inputEl.value.trim();

        if (isButton || (event && (event.key === 'Enter' || event.type === 'blur'))) {
            if (event) event.preventDefault();
            
            // التحقق من عدم التكرار (في الفئات المضافة أو الأساسية)
            if (name && state.settings.extraCats.indexOf(name) === -1 && BASE_CATEGORIES.indexOf(name) === -1) {
                state.settings.extraCats.push(name);
                inputEl.value = '';
                renderChipsCategories();
                saveStateToLocalStorage();
                if (inputEl) inputEl.focus();
            } else if (name) {
                inputEl.value = ''; // مسح الحقل إذا كانت الفئة مكررة
            }
        }
    }
    // [نهاية الإضافة]

    
    // --- [5] إدارة الحالة والواجهة (State & UI Management) ---
    function switchView(viewName) { appContainer.setAttribute("data-view", viewName); }
    function toggleModal(modalId) { 
        $$(".modal-overlay.visible").forEach(modal => modal.classList.remove("visible")); 
        if (modalId) { 
            const modal = $(`#${modalId}`); 
            if (modal) { 
                modal.classList.add("visible"); 
                // (تم حذف الشرط الخاص بـ modal-settings)
                if (modalId === 'modal-final-score') loadFinalScores(); 
            } 
        }
    }
    
    function loadFinalScores() { 
        if (finalWinnerText) finalWinnerText.textContent = "إنهاء اللعبة"; 
        if (finalWinsX) finalWinsX.textContent = `${state.settings.playerNames.X}: ${state.match.totalScore.X} فوز`; 
        if (finalWinsO) finalWinsO.textContent = `${state.settings.playerNames.O}: ${state.match.totalScore.O} فوز`;
    }
    
    // (هذه الدالة تطبق الآن منطق إخفاء أعضاء الفريق حسب الخطة)
    function updatePlayerInputLabels(mode) {
           const isTeam = mode === 'team';
           
           // (هذا هو المنطق الجديد المطلوب)
           $$('.team-members-group').forEach(group => group.style.display = isTeam ? 'flex' : 'none');
           
           $$('.team-name-group').forEach(group => {
                const isX = group.querySelector('#player-name-x');
                const nameInput = isX ? playerNameXInput : playerNameOInput;
                const labelText = isX ? `اسم ${isTeam ? 'فريق' : 'فرد'} X` : `اسم ${isTeam ? 'فريق' : 'فرد'} O`;
                const placeholderText = isX ? `اسم فريق X (مثال: النمور)` : `اسم فريق O (مثال: التماسيح)`;
                
                group.querySelector('label').textContent = labelText;
                nameInput.placeholder = isTeam ? placeholderText : 'اسم اللاعب';
           });
           
           renderChips('X'); // (تم التبسيط)
           renderChips('O'); // (تم التبسيط)
    }
    
    // (تم تبسيط الدالة لإزالة المنطق الخاص بـ modal-settings)
    window.togglePlayMode = function(isModal_ignored, specificMode = null) {
            initAudio(); 

            const teamBtn = document.getElementById('mode-team-home');
            const individualBtn = document.getElementById('mode-individual-home');
            
            const currentMode = state.settings.playMode;
            const newMode = specificMode || (currentMode === 'team' ? 'individual' : 'team');
            
            if (currentMode === newMode && specificMode !== null) return; 

            state.settings.playMode = newMode;
            
            [teamBtn, individualBtn].forEach(btn => {
                 if (btn) btn.classList.remove('active');
            });
            if (newMode === 'team' && teamBtn) teamBtn.classList.add('active');
            if (newMode === 'individual' && individualBtn) individualBtn.classList.add('active');

            // (تم حذف منطق المزامنة مع النافذة المحذوفة)
            
            updatePlayerInputLabels(newMode); // (هذا ينفذ منطق الإخفاء)
            saveStateToLocalStorage();
            if (state.settings.sounds) sounds.click();
    }
    
    // (تم حذف دالة loadSettingsToModal)
    
    // (تم حذف دالة saveSettingsFromModal)

    function applyTheme() { 
        const theme = state.settings.theme; document.documentElement.setAttribute("data-theme", theme); const isActive = theme === "dark"; const text = isActive ? "ثيم فاتح" : "ثيم غامق"; 
        
        if (themeToggleHome && themeToggleTextHome) {
             themeToggleHome.setAttribute("data-active", isActive); 
             themeToggleTextHome.textContent = text; 
        }
        
        if (themeToggleGame && themeToggleTextGame) {
             themeToggleGame.setAttribute("data-active", isActive); 
             themeToggleTextGame.textContent = text;
        }
    }
    function toggleTheme() { 
        initAudio(); state.settings.theme = state.settings.theme === "light" ? "dark" : "light"; applyTheme(); saveStateToLocalStorage(); sounds.click();
    }

    // (تم تبسيط الدالة لإزالة المنطق الخاص بـ modal-settings)
    function updateSoundToggles() { 
        const active = state.settings.sounds; const text = active ? "مفعلة" : "معطلة"; 
        if (soundsToggleHome) {
            soundsToggleHome.setAttribute("data-active", active); 
            soundsToggleHome.querySelector(".switch-text").textContent = text; 
        }
        // (تم حذف الجزء الخاص بـ soundsToggleSettings)
    }
    function toggleSounds() { 
        initAudio(); state.settings.sounds = !state.settings.sounds; updateSoundToggles(); if (state.settings.sounds) { initAudio(); sounds.success(); } saveStateToLocalStorage();
    }
    function updateScoreboard() { 
           // (تم تعديل النص ليشمل إجمالي الجولات)
           const totalRounds = state.match.totalRounds || 3;
           roundInfo.textContent = `الجولة ${state.match.round} (الأفضل من ${totalRounds})`; 
           const scoreX = state.match.totalScore.X; const scoreO = state.match.totalScore.O; 
           scoreXDisplay.textContent = `${state.settings.playerNames.X}: ${scoreX} فوز`; 
           scoreODisplay.textContent = `${state.settings.playerNames.O}: ${scoreO} فوز`;
    }
    
    function updateTeamMemberDisplay() {
           const isTeam = state.settings.playMode === 'team';
           if (!isTeam) {
                playerXMemberDisplay.textContent = "";
                playerOMemberDisplay.textContent = "";
                return;
           }
           
           const memberX = state.settings.teamMembers.X[state.roundState.teamMemberIndex.X] || '';
           const memberO = state.settings.teamMembers.O[state.roundState.teamMemberIndex.O] || '';

           playerXMemberDisplay.textContent = memberX ? `(${memberX})` : '';
           playerOMemberDisplay.textContent = memberO ? `(${memberO})` : '';
    }

    function updatePlayerTags() { 
        const isTeam = state.settings.playMode === 'team';
        playerTagX.querySelector('.player-name-text').textContent = state.settings.playerNames.X; 
        playerTagO.querySelector('.player-name-text').textContent = state.settings.playerNames.O; 
        
        updateTeamMemberDisplay();
        
        $(".screen-header h1").textContent = "كلمتاك"; gameTitle.textContent = "كلمتاك";
    }

    // (تم التعديل ليطابق الخطة: إضافة اسم اللاعب بجانب اسم الفريق)
    function updateTurnUI() { 
           const currentPlayer = state.roundState.phase || state.roundState.starter; 
           const teamName = state.settings.playerNames[currentPlayer]; 
           
           let memberName = "";
           if (state.settings.playMode === 'team') {
               const members = state.settings.teamMembers[currentPlayer];
               if (members && members.length > 0) {
                   const memberIndex = state.roundState.teamMemberIndex[currentPlayer];
                   memberName = members[memberIndex] || '';
               }
           }

           // (هذا هو التعديل المطلوب)
           timerText.textContent = memberName ? `دور ${teamName} (${memberName})` : `دور ${teamName}`;
           
           playerTagX.classList.toggle("active", currentPlayer === "X"); 
           playerTagO.classList.toggle("active", currentPlayer === "O"); 
           
           updateTeamMemberDisplay(); // (تحديث الأسماء على الجانبين أيضاً)
           
           renderBoardAvailability(currentPlayer);
    }
    
    function advanceTeamMember(player) {
        const members = state.settings.teamMembers[player];
        if (members && members.length > 0) {
            let currentIndex = state.roundState.teamMemberIndex[player];
            currentIndex = (currentIndex + 1) % members.length;
            state.roundState.teamMemberIndex[player] = currentIndex;
        } else {
            state.roundState.teamMemberIndex[player] = 0;
        }
    }


    // --- [6] منطق اللعبة الأساسي (Game Logic) ---
    
    // (تمت إضافة دالة جديدة لمنع تكرار التركيبات)
    function getNewCombination(retries = 50) {
        if (!state.match.usedCombinations) state.match.usedCombinations = [];
        
        const allCats = [...BASE_CATEGORIES, ...state.settings.extraCats];
        if (allCats.length === 0) allCats.push("إنسان", "حيوان", "جماد"); // احتياطي
        
        for (let i = 0; i < retries; i++) {
            const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
            
            // فلترة الفئات بناءً على الحرف (مثل "نبات" لـ ض/ظ)
            let availableCats = [...new Set(allCats)];
            if (['ض', 'ظ'].includes(letter)) {
                availableCats = availableCats.filter(cat => cat !== 'نبات');
            }
            if (availableCats.length === 0) availableCats = ['إنسان', 'حيوان', 'جماد', 'بلاد'];
            
            const category = availableCats[Math.floor(Math.random() * availableCats.length)];
            
            const comboKey = `${letter}|${category}`;
            
            // التأكد أن التركيبة لم تُستخدم من قبل
            if (!state.match.usedCombinations.includes(comboKey)) {
                state.match.usedCombinations.push(comboKey); // إضافة التركيبة للمستخدمة
                return { letter, category };
            }
        }
        
        // (Fallback) إذا فشل في إيجاد تركيبة فريدة (نادر جداً)
        console.warn("Fallback: Could not find unique combination.");
        const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
        const category = allCats[Math.floor(Math.random() * allCats.length)];
        return { letter, category };
    }


    // (تم تحديث الدالة لتقرأ الإعدادات الجديدة من الشاشة الرئيسية)
    function startNewMatch() { 
        initAudio(); 
        
        // (قراءة الإعدادات الجديدة من الشاشة الرئيسية)
        state.settings.secs = parseInt(timerSelectHome.value, 10); 
        state.match.totalRounds = parseInt(roundsSelectHome.value, 10);
        
        // [تم الحذف] تم حذف السطر الخاص بـ extraCatsHome.value
        // لأن الفئات أصبحت تُضاف مباشرة إلى state.settings.extraCats
        
        const activeModeBtn = document.querySelector('#mode-selector-wrapper .mode-btn.active');
        state.settings.playMode = activeModeBtn ? activeModeBtn.getAttribute('data-mode') : 'team';
        
        const isTeam = state.settings.playMode === 'team';
        const defaultX = isTeam ? "فريق X" : "لاعب X";
        const defaultO = isTeam ? "فريق O" : "لاعب O";
        
        let nameX = playerNameXInput.value.trim() || defaultX; 
        let nameO = playerNameOInput.value.trim() || defaultO; 

        if (nameX === nameO) nameO = `${nameO} (2)`; 
        state.settings.playerNames.X = nameX; state.settings.playerNames.O = nameO; 
        
        // (إعادة تعيين المباراة بالكامل)
        const oldSettings = JSON.parse(JSON.stringify(state.settings)); // الاحتفاظ بالإعدادات
        state = JSON.parse(JSON.stringify(DEFAULT_STATE)); // إعادة تعيين كل شيء
        state.settings = oldSettings; // استرجاع الإعدادات
        state.match.totalRounds = parseInt(roundsSelectHome.value, 10); // (تأكيد عدد الجولات)

        timerHint.textContent = `${state.settings.secs} ثوانٍ`; 
        initNewRound(); 
        updatePlayerTags(); 
        switchView("game"); 
        sounds.click();
    }

    function initNewRound(isRestart = false) { 
           stopTimer(); 
           roundWinnerMessage.style.display = 'none'; 
           if (!isRestart) { state.roundState.starter = (state.match.round % 2 === 1) ? "X" : "O"; } 
           state.roundState.phase = null; state.roundState.activeCell = null; state.roundState.gameActive = true; 
           state.roundState.winInfo = null; state.roundState.scores = { X: 0, O: 0 }; 
           // (تم حذف usedLetters)
           
           if (!isRestart) {
             state.roundState.teamMemberIndex = { X: 0, O: 0 };
           }

           generateBoard(); renderBoard(); updateScoreboard(); updateTurnUI(); 
           
           // (تحديث منطق الأزرار حسب الخطة)
           newRoundBtn.style.display = 'none'; // (يُخفى عند بدء الجولة)
           restartRoundBtn.style.display = 'inline-flex'; // (يُظهر أثناء اللعب)
           endMatchBtn.style.display = 'inline-flex'; // (يُظهر أثناء اللعب)

           saveStateToLocalStorage();
    }

    // (تم حذف دالة getRandomCategory)

    // (تم حذف دالة getUniqueRandomLetter)
    
    // (تم تحديث الدالة لتستخدم getNewCombination)
    function generateBoard() { 
        state.roundState.board = []; 
        for (let i = 0; i < 9; i++) { 
            const { letter, category } = getNewCombination(); // (الاستخدام الجديد)
            state.roundState.board.push({ 
                letter: letter, 
                category: category, 
                owner: null, 
                revealed: false, 
                tried: new Set() 
            }); 
        }
    }
    function renderBoardAvailability(currentPlayer) { 
           $$(".board-cell").forEach((cellEl, index) => { const cell = state.roundState.board[index]; if (cell.owner || cell.revealed) { cellEl.classList.remove("available"); cellEl.classList.add("unavailable"); } else { if (state.roundState.phase === null) { cellEl.classList.add("available"); cellEl.classList.remove("unavailable"); } else { cellEl.classList.remove("available"); cellEl.classList.add("unavailable"); } } });
    }
    function renderBoard() { 
           gameBoard.innerHTML = ''; const oldWinLine = gameBoard.querySelector('.win-line'); if (oldWinLine) oldWinLine.remove(); state.roundState.board.forEach((cell, index) => { const cellEl = document.createElement('div'); cellEl.classList.add('board-cell'); cellEl.dataset.index = index; const letterEl = document.createElement('span'); letterEl.classList.add('cell-letter'); const categoryEl = document.createElement('span'); categoryEl.classList.add('cell-category'); if (cell.owner) { cellEl.classList.add('owned', `player-${cell.owner.toLowerCase()}`); letterEl.textContent = cell.owner; } else { letterEl.textContent = cell.letter; categoryEl.textContent = cell.category; if (cell.revealed) cellEl.classList.add('revealed'); } cellEl.appendChild(letterEl); cellEl.appendChild(categoryEl); cellEl.addEventListener('click', onCellClick); gameBoard.appendChild(cellEl); }); if (state.roundState.winInfo) { drawWinLine(state.roundState.winInfo.line); } renderBoardAvailability(state.roundState.phase || state.roundState.starter);
    }
    function onCellClick(e) { 
           if (!state.roundState.gameActive || state.roundState.phase !== null) { if (state.settings.sounds) sounds.fail(); return; } const cellIndex = parseInt(e.currentTarget.dataset.index, 10); const cell = state.roundState.board[cellIndex]; if (cell.owner) { if (state.settings.sounds) sounds.fail(); return; } if (state.settings.sounds) sounds.click(); stopTimer(); state.roundState.activeCell = cellIndex; state.roundState.phase = state.roundState.starter; cell.revealed = true; cell.tried = new Set(); renderBoard(); updateTurnUI(); answerLetter.textContent = cell.letter; answerCategory.textContent = cell.category; answerTurnHint.textContent = `دور ${state.settings.playerNames[state.roundState.phase]}.`; toggleModal("modal-answer"); startAnswerTimer();
    }

    // (تم تحديث الدالة لتحرير التركيبة عند فشل اللاعبين)
    function handleAnswer(isCorrect) { 
        stopTimer(); 
        const cellIndex = state.roundState.activeCell;
        if (cellIndex === null || !state.roundState.board[cellIndex]?.revealed) return; 
        const cell = state.roundState.board[cellIndex];
        const currentPlayer = state.roundState.phase;
        let turnOver = false; 
        let closeModalNow = true;

        if (isCorrect) {
            if (state.settings.sounds) sounds.success();
            cell.owner = currentPlayer;
            cell.revealed = false;
            state.roundState.scores[currentPlayer]++; 
            
            if (state.settings.playMode === 'team') {
                 advanceTeamMember(currentPlayer);
            }
            
            state.roundState.starter = (currentPlayer === "X") ? "O" : "X";
            turnOver = true; 
            const winCheck = checkWinCondition();
            if (winCheck.isWin) { endRound(currentPlayer, winCheck.line); } 
            else if (checkDrawCondition()) { endRound(null); }
        } else {
            if (state.settings.sounds) sounds.fail();
            if (!cell.tried) cell.tried = new Set();
            cell.tried.add(currentPlayer);
            if (cell.tried.size === 1) {
                state.roundState.phase = (currentPlayer === "X") ? "O" : "X";
                cell.revealed = true; 
                updateTurnUI(); 
                answerTurnHint.textContent = `دور ${state.settings.playerNames[state.roundState.phase]}.`;
                closeModalNow = false; 
                startAnswerTimer(); 
            } else {
                cell.revealed = false; 
                
                // (هذا هو المنطق الجديد لتحرير التركيبة)
                const oldComboKey = `${cell.letter}|${cell.category}`;
                if (state.match.usedCombinations) {
                    state.match.usedCombinations = state.match.usedCombinations.filter(c => c !== oldComboKey);
                }
                const { letter: newLetter, category: newCategory } = getNewCombination();
                cell.letter = newLetter;
                cell.category = newCategory;
                // (نهاية المنطق الجديد)

                cell.tried.clear(); 
                
                if (state.settings.playMode === 'team') {
                     advanceTeamMember(state.roundState.starter);
                }

                state.roundState.starter = (currentPlayer === "X") ? "O" : "X";
                turnOver = true; 
            }
        }

        if(closeModalNow) { toggleModal(null); }
        if (turnOver) { state.roundState.activeCell = null; state.roundState.phase = null; }

        if (state.roundState.gameActive) { 
            renderBoard(); updateTurnUI(); updateScoreboard();  
            if(turnOver) { saveStateToLocalStorage(); } 
        } else { saveStateToLocalStorage(); } 
    }

    function checkWinCondition() { 
        const board = state.roundState.board; const winLines = [ [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6] ]; for (const line of winLines) { const [a, b, c] = line; if (board[a].owner && board[a].owner === board[b].owner && board[a].owner === board[c].owner) return { isWin: true, line: line }; } return { isWin: false, line: null };
    }
    function checkDrawCondition() { return state.roundState.board.every(cell => cell.owner); }
    
    // (تم تحديث الدالة لتنفيذ منطق الأزرار ومنطق "الأفضل من")
    function endRound(winner, line = null) { 
        stopTimer(); 
        state.roundState.gameActive = false; 
        
        if (winner) { 
            state.match.totalScore[winner]++; 
            state.roundState.winInfo = { winner, line }; 
            roundWinnerMessage.textContent = `الفائز بالجولة: ${state.settings.playerNames[winner]}! 🎉`; 
            roundWinnerMessage.style.color = (winner === 'X') ? 'var(--primary-color)' : 'var(--secondary-color)';
            roundWinnerMessage.style.display = 'block';

            renderBoard(); 
            setTimeout(() => { 
                drawWinLine(line);
                if (state.settings.sounds) sounds.win(); 
                setTimeout(runConfetti, 500); 
            }, 50); 
        } else { 
            if (state.settings.sounds) sounds.draw(); 
            roundWinnerMessage.textContent = `تعادل! 🤝`;
            roundWinnerMessage.style.color = 'var(--text-color)';
            roundWinnerMessage.style.display = 'block';
        } 
        
        updateScoreboard(); // (تحديث النتيجة قبل التحقق من الفوز)

        // (منطق "الأفضل من" الجديد)
        const totalRounds = state.match.totalRounds || 3;
        const roundsToWin = Math.ceil(totalRounds / 2);
        
        const matchWinner = (state.match.totalScore.X === roundsToWin) ? 'X' : (state.match.totalScore.O === roundsToWin) ? 'O' : null;

        if (matchWinner) {
            // (المباراة انتهت)
            roundWinnerMessage.textContent = `🏆 الفائز بالمباراة: ${state.settings.playerNames[matchWinner]}! 🏆`;
            // (إخفاء جميع أزرار التحكم)
            newRoundBtn.style.display = 'none';
            restartRoundBtn.style.display = 'none';
            endMatchBtn.style.display = 'none';
            
            // (إظهار شاشة النهاية بعد ثانيتين)
            setTimeout(() => {
                toggleModal("modal-final-score");
            }, 2500);

        } else {
            // (المباراة لم تنتهِ، تجهيز للجولة التالية)
            state.match.round++; 
            // (تحديث منطق الأزرار حسب الخطة)
            newRoundBtn.style.display = 'inline-flex'; // (إظهار زر جولة جديدة)
            restartRoundBtn.style.display = 'none'; // (إخفاء زر الإعادة)
            endMatchBtn.style.display = 'none'; // (إخفاء زر الإنهاء)
        }
        
        saveStateToLocalStorage();
    }

    function drawWinLine(line) { 
        const cellElements = $$(".board-cell"); const startCell = cellElements[line[0]]; const endCell = cellElements[line[2]]; const lineEl = document.createElement('div'); lineEl.classList.add('win-line'); const startX = startCell.offsetLeft + startCell.offsetWidth / 2; const startY = startCell.offsetTop + startCell.offsetHeight / 2; const endX = endCell.offsetLeft + endCell.offsetWidth / 2; const endY = endCell.offsetTop + endCell.offsetHeight / 2; const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI); const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) + (startCell.offsetWidth * 0.6); lineEl.style.width = `${length}px`; lineEl.style.top = `${startY}px`; lineEl.style.left = `${startX}px`; lineEl.style.transform = `rotate(${angle}deg) translate(-${startCell.offsetWidth * 0.3}px, -50%)`; gameBoard.appendChild(lineEl);
    }
    function endMatchAndStartNew() { 
        toggleModal(null); 
        const oldSettings = JSON.parse(JSON.stringify(state.settings)); 
        state = JSON.parse(JSON.stringify(DEFAULT_STATE)); 
        // (تم حذف usedLetters)
        state.settings = oldSettings; 
        
        // (إعادة تحميل الإعدادات من الشاشة الرئيسية عند العودة)
        playerNameXInput.value = state.settings.playerNames.X;
        playerNameOInput.value = state.settings.playerNames.O;
        timerSelectHome.value = state.settings.secs;
        roundsSelectHome.value = state.match.totalRounds || 3;
        
        // [تم التعديل]
        renderChipsCategories(); // (تحديث لعرض الفئات المحفوظة)
        
        applyTheme(); 
        updateSoundToggles(); 
        switchView("home"); 
        
        document.getElementById('mode-team-home').classList.toggle('active', state.settings.playMode === 'team');
        document.getElementById('mode-individual-home').classList.toggle('active', state.settings.playMode === 'individual');

        updatePlayerInputLabels(state.settings.playMode);

        // (مسح الأسماء لإدخال جديد)
        playerNameXInput.value = ""; 
        playerNameOInput.value = ""; 
        
        localStorage.removeItem("ticTacCategoriesGameState"); 
        resumeGameBtn.style.display = "none";
    }
    function backToHomeWithSave() { 
           toggleModal(null); switchView("home"); resumeGameBtn.style.display = "inline-flex";
    }

    // --- [7] نظام المؤقت (Timer System) ---
    function startAnswerTimer() { 
        stopTimer(); const duration = state.settings.secs * 1000; state.timer.deadline = Date.now() + duration; answerTimerBar.style.setProperty('--timer-duration', `${state.settings.secs}s`); answerTimerBar.classList.remove("animating"); void answerTimerBar.offsetWidth; answerTimerBar.classList.add("animating"); state.timer.intervalId = setInterval(() => { const remaining = state.timer.deadline - Date.now(); if (remaining <= 0) { stopTimer(); if (modalAnswer.classList.contains("visible")) { if (state.settings.sounds) sounds.fail(); handleAnswer(false); } } else if (remaining <= 3000 && (remaining % 1000 < 100)) { if (state.settings.sounds) sounds.timerTick(); } }, 100);
    }
    function stopTimer() { 
        if (state.timer.intervalId) { clearInterval(state.timer.intervalId); state.timer.intervalId = null; } answerTimerBar.classList.remove("animating");
    }
    
    // --- [8] الحفظ والاستئناف (Persistence) ---
    function saveStateToLocalStorage() { 
           const stateToSave = JSON.parse(JSON.stringify(state)); 
           stateToSave.timer = DEFAULT_STATE.timer; 
           stateToSave.roundState.activeCell = null; 
           stateToSave.roundState.phase = null; 
           stateToSave.roundState.teamMemberIndex = state.roundState.teamMemberIndex;

           // (تم حذف usedLetters)
           // (تمت إضافة usedCombinations)
           if (state.match.usedCombinations) {
               stateToSave.match.usedCombinations = Array.from(state.match.usedCombinations);
           } else {
               stateToSave.match.usedCombinations = [];
           }
           
           stateToSave.roundState.board.forEach(cell => { if (cell.tried instanceof Set) { cell.tried = Array.from(cell.tried); } else { cell.tried = []; } }); 
           localStorage.setItem("ticTacCategoriesGameState", JSON.stringify(stateToSave));
    }
    function loadStateFromLocalStorage() { 
           const savedState = localStorage.getItem("ticTacCategoriesGameState"); 
           if (savedState) { 
               try { 
                   const loadedState = JSON.parse(savedState); 
                   const mergedState = JSON.parse(JSON.stringify(DEFAULT_STATE)); 
                   
                   mergedState.settings.playMode = loadedState.settings.playMode || DEFAULT_STATE.settings.playMode;
                   mergedState.settings.teamMembers = loadedState.settings.teamMembers || DEFAULT_STATE.settings.teamMembers;
                   
                   Object.assign(mergedState.settings, loadedState.settings); 
                   Object.assign(mergedState.match, loadedState.match); 
                   Object.assign(mergedState.roundState, loadedState.roundState); 
                   
                   // (تم حذف usedLetters)
                   // (تمت إضافة usedCombinations)
                   mergedState.match.usedCombinations = loadedState.match.usedCombinations || [];

                   mergedState.roundState.board.forEach(cell => { cell.tried = new Set(cell.tried || []); }); 
                   mergedState.roundState.teamMemberIndex = loadedState.roundState.teamMemberIndex || DEFAULT_STATE.roundState.teamMemberIndex; 
                   
                   if (!mergedState.match.totalScore) { 
                        mergedState.match.totalScore = { X: 0, O: 0 }; 
                   } 
                   state = mergedState; return true; 
               } catch (e) { 
                   console.error("Failed to parse saved state:", e); 
                   localStorage.removeItem("ticTacCategoriesGameState"); 
                   return false; 
               } 
           } 
           return false;
    }

    // (تم تحديث الدالة لتشمل منطق الأزرار الجديد)
    function resumeGame() { 
        initAudio(); applyTheme(); updateSoundToggles(); 
        
        document.getElementById('mode-team-home').classList.toggle('active', state.settings.playMode === 'team');
        document.getElementById('mode-individual-home').classList.toggle('active', state.settings.playMode === 'individual');

        updatePlayerInputLabels(state.settings.playMode);
        
        updatePlayerTags(); updateScoreboard(); renderBoard(); updateTurnUI(); updateTeamMemberDisplay();
        timerHint.textContent = `${state.settings.secs} ثوانٍ`; 
        
        // (تحديث منطق الأزرار عند الاستئناف)
        if (state.roundState.gameActive) {
            newRoundBtn.style.display = 'none';
            restartRoundBtn.style.display = 'inline-flex';
            endMatchBtn.style.display = 'inline-flex';
        } else {
            // (التحقق إذا كانت المباراة قد انتهت)
            const totalRounds = state.match.totalRounds || 3;
            const roundsToWin = Math.ceil(totalRounds / 2);
            const matchOver = (state.match.totalScore.X === roundsToWin || state.match.totalScore.O === roundsToWin);

            if (matchOver) {
                newRoundBtn.style.display = 'none';
                toggleModal("modal-final-score"); // (إظهار شاشة النهاية إذا كانت المباراة منتهية)
            } else {
                newRoundBtn.style.display = 'inline-flex';
            }
            restartRoundBtn.style.display = 'none';
            endMatchBtn.style.display = 'none';
        }
        
        switchView("game"); 
        if (state.settings.sounds) sounds.click();
    }
    
    // --- [9] ربط الأحداث (Event Listeners) ---
    // (تم تنظيف الدالة وإزالة المستمعات المحذوفة)
    function initEventListeners() { 
           startGameBtn.addEventListener("click", startNewMatch); 
           resumeGameBtn.addEventListener("click", resumeGame); 
           themeToggleHome.addEventListener("click", toggleTheme); 
           soundsToggleHome.addEventListener("click", toggleSounds); 
           instructionsBtnHome.addEventListener("click", () => { initAudio(); if (state.settings.sounds) sounds.click(); toggleModal("modal-instructions"); }); 
           themeToggleGame.addEventListener("click", toggleTheme); 
           
           // (تم حذف مستمع settingsBtnGame)
           
           instructionsBtnGame.addEventListener("click", () => { if (state.settings.sounds) sounds.click(); toggleModal("modal-instructions"); }); 
           newRoundBtn.addEventListener("click", () => { if (state.settings.sounds) sounds.click(); initNewRound(false); }); 
           restartRoundBtn.addEventListener("click", () => { if (state.settings.sounds) sounds.fail(); toggleModal("modal-confirm-restart"); }); 
           endMatchBtn.addEventListener("click", () => { if (state.settings.sounds) sounds.fail(); toggleModal("modal-final-score"); }); 
           answerCorrectBtn.addEventListener("click", () => handleAnswer(true)); 
           answerWrongBtn.addEventListener("click", () => handleAnswer(false)); 
           
           // (تم حذف مستمع saveSettingsBtn)
           // (تم حذف مستمع soundsToggleSettings)
           
           newMatchBtn.addEventListener("click", endMatchAndStartNew); 
           
           if (backToHomeBtn) {
                backToHomeBtn.addEventListener("click", backToHomeWithSave);
           }
           
           confirmRestartBtn.addEventListener("click", () => { toggleModal(null); if (state.settings.sounds) sounds.click(); initNewRound(true); }); 
           modalCloseBtns.forEach(btn => { btn.addEventListener("click", (e) => { const modalId = e.currentTarget.dataset.modal; if (modalId) { toggleModal(null); if (state.settings.sounds) sounds.click(); } }); }); 
           $$(".modal-overlay").forEach(modal => { modal.addEventListener("click", (e) => { if (e.target === modal) { if (modal.id !== 'modal-answer') { toggleModal(null); if (state.settings.sounds) sounds.click(); } } }); });
           
           // (المستمعات الخاصة بـ "home" فقط)
           if (inputTeamXHome) inputTeamXHome.addEventListener('keydown', (e) => { if(e.key === 'Enter') window.handleChipInput(e, 'X', true, false); });
           if (inputTeamXHome) inputTeamXHome.addEventListener('blur', (e) => window.handleChipInput(e, 'X', true, false));
           if (inputTeamOHome) inputTeamOHome.addEventListener('keydown', (e) => { if(e.key === 'Enter') window.handleChipInput(e, 'O', true, false); });
           if (inputTeamOHome) inputTeamOHome.addEventListener('blur', (e) => window.handleChipInput(e, 'O', true, false));

           // [تمت الإضافة] ربط الأحداث لحقل الفئات الجديد
           if (inputCatsHome) inputCatsHome.addEventListener('keydown', (e) => { if(e.key === 'Enter') window.handleChipInputCategories(false, e); });
           if (inputCatsHome) inputCatsHome.addEventListener('blur', (e) => window.handleChipInputCategories(false, e));
           
           // (تم حذف المستمعات الخاصة بـ modal-settings)
    }

    // --- [10] بدء تشغيل اللعبة ---
    // (تم تحديث الدالة لتقرأ الإعدادات الجديدة)
    function initializeGame() { 
        if (loadStateFromLocalStorage()) { 
            resumeGameBtn.style.display = "inline-flex"; 
            playerNameXInput.value = state.settings.playerNames.X; 
            playerNameOInput.value = state.settings.playerNames.O; 
            
            // (تحميل الإعدادات الجديدة إلى الشاشة الرئيسية)
            timerSelectHome.value = state.settings.secs; 
            roundsSelectHome.value = state.match.totalRounds || 3;
            
            // [تم الحذف] extraCatsHome.value = ...
            
            document.getElementById('mode-team-home').classList.toggle('active', state.settings.playMode === 'team');
            document.getElementById('mode-individual-home').classList.toggle('active', state.settings.playMode === 'individual');
            
            // (تم حذف الأسطر الخاصة بـ modal-settings)

            updatePlayerInputLabels(state.settings.playMode);
            
            renderChips('X'); // (تم التبسيط)
            renderChips('O'); // (تم التبسيط)
            renderChipsCategories(); // [تمت الإضافة]
            
        } else {
            document.getElementById('mode-team-home').classList.add('active'); 
            updatePlayerInputLabels(DEFAULT_STATE.settings.playMode);
            renderChipsCategories(); // [تمت الإضافة]
        }
        
        applyTheme(); updateSoundToggles(); updatePlayerTags(); initEventListeners();
    }
    initializeGame();
});
