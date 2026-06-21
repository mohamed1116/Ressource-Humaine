from datetime import date
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminHR, IsAdminHROrDepartmentHead
from .models import AttendanceRecord, AbsenceJustification
from .serializers import (
    AttendanceRecordSerializer,
    AbsenceJustificationSerializer,
    CheckInOutSerializer,
)


class AttendanceRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceRecordSerializer
    filterset_fields = ['employee', 'date', 'status', 'is_late']
    search_fields = ['employee__user__first_name', 'employee__user__last_name']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminHR()]
        return [IsAdminHROrDepartmentHead()]

    def get_queryset(self):
        qs = AttendanceRecord.objects.select_related('employee__user', 'employee__department')
        user = self.request.user
        if user.is_department_head:
            return qs.filter(employee__department__head__user=user)
        return qs


class AttendanceRecordDetailView(generics.RetrieveUpdateAPIView):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAdminHR]


class CheckInView(APIView):
    """POST /attendance/check-in/ -- Employee self check-in."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckInOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        employee = request.user.employee
        today = date.today()
        check_in_time = serializer.validated_data.get('timestamp', timezone.localtime().time())

        record, created = AttendanceRecord.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={
                'check_in': check_in_time,
                'status': AttendanceRecord.Status.PRESENT,
                'recorded_by': request.user,
            },
        )
        if not created and record.check_in:
            return Response(
                {'detail': 'Already checked in today.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not created:
            record.check_in = check_in_time
            record.recorded_by = request.user
            record.save()

        return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_200_OK)


class CheckOutView(APIView):
    """POST /attendance/check-out/ -- Employee self check-out."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckInOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        employee = request.user.employee
        today = date.today()
        check_out_time = serializer.validated_data.get('timestamp', timezone.localtime().time())

        try:
            record = AttendanceRecord.objects.get(employee=employee, date=today)
        except AttendanceRecord.DoesNotExist:
            return Response(
                {'detail': 'No check-in record found for today.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        record.check_out = check_out_time
        record.save()
        return Response(AttendanceRecordSerializer(record).data)


class TodayAttendanceView(APIView):
    """GET /attendance/today/ -- My attendance status today."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            record = AttendanceRecord.objects.get(
                employee__user=request.user, date=date.today(),
            )
            return Response(AttendanceRecordSerializer(record).data)
        except AttendanceRecord.DoesNotExist:
            return Response({'detail': 'No attendance record for today.'}, status=status.HTTP_404_NOT_FOUND)


class JustificationListCreateView(generics.ListCreateAPIView):
    serializer_class = AbsenceJustificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AbsenceJustification.objects.select_related('attendance_record__employee__user')
        if self.request.user.is_hr_admin:
            return qs
        return qs.filter(attendance_record__employee__user=self.request.user)


class JustificationDetailView(generics.RetrieveAPIView):
    queryset = AbsenceJustification.objects.all()
    serializer_class = AbsenceJustificationSerializer
    permission_classes = [IsAuthenticated]


class JustificationReviewView(APIView):
    """POST /attendance/justifications/<uuid>/review/"""
    permission_classes = [IsAdminHROrDepartmentHead]

    def post(self, request, pk):
        try:
            justification = AbsenceJustification.objects.get(pk=pk)
        except AbsenceJustification.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'accept' or 'reject'
        if action not in ('accept', 'reject'):
            return Response({'detail': 'action must be accept or reject.'}, status=status.HTTP_400_BAD_REQUEST)

        justification.status = 'ACCEPTED' if action == 'accept' else 'REJECTED'
        justification.reviewed_by = request.user
        justification.reviewed_at = timezone.now()
        justification.review_comment = request.data.get('comment', '')
        justification.save()
        return Response(AbsenceJustificationSerializer(justification).data)
