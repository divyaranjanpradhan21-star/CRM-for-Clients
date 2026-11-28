import { supabase } from './supabase';

// ─── TYPES & INTERFACES ───────────────────────────────────────────────────────

export type MembershipTier = 'Silver' | 'Gold' | 'Platinum' | 'VIP';
export type MembershipStatus = 'Active' | 'Expired' | 'Pending' | 'Cancelled';
export type ValidityPeriodUnit = 'Days' | 'Months' | 'Years' | 'Lifetime';

export interface MembershipBenefit {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface MembershipPlan {
  id: string;
  orgId?: string;
  name: string; // e.g. "Gold Connoisseur Club"
  tier: MembershipTier;
  code: string; // e.g. "MEM-GLD"
  description: string;
  price: number; // in ₹ (0 for complimentary)
  validityValue: number; // e.g. 12
  validityUnit: ValidityPeriodUnit; // e.g. "Months"
  discountPercentage: number; // e.g. 15% flat discount on dining (FR-MEM-005)
  maxDiscountPerBill?: number; // optional cap e.g. ₹500
  loyaltyMultiplier: number; // e.g. 1.5x points bonus when spending
  benefits: string[]; // FR-MEM-006: list of privileges
  colorTheme: string; // hex or tailwind class
  badgeText: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerMembership {
  id: string; // e.g. "MEM-2024-0001"
  membershipNumber: string;
  customerId: string; // references CustomerProfile.id
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  planId: string;
  planName: string;
  tier: MembershipTier;
  discountPercentage: number;
  loyaltyMultiplier: number;
  pricePaid: number;
  paymentMethod: string;
  invoiceId?: string; // linked to Billing module!
  startDate: string; // ISO
  expiryDate: string; // ISO
  status: MembershipStatus;
  renewalCount: number;
  lastRenewedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  assignedBy: string;
  branchName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipRenewalRecord {
  id: string;
  membershipId: string;
  customerId: string;
  customerName: string;
  previousExpiryDate: string;
  newExpiryDate: string;
  renewedPeriod: string;
  priceCharged: number;
  paymentMethod: string;
  invoiceId?: string;
  renewedBy: string;
  renewedAt: string;
}

export interface MembershipNotification {
  id: string;
  membershipId: string;
  customerId: string;
  customerPhone: string;
  type: 'ENROLLMENT' | 'RENEWAL_REMINDER_30D' | 'RENEWAL_REMINDER_7D' | 'EXPIRED' | 'CANCELLED';
  channel: 'SMS' | 'WhatsApp' | 'Email';
  message: string;
  sentAt: string;
  status: 'Delivered' | 'Pending';
}

export interface MembershipMetrics {
  totalMemberships: number;
  activeMemberships: number;
  expiredMemberships: number;
  cancelledMemberships: number;
  totalMembershipRevenue: number;
  renewalRate: number; // %
  tierBreakdown: Record<MembershipTier, number>;
}

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────────

const PLANS_KEY = 'crm_membership_plans_v1';
const MEMBERSHIPS_KEY = 'crm_customer_memberships_v1';
const RENEWALS_KEY = 'crm_membership_renewals_v1';
const NOTIFICATIONS_KEY = 'crm_membership_notifications_v1';

// ─── SEED DATA ────────────────────────────────────────────────────────────────

export const SEED_PLANS: MembershipPlan[] = [
  {
    id: 'plan-silver',
    name: 'Silver Epicurean Club',
    tier: 'Silver',
    code: 'MEM-SLV',
    description: 'Essential perks, priority reservations, and everyday savings for regular diners.',
    price: 999,
    validityValue: 6,
    validityUnit: 'Months',
    discountPercentage: 10,
    maxDiscountPerBill: 300,
    loyaltyMultiplier: 1.25,
    benefits: [
      '10% flat discount on all Dine-in & Takeaway orders',
      '1.25x loyalty points multiplier',
      'Priority weekend table reservations',
      'Free dessert on your birthday'
    ],
    colorTheme: '#64748B',
    badgeText: 'Silver Member',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plan-gold',
    name: 'Gold Connoisseur Club',
    tier: 'Gold',
    code: 'MEM-GLD',
    description: 'Our most popular annual membership with premium dining privileges and generous culinary savings.',
    price: 1999,
    validityValue: 12,
    validityUnit: 'Months',
    discountPercentage: 15,
    maxDiscountPerBill: 600,
    loyaltyMultiplier: 1.5,
    benefits: [
      '15% flat discount on total food & beverage bills',
      '1.5x accelerated loyalty points earning',
      'Complimentary welcome craft coffee or mocktail on every visit',
      'Guaranteed priority seating during peak hours',
      'Exclusive invitations to Seasonal Chef Tasting events'
    ],
    colorTheme: '#D97706',
    badgeText: 'Gold Member',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plan-platinum',
    name: 'Platinum Haute VIP Dining',
    tier: 'Platinum',
    code: 'MEM-PLT',
    description: 'The ultimate luxury dining experience with personalized hospitality, complimentary pairings, and maximum perks.',
    price: 3999,
    validityValue: 12,
    validityUnit: 'Months',
    discountPercentage: 20,
    maxDiscountPerBill: 1200,
    loyaltyMultiplier: 2.0,
    benefits: [
      '20% exclusive discount on all dine-in, takeaway, and delivery orders',
      '2.0x double loyalty points on every purchase',
      'Complimentary chef special appetizer with every visit',
      'Complimentary valet parking & dedicated VIP lounge table access',
      'Zero cancellation fees on table bookings',
      'Personalized table greeting and dedicated head server'
    ],
    colorTheme: '#475569',
    badgeText: 'Platinum VIP',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  }
];

const SEED_MEMBERSHIPS: CustomerMembership[] = [
  {
    id: 'MEM-2024-0001',
    membershipNumber: 'CORNER-GLD-1001',
    customerId: 'CUST-10491',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98201 12345',
    customerEmail: 'aarav.sharma@example.com',
    planId: 'plan-gold',
    planName: 'Gold Connoisseur Club',
    tier: 'Gold',
    discountPercentage: 15,
    loyaltyMultiplier: 1.5,
    pricePaid: 1999,
    paymentMethod: 'UPI',
    invoiceId: 'INV-2024-0005',
    startDate: '2024-02-15T10:00:00.000Z',
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString(),
    status: 'Active',
    renewalCount: 1,
    lastRenewedAt: '2024-08-15T11:00:00.000Z',
    assignedBy: 'Admin (Pooja Rao)',
    branchName: 'Main Branch',
    notes: 'Premium regular diner, enrolled during Anniversary gala',
    createdAt: '2024-02-15T10:00:00.000Z',
    updatedAt: '2024-08-15T11:00:00.000Z'
  },
  {
    id: 'MEM-2024-0002',
    membershipNumber: 'CORNER-PLT-1002',
    customerId: 'CUST-10492',
    customerName: 'Priya Patel',
    customerPhone: '+91 98202 23456',
    customerEmail: 'priya.patel@example.com',
    planId: 'plan-platinum',
    planName: 'Platinum Haute VIP Dining',
    tier: 'Platinum',
    discountPercentage: 20,
    loyaltyMultiplier: 2.0,
    pricePaid: 3999,
    paymentMethod: 'Card',
    invoiceId: 'INV-2024-0010',
    startDate: '2024-01-20T12:00:00.000Z',
    expiryDate: new Date(Date.now() + 240 * 86400000).toISOString(),
    status: 'Active',
    renewalCount: 0,
    assignedBy: 'Admin (Pooja Rao)',
    branchName: 'City Center',
    notes: 'High-frequency VIP business diner',
    createdAt: '2024-01-20T12:00:00.000Z',
    updatedAt: '2024-01-20T12:00:00.000Z'
  },
  {
    id: 'MEM-2024-0003',
    membershipNumber: 'CORNER-SLV-1003',
    customerId: 'CUST-10493',
    customerName: 'Rohan Mehra',
    customerPhone: '+91 98203 34567',
    customerEmail: 'rohan.mehra@example.com',
    planId: 'plan-silver',
    planName: 'Silver Epicurean Club',
    tier: 'Silver',
    discountPercentage: 10,
    loyaltyMultiplier: 1.25,
    pricePaid: 999,
    paymentMethod: 'Cash',
    startDate: '2024-03-01T15:00:00.000Z',
    expiryDate: new Date(Date.now() - 10 * 86400000).toISOString(), // Expired
    status: 'Expired',
    renewalCount: 0,
    assignedBy: 'Staff (Rahul Verma)',
    branchName: 'Airport Road',
    notes: 'Follow up for annual Gold upgrade',
    createdAt: '2024-03-01T15:00:00.000Z',
    updatedAt: '2024-09-01T15:00:00.000Z'
  }
];

// ─── STORAGE ACCESSORS ────────────────────────────────────────────────────────

export function loadMembershipPlans(): MembershipPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(PLANS_KEY, JSON.stringify(SEED_PLANS));
  return SEED_PLANS;
}

export function saveMembershipPlans(plans: MembershipPlan[]): void {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  try {
    supabase.from('crm_membership_plans').upsert(
      plans.map(p => ({
        id: p.id,
        name: p.name,
        tier: p.tier,
        price: p.price,
        discount_percentage: p.discountPercentage,
        config: p,
        updated_at: new Date().toISOString()
      }))
    ).then();
  } catch {}
}

export function loadCustomerMemberships(): CustomerMembership[] {
  try {
    const raw = localStorage.getItem(MEMBERSHIPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(SEED_MEMBERSHIPS));
  return SEED_MEMBERSHIPS;
}

export function saveCustomerMemberships(memberships: CustomerMembership[]): void {
  localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(memberships));
}

export function loadMembershipRenewals(): MembershipRenewalRecord[] {
  try {
    const raw = localStorage.getItem(RENEWALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveMembershipRenewals(renewals: MembershipRenewalRecord[]): void {
  localStorage.setItem(RENEWALS_KEY, JSON.stringify(renewals));
}

export function loadMembershipNotifications(): MembershipNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveMembershipNotifications(notifs: MembershipNotification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
}

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

export function calculateExpiryDate(startDate: string, value: number, unit: ValidityPeriodUnit): string {
  const date = new Date(startDate);
  switch (unit) {
    case 'Days':
      date.setDate(date.getDate() + value);
      break;
    case 'Months':
      date.setMonth(date.getMonth() + value);
      break;
    case 'Years':
      date.setFullYear(date.getFullYear() + value);
      break;
    case 'Lifetime':
      date.setFullYear(date.getFullYear() + 50);
      break;
  }
  return date.toISOString();
}

export function sendMembershipNotification(
  notif: Omit<MembershipNotification, 'id' | 'sentAt' | 'status'>
): MembershipNotification {
  const notifs = loadMembershipNotifications();
  const record: MembershipNotification = {
    ...notif,
    id: `MNOT-${Date.now()}`,
    sentAt: new Date().toISOString(),
    status: 'Delivered'
  };
  notifs.unshift(record);
  saveMembershipNotifications(notifs);
  return record;
}

// ─── CORE FUNCTIONAL REQUIREMENTS ─────────────────────────────────────────────

/**
 * FR-MEM-001, FR-MEM-002, FR-MEM-003, FR-MEM-005, FR-MEM-006:
 * Save or update a membership plan
 */
export function saveMembershipPlan(plan: Partial<MembershipPlan>): MembershipPlan {
  const plans = loadMembershipPlans();
  const now = new Date().toISOString();

  if (plan.id && plans.some(p => p.id === plan.id)) {
    const idx = plans.findIndex(p => p.id === plan.id);
    const updated: MembershipPlan = {
      ...plans[idx],
      ...plan,
      updatedAt: now
    } as MembershipPlan;
    plans[idx] = updated;
    saveMembershipPlans(plans);
    return updated;
  } else {
    const newId = plan.id || `plan-${Date.now()}`;
    const newPlan: MembershipPlan = {
      id: newId,
      name: plan.name || 'New Membership Plan',
      tier: plan.tier || 'Silver',
      code: plan.code || `MEM-${(plan.tier || 'SLV').toUpperCase()}`,
      description: plan.description || '',
      price: plan.price || 0,
      validityValue: plan.validityValue || 12,
      validityUnit: plan.validityUnit || 'Months',
      discountPercentage: plan.discountPercentage || 10,
      maxDiscountPerBill: plan.maxDiscountPerBill,
      loyaltyMultiplier: plan.loyaltyMultiplier || 1.25,
      benefits: plan.benefits || ['Exclusive Member Discounts'],
      colorTheme: plan.colorTheme || '#475569',
      badgeText: plan.badgeText || `${plan.tier || 'Silver'} Member`,
      status: plan.status || 'Active',
      createdAt: now,
      updatedAt: now
    };
    plans.push(newPlan);
    saveMembershipPlans(plans);
    return newPlan;
  }
}

/**
 * FR-MEM-004: Assign a membership plan to an existing customer
 */
export function assignMembershipToCustomer(params: {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  planId: string;
  pricePaid: number;
  paymentMethod: string;
  assignedBy: string;
  branchName?: string;
  invoiceId?: string;
  notes?: string;
}): { success: boolean; membership: CustomerMembership; message: string } {
  const plans = loadMembershipPlans();
  const plan = plans.find(p => p.id === params.planId);
  if (!plan) {
    throw new Error('Selected membership plan does not exist.');
  }

  const memberships = loadCustomerMemberships();
  // Check if customer already has an active membership
  const existingActive = memberships.find(
    m => m.customerId === params.customerId && m.status === 'Active'
  );
  if (existingActive) {
    return {
      success: false,
      membership: existingActive,
      message: `Customer already has an active ${existingActive.planName} (valid until ${new Date(existingActive.expiryDate).toLocaleDateString()}). Please use Renewal or Upgrade instead.`
    };
  }

  const startDate = new Date().toISOString();
  const expiryDate = calculateExpiryDate(startDate, plan.validityValue, plan.validityUnit);
  const nextSeq = memberships.length + 1;
  const membershipNumber = `CORNER-${plan.tier.toUpperCase()}-${1000 + nextSeq}`;

  const newMembership: CustomerMembership = {
    id: `MEM-${new Date().getFullYear()}-${String(nextSeq).padStart(4, '0')}`,
    membershipNumber,
    customerId: params.customerId,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    customerEmail: params.customerEmail,
    planId: plan.id,
    planName: plan.name,
    tier: plan.tier,
    discountPercentage: plan.discountPercentage,
    loyaltyMultiplier: plan.loyaltyMultiplier,
    pricePaid: params.pricePaid,
    paymentMethod: params.paymentMethod,
    invoiceId: params.invoiceId,
    startDate,
    expiryDate,
    status: 'Active',
    renewalCount: 0,
    assignedBy: params.assignedBy,
    branchName: params.branchName || 'Main Branch',
    notes: params.notes,
    createdAt: startDate,
    updatedAt: startDate
  };

  memberships.unshift(newMembership);
  saveCustomerMemberships(memberships);

  // FR-MEM-010: Notify customer of enrollment
  sendMembershipNotification({
    membershipId: newMembership.id,
    customerId: newMembership.customerId,
    customerPhone: newMembership.customerPhone,
    type: 'ENROLLMENT',
    channel: 'WhatsApp',
    message: `Congratulations ${newMembership.customerName}! Your ${plan.name} is now ACTIVE (Card: ${membershipNumber}). Enjoy ${plan.discountPercentage}% off your bills and ${plan.loyaltyMultiplier}x rewards until ${new Date(expiryDate).toLocaleDateString()}!`
  });

  return {
    success: true,
    membership: newMembership,
    message: `Successfully enrolled ${newMembership.customerName} into ${plan.name}!`
  };
}

/**
 * FR-MEM-008: Renew membership
 */
export function renewMembership(params: {
  membershipId: string;
  priceCharged: number;
  paymentMethod: string;
  renewedBy: string;
  invoiceId?: string;
  notes?: string;
}): { success: boolean; membership: CustomerMembership; message: string } {
  const memberships = loadCustomerMemberships();
  const idx = memberships.findIndex(m => m.id === params.membershipId);
  if (idx === -1) {
    throw new Error('Membership record not found.');
  }

  const membership = memberships[idx];
  const plans = loadMembershipPlans();
  const plan = plans.find(p => p.id === membership.planId) || plans[0];

  const now = new Date();
  const currentExpiry = new Date(membership.expiryDate);
  // If not yet expired, add onto current expiry; if expired, start from today
  const baseStart = currentExpiry > now ? membership.expiryDate : now.toISOString();
  const newExpiryDate = calculateExpiryDate(baseStart, plan.validityValue, plan.validityUnit);

  membership.renewalCount += 1;
  membership.lastRenewedAt = new Date().toISOString();
  membership.expiryDate = newExpiryDate;
  membership.status = 'Active';
  membership.updatedAt = new Date().toISOString();

  memberships[idx] = membership;
  saveCustomerMemberships(memberships);

  // Record Renewal Log
  const renewals = loadMembershipRenewals();
  renewals.unshift({
    id: `RNW-${Date.now()}`,
    membershipId: membership.id,
    customerId: membership.customerId,
    customerName: membership.customerName,
    previousExpiryDate: currentExpiry.toISOString(),
    newExpiryDate,
    renewedPeriod: `${plan.validityValue} ${plan.validityUnit}`,
    priceCharged: params.priceCharged,
    paymentMethod: params.paymentMethod,
    invoiceId: params.invoiceId,
    renewedBy: params.renewedBy,
    renewedAt: new Date().toISOString()
  });
  saveMembershipRenewals(renewals);

  // Send Notification
  sendMembershipNotification({
    membershipId: membership.id,
    customerId: membership.customerId,
    customerPhone: membership.customerPhone,
    type: 'ENROLLMENT',
    channel: 'SMS',
    message: `Thank you for renewing, ${membership.customerName}! Your ${membership.planName} has been extended to ${new Date(newExpiryDate).toLocaleDateString()}.`
  });

  return {
    success: true,
    membership,
    message: `Membership successfully renewed until ${new Date(newExpiryDate).toLocaleDateString()}!`
  };
}

/**
 * FR-MEM-009: Cancel membership with authorized user and reason
 */
export function cancelMembership(params: {
  membershipId: string;
  cancelledBy: string;
  reason: string;
}): { success: boolean; membership: CustomerMembership; message: string } {
  const memberships = loadCustomerMemberships();
  const idx = memberships.findIndex(m => m.id === params.membershipId);
  if (idx === -1) {
    throw new Error('Membership not found.');
  }

  const membership = memberships[idx];
  membership.status = 'Cancelled';
  membership.cancelledAt = new Date().toISOString();
  membership.cancellationReason = params.reason;
  membership.updatedAt = new Date().toISOString();

  memberships[idx] = membership;
  saveCustomerMemberships(memberships);

  // Send Notification
  sendMembershipNotification({
    membershipId: membership.id,
    customerId: membership.customerId,
    customerPhone: membership.customerPhone,
    type: 'CANCELLED',
    channel: 'SMS',
    message: `Your Corner Cafe membership (${membership.planName}) has been cancelled as requested. Reason: ${params.reason}. Thank you for being with us.`
  });

  return {
    success: true,
    membership,
    message: `Membership ${membership.membershipNumber} successfully cancelled.`
  };
}

/**
 * FR-MEM-007: Routine status check - auto expire past due memberships
 */
export function updateMembershipStatuses(): void {
  const memberships = loadCustomerMemberships();
  const now = new Date();
  let updated = false;

  for (const m of memberships) {
    if (m.status === 'Active') {
      const exp = new Date(m.expiryDate);
      if (exp < now) {
        m.status = 'Expired';
        m.updatedAt = now.toISOString();
        updated = true;
      }
    }
  }

  if (updated) {
    saveCustomerMemberships(memberships);
  }
}

/**
 * FR-MEM-010: Check and notify customers about upcoming renewals (within 30 days & 7 days)
 */
export function checkAndNotifyMembershipRenewals(): number {
  const memberships = loadCustomerMemberships();
  const now = Date.now();
  let alertCount = 0;

  for (const m of memberships) {
    if (m.status === 'Active') {
      const expTime = new Date(m.expiryDate).getTime();
      const diffDays = Math.ceil((expTime - now) / 86400000);

      if (diffDays === 30 || diffDays === 7 || diffDays === 1) {
        sendMembershipNotification({
          membershipId: m.id,
          customerId: m.customerId,
          customerPhone: m.customerPhone,
          type: diffDays <= 7 ? 'RENEWAL_REMINDER_7D' : 'RENEWAL_REMINDER_30D',
          channel: 'WhatsApp',
          message: `Friendly reminder from Corner Cafe: Your ${m.planName} will expire in ${diffDays} day(s) on ${new Date(m.expiryDate).toLocaleDateString()}. Renew now to retain your exclusive ${m.discountPercentage}% dining discount and VIP privileges!`
        });
        alertCount++;
      }
    }
  }

  return alertCount;
}

/**
 * Look up active membership for a customer (used in Billing & Order checkout!)
 */
export function getActiveMembershipForCustomer(customerId: string): CustomerMembership | null {
  const memberships = loadCustomerMemberships();
  const active = memberships.find(
    m => m.customerId === customerId && m.status === 'Active' && new Date(m.expiryDate) > new Date()
  );
  return active || null;
}

/**
 * FR-MEM-012: Generate consolidated membership metrics & reports
 */
export function getMembershipMetrics(): MembershipMetrics {
  const memberships = loadCustomerMemberships();
  const renewals = loadMembershipRenewals();

  let totalMembershipRevenue = memberships.reduce((sum, m) => sum + (m.pricePaid || 0), 0);
  totalMembershipRevenue += renewals.reduce((sum, r) => sum + (r.priceCharged || 0), 0);

  const activeMemberships = memberships.filter(m => m.status === 'Active').length;
  const expiredMemberships = memberships.filter(m => m.status === 'Expired').length;
  const cancelledMemberships = memberships.filter(m => m.status === 'Cancelled').length;

  const renewedTotal = memberships.filter(m => m.renewalCount > 0).length;
  const renewalRate = memberships.length > 0
    ? parseFloat(((renewedTotal / memberships.length) * 100).toFixed(1))
    : 0;

  const tierBreakdown: Record<MembershipTier, number> = {
    Silver: 0,
    Gold: 0,
    Platinum: 0,
    VIP: 0
  };

  memberships.forEach(m => {
    if (tierBreakdown[m.tier] !== undefined) {
      tierBreakdown[m.tier]++;
    }
  });

  return {
    totalMemberships: memberships.length,
    activeMemberships,
    expiredMemberships,
    cancelledMemberships,
    totalMembershipRevenue,
    renewalRate,
    tierBreakdown
  };
}

/**
 * Export membership roster to CSV
 */
export function exportMembershipsCSV(): string {
  const memberships = loadCustomerMemberships();
  const headers = ['Membership ID', 'Member Number', 'Customer Name', 'Phone', 'Plan', 'Tier', 'Discount %', 'Price Paid', 'Status', 'Start Date', 'Expiry Date', 'Renewals'];
  const rows = memberships.map(m => [
    m.id,
    m.membershipNumber,
    `"${m.customerName}"`,
    m.customerPhone,
    `"${m.planName}"`,
    m.tier,
    `${m.discountPercentage}%`,
    m.pricePaid,
    m.status,
    new Date(m.startDate).toLocaleDateString(),
    new Date(m.expiryDate).toLocaleDateString(),
    m.renewalCount
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
