/**
 * =============================================================================
 * ALL REQUESTS PAGE -- HR Administration Dashboard
 * =============================================================================
 *
 * PURPOSE:
 *   Unified view where HR staff can see ALL requests from ALL users,
 *   regardless of type (certificates, leaves, missions). This is the
 *   central place for approving and rejecting requests.
 *
 * HOW IT WORKS:
 *   1. Fetches from GET /api/v1/requests/all/ (returns normalized data)
 *   2. Displays in a table with type badges, user name, title, status
 *   3. HR can filter by type (Attestations, Conges, Missions)
 *   4. HR can filter by status (En attente, Approuvees, Rejetees)
 *   5. For pending requests, Approve/Reject buttons appear
 *   6. Clicking Approve/Reject calls POST /api/v1/requests/review/
 *      which routes to the correct backend model automatically
 *
 * WHY UNIFIED:
 *   Instead of 3 separate management pages (one per request type),
 *   HR has one table. The backend normalizes all types into the same
 *   format so the frontend doesn't need to know which model it's
 *   dealing with.
 *
 * ACCESS:
 *   HR only (ADMIN_HR role). Protected by ProtectedRoute in the router.
 * =============================================================================
 */
import { useEffect, useState } from 'react';
import { getAllRequests, reviewRequest } from '../../api/requests.api';
import { downloadSignedDocument } from '../../api/certificates.api';
import Pagination from '../../components/ui/Pagination';

const PER_PAGE = 15;

/**
 * Type badge configuration.
 * Each request type gets a distinct color so HR can quickly scan the table.
 */
const typeCfg: Record<string, { label: string; cls: string }> = {
  CERTIFICATE: { label: 'Attestation',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  FREE:        { label: 'Demande libre',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  LEAVE:       { label: 'Conge',          cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  MISSION:     { label: 'Mission',        cls: 'bg-teal-50 text-teal-700 border-teal-200' },
};

/**
 * Status badge configuration.
 * PENDING = amber (needs attention), APPROVED = green, REJECTED = red.
 */
const statusCfg: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'En attente', cls: 'text-amber-600 bg-amber-50' },
  APPROVED: { label: 'Approuvee',  cls: 'text-green-600 bg-green-50' },
  REJECTED: { label: 'Rejetee',    cls: 'text-red-600 bg-red-50' },
};

export default function AllRequestsPage() {
  /**
   * State:
   * - requests: the normalized request list from the backend
   * - loading: true while the API call is in progress
   * - typeFilter: current type filter (empty = all types)
   * - statusFilter: current status filter (empty = all statuses)
   * - reviewingId: the ID of the request currently being approved/rejected
   *   (used to show a loading state on the specific row's buttons)
   */
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; type: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [noteDrawer, setNoteDrawer] = useState<{ subject: string; note: string; user: string; title: string } | null>(null);
  const [page, setPage] = useState(1);
  const [downloadingSignedId, setDownloadingSignedId] = useState<string | null>(null);

  const handleDownloadSigned = async (id: string, title: string) => {
    setDownloadingSignedId(id);
    try {
      const res = await downloadSignedDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `signe_${title}_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Document signé non disponible.'); }
    finally { setDownloadingSignedId(null); }
  };

  /**
   * Fetch requests from the backend whenever filters change.
   * The API accepts ?type= and ?status= query params.
   */
  const fetchData = () => {
    const params: Record<string, string> = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    setLoading(true);
    setPage(1);
    getAllRequests(params)
      .then((r) => setRequests(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [typeFilter, statusFilter]);

  const totalPages = Math.ceil(requests.length / PER_PAGE);
  const rows = requests.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /**
   * Handle approve/reject action.
   * Calls POST /api/v1/requests/review/ with the request's ID, type, and action.
   * The backend routes the action to the correct model (DocumentRequest,
   * LeaveRequest, or Mission).
   *
   * After success, re-fetches the list to reflect the new status.
   */
  const handleReview = async (id: string, type: string, action: 'approve' | 'reject', reason = '') => {
    setReviewingId(id);
    try {
      await reviewRequest({ id, type, action, reason });
      fetchData();
    } catch {
      alert('Erreur lors du traitement de la demande.');
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = (id: string, type: string) => {
    setRejectModal({ id, type });
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectModal) return;
    await handleReview(rejectModal.id, rejectModal.type, 'reject', rejectReason);
    setRejectModal(null);
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Toutes les demandes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Vue unifiee de toutes les demandes du systeme. Approuvez ou rejetez depuis cette page.
        </p>
      </div>

      {/* ================================================================
         FILTER BAR
         Two groups of toggle buttons: one for type, one for status.
         Clicking a filter updates state, which triggers a re-fetch.
         ================================================================ */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {/* Type filter */}
        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1">
          {[
            { v: '', l: 'Tous types' },
            { v: 'CERTIFICATE', l: 'Attestations' },
            { v: 'FREE', l: 'Demandes libres' },
            { v: 'LEAVE', l: 'Conges' },
            { v: 'MISSION', l: 'Missions' },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setTypeFilter(f.v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                typeFilter === f.v
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1">
          {[
            { v: '', l: 'Tous statuts' },
            { v: 'PENDING', l: 'En attente' },
            { v: 'APPROVED', l: 'Approuvees' },
            { v: 'REJECTED', l: 'Rejetees' },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === f.v
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================
         REQUEST TABLE
         Each row shows: Type badge | User name | Title | Date | Status | Actions
         Actions column shows Approve/Reject buttons only for PENDING requests.
         ================================================================ */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucune demande trouvee.</div>
        ) : (
          <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Demandeur</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Objet</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Note</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const t = typeCfg[r.type as string] || typeCfg.CERTIFICATE;
                const s = statusCfg[r.status as string] || statusCfg.PENDING;
                const isPending = r.status === 'PENDING';
                const isReviewing = reviewingId === (r.id as string);

                return (
                  <tr key={`${r.type}-${r.id}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                    {/* Type badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${t.cls}`}>
                        {t.label}
                      </span>
                    </td>

                    {/* User who submitted the request */}
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {r.user_name as string}
                    </td>

                    {/* Request title/description */}
                    <td className="px-4 py-3 text-gray-700">
                      {r.title as string}
                    </td>

                    {/* Note */}
                    <td className="px-4 py-3 max-w-[160px]">
                      {(() => {
                        const subject = r.subject as string;
                        const note = r.note as string;
                        const full = [subject, note].filter(Boolean).join(' — ');
                        if (!full) return <span className="text-gray-300 text-xs">—</span>;
                        return (
                          <button
                            onClick={() => setNoteDrawer({ subject, note, user: r.user_name as string, title: r.title as string })}
                            className="flex items-center gap-1 text-left group w-full"
                          >
                            <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-gray-600 truncate group-hover:text-[#0f172a]">{full}</span>
                          </button>
                        );
                      })()}
                    </td>

                    {/* Creation date */}
                    <td className="px-4 py-3 text-gray-500">
                      {(r.created_at as string)?.slice(0, 10)}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${s.cls}`}>
                        {s.label}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        {/* Signed document button — shown when prof has signed */}
                        {r.type === 'CERTIFICATE' && r.has_signed_document && (
                          <button
                            onClick={() => handleDownloadSigned(r.id as string, r.title as string)}
                            disabled={downloadingSignedId === (r.id as string)}
                            title="Télécharger le document signé par le professeur"
                            className="px-2.5 py-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            {downloadingSignedId === (r.id as string) ? '...' : 'Doc. signé'}
                          </button>
                        )}
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleReview(r.id as string, r.type as string, 'approve')}
                              disabled={isReviewing}
                              className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50 transition-colors"
                            >
                              {isReviewing ? '...' : 'Approuver'}
                            </button>
                            <button
                              onClick={() => handleReject(r.id as string, r.type as string)}
                              disabled={isReviewing}
                              className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              {isReviewing ? '...' : 'Rejeter'}
                            </button>
                          </>
                        ) : (
                          !r.has_signed_document && <span className="text-xs text-gray-300">&mdash;</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Motif du rejet</h3>
            <p className="text-xs text-gray-500 mb-3">Optionnel - sera visible par le demandeur</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none resize-none focus:ring-1 focus:ring-red-400"
              placeholder="Raison du rejet..."
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={confirmReject} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
