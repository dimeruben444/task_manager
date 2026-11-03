import os
import time
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.contrib.auth import get_user_model
from playwright.sync_api import sync_playwright
from tasks.models import Task
from boards.models import Board

User = get_user_model()


class DashboardE2ETestCase(StaticLiveServerTestCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
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
            username="e2e_dashboard_user",
            email="dashboard_e2e@example.com",
            password="Password123!"
        )
        self.board = Board.objects.filter(owner=self.user, is_default=True).first()
        if not self.board:
            self.board = Board.objects.create(title="General", is_default=True, owner=self.user)

        self.page.goto(f"{self.live_server_url}/login/")
        self.page.fill('input[name="username"]', 'e2e_dashboard_user')
        self.page.fill('input[name="password"]', 'Password123!')
        self.page.click('button[type="submit"]')
        self.page.wait_for_url(f"{self.live_server_url}/")

    def tearDown(self):
        self.page.close()

    def test_inline_quick_add_task(self):
        """Prueba la creación de una tarea desde el botón inline de un cuadrante (Q1)."""
        self.page.click('.quadrant-q1 .btn-add-inline')
        self.page.fill('.quadrant-q1 .task-inline-input', 'Nueva Tarea E2E Q1')
        self.page.click('.quadrant-q1 button[type="submit"]')

        self.page.wait_for_selector('.quadrant-q1 .task-title')
        card_title = self.page.text_content('.quadrant-q1 .task-title')
        self.assertIn('Nueva Tarea E2E Q1', card_title)


    def test_toggle_task_completion_ajax(self):
        """Prueba que marcar el checkbox complete la tarea vía AJAX sin depender de la duración de la animación de partícula."""
        task = Task.objects.create(
            title="Tarea para completar E2E",
            urgency=4,
            importance=4,
            created_by=self.user,
            board=self.board
        )

        self.page.goto(f"{self.live_server_url}/")
        self.page.wait_for_selector(f'#task-card-{task.id}')

        # Disparar directamente la función handler de JavaScript del proyecto para evitar retardos de animación
        self.page.evaluate(f"sendToggleRequest({task.id}, true, document.querySelector('#task-card-{task.id} .task-completion-check'))")

        # Tiempo suficiente para el backend Django en test
        time.sleep(1.5)

        task.refresh_from_db()
        self.assertTrue(task.is_completed)


    def test_drag_and_drop_between_quadrants(self):
        """Simula el arrastre con eventos de ratón desde Q1 hasta Q2 para activar SortableJS."""
        task = Task.objects.create(
            title="Tarea para mover E2E",
            urgency=4,
            importance=4,
            created_by=self.user,
            board=self.board
        )

        self.page.goto(f"{self.live_server_url}/")
        card_selector = f'#task-card-{task.id}'
        target_selector = '.quadrant-container[data-quadrant="Q2"]'

        self.page.wait_for_selector(card_selector)
        self.page.wait_for_selector(target_selector)

        # Obtener coordenadas para arrastrar físicamente
        card_box = self.page.locator(card_selector).bounding_box()
        target_box = self.page.locator(target_selector).bounding_box()

        if card_box and target_box:
            # Mover el ratón al centro de la tarjeta y presionar
            self.page.mouse.move(card_box['x'] + card_box['width'] / 2, card_box['y'] + card_box['height'] / 2)
            self.page.mouse.down()
            
            # Arrastrar hasta el cuadrante Q2 con pasos intermedios para que SortableJS detecte la colisión
            self.page.mouse.move(
                target_box['x'] + target_box['width'] / 2,
                target_box['y'] + target_box['height'] / 2,
                steps=10
            )
            self.page.mouse.up()

        time.sleep(2)

        task.refresh_from_db()
        self.assertEqual(task.quadrant, 'Q2')