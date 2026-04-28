from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'is_read', 'read_at', 'action_url',
            'related_object_type', 'related_object_id', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'email_leave_updates', 'email_attendance_alerts',
            'email_payslip_ready', 'email_evaluation_updates', 'in_app_enabled',
        ]
