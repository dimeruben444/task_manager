import os
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.contrib.auth import get_user_model
from playwright.sync_api import sync_playwright

User = get_user_model()


class AuthE2ETestCase(StaticLiveServerTestCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # En macOS nos aseguramos de que Playwright abra el navegador Chromium nativo
        os.environ['DJANGO_ALLOW_ASYNC_UNSAFE'] = 'true'
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            headless=False,
            slow_mo=1000
        )

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        super().tearDownClass()

    def setUp(self):
        self.page = self.browser.new_page()
        self.user = User.objects.create_user(
            username="e2e_user",
            email="e2e@example.com",
            password="Password123!"
        )

    def tearDown(self):
        self.page.close()

    def test_login_flow_and_dashboard_redirect(self):
        """Prueba que el usuario pueda iniciar sesión y acceder al dashboard."""
        self.page.goto(f"{self.live_server_url}/login/")

        # Completar formulario de login
        self.page.fill('input[name="username"]', 'e2e_user')
        self.page.fill('input[name="password"]', 'Password123!')
        self.page.click('button[type="submit"]')

        # Esperar a la redirección al Dashboard
        self.page.wait_for_url(f"{self.live_server_url}/")
        
        # Verificar que la cabecera del Dashboard o título sea visible
        self.assertTrue(self.page.is_visible('.dashboard-header-card'))