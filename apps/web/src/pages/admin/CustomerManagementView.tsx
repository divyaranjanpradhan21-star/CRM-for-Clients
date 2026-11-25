import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Crown,
  Heart,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Utensils,
  AlertCircle,
  Receipt,
  Eye,
  X,
  Cake,
  RefreshCw,
  Merge,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  History,
  FileSpreadsheet
} from 'lucide-react';
import {
  CustomerProfile,
  CustomerCategory,
  CustomerStatus,
  LoyaltyTier,
  CustomerFilterOptions,
  DuplicateGroup,
  fetchCustomers,
  saveCustomer,
  toggleCustomerStatus,
  deleteCustomer,
  mergeCustomerProfiles,
  archiveCustomer,
  unarchiveCustomer,
  anonymizeCustomerProfile,
  findDuplicateCustomers,
  ingestCustomersFromTransactions,
  generateCustomerId,
  importCustomersFromCSV,
  exportCustomersToCSV
} from '../../lib/customerManagementApi';

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Jain Option Required',
  'Halal',
  'Kosher',
  'Pescatarian',
  'Keto / Low-Carb',
  'Organic Only',
  'Dairy-Free',
  'Gluten-Free',
];

const ALLERGY_OPTIONS = [
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Gluten / Celiac',
  'Lactose Intolerant',
  'Soy',
  'Eggs',
  'Sesame',
  'No Onion / No Garlic',
  'Mushroom',
];

export const CustomerManagementView: React.FC<{ orgId?: string }> = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CustomerCategory | 'ALL'>('ALL');
  const [loyaltyFilter, setLoyaltyFilter] = useState<LoyaltyTier | 'ALL'>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [activityFilter, setActivityFilter] = useState<CustomerFilterOptions['activityRange']>('ALL');
  const [dietaryFilter, setDietaryFilter] = useState<string>('ALL');
  const [allergyFilter, setAllergyFilter] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Sorting & Pagination state
  const [sortBy, setSortBy] = useState<'name' | 'spend' | 'visits' | 'date' | 'lastVisit'>('spend');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Selection & Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'orders' | 'reservations' | 'activity' | 'loyalty' | 'comms'>('profile');

  // Add / Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<CustomerProfile> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Delete Confirmation Modal State
  const [deleteConfirmCustomer, setDeleteConfirmCustomer] = useState<CustomerProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Import CSV Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importCsvText, setImportCsvText] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Duplicate Merge Modal State
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedDupGroup, setSelectedDupGroup] = useState<DuplicateGroup | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);
  const [mergePrimaryId, setMergePrimaryId] = useState<string>('');
  const [isMerging, setIsMerging] = useState<boolean>(false);

  // Privacy & Anonymize Modal
  const [privacyModalCustomer, setPrivacyModalCustomer] = useState<CustomerProfile | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
      const dupes = findDuplicateCustomers(data);
      setDuplicateGroups(dupes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Unique cities list for filter
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.address?.city?.trim()) set.add(c.address.city.trim());
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtered and Sorted Customers
  const processedCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        if (!showArchived && c.isArchived) return false;
        if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
        if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
        if (loyaltyFilter !== 'ALL' && c.loyaltyTier !== loyaltyFilter) return false;
        if (cityFilter !== 'ALL' && c.address?.city?.toLowerCase() !== cityFilter.toLowerCase()) return false;
        if (dietaryFilter !== 'ALL' && !c.dietaryPreferences.includes(dietaryFilter)) return false;
        if (allergyFilter !== 'ALL' && !c.foodAllergies.includes(allergyFilter)) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = c.fullName.toLowerCase().includes(q);
          const matchEmail = c.email.toLowerCase().includes(q);
          const matchPhone = c.mobile.includes(q) || (c.alternateMobile && c.alternateMobile.includes(q));
          const matchId = c.id.toLowerCase().includes(q);
          const matchNotes = c.customerNotes?.toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchPhone && !matchId && !matchNotes) return false;
        }

        if (activityFilter === 'active_30') {
          if (!c.lastVisitDate) return false;
          const days = (Date.now() - new Date(c.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24);
          if (days > 30) return false;
        } else if (activityFilter === 'active_90') {
          if (!c.lastVisitDate) return false;
          const days = (Date.now() - new Date(c.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24);
          if (days > 90) return false;
        } else if (activityFilter === 'inactive_90') {
          if (!c.lastVisitDate) return true;
          const days = (Date.now() - new Date(c.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24);
          if (days <= 90) return false;
        } else if (activityFilter === 'never_ordered') {
          if (c.totalOrders > 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') {
          diff = a.fullName.localeCompare(b.fullName);
        } else if (sortBy === 'spend') {
          diff = (a.totalSpend || 0) - (b.totalSpend || 0);
        } else if (sortBy === 'visits') {
          diff = (a.totalVisits || 0) - (b.totalVisits || 0);
        } else if (sortBy === 'date') {
          diff = new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
        } else if (sortBy === 'lastVisit') {
          const tA = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : 0;
          const tB = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : 0;
          diff = tA - tB;
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [
    customers,
    showArchived,
    statusFilter,
    categoryFilter,
    loyaltyFilter,
    cityFilter,
    dietaryFilter,
    allergyFilter,
    searchQuery,
    activityFilter,
    sortBy,
    sortOrder,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(processedCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedCustomers.slice(start, start + pageSize);
  }, [processedCustomers, currentPage, pageSize]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === 'Active' && !c.isArchived).length;
    const inactive = customers.filter((c) => c.status === 'Inactive' || c.isArchived).length;
    const vips = customers.filter((c) => c.category === 'VIP').length;
    const totalLTV = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
    return { total, active, inactive, vips, totalLTV };
  }, [customers]);

  // Quick Status Toggle
  const handleToggleStatus = async (cust: CustomerProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await toggleCustomerStatus(cust.id);
    if (ok) {
      showToast(`Customer #${cust.id} status updated`);
      loadData();
      if (selectedCustomer?.id === cust.id) {
        setSelectedCustomer((prev) => (prev ? { ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' } : null));
      }
    } else {
      showToast('Failed to toggle customer status', 'error');
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!deleteConfirmCustomer) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteCustomer(deleteConfirmCustomer.id);
      if (res.success) {
        showToast(`Customer #${deleteConfirmCustomer.id} deleted successfully`);
        setDeleteConfirmCustomer(null);
        if (selectedCustomer?.id === deleteConfirmCustomer.id) {
          setSelectedCustomer(null);
        }
        loadData();
      } else {
        setDeleteError(res.error || 'Deletion blocked by active dependency.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Save Customer (Add / Edit)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.fullName || !editingCustomer.mobile) {
      showToast('Full Name and Mobile Number are required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveCustomer(editingCustomer);
      if (res.success) {
        showToast(editingCustomer.id && customers.some((c) => c.id === editingCustomer.id) ? 'Customer updated successfully' : 'Customer created successfully');
        setIsEditModalOpen(false);
        setEditingCustomer(null);
        loadData();
      } else {
        showToast(res.error || 'Failed to save customer', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Import CSV
  const handleImportCSV = async () => {
    if (!importCsvText.trim()) {
      showToast('Please paste valid CSV data', 'error');
      return;
    }
    setIsImporting(true);
    try {
      const res = await importCustomersFromCSV(importCsvText);
      if (res.success) {
        showToast(`Imported ${res.importedCount} customer(s) successfully.`);
        setIsImportModalOpen(false);
        setImportCsvText('');
        loadData();
      } else {
        showToast(res.errors?.join(', ') || 'Failed to import customers', 'error');
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Merge Records
  const handleMergeRecords = async () => {
    if (!selectedDupGroup || !mergePrimaryId) return;
    const duplicate = selectedDupGroup.customers.find((c) => c.id !== mergePrimaryId);
    if (!duplicate) return;

    setIsMerging(true);
    const res = await mergeCustomerProfiles(mergePrimaryId, duplicate.id, 'Restaurant Admin');
    setIsMerging(false);

    if (res.success) {
      showToast(`Merged duplicate profile #${duplicate.id} into #${mergePrimaryId}`);
      setIsMergeModalOpen(false);
      setSelectedDupGroup(null);
      loadData();
    } else {
      showToast(res.error || 'Merge failed', 'error');
    }
  };

  // Anonymization
  const handleConfirmAnonymize = async () => {
    if (!privacyModalCustomer) return;
    const ok = await anonymizeCustomerProfile(privacyModalCustomer.id);
    if (ok) {
      showToast(`Patron #${privacyModalCustomer.id} personal PII anonymized under compliance rules.`);
      setPrivacyModalCustomer(null);
      if (selectedCustomer?.id === privacyModalCustomer.id) setSelectedCustomer(null);
      loadData();
    } else {
      showToast('Anonymization failed', 'error');
    }
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

      {/* Top Hero & KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C7] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#7A7268] font-medium">
            <span>Total Customers</span>
            <Users className="w-4 h-4 text-[#79415A]" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#1F313D] mt-2">{stats.total}</div>
          <div className="text-[11px] text-[#79415A] font-semibold mt-0.5">Centralized Directory</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C7] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#7A7268] font-medium">
            <span>Active Customers</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-700 mt-2">{stats.active}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Ready for Engagement</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C7] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#7A7268] font-medium">
            <span>Inactive Customers</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#82401D] mt-2">{stats.inactive}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">Dormant / Archived</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C7] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#7A7268] font-medium">
            <span>VIP Dining Circle</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#1F313D] mt-2">{stats.vips}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">High LTV Connoisseurs</div>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-[#1F313D] text-white shadow-md">
          <div className="flex items-center justify-between text-xs text-[#E5C9B3] font-medium">
            <span>Cumulative Spend (LTV)</span>
            <Receipt className="w-4 h-4 text-[#E5C9B3]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">${stats.totalLTV.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">Across All Registered Guests</div>
        </div>
      </div>

      {/* Action Toolbar & Filters */}
      <div className="p-5 rounded-[24px] bg-[#FAF7F2] border border-[#DDD5C7] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#7A7268] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, mobile, email, customer ID, or notes..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A]"
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {duplicateGroups.length > 0 && (
              <button
                onClick={() => {
                  setSelectedDupGroup(duplicateGroups[0]);
                  setMergePrimaryId(duplicateGroups[0].customers[0].id);
                  setIsMergeModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-500/20 transition animate-pulse"
              >
                <Merge className="w-3.5 h-3.5 text-amber-700" />
                <span>{duplicateGroups.length} Duplicate Group(s)</span>
              </button>
            )}

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-[#1F313D] text-xs font-bold hover:bg-[#EAE4D9] transition"
            >
              <Upload className="w-3.5 h-3.5 text-[#059669]" />
              <span className="hidden sm:inline">Import CSV</span>
            </button>

            <button
              onClick={() => {
                exportCustomersToCSV(customers);
                showToast('Customer directory exported to CSV');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-[#1F313D] text-xs font-bold hover:bg-[#EAE4D9] transition"
            >
              <Download className="w-3.5 h-3.5 text-[#79415A]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={async () => {
                const res = await ingestCustomersFromTransactions();
                showToast(`Auto-registered ${res.ingestedCount} new patrons from bookings`);
                loadData();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-[#1F313D] text-xs font-bold hover:bg-[#EAE4D9] transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#82401D]" />
              <span className="hidden sm:inline">Auto-Register Bookings</span>
            </button>

            <button
              onClick={() => {
                setEditingCustomer({
                  id: generateCustomerId(),
                  fullName: '',
                  email: '',
                  mobile: '',
                  alternateMobile: '',
                  gender: 'Prefer not to say',
                  status: 'Active',
                  customerNotes: '',
                  preferredFoodItems: [],
                  address: { street: '', city: 'Mumbai', state: 'Maharashtra', postalCode: '', country: 'India' },
                  dietaryPreferences: [],
                  foodAllergies: [],
                  category: 'NEW',
                  loyaltyTier: 'Bronze',
                  loyaltyPoints: 0,
                  totalSpend: 0,
                  totalOrders: 0,
                  totalVisits: 0,
                  consent: { marketingSms: true, marketingEmail: true, whatsappUpdates: true, dataSharingConsent: true, consentTimestamp: new Date().toISOString() },
                });
                setIsEditModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#DDD5C7]/70 text-xs">
          <span className="text-[11px] font-bold text-[#7A7268] flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#79415A]" /> Filters:
          </span>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="VIP">VIP Diners</option>
            <option value="REGULAR">Regular Patrons</option>
            <option value="NEW">New Diners</option>
            <option value="INACTIVE">Inactive Guests</option>
          </select>

          {/* Loyalty Tier Filter */}
          <select
            value={loyaltyFilter}
            onChange={(e) => {
              setLoyaltyFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] focus:outline-none"
          >
            <option value="ALL">All Tiers</option>
            <option value="Platinum">Platinum Tier</option>
            <option value="Gold">Gold Tier</option>
            <option value="Silver">Silver Tier</option>
            <option value="Bronze">Bronze Tier</option>
          </select>

          {/* City / Location Filter */}
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] focus:outline-none"
          >
            <option value="ALL">All Locations (Cities)</option>
            {uniqueCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort By Field */}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[11px] text-[#7A7268] font-bold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] focus:outline-none"
            >
              <option value="spend">Total Spend</option>
              <option value="name">Customer Name</option>
              <option value="visits">Total Visits</option>
              <option value="date">Registration Date</option>
              <option value="lastVisit">Last Visit Date</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              title={`Sorting ${sortOrder.toUpperCase()}`}
              className="p-1 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-[#1F313D]"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#DDD5C7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#79415A]" />
            <h2 className="text-sm font-bold text-[#1F313D]">
              Customer Directory ({processedCustomers.length} records found)
            </h2>
          </div>
          <span className="text-[11px] text-[#7A7268]">Click any patron row to view detailed profile</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-[#7A7268]">
            <div className="w-6 h-6 border-2 border-[#79415A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading centralized patron database...
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#7A7268] space-y-3">
            <Users className="w-8 h-8 text-[#DDD5C7] mx-auto" />
            <p className="font-semibold">No customers found matching the filter criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setLoyaltyFilter('ALL');
                setCityFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-xs text-[#79415A] underline font-bold"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EFE9DF] text-[#5C5549] font-mono uppercase tracking-wider text-[10px] border-b border-[#DDD5C7]">
                <tr>
                  <th className="py-3 px-4">Customer ID & Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Status & Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Spend & Orders</th>
                  <th className="py-3 px-4">Last Visit</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD5C7]">
                {paginatedCustomers.map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;
                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className={`hover:bg-[#EFE9DF]/60 transition cursor-pointer ${
                        isSelected ? 'bg-[#EFE9DF] ring-1 ring-[#79415A]/30' : ''
                      } ${cust.status === 'Inactive' ? 'opacity-70 bg-amber-50/30' : ''}`}
                    >
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              cust.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.fullName)}&background=79415A&color=fff&size=100`
                            }
                            alt={cust.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-[#DDD5C7] shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#1F313D]">{cust.fullName}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  cust.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {cust.status}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#82401D]">{cust.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <div className="flex items-center gap-1 text-[#1F313D] font-medium">
                          <Phone className="w-3 h-3 text-[#79415A]" />
                          <span>{cust.mobile || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#7A7268] mt-0.5 truncate max-w-[180px]">
                          <Mail className="w-3 h-3 text-[#7A7268]" />
                          <span className="truncate">{cust.email || '—'}</span>
                        </div>
                      </td>

                      {/* Status & Category */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cust.category === 'VIP'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : cust.category === 'REGULAR'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : cust.category === 'NEW'
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {cust.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F313D] text-[#E5C9B3]">
                            {cust.loyaltyTier}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-[11px] text-[#5C5549]">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#7A7268]" />
                          <span>{cust.address?.city || 'Unspecified'}</span>
                        </div>
                      </td>

                      {/* Spend & Orders */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-[#1F313D] font-mono">${(cust.totalSpend || 0).toFixed(2)}</div>
                        <div className="text-[10px] text-[#7A7268]">{cust.totalOrders || cust.totalVisits || 0} orders &bull; AOV: ${cust.averageOrderValue?.toFixed(0) || '0'}</div>
                      </td>

                      {/* Last Visit */}
                      <td className="py-3.5 px-4 text-[11px] text-[#5C5549]">
                        <div>{cust.lastVisitDate ? new Date(cust.lastVisitDate).toLocaleDateString() : 'Never'}</div>
                        <div className="text-[10px] text-[#7A7268]">{cust.registeredSource || 'Dine-in'}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            title="View customer profile"
                            className="p-1.5 rounded-lg text-[#5C5549] hover:bg-[#DDD5C7] transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#1F313D]" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingCustomer(cust);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit customer details"
                            className="p-1.5 rounded-lg text-[#5C5549] hover:bg-[#DDD5C7] transition"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#79415A]" />
                          </button>
                          <button
                            onClick={(e) => handleToggleStatus(cust, e)}
                            title={cust.status === 'Active' ? 'Deactivate customer' : 'Activate customer'}
                            className="p-1.5 rounded-lg text-[#5C5549] hover:bg-[#DDD5C7] transition"
                          >
                            {cust.status === 'Active' ? (
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <UserX className="w-3.5 h-3.5 text-amber-600" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmCustomer(cust);
                              setDeleteError(null);
                            }}
                            title="Delete customer"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#DDD5C7] bg-[#FAF7F2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A7268]">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, processedCustomers.length)} of {processedCustomers.length} patrons
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg border border-[#DDD5C7] disabled:opacity-40 hover:bg-[#EFE9DF] text-[#1F313D]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-[#1F313D]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded-lg border border-[#DDD5C7] disabled:opacity-40 hover:bg-[#EFE9DF] text-[#1F313D]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Customer Complete Dossier Drawer / Card */}
      {selectedCustomer && (
        <div className="bg-[#FAF7F2] border-2 border-[#79415A]/30 rounded-[28px] p-6 sm:p-7 shadow-lg space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DDD5C7]">
            <div className="flex items-center gap-4">
              <img
                src={
                  selectedCustomer.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.fullName)}&background=79415A&color=fff&size=100`
                }
                alt={selectedCustomer.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#79415A]/30 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-serif font-bold text-[#1F313D]">{selectedCustomer.fullName}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      selectedCustomer.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {selectedCustomer.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#79415A] text-white">
                    {selectedCustomer.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#1F313D] text-[#E5C9B3]">
                    {selectedCustomer.loyaltyTier} Tier
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#7A7268] mt-1 font-mono">
                  <span>ID: {selectedCustomer.id}</span>
                  <span>&bull;</span>
                  <span>Registered: {new Date(selectedCustomer.registeredAt).toLocaleDateString()}</span>
                  <span>&bull;</span>
                  <span>Source: {selectedCustomer.registeredSource || 'Dine-in'}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleToggleStatus(selectedCustomer)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                  selectedCustomer.status === 'Active'
                    ? 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100'
                    : 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {selectedCustomer.status === 'Active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                <span>{selectedCustomer.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
              </button>

              <button
                onClick={() => {
                  setEditingCustomer(selectedCustomer);
                  setIsEditModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#79415A] text-white text-xs font-bold hover:bg-[#68334b]"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={() => {
                  setDeleteConfirmCustomer(selectedCustomer);
                  setDeleteError(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 text-xs font-semibold hover:bg-rose-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-full text-[#7A7268] hover:bg-[#DDD5C7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-[#DDD5C7]">
            {[
              { id: 'profile', label: 'Profile Details', icon: Utensils },
              { id: 'orders', label: `Order History (${selectedCustomer.orders.length})`, icon: Receipt },
              { id: 'reservations', label: `Reservations (${selectedCustomer.reservations.length})`, icon: Calendar },
              { id: 'activity', label: `Activity History (${(selectedCustomer.activityHistory || []).length})`, icon: History },
              { id: 'loyalty', label: `Loyalty Points (${selectedCustomer.loyaltyPoints} pts)`, icon: Crown },
              { id: 'comms', label: `Notes & Logs (${selectedCustomer.communications.length})`, icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeDetailTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    isActive ? 'bg-[#1F313D] text-white shadow-xs' : 'bg-[#EFE9DF] text-[#5C5549] hover:bg-[#EAE4D9]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Profile & Preferences */}
          {activeDetailTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Personal & Contact Details */}
              <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-3">
                <div className="font-bold text-[#1F313D] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#79415A]" />
                  <span>Personal & Contact Info</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div><span className="text-[#7A7268]">Mobile Number:</span> <strong className="text-[#1F313D]">{selectedCustomer.mobile}</strong></div>
                  <div><span className="text-[#7A7268]">Alternate Phone:</span> <strong className="text-[#1F313D]">{selectedCustomer.alternateMobile || 'None'}</strong></div>
                  <div><span className="text-[#7A7268]">Email:</span> <strong className="text-[#1F313D]">{selectedCustomer.email || 'None'}</strong></div>
                  <div><span className="text-[#7A7268]">Gender:</span> <strong className="text-[#1F313D]">{selectedCustomer.gender || 'Not specified'}</strong></div>
                  <div>
                    <span className="text-[#7A7268]">Complete Address:</span>
                    <div className="text-[#1F313D] mt-0.5">
                      {selectedCustomer.address.street ? (
                        `${selectedCustomer.address.street}, ${selectedCustomer.address.city}, ${selectedCustomer.address.state} ${selectedCustomer.address.postalCode}`
                      ) : (
                        <span className="italic text-[#7A7268]">No address on file</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DDD5C7] space-y-1 text-[11px]">
                  <div className="flex items-center gap-1">
                    <Cake className="w-3 h-3 text-[#82401D]" />
                    <span>Date of Birth: <strong>{selectedCustomer.dateOfBirth || 'Unspecified'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500" />
                    <span>Anniversary: <strong>{selectedCustomer.anniversary || 'Unspecified'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Culinary Preferences & Staff Notes */}
              <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-3">
                <div className="font-bold text-[#1F313D] flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#79415A]" />
                  <span>Preferences & Favorite Items</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7A7268] block mb-1">Preferred Food Items</span>
                  <div className="flex flex-wrap gap-1">
                    {(selectedCustomer.preferredFoodItems || []).map((food) => (
                      <span key={food} className="px-2 py-0.5 rounded-md bg-[#79415A]/10 text-[#79415A] font-semibold text-[10px] border border-[#79415A]/20">
                        {food}
                      </span>
                    ))}
                    {(!selectedCustomer.preferredFoodItems || selectedCustomer.preferredFoodItems.length === 0) && (
                      <span className="text-[#7A7268] italic">No favorite dishes logged yet</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7A7268] block mb-1">Dietary Tags & Allergies</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCustomer.dietaryPreferences.map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-semibold text-[10px]">
                        {d}
                      </span>
                    ))}
                    {selectedCustomer.foodAllergies.map((a) => (
                      <span key={a} className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold text-[10px] border border-rose-200">
                        ⚠ {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7A7268] block mb-1">Internal Staff Notes</span>
                  <p className="p-2 rounded-xl bg-white/70 text-[#1F313D] text-[11px] leading-relaxed">
                    {selectedCustomer.customerNotes || selectedCustomer.specialInstructions || 'No internal staff notes logged.'}
                  </p>
                </div>
              </div>

              {/* Metrics & Consent */}
              <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-3">
                <div className="font-bold text-[#1F313D] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Key Metrics & Consent</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Total Lifetime Spend:</span>
                    <strong className="text-[#1F313D] font-mono">${(selectedCustomer.totalSpend || 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Total Orders / Visits:</span>
                    <strong className="text-[#1F313D]">{selectedCustomer.totalOrders || selectedCustomer.totalVisits || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Average Order Value:</span>
                    <strong className="text-[#1F313D] font-mono">${(selectedCustomer.averageOrderValue || 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Last Visit Date:</span>
                    <strong className="text-[#1F313D]">{selectedCustomer.lastVisitDate ? new Date(selectedCustomer.lastVisitDate).toLocaleDateString() : 'Never'}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DDD5C7] space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span>SMS Marketing Consent:</span>
                    <span className={selectedCustomer.consent.marketingSms ? 'text-emerald-700 font-bold' : 'text-gray-500'}>
                      {selectedCustomer.consent.marketingSms ? 'Opted In' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email Consent:</span>
                    <span className={selectedCustomer.consent.marketingEmail ? 'text-emerald-700 font-bold' : 'text-gray-500'}>
                      {selectedCustomer.consent.marketingEmail ? 'Opted In' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Orders History */}
          {activeDetailTab === 'orders' && (
            <div className="space-y-3">
              {selectedCustomer.orders.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#7A7268]">No recorded dining orders for this customer yet.</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#DDD5C7]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] uppercase font-mono">
                      <tr>
                        <th className="p-3">Order Number</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Items Summary</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDD5C7]">
                      {selectedCustomer.orders.map((o) => (
                        <tr key={o.id} className="hover:bg-white/60">
                          <td className="p-3 font-mono font-bold text-[#82401D]">{o.orderNumber}</td>
                          <td className="p-3 text-[#5C5549]">{new Date(o.date).toLocaleDateString()}</td>
                          <td className="p-3">{o.orderType}</td>
                          <td className="p-3 font-medium text-[#1F313D] max-w-xs truncate">{o.itemsSummary}</td>
                          <td className="p-3 text-[#7A7268]">{o.paymentMethod}</td>
                          <td className="p-3 text-right font-mono font-bold">${o.totalAmount.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Reservations History */}
          {activeDetailTab === 'reservations' && (
            <div className="space-y-3">
              {selectedCustomer.reservations.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#7A7268]">No table reservations on record.</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#DDD5C7]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] uppercase font-mono">
                      <tr>
                        <th className="p-3">Booking Code</th>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Party Size</th>
                        <th className="p-3">Table</th>
                        <th className="p-3">Branch</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDD5C7]">
                      {selectedCustomer.reservations.map((r) => (
                        <tr key={r.id} className="hover:bg-white/60">
                          <td className="p-3 font-mono font-bold text-[#79415A]">{r.bookingCode}</td>
                          <td className="p-3 text-[#1F313D]">{r.date} at {r.time}</td>
                          <td className="p-3 font-medium">{r.partySize} Guests</td>
                          <td className="p-3 font-mono">{r.tableNumber}</td>
                          <td className="p-3 text-[#7A7268]">{r.branchName}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3 text-[#7A7268] italic text-[11px]">{r.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Activity History Timeline */}
          {activeDetailTab === 'activity' && (
            <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-4 text-xs">
              <h4 className="font-bold text-[#1F313D] flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#79415A]" /> Activity & Interaction Timeline
              </h4>
              {(!selectedCustomer.activityHistory || selectedCustomer.activityHistory.length === 0) ? (
                <div className="p-6 text-center text-[#7A7268]">No recorded activity events for this customer yet.</div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DDD5C7]">
                  {selectedCustomer.activityHistory.map((act) => (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#79415A] border-2 border-white"></div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1F313D]">{act.action}</span>
                        <span className="text-[10px] text-[#7A7268] font-mono">{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-[#5C5549] mt-0.5">{act.details}</p>
                      {act.performer && <span className="text-[10px] text-[#82401D] italic">By: {act.performer}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Loyalty Points */}
          {activeDetailTab === 'loyalty' && (
            <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#1F313D]">Loyalty Rewards Ledger</h4>
                  <p className="text-[#7A7268] text-[11px]">Current Tier: <strong>{selectedCustomer.loyaltyTier}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-[#79415A]">{selectedCustomer.loyaltyPoints}</span>
                  <span className="text-[10px] text-[#7A7268] block">Available Points</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Communications & Logs */}
          {activeDetailTab === 'comms' && (
            <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-3 text-xs">
              <h4 className="font-bold text-[#1F313D]">Logged Communications & Feedback</h4>
              {selectedCustomer.communications.length === 0 ? (
                <div className="p-4 text-center text-[#7A7268]">No messages or outreach logged.</div>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.communications.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-white/80 border border-[#DDD5C7] space-y-1">
                      <div className="flex items-center justify-between font-bold text-[#1F313D]">
                        <span>{c.type} &bull; {c.title}</span>
                        <span className="text-[10px] text-[#7A7268] font-mono">{new Date(c.sentAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[#5C5549] text-[11px]">{c.preview}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[28px] max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                  {editingCustomer.id && customers.some((c) => c.id === editingCustomer.id) ? 'Edit Customer Profile' : 'Add New Customer'}
                </h3>
                <span className="text-xs text-[#7A7268] font-mono">ID: {editingCustomer.id}</span>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full text-[#7A7268] hover:bg-[#DDD5C7]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.fullName || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, fullName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.mobile || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, mobile: e.target.value })}
                    placeholder="e.g. +91 98200 12345"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Alternate Mobile</label>
                  <input
                    type="text"
                    value={editingCustomer.alternateMobile || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, alternateMobile: e.target.value })}
                    placeholder="Optional secondary phone"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingCustomer.email || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    placeholder="e.g. guest@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Gender</label>
                  <select
                    value={editingCustomer.gender || 'Prefer not to say'}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Status</label>
                  <select
                    value={editingCustomer.status || 'Active'}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editingCustomer.dateOfBirth || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Anniversary Date</label>
                  <input
                    type="date"
                    value={editingCustomer.anniversary || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, anniversary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#DDD5C7]">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Street Address</label>
                  <input
                    type="text"
                    value={editingCustomer.address?.street || ''}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        address: { ...(editingCustomer.address || { city: '', state: '', postalCode: '', country: 'India' }), street: e.target.value },
                      })
                    }
                    placeholder="Apartment, Street address"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">City</label>
                  <input
                    type="text"
                    value={editingCustomer.address?.city || ''}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        address: { ...(editingCustomer.address || { street: '', state: '', postalCode: '', country: 'India' }), city: e.target.value },
                      })
                    }
                    placeholder="City"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">State</label>
                  <input
                    type="text"
                    value={editingCustomer.address?.state || ''}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        address: { ...(editingCustomer.address || { street: '', city: '', postalCode: '', country: 'India' }), state: e.target.value },
                      })
                    }
                    placeholder="State"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={editingCustomer.address?.postalCode || ''}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        address: { ...(editingCustomer.address || { street: '', city: '', state: '', country: 'India' }), postalCode: e.target.value },
                      })
                    }
                    placeholder="PIN / Zip"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes & Food items */}
              <div className="space-y-3 pt-2 border-t border-[#DDD5C7]">
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Customer & Floor Notes</label>
                  <textarea
                    rows={2}
                    value={editingCustomer.customerNotes || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, customerNotes: e.target.value })}
                    placeholder="Preferences, seating requests, VIP notes..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Preferred Food Items (comma-separated)</label>
                  <input
                    type="text"
                    value={(editingCustomer.preferredFoodItems || []).join(', ')}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        preferredFoodItems: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="e.g. Sourdough, Truffle Risotto, Espresso"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-[#DDD5C7]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] font-bold hover:bg-[#EFE9DF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white font-bold disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Modal with Dependency Check */}
      {deleteConfirmCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#1F313D]">Confirm Customer Deletion</h3>
                <p className="text-xs text-[#7A7268]">ID: {deleteConfirmCustomer.id}</p>
              </div>
            </div>

            <p className="text-xs text-[#5C5549] leading-relaxed">
              Are you sure you want to delete patron <strong>{deleteConfirmCustomer.fullName}</strong>?
              This action verifies that the customer has no active seated table reservations before deletion.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DDD5C7]">
              <button
                onClick={() => setDeleteConfirmCustomer(null)}
                className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] text-xs font-bold hover:bg-[#EFE9DF]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C7]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#059669]" />
                <h3 className="font-bold text-base text-[#1F313D]">Import Customers from CSV</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1 rounded-full text-[#7A7268] hover:bg-[#DDD5C7]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#7A7268] leading-relaxed">
              Paste CSV records below. Format: <code className="bg-gray-200 px-1 py-0.5 rounded font-mono text-[10px]">Full Name, Email, Mobile, City, Category</code>.
              Duplicate phone numbers and emails will be automatically prevented.
            </p>

            <textarea
              rows={6}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder="Alexander Wright, alex@example.com, +91 98200 88210, Mumbai, VIP&#10;Priya Sharma, priya@example.com, +91 98111 22334, Delhi, REGULAR"
              className="w-full p-3 rounded-xl bg-white border border-[#DDD5C7] font-mono text-xs text-[#1F313D] focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DDD5C7]">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] text-xs font-bold hover:bg-[#EFE9DF]"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCSV}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Import Customers'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Merge Modal */}
      {isMergeModalOpen && selectedDupGroup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C7]">
              <div className="flex items-center gap-2 text-amber-800">
                <Merge className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-base text-[#1F313D]">Duplicate Profile Merge</h3>
              </div>
              <button onClick={() => setIsMergeModalOpen(false)} className="p-1 rounded-full text-[#7A7268] hover:bg-[#DDD5C7]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5C5549]">
              Match detected by <strong>{selectedDupGroup.reason.toUpperCase()}</strong>: {selectedDupGroup.matchValue}.
              Select the primary customer profile to keep. All order history and reservations from the duplicate will be consolidated.
            </p>

            <div className="space-y-2">
              {selectedDupGroup.customers.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    mergePrimaryId === c.id ? 'bg-[#79415A]/10 border-[#79415A]' : 'bg-white border-[#DDD5C7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="primaryCust"
                      checked={mergePrimaryId === c.id}
                      onChange={() => setMergePrimaryId(c.id)}
                      className="accent-[#79415A]"
                    />
                    <div>
                      <div className="font-bold text-xs text-[#1F313D]">{c.fullName}</div>
                      <div className="text-[10px] text-[#7A7268] font-mono">ID: {c.id} &bull; {c.mobile}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#82401D]">${(c.totalSpend || 0).toFixed(0)}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DDD5C7]">
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] text-xs font-bold hover:bg-[#EFE9DF]"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeRecords}
                disabled={isMerging}
                className="px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold disabled:opacity-50"
              >
                {isMerging ? 'Merging...' : 'Merge Profiles'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerManagementView;
