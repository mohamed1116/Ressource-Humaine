// Notifications page - displays and manages user notifications
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../api/notifications.api';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { getUsers } from '../../api/users.api';
import { Send, X } from 'lucide-react';

type Notification = {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
};

const TYPE_CONFIG: Record<string, { dot: string; label: string }> = {
  LEAVE_REQUEST:       { dot: 'bg-blue-500',   label: 'Congé' },
  LEAVE_APPROVED:      { dot: 'bg-green-500',  label: 'Congé approuvé' },
  LEAVE_REJECTED:      { dot: 'bg-red-500',    label: 'Congé rejeté' },
  ATTENDANCE_ALERT:    { dot: 'bg-amber-500',  label: 'Présence' },
  EVALUATION_DUE:      { dot: 'bg-indigo-500', label: 'Évaluation' },
  EVALUATION_COMPLETE: { dot: 'bg-teal-500',   label: 'Évaluation' },
  SYSTEM:              { dot: 'bg-gray-400',   label: 'Système' },
  SYSTEM_ANNOUNCEMENT: { dot: 'bg-blue-600',   label: 'Annonce' },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

type Target = 'ALL' | 'ROLE';
type Role = 'ADMIN_HR' | 'DEPARTMENT_HEAD' | 'PROFESSOR' | 'STAFF' | 'STUDENT';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'ADMIN_HR',         label: 'Admin RH' },
  { value: 'DEPARTMENT_HEAD',  label: 'Chef de département' },
  { value: 'PROFESSOR',        label: 'Professeur' },
  { value: 'STAFF',            label: 'Personnel' },
  { value: 'STUDENT',          label: 'Étudiant' },
];

export default function NotificationListPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState<'all' | 'unread'>('all');
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const navigate = useNavigate();
  const { user }    = useAuth();

  /* ── Broadcast modal state ── */
  const [showBroadcast, setShowBroadcast]   = useState(false);
  const [target, setTarget]                 = useState<Target>('ALL');
  const [title, setTitle]                   = useState('');
  const [message, setMessage]               = useState('');
  const [selectedRoles, setSelectedRoles]   = useState<Role[]>([]);
  const [selectedUsers, setSelectedUsers]   = useState<string[]>([]);
  const [roleUsers, setRoleUsers]           = useState<any[]>([]);
  const [loadingRoleUsers, setLoadingRoleUsers] = useState(false);
  const [userSearch, setUserSearch]         = useState('');
  const [sending, setSending]               = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [attachment, setAttachment]         = useState<File | null>(null);

  /* ── Fetch notifications ── */
  const fetchNotifications = () => {
    setLoading(true);
    getNotifications()
      .then(res => setNotifications(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  /* ── Load users for broadcast when roles change ── */
  useEffect(() => {
    if (target === 'ROLE' && selectedRoles.length > 0) {
      setLoadingRoleUsers(true);
      setUserSearch('');

      const fetchAllUsers = async () => {
        let allUsers: any[] = [];
        let page = 1;
        let hasNext = true;
        try {
          while (hasNext) {
            const res = await getUsers({ page: page.toString() });
            const users = res.data.results || res.data;
            allUsers = [...allUsers, ...users];
            hasNext = Boolean(res.data.next);
            page++;
          }
          setRoleUsers(allUsers.filter((u: any) => selectedRoles.includes(u.role)));
        } catch {
          setRoleUsers([]);
        } finally {
          setLoadingRoleUsers(false);
        }
      };

      fetchAllUsers();
    } else {
      setRoleUsers([]);
      setSelectedUsers([]);
    }
  }, [selectedRoles, target]);

  /* ── Handlers ── */
  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.id);

    // Direct navigation if action_url is set (e.g. promotion notifications)
    if (n.action_url) {
      navigate(n.action_url);
      return;
    }

    const isRequestRelated =
      ['LEAVE_REQUEST', 'CERTIFICATE_REQUEST', 'MISSION_REQUEST', 'LEAVE_APPROVED', 'LEAVE_REJECTED'].includes(n.notification_type);

    const isAdminOrSuper = user?.role === 'ADMIN_HR' || user?.role === 'SUPER_ADMIN';

    if (isAdminOrSuper && isRequestRelated) {
      navigate('/certificates/manage');
    } else {
      const typeRoutes: Record<string, string> = {
        LEAVE_APPROVED:       '/requests',
        LEAVE_REJECTED:       '/requests',
        CERTIFICATE_APPROVED: '/requests',
        CERTIFICATE_REJECTED: '/requests',
        MISSION_APPROVED:     '/requests',
        MISSION_REJECTED:     '/requests',
        ATTENDANCE_ALERT:     '/attendance',
        EVALUATION_DUE:       '/performance',
        EVALUATION_COMPLETE:  '/performance',
      };
      const route = typeRoutes[n.notification_type];
      if (route) navigate(route);
      else fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => { await markAllAsRead(); fetchNotifications(); };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      /* silent */
    } finally {
      setDeletingId(null);
    }
  };

  const handleRoleToggle = (role: Role) =>
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      setBroadcastError('Le titre et le message sont obligatoires');
      return;
    }
    if (target === 'ROLE' && selectedRoles.length === 0) {
      setBroadcastError('Veuillez sélectionner au moins un rôle');
      return;
    }

    setSending(true);
    setBroadcastError(null);
    setBroadcastSuccess(null);

    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('message', message.trim());
      fd.append('target', selectedUsers.length > 0 ? 'SPECIFIC' : target);
      if (selectedUsers.length > 0) selectedUsers.forEach(id => fd.append('user_ids', id));
      else if (target === 'ROLE') selectedRoles.forEach(r => fd.append('roles', r));
      if (attachment) fd.append('attachment', attachment);

      const endpoint = user?.role === 'SUPER_ADMIN'
        ? '/auth/superadmin/broadcast-notification/'
        : '/notifications/broadcast/';

      const response = await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBroadcastSuccess(`Notification envoyée à ${response.data.count} utilisateurs`);
      setTitle(''); setMessage(''); setSelectedRoles([]); setSelectedUsers([]); setTarget('ALL'); setAttachment(null);
      setTimeout(() => { setShowBroadcast(false); setBroadcastSuccess(null); fetchNotifications(); }, 2000);
    } catch (err: any) {
      setBroadcastError(err.response?.data?.detail || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const unread   = notifications.filter(n => !n.is_read).length;
  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  const filteredRoleUsers = roleUsers.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  /* ================================================================= render */
  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est lu'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 text-sm gap-1">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f === 'all' ? 'Toutes' : `Non lues${unread > 0 ? ` (${unread})` : ''}`}
              </button>
            ))}
          </div>

          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Tout marquer lu
            </button>
          )}

          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_HR') && (
            <button
              onClick={() => setShowBroadcast(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Message groupé
            </button>
          )}
        </div>
      </div>

      {/* ── Notification list ── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="px-5 py-4 flex items-start gap-4 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-gray-200 mt-2 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">Aucune notification</p>
            <p className="text-xs text-gray-400 mt-1">Vous êtes à jour</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(n => {
              const cfg = TYPE_CONFIG[n.notification_type] || TYPE_CONFIG.SYSTEM;
              const isDeleting = deletingId === n.id;
              return (
                <div
                  key={n.id}
                  onClick={() => !isDeleting && handleClick(n)}
                  className={`group px-5 py-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-gray-50/70 ${
                    !n.is_read ? 'bg-blue-50/30' : ''
                  } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {/* Status dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${!n.is_read ? cfg.dot : 'bg-gray-200'}`} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {cfg.label}
                      </span>
                    </div>
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    {(n as any).attachment_url && (
                      <a
                        href={(n as any).attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        Télécharger la pièce jointe
                      </a>
                    )}
                  </div>

                  {/* Time + actions */}
                  <div className="flex-shrink-0 text-right flex flex-col items-end gap-1.5">
                    <p className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.created_at)}</p>
                    {!n.is_read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}

                    {/* Delete button — visible on row hover */}
                    <button
                      onClick={e => handleDelete(e, n.id)}
                      title="Supprimer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500 rounded"
                    >
                      {isDeleting ? (
                        <svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================= Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Message groupé</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Envoyer une notification à tous les utilisateurs ou à un groupe spécifique
                </p>
              </div>
              <button
                onClick={() => { setShowBroadcast(false); setBroadcastError(null); setBroadcastSuccess(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {broadcastSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  ✓ {broadcastSuccess}
                </div>
              )}
              {broadcastError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {broadcastError}
                </div>
              )}

              {/* Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destinataires</label>
                <div className="space-y-2">
                  {(['ALL', 'ROLE'] as Target[]).map(t => (
                    <label key={t} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" checked={target === t} onChange={() => setTarget(t)} className="w-4 h-4" />
                      <div>
                        <p className="text-sm font-medium">
                          {t === 'ALL' ? 'Tous les utilisateurs' : 'Rôles spécifiques'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t === 'ALL' ? 'Envoyer à tous les utilisateurs actifs' : 'Sélectionner des rôles spécifiques'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Role selection */}
              {target === 'ROLE' && (
                <div className="pl-7 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner les rôles</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLE_OPTIONS.map(role => (
                        <label key={role.value} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role.value)}
                            onChange={() => handleRoleToggle(role.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedRoles.length > 0 && (
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Utilisateurs concernés{' '}
                          {selectedUsers.length > 0
                            ? `(${selectedUsers.length} sélectionné${selectedUsers.length > 1 ? 's' : ''})`
                            : '(tous)'}
                        </label>
                        {selectedUsers.length > 0 && (
                          <button onClick={() => setSelectedUsers([])} className="text-xs text-blue-600 hover:text-blue-800">
                            Désélectionner tout
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Laissez vide pour envoyer à tous, ou sélectionnez des utilisateurs spécifiques
                      </p>
                      <input
                        type="text"
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        placeholder="Rechercher par nom ou email..."
                        className="w-full px-3 py-2 border rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="border rounded-lg max-h-48 overflow-y-auto">
                        {loadingRoleUsers ? (
                          <div className="p-4 text-center text-sm text-gray-500">Chargement...</div>
                        ) : filteredRoleUsers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">Aucun utilisateur trouvé</div>
                        ) : (
                          <div className="divide-y">
                            {filteredRoleUsers.map(u => (
                              <label key={u.id} className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-gray-50">
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(u.id)}
                                  onChange={e =>
                                    setSelectedUsers(prev =>
                                      e.target.checked ? [...prev, u.id] : prev.filter(id => id !== u.id)
                                    )
                                  }
                                  className="w-4 h-4"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                </div>
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                  {ROLE_OPTIONS.find(r => r.value === u.role)?.label || u.role}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Maintenance système prévue"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/200</p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Écrivez votre message ici..."
                  rows={8}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">{message.length}/2000</p>
              </div>

              {/* File attachment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pièce jointe (optionnel)</label>
                <input
                  type="file"
                  onChange={e => setAttachment(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {attachment && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    {attachment.name}
                    <button onClick={() => setAttachment(null)} className="text-red-400 hover:text-red-600 ml-1">✕</button>
                  </div>
                )}
              </div>

              {/* Preview */}
              {(title || message) && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Aperçu</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        {title   && <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>}
                        {message && <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowBroadcast(false); setTitle(''); setMessage('');
                  setSelectedRoles([]); setSelectedUsers([]); setTarget('ALL');
                  setBroadcastError(null); setBroadcastSuccess(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={sending || !title.trim() || !message.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
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
                    <Send className="w-4 h-4" />
                    Envoyer la notification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
