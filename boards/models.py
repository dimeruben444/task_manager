from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
# Create your models here.
User = get_user_model()

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
    color = models.CharField(_('Color'),choices=COLOR_CHOICES, max_length=7 ,blank=True, null=True,default='#6B7280')

    is_default = models.BooleanField(_('¿Tablero general?'),default=False)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete= models.CASCADE,
        related_name='boards',
        verbose_name=_('Propietario')
    )

    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='shared_boards',
        blank=True,
        verbose_name=_('Miembros compartidos')
    )

    due_date = models.TimeField(_('Fecha límite del tablero'),null=True, blank=True) #fecha vencimiento
    email_notifications_sent = models.BooleanField(_('Notificación enviada'),default=False)

    created_at = models.DateTimeField(_('Fecha de creación'), auto_now_add=True)

    class Meta:
        verbose_name = _('Tablero')
        verbose_name_plural = _('Tableros')
        ordering = ['created_at']

    def save(self, *args, **kwargs):
        if self.title:
            title_clean = self.title.strip()
            if title_clean:
                # Convierte el primer carácter a mayúscula y mantiene el resto intacto
                self.title = title_clean[0].upper() + title_clean[1:]
        super().save(*args, **kwargs)

    def __str__(self):
        tipo = _('General') if self.is_default else _('Personalizado')
        return f"{self.title} "


class BoardInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('accepted', 'Aceptada'),
        ('rejected', 'Rechazada'),
    ]

    # Usamos 'boards.Board' o self si está en la misma app
    board = models.ForeignKey('boards.Board', on_delete=models.CASCADE, related_name='invitations')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_invitations')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('board', 'receiver', 'status')

    def __str__(self):
        return f"Invitación de {self.sender} a {self.receiver} para {self.board.title}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('invitation', 'Invitación a tablero'),
        ('task_assigned', 'Tarea asignada'),
        ('task_updated', 'Tarea actualizada'),
        ('mention', 'Mención en comentario'),
        ('comment', 'Nuevo comentario'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    verb = models.CharField(max_length=255)
    
    target_board = models.ForeignKey('boards.Board', on_delete=models.CASCADE, null=True, blank=True)
    # Especificamos 'tasks.Task' con el nombre de su app
    target_task = models.ForeignKey('tasks.Task', on_delete=models.CASCADE, null=True, blank=True)
    invitation = models.ForeignKey(BoardInvitation, on_delete=models.CASCADE, null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notificación para {self.recipient.username}: {self.verb}"