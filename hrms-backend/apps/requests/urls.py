"""
Unified Request API URLs
========================
All prefixed with /api/v1/requests/ by the root URL config.
"""
from django.urls import path
from . import views

app_name = 'requests'

urlpatterns = [
    # User: all my requests (certificates + leaves + missions merged)
    path('mine/', views.MyRequestsView.as_view(), name='my-requests'),

    # HR: all requests from all users
    path('all/', views.AllRequestsView.as_view(), name='all-requests'),

    # HR: approve or reject any request type
    path('review/', views.UnifiedReviewView.as_view(), name='review'),

    # HR: dashboard statistics
    path('stats/', views.RequestStatsView.as_view(), name='stats'),
]
