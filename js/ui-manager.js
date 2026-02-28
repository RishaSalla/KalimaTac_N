// --- [5] إدارة الحالة والواجهة (State & UI Management) ---

function switchView(viewName) { 
    appContainer.setAttribute("data-view", viewName); 
}

function toggleModal(modalId) { 
    $$(".modal-overlay.visible").forEach(modal => modal.classList.remove("visible")); 
    if (modalId) { 
        const modal = $(`#${modalId}`); 
        if (modal) { 
            modal.classList.add("visible"); 
            if (modalId === 'modal-final-score') loadFinalScores(); 
        } 
    }
}

function loadFinalScores() { 
    if (finalWinnerText) finalWinnerText.textContent = "إنهاء اللعبة"; 
    if (finalWinsX) finalWinsX.textContent = `${state.settings.playerNames.X}: ${state.match.totalScore.X} فوز`; 
    if (finalWinsO) finalWinsO.textContent = `${state.settings.playerNames.O}: ${state.match.totalScore.O} فوز`;
}

function updatePlayerInputLabels(mode) {
    const isTeam = mode === 'team';
    $$('.team-members-group').forEach(group => group.style.display = isTeam ? 'flex' : 'none');
    
    $$('.team-name-group').forEach(group => {
        const isX = group.querySelector('#player-name-x');
        const nameInput = isX ? playerNameXInput : playerNameOInput;
        const labelText = isX ? `اسم ${isTeam ? 'فريق' : 'فرد'} X` : `اسم ${isTeam ? 'فريق' : 'فرد'} O`;
        const placeholderText = isX ? `اسم فريق X (مثال: النمور)` : `اسم فريق O (مثال: التماسيح)`;
        
        group.querySelector('label').textContent = labelText;
        nameInput.placeholder = isTeam ? placeholderText : 'اسم اللاعب';
    });
    
    renderChips('X'); 
    renderChips('O'); 
}

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

    updatePlayerInputLabels(newMode); 
    saveStateToLocalStorage();
    if (state.settings.sounds) sounds.click();
}

function applyTheme() { 
    const theme = state.settings.theme; 
    document.documentElement.setAttribute("data-theme", theme); 
    const isActive = theme === "dark"; 
    const text = isActive ? "ثيم فاتح" : "ثيم غامق"; 
    
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
    initAudio(); 
    state.settings.theme = state.settings.theme === "light" ? "dark" : "light"; 
    applyTheme(); 
    saveStateToLocalStorage(); 
    sounds.click();
}

function updateSoundToggles() { 
    const active = state.settings.sounds; 
    const text = active ? "مفعلة" : "معطلة"; 
    if (soundsToggleHome) {
        soundsToggleHome.setAttribute("data-active", active); 
        soundsToggleHome.querySelector(".switch-text").textContent = text; 
    }
}

function toggleSounds() { 
    initAudio(); 
    state.settings.sounds = !state.settings.sounds; 
    updateSoundToggles(); 
    if (state.settings.sounds) { 
        initAudio(); 
        sounds.success(); 
    } 
    saveStateToLocalStorage();
}

function updateScoreboard() { 
    const totalRounds = state.match.totalRounds || 3;
    roundInfo.textContent = `الجولة ${state.match.round} (الأفضل من ${totalRounds})`; 
    const scoreX = state.match.totalScore.X; 
    const scoreO = state.match.totalScore.O; 
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
    playerTagX.querySelector('.player-name-text').textContent = state.settings.playerNames.X; 
    playerTagO.querySelector('.player-name-text').textContent = state.settings.playerNames.O; 
    updateTeamMemberDisplay();
    $(".screen-header h1").textContent = "كلمتاك"; 
    gameTitle.textContent = "كلمتاك";
}

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

    timerText.textContent = memberName ? `دور ${teamName} (${memberName})` : `دور ${teamName}`;
    playerTagX.classList.toggle("active", currentPlayer === "X"); 
    playerTagO.classList.toggle("active", currentPlayer === "O"); 
    updateTeamMemberDisplay();
    renderBoardAvailability(currentPlayer);
}
