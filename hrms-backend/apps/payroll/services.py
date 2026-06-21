from decimal import Decimal
from django.utils import timezone
from .models import EmployeeSalary, Payslip, PayslipLine, SalaryStructureComponent


class PayrollService:

    @staticmethod
    def calculate_ir_tax(gross_annual):
        """
        Moroccan Income Tax (Impot sur le Revenu) brackets.
        Returns monthly tax amount.
        """
        gross = float(gross_annual)
        tax = 0.0

        if gross <= 30000:
            tax = 0
        elif gross <= 50000:
            tax = (gross - 30000) * 0.10
        elif gross <= 60000:
            tax = 20000 * 0.10 + (gross - 50000) * 0.20
        elif gross <= 80000:
            tax = 20000 * 0.10 + 10000 * 0.20 + (gross - 60000) * 0.30
        elif gross <= 180000:
            tax = 20000 * 0.10 + 10000 * 0.20 + 20000 * 0.30 + (gross - 80000) * 0.34
        else:
            tax = (20000 * 0.10 + 10000 * 0.20 + 20000 * 0.30
                   + 100000 * 0.34 + (gross - 180000) * 0.38)

        monthly_tax = Decimal(str(round(tax / 12, 2)))
        return monthly_tax

    @staticmethod
    def generate_payslip(employee, year, month, generated_by=None):
        """Generate a payslip for a single employee."""
        try:
            emp_salary = EmployeeSalary.objects.select_related(
                'salary_structure',
            ).get(employee=employee)
        except EmployeeSalary.DoesNotExist:
            raise ValueError(f'No salary structure assigned to {employee.full_name}')

        base = emp_salary.effective_base
        structure_components = SalaryStructureComponent.objects.filter(
            salary_structure=emp_salary.salary_structure,
        ).select_related('component')

        total_allowances = Decimal('0')
        total_deductions = Decimal('0')
        lines = []

        for sc in structure_components:
            comp = sc.component
            if comp.is_percentage:
                amount = base * sc.value / Decimal('100')
            else:
                amount = sc.value

            lines.append({
                'component': comp,
                'component_type': comp.component_type,
                'amount': amount,
                'description': comp.name,
            })

            if comp.component_type == 'ALLOWANCE':
                total_allowances += amount
            else:
                total_deductions += amount

        gross = base + total_allowances
        gross_annual = gross * 12
        tax = PayrollService.calculate_ir_tax(gross_annual)
        net = gross - total_deductions - tax

        payslip = Payslip.objects.create(
            employee=employee,
            year=year,
            month=month,
            base_salary=base,
            total_allowances=total_allowances,
            total_deductions=total_deductions,
            tax_amount=tax,
            gross_salary=gross,
            net_salary=net,
            generated_by=generated_by,
        )

        for line_data in lines:
            PayslipLine.objects.create(payslip=payslip, **line_data)

        return payslip

    @staticmethod
    def bulk_generate_payslips(year, month, department=None, generated_by=None):
        """Generate payslips for all active employees."""
        from apps.employees.models import Employee

        employees = Employee.objects.filter(is_active=True)
        if department:
            employees = employees.filter(department=department)

        results = {'success': 0, 'errors': []}
        for employee in employees:
            try:
                if Payslip.objects.filter(employee=employee, year=year, month=month).exists():
                    continue
                PayrollService.generate_payslip(employee, year, month, generated_by)
                results['success'] += 1
            except Exception as e:
                results['errors'].append({'employee': str(employee), 'error': str(e)})

        return results

    @staticmethod
    def confirm_payslip(payslip):
        """Mark as CONFIRMED."""
        payslip.status = Payslip.Status.CONFIRMED
        payslip.confirmed_at = timezone.now()
        payslip.save()
        return payslip

    @staticmethod
    def mark_as_paid(payslip):
        """Mark as PAID."""
        if payslip.status != Payslip.Status.CONFIRMED:
            raise ValueError('Le bulletin doit être confirmé avant d\'être marqué comme payé.')
        payslip.status = Payslip.Status.PAID
        payslip.save()
        return payslip

    @staticmethod
    def assign_salary_structure(employee, salary_structure, base_salary_override=None, effective_date=None):
        """Assign or update salary structure for an employee."""
        from django.utils.timezone import now as tz_now
        emp_salary, _ = EmployeeSalary.objects.update_or_create(
            employee=employee,
            defaults={
                'salary_structure': salary_structure,
                'base_salary_override': base_salary_override,
                'effective_date': effective_date or tz_now().date(),
            },
        )
        return emp_salary
