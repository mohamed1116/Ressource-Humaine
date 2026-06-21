/**
 * Department Management Page (HR only)
 * Lists departments with employee count and head name.
 */
import { useEffect, useState } from 'react';
import { getDepartments, createDepartment } from '../../api/employees.api';

export default function DepartmentListPage() {
  const [departments, setDepartments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    getDepartments().then(r => setDepartments(r.data.results || r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createDepartment({ name, code });
      setName(''); setCode(''); setShowForm(false); fetchData();
    } catch { alert('Erreur lors de la creation.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Departements</h1>
          <p className="text-sm text-gray-500 mt-0.5">Structure organisationnelle de la faculte</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]">
          {showForm ? 'Fermer' : '+ Nouveau departement'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Nom du departement</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" placeholder="Ex: Sciences Informatiques" />
          </div>
          <div className="w-32">
            <label className="block text-xs text-gray-600 mb-1">Code</label>
            <input value={code} onChange={e => setCode(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" placeholder="INFO" />
          </div>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50">
            {saving ? '...' : 'Creer'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : departments.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucun departement.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Chef</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Effectif</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-mono text-gray-600">{d.code as string}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{d.name as string}</td>
                  <td className="px-5 py-3 text-gray-600">{(d.head_name as string) || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{d.employee_count as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
