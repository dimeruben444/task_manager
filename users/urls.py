from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('profile/update/', views.update_profile_view, name='update_profile'),
    path('profile/password/', views.change_password_view, name='change_password'),
]