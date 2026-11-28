import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';
import { clearCurrentSession, getCurrentUser } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { BranchManagementView } from './BranchManagementView';
import { EmployeeManagementView } from './EmployeeManagementView';
import { RolePermissionsView } from './RolePermissionsView';
import { RestaurantSettingsView } from './RestaurantSettingsView';
import { CustomerManagementView } from './CustomerManagementView';
import { CustomerSegmentationView } from './CustomerSegmentationView';
import { LeadManagementView } from './LeadManagementView';
import { ReservationManagementView } from './ReservationManagementView';
import { TableManagementView } from './TableManagementView';
import { OrderManagementView } from './OrderManagementView';
import { MenuManagementView } from './MenuManagementView';
import { BillingPaymentView } from './BillingPaymentView';
import { LoyaltyRewardsView } from './LoyaltyRewardsView';
import { MembershipManagementView } from './MembershipManagementView';
import { OrdersLivePOSView } from './OrdersLivePOSView';
import { MenuPerformanceView } from './MenuPerformanceView';
import { StaffRosterView } from './StaffRosterView';
import { MarketingCampaignsView } from './MarketingCampaignsView';
import { ComplaintsFeedbackView } from './ComplaintsFeedbackView';
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
  DollarSign,
  Star,
  ChevronRight,
  Filter,
  ArrowUpRight,
  Sparkles,
  Building,
  Calendar,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Award,
  Megaphone,
  MessageSquareWarning,
  UserCheck,
  UserPlus,
  Repeat,
  HeartHandshake,
  Crown,
  ChefHat,
  X,
  ExternalLink,
  Phone,
  Mail,
  Eye,
  Check,
  Coffee,
  HelpCircle,
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import {
  fetchAdminDashboardMetrics,
  DashboardFilterState,
  DashboardMetrics,
  DateFilterType,
  OrderTypeFilter,
  CustomerSegmentFilter,
  CustomerRecord,
  ReservationRecord,
  OrderRecord,
  ComplaintRecord,
  CampaignRecord,
  MenuItemRecord,
  StaffPerformanceRecord
} from '../../lib/adminDashboardApi';

type DrillDownType =
  | 'customers'
  | 'new_customers_today'
  | 'new_customers_week'
  | 'new_customers_month'
  | 'reservations'
  | 'orders'
  | 'revenue'
  | 'aov'
  | 'repeat_customers'
  | 'loyalty'
  | 'complaints'
  | 'campaigns'
  | 'menu_items'
  | 'top_spenders'
  | 'staff';

interface DrillDownModalState {
  type: DrillDownType;
  title: string;
  subtitle: string;
  filterStatus?: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const orgId = currentUser?.organizationId;
  const orgName = currentUser?.organizationName || "Cafe's Corner";

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'branches' | 'employees' | 'roles' | 'settings' | 'customers' | 'loyalty' | 'memberships' | 'segments' | 'leads' | 'orders' | 'reservations' | 'tables' | 'menu' | 'billing' | 'staff' | 'campaigns' | 'feedback'
  >(
    location.pathname.includes('branches')
      ? 'branches'
      : location.pathname.includes('employees')
      ? 'employees'
      : location.pathname.includes('roles')
      ? 'roles'
      : location.pathname.includes('settings')
      ? 'settings'
      : location.pathname.includes('segments')
      ? 'segments'
      : location.pathname.includes('leads')
      ? 'leads'
      : location.pathname.includes('customers')
      ? 'customers'
      : 'overview'
  );

  // Filters State
  const [filters, setFilters] = useState<DashboardFilterState>({
    branch: 'all',
    dateRange: 'week',
    orderType: 'all',
    customerSegment: 'all',
  });

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('Just now');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drilldown modal state
  const [drillDown, setDrillDown] = useState<DrillDownModalState | null>(null);
  const [drillDownSearch, setDrillDownSearch] = useState<string>('');
  const [drillDownStatusFilter, setDrillDownStatusFilter] = useState<string>('all');

  // Load metrics function
  const loadDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const data = await fetchAdminDashboardMetrics(filters, orgId);
      setMetrics(data);
      setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Dashboard metrics fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, orgId]);

  // Initial load and filter change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Realtime subscription & auto-refresh
  useEffect(() => {
    // 1. Supabase Realtime channel for instant transactional updates
    const channel = supabase
      .channel('admin-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadDashboardData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        loadDashboardData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        loadDashboardData(true);
      })
      .subscribe();

    // 2. Fallback polling every 20 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [loadDashboardData]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    clearCurrentSession();
    navigate('/login');
  };

  // Branch list
  const branches = [
    { id: 'all', name: 'All Outlets (Consolidated)' },
    { id: 'downtown', name: 'Downtown Flagship #01' },
    { id: 'uptown', name: 'Uptown Promenade #02' },
    { id: 'waterfront', name: 'Waterfront Terrace #03' },
    { id: 'airport', name: 'Airport Express Bistro #04' },
  ];

  // Helper for quick drilldown trigger
  const openDrillDown = (type: DrillDownType, title: string, subtitle: string, filterStatus = 'all') => {
    setDrillDown({ type, title, subtitle, filterStatus });
    setDrillDownSearch('');
    setDrillDownStatusFilter(filterStatus);
  };

  // Safe metrics references with defaults (0 and empty lists until real database records load)
  const m = metrics || {
    totalCustomers: 0,
    newCustomersToday: 0,
    newCustomersThisWeek: 0,
    newCustomersThisMonth: 0,
    repeatCustomerPercentage: 0,
    customerRetentionRate: 0,
    activeLoyaltyMembers: 0,
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    completedReservations: 0,
    cancelledReservations: 0,
    totalOrders: 0,
    ordersReceived: 0,
    ordersPreparing: 0,
    ordersReady: 0,
    ordersCompleted: 0,
    ordersCancelled: 0,
    totalSalesRevenue: 0,
    averageOrderValue: 0,
    pendingComplaints: 0,
    activeCampaignsCount: 0,
    revenueChart: [],
    customerAcquisitionTrends: [],
    topMenuItems: [],
    topCustomers: [],
    staffPerformance: [],
    activeCampaigns: [],
    pendingFeedbackList: [],
    recentOrdersList: [],
    reservationsList: [],
    customersList: [],
  };

  return (
    <div className="min-h-screen bg-[#EAE4D9] p-3 sm:p-5 lg:p-7 text-[#1F313D] font-sans antialiased">
      <SEOHead
        title="Restaurant Admin Portal | Cafe's Corner Operations"
        description="Comprehensive restaurant operations dashboard with live customer acquisition, revenue analytics, reservations, POS orders, staff performance, and marketing campaigns."
        canonicalPath="/admin/dashboard"
      />

      {/* Main Outer Rounded Dashboard Canvas */}
      <div className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-[32px] sm:rounded-[36px] shadow-sm overflow-hidden flex flex-col min-h-[92vh]">
        {/* Top Header */}
        <header className="px-6 lg:px-8 py-4 sm:py-5 border-b border-[#DDD5C7]/70 flex flex-wrap items-center justify-between gap-4 bg-[#FAF7F2]/50">
          <div className="flex items-center gap-6">
            {/* Logo Stamp */}
            <Link to="/" title="Cafe's Corner" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <img src="/logo.png" alt="Corner Cafe" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-serif font-black text-lg text-[#1F313D] tracking-tight block leading-none">
                  {orgName}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#82401D] font-bold">
                  Restaurant Admin Portal
                </span>
              </div>
            </Link>

            {/* Realtime Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-[#EFE9DF] border border-[#DDD5C7] px-3 py-1 rounded-full text-[11px] font-semibold text-[#5C5549]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>Live Sync Active</span>
              <span className="text-[#7A7268] font-mono text-[10px]">· {lastRefreshedAt}</span>
            </div>
          </div>

          {/* Top Controls: Search, Branch, Date, Refresh & Profile */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Manual Refresh Button */}
            <button
              onClick={() => loadDashboardData(true)}
              disabled={isRefreshing}
              title="Refresh Dashboard"
              className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DDD5C7] rounded-full px-3 py-1.5 text-xs font-semibold text-[#1F313D] hover:bg-white shadow-2xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#82401D] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DDD5C7] rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#1F313D] shadow-2xs">
              <Building className="w-3.5 h-3.5 text-[#82401D]" />
              <select
                value={filters.branch}
                onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                className="bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DDD5C7] rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#1F313D] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#82401D]" />
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as DateFilterType })}
                className="bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Notification Bell with Badge */}
            <button
              onClick={() => openDrillDown('complaints', 'Unresolved Feedback & Complaints', 'Requires customer service action')}
              className="relative w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] flex items-center justify-center text-[#5C5549] hover:text-[#1F313D] shadow-2xs transition"
              title="Complaints & Feedback"
            >
              <Bell className="w-4 h-4" />
              {m.pendingComplaints > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white">
                  {m.pendingComplaints}
                </span>
              )}
            </button>

            {/* Restaurant Settings Quick Button */}
            <button
              onClick={() => {
                setActiveTab('settings');
                navigate('/admin/settings');
              }}
              className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition shadow-2xs ${
                activeTab === 'settings'
                  ? 'bg-[#79415A] text-white border-[#79415A]'
                  : 'bg-[#FAF7F2] border-[#DDD5C7] text-[#5C5549] hover:text-[#1F313D]'
              }`}
              title="Restaurant Settings & Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 bg-[#FAF7F2] border border-[#DDD5C7] rounded-full pl-1.5 pr-3.5 py-1 shadow-2xs">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover"
              />
              <div className="text-left">
                <div className="text-xs font-bold text-[#1F313D] leading-tight">
                  {currentUser?.fullName || 'George Daniel'}
                </div>
                <div className="text-[10px] text-[#82401D] font-mono font-bold uppercase">
                  {currentUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Restaurant Admin'}
                </div>
              </div>
            </div>

            {/* Log Out */}
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-2 rounded-full text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Multi-Filter Toolbar: Branch, Date, Order Type & Customer Segment */}
        <div className="px-6 lg:px-8 py-3 bg-[#E8E1D5] border-b border-[#DDD5C7]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-[#5C5549] uppercase tracking-wider text-[11px]">
              <Filter className="w-3.5 h-3.5 text-[#79415A]" /> Filters:
            </span>

            {/* Order Type Filter */}
            <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#DDD5C7] rounded-xl px-2.5 py-1">
              <span className="text-[#7A7268] text-[11px]">Order Type:</span>
              <select
                value={filters.orderType}
                onChange={(e) => setFilters({ ...filters, orderType: e.target.value as OrderTypeFilter })}
                className="bg-transparent font-semibold text-[#1F313D] focus:outline-none cursor-pointer"
              >
                <option value="all">All Order Types</option>
                <option value="dine_in">Dine-In</option>
                <option value="takeaway">Takeaway</option>
                <option value="delivery">Online Delivery</option>
                <option value="catering">Catering</option>
              </select>
            </div>

            {/* Customer Segment Filter */}
            <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#DDD5C7] rounded-xl px-2.5 py-1">
              <span className="text-[#7A7268] text-[11px]">Customer Segment:</span>
              <select
                value={filters.customerSegment}
                onChange={(e) => setFilters({ ...filters, customerSegment: e.target.value as CustomerSegmentFilter })}
                className="bg-transparent font-semibold text-[#1F313D] focus:outline-none cursor-pointer"
              >
                <option value="all">All Segments</option>
                <option value="vip">VIP High-Spenders</option>
                <option value="regular">Regular Patrons</option>
                <option value="first_time">First-Time Diners</option>
                <option value="at_risk">At-Risk / Lapsed</option>
                <option value="loyalty_gold">Gold & Platinum Tier</option>
              </select>
            </div>
          </div>

          {/* Quick Active Filter Pill Summary */}
          <div className="flex items-center gap-2">
            {(filters.branch !== 'all' || filters.orderType !== 'all' || filters.customerSegment !== 'all') && (
              <button
                onClick={() => setFilters({ branch: 'all', dateRange: 'week', orderType: 'all', customerSegment: 'all' })}
                className="text-[11px] text-[#79415A] hover:underline font-bold"
              >
                Reset Filters
              </button>
            )}
            <span className="text-[11px] text-[#7A7268]">
              Showing data for <strong className="text-[#1F313D]">{filters.branch === 'all' ? 'All Outlets' : filters.branch}</strong> ({filters.dateRange})
            </span>
          </div>
        </div>

        {/* Dashboard Shell: Left Navigation Sidebar + Main Canvas */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left Hero Sidebar */}
          <aside className="w-full lg:w-64 p-6 lg:p-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#DDD5C7]/70 shrink-0 bg-[#EFE9DF]">
            <div>
              {/* Editorial Welcome Header */}
              <div className="mb-7">
                <h2 className="font-serif text-2xl font-bold text-[#1F313D] tracking-tight leading-tight">
                  Restaurant<br />Operations
                </h2>
                <p className="text-xs text-[#7A7268] mt-1 font-medium">
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Vertical Navigation Pills */}
              <nav className="space-y-1.5">
                {[
                  { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
                  { id: 'branches', label: 'Branch Management', icon: Building, badge: '4 outlets' },
                  { id: 'employees', label: 'Employee Management', icon: UserCheck },
                  { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
                  { id: 'settings', label: 'Restaurant Settings', icon: Settings },
                  { id: 'customers', label: 'Patrons & Retention', icon: Users, badge: m.totalCustomers.toLocaleString() },
                  { id: 'loyalty', label: 'Loyalty & Rewards', icon: Award, badge: 'Rewards' },
                  { id: 'memberships', label: 'Membership Plans', icon: Crown, badge: 'Clubs' },
                  { id: 'segments', label: 'Customer Segments', icon: SlidersHorizontal, badge: '8 cohorts' },
                  { id: 'leads', label: 'Inbound Leads & Sales', icon: UserPlus, badge: '7 active' },
                  { id: 'reservations', label: 'Table Reservations', icon: Calendar, badge: m.pendingReservations > 0 ? `${m.pendingReservations} new` : undefined },
                  { id: 'tables', label: 'Table Management', icon: LayoutGrid, badge: 'Floor Map' },
                  { id: 'orders', label: 'Order Management', icon: Receipt, badge: `${m.ordersReceived + m.ordersPreparing} live` },
                  { id: 'billing', label: 'Billing & Payments', icon: CreditCard, badge: 'POS Pay' },
                  { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed, badge: 'Catalog' },
                  { id: 'staff', label: 'Staff Roster & Score', icon: Award },
                  { id: 'campaigns', label: 'Marketing Campaigns', icon: Megaphone, badge: `${m.activeCampaignsCount} live` },
                  { id: 'feedback', label: 'Complaints & Feedback', icon: MessageSquareWarning, badge: m.pendingComplaints > 0 ? `${m.pendingComplaints} open` : undefined },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#79415A] text-white shadow-xs'
                          : 'text-[#5C5549] hover:text-[#1F313D] hover:bg-[#E4DCCE]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[#E5DDD2] text-[#1F313D]'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Dark Feature Card: POS Terminal Status */}
            <div className="mt-6 bg-[#1F313D] text-white rounded-2xl p-4 shadow-sm border border-[#1F313D]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono tracking-widest text-[#E5C9B3] font-bold uppercase">
                  Connected Terminals
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h4 className="text-xs font-bold">Cloud POS System Synced</h4>
              <p className="text-[11px] text-[#E5C9B3]/80 mt-1 leading-relaxed">
                4 outlet counters online · Auto-refreshing transactions across branches.
              </p>
              <button
                onClick={() => openDrillDown('orders', 'Live POS Queue', 'Realtime ticket streaming')}
                className="mt-3 w-full bg-[#79415A] hover:bg-[#68334b] text-white text-[11px] font-bold py-1.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>Inspect Active Tickets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>

          {/* Main Dashboard Canvas */}
          <main className="flex-1 p-5 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
            {activeTab === 'branches' ? (
              <BranchManagementView
                currentUserRole={currentUser?.role}
                currentUserBranch={currentUser?.branchName}
                onSelectBranchForDashboard={(b) => {
                  setFilters({ ...filters, branch: b });
                  setActiveTab('overview');
                }}
              />
            ) : activeTab === 'employees' ? (
              <EmployeeManagementView
                orgId={orgId}
                currentUserRole={currentUser?.role}
              />
            ) : activeTab === 'roles' ? (
              <RolePermissionsView
                orgId={orgId}
              />
            ) : activeTab === 'settings' ? (
              <RestaurantSettingsView
                orgId={orgId}
              />
            ) : activeTab === 'customers' ? (
              <CustomerManagementView
                orgId={orgId}
              />
            ) : activeTab === 'segments' ? (
              <CustomerSegmentationView
                orgId={orgId}
              />
            ) : activeTab === 'leads' ? (
              <LeadManagementView
                orgId={orgId}
              />
            ) : activeTab === 'reservations' ? (
              <ReservationManagementView
                orgId={orgId}
              />
            ) : activeTab === 'tables' ? (
              <TableManagementView
                orgId={orgId}
              />
            ) : activeTab === 'orders' ? (
              <OrderManagementView orgId={orgId} />
            ) : activeTab === 'billing' ? (
              <BillingPaymentView orgId={orgId} userRole={currentUser?.role} />
            ) : activeTab === 'menu' ? (
              <MenuManagementView orgId={orgId} userRole={currentUser?.role} />
            ) : activeTab === 'loyalty' ? (
              <LoyaltyRewardsView orgId={orgId} userRole={currentUser?.role} />
            ) : activeTab === 'memberships' ? (
              <MembershipManagementView orgId={orgId} userRole={currentUser?.role} />
            ) : activeTab === 'staff' ? (
              <StaffRosterView orgId={orgId} />
            ) : activeTab === 'campaigns' ? (
              <MarketingCampaignsView orgId={orgId} />
            ) : activeTab === 'feedback' ? (
              <ComplaintsFeedbackView orgId={orgId} />
            ) : (
              <>
            {/* ── SECTION 1: TOP 4 HERO KPI CARDS WITH DIRECT NAVIGATION ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* CARD 1: TOTAL SALES REVENUE (Dark Contrast Hero Card) */}
              <div
                onClick={() => openDrillDown('revenue', 'Sales Revenue & Ledger', `Total revenue: $${m.totalSalesRevenue.toLocaleString()}`)}
                className="bg-[#1F313D] text-white rounded-[24px] p-5 shadow-md hover:shadow-lg transition cursor-pointer flex flex-col justify-between group border border-[#1F313D]"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-white/10 text-[#E5C9B3]">
                    <DollarSign className="w-5 h-5" />
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#E5C9B3] bg-white/5 px-2 py-0.5 rounded-full">
                    <span>Explore Ledger</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
                <div className="my-3">
                  <span className="text-xs text-[#E5C9B3] font-medium block">Total Sales Revenue</span>
                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    ${m.totalSalesRevenue.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" /> +14.2% from prior period
                  </div>
                </div>
                <div className="text-[11px] text-[#E5C9B3]/80 pt-2 border-t border-white/10 flex justify-between">
                  <span>Gross Turnover</span>
                  <strong className="text-white">${m.totalSalesRevenue.toLocaleString()}</strong>
                </div>
              </div>

              {/* CARD 2: TOTAL CUSTOMERS & ACQUISITION BREAKDOWN */}
              <div
                onClick={() => openDrillDown('customers', 'Total Customer Database', `${m.totalCustomers.toLocaleString()} registered patrons`)}
                className="bg-[#FAF7F2] rounded-[24px] p-5 border border-[#E5DDD2] shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-[#EFE9DF] text-[#79415A]">
                    <Users className="w-5 h-5" />
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#7A7268] group-hover:text-[#1F313D] transition-colors">
                    <span>View Patrons</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
                <div className="my-3">
                  <span className="text-xs text-[#7A7268] font-medium block">Total Customers</span>
                  <div className="text-3xl font-extrabold text-[#1F313D] tracking-tight">
                    {m.totalCustomers.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#7A7268] mt-1 flex items-center gap-1">
                    <UserPlus className="w-3 h-3 text-emerald-600" />
                    <span>+{m.newCustomersToday} today · +{m.newCustomersThisWeek} this week</span>
                  </div>
                </div>
                {/* Micro acquisition pills */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-[#DDD5C7]/60 text-[10px] font-bold" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openDrillDown('new_customers_today', 'New Customers Registered Today', 'Acquired today')}
                    className="px-2 py-0.5 rounded-full bg-[#EFE9DF] hover:bg-[#79415A] hover:text-white transition text-[#1F313D]"
                  >
                    Today: +{m.newCustomersToday}
                  </button>
                  <button
                    onClick={() => openDrillDown('new_customers_week', 'New Customers This Week', 'Acquired past 7 days')}
                    className="px-2 py-0.5 rounded-full bg-[#EFE9DF] hover:bg-[#79415A] hover:text-white transition text-[#1F313D]"
                  >
                    Week: +{m.newCustomersThisWeek}
                  </button>
                  <button
                    onClick={() => openDrillDown('new_customers_month', 'New Customers This Month', 'Acquired past 30 days')}
                    className="px-2 py-0.5 rounded-full bg-[#EFE9DF] hover:bg-[#79415A] hover:text-white transition text-[#1F313D]"
                  >
                    Month: +{m.newCustomersThisMonth}
                  </button>
                </div>
              </div>

              {/* CARD 3: TOTAL RESERVATIONS & STATUS BREAKDOWN */}
              <div
                onClick={() => openDrillDown('reservations', 'Table Reservations Ledger', `${m.totalReservations} table bookings`)}
                className="bg-[#FAF7F2] rounded-[24px] p-5 border border-[#E5DDD2] shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-[#EFE9DF] text-[#82401D]">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#7A7268] group-hover:text-[#1F313D] transition-colors">
                    <span>Manage Tables</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
                <div className="my-3">
                  <span className="text-xs text-[#7A7268] font-medium block">Total Reservations</span>
                  <div className="text-3xl font-extrabold text-[#1F313D] tracking-tight">
                    {m.totalReservations}
                  </div>
                  <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{m.pendingReservations} Pending Approval · {m.confirmedReservations} Confirmed</span>
                  </div>
                </div>
                {/* Reservation Status Badges */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-[#DDD5C7]/60 text-[10px] font-bold" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openDrillDown('reservations', 'Pending Reservations', 'Awaiting host confirmation', 'PENDING')}
                    className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                  >
                    Pending: {m.pendingReservations}
                  </button>
                  <button
                    onClick={() => openDrillDown('reservations', 'Confirmed Reservations', 'Confirmed guests', 'CONFIRMED')}
                    className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                  >
                    Confirmed: {m.confirmedReservations}
                  </button>
                  <button
                    onClick={() => openDrillDown('reservations', 'Completed Reservations', 'Dined & seated', 'COMPLETED')}
                    className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                  >
                    Done: {m.completedReservations}
                  </button>
                </div>
              </div>

              {/* CARD 4: TOTAL ORDERS & ORDERS BY STATUS */}
              <div
                onClick={() => openDrillDown('orders', 'Orders & Live POS Queue', `${m.totalOrders} total tickets`)}
                className="bg-[#FAF7F2] rounded-[24px] p-5 border border-[#E5DDD2] shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-[#EFE9DF] text-[#1F313D]">
                    <Receipt className="w-5 h-5" />
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#7A7268] group-hover:text-[#1F313D] transition-colors">
                    <span>Live POS</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
                <div className="my-3">
                  <span className="text-xs text-[#7A7268] font-medium block">Total Orders</span>
                  <div className="text-3xl font-extrabold text-[#1F313D] tracking-tight">
                    {m.totalOrders.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#7A7268] mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{m.ordersCompleted} completed · {m.ordersCancelled} voided</span>
                  </div>
                </div>
                {/* Orders by Status Pill Strip */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-[#DDD5C7]/60 text-[10px] font-bold" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openDrillDown('orders', 'Active Kitchen Orders', 'Orders in prep or received', 'PREPARING')}
                    className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200 transition"
                  >
                    Prep: {m.ordersPreparing + m.ordersReceived}
                  </button>
                  <button
                    onClick={() => openDrillDown('orders', 'Delivered Orders', 'Successfully served tickets', 'DELIVERED')}
                    className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                  >
                    Served: {m.ordersCompleted}
                  </button>
                  <button
                    onClick={() => openDrillDown('orders', 'Cancelled Orders', 'Voided or cancelled', 'CANCELLED')}
                    className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 hover:bg-rose-200 transition"
                  >
                    Void: {m.ordersCancelled}
                  </button>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: SECOND ROW OF OPERATIONAL KPIs ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {/* Metric 1: Average Order Value (AOV) */}
              <div
                onClick={() => openDrillDown('aov', 'Average Order Value Analytics', 'Ticket spend breakdown')}
                className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-2xs hover:shadow-xs transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-[#7A7268] mb-1">
                  <span className="text-xs font-semibold">Avg Order Value (AOV)</span>
                  <CreditCard className="w-4 h-4 text-[#82401D]" />
                </div>
                <div className="text-2xl font-bold text-[#1F313D]">${m.averageOrderValue.toFixed(2)}</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +8.4% vs benchmark
                </div>
              </div>

              {/* Metric 2: Repeat Customer Percentage */}
              <div
                onClick={() => openDrillDown('repeat_customers', 'Repeat Customer Intelligence', 'Customer visit frequency')}
                className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-2xs hover:shadow-xs transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-[#7A7268] mb-1">
                  <span className="text-xs font-semibold">Repeat Customer %</span>
                  <Repeat className="w-4 h-4 text-[#79415A]" />
                </div>
                <div className="text-2xl font-bold text-[#1F313D]">{m.repeatCustomerPercentage}%</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> High diner loyalty
                </div>
              </div>

              {/* Metric 3: Customer Retention Rate */}
              <div
                onClick={() => openDrillDown('customers', 'Customer Retention Rate', '90-day retention cohort')}
                className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-2xs hover:shadow-xs transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-[#7A7268] mb-1">
                  <span className="text-xs font-semibold">Retention Rate</span>
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-[#1F313D]">{m.customerRetentionRate}%</div>
                <div className="text-[10px] text-[#7A7268] mt-0.5">90-day active cohort</div>
              </div>

              {/* Metric 4: Active Loyalty Members */}
              <div
                onClick={() => openDrillDown('loyalty', 'Loyalty Club Roster', 'Platinum, Gold & Silver rewards')}
                className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-2xs hover:shadow-xs transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-[#7A7268] mb-1">
                  <span className="text-xs font-semibold">Active Loyalty Club</span>
                  <Crown className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-[#1F313D]">{m.activeLoyaltyMembers.toLocaleString()}</div>
                <div className="text-[10px] text-[#82401D] font-semibold mt-0.5">Top Gold & Platinum</div>
              </div>

              {/* Metric 5: Pending Complaints & Unresolved Feedback */}
              <div
                onClick={() => openDrillDown('complaints', 'Customer Feedback & Tickets', 'Unresolved service requests')}
                className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-2xs hover:shadow-xs transition cursor-pointer col-span-2 sm:col-span-1"
              >
                <div className="flex items-center justify-between text-[#7A7268] mb-1">
                  <span className="text-xs font-semibold">Pending Complaints</span>
                  <AlertCircle className={`w-4 h-4 ${m.pendingComplaints > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
                </div>
                <div className="text-2xl font-bold text-[#1F313D]">{m.pendingComplaints} Open</div>
                <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                  {m.pendingComplaints > 0 ? 'Requires attention' : 'All resolved'}
                </div>
              </div>
            </div>

            {/* ── SECTION 3: REVENUE ANALYTICS & CUSTOMER ACQUISITION CHARTS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Interactive Revenue Chart (Daily, Weekly, Monthly, Yearly) */}
              <div className="lg:col-span-7 bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1F313D]">
                      Sales Revenue &amp; Operational Costs
                    </h3>
                    <p className="text-xs text-[#7A7268]">
                      Dynamic curve showing turnover vs restaurant overhead across {filters.dateRange}
                    </p>
                  </div>

                  {/* Date Filter Tabs for Revenue Curve */}
                  <div className="flex items-center bg-[#EFE9DF] rounded-xl p-1 border border-[#DDD5C7] text-xs font-bold">
                    {(['today', 'week', 'month', 'year'] as DateFilterType[]).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setFilters({ ...filters, dateRange: tf })}
                        className={`px-2.5 py-1 rounded-lg capitalize transition ${
                          filters.dateRange === tf
                            ? 'bg-[#79415A] text-white shadow-xs'
                            : 'text-[#5C5549] hover:text-[#1F313D]'
                        }`}
                      >
                        {tf === 'today' ? 'Daily' : tf === 'week' ? 'Weekly' : tf === 'month' ? 'Monthly' : 'Yearly'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-5 text-xs font-semibold mb-3">
                  <span className="flex items-center gap-1.5 text-[#1F313D]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1F313D]" />
                    Gross Sales Revenue
                  </span>
                  <span className="flex items-center gap-1.5 text-[#82401D]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#82401D]" />
                    Kitchen &amp; Operations Cost
                  </span>
                  <span className="ml-auto text-[11px] text-[#7A7268] font-mono">
                    Avg margin: <strong className="text-emerald-700">68%</strong>
                  </span>
                </div>

                {/* SVG Revenue Chart */}
                <div className="w-full h-52 relative select-none pt-2">
                  <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-[#7A7268] font-mono pointer-events-none pb-6">
                    <div className="border-b border-[#DDD5C7]/40 flex justify-between"><span>Max</span></div>
                    <div className="border-b border-[#DDD5C7]/40 flex justify-between"><span>75%</span></div>
                    <div className="border-b border-[#DDD5C7]/40 flex justify-between"><span>50%</span></div>
                    <div className="border-b border-[#DDD5C7]/40 flex justify-between"><span>25%</span></div>
                    <div className="border-b border-[#DDD5C7]/40 flex justify-between"><span>0</span></div>
                  </div>

                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revenueFillGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#79415A" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#79415A" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Revenue Area Fill */}
                    <path
                      d="M 20,130 Q 100,70 170,95 T 310,50 T 430,35 T 580,25 L 580,150 L 20,150 Z"
                      fill="url(#revenueFillGrad)"
                    />

                    {/* Revenue Line */}
                    <path
                      d="M 20,130 Q 100,70 170,95 T 310,50 T 430,35 T 580,25"
                      fill="none"
                      stroke="#1F313D"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Cost Line */}
                    <path
                      d="M 20,145 Q 100,105 170,120 T 310,85 T 430,75 T 580,65"
                      fill="none"
                      stroke="#82401D"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />

                    {/* Highlight Point */}
                    <circle cx="430" cy="35" r="5" fill="#79415A" stroke="#FAF7F2" strokeWidth="2" />
                    <rect x="390" y="8" width="80" height="20" rx="8" fill="#1F313D" />
                    <text x="430" y="22" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">Peak Sales</text>
                  </svg>

                  {/* Horizontal Chart Axis Points */}
                  <div className="flex justify-between text-[11px] font-semibold text-[#7A7268] mt-2 px-1">
                    {m.revenueChart.length > 0 ? (
                      m.revenueChart.map((pt, idx) => (
                        <span key={idx}>{pt.label}</span>
                      ))
                    ) : (
                      <>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Customer Acquisition Trends */}
              <div className="lg:col-span-5 bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif font-bold text-base text-[#1F313D]">
                      Customer Acquisition Trends
                    </h3>
                    <span className="text-[11px] font-bold text-[#79415A] bg-[#79415A]/10 px-2 py-0.5 rounded-full">
                      New vs Returning
                    </span>
                  </div>
                  <p className="text-xs text-[#7A7268] mb-4">
                    Comparison of first-time diners acquired vs repeat loyalty visits
                  </p>

                  {/* Micro Bar Chart */}
                  <div className="space-y-3 pt-1">
                    {m.customerAcquisitionTrends.map((trend, i) => {
                      const totalAcquired = trend.newCustomers + trend.returningCustomers;
                      const newPct = totalAcquired > 0 ? Math.round((trend.newCustomers / totalAcquired) * 100) : 25;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-[#1F313D]">{trend.label}</span>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="text-emerald-700 font-bold">+{trend.newCustomers} New</span>
                              <span className="text-[#5C5549]">{trend.returningCustomers} Returning</span>
                            </div>
                          </div>
                          <div className="w-full h-2.5 bg-[#EAE4D9] rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${newPct}%` }}
                              className="h-full bg-[#79415A] rounded-l-full"
                              title={`New: ${trend.newCustomers}`}
                            />
                            <div
                              style={{ width: `${100 - newPct}%` }}
                              className="h-full bg-[#82401D] rounded-r-full"
                              title={`Returning: ${trend.returningCustomers}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#DDD5C7]/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-[#79415A] font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#79415A]" /> New Signups
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#82401D] font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#82401D]" /> Returning Patrons
                    </span>
                  </div>
                  <button
                    onClick={() => openDrillDown('customers', 'Acquisition & Retention Registry', 'Full customer list')}
                    className="text-[#79415A] font-bold hover:underline flex items-center gap-0.5"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── SECTION 4: TOP MENU ITEMS, TOP CUSTOMERS, STAFF & CAMPAIGNS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 6 Cols: Top-Performing Menu Items */}
              <div className="lg:col-span-6 bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1F313D]">
                      Top-Performing Menu Items
                    </h3>
                    <p className="text-xs text-[#7A7268]">Ranked by total orders and revenue generation</p>
                  </div>
                  <button
                    onClick={() => openDrillDown('menu_items', 'Menu Items Performance Matrix', 'All catalog items')}
                    className="text-xs font-bold text-[#82401D] hover:underline flex items-center gap-0.5"
                  >
                    Full Menu <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {m.topMenuItems.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => openDrillDown('menu_items', `Item Performance: ${item.name}`, `${item.ordersCount} orders recorded`)}
                      className="p-3 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-center gap-3 hover:bg-white transition cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#1F313D] truncate">{item.name}</h4>
                          <span className="text-xs font-black text-[#82401D]">${item.price}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#7A7268] mt-1">
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {item.rating}
                          </span>
                          <span>{item.ordersCount} sold</span>
                          <span className="text-emerald-700 font-semibold font-mono">${item.revenue.toLocaleString()}</span>
                          <span className="ml-auto text-[10px] bg-white px-2 py-0.5 rounded-full font-bold text-[#5C5549]">
                            {item.profitMargin}% margin
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 6 Cols: Top Customers Based on Spendings */}
              <div className="lg:col-span-6 bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1F313D]">
                      Top Customers by Spending
                    </h3>
                    <p className="text-xs text-[#7A7268]">VIP patron leaderboard with loyalty tier tracking</p>
                  </div>
                  <button
                    onClick={() => openDrillDown('top_spenders', 'VIP High-Spender Leaderboard', 'All tier patrons')}
                    className="text-xs font-bold text-[#82401D] hover:underline flex items-center gap-0.5"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {m.topCustomers.slice(0, 4).map((c, idx) => (
                    <div
                      key={c.id}
                      onClick={() => openDrillDown('customers', `Patron Profile: ${c.name}`, `Lifetime spend $${c.totalSpend}`)}
                      className="p-3 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-center justify-between hover:bg-white transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1F313D] text-[#E5C9B3] font-bold text-xs flex items-center justify-center">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#1F313D]">{c.name}</h4>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              {c.loyaltyTier}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7A7268] mt-0.5">
                            {c.totalOrders} visits · Last: {c.lastVisit}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-[#1F313D]">${c.totalSpend.toFixed(2)}</div>
                        <span className="text-[10px] text-[#79415A] font-bold font-mono">
                          {c.loyaltyPoints} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SECTION 5: STAFF PERFORMANCE & ACTIVE MARKETING CAMPAIGNS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 6 Cols: Staff Performance Leaderboard */}
              <div className="lg:col-span-6 bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1F313D]">
                      Staff Performance Roster
                    </h3>
                    <p className="text-xs text-[#7A7268]">Shift completion, rating and turnaround efficiency</p>
                  </div>
                  <button
                    onClick={() => openDrillDown('staff', 'Staff Shifts & Efficiency Metrics', 'All restaurant staff')}
                    className="text-xs font-bold text-[#82401D] hover:underline flex items-center gap-0.5"
                  >
                    View Roster <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {m.staffPerformance.slice(0, 3).map((staff) => (
                    <div
                      key={staff.id}
                      className="p-3.5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-center justify-between hover:bg-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={staff.avatarUrl}
                          alt={staff.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#DDD5C7]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#1F313D]">{staff.name}</h4>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              staff.status === 'ON_DUTY' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {staff.status === 'ON_DUTY' ? 'On Duty' : 'On Break'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7A7268] mt-0.5">{staff.role}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-600">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {staff.customerRating}
                        </div>
                        <span className="text-[10px] text-[#5C5549] mt-0.5 block">
                          {staff.ordersHandled} orders ({staff.efficiencyScore}% score)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 6 Cols: Active Marketing Campaigns */}
              <div className="lg:col-span-6 bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1F313D]">
                      Active Marketing Campaigns
                    </h3>
                    <p className="text-xs text-[#7A7268]">Campaign reach, conversions and ROI multipliers</p>
                  </div>
                  <button
                    onClick={() => openDrillDown('campaigns', 'Marketing Campaigns & Promotions', 'Active & scheduled')}
                    className="text-xs font-bold text-[#82401D] hover:underline flex items-center gap-0.5"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {m.activeCampaigns.slice(0, 3).map((camp) => (
                    <div
                      key={camp.id}
                      onClick={() => openDrillDown('campaigns', `Campaign: ${camp.title}`, `${camp.channel} Channel`)}
                      className="p-3.5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-center justify-between hover:bg-white transition cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#1F313D]">{camp.title}</h4>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {camp.channel}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A7268] mt-1">
                          Duration: {camp.startDate} to {camp.endDate} · Budget: ${camp.budget}
                        </p>
                      </div>

                      <div className="flex items-center gap-5 text-right">
                        <div>
                          <div className="text-xs font-bold text-[#1F313D]">{camp.reach.toLocaleString()}</div>
                          <span className="text-[10px] text-[#7A7268]">Impressions</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1F313D]">{camp.conversions}</div>
                          <span className="text-[10px] text-[#7A7268]">Orders Converted</span>
                        </div>
                        <div>
                          <div className="text-sm font-black text-emerald-700">{camp.roiMultiplier}x</div>
                          <span className="text-[10px] text-[#7A7268]">ROI</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── INTERACTIVE DRILL-DOWN MODAL & RECORD DRAWER ── */}
      {drillDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-5">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[28px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#DDD5C7] bg-[#EFE9DF] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">{drillDown.title}</h3>
                <p className="text-xs text-[#7A7268] mt-0.5">{drillDown.subtitle}</p>
              </div>

              <button
                onClick={() => setDrillDown(null)}
                className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] flex items-center justify-center text-[#5C5549] hover:text-[#1F313D] hover:bg-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Filter / Search Bar */}
            <div className="px-5 py-3 border-b border-[#DDD5C7] bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-3.5 h-3.5 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search records by name, ID, phone or keyword..."
                  value={drillDownSearch}
                  onChange={(e) => setDrillDownSearch(e.target.value)}
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                />
              </div>

              {drillDown.type === 'reservations' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[#7A7268]">Status:</span>
                  <select
                    value={drillDownStatusFilter}
                    onChange={(e) => setDrillDownStatusFilter(e.target.value)}
                    className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              )}

              {drillDown.type === 'orders' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[#7A7268]">Status:</span>
                  <select
                    value={drillDownStatusFilter}
                    onChange={(e) => setDrillDownStatusFilter(e.target.value)}
                    className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">All Orders</option>
                    <option value="RECEIVED">Received</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="READY">Ready</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              )}
            </div>

            {/* Modal Body: Render relevant records based on drillDown.type */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {/* 1. CUSTOMERS / NEW CUSTOMERS / TOP SPENDERS */}
              {(drillDown.type === 'customers' ||
                drillDown.type === 'new_customers_today' ||
                drillDown.type === 'new_customers_week' ||
                drillDown.type === 'new_customers_month' ||
                drillDown.type === 'top_spenders' ||
                drillDown.type === 'repeat_customers' ||
                drillDown.type === 'loyalty') && (
                <div className="divide-y divide-[#DDD5C7]/60">
                  {m.customersList
                    .filter((c) => {
                      if (!drillDownSearch) return true;
                      const q = drillDownSearch.toLowerCase();
                      return (
                        c.name.toLowerCase().includes(q) ||
                        c.email.toLowerCase().includes(q) ||
                        c.phone.includes(q) ||
                        c.segment.toLowerCase().includes(q)
                      );
                    })
                    .map((cust) => (
                      <div key={cust.id} className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-[#EFE9DF]/50 px-2 rounded-xl transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#1F313D] text-white flex items-center justify-center font-bold text-xs">
                            {cust.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-[#1F313D]">{cust.name}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                                {cust.loyaltyTier}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E5DDD2] text-[#5C5549] font-semibold">
                                {cust.segment}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-[#7A7268] mt-0.5">
                              <span><Mail className="w-3 h-3 inline mr-1" />{cust.email}</span>
                              <span><Phone className="w-3 h-3 inline mr-1" />{cust.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-[#1F313D]">${cust.totalSpend.toFixed(2)} spent</div>
                          <div className="text-[11px] text-[#7A7268]">
                            {cust.totalOrders} visits · {cust.loyaltyPoints} loyalty points
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 2. RESERVATIONS */}
              {drillDown.type === 'reservations' && (
                <div className="space-y-3">
                  {m.reservationsList
                    .filter((res) => {
                      if (drillDownStatusFilter !== 'all' && res.status !== drillDownStatusFilter) return false;
                      if (!drillDownSearch) return true;
                      const q = drillDownSearch.toLowerCase();
                      return (
                        res.guestName.toLowerCase().includes(q) ||
                        res.bookingNumber.toLowerCase().includes(q) ||
                        res.tableNumber.toLowerCase().includes(q)
                      );
                    })
                    .map((res) => (
                      <div key={res.id} className="p-3.5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1F313D]">{res.bookingNumber}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              res.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : res.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : res.status === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {res.status}
                            </span>
                            <span className="text-xs text-[#7A7268]">· {res.branch}</span>
                          </div>
                          <h4 className="text-xs font-bold text-[#1F313D] mt-1">{res.guestName} ({res.guestsCount} guests)</h4>
                          <p className="text-[11px] text-[#5C5549] mt-0.5">{res.tableNumber} · {res.reservationTime}</p>
                          {res.specialRequests && (
                            <p className="text-[10px] text-[#82401D] italic mt-1 bg-white/60 p-1 rounded">
                              Note: {res.specialRequests}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {res.status === 'PENDING' && (
                            <button
                              onClick={() => alert(`Reservation ${res.bookingNumber} confirmed!`)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Confirm
                            </button>
                          )}
                          <button
                            onClick={() => alert(`Seating guest: ${res.guestName}`)}
                            className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] hover:bg-white text-xs font-bold text-[#1F313D] transition"
                          >
                            Seat Table
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 3. ORDERS / REVENUE / AOV */}
              {(drillDown.type === 'orders' || drillDown.type === 'revenue' || drillDown.type === 'aov') && (
                <div className="space-y-3">
                  {m.recentOrdersList
                    .filter((ord) => {
                      if (drillDownStatusFilter !== 'all' && ord.status !== drillDownStatusFilter) return false;
                      if (!drillDownSearch) return true;
                      const q = drillDownSearch.toLowerCase();
                      return (
                        ord.orderNumber.toLowerCase().includes(q) ||
                        ord.customerName.toLowerCase().includes(q) ||
                        ord.itemsSummary.toLowerCase().includes(q)
                      );
                    })
                    .map((ord) => (
                      <div key={ord.id} className="p-3.5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1F313D]">{ord.orderNumber}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {ord.status}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#5C5549]">
                              {ord.orderType}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-[#1F313D] mt-1">{ord.customerName} · {ord.branch}</h4>
                          <p className="text-[11px] text-[#5C5549] mt-0.5">{ord.itemsSummary}</p>
                          <span className="text-[10px] text-[#7A7268] mt-0.5 block">{ord.paymentMethod} · {ord.createdAt}</span>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black text-[#1F313D]">${ord.totalAmount.toFixed(2)}</div>
                          <button
                            onClick={() => alert(`Reprinting POS Receipt #${ord.orderNumber}`)}
                            className="mt-1 text-[11px] text-[#82401D] font-bold hover:underline"
                          >
                            Reprint Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 4. COMPLAINTS & FEEDBACK */}
              {drillDown.type === 'complaints' && (
                <div className="space-y-3">
                  {m.pendingFeedbackList
                    .filter((c) => {
                      if (!drillDownSearch) return true;
                      const q = drillDownSearch.toLowerCase();
                      return (
                        c.customerName.toLowerCase().includes(q) ||
                        c.description.toLowerCase().includes(q) ||
                        c.category.toLowerCase().includes(q)
                      );
                    })
                    .map((comp) => (
                      <div key={comp.id} className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1F313D]">{comp.ticketNumber}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              comp.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {comp.severity} SEVERITY
                            </span>
                            <span className="text-xs text-[#7A7268]">{comp.category} · {comp.branch}</span>
                          </div>
                          <span className="text-[11px] text-[#7A7268]">{comp.createdAt}</span>
                        </div>

                        <p className="text-xs text-[#1F313D] bg-white/70 p-2.5 rounded-xl border border-[#DDD5C7]">
                          "{comp.description}"
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-[#5C5549]">
                            Customer: <strong>{comp.customerName}</strong> ({comp.customerPhone})
                          </span>
                          <button
                            onClick={() => alert(`Marking ticket ${comp.ticketNumber} as Resolved with replacement voucher dispatched!`)}
                            className="px-3 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Resolve &amp; Issue Credit
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 5. MARKETING CAMPAIGNS */}
              {drillDown.type === 'campaigns' && (
                <div className="space-y-3">
                  {m.activeCampaigns.map((camp) => (
                    <div key={camp.id} className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#1F313D]">{camp.title}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {camp.channel}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A7268] mt-1">
                          Duration: {camp.startDate} to {camp.endDate} · Budget: ${camp.budget}
                        </p>
                      </div>

                      <div className="flex items-center gap-5 text-right">
                        <div>
                          <div className="text-xs font-bold text-[#1F313D]">{camp.reach.toLocaleString()}</div>
                          <span className="text-[10px] text-[#7A7268]">Impressions</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1F313D]">{camp.conversions}</div>
                          <span className="text-[10px] text-[#7A7268]">Orders Converted</span>
                        </div>
                        <div>
                          <div className="text-sm font-black text-emerald-700">{camp.roiMultiplier}x</div>
                          <span className="text-[10px] text-[#7A7268]">ROI</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 6. MENU ITEMS */}
              {drillDown.type === 'menu_items' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {m.topMenuItems.map((item) => (
                    <div key={item.id} className="p-3 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-center gap-3">
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#1F313D] truncate">{item.name}</h4>
                        <p className="text-[11px] text-[#7A7268]">{item.category}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-black text-[#82401D]">${item.price}</span>
                          <span className="text-[11px] text-emerald-700 font-bold">${item.revenue.toLocaleString()} revenue</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 7. STAFF PERFORMANCE */}
              {drillDown.type === 'staff' && (
                <div className="space-y-3">
                  {m.staffPerformance.map((st) => (
                    <div key={st.id} className="p-3.5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={st.avatarUrl} alt={st.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <h4 className="text-xs font-bold text-[#1F313D]">{st.name}</h4>
                          <p className="text-[11px] text-[#7A7268]">{st.role} · {st.branch}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-600 flex items-center justify-end gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {st.customerRating} Rating
                        </div>
                        <span className="text-[10px] text-[#5C5549]">
                          {st.shiftsCompleted} shifts · {st.ordersHandled} orders ({st.efficiencyScore}% score)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#DDD5C7] bg-[#EFE9DF] flex items-center justify-between text-xs">
              <span className="text-[#7A7268]">
                Showing filtered operational records for {orgName}
              </span>
              <button
                onClick={() => setDrillDown(null)}
                className="px-4 py-2 rounded-xl bg-[#79415A] text-white font-bold hover:bg-[#68334b] transition"
              >
                Close Records View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
