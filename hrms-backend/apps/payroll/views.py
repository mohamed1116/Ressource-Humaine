from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminHR
from apps.employees.models import Employee
from .models import SalaryStructure, SalaryComponent, EmployeeSalary, Payslip
from .serializers import (
    SalaryStructureSerializer,
    SalaryComponentSerializer,
    EmployeeSalarySerializer,
    PayslipSerializer,
    GeneratePayslipSerializer,
    BulkGeneratePayslipSerializer,
)
from .services import PayrollService


# --- Salary Structures ---
class SalaryStructureListCreateView(generics.ListCreateAPIView):
    queryset = SalaryStructure.objects.prefetch_related('components__component').all()
    serializer_class = SalaryStructureSerializer
    permission_classes = [IsAdminHR]


class SalaryStructureDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SalaryStructure.objects.prefetch_related('components__component').all()
    serializer_class = SalaryStructureSerializer
    permission_classes = [IsAdminHR]


# --- Salary Components ---
class SalaryComponentListCreateView(generics.ListCreateAPIView):
    queryset = SalaryComponent.objects.all()
    serializer_class = SalaryComponentSerializer
    permission_classes = [IsAdminHR]


class SalaryComponentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SalaryComponent.objects.all()
    serializer_class = SalaryComponentSerializer
    permission_classes = [IsAdminHR]


# --- Employee Salaries ---
class EmployeeSalaryListCreateView(generics.ListCreateAPIView):
    queryset = EmployeeSalary.objects.select_related('employee__user', 'salary_structure').all()
    serializer_class = EmployeeSalarySerializer
    permission_classes = [IsAdminHR]


class EmployeeSalaryDetailView(generics.RetrieveUpdateAPIView):
    queryset = EmployeeSalary.objects.all()
    serializer_class = EmployeeSalarySerializer
    permission_classes = [IsAdminHR]


# --- Payslips ---
class PayslipListView(generics.ListAPIView):
    serializer_class = PayslipSerializer
    filterset_fields = ['employee', 'year', 'month', 'status']

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Payslip.objects.select_related('employee__user').prefetch_related('lines__component')
        if self.request.user.is_hr_admin:
            return qs
        return qs.filter(employee__user=self.request.user)


class PayslipDetailView(generics.RetrieveAPIView):
    queryset = Payslip.objects.select_related('employee__user').prefetch_related('lines__component')
    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated]


class GeneratePayslipView(APIView):
    """POST /payroll/payslips/generate/ -- Generate for one employee."""
    permission_classes = [IsAdminHR]

    def post(self, request):
        serializer = GeneratePayslipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            employee = Employee.objects.get(pk=serializer.validated_data['employee_id'])
            payslip = PayrollService.generate_payslip(
                employee,
                serializer.validated_data['year'],
                serializer.validated_data['month'],
                generated_by=request.user,
            )
            return Response(PayslipSerializer(payslip).data, status=status.HTTP_201_CREATED)
        except Employee.DoesNotExist:
            return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BulkGeneratePayslipView(APIView):
    """POST /payroll/payslips/bulk-generate/"""
    permission_classes = [IsAdminHR]

    def post(self, request):
        serializer = BulkGeneratePayslipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        results = PayrollService.bulk_generate_payslips(
            year=serializer.validated_data['year'],
            month=serializer.validated_data['month'],
            department=serializer.validated_data.get('department_id'),
            generated_by=request.user,
        )
        return Response(results)


class ConfirmPayslipView(APIView):
    """POST /payroll/payslips/<uuid>/confirm/"""
    permission_classes = [IsAdminHR]

    def post(self, request, pk):
        try:
            payslip = Payslip.objects.get(pk=pk)
            PayrollService.confirm_payslip(payslip)
            return Response(PayslipSerializer(payslip).data)
        except Payslip.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


class MyPayslipsView(generics.ListAPIView):
    """GET /payroll/payslips/my-payslips/"""
    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payslip.objects.filter(
            employee__user=self.request.user,
        ).select_related('employee__user').prefetch_related('lines__component')
