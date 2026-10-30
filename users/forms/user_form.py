# users/forms/user_form.py
from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class CustomUserCreationForm(UserCreationForm):
    first_name = forms.CharField(
        label=_("Nombre"),
        max_length=150,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control form-control-lg border-light-subtle bg-light-subtle fs-6',
            'placeholder': _('Ej. Ruben')
        })
    )
    last_name = forms.CharField(
        label=_("Apellidos"),
        max_length=150,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control form-control-lg border-light-subtle bg-light-subtle fs-6',
            'placeholder': _('Ej. García Pérez')
        })
    )
    accepted_terms = forms.BooleanField(
        required=True,
        label=_("He leído y acepto los Términos y la Política de Privacidad"),
        error_messages={
            'required': _('Debes aceptar el Aviso Legal y la Política de Privacidad para registrarte.')
        },
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input'
        })
    )

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'email', 'first_name', 'last_name')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Placeholders personalizados
        placeholders = {
            'username': _('tu_usuario'),
            'email': _('tu@email.com'),
            'password1': _('Crea una contraseña segura'),
            'password2': _('Repite la contraseña'),
        }

        # Etiquetas limpias en español
        labels = {
            'username': _('Usuario'),
            'email': _('Correo electrónico'),
            'password1': _('Contraseña'),
            'password2': _('Confirmar contraseña'),
        }

        for field_name, field in self.fields.items():
            # Aplicar clases de Bootstrap a todos los campos excepto al checkbox de términos
            if field_name != 'accepted_terms':
                field.widget.attrs['class'] = 'form-control form-control-lg border-light-subtle bg-light-subtle fs-6'
            
            if field_name in placeholders:
                field.widget.attrs['placeholder'] = placeholders[field_name]
            
            if field_name in labels:
                field.label = labels[field_name]

            # Limpiar textos de ayuda ruidosos por defecto de Django
            field.help_text = None

    def save(self, commit=True):
        user = super().save(commit=False)
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        if commit:
            user.save()
        return user