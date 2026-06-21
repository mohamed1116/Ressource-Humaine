"""
Activity Log Model
Tracks all important actions in the system
"""
from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import TimeStampedModel

User = get_user_model()


class ActivityLog(TimeStampedModel):
    """
    Logs all important user actions in the system
    """
    class Action(models.TextChoices):
        # User Management
        USER_CREATED = 'USER_CREATED', 'User Created'
        USER_UPDATED = 'USER_UPDATED', 'User Updated'
        USER_DELETED = 'USER_DELETED', 'User Deleted'
        PASSWORD_RESET = 'PASSWORD_RESET', 'Password Reset'
        
        # Authentication
        LOGIN = 'LOGIN', 'Login'
        LOGOUT = 'LOGOUT', 'Logout'
        LOGIN_FAILED = 'LOGIN_FAILED', 'Login Failed'
        
        # Documents
        DOCUMENT_CREATED = 'DOCUMENT_CREATED', 'Document Created'
        DOCUMENT_APPROVED = 'DOCUMENT_APPROVED', 'Document Approved'
        DOCUMENT_REJECTED = 'DOCUMENT_REJECTED', 'Document Rejected'
        DOCUMENT_GENERATED = 'DOCUMENT_GENERATED', 'Document Generated'
        
        # Templates
        TEMPLATE_CREATED = 'TEMPLATE_CREATED', 'Template Created'
        TEMPLATE_UPDATED = 'TEMPLATE_UPDATED', 'Template Updated'
        TEMPLATE_DELETED = 'TEMPLATE_DELETED', 'Template Deleted'
        
        # Employees
        EMPLOYEE_CREATED = 'EMPLOYEE_CREATED', 'Employee Created'
        EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED', 'Employee Updated'
        EMPLOYEE_DELETED = 'EMPLOYEE_DELETED', 'Employee Deleted'
        
        # Leaves
        LEAVE_REQUESTED = 'LEAVE_REQUESTED', 'Leave Requested'
        LEAVE_APPROVED = 'LEAVE_APPROVED', 'Leave Approved'
        LEAVE_REJECTED = 'LEAVE_REJECTED', 'Leave Rejected'
        
        # System
        SYSTEM_SETTINGS_CHANGED = 'SYSTEM_SETTINGS_CHANGED', 'System Settings Changed'
        BACKUP_CREATED = 'BACKUP_CREATED', 'Backup Created'
        MAINTENANCE_MODE = 'MAINTENANCE_MODE', 'Maintenance Mode Changed'

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activity_logs',
        help_text='User who performed the action'
    )
    action = models.CharField(
        max_length=50,
        choices=Action.choices,
        help_text='Type of action performed'
    )
    description = models.TextField(
        help_text='Detailed description of the action'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address of the user'
    )
    user_agent = models.TextField(
        blank=True,
        help_text='Browser/device information'
    )
    related_object_type = models.CharField(
        max_length=50,
        blank=True,
        help_text='Type of related object (e.g., User, Document)'
    )
    related_object_id = models.CharField(
        max_length=255,
        blank=True,
        help_text='ID of related object'
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional data about the action'
    )

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
        ]

    def __str__(self):
        user_name = self.user.get_full_name() if self.user else 'System'
        return f'{user_name} - {self.get_action_display()} - {self.created_at}'
