from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

# Create your models here.

class User(AbstractUser):

    email = models.EmailField(
        _('dirección de correo electrónico'),
        unique=True,
        blank=False,
        null=False,
        error_messages={
            'unique': _('Ya existe un usuario registrado con este correo electrónico.'),
        },
    )

    REQUIRED_FIELDS = ['email']

    class Meta:
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')

    def __str__(self):
        return self.username