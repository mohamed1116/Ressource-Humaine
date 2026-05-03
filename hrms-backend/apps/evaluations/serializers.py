from rest_framework import serializers
from .models import EvaluationPeriod, EvaluationCriterion, Evaluation, EvaluationScore


class EvaluationPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationPeriod
        fields = '__all__'


class EvaluationCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationCriterion
        fields = '__all__'


class EvaluationScoreSerializer(serializers.ModelSerializer):
    criterion_name = serializers.CharField(source='criterion.name', read_only=True)
    criterion_category = serializers.CharField(source='criterion.category', read_only=True)
    criterion_weight = serializers.DecimalField(
        source='criterion.weight', max_digits=5, decimal_places=2, read_only=True,
    )

    class Meta:
        model = EvaluationScore
        fields = [
            'id', 'criterion', 'criterion_name', 'criterion_category',
            'criterion_weight', 'score', 'is_self_score', 'comment',
        ]


class EvaluationSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    period_name = serializers.CharField(source='period.name', read_only=True)
    evaluator_name = serializers.SerializerMethodField()
    scores = EvaluationScoreSerializer(many=True, read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            'id', 'employee', 'employee_name', 'period', 'period_name',
            'evaluator', 'evaluator_name', 'status',
            'overall_score', 'overall_rating',
            'self_comment', 'evaluator_comment', 'completed_at',
            'scores', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'overall_score', 'overall_rating', 'completed_at', 'created_at', 'updated_at']

    def get_employee_name(self, obj):
        return obj.employee.full_name

    def get_evaluator_name(self, obj):
        if obj.evaluator:
            return f'{obj.evaluator.first_name} {obj.evaluator.last_name}'
        return None


class SubmitScoresSerializer(serializers.Serializer):
    scores = serializers.ListField(
        child=serializers.DictField(), min_length=1,
    )
    comment = serializers.CharField(required=False, allow_blank=True, default='')
