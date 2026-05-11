from django.contrib import admin

from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'issue_type', 'status', 'created_at')
    list_filter = ('status', 'issue_type')
    search_fields = ('description', 'issue_type', 'user__username')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
