// static/js/dashboard.js

// 1. FUNCIONES DE FORMULARIOS INLINE Y UTILS
// static/js/dashboard.js

// static/js/dashboard.js

// static/js/dashboard.js

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

// static/js/dashboard.js

// static/js/dashboard.js

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

                    // Crear elemento en completadas
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

                    // Incrementar contador
                    const countBadge = document.getElementById('completed-count');
                    if (countBadge) {
                        let currentCount = parseInt(countBadge.textContent, 10) || 0;
                        countBadge.textContent = currentCount + 1;
                    }
                }
            } 
            // 2. SI DESMARCAMOS (DESCOMPLETAR)
            else if (!isCompleted && card) {
                // Determinar el cuadrante de destino según la respuesta o metadatos de la tarjeta
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
                    // Ocultar mensaje de "No hay tareas"
                    const emptyMsg = targetQuadrantContainer.querySelector('.empty-msg');
                    if (emptyMsg) emptyMsg.classList.add('d-none');

                    const titleText = card.querySelector('.task-title')?.textContent.trim() 
                                   || card.querySelector('span')?.textContent.trim() 
                                   || card.textContent.trim();

                    // Recrear la tarjeta en la matriz
                    const restoredCard = document.createElement('div');
                    restoredCard.className = 'card mb-2 p-0 shadow-sm border-0 task-card';
                    restoredCard.id = `task-card-${taskId}`;
                    restoredCard.setAttribute('data-task-id', taskId);
                    restoredCard.setAttribute('data-urgency', card.dataset.urgency || "4");
                    restoredCard.setAttribute('data-importance', card.dataset.importance || "4");
                    restoredCard.style.cursor = 'pointer';

                    restoredCard.innerHTML = `
                        <div class="card-body py-2 px-3 d-flex flex-column justify-content-center">
                            <div class="task-card-header d-flex align-items-center position-relative w-100">
                                <div class="task-checkbox-wrapper flex-shrink-0">
                                    <label class="task-checkbox-container m-0" onclick="event.stopPropagation();">
                                        <input type="checkbox" class="task-completion-check" data-task-id="${taskId}">
                                        <span class="checkmark"></span>
                                    </label>
                                </div>
                                <div class="task-title-wrapper w-100" data-bs-toggle="modal" data-bs-target="#viewTaskModal${taskId}">
                                    <h6 class="card-title task-title mb-0 fw-semibold text-dark" style="font-size: 0.88rem; line-height: 1.35; margin: 0;">
                                        ${titleText}
                                    </h6>
                                </div>
                            </div>
                        </div>
                    `;

                    // Insertar antes del botón de añadir tarea
                    const inlineWrapper = targetQuadrantContainer.querySelector('.add-task-inline-wrapper');
                    if (inlineWrapper) {
                        targetQuadrantContainer.insertBefore(restoredCard, inlineWrapper);
                    } else {
                        targetQuadrantContainer.appendChild(restoredCard);
                    }

                    card.remove();
                } else {
                    // Si por algún motivo no encuentra el cuadrante, recargar como fallback
                    window.location.reload();
                    return;
                }

                // Decrementar contador de completadas
                const countBadge = document.getElementById('completed-count');
                if (countBadge) {
                    let currentCount = parseInt(countBadge.textContent, 10) || 0;
                    countBadge.textContent = Math.max(0, currentCount - 1);
                }
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

    // A. INICIALIZACIÓN DE SORTABLEJS (Evitar inicializaciones dobles)
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

                try {
                    const response = await fetch('/tasks/move/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken'),
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: JSON.stringify({
                            task_id: taskId,
                            target_quadrant: targetQuadrant
                        })
                    });

                    const data = await response.json();

                    if (data.status === 'success') {
                        window.location.reload();
                    } else {
                        sourceContainer.appendChild(itemEl);
                        isProcessingMove = false;
                    }
                } catch (err) {
                    console.error('Error al mover la tarea:', err);
                    sourceContainer.appendChild(itemEl);
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



// BUSCADOR CON DESPLEGABLE EMERGENTE (ESTILO TRELLO)


function handleTaskSearchInput(query) {
    const cleanQuery = query.toLowerCase().trim();
    const dropdown = document.getElementById('searchDropdownResults');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (!dropdown) return;

    if (clearBtn) {
        if (cleanQuery !== '') {
            clearBtn.classList.remove('d-none');
        } else {
            clearBtn.classList.add('d-none');
        }
    }

    if (cleanQuery === '') {
        dropdown.classList.add('d-none');
        dropdown.innerHTML = '';
        return;
    }

    const allCards = document.querySelectorAll('.task-card, .completed-task-item');
    const matches = [];

    allCards.forEach(card => {
        let taskId = card.dataset.taskId || card.getAttribute('data-task-id');
        if (!taskId && card.id && card.id.startsWith('task-card-')) {
            taskId = card.id.replace('task-card-', '');
        }

        const titleEl = card.querySelector('.task-title') || card.querySelector('h6') || card.querySelector('span');
        const titleText = titleEl ? titleEl.textContent.trim() : card.textContent.trim();

        if (titleText.toLowerCase().includes(cleanQuery) && taskId) {
            const isCompleted = card.classList.contains('completed-task-item') || card.closest('#completed-tasks-container') !== null;
            
            let locationLabel = "Completada";
            let badgeBg = "bg-secondary";

            if (!isCompleted) {
                const container = card.closest('.quadrant-container');
                const quadCode = container ? container.getAttribute('data-quadrant') : '';
                if (quadCode === 'Q1') { locationLabel = "Urgente e Importante"; badgeBg = "bg-danger"; }
                else if (quadCode === 'Q2') { locationLabel = "Planificar"; badgeBg = "bg-primary"; }
                else if (quadCode === 'Q3') { locationLabel = "Delegar"; badgeBg = "bg-warning text-dark"; }
                else if (quadCode === 'Q4') { locationLabel = "Eliminar"; badgeBg = "bg-info text-dark"; }
                else { locationLabel = "Matriz"; badgeBg = "bg-secondary"; }
            }

            matches.push({
                id: taskId,
                title: titleText,
                isCompleted: isCompleted,
                location: locationLabel,
                badgeBg: badgeBg
            });
        }
    });

    if (matches.length > 0) {
        let html = `<div class="px-2 py-1 text-uppercase text-white-50 fw-bold border-bottom border-secondary mb-1" style="font-size: 0.68rem; letter-spacing: 0.5px;">TARJETAS ENCONTRADAS (${matches.length})</div>`;
        
        matches.forEach(item => {
            html += `
                            <button type="button" 
                                    class="dropdown-item text-white rounded-2 p-2 mb-1 d-flex align-items-center justify-content-between gap-2 border-0 search-result-item"
                                    style="cursor: pointer; text-align: left; width: 100%;"
                                    onclick="openSearchResultModal('${item.id}')">
                                <div class="d-flex align-items-center gap-2 min-w-0 search-item-title-wrapper">
                                    <span class="fs-6 flex-shrink-0">${item.isCompleted ? '☑️' : '📋'}</span>
                                    <span class="fw-medium task-title-text ${item.isCompleted ? 'is-completed' : ''}" title="${escapeHtml(item.title)}">
                                        ${escapeHtml(item.title)}
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
    } else {
        dropdown.innerHTML = `
            <div class="p-3 text-center text-white-50 small">
                No se encontraron tareas con "${escapeHtml(cleanQuery)}"
            </div>
        `;
        dropdown.classList.remove('d-none');
    }
}


function openSearchResultModal(taskId) {
    const dropdown = document.getElementById('searchDropdownResults');
    if (dropdown) dropdown.classList.add('d-none');

    // Buscar el modal por ID
    const modalEl = document.getElementById(`viewTaskModal${taskId}`);
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.show();
    } else {
        // Fallback: si no hay modal (por ejemplo en completadas), se busca el elemento en el tablero
        const targetCard = document.querySelector(`[data-task-id="${taskId}"]`);
        if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.classList.add('bg-warning-subtle');
            setTimeout(() => targetCard.classList.remove('bg-warning-subtle'), 2000);
        }
    }
}

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

document.addEventListener('click', function (e) {
    const searchWrapper = e.target.closest('#globalTaskSearchWrapper');
    const dropdown = document.getElementById('searchDropdownResults');
    if (!searchWrapper && dropdown) {
        dropdown.classList.add('d-none');
    }
});