from django.contrib import admin
from .models import Alert, Recommendation


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'category', 'severity', 'is_active', 'created_at')
    list_filter = ('category', 'severity', 'is_active')


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'priority', 'status', 'created_at')
    list_filter = ('category', 'status')
