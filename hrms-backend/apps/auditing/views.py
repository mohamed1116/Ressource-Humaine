from rest_framework import generics
from apps.accounts.permissions import IsAdminHR
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """
    GET /audit/logs/
    HR-only: full audit trail with filtering.
    """
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminHR]
    filterset_fields = ['action', 'target_type', 'user']
    search_fields = ['description', 'target_type']
    ordering_fields = ['created_at']
