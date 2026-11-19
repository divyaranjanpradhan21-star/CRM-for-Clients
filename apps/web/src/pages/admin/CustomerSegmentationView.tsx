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
  Flame,
  CheckCircle2,
  Download,
  Send,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  Sparkles,
  X,
  Megaphone,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Share2,
  Layers
} from 'lucide-react';
import {
  CustomerSegment,
  SegmentCriteriaField,
  SegmentOperator,
  SegmentRuleCondition,
  SegmentRuleGroup,
  SegmentTagCategory,
  fetchCustomerSegments,
  saveCustomerSegment,
  deleteCustomerSegment,
  dispatchCampaignToSegment,
  exportSegmentAudienceCSV,
  evaluateSegmentMembers,
  getDaysSinceDate
} from '../../lib/customerSegmentationApi';
import { CustomerProfile, loadCustomersFromStorage } from '../../lib/customerManagementApi';

export const CustomerSegmentationView: React.FC<{ orgId?: string }> = () => {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Inspection Drawer State
  const [inspectingSegment, setInspectingSegment] = useState<CustomerSegment | null>(null);

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

  // Overall KPI metrics
  const kpis = useMemo(() => {
    const totalSegs = segments.length;
    const highValueSeg = segments.find((s) => s.id === 'seg-high-value');
    const atRiskSeg = segments.find((s) => s.id === 'seg-inactive-at-risk');
    const totalSpendTracked = segments.reduce((sum, s) => sum + s.totalSegmentSpend, 0);
    const avgAOV = segments.length > 0 ? (segments.reduce((sum, s) => sum + s.avgSegmentAOV, 0) / segments.length).toFixed(1) : '0';

    return {
      totalSegs,
      highValueCount: highValueSeg?.memberCount || 0,
      atRiskCount: atRiskSeg?.memberCount || 0,
      totalSpendTracked,
      avgAOV,
    };
  }, [segments]);

  // Handle open create modal
  const handleOpenCreateModal = () => {
    setEditingSegment({
      name: '',
      description: '',
      category: 'custom',
      iconName: 'SlidersHorizontal',
      badgeColor: '#79415A',
      isPredefined: false,
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
    const res = evaluateSegmentMembers(editingSegment.rules, customers);
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

  // Open Campaign Launch Modal
  const handleOpenCampaignModal = (seg: CustomerSegment) => {
    setCampaignSegment(seg);
    setCampaignTitle(`${seg.name} Re-engagement Special`);
    setOfferHeadline(`Exclusive VIP Invitation for our ${seg.name}`);
    setPromoCode(`VIP-${seg.name.substring(0, 4).toUpperCase()}${new Date().getMonth() + 1}`);
    setDiscountPct(15);
    setIsCampaignModalOpen(true);
  };

  // Submit Campaign Dispatch
  const handleDispatchCampaign = async () => {
    if (!campaignSegment) return;
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
    const evalData = evaluateSegmentMembers(seg.rules, customers);
    exportSegmentAudienceCSV(seg, evalData.members);
    showToast(`Exported ${evalData.memberCount} patron records for "${seg.name}"`);
  };

  // Category tags array
  const CATEGORIES = [
    { id: 'ALL', label: 'All Segments' },
    { id: 'high_value', label: 'High-Value VIPs', icon: Crown },
    { id: 'at_risk', label: 'At-Risk & Inactive', icon: AlertTriangle },
    { id: 'frequency', label: 'Visit Frequency', icon: Repeat },
    { id: 'spending', label: 'Spending & AOV', icon: TrendingUp },
    { id: 'location', label: 'Location & Branch', icon: MapPin },
    { id: 'culinary', label: 'Food & Cuisine', icon: Utensils },
    { id: 'loyalty', label: 'Loyalty Tiers', icon: Award },
    { id: 'custom', label: 'Custom Dynamic', icon: SlidersHorizontal },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all transform animate-bounce ${
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
                Customer Segmentation &amp; Cohort Intelligence
              </h2>
              <p className="text-xs text-[#7A7268] mt-0.5">
                Dynamic automated segmentation by spending, frequency, AOV, location, recency, culinary tastes, and loyalty tiers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadData}
            title="Recalculate dynamic segments"
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-[#DDD5C7] shadow-xs">
          <span className="text-[11px] font-bold text-[#7A7268] block">Total Segments</span>
          <div className="text-xl font-bold text-[#1F313D] mt-1">{kpis.totalSegs} Active</div>
          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Dynamic Auto-Update</span>
        </div>

        <div className="bg-[#1F313D] text-white rounded-2xl p-4 border border-[#1F313D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#E5C9B3] block">High-Value VIPs</span>
            <Crown className="w-4 h-4 text-[#E5C9B3]" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{kpis.highValueCount} Diners</div>
          <span className="text-[10px] text-emerald-400 font-medium mt-0.5 block">&gt; $2,000 LTV or Platinum</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#DDD5C7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-600 block">At-Risk &amp; Inactive</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-bold text-[#1F313D] mt-1">{kpis.atRiskCount} Patrons</div>
          <span className="text-[10px] text-[#7A7268] font-medium mt-0.5 block">&gt; 60 days dormancy</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#DDD5C7] shadow-xs">
          <span className="text-[11px] font-bold text-[#7A7268] block">Tracked Segment Spend</span>
          <div className="text-xl font-bold text-[#79415A] mt-1">${kpis.totalSpendTracked.toLocaleString()}</div>
          <span className="text-[10px] text-[#5C5549] font-medium mt-0.5 block">Aggregated patron value</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#DDD5C7] shadow-xs">
          <span className="text-[11px] font-bold text-[#7A7268] block">Average Segment AOV</span>
          <div className="text-xl font-bold text-[#82401D] mt-1">${kpis.avgAOV}</div>
          <span className="text-[10px] text-[#5C5549] font-medium mt-0.5 block">Avg ticket across cohorts</span>
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
                  isActive
                    ? 'bg-[#1F313D] text-white shadow-xs'
                    : 'bg-white/80 text-[#5C5549] hover:bg-white hover:text-[#1F313D]'
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
              className="bg-white rounded-[22px] border border-[#DDD5C7] p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: seg.badgeColor }}
                    />
                    <h3 className="font-bold text-sm text-[#1F313D] group-hover:text-[#79415A] transition">
                      {seg.name}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      seg.isPredefined ? 'bg-[#EAE4D9] text-[#5C5549]' : 'bg-[#79415A]/10 text-[#79415A]'
                    }`}
                  >
                    {seg.isPredefined ? 'System AI' : 'Custom'}
                  </span>
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

                {/* Metrics Matrix */}
                <div className="mt-4 pt-3.5 border-t border-[#EAE4D9] grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#EAE4D9]">
                    <span className="text-[10px] text-[#7A7268] block">Audience</span>
                    <span className="text-sm font-bold text-[#1F313D] block mt-0.5">
                      {seg.memberCount} Diners
                    </span>
                  </div>

                  <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#EAE4D9]">
                    <span className="text-[10px] text-[#7A7268] block">Cohort Spend</span>
                    <span className="text-sm font-bold text-[#79415A] block mt-0.5">
                      ${seg.totalSegmentSpend.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#EAE4D9]">
                    <span className="text-[10px] text-[#7A7268] block">Avg AOV</span>
                    <span className="text-sm font-bold text-[#82401D] block mt-0.5">
                      ${seg.avgSegmentAOV}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3.5 border-t border-[#EAE4D9] flex items-center justify-between gap-2">
                <button
                  onClick={() => setInspectingSegment(seg)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F313D] hover:bg-[#2d4454] text-white text-xs font-bold transition shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" /> View Members ({seg.memberCount})
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenCampaignModal(seg)}
                    title="Launch Campaign with this segment"
                    className="p-1.5 rounded-lg bg-[#79415A]/10 hover:bg-[#79415A]/20 text-[#79415A] transition"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleExportCSV(seg)}
                    title="Export Audience CSV for Meta/Google/SMS"
                    className="p-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E4DCCE] text-[#5C5549] transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {!seg.isPredefined && (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(seg)}
                        title="Edit Rules"
                        className="p-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E4DCCE] text-[#5C5549] transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSegment(seg)}
                        title="Delete Segment"
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
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
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: inspectingSegment.badgeColor }}
                  />
                  <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                    {inspectingSegment.name}
                  </h3>
                </div>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Live cohort of {inspectingSegment.memberCount} patron profiles matching dynamic rules
                </p>
              </div>

              <div className="flex items-center gap-2">
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

            {/* Member List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {(() => {
                const evalData = evaluateSegmentMembers(inspectingSegment.rules, customers);
                if (evalData.members.length === 0) {
                  return (
                    <div className="text-center py-12 text-[#7A7268]">
                      <Users className="w-8 h-8 mx-auto opacity-30 mb-2" />
                      <p className="text-xs font-semibold">No active patrons match these segment rules currently.</p>
                    </div>
                  );
                }

                return evalData.members.map((c) => {
                  const daysSince = getDaysSinceDate(c.lastVisitDate);
                  return (
                    <div
                      key={c.id}
                      className="bg-white p-3.5 rounded-2xl border border-[#DDD5C7] shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={c.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={c.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-[#DDD5C7]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#1F313D]">{c.fullName}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                c.loyaltyTier === 'Platinum'
                                  ? 'bg-purple-100 text-purple-700'
                                  : c.loyaltyTier === 'Gold'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {c.loyaltyTier}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#7A7268] mt-0.5">
                            <span>{c.mobile}</span>
                            <span>•</span>
                            <span>{c.email}</span>
                          </div>
                          {c.favoriteFoodCategory && (
                            <div className="text-[10px] text-[#82401D] font-medium mt-0.5">
                              Fav: {c.favoriteFoodCategory}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-[#79415A] block">
                          ${c.totalSpend.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#7A7268] block mt-0.5">
                          {c.totalVisits || 0} visits • AOV: ${c.averageOrderValue?.toFixed(0) || 0}
                        </span>
                        <span
                          className={`text-[9px] font-bold block mt-0.5 ${
                            daysSince > 60 ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-white border-t border-[#DDD5C7] flex items-center justify-between">
              <span className="text-xs text-[#7A7268]">
                Segment rule evaluation executes dynamically against latest database state
              </span>
              <button
                onClick={() => {
                  const seg = inspectingSegment;
                  setInspectingSegment(null);
                  handleOpenCampaignModal(seg);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#79415A] text-white text-xs font-bold hover:bg-[#68334b] transition shadow-xs"
              >
                <Megaphone className="w-3.5 h-3.5" /> Launch Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT CUSTOM SEGMENT ── */}
      {isEditModalOpen && editingSegment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] w-full max-w-2xl rounded-[24px] border border-[#DDD5C7] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                  {editingSegment.id ? 'Edit Dynamic Segment' : 'Create New Customer Segment'}
                </h3>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Build dynamic filter rules to group patrons by spending, frequency, location, recency, or culinary preferences
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#EFE9DF] text-[#7A7268]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-5">
              {/* Segment Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F313D] block mb-1">Segment Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Weekend Big Spenders"
                    value={editingSegment.name || ''}
                    onChange={(e) => setEditingSegment({ ...editingSegment, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1F313D] block mb-1">Cohort Category</label>
                  <select
                    value={editingSegment.category || 'custom'}
                    onChange={(e) => setEditingSegment({ ...editingSegment, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                  >
                    <option value="high_value">High-Value VIPs</option>
                    <option value="at_risk">At-Risk & Inactive</option>
                    <option value="frequency">Visit Frequency</option>
                    <option value="spending">Spending & AOV</option>
                    <option value="location">Location & Outlet</option>
                    <option value="culinary">Culinary & Cuisine</option>
                    <option value="loyalty">Loyalty Tier</option>
                    <option value="custom">Custom Criteria</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-[#1F313D] block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Target purpose for marketing and kitchen hospitality"
                  value={editingSegment.description || ''}
                  onChange={(e) => setEditingSegment({ ...editingSegment, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                />
              </div>

              {/* Combinator (AND / OR) */}
              <div className="p-3 bg-white rounded-xl border border-[#DDD5C7] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1F313D] block">Condition Matching Logic</span>
                  <span className="text-[11px] text-[#7A7268]">
                    Should a customer match all conditions (AND) or any single condition (OR)?
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-[#EFE9DF] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingSegment({
                        ...editingSegment,
                        rules: { ...editingSegment.rules!, combinator: 'AND' },
                      })
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      editingSegment.rules?.combinator === 'AND'
                        ? 'bg-[#1F313D] text-white shadow-xs'
                        : 'text-[#5C5549]'
                    }`}
                  >
                    Match ALL (AND)
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingSegment({
                        ...editingSegment,
                        rules: { ...editingSegment.rules!, combinator: 'OR' },
                      })
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      editingSegment.rules?.combinator === 'OR'
                        ? 'bg-[#1F313D] text-white shadow-xs'
                        : 'text-[#5C5549]'
                    }`}
                  >
                    Match ANY (OR)
                  </button>
                </div>
              </div>

              {/* Dynamic Rules Rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#1F313D]">Segment Rules &amp; Conditions</label>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="flex items-center gap-1 text-xs font-bold text-[#79415A] hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Condition
                  </button>
                </div>

                <div className="space-y-2">
                  {editingSegment.rules?.conditions.map((cond, idx) => (
                    <div
                      key={cond.id}
                      className="p-3 bg-white rounded-xl border border-[#DDD5C7] flex items-center gap-2 flex-wrap sm:flex-nowrap"
                    >
                      {/* Field */}
                      <select
                        value={cond.field}
                        onChange={(e) => handleUpdateCondition(cond.id, { field: e.target.value as any })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#EFE9DF] text-xs font-bold text-[#1F313D] border border-[#DDD5C7] flex-1"
                      >
                        <option value="totalSpend">Total Spending ($)</option>
                        <option value="visitCount">Visit Frequency (Count)</option>
                        <option value="avgOrderValue">Average Order Value ($)</option>
                        <option value="daysSinceLastVisit">Last Visit Date (Days Ago)</option>
                        <option value="city">Location (City)</option>
                        <option value="favoriteCategory">Favorite Food Category</option>
                        <option value="loyaltyTier">Loyalty Membership Tier</option>
                        <option value="customerCategory">Customer Category</option>
                      </select>

                      {/* Operator */}
                      <select
                        value={cond.operator}
                        onChange={(e) => handleUpdateCondition(cond.id, { operator: e.target.value as any })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#EFE9DF] text-xs font-bold text-[#1F313D] border border-[#DDD5C7]"
                      >
                        <option value="gte">&ge; Greater / Equal</option>
                        <option value="lte">&le; Less / Equal</option>
                        <option value="eq">= Equals</option>
                        <option value="neq">&ne; Not Equal</option>
                        <option value="contains">Contains</option>
                      </select>

                      {/* Value Input */}
                      {cond.field === 'loyaltyTier' ? (
                        <select
                          value={cond.value}
                          onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-white text-xs font-semibold text-[#1F313D] border border-[#DDD5C7] flex-1"
                        >
                          <option value="Bronze">Bronze</option>
                          <option value="Silver">Silver</option>
                          <option value="Gold">Gold</option>
                          <option value="Platinum">Platinum</option>
                        </select>
                      ) : cond.field === 'customerCategory' ? (
                        <select
                          value={cond.value}
                          onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-white text-xs font-semibold text-[#1F313D] border border-[#DDD5C7] flex-1"
                        >
                          <option value="NEW">NEW</option>
                          <option value="REGULAR">REGULAR</option>
                          <option value="VIP">VIP</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      ) : (
                        <input
                          type={['totalSpend', 'visitCount', 'avgOrderValue', 'daysSinceLastVisit'].includes(cond.field) ? 'number' : 'text'}
                          value={cond.value ?? ''}
                          onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                          placeholder="Threshold value..."
                          className="px-2.5 py-1.5 rounded-lg bg-white text-xs font-semibold text-[#1F313D] border border-[#DDD5C7] flex-1"
                        />
                      )}

                      {/* Delete Condition Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(cond.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview Strip */}
              <div className="p-3.5 bg-[#1F313D] text-white rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Dynamic Cohort Real-Time Calculation:</span>
                </div>
                <span className="text-xs font-bold text-emerald-300">
                  Matches {livePreviewCount} patrons right now
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-[#DDD5C7] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549] hover:bg-[#EFE9DF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSegment}
                className="px-4 py-2 rounded-xl bg-[#79415A] text-white text-xs font-bold hover:bg-[#68334b] shadow-xs"
              >
                Save Dynamic Segment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: LAUNCH MARKETING CAMPAIGN WITH SEGMENT ── */}
      {isCampaignModalOpen && campaignSegment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] w-full max-w-lg rounded-[24px] border border-[#DDD5C7] shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                  Launch Targeted Campaign
                </h3>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Targeting <span className="font-bold text-[#1F313D]">{campaignSegment.memberCount} patrons</span> in {campaignSegment.name}
                </p>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#EFE9DF] text-[#7A7268]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-5">
              {/* Channel Selector */}
              <div>
                <label className="text-xs font-bold text-[#1F313D] block mb-1">Marketing Channel</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'WhatsApp', label: 'WhatsApp API' },
                    { id: 'SMS', label: 'SMS Blast' },
                    { id: 'Email', label: 'Email Newsletter' },
                    { id: 'Meta Custom Audience', label: 'Meta Ads Audience' },
                    { id: 'Google Customer Match', label: 'Google Ads Match' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setCampaignChannel(ch.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold text-center border transition ${
                        campaignChannel === ch.id
                          ? 'bg-[#1F313D] text-white border-[#1F313D]'
                          : 'bg-white text-[#5C5549] border-[#DDD5C7] hover:bg-[#EAE4D9]'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campaign Title */}
              <div>
                <label className="text-xs font-bold text-[#1F313D] block mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                />
              </div>

              {/* Offer Headline */}
              <div>
                <label className="text-xs font-bold text-[#1F313D] block mb-1">Offer &amp; Message Headline</label>
                <input
                  type="text"
                  value={offerHeadline}
                  onChange={(e) => setOfferHeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                />
              </div>

              {/* Promo Code & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F313D] block mb-1">Promo Code</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs font-mono font-bold text-[#79415A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1F313D] block mb-1">Discount %</label>
                  <input
                    type="number"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs font-bold text-[#1F313D]"
                  />
                </div>
              </div>

              {/* Summary Pill */}
              <div className="p-3 bg-[#EFE9DF] rounded-xl text-xs text-[#5C5549] flex items-center justify-between">
                <span>Total Reachable Patrons:</span>
                <span className="font-bold text-[#1F313D]">{campaignSegment.memberCount} Patrons with Opt-In</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-[#DDD5C7] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549] hover:bg-[#EFE9DF]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDispatching}
                onClick={handleDispatchCampaign}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#79415A] text-white text-xs font-bold hover:bg-[#68334b] shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                {isDispatching ? 'Dispatching...' : 'Dispatch Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
