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
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminHR
from .models import DocumentTemplate, DocumentRequest, GeneratedDocument, Mission
from .serializers import (
    DocumentTemplateListSerializer,
    DocumentTemplateSerializer,
    DocumentRequestSerializer,
    DocumentRequestCreateSerializer,
    DocumentReviewSerializer,
    GeneratedDocumentSerializer,
    MissionSerializer,
    MissionCreateSerializer,
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

        # Filter by target_audience based on user role:
        #   STUDENT  → sees STUDENT + ALL templates
        #   EMPLOYEE → sees EMPLOYEE + ALL templates
        if user.role == 'STUDENT':
            qs = qs.filter(target_audience__in=['STUDENT', 'ALL'])
        else:
            qs = qs.filter(target_audience__in=['EMPLOYEE', 'ALL'])

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

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


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
            doc_req.status = DocumentRequest.Status.APPROVED
        else:
            doc_req.status = DocumentRequest.Status.REJECTED
            doc_req.rejection_reason = serializer.validated_data.get('rejection_reason', '')

        doc_req.save()
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

        # Check access
        if not request.user.is_hr_admin and doc_req.requested_by != request.user:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        html = preview_html(doc_req)
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

        gen_doc = generate_pdf(doc_req, generated_by=request.user)
        return Response(GeneratedDocumentSerializer(gen_doc).data, status=status.HTTP_201_CREATED)


class DocumentDownloadView(APIView):
    """
    GET /requests/<uuid>/download/
    Download the generated PDF file.
    Auto-generates PDF if approved but not yet generated.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            doc_req = DocumentRequest.objects.select_related('requested_by', 'template').get(pk=pk)
        except DocumentRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_hr_admin and doc_req.requested_by != request.user:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        # Auto-generate if approved but no PDF exists
        gen_doc = doc_req.generated_documents.order_by('-created_at').first()
        if not gen_doc and doc_req.status in (DocumentRequest.Status.APPROVED, DocumentRequest.Status.GENERATED):
            gen_doc = generate_pdf(doc_req, generated_by=request.user)

        if not gen_doc or not gen_doc.pdf_file:
            return Response({'detail': 'Aucun document genere.'}, status=status.HTTP_404_NOT_FOUND)

        response = HttpResponse(gen_doc.pdf_file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{doc_req.template.name}_{doc_req.id}.pdf"'
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

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminHR()]
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
            mission = Mission.objects.get(pk=pk)
        except Mission.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        mission.status = Mission.Status.APPROVED
        mission.approved_by = request.user
        mission.save()
        return Response(MissionSerializer(mission).data)


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
