import React, { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  Users,
  Plus,
  Search,
  Filter,
  Crown,
  AlertTriangle,
  Repeat,
  TrendingUp,
  MapPin,
  Utensils,
  Award,
  CheckCircle2,
  Download,
  Trash2,
  Edit2,
  Eye,
  RefreshCw,
  Sparkles,
  X,
  Megaphone,
  Calendar,
  Phone,
  Mail,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Check,
  ToggleLeft,
  ToggleRight,
  TrendingDown
} from 'lucide-react';
import {
  CustomerSegment,
  SegmentCriteriaField,
  SegmentOperator,
  SegmentRuleCondition,
  SegmentRuleGroup,
  fetchCustomerSegments,
  saveCustomerSegment,
  deleteCustomerSegment,
  toggleSegmentStatus,
  addMemberToSegment,
  removeMemberFromSegment,
  getSegmentationStats,
  dispatchCampaignToSegment,
  exportSegmentAudienceCSV,
  evaluateSegmentMembers
} from '../../lib/customerSegmentationApi';
import { CustomerProfile, loadCustomersFromStorage } from '../../lib/customerManagementApi';

const FIELD_OPTIONS: { field: SegmentCriteriaField; label: string; type: 'number' | 'text' | 'select' | 'date'; options?: string[] }[] = [
  { field: 'totalSpend', label: 'Total Spending ($)', type: 'number' },
  { field: 'visitCount', label: 'Number of Orders / Visits', type: 'number' },
  { field: 'avgOrderValue', label: 'Average Order Value ($)', type: 'number' },
  { field: 'daysSinceLastVisit', label: 'Days Since Last Visit', type: 'number' },
  { field: 'orderFrequency', label: 'Order Frequency (High/Weekend/Low)', type: 'text' },
  { field: 'favoriteCategory', label: 'Preferred Food Categories', type: 'text' },
  { field: 'preferredOrderingMethod', label: 'Preferred Ordering Method', type: 'text' },
  { field: 'daysSinceRegistered', label: 'Days Since Registration', type: 'number' },
  { field: 'birthday', label: 'Birthday Recorded', type: 'text' },
  { field: 'anniversary', label: 'Anniversary Recorded', type: 'text' },
  { field: 'status', label: 'Customer Status', type: 'select', options: ['Active', 'Inactive'] },
  { field: 'city', label: 'Customer City / Location', type: 'text' },
  { field: 'loyaltyTier', label: 'Loyalty Tier', type: 'select', options: ['Platinum', 'Gold', 'Silver', 'Bronze'] },
  { field: 'customerCategory', label: 'Customer Category', type: 'select', options: ['VIP', 'REGULAR', 'NEW', 'INACTIVE'] },
  { field: 'dietaryPreference', label: 'Dietary Preference', type: 'text' },
];

export const CustomerSegmentationView: React.FC<{ orgId?: string }> = () => {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Inspection Drawer State
  const [inspectingSegment, setInspectingSegment] = useState<CustomerSegment | null>(null);
  const [drawerSearch, setDrawerSearch] = useState<string>('');
  const [selectedAddCustomerId, setSelectedAddCustomerId] = useState<string>('');

  // Edit / Create Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingSegment, setEditingSegment] = useState<Partial<CustomerSegment> | null>(null);

  // Campaign Dispatch Modal State
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState<boolean>(false);
  const [campaignSegment, setCampaignSegment] = useState<CustomerSegment | null>(null);
  const [campaignChannel, setCampaignChannel] = useState<'WhatsApp' | 'SMS' | 'Email' | 'Meta Custom Audience' | 'Google Customer Match'>('WhatsApp');
  const [campaignTitle, setCampaignTitle] = useState<string>('');
  const [offerHeadline, setOfferHeadline] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [discountPct, setDiscountPct] = useState<number>(15);
  const [hasExplicitConsent, setHasExplicitConsent] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allCust = loadCustomersFromStorage();
      setCustomers(allCust);
      const allSegs = await fetchCustomerSegments();
      setSegments(allSegs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered segments
  const filteredSegments = useMemo(() => {
    return segments.filter((seg) => {
      const matchCat = activeCategoryFilter === 'ALL' || seg.category === activeCategoryFilter;
      const matchSearch =
        !searchQuery ||
        seg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seg.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [segments, activeCategoryFilter, searchQuery]);

  // Overall 7 Segmentation Dashboard KPIs
  const dashboardStats = useMemo(() => {
    return getSegmentationStats(segments, customers);
  }, [segments, customers]);

  // Handle Toggle Active/Inactive
  const handleToggleActive = async (seg: CustomerSegment, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await toggleSegmentStatus(seg.id);
    if (ok) {
      showToast(`Segment "${seg.name}" status updated`);
      loadData();
      if (inspectingSegment?.id === seg.id) {
        setInspectingSegment((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
      }
    }
  };

  // Handle open create modal
  const handleOpenCreateModal = () => {
    setEditingSegment({
      name: '',
      description: '',
      category: 'custom',
      iconName: 'SlidersHorizontal',
      badgeColor: '#79415A',
      isPredefined: false,
      isActive: true,
      rules: {
        combinator: 'AND',
        conditions: [
          {
            id: `cond-${Date.now()}`,
            field: 'totalSpend',
            operator: 'gte',
            value: 500,
          },
        ],
      },
    });
    setIsEditModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (seg: CustomerSegment) => {
    setEditingSegment(JSON.parse(JSON.stringify(seg)));
    setIsEditModalOpen(true);
  };

  // Add rule condition row
  const handleAddCondition = () => {
    if (!editingSegment?.rules) return;
    const newCond: SegmentRuleCondition = {
      id: `cond-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      field: 'totalSpend',
      operator: 'gte',
      value: 100,
    };
    setEditingSegment({
      ...editingSegment,
      rules: {
        ...editingSegment.rules,
        conditions: [...editingSegment.rules.conditions, newCond],
      },
    });
  };

  // Remove rule condition row
  const handleRemoveCondition = (condId: string) => {
    if (!editingSegment?.rules) return;
    if (editingSegment.rules.conditions.length <= 1) {
      showToast('A segment must contain at least one condition', 'error');
      return;
    }
    setEditingSegment({
      ...editingSegment,
      rules: {
        ...editingSegment.rules,
        conditions: editingSegment.rules.conditions.filter((c) => c.id !== condId),
      },
    });
  };

  // Update a single condition
  const handleUpdateCondition = (condId: string, updates: Partial<SegmentRuleCondition>) => {
    if (!editingSegment?.rules) return;
    setEditingSegment({
      ...editingSegment,
      rules: {
        ...editingSegment.rules,
        conditions: editingSegment.rules.conditions.map((c) => (c.id === condId ? { ...c, ...updates } : c)),
      },
    });
  };

  // Live member preview for modal
  const livePreviewCount = useMemo(() => {
    if (!editingSegment?.rules) return 0;
    const res = evaluateSegmentMembers(
      { rules: editingSegment.rules, manualAddedIds: editingSegment.manualAddedIds, manualRemovedIds: editingSegment.manualRemovedIds },
      customers
    );
    return res.memberCount;
  }, [editingSegment?.rules, customers]);

  // Save Segment handler
  const handleSaveSegment = async () => {
    if (!editingSegment?.name?.trim()) {
      showToast('Please enter a segment name', 'error');
      return;
    }
    const res = await saveCustomerSegment(editingSegment);
    if (res.success) {
      showToast(`Segment "${res.segment?.name}" saved successfully`);
      setIsEditModalOpen(false);
      setEditingSegment(null);
      loadData();
    } else {
      showToast(res.error || 'Failed to save segment', 'error');
    }
  };

  // Delete Segment handler
  const handleDeleteSegment = async (seg: CustomerSegment) => {
    if (seg.isPredefined) {
      showToast('Predefined intelligent segments cannot be removed', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to delete segment "${seg.name}"?`)) {
      const ok = await deleteCustomerSegment(seg.id);
      if (ok) {
        showToast('Segment deleted');
        if (inspectingSegment?.id === seg.id) setInspectingSegment(null);
        loadData();
      } else {
        showToast('Failed to delete segment', 'error');
      }
    }
  };

  // Manual Add Member to Segment
  const handleManualAddMember = async () => {
    if (!inspectingSegment || !selectedAddCustomerId) return;
    const ok = await addMemberToSegment(inspectingSegment.id, selectedAddCustomerId);
    if (ok) {
      showToast(`Customer #${selectedAddCustomerId} manually added to segment`);
      setSelectedAddCustomerId('');
      loadData();
      // Update inspecting drawer
      const updated = (await fetchCustomerSegments()).find((s) => s.id === inspectingSegment.id);
      if (updated) setInspectingSegment(updated);
    }
  };

  // Manual Remove Member from Segment
  const handleManualRemoveMember = async (customerId: string) => {
    if (!inspectingSegment) return;
    const ok = await removeMemberFromSegment(inspectingSegment.id, customerId);
    if (ok) {
      showToast(`Customer #${customerId} removed from segment`);
      loadData();
      const updated = (await fetchCustomerSegments()).find((s) => s.id === inspectingSegment.id);
      if (updated) setInspectingSegment(updated);
    }
  };

  // Open Campaign Launch Modal
  const handleOpenCampaignModal = (seg: CustomerSegment) => {
    setCampaignSegment(seg);
    setCampaignTitle(`${seg.name} Targeted Outreach`);
    setOfferHeadline(`Special Dining Experience curated for our ${seg.name}`);
    setPromoCode(`PROMO-${seg.name.substring(0, 4).toUpperCase()}${new Date().getMonth() + 1}`);
    setDiscountPct(15);
    setHasExplicitConsent(false);
    setIsCampaignModalOpen(true);
  };

  // Submit Campaign Dispatch
  const handleDispatchCampaign = async () => {
    if (!campaignSegment) return;
    if (!hasExplicitConsent) {
      showToast('Please confirm marketing consent authorization before sending.', 'error');
      return;
    }
    setIsDispatching(true);
    try {
      const res = await dispatchCampaignToSegment({
        segmentId: campaignSegment.id,
        segmentName: campaignSegment.name,
        channel: campaignChannel,
        campaignTitle,
        offerHeadline,
        promoCode,
        discountPct,
        targetAudienceCount: campaignSegment.memberCount,
        dispatchedAt: new Date().toISOString(),
      });
      if (res.success) {
        showToast(res.message);
        setIsCampaignModalOpen(false);
        setCampaignSegment(null);
        loadData();
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setIsDispatching(false);
    }
  };

  // Export audience CSV
  const handleExportCSV = (seg: CustomerSegment) => {
    const evalData = evaluateSegmentMembers(seg, customers);
    exportSegmentAudienceCSV(seg, evalData.members);
    showToast(`Exported ${evalData.memberCount} patron records for "${seg.name}"`);
  };

  const CATEGORIES = [
    { id: 'ALL', label: 'All Segments' },
    { id: 'vip', label: 'VIP Segments', icon: Crown },
    { id: 'high_value', label: 'High Spenders', icon: TrendingUp },
    { id: 'regular', label: 'Regular Patrons', icon: Users },
    { id: 'frequency', label: 'Frequent Diners', icon: Repeat },
    { id: 'new', label: 'New Diners', icon: Sparkles },
    { id: 'at_risk', label: 'Inactive / Lost', icon: AlertTriangle },
    { id: 'milestone', label: 'Birthday & Anniversary', icon: Calendar },
    { id: 'ordering_channel', label: 'Online Ordering', icon: Phone },
    { id: 'custom', label: 'Custom Dynamic', icon: SlidersHorizontal },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all transform animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'success' ? 'bg-[#1F313D]' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-5 rounded-[24px] border border-[#DDD5C7] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#79415A]/10 text-[#79415A]">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1F313D] leading-tight">
                Customer Segmentation &amp; Cohort Intelligence (5.2)
              </h2>
              <p className="text-xs text-[#7A7268] mt-0.5">
                Segment patrons by behavior, spend, frequency, dining patterns, and milestones for targeted campaigns
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadData}
            title="Recalculate dynamic segments against customer database"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549] hover:bg-[#EFE9DF] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-[#79415A] hover:bg-[#68334b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Create Custom Segment
          </button>
        </div>
      </div>

      {/* ── 7 SEGMENTATION DASHBOARD KPI CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-[#7A7268] block">Total Segments</span>
          <div className="text-xl font-bold font-serif text-[#1F313D] mt-1">{dashboardStats.totalSegments}</div>
          <span className="text-[9px] text-[#79415A] font-semibold mt-0.5 block">12 Predefined + Custom</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-[#7A7268] block">Segmented Patrons</span>
          <div className="text-xl font-bold font-serif text-emerald-700 mt-1">{dashboardStats.totalCustomersSegmented}</div>
          <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 block">Unique Guests Covered</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-[#7A7268] block">Active Segments</span>
          <div className="text-xl font-bold font-serif text-[#82401D] mt-1">{dashboardStats.activeSegments}</div>
          <span className="text-[9px] text-[#82401D] font-semibold mt-0.5 block">Live in Engine</span>
        </div>

        <div className="bg-[#1F313D] text-white rounded-2xl p-3.5 border border-[#1F313D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#E5C9B3] block">High-Value</span>
            <Crown className="w-3 h-3 text-[#E5C9B3]" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{dashboardStats.highValueCustomers}</div>
          <span className="text-[9px] text-emerald-400 font-medium mt-0.5 block">&gt; $1,000 or VIP</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#DDD5C7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#7A7268] block">Frequent Patrons</span>
            <Repeat className="w-3 h-3 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-[#1F313D] mt-1">{dashboardStats.frequentCustomers}</div>
          <span className="text-[9px] text-blue-700 font-medium mt-0.5 block">3+ Completed Visits</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#DDD5C7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-600 block">Inactive / Lost</span>
            <AlertTriangle className="w-3 h-3 text-red-500" />
          </div>
          <div className="text-xl font-bold text-red-700 mt-1">{dashboardStats.inactiveCustomers}</div>
          <span className="text-[9px] text-red-600 font-medium mt-0.5 block">&gt; 60 Days Inactive</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#DDD5C7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-700 block">Newly Acquired</span>
            <Sparkles className="w-3 h-3 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-800 mt-1">{dashboardStats.newlyAcquiredCustomers}</div>
          <span className="text-[9px] text-purple-600 font-medium mt-0.5 block">Last 30 Days</span>
        </div>
      </div>

      {/* Category Pills & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#EFE9DF] p-2.5 rounded-2xl border border-[#DDD5C7]">
        {/* Horizontal Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive ? 'bg-[#1F313D] text-white shadow-xs' : 'bg-white/80 text-[#5C5549] hover:bg-white hover:text-[#1F313D]'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search segments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A]"
          />
        </div>
      </div>

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSegments.map((seg) => {
          return (
            <div
              key={seg.id}
              className={`bg-white rounded-[22px] border p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group ${
                seg.isActive ? 'border-[#DDD5C7]' : 'border-gray-300 opacity-60 bg-gray-50'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.badgeColor }} />
                    <h3 className="font-bold text-sm text-[#1F313D] group-hover:text-[#79415A] transition">
                      {seg.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleToggleActive(seg, e)}
                      title={seg.isActive ? 'Deactivate segment' : 'Activate segment'}
                      className="text-xs text-[#7A7268] hover:text-[#1F313D]"
                    >
                      {seg.isActive ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        seg.isPredefined ? 'bg-[#EAE4D9] text-[#5C5549]' : 'bg-[#79415A]/10 text-[#79415A]'
                      }`}
                    >
                      {seg.isPredefined ? 'Predefined' : 'Custom'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#7A7268] mt-2 line-clamp-2 leading-relaxed">
                  {seg.description}
                </p>

                {/* Rule Pills Summary */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#DDD5C7] text-[#5C5549]">
                    Logic: {seg.rules.combinator}
                  </span>
                  {seg.rules.conditions.map((cond, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#EFE9DF] text-[#1F313D]"
                    >
                      {cond.field} {cond.operator} {Array.isArray(cond.value) ? cond.value.join('/') : String(cond.value)}
                    </span>
                  ))}
                </div>

                {/* Customer Insights Matrix */}
                <div className="mt-4 pt-3.5 border-t border-[#EAE4D9] grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#EAE4D9]">
                    <span className="text-[10px] text-[#7A7268] block">Audience</span>
                    <span className="text-sm font-bold text-[#1F313D] block mt-0.5">
                      {seg.memberCount} Diners
                    </span>
                  </div>

                  <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#EAE4D9]">
                    <span className="text-[10px] text-[#7A7268] block">Revenue</span>
                    <span className="text-sm font-bold text-[#79415A] block mt-0.5 font-mono">
                      ${seg.totalSegmentSpend.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#EAE4D9]">
                    <span className="text-[10px] text-[#7A7268] block">Avg AOV</span>
                    <span className="text-sm font-bold text-[#82401D] block mt-0.5 font-mono">
                      ${seg.avgSegmentAOV}
                    </span>
                  </div>
                </div>

                {/* Additional Insight Badges */}
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#7A7268] px-1 font-medium">
                  <span>Frequency: <strong>{seg.purchaseFrequency || 1} orders/patron</strong></span>
                  <span>Retention: <strong>{seg.retentionRate || 75}%</strong></span>
                  <span className="text-emerald-700 font-bold">{seg.growthTrend || '+5.0% MoM'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3.5 border-t border-[#EAE4D9] flex items-center justify-between gap-2">
                <button
                  onClick={() => setInspectingSegment(seg)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F313D] hover:bg-[#2d4454] text-white text-xs font-bold transition shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" /> View Members ({seg.memberCount})
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenCampaignModal(seg)}
                    title="Launch targeted marketing campaign"
                    className="p-1.5 rounded-lg bg-[#79415A]/10 hover:bg-[#79415A]/20 text-[#79415A] transition"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleExportCSV(seg)}
                    title="Export Audience CSV"
                    className="p-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E4DCCE] text-[#5C5549] transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(seg)}
                    title="Edit Segment Conditions"
                    className="p-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E4DCCE] text-[#5C5549] transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {!seg.isPredefined && (
                    <button
                      onClick={() => handleDeleteSegment(seg)}
                      title="Delete Segment"
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DRAWER: INSPECT SEGMENT MEMBERS ── */}
      {inspectingSegment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-[#FAF7F2] w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between border-l border-[#DDD5C7] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#DDD5C7] bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: inspectingSegment.badgeColor }} />
                  <h3 className="font-serif text-lg font-bold text-[#1F313D]">{inspectingSegment.name}</h3>
                </div>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Cohort of {inspectingSegment.memberCount} patron profiles matching dynamic conditions
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenCampaignModal(inspectingSegment)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#79415A] text-white text-xs font-bold hover:bg-[#68334b]"
                >
                  <Megaphone className="w-3.5 h-3.5" /> Target Campaign
                </button>
                <button
                  onClick={() => handleExportCSV(inspectingSegment)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549] hover:bg-[#EFE9DF]"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button
                  onClick={() => setInspectingSegment(null)}
                  className="p-2 rounded-xl text-[#7A7268] hover:bg-[#EFE9DF] hover:text-[#1F313D]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Manual Add Member Control & Search Bar */}
            <div className="p-4 bg-[#EFE9DF] border-b border-[#DDD5C7] space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder="Search members in this segment..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none"
                  />
                </div>

                {/* Manual Add Member Select */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <select
                    value={selectedAddCustomerId}
                    onChange={(e) => setSelectedAddCustomerId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none"
                  >
                    <option value="">Select patron to add...</option>
                    {customers
                      .filter((c) => !inspectingSegment.memberIds.includes(c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.id})
                        </option>
                      ))}
                  </select>
                  <button
                    disabled={!selectedAddCustomerId}
                    onClick={handleManualAddMember}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold disabled:opacity-40"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Member List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {(() => {
                const evalData = evaluateSegmentMembers(inspectingSegment, customers);
                const filteredMembers = evalData.members.filter((m) => {
                  if (!drawerSearch.trim()) return true;
                  const q = drawerSearch.toLowerCase().trim();
                  return (
                    m.fullName.toLowerCase().includes(q) ||
                    m.email.toLowerCase().includes(q) ||
                    m.mobile.includes(q) ||
                    m.id.toLowerCase().includes(q)
                  );
                });

                if (filteredMembers.length === 0) {
                  return (
                    <div className="text-center py-12 text-[#7A7268]">
                      <Users className="w-8 h-8 mx-auto opacity-30 mb-2" />
                      <p className="font-semibold text-xs">No matching customers in this segment.</p>
                    </div>
                  );
                }

                return filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl p-4 border border-[#DDD5C7] shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          member.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=79415A&color=fff&size=80`
                        }
                        alt={member.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-[#DDD5C7]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#1F313D]">{member.fullName}</span>
                          <span className="text-[10px] font-mono text-[#82401D] font-bold">{member.id}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#EFE9DF] text-[#5C5549]">
                            {member.loyaltyTier}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#7A7268] flex items-center gap-3 mt-0.5">
                          <span>{member.mobile}</span>
                          <span>&bull;</span>
                          <span>{member.email || 'No email'}</span>
                          <span>&bull;</span>
                          <span>{member.address?.city || 'Unspecified'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-[#1F313D] block">
                          ${(member.totalSpend || 0).toFixed(0)}
                        </span>
                        <span className="text-[10px] text-[#7A7268] block">
                          {member.totalOrders || member.totalVisits || 0} visits
                        </span>
                      </div>

                      <button
                        onClick={() => handleManualRemoveMember(member.id)}
                        title="Remove patron from segment"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT SEGMENT MODAL WITH CONDITION BUILDER ── */}
      {isEditModalOpen && editingSegment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[28px] max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                  {editingSegment.id ? 'Edit Segment Rules & Logic' : 'Create Custom Customer Segment'}
                </h3>
                <p className="text-xs text-[#7A7268]">Configure dynamic rules with AND / OR combinator</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full text-[#7A7268] hover:bg-[#DDD5C7]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Name & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Segment Name *</label>
                  <input
                    type="text"
                    required
                    value={editingSegment.name || ''}
                    onChange={(e) => setEditingSegment({ ...editingSegment, name: e.target.value })}
                    placeholder="e.g. High-Spenders in Mumbai"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Badge Color</label>
                  <input
                    type="color"
                    value={editingSegment.badgeColor || '#79415A'}
                    onChange={(e) => setEditingSegment({ ...editingSegment, badgeColor: e.target.value })}
                    className="w-full h-9 rounded-xl border border-[#DDD5C7] bg-white cursor-pointer px-1 py-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Description</label>
                  <input
                    type="text"
                    value={editingSegment.description || ''}
                    onChange={(e) => setEditingSegment({ ...editingSegment, description: e.target.value })}
                    placeholder="Brief description of who belongs in this segment..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Condition Builder */}
              <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1F313D]">Condition Match Logic:</span>
                    <div className="flex rounded-lg overflow-hidden border border-[#DDD5C7]">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingSegment({
                            ...editingSegment,
                            rules: { ...(editingSegment.rules || { conditions: [] }), combinator: 'AND' },
                          })
                        }
                        className={`px-3 py-1 font-bold text-xs ${
                          editingSegment.rules?.combinator === 'AND' ? 'bg-[#1F313D] text-white' : 'bg-white text-[#5C5549]'
                        }`}
                      >
                        Match ALL (AND)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingSegment({
                            ...editingSegment,
                            rules: { ...(editingSegment.rules || { conditions: [] }), combinator: 'OR' },
                          })
                        }
                        className={`px-3 py-1 font-bold text-xs ${
                          editingSegment.rules?.combinator === 'OR' ? 'bg-[#1F313D] text-white' : 'bg-white text-[#5C5549]'
                        }`}
                      >
                        Match ANY (OR)
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#79415A] text-white font-bold text-xs"
                  >
                    <Plus className="w-3 h-3" /> Add Condition
                  </button>
                </div>

                {/* Condition Rows */}
                <div className="space-y-2 pt-2">
                  {(editingSegment.rules?.conditions || []).map((cond) => {
                    const fieldDef = FIELD_OPTIONS.find((f) => f.field === cond.field) || FIELD_OPTIONS[0];

                    return (
                      <div key={cond.id} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#DDD5C7]">
                        {/* Field Selector */}
                        <select
                          value={cond.field}
                          onChange={(e) => handleUpdateCondition(cond.id, { field: e.target.value as any })}
                          className="px-2 py-1 rounded-lg bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                        >
                          {FIELD_OPTIONS.map((f) => (
                            <option key={f.field} value={f.field}>{f.label}</option>
                          ))}
                        </select>

                        {/* Operator */}
                        <select
                          value={cond.operator}
                          onChange={(e) => handleUpdateCondition(cond.id, { operator: e.target.value as any })}
                          className="px-2 py-1 rounded-lg bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                        >
                          <option value="gte">&gt;= Greater or Equal</option>
                          <option value="lte">&lt;= Less or Equal</option>
                          <option value="eq">= Equals</option>
                          <option value="neq">!= Not Equals</option>
                          <option value="contains">Contains Substring</option>
                        </select>

                        {/* Value Input */}
                        {fieldDef.type === 'select' && fieldDef.options ? (
                          <select
                            value={cond.value}
                            onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                            className="flex-1 px-2 py-1 rounded-lg bg-[#FAF7F2] border border-[#DDD5C7] text-xs text-[#1F313D]"
                          >
                            {fieldDef.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={fieldDef.type === 'number' ? 'number' : 'text'}
                            value={cond.value}
                            onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                            className="flex-1 px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#DDD5C7] text-xs text-[#1F313D]"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(cond.id)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Live Match Preview Badge */}
                <div className="pt-2 text-right">
                  <span className="text-xs font-bold text-[#79415A] bg-[#79415A]/10 px-3 py-1 rounded-full">
                    Live Match Preview: {livePreviewCount} customers qualify
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#DDD5C7]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] font-bold hover:bg-[#EFE9DF]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSegment}
                  className="px-5 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white font-bold"
                >
                  Save Segment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGN DISPATCH MODAL ── */}
      {isCampaignModalOpen && campaignSegment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C7]">
              <div className="flex items-center gap-2 text-[#79415A]">
                <Megaphone className="w-5 h-5" />
                <h3 className="font-bold text-base text-[#1F313D]">Launch Targeted Campaign</h3>
              </div>
              <button onClick={() => setIsCampaignModalOpen(false)} className="p-1 rounded-full text-[#7A7268] hover:bg-[#DDD5C7]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5C5549]">
              Targeting <strong>{campaignSegment.name}</strong> ({campaignSegment.memberCount} qualifying patrons).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Outreach Channel</label>
                <select
                  value={campaignChannel}
                  onChange={(e) => setCampaignChannel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                >
                  <option value="WhatsApp">WhatsApp Message</option>
                  <option value="SMS">SMS Text Alert</option>
                  <option value="Email">Email Campaign</option>
                  <option value="Meta Custom Audience">Meta Custom Audience Sync</option>
                  <option value="Google Customer Match">Google Customer Match</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Campaign Title</label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Offer Headline</label>
                <input
                  type="text"
                  value={offerHeadline}
                  onChange={(e) => setOfferHeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Promo Code</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Discount %</label>
                  <input
                    type="number"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>
              </div>

              {/* Consent Guard Checkbox */}
              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExplicitConsent}
                  onChange={(e) => setHasExplicitConsent(e.target.checked)}
                  className="mt-0.5 accent-[#79415A]"
                />
                <span className="text-[11px] text-amber-900 leading-tight">
                  I confirm that recipient patrons have granted communication consent and this campaign adheres to marketing regulations.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DDD5C7]">
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] text-xs font-bold hover:bg-[#EFE9DF]"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchCampaign}
                disabled={isDispatching || !hasExplicitConsent}
                className="px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold disabled:opacity-40"
              >
                {isDispatching ? 'Queuing...' : 'Dispatch Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerSegmentationView;
