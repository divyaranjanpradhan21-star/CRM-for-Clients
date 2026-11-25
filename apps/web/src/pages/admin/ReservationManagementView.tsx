import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Download,
  RefreshCw,
  Utensils,
  MapPin,
  Heart,
  Cake,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Send,
  UserCheck,
  UserX,
  History,
  Grid,
  List,
  BarChart3,
  MessageSquare,
  Sparkles,
  Layers,
  BellRing
} from 'lucide-react';
import {
  ReservationRecord,
  ReservationStatus,
  SeatingPreference,
  ReservationOccasion,
  BookingSource,
  RestaurantTable,
  WaitlistEntry,
  RESTAURANT_TABLES,
  fetchReservations,
  saveReservation,
  updateReservationStatus,
  loadWaitlistFromStorage,
  addToWaitlist,
  seatWaitlistParty,
  sendReservationNotification,
  getReservationMetrics,
  exportReservationsCSV,
  generateReservationId
} from '../../lib/reservationManagementApi';

export const ReservationManagementView: React.FC<{ orgId?: string }> = () => {
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'table' | 'floorplan' | 'waitlist' | 'reports'>('calendar');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [seatingFilter, setSeatingFilter] = useState<string>('ALL');
  const [tableFilter, setTableFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  // Calendar Date State (selected day/month)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Table Sorting & Pagination
  const [sortBy, setSortBy] = useState<'date' | 'time' | 'name' | 'guests' | 'status'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Selected Reservation Drawer / Modal
  const [selectedReservation, setSelectedReservation] = useState<ReservationRecord | null>(null);

  // Create / Edit Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingReservation, setEditingReservation] = useState<Partial<ReservationRecord>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancellingReservation, setCancellingReservation] = useState<ReservationRecord | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState<string>('');

  // Waitlist Modal State
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState<boolean>(false);
  const [newWaitlistName, setNewWaitlistName] = useState<string>('');
  const [newWaitlistPhone, setNewWaitlistPhone] = useState<string>('');
  const [newWaitlistGuests, setNewWaitlistGuests] = useState<number>(2);
  const [newWaitlistSeating, setNewWaitlistSeating] = useState<SeatingPreference>('Any');
  const [newWaitlistNotes, setNewWaitlistNotes] = useState<string>('');
  const [seatTargetWaitlist, setSeatTargetWaitlist] = useState<WaitlistEntry | null>(null);
  const [selectedSeatTable, setSelectedSeatTable] = useState<string>('T-01');

  // Notification Modal State
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [notificationTargetRes, setNotificationTargetRes] = useState<ReservationRecord | null>(null);
  const [notificationChannel, setNotificationChannel] = useState<'Email' | 'SMS' | 'WhatsApp'>('WhatsApp');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReservations();
      setReservations(data);
      const wl = loadWaitlistFromStorage();
      setWaitlist(wl);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered & Sorted Reservations
  const processedReservations = useMemo(() => {
    return reservations
      .filter((r) => {
        if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
        if (seatingFilter !== 'ALL' && r.seatingPreference !== seatingFilter) return false;
        if (tableFilter !== 'ALL' && r.tableNumber !== tableFilter) return false;

        if (dateFilter === 'today' && r.reservationDate !== todayStr) return false;
        if (dateFilter === 'upcoming' && r.reservationDate <= todayStr) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = r.guestName.toLowerCase().includes(q);
          const matchPhone = r.guestPhone.includes(q);
          const matchEmail = r.guestEmail?.toLowerCase().includes(q);
          const matchId = r.id.toLowerCase().includes(q);
          const matchTable = r.tableNumber.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchEmail && !matchId && !matchTable) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') {
          diff = a.guestName.localeCompare(b.guestName);
        } else if (sortBy === 'guests') {
          diff = (a.partySize || 2) - (b.partySize || 2);
        } else if (sortBy === 'status') {
          diff = a.status.localeCompare(b.status);
        } else if (sortBy === 'date') {
          diff = a.reservationDate.localeCompare(b.reservationDate);
        } else {
          // Time sort
          const tA = `${a.reservationDate} ${a.reservationTime}`;
          const tB = `${b.reservationDate} ${b.reservationTime}`;
          diff = tA.localeCompare(tB);
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [reservations, statusFilter, seatingFilter, tableFilter, dateFilter, searchQuery, sortBy, sortOrder, todayStr]);

  // Pagination calculation
  const totalPages = Math.ceil(processedReservations.length / pageSize) || 1;
  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedReservations.slice(start, start + pageSize);
  }, [processedReservations, currentPage, pageSize]);

  // High-fidelity Metrics
  const metrics = useMemo(() => {
    return getReservationMetrics(reservations);
  }, [reservations]);

  // Calendar Day reservations
  const calendarDayReservations = useMemo(() => {
    return reservations
      .filter((r) => r.reservationDate === selectedCalendarDate && !['Cancelled', 'No-show'].includes(r.status))
      .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
  }, [reservations, selectedCalendarDate]);

  // Status transition handler
  const handleUpdateStatus = async (
    resId: string,
    newStatus: ReservationStatus,
    reason?: string
  ) => {
    const res = await updateReservationStatus(resId, newStatus, 'Receptionist / Host', reason);
    if (res.success) {
      showToast(`Reservation #${resId} marked as ${newStatus}`);
      loadData();
      if (selectedReservation?.id === resId) {
        setSelectedReservation(res.reservation || null);
      }
    } else {
      showToast(res.error || 'Failed to update status', 'error');
    }
  };

  // Save Reservation
  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await saveReservation(editingReservation, 'Host Staff');
      if (res.success) {
        showToast(`Reservation #${res.reservation?.id} saved successfully! Table allocated: ${res.reservation?.tableNumber}`);
        setIsCreateModalOpen(false);
        setEditingReservation({});
        loadData();
      } else {
        showToast(res.error || 'Failed to save reservation', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Cancellation
  const handleConfirmCancellation = async () => {
    if (!cancellingReservation) return;
    await handleUpdateStatus(cancellingReservation.id, 'Cancelled', cancellationReasonInput.trim() || 'Guest requested cancellation');
    setIsCancelModalOpen(false);
    setCancellingReservation(null);
    setCancellationReasonInput('');
  };

  // Add to Waitlist
  const handleAddWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaitlistName || !newWaitlistPhone) {
      showToast('Guest name and phone are required', 'error');
      return;
    }
    const res = await addToWaitlist({
      guestName: newWaitlistName,
      guestPhone: newWaitlistPhone,
      partySize: newWaitlistGuests,
      seatingPreference: newWaitlistSeating,
      estimatedWaitMinutes: 20,
      notes: newWaitlistNotes,
      branchName: 'Downtown Flagship #01',
    });

    if (res.success) {
      showToast(`Added ${newWaitlistName} to live waitlist queue.`);
      setIsWaitlistModalOpen(false);
      setNewWaitlistName('');
      setNewWaitlistPhone('');
      setNewWaitlistNotes('');
      loadData();
    }
  };

  // Seat Party from Waitlist
  const handleSeatFromWaitlist = async () => {
    if (!seatTargetWaitlist) return;
    const res = await seatWaitlistParty(seatTargetWaitlist.id, selectedSeatTable);
    if (res.success) {
      showToast(`Seated ${seatTargetWaitlist.guestName} at Table ${selectedSeatTable}`);
      setSeatTargetWaitlist(null);
      loadData();
    } else {
      showToast(res.error || 'Failed to seat party', 'error');
    }
  };

  // Send Notification
  const handleSendNotification = async () => {
    if (!notificationTargetRes) return;
    const res = await sendReservationNotification(notificationTargetRes, notificationChannel);
    showToast(res.message);
    setIsNotificationModalOpen(false);
    setNotificationTargetRes(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all transform animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'success' ? 'bg-[#1F313D] text-white border-emerald-500/30' : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-300" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-5 rounded-[24px] border border-[#DDD5C7] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#79415A]/10 text-[#79415A]">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1F313D] leading-tight">
                Table Reservation &amp; Seating Management
              </h2>
              <p className="text-xs text-[#7A7268] mt-0.5">
                Manage table bookings, seating allocations, floor plans, live waitlists, and guest arrival workflows
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Modes */}
          <div className="flex rounded-xl overflow-hidden border border-[#DDD5C7] bg-[#EFE9DF] p-0.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'calendar' ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendar
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'table' ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('floorplan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'floorplan' ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Floor Plan
            </button>
            <button
              onClick={() => setViewMode('waitlist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'waitlist' ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Waitlist ({waitlist.filter((w) => w.status === 'Waiting').length})
            </button>
            <button
              onClick={() => setViewMode('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'reports' ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Reports
            </button>
          </div>

          <button
            onClick={() => exportReservationsCSV(reservations)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549] hover:bg-[#EFE9DF]"
          >
            <Download className="w-3.5 h-3.5 text-[#79415A]" /> Export CSV
          </button>

          <button
            onClick={() => {
              setEditingReservation({
                id: generateReservationId(),
                guestName: '',
                guestPhone: '',
                guestEmail: '',
                partySize: 2,
                reservationDate: todayStr,
                reservationTime: '19:30',
                durationMinutes: 90,
                tableNumber: 'T-01',
                seatingPreference: 'Indoor',
                occasion: 'Casual Dining',
                source: 'Online',
                status: 'Confirmed',
                branchName: 'Downtown Flagship #01',
                notificationPreferences: { email: true, sms: true, whatsapp: true },
              });
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#79415A] hover:bg-[#68334b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Book Reservation
          </button>
        </div>
      </div>

      {/* ── 8 RESERVATION DASHBOARD KPI CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-[#7A7268] block">Total Bookings</span>
          <div className="text-xl font-bold font-serif text-[#1F313D] mt-1">{metrics.total}</div>
          <span className="text-[9px] text-[#79415A] font-semibold mt-0.5 block">All Records</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-blue-700 block">Today's Bookings</span>
          <div className="text-xl font-bold font-serif text-blue-800 mt-1">{metrics.todayCount}</div>
          <span className="text-[9px] text-blue-600 font-semibold mt-0.5 block">Scheduled Today</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-purple-700 block">Upcoming</span>
          <div className="text-xl font-bold font-serif text-purple-800 mt-1">{metrics.upcomingCount}</div>
          <span className="text-[9px] text-purple-600 font-semibold mt-0.5 block">Future Dates</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 block">Pending</span>
          <div className="text-xl font-bold font-serif text-amber-800 mt-1">{metrics.pendingCount}</div>
          <span className="text-[9px] text-amber-600 font-semibold mt-0.5 block">Awaiting Confirmation</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 block">Confirmed</span>
          <div className="text-xl font-bold font-serif text-emerald-800 mt-1">{metrics.confirmedCount}</div>
          <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 block">Table Locked</span>
        </div>

        <div className="bg-[#1F313D] text-white rounded-2xl p-3 border border-[#1F313D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#E5C9B3] block">Seated Live</span>
            <Utensils className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{metrics.seatedCount}</div>
          <span className="text-[9px] text-emerald-400 font-medium mt-0.5 block">{metrics.tableUtilizationRate}% Occupancy</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-gray-700 block">Completed</span>
          <div className="text-xl font-bold font-serif text-gray-800 mt-1">{metrics.completedCount}</div>
          <span className="text-[9px] text-gray-600 font-semibold mt-0.5 block">Settled Checks</span>
        </div>

        <div className="bg-rose-50 rounded-2xl p-3 border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-900 block">Cancelled</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
          </div>
          <div className="text-xl font-bold font-serif text-rose-900 mt-1">{metrics.cancelledCount + metrics.noShowCount}</div>
          <span className="text-[9px] text-rose-800 font-semibold mt-0.5 block">{metrics.noShowCount} No-shows</span>
        </div>
      </div>

      {/* ── FILTERS & SEARCH TOOLBAR ── */}
      <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by guest name, phone, email, booking ID, or table..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#DDD5C7] text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWaitlistModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-500/20 transition"
            >
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>Add Walk-in to Waitlist</span>
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DDD5C7]/70 text-xs">
          <span className="text-[11px] font-bold text-[#7A7268] flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#79415A]" /> Filters:
          </span>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-in">Checked-in</option>
            <option value="Seated">Seated</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No-show">No-show</option>
          </select>

          {/* Seating Preference */}
          <select
            value={seatingFilter}
            onChange={(e) => setSeatingFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
          >
            <option value="ALL">All Seating (Indoor, Outdoor, Window, etc.)</option>
            <option value="Indoor">Indoor Dining</option>
            <option value="Outdoor">Outdoor Garden</option>
            <option value="Window">Window Terrace</option>
            <option value="Private Dining">Private Dining / Mezzanine</option>
            <option value="Booth">Corner Booth</option>
          </select>

          {/* Table */}
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
          >
            <option value="ALL">All Tables (T-01 to T-09)</option>
            {RESTAURANT_TABLES.map((t) => (
              <option key={t.id} value={t.tableNumber}>Table {t.tableNumber} ({t.capacity}p - {t.section})</option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
          >
            <option value="ALL">All Dates</option>
            <option value="today">Today's Reservations</option>
            <option value="upcoming">Upcoming Future Bookings</option>
          </select>
        </div>
      </div>

      {/* ── 1. CALENDAR VIEW ── */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          {/* Date Selector Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#DDD5C7] shadow-xs">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#79415A]" />
              <span className="font-bold text-xs text-[#1F313D]">Daily Timeline View:</span>
              <input
                type="date"
                value={selectedCalendarDate}
                onChange={(e) => setSelectedCalendarDate(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-bold text-[#1F313D]"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#7A7268]">
              <button
                onClick={() => setSelectedCalendarDate(todayStr)}
                className="px-3 py-1 rounded-lg border border-[#DDD5C7] hover:bg-[#EFE9DF] text-[#1F313D]"
              >
                Today
              </button>
              <span>{calendarDayReservations.length} Active Bookings Scheduled</span>
            </div>
          </div>

          {/* Day Slots Grid */}
          {calendarDayReservations.length === 0 ? (
            <div className="p-16 text-center text-xs text-[#7A7268] bg-[#FAF7F2] rounded-2xl border border-[#DDD5C7] space-y-2">
              <CalendarIcon className="w-8 h-8 mx-auto text-[#DDD5C7]" />
              <p className="font-semibold">No active reservations scheduled for {selectedCalendarDate}.</p>
              <button
                onClick={() => {
                  setEditingReservation({
                    id: generateReservationId(),
                    reservationDate: selectedCalendarDate,
                    reservationTime: '19:30',
                    partySize: 2,
                    tableNumber: 'T-01',
                    status: 'Confirmed',
                    branchName: 'Downtown Flagship #01',
                  });
                  setIsCreateModalOpen(true);
                }}
                className="text-xs text-[#79415A] font-bold underline"
              >
                Book table for this date
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {calendarDayReservations.map((res) => (
                <div
                  key={res.id}
                  onClick={() => setSelectedReservation(res)}
                  className="p-4 rounded-2xl bg-white border border-[#DDD5C7] shadow-xs hover:shadow-md transition cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#82401D]">{res.id}</span>
                      <h4 className="font-bold text-sm text-[#1F313D] leading-tight">{res.guestName}</h4>
                      <span className="text-[11px] text-[#7A7268]">{res.guestPhone}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        res.status === 'Confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : res.status === 'Seated'
                          ? 'bg-purple-100 text-purple-900'
                          : res.status === 'Checked-in'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7]/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#1F313D]">
                      <Clock className="w-3.5 h-3.5 text-[#79415A]" />
                      <span>{res.reservationTime} ({res.durationMinutes}m)</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-[#82401D]">
                      <Utensils className="w-3.5 h-3.5 text-[#82401D]" />
                      <span>Table {res.tableNumber} &bull; {res.partySize} guests</span>
                    </div>
                  </div>

                  {res.occasion && res.occasion !== 'Casual Dining' && (
                    <div className="flex items-center gap-1 text-[11px] text-[#79415A] font-semibold">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Occasion: {res.occasion}</span>
                    </div>
                  )}

                  {res.specialRequests && (
                    <p className="text-[11px] text-[#7A7268] italic line-clamp-1">
                      "{res.specialRequests}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 2. LIST / TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EFE9DF] text-[#5C5549] font-mono uppercase tracking-wider text-[10px] border-b border-[#DDD5C7]">
                <tr>
                  <th className="py-3 px-4">Booking ID &amp; Guest</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Date &amp; Slot</th>
                  <th className="py-3 px-4">Table &amp; Party</th>
                  <th className="py-3 px-4">Seating &amp; Occasion</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD5C7]">
                {paginatedReservations.map((res) => (
                  <tr
                    key={res.id}
                    onClick={() => setSelectedReservation(res)}
                    className={`hover:bg-[#EFE9DF]/60 transition cursor-pointer ${
                      selectedReservation?.id === res.id ? 'bg-[#EFE9DF] ring-1 ring-[#79415A]/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1F313D]">{res.guestName}</div>
                      <span className="text-[10px] font-mono font-bold text-[#82401D]">{res.id}</span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <div>{res.guestPhone}</div>
                      <div className="text-[#7A7268] truncate max-w-[150px]">{res.guestEmail || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <div className="font-bold text-[#1F313D]">{res.reservationDate}</div>
                      <div className="text-[#7A7268]">{res.reservationTime} ({res.durationMinutes} min)</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1F313D]">Table {res.tableNumber}</div>
                      <span className="text-[10px] text-[#7A7268]">{res.partySize} Guests</span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <div>{res.seatingPreference}</div>
                      <div className="text-[#7A7268]">{res.occasion}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          res.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.status === 'Seated'
                            ? 'bg-purple-100 text-purple-900'
                            : res.status === 'Checked-in'
                            ? 'bg-blue-100 text-blue-900'
                            : res.status === 'Completed'
                            ? 'bg-gray-100 text-gray-700'
                            : res.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {res.status === 'Confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(res.id, 'Checked-in')}
                            title="Check-In Guest"
                            className="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-[10px] hover:bg-blue-100"
                          >
                            Check In
                          </button>
                        )}
                        {['Confirmed', 'Checked-in'].includes(res.status) && (
                          <button
                            onClick={() => handleUpdateStatus(res.id, 'Seated')}
                            title="Seat at Table"
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[10px] hover:bg-emerald-100"
                          >
                            Seat
                          </button>
                        )}
                        {res.status === 'Seated' && (
                          <button
                            onClick={() => handleUpdateStatus(res.id, 'Completed')}
                            title="Mark Meal Completed"
                            className="px-2 py-1 rounded-lg bg-gray-100 text-gray-800 font-bold text-[10px] hover:bg-gray-200"
                          >
                            Complete
                          </button>
                        )}
                        {!['Completed', 'Cancelled', 'No-show'].includes(res.status) && (
                          <button
                            onClick={() => {
                              setCancellingReservation(res);
                              setIsCancelModalOpen(true);
                            }}
                            title="Cancel Booking"
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-[#DDD5C7] bg-[#FAF7F2] flex items-center justify-between text-xs text-[#7A7268]">
            <div>Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, processedReservations.length)} of {processedReservations.length} bookings</div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-[#DDD5C7] disabled:opacity-40 hover:bg-[#EFE9DF]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-[#1F313D]">Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-[#DDD5C7] disabled:opacity-40 hover:bg-[#EFE9DF]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. FLOOR PLAN & TABLE ALLOCATION VIEW ── */}
      {viewMode === 'floorplan' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-center justify-between text-xs">
            <span className="font-bold text-[#1F313D]">Interactive Table Status Grid (Downtown Flagship Outlet)</span>
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Seated / In-Use</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Reserved Upcoming</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESTAURANT_TABLES.map((table) => {
              // Find active reservation on this table for today
              const activeSeated = reservations.find(
                (r) => r.tableNumber === table.tableNumber && r.reservationDate === todayStr && r.status === 'Seated'
              );
              const upcomingToday = reservations.find(
                (r) => r.tableNumber === table.tableNumber && r.reservationDate === todayStr && ['Confirmed', 'Checked-in'].includes(r.status)
              );

              const isOccupied = !!activeSeated;
              const isReserved = !!upcomingToday;

              return (
                <div
                  key={table.id}
                  className={`p-5 rounded-2xl border transition shadow-xs ${
                    isOccupied
                      ? 'bg-purple-50/80 border-purple-300'
                      : isReserved
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-white border-[#DDD5C7]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xl font-bold font-serif text-[#1F313D]">Table {table.tableNumber}</span>
                      <p className="text-xs text-[#7A7268] mt-0.5">{table.section}</p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isOccupied
                          ? 'bg-purple-200 text-purple-900'
                          : isReserved
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {isOccupied ? 'Seated Live' : isReserved ? 'Reserved' : 'Available'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DDD5C7]/70 text-xs">
                    <span className="text-[#7A7268]">Max Capacity: <strong>{table.capacity} Guests</strong></span>
                    {activeSeated && (
                      <div className="mt-2 p-2 rounded-xl bg-white border border-purple-200 text-[11px]">
                        <span className="font-bold text-purple-950 block">{activeSeated.guestName}</span>
                        <span className="text-[#7A7268] block">{activeSeated.partySize} Guests &bull; Seated at {activeSeated.reservationTime}</span>
                      </div>
                    )}
                    {!activeSeated && upcomingToday && (
                      <div className="mt-2 p-2 rounded-xl bg-white border border-amber-200 text-[11px]">
                        <span className="font-bold text-amber-950 block">Next: {upcomingToday.guestName}</span>
                        <span className="text-[#7A7268] block">{upcomingToday.reservationTime} ({upcomingToday.partySize} guests)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. LIVE WAITLIST VIEW ── */}
      {viewMode === 'waitlist' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] flex items-center justify-between text-xs">
            <div>
              <h4 className="font-bold text-sm text-[#1F313D]">Live Walk-in Waitlist Queue</h4>
              <p className="text-xs text-[#7A7268]">Manage patrons waiting for next table turnaround</p>
            </div>
            <button
              onClick={() => setIsWaitlistModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#79415A] text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Walk-In Party
            </button>
          </div>

          <div className="space-y-3">
            {waitlist.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#7A7268] bg-[#FAF7F2] rounded-2xl border border-[#DDD5C7]">
                No patrons currently waiting in the queue.
              </div>
            ) : (
              waitlist.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white border border-[#DDD5C7] shadow-xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-sm text-[#1F313D]">{item.guestName}</h5>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        {item.partySize} Guests
                      </span>
                      <span className="text-[10px] text-[#7A7268]">{item.seatingPreference} Preference</span>
                    </div>
                    <div className="text-xs text-[#7A7268] mt-1 flex items-center gap-3">
                      <span>Phone: {item.guestPhone}</span>
                      <span>&bull;</span>
                      <span>Checked-in: {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {item.notes && <span>&bull; Notes: {item.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'Waiting' && (
                      <>
                        <button
                          onClick={() => {
                            setSeatTargetWaitlist(item);
                            setSelectedSeatTable('T-01');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold"
                        >
                          Seat Table
                        </button>
                        <button
                          onClick={() => showToast(`SMS sent to ${item.guestName}: "Your table is ready!"`)}
                          className="p-2 rounded-xl border border-[#DDD5C7] hover:bg-[#EFE9DF] text-[#79415A]"
                          title="Send Table Ready Alert SMS"
                        >
                          <BellRing className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {item.status === 'Seated' && (
                      <span className="px-3 py-1 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs">
                        Seated
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── 5. REPORTS VIEW ── */}
      {viewMode === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-[24px] bg-white border border-[#DDD5C7] shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-[#1F313D] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#79415A]" /> Peak Reservation Hours &amp; Capacity
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-[#FAF7F2]">
                <span className="text-[#7A7268]">Peak Dining Hour:</span>
                <strong className="text-[#1F313D]">{metrics.peakHour}</strong>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-[#FAF7F2]">
                <span className="text-[#7A7268]">Average Party Size:</span>
                <strong className="text-[#1F313D]">{metrics.averagePartySize} Guests</strong>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-[#FAF7F2]">
                <span className="text-[#7A7268]">Overall Cancellation Rate:</span>
                <strong className="text-rose-700">{metrics.cancellationRate}%</strong>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-[#FAF7F2]">
                <span className="text-[#7A7268]">Table Utilization:</span>
                <strong className="text-emerald-700">{metrics.tableUtilizationRate}%</strong>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-white border border-[#DDD5C7] shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-[#1F313D] flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-[#82401D]" /> Booking Channel Source Breakdown
            </h4>
            <div className="space-y-2 text-xs">
              {['Online', 'Phone', 'Walk-in', 'VIP Concierge', 'Google Reserve'].map((src) => {
                const count = reservations.filter((r) => r.source === src).length;
                const pct = reservations.length > 0 ? Math.round((count / reservations.length) * 100) : 0;
                return (
                  <div key={src} className="p-2.5 rounded-xl bg-[#FAF7F2] flex items-center justify-between">
                    <span className="font-bold text-[#1F313D]">{src}</span>
                    <span className="font-mono text-[#7A7268]">{count} bookings ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SELECTED RESERVATION PROFILE DRAWER ── */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-[#FAF7F2] w-full max-w-xl h-full shadow-2xl flex flex-col justify-between border-l border-[#DDD5C7] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#DDD5C7] bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-[#1F313D]">{selectedReservation.guestName}</h3>
                  <span className="text-[10px] font-mono font-bold text-[#82401D] px-2 py-0.5 rounded bg-[#EFE9DF]">
                    {selectedReservation.id}
                  </span>
                </div>
                <p className="text-xs text-[#7A7268] mt-0.5">{selectedReservation.branchName}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNotificationTargetRes(selectedReservation);
                    setIsNotificationModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#79415A] hover:bg-[#EFE9DF]"
                >
                  <Send className="w-3.5 h-3.5" /> Notify Guest
                </button>
                <button
                  onClick={() => setSelectedReservation(null)}
                  className="p-2 rounded-xl text-[#7A7268] hover:bg-[#EFE9DF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Quick Status Bar */}
              <div className="p-3.5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#7A7268] block">Current Status</span>
                  <strong className="text-xs text-[#1F313D] block mt-0.5">{selectedReservation.status}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A7268] block">Table Allocated</span>
                  <strong className="text-xs text-[#79415A] block mt-0.5">Table {selectedReservation.tableNumber}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A7268] block">Party Size</span>
                  <strong className="text-xs text-[#82401D] block mt-0.5">{selectedReservation.partySize} Guests</strong>
                </div>
              </div>

              {/* Guest & Timing Details */}
              <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-2">
                <h4 className="font-bold text-[#1F313D]">Reservation Details</h4>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div><span className="text-[#7A7268]">Mobile:</span> <strong>{selectedReservation.guestPhone}</strong></div>
                  <div><span className="text-[#7A7268]">Email:</span> <strong>{selectedReservation.guestEmail || 'None'}</strong></div>
                  <div><span className="text-[#7A7268]">Date:</span> <strong>{selectedReservation.reservationDate}</strong></div>
                  <div><span className="text-[#7A7268]">Time:</span> <strong>{selectedReservation.reservationTime}</strong></div>
                  <div><span className="text-[#7A7268]">Seating:</span> <strong>{selectedReservation.seatingPreference}</strong></div>
                  <div><span className="text-[#7A7268]">Occasion:</span> <strong>{selectedReservation.occasion}</strong></div>
                </div>
                {selectedReservation.specialRequests && (
                  <div className="mt-2 pt-2 border-t border-[#DDD5C7]/70 text-[11px]">
                    <span className="text-[#7A7268] block">Special Requests:</span>
                    <p className="italic text-[#1F313D] mt-0.5">"{selectedReservation.specialRequests}"</p>
                  </div>
                )}
              </div>

              {/* History Timeline */}
              <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-3">
                <h4 className="font-bold text-[#1F313D] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#79415A]" /> Audit &amp; Modification History
                </h4>
                <div className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DDD5C7]">
                  {selectedReservation.history.map((h) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-[#79415A] border-2 border-white"></div>
                      <div className="flex items-center justify-between font-bold text-[#1F313D]">
                        <span>{h.action}</span>
                        <span className="text-[10px] text-[#7A7268] font-mono">{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-[#5C5549] mt-0.5">{h.details}</p>
                      <span className="text-[9px] text-[#82401D] italic">By {h.performer}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT RESERVATION MODAL ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[28px] max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                  {editingReservation.id ? 'Edit Table Reservation' : 'New Table Reservation'}
                </h3>
                <span className="text-xs text-[#7A7268] font-mono">ID: {editingReservation.id}</span>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-full text-[#7A7268] hover:bg-[#DDD5C7]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReservation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Guest Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingReservation.guestName || ''}
                    onChange={(e) => setEditingReservation({ ...editingReservation, guestName: e.target.value })}
                    placeholder="e.g. Alexander Wright"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={editingReservation.guestPhone || ''}
                    onChange={(e) => setEditingReservation({ ...editingReservation, guestPhone: e.target.value })}
                    placeholder="e.g. +91 98200 12345"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingReservation.guestEmail || ''}
                    onChange={(e) => setEditingReservation({ ...editingReservation, guestEmail: e.target.value })}
                    placeholder="e.g. guest@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Party Size (Guests) *</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={editingReservation.partySize || 2}
                    onChange={(e) => setEditingReservation({ ...editingReservation, partySize: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Reservation Date *</label>
                  <input
                    type="date"
                    required
                    value={editingReservation.reservationDate || todayStr}
                    onChange={(e) => setEditingReservation({ ...editingReservation, reservationDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Reservation Time *</label>
                  <input
                    type="time"
                    required
                    value={editingReservation.reservationTime || '19:30'}
                    onChange={(e) => setEditingReservation({ ...editingReservation, reservationTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Table Allocation *</label>
                  <select
                    value={editingReservation.tableNumber || 'T-01'}
                    onChange={(e) => setEditingReservation({ ...editingReservation, tableNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  >
                    {RESTAURANT_TABLES.map((t) => (
                      <option key={t.id} value={t.tableNumber}>
                        Table {t.tableNumber} (Seats {t.capacity} - {t.section})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Seating Preference</label>
                  <select
                    value={editingReservation.seatingPreference || 'Indoor'}
                    onChange={(e) => setEditingReservation({ ...editingReservation, seatingPreference: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  >
                    <option value="Indoor">Indoor Dining</option>
                    <option value="Outdoor">Outdoor Garden</option>
                    <option value="Window">Window Terrace</option>
                    <option value="Private Dining">Private Dining / Mezzanine</option>
                    <option value="Booth">Corner Booth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Dining Occasion</label>
                  <select
                    value={editingReservation.occasion || 'Casual Dining'}
                    onChange={(e) => setEditingReservation({ ...editingReservation, occasion: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  >
                    <option value="Casual Dining">Casual Dining</option>
                    <option value="Birthday">Birthday Celebration</option>
                    <option value="Anniversary">Wedding Anniversary</option>
                    <option value="Business Dinner">Business Dinner</option>
                    <option value="Date Night">Date Night</option>
                    <option value="Celebration">Family Celebration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Booking Source</label>
                  <select
                    value={editingReservation.source || 'Online'}
                    onChange={(e) => setEditingReservation({ ...editingReservation, source: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  >
                    <option value="Online">Online Booking Widget</option>
                    <option value="Phone">Phone Inquiry</option>
                    <option value="Walk-in">Walk-in Guest</option>
                    <option value="VIP Concierge">VIP Concierge</option>
                    <option value="Google Reserve">Google Reserve</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Special Dining Notes / Requests</label>
                <textarea
                  rows={2}
                  value={editingReservation.specialRequests || ''}
                  onChange={(e) => setEditingReservation({ ...editingReservation, specialRequests: e.target.value })}
                  placeholder="Dietary requests, quiet table, anniversary champagne, high chair..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#DDD5C7]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white font-bold disabled:opacity-50"
                >
                  {isSaving ? 'Checking Availability...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CANCEL BOOKING REASON MODAL ── */}
      {isCancelModalOpen && cancellingReservation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-base text-[#1F313D]">Cancel Table Reservation</h3>
                <p className="text-xs text-[#7A7268]">{cancellingReservation.guestName} (#{cancellingReservation.id})</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Reason for Cancellation</label>
                <textarea
                  rows={3}
                  value={cancellationReasonInput}
                  onChange={(e) => setCancellationReasonInput(e.target.value)}
                  placeholder="Guest rescheduled, emergency travel, no-show..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DDD5C7]">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] text-xs font-bold"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancellation}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WAITLIST CREATION MODAL ── */}
      {isWaitlistModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C7]">
              <h3 className="font-bold text-base text-[#1F313D]">Add Walk-In to Waitlist</h3>
              <button onClick={() => setIsWaitlistModalOpen(false)} className="p-1 rounded-full text-[#7A7268] hover:bg-[#DDD5C7]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWaitlist} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Guest Name *</label>
                <input
                  type="text"
                  required
                  value={newWaitlistName}
                  onChange={(e) => setNewWaitlistName(e.target.value)}
                  placeholder="e.g. Pooja Chhabra"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newWaitlistPhone}
                  onChange={(e) => setNewWaitlistPhone(e.target.value)}
                  placeholder="e.g. +91 98200 12345"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Party Size</label>
                  <input
                    type="number"
                    min={1}
                    value={newWaitlistGuests}
                    onChange={(e) => setNewWaitlistGuests(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Seating Preference</label>
                  <select
                    value={newWaitlistSeating}
                    onChange={(e) => setNewWaitlistSeating(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  >
                    <option value="Any">Any Table</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Window">Window</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Notes</label>
                <input
                  type="text"
                  value={newWaitlistNotes}
                  onChange={(e) => setNewWaitlistNotes(e.target.value)}
                  placeholder="Waiting at bar, high chair requested..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DDD5C7]">
                <button
                  type="button"
                  onClick={() => setIsWaitlistModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold"
                >
                  Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SEAT WAITLIST PARTY MODAL ── */}
      {seatTargetWaitlist && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#1F313D]">Seat {seatTargetWaitlist.guestName}</h3>
            <p className="text-xs text-[#7A7268]">Party of {seatTargetWaitlist.partySize} guests. Select table to allocate:</p>

            <div>
              <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Select Table</label>
              <select
                value={selectedSeatTable}
                onChange={(e) => setSelectedSeatTable(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs text-[#1F313D]"
              >
                {RESTAURANT_TABLES.map((t) => (
                  <option key={t.id} value={t.tableNumber}>
                    Table {t.tableNumber} (Capacity: {t.capacity} - {t.section})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DDD5C7]">
              <button
                onClick={() => setSeatTargetWaitlist(null)}
                className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSeatFromWaitlist}
                className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold"
              >
                Seat Party Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEND NOTIFICATION MODAL ── */}
      {isNotificationModalOpen && notificationTargetRes && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#1F313D]">Send Booking Confirmation</h3>
            <p className="text-xs text-[#7A7268]">
              Guest: <strong>{notificationTargetRes.guestName}</strong> ({notificationTargetRes.reservationDate} at {notificationTargetRes.reservationTime})
            </p>

            <div>
              <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Notification Channel</label>
              <select
                value={notificationChannel}
                onChange={(e) => setNotificationChannel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs text-[#1F313D]"
              >
                <option value="WhatsApp">WhatsApp Instant Message</option>
                <option value="SMS">SMS Text Message</option>
                <option value="Email">Email Confirmation</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DDD5C7]">
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                className="px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReservationManagementView;
