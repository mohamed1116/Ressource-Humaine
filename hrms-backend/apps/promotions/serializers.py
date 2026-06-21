"""
Promotion Serializers — Faculté Polydisciplinaire de Taroudant
Handles all API serialization for the promotion management system.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.employees.models import Employee
from .models import (
    PromotionRule,
    EmployeePromotionProfile,
    PromotionTableInstance,
    PromotionHistory,
)

User = get_user_model()


# ═══════════════════════════════════════════════════════════════
# 1. PROMOTION RULE SERIALIZERS
# ═══════════════════════════════════════════════════════════════

class PromotionRuleSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for PromotionRule (ADMIN_HR only)."""
    
    employee_type_display = serializers.CharField(
        source='get_employee_type_display', read_only=True
    )
    promotion_type_display = serializers.CharField(
        source='get_promotion_type_display', read_only=True
    )
    
    class Meta:
        model = PromotionRule
        fields = [
            'id', 'created_at', 'updated_at',
            'employee_type', 'employee_type_display',
            'cadre', 'current_grade_code', 'current_echelon',
            'promotion_type', 'promotion_type_display',
            'min_years_in_echelon', 'min_evaluation_score',
            'requires_exam', 'requires_habilitation', 'no_active_sanctions',
            'next_echelon', 'next_grade_code', 'next_cadre', 'next_indice',
            'notes',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ═══════════════════════════════════════════════════════════════
# 2. EMPLOYEE PROMOTION PROFILE SERIALIZERS
# ═══════════════════════════════════════════════════════════════

class EmployeePromotionProfileSerializer(serializers.ModelSerializer):
    """
    Read serializer with computed eligibility fields.
    Used for GET requests and list views.
    """
    
    # Employee info (nested for display)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_type = serializers.CharField(source='employee.employee_type', read_only=True)
    department = serializers.CharField(source='employee.department.name', read_only=True)
    ppr = serializers.CharField(source='employee.numero_somme', read_only=True)
    
    # Computed eligibility fields
    seniority_years = serializers.SerializerMethodField()
    next_echelon_date = serializers.SerializerMethodField()
    echelon_eligible = serializers.SerializerMethodField()
    echelon_reason = serializers.SerializerMethodField()
    grade_eligible = serializers.SerializerMethodField()
    grade_reason = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeePromotionProfile
        fields = [
            'id', 'created_at', 'updated_at',
            # Employee info
            'employee', 'employee_id', 'employee_name', 'employee_type',
            'department', 'ppr',
            # Current position
            'cadre', 'current_grade_code', 'current_grade_label',
            'current_echelon', 'current_indice', 'institution',
            # Dates
            'last_echelon_promotion_date', 'last_grade_promotion_date',
            'titularisation_date',
            # Conditions
            'evaluation_score', 'requires_exam', 'exam_passed',
            'habilitation_obtained', 'sanctions_count', 'tableau_count',
            # Override
            'eligibility_override', 'override_reason',
            # Computed
            'seniority_years', 'next_echelon_date',
            'echelon_eligible', 'echelon_reason',
            'grade_eligible', 'grade_reason',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at',
            'employee_id', 'employee_name', 'employee_type', 'department', 'ppr',
            'seniority_years', 'next_echelon_date',
            'echelon_eligible', 'echelon_reason',
            'grade_eligible', 'grade_reason',
        ]
    
    def get_seniority_years(self, obj):
        """Years in current echelon."""
        return round(obj.seniority_in_echelon_years, 2)
    
    def get_next_echelon_date(self, obj):
        """Next eligibility date for echelon promotion."""
        date = obj.next_echelon_eligibility_date
        return date.isoformat() if date else None
    
    def get_echelon_eligible(self, obj):
        """Is employee eligible for echelon promotion?"""
        eligible, _ = obj.check_echelon_eligibility()
        return eligible
    
    def get_echelon_reason(self, obj):
        """Reason for echelon eligibility status."""
        _, reason = obj.check_echelon_eligibility()
        return reason
    
    def get_grade_eligible(self, obj):
        """Is employee eligible for grade promotion?"""
        eligible, _ = obj.check_grade_eligibility()
        return eligible
    
    def get_grade_reason(self, obj):
        """Reason for grade eligibility status."""
        _, reason = obj.check_grade_eligibility()
        return reason


class EmployeePromotionProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Write serializer for PATCH operations.
    Only allows updating specific fields, not employee link.
    """
    
    class Meta:
        model = EmployeePromotionProfile
        fields = [
            'cadre', 'current_grade_code', 'current_grade_label',
            'current_echelon', 'current_indice', 'institution',
            'last_echelon_promotion_date', 'last_grade_promotion_date',
            'titularisation_date',
            'evaluation_score', 'requires_exam', 'exam_passed',
            'habilitation_obtained', 'sanctions_count', 'tableau_count',
            'eligibility_override', 'override_reason',
        ]
    
    def validate(self, attrs):
        """Validate override reason is provided when override is set."""
        if 'eligibility_override' in attrs and attrs['eligibility_override'] is not None:
            if not attrs.get('override_reason'):
                raise serializers.ValidationError({
                    'override_reason': 'Une raison est requise pour un override manuel.'
                })
        return attrs


class EmployeePromotionProfileCreateSerializer(serializers.ModelSerializer):
    """
    Create serializer for POST operations.
    Allows creating a profile for an employee.
    """
    
    class Meta:
        model = EmployeePromotionProfile
        fields = [
            'employee',
            'cadre', 'current_grade_code', 'current_grade_label',
            'current_echelon', 'current_indice', 'institution',
            'last_echelon_promotion_date', 'last_grade_promotion_date',
            'titularisation_date',
            'evaluation_score', 'requires_exam', 'exam_passed',
            'habilitation_obtained', 'sanctions_count', 'tableau_count',
        ]
    
    def validate_employee(self, value):
        """Ensure employee doesn't already have a profile."""
        if EmployeePromotionProfile.objects.filter(employee=value).exists():
            raise serializers.ValidationError(
                'Cet employé a déjà un profil de promotion.'
            )
        return value


# ═══════════════════════════════════════════════════════════════
# 3. PROMOTION TABLE INSTANCE SERIALIZERS
# ═══════════════════════════════════════════════════════════════

class PromotionTableInstanceSerializer(serializers.ModelSerializer):
    """
    Read serializer for PromotionTableInstance.
    Includes computed fields and creator info.
    """
    
    table_type_display = serializers.CharField(
        source='get_table_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    created_by_name = serializers.SerializerMethodField()
    validated_by_name = serializers.SerializerMethodField()
    rows_count = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PromotionTableInstance
        fields = [
            'id', 'created_at', 'updated_at',
            'table_type', 'table_type_display',
            'year', 'cadre_filter', 'title_ar',
            'status', 'status_display',
            'employees_data', 'rows_count',
            'created_by', 'created_by_name',
            'validated_by', 'validated_by_name', 'validated_at',
            'pdf_file', 'pdf_url',
            'notes',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at',
            'table_type_display', 'status_display',
            'created_by_name', 'validated_by_name', 'rows_count', 'pdf_url',
        ]
    
    def get_created_by_name(self, obj):
        """Creator's full name."""
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None
    
    def get_validated_by_name(self, obj):
        """Validator's full name."""
        if obj.validated_by:
            return f"{obj.validated_by.first_name} {obj.validated_by.last_name}"
        return None
    
    def get_rows_count(self, obj):
        """Number of employees in the table."""
        return len(obj.employees_data) if obj.employees_data else 0
    
    def get_pdf_url(self, obj):
        """URL to download PDF if it exists."""
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
        return None


class PromotionTableInstanceCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for creating a new promotion table.
    Auto-sets created_by from request.user.
    """
    
    class Meta:
        model = PromotionTableInstance
        fields = [
            'table_type', 'year', 'cadre_filter', 'title_ar',
            'employees_data', 'notes',
        ]
    
    def validate_year(self, value):
        """Ensure year is reasonable."""
        from django.utils import timezone
        current_year = timezone.now().year
        if value < 2000 or value > current_year + 5:
            raise serializers.ValidationError(
                f'Année invalide. Doit être entre 2000 et {current_year + 5}.'
            )
        return value
    
    def validate_employees_data(self, value):
        """Ensure employees_data is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError(
                'employees_data doit être une liste.'
            )
        return value
    
    def create(self, validated_data):
        """Auto-set created_by from request context."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class PromotionTableInstanceUpdateSerializer(serializers.ModelSerializer):
    """
    Write serializer for updating a promotion table.
    Only allows updating certain fields when status is DRAFT.
    """
    
    class Meta:
        model = PromotionTableInstance
        fields = [
            'cadre_filter', 'title_ar', 'employees_data', 'notes',
        ]
    
    def validate(self, attrs):
        """Only allow updates if status is DRAFT."""
        instance = self.instance
        if instance and instance.status != 'DRAFT':
            raise serializers.ValidationError(
                'Seuls les tableaux en brouillon peuvent être modifiés.'
            )
        return attrs


# ═══════════════════════════════════════════════════════════════
# 4. PROMOTION HISTORY SERIALIZERS
# ═══════════════════════════════════════════════════════════════

class PromotionHistorySerializer(serializers.ModelSerializer):
    """
    Read-only serializer for PromotionHistory.
    Immutable audit trail.
    """
    
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    table_instance_id = serializers.UUIDField(source='table_instance.id', read_only=True)
    table_instance_title = serializers.SerializerMethodField()
    signed_by_name = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PromotionHistory
        fields = [
            'id', 'created_at',
            'employee', 'employee_id', 'employee_name',
            'table_instance', 'table_instance_id', 'table_instance_title',
            'promotion_type',
            'old_cadre', 'new_cadre',
            'old_grade_code', 'new_grade_code',
            'old_echelon', 'new_echelon',
            'old_indice', 'new_indice',
            'seniority_date', 'effective_date',
            'decision_number',
            'signed_by', 'signed_by_name',
            'pdf_file', 'pdf_url',
            'notes',
        ]
        read_only_fields = '__all__'  # Immutable
    
    def get_table_instance_title(self, obj):
        """Table instance display name."""
        if obj.table_instance:
            return str(obj.table_instance)
        return None
    
    def get_signed_by_name(self, obj):
        """Signer's full name."""
        if obj.signed_by:
            return f"{obj.signed_by.first_name} {obj.signed_by.last_name}"
        return None
    
    def get_pdf_url(self, obj):
        """URL to download decision PDF if it exists."""
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
        return None


# ─────────────────────────────────────────────────────────────
# 2. COMMITTEE & DOCUMENTS SERIALIZERS (APPENDED)
# ─────────────────────────────────────────────────────────────
from .models import CommitteeMember, PromotionDocument

class CommitteeMemberSerializer(serializers.ModelSerializer):
    """Serializer for the Scientific Committee Members."""
    class Meta:
        model = CommitteeMember
        fields = ['id', 'full_name', 'role', 'order']

class PromotionDocumentSerializer(serializers.ModelSerializer):
    """Serializer for generated PDF documents."""
    doc_type_display = serializers.CharField(source='get_doc_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    generated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PromotionDocument
        fields = [
            'id', 'doc_type', 'doc_type_display', 
            'file', 'file_url', 'generated_by_name', 'created_at'
        ]

    def get_file_url(self, obj):
        """Return absolute URL for the generated PDF."""
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_generated_by_name(self, obj):
        """Return the name of the user who generated the doc."""
        if obj.generated_by:
            return f"{obj.generated_by.first_name} {obj.generated_by.last_name}".strip() or obj.generated_by.email
        return None
