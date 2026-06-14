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
import { Editor } from '@tinymce/tinymce-react';
import { useAuth } from '../../context/AuthContext';

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

const AUDIENCES = [
  { value: 'ALL',             label: 'Tous les utilisateurs' },
  { value: 'EMPLOYEE',        label: 'Tout le personnel (enseignants + administratifs)' },
  { value: 'PROFESSOR',       label: 'Professeurs uniquement' },
  { value: 'DEPARTMENT_HEAD', label: 'Chefs de département uniquement' },
  { value: 'STAFF',           label: 'Personnel administratif uniquement' },
  { value: 'STUDENT',         label: 'Étudiants uniquement' },
];

/* Common placeholder variables that can be inserted */
const COMMON_VARIABLES = [
  { key: 'employee_name', label: "Nom de l'employe", type: 'auto' },
  { key: 'employee_name_ar', label: 'Nom complet (arabe)', type: 'auto' },
  { key: 'first_name_ar', label: 'Prénom (arabe)', type: 'auto' },
  { key: 'last_name_ar', label: 'Nom de famille (arabe)', type: 'auto' },
  { key: 'numero_somme', label: 'Numero de somme (PPR)', type: 'auto' },
  { key: 'cin', label: 'Numero CIN', type: 'auto' },
  { key: 'position', label: 'Poste', type: 'auto' },
  { key: 'department', label: 'Departement', type: 'auto' },
  { key: 'hire_date', label: "Date d'embauche", type: 'auto' },
  { key: 'email', label: 'Email', type: 'auto' },
  { key: 'employee_id', label: "Matricule", type: 'auto' },
  { key: 'date_today', label: "Date du jour", type: 'auto' },
  { key: 'year', label: "Annee", type: 'auto' },
  { key: 'signature', label: 'Signature du responsable', type: 'auto' },
  { key: 'stamp', label: 'Cachet officiel', type: 'auto' },
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
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [customVars, setCustomVars] = useState<Array<{ key: string; label: string; type: string }>>([]);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarLabel, setNewVarLabel] = useState('');
  const [newVarType, setNewVarType] = useState<'auto' | 'manual'>('manual');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('ATTESTATION');
  const [language, setLanguage] = useState('FR');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const [customCss, setCustomCss] = useState('');
  const [variables, setVariables] = useState<Array<{ key: string; label: string; type: string }>>([]);
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [isActive, setIsActive] = useState(true);
  const [requiresSignature, setRequiresSignature] = useState(false);

  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [previewError, setPreviewError] = useState('');
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableHover, setTableHover] = useState({ rows: 0, cols: 0 });

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
        setTargetAudience(t.target_audience || 'ALL');
        setIsActive(t.is_active);
        setRequiresSignature(t.requires_signature || false);
      }).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  /* Insert a placeholder variable into the editor */
  const insertVariable = (key: string, label?: string, type?: string) => {
    if (editorRef.current) {
      const editor = editorRef.current as { insertContent: (s: string) => void };
      editor.insertContent(`{{${key}}}`);
    }
    if (!variables.find((v) => v.key === key)) {
      const found = COMMON_VARIABLES.find((v) => v.key === key) || (label ? { key, label, type: type || 'manual' } : null);
      if (found) setVariables((prev) => [...prev, found]);
    }
  };

  const handleAddCustomVar = () => {
    const key = newVarKey.trim().replace(/\s+/g, '_').toLowerCase();
    const label = newVarLabel.trim();
    if (!key || !label) return;
    if (customVars.find(v => v.key === key) || COMMON_VARIABLES.find(v => v.key === key)) {
      alert('Cette variable existe déjà.');
      return;
    }
    setCustomVars(prev => [...prev, { key, label, type: newVarType }]);
    setNewVarKey('');
    setNewVarLabel('');
  };

  const handleDeleteCustomVar = (key: string) => {
    setCustomVars(prev => prev.filter(v => v.key !== key));
    setVariables(prev => prev.filter(v => v.key !== key));
  };

  const handleDeleteCommonVar = (key: string) => {
    setVariables(prev => prev.filter(v => v.key !== key));
  };

  /* Save template */
  const handleSave = async () => {
    if (!name.trim()) { alert('Le nom du modele est requis.'); return; }
    setSaving(true);
    const data = {
      name, category, language, description, is_active: isActive,
      target_audience: targetAudience,
      content, header_html: headerHtml, footer_html: footerHtml,
      custom_css: customCss, variables: [...variables, ...customVars.filter(cv => !variables.find(v => v.key === cv.key))],
      requires_signature: requiresSignature,
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
    setPreviewError('');
    if (isEdit && id) {
      try {
        const res = await previewTemplate(id);
        setPreviewHtml(res.data.html);
        setShowPreview(true);
      } catch (e) {
        console.error('Preview error:', e);
        const err = e as { response?: { status?: number; data?: unknown } };
        console.error('Status:', err?.response?.status);
        console.error('Data:', err?.response?.data);
        setPreviewError(`Erreur ${err?.response?.status || ''}: ${JSON.stringify(err?.response?.data) || 'Inconnue'}`);
      }
    } else {
      // Pour un nouveau template, construire un aperçu local
      let html = content;
      for (const v of COMMON_VARIABLES) {
        html = html.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), `<strong>[${v.label}]</strong>`);
      }
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>body{font-family:Arial,sans-serif;font-size:12pt;padding:40px;color:#1a1a1a;line-height:1.8;}
        .header{text-align:center;margin-bottom:30px;}
        .footer{text-align:center;margin-top:40px;font-size:9pt;color:#666;border-top:1px solid #ccc;padding-top:10px;}
        </style></head><body>
        <div class="header"><p style="font-size:9pt;color:#888">[Aperçu — logo apparaîtra dans le PDF]</p></div>
        <div>${html}</div>
        <div class="footer">Hay El Mohammadi (Lastah), B.P : 271, C.P : 83000, Taroudant | Tél. : +212(0)5 28 55 10 10</div>
        </body></html>`;
      setPreviewHtml(fullHtml);
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Audience cible</label>
                <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none">
                  {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
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
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={requiresSignature} onChange={(e) => setRequiresSignature(e.target.checked)} id="req_sig" className="accent-orange-500" />
                <label htmlFor="req_sig" className="text-sm text-gray-700">✍️ Nécessite la signature du professeur avant validation finale</label>
              </div>
            </div>
          </div>

          {/* Rich text editor */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Contenu du document</h3>
              <p className="text-xs text-gray-400 mt-0.5">Inserez des variables avec le panneau lateral droite</p>
            </div>

            {/* TinyMCE editor */}
            <div className="px-1 pb-1">
              <Editor
                onInit={(_evt, editor) => { editorRef.current = editor; }}
                value={content}
                onEditorChange={(val) => setContent(val)}
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                init={{
                  height: 480,
                  menubar: 'edit insert format table',
                  plugins: 'advlist autolink lists link charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table wordcount',
                  toolbar:
                    'undo redo | blocks | bold italic underline | ' +
                    'alignleft aligncenter alignright alignjustify | ' +
                    'bullist numlist | table | removeformat | code',
                  table_toolbar:
                    'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | ' +
                    'tableinsertcolbefore tableinsertcolafter tabledeletecol',
                  content_style: 'body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.8; } table { border-collapse: collapse; width: 100%; } td, th { border: 1px solid #ccc; padding: 8px 12px; } #fpt-header { text-align:center; padding: 10px 0 16px; border-bottom: 1px solid #ddd; margin-bottom: 16px; pointer-events:none; } #fpt-footer { text-align:center; font-size:8pt; color:#555; border-top:1px solid #ddd; margin-top:16px; padding-top:8px; pointer-events:none; }',
                  setup: (editor: any) => {
                    editor.on('init', () => {
                      const body = editor.getBody();
                      const logoUrl = window.location.origin + '/assets/fpt-logo.png';
                      const header = editor.dom.create('div', { id: 'fpt-header', contenteditable: 'false' }, `<img src="${logoUrl}" style="max-height:80px;width:auto;" />`);
                      const footer = editor.dom.create('div', { id: 'fpt-footer', contenteditable: 'false' }, 'Hay El Mohammadi (Lastah), B.P : 271, C.P : 83000, Taroudant &nbsp;|&nbsp; T&eacute;l. : +212(0)5 28 55 10 10 &nbsp;|&nbsp; <strong>www.fpt.ac.ma</strong>');
                      body.insertBefore(header, body.firstChild);
                      body.appendChild(footer);
                    });
                  },
                  branding: false,
                  promotion: false,
                  license_key: 'gpl',
                  directionality: language === 'AR' ? 'rtl' : 'ltr',
                  base_url: '/tinymce',
                  suffix: '.min',
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
              <p className="text-[11px] text-gray-400 mt-0.5">Cliquez pour insérer dans l'editeur</p>
            </div>
            <div className="p-3 space-y-1 max-h-[400px] overflow-y-auto">
              <p className="text-[10px] font-semibold text-gray-400 uppercase px-1 pt-1">Automatiques</p>
              {COMMON_VARIABLES.filter((v) => v.type === 'auto').map((v) => (
                <button key={v.key} onClick={() => insertVariable(v.key)}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <code className="text-blue-600">{`{{${v.key}}}`}</code>
                  <span className="block text-[10px] text-gray-400">{v.label}</span>
                </button>
              ))}
              <p className="text-[10px] font-semibold text-gray-400 uppercase px-1 pt-3">Manuelles</p>
              {COMMON_VARIABLES.filter((v) => v.type === 'manual').map((v) => (
                <button key={v.key} onClick={() => insertVariable(v.key)}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                  <code className="text-amber-600">{`{{${v.key}}}`}</code>
                  <span className="block text-[10px] text-gray-400">{v.label}</span>
                </button>
              ))}
              {customVars.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase px-1 pt-3">Personnalisées</p>
                  {customVars.map((v) => (
                    <div key={v.key} className="flex items-center gap-1 group">
                      <button onClick={() => insertVariable(v.key, v.label, v.type)}
                        className="flex-1 text-left px-2.5 py-1.5 rounded text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                        <code className="text-purple-600">{`{{${v.key}}}`}</code>
                        <span className="block text-[10px] text-gray-400">{v.label}</span>
                      </button>
                      {isSuperAdmin && (
                        <button onClick={() => handleDeleteCustomVar(v.key)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity">
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Add custom variable — super admin and admin HR */}
          {(isSuperAdmin || user?.role === 'ADMIN_HR') && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Ajouter une variable</h3>
              </div>
              <div className="p-3 space-y-2">
                <input
                  value={newVarKey}
                  onChange={e => setNewVarKey(e.target.value)}
                  placeholder="Clé (ex: numero_dossier)"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-400"
                />
                <input
                  value={newVarLabel}
                  onChange={e => setNewVarLabel(e.target.value)}
                  placeholder="Label (ex: N° Dossier)"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-400"
                />
                <select value={newVarType} onChange={e => setNewVarType(e.target.value as 'auto' | 'manual')}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none">
                  <option value="manual">Manuelle (saisie utilisateur)</option>
                  <option value="auto">Automatique</option>
                </select>
                <button onClick={handleAddCustomVar}
                  disabled={!newVarKey.trim() || !newVarLabel.trim()}
                  className="w-full py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-40">
                  + Ajouter
                </button>
              </div>
            </div>
          )}

          {/* Variables used in this template */}
          {variables.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Variables utilisées</h3>
              </div>
              <div className="p-3 space-y-1">
                {variables.map((v, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1 text-xs group">
                    <div className="min-w-0">
                      <code className={`text-[10px] ${v.type === 'auto' ? 'text-blue-600' : 'text-amber-600'}`}>{`{{${v.key}}}`}</code>
                      <span className="block text-[10px] text-gray-400 truncate">{v.label}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        v.type === 'auto' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                      }`}>{v.type === 'auto' ? 'auto' : 'manuel'}</span>
                      {isSuperAdmin && (
                        <button onClick={() => handleDeleteCommonVar(v.key)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-600 transition-opacity text-sm">
                          ×
                        </button>
                      )}
                    </div>
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
          <div className="bg-white rounded-lg shadow-2xl w-[860px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-800">Aperçu du document</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="flex-1 w-full border-0"
              style={{ minHeight: '70vh' }}
              title="Aperçu"
            />
          </div>
        </div>
      )}

      {/* Preview error */}
      {previewError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-lg shadow">
          {previewError}
          <button onClick={() => setPreviewError('')} className="ml-3 font-bold">&times;</button>
        </div>
      )}
    </div>
  );
}
