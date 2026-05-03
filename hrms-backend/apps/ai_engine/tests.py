"""
Unit Tests — AI Engine Analytics
=================================
Tests for the three core analytics modules:
  - leave_analyzer   : Linear Regression forecast + seasonality detection
  - attendance_analyzer : Late pattern detection + risk scoring
  - recommender      : Recommendation generation from combined analysis
"""
import pandas as pd
import numpy as np
from datetime import date, timedelta
from django.test import TestCase

from .analytics.leave_analyzer import analyze_leave_trends
from .analytics.attendance_analyzer import analyze_late_patterns
from .analytics.recommender import generate_recommendations


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_leave_df(n_weeks=20):
    """
    Build a synthetic leave DataFrame with a clear seasonal pattern:
    months 7 and 8 (July/August) have 3x more leaves than other months.
    This lets us verify the model detects seasonality correctly.
    """
    rows = []
    base = date.today() - timedelta(weeks=n_weeks)
    leave_id = 1
    for w in range(n_weeks):
        week_start = base + timedelta(weeks=w)
        month = week_start.month
        count = 6 if month in (7, 8) else 2
        for _ in range(count):
            rows.append({
                'id': leave_id,
                'employee_id': str(leave_id % 5 + 1),
                'department_id': leave_id % 3 + 1,
                'department_name': f'Dept{leave_id % 3 + 1}',
                'leave_type_name': 'Annual',
                'leave_type_category': 'ANNUAL',
                'start_date': pd.Timestamp(week_start),
                'end_date': pd.Timestamp(week_start + timedelta(days=2)),
                'total_days': 3.0,
            })
            leave_id += 1
    return pd.DataFrame(rows)


def _make_attendance_df(late_ratio=0.5, n_days=40, employee_id='emp-1'):
    """
    Build a synthetic attendance DataFrame for one employee.
    late_ratio controls what fraction of days are late.
    """
    rows = []
    base = date.today() - timedelta(days=n_days)
    for i in range(n_days):
        day = base + timedelta(days=i)
        is_late = i < int(n_days * late_ratio)
        rows.append({
            'employee_id': employee_id,
            'employee_name': 'Test Employee',
            'department_id': 1,
            'department_name': 'Dept1',
            'date': pd.Timestamp(day),
            'is_late': is_late,
            'late_minutes': 35 if is_late else 0,
            'status': 'LATE' if is_late else 'PRESENT',
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Leave Analyzer Tests
# ---------------------------------------------------------------------------

class LeaveAnalyzerTests(TestCase):

    def test_returns_empty_result_on_empty_dataframe(self):
        result = analyze_leave_trends(pd.DataFrame())
        self.assertEqual(result['forecast'], [])
        self.assertEqual(result['department_concentration'], [])
        self.assertEqual(result['seasonal_pattern']['peak_months'], [])

    def test_forecast_returns_12_weeks(self):
        df = _make_leave_df(n_weeks=20)
        result = analyze_leave_trends(df)
        self.assertEqual(len(result['forecast']), 12)

    def test_forecast_values_are_non_negative(self):
        df = _make_leave_df(n_weeks=20)
        result = analyze_leave_trends(df)
        for week in result['forecast']:
            self.assertGreaterEqual(week['predicted_leaves'], 0)
            self.assertGreaterEqual(week['predicted_days'], 0)
            self.assertGreaterEqual(week['lower_bound'], 0)

    def test_forecast_confidence_interval_is_valid(self):
        """lower_bound must always be <= predicted <= upper_bound."""
        df = _make_leave_df(n_weeks=20)
        result = analyze_leave_trends(df)
        for week in result['forecast']:
            self.assertLessEqual(week['lower_bound'], week['predicted_leaves'])
            self.assertGreaterEqual(week['upper_bound'], week['predicted_leaves'])

    def test_seasonality_detects_peak_months(self):
        """July/August have 3x more leaves — must appear in peak_months."""
        df = _make_leave_df(n_weeks=52)
        result = analyze_leave_trends(df)
        peak = result['seasonal_pattern']['peak_months']
        # At least one summer month should be flagged
        summer = {'July', 'August'}
        self.assertTrue(
            summer & set(peak),
            f"Expected July or August in peak_months, got: {peak}"
        )

    def test_department_concentration_flags_outlier(self):
        """A department with massively more leaves than others must be flagged."""
        rows = []
        base = date.today() - timedelta(weeks=30)
        rid = 1
        # 5 departments with ~3 leaves each, dept 99 with 60 leaves (z_score >> 1.5)
        for dept_id, dept_name, count in [
            (1, 'Dept1', 3), (2, 'Dept2', 3), (3, 'Dept3', 3),
            (4, 'Dept4', 3), (5, 'Dept5', 3), (99, 'DeptHigh', 60),
        ]:
            for i in range(count):
                rows.append({
                    'id': rid,
                    'employee_id': f'emp-{rid}',
                    'department_id': dept_id,
                    'department_name': dept_name,
                    'leave_type_name': 'Annual',
                    'leave_type_category': 'ANNUAL',
                    'start_date': pd.Timestamp(base + timedelta(days=rid)),
                    'end_date': pd.Timestamp(base + timedelta(days=rid + 2)),
                    'total_days': 3.0,
                })
                rid += 1
        df = pd.DataFrame(rows)
        result = analyze_leave_trends(df)
        flagged = [d for d in result['department_concentration'] if d['alert']]
        self.assertTrue(len(flagged) > 0, "Expected at least one department to be flagged")


# ---------------------------------------------------------------------------
# Attendance Analyzer Tests
# ---------------------------------------------------------------------------

class AttendanceAnalyzerTests(TestCase):

    def test_returns_empty_on_empty_dataframe(self):
        result = analyze_late_patterns(pd.DataFrame())
        self.assertEqual(result['flagged_employees'], [])
        self.assertEqual(result['overall_stats']['total_employees_analyzed'], 0)

    def test_employee_with_50_percent_late_is_flagged(self):
        df = _make_attendance_df(late_ratio=0.5, n_days=40)
        result = analyze_late_patterns(df)
        self.assertTrue(len(result['flagged_employees']) > 0)

    def test_employee_with_low_late_ratio_not_flagged(self):
        """An employee late only 5% of the time should NOT be flagged."""
        df = _make_attendance_df(late_ratio=0.05, n_days=40)
        result = analyze_late_patterns(df)
        self.assertEqual(result['flagged_employees'], [])

    def test_critical_severity_above_40_percent(self):
        df = _make_attendance_df(late_ratio=0.45, n_days=40)
        result = analyze_late_patterns(df)
        flagged = result['flagged_employees']
        self.assertTrue(len(flagged) > 0)
        self.assertEqual(flagged[0]['severity'], 'critical')

    def test_risk_score_between_0_and_1(self):
        df = _make_attendance_df(late_ratio=0.5, n_days=40)
        result = analyze_late_patterns(df)
        for emp in result['flagged_employees']:
            self.assertGreaterEqual(emp['risk_score'], 0.0)
            self.assertLessEqual(emp['risk_score'], 1.0)

    def test_overall_stats_counts_are_correct(self):
        # Two employees: one critical, one clean
        df1 = _make_attendance_df(late_ratio=0.5, n_days=40, employee_id='emp-1')
        df2 = _make_attendance_df(late_ratio=0.02, n_days=40, employee_id='emp-2')
        df = pd.concat([df1, df2], ignore_index=True)
        result = analyze_late_patterns(df)
        self.assertEqual(result['overall_stats']['total_employees_analyzed'], 2)
        self.assertEqual(result['overall_stats']['chronic_late_count'], 1)


# ---------------------------------------------------------------------------
# Recommender Tests
# ---------------------------------------------------------------------------

class RecommenderTests(TestCase):

    def _base_leave_analysis(self):
        return {
            'forecast': [],
            'seasonal_pattern': {'peak_months': [], 'low_months': [], 'seasonality_strength': 0},
            'department_concentration': [],
        }

    def _base_attendance_analysis(self):
        return {'flagged_employees': [], 'overall_stats': {}}

    def test_returns_list(self):
        result = generate_recommendations(
            self._base_leave_analysis(),
            self._base_attendance_analysis(),
            pd.DataFrame(),
        )
        self.assertIsInstance(result, list)

    def test_generates_staffing_recommendation_for_peak_months(self):
        leave_analysis = self._base_leave_analysis()
        leave_analysis['seasonal_pattern']['peak_months'] = ['July', 'August']
        result = generate_recommendations(
            leave_analysis,
            self._base_attendance_analysis(),
            pd.DataFrame(),
        )
        categories = [r['category'] for r in result]
        self.assertIn('STAFFING', categories)

    def test_generates_wellbeing_recommendation_for_critical_employees(self):
        attendance_analysis = {
            'flagged_employees': [
                {'employee_name': 'Ali Hassan', 'severity': 'critical', 'trend': 'stable', 'risk_score': 0.9},
            ],
            'overall_stats': {},
        }
        result = generate_recommendations(
            self._base_leave_analysis(),
            attendance_analysis,
            pd.DataFrame(),
        )
        categories = [r['category'] for r in result]
        self.assertIn('WELLBEING', categories)

    def test_recommendations_sorted_by_priority_descending(self):
        leave_analysis = self._base_leave_analysis()
        leave_analysis['seasonal_pattern']['peak_months'] = ['July']
        leave_analysis['department_concentration'] = [{
            'department_id': '1',
            'department_name': 'Dept1',
            'leave_count': 30,
            'total_days': 90.0,
            'z_score': 2.5,
            'alert': True,
        }]
        result = generate_recommendations(
            leave_analysis,
            self._base_attendance_analysis(),
            pd.DataFrame(),
        )
        priorities = [r['priority'] for r in result]
        self.assertEqual(priorities, sorted(priorities, reverse=True))
