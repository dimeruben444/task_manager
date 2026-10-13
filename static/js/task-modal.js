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

    const displayContainer = document.getElementById(`quadrantDropdownSelected${taskId}`);
    if (displayContainer) {
        displayContainer.innerHTML = `${svgIcon} <span>${labelText}</span>`;
    }

    // Marcar radio buttons de urgencia e importancia
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
  const displayTimeVal = displayTimeEl
    ? displayTimeEl.value || "12:00"
    : "12:00";

  if (displayDateVal) {
    hiddenInput.value = `${displayDateVal} ${displayTimeVal}`;
  } else {
    hiddenInput.value = "";
  }
}

function saveTaskDate(taskId) {
  const hiddenInput = document.getElementById(`hiddenDueDate${taskId}`);
  const badgeDisplay = document.getElementById(`dateBadgeDisplay${taskId}`);

  if (hiddenInput && hiddenInput.value) {
    if (badgeDisplay) badgeDisplay.textContent = hiddenInput.value;
  } else {
    if (badgeDisplay) badgeDisplay.textContent = "+";
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

  if (displayDate) displayDate.value = "";
  if (hiddenInput) hiddenInput.value = "";
  if (badgeDisplay) badgeDisplay.textContent = "+";

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

// 1. Declaración global de la animación
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

// 3. DELEGACIÓN DINÁMICA DE EVENTOS PARA APERTURA DE MODALES
document.addEventListener("show.bs.modal", function (event) {
  const modalEl = event.target;
  if (!modalEl.id || !modalEl.id.startsWith("viewTaskModal")) return;

  const titleTextarea = modalEl.querySelector(".task-title-textarea");
  if (!titleTextarea) return;

  const prevDisplay = modalEl.style.display;
  const prevVisibility = modalEl.style.visibility;

  modalEl.style.visibility = "hidden";
  modalEl.style.display = "block";

  titleTextarea.style.height = "auto";
  titleTextarea.style.height = titleTextarea.scrollHeight + "px";

  modalEl.style.display = prevDisplay;
  modalEl.style.visibility = prevVisibility;
});

document.addEventListener("shown.bs.modal", function (event) {
  const modalEl = event.target;
  if (!modalEl.id || !modalEl.id.startsWith("viewTaskModal")) return;

  const taskId = modalEl.id.replace("viewTaskModal", "");
  const calendarContainer = document.getElementById(`inlineCalendar${taskId}`);
  const hiddenInput = document.getElementById(`hiddenDueDate${taskId}`);
  const displayDate = document.getElementById(`displayDate${taskId}`);
  const displayTime = document.getElementById(`displayTime${taskId}`);

  if (
    calendarContainer &&
    !calendarContainer._flatpickr &&
    typeof flatpickr !== "undefined"
  ) {
    const initialVal =
      hiddenInput && hiddenInput.value
        ? hiddenInput.value.split(" ")[0]
        : "today";

    const fp = flatpickr(calendarContainer, {
      inline: true,
      locale: "es",
      defaultDate: initialVal,
      dateFormat: "Y-m-d",
      onChange: function (selectedDates) {
        if (selectedDates.length > 0) {
          const dateStr = fp.formatDate(selectedDates[0], "Y-m-d");
          if (displayDate) displayDate.value = dateStr;
          syncHiddenDueDate(taskId, fp);
        }
      },
    });

    if (displayDate) {
      displayDate.addEventListener("input", function () {
        if (this.value) fp.setDate(this.value, false);
        syncHiddenDueDate(taskId, fp);
      });
    }

    if (displayTime) {
      displayTime.addEventListener("change", function () {
        syncHiddenDueDate(taskId, fp);
      });
    }
  }
});

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
    const modalInstance = bootstrap.Modal.getInstance(modalEl);

    const taskCard = document.getElementById(`task-card-${taskId}`);
    const sourceContainer = taskCard ? taskCard.closest('.quadrant-container') : null;
    const currentQuadrant = sourceContainer ? sourceContainer.getAttribute('data-quadrant') : null;

    const formData = new FormData(form);

    if (modalInstance) {
        modalInstance.hide();
    }

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
            const targetQuadrantCode = data.quadrant;

            if (taskCard && data.card_html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data.card_html.trim();
                const newCard = tempDiv.firstElementChild;

                taskCard.replaceWith(newCard);

                // Si cambió de cuadrante -> Animación FLIP
                if (currentQuadrant && currentQuadrant !== targetQuadrantCode) {
                    setTimeout(() => {
                        animateTaskMove(newCard, targetQuadrantCode);
                    }, 150);
                } else if (data.date_restriction_applied) {
                    // Si se bloqueó la reubicación por fecha -> Sacudir badge
                    triggerDueDateShake(newCard);
                }
            }
        }
    })
    .catch(err => {
        console.error('Error al actualizar tarea vía AJAX:', err);
    });
}
function deleteTaskModal(taskId, deleteUrl) {
    if (!confirm('¿Seguro que quieres eliminar esta tarea?')) {
        return;
    }

    const modalEl = document.getElementById(`viewTaskModal${taskId}`);
    const modalInstance = bootstrap.Modal.getInstance(modalEl);

    // 1. Cerrar el modal primero
    if (modalInstance) {
        modalInstance.hide();
    }

    // 2. Enviar petición POST a la vista TaskDeleteView de Django
    fetch(deleteUrl, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => {
        if (response.ok) {
            // 3. Eliminar la tarjeta del DOM con una animación suave de desvanecimiento
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




// ==========================================
// FUNCIÓN DE ANIMACIÓN FLIP ENTRE CUADRANTES
// ==========================================
function animateTaskMove(taskCard, targetQuadrantCode) {
    if (!taskCard) return;

    const targetContainer = document.querySelector(`.quadrant-container[data-quadrant="${targetQuadrantCode}"]`);
    if (!targetContainer) {
        console.warn('Contenedor destino no encontrado:', targetQuadrantCode);
        window.location.reload();
        return;
    }

    // 1. FIRST: Guardar posición inicial en pantalla
    const firstRect = taskCard.getBoundingClientRect();

    // Ocultar mensaje de "No hay tareas"
    const emptyMsg = targetContainer.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.classList.add('d-none');

    const inlineWrapper = targetContainer.querySelector('.add-task-inline-wrapper');

    // 2. LAST: Mover físicamente el elemento en el DOM
    if (inlineWrapper) {
        targetContainer.insertBefore(taskCard, inlineWrapper);
    } else {
        targetContainer.appendChild(taskCard);
    }

    // Medir posición final
    const lastRect = taskCard.getBoundingClientRect();

    // 3. INVERT: Calcular distancias delta (X, Y)
    const deltaX = firstRect.left - lastRect.left;
    const deltaY = firstRect.top - lastRect.top;

    // Colocar la tarjeta de vuelta a su posición de origen visualmente sin animación
    taskCard.style.transition = 'none';
    taskCard.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    taskCard.classList.add('border', 'border-primary', 'shadow-lg');

    // Forzar un reflow para que el navegador registre la posición
    taskCard.getBoundingClientRect();

    // 4. PLAY: Animar suavemente a su posición final (0, 0)
    requestAnimationFrame(() => {
        taskCard.style.transition = 'transform 0.45s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.45s ease';
        taskCard.style.transform = 'translate(0, 0)';
    });

    // Limpiar estilos temporales tras la animación
    setTimeout(() => {
        taskCard.style.transition = '';
        taskCard.style.transform = '';
        taskCard.classList.remove('border', 'border-primary', 'shadow-lg');
    }, 500);
}

// Función para hacer sacudir el badge de fecha
function triggerDueDateShake(taskElement) {
    if (!taskElement) return;

    const dateBadge = taskElement.querySelector('.task-date-badge');

    if (dateBadge) {
        // Limpiamos clase previa y forzamos reflow
        dateBadge.classList.remove('shake-due-date');
        void dateBadge.offsetWidth; // Forzar cálculo de estilos en el navegador
        
        dateBadge.classList.add('shake-due-date');

        setTimeout(() => {
            dateBadge.classList.remove('shake-due-date');
        }, 800);
    }
}


function handleTaskDrop(taskId, targetQuadrantCode, taskCard) {
    const sourceContainer = taskCard.closest('.quadrant-container');
    const currentQuadrant = sourceContainer ? sourceContainer.getAttribute('data-quadrant') : null;

    // Crear formulario para enviar el cambio de cuadrante
    const formData = new FormData();
    
    // Asignar urgencia e importancia según el cuadrante de destino
    if (targetQuadrantCode === 'Q1') { formData.append('urgency', 4); formData.append('importance', 4); }
    else if (targetQuadrantCode === 'Q2') { formData.append('urgency', 1); formData.append('importance', 4); }
    else if (targetQuadrantCode === 'Q3') { formData.append('urgency', 4); formData.append('importance', 1); }
    else if (targetQuadrantCode === 'Q4') { formData.append('urgency', 1); formData.append('importance', 1); }

    fetch(`/tasks/${taskId}/edit/`, {  // Asegúrate de que coincida con tu URL de edición
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
            const finalQuadrant = data.quadrant;

            // Actualizar el HTML interno de la tarjeta para refrescar los datos/badges
            if (data.card_html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data.card_html.trim();
                const newCard = tempDiv.firstElementChild;
                taskCard.replaceWith(newCard);
                taskCard = newCard; // Actualizar referencia
            }

            // Si intentó mover a No Urgente (Q2/Q4) pero la fecha bloqueó el movimiento y se quedó en Urgente (Q1/Q3)
            if (currentQuadrant !== finalQuadrant) {
                // Si la vista permitió moverla, aplicamos la animación FLIP
                animateTaskMove(taskCard, finalQuadrant);
            } else {
                // Si la fecha u otra restricción devolvió la tarea al cuadrante original
                triggerDueDateShake(taskCard);
            }
        }
    })
    .catch(err => {
        console.error('Error al mover la tarjeta mediante arrastre:', err);
    });
}