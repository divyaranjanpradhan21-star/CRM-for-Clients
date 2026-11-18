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

export async function fetchRoles(orgId?: string): Promise<RoleRecord[]> {
  try {
    let q = supabase.from('roles').select('*').order('created_at');
    if (orgId) q = q.eq('organization_id', orgId);
    const { data } = await q;
    if (data && data.length > 0) {
      return data.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        color: r.color || '#79415A',
        isSystem: Boolean(r.is_system),
        employeeCount: r.employee_count || 0,
        createdAt: r.created_at || '',
      }));
    }
    // Default baseline system roles
    return [
      { id: 'role-manager', name: 'Branch Manager', description: 'Full managerial access over floor, reservations, orders, staff and financial reports', color: '#1F313D', isSystem: true, employeeCount: 1, createdAt: '' },
      { id: 'role-cashier', name: 'Cashier & Front Desk', description: 'Process point of sale, receipts, quick billing and table reservations', color: '#79415A', isSystem: true, employeeCount: 2, createdAt: '' },
      { id: 'role-waiter', name: 'Service Staff / Waiter', description: 'Floor service, table status tagging, taking walk-in parties and orders', color: '#82401D', isSystem: true, employeeCount: 4, createdAt: '' },
      { id: 'role-kitchen', name: 'Kitchen & Chef Lead', description: 'Kitchen display system, queue fulfillment, recipe and menu availability', color: '#3A5726', isSystem: true, employeeCount: 3, createdAt: '' },
      { id: 'role-host', name: 'Hostess / Reception', description: 'Guest greeting, VIP table bookings, seating plans and feedback collection', color: '#BA4F57', isSystem: true, employeeCount: 1, createdAt: '' },
    ];
  } catch {
    return [];
  }
}

export async function saveRole(role: Partial<RoleRecord>, orgId?: string): Promise<boolean> {
  try {
    const payload: any = {
      name: role.name,
      description: role.description,
      color: role.color || '#79415A',
      is_system: false,
      updated_at: new Date().toISOString(),
    };
    if (orgId) payload.organization_id = orgId;
    if (role.id) payload.id = role.id;
    else payload.created_at = new Date().toISOString();

    const { error } = await supabase.from('roles').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteRole(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('roles').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchModulePermissions(roleId: string): Promise<ModulePermissionRecord[]> {
  try {
    const { data } = await supabase.from('role_permissions').select('*').eq('role_id', roleId);
    return (data || []).map((r: any) => ({
      id: r.id,
      roleId: r.role_id,
      module: r.module as ModuleName,
      create: Boolean(r.can_create),
      read: r.can_read !== false,
      update: Boolean(r.can_update),
      delete: Boolean(r.can_delete),
      approve: Boolean(r.can_approve),
      export: Boolean(r.can_export),
    }));
  } catch {
    return [];
  }
}

export async function saveModulePermissions(roleId: string, perms: ModulePermissionRecord[]): Promise<boolean> {
  try {
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
    const { error } = await supabase.from('role_permissions').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchUserPermissions(userId: string): Promise<UserPermissionRecord[]> {
  try {
    const { data } = await supabase.from('user_permissions').select('*').eq('user_id', userId);
    return (data || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      module: r.module as ModuleName,
      create: r.can_create ?? null,
      read: r.can_read ?? null,
      update: r.can_update ?? null,
      delete: r.can_delete ?? null,
      approve: r.can_approve ?? null,
      export: r.can_export ?? null,
    }));
  } catch {
    return [];
  }
}

export async function saveUserPermissions(userId: string, perms: UserPermissionRecord[]): Promise<boolean> {
  try {
    const payload = perms.map((p) => ({
      user_id: userId,
      module: p.module,
      can_create: p.create,
      can_read: p.read,
      can_update: p.update,
      can_delete: p.delete,
      can_approve: p.approve,
      can_export: p.export,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('user_permissions').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchPermissionHistory(limit = 100): Promise<PermissionHistoryRecord[]> {
  try {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('event_type', 'permission_change')
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data || []).map((r: any) => ({
      id: r.id,
      changedBy: r.actor_name || r.actor_email || 'Administrator',
      targetType: r.target_type || 'role',
      targetName: r.target_name || 'System Role',
      module: r.module || 'General',
      action: r.action || 'permission_update',
      oldValue: r.old_value === true,
      newValue: r.new_value === true,
      timestamp: r.created_at || '',
    }));
  } catch {
    return [];
  }
}

export async function logPermissionChange(details: Omit<PermissionHistoryRecord, 'id' | 'timestamp'>): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      event_type: 'permission_change',
      actor_name: details.changedBy,
      target_type: details.targetType,
      target_name: details.targetName,
      module: details.module,
      action: details.action,
      old_value: details.oldValue,
      new_value: details.newValue,
      created_at: new Date().toISOString(),
    });
  } catch {
    // silent
  }
}
