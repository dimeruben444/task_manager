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
from django.db.models import Case, When, Value, IntegerField, Count

from django.http import JsonResponse

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

    # 3. Consulta unificada con ordenación garantizada (Personales 0, Compartidos 1)
    all_boards = Board.objects.filter(
        Q(owner=request.user) | Q(members=request.user)
    ).annotate(
        members_count=Count('members'),
        is_shared=Case(
            # Si NO es el propietario OR el tablero TIENE miembros -> Considerar COMPARTIDO (1)
            When(Q(members_count__gt=0) | ~Q(owner=request.user), then=Value(1)),
            # Si es el propietario Y NO tiene miembros -> Considerar PERSONAL (0)
            default=Value(0),
            output_field=IntegerField(),
        )
    ).order_by('is_shared', '-is_default', 'created_at').distinct()

    current_board = None

    if board_id:
        current_board = Board.objects.filter(
            Q(id=board_id) & (Q(owner=request.user) | Q(members=request.user))
        ).distinct().first()

        # Si el tablero no existe o el usuario ha dejado de ser miembro/propietario
        if not current_board:
            messages.warning(request, "Ya no tienes acceso a este tablero o ha sido eliminado.")
            return redirect('dashboard')

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

    
    # FILTRADO DE MIEMBROS PARA ASIGNACIÓN DE TAREAS
   
    # Obtiene usuarios con los que has compartido tablero o tareas alguna vez
    collaborator_ids = set(
        User.objects.filter(
            Q(shared_boards__owner=request.user) |        # Miembros de mis tableros
            Q(boards__members=request.user) |             # Dueños de tableros donde soy miembro
            Q(assigned_tasks__created_by=request.user) |  # Personas a las que les he creado/asignado tareas
            Q(created_tasks__assigned_to=request.user)    # Personas que me han asignado tareas a mí
        ).values_list('id', flat=True)
    )

    # Añadimos al propio usuario activo
    collaborator_ids.add(request.user.id)

    # Cargar los objetos User de la red de contactos
    board_members = User.objects.filter(id__in=collaborator_ids).distinct()

    context = {
        'form': form,
        'board_form': BoardForm(),
        'boards': all_boards,          # Lista unificada y ordenada (Personales -> Compartidos)
        'user_boards': user_boards,    # Mapeo retrocompatible para tableros propios
        'shared_boards': shared_boards,# Mapeo retrocompatible para tableros compartidos
        
        # 🚀 Filtro de miembros aplicado manteniendo compatibilidad con ambos nombres
        'board_members': board_members,
        'users': board_members,        
        
        'current_board': current_board,
        'default_board': default_board,
        'has_shared_tasks': has_shared_tasks,
        'has_shared_boards': any(b.members.exists() or b.owner != request.user for b in all_boards if not b.is_default),
        
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
        # 1. Asignar propietario, color y descripción desde la petición
        form.instance.owner = self.request.user
        
        color = self.request.POST.get('color')
        if color:
            form.instance.color = color
            
        description = self.request.POST.get('description', '').strip()
        if description:
            form.instance.description = description

        # Guardar el tablero primero
        response = super().form_valid(form)
        board = self.object

        # 2. Obtener lista de usuarios invitados (soporta array de inputs o lista separada por comas)
        invited_list = self.request.POST.getlist('invited_users')
        
        raw_identifier = self.request.POST.get('invite_identifier', '').strip()
        if not invited_list and raw_identifier:
            invited_list = [item.strip() for item in raw_identifier.split(',') if item.strip()]

        # 3. Procesar invitaciones para cada usuario seleccionado
        if invited_list:
            for identifier in invited_list:
                target_user = User.objects.filter(
                    Q(username=identifier) | Q(email=identifier)
                ).exclude(id=self.request.user.id).first()

                if target_user:
                    # Crear la invitación usando 'receiver'
                    invitation, created = BoardInvitation.objects.get_or_create(
                        board=board,
                        sender=self.request.user,
                        receiver=target_user,
                        defaults={'status': 'pending'}
                    )

                    # Notificación para el invitado usando 'recipient'
                    Notification.objects.create(
                        recipient=target_user,
                        actor=self.request.user,
                        notification_type='invitation',
                        verb=f"te ha invitado a unirte al tablero '{board.title}'",
                        target_board=board,
                        invitation=invitation
                    )
                else:
                    messages.warning(
                        self.request, 
                        f"No se pudo enviar invitación a '{identifier}': usuario no encontrado."
                    )

        return response

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

        # 1. Gestionar lista de miembros activos en los checkboxes
        members_ids = request.POST.getlist('members')
        board.members.set(members_ids)

        # 2. Capturar invitaciones (soporta array 'invited_users' o string por comas 'invite_identifier')
        invited_list = request.POST.getlist('invited_users')
        raw_identifier = request.POST.get('invite_identifier', '').strip()

        if not invited_list and raw_identifier:
            invited_list = [item.strip() for item in raw_identifier.split(',') if item.strip()]

        if invited_list:
            for identifier in invited_list:
                # Buscar usuario por username o email exacto
                target_user = User.objects.filter(
                    Q(username__iexact=identifier) | Q(email__iexact=identifier)
                ).exclude(id=request.user.id).first()

                if target_user and target_user not in board.members.all() and target_user != board.owner:
                    invitation, created = BoardInvitation.objects.get_or_create(
                        board=board,
                        sender=request.user,
                        receiver=target_user,
                        defaults={'status': 'pending'}
                    )

                    if created:
                        Notification.objects.create(
                            recipient=target_user,
                            actor=request.user,
                            notification_type='invitation',
                            verb=f"te ha invitado a unirte al tablero '{board.title}'",
                            target_board=board,
                            invitation=invitation
                        )

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
        return redirect('dashboard_board', board_id=board.id)

    if request.method == 'POST':
        identifier = request.POST.get('identifier', '').strip()

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
            invitation, created = BoardInvitation.objects.get_or_create(
                board=board,
                receiver=receiver,
                status='pending',
                defaults={'sender': request.user}
            )

            if created:
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

    return redirect('dashboard_board', board_id=board.id)


@login_required
def accept_invitation(request, invitation_id):
    invitation = get_object_or_404(BoardInvitation, id=invitation_id, receiver=request.user)
    
    # 1. Añadir al usuario como miembro activo del tablero
    invitation.board.members.add(request.user)
    
    # 2. Manejo seguro del estado para evitar IntegrityError por unicidad
    if invitation.status != 'accepted':
        # Eliminar registros previos con estado 'accepted' para este usuario y tablero si existían
        BoardInvitation.objects.filter(
            board=invitation.board,
            receiver=request.user,
            status='accepted'
        ).exclude(id=invitation.id).delete()
        
        invitation.status = 'accepted'
        invitation.save()
    
    # 3. Marcar las notificaciones asociadas como leídas
    Notification.objects.filter(invitation=invitation).update(is_read=True)
    
    messages.success(request, f"Te has unido al tablero '{invitation.board.title}'.")
    return redirect('dashboard_board', board_id=invitation.board.id)


@login_required
def reject_invitation(request, invitation_id):
    invitation = get_object_or_404(BoardInvitation, id=invitation_id, receiver=request.user)
    
    # 1. Manejo seguro del rechazo
    if invitation.status != 'rejected':
        BoardInvitation.objects.filter(
            board=invitation.board,
            receiver=request.user,
            status='rejected'
        ).exclude(id=invitation.id).delete()
        
        invitation.status = 'rejected'
        invitation.save()
    
    # 2. Marcar las notificaciones asociadas como leídas
    Notification.objects.filter(invitation=invitation).update(is_read=True)
    
    messages.info(request, f"Has rechazado la invitación al tablero '{invitation.board.title}'.")
    return redirect('dashboard')
    

# boards/views.py
@login_required
def delete_notification(request, notification_id):
    if request.method == 'POST':
        notification = get_object_or_404(Notification, id=notification_id, recipient=request.user)
        notification.delete()
    return redirect(request.META.get('HTTP_REFERER', 'dashboard'))



@login_required
def search_users_api(request):
    """Endpoint AJAX para buscar usuarios globales al asignar tareas."""
    query = request.GET.get('q', '').strip()
    if len(query) < 2:
        return JsonResponse({'users': []})

    # Búsqueda global por username, nombre, apellidos o email
    users = User.objects.filter(
        Q(username__icontains=query) | 
        Q(first_name__icontains=query) | 
        Q(last_name__icontains=query) | 
        Q(email__icontains=query)
    ).exclude(id=request.user.id)[:10]

    users_data = [
        {
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'full_name': u.get_full_name() or u.username,
            'initials': (u.username[:2]).upper()
        }
        for u in users
    ]

    return JsonResponse({'users': users_data})

#actualiza las notificaciones
@login_required
def unread_notifications_count_api(request):
    """Devuelve la cantidad de notificaciones no leídas para la campana en tiempo real."""
    count = Notification.objects.filter(recipient=request.user, is_read=False).count()
    return JsonResponse({'unread_count': count})