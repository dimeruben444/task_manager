from django.test import TestCase, Client
from django.urls import reverse


class CoreLegalViewsTestCase(TestCase):

    def setUp(self):
        self.client = Client()

    def test_terms_view_returns_200_and_template(self):
        """Verifica que la página de términos cargue correctamente con su plantilla."""
        url = reverse('terms')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'legal/terms.html')

    def test_privacy_policy_view_returns_200_and_template(self):
        """Verifica que la página de privacidad cargue correctamente con su plantilla."""
        url = reverse('privacy_policy')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'legal/privacy.html')

    def test_cookies_policy_view_returns_200_and_template(self):
        """Verifica que la página de cookies cargue correctamente con su plantilla."""
        url = reverse('cookies_policy')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'legal/cookies.html')