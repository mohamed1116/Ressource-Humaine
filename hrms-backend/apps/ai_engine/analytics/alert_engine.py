"""Department-level alert detection."""
import numpy as np
from datetime import date, timedelta


def detect_department_alerts(attendance_df, dept_stats_df):
    """
    Monitor department health metrics and raise alerts.

    Returns:
        list of alert dicts
    """
    alerts = []

    if attendance_df.empty or dept_stats_df.empty:
        return alerts

    today = date.today()
    last_30 = today - timedelta(days=30)

    recent = attendance_df[attendance_df['date'] >= str(last_30)]

    for _, dept in dept_stats_df.iterrows():
        dept_id = str(dept['id'])
        dept_name = dept['name']
        total_staff = dept['total_staff']

        if total_staff == 0:
            continue

        dept_attendance = recent[recent['department_id'] == dept['id']]
        if dept_attendance.empty:
            continue

        # Abnormal absence rate
        absent_count = len(dept_attendance[dept_attendance['status'].isin(['ABSENT', 'ON_LEAVE'])])
        total_records = len(dept_attendance)
        absence_rate = absent_count / total_records if total_records > 0 else 0

        if absence_rate > 0.3:
            alerts.append({
                'department_id': dept_id,
                'department_name': dept_name,
                'category': 'ABSENCE',
                'severity': 'CRITICAL' if absence_rate > 0.4 else 'WARNING',
                'title': f'High absence rate in {dept_name}',
                'description': (
                    f'Absence rate of {absence_rate:.0%} detected in {dept_name} '
                    f'over the last 30 days ({absent_count}/{total_records} records).'
                ),
                'metric_value': round(absence_rate, 3),
                'threshold_value': 0.3,
            })

        # Late arrival concentration
        late_count = len(dept_attendance[dept_attendance['is_late'] == True])
        late_rate = late_count / total_records if total_records > 0 else 0

        if late_rate > 0.25:
            alerts.append({
                'department_id': dept_id,
                'department_name': dept_name,
                'category': 'ABSENCE',
                'severity': 'WARNING',
                'title': f'High late arrival rate in {dept_name}',
                'description': (
                    f'{late_rate:.0%} of attendance records show late arrivals in {dept_name}.'
                ),
                'metric_value': round(late_rate, 3),
                'threshold_value': 0.25,
            })

        # Understaffing risk (based on current absences + leaves)
        today_str = str(today)
        today_absent = dept_attendance[
            (dept_attendance['date'] == today_str) &
            (dept_attendance['status'].isin(['ABSENT', 'ON_LEAVE']))
        ]
        effective_capacity = 1 - (len(today_absent) / total_staff) if total_staff > 0 else 1

        if effective_capacity < 0.5:
            alerts.append({
                'department_id': dept_id,
                'department_name': dept_name,
                'category': 'UNDERSTAFFING',
                'severity': 'CRITICAL',
                'title': f'Critical understaffing in {dept_name}',
                'description': (
                    f'Only {effective_capacity:.0%} effective capacity today. '
                    f'{len(today_absent)} out of {total_staff} staff unavailable.'
                ),
                'metric_value': round(effective_capacity, 3),
                'threshold_value': 0.5,
            })
        elif effective_capacity < 0.7:
            alerts.append({
                'department_id': dept_id,
                'department_name': dept_name,
                'category': 'UNDERSTAFFING',
                'severity': 'WARNING',
                'title': f'Understaffing risk in {dept_name}',
                'description': (
                    f'Effective capacity at {effective_capacity:.0%}. '
                    f'{len(today_absent)} out of {total_staff} staff unavailable.'
                ),
                'metric_value': round(effective_capacity, 3),
                'threshold_value': 0.7,
            })

    # Sort by severity
    severity_order = {'CRITICAL': 0, 'WARNING': 1, 'INFO': 2}
    alerts.sort(key=lambda a: severity_order.get(a['severity'], 9))

    return alerts
