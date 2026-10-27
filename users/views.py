from django.shortcuts import render, redirect
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext_lazy as _
from .forms import CustomUserCreationForm


# ==========================================
# REGISTRO DE USUARIOS
# ==========================================
def register_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('dashboard')
    else:
        form = CustomUserCreationForm()

    return render(request, 'registration/register.html', {'form': form})


# ==========================================
# ACTUALIZACIÓN DE PERFIL (NOMBRE, APELLIDOS, EMAIL)
# ==========================================
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


# ==========================================
# CAMBIO DE CONTRASEÑA DE USUARIO
# ==========================================
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