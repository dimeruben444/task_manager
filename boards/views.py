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
from .models import Board, BoardInvitation, Notification

from django.utils import timezone
from datetime import timedelta

from django.contrib import messages

User = get_user_model()


# boards/views.py

@login_required
def dashboard_view(request, board_id=None):

    # Mantenimiento para el despliegue Limpia tareas completadas hace más de 30 días del usuario 
    limite = timezone.now() - timedelta(days=30)
    Task.objects.filter(
        created_by=request.user, 
        is_completed=True, 
        updated_at__lte=limite
    ).delete()

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
            # 👤 Mis tareas: 
            # 1. Tareas asignadas explícitamente al usuario actual (en cualquier tablero)
            # 2. O tareas creadas por él EN TABLEROS PRIVADOS/PERSONALES (sin más miembros) donde no esté asignado a otra persona
            base_tasks = base_tasks.filter(
                Q(assigned_to=request.user) |
                (
                    Q(created_by=request.user) & 
                    (Q(board__isnull=True) | Q(board__members__isnull=True)) &
                    (Q(assigned_to__isnull=True) | Q(assigned_to=request.user))
                )
            ).distinct()

        elif task_filter == 'shared':
            # 🤝 Compartidas / Equipo: Tareas en tableros con miembros o asignadas
            base_tasks = base_tasks.filter(
                Q(assigned_to=request.user) |
                Q(board__members=request.user) |
                (Q(board__owner=request.user) & Q(board__members__isnull=False))
            ).distinct()
        # Si es 'all', muestra todas las tareas accesibles

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




#invitacxiones
@login_required
def invite_to_board(request, board_id):
    board = get_object_or_404(Board, id=board_id)
    
    # Solo el dueño o miembros actuales pueden invitar
    if board.owner != request.user and request.user not in board.members.all():
        messages.error(request, "No tienes permiso para invitar a este tablero.")
        return redirect('board_detail', board_id=board.id)

    if request.method == 'POST':
        identifier = request.POST.get('identifier', '').strip()

        # Buscar usuario por username o email exacto
        receiver = User.objects.filter(
            Q(username__iexact=identifier) | Q(email__iexact=identifier)
        ).first()

        if not receiver:
            messages.error(request, "No se encontró ningún usuario con ese nombre o correo.")
        elif receiver == request.user:
            messages.warning(request, "No puedes invitarte a ti mismo.")
        elif receiver in board.members.all() or receiver == board.owner:
            messages.info(request, "Este usuario ya pertenece al tablero.")
        else:
            # Crear la invitación (o recuperarla si ya existía una pendiente)
            invitation, created = BoardInvitation.objects.get_or_create(
                board=board,
                receiver=receiver,
                status='pending',
                defaults={'sender': request.user}
            )

            if created:
                # Crear la notificación para la persona invitada
                Notification.objects.create(
                    recipient=receiver,
                    actor=request.user,
                    notification_type='invitation',
                    verb=f"te ha invitado a unirte al tablero '{board.title}'",
                    target_board=board,
                    invitation=invitation
                )
                messages.success(request, f"Invitación enviada a {receiver.username}.")
            else:
                messages.info(request, f"Ya hay una invitación pendiente para {receiver.username}.")

    return redirect('board_detail', board_id=board.id)


@login_required
def accept_invitation(request, invitation_id):
    invitation = get_object_or_404(BoardInvitation, id=invitation_id, receiver=request.user, status='pending')
    
    # 1. Añadir al usuario como miembro del tablero
    invitation.board.members.add(request.user)
    
    # 2. Actualizar el estado de la invitación
    invitation.status = 'accepted'
    invitation.save()
    
    # 3. Marcar la notificación correspondiente como leída
    Notification.objects.filter(invitation=invitation).update(is_read=True)
    
    messages.success(request, f"Te has unido al tablero '{invitation.board.title}'.")
    return redirect('board_detail', board_id=invitation.board.id)


@login_required
def reject_invitation(request, invitation_id):
    invitation = get_object_or_404(BoardInvitation, id=invitation_id, receiver=request.user, status='pending')
    
    # 1. Marcar como rechazada
    invitation.status = 'rejected'
    invitation.save()
    
    # 2. Marcar la notificación como leída
    Notification.objects.filter(invitation=invitation).update(is_read=True)
    
    messages.info(request, f"Has rechazado la invitación al tablero '{invitation.board.title}'.")
    return redirect('dashboard')  # O la vista principal donde esté el usuario