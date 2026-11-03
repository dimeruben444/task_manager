import json
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()


class UsersViewsTestCase(TestCase):

    def setUp(self):
        self.client = Client()
        self.user_password = "Password123!"
        self.user = User.objects.create_user(
            username="rubendev",
            email="ruben@example.com",
            first_name="Ruben",
            last_name="García",
            password=self.user_password
        )
        self.register_url = reverse('users:register')
        self.update_profile_url = reverse('users:update_profile')
        self.change_password_url = reverse('users:change_password')
        self.export_data_url = reverse('users:export_data')
        self.delete_account_url = reverse('users:delete_account')

    # =========================================================================
    # 1. PRUEBAS DE REGISTRO (register_view)
    # =========================================================================
    def test_register_view_get(self):
        """Verifica que la página de registro carga correctamente."""
        response = self.client.get(self.register_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'registration/register.html')

    def test_register_view_post_success(self):
        """Verifica que un registro con datos válidos crea el usuario y redirige al dashboard."""
        form_data = {
            'username': 'nuevo_usuario',
            'email': 'nuevo@example.com',
            'first_name': 'Carlos',
            'last_name': 'López',
            'password1': 'StrongPassword123!',
            'password2': 'StrongPassword123!',
            'accepted_terms': True,
        }
        response = self.client.post(self.register_url, data=form_data)
        self.assertRedirects(response, reverse('dashboard'))
        self.assertTrue(User.objects.filter(username='nuevo_usuario').exists())

    def test_register_view_post_invalid(self):
        """Verifica que un registro inválido (sin aceptar términos) no crea usuario."""
        form_data = {
            'username': 'invalid_user',
            'email': 'invalid@example.com',
            'password1': 'Password123!',
            'password2': 'Password123!',
            'accepted_terms': False,
        }
        response = self.client.post(self.register_url, data=form_data)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(username='invalid_user').exists())

    # =========================================================================
    # 2. PRUEBAS DE ACTUALIZACIÓN DE PERFIL (update_profile_view)
    # =========================================================================
    def test_update_profile_requires_login(self):
        """Verifica que la actualización de perfil requiere inicio de sesión."""
        response = self.client.post(self.update_profile_url, data={'first_name': 'Test'})
        self.assertEqual(response.status_code, 302)

    def test_update_profile_success(self):
        """Verifica la actualización correcta de nombre, apellidos y correo."""
        self.client.login(username='rubendev', password=self.user_password)
        post_data = {
            'first_name': 'Ruben Editado',
            'last_name': 'Pérez',
            'email': 'ruben_nuevo@example.com'
        }
        response = self.client.post(self.update_profile_url, data=post_data)
        self.assertRedirects(response, reverse('dashboard'))

        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Ruben Editado')
        self.assertEqual(self.user.last_name, 'Pérez')
        self.assertEqual(self.user.email, 'ruben_nuevo@example.com')

    def test_update_profile_missing_required_fields(self):
        """Verifica que no se actualice si faltan campos obligatorios como first_name o email."""
        self.client.login(username='rubendev', password=self.user_password)
        post_data = {
            'first_name': '',  # Vacío
            'last_name': 'Pérez',
            'email': 'ruben@example.com'
        }
        response = self.client.post(self.update_profile_url, data=post_data)
        self.assertRedirects(response, reverse('dashboard'))

        self.user.refresh_from_db()
        self.assertNotEqual(self.user.first_name, '')  # No debió cambiar

    # =========================================================================
    # 3. PRUEBAS DE CAMBIO DE CONTRASEÑA (change_password_view)
    # =========================================================================
    def test_change_password_success(self):
        """Verifica el cambio correcto de contraseña."""
        self.client.login(username='rubendev', password=self.user_password)
        post_data = {
            'old_password': self.user_password,
            'new_password': 'NewStrongPassword123!',
            'confirm_password': 'NewStrongPassword123!'
        }
        response = self.client.post(self.change_password_url, data=post_data)
        self.assertRedirects(response, reverse('dashboard'))

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewStrongPassword123!'))

    def test_change_password_wrong_old_password(self):
        """Falla si la contraseña actual proporcionada es incorrecta."""
        self.client.login(username='rubendev', password=self.user_password)
        post_data = {
            'old_password': 'WrongPassword123!',
            'new_password': 'NewStrongPassword123!',
            'confirm_password': 'NewStrongPassword123!'
        }
        response = self.client.post(self.change_password_url, data=post_data)
        self.assertRedirects(response, reverse('dashboard'))

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.user_password))

    def test_change_password_mismatch(self):
        """Falla si las nuevas contraseñas no coinciden entre sí."""
        self.client.login(username='rubendev', password=self.user_password)
        post_data = {
            'old_password': self.user_password,
            'new_password': 'NewStrongPassword123!',
            'confirm_password': 'DifferentPassword123!'
        }
        response = self.client.post(self.change_password_url, data=post_data)
        self.assertRedirects(response, reverse('dashboard'))

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.user_password))

    # =========================================================================
    # 4. PRUEBAS DE EXPORTACIÓN Y SUPRESIÓN RGPD (export_user_data / delete_account_view)
    # =========================================================================
    def test_export_user_data_returns_json(self):
        """Verifica que se descargue correctamente el archivo JSON con los datos del usuario."""
        self.client.login(username='rubendev', password=self.user_password)
        response = self.client.get(self.export_data_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/json')
        self.assertIn('attachment; filename="eisenhowerflow_export_rubendev.json"', response['Content-Disposition'])

        json_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(json_data['user_profile']['username'], 'rubendev')
        self.assertEqual(json_data['user_profile']['email'], 'ruben@example.com')

    def test_delete_account_success(self):
        """Verifica el borrado permanente de la cuenta tras confirmar la contraseña correcta."""
        self.client.login(username='rubendev', password=self.user_password)
        post_data = {'password_confirm': self.user_password}

        response = self.client.post(self.delete_account_url, data=post_data)
        self.assertRedirects(response, reverse('login'))
        self.assertFalse(User.objects.filter(username='rubendev').exists())

    def test_delete_account_wrong_password(self):
        """Impide el borrado de la cuenta si la contraseña es incorrecta."""
        self.client.login(username='rubendev', password=self.user_password)
        post_data = {'password_confirm': 'IncorrectPassword'}

        response = self.client.post(self.delete_account_url, data=post_data)
        self.assertRedirects(response, reverse('dashboard'))
        self.assertTrue(User.objects.filter(username='rubendev').exists())