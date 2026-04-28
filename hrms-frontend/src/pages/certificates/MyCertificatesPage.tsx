import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDocumentRequests, downloadDocument } from '../../api/certificates.api';

const statusConfig: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED:  { label: 'Approuvee',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  REJECTED:  { label: 'Rejetee',    cls: 'bg-red-50 text-red-700 border-red-200' },
  GENERATED: { label: 'Pret',       cls: 'bg-green-50 text-green-700 border-green-200' },
};

export default function MyCertificatesPage() {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]   = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchData = () => {
    getDocumentRequests()
      .then((res) => setRequests(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDownload = async (id: string, name: string) => {
    setDownloading(id);
    try {
      const res = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `${name}_${id.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      fetchData();
    } catch {
      alert('Erreur lors du telechargement.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mes demandes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Historique de vos demandes de documents</p>
        </div>
        <Link to="/certificates/new" className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]">
          + Nouvelle demande
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">Aucune demande pour le moment.</p>
            <Link to="/certificates/new" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Faire une demande</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Document</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const st         = statusConfig[r.status as string] || statusConfig.PENDING;
                const canDownload = r.status === 'GENERATED' || r.status === 'APPROVED';
                const isLoading  = downloading === (r.id as string);

                return (
                  <tr key={r.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{r.template_name as string}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{(r.created_at as string)?.slice(0, 10)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {canDownload ? (
                        <button
                          onClick={() => handleDownload(r.id as string, r.template_name as string)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          {isLoading ? (
                            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                          ) : (
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                          )}
                          {isLoading ? 'Preparation...' : 'Telecharger PDF'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {r.status === 'REJECTED' ? 'Rejetee' : 'En attente'}
                        </span>
                      )}
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
