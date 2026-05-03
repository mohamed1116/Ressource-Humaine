/**
 * My Documents Page
 * Shows the current user's document requests with status and download links.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDocumentRequests, downloadDocument } from '../../api/certificates.api';

const statusConfig: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approuvee', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  REJECTED: { label: 'Rejetee', cls: 'bg-red-50 text-red-700 border-red-200' },
  GENERATED: { label: 'Pret', cls: 'bg-green-50 text-green-700 border-green-200' },
};

export default function MyCertificatesPage() {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocumentRequests()
      .then((res) => setRequests(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (id: string) => {
    try {
      const res = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `document_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Document non encore genere.'); }
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
                const st = statusConfig[r.status as string] || statusConfig.PENDING;
                return (
                  <tr key={r.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{r.template_name as string}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{(r.created_at as string)?.slice(0, 10)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {r.has_pdf ? (
                        <button onClick={() => handleDownload(r.id as string)} className="px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded hover:bg-blue-50">
                          Telecharger PDF
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
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
