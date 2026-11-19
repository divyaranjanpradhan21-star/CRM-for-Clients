import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Users,
  Search,
  Filter,
  Plus,
  Building,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Award,
  DollarSign,
  Briefcase,
  X,
  Edit2,
  Trash2,
  MessageSquare,
  Send,
  Download,
  RefreshCw,
  Sparkles,
  Layers,
  BarChart3,
  GitMerge,
  ExternalLink,
  ChevronRight,
  Tag,
  Share2,
  FileText
} from 'lucide-react';
import {
  LeadRecord,
  LeadSource,
  LeadPriority,
  LeadStatus,
  LostReason,
  LeadInteraction,
  DuplicateLeadGroup,
  fetchLeads,
  saveLead,
  updateLeadStatus,
  addLeadInteraction,
  scheduleLeadFollowUp,
  convertLeadToCustomer,
  detectDuplicateLeads,
  mergeDuplicateLeads,
  captureInboundLead,
  getLeadConversionMetrics,
  generateLeadId
} from '../../lib/leadManagementApi';
import { fetchEmployees, EmployeeRecord } from '../../lib/employeeManagementApi';

export const LeadManagementView: React.FC<{ orgId?: string }> = () => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [staffList, setStaffList] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'analytics'>('kanban');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Lead Drawer
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingLead, setEditingLead] = useState<Partial<LeadRecord> | null>(null);

  const [isLostModalOpen, setIsLostModalOpen] = useState<boolean>(false);
  const [lostReasonTargetLead, setLostReasonTargetLead] = useState<LeadRecord | null>(null);
  const [selectedLostReason, setSelectedLostReason] = useState<LostReason>('price_too_high');
  const [lostNotesInput, setLostNotesInput] = useState<string>('');

  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState<boolean>(false);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<DuplicateLeadGroup | null>(null);

  // Interaction Log Inputs for Drawer
  const [newInteractionType, setNewInteractionType] = useState<LeadInteraction['type']>('CALL');
  const [newInteractionSummary, setNewInteractionSummary] = useState<string>('');
  const [newInteractionDetails, setNewInteractionDetails] = useState<string>('');

  // Follow-up Scheduling Inputs
  const [newFollowUpDate, setNewFollowUpDate] = useState<string>('');
  const [newFollowUpNotes, setNewFollowUpNotes] = useState<string>('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allLeads = await fetchLeads();
      setLeads(allLeads);
      const employees = await fetchEmployees();
      setStaffList(employees);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Duplicate leads check
  const duplicateGroups = useMemo(() => {
    return detectDuplicateLeads(leads);
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchSearch =
        !searchQuery ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSource = sourceFilter === 'ALL' || lead.source === sourceFilter;
      const matchPriority = priorityFilter === 'ALL' || lead.priority === priorityFilter;
      const matchStatus = statusFilter === 'ALL' || lead.status === statusFilter;

      return matchSearch && matchSource && matchPriority && matchStatus;
    });
  }, [leads, searchQuery, sourceFilter, priorityFilter, statusFilter]);

  // Conversion analytics metrics
  const metrics = useMemo(() => {
    return getLeadConversionMetrics(leads);
  }, [leads]);

  // Pipeline Columns
  const PIPELINE_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
    { id: 'NEW', label: 'New / Inbound', color: '#2563EB' },
    { id: 'CONTACTED', label: 'Contacted', color: '#D97706' },
    { id: 'IN_DISCUSSION', label: 'In Discussion', color: '#7C3AED' },
    { id: 'PROPOSAL_SENT', label: 'Proposal Sent', color: '#79415A' },
    { id: 'QUALIFIED', label: 'Qualified', color: '#059669' },
    { id: 'CONVERTED', label: 'Converted (Won)', color: '#10B981' },
    { id: 'LOST', label: 'Lost / Closed', color: '#6B7280' },
  ];

  // Quick Inbound Simulation Trigger
  const handleSimulateInboundLead = async (type: 'banquet_form' | 'instagram_ad' | 'google_ad') => {
    let payload: any;
    if (type === 'banquet_form') {
      payload = {
        source: 'website_form',
        name: 'Sunita Mehra',
        phone: '+91 98204 ' + Math.floor(10000 + Math.random() * 90000),
        email: `sunita.mehra.${Math.floor(Math.random() * 100)}@horizonpharma.in`,
        company: 'Horizon Pharmaceuticals',
        sourceDetails: 'Website Corporate Catering Inquiry Form (65 guests)',
        eventType: 'Corporate Banquet',
        guestCount: 65,
        estimatedValue: 3200,
        notes: 'Inquired for Annual Board Dinner with continental buffet and mocktail bar setup.',
      };
    } else if (type === 'instagram_ad') {
      payload = {
        source: 'social_media_instagram',
        name: 'Kabir Singhania',
        phone: '+91 98199 ' + Math.floor(10000 + Math.random() * 90000),
        email: `kabir.s.${Math.floor(Math.random() * 100)}@gmail.com`,
        company: 'Private Host',
        sourceDetails: 'Instagram Story Sponsored Ad: "Luxury Terrace Birthday Soirees"',
        eventType: 'Birthday Celebration',
        guestCount: 25,
        estimatedValue: 1400,
        notes: 'Requested private terrace section for 25th birthday with custom DJ setup.',
      };
    } else {
      payload = {
        source: 'google_ads',
        name: 'Rohan Gupta',
        phone: '+91 98200 ' + Math.floor(10000 + Math.random() * 90000),
        email: `rohan.gupta.${Math.floor(Math.random() * 100)}@apexfin.com`,
        company: 'Apex Capital Advisors',
        sourceDetails: 'Google Search Ad: "Exclusive Fine Dining Venue Mumbai"',
        eventType: 'Private Dining',
        guestCount: 18,
        estimatedValue: 1650,
        notes: 'Private dinner for visiting international managing directors.',
      };
    }

    const created = await captureInboundLead(payload);
    showToast(`Inbound Lead Captured from ${created.sourceDetails}!`);
    loadData();
    setSelectedLead(created);
  };

  // Open Create Lead Modal
  const handleOpenCreateModal = () => {
    setEditingLead({
      name: '',
      phone: '',
      email: '',
      company: '',
      source: 'website_form',
      sourceDetails: 'Manual Inbound Entry',
      priority: 'MEDIUM',
      status: 'NEW',
      assignedStaffName: staffList[0]?.fullName || 'Priya Sharma (Floor Manager)',
      assignedStaffId: staffList[0]?.id || 'emp-002',
      estimatedValue: 1000,
      guestCount: 20,
      eventType: 'Private Dining',
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  // Save Lead Handler
  const handleSaveLead = async () => {
    if (!editingLead?.name?.trim() || (!editingLead?.phone?.trim() && !editingLead?.email?.trim())) {
      showToast('Lead name and contact details (phone or email) are mandatory', 'error');
      return;
    }

    const res = await saveLead(editingLead);
    if (res.success) {
      showToast(`Lead "${res.lead?.name}" saved successfully`);
      setIsCreateModalOpen(false);
      setEditingLead(null);
      loadData();
      if (selectedLead && res.lead?.id === selectedLead.id) {
        setSelectedLead(res.lead);
      }
    } else {
      showToast(res.error || 'Failed to save lead', 'error');
    }
  };

  // Advance Pipeline Status
  const handleStatusChange = async (lead: LeadRecord, nextStatus: LeadStatus) => {
    if (nextStatus === 'LOST') {
      setLostReasonTargetLead(lead);
      setSelectedLostReason('price_too_high');
      setLostNotesInput('');
      setIsLostModalOpen(true);
      return;
    }

    const res = await updateLeadStatus(lead.id, nextStatus);
    if (res.success) {
      showToast(`Lead advanced to ${nextStatus}`);
      loadData();
      if (selectedLead?.id === lead.id && res.lead) {
        setSelectedLead(res.lead);
      }
    }
  };

  // Confirm Lost Reason
  const handleConfirmLostReason = async () => {
    if (!lostReasonTargetLead) return;
    const res = await updateLeadStatus(lostReasonTargetLead.id, 'LOST', {
      lostReason: selectedLostReason,
      lostNotes: lostNotesInput,
    });
    if (res.success) {
      showToast('Lead recorded as Lost with reason');
      setIsLostModalOpen(false);
      setLostReasonTargetLead(null);
      loadData();
      if (selectedLead?.id === lostReasonTargetLead.id && res.lead) {
        setSelectedLead(res.lead);
      }
    }
  };

  // Convert Lead to Customer
  const handleConvertLead = async (lead: LeadRecord) => {
    if (window.confirm(`Convert qualified lead "${lead.name}" (${lead.company}) into a registered customer profile?`)) {
      const res = await convertLeadToCustomer(lead.id);
      if (res.success) {
        showToast(`Lead successfully converted to registered Customer ID: ${res.customerId}!`);
        loadData();
        const updated = leads.find((l) => l.id === lead.id);
        if (updated) setSelectedLead({ ...updated, status: 'CONVERTED', convertedCustomerId: res.customerId });
      } else {
        showToast(res.error || 'Conversion failed', 'error');
      }
    }
  };

  // Add Interaction to Drawer
  const handleAddInteraction = async () => {
    if (!selectedLead || !newInteractionSummary.trim()) {
      showToast('Please enter an interaction summary', 'error');
      return;
    }
    const res = await addLeadInteraction(selectedLead.id, {
      type: newInteractionType,
      summary: newInteractionSummary.trim(),
      details: newInteractionDetails.trim() || undefined,
      performedBy: 'Floor Admin',
    });
    if (res.success) {
      showToast('Interaction logged successfully');
      setNewInteractionSummary('');
      setNewInteractionDetails('');
      loadData();
      // Update selected lead view
      const all = await fetchLeads();
      const updated = all.find((l) => l.id === selectedLead.id);
      if (updated) setSelectedLead(updated);
    }
  };

  // Schedule Follow-Up Date
  const handleScheduleFollowUp = async () => {
    if (!selectedLead || !newFollowUpDate) {
      showToast('Please select a valid follow-up date', 'error');
      return;
    }
    const res = await scheduleLeadFollowUp(selectedLead.id, newFollowUpDate, newFollowUpNotes);
    if (res.success) {
      showToast(`Follow-up scheduled for ${newFollowUpDate}`);
      setNewFollowUpNotes('');
      loadData();
      const all = await fetchLeads();
      const updated = all.find((l) => l.id === selectedLead.id);
      if (updated) setSelectedLead(updated);
    }
  };

  // Merge Duplicate Leads
  const handleMergeDuplicates = async (primaryId: string, secondaryId: string) => {
    const res = await mergeDuplicateLeads(primaryId, secondaryId);
    if (res.success) {
      showToast('Duplicate leads successfully merged into primary record');
      setIsDuplicateModalOpen(false);
      setSelectedDuplicateGroup(null);
      loadData();
    } else {
      showToast(res.error || 'Failed to merge leads', 'error');
    }
  };

  // Follow-up status helper
  const getFollowUpStatus = (dateStr?: string) => {
    if (!dateStr) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr < todayStr) return { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200' };
    if (dateStr === todayStr) return { label: 'Due Today', color: 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse' };
    return { label: `Upcoming (${dateStr})`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

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
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1F313D] leading-tight">
                Inbound Lead &amp; Banquet Sales Pipeline
              </h2>
              <p className="text-xs text-[#7A7268] mt-0.5">
                Capture web &amp; social leads, assign to floor staff, schedule follow-ups, convert into registered patrons, and detect duplicates
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Inbound Simulator Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#EAE4D9] text-[#1F313D] text-xs font-bold transition border border-[#DDD5C7]">
              <Sparkles className="w-3.5 h-3.5 text-[#79415A]" /> Simulate Inbound Lead
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-[#DDD5C7] p-1.5 z-30 hidden group-hover:block animate-in fade-in">
              <button
                onClick={() => handleSimulateInboundLead('banquet_form')}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] text-[#1F313D]"
              >
                🌐 Web Banquet Form (65 guests)
              </button>
              <button
                onClick={() => handleSimulateInboundLead('instagram_ad')}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] text-[#1F313D]"
              >
                📸 Instagram Ad DM (25 guests)
              </button>
              <button
                onClick={() => handleSimulateInboundLead('google_ad')}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] text-[#1F313D]"
              >
                🔍 Google Search Ad Lead
              </button>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-[#79415A] hover:bg-[#68334b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Create New Lead
          </button>
        </div>
      </div>

      {/* Duplicate Leads Warning Banner */}
      {duplicateGroups.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-xs">Duplicate Leads Detected!</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Found {duplicateGroups.length} potential duplicate inquiry groups matching identical phone numbers or email addresses.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedDuplicateGroup(duplicateGroups[0]);
              setIsDuplicateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition"
          >
            <GitMerge className="w-3.5 h-3.5" /> Resolve &amp; Merge
          </button>
        </div>
      )}

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-[#DDD5C7] shadow-xs">
          <span className="text-[11px] font-bold text-[#7A7268] block">Total Inbound Leads</span>
          <div className="text-xl font-bold text-[#1F313D] mt-1">{metrics.totalLeads} Records</div>
          <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">{metrics.activeLeads} in active follow-up</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#DDD5C7] shadow-xs">
          <span className="text-[11px] font-bold text-[#7A7268] block">Active Pipeline Value</span>
          <div className="text-xl font-bold text-[#79415A] mt-1">${metrics.totalPipelineValue.toLocaleString()}</div>
          <span className="text-[10px] text-[#5C5549] font-medium mt-0.5 block">Estimated banquet bookings</span>
        </div>

        <div className="bg-[#1F313D] text-white rounded-2xl p-4 border border-[#1F313D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#E5C9B3] block">Conversion Rate</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{metrics.conversionRate}%</div>
          <span className="text-[10px] text-white/70 font-medium mt-0.5 block">{metrics.convertedCount} leads won &amp; dining</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#DDD5C7] shadow-xs">
          <span className="text-[11px] font-bold text-[#7A7268] block">Won Pipeline Revenue</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">${metrics.wonPipelineValue.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Closed converted contracts</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#DDD5C7] shadow-xs">
          <span className="text-[11px] font-bold text-[#7A7268] block">Avg Conversion Cycle</span>
          <div className="text-xl font-bold text-[#82401D] mt-1">{metrics.averageDaysToConvert} Days</div>
          <span className="text-[10px] text-[#5C5549] font-medium mt-0.5 block">From inquiry to patron</span>
        </div>
      </div>

      {/* Toolbar & View Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#EFE9DF] p-2.5 rounded-2xl border border-[#DDD5C7]">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-[#DDD5C7]">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'kanban' ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Kanban Pipeline
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'table' ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Tabular List
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'analytics' ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Conversion Reports
          </button>
        </div>

        {/* Right: Search & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
          >
            <option value="ALL">All Inbound Sources</option>
            <option value="website_form">Website Form</option>
            <option value="social_media_meta">Meta Ads</option>
            <option value="social_media_instagram">Instagram</option>
            <option value="google_ads">Google Ads</option>
            <option value="referral">Referral</option>
            <option value="phone_inquiry">Phone Inbound</option>
            <option value="linkedin">LinkedIn</option>
          </select>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] placeholder-[#7A7268] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── VIEW 1: KANBAN PIPELINE ── */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {PIPELINE_COLUMNS.map((col) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.id);
            const colValue = colLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

            return (
              <div
                key={col.id}
                className="w-72 flex-shrink-0 bg-[#EFE9DF]/80 rounded-[22px] border border-[#DDD5C7] p-3 flex flex-col justify-between"
              >
                {/* Column Header */}
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD5C7]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                      <h4 className="font-bold text-xs text-[#1F313D]">{col.label}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white text-[#5C5549] border border-[#DDD5C7]">
                        {colLeads.length}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-[#79415A]">
                      ${colValue.toLocaleString()}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="space-y-2.5 min-h-[300px]">
                    {colLeads.map((lead) => {
                      const followUpAlert = getFollowUpStatus(lead.nextFollowUpDate);

                      return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="bg-white p-3.5 rounded-2xl border border-[#DDD5C7] shadow-xs hover:shadow-md hover:border-[#79415A] transition cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div>
                              <span className="text-[10px] font-mono text-[#7A7268] block">{lead.id}</span>
                              <h5 className="font-bold text-xs text-[#1F313D] group-hover:text-[#79415A] transition mt-0.5">
                                {lead.name}
                              </h5>
                              <span className="text-[11px] text-[#5C5549] flex items-center gap-1 mt-0.5">
                                <Building className="w-3 h-3 text-[#7A7268]" /> {lead.company}
                              </span>
                            </div>

                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                lead.priority === 'URGENT'
                                  ? 'bg-red-100 text-red-700'
                                  : lead.priority === 'HIGH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {lead.priority}
                            </span>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-[#EAE4D9]">
                            <span className="font-bold text-[#79415A]">${lead.estimatedValue.toLocaleString()}</span>
                            <span className="text-[#7A7268] text-[10px]">{lead.guestCount || 0} Guests</span>
                          </div>

                          {/* Source tag & Follow-up status */}
                          <div className="mt-2 flex items-center justify-between gap-1">
                            <span className="text-[9px] font-semibold text-[#5C5549] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#EAE4D9] truncate max-w-[120px]">
                              {lead.source.replace('_', ' ')}
                            </span>

                            {followUpAlert && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${followUpAlert.color}`}
                              >
                                {followUpAlert.label}
                              </span>
                            )}
                          </div>

                          {/* Quick Pipeline Transition Bar */}
                          <div className="mt-2.5 pt-2 border-t border-[#EAE4D9] flex items-center justify-between text-[10px]">
                            <span className="text-[#7A7268] truncate max-w-[100px]">
                              {lead.assignedStaffName.split(' ')[0]}
                            </span>

                            {col.id !== 'CONVERTED' && col.id !== 'LOST' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentIdx = PIPELINE_COLUMNS.findIndex((p) => p.id === col.id);
                                  if (currentIdx >= 0 && currentIdx < PIPELINE_COLUMNS.length - 2) {
                                    handleStatusChange(lead, PIPELINE_COLUMNS[currentIdx + 1].id);
                                  }
                                }}
                                className="flex items-center gap-1 text-[10px] font-bold text-[#79415A] hover:underline"
                              >
                                Advance <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            {col.id === 'QUALIFIED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConvertLead(lead);
                                }}
                                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded hover:bg-emerald-100 transition"
                              >
                                Convert 🎉
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW 2: TABULAR LIST ── */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-[24px] border border-[#DDD5C7] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EFE9DF] text-[#1F313D] font-bold uppercase text-[10px] tracking-wider border-b border-[#DDD5C7]">
                <tr>
                  <th className="p-3.5">Lead Contact</th>
                  <th className="p-3.5">Company / Host</th>
                  <th className="p-3.5">Source &amp; Ingestion</th>
                  <th className="p-3.5">Stage Status</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Est. Value</th>
                  <th className="p-3.5">Assigned Staff</th>
                  <th className="p-3.5">Next Follow-up</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {filteredLeads.map((lead) => {
                  const followUp = getFollowUpStatus(lead.nextFollowUpDate);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-[#FAF7F2] cursor-pointer transition"
                    >
                      <td className="p-3.5">
                        <span className="font-bold text-xs text-[#1F313D] block">{lead.name}</span>
                        <span className="text-[10px] text-[#7A7268] block mt-0.5">{lead.phone} • {lead.email}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-xs text-[#1F313D] block">{lead.company}</span>
                        <span className="text-[10px] text-[#7A7268]">{lead.eventType || 'Banquet'} ({lead.guestCount || 0} pax)</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-[#EFE9DF] text-[#5C5549] uppercase">
                          {lead.source.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-[#7A7268] block mt-0.5 truncate max-w-[140px]">
                          {lead.sourceDetails}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            lead.status === 'CONVERTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : lead.status === 'LOST'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            lead.priority === 'URGENT'
                              ? 'bg-red-100 text-red-700'
                              : lead.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {lead.priority}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-[#79415A]">
                        ${lead.estimatedValue.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-[#5C5549] font-medium">
                        {lead.assignedStaffName}
                      </td>

                      <td className="p-3.5">
                        {followUp ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${followUp.color}`}>
                            {followUp.label}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#7A7268]">-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {lead.status === 'QUALIFIED' ? (
                          <button
                            onClick={() => handleConvertLead(lead)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition"
                          >
                            Convert
                          </button>
                        ) : lead.status !== 'CONVERTED' && lead.status !== 'LOST' ? (
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="px-2.5 py-1 rounded-lg bg-[#EFE9DF] text-[#1F313D] font-bold text-[11px] hover:bg-[#EAE4D9] transition"
                          >
                            Manage
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#7A7268]">Closed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW 3: CONVERSION REPORTS & ANALYTICS ── */}
      {viewMode === 'analytics' && (
        <div className="space-y-5">
          {/* Funnel Stage Breakdown */}
          <div className="bg-white p-5 rounded-[24px] border border-[#DDD5C7] shadow-xs">
            <h3 className="font-serif text-base font-bold text-[#1F313D] mb-4">
              Lead Conversion Funnel Progression
            </h3>

            <div className="space-y-3">
              {PIPELINE_COLUMNS.map((col) => {
                const count = metrics.stageBreakdown[col.id] || 0;
                const pct = metrics.totalLeads > 0 ? ((count / metrics.totalLeads) * 100).toFixed(0) : 0;

                return (
                  <div key={col.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1F313D]">
                      <span>{col.label}</span>
                      <span>{count} leads ({pct}%)</span>
                    </div>
                    <div className="w-full bg-[#EFE9DF] h-3.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: col.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Inbound Source Performance */}
            <div className="bg-white p-5 rounded-[24px] border border-[#DDD5C7] shadow-xs">
              <h3 className="font-serif text-base font-bold text-[#1F313D] mb-3">
                Lead Source Conversion Efficiency
              </h3>
              <div className="divide-y divide-[#EAE4D9]">
                {metrics.sourceBreakdown.map((src) => (
                  <div key={src.source} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#1F313D] block uppercase">
                        {src.source.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-[#7A7268]">
                        {src.count} total leads • {src.converted} converted
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-emerald-700 block">{src.rate}% Win Rate</span>
                      <span className="text-[10px] text-[#79415A] font-semibold">${src.revenue.toLocaleString()} Revenue</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lost Reasons Breakdown */}
            <div className="bg-white p-5 rounded-[24px] border border-[#DDD5C7] shadow-xs">
              <h3 className="font-serif text-base font-bold text-[#1F313D] mb-3">
                Lost Lead Reasons Analysis
              </h3>
              {metrics.lostReasonsBreakdown.length === 0 ? (
                <p className="text-xs text-[#7A7268] py-8 text-center font-medium">No lost leads recorded.</p>
              ) : (
                <div className="divide-y divide-[#EAE4D9]">
                  {metrics.lostReasonsBreakdown.map((item) => (
                    <div key={item.reason} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#1F313D] block uppercase">
                          {item.reason.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-[#7A7268]">{item.count} deals lost</span>
                      </div>
                      <span className="font-bold text-red-600">{item.percentage}% of lost</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER: LEAD DETAILS & TIMELINE ── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-[#FAF7F2] w-full max-w-xl h-full shadow-2xl flex flex-col justify-between border-l border-[#DDD5C7] animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-[#DDD5C7] bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#79415A] bg-[#79415A]/10 px-2 py-0.5 rounded">
                    {selectedLead.id}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#1F313D]">{selectedLead.name}</h3>
                </div>
                <span className="text-xs text-[#7A7268] mt-0.5 block">
                  {selectedLead.company} • {selectedLead.eventType || 'Banquet'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedLead.status === 'QUALIFIED' && (
                  <button
                    onClick={() => handleConvertLead(selectedLead)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs"
                  >
                    Convert to Customer 🎉
                  </button>
                )}
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 rounded-xl text-[#7A7268] hover:bg-[#EFE9DF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-[#DDD5C7] text-xs">
                <div>
                  <span className="text-[10px] text-[#7A7268] block">Phone Number</span>
                  <span className="font-bold text-[#1F313D] flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-[#79415A]" /> {selectedLead.phone}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A7268] block">Email</span>
                  <span className="font-bold text-[#1F313D] flex items-center gap-1 mt-0.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#79415A]" /> {selectedLead.email}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A7268] block">Estimated Value</span>
                  <span className="font-bold text-[#79415A] text-sm mt-0.5 block">
                    ${selectedLead.estimatedValue.toLocaleString()} ({selectedLead.guestCount || 0} pax)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A7268] block">Owner / Assigned</span>
                  <span className="font-bold text-[#1F313D] mt-0.5 block">{selectedLead.assignedStaffName}</span>
                </div>
              </div>

              {/* Status & Priority Controller */}
              <div className="bg-white p-4 rounded-2xl border border-[#DDD5C7] flex items-center justify-between gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#7A7268] block uppercase">Pipeline Stage</label>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusChange(selectedLead, e.target.value as any)}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-[#EFE9DF] text-xs font-bold text-[#1F313D] border border-[#DDD5C7]"
                  >
                    {PIPELINE_COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#7A7268] block uppercase">Priority</span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-md uppercase inline-block mt-1 ${
                      selectedLead.priority === 'URGENT'
                        ? 'bg-red-100 text-red-700'
                        : selectedLead.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {selectedLead.priority}
                  </span>
                </div>
              </div>

              {/* Schedule Follow-up Box */}
              <div className="bg-white p-4 rounded-2xl border border-[#DDD5C7] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1F313D] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#79415A]" /> Schedule Next Follow-Up
                  </span>
                  {selectedLead.nextFollowUpDate && (
                    <span className="text-[10px] font-bold text-[#79415A]">
                      Current: {selectedLead.nextFollowUpDate}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={newFollowUpDate}
                    onChange={(e) => setNewFollowUpDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                  />
                  <input
                    type="text"
                    placeholder="Reminder note..."
                    value={newFollowUpNotes}
                    onChange={(e) => setNewFollowUpNotes(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D] flex-1"
                  />
                  <button
                    onClick={handleScheduleFollowUp}
                    className="px-3 py-1.5 rounded-xl bg-[#1F313D] text-white text-xs font-bold hover:bg-[#2d4454]"
                  >
                    Set
                  </button>
                </div>
              </div>

              {/* Log Quick Interaction */}
              <div className="bg-white p-4 rounded-2xl border border-[#DDD5C7] space-y-3">
                <span className="text-xs font-bold text-[#1F313D] block">Log Interaction History</span>

                <div className="flex items-center gap-1.5">
                  {(['CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'NOTE', 'PROPOSAL'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewInteractionType(type)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                        newInteractionType === type
                          ? 'bg-[#79415A] text-white border-[#79415A]'
                          : 'bg-[#FAF7F2] text-[#5C5549] border-[#DDD5C7]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Summary (e.g. Sent revised per-head quote via WhatsApp)..."
                  value={newInteractionSummary}
                  onChange={(e) => setNewInteractionSummary(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                />

                <textarea
                  rows={2}
                  placeholder="Additional conversation notes (optional)..."
                  value={newInteractionDetails}
                  onChange={(e) => setNewInteractionDetails(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                />

                <button
                  onClick={handleAddInteraction}
                  className="w-full py-1.5 rounded-xl bg-[#79415A] text-white text-xs font-bold hover:bg-[#68334b] transition"
                >
                  Save Interaction to Timeline
                </button>
              </div>

              {/* Interaction Timeline */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-[#1F313D] block">Activity &amp; Touchpoint Timeline</span>

                <div className="space-y-2">
                  {selectedLead.interactionHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-xl border border-[#DDD5C7] text-xs shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#79415A] bg-[#79415A]/10 px-1.5 py-0.2 rounded uppercase">
                          {item.type}
                        </span>
                        <span className="text-[#7A7268]">
                          {new Date(item.timestamp).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className="font-bold text-[#1F313D] block">{item.summary}</span>
                      {item.details && <p className="text-[11px] text-[#5C5549]">{item.details}</p>}
                      <span className="text-[10px] text-[#7A7268] block mt-1">Logged by: {item.performedBy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE NEW LEAD ── */}
      {isCreateModalOpen && editingLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] w-full max-w-xl rounded-[24px] border border-[#DDD5C7] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">Create New Sales Lead</h3>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Record new catering, banquet, or group dining sales inquiry
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-xl hover:bg-[#EFE9DF]">
                <X className="w-5 h-5 text-[#7A7268]" />
              </button>
            </div>

            <div className="space-y-3.5 mt-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Contact Name *</label>
                  <input
                    type="text"
                    value={editingLead.name || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    placeholder="Guest or Organizer full name"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] font-semibold text-[#1F313D]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={editingLead.company || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                    placeholder="Company name or 'Individual'"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] font-semibold text-[#1F313D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={editingLead.phone || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    placeholder="+91 98200 00000"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] font-semibold text-[#1F313D]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingLead.email || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] font-semibold text-[#1F313D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Inbound Source</label>
                  <select
                    value={editingLead.source}
                    onChange={(e) => setEditingLead({ ...editingLead, source: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] font-semibold text-[#1F313D]"
                  >
                    <option value="website_form">Website Form</option>
                    <option value="social_media_meta">Meta Ads</option>
                    <option value="social_media_instagram">Instagram</option>
                    <option value="google_ads">Google Search</option>
                    <option value="referral">Referral</option>
                    <option value="phone_inquiry">Phone Inbound</option>
                    <option value="walk_in">Walk-in Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Priority</label>
                  <select
                    value={editingLead.priority}
                    onChange={(e) => setEditingLead({ ...editingLead, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] font-semibold text-[#1F313D]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Est. Value ($)</label>
                  <input
                    type="number"
                    value={editingLead.estimatedValue || 1000}
                    onChange={(e) => setEditingLead({ ...editingLead, estimatedValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] font-semibold text-[#1F313D]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Assign to Floor / Banquet Staff</label>
                <select
                  value={editingLead.assignedStaffId}
                  onChange={(e) => {
                    const found = staffList.find((s) => s.id === e.target.value);
                    setEditingLead({
                      ...editingLead,
                      assignedStaffId: e.target.value,
                      assignedStaffName: found ? found.fullName : 'Floor Manager',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] font-semibold text-[#1F313D]"
                >
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Inquiry Requirements &amp; Notes</label>
                <textarea
                  rows={3}
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  placeholder="Guest count, date, dietary requirements..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] font-semibold text-[#1F313D]"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#DDD5C7] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549] hover:bg-[#EFE9DF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLead}
                className="px-4 py-2 rounded-xl bg-[#79415A] text-white text-xs font-bold hover:bg-[#68334b] shadow-xs"
              >
                Save Lead Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RECORD LOST REASON ── */}
      {isLostModalOpen && lostReasonTargetLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] w-full max-w-md rounded-[24px] border border-[#DDD5C7] shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-base font-bold text-red-600">Record Lost Reason</h3>
                <p className="text-xs text-[#7A7268] mt-0.5">Closing lead for {lostReasonTargetLead.name}</p>
              </div>
              <button onClick={() => setIsLostModalOpen(false)} className="p-1 rounded-lg text-[#7A7268]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Primary Lost Reason *</label>
                <select
                  value={selectedLostReason}
                  onChange={(e) => setSelectedLostReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] font-semibold text-[#1F313D]"
                >
                  <option value="price_too_high">Price / Package too high</option>
                  <option value="competitor_chosen">Competitor venue chosen</option>
                  <option value="budget_constraints">Client budget cancelled</option>
                  <option value="no_response">Ghosted / No response after follow-ups</option>
                  <option value="event_cancelled">Event postponed or cancelled</option>
                  <option value="out_of_radius">Distance / Out of delivery radius</option>
                  <option value="menu_mismatch">Menu / Cuisine preference mismatch</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Lost Opportunity Notes</label>
                <textarea
                  rows={2}
                  value={lostNotesInput}
                  onChange={(e) => setLostNotesInput(e.target.value)}
                  placeholder="Context for lost reasons report..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] font-semibold text-[#1F313D]"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#DDD5C7] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLostModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLostReason}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Mark as Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RESOLVE DUPLICATE LEADS ── */}
      {isDuplicateModalOpen && selectedDuplicateGroup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] w-full max-w-xl rounded-[24px] border border-[#DDD5C7] shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#1F313D]">
                  Resolve Duplicate Leads ({selectedDuplicateGroup.matchedField}: {selectedDuplicateGroup.matchValue})
                </h3>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Select the primary lead record to keep. Notes and touchpoint history from the duplicate will be merged.
                </p>
              </div>
              <button onClick={() => setIsDuplicateModalOpen(false)} className="p-1 rounded-lg text-[#7A7268]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {selectedDuplicateGroup.leads.map((lead, idx) => (
                <div
                  key={lead.id}
                  className="p-3.5 bg-white rounded-xl border border-[#DDD5C7] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-xs text-[#1F313D] block">{lead.name} ({lead.company})</span>
                    <span className="text-[10px] text-[#7A7268] block mt-0.5">
                      {lead.id} • Source: {lead.source} • Status: {lead.status}
                    </span>
                    <span className="text-[10px] text-[#79415A] font-semibold block mt-0.5">
                      Est. Value: ${lead.estimatedValue.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const secondary = selectedDuplicateGroup.leads.find((l) => l.id !== lead.id);
                      if (secondary) {
                        handleMergeDuplicates(lead.id, secondary.id);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#79415A] text-white text-xs font-bold hover:bg-[#68334b] shadow-xs"
                  >
                    Keep as Primary &amp; Merge
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
