import { useEffect, useState } from 'react';
import { getLeaveForecast, getLatePatterns, getAlerts, getRecommendations } from '../../api/ai.api';

export default function AIInsightsPage() {
  const [leavePredictions, setLeavePredictions] = useState<Record<string, unknown> | null>(null);
  const [latePatterns, setLatePatterns] = useState<Record<string, unknown> | null>(null);
  const [alerts, setAlerts] = useState<Record<string, unknown> | null>(null);
  const [recommendations, setRecommendations] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLeaveForecast().then(res => setLeavePredictions(res.data)).catch(() => {}),
      getLatePatterns().then(res => setLatePatterns(res.data)).catch(() => {}),
      getAlerts().then(res => setAlerts(res.data)).catch(() => {}),
      getRecommendations().then(res => setRecommendations(res.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement des analyses IA...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analyses & Intelligence Artificielle</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Predictions */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Prévision des congés</h2>
          {leavePredictions?.forecast && (leavePredictions.forecast as Array<Record<string, unknown>>).length > 0 ? (
            <div className="space-y-2">
              {(leavePredictions.forecast as Array<Record<string, unknown>>).slice(0, 6).map((f, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">{f.week_start as string}</span>
                  <span className="font-medium">{f.predicted_leaves as number} congés</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Données historiques insuffisantes.</p>
          )}
        </div>

        {/* Late Arrival Patterns */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Retards récurrents</h2>
          {latePatterns?.flagged_employees && (latePatterns.flagged_employees as Array<Record<string, unknown>>).length > 0 ? (
            <div className="space-y-3">
              {(latePatterns.flagged_employees as Array<Record<string, unknown>>).slice(0, 5).map((emp, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium text-sm">{emp.employee_name as string}</p>
                    <p className="text-xs text-gray-500">{emp.department as string}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emp.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      emp.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {emp.severity as string}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Risque : {emp.risk_score as number}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucun comportement préoccupant détecté.</p>
          )}
        </div>

        {/* Department Alerts */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Alertes par département</h2>
          {alerts?.detected_alerts && (alerts.detected_alerts as Array<Record<string, unknown>>).length > 0 ? (
            <div className="space-y-3">
              {(alerts.detected_alerts as Array<Record<string, unknown>>).map((alert, i) => (
                <div key={i} className={`p-3 rounded-lg ${
                  alert.severity === 'CRITICAL' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <p className="font-medium text-sm">{alert.title as string}</p>
                  <p className="text-xs text-gray-600 mt-1">{alert.description as string}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucune alerte active.</p>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Recommandations</h2>
          {recommendations?.generated && (recommendations.generated as Array<Record<string, unknown>>).length > 0 ? (
            <div className="space-y-3">
              {(recommendations.generated as Array<Record<string, unknown>>).map((rec, i) => (
                <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-600 uppercase">{rec.category as string}</span>
                    <span className="text-xs text-gray-500">Priorité : {rec.priority as number}</span>
                  </div>
                  <p className="font-medium text-sm mt-1">{rec.title as string}</p>
                  <p className="text-xs text-gray-600 mt-1">{rec.description as string}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucune recommandation pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
