import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning, Search, Download, AlertTriangle, CheckCircle2,
  Clock, Star, XCircle, TrendingUp, Users, Phone, Mail,
  Eye, MessageSquare, ThumbsUp, ThumbsDown, Filter, ArrowUpRight,
  RefreshCw, Plus, ChevronDown
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type FeedbackCategory = 'Food Quality' | 'Service' | 'Cleanliness' | 'Ambiance' | 'Pricing' | 'Wait Time' | 'Delivery' | 'Other';
type FeedbackStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
type FeedbackSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type FeedbackSource = 'In-Restaurant' | 'Online Order' | 'Google Review' | 'App Feedback' | 'WhatsApp' | 'Email' | 'Phone Call';

interface FeedbackRecord {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  branch: string;
  category: FeedbackCategory;
  source: FeedbackSource;
  severity: FeedbackSeverity;
  status: FeedbackStatus;
  rating: number; // 1-5
  description: string;
  resolution?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  responseTime?: number; // hours
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_FEEDBACK: FeedbackRecord[] = [
  { id: 'f1', ticketNumber: 'TKT-2024-001', customerName: 'Arjun Sharma', customerPhone: '9876543210', customerEmail: 'arjun@email.com', branch: 'Main Branch', category: 'Food Quality', source: 'In-Restaurant', severity: 'HIGH', status: 'Open', rating: 2, description: 'The butter chicken was undercooked and lacked flavor. This is unacceptable for the price we paid. Expecting a resolution immediately.', assignedTo: 'Rajan K.', createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f2', ticketNumber: 'TKT-2024-002', customerName: 'Priya Mehta', customerPhone: '9823456781', customerEmail: 'priya@email.com', branch: 'City Center', category: 'Service', source: 'Google Review', severity: 'MEDIUM', status: 'In Progress', rating: 3, description: 'Staff was rude and took 45 minutes for a simple takeaway order. No apology offered.', assignedTo: 'Priya V.', createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: 'f3', ticketNumber: 'TKT-2024-003', customerName: 'Rohit Kumar', customerPhone: '9712345678', customerEmail: 'rohit@email.com', branch: 'Airport Road', category: 'Cleanliness', source: 'App Feedback', severity: 'HIGH', status: 'Open', rating: 1, description: 'The washrooms were filthy. Tables were not cleaned between customers. Health inspection may be warranted.', createdAt: new Date(Date.now() - 8 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: 'f4', ticketNumber: 'TKT-2024-004', customerName: 'Anjali Singh', customerPhone: '9634567890', customerEmail: 'anjali@email.com', branch: 'Main Branch', category: 'Wait Time', source: 'WhatsApp', severity: 'MEDIUM', status: 'Resolved', rating: 3, description: 'Waited over 1 hour for delivery even though we live 2km away. No updates provided.', resolution: 'Apologized to customer. Issued 20% discount coupon for next order. Delivery team briefed on communication protocols.', assignedTo: 'Priya V.', createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 20 * 3600000).toISOString(), resolvedAt: new Date(Date.now() - 20 * 3600000).toISOString(), responseTime: 4 },
  { id: 'f5', ticketNumber: 'TKT-2024-005', customerName: 'Vikram Nair', customerPhone: '9545678901', customerEmail: 'vikram@email.com', branch: 'City Center', category: 'Food Quality', source: 'Online Order', severity: 'CRITICAL', status: 'Open', rating: 1, description: 'Found a foreign object (plastic piece) in the biryani. This is a serious food safety concern and I am considering filing a complaint with the food authority.', assignedTo: 'Admin', createdAt: new Date(Date.now() - 1 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f6', ticketNumber: 'TKT-2024-006', customerName: 'Deepika Rao', customerPhone: '9456789012', customerEmail: 'deepika@email.com', branch: 'Highway Hub', category: 'Pricing', source: 'Email', severity: 'LOW', status: 'Closed', rating: 4, description: 'Slight overcharge on the bill (₹45 extra). Would appreciate a correction.', resolution: 'Bill audited and confirmed. Refund of ₹45 processed. Customer satisfied.', assignedTo: 'Deepa S.', createdAt: new Date(Date.now() - 48 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 46 * 3600000).toISOString(), resolvedAt: new Date(Date.now() - 46 * 3600000).toISOString(), responseTime: 2 },
  { id: 'f7', ticketNumber: 'TKT-2024-007', customerName: 'Suresh Pillai', customerPhone: '9367890123', customerEmail: 'suresh@email.com', branch: 'Main Branch', category: 'Ambiance', source: 'In-Restaurant', severity: 'LOW', status: 'Closed', rating: 4, description: 'Music was too loud during our family dinner. Requested to lower it twice but no action taken.', resolution: 'Noted. Music volume policy updated for family dining hours (before 8 PM).', createdAt: new Date(Date.now() - 72 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 68 * 3600000).toISOString(), resolvedAt: new Date(Date.now() - 68 * 3600000).toISOString(), responseTime: 4 },
  { id: 'f8', ticketNumber: 'TKT-2024-008', customerName: 'Meera Joshi', customerPhone: '9278901234', customerEmail: 'meera@email.com', branch: 'City Center', category: 'Delivery', source: 'App Feedback', severity: 'HIGH', status: 'In Progress', rating: 2, description: 'Order was delivered cold. The packaging was damaged. Very disappointing for a premium restaurant.', assignedTo: 'Karthik R.', createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: 'f9', ticketNumber: 'TKT-2024-009', customerName: 'Kabir Verma', customerPhone: '9189012345', customerEmail: 'kabir@email.com', branch: 'Airport Road', category: 'Service', source: 'Google Review', severity: 'LOW', status: 'Resolved', rating: 5, description: 'Exceptional service from Arun. He remembered our previous order preferences and provided outstanding hospitality.', resolution: 'Shared with management. Arun recognized in team meeting and given a commendation.', createdAt: new Date(Date.now() - 36 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 35 * 3600000).toISOString(), resolvedAt: new Date(Date.now() - 35 * 3600000).toISOString(), responseTime: 1 },
  { id: 'f10', ticketNumber: 'TKT-2024-010', customerName: 'Lavanya Das', customerPhone: '9090123456', customerEmail: 'lavanya@email.com', branch: 'Main Branch', category: 'Other', source: 'Phone Call', severity: 'MEDIUM', status: 'Open', rating: 3, description: 'Reservation was confirmed but table was not ready when we arrived. Had to wait 20 minutes without any communication.', createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 4 * 3600000).toISOString() },
];

const STORAGE_KEY = 'crm_feedback_v1';
function loadFeedback(): FeedbackRecord[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_FEEDBACK));
  return SEED_FEEDBACK;
}
function saveFeedback(items: FeedbackRecord[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

const SEVERITY_CONFIG: Record<FeedbackSeverity, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: 'text-red-900',    bg: 'bg-red-200',    label: '🔴 Critical' },
  HIGH:     { color: 'text-rose-800',   bg: 'bg-rose-100',   label: '🟠 High' },
  MEDIUM:   { color: 'text-amber-800',  bg: 'bg-amber-100',  label: '🟡 Medium' },
  LOW:      { color: 'text-emerald-800',bg: 'bg-emerald-100',label: '🟢 Low' },
};
const STATUS_CONFIG: Record<FeedbackStatus, { color: string; bg: string }> = {
  'Open':        { color: 'text-rose-800',   bg: 'bg-rose-100' },
  'In Progress': { color: 'text-amber-800',  bg: 'bg-amber-100' },
  'Resolved':    { color: 'text-emerald-800',bg: 'bg-emerald-100' },
  'Closed':      { color: 'text-gray-600',   bg: 'bg-gray-100' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < rating ? 'text-amber-500' : 'text-gray-300'}>★</span>
  ));
}

interface ComplaintsFeedbackViewProps { orgId?: string; }

export const ComplaintsFeedbackView: React.FC<ComplaintsFeedbackViewProps> = () => {
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<FeedbackSeverity | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'ALL'>('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [view, setView] = useState<'tickets' | 'analytics'>('tickets');
  const [selectedTicket, setSelectedTicket] = useState<FeedbackRecord | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [savingResolution, setSavingResolution] = useState(false);

  useEffect(() => { setFeedback(loadFeedback()); }, []);

  const updateStatus = (id: string, status: FeedbackStatus, resolution?: string) => {
    setFeedback(prev => {
      const u = prev.map(f => f.id === id ? {
        ...f, status, updatedAt: new Date().toISOString(),
        ...(resolution ? { resolution, resolvedAt: new Date().toISOString() } : {}),
        ...(status === 'Resolved' || status === 'Closed' ? {
          responseTime: Math.round((Date.now() - new Date(f.createdAt).getTime()) / 3600000)
        } : {})
      } : f);
      saveFeedback(u);
      return u;
    });
    if (selectedTicket?.id === id) setSelectedTicket(prev => prev ? { ...prev, status, resolution: resolution || prev.resolution } : null);
  };

  const resolveTicket = (id: string) => {
    setSavingResolution(true);
    setTimeout(() => {
      updateStatus(id, 'Resolved', resolutionText || 'Issue resolved by admin. Customer notified.');
      setResolutionText('');
      setSavingResolution(false);
    }, 600);
  };

  const branches = ['ALL', ...Array.from(new Set(feedback.map(f => f.branch)))];
  const categories = Array.from(new Set(SEED_FEEDBACK.map(f => f.category)));

  const filtered = feedback.filter(f => {
    const q = search.toLowerCase();
    return (!q || f.ticketNumber.toLowerCase().includes(q) || f.customerName.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)) &&
      (statusFilter === 'ALL' || f.status === statusFilter) &&
      (severityFilter === 'ALL' || f.severity === severityFilter) &&
      (categoryFilter === 'ALL' || f.category === categoryFilter) &&
      (branchFilter === 'ALL' || f.branch === branchFilter);
  }).sort((a, b) => {
    // Sort: CRITICAL > HIGH > MEDIUM > LOW, then by date desc
    const sevOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const sevDiff = sevOrder[a.severity] - sevOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const openCount = feedback.filter(f => f.status === 'Open').length;
  const inProgressCount = feedback.filter(f => f.status === 'In Progress').length;
  const resolvedCount = feedback.filter(f => f.status === 'Resolved' || f.status === 'Closed').length;
  const criticalCount = feedback.filter(f => f.severity === 'CRITICAL' && f.status === 'Open').length;
  const avgRating = feedback.length > 0 ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : '0';
  const avgResponseTime = feedback.filter(f => f.responseTime !== undefined).length > 0
    ? (feedback.filter(f => f.responseTime !== undefined).reduce((s, f) => s + (f.responseTime || 0), 0) / feedback.filter(f => f.responseTime !== undefined).length).toFixed(1)
    : '—';

  const exportCSV = () => {
    const rows = [
      ['Ticket', 'Customer', 'Branch', 'Category', 'Severity', 'Status', 'Rating', 'Source', 'Created', 'Response Time'],
      ...filtered.map(f => [f.ticketNumber, f.customerName, f.branch, f.category, f.severity, f.status, f.rating, f.source, f.createdAt, f.responseTime ? `${f.responseTime}h` : '—'])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `feedback_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Category breakdown
  const categoryStats = categories.map(cat => ({
    cat,
    total: feedback.filter(f => f.category === cat).length,
    open: feedback.filter(f => f.category === cat && (f.status === 'Open' || f.status === 'In Progress')).length,
    avgRating: feedback.filter(f => f.category === cat).length > 0
      ? (feedback.filter(f => f.category === cat).reduce((s, f) => s + f.rating, 0) / feedback.filter(f => f.category === cat).length).toFixed(1)
      : '0',
  })).sort((a, b) => b.open - a.open);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1F313D]">Complaints & Feedback</h1>
          <p className="text-sm text-[#7A7268] mt-0.5">Track, resolve, and analyse customer complaints and reviews</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-red-800">{criticalCount} CRITICAL ticket{criticalCount > 1 ? 's' : ''} require immediate attention!</div>
            <div className="text-[11px] text-red-700">Food safety or severe complaints pending resolution.</div>
          </div>
          <button onClick={() => { setStatusFilter('Open'); setSeverityFilter('CRITICAL'); setView('tickets'); }}
            className="ml-auto px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shrink-0">
            View Critical
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Tickets', value: feedback.length.toString(), icon: MessageSquareWarning, color: 'text-[#1F313D]', bg: 'bg-[#1F313D]/10' },
          { label: 'Open', value: openCount.toString(), icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-100' },
          { label: 'In Progress', value: inProgressCount.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Resolved', value: resolvedCount.toString(), icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100' },
          { label: 'Avg Rating', value: `${avgRating} ★`, icon: Star, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Avg Response', value: `${avgResponseTime}h`, icon: RefreshCw, color: 'text-indigo-700', bg: 'bg-indigo-100' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E5DDD2] shadow-xs">
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className="text-lg font-black text-[#1F313D]">{k.value}</div>
              <div className="text-[11px] text-[#7A7268]">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* View Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {(['tickets', 'analytics'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${view === v ? 'bg-[#79415A] text-white' : 'bg-[#EFE9DF] text-[#5C5549] hover:bg-[#E5DDD2]'}`}>
            {v === 'tickets' ? '🎫 All Tickets' : '📊 Category Analytics'}
          </button>
        ))}
      </div>

      {view === 'analytics' ? (
        <div className="space-y-6">
          {/* Category Breakdown */}
          <div className="bg-[#FAF7F2] rounded-[24px] p-6 border border-[#E5DDD2]">
            <h3 className="font-serif font-bold text-base text-[#1F313D] mb-4">Feedback by Category</h3>
            <div className="space-y-3">
              {categoryStats.map(c => {
                const pct = feedback.length > 0 ? Math.round((c.total / feedback.length) * 100) : 0;
                return (
                  <div key={c.cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#1F313D]">{c.cat}</span>
                      <div className="flex items-center gap-4 text-[11px] text-[#7A7268]">
                        <span className="text-rose-700 font-bold">{c.open} open</span>
                        <span>{c.total} total</span>
                        <span className="text-amber-600 font-bold">{c.avgRating} ★ avg</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#EAE4D9] rounded-full overflow-hidden">
                      <div className="h-full bg-[#79415A] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Severity Distribution */}
          <div className="bg-[#FAF7F2] rounded-[24px] p-6 border border-[#E5DDD2]">
            <h3 className="font-serif font-bold text-base text-[#1F313D] mb-4">Severity Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as FeedbackSeverity[]).map(sev => {
                const count = feedback.filter(f => f.severity === sev).length;
                const cfg = SEVERITY_CONFIG[sev];
                const resolved = feedback.filter(f => f.severity === sev && (f.status === 'Resolved' || f.status === 'Closed')).length;
                return (
                  <div key={sev} className={`p-4 rounded-2xl ${cfg.bg}`}>
                    <div className={`text-2xl font-black ${cfg.color}`}>{count}</div>
                    <div className={`text-xs font-bold mt-0.5 ${cfg.color}`}>{cfg.label}</div>
                    <div className={`text-[11px] mt-1 opacity-70 ${cfg.color}`}>{resolved} resolved</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branch Performance */}
          <div className="bg-[#FAF7F2] rounded-[24px] p-6 border border-[#E5DDD2]">
            <h3 className="font-serif font-bold text-base text-[#1F313D] mb-4">Branch Complaint Rate</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {branches.filter(b => b !== 'ALL').map(branch => {
                const branchFeedback = feedback.filter(f => f.branch === branch);
                const openIssues = branchFeedback.filter(f => f.status === 'Open' || f.status === 'In Progress').length;
                const avgBranchRating = branchFeedback.length > 0 ? (branchFeedback.reduce((s, f) => s + f.rating, 0) / branchFeedback.length).toFixed(1) : '0';
                return (
                  <div key={branch} className="p-4 bg-[#EFE9DF] rounded-2xl">
                    <div className="text-xs font-bold text-[#1F313D] mb-2">{branch}</div>
                    <div className="text-lg font-black text-[#1F313D]">{branchFeedback.length}</div>
                    <div className="text-[10px] text-[#7A7268]">Total tickets</div>
                    <div className={`text-xs font-bold mt-1 ${openIssues > 2 ? 'text-rose-700' : 'text-emerald-700'}`}>{openIssues} open</div>
                    <div className="text-xs text-amber-600 font-bold mt-0.5">{avgBranchRating} ★ avg</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7268]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ticket, customer, issue…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#79415A]/30" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                <option value="ALL">All Statuses</option>
                {(['Open', 'In Progress', 'Resolved', 'Closed'] as FeedbackStatus[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                <option value="ALL">All Severities</option>
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as FeedbackSeverity[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                <option value="ALL">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                {branches.map(b => <option key={b} value={b}>{b === 'ALL' ? 'All Branches' : b}</option>)}
              </select>
            </div>

            {/* Tickets */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-16 bg-[#FAF7F2] rounded-2xl border border-[#E5DDD2]">
                  <MessageSquareWarning className="w-10 h-10 text-[#DDD5C7] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#5C5549]">No tickets found</p>
                </div>
              ) : filtered.map(ticket => {
                const sevCfg = SEVERITY_CONFIG[ticket.severity];
                const stCfg = STATUS_CONFIG[ticket.status];
                const isSelected = selectedTicket?.id === ticket.id;
                const isPositive = ticket.rating >= 4;

                return (
                  <div key={ticket.id}
                    onClick={() => { setSelectedTicket(isSelected ? null : ticket); setResolutionText(''); }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${ticket.severity === 'CRITICAL' && ticket.status === 'Open' ? 'border-red-300 bg-red-50' : isSelected ? 'border-[#79415A] bg-white shadow-md' : 'border-[#DDD5C7] bg-[#FAF7F2] hover:bg-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-[#1F313D]">{ticket.ticketNumber}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sevCfg.bg} ${sevCfg.color}`}>{sevCfg.label}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${stCfg.bg} ${stCfg.color}`}>{ticket.status}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#EFE9DF] text-[#5C5549]">{ticket.category}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <h4 className="text-xs font-bold text-[#1F313D]">{ticket.customerName}</h4>
                          <span className="text-[10px] text-[#7A7268]">· {ticket.branch}</span>
                          <span className="text-[10px] text-[#7A7268]">· {ticket.source}</span>
                        </div>
                        <p className="text-[11px] text-[#5C5549] mt-1 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#7A7268]">
                          <span className={`font-bold text-sm leading-none ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {renderStars(ticket.rating)}
                          </span>
                          <span>{timeAgo(ticket.createdAt)}</span>
                          {ticket.assignedTo && <span>Assigned: {ticket.assignedTo}</span>}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col gap-1.5">
                        {ticket.status === 'Open' && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(ticket.id, 'In Progress'); }}
                            className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold transition">
                            Start
                          </button>
                        )}
                        {ticket.status === 'In Progress' && (
                          <button onClick={e => { e.stopPropagation(); setSelectedTicket(ticket); setResolutionText(''); }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition">
                            Resolve
                          </button>
                        )}
                        {ticket.status === 'Resolved' && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(ticket.id, 'Closed'); }}
                            className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold transition">
                            Close
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ticket Detail Panel */}
          {selectedTicket && (
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5 sticky top-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-[#1F313D]">Ticket Detail</h3>
                  <button onClick={() => setSelectedTicket(null)} className="text-[#7A7268] hover:text-[#1F313D] text-xs">✕</button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_CONFIG[selectedTicket.severity].bg} ${SEVERITY_CONFIG[selectedTicket.severity].color}`}>{SEVERITY_CONFIG[selectedTicket.severity].label}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[selectedTicket.status].bg} ${STATUS_CONFIG[selectedTicket.status].color}`}>{selectedTicket.status}</span>
                </div>

                <div className="p-3 bg-[#EFE9DF] rounded-xl">
                  <div className="font-mono text-[10px] text-[#7A7268] mb-1">{selectedTicket.ticketNumber}</div>
                  <p className="text-xs text-[#1F313D] leading-relaxed">"{selectedTicket.description}"</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Customer</span>
                    <span className="font-bold text-[#1F313D]">{selectedTicket.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Branch</span>
                    <span className="font-bold text-[#1F313D]">{selectedTicket.branch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Category</span>
                    <span className="font-bold text-[#1F313D]">{selectedTicket.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Source</span>
                    <span className="font-bold text-[#1F313D]">{selectedTicket.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Rating</span>
                    <span className="font-bold text-amber-600">{renderStars(selectedTicket.rating)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Submitted</span>
                    <span className="font-bold text-[#1F313D]">{timeAgo(selectedTicket.createdAt)}</span>
                  </div>
                  {selectedTicket.responseTime && (
                    <div className="flex justify-between">
                      <span className="text-[#7A7268]">Response Time</span>
                      <span className="font-bold text-emerald-700">{selectedTicket.responseTime}h</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <a href={`tel:${selectedTicket.customerPhone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <a href={`mailto:${selectedTicket.customerEmail}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                </div>

                {selectedTicket.resolution && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="text-[11px] font-bold text-emerald-800 mb-1">✅ Resolution</div>
                    <p className="text-xs text-emerald-700">{selectedTicket.resolution}</p>
                  </div>
                )}

                {(selectedTicket.status === 'Open' || selectedTicket.status === 'In Progress') && (
                  <div>
                    <label className="text-xs font-bold text-[#5C5549] mb-1 block">Resolution Notes</label>
                    <textarea value={resolutionText} onChange={e => setResolutionText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#79415A]/30 resize-none" rows={3}
                      placeholder="Describe how this was resolved…" />
                    <button onClick={() => resolveTicket(selectedTicket.id)} disabled={savingResolution}
                      className="mt-2 w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold transition flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {savingResolution ? 'Saving…' : 'Mark Resolved & Notify Customer'}
                    </button>
                  </div>
                )}

                {selectedTicket.status === 'Resolved' && (
                  <button onClick={() => updateStatus(selectedTicket.id, 'Closed')}
                    className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition">
                    Close Ticket
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
