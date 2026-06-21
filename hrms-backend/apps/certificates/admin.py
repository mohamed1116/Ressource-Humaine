"""
Django admin configuration for the Document Template System.
Allows managing templates, requests, and missions through the admin panel.
"""
# Django admin registration for certificates app
from django.contrib import admin
from .models import DocumentTemplate, DocumentRequest, GeneratedDocument, Mission


@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'language', 'is_active', 'created_at')
    list_filter = ('category', 'language', 'is_active')
    search_fields = ('name', 'description')


@admin.register(DocumentRequest)
class DocumentRequestAdmin(admin.ModelAdmin):
    list_display = ('template', 'requested_by', 'status', 'reviewed_by', 'created_at')
    list_filter = ('status', 'template')
    search_fields = ('requested_by__first_name', 'requested_by__last_name')


@admin.register(GeneratedDocument)
class GeneratedDocumentAdmin(admin.ModelAdmin):
    list_display = ('request', 'generated_by', 'created_at')


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ('title', 'employee', 'destination', 'start_date', 'end_date', 'status')
    list_filter = ('status',)
    search_fields = ('title', 'destination', 'employee__user__first_name')
