from django.urls import path
from . import views

app_name = 'attendance'

urlpatterns = [
    path('records/', views.AttendanceRecordListCreateView.as_view(), name='record-list'),
    path('records/<uuid:pk>/', views.AttendanceRecordDetailView.as_view(), name='record-detail'),
    path('check-in/', views.CheckInView.as_view(), name='check-in'),
    path('check-out/', views.CheckOutView.as_view(), name='check-out'),
    path('today/', views.TodayAttendanceView.as_view(), name='today'),
    path('justifications/', views.JustificationListCreateView.as_view(), name='justification-list'),
    path('justifications/<uuid:pk>/', views.JustificationDetailView.as_view(), name='justification-detail'),
    path('justifications/<uuid:pk>/review/', views.JustificationReviewView.as_view(), name='justification-review'),
]
