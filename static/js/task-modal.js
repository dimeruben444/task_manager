// static/js/task-modal.js

// 1. DECLARACIÓN ÚNICA Y GLOBAL DE LA ANIMACIÓN DE SHAKE
window.triggerDueDateShake = function(taskElement) {
    if (!taskElement) return;

    const dateBadge = taskElement.querySelector('.task-date-badge');

    if (dateBadge) {
        dateBadge.style.display = 'inline-flex';
        
        dateBadge.classList.remove('shake-due-date');
        void dateBadge.offsetWidth; // Forzar reflow
        
        dateBadge.classList.add('shake-due-date');

        setTimeout(() => {
            dateBadge.classList.remove('shake-due-date');
        }, 800);
    }
};

// 2. FUNCIÓN DE SELECCIÓN DE CUADRANTE EN EL MODAL
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

    const displayContainer = document.getElementById(`quadrantDropdownSelected${taskId}`);
    if (displayContainer) {
        displayContainer.innerHTML = `${svgIcon} <span>${labelText}</span>`;
    }

    const urgencyRadio = document.getElementById(`detail-urgency-${urgency}-${taskId}`);
    const importanceRadio = document.getElementById(`detail-importance-${importance}-${taskId}`);

    if (urgencyRadio) urgencyRadio.checked = true;
    if (importanceRadio) importanceRadio.checked = true;
}

// 3. FUNCIONES AUXILIARES PARA EL DROPDOWN DE FECHAS EN MODALES
function syncHiddenDueDate(taskId) {
  const displayDate = document.getElementById(`displayDate${taskId}`);
  const displayTime = document.getElementById(`displayTime${taskId}`);
  const hiddenInput = document.getElementById(`hiddenDueDate${taskId}`);

  if (hiddenInput && displayDate) {
    if (displayDate.value.trim() !== "") {
      const timeVal = displayTime && displayTime.value ? displayTime.value : "12:00";
      hiddenInput.value = `${displayDate.value.trim()} ${timeVal}`;
    } else {
      hiddenInput.value = "";
    }
  }
}

function prepareDateDropdown(taskId) {
  const calendarContainer = document.getElementById(`inlineCalendar${taskId}`);
  const hiddenInput = document.getElementById(`hiddenDueDate${taskId}`);
  const displayDate = document.getElementById(`displayDate${taskId}`);
  const displayTime = document.getElementById(`displayTime${taskId}`);

  if (!calendarContainer || typeof flatpickr === "undefined") return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const hasExistingDate = hiddenInput && hiddenInput.value.trim() !== "";
  const initialVal = hasExistingDate ? hiddenInput.value.split(" ")[0] : tomorrowStr;

  if (!calendarContainer._flatpickr) {
    const fp = flatpickr(calendarContainer, {
      inline: true,
      locale: "es",
      defaultDate: initialVal,
      dateFormat: "Y-m-d",
      onChange: function (selectedDates) {
        if (selectedDates.length > 0) {
          const dateStr = fp.formatDate(selectedDates[0], "Y-m-d");
          if (displayDate) displayDate.value = dateStr;
          syncHiddenDueDate(taskId);
        }
      },
    });

    if (displayDate) {
      displayDate.addEventListener("input", function () {
        if (this.value) fp.setDate(this.value, false);
        syncHiddenDueDate(taskId);
      });
    }

    if (displayTime) {
      displayTime.addEventListener("change", function () {
        if (displayDate && displayDate.value) {
          syncHiddenDueDate(taskId);
        }
      });
    }
  } else {
    const fp = calendarContainer._flatpickr;
    fp.setDate(initialVal, false);
  }

  if (!hasExistingDate && displayDate) {
    displayDate.value = tomorrowStr;
  }
}

function removeTaskDate(taskId) {
  const hiddenInput = document.getElementById(`hiddenDueDate${taskId}`);
  const displayDate = document.getElementById(`displayDate${taskId}`);
  const dateBadgeDisplay = document.getElementById(`dateBadgeDisplay${taskId}`);

  if (hiddenInput) hiddenInput.value = "";
  if (displayDate) displayDate.value = "";
  if (dateBadgeDisplay) dateBadgeDisplay.textContent = "+";

  const dropdownBtn = document.getElementById(`dropdownDate${taskId}`);
  if (dropdownBtn && typeof bootstrap !== "undefined") {
    const bsDropdown = bootstrap.Dropdown.getInstance(dropdownBtn);
    if (bsDropdown) bsDropdown.hide();
  }

  saveTaskModal(taskId);
}

// 4. FUNCIONES AUXILIARES PARA EL DROPDOWN SUPERIOR RÁPIDO (CREAR TAREA)
function syncQuickHiddenDueDate() {
  const displayDate = document.getElementById("quickDisplayDate");
  const displayTime = document.getElementById("quickDisplayTime");
  const hiddenInput = document.getElementById("quickHiddenDueDate");

  if (hiddenInput && displayDate) {
    if (displayDate.value.trim() !== "") {
      const timeVal = displayTime && displayTime.value ? displayTime.value : "12:00";
      hiddenInput.value = `${displayDate.value.trim()} ${timeVal}`;
    } else {
      hiddenInput.value = "";
    }
  }
}

function prepareQuickDateDropdown() {
  const calendarContainer = document.getElementById("quickInlineCalendar");
  const hiddenInput = document.getElementById("quickHiddenDueDate");
  const displayDate = document.getElementById("quickDisplayDate");
  const displayTime = document.getElementById("quickDisplayTime");

  if (!calendarContainer || typeof flatpickr === "undefined") return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const hasExistingDate = hiddenInput && hiddenInput.value.trim() !== "";
  const initialVal = hasExistingDate ? hiddenInput.value.split(" ")[0] : tomorrowStr;

  if (!calendarContainer._flatpickr) {
    const fp = flatpickr(calendarContainer, {
      inline: true,
      locale: "es",
      defaultDate: initialVal,
      dateFormat: "Y-m-d",
      onChange: function (selectedDates) {
        if (selectedDates.length > 0) {
          const dateStr = fp.formatDate(selectedDates[0], "Y-m-d");
          if (displayDate) displayDate.value = dateStr;
          syncQuickHiddenDueDate();
        }
      },
    });

    if (displayDate) {
      displayDate.addEventListener("input", function () {
        if (this.value) fp.setDate(this.value, false);
        syncQuickHiddenDueDate();
      });
    }

    if (displayTime) {
      displayTime.addEventListener("change", function () {
        if (displayDate && displayDate.value) {
          syncQuickHiddenDueDate();
        }
      });
    }
  } else {
    const fp = calendarContainer._flatpickr;
    fp.setDate(initialVal, false);
  }

  if (!hasExistingDate && displayDate) {
    displayDate.value = tomorrowStr;
  }
}

function saveQuickDate() {
  const displayDate = document.getElementById("quickDisplayDate");
  const hiddenInput = document.getElementById("quickHiddenDueDate");
  const badgeDisplay = document.getElementById("quickDateBadgeDisplay");

  if (displayDate && displayDate.value) {
    syncQuickHiddenDueDate();
  }

  if (hiddenInput && hiddenInput.value) {
    const parts = hiddenInput.value.split(" ");
    const dateParts = parts[0].split("-");
    if (dateParts.length === 3) {
      const timePart = parts[1] || "12:00";
      if (badgeDisplay) badgeDisplay.textContent = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${timePart}`;
    }
  } else {
    if (badgeDisplay) badgeDisplay.textContent = "+";
  }

  const dropdownBtn = document.getElementById("quickDropdownDate");
  if (dropdownBtn && typeof bootstrap !== "undefined") {
    const instance = bootstrap.Dropdown.getInstance(dropdownBtn);
    if (instance) instance.hide();
  }
}

function clearQuickDate() {
  const hiddenInput = document.getElementById("quickHiddenDueDate");
  const displayDate = document.getElementById("quickDisplayDate");
  const badgeDisplay = document.getElementById("quickDateBadgeDisplay");
  const calendarContainer = document.getElementById("quickInlineCalendar");

  if (hiddenInput) hiddenInput.value = "";
  if (displayDate) displayDate.value = "";
  if (badgeDisplay) badgeDisplay.textContent = "+";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  if (calendarContainer && calendarContainer._flatpickr) {
    calendarContainer._flatpickr.setDate(tomorrowStr, false);
    if (displayDate) displayDate.value = tomorrowStr;
  }

  const dropdownBtn = document.getElementById("quickDropdownDate");
  if (dropdownBtn && typeof bootstrap !== "undefined") {
    const instance = bootstrap.Dropdown.getInstance(dropdownBtn);
    if (instance) instance.hide();
  }
}

// 5. INICIALIZACIÓN DE MODALES Y DROPDOWNS

// A. Al abrir el modal principal de la tarea
document.addEventListener("shown.bs.modal", function (event) {
  const modalEl = event.target;
  if (!modalEl.id || !modalEl.id.startsWith("viewTaskModal")) return;

  const taskId = modalEl.id.replace("viewTaskModal", "");
  const hiddenInput = document.getElementById(`hiddenDueDate${taskId}`);
  const dateBadgeDisplay = document.getElementById(`dateBadgeDisplay${taskId}`);

  if (dateBadgeDisplay && hiddenInput) {
    if (hiddenInput.value.trim() !== "") {
      const parts = hiddenInput.value.split(" ");
      const dateParts = parts[0].split("-");
      if (dateParts.length === 3) {
        const timePart = parts[1] || "12:00";
        dateBadgeDisplay.textContent = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${timePart}`;
      }
    } else {
      dateBadgeDisplay.textContent = "+";
    }
  }
});

// B. Al abrir desplegables de fecha (Modal y Creación Rápida)
document.addEventListener("show.bs.dropdown", function (event) {
  const dropdownToggle = event.target;
  if (!dropdownToggle || !dropdownToggle.id) return;

  // Formulario superior de creación rápida
  if (dropdownToggle.id === "quickDropdownDate") {
    prepareQuickDateDropdown();

    const hiddenInput = document.getElementById("quickHiddenDueDate");
    if (hiddenInput && hiddenInput.value.trim() === "") {
      syncQuickHiddenDueDate();
    }
  }

  // Modales de tareas existentes
  if (dropdownToggle.id.startsWith("dropdownDate") && dropdownToggle.id !== "quickDropdownDate") {
    const taskId = dropdownToggle.id.replace("dropdownDate", "");
    prepareDateDropdown(taskId);

    const hiddenInput = document.getElementById(`hiddenDueDate${taskId}`);
    if (hiddenInput && hiddenInput.value.trim() === "") {
      syncHiddenDueDate(taskId);
    }
  }
});

// 6. GUARDAR TAREA CON ANIMACIÓN DE VIAJE (FLIP) Y SACUDIDA
function saveTaskModal(taskId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const form = document.getElementById(`editTaskForm${taskId}`);
    if (!form) return;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const modalEl = document.getElementById(`viewTaskModal${taskId}`);
    const taskCard = document.getElementById(`task-card-${taskId}`);
    const sourceContainer = taskCard ? taskCard.closest('.quadrant-container') : null;
    const currentQuadrant = sourceContainer ? sourceContainer.getAttribute('data-quadrant') : null;

    const formData = new FormData(form);

    fetch(form.action, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const dateBadgeDisplay = document.getElementById(`dateBadgeDisplay${taskId}`);
            if (dateBadgeDisplay && data.due_date_formatted) {
                dateBadgeDisplay.textContent = data.due_date_formatted;
            }

            const applyCardUpdates = () => {
                if (taskCard && data.card_html) {
                    const firstRect = taskCard.getBoundingClientRect();

                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = data.card_html.trim();
                    const newCard = tempDiv.firstElementChild;

                    taskCard.replaceWith(newCard);

                    const targetContainer = document.querySelector(`.quadrant-container[data-quadrant="${data.quadrant}"]`);

                    if (currentQuadrant && currentQuadrant !== data.quadrant && targetContainer) {
                        const inlineWrapper = targetContainer.querySelector('.add-task-inline-wrapper');
                        if (inlineWrapper) {
                            targetContainer.insertBefore(newCard, inlineWrapper);
                        } else {
                            targetContainer.appendChild(newCard);
                        }

                        const lastRect = newCard.getBoundingClientRect();
                        const deltaX = firstRect.left - lastRect.left;
                        const deltaY = firstRect.top - lastRect.top;

                        newCard.style.transition = 'none';
                        newCard.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                        newCard.style.zIndex = '1000';

                        void newCard.offsetWidth;

                        newCard.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.8s ease';
                        newCard.style.transform = 'translate(0, 0)';

                        newCard.addEventListener('transitionend', function handler() {
                            newCard.style.transition = '';
                            newCard.style.transform = '';
                            newCard.style.zIndex = '';
                            
                            if (data.date_restriction_applied) {
                                window.triggerDueDateShake(newCard);
                            }
                            newCard.removeEventListener('transitionend', handler);
                        });
                    } else {
                        if (data.date_restriction_applied) {
                            setTimeout(() => {
                                window.triggerDueDateShake(newCard);
                            }, 150);
                        }
                    }
                }
            };

            if (modalEl && typeof bootstrap !== 'undefined') {
                const bsModal = bootstrap.Modal.getInstance(modalEl);
                if (bsModal && modalEl.classList.contains('show')) {
                    modalEl.addEventListener('hidden.bs.modal', function handler() {
                        applyCardUpdates();
                        modalEl.removeEventListener('hidden.bs.modal', handler);
                    });
                    bsModal.hide();
                } else {
                    applyCardUpdates();
                }
            } else {
                applyCardUpdates();
            }
        }
    })
    .catch(err => {
        console.error('Error al actualizar la tarea vía AJAX:', err);
    });
}

// 7. FUNCIÓN BORRAR TAREA DESDE EL MODAL
function deleteTaskModal(taskId, deleteUrl) {
    if (!confirm('¿Seguro que quieres eliminar esta tarea?')) {
        return;
    }

    const modalEl = document.getElementById(`viewTaskModal${taskId}`);
    const modalInstance = bootstrap.Modal.getInstance(modalEl);

    if (modalInstance) {
        modalInstance.hide();
    }

    fetch(deleteUrl, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => {
        if (response.ok) {
            const taskCard = document.getElementById(`task-card-${taskId}`);
            if (taskCard) {
                taskCard.style.transition = 'all 0.3s ease';
                taskCard.style.opacity = '0';
                taskCard.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    taskCard.remove();
                }, 300);
            }
        } else {
            console.error('Error al eliminar la tarea');
            window.location.reload();
        }
    })
    .catch(err => {
        console.error('Error AJAX al borrar:', err);
        window.location.reload();
    });
}


// SELECCIÓN DIRECTA DE TABLERO EN DESPLEGABLES
function selectBoardOption(boardId, boardName, targetSuffix, boardColor) {
  // 1. Asignar el ID al input oculto
  const hiddenInput = document.getElementById(`hiddenBoardId${targetSuffix}`);
  if (hiddenInput) {
    hiddenInput.value = boardId;
  }

  // 2. Actualizar el texto del botón
  const badgeDisplay = document.getElementById(`boardBadgeDisplay${targetSuffix}`);
  if (badgeDisplay) {
    badgeDisplay.textContent = boardName;
  }

  // 3. Actualizar el DEGRADADO del icono bi-grid-fill al instante
  const iconDisplay = document.getElementById(`boardBadgeIcon${targetSuffix}`);
  if (iconDisplay) {
    if (boardColor && boardColor.trim() !== '') {
      // Degradado intenso para tableros con color propio (35% base + color-mix claro al final)
      iconDisplay.style.background = `linear-gradient(135deg, ${boardColor} 0%, ${boardColor} 35%, color-mix(in srgb, ${boardColor} 10%, white) 100%)`;
    } else {
      // Degradado azul/morado por defecto (General)
      iconDisplay.style.background = 'linear-gradient(135deg, #4f52f8 0%, #4f52f8 35%, #42C6F6 100%)';
    }
    iconDisplay.style.webkitBackgroundClip = 'text';
    iconDisplay.style.webkitTextFillColor = 'transparent';
    iconDisplay.style.setProperty('color', 'transparent', 'important');
  }

  // 4. Cerrar el desplegable
  const dropdownBtn = document.getElementById(`dropdownBoard${targetSuffix}`);
  if (dropdownBtn && typeof bootstrap !== "undefined") {
    const bsDropdown = bootstrap.Dropdown.getInstance(dropdownBtn);
    if (bsDropdown) {
      bsDropdown.hide();
    }
  }
}

function toggleMemberRow(checkboxEl) {
  const labelEl = document.querySelector(`label[for="${checkboxEl.id}"]`);
  if (!labelEl) return;

  const indicatorEl = labelEl.querySelector('.member-check-indicator');
  const taskId = checkboxEl.getAttribute('data-task-id');
  const userId = checkboxEl.getAttribute('data-user-id');
  const username = checkboxEl.getAttribute('data-username');
  const initials = checkboxEl.getAttribute('data-initials');

  if (checkboxEl.checked) {
    labelEl.style.backgroundColor = '#e5e7eb';
    if (indicatorEl) {
      indicatorEl.style.borderColor = '#0d6efd';
      indicatorEl.style.backgroundColor = '#0d6efd';
      indicatorEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="12px" viewBox="0 -960 960 960" width="12px" fill="#ffffff"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;
    }
  } else {
    labelEl.style.backgroundColor = 'transparent';
    if (indicatorEl) {
      indicatorEl.style.borderColor = '#d1d5db';
      indicatorEl.style.backgroundColor = '#ffffff';
      indicatorEl.innerHTML = '';
    }
  }

  // CASO A: ALTA RÁPIDA (Quick)
  if (taskId === 'Quick') {
    const checkedQuick = document.querySelectorAll('input[name="assigned_to"][data-task-id="Quick"]:checked');
    const counterEl = document.getElementById('quickAssigneesCounter');
    if (counterEl) {
      counterEl.textContent = checkedQuick.length > 0 ? `${checkedQuick.length} seleccionados` : '+';
    }
    return;
  }

  // CASO B: MODAL DE TAREA EXISTENTE
  const container = document.getElementById(`assignedBadgesContainer${taskId}`);
  if (checkboxEl.checked) {
    if (container && !document.getElementById(`badge-user-${taskId}-${userId}`)) {
      const badgeDiv = document.createElement('div');
      badgeDiv.id = `badge-user-${taskId}-${userId}`;
      badgeDiv.className = 'd-flex align-items-center gap-2 bg-white pe-2 rounded-pill border shadow-sm';
      badgeDiv.innerHTML = `
        <div class="rounded-circle bg-info text-dark fw-bold d-flex align-items-center justify-content-center flex-shrink-0" style="width: 28px; height: 28px; font-size: 0.75rem;" title="${username}">
            ${initials}
        </div>
        <span class="small text-dark fw-semibold" style="font-size: 0.8rem;">${username}</span>
      `;
      container.appendChild(badgeDiv);
    }
  } else {
    const existingBadge = document.getElementById(`badge-user-${taskId}-${userId}`);
    if (existingBadge) {
      existingBadge.remove();
    }
  }

  // Sincronización en vivo de la tarjeta del tablero
  const taskCard = document.getElementById(`task-card-${taskId}`);
  if (taskCard) {
    const checkedBoxes = document.querySelectorAll(`input[name="assigned_to"][data-task-id="${taskId}"]:checked`);
    const totalCount = checkedBoxes.length;
    let badgeWrapper = taskCard.querySelector('.ms-auto.d-flex.align-items-center');

    if (badgeWrapper) {
      if (totalCount === 0) {
        badgeWrapper.innerHTML = '';
      } else {
        const firstUserInitials = checkedBoxes[0].getAttribute('data-initials') || '';
        const firstUsername = checkedBoxes[0].getAttribute('data-username') || '';
        let extraBadge = totalCount > 1 ? `<span class="badge bg-dark text-white rounded-pill ms-1 d-inline-flex align-items-center justify-content-center px-1.5 py-0.5" style="font-size: 0.6rem; font-weight: 700; line-height: 1;">+${totalCount - 1}</span>` : '';

        badgeWrapper.innerHTML = `
          <div class="position-relative d-inline-flex align-items-center">
              <span class="badge bg-danger text-white rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm p-0" style="width: 22px; height: 22px; font-size: 0.65rem; font-weight: bold;" title="${firstUsername}">
                  ${firstUserInitials}
              </span>
              ${extraBadge}
          </div>
        `;
      }
    }
  }
}


function updateDistributionCounts() {
  const getCount = (id) => {
    const container = document.getElementById(id);
    return container ? container.querySelectorAll('.task-card').length : 0;
  };

  const q1 = getCount('q1-container'); // O el ID que tengas para Q1
  const q2 = getCount('q2-container');
  const q3 = getCount('q3-container');
  const q4 = getCount('q4-container');

  const elQ1 = document.getElementById('sidebar-q1-count');
  const elQ2 = document.getElementById('sidebar-q2-count');
  const elQ3 = document.getElementById('sidebar-q3-count');
  const elQ4 = document.getElementById('sidebar-q4-count');

  if (elQ1) elQ1.textContent = `${q1} ${q1 === 1 ? 'tarea' : 'tareas'}`;
  if (elQ2) elQ2.textContent = `${q2} ${q2 === 1 ? 'tarea' : 'tareas'}`;
  if (elQ3) elQ3.textContent = `${q3} ${q3 === 1 ? 'tarea' : 'tareas'}`;
  if (elQ4) elQ4.textContent = `${q4} ${q4 === 1 ? 'tarea' : 'tareas'}`;
}

