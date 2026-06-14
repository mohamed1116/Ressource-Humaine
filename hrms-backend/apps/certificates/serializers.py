"""
Serializers for the Document Template System.
Handles data validation and API representation for templates,
document requests, generated documents, and missions.
"""
from rest_framework import serializers
from .models import DocumentTemplate, DocumentRequest, GeneratedDocument, Mission, SignatureStamp


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
            'is_active', 'requires_signature', 'variable_count', 'created_at', 'updated_at',
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
            'target_audience',
            'language', 'language_display', 'description', 'is_active', 'requires_signature',
            'content', 'variables', 'header_html', 'footer_html',
            'logo', 'custom_css', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ─────────────────── Document Requests ───────────────────

class DocumentRequestSerializer(serializers.ModelSerializer):
    """Full serializer for document requests."""
    requested_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    template_name = serializers.CharField(source='template.name', read_only=True, default='')
    template_category = serializers.CharField(source='template.category', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_pdf = serializers.SerializerMethodField()
    has_template = serializers.SerializerMethodField()
    last_generated_at = serializers.SerializerMethodField()

    class Meta:
        model = DocumentRequest
        fields = [
            'id', 'requested_by', 'requested_by_name',
            'template', 'template_name', 'template_category',
            'status', 'status_display', 'extra_data', 'message',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'rejection_reason', 'has_pdf', 'has_template',
            'attachment', 'signed_document', 'created_at', 'updated_at', 'last_generated_at',
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

    def get_has_template(self, obj):
        return obj.template_id is not None

    def get_last_generated_at(self, obj):
        """Return the creation date of the most recent generated document."""
        latest_doc = obj.generated_documents.order_by('-created_at').first()
        return latest_doc.created_at if latest_doc else None


class DocumentRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for submitting a new document request."""
    template = serializers.PrimaryKeyRelatedField(
        queryset=DocumentTemplate.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = DocumentRequest
        fields = ['template', 'extra_data', 'message', 'attachment']


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
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Mission
        fields = [
            'id', 'employee', 'employee_name',
            'title', 'description', 'destination',
            'start_date', 'end_date',
            'status', 'status_display', 'budget',
            'approved_by', 'approved_by_name', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'approved_by', 'created_at', 'updated_at']

    def get_employee_name(self, obj):
        return obj.employee.full_name

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return None


class MissionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a mission.
    'employee' is optional: if omitted, the view auto-sets it from
    the authenticated user's employee profile.
    """
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Mission._meta.get_field('employee').related_model.objects.all(),
        required=False,
    )

    class Meta:
        model = Mission
        fields = ['employee', 'title', 'description', 'destination',
                  'start_date', 'end_date', 'budget', 'notes']


# ─────────────────── Signature & Stamp ───────────────────

class SignatureStampSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignatureStamp
        fields = ['id', 'kind', 'label', 'image', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
