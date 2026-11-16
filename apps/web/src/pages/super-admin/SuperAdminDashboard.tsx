import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';
import {
  ShieldAlert,
  Building2,
  Users,
  CreditCard,
  Activity,
  Server,
  Lock,
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Settings
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const handleLogout = () => {
    localStorage.removeItem('portal_role');
    localStorage.removeItem('user_email');
    navigate('/super-admin/login');
  };

  const organizations = [
    { id: 'org_1', name: 'Artisan Bistro Group', tier: 'ENTERPRISE', outlets: 8, status: 'ACTIVE', mrr: '$1,490', health: '99.9%' },
    { id: 'org_2', name: 'Urban Burger Labs', tier: 'PRO', outlets: 3, status: 'ACTIVE', mrr: '$590', health: '100%' },
    { id: 'org_3', name: 'Trattoria Bella Napoli', tier: 'PRO', outlets: 2, status: 'ACTIVE', mrr: '$390', health: '99.8%' },
    { id: 'org_4', name: 'Kyoto Sushi & Ramen Bar', tier: 'ENTERPRISE', outlets: 5, status: 'ACTIVE', mrr: '$990', health: '99.9%' },
    { id: 'org_5', name: 'Sunrise Bakery & Cafe', tier: 'STARTER', outlets: 1, status: 'TRIAL', mrr: '$99', health: '100%' },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans flex flex-col">
      <SEOHead
        title="Super Admin Platform Command Center | DinePulse SaaS"
        description="Global platform administration, multi-tenant restaurant organization directory, subscription control, and security audit logs."
        canonicalPath="/super-admin/dashboard"
      />

      {/* Top Navbar */}
      <header className="h-16 bg-[#111827] border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-orange-600/30">
              DP
            </div>
            <span className="font-bold text-white text-sm tracking-wide">DinePulse Global</span>
          </Link>
          <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Super Admin
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">Platform Owner</div>
            <div className="text-[10px] font-mono text-slate-500">superadmin@dinepulse.internal</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
        {/* Header & KPI Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">SaaS Command Center</h1>
            <p className="text-xs text-slate-400 mt-1">Multi-Tenant Platform Health, Global Billings &amp; Organization Oversight</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-600/20 transition">
              <Plus className="w-4 h-4" />
              Provision Organization
            </button>
          </div>
        </div>

        {/* Top 4 Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Organizations</span>
              <Building2 className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-black text-white mt-2">128</div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> +14 new this month
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Outlets</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-white mt-2">342</div>
            <div className="text-[10px] text-slate-400 mt-1 font-semibold">Across 18 regions</div>
          </div>

          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Platform Monthly Recurring</span>
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">$84,320</div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> +18.4% MRR growth
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Core Systems Health</span>
              <Server className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-white mt-2">99.98%</div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> All APIs operational
            </div>
          </div>
        </div>

        {/* Organizations Management Table */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Registered Organizations</h2>
              <p className="text-xs text-slate-400">Live operational status and subscription levels</p>
            </div>

            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search organizations..."
                className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Organization</th>
                  <th className="pb-3">Subscription</th>
                  <th className="pb-3">Active Outlets</th>
                  <th className="pb-3">Monthly ARR</th>
                  <th className="pb-3">Uptime</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 pl-2 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-mono text-[10px]">
                        {org.name.slice(0, 2).toUpperCase()}
                      </div>
                      {org.name}
                    </td>
                    <td className="py-4">
                      <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                        {org.tier}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300 font-mono">{org.outlets} outlets</td>
                    <td className="py-4 text-emerald-400 font-bold">{org.mrr}</td>
                    <td className="py-4 text-slate-300 font-mono">{org.health}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        org.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        ● {org.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <button className="text-orange-400 hover:text-orange-300 font-semibold text-xs hover:underline">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-8 py-4 text-xs text-slate-500 flex items-center justify-between">
        <span>DinePulse Platform Control · ISO 27001 &amp; SOC-2 Type II Certified</span>
        <div className="flex items-center gap-4">
          <Link to="/admin/login" className="hover:text-slate-400">Admin Portal</Link>
          <Link to="/staff/login" className="hover:text-slate-400">Staff Portal</Link>
        </div>
      </footer>
    </div>
  );
};
