from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from apps.accounts.permissions import IsAdminHR
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
from .services import NotificationService

User = get_user_model()

# -------------------------------------------------------
# Notification System Views
# Handles broadcast, listing, read/unread tracking
# and per-user notification preferences
# -------------------------------------------------------

# Admin broadcast - sends notification to all users, specific roles or specific users
class AdminBroadcastView(APIView):
    """POST /notifications/broadcast/ -- Admin sends notification with optional file attachment."""
    permission_classes = [IsAdminHR]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        title   = request.data.get('title', '').strip()
        message = request.data.get('message', '').strip()
        target  = request.data.get('target', 'ALL')
        roles   = request.data.getlist('roles') if hasattr(request.data, 'getlist') else request.data.get('roles', [])
        user_ids = request.data.getlist('user_ids') if hasattr(request.data, 'getlist') else request.data.get('user_ids', [])
        attachment = request.FILES.get('attachment')

        if not title or not message:
            return Response({'detail': 'Titre et message obligatoires.'}, status=400)

        if target == 'ALL':
            recipients = User.objects.filter(is_active=True)
        elif target == 'SPECIFIC' and user_ids:
            recipients = User.objects.filter(id__in=user_ids, is_active=True)
        elif target == 'ROLE' and roles:
            recipients = User.objects.filter(role__in=roles, is_active=True)
        else:
            recipients = User.objects.filter(is_active=True)

        count = 0
        # Create a notification for each recipient
        for user in recipients:
            Notification.objects.create(
                recipient=user,
                notification_type='SYSTEM_ANNOUNCEMENT',
                title=title,
                message=message,
                attachment=attachment,
            )
            count += 1

        return Response({'count': count})


# Notification list - returns all notifications for the authenticated user
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


# Unread count - returns number of unread notifications for badge display
class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = NotificationService.get_unread_count(request.user)
        return Response({'unread_count': count})


# Mark as read - marks a single notification as read
class MarkAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
            return Response(NotificationSerializer(notification).data)
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Mark all unread notifications as read in a single DB query
        updated = Notification.objects.filter(
            recipient=request.user, is_read=False,
        ).update(is_read=True, read_at=timezone.now())
        return Response({'marked_read': updated})


# Delete notification - removes a notification for the authenticated user
class NotificationDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


# Notification preferences - get or update per-user notification settings
class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return obj
