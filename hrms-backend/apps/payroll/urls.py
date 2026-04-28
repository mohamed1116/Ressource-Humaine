from django.urls import path
from . import views

app_name = 'payroll'

urlpatterns = [
    # Salary Structures
    path('structures/', views.SalaryStructureListCreateView.as_view(), name='structure-list'),
    path('structures/<uuid:pk>/', views.SalaryStructureDetailView.as_view(), name='structure-detail'),
    # Salary Components
    path('components/', views.SalaryComponentListCreateView.as_view(), name='component-list'),
    path('components/<uuid:pk>/', views.SalaryComponentDetailView.as_view(), name='component-detail'),
    # Employee Salaries
    path('employee-salaries/', views.EmployeeSalaryListCreateView.as_view(), name='emp-salary-list'),
    path('employee-salaries/<uuid:pk>/', views.EmployeeSalaryDetailView.as_view(), name='emp-salary-detail'),
    # Payslips
    path('payslips/', views.PayslipListView.as_view(), name='payslip-list'),
    path('payslips/generate/', views.GeneratePayslipView.as_view(), name='payslip-generate'),
    path('payslips/bulk-generate/', views.BulkGeneratePayslipView.as_view(), name='payslip-bulk-generate'),
    path('payslips/my-payslips/', views.MyPayslipsView.as_view(), name='my-payslips'),
    path('payslips/<uuid:pk>/', views.PayslipDetailView.as_view(), name='payslip-detail'),
    path('payslips/<uuid:pk>/confirm/', views.ConfirmPayslipView.as_view(), name='payslip-confirm'),
]
