/**
 * Request Detail Page
 * Shows full details of a single request (any type).
 * Accessed by clicking a request from MyRequests or AllRequests.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyRequests } from '../../api/requests.api';

type R = Record<string, unknown>;

const typeCfg: Record<string, { label: string; cls: string }> = {
  CERTIFICATE: { label: 'Attestation', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  LEAVE: { label: 'Conge', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  MISSION: { label: 'Mission', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
};
const statusCfg: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'En attente', cls: 'text-amber-600 bg-amber-50' },
  APPROVED: { label: 'Approuvee', cls: 'text-green-600 bg-green-50' },
  REJECTED: { label: 'Rejetee', cls: 'text-red-600 bg-red-50' },
};

export default function RequestDetailPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [request, setRequest] = useState<R | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /* Find the request in the user's list by matching type+id */
    getMyRequests()
      .then(r => {
        const all = r.data as R[];
        const found = all.find(req => req.id === id && req.type === type?.toUpperCase());
        setRequest(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, id]);

  if (loading) return <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>;
  if (!request) return (
    <div className="p-10 text-center">
      <p className="text-sm text-gray-500">Demande introuvable.</p>
      <Link to="/requests" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Retour</Link>
    </div>
  );

  const t = typeCfg[request.type as string] || typeCfg.CERTIFICATE;
  const s = statusCfg[request.status as string] || statusCfg.PENDING;
  const details = (request.details as R) || {};

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/requests" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">&larr; Retour aux demandes</Link>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${t.cls} mr-2`}>{t.label}</span>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>{s.label}</span>
          </div>
          <p className="text-xs text-gray-400">{(request.created_at as string)?.slice(0, 10)}</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Objet</p>
            <p className="text-sm font-medium text-gray-900">{request.title as string}</p>
          </div>

          {/* Type-specific details */}
          {Object.entries(details).map(([key, val]) => (
            <div key={key}>
              <p className="text-xs text-gray-500 mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
              <p className="text-sm text-gray-800">{String(val)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
