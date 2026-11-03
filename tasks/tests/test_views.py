import json
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from tasks.models import Task
from boards.models import Board

User = get_user_model()


class TasksViewsTestCase(TestCase):

    def setUp(self):
        self.client = Client()
        self.password = "Password123!"
        self.user = User.objects.create_user(
            username="task_user",
            email="task_user@example.com",
            password=self.password
        )
        self.other_user = User.objects.create_user(
            username="other_user",
            email="other_user@example.com",
            password=self.password
        )
        self.board = Board.objects.create(
            title="Tablero Principal",
            owner=self.user
        )
        self.task = Task.objects.create(
            title="Tarea de Prueba",
            urgency=4,
            importance=4,
            created_by=self.user,
            board=self.board
        )

    # =========================================================================
    # 1. TOGGLE AJAX (ToggleTaskDoneView)
    # =========================================================================
    def test_toggle_task_done_ajax(self):
        """Verifica que la vista invierta correctamente el estado de is_completed vía POST."""
        self.client.login(username="task_user", password=self.password)
        url = reverse('toggle_task', kwargs={'pk': self.task.pk})

        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data['status'], 'success')
        self.assertTrue(data['is_completed'])

        self.task.refresh_from_db()
        self.assertTrue(self.task.is_completed)

    # =========================================================================
    # 2. EDICIÓN Y RENDERIZADO TARJETA HTML (TaskUpdateView)
    # =========================================================================
    def test_task_update_view_ajax(self):
        """Verifica la edición de una tarea con petición AJAX y el retorno de la tarjeta HTML."""
        self.client.login(username="task_user", password=self.password)
        url = reverse('edit_task', kwargs={'pk': self.task.pk})

        post_data = {
            'title': 'Tarea de Prueba Editada',
            'urgency': 1,
            'importance': 4,
            'description': 'Descripción editada'
        }

        response = self.client.post(
            url,
            data=post_data,
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))

        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['quadrant'], 'Q2')
        self.assertIn('card_html', data)

        self.task.refresh_from_db()
        self.assertEqual(self.task.title, 'Tarea de Prueba Editada')
        self.assertEqual(self.task.quadrant, 'Q2')

    # =========================================================================
    # 3. MOVER TAREA VÍA DRAG & DROP (update_task_position)
    # =========================================================================
    def test_update_task_position_drag_and_drop(self):
        """Verifica la actualización del cuadrante mediante el payload JSON de SortableJS."""
        self.client.login(username="task_user", password=self.password)
        url = reverse('update_task_position')

        payload = {
            'task_id': self.task.id,
            'target_quadrant': 'Q3'
        }

        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))

        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['quadrant'], 'Q3')

        self.task.refresh_from_db()
        self.assertEqual(self.task.quadrant, 'Q3')
        self.assertEqual(self.task.urgency, 4)
        self.assertEqual(self.task.importance, 1)

    # =========================================================================
    # 4. CREACIÓN RÁPIDA Y ELIMINACIÓN (quick_create_task / TaskDeleteView)
    # =========================================================================
    def test_quick_create_task(self):
        """Verifica la creación rápida de tareas desde la Quick Add Bar."""
        self.client.login(username="task_user", password=self.password)
        url = reverse('quick_create_task')

        post_data = {
            'title': 'Tarea Creada Rápido',
            'urgency': 3,
            'importance': 1,
            'board': self.board.id
        }

        response = self.client.post(url, data=post_data)
        self.assertEqual(response.status_code, 302)

        created_task = Task.objects.filter(title='Tarea Creada Rápido').first()
        self.assertIsNotNone(created_task)
        self.assertEqual(created_task.created_by, self.user)

    def test_delete_task_view(self):
        """Verifica la eliminación de una tarea por su creador."""
        self.client.login(username="task_user", password=self.password)
        url = reverse('delete_task', kwargs={'pk': self.task.pk})

        response = self.client.post(url)
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Task.objects.filter(id=self.task.id).exists())

    # =========================================================================
    # 5. VACIAR TAREAS COMPLETADAS Y BÚSQUEDA AJAX
    # =========================================================================
    def test_clear_completed_tasks(self):
        """Verifica que se eliminen únicamente las tareas marcadas como completadas."""
        completed_task = Task.objects.create(
            title="Tarea Completada",
            urgency=1,
            importance=1,
            is_completed=True,
            created_by=self.user,
            board=self.board
        )

        self.client.login(username="task_user", password=self.password)
        url = reverse('clear_completed_tasks')

        response = self.client.post(url, data={'time_filter': 'all'})
        self.assertEqual(response.status_code, 302)

        self.assertFalse(Task.objects.filter(id=completed_task.id).exists())
        self.assertTrue(Task.objects.filter(id=self.task.id).exists())

    def test_search_tasks_api(self):
        """Verifica las respuestas en JSON de la API de búsqueda de tareas."""
        self.client.login(username="task_user", password=self.password)
        url = reverse('search_tasks_api') + '?q=Prueba'

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]['title'], 'Tarea de Prueba')