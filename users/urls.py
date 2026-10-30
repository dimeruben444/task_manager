from django.urls import path
from . import views
from .views import delete_account_view, export_user_data

from django.contrib.auth import views as auth_views

app_name = 'users'

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('profile/update/', views.update_profile_view, name='update_profile'),
    path('profile/password/', views.change_password_view, name='change_password'),
    path('export-data/', export_user_data, name='export_data'),
    path('delete-account/', delete_account_view, name='delete_account'),

    #RUTAS DE RECUPERACIÓN DE CONTRASEÑA
    path('reset-password/', auth_views.PasswordResetView.as_view(
        template_name='registration/password_reset_form.html',
        email_template_name='registration/password_reset_email.html',
        subject_template_name='registration/password_reset_subject.txt',
        success_url='/users/reset-password/done/'
    ), name='password_reset'),
    
    path('reset-password/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='registration/password_reset_done.html'
    ), name='password_reset_done'),
    
    path('reset-password/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='registration/password_reset_confirm.html'
    ), name='password_reset_confirm'),
    
    path('reset-password/complete/', auth_views.PasswordResetCompleteView.as_view(
        template_name='registration/password_reset_complete.html'
    ), name='password_reset_complete'),


]