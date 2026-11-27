import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid, Search, Filter, Plus, Edit2, Trash2, ArrowRightLeft,
  Layers, CheckCircle2, Clock, XCircle, AlertTriangle, RefreshCw,
  Download, Users, Eye, Sparkles, Move, UtensilsCrossed, Calendar,
  ShieldAlert, ChevronRight, Check, X, History, Info
} from 'lucide-react';
import {
  TableRecord, TableStatus, TableSection, TableShape, TableActivityLog,
  loadTables, saveTables, updateTableStatus, createTable, editTable, deleteTable,
  transferGuests, combineTables, splitTable, releaseTable, markTableClean,
  getTableMetrics, loadTableLogs, loadTableTransfers, getTableUtilizationReport
} from '../../lib/tableManagementApi';
import { loadReservationsFromStorage } from '../../lib/reservationManagementApi';

interface TableManagementViewProps {
  orgId?: string;
}

const SECTION_OPTIONS: TableSection[] = [
  'Main Dining Hall',
  'Window Terrace',
  'Outdoor Garden',
  'Mezzanine VIP',
  'Wine Cellar',
  'Private Dining',
  'Rooftop'
];

const SHAPE_OPTIONS: TableShape[] = ['Rectangle', 'Round', 'Square', 'Oval'];

const STATUS_CONFIG: Record<TableStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  Available: { label: 'Available', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Reserved: { label: 'Reserved', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Occupied: { label: 'Occupied', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500 animate-pulse' },
  Cleaning: { label: 'Cleaning', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  Unavailable: { label: 'Unavailable', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', dot: 'bg-gray-400' },
};

export const TableManagementView: React.FC<TableManagementViewProps> = () => {
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [logs, setLogs] = useState<TableActivityLog[]>([]);
  const [metrics, setMetrics] = useState(getTableMetrics());
  const [viewMode, setViewMode] = useState<'floorplan' | 'list' | 'reports'>('floorplan');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCombineModalOpen, setIsCombineModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [reportDateRange, setReportDateRange] = useState<'today' | 'week' | 'month'>('today');

  // Form states
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: 4,
    section: 'Main Dining Hall' as TableSection,
    shape: 'Rectangle' as TableShape,
    notes: ''
  });

  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [combineTargetIds, setCombineTargetIds] = useState<string[]>([]);
  const [statusChangeGuest, setStatusChangeGuest] = useState('');

  // Dragging for floor plan position
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);

  const refreshData = () => {
    const loaded = loadTables().filter(t => t.isActive);
    setTables(loaded);
    setLogs(loadTableLogs());
    setMetrics(getTableMetrics());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      const matchSection = selectedSection === 'ALL' || t.section === selectedSection;
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchSearch = !searchQuery ||
        t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.currentGuestName && t.currentGuestName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSection && matchStatus && matchSearch;
    });
  }, [tables, selectedSection, statusFilter, searchQuery]);

  // Handle table creation
  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      createTable({
        tableNumber: formData.tableNumber.trim().toUpperCase(),
        capacity: Number(formData.capacity),
        section: formData.section,
        shape: formData.shape,
        status: 'Available',
        floorPlanX: 20 + Math.floor(Math.random() * 60),
        floorPlanY: 20 + Math.floor(Math.random() * 60),
        notes: formData.notes.trim() || undefined,
        isActive: true,
      });
      setIsCreateModalOpen(false);
      setFormData({ tableNumber: '', capacity: 4, section: 'Main Dining Hall', shape: 'Rectangle', notes: '' });
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to create table');
    }
  };

  // Handle edit
  const handleEditTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    try {
      editTable(selectedTable.id, {
        tableNumber: formData.tableNumber.trim().toUpperCase(),
        capacity: Number(formData.capacity),
        section: formData.section,
        shape: formData.shape,
        notes: formData.notes.trim() || undefined,
      });
      setIsEditModalOpen(false);
      refreshData();
      setSelectedTable(null);
    } catch (err: any) {
      alert(err.message || 'Failed to edit table');
    }
  };

  // Quick status update
  const handleQuickStatus = (tableId: string, newStatus: TableStatus) => {
    try {
      updateTableStatus(tableId, newStatus, 'Staff / Admin', {
        guestName: newStatus === 'Occupied' ? (statusChangeGuest || 'Walk-in Guest') : undefined
      });
      setStatusChangeGuest('');
      refreshData();
      if (selectedTable?.id === tableId) {
        setSelectedTable(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle transfer
  const handleTransfer = () => {
    if (!selectedTable || !transferTargetId) return;
    try {
      transferGuests(selectedTable.id, transferTargetId, 'Admin', transferReason);
      setIsTransferModalOpen(false);
      setTransferTargetId('');
      setTransferReason('');
      refreshData();
      setSelectedTable(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle combine
  const handleCombine = () => {
    if (!selectedTable || combineTargetIds.length === 0) return;
    try {
      combineTables(selectedTable.id, combineTargetIds, 'Admin');
      setIsCombineModalOpen(false);
      setCombineTargetIds([]);
      refreshData();
      setSelectedTable(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle split
  const handleSplit = (tableId: string) => {
    if (!window.confirm('Are you sure you want to split this combined table back to individual tables?')) return;
    try {
      splitTable(tableId, 'Admin');
      refreshData();
      setSelectedTable(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle delete
  const handleDelete = (tableId: string) => {
    if (!window.confirm('Are you sure you want to remove this table?')) return;
    try {
      deleteTable(tableId);
      refreshData();
      setSelectedTable(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Floor plan drag position update
  const handleDropOnFloorPlan = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggingTableId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(5, Math.min(92, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(5, Math.min(90, Math.round(((e.clientY - rect.top) / rect.height) * 100)));

    editTable(draggingTableId, { floorPlanX: x, floorPlanY: y });
    setDraggingTableId(null);
    refreshData();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Table Number', 'Capacity', 'Section', 'Shape', 'Status', 'Current Guest', 'Combined With'];
    const rows = filteredTables.map(t => [
      t.tableNumber,
      t.capacity,
      t.section,
      t.shape,
      t.status,
      t.currentGuestName || 'None',
      t.combinedWith ? t.combinedWith.join(';') : 'No'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `restaurant_tables_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const utilizationReports = useMemo(() => {
    return getTableUtilizationReport(reportDateRange);
  }, [reportDateRange, tables]);

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#79415A]/10 text-[#79415A]">
              <LayoutGrid className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#1F313D]">Table Management</h1>
          </div>
          <p className="text-xs text-[#7A7268] mt-1">
            Real-time table layout, floor plan mapping, capacity allocation, guest transfers, and turnover optimization.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition border border-[#DDD5C7]"
          >
            <History className="w-3.5 h-3.5" />
            Audit Logs
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition border border-[#DDD5C7]"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => {
              setFormData({ tableNumber: `T-${tables.length + 1 < 10 ? '0' : ''}${tables.length + 1}`, capacity: 4, section: 'Main Dining Hall', shape: 'Rectangle', notes: '' });
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
          <div className="text-[11px] font-semibold text-[#7A7268]">Total Tables</div>
          <div className="text-2xl font-black text-[#1F313D] mt-1">{metrics.total}</div>
          <div className="text-[10px] text-[#79415A] mt-1 font-medium">{metrics.totalCapacity} Total Seats</div>
        </div>
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-800">Available</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.available}</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">Ready for guests</div>
        </div>
        <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-800">Occupied</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{metrics.occupied}</div>
          <div className="text-[10px] text-rose-600 mt-1 font-medium">{metrics.occupancyRate}% Occupancy Rate</div>
        </div>
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-800">Reserved</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{metrics.reserved}</div>
          <div className="text-[10px] text-amber-600 mt-1 font-medium">Assigned bookings</div>
        </div>
        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-800">Cleaning</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{metrics.cleaning}</div>
          <div className="text-[10px] text-blue-600 mt-1 font-medium">Sanitizing in progress</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-600">Unavailable</div>
          <div className="text-2xl font-black text-gray-700 mt-1">{metrics.unavailable}</div>
          <div className="text-[10px] text-gray-500 mt-1 font-medium">Maint. / Combined</div>
        </div>
      </div>

      {/* ── TOOLBAR & VIEW CONTROLS ── */}
      <div className="bg-[#FAF7F2] p-4 rounded-[24px] border border-[#E5DDD2] space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Mode switch */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EFE9DF] rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setViewMode('floorplan')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'floorplan' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Floor Plan Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'list' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Table List ({filteredTables.length})
            </button>
            <button
              onClick={() => setViewMode('reports')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'reports' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Utilization Analytics
            </button>
          </div>

          {/* Search & filters */}
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7268]" />
              <input
                type="text"
                placeholder="Search table or guest..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#79415A]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white text-[#1F313D] focus:outline-none font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Reserved">Reserved</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Section Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-[#DDD5C7]/50 text-xs">
          <span className="text-[#7A7268] font-bold text-[11px] shrink-0 mr-1">Section:</span>
          <button
            onClick={() => setSelectedSection('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition ${
              selectedSection === 'ALL'
                ? 'bg-[#1F313D] text-white'
                : 'bg-white border border-[#DDD5C7] text-[#5C5549] hover:bg-[#EFE9DF]'
            }`}
          >
            All Sections ({tables.length})
          </button>
          {SECTION_OPTIONS.map(sec => {
            const count = tables.filter(t => t.section === sec).length;
            return (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
                  selectedSection === sec
                    ? 'bg-[#79415A] text-white font-bold'
                    : 'bg-white border border-[#DDD5C7] text-[#5C5549] hover:bg-[#EFE9DF]'
                }`}
              >
                {sec} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT BASED ON VIEW MODE ── */}
      {viewMode === 'floorplan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Canvas (8 cols) */}
          <div className="lg:col-span-8 bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#1F313D] flex items-center gap-2">
                  Interactive Restaurant Floor Plan
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#EFE9DF] text-[#7A7268]">
                    Drag table to reposition
                  </span>
                </h3>
                <p className="text-[11px] text-[#7A7268]">
                  Click any table to manage seating, release, clean, or transfer guests.
                </p>
              </div>

              {/* Status Legend */}
              <div className="flex items-center gap-3 text-[10px] font-bold text-[#5C5549] flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Free</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Occupied</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reserved</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Cleaning</span>
              </div>
            </div>

            {/* Floor Map Board */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDropOnFloorPlan}
              className="relative w-full h-[520px] bg-white rounded-2xl border-2 border-dashed border-[#DDD5C7] overflow-hidden p-4 select-none shadow-inner"
              style={{
                backgroundImage: 'radial-gradient(#DDD5C7 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            >
              {/* Floor Plan Zone Labels */}
              <div className="absolute top-2 left-3 text-[10px] font-black uppercase tracking-wider text-[#DDD5C7]">Window Terrace Zone</div>
              <div className="absolute top-2 right-3 text-[10px] font-black uppercase tracking-wider text-[#DDD5C7]">Rooftop / Garden</div>
              <div className="absolute bottom-2 left-3 text-[10px] font-black uppercase tracking-wider text-[#DDD5C7]">Private & VIP Suites</div>
              <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider text-[#DDD5C7]">Main Dining Center</div>

              {filteredTables.map(table => {
                const cfg = STATUS_CONFIG[table.status];
                const isSelected = selectedTable?.id === table.id;

                // Shape styling
                const shapeStyle =
                  table.shape === 'Round'
                    ? 'rounded-full aspect-square'
                    : table.shape === 'Oval'
                    ? 'rounded-[32px] px-4'
                    : table.shape === 'Square'
                    ? 'rounded-xl aspect-square'
                    : 'rounded-xl';

                return (
                  <div
                    key={table.id}
                    draggable
                    onDragStart={() => setDraggingTableId(table.id)}
                    onClick={() => setSelectedTable(table)}
                    style={{
                      left: `${table.floorPlanX}%`,
                      top: `${table.floorPlanY}%`,
                      transform: 'translate(-50%, -50%)',
                      position: 'absolute'
                    }}
                    className={`cursor-pointer transition-all duration-150 flex flex-col items-center justify-center p-2.5 shadow-sm hover:shadow-md ${shapeStyle} ${cfg.bg} border-2 ${
                      isSelected ? 'border-[#79415A] ring-2 ring-[#79415A]/30 scale-105' : cfg.border
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold font-mono text-xs text-[#1F313D]">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {table.tableNumber}
                    </div>
                    <div className="text-[10px] text-[#5C5549] font-medium flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" />
                      {table.capacity}
                    </div>
                    {table.currentGuestName && (
                      <div className="text-[9px] font-bold text-[#79415A] truncate max-w-[70px] mt-0.5">
                        {table.currentGuestName}
                      </div>
                    )}
                    {table.isCombined && (
                      <span className="text-[8px] bg-purple-100 text-purple-700 font-bold px-1 rounded-sm mt-0.5">
                        Combined
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action & Table Detail Inspector (4 cols) */}
          <div className="lg:col-span-4 bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-5">
            {selectedTable ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-xl font-bold text-[#1F313D]">{selectedTable.tableNumber}</h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[selectedTable.status].bg} ${STATUS_CONFIG[selectedTable.status].text}`}>
                        {selectedTable.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#7A7268] mt-0.5">
                      {selectedTable.section} · {selectedTable.capacity} Seats ({selectedTable.shape})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTable(null)}
                    className="p-1.5 rounded-lg text-[#7A7268] hover:bg-[#EFE9DF]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Current assignment card */}
                <div className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7] space-y-1.5 text-xs">
                  <div className="text-[11px] font-bold text-[#7A7268] uppercase tracking-wider">Active Guest / Order</div>
                  {selectedTable.currentGuestName ? (
                    <div>
                      <div className="font-bold text-[#1F313D] text-sm">{selectedTable.currentGuestName}</div>
                      {selectedTable.occupiedSince && (
                        <div className="text-[11px] text-[#7A7268] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#79415A]" />
                          Seated since {new Date(selectedTable.occupiedSince).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-[#7A7268] italic">No guests currently seated</div>
                  )}
                  {selectedTable.notes && (
                    <div className="text-[11px] text-[#82401D] bg-amber-50 p-2 rounded-xl mt-2 border border-amber-200">
                      Note: {selectedTable.notes}
                    </div>
                  )}
                </div>

                {/* State Changer Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1F313D] block">Update Table Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleQuickStatus(selectedTable.id, 'Available')}
                      className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition"
                    >
                      Mark Available
                    </button>
                    <button
                      onClick={() => {
                        const guest = prompt('Guest name for this table:', 'Walk-in Party');
                        if (guest) handleQuickStatus(selectedTable.id, 'Occupied');
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs transition"
                    >
                      Seat Walk-in
                    </button>
                    <button
                      onClick={() => handleQuickStatus(selectedTable.id, 'Cleaning')}
                      className="px-3 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs transition"
                    >
                      Send to Clean
                    </button>
                    <button
                      onClick={() => handleQuickStatus(selectedTable.id, 'Unavailable')}
                      className="px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs transition"
                    >
                      Out of Service
                    </button>
                  </div>
                </div>

                {/* Table Actions (Transfer, Combine, Split) */}
                <div className="pt-2 border-t border-[#DDD5C7] space-y-2">
                  <label className="text-xs font-bold text-[#1F313D] block">Operational Actions</label>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setIsTransferModalOpen(true)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD5C7] hover:bg-[#EFE9DF] text-xs font-bold text-[#1F313D] transition"
                    >
                      <span className="flex items-center gap-2">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-[#79415A]" />
                        Transfer Guests to Another Table
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#7A7268]" />
                    </button>

                    {selectedTable.isCombined ? (
                      <button
                        onClick={() => handleSplit(selectedTable.id)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 text-xs font-bold text-purple-800 transition"
                      >
                        <span className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-purple-600" />
                          Split Combined Table
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-purple-600" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsCombineModalOpen(true)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD5C7] hover:bg-[#EFE9DF] text-xs font-bold text-[#1F313D] transition"
                      >
                        <span className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-[#79415A]" />
                          Combine for Large Party
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#7A7268]" />
                      </button>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          setFormData({
                            tableNumber: selectedTable.tableNumber,
                            capacity: selectedTable.capacity,
                            section: selectedTable.section,
                            shape: selectedTable.shape,
                            notes: selectedTable.notes || ''
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="flex-1 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit Info
                      </button>
                      <button
                        onClick={() => handleDelete(selectedTable.id)}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition flex items-center justify-center gap-1 border border-rose-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center text-[#7A7268]">
                <div className="w-12 h-12 rounded-2xl bg-[#EFE9DF] flex items-center justify-center mb-3">
                  <LayoutGrid className="w-6 h-6 text-[#79415A]" />
                </div>
                <h4 className="font-bold text-sm text-[#1F313D]">Select a Table</h4>
                <p className="text-xs text-[#7A7268] max-w-[220px] mt-1">
                  Click any table on the floor plan to inspect status, assign bookings, or transfer diners.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TABLE LIST VIEW ── */}
      {viewMode === 'list' && (
        <div className="bg-[#FAF7F2] rounded-[28px] border border-[#E5DDD2] p-5 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#DDD5C7] text-left text-[#7A7268] font-bold">
                  <th className="pb-3 pl-2">Table #</th>
                  <th className="pb-3">Section</th>
                  <th className="pb-3">Capacity</th>
                  <th className="pb-3">Shape</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Current Diner</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {filteredTables.map(t => {
                  const cfg = STATUS_CONFIG[t.status];
                  return (
                    <tr key={t.id} className="hover:bg-white/70 transition">
                      <td className="py-3 pl-2 font-mono font-bold text-sm text-[#1F313D]">
                        {t.tableNumber}
                        {t.isCombined && (
                          <span className="ml-1.5 text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-sans font-bold">
                            Combined
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-[#5C5549]">{t.section}</td>
                      <td className="py-3 font-semibold text-[#1F313D]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#7A7268]" />
                          {t.capacity} guests
                        </span>
                      </td>
                      <td className="py-3 text-[#7A7268]">{t.shape}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-[#1F313D]">
                        {t.currentGuestName || <span className="text-[#9A8E82] italic">—</span>}
                      </td>
                      <td className="py-3 text-[11px] text-[#7A7268] max-w-[160px] truncate">
                        {t.notes || '—'}
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === 'Occupied' && (
                            <button
                              onClick={() => handleQuickStatus(t.id, 'Cleaning')}
                              className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-bold"
                            >
                              Release
                            </button>
                          )}
                          {t.status === 'Cleaning' && (
                            <button
                              onClick={() => handleQuickStatus(t.id, 'Available')}
                              className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold"
                            >
                              Cleaned
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedTable(t);
                              setViewMode('floorplan');
                            }}
                            className="p-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DDD2] text-[#1F313D]"
                            title="Inspect & Transfer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTable(t);
                              setFormData({
                                tableNumber: t.tableNumber,
                                capacity: t.capacity,
                                section: t.section,
                                shape: t.shape,
                                notes: t.notes || ''
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DDD2] text-[#1F313D]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REPORTS & UTILIZATION ANALYTICS ── */}
      {viewMode === 'reports' && (
        <div className="space-y-6">
          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1F313D]">
                  Section Utilization & Turnover Analytics
                </h3>
                <p className="text-xs text-[#7A7268]">
                  Table occupancy metrics, average sitting duration, and capacity efficiency per dining zone.
                </p>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5 p-1 bg-[#EFE9DF] rounded-xl text-xs font-bold">
                {(['today', 'week', 'month'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setReportDateRange(d)}
                    className={`px-3 py-1 rounded-lg capitalize transition ${
                      reportDateRange === d ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {utilizationReports.map(rep => (
                <div key={rep.section} className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-[#1F313D]">{rep.section}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFE9DF] text-[#7A7268]">
                      {rep.totalTables} Tables
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#5C5549]">Occupancy Rate</span>
                      <span className="font-bold text-[#1F313D]">{rep.avgOccupancyRate}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EAE4D9] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#79415A] rounded-full transition-all duration-300"
                        style={{ width: `${rep.avgOccupancyRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#DDD5C7]/60 flex items-center justify-between text-[11px] text-[#7A7268]">
                    <span>Avg Turnover Time</span>
                    <strong className="text-[#1F313D] font-mono">{rep.avgTurnover} min</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE TABLE MODAL ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#1F313D]">Create Restaurant Table</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#7A7268] hover:text-[#1F313D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Table Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-15"
                  value={formData.tableNumber}
                  onChange={e => setFormData({ ...formData, tableNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#79415A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Capacity (Seats) *</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#79415A]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Shape</label>
                  <select
                    value={formData.shape}
                    onChange={e => setFormData({ ...formData, shape: e.target.value as TableShape })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none"
                  >
                    {SHAPE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Dining Section *</label>
                <select
                  value={formData.section}
                  onChange={e => setFormData({ ...formData, section: e.target.value as TableSection })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none"
                >
                  {SECTION_OPTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Internal Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Near power outlet, quiet booth"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold hover:bg-[#E5DDD2] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#79415A] text-white font-bold hover:bg-[#68334b] transition shadow-xs"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT TABLE MODAL ── */}
      {isEditModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#1F313D]">Edit Table {selectedTable.tableNumber}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#7A7268] hover:text-[#1F313D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditTable} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Table Number</label>
                <input
                  type="text"
                  required
                  value={formData.tableNumber}
                  onChange={e => setFormData({ ...formData, tableNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white font-mono font-bold text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Shape</label>
                  <select
                    value={formData.shape}
                    onChange={e => setFormData({ ...formData, shape: e.target.value as TableShape })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none"
                  >
                    {SHAPE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Section</label>
                <select
                  value={formData.section}
                  onChange={e => setFormData({ ...formData, section: e.target.value as TableSection })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none"
                >
                  {SECTION_OPTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold hover:bg-[#E5DDD2] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#79415A] text-white font-bold hover:bg-[#68334b] transition shadow-xs"
                >
                  Update Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TRANSFER GUESTS MODAL ── */}
      {isTransferModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#1F313D]">
                Transfer Guests from {selectedTable.tableNumber}
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-[#7A7268] hover:text-[#1F313D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[#7A7268]">
              Move seated guests ({selectedTable.currentGuestName || 'Active diners'}) to an open table. {selectedTable.tableNumber} will be sent for cleaning.
            </p>

            <div>
              <label className="font-bold text-[#1F313D] block mb-1">Select Available Destination Table *</label>
              <select
                value={transferTargetId}
                onChange={e => setTransferTargetId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none"
              >
                <option value="">-- Choose Table --</option>
                {tables
                  .filter(t => t.id !== selectedTable.id && t.status === 'Available')
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.tableNumber} ({t.section} · {t.capacity} seats)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[#1F313D] block mb-1">Reason for Transfer (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Guest requested window view / AC draft"
                value={transferReason}
                onChange={e => setTransferReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
              >
                Cancel
              </button>
              <button
                disabled={!transferTargetId}
                onClick={handleTransfer}
                className="flex-1 py-2.5 rounded-xl bg-[#79415A] disabled:opacity-50 text-white font-bold hover:bg-[#68334b] transition"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COMBINE TABLES MODAL ── */}
      {isCombineModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#1F313D]">
                Combine with {selectedTable.tableNumber}
              </h3>
              <button onClick={() => setIsCombineModalOpen(false)} className="text-[#7A7268] hover:text-[#1F313D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[#7A7268]">
              Select available tables to join with {selectedTable.tableNumber} for a large party or banquet.
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {tables
                .filter(t => t.id !== selectedTable.id && t.status === 'Available')
                .map(t => {
                  const isChecked = combineTargetIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                        isChecked ? 'bg-[#79415A]/10 border-[#79415A]' : 'bg-white border-[#DDD5C7]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) setCombineTargetIds([...combineTargetIds, t.id]);
                            else setCombineTargetIds(combineTargetIds.filter(id => id !== t.id));
                          }}
                          className="rounded text-[#79415A]"
                        />
                        <span className="font-bold text-[#1F313D]">{t.tableNumber}</span>
                        <span className="text-[11px] text-[#7A7268]">({t.section})</span>
                      </div>
                      <span className="font-bold text-[#79415A]">+{t.capacity} seats</span>
                    </label>
                  );
                })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsCombineModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
              >
                Cancel
              </button>
              <button
                disabled={combineTargetIds.length === 0}
                onClick={handleCombine}
                className="flex-1 py-2.5 rounded-xl bg-[#79415A] disabled:opacity-50 text-white font-bold hover:bg-[#68334b] transition"
              >
                Combine Tables
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT LOGS DRAWER ── */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-[#FAF7F2] w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD5C7] pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1F313D]">Table Activity & Audit Log</h3>
                <p className="text-xs text-[#7A7268]">Chronological history of status changes, transfers, and cleans</p>
              </div>
              <button onClick={() => setIsHistoryDrawerOpen(false)} className="text-[#7A7268] hover:text-[#1F313D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-[#7A7268] text-xs">No activity logged yet</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1F313D]">{log.action}</span>
                      <span className="text-[10px] text-[#7A7268]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[#5C5549] text-[11px]">{log.details}</div>
                    <div className="text-[10px] text-[#7A7268] pt-1 flex justify-between">
                      <span>Table: <strong>{log.tableNumber}</strong></span>
                      <span>By: {log.performer}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
