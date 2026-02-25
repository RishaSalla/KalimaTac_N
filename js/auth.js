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
        state.settings.sounds = false; 
        if (typeof updateSoundToggles === "function") updateSoundToggles();
    }
}

function playSound(freq, gain, duration, type = "sine", delay = 0) { 
    if (!audioCtx || !state.settings.sounds) return; 
    const oscillator = audioCtx.createOscillator(); 
    const gainNode = audioCtx.createGain(); 
    oscillator.type = type; 
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + delay); 
    gainNode.gain.setValueAtTime(gain, audioCtx.currentTime + delay); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration); 
    oscillator.connect(gainNode); 
    gainNode.connect(audioCtx.destination); 
    oscillator.start(audioCtx.currentTime + delay); 
    oscillator.stop(audioCtx.currentTime + delay + duration);
}

// --- [4] نظام الكونفيتي (Confetti Engine) ---
function runConfetti() { 
     if (!confettiCanvas || !confettiCtx) return; 
     confettiParticles = []; 
     confettiCanvas.width = window.innerWidth; 
     confettiCanvas.height = window.innerHeight; 
     const colors = ["#60a5fa", "#34d399", "#faf089"]; 
     for (let i = 0; i < 200; i++) { 
        confettiParticles.push({ 
            x: Math.random() * confettiCanvas.width, 
            y: Math.random() * confettiCanvas.height - confettiCanvas.height, 
            size: Math.random() * 10 + 5, 
            color: colors[Math.floor(Math.random() * colors.length)], 
            speedX: Math.random() * 6 - 3, 
            speedY: Math.random() * 5 + 2, 
            angle: Math.random() * 2 * Math.PI, 
            spin: Math.random() * 0.2 - 0.1 
        }); 
     } 
     let startTime = Date.now(); 
     function animateConfetti() { 
        if (Date.now() - startTime > 2500) { 
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); 
            return; 
        } 
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); 
        confettiParticles.forEach(p => { 
            p.x += p.speedX; p.y += p.speedY; p.angle += p.spin; p.speedY += 0.05; 
            confettiCtx.save(); 
            confettiCtx.fillStyle = p.color; 
            confettiCtx.translate(p.x + p.size / 2, p.y + p.size / 2); 
            confettiCtx.rotate(p.angle); 
            confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); 
            confettiCtx.restore(); 
        }); 
        requestAnimationFrame(animateConfetti); 
     } 
     animateConfetti();
}

// --- [9] ربط الأحداث (Event Listeners) ---
function initEventListeners() { 
       startGameBtn.addEventListener("click", startNewMatch); 
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
       
       newMatchBtn.addEventListener("click", () => { location.reload(); }); 
       backToHomeBtn.addEventListener("click", () => { location.reload(); }); 
       
       confirmRestartBtn.addEventListener("click", () => { toggleModal(null); if (state.settings.sounds) sounds.click(); initNewRound(true); }); 
       
       modalCloseBtns.forEach(btn => { 
           btn.addEventListener("click", () => { toggleModal(null); if (state.settings.sounds) sounds.click(); }); 
       });
}

// --- [10] بدء تشغيل اللعبة ---
function initializeGame() { 
    if (loadStateFromLocalStorage()) { 
        resumeGameBtn.style.display = "inline-flex"; 
        playerNameXInput.value = state.settings.playerNames.X; 
        playerNameOInput.value = state.settings.playerNames.O; 
        timerSelectHome.value = state.settings.secs; 
        roundsSelectHome.value = state.match.totalRounds || 3;
        
        if (typeof updatePlayerInputLabels === "function") updatePlayerInputLabels(state.settings.playMode);
        if (typeof renderChips === "function") { renderChips('X'); renderChips('O'); }
        if (typeof renderChipsCategories === "function") renderChipsCategories(); 
    } else {
        if (typeof updatePlayerInputLabels === "function") updatePlayerInputLabels(DEFAULT_STATE.settings.playMode);
    }
    
    if (typeof applyTheme === "function") applyTheme(); 
    if (typeof updateSoundToggles === "function") updateSoundToggles(); 
    if (typeof updatePlayerTags === "function") updatePlayerTags(); 
    initEventListeners();
}

// نقطة الانطلاق
initializeGame();
