import zoneinfo
from datetime import timedelta
from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string, TemplateDoesNotExist
from django.utils import timezone
from tasks.models import Task


class Command(BaseCommand):
    help = 'Revisa las tareas con recordatorio activo y envía un correo electrónico en HTML'

    def handle(self, *args, **options):
        now = timezone.now()

        offsets = {
            'at_time': timedelta(minutes=0),
            '5_min': timedelta(minutes=5),
            '5min': timedelta(minutes=5),
            '15_min': timedelta(minutes=15),
            '15min': timedelta(minutes=15),
            '30_min': timedelta(minutes=30),
            '30min': timedelta(minutes=30),
            '1_hour': timedelta(hours=1),
            '1hour': timedelta(hours=1),
            '2_hours': timedelta(hours=2),
            '2hours': timedelta(hours=2),
            '1_day': timedelta(days=1),
            '1day': timedelta(days=1),
            '2_days': timedelta(days=2),
            '2days': timedelta(days=2),
            '1_week': timedelta(weeks=1),
            '1week': timedelta(weeks=1),
            '2_weeks': timedelta(weeks=2),
            '2weeks': timedelta(weeks=2),
        }

        tasks = Task.objects.filter(
            reminder_enabled=True,
            email_notification_sent=False,
            due_date__isnull=False,
            is_completed=False
        ).select_related('created_by', 'board').prefetch_related('assigned_to')

        sent_count = 0

        for task in tasks:
            offset = offsets.get(str(task.reminder_offset).strip(), timedelta(minutes=0))
            reminder_trigger_time = task.due_date - offset

            if now >= reminder_trigger_time:
                recipients = set()

                if task.created_by and task.created_by.email:
                    recipients.add(task.created_by.email)

                for user in task.assigned_to.all():
                    if user.email:
                        recipients.add(user.email)

                if recipients:
                    board_name = task.board.title if task.board else 'General'

                    user_tz_str = getattr(
                        getattr(task.created_by, 'profile', None),
                        'timezone',
                        settings.TIME_ZONE
                    )

                    try:
                        user_tz = zoneinfo.ZoneInfo(user_tz_str)
                    except Exception:
                        user_tz = zoneinfo.ZoneInfo(settings.TIME_ZONE)

                    due_date_local = task.due_date.astimezone(user_tz)
                    due_date_formatted = due_date_local.strftime('%d/%m/%Y a las %H:%M')

                    subject = f"⏰ Recordatorio: La tarea '{task.title}' vence pronto"

                    text_content = f"""Hola,

Te recordamos que tienes una tarea pendiente en Eisenhower Task Manager:

📌 Tarea: {task.title}
📁 Tablero: {board_name}
📅 Vencimiento: {due_date_formatted}

Descripción / Notas:
{task.description if task.description else 'Sin descripción adicional.'}

---
Mensaje enviado automáticamente desde tu Gestor de Tareas Eisenhower.
"""

                    context = {
                        'task': task,
                        'user': task.created_by,
                        'board_name': board_name,
                        'due_date_formatted': due_date_formatted,
                        'site_url': getattr(settings, 'SITE_URL', 'http://127.0.0.1:8000')
                    }

                    # Cargar plantilla y mostrar cualquier fallo de renderizado en la terminal
                    html_content = None
                    template_path = '_includes/tasks/_reminder_email.html'
                    
                    try:
                        html_content = render_to_string(template_path, context)
                    except TemplateDoesNotExist:
                        self.stdout.write(
                            self.style.ERROR(f"No se encontró la plantilla en '{template_path}'. Revisa la carpeta en tu proyecto.")
                        )
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f"Error de sintaxis o procesamiento al renderizar HTML: {e}")
                        )

                    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
                    msg = EmailMultiAlternatives(
                        subject=subject,
                        body=text_content,
                        from_email=from_email,
                        to=list(recipients)
                    )

                    if html_content:
                        msg.attach_alternative(html_content, "text/html")
                        self.stdout.write(self.style.SUCCESS("Plantilla HTML adjuntada correctamente al mensaje."))
                    else:
                        self.stdout.write(self.style.WARNING("El correo se enviará sólo en texto plano porque la plantilla HTML falló."))

                    msg.send(fail_silently=False)

                    task.email_notification_sent = True
                    task.save(update_fields=['email_notification_sent'])
                    sent_count += 1

        self.stdout.write(
            self.style.SUCCESS(f'Proceso finalizado. Se enviaron {sent_count} recordatorios por correo.')
        )