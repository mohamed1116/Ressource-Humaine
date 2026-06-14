import { useEffect, useState } from 'react';
import { getAttendanceRecords, checkIn, checkOut } from '../../api/attendance.api';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

const statusCfg: Record<string, { label: string; cls: string }> = {
  PRESENT:  { label: 'Présent',       cls: 'bg-green-50 text-green-700 border-green-200' },
  ABSENT:   { label: 'Absent',        cls: 'bg-red-50 text-red-700 border-red-200' },
  ON_LEAVE: { label: 'En congé',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  LATE:     { label: 'En retard',     cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  HALF_DAY: { label: 'Demi-journée',  cls: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export default function DailyAttendancePage() {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'in' | 'out' | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayFr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const fetchRecords = () => {
    setLoading(true);
    getAttendanceRecords({ date: today })
      .then(res => setRecords(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecords(); }, [today]);

  const handleAction = async (action: 'in' | 'out') => {
    setActionLoading(action);
    setMessage(null);
    try {
      if (action === 'in') await checkIn();
      else await checkOut();
      setMessage({ text: action === 'in' ? 'Pointage d\'entrée enregistré.' : 'Pointage de sortie enregistré.', type: 'success' });
      fetchRecords();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setMessage({ text: e.response?.data?.detail || 'Erreur lors du pointage.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const myRecord = records.find(r => (r.employee_user_id as string) === user?.id?.toString()
    || (r.employee_name as string)?.toLowerCase().includes((user?.first_name || '').toLowerCase())) as
    { check_in: string | null; check_out: string | null; work_hours: string | null; status: string } | undefined;

  const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentCount = records.filter(r => r.status === 'ABSENT').length;
  const leaveCount = records.filter(r => r.status === 'ON_LEAVE').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Présences du jour</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{todayFr}</p>
        </div>
        {['PROFESSOR', 'STAFF'].includes(user?.role || '') && (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction('in')}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === 'in' ? '...' : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>Entrée</>
              )}
            </button>
            <button
              onClick={() => handleAction('out')}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === 'out' ? '...' : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 8l4 4m0 0l-4 4m4-4H3" /></svg>Sortie</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Message feedback */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Mon statut du jour */}
      {myRecord && (
        <div className="mb-5 bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Mon pointage aujourd'hui</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              {myRecord.check_in && <span>Entrée : <strong>{myRecord.check_in.slice(11, 16)}</strong></span>}
              {myRecord.check_out && <span>Sortie : <strong>{myRecord.check_out.slice(11, 16)}</strong></span>}
              {myRecord.work_hours && <span>Durée : <strong>{myRecord.work_hours}h</strong></span>}
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-medium border ${statusCfg[myRecord.status]?.cls || ''}`}>
            {statusCfg[myRecord.status]?.label || myRecord.status}
          </span>
        </div>
      )}

      {/* Statistiques (admin seulement) */}
      {isAdmin && records.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <StatBox label="Présents" value={presentCount} color="green" />
          <StatBox label="Absents" value={absentCount} color="red" />
          <StatBox label="En congé" value={leaveCount} color="blue" />
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucun enregistrement de présence pour aujourd'hui.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Département</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Entrée</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Sortie</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Retard</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Heures</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const st = statusCfg[r.status as string] || { label: r.status as string, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
                return (
                  <tr key={r.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-800">{r.employee_name as string}</td>
                    <td className="px-5 py-3 text-gray-600">{r.department_name as string}</td>
                    <td className="px-5 py-3 text-gray-600">{(r.check_in as string)?.slice(11, 16) || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{(r.check_out as string)?.slice(11, 16) || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{r.is_late ? `${r.late_minutes as number} min` : '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{r.work_hours ? `${r.work_hours as string}h` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}
