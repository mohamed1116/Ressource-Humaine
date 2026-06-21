/**
 * Employee List -- search, filter by department/type, pagination, skeleton, empty state
 */
import { useEffect, useState, useMemo } from 'react';
import { getEmployees, getDepartments } from '../../api/employees.api';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

type R = Record<string, unknown>;
const PER_PAGE = 10;

export default function EmployeeListPage() {
  const [all, setAll] = useState<R[]>([]);
  const [depts, setDepts] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptF, setDeptF] = useState('');
  const [typeF, setTypeF] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    getEmployees().then(r => setAll(r.data.results || r.data)).catch(() => {}).finally(() => setLoading(false));
    getDepartments().then(r => setDepts(r.data.results || r.data)).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let l = all;
    if (search) { const q = search.toLowerCase(); l = l.filter(e => (e.full_name as string)?.toLowerCase().includes(q) || (e.employee_id as string)?.toLowerCase().includes(q) || (e.numero_somme as string)?.toLowerCase().includes(q)); }
    if (deptF) l = l.filter(e => e.department_name === deptF);
    if (typeF) l = l.filter(e => e.employee_type === typeF);
    return l;
  }, [all, search, deptF, typeF]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  useEffect(() => { setPage(1); }, [search, deptF, typeF]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Personnel</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} employe{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-64"><SearchInput placeholder="Rechercher nom, matricule..." onSearch={setSearch} /></div>
        <select value={deptF} onChange={e => setDeptF(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
          <option value="">Tous les departements</option>
          {depts.map(d => <option key={d.id as string} value={d.name as string}>{d.name as string}</option>)}
        </select>
        <select value={typeF} onChange={e => setTypeF(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
          <option value="">Tous les types</option>
          <option value="PROFESSOR">Enseignants</option>
          <option value="STAFF">Administratifs</option>
        </select>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? <LoadingSkeleton rows={6} cols={5} /> : filtered.length === 0 ? (
          <EmptyState title="Aucun employe" description={search ? 'Aucun resultat pour cette recherche.' : 'Aucun employe enregistre.'} />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Matricule</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Departement</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Poste</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr></thead>
              <tbody>
                {rows.map(e => (
                  <tr key={e.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs">{e.employee_id as string}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{e.full_name as string}</td>
                    <td className="px-4 py-3 text-gray-600">{e.employee_type === 'PROFESSOR' ? 'Enseignant' : 'Administratif'}</td>
                    <td className="px-4 py-3 text-gray-600">{e.department_name as string}</td>
                    <td className="px-4 py-3 text-gray-600">{e.position_title as string}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${e.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{e.is_active ? 'Actif' : 'Inactif'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
