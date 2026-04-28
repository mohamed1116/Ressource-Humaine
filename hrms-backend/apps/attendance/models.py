from datetime import time, date, datetime
from django.db import models
from apps.core.models import TimeStampedModel


class AttendancePolicy(TimeStampedModel):
    """Configurable attendance rules."""
    name = models.CharField(max_length=100, unique=True)
    expected_start = models.TimeField(default=time(8, 30))
    expected_end = models.TimeField(default=time(16, 30))
    late_threshold_minutes = models.PositiveSmallIntegerField(default=15)
    min_work_hours = models.DecimalField(max_digits=4, decimal_places=2, default=8.0)
    applies_to = models.CharField(
        max_length=10,
        choices=[('ALL', 'All'), ('PROFESSOR', 'Professors'), ('STAFF', 'Staff')],
        default='ALL',
    )

    class Meta:
        db_table = 'attendance_policies'

    def __str__(self):
        return self.name


class AttendanceRecord(TimeStampedModel):
    class Status(models.TextChoices):
        PRESENT = 'PRESENT', 'Present'
        ABSENT = 'ABSENT', 'Absent'
        ON_LEAVE = 'ON_LEAVE', 'On Leave'
        LATE = 'LATE', 'Late'
        HALF_DAY = 'HALF_DAY', 'Half Day'

    employee = models.ForeignKey(
        'employees.Employee', on_delete=models.CASCADE, related_name='attendance_records',
    )
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PRESENT)
    is_late = models.BooleanField(default=False)
    late_minutes = models.PositiveSmallIntegerField(default=0)
    work_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, related_name='recorded_attendances',
    )

    class Meta:
        db_table = 'attendance_records'
        unique_together = ['employee', 'date']
        ordering = ['-date']

    def __str__(self):
        return f'{self.employee.full_name} - {self.date} ({self.status})'

    def save(self, *args, **kwargs):
        # Auto-calculate work_hours
        if self.check_in and self.check_out:
            dt_in = datetime.combine(date.min, self.check_in)
            dt_out = datetime.combine(date.min, self.check_out)
            diff = (dt_out - dt_in).total_seconds() / 3600
            self.work_hours = round(max(diff, 0), 2)

        # Auto-detect lateness
        if self.check_in:
            expected_start = time(8, 30)
            if self.check_in > expected_start:
                self.is_late = True
                dt_actual = datetime.combine(date.min, self.check_in)
                dt_expected = datetime.combine(date.min, expected_start)
                self.late_minutes = int((dt_actual - dt_expected).total_seconds() / 60)
                self.status = self.Status.LATE
            else:
                self.is_late = False
                self.late_minutes = 0

        super().save(*args, **kwargs)


class AbsenceJustification(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'

    attendance_record = models.OneToOneField(
        AttendanceRecord, on_delete=models.CASCADE, related_name='justification',
    )
    reason = models.TextField()
    attachment = models.FileField(
        upload_to='absence_justifications/%Y/%m/', null=True, blank=True,
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING,
    )
    reviewed_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_justifications',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_comment = models.TextField(blank=True)

    class Meta:
        db_table = 'absence_justifications'

    def __str__(self):
        return f'Justification for {self.attendance_record}'
