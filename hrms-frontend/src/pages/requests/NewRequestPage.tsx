/**
 * =============================================================================
 * NEW REQUEST PAGE -- Unified Request Form
 * =============================================================================
 *
 * PURPOSE:
 *   Single page where any user can submit any type of request.
 *   The form adapts dynamically based on the selected request type.
 *
 * HOW IT WORKS:
 *   1. User lands on this page and sees 3 request type cards
 *   2. User clicks one (Certificate, Leave, or Mission)
 *   3. The form below changes to show fields specific to that type
 *   4. User fills and submits
 *   5. Request is created via the appropriate backend API
 *   6. User sees a success message and is redirected to "Mes demandes"
 *
 * WHY ONE PAGE INSTEAD OF THREE:
 *   - Users don't need to know which module to navigate to
 *   - Reduces sidebar complexity
 *   - The unified request system treats all requests the same way
 *   - HR sees everything in one "Toutes les demandes" table
 *
 * ROLE-BASED BEHAVIOR:
 *   - Students only see the CERTIFICATE type (academic documents)
 *   - Employees see all 3 types
 *   - The usePermissions() hook controls this
 *
 * BACKEND CALLS:
 *   - Certificate → POST /api/v1/certificates/requests/create/
 *   - Leave → POST /api/v1/leaves/requests/ (via LeaveRequestCreateSerializer)
 *   - Mission → POST /api/v1/certificates/missions/
 *   Each type has its own specialized backend because they have different
 *   workflows (templates, balance tracking, budget management).
 * =============================================================================
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

/* --- API imports for each request type --- */
import { getTemplates, createDocumentRequest, createFreeRequest } from '../../api/certificates.api';
import { getLeaveTypes, createLeaveRequest } from '../../api/leaves.api';
import { createMission } from '../../api/missions.api';

/**
 * The 3 request types the system supports.
 * Each type has a label (French), description, icon, and color scheme.
 * The 'roles' array controls who can see this type.
 */
const REQUEST_TYPES = [
  {
    id: 'CERTIFICATE' as const,
    label: 'Attestation',
    desc: 'Demander une attestation administrative ou academique',
    color: 'border-blue-200 bg-blue-50 text-blue-800',
    activeColor: 'border-blue-500 bg-blue-50 ring-2 ring-blue-500',
    roles: [],
  },
  {
    id: 'FREE' as const,
    label: 'Demande libre',
    desc: 'Ecrire votre propre demande personnalisee',
    color: 'border-amber-200 bg-amber-50 text-amber-800',
    activeColor: 'border-amber-500 bg-amber-50 ring-2 ring-amber-500',
    roles: ['STUDENT', 'PROFESSOR', 'STAFF', 'DEPARTMENT_HEAD'],
  },
  {
    id: 'LEAVE' as const,
    label: 'Conge',
    desc: 'Demander un conge annuel, maladie ou exceptionnel',
    color: 'border-purple-200 bg-purple-50 text-purple-800',
    activeColor: 'border-purple-500 bg-purple-50 ring-2 ring-purple-500',
    roles: ['ADMIN_HR', 'DEPARTMENT_HEAD', 'PROFESSOR', 'STAFF'],
  },
  {
    id: 'MISSION' as const,
    label: 'Mission',
    desc: 'Demander un ordre de mission pour un deplacement',
    color: 'border-teal-200 bg-teal-50 text-teal-800',
    activeColor: 'border-teal-500 bg-teal-50 ring-2 ring-teal-500',
    roles: ['ADMIN_HR', 'DEPARTMENT_HEAD', 'PROFESSOR', 'STAFF'],
  },
];

type RequestType = 'CERTIFICATE' | 'LEAVE' | 'MISSION' | 'FREE';

export default function NewRequestPage() {
  const { user } = useAuth();
  const { isStudent: _isStudent } = usePermissions();
  const [searchParams] = useSearchParams();

  /* --- Which request type is currently selected --- */
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);

  /* --- Submission state --- */
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const availableTypes = REQUEST_TYPES.filter(
    (t) => t.roles.length === 0 || (user && (t.roles as string[]).includes(user.role)),
  );

  useEffect(() => {
    const typeFromUrl = searchParams.get('type') as RequestType | null;
    if (typeFromUrl && REQUEST_TYPES.find(t => t.id === typeFromUrl)) {
      setSelectedType(typeFromUrl);
    } else if (availableTypes.length > 0 && !selectedType) {
      setSelectedType(availableTypes[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, availableTypes.length, selectedType]);

  /**
   * Success screen: shown after a request is submitted.
   * After 2.5 seconds, auto-redirects to "Mes demandes".
   */
  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        {/* Green checkmark circle */}
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
    <div className="max-w-3xl mx-auto">
      {/* --- Page header --- */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Nouvelle demande</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Selectionnez le type de demande puis remplissez le formulaire.
        </p>
      </div>

      {/* --- Error banner --- */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================================================================
         TYPE SELECTOR
         Three cards side by side. The user clicks one to select a type.
         The selected card gets a ring highlight. The form below changes.
         ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {availableTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => { setSelectedType(t.id); setError(''); }}
            className={`text-left p-4 rounded-lg border-2 transition-all duration-150 ${
              selectedType === t.id ? t.activeColor : t.color + ' hover:shadow-sm'
            }`}
          >
            <p className="text-sm font-semibold">{t.label}</p>
            <p className="text-xs opacity-70 mt-1">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* ================================================================
         DYNAMIC FORM
         Renders a different form component based on selectedType.
         Each sub-form handles its own fields and API call.
         ================================================================ */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {selectedType === 'CERTIFICATE' && (
          <CertificateForm
            loading={loading}
            setLoading={setLoading}
            setSuccess={setSuccess}
            setError={setError}
          />
        )}
        {selectedType === 'LEAVE' && (
          <LeaveForm
            loading={loading}
            setLoading={setLoading}
            setSuccess={setSuccess}
            setError={setError}
          />
        )}
        {selectedType === 'MISSION' && (
          <MissionForm
            loading={loading}
            setLoading={setLoading}
            setSuccess={setSuccess}
            setError={setError}
          />
        )}
        {selectedType === 'FREE' && (
          <FreeRequestForm
            loading={loading}
            setLoading={setLoading}
            setSuccess={setSuccess}
            setError={setError}
          />
        )}
      </div>
    </div>
  );
}


/* =====================================================================
   SUB-FORM: CERTIFICATE (Attestation)
   =====================================================================
   Lets the user pick a document template from a dropdown.
   The template's "manual" variables are shown as extra input fields.
   Auto variables (name, CIN, etc.) are filled from the user's profile.
   ===================================================================== */

interface FormProps {
  loading: boolean;
  setLoading: (v: boolean) => void;
  setSuccess: (v: boolean) => void;
  setError: (v: string) => void;
}

function CertificateForm({ loading, setLoading, setSuccess, setError }: FormProps) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [selectedTpl, setSelectedTpl] = useState<Record<string, unknown> | null>(null);
  const [extraData, setExtraData] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    getTemplates()
      .then((r) => setTemplates(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (templateId) {
      const t = templates.find((t) => t.id === templateId);
      setSelectedTpl(t || null);
      setExtraData({});
    }
  }, [templateId, templates]);

  const manualVars = selectedTpl
    ? ((selectedTpl.variables as Array<{ key: string; label: string; type: string }>) || [])
        .filter((v) => v.type === 'manual')
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) {
      setError('Veuillez selectionner un type de document.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createDocumentRequest({ template: templateId, extra_data: extraData, message, attachment });
      setSuccess(true);
      setTimeout(() => navigate('/requests'), 2500);
    } catch {
      setError('Erreur lors de la soumission. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Template selector */}
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Type de document
        </label>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">-- Selectionnez --</option>
          {templates.map((t) => (
            <option key={t.id as string} value={t.id as string}>
              {t.name as string}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic manual fields */}
      {manualVars.length > 0 && (
        <div className="p-5 border-b border-gray-100 space-y-3">
          <p className="text-xs text-gray-500 mb-1">Informations complementaires requises :</p>
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
      )}

      {/* Note */}
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Note (optionnel)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none resize-none"
          placeholder="Precision ou commentaire..."
        />
      </div>

      {/* Submit button */}
      <div className="p-5 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
        </button>
      </div>
    </form>
  );
}


/* =====================================================================
   SUB-FORM: LEAVE (Conge)
   =====================================================================
   Simple form: leave type dropdown + start date + end date + reason.
   The backend (LeaveService) handles business day calculation and
   balance verification automatically.
   ===================================================================== */

function LeaveForm({ loading, setLoading, setSuccess, setError }: FormProps) {
  const navigate = useNavigate();

  /* Available leave types loaded from the backend */
  const [types, setTypes] = useState<Record<string, unknown>[]>([]);

  /* Form state */
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  /** Fetch leave types on mount (annual, sick, exceptional, etc.) */
  useEffect(() => {
    getLeaveTypes()
      .then((r) => setTypes(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {});
  }, []);

  /**
   * Submit handler: creates a LeaveRequest.
   * The backend validates balance, calculates business days,
   * and starts the 2-level approval workflow (dept head → HR).
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !startDate || !endDate) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createLeaveRequest({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      setSuccess(true);
      setTimeout(() => navigate('/requests'), 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const data = e?.response?.data;
      const msg = data?.detail
        || (data?.non_field_errors as string[])?.[0]
        || Object.values(data || {}).flat().join(' ')
        || 'Erreur lors de la soumission.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Leave type selector */}
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Type de conge</label>
        <select
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">-- Selectionnez --</option>
          {types.map((t) => (
            <option key={t.id as string} value={t.id as string}>{t.name as string}</option>
          ))}
        </select>
      </div>

      {/* Date range */}
      <div className="p-5 border-b border-gray-100 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Date de debut</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Date de fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Reason */}
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Motif</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          required
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none resize-none"
          placeholder="Raison de la demande de conge..."
        />
      </div>

      {/* Submit */}
      <div className="p-5 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
        </button>
      </div>
    </form>
  );
}


/* =====================================================================
   SUB-FORM: MISSION
   =====================================================================
   Form for requesting a mission order. Includes destination, dates,
   object/purpose, and optional budget.
   The backend creates a Mission record with status PLANNED.
   HR then approves it separately.
   ===================================================================== */

function MissionForm({ loading, setLoading, setSuccess, setError }: FormProps) {
  const navigate = useNavigate();

  /* Form state */
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');

  /**
   * Submit handler: creates a Mission record.
   * Note: the mission API requires an employee UUID. We pass the user's
   * employee profile ID. If the user has no employee profile, this will fail
   * (which is correct -- only employees can request missions).
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !destination || !startDate || !endDate) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createMission({
        title,
        destination,
        start_date: startDate,
        end_date: endDate,
        description,
        budget: budget ? parseFloat(budget) : null,
        notes: '',
      });
      setSuccess(true);
      setTimeout(() => navigate('/requests'), 2500);
    } catch {
      setError('Erreur lors de la soumission de la mission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Mission title / object */}
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Objet de la mission</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="Ex: Participation au colloque international..."
        />
      </div>

      {/* Destination */}
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Destination</label>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="Ville, pays..."
        />
      </div>

      {/* Dates + budget */}
      <div className="p-5 border-b border-gray-100 grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Date depart</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Date retour</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Budget (DH)</label>
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" placeholder="Optionnel" />
        </div>
      </div>

      {/* Description */}
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Description (optionnel)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none resize-none"
          placeholder="Details supplementaires..."
        />
      </div>

      {/* Submit */}
      <div className="p-5 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
        </button>
      </div>
    </form>
  );
}


/* =====================================================================
   SUB-FORM: FREE REQUEST (Demande libre)
   Only visible to students. Lets them write a custom request.
   ===================================================================== */

function FreeRequestForm({ loading, setLoading, setSuccess, setError }: FormProps) {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createFreeRequest({ subject: subject.trim(), message: message.trim(), attachment });
      setSuccess(true);
      setTimeout(() => navigate('/requests'), 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const data = e?.response?.data;
      const msg = (data?.detail as string) || Object.values(data || {}).flat().join(' ') || 'Erreur lors de la soumission.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Objet de la demande *</label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Ex: Demande de certificat de résidence..."
        />
      </div>
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Votre demande *</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
          required
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none resize-none focus:ring-1 focus:ring-amber-500"
          placeholder="Décrivez votre demande en détail..."
        />
      </div>
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Pièce jointe (optionnel)</label>
        <input
          type="file"
          onChange={e => setAttachment(e.target.files?.[0] || null)}
          className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
        />
        {attachment && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            <span className="flex-1 truncate">{attachment.name}</span>
            <button type="button" onClick={() => setAttachment(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
      </div>
      <div className="p-5 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
        </button>
      </div>
    </form>
  );
}
