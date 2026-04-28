/**
 * Template Editor Page (HR Admin)
 * --------------------------------
 * WYSIWYG editor for creating/editing document templates.
 * Uses TinyMCE for rich text editing with a live preview panel.
 *
 * Features:
 *  - Rich text HTML editing (bold, tables, alignment, etc.)
 *  - Insert placeholder variables ({{employee_name}}, etc.)
 *  - Header/footer customization
 *  - Live preview with sample data
 *  - Language selection (French / Arabic)
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTemplate, createTemplate, updateTemplate, previewTemplate } from '../../api/certificates.api';

/* TinyMCE -- use the bundled version without its CSS (avoids lightningcss conflict) */
import { Editor } from '@tinymce/tinymce-react';

const CATEGORIES = [
  { value: 'ATTESTATION', label: 'Attestation' },
  { value: 'ORDRE_MISSION', label: 'Ordre de mission' },
  { value: 'AUTORISATION', label: 'Autorisation' },
  { value: 'AUTRE', label: 'Autre' },
];

const LANGUAGES = [
  { value: 'FR', label: 'Francais' },
  { value: 'AR', label: 'Arabe' },
];

/* Common placeholder variables that can be inserted */
const COMMON_VARIABLES = [
  { key: 'employee_name', label: "Nom de l'employe", type: 'auto' },
  { key: 'numero_somme', label: 'Numero de somme (PPR)', type: 'auto' },
  { key: 'cin', label: 'Numero CIN', type: 'auto' },
  { key: 'position', label: 'Poste', type: 'auto' },
  { key: 'department', label: 'Departement', type: 'auto' },
  { key: 'hire_date', label: "Date d'embauche", type: 'auto' },
  { key: 'email', label: 'Email', type: 'auto' },
  { key: 'employee_id', label: "Matricule", type: 'auto' },
  { key: 'date_today', label: "Date du jour", type: 'auto' },
  { key: 'year', label: "Annee", type: 'auto' },
  { key: 'salary_amount', label: 'Montant du salaire', type: 'manual' },
  { key: 'mission_destination', label: 'Destination mission', type: 'manual' },
  { key: 'mission_object', label: 'Objet de la mission', type: 'manual' },
  { key: 'mission_start', label: 'Date depart mission', type: 'manual' },
  { key: 'mission_end', label: 'Date retour mission', type: 'manual' },
];

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const editorRef = useRef<unknown>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('ATTESTATION');
  const [language, setLanguage] = useState('FR');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const [customCss, setCustomCss] = useState('');
  const [variables, setVariables] = useState<Array<{ key: string; label: string; type: string }>>([]);
  const [isActive, setIsActive] = useState(true);

  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  /* Load existing template for editing */
  useEffect(() => {
    if (isEdit && id) {
      getTemplate(id).then((res) => {
        const t = res.data;
        setName(t.name);
        setCategory(t.category);
        setLanguage(t.language);
        setDescription(t.description || '');
        setContent(t.content);
        setHeaderHtml(t.header_html || '');
        setFooterHtml(t.footer_html || '');
        setCustomCss(t.custom_css || '');
        setVariables(t.variables || []);
        setIsActive(t.is_active);
      }).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  /* Insert a placeholder variable into the editor */
  const insertVariable = (key: string) => {
    const editor = editorRef.current as { insertContent?: (c: string) => void } | null;
    if (editor?.insertContent) {
      editor.insertContent(`<strong>{{${key}}}</strong>`);
    }
    /* Also add to the variables list if not already there */
    if (!variables.find((v) => v.key === key)) {
      const found = COMMON_VARIABLES.find((v) => v.key === key);
      if (found) {
        setVariables((prev) => [...prev, found]);
      }
    }
  };

  /* Save template */
  const handleSave = async () => {
    if (!name.trim()) { alert('Le nom du modele est requis.'); return; }
    setSaving(true);
    const data = {
      name, category, language, description, is_active: isActive,
      content, header_html: headerHtml, footer_html: footerHtml,
      custom_css: customCss, variables,
    };
    try {
      if (isEdit && id) {
        await updateTemplate(id, data);
      } else {
        await createTemplate(data);
      }
      navigate('/templates');
    } catch {
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  /* Preview */
  const handlePreview = async () => {
    if (isEdit && id) {
      try {
        const res = await previewTemplate(id);
        setPreviewHtml(res.data.html);
        setShowPreview(true);
      } catch { alert('Erreur lors de la generation de l\'apercu.'); }
    } else {
      /* For new templates, build a local preview */
      let html = content;
      for (const v of COMMON_VARIABLES) {
        html = html.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), `[${v.label}]`);
      }
      setPreviewHtml(`<div style="font-family:Arial;padding:20px;">${headerHtml}${html}${footerHtml}</div>`);
      setShowPreview(true);
    }
  };

  if (loading) return <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Modifier le modele' : 'Nouveau modele de document'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Utilisez l'editeur pour definir le contenu et les variables du document.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePreview} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Apercu
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main editor (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Metadata */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom du modele *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Ex: Attestation de travail" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Langue</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none">
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description (interne)</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" placeholder="Description visible par les admins" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} id="active" className="accent-blue-600" />
                <label htmlFor="active" className="text-sm text-gray-700">Modele actif (visible pour les utilisateurs)</label>
              </div>
            </div>
          </div>

          {/* Rich text editor */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Contenu du document</h3>
              <p className="text-xs text-gray-400 mt-0.5">Inserez des variables avec le panneau lateral droite</p>
            </div>
            <div className="p-1">
              <Editor
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                onInit={(_evt: unknown, editor: unknown) => { editorRef.current = editor; }}
                value={content}
                onEditorChange={(val: string) => setContent(val)}
                init={{
                  height: 450,
                  menubar: true,
                  license_key: 'gpl',
                  plugins: 'lists table link code directionality',
                  toolbar: 'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | table link | ltr rtl | code',
                  content_style: 'body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; padding: 10px; }',
                  directionality: language === 'AR' ? 'rtl' : 'ltr',
                  promotion: false,
                }}
              />
            </div>
          </div>

          {/* Header / Footer / CSS (collapsible) */}
          <details className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-gray-800 hover:bg-gray-50">
              En-tete, pied de page et CSS (avance)
            </summary>
            <div className="p-5 space-y-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">En-tete HTML</label>
                <textarea value={headerHtml} onChange={(e) => setHeaderHtml(e.target.value)} rows={4} className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg outline-none" placeholder="HTML pour l'en-tete du document..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pied de page HTML</label>
                <textarea value={footerHtml} onChange={(e) => setFooterHtml(e.target.value)} rows={3} className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg outline-none" placeholder="HTML pour le pied de page..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CSS personnalise</label>
                <textarea value={customCss} onChange={(e) => setCustomCss(e.target.value)} rows={3} className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg outline-none" placeholder="@page { margin: 2cm; } ..." />
              </div>
            </div>
          </details>
        </div>

        {/* Sidebar: Variables panel (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Variables disponibles</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Cliquez pour inserer dans l'editeur</p>
            </div>
            <div className="p-3 space-y-1 max-h-[500px] overflow-y-auto">
              <p className="text-[10px] font-semibold text-gray-400 uppercase px-1 pt-1">Automatiques (donnees employe)</p>
              {COMMON_VARIABLES.filter((v) => v.type === 'auto').map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <code className="text-blue-600">{`{{${v.key}}}`}</code>
                  <span className="block text-[10px] text-gray-400">{v.label}</span>
                </button>
              ))}

              <p className="text-[10px] font-semibold text-gray-400 uppercase px-1 pt-3">Manuelles (saisie utilisateur)</p>
              {COMMON_VARIABLES.filter((v) => v.type === 'manual').map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                >
                  <code className="text-amber-600">{`{{${v.key}}}`}</code>
                  <span className="block text-[10px] text-gray-400">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active variables in this template */}
          {variables.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Variables utilisees</h3>
              </div>
              <div className="p-3 space-y-1">
                {variables.map((v, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1 text-xs">
                    <span className="text-gray-700">{v.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      v.type === 'auto' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {v.type === 'auto' ? 'auto' : 'manuel'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-[800px] max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800">Apercu du document</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            <div className="p-6" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}
