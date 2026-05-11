"""
Chat persistence: one row per message for audit, memory, and intent analytics.
"""

from django.conf import settings
from django.db import models


class Message(models.Model):
    """A single turn in a customer ↔ AI conversation."""

    class Role(models.TextChoices):
        USER = 'user', 'User'
        AI = 'ai', 'AI'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        help_text='Authenticated customer who sent or received this turn.',
    )
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        db_index=True,
        help_text='Whether this line was produced by the customer or the assistant.',
    )
    content = models.TextField(help_text='Raw message body.')
    intent = models.CharField(
        max_length=128,
        blank=True,
        null=True,
        db_index=True,
        help_text='Classifier / router output (e.g. order_status, refund_request).',
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'message'
        verbose_name_plural = 'messages'

    def __str__(self) -> str:
        preview = (self.content[:50] + '…') if len(self.content) > 50 else self.content
        return f'{self.get_role_display()} @ {self.timestamp:%Y-%m-%d %H:%M}: {preview}'
