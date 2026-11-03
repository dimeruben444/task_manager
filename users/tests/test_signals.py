from django.test import TestCase
from django.contrib.auth import get_user_model
from boards.models import Board

User = get_user_model()


class UserSignalsTest(TestCase):

    def test_default_board_created_on_user_creation(self):
        """Verifica que al crear un usuario se genera automáticamente su tablero 'General'."""
        user = User.objects.create_user(
            username="test_board_user",
            email="board_user@example.com",
            password="Password123!"
        )

        board = Board.objects.filter(owner=user, is_default=True).first()
        self.assertIsNotNone(board)
        self.assertEqual(board.title, "General")
        self.assertEqual(board.description, "Tablero principal unificado")
        self.assertIsNone(board.color)

    def test_no_extra_board_created_on_user_update(self):
        """Comprueba que al actualizar un usuario existente NO se crea otro tablero por defecto."""
        user = User.objects.create_user(
            username="test_update_user",
            email="update_user@example.com",
            password="Password123!"
        )
        self.assertEqual(Board.objects.filter(owner=user).count(), 1)

        # Guardar de nuevo (update)
        user.first_name = "NombreEditado"
        user.save()

        # Debe seguir habiendo 1 solo tablero
        self.assertEqual(Board.objects.filter(owner=user).count(), 1)