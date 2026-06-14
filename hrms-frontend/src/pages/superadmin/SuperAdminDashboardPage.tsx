import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSuperAdminDashboard, getUserActivity } from '../../api/superadmin.api';

type D = Record<string, any>;

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#6366f1', ADMIN_HR: '#0ea5e9',
  DEPARTMENT_HEAD: '#f59e0b', PROFESSOR: '#10b981',
  STAFF: '#8b5cf6', STUDENT: '#f43f5e',
};

function getRoleLabel(role: string) {
  return ({ SUPER_ADMIN: 'Super Admin', ADMIN_HR: 'Admin RH', DEPARTMENT_HEAD: 'Chef Dép.',
    PROFESSOR: 'Enseignant', STAFF: 'Administratif', STUDENT: 'Étudiant' } as Record<string,string>)[role] || role;
}

/* ── Mini Calendar ── */
function MiniCalendar() {
  const today = new Date();
  const [cur, setCur] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const y = cur.getFullYear(), m = cur.getMonth();
  const dim = new Date(y, m + 1, 0).getDate();
  const fd = new Date(y, m, 1).getDay();
  const offset = fd === 0 ? 6 : fd - 1;
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const DAYS = ['L','M','M','J','V','S','D'];
  const cells = Array.from({ length: offset + dim }, (_, i) => i < offset ? null : i - offset + 1);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCur(new Date(y, m - 1, 1))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400">‹</button>
        <p className="text-xs font-semibold text-gray-700">{MONTHS[m]} {y}</p>
        <button onClick={() => setCur(new Date(y, m + 1, 1))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => <div key={i} className="text-center text-[10px] font-medium text-gray-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday = day === today.getDate() && m === today.getMonth() && y === today.getFullYear();
          const isWeekend = ((i) % 7) >= 5;
          return (
            <div key={i} className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full text-[11px] font-medium cursor-default
              ${isToday ? 'bg-[#0f172a] text-white' : isWeekend ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Donut Chart ── */
function DonutChart({ slices, total }: { slices: { label: string; value: number; color: string }[]; total: number }) {
  const size = 130; const r = 48; const cx = 65; const cy = 65; const sw = 18;
  let deg = -90;
  const arcs = slices.map(s => {
    const pct = total ? (s.value / total) * 359.99 : 0;
    const start = deg; deg += pct;
    return { ...s, start, pct };
  });
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arc = (s: number, p: number) => {
    const x1 = cx + r * Math.cos(toRad(s)), y1 = cy + r * Math.sin(toRad(s));
    const x2 = cx + r * Math.cos(toRad(s + p)), y2 = cy + r * Math.sin(toRad(s + p));
    return `M ${x1} ${y1} A ${r} ${r} 0 ${p > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="flex-shrink-0">
        {arcs.map((a, i) => a.pct > 0 && (
          <path key={i} d={arc(a.start, a.pct)} fill="none" stroke={a.color} strokeWidth={sw} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="800" fill="#111">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#999">total</text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
              <span className="text-xs text-gray-600 truncate">{a.label}</span>
            </div>
            <span className="text-xs font-bold text-gray-800">{a.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ title, value, sub, color }: { title: string; value: string | number; sub?: string; color: 'blue' | 'green' | 'amber' | 'red' | 'purple' }) {
  const c = {
    blue:   'border-t-blue-500',
    green:  'border-t-emerald-500',
    amber:  'border-t-amber-500',
    red:    'border-t-red-500',
    purple: 'border-t-purple-500',
  }[color];
  const val = 'text-gray-900';
  return (
    <div className={`bg-white border border-gray-200 border-t-4 ${c} rounded-lg p-4 shadow-sm`}>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{title}</p>
      <p className={`text-3xl font-extrabold mt-1 leading-none ${val}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ── Workflow Card ── */
function WorkflowCard({ title, count, emoji, link, linkLabel }: {
  title: string; count: number; emoji: string; link: string; linkLabel: string;
}) {
  const zero = count === 0;
  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm flex items-center gap-3 ${zero ? 'border-gray-200' : count > 3 ? 'border-red-200' : 'border-amber-200'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${zero ? 'bg-gray-50' : count > 3 ? 'bg-red-50' : 'bg-amber-50'}`}>
        {zero ? '✅' : emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-600 truncate">{title}</p>
        <p className={`text-2xl font-extrabold leading-tight ${zero ? 'text-gray-300' : count > 3 ? 'text-red-600' : 'text-amber-600'}`}>{count}</p>
      </div>
      <Link to={link} className="px-2.5 py-1.5 text-xs font-medium text-[#0f172a] border border-gray-200 rounded-lg hover:bg-gray-50 flex-shrink-0 transition-colors">
        {linkLabel}
      </Link>
    </div>
  );
}

/* ── Shortcut ── */
function Shortcut({ to, label, emoji }: { to: string; label: string; emoji: string }) {
  return (
    <Link to={to} className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-2.5">
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<D | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSuperAdminDashboard(), getUserActivity()])
      .then(([d, a]) => { setData(d.data); setActivity(a.data.activity || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-80">
      <div className="animate-spin h-7 w-7 border-4 border-gray-200 border-t-[#0f172a] rounded-full mx-auto" />
    </div>
  );

  if (!data) return null;

  const byRole = data.users?.by_role || {};
  const donutSlices = Object.entries(byRole).map(([role, count]) => ({
    label: getRoleLabel(role), value: count as number, color: ROLE_COLORS[role] || '#94a3b8',
  }));
  const depts: { name: string; staff_count: number }[] = data.departments || [];
  const maxDept = Math.max(...depts.map(d => d.staff_count), 1);
  const totalEmp = data.employees?.total || 0;
  const permanent = data.employees?.permanent || 0;
  const vacataires = data.employees?.vacataires || 0;
  const absenceRate = data.attendance?.absence_rate_week || 0;
  const students = byRole['STUDENT'] || 0;

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tableau de Bord</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2 bg-[#0f172a] text-white text-xs px-3 py-1.5 rounded-lg font-medium">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          Super Admin
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Personnel Actif" value={totalEmp} sub={`${permanent} permanent · ${vacataires} vacataires`} color="blue" />
        <KpiCard title="Ratio ETP" value={`${totalEmp ? Math.round(permanent / totalEmp * 100) : 0}%`} sub={`${permanent} titulaires / ${totalEmp}`} color="green" />
        <KpiCard title="Étudiants" value={students} sub={students <= 1 ? '⚠️ Vérifier les inscriptions' : 'Inscrits sur le portail'} color={students <= 1 ? 'red' : 'purple'} />
        <KpiCard title="Absence (7j)" value={`${absenceRate}%`} sub="Taux d'absence hebdomadaire" color={absenceRate > 5 ? 'red' : absenceRate > 2 ? 'amber' : 'green'} />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Donut */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Répartition des rôles</h3>
            <Link to="/users" className="text-xs text-blue-600 hover:underline">Gérer →</Link>
          </div>
          <DonutChart slices={donutSlices} total={data.users?.total || 0} />
        </div>

        {/* Dept bars */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Effectifs par département</h3>
            <Link to="/departements" className="text-xs text-blue-600 hover:underline">Voir →</Link>
          </div>
          <div className="space-y-3">
            {depts.length === 0
              ? <p className="text-xs text-gray-400 text-center py-4">Aucun département</p>
              : depts.map(d => {
                const pct = Math.round((d.staff_count / maxDept) * 100);
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 truncate max-w-[140px]">{d.name}</span>
                      <span className="font-semibold text-gray-900 ml-2">{d.staff_count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-[#0f172a] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Calendar + Shortcuts */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Calendrier</h3>
            <MiniCalendar />
          </div>
        </div>
      </div>

      {/* Workflows */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Workflows en attente</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WorkflowCard title="Demandes de documents" count={data.documents?.requests_pending || 0} emoji="📂" link="/certificates/manage" linkLabel="Traiter" />
          <WorkflowCard title="Congés en attente" count={data.leaves?.pending || 0} emoji="🗓️" link="/certificates/manage" linkLabel="Traiter" />
          <WorkflowCard title="Ordres de mission" count={data.missions?.pending || 0} emoji="✈️" link="/certificates/manage" linkLabel="Traiter" />
        </div>
      </div>

      {/* Bottom row: Activity + Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Activité récente</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-auto">
            {activity.slice(0, 8).map(act => (
              <div key={act.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: ROLE_COLORS[act.role] || '#94a3b8' }}>
                    {(act.name || '?')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{act.name}</p>
                    <p className="text-xs text-gray-400">{getRoleLabel(act.role)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {act.last_login ? new Date(act.last_login).toLocaleDateString('fr-FR') : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Shortcuts */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Raccourcis</h3>
          </div>
          <div className="p-2">
            <Shortcut to="/certificates/manage" label="Gestion des demandes" emoji="📋" />
            <Shortcut to="/templates" label="Modèles de documents" emoji="📄" />
            <Shortcut to="/users" label="Gestion des utilisateurs" emoji="👥" />
            <Shortcut to="/departements" label="Départements" emoji="🏛️" />
            <Shortcut to="/broadcast" label="Notifications globales" emoji="📢" />
            <Shortcut to="/promotions" label="Promotions" emoji="⬆️" />
          </div>
        </div>
      </div>
    </div>
  );
}
