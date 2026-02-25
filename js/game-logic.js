// --- [6] منطق اللعبة الأساسي (Game Logic) ---

function getNewCombination(retries = 50) {
    if (!state.match.usedCombinations) state.match.usedCombinations = [];
    
    const allCats = [...BASE_CATEGORIES, ...state.settings.extraCats];
    if (allCats.length === 0) allCats.push("إنسان", "حيوان", "جماد"); 
    
    for (let i = 0; i < retries; i++) {
        const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
        
        let availableCats = [...new Set(allCats)];
        if (['ض', 'ظ'].includes(letter)) {
            availableCats = availableCats.filter(cat => cat !== 'نبات');
        }
        if (availableCats.length === 0) availableCats = ['إنسان', 'حيوان', 'جماد', 'بلاد'];
        
        const category = availableCats[Math.floor(Math.random() * availableCats.length)];
        const comboKey = `${letter}|${category}`;
        
        if (!state.match.usedCombinations.includes(comboKey)) {
            state.match.usedCombinations.push(comboKey); 
            return { letter, category };
        }
    }
    
    console.warn("Fallback: Could not find unique combination.");
    const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
    const category = allCats[Math.floor(Math.random() * allCats.length)];
    return { letter, category };
}

function startNewMatch() { 
    initAudio(); 
    
    state.settings.secs = parseInt(timerSelectHome.value, 10); 
    state.match.totalRounds = parseInt(roundsSelectHome.value, 10);
    
    const activeModeBtn = document.querySelector('#mode-selector-wrapper .mode-btn.active');
    state.settings.playMode = activeModeBtn ? activeModeBtn.getAttribute('data-mode') : 'team';
    
    const isTeam = state.settings.playMode === 'team';
    const defaultX = isTeam ? "فريق X" : "لاعب X";
    const defaultO = isTeam ? "فريق O" : "لاعب O";
    
    let nameX = playerNameXInput.value.trim() || defaultX; 
    let nameO = playerNameOInput.value.trim() || defaultO; 

    if (nameX === nameO) nameO = `${nameO} (2)`; 
    state.settings.playerNames.X = nameX; state.settings.playerNames.O = nameO; 
    
    const oldSettings = JSON.parse(JSON.stringify(state.settings)); 
    state = JSON.parse(JSON.stringify(DEFAULT_STATE)); 
    state.settings = oldSettings; 
    state.match.totalRounds = parseInt(roundsSelectHome.value, 10); 

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
       
       if (!isRestart) {
         state.roundState.teamMemberIndex = { X: 0, O: 0 };
       }

       generateBoard(); renderBoard(); updateScoreboard(); updateTurnUI(); 
       
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
            letter: letter, 
            category: category, 
            owner: null, 
            revealed: false, 
            tried: new Set() 
        }); 
    }
}

function renderBoardAvailability(currentPlayer) { 
    $$(".board-cell").forEach((cellEl, index) => { 
        const cell = state.roundState.board[index]; 
        if (cell.owner || cell.revealed) { 
            cellEl.classList.remove("available"); 
            cellEl.classList.add("unavailable"); 
        } else { 
            if (state.roundState.phase === null) { 
                cellEl.classList.add("available"); 
                cellEl.classList.remove("unavailable"); 
            } else { 
                cellEl.classList.remove("available"); 
                cellEl.classList.add("unavailable"); 
            } 
        } 
    });
}

function renderBoard() { 
    gameBoard.innerHTML = ''; 
    const oldWinLine = gameBoard.querySelector('.win-line'); 
    if (oldWinLine) oldWinLine.remove(); 
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
    if (!state.roundState.gameActive || state.roundState.phase !== null) { 
        if (state.settings.sounds) sounds.fail(); return; 
    } 
    const cellIndex = parseInt(e.currentTarget.dataset.index, 10); 
    const cell = state.roundState.board[cellIndex]; 
    if (cell.owner) { if (state.settings.sounds) sounds.fail(); return; } 
    if (state.settings.sounds) sounds.click(); 
    stopTimer(); 
    state.roundState.activeCell = cellIndex; 
    state.roundState.phase = state.roundState.starter; 
    cell.revealed = true; 
    cell.tried = new Set(); 
    renderBoard(); 
    updateTurnUI(); 
    answerLetter.textContent = cell.letter; 
    answerCategory.textContent = cell.category; 
    answerTurnHint.textContent = `دور ${state.settings.playerNames[state.roundState.phase]}.`; 
    toggleModal("modal-answer"); 
    startAnswerTimer();
}

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
            
            const oldComboKey = `${cell.letter}|${cell.category}`;
            if (state.match.usedCombinations) {
                state.match.usedCombinations = state.match.usedCombinations.filter(c => c !== oldComboKey);
            }
            const { letter: newLetter, category: newCategory } = getNewCombination();
            cell.letter = newLetter;
            cell.category = newCategory;

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
    
    updateScoreboard(); 

    const totalRounds = state.match.totalRounds || 3;
    const roundsToWin = Math.ceil(totalRounds / 2);
    
    const matchWinner = (state.match.totalScore.X === roundsToWin) ? 'X' : (state.match.totalScore.O === roundsToWin) ? 'O' : null;

    if (matchWinner) {
        roundWinnerMessage.textContent = `🏆 الفائز بالمباراة: ${state.settings.playerNames[matchWinner]}! 🏆`;
        newRoundBtn.style.display = 'none';
        restartRoundBtn.style.display = 'none';
        endMatchBtn.style.display = 'none';
        
        setTimeout(() => {
            toggleModal("modal-final-score");
        }, 2500);

    } else {
        state.match.round++; 
        newRoundBtn.style.display = 'inline-flex'; 
        restartRoundBtn.style.display = 'none'; 
        endMatchBtn.style.display = 'none'; 
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
    answerTimerBar.classList.remove("animating"); 
    void answerTimerBar.offsetWidth; 
    answerTimerBar.classList.add("animating"); 
    state.timer.intervalId = setInterval(() => { 
        const remaining = state.timer.deadline - Date.now(); 
        if (remaining <= 0) { 
            stopTimer(); 
            if (modalAnswer.classList.contains("visible")) { 
                if (state.settings.sounds) sounds.fail(); 
                handleAnswer(false); 
            } 
        } else if (remaining <= 3000 && (remaining % 1000 < 100)) { 
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
