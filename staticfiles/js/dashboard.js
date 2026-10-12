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

            if (isCompleted && card) {
                const targetContainer = document.getElementById('completed-tasks-container');
                if (targetContainer) {
                    const emptyMsg = targetContainer.querySelector('#empty-trash-msg, .empty-msg');
                    if (emptyMsg) emptyMsg.classList.add('d-none');

                    const titleText = card.querySelector('.task-title')?.textContent.trim() || card.textContent.trim();

                    // Insertar en la columna de completadas
                    const completedItem = document.createElement('div');
                    completedItem.className = 'completed-task-item task-card card border-0 shadow-sm mb-2 p-2 d-flex flex-row align-items-center justify-content-between gap-2 bg-light';
                    completedItem.setAttribute('data-task-id', taskId);

                    completedItem.innerHTML = `
                        <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0" style="overflow: hidden;">
                            <div class="task-checkbox-wrapper-sidebar flex-shrink-0" style="width: 17px; height: 17px;">
                                <label class="task-checkbox-container m-0" onclick="event.stopPropagation();">
                                    <input type="checkbox" class="task-completion-check" data-task-id="${taskId}" checked>
                                    <span class="checkmark"></span>
                                </label>
                            </div>
                            <span class="task-title text-muted text-decoration-line-through text-truncate fw-medium" style="font-size: 0.85rem;" title="${titleText}">
                                ${titleText}
                            </span>
                        </div>
                    `;

                    targetContainer.prepend(completedItem);
                    card.remove();

                    // Actualizar contador
                    const countBadge = document.getElementById('completed-count');
                    if (countBadge) {
                        let currentCount = parseInt(countBadge.textContent, 10) || 0;
                        countBadge.textContent = currentCount + 1;
                    }
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

