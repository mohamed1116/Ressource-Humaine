import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';

type Target = 'ALL' | 'ROLE' | 'SPECIFIC';
type Role = 'ADMIN_HR' | 'DEPARTMENT_HEAD' | 'PROFESSOR' | 'STAFF' | 'STUDENT';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'ADMIN_HR', label: 'Admin RH' },
  { value: 'DEPARTMENT_HEAD', label: 'Chef de département' },
  { value: 'PROFESSOR', label: 'Professeur' },
  { value: 'STAFF', label: 'Personnel' },
  { value: 'STUDENT', label: 'Étudiant' },
];

export default function BroadcastNotificationPage() {
  const { user } = useAuth();
  const [target, setTarget] = useState<Target>('ALL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleRoleToggle = (role: Role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Le titre et le message sont obligatoires');
      return;
    }
    if (target === 'ROLE' && selectedRoles.length === 0) {
      setError('Veuillez sélectionner au moins un rôle');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('message', message.trim());
      fd.append('target', target);
      fd.append('notification_type', 'SYSTEM_ANNOUNCEMENT');
      if (target === 'ROLE') selectedRoles.forEach(r => fd.append('roles', r));
      if (attachment) fd.append('attachment', attachment);

      const response = await api.post('/auth/superadmin/broadcast-notification/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(response.data.detail || `Notification envoyée à ${response.data.count} utilisateurs`);
      setTitle('');
      setMessage('');
      setSelectedRoles([]);
      setTarget('ALL');
      setAttachment(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'envoi de la notification");
    } finally {
      setSending(false);
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Accès refusé. Cette page est réservée aux Super Admins.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Envoyer une notification</h1>
        <p className="text-sm text-gray-500 mt-1">
          Envoyez des notifications système à tous les utilisateurs ou à des rôles spécifiques
        </p>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Target Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Destinataires</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="target"
                value="ALL"
                checked={target === 'ALL'}
                onChange={() => setTarget('ALL')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Tous les utilisateurs</p>
                <p className="text-xs text-gray-500">Envoyer à tous les utilisateurs actifs</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="target"
                value="ROLE"
                checked={target === 'ROLE'}
                onChange={() => setTarget('ROLE')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Rôles spécifiques</p>
                <p className="text-xs text-gray-500">Sélectionner des rôles spécifiques</p>
              </div>
            </label>
          </div>
        </div>

        {/* Role Selection */}
        {target === 'ROLE' && (
          <div className="pl-7">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner les rôles</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map(role => (
                <label
                  key={role.value}
                  className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Titre <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Maintenance système prévue"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/100 caractères</p>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Écrivez votre message ici..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{message.length}/500 caractères</p>
        </div>

        {/* File Attachment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pièce jointe (optionnel)</label>
          <input
            type="file"
            onChange={e => setAttachment(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
          />
          {attachment && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              <span className="flex-1 truncate">{attachment.name}</span>
              <button onClick={() => setAttachment(null)} className="text-red-400 hover:text-red-600 font-bold">✕</button>
            </div>
          )}
        </div>

        {/* Preview */}
        {(title || message) && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Aperçu</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  {title && <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>}
                  {message && <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setTitle('');
              setMessage('');
              setSelectedRoles([]);
              setTarget('ALL');
              setAttachment(null);
              setError(null);
              setSuccess(null);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {sending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Envoi en cours...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Envoyer la notification
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">À propos des notifications</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Les notifications apparaîtront dans le centre de notifications des utilisateurs</li>
              <li>• Seuls les utilisateurs actifs recevront les notifications</li>
              <li>• Les notifications sont instantanées et ne peuvent pas être annulées après envoi</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
