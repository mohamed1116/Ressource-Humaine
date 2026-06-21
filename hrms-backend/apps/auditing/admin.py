from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'target_type', 'target_id', 'description', 'created_at')
    list_filter = ('action', 'target_type')
    search_fields = ('description', 'user__first_name', 'user__last_name')
    readonly_fields = ('user', 'action', 'target_type', 'target_id', 'description', 'ip_address', 'extra_data', 'created_at')
