from django import forms
from django.contrib.auth import get_user_model
from ..models import Board

User = get_user_model()

class BoardForm(forms.ModelForm):
    members = forms.ModelMultipleChoiceField(
        queryset=User.objects.none(),
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label='Compartir con miembros'
    )
    
    class Meta:
        model = Board
        fields = ['title', 'description', 'color', 'members']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nombre del tablero'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'color': forms.Select(attrs={'class': 'form-select'}),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            # Excluimos al propio usuario propietario de la lista de miembros seleccionables
            self.fields['members'].queryset = User.objects.exclude(id=user.id)