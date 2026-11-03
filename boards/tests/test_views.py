import json
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from boards.models import Board, BoardInvitation, Notification

User = get_user_model()


class BoardsViewsTestCase(TestCase):

    def setUp(self):
        self.client = Client()
        self.password = "Password123!"
        self.owner = User.objects.create_user(
            username="board_owner",
            email="owner@example.com",
            password=self.password
        )
        self.invited_user = User.objects.create_user(
            username="invited_user",
            email="invited@example.com",
            password=self.password
        )
        self.board = Board.objects.create(
            title="Tablero de Desarrollo",
            owner=self.owner
        )

    # =========================================================================
    # 1. CREACIÓN, EDICIÓN Y ELIMINACIÓN DE TABLEROS
    # =========================================================================
    def test_board_create_view(self):
        """Verifica la creación de un tablero y el envío automático de invitaciones."""
        self.client.login(username="board_owner", password=self.password)
        post_data = {
            'title': 'nuevo tablero de proyectos',
            'description': 'Descripción general',
            'color': '#3B82F6',
            'invited_users': ['invited_user']
        }
        response = self.client.post(reverse('create_board'), data=post_data)
        self.assertEqual(response.status_code, 302)

        new_board = Board.objects.filter(title="Nuevo tablero de proyectos").first()
        self.assertIsNotNone(new_board)
        self.assertEqual(new_board.owner, self.owner)

        invitation = BoardInvitation.objects.filter(board=new_board, receiver=self.invited_user).first()
        self.assertIsNotNone(invitation)

    def test_board_update_view(self):
        """Verifica la actualización de los datos del tablero."""
        self.client.login(username="board_owner", password=self.password)
        post_data = {
            'title': 'Tablero Modificado',
            'color': '#10B981',
            'description': 'Nueva descripción'
        }
        url = reverse('edit_board', kwargs={'board_id': self.board.id})
        response = self.client.post(url, data=post_data)
        self.assertRedirects(response, reverse('dashboard_board', kwargs={'board_id': self.board.id}))

        self.board.refresh_from_db()
        self.assertEqual(self.board.title, 'Tablero Modificado')
        self.assertEqual(self.board.color, '#10B981')

    def test_board_delete_view(self):
        """Verifica la eliminación de un tablero por su propietario."""
        self.client.login(username="board_owner", password=self.password)
        url = reverse('delete_board', kwargs={'board_id': self.board.id})
        response = self.client.post(url)
        self.assertRedirects(response, reverse('dashboard'))
        self.assertFalse(Board.objects.filter(id=self.board.id).exists())

    # =========================================================================
    # 2. GESTIÓN DE INVITACIONES Y NOTIFICACIONES
    # =========================================================================
    def test_invite_to_board_success(self):
        """Verifica el envío directo de una invitación por endpoint."""
        self.client.login(username="board_owner", password=self.password)
        url = reverse('invite_to_board', kwargs={'board_id': self.board.id})
        response = self.client.post(url, data={'identifier': 'invited_user'})

        self.assertRedirects(response, reverse('dashboard_board', kwargs={'board_id': self.board.id}))
        self.assertTrue(BoardInvitation.objects.filter(board=self.board, receiver=self.invited_user).exists())
        self.assertTrue(Notification.objects.filter(recipient=self.invited_user).exists())

    def test_accept_invitation(self):
        """Verifica que aceptar la invitación añade al usuario como miembro del tablero."""
        invitation = BoardInvitation.objects.create(
            board=self.board,
            sender=self.owner,
            receiver=self.invited_user
        )
        self.client.login(username="invited_user", password=self.password)
        url = reverse('accept_invitation', kwargs={'invitation_id': invitation.id})
        response = self.client.get(url)

        self.assertRedirects(response, reverse('dashboard_board', kwargs={'board_id': self.board.id}))
        self.assertIn(self.invited_user, self.board.members.all())

        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'accepted')

    def test_reject_invitation(self):
        """Verifica que rechazar la invitación actualiza el estado a 'rejected'."""
        invitation = BoardInvitation.objects.create(
            board=self.board,
            sender=self.owner,
            receiver=self.invited_user
        )
        self.client.login(username="invited_user", password=self.password)
        url = reverse('reject_invitation', kwargs={'invitation_id': invitation.id})
        response = self.client.get(url)

        self.assertRedirects(response, reverse('dashboard'))
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'rejected')
        self.assertNotIn(self.invited_user, self.board.members.all())

    def test_delete_notification(self):
        """Verifica que un usuario pueda borrar una notificación propia vía POST."""
        notification = Notification.objects.create(
            recipient=self.invited_user,
            actor=self.owner,
            notification_type='invitation',
            verb='te ha invitado'
        )
        self.client.login(username="invited_user", password=self.password)
        url = reverse('delete_notification', kwargs={'notification_id': notification.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, 302)
        self.assertFalse(Notification.objects.filter(id=notification.id).exists())

    # =========================================================================
    # 3. ENDPOINTS AJAX / APIS
    # =========================================================================
    def test_search_users_api(self):
        """Verifica la respuesta JSON de la API de búsqueda de usuarios."""
        self.client.login(username="board_owner", password=self.password)
        url = reverse('search_users_api') + '?q=invited'
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(data['users']), 1)
        self.assertEqual(data['users'][0]['username'], 'invited_user')

    def test_unread_notifications_count_api(self):
        """Verifica el contador JSON de notificaciones no leídas."""
        Notification.objects.create(
            recipient=self.invited_user,
            actor=self.owner,
            notification_type='invitation',
            verb='te ha invitado'
        )
        self.client.login(username="invited_user", password=self.password)
        url = reverse('unread_notifications_count_api')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data['unread_count'], 1)
        