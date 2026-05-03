"""
AI Engine REST API
==================
These endpoints run in the background -- the frontend dashboard calls them
silently and surfaces the results as alerts, banners, and smart stats.
There is no dedicated "AI page". Instead, intelligence is embedded into
every part of the application that needs it.

API Summary:
  GET /api/v1/ai/dashboard/              Full summary for the HR dashboard
  GET /api/v1/ai/alerts/                 Active alerts (department-level)
  GET /api/v1/ai/alerts/dismiss/<uuid>/  Dismiss an alert
  GET /api/v1/ai/recommendations/        Generated recommendations
  GET /api/v1/ai/employee/<uuid>/        Intelligence profile for one employee
  GET /api/v1/ai/leave-forecast/         Leave volume predictions
  GET /api/v1/ai/late-patterns/          Recurring late arrival patterns
"""
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminHR
from .models import Alert, Recommendation
from .serializers import AlertSerializer, RecommendationSerializer
from .analytics.data_loader import (
    load_leave_data, load_attendance_data, load_department_stats,
)
from .analytics.leave_analyzer import analyze_leave_trends
from .analytics.attendance_analyzer import analyze_late_patterns
from .analytics.recommender import generate_recommendations
from .analytics.alert_engine import detect_department_alerts


class AIDashboardView(APIView):
    """
    GET /api/v1/ai/dashboard/

    Returns a compact summary of all AI insights in one call.
    The frontend dashboard calls this once on load and uses the data
    to render alert banners, stat cards, and recommendation hints.

    Response:
    {
      "alerts":              { "total": 2, "critical": 1, "warning": 1 },
      "late_arrivals":       { "total_flagged": 5, "critical_count": 2 },
      "recommendations":     [ { "title": "...", "description": "...", ... } ],
      "leave_forecast":      [ { "week_start": "...", "predicted_leaves": 4 } ],
      "seasonal_pattern":    { "peak_months": ["July", "August"] }
    }
    """
    permission_classes = [IsAdminHR]

    def get(self, request):
        leave_df = load_leave_data()
        attendance_df = load_attendance_data()
        dept_stats = load_department_stats()

        leave_analysis = analyze_leave_trends(leave_df)
        attendance_analysis = analyze_late_patterns(attendance_df)
        alerts = detect_department_alerts(attendance_df, dept_stats)
        recommendations = generate_recommendations(
            leave_analysis, attendance_analysis, dept_stats,
        )

        return Response({
            'alerts': {
                'total': len(alerts),
                'critical': len([a for a in alerts if a['severity'] == 'CRITICAL']),
                'warning': len([a for a in alerts if a['severity'] == 'WARNING']),
                'items': alerts[:5],
            },
            'late_arrivals': attendance_analysis.get('overall_stats', {}),
            'recommendations': recommendations[:5],
            'leave_forecast': leave_analysis.get('forecast', [])[:6],
            'seasonal_pattern': leave_analysis.get('seasonal_pattern', {}),
        })


class AlertListView(APIView):
    """
    GET /api/v1/ai/alerts/

    Returns all active department-level alerts.
    Combines real-time computed alerts with stored persistent alerts.

    Query params:
      ?severity=CRITICAL     Filter by severity
      ?department=<uuid>     Filter by department
    """
    permission_classes = [IsAdminHR]

    def get(self, request):
        # Compute fresh alerts
        attendance_df = load_attendance_data()
        dept_stats = load_department_stats()
        computed = detect_department_alerts(attendance_df, dept_stats)

        # Merge with stored alerts
        stored = Alert.objects.filter(is_active=True).select_related('department')
        stored_data = AlertSerializer(stored, many=True).data

        # Apply filters
        severity = request.query_params.get('severity')
        if severity:
            computed = [a for a in computed if a['severity'] == severity]

        return Response({
            'computed': computed,
            'stored': stored_data,
            'summary': {
                'total': len(computed) + len(stored_data),
                'critical': len([a for a in computed if a['severity'] == 'CRITICAL']),
                'warning': len([a for a in computed if a['severity'] == 'WARNING']),
            },
        })


class AlertDismissView(APIView):
    """
    POST /api/v1/ai/alerts/<uuid>/dismiss/

    Acknowledge and dismiss a stored alert.
    """
    permission_classes = [IsAdminHR]

    def post(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk, is_active=True)
        except Alert.DoesNotExist:
            return Response({'detail': 'Alert not found.'}, status=404)

        alert.is_active = False
        alert.resolved_at = timezone.now()
        alert.acknowledged_by = request.user
        alert.save()
        return Response({'detail': 'Alert dismissed.'})


class RecommendationListView(APIView):
    """
    GET /api/v1/ai/recommendations/

    Returns AI-generated recommendations for HR actions.
    Combines real-time analysis with stored recommendations.
    """
    permission_classes = [IsAdminHR]

    def get(self, request):
        leave_df = load_leave_data()
        attendance_df = load_attendance_data()
        dept_stats = load_department_stats()

        leave_analysis = analyze_leave_trends(leave_df)
        attendance_analysis = analyze_late_patterns(attendance_df)

        generated = generate_recommendations(
            leave_analysis, attendance_analysis, dept_stats,
        )

        stored = Recommendation.objects.filter(status='NEW').select_related('affected_department')
        stored_data = RecommendationSerializer(stored, many=True).data

        return Response({
            'generated': generated,
            'stored': stored_data,
            'total': len(generated) + len(stored_data),
        })


class EmployeeIntelligenceView(APIView):
    """
    GET /api/v1/ai/employee/<uuid>/

    Returns AI-computed intelligence profile for a single employee:
    - Late arrival stats (frequency, trend, risk score)
    - Leave usage patterns
    - Mission frequency

    This is called when HR views an employee's detail page,
    so the intelligence appears inline -- not on a separate AI page.
    """
    permission_classes = [IsAdminHR]

    def get(self, request, pk):
        attendance_df = load_attendance_data()
        leave_df = load_leave_data()

        # Filter to this employee
        emp_attendance = attendance_df[attendance_df['employee_id'] == str(pk)] if not attendance_df.empty else attendance_df
        emp_leaves = leave_df[leave_df['employee_id'] == str(pk)] if not leave_df.empty else leave_df

        # Late arrival analysis
        late_info = {}
        if not emp_attendance.empty:
            total_days = len(emp_attendance)
            late_days = len(emp_attendance[emp_attendance['is_late'] == True])
            late_info = {
                'total_days_tracked': int(total_days),
                'late_count': int(late_days),
                'late_ratio': round(late_days / total_days, 2) if total_days > 0 else 0,
                'avg_late_minutes': round(float(emp_attendance[emp_attendance['is_late'] == True]['late_minutes'].mean()), 1) if late_days > 0 else 0,
            }

        # Leave analysis
        leave_info = {}
        if not emp_leaves.empty:
            leave_info = {
                'total_leaves': int(len(emp_leaves)),
                'total_days_taken': float(emp_leaves['total_days'].sum()),
                'by_type': emp_leaves.groupby('leave_type_name')['total_days'].sum().to_dict() if 'leave_type_name' in emp_leaves.columns else {},
            }

        # Mission count
        from apps.certificates.models import Mission
        mission_count = Mission.objects.filter(employee_id=pk).count()
        recent_missions = Mission.objects.filter(employee_id=pk).count()

        # Risk flags
        flags = []
        if late_info.get('late_ratio', 0) > 0.3:
            flags.append({'type': 'warning', 'message': 'Taux de retard eleve (>30%)'})
        if late_info.get('late_ratio', 0) > 0.5:
            flags.append({'type': 'critical', 'message': 'Taux de retard critique (>50%)'})
        if mission_count > 5:
            flags.append({'type': 'info', 'message': f'Frequence de missions elevee ({mission_count} missions)'})

        return Response({
            'employee_id': str(pk),
            'attendance': late_info,
            'leaves': leave_info,
            'missions': {
                'total': mission_count,
            },
            'flags': flags,
        })


class LeaveForecastView(APIView):
    """
    GET /api/v1/ai/leave-forecast/

    Predicts future leave volumes based on historical data.
    Used by the dashboard to show trend information.
    """
    permission_classes = [IsAdminHR]

    def get(self, request):
        df = load_leave_data()
        return Response(analyze_leave_trends(df))


class LatePatternView(APIView):
    """
    GET /api/v1/ai/late-patterns/

    Detects employees with recurring late arrival patterns.
    Returns flagged employees sorted by risk score.
    """
    permission_classes = [IsAdminHR]

    def get(self, request):
        df = load_attendance_data()
        return Response(analyze_late_patterns(df))
