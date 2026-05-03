from django.contrib import admin
from .models import Prediction, Alert, Recommendation


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ('prediction_type', 'department', 'valid_until', 'created_at')
    list_filter = ('prediction_type',)


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'category', 'severity', 'is_active', 'created_at')
    list_filter = ('category', 'severity', 'is_active')


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'priority', 'status', 'created_at')
    list_filter = ('category', 'status')
