from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminHR, IsAdminHROrDepartmentHead, IsDepartmentHead
from .models import LeaveType, LeaveBalance, LeaveRequest
from .serializers import (
    LeaveTypeSerializer,
    LeaveBalanceSerializer,
    LeaveRequestSerializer,
    LeaveRequestCreateSerializer,
    LeaveActionSerializer,
)
from .services import LeaveService


# --- Leave Types ---
class LeaveTypeListCreateView(generics.ListCreateAPIView):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminHR()]
        return [IsAuthenticated()]


class LeaveTypeDetailView(generics.RetrieveUpdateAPIView):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAdminHR]


# --- Leave Balances ---
class LeaveBalanceListView(generics.ListAPIView):
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = LeaveBalance.objects.select_related('employee__user', 'leave_type')
        employee_id = self.request.query_params.get('employee')
        year = self.request.query_params.get('year')

        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        elif not self.request.user.is_hr_admin:
            # Non-admin users see only their own balances
            qs = qs.filter(employee__user=self.request.user)

        if year:
            qs = qs.filter(year=year)
        return qs


# --- Leave Requests ---
class LeaveRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LeaveRequestCreateSerializer
        return LeaveRequestSerializer

    def get_queryset(self):
        qs = LeaveRequest.objects.select_related(
            'employee__user', 'leave_type',
            'department_head_action_by', 'hr_action_by',
        )
        user = self.request.user
        if user.is_hr_admin:
            return qs  # See all
        if user.is_department_head:
            return qs.filter(employee__department__head__user=user)
        return qs.filter(employee__user=user)

    def perform_create(self, serializer):
        user = self.request.user
        # Get or auto-create a minimal employee profile
        if not hasattr(user, 'employee'):
            from apps.employees.models import Employee, Department, Position
            from django.utils import timezone
            # Get or create a default department and position
            dept, _ = Department.objects.get_or_create(
                code='DEFAULT',
                defaults={'name': 'Non assigné', 'code': 'DEFAULT'}
            )
            pos, _ = Position.objects.get_or_create(
                code='DEFAULT',
                defaults={'title': 'Non assigné', 'code': 'DEFAULT', 'grade_level': 1}
            )
            import random, string
            emp_id = 'EMP' + ''.join(random.choices(string.digits, k=6))
            while Employee.objects.filter(employee_id=emp_id).exists():
                emp_id = 'EMP' + ''.join(random.choices(string.digits, k=6))
            cin = 'CIN' + ''.join(random.choices(string.digits, k=6))
            while Employee.objects.filter(cin=cin).exists():
                cin = 'CIN' + ''.join(random.choices(string.digits, k=6))
            Employee.objects.create(
                user=user,
                employee_id=emp_id,
                employee_type='STAFF',
                department=dept,
                position=pos,
                cin=cin,
                date_of_birth='1990-01-01',
                gender='M',
                hire_date=timezone.now().date(),
                contract_type='PERMANENT',
            )
            user.refresh_from_db()
        data = serializer.validated_data
        leave_request = LeaveService.submit_request(
            employee=user.employee,
            leave_type=data['leave_type'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            reason=data['reason'],
            attachment=data.get('attachment'),
        )
        serializer.instance = leave_request


class LeaveRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LeaveRequest.objects.select_related(
        'employee__user', 'leave_type',
        'department_head_action_by', 'hr_action_by',
    )
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]


# --- Approval Actions ---
class ApproveDeptView(APIView):
    """POST /leaves/requests/<uuid>/approve-dept/"""
    permission_classes = [IsDepartmentHead]

    def post(self, request, pk):
        serializer = LeaveActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            leave_request = LeaveRequest.objects.get(pk=pk)
            LeaveService.approve_by_department_head(
                leave_request, request.user, serializer.validated_data['comment'],
            )
            return Response(LeaveRequestSerializer(leave_request).data)
        except LeaveRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ApproveHRView(APIView):
    """POST /leaves/requests/<uuid>/approve-hr/"""
    permission_classes = [IsAdminHR]

    def post(self, request, pk):
        serializer = LeaveActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            leave_request = LeaveRequest.objects.get(pk=pk)
            LeaveService.approve_by_hr(
                leave_request, request.user, serializer.validated_data['comment'],
            )
            return Response(LeaveRequestSerializer(leave_request).data)
        except LeaveRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RejectLeaveView(APIView):
    """POST /leaves/requests/<uuid>/reject/"""
    permission_classes = [IsAdminHROrDepartmentHead]

    def post(self, request, pk):
        serializer = LeaveActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            leave_request = LeaveRequest.objects.get(pk=pk)
            LeaveService.reject(
                leave_request, request.user, serializer.validated_data['comment'],
            )
            return Response(LeaveRequestSerializer(leave_request).data)
        except LeaveRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
