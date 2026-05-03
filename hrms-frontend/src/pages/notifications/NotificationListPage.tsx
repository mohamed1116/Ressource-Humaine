import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications.api';

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
  PAYSLIP_READY:       { dot: 'bg-purple-500', label: 'Paie' },
  EVALUATION_DUE:      { dot: 'bg-indigo-500', label: 'Évaluation' },
  EVALUATION_COMPLETE: { dot: 'bg-teal-500',   label: 'Évaluation' },
  SYSTEM:              { dot: 'bg-gray-400',   label: 'Système' },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function NotificationListPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  const fetch = () => {
    getNotifications()
      .then(res => setNotifications(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.id);
    if (n.action_url) navigate(n.action_url);
    else fetch();
  };

  const handleMarkAllRead = async () => { await markAllAsRead(); fetch(); };

  const unread = notifications.filter(n => !n.is_read).length;
  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est lu'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tabs */}
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
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1,2,3,4].map(i => (
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">Aucune notification</p>
            <p className="text-xs text-gray-400 mt-1">Vous êtes à jour</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(n => {
              const cfg = TYPE_CONFIG[n.notification_type] || TYPE_CONFIG.SYSTEM;
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`px-5 py-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-gray-50/70 ${
                    !n.is_read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  {/* Dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${!n.is_read ? cfg.dot : 'bg-gray-200'}`} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.created_at)}</p>
                    {!n.is_read && (
                      <div className="flex justify-end mt-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
