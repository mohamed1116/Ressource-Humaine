"""
Promotion URLs — Faculté Polydisciplinaire de Taroudant
URL routing for promotion management API endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PromotionRuleViewSet,
    EmployeePromotionProfileViewSet,
    PromotionTableInstanceViewSet,
    PromotionHistoryViewSet,
    PromotionDocumentViewSet,  # ✨ زدت هادي هنا ف الـ Imports
    PromotionStatsView,
)

app_name = 'promotions'

# Create router and register viewsets
router = DefaultRouter()
router.register(r'rules', PromotionRuleViewSet, basename='rule')
router.register(r'profiles', EmployeePromotionProfileViewSet, basename='profile')
router.register(r'tables', PromotionTableInstanceViewSet, basename='table')
router.register(r'history', PromotionHistoryViewSet, basename='history')
router.register(r'documents', PromotionDocumentViewSet, basename='document')  # ✨ وزدت هاد السطر باش يتسجل الرابط تلقائياً

urlpatterns = [
    # Stats endpoint
    path('stats/', PromotionStatsView.as_view(), name='stats'),
    
    # All viewset routes
    path('', include(router.urls)),
]



# ─────────────────────────────────────────────────────────────
# 🛡️ تمديد عمر الـ Token لمنع تكرار 401 Unauthorized ف الـ Terminal
# ─────────────────────────────────────────────────────────────
from django.conf import settings
from datetime import timedelta

if not hasattr(settings, 'SIMPLE_JWT'):
    settings.SIMPLE_JWT = {}

settings.SIMPLE_JWT.update({
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),   # الـ Token غيبقى عايش ساعة كاملة
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # الـ Refresh يبقى صالح لـ 7 أيام
    'ROTATE_REFRESH_TOKENS': False,                  # حبس التدوير باش ما يوقعش ارتباك ف الـ Frontend
    'BLACKLIST_AFTER_ROTATION': False,
})