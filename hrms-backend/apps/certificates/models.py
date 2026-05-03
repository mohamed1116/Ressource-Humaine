"""
Dynamic Document & Certificate System
--------------------------------------
This module replaces the old hardcoded certificate types with a fully dynamic
template system. Admins can create, edit, and manage document templates using
a WYSIWYG editor. Each template stores its HTML content with placeholder
variables (e.g. {{employee_name}}, {{cin}}) that get replaced at generation time.

Architecture:
  DocumentTemplate  -- the reusable template (HTML + variables + metadata)
  DocumentRequest   -- a user's request for a specific document
  GeneratedDocument -- the final rendered PDF, linked to a request
  Mission           -- academic missions/travel, can trigger document generation
"""
import re
from django.db import models
from apps.core.models import TimeStampedModel


class DocumentTemplate(TimeStampedModel):
    """
    A reusable document template created and managed by HR admins.
    The 'content' field stores rich HTML with {{placeholder}} variables.
    The 'variables' field is a JSON list describing each placeholder so the
    frontend can display an appropriate form to the user.

    Why HTML instead of Markdown:
      - University documents need precise layout control (headers, tables, margins)
      - HTML renders directly to PDF via WeasyPrint with full CSS support
      - The WYSIWYG editor (TinyMCE/Quill) produces HTML natively
    """

    class Language(models.TextChoices):
        FR = 'FR', 'Francais'
        AR = 'AR', 'Arabe'

    class Category(models.TextChoices):
        ATTESTATION = 'ATTESTATION', 'Attestation'
        ORDRE_MISSION = 'ORDRE_MISSION', 'Ordre de mission'
        AUTORISATION = 'AUTORISATION', 'Autorisation'
        AUTRE = 'AUTRE', 'Autre'

    class Audience(models.TextChoices):
        ALL = 'ALL', 'Tous'
        EMPLOYEE = 'EMPLOYEE', 'Personnel (enseignants et administratifs)'
        STUDENT = 'STUDENT', 'Etudiants'

    # Basic metadata
    name = models.CharField(
        max_length=200,
        help_text='Nom du modele, ex: "Attestation de travail"',
    )
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.ATTESTATION,
    )
    target_audience = models.CharField(
        max_length=10, choices=Audience.choices, default=Audience.ALL,
        help_text='Qui peut demander ce document: tous, personnel, ou etudiants.',
    )
    language = models.CharField(
        max_length=2, choices=Language.choices, default=Language.FR,
    )
    description = models.TextField(
        blank=True,
        help_text='Description interne visible uniquement par les admins.',
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Les modeles inactifs ne sont plus proposés aux utilisateurs.',
    )

    # Template content -- rich HTML with {{variable}} placeholders
    content = models.TextField(
        help_text='Contenu HTML du document avec des variables {{nom_variable}}.',
    )

    # JSON list of available placeholder variables for this template
    # Example: [{"key": "employee_name", "label": "Nom de l'employé", "type": "auto"},
    #           {"key": "mission_destination", "label": "Destination", "type": "manual"}]
    # type "auto" = filled from employee/user data; "manual" = user must type it
    variables = models.JSONField(
        default=list,
        help_text='Liste JSON des variables disponibles dans ce modele.',
    )

    # Optional branding
    header_html = models.TextField(
        blank=True,
        help_text='En-tete HTML (logo universite, nom faculte, etc.).',
    )
    footer_html = models.TextField(
        blank=True,
        help_text='Pied de page HTML (adresse, telephone, etc.).',
    )
    logo = models.ImageField(
        upload_to='templates/logos/', null=True, blank=True,
        help_text='Logo de l\'institution pour l\'en-tete.',
    )

    # CSS for precise control over the PDF layout
    custom_css = models.TextField(
        blank=True,
        help_text='CSS personnalise pour ce modele (marges, polices, etc.).',
    )

    class Meta:
        db_table = 'document_templates'
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.name} ({self.get_language_display()})'

    def get_placeholder_keys(self):
        """Extract all {{variable}} keys from the content."""
        return re.findall(r'\{\{(\w+)\}\}', self.content)

    def render(self, context: dict) -> str:
        """
        Replace all {{placeholder}} variables in the template with values
        from the provided context dict. Returns the fully rendered HTML.
        Unreplaced variables are left blank instead of showing {{key}}.
        """
        html = self.content
        for key, value in context.items():
            html = html.replace('{{' + key + '}}', str(value))
        # Remove any remaining unreplaced {{variables}} to keep PDF clean
        html = re.sub(r'\{\{\w+\}\}', '', html)

        # Embed logo as base64 if present
        logo_tag = ''
        if self.logo:
            try:
                import base64 as _b64
                ext = self.logo.name.rsplit('.', 1)[-1].lower()
                mime = {'jpg': 'jpeg', 'jpeg': 'jpeg', 'png': 'png', 'gif': 'gif'}.get(ext, 'png')
                self.logo.open('rb')
                b64 = _b64.b64encode(self.logo.read()).decode()
                self.logo.close()
                logo_tag = f'<img src="data:image/{mime};base64,{b64}" style="max-height:80px; max-width:200px;">'
            except Exception:
                pass

        header = self.header_html.replace('{{logo}}', logo_tag) if self.header_html else logo_tag

        # Wrap with header/footer and CSS
        full_html = f"""<!DOCTYPE html>
<html lang="{self.language.lower()}" dir="{'rtl' if self.language == 'AR' else 'ltr'}">
<head>
<meta charset="UTF-8">
<style>
@page {{ size: A4; margin: 2cm; }}
body {{ font-family: 'Arial', 'Amiri', sans-serif; font-size: 12pt; line-height: 1.6; color: #1a1a1a; }}
.header {{ text-align: center; margin-bottom: 30px; }}
.footer {{ text-align: center; margin-top: 40px; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }}
.content {{ min-height: 500px; }}
.signature-block {{ margin-top: 60px; text-align: right; }}
{self.custom_css}
</style>
</head>
<body>
<div class="header">{header}</div>
<div class="content">{html}</div>
<div class="footer">{self.footer_html}</div>
</body>
</html>"""
        return full_html


class DocumentRequest(TimeStampedModel):
    """
    A user's request for a specific document. Unlike the old CertificateRequest
    that used hardcoded types, this links to a dynamic DocumentTemplate.

    Workflow: PENDING -> APPROVED -> GENERATED (PDF created)
              PENDING -> REJECTED
    """

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'En attente'
        APPROVED = 'APPROVED', 'Approuvee'
        REJECTED = 'REJECTED', 'Rejetee'
        GENERATED = 'GENERATED', 'Generee'

    requested_by = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE,
        related_name='document_requests',
    )
    template = models.ForeignKey(
        DocumentTemplate, on_delete=models.PROTECT,
        related_name='requests',
        help_text='Le modele de document choisi.',
    )
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.PENDING,
    )

    # User-provided data for "manual" variables (JSON dict)
    # Example: {"mission_destination": "Rabat", "mission_dates": "10-15 Mai 2026"}
    extra_data = models.JSONField(
        default=dict, blank=True,
        help_text='Données manuelles saisies par le demandeur.',
    )
    message = models.TextField(blank=True)

    # HR review
    reviewed_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_documents',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = 'document_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.template.name} - {self.requested_by.get_full_name()}'

    def build_context(self):
        """
        Build the full variable context for rendering.
        Merges auto-filled employee data with manually entered extra_data.
        """
        user = self.requested_by
        context = {
            'employee_name': user.get_full_name(),
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'role': user.get_role_display() if hasattr(user, 'get_role_display') else user.role,
            'date': self.created_at.strftime('%d/%m/%Y'),
            'date_today': __import__('datetime').date.today().strftime('%d/%m/%Y'),
            'year': str(self.created_at.year),
        }

        # Add employee-specific data if the user has an employee profile
        if hasattr(user, 'employee'):
            emp = user.employee
            context.update({
                'employee_id': emp.employee_id,
                'numero_somme': emp.numero_somme or '',
                'cin': emp.cin,
                'department': emp.department.name if emp.department else '',
                'position': emp.position.title if emp.position else '',
                'hire_date': emp.hire_date.strftime('%d/%m/%Y') if emp.hire_date else '',
                'contract_type': emp.get_contract_type_display(),
                'employee_type': emp.get_employee_type_display(),
            })

        # Merge with manually entered data (overrides auto data if same key)
        if self.extra_data:
            context.update(self.extra_data)

        return context


class GeneratedDocument(TimeStampedModel):
    """
    Stores the final rendered PDF for a document request.
    Kept separate so we can regenerate without losing history.
    """
    request = models.ForeignKey(
        DocumentRequest, on_delete=models.CASCADE,
        related_name='generated_documents',
    )
    pdf_file = models.FileField(upload_to='generated_docs/%Y/%m/')
    rendered_html = models.TextField(
        help_text='Snapshot of the rendered HTML used to generate this PDF.',
    )
    generated_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, related_name='generated_docs',
    )

    class Meta:
        db_table = 'generated_documents'
        ordering = ['-created_at']

    def __str__(self):
        return f'PDF for {self.request}'


class Mission(TimeStampedModel):
    """
    Academic missions (conferences, collaborations, field work, etc.).
    A mission can trigger document generation (ordre de mission,
    autorisation de deplacement) via the template system.

    Why a separate model instead of embedding in DocumentRequest:
      - Missions have their own lifecycle (dates, destination, budget)
      - Multiple documents may be generated for one mission
      - Missions are tracked independently for reporting
    """

    class Status(models.TextChoices):
        PLANNED = 'PLANNED', 'Planifiee'
        APPROVED = 'APPROVED', 'Approuvee'
        IN_PROGRESS = 'IN_PROGRESS', 'En cours'
        COMPLETED = 'COMPLETED', 'Terminee'
        CANCELLED = 'CANCELLED', 'Annulee'

    employee = models.ForeignKey(
        'employees.Employee', on_delete=models.CASCADE,
        related_name='missions',
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    destination = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.PLANNED,
    )
    budget = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
    )
    approved_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='approved_missions',
    )
    notes = models.TextField(blank=True)

    # Link to generated documents for this mission
    documents = models.ManyToManyField(
        GeneratedDocument, blank=True, related_name='missions',
    )

    class Meta:
        db_table = 'missions'
        ordering = ['-start_date']

    def __str__(self):
        return f'{self.title} - {self.employee.full_name} ({self.destination})'
