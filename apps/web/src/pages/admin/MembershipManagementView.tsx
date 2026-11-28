import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown, Search, Filter, Plus, Download, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, ShieldCheck, ChevronRight, History, Bell,
  Sparkles, DollarSign, Users, Gift, TrendingUp, Settings, ArrowUpRight,
  X, Check, Lock, RotateCcw, Ban, Calendar, CreditCard, Award, QrCode
} from 'lucide-react';
import {
  MembershipPlan, CustomerMembership, MembershipRenewalRecord,
  MembershipNotification, MembershipMetrics, MembershipTier,
  loadMembershipPlans, saveMembershipPlan, loadCustomerMemberships,
  saveCustomerMemberships, loadMembershipRenewals, loadMembershipNotifications,
  assignMembershipToCustomer, renewMembership, cancelMembership,
  updateMembershipStatuses, checkAndNotifyMembershipRenewals,
  getMembershipMetrics, exportMembershipsCSV
} from '../../lib/membershipManagementApi';
import { fetchCustomers, CustomerProfile } from '../../lib/customerManagementApi';

interface MembershipManagementViewProps {
  orgId?: string;
  userRole?: string; // 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STAFF'
}

const TIER_THEMES: Record<MembershipTier, { bg: string; text: string; border: string; gradient: string }> = {
  Silver: {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    gradient: 'from-slate-700 to-slate-900'
  },
  Gold: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    gradient: 'from-amber-600 to-yellow-800'
  },
  Platinum: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    gradient: 'from-slate-900 via-purple-950 to-slate-900'
  },
  VIP: {
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-300',
    gradient: 'from-rose-900 via-rose-950 to-slate-950'
  }
};

export const MembershipManagementView: React.FC<MembershipManagementViewProps> = ({
  orgId,
  userRole = 'RESTAURANT_ADMIN'
}) => {
  const isStaff = userRole.toUpperCase() === 'STAFF';
  const isAdmin = userRole.toUpperCase() === 'RESTAURANT_ADMIN' || userRole.toUpperCase() === 'SUPER_ADMIN' || userRole.toUpperCase() === 'ADMIN';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'roster' | 'plans' | 'renewals' | 'notifications' | 'reports'>('roster');

  // Core Data
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<CustomerMembership[]>([]);
  const [renewals, setRenewals] = useState<MembershipRenewalRecord[]>([]);
  const [notifications, setNotifications] = useState<MembershipNotification[]>([]);
  const [metrics, setMetrics] = useState<MembershipMetrics | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Selected Entities
  const [selectedMembership, setSelectedMembership] = useState<CustomerMembership | null>(null);
  const [editingPlan, setEditingPlan] = useState<Partial<MembershipPlan> | null>(null);

  // Enrollment Form State
  const [enrollCustomerId, setEnrollCustomerId] = useState('');
  const [enrollPlanId, setEnrollPlanId] = useState('');
  const [enrollPaymentMethod, setEnrollPaymentMethod] = useState('UPI');
  const [enrollNotes, setEnrollNotes] = useState('');
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Renewal Form State
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('UPI');

  // Cancel Form State
  const [cancelReason, setCancelReason] = useState('');

  // Load and refresh
  const refreshData = () => {
    updateMembershipStatuses(); // Auto-expire past-due
    setPlans(loadMembershipPlans());
    setMemberships(loadCustomerMemberships());
    setRenewals(loadMembershipRenewals());
    setNotifications(loadMembershipNotifications());
    setMetrics(getMembershipMetrics());
    fetchCustomers().then(custs => setCustomers(custs)).catch(() => {});
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filtered Roster
  const filteredMemberships = useMemo(() => {
    return memberships.filter(m => {
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      const matchTier = tierFilter === 'ALL' || m.tier === tierFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        m.customerName.toLowerCase().includes(q) ||
        m.customerPhone.includes(q) ||
        m.membershipNumber.toLowerCase().includes(q) ||
        m.planName.toLowerCase().includes(q);
      return matchStatus && matchTier && matchSearch;
    });
  }, [memberships, statusFilter, tierFilter, searchQuery]);

  // Handle Enrollment (FR-MEM-004)
  const handleEnrollCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError(null);
    const cust = customers.find(c => c.id === enrollCustomerId);
    const plan = plans.find(p => p.id === enrollPlanId);

    if (!cust || !plan) {
      setEnrollError('Please select both a valid customer and a membership plan.');
      return;
    }

    const res = assignMembershipToCustomer({
      customerId: cust.id,
      customerName: cust.fullName,
      customerPhone: cust.mobile,
      customerEmail: cust.email,
      planId: plan.id,
      pricePaid: plan.price,
      paymentMethod: enrollPaymentMethod,
      assignedBy: `${userRole} User`,
      notes: enrollNotes
    });

    if (res.success) {
      refreshData();
      setIsEnrollModalOpen(false);
      setEnrollCustomerId('');
      setEnrollPlanId('');
      setEnrollNotes('');
      alert(res.message);
    } else {
      setEnrollError(res.message);
    }
  };

  // Handle Plan Save (FR-MEM-001, FR-MEM-002, FR-MEM-003, FR-MEM-005, FR-MEM-006)
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    saveMembershipPlan(editingPlan);
    refreshData();
    setIsPlanModalOpen(false);
    setEditingPlan(null);
  };

  // Handle Membership Renewal (FR-MEM-008)
  const handleConfirmRenew = () => {
    if (!selectedMembership) return;
    const plan = plans.find(p => p.id === selectedMembership.planId);
    const price = plan ? plan.price : selectedMembership.pricePaid;

    const res = renewMembership({
      membershipId: selectedMembership.id,
      priceCharged: price,
      paymentMethod: renewPaymentMethod,
      renewedBy: `${userRole} User`
    });

    if (res.success) {
      refreshData();
      setIsRenewModalOpen(false);
      setSelectedMembership(null);
      alert(res.message);
    }
  };

  // Handle Membership Cancellation (FR-MEM-009)
  const handleConfirmCancel = () => {
    if (!selectedMembership) return;
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason.');
      return;
    }

    const res = cancelMembership({
      membershipId: selectedMembership.id,
      cancelledBy: `${userRole} User`,
      reason: cancelReason
    });

    if (res.success) {
      refreshData();
      setIsCancelModalOpen(false);
      setSelectedMembership(null);
      setCancelReason('');
      alert(res.message);
    }
  };

  // Broadcast 30-day and 7-day renewal reminders (FR-MEM-010)
  const handleTriggerRenewalReminders = () => {
    const count = checkAndNotifyMembershipRenewals();
    refreshData();
    alert(`Renewal alert check complete: Sent ${count} automated WhatsApp/SMS renewal reminders to expiring members.`);
  };

  // Export CSV (FR-MEM-012)
  const handleExportCSV = () => {
    const csvContent = exportMembershipsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `memberships_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#EFE9DF] text-[#82401D]">
              <Crown className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#1F313D] tracking-tight">
              Membership Management
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Silver · Gold · Platinum Clubs
            </span>
          </div>
          <p className="text-xs text-[#7A7268] mt-1">
            Tiered subscription plans, exclusive dining discounts, automated renewal reminders, and member benefit tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => {
                setEnrollError(null);
                setEnrollCustomerId(customers[0]?.id || '');
                setEnrollPlanId(plans[0]?.id || '');
                setIsEnrollModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Member</span>
            </button>
          )}

          <button
            onClick={handleTriggerRenewalReminders}
            title="Scan members expiring in 30, 7, and 1 day and dispatch reminders"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E4DCCE] text-[#1F313D] text-xs font-bold transition border border-[#DDD5C7]"
          >
            <Bell className="w-3.5 h-3.5 text-[#82401D]" />
            <span>Send Reminders</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E4DCCE] text-[#1F313D] text-xs font-bold transition border border-[#DDD5C7]"
          >
            <Download className="w-3.5 h-3.5 text-[#79415A]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={refreshData}
            className="p-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E4DCCE] text-[#5C5549] transition border border-[#DDD5C7]"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 6 KPI HERO CARDS ── */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <span className="text-[11px] text-[#7A7268] font-medium block">Total Members</span>
            <div className="text-2xl font-black text-[#1F313D] mt-1">{metrics.totalMemberships}</div>
            <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">{metrics.activeMemberships} active</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <span className="text-[11px] text-[#7A7268] font-medium block">Active Memberships</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.activeMemberships}</div>
            <span className="text-[10px] text-[#7A7268] mt-0.5 block">Valid & enjoying perks</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <span className="text-[11px] text-[#7A7268] font-medium block">Expired</span>
            <div className="text-2xl font-black text-amber-700 mt-1">{metrics.expiredMemberships}</div>
            <span className="text-[10px] text-amber-700 font-bold mt-0.5 block">Ready for renewal</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <span className="text-[11px] text-[#7A7268] font-medium block">Cancelled</span>
            <div className="text-2xl font-black text-rose-700 mt-1">{metrics.cancelledMemberships}</div>
            <span className="text-[10px] text-[#7A7268] mt-0.5 block">Terminated plans</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <span className="text-[11px] text-[#7A7268] font-medium block">Plan Revenue</span>
            <div className="text-2xl font-black text-[#79415A] mt-1">₹{metrics.totalMembershipRevenue.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">Subscriptions & renewals</span>
          </div>

          <div className="bg-[#1F313D] text-white p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] text-[#E5C9B3] font-medium block">Renewal Rate</span>
            <div className="text-2xl font-black text-[#E5C9B3] mt-1">{metrics.renewalRate}%</div>
            <span className="text-[9px] text-[#E5C9B3]/80 mt-0.5 block">Member retention index</span>
          </div>
        </div>
      )}

      {/* ── TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 border-b border-[#DDD5C7] pb-2 overflow-x-auto">
        {[
          { id: 'roster', label: 'Members Roster', count: memberships.length },
          { id: 'plans', label: 'Membership Plans', count: plans.length },
          { id: 'renewals', label: 'Renewal History', count: renewals.length },
          { id: 'notifications', label: 'Reminder Logs', count: notifications.length },
          { id: 'reports', label: 'Revenue & Analytics' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#79415A] text-white shadow-xs'
                : 'text-[#5C5549] hover:bg-[#EFE9DF]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#DDD5C7] text-[#1F313D]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: MEMBERS ROSTER (FR-MEM-004, FR-MEM-007) ── */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2]">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member, phone, card #..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold text-[#1F313D]"
              >
                <option value="ALL">All Tiers</option>
                <option value="Silver">Silver Club</option>
                <option value="Gold">Gold Club</option>
                <option value="Platinum">Platinum VIP</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold text-[#1F313D]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] uppercase font-mono tracking-wider border-b border-[#DDD5C7]">
                  <tr>
                    <th className="p-3.5">Member #</th>
                    <th className="p-3.5">Customer Name & Contact</th>
                    <th className="p-3.5">Plan & Tier</th>
                    <th className="p-3.5 text-center">Discount</th>
                    <th className="p-3.5 text-center">Loyalty Bonus</th>
                    <th className="p-3.5">Validity Dates</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD5C7]/70">
                  {filteredMemberships.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#7A7268]">
                        No member records match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMemberships.map(m => {
                      const theme = TIER_THEMES[m.tier] || TIER_THEMES.Silver;
                      const isExpired = m.status === 'Expired' || new Date(m.expiryDate) < new Date();
                      return (
                        <tr key={m.id} className="hover:bg-[#EFE9DF]/50 transition">
                          <td className="p-3.5 font-mono font-bold text-[#79415A]">
                            {m.membershipNumber}
                          </td>
                          <td className="p-3.5">
                            <strong className="text-[#1F313D] block">{m.customerName}</strong>
                            <span className="text-[11px] text-[#7A7268]">{m.customerPhone}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-[#1F313D] block">{m.planName}</span>
                            <span className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
                              {m.tier} Tier
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-emerald-700">
                            {m.discountPercentage}% OFF
                          </td>
                          <td className="p-3.5 text-center font-bold text-[#82401D]">
                            {m.loyaltyMultiplier}x pts
                          </td>
                          <td className="p-3.5 text-[11px]">
                            <div className="text-[#5C5549]">From: {new Date(m.startDate).toLocaleDateString()}</div>
                            <div className={`font-semibold ${isExpired ? 'text-rose-700' : 'text-[#1F313D]'}`}>
                              To: {new Date(m.expiryDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                              m.status === 'Expired' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedMembership(m);
                                  setIsCardModalOpen(true);
                                }}
                                title="View Digital Membership Card"
                                className="p-1.5 rounded-xl bg-[#EFE9DF] hover:bg-[#DDD5C7] text-[#1F313D] text-[11px] font-bold transition"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>

                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedMembership(m);
                                      setIsRenewModalOpen(true);
                                    }}
                                    title="Renew Membership"
                                    className="px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Renew</span>
                                  </button>

                                  {m.status === 'Active' && (
                                    <button
                                      onClick={() => {
                                        setSelectedMembership(m);
                                        setCancelReason('');
                                        setIsCancelModalOpen(true);
                                      }}
                                      title="Cancel Membership"
                                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MEMBERSHIP PLANS CATALOG (FR-MEM-001, FR-MEM-002, FR-MEM-005, FR-MEM-006) ── */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2]">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">Available Membership Plans</h3>
              <p className="text-xs text-[#7A7268]">Configure subscription tiers, discount allowances, loyalty multipliers, and dining benefits.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingPlan({
                    name: '',
                    tier: 'Gold',
                    code: 'MEM-NEW',
                    description: '',
                    price: 1499,
                    validityValue: 12,
                    validityUnit: 'Months',
                    discountPercentage: 15,
                    loyaltyMultiplier: 1.5,
                    benefits: ['15% off food bills', '1.5x points multiplier'],
                    status: 'Active'
                  });
                  setIsPlanModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Plan</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map(p => {
              const theme = TIER_THEMES[p.tier] || TIER_THEMES.Silver;
              return (
                <div
                  key={p.id}
                  className="bg-[#FAF7F2] rounded-[28px] border border-[#E5DDD2] p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
                        {p.tier} Tier
                      </span>
                      <span className="font-mono text-xs text-[#7A7268]">{p.code}</span>
                    </div>

                    <div>
                      <h4 className="font-serif text-xl font-bold text-[#1F313D]">{p.name}</h4>
                      <p className="text-xs text-[#7A7268] mt-1 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-black text-[#1F313D] font-mono">₹{p.price}</span>
                        <span className="text-xs text-[#7A7268] font-medium ml-1">/ {p.validityValue} {p.validityUnit}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-white/70 px-2.5 py-1 rounded-xl">
                        {p.discountPercentage}% OFF Bills
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#DDD5C7]">
                      <span className="text-[11px] font-bold text-[#1F313D] block">Exclusive Privileges:</span>
                      <ul className="space-y-1.5 text-xs text-[#5C5549]">
                        {p.benefits.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-5 border-t border-[#DDD5C7] mt-5 flex justify-end">
                      <button
                        onClick={() => {
                          setEditingPlan(p);
                          setIsPlanModalOpen(true);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-[#EFE9DF] hover:bg-[#79415A] hover:text-white text-[#79415A] text-xs font-bold transition border border-[#DDD5C7]"
                      >
                        Edit Plan Rules
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: RENEWALS HISTORY (FR-MEM-008) ── */}
      {activeTab === 'renewals' && (
        <div className="space-y-4">
          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#1F313D] mb-1">Membership Renewal Ledger</h3>
            <p className="text-xs text-[#7A7268] mb-4">Complete audit of extended memberships, renewal fees collected, and payment vouchers.</p>

            <div className="overflow-x-auto rounded-2xl border border-[#DDD5C7]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] uppercase font-mono tracking-wider border-b border-[#DDD5C7]">
                  <tr>
                    <th className="p-3.5">Renewal ID</th>
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Extension Period</th>
                    <th className="p-3.5">Previous Expiry</th>
                    <th className="p-3.5">New Extended Expiry</th>
                    <th className="p-3.5 text-right">Fee Paid</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Processed By</th>
                    <th className="p-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD5C7]/70">
                  {renewals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#7A7268]">
                        No renewal transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    renewals.map(r => (
                      <tr key={r.id} className="hover:bg-[#EFE9DF]/50 transition">
                        <td className="p-3.5 font-mono font-bold text-[#79415A]">{r.id}</td>
                        <td className="p-3.5 font-bold text-[#1F313D]">{r.customerName}</td>
                        <td className="p-3.5 font-medium text-[#5C5549]">{r.renewedPeriod}</td>
                        <td className="p-3.5 text-[#7A7268]">{new Date(r.previousExpiryDate).toLocaleDateString()}</td>
                        <td className="p-3.5 font-bold text-emerald-700">{new Date(r.newExpiryDate).toLocaleDateString()}</td>
                        <td className="p-3.5 text-right font-mono font-black text-[#1F313D]">₹{r.priceCharged}</td>
                        <td className="p-3.5 font-medium">{r.paymentMethod}</td>
                        <td className="p-3.5 text-[#5C5549]">{r.renewedBy}</td>
                        <td className="p-3.5 text-[#7A7268]">{new Date(r.renewedAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: REMINDER NOTIFICATIONS (FR-MEM-010) ── */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#1F313D] mb-1">Membership Reminder Broadcasts</h3>
            <p className="text-xs text-[#7A7268] mb-4">Scheduled WhatsApp/SMS alerts for renewals at 30 days, 7 days, and expiration.</p>

            <div className="overflow-x-auto rounded-2xl border border-[#DDD5C7]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] uppercase font-mono tracking-wider border-b border-[#DDD5C7]">
                  <tr>
                    <th className="p-3.5">Alert ID</th>
                    <th className="p-3.5">Customer Phone</th>
                    <th className="p-3.5">Notification Type</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Message Content</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD5C7]/70">
                  {notifications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#7A7268]">
                        No reminders logged yet.
                      </td>
                    </tr>
                  ) : (
                    notifications.map(n => (
                      <tr key={n.id} className="hover:bg-[#EFE9DF]/50 transition">
                        <td className="p-3.5 font-mono font-bold text-[#79415A]">{n.id}</td>
                        <td className="p-3.5 font-mono text-[11px] text-[#1F313D]">{n.customerPhone}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {n.type}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-[11px] text-[#5C5549]">{n.channel}</td>
                        <td className="p-3.5 text-[11px] text-[#1F313D] max-w-md">{n.message}</td>
                        <td className="p-3.5">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        </td>
                        <td className="p-3.5 text-[11px] text-[#7A7268]">
                          {new Date(n.sentAt).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: REPORTS & ANALYTICS (FR-MEM-012) ── */}
      {activeTab === 'reports' && metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#1F313D]">Membership Revenue Breakdown</h3>
            <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-2">
              <span className="text-xs text-[#7A7268]">Total Collections:</span>
              <div className="text-3xl font-black text-[#79415A] font-mono">
                ₹{metrics.totalMembershipRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#5C5549] pt-1 border-t border-[#DDD5C7]">
                Across new plan enrollments and renewals for the current operating period.
              </p>
            </div>
          </div>

          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#1F313D]">Enrolled Tiers Distribution</h3>
            <div className="space-y-2 text-xs">
              {(['Silver', 'Gold', 'Platinum'] as MembershipTier[]).map(t => {
                const count = metrics.tierBreakdown[t] || 0;
                const pct = metrics.totalMemberships > 0 ? ((count / metrics.totalMemberships) * 100).toFixed(0) : '0';
                return (
                  <div key={t} className="p-3 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-center justify-between">
                    <span className="font-bold text-[#1F313D]">{t} Club</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-[#79415A]">{count} members</span>
                      <span className="text-[11px] font-mono text-[#7A7268]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ENROLL MEMBER (FR-MEM-004) ── */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[28px] max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">Enroll Customer in Membership</h3>
                <p className="text-xs text-[#7A7268]">Issue new membership card, privileges, and discount rights.</p>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1 rounded-full text-[#7A7268] hover:bg-[#EFE9DF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enrollError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {enrollError}
              </div>
            )}

            <form onSubmit={handleEnrollCustomer} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Select Customer</label>
                <select
                  required
                  value={enrollCustomerId}
                  onChange={e => setEnrollCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] focus:outline-none"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.mobile}) - {c.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Select Membership Plan</label>
                <select
                  required
                  value={enrollPlanId}
                  onChange={e => setEnrollPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] focus:outline-none"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{p.price} ({p.discountPercentage}% OFF, {p.validityValue} {p.validityUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Payment Method</label>
                  <select
                    value={enrollPaymentMethod}
                    onChange={e => setEnrollPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Complimentary">Complimentary / VIP Gift</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Enrolling Officer</label>
                  <input
                    type="text"
                    disabled
                    value={`${userRole} User`}
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#7A7268]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Enrollment Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. VIP diner, upgraded from Silver"
                  value={enrollNotes}
                  onChange={e => setEnrollNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDD5C7]">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white font-bold"
                >
                  Confirm & Activate Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT PLAN (FR-MEM-001, FR-MEM-002, FR-MEM-003, FR-MEM-005, FR-MEM-006) ── */}
      {isPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[28px] max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                  {editingPlan.id ? 'Edit Membership Plan' : 'Create New Membership Plan'}
                </h3>
                <p className="text-xs text-[#7A7268]">Configure pricing, discount percentage, and tier rights.</p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1 rounded-full text-[#7A7268] hover:bg-[#EFE9DF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name}
                    onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Tier</label>
                  <select
                    value={editingPlan.tier}
                    onChange={e => setEditingPlan({ ...editingPlan, tier: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold text-[#1F313D]"
                  >
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.price}
                    onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Validity</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.validityValue}
                    onChange={e => setEditingPlan({ ...editingPlan, validityValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Unit</label>
                  <select
                    value={editingPlan.validityUnit}
                    onChange={e => setEditingPlan({ ...editingPlan, validityUnit: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold"
                  >
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                    <option value="Days">Days</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Discount % on Bills</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.discountPercentage}
                    onChange={e => setEditingPlan({ ...editingPlan, discountPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Loyalty Points Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingPlan.loyaltyMultiplier}
                    onChange={e => setEditingPlan({ ...editingPlan, loyaltyMultiplier: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold text-[#82401D]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Plan Description</label>
                <textarea
                  rows={2}
                  value={editingPlan.description}
                  onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDD5C7]">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white font-bold"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RENEW MEMBERSHIP (FR-MEM-008) ── */}
      {isRenewModalOpen && selectedMembership && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">Renew Membership</h3>
                <p className="text-xs text-[#7A7268]">{selectedMembership.customerName} ({selectedMembership.membershipNumber})</p>
              </div>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="p-1 rounded-full text-[#7A7268] hover:bg-[#EFE9DF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#7A7268]">Current Plan:</span>
                <strong className="text-[#1F313D]">{selectedMembership.planName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7268]">Current Expiry:</span>
                <span className="font-mono font-bold text-amber-700">{new Date(selectedMembership.expiryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7268]">Renewal Fee:</span>
                <strong className="font-mono text-base text-[#79415A]">₹{selectedMembership.pricePaid}</strong>
              </div>
            </div>

            <div>
              <label className="font-bold text-[#1F313D] block mb-1">Renewal Payment Method</label>
              <select
                value={renewPaymentMethod}
                onChange={e => setRenewPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] font-semibold text-[#1F313D]"
              >
                <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash">Cash at Counter</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDD5C7]">
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRenew}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                Confirm Renewal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CANCEL MEMBERSHIP (FR-MEM-009) ── */}
      {isCancelModalOpen && selectedMembership && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-rose-800">Cancel Membership</h3>
                <p className="text-xs text-[#7A7268]">Card: {selectedMembership.membershipNumber}</p>
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1 rounded-full text-[#7A7268] hover:bg-[#EFE9DF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[#5C5549]">
              Are you sure you want to cancel the <strong>{selectedMembership.planName}</strong> for <strong>{selectedMembership.customerName}</strong>? Member discounts will be deactivated immediately.
            </p>

            <div>
              <label className="font-bold text-[#1F313D] block mb-1">
                Mandatory Cancellation Reason <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Relocation, customer requested refund, expired without renewal..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDD5C7]">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
              >
                Abort
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DIGITAL MEMBERSHIP PASS (FR-MEM-006, FR-MEM-011) ── */}
      {isCardModalOpen && selectedMembership && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[32px] max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7A7268] uppercase tracking-wider">Digital Pass</span>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="p-1 rounded-full text-[#7A7268] hover:bg-[#EFE9DF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Graphic Member Card */}
            {(() => {
              const theme = TIER_THEMES[selectedMembership.tier] || TIER_THEMES.Gold;
              return (
                <div className={`rounded-3xl p-6 text-white bg-gradient-to-br ${theme.gradient} shadow-xl relative overflow-hidden flex flex-col justify-between h-52`}>
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <img src="/logo.png" alt="Corner Cafe" className="w-7 h-7 object-contain" />
                      <span className="font-serif font-black tracking-wider text-xs">CORNER CAFE</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/20">
                      {selectedMembership.tier}
                    </span>
                  </div>

                  <div className="z-10">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-white/70 block">MEMBER NAME</span>
                    <h3 className="font-serif text-lg font-bold tracking-tight text-white">{selectedMembership.customerName}</h3>
                    <div className="text-[11px] font-mono tracking-widest text-amber-200 mt-0.5">
                      {selectedMembership.membershipNumber}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-white/80 z-10 pt-2 border-t border-white/20 font-mono">
                    <span>DISCOUNT: <strong>{selectedMembership.discountPercentage}%</strong></span>
                    <span>EXP: <strong>{new Date(selectedMembership.expiryDate).toLocaleDateString()}</strong></span>
                  </div>

                  {/* Aesthetic backdrop circle */}
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
                </div>
              );
            })()}

            <div className="p-3.5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#7A7268]">Card Status:</span>
                <span className="font-bold text-emerald-700">{selectedMembership.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7268]">Loyalty Multiplier:</span>
                <span className="font-bold text-[#82401D]">{selectedMembership.loyaltyMultiplier}x rewards</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7268]">Associated Phone:</span>
                <span className="font-mono">{selectedMembership.customerPhone}</span>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#79415A] text-white text-xs font-bold hover:bg-[#68334b] transition"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
