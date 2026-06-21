import { useEffect, useState } from 'react';
import { getLeaveRequests } from '../../api/leaves.api';
import { getAttendanceRecords } from '../../api/attendance.api';
import { getEvaluations } from '../../api/performance.api';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalLeaves: 0,
    pendingLeaves: 0,
    totalAttendance: 0,
    lateCount: 0,
    totalEvaluations: 0,
    avgScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLeaveRequests({ page_size: '500' }).catch(() => ({ data: { results: [] } })),
      getAttendanceRecords({ page_size: '500' }).catch(() => ({ data: { results: [] } })),
      getEvaluations({ page_size: '500' }).catch(() => ({ data: { results: [] } })),
    ]).then(([leavesRes, attendanceRes, evalsRes]) => {
      const leaves: Record<string, unknown>[] = leavesRes.data.results || leavesRes.data || [];
      const attendance: Record<string, unknown>[] = attendanceRes.data.results || attendanceRes.data || [];
      const evals: Record<string, unknown>[] = evalsRes.data.results || evalsRes.data || [];

      const scores = evals.filter(e => e.overall_score).map(e => Number(e.overall_score));
      const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      setStats({
        totalLeaves: leaves.length,
        pendingLeaves: leaves.filter(l => l.status === 'PENDING').length,
        totalAttendance: attendance.length,
        lateCount: attendance.filter(a => a.status === 'LATE').length,
        totalEvaluations: evals.length,
        avgScore: Math.round(avgScore * 10) / 10,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement des rapports...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rapports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rapport Présences */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-3xl">⏰</span>
            <div>
              <h3 className="font-semibold text-gray-900">Rapport de présences</h3>
              <p className="text-sm text-gray-500 mt-1">Résumé des présences et retards</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Total pointages" value={stats.totalAttendance} color="blue" />
            <StatBox label="Retards" value={stats.lateCount} color="orange" />
          </div>
        </div>

        {/* Rapport Congés */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-3xl">📋</span>
            <div>
              <h3 className="font-semibold text-gray-900">Rapport des congés</h3>
              <p className="text-sm text-gray-500 mt-1">Utilisation et tendances des congés</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Total demandes" value={stats.totalLeaves} color="blue" />
            <StatBox label="En attente" value={stats.pendingLeaves} color="yellow" />
          </div>
        </div>

{/* Rapport Performance */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-3xl">📈</span>
            <div>
              <h3 className="font-semibold text-gray-900">Rapport de performance</h3>
              <p className="text-sm text-gray-500 mt-1">Scores et évaluations du personnel</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Évaluations" value={stats.totalEvaluations} color="blue" />
            <StatBox label="Score moyen" value={`${stats.avgScore}/10`} color="purple" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-lg p-3 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}
