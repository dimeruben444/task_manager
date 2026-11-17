from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Notification, Board

User = get_user_model()


def notifications_context(request):
    if not request.user.is_authenticated:
        return {'notifications_list': [], 'unread_notifications_count': 0}

    unread_qs = (
        Notification.objects.filter(recipient=request.user, is_read=False)
        .select_related('actor', 'target_board', 'target_task', 'invitation')
        .order_by('-created_at')
    )
    notifications_list = list(unread_qs[:10])
    total_unread = len(notifications_list) if len(notifications_list) < 10 else unread_qs.count()

    return {
        'notifications_list': notifications_list,
        'unread_notifications_count': total_unread,
    }


def frequent_collaborators_context(request):
    if not request.user.is_authenticated:
        return {}

    collaborators = (
        User.objects.filter(
            Q(shared_boards__owner=request.user) |
            Q(boards__members=request.user) |
            Q(shared_boards__members=request.user)
        )
        .exclude(id=request.user.id)
        .distinct()
    )

    return {'frequent_collaborators': collaborators}