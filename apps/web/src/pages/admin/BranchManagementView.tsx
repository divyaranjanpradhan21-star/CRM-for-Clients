import React, { useState, useEffect } from 'react';
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  UtensilsCrossed,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  MapPin,
  Lock,
  Unlock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Sliders,
  Percent,
  CalendarX,
  Coffee,
  Sparkles,
  Info
} from 'lucide-react';
import {
  BranchRecord,
  BranchOperatingDay,
  BranchHoliday,
  BranchMenuOverride,
  BranchStaffAssignment,
  BranchSalesReport,
  fetchAllBranches,
  saveBranch,
  toggleBranchStatus,
  deleteBranch,
  getBranchReports,
  DEFAULT_OPERATING_HOURS
} from '../../lib/branchManagementApi';

interface BranchManagementViewProps {
  onSelectBranchForDashboard?: (branchName: string) => void;
  currentUserRole?: string;
  currentUserBranch?: string;
}

export const BranchManagementView: React.FC<BranchManagementViewProps> = ({
  onSelectBranchForDashboard,
  currentUserRole = 'RESTAURANT_ADMIN',
  currentUserBranch,
}) => {
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [reports, setReports] = useState<BranchSalesReport[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('br-downtown');
  const [activeSubTab, setActiveSubTab] = useState<
    'branches' | 'hours' | 'holidays' | 'menu' | 'staff' | 'reports' | 'access'
  >('branches');

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Partial<BranchRecord> | null>(null);

  // New holiday modal
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState<Partial<BranchHoliday>>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    isFullDayClosed: true,
    partialOpenTime: '08:00',
    partialCloseTime: '16:00',
    notes: '',
  });

  // New staff modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<Partial<BranchStaffAssignment>>({
    name: '',
    email: '',
    phone: '',
    role: 'Floor Host',
    shiftTiming: 'Full Day (09:00 - 18:00)',
    isPrimaryBranch: true,
  });

  // Simulated User Restriction State
  const [isRestrictionSimulated, setIsRestrictionSimulated] = useState<boolean>(false);
  const [simulatedBranchId, setSimulatedBranchId] = useState<string>('br-downtown');

  // Load branches
  useEffect(() => {
    const load = async () => {
      const data = await fetchAllBranches();
      setBranches(data);
      if (data.length > 0 && !data.some(b => b.id === selectedBranchId)) {
        setSelectedBranchId(data[0].id);
      }
      const r = await getBranchReports();
      setReports(r);
    };
    load();
  }, []);

  // Current selected branch
  const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  // Effective branches based on simulation/restrictions
  const displayedBranches = branches.filter(b => {
    if (isRestrictionSimulated && b.id !== simulatedBranchId) {
      return false;
    }
    if (statusFilter === 'active' && !b.isActive) return false;
    if (statusFilter === 'inactive' && b.isActive) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.managerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle Save Branch (Create / Edit)
  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editingBranch.name) return;

    const saved = await saveBranch(editingBranch);
    setBranches(prev => {
      const exists = prev.findIndex(b => b.id === saved.id);
      if (exists >= 0) {
        const copy = [...prev];
        copy[exists] = saved;
        return copy;
      }
      return [...prev, saved];
    });

    setIsEditModalOpen(false);
    setEditingBranch(null);
  };

  // Handle Toggle Status
  const handleToggleStatus = async (branchId: string, currentStatus: boolean) => {
    await toggleBranchStatus(branchId, !currentStatus);
    setBranches(prev =>
      prev.map(b => (b.id === branchId ? { ...b, isActive: !currentStatus } : b))
    );
  };

  // Handle Delete Branch
  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    if (confirm(`Are you sure you want to delete branch "${branchName}"? This action cannot be undone.`)) {
      await deleteBranch(branchId);
      setBranches(prev => prev.filter(b => b.id !== branchId));
    }
  };

  // Handle Operating Hours change
  const handleHourChange = (
    dayName: string,
    field: 'isOpen' | 'openTime' | 'closeTime',
    value: any
  ) => {
    if (!selectedBranch) return;
    const updatedHours = selectedBranch.operatingHours.map(d =>
      d.day === dayName ? { ...d, [field]: value } : d
    );
    const updatedBranch = { ...selectedBranch, operatingHours: updatedHours };
    saveBranch(updatedBranch);
    setBranches(prev => prev.map(b => (b.id === selectedBranch.id ? updatedBranch : b)));
  };

  // Quick Preset for Operating Hours
  const applyHoursPreset = (preset: 'standard' | 'weekend_extended' | 'always_open') => {
    if (!selectedBranch) return;
    let newHours: BranchOperatingDay[];
    if (preset === 'standard') {
      newHours = DEFAULT_OPERATING_HOURS;
    } else if (preset === 'weekend_extended') {
      newHours = DEFAULT_OPERATING_HOURS.map(d =>
        d.day === 'Friday' || d.day === 'Saturday' || d.day === 'Sunday'
          ? { ...d, closeTime: '01:00' }
          : d
      );
    } else {
      newHours = DEFAULT_OPERATING_HOURS.map(d => ({ ...d, openTime: '00:00', closeTime: '23:59' }));
    }
    const updatedBranch = { ...selectedBranch, operatingHours: newHours };
    saveBranch(updatedBranch);
    setBranches(prev => prev.map(b => (b.id === selectedBranch.id ? updatedBranch : b)));
  };

  // Add Holiday
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || !newHoliday.name || !newHoliday.date) return;
    const holiday: BranchHoliday = {
      id: `hol-${Date.now()}`,
      name: newHoliday.name,
      date: newHoliday.date,
      isFullDayClosed: newHoliday.isFullDayClosed ?? true,
      partialOpenTime: newHoliday.partialOpenTime,
      partialCloseTime: newHoliday.partialCloseTime,
      notes: newHoliday.notes,
    };
    const updatedBranch = {
      ...selectedBranch,
      holidays: [...(selectedBranch.holidays || []), holiday],
    };
    saveBranch(updatedBranch);
    setBranches(prev => prev.map(b => (b.id === selectedBranch.id ? updatedBranch : b)));
    setIsHolidayModalOpen(false);
    setNewHoliday({
      name: '',
      date: new Date().toISOString().split('T')[0],
      isFullDayClosed: true,
      notes: '',
    });
  };

  // Delete Holiday
  const handleDeleteHoliday = (holidayId: string) => {
    if (!selectedBranch) return;
    const updatedBranch = {
      ...selectedBranch,
      holidays: selectedBranch.holidays.filter(h => h.id !== holidayId),
    };
    saveBranch(updatedBranch);
    setBranches(prev => prev.map(b => (b.id === selectedBranch.id ? updatedBranch : b)));
  };

  // Add Staff Member to Branch
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || !newStaff.name) return;
    const staff: BranchStaffAssignment = {
      id: `st-${Date.now()}`,
      name: newStaff.name,
      email: newStaff.email || `${newStaff.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@cafescorner.com`,
      phone: newStaff.phone || '+91 98000 00000',
      role: newStaff.role as any || 'Floor Host',
      branchId: selectedBranch.id,
      isPrimaryBranch: newStaff.isPrimaryBranch ?? true,
      shiftTiming: newStaff.shiftTiming || 'General Shift',
    };
    const updatedBranch = {
      ...selectedBranch,
      assignedStaff: [...(selectedBranch.assignedStaff || []), staff],
      activeStaffCount: (selectedBranch.assignedStaff?.length || 0) + 1,
    };
    saveBranch(updatedBranch);
    setBranches(prev => prev.map(b => (b.id === selectedBranch.id ? updatedBranch : b)));
    setIsStaffModalOpen(false);
    setNewStaff({
      name: '',
      email: '',
      phone: '',
      role: 'Floor Host',
      shiftTiming: 'Full Day (09:00 - 18:00)',
    });
  };

  // Remove Staff Member
  const handleRemoveStaff = (staffId: string) => {
    if (!selectedBranch) return;
    const updatedBranch = {
      ...selectedBranch,
      assignedStaff: selectedBranch.assignedStaff.filter(s => s.id !== staffId),
      activeStaffCount: Math.max(0, (selectedBranch.assignedStaff?.length || 1) - 1),
    };
    saveBranch(updatedBranch);
    setBranches(prev => prev.map(b => (b.id === selectedBranch.id ? updatedBranch : b)));
  };

  // Update Menu Item Price & Availability for this branch
  const handleMenuPriceChange = (itemId: string, newPrice: number) => {
    if (!selectedBranch) return;
    const updatedOverrides = selectedBranch.menuOverrides.map(item =>
      item.itemId === itemId ? { ...item, branchPrice: Number(newPrice) } : item
    );
    const updatedBranch = { ...selectedBranch, menuOverrides: updatedOverrides };
    saveBranch(updatedBranch);
    setBranches(prev => prev.map(b => (b.id === selectedBranch.id ? updatedBranch : b)));
  };

  const handleMenuAvailabilityToggle = (itemId: string, currentAvail: boolean) => {
    if (!selectedBranch) return;
    const updatedOverrides = selectedBranch.menuOverrides.map(item =>
      item.itemId === itemId ? { ...item, isAvailable: !currentAvail } : item
    );
    const updatedBranch = { ...selectedBranch, menuOverrides: updatedOverrides };
    saveBranch(updatedBranch);
    setBranches(prev => prev.map(b => (b.id === selectedBranch.id ? updatedBranch : b)));
  };

  // Export Branch CSV Report
  const handleExportCSV = () => {
    const headers = ['Branch Name', 'Code', 'Status', 'City', 'Phone', 'Manager', 'Monthly Revenue ($)', 'Monthly Orders', 'Avg Order Value ($)'];
    const rows = branches.map(b => [
      `"${b.name}"`,
      b.code,
      b.isActive ? 'Active' : 'Inactive',
      b.city,
      b.phone,
      `"${b.managerName}"`,
      b.monthlyRevenue,
      b.monthlyOrders,
      b.avgOrderValue,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `branch_operations_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER: BRANCH MANAGEMENT CONTROLS ── */}
      <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#EFE9DF] text-[#79415A]">
              <Building className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1F313D] leading-none">
                Restaurant Branch Management
              </h2>
              <p className="text-xs text-[#7A7268] mt-1 font-medium">
                Multi-outlet operations, store details, operating schedules, custom menus, employee rosters &amp; branch data security
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Restriction Simulation Pill */}
          <button
            onClick={() => setIsRestrictionSimulated(!isRestrictionSimulated)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
              isRestrictionSimulated
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-[#EFE9DF] border-[#DDD5C7] text-[#5C5549] hover:text-[#1F313D]'
            }`}
            title="Simulate how branch-restricted managers view only their authorized branch"
          >
            {isRestrictionSimulated ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isRestrictionSimulated ? 'Simulating Branch Restrict: ACTIVE' : 'Simulate Branch User Restriction'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DDD5C7] rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#1F313D] hover:bg-white shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-[#82401D]" />
            <span>Export Branch Report</span>
          </button>

          <button
            onClick={() => {
              setEditingBranch({
                code: `BR-${Math.floor(10 + Math.random() * 90)}`,
                name: '',
                address: '',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                phone: '+91 22 ',
                email: '',
                managerName: '',
                managerEmail: '',
                managerPhone: '+91 98',
                isActive: true,
                seatingCapacity: 80,
                operatingHours: DEFAULT_OPERATING_HOURS,
                holidays: [],
                menuOverrides: [],
                assignedStaff: [],
              });
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#79415A] hover:bg-[#68334b] text-white rounded-full px-4 py-1.5 text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create New Branch</span>
          </button>
        </div>
      </div>

      {/* Restriction Notice Banner if Simulation is Enabled */}
      {isRestrictionSimulated && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <strong className="font-bold">Branch Access Restricted Mode Active:</strong> You are testing as an authorized branch staff user assigned to{' '}
              <span className="font-mono font-bold">{branches.find(b => b.id === simulatedBranchId)?.name}</span>. All cross-branch data and unauthorized outlets are isolated and hidden.
            </div>
          </div>
          <select
            value={simulatedBranchId}
            onChange={(e) => setSimulatedBranchId(e.target.value)}
            className="bg-white border border-amber-300 rounded-xl px-2.5 py-1 text-xs font-bold text-amber-900 focus:outline-none"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>Test as: {b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── SUB-NAVIGATION TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'branches', label: 'All Branches Overview', icon: Building, count: displayedBranches.length },
          { id: 'hours', label: 'Operating Hours & Schedule', icon: Clock },
          { id: 'holidays', label: 'Branch Holidays & Closures', icon: CalendarX, count: selectedBranch?.holidays?.length || 0 },
          { id: 'menu', label: 'Branch Menu & Custom Prices', icon: UtensilsCrossed },
          { id: 'staff', label: 'Assigned Staff Roster', icon: Users, count: selectedBranch?.assignedStaff?.length || 0 },
          { id: 'reports', label: 'Branch-Wise Sales Reports', icon: TrendingUp },
          { id: 'access', label: 'Data Authorization Matrix', icon: ShieldCheck },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap ${
                isActive
                  ? 'bg-[#79415A] text-white shadow-xs'
                  : 'bg-[#FAF7F2] border border-[#DDD5C7] text-[#5C5549] hover:bg-white hover:text-[#1F313D]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#EFE9DF] text-[#1F313D]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Branch Context Pill */}
      {activeSubTab !== 'branches' && activeSubTab !== 'reports' && (
        <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#7A7268] font-medium">Currently Configuring:</span>
            <span className="font-bold text-[#1F313D] flex items-center gap-1.5">
              <Building className="w-4 h-4 text-[#82401D]" />
              {selectedBranch?.name} ({selectedBranch?.code})
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              selectedBranch?.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {selectedBranch?.isActive ? 'Active Outlet' : 'Deactivated'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#7A7268]">Switch Branch:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-1 font-bold text-[#1F313D] focus:outline-none cursor-pointer"
            >
              {displayedBranches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── TAB 1: ALL BRANCHES OVERVIEW & MANAGEMENT ── */}
      {activeSubTab === 'branches' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E5DDD2] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-3.5 h-3.5 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search branches by name, code, city, manager..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#7A7268]">Status Filter:</span>
              <div className="flex bg-[#EFE9DF] rounded-xl p-0.5 border border-[#DDD5C7]">
                {(['all', 'active', 'inactive'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-lg capitalize font-bold transition ${
                      statusFilter === s ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {displayedBranches.map(branch => {
              const isSelected = selectedBranchId === branch.id;
              return (
                <div
                  key={branch.id}
                  onClick={() => setSelectedBranchId(branch.id)}
                  className={`bg-[#FAF7F2] rounded-[24px] p-5 border transition flex flex-col justify-between cursor-pointer ${
                    isSelected ? 'border-[#79415A] ring-2 ring-[#79415A]/20 shadow-md' : 'border-[#E5DDD2] hover:border-[#79415A]/50 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header: Code, Name & Status Toggle */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#EFE9DF] text-[#1F313D] border border-[#DDD5C7]">
                            {branch.code}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            branch.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {branch.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#1F313D] mt-1.5">{branch.name}</h3>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingBranch(branch);
                            setIsEditModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-full bg-[#EFE9DF] hover:bg-white text-[#5C5549] hover:text-[#1F313D] flex items-center justify-center transition"
                          title="Edit Branch"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(branch.id, branch.isActive)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                            branch.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-600'
                              : 'bg-rose-50 text-rose-700 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                          title={branch.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id, branch.name)}
                          className="w-8 h-8 rounded-full bg-[#EFE9DF] hover:bg-rose-100 text-rose-500 hover:text-rose-700 flex items-center justify-center transition"
                          title="Delete Branch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Address & Contact Information */}
                    <div className="space-y-1.5 text-xs text-[#5C5549] bg-[#EFE9DF]/60 p-3 rounded-2xl mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#82401D] shrink-0 mt-0.5" />
                        <span>{branch.address}, {branch.city}, {branch.state} — {branch.pincode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#79415A] shrink-0" />
                        <span>{branch.phone}</span>
                        <span className="text-[#DDD5C7]">|</span>
                        <Mail className="w-3.5 h-3.5 text-[#79415A] shrink-0" />
                        <span>{branch.email}</span>
                      </div>
                    </div>

                    {/* Manager Details */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#DDD5C7]/70 text-xs mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1F313D] text-white font-bold flex items-center justify-center text-xs">
                          {branch.managerName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#1F313D]">{branch.managerName}</div>
                          <span className="text-[10px] text-[#7A7268] block">Branch Manager · {branch.managerPhone}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#79415A] font-semibold">{branch.managerEmail}</span>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                      <div className="p-2 rounded-xl bg-[#EFE9DF]">
                        <span className="text-[10px] text-[#7A7268] block">Capacity</span>
                        <strong className="text-[#1F313D]">{branch.seatingCapacity} seats</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#EFE9DF]">
                        <span className="text-[10px] text-[#7A7268] block">Staff</span>
                        <strong className="text-[#1F313D]">{branch.assignedStaff?.length || branch.activeStaffCount} crew</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#EFE9DF]">
                        <span className="text-[10px] text-[#7A7268] block">Orders</span>
                        <strong className="text-[#1F313D]">{branch.monthlyOrders} / mo</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#EFE9DF]">
                        <span className="text-[10px] text-[#7A7268] block">Monthly Rev</span>
                        <strong className="text-emerald-700">${branch.monthlyRevenue.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action Links */}
                  <div className="pt-3 mt-3 border-t border-[#DDD5C7]/70 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#7A7268]">
                      Est. {branch.establishedDate}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBranchId(branch.id);
                          setActiveSubTab('hours');
                        }}
                        className="text-[#79415A] font-bold hover:underline"
                      >
                        Operating Hours →
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBranchId(branch.id);
                          setActiveSubTab('menu');
                        }}
                        className="text-[#82401D] font-bold hover:underline"
                      >
                        Menu Pricing →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: OPERATING HOURS & SCHEDULE ── */}
      {activeSubTab === 'hours' && selectedBranch && (
        <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                Weekly Operating Hours: {selectedBranch.name}
              </h3>
              <p className="text-xs text-[#7A7268]">
                Set opening, closing and shift timings for each day of the week. Unchecked days are marked closed for table bookings &amp; online orders.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#7A7268] font-medium">Quick Presets:</span>
              <button
                onClick={() => applyHoursPreset('standard')}
                className="px-3 py-1 rounded-xl bg-[#EFE9DF] hover:bg-white text-[#1F313D] font-bold transition border border-[#DDD5C7]"
              >
                Standard (8am - 11pm)
              </button>
              <button
                onClick={() => applyHoursPreset('weekend_extended')}
                className="px-3 py-1 rounded-xl bg-[#EFE9DF] hover:bg-white text-[#1F313D] font-bold transition border border-[#DDD5C7]"
              >
                Weekend Late (Fri-Sun 1am)
              </button>
              <button
                onClick={() => applyHoursPreset('always_open')}
                className="px-3 py-1 rounded-xl bg-[#EFE9DF] hover:bg-white text-[#1F313D] font-bold transition border border-[#DDD5C7]"
              >
                24 Hours Continuous
              </button>
            </div>
          </div>

          {/* Days Table */}
          <div className="divide-y divide-[#DDD5C7]/70 border border-[#DDD5C7] rounded-2xl overflow-hidden bg-white">
            {selectedBranch.operatingHours.map(day => (
              <div key={day.day} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-[#FAF7F2] transition">
                <div className="w-32 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`check-${day.day}`}
                    checked={day.isOpen}
                    onChange={(e) => handleHourChange(day.day, 'isOpen', e.target.checked)}
                    className="w-4 h-4 rounded text-[#79415A] accent-[#79415A] cursor-pointer"
                  />
                  <label htmlFor={`check-${day.day}`} className={`text-xs font-bold cursor-pointer ${day.isOpen ? 'text-[#1F313D]' : 'text-[#7A7268] line-through'}`}>
                    {day.day}
                  </label>
                </div>

                {day.isOpen ? (
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-[#7A7268]">Open:</span>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => handleHourChange(day.day, 'openTime', e.target.value)}
                        className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-2.5 py-1 text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <span>to</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#7A7268]">Close:</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => handleHourChange(day.day, 'closeTime', e.target.value)}
                        className="bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-2.5 py-1 text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
                      Open for dine-in &amp; delivery
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-rose-600 bg-rose-50 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5">
                    <CalendarX className="w-3.5 h-3.5" /> Outlet Closed (No orders accepted)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: BRANCH HOLIDAYS & SPECIAL CLOSURES ── */}
      {activeSubTab === 'holidays' && selectedBranch && (
        <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                Special Closures &amp; Holidays: {selectedBranch.name}
              </h3>
              <p className="text-xs text-[#7A7268]">
                Configure scheduled closures for festivals, deep cleaning, private events, or electrical maintenance.
              </p>
            </div>

            <button
              onClick={() => setIsHolidayModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#79415A] hover:bg-[#68334b] text-white rounded-full px-4 py-1.5 text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Branch Holiday</span>
            </button>
          </div>

          {selectedBranch.holidays && selectedBranch.holidays.length > 0 ? (
            <div className="space-y-3">
              {selectedBranch.holidays.map(hol => (
                <div key={hol.id} className="p-4 rounded-2xl bg-white border border-[#DDD5C7] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-[#EFE9DF] text-[#82401D]">
                      <CalendarX className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#1F313D]">{hol.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hol.isFullDayClosed ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {hol.isFullDayClosed ? 'Full Day Closed' : `Partial Hours: ${hol.partialOpenTime} - ${hol.partialCloseTime}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7A7268] mt-0.5">
                        Date: <strong className="text-[#1F313D]">{hol.date}</strong> {hol.notes && `· Note: "${hol.notes}"`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteHoliday(hol.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition"
                    title="Remove Holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-[#DDD5C7] text-xs text-[#7A7268]">
              No upcoming scheduled holidays configured for this branch.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: BRANCH-SPECIFIC MENU & CUSTOM PRICING ── */}
      {activeSubTab === 'menu' && selectedBranch && (
        <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                Branch Menu Catalog &amp; Custom Prices: {selectedBranch.name}
              </h3>
              <p className="text-xs text-[#7A7268]">
                Override standard menu prices to reflect outlet tier (e.g. airport markup, luxury harbourfront pricing) or toggle item availability.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#7A7268] font-medium">Standard Markup:</span>
              <button
                onClick={() => {
                  if (!selectedBranch) return;
                  const updated = selectedBranch.menuOverrides.map(m => ({
                    ...m,
                    branchPrice: Math.round(m.basePrice * 1.1 * 10) / 10,
                  }));
                  saveBranch({ ...selectedBranch, menuOverrides: updated });
                  setBranches(prev => prev.map(b => (b.id === selectedBranch.id ? { ...b, menuOverrides: updated } : b)));
                }}
                className="px-3 py-1 rounded-xl bg-[#EFE9DF] hover:bg-white text-[#1F313D] font-bold border border-[#DDD5C7]"
              >
                +10% Outlet Markup
              </button>
              <button
                onClick={() => {
                  if (!selectedBranch) return;
                  const updated = selectedBranch.menuOverrides.map(m => ({
                    ...m,
                    branchPrice: m.basePrice,
                  }));
                  saveBranch({ ...selectedBranch, menuOverrides: updated });
                  setBranches(prev => prev.map(b => (b.id === selectedBranch.id ? { ...b, menuOverrides: updated } : b)));
                }}
                className="px-3 py-1 rounded-xl bg-[#EFE9DF] hover:bg-white text-[#1F313D] font-bold border border-[#DDD5C7]"
              >
                Reset to Base Prices
              </button>
            </div>
          </div>

          {/* Menu Items Table */}
          <div className="border border-[#DDD5C7] rounded-2xl overflow-hidden bg-white">
            <div className="p-3 bg-[#EFE9DF] border-b border-[#DDD5C7] grid grid-cols-12 text-xs font-bold text-[#5C5549]">
              <div className="col-span-5">Item Name &amp; Category</div>
              <div className="col-span-2 text-center">Base Price</div>
              <div className="col-span-3 text-center">Branch Override Price ($)</div>
              <div className="col-span-2 text-right">Availability</div>
            </div>

            <div className="divide-y divide-[#DDD5C7]/60">
              {selectedBranch.menuOverrides.map(item => (
                <div key={item.itemId} className="p-3.5 grid grid-cols-12 items-center text-xs hover:bg-[#FAF7F2] transition">
                  <div className="col-span-5 flex items-center gap-2.5">
                    <Coffee className="w-4 h-4 text-[#82401D]" />
                    <div>
                      <h4 className="font-bold text-[#1F313D]">{item.itemName}</h4>
                      <span className="text-[10px] text-[#7A7268]">{item.category}</span>
                    </div>
                  </div>

                  <div className="col-span-2 text-center font-mono font-semibold text-[#7A7268]">
                    ${item.basePrice.toFixed(2)}
                  </div>

                  <div className="col-span-3 flex items-center justify-center gap-2">
                    <span className="text-[#7A7268]">$</span>
                    <input
                      type="number"
                      step="0.5"
                      value={item.branchPrice}
                      onChange={(e) => handleMenuPriceChange(item.itemId, Number(e.target.value))}
                      className="w-24 bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-2.5 py-1 font-mono font-bold text-center text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    />
                    {item.branchPrice !== item.basePrice && (
                      <span className="text-[10px] text-emerald-700 font-bold">
                        {item.branchPrice > item.basePrice ? `+$${(item.branchPrice - item.basePrice).toFixed(1)}` : `-$${(item.basePrice - item.branchPrice).toFixed(1)}`}
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => handleMenuAvailabilityToggle(item.itemId, item.isAvailable)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                        item.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      {item.isAvailable ? 'Serving' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: STAFF ASSIGNMENTS ── */}
      {activeSubTab === 'staff' && selectedBranch && (
        <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                Assigned Employees Roster: {selectedBranch.name}
              </h3>
              <p className="text-xs text-[#7A7268]">
                Staff allocated to this branch. Users assigned here are authorized to view and service this outlet.
              </p>
            </div>

            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#79415A] hover:bg-[#68334b] text-white rounded-full px-4 py-1.5 text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Assign Employee</span>
            </button>
          </div>

          {selectedBranch.assignedStaff && selectedBranch.assignedStaff.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedBranch.assignedStaff.map(staff => (
                <div key={staff.id} className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#1F313D] text-[#E5C9B3] font-bold text-xs flex items-center justify-center">
                        {staff.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1F313D]">{staff.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          {staff.role}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStaff(staff.id)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="De-assign Staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 text-[11px] text-[#5C5549] pt-1 border-t border-[#DDD5C7]/60">
                    <div><Mail className="w-3 h-3 inline mr-1 text-[#7A7268]" />{staff.email}</div>
                    <div><Phone className="w-3 h-3 inline mr-1 text-[#7A7268]" />{staff.phone}</div>
                    <div><Clock className="w-3 h-3 inline mr-1 text-[#7A7268]" />{staff.shiftTiming}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-[#DDD5C7] text-xs text-[#7A7268]">
              No employees assigned to this branch yet. Click '+ Assign Employee' above.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 6: BRANCH-WISE SALES & CUSTOMER REPORTS ── */}
      {activeSubTab === 'reports' && (
        <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                Branch-Wise Sales, Revenue &amp; Customer Footfall Reports
              </h3>
              <p className="text-xs text-[#7A7268]">
                Cross-outlet performance rollup, order volume distribution and average ticket sizes
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-[#79415A] text-white rounded-full px-4 py-1.5 text-xs font-bold hover:bg-[#68334b] transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Detailed CSV</span>
            </button>
          </div>

          {/* Comparative Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7]">
              <span className="text-xs text-[#7A7268] block">Top Earning Branch</span>
              <div className="text-lg font-bold text-[#1F313D] mt-1">Downtown Flagship #01</div>
              <span className="text-xs text-emerald-700 font-bold">$38,450 / month</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7]">
              <span className="text-xs text-[#7A7268] block">Highest AOV Branch</span>
              <div className="text-lg font-bold text-[#1F313D] mt-1">Waterfront Terrace #03</div>
              <span className="text-xs text-emerald-700 font-bold">$48.20 avg ticket</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7]">
              <span className="text-xs text-[#7A7268] block">Highest Customer Footfall</span>
              <div className="text-lg font-bold text-[#1F313D] mt-1">Downtown Flagship #01</div>
              <span className="text-xs text-[#79415A] font-bold">590 unique diners</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7]">
              <span className="text-xs text-[#7A7268] block">Consolidated Outlets Turnover</span>
              <div className="text-lg font-bold text-[#1F313D] mt-1">
                ${branches.reduce((sum, b) => sum + b.monthlyRevenue, 0).toLocaleString()}
              </div>
              <span className="text-xs text-[#82401D] font-bold">Across 4 active outlets</span>
            </div>
          </div>

          {/* Reports Table */}
          <div className="border border-[#DDD5C7] rounded-2xl overflow-hidden bg-white">
            <div className="p-3 bg-[#EFE9DF] border-b border-[#DDD5C7] grid grid-cols-12 text-xs font-bold text-[#5C5549]">
              <div className="col-span-3">Branch Details</div>
              <div className="col-span-2 text-center">Monthly Revenue</div>
              <div className="col-span-2 text-center">Orders &amp; Footfall</div>
              <div className="col-span-2 text-center">Avg Order Value</div>
              <div className="col-span-3 text-right">Order Channel Share</div>
            </div>

            <div className="divide-y divide-[#DDD5C7]/60">
              {reports.map(rep => (
                <div key={rep.branchId} className="p-4 grid grid-cols-12 items-center text-xs hover:bg-[#FAF7F2] transition">
                  <div className="col-span-3">
                    <h4 className="font-bold text-[#1F313D]">{rep.branchName}</h4>
                    <span className="text-[10px] text-[#7A7268]">Bestseller: {rep.topSellingItem}</span>
                  </div>

                  <div className="col-span-2 text-center">
                    <div className="text-sm font-black text-emerald-700">${rep.totalRevenue.toLocaleString()}</div>
                    <span className="text-[10px] text-[#7A7268]">Net POS gross</span>
                  </div>

                  <div className="col-span-2 text-center">
                    <div className="font-bold text-[#1F313D]">{rep.totalOrders} orders</div>
                    <span className="text-[10px] text-[#79415A] font-semibold">{rep.uniqueCustomers} unique patrons</span>
                  </div>

                  <div className="col-span-2 text-center">
                    <div className="font-bold text-[#1F313D]">${rep.avgOrderValue.toFixed(2)}</div>
                    <span className="text-[10px] text-emerald-700">+6.2% vs target</span>
                  </div>

                  <div className="col-span-3 text-right space-y-1">
                    <div className="flex justify-end gap-2 text-[10px] font-bold">
                      <span className="text-[#1F313D]">Dine-In {rep.dineInSharePercent}%</span>
                      <span className="text-[#79415A]">Delivery {rep.deliverySharePercent}%</span>
                      <span className="text-[#82401D]">Takeaway {rep.takeawaySharePercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#EFE9DF] rounded-full overflow-hidden flex ml-auto max-w-[160px]">
                      <div style={{ width: `${rep.dineInSharePercent}%` }} className="bg-[#1F313D] h-full" />
                      <div style={{ width: `${rep.deliverySharePercent}%` }} className="bg-[#79415A] h-full" />
                      <div style={{ width: `${rep.takeawaySharePercent}%` }} className="bg-[#82401D] h-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: BRANCH AUTHORIZATION & DATA RESTRICTIONS ── */}
      {activeSubTab === 'access' && (
        <div className="bg-[#FAF7F2] rounded-[28px] p-6 border border-[#E5DDD2] shadow-xs space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                Branch User Authorization &amp; Data Isolation Policies
              </h3>
              <p className="text-xs text-[#7A7268]">
                Strict security boundary ensuring restaurant staff and outlet managers only see their permitted branch data.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-[#DDD5C7] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F313D]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Super Admin &amp; General Manager</span>
              </div>
              <p className="text-xs text-[#5C5549] leading-relaxed">
                Full enterprise clearance. Can create, edit, audit, activate/deactivate, and view all branches and consolidated analytics.
              </p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Unrestricted Global Access
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#DDD5C7] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F313D]">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Branch Manager</span>
              </div>
              <p className="text-xs text-[#5C5549] leading-relaxed">
                Scoped strictly to their assigned outlet. Can manage operating hours, review staff shifts, and process local table bookings.
              </p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                Scoped to Single Assigned Branch
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#DDD5C7] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F313D]">
                <Lock className="w-4 h-4 text-rose-600" />
                <span>Floor Staff &amp; Terminal Cashier</span>
              </div>
              <p className="text-xs text-[#5C5549] leading-relaxed">
                Terminal restricted. Cashiers and waitstaff cannot view other branch financials, customer databases, or order histories.
              </p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                Strict POS Terminal Lockdown
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT BRANCH MODAL ── */}
      {isEditModalOpen && editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#DDD5C7] bg-[#EFE9DF] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                  {editingBranch.id ? 'Edit Branch Information' : 'Register New Restaurant Branch'}
                </h3>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Store branch details, address, contact numbers, email, and designated manager
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] flex items-center justify-center text-[#5C5549] hover:text-[#1F313D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Row 1: Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#5C5549] font-bold mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.code || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DF-01"
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 font-mono font-bold text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[#5C5549] font-bold mb-1">Branch Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.name || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    placeholder="e.g. Downtown Flagship #01"
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 font-bold text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>
              </div>

              {/* Row 2: Physical Address, City, State, Pincode */}
              <div>
                <label className="block text-[#5C5549] font-bold mb-1">Physical Street Address</label>
                <input
                  type="text"
                  required
                  value={editingBranch.address || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  placeholder="e.g. 42 Heritage Boulevard, Central Commercial Square"
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#5C5549] font-bold mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.city || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>
                <div>
                  <label className="block text-[#5C5549] font-bold mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.state || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>
                <div>
                  <label className="block text-[#5C5549] font-bold mb-1">Pincode / Postal Code</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.pincode || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, pincode: e.target.value })}
                    placeholder="e.g. 400001"
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>
              </div>

              {/* Row 3: Contact Phone & Official Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5C5549] font-bold mb-1">Branch Telephone / Contact Number</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.phone || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    placeholder="e.g. +91 22 2490 8820"
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>
                <div>
                  <label className="block text-[#5C5549] font-bold mb-1">Branch Official Email</label>
                  <input
                    type="email"
                    required
                    value={editingBranch.email || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, email: e.target.value })}
                    placeholder="e.g. downtown@cafescorner.com"
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>
              </div>

              {/* Row 4: Designated Branch Manager Details */}
              <div className="bg-[#EFE9DF] p-3.5 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-[#82401D] uppercase tracking-wider block">
                  Designated Branch Manager Information
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#5C5549] font-medium mb-1">Manager Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingBranch.managerName || ''}
                      onChange={(e) => setEditingBranch({ ...editingBranch, managerName: e.target.value })}
                      placeholder="e.g. George Daniel"
                      className="w-full bg-white border border-[#DDD5C7] rounded-xl px-3 py-1.5 text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#5C5549] font-medium mb-1">Manager Email</label>
                    <input
                      type="email"
                      required
                      value={editingBranch.managerEmail || ''}
                      onChange={(e) => setEditingBranch({ ...editingBranch, managerEmail: e.target.value })}
                      placeholder="e.g. george.d@cafescorner.com"
                      className="w-full bg-white border border-[#DDD5C7] rounded-xl px-3 py-1.5 text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#5C5549] font-medium mb-1">Manager Phone</label>
                    <input
                      type="text"
                      required
                      value={editingBranch.managerPhone || ''}
                      onChange={(e) => setEditingBranch({ ...editingBranch, managerPhone: e.target.value })}
                      placeholder="e.g. +91 98200 44101"
                      className="w-full bg-white border border-[#DDD5C7] rounded-xl px-3 py-1.5 text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Seating Capacity & Active Status Toggle */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="w-1/2">
                  <label className="block text-[#5C5549] font-bold mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    min="10"
                    value={editingBranch.seatingCapacity || 60}
                    onChange={(e) => setEditingBranch({ ...editingBranch, seatingCapacity: Number(e.target.value) })}
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="branch-status-toggle"
                    checked={editingBranch.isActive ?? true}
                    onChange={(e) => setEditingBranch({ ...editingBranch, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#79415A] accent-[#79415A] cursor-pointer"
                  />
                  <label htmlFor="branch-status-toggle" className="font-bold text-[#1F313D] cursor-pointer">
                    Branch Is Active &amp; Accepting Orders
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#DDD5C7] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] font-bold hover:bg-[#EFE9DF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#79415A] text-white font-bold hover:bg-[#68334b] transition shadow-xs"
                >
                  Save Branch Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD HOLIDAY MODAL ── */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-[#DDD5C7] bg-[#EFE9DF] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">Add Branch Closure Date</h3>
              <button onClick={() => setIsHolidayModalOpen(false)}><X className="w-4 h-4 text-[#7A7268]" /></button>
            </div>
            <form onSubmit={handleAddHoliday} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#5C5549]">Holiday / Closure Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Deep Clean, Annual Renovation"
                  value={newHoliday.name || ''}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#5C5549]">Closure Date</label>
                <input
                  type="date"
                  required
                  value={newHoliday.date || ''}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="full-day-closed"
                  checked={newHoliday.isFullDayClosed}
                  onChange={(e) => setNewHoliday({ ...newHoliday, isFullDayClosed: e.target.checked })}
                  className="w-4 h-4 text-[#79415A] accent-[#79415A]"
                />
                <label htmlFor="full-day-closed" className="font-bold text-[#1F313D] cursor-pointer">
                  Full Day Closed (No table reservations)
                </label>
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#5C5549]">Special Note for Diners</label>
                <input
                  type="text"
                  placeholder="e.g. Resuming normal service tomorrow at 08:00 AM"
                  value={newHoliday.notes || ''}
                  onChange={(e) => setNewHoliday({ ...newHoliday, notes: e.target.value })}
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none"
                />
              </div>
              <div className="pt-3 border-t border-[#DDD5C7] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#DDD5C7] font-bold text-[#5C5549]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#79415A] text-white font-bold hover:bg-[#68334b]"
                >
                  Confirm Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ASSIGN STAFF MODAL ── */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-[#DDD5C7] bg-[#EFE9DF] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#1F313D]">Assign Staff to {selectedBranch?.name}</h3>
              <button onClick={() => setIsStaffModalOpen(false)}><X className="w-4 h-4 text-[#7A7268]" /></button>
            </div>
            <form onSubmit={handleAddStaff} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#5C5549]">Employee Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sneha Roy"
                  value={newStaff.name || ''}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#5C5549]">Outlet Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                  className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 font-bold text-[#1F313D] focus:outline-none cursor-pointer"
                >
                  <option value="Head Chef">Head Chef</option>
                  <option value="Sous Chef">Sous Chef</option>
                  <option value="Senior Barista">Senior Barista</option>
                  <option value="Floor Host">Floor Host / Hostess</option>
                  <option value="Cashier">Terminal Cashier</option>
                  <option value="Server">Service Waitstaff</option>
                  <option value="Branch Manager">Assistant Branch Manager</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1 text-[#5C5549]">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={newStaff.phone || ''}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#5C5549]">Shift Timing</label>
                  <input
                    type="text"
                    placeholder="Morning (07:30 - 16:30)"
                    value={newStaff.shiftTiming || ''}
                    onChange={(e) => setNewStaff({ ...newStaff, shiftTiming: e.target.value })}
                    className="w-full bg-[#EFE9DF] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1F313D] focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-[#DDD5C7] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#DDD5C7] font-bold text-[#5C5549]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#79415A] text-white font-bold hover:bg-[#68334b]"
                >
                  Assign to Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagementView;
