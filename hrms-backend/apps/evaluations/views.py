from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminHR, IsAdminHROrDepartmentHead
from .models import EvaluationPeriod, EvaluationCriterion, Evaluation, EvaluationScore
from .serializers import (
    EvaluationPeriodSerializer,
    EvaluationCriterionSerializer,
    EvaluationSerializer,
    SubmitScoresSerializer,
)


class EvaluationPeriodListCreateView(generics.ListCreateAPIView):
    queryset = EvaluationPeriod.objects.all()
    serializer_class = EvaluationPeriodSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminHR()]
        return [IsAuthenticated()]


class EvaluationPeriodDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EvaluationPeriod.objects.all()
    serializer_class = EvaluationPeriodSerializer
    permission_classes = [IsAdminHR]


class CriterionListCreateView(generics.ListCreateAPIView):
    queryset = EvaluationCriterion.objects.all()
    serializer_class = EvaluationCriterionSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminHR()]
        return [IsAuthenticated()]


class CriterionDetailView(generics.RetrieveUpdateAPIView):
    queryset = EvaluationCriterion.objects.all()
    serializer_class = EvaluationCriterionSerializer
    permission_classes = [IsAdminHR]


class EvaluationListCreateView(generics.ListCreateAPIView):
    serializer_class = EvaluationSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminHROrDepartmentHead()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Evaluation.objects.select_related(
            'employee__user', 'period', 'evaluator',
        ).prefetch_related('scores__criterion')
        user = self.request.user
        if user.is_hr_admin:
            return qs
        if user.is_department_head:
            return qs.filter(employee__department__head__user=user)
        return qs.filter(employee__user=user)


class EvaluationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Evaluation.objects.select_related(
        'employee__user', 'period', 'evaluator',
    ).prefetch_related('scores__criterion')
    serializer_class = EvaluationSerializer
    permission_classes = [IsAuthenticated]


class SelfEvaluateView(APIView):
    """POST /evaluations/<uuid>/self-evaluate/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        serializer = SubmitScoresSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            evaluation = Evaluation.objects.get(pk=pk, employee__user=request.user)
        except Evaluation.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        for score_data in serializer.validated_data['scores']:
            EvaluationScore.objects.update_or_create(
                evaluation=evaluation,
                criterion_id=score_data['criterion_id'],
                is_self_score=True,
                defaults={
                    'score': score_data['score'],
                    'comment': score_data.get('comment', ''),
                },
            )

        evaluation.self_comment = serializer.validated_data['comment']
        evaluation.status = Evaluation.Status.SELF_EVALUATION
        evaluation.save()
        return Response(EvaluationSerializer(evaluation).data)


class SupervisorEvaluateView(APIView):
    """POST /evaluations/<uuid>/supervisor-evaluate/"""
    permission_classes = [IsAdminHROrDepartmentHead]

    def post(self, request, pk):
        serializer = SubmitScoresSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            evaluation = Evaluation.objects.get(pk=pk)
        except Evaluation.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        for score_data in serializer.validated_data['scores']:
            EvaluationScore.objects.update_or_create(
                evaluation=evaluation,
                criterion_id=score_data['criterion_id'],
                is_self_score=False,
                defaults={
                    'score': score_data['score'],
                    'comment': score_data.get('comment', ''),
                },
            )

        evaluation.evaluator = request.user
        evaluation.evaluator_comment = serializer.validated_data['comment']
        evaluation.status = Evaluation.Status.SUPERVISOR_REVIEW
        evaluation.save()
        return Response(EvaluationSerializer(evaluation).data)


class CompleteEvaluationView(APIView):
    """POST /evaluations/<uuid>/complete/"""
    permission_classes = [IsAdminHROrDepartmentHead]

    def post(self, request, pk):
        try:
            evaluation = Evaluation.objects.prefetch_related('scores__criterion').get(pk=pk)
        except Evaluation.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        score = evaluation.calculate_overall_score()
        evaluation.overall_score = score
        evaluation.overall_rating = evaluation.determine_rating(float(score))
        evaluation.status = Evaluation.Status.COMPLETED
        evaluation.completed_at = timezone.now()
        evaluation.save()
        return Response(EvaluationSerializer(evaluation).data)


class LaunchCampaignView(APIView):
    """
    POST /evaluations/campaign/
    Crée des évaluations pour tous les employés d'un département (ou tous)
    pour une période donnée.
    Body: { period_id, department_id (optional), role (optional) }
    """
    permission_classes = [IsAdminHR]

    def post(self, request):
        from apps.employees.models import Employee
        period_id   = request.data.get('period_id')
        dept_id     = request.data.get('department_id')
        role        = request.data.get('role')

        if not period_id:
            return Response({'detail': 'period_id requis.'}, status=400)
        try:
            period = EvaluationPeriod.objects.get(pk=period_id)
        except EvaluationPeriod.DoesNotExist:
            return Response({'detail': 'Période introuvable.'}, status=404)

        qs = Employee.objects.select_related('user').filter(user__is_active=True)
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        if role:
            qs = qs.filter(user__role=role)

        created, skipped = 0, 0
        for emp in qs:
            _, was_created = Evaluation.objects.get_or_create(
                employee=emp, period=period,
                defaults={'status': Evaluation.Status.DRAFT}
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        return Response({'created': created, 'skipped': skipped})


class EvaluationStatsView(APIView):
    """GET /evaluations/stats/"""
    permission_classes = [IsAdminHR]

    def get(self, request):
        from apps.employees.models import Department
        from django.db.models import Avg, Count

        period_id = request.query_params.get('period')
        qs = Evaluation.objects.all()
        if period_id:
            qs = qs.filter(period_id=period_id)

        by_status = qs.values('status').annotate(count=Count('id'))
        by_rating = qs.exclude(overall_rating='').values('overall_rating').annotate(count=Count('id'))
        by_dept   = qs.values(
            'employee__department__name', 'employee__department__code'
        ).annotate(count=Count('id'), avg_score=Avg('overall_score'))

        return Response({
            'total':     qs.count(),
            'completed': qs.filter(status='COMPLETED').count(),
            'avg_score': qs.filter(overall_score__isnull=False).aggregate(a=Avg('overall_score'))['a'],
            'by_status': list(by_status),
            'by_rating': list(by_rating),
            'by_dept':   list(by_dept),
        })
