from django.urls import path
from . import views

app_name = 'evaluations'

urlpatterns = [
    path('periods/', views.EvaluationPeriodListCreateView.as_view(), name='period-list'),
    path('periods/<uuid:pk>/', views.EvaluationPeriodDetailView.as_view(), name='period-detail'),
    path('criteria/', views.CriterionListCreateView.as_view(), name='criterion-list'),
    path('criteria/<uuid:pk>/', views.CriterionDetailView.as_view(), name='criterion-detail'),
    path('', views.EvaluationListCreateView.as_view(), name='evaluation-list'),
    path('<uuid:pk>/', views.EvaluationDetailView.as_view(), name='evaluation-detail'),
    path('<uuid:pk>/self-evaluate/', views.SelfEvaluateView.as_view(), name='self-evaluate'),
    path('<uuid:pk>/supervisor-evaluate/', views.SupervisorEvaluateView.as_view(), name='supervisor-evaluate'),
    path('<uuid:pk>/complete/', views.CompleteEvaluationView.as_view(), name='complete'),
]
