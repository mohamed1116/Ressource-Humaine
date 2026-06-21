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

/**
 * Type badge configuration.
 * Each request type gets a distinct color so HR can quickly scan the table.
 */
const typeCfg: Record<string, { label: string; cls: string }> = {
  CERTIFICATE: { label: 'Attestation', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  LEAVE:       { label: 'Conge',       cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  MISSION:     { label: 'Mission',     cls: 'bg-teal-50 text-teal-700 border-teal-200' },
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

  /**
   * Fetch requests from the backend whenever filters change.
   * The API accepts ?type= and ?status= query params.
   */
  const fetchData = () => {
    const params: Record<string, string> = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    setLoading(true);
    getAllRequests(params)
      .then((r) => setRequests(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Re-fetch when filters change
  useEffect(() => { fetchData(); }, [typeFilter, statusFilter]);

  /**
   * Handle approve/reject action.
   * Calls POST /api/v1/requests/review/ with the request's ID, type, and action.
   * The backend routes the action to the correct model (DocumentRequest,
   * LeaveRequest, or Mission).
   *
   * After success, re-fetches the list to reflect the new status.
   */
  const handleReview = async (id: string, type: string, action: 'approve' | 'reject') => {
    // If rejecting, ask for a reason
    let reason = '';
    if (action === 'reject') {
      const input = prompt('Motif du rejet (optionnel) :');
      if (input === null) return; // user cancelled the prompt
      reason = input;
    }

    setReviewingId(id);
    try {
      await reviewRequest({ id, type, action, reason });
      fetchData(); // refresh the list
    } catch {
      alert('Erreur lors du traitement de la demande.');
    } finally {
      setReviewingId(null);
    }
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Demandeur</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Objet</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
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

                    {/* Action buttons (only for pending requests) */}
                    <td className="px-4 py-3 text-right">
                      {isPending ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleReview(r.id as string, r.type as string, 'approve')}
                            disabled={isReviewing}
                            className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50 transition-colors"
                          >
                            {isReviewing ? '...' : 'Approuver'}
                          </button>
                          <button
                            onClick={() => handleReview(r.id as string, r.type as string, 'reject')}
                            disabled={isReviewing}
                            className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            {isReviewing ? '...' : 'Rejeter'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">&mdash;</span>
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
