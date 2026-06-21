/**
 * Topbar — notification bell (dropdown), messaging icon, profile link, logout.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ROLE_LABELS } from '../../hooks/usePermissions';
import { getUnreadMessagesCount } from '../../api/messaging.api';
import NotificationDropdown from '../ui/NotificationDropdown';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const isStudent = user?.role === 'STUDENT';

  /* Poll messaging unread count every 30 s */
  useEffect(() => {
    if (isStudent) return;
    const fetch = () => {
      getUnreadMessagesCount()
        .then(r => setUnreadMsgs(Number((r.data as Record<string, number>).unread_count) || 0))
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, [isStudent]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-sm font-medium text-gray-600 hidden md:block">
        Système de Gestion des Ressources Humaines
      </h2>

      <div className="flex items-center gap-2 ml-auto">

        {/* ── Messaging icon — hidden for students ── */}
        {!isStudent && (
          <Link
            to="/messaging"
            className="relative p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            title="Messages"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadMsgs > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadMsgs > 9 ? '9+' : unreadMsgs}
              </span>
            )}
          </Link>
        )}

        {/* ── Notification bell with dropdown ── */}
        <NotificationDropdown />

        <div className="w-px h-6 bg-gray-200" />

        {/* ── User info + profile link ── */}
        <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white text-[11px] font-bold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-medium text-gray-800 leading-tight">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">
              {ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role}
            </p>
          </div>
        </Link>

        <div className="w-px h-6 bg-gray-200" />

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Déconnexion
        </button>
      </div>
    </div>
  );
}
