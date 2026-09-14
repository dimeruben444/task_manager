# boards/urls.py
from django.urls import path
from .views import BoardCreateView, BoardUpdateView, BoardDeleteView

urlpatterns = [
    path('create/', BoardCreateView.as_view(), name='create_board'),
    path('edit/<int:board_id>/', BoardUpdateView.as_view(), name='edit_board'),
    path('delete/<int:board_id>/', BoardDeleteView.as_view(), name='delete_board'),
]