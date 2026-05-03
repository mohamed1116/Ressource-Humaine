import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from apps.core.models import TimeStampedModel


class User(AbstractUser):
    """Custom User model. Email is the login identifier."""

    class Role(models.TextChoices):
        ADMIN_HR = 'ADMIN_HR', 'Admin / HR'
        DEPARTMENT_HEAD = 'DEPARTMENT_HEAD', 'Department Head'
        PROFESSOR = 'PROFESSOR', 'Professor'
        STAFF = 'STAFF', 'Administrative Staff'
        STUDENT = 'STUDENT', 'Student'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STAFF)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.email})'

    @property
    def is_hr_admin(self):
        return self.role == self.Role.ADMIN_HR

    @property
    def is_department_head(self):
        return self.role == self.Role.DEPARTMENT_HEAD

    @property
    def is_professor(self):
        return self.role == self.Role.PROFESSOR


class PasswordResetToken(TimeStampedModel):
    """Tracks password reset tokens with expiry."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_tokens'
