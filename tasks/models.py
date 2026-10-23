from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import timedelta
from boards.models import Board

from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from boards.models import Notification
from django.contrib.auth import get_user_model
from django.db.models.signals import pre_save

class Task(models.Model):
    QUADRANT_CHOICES = [
        ('Q1', _('Q1: Urgente e Importante')),
        ('Q2', _('Q2: No Urgente pero Importante')),
        ('Q3', _('Q3: Urgente pero No Importante')),
        ('Q4', _('Q4: No Urgente y No Importante')),
        ('DONE', _('Completada')),
    ]

    REMINDER_CHOICES = [
        ('at_time', _('A la hora del vencimiento')),
        ('5_min', _('5 minutos antes')),
        ('15_min', _('15 minutos antes')),
        ('1_hour', _('1 hora antes')),
        ('2_hours', _('2 horas antes')),
        ('1_day', _('1 día antes')),
        ('2_days', _('2 días antes')),
        ('1_week', _('1 semana antes')),
        ('2_weeks', _('2 semanas antes')),
    ]

    # Campos principales
    title = models.CharField(
        _('Título de la tarea'),
        max_length=200,
    )
    urgency = models.PositiveSmallIntegerField(
        _('Urgencia (1-4)'),
        validators=[
            MinValueValidator(1, _('La urgencia mínima es 1')),
            MaxValueValidator(4, _('La urgencia máxima es 4'))
        ]
    )
    importance = models.PositiveSmallIntegerField(
        _('Importancia (1-4)'),
        validators=[
            MinValueValidator(1, _('La importancia mínima es 1')),
            MaxValueValidator(4, _('La importancia máxima es 4'))
        ]
    )

    # Campos opcionales y recordatorio
    description = models.TextField(
        _('Descripción / Notas'),
        blank=True,
    )
    due_date = models.DateTimeField(
        _('Fecha límite'),
        blank=True,
        null=True,
    )
    reminder_enabled = models.BooleanField(
        _('Activar recordatorio'),
        default=False,
    )
    reminder_offset = models.CharField(
        _('Antelación del recordatorio'),
        max_length=20,
        choices=REMINDER_CHOICES,
        default='1_day',
    )

    # Relaciones de Usuario (Creador y Múltiples Asignados)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tasks',
        verbose_name=_('Creado por'),
    )
    assigned_to = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='assigned_tasks',
        verbose_name=_('Asignado a'),
    )

    # Relaciones y control de estado
    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name=_('Tablero'),
        null=True,
        blank=True
    )
    quadrant = models.CharField(
        _('Cuadrante'),
        max_length=10,
        choices=QUADRANT_CHOICES,
        default='Q1',
    )
    is_completed = models.BooleanField(
        _('¿Completada?'),
        default=False,
    )
    email_notification_sent = models.BooleanField(
        _('Notificación enviada'),
        default=False,
    )
    created_at = models.DateTimeField(
        _('Fecha de creación'),
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        _('Última modificación'),
        auto_now=True,
    )

    class Meta:
        verbose_name = _('Tarea')
        verbose_name_plural = _('Tareas')
        ordering = ['-created_at']

    def calculate_quadrant(self):
        if self.urgency > 2 and self.importance > 2:
            return 'Q1'
        elif self.urgency <= 2 and self.importance > 2:
            return 'Q2'
        elif self.urgency > 2 and self.importance <= 2:
            return 'Q3'
        else:
            return 'Q4'

    # tasks/models.py

    def check_auto_urgency(self):
        # Si no hay fecha, está completada o no tiene urgencia definida, salimos directamente
        if not self.due_date or self.is_completed or self.urgency is None:
            return

        time_left = self.due_date - timezone.now()
        if time_left <= timedelta(days=2) and self.urgency <= 2:
            self.urgency = 4

    def save(self, *args, **kwargs):
        self.check_auto_urgency()

        # Asignar tablero por defecto del creador si no se especificó uno
        if not self.board and self.created_by:
            default_board = Board.objects.filter(owner=self.created_by, is_default=True).first()
            if default_board:
                self.board = default_board

        # Sincronización correcta de is_completed y quadrant
        if self.is_completed:
            self.quadrant = 'DONE'
        else:
            # Si estaba completada (o en DONE) y la desmarcamos, recalculamos su cuadrante real
            if self.quadrant == 'DONE' or not self.quadrant:
                self.quadrant = self.calculate_quadrant()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.quadrant}] {self.title}"


User = get_user_model()

@receiver(m2m_changed, sender=Task.assigned_to.through)
def notify_task_assignment(sender, instance, action, pk_set, **kwargs):
    if action == "post_add" and pk_set:
        assigned_users = User.objects.filter(pk__in=pk_set)
        
        # Obtenemos el usuario activo o el creador de la tarea
        actor = getattr(instance, 'updated_by', getattr(instance, 'created_by', None))
        
        for user in assigned_users:
            # Nunca notificar al propio usuario que realiza la acción
            if actor and actor == user:
                continue

            # Borrar posibles 'task_updated' no leídas generadas inmediatamente antes en el mismo POST
            Notification.objects.filter(
                recipient=user,
                target_task=instance,
                notification_type='task_updated',
                is_read=False
            ).delete()

            # Crear de forma única la notificación de asignación
            Notification.objects.get_or_create(
                recipient=user,
                target_task=instance,
                notification_type='task_assigned',
                is_read=False,
                defaults={
                    'actor': actor if actor else user,
                    'verb': f"te ha asignado la tarea '{instance.title}'",
                    'target_board': instance.board if hasattr(instance, 'board') else None
                }
            )


@receiver(pre_save, sender=Task)
def notify_task_update(sender, instance, **kwargs):
    # Solo notificar si la tarea ya existía (es una edición, no una creación)
    if not instance.pk:
        return

    try:
        old_instance = Task.objects.get(pk=instance.pk)
    except Task.DoesNotExist:
        return

    # Comprobar si hubo cambios significativos en el título o descripción
    if old_instance.title != instance.title or old_instance.description != instance.description:
        # Notificar a los asignados (excluyendo al que hace el cambio si está disponible)
        recipients = instance.assigned_to.all()
        
        for recipient in recipients:
            Notification.objects.create(
                recipient=recipient,
                actor=getattr(instance, 'updated_by', recipient),
                notification_type='task_updated',
                verb=f"ha actualizado la tarea '{instance.title}'",
                target_task=instance,
                target_board=instance.board
            )



