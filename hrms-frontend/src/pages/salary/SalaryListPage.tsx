import { useEffect, useState } from 'react';
import {
  getPayslips, generatePayslip, bulkGeneratePayslips,
  confirmPayslip, getSalaryStructures,
} from '../../api/salary.api';
import { getEmployees, getDepartments } from '../../api/employees.api';
import Pagination from '../../components/ui/Pagination';

type R = Record<string, unknown>;

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const statusCfg: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600' },
  CONFIRMED: { label: 'Confirmé',  cls: 'bg-blue-50 text-blue-700' },
  PAID:      { label: 'Payé',      cls: 'bg-green-50 text-green-700' },
};

const now = new Date();

export default function SalaryListPage() {
  const [payslips, setPayslips]     = useState<R[]>([]);
  const [employees, setEmployees]   = useState<R[]>([]);
  const [departments, setDepartments] = useState<R[]>([]);
  const [structures, setStructures] = useState<R[]>([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [count, setCount]           = useState(0);

  /* Filters */
  const [filterYear, setFilterYear]   = useState(String(now.getFullYear()));
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterStatus, setFilterStatus] = useState('');

  /* Modals */
  const [showGenModal, setShowGenModal]   = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDetail, setShowDetail]       = useState<R | null>(null);

  /* Generate form */
  const [genForm, setGenForm] = useState({ employee_id: '', year: now.getFullYear(), month: now.getMonth() + 1 });
  const [genLoading, setGenLoading] = useState(false);

  /* Bulk form */
  const [bulkForm, setBulkForm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1, department_id: '' });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ success: number; errors: R[] } | null>(null);

  const PER_PAGE = 20;

  const fetchPayslips = (p = 1) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(p), page_size: String(PER_PAGE) };
    if (filterYear)   params.year   = filterYear;
    if (filterMonth)  params.month  = filterMonth;
    if (filterStatus) params.status = filterStatus;
    getPayslips(params)
      .then(r => { setPayslips(r.data.results ?? r.data); setCount(r.data.count ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getEmployees({ page_size: '200' }).then(r => setEmployees(r.data.results ?? r.data)).catch(() => {});
    getDepartments().then(r => setDepartments(r.data.results ?? r.data)).catch(() => {});
    getSalaryStructures().then(r => setStructures(r.data.results ?? r.data)).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); fetchPayslips(1); }, [filterYear, filterMonth, filterStatus]);

  const totalPages = Math.ceil(count / PER_PAGE);

  /* Stats from current list */
  const totalNet = payslips.reduce((s, p) => s + Number(p.net_salary || 0), 0);
  const paid     = payslips.filter(p => p.status === 'PAID').length;
  const drafts   = payslips.filter(p => p.status === 'DRAFT').length;

  const handleGenerate = async () => {
    if (!genForm.employee_id) return alert('Sélectionnez un employé.');
    setGenLoading(true);
    try {
      await generatePayslip(genForm);
      setShowGenModal(false);
      setGenForm({ employee_id: '', year: now.getFullYear(), month: now.getMonth() + 1 });
      fetchPayslips(page);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(msg || 'Erreur lors de la génération.');
    } finally { setGenLoading(false); }
  };

  const handleBulk = async () => {
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const data: Record<string, unknown> = { year: bulkForm.year, month: bulkForm.month };
      if (bulkForm.department_id) data.department_id = bulkForm.department_id;
      const r = await bulkGeneratePayslips(data as { year: number; month: number; department_id?: string });
      setBulkResult(r.data);
      fetchPayslips(1);
    } catch { alert('Erreur lors de la génération groupée.'); }
    finally { setBulkLoading(false); }
  };

  const handleConfirm = async (id: string) => {
    if (!confirm('Confirmer ce bulletin ?')) return;
    try { await confirmPayslip(id); fetchPayslips(page); }
    catch { alert('Erreur.'); }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Paie & Bulletins</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des bulletins de salaire</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkModal(true)}
            className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Génération groupée
          </button>
          <button onClick={() => setShowGenModal(true)}
            className="px-3 py-2 text-xs font-medium bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] transition-colors">
            + Générer un bulletin
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Bulletins" value={count} cls="text-gray-900" />
        <StatCard label="Payés" value={paid} cls="text-green-600" />
        <StatCard label="Brouillons" value={drafts} cls="text-gray-400" />
        <StatCard label="Masse salariale nette" value={`${totalNet.toLocaleString('fr-FR')} DH`} cls="text-blue-600" small />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="">Tous les mois</option>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="">Tous les statuts</option>
          {Object.entries(statusCfg).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : payslips.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucun bulletin trouvé.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Brut</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">IR</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payslips.map(p => {
                  const st = statusCfg[p.status as string] || statusCfg.DRAFT;
                  return (
                    <tr key={p.id as string} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-800">{p.employee_name as string}</td>
                      <td className="px-5 py-3 text-gray-600">{MONTHS[(p.month as number) - 1]} {p.year as number}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{Number(p.base_salary).toLocaleString('fr-FR')} DH</td>
                      <td className="px-5 py-3 text-right text-gray-600">{Number(p.gross_salary).toLocaleString('fr-FR')} DH</td>
                      <td className="px-5 py-3 text-right text-red-500">-{Number(p.tax_amount).toLocaleString('fr-FR')} DH</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{Number(p.net_salary).toLocaleString('fr-FR')} DH</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setShowDetail(p)}
                            className="px-2.5 py-1 text-xs font-medium border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors">
                            Détail
                          </button>
                          {p.status === 'DRAFT' && (
                            <button onClick={() => handleConfirm(p.id as string)}
                              className="px-2.5 py-1 text-xs font-medium border border-blue-200 rounded text-blue-700 hover:bg-blue-50 transition-colors">
                              Confirmer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={p => { setPage(p); fetchPayslips(p); }} />
          </>
        )}
      </div>

      {/* ── Modal: Générer un bulletin ── */}
      {showGenModal && (
        <Modal title="Générer un bulletin" onClose={() => setShowGenModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Employé</label>
              <select value={genForm.employee_id} onChange={e => setGenForm(f => ({ ...f, employee_id: e.target.value }))}
                className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="">Sélectionner un employé</option>
                {employees.map(e => <option key={e.id as string} value={e.id as string}>{e.full_name as string}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Année</label>
                <select value={genForm.year} onChange={e => setGenForm(f => ({ ...f, year: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Mois</label>
                <select value={genForm.month} onChange={e => setGenForm(f => ({ ...f, month: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
                  {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
            </div>
            {structures.length === 0 && (
              <p className="text-xs text-amber-600">Aucune structure salariale configurée.</p>
            )}
            <button onClick={handleGenerate} disabled={genLoading}
              className="w-full py-2 text-xs font-medium bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] disabled:opacity-50 transition-colors">
              {genLoading ? 'Génération...' : 'Générer'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Génération groupée ── */}
      {showBulkModal && (
        <Modal title="Génération groupée" onClose={() => { setShowBulkModal(false); setBulkResult(null); }}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Année</label>
                <select value={bulkForm.year} onChange={e => setBulkForm(f => ({ ...f, year: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Mois</label>
                <select value={bulkForm.month} onChange={e => setBulkForm(f => ({ ...f, month: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
                  {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Département (optionnel)</label>
              <select value={bulkForm.department_id} onChange={e => setBulkForm(f => ({ ...f, department_id: e.target.value }))}
                className="mt-1 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="">Tous les départements</option>
                {departments.map(d => <option key={d.id as string} value={d.id as string}>{d.name as string}</option>)}
              </select>
            </div>
            <p className="text-xs text-gray-400">Les bulletins déjà existants pour cette période seront ignorés.</p>
            <button onClick={handleBulk} disabled={bulkLoading}
              className="w-full py-2 text-xs font-medium bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] disabled:opacity-50 transition-colors">
              {bulkLoading ? 'Génération en cours...' : 'Lancer la génération'}
            </button>
            {bulkResult && (
              <div className={`rounded-lg p-3 text-xs ${bulkResult.errors.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                <p className="font-medium">{bulkResult.success} bulletin(s) généré(s) avec succès.</p>
                {bulkResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {bulkResult.errors.map((err, i) => (
                      <p key={i} className="text-amber-600">{err.employee as string} — {err.error as string}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Modal: Détail bulletin ── */}
      {showDetail && (
        <Modal title={`Bulletin — ${showDetail.employee_name as string}`} onClose={() => setShowDetail(null)}>
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-500">Période :</span> <span className="font-medium text-gray-800">{MONTHS[(showDetail.month as number) - 1]} {showDetail.year as number}</span></div>
              <div><span className="text-gray-500">Statut :</span> <span className={`px-2 py-0.5 rounded font-medium ${statusCfg[showDetail.status as string]?.cls}`}>{statusCfg[showDetail.status as string]?.label}</span></div>
            </div>

            {/* Lines */}
            {(showDetail.lines as R[])?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Détail des composantes</p>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Composante</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Type</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(showDetail.lines as R[]).map(l => (
                        <tr key={l.id as string}>
                          <td className="px-3 py-2 text-gray-700">{l.component_name as string}</td>
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${l.component_type === 'ALLOWANCE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                              {l.component_type === 'ALLOWANCE' ? 'Indemnité' : 'Retenue'}
                            </span>
                          </td>
                          <td className={`px-3 py-2 text-right font-medium ${l.component_type === 'ALLOWANCE' ? 'text-green-700' : 'text-red-600'}`}>
                            {l.component_type === 'ALLOWANCE' ? '+' : '-'}{Number(l.amount).toLocaleString('fr-FR')} DH
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600"><span>Salaire de base</span><span>{Number(showDetail.base_salary).toLocaleString('fr-FR')} DH</span></div>
              <div className="flex justify-between text-green-700"><span>+ Indemnités</span><span>+{Number(showDetail.total_allowances).toLocaleString('fr-FR')} DH</span></div>
              <div className="flex justify-between text-gray-600"><span>= Salaire brut</span><span className="font-medium">{Number(showDetail.gross_salary).toLocaleString('fr-FR')} DH</span></div>
              <div className="flex justify-between text-red-500"><span>- Retenues</span><span>-{Number(showDetail.total_deductions).toLocaleString('fr-FR')} DH</span></div>
              <div className="flex justify-between text-red-500"><span>- IR (Impôt)</span><span>-{Number(showDetail.tax_amount).toLocaleString('fr-FR')} DH</span></div>
              <div className="flex justify-between text-gray-900 font-semibold border-t border-gray-200 pt-1.5 mt-1"><span>Net à payer</span><span>{Number(showDetail.net_salary).toLocaleString('fr-FR')} DH</span></div>
            </div>

            {showDetail.status === 'DRAFT' && (
              <button onClick={() => { handleConfirm(showDetail.id as string); setShowDetail(null); }}
                className="w-full py-2 text-xs font-medium bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] transition-colors">
                Confirmer ce bulletin
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, cls, small }: { label: string; value: string | number; cls: string; small?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-bold mt-1 ${small ? 'text-lg' : 'text-2xl'} ${cls}`}>{value}</p>
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
