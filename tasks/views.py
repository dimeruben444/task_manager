from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required  
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import UpdateView, DeleteView, View
from django.urls import reverse_lazy
from .models import Task
from .forms import TaskForm
from boards.models import Board
from boards.forms import BoardForm
# Create your views here.


@login_required
def dashboard_view(request, board_id=None):

    # Obtiene todos los tableros del usuario logueado ordenando primero el predeterminado (General)
    user_boards = Board.objects.filter(owner=request.user).order_by('-is_default', 'id')
    default_board = user_boards.filter(is_default=True).first()
    current_board = None

    if board_id:   # Si hay un ID en la URL, busca ese tablero asegurándose de que pertenezca al usuario
        current_board = get_object_or_404(Board, id=board_id, owner=request.user)
        base_tasks = Task.objects.filter(board=current_board) # filtra solo las tareas de ese tablero.
    else:   # Si estamos en la raíz / recupera todas las tareas de todos los tableros del usuario 
        base_tasks = Task.objects.filter(board__owner=request.user)

    if request.method == 'POST': # solo se activa cuando el usuario pulsa añadir tarea 
        form = TaskForm(request.POST, user=request.user, current_board=current_board)
        if form.is_valid():
            task = form.save(commit=False) # Crea la instancia de la tarea en memoria sin guardarla db para poder asignarle campos adicionales.
            task.assigned_to = request.user # asigna al usuario como propietario de la tarea 
            
            if not task.board: # si no se desplegó opción de tablero personalizado se le asigna al tablero que haya en pantalla o al General
                task.board = current_board or default_board
                
            task.save() # guardado definitivo
            return redirect('dashboard_board', board_id=board_id) if board_id else redirect('dashboard')
    else: # cuando el usuario entra por primera vez a la página crea un task form limpio 
        form = TaskForm(user=request.user, current_board=current_board)

    active_tasks = base_tasks.filter(is_completed=False) # coge las tareas no completadas 
    
    context = {
        'form': form,
        'board_form': BoardForm(),
        'boards': user_boards,
        'current_board': current_board,
        'default_board': default_board,
        'q1_tasks': active_tasks.filter(quadrant='Q1'),
        'q2_tasks': active_tasks.filter(quadrant='Q2'),
        'q3_tasks': active_tasks.filter(quadrant='Q3'),
        'q4_tasks': active_tasks.filter(quadrant='Q4'),
        'done_tasks': base_tasks.filter(is_completed=True)[:10], # recoge las ultimas 10 tareas completadas 
    }

    return render(request, 'tasks/dashboard.html', context)


# Vistas para el CRUD de Tareas
class ToggleTaskDoneView(LoginRequiredMixin, View):
    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk, owner=request.user)
        task.is_done = not task.is_done
        task.save()
        return redirect(request.META.get('HTTP_REFERER', 'dashboard'))


class TaskUpdateView(LoginRequiredMixin, UpdateView):
    model = Task
    form_class = TaskForm
    pk_url_kwarg = 'pk'

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)

    def form_valid(self, form):
        form.save()
        return redirect(self.request.META.get('HTTP_REFERER', 'dashboard'))

    def form_invalid(self, form):
        print("❌ Error al editar tarea:", form.errors)
        return redirect(self.request.META.get('HTTP_REFERER', 'dashboard'))


class TaskDeleteView(LoginRequiredMixin, DeleteView):
    model = Task
    pk_url_kwarg = 'pk'

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)

    def get_success_url(self):
        return self.request.META.get('HTTP_REFERER', reverse_lazy('dashboard'))