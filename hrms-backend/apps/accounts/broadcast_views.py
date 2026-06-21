"""
Broadcast Notifications API
Allows Super Admin to send notifications to all users or specific roles
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model

from apps.accounts.permissions import IsSuperAdmin
from apps.notifications.models import Notification

User = get_user_model()


class BroadcastNotificationView(APIView):
    permission_classes = [IsSuperAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        title      = request.data.get('title', '').strip()
        message    = request.data.get('message', '').strip()
        target     = request.data.get('target', 'ALL')
        roles      = request.data.getlist('roles') if hasattr(request.data, 'getlist') else request.data.get('roles', [])
        user_ids   = request.data.getlist('user_ids') if hasattr(request.data, 'getlist') else request.data.get('user_ids', [])
        attachment = request.FILES.get('attachment')

        if not title or not message:
            return Response({'detail': 'Title and message are required.'}, status=400)

        if target == 'ALL':
            recipients = User.objects.filter(is_active=True)
        elif target == 'ROLE' and roles:
            recipients = User.objects.filter(role__in=roles, is_active=True)
        elif target == 'SPECIFIC' and user_ids:
            recipients = User.objects.filter(id__in=user_ids, is_active=True)
        else:
            recipients = User.objects.filter(is_active=True)

        count = 0
        for user in recipients:
            Notification.objects.create(
                recipient=user,
                notification_type='SYSTEM_ANNOUNCEMENT',
                title=title,
                message=message,
                attachment=attachment,
            )
            count += 1

        return Response({'detail': f'Notification sent to {count} users.', 'count': count})

