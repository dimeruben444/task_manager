import os
import time
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.contrib.auth import get_user_model
from playwright.sync_api import sync_playwright
from tasks.models import Task
from boards.models import Board

User = get_user_model()


class ModalsAndSearchE2ETestCase(StaticLiveServerTestCase):

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
            username="e2e_modal_user",
            email="modals_e2e@example.com",
            password="Password123!"
        )
        self.board = Board.objects.create(title="General", is_default=True, owner=self.user)

        self.page.goto(f"{self.live_server_url}/login/")
        self.page.fill('input[name="username"]', 'e2e_modal_user')
        self.page.fill('input[name="password"]', 'Password123!')
        self.page.click('button[type="submit"]')
        self.page.wait_for_url(f"{self.live_server_url}/")

    def tearDown(self):
        self.page.close()

    def test_edit_task_via_modal_and_quadrant_change(self):
        """Prueba abrir el modal, cambiar el título y mover la tarea a Q2 ejecutando la función JS saveTaskModal."""
        task = Task.objects.create(
            title="Tarea Modal Original",
            urgency=4,
            importance=4,  # Q1
            created_by=self.user,
            board=self.board
        )

        self.page.goto(f"{self.live_server_url}/")
        self.page.wait_for_selector(f'#task-card-{task.id}')

        # Abrir el modal
        self.page.click(f'#task-card-{task.id} .task-title-wrapper')
        self.page.wait_for_selector(f'#viewTaskModal{task.id}', state="visible")

        # Rellenar el título
        textarea = self.page.locator(f'#editTaskForm{task.id} textarea[name="title"]')
        textarea.fill("Tarea Modal Editada")

        # Seleccionar la opción Q2 llamando a la función del modal JS selectQuadrant('Q2', taskId, label)
        self.page.evaluate(f"selectQuadrant('Q2', '{task.id}', 'Importante - No Urgente')")

        # Ejecutar el guardado por AJAX
        self.page.evaluate(f"saveTaskModal('{task.id}')")

        time.sleep(2)

        task.refresh_from_db()
        self.assertEqual(task.title, "Tarea Modal Editada")
        self.assertEqual(task.quadrant, "Q2")

    def test_global_search_shortcut_and_dropdown(self):
        """Prueba el buscador global con la combinación de teclas Ctrl+K / Cmd+K."""
        Task.objects.create(
            title="Buscar Tarea Especial",
            urgency=4,
            importance=4,
            created_by=self.user,
            board=self.board
        )

        self.page.goto(f"{self.live_server_url}/")

        self.page.keyboard.press("Control+k")
        self.page.fill('#globalTaskSearchInput', 'Especial')

        self.page.wait_for_selector('#searchDropdownResults', state="visible")
        dropdown_text = self.page.text_content('#searchDropdownResults')
        self.assertIn("Buscar Tarea Especial", dropdown_text)