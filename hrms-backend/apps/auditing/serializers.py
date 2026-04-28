from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'action', 'action_display',
            'target_type', 'target_id', 'description',
            'ip_address', 'extra_data', 'created_at',
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else 'Systeme'
