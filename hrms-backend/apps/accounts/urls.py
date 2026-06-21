# URL routing for accounts and authentication
# Endpoints: login, logout, register, profile, password reset, user management
from django.urls import path
from . import views, superadmin_views, broadcast_views

app_name = 'accounts'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # User Management (Super Admin only)
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/create/', views.UserCreateView.as_view(), name='user-create'),
    path('users/bulk-import/', views.UserBulkImportView.as_view(), name='user-bulk-import'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/<uuid:pk>/reset-password/', views.UserPasswordResetView.as_view(), name='user-password-reset'),
    
    # Super Admin Dashboard & Advanced Features
    path('superadmin/dashboard/', superadmin_views.SuperAdminDashboardView.as_view(), name='superadmin-dashboard'),
    path('superadmin/user-activity/', superadmin_views.UserActivityView.as_view(), name='user-activity'),
    path('superadmin/broadcast-notification/', broadcast_views.BroadcastNotificationView.as_view(), name='broadcast-notification'),
]
