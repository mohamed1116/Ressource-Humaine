import uuid
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as JWTTokenRefreshView

from .models import PasswordResetToken
from .permissions import IsAdminHR
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ -- Admin-only user creation."""
    serializer_class = RegisterSerializer
    permission_classes = [IsAdminHR]


class LoginView(APIView):
    """POST /api/v1/auth/login/ -- Returns access + refresh tokens."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {'detail': 'Account is disabled.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ -- Blacklists the refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class TokenRefreshView(JWTTokenRefreshView):
    """POST /api/v1/auth/token/refresh/"""
    pass


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/auth/profile/ -- Current user's own profile."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """PUT /api/v1/auth/change-password/"""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'detail': 'Old password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password changed successfully.'})


class PasswordResetRequestView(APIView):
    """POST /api/v1/auth/password-reset/ -- Sends email with reset token."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            token = str(uuid.uuid4())
            PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(hours=24),
            )
            # In production, send email with token
            # send_mail(subject, message_with_token, from_email, [user.email])
        except User.DoesNotExist:
            pass  # Don't reveal whether email exists

        return Response({'detail': 'If the email exists, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    """POST /api/v1/auth/password-reset/confirm/ -- Validates token, sets new password."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reset_token = PasswordResetToken.objects.get(
                token=serializer.validated_data['token'],
                is_used=False,
                expires_at__gt=timezone.now(),
            )
        except PasswordResetToken.DoesNotExist:
            return Response(
                {'detail': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = reset_token.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        reset_token.is_used = True
        reset_token.save()

        return Response({'detail': 'Password has been reset successfully.'})


class UserListView(generics.ListAPIView):
    """GET /api/v1/auth/users/ -- Admin-only user listing."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminHR]
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['created_at', 'first_name', 'last_name']


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/v1/auth/users/<uuid>/ -- Admin-only user management."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminHR]
