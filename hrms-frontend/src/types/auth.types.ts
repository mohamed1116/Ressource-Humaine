export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'ADMIN_HR' | 'DEPARTMENT_HEAD' | 'PROFESSOR' | 'STAFF' | 'STUDENT';
  phone: string;
  avatar: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface TokenPair {
  access: string;
  refresh: string;
}
