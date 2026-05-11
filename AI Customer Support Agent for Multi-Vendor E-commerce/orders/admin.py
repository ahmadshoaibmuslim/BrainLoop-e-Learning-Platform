from django.contrib import admin

from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'user', 'status', 'tracking_number', 'created_at')
    list_filter = ('status',)
    search_fields = ('order_id', 'tracking_number', 'user__username')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
