from django.urls import path
from . import views

app_name = 'employees'

urlpatterns = [
    # Departments
    path('departments/', views.DepartmentListCreateView.as_view(), name='department-list'),
    path('departments/<uuid:pk>/', views.DepartmentDetailView.as_view(), name='department-detail'),
    path('departments/<uuid:pk>/employees/', views.DepartmentEmployeesView.as_view(), name='department-employees'),
    # Positions
    path('positions/', views.PositionListCreateView.as_view(), name='position-list'),
    path('positions/<uuid:pk>/', views.PositionDetailView.as_view(), name='position-detail'),
    # Employees
    path('', views.EmployeeListCreateView.as_view(), name='employee-list'),
    path('me/', views.MyEmployeeProfileView.as_view(), name='my-profile'),
    path('<uuid:pk>/', views.EmployeeDetailView.as_view(), name='employee-detail'),
    # Documents
    path('<uuid:emp_pk>/documents/', views.EmployeeDocumentListCreateView.as_view(), name='document-list'),
    path('<uuid:emp_pk>/documents/<uuid:pk>/', views.EmployeeDocumentDetailView.as_view(), name='document-detail'),
]
