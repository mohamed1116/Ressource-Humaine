import { useEffect, useState } from 'react';
import { getEvaluations } from '../../api/performance.api';

export default function EvaluationListPage() {
  const [evaluations, setEvaluations] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvaluations()
      .then(res => setEvaluations(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ratingColors: Record<string, string> = {
    Excellent: 'bg-green-100 text-green-700',
    'Tres Bien': 'bg-blue-100 text-blue-700',
    Bien: 'bg-yellow-100 text-yellow-700',
    Passable: 'bg-orange-100 text-orange-700',
    Insuffisant: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Performance Evaluations</h1>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Employee</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Period</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Score</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {evaluations.map((ev) => (
                <tr key={ev.id as string} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{ev.employee_name as string}</td>
                  <td className="px-6 py-4">{ev.period_name as string}</td>
                  <td className="px-6 py-4">{ev.status as string}</td>
                  <td className="px-6 py-4">{ev.overall_score ? `${ev.overall_score}/10` : '-'}</td>
                  <td className="px-6 py-4">
                    {ev.overall_rating && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ratingColors[ev.overall_rating as string] || ''}`}>
                        {ev.overall_rating as string}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {evaluations.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No evaluations found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
