from django.shortcuts import render, redirect
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext_lazy as _
from .forms import CustomUserCreationForm

from django.contrib.auth import logout
from django.http import HttpResponse

import json



# REGISTRO DE USUARIOS
def register_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            
            # Pasamos explícitamente el backend de autenticación
            login(request, user, backend='users.backends.EmailOrUsernameModelBackend')
            
            messages.success(request, '¡Cuenta creada con éxito!')
            return redirect('dashboard')
    else:
        form = CustomUserCreationForm()

    return render(request, 'registration/register.html', {'form': form})



# ACTUALIZACIÓN DE PERFIL (NOMBRE, APELLIDOS, EMAIL)
@login_required
def update_profile_view(request):
    if request.method == 'POST':
        user = request.user
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip()

        if first_name and email:
            user.first_name = first_name
            user.last_name = last_name
            user.email = email
            user.save()
            messages.success(request, _("Tu perfil se ha actualizado correctamente."))
        else:
            messages.error(request, _("Por favor, rellena todos los campos obligatorios."))

    return redirect('dashboard')



# CAMBIO DE CONTRASEÑA DE USUARIO
@login_required
def change_password_view(request):
    if request.method == 'POST':
        old_pw = request.POST.get('old_password')
        new_pw = request.POST.get('new_password')
        confirm_pw = request.POST.get('confirm_password')

        if not request.user.check_password(old_pw):
            messages.error(request, _("La contraseña actual no es correcta."))
        elif new_pw != confirm_pw:
            messages.error(request, _("Las nuevas contraseñas no coinciden."))
        elif len(new_pw) < 6:
            messages.error(request, _("La nueva contraseña debe tener al menos 6 caracteres."))
        else:
            request.user.set_password(new_pw)
            request.user.save()
            # Mantiene la sesión del usuario activa tras el cambio de contraseña
            update_session_auth_hash(request, request.user)
            messages.success(request, _("Tu contraseña ha sido actualizada con éxito."))

    return redirect('dashboard')

@login_required
def export_user_data(request):
    """Genera un archivo JSON descargable con todos los datos del usuario (RGPD Portabilidad)."""
    user = request.user
    
    # Recopilar tableros y tareas asociadas
    data = {
        "user_profile": {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "date_joined": str(user.date_joined),
        },
        "boards": []
    }

    if hasattr(user, 'boards'):
        for board in user.boards.all():
            board_data = {
                "title": board.title,
                "created_at": str(board.created_at) if hasattr(board, 'created_at') else None,
                "tasks": []
            }
            for task in board.tasks.all():
                board_data["tasks"].append({
                    "title": task.title,
                    "description": getattr(task, 'description', ''),
                    "urgency": task.urgency,
                    "importance": task.importance,
                    "is_completed": task.is_completed,
                    "created_at": str(task.created_at) if hasattr(task, 'created_at') else None,
                })
            data["boards"].append(board_data)

    response = HttpResponse(
        json.dumps(data, indent=4, ensure_ascii=False),
        content_type="application/json"
    )
    response['Content-Disposition'] = f'attachment; filename="eisenhowerflow_export_{user.username}.json"'
    return response


@login_required
def delete_account_view(request):
    """Elimina la cuenta del usuario tras verificar su contraseña (RGPD Supresión)."""
    if request.method == 'POST':
        password = request.POST.get('password_confirm')
        user = request.user
        
        if user.check_password(password):
            logout(request)
            user.delete()
            messages.success(request, 'Tu cuenta y todos tus datos asociados han sido eliminados permanentemente.')
            return redirect('login')
        else:
            messages.error(request, 'La contraseña introducida es incorrecta. No se ha podido eliminar la cuenta.')
            
    return redirect('dashboard')