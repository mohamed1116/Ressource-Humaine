from django.db import models
from apps.core.models import TimeStampedModel
from apps.core.validators import validate_cin


class Department(TimeStampedModel):
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True)
    head = models.ForeignKey(
        'Employee', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='headed_departments',
    )
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'departments'
        ordering = ['name']

    def __str__(self):
        return self.name


class Position(TimeStampedModel):
    """Grade / position title. Examples: Professeur Habilite, Technicien."""
    title = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    grade_level = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = 'positions'
        ordering = ['grade_level']

    def __str__(self):
        return self.title


class Employee(TimeStampedModel):
    class EmployeeType(models.TextChoices):
        PROFESSOR = 'PROFESSOR', 'Professor'
        STAFF = 'STAFF', 'Administrative Staff'

    class ContractType(models.TextChoices):
        PERMANENT = 'PERMANENT', 'Permanent (Titulaire)'
        CONTRACT = 'CONTRACT', 'Contractual (Contractuel)'
        TEMPORARY = 'TEMPORARY', 'Temporary (Vacataire)'

    class Gender(models.TextChoices):
        MALE = 'M', 'Male'
        FEMALE = 'F', 'Female'

    # Link to auth user
    user = models.OneToOneField(
        'accounts.User', on_delete=models.CASCADE, related_name='employee',
    )
    employee_id = models.CharField(max_length=20, unique=True)
    employee_type = models.CharField(max_length=10, choices=EmployeeType.choices)
    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, related_name='employees',
    )
    position = models.ForeignKey(
        Position, on_delete=models.PROTECT, related_name='employees',
    )

    # Numero de somme (PPR) -- identifiant unique fonctionnaire marocain
    numero_somme = models.CharField(
        max_length=20, unique=True, null=True, blank=True,
        help_text='Numero de somme (PPR) du fonctionnaire.',
    )

    # Personal information
    cin = models.CharField(max_length=15, unique=True, validators=[validate_cin])
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=Gender.choices)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

    # Employment
    hire_date = models.DateField()
    contract_type = models.CharField(max_length=10, choices=ContractType.choices)
    is_active = models.BooleanField(default=True)
    termination_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'employees'
        ordering = ['-hire_date']

    def __str__(self):
        return f'{self.user.first_name} {self.user.last_name} ({self.employee_id})'

    @property
    def full_name(self):
        return f'{self.user.first_name} {self.user.last_name}'


class ProfessorProfile(TimeStampedModel):
    """Extra fields specific to professors."""
    employee = models.OneToOneField(
        Employee, on_delete=models.CASCADE, related_name='professor_profile',
    )
    specialization = models.CharField(max_length=200)
    research_area = models.CharField(max_length=300, blank=True)
    academic_rank = models.CharField(max_length=100)  # PES, PH, PA
    publications_count = models.PositiveIntegerField(default=0)
    teaching_hours_per_week = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'professor_profiles'

    def __str__(self):
        return f'Prof. {self.employee.full_name} - {self.specialization}'


class StaffProfile(TimeStampedModel):
    """Extra fields specific to administrative staff."""
    employee = models.OneToOneField(
        Employee, on_delete=models.CASCADE, related_name='staff_profile',
    )
    service = models.CharField(max_length=200)
    office_number = models.CharField(max_length=20, blank=True)
    work_schedule = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'staff_profiles'

    def __str__(self):
        return f'{self.employee.full_name} - {self.service}'


class EmployeeDocument(TimeStampedModel):
    class DocumentType(models.TextChoices):
        CV = 'CV', 'Curriculum Vitae'
        CERTIFICATE = 'CERTIFICATE', 'Certificate'
        DIPLOMA = 'DIPLOMA', 'Diploma'
        ID_COPY = 'ID_COPY', 'ID Copy'
        CONTRACT = 'CONTRACT', 'Contract'
        OTHER = 'OTHER', 'Other'

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='documents',
    )
    document_type = models.CharField(max_length=15, choices=DocumentType.choices)
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='documents/%Y/%m/')
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, related_name='uploaded_documents',
    )

    class Meta:
        db_table = 'employee_documents'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.document_type})'
