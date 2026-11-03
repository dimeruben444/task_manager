from django.test import TestCase
from users.forms import CustomUserCreationForm
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomUserCreationFormTest(TestCase):

    def test_form_valid_data(self):
        """El formulario es válido con todos los datos requeridos."""
        form_data = {
            'username': 'nuevo_usuario',
            'email': 'nuevo@example.com',
            'first_name': 'Ruben',
            'last_name': 'García',
            'password1': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'accepted_terms': True,
        }
        form = CustomUserCreationForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_form_fails_without_accepted_terms(self):
        """Falla si no se aceptan los términos y condiciones."""
        form_data = {
            'username': 'nuevo_usuario',
            'email': 'nuevo@example.com',
            'first_name': 'Ruben',
            'last_name': 'García',
            'password1': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'accepted_terms': False,
        }
        form = CustomUserCreationForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('accepted_terms', form.errors)

    def test_form_saves_user_correctly(self):
        """Verifica que el método save() asigne correctamente email, first_name y last_name."""
        form_data = {
            'username': 'rubendev',
            'email': 'rubendev@example.com',
            'first_name': 'Ruben',
            'last_name': 'Pérez',
            'password1': 'PassWord123!',
            'password2': 'PassWord123!',
            'accepted_terms': True,
        }
        form = CustomUserCreationForm(data=form_data)
        self.assertTrue(form.is_valid())
        user = form.save()

        self.assertEqual(user.email, 'rubendev@example.com')
        self.assertEqual(user.first_name, 'Ruben')
        self.assertEqual(user.last_name, 'Pérez')
        self.assertTrue(User.objects.filter(username='rubendev').exists())