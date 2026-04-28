/**
 * Sidebar Navigation
 * ==================
 * Config-driven, role-based sidebar for an institutional HRM system.
 *
 * Architecture:
 *   - menuConfig[] is the single source of truth for the entire menu
 *   - Each entry has a roles[] array: empty = visible to all roles
 *   - Component filters by current user's role at render time
 *   - Phase 2 modules (Presence, Paie, Evaluations) are excluded
 *
 * Design:
 *   - Dark navy (#0f172a), slate text, white active state
 *   - Section headers as small uppercase labels with extra top spacing
 *   - Heroicons outline (1.5px stroke) for all icons
 *   - Subtle hover (bg-slate-800/60), no flashy effects
 */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../hooks/usePermissions';

/* ━━━━━━ Icon helper (single SVG path) ━━━━━━ */
const I = ({ d }: { d: string }) => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const icons: Record<string, React.ReactNode> = {
  dashboard: <I d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
  inbox: <I d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3M2.25 18.75h19.5" />,
  doc: <I d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
  docCheck: <I d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />,
  calendar: <I d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
  plane: <I d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />,
  folder: <I d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />,
  users: <I d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-1.997M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
  building: <I d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />,
  shield: <I d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
};

/* ━━━━━━ Menu configuration ━━━━━━ */
type Entry =
  | { kind: 'section'; label: string; roles: string[] }
  | { kind: 'link'; to: string; label: string; icon: string; roles: string[] };

const ALL: string[] = [];
const EMP = ['ADMIN_HR', 'DEPARTMENT_HEAD', 'PROFESSOR', 'STAFF'];
const HR = ['ADMIN_HR'];

const menuConfig: Entry[] = [
  { kind: 'link', to: '/dashboard', label: 'Tableau de bord', icon: 'dashboard', roles: ALL },

  // --- Demandes (unified request system) ---
  { kind: 'section', label: 'Demandes', roles: ALL },
  { kind: 'link', to: '/requests/new', label: 'Nouvelle demande', icon: 'doc', roles: ALL },
  { kind: 'link', to: '/requests', label: 'Mes demandes', icon: 'docCheck', roles: ALL },
  { kind: 'link', to: '/requests/all', label: 'Toutes les demandes', icon: 'inbox', roles: HR },

  { kind: 'section', label: 'Conges', roles: EMP },
  { kind: 'link', to: '/leaves/request', label: 'Demander un conge', icon: 'calendar', roles: EMP },
  { kind: 'link', to: '/leaves', label: 'Mes conges', icon: 'calendar', roles: EMP },

  { kind: 'section', label: 'Missions', roles: EMP },
  { kind: 'link', to: '/missions', label: 'Mes missions', icon: 'plane', roles: EMP },

  { kind: 'section', label: 'Documents', roles: HR },
  { kind: 'link', to: '/templates', label: 'Modeles de documents', icon: 'folder', roles: HR },

  { kind: 'section', label: 'Ressources Humaines', roles: HR },
  { kind: 'link', to: '/employees', label: 'Personnel', icon: 'users', roles: HR },
  { kind: 'link', to: '/departments', label: 'Departements', icon: 'building', roles: HR },

  { kind: 'section', label: 'Administration', roles: HR },
  { kind: 'link', to: '/audit', label: 'Journal d\'audit', icon: 'shield', roles: HR },
];

/* ━━━━━━ Component ━━━━━━ */
export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const visible = menuConfig.filter(
    (e) => e.roles.length === 0 || e.roles.includes(role),
  );

  return (
    <aside className="w-[240px] bg-[#0f172a] text-white min-h-screen flex flex-col border-r border-slate-800/50">
      {/* Institution header */}
      <div className="px-5 py-5 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-[#0f172a] font-extrabold text-[11px] leading-none">FPT</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white leading-tight">SGRH</p>
            <p className="text-[10px] text-slate-500 leading-tight">Faculte Polydisciplinaire</p>
            <p className="text-[10px] text-slate-500 leading-tight">de Taroudant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        {visible.map((entry, i) =>
          entry.kind === 'section' ? (
            <p key={`s${i}`} className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 pt-5 pb-1.5 select-none">
              {entry.label}
            </p>
          ) : (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.to === '/requests' || entry.to === '/leaves'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-[7px] rounded-md text-[13px] transition-colors duration-150 ${
                  isActive
                    ? 'bg-slate-700/80 text-white font-medium'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              {icons[entry.icon]}
              <span>{entry.label}</span>
            </NavLink>
          ),
        )}
      </nav>

      {/* User block */}
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
