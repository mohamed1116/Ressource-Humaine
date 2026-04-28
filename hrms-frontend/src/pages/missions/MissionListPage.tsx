/**
 * Mission Management Page
 * -----------------------
 * HR views all missions; employees see their own.
 * Missions can be approved and linked to document generation (ordre de mission).
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMissions, createMission, approveMission } from '../../api/missions.api';

const statusCfg: Record<string, { label: string; cls: string }> = {
  PLANNED: { label: 'Planifiee', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  APPROVED: { label: 'Approuvee', cls: 'bg-green-50 text-green-700 border-green-200' },
  IN_PROGRESS: { label: 'En cours', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Terminee', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  CANCELLED: { label: 'Annulee', cls: 'bg-red-50 text-red-600 border-red-200' },
};

export default function MissionListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN_HR';
  const [missions, setMissions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = () => {
    getMissions().then(r => setMissions(r.data.results || r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id: string) => {
    await approveMission(id);
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Missions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des missions et deplacements academiques</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]">
            {showForm ? 'Fermer' : '+ Nouvelle mission'}
          </button>
        )}
      </div>

      {showForm && <MissionForm onDone={() => { setShowForm(false); fetchData(); }} />}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : missions.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucune mission enregistree.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Employe</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Objet</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Destination</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                {isAdmin && <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => {
                const st = statusCfg[m.status as string] || statusCfg.PLANNED;
                return (
                  <tr key={m.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-800">{m.employee_name as string}</td>
                    <td className="px-5 py-3 text-gray-700">{m.title as string}</td>
                    <td className="px-5 py-3 text-gray-600">{m.destination as string}</td>
                    <td className="px-5 py-3 text-gray-500">{m.start_date as string} → {m.end_date as string}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${st.cls}`}>{st.label}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-right">
                        {m.status === 'PLANNED' && (
                          <button onClick={() => handleApprove(m.id as string)} className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100">
                            Approuver
                          </button>
                        )}
                      </td>
                    )}
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

function MissionForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ employee: '', title: '', destination: '', start_date: '', end_date: '', description: '', budget: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createMission({ ...form, budget: form.budget ? parseFloat(form.budget) : null });
      onDone();
    } catch { alert('Erreur lors de la creation.'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Nouvelle mission</h3>
      <div className="grid grid-cols-2 gap-4">
        <In label="ID Employe (UUID)" value={form.employee} onChange={v => set('employee', v)} />
        <In label="Titre / Objet" value={form.title} onChange={v => set('title', v)} />
        <In label="Destination" value={form.destination} onChange={v => set('destination', v)} />
        <In label="Budget (DH)" value={form.budget} onChange={v => set('budget', v)} type="number" />
        <In label="Date depart" value={form.start_date} onChange={v => set('start_date', v)} type="date" />
        <In label="Date retour" value={form.end_date} onChange={v => set('end_date', v)} type="date" />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onDone} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Creer'}
        </button>
      </div>
    </form>
  );
}

function In({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  );
}
