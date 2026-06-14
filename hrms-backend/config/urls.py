from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/employees/', include('apps.employees.urls')),
    path('api/v1/leaves/', include('apps.leaves.urls')),
    path('api/v1/attendance/', include('apps.attendance.urls')),
    path('api/v1/evaluations/', include('apps.evaluations.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/ai/', include('apps.ai_engine.urls')),
    path('api/v1/certificates/', include('apps.certificates.urls')),
    path('api/v1/audit/', include('apps.auditing.urls')),
    path('api/v1/requests/', include('apps.requests.urls')),
    path('api/v1/messaging/', include('apps.messaging.urls')),
    path('api/v1/promotions/', include('apps.promotions.urls')),
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
