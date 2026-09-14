from django import forms
from django.utils.translation import gettext_lazy as _
from tasks.models import Task
from boards.models import Board

class TaskForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = ['title', 'urgency', 'importance', 'board', 'description', 'due_date']

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
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('Notas ...'),
            }),
            'due_date': forms.DateTimeInput(attrs={
                'class': 'form-control',
                'type': 'datetime-local',
                'placeholder': _('Fecha límite'),
            }),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        current_board = kwargs.pop('current_board', None)
        
        super().__init__(*args, **kwargs)

        # El campo 'board' opcional en el formulario
        self.fields['board'].required = False

        if user:
            # se filtran solo los tableros del usuario logueado
            user_boards = Board.objects.filter(owner=user)
            self.fields['board'].queryset = user_boards

            # se selecciona por defecto el tablero correspondiente
            if current_board:
                self.fields['board'].initial = current_board
            else:
                default_board = user_boards.filter(is_default=True).first()
                if default_board:
                    self.fields['board'].initial = default_board

