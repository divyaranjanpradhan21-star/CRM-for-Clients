import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Save,
  RefreshCw,
  Lock,
  Eye,
  FileSpreadsheet,
  CheckSquare,
  History
} from 'lucide-react';
import {
  RoleRecord,
  ModulePermissionRecord,
  UserPermissionRecord,
  PermissionHistoryRecord,
  ALL_MODULES,
  ALL_ACTIONS,
  ModuleName,
  ActionName,
  fetchRoles,
  saveRole,
  deleteRole,
  fetchModulePermissions,
  saveModulePermissions,
  fetchUserPermissions,
  saveUserPermissions,
  fetchPermissionHistory,
  logPermissionChange
} from '../../lib/rolePermissionsApi';
import { fetchEmployees, EmployeeRecord } from '../../lib/employeeManagementApi';

interface Props {
  orgId?: string;
}

const EmptyState: React.FC<{ message: string; sub?: string }> = ({ message, sub }) => (
  <div className="py-16 text-center">
    <div className="w-12 h-12 rounded-full bg-[#EAE4D9] flex items-center justify-center mx-auto mb-3 text-[#7A7268]">
      <Shield className="w-5 h-5" />
    </div>
    <div className="text-sm font-semibold text-[#1F313D]">{message}</div>
    {sub && <div className="text-xs text-[#7A7268] mt-1 max-w-sm mx-auto">{sub}</div>}
  </div>
);

const ACTION_LABELS: Record<ActionName, string> = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export / Report',
};

const ACTION_COLORS: Record<ActionName, string> = {
  create: 'text-emerald-700',
  read: 'text-blue-700',
  update: 'text-amber-700',
  delete: 'text-rose-700',
  approve: 'text-purple-700',
  export: 'text-teal-700',
};

const ROLE_COLORS = [
  '#79415A',
  '#82401D',
  '#1F313D',
  '#383854',
  '#3A5726',
  '#4F7037',
  '#2C441D',
  '#BA4F57',
];

export const RolePermissionsView: React.FC<Props> = ({ orgId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'roles' | 'module_perms' | 'user_perms' | 'history'>('roles');
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [modulePerms, setModulePerms] = useState<Record<ModuleName, Record<ActionName, boolean>>>({} as any);
  const [userPerms, setUserPerms] = useState<Record<ModuleName, Record<ActionName, boolean | null>>>({} as any);
  const [permHistory, setPermHistory] = useState<PermissionHistoryRecord[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<RoleRecord> | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const initPermMatrix = (): Record<ModuleName, Record<ActionName, boolean>> => {
    const m = {} as Record<ModuleName, Record<ActionName, boolean>>;
    ALL_MODULES.forEach((mod) => {
      // By default restrict sensitive financial & settings write access
      const isRestricted = mod === 'Financial' || mod === 'Settings';
      m[mod] = {
        create: !isRestricted,
        read: true,
        update: !isRestricted,
        delete: false,
        approve: false,
        export: !isRestricted,
      };
    });
    return m;
  };

  const initUserPermMatrix = (): Record<ModuleName, Record<ActionName, boolean | null>> => {
    const m = {} as Record<ModuleName, Record<ActionName, boolean | null>>;
    ALL_MODULES.forEach((mod) => {
      m[mod] = {
        create: null,
        read: null,
        update: null,
        delete: null,
        approve: null,
        export: null,
      };
    });
    return m;
  };

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const r = await fetchRoles(orgId);
      setRoles(r);
      if (r.length > 0 && !selectedRoleId) {
        setSelectedRoleId(r[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    const emps = await fetchEmployees(orgId);
    setEmployees(emps);
    if (emps.length > 0 && !selectedUserId) {
      setSelectedUserId(emps[0].id);
    }
  };

  const loadModulePerms = async (roleId: string) => {
    setIsLoading(true);
    try {
      const perms = await fetchModulePermissions(roleId);
      const matrix = initPermMatrix();
      perms.forEach((p) => {
        matrix[p.module] = {
          create: p.create,
          read: p.read,
          update: p.update,
          delete: p.delete,
          approve: p.approve,
          export: p.export,
        };
      });
      setModulePerms(matrix);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPerms = async (userId: string) => {
    setIsLoading(true);
    try {
      const perms = await fetchUserPermissions(userId);
      const matrix = initUserPermMatrix();
      perms.forEach((p) => {
        matrix[p.module] = {
          create: p.create ?? null,
          read: p.read ?? null,
          update: p.update ?? null,
          delete: p.delete ?? null,
          approve: p.approve ?? null,
          export: p.export ?? null,
        };
      });
      setUserPerms(matrix);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const h = await fetchPermissionHistory();
      setPermHistory(h);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'roles') {
      loadRoles();
    } else if (activeSubTab === 'module_perms') {
      loadRoles();
      loadEmployees();
      if (selectedRoleId) loadModulePerms(selectedRoleId);
    } else if (activeSubTab === 'user_perms') {
      loadEmployees();
      loadRoles();
      if (selectedUserId) loadUserPerms(selectedUserId);
    } else if (activeSubTab === 'history') {
      loadHistory();
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (selectedRoleId) {
      loadModulePerms(selectedRoleId);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    if (selectedUserId) {
      loadUserPerms(selectedUserId);
    }
  }, [selectedUserId]);

  const handleSaveRole = async () => {
    if (!editingRole?.name?.trim()) {
      showToast('Role title is required', 'error');
      return;
    }
    setIsSaving(true);
    const ok = await saveRole(editingRole, orgId);
    setIsSaving(false);
    if (ok) {
      showToast(editingRole.id ? 'Role updated successfully' : 'Custom employee role created');
      setIsEditModalOpen(false);
      setEditingRole(null);
      loadRoles();
    } else {
      showToast('Failed to save role to database', 'error');
    }
  };

  const handleDeleteRole = async (role: RoleRecord) => {
    if (role.isSystem) {
      showToast('Core system roles cannot be deleted', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete custom role "${role.name}"?`)) return;
    const ok = await deleteRole(role.id);
    if (ok) {
      showToast('Role removed');
      loadRoles();
    } else {
      showToast('Failed to delete role', 'error');
    }
  };

  const handleSaveModulePerms = async () => {
    if (!selectedRoleId) {
      showToast('Select a target role first', 'error');
      return;
    }
    setIsSaving(true);
    const perms: ModulePermissionRecord[] = ALL_MODULES.map((mod) => ({
      roleId: selectedRoleId,
      module: mod,
      ...modulePerms[mod] || {
        create: false,
        read: true,
        update: false,
        delete: false,
        approve: false,
        export: false,
      },
    }));

    const ok = await saveModulePermissions(selectedRoleId, perms);
    setIsSaving(false);

    if (ok) {
      const roleName = roles.find((r) => r.id === selectedRoleId)?.name || 'Role';
      logPermissionChange({
        changedBy: 'Admin',
        targetType: 'role',
        targetName: roleName,
        module: 'All Modules',
        action: 'batch_update',
        oldValue: false,
        newValue: true,
      });
      showToast(`Module permissions saved for ${roleName}`);
    } else {
      showToast('Failed to save module permissions to database', 'error');
    }
  };

  const handleSaveUserPerms = async () => {
    if (!selectedUserId) {
      showToast('Select an employee first', 'error');
      return;
    }
    setIsSaving(true);
    const perms: UserPermissionRecord[] = ALL_MODULES
      .filter((mod) => Object.values(userPerms[mod] || {}).some((v) => v !== null))
      .map((mod) => ({
        userId: selectedUserId,
        module: mod,
        ...userPerms[mod],
      }));

    const ok = await saveUserPermissions(selectedUserId, perms);
    setIsSaving(false);

    if (ok) {
      const empName = employees.find((e) => e.id === selectedUserId)?.fullName || 'Employee';
      logPermissionChange({
        changedBy: 'Admin',
        targetType: 'user',
        targetName: empName,
        module: 'User Overrides',
        action: 'override_update',
        oldValue: false,
        newValue: true,
      });
      showToast(`Individual overrides saved for ${empName}`);
    } else {
      showToast('Failed to save user overrides', 'error');
    }
  };

  const toggleModulePerm = (mod: ModuleName, action: ActionName) => {
    setModulePerms((prev) => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [action]: !prev[mod]?.[action],
      },
    }));
  };

  const toggleUserPerm = (mod: ModuleName, action: ActionName) => {
    const cur = userPerms[mod]?.[action];
    const next = cur === null ? true : cur === true ? false : null;
    setUserPerms((prev) => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [action]: next,
      },
    }));
  };

  const subTabs = [
    { id: 'roles', label: 'Role Catalog' },
    { id: 'module_perms', label: 'Module-Level Permissions' },
    { id: 'user_perms', label: 'Individual User Overrides' },
    { id: 'history', label: 'Permission Change History' },
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
            Roles &amp; Permission Management
          </h2>
          <p className="text-xs text-[#7A7268] mt-0.5">
            Create custom roles, configure CRUD &amp; approval rights, restrict financial data, and maintain audit logs
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeSubTab === 'roles' && (
            <button
              onClick={() => {
                setEditingRole({ color: ROLE_COLORS[0] });
                setIsEditModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#79415A] hover:bg-[#68334b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" /> Create Custom Role
            </button>
          )}

          {(activeSubTab === 'module_perms' || activeSubTab === 'user_perms') && (
            <button
              onClick={activeSubTab === 'module_perms' ? handleSaveModulePerms : handleSaveUserPerms}
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#1F313D] hover:bg-[#383854] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving Changes...' : 'Save Permissions'}
            </button>
          )}
        </div>
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

      {/* ── 1. ROLE CATALOG SUB-TAB ── */}
      {activeSubTab === 'roles' && (
        <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#7A7268]">Loading roles from database...</div>
          ) : roles.length === 0 ? (
            <EmptyState
              message="No roles configured in database yet"
              sub="Click 'Create Custom Role' above to define job responsibilities and authorization levels."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role, idx) => (
                <div key={role.id} className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-[20px] p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                          style={{ backgroundColor: role.color || ROLE_COLORS[idx % ROLE_COLORS.length] }}
                        >
                          {role.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1F313D]">{role.name}</div>
                          {role.isSystem ? (
                            <span className="text-[9px] font-mono text-[#79415A] font-bold uppercase">System Role</span>
                          ) : (
                            <span className="text-[9px] font-mono text-emerald-700 font-bold uppercase">Custom Role</span>
                          )}
                        </div>
                      </div>

                      {!role.isSystem && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingRole(role);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-[#EAE4D9] hover:bg-[#DDD5C7] text-[#1F313D] transition"
                            title="Edit Role"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition"
                            title="Delete Role"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-[#5C5549] mb-3 leading-relaxed">
                      {role.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#DDD5C7]/70">
                    <span className="text-[10px] text-[#7A7268] font-semibold">
                      {role.employeeCount} Assigned Staff
                    </span>
                    <button
                      onClick={() => {
                        setSelectedRoleId(role.id);
                        setActiveSubTab('module_perms');
                      }}
                      className="text-[10px] text-[#79415A] font-bold hover:underline flex items-center gap-0.5"
                    >
                      Configure Matrix <ChevronDown className="w-3 h-3 -rotate-90" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 2. MODULE PERMISSIONS MATRIX SUB-TAB ── */}
      {activeSubTab === 'module_perms' && (
        <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1F313D] mb-1">Select Target Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D] focus:outline-none min-w-[220px]"
              >
                <option value="">— Select a role —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.isSystem ? '(System)' : '(Custom)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#7A7268] bg-[#EAE4D9] px-3 py-1.5 rounded-full border border-[#DDD5C7]">
              <Lock className="w-3.5 h-3.5 text-rose-700" />
              <span>Financial &amp; Settings modules enforce strict admin approval</span>
            </div>
          </div>

          {!selectedRoleId ? (
            <EmptyState
              message="Select a role to configure granular permissions"
              sub="Configure Create, Read, Update, Delete, Approval and Export capabilities per module."
            />
          ) : isLoading ? (
            <div className="py-12 text-center text-xs text-[#7A7268]">Loading module permissions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#E5DDD2]">
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px] pr-4">
                      Module / Domain
                    </th>
                    {ALL_ACTIONS.map((a) => (
                      <th
                        key={a}
                        className={`text-center pb-3 font-bold uppercase tracking-wider text-[10px] ${ACTION_COLORS[a]}`}
                      >
                        {ACTION_LABELS[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9DF]">
                  {ALL_MODULES.map((mod) => {
                    const isSensitive = mod === 'Financial' || mod === 'Settings' || mod === 'Customers';
                    return (
                      <tr key={mod} className="hover:bg-[#EFE9DF]/50">
                        <td className="py-3 pr-4 font-bold text-[#1F313D]">
                          <div className="flex items-center gap-1.5">
                            <span>{mod}</span>
                            {isSensitive && (
                              <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded font-mono">
                                SENSITIVE
                              </span>
                            )}
                          </div>
                        </td>
                        {ALL_ACTIONS.map((action) => (
                          <td key={action} className="py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleModulePerm(mod, action)}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mx-auto transition shadow-2xs ${
                                modulePerms[mod]?.[action]
                                  ? 'bg-[#79415A] border-[#79415A] text-white'
                                  : 'border-[#DDD5C7] bg-white hover:border-[#79415A]'
                              }`}
                            >
                              {modulePerms[mod]?.[action] && <Check className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 3. USER PERMISSION OVERRIDES SUB-TAB ── */}
      {activeSubTab === 'user_perms' && (
        <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5">
          <div className="mb-4">
            <div className="mb-2">
              <label className="block text-xs font-bold text-[#1F313D] mb-1">Select Employee</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D] focus:outline-none min-w-[280px]"
              >
                <option value="">— Select an employee —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.role})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-[#7A7268]">
              Legend: <strong className="font-mono text-gray-500">·</strong> = Inherits from role ·{' '}
              <strong className="text-emerald-700">✓ Granted</strong> = Explicit grant ·{' '}
              <strong className="text-rose-700">✗ Denied</strong> = Explicit restriction
            </p>
          </div>

          {!selectedUserId ? (
            <EmptyState
              message="Select an employee above to configure individual permission overrides"
              sub="User-specific permissions supersede role defaults for fine-grained authority."
            />
          ) : isLoading ? (
            <div className="py-12 text-center text-xs text-[#7A7268]">Loading user overrides...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#E5DDD2]">
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px] pr-4">
                      Module
                    </th>
                    {ALL_ACTIONS.map((a) => (
                      <th
                        key={a}
                        className={`text-center pb-3 font-bold uppercase tracking-wider text-[10px] ${ACTION_COLORS[a]}`}
                      >
                        {ACTION_LABELS[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9DF]">
                  {ALL_MODULES.map((mod) => (
                    <tr key={mod} className="hover:bg-[#EFE9DF]/50">
                      <td className="py-3 pr-4 font-bold text-[#1F313D]">{mod}</td>
                      {ALL_ACTIONS.map((action) => {
                        const val = userPerms[mod]?.[action];
                        return (
                          <td key={action} className="py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleUserPerm(mod, action as ActionName)}
                              title={val === null ? 'Inherits from role' : val ? 'Granted' : 'Denied'}
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mx-auto transition text-xs font-bold ${
                                val === true
                                  ? 'bg-emerald-700 border-emerald-700 text-white'
                                  : val === false
                                  ? 'bg-rose-700 border-rose-700 text-white'
                                  : 'border-[#DDD5C7] bg-[#EAE4D9] text-[#7A7268] hover:border-[#79415A]'
                              }`}
                            >
                              {val === true ? <Check className="w-3.5 h-3.5" /> : val === false ? <X className="w-3.5 h-3.5" /> : '·'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 4. PERMISSION CHANGE HISTORY AUDIT SUB-TAB ── */}
      {activeSubTab === 'history' && (
        <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5">
          <div className="mb-4">
            <h3 className="font-serif text-lg font-bold text-[#1F313D]">Permission Modification Audit Trail</h3>
            <p className="text-xs text-[#7A7268]">
              All security alterations, role updates, and module overrides are recorded immutably
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#7A7268]">Loading audit history...</div>
          ) : permHistory.length === 0 ? (
            <EmptyState
              message="No permission change logs recorded yet"
              sub="Future security policies, role grants, or individual revocations will be tracked here automatically."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E5DDD2]">
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Administrator</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Target</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Module</th>
                    <th className="text-left pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Action</th>
                    <th className="text-center pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Previous</th>
                    <th className="text-center pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Updated</th>
                    <th className="text-right pb-3 font-bold text-[#5C5549] uppercase tracking-wider text-[10px]">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9DF]">
                  {permHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-[#EFE9DF]/50">
                      <td className="py-2.5 font-semibold text-[#1F313D]">{h.changedBy}</td>
                      <td className="py-2.5 text-[#5C5549]">
                        {h.targetName}{' '}
                        <span className="text-[9px] text-[#79415A] font-bold uppercase">({h.targetType})</span>
                      </td>
                      <td className="py-2.5 font-semibold text-[#79415A]">{h.module}</td>
                      <td className="py-2.5">
                        <span className="bg-[#EAE4D9] px-2 py-0.5 rounded-lg font-mono text-[11px] font-semibold">
                          {h.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            h.oldValue ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {h.oldValue ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            h.newValue ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {h.newValue ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[#5C5549]">
                        {h.timestamp ? new Date(h.timestamp).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT ROLE MODAL ── */}
      {isEditModalOpen && editingRole !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#E5DDD2] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                  {editingRole.id ? 'Edit Role Details' : 'Create Custom Role'}
                </h3>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Define title, duties, and theme badge color
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingRole(null);
                }}
                className="p-2 rounded-full hover:bg-[#EAE4D9] text-[#5C5549] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Role Title *</label>
                <input
                  type="text"
                  value={editingRole.name || ''}
                  placeholder="e.g. Lead Barista &amp; Inventory"
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Description &amp; Scope</label>
                <textarea
                  value={editingRole.description || ''}
                  placeholder="Summarize floor duties and operational boundaries..."
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Badge Accent Color</label>
                <div className="flex gap-2.5 flex-wrap">
                  {ROLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingRole({ ...editingRole, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        editingRole.color === c ? 'border-[#1F313D] scale-110 shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingRole(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549] hover:bg-[#EAE4D9] transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingRole.id ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
