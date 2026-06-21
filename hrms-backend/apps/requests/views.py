"""
=============================================================================
Unified Request API
=============================================================================

PURPOSE:
  Aggregates DocumentRequests, LeaveRequests, and Missions into a single
  normalized stream. Provides listing, statistics, and a unified
  approve/reject endpoint so HR can manage all request types from one page.

WHY NOT A SINGLE DATABASE TABLE?
  Each request type has specialized behavior:
    - DocumentRequest: links to templates, generates PDFs
    - LeaveRequest: 2-level approval, balance tracking, business day calc
    - Mission: budget, destination, transport, multi-stage lifecycle
  A single table would need 20+ nullable columns and lose all validation.

  Instead, we keep 3 specialized models and build a NORMALIZATION LAYER
  that presents them uniformly to the frontend.

ENDPOINTS:
  GET  /api/v1/requests/mine/            → user's own requests (all types)
  GET  /api/v1/requests/all/             → all requests (HR only)
  POST /api/v1/requests/review/          → approve/reject any request type
  GET  /api/v1/requests/stats/           → counts for the dashboard

NORMALIZATION FORMAT:
  Every request (regardless of type) is returned as:
  {
    "id": "uuid",
    "type": "CERTIFICATE" | "LEAVE" | "MISSION",
    "type_label": "Attestation" | "Conge" | "Mission",
    "title": "human-readable description",
    "status": "PENDING" | "APPROVED" | "REJECTED",
    "user_id": "uuid",
    "user_name": "Prenom Nom",
    "created_at": "ISO datetime",
    "details": { type-specific fields }
  }
=============================================================================
"""
from itertools import chain

from django.utils import timezone
from rest_framework import status as http_status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminHR
from apps.certificates.models import DocumentRequest, Mission
from apps.leaves.models import LeaveRequest


# =============================================================================
# NORMALIZATION FUNCTIONS
# =============================================================================
# These functions convert each model instance into the unified format.
# The frontend never needs to know which database table a request came from.

def _normalize_document(r):
    """
    Convert a DocumentRequest (certificate/attestation) to the unified format.

    DocumentRequest.status values: PENDING, APPROVED, REJECTED, GENERATED
    We map GENERATED → APPROVED since from the user's perspective it's approved.
    """
    is_free = r.template is None
    subject = (r.extra_data or {}).get('subject', '') if is_free else ''
    attachment_url = ''
    if r.attachment:
        try:
            from django.conf import settings
            url = r.attachment.url
            # Make absolute if it's a relative path
            if url and not url.startswith('http'):
                host = getattr(settings, 'MEDIA_HOST', 'http://localhost:8000')
                attachment_url = host.rstrip('/') + url
            else:
                attachment_url = url
        except Exception:
            pass
    return {
        'id': str(r.id),
        'type': 'FREE' if is_free else 'CERTIFICATE',
        'type_label': 'Demande libre' if is_free else 'Attestation',
        'title': subject or r.message[:60] if is_free else (r.template.name if r.template else 'Document'),
        'status': 'APPROVED' if r.status == 'GENERATED' else r.status,
        'user_id': str(r.requested_by_id),
        'user_name': r.requested_by.get_full_name(),
        'created_at': r.created_at.isoformat(),
        'has_pdf': r.generated_documents.exists(),
        'has_signed_document': bool(r.signed_document),
        'attachment_url': attachment_url,
        'note': r.message or '',
        'subject': subject,
        'details': {
            'template_name': r.template.name if r.template else '',
        },
    }


def _normalize_leave(r):
    """
    Convert a LeaveRequest to the unified format.

    LeaveRequest.status values: PENDING, DEPT_APPROVED, APPROVED, REJECTED, CANCELLED
    We map DEPT_APPROVED → PENDING (still waiting for final HR approval).
    We map CANCELLED → REJECTED.
    """
    status_map = {
        'PENDING': 'PENDING',
        'DEPT_APPROVED': 'PENDING',   # still needs HR approval
        'APPROVED': 'APPROVED',
        'REJECTED': 'REJECTED',
        'CANCELLED': 'REJECTED',
    }
    return {
        'id': str(r.id),
        'type': 'LEAVE',
        'type_label': 'Conge',
        'title': f'{r.leave_type.name} ({r.start_date} \u2192 {r.end_date})',
        'status': status_map.get(r.status, r.status),
        'user_id': str(r.employee.user_id),
        'user_name': r.employee.full_name,
        'created_at': r.created_at.isoformat(),
        'note': r.reason or '',
        'subject': '',
        'details': {
            'leave_type': r.leave_type.name,
            'start_date': str(r.start_date),
            'end_date': str(r.end_date),
            'total_days': str(r.total_days),
            'original_status': r.status,
        },
    }


def _normalize_mission(r):
    """
    Convert a Mission to the unified format.

    Mission.status values: PLANNED, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED
    We map: PLANNED → PENDING, CANCELLED → REJECTED, everything else → APPROVED.
    """
    status_map = {
        'PLANNED': 'PENDING',
        'APPROVED': 'APPROVED',
        'IN_PROGRESS': 'APPROVED',
        'COMPLETED': 'APPROVED',
        'CANCELLED': 'REJECTED',
    }
    return {
        'id': str(r.id),
        'type': 'MISSION',
        'type_label': 'Mission',
        'title': f'{r.title} \u2014 {r.destination}',
        'status': status_map.get(r.status, r.status),
        'user_id': str(r.employee.user_id),
        'user_name': r.employee.full_name,
        'created_at': r.created_at.isoformat(),
        'note': r.description or '',
        'subject': '',
        'details': {
            'destination': r.destination,
            'start_date': str(r.start_date),
            'end_date': str(r.end_date),
            'original_status': r.status,
        },
    }


# =============================================================================
# MY REQUESTS VIEW
# =============================================================================

class MyRequestsView(APIView):
    """
    GET /api/v1/requests/mine/

    Returns all requests belonging to the current user, across all types.
    Sorted by creation date (most recent first).

    Query params:
      ?type=CERTIFICATE|LEAVE|MISSION   Filter by request type
      ?status=PENDING|APPROVED|REJECTED Filter by normalized status

    How it works:
      1. Query DocumentRequests where requested_by = current user
      2. Query LeaveRequests where employee.user = current user
      3. Query Missions where employee.user = current user
      4. Normalize all 3 into the same format
      5. Merge, sort, and return
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # --- Fetch certificates ---
        docs = DocumentRequest.objects.filter(
            requested_by=user,
        ).select_related('template', 'requested_by').prefetch_related('generated_documents')

        # --- Fetch leaves (only if user has an employee profile) ---
        leaves = []
        if hasattr(user, 'employee'):
            leaves = LeaveRequest.objects.filter(
                employee=user.employee,
            ).select_related('leave_type', 'employee__user')

        # --- Fetch missions (only if user has an employee profile) ---
        missions = []
        if hasattr(user, 'employee'):
            missions = Mission.objects.filter(
                employee=user.employee,
            ).select_related('employee__user')

        # --- Normalize all into one list ---
        all_requests = list(chain(
            [_normalize_document(r) for r in docs],
            [_normalize_leave(r) for r in leaves],
            [_normalize_mission(r) for r in missions],
        ))

        # --- Sort by date (newest first) ---
        all_requests.sort(key=lambda x: x['created_at'], reverse=True)

        # --- Apply optional filters ---
        req_type = request.query_params.get('type')
        if req_type:
            all_requests = [r for r in all_requests if r['type'] == req_type]

        status = request.query_params.get('status')
        if status:
            all_requests = [r for r in all_requests if r['status'] == status]

        return Response(all_requests)


# =============================================================================
# ALL REQUESTS VIEW (HR only)
# =============================================================================

class AllRequestsView(APIView):
    """
    GET /api/v1/requests/all/

    HR-only endpoint. Returns ALL requests from ALL users.
    Same normalization and filtering as MyRequestsView.
    Used by the "Toutes les demandes" page.
    """
    permission_classes = [IsAdminHR]  # IsAdminHR already includes SUPER_ADMIN

    def get(self, request):
        # Fetch everything (no user filter)
        # prefetch_related('generated_documents') avoids N+1 queries in _normalize_document
        docs = DocumentRequest.objects.select_related(
            'template', 'requested_by'
        ).prefetch_related('generated_documents').all()
        leaves = LeaveRequest.objects.select_related('leave_type', 'employee__user').all()
        missions = Mission.objects.select_related('employee__user').all()

        # Normalize
        all_requests = list(chain(
            [_normalize_document(r) for r in docs],
            [_normalize_leave(r) for r in leaves],
            [_normalize_mission(r) for r in missions],
        ))

        # Sort
        all_requests.sort(key=lambda x: x['created_at'], reverse=True)

        # Filters
        req_type = request.query_params.get('type')
        if req_type:
            all_requests = [r for r in all_requests if r['type'] == req_type]

        status = request.query_params.get('status')
        if status:
            all_requests = [r for r in all_requests if r['status'] == status]

        return Response(all_requests)


# =============================================================================
# UNIFIED REVIEW (APPROVE / REJECT)
# =============================================================================

class UnifiedReviewView(APIView):
    """
    POST /api/v1/requests/review/

    HR-only endpoint to approve or reject ANY request type from the
    unified "Toutes les demandes" page.
    """
    permission_classes = [IsAdminHR]  # IsAdminHR already includes SUPER_ADMIN

    def post(self, request):
        req_type = request.data.get('type')
        req_id = request.data.get('id')
        action = request.data.get('action')  # 'approve' or 'reject'
        reason = request.data.get('reason', '')

        # --- Validate input ---
        if not req_type or not req_id or not action:
            return Response(
                {'detail': 'type, id, and action are required.'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        if action not in ('approve', 'reject'):
            return Response(
                {'detail': 'action must be "approve" or "reject".'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        # --- Route to the correct model based on type ---
        try:
            if req_type in ('CERTIFICATE', 'FREE'):
                return self._review_certificate(req_id, action, reason, request.user)
            elif req_type == 'LEAVE':
                return self._review_leave(req_id, action, reason, request.user)
            elif req_type == 'MISSION':
                return self._review_mission(req_id, action, reason, request.user)
            else:
                return Response(
                    {'detail': f'Unknown request type: {req_type}'},
                    status=http_status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

    def _review_certificate(self, req_id, action, reason, reviewer):
        """
        Approve or reject a DocumentRequest (certificate/attestation or free request).
        Approval sets status to APPROVED and auto-generates the PDF (if template exists).
        """
        from apps.certificates.pdf_service import generate_pdf
        from apps.notifications.services import NotificationService
        obj = DocumentRequest.objects.select_related('template', 'requested_by').get(id=req_id)
        if obj.status not in ('PENDING',):
            return Response({'detail': 'Cette demande a deja ete traitee.'}, status=http_status.HTTP_400_BAD_REQUEST)

        is_free = obj.template is None
        subject = (obj.extra_data or {}).get('subject', '') if is_free else (obj.template.name if obj.template else 'Document')

        obj.reviewed_by = reviewer
        obj.reviewed_at = timezone.now()
        if action == 'approve':
            obj.status = 'APPROVED'
            obj.save()
            if not is_free:
                try:
                    generate_pdf(obj, generated_by=reviewer)
                except Exception:
                    pass
            try:
                NotificationService.create_notification(
                    recipient=obj.requested_by,
                    notification_type='DOCUMENT_APPROVED',
                    title='Demande approuvée',
                    message=f'Votre demande "{subject}" a été approuvée.',
                    action_url='/requests',
                    related_object_type='document_request',
                    related_object_id=str(obj.id),
                )
            except Exception:
                pass
        else:
            obj.status = 'REJECTED'
            obj.rejection_reason = reason
            obj.save()
            try:
                NotificationService.create_notification(
                    recipient=obj.requested_by,
                    notification_type='DOCUMENT_REJECTED',
                    title='Demande rejetée',
                    message=f'Votre demande "{subject}" a été rejetée. Raison: {reason or "Non spécifiée"}',
                    action_url='/requests',
                    related_object_type='document_request',
                    related_object_id=str(obj.id),
                )
            except Exception:
                pass
        return Response({'detail': 'OK', 'status': obj.status})

    def _review_leave(self, req_id, action, reason, reviewer):
        """
        Approve or reject a LeaveRequest.
        When HR approves, it skips the 2-level workflow and directly approves.
        When HR rejects, it sets status to REJECTED.
        """
        from apps.leaves.services import LeaveService
        from apps.notifications.services import NotificationService

        obj = LeaveRequest.objects.select_related('employee__user', 'leave_type').get(id=req_id)
        if obj.status not in ('PENDING', 'DEPT_APPROVED'):
            return Response({'detail': 'Cette demande a deja ete traitee.'}, status=http_status.HTTP_400_BAD_REQUEST)

        if action == 'approve':
            if obj.status == 'PENDING':
                LeaveService.approve_by_department_head(obj, reviewer, 'Approuve directement par RH')
            LeaveService.approve_by_hr(obj, reviewer, reason)
            try:
                NotificationService.create_notification(
                    recipient=obj.employee.user,
                    notification_type='LEAVE_APPROVED',
                    title='Congé approuvé',
                    message=f'Votre demande de congé ({obj.leave_type.name}) du {obj.start_date} au {obj.end_date} a été approuvée.',
                    action_url='/requests',
                )
            except Exception:
                pass
        else:
            LeaveService.reject(obj, reviewer, reason)
            try:
                NotificationService.create_notification(
                    recipient=obj.employee.user,
                    notification_type='LEAVE_REJECTED',
                    title='Congé rejeté',
                    message=f'Votre demande de congé ({obj.leave_type.name}) a été rejetée. Raison: {reason or "Non spécifiée"}',
                    action_url='/requests',
                )
            except Exception:
                pass
        return Response({'detail': 'OK', 'status': obj.status})

    def _review_mission(self, req_id, action, reason, reviewer):
        """
        Approve or reject a Mission.
        On approval: generate the Ordre de Mission PDF and notify the professor.
        On rejection: set status to CANCELLED.
        """
        from apps.notifications.services import NotificationService
        obj = Mission.objects.select_related('employee__user').get(id=req_id)
        if obj.status != 'PLANNED':
            return Response({'detail': 'Cette mission a deja ete traitee.'}, status=http_status.HTTP_400_BAD_REQUEST)

        if action == 'approve':
            obj.status = 'APPROVED'
            obj.approved_by = reviewer
            obj.save()

            # Generate Ordre de Mission PDF and send to professor
            try:
                from apps.certificates.models import DocumentTemplate, DocumentRequest
                from apps.certificates.pdf_service import generate_pdf

                template = DocumentTemplate.objects.filter(
                    category='ORDRE_MISSION', is_active=True
                ).first()

                if template and hasattr(obj.employee, 'user'):
                    prof_user = obj.employee.user
                    # Create a DocumentRequest for this mission
                    doc_req = DocumentRequest.objects.create(
                        requested_by=prof_user,
                        template=template,
                        status=DocumentRequest.Status.APPROVED,
                        reviewed_by=reviewer,
                        reviewed_at=timezone.now(),
                        extra_data={
                            'destination': obj.destination,
                            'date_depart': str(obj.start_date),
                            'date_retour': str(obj.end_date),
                            'objet_mission': obj.title,
                            'evenement': obj.description or obj.title,
                            'moyen_transport': '',
                            'accompagnants': '',
                            'indice': '',
                        },
                        message=f'Ordre de mission généré automatiquement lors de l\'approbation de la mission "{obj.title}".',
                    )
                    generate_pdf(doc_req, generated_by=reviewer)

                    NotificationService.create_notification(
                        recipient=prof_user,
                        notification_type='DOCUMENT_APPROVED',
                        title='Ordre de mission approuvé',
                        message=f'Votre mission "{obj.title}" vers {obj.destination} a été approuvée. L\'ordre de mission est disponible au téléchargement.',
                        action_url='/requests',
                        related_object_type='document_request',
                        related_object_id=str(doc_req.id),
                    )
            except Exception:
                # Notification fallback if PDF generation fails
                try:
                    NotificationService.create_notification(
                        recipient=obj.employee.user,
                        notification_type='DOCUMENT_APPROVED',
                        title='Mission approuvée',
                        message=f'Votre mission "{obj.title}" vers {obj.destination} a été approuvée.',
                        action_url='/requests',
                    )
                except Exception:
                    pass
        else:
            obj.status = 'CANCELLED'
            obj.save()
            try:
                NotificationService.create_notification(
                    recipient=obj.employee.user,
                    notification_type='LEAVE_REJECTED',
                    title='Mission rejetée',
                    message=f'Votre mission "{obj.title}" vers {obj.destination} a été rejetée. Raison: {reason or "Non spécifiée"}',
                    action_url='/requests',
                )
            except Exception:
                pass
        return Response({'detail': 'OK', 'status': obj.status})


# =============================================================================
# DASHBOARD STATISTICS
# =============================================================================

class RequestStatsView(APIView):
    """
    GET /api/v1/requests/stats/
    HR-only endpoint returning counts across all request types.
    """
    permission_classes = [IsAdminHR]  # IsAdminHR already includes SUPER_ADMIN

    def get(self, request):
        # Count each type separately
        doc_pending = DocumentRequest.objects.filter(status='PENDING').count()
        doc_total = DocumentRequest.objects.count()

        leave_pending = LeaveRequest.objects.filter(status__in=['PENDING', 'DEPT_APPROVED']).count()
        leave_total = LeaveRequest.objects.count()

        mission_pending = Mission.objects.filter(status='PLANNED').count()
        mission_total = Mission.objects.count()

        return Response({
            'total': doc_total + leave_total + mission_total,
            'pending': doc_pending + leave_pending + mission_pending,
            'by_type': {
                'certificates': {'total': doc_total, 'pending': doc_pending},
                'leaves': {'total': leave_total, 'pending': leave_pending},
                'missions': {'total': mission_total, 'pending': mission_pending},
            },
        })
