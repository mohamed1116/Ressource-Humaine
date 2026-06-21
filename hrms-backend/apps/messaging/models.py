import uuid
from django.db import models
from apps.core.models import TimeStampedModel

# Messaging system models: Conversation, Message, Attachment, Reaction, ReadReceipt

# Messaging system models: Conversation, Message, Attachment, Reaction, ReadReceipt


class Conversation(TimeStampedModel):
    class ConvType(models.TextChoices):
        DIRECT = 'DIRECT', 'Direct'
        GROUP  = 'GROUP',  'Groupe'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conv_type    = models.CharField(max_length=10, choices=ConvType.choices, default=ConvType.DIRECT)
    title        = models.CharField(max_length=200, blank=True)
    participants = models.ManyToManyField('accounts.User', related_name='conversations',
                                          through='ConversationParticipant')
    created_by   = models.ForeignKey('accounts.User', on_delete=models.SET_NULL,
                                      null=True, related_name='created_conversations')
    is_archived  = models.BooleanField(default=False)

    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']

    def __str__(self):
        return self.title or f'Conv {self.id}'

    @property
    def last_message(self):
        return self.messages.filter(is_deleted=False).order_by('-created_at').first()


class ConversationParticipant(models.Model):
    conversation  = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='memberships')
    user          = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='memberships')
    joined_at     = models.DateTimeField(auto_now_add=True)
    last_seen_at  = models.DateTimeField(null=True, blank=True)
    is_muted      = models.BooleanField(default=False)
    is_pinned     = models.BooleanField(default=False)

    class Meta:
        db_table = 'conversations_participants'
        unique_together = ('conversation', 'user')


class Message(TimeStampedModel):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender       = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='sent_messages')
    subject      = models.CharField(max_length=300, blank=True)
    body         = models.TextField()
    reply_to     = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='replies')
    is_deleted   = models.BooleanField(default=False)
    is_edited    = models.BooleanField(default=False)
    is_starred   = models.BooleanField(default=False)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender} → {self.conversation_id}: {self.body[:40]}'


class Attachment(TimeStampedModel):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message       = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    file          = models.FileField(upload_to='messaging/attachments/%Y/%m/')
    original_name = models.CharField(max_length=255)
    file_size     = models.PositiveIntegerField(default=0)
    mime_type     = models.CharField(max_length=100, blank=True)
    uploaded_by   = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'message_attachments'

    def __str__(self):
        return self.original_name

    @property
    def size_display(self):
        if self.file_size < 1024:
            return f'{self.file_size} B'
        if self.file_size < 1024 * 1024:
            return f'{self.file_size // 1024} KB'
        return f'{self.file_size // (1024 * 1024)} MB'


class MessageRead(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reads')
    user    = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='message_reads')
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'message_reads'
        unique_together = ('message', 'user')


class MessageReaction(models.Model):
    message  = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user     = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    emoji    = models.CharField(max_length=10)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'message_reactions'
        unique_together = ('message', 'user', 'emoji')
