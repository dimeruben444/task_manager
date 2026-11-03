from django.test import TestCase
from django.contrib.auth import get_user_model
from tasks.forms import TaskForm
from tasks.models import Task
from boards.models import Board

User = get_user_model()


class TaskFormTest(TestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="board_owner_form",
            email="owner_form@example.com",
            password="Password123!"
        )
        self.guest = User.objects.create_user(
            username="guest_user_form",
            email="guest_form@example.com",
            password="Password123!"
        )
        self.board = Board.objects.create(
            title="Tablero Compartido Form",
            owner=self.owner
        )
        self.board.members.add(self.guest)

    def test_form_valid_data(self):
        """Verifica que el formulario de tarea valide con datos básicos requeridos."""
        form_data = {
            'title': 'Nueva Tarea desde Formulario',
            'urgency': 3,
            'importance': 4,
            'board': self.board.id,
            'reminder_offset': '1_day'
        }
        form = TaskForm(data=form_data, user=self.owner)
        self.assertTrue(form.is_valid())

    def test_form_partial_mode_makes_fields_optional(self):
        """Verifica que la opción partial=True permita omitir la mayoría de campos para edicion rápida."""
        form_data = {'title': 'Título Editado Parcialmente'}
        form = TaskForm(data=form_data, user=self.owner, partial=True)
        self.assertTrue(form.is_valid())

    def test_board_queryset_for_guest_user(self):
        """Verifica que un usuario invitado solo vea los tableros compartidos con el creador/dueño."""
        task = Task.objects.create(
            title="Tarea para editar por invitado",
            urgency=3,
            importance=3,
            created_by=self.owner,
            board=self.board
        )
        form = TaskForm(instance=task, user=self.guest)
        queryset = form.fields['board'].queryset

        self.assertIn(self.board, queryset)