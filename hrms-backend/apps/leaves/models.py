from django.db import models
from django.core.exceptions import ValidationError
from apps.core.models import TimeStampedModel


class LeaveType(TimeStampedModel):
    class Category(models.TextChoices):
        ANNUAL = 'ANNUAL', 'Annual Leave (Conge Annuel)'
        SICK = 'SICK', 'Sick Leave (Conge Maladie)'
        MATERNITY = 'MATERNITY', 'Maternity Leave (Conge Maternite)'
        PATERNITY = 'PATERNITY', 'Paternity Leave (Conge Paternite)'
        ACADEMIC = 'ACADEMIC', 'Academic Leave (Conge Academique)'
        UNPAID = 'UNPAID', 'Unpaid Leave (Conge Sans Solde)'
        EXCEPTIONAL = 'EXCEPTIONAL', 'Exceptional Leave (Conge Exceptionnel)'

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=15, choices=Category.choices)
    max_days_per_year = models.PositiveSmallIntegerField()
    requires_attachment = models.BooleanField(default=False)
    is_paid = models.BooleanField(default=True)
    applies_to = models.CharField(
        max_length=10,
        choices=[('ALL', 'All'), ('PROFESSOR', 'Professors'), ('STAFF', 'Staff')],
        default='ALL',
    )
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'leave_types'
        ordering = ['name']

    def __str__(self):
        return self.name


class LeaveBalance(TimeStampedModel):
    """Tracks remaining leave days per employee per leave type per year."""
    employee = models.ForeignKey(
        'employees.Employee', on_delete=models.CASCADE, related_name='leave_balances',
    )
    leave_type = models.ForeignKey(
        LeaveType, on_delete=models.CASCADE, related_name='balances',
    )
    year = models.PositiveSmallIntegerField()
    total_days = models.DecimalField(max_digits=5, decimal_places=1)
    used_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    carried_over = models.DecimalField(max_digits=5, decimal_places=1, default=0)

    class Meta:
        db_table = 'leave_balances'
        unique_together = ['employee', 'leave_type', 'year']
        ordering = ['year', 'leave_type']

    @property
    def remaining_days(self):
        return self.total_days + self.carried_over - self.used_days

    def __str__(self):
        return f'{self.employee} - {self.leave_type} ({self.year}): {self.remaining_days} remaining'


class LeaveRequest(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        DEPT_APPROVED = 'DEPT_APPROVED', 'Approved by Department Head'
        APPROVED = 'APPROVED', 'Approved by HR'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'

    employee = models.ForeignKey(
        'employees.Employee', on_delete=models.CASCADE, related_name='leave_requests',
    )
    leave_type = models.ForeignKey(
        LeaveType, on_delete=models.PROTECT, related_name='requests',
    )
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.DecimalField(max_digits=5, decimal_places=1)
    reason = models.TextField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    attachment = models.FileField(upload_to='leave_attachments/%Y/%m/', null=True, blank=True)

    # Department Head approval tracking
    department_head_action_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='dept_leave_actions',
    )
    department_head_action_date = models.DateTimeField(null=True, blank=True)
    department_head_comment = models.TextField(blank=True)

    # HR approval tracking
    hr_action_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='hr_leave_actions',
    )
    hr_action_date = models.DateTimeField(null=True, blank=True)
    hr_comment = models.TextField(blank=True)

    class Meta:
        db_table = 'leave_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.employee.full_name} - {self.leave_type.name} ({self.start_date} to {self.end_date})'

    def clean(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError('Start date must be before end date.')
