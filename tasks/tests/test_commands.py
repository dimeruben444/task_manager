from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from django.core import mail
from django.core.management import call_command
from django.contrib.auth import get_user_model
from tasks.models import Task
from boards.models import Board

User = get_user_model()


class SendRemindersCommandTestCase(TestCase):

    def setUp(self):
        self.creator = User.objects.create_user(
            username="reminder_creator",
            email="creator@example.com",
            password="Password123!"
        )
        self.assignee = User.objects.create_user(
            username="reminder_assignee",
            email="assignee@example.com",
            password="Password123!"
        )
        self.board = Board.objects.create(
            title="Tablero Recordatorios",
            owner=self.creator
        )

    def test_send_reminders_sends_email_for_due_task(self):
        """Verifica que se envíe correo a creador y asignados cuando la tarea cumple la hora del recordatorio."""
        # Tarea que vence dentro de 1 hora con offset de 1 hora (debe dispararse ya)
        task = Task.objects.create(
            title="Tarea con Recordatorio",
            urgency=3,
            importance=3,
            due_date=timezone.now() + timedelta(minutes=30),
            reminder_enabled=True,
            reminder_offset='1_hour',
            created_by=self.creator,
            board=self.board
        )
        task.assigned_to.add(self.assignee)

        # Invocamos el comando
        call_command('send_reminders')

        # Comprobar que se envió 1 correo
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]

        self.assertIn("⏰ Recordatorio:", sent_email.subject)
        self.assertIn("creator@example.com", sent_email.to)
        self.assertIn("assignee@example.com", sent_email.to)

        # Comprobar que la tarea quedó marcada como enviada
        task.refresh_from_db()
        self.assertTrue(task.email_notification_sent)

    def test_send_reminders_ignores_future_reminders(self):
        """Verifica que NO se envíen correos para tareas cuya hora de disparo aún no ha llegado."""
        # Tarea que vence en 10 días con offset de 1 hora (no debe dispararse aún)
        Task.objects.create(
            title="Tarea Futura",
            urgency=2,
            importance=2,
            due_date=timezone.now() + timedelta(days=10),
            reminder_enabled=True,
            reminder_offset='1_hour',
            created_by=self.creator,
            board=self.board
        )

        call_command('send_reminders')
        self.assertEqual(len(mail.outbox), 0)

    def test_send_reminders_ignores_already_sent_or_completed_tasks(self):
        """Verifica que ignore tareas que ya fueron enviadas o que están completadas."""
        # Tarea completada
        Task.objects.create(
            title="Tarea Completada",
            urgency=4,
            importance=4,
            due_date=timezone.now() - timedelta(hours=1),
            reminder_enabled=True,
            is_completed=True,
            created_by=self.creator,
            board=self.board
        )

        # Tarea con email_notification_sent=True
        Task.objects.create(
            title="Tarea Ya Enviada",
            urgency=4,
            importance=4,
            due_date=timezone.now() - timedelta(hours=1),
            reminder_enabled=True,
            email_notification_sent=True,
            created_by=self.creator,
            board=self.board
        )

        call_command('send_reminders')
        self.assertEqual(len(mail.outbox), 0)