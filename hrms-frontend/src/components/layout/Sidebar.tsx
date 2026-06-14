import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../hooks/usePermissions';
import { useEffect, useState } from 'react';
import { promotionsApi } from '../../api/promotions.api';

const I = ({ d }: { d: string }) => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const icons: Record<string, React.ReactNode> = {
  dashboard: <I d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
  fire:      <I d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />,
  inbox:     <I d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3M2.25 18.75h19.5" />,
  doc:       <I d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
  docCheck:  <I d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />,
  calendar:  <I d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
  plane:     <I d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />,
  folder:    <I d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />,
  users:     <I d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-1.997M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
  userCog:   <I d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />,
  building:  <I d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />,
  shield:    <I d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
  clock:     <I d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
  chip:      <I d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />,
  cert:      <I d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />,
  bell:      <I d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />,
  chat:      <I d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
  promo:     <I d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />,
};

type Entry =
  | { kind: 'link'; to: string; label: string; icon: string; roles: string[]; end?: boolean };

const EMP = ['DEPARTMENT_HEAD', 'PROFESSOR', 'STAFF'];
const HR = ['SUPER_ADMIN', 'ADMIN_HR'];
const SUPER = ['SUPER_ADMIN'];
const HR_MESSAGING = ['SUPER_ADMIN', 'ADMIN_HR', 'DEPARTMENT_HEAD', 'PROFESSOR', 'STAFF'];
const NON_SUPER_ADMIN = ['ADMIN_HR', 'DEPARTMENT_HEAD', 'PROFESSOR', 'STAFF', 'STUDENT'];

const menuConfig: Entry[] = [
  // Dashboard - للجميع ماعدا Super Admin
  { kind: 'link', to: '/dashboard', label: 'Tableau de bord', icon: 'dashboard', roles: NON_SUPER_ADMIN },
  
  // Super Admin Section
  { kind: 'link', to: '/superadmin', label: 'Tableau de bord', icon: 'dashboard', roles: SUPER },
  { kind: 'link', to: '/users', label: 'Gestion des utilisateurs', icon: 'userCog', roles: SUPER },
  { kind: 'link', to: '/broadcast', label: 'Notifications globales', icon: 'bell', roles: SUPER },
  { kind: 'link', to: '/certificates/manage', label: 'Gestion des demandes', icon: 'inbox', roles: SUPER },

  { kind: 'link', to: '/messaging', label: 'Messages', icon: 'chat', roles: HR_MESSAGING },

  // Nouvelle demande - للجميع ماعدا Admin و Super Admin
  { kind: 'link', to: '/requests/new', label: 'Nouvelle demande', icon: 'doc', roles: ['DEPARTMENT_HEAD', 'PROFESSOR', 'STAFF', 'STUDENT'] },
  { kind: 'link', to: '/requests', label: 'Mes demandes', icon: 'docCheck', roles: ['DEPARTMENT_HEAD', 'PROFESSOR', 'STAFF', 'STUDENT'] },

  // Gestion des demandes - للـ Admin فقط
  { kind: 'link', to: '/certificates/manage', label: 'Gestion des demandes', icon: 'inbox', roles: ['ADMIN_HR'] },

  { kind: 'link', to: '/certificates', label: 'Mes attestations', icon: 'cert', roles: EMP, end: true },
  { kind: 'link', to: '/leaves', label: 'Mes congés', icon: 'calendar', roles: EMP, end: true },
  { kind: 'link', to: '/missions', label: 'Mes missions', icon: 'plane', roles: EMP },

  { kind: 'link', to: '/templates', label: 'Modèles de documents', icon: 'folder', roles: HR },
  { kind: 'link', to: '/departements', label: 'Départements', icon: 'users', roles: HR },
  { kind: 'link', to: '/administratif', label: 'Administratif', icon: 'building', roles: HR },
  { kind: 'link', to: '/promotions',  label: 'Promotions',  icon: 'promo',  roles: HR },

];

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role ?? '';
  const [eligibleCount, setEligibleCount] = useState(0);

  // Fetch eligible count for ADMIN_HR badge
  useEffect(() => {
    if (role !== 'ADMIN_HR' && role !== 'SUPER_ADMIN') return;
    promotionsApi.getEligible('ECHELON')
      .then(r => {
        const data = r.data;
        const arr = Array.isArray(data) ? data : (data.results ?? []);
        setEligibleCount(arr.length);
      })
      .catch(() => {});
  }, [role]);

  const visible = menuConfig.filter(
    (e) => e.roles.length === 0 || e.roles.includes(role),
  );

  return (
    <aside className="w-[240px] bg-[#0f172a] text-white min-h-screen flex flex-col border-r border-slate-800/50">
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 p-1">
            <img src="/assets/logo general.jpeg" alt="FPT" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-white leading-tight tracking-wide">SGRH</p>
            <p className="text-[10px] text-slate-400 leading-tight">Faculté Polydisciplinaire</p>
            <p className="text-[10px] text-slate-400 leading-tight">de Taroudant</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        {visible.map((entry, i) =>
            <NavLink
              key={`${entry.to}-${i}`}
              to={entry.to}
              end={entry.end ?? false}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-[10px] rounded-md text-[14px] transition-colors duration-150 ${
                  isActive
                    ? 'bg-slate-700/80 text-white font-medium'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              {icons[entry.icon]}
              <span>{entry.label}</span>
              {entry.to === '/promotions' && eligibleCount > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {eligibleCount > 99 ? '99+' : eligibleCount}
                </span>
              )}
            </NavLink>
        )}
      </nav>

      {user && (
        <div className="px-4 py-3 border-t border-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 flex-shrink-0">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-slate-300 truncate">{user.first_name} {user.last_name}</p>
              <p className="text-[10px] text-slate-500 truncate">{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
