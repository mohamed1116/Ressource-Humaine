# Custom DRF permission classes for role-based access control
# Usage: permission_classes = [IsAdminHR] or [IsSuperAdmin]
from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Only Super Admin can access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'SUPER_ADMIN'


class IsAdminHR(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('SUPER_ADMIN', 'ADMIN_HR')


class IsDepartmentHead(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'DEPARTMENT_HEAD'


class IsAdminHROrDepartmentHead(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('SUPER_ADMIN', 'ADMIN_HR', 'DEPARTMENT_HEAD')


class IsOwnerOrAdminHR(BasePermission):
    """Object-level: the user is the object owner, or is Admin/HR/SuperAdmin."""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ('SUPER_ADMIN', 'ADMIN_HR'):
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'employee'):
            return obj.employee.user == request.user
        return False
