/**
 * Mission Management Page
 * -----------------------
 * HR / Super Admin: view all missions, create new ones, approve PLANNED missions, edit missions.
 * Employees (PROFESSOR, STAFF, DEPARTMENT_HEAD): view their own missions + full details.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { getMissions, createMission, updateMission, approveMission } from '../../api/missions.api';
import { getEmployees } from '../../api/employees.api';

const statusCfg: Record<string, { label: string; cls: string }> = {
  PLANNED:     { label: 'Planifiée',  cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  APPROVED:    { label: 'Approuvée',  cls: 'bg-green-50 text-green-700 border-green-200' },
  IN_PROGRESS: { label: 'En cours',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED:   { label: 'Terminée',   cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  CANCELLED:   { label: 'Annulée',    cls: 'bg-red-50 text-red-600 border-red-200' },
};

type Mission = Record<string, unknown>;

export default function MissionListPage() {
  const { canManageMissions } = usePermissions();
  const navigate = useNavigate();
  const [missions, setMissions]       = useState<Mission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editMission, setEditMission] = useState<Mission | null>(null);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = () => {
    setLoading(true);
    getMissions()
      .then(r => setMissions(r.data.results ?? r.data))
      .catch(() => showToast('Impossible de charger les missions.', false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Confirmer l\'approbation de cette mission ?')) return;
    try {
      await approveMission(id);
      showToast('Mission approuvée avec succès.');
      fetchData();
    } catch {
      showToast('Erreur lors de l\'approbation. Veuillez réessayer.', false);
    }
  };

  const openEdit = (m: Mission) => {
    setEditMission(m);
    setShowForm(false);
    setExpandedId(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditMission(null);
  };

  const toggleExpand = (id: string) =>
    setExpandedId(prev => (prev === id ? null : id));

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mes missions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des missions et déplacements académiques</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/requests/new?type=MISSION')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            + Nouvelle mission
          </button>
          {canManageMissions && !editMission && (
            <button
              onClick={() => setShowForm(f => !f)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]"
            >
              {showForm ? 'Fermer' : 'Créer (Admin)'}
            </button>
          )}
        </div>
      </div>

      {/* Create form */}
      {showForm && !editMission && (
        <MissionForm
          onDone={(msg) => { closeForm(); fetchData(); showToast(msg ?? 'Mission créée avec succès.'); }}
          onCancel={closeForm}
        />
      )}

      {/* Edit form */}
      {editMission && (
        <MissionForm
          initial={editMission}
          onDone={(msg) => { closeForm(); fetchData(); showToast(msg ?? 'Mission mise à jour.'); }}
          onCancel={closeForm}
        />
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : missions.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucune mission enregistrée.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Objet</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Destination</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => {
                const id = m.id as string;
                const st = statusCfg[m.status as string] ?? statusCfg.PLANNED;
                const isExpanded = expandedId === id;

                return (
                  <>
                    <tr
                      key={id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => toggleExpand(id)}
                    >
                      <td className="px-5 py-3 font-medium text-gray-800">{m.employee_name as string}</td>
                      <td className="px-5 py-3 text-gray-700">{m.title as string}</td>
                      <td className="px-5 py-3 text-gray-600">{m.destination as string}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {m.start_date as string} → {m.end_date as string}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right space-x-2" onClick={e => e.stopPropagation()}>
                        {/* Details toggle — visible to everyone */}
                        <button
                          onClick={() => toggleExpand(id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                            isExpanded
                              ? 'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200'
                              : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {isExpanded ? '▲ Réduire' : '▼ Détails'}
                        </button>

                        {/* Admin-only actions */}
                        {canManageMissions && m.status === 'PLANNED' && (
                          <button
                            onClick={() => handleApprove(id)}
                            className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100"
                          >
                            Approuver
                          </button>
                        )}
                        {canManageMissions && (
                          <button
                            onClick={() => openEdit(m)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                          >
                            Modifier
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* ── Expanded detail row ── */}
                    {isExpanded && (
                      <tr key={`${id}-detail`} className="bg-slate-50/60 border-b border-gray-100">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 text-sm">

                            <Detail label="Employé"      value={m.employee_name as string} />
                            <Detail label="Titre / Objet" value={m.title as string} />
                            <Detail label="Destination"   value={m.destination as string} />

                            <Detail label="Date de départ" value={m.start_date as string} />
                            <Detail label="Date de retour" value={m.end_date as string} />
                            <Detail
                              label="Durée"
                              value={calcDuration(m.start_date as string, m.end_date as string)}
                            />

                            <Detail
                              label="Statut"
                              value={st.label}
                              badge={st.cls}
                            />
                            <Detail
                              label="Budget"
                              value={m.budget != null ? `${m.budget} DH` : '—'}
                            />
                            <Detail
                              label="Approuvé par"
                              value={(m.approved_by_name as string) || (m.approved_by ? `ID: ${m.approved_by}` : '—')}
                            />

                            {(m.description as string) && (
                              <div className="col-span-2 md:col-span-3">
                                <p className="text-xs font-medium text-gray-500 mb-0.5 uppercase tracking-wide">Description</p>
                                <p className="text-gray-700 whitespace-pre-wrap">{m.description as string}</p>
                              </div>
                            )}

                            {(m.notes as string) && (
                              <div className="col-span-2 md:col-span-3">
                                <p className="text-xs font-medium text-gray-500 mb-0.5 uppercase tracking-wide">Notes</p>
                                <p className="text-gray-700 whitespace-pre-wrap">{m.notes as string}</p>
                              </div>
                            )}

                            <Detail
                              label="Créée le"
                              value={m.created_at ? new Date(m.created_at as string).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Detail cell ─────────────────────────────────────────────────────────────

function Detail({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      {badge ? (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${badge}`}>{value}</span>
      ) : (
        <p className="text-gray-800">{value || '—'}</p>
      )}
    </div>
  );
}

// Calculate duration in days
function calcDuration(start: string, end: string): string {
  if (!start || !end) return '—';
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
  if (isNaN(diff) || diff < 0) return '—';
  return diff === 0 ? '1 jour' : `${Math.round(diff) + 1} jours`;
}

// ─── Mission Form (create + edit) ────────────────────────────────────────────

interface MissionFormProps {
  initial?: Mission;
  onDone: (msg?: string) => void;
  onCancel: () => void;
}

function MissionForm({ initial, onDone, onCancel }: MissionFormProps) {
  const isEdit = !!initial;

  const [form, setForm] = useState({
    employee:    (initial?.employee    as string) ?? '',
    title:       (initial?.title       as string) ?? '',
    destination: (initial?.destination as string) ?? '',
    start_date:  (initial?.start_date  as string) ?? '',
    end_date:    (initial?.end_date    as string) ?? '',
    description: (initial?.description as string) ?? '',
    budget:      initial?.budget != null ? String(initial.budget) : '',
    notes:       (initial?.notes       as string) ?? '',
  });
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    getEmployees({ page_size: '500' })
      .then(r => setEmployees(r.data.results ?? r.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setError('La date de retour ne peut pas être antérieure à la date de départ.');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, budget: form.budget ? parseFloat(form.budget) : null };
      if (isEdit) {
        await updateMission(initial!.id as string, payload);
        onDone('Mission mise à jour avec succès.');
      } else {
        await createMission(payload);
        onDone('Mission créée avec succès.');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? (isEdit ? 'Erreur lors de la mise à jour.' : 'Erreur lors de la création.');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        {isEdit ? 'Modifier la mission' : 'Nouvelle mission'}
      </h3>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {!isEdit && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Employé <span className="text-red-500">*</span></label>
            <select
              value={form.employee}
              onChange={e => set('employee', e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Sélectionner un employé --</option>
              {employees.map(emp => (
                <option key={emp.id as string} value={emp.id as string}>
                  {emp.full_name as string} — {emp.employee_id as string}
                </option>
              ))}
            </select>
          </div>
        )}

        <In label="Titre / Objet"  value={form.title}       onChange={v => set('title', v)}       required />
        <In label="Destination"    value={form.destination} onChange={v => set('destination', v)} required />
        <In label="Budget (DH)"    value={form.budget}      onChange={v => set('budget', v)}      type="number" />

        <div>
          <label className="block text-xs text-gray-600 mb-1">Date départ <span className="text-red-500">*</span></label>
          <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Date retour <span className="text-red-500">*</span></label>
          <input type="date" value={form.end_date} min={form.start_date || undefined} onChange={e => set('end_date', e.target.value)} required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500" />
        </div>

        {/* Description & notes — full width */}
        <div className="col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50">
          {saving ? (isEdit ? 'Mise à jour...' : 'Enregistrement...') : (isEdit ? 'Mettre à jour' : 'Créer')}
        </button>
      </div>
    </form>
  );
}

// ─── Small reusable input ─────────────────────────────────────────────────────

function In({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  );
}
