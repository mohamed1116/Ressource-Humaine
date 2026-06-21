from django.contrib import admin
from .models import Department, Position, Employee, ProfessorProfile, StaffProfile, EmployeeDocument


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'head', 'created_at')
    search_fields = ('name', 'code')


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ('title', 'code', 'grade_level')
    ordering = ('grade_level',)


class ProfessorProfileInline(admin.StackedInline):
    model = ProfessorProfile
    extra = 0


class StaffProfileInline(admin.StackedInline):
    model = StaffProfile
    extra = 0


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'numero_somme', 'full_name', 'employee_type', 'department', 'position', 'is_active')
    list_filter = ('employee_type', 'department', 'is_active', 'contract_type')
    search_fields = ('user__first_name', 'user__last_name', 'employee_id', 'cin', 'numero_somme')
    inlines = [ProfessorProfileInline, StaffProfileInline]


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'employee', 'document_type', 'created_at')
    list_filter = ('document_type',)
