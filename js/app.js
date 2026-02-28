"use strict";

// --- [1] تعريف العناصر الأساسية ---
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const appContainer = $("#app-container");
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
const modalConfirmRestart = $("#modal-confirm-restart"); 
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
        theme: "light", 
        extraCats: [], 
        playerNames: { X: "فريق X", O: "فريق O" },
        playMode: "team",
        teamMembers: { X: [], O: [] }, 
    },
    match: { 
        round: 1, 
        totalScore: { X: 0, O: 0 },
        totalRounds: 3,
        usedCombinations: []
    }, 
    roundState: { 
        board: [], scores: { X: 0, O: 0 }, 
        starter: "X", phase: null, 
        activeCell: null, gameActive: true, winInfo: null,
        teamMemberIndex: { X: 0, O: 0 } 
    },
    timer: { intervalId: null, deadline: 0 }
};
let state = JSON.parse(JSON.stringify(DEFAULT_STATE)); 

// --- [8] الحفظ والاستئناف (Persistence) ---
function saveStateToLocalStorage() { 
    const stateToSave = JSON.parse(JSON.stringify(state)); 
    stateToSave.timer = DEFAULT_STATE.timer; 
    stateToSave.roundState.activeCell = null; 
    stateToSave.roundState.phase = null; 
    stateToSave.roundState.teamMemberIndex = state.roundState.teamMemberIndex;
    
    if (state.match.usedCombinations) {
        stateToSave.match.usedCombinations = Array.from(state.match.usedCombinations);
    } else {
        stateToSave.match.usedCombinations = [];
    }
    
    stateToSave.roundState.board.forEach(cell => { 
        if (cell.tried instanceof Set) { cell.tried = Array.from(cell.tried); } 
        else { cell.tried = []; } 
    }); 
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
            mergedState.match.usedCombinations = loadedState.match.usedCombinations || [];
            mergedState.roundState.board.forEach(cell => { cell.tried = new Set(cell.tried || []); }); 
            mergedState.roundState.teamMemberIndex = loadedState.roundState.teamMemberIndex || DEFAULT_STATE.roundState.teamMemberIndex; 
            if (!mergedState.match.totalScore) { mergedState.match.totalScore = { X: 0, O: 0 }; } 
            state = mergedState; 
            return true; 
        } catch (e) { 
            localStorage.removeItem("ticTacCategoriesGameState"); 
            return false; 
        } 
    } 
    return false;
}
