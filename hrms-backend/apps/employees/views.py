from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.permissions import IsAdminHR, IsAdminHROrDepartmentHead
from .models import Department, Position, Employee, EmployeeDocument
from .serializers import (
    DepartmentSerializer,
    PositionSerializer,
    EmployeeListSerializer,
    EmployeeDetailSerializer,
    EmployeeDocumentSerializer,
)


# --- Departments ---
class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminHR()]
        return [IsAuthenticated()]


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminHR]


class DepartmentEmployeesView(generics.ListAPIView):
    serializer_class = EmployeeListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Employee.objects.filter(
            department_id=self.kwargs['pk'], is_active=True,
        ).select_related('user', 'department', 'position')


# --- Positions ---
class PositionListCreateView(generics.ListCreateAPIView):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminHR()]
        return [IsAuthenticated()]


class PositionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [IsAdminHR]


# --- Employees ---
class EmployeeListCreateView(generics.ListCreateAPIView):
    queryset = Employee.objects.select_related(
        'user', 'department', 'position',
    ).all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee_type', 'department', 'is_active', 'contract_type']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'cin']
    ordering_fields = ['hire_date', 'user__last_name']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EmployeeDetailSerializer
        return EmployeeListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminHR()]
        return [IsAdminHROrDepartmentHead()]


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.select_related(
        'user', 'department', 'position',
        'professor_profile', 'staff_profile',
    ).prefetch_related('documents').all()
    serializer_class = EmployeeDetailSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAdminHR()]
        return [IsAdminHROrDepartmentHead()]


class MyEmployeeProfileView(generics.RetrieveAPIView):
    """GET /api/v1/employees/me/ -- Current user's employee profile."""
    serializer_class = EmployeeDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return Employee.objects.select_related(
            'user', 'department', 'position',
            'professor_profile', 'staff_profile',
        ).prefetch_related('documents').get(user=self.request.user)


# --- Documents ---
class EmployeeDocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return EmployeeDocument.objects.filter(employee_id=self.kwargs['emp_pk'])

    def perform_create(self, serializer):
        serializer.save(
            employee_id=self.kwargs['emp_pk'],
            uploaded_by=self.request.user,
        )


class EmployeeDocumentDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return EmployeeDocument.objects.filter(employee_id=self.kwargs['emp_pk'])
