/**
 * usePermissions Hook
 * -------------------
 * Centralized role-based permission logic.
 * Every component uses this instead of checking user.role manually.
 *
 * Role hierarchy:
 *   ADMIN_HR        -- Full system access, HR management, template editing
 *   DEPARTMENT_HEAD -- Approvals, evaluations, department-scoped views
 *   PROFESSOR       -- Certificate requests (administrative), missions, leaves
 *   STAFF           -- Certificate requests (administrative), leaves
 *   STUDENT         -- Certificate requests (academic only)
 */
import { useAuth } from '../context/AuthContext';
import type { User } from '../types/auth.types';

type Role = User['role'];

export function usePermissions() {
  const { user } = useAuth();
  const role: Role | null = user?.role ?? null;

  return {
    role,
    /** True if the user has one of the given roles */
    hasRole: (...roles: Role[]) => role !== null && roles.includes(role),

    /** Super Admin -- full system control + user management */
    isSuperAdmin: role === 'SUPER_ADMIN',

    /** Admin / HR -- full system control */
    isAdmin: role === 'ADMIN_HR' || role === 'SUPER_ADMIN',

    /** Department head -- approvals, evaluations */
    isHead: role === 'DEPARTMENT_HEAD',

    /** Professor -- teacher */
    isTeacher: role === 'PROFESSOR',

    /** Administrative staff */
    isStaff: role === 'STAFF',

    /** Student -- limited to academic certificates */
    isStudent: role === 'STUDENT',

    /** Can manage HR operations (employees, salary, templates, audit) */
    canManageHR: role === 'ADMIN_HR' || role === 'SUPER_ADMIN',

    /** Can approve requests (HR or department head) */
    canApprove: role === 'ADMIN_HR' || role === 'SUPER_ADMIN' || role === 'DEPARTMENT_HEAD',

    /** Can manage users (Super Admin only) */
    canManageUsers: role === 'SUPER_ADMIN',

    /** Can request administrative documents (everyone except students) */
    canRequestAdminDocs: role !== 'STUDENT' && role !== null,

    /** Can request academic documents (students) */
    canRequestAcademicDocs: role === 'STUDENT',

    /** Can view missions module */
    canViewMissions: role !== 'STUDENT' && role !== null,

    /** Can manage missions (create/approve) */
    canManageMissions: role === 'ADMIN_HR' || role === 'SUPER_ADMIN',

    /** Can view evaluations */
    canViewEvaluations: role === 'ADMIN_HR' || role === 'DEPARTMENT_HEAD',

    /** French label for the role */
    roleLabel: role ? ROLE_LABELS[role] : '',
  };
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_HR: 'Administrateur RH',
  DEPARTMENT_HEAD: 'Chef de Departement',
  PROFESSOR: 'Enseignant',
  STAFF: 'Personnel Administratif',
  STUDENT: 'Etudiant',
};
