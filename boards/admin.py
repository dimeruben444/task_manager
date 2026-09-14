from django.contrib import admin

from .models import Board

# Register your models here.


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'is_default', 'color', 'due_date', 'created_at')
    list_filter = ('is_default', 'created_at')
    search_fields = ('title', 'owner__username')