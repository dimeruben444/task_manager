# tasks/urls.py
from django.urls import path
from boards.views import dashboard_view
from .views import (
    ToggleTaskDoneView, 
    TaskUpdateView, 
    TaskDeleteView
)

urlpatterns = [
    path('', dashboard_view, name='dashboard'),
    path('board/<int:board_id>/', dashboard_view, name='dashboard_board'),
    
    # Rutas CRUD de Tareas
    path('task/<int:pk>/toggle/', ToggleTaskDoneView.as_view(), name='toggle_task'),
    path('task/<int:pk>/edit/', TaskUpdateView.as_view(), name='edit_task'),
    path('task/<int:pk>/delete/', TaskDeleteView.as_view(), name='delete_task'),
]