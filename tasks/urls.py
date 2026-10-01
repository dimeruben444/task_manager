# tasks/urls.py
from django.urls import path
from boards.views import dashboard_view
from . import views
from .views import (
    ToggleTaskDoneView, 
    TaskUpdateView, 
    TaskDeleteView,
    quick_create_task
)

urlpatterns = [
    path('', dashboard_view, name='dashboard'),
    path('board/<int:board_id>/', dashboard_view, name='dashboard_board'),
    
    # Rutas CRUD de Tareas
    path('task/<int:pk>/toggle/', ToggleTaskDoneView.as_view(), name='toggle_task'),
    path('task/<int:pk>/edit/', TaskUpdateView.as_view(), name='edit_task'),
    path('task/<int:pk>/delete/', TaskDeleteView.as_view(), name='delete_task'),
    path('tasks/<int:pk>/toggle/', ToggleTaskDoneView.as_view(), name='toggle_task_done'),
    path('tasks/quick-create/', views.quick_create_task, name='quick_create_task'),
    path('tasks/clear-completed/', views.clear_completed_tasks, name='clear_completed_tasks'),
    path('tasks/move/', views.update_task_position, name='update_task_position'),
]