from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import timedelta
from boards.models import Board


class Task(models.Model):
    QUADRANT_CHOICES = [
        ('Q1', _('Q1: Urgente e Importante')),
        ('Q2', _('Q2: No Urgente pero Importante')),
        ('Q3', _('Q3: Urgente pero No Importante')),
        ('Q4', _('Q4: No Urgente y No Importante')),
        ('DONE', _('Completada')),
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

    # Campos opcionales
    description = models.TextField(
        _('Descripción / Notas'),
        blank=True,
    )
    due_date = models.DateTimeField(
        _('Fecha límite'),
        blank=True,
        null=True,
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

    def check_auto_urgency(self):
        if self.due_date and not self.is_completed:
            time_left = self.due_date - timezone.now().date()
            if time_left <= timedelta(days=2) and self.urgency <= 2:
                self.urgency = 4

    def save(self, *args, **kwargs):
        self.check_auto_urgency()

        # Asignar tablero por defecto del creador si no se especificó uno
        if not self.board and self.created_by:
            default_board = Board.objects.filter(owner=self.created_by, is_default=True).first()
            if default_board:
                self.board = default_board

        # Asignar cuadrante según urgencia/importancia si la tarea no está completada
        if not self.is_completed and self.quadrant != 'DONE':
            self.quadrant = self.calculate_quadrant()

        # Sincronizar estado DONE
        if self.quadrant == 'DONE':
            self.is_completed = True
        elif self.is_completed and self.quadrant != 'DONE':
            self.quadrant = 'DONE'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.quadrant}] {self.title}"