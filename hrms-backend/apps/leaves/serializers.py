from rest_framework import serializers
from .models import LeaveType, LeaveBalance, LeaveRequest


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = [
            'id', 'name', 'category', 'max_days_per_year',
            'requires_attachment', 'is_paid', 'applies_to', 'description',
        ]


class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    remaining_days = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveBalance
        fields = [
            'id', 'employee', 'employee_name', 'leave_type', 'leave_type_name',
            'year', 'total_days', 'used_days', 'carried_over', 'remaining_days',
        ]

    def get_employee_name(self, obj):
        return obj.employee.full_name


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    department_head_action_by_name = serializers.SerializerMethodField()
    hr_action_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name', 'leave_type', 'leave_type_name',
            'start_date', 'end_date', 'total_days', 'reason', 'status', 'attachment',
            'department_head_action_by', 'department_head_action_by_name',
            'department_head_action_date', 'department_head_comment',
            'hr_action_by', 'hr_action_by_name', 'hr_action_date', 'hr_comment',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'total_days', 'status',
            'department_head_action_by', 'department_head_action_date',
            'hr_action_by', 'hr_action_date', 'created_at', 'updated_at',
        ]

    def get_employee_name(self, obj):
        return obj.employee.full_name

    def get_department_head_action_by_name(self, obj):
        if obj.department_head_action_by:
            u = obj.department_head_action_by
            return f'{u.first_name} {u.last_name}'
        return None

    def get_hr_action_by_name(self, obj):
        if obj.hr_action_by:
            u = obj.hr_action_by
            return f'{u.first_name} {u.last_name}'
        return None


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ['leave_type', 'start_date', 'end_date', 'reason', 'attachment']

    def validate(self, attrs):
        if attrs['start_date'] > attrs['end_date']:
            raise serializers.ValidationError('Start date must be before end date.')
        return attrs


class LeaveActionSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True, default='')
