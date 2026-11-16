import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, Filter, MoreVertical, Edit2, Trash2,
  CheckCircle, XCircle, PauseCircle, Users, GitBranch, Activity,
  CreditCard, Eye, ChevronDown, X, Upload, AlertTriangle, RefreshCw,
  MapPin, Phone, Mail, Calendar, Shield, ArrowUpRight, Loader2,
  ClipboardList, Star, LogIn
} from 'lucide-react';
import {
  fetchOrganizations,
  fetchOrganization,
  createOrganization,
  updateOrganization,
  setOrganizationStatus,
  deleteOrganization,
  assignSubscriptionPlan,
  fetchBranches,
  createBranch,
  setBranchActive,
  fetchOrgUsers,
  fetchOrgActivity,
  logOrgActivity,
  type Organization,
  type OrgBranch,
  type OrgActivity,
  type OrgStatus,
  type SubscriptionPlan,
  type CreateOrganizationInput,
} from '../../lib/organizationsApi';
import { getCurrentUser } from '../../lib/auth';

// ─── Color helpers ───────────────────────────────────────────────────────────

const statusColors: Record<OrgStatus, { badge: string; icon: React.ReactNode }> = {
  ACTIVE:      { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  SUSPENDED:   { badge: 'bg-amber-100 text-amber-800 border-amber-200',       icon: <PauseCircle className="w-3.5 h-3.5" /> },
  DEACTIVATED: { badge: 'bg-rose-100 text-rose-800 border-rose-200',           icon: <XCircle className="w-3.5 h-3.5" /> },
};

const planColors: Record<SubscriptionPlan, string> = {
  STARTER:    'bg-[#EAE4D9] text-[#5C5549] border-[#DDD5C7]',
  GROWTH:     'bg-blue-50 text-blue-700 border-blue-200',
  PRO:        'bg-purple-50 text-purple-700 border-purple-200',
  ENTERPRISE: 'bg-[#1F313D] text-white border-[#1F313D]',
};

// ─── Blank form state ────────────────────────────────────────────────────────

const BLANK_FORM: CreateOrganizationInput = {
  name: '', owner_name: '', email: '', phone: '',
  address: '', city: '', state: '', country: 'IN',
  gst_number: '', registration_number: '',
  subscription_plan: 'STARTER', logo_url: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const OrganizationsPage: React.FC = () => {
  const currentUser = getCurrentUser();
  const actorEmail = currentUser?.email || 'superadmin';

  // List state
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrgStatus | 'ALL'>('ALL');
  const [planFilter, setPlanFilter] = useState<SubscriptionPlan | 'ALL'>('ALL');

  // Detail drawer
  const [selected, setSelected] = useState<Organization | null>(null);
  const [branches, setBranches] = useState<OrgBranch[]>([]);
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [activity, setActivity] = useState<OrgActivity[]>([]);
  const [detailTab, setDetailTab] = useState<'overview' | 'branches' | 'users' | 'activity'>('overview');
  const [detailLoading, setDetailLoading] = useState(false);

  // Create / Edit modal
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<CreateOrganizationInput>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Branch add modal
  const [addBranchModal, setAddBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', city: '', phone: '', manager_name: '' });

  // Status change confirm
  const [confirmStatus, setConfirmStatus] = useState<{ org: Organization; next: OrgStatus } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Organization | null>(null);

  // Subscription plan modal
  const [subModal, setSubModal] = useState<Organization | null>(null);
  const [subPlan, setSubPlan] = useState<SubscriptionPlan>('STARTER');
  const [subExpiry, setSubExpiry] = useState('');

  // ── Load all orgs ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrganizations();
      setOrgs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Load detail data when org is selected ──────────────────────────────────
  useEffect(() => {
    if (!selected) return;
    setDetailLoading(true);
    Promise.all([
      fetchBranches(selected.id),
      fetchOrgUsers(selected.id),
      fetchOrgActivity(selected.id),
    ]).then(([b, u, a]) => {
      setBranches(b);
      setOrgUsers(u);
      setActivity(a);
    }).catch(() => {}).finally(() => setDetailLoading(false));
  }, [selected]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = orgs.filter((o) => {
    const q = search.toLowerCase();
    if (q && !o.name.toLowerCase().includes(q) && !o.email?.toLowerCase().includes(q) && !o.owner_name?.toLowerCase().includes(q)) return false;
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (planFilter !== 'ALL' && o.subscription_plan !== planFilter) return false;
    return true;
  });

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openCreate = () => { setForm(BLANK_FORM); setFormError(null); setModalMode('create'); };
  const openEdit = (org: Organization) => {
    setForm({
      name: org.name, owner_name: org.owner_name || '', email: org.email || '',
      phone: org.phone || '', address: org.address || '', city: org.city || '',
      state: org.state || '', country: org.country || 'IN',
      gst_number: org.gst_number || '', registration_number: org.registration_number || '',
      subscription_plan: org.subscription_plan, logo_url: org.logo_url || '',
    });
    setFormError(null);
    setModalMode('edit');
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.owner_name.trim() || !form.email.trim()) {
      setFormError('Name, owner name and email are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (modalMode === 'create') {
        const created = await createOrganization(form);
        await logOrgActivity(created.id, actorEmail, 'Organization created', form.name);
        setOrgs((prev) => [created, ...prev]);
      } else if (modalMode === 'edit' && selected) {
        const updated = await updateOrganization(selected.id, form);
        await logOrgActivity(selected.id, actorEmail, 'Organization details updated', null);
        setOrgs((prev) => prev.map((o) => (o.id === selected.id ? updated : o)));
        setSelected(updated);
      }
      setModalMode(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async () => {
    if (!confirmStatus) return;
    try {
      await setOrganizationStatus(confirmStatus.org.id, confirmStatus.next, actorEmail);
      setOrgs((prev) => prev.map((o) => o.id === confirmStatus.org.id ? { ...o, status: confirmStatus.next, is_active: confirmStatus.next === 'ACTIVE' } : o));
      if (selected?.id === confirmStatus.org.id) setSelected((s) => s ? { ...s, status: confirmStatus.next } : s);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConfirmStatus(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteOrganization(confirmDelete.id, actorEmail);
      setOrgs((prev) => prev.filter((o) => o.id !== confirmDelete.id));
      if (selected?.id === confirmDelete.id) setSelected(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  // ── Subscription ──────────────────────────────────────────────────────────
  const handleSubSave = async () => {
    if (!subModal) return;
    try {
      await assignSubscriptionPlan(subModal.id, subPlan, subExpiry || null, actorEmail);
      setOrgs((prev) => prev.map((o) => o.id === subModal.id ? { ...o, subscription_plan: subPlan } : o));
      if (selected?.id === subModal.id) setSelected((s) => s ? { ...s, subscription_plan: subPlan } : s);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubModal(null);
    }
  };

  // ── Add branch ────────────────────────────────────────────────────────────
  const handleAddBranch = async () => {
    if (!selected || !branchForm.name.trim()) return;
    try {
      const branch = await createBranch({ organization_id: selected.id, ...branchForm, is_active: true });
      setBranches((prev) => [branch, ...prev]);
      await logOrgActivity(selected.id, actorEmail, `Branch added: ${branchForm.name}`, null);
      setBranchForm({ name: '', address: '', city: '', phone: '', manager_name: '' });
      setAddBranchModal(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#1F313D]">Organizations</h2>
          <p className="text-sm text-[#7A7268] mt-0.5">
            Manage restaurant organizations, branches, subscriptions & activity.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#1F313D] hover:bg-[#383854] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> New Organization
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orgs', value: orgs.length, color: '#1F313D' },
          { label: 'Active', value: orgs.filter((o) => o.status === 'ACTIVE').length, color: '#059669' },
          { label: 'Suspended', value: orgs.filter((o) => o.status === 'SUSPENDED').length, color: '#d97706' },
          { label: 'Deactivated', value: orgs.filter((o) => o.status === 'DEACTIVATED').length, color: '#dc2626' },
        ].map((s) => (
          <div key={s.label} className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[20px] p-4 shadow-xs">
            <p className="text-xs text-[#7A7268] font-medium">{s.label}</p>
            <p className="text-2xl font-serif font-semibold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, owner or email..."
            className="w-full bg-[#FAF7F2] border border-[#DDD5C7] rounded-full pl-9 pr-4 py-2 text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#82401D]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-full px-3 py-2 text-xs text-[#1F313D] focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DEACTIVATED">Deactivated</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as any)}
          className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-full px-3 py-2 text-xs text-[#1F313D] focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Plans</option>
          <option value="STARTER">Starter</option>
          <option value="GROWTH">Growth</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        <button onClick={load} className="p-2 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] text-[#5C5549] hover:text-[#1F313D] transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-[16px] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#7A7268]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading organizations...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[#7A7268]">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No organizations found</p>
          <p className="text-xs mt-1">Create your first organization to get started.</p>
        </div>
      ) : (
        <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[24px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E5DDD2] bg-[#EFE9DF]">
                  <th className="text-left px-5 py-3.5 font-semibold text-[#5C5549] uppercase tracking-wider">Organization</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#5C5549] uppercase tracking-wider">Owner</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#5C5549] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#5C5549] uppercase tracking-wider">Plan</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#5C5549] uppercase tracking-wider">Branches</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#5C5549] uppercase tracking-wider">Registered</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-[#5C5549] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org, idx) => (
                  <tr
                    key={org.id}
                    className={`border-b border-[#E5DDD2]/60 hover:bg-[#EFE9DF]/60 transition-colors cursor-pointer ${idx === filtered.length - 1 ? 'border-b-0' : ''}`}
                    onClick={() => { setSelected(org); setDetailTab('overview'); }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.name} className="w-8 h-8 rounded-full object-cover border border-[#DDD5C7]" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1F313D] text-white font-serif font-bold text-sm flex items-center justify-center">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#1F313D]">{org.name}</p>
                          <p className="text-[10px] text-[#7A7268]">{org.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#5C5549]">{org.owner_name || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${statusColors[org.status].badge}`}>
                        {statusColors[org.status].icon} {org.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${planColors[org.subscription_plan]}`}>
                        {org.subscription_plan}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#5C5549] font-mono">{org.branch_count ?? 0}</td>
                    <td className="px-4 py-4 text-[#7A7268]">
                      {new Date(org.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          title="Edit"
                          onClick={() => { setSelected(org); openEdit(org); }}
                          className="p-1.5 rounded-full hover:bg-[#EAE4D9] text-[#5C5549] hover:text-[#1F313D] transition"
                        ><Edit2 className="w-3.5 h-3.5" /></button>
                        <button
                          title="Assign Plan"
                          onClick={() => { setSubModal(org); setSubPlan(org.subscription_plan); setSubExpiry(''); }}
                          className="p-1.5 rounded-full hover:bg-[#EAE4D9] text-[#5C5549] hover:text-[#1F313D] transition"
                        ><CreditCard className="w-3.5 h-3.5" /></button>
                        {org.status !== 'ACTIVE' && (
                          <button title="Activate" onClick={() => setConfirmStatus({ org, next: 'ACTIVE' })}
                            className="p-1.5 rounded-full hover:bg-emerald-50 text-emerald-600 transition"><CheckCircle className="w-3.5 h-3.5" /></button>
                        )}
                        {org.status === 'ACTIVE' && (
                          <button title="Suspend" onClick={() => setConfirmStatus({ org, next: 'SUSPENDED' })}
                            className="p-1.5 rounded-full hover:bg-amber-50 text-amber-600 transition"><PauseCircle className="w-3.5 h-3.5" /></button>
                        )}
                        {org.status !== 'DEACTIVATED' && (
                          <button title="Deactivate" onClick={() => setConfirmStatus({ org, next: 'DEACTIVATED' })}
                            className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500 transition"><XCircle className="w-3.5 h-3.5" /></button>
                        )}
                        <button title="Delete" onClick={() => setConfirmDelete(org)}
                          className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          DETAIL DRAWER (slide-in right panel)
      ══════════════════════════════════════════════ */}
      {selected && !modalMode && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-xl bg-[#FAF7F2] shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-[#E5DDD2] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selected.logo_url ? (
                  <img src={selected.logo_url} alt={selected.name} className="w-10 h-10 rounded-full border border-[#DDD5C7]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1F313D] text-white font-serif font-bold flex items-center justify-center">
                    {selected.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-serif font-semibold text-[#1F313D] text-lg">{selected.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusColors[selected.status].badge}`}>
                    {statusColors[selected.status].icon} {selected.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(selected)} className="p-2 rounded-full hover:bg-[#EAE4D9] text-[#5C5549] transition">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-[#EAE4D9] text-[#5C5549] transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="px-6 py-3 border-b border-[#E5DDD2] flex gap-1 bg-[#EFE9DF]">
              {(['overview', 'branches', 'users', 'activity'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDetailTab(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition ${detailTab === t ? 'bg-[#1F313D] text-white' : 'text-[#5C5549] hover:bg-[#DDD5C7]'}`}
                >{t}</button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12 text-[#7A7268]">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                </div>
              ) : detailTab === 'overview' ? (
                <div className="space-y-4">
                  {/* Key info cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', value: selected.email || '—' },
                      { icon: <Phone className="w-3.5 h-3.5" />, label: 'Phone', value: selected.phone || '—' },
                      { icon: <MapPin className="w-3.5 h-3.5" />, label: 'City', value: selected.city || '—' },
                      { icon: <Shield className="w-3.5 h-3.5" />, label: 'GST', value: selected.gst_number || '—' },
                      { icon: <ClipboardList className="w-3.5 h-3.5" />, label: 'Reg. No.', value: selected.registration_number || '—' },
                      { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Registered', value: new Date(selected.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                      { icon: <Users className="w-3.5 h-3.5" />, label: 'Users', value: String(selected.user_count ?? 0) },
                      { icon: <Star className="w-3.5 h-3.5" />, label: 'Customers', value: String(selected.customer_count ?? 0) },
                    ].map((item) => (
                      <div key={item.label} className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-[16px] p-3">
                        <div className="flex items-center gap-1.5 text-[#82401D] mb-1">{item.icon}<span className="text-[10px] font-mono uppercase tracking-wide">{item.label}</span></div>
                        <p className="text-xs font-semibold text-[#1F313D] truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Subscription */}
                  <div className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-[16px] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268]">Subscription</span>
                      <button
                        onClick={() => { setSubModal(selected); setSubPlan(selected.subscription_plan); setSubExpiry(''); }}
                        className="text-[11px] font-semibold text-[#82401D] hover:underline"
                      >Change Plan</button>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${planColors[selected.subscription_plan]}`}>
                      {selected.subscription_plan}
                    </span>
                    {selected.subscription_expires_at && (
                      <p className="text-[10px] text-[#7A7268] mt-1.5">
                        Expires: {new Date(selected.subscription_expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Quick status actions */}
                  <div className="flex flex-wrap gap-2">
                    {selected.status !== 'ACTIVE' && (
                      <button onClick={() => setConfirmStatus({ org: selected, next: 'ACTIVE' })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold hover:bg-emerald-200 transition">
                        <CheckCircle className="w-3.5 h-3.5" /> Activate
                      </button>
                    )}
                    {selected.status === 'ACTIVE' && (
                      <button onClick={() => setConfirmStatus({ org: selected, next: 'SUSPENDED' })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold hover:bg-amber-200 transition">
                        <PauseCircle className="w-3.5 h-3.5" /> Suspend
                      </button>
                    )}
                    {selected.status !== 'DEACTIVATED' && (
                      <button onClick={() => setConfirmStatus({ org: selected, next: 'DEACTIVATED' })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-200 transition">
                        <XCircle className="w-3.5 h-3.5" /> Deactivate
                      </button>
                    )}
                    <button onClick={() => setConfirmDelete(selected)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-200 transition">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Org
                    </button>
                  </div>
                </div>
              ) : detailTab === 'branches' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F313D]">{branches.length} Branch{branches.length !== 1 ? 'es' : ''}</span>
                    <button onClick={() => setAddBranchModal(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#82401D] hover:underline">
                      <Plus className="w-3.5 h-3.5" /> Add Branch
                    </button>
                  </div>
                  {branches.length === 0 ? (
                    <div className="text-center py-10 text-[#7A7268] text-xs">No branches yet. Add the first branch.</div>
                  ) : branches.map((b) => (
                    <div key={b.id} className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-[16px] p-4 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#1F313D]">{b.name}</p>
                        <p className="text-[10px] text-[#7A7268] mt-0.5">{[b.city, b.address].filter(Boolean).join(' · ')}</p>
                        {b.manager_name && <p className="text-[10px] text-[#82401D] mt-0.5 font-medium">Manager: {b.manager_name}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {b.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button onClick={() => setBranchActive(b.id, !b.is_active).then(() => setBranches((prev) => prev.map((x) => x.id === b.id ? { ...x, is_active: !b.is_active } : x)))}
                          className="text-[10px] text-[#5C5549] hover:text-[#1F313D] underline">{b.is_active ? 'Disable' : 'Enable'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : detailTab === 'users' ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#1F313D] mb-2">{orgUsers.length} Users</p>
                  {orgUsers.length === 0 ? (
                    <div className="text-center py-10 text-[#7A7268] text-xs">No users under this organization.</div>
                  ) : orgUsers.map((u: any) => (
                    <div key={u.id} className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#1F313D]">{u.first_name} {u.last_name}</p>
                        <p className="text-[10px] text-[#7A7268]">{u.email}</p>
                        {u.roles?.name && <p className="text-[10px] text-[#82401D] font-medium mt-0.5">{u.roles.name}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {u.last_login_at && (
                          <p className="text-[10px] text-[#7A7268]">
                            Last login: {new Date(u.last_login_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Activity tab
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#1F313D] mb-2">Recent Activity</p>
                  {activity.length === 0 ? (
                    <div className="text-center py-10 text-[#7A7268] text-xs">No activity recorded yet.</div>
                  ) : activity.map((a) => (
                    <div key={a.id} className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-3">
                      <p className="text-xs font-semibold text-[#1F313D]">{a.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#82401D]">{a.actor_email}</span>
                        <span className="text-[10px] text-[#7A7268]">
                          · {new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      {a.details && <p className="text-[10px] text-[#7A7268] mt-1">{a.details}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          CREATE / EDIT MODAL
      ══════════════════════════════════════════════ */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalMode(null)} />
          <div className="relative bg-[#FAF7F2] rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#DDD5C7]">
            <div className="sticky top-0 bg-[#FAF7F2] px-6 py-5 border-b border-[#E5DDD2] flex items-center justify-between z-10">
              <h3 className="font-serif font-semibold text-[#1F313D] text-lg">
                {modalMode === 'create' ? 'New Organization' : 'Edit Organization'}
              </h3>
              <button onClick={() => setModalMode(null)} className="p-2 rounded-full hover:bg-[#EAE4D9] text-[#5C5549] transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Restaurant Name */}
              <div className="md:col-span-2">
                <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">Restaurant Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cafe's Corner Bistro"
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D]"
                />
              </div>

              {/* Owner Name */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">Owner Name *</label>
                <input
                  value={form.owner_name}
                  onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))}
                  placeholder="e.g. George Daniel"
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="contact@restaurant.com"
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 9000000000"
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D]"
                />
              </div>

              {/* City */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Bangalore"
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D]"
                />
              </div>

              {/* State */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">State</label>
                <input
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  placeholder="e.g. Karnataka"
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D]"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Street address"
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D]"
                />
              </div>

              {/* GST */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">GST Number</label>
                <input
                  value={form.gst_number}
                  onChange={(e) => setForm((f) => ({ ...f, gst_number: e.target.value }))}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D]"
                />
              </div>

              {/* Registration Number */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">Registration No.</label>
                <input
                  value={form.registration_number}
                  onChange={(e) => setForm((f) => ({ ...f, registration_number: e.target.value }))}
                  placeholder="FSSAI / MSME / other"
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D]"
                />
              </div>

              {/* Subscription Plan */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">Subscription Plan</label>
                <select
                  value={form.subscription_plan}
                  onChange={(e) => setForm((f) => ({ ...f, subscription_plan: e.target.value as SubscriptionPlan }))}
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D] cursor-pointer"
                >
                  <option value="STARTER">Starter</option>
                  <option value="GROWTH">Growth</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>

              {/* Logo URL */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">Logo URL</label>
                <input
                  value={form.logo_url}
                  onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D]"
                />
              </div>

              {formError && (
                <div className="md:col-span-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-2.5 rounded-[12px] flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {formError}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-[#FAF7F2] px-6 py-4 border-t border-[#E5DDD2] flex justify-end gap-3">
              <button onClick={() => setModalMode(null)} className="px-4 py-2 rounded-full border border-[#DDD5C7] text-sm text-[#5C5549] hover:bg-[#EAE4D9] transition">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#1F313D] text-white text-sm font-semibold hover:bg-[#383854] transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : modalMode === 'create' ? 'Create Organization' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Status Change ── */}
      {confirmStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmStatus(null)} />
          <div className="relative bg-[#FAF7F2] rounded-[24px] shadow-2xl p-6 w-full max-w-sm border border-[#DDD5C7] text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h4 className="font-serif font-semibold text-[#1F313D] text-lg mb-1">Confirm Status Change</h4>
            <p className="text-sm text-[#7A7268]">
              Set <strong>{confirmStatus.org.name}</strong> to <strong>{confirmStatus.next}</strong>?
            </p>
            <div className="flex gap-3 mt-5 justify-center">
              <button onClick={() => setConfirmStatus(null)} className="px-4 py-2 rounded-full border border-[#DDD5C7] text-sm text-[#5C5549] hover:bg-[#EAE4D9] transition">Cancel</button>
              <button onClick={handleStatusChange} className="px-5 py-2 rounded-full bg-[#1F313D] text-white text-sm font-semibold hover:bg-[#383854] transition">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[#FAF7F2] rounded-[24px] shadow-2xl p-6 w-full max-w-sm border border-[#DDD5C7] text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h4 className="font-serif font-semibold text-[#1F313D] text-lg mb-1">Delete Organization?</h4>
            <p className="text-sm text-[#7A7268]">
              <strong>{confirmDelete.name}</strong> will be soft-deleted. This cannot be undone easily.
            </p>
            <div className="flex gap-3 mt-5 justify-center">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-full border border-[#DDD5C7] text-sm text-[#5C5549] hover:bg-[#EAE4D9] transition">Cancel</button>
              <button onClick={handleDelete} className="px-5 py-2 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Subscription Plan Modal ── */}
      {subModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSubModal(null)} />
          <div className="relative bg-[#FAF7F2] rounded-[24px] shadow-2xl p-6 w-full max-w-sm border border-[#DDD5C7]">
            <h4 className="font-serif font-semibold text-[#1F313D] text-lg mb-4">Assign Subscription Plan</h4>
            <p className="text-xs text-[#7A7268] mb-4">Organization: <strong>{subModal.name}</strong></p>
            <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">Plan</label>
            <select
              value={subPlan}
              onChange={(e) => setSubPlan(e.target.value as SubscriptionPlan)}
              className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none mb-4 cursor-pointer"
            >
              <option value="STARTER">Starter</option>
              <option value="GROWTH">Growth</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              value={subExpiry}
              onChange={(e) => setSubExpiry(e.target.value)}
              className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none mb-5"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSubModal(null)} className="px-4 py-2 rounded-full border border-[#DDD5C7] text-sm text-[#5C5549] hover:bg-[#EAE4D9] transition">Cancel</button>
              <button onClick={handleSubSave} className="px-5 py-2 rounded-full bg-[#1F313D] text-white text-sm font-semibold hover:bg-[#383854] transition">Assign Plan</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Branch Modal ── */}
      {addBranchModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddBranchModal(false)} />
          <div className="relative bg-[#FAF7F2] rounded-[24px] shadow-2xl p-6 w-full max-w-md border border-[#DDD5C7]">
            <h4 className="font-serif font-semibold text-[#1F313D] text-lg mb-4">Add Branch — {selected.name}</h4>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Branch Name *', placeholder: 'e.g. Downtown Flagship' },
                { key: 'address', label: 'Address', placeholder: 'Street address' },
                { key: 'city', label: 'City', placeholder: 'e.g. Bangalore' },
                { key: 'phone', label: 'Phone', placeholder: '+91 9000000000' },
                { key: 'manager_name', label: 'Manager Name', placeholder: 'e.g. Renata Osei' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[11px] font-mono uppercase tracking-wide text-[#7A7268] font-bold block mb-1">{field.label}</label>
                  <input
                    value={(branchForm as any)[field.key]}
                    onChange={(e) => setBranchForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-[14px] px-4 py-2.5 text-sm text-[#1F313D] focus:outline-none focus:border-[#82401D]"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setAddBranchModal(false)} className="px-4 py-2 rounded-full border border-[#DDD5C7] text-sm text-[#5C5549] hover:bg-[#EAE4D9] transition">Cancel</button>
              <button onClick={handleAddBranch} className="px-5 py-2 rounded-full bg-[#82401D] text-white text-sm font-semibold hover:bg-[#673536] transition">Add Branch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
