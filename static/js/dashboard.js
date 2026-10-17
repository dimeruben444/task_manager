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
        labelEl.textContent = '';
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

                    const completedItem = document.createElement('div');
                    completedItem.className = 'completed-task-item task-card card border-0 shadow-sm mb-2 p-2 d-flex flex-row align-items-center justify-content-between gap-2 bg-light';
                    completedItem.setAttribute('data-task-id', taskId);
                    completedItem.setAttribute('data-urgency', urgency);
                    completedItem.setAttribute('data-importance', importance);

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
            // 2. SI DESMARCAMOS (DESCOMPLETAR)
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

                    const restoredCard = document.createElement('div');
                    restoredCard.className = 'card mb-2 shadow-sm border-0 task-card';
                    restoredCard.id = `task-card-${taskId}`;
                    restoredCard.setAttribute('data-task-id', taskId);
                    restoredCard.setAttribute('data-urgency', card.dataset.urgency || "4");
                    restoredCard.setAttribute('data-importance', card.dataset.importance || "4");
                    restoredCard.style.cursor = 'pointer';

                    // INYECCIÓN COMPLETA DE ESTRUCTURA CON TRES PUNTOS
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

                    const inlineWrapper = targetQuadrantContainer.querySelector('.add-task-inline-wrapper');
                    if (inlineWrapper) {
                        targetQuadrantContainer.insertBefore(restoredCard, inlineWrapper);
                    } else {
                        targetQuadrantContainer.appendChild(restoredCard);
                    }

                    card.remove();
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

document.addEventListener('DOMContentLoaded', function () {
    let isProcessingMove = false;

    // Inicialización de la vista previa del destino en el Alta Rápida
    initQuickQuadrantListeners();

    // A. INICIALIZACIÓN DE SORTABLEJS (Soporte Drag & Drop)
    const quadrantContainers = document.querySelectorAll('.quadrant-container');

    quadrantContainers.forEach(container => {
        if (container.dataset.sortableInitialized) return;
        container.dataset.sortableInitialized = 'true';

        new Sortable(container, {
            group: 'eisenhower-matrix',
            draggable: '.task-card',
            filter: '.empty-msg, .add-task-inline-wrapper',
            animation: 150,
            ghostClass: 'opacity-50',

            onAdd: function (evt) {
                const emptyMsg = evt.to.querySelector('.empty-msg');
                if (emptyMsg) emptyMsg.style.display = 'none';
            },

            onRemove: function (evt) {
                const remainingCards = evt.from.querySelectorAll('.task-card');
                if (remainingCards.length === 0) {
                    const emptyMsg = evt.from.querySelector('.empty-msg');
                    if (emptyMsg) emptyMsg.style.display = 'block';
                }
            },

            onEnd: async function (evt) {
                if (isProcessingMove) return;

                const itemEl = evt.item;
                const targetContainer = evt.to;
                const sourceContainer = evt.from;

                if (targetContainer === sourceContainer) return;

                const taskId = itemEl.getAttribute('data-task-id');
                const targetQuadrant = targetContainer.getAttribute('data-quadrant');

                if (!taskId || !targetQuadrant) return;

                isProcessingMove = true;

                const reinsertCardAboveAddBtn = (container, card) => {
                    const inlineWrapper = container.querySelector('.add-task-inline-wrapper');
                    if (inlineWrapper) {
                        container.insertBefore(card, inlineWrapper);
                    } else {
                        container.appendChild(card);
                    }
                };

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

                            if (data.date_restriction_applied || data.quadrant !== targetQuadrant) {
                                const correctContainer = document.querySelector(`.quadrant-container[data-quadrant="${data.quadrant}"]`);
                                if (correctContainer) {
                                    reinsertCardAboveAddBtn(correctContainer, newCard);
                                }
                                
                                setTimeout(() => {
                                    if (typeof window.triggerDueDateShake === 'function') {
                                        window.triggerDueDateShake(newCard);
                                    }
                                }, 200);
                            }
                        }
                    } else {
                        reinsertCardAboveAddBtn(sourceContainer, itemEl);
                    }
                } catch (err) {
                    console.error('Error al mover tarjeta vía Drag & Drop:', err);
                    reinsertCardAboveAddBtn(sourceContainer, itemEl);
                } finally {
                    isProcessingMove = false;
                }
            }
        });
    });

    // B. EVITAR DOBLE ENVÍO EN EL FORMULARIO PRINCIPAL / ALTA RÁPIDA
    const quickForm = document.getElementById('quickTaskForm');

    if (quickForm) {
        quickForm.addEventListener('submit', function (e) {
            if (quickForm.dataset.submitting === 'true') {
                e.preventDefault();
                return;
            }

            const urgencyChecked = quickForm.querySelector('input[name="urgency"]:checked');
            const importanceChecked = quickForm.querySelector('input[name="importance"]:checked');

            let hasError = false;
            document.querySelectorAll('.rating-wrapper').forEach(w => w.classList.remove('shake-error'));

            if (!urgencyChecked) {
                hasError = true;
                const urgencyInput = quickForm.querySelector('input[name="urgency"]');
                if (urgencyInput) {
                    const wrapper = urgencyInput.closest('.rating-wrapper');
                    if (wrapper) wrapper.classList.add('shake-error');
                }
            }

            if (!importanceChecked) {
                hasError = true;
                const importanceInput = quickForm.querySelector('input[name="importance"]');
                if (importanceInput) {
                    const wrapper = importanceInput.closest('.rating-wrapper');
                    if (wrapper) wrapper.classList.add('shake-error');
                }
            }

            if (hasError) {
                e.preventDefault();
                e.stopPropagation();
                setTimeout(() => {
                    document.querySelectorAll('.rating-wrapper').forEach(w => w.classList.remove('shake-error'));
                }, 400);
            } else {
                quickForm.dataset.submitting = 'true';
            }
        });
    }

    // C. FILTROS Y RESTAURACIÓN DE SCROLL
    const savedScrollPos = localStorage.getItem('dashboard_scroll_pos');
    if (savedScrollPos !== null) {
        window.scrollTo({
            top: parseInt(savedScrollPos, 10),
            behavior: 'instant'
        });
        localStorage.removeItem('dashboard_scroll_pos');
    }

    document.addEventListener('submit', function (e) {
        localStorage.setItem('dashboard_scroll_pos', window.scrollY);
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

//actualiza tanto el número de cada cuadrante
function updateMatrixAndSidebarCounts() {
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