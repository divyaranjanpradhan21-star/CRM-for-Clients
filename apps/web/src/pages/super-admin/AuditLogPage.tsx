import { useState, useEffect, useCallback } from 'react';
import {
  Activity, AlertTriangle, Shield, Server, Building2,
  Download, Search, Filter, RefreshCw, Flag, CheckCircle,
  XCircle, ChevronLeft, ChevronRight, Eye, X, FileText,
  FileJson, LogIn, Zap,
} from 'lucide-react';
import {
  getAuditLogs,
  getAuditStats,
  exportAuditReportCSV,
  exportAuditReportJSON,
  type AuditLogEntry,
  type AuditFilters,
  type AuditStats,
} from '../../lib/auditLogApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ─── Badge Components ─────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: AuditLogEntry['severity'] }) {
  const styles: Record<string, string> = {
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
    critical: 'bg-red-100 text-red-800 border border-red-300 font-semibold animate-pulse',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wide ${styles[severity]}`}>
      {severity === 'critical' && <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />}
      {severity}
    </span>
  );
}

function EventTypeBadge({ type }: { type: AuditLogEntry['event_type'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    admin_action: { label: 'Admin Action', cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
    login_failed: { label: 'Login Failed', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
    login_success: { label: 'Login OK', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    system_error: { label: 'System Error', cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
    integration_failure: { label: 'Integration', cls: 'bg-yellow-50 text-yellow-800 border border-yellow-200' },
    org_activity: { label: 'Org Activity', cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
    security_event: { label: 'Security', cls: 'bg-red-50 text-red-700 border border-red-200' },
  };
  const { label, cls } = map[type] ?? { label: type, cls: 'bg-gray-100 text-gray-600 border border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: 'success' | 'failed' }) {
  return status === 'success' ? (
    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs">
      <CheckCircle className="w-3.5 h-3.5" /> Success
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-600 text-xs">
      <XCircle className="w-3.5 h-3.5" /> Failed
    </span>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#7A7268] font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-[#1F313D]">{value}</p>
        {sub && <p className="text-xs text-[#7A7268] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ entry, onClose }: { entry: AuditLogEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5DDD2]">
          <div>
            <h3 className="font-serif font-bold text-[#1F313D] text-lg">Event Details</h3>
            <p className="text-xs text-[#7A7268] mt-0.5">{formatDateTime(entry.created_at)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F5F0E8] text-[#7A7268]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <SeverityBadge severity={entry.severity} />
            <EventTypeBadge type={entry.event_type} />
            <StatusBadge status={entry.status} />
          </div>

          {/* Action */}
          <div className="bg-[#F5F0E8] rounded-xl p-4">
            <p className="text-sm font-medium text-[#1F313D]">{entry.action}</p>
          </div>

          {/* Fields */}
          {[
            ['Category', entry.category],
            ['Actor', entry.actor_email],
            ['Actor Role', entry.actor_role],
            entry.target_email ? ['Target', entry.target_email] : null,
            entry.organization_name ? ['Organization', entry.organization_name] : null,
            entry.ip_address ? ['IP Address', entry.ip_address] : null,
            entry.user_agent ? ['User Agent', entry.user_agent] : null,
          ].filter((item): item is [string, string] => item !== null).map(([label, val]) => (
            <div key={label as string} className="flex items-start gap-3">
              <span className="text-xs text-[#7A7268] w-28 shrink-0 pt-0.5">{label}</span>
              <span className="text-sm text-[#1F313D] font-medium break-all">{val as string}</span>
            </div>
          ))}

          {/* Details JSON */}
          {entry.details && (
            <div>
              <p className="text-xs text-[#7A7268] mb-1.5">Additional Details</p>
              <pre className="bg-[#1F313D] text-emerald-300 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">
                {JSON.stringify(entry.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Export Modal ─────────────────────────────────────────────────────────────

function ExportModal({ onClose, allLogs }: { onClose: () => void; allLogs: AuditLogEntry[] }) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const eventTypes = [
    { value: 'admin_action', label: 'Admin Actions' },
    { value: 'login_failed', label: 'Failed Logins' },
    { value: 'login_success', label: 'Successful Logins' },
    { value: 'system_error', label: 'System Errors' },
    { value: 'integration_failure', label: 'Integration Failures' },
    { value: 'org_activity', label: 'Org Activity' },
    { value: 'security_event', label: 'Security Events' },
  ];

  const toggleType = (v: string) =>
    setSelectedTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const handleExport = async () => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 600));

    let filtered = [...allLogs];
    if (selectedTypes.length) filtered = filtered.filter(e => selectedTypes.includes(e.event_type));
    if (dateFrom) filtered = filtered.filter(e => e.created_at >= dateFrom);
    if (dateTo) filtered = filtered.filter(e => e.created_at <= dateTo + 'T23:59:59');

    const ts = new Date().toISOString().split('T')[0];
    if (format === 'csv') exportAuditReportCSV(filtered, `audit-report-${ts}.csv`);
    else exportAuditReportJSON(filtered, `audit-report-${ts}.json`);

    setExporting(false);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-[#E5DDD2]">
          <div>
            <h3 className="font-serif font-bold text-[#1F313D] text-lg">Export Audit Report</h3>
            <p className="text-xs text-[#7A7268] mt-0.5">Download filtered audit logs</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F5F0E8] text-[#7A7268]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Format */}
          <div>
            <p className="text-xs font-semibold text-[#5C5549] uppercase tracking-wide mb-2">Format</p>
            <div className="grid grid-cols-2 gap-3">
              {(['csv', 'json'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${format === f ? 'border-[#79415A] bg-[#79415A]/5' : 'border-[#E5DDD2] hover:border-[#79415A]/30'}`}
                >
                  {f === 'csv' ? <FileText className="w-4 h-4 text-[#79415A]" /> : <FileJson className="w-4 h-4 text-[#79415A]" />}
                  <span className={`text-sm font-medium ${format === f ? 'text-[#79415A]' : 'text-[#5C5549]'}`}>
                    {f.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <p className="text-xs font-semibold text-[#5C5549] uppercase tracking-wide mb-2">Date Range <span className="text-[#7A7268] normal-case font-normal">(optional)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#7A7268] mb-1 block">From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A]" />
              </div>
              <div>
                <label className="text-xs text-[#7A7268] mb-1 block">To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A]" />
              </div>
            </div>
          </div>

          {/* Event Types */}
          <div>
            <p className="text-xs font-semibold text-[#5C5549] uppercase tracking-wide mb-2">Event Types <span className="text-[#7A7268] normal-case font-normal">(leave blank for all)</span></p>
            <div className="grid grid-cols-2 gap-2">
              {eventTypes.map(et => (
                <label key={et.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedTypes.includes(et.value)} onChange={() => toggleType(et.value)}
                    className="w-4 h-4 rounded accent-[#79415A]" />
                  <span className="text-sm text-[#1F313D]">{et.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 pt-0">
          <button
            onClick={handleExport}
            disabled={exporting || done}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#79415A] text-white rounded-xl font-medium text-sm hover:bg-[#6a3650] disabled:opacity-60 transition-all"
          >
            {done ? (
              <><CheckCircle className="w-4 h-4" /> Downloaded!</>
            ) : exporting ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Preparing…</>
            ) : (
              <><Download className="w-4 h-4" /> Export {format.toUpperCase()}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Log Table ────────────────────────────────────────────────────────────────

function LogTable({
  logs,
  onView,
  onFlag,
  onResolve,
  showFlagColumn,
  showResolveColumn,
}: {
  logs: AuditLogEntry[];
  onView: (e: AuditLogEntry) => void;
  onFlag?: (e: AuditLogEntry) => void;
  onResolve?: (e: AuditLogEntry) => void;
  showFlagColumn?: boolean;
  showResolveColumn?: boolean;
}) {
  if (!logs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#7A7268]">
        <Activity className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No events found</p>
        <p className="text-xs mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F5F0E8]">
            {['Timestamp', 'Severity', 'Type', 'Actor / Organization', 'Action', 'Status', 'IP Address', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#5C5549] uppercase tracking-wide whitespace-nowrap first:rounded-l-xl last:rounded-r-xl">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F5F0E8]">
          {logs.map(entry => (
            <tr key={entry.id} className="hover:bg-[#FAF7F2] transition-colors group">
              <td className="px-4 py-3 whitespace-nowrap">
                <p className="text-xs text-[#1F313D] font-medium">{timeAgo(entry.created_at)}</p>
                <p className="text-[10px] text-[#7A7268] mt-0.5">{formatDateTime(entry.created_at)}</p>
              </td>
              <td className="px-4 py-3">
                <SeverityBadge severity={entry.severity} />
              </td>
              <td className="px-4 py-3">
                <EventTypeBadge type={entry.event_type} />
              </td>
              <td className="px-4 py-3 max-w-[180px]">
                <p className="text-xs font-medium text-[#1F313D] truncate">{entry.actor_email}</p>
                {entry.organization_name && (
                  <p className="text-[10px] text-[#7A7268] truncate mt-0.5">📍 {entry.organization_name}</p>
                )}
                {entry.target_email && (
                  <p className="text-[10px] text-[#7A7268] truncate mt-0.5">→ {entry.target_email}</p>
                )}
              </td>
              <td className="px-4 py-3 max-w-[280px]">
                <p className="text-xs text-[#1F313D] line-clamp-2 leading-relaxed">{entry.action}</p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={entry.status} />
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-[#7A7268] font-mono">{entry.ip_address ?? '—'}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onView(entry)}
                    title="View details"
                    className="p-1.5 rounded-lg hover:bg-[#79415A]/10 text-[#79415A] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {showFlagColumn && onFlag && (
                    <button
                      onClick={() => onFlag(entry)}
                      title="Flag account"
                      className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {showResolveColumn && onResolve && (
                    <button
                      onClick={() => onResolve(entry)}
                      title="Mark resolved"
                      className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t border-[#E5DDD2]">
      <p className="text-xs text-[#7A7268]">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-xl border border-[#E5DDD2] hover:border-[#79415A] disabled:opacity-40 text-[#5C5549] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = page <= 3 ? i + 1 : page - 2 + i;
          if (p > totalPages) return null;
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`w-8 h-8 rounded-xl text-xs font-medium transition-all ${p === page ? 'bg-[#79415A] text-white' : 'border border-[#E5DDD2] text-[#5C5549] hover:border-[#79415A]'}`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-xl border border-[#E5DDD2] hover:border-[#79415A] disabled:opacity-40 text-[#5C5549] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = 'all' | 'failed_logins' | 'admin_journal' | 'system_errors' | 'org_activity';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All Activity', icon: Activity },
  { key: 'failed_logins', label: 'Failed Logins', icon: LogIn },
  { key: 'admin_journal', label: 'Admin Actions', icon: Shield },
  { key: 'system_errors', label: 'System & Integrations', icon: Server },
  { key: 'org_activity', label: 'Org-wise Activity', icon: Building2 },
];

export function AuditLogPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewEntry, setViewEntry] = useState<AuditLogEntry | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [allLogs, setAllLogs] = useState<AuditLogEntry[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orgFilter, setOrgFilter] = useState('');

  const PAGE_SIZE = 15;

  const tabFiltersMap: Record<TabKey, Partial<AuditFilters>> = {
    all: {},
    failed_logins: { event_type: 'login_failed' as const },
    admin_journal: { event_type: 'admin_action' as const },
    system_errors: {},
    org_activity: { event_type: 'org_activity' as const },
  };
  const tabFilters = tabFiltersMap[activeTab] ?? {};

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const filters: AuditFilters = {
        ...tabFilters,
        search: search || undefined,
        severity: (severity as AuditFilters['severity']) || 'all',
        status: (status as AuditFilters['status']) || 'all',
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page: p,
        page_size: PAGE_SIZE,
      };

      // For system_errors tab, we need to handle multi-event-type filtering in mock
      if (activeTab === 'system_errors') {
        const [sysRes, intRes] = await Promise.all([
          getAuditLogs({ ...filters, event_type: 'system_error' }),
          getAuditLogs({ ...filters, event_type: 'integration_failure' }),
        ]);
        const combined = [...sysRes.data, ...intRes.data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setLogs(combined);
        setTotal(sysRes.total + intRes.total);
      } else {
        const result = await getAuditLogs(filters);
        setLogs(result.data);
        setTotal(result.total);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, severity, status, dateFrom, dateTo]);

  // Load stats once
  useEffect(() => {
    getAuditStats().then(setStats);
    // Pre-fetch all logs for export
    getAuditLogs({ page_size: 1000 }).then(r => setAllLogs(r.data));
  }, []);

  // Fetch on tab / filter / page change
  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [activeTab, search, severity, status, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleFlag = (entry: AuditLogEntry) => {
    alert(`Account flagged: ${entry.actor_email}\n\nIn production this would trigger a security review workflow.`);
  };

  const handleResolve = (entry: AuditLogEntry) => {
    setLogs(prev => prev.filter(e => e.id !== entry.id));
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif font-bold text-[#1F313D] text-2xl flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#79415A]" />
            Audit & Activity Log
          </h1>
          <p className="text-sm text-[#7A7268] mt-1">
            Monitor administrative actions, security events, and system health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPage(1); fetchLogs(1); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5DDD2] text-sm text-[#5C5549] hover:border-[#79415A] transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#79415A] text-white rounded-xl text-sm font-medium hover:bg-[#6a3650] transition-colors"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Today" value={stats.total_today} sub="events recorded" icon={Activity} color="bg-blue-50 text-blue-600" />
          <StatCard label="Failed Logins" value={stats.failed_logins} sub={`+${stats.failed_logins_pct_change}% this week`} icon={LogIn} color="bg-rose-50 text-rose-600" />
          <StatCard label="Admin Actions" value={stats.admin_actions} sub="last 7 days" icon={Shield} color="bg-purple-50 text-purple-600" />
          <StatCard label="System Errors" value={stats.system_errors} sub="last 7 days" icon={Server} color="bg-orange-50 text-orange-600" />
          <StatCard label="Critical Alerts" value={stats.critical_alerts} sub="needs attention" icon={AlertTriangle} color="bg-red-50 text-red-600" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key
                ? 'bg-[#79415A] text-white shadow-sm'
                : 'text-[#5C5549] hover:bg-[#F5F0E8]'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-[#79415A]" />
          <span className="text-sm font-semibold text-[#1F313D]">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7268]" />
            <input
              type="text"
              placeholder="Search actor, action, org…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A] bg-[#FAF7F2]"
            />
          </div>

          {/* Severity */}
          <select
            value={severity}
            onChange={e => setSeverity(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A] bg-[#FAF7F2]"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A] bg-[#FAF7F2]"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A] bg-[#FAF7F2]"
            title="From date"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A] bg-[#FAF7F2]"
            title="To date"
          />
        </div>

        {/* Org filter for Org-wise tab */}
        {activeTab === 'org_activity' && (
          <div className="mt-3 flex items-center gap-3">
            <Building2 className="w-4 h-4 text-[#7A7268]" />
            <input
              type="text"
              placeholder="Filter by organization name…"
              value={orgFilter}
              onChange={e => setOrgFilter(e.target.value)}
              className="flex-1 max-w-sm px-3 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] placeholder-[#7A7268] focus:outline-none focus:border-[#79415A] bg-[#FAF7F2]"
            />
          </div>
        )}

        {/* Active filter chips */}
        {(search || severity !== 'all' || status !== 'all' || dateFrom || dateTo) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#79415A]/10 text-[#79415A] rounded-full text-xs font-medium">
                "{search}"
                <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {severity !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#79415A]/10 text-[#79415A] rounded-full text-xs font-medium">
                Severity: {severity}
                <button onClick={() => setSeverity('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {status !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#79415A]/10 text-[#79415A] rounded-full text-xs font-medium">
                Status: {status}
                <button onClick={() => setStatus('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {(dateFrom || dateTo) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#79415A]/10 text-[#79415A] rounded-full text-xs font-medium">
                {dateFrom} → {dateTo}
                <button onClick={() => { setDateFrom(''); setDateTo(''); }}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={() => { setSearch(''); setSeverity('all'); setStatus('all'); setDateFrom(''); setDateTo(''); }}
              className="text-xs text-[#7A7268] hover:text-[#79415A] underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Log Table Card */}
      <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5DDD2]">
          <div className="flex items-center gap-2">
            {activeTab === 'all' && <Activity className="w-4 h-4 text-[#79415A]" />}
            {activeTab === 'failed_logins' && <LogIn className="w-4 h-4 text-rose-600" />}
            {activeTab === 'admin_journal' && <Shield className="w-4 h-4 text-purple-600" />}
            {activeTab === 'system_errors' && <Server className="w-4 h-4 text-orange-600" />}
            {activeTab === 'org_activity' && <Building2 className="w-4 h-4 text-sky-600" />}
            <span className="text-sm font-semibold text-[#1F313D]">
              {TABS.find(t => t.key === activeTab)?.label}
            </span>
            <span className="text-xs text-[#7A7268] bg-[#F5F0E8] px-2 py-0.5 rounded-full">
              {total} events
            </span>
          </div>
          {activeTab === 'failed_logins' && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5" />
              Accounts locked after 5 consecutive failures
            </div>
          )}
          {activeTab === 'system_errors' && (
            <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl">
              <Zap className="w-3.5 h-3.5" />
              Integration & system errors combined
            </div>
          )}
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-[#7A7268]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#79415A]" />
              <span className="text-sm">Loading events…</span>
            </div>
          </div>
        ) : (
          <div className="p-2">
            <LogTable
              logs={activeTab === 'org_activity' && orgFilter
                ? logs.filter(e => (e.organization_name ?? '').toLowerCase().includes(orgFilter.toLowerCase()))
                : logs}
              onView={setViewEntry}
              onFlag={activeTab === 'failed_logins' ? handleFlag : undefined}
              onResolve={activeTab === 'system_errors' ? handleResolve : undefined}
              showFlagColumn={activeTab === 'failed_logins'}
              showResolveColumn={activeTab === 'system_errors'}
            />
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-[#E5DDD2]">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        )}
      </div>

      {/* Modals */}
      {viewEntry && <DetailModal entry={viewEntry} onClose={() => setViewEntry(null)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} allLogs={allLogs} />}
    </div>
  );
}

export default AuditLogPage;
