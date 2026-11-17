/**
 * UserManagementPage — Super Admin
 * Features:
 *   · Create platform administrators
 *   · View users across all organizations (with authorization filters)
 *   · Activate / Suspend / Deactivate accounts
 *   · Reset user passwords via secure workflow
 *   · Maintain user login history
 *   · Assign administrative roles & permissions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Search, Filter, Shield, ShieldCheck, ShieldX, ShieldAlert,
  Lock, Unlock, Ban, CheckCircle2, XCircle, Clock, Eye, EyeOff, KeyRound,
  History, Settings2, Building2, ChevronDown, ChevronUp, RefreshCw, X,
  AlertTriangle, CheckSquare, Square, Mail, Phone, Calendar, ArrowUpDown,
  UserCog, Fingerprint, Activity, LogIn, LogOut, MoreVertical, Edit3, Trash2
} from 'lucide-react';
import {
  getAllUsers, createPlatformAdmin, updateAccountStatus, resetUserPassword,
  getUserLoginHistory, updateUserPermissions, generateTempPassword,
  AVAILABLE_PERMISSIONS, AccountStatus, UserRole, PlatformUser, LoginHistoryEntry,
  UserFilters,
} from '../../lib/userManagementApi';
import { getCurrentUser } from '../../lib/auth';

// ─── Sub-types ────────────────────────────────────────────────────────────────

type ModalType =
  | 'create_admin'
  | 'view_history'
  | 'reset_password'
  | 'assign_permissions'
  | 'confirm_status'
  | null;

interface StatusAction {
  userId: string;
  userEmail: string;
  targetStatus: AccountStatus;
  currentStatus: AccountStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: AccountStatus) {
  const map: Record<AccountStatus, { label: string; classes: string; icon: React.ReactNode }> = {
    active: {
      label: 'Active', classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    suspended: {
      label: 'Suspended', classes: 'bg-amber-100 text-amber-700 border border-amber-200',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    deactivated: {
      label: 'Deactivated', classes: 'bg-red-100 text-red-600 border border-red-200',
      icon: <XCircle className="w-3 h-3" />,
    },
    pending: {
      label: 'Pending', classes: 'bg-blue-100 text-blue-600 border border-blue-200',
      icon: <Clock className="w-3 h-3" />,
    },
  };
  const cfg = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.classes}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function roleBadge(role: UserRole) {
  const map: Record<UserRole, { label: string; classes: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', classes: 'bg-purple-100 text-purple-700 border border-purple-200' },
    PLATFORM_ADMIN: { label: 'Platform Admin', classes: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
    RESTAURANT_ADMIN: { label: 'Restaurant Admin', classes: 'bg-orange-100 text-orange-700 border border-orange-200' },
    STAFF: { label: 'Staff', classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
    CUSTOMER: { label: 'Customer', classes: 'bg-teal-100 text-teal-700 border border-teal-200' },
  };
  const cfg = map[role] || { label: role, classes: 'bg-gray-100 text-gray-600 border border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export const UserManagementPage: React.FC = () => {
  const currentUser = getCurrentUser();

  // List state
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'ALL'>('ALL');
  const [orgFilter, setOrgFilter] = useState<string>('ALL');

  // Modals
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);

  // Feedback
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Create Admin form
  const [createForm, setCreateForm] = useState({
    email: '', full_name: '', role: 'RESTAURANT_ADMIN' as UserRole,
    phone: '', organization_id: '', permissions: [] as string[],
    temp_password: '', show_password: false,
  });

  // Reset password form
  const [resetForm, setResetForm] = useState({ new_password: '', confirm: '', show: false });

  // Permissions form
  const [permForm, setPermForm] = useState({ permissions: [] as string[], role: 'RESTAURANT_ADMIN' as UserRole });

  // ─── Fetch users ────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const filters: UserFilters = {
      search: search || undefined,
      role: roleFilter !== 'ALL' ? roleFilter : undefined,
      account_status: statusFilter !== 'ALL' ? statusFilter : undefined,
      organization_id: orgFilter !== 'ALL' ? orgFilter : undefined,
    };
    const { data, total: t } = await getAllUsers(filters);
    setUsers(data);
    setTotal(t);
    setLoading(false);
    setRefreshing(false);
  }, [search, roleFilter, statusFilter, orgFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Account Status Actions ──────────────────────────────────────────────────

  const initiateStatusChange = (user: PlatformUser, target: AccountStatus) => {
    if (user.role === 'SUPER_ADMIN') {
      showToast('Super Admin accounts cannot be modified.', 'error');
      return;
    }
    setStatusAction({ userId: user.id, userEmail: user.email, targetStatus: target, currentStatus: user.account_status });
    setModal('confirm_status');
  };

  const confirmStatusChange = async () => {
    if (!statusAction) return;
    setActionLoading(statusAction.userId);
    const { success, error } = await updateAccountStatus(statusAction.userId, statusAction.targetStatus);
    setActionLoading(null);
    setModal(null);
    if (success) {
      showToast(`Account ${statusAction.targetStatus === 'active' ? 'activated' : statusAction.targetStatus} successfully.`);
      setUsers(prev => prev.map(u => u.id === statusAction.userId ? { ...u, account_status: statusAction.targetStatus } : u));
    } else {
      showToast(error || 'Failed to update account status.', 'error');
    }
  };

  // ─── Password Reset ──────────────────────────────────────────────────────────

  const openResetModal = (user: PlatformUser) => {
    if (user.role === 'SUPER_ADMIN') {
      showToast('Super Admin passwords cannot be reset from here.', 'error');
      return;
    }
    setSelectedUser(user);
    setResetForm({ new_password: generateTempPassword(), confirm: '', show: false });
    setModal('reset_password');
  };

  const handlePasswordReset = async () => {
    if (!selectedUser) return;
    if (resetForm.new_password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    setActionLoading(selectedUser.id);
    const { success, error } = await resetUserPassword(selectedUser.id, selectedUser.email, resetForm.new_password);
    setActionLoading(null);
    setModal(null);
    if (success) {
      showToast(`Password reset successfully for ${selectedUser.email}.`);
    } else {
      showToast(error || 'Failed to reset password.', 'error');
    }
  };

  // ─── Login History ───────────────────────────────────────────────────────────

  const openHistoryModal = async (user: PlatformUser) => {
    setSelectedUser(user);
    setLoginHistory([]);
    setModal('view_history');
    const { data } = await getUserLoginHistory(user.id);
    setLoginHistory(data);
  };

  // ─── Permissions ─────────────────────────────────────────────────────────────

  const openPermissionsModal = (user: PlatformUser) => {
    if (user.role === 'SUPER_ADMIN') {
      showToast('Super Admin permissions cannot be changed.', 'error');
      return;
    }
    setSelectedUser(user);
    setPermForm({ permissions: [...user.permissions], role: user.role });
    setModal('assign_permissions');
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setActionLoading(selectedUser.id);
    const { success, error } = await updateUserPermissions({
      user_id: selectedUser.id,
      permissions: permForm.permissions,
      role: permForm.role,
    });
    setActionLoading(null);
    setModal(null);
    if (success) {
      showToast(`Permissions updated for ${selectedUser.email}.`);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, permissions: permForm.permissions, role: permForm.role } : u));
    } else {
      showToast(error || 'Failed to update permissions.', 'error');
    }
  };

  const togglePerm = (key: string) => {
    setPermForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  };

  // ─── Create Admin ────────────────────────────────────────────────────────────

  const handleCreateAdmin = async () => {
    if (!createForm.email || !createForm.full_name || !createForm.temp_password) {
      showToast('Email, full name, and initial password are required.', 'error');
      return;
    }
    setActionLoading('create');
    const { success, error } = await createPlatformAdmin({
      email: createForm.email,
      full_name: createForm.full_name,
      role: createForm.role,
      phone: createForm.phone,
      organization_id: createForm.organization_id || undefined,
      permissions: createForm.permissions,
      temp_password: createForm.temp_password,
    });
    setActionLoading(null);
    if (success) {
      showToast(`Platform admin "${createForm.full_name}" created successfully.`);
      setModal(null);
      setCreateForm({ email: '', full_name: '', role: 'RESTAURANT_ADMIN', phone: '', organization_id: '', permissions: [], temp_password: '', show_password: false });
      fetchUsers(true);
    } else {
      showToast(error || 'Failed to create admin.', 'error');
    }
  };

  // ─── Stats ───────────────────────────────────────────────────────────────────

  const stats = {
    total: users.length,
    active: users.filter(u => u.account_status === 'active').length,
    suspended: users.filter(u => u.account_status === 'suspended').length,
    deactivated: users.filter(u => u.account_status === 'deactivated').length,
    admins: users.filter(u => u.role === 'PLATFORM_ADMIN' || u.role === 'RESTAURANT_ADMIN').length,
  };

  // ─── Permission groups ────────────────────────────────────────────────────────

  const permGroups = AVAILABLE_PERMISSIONS.reduce<Record<string, typeof AVAILABLE_PERMISSIONS>>((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {});

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-[#F5F0E8] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F313D] font-serif flex items-center gap-2">
            <UserCog className="w-6 h-6 text-[#79415A]" /> User Management
          </h1>
          <p className="text-sm text-[#7A7268] mt-0.5">
            Manage platform administrators, user accounts, roles and permissions.
          </p>
        </div>
        <button
          onClick={() => {
            setCreateForm(f => ({ ...f, temp_password: generateTempPassword() }));
            setModal('create_admin');
          }}
          className="inline-flex items-center gap-2 bg-[#79415A] hover:bg-[#6a3650] text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Create Platform Admin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-[#79415A]', bg: 'bg-[#79415A]/10' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Suspended', value: stats.suspended, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Deactivated', value: stats.deactivated, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Admins', value: stats.admins, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-[#E5DDD2] shadow-xs">
              <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-black text-[#1F313D]">{s.value}</p>
              <p className="text-xs text-[#7A7268] mt-0.5 font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search by name, email or org…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A] focus:ring-1 focus:ring-[#79415A]/30 transition"
          />
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as any)}
          className="border border-[#E5DDD2] rounded-xl px-3 py-2 text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A] bg-white transition"
        >
          <option value="ALL">All Roles</option>
          <option value="PLATFORM_ADMIN">Platform Admin</option>
          <option value="RESTAURANT_ADMIN">Restaurant Admin</option>
          <option value="STAFF">Staff</option>
          <option value="CUSTOMER">Customer</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="border border-[#E5DDD2] rounded-xl px-3 py-2 text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A] bg-white transition"
        >
          <option value="ALL">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
          <option value="pending">Pending</option>
        </select>

        {/* Refresh */}
        <button
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="p-2 rounded-xl border border-[#E5DDD2] hover:bg-[#F5F0E8] text-[#7A7268] hover:text-[#1F313D] transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        <span className="text-xs text-[#7A7268] font-medium ml-auto">{total} user{total !== 1 ? 's' : ''}</span>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-[#79415A]/30 border-t-[#79415A] rounded-full animate-spin" />
            <p className="text-sm text-[#7A7268]">Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="w-12 h-12 text-[#E5DDD2]" />
            <p className="text-sm text-[#7A7268] font-medium">No users found</p>
            <p className="text-xs text-[#9CA3AF]">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5DDD2] bg-[#FAF7F2]">
                  {['User', 'Role', 'Organization', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-[#7A7268]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD2]/60">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-[#FAF7F2]/60 transition-colors group">
                    {/* User info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#79415A] to-[#4a2838] flex items-center justify-center text-white text-xs font-black shrink-0">
                          {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1F313D]">{user.full_name}</p>
                          <p className="text-xs text-[#7A7268]">{user.email}</p>
                          {user.phone && <p className="text-[10px] text-[#9CA3AF]">{user.phone}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">{roleBadge(user.role)}</td>

                    {/* Organization */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                        <span className="text-xs text-[#1F313D]">{user.organization_name || 'All / Global'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">{statusBadge(user.account_status)}</td>

                    {/* Last Login */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#7A7268]">{timeAgo(user.last_login_at)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity flex-wrap">
                        {/* Activate */}
                        {user.account_status !== 'active' && (
                          <button
                            title="Activate"
                            onClick={() => initiateStatusChange(user, 'active')}
                            disabled={actionLoading === user.id}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition disabled:opacity-50"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Suspend */}
                        {user.account_status !== 'suspended' && user.role !== 'SUPER_ADMIN' && (
                          <button
                            title="Suspend"
                            onClick={() => initiateStatusChange(user, 'suspended')}
                            disabled={actionLoading === user.id}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition disabled:opacity-50"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Deactivate */}
                        {user.account_status !== 'deactivated' && user.role !== 'SUPER_ADMIN' && (
                          <button
                            title="Deactivate"
                            onClick={() => initiateStatusChange(user, 'deactivated')}
                            disabled={actionLoading === user.id}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition disabled:opacity-50"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Reset Password */}
                        <button
                          title="Reset Password"
                          onClick={() => openResetModal(user)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Login History */}
                        <button
                          title="Login History"
                          onClick={() => openHistoryModal(user)}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {/* Assign Permissions */}
                        <button
                          title="Assign Permissions"
                          onClick={() => openPermissionsModal(user)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MODAL: Confirm Status Change
      ══════════════════════════════════════ */}
      {modal === 'confirm_status' && statusAction && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                statusAction.targetStatus === 'active' ? 'bg-emerald-100' :
                statusAction.targetStatus === 'suspended' ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                {statusAction.targetStatus === 'active' ? <Unlock className="w-5 h-5 text-emerald-600" /> :
                 statusAction.targetStatus === 'suspended' ? <Lock className="w-5 h-5 text-amber-600" /> :
                 <Ban className="w-5 h-5 text-red-500" />}
              </div>
              <div>
                <h3 className="font-bold text-[#1F313D] text-base capitalize">
                  {statusAction.targetStatus === 'active' ? 'Activate' :
                   statusAction.targetStatus === 'suspended' ? 'Suspend' : 'Deactivate'} Account
                </h3>
                <p className="text-xs text-[#7A7268]">{statusAction.userEmail}</p>
              </div>
            </div>

            <p className="text-sm text-[#5C5549] mb-5 leading-relaxed">
              {statusAction.targetStatus === 'active'
                ? 'This will restore full access for this user. They will be able to log in immediately.'
                : statusAction.targetStatus === 'suspended'
                ? 'This user will be temporarily blocked from logging in. Their data is preserved. You can reactivate anytime.'
                : 'This permanently deactivates the account. The user will lose all access. This action is reversible by a Super Admin.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E5DDD2] text-sm font-semibold text-[#7A7268] hover:bg-[#F5F0E8] transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={!!actionLoading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 ${
                  statusAction.targetStatus === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  statusAction.targetStatus === 'suspended' ? 'bg-amber-500 hover:bg-amber-600' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading ? 'Processing…' : `Confirm ${statusAction.targetStatus === 'active' ? 'Activation' : statusAction.targetStatus === 'suspended' ? 'Suspension' : 'Deactivation'}`}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ══════════════════════════════════════
          MODAL: Reset Password
      ══════════════════════════════════════ */}
      {modal === 'reset_password' && selectedUser && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#1F313D] text-base">Reset Password</h3>
                <p className="text-xs text-[#7A7268]">{selectedUser.email}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                A new temporary password will be set. The user must change it on their next login.
                Share this password through a secure channel only.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5C5549] mb-1">New Temporary Password</label>
                <div className="relative">
                  <input
                    type={resetForm.show ? 'text' : 'password'}
                    value={resetForm.new_password}
                    onChange={e => setResetForm(f => ({ ...f, new_password: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD2] text-sm font-mono text-[#1F313D] focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition pr-20"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setResetForm(f => ({ ...f, show: !f.show }))}
                      className="p-1 rounded text-[#7A7268] hover:text-[#1F313D]"
                    >
                      {resetForm.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetForm(f => ({ ...f, new_password: generateTempPassword() }))}
                      className="p-1 rounded text-[#7A7268] hover:text-[#1F313D]"
                      title="Generate new password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1">Min 8 chars · Mix of letters, numbers & symbols recommended</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-[#E5DDD2] text-sm font-semibold text-[#7A7268] hover:bg-[#F5F0E8] transition">
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition disabled:opacity-50"
              >
                {actionLoading ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ══════════════════════════════════════
          MODAL: Login History
      ══════════════════════════════════════ */}
      {modal === 'view_history' && selectedUser && (
        <ModalOverlay onClose={() => setModal(null)} wide>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <History className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F313D] text-base">Login History</h3>
                  <p className="text-xs text-[#7A7268]">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="p-2 rounded-xl hover:bg-gray-100 text-[#7A7268]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loginHistory.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2">
                <div className="w-8 h-8 border-2 border-[#79415A]/30 border-t-[#79415A] rounded-full animate-spin" />
                <p className="text-sm text-[#7A7268]">Loading history…</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {loginHistory.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2]">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      entry.status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                      entry.status === 'failed' ? 'bg-red-100 text-red-500' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {entry.status === 'success' ? <LogIn className="w-4 h-4" /> :
                       entry.status === 'failed' ? <XCircle className="w-4 h-4" /> :
                       <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-xs font-bold capitalize ${
                          entry.status === 'success' ? 'text-emerald-600' :
                          entry.status === 'failed' ? 'text-red-500' : 'text-amber-600'
                        }`}>
                          {entry.status === 'admin_password_reset' as any ? 'Password Reset by Admin' : entry.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-[#9CA3AF]">
                          {new Date(entry.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        <span className="text-[10px] text-[#7A7268]">📍 {entry.location || 'Unknown'}</span>
                        <span className="text-[10px] text-[#7A7268]">🖥 {entry.device_type || entry.user_agent}</span>
                        <span className="text-[10px] text-[#7A7268] font-mono">🔗 {entry.ip_address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalOverlay>
      )}

      {/* ══════════════════════════════════════
          MODAL: Assign Permissions
      ══════════════════════════════════════ */}
      {modal === 'assign_permissions' && selectedUser && (
        <ModalOverlay onClose={() => setModal(null)} wide>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F313D] text-base">Assign Permissions</h3>
                  <p className="text-xs text-[#7A7268]">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="p-2 rounded-xl hover:bg-gray-100 text-[#7A7268]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#5C5549] mb-1.5">Role</label>
              <select
                value={permForm.role}
                onChange={e => setPermForm(f => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full border border-[#E5DDD2] rounded-xl px-3 py-2 text-sm text-[#1F313D] focus:outline-none focus:border-indigo-400 bg-white"
              >
                <option value="PLATFORM_ADMIN">Platform Admin</option>
                <option value="RESTAURANT_ADMIN">Restaurant Admin</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>

            {/* Permission groups */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {Object.entries(permGroups).map(([group, perms]) => (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#5C5549]">{group}</h4>
                  </div>
                  <div className="space-y-1.5 pl-5">
                    {perms.map(perm => {
                      const checked = permForm.permissions.includes(perm.key);
                      return (
                        <label key={perm.key} className="flex items-center gap-2.5 cursor-pointer group">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                              checked ? 'bg-indigo-600 border-indigo-600' : 'border-[#D1D5DB] group-hover:border-indigo-400'
                            }`}
                            onClick={() => togglePerm(perm.key)}
                          >
                            {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-xs text-[#5C5549] group-hover:text-[#1F313D]">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-5 pt-4 border-t border-[#E5DDD2]">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-[#E5DDD2] text-sm font-semibold text-[#7A7268] hover:bg-[#F5F0E8] transition">
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition disabled:opacity-50"
              >
                {actionLoading ? 'Saving…' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ══════════════════════════════════════
          MODAL: Create Platform Admin
      ══════════════════════════════════════ */}
      {modal === 'create_admin' && (
        <ModalOverlay onClose={() => setModal(null)} wide>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#79415A]/15 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#79415A]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F313D] text-base">Create Platform Administrator</h3>
                  <p className="text-xs text-[#7A7268]">Create a new admin account with specific permissions</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="p-2 rounded-xl hover:bg-gray-100 text-[#7A7268]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {/* Full name */}
              <div>
                <label className="block text-xs font-bold text-[#5C5549] mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Arjun Sharma"
                  value={createForm.full_name}
                  onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A] transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#5C5549] mb-1">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="admin@cafescorner.com"
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A] transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-[#5C5549] mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={createForm.phone}
                  onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A] transition"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-[#5C5549] mb-1">Role <span className="text-red-500">*</span></label>
                <select
                  value={createForm.role}
                  onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full border border-[#E5DDD2] rounded-xl px-3 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A] bg-white"
                >
                  <option value="PLATFORM_ADMIN">Platform Admin (global access)</option>
                  <option value="RESTAURANT_ADMIN">Restaurant Admin (branch-specific)</option>
                  <option value="STAFF">Staff Member</option>
                </select>
              </div>

              {/* Initial Password */}
              <div>
                <label className="block text-xs font-bold text-[#5C5549] mb-1">Initial Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={createForm.show_password ? 'text' : 'password'}
                    value={createForm.temp_password}
                    onChange={e => setCreateForm(f => ({ ...f, temp_password: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD2] text-sm font-mono text-[#1F313D] focus:outline-none focus:border-[#79415A] transition pr-20"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button type="button" onClick={() => setCreateForm(f => ({ ...f, show_password: !f.show_password }))} className="p-1 rounded text-[#7A7268] hover:text-[#1F313D]">
                      {createForm.show_password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button type="button" onClick={() => setCreateForm(f => ({ ...f, temp_password: generateTempPassword() }))} className="p-1 rounded text-[#7A7268] hover:text-[#1F313D]" title="Generate">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1">User must change this on first login</p>
              </div>

              {/* Quick permission presets */}
              <div>
                <label className="block text-xs font-bold text-[#5C5549] mb-1.5">Permission Preset</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[
                    { label: 'Read Only', perms: ['org.view', 'users.view', 'subscriptions.view', 'reports.view'] },
                    { label: 'Standard', perms: ['org.view', 'org.edit', 'users.view', 'users.edit', 'subscriptions.view', 'reports.view'] },
                    { label: 'Full Access', perms: AVAILABLE_PERMISSIONS.map(p => p.key) },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setCreateForm(f => ({ ...f, permissions: preset.perms }))}
                      className="px-3 py-1 rounded-lg border border-[#E5DDD2] text-xs font-semibold text-[#5C5549] hover:bg-[#F5F0E8] hover:border-[#79415A] hover:text-[#79415A] transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#9CA3AF]">{createForm.permissions.length} permissions selected</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5 pt-4 border-t border-[#E5DDD2]">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-[#E5DDD2] text-sm font-semibold text-[#7A7268] hover:bg-[#F5F0E8] transition">
                Cancel
              </button>
              <button
                onClick={handleCreateAdmin}
                disabled={actionLoading === 'create'}
                className="flex-1 py-2.5 rounded-xl bg-[#79415A] hover:bg-[#6a3650] text-white text-sm font-bold transition disabled:opacity-50"
              >
                {actionLoading === 'create' ? 'Creating…' : 'Create Administrator'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

// ─── Shared Modal Overlay ─────────────────────────────────────────────────────

const ModalOverlay: React.FC<{ children: React.ReactNode; onClose: () => void; wide?: boolean }> = ({
  children, onClose, wide = false,
}) => (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
    <div
      className={`bg-white rounded-2xl shadow-2xl ${wide ? 'w-full max-w-lg' : 'w-full max-w-sm'} max-h-[90vh] overflow-y-auto`}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);
