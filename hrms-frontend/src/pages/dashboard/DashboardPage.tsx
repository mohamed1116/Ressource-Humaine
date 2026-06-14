/**
 * Dashboard -- Designed for real daily use by HR staff, teachers, and students.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions, ROLE_LABELS } from '../../hooks/usePermissions';
import { getMyRequests, getAllRequests, getRequestStats, reviewRequest } from '../../api/requests.api';
import { getNotifications, markAsRead } from '../../api/notifications.api';

type R = Record<string, unknown>;

export default function DashboardPage() {
  const { user } = useAuth();
  const p = usePermissions();

  /* Today's date in French format */
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div>
      {/* Welcome header with date */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Bonjour, {user?.first_name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{p.roleLabel}</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm text-gray-500 capitalize">{today}</p>
          </div>
        </div>
      </div>

      {p.isAdmin && <AdminView />}
      {p.isHead && <HeadView />}
      {(p.isTeacher || p.isStaff) && <EmployeeView />}
      {p.isStudent && <StudentView />}
    </div>
  );
}

/* ═════════════════════════════════════
   ADMIN DASHBOARD
   What HR needs at 8:30am every day
   ═════════════════════════════════════ */
function AdminView() {
  const [stats, setStats] = useState<R | null>(null);
  const [pending, setPending] = useState<R[]>([]);
  const [recent, setRecent] = useState<R[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchData = () => {
    getRequestStats().then(r => setStats(r.data as R)).catch(() => {});
    getAllRequests({ status: 'PENDING' }).then(r => setPending((r.data as R[]).slice(0, 8))).catch(() => {});
    getAllRequests({ status: 'APPROVED' }).then(r => setRecent((r.data as R[]).slice(0, 5))).catch(() => {});
  };
  useEffect(fetchData, []);

  const byType = (stats?.by_type as R) || {};
  const certs = (byType.certificates as R) || {};
  const leaves = (byType.leaves as R) || {};
  const missions = (byType.missions as R) || {};

  const handleReview = async (id: string, type: string, action: 'approve' | 'reject') => {
    let reason = '';
    if (action === 'reject') {
      const input = prompt('Motif du rejet :');
      if (input === null) return;
      reason = input;
    }
    setReviewingId(id);
    try {
      await reviewRequest({ id, type, action, reason });
      fetchData();
    } catch { alert('Erreur'); }
    finally { setReviewingId(null); }
  };

  const totalPending = Number(stats?.pending) || 0;

  return (
    <div className="space-y-6">
      {/* Urgent banner if there are pending items */}
      {totalPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-amber-600">{totalPending}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">
              {totalPending} demande{totalPending > 1 ? 's' : ''} en attente de traitement
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {Number(certs.pending)||0} attestation{(Number(certs.pending)||0) > 1 ? 's' : ''} &middot; {Number(leaves.pending)||0} conge{(Number(leaves.pending)||0) > 1 ? 's' : ''} &middot; {Number(missions.pending)||0} mission{(Number(missions.pending)||0) > 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/certificates/manage" className="ml-auto px-3 py-1.5 text-xs font-medium text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 flex-shrink-0">
            Traiter maintenant
          </Link>
        </div>
      )}

      {/* Stat cards with icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="doc" label="Attestations" pending={Number(certs.pending)||0} total={Number(certs.total)||0} color="blue" />
        <StatCard icon="cal" label="Conges" pending={Number(leaves.pending)||0} total={Number(leaves.total)||0} color="purple" />
        <StatCard icon="plane" label="Missions" pending={Number(missions.pending)||0} total={Number(missions.total)||0} color="teal" />
        <StatCard icon="all" label="Total" pending={totalPending} total={Number(stats?.total)||0} color="slate" />
      </div>

      {/* Main grid: pending requests with inline actions + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending requests -- ACTIONABLE right from dashboard */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">A traiter</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Approuvez ou rejetez directement</p>
            </div>
            <Link to="/certificates/manage" className="text-xs text-blue-600 hover:underline">Tout voir</Link>
          </div>
          {pending.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-sm text-gray-500">Tout est a jour !</p>
              <p className="text-xs text-gray-400 mt-0.5">Aucune demande en attente.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pending.map(r => {
                const tl = typeLabels[r.type as string];
                const isR = reviewingId === (r.id as string);
                return (
                  <div key={`${r.type}-${r.id}`} className="px-5 py-3 flex items-center gap-3">
                    {/* Type badge */}
                    {tl && <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${tl.cls}`}>{tl.text}</span>}
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.user_name as string}</p>
                      <p className="text-xs text-gray-500 truncate">{r.title as string}</p>
                    </div>
                    {/* Date */}
                    <span className="text-[11px] text-gray-400 flex-shrink-0 hidden sm:block">{(r.created_at as string)?.slice(0, 10)}</span>
                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleReview(r.id as string, r.type as string, 'approve')} disabled={isR}
                        className="w-7 h-7 rounded-md bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center disabled:opacity-40" title="Approuver">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button onClick={() => handleReview(r.id as string, r.type as string, 'reject')} disabled={isR}
                        className="w-7 h-7 rounded-md bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center disabled:opacity-40" title="Rejeter">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Raccourcis</h3>
            </div>
            <div className="p-2">
              <QL to="/certificates/manage" label="Gerer les demandes" />
              <QL to="/templates" label="Modeles de documents" />
              <QL to="/employees" label="Personnel" />
              <QL to="/reports" label="Rapports" />
              <QL to="/audit" label="Journal d'audit" />
            </div>
          </div>

          {/* Recently approved */}
          {recent.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Recemment traitees</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {recent.map(r => (
                  <div key={`${r.type}-${r.id}`} className="px-5 py-2.5 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <p className="text-xs text-gray-600 truncate">{r.title as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════
   DEPARTMENT HEAD
   ═════════════════════════════════════ */
function HeadView() {
  const { user } = useAuth();
  const [requests, setRequests]     = useState<R[]>([]);
  const [leaves, setLeaves]         = useState<R[]>([]);
  const [balances, setBalances]     = useState<R[]>([]);
  const [missions, setMissions]     = useState<R[]>([]);
  const [attendance, setAttendance] = useState<R | null>(null);

  useEffect(() => {
    getMyRequests().then(r => setRequests(r.data as R[])).catch(() => {});
    import('../../api/leaves.api').then(({ getLeaveRequests, getLeaveBalances }) => {
      getLeaveRequests().then(r => setLeaves(r.data.results ?? r.data)).catch(() => {});
      getLeaveBalances().then(r => setBalances(r.data.results ?? r.data)).catch(() => {});
    });
    import('../../api/certificates.api').then(({ getMissions }) => {
      getMissions().then(r => setMissions(r.data.results ?? r.data)).catch(() => {});
    });
    import('../../api/attendance.api').then(({ getTodayAttendance }) => {
      getTodayAttendance().then(r => setAttendance(r.data as R)).catch(() => {});
    });
  }, []);

  const pendingReqs    = requests.filter(r => r.status === 'PENDING');
  const approvedReqs   = requests.filter(r => r.status === 'APPROVED');
  const activeMissions = missions.filter(m => m.status === 'APPROVED' || m.status === 'IN_PROGRESS');
  const pendingLeaves  = leaves.filter(l => l.status === 'PENDING' || l.status === 'DEPT_APPROVED');

  const annualBalance = (balances as R[]).find(b => {
    const name = ((b.leave_type_name as string) || '').toLowerCase();
    return name.includes('annuel') || name.includes('annual');
  });

  return (
    <div className="space-y-6">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Demandes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{requests.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{pendingReqs.length} en attente · {approvedReqs.length} approuvées</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Congés restants</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {annualBalance ? `${annualBalance.remaining_days}j` : '—'}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {annualBalance ? `sur ${annualBalance.total_days}j alloués` : 'Solde non disponible'}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Missions</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{missions.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{activeMissions.length} active{activeMissions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Présence aujourd'hui</p>
          <p className={`text-2xl font-bold mt-1 ${attendance ? 'text-green-600' : 'text-gray-300'}`}>
            {attendance ? (attendance.check_out ? '✓' : '→') : '—'}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {attendance
              ? attendance.check_out
                ? `${(attendance.check_in as string)?.slice(11,16)} — ${(attendance.check_out as string)?.slice(11,16)}`
                : `Entré à ${(attendance.check_in as string)?.slice(11,16)}`
              : 'Non pointé'}
          </p>
        </div>
      </div>

      {/* ── Pending banner ── */}
      {pendingReqs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-amber-600">{pendingReqs.length}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {pendingReqs.length} demande{pendingReqs.length > 1 ? 's' : ''} en cours de traitement
            </p>
            <div className="flex gap-3 mt-1">
              {pendingReqs.slice(0, 2).map(r => (
                <span key={`${r.type}-${r.id}`} className="text-xs text-amber-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                  {r.title as string}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left col ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Raccourcis */}
          <div className="grid grid-cols-3 gap-3">
            <Link to="/requests/new" className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:border-blue-200 hover:shadow transition-all group text-center">
              <div className="w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              </div>
              <p className="text-xs font-medium text-gray-700">Attestation</p>
            </Link>
            <Link to="/requests/new?type=LEAVE" className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:border-purple-200 hover:shadow transition-all group text-center">
              <div className="w-10 h-10 rounded-lg bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
              </div>
              <p className="text-xs font-medium text-gray-700">Congé</p>
            </Link>
            <Link to="/requests/new?type=MISSION" className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:border-teal-200 hover:shadow transition-all group text-center">
              <div className="w-10 h-10 rounded-lg bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              </div>
              <p className="text-xs font-medium text-gray-700">Mission</p>
            </Link>
          </div>

          {/* Dernières demandes */}
          <Card title="Mes dernières demandes" link="/requests">
            {requests.length === 0
              ? <Empty text="Aucune demande pour le moment." />
              : requests.slice(0, 5).map(r => (
                <Row key={`${r.type}-${r.id}`} badge={r.type as string} main={r.title as string} status={r.status as string} sub={(r.created_at as string)?.slice(0, 10)} />
              ))}
          </Card>

          {/* Soldes de congés */}
          {balances.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Soldes de congés</h3>
                <Link to="/leaves" className="text-xs text-blue-600 hover:underline">Voir tout</Link>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {(balances as R[]).slice(0, 4).map((b, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 truncate">{b.leave_type_name as string}</p>
                    <div className="flex items-end gap-1 mt-1">
                      <span className="text-lg font-bold text-gray-900">{b.remaining_days as number}</span>
                      <span className="text-xs text-gray-400 mb-0.5">/ {b.total_days as number}j</span>
                    </div>
                    <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (Number(b.remaining_days) / Number(b.total_days)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right col ── */}
        <div className="space-y-6">

          {/* Profile */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#0f172a] flex items-center justify-center text-white font-bold flex-shrink-0">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400">{ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] ?? user?.role}</p>
              </div>
            </div>
            <Link to="/profile" className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Voir mon profil
            </Link>
          </div>

          {/* Missions actives */}
          {activeMissions.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Missions actives</h3>
                <Link to="/missions" className="text-xs text-blue-600 hover:underline">Tout voir</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {activeMissions.slice(0, 3).map(m => (
                  <div key={m.id as string} className="px-5 py-3">
                    <p className="text-xs font-medium text-gray-800 truncate">{m.title as string}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{m.destination as string} · {(m.start_date as string)?.slice(0, 10)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendrier */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Calendrier</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Congés et missions ce mois</p>
            </div>
            <div className="p-4">
              <MiniCalendar leaves={leaves} missions={missions} />
            </div>
          </div>

          {/* Congés en attente */}
          {pendingLeaves.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-800 mb-2">{pendingLeaves.length} congé{pendingLeaves.length > 1 ? 's' : ''} en attente</p>
              {pendingLeaves.slice(0, 2).map((l, i) => (
                <div key={i} className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <p className="text-xs text-amber-700 truncate">{(l.start_date as string)?.slice(0, 10)} → {(l.end_date as string)?.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════
   PROFESSOR / STAFF
   ═════════════════════════════════════ */
function EmployeeView() {
  const { user } = useAuth();
  const [requests, setRequests]     = useState<R[]>([]);
  const [leaves, setLeaves]         = useState<R[]>([]);
  const [balances, setBalances]     = useState<R[]>([]);
  const [missions, setMissions]     = useState<R[]>([]);
  const [attendance, setAttendance] = useState<R | null>(null);
  useEffect(() => {
    getMyRequests().then(r => setRequests(r.data as R[])).catch(() => {});
    import('../../api/leaves.api').then(({ getLeaveRequests, getLeaveBalances }) => {
      getLeaveRequests().then(r => setLeaves(r.data.results ?? r.data)).catch(() => {});
      getLeaveBalances().then(r => setBalances(r.data.results ?? r.data)).catch(() => {});
    });
    import('../../api/certificates.api').then(({ getMissions }) => {
      getMissions().then(r => setMissions(r.data.results ?? r.data)).catch(() => {});
    });
    import('../../api/attendance.api').then(({ getTodayAttendance }) => {
      getTodayAttendance().then(r => setAttendance(r.data as R)).catch(() => {});
    });
  }, []);

  const pendingReqs  = requests.filter(r => r.status === 'PENDING');
  const approvedReqs = requests.filter(r => r.status === 'APPROVED');
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING' || l.status === 'DEPT_APPROVED');
  const activeMissions = missions.filter(m => m.status === 'APPROVED' || m.status === 'IN_PROGRESS');

  const annualBalance = (balances as R[]).find(b => {
    const name = ((b.leave_type_name as string) || '').toLowerCase();
    return name.includes('annuel') || name.includes('annual');
  });

  return (
    <div className="space-y-6">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Demandes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{requests.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{pendingReqs.length} en attente · {approvedReqs.length} approuvées</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Congés restants</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {annualBalance ? `${annualBalance.remaining_days}j` : '—'}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {annualBalance ? `sur ${annualBalance.total_days}j alloués` : 'Solde non disponible'}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Missions</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{missions.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{activeMissions.length} active{activeMissions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Présence aujourd'hui</p>
          <p className={`text-2xl font-bold mt-1 ${
            attendance ? 'text-green-600' : 'text-gray-300'
          }`}>
            {attendance ? (attendance.check_out ? '✓' : '→') : '—'}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {attendance
              ? attendance.check_out
                ? `${(attendance.check_in as string)?.slice(11,16)} — ${(attendance.check_out as string)?.slice(11,16)}`
                : `Entré à ${(attendance.check_in as string)?.slice(11,16)}`
              : 'Non pointé'}
          </p>
        </div>
      </div>

      {/* ── Pending banner ── */}
      {pendingReqs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-amber-600">{pendingReqs.length}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {pendingReqs.length} demande{pendingReqs.length > 1 ? 's' : ''} en cours de traitement
            </p>
            <div className="flex gap-3 mt-1">
              {pendingReqs.slice(0, 2).map(r => (
                <span key={`${r.type}-${r.id}`} className="text-xs text-amber-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                  {r.title as string}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left col ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Raccourcis */}
          <div className="grid grid-cols-3 gap-3">
            <Link to="/requests/new" className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:border-blue-200 hover:shadow transition-all group text-center">
              <div className="w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              </div>
              <p className="text-xs font-medium text-gray-700">Attestation</p>
            </Link>
            <Link to="/requests/new?type=LEAVE" className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:border-purple-200 hover:shadow transition-all group text-center">
              <div className="w-10 h-10 rounded-lg bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
              </div>
              <p className="text-xs font-medium text-gray-700">Congé</p>
            </Link>
            <Link to="/requests/new?type=MISSION" className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:border-teal-200 hover:shadow transition-all group text-center">
              <div className="w-10 h-10 rounded-lg bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              </div>
              <p className="text-xs font-medium text-gray-700">Mission</p>
            </Link>
          </div>

          {/* Dernières demandes */}
          <Card title="Mes dernières demandes" link="/requests">
            {requests.length === 0
              ? <Empty text="Aucune demande pour le moment." />
              : requests.slice(0, 5).map(r => (
                <Row key={`${r.type}-${r.id}`} badge={r.type as string} main={r.title as string} status={r.status as string} sub={(r.created_at as string)?.slice(0, 10)} />
              ))}
          </Card>

          {/* Soldes de congés */}
          {balances.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Soldes de congés</h3>
                <Link to="/leaves" className="text-xs text-blue-600 hover:underline">Voir tout</Link>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {(balances as R[]).slice(0, 4).map((b, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 truncate">{b.leave_type_name as string}</p>
                    <div className="flex items-end gap-1 mt-1">
                      <span className="text-lg font-bold text-gray-900">{b.remaining_days as number}</span>
                      <span className="text-xs text-gray-400 mb-0.5">/ {b.total_days as number}j</span>
                    </div>
                    <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (Number(b.remaining_days) / Number(b.total_days)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right col ── */}
        <div className="space-y-6">

          {/* Profile */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#0f172a] flex items-center justify-center text-white font-bold flex-shrink-0">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400">{ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] ?? user?.role}</p>
              </div>
            </div>
            <Link to="/profile" className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Voir mon profil
            </Link>
          </div>

          {/* Missions actives */}
          {activeMissions.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Missions actives</h3>
                <Link to="/missions" className="text-xs text-blue-600 hover:underline">Tout voir</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {activeMissions.slice(0, 3).map(m => (
                  <div key={m.id as string} className="px-5 py-3">
                    <p className="text-xs font-medium text-gray-800 truncate">{m.title as string}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{m.destination as string} · {(m.start_date as string)?.slice(0, 10)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendrier */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Calendrier</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Congés et missions ce mois</p>
            </div>
            <div className="p-4">
              <MiniCalendar leaves={leaves} missions={missions} />
            </div>
          </div>

          {/* Congés en attente */}
          {pendingLeaves.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-800 mb-2">{pendingLeaves.length} congé{pendingLeaves.length > 1 ? 's' : ''} en attente</p>
              {pendingLeaves.slice(0, 2).map((l, i) => (
                <div key={i} className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <p className="text-xs text-amber-700 truncate">{(l.start_date as string)?.slice(0, 10)} → {(l.end_date as string)?.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════
   STUDENT
   ═════════════════════════════════════ */
function StudentView() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<R[]>([]);
  const [notifs, setNotifs]     = useState<R[]>([]);

  useEffect(() => {
    getMyRequests().then(r => {
      const data = r.data as R;
      setRequests((data.results ?? data) as R[]);
    }).catch(() => {});
    getNotifications({ page_size: '5' }).then(r => {
      const data = r.data as R;
      setNotifs((data.results ?? data) as R[]);
    }).catch(() => {});
  }, []);

  const pending  = requests.filter(r => r.status === 'PENDING');
  const approved = requests.filter(r => r.status === 'APPROVED');
  const rejected = requests.filter(r => r.status === 'REJECTED');

  const quickCerts = [
    { label: 'Attestation de scolarité',  type: 'SCOLARITE' },
    { label: 'Attestation d\'inscription', type: 'INSCRIPTION' },
    { label: 'Attestation de réussite',   type: 'REUSSITE' },
    { label: 'Attestation de stage',      type: 'STAGE' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{requests.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">demandes</p>
        </div>
        <div className="bg-white rounded-lg border border-amber-100 shadow-sm p-4">
          <p className="text-xs text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{pending.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">en traitement</p>
        </div>
        <div className="bg-white rounded-lg border border-green-100 shadow-sm p-4">
          <p className="text-xs text-gray-500">Approuvées</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{approved.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">traitées</p>
        </div>
        <div className="bg-white rounded-lg border border-red-100 shadow-sm p-4">
          <p className="text-xs text-gray-500">Rejetées</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{rejected.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">non accordées</p>
        </div>
      </div>

      {/* ── Pending banner ── */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4">
          <p className="text-sm font-medium text-amber-800 mb-2">
            {pending.length} demande{pending.length > 1 ? 's' : ''} en cours de traitement
          </p>
          {pending.map(r => (
            <div key={`${r.type}-${r.id}`} className="flex items-center gap-2 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <p className="text-xs text-amber-700 truncate">{r.title as string}</p>
              <span className="text-[10px] text-amber-500 ml-auto flex-shrink-0">{(r.created_at as string)?.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: history + quick certs ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick cert buttons */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Demander une attestation</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Choisissez le type de document</p>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              {quickCerts.map(c => (
                <Link
                  key={c.type}
                  to={`/requests/new?type=${c.type}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-7 h-7 rounded-md bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-700 group-hover:text-blue-700 leading-tight">{c.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* History */}
          <Card title="Historique des demandes" link="/requests">
            {requests.length === 0
              ? <Empty text="Aucune demande pour le moment." />
              : requests.slice(0, 6).map(r => (
                <Row key={`${r.type}-${r.id}`} main={r.title as string} status={r.status as string} sub={(r.created_at as string)?.slice(0, 10)} />
              ))
            }
          </Card>
        </div>

        {/* ── Right: profile info + notifications ── */}
        <div className="space-y-6">

          {/* Profile card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#0f172a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400">Étudiant</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-700 truncate ml-2">{user?.email}</span>
              </div>
            </div>
            <Link to="/profile" className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Voir mon profil
            </Link>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
              <Link to="/notifications" className="text-xs text-blue-600 hover:underline">Tout voir</Link>
            </div>
            {notifs.length === 0 ? (
              <div className="p-5 text-center text-xs text-gray-400">Aucune notification</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifs.map(n => (
                  <div
                    key={n.id as string}
                    onClick={() => markAsRead(n.id as string).catch(() => {})}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !n.is_read ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{n.title as string}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{(n.created_at as string)?.slice(0, 10)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════
   MINI CALENDAR
   ═════════════════════════════════════ */
function MiniCalendar({ leaves, missions }: { leaves: R[]; missions: R[] }) {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year  = current.getFullYear();
  const month = current.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const DAYS_FR   = ['L','M','M','J','V','S','D'];

  const isInRange = (day: number, start: string, end: string) => {
    const d = new Date(year, month, day);
    return d >= new Date(start) && d <= new Date(end);
  };

  const getEvents = (day: number) => {
    const events: { type: 'leave' | 'mission'; label: string }[] = [];
    leaves.forEach(l => {
      if (l.start_date && l.end_date && isInRange(day, l.start_date as string, l.end_date as string))
        events.push({ type: 'leave', label: 'Congé' });
    });
    missions.forEach(m => {
      if (m.start_date && m.end_date && isInRange(day, m.start_date as string, m.end_date as string))
        events.push({ type: 'mission', label: 'Mission' });
    });
    return events;
  };

  const cells = Array.from({ length: offset + daysInMonth }, (_, i) =>
    i < offset ? null : i - offset + 1
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 text-xs">
          ‹
        </button>
        <p className="text-[11px] font-semibold text-gray-700">{MONTHS_FR[month]} {year}</p>
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 text-xs">
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {DAYS_FR.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-medium text-gray-400 py-0.5">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const events = getEvents(day);
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const hasLeave   = events.some(e => e.type === 'leave');
          const hasMission = events.some(e => e.type === 'mission');
          return (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-medium
                ${ isToday ? 'bg-[#0f172a] text-white' :
                   hasLeave ? 'bg-purple-100 text-purple-700' :
                   hasMission ? 'bg-teal-100 text-teal-700' :
                   'text-gray-600 hover:bg-gray-100' }`}>
                {day}
              </div>
              {(hasLeave || hasMission) && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasLeave   && <div className="w-1 h-1 rounded-full bg-purple-400" />}
                  {hasMission && <div className="w-1 h-1 rounded-full bg-teal-400" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span className="text-[9px] text-gray-400">Congé</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          <span className="text-[9px] text-gray-400">Mission</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0f172a]" />
          <span className="text-[9px] text-gray-400">Aujourd'hui</span>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════
   SHARED COMPONENTS
   ═════════════════════════════════════ */

/* Stat card for admin -- shows pending/total with icon */
function StatCard({ label, pending, total, color }: { icon?: string; label: string; pending: number; total: number; color: string }) {
  const colors: Record<string, { bg: string; text: string; ring: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'ring-teal-100' },
    slate: { bg: 'bg-gray-50', text: 'text-gray-600', ring: 'ring-gray-100' },
  };
  const c = colors[color] || colors.slate;
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${c.bg} ring-1 ${c.ring} flex items-center justify-center flex-shrink-0`}>
          <span className={`text-sm font-bold ${c.text}`}>{pending}</span>
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-sm font-semibold text-gray-900">{pending} <span className="text-gray-400 font-normal">/ {total}</span></p>
        </div>
      </div>
    </div>
  );
}

function Card({ title, link, children }: { title: string; link?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {link && <Link to={link} className="text-xs text-blue-600 hover:underline">Voir tout</Link>}
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

const typeLabels: Record<string, { text: string; cls: string }> = {
  CERTIFICATE: { text: 'Att.', cls: 'bg-blue-50 text-blue-700' },
  LEAVE: { text: 'Conge', cls: 'bg-purple-50 text-purple-700' },
  MISSION: { text: 'Mission', cls: 'bg-teal-50 text-teal-700' },
};
const statusLabels: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'En attente', cls: 'text-amber-600 bg-amber-50' },
  APPROVED: { text: 'Approuvee', cls: 'text-green-600 bg-green-50' },
  REJECTED: { text: 'Rejetee', cls: 'text-red-600 bg-red-50' },
};

function Row({ main, sub, badge, status }: { main: string; sub?: string; badge?: string; status?: string }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        {badge && (() => { const b = typeLabels[badge]; return b ? <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${b.cls}`}>{b.text}</span> : null; })()}
        <div className="min-w-0">
          <p className="text-sm text-gray-800 truncate">{main}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
      {status && (() => { const s = statusLabels[status]; return s ? <span className={`text-[10px] font-medium px-2 py-0.5 rounded flex-shrink-0 ${s.cls}`}>{s.text}</span> : null; })()}
    </div>
  );
}

function Empty({ text = 'Aucun element' }: { text?: string }) {
  return <div className="p-6 text-center text-sm text-gray-400">{text}</div>;
}

function QL({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors">
      <span>{label}</span>
      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
    </Link>
  );
}
