import { useEffect, useState, useMemo } from 'react';
import { getEmployees, getDepartments, updateEmployee, createDepartment, getPositions } from '../../api/employees.api';

type R = Record<string, unknown>;

function Avatar({ name }: { name: string }) {
  const initials = String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-600'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>{initials}</div>;
}

function AvatarLg({ name }: { name: string }) {
  const initials = String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-600'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return <div className={`w-14 h-14 ${color} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>{initials}</div>;
}

export default function DepartementsPage() {
  const [employees, setEmployees] = useState<R[]>([]);
  const [depts, setDepts] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<R | null>(null);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});

  const fetchEmployees = () =>
    getEmployees({ page_size: '500' })
      .then(r => setEmployees(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  const fetchDepts = () =>
    getDepartments().then(r => setDepts(r.data.results || r.data)).catch(() => {});

  useEffect(() => { fetchEmployees(); fetchDepts(); }, []);

  /* only professors */
  const professors = useMemo(() =>
    employees.filter(e => e.employee_type === 'PROFESSOR'), [employees]);

  const filtered = useMemo(() => {
    if (!search) return professors;
    const q = search.toLowerCase();
    return professors.filter(e =>
      String(e.full_name || '').toLowerCase().includes(q) ||
      String(e.department_name || '').toLowerCase().includes(q)
    );
  }, [professors, search]);

  /* group by department, chef first */
  const byDept = useMemo(() => {
    const map: Record<string, { deptId: string; deptName: string; chef: R | null; members: R[] }> = {};
    filtered.forEach(e => {
      const key = String(e.department_id || e.department_name || 'other');
      if (!map[key]) map[key] = { deptId: key, deptName: String(e.department_name || 'Département'), chef: null, members: [] };
      if (e.role === 'DEPARTMENT_HEAD' || e.user_role === 'DEPARTMENT_HEAD') {
        map[key].chef = e;
      } else {
        map[key].members.push(e);
      }
    });
    /* also check depts list for chef info */
    depts.forEach(d => {
      const key = String(d.id);
      if (map[key] && d.head_name) {
        const chefInMembers = map[key].members.find(m => m.full_name === d.head_name);
        if (chefInMembers) {
          map[key].chef = chefInMembers;
          map[key].members = map[key].members.filter(m => m.id !== chefInMembers.id);
        }
      }
    });
    return Object.values(map);
  }, [filtered, depts]);

  /* init all open */
  useEffect(() => {
    const init: Record<string, boolean> = {};
    byDept.forEach(g => { init[g.deptId] = true; });
    setOpenDepts(init);
  }, [byDept.length]);

  const toggle = (key: string) => setOpenDepts(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Départements</h1>
          <p className="text-sm text-gray-500 mt-0.5">{byDept.length} département{byDept.length > 1 ? 's' : ''} · {professors.length} enseignant{professors.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowDeptForm(true)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          + Département
        </button>
      </div>

      {/* search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un enseignant ou département..."
          className="w-72 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : byDept.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Aucun département trouvé.</div>
      ) : (
        <div className="space-y-4 overflow-y-auto flex-1 pb-4">
          {byDept.map(({ deptId, deptName, chef, members }) => {
            const open = openDepts[deptId] !== false;
            const total = (chef ? 1 : 0) + members.length;
            return (
              <div key={deptId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* dept header */}
                <button
                  onClick={() => toggle(deptId)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#0f172a] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">{deptName}</p>
                      <p className="text-xs text-gray-400">{total} enseignant{total > 1 ? 's' : ''}{chef ? ' · 1 chef de département' : ''}</p>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {open && (
                  <div className="border-t border-gray-100">
                    {/* chef first */}
                    {chef && (
                      <button
                        onClick={() => setSelected(chef)}
                        className="w-full flex items-center gap-3 px-5 py-3 bg-amber-50/60 border-b border-amber-100 hover:bg-amber-50 transition-colors text-left"
                      >
                        <Avatar name={String(chef.full_name || '')} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">{String(chef.full_name || '')}</p>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full flex-shrink-0">Chef de département</span>
                          </div>
                          <p className="text-xs text-gray-400 truncate">{String(chef.position_title || '')}</p>
                        </div>
                      </button>
                    )}
                    {/* members grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
                      {members.map(emp => (
                        <button
                          key={emp.id as string}
                          onClick={() => setSelected(emp)}
                          className="bg-white p-4 flex items-center gap-3 hover:bg-blue-50/50 transition-colors text-left"
                        >
                          <Avatar name={String(emp.full_name || '')} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{String(emp.full_name || '')}</p>
                            <p className="text-xs text-gray-400 truncate">{String(emp.position_title || '')}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* modals */}
      {selected && (
        <EmployeeModal
          employee={selected}
          onClose={() => setSelected(null)}
          onSaved={updated => {
            setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
            setSelected(updated);
          }}
        />
      )}
      {showDeptForm && (
        <DepartmentFormModal
          onClose={() => setShowDeptForm(false)}
          onSuccess={() => { setShowDeptForm(false); fetchDepts(); }}
        />
      )}
    </div>
  );
}

/* ── Employee Detail/Edit Modal ── */
function EmployeeModal({ employee, onClose, onSaved }: { employee: R; onClose: () => void; onSaved: (u: R) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<R>({ ...employee });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <AvatarLg name={String(employee.full_name || '')} />
            <div>
              <p className="font-bold text-white text-base">{String(employee.full_name || '')}</p>
              <p className="text-xs text-slate-400">{String(employee.employee_id || '')}</p>
              <p className="text-xs text-slate-400">{String(employee.department_name || '')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          <div className="flex justify-end">
            {!editing && (
              <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]">
                Modifier
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
          </Section>

          <Section title="Profil enseignant">
            <Row label="Spécialisation" value={String(employee.specialization || '')} />
            <Row label="Grade académique" value={String(employee.academic_rank || '')} />
            {employee.teaching_hours && <Row label="Heures/semaine" value={`${employee.teaching_hours}h`} />}
          </Section>
        </div>

        {editing && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
            <button onClick={() => { setForm({ ...employee }); setEditing(false); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Annuler</button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Nouveau Département</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom du département</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Sciences Informatiques" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
            <input value={code} onChange={e => setCode(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: INFO" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50">
              {saving ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
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
