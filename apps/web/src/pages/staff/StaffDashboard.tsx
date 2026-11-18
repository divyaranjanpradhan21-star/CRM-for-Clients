import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';
import { clearCurrentSession, getCurrentUser } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
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
  Sparkles,
  ArrowUpRight,
  Search,
  Bell,
  Filter,
  CheckCircle2,
  Users,
  Flame,
  Printer
} from 'lucide-react';

// Avatar colors for staff roster
const AVATAR_COLORS = ['#79415A', '#82401D', '#1F313D', '#383854', '#BA4F57', '#3A5726', '#4F7037', '#2C441D'];

interface TableRow {
  id: string;
  capacity: number;
  status: string;
  guest: string;
  server: string;
  time: string;
}

interface StaffRow {
  name: string;
  role: string;
  hours: string;
  color: string;
}

export const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [activeShiftFilter, setActiveShiftFilter] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [tableFilter, setTableFilter] = useState<'all' | 'OCCUPIED' | 'AVAILABLE' | 'BILL_REQUESTED'>('all');
  const [activeNavTab, setActiveNavTab] = useState<'floor' | 'tables' | 'queue' | 'actions'>('floor');
  const [searchQuery, setSearchQuery] = useState('');

  // Live data from database
  const [tables, setTables] = useState<TableRow[]>([]);
  const [queue, setQueue] = useState<StaffRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFloorData = async () => {
      setIsLoading(true);
      try {
        // Fetch reservations as table data (live table/reservation status)
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (reservationsData && reservationsData.length > 0) {
          const mappedTables: TableRow[] = reservationsData.map((r: any, idx: number) => ({
            id: r.table_number || `T-${String(idx + 1).padStart(2, '0')}`,
            capacity: r.guests_count || r.party_size || 2,
            status: (r.status || 'AVAILABLE').toUpperCase().replace(' ', '_'),
            guest: r.guest_name || r.customer_name || '—',
            server: r.assigned_staff || r.server_name || '—',
            time: r.reservation_time
              ? new Date(r.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : r.duration || 'Ready',
          }));
          setTables(mappedTables);
        } else {
          setTables([]);
        }

        // Fetch staff / user profiles for the roster queue
        const { data: staffData } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (staffData && staffData.length > 0) {
          const mappedQueue: StaffRow[] = staffData.map((s: any, idx: number) => ({
            name: s.full_name || s.name || `Staff ${idx + 1}`,
            role: [s.role, s.department].filter(Boolean).join(' · ') || 'Floor Staff',
            hours: s.shift_hours ? `${s.shift_hours} hrs · ${activeShiftFilter.charAt(0).toUpperCase() + activeShiftFilter.slice(1)} Shift` : `Floor · ${activeShiftFilter.charAt(0).toUpperCase() + activeShiftFilter.slice(1)} Shift`,
            color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          }));
          setQueue(mappedQueue);
        } else {
          setQueue([]);
        }
      } catch (err) {
        console.warn('Staff dashboard fetch notice:', err);
        setTables([]);
        setQueue([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFloorData();
  }, [activeShiftFilter]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    clearCurrentSession();
    navigate('/login');
  };

  // Derived live counters from database data
  const availableCount = tables.filter(t => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length;
  const billCount = tables.filter(t => t.status === 'BILL_REQUESTED').length;
  const totalTableCount = tables.length;
  const staffAvailableCount = queue.length;

  const filteredTables = tables.filter((t) => {
    if (tableFilter !== 'all' && t.status !== tableFilter) return false;
    if (searchQuery && !t.id.toLowerCase().includes(searchQuery.toLowerCase()) && !t.guest.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#EAE4D9] p-4 sm:p-6 lg:p-8 text-[#1F313D] font-sans antialiased">
      <SEOHead
        title="Staff Floor Terminal | Cafe's Corner"
        description="Daily floor terminal for table assignment, kitchen queues, shift check-ins, and guest orders."
        canonicalPath="/staff/dashboard"
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
                  Cafe's Corner
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#82401D] font-bold">
                  Floor Staff Terminal
                </span>
              </div>
            </Link>

            {/* Horizontal Capsule Tab Bar matching Image 1 */}
            <div className="hidden md:flex items-center bg-[#E4DCCE] rounded-full p-1 border border-[#DDD5C7]">
              {[
                { id: 'floor', label: 'Floor Board' },
                { id: 'tables', label: `Tables (${totalTableCount})` },
                { id: 'queue', label: 'Staff Queue' },
                { id: 'actions', label: 'Quick POS' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveNavTab(tab.id as any)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeNavTab === tab.id
                      ? 'bg-[#1F313D] text-white shadow-xs'
                      : 'text-[#5C5549] hover:text-[#1F313D] hover:bg-black/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-3">
            {/* Floor Status Pill */}
            <div className="bg-[#FAF7F2] border border-[#DDD5C7] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1F313D] flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-mono tracking-wide">Floor Live · Shift AM</span>
            </div>

            {/* Notification Bell */}
            <button
              title="Kitchen alerts"
              className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] flex items-center justify-center text-[#5C5549] hover:text-[#1F313D] hover:bg-[#F3EDE2] transition-colors shadow-2xs relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#82401D]"></span>
            </button>

            {/* User Profile Capsule */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#DDD5C7]">
              <div className="w-8 h-8 rounded-full bg-[#79415A] text-white font-serif font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden xl:block text-left">
                <span className="text-xs font-bold text-[#1F313D] block leading-tight">
                  {currentUser?.fullName || 'Staff Member'}
                </span>
                <span className="text-[10px] text-[#7A7268] capitalize">
                  {currentUser?.role || 'Floor Staff'}
                </span>
              </div>
            </div>

            {/* Clock Out / Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-[#82401D] hover:text-white bg-[#FAF7F2] hover:bg-[#82401D] border border-[#DDD5C7] hover:border-[#82401D] px-3.5 py-1.5 rounded-full font-semibold transition-all shadow-2xs ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Clock Out
            </button>
          </div>
        </header>

        {/* ── Main Content Grid with Editorial Purrweb Sand Aesthetic ── */}
        <div className="flex-1 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1720px] w-full mx-auto">
          {/* Left Column (3.5 cols): Welcome, Shift Counters & Fast Actions */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Editorial Serif Welcome block */}
              <div>
                <h1 className="font-serif text-2xl lg:text-3xl font-normal text-[#1F313D] leading-tight">
                  Welcome to Floor, <br />
                  <span className="font-semibold text-[#82401D]">{currentUser?.fullName?.split(' ')[0] || 'Staff Member'}</span>
                </h1>
                <p className="text-xs text-[#7A7268] mt-1.5 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#82401D]" /> Today · Shift AM Floor Terminal
                </p>
              </div>

              {/* Shift Status Card */}
              <div className="bg-[#FAF7F2] rounded-[24px] p-5 border border-[#E5DDD2] shadow-xs">
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold">
                    Shift Counters
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAE4D9] text-[#1F313D]">
                    Sat AM
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="bg-[#EFE9DF] border border-[#DDD5C7] p-3 rounded-[16px] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F313D]">Board Capacity</span>
                    <span className="text-xs font-extrabold text-[#82401D]">
                      {isLoading ? '—' : availableCount > 0 ? `${availableCount} OPEN` : 'No Tables'}
                    </span>
                  </div>
                  <div className="bg-[#EFE9DF] border border-[#DDD5C7] p-3 rounded-[16px] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F313D]">Staff Pool</span>
                    <span className="text-xs font-semibold text-[#5C5549]">
                      {isLoading ? '—' : staffAvailableCount > 0 ? `${staffAvailableCount} Available` : 'No Staff'}
                    </span>
                  </div>
                  <div className="bg-[#EFE9DF] border border-[#DDD5C7] p-3 rounded-[16px] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F313D]">Shift Conflicts</span>
                    <span className="text-xs font-semibold text-[#BA4F57]">
                      {isLoading ? '—' : '0 Open'}
                    </span>
                  </div>
                  <div className="bg-[#EFE9DF] border border-[#DDD5C7] p-3 rounded-[16px] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F313D]">Confirmations</span>
                    <span className="text-xs font-semibold text-[#79415A]">
                      {isLoading ? '—' : occupiedCount > 0 ? `${occupiedCount} Awaiting` : '0 Awaiting'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-[#FAF7F2] rounded-[24px] p-5 border border-[#E5DDD2] shadow-xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-3">
                  Floor Quick Actions
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  <button className="bg-[#1F313D] hover:bg-[#383854] text-white p-3 rounded-[16px] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all">
                    <Plus className="w-4 h-4 text-[#E5C9B3]" /> Seat Walk-in Party
                  </button>
                  <button className="bg-[#82401D] hover:bg-[#673536] text-white p-3 rounded-[16px] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all">
                    <Utensils className="w-4 h-4 text-[#FAF7F2]" /> Quick Bill Print
                  </button>
                </div>
              </div>
            </div>

            {/* Image 1 Dark Contrast Card: Floor Guide / Tips */}
            <div className="bg-[#1F313D] text-white rounded-[24px] p-5 shadow-xs relative overflow-hidden mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Coffee className="w-4 h-4 text-[#E5C9B3]" />
                </div>
                <button
                  title="Floor Tips"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#FAF7F2]">Kitchen Sync Ready</h4>
              <p className="text-[11px] text-[#DDD5C7]/80 mt-1 leading-relaxed">
                Table #5 requested final bill · 2 line cooks on grill · Espresso machine calibrated.
              </p>
            </div>
          </div>

          {/* Center Column (5.5 cols): Floor Table Grid & Live Status */}
          <div className="lg:col-span-6 xl:col-span-6 bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs flex flex-col justify-between">
            <div>
              {/* Header Banner & Shift Selectors */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5DDD2] gap-4">
                <div>
                  <span className="text-[11px] font-mono text-[#82401D] uppercase tracking-widest font-bold">
                    Floor Distribution
                  </span>
                  <div className="text-3xl lg:text-4xl font-serif font-normal text-[#1F313D] tracking-tight mt-1 flex items-baseline gap-3">
                    {isLoading ? '—' : availableCount} <span className="text-base font-sans font-bold text-[#82401D]">TABLES OPEN</span>
                  </div>
                </div>

                {/* Shift toggle pills */}
                <div className="flex items-center bg-[#EAE4D9] p-1 rounded-full text-xs font-bold self-start border border-[#DDD5C7]">
                  {(['morning', 'afternoon', 'evening'] as const).map((shift) => (
                    <button
                      key={shift}
                      onClick={() => setActiveShiftFilter(shift)}
                      className={`px-3 py-1.5 rounded-full capitalize transition-all ${
                        activeShiftFilter === shift
                          ? 'bg-[#1F313D] text-white shadow-xs'
                          : 'text-[#5C5549] hover:text-[#1F313D]'
                      }`}
                    >
                      {shift}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Indicator & Table Filters */}
              <div className="py-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DDD2]/70">
                <div className="text-xs text-[#7A7268] flex items-center gap-2">
                  <span className="font-semibold text-[#1F313D]">{isLoading ? '—' : totalTableCount} tables</span>
                  {!isLoading && totalTableCount > 0 && ` · ${occupiedCount + billCount} filled · confirmed before 6:00 PM`}
                  {!isLoading && totalTableCount === 0 && ' · No table data in database yet'}
                </div>
                <div className="flex items-center gap-1.5 bg-[#EFE9DF] p-1 rounded-full border border-[#DDD5C7]">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'OCCUPIED', label: 'Occupied' },
                    { id: 'AVAILABLE', label: 'Ready' },
                    { id: 'BILL_REQUESTED', label: 'Bill' },
                  ].map((filterItem) => (
                    <button
                      key={filterItem.id}
                      onClick={() => setTableFilter(filterItem.id as any)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                        tableFilter === filterItem.id
                          ? 'bg-[#82401D] text-white'
                          : 'text-[#5C5549] hover:text-[#1F313D]'
                      }`}
                    >
                      {filterItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input for tables */}
              <div className="pt-3 pb-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search table number or guest name..."
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-full pl-9 pr-4 py-2 text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#82401D]"
                  />
                </div>
              </div>

              {/* Table Cards Grid (Aesthetic rhythmic alternation matching Image 1) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-3">
                {isLoading ? (
                  <div className="col-span-3 py-10 text-center text-sm text-[#7A7268]">Loading floor data...</div>
                ) : filteredTables.length === 0 ? (
                  <div className="col-span-3 py-10 text-center">
                    <div className="text-[#7A7268] text-sm font-medium mb-1">No tables in database yet</div>
                    <div className="text-[#7A7268] text-xs">Table & reservation data will appear here once added to the database.</div>
                  </div>
                ) : (
                  filteredTables.map((t) => {
                  const isOccupied = t.status === 'OCCUPIED';
                  const isBill = t.status === 'BILL_REQUESTED';
                  const isReserved = t.status === 'RESERVED';

                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-[20px] transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between h-40 border ${
                        isOccupied
                          ? 'bg-[#1F313D] text-white border-transparent shadow-md'
                          : isBill
                          ? 'bg-[#82401D] text-white border-transparent shadow-xs'
                          : isReserved
                          ? 'bg-[#EAE4D9] text-[#1F313D] border-[#DDD5C7]'
                          : 'bg-[#EFE9DF] text-[#1F313D] border-[#DDD5C7]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm tracking-wide">{t.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOccupied || isBill ? 'bg-white/20 text-white' : 'bg-black/10 text-[#1F313D]'
                          }`}
                        >
                          {t.capacity} Seats
                        </span>
                      </div>

                      <div className="my-1">
                        <div className="text-xs font-bold truncate leading-tight">{t.guest}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            isOccupied || isBill ? 'text-white/80' : 'text-[#7A7268]'
                          }`}
                        >
                          {t.server !== '—' ? `Staff: ${t.server}` : 'Unassigned'}
                        </div>
                      </div>

                      <div
                        className={`text-[10px] font-mono font-semibold pt-2 border-t flex justify-between items-center ${
                          isOccupied || isBill
                            ? 'border-white/15 text-white/90'
                            : 'border-[#DDD5C7] text-[#5C5549]'
                        }`}
                      >
                        <span className="truncate">{t.status.replace('_', ' ')}</span>
                        <span className="shrink-0">{t.time}</span>
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            </div>

            {/* Bottom latency and telemetry bar */}
            <div className="pt-6 mt-4 border-t border-[#E5DDD2] flex items-center justify-between text-xs text-[#7A7268]">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Fast floor sync active
              </span>
              <span className="font-mono text-[11px] bg-[#EAE4D9] px-2.5 py-1 rounded-full border border-[#DDD5C7]">
                Latency: 24ms
              </span>
            </div>
          </div>

          {/* Right Column (3 cols): Staff Shift AM Queue */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-4">
            <div className="bg-[#FAF7F2] rounded-[24px] p-5 border border-[#E5DDD2] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-bold text-[#1F313D] block font-serif">Floor Roster Queue</span>
                  <span className="text-[10px] text-[#7A7268]">{activeShiftFilter.charAt(0).toUpperCase() + activeShiftFilter.slice(1)} Shift</span>
                </div>
                <span className="text-[10px] bg-[#1F313D] text-white px-2.5 py-0.5 rounded-full font-bold">
                  {isLoading ? '—' : staffAvailableCount > 0 ? `${staffAvailableCount} AVAILABLE` : 'NO STAFF'}
                </span>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  <div className="py-6 text-center text-xs text-[#7A7268]">Loading staff roster...</div>
                ) : queue.length === 0 ? (
                  <div className="py-6 text-center">
                    <div className="text-[#7A7268] text-xs font-medium">No staff in database yet</div>
                    <div className="text-[#7A7268] text-[10px] mt-1">Staff roster will appear here once added.</div>
                  </div>
                ) : (
                  queue.map((person, idx) => (
                    <div
                      key={idx}
                      className="bg-[#EFE9DF] border border-[#DDD5C7] p-3 rounded-[18px] flex items-center gap-3 transition-colors hover:border-[#82401D]/40"
                    >
                      <div
                        className="w-10 h-10 rounded-full text-white font-serif font-black text-xs flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: person.color }}
                      >
                        {person.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#1F313D] truncate">{person.name}</div>
                        <div className="text-[10px] text-[#7A7268] truncate">{person.role}</div>
                        <div className="text-[9px] text-[#82401D] font-mono mt-0.5 font-semibold">
                          {person.hours}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Mini Service Announcement */}
            <div className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-[20px] p-4 text-xs">
              <div className="flex items-center gap-2 text-[#82401D] font-bold mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span>Peak Rush Forecast</span>
              </div>
              <p className="text-[#5C5549] text-[11px] leading-relaxed">
                Expected 11:30 AM – 1:30 PM. 3 large reservations confirmed in main dining area.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
