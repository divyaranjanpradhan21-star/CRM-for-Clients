import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  Mail,
  Phone,
  Building,
  Lock,
  Unlock,
  Shield,
  Clock,
  Activity,
  ChevronRight,
  RefreshCw,
  UserCheck,
  UserX,
  AlertCircle,
  Key,
  LogIn,
  Layers,
  ToggleLeft,
  ToggleRight,
  ShieldAlert
} from 'lucide-react';
import {
  EmployeeRecord,
  LoginHistoryRecord,
  ActivityLogRecord,
  fetchEmployees,
  fetchDepartments,
  saveEmployee,
  updateEmployeeStatus,
  resetEmployeePassword,
  fetchLoginHistory,
  fetchActivityLogs,
  fetchModuleAccess,
  saveModuleAccess,
} from '../../lib/employeeManagementApi';
import { fetchAllBranches, BranchRecord } from '../../lib/branchManagementApi';

const ALL_MODULES_LIST = [
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
];

const ROLE_OPTIONS = [
  'Branch Manager',
  'Cashier & Front Desk',
  'Service Staff / Waiter',
  'Kitchen & Chef Lead',
  'Hostess / Reception',
  'Supervisor',
  'Barista',
  'Inventory Specialist',
];

interface Props {
  orgId?: string;
  currentUserRole?: string;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    inactive: 'bg-red-100 text-red-800 border-red-300',
    suspended: 'bg-amber-100 text-amber-800 border-amber-300',
  }[status] || 'bg-gray-100 text-gray-700 border-gray-300';

  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cfg}`}>
      {status}
    </span>
  );
};

const EmptyState: React.FC<{ message: string; sub?: string }> = ({ message, sub }) => (
  <div className="py-16 text-center">
    <div className="w-12 h-12 rounded-full bg-[#EAE4D9] flex items-center justify-center mx-auto mb-3 text-[#7A7268]">
      <Users className="w-5 h-5" />
    </div>
    <div className="text-sm font-semibold text-[#1F313D]">{message}</div>
    {sub && <div className="text-xs text-[#7A7268] mt-1 max-w-sm mx-auto">{sub}</div>}
  </div>
);

export const EmployeeManagementView: React.FC<Props> = ({ orgId, currentUserRole }) => {
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'accounts' | 'login_history' | 'activity' | 'access'>('employees');
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [empFilter, setEmpFilter] = useState('all');

  // Module access state
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [selectedEmpForAccess, setSelectedEmpForAccess] = useState<string>('');
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  // Modals & form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Partial<EmployeeRecord> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [emps, brs, depts] = await Promise.all([
        fetchEmployees(orgId),
        fetchAllBranches(),
        fetchDepartments(orgId),
      ]);
      setEmployees(emps);
      setBranches(brs);
      setDepartments(depts);
      if (emps.length > 0 && !selectedEmpForAccess) {
        setSelectedEmpForAccess(emps[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadLoginHistory = async () => {
    setIsLoading(true);
    try {
      const logs = await fetchLoginHistory(empFilter !== 'all' ? empFilter : undefined);
      setLoginHistory(logs);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivity = async () => {
    setIsLoading(true);
    try {
      const logs = await fetchActivityLogs(empFilter !== 'all' ? empFilter : undefined);
      setActivityLogs(logs);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModuleAccessData = async (empId: string) => {
    const acc = await fetchModuleAccess(empId);
    const map: Record<string, boolean> = {};
    ALL_MODULES_LIST.forEach((m) => {
      map[m] = true;
    });
    acc.forEach((a) => {
      map[a.module] = a.hasAccess;
    });
    setModuleAccess(map);
  };

  useEffect(() => {
    if (activeSubTab === 'employees' || activeSubTab === 'accounts' || activeSubTab === 'access') {
      loadData();
    } else if (activeSubTab === 'login_history') {
      loadLoginHistory();
    } else if (activeSubTab === 'activity') {
      loadActivity();
    }
  }, [activeSubTab, empFilter]);

  useEffect(() => {
    if (selectedEmpForAccess) {
      loadModuleAccessData(selectedEmpForAccess);
    }
  }, [selectedEmpForAccess]);

  const handleSaveEmployee = async () => {
    if (!editingEmp?.fullName?.trim() || !editingEmp?.email?.trim()) {
      showToast('Full name and email are mandatory', 'error');
      return;
    }
    setIsSaving(true);
    const ok = await saveEmployee(editingEmp);
    setIsSaving(false);
    if (ok) {
      showToast(editingEmp.id ? 'Employee profile updated successfully' : 'New employee account created');
      setIsEditModalOpen(false);
      setEditingEmp(null);
      loadData();
    } else {
      showToast('Failed to save employee to database', 'error');
    }
  };

  const handleStatusChange = async (id: string, status: 'active' | 'inactive' | 'suspended') => {
    const ok = await updateEmployeeStatus(id, status);
    if (ok) {
      showToast(`Account marked as ${status.toUpperCase()}`);
      loadData();
    } else {
      showToast('Status update failed', 'error');
    }
  };

  const handleResetPassword = async (emp: EmployeeRecord) => {
    setResettingId(emp.id);
    const ok = await resetEmployeePassword(emp.id, emp.email);
    setResettingId(null);
    if (ok) {
      showToast(`Secure password recovery dispatched to ${emp.email}`);
    } else {
      showToast('Could not send password reset email', 'error');
    }
  };

  const handleToggleAccess = async (module: string, nextVal: boolean) => {
    if (!selectedEmpForAccess) return;
    const newMap = { ...moduleAccess, [module]: nextVal };
    setModuleAccess(newMap);
    setIsSavingAccess(true);
    const ok = await saveModuleAccess(selectedEmpForAccess, module, nextVal);
    setIsSavingAccess(false);
    if (!ok) {
      showToast('Failed to update access permissions in database', 'error');
    }
  };

  const filteredEmployees = employees.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (branchFilter !== 'all' && e.branchId !== branchFilter && e.branchName !== branchFilter) return false;
    if (departmentFilter !== 'all' && e.departmentId !== departmentFilter && e.departmentName !== departmentFilter) return false;
    if (
      searchQuery &&
      !e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !e.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !e.role.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const AVATAR_COLORS = ['#79415A', '#82401D', '#1F313D', '#383854', '#3A5726', '#2C441D', '#4F7037', '#BA4F57'];

  const subTabs = [
    { id: 'employees', label: 'Employee Directory' },
    { id: 'accounts', label: 'Account Security' },
    { id: 'access', label: 'Unauthorized Module Restrictions' },
    { id: 'login_history', label: 'Login History' },
    { id: 'activity', label: 'Activity Logs' },
  ];

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3 border-b border-[#DDD5C7]/70">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#1F313D] leading-tight">
            Employee &amp; Staff Management
          </h2>
          <p className="text-xs text-[#7A7268] mt-0.5">
            Create employee accounts, manage branches and departments, control module access, and audit activity
          </p>
        </div>
        {activeSubTab === 'employees' && (
          <button
            onClick={() => {
              setEditingEmp({
                status: 'active',
                branchId: branches[0]?.id || '',
                branchName: branches[0]?.name || '',
                departmentId: departments[0]?.id || '',
                departmentName: departments[0]?.name || '',
                role: ROLE_OPTIONS[0],
              });
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#79415A] hover:bg-[#68334b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Create Employee Account
          </button>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center bg-[#E4DCCE] p-1 rounded-2xl border border-[#DDD5C7] w-full overflow-x-auto gap-1">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id as any)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === t.id ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D] hover:bg-[#EAE4D9]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 1. EMPLOYEE DIRECTORY SUB-TAB ── */}
      {activeSubTab === 'employees' && (
        <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5">
          {/* Multi-Filters Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee by name, email, role..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D] focus:outline-none"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D] focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#7A7268]">Loading employee directory...</div>
          ) : filteredEmployees.length === 0 ? (
            <EmptyState
              message="No employees in database yet"
              sub="Click 'Create Employee Account' above to register your first staff profile."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E5DDD2]">
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Employee</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Role</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Branch</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Department</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Status</th>
                    <th className="text-right pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9DF]">
                  {filteredEmployees.map((emp, idx) => (
                    <tr key={emp.id} className="hover:bg-[#EFE9DF]/50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                          >
                            {emp.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-[#1F313D]">{emp.fullName}</div>
                            <div className="text-[11px] text-[#7A7268]">{emp.email} {emp.phone && `· ${emp.phone}`}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-[#1F313D]">{emp.role || '—'}</td>
                      <td className="py-3 text-[#5C5549]">{emp.branchName || 'Unassigned'}</td>
                      <td className="py-3 text-[#5C5549]">{emp.departmentName || 'General'}</td>
                      <td className="py-3">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingEmp(emp);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit Profile"
                            className="p-1.5 rounded-lg bg-[#EAE4D9] hover:bg-[#DDD5C7] text-[#1F313D] transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {emp.status !== 'active' && (
                            <button
                              onClick={() => handleStatusChange(emp.id, 'active')}
                              title="Activate Account"
                              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {emp.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(emp.id, 'suspended')}
                              title="Suspend Account"
                              className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {emp.status !== 'inactive' && (
                            <button
                              onClick={() => handleStatusChange(emp.id, 'inactive')}
                              title="Deactivate Account"
                              className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 transition"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 2. ACCOUNT SECURITY & PASSWORD RESET SUB-TAB ── */}
      {activeSubTab === 'accounts' && (
        <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5">
          <div className="mb-4">
            <h3 className="font-serif text-lg font-bold text-[#1F313D]">Account Security &amp; Password Reset</h3>
            <p className="text-xs text-[#7A7268] mt-0.5">
              Securely dispatch authentication tokens and reset employee passwords
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#7A7268]">Loading accounts...</div>
          ) : employees.length === 0 ? (
            <EmptyState
              message="No employee accounts found"
              sub="Accounts will appear here once employees are registered in the database."
            />
          ) : (
            <div className="space-y-3">
              {employees.map((emp, idx) => (
                <div
                  key={emp.id}
                  className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-[18px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                    >
                      {emp.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1F313D]">{emp.fullName} ({emp.role})</div>
                      <div className="text-[11px] text-[#7A7268]">{emp.email} · Branch: {emp.branchName || 'All'}</div>
                      <div className="text-[10px] text-[#7A7268] mt-0.5">
                        Last Active: {emp.lastLogin ? new Date(emp.lastLogin).toLocaleString() : 'Never logged in'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <StatusBadge status={emp.status} />
                    <button
                      onClick={() => handleResetPassword(emp)}
                      disabled={resettingId === emp.id}
                      className="flex items-center gap-1.5 bg-[#79415A] hover:bg-[#68334b] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                    >
                      <Key className="w-3.5 h-3.5" />
                      {resettingId === emp.id ? 'Sending...' : 'Reset Password'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 3. UNAUTHORIZED MODULE ACCESS RESTRICTION SUB-TAB ── */}
      {activeSubTab === 'access' && (
        <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5">
          <div className="mb-4">
            <h3 className="font-serif text-lg font-bold text-[#1F313D]">
              Prevent Unauthorized Module Access
            </h3>
            <p className="text-xs text-[#7A7268] mt-0.5">
              Enforce least privilege access: block employees from accessing unauthorized dashboard portals and financial data
            </p>
          </div>

          <div className="mb-5 bg-[#EFE9DF] border border-[#DDD5C7] rounded-[18px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1F313D] mb-1">Target Employee Profile</label>
              <select
                value={selectedEmpForAccess}
                onChange={(e) => setSelectedEmpForAccess(e.target.value)}
                className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D] focus:outline-none min-w-[280px]"
              >
                <option value="">— Select an employee —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName} ({e.role})</option>
                ))}
              </select>
            </div>

            {isSavingAccess && (
              <span className="text-xs text-[#79415A] font-bold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving policy...
              </span>
            )}
          </div>

          {!selectedEmpForAccess ? (
            <EmptyState
              message="Select an employee profile above"
              sub="Module access permissions will be displayed and customizable per individual user."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_MODULES_LIST.map((mod) => {
                const isAllowed = moduleAccess[mod] !== false;
                const isSensitive = mod === 'Financial' || mod === 'Settings';

                return (
                  <div
                    key={mod}
                    className={`border rounded-[18px] p-4 flex items-center justify-between transition-all ${
                      isAllowed
                        ? 'bg-[#EFE9DF] border-[#DDD5C7]'
                        : 'bg-[#FAF0E6] border-[#E8C2B3]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#1F313D] flex items-center gap-1.5">
                        <span>{mod}</span>
                        {isSensitive && (
                          <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded font-mono">
                            RESTRICTED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#7A7268] mt-0.5">
                        {isAllowed ? 'Access authorized' : 'Access blocked'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleAccess(mod, !isAllowed)}
                      className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full transition shadow-2xs ${
                        isAllowed
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                          : 'bg-rose-700 hover:bg-rose-800 text-white'
                      }`}
                    >
                      {isAllowed ? (
                        <>
                          <ToggleRight className="w-4 h-4" /> Allowed
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" /> Blocked
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. LOGIN HISTORY SUB-TAB ── */}
      {activeSubTab === 'login_history' && (
        <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">Employee Login History</h3>
              <p className="text-xs text-[#7A7268]">Audit authentication attempts and IP telemetry</p>
            </div>
            <select
              value={empFilter}
              onChange={(e) => setEmpFilter(e.target.value)}
              className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D] focus:outline-none"
            >
              <option value="all">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#7A7268]">Loading login records...</div>
          ) : loginHistory.length === 0 ? (
            <EmptyState
              message="No login history in database yet"
              sub="Authentication telemetry will appear here as employees log in."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E5DDD2]">
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Employee</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Login Timestamp</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">IP Address</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Browser / Device</th>
                    <th className="text-right pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9DF]">
                  {loginHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-[#EFE9DF]/50">
                      <td className="py-2.5 font-semibold text-[#1F313D]">{log.employeeName}</td>
                      <td className="py-2.5 text-[#5C5549]">
                        {log.loginTime ? new Date(log.loginTime).toLocaleString() : '—'}
                      </td>
                      <td className="py-2.5 font-mono text-[#5C5549]">{log.ipAddress}</td>
                      <td className="py-2.5 text-[#5C5549]">{log.device}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            log.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 5. ACTIVITY LOG SUB-TAB ── */}
      {activeSubTab === 'activity' && (
        <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">Employee Activity Audit Log</h3>
              <p className="text-xs text-[#7A7268]">Track mutations, orders processed, table checks and policy edits</p>
            </div>
            <select
              value={empFilter}
              onChange={(e) => setEmpFilter(e.target.value)}
              className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D] focus:outline-none"
            >
              <option value="all">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#7A7268]">Loading activity records...</div>
          ) : activityLogs.length === 0 ? (
            <EmptyState
              message="No activity logs in database yet"
              sub="Administrative and floor operations executed by staff will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E5DDD2]">
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Employee</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Action</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Module</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Timestamp</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9DF]">
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#EFE9DF]/50">
                      <td className="py-2.5 font-semibold text-[#1F313D]">{log.employeeName}</td>
                      <td className="py-2.5">
                        <span className="bg-[#EAE4D9] text-[#1F313D] px-2 py-0.5 rounded-lg font-mono font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#79415A] font-semibold">{log.module}</td>
                      <td className="py-2.5 text-[#5C5549]">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>
                      <td className="py-2.5 text-[#5C5549] max-w-[280px] truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT EMPLOYEE MODAL ── */}
      {isEditModalOpen && editingEmp !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E5DDD2] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                  {editingEmp.id ? 'Edit Employee Profile' : 'Create New Employee Account'}
                </h3>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Configure branch, department and role assignments
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingEmp(null);
                }}
                className="p-2 rounded-full hover:bg-[#EAE4D9] text-[#5C5549] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={editingEmp.fullName || ''}
                  placeholder="e.g. Elena Rostova"
                  onChange={(e) => setEditingEmp({ ...editingEmp, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={editingEmp.email || ''}
                  placeholder="elena@cafescorner.com"
                  onChange={(e) => setEditingEmp({ ...editingEmp, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={editingEmp.phone || ''}
                  placeholder="+1 (555) 234-5678"
                  onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Role Assignment</label>
                <select
                  value={editingEmp.role || ''}
                  onChange={(e) => setEditingEmp({ ...editingEmp, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Branch Assignment</label>
                <select
                  value={editingEmp.branchId || ''}
                  onChange={(e) => {
                    const b = branches.find((br) => br.id === e.target.value);
                    setEditingEmp({
                      ...editingEmp,
                      branchId: e.target.value,
                      branchName: b?.name || '',
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                >
                  <option value="">Unassigned</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Department Assignment</label>
                <select
                  value={editingEmp.departmentId || ''}
                  onChange={(e) => {
                    const d = departments.find((dept) => dept.id === e.target.value);
                    setEditingEmp({
                      ...editingEmp,
                      departmentId: e.target.value,
                      departmentName: d?.name || '',
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                >
                  <option value="">General</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Account Status</label>
                <select
                  value={editingEmp.status || 'active'}
                  onChange={(e) => setEditingEmp({ ...editingEmp, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingEmp(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549] hover:bg-[#EAE4D9] transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEmployee}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingEmp.id ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
