from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import Department, Position, Employee, ProfessorProfile, StaffProfile, EmployeeDocument


class DepartmentSerializer(serializers.ModelSerializer):
    head_name = serializers.SerializerMethodField()
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'head', 'head_name', 'description', 'employee_count', 'created_at']

    def get_head_name(self, obj):
        if obj.head:
            return obj.head.full_name
        return None

    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = ['id', 'title', 'code', 'description', 'grade_level', 'created_at']


class ProfessorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessorProfile
        fields = ['specialization', 'research_area', 'academic_rank', 'publications_count', 'teaching_hours_per_week']


class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = ['service', 'office_number', 'work_schedule']


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeDocument
        fields = [
            'id', 'employee', 'document_type', 'title', 'file',
            'description', 'uploaded_by', 'uploaded_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at']

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return f'{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}'
        return None


class EmployeeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_id = serializers.UUIDField(source='department.id', read_only=True)
    position_title = serializers.CharField(source='position.title', read_only=True)
    specialization = serializers.SerializerMethodField()
    teaching_hours = serializers.SerializerMethodField()
    publications_count = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'numero_somme', 'full_name', 'email', 'phone_number',
            'employee_type', 'department_name', 'department_id', 'position_title',
            'hire_date', 'is_active', 'cin', 'date_of_birth', 'address',
            'emergency_contact_name', 'emergency_contact_phone',
            'specialization', 'teaching_hours', 'publications_count', 'can_sign',
        ]

    def get_full_name(self, obj):
        return obj.full_name

    def get_specialization(self, obj):
        if hasattr(obj, 'professor_profile'):
            return obj.professor_profile.specialization
        return None

    def get_teaching_hours(self, obj):
        if hasattr(obj, 'professor_profile'):
            return obj.professor_profile.teaching_hours_per_week
        return None

    def get_publications_count(self, obj):
        if hasattr(obj, 'professor_profile'):
            return obj.professor_profile.publications_count
        return None


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail/create/update."""
    user = UserSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.UUIDField(write_only=True)
    position = PositionSerializer(read_only=True)
    position_id = serializers.UUIDField(write_only=True)
    professor_profile = ProfessorProfileSerializer(required=False)
    staff_profile = StaffProfileSerializer(required=False)
    documents = EmployeeDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'employee_id', 'numero_somme', 'employee_type',
            'department', 'department_id', 'position', 'position_id',
            'cin', 'date_of_birth', 'gender', 'address', 'city',
            'emergency_contact_name', 'emergency_contact_phone',
            'hire_date', 'contract_type', 'is_active', 'termination_date',
            'professor_profile', 'staff_profile', 'documents', 'signature',
            'can_sign', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
