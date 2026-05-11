"""
Support tickets — human escalation path when automation cannot resolve an issue.
"""

from django.conf import settings
from django.db import models


class Ticket(models.Model):
    """Escalation record created by the system or staff."""

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        IN_PROGRESS = 'in_progress', 'In progress'
        RESOLVED = 'resolved', 'Resolved'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='support_tickets',
    )
    issue_type = models.CharField(
        max_length=128,
        db_index=True,
        help_text='Short label, e.g. refund_dispute, damaged_item.',
    )
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'ticket'
        verbose_name_plural = 'tickets'

    def __str__(self) -> str:
        return f'#{self.pk} {self.issue_type} ({self.get_status_display()})'
