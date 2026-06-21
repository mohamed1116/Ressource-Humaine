"""
Promotion Admin — Faculté Polydisciplinaire de Taroudant
Django admin interface for promotion management.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    PromotionRule,
    EmployeePromotionProfile,
    PromotionTableInstance,
    PromotionHistory,
)


# ═══════════════════════════════════════════════════════════════
# 1. PROMOTION RULE ADMIN
# ═══════════════════════════════════════════════════════════════

@admin.register(PromotionRule)
class PromotionRuleAdmin(admin.ModelAdmin):
    """Admin interface for PromotionRule."""
    
    list_display = [
        'id', 'employee_type', 'cadre', 'current_grade_code', 
        'current_echelon', 'promotion_type_badge', 'min_years_in_echelon',
        'next_echelon', 'next_grade_code', 'created_at'
    ]
    list_filter = ['employee_type', 'promotion_type', 'requires_exam', 'requires_habilitation']
    search_fields = ['cadre', 'notes']
    ordering = ['employee_type', 'cadre', 'current_echelon']
    
    fieldsets = (
        ('Identification', {
            'fields': ('employee_type', 'cadre', 'current_grade_code', 'current_echelon', 'promotion_type')
        }),
        ('Conditions', {
            'fields': ('min_years_in_echelon', 'min_evaluation_score', 'requires_exam', 
                      'requires_habilitation', 'no_active_sanctions')
        }),
        ('Résultat de la promotion', {
            'fields': ('next_echelon', 'next_grade_code', 'next_cadre', 'next_indice')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    def promotion_type_badge(self, obj):
        """Display promotion type with color badge."""
        colors = {
            'ECHELON': '#10b981',  # green
            'GRADE': '#f59e0b',    # orange
        }
        color = colors.get(obj.promotion_type, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color, obj.get_promotion_type_display()
        )
    promotion_type_badge.short_description = 'Type'


# ═══════════════════════════════════════════════════════════════
# 2. EMPLOYEE PROMOTION PROFILE ADMIN
# ═══════════════════════════════════════════════════════════════

@admin.register(EmployeePromotionProfile)
class EmployeePromotionProfileAdmin(admin.ModelAdmin):
    """Admin interface for EmployeePromotionProfile."""
    
    list_display = [
        'employee_link', 'cadre', 'current_grade_code', 'current_echelon',
        'current_indice', 'eligibility_status', 'evaluation_score',
        'sanctions_badge', 'last_echelon_promotion_date'
    ]
    list_filter = [
        'cadre', 'current_grade_code', 'current_echelon',
        'requires_exam', 'exam_passed', 'habilitation_obtained'
    ]
    search_fields = [
        'employee__user__first_name', 'employee__user__last_name',
        'employee__employee_id', 'employee__numero_somme', 'cadre'
    ]
    ordering = ['-last_echelon_promotion_date']
    
    fieldsets = (
        ('Employé', {
            'fields': ('employee',)
        }),
        ('Position actuelle', {
            'fields': ('cadre', 'current_grade_code', 'current_grade_label',
                      'current_echelon', 'current_indice', 'institution')
        }),
        ('Dates de promotion', {
            'fields': ('last_echelon_promotion_date', 'last_grade_promotion_date',
                      'titularisation_date')
        }),
        ('Conditions d\'éligibilité', {
            'fields': ('evaluation_score', 'requires_exam', 'exam_passed',
                      'habilitation_obtained', 'sanctions_count', 'tableau_count')
        }),
        ('Override manuel (ADMIN_HR)', {
            'fields': ('eligibility_override', 'override_reason'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['employee']
    
    def employee_link(self, obj):
        """Link to employee admin page."""
        url = reverse('admin:employees_employee_change', args=[obj.employee.id])
        return format_html('<a href="{}">{}</a>', url, obj.employee.full_name)
    employee_link.short_description = 'Employé'
    
    def eligibility_status(self, obj):
        """Display eligibility status with color."""
        eligible_echelon, reason_echelon = obj.check_echelon_eligibility()
        eligible_grade, reason_grade = obj.check_grade_eligibility()
        
        if eligible_echelon:
            badge = '<span style="background-color: #10b981; color: white; padding: 2px 6px; ' \
                   'border-radius: 3px; font-size: 10px;">✓ Échelon</span>'
        else:
            badge = '<span style="background-color: #ef4444; color: white; padding: 2px 6px; ' \
                   'border-radius: 3px; font-size: 10px;">✗ Échelon</span>'
        
        if eligible_grade:
            badge += ' <span style="background-color: #10b981; color: white; padding: 2px 6px; ' \
                    'border-radius: 3px; font-size: 10px; margin-left: 4px;">✓ Grade</span>'
        
        return mark_safe(badge)
    eligibility_status.short_description = 'Éligibilité'
    
    def sanctions_badge(self, obj):
        """Display sanctions count with color."""
        if obj.sanctions_count == 0:
            return format_html(
                '<span style="color: #10b981; font-weight: 600;">✓ Aucune</span>'
            )
        return format_html(
            '<span style="color: #ef4444; font-weight: 600;">⚠ {}</span>',
            obj.sanctions_count
        )
    sanctions_badge.short_description = 'Sanctions'


# ═══════════════════════════════════════════════════════════════
# 3. PROMOTION TABLE INSTANCE ADMIN
# ═══════════════════════════════════════════════════════════════

@admin.register(PromotionTableInstance)
class PromotionTableInstanceAdmin(admin.ModelAdmin):
    """Admin interface for PromotionTableInstance."""
    
    list_display = [
        'id', 'table_type_badge', 'year', 'cadre_filter',
        'status_badge', 'rows_count', 'created_by_name',
        'validated_by_name', 'created_at'
    ]
    list_filter = ['table_type', 'status', 'year']
    search_fields = ['title_ar', 'cadre_filter', 'notes']
    ordering = ['-year', '-created_at']
    
    fieldsets = (
        ('Informations du tableau', {
            'fields': ('table_type', 'year', 'cadre_filter', 'title_ar', 'status')
        }),
        ('Données', {
            'fields': ('employees_data',),
            'description': 'Données JSON des employés dans le tableau.'
        }),
        ('Validation', {
            'fields': ('created_by', 'validated_by', 'validated_at')
        }),
        ('Fichiers', {
            'fields': ('pdf_file',)
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_by', 'validated_by', 'validated_at']
    
    def table_type_badge(self, obj):
        """Display table type with color badge."""
        colors = {
            'ECHELON': '#3b82f6',      # blue
            'GRADE_TITLE': '#8b5cf6',  # purple
            'TITULARISATION': '#10b981' # green
        }
        color = colors.get(obj.table_type, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color, obj.get_table_type_display()
        )
    table_type_badge.short_description = 'Type'
    
    def status_badge(self, obj):
        """Display status with color badge."""
        colors = {
            'DRAFT': '#6b7280',      # gray
            'VALIDATED': '#10b981',  # green
            'ARCHIVED': '#3b82f6',   # blue
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Statut'
    
    def rows_count(self, obj):
        """Number of employees in the table."""
        count = len(obj.employees_data) if obj.employees_data else 0
        return format_html('<strong>{}</strong> employé(s)', count)
    rows_count.short_description = 'Employés'
    
    def created_by_name(self, obj):
        """Creator's name."""
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return '-'
    created_by_name.short_description = 'Créé par'
    
    def validated_by_name(self, obj):
        """Validator's name."""
        if obj.validated_by:
            return f"{obj.validated_by.first_name} {obj.validated_by.last_name}"
        return '-'
    validated_by_name.short_description = 'Validé par'
    
    actions = ['validate_tables', 'archive_tables']
    
    def validate_tables(self, request, queryset):
        """Bulk action to validate draft tables."""
        draft_tables = queryset.filter(status='DRAFT')
        count = 0
        for table in draft_tables:
            if table.employees_data:
                table.status = 'VALIDATED'
                table.validated_by = request.user
                table.validated_at = timezone.now()
                table.save()
                count += 1
        
        self.message_user(request, f'{count} tableau(x) validé(s).')
    validate_tables.short_description = 'Valider les tableaux sélectionnés'
    
    def archive_tables(self, request, queryset):
        """Bulk action to archive validated tables."""
        validated_tables = queryset.filter(status='VALIDATED')
        count = validated_tables.update(status='ARCHIVED')
        self.message_user(request, f'{count} tableau(x) archivé(s).')
    archive_tables.short_description = 'Archiver les tableaux sélectionnés'


# ═══════════════════════════════════════════════════════════════
# 4. PROMOTION HISTORY ADMIN
# ═══════════════════════════════════════════════════════════════

@admin.register(PromotionHistory)
class PromotionHistoryAdmin(admin.ModelAdmin):
    """
    Admin interface for PromotionHistory.
    Read-only (immutable audit trail).
    """
    
    list_display = [
        'employee_link', 'promotion_type_badge', 'promotion_summary',
        'effective_date', 'decision_number', 'signed_by_name', 'created_at'
    ]
    list_filter = ['promotion_type', 'effective_date']
    search_fields = [
        'employee__user__first_name', 'employee__user__last_name',
        'employee__numero_somme', 'decision_number'
    ]
    ordering = ['-effective_date', '-created_at']
    
    fieldsets = (
        ('Employé', {
            'fields': ('employee', 'table_instance')
        }),
        ('Type de promotion', {
            'fields': ('promotion_type',)
        }),
        ('Changements', {
            'fields': (
                ('old_cadre', 'new_cadre'),
                ('old_grade_code', 'new_grade_code'),
                ('old_echelon', 'new_echelon'),
                ('old_indice', 'new_indice'),
            )
        }),
        ('Dates et décision', {
            'fields': ('seniority_date', 'effective_date', 'decision_number')
        }),
        ('Signature', {
            'fields': ('signed_by', 'pdf_file')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    # Make everything read-only (immutable)
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def employee_link(self, obj):
        """Link to employee admin page."""
        url = reverse('admin:employees_employee_change', args=[obj.employee.id])
        return format_html('<a href="{}">{}</a>', url, obj.employee.full_name)
    employee_link.short_description = 'Employé'
    
    def promotion_type_badge(self, obj):
        """Display promotion type with color badge."""
        colors = {
            'ECHELON': '#10b981',
            'GRADE': '#f59e0b',
            'TITULARISATION': '#3b82f6',
        }
        color = colors.get(obj.promotion_type, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color, obj.promotion_type
        )
    promotion_type_badge.short_description = 'Type'
    
    def promotion_summary(self, obj):
        """Summary of the promotion change."""
        if obj.promotion_type == 'ECHELON':
            return format_html(
                'Éch. {} → <strong>{}</strong> (Indice: {} → {})',
                obj.old_echelon, obj.new_echelon, obj.old_indice, obj.new_indice
            )
        elif obj.promotion_type == 'GRADE':
            return format_html(
                '{} {} → <strong>{} {}</strong>',
                obj.old_grade_code, obj.old_echelon,
                obj.new_grade_code, obj.new_echelon
            )
        return 'Titularisation'
    promotion_summary.short_description = 'Changement'
    
    def signed_by_name(self, obj):
        """Signer's name."""
        if obj.signed_by:
            return f"{obj.signed_by.first_name} {obj.signed_by.last_name}"
        return '-'
    signed_by_name.short_description = 'Signé par'




# ─────────────────────────────────────────────────────────────
# 2. COMMITTEE & DOCUMENTS ADMIN (APPENDED)
# ─────────────────────────────────────────────────────────────
from .models import CommitteeMember, PromotionDocument

@admin.register(CommitteeMember)
class CommitteeMemberAdmin(admin.ModelAdmin):
    """Admin interface for Committee Members."""
    list_display = ('full_name', 'role', 'order')
    list_editable = ('order',)
    search_fields = ('full_name', 'role')
    ordering = ('order',)

@admin.register(PromotionDocument)
class PromotionDocumentAdmin(admin.ModelAdmin):
    """Admin interface for Generated Promotion Documents."""
    list_display = ('id', 'doc_type', 'table_instance', 'generated_by', 'created_at')
    list_filter = ('doc_type', 'created_at')
    search_fields = ('table_instance__title', 'table_instance__cadre_filter')
    readonly_fields = ('created_at', 'updated_at')




