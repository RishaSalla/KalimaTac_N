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

    // --- [9] ربط الأحداث (Event Listeners) ---
    function initEventListeners() { 
           startGameBtn.addEventListener("click", startNewMatch); 
           resumeGameBtn.addEventListener("click", resumeGame); 
           themeToggleHome.addEventListener("click", toggleTheme); 
           soundsToggleHome.addEventListener("click", toggleSounds); 
           instructionsBtnHome.addEventListener("click", () => { initAudio(); if (state.settings.sounds) sounds.click(); toggleModal("modal-instructions"); }); 
           themeToggleGame.addEventListener("click", toggleTheme); 
           
           instructionsBtnGame.addEventListener("click", () => { if (state.settings.sounds) sounds.click(); toggleModal("modal-instructions"); }); 
           newRoundBtn.addEventListener("click", () => { if (state.settings.sounds) sounds.click(); initNewRound(false); }); 
           restartRoundBtn.addEventListener("click", () => { if (state.settings.sounds) sounds.fail(); toggleModal("modal-confirm-restart"); }); 
           endMatchBtn.addEventListener("click", () => { if (state.settings.sounds) sounds.fail(); toggleModal("modal-final-score"); }); 
           answerCorrectBtn.addEventListener("click", () => handleAnswer(true)); 
           answerWrongBtn.addEventListener("click", () => handleAnswer(false)); 
           
           newMatchBtn.addEventListener("click", endMatchAndStartNew); 
           
           if (backToHomeBtn) {
                backToHomeBtn.addEventListener("click", backToHomeWithSave);
           }
           
           confirmRestartBtn.addEventListener("click", () => { toggleModal(null); if (state.settings.sounds) sounds.click(); initNewRound(true); }); 
           modalCloseBtns.forEach(btn => { btn.addEventListener("click", (e) => { const modalId = e.currentTarget.dataset.modal; if (modalId) { toggleModal(null); if (state.settings.sounds) sounds.click(); } }); }); 
           $$(".modal-overlay").forEach(modal => { modal.addEventListener("click", (e) => { if (e.target === modal) { if (modal.id !== 'modal-answer') { toggleModal(null); if (state.settings.sounds) sounds.click(); } } }); });
           
           if (inputTeamXHome) inputTeamXHome.addEventListener('keydown', (e) => { if(e.key === 'Enter') window.handleChipInput(e, 'X', true, false); });
           if (inputTeamXHome) inputTeamXHome.addEventListener('blur', (e) => window.handleChipInput(e, 'X', true, false));
           if (inputTeamOHome) inputTeamOHome.addEventListener('keydown', (e) => { if(e.key === 'Enter') window.handleChipInput(e, 'O', true, false); });
           if (inputTeamOHome) inputTeamOHome.addEventListener('blur', (e) => window.handleChipInput(e, 'O', true, false));

           if (inputCatsHome) inputCatsHome.addEventListener('keydown', (e) => { if(e.key === 'Enter') window.handleChipInputCategories(false, e); });
           if (inputCatsHome) inputCatsHome.addEventListener('blur', (e) => window.handleChipInputCategories(false, e));
    }

    // --- [10] بدء تشغيل اللعبة ---
    function initializeGame() { 
        if (loadStateFromLocalStorage()) { 
            resumeGameBtn.style.display = "inline-flex"; 
            playerNameXInput.value = state.settings.playerNames.X; 
            playerNameOInput.value = state.settings.playerNames.O; 
            
            timerSelectHome.value = state.settings.secs; 
            roundsSelectHome.value = state.match.totalRounds || 3;
            
            document.getElementById('mode-team-home').classList.toggle('active', state.settings.playMode === 'team');
            document.getElementById('mode-individual-home').classList.toggle('active', state.settings.playMode === 'individual');
            
            updatePlayerInputLabels(state.settings.playMode);
            
            renderChips('X'); 
            renderChips('O'); 
            renderChipsCategories(); 
            
        } else {
            document.getElementById('mode-team-home').classList.add('active'); 
            updatePlayerInputLabels(DEFAULT_STATE.settings.playMode);
            renderChipsCategories(); 
        }
        
        applyTheme(); updateSoundToggles(); updatePlayerTags(); initEventListeners();
    }
    initializeGame();
