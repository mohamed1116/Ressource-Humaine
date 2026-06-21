import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTemplates, deleteTemplate, getSignatureStamps, uploadSignatureStamp, deleteSignatureStamp, toggleSignatureStamp } from '../../api/certificates.api';

type R = Record<string, unknown>;

const categoryLabels: Record<string, string> = {
  ATTESTATION: 'Attestation',
  ORDRE_MISSION: 'Ordre de mission',
  AUTORISATION: 'Autorisation',
  AUTRE: 'Autre',
};

const audienceLabels: Record<string, string> = {
  ALL:             'Tous les utilisateurs',
  EMPLOYEE:        'Tout le personnel',
  PROFESSOR:       'Professeurs',
  DEPARTMENT_HEAD: 'Chefs de dept.',
  STAFF:           'Personnel admin.',
  STUDENT:         'Étudiants',
};

export default function TemplateListPage() {
  const [templates, setTemplates] = useState<R[]>([]);
  const [loading, setLoading]     = useState(true);
  const [stamps, setStamps]       = useState<R[]>([]);
  const [uploading, setUploading] = useState(false);
  const sigRef   = useRef<HTMLInputElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);

  const fetchTemplates = () =>
    getTemplates().then(r => setTemplates(r.data.results ?? r.data)).catch(() => {}).finally(() => setLoading(false));

  const fetchStamps = () =>
    getSignatureStamps().then(r => setStamps(r.data.results ?? r.data)).catch(() => {});

  useEffect(() => { fetchTemplates(); fetchStamps(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le modèle "${name}" ?`)) return;
    try { await deleteTemplate(id); fetchTemplates(); }
    catch { alert('Impossible de supprimer ce modèle (il est peut-être utilisé).'); }
  };

  const handleUpload = async (kind: 'SIGNATURE' | 'STAMP', label: string, file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('kind', kind);
    fd.append('label', label);
    fd.append('image', file);
    fd.append('is_active', 'true');
    try { await uploadSignatureStamp(fd); fetchStamps(); }
    catch { alert('Erreur lors du téléversement.'); }
    finally { setUploading(false); }
  };

  const handleDeleteStamp = async (id: string) => {
    if (!confirm('Supprimer ?')) return;
    try { await deleteSignatureStamp(id); fetchStamps(); }
    catch { alert('Erreur.'); }
  };

  const handleToggle = async (s: R) => {
    try { await toggleSignatureStamp(s.id as string, !s.is_active); fetchStamps(); }
    catch { alert('Erreur.'); }
  };

  const signatures = stamps.filter(s => s.kind === 'SIGNATURE');
  const cachets    = stamps.filter(s => s.kind === 'STAMP');

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Modèles de documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Créer et gérer les modèles d'attestations et ordres de mission</p>
        </div>
        <Link to="/templates/new"
          className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] transition-colors">
          + Nouveau modèle
        </Link>
      </div>

      {/* ── Signatures & Cachets ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['SIGNATURE', 'STAMP'] as const).map(kind => {
          const list  = kind === 'SIGNATURE' ? signatures : cachets;
          const label = kind === 'SIGNATURE' ? 'Signatures' : 'Cachets';
          const ref   = kind === 'SIGNATURE' ? sigRef : stampRef;
          const defaultLabel = kind === 'SIGNATURE' ? 'Signature du Doyen' : 'Cachet officiel';

          return (
            <div key={kind} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Utilisez <code className="text-blue-600">{`{{${kind.toLowerCase()}}}`}</code> dans le modèle</p>
                </div>
                <button
                  onClick={() => ref.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 text-xs font-medium bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] disabled:opacity-50 transition-colors">
                  + Ajouter
                </button>
                <input ref={ref} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(kind, defaultLabel, f); e.target.value = ''; }} />
              </div>

              <div className="p-4">
                {list.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Aucun {label.toLowerCase()} ajouté.</p>
                ) : (
                  <div className="space-y-3">
                    {list.map(s => (
                      <div key={s.id as string} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100">
                        <img src={`http://localhost:8000${s.image as string}`} alt={s.label as string}
                          className="h-12 w-24 object-contain rounded border border-gray-100 bg-gray-50" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{s.label as string}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => handleToggle(s)}
                            className="px-2 py-1 text-[10px] border border-gray-200 rounded text-gray-600 hover:bg-gray-50">
                            {s.is_active ? 'Désactiver' : 'Activer'}
                          </button>
                          <button onClick={() => handleDeleteStamp(s.id as string)}
                            className="px-2 py-1 text-[10px] border border-red-200 rounded text-red-600 hover:bg-red-50">
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Templates table ── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : templates.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucun modèle. Cliquez sur "Nouveau modèle" pour commencer.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Audience</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Langue</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Variables</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{t.name as string}</td>
                  <td className="px-5 py-3.5 text-gray-600">{categoryLabels[t.category as string] || String(t.category)}</td>
                  <td className="px-5 py-3.5 text-gray-600">{audienceLabels[t.target_audience as string] || String(t.target_audience)}</td>
                  <td className="px-5 py-3.5 text-gray-600">{t.language_display as string}</td>
                  <td className="px-5 py-3.5 text-gray-500">{t.variable_count as number}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${t.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                      {t.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/templates/${t.id}/edit`}
                        className="px-2.5 py-1 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50">
                        Modifier
                      </Link>
                      <button onClick={() => handleDelete(t.id as string, t.name as string)}
                        className="px-2.5 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50">
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

      {/* Variables hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-3 text-xs text-blue-700">
        <span className="font-semibold">Variables disponibles pour la signature :</span>
        {' '}<code>{'{{signature}}'}</code> pour la signature du responsable,
        {' '}<code>{'{{stamp}}'}</code> pour le cachet officiel.
        Insérez-les dans le contenu du modèle à l'endroit souhaité.
      </div>
    </div>
  );
}
