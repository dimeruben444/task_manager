# boards/forms/board_form.py (o boards/forms.py)
from django import forms
from ..models import Board

class BoardForm(forms.ModelForm):
    class Meta:
        model = Board
        fields = ['title', 'description', 'color']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nombre del tablero'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'color': forms.Select(attrs={'class': 'form-select'}),
        }