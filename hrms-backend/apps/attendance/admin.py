from django.contrib import admin
from .models import AttendanceRecord, AbsenceJustification, AttendancePolicy


@admin.register(AttendancePolicy)
class AttendancePolicyAdmin(admin.ModelAdmin):
    list_display = ('name', 'expected_start', 'expected_end', 'late_threshold_minutes', 'applies_to')


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'check_in', 'check_out', 'status', 'is_late', 'late_minutes', 'work_hours')
    list_filter = ('status', 'is_late', 'date')
    search_fields = ('employee__user__first_name', 'employee__user__last_name')


@admin.register(AbsenceJustification)
class AbsenceJustificationAdmin(admin.ModelAdmin):
    list_display = ('attendance_record', 'status', 'reviewed_by', 'created_at')
    list_filter = ('status',)
