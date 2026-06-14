/**
 * PromotionsPage.tsx - Fully Cleaned, Secured & Fixed Version
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { promotionsApi } from '../../api/promotions.api';
import TableGeneratorModal from './TableGeneratorModal';
import TableEditorModal from './TableEditorModal';

type R = Record<string, unknown>;

interface PaginatedResponse {
  results?: R[];
}

interface ApiErrorStructure {
  response?: {
    data?: {
      detail?: string;
      error?: string;
    };
  };
}

export default function PromotionsPage() {
  // Tabs & Filters State
  const [activeTab, setActiveTab]       = useState<'employees' | 'tables'>('employees');
  const [searchQuery, setSearchQuery]   = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('');

  // Data State
  const [employees, setEmployees]       = useState<R[]>([]);
  const [tables, setTables]             = useState<R[]>([]);
  const [stats, setStats]               = useState({
    eligibles_echelon: 0,
    eligibles_grade: 0,
    total_professors: 0,
    total_admins: 0
  });

  // Modals UI State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [selectedTable, setSelectedTable]     = useState<R | null>(null);

  // Loading & Error State
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  // Fetch data cleanly with secure catch block
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, tabRes] = await Promise.all([
        promotionsApi.getProfiles(),
        promotionsApi.getTables()
      ]);

      const empDataPayload = empRes?.data as PaginatedResponse | R[] | undefined;
      const tabDataPayload = tabRes?.data as PaginatedResponse | R[] | undefined;

      const finalEmpList = Array.isArray(empDataPayload)
        ? empDataPayload
        : (empDataPayload?.results && Array.isArray(empDataPayload.results))
          ? empDataPayload.results
          : [];

      const finalTabList = Array.isArray(tabDataPayload)
        ? tabDataPayload
        : (tabDataPayload?.results && Array.isArray(tabDataPayload.results))
          ? tabDataPayload.results
          : [];

      setEmployees(finalEmpList);
      setTables(finalTabList);
      
      setStats({
        eligibles_echelon: finalEmpList.filter((e: R) => e.echelon_eligible === true).length,
        eligibles_grade: finalEmpList.filter((e: R) => e.grade_eligible === true).length,
        total_professors: finalEmpList.filter((e: R) => String(e.employee_type || '').toUpperCase() === 'PROFESSOR').length,
        total_admins: finalEmpList.filter((e: R) => String(e.employee_type || '').toUpperCase() === 'STAFF').length,
      });
    } catch (err: unknown) {
      console.error('Error fetching dashboard data:', err);
      const apiErr = err as ApiErrorStructure;
      const backendError = apiErr.response?.data?.detail || apiErr.response?.data?.error || 'Impossible de charger les données des promotions.';
      setError(String(backendError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const executeFetch = async () => {
      if (isMounted) {
        await loadData();
      }
    };

    executeFetch();

    return () => {
      isMounted = false;
    };
  }, [loadData]);

  // Client Side Filter utilizing all variables
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const name  = String(emp.employee_name || '').toLowerCase();
      const ppr   = String(emp.ppr || '').toLowerCase();
      const cadre = String(emp.cadre || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = name.includes(query) || ppr.includes(query) || cadre.includes(query);

      let matchesType = true;
      if (typeFilter === 'prof') {
        matchesType = String(emp.employee_type || '').toUpperCase() === 'PROFESSOR';
      } else if (typeFilter === 'admin') {
        matchesType = String(emp.employee_type || '').toUpperCase() === 'STAFF';
      }

      let matchesElig = true;
      if (eligibilityFilter === 'echelon') {
        matchesElig = emp.echelon_eligible === true;
      } else if (eligibilityFilter === 'grade') {
        matchesElig = emp.grade_eligible === true;
      }

      return matchesSearch && matchesType && matchesElig;
    });
  }, [employees, searchQuery, typeFilter, eligibilityFilter]);

  // ✅ تم إصلاح دالة التحميل هنا لتقرأ الـ Blob الصافي المباشر وتمنع الكراش نهائياً
  const handleDownloadPdf = async (tableId: string | number) => {
    try {
      const blobData = await promotionsApi.downloadPdf(String(tableId));
      
      // تأمين قراءة الملف كـ PDF باينري حقيقي
      const blob = new Blob([blobData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tableau_Promotion_Officiel_${tableId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error('Error downloading PDF:', err);
      const apiErr = err as ApiErrorStructure;
      const errMsg = apiErr.response?.data?.detail || apiErr.response?.data?.error || 'Erreur lors du téléchargement du PDF.';
      alert(`Erreur: ${String(errMsg)}`);
    }
  };

  const handleValidateTable = async (tableId: string | number) => {
    if (!window.confirm('Voulez-vous vraiment valider définitivement ce tableau officiel ?')) return;
    try {
      await promotionsApi.validateTable(String(tableId));
      alert('Tableau validé avec succès !');
      loadData(); // إعادة تحديث البيانات تلقائياً
    } catch (err: unknown) {
      console.error('Error validating table:', err);
      const apiErr = err as ApiErrorStructure;
      const errMsg = apiErr.response?.data?.detail || apiErr.response?.data?.error || 'Erreur lors de la validation du tableau.';
      alert(`Erreur: ${String(errMsg)}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Promotions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Faculté Polydisciplinaire de Taroudant</p>
        </div>
        <button
          onClick={() => setIsGeneratorOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
        >
          <span>✨ Générer un tableau officiel</span>
        </button>
      </div>

      {/* Global Errors Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1">
            Dismiss
          </button>
        </div>
      )}

      {/* Numerical Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
          <p className="text-xs font-medium text-emerald-600">Éligibles échelon</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{stats.eligibles_echelon}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl">
          <p className="text-xs font-medium text-purple-600">Éligibles grade</p>
          <p className="text-3xl font-bold text-purple-700 mt-1">{stats.eligibles_grade}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
          <p className="text-xs font-medium text-blue-600">Professeurs</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{stats.total_professors}</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
          <p className="text-xs font-medium text-gray-500">Personnel admin.</p>
          <p className="text-3xl font-bold text-gray-700 mt-1">{stats.total_admins}</p>
        </div>
      </div>

      {/* Tabs Navigation Layout */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'employees' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Employés ({filteredEmployees.length})
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'tables' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Tableaux générés ({tables.length})
          </button>
        </nav>
      </div>

      {/* Main Core View Router */}
      {activeTab === 'employees' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Toolbar Filters */}
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Rechercher nom, PPR, cadre..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2"
              >
                <option value="">Tous les types</option>
                <option value="prof">Professeurs</option>
                <option value="admin">Personnel admin.</option>
              </select>
              <select
                value={eligibilityFilter}
                onChange={e => setEligibilityFilter(e.target.value)}
                className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2"
              >
                <option value="">Toutes éligibilités</option>
                <option value="echelon">Éligibles échelon</option>
                <option value="grade">Éligibles grade</option>
              </select>
            </div>
          </div>

          {/* Employee Table Area */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-sm text-gray-500">Chargement en cours...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">Aucun employé trouvé.</div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 font-medium uppercase text-[11px] border-b border-gray-100">
                    <th className="px-6 py-3">Employé</th>
                    <th className="px-4 py-3">PPR</th>
                    <th className="px-4 py-3">Cadre / Grade</th>
                    <th className="px-4 py-3 text-center">الرتبة</th>
                    <th className="px-4 py-3 text-center">Élig. الرتبة</th>
                    <th className="px-6 py-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{String(emp.employee_name || '')}</td>
                      <td className="px-4 py-4 text-gray-600 font-mono">{String(emp.ppr || '')}</td>
                      <td className="px-4 py-4 text-gray-500">{String(emp.cadre || '')}</td>
                      <td className="px-4 py-4 text-center font-bold">{String(emp.current_echelon ?? '-')}</td>
                      <td className="px-4 py-4 text-center">
                        {emp.echelon_eligible === true ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">✓ Oui</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-400">Non</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        {emp.evaluation_score ? `${Number(emp.evaluation_score).toFixed(1)}/10` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Generated Tables List */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {tables.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">Aucun tableau officiel généré.</div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-medium uppercase text-[11px] border-b border-gray-100">
                    <th className="px-6 py-3">Type du Tableau</th>
                    <th className="px-4 py-3">Année</th>
                    <th className="px-4 py-3 text-center">Employés</th>
                    <th className="px-4 py-3 text-center">Statut</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tables.map((table: R) => (
                    <tr key={Number(table.id)} className="hover:bg-gray-50/40">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {String(table.table_type) === 'ECHELON' ? 'Promotion en échelon' 
                        : String(table.table_type) === 'GRADE_TITLE' ? 'Nomination en grade (Professeurs)'
                        : String(table.table_type) === 'GRADE_ADMIN' ? 'Promotion de grade (Cadres admin/tech)'
                        : String(table.table_type) === 'TITULARISATION' ? 'Titularisation'
                        : String(table.table_type)}
                      </td>
                      <td className="px-4 py-4 text-gray-600">{Number(table.year)}</td>
                      <td className="px-4 py-4 text-center font-bold text-gray-700">
                        {Array.isArray(table.employees_data) ? table.employees_data.length : 0}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${String(table.status) === 'VALIDATED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {String(table.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => setSelectedTable(table)} className="px-3 py-1.5 text-xs font-semibold border rounded-lg text-gray-600 hover:bg-gray-50">
                          Modifier
                        </button>
                        <button onClick={() => handleDownloadPdf(String(table.id || ''))} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
                          PDF
                        </button>
                        {String(table.status) !== 'VALIDATED' && (
                          <button onClick={() => handleValidateTable(String(table.id || ''))} className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                            Valider
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modals Mounting */}
      {isGeneratorOpen && (
        <TableGeneratorModal onClose={() => setIsGeneratorOpen(false)} onGenerated={() => { setIsGeneratorOpen(false); loadData(); }} />
      )}

      {selectedTable && (
        <TableEditorModal table={selectedTable} onClose={() => { setSelectedTable(null); loadData(); }} />
      )}
    </div>
  );
}