from django.test import SimpleTestCase
from django.urls import reverse, resolve
from tasks import views


class TasksURLsTestCase(SimpleTestCase):

    def test_dashboard_url_resolves(self):
        """Verifica que la URL raíz / resuelva a la vista del dashboard."""
        url = reverse('dashboard')
        self.assertEqual(resolve(url).url_name, 'dashboard')

    def test_toggle_task_url_resolves(self):
        """Verifica que la ruta para alternar el estado completado de la tarea resuelva a ToggleTaskDoneView."""
        url = reverse('toggle_task', kwargs={'pk': 1})
        self.assertEqual(resolve(url).func.view_class, views.ToggleTaskDoneView)

    def test_edit_task_url_resolves(self):
        """Verifica la resolución de la ruta de edición de tareas."""
        url = reverse('edit_task', kwargs={'pk': 1})
        self.assertEqual(resolve(url).func.view_class, views.TaskUpdateView)

    def test_delete_task_url_resolves(self):
        """Verifica la resolución de la ruta de eliminación de tareas."""
        url = reverse('delete_task', kwargs={'pk': 1})
        self.assertEqual(resolve(url).func.view_class, views.TaskDeleteView)

    def test_quick_create_task_url_resolves(self):
        """Verifica la resolución de la creación rápida de tareas."""
        url = reverse('quick_create_task')
        self.assertEqual(resolve(url).func, views.quick_create_task)

    def test_update_task_position_url_resolves(self):
        """Verifica la resolución de la API Drag & Drop para mover tareas."""
        url = reverse('update_task_position')
        self.assertEqual(resolve(url).func, views.update_task_position)

    def test_clear_completed_tasks_url_resolves(self):
        """Verifica la resolución de la vista para vaciar tareas completadas."""
        url = reverse('clear_completed_tasks')
        self.assertEqual(resolve(url).func, views.clear_completed_tasks)

    def test_search_tasks_api_url_resolves(self):
        """Verifica la resolución del endpoint de búsqueda de tareas."""
        url = reverse('search_tasks_api')
        self.assertEqual(resolve(url).func, views.search_tasks_api)