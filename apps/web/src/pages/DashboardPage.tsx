import React, { useState } from 'react';
import {
  Clock,
  Users,
  AlertTriangle,
  Calendar,
  Layers,
  ChevronRight,
  LogOut,
  Plus,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

interface DashboardPageProps {
  onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const [activeShift, setActiveShift] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [sidebarTab, setSidebarTab] = useState<'board' | 'pool' | 'conflicts' | 'shift' | 'confirmations' | 'totals'>('board');

  return (
    <div className="min-h-screen w-full bg-[#f6ede3] text-[#1f1610] flex font-sans select-none overflow-x-hidden">
      {/* ────────────────── LEFT SIDEBAR (Dark Espresso Theme) ────────────────── */}
      <aside className="w-64 bg-[#1d1713] text-[#e6dbcf] flex flex-col justify-between shrink-0 p-4 border-r border-[#30251e] shadow-2xl">
        <div className="space-y-6">
          {/* Date Badge */}
          <div className="pt-2 pb-1 border-b border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold">
              Saturday · Sep 27
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>

          {/* Navigation Items (Matching Image 2 Sidebar) */}
          <nav className="space-y-2">
            {/* BOARD - 5 OPEN */}
            <button
              onClick={() => setSidebarTab('board')}
              className={`w-full text-left p-3 rounded-xl transition-all flex flex-col ${
                sidebarTab === 'board'
                  ? 'bg-[#2b211a] border border-amber-600/50 shadow-md'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider uppercase text-white">Board</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  5 Open
                </span>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5">Live Shift Distribution</span>
            </button>

            {/* POOL - 5 AVAILABLE */}
            <button
              onClick={() => setSidebarTab('pool')}
              className={`w-full text-left p-3 rounded-xl transition-all flex flex-col ${
                sidebarTab === 'pool'
                  ? 'bg-[#2b211a] border border-amber-600/50 shadow-md'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider uppercase text-white">Pool</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  5 Available
                </span>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5">Staff & Volunteers Queue</span>
            </button>

            {/* CONFLICTS - 1 OPEN */}
            <button
              onClick={() => setSidebarTab('conflicts')}
              className={`w-full text-left p-3 rounded-xl transition-all flex flex-col ${
                sidebarTab === 'conflicts'
                  ? 'bg-[#2b211a] border border-amber-600/50 shadow-md'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider uppercase text-white">Conflicts</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  1 Open
                </span>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5">Cover requested · Kitchen</span>
            </button>

            {/* SHIFT DETAIL */}
            <button
              onClick={() => setSidebarTab('shift')}
              className={`w-full text-left p-3 rounded-xl transition-all flex flex-col ${
                sidebarTab === 'shift'
                  ? 'bg-[#2b211a] border border-amber-600/50 shadow-md'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-xs font-bold tracking-wider uppercase text-white">Shift Detail</span>
              <span className="text-[10px] text-gray-400 mt-0.5 font-mono">Kitchen · 6 Slots</span>
            </button>

            {/* CONFIRMATIONS */}
            <button
              onClick={() => setSidebarTab('confirmations')}
              className={`w-full text-left p-3 rounded-xl transition-all flex flex-col ${
                sidebarTab === 'confirmations'
                  ? 'bg-[#2b211a] border border-amber-600/50 shadow-md'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-xs font-bold tracking-wider uppercase text-white">Confirmations</span>
              <span className="text-[10px] text-gray-400 mt-0.5 font-mono">5 Awaiting Response</span>
            </button>

            {/* MONTH TOTALS */}
            <button
              onClick={() => setSidebarTab('totals')}
              className={`w-full text-left p-3 rounded-xl transition-all flex flex-col ${
                sidebarTab === 'totals'
                  ? 'bg-[#2b211a] border border-amber-600/50 shadow-md'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-xs font-bold tracking-wider uppercase text-white">Month Totals</span>
              <span className="text-[10px] text-gray-400 mt-0.5 font-mono">September 2026</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer with Logout & Return to Login */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <div className="px-3 py-2 bg-white/5 rounded-lg flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center font-bold text-xs text-white">
              DA
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold text-white leading-tight">Super Admin</p>
              <p className="text-[10px] text-gray-400 truncate">admin@crm.internal</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out to Portal
          </button>
        </div>
      </aside>

      {/* ────────────────── MAIN CONTENT CANVAS (Warm Cream Aesthetic) ────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header Bar */}
        <header className="px-8 pt-6 pb-4 border-b border-[#e5d5c4] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-[#8c6748] uppercase font-bold">
              <span>Food Distribution</span>
              <span>·</span>
              <span className="text-[#a87449]">Community Kitchen · 214 Alder St · 9:00 AM-1:00 PM</span>
            </div>

            <div className="flex items-baseline gap-4 mt-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-[#1f1610]">
                5 <span className="text-2xl font-bold tracking-normal uppercase">Open</span>
              </h1>
              <h2 className="text-2xl font-bold text-[#823a0d] tracking-tight uppercase">
                Kitchen Still Needs 2
              </h2>
            </div>

            <p className="text-xs text-[#7d6756] mt-1 font-medium">
              18 slots · 12 filled · all confirmed before the Fri 6:00 PM reminder
            </p>
          </div>

          {/* Right Header Controls: Countdown timer + Shift Filters */}
          <div className="flex items-center gap-4">
            {/* Countdown Badge (Image 2) */}
            <div className="bg-[#1d1713] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-md">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">To Start</span>
              <span className="font-mono font-bold text-sm text-amber-400">38:13:58</span>
            </div>

            {/* Shift Pill Filters (Morning / Afternoon / Evening) */}
            <div className="bg-[#e9dbcd] p-1 rounded-full flex items-center shadow-inner">
              <button
                onClick={() => setActiveShift('morning')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeShift === 'morning'
                    ? 'bg-[#df7e26] text-white shadow-sm'
                    : 'text-[#6d5543] hover:text-[#1f1610]'
                }`}
              >
                Morning
              </button>
              <button
                onClick={() => setActiveShift('afternoon')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeShift === 'afternoon'
                    ? 'bg-[#df7e26] text-white shadow-sm'
                    : 'text-[#6d5543] hover:text-[#1f1610]'
                }`}
              >
                Afternoon
              </button>
              <button
                onClick={() => setActiveShift('evening')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeShift === 'evening'
                    ? 'bg-[#df7e26] text-white shadow-sm'
                    : 'text-[#6d5543] hover:text-[#1f1610]'
                }`}
              >
                Evening
              </button>
            </div>
          </div>
        </header>

        {/* Grid Body: 3 Warm Shift Columns (Image 2 Layout) */}
        <main className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
          {/* ──────── COLUMN 1: KITCHEN · 4 OF 6 STAFFED ──────── */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#6b4931] font-bold border-b border-[#e4d2bf] pb-2">
              <span>Kitchen · 4 of 6 Staffed</span>
              <span className="text-[#a5521b]">Lead: Ivo Marsh</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* IM - Ivo Marsh */}
              <div className="bg-[#c9641f] text-white p-4 rounded-2xl flex flex-col justify-between h-36 shadow-sm hover:scale-[1.02] transition-transform">
                <span className="text-3xl font-extrabold tracking-tight font-mono">IM</span>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Ivo Marsh</h4>
                  <p className="text-[10px] font-mono tracking-wider uppercase text-orange-200">Lead · Grill</p>
                </div>
              </div>

              {/* SR - Sofia Reyes */}
              <div className="bg-[#de7d27] text-white p-4 rounded-2xl flex flex-col justify-between h-36 shadow-sm hover:scale-[1.02] transition-transform">
                <span className="text-3xl font-extrabold tracking-tight font-mono">SR</span>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Sofia Reyes</h4>
                  <p className="text-[10px] font-mono tracking-wider uppercase text-orange-200">Line · 9:00</p>
                </div>
              </div>

              {/* OH - Omar Haddad */}
              <div className="bg-[#e58a32] text-white p-4 rounded-2xl flex flex-col justify-between h-36 shadow-sm hover:scale-[1.02] transition-transform">
                <span className="text-3xl font-extrabold tracking-tight font-mono">OH</span>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Omar Haddad</h4>
                  <p className="text-[10px] font-mono tracking-wider uppercase text-orange-200">Prep · 9:30</p>
                </div>
              </div>

              {/* LK - Lena Kowalski */}
              <div className="bg-[#de7d27] text-white p-4 rounded-2xl flex flex-col justify-between h-36 shadow-sm hover:scale-[1.02] transition-transform">
                <span className="text-3xl font-extrabold tracking-tight font-mono">LK</span>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Lena Kowalski</h4>
                  <p className="text-[10px] font-mono tracking-wider uppercase text-orange-200">Packing · 10:00</p>
                </div>
              </div>

              {/* MB - Marcus Bell */}
              <div className="bg-[#efaa63] text-white p-4 rounded-2xl flex flex-col justify-between h-36 shadow-sm hover:scale-[1.02] transition-transform">
                <span className="text-3xl font-extrabold tracking-tight font-mono">MB</span>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Marcus Bell</h4>
                  <p className="text-[10px] font-mono tracking-wider uppercase text-amber-950 font-semibold">Pending</p>
                </div>
              </div>

              {/* OPEN SLOT */}
              <div className="border-2 border-dashed border-[#dfbda0] bg-[#fbf5ee] p-4 rounded-2xl flex flex-col justify-between h-36 hover:border-amber-600 transition-colors cursor-pointer group">
                <span className="text-xs font-mono uppercase text-[#966b49] font-bold">Slot 06 · 10:30</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold uppercase text-[#7a4825]">Open</span>
                  <Plus className="w-5 h-5 text-amber-600 group-hover:rotate-90 transition-transform" />
                </div>
              </div>
            </div>

            {/* Bottom Tag Card */}
            <div className="bg-[#ecd8c5] p-3.5 rounded-xl text-[11px] font-mono text-[#61422d] flex flex-col gap-1">
              <span className="font-bold uppercase tracking-wider text-[#934515]">Food Distribution</span>
              <span>9:00 AM-1:00 PM · 38:13:58 To Start</span>
            </div>
          </div>

          {/* ──────── COLUMN 2: FURNITURE RUN · 9:30-11:30 AM ──────── */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#6b4931] font-bold border-b border-[#e4d2bf] pb-2">
              <span>Furniture Run · 9:30–11:30 AM</span>
              <span className="text-[#a5521b]">2 Open</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* GA - Grace Adeyemi */}
              <div className="bg-[#de7d27] text-white p-4 rounded-2xl flex flex-col justify-between h-36 shadow-sm hover:scale-[1.02] transition-transform">
                <span className="text-3xl font-extrabold tracking-tight font-mono">GA</span>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Grace Adeyemi</h4>
                  <p className="text-[10px] font-mono tracking-wider uppercase text-orange-200">Driver</p>
                </div>
              </div>

              {/* MB - Marcus Bell with "COVER REQUESTED" tooltip */}
              <div className="relative bg-[#de7d27] text-white p-4 rounded-2xl flex flex-col justify-between h-36 shadow-sm hover:scale-[1.02] transition-transform">
                {/* Floating Tooltip */}
                <div className="absolute -top-3.5 right-2 bg-[#1d1713] text-white text-[9px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shadow-lg border border-white/20 animate-bounce">
                  Cover Requested
                </div>
                <span className="text-3xl font-extrabold tracking-tight font-mono">MB</span>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Marcus Bell</h4>
                  <p className="text-[10px] font-mono tracking-wider uppercase text-orange-200">Assistant</p>
                </div>
              </div>

              {/* SLOT 03 OPEN */}
              <div className="border-2 border-dashed border-[#dfbda0] bg-[#fbf5ee] p-4 rounded-2xl flex flex-col justify-between h-36 hover:border-amber-600 transition-colors cursor-pointer group">
                <span className="text-xs font-mono uppercase text-[#966b49] font-bold">Slot 03</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold uppercase text-[#7a4825]">Open</span>
                  <Plus className="w-5 h-5 text-amber-600 group-hover:rotate-90 transition-transform" />
                </div>
              </div>

              {/* SLOT 04 OPEN */}
              <div className="border-2 border-dashed border-[#dfbda0] bg-[#fbf5ee] p-4 rounded-2xl flex flex-col justify-between h-36 hover:border-amber-600 transition-colors cursor-pointer group">
                <span className="text-xs font-mono uppercase text-[#966b49] font-bold">Slot 04</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold uppercase text-[#7a4825]">Open</span>
                  <Plus className="w-5 h-5 text-amber-600 group-hover:rotate-90 transition-transform" />
                </div>
              </div>
            </div>

            {/* Bottom Tag Card */}
            <div className="bg-[#ecd8c5] p-3.5 rounded-xl text-[11px] font-mono text-[#61422d] flex flex-col gap-1">
              <span className="font-bold uppercase tracking-wider text-[#934515]">Furniture Run</span>
              <span>9:30–11:30 AM · Donation Dock, 88 Mill Rd</span>
            </div>
          </div>

          {/* ──────── COLUMN 3: CHOIR REHEARSAL · 5:30-7:30 PM ──────── */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#6b4931] font-bold border-b border-[#e4d2bf] pb-2">
              <span>Choir Rehearsal · 5:30–7:30 PM</span>
              <span className="text-[#a5521b]">2 Open</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {/* Row 1 cards */}
              <div className="bg-[#efaa63] text-[#331c0e] p-2 rounded-xl flex flex-col justify-between h-28 shadow-sm">
                <span className="text-lg font-bold font-mono">EV</span>
                <span className="text-[9px] font-semibold leading-tight truncate">Elena Vidal</span>
              </div>
              <div className="bg-[#de7d27] text-white p-2 rounded-xl flex flex-col justify-between h-28 shadow-sm">
                <span className="text-lg font-bold font-mono">RE</span>
                <span className="text-[9px] font-semibold leading-tight truncate">Ruth Ellison</span>
              </div>
              <div className="bg-[#de7d27] text-white p-2 rounded-xl flex flex-col justify-between h-28 shadow-sm">
                <span className="text-lg font-bold font-mono">SO</span>
                <span className="text-[9px] font-semibold leading-tight truncate">Sam Okoye</span>
              </div>
              <div className="bg-[#c9641f] text-white p-2 rounded-xl flex flex-col justify-between h-28 shadow-sm">
                <span className="text-lg font-bold font-mono">AP</span>
                <span className="text-[9px] font-semibold leading-tight truncate">Ana Petrova</span>
              </div>

              {/* Row 2 cards */}
              <div className="bg-[#de7d27] text-white p-2 rounded-xl flex flex-col justify-between h-28 shadow-sm">
                <span className="text-lg font-bold font-mono">DK</span>
                <span className="text-[9px] font-semibold leading-tight truncate">David Kim</span>
              </div>
              <div className="bg-[#de7d27] text-white p-2 rounded-xl flex flex-col justify-between h-28 shadow-sm">
                <span className="text-lg font-bold font-mono">NF</span>
                <span className="text-[9px] font-semibold leading-tight truncate">Nora Fahmy</span>
              </div>
              <div className="border border-dashed border-[#dfbda0] bg-[#fbf5ee] p-2 rounded-xl flex flex-col justify-between h-28">
                <span className="text-[9px] font-mono uppercase text-[#966b49]">Slot 7</span>
                <span className="text-[10px] font-bold uppercase text-[#7a4825]">Open</span>
              </div>
              <div className="border border-dashed border-[#dfbda0] bg-[#fbf5ee] p-2 rounded-xl flex flex-col justify-between h-28">
                <span className="text-[9px] font-mono uppercase text-[#966b49]">Slot 8</span>
                <span className="text-[10px] font-bold uppercase text-[#7a4825]">Open</span>
              </div>
            </div>

            {/* Bottom Tag Card */}
            <div className="bg-[#ecd8c5] p-3.5 rounded-xl text-[11px] font-mono text-[#61422d] flex flex-col gap-1">
              <span className="font-bold uppercase tracking-wider text-[#934515]">Choir Rehearsal</span>
              <span>5:30–7:30 PM · Sanctuary Auditorium</span>
            </div>
          </div>
        </main>
      </div>

      {/* ────────────────── RIGHT PANEL: SAT AM QUEUE ────────────────── */}
      <aside className="w-80 bg-[#fbf6f0] border-l border-[#e4d2bf] p-6 shrink-0 flex flex-col justify-between shadow-lg">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#e5d5c4]">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#724a2e]">
              Sat AM Queue
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#df7e26]/20 text-[#a84f09] border border-[#df7e26]/30">
              5 Available
            </span>
          </div>

          {/* Queue List with Initials Avatars (Image 2) */}
          <div className="space-y-3">
            {/* RO - Renata Osei */}
            <div className="p-3 bg-white/70 hover:bg-white rounded-xl border border-[#ebdccc] shadow-sm flex items-center gap-3 transition">
              <div className="w-10 h-10 rounded-full bg-[#df7e26] text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm shrink-0">
                RO
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-[#1f1610] truncate">Renata Osei</h4>
                <p className="text-[10px] text-[#7d6756] truncate">Foodsafe · Cashier · 12.5 hrs</p>
                <span className="text-[9px] font-mono font-bold text-amber-700">Sat AM</span>
              </div>
            </div>

            {/* MB - Marcus Bell (BOOKED) */}
            <div className="p-3 bg-white/70 hover:bg-white rounded-xl border border-[#ebdccc] shadow-sm flex items-center gap-3 transition">
              <div className="w-10 h-10 rounded-full bg-[#c9641f] text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm shrink-0">
                MB
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-[#1f1610] truncate">Marcus Bell</h4>
                  <span className="text-[8px] font-mono uppercase bg-[#1d1713] text-white px-1.5 py-0.5 rounded-md font-bold tracking-tight">
                    Booked · Kitchen
                  </span>
                </div>
                <p className="text-[10px] text-[#7d6756] truncate">Driver · Lifting · 8.0 hrs</p>
                <span className="text-[9px] font-mono font-bold text-amber-700">Sat all day</span>
              </div>
            </div>

            {/* JP - Jonah Petersen */}
            <div className="p-3 bg-white/70 hover:bg-white rounded-xl border border-[#ebdccc] shadow-sm flex items-center gap-3 transition">
              <div className="w-10 h-10 rounded-full bg-[#de7d27] text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm shrink-0">
                JP
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-[#1f1610] truncate">Jonah Petersen</h4>
                <p className="text-[10px] text-[#7d6756] truncate">Lifting · 4.5 hrs</p>
                <span className="text-[9px] font-mono font-bold text-amber-700">Sat AM</span>
              </div>
            </div>

            {/* TL - Tomas Lindqvist */}
            <div className="p-3 bg-white/70 hover:bg-white rounded-xl border border-[#ebdccc] shadow-sm flex items-center gap-3 transition">
              <div className="w-10 h-10 rounded-full bg-[#e58a32] text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm shrink-0">
                TL
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-[#1f1610] truncate">Tomas Lindqvist</h4>
                <p className="text-[10px] text-[#7d6756] truncate">Foodsafe · 9.25 hrs</p>
                <span className="text-[9px] font-mono font-bold text-amber-700">Sat AM</span>
              </div>
            </div>

            {/* AD - Alma Duarte */}
            <div className="p-3 bg-white/70 hover:bg-white rounded-xl border border-[#ebdccc] shadow-sm flex items-center gap-3 transition">
              <div className="w-10 h-10 rounded-full bg-[#de7d27] text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm shrink-0">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-[#1f1610] truncate">Alma Duarte</h4>
                <p className="text-[10px] text-[#7d6756] truncate">Cashier · Foodsafe · 14.0 hrs</p>
                <span className="text-[9px] font-mono font-bold text-amber-700">Sat AM</span>
              </div>
            </div>

            {/* WT - Wes Tanaka */}
            <div className="p-3 bg-white/70 hover:bg-white rounded-xl border border-[#ebdccc] shadow-sm flex items-center gap-3 transition">
              <div className="w-10 h-10 rounded-full bg-[#df7e26] text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm shrink-0">
                WT
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-[#1f1610] truncate">Wes Tanaka</h4>
                <p className="text-[10px] text-[#7d6756] truncate">Lifting · Driver · 6.7 hrs</p>
                <span className="text-[9px] font-mono font-bold text-amber-700">Sat AM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Tab Handle Badge */}
        <div className="pt-6 border-t border-[#e5d5c4] flex items-center justify-between text-xs font-mono font-bold text-[#865939]">
          <span>Volunteer Pool</span>
          <span className="text-amber-600">Active</span>
        </div>
      </aside>
    </div>
  );
};
