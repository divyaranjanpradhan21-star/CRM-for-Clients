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
  AlertTriangle,
  CheckCircle2,
  Star,
  Award,
  Crown,
  Heart,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Utensils,
  AlertCircle,
  FileText,
  MessageSquare,
  Receipt,
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Merge,
  Eye,
  X,
  Cake,
  RefreshCw,
  SlidersHorizontal,
  Send,
  UserCheck,
  UserX,
  Lock,
  Compass
} from 'lucide-react';
import {
  CustomerProfile,
  CustomerCategory,
  LoyaltyTier,
  CustomerFilterOptions,
  DuplicateGroup,
  fetchCustomers,
  saveCustomer,
  mergeCustomerProfiles,
  archiveCustomer,
  unarchiveCustomer,
  anonymizeCustomerProfile,
  findDuplicateCustomers,
  ingestCustomersFromTransactions,
  generateCustomerId
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
  const [categoryFilter, setCategoryFilter] = useState<CustomerCategory | 'ALL'>('ALL');
  const [loyaltyFilter, setLoyaltyFilter] = useState<LoyaltyTier | 'ALL'>('ALL');
  const [activityFilter, setActivityFilter] = useState<CustomerFilterOptions['activityRange']>('ALL');
  const [dietaryFilter, setDietaryFilter] = useState<string>('ALL');
  const [allergyFilter, setAllergyFilter] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Selection & Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'orders' | 'reservations' | 'loyalty' | 'comms' | 'complaints'>('profile');

  // Add / Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<CustomerProfile> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCustomers({
        searchQuery,
        category: categoryFilter,
        loyaltyTier: loyaltyFilter,
        activityRange: activityFilter,
        dietaryFilter,
        allergyFilter,
        includeArchived: showArchived,
      });
      setCustomers(data);
      const dups = findDuplicateCustomers(data);
      setDuplicateGroups(dups);

      if (selectedCustomer) {
        const refreshed = data.find((c) => c.id === selectedCustomer.id);
        if (refreshed) setSelectedCustomer(refreshed);
      }
    } catch {
      showToast('Failed to load customer profiles', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, categoryFilter, loyaltyFilter, activityFilter, dietaryFilter, allergyFilter, showArchived]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = customers.length;
    const vips = customers.filter((c) => c.category === 'VIP').length;
    const regulars = customers.filter((c) => c.category === 'REGULAR').length;
    const newCount = customers.filter((c) => c.category === 'NEW').length;
    const totalLTV = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
    return { total, vips, regulars, newCount, totalLTV };
  }, [customers]);

  // Handle Save
  const handleSaveCustomer = async () => {
    if (!editingCustomer?.fullName?.trim() || (!editingCustomer?.mobile?.trim() && !editingCustomer?.email?.trim())) {
      showToast('Name and either mobile phone or email are required', 'error');
      return;
    }
    setIsSaving(true);
    const res = await saveCustomer(editingCustomer);
    setIsSaving(false);
    if (res.success && res.customer) {
      showToast(editingCustomer.id ? 'Customer profile updated' : 'New customer account registered');
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      if (selectedCustomer?.id === res.customer.id) {
        setSelectedCustomer(res.customer);
      }
      loadData();
    } else {
      showToast(res.error || 'Failed to save customer record', 'error');
    }
  };

  // Handle Ingest from Transactions
  const handleAutoIngest = async () => {
    const res = await ingestCustomersFromTransactions();
    if (res.ingestedCount > 0) {
      showToast(`Automatically registered ${res.ingestedCount} new patrons from recent bookings & orders`);
      loadData();
    } else {
      showToast('No new unregistered patrons detected in transaction history');
    }
  };

  // Handle Merge
  const handleMergeRecords = async () => {
    if (!selectedDupGroup || !mergePrimaryId) return;
    const duplicate = selectedDupGroup.customers.find((c) => c.id !== mergePrimaryId);
    if (!duplicate) return;

    setIsMerging(true);
    const res = await mergeCustomerProfiles(mergePrimaryId, duplicate.id, 'Restaurant Admin');
    setIsMerging(false);

    if (res.success) {
      showToast(`Successfully merged duplicate profile #${duplicate.id} into #${mergePrimaryId}`);
      setIsMergeModalOpen(false);
      setSelectedDupGroup(null);
      loadData();
    } else {
      showToast(res.error || 'Merge failed', 'error');
    }
  };

  // Handle Archive / Unarchive
  const handleToggleArchive = async (cust: CustomerProfile) => {
    if (cust.isArchived) {
      const ok = await unarchiveCustomer(cust.id);
      if (ok) {
        showToast(`Customer #${cust.id} restored to active directory`);
        loadData();
      }
    } else {
      const ok = await archiveCustomer(cust.id);
      if (ok) {
        showToast(`Customer #${cust.id} archived. Transaction history safely preserved.`);
        loadData();
      }
    }
  };

  // Handle Anonymization (Right to be Forgotten)
  const handleConfirmAnonymize = async () => {
    if (!privacyModalCustomer) return;
    const ok = await anonymizeCustomerProfile(privacyModalCustomer.id);
    if (ok) {
      showToast(`Patron #${privacyModalCustomer.id} personal PII anonymized under compliance rules.`);
      setPrivacyModalCustomer(null);
      if (selectedCustomer?.id === privacyModalCustomer.id) {
        setSelectedCustomer(null);
      }
      loadData();
    } else {
      showToast('Anonymization failed', 'error');
    }
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Full Name',
      'Email',
      'Mobile',
      'Category',
      'Loyalty Tier',
      'Loyalty Points',
      'Total Spend ($)',
      'Total Visits',
      'Registered Date',
      'Dietary Preferences',
      'Allergies',
    ];
    const rows = customers.map((c) => [
      c.id,
      `"${c.fullName.replace(/"/g, '""')}"`,
      c.email,
      c.mobile,
      c.category,
      c.loyaltyTier,
      c.loyaltyPoints,
      c.totalSpend.toFixed(2),
      c.totalVisits,
      c.registeredAt.split('T')[0],
      `"${c.dietaryPreferences.join(', ')}"`,
      `"${c.foodAllergies.join(', ')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer directory exported to CSV successfully');
  };

  // Handle Export DSAR Dossier (JSON)
  const handleExportDSAR = (cust: CustomerProfile) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cust, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `DSAR_Data_Subject_Report_${cust.id}.json`);
    dlAnchorElem.click();
    showToast(`Exported DSAR data access report for #${cust.id}`);
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C7] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#7A7268] font-medium">
            <span>Total Registered Patrons</span>
            <Users className="w-4 h-4 text-[#79415A]" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#1F313D] mt-2">{stats.total}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Centralized Database</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C7] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#7A7268] font-medium">
            <span>VIP Dining Circle</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#1F313D] mt-2">{stats.vips}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">High LTV Connoisseurs</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C7] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#7A7268] font-medium">
            <span>Regular Patrons</span>
            <UserCheck className="w-4 h-4 text-[#82401D]" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#1F313D] mt-2">{stats.regulars}</div>
          <div className="text-[11px] text-[#82401D] font-semibold mt-0.5">Repeated Diners (3+ visits)</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C7] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#7A7268] font-medium">
            <span>New First-Timers</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#1F313D] mt-2">{stats.newCount}</div>
          <div className="text-[11px] text-purple-700 font-semibold mt-0.5">Enrolled Last 30 Days</div>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, mobile, email, or Customer ID (e.g. CUST-10491)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A]"
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Duplicates Alert Badge Pill */}
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
                <span>{duplicateGroups.length} Duplicate Group(s) Detected</span>
              </button>
            )}

            <button
              onClick={handleAutoIngest}
              title="Automatically scan and register patrons from new online bookings & POS orders"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-[#1F313D] text-xs font-bold hover:bg-[#EAE4D9] transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#82401D]" />
              <span className="hidden sm:inline">Auto-Register from Bookings</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-[#1F313D] text-xs font-bold hover:bg-[#EAE4D9] transition"
            >
              <Download className="w-3.5 h-3.5 text-[#79415A]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => {
                setEditingCustomer({
                  id: generateCustomerId(),
                  fullName: '',
                  email: '',
                  mobile: '',
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
              <span>Add Customer Manually</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#DDD5C7]/70 text-xs">
          <span className="text-[11px] font-bold text-[#7A7268] flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#79415A]" /> Filter By:
          </span>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
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
            onChange={(e) => setLoyaltyFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] focus:outline-none"
          >
            <option value="ALL">All Tiers</option>
            <option value="Platinum">Platinum Tier</option>
            <option value="Gold">Gold Tier</option>
            <option value="Silver">Silver Tier</option>
            <option value="Bronze">Bronze Tier</option>
          </select>

          {/* Activity Recency Filter */}
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] focus:outline-none"
          >
            <option value="ALL">All Recency</option>
            <option value="active_30">Active in last 30 days</option>
            <option value="active_90">Active in last 90 days</option>
            <option value="inactive_90">Inactive (&gt; 90 days)</option>
            <option value="never_ordered">Never ordered yet</option>
          </select>

          {/* Dietary Filter */}
          <select
            value={dietaryFilter}
            onChange={(e) => setDietaryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] focus:outline-none"
          >
            <option value="ALL">All Diets</option>
            {DIETARY_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Allergy Filter */}
          <select
            value={allergyFilter}
            onChange={(e) => setAllergyFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] focus:outline-none"
          >
            <option value="ALL">All Allergies</option>
            {ALLERGY_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Show Archived Toggle */}
          <label className="flex items-center gap-1.5 ml-auto text-xs text-[#5C5549] cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#79415A]"
            />
            <span>Include Archived ({customers.filter((c) => c.isArchived).length})</span>
          </label>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#DDD5C7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#79415A]" />
            <h2 className="text-sm font-bold text-[#1F313D]">Patron Directory ({customers.length} records)</h2>
          </div>
          <span className="text-[11px] text-[#7A7268]">Click any patron row to inspect complete dining history</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-[#7A7268]">
            <div className="w-6 h-6 border-2 border-[#79415A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading centralized patron database...
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#7A7268] space-y-3">
            <Users className="w-8 h-8 text-[#DDD5C7] mx-auto" />
            <p className="font-semibold">No customers found matching the selected filter criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
                setLoyaltyFilter('ALL');
                setActivityFilter('ALL');
                setDietaryFilter('ALL');
                setAllergyFilter('ALL');
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
                  <th className="py-3 px-4">Category & Tier</th>
                  <th className="py-3 px-4">Culinary Profile</th>
                  <th className="py-3 px-4 text-right">Spend & Visits</th>
                  <th className="py-3 px-4">Last Dining Recency</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD5C7]">
                {customers.map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;
                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className={`hover:bg-[#EFE9DF]/60 transition cursor-pointer ${
                        isSelected ? 'bg-[#EFE9DF] ring-1 ring-[#79415A]/30' : ''
                      } ${cust.isArchived ? 'opacity-60 bg-gray-50' : ''}`}
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
                              {cust.isArchived && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-gray-200 text-gray-700">
                                  Archived
                                </span>
                              )}
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

                      {/* Category & Tier */}
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

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cust.loyaltyTier === 'Platinum'
                                ? 'bg-[#1F313D] text-[#E5C9B3]'
                                : cust.loyaltyTier === 'Gold'
                                ? 'bg-amber-500 text-white'
                                : cust.loyaltyTier === 'Silver'
                                ? 'bg-slate-300 text-slate-800'
                                : 'bg-amber-700 text-white'
                            }`}
                          >
                            {cust.loyaltyTier} ({cust.loyaltyPoints} pts)
                          </span>
                        </div>
                      </td>

                      {/* Culinary Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {cust.dietaryPreferences.slice(0, 2).map((d) => (
                            <span key={d} className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] border border-emerald-200">
                              {d}
                            </span>
                          ))}
                          {cust.foodAllergies.slice(0, 1).map((a) => (
                            <span key={a} className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 text-[10px] border border-rose-200">
                              ⚠ {a}
                            </span>
                          ))}
                          {cust.dietaryPreferences.length === 0 && cust.foodAllergies.length === 0 && (
                            <span className="text-[#7A7268] text-[11px] italic">No restrictions logged</span>
                          )}
                        </div>
                      </td>

                      {/* Spend & Visits */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-[#1F313D] font-mono">${cust.totalSpend.toFixed(2)}</div>
                        <div className="text-[10px] text-[#7A7268]">{cust.totalVisits} visits &bull; AOV: ${cust.averageOrderValue.toFixed(0)}</div>
                      </td>

                      {/* Recency */}
                      <td className="py-3.5 px-4 text-[11px] text-[#5C5549]">
                        <div>{cust.lastVisitDate ? new Date(cust.lastVisitDate).toLocaleDateString() : 'Never'}</div>
                        <div className="text-[10px] text-[#7A7268]">Src: {cust.registeredSource}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCustomer(cust);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit customer details"
                            className="p-1.5 rounded-lg text-[#5C5549] hover:bg-[#DDD5C7] transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleArchive(cust)}
                            title={cust.isArchived ? 'Restore customer' : 'Archive customer'}
                            className="p-1.5 rounded-lg text-[#82401D] hover:bg-[#DDD5C7] transition"
                          >
                            {cust.isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
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
                  <span>Source: {selectedCustomer.registeredSource}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExportDSAR(selectedCustomer)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs font-semibold text-[#5C5549] hover:bg-[#EFE9DF]"
                title="Download full Data Subject Access Report (DSAR JSON)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DSAR Dossier</span>
              </button>

              <button
                onClick={() => setPrivacyModalCustomer(selectedCustomer)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 text-xs font-semibold hover:bg-rose-100"
                title="Right-to-be-Forgotten Data Deletion Request"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Anonymize Patron</span>
              </button>

              <button
                onClick={() => {
                  setEditingCustomer(selectedCustomer);
                  setIsEditModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#79415A] text-white text-xs font-bold hover:bg-[#68334b]"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
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
              { id: 'profile', label: 'Culinary & Contact Profile', icon: Utensils },
              { id: 'orders', label: `Order History (${selectedCustomer.orders.length})`, icon: Receipt },
              { id: 'reservations', label: `Table Reservations (${selectedCustomer.reservations.length})`, icon: Calendar },
              { id: 'loyalty', label: `Loyalty Points (${selectedCustomer.loyaltyPoints} pts)`, icon: Award },
              { id: 'comms', label: `Communication Logs (${selectedCustomer.communications.length})`, icon: MessageSquare },
              { id: 'complaints', label: `Feedback & Tickets (${selectedCustomer.complaints.length})`, icon: AlertCircle },
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
              {/* Contact & Address */}
              <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-3">
                <div className="font-bold text-[#1F313D] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#79415A]" />
                  <span>Contact Information</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div><span className="text-[#7A7268]">Phone:</span> <strong className="text-[#1F313D]">{selectedCustomer.mobile}</strong></div>
                  <div><span className="text-[#7A7268]">Email:</span> <strong className="text-[#1F313D]">{selectedCustomer.email || 'None'}</strong></div>
                  <div>
                    <span className="text-[#7A7268]">Physical Address:</span>
                    <div className="text-[#1F313D] mt-0.5">
                      {selectedCustomer.address.street ? (
                        `${selectedCustomer.address.street}, ${selectedCustomer.address.city}, ${selectedCustomer.address.state} ${selectedCustomer.address.postalCode}`
                      ) : (
                        <span className="italic text-[#7A7268]">No postal address on file</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DDD5C7] space-y-1 text-[11px]">
                  <div className="flex items-center gap-1">
                    <Cake className="w-3 h-3 text-[#82401D]" />
                    <span>DOB: <strong>{selectedCustomer.dateOfBirth || 'Unspecified'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500" />
                    <span>Anniversary: <strong>{selectedCustomer.anniversary || 'Unspecified'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Culinary & Hospitality Instructions */}
              <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-3">
                <div className="font-bold text-[#1F313D] flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#79415A]" />
                  <span>Culinary Preferences & Allergies</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7A7268] block mb-1">Dietary Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCustomer.dietaryPreferences.map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-semibold text-[10px]">
                        {d}
                      </span>
                    ))}
                    {selectedCustomer.dietaryPreferences.length === 0 && <span className="text-[#7A7268] italic">No dietary restrictions</span>}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-700 block mb-1">Food Allergies & Intolerances</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCustomer.foodAllergies.map((a) => (
                      <span key={a} className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold text-[10px] border border-rose-200">
                        ⚠ {a}
                      </span>
                    ))}
                    {selectedCustomer.foodAllergies.length === 0 && <span className="text-[#7A7268] italic">No recorded allergies</span>}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7A7268] block mb-1">Floor Notes & Seating Preferences</span>
                  <p className="p-2 rounded-xl bg-white/70 text-[#1F313D] text-[11px] leading-relaxed">
                    {selectedCustomer.specialInstructions || 'No custom dining notes logged.'}
                  </p>
                </div>
              </div>

              {/* Consent & Data Privacy */}
              <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-3">
                <div className="font-bold text-[#1F313D] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Consent & Privacy Preferences</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span>SMS Marketing Consent:</span>
                    <span className={`font-bold ${selectedCustomer.consent.marketingSms ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {selectedCustomer.consent.marketingSms ? 'Opted In ✓' : 'Opted Out ✕'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email Newsletter Consent:</span>
                    <span className={`font-bold ${selectedCustomer.consent.marketingEmail ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {selectedCustomer.consent.marketingEmail ? 'Opted In ✓' : 'Opted Out ✕'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>WhatsApp Booking Updates:</span>
                    <span className={`font-bold ${selectedCustomer.consent.whatsappUpdates ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {selectedCustomer.consent.whatsappUpdates ? 'Opted In ✓' : 'Opted Out ✕'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DDD5C7] text-[10px] text-[#7A7268]">
                  Consent Timestamp: {new Date(selectedCustomer.consent.consentTimestamp).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Orders History */}
          {activeDetailTab === 'orders' && (
            <div className="space-y-3">
              {selectedCustomer.orders.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#7A7268]">No recorded orders found for this patron yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] font-mono uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Order Number</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Items Summary</th>
                        <th className="py-2.5 px-3">Payment</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDD5C7]">
                      {selectedCustomer.orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#EFE9DF]/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#1F313D]">{ord.orderNumber}</td>
                          <td className="py-2.5 px-3 text-[#5C5549]">{new Date(ord.date).toLocaleDateString()}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-[#EFE9DF] font-bold text-[10px] text-[#79415A]">{ord.orderType}</span>
                          </td>
                          <td className="py-2.5 px-3 text-[#1F313D] max-w-xs truncate">{ord.itemsSummary}</td>
                          <td className="py-2.5 px-3 text-[#5C5549]">{ord.paymentMethod}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1F313D]">${ord.totalAmount.toFixed(2)}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {ord.status}
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

          {/* Tab 3: Table Reservations */}
          {activeDetailTab === 'reservations' && (
            <div className="space-y-3">
              {selectedCustomer.reservations.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#7A7268]">No table bookings found for this customer.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] font-mono uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Booking Code</th>
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Outlet Branch</th>
                        <th className="py-2.5 px-3">Party Size</th>
                        <th className="py-2.5 px-3">Table</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDD5C7]">
                      {selectedCustomer.reservations.map((res) => (
                        <tr key={res.id} className="hover:bg-[#EFE9DF]/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#79415A]">{res.bookingCode}</td>
                          <td className="py-2.5 px-3 font-medium text-[#1F313D]">{res.date} &bull; {res.time}</td>
                          <td className="py-2.5 px-3 text-[#5C5549]">{res.branchName}</td>
                          <td className="py-2.5 px-3 font-bold">{res.partySize} guests</td>
                          <td className="py-2.5 px-3 font-mono text-[#82401D] font-bold">{res.tableNumber}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
                              {res.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#7A7268] text-[11px]">{res.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Loyalty & Rewards */}
          {activeDetailTab === 'loyalty' && (
            <div className="p-5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#79415A]">Epicurean Club Membership</div>
                  <h4 className="text-lg font-bold text-[#1F313D]">{selectedCustomer.loyaltyTier} Tier Member</h4>
                </div>
                <div className="bg-white/80 border border-[#DDD5C7] rounded-xl px-4 py-2">
                  <span className="text-[10px] text-[#7A7268] block">Current Redeemable Balance</span>
                  <span className="text-2xl font-mono font-bold text-[#79415A]">{selectedCustomer.loyaltyPoints} points</span>
                  <span className="text-[11px] text-[#5C5549] ml-2 font-semibold">
                    (Worth ${(selectedCustomer.loyaltyPoints * 0.05).toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Progress bar to next tier */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] text-[#5C5549] font-semibold">
                  <span>Tier Progress: {selectedCustomer.loyaltyTier}</span>
                  <span>Lifetime Earned: {selectedCustomer.lifetimePointsEarned} pts</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#DDD5C7] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#79415A] to-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, (selectedCustomer.loyaltyPoints / 2000) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Communications */}
          {activeDetailTab === 'comms' && (
            <div className="space-y-2">
              {selectedCustomer.communications.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#7A7268]">No communication records logged for this patron.</div>
              ) : (
                selectedCustomer.communications.map((comm) => (
                  <div key={comm.id} className="p-3.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-white text-[#79415A] font-bold text-[10px] border border-[#DDD5C7]">
                          {comm.type}
                        </span>
                        <strong className="text-[#1F313D]">{comm.title}</strong>
                      </div>
                      <p className="text-[#5C5549] text-[11px] leading-relaxed">{comm.preview}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#7A7268] block">{new Date(comm.sentAt).toLocaleDateString()}</span>
                      <span className="text-[10px] text-emerald-700 font-bold">{comm.status} ✓</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 6: Complaints & Feedback */}
          {activeDetailTab === 'complaints' && (
            <div className="space-y-2">
              {selectedCustomer.complaints.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#7A7268]">No complaints or service escalations filed by this patron. 100% spotless dining record.</div>
              ) : (
                selectedCustomer.complaints.map((comp) => (
                  <div key={comp.id} className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-900">{comp.ticketNumber} &bull; {comp.rating} ★ Rating</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">{comp.status}</span>
                    </div>
                    <p className="text-amber-950 font-medium">{comp.issue}</p>
                    {comp.resolutionNotes && (
                      <p className="text-[11px] text-amber-800 bg-white/70 p-2 rounded-lg">
                        <strong>Resolution:</strong> {comp.resolutionNotes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 1: ADD / EDIT CUSTOMER ACCOUNT
         ══════════════════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[28px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#DDD5C7] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1F313D]">
                  {editingCustomer.id ? `Edit Customer Profile (${editingCustomer.id})` : 'Register New Customer Account'}
                </h3>
                <p className="text-xs text-[#7A7268]">Maintain complete patron identification, dietary preferences, and contact details.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-full hover:bg-[#DDD5C7]">
                <X className="w-4 h-4 text-[#7A7268]" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Row 1: Name & ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1">Full Patron Name *</label>
                  <input
                    type="text"
                    value={editingCustomer.fullName || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, fullName: e.target.value })}
                    placeholder="e.g. Victoria Sterling"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1">Mobile Contact Phone *</label>
                  <input
                    type="tel"
                    value={editingCustomer.mobile || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, mobile: e.target.value })}
                    placeholder="+91 98200 12345"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>
              </div>

              {/* Row 2: Email & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1F313D] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingCustomer.email || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    placeholder="victoria@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1">Customer Category</label>
                  <select
                    value={editingCustomer.category || 'NEW'}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold text-[#1F313D]"
                  >
                    <option value="NEW">NEW (First 30 days)</option>
                    <option value="REGULAR">REGULAR (Loyal Diner)</option>
                    <option value="VIP">VIP (High Spender)</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Physical Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1F313D] mb-1">Street Address</label>
                  <input
                    type="text"
                    value={editingCustomer.address?.street || ''}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        address: { ...(editingCustomer.address as any), street: e.target.value },
                      })
                    }
                    placeholder="Apartment, Street name"
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1">City</label>
                  <input
                    type="text"
                    value={editingCustomer.address?.city || 'Mumbai'}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        address: { ...(editingCustomer.address as any), city: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                </div>
              </div>

              {/* Row 4: Dates (DOB & Anniversary) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1 flex items-center gap-1">
                    <Cake className="w-3.5 h-3.5 text-[#82401D]" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editingCustomer.dateOfBirth || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" /> Relationship / Wedding Anniversary
                  </label>
                  <input
                    type="date"
                    value={editingCustomer.anniversary || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, anniversary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                </div>
              </div>

              {/* Row 5: Dietary Preferences & Allergies */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7]">
                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Dietary Preferences (Select applicable)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DIETARY_OPTIONS.map((diet) => {
                      const isSelected = editingCustomer.dietaryPreferences?.includes(diet);
                      return (
                        <button
                          key={diet}
                          type="button"
                          onClick={() => {
                            const list = editingCustomer.dietaryPreferences || [];
                            const updated = isSelected ? list.filter((d) => d !== diet) : [...list, diet];
                            setEditingCustomer({ ...editingCustomer, dietaryPreferences: updated });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            isSelected ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-white text-[#5C5549] border border-[#DDD5C7]'
                          }`}
                        >
                          {diet} {isSelected ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DDD5C7]">
                  <label className="block text-xs font-bold text-rose-800 mb-1.5">Food Allergies & Intolerances (Severe Attention)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALLERGY_OPTIONS.map((allergy) => {
                      const isSelected = editingCustomer.foodAllergies?.includes(allergy);
                      return (
                        <button
                          key={allergy}
                          type="button"
                          onClick={() => {
                            const list = editingCustomer.foodAllergies || [];
                            const updated = isSelected ? list.filter((a) => a !== allergy) : [...list, allergy];
                            setEditingCustomer({ ...editingCustomer, foodAllergies: updated });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            isSelected ? 'bg-rose-700 text-white shadow-2xs' : 'bg-white text-[#5C5549] border border-[#DDD5C7]'
                          }`}
                        >
                          ⚠ {allergy} {isSelected ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 6: Special Hospitality Instructions */}
              <div>
                <label className="block text-xs font-bold text-[#1F313D] mb-1">Special Dining Notes & Seating Instructions</label>
                <textarea
                  rows={2}
                  value={editingCustomer.specialInstructions || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, specialInstructions: e.target.value })}
                  placeholder="e.g. Prefers quiet corner booth. Water without ice."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-3 border-t border-[#DDD5C7]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549] hover:bg-[#EAE4D9]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomer}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingCustomer.id ? 'Save Changes' : 'Register Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 2: DUPLICATE RECORD DETECTION & MERGE TOOL
         ══════════════════════════════════════════════════════════════════════════ */}
      {isMergeModalOpen && selectedDupGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[28px] max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#DDD5C7] pb-3">
              <div className="flex items-center gap-2">
                <Merge className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-bold text-[#1F313D]">Duplicate Customer Record Resolution</h3>
                  <p className="text-xs text-[#7A7268]">Reason: {selectedDupGroup.matchValue}</p>
                </div>
              </div>
              <button onClick={() => setIsMergeModalOpen(false)} className="p-1.5 rounded-full hover:bg-[#DDD5C7]">
                <X className="w-4 h-4 text-[#7A7268]" />
              </button>
            </div>

            <p className="text-xs text-[#5C5549] leading-relaxed">
              Select which customer record to maintain as the <strong>Primary Profile</strong>. All orders, table bookings, loyalty points, and history from the secondary record will be merged into the primary profile, and the duplicate record will be resolved.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedDupGroup.customers.map((cust) => {
                const isSelectedPrimary = mergePrimaryId === cust.id;
                return (
                  <div
                    key={cust.id}
                    onClick={() => setMergePrimaryId(cust.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                      isSelectedPrimary
                        ? 'bg-amber-50/70 border-amber-500 shadow-sm'
                        : 'bg-[#EFE9DF] border-[#DDD5C7] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-[#79415A]">{cust.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSelectedPrimary ? 'bg-amber-500 text-white' : 'bg-[#DDD5C7] text-[#5C5549]'}`}>
                        {isSelectedPrimary ? 'Retain as Primary' : 'Duplicate Record'}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-[#1F313D]">{cust.fullName}</div>
                    <div className="text-xs text-[#5C5549] mt-1 space-y-0.5">
                      <div>Phone: {cust.mobile}</div>
                      <div>Email: {cust.email || 'None'}</div>
                      <div>Orders: {cust.orders.length} &bull; Total Spend: ${cust.totalSpend.toFixed(2)}</div>
                      <div>Loyalty: {cust.loyaltyPoints} points ({cust.loyaltyTier})</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#DDD5C7]">
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMergeRecords}
                disabled={isMerging}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {isMerging ? 'Merging Records...' : 'Authorize & Merge Records'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 3: PRIVACY & RIGHT-TO-BE-FORGOTTEN (ANONYMIZE)
         ══════════════════════════════════════════════════════════════════════════ */}
      {privacyModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#1F313D]">Right to be Forgotten Request</h3>
                <p className="text-xs text-[#7A7268]">Data Subject Deletion / Anonymization</p>
              </div>
            </div>

            <p className="text-xs text-[#5C5549] leading-relaxed">
              Are you sure you want to anonymize patron <strong>{privacyModalCustomer.fullName}</strong> (#{privacyModalCustomer.id})?
              All personally identifiable contact details, phone numbers, addresses, and avatars will be permanently scrubbed in compliance with privacy regulations, while historical financial order totals remain intact for accounting ledger accuracy.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPrivacyModalCustomer(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAnonymize}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Confirm Anonymization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
