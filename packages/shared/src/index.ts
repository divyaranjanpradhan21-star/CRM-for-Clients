export const MODULES = [
  'leads', 'followups', 'tasks', 'clients', 'deals', 'products', 'quotations',
  'invoices', 'payments', 'campaigns', 'tickets', 'communications', 'documents',
  'reports', 'employees', 'users', 'roles', 'settings', 'audit', 'notifications',
] as const;
export type ModuleKey = (typeof MODULES)[number];

export const ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN', 'EXPORT', 'IMPORT', 'APPROVE'] as const;
export type ActionKey = (typeof ACTIONS)[number];

export const SCOPES = ['OWN', 'TEAM', 'ORG', 'ALL'] as const;
export type ScopeKey = (typeof SCOPES)[number];

export const ROLE_KEYS = [
  'super_admin', 'admin', 'sales_manager', 'sales_executive',
  'marketing_manager', 'support_executive', 'accountant', 'viewer',
] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export interface ApiSuccess<T> { success: true; data: T; meta?: { page: number; pageSize: number; total: number } }
export interface ApiFailure { success: false; error: { code: string; message: string; details?: unknown; requestId?: string } }
