# boards/context_processors.py
from .models import Notification
from django.contrib.auth import get_user_model
from boards.models import Board

User = get_user_model()


def notifications_context(request):
    if request.user.is_authenticated:
        unread_notifications = Notification.objects.filter(
            recipient=request.user, 
            is_read=False
        )
        return {
            'notifications_list': unread_notifications[:10], # Mostramos las 10 últimas
            'unread_notifications_count': unread_notifications.count()
        }
    return {
        'notifications_list': [],
        'unread_notifications_count': 0
    }



def frequent_collaborators_context(request):
    if not request.user.is_authenticated:
        return {}

    # Obtener los tableros donde el usuario es dueño o miembro
    user_boards = Board.objects.filter(
        owner=request.user
    ) | Board.objects.filter(members=request.user)

    # Extraer todos los miembros y dueños de esos tableros
    collaborator_ids = set()
    for board in user_boards.distinct():
        collaborator_ids.add(board.owner_id)
        collaborator_ids.update(board.members.values_list('id', flat=True))

    # Excluir al propio usuario
    collaborators = User.objects.filter(id__in=collaborator_ids).exclude(id=request.user.id)

    return {
        'frequent_collaborators': collaborators
    }