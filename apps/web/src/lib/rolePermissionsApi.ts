import { supabase } from './supabase';

export const ALL_MODULES = [
  'Dashboard',
  'Branches',
  'Employees',
  'Orders',
  'Reservations',
  'Customers',
  'Menu',
  'Campaigns',
  'Feedback',
  'Reports',
  'Settings',
  'Financial',
] as const;

export type ModuleName = typeof ALL_MODULES[number];

export const ALL_ACTIONS = ['create', 'read', 'update', 'delete', 'approve', 'export'] as const;
export type ActionName = typeof ALL_ACTIONS[number];

export interface RoleRecord {
  id: string;
  name: string;
  description: string;
  color: string;
  isSystem: boolean;
  employeeCount: number;
  createdAt: string;
}

export interface ModulePermissionRecord {
  id?: string;
  roleId: string;
  module: ModuleName;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

export interface UserPermissionRecord {
  id?: string;
  userId: string;
  module: ModuleName;
  create?: boolean | null;
  read?: boolean | null;
  update?: boolean | null;
  delete?: boolean | null;
  approve?: boolean | null;
  export?: boolean | null;
}

export interface PermissionHistoryRecord {
  id: string;
  changedBy: string;
  targetType: 'role' | 'user';
  targetName: string;
  module: string;
  action: string;
  oldValue: boolean;
  newValue: boolean;
  timestamp: string;
}

// ─── Local Storage Keys ──────────────────────────────────────────────────────────
const STORAGE_ROLES_KEY = 'crm_restaurant_roles';
const STORAGE_ROLE_PERMS_KEY = 'crm_restaurant_role_perms';
const STORAGE_USER_PERMS_KEY = 'crm_restaurant_user_perms';
const STORAGE_PERM_HISTORY_KEY = 'crm_restaurant_perm_history';

// ─── Initial Baseline Seed Roles ────────────────────────────────────────────────
const DEFAULT_ROLES: RoleRecord[] = [
  {
    id: 'role-manager',
    name: 'Branch Manager',
    description: 'Full managerial access over floor, reservations, orders, staff and financial reports',
    color: '#1F313D',
    isSystem: true,
    employeeCount: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'role-cashier',
    name: 'Cashier & Front Desk',
    description: 'Process point of sale, receipts, quick billing and table reservations',
    color: '#79415A',
    isSystem: true,
    employeeCount: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'role-waiter',
    name: 'Service Staff / Waiter',
    description: 'Floor service, table status tagging, taking walk-in parties and orders',
    color: '#82401D',
    isSystem: true,
    employeeCount: 4,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'role-kitchen',
    name: 'Kitchen & Chef Lead',
    description: 'Kitchen display system, queue fulfillment, recipe and menu availability',
    color: '#3A5726',
    isSystem: true,
    employeeCount: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'role-host',
    name: 'Hostess / Reception',
    description: 'Guest greeting, VIP table bookings, seating plans and feedback collection',
    color: '#BA4F57',
    isSystem: true,
    employeeCount: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

// ─── Storage Helpers ─────────────────────────────────────────────────────────────
function loadRolesFromStorage(): RoleRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_ROLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse roles from storage:', err);
  }
  return DEFAULT_ROLES;
}

function saveRolesToStorage(roles: RoleRecord[]): void {
  try {
    localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(roles));
  } catch (err) {
    console.warn('Failed to save roles to storage:', err);
  }
}

// ─── API Functions ───────────────────────────────────────────────────────────────

export async function fetchRoles(orgId?: string): Promise<RoleRecord[]> {
  const localRoles = loadRolesFromStorage();
  try {
    let q = supabase.from('roles').select('*').order('created_at');
    if (orgId) q = q.eq('organization_id', orgId);
    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      const remoteRoles: RoleRecord[] = data.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        color: r.color || '#79415A',
        isSystem: Boolean(r.is_system),
        employeeCount: r.employee_count || 0,
        createdAt: r.created_at || '',
      }));
      for (const rem of remoteRoles) {
        if (!localRoles.some((l) => l.id === rem.id)) {
          localRoles.push(rem);
        }
      }
      saveRolesToStorage(localRoles);
    }
  } catch (err) {
    console.warn('Supabase fetch roles fallback to storage:', err);
  }
  return localRoles;
}

export async function saveRole(role: Partial<RoleRecord>, orgId?: string): Promise<boolean> {
  try {
    if (!role.name?.trim()) return false;
    const roles = loadRolesFromStorage();
    const roleId = role.id || `role-${Date.now()}`;
    const newRecord: RoleRecord = {
      id: roleId,
      name: role.name.trim(),
      description: role.description || '',
      color: role.color || '#79415A',
      isSystem: Boolean(role.isSystem),
      employeeCount: role.employeeCount || 0,
      createdAt: role.createdAt || new Date().toISOString(),
    };

    const idx = roles.findIndex((r) => r.id === roleId);
    if (idx >= 0) {
      roles[idx] = { ...roles[idx], ...newRecord };
    } else {
      roles.push(newRecord);
    }
    saveRolesToStorage(roles);

    // Sync to Supabase non-blocking
    Promise.resolve(
      supabase.from('roles').upsert({
        id: newRecord.id,
        name: newRecord.name,
        description: newRecord.description,
        color: newRecord.color,
        is_system: newRecord.isSystem,
        organization_id: orgId || null,
        updated_at: new Date().toISOString(),
      })
    ).catch(() => {});

    return true;
  } catch (err) {
    console.error('Error saving role:', err);
    return false;
  }
}

export async function deleteRole(id: string): Promise<boolean> {
  try {
    const roles = loadRolesFromStorage();
    const filtered = roles.filter((r) => r.id !== id);
    saveRolesToStorage(filtered);

    // Sync to Supabase non-blocking
    Promise.resolve(supabase.from('roles').delete().eq('id', id)).catch(() => {});
    return true;
  } catch (err) {
    console.error('Error deleting role:', err);
    return false;
  }
}

export async function fetchModulePermissions(roleId: string): Promise<ModulePermissionRecord[]> {
  try {
    const raw = localStorage.getItem(`${STORAGE_ROLE_PERMS_KEY}_${roleId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  // Fallback defaults per module
  return ALL_MODULES.map((m) => ({
    roleId,
    module: m,
    create: roleId === 'role-manager' || m === 'Orders' || m === 'Reservations',
    read: true,
    update: roleId === 'role-manager' || m === 'Orders',
    delete: roleId === 'role-manager',
    approve: roleId === 'role-manager',
    export: roleId === 'role-manager' || m === 'Reports',
  }));
}

export async function saveModulePermissions(roleId: string, perms: ModulePermissionRecord[]): Promise<boolean> {
  try {
    localStorage.setItem(`${STORAGE_ROLE_PERMS_KEY}_${roleId}`, JSON.stringify(perms));

    // Sync to Supabase non-blocking
    const payload = perms.map((p) => ({
      role_id: roleId,
      module: p.module,
      can_create: p.create,
      can_read: p.read,
      can_update: p.update,
      can_delete: p.delete,
      can_approve: p.approve,
      can_export: p.export,
      updated_at: new Date().toISOString(),
    }));
    Promise.resolve(supabase.from('role_permissions').upsert(payload)).catch(() => {});

    return true;
  } catch (err) {
    console.error('Error saving module permissions:', err);
    return false;
  }
}

export async function fetchUserPermissions(userId: string): Promise<UserPermissionRecord[]> {
  try {
    const raw = localStorage.getItem(`${STORAGE_USER_PERMS_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function saveUserPermissions(userId: string, perms: UserPermissionRecord[]): Promise<boolean> {
  try {
    localStorage.setItem(`${STORAGE_USER_PERMS_KEY}_${userId}`, JSON.stringify(perms));
    return true;
  } catch {
    return false;
  }
}

export async function fetchPermissionHistory(limit = 100): Promise<PermissionHistoryRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_PERM_HISTORY_KEY);
    if (raw) {
      const history: PermissionHistoryRecord[] = JSON.parse(raw);
      return history.slice(0, limit);
    }
  } catch {}
  return [];
}

export async function logPermissionChange(details: Omit<PermissionHistoryRecord, 'id' | 'timestamp'>): Promise<void> {
  try {
    const raw = localStorage.getItem(STORAGE_PERM_HISTORY_KEY);
    const logs: PermissionHistoryRecord[] = raw ? JSON.parse(raw) : [];
    logs.unshift({
      id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...details,
    });
    localStorage.setItem(STORAGE_PERM_HISTORY_KEY, JSON.stringify(logs.slice(0, 200)));
  } catch (err) {
    console.warn('Failed to log permission change:', err);
  }
}
