from django.urls import path
from boards.views import dashboard_view
from . import views
from .views import ToggleTaskDoneView, TaskUpdateView, TaskDeleteView

urlpatterns = [
    path('', dashboard_view, name='dashboard'),
    path('board/<int:board_id>/', dashboard_view, name='dashboard_board'),

    # Rutas CRUD de Tareas
    path('task/<int:pk>/toggle/', ToggleTaskDoneView.as_view(), name='toggle_task'),
    path('task/<int:pk>/edit/', TaskUpdateView.as_view(), name='edit_task'),
    path('task/<int:pk>/delete/', TaskDeleteView.as_view(), name='delete_task'),

    path('quick-create/', views.quick_create_task, name='quick_create_task'),
    path('clear-completed/', views.clear_completed_tasks, name='clear_completed_tasks'),
    path('move/', views.update_task_position, name='update_task_position'),
    path('search/', views.search_tasks_api, name='search_tasks_api'),

    # Rutas de API Notificaciones
    path('api/unread-notifications-count/', views.unread_notifications_count, name='unread_notifications_count'),
    path('api/notifications-list-html/', views.notifications_list_html, name='notifications_list_html'),

    # Endpoint Cron Recordatorios
    path('cron/send-reminders/', views.trigger_email_reminders, name='trigger_email_reminders'),
]