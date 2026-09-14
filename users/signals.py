from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from boards.models import Board


"""
    CADA VEZ que un usuario se guarda en la base de datos, Se ejecuta automáticamente
    Si el usuario es recién creado (created=True), le genera su tablero 'General' por defecto.
"""
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_default_board(sender, instance, created, **kwargs):

    if created:
        Board.objects.create(
            title="General",
            description="Tablero principal unificado",
            is_default=True,
            owner=instance,
            color=None  # Sin color por ser el tablero por defecto
        )