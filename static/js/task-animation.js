// static/js/task-animation.js

// 1. REGISTRO GLOBAL DE SELECCIÓN DE CUADRANTE
window.selectedQuadrantForTask = window.selectedQuadrantForTask || {};

// 2. ANIMACIÓN FLIP CON TIMEOUT DE SEGURIDAD PARA EL MODAL
function animateTaskToQuadrant(taskId, targetQuadrantCode) {
    const card = document.getElementById(`task-card-${taskId}`);
    const targetContainer = document.querySelector(`.quadrant-container[data-quadrant="${targetQuadrantCode}"]`);

    if (!card || !targetContainer) return;

    const currentContainer = card.closest('.quadrant-container');
    if (currentContainer === targetContainer) return;

    // A. Posición Inicial (FIRST)
    const firstRect = card.getBoundingClientRect();

    // B. Mover en el DOM (LAST)
    const inlineWrapper = targetContainer.querySelector('.add-task-inline-wrapper');
    if (inlineWrapper) {
        targetContainer.insertBefore(card, inlineWrapper);
    } else {
        targetContainer.appendChild(card);
    }

    const emptyMsg = targetContainer.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.classList.add('d-none');

    card.setAttribute('data-urgency', targetQuadrantCode === 'Q1' || targetQuadrantCode === 'Q3' ? '4' : '1');
    card.setAttribute('data-importance', targetQuadrantCode === 'Q1' || targetQuadrantCode === 'Q2' ? '4' : '1');

    // C. Posición Final
    const lastRect = card.getBoundingClientRect();

    // D. Invertir posición (INVERT)
    const deltaX = firstRect.left - lastRect.left;
    const deltaY = firstRect.top - lastRect.top;

    card.style.transition = 'none';
    card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    card.classList.add('task-card-moving');

    // E. Reproducir (PLAY)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            card.style.transition = 'transform 0.45s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s ease';
            card.style.transform = 'translate(0, 0)';

            setTimeout(() => {
                card.style.transition = '';
                card.style.transform = '';
                card.classList.remove('task-card-moving');
            }, 450);
        });
    });
}

// 3. GUARDADO DESDE EL MODAL DE DETALLE
function saveTaskModal(taskId) {
    const form = document.getElementById(`editTaskForm${taskId}`);
    const modalEl = document.getElementById(`viewTaskModal${taskId}`);

    if (!form) {
        console.error(`No se encontró el formulario editTaskForm${taskId}`);
        return;
    }

    // A. Obtener el cuadrante de destino seleccionado
    let targetQuadrant = window.selectedQuadrantForTask ? window.selectedQuadrantForTask[taskId] : null;
    if (!targetQuadrant) {
        const urgencyVal = form.querySelector('input[name="urgency"]:checked')?.value || '4';
        const importanceVal = form.querySelector('input[name="importance"]:checked')?.value || '4';

        const u = parseInt(urgencyVal, 10);
        const i = parseInt(importanceVal, 10);

        if (u >= 3 && i >= 3) targetQuadrant = 'Q1';
        else if (u <= 2 && i >= 3) targetQuadrant = 'Q2';
        else if (u >= 3 && i <= 2) targetQuadrant = 'Q3';
        else targetQuadrant = 'Q4';
    }

    // B. Actualizar título en el tablero
    const titleInput = form.querySelector('textarea[name="title"]');
    const cardTitleEl = document.querySelector(`#task-card-${taskId} .task-title`);
    if (titleInput && cardTitleEl) {
        cardTitleEl.textContent = titleInput.value;
    }

    // C. Ocultar el modal de Bootstrap
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        
        modalInstance.hide();

        setTimeout(() => {
            animateTaskToQuadrant(taskId, targetQuadrant);
        }, 100);
    } else {
        animateTaskToQuadrant(taskId, targetQuadrant);
    }

    // D. Enviar datos a Django por Fetch AJAX
    const formData = new FormData(form);
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(() => {
        if (window.selectedQuadrantForTask) {
            delete window.selectedQuadrantForTask[taskId];
        }
    })
    .catch(err => console.error('Error guardando tarea:', err));
}