// Configuración exacta para cada nivel numérico (1 al 4) en Urgencia
const urgencyConfig = {
    4: { text: 'Crítica (4/4)', color: '#dc2626' },   // Rojo para Crítica
    3: { text: 'Alta (3/4)', color: '#dc2626' },      // Rojo para Alta
    2: { text: 'Moderada (2/4)', color: '#fbbf24' },  // Morado para Moderada
    1: { text: 'Baja (1/4)', color: '#fbbf24' }       // Amarillo para Baja
};

// Configuración exacta para cada nivel numérico (1 al 4) en Importancia
const importanceConfig = {
    4: { text: 'Crítica (4/4)', color: '#6466F1' },   // Morado para Crítica
    3: { text: 'Alta (3/4)', color: '#6466F1' },      // Morado para Alta
    2: { text: 'Moderada (2/4)', color: '#41c6f6' },  // Azul para Moderada
    1: { text: 'Baja (1/4)', color: '#41c6f6' }       // Azul para Baja
};

function updateLabel(type, value) {
    // Seleccionamos estrictamente el sublabel (el span de texto superior)
    const labelEl = document.getElementById(type === 'urgency' ? 'urgencyLabelQuick' : 'importanceLabelQuick');
    if (!labelEl) return;

    const config = type === 'urgency' ? urgencyConfig : importanceConfig;
    if (value && config[value]) {
        labelEl.textContent = config[value].text;
        labelEl.style.setProperty('color', config[value].color, 'important'); // Forzamos el color exacto
    } else {
        labelEl.innerHTML = '&nbsp;';
        labelEl.style.removeProperty('color');
    }
}

function resetLabel(type) {
    const form = document.getElementById('quickTaskForm');
    if (!form) return;
    const checked = form.querySelector(`input[name="${type}"]:checked`);
    updateLabel(type, checked ? checked.value : null);
}

// CÁLCULO DINÁMICO DEL DESTINO PREVISTO Y GESTIÓN DE ETIQUETAS
function updateQuickTargetQuadrantDisplay() {
    const targetEl = document.getElementById('quickTaskTargetQuadrant');
    const quickForm = document.getElementById('quickTaskForm');
    if (!quickForm) return;

    const selectedUrgency = quickForm.querySelector('input[name="urgency"]:checked');
    const selectedImportance = quickForm.querySelector('input[name="importance"]:checked');

    // Refrescar los textos y colores en sus respectivos span superiores
    updateLabel('urgency', selectedUrgency ? selectedUrgency.value : null);
    updateLabel('importance', selectedImportance ? selectedImportance.value : null);

    if (!targetEl) return;

    // Si falta alguno de los dos, forzar "-"
    if (!selectedUrgency || !selectedImportance) {
        targetEl.textContent = '-';
        targetEl.className = 'fw-bold text-secondary';
        return;
    }

    const urgencyVal = parseInt(selectedUrgency.value, 10);
    const importanceVal = parseInt(selectedImportance.value, 10);

    if (isNaN(urgencyVal) || isNaN(importanceVal) || urgencyVal <= 0 || importanceVal <= 0) {
        targetEl.textContent = '-';
        targetEl.className = 'fw-bold text-secondary';
        return;
    }

    const isUrgent = urgencyVal >= 3;
    const isImportant = importanceVal >= 3;

    if (isUrgent && isImportant) {
        targetEl.textContent = 'Q1 (Hacer ahora)';
        targetEl.className = 'fw-bold text-danger';
    } else if (!isUrgent && isImportant) {
        targetEl.textContent = 'Q2 (Planificar)';
        targetEl.className = 'fw-bold text-primary';
    } else if (isUrgent && !isImportant) {
        targetEl.textContent = 'Q3 (Delegar)';
        targetEl.className = 'fw-bold text-warning';
    } else {
        targetEl.textContent = 'Q4 (Eliminar)';
        targetEl.className = 'fw-bold text-secondary';
    }
}

// Inicializar eventos de Hover y selección en las estrellas
document.addEventListener('DOMContentLoaded', () => {
    ['urgency', 'importance'].forEach(type => {
        const inputs = document.querySelectorAll(`input[name="${type}"]`);
        inputs.forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                // Al pasar el ratón por encima (hover)
                label.addEventListener('mouseenter', () => {
                    updateLabel(type, input.value);
                });

                // Al hacer clic directamente en la etiqueta de la estrella
                label.addEventListener('click', () => {
                    input.checked = true;
                    // Al seleccionar una estrella, quitamos el estado de error de su contenedor si lo tenía
                    const container = label.closest('.star-rating');
                    if (container) container.classList.remove('is-invalid');

                    updateLabel(type, input.value);
                    updateQuickTargetQuadrantDisplay();
                });

                // Al salir el ratón del contenedor, recupera el valor seleccionado (si lo hay)
                const starRatingContainer = label.closest('.star-rating');
                if (starRatingContainer) {
                    starRatingContainer.addEventListener('mouseleave', () => {
                        resetLabel(type);
                    });
                }
            }

            // Cambios de estado en el input oculto
            input.addEventListener('change', () => {
                updateQuickTargetQuadrantDisplay();
            });
        });
    });

    // =========================================================
    // VALIDACIÓN Y SACUDIDA DE ESTRELLAS AL ENVIAR FORMULARIO RÁPIDO
    // =========================================================
    const quickForm = document.getElementById('quickTaskForm');
    if (quickForm) {
        quickForm.addEventListener('submit', function (e) {
            const selectedUrgency = quickForm.querySelector('input[name="urgency"]:checked');
            const selectedImportance = quickForm.querySelector('input[name="importance"]:checked');

            let hasError = false;

            if (!selectedUrgency || !selectedImportance) {
                hasError = true;

                // Buscar los contenedores de urgencia e importancia
                const starContainers = quickForm.querySelectorAll('.star-rating');
                starContainers.forEach(container => {
                    const hasSelection = container.querySelector('input:checked');
                    if (!hasSelection) {
                        container.classList.remove('is-invalid');
                        void container.offsetWidth; // Forzar reflow para reiniciar la animación
                        container.classList.add('is-invalid');

                        // Retiramos la clase a los 200ms para coincidir con la animación rápida
                        setTimeout(() => {
                            container.classList.remove('is-invalid');
                        }, 200);
                    }
                });
            }

            if (hasError) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
    }
});


// 2. FUNCIONES DE FORMULARIOS INLINE Y UTILS
function showInlineForm(button) {
    const wrapper = button.closest('.add-task-inline-wrapper');
    const quadrantContainer = button.closest('.quadrant-container');
    const form = wrapper.querySelector('.inline-task-form');
    const textarea = form.querySelector('textarea');

    if (quadrantContainer) {
        const emptyMsg = quadrantContainer.querySelector('.empty-msg');
        if (emptyMsg) emptyMsg.classList.add('d-none');
    }

    button.classList.add('d-none');
    form.classList.remove('d-none');
    textarea.focus();

    // Resetear flag de envío
    delete form.dataset.isSubmitting;

    // 1. Bloquear submit duplicado a nivel de formulario
    form.onsubmit = function (e) {
        if (form.dataset.isSubmitting === 'true') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        form.dataset.isSubmitting = 'true';
        localStorage.setItem('dashboard_scroll_pos', window.scrollY);
    };

    // 2. Controlar la tecla Enter en el Textarea
    textarea.onkeydown = function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            if (this.value.trim() !== '' && form.dataset.isSubmitting !== 'true') {
                form.dataset.isSubmitting = 'true';
                localStorage.setItem('dashboard_scroll_pos', window.scrollY);
                form.submit();
            }
        }
    };
}

function hideInlineForm(button) {
    const wrapper = button.closest('.add-task-inline-wrapper');
    const quadrantContainer = button.closest('.quadrant-container');
    const form = wrapper.querySelector('.inline-task-form');
    const toggleBtn = wrapper.querySelector('.btn-add-inline');
    const textarea = form.querySelector('textarea');

    delete form.dataset.submitting;
    textarea.value = '';
    form.classList.add('d-none');
    toggleBtn.classList.remove('d-none');

    if (quadrantContainer) {
        const hasTaskCards = quadrantContainer.querySelectorAll('.task-card').length > 0;
        const emptyMsg = quadrantContainer.querySelector('.empty-msg');
        if (!hasTaskCards && emptyMsg) {
            emptyMsg.classList.remove('d-none');
        }
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function sendToggleRequest(taskId, isCompleted, checkbox) {
    const csrftoken = getCookie('csrftoken');

    fetch(`/task/${taskId}/toggle/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ 'is_completed': isCompleted })
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en el servidor');
        return response.json();
    })
    .then(data => {
        if (data.status === 'success' || data.is_completed !== undefined) {
            const card = checkbox.closest('.task-card, .completed-task-item');

            // 1. SI MARCAMOS COMO COMPLETADA
            if (isCompleted && card) {
                const targetContainer = document.getElementById('completed-tasks-container');
                if (targetContainer) {
                    const emptyMsg = targetContainer.querySelector('#empty-trash-msg, .empty-msg');
                    if (emptyMsg) emptyMsg.classList.add('d-none');

                    const titleText = card.querySelector('.task-title')?.textContent.trim() 
                                   || card.querySelector('h6')?.textContent.trim() 
                                   || card.textContent.trim();

                    const urgency = card.dataset.urgency || "4";
                    const importance = card.dataset.importance || "4";

                    // Extraer atributos de metadatos para preservarlos
                    const dueDate = card.dataset.dueDate || "";
                    const hasDescription = card.dataset.hasDescription || "false";
                    const isShared = card.dataset.isShared || "false";

                    const completedItem = document.createElement('div');
                    completedItem.className = 'completed-task-item task-card card border-0 shadow-sm mb-2 p-2 d-flex flex-row align-items-center justify-content-between gap-2 bg-light';
                    completedItem.setAttribute('data-task-id', taskId);
                    completedItem.setAttribute('data-urgency', urgency);
                    completedItem.setAttribute('data-importance', importance);
                    
                    // Guardar metadatos en el dataset del elemento completado
                    if (dueDate) completedItem.setAttribute('data-due-date', dueDate);
                    if (hasDescription === 'true') completedItem.setAttribute('data-has-description', 'true');
                    if (isShared === 'true') completedItem.setAttribute('data-is-shared', 'true');

                    completedItem.innerHTML = `
                        <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0" style="overflow: hidden;">
                            <div class="task-checkbox-wrapper-sidebar flex-shrink-0" style="width: 17px; height: 17px;">
                                <label class="task-checkbox-container m-0" onclick="event.stopPropagation();">
                                    <input type="checkbox" class="task-completion-check" data-task-id="${taskId}" checked>
                                    <span class="checkmark"></span>
                                </label>
                            </div>
                            
                            <span class="task-title text-muted text-decoration-line-through text-truncate fw-medium" 
                                  style="font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: default;" 
                                  title="${titleText}">
                                ${titleText}
                            </span>
                        </div>

                        <form method="POST" action="/task/${taskId}/delete/" class="d-inline m-0 flex-shrink-0" onsubmit="return confirm('¿Eliminar esta tarea definitivamente?');">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${csrftoken}">
                            <button type="submit" class="btn btn-link text-danger p-0 border-0 opacity-50 hover-opacity-100" title="Eliminar">
                                <i class="bi bi-x-lg" style="font-size: 0.85rem;"></i>
                            </button>
                        </form>
                    `;

                    targetContainer.prepend(completedItem);
                    card.remove();

                    const countBadge = document.getElementById('completed-count');
                    if (countBadge) {
                        let currentCount = parseInt(countBadge.textContent, 10) || 0;
                        countBadge.textContent = currentCount + 1;
                    }
                    updateMatrixAndSidebarCounts();
                }
            } 
            // 2. SI DESMARCAMOS (DESCOMPLETAR) CON ANIMACIÓN DE VUELO
            else if (!isCompleted && card) {
                let targetQuadrantCode = data.quadrant; 
                
                if (!targetQuadrantCode) {
                    const urgency = parseInt(card.dataset.urgency || "4", 10);
                    const importance = parseInt(card.dataset.importance || "4", 10);
                    
                    if (urgency >= 3 && importance >= 3) targetQuadrantCode = 'Q1';
                    else if (urgency <= 2 && importance >= 3) targetQuadrantCode = 'Q2';
                    else if (urgency >= 3 && importance <= 2) targetQuadrantCode = 'Q3';
                    else targetQuadrantCode = 'Q4';
                }

                const targetQuadrantContainer = document.querySelector(`.quadrant-container[data-quadrant="${targetQuadrantCode}"]`);

                if (targetQuadrantContainer) {
                    const emptyMsg = targetQuadrantContainer.querySelector('.empty-msg');
                    if (emptyMsg) emptyMsg.classList.add('d-none');

                    const titleText = card.querySelector('.task-title')?.textContent.trim() 
                                   || card.querySelector('span')?.textContent.trim() 
                                   || card.textContent.trim();

                    // Leer metadatos guardados en la tarjeta
                    const dueDate = card.dataset.dueDate || "";
                    const hasDescription = card.dataset.hasDescription === 'true';
                    const isShared = card.dataset.isShared === 'true';

                    // Construcción dinámica del bloque HTML de metadatos
                    let metadataHtml = '';
                    if (dueDate || hasDescription || isShared) {
                        let dateBadge = '';
                        if (dueDate) {
                            dateBadge = `
                                <span class="badge border d-inline-flex align-items-center gap-1 px-1.5 py-0.5 rounded-md task-date-badge" 
                                      style="font-size: 0.65rem; background-color: #FFE4E6 !important; color: #dc2626 !important; border-color: #fecdd3 !important;">
                                    <i class="bi bi-calendar3" style="color: #dc2626 !important;"></i>
                                    ${dueDate}
                                </span>`;
                        }

                        let descBadge = '';
                        if (hasDescription) {
                            descBadge = `
                                <span class="badge text-secondary px-1.5 py-0.5 rounded-md" title="Tiene descripción" style="font-size: 0.98rem;">
                                    <i class="bi bi-card-text" style="color: #5cbcf3; !important"></i> 
                                </span>`;
                        }

                        let sharedBadge = '';
                        if (isShared) {
                            sharedBadge = `
                                <span class="badge text-warning px-1.5 py-0.5 rounded-md" title="Tarea compartida / asignada" style="font-size: 0.85rem;">
                                    <i class="bi bi-people-fill" style="color: #fbbf24 !important;"></i>
                                </span>`;
                        }

                        metadataHtml = `
                            <div class="d-flex align-items-center justify-content-between text-muted mt-1" style="font-size: 0.7rem;" data-bs-toggle="modal" data-bs-target="#viewTaskModal${taskId}">
                                <div class="d-flex align-items-center gap-1.5 flex-wrap">
                                    ${dateBadge}
                                    ${descBadge}
                                    ${sharedBadge}
                                </div>
                            </div>`;
                    }

                    // Obtenemos la posición de origen en el panel de completadas
                    const startRect = card.getBoundingClientRect();

                    const restoredCard = document.createElement('div');
                    restoredCard.className = 'card mb-2 shadow-sm border-0 task-card';
                    restoredCard.id = `task-card-${taskId}`;
                    restoredCard.setAttribute('data-task-id', taskId);
                    restoredCard.setAttribute('data-urgency', card.dataset.urgency || "4");
                    restoredCard.setAttribute('data-importance', card.dataset.importance || "4");
                    if (dueDate) restoredCard.setAttribute('data-due-date', dueDate);
                    if (hasDescription) restoredCard.setAttribute('data-has-description', 'true');
                    if (isShared) restoredCard.setAttribute('data-is-shared', 'true');
                    restoredCard.style.cursor = 'pointer';

                    restoredCard.innerHTML = `
                        <div class="card-body py-2 px-3 d-flex flex-column justify-content-center">
                            <div class="task-card-header d-flex align-items-center justify-content-between position-relative w-100 gap-2" style="min-height: 24px;">
                                <div class="task-checkbox-wrapper flex-shrink-0">
                                    <label class="task-checkbox-container m-0" onclick="event.stopPropagation();">
                                        <input type="checkbox" class="task-completion-check" data-task-id="${taskId}">
                                        <span class="checkmark"></span>
                                    </label>
                                </div>
                                <div class="task-title-wrapper flex-grow-1 min-w-0" data-bs-toggle="modal" data-bs-target="#viewTaskModal${taskId}">
                                    <h6 class="card-title task-title mb-0 fw-semibold text-dark" style="font-size: 0.85rem; line-height: 1.3; margin: 0;">
                                        ${titleText}
                                    </h6>
                                </div>
                                <div class="task-card-actions flex-shrink-0 opacity-50 hover-opacity-100 ms-1" data-bs-toggle="modal" data-bs-target="#viewTaskModal${taskId}">
                                    <i class="bi bi-three-dots text-muted" style="font-size: 0.85rem; line-height: 1;"></i>
                                </div>
                            </div>
                            ${metadataHtml}
                        </div>
                    `;

                    const inlineWrapper = targetQuadrantContainer.querySelector('.add-task-inline-wrapper');
                    if (inlineWrapper) {
                        targetQuadrantContainer.insertBefore(restoredCard, inlineWrapper);
                    } else {
                        targetQuadrantContainer.appendChild(restoredCard);
                    }

                    // Obtenemos la posición final y aplicamos la animación de vuelo (FLIP)
                    const endRect = restoredCard.getBoundingClientRect();
                    const deltaX = startRect.left - endRect.left;
                    const deltaY = startRect.top - endRect.top;

                    restoredCard.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.95)`;
                    restoredCard.style.transition = 'transform 0s, opacity 0s';
                    restoredCard.style.opacity = '1';

                    requestAnimationFrame(() => {
                        restoredCard.style.transition = 'transform 0.85s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease';
                        restoredCard.style.transform = 'translate(0, 0) scale(1)';
                        restoredCard.style.opacity = '1';
                    });

                    card.style.transition = 'opacity 0.3s ease';
                    card.style.opacity = '0';
                    setTimeout(() => card.remove(), 300);

                } else {
                    window.location.reload();
                    return;
                }

                const countBadge = document.getElementById('completed-count');
                if (countBadge) {
                    let currentCount = parseInt(countBadge.textContent, 10) || 0;
                    countBadge.textContent = Math.max(0, currentCount - 1);
                }
                updateMatrixAndSidebarCounts();
            }
        } else {
            checkbox.checked = !isCompleted;
        }
    })
    .catch(error => {
        console.error('Error al actualizar la tarea:', error);
        checkbox.checked = !isCompleted;
    });
}

function initQuickQuadrantListeners() {
    // Lógica para inicializar los selectores de urgencia/importancia si es necesario
    const quickForm = document.getElementById('quickTaskForm');
    if (!quickForm) return;
    updateQuickTargetQuadrantDisplay();
}

document.addEventListener('DOMContentLoaded', function () {
    let isProcessingMove = false;

    // Inicialización de la vista previa del destino en el Alta Rápida
    initQuickQuadrantListeners();

    // A. INICIALIZACIÓN DE SORTABLEJS (Scroll Nativo Directo)
    const quadrantContainers = document.querySelectorAll('.quadrant-container');

    quadrantContainers.forEach(container => {
        if (container.dataset.sortableInitialized) return;
        container.dataset.sortableInitialized = 'true';

        if (!isMobileOrTablet) {
            new Sortable(container, {
                group: 'eisenhower-matrix',
                draggable: '.task-card, .completed-task-item',
                filter: '.empty-msg, .add-task-inline-wrapper, .task-checkbox-wrapper, .task-completion-check', 
                preventOnFilter: false,
                animation: 150,
                ghostClass: 'opacity-50',
                
                scroll: true,
                scrollSensitivity: 200, // Sensibilidad amplia para detectar el borde antes del Dock
                scrollSpeed: 30,        // Velocidad de paso
                bubbleScroll: true,     // Propaga el scroll al contenedor padre (.matrix-container-wrapper)
                forceAutoScrollFallback: true, // Forzar comportamiento fluido nativo

                setData: function (dataTransfer, dragEl) {
                    dataTransfer.setData('Text', dragEl.textContent);
                },

                onAdd: function (evt) {
                    const emptyMsg = evt.to.querySelector('.empty-msg, #empty-trash-msg');
                    if (emptyMsg) emptyMsg.style.display = 'none';
                },

                onRemove: function (evt) {
                    const remainingCards = evt.from.querySelectorAll('.task-card, .completed-task-item');
                    if (remainingCards.length === 0) {
                        const emptyMsg = evt.from.querySelector('.empty-msg, #empty-trash-msg');
                        if (emptyMsg) emptyMsg.style.display = 'block';
                    }
                },

                onEnd: async function (evt) {
                    if (isProcessingMove) return;

                    const itemEl = evt.item;
                    const targetContainer = evt.to;
                    const sourceContainer = evt.from;

                    const inlineWrapperTarget = targetContainer.querySelector('.add-task-inline-wrapper');
                    if (inlineWrapperTarget) {
                        targetContainer.appendChild(inlineWrapperTarget);
                    }

                    if (targetContainer === sourceContainer) return;

                    const taskId = itemEl.getAttribute('data-task-id');
                    const targetQuadrant = targetContainer.getAttribute('data-quadrant');

                    if (!taskId || !targetQuadrant) return;

                    isProcessingMove = true;

                    // 1. SI SE ARRASTRA A LA COLUMNA DE COMPLETADAS (DONE)
                    if (targetQuadrant === 'DONE') {
                        const checkbox = itemEl.querySelector('.task-completion-check');
                        if (checkbox && !checkbox.checked) {
                            checkbox.checked = true;
                            sendToggleRequest(taskId, true, checkbox);
                        } else if (!checkbox) {
                            sendToggleRequest(taskId, true, { closest: () => itemEl });
                        }
                        isProcessingMove = false;
                        return;
                    }

                    // 2. SI VIENE DE COMPLETADAS Y SE MUEVE A UN CUADRANTE DE LA MATRIZ
                    const sourceQuadrant = sourceContainer.getAttribute('data-quadrant');
                    if (sourceQuadrant === 'DONE') {
                        let urgency = 4, importance = 4;
                        if (targetQuadrant === 'Q1') { urgency = 4; importance = 4; }
                        else if (targetQuadrant === 'Q2') { urgency = 1; importance = 4; }
                        else if (targetQuadrant === 'Q3') { urgency = 4; importance = 1; }
                        else if (targetQuadrant === 'Q4') { urgency = 1; importance = 1; }

                        const titleText = itemEl.querySelector('.task-title')?.textContent.trim() || "Tarea sin título";

                        const formData = new FormData();
                        formData.append('is_completed', 'false');
                        formData.append('urgency', urgency);
                        formData.append('importance', importance);

                        try {
                            const response = await fetch(`/task/${taskId}/edit/`, {
                                method: 'POST',
                                headers: {
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'Accept': 'application/json',
                                    'X-CSRFToken': getCookie('csrftoken')
                                },
                                body: formData
                            });

                            const data = await response.json();

                            if (data.status === 'success') {
                                const restoredCard = document.createElement('div');
                                restoredCard.className = 'card mb-2 shadow-sm border-0 task-card';
                                restoredCard.id = `task-card-${taskId}`;
                                restoredCard.setAttribute('data-task-id', taskId);
                                restoredCard.setAttribute('data-urgency', urgency);
                                restoredCard.setAttribute('data-importance', importance);
                                restoredCard.style.cursor = 'pointer';

                                restoredCard.innerHTML = `
                                    <div class="card-body py-2 px-3 d-flex flex-column justify-content-center">
                                        <div class="task-card-header d-flex align-items-center justify-content-between position-relative w-100 gap-2" style="min-height: 24px;">
                                            <div class="task-checkbox-wrapper flex-shrink-0">
                                                <label class="task-checkbox-container m-0" onclick="event.stopPropagation();">
                                                    <input type="checkbox" class="task-completion-check" data-task-id="${taskId}">
                                                    <span class="checkmark"></span>
                                                </label>
                                            </div>
                                            <div class="task-title-wrapper flex-grow-1 min-w-0" data-bs-toggle="modal" data-bs-target="#viewTaskModal${taskId}">
                                                <h6 class="card-title task-title mb-0 fw-semibold text-dark" style="font-size: 0.85rem; line-height: 1.3; margin: 0;">
                                                    ${titleText}
                                                </h6>
                                            </div>
                                            <div class="task-card-actions flex-shrink-0 opacity-50 hover-opacity-100 ms-1" data-bs-toggle="modal" data-bs-target="#viewTaskModal${taskId}">
                                                <i class="bi bi-three-dots text-muted" style="font-size: 0.85rem; line-height: 1;"></i>
                                            </div>
                                        </div>
                                    </div>
                                `;

                                itemEl.replaceWith(restoredCard);

                                const finalContainer = document.querySelector(`.quadrant-container[data-quadrant="${targetQuadrant}"]`) || targetContainer;
                                const inlineWrapper = finalContainer.querySelector('.add-task-inline-wrapper');
                                if (inlineWrapper) {
                                    finalContainer.appendChild(inlineWrapper);
                                }

                                updateMatrixAndSidebarCounts();
                                const countBadge = document.getElementById('completed-count');
                                if (countBadge) {
                                    let currentCount = parseInt(countBadge.textContent, 10) || 0;
                                    countBadge.textContent = Math.max(0, currentCount - 1);
                                }
                            } else {
                                sourceContainer.appendChild(itemEl);
                            }
                        } catch (err) {
                            console.error('Error al sacar tarjeta de completadas:', err);
                            sourceContainer.appendChild(itemEl);
                        } finally {
                            isProcessingMove = false;
                        }
                        return;
                    }

                    // 3. LÓGICA NORMAL DE CAMBIO DE CUADRANTE ENTRE Q1, Q2, Q3 y Q4
                    let urgency = 4, importance = 4;
                    if (targetQuadrant === 'Q1') { urgency = 4; importance = 4; }
                    else if (targetQuadrant === 'Q2') { urgency = 1; importance = 4; }
                    else if (targetQuadrant === 'Q3') { urgency = 4; importance = 1; }
                    else if (targetQuadrant === 'Q4') { urgency = 1; importance = 1; }

                    const formData = new FormData();
                    formData.append('urgency', urgency);
                    formData.append('importance', importance);

                    try {
                        const response = await fetch(`/task/${taskId}/edit/`, {
                            method: 'POST',
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest',
                                'Accept': 'application/json',
                                'X-CSRFToken': getCookie('csrftoken')
                            },
                            body: formData
                        });

                        const data = await response.json();

                        if (data.status === 'success') {
                            if (data.card_html) {
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = data.card_html.trim();
                                const newCard = tempDiv.firstElementChild;
                                
                                itemEl.replaceWith(newCard);

                                const finalContainer = document.querySelector(`.quadrant-container[data-quadrant="${data.quadrant || targetQuadrant}"]`) || targetContainer;
                                const inlineWrapper = finalContainer.querySelector('.add-task-inline-wrapper');
                                if (inlineWrapper) {
                                    finalContainer.appendChild(inlineWrapper);
                                }
                            }
                            updateMatrixAndSidebarCounts();
                        } else {
                            sourceContainer.appendChild(itemEl);
                        }
                    } catch (err) {
                        console.error('Error al mover tarjeta vía Drag & Drop:', err);
                        sourceContainer.appendChild(itemEl);
                    } finally {
                        isProcessingMove = false;
                    }
                }
            });

        }
    });
});

// ==========================================
// BUSCADOR GLOBAL EN TIEMPO REAL (TRELLO STYLE)
// ==========================================
window.handleTaskSearchInput = function(query) {
    const cleanQuery = query.toLowerCase().trim();
    const dropdown = document.getElementById('searchDropdownResults');
    const searchInput = document.getElementById('globalTaskSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (!dropdown || !searchInput) return;

    const safeHtml = (str) => {
        if (!str) return '';
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    if (clearBtn) {
        if (cleanQuery !== '') {
            clearBtn.classList.remove('d-none');
        } else {
            clearBtn.classList.add('d-none');
        }
    }

    // SI LA BÚSQUEDA ESTÁ VACÍA -> OCULTAR POR COMPLETO Y MANTENER EN NONE
    if (cleanQuery === '') {
        dropdown.classList.add('d-none');
        dropdown.classList.remove('show');
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
        return;
    }

    // Calcular posición dinámica exacta
    const rect = searchInput.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 6) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = rect.width + 'px';

    const allCardElements = document.querySelectorAll('.task-card, .completed-task-item, [data-task-id], [id^="task-card-"]');
    const matches = [];

    allCardElements.forEach(card => {
        if (card.classList.contains('add-task-inline-wrapper') || card.tagName === 'FORM') return;

        let taskId = card.dataset.taskId || card.getAttribute('data-task-id');
        if (!taskId && card.id && card.id.startsWith('task-card-')) {
            taskId = card.id.replace('task-card-', '');
        }

        if (!taskId) return;

        const titleEl = card.querySelector('.task-title') || card.querySelector('h6') || card.querySelector('span');
        const titleText = titleEl ? titleEl.textContent.trim() : card.textContent.trim();

        if (titleText && titleText.toLowerCase().includes(cleanQuery)) {
            const isCompleted = card.classList.contains('completed-task-item') || card.closest('#completed-tasks-container') !== null;
            
            let locationLabel = "Completada";
            let badgeBg = "bg-secondary";

            if (!isCompleted) {
                const container = card.closest('.quadrant-container');
                const quadCode = container ? container.getAttribute('data-quadrant') : '';
                if (quadCode === 'Q1') { locationLabel = "Hacer ahora"; badgeBg = "bg-danger"; }
                else if (quadCode === 'Q2') { locationLabel = "Planificar"; badgeBg = "bg-primary"; }
                else if (quadCode === 'Q3') { locationLabel = "Delegar"; badgeBg = "bg-warning text-dark"; }
                else if (quadCode === 'Q4') { locationLabel = "Eliminar"; badgeBg = "bg-secondary"; }
                else { locationLabel = "Matriz"; badgeBg = "bg-secondary"; }
            }

            if (!matches.some(m => m.id === String(taskId))) {
                matches.push({
                    id: String(taskId),
                    title: titleText,
                    isCompleted: isCompleted,
                    location: locationLabel,
                    badgeBg: badgeBg
                });
            }
        }
    });

    if (matches.length > 0) {
        let html = `<div class="px-2 py-1 text-uppercase text-white-50 fw-bold border-bottom border-secondary mb-1" style="font-size: 0.68rem; letter-spacing: 0.5px;">TARJETAS ENCONTRADAS (${matches.length})</div>`;
        
        matches.forEach(item => {
            html += `
                <button type="button" 
                        class="dropdown-item text-white rounded-2 p-2 mb-1 d-flex align-items-center justify-content-between gap-2 border-0 search-result-item"
                        style="cursor: pointer; text-align: left; width: 100%; background: rgba(255, 255, 255, 0.05);"
                        onclick="openSearchResultModal('${item.id}')">
                    <div class="d-flex align-items-center gap-2 min-w-0 search-item-title-wrapper">
                        <span class="fs-6 flex-shrink-0">${item.isCompleted ? '☑️' : '📋'}</span>
                        <span class="fw-medium task-title-text ${item.isCompleted ? 'is-completed' : ''}" title="${safeHtml(item.title)}">
                            ${safeHtml(item.title)}
                        </span>
                    </div>
                    <span class="badge ${item.badgeBg} flex-shrink-0">
                        ${item.location}
                    </span>
                </button>
            `;
        });

        dropdown.innerHTML = html;
        dropdown.classList.remove('d-none');
        dropdown.style.display = 'block';
    } else {
        dropdown.innerHTML = `
            <div class="p-3 text-center text-white-50 small">
                No se encontraron tareas con "${safeHtml(cleanQuery)}"
            </div>
        `;
        dropdown.classList.remove('d-none');
        dropdown.style.display = 'block';
    }
};

// CERRAR DESPLEGABLE AL ABRIR UN MODAL
window.openSearchResultModal = function(taskId) {
    const dropdown = document.getElementById('searchDropdownResults');
    if (dropdown) {
        dropdown.classList.add('d-none');
        dropdown.classList.remove('show');
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
    }

    const modalEl = document.getElementById(`viewTaskModal${taskId}`);
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.show();
    } else {
        const targetCard = document.querySelector(`[data-task-id="${taskId}"]`);
        if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.classList.add('bg-warning-subtle');
            setTimeout(() => targetCard.classList.remove('bg-warning-subtle'), 2000);
        }
    }
};

// CERRAR AL HACER CLIC FUERA
document.addEventListener('click', function (e) {
    const searchWrapper = e.target.closest('#globalTaskSearchWrapper');
    const dropdown = document.getElementById('searchDropdownResults');
    if (!searchWrapper && dropdown) {
        dropdown.classList.add('d-none');
        dropdown.classList.remove('show');
        dropdown.style.display = 'none';
    }
});
function clearGlobalSearch() {
    const searchInput = document.getElementById('globalTaskSearchInput');
    const dropdown = document.getElementById('searchDropdownResults');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    if (dropdown) {
        dropdown.classList.add('d-none');
        dropdown.innerHTML = '';
    }
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) clearBtn.classList.add('d-none');
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ==========================================
// ATAJO DE TECLADO GLOBAL (⌘K / Ctrl+K)
// ==========================================
document.addEventListener('keydown', function(e) {
    // Detecta Cmd + K (Mac) o Ctrl + K (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const searchInput = document.getElementById('globalTaskSearchInput');
        if (searchInput) {
            e.preventDefault(); // Evita el comportamiento por defecto del navegador
            searchInput.focus();
            searchInput.select(); // Selecciona el texto existente si lo hay
        }
    }
    
    // Opcional: Cerrar el buscador al pulsar la tecla Escape
    if (e.key === 'Escape') {
        const dropdown = document.getElementById('searchDropdownResults');
        if (dropdown) {
            dropdown.classList.add('d-none');
            dropdown.style.display = 'none';
        }
    }
});

// Oculta o muestra el letrero "No hay tareas..." en cada cuadrante dinámicamente

function checkEmptyQuadrants() {
    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(quadCode => {
        const container = document.querySelector(`.quadrant-container[data-quadrant="${quadCode}"]`);
        if (!container) return;

        // Contamos las tarjetas de tarea reales en este contenedor
        const realTasks = container.querySelectorAll('.task-card:not(.completed-task-item)');
        const emptyMsg = container.querySelector('.empty-msg-box, .empty-msg');

        if (emptyMsg) {
            if (realTasks.length > 0) {
                // Si hay tarjetas realmentes en el DOM, forzamos ocultar
                emptyMsg.classList.add('d-none');
                emptyMsg.style.setProperty('display', 'none', 'important');
            } else {
                // Si está a cero, mostramos
                emptyMsg.classList.remove('d-none');
                emptyMsg.style.removeProperty('display');
            }
        }
    });
}

// Ejecutar automáticamente al cargar la página para corregir cualquier fallo del servidor
document.addEventListener('DOMContentLoaded', function () {
    checkEmptyQuadrants();
});

//actualiza tanto el número de cada cuadrante
function updateMatrixAndSidebarCounts() {
    // Verificación e invisibilidad inmediata del letrero "No hay tareas"
    checkEmptyQuadrants();
    // 1. Recalcular cada cuadrante de la Matriz (Q1, Q2, Q3, Q4)
    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(quadCode => {
        const container = document.querySelector(`.quadrant-container[data-quadrant="${quadCode}"]`);
        if (!container) return;

        // Contar tarjetas reales activas
        const count = container.querySelectorAll('.task-card:not(.completed-task-item)').length;

        // Actualizar el número en el encabezado del cuadrante
        const quadrantHeaderBadge = container.closest('.quadrant')?.querySelector('.quadrant-header-badge');
        if (quadrantHeaderBadge) {
            quadrantHeaderBadge.textContent = count;
        }

        // Actualizar la cifra del panel lateral "Distribución Actual"
        const sidebarCountEl = document.getElementById(`sidebar-${quadCode.toLowerCase()}-count`);
        if (sidebarCountEl) {
            sidebarCountEl.textContent = `${count} ${count === 1 ? 'tarea' : 'tareas'}`;
        }
    });
}


//scroll ajustado para que se vean los tableros
let isAnimating = false;

window.addEventListener('wheel', function(e) {
    // Si ya se está desplazando con animación, ignoramos nuevos ticks para que no salte raro
    if (isAnimating) {
        e.preventDefault();
        return;
    }

    // Si estamos arriba del todo y el usuario gira la rueda hacia abajo
    if (window.scrollY < 100 && e.deltaY > 0) {
        e.preventDefault();
        isAnimating = true;

        const matrixSection = document.querySelector('.matrix-container-section') || document.querySelector('.quadrant-row');
        
        if (matrixSection) {
            matrixSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollBy({ top: 314, behavior: 'smooth' });
        }

        // Liberamos el bloqueo solo cuando termina la animación (aprox. 600-800ms)
        setTimeout(() => {
            isAnimating = false;
        }, 950);
    }
}, { passive: false });

// Gestión de envíos de invitación desde los modals de tablero en el sidebar
// Envía las invitaciones acumuladas haciendo submit del formulario principal del tablero
function sendBoardInvite(boardId) {
    const users = selectedUsersMap[boardId] || [];
    const feedbackEl = document.getElementById(`invite-feedback-${boardId}`);

    if (users.length === 0) {
        if (feedbackEl) {
            feedbackEl.className = "text-danger fw-bold";
            feedbackEl.textContent = "Selecciona al menos una persona de la lista primero.";
        }
        return;
    }

    // Buscar el formulario principal del modal
    const inputEl = document.getElementById(`invite-input-${boardId}`);
    const form = inputEl ? inputEl.closest('form') : null;

    if (form) {
        // Asegurar que renderSelectedUsers ha volcado los datos al input oculto antes de enviar
        renderSelectedUsers(boardId);
        
        if (feedbackEl) {
            feedbackEl.className = "text-success fw-bold";
            feedbackEl.textContent = `Enviando invitación a ${users.length} persona(s)...`;
        }
        
        form.submit();
    } else {
        console.error("No se encontró el formulario para el tablero:", boardId);
    }
}

// ==========================================
// BUSCADOR EN VIVO DE INVITADOS PARA TABLEROS (MÚLTIPLES SELECCIONES)
// ==========================================
let boardInviteTimeout = null;
const selectedUsersMap = {}; // Guarda un array de objetos por boardId: { username, displayName }

function handleBoardInviteSearch(inputEl, boardId) {
    const query = inputEl.value.toLowerCase().trim();
    const resultsMenu = document.getElementById(`invite-results-${boardId}`);
    const container = document.getElementById(`invite-list-container-${boardId}`);
    const noResultsEl = document.getElementById(`invite-no-results-${boardId}`);
    if (!resultsMenu || !container) return;

    if (query.length === 0) {
        resultsMenu.classList.add('d-none');
        resultsMenu.style.display = 'none';
        if (noResultsEl) noResultsEl.classList.add('d-none');
        return;
    }

    // 1. Mostrar menú forzando la visibilidad estructural
    resultsMenu.classList.remove('d-none');
    resultsMenu.style.display = 'block';

    // 2. Filtrado dinámico de coincidencias locales
    const items = container.querySelectorAll('.member-search-item');
    let localMatches = 0;

    items.forEach(item => {
        const text = (item.getAttribute('data-search-key') || item.textContent || '').toLowerCase();
        if (text.includes(query)) {
            item.classList.remove('d-none');
            item.style.display = 'block';
            localMatches++;
        } else {
            item.classList.add('d-none');
            item.style.display = 'none';
        }
    });

    if (localMatches > 0 && noResultsEl) {
        noResultsEl.classList.add('d-none');
    }

    // 3. Consulta AJAX para usuarios del servidor
    clearTimeout(boardInviteTimeout);
    if (query.length >= 2) {
        boardInviteTimeout = setTimeout(() => {
            fetch(`/api/search-users/?q=${encodeURIComponent(query)}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            })
            .then(res => res.ok ? res.json() : Promise.reject(res.status))
            .then(data => {
                if (data.users && data.users.length > 0) {
                    data.users.forEach(user => {
                        const userKey = `${user.full_name || ''} ${user.username} ${user.email || ''}`.toLowerCase();
                        const existing = container.querySelector(`[data-search-key*="${user.username.toLowerCase()}"]`);

                        if (!existing) {
                            const initials = user.initials || (user.full_name ? user.full_name.substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase());
                            const displayName = user.full_name || user.username;
                            const subText = user.email || `@${user.username}`;

                            const itemHtml = `
                                <div class="member-search-item" data-search-key="${userKey}">
                                    <button type="button" 
                                            class="btn btn-light btn-sm w-100 text-start border-0 d-flex align-items-center justify-content-between p-2 rounded-3"
                                            onmousedown="selectBoardCollaborator('${boardId}', '${user.username}', '${displayName}')">
                                        <div class="d-flex align-items-center gap-2 overflow-hidden">
                                            <span class="rounded-circle text-white d-inline-flex align-items-center justify-content-center flex-shrink-0" 
                                                  style="width: 32px; height: 32px; font-size: 0.75rem; font-weight: 700; background: linear-gradient(135deg, #497BF6 0%, #7855f7 50%, #9f48ec 100%);">
                                                ${initials}
                                            </span>
                                            <div class="d-flex flex-column text-truncate">
                                                <span class="text-dark fw-bold text-truncate" style="font-size: 0.85rem; line-height: 1.2;">
                                                    ${displayName}
                                                </span>
                                                <small class="text-muted text-truncate" style="font-size: 0.72rem;">
                                                    ${subText}
                                                </small>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            `;
                            container.insertAdjacentHTML('beforeend', itemHtml);
                        }
                    });
                }

                const visibleItems = container.querySelectorAll('.member-search-item:not(.d-none)');
                if (visibleItems.length === 0 && noResultsEl) {
                    noResultsEl.classList.remove('d-none');
                } else if (noResultsEl) {
                    noResultsEl.classList.add('d-none');
                }
            })
            .catch(err => console.error("Error al buscar usuarios:", err));
        }, 200);
    } else if (localMatches === 0 && noResultsEl) {
        noResultsEl.classList.remove('d-none');
    }
}

// Al seleccionar un usuario de la lista flotante
function selectBoardCollaborator(boardId, username, displayName) {
    const inputEl = document.getElementById(`invite-input-${boardId}`);
    const resultsMenu = document.getElementById(`invite-results-${boardId}`);

    if (!selectedUsersMap[boardId]) {
        selectedUsersMap[boardId] = [];
    }

    const exists = selectedUsersMap[boardId].some(u => u.username === username);
    if (!exists) {
        selectedUsersMap[boardId].push({ username, displayName });
    }

    if (inputEl) inputEl.value = '';
    if (resultsMenu) {
        resultsMenu.classList.add('d-none');
        resultsMenu.style.display = 'none';
    }

    renderSelectedUsers(boardId);
}

// Renderiza los badges individuales Y sincroniza los inputs ocultos para Django
function renderSelectedUsers(boardId) {
    const boxEl = document.getElementById(`invite-selected-box-${boardId}`);
    const listContainer = document.getElementById(`selected-users-list-${boardId}`);
    const users = selectedUsersMap[boardId] || [];

    // 1. Contenedor de inputs múltiples (name="invited_users")
    let hiddenContainer = document.getElementById(`hidden-inputs-container-${boardId}`);
    if (!hiddenContainer && boxEl) {
        hiddenContainer = document.createElement('div');
        hiddenContainer.id = `hidden-inputs-container-${boardId}`;
        boxEl.parentNode.appendChild(hiddenContainer);
    }

    // 2. Input legacy dentro del formulario principal
    const legacyInput = document.getElementById(`hiddenIdentifierInput${boardId}`);

    if (!boxEl) return;

    if (users.length === 0) {
        boxEl.classList.add('d-none');
        if (listContainer) listContainer.innerHTML = '';
        if (hiddenContainer) hiddenContainer.innerHTML = '';
        if (legacyInput) legacyInput.value = '';
        return;
    }

    boxEl.classList.remove('d-none');

    // Renderizar badges visuales
    if (listContainer) {
        listContainer.innerHTML = users.map(user => `
            <div class="d-inline-flex align-items-center gap-1.5 bg-white px-2.5 py-1 rounded-pill border shadow-sm" style="font-size: 0.78rem;">
                <span class="fw-bold text-dark">${user.displayName}</span>
                <button type="button" class="btn-close ms-1" style="font-size: 0.6rem;" onclick="removeSelectedCollaborator('${boardId}', '${user.username}')"></button>
            </div>
        `).join('');
    }

    // Generar inputs ocultos múltiples (para 'invited_users')
    if (hiddenContainer) {
        hiddenContainer.innerHTML = users.map(user => `
            <input type="hidden" name="invited_users" value="${user.username}">
        `).join('');
    }

    // Asignar usernames en el input legacy (para 'invite_identifier')
    if (legacyInput) {
        legacyInput.value = users.map(u => u.username).join(',');
    }
}

function removeSelectedCollaborator(boardId, username) {
    if (selectedUsersMap[boardId]) {
        selectedUsersMap[boardId] = selectedUsersMap[boardId].filter(u => u.username !== username);
        renderSelectedUsers(boardId);
    }
}

function clearSelectedCollaborator(boardId) {
    selectedUsersMap[boardId] = [];
    renderSelectedUsers(boardId);
}

// Envía la invitación utilizando el formulario dedicado (inviteFormHidden) o el principal
function sendBoardInvite(boardId) {
    const users = selectedUsersMap[boardId] || [];
    const feedbackEl = document.getElementById(`invite-feedback-${boardId}`);

    if (users.length === 0) {
        if (feedbackEl) {
            feedbackEl.className = "text-danger fw-bold";
            feedbackEl.textContent = "Selecciona al menos una persona de la lista primero.";
        }
        return;
    }

    // Asegurarse de volcar los nombres al input oculto del formulario independiente
    const dedicatedForm = document.getElementById(`inviteFormHidden${boardId}`);
    const dedicatedInput = document.getElementById(`dedicatedIdentifierInput${boardId}`);

    if (dedicatedForm && dedicatedInput) {
        dedicatedInput.value = users.map(u => u.username).join(',');
        if (feedbackEl) {
            feedbackEl.className = "text-success fw-bold";
            feedbackEl.textContent = `Enviando invitación a ${users.length} persona(s)...`;
        }
        dedicatedForm.submit();
        return;
    }

    // Si no hay formulario independiente, hace submit al principal del modal
    const inputEl = document.getElementById(`invite-input-${boardId}`);
    const form = inputEl ? inputEl.closest('form') : null;
    if (form) {
        renderSelectedUsers(boardId);
        form.submit();
    }
}


// ==========================================
// POLLING DE NOTIFICACIONES EN TIEMPO REAL
// ==========================================
function pollUnreadNotifications() {
    // Si la pestaña no está activa o visible, pausar peticiones
    if (document.hidden) return;

    fetch('/api/unread-notifications-count/', {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(data => {
        const bellBtn = document.getElementById('notificationsDropdown');
        if (!bellBtn) return;

        let redDot = bellBtn.querySelector('.notification-red-dot');

        if (data.unread_count > 0) {
            if (!redDot) {
                const dot = document.createElement('span');
                dot.className = 'notification-red-dot';
                bellBtn.appendChild(dot);
            }
        } else if (redDot) {
            redDot.remove();
        }
    })
    .catch(err => console.debug("Polling pausado o sin conexión"));
}

// Comprobar notificaciones no leídas cada 12 segundos
setInterval(pollUnreadNotifications, 12000);


// =======================================================
// CONTROLADOR TÁCTIL Y MENÚ DE ACCIONES (MÓVIL / TABLET)
// =======================================================

// 1. Abre el menú de 2 opciones en móvil/tablet o el modal completo en PC
function handleTaskCardClick(taskId) {
    const isMobileOrTablet = window.innerWidth <= 1240 || 'ontouchstart' in window;
    
    if (isMobileOrTablet) {
        const actionModalEl = document.getElementById(`mobileActionModal${taskId}`);
        const taskCard = document.getElementById(`task-card-${taskId}`);

        // Sincronización al vuelo: Lee el título actualizado de la tarjeta en el tablero
        if (taskCard && actionModalEl) {
            const currentTitleEl = taskCard.querySelector('.task-title');
            const mobileModalTitle = actionModalEl.querySelector('.modal-header h6');
            if (currentTitleEl && mobileModalTitle) {
                const updatedTitle = currentTitleEl.textContent.trim();
                mobileModalTitle.textContent = updatedTitle;
                mobileModalTitle.title = updatedTitle;
            }
        }

        if (actionModalEl) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(actionModalEl);
            modalInstance.show();
        }
    } else {
        const editModalEl = document.getElementById(`viewTaskModal${taskId}`);
        if (editModalEl) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(editModalEl);
            modalInstance.show();
        }
    }
}

// 2. Acción para el botón "Completar tarea" del menú móvil
function executeMobileComplete(taskId) {
    const actionModalEl = document.getElementById(`mobileActionModal${taskId}`);
    if (actionModalEl) {
        const bsModal = bootstrap.Modal.getInstance(actionModalEl);
        if (bsModal) bsModal.hide();
    }

    const taskCard = document.getElementById(`task-card-${taskId}`);
    if (taskCard) {
        const fakeCheckbox = { checked: true, dataset: { taskId: taskId }, closest: () => taskCard };
        sendToggleRequest(taskId, true, fakeCheckbox);
    }
}

// 3. Acción para el botón "Editar detalles" del menú móvil
function executeMobileEdit(taskId) {
    const actionModalEl = document.getElementById(`mobileActionModal${taskId}`);
    if (actionModalEl) {
        const bsModal = bootstrap.Modal.getInstance(actionModalEl);
        if (bsModal) {
            actionModalEl.addEventListener('hidden.bs.modal', function handler() {
                const editModalEl = document.getElementById(`viewTaskModal${taskId}`);
                if (editModalEl) {
                    const editModalInstance = bootstrap.Modal.getOrCreateInstance(editModalEl);
                    editModalInstance.show();
                }
                actionModalEl.removeEventListener('hidden.bs.modal', handler);
            });
            bsModal.hide();
        }
    }
}