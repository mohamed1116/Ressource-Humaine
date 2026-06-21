from rest_framework import serializers
from .models import Alert, Recommendation


class AlertSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Alert
        fields = [
            'id', 'department', 'department_name', 'category', 'severity',
            'title', 'description', 'metric_value', 'threshold_value',
            'is_active', 'resolved_at', 'acknowledged_by', 'created_at',
        ]


class RecommendationSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()

    class Meta:
        model = Recommendation
        fields = [
            'id', 'category', 'priority', 'title', 'description',
            'affected_department', 'department_name', 'status', 'expires_at', 'created_at',
        ]

    def get_department_name(self, obj):
        if obj.affected_department:
            return obj.affected_department.name
        return None
