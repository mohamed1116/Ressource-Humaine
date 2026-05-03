from django.contrib import admin
from .models import SalaryStructure, SalaryComponent, SalaryStructureComponent, EmployeeSalary, Payslip, PayslipLine


class SalaryStructureComponentInline(admin.TabularInline):
    model = SalaryStructureComponent
    extra = 1


@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ('name', 'position', 'base_salary')
    inlines = [SalaryStructureComponentInline]


@admin.register(SalaryComponent)
class SalaryComponentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'component_type', 'is_percentage', 'default_value')
    list_filter = ('component_type',)


@admin.register(EmployeeSalary)
class EmployeeSalaryAdmin(admin.ModelAdmin):
    list_display = ('employee', 'salary_structure', 'effective_base', 'effective_date')


class PayslipLineInline(admin.TabularInline):
    model = PayslipLine
    extra = 0
    readonly_fields = ('component', 'component_type', 'amount', 'description')


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ('employee', 'year', 'month', 'gross_salary', 'net_salary', 'status')
    list_filter = ('status', 'year', 'month')
    inlines = [PayslipLineInline]
