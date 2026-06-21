from rest_framework import serializers
from apps.accounts.models import User
from .models import Conversation, ConversationParticipant, Message, Attachment, MessageRead, MessageReaction


class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role      = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'first_name', 'last_name', 'full_name', 'role', 'avatar', 'avatar_url']

    def get_full_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'.strip()

    def get_role(self, obj):
        return obj.get_role_display()

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


class AttachmentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model  = Attachment
        fields = ['id', 'original_name', 'file_size', 'mime_type', 'download_url', 'created_at']

    def get_download_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class ReactionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model  = MessageReaction
        fields = ['id', 'emoji', 'user_name', 'added_at']


class MessageSerializer(serializers.ModelSerializer):
    sender      = UserMiniSerializer(read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    reactions   = ReactionSerializer(many=True, read_only=True)
    is_mine     = serializers.SerializerMethodField()
    is_read     = serializers.SerializerMethodField()
    reply_to_preview = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = ['id', 'conversation', 'sender', 'subject', 'body', 'reply_to',
                  'reply_to_preview', 'attachments', 'reactions',
                  'is_deleted', 'is_edited', 'is_starred',
                  'is_mine', 'is_read', 'created_at', 'updated_at']
        read_only_fields = ['id', 'conversation', 'sender', 'is_deleted', 'created_at', 'updated_at']

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return request and obj.sender_id == request.user.id

    def get_is_read(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        return obj.reads.filter(user=request.user).exists()

    def get_reply_to_preview(self, obj):
        if not obj.reply_to:
            return None
        return {
            'id': str(obj.reply_to.id),
            'body': obj.reply_to.body[:100],
            'sender_name': obj.reply_to.sender.get_full_name(),
        }


class ConversationSerializer(serializers.ModelSerializer):
    participants    = UserMiniSerializer(many=True, read_only=True)
    participant_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)
    last_message    = serializers.SerializerMethodField()
    unread_count    = serializers.SerializerMethodField()
    display_name    = serializers.SerializerMethodField()
    is_pinned       = serializers.SerializerMethodField()
    is_muted        = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = ['id', 'conv_type', 'title', 'participants', 'participant_ids',
                  'last_message', 'unread_count', 'display_name',
                  'is_pinned', 'is_muted', 'is_archived',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        msg = obj.messages.filter(is_deleted=False).order_by('-created_at').first()
        if not msg:
            return None
        has_attach = msg.attachments.exists()
        return {
            'id': str(msg.id),
            'body': msg.body[:80] if not msg.is_deleted else 'Message supprimé',
            'sender_name': f'{msg.sender.first_name} {msg.sender.last_name}',
            'created_at': msg.created_at.isoformat(),
            'has_attachment': has_attach,
            'is_deleted': msg.is_deleted,
        }

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        read_ids = MessageRead.objects.filter(
            user=request.user, message__conversation=obj,
        ).values_list('message_id', flat=True)
        return obj.messages.filter(is_deleted=False).exclude(
            sender=request.user
        ).exclude(id__in=read_ids).count()

    def get_display_name(self, obj):
        request = self.context.get('request')
        if obj.conv_type == 'GROUP':
            return obj.title or 'Groupe'
        if not request:
            return ''
        other = obj.participants.exclude(id=request.user.id).first()
        return f'{other.first_name} {other.last_name}' if other else 'Conversation'

    def get_is_pinned(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        m = obj.memberships.filter(user=request.user).first()
        return m.is_pinned if m else False

    def get_is_muted(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        m = obj.memberships.filter(user=request.user).first()
        return m.is_muted if m else False

    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        request = self.context['request']
        conv = Conversation.objects.create(created_by=request.user, **validated_data)
        ConversationParticipant.objects.create(conversation=conv, user=request.user)
        for uid in participant_ids:
            try:
                u = User.objects.get(id=uid)
                ConversationParticipant.objects.get_or_create(conversation=conv, user=u)
            except User.DoesNotExist:
                pass
        return conv
