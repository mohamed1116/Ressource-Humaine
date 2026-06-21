/**
 * Audit Log Page (HR only)
 * Full trail of all system actions: who did what, when.
 */
import { useEffect, useState } from 'react';
import { getAuditLogs } from '../../api/audit.api';
import Pagination from '../../components/ui/Pagination';

const PER_PAGE = 20;

const actionCfg: Record<string, { label: string; cls: string }> = {
  CREATE: { label: 'Creation', cls: 'bg-blue-50 text-blue-700' },
  UPDATE: { label: 'Modification', cls: 'bg-amber-50 text-amber-700' },
  DELETE: { label: 'Suppression', cls: 'bg-red-50 text-red-600' },
  APPROVE: { label: 'Approbation', cls: 'bg-green-50 text-green-700' },
  REJECT: { label: 'Rejet', cls: 'bg-red-50 text-red-600' },
  GENERATE: { label: 'Generation', cls: 'bg-purple-50 text-purple-700' },
  LOGIN: { label: 'Connexion', cls: 'bg-slate-50 text-slate-600' },
  LOGOUT: { label: 'Deconnexion', cls: 'bg-slate-50 text-slate-500' },
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    const params: Record<string, string> = { page_size: '500' };
    if (filter) params.action = filter;
    getAuditLogs(params).then(r => setLogs(r.data.results || r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  const totalPages = Math.ceil(logs.length / PER_PAGE);
  const rows = logs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Journal d'audit</h1>
        <p className="text-sm text-gray-500 mt-0.5">Historique complet des actions effectuees dans le systeme</p>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit flex-wrap">
        {[{ v: '', l: 'Tout' }, { v: 'CREATE', l: 'Creations' }, { v: 'APPROVE', l: 'Approbations' }, { v: 'REJECT', l: 'Rejets' }, { v: 'GENERATE', l: 'Generations' }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f.v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{f.l}</button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucune entree de journal.</div>
        ) : (
          <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Cible</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => {
                const a = actionCfg[log.action as string] || { label: log.action, cls: 'bg-gray-50 text-gray-500' };
                return (
                  <tr key={log.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{(log.created_at as string)?.slice(0, 16).replace('T', ' ')}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{log.user_name as string}</td>
                    <td className="px-5 py-3"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${a.cls}`}>{a.label}</span></td>
                    <td className="px-5 py-3 text-gray-600">{log.target_type as string}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{log.description as string}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
