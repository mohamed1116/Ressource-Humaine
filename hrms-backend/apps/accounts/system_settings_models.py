"""
System Settings Model
Allows Super Admin to configure system-wide settings
"""
from django.db import models
from apps.core.models import TimeStampedModel


class SystemSettings(TimeStampedModel):
    """
    Singleton model for system-wide settings
    Only one instance should exist
    """
    # General Settings
    system_name = models.CharField(
        max_length=200,
        default='SGRH - Faculté Polydisciplinaire de Taroudant',
        help_text='Name of the system'
    )
    system_logo = models.ImageField(
        upload_to='system/',
        null=True,
        blank=True,
        help_text='System logo'
    )
    system_email = models.EmailField(
        default='contact@fpt.ac.ma',
        help_text='System email address'
    )
    system_phone = models.CharField(
        max_length=20,
        default='+212(0)5 28 55 10 10',
        help_text='System phone number'
    )
    
    # Maintenance Mode
    maintenance_mode = models.BooleanField(
        default=False,
        help_text='Enable maintenance mode (blocks all users except Super Admin)'
    )
    maintenance_message = models.TextField(
        default='Le système est en maintenance. Veuillez réessayer plus tard.',
        help_text='Message shown during maintenance'
    )
    
    # Email Settings
    email_notifications_enabled = models.BooleanField(
        default=True,
        help_text='Enable email notifications'
    )
    smtp_host = models.CharField(
        max_length=200,
        blank=True,
        help_text='SMTP server host'
    )
    smtp_port = models.IntegerField(
        default=587,
        help_text='SMTP server port'
    )
    smtp_username = models.CharField(
        max_length=200,
        blank=True,
        help_text='SMTP username'
    )
    smtp_password = models.CharField(
        max_length=200,
        blank=True,
        help_text='SMTP password (encrypted)'
    )
    
    # Backup Settings
    auto_backup_enabled = models.BooleanField(
        default=False,
        help_text='Enable automatic backups'
    )
    backup_frequency = models.CharField(
        max_length=20,
        choices=[
            ('DAILY', 'Daily'),
            ('WEEKLY', 'Weekly'),
            ('MONTHLY', 'Monthly'),
        ],
        default='WEEKLY',
        help_text='Backup frequency'
    )
    last_backup_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Last backup date'
    )
    
    # Security Settings
    password_expiry_days = models.IntegerField(
        default=90,
        help_text='Password expiry in days (0 = never)'
    )
    max_login_attempts = models.IntegerField(
        default=5,
        help_text='Maximum login attempts before lockout'
    )
    session_timeout_minutes = models.IntegerField(
        default=60,
        help_text='Session timeout in minutes'
    )
    
    # Feature Flags
    enable_ai_features = models.BooleanField(
        default=True,
        help_text='Enable AI features'
    )
    enable_messaging = models.BooleanField(
        default=True,
        help_text='Enable messaging system'
    )
    enable_evaluations = models.BooleanField(
        default=True,
        help_text='Enable evaluations module'
    )
    
    # Additional Settings
    additional_settings = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional custom settings'
    )

    class Meta:
        db_table = 'system_settings'
        verbose_name = 'System Settings'
        verbose_name_plural = 'System Settings'

    def __str__(self):
        return f'System Settings - {self.system_name}'

    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings

    def save(self, *args, **kwargs):
        """Ensure only one instance exists"""
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Prevent deletion"""
        pass
