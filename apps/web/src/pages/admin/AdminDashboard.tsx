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
  Building,
  Calendar,
  SlidersHorizontal,
  Flame,
  CheckCircle2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const orgId = currentUser?.organizationId;
  const orgName = currentUser?.organizationName || "Cafe's Corner";

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'staff' | 'inventory'>('overview');
  const [selectedBranch, setSelectedBranch] = useState('downtown');
  const [dateRange, setDateRange] = useState('weekly');

  // Live database stats scoped to this organization (cross-tenant protected)
  const [adminStats, setAdminStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    deliveredOrders: 0,
    canceledOrders: 0,
  });
  const [branches, setBranches] = useState<string[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        let ordersQuery = supabase.from('orders').select('id, total_amount, status, created_at, customer_name, order_number');
        if (orgId) {
          ordersQuery = ordersQuery.eq('organization_id', orgId);
        }
        const { data: ordersData } = await ordersQuery.order('created_at', { ascending: false }).limit(100);
        const totalOrders = ordersData?.length || 0;
        const totalRevenue = ordersData?.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0) || 0;
        const deliveredOrders = ordersData?.filter((o: any) => o.status === 'DELIVERED' || o.status === 'COMPLETED').length || 0;
        const canceledOrders = ordersData?.filter((o: any) => o.status === 'CANCELLED').length || 0;
        setRecentOrders(ordersData?.slice(0, 6) || []);

        let branchQuery = supabase.from('org_branches').select('name');
        if (orgId) {
          branchQuery = branchQuery.eq('organization_id', orgId);
        }
        const { data: branchData } = await branchQuery;
        if (branchData && branchData.length > 0) {
          setBranches(branchData.map((b: any) => b.name));
        }

        setAdminStats({
          totalOrders,
          totalRevenue,
          deliveredOrders,
          canceledOrders,
        });
      } catch (err) {
        console.warn('Admin live data load notice:', err);
      }
    };
    fetchAdminData();
  }, [orgId]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    clearCurrentSession();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#EAE4D9] p-4 sm:p-6 lg:p-8 text-[#1F313D] font-sans antialiased">
      <SEOHead
        title="Restaurant Operations Dashboard | Cafe's Corner Admin"
        description="Restaurant Operations Overview, live POS activity, table orders, outlet cost vs revenue, employee status and menu performance."
        canonicalPath="/admin/dashboard"
      />

      {/* ── Main Outer Rounded Dashboard Canvas (Matching Image 1 Design) ── */}
      <div className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-[36px] shadow-sm overflow-hidden flex flex-col min-h-[92vh]">
        {/* Top Capsule Header */}
        <header className="px-6 lg:px-8 py-5 border-b border-[#DDD5C7]/70 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Logo Stamp */}
            <Link to="/" title="Cafe's Corner" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <img src="/logo.png" alt="Cafe's Corner" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-serif font-black text-lg text-[#1F313D] tracking-tight block leading-none">
                  {orgName}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#82401D] font-bold">
                  Restaurant Admin
                </span>
              </div>
            </Link>
          </div>

          {/* Right Header: Branch, Date, Search & Profile */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DDD5C7] rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#1F313D] shadow-2xs">
              <Building className="w-3.5 h-3.5 text-[#82401D]" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                {branches.length > 0 ? (
                  branches.map((b) => (
                    <option key={b} value={b.toLowerCase()}>{b}</option>
                  ))
                ) : (
                  <>
                    <option value="main">Main Branch #01</option>
                    <option value="downtown">Downtown Flagship</option>
                  </>
                )}
              </select>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DDD5C7] rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#1F313D] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#82401D]" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value="today">Today</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Notification Bell */}
            <button className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] flex items-center justify-center text-[#5C5549] hover:text-[#1F313D] shadow-2xs transition">
              <Bell className="w-4 h-4" />
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
                <div className="text-[10px] text-[#82401D] font-mono font-bold uppercase">Branch Manager</div>
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

        {/* Dashboard Shell: Left Hero Sidebar + Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left Hero Sidebar matching Image 1 */}
          <aside className="w-full lg:w-64 p-6 lg:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#DDD5C7]/70 shrink-0">
            <div>
              {/* Editorial Welcome Header */}
              <div className="mb-8">
                <h2 className="font-serif text-3xl font-bold text-[#1F313D] tracking-tight leading-tight">
                  Welcome<br />back, {currentUser?.fullName?.split(' ')[0] || 'George'}
                </h2>
                <p className="text-xs text-[#7A7268] mt-1.5 font-medium">
                  Last Update, {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Vertical Navigation Pills matching Image 1 */}
              <nav className="space-y-1.5">
                {[
                  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'orders', label: 'Orders & POS', icon: Receipt },
                  { id: 'menu', label: 'Menu Catalog', icon: UtensilsCrossed },
                  { id: 'staff', label: 'Staff & Shifts', icon: Users },
                  { id: 'inventory', label: 'Supply & Stock', icon: ShoppingCart },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#79415A]/80 text-white shadow-xs'
                          : 'text-[#5C5549] hover:text-[#1F313D] hover:bg-[#E4DCCE]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Dark Feature Card (Matching Image 1: Explore Premium Features) */}
            <div className="mt-8 bg-[#1F313D] text-white rounded-2xl p-5 shadow-sm border border-[#1F313D]">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4 text-[#E5C9B3]" />
              </div>
              <h4 className="text-sm font-bold tracking-tight">POS Stream Active</h4>
              <p className="text-[11px] text-[#E5C9B3]/80 mt-1 leading-relaxed">
                Terminal #01 synced. 83 employees on duty across front desk &amp; kitchen.
              </p>
              <button
                onClick={() => setActiveTab('orders')}
                className="mt-3.5 w-full bg-[#383854] hover:bg-[#82401D] text-white text-xs font-bold py-2 rounded-xl transition"
              >
                Open Terminal View
              </button>
            </div>
          </aside>

          {/* Main Dashboard Content Canvas */}
          <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
            {/* Top Row: Rhythmic 4 KPI Cards (Matching Image 1 Palette & Geometry) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Orders */}
              <div className="bg-[#FAF7F2] rounded-[24px] p-5 border border-[#E5DDD2] shadow-xs flex flex-col justify-between group hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-[#EFE9DF] text-[#1F313D]">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-[#7A7268]">Total Orders</span>
                </div>
                <div className="my-3">
                  <div className="text-3xl font-extrabold text-[#1F313D] tracking-tight">{adminStats.totalOrders.toLocaleString()}</div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 mt-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" /> Database Synced
                  </div>
                </div>
                <div className="text-[11px] text-[#7A7268] pt-2 border-t border-[#DDD5C7]/60">
                  Live tickets: <strong>{adminStats.totalOrders} recorded</strong>
                </div>
              </div>

              {/* Card 2: DARK CONTRAST HERO CARD (Total Revenue) */}
              <div className="bg-[#1F313D] text-white rounded-[24px] p-5 shadow-md flex flex-col justify-between group hover:shadow-lg transition border border-[#1F313D]">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-white/10 text-white">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-[#E5C9B3]">Total Revenue</span>
                </div>
                <div className="my-3">
                  <div className="text-3xl font-extrabold text-white tracking-tight">${adminStats.totalRevenue.toLocaleString()}</div>
                  <div className="flex items-center gap-1.5 text-xs text-[#E5C9B3] mt-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" /> Direct POS Ledger
                  </div>
                </div>
                <div className="text-[11px] text-[#E5C9B3]/80 pt-2 border-t border-white/10">
                  Gross turnover: <strong>${adminStats.totalRevenue.toLocaleString()}</strong>
                </div>
              </div>

              {/* Card 3: Total Delivered */}
              <div className="bg-[#FAF7F2] rounded-[24px] p-5 border border-[#E5DDD2] shadow-xs flex flex-col justify-between group hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-[#EFE9DF] text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-[#7A7268]">Total Delivered</span>
                </div>
                <div className="my-3">
                  <div className="text-3xl font-extrabold text-[#1F313D] tracking-tight">{adminStats.deliveredOrders.toLocaleString()}</div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 mt-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" /> Kitchen Completed
                  </div>
                </div>
                <div className="text-[11px] text-[#7A7268] pt-2 border-t border-[#DDD5C7]/60">
                  Fulfillment count: <strong>{adminStats.deliveredOrders} orders</strong>
                </div>
              </div>

              {/* Card 4: Canceled Order */}
              <div className="bg-[#FAF7F2] rounded-[24px] p-5 border border-[#E5DDD2] shadow-xs flex flex-col justify-between group hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-[#BA4F57]/15 text-[#82401D]">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-[#7A7268]">Canceled Orders</span>
                </div>
                <div className="my-3">
                  <div className="text-3xl font-extrabold text-[#1F313D] tracking-tight">{adminStats.canceledOrders.toLocaleString()}</div>
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 mt-1 font-semibold">
                    <TrendingDown className="w-3.5 h-3.5" /> Voided Tickets
                  </div>
                </div>
                <div className="text-[11px] text-[#7A7268] pt-2 border-t border-[#DDD5C7]/60">
                  Cancellations: <strong>{adminStats.canceledOrders} voided</strong>
                </div>
              </div>
            </div>

            {/* Middle Layout: Dual Curve Chart (8 cols) + Trending Menu Item & POS (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 8 Cols */}
              <div className="lg:col-span-8 space-y-6">
                {/* Outlets Operational Cost vs Revenue Dual Curve Chart */}
                <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#1F313D]">Outlets Operational Cost Vs Revenue</h3>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-[#1F313D]">$3,500</span>
                        <span className="text-xs font-medium text-[#7A7268]">Net Operating Revenue</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-[#1F313D]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1F313D]" />
                        Sales
                      </span>
                      <span className="flex items-center gap-1.5 text-[#82401D]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#82401D]" />
                        Operational Cost
                      </span>
                      <button className="border border-[#DDD5C7] rounded-full px-3 py-1 text-xs font-bold text-[#1F313D] bg-[#EFE9DF]">
                        Weekly ▾
                      </button>
                    </div>
                  </div>

                  {/* Dual Curve SVG Graph */}
                  <div className="w-full h-56 pt-4 relative select-none">
                    <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-[#7A7268] font-mono pointer-events-none pb-6">
                      <div className="border-b border-[#DDD5C7]/40 flex justify-between"><span>$15k</span></div>
                      <div className="border-b border-[#DDD5C7]/40 flex justify-between"><span>$12k</span></div>
                      <div className="border-b border-[#DDD5C7]/40 flex justify-between"><span>$9k</span></div>
                      <div className="border-b border-[#DDD5C7]/40 flex justify-between"><span>$6k</span></div>
                      <div className="border-b border-[#DDD5C7]/40 flex justify-between"><span>$3k</span></div>
                      <div className="border-b border-[#DDD5C7]/40 flex justify-between"><span>$0</span></div>
                    </div>

                    <svg className="w-full h-full overflow-visible" viewBox="0 0 700 180" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="adminCurveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#82401D" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#82401D" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>

                      {/* Outlet 5 pill highlight */}
                      <rect x="365" y="10" width="36" height="150" rx="18" fill="url(#adminCurveGrad)" />

                      {/* Sales curve */}
                      <path
                        d="M 20,120 Q 90,80 140,110 T 260,70 T 380,50 T 490,95 T 600,60 T 680,85"
                        fill="none"
                        stroke="#1F313D"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Cost curve */}
                      <path
                        d="M 20,140 Q 90,110 140,135 T 260,95 T 380,85 T 490,115 T 600,80 T 680,105"
                        fill="none"
                        stroke="#82401D"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      <circle cx="383" cy="50" r="5" fill="#1F313D" stroke="#FAF7F2" strokeWidth="2" />
                      <circle cx="383" cy="85" r="5" fill="#82401D" stroke="#FAF7F2" strokeWidth="2" />

                      <rect x="340" y="24" width="46" height="20" rx="8" fill="#1F313D" />
                      <text x="363" y="38" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">$14K</text>

                      <rect x="400" y="74" width="50" height="20" rx="8" fill="#1F313D" />
                      <text x="425" y="88" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">$10.5K</text>
                    </svg>

                    <div className="flex justify-between text-[11px] font-semibold text-[#7A7268] mt-2 px-2">
                      <span>Outlet 01</span>
                      <span>Outlet 02</span>
                      <span>Outlet 03</span>
                      <span>Outlet 04</span>
                      <span className="text-[#82401D] font-bold">Outlet 05</span>
                      <span>Outlet 06</span>
                      <span>Outlet 07</span>
                      <span>Outlet 08</span>
                    </div>
                  </div>
                </div>

                {/* Sub-row: Top Categories & Employee Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Categories Item */}
                  <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-serif font-bold text-base text-[#1F313D]">Top Categories Item</h4>
                      <ArrowUpRight className="w-4 h-4 text-[#7A7268]" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { title: 'Seafood', pct: '65%', img: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=300&auto=format&fit=crop&q=80' },
                        { title: 'Beverage', pct: '45%', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=80' },
                        { title: 'Desserts', pct: '81%', img: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=300&auto=format&fit=crop&q=80' },
                      ].map((cat, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className="w-full h-24 rounded-2xl overflow-hidden relative shadow-2xs mb-2">
                            <img src={cat.img} alt={cat.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                              <span className="text-xs font-bold text-white">{cat.title}</span>
                            </div>
                          </div>
                          <span className="text-sm font-black text-[#1F313D]">{cat.pct}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Employee Status Card */}
                  <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-serif font-bold text-base text-[#1F313D]">Employee Status</h4>
                        <span className="text-xs text-[#7A7268]">Total Employees — 120</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#7A7268]" />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="relative w-36 h-20 overflow-hidden flex items-end justify-center">
                        <svg viewBox="0 0 100 50" className="w-full h-full">
                          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#E2D9CC" strokeWidth="10" strokeLinecap="round" />
                          <path d="M 10 50 A 40 40 0 0 1 70 18" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round" />
                          <path d="M 70 18 A 40 40 0 0 1 82 32" fill="none" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
                          <path d="M 82 32 A 40 40 0 0 1 90 50" fill="none" stroke="#82401D" strokeWidth="10" strokeLinecap="round" />
                        </svg>
                      </div>

                      <div className="space-y-1.5 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-[#5C5549]">On Duty</span>
                          <span className="text-[#1F313D] font-bold ml-auto">— 83</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="text-[#5C5549]">On Break</span>
                          <span className="text-[#1F313D] font-bold ml-auto">— 10</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#82401D]" />
                          <span className="text-[#5C5549]">Absent</span>
                          <span className="text-[#1F313D] font-bold ml-auto">— 07</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Horizontal Strip */}
                <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-serif font-bold text-base text-[#1F313D]">Recent Orders</h4>
                    <span className="text-xs font-bold text-[#82401D]">Live POS Queue</span>
                  </div>

                  {recentOrders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {recentOrders.map((order, i) => (
                        <div key={i} className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-2xl p-3 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#1F313D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            #{order.order_number || order.id?.substring(0, 4) || 'ORD'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#1F313D]">{order.item_summary || order.customer_name || 'Counter Order'}</div>
                            <div className="text-[10px] text-[#7A7268] font-mono mt-0.5">${Number(order.total_amount || 0).toFixed(2)}</div>
                            <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {order.status || 'Received'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-[#7A7268] bg-[#EFE9DF] rounded-2xl border border-[#DDD5C7]">
                      No active orders in the database for this branch yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Right 4 Cols: Trending Menu Item & POS Activities */}
              <div className="lg:col-span-4 space-y-6">
                {/* Trending Menu Item Card */}
                <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-serif font-bold text-base text-[#1F313D]">Trending Menu Item</h4>
                    <Sparkles className="w-4 h-4 text-[#82401D]" />
                  </div>

                  <div className="rounded-2xl overflow-hidden mb-4 shadow-sm relative">
                    <img
                      src="https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=600&auto=format&fit=crop&q=80"
                      alt="Fish & Chips"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-[#1F313D]/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-bold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.6 (420 orders)
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-bold text-[#1F313D]">Fish &amp; Chips (British classic)</h5>
                      <p className="text-[11px] text-[#7A7268]">Crispy battered cod with chips</p>
                    </div>
                    <span className="text-lg font-black text-[#82401D]">$12</span>
                  </div>
                </div>

                {/* POS Activities Card */}
                <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-serif font-bold text-base text-[#1F313D]">POS Activities</h4>
                    <span className="text-[11px] font-bold text-[#7A7268] bg-[#EFE9DF] px-2.5 py-0.5 rounded-full">Today's</span>
                  </div>

                  <div className="my-3">
                    <span className="text-[11px] text-[#7A7268] font-medium block">Total Sales →</span>
                    <div className="text-3xl font-extrabold text-[#1F313D] tracking-tight">$1,550</div>
                    <div className="text-xs text-emerald-700 font-semibold mt-0.5">+12% Since Yesterday</div>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-[#DDD5C7]/70 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#EFE9DF]">
                      <span className="text-[#5C5549] font-medium">Card Payments</span>
                      <strong className="text-[#1F313D]">$1,120 (72%)</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#EFE9DF]">
                      <span className="text-[#5C5549] font-medium">Cash / QR Pay</span>
                      <strong className="text-[#1F313D]">$430 (28%)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
