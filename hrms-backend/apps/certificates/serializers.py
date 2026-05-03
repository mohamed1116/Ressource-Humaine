"""
Serializers for the Document Template System.
Handles data validation and API representation for templates,
document requests, generated documents, and missions.
"""
from rest_framework import serializers
from .models import DocumentTemplate, DocumentRequest, GeneratedDocument, Mission


# ─────────────────── Document Templates ───────────────────

class DocumentTemplateListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing templates (no content body)."""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    language_display = serializers.CharField(source='get_language_display', read_only=True)
    variable_count = serializers.SerializerMethodField()

    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'name', 'category', 'category_display',
            'target_audience',
            'language', 'language_display', 'description',
            'is_active', 'variable_count', 'created_at', 'updated_at',
        ]

    def get_variable_count(self, obj):
        return len(obj.variables) if obj.variables else 0


class DocumentTemplateSerializer(serializers.ModelSerializer):
    """Full serializer for creating/editing templates (includes content)."""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    language_display = serializers.CharField(source='get_language_display', read_only=True)

    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'name', 'category', 'category_display',
            'language', 'language_display', 'description', 'is_active',
            'content', 'variables', 'header_html', 'footer_html',
            'logo', 'custom_css', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ─────────────────── Document Requests ───────────────────

class DocumentRequestSerializer(serializers.ModelSerializer):
    """Full serializer for document requests."""
    requested_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    template_name = serializers.CharField(source='template.name', read_only=True)
    template_category = serializers.CharField(source='template.category', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_pdf = serializers.SerializerMethodField()

    class Meta:
        model = DocumentRequest
        fields = [
            'id', 'requested_by', 'requested_by_name',
            'template', 'template_name', 'template_category',
            'status', 'status_display', 'extra_data', 'message',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'rejection_reason', 'has_pdf',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'requested_by', 'status',
            'reviewed_by', 'reviewed_at', 'rejection_reason',
            'created_at', 'updated_at',
        ]

    def get_requested_by_name(self, obj):
        return obj.requested_by.get_full_name()

    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.get_full_name() if obj.reviewed_by else None

    def get_has_pdf(self, obj):
        return obj.generated_documents.exists()


class DocumentRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for submitting a new document request."""
    class Meta:
        model = DocumentRequest
        fields = ['template', 'extra_data', 'message']


class DocumentReviewSerializer(serializers.Serializer):
    """Serializer for approving or rejecting a request."""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default='')


# ─────────────────── Generated Documents ───────────────────

class GeneratedDocumentSerializer(serializers.ModelSerializer):
    """Serializer for generated PDF documents."""
    class Meta:
        model = GeneratedDocument
        fields = ['id', 'request', 'pdf_file', 'generated_by', 'created_at']
        read_only_fields = ['id', 'created_at']


# ─────────────────── Missions ───────────────────

class MissionSerializer(serializers.ModelSerializer):
    """Full serializer for academic missions."""
    employee_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Mission
        fields = [
            'id', 'employee', 'employee_name',
            'title', 'description', 'destination',
            'start_date', 'end_date',
            'status', 'status_display', 'budget',
            'approved_by', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'approved_by', 'created_at', 'updated_at']

    def get_employee_name(self, obj):
        return obj.employee.full_name


class MissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mission
        fields = ['employee', 'title', 'description', 'destination',
                  'start_date', 'end_date', 'budget', 'notes']
