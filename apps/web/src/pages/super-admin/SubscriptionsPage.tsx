import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Send,
  XCircle,
  PauseCircle,
  Edit2,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  Check,
  X,
  FileText,
  Sparkles,
  Zap,
  Layers,
  ChevronDown,
  Gift,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import {
  fetchSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  fetchOrganizationSubscriptions,
  assignPlanToOrganization,
  sendRenewalReminder,
  cancelSubscription,
  renewSubscription,
  fetchPaymentHistory,
  DEFAULT_PLANS,
  type SubscriptionTier,
  type BillingInterval,
  type SubscriptionStatus,
  type SubscriptionPlanItem,
  type OrgSubscriptionItem,
  type SubscriptionPaymentItem,
  type PaymentMethod
} from '../../lib/subscriptionsApi';
import { fetchOrganizations, type Organization } from '../../lib/organizationsApi';
import { getCurrentUser } from '../../lib/auth';

// ─── Status Badge Styling ───────────────────────────────────────────────────

const statusBadgeStyles: Record<SubscriptionStatus, { bg: string; text: string; border: string; label: string }> = {
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Active' },
  TRIAL: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: '14-Day Trial' },
  RENEWAL_DUE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Renewal Due' },
  EXPIRED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Expired' },
  CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', label: 'Cancelled' },
};

const tierPillColors: Record<SubscriptionTier, string> = {
  FREE: 'bg-[#EAE4D9] text-[#5C5549] border-[#DDD5C7]',
  BASIC: 'bg-blue-50 text-blue-700 border-blue-200',
  STANDARD: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PREMIUM: 'bg-[#79415A]/15 text-[#79415A] border-[#79415A]/30',
  ENTERPRISE: 'bg-[#1F313D] text-white border-[#1F313D]',
};

export const SubscriptionsPage: React.FC = () => {
  const currentUser = getCurrentUser();
  const actorEmail = currentUser?.email || 'superadmin@example.com';

  // Sub-tabs: 'subscriptions' | 'plans' | 'payments'
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans' | 'payments'>('subscriptions');

  // Data states
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(DEFAULT_PLANS);
  const [subscriptions, setSubscriptions] = useState<OrgSubscriptionItem[]>([]);
  const [payments, setPayments] = useState<SubscriptionPaymentItem[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'ALL'>('ALL');
  const [planFilter, setPlanFilter] = useState<SubscriptionTier | 'ALL'>('ALL');

  // Notification banners / reminders
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    organizationId: '',
    planKey: 'BASIC' as SubscriptionTier,
    billingInterval: 'monthly' as BillingInterval,
    isTrial: false,
    trialDays: 14,
    amount: 29,
    paymentMethod: 'CARD' as PaymentMethod,
  });

  const [editPlanModalOpen, setEditPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState<Partial<SubscriptionPlanItem>>({
    key: 'BASIC',
    name: '',
    description: '',
    price_monthly: 0,
    price_quarterly: 0,
    price_yearly: 0,
    max_branches: 1,
    max_users: 3,
    max_orders_per_month: 500,
    max_customers: 1000,
    features: [],
  });
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [featureInput, setFeatureInput] = useState('');

  // Cancel modal
  const [cancelModalSub, setCancelModalSub] = useState<OrgSubscriptionItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Renew modal
  const [renewModalSub, setRenewModalSub] = useState<OrgSubscriptionItem | null>(null);
  const [renewInterval, setRenewInterval] = useState<BillingInterval>('monthly');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<PaymentMethod>('CARD');

  // Load all subscription data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedPlans, loadedSubs, loadedPayments, loadedOrgs] = await Promise.all([
        fetchSubscriptionPlans(),
        fetchOrganizationSubscriptions(),
        fetchPaymentHistory(),
        fetchOrganizations(),
      ]);

      setPlans(loadedPlans);
      setSubscriptions(loadedSubs);
      setPayments(loadedPayments);
      setOrganizations(loadedOrgs);
    } catch (err) {
      console.warn('Subscription load notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;
    if (planFilter !== 'ALL' && sub.plan_key !== planFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const orgMatch = sub.organization_name?.toLowerCase().includes(q);
      const planMatch = sub.plan_key.toLowerCase().includes(q);
      if (!orgMatch && !planMatch) return false;
    }
    return true;
  });

  // Calculate high-level metrics
  const activeSubsCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const trialSubsCount = subscriptions.filter((s) => s.status === 'TRIAL').length;
  const renewalDueCount = subscriptions.filter((s) => s.status === 'RENEWAL_DUE').length;
  const expiredSubsCount = subscriptions.filter((s) => s.status === 'EXPIRED').length;
  const totalRevenueCollected = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleSendReminder = async (sub: OrgSubscriptionItem) => {
    try {
      await sendRenewalReminder(sub.id, sub.organization_id, actorEmail);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, renewal_reminder_sent: true } : s))
      );
      setReminderSuccess(`Renewal reminder successfully sent to ${sub.organization_name}!`);
      setTimeout(() => setReminderSuccess(null), 4000);
    } catch {
      alert('Failed to send renewal reminder.');
    }
  };

  const handleOpenAssignModal = () => {
    const defaultOrg = organizations[0]?.id || '';
    setAssignForm({
      organizationId: defaultOrg,
      planKey: 'BASIC',
      billingInterval: 'monthly',
      isTrial: false,
      trialDays: 14,
      amount: 29,
      paymentMethod: 'CARD',
    });
    setAssignModalOpen(true);
  };

  const handlePlanKeyOrIntervalChange = (planKey: SubscriptionTier, interval: BillingInterval, isTrial: boolean) => {
    const targetPlan = plans.find((p) => p.key === planKey);
    let calculatedAmount = 0;
    if (!isTrial && targetPlan) {
      if (interval === 'yearly') calculatedAmount = targetPlan.price_yearly;
      else if (interval === 'quarterly') calculatedAmount = targetPlan.price_quarterly;
      else calculatedAmount = targetPlan.price_monthly;
    }

    setAssignForm((prev) => ({
      ...prev,
      planKey,
      billingInterval: interval,
      isTrial,
      amount: calculatedAmount,
    }));
  };

  const handleSubmitAssign = async () => {
    if (!assignForm.organizationId) {
      alert('Please select a restaurant organization.');
      return;
    }

    const org = organizations.find((o) => o.id === assignForm.organizationId);
    const orgName = org?.name || 'Restaurant';

    try {
      const assigned = await assignPlanToOrganization({
        organizationId: assignForm.organizationId,
        organizationName: orgName,
        planKey: assignForm.planKey,
        billingInterval: assignForm.billingInterval,
        isTrial: assignForm.isTrial,
        trialDays: assignForm.trialDays,
        amount: assignForm.amount,
        paymentMethod: assignForm.paymentMethod,
        actorEmail,
      });

      setSubscriptions((prev) => [assigned, ...prev.filter((s) => s.organization_id !== assignForm.organizationId)]);
      setAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      alert('Error assigning plan: ' + err.message);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalSub) return;
    try {
      await cancelSubscription(cancelModalSub.id, cancelModalSub.organization_id, cancelReason, actorEmail);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === cancelModalSub.id ? { ...s, status: 'CANCELLED', cancelled_at: new Date().toISOString() } : s))
      );
      setCancelModalSub(null);
      setCancelReason('');
    } catch (err: any) {
      alert('Failed to cancel subscription: ' + err.message);
    }
  };

  const handleConfirmRenew = async () => {
    if (!renewModalSub) return;
    const targetPlan = plans.find((p) => p.key === renewModalSub.plan_key);
    let amount = 0;
    if (targetPlan) {
      if (renewInterval === 'yearly') amount = targetPlan.price_yearly;
      else if (renewInterval === 'quarterly') amount = targetPlan.price_quarterly;
      else amount = targetPlan.price_monthly;
    }

    try {
      const renewed = await renewSubscription(
        renewModalSub.id,
        renewModalSub.organization_id,
        renewModalSub.organization_name || 'Restaurant',
        renewModalSub.plan_key,
        renewInterval,
        amount,
        renewPaymentMethod,
        actorEmail
      );

      setSubscriptions((prev) => prev.map((s) => (s.id === renewModalSub.id ? renewed : s)));
      setRenewModalSub(null);
      loadData();
    } catch (err: any) {
      alert('Failed to renew subscription: ' + err.message);
    }
  };

  const handleOpenEditPlan = (plan: SubscriptionPlanItem) => {
    setEditingPlanId(plan.id);
    setPlanForm({ ...plan });
    setEditPlanModalOpen(true);
  };

  const handleOpenCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm({
      key: 'BASIC',
      name: '',
      description: '',
      price_monthly: 49,
      price_quarterly: 129,
      price_yearly: 490,
      max_branches: 2,
      max_users: 10,
      max_orders_per_month: 1500,
      max_customers: 3000,
      features: ['Table POS Terminal', 'Kitchen Display Sync', 'Customer Loyalty Engine'],
    });
    setEditPlanModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setPlanForm((prev) => ({
      ...prev,
      features: [...(prev.features || []), featureInput.trim()],
    }));
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setPlanForm((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSavePlan = async () => {
    if (!planForm.name?.trim()) {
      alert('Plan name is required.');
      return;
    }

    try {
      if (editingPlanId) {
        const updated = await updateSubscriptionPlan(editingPlanId, planForm);
        setPlans((prev) => prev.map((p) => (p.id === editingPlanId ? updated : p)));
      } else {
        const created = await createSubscriptionPlan(planForm);
        setPlans((prev) => [...prev, created]);
      }
      setEditPlanModalOpen(false);
    } catch (err: any) {
      alert('Error saving plan: ' + err.message);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-[#1F313D] tracking-tight">
            Subscription &amp; Billing Command
          </h2>
          <p className="text-xs text-[#7A7268] mt-1 font-medium">
            Manage plans, restaurant subscriptions, trials, renewal alerts &amp; transaction ledgers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh database"
            className="p-2.5 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] text-[#5C5549] hover:text-[#1F313D] shadow-2xs transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#82401D]' : ''}`} />
          </button>

          <button
            onClick={handleOpenAssignModal}
            className="flex items-center gap-2 bg-[#82401D] hover:bg-[#673536] text-white px-4 py-2 rounded-full text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Assign Restaurant Plan
          </button>
        </div>
      </div>

      {/* ── KPI Metric Badges ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[22px] p-4 shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block">
            Active Subscriptions
          </span>
          <div className="text-2xl font-black text-[#1F313D] mt-1 font-serif">{activeSubsCount}</div>
          <span className="text-[10px] text-emerald-700 font-bold mt-0.5 inline-block">● Production Live</span>
        </div>

        <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[22px] p-4 shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block">
            Free Trials Active
          </span>
          <div className="text-2xl font-black text-purple-700 mt-1 font-serif">{trialSubsCount}</div>
          <span className="text-[10px] text-purple-600 font-bold mt-0.5 inline-block">14-Day Free Tier</span>
        </div>

        <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[22px] p-4 shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block">
            Renewal Reminders Due
          </span>
          <div className="text-2xl font-black text-amber-700 mt-1 font-serif">{renewalDueCount}</div>
          <span className="text-[10px] text-amber-600 font-bold mt-0.5 inline-block">≤ 7 Days Left</span>
        </div>

        <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[22px] p-4 shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block">
            Expired &amp; Cancelled
          </span>
          <div className="text-2xl font-black text-rose-700 mt-1 font-serif">{expiredSubsCount}</div>
          <span className="text-[10px] text-rose-600 font-bold mt-0.5 inline-block">Needs Action</span>
        </div>

        <div className="bg-[#1F313D] text-white rounded-[22px] p-4 shadow-md col-span-2 sm:col-span-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#E5C9B3] font-bold block">
            Total Revenue Billed
          </span>
          <div className="text-2xl font-black text-white mt-1 font-serif">
            ${totalRevenueCollected.toLocaleString()}
          </div>
          <span className="text-[10px] text-[#E5C9B3]/80 font-bold mt-0.5 inline-block">Lifetime Receipts</span>
        </div>
      </div>

      {/* ── Success Toast Alert ── */}
      {reminderSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-[16px] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reminderSuccess}</span>
          </div>
          <button onClick={() => setReminderSuccess(null)} className="p-1 hover:text-emerald-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Sub-Navigation Capsule Tab Switcher ── */}
      <div className="flex items-center gap-2 border-b border-[#DDD5C7] pb-3">
        {[
          { id: 'subscriptions', label: `Restaurant Subscriptions (${subscriptions.length})` },
          { id: 'plans', label: `Plan Master Catalog (${plans.length})` },
          { id: 'payments', label: `Payment History (${payments.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[#1F313D] text-white shadow-xs'
                : 'text-[#5C5549] hover:text-[#1F313D] hover:bg-[#FAF7F2]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 1: RESTAURANT SUBSCRIPTIONS
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-[#7A7268] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurant or plan..."
                className="w-full bg-[#FAF7F2] border border-[#DDD5C7] rounded-full pl-9 pr-4 py-2 text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#82401D]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-full px-3.5 py-2 text-xs text-[#1F313D] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">14-Day Free Trial</option>
              <option value="RENEWAL_DUE">Renewal Due (≤ 7 days)</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-full px-3.5 py-2 text-xs text-[#1F313D] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Plans</option>
              <option value="FREE">Free Tier</option>
              <option value="BASIC">Basic</option>
              <option value="STANDARD">Standard</option>
              <option value="PREMIUM">Premium</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>

          {/* Subscriptions Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#7A7268] text-xs">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading restaurant subscriptions from database...
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[24px] p-12 text-center text-[#7A7268]">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#82401D]" />
              <p className="font-serif font-bold text-base text-[#1F313D]">No restaurant subscriptions found</p>
              <p className="text-xs mt-1">Assign a plan to your first restaurant organization to start billing.</p>
              <button
                onClick={handleOpenAssignModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F313D] text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Assign First Plan
              </button>
            </div>
          ) : (
            <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[24px] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E5DDD2] bg-[#EFE9DF]">
                      <th className="text-left px-5 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Restaurant Organization</th>
                      <th className="text-left px-4 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Plan Tier</th>
                      <th className="text-left px-4 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Billing Interval</th>
                      <th className="text-left px-4 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Start Date</th>
                      <th className="text-left px-4 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Expiry / Renews</th>
                      <th className="text-right px-5 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map((sub, idx) => {
                      const badge = statusBadgeStyles[sub.status];
                      const isDueOrExpired = sub.status === 'RENEWAL_DUE' || sub.status === 'EXPIRED';

                      return (
                        <tr
                          key={sub.id}
                          className={`border-b border-[#E5DDD2]/60 hover:bg-[#EFE9DF]/60 transition-colors ${
                            idx === filteredSubscriptions.length - 1 ? 'border-b-0' : ''
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1F313D] text-white font-serif font-bold text-xs flex items-center justify-center shrink-0">
                                {sub.organization_name?.charAt(0).toUpperCase() || 'R'}
                              </div>
                              <div>
                                <span className="font-bold text-[#1F313D] block">{sub.organization_name}</span>
                                <span className="text-[10px] text-[#7A7268]">ID: {sub.organization_id.substring(0, 8)}...</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${tierPillColors[sub.plan_key]}`}>
                              {sub.plan_key}
                            </span>
                          </td>

                          <td className="px-4 py-4 capitalize text-[#5C5549] font-medium">
                            {sub.is_trial ? (
                              <span className="text-purple-700 font-bold">14-Day Free Trial</span>
                            ) : (
                              <span>{sub.billing_interval} (${sub.amount})</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}>
                              {sub.status === 'ACTIVE' && <CheckCircle className="w-3 h-3" />}
                              {sub.status === 'TRIAL' && <Gift className="w-3 h-3" />}
                              {sub.status === 'RENEWAL_DUE' && <Clock className="w-3 h-3" />}
                              {sub.status === 'EXPIRED' && <AlertTriangle className="w-3 h-3" />}
                              {sub.status === 'CANCELLED' && <XCircle className="w-3 h-3" />}
                              {badge.label}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-[#7A7268] font-mono">
                            {new Date(sub.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>

                          <td className="px-4 py-4">
                            <div className="text-[#1F313D] font-mono font-medium">
                              {new Date(sub.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                sub.days_left !== undefined && sub.days_left <= 3
                                  ? 'text-rose-600'
                                  : sub.days_left !== undefined && sub.days_left <= 7
                                  ? 'text-amber-600'
                                  : 'text-[#7A7268]'
                              }`}
                            >
                              {sub.days_left !== undefined
                                ? sub.days_left < 0
                                  ? `${Math.abs(sub.days_left)} days overdue`
                                  : `${sub.days_left} days remaining`
                                : ''}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Renewal Reminder button */}
                              {isDueOrExpired && (
                                <button
                                  onClick={() => handleSendReminder(sub)}
                                  title="Send renewal reminder to restaurant owner"
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition shadow-2xs ${
                                    sub.renewal_reminder_sent
                                      ? 'bg-[#EAE4D9] text-[#7A7268] cursor-default'
                                      : 'bg-[#82401D] text-white hover:bg-[#673536]'
                                  }`}
                                >
                                  <Send className="w-3 h-3" />
                                  {sub.renewal_reminder_sent ? 'Reminder Sent' : 'Send Alert'}
                                </button>
                              )}

                              {/* Renew Plan button */}
                              <button
                                onClick={() => {
                                  setRenewModalSub(sub);
                                  setRenewInterval(sub.billing_interval);
                                }}
                                title="Renew / extend subscription"
                                className="px-2.5 py-1 rounded-full bg-[#1F313D] hover:bg-[#383854] text-white text-[10px] font-bold shadow-2xs transition"
                              >
                                Renew
                              </button>

                              {/* Cancel button */}
                              {sub.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => {
                                    setCancelModalSub(sub);
                                    setCancelReason('');
                                  }}
                                  title="Cancel subscription"
                                  className="p-1 rounded-full text-rose-500 hover:bg-rose-50 transition"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 2: PLAN MASTER CATALOG
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1F313D]">Configured Subscription Plans</h3>
              <p className="text-xs text-[#7A7268]">Define pricing tiers, billing intervals, branch limits and feature sets.</p>
            </div>

            <button
              onClick={handleOpenCreatePlan}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F313D] text-white text-xs font-bold hover:bg-[#383854] transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create New Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isEnterprise = plan.key === 'ENTERPRISE';
              return (
                <div
                  key={plan.id}
                  className={`rounded-[28px] p-6 border transition-all flex flex-col justify-between ${
                    isEnterprise
                      ? 'bg-[#1F313D] text-white border-[#1F313D] shadow-md'
                      : 'bg-[#FAF7F2] text-[#1F313D] border-[#E5DDD2] shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tierPillColors[plan.key]}`}>
                        {plan.key}
                      </span>

                      <button
                        onClick={() => handleOpenEditPlan(plan)}
                        className={`p-1.5 rounded-full transition ${isEnterprise ? 'hover:bg-white/10 text-white' : 'hover:bg-[#EAE4D9] text-[#5C5549]'}`}
                        title="Edit Plan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className={`font-serif font-bold text-xl ${isEnterprise ? 'text-white' : 'text-[#1F313D]'}`}>
                      {plan.name}
                    </h4>
                    <p className={`text-xs mt-1 ${isEnterprise ? 'text-[#E5C9B3]/80' : 'text-[#7A7268]'}`}>
                      {plan.description}
                    </p>

                    {/* Pricing */}
                    <div className="my-5 pb-4 border-b border-black/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold font-serif">${plan.price_monthly}</span>
                        <span className={`text-xs ${isEnterprise ? 'text-[#E5C9B3]' : 'text-[#7A7268]'}`}>/ month</span>
                      </div>
                      <div className={`text-[11px] mt-1 space-x-2 font-mono ${isEnterprise ? 'text-[#E5C9B3]/90' : 'text-[#5C5549]'}`}>
                        <span>Quarterly: <strong>${plan.price_quarterly}</strong></span>
                        <span>·</span>
                        <span>Yearly: <strong>${plan.price_yearly}</strong></span>
                      </div>
                    </div>

                    {/* Limits */}
                    <div className="space-y-1.5 mb-5 text-xs">
                      <div className="flex justify-between">
                        <span className={isEnterprise ? 'text-white/70' : 'text-[#7A7268]'}>Max Branches:</span>
                        <strong className="font-mono">{plan.max_branches >= 999 ? 'Unlimited' : plan.max_branches}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className={isEnterprise ? 'text-white/70' : 'text-[#7A7268]'}>Max Staff Users:</span>
                        <strong className="font-mono">{plan.max_users >= 999 ? 'Unlimited' : plan.max_users}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className={isEnterprise ? 'text-white/70' : 'text-[#7A7268]'}>Max Monthly Orders:</span>
                        <strong className="font-mono">{plan.max_orders_per_month >= 99999 ? 'Unlimited' : plan.max_orders_per_month.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className={isEnterprise ? 'text-white/70' : 'text-[#7A7268]'}>Customer Profiles:</span>
                        <strong className="font-mono">{plan.max_customers >= 99999 ? 'Unlimited' : plan.max_customers.toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="space-y-2 pt-2 border-t border-black/10">
                      <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${isEnterprise ? 'text-[#E5C9B3]' : 'text-[#82401D]'}`}>
                        Included Features
                      </span>
                      {plan.features?.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Check className={`w-3.5 h-3.5 shrink-0 ${isEnterprise ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span className={isEnterprise ? 'text-white/90' : 'text-[#1F313D]'}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between">
                    <span className={`text-[10px] font-bold ${plan.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      ● {plan.is_active ? 'Active Plan' : 'Archived'}
                    </span>
                    <button
                      onClick={() => handleOpenEditPlan(plan)}
                      className={`text-xs font-bold hover:underline ${isEnterprise ? 'text-[#E5C9B3]' : 'text-[#82401D]'}`}
                    >
                      Configure Limits →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 3: PAYMENT HISTORY
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1F313D]">Billing &amp; Payment Ledger</h3>
              <p className="text-xs text-[#7A7268]">Track invoices, subscription receipts, transaction references &amp; payout status.</p>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[24px] p-12 text-center text-[#7A7268]">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#82401D]" />
              <p className="font-serif font-bold text-base text-[#1F313D]">No payment records yet</p>
              <p className="text-xs mt-1">Payments automatically generate when plans are assigned or renewed.</p>
            </div>
          ) : (
            <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[24px] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E5DDD2] bg-[#EFE9DF]">
                      <th className="text-left px-5 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Invoice / Receipt</th>
                      <th className="text-left px-4 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Restaurant</th>
                      <th className="text-left px-4 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Plan &amp; Interval</th>
                      <th className="text-left px-4 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Payment Method</th>
                      <th className="text-left px-4 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Status</th>
                      <th className="text-right px-5 py-3.5 font-bold text-[#5C5549] uppercase tracking-wider">Paid At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`border-b border-[#E5DDD2]/60 hover:bg-[#EFE9DF]/60 transition-colors ${
                          idx === payments.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-5 py-4 font-mono font-bold text-[#82401D]">
                          {p.invoice_number || 'INV-' + p.id.substring(0, 6)}
                        </td>
                        <td className="px-4 py-4 font-bold text-[#1F313D]">
                          {p.organization_name}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${tierPillColors[p.plan_key]}`}>
                            {p.plan_key} · {p.billing_interval}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-bold font-mono text-base text-[#1F313D]">
                          ${Number(p.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-[#5C5549]">
                          <span className="bg-[#EFE9DF] border border-[#DDD5C7] px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'REFUNDED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-[#7A7268] font-mono">
                          {new Date(p.paid_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: ASSIGN PLAN TO RESTAURANT
      ════════════════════════════════════════════════════════════════════════ */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] rounded-[32px] shadow-2xl max-w-lg w-full p-6 lg:p-8 border border-[#DDD5C7] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1F313D]">Assign Restaurant Subscription</h3>
                <p className="text-xs text-[#7A7268] mt-0.5">Activate a paid plan or start a 14-day free trial.</p>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#EFE9DF] border border-[#DDD5C7] flex items-center justify-center text-[#5C5549] hover:text-[#1F313D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Select Restaurant */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                  Restaurant Organization *
                </label>
                <select
                  value={assignForm.organizationId}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, organizationId: e.target.value }))}
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D] focus:outline-none"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.owner_name || 'No Owner Listed'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Free Trial Toggle */}
              <div className="bg-[#EFE9DF] p-3 rounded-2xl border border-[#DDD5C7] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1F313D] block">14-Day Free Trial</span>
                  <span className="text-[10px] text-[#7A7268]">Provides full access with no payment charged today.</span>
                </div>
                <input
                  type="checkbox"
                  checked={assignForm.isTrial}
                  onChange={(e) => handlePlanKeyOrIntervalChange(assignForm.planKey, assignForm.billingInterval, e.target.checked)}
                  className="w-4 h-4 accent-[#82401D] cursor-pointer"
                />
              </div>

              {/* Plan Tier */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                  Subscription Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['FREE', 'BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE'] as SubscriptionTier[]).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => handlePlanKeyOrIntervalChange(tier, assignForm.billingInterval, assignForm.isTrial)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition ${
                        assignForm.planKey === tier
                          ? 'bg-[#1F313D] text-white border-[#1F313D]'
                          : 'bg-[#FAF7F2] text-[#1F313D] border-[#DDD5C7] hover:bg-[#EFE9DF]'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Billing Interval (if not trial) */}
              {!assignForm.isTrial && (
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                    Billing Interval
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['monthly', 'quarterly', 'yearly'] as BillingInterval[]).map((intv) => (
                      <button
                        key={intv}
                        type="button"
                        onClick={() => handlePlanKeyOrIntervalChange(assignForm.planKey, intv, false)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold capitalize transition ${
                          assignForm.billingInterval === intv
                            ? 'bg-[#82401D] text-white border-[#82401D]'
                            : 'bg-[#FAF7F2] text-[#1F313D] border-[#DDD5C7] hover:bg-[#EFE9DF]'
                        }`}
                      >
                        {intv}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Preview & Payment Method */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                    Amount Due ($)
                  </label>
                  <input
                    type="number"
                    value={assignForm.amount}
                    onChange={(e) => setAssignForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    disabled={assignForm.isTrial}
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#1F313D] focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={assignForm.paymentMethod}
                    onChange={(e) => setAssignForm((prev) => ({ ...prev, paymentMethod: e.target.value as any }))}
                    disabled={assignForm.isTrial}
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D] focus:outline-none disabled:opacity-50"
                  >
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="UPI">UPI / Instant Pay</option>
                    <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                    <option value="CASH">Counter Cash</option>
                    <option value="ONLINE">Stripe / Online</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DDD5C7] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[#DDD5C7] text-xs font-semibold text-[#5C5549] hover:bg-[#EFE9DF]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitAssign}
                className="px-5 py-2 rounded-full bg-[#1F313D] hover:bg-[#383854] text-white text-xs font-bold transition shadow-xs"
              >
                Confirm &amp; Assign Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: EDIT / CREATE SUBSCRIPTION PLAN
      ════════════════════════════════════════════════════════════════════════ */}
      {editPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] rounded-[32px] shadow-2xl max-w-xl w-full p-6 lg:p-8 border border-[#DDD5C7] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1F313D]">
                  {editingPlanId ? `Edit Plan: ${planForm.name}` : 'Configure New Subscription Plan'}
                </h3>
                <p className="text-xs text-[#7A7268] mt-0.5">Customize billing rates, limits and available modules.</p>
              </div>
              <button
                onClick={() => setEditPlanModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#EFE9DF] border border-[#DDD5C7] flex items-center justify-center text-[#5C5549] hover:text-[#1F313D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                    Plan Key
                  </label>
                  <select
                    value={planForm.key}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, key: e.target.value as any }))}
                    disabled={!!editingPlanId}
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D]"
                  >
                    <option value="FREE">FREE</option>
                    <option value="BASIC">BASIC</option>
                    <option value="STANDARD">STANDARD</option>
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Standard Growth"
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                  Description
                </label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D]"
                />
              </div>

              {/* Pricing Grid */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#82401D] font-bold block mb-1">
                  Pricing By Billing Interval ($)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-[#7A7268] block">Monthly</span>
                    <input
                      type="number"
                      value={planForm.price_monthly}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, price_monthly: Number(e.target.value) }))}
                      className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A7268] block">Quarterly</span>
                    <input
                      type="number"
                      value={planForm.price_quarterly}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, price_quarterly: Number(e.target.value) }))}
                      className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A7268] block">Yearly</span>
                    <input
                      type="number"
                      value={planForm.price_yearly}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, price_yearly: Number(e.target.value) }))}
                      className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Limits */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#82401D] font-bold block mb-1">
                  Configure Resource &amp; Feature Limits
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-[#7A7268] block">Max Branches</span>
                    <input
                      type="number"
                      value={planForm.max_branches}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, max_branches: Number(e.target.value) }))}
                      className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A7268] block">Max Staff Users</span>
                    <input
                      type="number"
                      value={planForm.max_users}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, max_users: Number(e.target.value) }))}
                      className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A7268] block">Max Orders / Month</span>
                    <input
                      type="number"
                      value={planForm.max_orders_per_month}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, max_orders_per_month: Number(e.target.value) }))}
                      className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A7268] block">Max Customers Profiles</span>
                    <input
                      type="number"
                      value={planForm.max_customers}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, max_customers: Number(e.target.value) }))}
                      className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Feature List Builder */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                  Bullet Feature Highlights
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="e.g. 24/7 Phone SLA Support"
                    className="flex-1 bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-1.5 bg-[#82401D] text-white text-xs font-bold rounded-xl"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {planForm.features?.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFE9DF] border border-[#DDD5C7] text-[11px] text-[#1F313D]"
                    >
                      {f}
                      <button type="button" onClick={() => handleRemoveFeature(i)} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DDD5C7] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditPlanModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[#DDD5C7] text-xs font-semibold text-[#5C5549] hover:bg-[#EFE9DF]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSavePlan}
                className="px-5 py-2 rounded-full bg-[#1F313D] hover:bg-[#383854] text-white text-xs font-bold transition shadow-xs"
              >
                Save Plan Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: RENEW SUBSCRIPTION
      ════════════════════════════════════════════════════════════════════════ */}
      {renewModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] rounded-[32px] shadow-2xl max-w-md w-full p-6 border border-[#DDD5C7] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-serif text-xl font-bold text-[#1F313D] mb-1">
              Renew Subscription
            </h3>
            <p className="text-xs text-[#7A7268] mb-4">
              Extend plan for <strong>{renewModalSub.organization_name}</strong> ({renewModalSub.plan_key}).
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                  Extension Interval
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['monthly', 'quarterly', 'yearly'] as BillingInterval[]).map((intv) => (
                    <button
                      key={intv}
                      type="button"
                      onClick={() => setRenewInterval(intv)}
                      className={`py-2 rounded-xl border text-xs font-bold capitalize transition ${
                        renewInterval === intv ? 'bg-[#1F313D] text-white' : 'bg-[#FAF7F2] text-[#1F313D] border-[#DDD5C7]'
                      }`}
                    >
                      {intv}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                  Payment Method
                </label>
                <select
                  value={renewPaymentMethod}
                  onChange={(e) => setRenewPaymentMethod(e.target.value as any)}
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F313D]"
                >
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI">UPI / Instant Pay</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  <option value="CASH">Counter Cash</option>
                  <option value="ONLINE">Stripe / Online</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DDD5C7]">
              <button
                type="button"
                onClick={() => setRenewModalSub(null)}
                className="px-4 py-2 rounded-full border border-[#DDD5C7] text-xs font-semibold text-[#5C5549]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRenew}
                className="px-5 py-2 rounded-full bg-[#82401D] text-white text-xs font-bold shadow-xs hover:bg-[#673536]"
              >
                Confirm Renewal &amp; Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: CANCEL SUBSCRIPTION
      ════════════════════════════════════════════════════════════════════════ */}
      {cancelModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] rounded-[32px] shadow-2xl max-w-md w-full p-6 border border-[#DDD5C7] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-serif text-xl font-bold text-rose-700 mb-1">
              Cancel Subscription?
            </h3>
            <p className="text-xs text-[#7A7268] mb-4">
              Organization: <strong>{cancelModalSub.organization_name}</strong>. Their active modules will be suspended on expiry.
            </p>

            <div className="mb-4">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
                Reason for Cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Closing branch location or switched providers"
                rows={3}
                className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs text-[#1F313D] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DDD5C7]">
              <button
                type="button"
                onClick={() => setCancelModalSub(null)}
                className="px-4 py-2 rounded-full border border-[#DDD5C7] text-xs font-semibold text-[#5C5549]"
              >
                Abort
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
