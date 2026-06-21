"""Automatic recommendation generation for HR management."""
from datetime import date, timedelta
from django.utils import timezone


def generate_recommendations(leave_analysis, attendance_analysis, dept_stats_df):
    """
    Generate actionable recommendations based on combined analysis.

    Returns:
        list of recommendation dicts
    """
    recommendations = []

    # Staffing recommendations from leave analysis
    if leave_analysis.get('department_concentration'):
        for dept in leave_analysis['department_concentration']:
            if dept.get('alert'):
                recommendations.append({
                    'category': 'STAFFING',
                    'priority': 80,
                    'title': f"High leave concentration in {dept['department_name']}",
                    'description': (
                        f"Department {dept['department_name']} has {dept['leave_count']} leave requests, "
                        f"which is {dept['z_score']} standard deviations above average. "
                        f"Consider reviewing workload distribution."
                    ),
                    'department_id': dept['department_id'],
                })

    # Staffing recommendations from seasonal forecast
    if leave_analysis.get('seasonal_pattern', {}).get('peak_months'):
        peak = leave_analysis['seasonal_pattern']['peak_months']
        recommendations.append({
            'category': 'STAFFING',
            'priority': 60,
            'title': f"Upcoming peak leave season: {', '.join(peak[:3])}",
            'description': (
                f"Historical data shows leave requests peak in {', '.join(peak)}. "
                f"Plan temporary coverage or stagger leave approvals."
            ),
            'department_id': None,
        })

    # Attendance-based recommendations
    if attendance_analysis.get('flagged_employees'):
        critical = [e for e in attendance_analysis['flagged_employees'] if e['severity'] == 'critical']
        if critical:
            recommendations.append({
                'category': 'WELLBEING',
                'priority': 90,
                'title': f"{len(critical)} employees with critical lateness patterns",
                'description': (
                    f"Employees requiring immediate attention: "
                    f"{', '.join(e['employee_name'] for e in critical[:5])}. "
                    f"Schedule well-being check-ins."
                ),
                'department_id': None,
            })

        worsening = [e for e in attendance_analysis['flagged_employees'] if e['trend'] == 'worsening']
        if worsening:
            recommendations.append({
                'category': 'PERFORMANCE',
                'priority': 70,
                'title': f"{len(worsening)} employees with worsening attendance",
                'description': (
                    f"These employees show deteriorating punctuality: "
                    f"{', '.join(e['employee_name'] for e in worsening[:5])}."
                ),
                'department_id': None,
            })

    # Sort by priority
    recommendations.sort(key=lambda r: r['priority'], reverse=True)
    return recommendations
