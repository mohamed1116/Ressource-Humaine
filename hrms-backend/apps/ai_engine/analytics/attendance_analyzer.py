"""Recurring late arrival detection and pattern analysis."""
import pandas as pd
import numpy as np
from datetime import date, timedelta


def analyze_late_patterns(df):
    """
    Analyze attendance data to detect recurring late arrival patterns.

    Returns:
        dict with flagged_employees and overall_stats
    """
    if df.empty:
        return {'flagged_employees': [], 'overall_stats': _empty_stats()}

    late_df = df[df['is_late'] == True].copy()
    if late_df.empty:
        return {'flagged_employees': [], 'overall_stats': _empty_stats()}

    employees = df['employee_id'].unique()
    flagged = []

    for emp_id in employees:
        emp_data = df[df['employee_id'] == emp_id]
        emp_late = late_df[late_df['employee_id'] == emp_id]

        if len(emp_late) < 3:
            continue

        total_days = len(emp_data)
        late_days = len(emp_late)
        late_ratio = late_days / total_days if total_days > 0 else 0

        if late_ratio < 0.15:
            continue

        avg_lateness = emp_late['late_minutes'].mean()
        emp_name = emp_late.iloc[0].get('employee_name', 'Unknown')
        dept_name = emp_late.iloc[0].get('department_name', 'Unknown')

        # Detect day-of-week patterns
        emp_late['day_of_week'] = emp_late['date'].dt.dayofweek
        day_counts = emp_late['day_of_week'].value_counts()
        day_names = {0: 'Monday', 1: 'Tuesday', 2: 'Wednesday', 3: 'Thursday', 4: 'Friday'}
        pattern_days = [day_names[d] for d in day_counts[day_counts > day_counts.mean()].index if d in day_names]

        # Trend analysis (simple: compare recent 30 days to previous 30 days)
        recent_cutoff = date.today() - timedelta(days=30)
        recent_late = emp_late[emp_late['date'] >= pd.Timestamp(recent_cutoff)]
        older_late = emp_late[emp_late['date'] < pd.Timestamp(recent_cutoff)]

        if len(older_late) > 0 and len(recent_late) > 0:
            recent_avg = recent_late['late_minutes'].mean()
            older_avg = older_late['late_minutes'].mean()
            if recent_avg > older_avg * 1.2:
                trend = 'worsening'
            elif recent_avg < older_avg * 0.8:
                trend = 'improving'
            else:
                trend = 'stable'
        else:
            trend = 'stable'

        # Severity
        if late_ratio > 0.4 or avg_lateness > 30:
            severity = 'critical'
        elif late_ratio > 0.3 or avg_lateness > 20:
            severity = 'high'
        elif late_ratio > 0.2:
            severity = 'medium'
        else:
            severity = 'low'

        # Risk score
        risk_score = min(1.0, 0.4 * late_ratio / 0.5 + 0.3 * min(avg_lateness / 60, 1.0) +
                         0.2 * (1.0 if trend == 'worsening' else 0.5 if trend == 'stable' else 0.0) +
                         0.1 * (len(pattern_days) / 5))

        flagged.append({
            'employee_id': str(emp_id),
            'employee_name': emp_name,
            'department': dept_name,
            'late_ratio': round(float(late_ratio), 2),
            'avg_lateness_minutes': round(float(avg_lateness), 1),
            'trend': trend,
            'pattern_days': pattern_days,
            'severity': severity,
            'risk_score': round(float(risk_score), 2),
            'last_30_days_late_count': int(len(recent_late)),
        })

    flagged.sort(key=lambda x: x['risk_score'], reverse=True)

    overall_stats = {
        'total_employees_analyzed': int(len(employees)),
        'chronic_late_count': len([f for f in flagged if f['severity'] in ('critical', 'high')]),
        'improving_count': len([f for f in flagged if f['trend'] == 'improving']),
        'worsening_count': len([f for f in flagged if f['trend'] == 'worsening']),
    }

    return {'flagged_employees': flagged[:20], 'overall_stats': overall_stats}


def _empty_stats():
    return {
        'total_employees_analyzed': 0,
        'chronic_late_count': 0,
        'improving_count': 0,
        'worsening_count': 0,
    }
