/**
 * My Requests Page
 * ----------------
 * Unified view: shows ALL of the user's requests (certificates + leaves + missions)
 * in one list with type badges and status. Replaces the need to visit 3 separate pages.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRequests } from '../../api/requests.api';
import { downloadDocument } from '../../api/certificates.api';

const typeCfg: Record<string, { label: string; cls: string }> = {
  CERTIFICATE: { label: 'Attestation', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  LEAVE: { label: 'Conge', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  MISSION: { label: 'Mission', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const statusCfg: Record<string, { label: string; cls: string }> = {
  PENDING:       { label: 'En attente',      cls: 'text-amber-600 bg-amber-50' },
  APPROVED:      { label: 'Approuvee',       cls: 'text-green-600 bg-green-50' },
  DEPT_APPROVED: { label: 'Approuvee (Dept)', cls: 'text-blue-600 bg-blue-50' },
  REJECTED:      { label: 'Rejetee',         cls: 'text-red-600 bg-red-50' },
  GENERATED:     { label: 'Approuvee',       cls: 'text-green-600 bg-green-50' },
  CANCELLED:     { label: 'Annulee',         cls: 'text-gray-500 bg-gray-50' },
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (id: string, name: string) => {
    setDownloading(id);
    try {
      const res = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}_${id.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Erreur lors du telechargement.'); }
    finally { setDownloading(null); }
  };

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filter) params.type = filter;
    getMyRequests(params)
      .then(r => setRequests(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mes demandes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Toutes vos demandes en un seul endroit</p>
        </div>
        <Link to="/certificates/new" className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]">
          + Nouvelle demande
        </Link>
      </div>

      {/* Type filter */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {[{ v: '', l: 'Tout' }, { v: 'CERTIFICATE', l: 'Attestations' }, { v: 'LEAVE', l: 'Conges' }, { v: 'MISSION', l: 'Missions' }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f.v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{f.l}</button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucune demande trouvee.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Objet</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const t = typeCfg[r.type as string] || typeCfg.CERTIFICATE;
                const s = statusCfg[r.status as string] || statusCfg.PENDING;
                return (
                  <tr key={r.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${t.cls}`}>{t.label}</span>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">{r.title as string}</td>
                    <td className="px-5 py-3 text-gray-500">{(r.created_at as string)?.slice(0, 10)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.type === 'CERTIFICATE' && (r.status === 'APPROVED' || r.status === 'GENERATED') ? (
                        <button
                          onClick={() => handleDownload(r.id as string, r.title as string)}
                          disabled={downloading === r.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                        >
                          {downloading === r.id ? (
                            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                          ) : (
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                          )}
                          {downloading === r.id ? 'Preparation...' : 'Telecharger PDF'}
                        </button>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
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
