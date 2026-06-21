"""
Promotion Filters — Faculté Polydisciplinaire de Taroudant
Filters for promotions management endpoints.
"""
import django_filters
from .models import (
    PromotionRule,
    EmployeePromotionProfile,
    PromotionTableInstance,
    PromotionHistory,
)

class PromotionRuleFilter(django_filters.FilterSet):
    class Meta:
        model = PromotionRule
        fields = {
            'employee_type': ['exact'],
            'current_echelon': ['exact'],
            'next_echelon': ['exact'],
        }


class EmployeePromotionProfileFilter(django_filters.FilterSet):
    # الفلاتر المخصصة للحقول الديناميكية
    is_eligible_for_echelon = django_filters.BooleanFilter(method='filter_eligible_echelon')
    is_eligible_for_grade = django_filters.BooleanFilter(method='filter_eligible_grade')
    last_promotion_date = django_filters.DateFilter(method='filter_last_promotion_date')

    class Meta:
        model = EmployeePromotionProfile
        fields = {
            'employee': ['exact'],
        }

    def filter_eligible_echelon(self, queryset, name, value):
        if value is True:
            return queryset.filter(is_eligible_for_echelon=True)
        elif value is False:
            return queryset.filter(is_eligible_for_echelon=False)
        return queryset

    def filter_eligible_grade(self, queryset, name, value):
        if value is True:
            return queryset.filter(is_eligible_for_grade=True)
        elif value is False:
            return queryset.filter(is_eligible_for_grade=False)
        return queryset

    def filter_last_promotion_date(self, queryset, name, value):
        if value:
            return queryset.filter(last_promotion_date=value)
        return queryset


class PromotionTableInstanceFilter(django_filters.FilterSet):
    class Meta:
        model = PromotionTableInstance
        # ⚠️ حيدنا promotion_type و cadre_filter باش نضمنو الحقول لي كاينين فالموديل أصلاً
        fields = {
            'year': ['exact', 'gte', 'lte'],
            'status': ['exact'],
        }


class PromotionHistoryFilter(django_filters.FilterSet):
    class Meta:
        model = PromotionHistory
        fields = {
            'employee': ['exact'],
            'table_instance': ['exact'],
            'effective_date': ['exact', 'gte', 'lte'],
        }