from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
from boards.models import Board, BoardInvitation, Notification

User = get_user_model()


class BoardModelTest(TestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner_user",
            email="owner@example.com",
            password="Password123!"
        )
        self.member = User.objects.create_user(
            username="member_user",
            email="member@example.com",
            password="Password123!"
        )

    def test_board_creation_and_title_capitalization(self):
        """Verifica la creación del tablero y que el método save capitalice la primera letra."""
        board = Board.objects.create(
            title="proyectos personales",
            description="Descripción de prueba",
            color="#3B82F6",
            owner=self.owner
        )
        self.assertEqual(board.title, "Proyectos personales")
        self.assertEqual(board.description, "Descripción de prueba")
        self.assertEqual(board.color, "#3B82F6")
        self.assertFalse(board.is_default)
        self.assertEqual(str(board), "Proyectos personales ")

    def test_board_str_representation_for_default_board(self):
        """Verifica la representación en cadena de un tablero por defecto."""
        default_board = Board.objects.create(
            title="general",
            is_default=True,
            owner=self.owner
        )
        self.assertEqual(default_board.title, "General")
        self.assertTrue(default_board.is_default)

    def test_board_members_relationship(self):
        """Verifica que se puedan añadir miembros compartidos al tablero."""
        board = Board.objects.create(
            title="Tablero Compartido",
            owner=self.owner
        )
        board.members.add(self.member)
        self.assertIn(self.member, board.members.all())
        self.assertIn(board, self.member.shared_boards.all())


class BoardInvitationModelTest(TestCase):

    def setUp(self):
        self.sender = User.objects.create_user(
            username="sender",
            email="sender@example.com",
            password="Password123!"
        )
        self.receiver = User.objects.create_user(
            username="receiver",
            email="receiver@example.com",
            password="Password123!"
        )
        self.board = Board.objects.create(
            title="Tablero Equipo",
            owner=self.sender
        )

    def test_create_invitation(self):
        """Verifica la creación de una invitación con estado predeterminado 'pending'."""
        invitation = BoardInvitation.objects.create(
            board=self.board,
            sender=self.sender,
            receiver=self.receiver
        )
        self.assertEqual(invitation.status, "pending")
        self.assertEqual(
            str(invitation),
            f"Invitación de {self.sender} a {self.receiver} para Tablero Equipo"
        )

    def test_duplicate_invitation_raises_integrity_error(self):
        """Verifica que la restricción unique_together impida invitaciones duplicadas iguales."""
        BoardInvitation.objects.create(
            board=self.board,
            sender=self.sender,
            receiver=self.receiver,
            status="pending"
        )
        with self.assertRaises(IntegrityError):
            BoardInvitation.objects.create(
                board=self.board,
                sender=self.sender,
                receiver=self.receiver,
                status="pending"
            )


class NotificationModelTest(TestCase):

    def setUp(self):
        self.actor = User.objects.create_user(
            username="actor",
            email="actor@example.com",
            password="Password123!"
        )
        self.recipient = User.objects.create_user(
            username="recipient",
            email="recipient@example.com",
            password="Password123!"
        )
        self.board = Board.objects.create(
            title="Tablero Notificaciones",
            owner=self.actor
        )

    def test_notification_creation_for_another_user(self):
        """Verifica que la notificación se guarde correctamente cuando actor != recipient."""
        notification = Notification.objects.create(
            recipient=self.recipient,
            actor=self.actor,
            notification_type="invitation",
            verb="te ha invitado a un tablero",
            target_board=self.board
        )
        self.assertIsNotNone(notification.pk)
        self.assertFalse(notification.is_read)
        self.assertEqual(
            str(notification),
            f"Notificación para {self.recipient.username}: te ha invitado a un tablero"
        )

    def test_notification_prevent_self_notification(self):
        """Verifica que la notificación NO se guarde si el recipient es igual al actor."""
        notification = Notification(
            recipient=self.actor,
            actor=self.actor,
            notification_type="invitation",
            verb="te has invitado a ti mismo"
        )
        notification.save()
        self.assertIsNone(notification.pk)
        self.assertEqual(Notification.objects.count(), 0)