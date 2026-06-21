import os
import uuid
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.accounts.models import User
from .models import Conversation, ConversationParticipant, Message, Attachment, MessageRead, MessageReaction
from .serializers import ConversationSerializer, MessageSerializer, UserMiniSerializer, AttachmentSerializer

ALLOWED_MIME = {
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/zip', 'text/plain',
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# -------------------------------------------------------
# Messaging System Views
# Supports direct messages, group conversations,
# file attachments, reactions, and read receipts
# -------------------------------------------------------


class IsNotStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role != 'STUDENT'


# Conversation list and create - returns user's conversations, supports search and archive filter
class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class   = ConversationSerializer
    permission_classes = [IsNotStudent]

    def get_queryset(self):
        qs = Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages', 'memberships').order_by('-updated_at')

        archived = self.request.query_params.get('archived', 'false')
        if archived == 'true':
            qs = qs.filter(is_archived=True)
        else:
            qs = qs.filter(is_archived=False)

        q = self.request.query_params.get('q', '')
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(messages__body__icontains=q) |
                Q(participants__first_name__icontains=q) |
                Q(participants__last_name__icontains=q)
            ).distinct()

        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


# Conversation detail - retrieve, archive/unarchive, pin/mute per user
class ConversationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class   = ConversationSerializer
    permission_classes = [IsNotStudent]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def patch(self, request, *args, **kwargs):
        conv = self.get_object()
        # Archive/unarchive
        if 'is_archived' in request.data:
            conv.is_archived = request.data['is_archived']
            conv.save(update_fields=['is_archived'])
        # Pin/mute per user
        membership = conv.memberships.filter(user=request.user).first()
        if membership:
            if 'is_pinned' in request.data:
                membership.is_pinned = request.data['is_pinned']
                membership.save(update_fields=['is_pinned'])
            if 'is_muted' in request.data:
                membership.is_muted = request.data['is_muted']
                membership.save(update_fields=['is_muted'])
        return Response(ConversationSerializer(conv, context={'request': request}).data)


# Message list and create - marks messages as read on fetch, supports file attachments
class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class   = MessageSerializer
    permission_classes = [IsNotStudent]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get_conversation(self):
        return Conversation.objects.get(id=self.kwargs['conv_id'], participants=self.request.user)

    def get_queryset(self):
        conv = self.get_conversation()
        # Mark all unread messages as read when user opens the conversation
        unread = conv.messages.filter(is_deleted=False).exclude(sender=self.request.user)
        already_read = MessageRead.objects.filter(
            user=self.request.user, message__in=unread
        ).values_list('message_id', flat=True)
        to_mark = unread.exclude(id__in=already_read)
        MessageRead.objects.bulk_create(
            [MessageRead(message=m, user=self.request.user) for m in to_mark],
            ignore_conflicts=True
        )
        # Update last_seen
        conv.memberships.filter(user=self.request.user).update(last_seen_at=timezone.now())
        return conv.messages.select_related('sender', 'reply_to', 'reply_to__sender').prefetch_related(
            'attachments', 'reactions', 'reads'
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        conv = self.get_conversation()
        reply_to_id = self.request.data.get('reply_to')
        reply_to = None
        if reply_to_id:
            try:
                reply_to = Message.objects.get(id=reply_to_id, conversation=conv)
            except Message.DoesNotExist:
                pass

        msg = serializer.save(
            sender=self.request.user,
            conversation=conv,
            reply_to=reply_to,
        )

        # Handle file attachments
        files = self.request.FILES.getlist('attachments')
        for f in files:
            if f.content_type not in ALLOWED_MIME:
                continue
            if f.size > MAX_FILE_SIZE:
                continue
            Attachment.objects.create(
                message=msg,
                file=f,
                original_name=f.name,
                file_size=f.size,
                mime_type=f.content_type,
                uploaded_by=self.request.user,
            )

        # Update conversation timestamp after new message
        Conversation.objects.filter(id=conv.id).update(updated_at=timezone.now())
        MessageRead.objects.get_or_create(message=msg, user=self.request.user)


# Message delete/edit - soft delete or edit own messages
class MessageDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            msg = Message.objects.get(id=pk, sender=request.user)
            msg.is_deleted = True
            msg.body = 'Message supprimé'
            msg.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Message.DoesNotExist:
            return Response({'detail': 'Non trouvé.'}, status=404)

    def patch(self, request, pk):
        """Edit message body or toggle star"""
        try:
            msg = Message.objects.get(id=pk, sender=request.user)
            if 'body' in request.data:
                msg.body = request.data['body']
                msg.is_edited = True
            if 'is_starred' in request.data:
                msg.is_starred = request.data['is_starred']
            msg.save()
            return Response(MessageSerializer(msg, context={'request': request}).data)
        except Message.DoesNotExist:
            return Response({'detail': 'Non trouvé.'}, status=404)


# Message reaction - toggle emoji reactions on messages
class MessageReactionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        emoji = request.data.get('emoji', '')
        if not emoji:
            return Response({'detail': 'emoji requis.'}, status=400)
        try:
            msg = Message.objects.get(id=pk)
            reaction, created = MessageReaction.objects.get_or_create(
                message=msg, user=request.user, emoji=emoji
            )
            if not created:
                reaction.delete()
                return Response({'action': 'removed'})
            return Response({'action': 'added'})
        except Message.DoesNotExist:
            return Response({'detail': 'Non trouvé.'}, status=404)


# Unread count view - returns number of unread messages for the authenticated user
class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        read_ids = MessageRead.objects.filter(user=request.user).values_list('message_id', flat=True)
        count = Message.objects.filter(
            conversation__participants=request.user, is_deleted=False,
        ).exclude(sender=request.user).exclude(id__in=read_ids).count()
        return Response({'unread_count': count})


# User list view for messaging - returns all active users for conversation creation
class UserListView(APIView):
    permission_classes = [IsNotStudent]

    def get(self, request):
        users = User.objects.exclude(id=request.user.id).exclude(is_active=False).order_by('first_name', 'last_name')
        return Response(UserMiniSerializer(users, many=True, context={'request': request}).data)


# User search - search users by name or email for new conversation
class UserSearchView(APIView):
    permission_classes = [IsNotStudent]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        users = User.objects.filter(
            Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(email__icontains=q)
        ).exclude(id=request.user.id).exclude(is_active=False).order_by('first_name')[:20]
        return Response(UserMiniSerializer(users, many=True, context={'request': request}).data)


# Find or create direct conversation - returns existing or creates new 1-on-1 chat
class FindOrCreateDirectView(APIView):
    permission_classes = [IsNotStudent]

    def post(self, request):
        other_id = request.data.get('user_id')
        if not other_id:
            return Response({'detail': 'user_id requis.'}, status=400)
        try:
            other = User.objects.get(id=other_id)
        except User.DoesNotExist:
            return Response({'detail': 'Utilisateur introuvable.'}, status=404)

        existing = Conversation.objects.filter(
            conv_type='DIRECT', participants=request.user,
        ).filter(participants=other).first()

        ctx = {'request': request}
        if existing:
            return Response(ConversationSerializer(existing, context=ctx).data)

        conv = Conversation.objects.create(conv_type='DIRECT', created_by=request.user)
        ConversationParticipant.objects.create(conversation=conv, user=request.user)
        ConversationParticipant.objects.create(conversation=conv, user=other)
        return Response(ConversationSerializer(conv, context=ctx).data, status=201)
