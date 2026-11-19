import { supabase } from './supabase';

// ─── 1. RESTAURANT PROFILE & CONTACT ──────────────────────────────────────────
export interface RestaurantProfileSettings {
  name: string;
  tagline: string;
  logoUrl: string;
  website: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  registrationNumber: string;
  licenseNumber: string;
  gstVatNumber: string;
}

// ─── 2. TAX RATES & APPLICABLE TAX SETTINGS ──────────────────────────────────
export interface TaxSettings {
  defaultTaxRate: number; // e.g. 5.0%
  taxName: string; // 'GST' | 'VAT' | 'Sales Tax'
  taxCalculation: 'inclusive' | 'exclusive';
  enableSplitTax: boolean; // e.g. CGST + SGST
  cgstRate: number; // 2.5%
  sgstRate: number; // 2.5%
  alcoholTaxRate: number; // e.g. 10.0%
  enableServiceCharge: boolean;
  serviceChargeRate: number; // e.g. 5.0%
  serviceChargeTaxable: boolean;
  takeawayPackagingFee: number; // e.g. $1.50
  taxInvoicePrefix: string; // 'INV-'
  currentInvoiceNumber: number; // 1042
}

// ─── 3. CURRENCY & TIMEZONE ──────────────────────────────────────────────────
export interface CurrencyTimezoneSettings {
  currencyCode: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimalPlaces: number;
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
}

// ─── 4. RESERVATION POLICIES ─────────────────────────────────────────────────
export interface ReservationPolicySettings {
  maxPartySize: number;
  minLeadTimeMinutes: number;
  maxAdvanceBookingDays: number;
  tableHoldGraceMinutes: number;
  autoConfirmReservations: boolean;
  requireDepositForLargeParties: boolean;
  largePartyThreshold: number;
  depositAmountPerGuest: number;
  standardSeatingDurationMinutes: number;
  largePartySeatingDurationMinutes: number;
  reservationNotes: string;
}

// ─── 5. CANCELLATION POLICIES ────────────────────────────────────────────────
export interface CancellationPolicySettings {
  freeCancellationWindowHours: number;
  cancellationFeeType: 'fixed' | 'percentage' | 'deposit_forfeit';
  cancellationFeeAmount: number;
  noShowFeeAmount: number;
  autoReleaseTableOnNoShow: boolean;
  noShowThresholdMinutes: number;
  cancellationPolicyText: string;
}

// ─── 6. LOYALTY POINT RULES ──────────────────────────────────────────────────
export interface LoyaltyPointSettings {
  loyaltyProgramEnabled: boolean;
  programName: string;
  pointsPerCurrencySpent: number; // e.g. 1 pt per $1
  minimumRedemptionPoints: number; // 100
  pointValueInCurrency: number; // 100 pts = $5 => 0.05 per pt
  maxRedemptionPercentPerOrder: number; // 50%
  pointsExpiryMonths: number; // 12 (0 = never)
  signupBonusPoints: number; // 50
  birthdayBonusPoints: number; // 100
  excludeAlcoholFromLoyalty: boolean;
  excludeDiscountedOrders: boolean;
}

// ─── 7. NOTIFICATION TEMPLATES ───────────────────────────────────────────────
export interface NotificationTemplateItem {
  id: string;
  title: string;
  category: 'reservation' | 'order' | 'billing' | 'loyalty' | 'feedback';
  description: string;
  smsEnabled: boolean;
  smsTemplate: string;
  whatsappEnabled: boolean;
  whatsappTemplate: string;
  emailEnabled: boolean;
  emailSubject: string;
  emailBody: string;
}

// ─── 8. PAYMENT METHODS & GATEWAYS ───────────────────────────────────────────
export interface PaymentMethodItem {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  isOnline: boolean;
  badge?: string;
}

export interface PaymentSettings {
  methods: PaymentMethodItem[];
  gatewayProvider: 'stripe' | 'razorpay' | 'square' | 'paypal';
  isSandboxMode: boolean;
  gatewayKeyId: string;
  autoPrintReceiptOnPayment: boolean;
  enableTipping: boolean;
  suggestedTipPercentages: number[];
  allowCustomTip: boolean;
}

// ─── 9. CUSTOMER COMMUNICATION PREFERENCES ──────────────────────────────────
export interface CommunicationPreferencesSettings {
  channels: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  allowPromotionalBroadcasts: boolean;
  requireDoubleOptIn: boolean;
  enableQuietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  unsubscribeNotice: string;
  dataRetentionMonths: number;
}

// ─── 10. OPENING & CLOSING HOURS ─────────────────────────────────────────────
export interface OperatingDaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  hasSplitShift: boolean;
  splitOpenTime: string;
  splitCloseTime: string;
  lastOrderMinutesBeforeClose: number;
}

export interface OperatingHoursSettings {
  schedule: OperatingDaySchedule[];
  holidayNoticeEnabled: boolean;
  holidayNoticeText: string;
  holidayStartDate: string;
  holidayEndDate: string;
}

// ─── FULL ROOT SETTINGS STATE ────────────────────────────────────────────────
export interface RestaurantSettingsState {
  profile: RestaurantProfileSettings;
  tax: TaxSettings;
  currencyTimezone: CurrencyTimezoneSettings;
  reservation: ReservationPolicySettings;
  cancellation: CancellationPolicySettings;
  loyalty: LoyaltyPointSettings;
  notifications: NotificationTemplateItem[];
  payments: PaymentSettings;
  communication: CommunicationPreferencesSettings;
  operatingHours: OperatingHoursSettings;
  lastUpdated: string;
}

// ─── STORAGE KEY ─────────────────────────────────────────────────────────────
const STORAGE_RESTAURANT_SETTINGS_KEY = 'crm_restaurant_full_settings';

// ─── INITIAL DEFAULT STATE ───────────────────────────────────────────────────
export const DEFAULT_RESTAURANT_SETTINGS: RestaurantSettingsState = {
  profile: {
    name: "Cafe's Corner Heritage Bistro",
    tagline: 'Artisanal Roastery, Hearth Baking & Slow Food Gastronomy',
    logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
    website: 'https://www.cafescorner.com',
    email: 'contact@cafescorner.com',
    phone: '+91 22 2490 8820',
    secondaryPhone: '+91 98200 44101',
    address: '42 Heritage Boulevard, Central Commercial Square, Fort',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    registrationNumber: 'CIN-U55101MH2021PTC368920',
    licenseNumber: 'FSSAI-11521008000491',
    gstVatNumber: '27AABCC8920K1ZX',
  },

  tax: {
    defaultTaxRate: 5.0,
    taxName: 'GST',
    taxCalculation: 'exclusive',
    enableSplitTax: true,
    cgstRate: 2.5,
    sgstRate: 2.5,
    alcoholTaxRate: 10.0,
    enableServiceCharge: true,
    serviceChargeRate: 5.0,
    serviceChargeTaxable: false,
    takeawayPackagingFee: 1.5,
    taxInvoicePrefix: 'INV-2024-',
    currentInvoiceNumber: 1042,
  },

  currencyTimezone: {
    currencyCode: 'USD',
    currencySymbol: '$',
    currencyPosition: 'before',
    decimalPlaces: 2,
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
  },

  reservation: {
    maxPartySize: 16,
    minLeadTimeMinutes: 30,
    maxAdvanceBookingDays: 30,
    tableHoldGraceMinutes: 15,
    autoConfirmReservations: true,
    requireDepositForLargeParties: true,
    largePartyThreshold: 6,
    depositAmountPerGuest: 20.0,
    standardSeatingDurationMinutes: 90,
    largePartySeatingDurationMinutes: 120,
    reservationNotes:
      'Tables held for 15 minutes past scheduled time. Smart casual attire appreciated. Contact host directly for special banquet requests.',
  },

  cancellation: {
    freeCancellationWindowHours: 2,
    cancellationFeeType: 'deposit_forfeit',
    cancellationFeeAmount: 15.0,
    noShowFeeAmount: 25.0,
    autoReleaseTableOnNoShow: true,
    noShowThresholdMinutes: 20,
    cancellationPolicyText:
      'Cancellations made at least 2 hours prior to scheduled booking receive a 100% full refund on pre-authorized card holds. Late cancellations and no-shows within 2 hours are subject to table release and a standard fee of $25 per booking.',
  },

  loyalty: {
    loyaltyProgramEnabled: true,
    programName: 'Epicurean Connoisseur Rewards',
    pointsPerCurrencySpent: 1, // 1 point per $1 spent
    minimumRedemptionPoints: 100,
    pointValueInCurrency: 0.05, // 100 points = $5.00
    maxRedemptionPercentPerOrder: 40,
    pointsExpiryMonths: 12,
    signupBonusPoints: 50,
    birthdayBonusPoints: 100,
    excludeAlcoholFromLoyalty: true,
    excludeDiscountedOrders: false,
  },

  notifications: [
    {
      id: 'notif-res-confirm',
      title: 'Reservation Confirmation',
      category: 'reservation',
      description: 'Triggered instantly when table booking is submitted and approved.',
      smsEnabled: true,
      smsTemplate:
        'Hi {guest_name}, your table for {party_size} at {restaurant_name} ({branch_name}) is confirmed for {reservation_date} at {reservation_time}. Booking ID: #{booking_id}. See you soon!',
      whatsappEnabled: true,
      whatsappTemplate:
        '✨ *Table Confirmed* | {restaurant_name}\n\nDear {guest_name},\nWe look forward to hosting you on *{reservation_date} at {reservation_time}* for *{party_size} guests*.\n\n📍 *Branch:* {branch_name}\n🔖 *Booking Ref:* #{booking_id}\n\nNeed to update your booking? Tap here: {booking_link}',
      emailEnabled: true,
      emailSubject: 'Table Reservation Confirmed — {restaurant_name} (#{booking_id})',
      emailBody:
        '<p>Dear <strong>{guest_name}</strong>,</p><p>We are delighted to confirm your reservation for <strong>{party_size} guests</strong> on <strong>{reservation_date}</strong> at <strong>{reservation_time}</strong>.</p><p>Your table will be prepared at our {branch_name} outlet.</p>',
    },
    {
      id: 'notif-res-reminder',
      title: 'Reservation Reminder',
      category: 'reservation',
      description: 'Dispatched 2 hours before scheduled dining slot.',
      smsEnabled: true,
      smsTemplate:
        'Reminder: We look forward to seeing you today at {reservation_time} at {restaurant_name}. Tables held for 15 mins. Reply CANCEL if plans changed.',
      whatsappEnabled: true,
      whatsappTemplate:
        '⏰ *Upcoming Reservation Reminder*\n\nHi {guest_name}, we are preparing your table for *{reservation_time} today* at {restaurant_name}. Please let us know if your party size or ETA changes!',
      emailEnabled: false,
      emailSubject: 'See you today at {reservation_time}! — {restaurant_name}',
      emailBody:
        '<p>Hi {guest_name},</p><p>Just a quick reminder that your table is reserved for today at {reservation_time}.</p>',
    },
    {
      id: 'notif-res-cancelled',
      title: 'Reservation Cancellation',
      category: 'reservation',
      description: 'Dispatched when booking is cancelled by guest or host.',
      smsEnabled: true,
      smsTemplate:
        'Your reservation #{booking_id} at {restaurant_name} for {reservation_date} has been cancelled. Any pre-held deposit will be returned within 3-5 days.',
      whatsappEnabled: true,
      whatsappTemplate:
        'ℹ️ *Reservation Cancelled*\n\nHi {guest_name}, your booking #{booking_id} on {reservation_date} has been successfully cancelled. We hope to welcome you another time soon!',
      emailEnabled: true,
      emailSubject: 'Reservation Cancellation Confirmation — #{booking_id}',
      emailBody:
        '<p>Dear {guest_name},</p><p>Your table booking for {reservation_date} has been cancelled as requested.</p>',
    },
    {
      id: 'notif-order-ready',
      title: 'Order Ready / Ticket Served',
      category: 'order',
      description: 'Triggered when kitchen tickets are marked READY by chef.',
      smsEnabled: true,
      smsTemplate:
        'Order #{order_id} at {restaurant_name} is hot and ready! Please pickup at the counter or our server is bringing it to your table.',
      whatsappEnabled: true,
      whatsappTemplate:
        '🍽️ *Order Ready!* | {restaurant_name}\n\nHi {guest_name}, your culinary selection for order *#{order_id}* is fresh from the kitchen and ready!',
      emailEnabled: false,
      emailSubject: 'Your order is ready! — {restaurant_name}',
      emailBody: '<p>Your order #{order_id} is ready for service.</p>',
    },
    {
      id: 'notif-billing-receipt',
      title: 'Digital Bill & Payment Receipt',
      category: 'billing',
      description: 'Delivered upon bill settlement at table or POS terminal.',
      smsEnabled: true,
      smsTemplate:
        'Thank you for dining with {restaurant_name}! Your bill of {bill_amount} is settled. View your itemized e-receipt: {receipt_url}',
      whatsappEnabled: true,
      whatsappTemplate:
        '🧾 *Digital Receipt* | {restaurant_name}\n\nThank you for dining with us today, {guest_name}!\n\n💵 *Total Settled:* {bill_amount}\n💳 *Payment Method:* {payment_method}\n\n📄 *View/Download Invoice:* {receipt_url}',
      emailEnabled: true,
      emailSubject: 'Your Receipt from {restaurant_name} — #{receipt_id}',
      emailBody:
        '<p>Thank you for visiting {restaurant_name}. Your invoice of {bill_amount} has been paid in full.</p><p><a href="{receipt_url}">Click here to download your tax invoice PDF</a></p>',
    },
    {
      id: 'notif-loyalty-earned',
      title: 'Loyalty Points Earned',
      category: 'loyalty',
      description: 'Dispatched when reward points are credited post transaction.',
      smsEnabled: true,
      smsTemplate:
        'You just earned {points_earned} Epicurean points! Your total balance is now {total_points} points at {restaurant_name}.',
      whatsappEnabled: true,
      whatsappTemplate:
        '⭐ *Reward Points Credited!*\n\nAwesome news {guest_name}! You earned *+{points_earned} points* on your recent visit.\n\n🏆 *Your Current Balance:* {total_points} pts (Worth {points_value_currency})\nRedeem anytime on your next dine-in visit!',
      emailEnabled: true,
      emailSubject: 'You earned +{points_earned} points at {restaurant_name}!',
      emailBody:
        '<p>Congratulations {guest_name}! Your loyalty point balance is now {total_points} points.</p>',
    },
    {
      id: 'notif-feedback-survey',
      title: 'Guest Feedback & Rating Request',
      category: 'feedback',
      description: 'Dispatched 45 minutes following dining experience.',
      smsEnabled: true,
      smsTemplate:
        'How was your culinary experience at {restaurant_name} today? Share your thoughts in 30 seconds: {survey_url}',
      whatsappEnabled: true,
      whatsappTemplate:
        '💬 *How was your meal today?*\n\nHi {guest_name}, our culinary team would love to know how your visit went! Could you take 30 seconds to rate us?\n\n⭐ *Share Review:* {survey_url}',
      emailEnabled: true,
      emailSubject: 'Tell us about your experience at {restaurant_name}',
      emailBody:
        '<p>Dear {guest_name},</p><p>We value your patronage. Please let us know how your visit was today so we can continue perfecting our hospitality.</p>',
    },
  ],

  payments: {
    methods: [
      { id: 'cash', title: 'Cash on Counter & Table', description: 'Accept currency cash with change calculation at counter or table side.', enabled: true, isOnline: false, badge: 'Standard' },
      { id: 'card', title: 'Credit & Debit Cards (EMV / NFC)', description: 'Visa, Mastercard, Amex, RuPay chip & contactless tap-to-pay.', enabled: true, isOnline: true, badge: 'Instant' },
      { id: 'upi_qr', title: 'Dynamic UPI QR & BharatQR', description: 'On-screen terminal QR code with realtime audio/push verification.', enabled: true, isOnline: true, badge: 'Popular' },
      { id: 'wallets', title: 'Apple Pay & Google Pay', description: 'One-tap mobile wallets with biometric guest confirmation.', enabled: true, isOnline: true },
      { id: 'net_banking', title: 'Direct Net Banking & IMPS', description: 'Institutional business clients and catering banquet advance deposits.', enabled: true, isOnline: true },
      { id: 'gift_cards', title: 'Gift Cards & Dining Vouchers', description: 'Redeem digital gift cards, corporate credits, and promotional coupons.', enabled: true, isOnline: false },
      { id: 'room_tab', title: 'Guest Room & Member House Tab', description: 'Charge directly to registered hotel room or club membership ledger.', enabled: false, isOnline: false },
    ],
    gatewayProvider: 'stripe',
    isSandboxMode: true,
    gatewayKeyId: 'pk_live_51P9...98Xz (Active)',
    autoPrintReceiptOnPayment: true,
    enableTipping: true,
    suggestedTipPercentages: [5, 10, 15, 20],
    allowCustomTip: true,
  },

  communication: {
    channels: {
      sms: true,
      email: true,
      whatsapp: true,
    },
    allowPromotionalBroadcasts: true,
    requireDoubleOptIn: false,
    enableQuietHours: true,
    quietHoursStart: '21:30',
    quietHoursEnd: '09:00',
    unsubscribeNotice: 'Reply STOP to unsubscribe from promotional updates at any time.',
    dataRetentionMonths: 24,
  },

  operatingHours: {
    schedule: [
      { day: 'Monday', isOpen: true, openTime: '08:00', closeTime: '23:00', hasSplitShift: false, splitOpenTime: '18:30', splitCloseTime: '23:30', lastOrderMinutesBeforeClose: 30 },
      { day: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '23:00', hasSplitShift: false, splitOpenTime: '18:30', splitCloseTime: '23:30', lastOrderMinutesBeforeClose: 30 },
      { day: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '23:00', hasSplitShift: false, splitOpenTime: '18:30', splitCloseTime: '23:30', lastOrderMinutesBeforeClose: 30 },
      { day: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '23:30', hasSplitShift: false, splitOpenTime: '18:30', splitCloseTime: '23:30', lastOrderMinutesBeforeClose: 30 },
      { day: 'Friday', isOpen: true, openTime: '08:00', closeTime: '00:30', hasSplitShift: true, splitOpenTime: '18:00', splitCloseTime: '00:30', lastOrderMinutesBeforeClose: 45 },
      { day: 'Saturday', isOpen: true, openTime: '08:30', closeTime: '01:00', hasSplitShift: true, splitOpenTime: '18:00', splitCloseTime: '01:00', lastOrderMinutesBeforeClose: 45 },
      { day: 'Sunday', isOpen: true, openTime: '08:30', closeTime: '23:00', hasSplitShift: false, splitOpenTime: '18:30', splitCloseTime: '23:00', lastOrderMinutesBeforeClose: 30 },
    ],
    holidayNoticeEnabled: false,
    holidayNoticeText: 'Holiday banquet hours: Kitchen closes at 4 PM on Christmas Eve for a private event.',
    holidayStartDate: '2024-12-24',
    holidayEndDate: '2024-12-25',
  },

  lastUpdated: new Date().toISOString(),
};

// ─── STORAGE FUNCTIONS ────────────────────────────────────────────────────────
export function loadRestaurantSettings(): RestaurantSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_RESTAURANT_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults in case of missing keys
      return {
        ...DEFAULT_RESTAURANT_SETTINGS,
        ...parsed,
        profile: { ...DEFAULT_RESTAURANT_SETTINGS.profile, ...(parsed.profile || {}) },
        tax: { ...DEFAULT_RESTAURANT_SETTINGS.tax, ...(parsed.tax || {}) },
        currencyTimezone: { ...DEFAULT_RESTAURANT_SETTINGS.currencyTimezone, ...(parsed.currencyTimezone || {}) },
        reservation: { ...DEFAULT_RESTAURANT_SETTINGS.reservation, ...(parsed.reservation || {}) },
        cancellation: { ...DEFAULT_RESTAURANT_SETTINGS.cancellation, ...(parsed.cancellation || {}) },
        loyalty: { ...DEFAULT_RESTAURANT_SETTINGS.loyalty, ...(parsed.loyalty || {}) },
        notifications: parsed.notifications?.length ? parsed.notifications : DEFAULT_RESTAURANT_SETTINGS.notifications,
        payments: { ...DEFAULT_RESTAURANT_SETTINGS.payments, ...(parsed.payments || {}) },
        communication: { ...DEFAULT_RESTAURANT_SETTINGS.communication, ...(parsed.communication || {}) },
        operatingHours: { ...DEFAULT_RESTAURANT_SETTINGS.operatingHours, ...(parsed.operatingHours || {}) },
      };
    }
  } catch (err) {
    console.warn('Failed to parse restaurant settings from storage:', err);
  }
  return DEFAULT_RESTAURANT_SETTINGS;
}

export function saveRestaurantSettingsToStorage(settings: RestaurantSettingsState): void {
  try {
    localStorage.setItem(STORAGE_RESTAURANT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save restaurant settings to storage:', err);
  }
}

// ─── API FUNCTIONS ─────────────────────────────────────────────────────────────

/**
 * Fetch Restaurant Settings: tries Supabase first, falls back to persistent storage
 */
export async function fetchRestaurantSettings(orgId?: string): Promise<RestaurantSettingsState> {
  let settings = loadRestaurantSettings();

  try {
    let q = supabase.from('restaurant_settings').select('*').limit(1);
    if (orgId) q = q.eq('organization_id', orgId);
    const { data, error } = await q;

    if (!error && data && data.length > 0 && data[0].config_data) {
      const remoteData = data[0].config_data;
      settings = {
        ...settings,
        ...remoteData,
        lastUpdated: data[0].updated_at || settings.lastUpdated,
      };
      saveRestaurantSettingsToStorage(settings);
    }
  } catch (err) {
    console.warn('Supabase fetch notice for restaurant_settings, falling back to storage:', err);
  }

  return settings;
}

/**
 * Save Restaurant Settings: writes immediately to storage, then syncs to Supabase
 */
export async function saveRestaurantSettings(
  updatedSettings: RestaurantSettingsState,
  orgId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: RestaurantSettingsState = {
      ...updatedSettings,
      lastUpdated: new Date().toISOString(),
    };

    saveRestaurantSettingsToStorage(payload);

    // Non-blocking background sync to Supabase
    Promise.resolve(
      supabase.from('restaurant_settings').upsert({
        id: orgId || 'default-restaurant-config',
        organization_id: orgId || null,
        config_data: payload,
        updated_at: payload.lastUpdated,
      })
    ).catch((err) => {
      console.warn('Non-blocking Supabase sync for restaurant_settings warning:', err);
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error saving restaurant settings:', err);
    return { success: false, error: err?.message || 'Could not save settings' };
  }
}

/**
 * Reset settings back to baseline factory defaults
 */
export function resetRestaurantSettingsToDefaults(): RestaurantSettingsState {
  const resetState = { ...DEFAULT_RESTAURANT_SETTINGS, lastUpdated: new Date().toISOString() };
  saveRestaurantSettingsToStorage(resetState);
  return resetState;
}
