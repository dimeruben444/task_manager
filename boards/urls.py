# boards/urls.py
from django.urls import path
from .views import BoardCreateView, BoardUpdateView, BoardDeleteView
from boards.views import search_users_api
from . import views

urlpatterns = [
    path('create/', BoardCreateView.as_view(), name='create_board'),
    path('edit/<int:board_id>/', BoardUpdateView.as_view(), name='edit_board'),
    path('delete/<int:board_id>/', BoardDeleteView.as_view(), name='delete_board'),

    path('board/<int:board_id>/invite/', views.invite_to_board, name='invite_to_board'),
    path('invitation/<int:invitation_id>/accept/', views.accept_invitation, name='accept_invitation'),
    path('invitation/<int:invitation_id>/reject/', views.reject_invitation, name='reject_invitation'),
    path('notification/<int:notification_id>/delete/', views.delete_notification, name='delete_notification'),

    path('api/search-users/', search_users_api, name='search_users_api'),
    path('api/unread-notifications-count/', views.unread_notifications_count_api, name='unread_notifications_count_api'),
]