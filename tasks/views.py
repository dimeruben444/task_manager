# tasks/views.py
from django.shortcuts import get_object_or_404, redirect
from django.views.generic import UpdateView, DeleteView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.http import JsonResponse
from .models import Task, Board
from .forms import TaskForm

from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.db.models import Q

from django.utils import timezone
from datetime import timedelta
import json

from django.template.loader import render_to_string

# Valores predeterminados de urgencia e importancia al mover a cada cuadrante activo
QUADRANT_DEFAULTS = {
    'Q1': {'urgency': 4, 'importance': 4},  # Hacer ahora (Urgente e Importante)
    'Q2': {'urgency': 1, 'importance': 4},  # Planificar (Importante, No Urgente)
    'Q3': {'urgency': 4, 'importance': 1},  # Delegar (Urgente, No Importante)
    'Q4': {'urgency': 1, 'importance': 1},  # Eliminar (No Urgente, No Importante)
}


# 1. Cambiar estado completada / pendiente (Soporte AJAX)
class ToggleTaskDoneView(LoginRequiredMixin, View):
    def post(self, request, pk):
        task = get_object_or_404(
            Task.objects.filter(
                Q(created_by=request.user) |
                Q(assigned_to=request.user) |
                Q(board__owner=request.user)
            ).distinct(),
            pk=pk
        )
        
        print(f"⚡ ANTES DEL TOGGLE -> Tarea: {task.title} | is_completed actual: {task.is_completed}")
        
        # Invertimos directamente el estado en el servidor sin depender de lo que envíe el JS
        task.is_completed = not task.is_completed
        task.save()

        print(f"⚡ DESPUÉS DEL SAVE -> Tarea: {task.title} | is_completed nuevo: {task.is_completed}")

        return JsonResponse({
            'status': 'success',
            'is_completed': task.is_completed,
            'task_id': task.id
        })

class TaskUpdateView(LoginRequiredMixin, UpdateView):
    model = Task
    form_class = TaskForm
    pk_url_kwarg = 'pk'

    def get_queryset(self):
        return Task.objects.filter(
            Q(created_by=self.request.user) |
            Q(assigned_to=self.request.user) |
            Q(board__owner=self.request.user)
        ).distinct()

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        if hasattr(self.object, 'board') and self.object.board:
            kwargs['current_board'] = self.object.board
        return kwargs

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()

        is_ajax = (
            request.headers.get('x-requested-with') == 'XMLHttpRequest' or
            request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' or
            request.accepts('application/json')
        )

        # Si es AJAX y no enviamos el formulario completo (Drag & Drop)
        if is_ajax and 'title' not in request.POST:
            kwargs = self.get_form_kwargs()
            kwargs['data'] = request.POST
            kwargs['partial'] = True  # Marca los campos no recibidos como opcionales
            
            form = self.get_form_class()(**kwargs)
            if form.is_valid():
                return self.form_valid(form)
            return self.form_invalid(form)

        return super().post(request, *args, **kwargs)

    def form_valid(self, form):
        task = form.save(commit=False)
        
        if form.cleaned_data.get('reminder_enabled'):
            task.reminder_sent = False

        # RESTRICCIÓN DE NEGOCIO POR FECHA:
        # Si vence en 2 días o menos, forzamos la urgencia a >= 3
        date_blocked = False
        if task.due_date:
            today = timezone.now().date()
            due_date = task.due_date.date() if hasattr(task.due_date, 'date') else task.due_date
            days_left = (due_date - today).days

            if days_left <= 2 and int(task.urgency or 4) <= 2:
                task.urgency = 3  # Fuerza a Urgente
                date_blocked = True

        # Recalcular cuadrante con los valores finales
        urgency = int(task.urgency or 4)
        importance = int(task.importance or 4)

        if urgency >= 3 and importance >= 3:
            task.quadrant = 'Q1'
        elif urgency <= 2 and importance >= 3:
            task.quadrant = 'Q2'
        elif urgency >= 3 and importance <= 2:
            task.quadrant = 'Q3'
        else:
            task.quadrant = 'Q4'

        task.save()
        form.save_m2m()

        is_ajax = (
            self.request.headers.get('x-requested-with') == 'XMLHttpRequest' or
            self.request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' or
            self.request.accepts('application/json')
        )

        if is_ajax:
            card_html = render_to_string(
                '_includes/_task_card.html',
                {'task': task, 'request': self.request},
                request=self.request
            )

            return JsonResponse({
                'status': 'success',
                'task_id': task.id,
                'quadrant': task.quadrant,
                'card_html': card_html,
                'date_restriction_applied': date_blocked
            })

        return super().form_valid(form)

    def form_invalid(self, form):
        is_ajax = (
            self.request.headers.get('x-requested-with') == 'XMLHttpRequest' or
            self.request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' or
            self.request.accepts('application/json')
        )
        if is_ajax:
            return JsonResponse({
                'status': 'error',
                'errors': form.errors.get_json_data()
            }, status=400)
        return super().form_invalid(form)
    model = Task
    form_class = TaskForm
    pk_url_kwarg = 'pk'

    def get_queryset(self):
        return Task.objects.filter(
            Q(created_by=self.request.user) |
            Q(assigned_to=self.request.user) |
            Q(board__owner=self.request.user)
        ).distinct()

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        if hasattr(self.object, 'board') and self.object.board:
            kwargs['current_board'] = self.object.board
        return kwargs

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()

        is_ajax = (
            request.headers.get('x-requested-with') == 'XMLHttpRequest' or
            request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' or
            request.accepts('application/json')
        )

        # Si viene del Drag & Drop (solo envía urgencia e importancia, sin título)
        if is_ajax and 'title' not in request.POST:
            urgency = request.POST.get('urgency')
            importance = request.POST.get('importance')

            if urgency is not None and importance is not None:
                self.object.urgency = int(urgency)
                self.object.importance = int(importance)

                # Construimos el formulario rellenando los datos existentes para que pase la validación
                data = {
                    'title': self.object.title,
                    'urgency': self.object.urgency,
                    'importance': self.object.importance,
                    'due_date': self.object.due_date,
                    'description': self.object.description or '',
                }

                kwargs = self.get_form_kwargs()
                kwargs['data'] = data
                kwargs['instance'] = self.object
                form = self.get_form_class()(**kwargs)

                if form.is_valid():
                    return self.form_valid(form)
                else:
                    return self.form_invalid(form)

        return super().post(request, *args, **kwargs)

    def form_valid(self, form):
        task = form.save(commit=False)
        
        if form.cleaned_data.get('reminder_enabled'):
            task.reminder_sent = False

        # RESTRICCIÓN DE NEGOCIO POR FECHA:
        # Si vence en 2 días o menos, forzamos la urgencia a >= 3
        date_blocked = False
        if task.due_date:
            today = timezone.now().date()
            due_date = task.due_date.date() if hasattr(task.due_date, 'date') else task.due_date
            days_left = (due_date - today).days

            if days_left <= 2 and int(task.urgency or 4) <= 2:
                task.urgency = 3  # Fuerza a Urgente
                date_blocked = True

        # Recalcular cuadrante con los valores finales
        urgency = int(task.urgency or 4)
        importance = int(task.importance or 4)

        if urgency >= 3 and importance >= 3:
            task.quadrant = 'Q1'
        elif urgency <= 2 and importance >= 3:
            task.quadrant = 'Q2'
        elif urgency >= 3 and importance <= 2:
            task.quadrant = 'Q3'
        else:
            task.quadrant = 'Q4'

        task.save()
        form.save_m2m()

        is_ajax = (
            self.request.headers.get('x-requested-with') == 'XMLHttpRequest' or
            self.request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' or
            self.request.accepts('application/json')
        )

        if is_ajax:
            card_html = render_to_string(
                '_includes/_task_card.html',
                {'task': task, 'request': self.request},
                request=self.request
            )

            return JsonResponse({
                'status': 'success',
                'task_id': task.id,
                'quadrant': task.quadrant,
                'card_html': card_html,
                'date_restriction_applied': date_blocked
            })

        return super().form_valid(form)

    def form_invalid(self, form):
        is_ajax = (
            self.request.headers.get('x-requested-with') == 'XMLHttpRequest' or
            self.request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' or
            self.request.accepts('application/json')
        )
        if is_ajax:
            return JsonResponse({
                'status': 'error',
                'errors': form.errors.get_json_data()
            }, status=400)
        return super().form_invalid(form)

    
# 3. Eliminar Tarea
class TaskDeleteView(LoginRequiredMixin, DeleteView):
    model = Task
    pk_url_kwarg = 'pk'

    def get_queryset(self):
        # Permite borrar si es el creador, si está asignado o si es el dueño del tablero
        return Task.objects.filter(
            Q(created_by=self.request.user) |
            Q(assigned_to=self.request.user) |
            Q(board__owner=self.request.user)
        ).distinct()

    def get_success_url(self):
        return self.request.META.get('HTTP_REFERER', reverse_lazy('dashboard'))


# 4. Crear tarea rápida desde el cuadrante 
# tasks/views.py

@login_required
@require_POST
def quick_create_task(request):
    title = request.POST.get('title', '').strip()
    urgency = request.POST.get('urgency', 1)
    importance = request.POST.get('importance', 1)
    board_id = request.POST.get('board')

    if title:
        board = None
        if board_id:
            board = Board.objects.filter(id=board_id, owner=request.user).first()

        task = Task.objects.create(
            created_by=request.user,
            title=title,
            urgency=int(urgency),
            importance=int(importance),
            board=board
        )

    return redirect(request.META.get('HTTP_REFERER', 'dashboard'))

# 5. Mover tarea mediante Drag & Drop (SortableJS)
@login_required
@csrf_protect
@require_POST
def update_task_position(request):
    try:
        data = json.loads(request.body)
        task_id = data.get('task_id')
        target_quadrant = data.get('target_quadrant')  # 'Q1', 'Q2', 'Q3', 'Q4' o 'DONE'

        if not task_id or not target_quadrant:
            return JsonResponse({'status': 'error', 'message': 'Parámetros incompletos'}, status=400)

        # Buscar la tarea validando que el usuario tenga permisos sobre ella
        task = get_object_or_404(
            Task.objects.filter(
                Q(created_by=request.user) |
                Q(assigned_to=request.user) |
                Q(board__owner=request.user)
            ).distinct(),
            pk=task_id
        )

        # Mover a la columna de completadas
        if target_quadrant == 'DONE':
            task.is_completed = True
            task.quadrant = 'DONE'

        # Mover/Reactivar hacia un cuadrante de la matriz
        elif target_quadrant in QUADRANT_DEFAULTS:
            task.is_completed = False
            task.quadrant = target_quadrant
            defaults = QUADRANT_DEFAULTS[target_quadrant]
            task.urgency = defaults['urgency']
            task.importance = defaults['importance']

        else:
            return JsonResponse({'status': 'error', 'message': f'Cuadrante no válido: {target_quadrant}'}, status=400)

        task.save()

        return JsonResponse({
            'status': 'success',
            'task_id': task.id,
            'quadrant': task.quadrant,
            'is_completed': task.is_completed
        })

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'JSON no válido'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


# 6. Vaciar tareas completadas
@login_required
def clear_completed_tasks(request):
    if request.method == 'POST':
        time_filter = request.POST.get('time_filter', 'all')
        
        # 1. Obtenemos las tareas base del usuario sin .distinct() al final para poder borrarlas
        base_tasks = Task.objects.filter(
            Q(created_by=request.user) |
            Q(assigned_to=request.user) |
            Q(board__owner=request.user),
            is_completed=True
        )

        # 2. Aplicamos el filtro de tiempo si es necesario
        if time_filter == 'today':
            today = timezone.now().date()
            base_tasks = base_tasks.filter(updated_at__date=today)
        elif time_filter == 'week':
            seven_days_ago = timezone.now() - timedelta(days=7)
            base_tasks = base_tasks.filter(updated_at__gte=seven_days_ago)

        # 3. Borramos los elementos únicos usando una subconsulta o extrayendo los IDs limpios
        task_ids = base_tasks.values_list('id', flat=True).distinct()
        Task.objects.filter(id__in=task_ids).delete()

    return redirect('dashboard')