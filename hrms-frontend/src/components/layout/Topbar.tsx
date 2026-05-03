/**
 * Topbar -- notification bell, profile link, logout
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ROLE_LABELS } from '../../hooks/usePermissions';
import { getUnreadCount } from '../../api/notifications.api';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  /* Fetch unread notification count every 30 seconds */
  useEffect(() => {
    const fetch = () => { getUnreadCount().then(r => setUnread(Number((r.data as Record<string, number>).unread_count) || 0)).catch(() => {}); };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-sm font-medium text-gray-600 hidden md:block">Systeme de Gestion des Ressources Humaines</h2>
      <div className="flex items-center gap-4 ml-auto">
        {/* Notification bell */}
        <Link to="/notifications" className="relative p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        <div className="w-px h-6 bg-gray-200" />

        {/* User info + profile link */}
        <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white text-[11px] font-bold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-medium text-gray-800 leading-tight">{user?.first_name} {user?.last_name}</p>
            <p className="text-[11px] text-gray-400 leading-tight">{ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role}</p>
          </div>
        </Link>

        <div className="w-px h-6 bg-gray-200" />

        <button onClick={handleLogout} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Deconnexion
        </button>
      </div>
    </div>
  );
}
