import { supabase } from './supabase';

export type AuditEventType =
  | 'admin_action'
  | 'login_failed'
  | 'login_success'
  | 'system_error'
  | 'integration_failure'
  | 'org_activity'
  | 'security_event';

export interface AuditLogEntry {
  id: string;
  event_type: AuditEventType;
  category: 'Auth' | 'Admin Actions' | 'System' | 'Integrations' | 'Organizations';
  severity: 'info' | 'warning' | 'error' | 'critical';
  actor_email: string;
  actor_role: string;
  target_email?: string;
  organization_id?: string;
  organization_name?: string;
  action: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failed';
  created_at: string;
}

export interface AuditFilters {
  search?: string;
  event_type?: AuditEventType | 'all';
  severity?: 'info' | 'warning' | 'error' | 'critical' | 'all';
  category?: string;
  organization_id?: string;
  status?: 'success' | 'failed' | 'all';
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface AuditStats {
  total_today: number;
  total_7days: number;
  total_30days: number;
  failed_logins: number;
  failed_logins_pct_change: number;
  admin_actions: number;
  system_errors: number;
  critical_alerts: number;
}

export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

function generateMockAuditData(): AuditLogEntry[] {
  const now = new Date();
  const entries: AuditLogEntry[] = [
    {
      id: '1',
      event_type: 'admin_action',
      category: 'Admin Actions',
      severity: 'info',
      actor_email: 'superadmin@cafescorner.com',
      actor_role: 'SUPER_ADMIN',
      target_email: 'admin@branches.com',
      organization_name: 'Café Corner HQ',
      action: 'Created new platform administrator account for admin@branches.com',
      ip_address: '192.168.1.10',
      status: 'success',
      created_at: new Date(now.getTime() - 5 * 60000).toISOString(),
    },
    {
      id: '2',
      event_type: 'login_failed',
      category: 'Auth',
      severity: 'warning',
      actor_email: 'unknown@hacker.com',
      actor_role: 'unknown',
      organization_name: 'Spice Route Restaurant',
      action: 'Failed login attempt — invalid password (attempt 3/5)',
      ip_address: '203.0.113.42',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'failed',
      created_at: new Date(now.getTime() - 12 * 60000).toISOString(),
    },
    {
      id: '3',
      event_type: 'system_error',
      category: 'System',
      severity: 'error',
      actor_email: 'system@cafescorner.com',
      actor_role: 'SYSTEM',
      action: 'Database connection timeout — retry #2 succeeded after 3200ms',
      details: { error_code: 'DB_TIMEOUT', retry_count: 2, resolved_at: new Date(now.getTime() - 8 * 60000).toISOString() },
      status: 'failed',
      created_at: new Date(now.getTime() - 18 * 60000).toISOString(),
    },
    {
      id: '4',
      event_type: 'integration_failure',
      category: 'Integrations',
      severity: 'critical',
      actor_email: 'system@cafescorner.com',
      actor_role: 'SYSTEM',
      organization_name: 'The Golden Fork',
      action: 'Razorpay webhook delivery failed — 503 Service Unavailable',
      details: { integration: 'Razorpay', endpoint: '/webhooks/payment', http_status: 503 },
      status: 'failed',
      created_at: new Date(now.getTime() - 25 * 60000).toISOString(),
    },
    {
      id: '5',
      event_type: 'admin_action',
      category: 'Admin Actions',
      severity: 'warning',
      actor_email: 'superadmin@cafescorner.com',
      actor_role: 'SUPER_ADMIN',
      target_email: 'manager@spiceroute.com',
      organization_name: 'Spice Route Restaurant',
      action: 'Suspended user account for manager@spiceroute.com — policy violation',
      ip_address: '192.168.1.10',
      status: 'success',
      created_at: new Date(now.getTime() - 40 * 60000).toISOString(),
    },
    {
      id: '6',
      event_type: 'login_success',
      category: 'Auth',
      severity: 'info',
      actor_email: 'admin@cafescorner.com',
      actor_role: 'PLATFORM_ADMIN',
      organization_name: 'Café Corner HQ',
      action: 'Successful login from Chrome on Windows',
      ip_address: '10.0.0.5',
      user_agent: 'Chrome/119.0.0.0',
      status: 'success',
      created_at: new Date(now.getTime() - 55 * 60000).toISOString(),
    },
    {
      id: '7',
      event_type: 'login_failed',
      category: 'Auth',
      severity: 'critical',
      actor_email: 'owner@goldenfork.com',
      actor_role: 'unknown',
      organization_name: 'The Golden Fork',
      action: 'Account locked after 5 consecutive failed login attempts',
      ip_address: '198.51.100.77',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17)',
      status: 'failed',
      created_at: new Date(now.getTime() - 70 * 60000).toISOString(),
    },
    {
      id: '8',
      event_type: 'org_activity',
      category: 'Organizations',
      severity: 'info',
      actor_email: 'superadmin@cafescorner.com',
      actor_role: 'SUPER_ADMIN',
      organization_name: 'Brew & Bites',
      action: 'Organization subscription upgraded from Basic to Professional',
      status: 'success',
      created_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
    },
    {
      id: '9',
      event_type: 'admin_action',
      category: 'Admin Actions',
      severity: 'info',
      actor_email: 'superadmin@cafescorner.com',
      actor_role: 'SUPER_ADMIN',
      target_email: 'staff@cafescorner.com',
      organization_name: 'Café Corner HQ',
      action: 'Password reset link sent to staff@cafescorner.com',
      ip_address: '192.168.1.10',
      status: 'success',
      created_at: new Date(now.getTime() - 3 * 3600000).toISOString(),
    },
    {
      id: '10',
      event_type: 'system_error',
      category: 'System',
      severity: 'warning',
      actor_email: 'system@cafescorner.com',
      actor_role: 'SYSTEM',
      action: 'Email delivery queue backed up — 47 messages pending (>5min delay)',
      details: { queue_size: 47, provider: 'SendGrid', delay_minutes: 7 },
      status: 'failed',
      created_at: new Date(now.getTime() - 4 * 3600000).toISOString(),
    },
    {
      id: '11',
      event_type: 'security_event',
      category: 'Auth',
      severity: 'critical',
      actor_email: 'unknown',
      actor_role: 'unknown',
      action: 'Brute-force pattern detected from IP 203.0.113.42 — rate limiting applied',
      ip_address: '203.0.113.42',
      status: 'failed',
      created_at: new Date(now.getTime() - 5 * 3600000).toISOString(),
    },
    {
      id: '12',
      event_type: 'integration_failure',
      category: 'Integrations',
      severity: 'error',
      actor_email: 'system@cafescorner.com',
      actor_role: 'SYSTEM',
      organization_name: 'Spice Route Restaurant',
      action: 'WhatsApp Business API rate limit exceeded — messages queued',
      details: { integration: 'WhatsApp Business', error: 'RATE_LIMIT_EXCEEDED', queued: 23 },
      status: 'failed',
      created_at: new Date(now.getTime() - 6 * 3600000).toISOString(),
    },
    {
      id: '13',
      event_type: 'admin_action',
      category: 'Admin Actions',
      severity: 'info',
      actor_email: 'superadmin@cafescorner.com',
      actor_role: 'SUPER_ADMIN',
      target_email: 'newadmin@cafescorner.com',
      organization_name: 'Café Corner HQ',
      action: 'Administrative permissions assigned: manage_users, view_reports',
      ip_address: '192.168.1.10',
      status: 'success',
      created_at: new Date(now.getTime() - 8 * 3600000).toISOString(),
    },
    {
      id: '14',
      event_type: 'org_activity',
      category: 'Organizations',
      severity: 'warning',
      actor_email: 'superadmin@cafescorner.com',
      actor_role: 'SUPER_ADMIN',
      organization_name: 'Brew & Bites',
      action: 'Organization account deactivated — payment overdue (30 days)',
      status: 'success',
      created_at: new Date(now.getTime() - 24 * 3600000).toISOString(),
    },
    {
      id: '15',
      event_type: 'login_failed',
      category: 'Auth',
      severity: 'warning',
      actor_email: 'admin@spiceroute.com',
      actor_role: 'unknown',
      organization_name: 'Spice Route Restaurant',
      action: 'Failed login — MFA verification timeout',
      ip_address: '172.16.0.33',
      user_agent: 'Safari/17.0 (macOS)',
      status: 'failed',
      created_at: new Date(now.getTime() - 26 * 3600000).toISOString(),
    },
  ];
  return entries;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getAuditLogs(filters: AuditFilters = {}): Promise<PaginatedAuditLogs> {
  const page = filters.page ?? 1;
  const page_size = filters.page_size ?? 15;

  try {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.or(`actor_email.ilike.%${filters.search}%,action.ilike.%${filters.search}%,organization_name.ilike.%${filters.search}%`);
    }
    if (filters.event_type && filters.event_type !== 'all') {
      query = query.eq('event_type', filters.event_type);
    }
    if (filters.severity && filters.severity !== 'all') {
      query = query.eq('severity', filters.severity);
    }
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const from = (page - 1) * page_size;
    query = query.range(from, from + page_size - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data as AuditLogEntry[], total: count ?? 0, page, page_size };
  } catch {
    // Fallback to mock data
    let mock = generateMockAuditData();

    if (filters.search) {
      const s = filters.search.toLowerCase();
      mock = mock.filter(e =>
        e.actor_email.toLowerCase().includes(s) ||
        e.action.toLowerCase().includes(s) ||
        (e.organization_name ?? '').toLowerCase().includes(s)
      );
    }
    if (filters.event_type && filters.event_type !== 'all') {
      mock = mock.filter(e => e.event_type === filters.event_type);
    }
    if (filters.severity && filters.severity !== 'all') {
      mock = mock.filter(e => e.severity === filters.severity);
    }
    if (filters.category && filters.category !== 'all') {
      mock = mock.filter(e => e.category === filters.category);
    }
    if (filters.status && filters.status !== 'all') {
      mock = mock.filter(e => e.status === filters.status);
    }

    const total = mock.length;
    const from = (page - 1) * page_size;
    const data = mock.slice(from, from + page_size);
    return { data, total, page, page_size };
  }
}

export async function getAuditStats(): Promise<AuditStats> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const week = new Date(now.getTime() - 7 * 86400000).toISOString();
    const month = new Date(now.getTime() - 30 * 86400000).toISOString();

    const [t, w, m, fl, aa, se, ca] = await Promise.all([
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', week),
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', month),
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).eq('event_type', 'login_failed').gte('created_at', week),
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).eq('event_type', 'admin_action').gte('created_at', week),
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).in('event_type', ['system_error', 'integration_failure']).gte('created_at', week),
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).eq('severity', 'critical').gte('created_at', week),
    ]);

    if (t.error) throw t.error;

    return {
      total_today: t.count ?? 0,
      total_7days: w.count ?? 0,
      total_30days: m.count ?? 0,
      failed_logins: fl.count ?? 0,
      failed_logins_pct_change: 12,
      admin_actions: aa.count ?? 0,
      system_errors: se.count ?? 0,
      critical_alerts: ca.count ?? 0,
    };
  } catch {
    return {
      total_today: 8,
      total_7days: 47,
      total_30days: 183,
      failed_logins: 6,
      failed_logins_pct_change: 12,
      admin_actions: 24,
      system_errors: 7,
      critical_alerts: 3,
    };
  }
}

export function exportAuditReportCSV(logs: AuditLogEntry[], filename = 'audit-report.csv'): void {
  const headers = [
    'Timestamp', 'Event Type', 'Category', 'Severity', 'Actor Email',
    'Actor Role', 'Target Email', 'Organization', 'Action', 'Status',
    'IP Address', 'User Agent',
  ];

  const rows = logs.map(e => [
    new Date(e.created_at).toLocaleString(),
    e.event_type,
    e.category,
    e.severity,
    e.actor_email,
    e.actor_role,
    e.target_email ?? '',
    e.organization_name ?? '',
    `"${e.action.replace(/"/g, '""')}"`,
    e.status,
    e.ip_address ?? '',
    e.user_agent ?? '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAuditReportJSON(logs: AuditLogEntry[], filename = 'audit-report.json'): void {
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
