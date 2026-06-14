import { useEffect, useState, useMemo } from 'react';
import { getEmployees, updateEmployee, createEmployee, getDepartments, getPositions } from '../../api/employees.api';

type R = Record<string, unknown>;

function Avatar({ name }: { name: string }) {
  const initials = String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-600'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>{initials}</div>;
}

function AvatarLg({ name }: { name: string }) {
  const initials = String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-600'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return <div className={`w-14 h-14 ${color} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>{initials}</div>;
}

export default function AdministratifPage() {
  const [all, setAll] = useState<R[]>([]);
  const [depts, setDepts] = useState<R[]>([]);
  const [positions, setPositions] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<R | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchAll = () =>
    getEmployees({ page_size: '500' })
      .then(r => setAll(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchAll();
    getDepartments().then(r => setDepts(r.data.results || r.data)).catch(() => {});
    getPositions().then(r => setPositions(r.data.results || r.data)).catch(() => {});
  }, []);

  const staff = useMemo(() => {
    const s = all.filter(e => e.employee_type === 'STAFF');
    if (!search) return s;
    const q = search.toLowerCase();
    return s.filter(e =>
      String(e.full_name || '').toLowerCase().includes(q) ||
      String(e.position_title || '').toLowerCase().includes(q)
    );
  }, [all, search]);

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Administratif</h1>
          <p className="text-sm text-gray-500 mt-0.5">{staff.length} membre{staff.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]"
        >
          + Ajouter
        </button>
      </div>

      {/* search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un administratif..."
          className="w-72 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : staff.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Aucun administratif trouvé.</div>
      ) : (
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
                <tr key={emp.id as string} onClick={() => setSelected(emp)} className="hover:bg-blue-50/40 cursor-pointer transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={String(emp.full_name || '')} />
                      <span className="font-medium text-gray-800">{String(emp.full_name || '')}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{String(emp.position_title || '—')}</td>
                  <td className="px-5 py-3 text-gray-600">{String(emp.department_name || '—')}</td>
                  <td className="px-5 py-3 font-mono text-gray-500 text-xs">{String(emp.numero_somme || '—')}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${emp.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                      {emp.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <EmployeeModal
          employee={selected}
          onClose={() => setSelected(null)}
          onSaved={updated => { setAll(prev => prev.map(e => e.id === updated.id ? updated : e)); setSelected(updated); }}
        />
      )}
      {showForm && (
        <EmployeeFormModal
          departments={depts}
          positions={positions}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchAll(); }}
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
              <p className="text-xs text-slate-400">{String(employee.position_title || '')}</p>
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
            <Row label="Type de contrat" value={String(employee.contract_type || '')} />
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

/* ── Add Staff Modal ── */
function EmployeeFormModal({ departments, positions, onClose, onSuccess }: { departments: R[]; positions: R[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', cin: '', date_of_birth: '', phone: '', department_id: '', position_id: '', hire_date: '', numero_somme: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await createEmployee({ ...form, employee_type: 'STAFF' }); onSuccess(); }
    catch { alert('Erreur lors de la création.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Nouveau membre administratif</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {[['first_name','Prénom',true],['last_name','Nom',true],['email','Email',true],['cin','CIN',true],['date_of_birth','Date de naissance',true,'date'],['phone','Téléphone',false],['hire_date',"Date d'embauche",true,'date'],['numero_somme','N° Somme',false]].map(([k,l,req,t]) => (
              <div key={k as string}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{l as string}{req ? ' *' : ''}</label>
                <input type={(t as string) || 'text'} value={(form as Record<string,string>)[k as string]} onChange={e => set(k as string, e.target.value)} required={!!req}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Département *</label>
              <select value={form.department_id} onChange={e => set('department_id', e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sélectionner...</option>
                {departments.map(d => <option key={d.id as string} value={d.id as string}>{d.name as string}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Poste *</label>
              <select value={form.position_id} onChange={e => set('position_id', e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sélectionner...</option>
                {positions.map(p => <option key={p.id as string} value={p.id as string}>{p.title as string}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-5 border-t border-gray-100 mt-5">
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
