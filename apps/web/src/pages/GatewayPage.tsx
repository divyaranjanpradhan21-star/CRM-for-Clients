import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { ShieldCheck, Store, Users, ArrowRight, Utensils, CheckCircle, Smartphone } from 'lucide-react';

export const GatewayPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col justify-between font-sans selection:bg-[#f95721] selection:text-white">
      <SEOHead
        title="DinePulse | Enterprise Cafe & Restaurant CRM SaaS System"
        description="Select your portal terminal: Super Admin Platform Command, Restaurant Admin Operations, or Staff Floor Terminal."
        canonicalPath="/"
      />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#f95721] flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">DinePulse</span>
            <span className="text-[10px] font-mono tracking-widest text-[#f95721] block uppercase font-bold">Restaurant CRM SaaS</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cloud API Connected
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">PostgreSQL 16 &amp; Supabase RLS Active</span>
        </div>
      </header>

      {/* Main Hero */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-orange-400 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#f95721]"></span>
          Three Separate &amp; Independent Portal Terminals
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl mb-6 leading-tight">
          Cafe &amp; Restaurant <span className="text-[#f95721]">CRM Management</span> System
        </h1>

        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mb-14 leading-relaxed">
          Access your dedicated operational portal. Choose your authorized role below to launch your terminal.
        </p>

        {/* The 3 Portal Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-6xl">
          {/* PORTAL 1: SUPER ADMIN */}
          <div className="bg-[#181a24] rounded-3xl p-8 border border-white/10 hover:border-[#f95721] transition-all flex flex-col justify-between shadow-2xl group hover:-translate-y-1">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[#f95721] flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#f95721] uppercase">Portal 1</span>
              <h2 className="text-2xl font-bold text-white mt-1 mb-3">Super Admin Portal</h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Platform-wide control center for managing multi-tenant restaurant organizations, subscription limits, global audit logs, and platform telemetry.
              </p>

              <ul className="space-y-2 text-xs text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  Tenant Organizations &amp; Admins
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  SaaS Subscription &amp; Quota Limits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  Platform-Wide Financial Analytics
                </li>
              </ul>
            </div>

            <Link
              to="/super-admin/login"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#f95721] hover:bg-[#e04816] text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition"
            >
              <span>Launch Super Admin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* PORTAL 2: RESTAURANT ADMIN */}
          <div className="bg-[#181a24] rounded-3xl p-8 border border-white/10 hover:border-blue-500 transition-all flex flex-col justify-between shadow-2xl group hover:-translate-y-1 relative">
            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-blue-600 text-white font-mono text-[10px] uppercase font-bold tracking-wider shadow-md">
              Primary Outlet Hub
            </div>
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
                <Store className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-blue-400 uppercase">Portal 2</span>
              <h2 className="text-2xl font-bold text-white mt-1 mb-3">Restaurant Admin</h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Comprehensive operational suite: live floorplan, reservations, table occupancy, menu engineering, loyalty rewards, customer 360°, and POS orders.
              </p>

              <ul className="space-y-2 text-xs text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  Outlets Operational Cost &amp; Revenue
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  Table Management &amp; Reservations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  POS Orders, Menu &amp; Staff Scheduling
                </li>
              </ul>
            </div>

            <Link
              to="/admin/login"
              className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition"
            >
              <span>Launch Restaurant Admin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* PORTAL 3: STAFF PORTAL */}
          <div className="bg-[#181a24] rounded-3xl p-8 border border-white/10 hover:border-emerald-500 transition-all flex flex-col justify-between shadow-2xl group hover:-translate-y-1">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">Portal 3</span>
              <h2 className="text-2xl font-bold text-white mt-1 mb-3">Staff Service Portal</h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Fast, mobile-friendly terminal designed for floor hosts, servers, and counter staff. Quick guest registration, table seating, and active orders.
              </p>

              <ul className="space-y-2 text-xs text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  Mobile-Optimized Touch Operations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  Instant Guest Registration &amp; Seating
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  Active Kitchen &amp; Bar Order Tracking
                </li>
              </ul>
            </div>

            <Link
              to="/staff/login"
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <span>Launch Staff Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <span>© 2026 DinePulse Hospitality Platform. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <Link to="/super-admin/login" className="hover:text-white transition">Super Admin</Link>
          <Link to="/admin/login" className="hover:text-white transition">Restaurant Admin</Link>
          <Link to="/staff/login" className="hover:text-white transition">Staff Terminal</Link>
          <a href="/robots.txt" className="hover:text-white transition">Robots</a>
          <a href="/sitemap.xml" className="hover:text-white transition">Sitemap</a>
        </div>
      </footer>
    </div>
  );
};
