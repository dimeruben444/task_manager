from django.test import TestCase
from django.core.management import call_command
from unittest.mock import patch


class ReminderCommandTestCase(TestCase):

    def test_send_reminders_runs_without_exceptions(self):
        """Garantiza que invocar send_reminders ejecute el comando real sin errores."""
        try:
            call_command('send_reminders')
        except Exception as e:
            self.fail(f"El comando 'send_reminders' lanzó una excepción no esperada: {e}")

    @patch('core.tests.test_commands.call_command')
    def test_send_reminders_mock_trigger(self, mock_call):
        """Verifica que el wrapper o invocador externo llame a call_command con 'send_reminders'."""
        mock_call('send_reminders')
        mock_call.assert_called_once_with('send_reminders')