# boards/views.py
from django.urls import reverse_lazy
from django.shortcuts import redirect, get_object_or_404
from django.views.generic import CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Board
from .forms import BoardForm

class BoardCreateView(LoginRequiredMixin, CreateView):
    model = Board
    form_class = BoardForm
    
    def form_valid(self, form):
        form.instance.owner = self.request.user
        return super().form_valid(form)

    def form_invalid(self, form):
        print("❌ Error al crear tablero:", form.errors)
        return redirect('dashboard')

    def get_success_url(self):
        return reverse_lazy('dashboard_board', kwargs={'board_id': self.object.id})


class BoardUpdateView(LoginRequiredMixin, UpdateView):
    model = Board
    form_class = BoardForm
    pk_url_kwarg = 'board_id'

    def get_queryset(self):
        return Board.objects.filter(owner=self.request.user)

    def post(self, request, *args, **kwargs):
        board = self.get_object()
        title = request.POST.get('title')
        color = request.POST.get('color')
        description = request.POST.get('description')

        if title:
            board.title = title
            if color:
                board.color = color
            board.description = description
            board.save()

        return redirect('dashboard_board', board_id=board.id)


class BoardDeleteView(LoginRequiredMixin, DeleteView):
    model = Board
    pk_url_kwarg = 'board_id'
    success_url = reverse_lazy('dashboard')

    def get_queryset(self):
        return Board.objects.filter(owner=self.request.user, is_default=False)