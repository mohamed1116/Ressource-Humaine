from rest_framework.permissions import BasePermission


class IsAdminHR(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN_HR'


class IsDepartmentHead(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'DEPARTMENT_HEAD'


class IsProfessor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'PROFESSOR'


class IsStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'STAFF'


class IsAdminHROrDepartmentHead(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('ADMIN_HR', 'DEPARTMENT_HEAD')


class IsOwnerOrAdminHR(BasePermission):
    """Object-level: the user is the object owner, or is Admin/HR."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN_HR':
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'employee'):
            return obj.employee.user == request.user
        return False
