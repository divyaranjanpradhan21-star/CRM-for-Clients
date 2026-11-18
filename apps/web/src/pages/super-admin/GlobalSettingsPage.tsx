/**
 * GlobalSettingsPage — Super Admin
 * Comprehensive Platform Settings Module:
 *   · Tab 1: Platform Branding (Name, Logo, Favicon, Colors, Support Contact)
 *   · Tab 2: Localization (Default Currency, Timezone, Date Format, Time Format)
 *   · Tab 3: Global Notifications (Email/SMTP, SMS, Push, Event Alerts)
 *   · Tab 4: System Security (Password Policy, Session Timeout, Lockout, MFA, IP Whitelist)
 *   · Tab 5: Third-Party Integrations (Stripe, Razorpay, Storage, WhatsApp, Analytics)
 *   · Tab 6: Configuration History & Rollback (Versioned changelog + 1-click restore)
 */

import React, { useState, useEffect } from 'react';
import {
  Settings, Sliders, Globe, Shield, Bell, Network, History, Save,
  RotateCcw, CheckCircle2, AlertTriangle, RefreshCw, Eye, EyeOff,
  Building, Mail, Phone, DollarSign, Clock, Calendar, Lock, Unlock,
  Layers, KeyRound, ExternalLink, Zap, Check, X, ShieldAlert, Sparkles,
  Server, Smartphone, MessageSquare, Terminal, ChevronRight, ArrowLeftRight
} from 'lucide-react';
import {
  GlobalSettingsState, DEFAULT_GLOBAL_SETTINGS, ConfigHistoryEntry,
  IntegrationItem, getGlobalSettings, saveGlobalSettings, getConfigHistory,
  rollbackConfiguration, testIntegrationConnection
} from '../../lib/globalSettingsApi';
import { getCurrentUser } from '../../lib/auth';

type SettingsTab = 'branding' | 'localization' | 'notifications' | 'security' | 'integrations' | 'history';

export const GlobalSettingsPage: React.FC = () => {
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] = useState<SettingsTab>('branding');
  const [settings, setSettings] = useState<GlobalSettingsState>(DEFAULT_GLOBAL_SETTINGS);
  const [history, setHistory] = useState<ConfigHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Integration credential edit modal
  const [editingIntegration, setEditingIntegration] = useState<IntegrationItem | null>(null);
  const [integrationCreds, setIntegrationCreds] = useState<Record<string, string>>({});

  // Rollback confirmation modal
  const [rollbackTarget, setRollbackTarget] = useState<ConfigHistoryEntry | null>(null);

  // Load initial settings and history
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [settingsRes, historyRes] = await Promise.all([
        getGlobalSettings(),
        getConfigHistory(),
      ]);
      setSettings(settingsRes.data);
      setHistory(historyRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Save Handlers ──────────────────────────────────────────────────────────

  const handleSaveSection = async (
    category: ConfigHistoryEntry['category'],
    summary: string
  ) => {
    setSaving(true);
    const { success, newVersion, error } = await saveGlobalSettings(
      settings,
      category,
      summary,
      currentUser?.email || 'superadmin@cafescorner.com'
    );
    setSaving(false);

    if (success) {
      showToast(`Saved successfully! Created configuration version ${newVersion}.`);
      // Reload history list
      const h = await getConfigHistory();
      setHistory(h.data);
    } else {
      showToast(error || 'Failed to save settings.', 'error');
    }
  };

  // ─── Rollback Handler ────────────────────────────────────────────────────────

  const handleConfirmRollback = async () => {
    if (!rollbackTarget) return;
    setSaving(true);
    const { success, restoredSettings, error } = await rollbackConfiguration(
      rollbackTarget,
      currentUser?.email || 'superadmin@cafescorner.com'
    );
    setSaving(false);
    setRollbackTarget(null);

    if (success) {
      setSettings(restoredSettings);
      showToast(`Successfully rolled back to configuration version ${rollbackTarget.version}.`);
      const h = await getConfigHistory();
      setHistory(h.data);
    } else {
      showToast(error || 'Failed to rollback settings.', 'error');
    }
  };

  // ─── Integration Test Handler ───────────────────────────────────────────────

  const handleTestIntegration = async (item: IntegrationItem) => {
    setTestingId(item.id);
    const res = await testIntegrationConnection(item.id);
    setTestingId(null);
    if (res.success) {
      showToast(`${item.name}: ${res.message}`, 'success');
      // Mark as connected and update sync timestamp
      setSettings(prev => ({
        ...prev,
        integrations: {
          items: prev.integrations.items.map(it =>
            it.id === item.id ? { ...it, is_connected: true, last_sync_at: new Date().toISOString() } : it
          ),
        },
      }));
    } else {
      showToast(`${item.name} handshake failed.`, 'error');
    }
  };

  const handleSaveIntegrationCredentials = () => {
    if (!editingIntegration) return;
    setSettings(prev => ({
      ...prev,
      integrations: {
        items: prev.integrations.items.map(it =>
          it.id === editingIntegration.id
            ? { ...it, credentials: { ...it.credentials, ...integrationCreds } }
            : it
        ),
      },
    }));
    setEditingIntegration(null);
    handleSaveSection(
      'Integrations',
      `Updated credentials for integration "${editingIntegration.name}"`
    );
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-[#7A7268]">
        <div className="w-8 h-8 border-3 border-[#79415A]/30 border-t-[#79415A] rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading global platform settings…</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F5F0E8] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F313D] font-serif flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#79415A]" /> Global Settings &amp; Platform Controls
          </h1>
          <p className="text-sm text-[#7A7268] mt-0.5">
            Configure multi-tenant branding, localization, notification triggers, security controls, and third-party integrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSaveSection('Branding', 'Manual bulk settings save')}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#79415A] hover:bg-[#68364c] text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs p-1.5 flex gap-1 overflow-x-auto">
        {[
          { id: 'branding', label: 'Platform & Branding', icon: Building },
          { id: 'localization', label: 'Currency & Timezone', icon: Globe },
          { id: 'notifications', label: 'Global Notifications', icon: Bell },
          { id: 'security', label: 'Security & Auth', icon: Shield },
          { id: 'integrations', label: 'Third-Party Integrations', icon: Network },
          { id: 'history', label: 'Configuration History', icon: History },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as SettingsTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#79415A] text-white shadow-xs'
                  : 'text-[#7A7268] hover:text-[#1F313D] hover:bg-[#FAF7F2]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 1: BRANDING & PLATFORM INFO
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs p-6 space-y-6">
          <div className="border-b border-[#E5DDD2] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1F313D]">Platform Identity &amp; Branding</h2>
              <p className="text-xs text-[#7A7268] mt-0.5">Customize the platform name, logo, typography, and support metadata.</p>
            </div>
            <button
              onClick={() => handleSaveSection('Branding', 'Updated platform branding, logo and contact details')}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" /> Save Branding
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.branding.platform_name}
                onChange={(e) => setSettings({
                  ...settings,
                  branding: { ...settings.branding, platform_name: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] font-medium focus:outline-none focus:border-[#79415A]"
                placeholder="e.g. Cafe's Corner Multi-Tenant Platform"
              />
            </div>

            {/* Platform Tagline */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Platform Tagline / Slogan
              </label>
              <input
                type="text"
                value={settings.branding.platform_tagline}
                onChange={(e) => setSettings({
                  ...settings,
                  branding: { ...settings.branding, platform_tagline: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] font-medium focus:outline-none focus:border-[#79415A]"
                placeholder="e.g. Enterprise Restaurant CRM & POS Cloud"
              />
            </div>

            {/* Logo URL & Live Preview */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Platform Logo URL
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2] p-1.5 flex items-center justify-center shrink-0">
                  <img
                    src={settings.branding.logo_url}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as any).src = '/logo.png'; }}
                  />
                </div>
                <input
                  type="text"
                  value={settings.branding.logo_url}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, logo_url: e.target.value }
                  })}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] font-medium focus:outline-none focus:border-[#79415A]"
                  placeholder="/logo.png"
                />
              </div>
            </div>

            {/* Favicon URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Favicon URL
              </label>
              <input
                type="text"
                value={settings.branding.favicon_url}
                onChange={(e) => setSettings({
                  ...settings,
                  branding: { ...settings.branding, favicon_url: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] font-medium focus:outline-none focus:border-[#79415A]"
                placeholder="/favicon.ico"
              />
            </div>

            {/* Primary & Secondary Brand Colors */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.branding.primary_color}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, primary_color: e.target.value }
                  })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-[#E5DDD2] p-1"
                />
                <input
                  type="text"
                  value={settings.branding.primary_color}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, primary_color: e.target.value }
                  })}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm font-mono text-[#1F313D] uppercase focus:outline-none focus:border-[#79415A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Card Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.branding.secondary_color}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, secondary_color: e.target.value }
                  })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-[#E5DDD2] p-1"
                />
                <input
                  type="text"
                  value={settings.branding.secondary_color}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, secondary_color: e.target.value }
                  })}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm font-mono text-[#1F313D] uppercase focus:outline-none focus:border-[#79415A]"
                />
              </div>
            </div>

            {/* Support Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Support Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-[#9CA3AF]" />
                <input
                  type="email"
                  value={settings.branding.support_email}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, support_email: e.target.value }
                  })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  placeholder="support@cafescorner.com"
                />
              </div>
            </div>

            {/* Support Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Support Hotline
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={settings.branding.support_phone}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, support_phone: e.target.value }
                  })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  placeholder="+91 800-456-7890"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 2: LOCALIZATION & FORMATS (Currency, Timezone, Date Format)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'localization' && (
        <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs p-6 space-y-6">
          <div className="border-b border-[#E5DDD2] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1F313D]">Default Currency, Timezone &amp; Date Formats</h2>
              <p className="text-xs text-[#7A7268] mt-0.5">Establish system-wide baseline conventions for monetary and temporal displays.</p>
            </div>
            <button
              onClick={() => handleSaveSection('Localization', `Updated default currency to ${settings.localization.default_currency} and timezone to ${settings.localization.default_timezone}`)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" /> Save Localization
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Default Currency */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Default Currency
              </label>
              <select
                value={settings.localization.default_currency}
                onChange={(e) => {
                  const val = e.target.value;
                  const symbols: Record<string, string> = {
                    INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', CAD: '$', AUD: '$', JPY: '¥', SGD: '$'
                  };
                  setSettings({
                    ...settings,
                    localization: {
                      ...settings.localization,
                      default_currency: val,
                      currency_symbol: symbols[val] || '$',
                    }
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] bg-white font-medium focus:outline-none focus:border-[#79415A]"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - United States Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
                <option value="SGD">SGD ($) - Singapore Dollar</option>
                <option value="JPY">JPY (¥) - Japanese Yen</option>
              </select>
            </div>

            {/* Currency Symbol Position */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Symbol Position
              </label>
              <select
                value={settings.localization.currency_position}
                onChange={(e) => setSettings({
                  ...settings,
                  localization: { ...settings.localization, currency_position: e.target.value as any }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] bg-white font-medium focus:outline-none focus:border-[#79415A]"
              >
                <option value="before">Before Amount (e.g. ₹ 1,450.00)</option>
                <option value="after">After Amount (e.g. 1,450.00 ₹)</option>
              </select>
            </div>

            {/* Decimal Precision */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Decimal Precision
              </label>
              <select
                value={settings.localization.decimal_precision}
                onChange={(e) => setSettings({
                  ...settings,
                  localization: { ...settings.localization, decimal_precision: Number(e.target.value) }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] bg-white font-medium focus:outline-none focus:border-[#79415A]"
              >
                <option value={2}>2 Decimals (e.g. 450.50)</option>
                <option value={0}>0 Decimals (e.g. 450)</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Default Timezone
              </label>
              <select
                value={settings.localization.default_timezone}
                onChange={(e) => setSettings({
                  ...settings,
                  localization: { ...settings.localization, default_timezone: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] bg-white font-medium focus:outline-none focus:border-[#79415A]"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST - UTC+00:00)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST - UTC-08:00)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Date Format
              </label>
              <select
                value={settings.localization.date_format}
                onChange={(e) => setSettings({
                  ...settings,
                  localization: { ...settings.localization, date_format: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] bg-white font-medium focus:outline-none focus:border-[#79415A]"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 18/11/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/18/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO e.g. 2026-11-18)</option>
                <option value="DD MMM YYYY">DD MMM YYYY (e.g. 18 Nov 2026)</option>
              </select>
            </div>

            {/* Time Format */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Time Format
              </label>
              <select
                value={settings.localization.time_format}
                onChange={(e) => setSettings({
                  ...settings,
                  localization: { ...settings.localization, time_format: e.target.value as any }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] bg-white font-medium focus:outline-none focus:border-[#79415A]"
              >
                <option value="12h">12-Hour Clock (04:15 PM)</option>
                <option value="24h">24-Hour Military Clock (16:15)</option>
              </select>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="bg-[#FAF7F2] rounded-xl p-4 border border-[#E5DDD2] flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#79415A]" />
              <span className="text-xs font-bold text-[#1F313D]">Sample Localization Output:</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#5C5549] font-mono">
              <span>
                Currency: <strong>{settings.localization.currency_position === 'before' ? `${settings.localization.currency_symbol} 1,250.${settings.localization.decimal_precision === 2 ? '00' : ''}` : `1,250.${settings.localization.decimal_precision === 2 ? '00' : ''} ${settings.localization.currency_symbol}`}</strong>
              </span>
              <span>
                Timestamp: <strong>18 Nov 2026, {settings.localization.time_format === '12h' ? '04:15 PM' : '16:15'} ({settings.localization.default_timezone.split('/')[1]})</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 3: GLOBAL NOTIFICATION SETTINGS
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs p-6 space-y-6">
          <div className="border-b border-[#E5DDD2] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1F313D]">Global Notification Gateways &amp; Event Triggers</h2>
              <p className="text-xs text-[#7A7268] mt-0.5">Control email delivery, SMS gateways, and platform-wide automated alert dispatchers.</p>
            </div>
            <button
              onClick={() => handleSaveSection('Notifications', 'Updated notification channels and event triggers')}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" /> Save Notifications
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Email Gateway Card */}
            <div className="border border-[#E5DDD2] rounded-xl p-4 bg-[#FAF7F2] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-bold text-[#1F313D]">Email Notifications</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.email_enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email_enabled: e.target.checked }
                  })}
                  className="w-4 h-4 accent-[#79415A] cursor-pointer"
                />
              </div>
              <p className="text-xs text-[#7A7268]">Deliver receipts, invitations &amp; password resets.</p>
              <div>
                <label className="text-[11px] font-bold text-[#5C5549] block mb-1">Email Provider</label>
                <select
                  value={settings.notifications.email_provider}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email_provider: e.target.value as any }
                  })}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E5DDD2] bg-white font-medium"
                >
                  <option value="smtp">Custom SMTP Gateway</option>
                  <option value="sendgrid">Twilio SendGrid API</option>
                  <option value="postmark">Postmark App</option>
                  <option value="supabase_auth">Supabase Built-in Auth</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#5C5549] block mb-1">From Email Address</label>
                <input
                  type="email"
                  value={settings.notifications.email_from_address}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email_from_address: e.target.value }
                  })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E5DDD2]"
                />
              </div>
            </div>

            {/* SMS Gateway Card */}
            <div className="border border-[#E5DDD2] rounded-xl p-4 bg-[#FAF7F2] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-[#1F313D]">SMS Gateway</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.sms_enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, sms_enabled: e.target.checked }
                  })}
                  className="w-4 h-4 accent-[#79415A] cursor-pointer"
                />
              </div>
              <p className="text-xs text-[#7A7268]">Send OTPs, table confirmations &amp; critical alerts.</p>
              <div>
                <label className="text-[11px] font-bold text-[#5C5549] block mb-1">SMS Provider</label>
                <select
                  value={settings.notifications.sms_provider}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, sms_provider: e.target.value as any }
                  })}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E5DDD2] bg-white font-medium"
                >
                  <option value="twilio">Twilio Programmable SMS</option>
                  <option value="msg91">Msg91 India SMS Gateway</option>
                  <option value="aws_sns">AWS Simple Notification Service</option>
                </select>
              </div>
            </div>

            {/* Push Notifications Card */}
            <div className="border border-[#E5DDD2] rounded-xl p-4 bg-[#FAF7F2] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-[#1F313D]">Push Notifications</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.push_enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, push_enabled: e.target.checked }
                  })}
                  className="w-4 h-4 accent-[#79415A] cursor-pointer"
                />
              </div>
              <p className="text-xs text-[#7A7268]">Web &amp; Mobile push alerts for staff POS &amp; admins.</p>
              <div>
                <label className="text-[11px] font-bold text-[#5C5549] block mb-1">Push Engine</label>
                <select
                  value={settings.notifications.push_provider}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, push_provider: e.target.value as any }
                  })}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E5DDD2] bg-white font-medium"
                >
                  <option value="firebase">Google Firebase Cloud Messaging (FCM)</option>
                  <option value="onesignal">OneSignal Web Push</option>
                </select>
              </div>
            </div>
          </div>

          {/* Granular Event Triggers */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-3">
              Automated Event Alert Triggers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'notify_new_organization', label: 'New Restaurant Registration Alert', desc: 'Dispatch instant notice to Super Admin when an organization signs up.' },
                { key: 'notify_subscription_renewals', label: 'Subscription Expiry & Renewal Reminders', desc: 'Notify restaurant owners at 7 days, 3 days, and 24 hours before expiration.' },
                { key: 'notify_failed_logins', label: 'Security Lockout Alerts', desc: 'Trigger admin notification upon repeated failed authentication attempts.' },
                { key: 'daily_executive_digest', label: 'Daily Multi-Branch Executive Digest', desc: 'Email daily sales, orders, and reservation rollups at 23:59.' },
                { key: 'notify_system_maintenance', label: 'System Maintenance Broadcast', desc: 'Broadcast banner and alert to all active restaurant portals during scheduled updates.' },
              ].map((item) => (
                <label key={item.key} className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2] cursor-pointer hover:border-[#79415A] transition">
                  <input
                    type="checkbox"
                    checked={(settings.notifications as any)[item.key]}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, [item.key]: e.target.checked }
                    })}
                    className="w-4 h-4 mt-0.5 accent-[#79415A] cursor-pointer shrink-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1F313D] block">{item.label}</span>
                    <span className="text-[11px] text-[#7A7268] leading-tight block mt-0.5">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 4: SYSTEM-WIDE SECURITY SETTINGS
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs p-6 space-y-6">
          <div className="border-b border-[#E5DDD2] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1F313D]">System-Wide Security &amp; Access Controls</h2>
              <p className="text-xs text-[#7A7268] mt-0.5">Enforce password policies, session timeouts, MFA rules, and IP whitelisting.</p>
            </div>
            <button
              onClick={() => handleSaveSection('Security', 'Updated system-wide security controls, MFA enforcement, and session policy')}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" /> Save Security
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* MFA Policy */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Two-Factor Authentication (2FA/MFA)
              </label>
              <select
                value={settings.security.mfa_enforcement}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, mfa_enforcement: e.target.value as any }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] bg-white font-medium focus:outline-none focus:border-[#79415A]"
              >
                <option value="super_admin_only">Mandatory for Super Admin Only</option>
                <option value="all_admins">Mandatory for All Administrators</option>
                <option value="all_users">Mandatory for All Users &amp; Staff</option>
                <option value="optional">Optional for All Users</option>
                <option value="disabled">Disabled Across Platform</option>
              </select>
            </div>

            {/* Session Timeout */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Session Idle Timeout
              </label>
              <select
                value={settings.security.session_timeout_minutes}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, session_timeout_minutes: Number(e.target.value) }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] bg-white font-medium focus:outline-none focus:border-[#79415A]"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (Recommended)</option>
                <option value={120}>2 Hours</option>
                <option value={240}>4 Hours</option>
              </select>
            </div>

            {/* Max Login Attempts */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Max Login Attempts Before Lockout
              </label>
              <select
                value={settings.security.max_login_attempts}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, max_login_attempts: Number(e.target.value) }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] bg-white font-medium focus:outline-none focus:border-[#79415A]"
              >
                <option value={3}>3 Failed Attempts</option>
                <option value={5}>5 Failed Attempts (Standard)</option>
                <option value={10}>10 Failed Attempts</option>
              </select>
            </div>

            {/* Lockout Duration */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Lockout Duration
              </label>
              <select
                value={settings.security.lockout_duration_minutes}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, lockout_duration_minutes: Number(e.target.value) }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] bg-white font-medium focus:outline-none focus:border-[#79415A]"
              >
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes (Default)</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
              </select>
            </div>

            {/* Audit Log Retention */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Audit Log Retention
              </label>
              <select
                value={settings.security.audit_log_retention_days}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, audit_log_retention_days: Number(e.target.value) }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-sm text-[#1F313D] bg-white font-medium focus:outline-none focus:border-[#79415A]"
              >
                <option value={90}>90 Days</option>
                <option value={180}>180 Days (Half Year)</option>
                <option value={365}>365 Days (1 Year)</option>
                <option value={730}>2 Years</option>
              </select>
            </div>

            {/* Minimum Password Length */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1.5">
                Min Password Length ({settings.security.min_password_length} chars)
              </label>
              <input
                type="range"
                min={8}
                max={20}
                value={settings.security.min_password_length}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, min_password_length: Number(e.target.value) }
                })}
                className="w-full accent-[#79415A]"
              />
            </div>
          </div>

          {/* Password Complexity Checklist */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-2">
              Password Complexity Requirements
            </h3>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'require_uppercase', label: 'Require Uppercase Letter (A-Z)' },
                { key: 'require_numbers', label: 'Require Number (0-9)' },
                { key: 'require_special_chars', label: 'Require Special Character (!@#$)' },
              ].map((r) => (
                <label key={r.key} className="flex items-center gap-2 text-xs font-semibold text-[#1F313D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(settings.security as any)[r.key]}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, [r.key]: e.target.checked }
                    })}
                    className="w-4 h-4 accent-[#79415A]"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* IP Whitelist */}
          <div className="border-t border-[#E5DDD2] pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5C5549]">
                Admin IP Access Whitelist
              </label>
              <label className="flex items-center gap-2 text-xs text-[#7A7268] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.ip_whitelist_enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, ip_whitelist_enabled: e.target.checked }
                  })}
                  className="w-4 h-4 accent-[#79415A]"
                />
                <span>Enable IP Restriction</span>
              </label>
            </div>
            <textarea
              rows={2}
              value={settings.security.ip_whitelist}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, ip_whitelist: e.target.value }
              })}
              disabled={!settings.security.ip_whitelist_enabled}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] text-xs font-mono text-[#1F313D] focus:outline-none focus:border-[#79415A] disabled:bg-gray-100 disabled:opacity-60"
              placeholder="e.g. 192.168.1.0/24, 10.0.0.1"
            />
            <p className="text-[11px] text-[#7A7268] mt-1">Comma-separated list of allowed IP addresses or CIDR blocks.</p>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 5: THIRD-PARTY INTEGRATIONS
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'integrations' && (
        <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs p-6 space-y-6">
          <div className="border-b border-[#E5DDD2] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1F313D]">Third-Party Integrations &amp; API Connectors</h2>
              <p className="text-xs text-[#7A7268] mt-0.5">Connect payment gateways, storage buckets, WhatsApp Business, and analytics tools.</p>
            </div>
            <button
              onClick={() => handleSaveSection('Integrations', 'Updated third-party integration toggles and configurations')}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" /> Save Integrations
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.integrations.items.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl p-4 border transition-all ${
                  item.is_enabled
                    ? 'border-[#E5DDD2] bg-[#FAF7F2] shadow-xs'
                    : 'border-gray-200 bg-gray-50/70 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#1F313D] flex items-center gap-1.5">
                      {item.name}
                    </h4>
                    <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#E5DDD2] text-[#7A7268]">
                      {item.category}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.is_enabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setSettings({
                        ...settings,
                        integrations: {
                          items: settings.integrations.items.map(it =>
                            it.id === item.id ? { ...it, is_enabled: enabled } : it
                          ),
                        },
                      });
                    }}
                    className="w-4 h-4 accent-[#79415A] cursor-pointer"
                  />
                </div>

                <p className="text-xs text-[#7A7268] line-clamp-2 mb-3 min-h-[32px]">
                  {item.notes}
                </p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5DDD2]/70">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.is_connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-[11px] font-semibold text-[#5C5549]">
                      {item.is_connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTestIntegration(item)}
                      disabled={testingId === item.id || !item.is_enabled}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-gray-100 border border-[#E5DDD2] text-[#1F313D] transition disabled:opacity-50"
                    >
                      {testingId === item.id ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIntegration(item);
                        setIntegrationCreds({ ...item.credentials });
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#79415A] text-white hover:bg-[#68364c] transition"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 6: SYSTEM CONFIGURATION HISTORY & ROLLBACK
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-xs p-6 space-y-6">
          <div className="border-b border-[#E5DDD2] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1F313D]">System Configuration History &amp; Audit Trail</h2>
              <p className="text-xs text-[#7A7268] mt-0.5">Immutable record of every administrative modification with 1-click rollback capability.</p>
            </div>
            <button
              onClick={async () => {
                const h = await getConfigHistory();
                setHistory(h.data);
                showToast('Refreshed configuration history log.');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#7A7268] hover:text-[#1F313D] font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Log
            </button>
          </div>

          <div className="space-y-3">
            {history.map((entry, idx) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2] hover:bg-white transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#79415A] text-white">
                      {entry.version}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white border border-[#E5DDD2] text-[#5C5549]">
                      {entry.category}
                    </span>
                    <span className="text-[11px] text-[#9CA3AF]">
                      {new Date(entry.timestamp).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                        Current Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#1F313D]">
                    {entry.change_summary}
                  </p>
                  <p className="text-[11px] text-[#7A7268]">
                    Author: <span className="font-mono text-[#1F313D]">{entry.changed_by}</span>
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => setRollbackTarget(entry)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#79415A] text-[#79415A] hover:bg-[#79415A] hover:text-white text-xs font-bold transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rollback to {entry.version}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL: Edit Integration Credentials
      ──────────────────────────────────────────────────────────────────────── */}
      {editingIntegration && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DDD2] pb-3">
              <h3 className="text-base font-bold text-[#1F313D] flex items-center gap-2">
                <Network className="w-4 h-4 text-[#79415A]" /> Configure {editingIntegration.name}
              </h3>
              <button
                onClick={() => setEditingIntegration(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto">
              {Object.keys(editingIntegration.credentials).map((fieldKey) => (
                <div key={fieldKey}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5549] mb-1 font-mono">
                    {fieldKey.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={integrationCreds[fieldKey] || ''}
                    onChange={(e) => setIntegrationCreds({ ...integrationCreds, [fieldKey]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DDD2] text-xs font-mono text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#E5DDD2]">
              <button
                type="button"
                onClick={() => setEditingIntegration(null)}
                className="flex-1 py-2 rounded-xl border border-[#E5DDD2] text-xs font-bold text-[#7A7268] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveIntegrationCredentials}
                className="flex-1 py-2 rounded-xl bg-[#79415A] text-white text-xs font-bold hover:bg-[#68364c]"
              >
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL: Rollback Confirmation
      ──────────────────────────────────────────────────────────────────────── */}
      {rollbackTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-[#1F313D]">Confirm Rollback to {rollbackTarget.version}?</h3>
              <p className="text-xs text-[#7A7268] mt-1">
                This will overwrite the current live settings with the snapshot taken on {new Date(rollbackTarget.timestamp).toLocaleDateString()}.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] text-xs text-[#5C5549]">
              <strong>Snapshot Summary:</strong> {rollbackTarget.change_summary}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRollbackTarget(null)}
                className="flex-1 py-2 rounded-xl border border-[#E5DDD2] text-xs font-bold text-[#7A7268] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRollback}
                className="flex-1 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
              >
                Confirm Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
