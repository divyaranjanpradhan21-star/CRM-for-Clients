import React, { useState, useEffect } from 'react';
import {
  Award, Search, Download, Star, TrendingUp, TrendingDown,
  Clock, Users, CheckCircle2, AlertTriangle, Phone, Mail,
  UserCheck, Calendar, BarChart2, Filter, Eye, Edit2
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
type StaffRole = 'Head Chef' | 'Sous Chef' | 'Waiter' | 'Bartender' | 'Cashier' | 'Manager' | 'Receptionist' | 'Delivery';
type ShiftStatus = 'ON_DUTY' | 'OFF_DUTY' | 'ON_BREAK' | 'ABSENT';
type PerformanceTier = 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';

interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  branch: string;
  phone: string;
  email: string;
  avatar: string;
  status: ShiftStatus;
  shiftsCompleted: number;
  shiftsScheduled: number;
  ordersHandled: number;
  avgServiceTime: number; // minutes
  customerRating: number;
  efficiencyScore: number;
  attendanceRate: number;
  joinedAt: string;
  lastActive: string;
  tier: PerformanceTier;
  totalHours: number;
  incentiveEarned: number;
  notes?: string;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────
const SEED_STAFF: StaffMember[] = [
  { id: 's1', name: 'Rajan Krishnamurthy', role: 'Head Chef', branch: 'Main Branch', phone: '9876543210', email: 'rajan@dine.in', avatar: 'https://i.pravatar.cc/80?img=11', status: 'ON_DUTY', shiftsCompleted: 24, shiftsScheduled: 25, ordersHandled: 312, avgServiceTime: 18, customerRating: 4.9, efficiencyScore: 96, attendanceRate: 96, joinedAt: '2022-04-01', lastActive: new Date().toISOString(), tier: 'Excellent', totalHours: 192, incentiveEarned: 8500 },
  { id: 's2', name: 'Priya Venkataraman', role: 'Manager', branch: 'City Center', phone: '9823456781', email: 'priya@dine.in', avatar: 'https://i.pravatar.cc/80?img=5', status: 'ON_DUTY', shiftsCompleted: 23, shiftsScheduled: 25, ordersHandled: 0, avgServiceTime: 0, customerRating: 4.7, efficiencyScore: 92, attendanceRate: 92, joinedAt: '2021-10-15', lastActive: new Date().toISOString(), tier: 'Excellent', totalHours: 184, incentiveEarned: 7200, notes: 'Team lead for City Center' },
  { id: 's3', name: 'Arun Nair', role: 'Waiter', branch: 'Main Branch', phone: '9712345678', email: 'arun@dine.in', avatar: 'https://i.pravatar.cc/80?img=3', status: 'ON_DUTY', shiftsCompleted: 22, shiftsScheduled: 25, ordersHandled: 198, avgServiceTime: 12, customerRating: 4.6, efficiencyScore: 89, attendanceRate: 88, joinedAt: '2023-02-20', lastActive: new Date().toISOString(), tier: 'Good', totalHours: 176, incentiveEarned: 4200 },
  { id: 's4', name: 'Deepa Suresh', role: 'Cashier', branch: 'Main Branch', phone: '9634567890', email: 'deepa@dine.in', avatar: 'https://i.pravatar.cc/80?img=9', status: 'ON_BREAK', shiftsCompleted: 24, shiftsScheduled: 25, ordersHandled: 285, avgServiceTime: 3, customerRating: 4.5, efficiencyScore: 94, attendanceRate: 96, joinedAt: '2022-08-10', lastActive: new Date(Date.now() - 30 * 60000).toISOString(), tier: 'Excellent', totalHours: 192, incentiveEarned: 5800 },
  { id: 's5', name: 'Vikram Bose', role: 'Sous Chef', branch: 'City Center', phone: '9545678901', email: 'vikram@dine.in', avatar: 'https://i.pravatar.cc/80?img=15', status: 'ON_DUTY', shiftsCompleted: 21, shiftsScheduled: 25, ordersHandled: 265, avgServiceTime: 20, customerRating: 4.5, efficiencyScore: 87, attendanceRate: 84, joinedAt: '2023-01-05', lastActive: new Date().toISOString(), tier: 'Good', totalHours: 168, incentiveEarned: 5200 },
  { id: 's6', name: 'Meena Pillai', role: 'Receptionist', branch: 'Airport Road', phone: '9456789012', email: 'meena@dine.in', avatar: 'https://i.pravatar.cc/80?img=20', status: 'ON_DUTY', shiftsCompleted: 23, shiftsScheduled: 25, ordersHandled: 0, avgServiceTime: 5, customerRating: 4.8, efficiencyScore: 91, attendanceRate: 92, joinedAt: '2022-11-30', lastActive: new Date().toISOString(), tier: 'Excellent', totalHours: 184, incentiveEarned: 4800 },
  { id: 's7', name: 'Suresh Pandit', role: 'Waiter', branch: 'Highway Hub', phone: '9367890123', email: 'suresh@dine.in', avatar: 'https://i.pravatar.cc/80?img=7', status: 'OFF_DUTY', shiftsCompleted: 18, shiftsScheduled: 25, ordersHandled: 142, avgServiceTime: 15, customerRating: 3.9, efficiencyScore: 72, attendanceRate: 72, joinedAt: '2023-07-15', lastActive: new Date(Date.now() - 8 * 3600000).toISOString(), tier: 'Average', totalHours: 144, incentiveEarned: 1800, notes: 'Follow-up on attendance' },
  { id: 's8', name: 'Lavanya Iyer', role: 'Bartender', branch: 'City Center', phone: '9278901234', email: 'lavanya@dine.in', avatar: 'https://i.pravatar.cc/80?img=22', status: 'ON_DUTY', shiftsCompleted: 22, shiftsScheduled: 25, ordersHandled: 178, avgServiceTime: 8, customerRating: 4.6, efficiencyScore: 88, attendanceRate: 88, joinedAt: '2023-04-10', lastActive: new Date().toISOString(), tier: 'Good', totalHours: 176, incentiveEarned: 4600 },
  { id: 's9', name: 'Karthik Reddy', role: 'Delivery', branch: 'Main Branch', phone: '9189012345', email: 'karthik@dine.in', avatar: 'https://i.pravatar.cc/80?img=12', status: 'ON_DUTY', shiftsCompleted: 25, shiftsScheduled: 25, ordersHandled: 198, avgServiceTime: 25, customerRating: 4.3, efficiencyScore: 85, attendanceRate: 100, joinedAt: '2023-09-01', lastActive: new Date().toISOString(), tier: 'Good', totalHours: 200, incentiveEarned: 3800 },
  { id: 's10', name: 'Anjali Sharma', role: 'Waiter', branch: 'Airport Road', phone: '9090123456', email: 'anjali@dine.in', avatar: 'https://i.pravatar.cc/80?img=25', status: 'ABSENT', shiftsCompleted: 15, shiftsScheduled: 25, ordersHandled: 98, avgServiceTime: 14, customerRating: 3.6, efficiencyScore: 60, attendanceRate: 60, joinedAt: '2024-01-20', lastActive: new Date(Date.now() - 2 * 86400000).toISOString(), tier: 'Needs Improvement', totalHours: 120, incentiveEarned: 0, notes: 'Under performance review' },
];

const STORAGE_KEY = 'crm_staff_roster_v1';
function loadStaff(): StaffMember[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STAFF));
  return SEED_STAFF;
}
function saveStaff(staff: StaffMember[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(staff)); }

const SHIFT_CONFIG: Record<ShiftStatus, { label: string; color: string; bg: string; dot: string }> = {
  ON_DUTY:  { label: 'On Duty',   color: 'text-emerald-800', bg: 'bg-emerald-100', dot: 'bg-emerald-500 animate-pulse' },
  ON_BREAK: { label: 'On Break',  color: 'text-amber-800',   bg: 'bg-amber-100',   dot: 'bg-amber-400' },
  OFF_DUTY: { label: 'Off Duty',  color: 'text-gray-600',    bg: 'bg-gray-100',    dot: 'bg-gray-400' },
  ABSENT:   { label: 'Absent',    color: 'text-rose-800',    bg: 'bg-rose-100',    dot: 'bg-rose-500' },
};
const TIER_COLOR: Record<PerformanceTier, string> = {
  'Excellent': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'Good': 'text-blue-700 bg-blue-50 border-blue-200',
  'Average': 'text-amber-700 bg-amber-50 border-amber-200',
  'Needs Improvement': 'text-rose-700 bg-rose-50 border-rose-200',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Active now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface StaffRosterViewProps { orgId?: string; }

export const StaffRosterView: React.FC<StaffRosterViewProps> = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'ALL'>('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<ShiftStatus | 'ALL'>('ALL');
  const [tierFilter, setTierFilter] = useState<PerformanceTier | 'ALL'>('ALL');
  const [view, setView] = useState<'roster' | 'leaderboard' | 'analytics'>('roster');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'efficiency' | 'orders' | 'attendance'>('rating');

  useEffect(() => { setStaff(loadStaff()); }, []);

  const updateStatus = (id: string, status: ShiftStatus) => {
    setStaff(prev => { const u = prev.map(s => s.id === id ? { ...s, status } : s); saveStaff(u); return u; });
    if (selectedStaff?.id === id) setSelectedStaff(prev => prev ? { ...prev, status } : null);
  };

  const branches = ['ALL', ...Array.from(new Set(staff.map(s => s.branch)))];
  const roles = Array.from(new Set(SEED_STAFF.map(s => s.role)));

  const filtered = staff.filter(s => {
    const q = search.toLowerCase();
    return (!q || s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.branch.toLowerCase().includes(q)) &&
      (roleFilter === 'ALL' || s.role === roleFilter) &&
      (branchFilter === 'ALL' || s.branch === branchFilter) &&
      (statusFilter === 'ALL' || s.status === statusFilter) &&
      (tierFilter === 'ALL' || s.tier === tierFilter);
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.customerRating - a.customerRating;
    if (sortBy === 'efficiency') return b.efficiencyScore - a.efficiencyScore;
    if (sortBy === 'orders') return b.ordersHandled - a.ordersHandled;
    return b.attendanceRate - a.attendanceRate;
  });

  const onDuty = staff.filter(s => s.status === 'ON_DUTY').length;
  const onBreak = staff.filter(s => s.status === 'ON_BREAK').length;
  const absent = staff.filter(s => s.status === 'ABSENT').length;
  const avgRating = staff.length > 0 ? (staff.reduce((s, m) => s + m.customerRating, 0) / staff.length).toFixed(1) : '0';
  const topPerformer = [...staff].sort((a, b) => b.efficiencyScore - a.efficiencyScore)[0];

  const exportCSV = () => {
    const rows = [
      ['Name', 'Role', 'Branch', 'Status', 'Shifts', 'Orders', 'Rating', 'Efficiency', 'Attendance%', 'Incentive'],
      ...filtered.map(s => [s.name, s.role, s.branch, s.status, `${s.shiftsCompleted}/${s.shiftsScheduled}`, s.ordersHandled, s.customerRating, s.efficiencyScore, s.attendanceRate, s.incentiveEarned])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `staff_roster_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Branch performance for analytics
  const branchStats = branches.filter(b => b !== 'ALL').map(b => {
    const members = staff.filter(s => s.branch === b);
    return {
      branch: b,
      count: members.length,
      onDuty: members.filter(s => s.status === 'ON_DUTY').length,
      avgRating: members.length > 0 ? (members.reduce((s, m) => s + m.customerRating, 0) / members.length).toFixed(1) : '0',
      avgEfficiency: members.length > 0 ? Math.round(members.reduce((s, m) => s + m.efficiencyScore, 0) / members.length) : 0,
      totalIncentive: members.reduce((s, m) => s + m.incentiveEarned, 0),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1F313D]">Staff Roster & Score</h1>
          <p className="text-sm text-[#7A7268] mt-0.5">Monitor staff performance, shifts, and efficiency scores</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition">
          <Download className="w-3.5 h-3.5" /> Export Roster
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Staff', value: staff.length.toString(), icon: Users, color: 'text-[#1F313D]', bg: 'bg-[#1F313D]/10' },
          { label: 'On Duty Now', value: onDuty.toString(), icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100' },
          { label: 'On Break', value: onBreak.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Absent Today', value: absent.toString(), icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-100' },
          { label: 'Avg Rating', value: `${avgRating} ★`, icon: Star, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Top Performer', value: topPerformer?.name.split(' ')[0] ?? '—', icon: Award, color: 'text-[#79415A]', bg: 'bg-[#79415A]/10' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E5DDD2] shadow-xs">
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className="text-lg font-black text-[#1F313D] truncate">{k.value}</div>
              <div className="text-[11px] text-[#7A7268]">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Top Performer Banner */}
      {topPerformer && (
        <div className="bg-[#1F313D] text-white rounded-[24px] p-5 flex flex-wrap items-center gap-4">
          <img src={topPerformer.avatar} alt={topPerformer.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/30" />
          <div className="flex-1">
            <div className="text-[10px] font-bold bg-amber-400 text-black px-2 py-0.5 rounded-full inline-block mb-1">🏆 Top Performer This Month</div>
            <h3 className="font-serif font-bold text-base">{topPerformer.name}</h3>
            <p className="text-xs text-[#E5C9B3]/80">{topPerformer.role} · {topPerformer.branch}</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-xl font-black">{topPerformer.efficiencyScore}%</div>
              <div className="text-[11px] text-[#E5C9B3]/80">Efficiency</div>
            </div>
            <div>
              <div className="text-xl font-black text-amber-400">{topPerformer.customerRating} ★</div>
              <div className="text-[11px] text-[#E5C9B3]/80">Rating</div>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-400">₹{topPerformer.incentiveEarned.toLocaleString()}</div>
              <div className="text-[11px] text-[#E5C9B3]/80">Incentive</div>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {(['roster', 'leaderboard', 'analytics'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${view === v ? 'bg-[#79415A] text-white' : 'bg-[#EFE9DF] text-[#5C5549] hover:bg-[#E5DDD2]'}`}>
            {v === 'roster' ? '👥 Roster' : v === 'leaderboard' ? '🏅 Leaderboard' : '📊 Branch Analytics'}
          </button>
        ))}
      </div>

      {view === 'analytics' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {branchStats.map(bs => (
              <div key={bs.branch} className="bg-[#FAF7F2] rounded-[24px] p-5 border border-[#E5DDD2]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif font-bold text-sm text-[#1F313D]">{bs.branch}</h3>
                  <span className="text-xs font-bold text-[#79415A]">{bs.count} staff</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-lg font-black text-emerald-700">{bs.onDuty}</div>
                    <div className="text-[10px] text-[#7A7268]">On Duty</div>
                  </div>
                  <div className="p-3 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-lg font-black text-amber-600">{bs.avgRating} ★</div>
                    <div className="text-[10px] text-[#7A7268]">Avg Rating</div>
                  </div>
                  <div className="p-3 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-lg font-black text-indigo-700">{bs.avgEfficiency}%</div>
                    <div className="text-[10px] text-[#7A7268]">Avg Efficiency</div>
                  </div>
                  <div className="p-3 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-lg font-black text-[#79415A]">₹{(bs.totalIncentive / 1000).toFixed(1)}K</div>
                    <div className="text-[10px] text-[#7A7268]">Incentives</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-semibold">
                    <span className="text-[#5C5549]">Avg Efficiency</span>
                    <span className="text-[#1F313D]">{bs.avgEfficiency}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#EAE4D9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#79415A] rounded-full" style={{ width: `${bs.avgEfficiency}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tier Distribution */}
          <div className="bg-[#FAF7F2] rounded-[24px] p-6 border border-[#E5DDD2]">
            <h3 className="font-serif font-bold text-base text-[#1F313D] mb-4">Performance Tier Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['Excellent', 'Good', 'Average', 'Needs Improvement'] as PerformanceTier[]).map(tier => {
                const count = staff.filter(s => s.tier === tier).length;
                const pct = staff.length > 0 ? Math.round((count / staff.length) * 100) : 0;
                return (
                  <div key={tier} className={`p-4 rounded-2xl border ${TIER_COLOR[tier]}`}>
                    <div className="text-2xl font-black">{count}</div>
                    <div className="text-xs font-bold mt-0.5">{tier}</div>
                    <div className="text-[11px] opacity-70">{pct}% of team</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : view === 'leaderboard' ? (
        <div className="space-y-3">
          {/* Sort options */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-[#5C5549]">Rank by:</span>
            {(['rating', 'efficiency', 'orders', 'attendance'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${sortBy === s ? 'bg-[#79415A] text-white' : 'bg-[#EFE9DF] text-[#5C5549] hover:bg-[#E5DDD2]'}`}>
                {s === 'rating' ? '⭐ Customer Rating' : s === 'efficiency' ? '⚡ Efficiency' : s === 'orders' ? '📦 Orders Handled' : '📅 Attendance'}
              </button>
            ))}
          </div>

          {filtered.map((member, idx) => {
            const sc = SHIFT_CONFIG[member.status];
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            return (
              <div key={member.id}
                className={`p-4 rounded-2xl border flex flex-wrap items-center gap-4 transition cursor-pointer ${idx < 3 ? 'bg-gradient-to-r from-[#FAF7F2] to-white border-[#DDD5C7] shadow-sm' : 'bg-[#FAF7F2] border-[#E5DDD2]'}`}
                onClick={() => setSelectedStaff(member)}>
                <div className="text-lg font-black w-8 text-center">{medal}</div>
                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-[#DDD5C7]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-[#1F313D]">{member.name}</h4>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${TIER_COLOR[member.tier]}`}>{member.tier}</span>
                    <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A7268] mt-0.5">{member.role} · {member.branch}</p>
                </div>
                <div className="flex gap-5 text-center shrink-0">
                  <div>
                    <div className="text-xs font-black text-amber-600">{member.customerRating} ★</div>
                    <div className="text-[10px] text-[#7A7268]">Rating</div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#1F313D]">{member.efficiencyScore}%</div>
                    <div className="text-[10px] text-[#7A7268]">Efficiency</div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#1F313D]">{member.ordersHandled}</div>
                    <div className="text-[10px] text-[#7A7268]">Orders</div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-700">{member.attendanceRate}%</div>
                    <div className="text-[10px] text-[#7A7268]">Attendance</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Roster View ── */
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7268]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#79415A]/30" />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                <option value="ALL">All Roles</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                {branches.map(b => <option key={b} value={b}>{b === 'ALL' ? 'All Branches' : b}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                <option value="ALL">All Statuses</option>
                {(['ON_DUTY', 'ON_BREAK', 'OFF_DUTY', 'ABSENT'] as ShiftStatus[]).map(s => (
                  <option key={s} value={s}>{SHIFT_CONFIG[s].label}</option>
                ))}
              </select>
              <select value={tierFilter} onChange={e => setTierFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                <option value="ALL">All Tiers</option>
                {(['Excellent', 'Good', 'Average', 'Needs Improvement'] as PerformanceTier[]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Staff Cards */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-16 bg-[#FAF7F2] rounded-2xl border border-[#E5DDD2]">
                  <Users className="w-10 h-10 text-[#DDD5C7] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#5C5549]">No staff members found</p>
                </div>
              ) : filtered.map(member => {
                const sc = SHIFT_CONFIG[member.status];
                const isSelected = selectedStaff?.id === member.id;
                return (
                  <div key={member.id}
                    onClick={() => setSelectedStaff(isSelected ? null : member)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'border-[#79415A] bg-white shadow-md' : 'border-[#DDD5C7] bg-[#FAF7F2] hover:bg-white'}`}>
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <img src={member.avatar} alt={member.name} className="w-11 h-11 rounded-full object-cover border border-[#DDD5C7]" />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${sc.dot}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-[#1F313D]">{member.name}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${TIER_COLOR[member.tier]}`}>{member.tier}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                        </div>
                        <p className="text-[11px] text-[#7A7268] mt-0.5">{member.role} · {member.branch}</p>
                        <p className="text-[10px] text-[#9A8E82] mt-0.5">Last active: {timeAgo(member.lastActive)}</p>
                      </div>
                      <div className="flex gap-4 text-center shrink-0">
                        <div>
                          <div className="text-xs font-black text-amber-600">{member.customerRating} ★</div>
                          <div className="text-[10px] text-[#7A7268]">Rating</div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#1F313D]">{member.efficiencyScore}%</div>
                          <div className="text-[10px] text-[#7A7268]">Score</div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#1F313D]">{member.shiftsCompleted}/{member.shiftsScheduled}</div>
                          <div className="text-[10px] text-[#7A7268]">Shifts</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staff Detail Panel */}
          {selectedStaff && (
            <div className="w-full lg:w-72 shrink-0">
              <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5 sticky top-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-[#1F313D]">Staff Profile</h3>
                  <button onClick={() => setSelectedStaff(null)} className="text-[#7A7268] hover:text-[#1F313D] text-xs">✕</button>
                </div>

                <div className="text-center">
                  <img src={selectedStaff.avatar} alt={selectedStaff.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#79415A]/30 mx-auto" />
                  <h4 className="font-serif font-bold text-sm text-[#1F313D] mt-2">{selectedStaff.name}</h4>
                  <p className="text-xs text-[#7A7268]">{selectedStaff.role}</p>
                  <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${TIER_COLOR[selectedStaff.tier]}`}>{selectedStaff.tier}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-sm font-black text-amber-600">{selectedStaff.customerRating} ★</div>
                    <div className="text-[10px] text-[#7A7268]">Customer Rating</div>
                  </div>
                  <div className="p-2.5 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-sm font-black text-[#1F313D]">{selectedStaff.efficiencyScore}%</div>
                    <div className="text-[10px] text-[#7A7268]">Efficiency</div>
                  </div>
                  <div className="p-2.5 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-sm font-black text-[#1F313D]">{selectedStaff.ordersHandled}</div>
                    <div className="text-[10px] text-[#7A7268]">Orders</div>
                  </div>
                  <div className="p-2.5 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-sm font-black text-emerald-700">{selectedStaff.attendanceRate}%</div>
                    <div className="text-[10px] text-[#7A7268]">Attendance</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="w-3.5 h-3.5 text-[#7A7268]" />
                    <span className="text-[#1F313D]">{selectedStaff.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="w-3.5 h-3.5 text-[#7A7268]" />
                    <span className="text-[#1F313D] truncate">{selectedStaff.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-[#7A7268]" />
                    <span className="text-[#1F313D]">Joined {new Date(selectedStaff.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#EFE9DF] rounded-xl">
                  <div className="text-[11px] text-[#7A7268] font-medium mb-1">Incentive Earned</div>
                  <div className="text-lg font-black text-[#79415A]">₹{selectedStaff.incentiveEarned.toLocaleString()}</div>
                  <div className="text-[10px] text-[#7A7268]">{selectedStaff.totalHours}h worked this month</div>
                </div>

                {selectedStaff.notes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    {selectedStaff.notes}
                  </div>
                )}

                <div>
                  <div className="text-[11px] text-[#7A7268] font-medium mb-2">Update Status</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['ON_DUTY', 'ON_BREAK', 'OFF_DUTY', 'ABSENT'] as ShiftStatus[]).map(s => {
                      const cfg = SHIFT_CONFIG[s];
                      return (
                        <button key={s} onClick={() => updateStatus(selectedStaff.id, s)}
                          className={`py-1.5 rounded-xl text-[10px] font-bold transition ${selectedStaff.status === s ? `${cfg.bg} ${cfg.color} ring-1 ring-current` : 'bg-[#EFE9DF] text-[#5C5549] hover:bg-[#E5DDD2]'}`}>
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
