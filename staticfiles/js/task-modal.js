// static/js/task-modal.js

// 1. FUNCIÓN GLOBAL DE SELECCIÓN DE CUADRANTE EN EL MODAL
function selectQuadrant(quadrantCode, taskId, labelText) {
    let urgency = 4, importance = 4;
    let svgIcon = '';

    if (quadrantCode === 'Q1') {
        urgency = 4; importance = 4;
        svgIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>`;
    } else if (quadrantCode === 'Q2') {
        urgency = 1; importance = 4;
        svgIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>`;
    } else if (quadrantCode === 'Q3') {
        urgency = 4; importance = 1;
        svgIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>`;
    } else if (quadrantCode === 'Q4') {
        urgency = 1; importance = 1;
        svgIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/></svg>`;
    }

    window.selectedQuadrantForTask = window.selectedQuadrantForTask || {};
    window.selectedQuadrantForTask[taskId] = quadrantCode;

    const displayContainer = document.getElementById(`quadrantDropdownSelected${taskId}`);
    if (displayContainer) {
        displayContainer.innerHTML = `${svgIcon} <span>${labelText}</span>`;
    }

    const urgencyRadio = document.getElementById(`detail-urgency-${urgency}-${taskId}`);
    const importanceRadio = document.getElementById(`detail-importance-${importance}-${taskId}`);

    if (urgencyRadio) urgencyRadio.checked = true;
    if (importanceRadio) importanceRadio.checked = true;
}

// 2. SINCRONIZACIÓN Y EDICIÓN DE FECHAS EN EL MODAL
function syncHiddenDueDate(taskId, fpInstance) {
    const displayDateEl = document.getElementById(`displayDate${taskId}`);
    const displayTimeEl = document.getElementById(`displayTime${taskId}`);
    const hiddenInput = document.getElementById(`hiddenDueDate${taskId}`);

    if (!displayDateEl || !hiddenInput) return;

    const displayDateVal = displayDateEl.value;
    const displayTimeVal = displayTimeEl ? displayTimeEl.value || '12:00' : '12:00';

    if (displayDateVal) {
        hiddenInput.value = `${displayDateVal} ${displayTimeVal}`;
    } else {
        hiddenInput.value = '';
    }
}

function saveTaskDate(taskId) {
    const hiddenInput = document.getElementById(`hiddenDueDate${taskId}`);
    const badgeDisplay = document.getElementById(`dateBadgeDisplay${taskId}`);

    if (hiddenInput && hiddenInput.value) {
        if (badgeDisplay) badgeDisplay.textContent = hiddenInput.value;
    } else {
        if (badgeDisplay) badgeDisplay.textContent = '+';
    }

    const dropdownBtn = document.getElementById(`dropdownDate${taskId}`);
    if (dropdownBtn) {
        const instance = bootstrap.Dropdown.getInstance(dropdownBtn);
        if (instance) instance.hide();
    }
}

function clearTaskDate(taskId) {
    const displayDate = document.getElementById(`displayDate${taskId}`);
    const hiddenInput = document.getElementById(`hiddenDueDate${taskId}`);
    const badgeDisplay = document.getElementById(`dateBadgeDisplay${taskId}`);

    if (displayDate) displayDate.value = '';
    if (hiddenInput) hiddenInput.value = '';
    if (badgeDisplay) badgeDisplay.textContent = '+';

    const calendarContainer = document.getElementById(`inlineCalendar${taskId}`);
    if (calendarContainer && calendarContainer._flatpickr) {
        calendarContainer._flatpickr.clear();
    }

    const dropdownBtn = document.getElementById(`dropdownDate${taskId}`);
    if (dropdownBtn) {
        const instance = bootstrap.Dropdown.getInstance(dropdownBtn);
        if (instance) instance.hide();
    }
}

// 3. DELEGACIÓN DINÁMICA DE EVENTOS PARA APERTURA DE MODALES
document.addEventListener('show.bs.modal', function (event) {
    const modalEl = event.target;
    if (!modalEl.id || !modalEl.id.startsWith('viewTaskModal')) return;

    const titleTextarea = modalEl.querySelector('.task-title-textarea');
    if (!titleTextarea) return;

    const prevDisplay = modalEl.style.display;
    const prevVisibility = modalEl.style.visibility;

    modalEl.style.visibility = 'hidden';
    modalEl.style.display = 'block';

    titleTextarea.style.height = 'auto';
    titleTextarea.style.height = titleTextarea.scrollHeight + 'px';

    modalEl.style.display = prevDisplay;
    modalEl.style.visibility = prevVisibility;
});

document.addEventListener('shown.bs.modal', function (event) {
    const modalEl = event.target;
    if (!modalEl.id || !modalEl.id.startsWith('viewTaskModal')) return;

    const taskId = modalEl.id.replace('viewTaskModal', '');
    const calendarContainer = document.getElementById(`inlineCalendar${taskId}`);
    const hiddenInput = document.getElementById(`hiddenDueDate${taskId}`);
    const displayDate = document.getElementById(`displayDate${taskId}`);
    const displayTime = document.getElementById(`displayTime${taskId}`);

    if (calendarContainer && !calendarContainer._flatpickr && typeof flatpickr !== 'undefined') {
        const initialVal = hiddenInput && hiddenInput.value ? hiddenInput.value.split(' ')[0] : 'today';

        const fp = flatpickr(calendarContainer, {
            inline: true,
            locale: 'es',
            defaultDate: initialVal,
            dateFormat: 'Y-m-d',
            onChange: function (selectedDates) {
                if (selectedDates.length > 0) {
                    const dateStr = fp.formatDate(selectedDates[0], 'Y-m-d');
                    if (displayDate) displayDate.value = dateStr;
                    syncHiddenDueDate(taskId, fp);
                }
            }
        });

        if (displayDate) {
            displayDate.addEventListener('input', function () {
                if (this.value) fp.setDate(this.value, false);
                syncHiddenDueDate(taskId, fp);
            });
        }

        if (displayTime) {
            displayTime.addEventListener('change', function () {
                syncHiddenDueDate(taskId, fp);
            });
        }
    }
});