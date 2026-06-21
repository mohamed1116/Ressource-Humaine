from django.db import models
from apps.core.models import TimeStampedModel

# Notification system: real-time alerts with type-based routing and user preferences
# Supports broadcast, targeted and event-driven notifications


class Notification(TimeStampedModel):
    class NotificationType(models.TextChoices):
        LEAVE_REQUEST = 'LEAVE_REQUEST', 'Leave Request'
        LEAVE_APPROVED = 'LEAVE_APPROVED', 'Leave Approved'
        LEAVE_REJECTED = 'LEAVE_REJECTED', 'Leave Rejected'
        ATTENDANCE_ALERT = 'ATTENDANCE_ALERT', 'Attendance Alert'
        PAYSLIP_READY = 'PAYSLIP_READY', 'Payslip Ready'
        EVALUATION_DUE = 'EVALUATION_DUE', 'Evaluation Due'
        EVALUATION_COMPLETE = 'EVALUATION_COMPLETE', 'Evaluation Completed'
        DOCUMENT_REQUEST = 'DOCUMENT_REQUEST', 'Document Request'
        DOCUMENT_APPROVED = 'DOCUMENT_APPROVED', 'Document Approved'
        DOCUMENT_REJECTED = 'DOCUMENT_REJECTED', 'Document Rejected'
        DOCUMENT_SIGNED = 'DOCUMENT_SIGNED', 'Document Signed'
        REQUEST_SUBMITTED = 'REQUEST_SUBMITTED', 'Request Submitted'
        SYSTEM = 'SYSTEM', 'System Notification'

    recipient = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='notifications',
    )
    notification_type = models.CharField(max_length=25, choices=NotificationType.choices)
    title = models.CharField(max_length=300)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    action_url = models.CharField(max_length=500, blank=True)
    related_object_type = models.CharField(max_length=50, blank=True)
    related_object_id = models.UUIDField(null=True, blank=True)
    attachment = models.FileField(upload_to='notification_attachments/%Y/%m/', null=True, blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f'{self.title} -> {self.recipient}'


# Per-user notification channel preferences - email and in-app toggles
class NotificationPreference(TimeStampedModel):
    """Per-user notification preferences."""
    user = models.OneToOneField(
        'accounts.User', on_delete=models.CASCADE, related_name='notification_preferences',
    )
    email_leave_updates = models.BooleanField(default=True)
    email_attendance_alerts = models.BooleanField(default=True)
    email_payslip_ready = models.BooleanField(default=True)
    email_evaluation_updates = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)

    class Meta:
        db_table = 'notification_preferences'

    def __str__(self):
        return f'Preferences for {self.user}'
