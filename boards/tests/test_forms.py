from django.test import TestCase
from django.contrib.auth import get_user_model
from boards.forms.board_form import BoardForm
from boards.models import Board

User = get_user_model()


class BoardFormTest(TestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="form_owner",
            email="owner@example.com",
            password="Password123!"
        )
        self.user1 = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="Password123!"
        )
        self.user2 = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="Password123!"
        )

    def test_form_members_queryset_excludes_owner(self):
        """Verifica que la opción de miembros en el formulario excluya al usuario actual."""
        form = BoardForm(user=self.owner)
        members_queryset = form.fields['members'].queryset

        self.assertNotIn(self.owner, members_queryset)
        self.assertIn(self.user1, members_queryset)
        self.assertIn(self.user2, members_queryset)

    def test_board_form_valid_data(self):
        """Verifica que el formulario sea válido con datos correctos."""
        form_data = {
            'title': 'nuevo tablero de trabajo',
            'description': 'Una descripción detallada',
            'color': '#10B981',
            'members': [self.user1.id]
        }
        form = BoardForm(data=form_data, user=self.owner)
        self.assertTrue(form.is_valid())

        board = form.save(commit=False)
        board.owner = self.owner
        board.save()
        form.save_m2m()

        self.assertEqual(board.title, "Nuevo tablero de trabajo")
        self.assertIn(self.user1, board.members.all())
        self.assertNotIn(self.user2, board.members.all())