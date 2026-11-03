from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from boards.models import Board, Notification
from boards.context_processors import notifications_context, frequent_collaborators_context

User = get_user_model()


class ContextProcessorsTestCase(TestCase):

    def setUp(self):
        self.factory = RequestFactory()
        self.user1 = User.objects.create_user(
            username="user_cp1",
            email="cp1@example.com",
            password="Password123!"
        )
        self.user2 = User.objects.create_user(
            username="user_cp2",
            email="cp2@example.com",
            password="Password123!"
        )

    def test_notifications_context_anonymous_user(self):
        """Un usuario no autenticado obtiene lista vacía y conteo 0."""
        request = self.factory.get('/')
        request.user = AnonymousUser()

        context = notifications_context(request)
        self.assertEqual(context['notifications_list'], [])
        self.assertEqual(context['unread_notifications_count'], 0)

    def test_notifications_context_authenticated_user(self):
        """Un usuario autenticado recibe las notificaciones no leídas correctas."""
        Notification.objects.create(
            recipient=self.user1,
            actor=self.user2,
            notification_type='invitation',
            verb='notificación de prueba'
        )
        request = self.factory.get('/')
        request.user = self.user1

        context = notifications_context(request)
        self.assertEqual(context['unread_notifications_count'], 1)
        self.assertEqual(len(context['notifications_list']), 1)

    def test_frequent_collaborators_context(self):
        """Comprueba que el procesador inyecte los colaboradores del tablero en la plantilla."""
        board = Board.objects.create(title="Tablero Colaborativo", owner=self.user1)
        board.members.add(self.user2)

        request = self.factory.get('/')
        request.user = self.user1

        context = frequent_collaborators_context(request)
        collaborators = context['frequent_collaborators']

        self.assertIn(self.user2, collaborators)
        self.assertNotIn(self.user1, collaborators)