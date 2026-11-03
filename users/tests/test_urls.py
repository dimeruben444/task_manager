from django.test import SimpleTestCase
from django.urls import reverse, resolve
from django.contrib.auth import views as auth_views
from users import views


class UsersURLsTestCase(SimpleTestCase):

    def test_register_url_resolves(self):
        """Verifica que la URL de registro resuelve a la vista correcta."""
        url = reverse('users:register')
        self.assertEqual(resolve(url).func, views.register_view)

    def test_update_profile_url_resolves(self):
        """Verifica que la URL de actualización de perfil resuelve correctamente."""
        url = reverse('users:update_profile')
        self.assertEqual(resolve(url).func, views.update_profile_view)

    def test_change_password_url_resolves(self):
        """Verifica que la URL de cambio de contraseña resuelve a la vista correspondiente."""
        url = reverse('users:change_password')
        self.assertEqual(resolve(url).func, views.change_password_view)

    def test_export_data_url_resolves(self):
        """Verifica que la URL de exportación RGPD resuelve a export_user_data."""
        url = reverse('users:export_data')
        self.assertEqual(resolve(url).func, views.export_user_data)

    def test_delete_account_url_resolves(self):
        """Verifica que la URL de borrado de cuenta resuelve a delete_account_view."""
        url = reverse('users:delete_account')
        self.assertEqual(resolve(url).func, views.delete_account_view)

    # =========================================================================
    # PRUEBAS DE RUTAS DE RECUPERACIÓN DE CONTRASEÑA (Django Auth Views)
    # =========================================================================
    def test_password_reset_url_resolves(self):
        """Verifica la resolución de la vista de solicitud de reseteo."""
        url = reverse('users:password_reset')
        self.assertEqual(resolve(url).func.view_class, auth_views.PasswordResetView)

    def test_password_reset_done_url_resolves(self):
        """Verifica la resolución de la confirmación de envío de correo."""
        url = reverse('users:password_reset_done')
        self.assertEqual(resolve(url).func.view_class, auth_views.PasswordResetDoneView)

    def test_password_reset_confirm_url_resolves(self):
        """Verifica la resolución de la URL con token para ingresar nueva clave."""
        url = reverse('users:password_reset_confirm', kwargs={'uidb64': 'MQ', 'token': 'set-password'})
        self.assertEqual(resolve(url).func.view_class, auth_views.PasswordResetConfirmView)

    def test_password_reset_complete_url_resolves(self):
        """Verifica la resolución de la pantalla de reseteo completado."""
        url = reverse('users:password_reset_complete')
        self.assertEqual(resolve(url).func.view_class, auth_views.PasswordResetCompleteView)