"""
Activity Logs Views for Super Admin
"""
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from apps.accounts.permissions import IsSuperAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class ActivityLogsListView(generics.ListAPIView):
    """
    GET /api/v1/superadmin/activity-logs/
    Returns paginated activity logs
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related('user').all()
    filterset_fields = ['action', 'target_type', 'user']
    search_fields = ['description', 'user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['created_at']


class ActivityStatsView(APIView):
    """
    GET /api/v1/superadmin/activity-stats/
    Returns activity statistics
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)

        stats = {
            'total_actions': AuditLog.objects.count(),
            'last_24h': AuditLog.objects.filter(created_at__gte=last_24h).count(),
            'last_7d': AuditLog.objects.filter(created_at__gte=last_7d).count(),
            'last_30d': AuditLog.objects.filter(created_at__gte=last_30d).count(),
            'by_action': dict(
                AuditLog.objects.values('action')
                .annotate(count=Count('id'))
                .values_list('action', 'count')
            ),
            'by_user': list(
                AuditLog.objects.filter(user__isnull=False)
                .values('user__first_name', 'user__last_name', 'user__email')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            ),
            'recent_logins': AuditLog.objects.filter(
                action='LOGIN',
                created_at__gte=last_24h
            ).count(),
        }

        return Response(stats)
