from django import forms
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from tasks.models import Task
from boards.models import Board

User = get_user_model()


class TaskForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = ['title', 'urgency', 'importance', 'board', 'assigned_to', 'due_date', 'description']

        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('¿Qué hay que hacer?'),
                'required': True,
            }),
            'urgency': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 1,
                'max': 4,
                'placeholder': _('Urgencia (1-4)'),
            }),
            'importance': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 1,
                'max': 4,
                'placeholder': _('Importancia (1-4)'),
            }),
            'board': forms.Select(attrs={'class': 'form-select'}),
            'assigned_to': forms.SelectMultiple(attrs={
                'class': 'form-select',
                'size': '3',
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('Notas ...'),
            }),
            'due_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date',
                'placeholder': _('Fecha límite'),
            }),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        current_board = kwargs.pop('current_board', None)
        
        super().__init__(*args, **kwargs)

        # Campos opcionales en el formulario
        self.fields['board'].required = False
        self.fields['assigned_to'].required = False

        # Cargar la lista completa de usuarios para asignación múltiple
        self.fields['assigned_to'].queryset = User.objects.all()

        if user:
            # Filtrar tableros pertenecientes al usuario activo
            user_boards = Board.objects.filter(owner=user)
            self.fields['board'].queryset = user_boards

            # Selección del tablero por defecto
            if current_board:
                self.fields['board'].initial = current_board
            else:
                default_board = user_boards.filter(is_default=True).first()
                if default_board:
                    self.fields['board'].initial = default_board