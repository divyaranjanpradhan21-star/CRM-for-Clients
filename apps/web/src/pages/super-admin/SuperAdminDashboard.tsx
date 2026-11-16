import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';
import { clearCurrentSession } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard,
  Building2,
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
  ShieldAlert,
  Server
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

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
    <div className="flex min-h-screen bg-[#f3f4f8] text-[#1e293b] font-sans antialiased">
      <SEOHead
        title="Super Admin SaaS Command Center | DinePulse Platform"
        description="Global SaaS administration, multi-tenant restaurant organization directory, subscription control, and infrastructure cost vs SaaS revenue."
        canonicalPath="/super-admin/dashboard"
      />

      {/* Slim Left Icon Sidebar */}
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
          <nav className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={() => setActiveTab('overview')}
              title="Overview"
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-orange-50 text-[#f95721] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              title="Organizations & Tenants"
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'organizations'
                  ? 'bg-orange-50 text-[#f95721] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('users')}
              title="Global User Management"
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'users'
                  ? 'bg-orange-50 text-[#f95721] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              title="Subscriptions & MRR"
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'billing'
                  ? 'bg-orange-50 text-[#f95721] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('health')}
              title="Platform Infrastructure"
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'health'
                  ? 'bg-orange-50 text-[#f95721] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Server className="w-5 h-5" />
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Super Admin Overview</h1>
              <span className="bg-amber-500/10 text-amber-800 border border-amber-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                Cafe's Corner Platform
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Cafe's Corner Multi-Tenant Platform &amp; Organization Oversight.</p>
          </div>

          {/* Search bar & Profile */}
          <div className="flex items-center gap-6">
            <div className="relative w-80">
              <input
                type="text"
                placeholder="Search organizations, admins, domains..."
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-full pl-10 pr-12 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#f95721] transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <span className="absolute right-3.5 top-2 text-[10px] font-mono text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">⌘F</span>
            </div>

            <button className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-[#f95721] absolute top-1.5 right-1.5"></span>
            </button>

            {/* User Pill */}
            <div className="flex items-center gap-3 bg-[#f8fafc] border border-slate-200 rounded-full pl-1.5 pr-4 py-1">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Super Administrator"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">Alex Mercer</div>
                <div className="text-[10px] text-slate-400 font-medium">Platform Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body Grid Matching First Photo */}
        <main className="p-8 space-y-6 max-w-[1700px] w-full mx-auto">
          {/* Top Row: 4 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Hero Orange Card: Total Organizations */}
            <div className="bg-[#f95721] rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-white/20">
                    <Building2 className="w-4 h-4 text-white" />
                  </span>
                  <span className="text-xs font-semibold text-white/90">Total Organizations</span>
                </div>
              </div>
              <div className="my-4">
                <div className="text-4xl font-extrabold tracking-tight">128</div>
                <div className="flex items-center gap-1.5 text-xs text-white/90 mt-2 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+10% Since last month</span>
                </div>
              </div>
            </div>

            {/* Total Active Outlets */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-slate-100 text-slate-600">
                  <UtensilsCrossed className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-slate-500">Active Outlets</span>
              </div>
              <div className="my-4">
                <div className="text-3xl font-extrabold text-slate-900">342</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+7.5% Since last month</span>
                </div>
              </div>
            </div>

            {/* Churned Organizations */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-slate-100 text-slate-600">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-slate-500">Churned Orgs</span>
              </div>
              <div className="my-4">
                <div className="text-3xl font-extrabold text-slate-900">3</div>
                <div className="flex items-center gap-1.5 text-xs text-rose-500 mt-2 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>-3.5% Since last month</span>
                </div>
              </div>
            </div>

            {/* Platform Monthly Recurring Revenue (MRR) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-slate-100 text-slate-600">
                  <DollarSign className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-slate-500">Platform MRR</span>
              </div>
              <div className="my-4">
                <div className="text-3xl font-extrabold text-slate-900">$84,320</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+7.5% Since last month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Layout: Left 8 cols (Chart & Categories), Right 4 cols (Trending & POS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols */}
            <div className="lg:col-span-8 space-y-6">
              {/* Operational Cost vs SaaS Revenue Chart Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Outlets Operational Cost Vs Revenue</h2>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-slate-900">$3500</span>
                      <span className="text-xs font-medium text-slate-400">Revenue</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                        Sales
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f95721]"></span>
                        Operational Cost
                      </span>
                    </div>

                    <button className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 flex items-center gap-2 hover:bg-slate-50">
                      Weekly
                      <Filter className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* SVG Visual Representation of the Dual Curve Outlet Graph */}
                <div className="w-full h-56 pt-4 relative select-none">
                  {/* Subtle Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 font-mono pointer-events-none pb-6">
                    <div className="border-b border-slate-100 flex justify-between"><span>$15k</span></div>
                    <div className="border-b border-slate-100 flex justify-between"><span>$12k</span></div>
                    <div className="border-b border-slate-100 flex justify-between"><span>$9k</span></div>
                    <div className="border-b border-slate-100 flex justify-between"><span>$6k</span></div>
                    <div className="border-b border-slate-100 flex justify-between"><span>$3k</span></div>
                    <div className="border-b border-slate-100 flex justify-between"><span>$0k</span></div>
                  </div>

                  {/* SVG Chart Curves with Tenant 05 Highlight Bar */}
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="superOutlet5Grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f95721" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#f95721" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Vertical Pill highlight behind Tenant 05 */}
                    <rect x="365" y="10" width="36" height="150" rx="18" fill="url(#superOutlet5Grad)" />

                    {/* Dark/Blue Sales Line */}
                    <path
                      d="M 20,120 Q 90,80 140,110 T 260,70 T 380,50 T 490,95 T 600,60 T 680,85"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Orange Operational Cost Line */}
                    <path
                      d="M 20,140 Q 90,110 140,135 T 260,95 T 380,85 T 490,115 T 600,80 T 680,105"
                      fill="none"
                      stroke="#f95721"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Data Points on Tenant 05 */}
                    <circle cx="383" cy="50" r="5" fill="#334155" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="383" cy="85" r="5" fill="#f95721" stroke="#ffffff" strokeWidth="2" />

                    {/* Tooltip badges */}
                    <rect x="340" y="24" width="46" height="20" rx="10" fill="#0f172a" />
                    <text x="363" y="38" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">$14K</text>

                    <rect x="400" y="74" width="50" height="20" rx="10" fill="#0f172a" />
                    <text x="425" y="88" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">$10.5K</text>
                  </svg>

                  {/* Outlet X-Axis Labels */}
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 px-2">
                    <span>Outlet 01</span>
                    <span>Outlet 02</span>
                    <span>Outlet 03</span>
                    <span>Outlet 04</span>
                    <span className="text-[#f95721] font-bold">Outlet 05</span>
                    <span>Outlet 06</span>
                    <span>Outlet 07</span>
                    <span>Outlet 08</span>
                  </div>
                </div>
              </div>

              {/* Two Column Sub-Section: Top Subscription Tiers & Cluster Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Categories / SaaS Tiers */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900">Top Categories Item</h2>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Seafood / Enterprise */}
                    <div className="flex flex-col items-center">
                      <div className="w-full h-24 rounded-2xl overflow-hidden relative shadow-sm mb-2 group">
                        <img
                          src="https://images.unsplash.com/photo-1559742811-822873691df8?w=300&auto=format&fit=crop&q=80"
                          alt="Seafood Enterprise Category"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                          <span className="text-xs font-bold text-white">Seafood</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-800">65%</span>
                    </div>

                    {/* Beverage / Pro */}
                    <div className="flex flex-col items-center">
                      <div className="w-full h-24 rounded-2xl overflow-hidden relative shadow-sm mb-2 group">
                        <img
                          src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=80"
                          alt="Beverage Pro Category"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                          <span className="text-xs font-bold text-white">Beverage</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-800">45%</span>
                    </div>

                    {/* Desserts / Starter */}
                    <div className="flex flex-col items-center">
                      <div className="w-full h-24 rounded-2xl overflow-hidden relative shadow-sm mb-2 group">
                        <img
                          src="https://images.unsplash.com/photo-1587314168485-3236d6710814?w=300&auto=format&fit=crop&q=80"
                          alt="Desserts Category"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                          <span className="text-xs font-bold text-white">Desserts</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-800">81%</span>
                    </div>
                  </div>
                </div>

                {/* Employee / Cluster Status Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Employe status</h2>
                      <span className="text-xs text-slate-400">Total Employes — 120</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Semi-gauge SVG visual */}
                    <div className="relative w-36 h-20 overflow-hidden flex items-end justify-center">
                      <svg viewBox="0 0 100 50" className="w-full h-full">
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
                        <path d="M 10 50 A 40 40 0 0 1 70 18" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round" />
                        <path d="M 70 18 A 40 40 0 0 1 82 32" fill="none" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
                        <path d="M 82 32 A 40 40 0 0 1 90 50" fill="none" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2 text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-600">On Duty</span>
                        <span className="text-slate-900 font-bold ml-auto">— 83</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="text-slate-600">On Break</span>
                        <span className="text-slate-900 font-bold ml-auto">— 10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span className="text-slate-600">Absent</span>
                        <span className="text-slate-900 font-bold ml-auto">— 07</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders / Organizations Strip */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search here..."
                        className="bg-[#f8fafc] border border-slate-200 rounded-full pl-8 pr-4 py-1 text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1">
                      Today ▾
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Order 1 */}
                  <div className="bg-[#f8fafc] border border-slate-200/70 rounded-2xl p-3 flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1544025162-d76694265947?w=160&auto=format&fit=crop&q=80"
                      alt="Beef Steak"
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Beef Steak</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">Order ID: #ORD-1001</div>
                      <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Ready to Serve
                      </span>
                    </div>
                  </div>

                  {/* Order 2 */}
                  <div className="bg-[#f8fafc] border border-slate-200/70 rounded-2xl p-3 flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&auto=format&fit=crop&q=80"
                      alt="Beef Burger"
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Beef Burger</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">Order ID: #ORD-1031</div>
                      <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        In Kitchen
                      </span>
                    </div>
                  </div>

                  {/* Order 3 */}
                  <div className="bg-[#f8fafc] border border-slate-200/70 rounded-2xl p-3 flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80"
                      alt="Special Pizza"
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Special Pizza</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">Order ID: #ORD-1021</div>
                      <span className="inline-block mt-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        Delivered
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Trending Menu Item & POS Activities */}
            <div className="lg:col-span-4 space-y-6">
              {/* Trending Menu Item Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">Trending Menu Item</h2>
                  <Sparkles className="w-4 h-4 text-[#f95721]" />
                </div>

                <div className="rounded-2xl overflow-hidden mb-4 shadow-sm relative">
                  <img
                    src="https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=600&auto=format&fit=crop&q=80"
                    alt="Fish & Chips British Classic"
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    4.6 <span className="text-white/60 font-normal">(420 orders)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Fish &amp; Chips (British classic)</h3>
                    <p className="text-xs text-slate-400">Crispy battered cod with chips</p>
                  </div>
                  <span className="text-xl font-extrabold text-[#f95721]">$12</span>
                </div>
              </div>

              {/* POS Activities Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">POS Activities</h2>
                  <span className="text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg px-2 py-0.5">
                    Today's ▾
                  </span>
                </div>

                {/* Total Sales KPI */}
                <div className="mb-6">
                  <span className="text-xs font-medium text-slate-400">Total Sales →</span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-black text-slate-900">$1550</span>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +12% Since Yesterday
                    </span>
                  </div>
                </div>

                {/* Sub KPI Stats Strip */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center mb-6">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Total Bills</div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">147</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">AVG Value</div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">$12</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Peak Hour</div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">5.00 PM</div>
                  </div>
                </div>

                {/* Payment Method Radial Meter */}
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-3">Payment Method</div>
                  <div className="flex flex-col items-center justify-center pt-2">
                    <div className="relative w-44 h-24 overflow-hidden flex items-end justify-center">
                      <svg viewBox="0 0 120 60" className="w-full h-full">
                        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                        <path d="M 10 60 A 50 50 0 0 1 80 14" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" />
                        <path d="M 80 14 A 50 50 0 0 1 104 36" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" />
                        <path d="M 104 36 A 50 50 0 0 1 110 60" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
                      </svg>
                      <div className="absolute bottom-0 text-center">
                        <div className="text-2xl font-black text-slate-900">60%</div>
                        <div className="text-[10px] font-semibold text-slate-400">Cash Payment</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full text-[11px] font-medium text-slate-500 mt-3 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Cash 60%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Card 25%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Online 15%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
