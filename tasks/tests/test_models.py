from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from tasks.models import Task
from boards.models import Board, Notification

User = get_user_model()


class TaskModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="task_creator",
            email="creator@example.com",
            password="Password123!"
        )
        self.assignee = User.objects.create_user(
            username="assignee_user",
            email="assignee@example.com",
            password="Password123!"
        )
        self.board = Board.objects.create(
            title="Tablero de Prueba",
            owner=self.user
        )

    def test_calculate_quadrant_logic(self):
        """Verifica que el método calculate_quadrant devuelva los valores esperados."""
        t1 = Task(title="Tarea Q1", urgency=4, importance=4, created_by=self.user, board=self.board)
        self.assertEqual(t1.calculate_quadrant(), 'Q1')

        t2 = Task(title="Tarea Q2", urgency=1, importance=3, created_by=self.user, board=self.board)
        self.assertEqual(t2.calculate_quadrant(), 'Q2')

        t3 = Task(title="Tarea Q3", urgency=3, importance=1, created_by=self.user, board=self.board)
        self.assertEqual(t3.calculate_quadrant(), 'Q3')

        t4 = Task(title="Tarea Q4", urgency=2, importance=2, created_by=self.user, board=self.board)
        self.assertEqual(t4.calculate_quadrant(), 'Q4')

    def test_auto_urgency_escalation(self):
        """Si la fecha límite está a menos de 2 días y la urgencia es <= 2, se eleva la urgencia a 4."""
        near_due_date = timezone.now() + timedelta(hours=24)
        task = Task.objects.create(
            title="Tarea Próxima",
            urgency=1,
            importance=4,
            due_date=near_due_date,
            created_by=self.user,
            board=self.board
        )
        self.assertEqual(task.urgency, 4)
        self.assertEqual(task.quadrant, 'Q1')

    def test_completed_task_sets_quadrant_to_done(self):
        """Marca la tarea con cuadrante DONE al completarse y la restaura al desmarcarse."""
        task = Task.objects.create(
            title="Tarea por Completar",
            urgency=4,
            importance=4,
            is_completed=True,
            created_by=self.user,
            board=self.board
        )
        self.assertEqual(task.quadrant, 'DONE')

        task.is_completed = False
        task.save()
        self.assertEqual(task.quadrant, 'Q1')

    def test_default_board_assigned_if_none_provided(self):
        """Asigna el tablero por defecto del usuario (creado por la señal post_save) si no se especifica uno."""
        default_board = Board.objects.filter(owner=self.user, is_default=True).first()
        task = Task.objects.create(
            title="Tarea sin tablero",
            urgency=3,
            importance=3,
            created_by=self.user
        )
        self.assertEqual(task.board, default_board)

    def test_notify_task_assignment_signal(self):
        """Verifica que la señal m2m_changed genere una notificación al asignar un usuario."""
        task = Task.objects.create(
            title="Tarea Asignada",
            urgency=3,
            importance=3,
            created_by=self.user,
            board=self.board
        )
        task.assigned_to.add(self.assignee)

        notification = Notification.objects.filter(
            recipient=self.assignee,
            target_task=task,
            notification_type='task_assigned'
        ).first()
        self.assertIsNotNone(notification)
        self.assertIn("te ha asignado la tarea", notification.verb)

    def test_notify_task_update_signal(self):
        """Verifica que modificar el título atribuido a otro usuario genere una notificación."""
        task = Task.objects.create(
            title="Título Original",
            urgency=3,
            importance=3,
            created_by=self.user,
            board=self.board
        )
        task.assigned_to.add(self.assignee)

        # Asignamos el atributo updated_by a un usuario distinto del asignado
        task.updated_by = self.user
        task.title = "Título Editado"
        task.save()

        notification = Notification.objects.filter(
            recipient=self.assignee,
            target_task=task,
            notification_type='task_updated'
        ).first()
        self.assertIsNotNone(notification)
        self.assertIn("ha actualizado la tarea", notification.verb)