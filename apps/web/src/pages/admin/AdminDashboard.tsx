import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';
import { clearCurrentSession, getCurrentUser } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  Settings,
  Bell,
  Search,
  LogOut,
  TrendingUp,
  TrendingDown,
  Clock,
  CreditCard,
  Banknote,
  DollarSign,
  Star,
  ChevronRight,
  Filter,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Building,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HeartHandshake,
  Award,
  Megaphone,
  UserCheck,
  UserX,
  X,
  MessageSquareWarning,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Flame,
  Check,
  Coffee
} from 'lucide-react';

type DateFilter = 'today' | '7days' | 'month' | '30days';
type BranchFilter = 'all' | 'downtown' | 'uptown' | 'westside' | 'airport';
type SalesTimeframe = 'daily' | 'weekly' | 'monthly';

interface DrillDownModalData {
  type: 'customers' | 'reservations' | 'orders' | 'complaints' | 'campaigns' | 'staff' | 'menu';
  title: string;
  subtitle: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'reservations' | 'orders' | 'campaigns' | 'staff'>('overview');

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [branchFilter, setBranchFilter] = useState<BranchFilter>('all');
  const [salesTimeframe, setSalesTimeframe] = useState<SalesTimeframe>('monthly');

  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  // Drill-down modal state
  const [drillDown, setDrillDown] = useState<DrillDownModalData | null>(null);

  // Complaints state for interactive resolution
  const [complaints, setComplaints] = useState([
    { id: 'CMP-204', customer: 'Sophia Bennett', table: 'Table 4', issue: 'Cold brew took 15 mins to arrive', severity: 'High', status: 'Pending', time: '18m ago' },
    { id: 'CMP-203', customer: 'Liam Henderson', table: 'Table 12', issue: 'Requested oat milk, received whole milk', severity: 'Medium', status: 'In Review', time: '42m ago' },
    { id: 'CMP-202', customer: 'Ava Richardson', table: 'Takeaway #108', issue: 'Caramel Macchiato missing caramel drizzle', severity: 'Low', status: 'Pending', time: '1h ago' },
    { id: 'CMP-201', customer: 'Ethan Brooks', table: 'Table 7', issue: 'WiFi disconnection at patio table', severity: 'Low', status: 'Pending', time: '2h ago' },
  ]);

  // Reservations state for interactive confirmation
  const [reservations, setReservations] = useState([
    { id: 'RES-801', name: 'Marcus Sterling', guests: 4, date: 'Today, 7:30 PM', table: 'Booth 3', branch: 'Downtown Flagship', status: 'Pending' },
    { id: 'RES-802', name: 'Elena Rostova', guests: 2, date: 'Today, 8:00 PM', table: 'Window 5', branch: 'Uptown Roastery', status: 'Confirmed' },
    { id: 'RES-803', name: 'Devon Vance', guests: 6, date: 'Tomorrow, 1:00 PM', table: 'Patio 2', branch: 'Westside Lounge', status: 'Pending' },
    { id: 'RES-804', name: 'Chloe Dubois', guests: 3, date: 'Tomorrow, 6:30 PM', table: 'Table 8', branch: 'Downtown Flagship', status: 'Confirmed' },
    { id: 'RES-805', name: 'Aiden Patel', guests: 8, date: 'Friday, 8:30 PM', table: 'VIP Room', branch: 'Airport Kiosk', status: 'Pending' },
  ]);

  // Auto-refresh timer loop (every 30s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerRefresh();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 600);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    clearCurrentSession();
    navigate('/login');
  };

  const confirmReservation = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Confirmed' } : r))
    );
  };

  const resolveComplaint = (id: string) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Resolved' } : c))
    );
  };

  // Branch multi-multiplier for dynamic filtering
  const branchMultiplier = branchFilter === 'all' ? 1 : branchFilter === 'downtown' ? 0.42 : branchFilter === 'uptown' ? 0.28 : branchFilter === 'westside' ? 0.20 : 0.10;
  const dateMultiplier = dateFilter === 'today' ? 0.04 : dateFilter === '7days' ? 0.24 : dateFilter === 'month' ? 1.0 : 0.92;

  // Filter-reactive metrics
  const totalCustomers = Math.round(4820 * branchMultiplier * (dateFilter === 'today' ? 0.12 : 1));
  const newCustomers = Math.round(342 * branchMultiplier * dateMultiplier);
  const activeCustomers = Math.round(totalCustomers * 0.81);
  const inactiveCustomers = totalCustomers - activeCustomers;
  const totalReservations = Math.round(486 * branchMultiplier * dateMultiplier);
  const pendingReservationsCount = reservations.filter((r) => r.status === 'Pending').length;
  const totalOrders = Math.round(1250 * branchMultiplier * dateMultiplier);
  const totalRevenue = Math.round(15750 * branchMultiplier * dateMultiplier);
  const averageOrderValue = '$' + (28.5 + (branchFilter === 'downtown' ? 3.5 : 0)).toFixed(2);
  const retentionRate = (78.4 + (branchFilter === 'uptown' ? 1.8 : 0)).toFixed(1) + '%';
  const repeatRate = '64.2%';
  const loyaltyMembers = Math.round(1420 * branchMultiplier);
  const pendingComplaintsCount = complaints.filter((c) => c.status === 'Pending').length;

  const salesValues = {
    daily: '$1,550',
    weekly: '$10,850',
    monthly: '$46,200',
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f8] text-[#1e293b] font-sans antialiased">
      <SEOHead
        title="Restaurant Operations CRM Dashboard | Cafe's Corner"
        description="Comprehensive restaurant CRM dashboard: customers, reservations, orders, revenue, staff performance, campaigns and analytics."
        canonicalPath="/admin/dashboard"
      />

      {/* ── Slim Left Icon Sidebar ── */}
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 justify-between select-none shrink-0 shadow-sm z-20">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Logo Mark */}
          <Link
            to="/"
            title="Cafe's Corner"
            className="w-12 h-12 flex items-center justify-center hover:scale-105 transition-transform"
          >
            <img src="/logo.png" alt="Cafe's Corner" className="w-full h-full object-contain filter drop-shadow-sm" />
          </Link>

          {/* Navigation Icons */}
          <nav className="flex flex-col items-center gap-3 w-full">
            <button
              onClick={() => setActiveTab('overview')}
              title="Operations Overview"
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-orange-50 text-[#f95721] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              title="Customer CRM & Loyalty"
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'customers'
                  ? 'bg-orange-50 text-[#f95721] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              title="Table Reservations"
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'reservations'
                  ? 'bg-orange-50 text-[#f95721] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              title="Orders & Sales"
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-orange-50 text-[#f95721] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              title="Marketing Campaigns"
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-orange-50 text-[#f95721] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Megaphone className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              title="Staff Performance"
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'staff'
                  ? 'bg-orange-50 text-[#f95721] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Award className="w-5 h-5" />
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-4">
          <button
            title="Settings"
            className="p-3 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-3 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header with Filters & Auto-Refresh */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {activeTab === 'overview' && 'Cafe Operations & CRM Command'}
                {activeTab === 'customers' && 'Customer Intelligence & Loyalty'}
                {activeTab === 'reservations' && 'Table Reservations Management'}
                {activeTab === 'orders' && 'Orders, POS & Sales Pipeline'}
                {activeTab === 'campaigns' && 'Marketing Campaigns Performance'}
                {activeTab === 'staff' && 'Barista & Staff Performance'}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Cafe's Corner
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live multi-branch telemetry, customer retention, sales analytics, and operational tracking.
            </p>
          </div>

          {/* Right Controls: Date Filter, Branch Filter, Auto-Refresh & Profile */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Branch-wise Filtering */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value as BranchFilter)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">All Branches (4)</option>
                <option value="downtown">Downtown Flagship</option>
                <option value="uptown">Uptown Roastery</option>
                <option value="westside">Westside Lounge</option>
                <option value="airport">Airport Express Kiosk</option>
              </select>
            </div>

            {/* Date-wise Filtering */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            {/* Auto-Refresh Toggle & Manual Trigger */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={autoRefresh ? 'Disable live auto-sync' : 'Enable live auto-sync'}
                className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900"
              >
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>Auto: {autoRefresh ? `${countdown}s` : 'Off'}</span>
              </button>

              <div className="h-3.5 w-px bg-slate-300 mx-0.5" />

              <button
                onClick={triggerRefresh}
                disabled={isRefreshing}
                title="Refresh dashboard data immediately"
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
              </button>
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-full pl-1.5 pr-3.5 py-1">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover"
              />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.fullName || 'George Daniel'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Branch Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Dashboard Body ── */}
        <main className="p-8 space-y-7 max-w-[1720px] w-full mx-auto">
          {/* Status ticker */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-white border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-700">Data Stream Active:</span>
              <span>Showing stats for <strong>{branchFilter === 'all' ? 'All Branches' : branchFilter.toUpperCase()}</strong> ({dateFilter.toUpperCase()})</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Last synced: <strong>{lastRefreshed}</strong></span>
              <span className="text-slate-300">|</span>
              <span className="text-orange-600 font-semibold cursor-pointer hover:underline" onClick={() => triggerRefresh()}>
                Sync Now
              </span>
            </div>
          </div>

          {/* ── SECTION 1: CORE KPI CARDS WITH DRILL-DOWN CAPABILITY ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Total Customer & New Customers */}
            <div
              onClick={() => setDrillDown({ type: 'customers', title: 'Customer Database & Segments', subtitle: `${totalCustomers} total registered patrons` })}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-orange-400/50 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-orange-50 text-[#f95721] group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-600">Total Customers</span>
                </div>
                <span className="text-[11px] font-semibold text-orange-600 group-hover:underline flex items-center gap-0.5">
                  Drill down <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="my-3">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCustomers.toLocaleString()}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> +{newCustomers} new
                  </span>
                  <span className="text-slate-500">
                    <strong className="text-emerald-700">{activeCustomers}</strong> active · <span className="text-slate-400">{inactiveCustomers} inact.</span>
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 2: Total Revenue & Multi-Timeframe Sales */}
            <div
              onClick={() => setDrillDown({ type: 'orders', title: 'Sales & Revenue Analysis', subtitle: `Financial breakdown across ${dateFilter}` })}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-orange-400/50 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-600">Total Revenue</span>
                </div>
                {/* Daily / Weekly / Monthly Quick Switcher */}
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[10px] font-bold" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSalesTimeframe('daily')}
                    className={`px-1.5 py-0.5 rounded ${salesTimeframe === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                  >
                    D
                  </button>
                  <button
                    onClick={() => setSalesTimeframe('weekly')}
                    className={`px-1.5 py-0.5 rounded ${salesTimeframe === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                  >
                    W
                  </button>
                  <button
                    onClick={() => setSalesTimeframe('monthly')}
                    className={`px-1.5 py-0.5 rounded ${salesTimeframe === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                  >
                    M
                  </button>
                </div>
              </div>
              <div className="my-3">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">${totalRevenue.toLocaleString()}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    {salesTimeframe === 'daily' ? 'Daily Sales:' : salesTimeframe === 'weekly' ? 'Weekly Sales:' : 'Monthly Sales:'}{' '}
                    <strong className="text-slate-800">{salesValues[salesTimeframe]}</strong>
                  </span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +8.4%
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 3: Total Orders & Average Order Value */}
            <div
              onClick={() => setDrillDown({ type: 'orders', title: 'Orders & POS Terminal Pipeline', subtitle: `${totalOrders} orders processed in current window` })}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-orange-400/50 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-orange-500 text-white">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-600">Total Orders &amp; AOV</span>
                </div>
                <span className="text-[11px] font-semibold text-orange-600 group-hover:underline flex items-center gap-0.5">
                  Drill down <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="my-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalOrders.toLocaleString()}</div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Avg Order Value</span>
                    <span className="text-lg font-bold text-slate-800">{averageOrderValue}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>Delivered: <strong className="text-slate-700">{Math.round(totalOrders * 0.86)}</strong></span>
                  <span>Kitchen: <strong className="text-amber-600">{Math.round(totalOrders * 0.10)}</strong></span>
                  <span>Canceled: <strong className="text-rose-500">{Math.round(totalOrders * 0.04)}</strong></span>
                </div>
              </div>
            </div>

            {/* KPI 4: Reservations & Pending Reservation Alert */}
            <div
              onClick={() => setDrillDown({ type: 'reservations', title: 'Table Reservation Bookings', subtitle: `${totalReservations} table bookings across branches` })}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-orange-400/50 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-600">Total Reservations</span>
                </div>
                {pendingReservationsCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {pendingReservationsCount} Pending
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">All Confirmed</span>
                )}
              </div>
              <div className="my-3">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalReservations}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Action required on <strong>{pendingReservationsCount}</strong> tables
                  </span>
                  <span className="text-purple-600 font-semibold group-hover:underline">
                    View schedule →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: RETENTION, LOYALTY & COMPLAINTS BAR ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Retention Rate & Repeat Customers */}
            <div
              onClick={() => setDrillDown({ type: 'customers', title: 'Retention & Cohort Behavior', subtitle: 'Repeat frequency and loyalty metrics' })}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm cursor-pointer hover:border-orange-300 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#f95721]" />
                  <span className="text-xs font-bold text-slate-700">Customer Retention &amp; Repeat Stats</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Top Quartile
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 my-2">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Retention Rate</span>
                  <span className="text-2xl font-black text-slate-900">{retentionRate}</span>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: retentionRate }} />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Repeat Buyers</span>
                  <span className="text-2xl font-black text-slate-900">{repeatRate}</span>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-[#f95721] h-full rounded-full" style={{ width: repeatRate }} />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                64% of customers visit at least 3+ times every month across Cafe's Corner branches.
              </p>
            </div>

            {/* Active Loyalty Members */}
            <div
              onClick={() => setDrillDown({ type: 'customers', title: 'Loyalty Rewards Program', subtitle: 'Point balances and tier distributions' })}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm cursor-pointer hover:border-orange-300 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-700">Active Loyalty Members</span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Coffee Club
                </span>
              </div>
              <div className="flex items-baseline justify-between my-2">
                <div>
                  <span className="text-2xl font-black text-slate-900">{loyaltyMembers.toLocaleString()}</span>
                  <span className="text-[11px] text-emerald-600 font-semibold ml-2">+18% this month</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">94.2k pts issued</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                <span>Gold Tier: <strong>320</strong></span>
                <span>Silver: <strong>540</strong></span>
                <span>Bronze: <strong>560</strong></span>
              </div>
            </div>

            {/* Pending Complaints & Quality Health */}
            <div
              onClick={() => setDrillDown({ type: 'complaints', title: 'Customer Feedback & Complaints', subtitle: 'Live unresolved customer tickets' })}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm cursor-pointer hover:border-orange-300 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquareWarning className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-slate-700">Pending Complaints</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pendingComplaintsCount > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700'}`}>
                  {pendingComplaintsCount} Unresolved
                </span>
              </div>
              <div className="flex items-baseline justify-between my-2">
                <div>
                  <span className="text-2xl font-black text-rose-600">{pendingComplaintsCount}</span>
                  <span className="text-xs text-slate-400 ml-2">tickets needing manager review</span>
                </div>
                <span className="text-xs font-bold text-orange-600 hover:underline">
                  Resolve →
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Avg resolution time: <strong>24 mins</strong></span>
                <span className="text-emerald-600 font-semibold">98.2% Satisfaction</span>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: ANALYTICS CHARTS & RECENT POS ACTIVITY ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Dual Curve Operational Cost vs Revenue Chart */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Branch Operational Cost vs Revenue Analytics</h2>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">${(totalRevenue * 0.95).toFixed(0)}</span>
                    <span className="text-xs font-medium text-slate-400">Total Sales Volume</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                    Sales Revenue
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f95721]" />
                    Operational Cost
                  </span>
                  <button
                    onClick={() => setDrillDown({ type: 'orders', title: 'Operational Cost vs Sales Drill-Down', subtitle: 'Granular breakdown of cost centers and revenues' })}
                    className="border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                  >
                    Details <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Dynamic SVG Visual Curve Chart */}
              <div className="w-full h-64 pt-4 relative select-none">
                <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 font-mono pointer-events-none pb-6">
                  <div className="border-b border-slate-100 flex justify-between"><span>$20k</span></div>
                  <div className="border-b border-slate-100 flex justify-between"><span>$15k</span></div>
                  <div className="border-b border-slate-100 flex justify-between"><span>$10k</span></div>
                  <div className="border-b border-slate-100 flex justify-between"><span>$5k</span></div>
                  <div className="border-b border-slate-100 flex justify-between"><span>$0</span></div>
                </div>

                <svg className="w-full h-full overflow-visible" viewBox="0 0 700 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f95721" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f95721" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Dark line (Sales) */}
                  <path
                    d="M 20,130 Q 90,70 160,95 T 300,55 T 440,35 T 570,80 T 680,60"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Orange line (Cost) */}
                  <path
                    d="M 20,150 Q 90,110 160,125 T 300,90 T 440,75 T 570,110 T 680,95"
                    fill="none"
                    stroke="#f95721"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Highlight indicators on Outlet 03 / peak */}
                  <circle cx="440" cy="35" r="5" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="440" cy="75" r="5" fill="#f95721" stroke="#ffffff" strokeWidth="2" />

                  <rect x="405" y="10" width="70" height="20" rx="6" fill="#0f172a" />
                  <text x="440" y="24" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">Peak: $16.8K</text>
                </svg>

                <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 px-2">
                  <span>Downtown (01)</span>
                  <span>Uptown (02)</span>
                  <span className="text-[#f95721] font-bold">Westside (03)</span>
                  <span>Airport (04)</span>
                  <span>Delivery Hub</span>
                  <span>Event Catering</span>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Top Selling Menu Items */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <h2 className="text-base font-bold text-slate-900">Top-Selling Menu Items</h2>
                  </div>
                  <button
                    onClick={() => setDrillDown({ type: 'menu', title: 'Top-Selling Menu & Category Catalog', subtitle: 'Full sales ranking and stock availability' })}
                    className="text-xs text-orange-600 font-semibold hover:underline"
                  >
                    View all →
                  </button>
                </div>

                <div className="space-y-3.5">
                  {[
                    { name: 'Iced Caramel Macchiato', category: 'Cold Brew', orders: '420 orders', price: '$6.50', rating: '4.9', img: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=160&auto=format&fit=crop&q=80' },
                    { name: 'Artisan Espresso Tonic', category: 'Signature', orders: '385 orders', price: '$5.80', rating: '4.8', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=160&auto=format&fit=crop&q=80' },
                    { name: 'Fish & Chips British Classic', category: 'Kitchen', orders: '310 orders', price: '$14.00', rating: '4.7', img: 'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=160&auto=format&fit=crop&q=80' },
                    { name: 'Butter Truffle Croissant', category: 'Bakery', orders: '290 orders', price: '$4.50', rating: '4.9', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=160&auto=format&fit=crop&q=80' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                      <img src={item.img} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-semibold">{item.orders}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">{item.price}</div>
                        <div className="text-[10px] text-amber-500 font-bold flex items-center justify-end gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {item.rating}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Top category: <strong>Beverages (58%)</strong></span>
                <span className="text-emerald-600 font-semibold">+14% vs prev week</span>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: VIP CUSTOMERS, MARKETING CAMPAIGNS & STAFF PERFORMANCE ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Top VIP Customers */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <h2 className="text-base font-bold text-slate-900">Top VIP Customers</h2>
                  </div>
                  <button
                    onClick={() => setDrillDown({ type: 'customers', title: 'Top Patron Leaderboard', subtitle: 'High lifetime value customer profiles' })}
                    className="text-xs text-orange-600 font-semibold hover:underline"
                  >
                    View all →
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'Dr. Evelyn Thorne', spent: '$1,480', visits: '48 visits', tier: 'Platinum', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80' },
                    { name: 'Alexander Wright', spent: '$1,240', visits: '39 visits', tier: 'Gold', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
                    { name: 'Camila Rodriguez', spent: '$980', visits: '31 visits', tier: 'Gold', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
                    { name: 'Julian Hayes', spent: '$850', visits: '27 visits', tier: 'Silver', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
                  ].map((vip, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition">
                      <img src={vip.img} alt={vip.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{vip.name}</div>
                        <div className="text-[11px] text-slate-400">{vip.visits} · <span className="text-slate-600 font-medium">{vip.tier}</span></div>
                      </div>
                      <div className="text-xs font-black text-emerald-600">{vip.spent}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-400">
                VIP patrons generate <strong>38% of monthly recurring revenue</strong>.
              </div>
            </div>

            {/* 2. Marketing Campaign Performance */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[#f95721]" />
                    <h2 className="text-base font-bold text-slate-900">Campaign Performance</h2>
                  </div>
                  <button
                    onClick={() => setDrillDown({ type: 'campaigns', title: 'Marketing Campaigns Hub', subtitle: 'ROI, email & SMS promotion tracking' })}
                    className="text-xs text-orange-600 font-semibold hover:underline"
                  >
                    Manage →
                  </button>
                </div>

                <div className="space-y-3.5">
                  {[
                    { title: 'Morning Brew 2-for-1', type: 'SMS Promo', converted: '64%', revenue: '+$3,450', status: 'Active' },
                    { title: 'Weekend Brunch Pass', type: 'Email Campaign', converted: '48%', revenue: '+$4,120', status: 'Active' },
                    { title: 'VIP Cold Brew Club', type: 'In-App Rewards', converted: '82%', revenue: '+$2,800', status: 'Completed' },
                    { title: 'Rainy Day Croissant Deal', type: 'Geo Push Notification', converted: '35%', revenue: '+$1,190', status: 'Active' },
                  ].map((camp, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{camp.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{camp.type} · <span className="text-emerald-700 font-semibold">{camp.converted} conv.</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">{camp.revenue}</div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${camp.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {camp.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Total Campaign ROI: <strong className="text-slate-800">4.2x</strong></span>
                <span className="text-emerald-600 font-semibold">+$11.5k generated</span>
              </div>
            </div>

            {/* 3. Barista & Staff Performance */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-base font-bold text-slate-900">Staff Performance</h2>
                  </div>
                  <button
                    onClick={() => setDrillDown({ type: 'staff', title: 'Barista & Staff Roster', subtitle: 'Speed, orders completed and customer review ratings' })}
                    className="text-xs text-orange-600 font-semibold hover:underline"
                  >
                    Roster →
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'Lucas Scott', role: 'Head Barista', orders: '142 orders', speed: '2.4m avg', rating: '4.95', onDuty: true },
                    { name: 'Maya Lin', role: 'Floor Supervisor', orders: '118 orders', speed: '3.1m avg', rating: '4.90', onDuty: true },
                    { name: 'Kiran Rao', role: 'Pastry & Prep', orders: '96 orders', speed: '2.8m avg', rating: '4.85', onDuty: true },
                    { name: 'Tyler Reed', role: 'Cashier & POS', orders: '84 orders', speed: '1.9m avg', rating: '4.78', onDuty: false },
                  ].map((staff, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs">
                            {staff.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          {staff.onDuty && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{staff.name}</div>
                          <div className="text-[10px] text-slate-400">{staff.role} · {staff.speed}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800">{staff.orders}</div>
                        <div className="text-[10px] text-amber-500 font-bold flex items-center justify-end gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {staff.rating}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Active On Duty: <strong className="text-emerald-600">3 of 4</strong></span>
                <span>Avg fulfillment: <strong>2.6 mins</strong></span>
              </div>
            </div>
          </div>

          {/* ── SECTION 5: LIVE RESERVATIONS & COMPLAINTS WORKSTATION ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Table Reservations Management */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <h2 className="text-base font-bold text-slate-900">Table Bookings &amp; Pending Confirmations</h2>
                </div>
                <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-bold">
                  {reservations.filter((r) => r.status === 'Pending').length} Pending Approval
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {reservations.slice(0, 4).map((res) => (
                  <div key={res.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{res.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{res.guests} Guests</span>
                        <span>•</span>
                        <span>{res.date}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{res.table}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {res.status === 'Pending' ? (
                        <button
                          onClick={() => confirmReservation(res.id)}
                          className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3 h-3" /> Confirm
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Confirmed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Complaints & Feedback Resolution */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquareWarning className="w-4 h-4 text-rose-500" />
                  <h2 className="text-base font-bold text-slate-900">Customer Complaints &amp; Resolution</h2>
                </div>
                <span className="text-xs text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full font-bold">
                  {complaints.filter((c) => c.status === 'Pending').length} Active Tickets
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {complaints.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{item.customer}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.table})</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${item.severity === 'High' ? 'bg-rose-100 text-rose-800' : item.severity === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                          {item.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate mt-0.5">{item.issue}</div>
                    </div>
                    <div>
                      {item.status === 'Resolved' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Resolved
                        </span>
                      ) : (
                        <button
                          onClick={() => resolveComplaint(item.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── INTERACTIVE KPI DRILL-DOWN MODAL ── */}
      {drillDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{drillDown.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{drillDown.subtitle}</p>
                </div>
                <button
                  onClick={() => setDrillDown(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic Drill-Down Content Body */}
              <div className="py-4 space-y-4 max-h-[50vh] overflow-y-auto">
                {drillDown.type === 'customers' && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-500 font-medium">Customer Records &amp; Segment Distribution</div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Total Profiles</span>
                        <strong className="text-base text-slate-800">{totalCustomers}</strong>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl text-emerald-900">
                        <span className="text-[10px] text-emerald-700 block">Active Patrons</span>
                        <strong className="text-base">{activeCustomers} (81%)</strong>
                      </div>
                      <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                        <span className="text-[10px] text-slate-400 block">Inactive / Churn Risk</span>
                        <strong className="text-base">{inactiveCustomers} (19%)</strong>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {[
                        { name: 'Dr. Evelyn Thorne', email: 'evelyn.t@example.com', spent: '$1,480', visits: 48, status: 'Active' },
                        { name: 'Alexander Wright', email: 'alex.w@democompany.com', spent: '$1,240', visits: 39, status: 'Active' },
                        { name: 'Liam Henderson', email: 'liam.h@example.com', spent: '$760', visits: 24, status: 'Active' },
                        { name: 'Rebecca Shaw', email: 'r.shaw@company.org', spent: '$210', visits: 4, status: 'Inactive' },
                      ].map((cust, i) => (
                        <div key={i} className="py-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{cust.name}</div>
                            <div className="text-[11px] text-slate-400">{cust.email} · {cust.visits} visits</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-800">{cust.spent}</div>
                            <span className={`text-[10px] font-semibold ${cust.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>{cust.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {drillDown.type === 'reservations' && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-500 font-medium">All Table Bookings Across Selected Branch</div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {reservations.map((r) => (
                        <div key={r.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{r.name} ({r.guests} guests)</div>
                            <div className="text-[11px] text-slate-400">{r.branch} • {r.date} • {r.table}</div>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${r.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {drillDown.type === 'orders' && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-500 font-medium">Sales &amp; POS Receipts Overview</div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Daily Volume</span>
                        <strong className="text-sm text-slate-800">{salesValues.daily}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Weekly Volume</span>
                        <strong className="text-sm text-slate-800">{salesValues.weekly}</strong>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-xl text-orange-900">
                        <span className="text-orange-600 block text-[10px]">Monthly Sales</span>
                        <strong className="text-sm">{salesValues.monthly}</strong>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      Average Order Value (AOV): <strong className="text-slate-900">{averageOrderValue}</strong>. Repeat orders contribute 68% of total gross turnover.
                    </div>
                  </div>
                )}

                {drillDown.type === 'complaints' && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-500 font-medium">Active Customer Tickets &amp; Follow-up Actions</div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {complaints.map((c) => (
                        <div key={c.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{c.customer} — {c.issue}</div>
                            <div className="text-[11px] text-slate-400">{c.table} · {c.time} · Severity: {c.severity}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {c.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(drillDown.type === 'campaigns' || drillDown.type === 'staff' || drillDown.type === 'menu') && (
                  <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-2">
                    <p className="font-semibold text-slate-800">Operational Records Active</p>
                    <p>All metrics are synchronized in real-time across Cafe's Corner POS terminals and branch locations.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setDrillDown(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Close Drill-down
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
