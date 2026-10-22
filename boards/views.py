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


# boards/views.py

@login_required
def dashboard_view(request, board_id=None):

    # 1. Tableros propios del usuario
    user_boards = Board.objects.filter(owner=request.user).order_by('-is_default', 'id')
    default_board = user_boards.filter(is_default=True).first()

    # 2. Tableros compartidos
    shared_boards = Board.objects.filter(members=request.user).distinct()

    current_board = None

    if board_id:
        board_queryset = Board.objects.filter(
            Q(id=board_id) & (Q(owner=request.user) | Q(members=request.user))
        ).distinct()

        current_board = get_object_or_404(board_queryset)

        base_tasks = Task.objects.filter(board=current_board)
    else:
        # En la raíz (/), muestra tareas de tableros propios O asignadas al usuario O de tableros compartidos
        base_tasks = Task.objects.filter(
            Q(board__owner=request.user) | Q(board__members=request.user) | Q(assigned_to=request.user)
        ).distinct()

        task_filter = request.GET.get('filter', 'all')
        
        if task_filter == 'mine':
            # 👤 Mis tareas: Creadas por el usuario actual
            base_tasks = base_tasks.filter(created_by=request.user)
        elif task_filter == 'shared':
            # 🤝 Asignadas: Tareas asignadas directamente O pertenecientes a tableros compartidos (excluyendo creadas por él)
            base_tasks = base_tasks.filter(
                Q(assigned_to=request.user) |
                Q(board__members=request.user) |
                (Q(board__owner=request.user) & Q(board__members__isnull=False))
            ).distinct()
        # Si es 'all', muestra todas sin aplicar exclusiones adicionales

    has_shared_tasks = base_tasks.filter(~Q(created_by=request.user)).exists()

    if request.method == 'POST':
        form = TaskForm(request.POST, user=request.user, current_board=current_board)
        if form.is_valid():
            task = form.save(commit=False)
            task.created_by = request.user
            
            # Validar y asignar el tablero (soporta tableros propios y compartidos como miembro)
            selected_board = form.cleaned_data.get('board')
            if selected_board:
                is_owner = selected_board.owner == request.user
                is_member = selected_board.members.filter(id=request.user.id).exists()
                
                if is_owner or is_member:
                    task.board = selected_board
                else:
                    task.board = current_board or default_board
            else:
                task.board = current_board or default_board
                
            task.save()

            assigned_users = form.cleaned_data.get('assigned_to')
            if assigned_users:
                task.assigned_to.set(assigned_users)

            return redirect('dashboard_board', board_id=board_id) if board_id else redirect('dashboard')
        else:
            print("❌ ERRORES DEL FORMULARIO:", form.errors)
    else: 
        form = TaskForm(user=request.user, current_board=current_board)

    # === EXTRACCIÓN DE IDs ÚNICOS (ELIMINA DUPLICADOS DE JOIN M2M) ===
    active_task_ids = list(base_tasks.filter(is_completed=False).values_list('id', flat=True).distinct())
    completed_task_ids = list(base_tasks.filter(is_completed=True).values_list('id', flat=True).distinct())

    active_tasks = Task.objects.filter(id__in=active_task_ids).order_by('created_at')
    completed_tasks = Task.objects.filter(id__in=completed_task_ids).order_by('-updated_at')[:15]
    # =================================================================

    # Clasificación en listas para las columnas del tablero
    q1_list = list(active_tasks.filter(urgency__gte=3, importance__gte=3))
    q2_list = list(active_tasks.filter(urgency__lt=3, importance__gte=3))
    q3_list = list(active_tasks.filter(urgency__gte=3, importance__lt=3))
    q4_list = list(active_tasks.filter(urgency__lt=3, importance__lt=3))

    context = {
        'form': form,
        'board_form': BoardForm(),
        'boards': user_boards,
        'shared_boards': shared_boards,
        'users': User.objects.all(),
        'current_board': current_board,
        'default_board': default_board,
        'has_shared_tasks': has_shared_tasks,
        
        # Listas de tareas activas por cuadrante
        'q1_tasks': q1_list,
        'q2_tasks': q2_list,
        'q3_tasks': q3_list,
        'q4_tasks': q4_list,
        'completed_tasks': completed_tasks,

        # Conteos numéricos para el bloque "DISTRIBUCIÓN ACTUAL" del sidebar
        'q1_count': len(q1_list),
        'q2_count': len(q2_list),
        'q3_count': len(q3_list),
        'q4_count': len(q4_list),
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
        return Board.objects.filter(Q(owner=self.request.user) | Q(members=self.request.user)).distinct()

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

        members_ids = request.POST.getlist('members')
        board.members.set(members_ids)

        return redirect('dashboard_board', board_id=board.id)


class BoardDeleteView(LoginRequiredMixin, DeleteView):
    model = Board
    pk_url_kwarg = 'board_id'
    success_url = reverse_lazy('dashboard')

    def get_queryset(self):
        return Board.objects.filter(owner=self.request.user, is_default=False)