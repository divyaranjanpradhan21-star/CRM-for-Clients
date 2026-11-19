import React, { useState, useEffect } from 'react';
import {
  Building2,
  Store,
  Receipt,
  Percent,
  Globe,
  Clock,
  Calendar,
  Utensils,
  AlertTriangle,
  Gift,
  Award,
  MessageSquare,
  Bell,
  CreditCard,
  DollarSign,
  Radio,
  Send,
  CalendarClock,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  X,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  FileText,
  Sliders,
  Shield,
  Eye,
  HelpCircle,
  Copy,
  ChevronRight,
  Flame,
  Coffee,
  Smartphone,
  QrCode,
  Tag
} from 'lucide-react';
import {
  RestaurantSettingsState,
  DEFAULT_RESTAURANT_SETTINGS,
  fetchRestaurantSettings,
  saveRestaurantSettings,
  resetRestaurantSettingsToDefaults,
  NotificationTemplateItem,
  OperatingDaySchedule,
  PaymentMethodItem
} from '../../lib/restaurantSettingsApi';

interface RestaurantSettingsViewProps {
  orgId?: string;
  onSettingsSaved?: () => void;
}

type SettingsTab =
  | 'profile'
  | 'tax'
  | 'currency_timezone'
  | 'reservations'
  | 'cancellations'
  | 'loyalty'
  | 'notifications'
  | 'payments'
  | 'communication'
  | 'hours';

export const RestaurantSettingsView: React.FC<RestaurantSettingsViewProps> = ({ orgId, onSettingsSaved }) => {
  const [settings, setSettings] = useState<RestaurantSettingsState>(DEFAULT_RESTAURANT_SETTINGS);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Selected notification template in the notification tab
  const [selectedNotifId, setSelectedNotifId] = useState<string>('notif-res-confirm');
  const [notifPreviewChannel, setNotifPreviewChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchRestaurantSettings(orgId);
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [orgId]);

  const handleFieldChange = <K extends keyof RestaurantSettingsState>(
    section: K,
    updates: Partial<RestaurantSettingsState[K]>
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        ...updates,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveRestaurantSettings(settings, orgId);
      if (res.success) {
        setHasUnsavedChanges(false);
        showToast('All restaurant configurations and policies saved successfully');
        if (onSettingsSaved) onSettingsSaved();
      } else {
        showToast(res.error || 'Failed to save settings', 'error');
      }
    } catch {
      showToast('An unexpected error occurred while saving', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    const fresh = resetRestaurantSettingsToDefaults();
    setSettings(fresh);
    setHasUnsavedChanges(false);
    setShowResetModal(false);
    showToast('Restaurant configurations restored to baseline defaults');
  };

  // Quick merge tag insert helper
  const insertTag = (tag: string, field: 'smsTemplate' | 'whatsappTemplate' | 'emailSubject' | 'emailBody') => {
    const notifs = [...settings.notifications];
    const idx = notifs.findIndex((n) => n.id === selectedNotifId);
    if (idx >= 0) {
      notifs[idx] = {
        ...notifs[idx],
        [field]: notifs[idx][field] + ' ' + tag,
      };
      setSettings((prev) => ({ ...prev, notifications: notifs }));
      setHasUnsavedChanges(true);
      showToast(`Inserted tag ${tag}`);
    }
  };

  // Navigation tab menu definition
  const TAB_ITEMS: { id: SettingsTab; label: string; icon: any; summary: string }[] = [
    { id: 'profile', label: 'Restaurant Profile & Contact', icon: Store, summary: 'Name, logo, bio, contact numbers & physical address' },
    { id: 'tax', label: 'Taxes & Service Charges', icon: Percent, summary: 'VAT/GST rates, split tax, alcohol rates & invoice prefix' },
    { id: 'currency_timezone', label: 'Currency & Timezone', icon: Globe, summary: 'Monetary units, symbols, formats & operational time' },
    { id: 'reservations', label: 'Reservation Policies', icon: Utensils, summary: 'Party sizes, lead times, grace periods & party deposits' },
    { id: 'cancellations', label: 'Cancellation & No-Show', icon: AlertTriangle, summary: 'Free cutoff window, late fees, no-show release rule' },
    { id: 'loyalty', label: 'Loyalty & Reward Points', icon: Award, summary: 'Points earning ratio, redemption values & bonuses' },
    { id: 'notifications', label: 'Notification Templates', icon: MessageSquare, summary: 'SMS, WhatsApp & Email messages with live previews' },
    { id: 'payments', label: 'Payment Methods & Gateways', icon: CreditCard, summary: 'Card, cash, UPI QR, payment gateways & tipping' },
    { id: 'communication', label: 'Customer Communications', icon: Radio, summary: 'Quiet hours, promotional opt-ins & privacy controls' },
    { id: 'hours', label: 'Opening & Closing Hours', icon: CalendarClock, summary: 'Weekly schedule, split shifts & holiday notices' },
  ];

  const currentNotif = settings.notifications.find((n) => n.id === selectedNotifId) || settings.notifications[0];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#7A7268]">
        <div className="w-8 h-8 border-3 border-[#79415A] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">Loading restaurant settings & policies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all transform animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'success'
              ? 'bg-[#1F313D] text-white border-emerald-500/30'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-300" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#79415A]/10 text-[#79415A]">
                <Sliders className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1F313D] tracking-tight">
                  Restaurant Settings & Global Configuration
                </h1>
                <p className="text-xs text-[#7A7268] mt-0.5">
                  Configure brand profile, tax calculations, reservation rules, loyalty mechanics, notifications, and operational schedules.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DDD5C7] text-xs font-semibold text-[#5C5549] hover:bg-[#EFE9DF] transition"
              title="Reset configurations to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition ${
                hasUnsavedChanges
                  ? 'bg-[#79415A] hover:bg-[#68334b] text-white ring-2 ring-[#79415A]/30'
                  : 'bg-[#1F313D] hover:bg-[#142028] text-white'
              } disabled:opacity-50`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>You have unsaved configuration changes. Click <strong>Save Configuration</strong> to apply them.</span>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-amber-900 underline font-bold hover:text-amber-950 text-[11px]"
            >
              Save Now
            </button>
          </div>
        )}
      </div>

      {/* Main Settings Body: Left Navigation Tabs + Right Tab Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side Navigation Pills */}
        <div className="lg:col-span-3 space-y-1.5">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[20px] p-3 shadow-2xs space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#82401D]">
              Configuration Modules
            </div>
            {TAB_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-[#79415A] text-white shadow-xs'
                      : 'hover:bg-[#EFE9DF] text-[#1F313D]'
                  }`}
                >
                  <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-white/20 text-white' : 'bg-[#DDD5C7]/40 text-[#79415A]'}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold leading-tight truncate">{item.label}</div>
                    <div className={`text-[10px] line-clamp-1 mt-0.5 ${isActive ? 'text-white/80' : 'text-[#7A7268]'}`}>
                      {item.summary}
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 self-center opacity-80" />}
                </button>
              );
            })}
          </div>

          {/* Quick Info Box */}
          <div className="p-4 bg-[#EFE9DF] border border-[#DDD5C7] rounded-[20px] text-xs text-[#5C5549] space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#1F313D]">
              <Sparkles className="w-3.5 h-3.5 text-[#79415A]" />
              <span>Multi-Outlet Synchronization</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#7A7268]">
              Settings configured here establish default baseline policies for all counters and dining branches under your restaurant brand.
            </p>
          </div>
        </div>

        {/* Right Content Canvas */}
        <div className="lg:col-span-9 space-y-6">
          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 1: RESTAURANT PROFILE & CONTACT INFORMATION
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1F313D] flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#79415A]" />
                  Restaurant Identity & Contact Details
                </h2>
                <p className="text-xs text-[#7A7268] mt-1">
                  Primary brand name, digital logo, registered contact numbers, and physical venue address shown on invoices, menus, and reservation confirmations.
                </p>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1F313D] to-[#2E4351] text-white flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={settings.profile.logoUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80'}
                  alt="Restaurant Logo"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="flex-1 text-center sm:text-left">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#E5C9B3]">
                    Storefront Live Preview
                  </div>
                  <h3 className="text-lg font-serif font-bold text-white mt-0.5">
                    {settings.profile.name || "Cafe's Corner"}
                  </h3>
                  <p className="text-xs text-[#E5C9B3]/80 italic line-clamp-1">
                    "{settings.profile.tagline || 'Artisanal Roastery & Hearth Cooking'}"
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/70 mt-2">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#E5C9B3]" /> {settings.profile.phone}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[#E5C9B3]" /> {settings.profile.email}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#E5C9B3]" /> {settings.profile.city}, {settings.profile.country}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Restaurant Brand Name *</label>
                  <input
                    type="text"
                    value={settings.profile.name}
                    onChange={(e) => handleFieldChange('profile', { name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-semibold focus:outline-none focus:border-[#79415A]"
                    placeholder="e.g. Cafe's Corner Heritage Bistro"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Brand Tagline / Slogan</label>
                  <input
                    type="text"
                    value={settings.profile.tagline}
                    onChange={(e) => handleFieldChange('profile', { tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    placeholder="e.g. Artisanal Roastery, Hearth Baking & Slow Food Gastronomy"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Brand Logo Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={settings.profile.logoUrl}
                      onChange={(e) => handleFieldChange('profile', { logoUrl: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                      placeholder="https://example.com/logo.png"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleFieldChange('profile', {
                          logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
                        })
                      }
                      className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] text-xs font-semibold text-[#5C5549] hover:bg-[#EAE4D9]"
                    >
                      Use Demo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Official Contact Email *</label>
                  <input
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => handleFieldChange('profile', { email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    placeholder="contact@cafescorner.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Primary Guest Booking Phone *</label>
                  <input
                    type="text"
                    value={settings.profile.phone}
                    onChange={(e) => handleFieldChange('profile', { phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    placeholder="+91 22 2490 8820"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Secondary Support / WhatsApp Phone</label>
                  <input
                    type="text"
                    value={settings.profile.secondaryPhone}
                    onChange={(e) => handleFieldChange('profile', { secondaryPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    placeholder="+91 98200 44101"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Official Website URL</label>
                  <input
                    type="url"
                    value={settings.profile.website}
                    onChange={(e) => handleFieldChange('profile', { website: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    placeholder="https://www.cafescorner.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Physical Registered Address</label>
                  <input
                    type="text"
                    value={settings.profile.address}
                    onChange={(e) => handleFieldChange('profile', { address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    placeholder="42 Heritage Boulevard, Central Commercial Square, Fort"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">City</label>
                  <input
                    type="text"
                    value={settings.profile.city}
                    onChange={(e) => handleFieldChange('profile', { city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">State / Province</label>
                  <input
                    type="text"
                    value={settings.profile.state}
                    onChange={(e) => handleFieldChange('profile', { state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Postal / PIN Code</label>
                  <input
                    type="text"
                    value={settings.profile.postalCode}
                    onChange={(e) => handleFieldChange('profile', { postalCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Country</label>
                  <input
                    type="text"
                    value={settings.profile.country}
                    onChange={(e) => handleFieldChange('profile', { country: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">FSSAI / Food Hygiene License No.</label>
                  <input
                    type="text"
                    value={settings.profile.licenseNumber}
                    onChange={(e) => handleFieldChange('profile', { licenseNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Company Registration (CIN / Reg No.)</label>
                  <input
                    type="text"
                    value={settings.profile.registrationNumber}
                    onChange={(e) => handleFieldChange('profile', { registrationNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 2: TAX RATES & APPLICABLE TAX SETTINGS
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'tax' && (
            <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1F313D] flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#79415A]" />
                  Tax Rates, Split Tax & Service Charges
                </h2>
                <p className="text-xs text-[#7A7268] mt-1">
                  Configure default sales tax, VAT or GST rates, dual split tax (CGST/SGST), optional service charges, and invoice prefix series.
                </p>
              </div>

              {/* Realtime Live Calculation Simulator */}
              <div className="p-4 rounded-2xl bg-[#EFE9DF] border border-[#DDD5C7] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#79415A]">
                    Live Bill Calculation Simulator ($100 Food + $20 Cocktail)
                  </div>
                  <div className="text-xs text-[#5C5549]">
                    Subtotal: $120.00 &bull; Mode: <strong>{settings.tax.taxCalculation.toUpperCase()}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/70 border border-[#DDD5C7] rounded-xl px-4 py-2 text-xs">
                  <div>
                    <span className="text-[#7A7268] text-[10px] block">Calculated Tax</span>
                    <span className="font-bold text-[#1F313D]">
                      ${(
                        (100 * (settings.tax.defaultTaxRate / 100)) +
                        (20 * (settings.tax.alcoholTaxRate / 100))
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-l border-[#DDD5C7] pl-4">
                    <span className="text-[#7A7268] text-[10px] block">Service Charge</span>
                    <span className="font-bold text-[#1F313D]">
                      ${settings.tax.enableServiceCharge ? (120 * (settings.tax.serviceChargeRate / 100)).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="border-l border-[#DDD5C7] pl-4">
                    <span className="text-[#7A7268] text-[10px] block">Estimated Total</span>
                    <span className="font-bold text-[#79415A] text-sm">
                      ${(
                        120 +
                        (settings.tax.taxCalculation === 'exclusive'
                          ? (100 * (settings.tax.defaultTaxRate / 100)) + (20 * (settings.tax.alcoholTaxRate / 100))
                          : 0) +
                        (settings.tax.enableServiceCharge ? 120 * (settings.tax.serviceChargeRate / 100) : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Tax Nomenclature</label>
                  <select
                    value={settings.tax.taxName}
                    onChange={(e) => handleFieldChange('tax', { taxName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  >
                    <option value="GST">GST (Goods & Services Tax)</option>
                    <option value="VAT">VAT (Value Added Tax)</option>
                    <option value="Sales Tax">State & Municipal Sales Tax</option>
                    <option value="Consumption Tax">Consumption Tax</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Tax Calculation Mode</label>
                  <select
                    value={settings.tax.taxCalculation}
                    onChange={(e) => handleFieldChange('tax', { taxCalculation: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  >
                    <option value="exclusive">Exclusive (Tax added on top of menu price at bill)</option>
                    <option value="inclusive">Inclusive (Menu prices already include tax)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Default Food & Beverage Tax Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.tax.defaultTaxRate}
                      onChange={(e) => handleFieldChange('tax', { defaultTaxRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold focus:outline-none focus:border-[#79415A]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268] font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Liquor / Alcoholic Beverage Tax Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.tax.alcoholTaxRate}
                      onChange={(e) => handleFieldChange('tax', { alcoholTaxRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold focus:outline-none focus:border-[#79415A]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268] font-bold">%</span>
                  </div>
                </div>

                {/* Split Tax Toggle */}
                <div className="md:col-span-2 p-4 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#1F313D]">Enable Split Tax Display on Receipts (e.g. CGST + SGST)</div>
                      <div className="text-[11px] text-[#7A7268]">Itemizes dual regional tax components on guest receipts.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.tax.enableSplitTax}
                      onChange={(e) => handleFieldChange('tax', { enableSplitTax: e.target.checked })}
                      className="w-4 h-4 accent-[#79415A] cursor-pointer"
                    />
                  </div>

                  {settings.tax.enableSplitTax && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#DDD5C7]">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">Central Component (CGST %)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={settings.tax.cgstRate}
                          onChange={(e) => handleFieldChange('tax', { cgstRate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">State Component (SGST %)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={settings.tax.sgstRate}
                          onChange={(e) => handleFieldChange('tax', { sgstRate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Service Charge Configuration */}
                <div className="md:col-span-2 p-4 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#1F313D]">Optional Restaurant Service Charge</div>
                      <div className="text-[11px] text-[#7A7268]">Applied automatically to floor tables for staff welfare & dining service.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.tax.enableServiceCharge}
                      onChange={(e) => handleFieldChange('tax', { enableServiceCharge: e.target.checked })}
                      className="w-4 h-4 accent-[#79415A] cursor-pointer"
                    />
                  </div>

                  {settings.tax.enableServiceCharge && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#DDD5C7]">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">Service Charge Percentage (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={settings.tax.serviceChargeRate}
                          onChange={(e) => handleFieldChange('tax', { serviceChargeRate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          checked={settings.tax.serviceChargeTaxable}
                          onChange={(e) => handleFieldChange('tax', { serviceChargeTaxable: e.target.checked })}
                          className="w-4 h-4 accent-[#79415A]"
                        />
                        <span className="text-xs text-[#1F313D]">Subject service charge to VAT/GST tax calculation</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Tax Invoice Numbering Prefix</label>
                  <input
                    type="text"
                    value={settings.tax.taxInvoicePrefix}
                    onChange={(e) => handleFieldChange('tax', { taxInvoicePrefix: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                    placeholder="e.g. INV-2024-"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Current Invoice Counter Series</label>
                  <input
                    type="number"
                    value={settings.tax.currentInvoiceNumber}
                    onChange={(e) => handleFieldChange('tax', { currentInvoiceNumber: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 3: CURRENCY & TIMEZONE
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'currency_timezone' && (
            <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1F313D] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#79415A]" />
                  Currency, Regional Localization & Timezone
                </h2>
                <p className="text-xs text-[#7A7268] mt-1">
                  Format pricing outputs, order tickets, reservation schedules, and analytical charts in your home operational timezone.
                </p>
              </div>

              {/* Sample Price Preview Card */}
              <div className="p-4 rounded-2xl bg-[#1F313D] text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E5C9B3]">
                    Formatted Display Preview
                  </div>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {settings.currencyTimezone.currencyPosition === 'before'
                      ? `${settings.currencyTimezone.currencySymbol} 1,249.${'00'.slice(0, settings.currencyTimezone.decimalPlaces)}`
                      : `1,249.${'00'.slice(0, settings.currencyTimezone.decimalPlaces)} ${settings.currencyTimezone.currencySymbol}`}
                  </div>
                  <div className="text-xs text-emerald-400 mt-1">
                    Clock Time: {new Date().toLocaleTimeString('en-US', { timeZone: settings.currencyTimezone.timezone || undefined })} ({settings.currencyTimezone.timezone})
                  </div>
                </div>
                <div className="text-right text-xs text-[#E5C9B3] font-mono">
                  {settings.currencyTimezone.currencyCode} &bull; {settings.currencyTimezone.timeFormat.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Primary Currency</label>
                  <select
                    value={settings.currencyTimezone.currencyCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const map: Record<string, string> = {
                        USD: '$',
                        INR: '₹',
                        EUR: '€',
                        GBP: '£',
                        AED: 'AED',
                        SGD: 'S$',
                        CAD: 'C$',
                        AUD: 'A$',
                        JPY: '¥',
                      };
                      handleFieldChange('currencyTimezone', {
                        currencyCode: code,
                        currencySymbol: map[code] || '$',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold focus:outline-none focus:border-[#79415A]"
                  >
                    <option value="USD">USD ($) — United States Dollar</option>
                    <option value="INR">INR (₹) — Indian Rupee</option>
                    <option value="EUR">EUR (€) — Euro</option>
                    <option value="GBP">GBP (£) — British Pound</option>
                    <option value="AED">AED (AED) — UAE Dirham</option>
                    <option value="SGD">SGD (S$) — Singapore Dollar</option>
                    <option value="CAD">CAD (C$) — Canadian Dollar</option>
                    <option value="AUD">AUD (A$) — Australian Dollar</option>
                    <option value="JPY">JPY (¥) — Japanese Yen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Currency Symbol</label>
                  <input
                    type="text"
                    value={settings.currencyTimezone.currencySymbol}
                    onChange={(e) => handleFieldChange('currencyTimezone', { currencySymbol: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Symbol Placement</label>
                  <select
                    value={settings.currencyTimezone.currencyPosition}
                    onChange={(e) => handleFieldChange('currencyTimezone', { currencyPosition: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  >
                    <option value="before">Before Amount ($100)</option>
                    <option value="after">After Amount (100 $)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Decimal Precision</label>
                  <select
                    value={settings.currencyTimezone.decimalPlaces}
                    onChange={(e) => handleFieldChange('currencyTimezone', { decimalPlaces: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  >
                    <option value="2">2 Decimal Places (e.g. $14.50)</option>
                    <option value="0">0 Decimal Places (e.g. ₹500)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Primary Operational Timezone</label>
                  <select
                    value={settings.currencyTimezone.timezone}
                    onChange={(e) => handleFieldChange('currencyTimezone', { timezone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30) — Mumbai / Delhi</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +4:00) — Dubai / Abu Dhabi</option>
                    <option value="Europe/London">Europe/London (GMT/BST) — London</option>
                    <option value="Europe/Paris">Europe/Paris (CET +1:00) — Paris / Berlin</option>
                    <option value="America/New_York">America/New_York (EST -5:00) — New York</option>
                    <option value="America/Chicago">America/Chicago (CST -6:00) — Chicago</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST -8:00) — Los Angeles</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT +8:00) — Singapore</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEST +10:00) — Sydney</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Date Display Format</label>
                  <select
                    value={settings.currencyTimezone.dateFormat}
                    onChange={(e) => handleFieldChange('currencyTimezone', { dateFormat: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 19/11/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/19/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-19)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Clock Time Format</label>
                  <select
                    value={settings.currencyTimezone.timeFormat}
                    onChange={(e) => handleFieldChange('currencyTimezone', { timeFormat: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  >
                    <option value="12h">12-Hour Format with AM/PM (e.g. 07:30 PM)</option>
                    <option value="24h">24-Hour Military Format (e.g. 19:30)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 4: RESERVATION POLICIES
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'reservations' && (
            <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1F313D] flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#79415A]" />
                  Table Booking, Seating Limits & Deposit Policies
                </h2>
                <p className="text-xs text-[#7A7268] mt-1">
                  Control party size capacity, lead booking notice, grace periods before releasing tables, and mandatory security deposits for large group banquets.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Maximum Online Party Size</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.reservation.maxPartySize}
                      onChange={(e) => handleFieldChange('reservation', { maxPartySize: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268]">guests</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Minimum Advance Notice Time</label>
                  <select
                    value={settings.reservation.minLeadTimeMinutes}
                    onChange={(e) => handleFieldChange('reservation', { minLeadTimeMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  >
                    <option value="15">15 minutes (Immediate walk-in queue)</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour prior</option>
                    <option value="120">2 hours prior</option>
                    <option value="240">4 hours prior</option>
                    <option value="1440">24 hours prior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Maximum Advance Booking Window</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.reservation.maxAdvanceBookingDays}
                      onChange={(e) => handleFieldChange('reservation', { maxAdvanceBookingDays: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268]">days ahead</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Table Hold Grace Period</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={settings.reservation.tableHoldGraceMinutes}
                      onChange={(e) => handleFieldChange('reservation', { tableHoldGraceMinutes: parseInt(e.target.value) || 5 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268]">mins after arrival time</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Standard Seating Window (Small Parties)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="30"
                      max="240"
                      value={settings.reservation.standardSeatingDurationMinutes}
                      onChange={(e) => handleFieldChange('reservation', { standardSeatingDurationMinutes: parseInt(e.target.value) || 30 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268]">mins</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Large Party Seating Window (6+ Guests)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="45"
                      max="360"
                      value={settings.reservation.largePartySeatingDurationMinutes}
                      onChange={(e) => handleFieldChange('reservation', { largePartySeatingDurationMinutes: parseInt(e.target.value) || 45 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268]">mins</span>
                  </div>
                </div>

                {/* Auto Confirmation Toggle */}
                <div className="md:col-span-2 p-4 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#1F313D]">Instant Auto-Confirmation</div>
                    <div className="text-[11px] text-[#7A7268]">
                      Immediately confirm online table bookings if tables are available, without requiring manual floor manager review.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reservation.autoConfirmReservations}
                    onChange={(e) => handleFieldChange('reservation', { autoConfirmReservations: e.target.checked })}
                    className="w-4 h-4 accent-[#79415A] cursor-pointer"
                  />
                </div>

                {/* Large Party Deposit Configuration */}
                <div className="md:col-span-2 p-4 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#1F313D]">Pre-Authorized Deposit for Large Parties</div>
                      <div className="text-[11px] text-[#7A7268]">Requires card authorization or deposit upfront for banquet tables.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.reservation.requireDepositForLargeParties}
                      onChange={(e) => handleFieldChange('reservation', { requireDepositForLargeParties: e.target.checked })}
                      className="w-4 h-4 accent-[#79415A] cursor-pointer"
                    />
                  </div>

                  {settings.reservation.requireDepositForLargeParties && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#DDD5C7]">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">Party Size Threshold</label>
                        <input
                          type="number"
                          value={settings.reservation.largePartyThreshold}
                          onChange={(e) => handleFieldChange('reservation', { largePartyThreshold: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs"
                          placeholder="e.g. 6 guests and above"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">Deposit per Guest ($)</label>
                        <input
                          type="number"
                          step="5"
                          value={settings.reservation.depositAmountPerGuest}
                          onChange={(e) => handleFieldChange('reservation', { depositAmountPerGuest: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-bold"
                          placeholder="20.00"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Guest Guidelines & Dining Notes</label>
                  <textarea
                    rows={3}
                    value={settings.reservation.reservationNotes}
                    onChange={(e) => handleFieldChange('reservation', { reservationNotes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 5: CANCELLATION & NO-SHOW POLICIES
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'cancellations' && (
            <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1F313D] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#79415A]" />
                  Cancellation Cutoff Windows & No-Show Fees
                </h2>
                <p className="text-xs text-[#7A7268] mt-1">
                  Protect floor revenue by defining free cancellation deadlines, penalty fee assessments, and automated table release triggers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Free Cancellation Window</label>
                  <select
                    value={settings.cancellation.freeCancellationWindowHours}
                    onChange={(e) => handleFieldChange('cancellation', { freeCancellationWindowHours: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold"
                  >
                    <option value="1">Up to 1 hour before scheduled booking</option>
                    <option value="2">Up to 2 hours before scheduled booking</option>
                    <option value="4">Up to 4 hours before scheduled booking</option>
                    <option value="12">Up to 12 hours before scheduled booking</option>
                    <option value="24">Up to 24 hours prior (Full day notice)</option>
                    <option value="48">Up to 48 hours prior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Cancellation Penalty Type</label>
                  <select
                    value={settings.cancellation.cancellationFeeType}
                    onChange={(e) => handleFieldChange('cancellation', { cancellationFeeType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  >
                    <option value="deposit_forfeit">Forfeit Pre-Paid Deposit</option>
                    <option value="fixed">Fixed Penalty Charge ($)</option>
                    <option value="percentage">Percentage of Estimated Spend (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Late Cancellation Fee Amount ($)</label>
                  <input
                    type="number"
                    value={settings.cancellation.cancellationFeeAmount}
                    onChange={(e) => handleFieldChange('cancellation', { cancellationFeeAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Unannounced No-Show Penalty Fee ($)</label>
                  <input
                    type="number"
                    value={settings.cancellation.noShowFeeAmount}
                    onChange={(e) => handleFieldChange('cancellation', { noShowFeeAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold"
                  />
                </div>

                <div className="md:col-span-2 p-4 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#1F313D]">Auto-Release Table on No-Show</div>
                    <div className="text-[11px] text-[#7A7268]">
                      Mark table as vacant and return it to live walk-in floor pool after {settings.cancellation.noShowThresholdMinutes} minutes of unannounced arrival delay.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.cancellation.autoReleaseTableOnNoShow}
                    onChange={(e) => handleFieldChange('cancellation', { autoReleaseTableOnNoShow: e.target.checked })}
                    className="w-4 h-4 accent-[#79415A] cursor-pointer"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Customer-Facing Cancellation Terms & Agreement</label>
                  <textarea
                    rows={4}
                    value={settings.cancellation.cancellationPolicyText}
                    onChange={(e) => handleFieldChange('cancellation', { cancellationPolicyText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 6: LOYALTY POINT RULES & REWARDS
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'loyalty' && (
            <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1F313D] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#79415A]" />
                  Guest Loyalty Program & Points Redemption Mechanics
                </h2>
                <p className="text-xs text-[#7A7268] mt-1">
                  Incentivize return dining with customizable point accrual ratios, minimum redemption thresholds, birthday bonuses, and order discounts.
                </p>
              </div>

              {/* Loyalty Program Master Switch */}
              <div className="p-4 rounded-xl border border-[#DDD5C7] bg-[#EFE9DF] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#1F313D]">Enable Loyalty & Rewards Program</div>
                  <div className="text-[11px] text-[#7A7268]">Accumulate points on paid checks and allow bill credits at checkout.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.loyalty.loyaltyProgramEnabled}
                  onChange={(e) => handleFieldChange('loyalty', { loyaltyProgramEnabled: e.target.checked })}
                  className="w-5 h-5 accent-[#79415A] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Program Brand Title</label>
                  <input
                    type="text"
                    value={settings.loyalty.programName}
                    onChange={(e) => handleFieldChange('loyalty', { programName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold"
                    placeholder="e.g. Epicurean Connoisseur Rewards"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Earning Ratio (Points per $1 Spent)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={settings.loyalty.pointsPerCurrencySpent}
                      onChange={(e) => handleFieldChange('loyalty', { pointsPerCurrencySpent: parseFloat(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268]">pts / $1</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Point Cash Value ($ per 1 Point)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.001"
                      value={settings.loyalty.pointValueInCurrency}
                      onChange={(e) => handleFieldChange('loyalty', { pointValueInCurrency: parseFloat(e.target.value) || 0.01 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268]">
                      (100 pts = ${(100 * settings.loyalty.pointValueInCurrency).toFixed(2)})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Minimum Points Required to Redeem</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="25"
                      min="0"
                      value={settings.loyalty.minimumRedemptionPoints}
                      onChange={(e) => handleFieldChange('loyalty', { minimumRedemptionPoints: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D] font-bold"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268]">points</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Welcome Signup Bonus</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.loyalty.signupBonusPoints}
                      onChange={(e) => handleFieldChange('loyalty', { signupBonusPoints: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268]">bonus points</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Guest Birthday Reward</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.loyalty.birthdayBonusPoints}
                      onChange={(e) => handleFieldChange('loyalty', { birthdayBonusPoints: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268]">bonus points</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Maximum Bill Discount Cap (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      max="100"
                      min="5"
                      value={settings.loyalty.maxRedemptionPercentPerOrder}
                      onChange={(e) => handleFieldChange('loyalty', { maxRedemptionPercentPerOrder: parseInt(e.target.value) || 50 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7A7268]">% of order</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Points Expiration Window</label>
                  <select
                    value={settings.loyalty.pointsExpiryMonths}
                    onChange={(e) => handleFieldChange('loyalty', { pointsExpiryMonths: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  >
                    <option value="6">6 months from earning</option>
                    <option value="12">12 months (1 Year)</option>
                    <option value="24">24 months (2 Years)</option>
                    <option value="0">Never expire</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2]">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1F313D]">
                    <input
                      type="checkbox"
                      checked={settings.loyalty.excludeAlcoholFromLoyalty}
                      onChange={(e) => handleFieldChange('loyalty', { excludeAlcoholFromLoyalty: e.target.checked })}
                      className="w-4 h-4 accent-[#79415A]"
                    />
                    <span>Exclude alcohol & bar items from earning points</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1F313D]">
                    <input
                      type="checkbox"
                      checked={settings.loyalty.excludeDiscountedOrders}
                      onChange={(e) => handleFieldChange('loyalty', { excludeDiscountedOrders: e.target.checked })}
                      className="w-4 h-4 accent-[#79415A]"
                    />
                    <span>Exclude orders using promotional coupons from earning points</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 7: NOTIFICATION TEMPLATES
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'notifications' && (
            <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1F313D] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#79415A]" />
                  Notification Templates & Broadcast Messages
                </h2>
                <p className="text-xs text-[#7A7268] mt-1">
                  Customize transactional message content for SMS, WhatsApp, and Email. Use dynamic merge variables to personalize each patron interaction.
                </p>
              </div>

              {/* Template Selector Pills */}
              <div className="flex flex-wrap gap-2 pb-2 border-b border-[#DDD5C7]">
                {settings.notifications.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedNotifId(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedNotifId === t.id
                        ? 'bg-[#79415A] text-white shadow-xs'
                        : 'bg-[#EFE9DF] text-[#5C5549] hover:bg-[#EAE4D9]'
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>

              {/* Notification Editor + Live Simulator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Editor */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#1F313D]">{currentNotif.title}</h3>
                    <p className="text-xs text-[#7A7268] mt-0.5">{currentNotif.description}</p>
                  </div>

                  {/* Channel Active Toggles */}
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#1F313D]">
                      <input
                        type="checkbox"
                        checked={currentNotif.whatsappEnabled}
                        onChange={(e) => {
                          const list = [...settings.notifications];
                          const idx = list.findIndex((n) => n.id === currentNotif.id);
                          list[idx].whatsappEnabled = e.target.checked;
                          setSettings({ ...settings, notifications: list });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span>WhatsApp</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#1F313D]">
                      <input
                        type="checkbox"
                        checked={currentNotif.smsEnabled}
                        onChange={(e) => {
                          const list = [...settings.notifications];
                          const idx = list.findIndex((n) => n.id === currentNotif.id);
                          list[idx].smsEnabled = e.target.checked;
                          setSettings({ ...settings, notifications: list });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-4 h-4 accent-[#79415A]"
                      />
                      <span>SMS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#1F313D]">
                      <input
                        type="checkbox"
                        checked={currentNotif.emailEnabled}
                        onChange={(e) => {
                          const list = [...settings.notifications];
                          const idx = list.findIndex((n) => n.id === currentNotif.id);
                          list[idx].emailEnabled = e.target.checked;
                          setSettings({ ...settings, notifications: list });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-4 h-4 accent-[#1F313D]"
                      />
                      <span>Email</span>
                    </label>
                  </div>

                  {/* Merge Tag Pills */}
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#82401D] mb-1.5">
                      Available Merge Tags (Click to Insert)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '{guest_name}',
                        '{restaurant_name}',
                        '{branch_name}',
                        '{reservation_date}',
                        '{reservation_time}',
                        '{party_size}',
                        '{booking_id}',
                        '{bill_amount}',
                        '{points_earned}',
                        '{total_points}',
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (notifPreviewChannel === 'whatsapp') insertTag(tag, 'whatsappTemplate');
                            else if (notifPreviewChannel === 'sms') insertTag(tag, 'smsTemplate');
                            else insertTag(tag, 'emailBody');
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white border border-[#DDD5C7] text-[10px] font-mono font-bold text-[#79415A] hover:bg-[#79415A] hover:text-white transition"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp Content */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#1F313D] flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        WhatsApp Message Template
                      </label>
                      <button
                        onClick={() => setNotifPreviewChannel('whatsapp')}
                        className="text-[10px] text-[#79415A] font-bold underline"
                      >
                        Preview Simulator
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={currentNotif.whatsappTemplate}
                      onChange={(e) => {
                        const list = [...settings.notifications];
                        const idx = list.findIndex((n) => n.id === currentNotif.id);
                        list[idx].whatsappTemplate = e.target.value;
                        setSettings({ ...settings, notifications: list });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-mono text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    />
                  </div>

                  {/* SMS Content */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#1F313D] flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-[#79415A]" />
                        SMS Text Template (160 chars recommended)
                      </label>
                      <button
                        onClick={() => setNotifPreviewChannel('sms')}
                        className="text-[10px] text-[#79415A] font-bold underline"
                      >
                        Preview Simulator
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={currentNotif.smsTemplate}
                      onChange={(e) => {
                        const list = [...settings.notifications];
                        const idx = list.findIndex((n) => n.id === currentNotif.id);
                        list[idx].smsTemplate = e.target.value;
                        setSettings({ ...settings, notifications: list });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs font-mono text-[#1F313D] focus:outline-none focus:border-[#79415A]"
                    />
                    <div className="text-[10px] text-right text-[#7A7268] mt-1">
                      {currentNotif.smsTemplate.length} characters (~{Math.ceil(currentNotif.smsTemplate.length / 160)} SMS parts)
                    </div>
                  </div>

                  {/* Email Subject */}
                  <div>
                    <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Email Subject Line</label>
                    <input
                      type="text"
                      value={currentNotif.emailSubject}
                      onChange={(e) => {
                        const list = [...settings.notifications];
                        const idx = list.findIndex((n) => n.id === currentNotif.id);
                        list[idx].emailSubject = e.target.value;
                        setSettings({ ...settings, notifications: list });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                    />
                  </div>
                </div>

                {/* Right Live Device Simulator */}
                <div className="lg:col-span-5 bg-[#EAE4D9] rounded-[24px] p-4 border border-[#DDD5C7] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C5549]">
                        Phone Screen Simulation
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setNotifPreviewChannel('whatsapp')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${notifPreviewChannel === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-white/60 text-[#1F313D]'}`}
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => setNotifPreviewChannel('sms')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${notifPreviewChannel === 'sms' ? 'bg-[#79415A] text-white' : 'bg-white/60 text-[#1F313D]'}`}
                        >
                          SMS
                        </button>
                        <button
                          onClick={() => setNotifPreviewChannel('email')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${notifPreviewChannel === 'email' ? 'bg-[#1F313D] text-white' : 'bg-white/60 text-[#1F313D]'}`}
                        >
                          Email
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-[#DDD5C7] text-xs leading-relaxed">
                      {notifPreviewChannel === 'whatsapp' ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 text-[11px] font-bold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {settings.profile.name} (Official Verified)
                          </div>
                          <div className="whitespace-pre-wrap text-[#1F313D] text-xs">
                            {currentNotif.whatsappTemplate
                              .replace(/{guest_name}/g, 'Alexander Wright')
                              .replace(/{restaurant_name}/g, settings.profile.name)
                              .replace(/{branch_name}/g, 'Downtown Flagship')
                              .replace(/{reservation_date}/g, '20 Nov 2026')
                              .replace(/{reservation_time}/g, '08:00 PM')
                              .replace(/{party_size}/g, '4')
                              .replace(/{booking_id}/g, 'RES-9824')
                              .replace(/{bill_amount}/g, '$145.50')
                              .replace(/{points_earned}/g, '145')
                              .replace(/{total_points}/g, '420')
                              .replace(/{booking_link}/g, 'https://cafescorner.com/b/9824')
                              .replace(/{receipt_url}/g, 'https://cafescorner.com/inv/1042')
                              .replace(/{survey_url}/g, 'https://cafescorner.com/rate/9824')}
                          </div>
                          <div className="text-[10px] text-right text-gray-400">12:35 PM &bull; Delivered ✓✓</div>
                        </div>
                      ) : notifPreviewChannel === 'sms' ? (
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-gray-500">From: CAFESC (Sender ID)</div>
                          <div className="p-3 bg-[#FAF7F2] rounded-xl text-[#1F313D]">
                            {currentNotif.smsTemplate
                              .replace(/{guest_name}/g, 'Alexander')
                              .replace(/{restaurant_name}/g, settings.profile.name)
                              .replace(/{branch_name}/g, 'Downtown Flagship')
                              .replace(/{reservation_date}/g, '20 Nov')
                              .replace(/{reservation_time}/g, '08:00 PM')
                              .replace(/{party_size}/g, '4')
                              .replace(/{booking_id}/g, '9824')
                              .replace(/{bill_amount}/g, '$145.50')
                              .replace(/{points_earned}/g, '145')
                              .replace(/{total_points}/g, '420')
                              .replace(/{receipt_url}/g, 'bit.ly/inv1042')
                              .replace(/{survey_url}/g, 'bit.ly/rate9824')}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-[#1F313D] border-b pb-2">
                            Subject: {currentNotif.emailSubject.replace(/{restaurant_name}/g, settings.profile.name).replace(/{booking_id}/g, '9824')}
                          </div>
                          <div
                            className="text-xs text-[#5C5549] prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: currentNotif.emailBody
                                .replace(/{guest_name}/g, 'Alexander Wright')
                                .replace(/{restaurant_name}/g, settings.profile.name)
                                .replace(/{branch_name}/g, 'Downtown Flagship')
                                .replace(/{reservation_date}/g, '20 Nov 2026')
                                .replace(/{reservation_time}/g, '08:00 PM')
                                .replace(/{party_size}/g, '4')
                                .replace(/{booking_id}/g, 'RES-9824'),
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-center text-[#7A7268] mt-3">
                    Sample patron values shown above for layout validation.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 8: PAYMENT METHODS & GATEWAYS
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'payments' && (
            <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1F313D] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#79415A]" />
                  Accepted Payment Methods & Gateway Credentials
                </h2>
                <p className="text-xs text-[#7A7268] mt-1">
                  Enable counter settlement options, digital QR codes, payment gateway integration, auto-receipt printing, and dining tip percentages.
                </p>
              </div>

              {/* Payment Methods Grid */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#1F313D]">Accepted Payment Methods at POS & Table Side</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {settings.payments.methods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                        method.enabled
                          ? 'bg-[#EFE9DF] border-[#79415A]/40 shadow-xs'
                          : 'bg-white/40 border-[#DDD5C7] opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1F313D]">{method.title}</span>
                          {method.badge && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#79415A]/10 text-[#79415A] text-[9px] font-bold">
                              {method.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#7A7268] leading-tight">{method.description}</p>
                      </div>

                      <input
                        type="checkbox"
                        checked={method.enabled}
                        onChange={(e) => {
                          const methods = settings.payments.methods.map((m) =>
                            m.id === method.id ? { ...m, enabled: e.target.checked } : m
                          );
                          setSettings({ ...settings, payments: { ...settings.payments, methods } });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-4 h-4 accent-[#79415A] cursor-pointer shrink-0 mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Gateway Provider Details */}
              <div className="p-5 rounded-2xl border border-[#DDD5C7] bg-[#EFE9DF] space-y-4">
                <div className="text-xs font-bold text-[#1F313D] flex items-center justify-between">
                  <span>Online Payment Gateway Provider</span>
                  <span className="text-[10px] font-mono text-[#79415A] uppercase font-bold">
                    {settings.payments.isSandboxMode ? 'Sandbox Test Mode Active' : 'Production Live Mode'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">Gateway Partner</label>
                    <select
                      value={settings.payments.gatewayProvider}
                      onChange={(e) =>
                        handleFieldChange('payments', { gatewayProvider: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs font-bold"
                    >
                      <option value="stripe">Stripe Global POS & Checkout</option>
                      <option value="razorpay">Razorpay UPI & Cards (India)</option>
                      <option value="square">Square Terminal Reader</option>
                      <option value="paypal">PayPal Braintree</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">Environment Mode</label>
                    <select
                      value={settings.payments.isSandboxMode ? 'sandbox' : 'live'}
                      onChange={(e) =>
                        handleFieldChange('payments', { isSandboxMode: e.target.value === 'sandbox' })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs font-bold"
                    >
                      <option value="sandbox">Sandbox / Test Keys</option>
                      <option value="live">Production / Live Processing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">Active Public Key / Account ID</label>
                    <input
                      type="text"
                      value={settings.payments.gatewayKeyId}
                      onChange={(e) => handleFieldChange('payments', { gatewayKeyId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD5C7] text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Tipping & Gratuity Settings */}
              <div className="p-4 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#1F313D]">Table Side Tipping & Gratuity Suggestions</div>
                    <div className="text-[11px] text-[#7A7268]">Displays pre-calculated tip options on guest payment checkout screen.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.payments.enableTipping}
                    onChange={(e) => handleFieldChange('payments', { enableTipping: e.target.checked })}
                    className="w-4 h-4 accent-[#79415A] cursor-pointer"
                  />
                </div>

                {settings.payments.enableTipping && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#DDD5C7] text-xs">
                    <span className="text-[#5C5549] font-semibold">Suggested Options:</span>
                    {settings.payments.suggestedTipPercentages.map((p, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-[#EFE9DF] border border-[#DDD5C7] font-bold text-[#79415A]">
                        {p}%
                      </span>
                    ))}
                    <label className="ml-auto flex items-center gap-2 cursor-pointer text-xs text-[#1F313D]">
                      <input
                        type="checkbox"
                        checked={settings.payments.allowCustomTip}
                        onChange={(e) => handleFieldChange('payments', { allowCustomTip: e.target.checked })}
                        className="w-4 h-4 accent-[#79415A]"
                      />
                      <span>Allow guest custom tip amount entry</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 9: CUSTOMER COMMUNICATION PREFERENCES
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'communication' && (
            <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1F313D] flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#79415A]" />
                  Communication Rules, Quiet Hours & Guest Privacy
                </h2>
                <p className="text-xs text-[#7A7268] mt-1">
                  Safeguard patron trust by regulating marketing frequency, enforcing quiet hours (Do-Not-Disturb), and managing privacy opt-outs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quiet Hours Configuration */}
                <div className="md:col-span-2 p-4 rounded-xl border border-[#DDD5C7] bg-[#EFE9DF] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#1F313D]">Automated Quiet Hours (Do Not Disturb)</div>
                      <div className="text-[11px] text-[#7A7268]">
                        Suppresses non-urgent promotional alerts during evening and early morning hours.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.communication.enableQuietHours}
                      onChange={(e) => handleFieldChange('communication', { enableQuietHours: e.target.checked })}
                      className="w-4 h-4 accent-[#79415A] cursor-pointer"
                    />
                  </div>

                  {settings.communication.enableQuietHours && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#DDD5C7]">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">Quiet Hours Begin (Night)</label>
                        <input
                          type="time"
                          value={settings.communication.quietHoursStart}
                          onChange={(e) => handleFieldChange('communication', { quietHoursStart: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#DDD5C7] text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">Quiet Hours End (Morning)</label>
                        <input
                          type="time"
                          value={settings.communication.quietHoursEnd}
                          onChange={(e) => handleFieldChange('communication', { quietHoursEnd: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#DDD5C7] text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F313D]">Promotional Broadcast Permission</span>
                    <input
                      type="checkbox"
                      checked={settings.communication.allowPromotionalBroadcasts}
                      onChange={(e) => handleFieldChange('communication', { allowPromotionalBroadcasts: e.target.checked })}
                      className="w-4 h-4 accent-[#79415A]"
                    />
                  </div>
                  <p className="text-[11px] text-[#7A7268]">
                    Send festival specials, chef tasting menus, and discount codes to patrons who consented.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F313D]">Double Opt-In Verification</span>
                    <input
                      type="checkbox"
                      checked={settings.communication.requireDoubleOptIn}
                      onChange={(e) => handleFieldChange('communication', { requireDoubleOptIn: e.target.checked })}
                      className="w-4 h-4 accent-[#79415A]"
                    />
                  </div>
                  <p className="text-[11px] text-[#7A7268]">
                    Require patrons to confirm consent via SMS/Email before enrolling in marketing lists.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Compliance Unsubscribe Disclaimer</label>
                  <input
                    type="text"
                    value={settings.communication.unsubscribeNotice}
                    onChange={(e) => handleFieldChange('communication', { unsubscribeNotice: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                    placeholder="e.g. Reply STOP to unsubscribe from promotional updates at any time."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F313D] mb-1.5">Customer Dining History Data Retention</label>
                  <select
                    value={settings.communication.dataRetentionMonths}
                    onChange={(e) => handleFieldChange('communication', { dataRetentionMonths: parseInt(e.target.value) || 24 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                  >
                    <option value="12">12 months (1 Year)</option>
                    <option value="24">24 months (2 Years)</option>
                    <option value="36">36 months (3 Years)</option>
                    <option value="60">60 months (5 Years)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 10: OPENING & CLOSING HOURS
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'hours' && (
            <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1F313D] flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-[#79415A]" />
                  Weekly Operating Schedule & Holiday Notices
                </h2>
                <p className="text-xs text-[#7A7268] mt-1">
                  Manage standard dining room opening & closing hours, afternoon split shifts (e.g. lunch vs. dinner service), and kitchen order cutoff times.
                </p>
              </div>

              {/* Weekly Schedule Table */}
              <div className="space-y-2">
                {settings.operatingHours.schedule.map((dayItem, idx) => (
                  <div
                    key={dayItem.day}
                    className={`p-3.5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      dayItem.isOpen
                        ? 'bg-[#EFE9DF] border-[#DDD5C7]'
                        : 'bg-white/50 border-[#DDD5C7] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[130px]">
                      <input
                        type="checkbox"
                        checked={dayItem.isOpen}
                        onChange={(e) => {
                          const sched = [...settings.operatingHours.schedule];
                          sched[idx].isOpen = e.target.checked;
                          setSettings({ ...settings, operatingHours: { ...settings.operatingHours, schedule: sched } });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-4 h-4 accent-[#79415A] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-[#1F313D]">{dayItem.day}</span>
                    </div>

                    {dayItem.isOpen ? (
                      <div className="flex flex-wrap items-center gap-3 text-xs flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#7A7268]">Open:</span>
                          <input
                            type="time"
                            value={dayItem.openTime}
                            onChange={(e) => {
                              const sched = [...settings.operatingHours.schedule];
                              sched[idx].openTime = e.target.value;
                              setSettings({ ...settings, operatingHours: { ...settings.operatingHours, schedule: sched } });
                              setHasUnsavedChanges(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD5C7] font-bold text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#7A7268]">Close:</span>
                          <input
                            type="time"
                            value={dayItem.closeTime}
                            onChange={(e) => {
                              const sched = [...settings.operatingHours.schedule];
                              sched[idx].closeTime = e.target.value;
                              setSettings({ ...settings, operatingHours: { ...settings.operatingHours, schedule: sched } });
                              setHasUnsavedChanges(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD5C7] font-bold text-xs"
                          />
                        </div>

                        {/* Split Shift Toggle */}
                        <label className="flex items-center gap-1.5 cursor-pointer ml-auto text-[11px] text-[#5C5549]">
                          <input
                            type="checkbox"
                            checked={dayItem.hasSplitShift}
                            onChange={(e) => {
                              const sched = [...settings.operatingHours.schedule];
                              sched[idx].hasSplitShift = e.target.checked;
                              setSettings({ ...settings, operatingHours: { ...settings.operatingHours, schedule: sched } });
                              setHasUnsavedChanges(true);
                            }}
                            className="w-3.5 h-3.5 accent-[#79415A]"
                          />
                          <span>Split Shift</span>
                        </label>

                        {dayItem.hasSplitShift && (
                          <div className="flex items-center gap-2 pl-3 border-l border-[#DDD5C7]">
                            <span className="text-[11px] text-[#7A7268]">Dinner Shift:</span>
                            <input
                              type="time"
                              value={dayItem.splitOpenTime}
                              onChange={(e) => {
                                const sched = [...settings.operatingHours.schedule];
                                sched[idx].splitOpenTime = e.target.value;
                                setSettings({ ...settings, operatingHours: { ...settings.operatingHours, schedule: sched } });
                                setHasUnsavedChanges(true);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-white border border-[#DDD5C7] text-[11px] font-bold"
                            />
                            <span>–</span>
                            <input
                              type="time"
                              value={dayItem.splitCloseTime}
                              onChange={(e) => {
                                const sched = [...settings.operatingHours.schedule];
                                sched[idx].splitCloseTime = e.target.value;
                                setSettings({ ...settings, operatingHours: { ...settings.operatingHours, schedule: sched } });
                                setHasUnsavedChanges(true);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-white border border-[#DDD5C7] text-[11px] font-bold"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-[#7A7268] italic">Closed all day</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Holiday Notice Banner Configuration */}
              <div className="p-4 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#1F313D]">Public Holiday & Temporary Closure Notice</div>
                    <div className="text-[11px] text-[#7A7268]">Shows an advisory banner on your online ordering and table booking portals.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.operatingHours.holidayNoticeEnabled}
                    onChange={(e) =>
                      handleFieldChange('operatingHours', { holidayNoticeEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#79415A] cursor-pointer"
                  />
                </div>

                {settings.operatingHours.holidayNoticeEnabled && (
                  <div className="space-y-3 pt-2 border-t border-[#DDD5C7]">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">Banner Announcement Text</label>
                      <input
                        type="text"
                        value={settings.operatingHours.holidayNoticeText}
                        onChange={(e) =>
                          handleFieldChange('operatingHours', { holidayNoticeText: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs text-[#1F313D]"
                        placeholder="e.g. Closed from 3 PM on Dec 24 for annual private holiday banquet."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">Start Date</label>
                        <input
                          type="date"
                          value={settings.operatingHours.holidayStartDate}
                          onChange={(e) =>
                            handleFieldChange('operatingHours', { holidayStartDate: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C5549] mb-1">End Date</label>
                        <input
                          type="date"
                          value={settings.operatingHours.holidayEndDate}
                          onChange={(e) =>
                            handleFieldChange('operatingHours', { holidayEndDate: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-[#EFE9DF] border border-[#DDD5C7] text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Persistent Action Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C7] shadow-xs">
            <div className="flex items-center gap-2 text-xs text-[#7A7268]">
              <Clock className="w-3.5 h-3.5 text-[#82401D]" />
              <span>Last updated: {new Date(settings.lastUpdated).toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <span className="text-xs text-amber-700 font-semibold hidden sm:inline">
                  Unsaved changes pending
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Resetting to Defaults */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#FAF7F2] border border-[#DDD5C7] rounded-[24px] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#1F313D]">Reset Restaurant Settings?</h3>
                <p className="text-xs text-[#7A7268]">This will restore all 10 configuration categories to factory defaults.</p>
              </div>
            </div>

            <p className="text-xs text-[#5C5549] leading-relaxed">
              Are you sure? Any customized tax rates, notification templates, and reservation policy overrides will be reverted to initial defaults.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#5C5549] hover:bg-[#EFE9DF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="flex-1 py-2.5 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold shadow-xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
