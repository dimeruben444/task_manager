from django.test import SimpleTestCase
from django.urls import reverse, resolve
from boards import views


class BoardsURLsTestCase(SimpleTestCase):

    def test_create_board_url_resolves(self):
        """Verifica que /boards/create/ resuelve a la CBV BoardCreateView."""
        url = reverse('create_board')
        self.assertEqual(resolve(url).func.view_class, views.BoardCreateView)

    def test_edit_board_url_resolves(self):
        """Verifica que /boards/edit/<id>/ resuelve a BoardUpdateView."""
        url = reverse('edit_board', kwargs={'board_id': 1})
        self.assertEqual(resolve(url).func.view_class, views.BoardUpdateView)

    def test_delete_board_url_resolves(self):
        """Verifica que /boards/delete/<id>/ resuelve a BoardDeleteView."""
        url = reverse('delete_board', kwargs={'board_id': 1})
        self.assertEqual(resolve(url).func.view_class, views.BoardDeleteView)

    def test_invite_to_board_url_resolves(self):
        """Verifica que la URL de invitar a un tablero resuelve a la función correspondiente."""
        url = reverse('invite_to_board', kwargs={'board_id': 1})
        self.assertEqual(resolve(url).func, views.invite_to_board)

    def test_accept_invitation_url_resolves(self):
        """Verifica la resolución de la URL de aceptar invitación."""
        url = reverse('accept_invitation', kwargs={'invitation_id': 1})
        self.assertEqual(resolve(url).func, views.accept_invitation)

    def test_reject_invitation_url_resolves(self):
        """Verifica la resolución de la URL de rechazar invitación."""
        url = reverse('reject_invitation', kwargs={'invitation_id': 1})
        self.assertEqual(resolve(url).func, views.reject_invitation)

    def test_delete_notification_url_resolves(self):
        """Verifica la resolución de la URL de borrar notificación."""
        url = reverse('delete_notification', kwargs={'notification_id': 1})
        self.assertEqual(resolve(url).func, views.delete_notification)

    def test_search_users_api_url_resolves(self):
        """Verifica la resolución de la API de búsqueda de usuarios."""
        url = reverse('search_users_api')
        self.assertEqual(resolve(url).func, views.search_users_api)

    def test_unread_notifications_count_api_url_resolves(self):
        """Verifica la resolución de la API del contador de notificaciones no leídas."""
        url = reverse('unread_notifications_count_api')
        self.assertEqual(resolve(url).func, views.unread_notifications_count_api)