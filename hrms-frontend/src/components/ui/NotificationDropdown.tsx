/**
 * NotificationDropdown — Bell icon with an in-place dropdown panel.
 * Shows the 8 most recent notifications; supports mark-as-read and delete.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '../../api/notifications.api';

/* ------------------------------------------------------------------ types */
type Notif = {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
};

/* --------------------------------------------------------- type config map */
const TYPE_CFG: Record<string, { dot: string; badge: string; badgeTxt: string; label: string }> = {
  LEAVE_REQUEST:       { dot: 'bg-blue-500',   badge: 'bg-blue-100',   badgeTxt: 'text-blue-600',   label: 'Congé' },
  LEAVE_APPROVED:      { dot: 'bg-green-500',  badge: 'bg-green-100',  badgeTxt: 'text-green-600',  label: 'Approuvé' },
  LEAVE_REJECTED:      { dot: 'bg-red-500',    badge: 'bg-red-100',    badgeTxt: 'text-red-600',    label: 'Rejeté' },
  ATTENDANCE_ALERT:    { dot: 'bg-amber-500',  badge: 'bg-amber-100',  badgeTxt: 'text-amber-600',  label: 'Présence' },
  PAYSLIP_READY:       { dot: 'bg-purple-500', badge: 'bg-purple-100', badgeTxt: 'text-purple-600', label: 'Paie' },
  EVALUATION_DUE:      { dot: 'bg-indigo-500', badge: 'bg-indigo-100', badgeTxt: 'text-indigo-600', label: 'Évaluation' },
  EVALUATION_COMPLETE: { dot: 'bg-teal-500',   badge: 'bg-teal-100',   badgeTxt: 'text-teal-600',   label: 'Évaluation' },
  SYSTEM:              { dot: 'bg-gray-400',   badge: 'bg-gray-100',   badgeTxt: 'text-gray-600',   label: 'Système' },
};

/* --------------------------------------------------------------- timeAgo */
function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/* ======================================================= component ======= */
export default function NotificationDropdown() {
  const [open, setOpen]                   = useState(false);
  const [unread, setUnread]               = useState(0);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading]             = useState(false);
  const containerRef                      = useRef<HTMLDivElement>(null);
  const navigate                          = useNavigate();

  /* ----------- poll unread count every 30 s */
  const refreshCount = useCallback(() => {
    getUnreadCount()
      .then(r => setUnread(Number((r.data as Record<string, number>).unread_count) || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, 30_000);
    return () => clearInterval(id);
  }, [refreshCount]);

  /* ----------- fetch notifications when panel opens */
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getNotifications()
      .then(r => setNotifications((r.data.results ?? r.data).slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  /* ----------- click-outside → close */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ----------- actions */
  const handleNotifClick = async (n: Notif) => {
    setOpen(false);
    if (!n.is_read) {
      await markAsRead(n.id).catch(() => {});
      setUnread(p => Math.max(0, p - 1));
    }
    const dest = n.action_url?.startsWith('/') ? n.action_url : '/notifications';
    navigate(dest);
  };

  const handleMarkOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await markAsRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(p => Math.max(0, p - 1));
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id).catch(() => {});
    setNotifications(prev => {
      const removed = prev.find(n => n.id === id);
      if (removed && !removed.is_read) setUnread(p => Math.max(0, p - 1));
      return prev.filter(n => n.id !== id);
    });
  };

  const handleMarkAll = async () => {
    await markAllAsRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  /* ========================================================= render ====== */
  return (
    <div ref={containerRef} className="relative">

      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative p-1.5 transition-colors rounded-md ${
          open ? 'text-gray-700 bg-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
        aria-label="Notifications"
      >
        {/* Bell SVG */}
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          style={{ animation: 'dropIn 0.15s ease-out' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full">
                  {unread} non lue{unread > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Tout marquer lu
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              /* Skeleton */
              <div className="divide-y divide-gray-50">
                {[1, 2, 3].map(i => (
                  <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-0.5">
                      <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                      <div className="h-2 bg-gray-100 rounded w-full" />
                      <div className="h-2 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              /* Empty */
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">Aucune notification</p>
                <p className="text-xs text-gray-400 mt-0.5">Vous êtes à jour !</p>
              </div>
            ) : (
              /* Notification list */
              <div className="divide-y divide-gray-50">
                {notifications.map(n => {
                  const cfg = TYPE_CFG[n.notification_type] ?? TYPE_CFG.SYSTEM;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`group relative px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                        !n.is_read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Type badge */}
                      <div className={`w-8 h-8 rounded-full ${cfg.badge} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <span className={`text-xs font-bold ${cfg.badgeTxt}`}>
                          {cfg.label.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.badge} ${cfg.badgeTxt}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className={`text-xs leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>

                      {/* Unread dot */}
                      {!n.is_read && (
                        <div className="absolute right-4 top-4 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      )}

                      {/* Hover actions */}
                      <div className="absolute right-3 top-2 hidden group-hover:flex flex-col gap-1 bg-white/90 rounded-md p-1 shadow-sm border border-gray-100">
                        {!n.is_read && (
                          <button
                            onClick={e => handleMarkOne(e, n.id)}
                            title="Marquer comme lu"
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={e => handleDelete(e, n.id)}
                          title="Supprimer"
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50/60">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Voir toutes les notifications
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Keyframe style */}
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}
