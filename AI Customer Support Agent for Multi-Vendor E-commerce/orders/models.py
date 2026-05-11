"""
Order records — backing store for AI tools that fetch shipment / fulfillment state.
"""

from django.conf import settings
from django.db import models


class Order(models.Model):
    """Customer order aligned with external OMS / storefront IDs via ``order_id``."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SHIPPED = 'shipped', 'Shipped'
        DELIVERED = 'delivered', 'Delivered'

    order_id = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text='External or business unique order identifier.',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    tracking_number = models.CharField(
        max_length=128,
        blank=True,
        default='',
        help_text='Carrier tracking id when available.',
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'order'
        verbose_name_plural = 'orders'

    def __str__(self) -> str:
        return f'{self.order_id} ({self.get_status_display()})'
