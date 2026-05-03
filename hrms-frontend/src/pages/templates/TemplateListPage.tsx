/**
 * Template List Page (HR Admin)
 * Shows all document templates with ability to create, edit, and preview.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTemplates, deleteTemplate } from '../../api/certificates.api';

export default function TemplateListPage() {
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    getTemplates()
      .then((res) => setTemplates(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le modele "${name}" ?`)) return;
    try {
      await deleteTemplate(id);
      fetchData();
    } catch {
      alert('Impossible de supprimer ce modele (il est peut-etre utilise).');
    }
  };

  const categoryLabels: Record<string, string> = {
    ATTESTATION: 'Attestation',
    ORDRE_MISSION: 'Ordre de mission',
    AUTORISATION: 'Autorisation',
    AUTRE: 'Autre',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Modeles de documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Creer et gerer les modeles d'attestations et ordres de mission</p>
        </div>
        <Link
          to="/templates/new"
          className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] transition-colors"
        >
          + Nouveau modele
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : templates.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucun modele. Cliquez sur "Nouveau modele" pour commencer.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nom</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Categorie</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Langue</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Variables</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{t.name as string}</td>
                  <td className="px-5 py-3.5 text-gray-600">{categoryLabels[t.category as string] || t.category}</td>
                  <td className="px-5 py-3.5 text-gray-600">{t.language_display as string}</td>
                  <td className="px-5 py-3.5 text-gray-500">{t.variable_count as number}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      t.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
                    }`}>
                      {t.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/templates/${t.id}/edit`}
                        className="px-2.5 py-1 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        Modifier
                      </Link>
                      <button
                        onClick={() => handleDelete(t.id as string, t.name as string)}
                        className="px-2.5 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
