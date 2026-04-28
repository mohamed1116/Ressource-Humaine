"""Leave trend analysis and prediction."""
import pandas as pd
import numpy as np
from datetime import date, timedelta


def analyze_leave_trends(df):
    """
    Analyze leave patterns from historical data.

    Returns:
        dict with forecast, seasonal_pattern, department_concentration
    """
    if df.empty:
        return _empty_result()

    result = {
        'forecast': _generate_forecast(df),
        'seasonal_pattern': _detect_seasonality(df),
        'department_concentration': _detect_department_concentration(df),
    }
    return result


def _generate_forecast(df):
    """Predict leave volumes for the next 12 weeks."""
    # Aggregate by week
    df['week'] = df['start_date'].dt.isocalendar().week
    df['year_week'] = df['start_date'].dt.strftime('%Y-%W')
    weekly = df.groupby('year_week').agg(
        leave_count=('id', 'count'),
        total_days=('total_days', 'sum'),
    ).reset_index()

    if len(weekly) < 4:
        return []

    # Simple moving average forecast
    window = min(4, len(weekly))
    avg_count = weekly['leave_count'].rolling(window=window).mean().iloc[-1]
    avg_days = weekly['total_days'].rolling(window=window).mean().iloc[-1]

    forecast = []
    today = date.today()
    for i in range(1, 13):
        week_start = today + timedelta(weeks=i)
        # Add slight seasonal variation based on historical month patterns
        month = week_start.month
        month_factor = _get_month_factor(df, month)

        forecast.append({
            'week_start': week_start.isoformat(),
            'predicted_leaves': round(float(avg_count * month_factor), 1),
            'predicted_days': round(float(avg_days * month_factor), 1),
            'lower_bound': round(float(avg_count * month_factor * 0.7), 1),
            'upper_bound': round(float(avg_count * month_factor * 1.3), 1),
        })

    return forecast


def _get_month_factor(df, month):
    """Get a seasonal factor for a given month based on historical data."""
    df['month'] = df['start_date'].dt.month
    monthly_counts = df.groupby('month')['id'].count()
    overall_avg = monthly_counts.mean()
    if overall_avg == 0:
        return 1.0
    month_avg = monthly_counts.get(month, overall_avg)
    return float(month_avg / overall_avg)


def _detect_seasonality(df):
    """Identify peak and low leave months."""
    df['month'] = df['start_date'].dt.month
    monthly = df.groupby('month')['id'].count()

    if monthly.empty:
        return {'peak_months': [], 'low_months': [], 'seasonality_strength': 0}

    mean_val = monthly.mean()
    std_val = monthly.std()

    if std_val == 0:
        return {'peak_months': [], 'low_months': [], 'seasonality_strength': 0}

    month_names = {
        1: 'January', 2: 'February', 3: 'March', 4: 'April',
        5: 'May', 6: 'June', 7: 'July', 8: 'August',
        9: 'September', 10: 'October', 11: 'November', 12: 'December',
    }

    peak_months = [month_names[m] for m in monthly[monthly > mean_val + 0.5 * std_val].index]
    low_months = [month_names[m] for m in monthly[monthly < mean_val - 0.5 * std_val].index]
    seasonality_strength = round(float(std_val / mean_val), 2) if mean_val > 0 else 0

    return {
        'peak_months': peak_months,
        'low_months': low_months,
        'seasonality_strength': min(seasonality_strength, 1.0),
    }


def _detect_department_concentration(df):
    """Flag departments with abnormal leave rates."""
    dept_stats = df.groupby(['department_id', 'department_name']).agg(
        leave_count=('id', 'count'),
        total_days=('total_days', 'sum'),
    ).reset_index()

    if dept_stats.empty:
        return []

    mean_rate = dept_stats['leave_count'].mean()
    std_rate = dept_stats['leave_count'].std()

    results = []
    for _, row in dept_stats.iterrows():
        z_score = (row['leave_count'] - mean_rate) / std_rate if std_rate > 0 else 0
        results.append({
            'department_id': str(row['department_id']),
            'department_name': row['department_name'],
            'leave_count': int(row['leave_count']),
            'total_days': float(row['total_days']),
            'z_score': round(float(z_score), 2),
            'alert': bool(z_score > 1.5),
        })

    return sorted(results, key=lambda x: x['z_score'], reverse=True)


def _empty_result():
    return {
        'forecast': [],
        'seasonal_pattern': {'peak_months': [], 'low_months': [], 'seasonality_strength': 0},
        'department_concentration': [],
    }
