from rest_framework import serializers
from .models import (
    SalaryStructure, SalaryComponent, SalaryStructureComponent,
    EmployeeSalary, Payslip, PayslipLine,
)


class SalaryComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryComponent
        fields = '__all__'


class SalaryStructureComponentSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_code = serializers.CharField(source='component.code', read_only=True)
    component_type = serializers.CharField(source='component.component_type', read_only=True)

    class Meta:
        model = SalaryStructureComponent
        fields = ['id', 'component', 'component_name', 'component_code', 'component_type', 'value']


class SalaryStructureSerializer(serializers.ModelSerializer):
    components = SalaryStructureComponentSerializer(many=True, read_only=True)
    position_title = serializers.CharField(source='position.title', read_only=True)

    class Meta:
        model = SalaryStructure
        fields = [
            'id', 'name', 'position', 'position_title',
            'base_salary', 'description', 'components', 'created_at',
        ]


class EmployeeSalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    structure_name = serializers.CharField(source='salary_structure.name', read_only=True)
    effective_base = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = EmployeeSalary
        fields = [
            'id', 'employee', 'employee_name', 'salary_structure', 'structure_name',
            'base_salary_override', 'effective_date', 'effective_base',
        ]

    def get_employee_name(self, obj):
        return obj.employee.full_name


class PayslipLineSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_code = serializers.CharField(source='component.code', read_only=True)

    class Meta:
        model = PayslipLine
        fields = ['id', 'component', 'component_name', 'component_code', 'component_type', 'amount', 'description']


class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    lines = PayslipLineSerializer(many=True, read_only=True)

    class Meta:
        model = Payslip
        fields = [
            'id', 'employee', 'employee_name', 'year', 'month',
            'base_salary', 'total_allowances', 'total_deductions',
            'tax_amount', 'gross_salary', 'net_salary',
            'status', 'pdf_file', 'notes', 'lines',
            'confirmed_at', 'created_at',
        ]

    def get_employee_name(self, obj):
        return obj.employee.full_name


class GeneratePayslipSerializer(serializers.Serializer):
    employee_id = serializers.UUIDField()
    year = serializers.IntegerField()
    month = serializers.IntegerField(min_value=1, max_value=12)


class BulkGeneratePayslipSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    month = serializers.IntegerField(min_value=1, max_value=12)
    department_id = serializers.UUIDField(required=False)
