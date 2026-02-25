// --- [6] منطق اللعبة الأساسي (Game Logic) ---

function getNewCombination(retries = 50) {
    if (!state.match.usedCombinations) state.match.usedCombinations = [];
    
    const allCats = [...BASE_CATEGORIES, ...state.settings.extraCats];
    if (allCats.length === 0) allCats.push("إنسان", "حيوان", "جماد"); 
    
    for (let i = 0; i < retries; i++) {
        const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
        let availableCats = [...new Set(allCats)];
        
        // منطق استبعاد نبات مع ض/ظ كما في كودك
        if (['ض', 'ظ'].includes(letter)) {
            availableCats = availableCats.filter(cat => cat !== 'نبات');
        }
        
        const category = availableCats[Math.floor(Math.random() * availableCats.length)];
        const comboKey = `${letter}|${category}`;
        
        if (!state.match.usedCombinations.includes(comboKey)) {
            state.match.usedCombinations.push(comboKey); 
            return { letter, category };
        }
    }
    
    const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
    const category = allCats[Math.floor(Math.random() * allCats.length)];
    return { letter, category };
}

function startNewMatch() { 
    if (typeof initAudio === "function") initAudio(); 
    
    state.settings.secs = parseInt(timerSelectHome.value, 10); 
    state.match.totalRounds = parseInt(roundsSelectHome.value, 10);
    
    const activeModeBtn = document.querySelector('#mode-selector-wrapper .mode-btn.active');
    state.settings.playMode = activeModeBtn ? activeModeBtn.getAttribute('data-mode') : 'team';
    
    const isTeam = state.settings.playMode === 'team';
    let nameX = playerNameXInput.value.trim() || (isTeam ? "فريق X" : "لاعب X"); 
    let nameO = playerNameOInput.value.trim() || (isTeam ? "فريق O" : "لاعب O"); 

    if (nameX === nameO) nameO = `${nameO} (2)`; 
    state.settings.playerNames.X = nameX; 
    state.settings.playerNames.O = nameO; 
    
    const oldSettings = JSON.parse(JSON.stringify(state.settings)); 
    state = JSON.parse(JSON.stringify(DEFAULT_STATE)); 
    state.settings = oldSettings; 

    timerHint.textContent = `${state.settings.secs} ثوانٍ`; 
    initNewRound(); 
    if (typeof updatePlayerTags === "function") updatePlayerTags(); 
    switchView("game"); 
    if (sounds.click) sounds.click();
}

function initNewRound(isRestart = false) { 
       stopTimer(); 
       roundWinnerMessage.style.display = 'none'; 
       if (!isRestart) { state.roundState.starter = (state.match.round % 2 === 1) ? "X" : "O"; } 
       state.roundState.phase = null; 
       state.roundState.activeCell = null; 
       state.roundState.gameActive = true; 
       state.roundState.winInfo = null; 
       state.roundState.scores = { X: 0, O: 0 }; 
       
       if (!isRestart) { state.roundState.teamMemberIndex = { X: 0, O: 0 }; }

       generateBoard(); 
       renderBoard(); 
       if (typeof updateScoreboard === "function") updateScoreboard(); 
       if (typeof updateTurnUI === "function") updateTurnUI(); 
       
       newRoundBtn.style.display = 'none'; 
       restartRoundBtn.style.display = 'inline-flex'; 
       endMatchBtn.style.display = 'inline-flex'; 

       saveStateToLocalStorage();
}

function generateBoard() { 
    state.roundState.board = []; 
    for (let i = 0; i < 9; i++) { 
        const { letter, category } = getNewCombination(); 
        state.roundState.board.push({ 
            letter: letter, category: category, owner: null, revealed: false, tried: new Set() 
        }); 
    }
}

function renderBoardAvailability(currentPlayer) { 
    $$(".board-cell").forEach((cellEl, index) => { 
        const cell = state.roundState.board[index]; 
        if (cell.owner || cell.revealed) { 
            cellEl.classList.remove("available"); cellEl.classList.add("unavailable"); 
        } else { 
            if (state.roundState.phase === null) { 
                cellEl.classList.add("available"); cellEl.classList.remove("unavailable"); 
            } else { 
                cellEl.classList.remove("available"); cellEl.classList.add("unavailable"); 
            } 
        } 
    });
}

function renderBoard() { 
    gameBoard.innerHTML = ''; 
    state.roundState.board.forEach((cell, index) => { 
        const cellEl = document.createElement('div'); 
        cellEl.classList.add('board-cell'); 
        cellEl.dataset.index = index; 
        const letterEl = document.createElement('span'); 
        letterEl.classList.add('cell-letter'); 
        const categoryEl = document.createElement('span'); 
        categoryEl.classList.add('cell-category'); 
        
        if (cell.owner) { 
            cellEl.classList.add('owned', `player-${cell.owner.toLowerCase()}`); 
            letterEl.textContent = cell.owner; 
        } else { 
            letterEl.textContent = cell.letter; 
            categoryEl.textContent = cell.category; 
            if (cell.revealed) cellEl.classList.add('revealed'); 
        } 
        cellEl.appendChild(letterEl); 
        cellEl.appendChild(categoryEl); 
        cellEl.addEventListener('click', onCellClick); 
        gameBoard.appendChild(cellEl); 
    }); 
    if (state.roundState.winInfo) { drawWinLine(state.roundState.winInfo.line); } 
    renderBoardAvailability(state.roundState.phase || state.roundState.starter);
}

function onCellClick(e) { 
    if (!state.roundState.gameActive || state.roundState.phase !== null) return; 
    const cellIndex = parseInt(e.currentTarget.dataset.index, 10); 
    const cell = state.roundState.board[cellIndex]; 
    if (cell.owner) return; 
    
    stopTimer(); 
    state.roundState.activeCell = cellIndex; 
    state.roundState.phase = state.roundState.starter; 
    cell.revealed = true; 
    cell.tried = new Set(); 
    renderBoard(); 
    if (typeof updateTurnUI === "function") updateTurnUI(); 
    
    answerLetter.textContent = cell.letter; 
    answerCategory.textContent = cell.category; 
    answerTurnHint.textContent = `دور ${state.settings.playerNames[state.roundState.phase]}.`; 
    if (typeof toggleModal === "function") toggleModal("modal-answer"); 
    startAnswerTimer();
}

function handleAnswer(isCorrect) { 
    stopTimer(); 
    const cellIndex = state.roundState.activeCell;
    const cell = state.roundState.board[cellIndex];
    const currentPlayer = state.roundState.phase;
    let turnOver = false; 

    if (isCorrect) {
        cell.owner = currentPlayer;
        cell.revealed = false;
        state.roundState.scores[currentPlayer]++; 
        if (typeof advanceTeamMember === "function") advanceTeamMember(currentPlayer);
        state.roundState.starter = (currentPlayer === "X") ? "O" : "X";
        turnOver = true; 
        const winCheck = checkWinCondition();
        if (winCheck.isWin) { endRound(currentPlayer, winCheck.line); } 
        else if (checkDrawCondition()) { endRound(null); }
    } else {
        cell.tried.add(currentPlayer);
        if (cell.tried.size === 1) {
            state.roundState.phase = (currentPlayer === "X") ? "O" : "X";
            updateTurnUI(); 
            answerTurnHint.textContent = `دور ${state.settings.playerNames[state.roundState.phase]}.`;
            startAnswerTimer(); 
            return; // لا نغلق المودال
        } else {
            cell.revealed = false; 
            if (typeof advanceTeamMember === "function") advanceTeamMember(state.roundState.starter);
            state.roundState.starter = (currentPlayer === "X") ? "O" : "X";
            turnOver = true; 
        }
    }

    if (typeof toggleModal === "function") toggleModal(null);
    if (turnOver) { state.roundState.activeCell = null; state.roundState.phase = null; }
    renderBoard(); 
    updateTurnUI(); 
    updateScoreboard();  
    saveStateToLocalStorage();
}

function checkWinCondition() { 
    const board = state.roundState.board; 
    const winLines = [ [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6] ]; 
    for (const line of winLines) { 
        const [a, b, c] = line; 
        if (board[a].owner && board[a].owner === board[b].owner && board[a].owner === board[c].owner) return { isWin: true, line: line }; 
    } 
    return { isWin: false, line: null };
}

function checkDrawCondition() { return state.roundState.board.every(cell => cell.owner); }

function endRound(winner, line = null) { 
    stopTimer(); 
    state.roundState.gameActive = false; 
    if (winner) { 
        state.match.totalScore[winner]++; 
        state.roundState.winInfo = { winner, line }; 
        roundWinnerMessage.textContent = `الفائز بالجولة: ${state.settings.playerNames[winner]}! 🎉`; 
        roundWinnerMessage.style.display = 'block';
        renderBoard(); 
        if (typeof runConfetti === "function") setTimeout(runConfetti, 500); 
    } else { 
        roundWinnerMessage.textContent = `تعادل! 🤝`;
        roundWinnerMessage.style.display = 'block';
    } 
    
    const roundsToWin = Math.ceil((state.match.totalRounds || 3) / 2);
    if (state.match.totalScore.X === roundsToWin || state.match.totalScore.O === roundsToWin) {
        newRoundBtn.style.display = 'none';
        setTimeout(() => toggleModal("modal-final-score"), 2500);
    } else {
        state.match.round++; 
        newRoundBtn.style.display = 'inline-flex'; 
    }
    saveStateToLocalStorage();
}

function drawWinLine(line) { 
    const cellElements = $$(".board-cell"); 
    const startCell = cellElements[line[0]]; 
    const endCell = cellElements[line[2]]; 
    const lineEl = document.createElement('div'); 
    lineEl.classList.add('win-line'); 
    const startX = startCell.offsetLeft + startCell.offsetWidth / 2; 
    const startY = startCell.offsetTop + startCell.offsetHeight / 2; 
    const endX = endCell.offsetLeft + endCell.offsetWidth / 2; 
    const endY = endCell.offsetTop + endCell.offsetHeight / 2; 
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI); 
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) + (startCell.offsetWidth * 0.6); 
    lineEl.style.width = `${length}px`; 
    lineEl.style.top = `${startY}px`; 
    lineEl.style.left = `${startX}px`; 
    lineEl.style.transform = `rotate(${angle}deg) translate(-${startCell.offsetWidth * 0.3}px, -50%)`; 
    gameBoard.appendChild(lineEl);
}

function startAnswerTimer() { 
    stopTimer(); 
    const duration = state.settings.secs * 1000; 
    state.timer.deadline = Date.now() + duration; 
    answerTimerBar.style.setProperty('--timer-duration', `${state.settings.secs}s`); 
    answerTimerBar.classList.add("animating"); 
    state.timer.intervalId = setInterval(() => { 
        if (Date.now() >= state.timer.deadline) { 
            stopTimer(); handleAnswer(false); 
        } 
    }, 100);
}

function stopTimer() { 
    if (state.timer.intervalId) clearInterval(state.timer.intervalId); 
    state.timer.intervalId = null; 
    answerTimerBar.classList.remove("animating");
}
