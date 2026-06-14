import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getEmployees, getDepartments, updateEmployee, createDepartment, createEmployee, getPositions, toggleCanSign } from '../../api/employees.api';
import api from '../../api/axiosInstance';

type R = Record<string, unknown>;

/* ── helpers ── */
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-600'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm';
  return <div className={`${cls} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>{initials}</div>;
}

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
      {active ? 'Actif' : 'Inactif'}
    </span>
  );
}

/* ── main page ── */
export default function EmployeeListPage() {
  const [all, setAll] = useState<R[]>([]);
  const [depts, setDepts] = useState<R[]>([]);
  const [positions, setPositions] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'personnel' | 'administratif'>(
    searchParams.get('tab') === 'administratif' ? 'administratif' : 'personnel'
  );
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<R | null>(null);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/employees/import/excel/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { created, updated, errors } = res.data;
      alert(`✅ Importé: ${created} créé(s), ${updated} mis à jour.${errors.length ? '\n⚠️ Erreurs:\n' + errors.join('\n') : ''}`);
      fetchAll();
    } catch { alert('Erreur lors de l\'importation.'); }
    finally { setImporting(false); e.target.value = ''; }
  };

  const fetchAll = () => {
    getEmployees({ page_size: '500' })
      .then(r => setAll(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    getDepartments().then(r => setDepts(r.data.results || r.data)).catch(() => {});
    getPositions().then(r => setPositions(r.data.results || r.data)).catch(() => {});
  }, []);

  /* professors grouped by department */
  const professors = useMemo(() => all.filter(e => e.employee_type === 'PROFESSOR'), [all]);
  const staff = useMemo(() => all.filter(e => e.employee_type === 'STAFF'), [all]);

  const filteredProfs = useMemo(() => {
    if (!search) return professors;
    const q = search.toLowerCase();
    return professors.filter(e =>
      String(e.full_name || '').toLowerCase().includes(q) ||
      String(e.department_name || '').toLowerCase().includes(q)
    );
  }, [professors, search]);

  const filteredStaff = useMemo(() => {
    if (!search) return staff;
    const q = search.toLowerCase();
    return staff.filter(e =>
      String(e.full_name || '').toLowerCase().includes(q) ||
      String(e.position_title || '').toLowerCase().includes(q)
    );
  }, [staff, search]);

  /* group professors by department */
  const byDept = useMemo(() => {
    const map: Record<string, { dept: R; members: R[] }> = {};
    filteredProfs.forEach(e => {
      const key = String(e.department_id || e.department_name || 'other');
      if (!map[key]) map[key] = { dept: { id: e.department_id, name: e.department_name }, members: [] };
      map[key].members.push(e);
    });
    return Object.values(map);
  }, [filteredProfs]);

  return (
    <div className="h-full flex flex-col">
      {/* ── header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Personnel</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tab === 'personnel' ? `${professors.length} enseignant(s)` : `${staff.length} administratif(s)`}
          </p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelImport} />
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {importing ? 'Importation...' : '📥 Importer Excel'}
          </button>
          <button onClick={() => setShowDeptForm(true)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            + Département
          </button>
          <button onClick={() => setShowEmpForm(true)} className="px-3 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]">
            + Personnel
          </button>
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {(['personnel', 'administratif'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(''); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'personnel' ? '🎓 Personnel enseignant' : '🏢 Administratif'}
          </button>
        ))}
      </div>

      {/* ── search ── */}
      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tab === 'personnel' ? 'Rechercher un enseignant ou département...' : 'Rechercher un administratif...'}
          className="w-72 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* ── content ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'personnel' ? (
        <PersonnelTab byDept={byDept} onSelect={setSelected} />
      ) : (
        <AdministratifTab staff={filteredStaff} onSelect={setSelected} />
      )}

      {/* ── modals ── */}
      {selected && (
        <EmployeeModal
          employee={selected}
          onClose={() => setSelected(null)}
          onSaved={updated => {
            setAll(prev => prev.map(e => e.id === updated.id ? updated : e));
            setSelected(updated);
          }}
        />
      )}
      {showDeptForm && (
        <DepartmentFormModal
          onClose={() => setShowDeptForm(false)}
          onSuccess={() => { setShowDeptForm(false); getDepartments().then(r => setDepts(r.data.results || r.data)).catch(() => {}); }}
        />
      )}
      {showEmpForm && (
        <EmployeeFormModal
          departments={depts}
          positions={positions}
          onClose={() => setShowEmpForm(false)}
          onSuccess={() => { setShowEmpForm(false); fetchAll(); }}
        />
      )}
    </div>
  );
}

/* ── Personnel Tab: grouped by department ── */
function PersonnelTab({ byDept, onSelect }: { byDept: { dept: R; members: R[] }[]; onSelect: (e: R) => void }) {
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const init: Record<string, boolean> = {};
    byDept.forEach(g => { init[String(g.dept.id || g.dept.name)] = true; });
    setOpenDepts(init);
  }, [byDept]);

  const toggle = (key: string) => setOpenDepts(p => ({ ...p, [key]: !p[key] }));

  if (byDept.length === 0)
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Aucun enseignant trouvé.</div>;

  return (
    <div className="space-y-4 overflow-y-auto flex-1">
      {byDept.map(({ dept, members }) => {
        const key = String(dept.id || dept.name);
        const open = openDepts[key] !== false;
        return (
          <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* dept header */}
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0f172a] rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{String(dept.name || 'Département')}</p>
                  <p className="text-xs text-gray-400">{members.length} enseignant{members.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* members grid */}
            {open && (
              <div className="border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
                {members.map(emp => (
                  <button
                    key={emp.id as string}
                    onClick={() => onSelect(emp)}
                    className="bg-white p-4 flex items-center gap-3 hover:bg-blue-50/50 transition-colors text-left"
                  >
                    <Avatar name={String(emp.full_name || '')} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{String(emp.full_name || '')}</p>
                      <p className="text-xs text-gray-400 truncate">{String(emp.position_title || '')}</p>
                      <Badge active={!!emp.is_active} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Administratif Tab ── */
function AdministratifTab({ staff, onSelect }: { staff: R[]; onSelect: (e: R) => void }) {
  if (staff.length === 0)
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Aucun administratif trouvé.</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Poste</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Département</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">N° Somme</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {staff.map(emp => (
            <tr
              key={emp.id as string}
              onClick={() => onSelect(emp)}
              className="hover:bg-blue-50/40 cursor-pointer transition-colors"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={String(emp.full_name || '')} size="sm" />
                  <span className="font-medium text-gray-800">{String(emp.full_name || '')}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-gray-600">{String(emp.position_title || '—')}</td>
              <td className="px-5 py-3 text-gray-600">{String(emp.department_name || '—')}</td>
              <td className="px-5 py-3 font-mono text-gray-500 text-xs">{String(emp.numero_somme || '—')}</td>
              <td className="px-5 py-3"><Badge active={!!emp.is_active} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Employee Detail / Edit Modal ── */
function EmployeeModal({ employee, onClose, onSaved }: { employee: R; onClose: () => void; onSaved: (u: R) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<R>({ ...employee });
  const [saving, setSaving] = useState(false);
  const [canSign, setCanSign] = useState<boolean>(!!employee.can_sign);
  const [togglingSign, setTogglingSign] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleToggleCanSign = async () => {
    setTogglingSign(true);
    try {
      const res = await toggleCanSign(employee.id as string);
      setCanSign(res.data.can_sign);
    } catch { alert('Erreur.'); }
    finally { setTogglingSign(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateEmployee(employee.id as string, { address: form.address, phone: form.phone });
      onSaved(res.data);
      setEditing(false);
    } catch { alert('Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <Avatar name={String(employee.full_name || '')} size="lg" />
            <div>
              <p className="font-bold text-white text-base">{String(employee.full_name || '')}</p>
              <p className="text-xs text-slate-400">{String(employee.employee_id || '')}</p>
              <p className="text-xs text-slate-400">{employee.employee_type === 'PROFESSOR' ? '🎓 Enseignant' : '🏢 Administratif'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          <div className="flex items-center justify-between">
            <Badge active={!!employee.is_active} />
            {!editing && (
              <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]">
                ✏️ Modifier
              </button>
            )}
          </div>

          <Section title="Informations personnelles">
            <Row label="Nom complet" value={String(employee.full_name || '')} />
            <Row label="CIN" value={String(employee.cin || '')} />
            <Row label="Date de naissance" value={String(employee.date_of_birth || '')} />
            <Row label="Email" value={String(employee.email || '')} />
            {editing
              ? <EditRow label="Téléphone" value={String(form.phone || '')} onChange={v => set('phone', v)} />
              : <Row label="Téléphone" value={String(employee.phone || '')} />}
            {editing
              ? <EditRow label="Adresse" value={String(form.address || '')} onChange={v => set('address', v)} />
              : <Row label="Adresse" value={String(employee.address || '')} />}
          </Section>

          <Section title="Informations professionnelles">
            <Row label="Département" value={String(employee.department_name || '')} />
            <Row label="Poste" value={String(employee.position_title || '')} />
            <Row label="Date d'embauche" value={String(employee.hire_date || '')} />
            <Row label="N° Somme (PPR)" value={String(employee.numero_somme || '')} />
            <Row label="Type de contrat" value={String(employee.contract_type || '')} />
          </Section>

          {/* Can Sign toggle */}
          {employee.employee_type === 'PROFESSOR' && (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <div>
                <p className="text-xs font-semibold text-gray-700">Autoriser la signature</p>
                <p className="text-xs text-gray-400 mt-0.5">L'enseignant peut signer ses attestations avant envoi à l'admin.</p>
              </div>
              <button
                onClick={handleToggleCanSign}
                disabled={togglingSign}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                  canSign ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  canSign ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          )}

          {employee.employee_type === 'PROFESSOR' && (
            <Section title="Profil enseignant">
              <Row label="Spécialisation" value={String(employee.specialization || '')} />
              <Row label="Grade académique" value={String(employee.academic_rank || '')} />
              {employee.teaching_hours && <Row label="Heures/semaine" value={`${employee.teaching_hours}h`} />}
            </Section>
          )}
        </div>

        {editing && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
            <button onClick={() => { setForm({ ...employee }); setEditing(false); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Department Form Modal ── */
function DepartmentFormModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await createDepartment({ name, code }); onSuccess(); }
    catch { alert('Erreur lors de la création.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Nouveau Département" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Field label="Nom du département">
          <input value={name} onChange={e => setName(e.target.value)} required className={inp} placeholder="Ex: Sciences Informatiques" />
        </Field>
        <Field label="Code">
          <input value={code} onChange={e => setCode(e.target.value)} required className={inp} placeholder="Ex: INFO" />
        </Field>
        <ModalFooter onCancel={onClose} saving={saving} label="Créer" />
      </form>
    </Modal>
  );
}

/* ── Employee Form Modal ── */
function EmployeeFormModal({ departments, positions, onClose, onSuccess }: { departments: R[]; positions: R[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', cin: '', date_of_birth: '', phone: '', employee_type: 'STAFF', department_id: '', position_id: '', hire_date: '', numero_somme: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await createEmployee(form); onSuccess(); }
    catch { alert('Erreur lors de la création.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Nouveau Personnel" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prénom *"><input value={form.first_name} onChange={e => set('first_name', e.target.value)} required className={inp} /></Field>
          <Field label="Nom *"><input value={form.last_name} onChange={e => set('last_name', e.target.value)} required className={inp} /></Field>
          <Field label="Email *"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className={inp} /></Field>
          <Field label="CIN *"><input value={form.cin} onChange={e => set('cin', e.target.value)} required className={inp} /></Field>
          <Field label="Date de naissance *"><input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} required className={inp} /></Field>
          <Field label="Téléphone"><input value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} /></Field>
          <Field label="Type *">
            <select value={form.employee_type} onChange={e => set('employee_type', e.target.value)} className={inp}>
              <option value="STAFF">Administratif</option>
              <option value="PROFESSOR">Enseignant</option>
            </select>
          </Field>
          <Field label="Département *">
            <select value={form.department_id} onChange={e => set('department_id', e.target.value)} required className={inp}>
              <option value="">Sélectionner...</option>
              {departments.map(d => <option key={d.id as string} value={d.id as string}>{d.name as string}</option>)}
            </select>
          </Field>
          <Field label="Poste *">
            <select value={form.position_id} onChange={e => set('position_id', e.target.value)} required className={inp}>
              <option value="">Sélectionner...</option>
              {positions.map(p => <option key={p.id as string} value={p.id as string}>{p.title as string}</option>)}
            </select>
          </Field>
          <Field label="Date d'embauche *"><input type="date" value={form.hire_date} onChange={e => set('hire_date', e.target.value)} required className={inp} /></Field>
          <Field label="N° Somme" cls="col-span-2"><input value={form.numero_somme} onChange={e => set('numero_somme', e.target.value)} className={inp} /></Field>
        </div>
        <ModalFooter onCancel={onClose} saving={saving} label="Créer" />
      </form>
    </Modal>
  );
}

/* ── shared UI ── */
const inp = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500';

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} bg-white rounded-xl shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, saving, label }: { onCancel: () => void; saving: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
      <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50">
        {saving ? 'En cours...' : label}
      </button>
    </div>
  );
}

function Field({ label, children, cls }: { label: string; children: React.ReactNode; cls?: string }) {
  return (
    <div className={cls}>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start px-3 py-2 gap-2">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-800 text-right font-medium">{value}</span>
    </div>
  );
}

function EditRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex justify-between items-center px-3 py-2 gap-2">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <input value={value || ''} onChange={e => onChange(e.target.value)} className="text-xs text-right border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 w-44" />
    </div>
  );
}
