import { supabase } from './supabase';

export interface EmployeeRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  branchId: string;
  branchName: string;
  departmentId: string;
  departmentName: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  joinedAt: string;
  lastLogin?: string;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  description?: string;
}

export interface LoginHistoryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  loginTime: string;
  ipAddress: string;
  status: 'success' | 'failed';
  device: string;
}

export interface ActivityLogRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  action: string;
  module: string;
  timestamp: string;
  details: string;
}

export interface ModuleAccessRecord {
  employeeId: string;
  module: string;
  hasAccess: boolean;
}

export async function fetchEmployees(orgId?: string, branchId?: string): Promise<EmployeeRecord[]> {
  try {
    let q = supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(100);
    if (orgId) q = q.eq('organization_id', orgId);
    if (branchId && branchId !== 'all') q = q.eq('branch_id', branchId);
    const { data } = await q;
    return (data || []).map((r: any) => ({
      id: r.id,
      fullName: r.full_name || r.name || 'Staff Member',
      email: r.email || '',
      phone: r.phone || '',
      role: r.role || 'Staff',
      branchId: r.branch_id || '',
      branchName: r.branch_name || r.branch || '',
      departmentId: r.department_id || '',
      departmentName: r.department_name || r.department || '',
      status: r.status || 'active',
      avatar: r.avatar_url,
      joinedAt: r.created_at || '',
      lastLogin: r.last_login,
    }));
  } catch {
    return [];
  }
}

export async function fetchDepartments(orgId?: string): Promise<DepartmentRecord[]> {
  try {
    let q = supabase.from('departments').select('*').order('name');
    if (orgId) q = q.eq('organization_id', orgId);
    const { data } = await q;
    if (data && data.length > 0) {
      return data.map((r: any) => ({ id: r.id, name: r.name, description: r.description }));
    }
    // Return standard department choices for selection
    return [
      { id: 'kitchen', name: 'Kitchen & Culinary' },
      { id: 'floor', name: 'Floor & Service' },
      { id: 'bar', name: 'Beverage & Bar' },
      { id: 'management', name: 'Operations & Management' },
      { id: 'cashier', name: 'Billing & Front Desk' },
      { id: 'logistics', name: 'Dispatch & Delivery' },
    ];
  } catch {
    return [
      { id: 'kitchen', name: 'Kitchen & Culinary' },
      { id: 'floor', name: 'Floor & Service' },
      { id: 'bar', name: 'Beverage & Bar' },
      { id: 'management', name: 'Operations & Management' },
      { id: 'cashier', name: 'Billing & Front Desk' },
    ];
  }
}

export async function saveEmployee(emp: Partial<EmployeeRecord>): Promise<boolean> {
  try {
    const payload: any = {
      full_name: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      branch_id: emp.branchId,
      branch_name: emp.branchName,
      department_id: emp.departmentId,
      department_name: emp.departmentName,
      status: emp.status || 'active',
      updated_at: new Date().toISOString(),
    };
    if (emp.id) payload.id = emp.id;
    else payload.created_at = new Date().toISOString();

    const { error } = await supabase.from('user_profiles').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function updateEmployeeStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<boolean> {
  try {
    const { error } = await supabase.from('user_profiles').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function resetEmployeePassword(id: string, email: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchLoginHistory(employeeId?: string, limit = 50): Promise<LoginHistoryRecord[]> {
  try {
    let q = supabase.from('login_history').select('*').order('created_at', { ascending: false }).limit(limit);
    if (employeeId && employeeId !== 'all') q = q.eq('user_id', employeeId);
    const { data } = await q;
    return (data || []).map((r: any) => ({
      id: r.id,
      employeeId: r.user_id || '',
      employeeName: r.user_name || r.email || 'Employee',
      loginTime: r.created_at || r.login_time || '',
      ipAddress: r.ip_address || '—',
      status: r.success === false ? 'failed' : 'success',
      device: r.device || r.user_agent || 'Web Browser',
    }));
  } catch {
    return [];
  }
}

export async function fetchActivityLogs(employeeId?: string, limit = 100): Promise<ActivityLogRecord[]> {
  try {
    let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (employeeId && employeeId !== 'all') q = q.eq('actor_id', employeeId);
    const { data } = await q;
    return (data || []).map((r: any) => ({
      id: r.id,
      employeeId: r.actor_id || '',
      employeeName: r.actor_name || r.actor_email || 'Staff',
      action: r.action || r.event_type || 'Action',
      module: r.module || r.resource_type || 'General',
      timestamp: r.created_at || '',
      details: r.details || r.description || '',
    }));
  } catch {
    return [];
  }
}

export async function fetchModuleAccess(employeeId: string): Promise<ModuleAccessRecord[]> {
  try {
    const { data } = await supabase.from('user_module_access').select('*').eq('user_id', employeeId);
    return (data || []).map((r: any) => ({
      employeeId: r.user_id,
      module: r.module,
      hasAccess: r.has_access !== false,
    }));
  } catch {
    return [];
  }
}

export async function saveModuleAccess(employeeId: string, module: string, hasAccess: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from('user_module_access').upsert({
      user_id: employeeId,
      module,
      has_access: hasAccess,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}
