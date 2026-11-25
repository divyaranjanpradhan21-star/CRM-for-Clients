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
  FileText,
  ChevronLeft,
  ArrowUpDown,
  History,
  Check,
  AlertCircle,
  MapPin,
  Kanban
} from 'lucide-react';
import {
  LeadRecord,
  LeadSource,
  LeadType,
  LeadPriority,
  LeadStatus,
  LostReason,
  LeadInteraction,
  DuplicateLeadGroup,
  fetchLeads,
  saveLead,
  updateLeadStatus,
  assignLeadToStaff,
  addLeadInteraction,
  scheduleLeadFollowUp,
  convertLeadToCustomer,
  detectDuplicateLeads,
  mergeDuplicateLeads,
  captureInboundLead,
  getLeadConversionMetrics,
  generateLeadId,
  exportLeadsToCSV
} from '../../lib/leadManagementApi';
import { fetchEmployees, EmployeeRecord } from '../../lib/employeeManagementApi';

const PIPELINE_COLUMNS: { id: LeadStatus; label: string; color: string; badgeBg: string }[] = [
  { id: 'NEW', label: 'New Inquiries', color: '#2563EB', badgeBg: 'bg-blue-100 text-blue-900 border-blue-200' },
  { id: 'CONTACTED', label: 'Contacted', color: '#D97706', badgeBg: 'bg-amber-100 text-amber-900 border-amber-200' },
  { id: 'QUALIFIED', label: 'Qualified', color: '#059669', badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', color: '#79415A', badgeBg: 'bg-[#79415A]/15 text-[#79415A] border-[#79415A]/30' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: '#9333EA', badgeBg: 'bg-purple-100 text-purple-900 border-purple-200' },
  { id: 'CONVERTED', label: 'Won / Converted', color: '#16A34A', badgeBg: 'bg-emerald-200 text-emerald-950 border-emerald-400' },
  { id: 'LOST', label: 'Lost Opportunity', color: '#DC2626', badgeBg: 'bg-rose-100 text-rose-900 border-rose-200' },
];

export const LeadManagementView: React.FC<{ orgId?: string }> = () => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [staffList, setStaffList] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'analytics'>('kanban');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [leadTypeFilter, setLeadTypeFilter] = useState<string>('ALL');
  const [assignedStaffFilter, setAssignedStaffFilter] = useState<string>('ALL');

  // Table Sorting & Pagination
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Selected Lead Drawer
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);

  // Modals state
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

  // Drag and Drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);

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

  // Filtered and Sorted Leads
  const processedLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        if (sourceFilter !== 'ALL' && lead.source !== sourceFilter) return false;
        if (priorityFilter !== 'ALL' && lead.priority !== priorityFilter) return false;
        if (statusFilter !== 'ALL' && lead.status !== statusFilter) return false;
        if (leadTypeFilter !== 'ALL' && lead.leadType !== leadTypeFilter) return false;
        if (assignedStaffFilter !== 'ALL' && lead.assignedStaffId !== assignedStaffFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = lead.name.toLowerCase().includes(q);
          const matchCompany = lead.company.toLowerCase().includes(q);
          const matchPhone = lead.phone.includes(q);
          const matchEmail = lead.email.toLowerCase().includes(q);
          const matchId = lead.id.toLowerCase().includes(q);
          if (!matchName && !matchCompany && !matchPhone && !matchEmail && !matchId) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') {
          diff = a.name.localeCompare(b.name);
        } else if (sortBy === 'value') {
          diff = (a.estimatedValue || 0) - (b.estimatedValue || 0);
        } else if (sortBy === 'status') {
          diff = a.status.localeCompare(b.status);
        } else {
          diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [leads, searchQuery, sourceFilter, priorityFilter, statusFilter, leadTypeFilter, assignedStaffFilter, sortBy, sortOrder]);

  // Pagination for table view
  const totalPages = Math.ceil(processedLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedLeads.slice(start, start + pageSize);
  }, [processedLeads, currentPage, pageSize]);

  // Conversion analytics metrics
  const metrics = useMemo(() => {
    return getLeadConversionMetrics(leads);
  }, [leads]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, colId: LeadStatus) => {
    e.preventDefault();
    setDragOverColumn(colId);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    if (targetStatus === 'LOST') {
      const targetLead = leads.find((l) => l.id === leadId);
      if (targetLead) {
        setLostReasonTargetLead(targetLead);
        setIsLostModalOpen(true);
        return;
      }
    }

    const res = await updateLeadStatus(leadId, targetStatus);
    if (res.success) {
      showToast(`Lead stage updated to ${targetStatus}`);
      loadData();
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, status: targetStatus } : null));
      }
    }
  };

  // Convert Lead to Customer
  const handleConvertLead = async (leadId: string) => {
    setIsConverting(true);
    try {
      const res = await convertLeadToCustomer(leadId);
      if (res.success) {
        showToast(`Lead successfully converted to Customer Profile #${res.customerId}!`);
        loadData();
        if (selectedLead?.id === leadId) {
          setSelectedLead((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'CONVERTED',
                  convertedCustomerId: res.customerId,
                  convertedAt: new Date().toISOString(),
                }
              : null
          );
        }
      } else {
        showToast(res.error || 'Conversion failed', 'error');
      }
    } finally {
      setIsConverting(false);
    }
  };

  // Save Lead
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead || !editingLead.name || (!editingLead.phone && !editingLead.email)) {
      showToast('Name and phone/email are required', 'error');
      return;
    }

    const res = await saveLead(editingLead);
    if (res.success) {
      showToast(`Lead "${res.lead?.name}" saved successfully`);
      setIsCreateModalOpen(false);
      setEditingLead(null);
      loadData();
    } else {
      showToast(res.error || 'Failed to save lead', 'error');
    }
  };

  // Add Interaction Log
  const handleAddInteraction = async () => {
    if (!selectedLead || !newInteractionSummary.trim()) {
      showToast('Please enter an interaction summary', 'error');
      return;
    }

    const res = await addLeadInteraction(selectedLead.id, {
      type: newInteractionType,
      summary: newInteractionSummary.trim(),
      details: newInteractionDetails.trim() || undefined,
      performedBy: 'Sales Rep',
    });

    if (res.success) {
      showToast('Interaction logged successfully');
      setNewInteractionSummary('');
      setNewInteractionDetails('');
      loadData();
      const updated = (await fetchLeads()).find((l) => l.id === selectedLead.id);
      if (updated) setSelectedLead(updated);
    }
  };

  // Schedule Follow-up
  const handleScheduleFollowUp = async () => {
    if (!selectedLead || !newFollowUpDate) {
      showToast('Please select a valid follow-up date', 'error');
      return;
    }

    const res = await scheduleLeadFollowUp(selectedLead.id, newFollowUpDate, newFollowUpNotes.trim());
    if (res.success) {
      showToast(`Follow-up scheduled for ${newFollowUpDate}`);
      setNewFollowUpDate('');
      setNewFollowUpNotes('');
      loadData();
      const updated = (await fetchLeads()).find((l) => l.id === selectedLead.id);
      if (updated) setSelectedLead(updated);
    }
  };

  // Confirm Mark as Lost
  const handleConfirmLost = async () => {
    if (!lostReasonTargetLead) return;

    const res = await updateLeadStatus(lostReasonTargetLead.id, 'LOST', {
      lostReason: selectedLostReason,
      lostNotes: lostNotesInput,
    });

    if (res.success) {
      showToast(`Lead marked as Lost`);
      setIsLostModalOpen(false);
      setLostReasonTargetLead(null);
      setLostNotesInput('');
      loadData();
      if (selectedLead?.id === lostReasonTargetLead.id) {
        setSelectedLead(res.lead || null);
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-5 rounded-[24px] border border-[#DDD5C7] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#79415A]/10 text-[#79415A]">
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1F313D] leading-tight">
                Lead Management &amp; Pipeline Sales
              </h2>
              <p className="text-xs text-[#7A7268] mt-0.5">
                Manage potential clients, corporate banquet accounts, business opportunities, and follow-up activities
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle Buttons */}
          <div className="flex rounded-xl overflow-hidden border border-[#DDD5C7] bg-[#EFE9DF] p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'kanban' ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'table' ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'analytics' ? 'bg-[#1F313D] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Reports
            </button>
          </div>

          <button
            onClick={() => exportLeadsToCSV(leads)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549] hover:bg-[#EFE9DF]"
          >
            <Download className="w-3.5 h-3.5 text-[#79415A]" /> Export CSV
          </button>

          <button
            onClick={() => {
              setEditingLead({
                id: generateLeadId(),
                name: '',
                company: '',
                leadType: 'Corporate',
                email: '',
                phone: '',
                address: '',
                source: 'website_form',
                priority: 'HIGH',
                status: 'NEW',
                estimatedValue: 1500,
                expectedBudget: 1500,
                interestedServices: ['Corporate Dining'],
                guestCount: 20,
                eventType: 'Corporate Banquet',
                assignedStaffId: staffList[0]?.id || 'emp-001',
                assignedStaffName: staffList[0]?.fullName || 'Marco Rossi',
                notes: '',
              });
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#79415A] hover:bg-[#68334b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* ── 8 LEAD DASHBOARD KPI CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-[#7A7268] block">Total Leads</span>
          <div className="text-xl font-bold font-serif text-[#1F313D] mt-1">{metrics.totalLeads}</div>
          <span className="text-[9px] text-[#79415A] font-semibold mt-0.5 block">${metrics.totalPipelineValue.toLocaleString()} val</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-blue-700 block">New Leads</span>
          <div className="text-xl font-bold font-serif text-blue-800 mt-1">{metrics.newLeads}</div>
          <span className="text-[9px] text-blue-600 font-semibold mt-0.5 block">Uncontacted</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 block">Contacted</span>
          <div className="text-xl font-bold font-serif text-amber-800 mt-1">{metrics.contactedLeads}</div>
          <span className="text-[9px] text-amber-600 font-semibold mt-0.5 block">Discovery Active</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 block">Qualified</span>
          <div className="text-xl font-bold font-serif text-emerald-800 mt-1">{metrics.qualifiedLeads}</div>
          <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 block">Budget Confirmed</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-purple-700 block">Negotiation</span>
          <div className="text-xl font-bold font-serif text-purple-800 mt-1">{metrics.negotiationLeads}</div>
          <span className="text-[9px] text-purple-600 font-semibold mt-0.5 block">Final Terms</span>
        </div>

        <div className="bg-[#1F313D] text-white rounded-2xl p-3 border border-[#1F313D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#E5C9B3] block">Converted</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{metrics.convertedCount}</div>
          <span className="text-[9px] text-emerald-400 font-medium mt-0.5 block">{metrics.conversionRate}% Win Rate</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#DDD5C7] shadow-xs">
          <span className="text-[10px] font-bold text-rose-700 block">Lost Leads</span>
          <div className="text-xl font-bold font-serif text-rose-800 mt-1">{metrics.lostCount}</div>
          <span className="text-[9px] text-rose-600 font-semibold mt-0.5 block">Closed Lost</span>
        </div>

        <div className="bg-amber-50 rounded-2xl p-3 border border-amber-300 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-900 block">Follow-ups Due</span>
            <Clock className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-xl font-bold font-serif text-amber-900 mt-1">{metrics.followUpsDue}</div>
          <span className="text-[9px] text-amber-800 font-semibold mt-0.5 block">{metrics.upcomingFollowUps} upcoming</span>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#7A7268] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, company, phone, email, or Lead ID..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#DDD5C7] text-xs text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A]"
            />
          </div>

          {/* Quick Duplicate Alert Badge */}
          {duplicateGroups.length > 0 && (
            <button
              onClick={() => {
                setSelectedDuplicateGroup(duplicateGroups[0]);
                setIsDuplicateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-500/20 transition animate-pulse"
            >
              <GitMerge className="w-3.5 h-3.5 text-amber-700" />
              <span>{duplicateGroups.length} Duplicate Lead Group(s)</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DDD5C7]/70 text-xs">
          <span className="text-[11px] font-bold text-[#7A7268] flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#79415A]" /> Filters:
          </span>

          {/* Lead Type */}
          <select
            value={leadTypeFilter}
            onChange={(e) => setLeadTypeFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
          >
            <option value="ALL">All Types (Individual, Corporate, Event)</option>
            <option value="Corporate">Corporate Accounts</option>
            <option value="Event">Event Banquets</option>
            <option value="Individual">Individual VIPs</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
          >
            <option value="ALL">All Pipeline Stages</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL_SENT">Proposal Sent</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="CONVERTED">Converted (Won)</option>
            <option value="LOST">Lost</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
          >
            <option value="ALL">All Inbound Sources</option>
            <option value="website_form">Website Inquiry Form</option>
            <option value="social_media_meta">Meta Lead Ads</option>
            <option value="social_media_instagram">Instagram Ads</option>
            <option value="google_ads">Google Ads</option>
            <option value="linkedin">LinkedIn</option>
            <option value="referral">Patron Referral</option>
            <option value="phone_inquiry">Phone Call</option>
          </select>

          {/* Assigned Sales Rep Filter */}
          <select
            value={assignedStaffFilter}
            onChange={(e) => setAssignedStaffFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
          >
            <option value="ALL">All Sales Representatives</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName} ({s.departmentName || s.role || 'Sales'})</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 1. KANBAN PIPELINE VIEW ── */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1280px]">
            {PIPELINE_COLUMNS.map((col) => {
              const colLeads = processedLeads.filter((l) => l.status === col.id);
              const colTotalValue = colLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
              const isOver = dragOverColumn === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex-1 min-w-[220px] rounded-2xl p-3 flex flex-col justify-between transition border ${
                    isOver ? 'bg-amber-50/80 border-[#79415A] ring-2 ring-[#79415A]/30' : 'bg-[#FAF7F2] border-[#DDD5C7]'
                  }`}
                >
                  <div>
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD5C7]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }}></span>
                        <h4 className="font-bold text-xs text-[#1F313D]">{col.label}</h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-[#DDD5C7] text-[#5C5549]">
                        {colLeads.length}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#7A7268] font-mono mb-2 px-1">
                      Total: ${colTotalValue.toLocaleString()}
                    </div>

                    {/* Cards Stack */}
                    <div className="space-y-2.5 min-h-[350px]">
                      {colLeads.map((lead) => {
                        const isOverdue = lead.nextFollowUpDate && lead.nextFollowUpDate < todayStr && !['CONVERTED', 'LOST'].includes(lead.status);
                        const isDueToday = lead.nextFollowUpDate === todayStr && !['CONVERTED', 'LOST'].includes(lead.status);

                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            onClick={() => setSelectedLead(lead)}
                            className={`p-3 rounded-xl bg-white border transition shadow-2xs hover:shadow-md cursor-grab active:cursor-grabbing ${
                              selectedLead?.id === lead.id
                                ? 'border-[#79415A] ring-2 ring-[#79415A]/20'
                                : 'border-[#DDD5C7] hover:border-[#79415A]/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="text-[9px] font-mono font-bold text-[#82401D]">{lead.id}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                lead.leadType === 'Corporate' ? 'bg-purple-100 text-purple-800' : lead.leadType === 'Event' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {lead.leadType}
                              </span>
                            </div>

                            <h5 className="font-bold text-xs text-[#1F313D] leading-tight line-clamp-1">{lead.name}</h5>
                            <p className="text-[11px] text-[#7A7268] truncate">{lead.company}</p>

                            <div className="mt-2 pt-2 border-t border-[#DDD5C7]/70 flex items-center justify-between text-[11px]">
                              <span className="font-bold font-mono text-[#79415A]">${(lead.estimatedValue || 0).toLocaleString()}</span>
                              <span className="text-[10px] text-[#5C5549]">{lead.guestCount ? `${lead.guestCount} guests` : 'Private'}</span>
                            </div>

                            {/* Follow-up Indicator */}
                            {lead.nextFollowUpDate && (
                              <div className={`mt-2 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-semibold ${
                                isOverdue ? 'bg-rose-100 text-rose-800 border border-rose-200' : isDueToday ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-gray-100 text-gray-700'
                              }`}>
                                <Clock className="w-3 h-3" />
                                <span>{isOverdue ? 'Overdue: ' : isDueToday ? 'Due Today: ' : 'Follow-up: '}{lead.nextFollowUpDate}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EFE9DF] text-[#5C5549] font-mono uppercase tracking-wider text-[10px] border-b border-[#DDD5C7]">
                <tr>
                  <th className="py-3 px-4">Lead ID & Name</th>
                  <th className="py-3 px-4">Company & Type</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Value ($)</th>
                  <th className="py-3 px-4">Assigned Salesperson</th>
                  <th className="py-3 px-4">Follow-Up Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD5C7]">
                {paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`hover:bg-[#EFE9DF]/60 transition cursor-pointer ${
                      selectedLead?.id === lead.id ? 'bg-[#EFE9DF] ring-1 ring-[#79415A]/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1F313D]">{lead.name}</div>
                      <span className="text-[10px] font-mono text-[#82401D] font-bold">{lead.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#1F313D]">{lead.company}</div>
                      <span className="text-[10px] text-[#7A7268]">{lead.leadType}</span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <div>{lead.phone}</div>
                      <div className="text-[#7A7268] truncate max-w-[150px]">{lead.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        PIPELINE_COLUMNS.find((c) => c.id === lead.status)?.badgeBg || 'bg-gray-100'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#79415A]">
                      ${(lead.estimatedValue || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#5C5549]">
                      {lead.assignedStaffName}
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {lead.nextFollowUpDate || '—'}
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          title="View lead profile"
                          className="p-1.5 rounded-lg text-[#5C5549] hover:bg-[#DDD5C7]"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {lead.status !== 'CONVERTED' && (
                          <button
                            onClick={() => handleConvertLead(lead.id)}
                            title="Convert to Customer"
                            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
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
            <div>Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, processedLeads.length)} of {processedLeads.length} leads</div>
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

      {/* ── 3. REPORTS & ANALYTICS VIEW ── */}
      {viewMode === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Salesperson Leaderboard */}
            <div className="p-5 rounded-[24px] bg-white border border-[#DDD5C7] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#1F313D] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#79415A]" /> Salesperson Performance Leaderboard
                </h4>
                <span className="text-[11px] text-[#7A7268]">Ranked by Won Conversions</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EFE9DF] text-[#5C5549] text-[10px] uppercase font-mono">
                    <tr>
                      <th className="p-2.5">Sales Representative</th>
                      <th className="p-2.5 text-center">Assigned</th>
                      <th className="p-2.5 text-center">Won</th>
                      <th className="p-2.5 text-center">Win Rate</th>
                      <th className="p-2.5 text-right">Value Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDD5C7]">
                    {metrics.salespersonPerformance.map((s, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2]">
                        <td className="p-2.5 font-bold text-[#1F313D]">{s.staffName}</td>
                        <td className="p-2.5 text-center">{s.totalAssigned}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">{s.converted}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{s.winRate}%</td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#79415A]">${s.totalValue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inbound Source Performance */}
            <div className="p-5 rounded-[24px] bg-white border border-[#DDD5C7] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#1F313D] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-700" /> Lead Acquisition Source Performance
                </h4>
                <span className="text-[11px] text-[#7A7268]">ROI & Conversion %</span>
              </div>

              <div className="space-y-2">
                {metrics.sourceBreakdown.map((src, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-[#1F313D] capitalize">{src.source.replace(/_/g, ' ')}</span>
                      <div className="text-[11px] text-[#7A7268]">{src.count} leads &bull; {src.converted} converted</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-emerald-700 block">{src.rate}% Conv.</span>
                      <span className="text-[10px] text-[#7A7268] font-mono">${src.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SELECTED LEAD PROFILE DRAWER ── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-[#FAF7F2] w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between border-l border-[#DDD5C7] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#DDD5C7] bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-[#1F313D]">{selectedLead.name}</h3>
                  <span className="text-[10px] font-mono font-bold text-[#82401D] px-2 py-0.5 rounded bg-[#EFE9DF]">
                    {selectedLead.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                    {selectedLead.leadType}
                  </span>
                </div>
                <p className="text-xs text-[#7A7268] mt-0.5">{selectedLead.company || 'Individual Client'}</p>
              </div>

              <div className="flex items-center gap-2">
                {selectedLead.status !== 'CONVERTED' ? (
                  <button
                    onClick={() => handleConvertLead(selectedLead.id)}
                    disabled={isConverting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isConverting ? 'Converting...' : 'Convert to Customer'}</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
                    <Check className="w-3.5 h-3.5" /> Converted #{selectedLead.convertedCustomerId}
                  </span>
                )}

                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 rounded-xl text-[#7A7268] hover:bg-[#EFE9DF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Quick Status and Value Strip */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7]">
                <div>
                  <span className="text-[10px] text-[#7A7268] block">Current Stage</span>
                  <strong className="text-xs text-[#1F313D] block mt-0.5">{selectedLead.status}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A7268] block">Estimated Value</span>
                  <strong className="text-xs text-[#79415A] font-mono block mt-0.5">${(selectedLead.estimatedValue || 0).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A7268] block">Sales Representative</span>
                  <strong className="text-xs text-[#1F313D] block mt-0.5 truncate">{selectedLead.assignedStaffName}</strong>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-2">
                <h4 className="font-bold text-[#1F313D]">Contact &amp; Event Details</h4>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div><span className="text-[#7A7268]">Phone:</span> <strong>{selectedLead.phone}</strong></div>
                  <div><span className="text-[#7A7268]">Email:</span> <strong>{selectedLead.email}</strong></div>
                  <div><span className="text-[#7A7268]">Address:</span> <strong>{selectedLead.address || 'Unspecified'}</strong></div>
                  <div><span className="text-[#7A7268]">Guest Count:</span> <strong>{selectedLead.guestCount || '—'}</strong></div>
                  <div><span className="text-[#7A7268]">Event Type:</span> <strong>{selectedLead.eventType || 'Dining'}</strong></div>
                  <div><span className="text-[#7A7268]">Preferred Date:</span> <strong>{selectedLead.preferredDate || 'Flexible'}</strong></div>
                </div>
              </div>

              {/* Follow-up Section */}
              <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#1F313D] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700" /> Scheduled Follow-Up
                  </h4>
                  {selectedLead.nextFollowUpDate && (
                    <span className="font-mono text-xs font-bold text-amber-800">
                      {selectedLead.nextFollowUpDate}
                    </span>
                  )}
                </div>
                {selectedLead.followUpNotes && (
                  <p className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-[11px]">
                    {selectedLead.followUpNotes}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-[#DDD5C7]">
                  <input
                    type="date"
                    value={newFollowUpDate}
                    onChange={(e) => setNewFollowUpDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                  <input
                    type="text"
                    value={newFollowUpNotes}
                    onChange={(e) => setNewFollowUpNotes(e.target.value)}
                    placeholder="Follow-up notes / agenda..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                  <button
                    onClick={handleScheduleFollowUp}
                    className="px-3 py-1.5 rounded-xl bg-[#79415A] text-white font-bold text-xs"
                  >
                    Schedule
                  </button>
                </div>
              </div>

              {/* Log Communication Activity Form */}
              <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-2.5">
                <h4 className="font-bold text-[#1F313D] flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-[#79415A]" /> Log Communication / Meeting
                </h4>
                <div className="flex items-center gap-2">
                  <select
                    value={newInteractionType}
                    onChange={(e) => setNewInteractionType(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#1F313D]"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="MEETING">In-Person Meeting</option>
                    <option value="PROPOSAL">Proposal / Quote</option>
                    <option value="NOTE">Internal Note</option>
                  </select>
                  <input
                    type="text"
                    value={newInteractionSummary}
                    onChange={(e) => setNewInteractionSummary(e.target.value)}
                    placeholder="Summary of interaction..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                  <button
                    onClick={handleAddInteraction}
                    className="px-3.5 py-1.5 rounded-xl bg-[#1F313D] text-white font-bold text-xs"
                  >
                    Log
                  </button>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-3">
                <h4 className="font-bold text-[#1F313D] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#79415A]" /> Communication &amp; Activity Timeline
                </h4>
                <div className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DDD5C7]">
                  {selectedLead.interactionHistory.map((item) => (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-[#79415A] border-2 border-white"></div>
                      <div className="flex items-center justify-between font-bold text-[#1F313D]">
                        <span>{item.type} &bull; {item.summary}</span>
                        <span className="text-[10px] text-[#7A7268] font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                      {item.details && <p className="text-[11px] text-[#5C5549] mt-0.5">{item.details}</p>}
                      <span className="text-[9px] text-[#82401D] italic">By {item.performedBy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT LEAD MODAL ── */}
      {isCreateModalOpen && editingLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[28px] max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F313D]">
                  {editingLead.id ? 'Edit Lead Details' : 'Register New Lead'}
                </h3>
                <span className="text-xs text-[#7A7268] font-mono">ID: {editingLead.id}</span>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-full text-[#7A7268] hover:bg-[#DDD5C7]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={editingLead.name || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={editingLead.company || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                    placeholder="e.g. Goldman Sachs"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editingLead.phone || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    placeholder="e.g. +91 98200 12345"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingLead.email || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    placeholder="e.g. rahul@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Lead Type</label>
                  <select
                    value={editingLead.leadType || 'Corporate'}
                    onChange={(e) => setEditingLead({ ...editingLead, leadType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  >
                    <option value="Corporate">Corporate Account</option>
                    <option value="Event">Event Banquet</option>
                    <option value="Individual">Individual VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Pipeline Stage</label>
                  <select
                    value={editingLead.status || 'NEW'}
                    onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL_SENT">Proposal Sent</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Estimated Value ($)</label>
                  <input
                    type="number"
                    value={editingLead.estimatedValue || 1000}
                    onChange={(e) => setEditingLead({ ...editingLead, estimatedValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Assigned Sales Representative</label>
                  <select
                    value={editingLead.assignedStaffId || ''}
                    onChange={(e) => {
                      const emp = staffList.find((s) => s.id === e.target.value);
                      setEditingLead({
                        ...editingLead,
                        assignedStaffId: e.target.value,
                        assignedStaffName: emp ? emp.fullName : 'Priya Sharma',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.departmentName || s.role || 'Floor'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Address / Location</label>
                <input
                  type="text"
                  value={editingLead.address || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, address: e.target.value })}
                  placeholder="e.g. Bandra West, Mumbai"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Inquiry Notes &amp; Preferences</label>
                <textarea
                  rows={2}
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  placeholder="Budget limits, dining preferences, dietary requests..."
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
                  className="px-5 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white font-bold"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MARK AS LOST REASON MODAL ── */}
      {isLostModalOpen && lostReasonTargetLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-base text-[#1F313D]">Record Lost Opportunity</h3>
                <p className="text-xs text-[#7A7268]">{lostReasonTargetLead.name} ({lostReasonTargetLead.company})</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Primary Lost Reason *</label>
                <select
                  value={selectedLostReason}
                  onChange={(e) => setSelectedLostReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                >
                  <option value="price_too_high">Price Too High / Out of Budget</option>
                  <option value="competitor_chosen">Competitor Restaurant Chosen</option>
                  <option value="event_cancelled">Event Cancelled / Postponed</option>
                  <option value="no_response">Client Stopped Responding</option>
                  <option value="menu_mismatch">Menu / Cuisine Mismatch</option>
                  <option value="out_of_radius">Distance / Location Constraint</option>
                  <option value="other">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F313D] mb-1">Additional Lost Notes</label>
                <textarea
                  rows={3}
                  value={lostNotesInput}
                  onChange={(e) => setLostNotesInput(e.target.value)}
                  placeholder="Explain why this opportunity was lost..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#1F313D]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DDD5C7]">
              <button
                onClick={() => setIsLostModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-[#5C5549] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLost}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LeadManagementView;
