from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.views.generic import CreateView, DeleteView, UpdateView

from tasks.forms import TaskForm
from tasks.models import Task

from .forms import BoardForm
from .models import Board

User = get_user_model()


@login_required
def dashboard_view(request, board_id=None):

    # 1. Tableros propios del usuario (ordenando el predeterminado primero)
    user_boards = Board.objects.filter(owner=request.user).order_by('-is_default', 'id')
    default_board = user_boards.filter(is_default=True).first()

    # 2. Tableros compartidos (SOLO personalizados, se excluyen los tableros 'General' de otros)
    shared_boards = Board.objects.filter(
        tasks__assigned_to=request.user,
        is_default=False
    ).exclude(owner=request.user).distinct()

    current_board = None

    if board_id:
        # Se aplica .distinct() antes de pasarlo a get_object_or_404
        board_queryset = Board.objects.filter(
            Q(id=board_id) & (Q(owner=request.user) | Q(tasks__assigned_to=request.user))
        ).distinct()

        current_board = get_object_or_404(board_queryset)

        base_tasks = Task.objects.filter(
            Q(board=current_board) & (Q(board__owner=request.user) | Q(assigned_to=request.user))
        ).distinct()
    else:
        # En la raíz (/), muestra tareas de tableros propios O asignadas al usuario
        base_tasks = Task.objects.filter(
            Q(board__owner=request.user) | Q(assigned_to=request.user)
        ).distinct()

    has_shared_tasks = base_tasks.filter(~Q(created_by=request.user)).exists()

    if request.method == 'POST':
        form = TaskForm(request.POST, user=request.user, current_board=current_board)
        if form.is_valid():
            task = form.save(commit=False)
            task.created_by = request.user
            
            if not task.board:
                task.board = current_board or default_board
                
            task.save()

            assigned_users = form.cleaned_data.get('assigned_to')
            if assigned_users:
                task.assigned_to.set(assigned_users)
            else:
                task.assigned_to.add(request.user)

            return redirect('dashboard_board', board_id=board_id) if board_id else redirect('dashboard')
        else:
            print("❌ ERRORES DEL FORMULARIO:", form.errors)
    else: 
        form = TaskForm(user=request.user, current_board=current_board)

    active_tasks = base_tasks.filter(is_completed=False)
    
    context = {
        'form': form,
        'board_form': BoardForm(),
        'boards': user_boards,
        'shared_boards': shared_boards,
        'users': User.objects.all(),
        'current_board': current_board,
        'default_board': default_board,
        'has_shared_tasks': has_shared_tasks,
        'q1_tasks': active_tasks.filter(quadrant='Q1'),
        'q2_tasks': active_tasks.filter(quadrant='Q2'),
        'q3_tasks': active_tasks.filter(quadrant='Q3'),
        'q4_tasks': active_tasks.filter(quadrant='Q4'),
        'done_tasks': base_tasks.filter(is_completed=True)[:10],
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