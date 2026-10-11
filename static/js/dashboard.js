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
            // Recargar la vista o actualizar el estado de forma limpia
            window.location.reload();
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

// D. MANEJO DE EVENTOS DE CLICK Y CHECKBOX DE COMPLETADO
document.addEventListener('change', function (e) {
    if (e.target.matches('.task-completion-check')) {
        const checkbox = e.target;
        const taskId = checkbox.dataset.taskId;
        const isCompleted = checkbox.checked;

        if (!taskId) return;

        if (isCompleted) {
            const card = checkbox.closest('.task-card');
            if (card) {
                card.classList.add('task-completing');
                const rect = checkbox.getBoundingClientRect();
                const startX = rect.left + rect.width / 2;
                const startY = rect.top + rect.height / 2;

                if (typeof confetti !== 'undefined') {
                    confetti({
                        particleCount: 30,
                        spread: 55,
                        origin: { x: startX / window.innerWidth, y: startY / window.innerHeight },
                        colors: ['#10B981', '#3B82F6', '#F59E0B'],
                        disableForReducedMotion: true
                    });
                }

                setTimeout(() => {
                    sendToggleRequest(taskId, isCompleted, checkbox);
                }, 350);
                return;
            }
        }
        sendToggleRequest(taskId, isCompleted, checkbox);
    }
});