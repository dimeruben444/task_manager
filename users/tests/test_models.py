from django.test import TestCase
from django.db.utils import IntegrityError
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelTest(TestCase):

    def test_create_user_successful(self):
        """Verifica la creación de un usuario estándar."""
        user = User.objects.create_user(
            username="ruben",
            email="ruben@example.com",
            password="Password123!"
        )
        self.assertEqual(user.username, "ruben")
        self.assertEqual(user.email, "ruben@example.com")
        self.assertTrue(user.check_password("Password123!"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(str(user), "ruben")

    def test_create_superuser_successful(self):
        """Verifica la creación de un superusuario."""
        admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="AdminPassword123!"
        )
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

    def test_duplicate_email_raises_integrity_error(self):
        """Comprueba que el modelo impide guardar dos correos iguales a nivel de DB."""
        User.objects.create_user(
            username="user1",
            email="repetido@example.com",
            password="Password123!"
        )
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username="user2",
                email="repetido@example.com",
                password="Password123!"
            )