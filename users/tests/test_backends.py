from django.test import TestCase
from django.contrib.auth import get_user_model
from users.backends import EmailOrUsernameModelBackend

User = get_user_model()


class EmailOrUsernameBackendTest(TestCase):

    def setUp(self):
        self.backend = EmailOrUsernameModelBackend()
        self.user = User.objects.create_user(
            username="ruben_user",
            email="ruben@domain.com",
            password="SecurePassword123!"
        )

    def test_authenticate_with_username_success(self):
        """Autenticación exitosa usando el nombre de usuario exacto."""
        user = self.backend.authenticate(None, username="ruben_user", password="SecurePassword123!")
        self.assertEqual(user, self.user)

    def test_authenticate_with_username_case_insensitive(self):
        """Autenticación exitosa usando el usuario en mayúsculas."""
        user = self.backend.authenticate(None, username="RUBEN_USER", password="SecurePassword123!")
        self.assertEqual(user, self.user)

    def test_authenticate_with_email_success(self):
        """Autenticación exitosa usando el correo electrónico."""
        user = self.backend.authenticate(None, username="ruben@domain.com", password="SecurePassword123!")
        self.assertEqual(user, self.user)

    def test_authenticate_with_email_case_insensitive(self):
        """Autenticación exitosa con correo en mayúsculas/minúsculas mixtas."""
        user = self.backend.authenticate(None, username="RuBeN@DoMaIn.CoM", password="SecurePassword123!")
        self.assertEqual(user, self.user)

    def test_authenticate_invalid_password_returns_none(self):
        """Devuelve None si la contraseña es incorrecta."""
        user = self.backend.authenticate(None, username="ruben_user", password="WrongPassword")
        self.assertIsNone(user)

    def test_authenticate_non_existent_user_returns_none(self):
        """Devuelve None si el usuario o email no existen."""
        user = self.backend.authenticate(None, username="no_existe", password="SecurePassword123!")
        self.assertIsNone(user)