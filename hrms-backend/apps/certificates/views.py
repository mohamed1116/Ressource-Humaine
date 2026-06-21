"""
Views for the Dynamic Document Template System.
Provides API endpoints for:
  - Template management (CRUD, preview) -- HR only
  - Document requests (create, list, review, generate PDF)
  - Mission management (CRUD, document generation)
  - Statistics for dashboard
"""
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminHR
from .models import DocumentTemplate, DocumentRequest, GeneratedDocument, Mission, SignatureStamp
from .serializers import (
    DocumentTemplateListSerializer,
    DocumentTemplateSerializer,
    DocumentRequestSerializer,
    DocumentRequestCreateSerializer,
    DocumentReviewSerializer,
    GeneratedDocumentSerializer,
    MissionSerializer,
    MissionCreateSerializer,
    SignatureStampSerializer,
)
from .pdf_service import generate_pdf, preview_html, preview_template


# ═══════════════════════════════════════════════════════════
# DOCUMENT TEMPLATES (Admin/HR only)
# ═══════════════════════════════════════════════════════════

class TemplateListCreateView(generics.ListCreateAPIView):
    """
    GET  /templates/          -- List all templates (lightweight, no content body)
    POST /templates/          -- Create a new template
    Admin/HR only for creation; authenticated users can list active templates.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DocumentTemplateSerializer
        return DocumentTemplateListSerializer

    def get_queryset(self):
        qs = DocumentTemplate.objects.all()
        user = self.request.user

        if user.is_hr_admin:
            # Admin sees everything (including inactive) for management
            return qs

        # Non-admin: only active templates
        qs = qs.filter(is_active=True)

        # Filter by target_audience based on user role.
        # Each role sees its specific audience + ALL + EMPLOYEE (for broad employee templates).
        role = user.role
        if role == 'STUDENT':
            allowed = ['STUDENT', 'ALL']
        elif role == 'PROFESSOR':
            allowed = ['PROFESSOR', 'EMPLOYEE', 'ALL']
        elif role == 'DEPARTMENT_HEAD':
            allowed = ['DEPARTMENT_HEAD', 'PROFESSOR', 'EMPLOYEE', 'ALL']
        elif role == 'STAFF':
            allowed = ['STAFF', 'EMPLOYEE', 'ALL']
        else:
            # ADMIN_HR and SUPER_ADMIN see everything active
            allowed = ['ALL', 'EMPLOYEE', 'PROFESSOR', 'DEPARTMENT_HEAD', 'STAFF', 'STUDENT']

        qs = qs.filter(target_audience__in=allowed)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminHR()]
        return [IsAuthenticated()]


class TemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /templates/<uuid>/
    Full template details including content. Admin/HR only for write.
    """
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAdminHR()]
        return [IsAuthenticated()]


class TemplatePreviewView(APIView):
    """
    POST /templates/<uuid>/preview/
    Renders the template with sample data and returns the HTML.
    Used by the template editor to show a live preview.
    """
    permission_classes = [IsAdminHR]

    def post(self, request, pk):
        try:
            template = DocumentTemplate.objects.get(pk=pk)
        except DocumentTemplate.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        sample_data = request.data.get('sample_data', None)
        html = preview_template(template, sample_data)
        return Response({'html': html})


# ═══════════════════════════════════════════════════════════
# DOCUMENT REQUESTS
# ═══════════════════════════════════════════════════════════

class DocumentRequestListView(generics.ListAPIView):
    """
    GET /requests/
    Admin/HR sees all requests; others see only their own.
    Supports filtering by status and template.
    """
    serializer_class = DocumentRequestSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'template']
    search_fields = ['requested_by__first_name', 'requested_by__last_name']

    def get_queryset(self):
        qs = DocumentRequest.objects.select_related(
            'requested_by', 'reviewed_by', 'template',
        )
        if self.request.user.is_hr_admin:
            return qs
        return qs.filter(requested_by=self.request.user)


class DocumentRequestCreateView(generics.CreateAPIView):
    """
    POST /requests/create/
    Any authenticated user can submit a document request.
    The template's 'manual' variables should be provided in extra_data.
    """
    serializer_class = DocumentRequestCreateSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


class FreeRequestCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        subject = request.data.get('subject', '').strip()
        message = request.data.get('message', '').strip()
        attachment = request.FILES.get('attachment')

        if not subject or not message:
            return Response({'detail': 'Objet et message sont requis.'}, status=status.HTTP_400_BAD_REQUEST)

        instance = DocumentRequest.objects.create(
            requested_by=request.user,
            template=None,
            extra_data={'subject': subject},
            message=message,
            attachment=attachment,
        )

        try:
            from apps.notifications.services import NotificationService
            from apps.accounts.models import User
            requester_name = request.user.get_full_name()
            for hr in User.objects.filter(role__in=['ADMIN_HR', 'SUPER_ADMIN']):
                try:
                    NotificationService.create_notification(
                        recipient=hr,
                        notification_type='REQUEST_SUBMITTED',
                        title='Nouvelle demande libre',
                        message=f'{requester_name} a soumis une demande libre: "{subject}"',
                        action_url='/requests/all',
                        related_object_type='document_request',
                        related_object_id=str(instance.id),
                    )
                except Exception:
                    pass
        except Exception:
            pass

        return Response(DocumentRequestSerializer(instance).data, status=status.HTTP_201_CREATED)


class SubmitSignedDocumentView(APIView):
    """POST /requests/<uuid>/sign/ -- Teacher draws/uploads signature, backend embeds it and regenerates PDF."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            doc_req = DocumentRequest.objects.get(pk=pk, requested_by=request.user)
        except DocumentRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        allowed_statuses = (
            DocumentRequest.Status.PENDING_SIGNATURE,
            DocumentRequest.Status.APPROVED,
            DocumentRequest.Status.GENERATED,
        )
        if doc_req.status not in allowed_statuses:
            return Response({'detail': 'Cette demande ne peut pas être signée dans son état actuel.'}, status=400)

        signed_file = request.FILES.get('signed_document')
        sig_image   = request.FILES.get('signature_image')

        if sig_image:
            import base64 as _b64
            ext  = sig_image.name.rsplit('.', 1)[-1].lower()
            mime = {'jpg': 'jpeg', 'jpeg': 'jpeg', 'png': 'png', 'webp': 'webp'}.get(ext, 'png')
            b64  = _b64.b64encode(sig_image.read()).decode()
            sig_tag = f'<img src="data:image/{mime};base64,{b64}" style="max-width:150px;max-height:60px;display:block;">'
            # Remove any previously stored signature from extra_data
            # so it doesn't appear twice (once in template body, once at bottom)
            extra = doc_req.extra_data or {}
            extra.pop('employee_signature', None)
            doc_req.extra_data = extra
            doc_req.status = DocumentRequest.Status.APPROVED
            doc_req.save(update_fields=['extra_data', 'status'])
            try:
                generate_pdf(doc_req, generated_by=request.user, sig_tag=sig_tag)
            except Exception:
                pass
        elif signed_file:
            doc_req.signed_document = signed_file
            doc_req.status = DocumentRequest.Status.APPROVED
            doc_req.save(update_fields=['signed_document', 'status'])
        else:
            return Response({'detail': 'Aucun fichier fourni.'}, status=400)

        # Notify all admins/super admins
        try:
            from apps.notifications.services import NotificationService
            from apps.accounts.models import User
            signer_name = request.user.get_full_name()
            doc_title = doc_req.template.name if doc_req.template else 'Document'
            for admin in User.objects.filter(role__in=['ADMIN_HR', 'SUPER_ADMIN']):
                try:
                    NotificationService.create_notification(
                        recipient=admin,
                        notification_type='DOCUMENT_SIGNED',
                        title='Document signé par un professeur',
                        message=f'{signer_name} a signé le document "{doc_title}" et l\'a renvoyé pour validation finale.',
                        action_url='/requests/all',
                        related_object_type='document_request',
                        related_object_id=str(doc_req.id),
                    )
                except Exception:
                    pass
        except Exception:
            pass

        return Response({'detail': 'Document signé et renvoyé à l\'administration avec succès.'})


class DocumentRequestDetailView(generics.RetrieveAPIView):
    """GET /requests/<uuid>/"""
    serializer_class = DocumentRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = DocumentRequest.objects.select_related(
            'requested_by', 'reviewed_by', 'template',
        )
        if self.request.user.is_hr_admin:
            return qs
        return qs.filter(requested_by=self.request.user)


class DocumentReviewView(APIView):
    """
    POST /requests/<uuid>/review/
    HR approves or rejects a pending document request.
    On approval, the PDF can be generated immediately or later.
    """
    permission_classes = [IsAdminHR]

    def post(self, request, pk):
        serializer = DocumentReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            doc_req = DocumentRequest.objects.get(pk=pk)
        except DocumentRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if doc_req.status != DocumentRequest.Status.PENDING:
            return Response(
                {'detail': 'Cette demande a deja ete traitee.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action = serializer.validated_data['action']
        doc_req.reviewed_by = request.user
        doc_req.reviewed_at = timezone.now()

        if action == 'approve':
            # Check if signature is required (template setting OR employee can_sign)
            try:
                emp = doc_req.requested_by.employee
                template_requires = doc_req.template and doc_req.template.requires_signature
                if emp.can_sign or template_requires:
                    doc_req.status = DocumentRequest.Status.APPROVED
                    doc_req.reviewed_by = request.user
                    doc_req.reviewed_at = timezone.now()
                    doc_req.save()
                    # Generate PDF first so professor can download it
                    try:
                        generate_pdf(doc_req, generated_by=request.user)
                    except Exception:
                        pass
                    # Now set to PENDING_SIGNATURE
                    doc_req.status = DocumentRequest.Status.PENDING_SIGNATURE
                    doc_req.save(update_fields=['status'])
                    from apps.notifications.services import NotificationService
                    try:
                        NotificationService.create_notification(
                            recipient=doc_req.requested_by,
                            notification_type='DOCUMENT_APPROVED',
                            title='Signature requise',
                            message='Votre demande a été approuvée. Téléchargez le document, signez-le et renvoyez-le.',
                            action_url='/requests',
                        )
                    except Exception:
                        pass
                    return Response(DocumentRequestSerializer(doc_req).data)
            except Exception:
                pass

            doc_req.status = DocumentRequest.Status.APPROVED
            doc_req.save()
            
            # Send approval notification
            from apps.notifications.services import NotificationService
            try:
                NotificationService.create_notification(
                    recipient=doc_req.requested_by,
                    notification_type='DOCUMENT_APPROVED',
                    title='Demande approuvée',
                    message=f'Votre demande de "{doc_req.template.name}" a été approuvée. Le document est en cours de génération.',
                    action_url='/certificates',
                    related_object_type='document_request',
                    related_object_id=str(doc_req.id),
                )
            except Exception:
                pass
            
            try:
                generate_pdf(doc_req, generated_by=request.user)
            except Exception:
                pass
        else:
            doc_req.status = DocumentRequest.Status.REJECTED
            doc_req.rejection_reason = serializer.validated_data.get('rejection_reason', '')
            doc_req.save()
            
            # Send rejection notification
            from apps.notifications.services import NotificationService
            try:
                NotificationService.create_notification(
                    recipient=doc_req.requested_by,
                    notification_type='DOCUMENT_REJECTED',
                    title='Demande rejetée',
                    message=f'Votre demande de "{doc_req.template.name}" a été rejetée. Raison: {doc_req.rejection_reason or "Non spécifiée"}',
                    action_url='/certificates',
                    related_object_type='document_request',
                    related_object_id=str(doc_req.id),
                )
            except Exception:
                pass

        return Response(DocumentRequestSerializer(doc_req).data)


class DocumentPreviewView(APIView):
    """
    GET /requests/<uuid>/preview/
    Returns rendered HTML preview of the document (before PDF generation).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            doc_req = DocumentRequest.objects.select_related(
                'requested_by', 'template',
            ).get(pk=pk)
        except DocumentRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_hr_admin and doc_req.requested_by != request.user:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        # Free request: render a simple HTML preview of the message
        if doc_req.template is None:
            subject = (doc_req.extra_data or {}).get('subject', 'Demande libre')
            message = doc_req.message or ''
            requester = doc_req.requested_by.get_full_name()
            date = doc_req.created_at.strftime('%d/%m/%Y')
            attachment_html = ''
            if doc_req.attachment:
                try:
                    from django.conf import settings as _s
                    host = getattr(_s, 'MEDIA_HOST', 'http://localhost:8000')
                    url = host.rstrip('/') + doc_req.attachment.url
                    fname = doc_req.attachment.name.split('/')[-1]
                    attachment_html = f'<p style="margin-top:16px;"><a href="{url}" target="_blank" style="color:#2563eb;">📎 {fname}</a></p>'
                except Exception:
                    pass
            html = f'''<div style="font-family:Arial,sans-serif;padding:32px;max-width:680px;margin:0 auto;">
<p style="color:#888;font-size:11pt;">{date} — {requester}</p>
<h2 style="font-size:15pt;margin:8px 0 16px;">{subject}</h2>
<div style="white-space:pre-wrap;font-size:11pt;line-height:1.7;border-left:3px solid #f59e0b;padding-left:16px;color:#374151;">{message}</div>
{attachment_html}
</div>'''
            return Response({'html': html})

        try:
            html = preview_html(doc_req)
        except Exception as e:
            return Response({'detail': f'Erreur de rendu: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'html': html})


class DocumentGenerateView(APIView):
    """
    POST /requests/<uuid>/generate/
    Generates the PDF for an approved document request.
    HR only. The request must be in APPROVED status.
    """
    permission_classes = [IsAdminHR]

    def post(self, request, pk):
        try:
            doc_req = DocumentRequest.objects.select_related(
                'requested_by', 'template',
            ).get(pk=pk)
        except DocumentRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if doc_req.status not in (DocumentRequest.Status.APPROVED, DocumentRequest.Status.GENERATED):
            return Response(
                {'detail': 'La demande doit etre approuvee avant la generation.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            gen_doc = generate_pdf(doc_req, generated_by=request.user)
        except Exception as e:
            return Response({'detail': f'Erreur de generation: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(GeneratedDocumentSerializer(gen_doc).data, status=status.HTTP_201_CREATED)


class SignedDocumentDownloadView(APIView):
    """
    GET /requests/<uuid>/download-signed/
    Download the professor-signed document. Admin/HR only.
    """
    permission_classes = [IsAdminHR]

    def get(self, request, pk):
        try:
            doc_req = DocumentRequest.objects.select_related('template').get(pk=pk)
        except DocumentRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        # If professor signed via drawn signature, the regenerated PDF is the signed one
        if not doc_req.signed_document:
            # Fall back to latest generated PDF (contains embedded drawn signature)
            gen_doc = doc_req.generated_documents.order_by('-created_at').first()
            if not gen_doc or not gen_doc.pdf_file:
                return Response({'detail': 'Aucun document signé disponible.'}, status=status.HTTP_404_NOT_FOUND)
            template_name = doc_req.template.name if doc_req.template else 'document'
            response = HttpResponse(gen_doc.pdf_file.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="signe_{template_name}_{doc_req.id}.pdf"'
            return response

        response = HttpResponse(doc_req.signed_document.read(), content_type='application/pdf')
        template_name = doc_req.template.name if doc_req.template else 'document'
        response['Content-Disposition'] = f'attachment; filename="signe_{template_name}_{doc_req.id}.pdf"'
        return response


class DocumentDownloadView(APIView):
    """
    GET /requests/<uuid>/download/
    Download the generated PDF file. Auto-generates if not yet created.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            doc_req = DocumentRequest.objects.select_related(
                'requested_by', 'template',
            ).get(pk=pk)
        except DocumentRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_hr_admin and doc_req.requested_by != request.user:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        # Free request (no template): serve the professor's uploaded attachment directly
        if doc_req.template is None:
            if not doc_req.attachment:
                return Response({'detail': 'Aucune pièce jointe disponible.'}, status=status.HTTP_404_NOT_FOUND)
            attachment = doc_req.attachment
            filename = attachment.name.split('/')[-1]
            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
            content_type_map = {
                'pdf': 'application/pdf',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
            }
            content_type = content_type_map.get(ext, 'application/octet-stream')
            response = HttpResponse(attachment.read(), content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        gen_doc = doc_req.generated_documents.order_by('-created_at').first()

        # Auto-generate only if template still exists and request is in valid state
        if not gen_doc and doc_req.status in (
            DocumentRequest.Status.APPROVED,
            DocumentRequest.Status.GENERATED,
            DocumentRequest.Status.PENDING_SIGNATURE,
        ):
            try:
                gen_doc = generate_pdf(doc_req, generated_by=request.user)
            except Exception as e:
                return Response({'detail': f'Erreur de generation: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not gen_doc or not gen_doc.pdf_file:
            return Response({'detail': 'Aucun document genere.'}, status=status.HTTP_404_NOT_FOUND)

        response = HttpResponse(gen_doc.pdf_file.read(), content_type='application/pdf')
        template_name = doc_req.template.name if doc_req.template else 'document'
        response['Content-Disposition'] = f'attachment; filename="{template_name}_{doc_req.id}.pdf"'
        return response


# ═══════════════════════════════════════════════════════════
# MISSIONS
# ═══════════════════════════════════════════════════════════

class MissionListCreateView(generics.ListCreateAPIView):
    """GET/POST /missions/"""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'employee']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MissionCreateSerializer
        return MissionSerializer

    def get_queryset(self):
        qs = Mission.objects.select_related('employee__user')
        if self.request.user.is_hr_admin:
            return qs
        if hasattr(self.request.user, 'employee'):
            return qs.filter(employee=self.request.user.employee)
        return qs.none()

    def perform_create(self, serializer):
        """
        Auto-set employee from the authenticated user unless the requester is
        HR/Admin, who may specify any employee.
        Non-admin users are always assigned their own employee profile regardless
        of what 'employee' field they submitted, preventing impersonation.
        """
        user = self.request.user
        if user.is_hr_admin:
            # HR/Admin can assign any employee; 'employee' field is required for them.
            if 'employee' not in serializer.validated_data:
                from rest_framework.exceptions import ValidationError
                raise ValidationError(
                    {'employee': 'Veuillez sélectionner un employé pour cette mission.'}
                )
            serializer.save()
        else:
            # Non-admin: always use their own employee profile, ignore any submitted value.
            if not hasattr(user, 'employee'):
                from rest_framework.exceptions import ValidationError
                raise ValidationError(
                    {'employee': 'Vous n\'avez pas de profil employé associé à votre compte.'}
                )
            serializer.save(employee=user.employee)

    def get_permissions(self):
        return [IsAuthenticated()]


class MissionDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /missions/<uuid>/"""
    queryset = Mission.objects.select_related('employee__user')
    serializer_class = MissionSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH'):
            return [IsAdminHR()]
        return [IsAuthenticated()]


class MissionApproveView(APIView):
    """POST /missions/<uuid>/approve/"""
    permission_classes = [IsAdminHR]

    def post(self, request, pk):
        try:
            mission = Mission.objects.select_related('employee__user').get(pk=pk)
        except Mission.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        mission.status = Mission.Status.APPROVED
        mission.approved_by = request.user
        mission.save()

        # Generate Ordre de Mission PDF and notify professor
        try:
            from apps.notifications.services import NotificationService
            template = DocumentTemplate.objects.filter(
                category='ORDRE_MISSION', is_active=True
            ).first()
            if template and hasattr(mission.employee, 'user'):
                prof_user = mission.employee.user
                doc_req = DocumentRequest.objects.create(
                    requested_by=prof_user,
                    template=template,
                    status=DocumentRequest.Status.APPROVED,
                    reviewed_by=request.user,
                    reviewed_at=timezone.now(),
                    extra_data={
                        'destination': mission.destination,
                        'date_depart': str(mission.start_date),
                        'date_retour': str(mission.end_date),
                        'objet_mission': mission.title,
                        'evenement': mission.description or mission.title,
                        'moyen_transport': '',
                        'accompagnants': '',
                        'indice': '',
                    },
                    message=f'Ordre de mission généré automatiquement lors de l\'approbation.',
                )
                generate_pdf(doc_req, generated_by=request.user)
                NotificationService.create_notification(
                    recipient=prof_user,
                    notification_type='DOCUMENT_APPROVED',
                    title='Ordre de mission approuvé',
                    message=f'Votre mission "{mission.title}" vers {mission.destination} a été approuvée. L\'ordre de mission est disponible au téléchargement.',
                    action_url='/requests',
                    related_object_type='document_request',
                    related_object_id=str(doc_req.id),
                )
        except Exception:
            pass

        return Response(MissionSerializer(mission).data)


# ═══════════════════════════════════════════════════════════
# SIGNATURE & STAMP
# ═══════════════════════════════════════════════════════════

class SignatureStampListCreateView(generics.ListCreateAPIView):
    """GET/POST /signatures/"""
    queryset = SignatureStamp.objects.all()
    serializer_class = SignatureStampSerializer
    permission_classes = [IsAdminHR]


class SignatureStampDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /signatures/<uuid>/"""
    queryset = SignatureStamp.objects.all()
    serializer_class = SignatureStampSerializer
    permission_classes = [IsAdminHR]


# ═══════════════════════════════════════════════════════════
# STATISTICS (Dashboard)
# ═══════════════════════════════════════════════════════════

class DocumentStatsView(APIView):
    """
    GET /stats/
    Returns counts for the admin dashboard.
    """
    permission_classes = [IsAdminHR]

    def get(self, request):
        req_qs = DocumentRequest.objects
        mission_qs = Mission.objects
        return Response({
            'requests': {
                'total': req_qs.count(),
                'pending': req_qs.filter(status='PENDING').count(),
                'approved': req_qs.filter(status='APPROVED').count(),
                'rejected': req_qs.filter(status='REJECTED').count(),
                'generated': req_qs.filter(status='GENERATED').count(),
            },
            'templates': DocumentTemplate.objects.filter(is_active=True).count(),
            'missions': {
                'total': mission_qs.count(),
                'active': mission_qs.filter(status__in=['PLANNED', 'APPROVED', 'IN_PROGRESS']).count(),
            },
        })
