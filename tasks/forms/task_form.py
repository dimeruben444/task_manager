from django import forms
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.db.models import Q  
from tasks.models import Task
from boards.models import Board

User = get_user_model()


class TaskForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = [
            'title', 
            'urgency', 
            'importance', 
            'board', 
            'assigned_to', 
            'due_date', 
            'reminder_enabled', 
            'reminder_offset', 
            'description'
        ]

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
            'due_date': forms.DateTimeInput(
                attrs={
                    'class': 'form-control form-control-sm',
                    'type': 'datetime-local',
                    'placeholder': _('Fecha límite'),
                },
                format='%Y-%m-%dT%H:%M',
            ),
            'reminder_enabled': forms.CheckboxInput(attrs={
                'class': 'form-check-input',
            }),
            'reminder_offset': forms.Select(attrs={
                'class': 'form-select form-select-sm',
            }),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        current_board = kwargs.pop('current_board', None)
        # Soportar actualización parcial (por ejemplo, peticiones AJAX de Drag & Drop)
        partial = kwargs.pop('partial', False)
        
        super().__init__(*args, **kwargs)

        # Formatos de fecha aceptados
        self.fields['due_date'].input_formats = [
            '%Y-%m-%d %H:%M',
            '%Y-%m-%dT%H:%M',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d',
        ]

        # Campos opcionales en el formulario
        self.fields['due_date'].required = False
        self.fields['board'].required = False
        self.fields['assigned_to'].required = False
        self.fields['reminder_enabled'].required = False
        self.fields['reminder_offset'].required = False

        # Si se indica 'partial=True', relajamos la obligatoriedad de los demás campos
        if partial:
            for field in self.fields.values():
                field.required = False

        # Cargar la lista completa de usuarios para asignación múltiple
        self.fields['assigned_to'].queryset = User.objects.all()

        # Limpiar el nombre del tablero para la interfaz
        if 'board' in self.fields:
            self.fields['board'].label_from_instance = lambda obj: f"📁 {obj.title}"

        if user:
            # 1. SI ESTAMOS EDITANDO UNA TAREA EXISTENTE
            if self.instance and self.instance.pk:
                task_creator = self.instance.created_by
                board_owner = self.instance.board.owner if self.instance.board else None

                # Caso 1: El usuario actual ES el creador de la tarea O el dueño de su tablero (Persona A)
                if user == task_creator or (board_owner and user == board_owner):
                    user_boards = Board.objects.filter(
                        Q(owner=user) | Q(members=user)
                    ).distinct()
                    self.fields['board'].queryset = user_boards

                # Caso 2: El usuario actual ES UN INVITADO (Persona B)
                else:
                    person_a = board_owner or task_creator

                    if person_a:
                        # Buscamos los tableros que A y B comparten
                        shared_boards = Board.objects.filter(
                            Q(owner=person_a, members=user) |
                            Q(owner=user, members=person_a) |
                            (Q(members=user) & Q(members=person_a))
                        ).distinct()

                        # Si la tarea ya tiene un tablero asignado, aseguramos que se incluya en el QuerySet
                        if self.instance.board:
                            shared_boards = (shared_boards | Board.objects.filter(pk=self.instance.board.pk)).distinct()

                        self.fields['board'].queryset = shared_boards

                        # Si solo comparten este tablero, deshabilitamos el selector para que no la mueva a otro sitio
                        if shared_boards.count() <= 1:
                            self.fields['board'].disabled = True
                    else:
                        if self.instance.board:
                            self.fields['board'].queryset = Board.objects.filter(pk=self.instance.board.pk)
                        else:
                            self.fields['board'].queryset = Board.objects.none()
                        self.fields['board'].disabled = True

            # 2. SI ES UNA CREACIÓN NUEVA DESDE CERO
            else:
                user_boards = Board.objects.filter(
                    Q(owner=user) | Q(members=user)
                ).distinct()
                self.fields['board'].queryset = user_boards

            # Selección del tablero inicial
            if self.instance and self.instance.board:
                self.fields['board'].initial = self.instance.board
            elif current_board:
                self.fields['board'].initial = current_board
            else:
                default_board = user_boards.filter(is_default=True).first() if 'user_boards' in locals() else None
                if default_board:
                    self.fields['board'].initial = default_board