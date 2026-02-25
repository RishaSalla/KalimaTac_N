// --- [4.5] إدارة شرائح الإدخال (Chips) ---

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
            renderChips('X'); 
            renderChips('O'); 
            saveStateToLocalStorage();
            if (state.settings.sounds && sounds.click) sounds.click();
        }
    };
    
    chip.appendChild(removeBtn);
    return chip;
}

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
}

// ربطها بـ window لتعمل من الـ HTML (onclick)
window.handleChipInput = function(event, team, isHome_ignored, isButton = false) {
    const inputEl = isButton ? document.getElementById(`input-team-${team.toLowerCase()}-home`) : event.target;
    if (!inputEl) return; 
    
    const name = inputEl.value.trim();

    if (isButton || event.key === 'Enter' || event.type === 'blur') {
        if (event && typeof event.preventDefault === "function") event.preventDefault();
        
        if (name && state.settings.teamMembers[team].indexOf(name) === -1) {
            state.settings.teamMembers[team].push(name);
            inputEl.value = ''; 
            renderChips('X'); 
            renderChips('O'); 
            saveStateToLocalStorage();
            inputEl.focus(); 
        } else if (name) {
             inputEl.value = ''; 
        }
    }
}

// --- [4.6] إدارة شرائح الفئات (Category Chips) ---

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
            renderChipsCategories(); 
            saveStateToLocalStorage();
            if (state.settings.sounds && sounds.click) sounds.click();
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
}

// ربطها بـ window لتعمل من الـ HTML (onclick)
window.handleChipInputCategories = function(isButton = false, event = null) {
    const inputEl = $("#input-cats-home");
    if (!inputEl) return;
    const name = inputEl.value.trim();

    if (isButton || (event && (event.key === 'Enter' || event.type === 'blur'))) {
        if (event && typeof event.preventDefault === "function") event.preventDefault();
        
        if (name && state.settings.extraCats.indexOf(name) === -1 && BASE_CATEGORIES.indexOf(name) === -1) {
            state.settings.extraCats.push(name);
            inputEl.value = '';
            renderChipsCategories();
            saveStateToLocalStorage();
            inputEl.focus();
        } else if (name) {
            inputEl.value = ''; 
        }
    }
}

function advanceTeamMember(player) {
    const members = state.settings.teamMembers[player];
    if (members && members.length > 0) {
        let currentIndex = state.roundState.teamMemberIndex[player];
        currentIndex = (currentIndex + 1) % members.length;
        state.roundState.teamMemberIndex[player] = currentIndex;
    }
}
