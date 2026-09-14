from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
# Create your models here.


class Board(models.Model):
    #Paleta de colores para identificar las tareas de los boards secundarios
    COLOR_CHOICES = [
        ('#3B82F6', _('Azul')),
        ('#10B981', _('Verde')),
        ('#EF4444', _('Rojo')),
        ('#F59E0B', _('Naranja')),
        ('#8B5CF6', _('Púrpura')),
        ('#6B7280', _('Gris')),
    ]

    title = models.CharField(_('Título'), max_length=150)
    description = models.TextField(_('Descripción'), blank=True)
    color = models.CharField(_('Color'),choices=COLOR_CHOICES, max_length=7 ,blank=True, null=True,)

    is_default = models.BooleanField(_('¿Tablero general?'),default=False)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete= models.CASCADE,
        related_name='boards',
        verbose_name=_('Propietario')
    )

    due_date = models.TimeField(('Fecha límite del tablero'),null=True, blank=True) #fecha vencimiento
    email_notifications_sent = models.BooleanField(_('Notificación enviada'),default=False)

    created_at = models.DateTimeField(_('Fecha de creación'), auto_now_add=True)

    class Meta:
        verbose_name = _('Tablero')
        verbose_name_plural = _('Tableros')
        ordering = ['-created_at']

    def __str__(self):
        tipo = _('General') if self.is_default else _('Personalizado')
        return f"{self.title} ({tipo})"