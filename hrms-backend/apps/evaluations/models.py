from django.db import models
from apps.core.models import TimeStampedModel


class EvaluationPeriod(TimeStampedModel):
    class PeriodType(models.TextChoices):
        ANNUAL = 'ANNUAL', 'Annual'
        SEMESTER = 'SEMESTER', 'Semester'

    name = models.CharField(max_length=200)
    period_type = models.CharField(max_length=10, choices=PeriodType.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'evaluation_periods'
        ordering = ['-start_date']

    def __str__(self):
        return self.name


class EvaluationCriterion(TimeStampedModel):
    """Evaluation criteria. Examples: Teaching Quality, Research Output, Punctuality."""
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=30, unique=True)
    description = models.TextField(blank=True)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=10.0)
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)
    applies_to = models.CharField(
        max_length=10,
        choices=[('ALL', 'All'), ('PROFESSOR', 'Professors'), ('STAFF', 'Staff')],
        default='ALL',
    )
    category = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'evaluation_criteria'
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.name} (weight: {self.weight})'


class Evaluation(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SELF_EVALUATION = 'SELF_EVALUATION', 'Self-Evaluation Submitted'
        SUPERVISOR_REVIEW = 'SUPERVISOR_REVIEW', 'Supervisor Review Submitted'
        COMPLETED = 'COMPLETED', 'Completed'

    employee = models.ForeignKey(
        'employees.Employee', on_delete=models.CASCADE, related_name='evaluations',
    )
    period = models.ForeignKey(
        EvaluationPeriod, on_delete=models.CASCADE, related_name='evaluations',
    )
    evaluator = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, related_name='conducted_evaluations',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    overall_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overall_rating = models.CharField(max_length=20, blank=True)
    self_comment = models.TextField(blank=True)
    evaluator_comment = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'evaluations'
        unique_together = ['employee', 'period']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.employee.full_name} - {self.period.name}'

    def calculate_overall_score(self):
        """Weighted average of all supervisor scores."""
        scores = self.scores.filter(is_self_score=False)
        total_weight = sum(s.criterion.weight for s in scores)
        if total_weight == 0:
            return 0
        weighted_sum = sum(s.score * s.criterion.weight for s in scores)
        return round(weighted_sum / total_weight, 2)

    def determine_rating(self, score):
        if score >= 9:
            return 'Excellent'
        elif score >= 7:
            return 'Tres Bien'
        elif score >= 5:
            return 'Bien'
        elif score >= 3:
            return 'Passable'
        return 'Insuffisant'


class EvaluationScore(TimeStampedModel):
    """Individual criterion score within an evaluation."""
    evaluation = models.ForeignKey(
        Evaluation, on_delete=models.CASCADE, related_name='scores',
    )
    criterion = models.ForeignKey(EvaluationCriterion, on_delete=models.CASCADE)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    is_self_score = models.BooleanField(default=False)
    comment = models.TextField(blank=True)

    class Meta:
        db_table = 'evaluation_scores'
        unique_together = ['evaluation', 'criterion', 'is_self_score']

    def __str__(self):
        prefix = 'Self' if self.is_self_score else 'Supervisor'
        return f'{prefix}: {self.criterion.name} = {self.score}'
