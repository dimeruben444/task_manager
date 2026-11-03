from django.test import SimpleTestCase
from django.urls import reverse, resolve
from django.contrib.auth.views import LoginView, LogoutView
from core import views


class CoreURLsTestCase(SimpleTestCase):

    def test_login_url_resolves(self):
        """Verifica que la URL /login/ resuelve a la LoginView de Django."""
        url = reverse('login')
        self.assertEqual(resolve(url).func.view_class, LoginView)

    def test_logout_url_resolves(self):
        """Verifica que la URL /logout/ resuelve a la LogoutView de Django."""
        url = reverse('logout')
        self.assertEqual(resolve(url).func.view_class, LogoutView)

    def test_register_url_resolves(self):
        """Verifica que la URL /register/ resuelve a la vista de registro."""
        url = reverse('register')
        self.assertEqual(resolve(url).func.__name__, 'register_view')

    def test_search_users_api_url_resolves(self):
        """Verifica que la API de búsqueda de usuarios resuelve a search_users_api."""
        url = reverse('search_users_api')
        self.assertEqual(resolve(url).func.__name__, 'search_users_api')

    def test_terms_url_resolves(self):
        """Verifica que /terminos/ resuelve a TermsView."""
        url = reverse('terms')
        self.assertEqual(resolve(url).func.view_class, views.TermsView)

    def test_privacy_policy_url_resolves(self):
        """Verifica que /privacidad/ resuelve a PrivacyPolicyView."""
        url = reverse('privacy_policy')
        self.assertEqual(resolve(url).func.view_class, views.PrivacyPolicyView)

    def test_cookies_policy_url_resolves(self):
        """Verifica que /cookies/ resuelve a CookiesPolicyView."""
        url = reverse('cookies_policy')
        self.assertEqual(resolve(url).func.view_class, views.CookiesPolicyView)