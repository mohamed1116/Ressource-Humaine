/**
 * Manage Document Requests (HR Admin)
 * ------------------------------------
 * Shows all document requests with ability to:
 *  - Filter by status
 *  - Approve / Reject
 *  - Preview rendered document
 *  - Generate PDF
 *  - Download PDF
 */
import { useEffect, useState } from 'react';
import {
  getDocumentRequests, reviewDocumentRequest,
  previewDocument, generateDocument, downloadDocument,
} from '../../api/certificates.api';
import { useAuth } from '../../context/AuthContext';
import AllRequestsPage from '../requests/AllRequestsPage';

const statusConfig: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  PENDING_SIGNATURE: { label: 'Signature requise', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  APPROVED: { label: 'Approuvee', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  REJECTED: { label: 'Rejetee', cls: 'bg-red-50 text-red-700 border-red-200' },
  GENERATED: { label: 'PDF genere', cls: 'bg-green-50 text-green-700 border-green-200' },
};

export default function ManageCertificatesPage() {
  const { user } = useAuth();

  // Super Admin sees all requests (certificates + leaves + missions)
  if (user?.role === 'SUPER_ADMIN') {
    return <AllRequestsPage />;
  }

  return <ManageCertificatesContent />;
}

function ManageCertificatesContent() {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteDrawer, setNoteDrawer] = useState<{ subject: string; note: string; user: string; title: string } | null>(null);

  const fetchData = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filter) params.status = filter;
    getDocumentRequests(params)
      .then((res) => {
        const data = res.data.results || res.data;
        // Sort by last_generated_at (most recent first), fallback to created_at
        const sorted = data.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const dateA = (a.last_generated_at || a.created_at) as string;
          const dateB = (b.last_generated_at || b.created_at) as string;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        setRequests(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? prompt('Motif du rejet :') : '';
    if (action === 'reject' && reason === null) return;
    try {
      await reviewDocumentRequest(id, { action, rejection_reason: reason || '' });
      fetchData();
    } catch { alert('Erreur lors du traitement.'); }
  };

  const handlePreview = async (id: string) => {
    try {
      const res = await previewDocument(id);
      setPreviewHtml(res.data.html);
      setShowPreview(true);
    } catch { alert('Erreur lors de la generation de l\'apercu.'); }
  };

  const handleGenerate = async (id: string) => {
    setActionLoading(id);
    try {
      await generateDocument(id);
      fetchData();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      alert(err?.response?.data?.detail || 'Erreur de generation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `document_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Aucun fichier disponible.'); }
  };

  return (
    <div className="pb-14">
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
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Note</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const st = statusConfig[r.status as string] || statusConfig.PENDING;
                const isPending = r.status === 'PENDING';
                const isPendingSignature = r.status === 'PENDING_SIGNATURE';
                const isApproved = r.status === 'APPROVED';
                const isGenerated = r.status === 'GENERATED';
                // Use last_generated_at if available, otherwise use created_at
                const displayDate = r.last_generated_at ? 
                  (r.last_generated_at as string).slice(0, 10) : 
                  (r.created_at as string)?.slice(0, 10);

                return (
                  <tr key={r.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.requested_by_name as string}</td>
                    <td className="px-4 py-3 text-gray-700">{r.template_name as string}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                      {(() => {
                        const subject = (r.extra_data as Record<string,string>)?.subject;
                        const note = (r.message as string) || '';
                        const fullText = [subject, note].filter(Boolean).join(' — ');
                        if (!fullText) return <span className="text-gray-300 text-xs">—</span>;
                        return (
                          <button
                            onClick={() => setNoteDrawer({ subject: subject || '', note, user: r.requested_by_name as string, title: r.template_name as string || 'Demande libre' })}
                            className="flex items-center gap-1.5 text-left group w-full"
                          >
                            <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-gray-700 truncate group-hover:text-[#0f172a]">{fullText}</span>
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{displayDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        {/* Preview always available */}
                        <Btn onClick={() => handlePreview(r.id as string)} color="gray">Apercu</Btn>

                        {/* Signed document download */}
                        {r.signed_document && (
                          <a
                            href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1','') || 'http://localhost:8000'}${r.signed_document}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs font-medium border rounded transition-colors text-purple-700 border-purple-200 hover:bg-purple-50"
                          >
                            ✍️ Doc signé
                          </a>
                        )}

                        {isPendingSignature && (
                          <span className="text-xs text-orange-600 italic">En attente de signature prof.</span>
                        )}

                        {isPending && (
                          <>
                            <Btn onClick={() => handleReview(r.id as string, 'approve')} color="green">Approuver</Btn>
                            <Btn onClick={() => handleReview(r.id as string, 'reject')} color="red">Rejeter</Btn>
                          </>
                        )}

                        {isApproved && (
                          <Btn onClick={() => handleGenerate(r.id as string)} color="blue" disabled={actionLoading === r.id as string}>
                            {actionLoading === r.id as string ? '...' : 'Generer PDF'}
                          </Btn>
                        )}

                        {isGenerated && (
                          r.has_template
                            ? <Btn onClick={() => handleGenerate(r.id as string)} color="blue" disabled={actionLoading === r.id as string}>
                                {actionLoading === r.id as string ? '...' : 'Regenerer'}
                              </Btn>
                            : <span className="text-[10px] text-gray-400 italic">Modèle supprimé</span>
                        )}

                        {(isApproved || isGenerated) && (r.has_pdf as boolean) && (
                          <Btn onClick={() => handleDownload(r.id as string)} color="green">Telecharger PDF</Btn>
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

      {/* Note Drawer */}
      {noteDrawer && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setNoteDrawer(null)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#0f172a]">
              <div>
                <p className="text-sm font-semibold text-white">Note de la demande</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{noteDrawer.user}</p>
              </div>
              <button onClick={() => setNoteDrawer(null)} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Document demandé</p>
                <p className="text-sm font-medium text-gray-800">{noteDrawer.title}</p>
              </div>
              {noteDrawer.subject && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Objet</p>
                  <p className="text-sm text-gray-800 font-medium">{noteDrawer.subject}</p>
                </div>
              )}
              {noteDrawer.note && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Message</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-amber-50 border border-amber-100 rounded-lg p-3">{noteDrawer.note}</p>
                </div>
              )}
              {!noteDrawer.subject && !noteDrawer.note && (
                <p className="text-sm text-gray-400 text-center py-8">Aucune note</p>
              )}
            </div>
          </div>
        </>
      )}

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
      <FptFooter />
    </div>
  );
}

function FptFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 py-1.5 text-center" style={{ fontSize: '8pt', color: '#555' }}>
      Hay El Mohammadi (Lastah), B.P : 271, C.P : 83000, Taroudant &nbsp;|&nbsp;
      Tél. : +212(0)5 28 55 10 10, Fax : +212(0)5 28 55 10 20, Site Web : <strong>www.fpt.ac.ma</strong>
    </div>
  );
}

function Btn({ onClick, color, disabled, children }: { onClick: () => void; color: string; disabled?: boolean; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    gray: 'text-gray-600 border-gray-200 hover:bg-gray-50',
    green: 'text-green-700 border-green-200 hover:bg-green-50',
    red: 'text-red-700 border-red-200 hover:bg-red-50',
    blue: 'text-blue-700 border-blue-200 hover:bg-blue-50',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`px-2.5 py-1 text-xs font-medium border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colors[color]}`}>
      {children}
    </button>
  );
}
