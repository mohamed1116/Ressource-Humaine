import openpyxl
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model

from apps.accounts.permissions import IsAdminHR, IsAdminHROrDepartmentHead
from .models import Department, Position, Employee, EmployeeDocument, ProfessorProfile, StaffProfile
from .serializers import (
    DepartmentSerializer,
    PositionSerializer,
    EmployeeListSerializer,
    EmployeeDetailSerializer,
    EmployeeDocumentSerializer,
)

User = get_user_model()


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
    ).prefetch_related('professor_profile', 'staff_profile').all()
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


class UploadSignatureView(APIView):
    """PATCH /api/v1/employees/me/signature/ -- Upload own signature."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request):
        try:
            emp = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            return Response({'detail': 'Profil employé introuvable.'}, status=404)
        file = request.FILES.get('signature')
        if not file:
            return Response({'detail': 'Aucun fichier fourni.'}, status=400)
        allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        if file.content_type not in allowed:
            return Response({'detail': 'Format non supporté. Utilisez PNG, JPG ou WEBP.'}, status=400)
        if file.size > 10 * 1024 * 1024:
            return Response({'detail': 'Fichier trop volumineux (max 10 MB).'}, status=400)
        emp.signature = file
        emp.save(update_fields=['signature'])
        sig_url = request.build_absolute_uri(emp.signature.url) if emp.signature else None
        return Response({'signature_url': sig_url})

    def delete(self, request):
        try:
            emp = Employee.objects.get(user=request.user)
            emp.signature.delete(save=True)
            return Response(status=204)
        except Employee.DoesNotExist:
            return Response({'detail': 'Profil introuvable.'}, status=404)


# --- Excel Import ---
class EmployeeExcelImportView(APIView):
    permission_classes = [IsAdminHR]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Aucun fichier fourni.'}, status=400)

        try:
            wb = openpyxl.load_workbook(file, read_only=True, data_only=True)
            ws = wb.active
            rows = list(ws.iter_rows(values_only=True))
        except Exception:
            return Response({'detail': 'Fichier Excel invalide.'}, status=400)

        if len(rows) < 2:
            return Response({'detail': 'Le fichier est vide.'}, status=400)

        headers = [str(h).strip().lower() if h else '' for h in rows[0]]

        def col(row, name):
            try:
                idx = headers.index(name)
                v = row[idx]
                return str(v).strip() if v is not None else ''
            except ValueError:
                return ''

        created, updated, errors = 0, 0, []

        for i, row in enumerate(rows[1:], start=2):
            try:
                email = col(row, 'email')
                if not email:
                    continue

                first_name = col(row, 'prenom') or col(row, 'first_name')
                last_name  = col(row, 'nom') or col(row, 'last_name')
                cin        = col(row, 'cin')
                phone      = col(row, 'telephone') or col(row, 'phone')
                dob        = col(row, 'date_naissance') or col(row, 'date_of_birth')
                hire_date  = col(row, 'date_embauche') or col(row, 'hire_date')
                emp_type   = (col(row, 'type') or 'STAFF').upper()
                if emp_type not in ('PROFESSOR', 'STAFF'):
                    emp_type = 'STAFF'
                contract   = (col(row, 'contrat') or col(row, 'contract_type') or 'PERMANENT').upper()
                if contract not in ('PERMANENT', 'CONTRACT', 'TEMPORARY'):
                    contract = 'PERMANENT'
                gender     = (col(row, 'genre') or col(row, 'gender') or 'M').upper()[0]
                if gender not in ('M', 'F'):
                    gender = 'M'
                numero_somme = col(row, 'numero_somme') or col(row, 'ppr')
                dept_name  = col(row, 'departement') or col(row, 'department')
                pos_code   = col(row, 'grade') or col(row, 'position')
                specialization = col(row, 'specialisation') or col(row, 'specialization')

                # resolve department
                dept = None
                if dept_name:
                    dept = Department.objects.filter(name__icontains=dept_name).first() or \
                           Department.objects.filter(code__iexact=dept_name).first()
                if not dept:
                    dept = Department.objects.first()

                # resolve position
                pos = None
                if pos_code:
                    pos = Position.objects.filter(code__iexact=pos_code).first() or \
                          Position.objects.filter(title__icontains=pos_code).first()
                if not pos:
                    pos = Position.objects.first()

                # create or update user
                user, user_created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': email.split('@')[0].replace('.', '_'),
                        'first_name': first_name,
                        'last_name': last_name,
                        'phone': phone,
                        'role': 'PROFESSOR' if emp_type == 'PROFESSOR' else 'STAFF',
                    }
                )
                if not user_created:
                    if first_name: user.first_name = first_name
                    if last_name:  user.last_name  = last_name
                    if phone:      user.phone      = phone
                    user.save(update_fields=['first_name', 'last_name', 'phone'])

                if user_created:
                    user.set_password('changeme123')
                    user.save()

                # employee counter
                emp_count = Employee.objects.count() + 1
                emp_id = f'FPT-{emp_type[:4]}-{emp_count:03d}'

                emp_defaults = {
                    'employee_type': emp_type,
                    'department': dept,
                    'position': pos,
                    'contract_type': contract,
                    'gender': gender,
                }
                if cin:          emp_defaults['cin']          = cin
                if dob:          emp_defaults['date_of_birth'] = dob
                if hire_date:    emp_defaults['hire_date']    = hire_date
                if numero_somme: emp_defaults['numero_somme'] = numero_somme

                emp, emp_created = Employee.objects.update_or_create(
                    user=user,
                    defaults={**emp_defaults, 'employee_id': emp_id if not Employee.objects.filter(user=user).exists() else Employee.objects.get(user=user).employee_id},
                )

                if emp_type == 'PROFESSOR':
                    ProfessorProfile.objects.update_or_create(
                        employee=emp,
                        defaults={'specialization': specialization or 'N/A', 'academic_rank': pos_code or 'PA'},
                    )
                else:
                    StaffProfile.objects.update_or_create(
                        employee=emp,
                        defaults={'service': dept.name if dept else 'N/A'},
                    )

                if emp_created:
                    created += 1
                else:
                    updated += 1

            except Exception as e:
                errors.append(f'Ligne {i}: {str(e)}')

        return Response({
            'created': created,
            'updated': updated,
            'errors': errors,
        })


class ToggleCanSignView(APIView):
    """PATCH /api/v1/employees/<uuid>/can-sign/ -- Admin toggles can_sign for an employee."""
    permission_classes = [IsAdminHR]

    def patch(self, request, pk):
        try:
            emp = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        emp.can_sign = not emp.can_sign
        emp.save(update_fields=['can_sign'])
        return Response({'can_sign': emp.can_sign})


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
