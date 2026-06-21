import { useEffect, useState } from 'react';
import {
  getEvaluations, getEvaluationPeriods,
  createEvaluationPeriod, updateEvaluationPeriod,
  createEvaluation, completeEvaluation,
} from '../../api/performance.api';
import { getEmployees } from '../../api/employees.api';
import PromotionsPage from '../promotions/PromotionsPage';

type R = Record<string, unknown>;

const statusConfig: Record<string, { label: string; cls: string }> = {
  DRAFT:              { label: 'Brouillon',         cls: 'bg-gray-100 text-gray-600' },
  SELF_EVALUATION:    { label: 'Auto-évaluation',   cls: 'bg-blue-50 text-blue-700' },
  SUPERVISOR_REVIEW:  { label: 'Revue superviseur', cls: 'bg-amber-50 text-amber-700' },
  COMPLETED:          { label: 'Complété',          cls: 'bg-green-50 text-green-700' },
};

const ratingCls: Record<string, string> = {
  Excellent:   'bg-green-100 text-green-700',
  'Tres Bien': 'bg-blue-100 text-blue-700',
  Bien:        'bg-yellow-100 text-yellow-700',
  Passable:    'bg-orange-100 text-orange-700',
  Insuffisant: 'bg-red-100 text-red-700',
};

export default function EvaluationListPage() {
  const [mainTab, setMainTab] = useState<'evaluations' | 'promotions'>('evaluations');
  const [evaluations, setEvaluations]   = useState<R[]>([]);
  const [periods, setPeriods]           = useState<R[]>([]);
  const [employees, setEmployees]       = useState<R[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  /* Modals */
  const [showPeriodModal, setShowPeriodModal]   = useState(false);
  const [showEvalModal, setShowEvalModal]       = useState(false);
  const [showDetailModal, setShowDetailModal]   = useState(false);
  const [selectedEval, setSelectedEval]         = useState<R | null>(null);

  /* Period form */
  const [periodForm, setPeriodForm] = useState({ name: '', period_type: 'ANNUAL', start_date: '', end_date: '', is_active: false });
  const [savingPeriod, setSavingPeriod] = useState(false);

  /* Eval form */
  const [evalForm, setEvalForm] = useState({ employee: '', period: '' });
  const [savingEval, setSavingEval] = useState(false);

  const fetchAll = () => {
    const params: Record<string, string> = {};
    if (filterPeriod) params.period = filterPeriod;
    if (filterStatus) params.status = filterStatus;
    getEvaluations(params).then(r => setEvaluations(r.data.results ?? r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    getEvaluationPeriods().then(r => setPeriods(r.data.results ?? r.data)).catch(() => {});
    getEmployees({ role: 'PROFESSOR', page_size: '100' }).then(r => setEmployees(r.data.results ?? r.data)).catch(() => {});
  }, []);

  useEffect(() => { setLoading(true); fetchAll(); }, [filterPeriod, filterStatus]);

  /* Stats */
  const total     = evaluations.length;
  const completed = evaluations.filter(e => e.status === 'COMPLETED').length;
  const pending   = evaluations.filter(e => e.status !== 'COMPLETED' && e.status !== 'DRAFT').length;
  const drafts    = evaluations.filter(e => e.status === 'DRAFT').length;

  const handleCreatePeriod = async () => {
    if (!periodForm.name || !periodForm.start_date || !periodForm.end_date) return alert('Remplissez tous les champs.');
    setSavingPeriod(true);
    try {
      await createEvaluationPeriod(periodForm);
      setShowPeriodModal(false);
      setPeriodForm({ name: '', period_type: 'ANNUAL', start_date: '', end_date: '', is_active: false });
      getEvaluationPeriods().then(r => setPeriods(r.data.results ?? r.data)).catch(() => {});
    } catch { alert('Erreur lors de la création.'); }
    finally { setSavingPeriod(false); }
  };

  const handleToggleActive = async (p: R) => {
    try {
      await updateEvaluationPeriod(p.id as string, { is_active: !p.is_active });
      getEvaluationPeriods().then(r => setPeriods(r.data.results ?? r.data)).catch(() => {});
    } catch { alert('Erreur.'); }
  };

  const handleCreateEval = async () => {
    if (!evalForm.employee || !evalForm.period) return alert('Sélectionnez un employé et une période.');
    setSavingEval(true);
    try {
      await createEvaluation(evalForm);
      setShowEvalModal(false);
      setEvalForm({ employee: '', period: '' });
      fetchAll();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { non_field_errors?: string[] } } })?.response?.data?.non_field_errors?.[0];
      alert(msg || 'Erreur lors de la création.');
    }
    finally { setSavingEval(false); }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Confirmer la clôture de cette évaluation ?')) return;
    try {
      await completeEvaluation(id);
      fetchAll();
    } catch { alert('Erreur lors de la clôture.'); }
  };

  return (
    <div className="space-y-6">

      {/* Main tabs */}
      <div className="flex gap-1 border-b-2 border-gray-100 -mb-2">
        <button onClick={() => setMainTab('evaluations')}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-0.5 transition-colors ${
            mainTab === 'evaluations' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          Evaluations de performance
        </button>
        <button onClick={() => setMainTab('promotions')}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-0.5 transition-colors ${
            mainTab === 'promotions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          Promotions
        </button>
      </div>

      {mainTab === 'promotions' && <PromotionsPage />}
      {mainTab === 'evaluations' && <>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Évaluations de performance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des évaluations annuelles du personnel</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPeriodModal(true)}
            className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Gérer les périodes
          </button>
          <button onClick={() => setShowEvalModal(true)}
            className="px-3 py-2 text-xs font-medium bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] transition-colors">
            + Nouvelle évaluation
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',      value: total,     cls: 'text-gray-900' },
          { label: 'Complétées', value: completed, cls: 'text-green-600' },
          { label: 'En cours',   value: pending,   cls: 'text-amber-500' },
          { label: 'Brouillons', value: drafts,    cls: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="">Toutes les périodes</option>
          {periods.map(p => <option key={p.id as string} value={p.id as string}>{p.name as string}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="">Tous les statuts</option>
          {Object.entries(statusConfig).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : evaluations.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucune évaluation trouvée.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Évaluateur</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mention</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {evaluations.map(ev => {
                const st = statusConfig[ev.status as string] || statusConfig.DRAFT;
                const canComplete = ev.status === 'SUPERVISOR_REVIEW';
                return (
                  <tr key={ev.id as string} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-800">{ev.employee_name as string}</td>
                    <td className="px-5 py-3 text-gray-600">{ev.period_name as string}</td>
                    <td className="px-5 py-3 text-gray-500">{(ev.evaluator_name as string) || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {ev.overall_score != null ? `${ev.overall_score}/10` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {ev.overall_rating ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ratingCls[ev.overall_rating as string] || 'bg-gray-100 text-gray-600'}`}>
                          {ev.overall_rating as string}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => { setSelectedEval(ev); setShowDetailModal(true); }}
                          className="px-2.5 py-1 text-xs font-medium border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors">
                          Détail
                        </button>
                        {canComplete && (
                          <button onClick={() => handleComplete(ev.id as string)}
                            className="px-2.5 py-1 text-xs font-medium border border-green-200 rounded text-green-700 hover:bg-green-50 transition-colors">
                            Clôturer
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

      {/* ── Modal: Gérer les périodes ── */}
      {showPeriodModal && (
        <Modal title="Périodes d'évaluation" onClose={() => setShowPeriodModal(false)}>
          <div className="space-y-4">
            {/* Existing periods */}
            {periods.length > 0 && (
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Nom</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Type</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Début</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Fin</th>
                      <th className="px-3 py-2 text-center text-gray-500 font-medium">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {periods.map(p => (
                      <tr key={p.id as string}>
                        <td className="px-3 py-2 font-medium text-gray-800">{p.name as string}</td>
                        <td className="px-3 py-2 text-gray-500">{p.period_type as string}</td>
                        <td className="px-3 py-2 text-gray-500">{(p.start_date as string)?.slice(0, 10)}</td>
                        <td className="px-3 py-2 text-gray-500">{(p.end_date as string)?.slice(0, 10)}</td>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => handleToggleActive(p)}
                            className={`w-8 h-4 rounded-full transition-colors ${p.is_active ? 'bg-green-500' : 'bg-gray-200'}`}>
                            <span className={`block w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${p.is_active ? 'translate-x-4' : ''}`} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* New period form */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Nouvelle période</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Nom</label>
                  <input value={periodForm.name} onChange={e => setPeriodForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Évaluation 2024-2025"
                    className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Type</label>
                  <select value={periodForm.period_type} onChange={e => setPeriodForm(f => ({ ...f, period_type: e.target.value }))}
                    className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
                    <option value="ANNUAL">Annuel</option>
                    <option value="SEMESTER">Semestriel</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Active</label>
                  <div className="mt-2">
                    <input type="checkbox" checked={periodForm.is_active} onChange={e => setPeriodForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="mr-1.5" />
                    <span className="text-xs text-gray-600">Oui</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Date début</label>
                  <input type="date" value={periodForm.start_date} onChange={e => setPeriodForm(f => ({ ...f, start_date: e.target.value }))}
                    className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Date fin</label>
                  <input type="date" value={periodForm.end_date} onChange={e => setPeriodForm(f => ({ ...f, end_date: e.target.value }))}
                    className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
              </div>
              <button onClick={handleCreatePeriod} disabled={savingPeriod}
                className="mt-3 w-full py-2 text-xs font-medium bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] disabled:opacity-50 transition-colors">
                {savingPeriod ? 'Enregistrement...' : 'Créer la période'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Nouvelle évaluation ── */}
      {showEvalModal && (
        <Modal title="Nouvelle évaluation" onClose={() => setShowEvalModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Employé</label>
              <select value={evalForm.employee} onChange={e => setEvalForm(f => ({ ...f, employee: e.target.value }))}
                className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="">Sélectionner un employé</option>
                {employees.map(e => (
                  <option key={e.id as string} value={e.id as string}>{e.full_name as string}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Période</label>
              <select value={evalForm.period} onChange={e => setEvalForm(f => ({ ...f, period: e.target.value }))}
                className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="">Sélectionner une période</option>
                {periods.map(p => (
                  <option key={p.id as string} value={p.id as string}>{p.name as string}</option>
                ))}
              </select>
            </div>
            {periods.length === 0 && (
              <p className="text-xs text-amber-600">Aucune période disponible. Créez d'abord une période.</p>
            )}
            <button onClick={handleCreateEval} disabled={savingEval}
              className="w-full py-2 text-xs font-medium bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] disabled:opacity-50 transition-colors">
              {savingEval ? 'Création...' : 'Créer l\'évaluation'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Détail évaluation ── */}
      {showDetailModal && selectedEval && mainTab === 'evaluations' && (
        <Modal title={`Evaluation — ${selectedEval.employee_name as string}`} onClose={() => setShowDetailModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-500">Période :</span> <span className="font-medium text-gray-800">{selectedEval.period_name as string}</span></div>
              <div><span className="text-gray-500">Statut :</span> <span className={`px-2 py-0.5 rounded font-medium ${statusConfig[selectedEval.status as string]?.cls}`}>{statusConfig[selectedEval.status as string]?.label}</span></div>
              <div><span className="text-gray-500">Évaluateur :</span> <span className="font-medium text-gray-800">{(selectedEval.evaluator_name as string) || '—'}</span></div>
              <div><span className="text-gray-500">Score final :</span> <span className="font-medium text-gray-800">{selectedEval.overall_score != null ? `${selectedEval.overall_score}/10` : '—'}</span></div>
            </div>

            {/* Scores */}
            {(selectedEval.scores as R[])?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Scores par critère</p>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Critère</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Type</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(selectedEval.scores as R[]).map(s => (
                        <tr key={s.id as string}>
                          <td className="px-3 py-2 text-gray-700">{s.criterion_name as string}</td>
                          <td className="px-3 py-2 text-gray-400">{s.is_self_score ? 'Auto' : 'Superviseur'}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-800">{s.score as string}/10</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Comments */}
            {(selectedEval.self_comment as string) && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Commentaire auto-évaluation</p>
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{selectedEval.self_comment as string}</p>
              </div>
            )}
            {(selectedEval.evaluator_comment as string) && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Commentaire superviseur</p>
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{selectedEval.evaluator_comment as string}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
      </> }
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
