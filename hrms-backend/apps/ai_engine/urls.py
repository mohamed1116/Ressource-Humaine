"""
AI Engine API URLs
------------------
All endpoints are prefixed with /api/v1/ai/

These endpoints are consumed silently by the dashboard and employee
detail pages -- there is no dedicated AI page in the frontend.
"""
from django.urls import path
from . import views

app_name = 'ai_engine'

urlpatterns = [
    # Main dashboard summary (called on page load)
    path('dashboard/', views.AIDashboardView.as_view(), name='dashboard'),

    # Alerts
    path('alerts/', views.AlertListView.as_view(), name='alert-list'),
    path('alerts/<uuid:pk>/dismiss/', views.AlertDismissView.as_view(), name='alert-dismiss'),

    # Recommendations
    path('recommendations/', views.RecommendationListView.as_view(), name='recommendations'),

    # Per-employee intelligence (called from employee detail page)
    path('employee/<uuid:pk>/', views.EmployeeIntelligenceView.as_view(), name='employee-intelligence'),

    # Detailed analytics
    path('leave-forecast/', views.LeaveForecastView.as_view(), name='leave-forecast'),
    path('late-patterns/', views.LatePatternView.as_view(), name='late-patterns'),
]
