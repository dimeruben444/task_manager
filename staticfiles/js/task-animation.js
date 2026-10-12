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

// 4. MANEJO DE LA ANIMACIÓN DE LA ESFERA AL MARCAR TAREA COMPLETADA
document.addEventListener('change', function (e) {
    if (e.target && e.target.classList.contains('task-completion-check')) {
        const checkbox = e.target;
        const taskId = checkbox.dataset.taskId;
        const isCompleted = checkbox.checked;

        if (!taskId) return;

        if (isCompleted) {
            const card = checkbox.closest('.task-card');
            const targetContainer = document.getElementById('completed-tasks-container');

            if (card && targetContainer) {
                card.classList.add('task-completing');

                // 1. Coordenadas exactas en viewport
                const rect = checkbox.getBoundingClientRect();
                const startX = rect.left + rect.width / 2;
                const startY = rect.top + rect.height / 2;

                const targetRect = targetContainer.getBoundingClientRect();
                const endX = targetRect.left + 50;
                const endY = targetRect.top + 100;

                // 2. Vértice del ángulo
                const peakY = Math.max(80, Math.min(startY - 140, window.innerHeight * 0.15));
                const peakX = startX + ((endX - startX) * 0.18);

                // 3. Confetti en el origen
                if (typeof confetti === 'function') {
                    confetti({
                        particleCount: 22,
                        spread: 50,
                        origin: { x: startX / window.innerWidth, y: startY / window.innerHeight },
                        colors: ['#10B981', '#3B82F6', '#F59E0B'],
                        disableForReducedMotion: true
                    });
                }

                // 4. Crear esfera en el DOM
                const particle = document.createElement('div');
                particle.className = 'flying-particle';
                particle.style.position = 'fixed';
                particle.style.zIndex = '999999';
                particle.style.width = '28px';
                particle.style.height = '28px';
                particle.style.borderRadius = '50%';
                particle.style.background = 'radial-gradient(circle, #ffffff 15%, #10B981 70%, #059669 100%)';
                particle.style.boxShadow = '0 0 18px rgba(16, 185, 129, 0.95), 0 0 35px rgba(16, 185, 129, 0.7)';
                particle.style.pointerEvents = 'none';
                particle.style.left = `${startX}px`;
                particle.style.top = `${startY}px`;
                particle.style.opacity = '1';
                particle.style.transform = 'translate(-50%, -50%) scale(1)';

                document.body.appendChild(particle);

                // 5. Duraciones de tramos
                const tSubida = 420;
                const tPausa = 90;
                const tCaida = 600;
                const tTotal = tSubida + tPausa + tCaida;

                const startTime = performance.now();

                function renderFlight(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / tTotal, 1);

                    let currentX, currentY, currentScale, currentOpacity = 1;

                    // Tramo A: Recta de subida empinada
                    if (elapsed < tSubida) {
                        const segmentProgress = elapsed / tSubida;
                        currentX = startX + (peakX - startX) * segmentProgress;
                        currentY = startY + (peakY - startY) * segmentProgress;
                        currentScale = 1 + (1.35 - 1) * segmentProgress;
                    } 
                    // Tramo B: Quiebre y micro-pausa en el vértice
                    else if (elapsed < tSubida + tPausa) {
                        currentX = peakX;
                        currentY = peakY;
                        currentScale = 1.35;
                    } 
                    // Tramo C: Desplazamiento a la derecha y llegada
                    else {
                        const segmentProgress = (elapsed - (tSubida + tPausa)) / tCaida;
                        currentX = peakX + (endX - peakX) * segmentProgress;
                        currentY = peakY + (endY - peakY) * segmentProgress;
                        currentScale = 1.35 + (0.4 - 1.35) * segmentProgress;

                        if (segmentProgress > 0.88) {
                            currentOpacity = 1 - (segmentProgress - 0.88) * 8.3;
                        }
                    }

                    particle.style.left = `${currentX}px`;
                    particle.style.top = `${currentY}px`;
                    particle.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
                    particle.style.opacity = currentOpacity;

                    if (progress < 1) {
                        requestAnimationFrame(renderFlight);
                    } else {
                        particle.remove();
                        if (typeof sendToggleRequest === 'function') {
                            sendToggleRequest(taskId, isCompleted, checkbox);
                        }
                    }
                }

                requestAnimationFrame(renderFlight);
                return;
            }
        }

        if (typeof sendToggleRequest === 'function') {
            sendToggleRequest(taskId, isCompleted, checkbox);
        }
    }
});