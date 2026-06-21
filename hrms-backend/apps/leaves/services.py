from datetime import date, timedelta
from decimal import Decimal
from django.utils import timezone
from .models import LeaveBalance, LeaveRequest


class LeaveService:

    @staticmethod
    def calculate_business_days(start_date, end_date):
        """Calculate working days excluding weekends (Sat/Sun)."""
        if start_date > end_date:
            return Decimal('0')
        days = Decimal('0')
        current = start_date
        while current <= end_date:
            if current.weekday() < 5:  # Mon-Fri
                days += 1
            current += timedelta(days=1)
        return days

    @staticmethod
    def check_balance(employee, leave_type, year, requested_days):
        """Returns True if employee has sufficient balance."""
        try:
            balance = LeaveBalance.objects.get(
                employee=employee, leave_type=leave_type, year=year,
            )
            return balance.remaining_days >= requested_days
        except LeaveBalance.DoesNotExist:
            return False

    @staticmethod
    def submit_request(employee, leave_type, start_date, end_date, reason, attachment=None):
        """Create leave request - balance check disabled, admin decides."""
        total_days = LeaveService.calculate_business_days(start_date, end_date)
        request = LeaveRequest.objects.create(
            employee=employee,
            leave_type=leave_type,
            start_date=start_date,
            end_date=end_date,
            total_days=total_days,
            reason=reason,
            attachment=attachment,
            status=LeaveRequest.Status.PENDING,
        )
        # Notify department head and HR
        from apps.notifications.services import NotificationService
        from apps.accounts.models import User
        requester_name = employee.full_name
        msg = f'{requester_name} a soumis une demande de congé ({leave_type.name}) du {start_date} au {end_date}.'
        recipients = list(User.objects.filter(role__in=['ADMIN_HR', 'SUPER_ADMIN']))
        if employee.department and hasattr(employee.department, 'head') and employee.department.head:
            dept_head_user = employee.department.head.user
            if dept_head_user not in recipients:
                recipients.append(dept_head_user)
        for recipient in recipients:
            try:
                NotificationService.create_notification(
                    recipient=recipient,
                    notification_type='LEAVE_REQUEST',
                    title='Nouvelle demande de congé',
                    message=msg,
                    action_url='/requests/all',
                    related_object_type='leave_request',
                    related_object_id=str(request.id),
                )
            except Exception:
                pass
        return request

    @staticmethod
    def approve_by_department_head(leave_request, user, comment=''):
        """Department head approves -> status = DEPT_APPROVED."""
        if leave_request.status != LeaveRequest.Status.PENDING:
            raise ValueError('Can only approve pending requests.')
        leave_request.status = LeaveRequest.Status.DEPT_APPROVED
        leave_request.department_head_action_by = user
        leave_request.department_head_action_date = timezone.now()
        leave_request.department_head_comment = comment
        leave_request.save()
        return leave_request

    @staticmethod
    def approve_by_hr(leave_request, user, comment=''):
        """HR final approval -> status = APPROVED, deduct from balance."""
        if leave_request.status != LeaveRequest.Status.DEPT_APPROVED:
            raise ValueError('Can only approve requests approved by department head.')
        leave_request.status = LeaveRequest.Status.APPROVED
        leave_request.hr_action_by = user
        leave_request.hr_action_date = timezone.now()
        leave_request.hr_comment = comment
        leave_request.save()

        # Deduct from balance
        balance, _ = LeaveBalance.objects.get_or_create(
            employee=leave_request.employee,
            leave_type=leave_request.leave_type,
            year=leave_request.start_date.year,
            defaults={'total_days': Decimal('0')},
        )
        balance.used_days += leave_request.total_days
        balance.save()
        return leave_request

    @staticmethod
    def reject(leave_request, user, comment):
        """Reject at any stage."""
        if leave_request.status in (LeaveRequest.Status.APPROVED, LeaveRequest.Status.CANCELLED):
            raise ValueError('Cannot reject an already approved or cancelled request.')
        if user.role == 'DEPARTMENT_HEAD':
            leave_request.department_head_action_by = user
            leave_request.department_head_action_date = timezone.now()
            leave_request.department_head_comment = comment
        else:
            leave_request.hr_action_by = user
            leave_request.hr_action_date = timezone.now()
            leave_request.hr_comment = comment
        leave_request.status = LeaveRequest.Status.REJECTED
        leave_request.save()
        return leave_request

    @staticmethod
    def cancel(leave_request, user):
        """Employee cancels own request. Restore balance if was approved."""
        was_approved = leave_request.status == LeaveRequest.Status.APPROVED
        leave_request.status = LeaveRequest.Status.CANCELLED
        leave_request.save()

        if was_approved:
            try:
                balance = LeaveBalance.objects.get(
                    employee=leave_request.employee,
                    leave_type=leave_request.leave_type,
                    year=leave_request.start_date.year,
                )
                balance.used_days -= leave_request.total_days
                balance.save()
            except LeaveBalance.DoesNotExist:
                pass
        return leave_request

    @staticmethod
    def initialize_annual_balances(year):
        """Create LeaveBalance records for all active employees for a new year."""
        from apps.employees.models import Employee
        from .models import LeaveType

        active_employees = Employee.objects.filter(is_active=True)
        leave_types = LeaveType.objects.all()
        created = 0

        for employee in active_employees:
            for lt in leave_types:
                if lt.applies_to == 'ALL' or lt.applies_to == employee.employee_type:
                    _, was_created = LeaveBalance.objects.get_or_create(
                        employee=employee,
                        leave_type=lt,
                        year=year,
                        defaults={'total_days': Decimal(str(lt.max_days_per_year))},
                    )
                    if was_created:
                        created += 1
        return created
