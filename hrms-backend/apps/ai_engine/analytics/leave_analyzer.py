"""Leave trend analysis and prediction using Linear Regression."""
import pandas as pd
import numpy as np
from datetime import date, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler


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
    """
    Predict leave volumes for the next 12 weeks using Linear Regression.

    Features used:
      - week index (trend over time)
      - month of year (seasonality: summer/winter peaks)
      - sin/cos encoding of month (cyclic feature so Dec and Jan are close)
    """
    df = df.copy()
    df['year_week'] = df['start_date'].dt.strftime('%Y-%W')
    weekly = df.groupby('year_week').agg(
        leave_count=('id', 'count'),
        total_days=('total_days', 'sum'),
        week_start=('start_date', 'min'),
    ).reset_index().sort_values('week_start').reset_index(drop=True)

    if len(weekly) < 4:
        return []

    # Build features
    weekly['week_index'] = np.arange(len(weekly))
    weekly['month'] = weekly['week_start'].dt.month
    # Cyclic encoding: sin/cos so that month 12 and month 1 are neighbors
    weekly['month_sin'] = np.sin(2 * np.pi * weekly['month'] / 12)
    weekly['month_cos'] = np.cos(2 * np.pi * weekly['month'] / 12)

    features = ['week_index', 'month_sin', 'month_cos']
    X = weekly[features].values
    y_count = weekly['leave_count'].values
    y_days = weekly['total_days'].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model_count = LinearRegression().fit(X_scaled, y_count)
    model_days = LinearRegression().fit(X_scaled, y_days)

    # Compute residual std for confidence interval
    residuals_count = y_count - model_count.predict(X_scaled)
    residual_std = float(np.std(residuals_count))

    # Forecast next 12 weeks
    forecast = []
    today = date.today()
    last_week_index = int(weekly['week_index'].iloc[-1])

    for i in range(1, 13):
        week_start = today + timedelta(weeks=i)
        month = week_start.month
        month_sin = np.sin(2 * np.pi * month / 12)
        month_cos = np.cos(2 * np.pi * month / 12)
        week_index = last_week_index + i

        X_future = scaler.transform([[week_index, month_sin, month_cos]])
        predicted_count = float(model_count.predict(X_future)[0])
        predicted_days = float(model_days.predict(X_future)[0])

        # Clamp negatives to 0
        predicted_count = max(0.0, predicted_count)
        predicted_days = max(0.0, predicted_days)

        forecast.append({
            'week_start': week_start.isoformat(),
            'predicted_leaves': round(predicted_count, 1),
            'predicted_days': round(predicted_days, 1),
            'lower_bound': round(max(0.0, predicted_count - residual_std), 1),
            'upper_bound': round(predicted_count + residual_std, 1),
        })

    return forecast


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
