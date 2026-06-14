"""
Audit Log System
----------------
Tracks every significant user action in the system:
who did what, when, on which object. Provides a full
audit trail for compliance and HR governance.
"""
from django.db import models
from apps.core.models import TimeStampedModel


class AuditLog(TimeStampedModel):
    """
    Immutable record of a user action.
    Created automatically via the log_action() helper.
    """

    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Creation'
        UPDATE = 'UPDATE', 'Modification'
        DELETE = 'DELETE', 'Suppression'
        APPROVE = 'APPROVE', 'Approbation'
        REJECT = 'REJECT', 'Rejet'
        GENERATE = 'GENERATE', 'Generation'
        LOGIN = 'LOGIN', 'Connexion'
        LOGOUT = 'LOGOUT', 'Deconnexion'

    user = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, related_name='audit_logs',
    )
    action = models.CharField(max_length=15, choices=Action.choices)
    target_type = models.CharField(
        max_length=100,
        help_text='Model name, e.g. "DocumentRequest", "Employee"',
    )
    target_id = models.CharField(
        max_length=100, blank=True,
        help_text='ID of the affected object.',
    )
    description = models.TextField(
        help_text='Human-readable description of the action.',
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    extra_data = models.JSONField(
        default=dict, blank=True,
        help_text='Additional context (old values, new values, etc.).',
    )

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} | {self.action} | {self.target_type} | {self.created_at:%Y-%m-%d %H:%M}'


def log_action(user, action, target_type, target_id='', description='', request=None, extra_data=None):
    """
    Helper to create an audit log entry from anywhere in the codebase.
    Usage: log_action(request.user, 'APPROVE', 'DocumentRequest', str(doc.id), 'Approved attestation de travail')
    """
    ip = None
    if request:
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        if ',' in (ip or ''):
            ip = ip.split(',')[0].strip()
    AuditLog.objects.create(
        user=user,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        description=description,
        ip_address=ip,
        extra_data=extra_data or {},
    )
