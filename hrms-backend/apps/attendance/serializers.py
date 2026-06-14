from rest_framework import serializers
from .models import AttendanceRecord, AbsenceJustification, AttendancePolicy


class AttendancePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendancePolicy
        fields = '__all__'


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee', 'employee_name', 'department_name',
            'date', 'check_in', 'check_out', 'status',
            'is_late', 'late_minutes', 'work_hours', 'notes',
            'recorded_by', 'created_at',
        ]
        read_only_fields = ['id', 'is_late', 'late_minutes', 'work_hours', 'created_at']

    def get_employee_name(self, obj):
        return obj.employee.full_name

    def get_department_name(self, obj):
        return obj.employee.department.name


class AbsenceJustificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbsenceJustification
        fields = [
            'id', 'attendance_record', 'reason', 'attachment',
            'status', 'reviewed_by', 'reviewed_at', 'review_comment',
            'created_at',
        ]
        read_only_fields = ['id', 'reviewed_by', 'reviewed_at', 'created_at']


class CheckInOutSerializer(serializers.Serializer):
    timestamp = serializers.TimeField(required=False)
