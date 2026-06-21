"""
Super Admin Dashboard API
Advanced statistics and analytics for Super Admin only
"""
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
# Super Admin specific views for system-wide management
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from apps.accounts.permissions import IsSuperAdmin
from apps.employees.models import Employee, Department
from apps.certificates.models import DocumentRequest, DocumentTemplate, Mission
from apps.leaves.models import LeaveRequest
from apps.attendance.models import AttendanceRecord
from apps.evaluations.models import Evaluation

User = get_user_model()


class SuperAdminDashboardView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        week_start = now - timedelta(days=7)

        # Users
        by_role = dict(User.objects.values('role').annotate(c=Count('id')).values_list('role', 'c'))
        users_stats = {
            'total': User.objects.count(),
            'active': User.objects.filter(is_active=True).count(),
            'inactive': User.objects.filter(is_active=False).count(),
            'by_role': by_role,
            'new_last_30_days': User.objects.filter(created_at__gte=last_30_days).count(),
        }

        # Employees — FTE breakdown
        total_emp = Employee.objects.filter(user__is_active=True).count()
        permanent = Employee.objects.filter(contract_type='PERMANENT', user__is_active=True).count()
        vacataires = Employee.objects.filter(contract_type='TEMPORARY', user__is_active=True).count()
        employees_stats = {
            'total': total_emp,
            'professors': Employee.objects.filter(employee_type='PROFESSOR').count(),
            'staff': Employee.objects.filter(employee_type='STAFF').count(),
            'active': total_emp,
            'permanent': permanent,
            'vacataires': vacataires,
        }

        # Department headcount
        dept_counts = list(
            Department.objects.annotate(staff_count=Count('employees', filter=Q(employees__user__is_active=True)))
            .values('name', 'staff_count').order_by('-staff_count')
        )

        # Absence rate this week (absent / total employees)
        absent_this_week = AttendanceRecord.objects.filter(
            date__gte=week_start.date(), status='ABSENT'
        ).count()
        absence_rate = round((absent_this_week / total_emp * 100), 1) if total_emp else 0

        # Documents
        pending_docs = DocumentRequest.objects.filter(status='PENDING').count()
        pending_sig  = DocumentRequest.objects.filter(status='PENDING_SIGNATURE').count()
        documents_stats = {
            'templates': DocumentTemplate.objects.filter(is_active=True).count(),
            'requests_total': DocumentRequest.objects.count(),
            'requests_pending': pending_docs,
            'requests_pending_signature': pending_sig,
            'requests_approved': DocumentRequest.objects.filter(status='APPROVED').count(),
            'requests_generated': DocumentRequest.objects.filter(status='GENERATED').count(),
            'requests_rejected': DocumentRequest.objects.filter(status='REJECTED').count(),
            'requests_last_30_days': DocumentRequest.objects.filter(created_at__gte=last_30_days).count(),
        }

        # Leaves
        leaves_stats = {
            'total': LeaveRequest.objects.count(),
            'pending': LeaveRequest.objects.filter(status='PENDING').count(),
            'approved': LeaveRequest.objects.filter(status='APPROVED').count(),
            'rejected': LeaveRequest.objects.filter(status='REJECTED').count(),
        }

        # Missions
        missions_stats = {
            'total': Mission.objects.count(),
            'pending': Mission.objects.filter(status='PLANNED').count(),
            'active': Mission.objects.filter(status__in=['PLANNED', 'APPROVED', 'IN_PROGRESS']).count(),
        }

        # Attendance
        attendance_stats = {
            'total_records': AttendanceRecord.objects.count(),
            'present_today': AttendanceRecord.objects.filter(date=now.date(), status='PRESENT').count(),
            'absence_rate_week': absence_rate,
        }

        return Response({
            'users': users_stats,
            'employees': employees_stats,
            'departments': dept_counts,
            'documents': documents_stats,
            'leaves': leaves_stats,
            'missions': missions_stats,
            'attendance': attendance_stats,
        })


class UserActivityView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        recent_users = User.objects.filter(last_login__isnull=False).order_by('-last_login')[:50]
        activity = [{
            'id': str(u.id), 'name': u.get_full_name(),
            'email': u.email, 'role': u.role, 'last_login': u.last_login,
        } for u in recent_users]
        return Response({'activity': activity})
