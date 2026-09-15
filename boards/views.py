from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.views.generic import CreateView, DeleteView, UpdateView

from tasks.forms import TaskForm
from tasks.models import Task

from .forms import BoardForm
from .models import Board


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
        else:
            print("❌ ERRORES DEL FORMULARIO:", form.errors)
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




class BoardCreateView(LoginRequiredMixin, CreateView):
    model = Board
    form_class = BoardForm
    
    def form_valid(self, form):
        form.instance.owner = self.request.user
        return super().form_valid(form)

    def form_invalid(self, form):
        print("❌ Error al crear tablero:", form.errors)
        return redirect('dashboard')

    def get_success_url(self):
        return reverse_lazy('dashboard_board', kwargs={'board_id': self.object.id})


class BoardUpdateView(LoginRequiredMixin, UpdateView):
    model = Board
    form_class = BoardForm
    pk_url_kwarg = 'board_id'

    def get_queryset(self):
        return Board.objects.filter(owner=self.request.user)

    def post(self, request, *args, **kwargs):
        board = self.get_object()
        title = request.POST.get('title')
        color = request.POST.get('color')
        description = request.POST.get('description')

        if title:
            board.title = title
            if color:
                board.color = color
            board.description = description
            board.save()

        return redirect('dashboard_board', board_id=board.id)


class BoardDeleteView(LoginRequiredMixin, DeleteView):
    model = Board
    pk_url_kwarg = 'board_id'
    success_url = reverse_lazy('dashboard')

    def get_queryset(self):
        return Board.objects.filter(owner=self.request.user, is_default=False)