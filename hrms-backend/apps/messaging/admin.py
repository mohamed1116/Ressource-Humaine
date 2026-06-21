from django.contrib import admin
from .models import Conversation, ConversationParticipant, Message, Attachment, MessageRead, MessageReaction


class ParticipantInline(admin.TabularInline):
    model = ConversationParticipant
    extra = 0


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'conv_type', 'title', 'created_by', 'is_archived', 'created_at']
    list_filter  = ['conv_type', 'is_archived']
    inlines      = [ParticipantInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'conversation', 'body', 'is_deleted', 'is_starred', 'created_at']
    list_filter  = ['is_deleted', 'is_starred']


admin.site.register(Attachment)
admin.site.register(MessageReaction)
