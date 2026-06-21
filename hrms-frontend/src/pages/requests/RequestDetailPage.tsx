/**
 * Request Detail Page — تفاصيل طلب واحد
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyRequests } from '../../api/requests.api';
import { downloadDocument } from '../../api/certificates.api';

type R = Record<string, unknown>;

const typeCfg: Record<string, { label: string; cls: string }> = {
  CERTIFICATE: { label: 'Attestation',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  LEAVE:       { label: 'Congé',        cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  MISSION:     { label: 'Mission',      cls: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const statusCfg: Record<string, { label: string; cls: string }> = {
  PENDING:       { label: 'En attente',        cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED:      { label: 'Approuvée',         cls: 'bg-green-50 text-green-700 border-green-200' },
  DEPT_APPROVED: { label: 'Approuvée (Dept)',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  REJECTED:      { label: 'Rejetée',           cls: 'bg-red-50 text-red-700 border-red-200' },
  GENERATED:     { label: 'Document prêt',     cls: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED:     { label: 'Annulée',           cls: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const detailLabels: Record<string, string> = {
  template_name:    'Type de document',
  leave_type:       'Type de congé',
  start_date:       'Date de début',
  end_date:         'Date de fin',
  total_days:       'Nombre de jours',
  original_status:  'Statut détaillé',
  destination:      'Destination',
};

export default function RequestDetailPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [request, setRequest] = useState<R | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getMyRequests()
      .then(r => {
        const all = r.data as R[];
        const found = all.find(req => req.id === id && req.type === type?.toUpperCase());
        setRequest(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, id]);

  const handleDownload = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const res = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `document_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Document non encore généré.'); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>;

  if (!request) return (
    <div className="p-10 text-center">
      <p className="text-sm text-gray-500">Demande introuvable.</p>
      <Link to="/requests" className="text-sm text-blue-600 hover:underline mt-2 inline-block">← Retour</Link>
    </div>
  );

  const t = typeCfg[request.type as string] || typeCfg.CERTIFICATE;
  const s = statusCfg[request.status as string] || statusCfg.PENDING;
  const details = (request.details as R) || {};

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/requests" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Retour aux demandes
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${t.cls}`}>{t.label}</span>
              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${s.cls}`}>{s.label}</span>
            </div>
            <p className="text-xs text-gray-400">{(request.created_at as string)?.slice(0, 10)}</p>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mt-3">{request.title as string}</h2>
        </div>

        {/* Détails */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
            {Object.entries(details)
              .filter(([, val]) => val !== null && val !== undefined && val !== '')
              .map(([key, val]) => (
                <div key={key} className="flex justify-between items-start px-4 py-3 gap-4">
                  <span className="text-xs text-gray-500 flex-shrink-0">{detailLabels[key] || key.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-800 text-right">{String(val)}</span>
                </div>
              ))}
          </div>

          {/* Télécharger PDF si disponible */}
          {request.type === 'CERTIFICATE' && (request.status === 'APPROVED' || request.status === 'GENERATED') && (
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {downloading ? 'Téléchargement...' : 'Télécharger le PDF'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
