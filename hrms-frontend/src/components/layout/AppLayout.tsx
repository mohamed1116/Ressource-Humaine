/**
 * App Layout -- sidebar + topbar + main content.
 * Hamburger button works on both mobile and desktop.
 */
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import NotificationToast from '../ui/NotificationToast';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = sessionStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    sessionStorage.setItem('sidebarOpen', String(sidebarOpen));
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-auto transition-all duration-200 flex-shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full lg:w-0 lg:overflow-hidden'
      }`}>
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center gap-3 flex-shrink-0">
          {/* Hamburger -- visible on all screen sizes */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title={sidebarOpen ? 'Masquer le menu' : 'Afficher le menu'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="flex-1">
            <Topbar />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Global toast — renders outside the scroll container */}
      <NotificationToast />
    </div>
  );
}
