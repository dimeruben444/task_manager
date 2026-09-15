# tasks/views.py
from django.shortcuts import get_object_or_404, redirect
from django.views.generic import UpdateView, DeleteView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import Task
from .forms import TaskForm


# 1. Cambiar estado completada / pendiente
class ToggleTaskDoneView(LoginRequiredMixin, View):
    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk, assigned_to=request.user)
        task.is_completed = not task.is_completed
        task.save()
        return redirect(request.META.get('HTTP_REFERER', 'dashboard'))


# 2. Editar Tarea
class TaskUpdateView(LoginRequiredMixin, UpdateView):
    model = Task
    form_class = TaskForm
    pk_url_kwarg = 'pk'

    def get_queryset(self):
        return Task.objects.filter(assigned_to=self.request.user)

    def form_valid(self, form):
        form.save()
        return redirect(self.request.META.get('HTTP_REFERER', 'dashboard'))

    def form_invalid(self, form):
        print("❌ Error al editar tarea:", form.errors)
        return redirect(self.request.META.get('HTTP_REFERER', 'dashboard'))


# 3. Eliminar Tarea
class TaskDeleteView(LoginRequiredMixin, DeleteView):
    model = Task
    pk_url_kwarg = 'pk'

    def get_queryset(self):
        return Task.objects.filter(assigned_to=self.request.user)

    def get_success_url(self):
        return self.request.META.get('HTTP_REFERER', reverse_lazy('dashboard'))