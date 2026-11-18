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

// ─── Local Storage Keys ──────────────────────────────────────────────────────────
const STORAGE_EMPLOYEES_KEY = 'crm_restaurant_employees';
const STORAGE_DEPARTMENTS_KEY = 'crm_restaurant_departments';
const STORAGE_LOGIN_HISTORY_KEY = 'crm_restaurant_login_history';
const STORAGE_ACTIVITY_LOGS_KEY = 'crm_restaurant_activity_logs';
const STORAGE_MODULE_ACCESS_KEY = 'crm_restaurant_module_access';

// ─── Default Initial Seed Data ─────────────────────────────────────────────────
const DEFAULT_DEPARTMENTS: DepartmentRecord[] = [
  { id: 'kitchen', name: 'Kitchen & Culinary', description: 'Chefs, line cooks, and kitchen prep crew' },
  { id: 'floor', name: 'Floor & Service', description: 'Table servers, floor captains, and guest hosts' },
  { id: 'bar', name: 'Beverage & Bar', description: 'Mixologists, baristas, and cellar staff' },
  { id: 'management', name: 'Operations & Management', description: 'General managers and shift supervisors' },
  { id: 'cashier', name: 'Billing & Front Desk', description: 'POS cashiers and reception desk' },
  { id: 'logistics', name: 'Dispatch & Delivery', description: 'Delivery packaging, riders, and dispatch' },
];

const DEFAULT_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'emp-001',
    fullName: 'Marco Rossi',
    email: 'marco.rossi@cafescorner.com',
    phone: '+91 98200 11223',
    role: 'Head Chef',
    branchId: 'br-downtown',
    branchName: 'Downtown Flagship #01',
    departmentId: 'kitchen',
    departmentName: 'Kitchen & Culinary',
    status: 'active',
    joinedAt: '2024-01-15T09:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'emp-002',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@cafescorner.com',
    phone: '+91 98200 44556',
    role: 'Floor Manager',
    branchId: 'br-downtown',
    branchName: 'Downtown Flagship #01',
    departmentId: 'floor',
    departmentName: 'Floor & Service',
    status: 'active',
    joinedAt: '2024-02-01T10:30:00.000Z',
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'emp-003',
    fullName: 'Dev Patel',
    email: 'dev.patel@cafescorner.com',
    phone: '+91 98200 77889',
    role: 'Senior Barista',
    branchId: 'br-downtown',
    branchName: 'Downtown Flagship #01',
    departmentId: 'bar',
    departmentName: 'Beverage & Bar',
    status: 'active',
    joinedAt: '2024-03-10T11:00:00.000Z',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'emp-004',
    fullName: 'Ananya Gupta',
    email: 'ananya.gupta@cafescorner.com',
    phone: '+91 98200 99001',
    role: 'Cashier',
    branchId: 'br-downtown',
    branchName: 'Downtown Flagship #01',
    departmentId: 'cashier',
    departmentName: 'Billing & Front Desk',
    status: 'active',
    joinedAt: '2024-04-05T08:30:00.000Z',
    lastLogin: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'emp-005',
    fullName: 'Rohan Mehra',
    email: 'rohan.mehra@cafescorner.com',
    phone: '+91 98200 33445',
    role: 'Server',
    branchId: 'br-downtown',
    branchName: 'Downtown Flagship #01',
    departmentId: 'floor',
    departmentName: 'Floor & Service',
    status: 'active',
    joinedAt: '2024-05-12T12:00:00.000Z',
    lastLogin: new Date(Date.now() - 28800000).toISOString(),
  },
];

const DEFAULT_LOGIN_HISTORY: LoginHistoryRecord[] = [
  {
    id: 'log-1',
    employeeId: 'emp-001',
    employeeName: 'Marco Rossi',
    loginTime: new Date(Date.now() - 1800000).toISOString(),
    ipAddress: '192.168.1.45',
    status: 'success',
    device: 'Kitchen POS iPad Pro',
  },
  {
    id: 'log-2',
    employeeId: 'emp-002',
    employeeName: 'Priya Sharma',
    loginTime: new Date(Date.now() - 3600000).toISOString(),
    ipAddress: '192.168.1.12',
    status: 'success',
    device: 'Terminal #1 (Floor)',
  },
  {
    id: 'log-3',
    employeeId: 'emp-004',
    employeeName: 'Ananya Gupta',
    loginTime: new Date(Date.now() - 7200000).toISOString(),
    ipAddress: '192.168.1.10',
    status: 'success',
    device: 'Cashier Counter Terminal',
  },
  {
    id: 'log-4',
    employeeId: 'emp-005',
    employeeName: 'Rohan Mehra',
    loginTime: new Date(Date.now() - 14400000).toISOString(),
    ipAddress: '192.168.1.15',
    status: 'failed',
    device: 'Staff Handheld Device',
  },
];

const DEFAULT_ACTIVITY_LOGS: ActivityLogRecord[] = [
  {
    id: 'act-1',
    employeeId: 'emp-002',
    employeeName: 'Priya Sharma',
    action: 'Table Reservation Confirmed',
    module: 'Floor & Service',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    details: 'Table T-04 reserved for party of 4 at 8:00 PM',
  },
  {
    id: 'act-2',
    employeeId: 'emp-001',
    employeeName: 'Marco Rossi',
    action: 'Special Item 86ed',
    module: 'Kitchen & Culinary',
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    details: 'Marked Truffle Risotto as out of stock for dinner service',
  },
  {
    id: 'act-3',
    employeeId: 'emp-004',
    employeeName: 'Ananya Gupta',
    action: 'POS Shift Opened',
    module: 'Billing & Front Desk',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    details: 'Counter register opened with $300 opening float',
  },
];

// ─── Storage Helpers ───────────────────────────────────────────────────────────
function loadEmployeesFromStorage(): EmployeeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_EMPLOYEES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse employees from storage:', err);
  }
  return DEFAULT_EMPLOYEES;
}

function saveEmployeesToStorage(employees: EmployeeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_EMPLOYEES_KEY, JSON.stringify(employees));
  } catch (err) {
    console.warn('Failed to save employees to storage:', err);
  }
}

export function logEmployeeActivity(activity: Omit<ActivityLogRecord, 'id' | 'timestamp'>): void {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITY_LOGS_KEY);
    const logs: ActivityLogRecord[] = raw ? JSON.parse(raw) : [...DEFAULT_ACTIVITY_LOGS];
    const newEntry: ActivityLogRecord = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...activity,
    };
    logs.unshift(newEntry);
    localStorage.setItem(STORAGE_ACTIVITY_LOGS_KEY, JSON.stringify(logs.slice(0, 200)));
  } catch (err) {
    console.warn('Failed to log employee activity:', err);
  }
}

async function syncEmployeeToSupabase(record: EmployeeRecord): Promise<void> {
  try {
    await supabase.from('user_profiles').upsert({
      id: record.id,
      full_name: record.fullName,
      email: record.email,
      phone: record.phone,
      role: record.role,
      branch_id: record.branchId,
      branch_name: record.branchName,
      department_id: record.departmentId,
      department_name: record.departmentName,
      status: record.status,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking fallback
  }
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export async function fetchEmployees(orgId?: string, branchId?: string): Promise<EmployeeRecord[]> {
  let list = loadEmployeesFromStorage();

  // Try fetching live records from Supabase user_profiles if reachable
  try {
    let q = supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(100);
    if (orgId) q = q.eq('organization_id', orgId);
    if (branchId && branchId !== 'all') q = q.eq('branch_id', branchId);
    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      const remoteList: EmployeeRecord[] = data.map((r: any) => ({
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
      // Merge unique remote entries into local storage
      for (const rem of remoteList) {
        if (!list.some((l) => l.id === rem.id)) {
          list.push(rem);
        }
      }
      saveEmployeesToStorage(list);
    }
  } catch (err) {
    console.warn('Supabase employee fetch fallback to storage:', err);
  }

  if (branchId && branchId !== 'all') {
    list = list.filter((e) => e.branchId === branchId || e.branchName.toLowerCase().includes(branchId.toLowerCase()));
  }

  return list;
}

export async function fetchDepartments(orgId?: string): Promise<DepartmentRecord[]> {
  try {
    let q = supabase.from('departments').select('*').order('name');
    if (orgId) q = q.eq('organization_id', orgId);
    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      return data.map((r: any) => ({ id: r.id, name: r.name, description: r.description }));
    }
  } catch {
    // Fallback to defaults
  }
  return DEFAULT_DEPARTMENTS;
}

export async function saveEmployee(emp: Partial<EmployeeRecord>): Promise<boolean> {
  try {
    if (!emp.fullName?.trim() || !emp.email?.trim()) {
      return false;
    }

    const employees = loadEmployeesFromStorage();
    const isNew = !emp.id;
    const empId = emp.id || `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Resolve department and branch names
    const departments = DEFAULT_DEPARTMENTS;
    const dept = departments.find((d) => d.id === emp.departmentId);
    const departmentName = emp.departmentName || dept?.name || 'General';

    const record: EmployeeRecord = {
      id: empId,
      fullName: emp.fullName.trim(),
      email: emp.email.trim().toLowerCase(),
      phone: emp.phone?.trim() || '',
      role: emp.role || 'Service Staff',
      branchId: emp.branchId || 'br-downtown',
      branchName: emp.branchName || 'Downtown Flagship #01',
      departmentId: emp.departmentId || 'floor',
      departmentName,
      status: emp.status || 'active',
      avatar: emp.avatar,
      joinedAt: emp.joinedAt || new Date().toISOString(),
      lastLogin: emp.lastLogin || undefined,
    };

    const existingIdx = employees.findIndex((e) => e.id === empId || e.email.toLowerCase() === record.email);
    if (existingIdx >= 0) {
      employees[existingIdx] = { ...employees[existingIdx], ...record };
    } else {
      employees.unshift(record);
    }

    saveEmployeesToStorage(employees);

    // Record activity log
    logEmployeeActivity({
      employeeId: record.id,
      employeeName: record.fullName,
      action: isNew ? 'Employee Account Created' : 'Employee Profile Updated',
      module: record.departmentName || 'Staff Directory',
      details: `${record.fullName} (${record.role}) profile saved at branch ${record.branchName}.`,
    });

    // Background sync to Supabase (safe & non-blocking)
    syncEmployeeToSupabase(record).catch(() => {});

    return true;
  } catch (err) {
    console.error('Error saving employee:', err);
    return false;
  }
}

export async function updateEmployeeStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<boolean> {
  try {
    const employees = loadEmployeesFromStorage();
    const idx = employees.findIndex((e) => e.id === id);
    if (idx >= 0) {
      employees[idx].status = status;
      saveEmployeesToStorage(employees);

      logEmployeeActivity({
        employeeId: id,
        employeeName: employees[idx].fullName,
        action: `Status: ${status.toUpperCase()}`,
        module: 'Account Governance',
        details: `Account status updated to ${status}`,
      });

      // Background sync
      Promise.resolve(
        supabase.from('user_profiles').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
      ).catch(() => {});
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function resetEmployeePassword(id: string, email: string): Promise<boolean> {
  try {
    const employees = loadEmployeesFromStorage();
    const emp = employees.find((e) => e.id === id || e.email.toLowerCase() === email.toLowerCase());

    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
    } catch {
      // offline/mock safe fallback
    }

    if (emp) {
      logEmployeeActivity({
        employeeId: emp.id,
        employeeName: emp.fullName,
        action: 'Password Reset Initiated',
        module: 'Security & Auth',
        details: `Password recovery dispatched to ${email}`,
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchLoginHistory(employeeId?: string, limit = 50): Promise<LoginHistoryRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_LOGIN_HISTORY_KEY);
    let history: LoginHistoryRecord[] = raw ? JSON.parse(raw) : DEFAULT_LOGIN_HISTORY;
    if (employeeId && employeeId !== 'all') {
      history = history.filter((h) => h.employeeId === employeeId);
    }
    return history.slice(0, limit);
  } catch {
    return DEFAULT_LOGIN_HISTORY.slice(0, limit);
  }
}

export async function fetchActivityLogs(employeeId?: string, limit = 100): Promise<ActivityLogRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITY_LOGS_KEY);
    let logs: ActivityLogRecord[] = raw ? JSON.parse(raw) : DEFAULT_ACTIVITY_LOGS;
    if (employeeId && employeeId !== 'all') {
      logs = logs.filter((l) => l.employeeId === employeeId);
    }
    return logs.slice(0, limit);
  } catch {
    return DEFAULT_ACTIVITY_LOGS.slice(0, limit);
  }
}

export async function fetchModuleAccess(employeeId: string): Promise<ModuleAccessRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_MODULE_ACCESS_KEY);
    const accessMap: Record<string, Record<string, boolean>> = raw ? JSON.parse(raw) : {};
    const empAccess = accessMap[employeeId] || {};

    const modules = [
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
    ];

    return modules.map((m) => ({
      employeeId,
      module: m,
      hasAccess: empAccess[m] !== false,
    }));
  } catch {
    return [];
  }
}

export async function saveModuleAccess(employeeId: string, module: string, hasAccess: boolean): Promise<boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_MODULE_ACCESS_KEY);
    const accessMap: Record<string, Record<string, boolean>> = raw ? JSON.parse(raw) : {};
    if (!accessMap[employeeId]) accessMap[employeeId] = {};
    accessMap[employeeId][module] = hasAccess;
    localStorage.setItem(STORAGE_MODULE_ACCESS_KEY, JSON.stringify(accessMap));

    // Background sync
    Promise.resolve(
      supabase.from('user_module_access').upsert({
        user_id: employeeId,
        module,
        has_access: hasAccess,
        updated_at: new Date().toISOString(),
      })
    ).catch(() => {});

    return true;
  } catch {
    return false;
  }
}
