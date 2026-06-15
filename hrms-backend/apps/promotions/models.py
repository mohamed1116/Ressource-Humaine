"""
Promotion Module — Faculté Polydisciplinaire de Taroudant
Ref: Décret n° 2-96-670 relatif au statut particulier des enseignants-chercheurs
     Décret n° 2-11-681 portant statut particulier du personnel administratif
"""
import uuid
from django.db import models
from django.utils import timezone
from apps.core.models import TimeStampedModel


# ─────────────────────────────────────────────────────────────
# 1. PROMOTION RULES  (configurable, no hardcoding)
# ─────────────────────────────────────────────────────────────

class PromotionRule(TimeStampedModel):
    """
    Dynamic rules per cadre/grade/echelon.
    ADMIN_HR can edit these from the admin panel.
    Ref: Art. 14-17 Décret 2-96-670 (professors)
         Art. 22-25 Décret 2-11-681 (staff)
    """
    class EmployeeType(models.TextChoices):
        PROFESSOR = 'PROFESSOR', 'Professeur'
        STAFF     = 'STAFF',     'Personnel administratif'

    class PromotionType(models.TextChoices):
        ECHELON = 'ECHELON', 'Promotion en Rتبة (Echelon)'
        GRADE   = 'GRADE',   'Nomination en Cadre (Grade)'

    employee_type       = models.CharField(max_length=10, choices=EmployeeType.choices)
    cadre               = models.CharField(max_length=100, help_text="Ex: Professeur Habilite, Technicien")
    current_grade_code  = models.CharField(max_length=10, help_text="Ex: A, B, C, D")
    current_echelon     = models.PositiveSmallIntegerField()
    promotion_type      = models.CharField(max_length=10, choices=PromotionType.choices)

    # Conditions
    min_years_in_echelon        = models.PositiveSmallIntegerField(default=2)
    min_evaluation_score        = models.DecimalField(max_digits=4, decimal_places=2, default=5.0)
    requires_exam               = models.BooleanField(default=False)
    requires_habilitation       = models.BooleanField(default=False)
    no_active_sanctions         = models.BooleanField(default=True)

    # Result of promotion
    next_echelon        = models.PositiveSmallIntegerField(null=True, blank=True)
    next_grade_code     = models.CharField(max_length=10, blank=True)
    next_cadre          = models.CharField(max_length=100, blank=True)
    next_indice         = models.PositiveIntegerField(null=True, blank=True,
                            help_text="Indice brut de traitement apres promotion")

    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'promotion_rules'
        unique_together = ['employee_type', 'cadre', 'current_grade_code',
                           'current_echelon', 'promotion_type']
        ordering = ['employee_type', 'cadre', 'current_echelon']

    def __str__(self):
        return (f"{self.cadre} | {self.current_grade_code} Ech.{self.current_echelon}"
                f" -> {self.promotion_type}")


# ─────────────────────────────────────────────────────────────
# 2. EMPLOYEE PROMOTION PROFILE  (extends Employee, no modification)
# ─────────────────────────────────────────────────────────────

class EmployeePromotionProfile(TimeStampedModel):
    """
    All promotion-specific fields for an employee.
    Linked via OneToOne to employees.Employee — never modifies that model.
    """
    employee = models.OneToOneField(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='promotion_profile',
    )

    # Current administrative position
    cadre               = models.CharField(max_length=100, blank=True,
                            help_text="Ex: Professeur de l'Enseignement Superieur")
    current_grade_code  = models.CharField(max_length=10, blank=True,
                            help_text="Code de la classe: A, B, C, D")
    current_grade_label = models.CharField(max_length=200, blank=True,
                            help_text="Ex: Professeur Habilite Classe A")
    current_echelon     = models.PositiveSmallIntegerField(default=1,
                            help_text="Rتبة actuelle (1-6)")
    current_indice      = models.PositiveIntegerField(default=0,
                            help_text="Indice brut de traitement actuel")
    institution         = models.CharField(
                            max_length=300,
                            default="الكلية متعددة التخصصات تارودانت",
                            help_text="Nom de l'institution en arabe")

    # Promotion tracking
    last_echelon_promotion_date = models.DateField(null=True, blank=True)
    last_grade_promotion_date   = models.DateField(null=True, blank=True)
    titularisation_date         = models.DateField(null=True, blank=True)

    # Conditions
    evaluation_score            = models.DecimalField(max_digits=4, decimal_places=2,
                                    null=True, blank=True)
    requires_exam               = models.BooleanField(default=False)
    exam_passed                 = models.BooleanField(default=False)
    habilitation_obtained       = models.BooleanField(default=False)
    sanctions_count             = models.PositiveSmallIntegerField(default=0)
    tableau_count               = models.PositiveSmallIntegerField(default=0,
                                    help_text="Nb inscriptions tableau sans benefice")

    # Manual override by ADMIN_HR
    eligibility_override        = models.BooleanField(null=True, blank=True)
    override_reason             = models.TextField(blank=True)

    class Meta:
        db_table = 'employee_promotion_profiles'

    def __str__(self):
        return f"{self.employee.full_name} | {self.cadre} {self.current_grade_code} Ech.{self.current_echelon}"

    @property
    def seniority_in_echelon_years(self):
        if not self.last_echelon_promotion_date:
            return 0
        delta = timezone.now().date() - self.last_echelon_promotion_date
        return delta.days / 365.25

    @property
    def next_echelon_eligibility_date(self):
        if not self.last_echelon_promotion_date:
            return None
        # Default 2 years; overridden by PromotionRule if exists
        try:
            rule = PromotionRule.objects.get(
                employee_type=self.employee.employee_type,
                cadre=self.cadre,
                current_grade_code=self.current_grade_code,
                current_echelon=self.current_echelon,
                promotion_type='ECHELON',
            )
            years = rule.min_years_in_echelon
        except PromotionRule.DoesNotExist:
            years = 2
        from dateutil.relativedelta import relativedelta
        return self.last_echelon_promotion_date + relativedelta(years=years)

    def check_echelon_eligibility(self):
        """Returns (is_eligible: bool, reason: str)"""
        if self.eligibility_override is not None:
            return self.eligibility_override, "Override manuel"
        if self.sanctions_count > 0:
            return False, f"Sanctions actives: {self.sanctions_count}"
        date = self.next_echelon_eligibility_date
        if date is None:
            return False, "Date de derniere promotion manquante"
        if timezone.now().date() < date:
            days = (date - timezone.now().date()).days
            return False, f"Eligible dans {days} jours (le {date})"
        try:
            rule = PromotionRule.objects.get(
                employee_type=self.employee.employee_type,
                cadre=self.cadre,
                current_grade_code=self.current_grade_code,
                current_echelon=self.current_echelon,
                promotion_type='ECHELON',
            )
            if self.evaluation_score is not None and self.evaluation_score < rule.min_evaluation_score:
                return False, f"Score evaluation insuffisant ({self.evaluation_score}/{rule.min_evaluation_score})"
        except PromotionRule.DoesNotExist:
            pass
        return True, "Eligible"

    def check_grade_eligibility(self):
        """Returns (is_eligible: bool, reason: str) for grade/title promotion"""
        if self.eligibility_override is not None:
            return self.eligibility_override, "Override manuel"
        if self.employee.employee_type != 'PROFESSOR':
            return False, "Promotion de grade reservee aux professeurs"
        if self.sanctions_count > 0:
            return False, f"Sanctions actives: {self.sanctions_count}"
        try:
            rule = PromotionRule.objects.get(
                employee_type='PROFESSOR',
                cadre=self.cadre,
                current_grade_code=self.current_grade_code,
                current_echelon=self.current_echelon,
                promotion_type='GRADE',
            )
        except PromotionRule.DoesNotExist:
            return False, "Aucune regle de promotion de grade definie"
        if rule.requires_habilitation and not self.habilitation_obtained:
            return False, "Habilitation universitaire requise"
        if rule.requires_exam and not self.exam_passed:
            return False, "Examen professionnel requis"
        if self.evaluation_score is not None and self.evaluation_score < rule.min_evaluation_score:
            return False, f"Score evaluation insuffisant ({self.evaluation_score}/{rule.min_evaluation_score})"
        if self.current_echelon < 3:
            return False, "Echelon minimum 3 requis pour promotion de grade"
        return True, "Eligible"


# ─────────────────────────────────────────────────────────────
# 3. PROMOTION TABLE INSTANCE  (the generated official table)
# ─────────────────────────────────────────────────────────────

class PromotionTableInstance(TimeStampedModel):
    """
    Stores a generated promotion table (before and after PDF export).
    employees_data is a JSON array matching the exact official column structure.
    """
    class TableType(models.TextChoices):
        ECHELON        = 'ECHELON',     'جدول اقتراح الترقية في الرتبة'
        GRADE_TITLE    = 'GRADE_TITLE', 'جدول اقتراح التسمية في إطار أستاذ محاضر مؤهل'
        TITULARISATION = 'TITULARISATION', 'جدول اقتراح الترسيم'
        GRADE_ADMIN    = 'GRADE_ADMIN', 'جدول الترقية في الدرجة (الأطر الإدارية والتقنية)'

    class Status(models.TextChoices):
        DRAFT     = 'DRAFT',     'Brouillon'
        VALIDATED = 'VALIDATED', 'Valide'
        ARCHIVED  = 'ARCHIVED',  'Archive'

    table_type          = models.CharField(max_length=20, choices=TableType.choices)
    year                = models.PositiveIntegerField()
    cadre_filter        = models.CharField(max_length=200, blank=True,
                            help_text="Cadre filtre pour ce tableau (ex: PESA, MCH)")
    title_ar            = models.CharField(max_length=300, blank=True,
                            help_text="Titre arabe du tableau")
    status              = models.CharField(max_length=15, choices=Status.choices,
                            default=Status.DRAFT)
    employees_data      = models.JSONField(default=list,
                            help_text="Array of row objects matching official columns")
    created_by          = models.ForeignKey(
                            'accounts.User', on_delete=models.SET_NULL,
                            null=True, related_name='created_promotion_tables')
    validated_by        = models.ForeignKey(
                            'accounts.User', on_delete=models.SET_NULL,
                            null=True, blank=True, related_name='validated_promotion_tables')
    validated_at        = models.DateTimeField(null=True, blank=True)
    pdf_file            = models.FileField(upload_to='promotions/pdf/%Y/', null=True, blank=True)
    notes               = models.TextField(blank=True)

    class Meta:
        db_table = 'promotion_table_instances'
        ordering = ['-year', '-created_at']

    def __str__(self):
        return f"{self.get_table_type_display()} {self.year} [{self.status}]"


# ─────────────────────────────────────────────────────────────
# 4. PROMOTION HISTORY  (immutable audit trail)
# ─────────────────────────────────────────────────────────────

class PromotionHistory(TimeStampedModel):
    """Immutable record created when a promotion is executed."""
    employee            = models.ForeignKey(
                            'employees.Employee', on_delete=models.CASCADE,
                            related_name='promotion_history')
    table_instance      = models.ForeignKey(
                            PromotionTableInstance, on_delete=models.SET_NULL,
                            null=True, blank=True, related_name='history_records')
    promotion_type      = models.CharField(max_length=20)
    old_cadre           = models.CharField(max_length=100, blank=True)
    new_cadre           = models.CharField(max_length=100, blank=True)
    old_grade_code      = models.CharField(max_length=10, blank=True)
    new_grade_code      = models.CharField(max_length=10, blank=True)
    old_echelon         = models.PositiveSmallIntegerField()
    new_echelon         = models.PositiveSmallIntegerField()
    old_indice          = models.PositiveIntegerField()
    new_indice          = models.PositiveIntegerField()
    seniority_date      = models.DateField(null=True, blank=True,
                            help_text="Date d'anciennete dans l'ancien echelon")
    effective_date      = models.DateField()
    decision_number     = models.CharField(max_length=100, blank=True)
    signed_by           = models.ForeignKey(
                            'accounts.User', on_delete=models.SET_NULL,
                            null=True, related_name='signed_promotions')
    pdf_file            = models.FileField(upload_to='promotions/decisions/%Y/',
                            null=True, blank=True)
    notes               = models.TextField(blank=True)

    class Meta:
        db_table = 'promotion_history'
        ordering = ['-effective_date']

    def __str__(self):
        return (f"{self.employee.full_name}: "
                f"{self.old_grade_code}Ech{self.old_echelon}"
                f" -> {self.new_grade_code}Ech{self.new_echelon} ({self.effective_date})")





# ─────────────────────────────────────────────────────────────
# 2. COMMITTEE & DOCUMENTS (APPENDED)
# ─────────────────────────────────────────────────────────────
from django.conf import settings

class CommitteeMember(TimeStampedModel):
    """Members of the scientific committee for FPT."""
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=100)  # Ex: "رئيس (Doyen)", "مقرر", "عضو"
    order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.full_name} - {self.role}"


class PromotionDocument(TimeStampedModel):
    """Stores generated PDF documents for a specific promotion table."""
    class DocumentType(models.TextChoices):
        TABLEAU_ECHELON = 'TABLEAU_ECHELON', 'Tableau Avancement (Echelon)'
        TABLEAU_GRADE = 'TABLEAU_GRADE', 'Tableau Avancement (Grade)'
        PV_COMITE = 'PV_COMITE', 'PV Comité Scientifique'
        PAGE_GARDE = 'PAGE_GARDE', 'Page de Garde (ورقة الإرسال)'
        FICHE_NOTATION = 'FICHE_NOTATION', 'Fiche de Notation'

    table_instance = models.ForeignKey(
        PromotionTableInstance, 
        on_delete=models.CASCADE,
        related_name='generated_documents'
    )
    doc_type = models.CharField(max_length=20, choices=DocumentType.choices)
    file = models.FileField(upload_to='promotions/documents/%Y/')
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True
    )

    def __str__(self):
        return f"{self.get_doc_type_display()} - {self.table_instance}"
