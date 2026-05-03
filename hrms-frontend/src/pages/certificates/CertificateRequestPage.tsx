/**
 * Document Request Page
 * ---------------------
 * Allows any user to request a document by selecting a template.
 * The page dynamically shows manual fields based on the chosen template's
 * variable definitions (type: "manual"). Auto fields are filled from user data.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTemplates, createDocumentRequest } from '../../api/certificates.api';

export default function CertificateRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Record<string, unknown> | null>(null);
  const [extraData, setExtraData] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  /* Fetch active templates */
  useEffect(() => {
    getTemplates().then((res) => {
      const list = res.data.results || res.data;
      setTemplates(list);
    }).catch(() => {});
  }, []);

  /* When template changes, load its details to get variables */
  useEffect(() => {
    if (selectedId) {
      const t = templates.find((t) => t.id === selectedId);
      setSelectedTemplate(t || null);
      setExtraData({});
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedId, templates]);

  /* Get manual variables for this template */
  const manualVars = selectedTemplate
    ? ((selectedTemplate.variables as Array<{ key: string; label: string; type: string }>) || []).filter((v) => v.type === 'manual')
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) { setError('Veuillez selectionner un type de document.'); return; }
    setError('');
    setLoading(true);
    try {
      await createDocumentRequest({
        template: selectedId,
        extra_data: extraData,
        message,
      });
      setSuccess(true);
      setTimeout(() => navigate('/certificates'), 2000);
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Demande soumise avec succes</h2>
        <p className="text-sm text-gray-500 mt-2">Votre demande sera traitee par le service RH.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Nouvelle demande de document</h1>
      <p className="text-sm text-gray-500 mb-6">Selectionnez le type de document et remplissez les informations requises.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* User info */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Informations du demandeur</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom complet" value={`${user?.first_name} ${user?.last_name}`} />
            <Field label="Email" value={user?.email || ''} />
            <Field label="Role" value={user?.role?.replace(/_/g, ' ') || ''} />
            <Field label="Date" value={new Date().toLocaleDateString('fr-FR')} />
          </div>
        </div>

        {/* Template selection */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Type de document</h3>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Selectionnez un document --</option>
            {templates.map((t) => (
              <option key={t.id as string} value={t.id as string}>
                {t.name as string} ({t.language_display as string})
              </option>
            ))}
          </select>
        </div>

        {/* Manual variables (dynamic form based on template) */}
        {manualVars.length > 0 && (
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Informations complementaires</h3>
            <p className="text-xs text-gray-400 mb-3">Ces champs sont requis pour ce type de document.</p>
            <div className="space-y-3">
              {manualVars.map((v) => (
                <div key={v.key}>
                  <label className="block text-xs text-gray-600 mb-1">{v.label}</label>
                  <input
                    value={extraData[v.key] || ''}
                    onChange={(e) => setExtraData({ ...extraData, [v.key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={v.label}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="p-6 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Message (optionnel)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none resize-none"
            placeholder="Note ou precision..."
          />
        </div>

        {/* Actions */}
        <div className="p-6 flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50">
            {loading ? 'Envoi...' : 'Soumettre la demande'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2 border border-gray-200">{value}</div>
    </div>
  );
}
