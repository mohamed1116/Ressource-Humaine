from django.contrib import admin
from .models import EvaluationPeriod, EvaluationCriterion, Evaluation, EvaluationScore


@admin.register(EvaluationPeriod)
class EvaluationPeriodAdmin(admin.ModelAdmin):
    list_display = ('name', 'period_type', 'start_date', 'end_date', 'is_active')
    list_filter = ('period_type', 'is_active')


@admin.register(EvaluationCriterion)
class EvaluationCriterionAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'category', 'max_score', 'weight', 'applies_to')
    list_filter = ('category', 'applies_to')


class EvaluationScoreInline(admin.TabularInline):
    model = EvaluationScore
    extra = 0


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ('employee', 'period', 'status', 'overall_score', 'overall_rating')
    list_filter = ('status', 'period')
    inlines = [EvaluationScoreInline]
