from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Conversation',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('conv_type', models.CharField(choices=[('DIRECT', 'Direct'), ('GROUP', 'Groupe')], default='DIRECT', max_length=10)),
                ('title', models.CharField(blank=True, max_length=200)),
                ('is_archived', models.BooleanField(default=False)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_conversations', to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'conversations', 'ordering': ['-updated_at']},
        ),
        migrations.CreateModel(
            name='ConversationParticipant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('last_seen_at', models.DateTimeField(blank=True, null=True)),
                ('is_muted', models.BooleanField(default=False)),
                ('is_pinned', models.BooleanField(default=False)),
                ('conversation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to='messaging.conversation')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'conversations_participants', 'unique_together': {('conversation', 'user')}},
        ),
        migrations.AddField(
            model_name='conversation',
            name='participants',
            field=models.ManyToManyField(related_name='conversations', through='messaging.ConversationParticipant', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('subject', models.CharField(blank=True, max_length=300)),
                ('body', models.TextField()),
                ('is_deleted', models.BooleanField(default=False)),
                ('is_edited', models.BooleanField(default=False)),
                ('is_starred', models.BooleanField(default=False)),
                ('conversation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='messaging.conversation')),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_messages', to=settings.AUTH_USER_MODEL)),
                ('reply_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='replies', to='messaging.message')),
            ],
            options={'db_table': 'messages', 'ordering': ['created_at']},
        ),
        migrations.CreateModel(
            name='Attachment',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('file', models.FileField(upload_to='messaging/attachments/%Y/%m/')),
                ('original_name', models.CharField(max_length=255)),
                ('file_size', models.PositiveIntegerField(default=0)),
                ('mime_type', models.CharField(blank=True, max_length=100)),
                ('message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attachments', to='messaging.message')),
                ('uploaded_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'message_attachments'},
        ),
        migrations.CreateModel(
            name='MessageRead',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('read_at', models.DateTimeField(auto_now_add=True)),
                ('message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reads', to='messaging.message')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='message_reads', to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'message_reads', 'unique_together': {('message', 'user')}},
        ),
        migrations.CreateModel(
            name='MessageReaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('emoji', models.CharField(max_length=10)),
                ('added_at', models.DateTimeField(auto_now_add=True)),
                ('message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reactions', to='messaging.message')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'message_reactions', 'unique_together': {('message', 'user', 'emoji')}},
        ),
    ]
