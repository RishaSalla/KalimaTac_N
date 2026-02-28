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
