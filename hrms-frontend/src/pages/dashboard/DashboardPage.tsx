/**
 * Dashboard -- Designed for real daily use by HR staff, teachers, and students.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { getMyRequests, getAllRequests, getRequestStats } from '../../api/requests.api';
import { reviewRequest } from '../../api/requests.api';

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
          <Link to="/requests/all" className="ml-auto px-3 py-1.5 text-xs font-medium text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 flex-shrink-0">
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
            <Link to="/requests/all" className="text-xs text-blue-600 hover:underline">Tout voir</Link>
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
              <QL to="/requests/all" label="Gerer les demandes" />
              <QL to="/templates" label="Modeles de documents" />
              <QL to="/employees" label="Personnel" />
              <QL to="/departments" label="Departements" />
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
  const [requests, setRequests] = useState<R[]>([]);
  useEffect(() => { getMyRequests().then(r => setRequests(r.data as R[])).catch(() => {}); }, []);
  const pending = requests.filter(r => r.status === 'PENDING');
  const approved = requests.filter(r => r.status === 'APPROVED');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SC label="Total demandes" value={requests.length} />
        <SC label="En attente" value={pending.length} accent="amber" />
        <SC label="Approuvees" value={approved.length} accent="green" />
      </div>

      {/* Status tracker for pending */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">{pending.length} demande{pending.length > 1 ? 's' : ''} en cours de traitement</p>
          {pending.slice(0, 3).map(r => (
            <div key={`${r.type}-${r.id}`} className="flex items-center gap-2 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <p className="text-xs text-amber-700">{r.title as string}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Historique de mes demandes" link="/requests">
            {requests.length === 0 ? <Empty text="Vous n'avez pas encore fait de demande." /> : requests.slice(0, 6).map(r => (
              <Row key={`${r.type}-${r.id}`} badge={r.type as string} main={r.title as string} status={r.status as string} sub={(r.created_at as string)?.slice(0, 10)} />
            ))}
          </Card>
        </div>

      </div>
    </div>
  );
}

/* ═════════════════════════════════════
   PROFESSOR / STAFF
   ═════════════════════════════════════ */
function EmployeeView() {
  const [requests, setRequests] = useState<R[]>([]);
  useEffect(() => { getMyRequests().then(r => setRequests(r.data as R[])).catch(() => {}); }, []);
  const pending = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Status tracker */}
      {pending.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800">{pending.length} demande{pending.length > 1 ? 's' : ''} en cours</p>
          {pending.slice(0, 3).map(r => (
            <div key={`${r.type}-${r.id}`} className="flex items-center gap-2 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <p className="text-xs text-blue-700">{r.title as string}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ActionCard to="/requests/new" title="Nouvelle demande" desc="Attestation, conge ou mission" icon="plus" />
        <ActionCard to="/missions" title="Mes missions" desc="Deplacements academiques" icon="plane" />
      </div>

      {/* Recent requests */}
      <Card title="Mes demandes" link="/requests">
        {requests.length === 0 ? <Empty text="Vous n'avez pas encore fait de demande. Utilisez les raccourcis ci-dessus." /> : requests.slice(0, 6).map(r => (
          <Row key={`${r.type}-${r.id}`} badge={r.type as string} main={r.title as string} status={r.status as string} sub={(r.created_at as string)?.slice(0, 10)} />
        ))}
      </Card>
    </div>
  );
}

/* ═════════════════════════════════════
   STUDENT
   ═════════════════════════════════════ */
function StudentView() {
  const [requests, setRequests] = useState<R[]>([]);
  useEffect(() => { getMyRequests().then(r => setRequests(r.data as R[])).catch(() => {}); }, []);
  const pending = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Pending tracker */}
      {pending.length > 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800">Vos demandes en cours de traitement :</p>
          {pending.map(r => (
            <div key={`${r.type}-${r.id}`} className="flex items-center gap-2 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <p className="text-xs text-blue-700">{r.title as string}</p>
            </div>
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <p className="text-sm text-green-700">Toutes vos demandes ont ete traitees.</p>
        </div>
      ) : null}

      {/* Main action */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
        <div className="w-12 h-12 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Demander une attestation</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">Scolarite, inscription, reussite, bourse, stage...</p>
        <Link to="/requests/new" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nouvelle demande
        </Link>
      </div>

      {/* History */}
      <Card title="Historique" link="/requests">
        {requests.length === 0 ? <Empty text="Aucune demande pour le moment." /> : requests.slice(0, 5).map(r => (
          <Row key={`${r.type}-${r.id}`} main={r.title as string} status={r.status as string} sub={(r.created_at as string)?.slice(0, 10)} />
        ))}
      </Card>
    </div>
  );
}

/* ═════════════════════════════════════
   SHARED COMPONENTS
   ═════════════════════════════════════ */

/* Stat card for admin -- shows pending/total with icon */
function StatCard({ icon, label, pending, total, color }: { icon: string; label: string; pending: number; total: number; color: string }) {
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

/* Simple stat card */
function SC({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const ac: Record<string, string> = { amber: 'text-amber-600', green: 'text-green-600' };
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? ac[accent] : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

/* Action card -- clickable card with icon, title, description */
function ActionCard({ to, title, desc, icon }: { to: string; title: string; desc: string; icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    plus: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
    cal: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
    plane: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>,
  };
  return (
    <Link to={to} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:border-gray-300 hover:shadow transition-all group">
      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#0f172a] group-hover:bg-gray-100 transition-colors mb-3">
        {icons[icon]}
      </div>
      <p className="text-sm font-medium text-gray-800">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </Link>
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
   
 