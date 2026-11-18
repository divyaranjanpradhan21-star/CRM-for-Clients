/**
 * Global Settings API & Types
 * Manages:
 *   1. Platform Name, Logo & Branding
 *   2. Default Currency, Timezone & Date/Time formats
 *   3. Global Notification Settings (Email, SMS, Push, Alerts)
 *   4. System-Wide Security Settings (Password, Session, Lockout, MFA, IP Whitelist)
 *   5. Third-Party Integrations (Payments, Storage, Comms, Analytics)
 *   6. System Configuration History & Rollback
 */

import { supabase } from './supabase';

// ─── 1. Branding Settings ─────────────────────────────────────────────────────

export interface BrandingSettings {
  platform_name: string;
  platform_tagline: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  support_email: string;
  support_phone: string;
  footer_text: string;
  portal_title: string;
}

// ─── 2. Localization Settings ─────────────────────────────────────────────────

export interface LocalizationSettings {
  default_currency: string;          // e.g. 'INR', 'USD', 'EUR', 'GBP', 'AED'
  currency_symbol: string;            // e.g. '₹', '$', '€', '£', 'د.إ'
  currency_position: 'before' | 'after';
  decimal_precision: number;          // 0 or 2
  default_timezone: string;          // e.g. 'Asia/Kolkata', 'America/New_York'
  date_format: string;                // e.g. 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'
  time_format: '12h' | '24h';
  fiscal_year_start: '04-01' | '01-01'; // April 1 or Jan 1
}

// ─── 3. Notification Settings ─────────────────────────────────────────────────

export interface NotificationSettings {
  email_enabled: boolean;
  email_provider: 'smtp' | 'sendgrid' | 'postmark' | 'supabase_auth';
  email_from_name: string;
  email_from_address: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_encryption?: 'tls' | 'ssl' | 'none';

  sms_enabled: boolean;
  sms_provider: 'twilio' | 'msg91' | 'aws_sns';

  push_enabled: boolean;
  push_provider: 'firebase' | 'onesignal';

  // Event Triggers
  notify_new_organization: boolean;
  notify_subscription_renewals: boolean;
  notify_failed_logins: boolean;
  notify_system_maintenance: boolean;
  daily_executive_digest: boolean;
}

// ─── 4. Security Settings ─────────────────────────────────────────────────────

export interface SecuritySettings {
  min_password_length: number;
  require_uppercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  mfa_enforcement: 'disabled' | 'optional' | 'super_admin_only' | 'all_admins' | 'all_users';
  ip_whitelist_enabled: boolean;
  ip_whitelist: string;
  sso_enabled: boolean;
  allowed_oauth_providers: string[];
  audit_log_retention_days: number;
}

// ─── 5. Integrations Settings ─────────────────────────────────────────────────

export interface IntegrationItem {
  id: string;
  name: string;
  category: 'payment' | 'storage' | 'communication' | 'analytics';
  provider: string;
  is_enabled: boolean;
  is_connected: boolean;
  environment: 'production' | 'sandbox' | 'test';
  credentials: Record<string, string>;
  last_sync_at?: string;
  notes?: string;
}

export interface IntegrationsSettings {
  items: IntegrationItem[];
}

// ─── 6. Full Global Settings Interface ────────────────────────────────────────

export interface GlobalSettingsState {
  branding: BrandingSettings;
  localization: LocalizationSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  integrations: IntegrationsSettings;
}

// ─── 7. Configuration History Entry ───────────────────────────────────────────

export interface ConfigHistoryEntry {
  id: string;
  version: string;
  category: 'Branding' | 'Localization' | 'Notifications' | 'Security' | 'Integrations' | 'Full Rollback';
  changed_by: string;
  change_summary: string;
  timestamp: string;
  snapshot: GlobalSettingsState;
  reverted_from_version?: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettingsState = {
  branding: {
    platform_name: "Cafe's Corner Multi-Tenant Platform",
    platform_tagline: "Enterprise Coffee Shop Management & POS Cloud",
    logo_url: '/logo.png',
    favicon_url: '/favicon.ico',
    primary_color: '#3A5726',
    secondary_color: '#EFEACA',
    support_email: 'support@cafescorner.com',
    support_phone: '+91 800-456-7890',
    footer_text: "Cafe's Corner · Multi-Tenant Restaurant CRM & Cloud POS",
    portal_title: "Cafe's Corner Administration",
  },
  localization: {
    default_currency: 'INR',
    currency_symbol: '₹',
    currency_position: 'before',
    decimal_precision: 2,
    default_timezone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
    time_format: '12h',
    fiscal_year_start: '04-01',
  },
  notifications: {
    email_enabled: true,
    email_provider: 'smtp',
    email_from_name: "Cafe's Corner Notifications",
    email_from_address: 'notifications@cafescorner.com',
    smtp_host: 'smtp.sendgrid.net',
    smtp_port: 587,
    smtp_encryption: 'tls',
    sms_enabled: true,
    sms_provider: 'twilio',
    push_enabled: true,
    push_provider: 'firebase',
    notify_new_organization: true,
    notify_subscription_renewals: true,
    notify_failed_logins: true,
    notify_system_maintenance: true,
    daily_executive_digest: true,
  },
  security: {
    min_password_length: 8,
    require_uppercase: true,
    require_numbers: true,
    require_special_chars: true,
    session_timeout_minutes: 60,
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
    mfa_enforcement: 'super_admin_only',
    ip_whitelist_enabled: false,
    ip_whitelist: '192.168.1.0/24, 10.0.0.0/8',
    sso_enabled: true,
    allowed_oauth_providers: ['google', 'apple'],
    audit_log_retention_days: 180,
  },
  integrations: {
    items: [
      {
        id: 'int-stripe',
        name: 'Stripe Payments',
        category: 'payment',
        provider: 'stripe',
        is_enabled: true,
        is_connected: true,
        environment: 'production',
        credentials: {
          publishable_key: 'pk_live_********************4819',
          secret_key: 'sk_live_********************9201',
          webhook_secret: 'whsec_********************',
        },
        last_sync_at: new Date(Date.now() - 3600000).toISOString(),
        notes: 'Processes international credit & debit cards for subscription billing',
      },
      {
        id: 'int-razorpay',
        name: 'Razorpay Gateway',
        category: 'payment',
        provider: 'razorpay',
        is_enabled: true,
        is_connected: true,
        environment: 'production',
        credentials: {
          key_id: 'rzp_live_****************',
          key_secret: '************************',
        },
        last_sync_at: new Date(Date.now() - 14400000).toISOString(),
        notes: 'UPI, NetBanking & domestic Indian payments provider',
      },
      {
        id: 'int-supabase-storage',
        name: 'Supabase Cloud Storage',
        category: 'storage',
        provider: 'supabase',
        is_enabled: true,
        is_connected: true,
        environment: 'production',
        credentials: {
          bucket_name: 'restaurant-assets',
          region: 'ap-south-1',
        },
        last_sync_at: new Date().toISOString(),
        notes: 'Stores restaurant logos, menus, and media assets',
      },
      {
        id: 'int-whatsapp',
        name: 'WhatsApp Cloud API',
        category: 'communication',
        provider: 'meta_whatsapp',
        is_enabled: true,
        is_connected: true,
        environment: 'production',
        credentials: {
          phone_number_id: '109283746592817',
          business_account_id: '82736451928374',
          access_token: 'EAAG********************',
        },
        last_sync_at: new Date(Date.now() - 7200000).toISOString(),
        notes: 'Automated table booking confirmations and digital receipts',
      },
      {
        id: 'int-ga4',
        name: 'Google Analytics 4',
        category: 'analytics',
        provider: 'google_analytics',
        is_enabled: true,
        is_connected: true,
        environment: 'production',
        credentials: {
          measurement_id: 'G-7X9Y2Z8W4K',
        },
        last_sync_at: new Date().toISOString(),
        notes: 'Tracks portal traffic, conversion funnels & user engagement',
      },
      {
        id: 'int-slack',
        name: 'Slack Alerts Webhook',
        category: 'communication',
        provider: 'slack',
        is_enabled: false,
        is_connected: false,
        environment: 'test',
        credentials: {
          webhook_url: 'https://hooks.slack.com/services/T00/B00/XXXX',
          channel: '#alerts-crm',
        },
        notes: 'Dispatches high-priority system alerts and security warnings',
      },
    ],
  },
};

// ─── Local Storage Cache Key ──────────────────────────────────────────────────

const STORAGE_SETTINGS_KEY = 'crm_global_settings_v1';
const STORAGE_HISTORY_KEY = 'crm_config_history_v1';

// Initial seed history entries
function getInitialHistory(): ConfigHistoryEntry[] {
  return [
    {
      id: 'cfg-v1.3',
      version: 'v1.3',
      category: 'Security',
      changed_by: 'superadmin@cafescorner.com',
      change_summary: 'Enforced MFA for Super Admin & updated session idle timeout to 60 minutes',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      snapshot: DEFAULT_GLOBAL_SETTINGS,
    },
    {
      id: 'cfg-v1.2',
      version: 'v1.2',
      category: 'Localization',
      changed_by: 'superadmin@cafescorner.com',
      change_summary: 'Configured default currency to INR (₹) and timezone to Asia/Kolkata (IST)',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      snapshot: DEFAULT_GLOBAL_SETTINGS,
    },
    {
      id: 'cfg-v1.1',
      version: 'v1.1',
      category: 'Branding',
      changed_by: 'superadmin@cafescorner.com',
      change_summary: "Set platform name to \"Cafe's Corner Multi-Tenant Platform\" & updated brand palette",
      timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
      snapshot: DEFAULT_GLOBAL_SETTINGS,
    },
    {
      id: 'cfg-v1.0',
      version: 'v1.0',
      category: 'Branding',
      changed_by: 'system',
      change_summary: 'Initial system initialization',
      timestamp: new Date(Date.now() - 86400000 * 30).toISOString(),
      snapshot: DEFAULT_GLOBAL_SETTINGS,
    },
  ];
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Load global settings.
 * Checks Supabase `global_settings` table first, falls back to localStorage/defaults.
 */
export async function getGlobalSettings(): Promise<{
  data: GlobalSettingsState;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('global_settings')
      .select('settings_data')
      .eq('id', 'singleton')
      .single();

    if (data?.settings_data) {
      return { data: { ...DEFAULT_GLOBAL_SETTINGS, ...data.settings_data }, error: null };
    }
  } catch (err) {
    // DB table might not exist yet, fallback to localStorage cache
  }

  try {
    const cached = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (cached) {
      return { data: JSON.parse(cached), error: null };
    }
  } catch {}

  return { data: DEFAULT_GLOBAL_SETTINGS, error: null };
}

/**
 * Save global settings section.
 * Automatically appends to configuration history log.
 */
export async function saveGlobalSettings(
  updatedSettings: GlobalSettingsState,
  category: ConfigHistoryEntry['category'],
  changeSummary: string,
  userEmail: string = 'superadmin@cafescorner.com'
): Promise<{ success: boolean; error: string | null; newVersion: string }> {
  const versionNum = 'v' + (1 + (Date.now() % 10000) / 1000).toFixed(1);

  // 1. Save to Supabase
  try {
    await supabase.from('global_settings').upsert({
      id: 'singleton',
      settings_data: updatedSettings,
      updated_at: new Date().toISOString(),
      updated_by: userEmail,
    });
  } catch {}

  // 2. Cache in localStorage
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updatedSettings));
  } catch {}

  // 3. Append to history
  const historyEntry: ConfigHistoryEntry = {
    id: `cfg-${Date.now()}`,
    version: versionNum,
    category,
    changed_by: userEmail,
    change_summary: changeSummary,
    timestamp: new Date().toISOString(),
    snapshot: updatedSettings,
  };

  try {
    await supabase.from('system_config_history').insert({
      version: versionNum,
      category,
      changed_by: userEmail,
      change_summary: changeSummary,
      snapshot_data: updatedSettings,
      created_at: new Date().toISOString(),
    });
  } catch {}

  try {
    const historyList = await getConfigHistory();
    const updatedHistory = [historyEntry, ...historyList.data];
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch {}

  return { success: true, error: null, newVersion: versionNum };
}

/**
 * Retrieve system configuration change history.
 */
export async function getConfigHistory(): Promise<{
  data: ConfigHistoryEntry[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('system_config_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const mapped = data.map((d: any) => ({
        id: d.id,
        version: d.version,
        category: d.category,
        changed_by: d.changed_by,
        change_summary: d.change_summary,
        timestamp: d.created_at,
        snapshot: d.snapshot_data,
        reverted_from_version: d.reverted_from_version,
      }));
      return { data: mapped, error: null };
    }
  } catch {}

  try {
    const cached = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (cached) {
      return { data: JSON.parse(cached), error: null };
    }
  } catch {}

  const initial = getInitialHistory();
  try {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(initial));
  } catch {}

  return { data: initial, error: null };
}

/**
 * Rollback configuration to a historical version.
 */
export async function rollbackConfiguration(
  targetEntry: ConfigHistoryEntry,
  userEmail: string = 'superadmin@cafescorner.com'
): Promise<{ success: boolean; error: string | null; restoredSettings: GlobalSettingsState }> {
  const restoredSettings = targetEntry.snapshot;
  const rollbackSummary = `Rollback configuration to ${targetEntry.version} (${targetEntry.category}: ${targetEntry.change_summary})`;

  await saveGlobalSettings(
    restoredSettings,
    'Full Rollback',
    rollbackSummary,
    userEmail
  );

  return { success: true, error: null, restoredSettings };
}

/**
 * Test integration connection mock handler.
 */
export async function testIntegrationConnection(itemId: string): Promise<{
  success: boolean;
  message: string;
  latencyMs: number;
}> {
  await new Promise(r => setTimeout(r, 900)); // simulate latency
  const latency = Math.floor(Math.random() * 80) + 40;
  return {
    success: true,
    message: `Connection handshake verified successfully. Response latency: ${latency}ms.`,
    latencyMs: latency,
  };
}
