from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'is_read', 'read_at', 'action_url',
            'related_object_type', 'related_object_id', 'created_at',
            'attachment', 'attachment_url',
        ]
        read_only_fields = ['id', 'created_at']

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'email_leave_updates', 'email_attendance_alerts',
            'email_payslip_ready', 'email_evaluation_updates', 'in_app_enabled',
        ]
