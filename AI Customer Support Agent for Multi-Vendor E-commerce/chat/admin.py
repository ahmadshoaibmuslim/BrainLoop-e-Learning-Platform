from django.contrib import admin

from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'role', 'intent', 'timestamp')
    list_filter = ('role', 'intent')
    search_fields = ('content', 'user__username', 'intent')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'
