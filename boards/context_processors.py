# boards/context_processors.py
from .models import Notification

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