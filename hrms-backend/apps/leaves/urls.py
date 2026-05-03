from django.urls import path
from . import views

app_name = 'leaves'

urlpatterns = [
    # Leave Types
    path('types/', views.LeaveTypeListCreateView.as_view(), name='type-list'),
    path('types/<uuid:pk>/', views.LeaveTypeDetailView.as_view(), name='type-detail'),
    # Leave Balances
    path('balances/', views.LeaveBalanceListView.as_view(), name='balance-list'),
    # Leave Requests
    path('requests/', views.LeaveRequestListCreateView.as_view(), name='request-list'),
    path('requests/<uuid:pk>/', views.LeaveRequestDetailView.as_view(), name='request-detail'),
    # Approval Actions
    path('requests/<uuid:pk>/approve-dept/', views.ApproveDeptView.as_view(), name='approve-dept'),
    path('requests/<uuid:pk>/approve-hr/', views.ApproveHRView.as_view(), name='approve-hr'),
    path('requests/<uuid:pk>/reject/', views.RejectLeaveView.as_view(), name='reject'),
]
