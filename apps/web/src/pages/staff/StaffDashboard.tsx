import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';
import {
  Utensils,
  Clock,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Plus,
  LogOut,
  Calendar,
  Layers,
  ChevronRight,
  Coffee,
  Sparkles
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeShiftFilter, setActiveShiftFilter] = useState('morning');

  const handleLogout = () => {
    localStorage.removeItem('portal_role');
    localStorage.removeItem('user_email');
    navigate('/staff/login');
  };

  const tables = [
    { id: 'T-01', capacity: 2, status: 'OCCUPIED', guest: 'Marcus Bell', server: 'Renata', time: '42 min' },
    { id: 'T-02', capacity: 4, status: 'RESERVED', guest: 'Jonah Petersen', server: 'Tomas', time: '7:30 PM' },
    { id: 'T-03', capacity: 6, status: 'AVAILABLE', guest: '—', server: '—', time: 'Ready' },
    { id: 'T-04', capacity: 2, status: 'OCCUPIED', guest: 'Alma Duarte', server: 'Wes', time: '18 min' },
    { id: 'T-05', capacity: 4, status: 'BILL_REQUESTED', guest: 'Elena Vidal', server: 'Renata', time: '1 hr 12m' },
    { id: 'T-06', capacity: 8, status: 'AVAILABLE', guest: '—', server: '—', time: 'Ready' },
  ];

  const queue = [
    { name: 'Renata Osei', role: 'FoodSafe · Cashier', hours: '12.5 hrs · Sat AM' },
    { name: 'Marcus Bell', role: 'Driver · Lifting', hours: '8.0 hrs · Sat all day' },
    { name: 'Jonah Petersen', role: 'Line Prep · Grill', hours: '4.5 hrs · Sat AM' },
    { name: 'Tomas Lindqvist', role: 'Floor Lead · Front', hours: '9.25 hrs · Sat AM' },
    { name: 'Alma Duarte', role: 'Hostess · Cashier', hours: '14.0 hrs · Sat AM' },
  ];

  return (
    <div className="min-h-screen bg-[#35251a] text-[#fbf5ef] font-sans flex flex-col antialiased">
      <SEOHead
        title="Staff Floor Terminal | DinePulse"
        description="Daily floor terminal for table assignment, kitchen queues, shift check-ins, and guest orders."
        canonicalPath="/staff/dashboard"
      />

      {/* Top Banner Header */}
      <header className="h-16 bg-[#261910] border-b border-[#4d3625] px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link to="/" className="w-9 h-9 rounded-xl bg-[#df7e26] flex items-center justify-center font-black text-white text-base shadow-md">
            DP
          </Link>
          <div>
            <div className="text-sm font-bold text-[#fbf5ef] tracking-wide">Floor Command Terminal</div>
            <div className="text-[10px] text-[#c9a78a] font-mono">Bistro Downtown · Branch #01</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#412c1d] border border-[#583d29] px-3 py-1 rounded-full text-xs font-semibold text-[#f4ba80] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Floor Active · Shift AM
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-[#f4ba80] hover:text-white bg-[#412c1d] hover:bg-[#583d29] border border-[#583d29] px-3.5 py-1.5 rounded-full transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Clock Out
          </button>
        </div>
      </header>

      {/* Body: Warm Purrweb Style Multi-Column Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1700px] w-full mx-auto">
        {/* Left Column (3 cols): Shift Details & Counters */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#2a1c12] border border-[#4d3625] rounded-2xl p-5">
            <div className="text-[11px] font-mono text-[#c9a78a] uppercase tracking-wider mb-3">Shift Status</div>
            <div className="space-y-2">
              <div className="bg-[#3b271a] border border-[#563a26] p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-[#fbf5ef]">Board</span>
                <span className="text-xs font-extrabold text-[#f4ba80]">5 OPEN</span>
              </div>
              <div className="bg-[#3b271a] border border-[#563a26] p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-[#fbf5ef]">Pool</span>
                <span className="text-xs font-semibold text-[#c9a78a]">5 Available</span>
              </div>
              <div className="bg-[#3b271a] border border-[#563a26] p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-[#fbf5ef]">Conflicts</span>
                <span className="text-xs font-semibold text-rose-300">1 Open</span>
              </div>
              <div className="bg-[#3b271a] border border-[#563a26] p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-[#fbf5ef]">Confirmations</span>
                <span className="text-xs font-semibold text-amber-300">5 Awaiting</span>
              </div>
            </div>
          </div>

          <div className="bg-[#2a1c12] border border-[#4d3625] rounded-2xl p-5">
            <div className="text-[11px] font-mono text-[#c9a78a] uppercase tracking-wider mb-2">Today's Quick Actions</div>
            <div className="grid grid-cols-1 gap-2 pt-2">
              <button className="bg-[#df7e26] hover:bg-[#c66c1b] text-white p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition">
                <Plus className="w-4 h-4" /> Seat Walk-in Party
              </button>
              <button className="bg-[#412c1d] hover:bg-[#583d29] text-[#fbf5ef] border border-[#583d29] p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition">
                <Utensils className="w-4 h-4 text-[#f4ba80]" /> Quick Bill Print
              </button>
            </div>
          </div>
        </div>

        {/* Center Main Panel (6 cols): Floor Board & Active Slots */}
        <div className="lg:col-span-6 bg-[#fbf5ef] text-[#2c1d13] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e8d7c4] gap-3">
              <div>
                <span className="text-[10px] font-mono text-[#8a684b] uppercase tracking-widest font-bold">
                  Floor Distribution
                </span>
                <div className="text-4xl font-black text-[#2c1d13] tracking-tight mt-1 flex items-baseline gap-3">
                  5 <span className="text-lg font-bold text-[#df7e26]">OPEN</span>
                </div>
              </div>

              {/* Shift toggle pills */}
              <div className="flex bg-[#edd9c5] p-1 rounded-full text-xs font-bold self-start">
                <button
                  onClick={() => setActiveShiftFilter('morning')}
                  className={`px-3 py-1.5 rounded-full transition ${activeShiftFilter === 'morning' ? 'bg-[#df7e26] text-white shadow' : 'text-[#68482f]'}`}
                >
                  Morning
                </button>
                <button
                  onClick={() => setActiveShiftFilter('afternoon')}
                  className={`px-3 py-1.5 rounded-full transition ${activeShiftFilter === 'afternoon' ? 'bg-[#df7e26] text-white shadow' : 'text-[#68482f]'}`}
                >
                  Afternoon
                </button>
                <button
                  onClick={() => setActiveShiftFilter('evening')}
                  className={`px-3 py-1.5 rounded-full transition ${activeShiftFilter === 'evening' ? 'bg-[#df7e26] text-white shadow' : 'text-[#68482f]'}`}
                >
                  Evening
                </button>
              </div>
            </div>

            {/* Sub-headline */}
            <div className="py-4 text-xs text-[#7e5c3e] flex items-center justify-between">
              <span><strong>18 tables</strong> · 12 filled · all confirmed before 6:00 PM</span>
              <span className="bg-[#df7e26]/10 text-[#df7e26] px-2.5 py-1 rounded-full font-bold text-[11px]">
                Kitchen needs 2
              </span>
            </div>

            {/* Table Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition-transform hover:scale-[1.02] flex flex-col justify-between h-36 ${
                    t.status === 'OCCUPIED'
                      ? 'bg-[#df7e26] text-white border-transparent shadow-md'
                      : t.status === 'BILL_REQUESTED'
                      ? 'bg-[#c66c1b] text-white border-transparent'
                      : t.status === 'RESERVED'
                      ? 'bg-[#ecd0b3] text-[#2c1d13] border-[#dcba97]'
                      : 'bg-white text-[#2c1d13] border-[#e8d7c4]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm">{t.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/15">
                      {t.capacity} Seats
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-bold truncate">{t.guest}</div>
                    <div className="text-[10px] opacity-80">{t.server !== '—' ? `Staff: ${t.server}` : 'Unassigned'}</div>
                  </div>

                  <div className="text-[10px] font-mono font-semibold pt-1 border-t border-black/10 flex justify-between">
                    <span>{t.status}</span>
                    <span>{t.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-[#e8d7c4] flex items-center justify-between text-xs text-[#8a684b]">
            <span>Fast floor sync active</span>
            <span className="font-mono">Sync latency: 24ms</span>
          </div>
        </div>

        {/* Right Column (3 cols): Staff AM Queue */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#2a1c12] border border-[#4d3625] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#fbf5ef]">SAT AM QUEUE</span>
              <span className="text-[10px] bg-[#df7e26] text-white px-2 py-0.5 rounded-full font-bold">5 AVAILABLE</span>
            </div>

            <div className="space-y-2.5">
              {queue.map((person, idx) => (
                <div key={idx} className="bg-[#3b271a] border border-[#563a26] p-3 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#df7e26] text-white font-black text-xs flex items-center justify-center shrink-0">
                    {person.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#fbf5ef] truncate">{person.name}</div>
                    <div className="text-[10px] text-[#c9a78a] truncate">{person.role}</div>
                    <div className="text-[9px] text-[#f4ba80]/80 font-mono mt-0.5">{person.hours}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
