// static/js/task-quick-options.js

// FUNCIONES PARA LAS OPCIONES AVANZADAS RÁPIDAS
function updateQuickBoardName(selectEl) {
    const selectedText = selectEl.options[selectEl.selectedIndex].text;
    const badge = document.getElementById('quickBoardSelectedName');
    if (badge) badge.textContent = selectedText.trim();
}

function updateQuickAssigneesCount() {
    const checked = document.querySelectorAll('#advancedOptions input[name="assigned_to"]:checked');
    const badge = document.getElementById('quickAssigneesCount');
    if (badge) {
        badge.textContent = checked.length > 0 ? `${checked.length}` : '+';
    }
}

function saveQuickDate() {
    const displayDate = document.getElementById('quickDisplayDate').value;
    const displayTime = document.getElementById('quickDisplayTime').value || '12:00';
    const hiddenInput = document.getElementById('quickHiddenDueDate');
    const badgeDisplay = document.getElementById('quickDateBadgeDisplay');

    if (displayDate) {
        hiddenInput.value = `${displayDate} ${displayTime}`;
        badgeDisplay.textContent = `${displayDate} ${displayTime}`;
    } else {
        hiddenInput.value = '';
        badgeDisplay.textContent = '+';
    }

    const dropdownBtn = document.getElementById('quickDropdownDate');
    if (dropdownBtn) {
        const instance = bootstrap.Dropdown.getInstance(dropdownBtn);
        if (instance) instance.hide();
    }
}

function clearQuickDate() {
    document.getElementById('quickDisplayDate').value = '';
    document.getElementById('quickHiddenDueDate').value = '';
    document.getElementById('quickDateBadgeDisplay').textContent = '+';
    
    const reminderCheck = document.getElementById('quick_reminder_enabled');
    if (reminderCheck) reminderCheck.checked = false;

    const calendarContainer = document.getElementById('quickInlineCalendar');
    if (calendarContainer && calendarContainer._flatpickr) {
        calendarContainer._flatpickr.clear();
    }

    const dropdownBtn = document.getElementById('quickDropdownDate');
    if (dropdownBtn) {
        const instance = bootstrap.Dropdown.getInstance(dropdownBtn);
        if (instance) instance.hide();
    }
}

// Inicialización del calendario Flatpickr en el Pop-over de Alta Rápida
document.addEventListener('DOMContentLoaded', function() {
    const quickDateBtn = document.getElementById('quickDropdownDate');
    if (quickDateBtn) {
        quickDateBtn.addEventListener('shown.bs.dropdown', function () {
            const calendarContainer = document.getElementById('quickInlineCalendar');
            const hiddenInput = document.getElementById('quickHiddenDueDate');
            const displayDate = document.getElementById('quickDisplayDate');
            const displayTime = document.getElementById('quickDisplayTime');

            if (calendarContainer && !calendarContainer._flatpickr) {
                const fp = flatpickr(calendarContainer, {
                    inline: true,
                    locale: 'es',
                    defaultDate: 'today',
                    dateFormat: 'Y-m-d',
                    onChange: function(selectedDates) {
                        if (selectedDates.length > 0) {
                            const dateStr = fp.formatDate(selectedDates[0], 'Y-m-d');
                            displayDate.value = dateStr;
                            hiddenInput.value = `${dateStr} ${displayTime.value || '12:00'}`;
                        }
                    }
                });

                displayDate.addEventListener('input', function() {
                    if (this.value) fp.setDate(this.value, false);
                    hiddenInput.value = this.value ? `${this.value} ${displayTime.value || '12:00'}` : '';
                });

                displayTime.addEventListener('change', function() {
                    if (displayDate.value) {
                        hiddenInput.value = `${displayDate.value} ${this.value || '12:00'}`;
                    }
                });
            }
        });
    }
});