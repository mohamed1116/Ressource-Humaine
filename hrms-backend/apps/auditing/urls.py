from django.urls import path
from . import views

app_name = 'auditing'

urlpatterns = [
    path('logs/', views.AuditLogListView.as_view(), name='log-list'),
]
