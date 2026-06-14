/**
 * NotificationToast — Floating popup when a new notification arrives.
 * Polls the unread-count endpoint every 30 s; when the count rises,
 * it fetches the latest unread notification and shows a transient toast.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, getUnreadCount } from '../../api/notifications.api';
import { useAuth } from '../../context/AuthContext';

/* ------------------------------------------------------------------ types */
type ToastData = {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  action_url?: string;
};

/* -------------------------------------------------- type → icon mapping */
const TYPE_ICON: Record<string, { emoji: string; bg: string; ring: string }> = {
  LEAVE_REQUEST:       { emoji: '📋', bg: 'bg-blue-50',   ring: 'ring-blue-100' },
  LEAVE_APPROVED:      { emoji: '✅', bg: 'bg-green-50',  ring: 'ring-green-100' },
  LEAVE_REJECTED:      { emoji: '❌', bg: 'bg-red-50',    ring: 'ring-red-100' },
  ATTENDANCE_ALERT:    { emoji: '⏰', bg: 'bg-amber-50',  ring: 'ring-amber-100' },
  PAYSLIP_READY:       { emoji: '💰', bg: 'bg-purple-50', ring: 'ring-purple-100' },
  EVALUATION_DUE:      { emoji: '📊', bg: 'bg-indigo-50', ring: 'ring-indigo-100' },
  EVALUATION_COMPLETE: { emoji: '🏆', bg: 'bg-teal-50',   ring: 'ring-teal-100' },
  SYSTEM:              { emoji: '🔔', bg: 'bg-gray-50',   ring: 'ring-gray-200' },
};

const TOAST_DURATION_MS = 5000;

/* ======================================================= component ======= */
export default function NotificationToast() {
  const [toast, setToast]     = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);
  const prevCount             = useRef<number | null>(null);
  const hideTimer             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user }              = useAuth();
  const navigate              = useNavigate();

  /* ------ dismiss helper */
  const dismiss = () => {
    setVisible(false);
    // let the exit animation finish before unmounting
    setTimeout(() => setToast(null), 350);
  };

  /* ------ polling logic */
  useEffect(() => {
    if (!user) return;

    const check = async () => {
      try {
        const countRes = await getUnreadCount();
        const count    = Number((countRes.data as Record<string, number>).unread_count) || 0;

        if (prevCount.current !== null && count > prevCount.current) {
          // New notification(s) arrived — show toast for the latest unread
          const listRes = await getNotifications();
          const all     = listRes.data.results ?? listRes.data;
          const latest  = (all as ToastData[]).find((n: any) => !n.is_read);

          if (latest) {
            if (hideTimer.current) clearTimeout(hideTimer.current);
            setToast(latest);
            // give a tick so the element is mounted before animating in
            requestAnimationFrame(() => {
              requestAnimationFrame(() => setVisible(true));
            });
            hideTimer.current = setTimeout(dismiss, TOAST_DURATION_MS);
          }
        }

        prevCount.current = count;
      } catch {
        /* ignore */
      }
    };

    check(); // immediate on mount
    const interval = setInterval(check, 30_000);
    return () => {
      clearInterval(interval);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [user]);

  if (!toast) return null;

  const { emoji, bg, ring } = TYPE_ICON[toast.notification_type] ?? TYPE_ICON.SYSTEM;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(110%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(110%); }
        }
        @keyframes shrinkWidth {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .toast-enter { animation: slideInRight 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .toast-exit  { animation: slideOutRight 0.3s ease-in forwards; }
      `}</style>

      <div
        className={`fixed top-5 right-5 z-[9999] w-80 ${visible ? 'toast-enter' : 'toast-exit'}`}
        role="alert"
        aria-live="polite"
      >
        <div
          className={`relative bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden cursor-pointer
            ring-1 ${ring} transition-shadow hover:shadow-3xl`}
          onClick={() => {
            dismiss();
            const dest = toast.action_url?.startsWith('/') ? toast.action_url : '/notifications';
            navigate(dest);
          }}
        >
          {/* Main content */}
          <div className="flex items-start gap-3 p-4">
            {/* Icon */}
            <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0 text-lg select-none`}>
              {emoji}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-1">
                {toast.title}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                {toast.message}
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={e => { e.stopPropagation(); dismiss(); }}
              className="flex-shrink-0 p-0.5 text-gray-300 hover:text-gray-500 transition-colors -mt-0.5"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-[3px] bg-gray-100 w-full">
            <div
              className="h-full bg-blue-400 rounded-full"
              style={{
                animation: `shrinkWidth ${TOAST_DURATION_MS}ms linear forwards`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
