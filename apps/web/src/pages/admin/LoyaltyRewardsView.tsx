import React, { useState, useEffect, useMemo } from 'react';
import {
  Award, Search, Filter, Plus, Download, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, ShieldCheck, ChevronRight, History, Bell,
  Sparkles, DollarSign, Users, Gift, TrendingUp, Settings, ArrowUpRight,
  X, Check, Lock, Send, FileSpreadsheet
} from 'lucide-react';
import {
  LoyaltyProgram, CustomerLoyaltyAccount, LoyaltyTransaction,
  LoyaltyAuditLog, LoyaltyNotification, LoyaltyMetrics, LoyaltyTier,
  loadLoyaltyProgram, saveLoyaltyProgram, loadLoyaltyAccounts,
  loadLoyaltyTransactions, loadLoyaltyAuditLogs, loadLoyaltyNotifications,
  getLoyaltyMetrics, adjustLoyaltyPointsManual, checkAndNotifyExpiringPoints,
  exportLoyaltyTransactionsCSV
} from '../../lib/loyaltyRewardsApi';
import { fetchCustomers, CustomerProfile } from '../../lib/customerManagementApi';

interface LoyaltyRewardsViewProps {
  orgId?: string;
  userRole?: string; // 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STAFF'
}

const TIER_COLORS: Record<LoyaltyTier, { badge: string; text: string; border: string }> = {
  Bronze: { badge: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  Silver: { badge: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  Gold: { badge: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  Platinum: { badge: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' }
};

export const LoyaltyRewardsView: React.FC<LoyaltyRewardsViewProps> = ({ orgId, userRole = 'RESTAURANT_ADMIN' }) => {
  const isStaff = userRole.toUpperCase() === 'STAFF';
  const isAdmin = userRole.toUpperCase() === 'RESTAURANT_ADMIN' || userRole.toUpperCase() === 'SUPER_ADMIN' || userRole.toUpperCase() === 'ADMIN';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'accounts' | 'transactions' | 'program' | 'adjustments' | 'notifications' | 'reports'>('accounts');

  // Core Data State
  const [program, setProgram] = useState<LoyaltyProgram>(loadLoyaltyProgram());
  const [accounts, setAccounts] = useState<CustomerLoyaltyAccount[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<LoyaltyAuditLog[]>([]);
  const [notifications, setNotifications] = useState<LoyaltyNotification[]>([]);
  const [metrics, setMetrics] = useState<LoyaltyMetrics | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [txnTypeFilter, setTxnTypeFilter] = useState<string>('ALL');

  // Manual Adjustment Modal State (FR-LOY-011)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedAccountForAdjust, setSelectedAccountForAdjust] = useState<CustomerLoyaltyAccount | null>(null);
  const [adjustPointsDelta, setAdjustPointsDelta] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  // Program Edit State (FR-LOY-001, FR-LOY-004, FR-LOY-005)
  const [editingProgram, setEditingProgram] = useState<LoyaltyProgram>(loadLoyaltyProgram());
  const [saveProgramMessage, setSaveProgramMessage] = useState<string | null>(null);

  // Load all data
  const refreshData = () => {
    setProgram(loadLoyaltyProgram());
    setAccounts(loadLoyaltyAccounts());
    setTransactions(loadLoyaltyTransactions());
    setAuditLogs(loadLoyaltyAuditLogs());
    setNotifications(loadLoyaltyNotifications());
    setMetrics(getLoyaltyMetrics());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchTier = tierFilter === 'ALL' || acc.tier === tierFilter;
      const matchStatus = statusFilter === 'ALL' || acc.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        acc.customerName.toLowerCase().includes(q) ||
        acc.customerPhone.includes(q) ||
        acc.id.toLowerCase().includes(q);
      return matchTier && matchStatus && matchSearch;
    });
  }, [accounts, tierFilter, statusFilter, searchQuery]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchType = txnTypeFilter === 'ALL' || t.type === txnTypeFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        t.customerName.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.referenceId && t.referenceId.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [transactions, txnTypeFilter, searchQuery]);

  // Handle Manual Points Adjustment (FR-LOY-011)
  const handlePerformAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountForAdjust) return;
    setAdjustError(null);
    setAdjustSuccess(null);

    const res = adjustLoyaltyPointsManual({
      accountId: selectedAccountForAdjust.id,
      pointsDelta: Number(adjustPointsDelta),
      reason: adjustReason,
      performer: `Admin (${userRole})`,
      userRole
    });

    if (res.success) {
      setAdjustSuccess(res.message);
      refreshData();
      setTimeout(() => {
        setIsAdjustModalOpen(false);
        setSelectedAccountForAdjust(null);
        setAdjustReason('');
        setAdjustSuccess(null);
      }, 1500);
    } else {
      setAdjustError(res.message);
    }
  };

  // Handle Save Program Config (FR-LOY-001, FR-LOY-004, FR-LOY-005, FR-LOY-009)
  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    saveLoyaltyProgram(editingProgram);
    setProgram(editingProgram);
    setSaveProgramMessage('Loyalty Program rules & configuration successfully saved!');
    refreshData();
    setTimeout(() => setSaveProgramMessage(null), 3000);
  };

  // Trigger 30-Day Points Expiry Check (FR-LOY-013)
  const handleTriggerExpiryScan = () => {
    const count = checkAndNotifyExpiringPoints();
    refreshData();
    alert(`Scanned customer balances: Sent expiry reminder notifications to ${count} members with points expiring within 30 days.`);
  };

  // CSV Export (FR-LOY-014)
  const handleExportCSV = () => {
    const csvContent = exportLoyaltyTransactionsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `loyalty_transactions_${new Date().toISOString().split('T')[0]}.csv`);
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
            <span className="p-2 rounded-xl bg-[#EFE9DF] text-[#79415A]">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#1F313D] tracking-tight">
              Loyalty & Rewards Program
            </h1>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              program.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {program.status} Program
            </span>
          </div>
          <p className="text-xs text-[#7A7268] mt-1">
            Automated customer points accrual, configurable tier multipliers, point redemptions during billing, and balance notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleTriggerExpiryScan}
            title="Scan for points expiring within 30 days and send notifications"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E4DCCE] text-[#1F313D] text-xs font-bold transition border border-[#DDD5C7]"
          >
            <Clock className="w-3.5 h-3.5 text-[#82401D]" />
            <span>Check Expirations</span>
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
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 6 KPI HERO CARDS ── */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <span className="text-[11px] text-[#7A7268] font-medium block">Enrolled Members</span>
            <div className="text-2xl font-black text-[#1F313D] mt-1">{metrics.totalMembers}</div>
            <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">{metrics.activeMembers} active</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <span className="text-[11px] text-[#7A7268] font-medium block">Points Outstanding</span>
            <div className="text-2xl font-black text-[#79415A] mt-1">{metrics.outstandingBalance.toLocaleString()}</div>
            <span className="text-[10px] text-[#7A7268] font-mono mt-0.5 block">≈ ₹{metrics.outstandingValueLiability.toLocaleString()} liability</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <span className="text-[11px] text-[#7A7268] font-medium block">Lifetime Earned</span>
            <div className="text-2xl font-black text-[#1F313D] mt-1">{metrics.totalPointsEarned.toLocaleString()}</div>
            <span className="text-[10px] text-[#7A7268] mt-0.5 block">₹{program.spendPerPoint} spent = 1 pt</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <span className="text-[11px] text-[#7A7268] font-medium block">Total Redeemed</span>
            <div className="text-2xl font-black text-[#82401D] mt-1">{metrics.totalPointsRedeemed.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">{metrics.redemptionRate}% redemption rate</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <span className="text-[11px] text-[#7A7268] font-medium block">Points Expired</span>
            <div className="text-2xl font-black text-rose-700 mt-1">{metrics.totalPointsExpired.toLocaleString()}</div>
            <span className="text-[10px] text-[#7A7268] mt-0.5 block">{program.expiryDays > 0 ? `${program.expiryDays}d validity` : 'No expiry'}</span>
          </div>

          <div className="bg-[#1F313D] text-white p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] text-[#E5C9B3] font-medium block">Club Tiers</span>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono">
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300">B:{metrics.tierBreakdown.Bronze}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300">S:{metrics.tierBreakdown.Silver}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-yellow-300">G:{metrics.tierBreakdown.Gold}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-purple-300">P:{metrics.tierBreakdown.Platinum}</span>
            </div>
            <span className="text-[9px] text-[#E5C9B3]/80 mt-1 block">Tier spend thresholds</span>
          </div>
        </div>
      )}

      {/* ── TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 border-b border-[#DDD5C7] pb-2 overflow-x-auto">
        {[
          { id: 'accounts', label: 'Customer Accounts', count: accounts.length },
          { id: 'transactions', label: 'Transaction Ledger', count: transactions.length },
          { id: 'program', label: 'Program Rules & Config' },
          { id: 'adjustments', label: 'Audit & Adjustments', count: auditLogs.length },
          { id: 'notifications', label: 'Notification Logs', count: notifications.length },
          { id: 'reports', label: 'Performance Analytics' }
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

      {/* ── TAB 1: CUSTOMER ACCOUNTS (FR-LOY-002, FR-LOY-007) ── */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2]">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, account #..."
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
                <option value="Bronze">Bronze (1.0x)</option>
                <option value="Silver">Silver (1.25x)</option>
                <option value="Gold">Gold (1.5x)</option>
                <option value="Platinum">Platinum (2.0x)</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold text-[#1F313D]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Frozen">Frozen</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] uppercase font-mono tracking-wider border-b border-[#DDD5C7]">
                  <tr>
                    <th className="p-3.5">Account ID</th>
                    <th className="p-3.5">Customer Name & Phone</th>
                    <th className="p-3.5">Tier</th>
                    <th className="p-3.5 text-right">Available Points</th>
                    <th className="p-3.5 text-right">Redeem Value</th>
                    <th className="p-3.5 text-right">Lifetime Earned</th>
                    <th className="p-3.5">Expiry Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD5C7]/70">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#7A7268]">
                        No loyalty accounts match the selected search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map(acc => {
                      const tierStyle = TIER_COLORS[acc.tier] || TIER_COLORS.Bronze;
                      const redeemValue = acc.currentPoints * program.valuePerPoint;
                      return (
                        <tr key={acc.id} className="hover:bg-[#EFE9DF]/50 transition">
                          <td className="p-3.5 font-mono font-bold text-[#79415A]">{acc.id}</td>
                          <td className="p-3.5">
                            <strong className="text-[#1F313D] block">{acc.customerName}</strong>
                            <span className="text-[11px] text-[#7A7268]">{acc.customerPhone}</span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tierStyle.badge} ${tierStyle.text} ${tierStyle.border}`}>
                              {acc.tier}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono font-extrabold text-[#1F313D] text-sm">
                            {acc.currentPoints.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                            ₹{redeemValue.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right font-mono text-[#5C5549]">
                            {acc.lifetimeEarned.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-[#7A7268] text-[11px]">
                            {acc.expiryDate ? new Date(acc.expiryDate).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              acc.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {acc.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setSelectedAccountForAdjust(acc);
                                  setAdjustPointsDelta(50);
                                  setAdjustReason('');
                                  setAdjustError(null);
                                  setAdjustSuccess(null);
                                  setIsAdjustModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-[#EFE9DF] hover:bg-[#79415A] hover:text-white text-[#79415A] text-[11px] font-bold transition border border-[#DDD5C7]"
                              >
                                Adjust Points
                              </button>
                            )}
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

      {/* ── TAB 2: TRANSACTION LEDGER (FR-LOY-008) ── */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2]">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transaction ID, customer, order #..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D] focus:outline-none"
              />
            </div>

            <select
              value={txnTypeFilter}
              onChange={e => setTxnTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold text-[#1F313D]"
            >
              <option value="ALL">All Event Types</option>
              <option value="Earned">Earned</option>
              <option value="Redeemed">Redeemed</option>
              <option value="Welcome Bonus">Welcome Bonus</option>
              <option value="Manual Adjustment">Manual Adjustment</option>
              <option value="Reversed">Reversed</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] uppercase font-mono tracking-wider border-b border-[#DDD5C7]">
                  <tr>
                    <th className="p-3.5">Txn ID</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5 text-right">Points</th>
                    <th className="p-3.5 text-right">Balance After</th>
                    <th className="p-3.5">Reference</th>
                    <th className="p-3.5">Notes</th>
                    <th className="p-3.5">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD5C7]/70">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#7A7268]">
                        No transactions found for the specified filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(t => {
                      const isPositive = t.points > 0;
                      return (
                        <tr key={t.id} className="hover:bg-[#EFE9DF]/50 transition">
                          <td className="p-3.5 font-mono font-bold text-[#79415A]">{t.id}</td>
                          <td className="p-3.5">
                            <strong className="text-[#1F313D] block">{t.customerName}</strong>
                            <span className="text-[10px] text-[#7A7268] font-mono">{t.accountId}</span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.type === 'Earned' ? 'bg-emerald-100 text-emerald-800' :
                              t.type === 'Redeemed' ? 'bg-amber-100 text-amber-800' :
                              t.type === 'Welcome Bonus' ? 'bg-purple-100 text-purple-800' :
                              t.type === 'Reversed' ? 'bg-rose-100 text-rose-800' :
                              'bg-slate-200 text-slate-800'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className={`p-3.5 text-right font-mono font-black ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isPositive ? `+${t.points}` : t.points}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-[#1F313D]">
                            {t.balanceAfter}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-[#5C5549]">
                            {t.referenceType}: <strong>{t.referenceId || '—'}</strong>
                          </td>
                          <td className="p-3.5 text-[11px] text-[#5C5549] max-w-xs truncate" title={t.notes}>
                            {t.notes}
                          </td>
                          <td className="p-3.5 text-[11px] text-[#7A7268] whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
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

      {/* ── TAB 3: PROGRAM RULES & CONFIG (FR-LOY-001, FR-LOY-004, FR-LOY-005, FR-LOY-009) ── */}
      {activeTab === 'program' && (
        <form onSubmit={handleSaveProgram} className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#DDD5C7]">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">Loyalty Program Master Rules</h3>
              <p className="text-xs text-[#7A7268] mt-0.5">Configure points earning ratios, tier thresholds, redemption rules, and expiry.</p>
            </div>
            {saveProgramMessage && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                {saveProgramMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-bold text-[#1F313D] block mb-1">Program Name</label>
              <input
                type="text"
                disabled={isStaff}
                value={editingProgram.name}
                onChange={e => setEditingProgram({ ...editingProgram, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1F313D] block mb-1">Program Status</label>
              <select
                disabled={isStaff}
                value={editingProgram.status}
                onChange={e => setEditingProgram({ ...editingProgram, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold text-[#1F313D] focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive / Suspended</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1F313D] block mb-1">Welcome Bonus Points</label>
              <input
                type="number"
                disabled={isStaff}
                value={editingProgram.welcomeBonusPoints}
                onChange={e => setEditingProgram({ ...editingProgram, welcomeBonusPoints: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D] focus:outline-none"
              />
            </div>
          </div>

          {/* Section: Earning Rules */}
          <div className="pt-4 border-t border-[#DDD5C7]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#79415A] mb-3">Points Earning Rules (FR-LOY-004)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-[#1F313D] block mb-1">Spend Per Point (₹)</label>
                <input
                  type="number"
                  disabled={isStaff}
                  value={editingProgram.spendPerPoint}
                  onChange={e => setEditingProgram({ ...editingProgram, spendPerPoint: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D]"
                />
                <span className="text-[10px] text-[#7A7268] mt-1 block">e.g. ₹10 spent awards 1 base loyalty point</span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F313D] block mb-1">Minimum Qualifying Bill (₹)</label>
                <input
                  type="number"
                  disabled={isStaff}
                  value={editingProgram.minSpendToEarn}
                  onChange={e => setEditingProgram({ ...editingProgram, minSpendToEarn: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D]"
                />
                <span className="text-[10px] text-[#7A7268] mt-1 block">Orders under this amount do not qualify for points</span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F313D] block mb-1">Points Expiry Period (Days)</label>
                <input
                  type="number"
                  disabled={isStaff}
                  value={editingProgram.expiryDays}
                  onChange={e => setEditingProgram({ ...editingProgram, expiryDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D]"
                />
                <span className="text-[10px] text-[#7A7268] mt-1 block">0 = Points never expire; 180 = Valid for 6 months</span>
              </div>
            </div>
          </div>

          {/* Section: Redemption Rules */}
          <div className="pt-4 border-t border-[#DDD5C7]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#79415A] mb-3">Points Redemption Rules (FR-LOY-005)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-[#1F313D] block mb-1">Value Per Point (₹)</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={isStaff}
                  value={editingProgram.valuePerPoint}
                  onChange={e => setEditingProgram({ ...editingProgram, valuePerPoint: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D]"
                />
                <span className="text-[10px] text-[#7A7268] mt-1 block">1 point = ₹1.00 instant deduction</span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F313D] block mb-1">Minimum Points to Redeem</label>
                <input
                  type="number"
                  disabled={isStaff}
                  value={editingProgram.minPointsToRedeem}
                  onChange={e => setEditingProgram({ ...editingProgram, minPointsToRedeem: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D]"
                />
                <span className="text-[10px] text-[#7A7268] mt-1 block">e.g. 50 points threshold before redemption is unlocked</span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F313D] block mb-1">Max Redemption Cap (% of Bill)</label>
                <input
                  type="number"
                  disabled={isStaff}
                  value={editingProgram.maxRedemptionPercent}
                  onChange={e => setEditingProgram({ ...editingProgram, maxRedemptionPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D]"
                />
                <span className="text-[10px] text-[#7A7268] mt-1 block">Prevents total zero-rupee checkout (e.g. max 50% of bill)</span>
              </div>
            </div>
          </div>

          {/* Section: Tier Multipliers */}
          <div className="pt-4 border-t border-[#DDD5C7]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#79415A] mb-3">Tier Multipliers & Escalation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {editingProgram.tiers.map((tierRule, idx) => (
                <div key={tierRule.tier} className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-[#1F313D]">{tierRule.tier} Tier</span>
                    <span className="text-xs font-mono font-bold text-[#79415A]">{tierRule.multiplier}x points</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#7A7268] block">Min Spend (₹)</label>
                    <input
                      type="number"
                      disabled={isStaff}
                      value={tierRule.minLifetimeSpend}
                      onChange={e => {
                        const newTiers = [...editingProgram.tiers];
                        newTiers[idx].minLifetimeSpend = Number(e.target.value);
                        setEditingProgram({ ...editingProgram, tiers: newTiers });
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-white border border-[#DDD5C7] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#7A7268] block">Multiplier Rate</label>
                    <input
                      type="number"
                      step="0.05"
                      disabled={isStaff}
                      value={tierRule.multiplier}
                      onChange={e => {
                        const newTiers = [...editingProgram.tiers];
                        newTiers[idx].multiplier = Number(e.target.value);
                        setEditingProgram({ ...editingProgram, tiers: newTiers });
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-white border border-[#DDD5C7] text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-[#DDD5C7] flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white font-bold text-xs shadow-xs transition"
              >
                Save Program Configuration
              </button>
            </div>
          )}
        </form>
      )}

      {/* ── TAB 4: AUDIT & ADJUSTMENTS (FR-LOY-011) ── */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#79415A]" /> Points Adjustment Audit Ledger
                </h3>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Complete audit records of manual point corrections, supervisor overrides, and balance revisions.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#DDD5C7]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] uppercase font-mono tracking-wider border-b border-[#DDD5C7]">
                  <tr>
                    <th className="p-3.5">Audit ID</th>
                    <th className="p-3.5">Account / Customer</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Performed By</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5 text-right">Previous Pts</th>
                    <th className="p-3.5 text-right">New Pts</th>
                    <th className="p-3.5">Reason & Justification</th>
                    <th className="p-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD5C7]/70">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#7A7268]">
                        No manual adjustments recorded. All customer points are generated through automated order settlement.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-[#EFE9DF]/50 transition">
                        <td className="p-3.5 font-mono font-bold text-[#79415A]">{log.id}</td>
                        <td className="p-3.5 font-mono text-[11px] text-[#1F313D]">{log.accountId}</td>
                        <td className="p-3.5 font-bold text-xs text-[#82401D]">{log.action}</td>
                        <td className="p-3.5 font-medium text-[#1F313D]">{log.performedBy}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            {log.userRole}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-[#7A7268]">{log.previousPoints}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{log.newPoints}</td>
                        <td className="p-3.5 text-[11px] text-[#5C5549] max-w-xs">{log.reason}</td>
                        <td className="p-3.5 text-[11px] text-[#7A7268]">
                          {new Date(log.timestamp).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
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

      {/* ── TAB 5: NOTIFICATIONS (FR-LOY-012, FR-LOY-013) ── */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D] flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#79415A]" /> Member Notification Logs
                </h3>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Automated customer notifications for points earned, redemptions, welcome bonuses, and upcoming expirations.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#DDD5C7]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] uppercase font-mono tracking-wider border-b border-[#DDD5C7]">
                  <tr>
                    <th className="p-3.5">Notification ID</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Event Type</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Message Content</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD5C7]/70">
                  {notifications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#7A7268]">
                        No notification logs found.
                      </td>
                    </tr>
                  ) : (
                    notifications.map(n => (
                      <tr key={n.id} className="hover:bg-[#EFE9DF]/50 transition">
                        <td className="p-3.5 font-mono font-bold text-[#79415A]">{n.id}</td>
                        <td className="p-3.5 font-mono text-[11px] text-[#1F313D]">{n.customerPhone}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            n.type === 'POINTS_EARNED' ? 'bg-emerald-100 text-emerald-800' :
                            n.type === 'POINTS_REDEEMED' ? 'bg-amber-100 text-amber-800' :
                            n.type === 'EXPIRY_REMINDER' ? 'bg-rose-100 text-rose-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
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
                        <td className="p-3.5 text-[11px] text-[#7A7268] whitespace-nowrap">
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

      {/* ── TAB 6: PERFORMANCE ANALYTICS (FR-LOY-014) ── */}
      {activeTab === 'reports' && metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#1F313D]">Points Distribution & Health</h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Redeemed vs Total Issued</span>
                  <span className="font-mono text-[#79415A]">{metrics.redemptionRate}%</span>
                </div>
                <div className="w-full bg-[#EFE9DF] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#79415A] h-full rounded-full" style={{ width: `${Math.min(100, metrics.redemptionRate)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="p-3 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7]">
                  <span className="text-[10px] text-[#7A7268] block">Total Points Issued</span>
                  <strong className="text-base text-[#1F313D] font-mono">{metrics.totalPointsEarned.toLocaleString()}</strong>
                </div>
                <div className="p-3 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7]">
                  <span className="text-[10px] text-[#7A7268] block">Total Points Redeemed</span>
                  <strong className="text-base text-[#82401D] font-mono">{metrics.totalPointsRedeemed.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#1F313D]">Membership Tier Distribution</h3>
            <div className="space-y-2 text-xs">
              {(['Bronze', 'Silver', 'Gold', 'Platinum'] as LoyaltyTier[]).map(t => {
                const count = metrics.tierBreakdown[t];
                const pct = metrics.totalMembers > 0 ? ((count / metrics.totalMembers) * 100).toFixed(0) : '0';
                return (
                  <div key={t} className="p-3 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-center justify-between">
                    <span className="font-bold text-[#1F313D]">{t} Tier</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-[#79415A]">{count} patrons</span>
                      <span className="text-[11px] font-mono text-[#7A7268]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: MANUAL POINTS ADJUSTMENT (FR-LOY-011) ── */}
      {isAdjustModalOpen && selectedAccountForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">Manual Points Adjustment</h3>
                <p className="text-xs text-[#7A7268]">Modifying balance for {selectedAccountForAdjust.customerName}</p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-full text-[#7A7268] hover:bg-[#EFE9DF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {adjustError}
              </div>
            )}

            {adjustSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {adjustSuccess}
              </div>
            )}

            <form onSubmit={handlePerformAdjustment} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#7A7268]">Current Balance:</span>
                  <strong className="font-mono text-[#1F313D]">{selectedAccountForAdjust.currentPoints} pts</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A7268]">Member Tier:</span>
                  <strong className="text-[#79415A]">{selectedAccountForAdjust.tier}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">
                  Points Adjustment (+ to award, - to deduct)
                </label>
                <input
                  type="number"
                  required
                  value={adjustPointsDelta}
                  onChange={e => setAdjustPointsDelta(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] font-mono text-sm font-bold text-[#1F313D] focus:outline-none"
                />
                <span className="text-[10px] text-[#7A7268] mt-1 block">
                  New resulting balance: {Math.max(0, selectedAccountForAdjust.currentPoints + Number(adjustPointsDelta))} pts
                </span>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">
                  Audit Justification Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Compensation for service delay, VIP promotional gift, or billing correction..."
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-medium text-[#1F313D] focus:outline-none"
                />
                <span className="text-[10px] text-[#7A7268] mt-0.5 block">
                  Logged in permanent audit trail under your user ID.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDD5C7]">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white font-bold"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
