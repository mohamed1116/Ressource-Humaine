"""
URL configuration for the Document Template System.
All endpoints are prefixed with /api/v1/certificates/ by the root URL config.
"""
from django.urls import path
from . import views

app_name = 'certificates'

urlpatterns = [
    # ── Templates (admin manages, users read) ──
    path('templates/', views.TemplateListCreateView.as_view(), name='template-list'),
    path('templates/<uuid:pk>/', views.TemplateDetailView.as_view(), name='template-detail'),
    path('templates/<uuid:pk>/preview/', views.TemplatePreviewView.as_view(), name='template-preview'),

    # ── Document Requests ──
    path('requests/', views.DocumentRequestListView.as_view(), name='request-list'),
    path('requests/create/', views.DocumentRequestCreateView.as_view(), name='request-create'),
    path('requests/free/', views.FreeRequestCreateView.as_view(), name='request-free'),
    path('requests/<uuid:pk>/', views.DocumentRequestDetailView.as_view(), name='request-detail'),
    path('requests/<uuid:pk>/review/', views.DocumentReviewView.as_view(), name='request-review'),
    path('requests/<uuid:pk>/sign/', views.SubmitSignedDocumentView.as_view(), name='request-sign'),
    path('requests/<uuid:pk>/preview/', views.DocumentPreviewView.as_view(), name='request-preview'),
    path('requests/<uuid:pk>/generate/', views.DocumentGenerateView.as_view(), name='request-generate'),
    path('requests/<uuid:pk>/download/', views.DocumentDownloadView.as_view(), name='request-download'),
    path('requests/<uuid:pk>/download-signed/', views.SignedDocumentDownloadView.as_view(), name='request-download-signed'),

    # ── Missions ──
    path('missions/', views.MissionListCreateView.as_view(), name='mission-list'),
    path('missions/<uuid:pk>/', views.MissionDetailView.as_view(), name='mission-detail'),
    path('missions/<uuid:pk>/approve/', views.MissionApproveView.as_view(), name='mission-approve'),

    # ── Signatures & Stamps ──
    path('signatures/', views.SignatureStampListCreateView.as_view(), name='signature-list'),
    path('signatures/<uuid:pk>/', views.SignatureStampDetailView.as_view(), name='signature-detail'),

    # ── Stats ──
    path('stats/', views.DocumentStatsView.as_view(), name='stats'),
]
