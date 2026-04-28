import { useEffect, useState } from 'react';
import {
  getDocumentRequests, reviewDocumentRequest,
  previewDocument, generateDocument, downloadDocument,
} from '../../api/certificates.api';

const statusConfig: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED:  { label: 'Approuvee',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  REJECTED:  { label: 'Rejetee',    cls: 'bg-red-50 text-red-700 border-red-200' },
  GENERATED: { label: 'PDF genere', cls: 'bg-green-50 text-green-700 border-green-200' },
};

export default function ManageCertificatesPage() {
  const [requests, setRequests]     = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = () => {
    const params: Record<string, string> = {};
    if (filter) params.status = filter;
    getDocumentRequests(params)
      .then((res) => setRequests(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  // Approve → auto generate PDF
  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await reviewDocumentRequest(id, { action: 'approve' });
      await generateDocument(id);
      fetchData();
    } catch {
      alert('Erreur lors de l\'approbation.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motif du rejet :');
    if (reason === null) return;
    setProcessing(id);
    try {
      await reviewDocumentRequest(id, { action: 'reject', rejection_reason: reason });
      fetchData();
    } catch {
      alert('Erreur lors du rejet.');
    } finally {
      setProcessing(null);
    }
  };

  const handlePreview = async (id: string) => {
    try {
      const res = await previewDocument(id);
      setPreviewHtml(res.data.html);
      setShowPreview(true);
    } catch { alert('Erreur lors de la generation de l\'apercu.'); }
  };

  const handleDownload = async (id: string, name: string) => {
    setProcessing(id);
    try {
      const res = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `${name}_${id.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Aucun fichier disponible.'); }
    finally { setProcessing(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gestion des demandes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Traiter, previsualiser et generer les documents</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { v: '', l: 'Toutes' }, { v: 'PENDING', l: 'En attente' },
          { v: 'APPROVED', l: 'Approuvees' }, { v: 'GENERATED', l: 'Generees' },
          { v: 'REJECTED', l: 'Rejetees' },
        ].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f.v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{f.l}</button>
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
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Demandeur</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Document</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const st          = statusConfig[r.status as string] || statusConfig.PENDING;
                const isPending   = r.status === 'PENDING';
                const isGenerated = r.status === 'GENERATED';
                const isProcessing = processing === (r.id as string);

                return (
                  <tr key={r.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.requested_by_name as string}</td>
                    <td className="px-4 py-3 text-gray-700">{r.template_name as string}</td>
                    <td className="px-4 py-3 text-gray-500">{(r.created_at as string)?.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        <Btn onClick={() => handlePreview(r.id as string)} color="gray" disabled={isProcessing}>Apercu</Btn>

                        {isPending && (
                          <>
                            <Btn onClick={() => handleApprove(r.id as string)} color="green" disabled={isProcessing}>
                              {isProcessing ? 'Traitement...' : 'Approuver'}
                            </Btn>
                            <Btn onClick={() => handleReject(r.id as string)} color="red" disabled={isProcessing}>Rejeter</Btn>
                          </>
                        )}

                        {isGenerated && (
                          <button
                            onClick={() => handleDownload(r.id as string, r.template_name as string)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                            Telecharger PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-[800px] max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-sm font-semibold text-gray-800">Apercu du document</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-8" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}

function Btn({ onClick, color, children, disabled }: {
  onClick: () => void; color: string; children: React.ReactNode; disabled?: boolean;
}) {
  const colors: Record<string, string> = {
    gray:  'text-gray-600 border-gray-200 hover:bg-gray-50',
    green: 'text-green-700 border-green-200 hover:bg-green-50',
    red:   'text-red-700 border-red-200 hover:bg-red-50',
    blue:  'text-blue-700 border-blue-200 hover:bg-blue-50',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-2.5 py-1 text-xs font-medium border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colors[color]}`}>
      {children}
    </button>
  );
}
