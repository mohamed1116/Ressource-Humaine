from django.db import models
from apps.core.models import TimeStampedModel


class SalaryStructure(TimeStampedModel):
    """Defines a salary template that can be assigned to positions."""
    name = models.CharField(max_length=200, unique=True)
    position = models.ForeignKey(
        'employees.Position', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='salary_structures',
    )
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'salary_structures'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} - {self.base_salary} DH'


class SalaryComponent(TimeStampedModel):
    """Individual allowance or deduction type."""
    class ComponentType(models.TextChoices):
        ALLOWANCE = 'ALLOWANCE', 'Allowance (Indemnite)'
        DEDUCTION = 'DEDUCTION', 'Deduction (Retenue)'

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=30, unique=True)
    component_type = models.CharField(max_length=10, choices=ComponentType.choices)
    is_percentage = models.BooleanField(default=False)
    default_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_taxable = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'salary_components'
        ordering = ['component_type', 'name']

    def __str__(self):
        return f'{self.name} ({self.code})'


class SalaryStructureComponent(TimeStampedModel):
    """Links components to structures with overridden values."""
    salary_structure = models.ForeignKey(
        SalaryStructure, on_delete=models.CASCADE, related_name='components',
    )
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    value = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'salary_structure_components'
        unique_together = ['salary_structure', 'component']

    def __str__(self):
        return f'{self.salary_structure.name} - {self.component.name}: {self.value}'


class EmployeeSalary(TimeStampedModel):
    """Assigns a salary structure to an employee."""
    employee = models.OneToOneField(
        'employees.Employee', on_delete=models.CASCADE, related_name='salary',
    )
    salary_structure = models.ForeignKey(
        SalaryStructure, on_delete=models.PROTECT, related_name='employee_salaries',
    )
    base_salary_override = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
    )
    effective_date = models.DateField()

    class Meta:
        db_table = 'employee_salaries'

    @property
    def effective_base(self):
        return self.base_salary_override or self.salary_structure.base_salary

    def __str__(self):
        return f'{self.employee.full_name} - {self.effective_base} DH'


class Payslip(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PAID = 'PAID', 'Paid'

    employee = models.ForeignKey(
        'employees.Employee', on_delete=models.CASCADE, related_name='payslips',
    )
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField()
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    total_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    generated_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, related_name='generated_payslips',
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)
    pdf_file = models.FileField(upload_to='payslips/%Y/%m/', null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'payslips'
        unique_together = ['employee', 'year', 'month']
        ordering = ['-year', '-month']

    def __str__(self):
        return f'{self.employee.full_name} - {self.month}/{self.year}'


class PayslipLine(TimeStampedModel):
    """Individual line items on a payslip."""
    payslip = models.ForeignKey(
        Payslip, on_delete=models.CASCADE, related_name='lines',
    )
    component = models.ForeignKey(SalaryComponent, on_delete=models.PROTECT)
    component_type = models.CharField(max_length=10)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = 'payslip_lines'

    def __str__(self):
        return f'{self.component.name}: {self.amount} DH'
