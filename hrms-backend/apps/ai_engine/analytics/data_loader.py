"""Load data from Django ORM into pandas DataFrames for AI analysis."""
import pandas as pd
from django.db.models import Count, Avg, Q, F
from datetime import date, timedelta


def load_leave_data(months_back=24):
    """Load historical leave request data."""
    from apps.leaves.models import LeaveRequest

    cutoff = date.today() - timedelta(days=months_back * 30)
    qs = LeaveRequest.objects.filter(
        status='APPROVED',
        start_date__gte=cutoff,
    ).values(
        'id', 'employee_id', 'employee__department_id',
        'employee__department__name', 'leave_type__name', 'leave_type__category',
        'start_date', 'end_date', 'total_days',
    )

    if not qs.exists():
        return pd.DataFrame()

    df = pd.DataFrame.from_records(qs)
    df['start_date'] = pd.to_datetime(df['start_date'])
    df['end_date'] = pd.to_datetime(df['end_date'])
    df.rename(columns={
        'employee__department_id': 'department_id',
        'employee__department__name': 'department_name',
        'leave_type__name': 'leave_type_name',
        'leave_type__category': 'leave_type_category',
    }, inplace=True)
    return df


def load_attendance_data(months_back=6):
    """Load historical attendance data."""
    from apps.attendance.models import AttendanceRecord

    cutoff = date.today() - timedelta(days=months_back * 30)
    qs = AttendanceRecord.objects.filter(
        date__gte=cutoff,
    ).values(
        'id', 'employee_id', 'employee__user__first_name', 'employee__user__last_name',
        'employee__department_id', 'employee__department__name',
        'date', 'check_in', 'status', 'is_late', 'late_minutes', 'work_hours',
    )

    if not qs.exists():
        return pd.DataFrame()

    df = pd.DataFrame.from_records(qs)
    df['date'] = pd.to_datetime(df['date'])
    df['employee_name'] = df['employee__user__first_name'] + ' ' + df['employee__user__last_name']
    df.rename(columns={
        'employee__department_id': 'department_id',
        'employee__department__name': 'department_name',
    }, inplace=True)
    return df


def load_evaluation_data():
    """Load performance evaluation data."""
    from apps.evaluations.models import Evaluation

    qs = Evaluation.objects.filter(
        status='COMPLETED',
    ).values(
        'id', 'employee_id', 'employee__department_id',
        'employee__department__name',
        'period__name', 'overall_score', 'overall_rating', 'completed_at',
    )

    if not qs.exists():
        return pd.DataFrame()

    df = pd.DataFrame.from_records(qs)
    df.rename(columns={
        'employee__department_id': 'department_id',
        'employee__department__name': 'department_name',
        'period__name': 'period_name',
    }, inplace=True)
    return df


def load_department_stats():
    """Load current department employee counts."""
    from apps.employees.models import Department

    qs = Department.objects.annotate(
        total_staff=Count('employees', filter=Q(employees__is_active=True)),
    ).values('id', 'name', 'total_staff')

    return pd.DataFrame.from_records(qs)
