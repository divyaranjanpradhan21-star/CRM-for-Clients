import { supabase } from './supabase';

// ─── TYPES & INTERFACES ───────────────────────────────────────────────────────

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type LoyaltyTransactionType =
  | 'Earned'
  | 'Redeemed'
  | 'Expired'
  | 'Reversed'
  | 'Manual Adjustment'
  | 'Welcome Bonus';

export interface TierRule {
  tier: LoyaltyTier;
  minLifetimeSpend: number;
  multiplier: number; // e.g. 1.0 for Bronze, 1.25 for Silver, 1.5 for Gold, 2.0 for Platinum
  benefitsSummary: string;
}

export interface LoyaltyProgram {
  id: string;
  orgId?: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  
  // Earning Rules (FR-LOY-004)
  spendPerPoint: number; // e.g., ₹10 spent = 1 point
  minSpendToEarn: number; // minimum bill amount to qualify
  welcomeBonusPoints: number; // awarded on account creation

  // Tier multipliers
  tiers: TierRule[];

  // Redemption Rules (FR-LOY-005, FR-LOY-006)
  valuePerPoint: number; // e.g., 1 point = ₹1.00
  minPointsToRedeem: number; // e.g., minimum 50 points to start redeeming
  maxRedemptionPercent: number; // maximum % of bill subtotal that can be paid with points (e.g., 50%)

  // Expiry Rules (FR-LOY-009)
  expiryDays: number; // e.g. 180 days (or 0 for never)

  createdAt: string;
  updatedAt: string;
}

export interface CustomerLoyaltyAccount {
  id: string; // e.g. "LOY-1002"
  customerId: string; // references CustomerProfile.id
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  currentPoints: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: LoyaltyTier;
  status: 'Active' | 'Frozen' | 'Closed';
  expiryDate?: string;
  joinedAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string; // e.g. "LTX-2024-001"
  accountId: string;
  customerId: string;
  customerName: string;
  type: LoyaltyTransactionType;
  points: number; // positive for earn/bonus/adjustment, negative for redeem/expired/reversed
  balanceAfter: number;
  referenceType: 'Order' | 'Invoice' | 'Refund' | 'Admin' | 'Welcome Bonus' | 'Expiry Batch';
  referenceId?: string;
  notes: string;
  performer?: string;
  branchName?: string;
  createdAt: string;
}

export interface LoyaltyAuditLog {
  id: string;
  accountId: string;
  customerId: string;
  action: 'MANUAL_ADJUSTMENT' | 'STATUS_CHANGE' | 'TIER_OVERRIDE' | 'RULE_CHANGE';
  performedBy: string;
  userRole: string;
  reason: string;
  previousPoints: number;
  newPoints: number;
  timestamp: string;
}

export interface LoyaltyNotification {
  id: string;
  customerId: string;
  customerPhone: string;
  type: 'POINTS_EARNED' | 'POINTS_REDEEMED' | 'EXPIRY_REMINDER' | 'TIER_UPGRADE' | 'WELCOME_BONUS';
  channel: 'SMS' | 'WhatsApp' | 'Email';
  message: string;
  sentAt: string;
  status: 'Delivered' | 'Pending';
}

export interface LoyaltyMetrics {
  totalMembers: number;
  activeMembers: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  totalPointsExpired: number;
  outstandingBalance: number; // total unredeemed points liability
  outstandingValueLiability: number; // in currency (points * valuePerPoint)
  redemptionRate: number; // %
  tierBreakdown: Record<LoyaltyTier, number>;
}

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────────

const PROGRAM_KEY = 'crm_loyalty_program_v1';
const ACCOUNTS_KEY = 'crm_loyalty_accounts_v1';
const TRANSACTIONS_KEY = 'crm_loyalty_transactions_v1';
const AUDIT_KEY = 'crm_loyalty_audit_v1';
const NOTIFICATIONS_KEY = 'crm_loyalty_notifications_v1';

// ─── DEFAULT CONFIGURATION & SEED DATA ────────────────────────────────────────

export const DEFAULT_LOYALTY_PROGRAM: LoyaltyProgram = {
  id: 'lp-corner-cafe-default',
  name: "Corner Cafe & Lounge Rewards Club",
  description: "Dine, sip, and earn reward points on every meal with escalating tier multipliers and member privileges.",
  status: 'Active',
  spendPerPoint: 10, // ₹10 = 1 point (10% back at ₹1/pt, or 5% back at ₹0.50)
  minSpendToEarn: 100, // minimum ₹100 order
  welcomeBonusPoints: 50, // 50 points welcome gift
  tiers: [
    { tier: 'Bronze', minLifetimeSpend: 0, multiplier: 1.0, benefitsSummary: 'Standard 1x points on dining & takeaway' },
    { tier: 'Silver', minLifetimeSpend: 5000, multiplier: 1.25, benefitsSummary: '1.25x points + Free table reservation priority' },
    { tier: 'Gold', minLifetimeSpend: 15000, multiplier: 1.5, benefitsSummary: '1.5x points + Complimentary beverage on birthdays' },
    { tier: 'Platinum', minLifetimeSpend: 30000, multiplier: 2.0, benefitsSummary: '2.0x points + VIP seating + Chef tasting invites' },
  ],
  valuePerPoint: 1.0, // 1 point = ₹1.00
  minPointsToRedeem: 50, // min 50 points
  maxRedemptionPercent: 50, // max 50% of invoice subtotal
  expiryDays: 180, // points valid for 6 months
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString()
};

const SEED_ACCOUNTS: CustomerLoyaltyAccount[] = [
  {
    id: 'LOY-1001',
    customerId: 'CUST-10491',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98201 12345',
    customerEmail: 'aarav.sharma@example.com',
    currentPoints: 480,
    lifetimeEarned: 1250,
    lifetimeRedeemed: 770,
    tier: 'Gold',
    status: 'Active',
    expiryDate: new Date(Date.now() + 150 * 86400000).toISOString(),
    joinedAt: '2024-02-10T11:20:00.000Z',
    updatedAt: '2024-11-20T14:30:00.000Z'
  },
  {
    id: 'LOY-1002',
    customerId: 'CUST-10492',
    customerName: 'Priya Patel',
    customerPhone: '+91 98202 23456',
    customerEmail: 'priya.patel@example.com',
    currentPoints: 920,
    lifetimeEarned: 2400,
    lifetimeRedeemed: 1480,
    tier: 'Platinum',
    status: 'Active',
    expiryDate: new Date(Date.now() + 120 * 86400000).toISOString(),
    joinedAt: '2024-01-15T09:40:00.000Z',
    updatedAt: '2024-11-25T19:15:00.000Z'
  },
  {
    id: 'LOY-1003',
    customerId: 'CUST-10493',
    customerName: 'Rohan Mehra',
    customerPhone: '+91 98203 34567',
    customerEmail: 'rohan.mehra@example.com',
    currentPoints: 120,
    lifetimeEarned: 350,
    lifetimeRedeemed: 230,
    tier: 'Silver',
    status: 'Active',
    expiryDate: new Date(Date.now() + 90 * 86400000).toISOString(),
    joinedAt: '2024-03-22T17:10:00.000Z',
    updatedAt: '2024-11-18T12:00:00.000Z'
  },
  {
    id: 'LOY-1004',
    customerId: 'CUST-10494',
    customerName: 'Neha Verma',
    customerPhone: '+91 98204 45678',
    customerEmail: 'neha.verma@example.com',
    currentPoints: 60,
    lifetimeEarned: 110,
    lifetimeRedeemed: 50,
    tier: 'Bronze',
    status: 'Active',
    expiryDate: new Date(Date.now() + 170 * 86400000).toISOString(),
    joinedAt: '2024-04-05T13:45:00.000Z',
    updatedAt: '2024-11-10T16:20:00.000Z'
  }
];

const SEED_TRANSACTIONS: LoyaltyTransaction[] = [
  {
    id: 'LTX-2024-001',
    accountId: 'LOY-1001',
    customerId: 'CUST-10491',
    customerName: 'Aarav Sharma',
    type: 'Earned',
    points: 85,
    balanceAfter: 480,
    referenceType: 'Order',
    referenceId: 'ORD-2024-001',
    notes: 'Points earned on Dine-in purchase of ₹850 (Gold tier 1.5x multiplier)',
    branchName: 'Main Branch',
    performer: 'POS System',
    createdAt: '2024-11-20T14:30:00.000Z'
  },
  {
    id: 'LTX-2024-002',
    accountId: 'LOY-1002',
    customerId: 'CUST-10492',
    customerName: 'Priya Patel',
    type: 'Redeemed',
    points: -250,
    balanceAfter: 920,
    referenceType: 'Invoice',
    referenceId: 'INV-2024-0002',
    notes: 'Redeemed 250 points for ₹250 instant discount on bill',
    branchName: 'City Center',
    performer: 'Cashier 02',
    createdAt: '2024-11-25T19:15:00.000Z'
  },
  {
    id: 'LTX-2024-003',
    accountId: 'LOY-1003',
    customerId: 'CUST-10493',
    customerName: 'Rohan Mehra',
    type: 'Earned',
    points: 40,
    balanceAfter: 120,
    referenceType: 'Order',
    referenceId: 'ORD-2024-003',
    notes: 'Points earned on Takeaway order ₹400',
    branchName: 'Airport Road',
    performer: 'POS System',
    createdAt: '2024-11-18T12:00:00.000Z'
  },
  {
    id: 'LTX-2024-004',
    accountId: 'LOY-1004',
    customerId: 'CUST-10494',
    customerName: 'Neha Verma',
    type: 'Welcome Bonus',
    points: 50,
    balanceAfter: 50,
    referenceType: 'Welcome Bonus',
    notes: 'Welcome reward points for joining Corner Cafe Club',
    branchName: 'Main Branch',
    performer: 'System',
    createdAt: '2024-04-05T13:45:00.000Z'
  }
];

// ─── STORAGE ACCESSORS ────────────────────────────────────────────────────────

export function loadLoyaltyProgram(): LoyaltyProgram {
  try {
    const raw = localStorage.getItem(PROGRAM_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(PROGRAM_KEY, JSON.stringify(DEFAULT_LOYALTY_PROGRAM));
  return DEFAULT_LOYALTY_PROGRAM;
}

export function saveLoyaltyProgram(program: LoyaltyProgram): void {
  program.updatedAt = new Date().toISOString();
  localStorage.setItem(PROGRAM_KEY, JSON.stringify(program));
  // Background sync to Supabase (non-blocking)
  try {
    supabase.from('crm_loyalty_programs').upsert({
      id: program.id,
      name: program.name,
      description: program.description,
      status: program.status,
      config: program,
      updated_at: program.updatedAt
    }).then();
  } catch {}
}

export function loadLoyaltyAccounts(): CustomerLoyaltyAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(SEED_ACCOUNTS));
  return SEED_ACCOUNTS;
}

export function saveLoyaltyAccounts(accounts: CustomerLoyaltyAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadLoyaltyTransactions(): LoyaltyTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(SEED_TRANSACTIONS));
  return SEED_TRANSACTIONS;
}

export function saveLoyaltyTransactions(txns: LoyaltyTransaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txns));
}

export function loadLoyaltyAuditLogs(): LoyaltyAuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveLoyaltyAuditLogs(logs: LoyaltyAuditLog[]): void {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
}

export function loadLoyaltyNotifications(): LoyaltyNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveLoyaltyNotifications(notifs: LoyaltyNotification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
}

// ─── CORE WORKFLOW FUNCTIONS ──────────────────────────────────────────────────

/**
 * FR-LOY-002: Automatically assign or fetch loyalty account for customer
 */
export function getOrCreateLoyaltyAccount(
  customerId: string,
  customerName: string,
  customerPhone: string,
  customerEmail?: string
): CustomerLoyaltyAccount {
  const accounts = loadLoyaltyAccounts();
  let acc = accounts.find(a => a.customerId === customerId || a.customerPhone === customerPhone);

  if (!acc) {
    const program = loadLoyaltyProgram();
    const newId = `LOY-${1000 + accounts.length + 1}`;
    const initialPoints = program.status === 'Active' ? program.welcomeBonusPoints : 0;
    const expiryDate = program.expiryDays > 0
      ? new Date(Date.now() + program.expiryDays * 86400000).toISOString()
      : undefined;

    acc = {
      id: newId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      currentPoints: initialPoints,
      lifetimeEarned: initialPoints,
      lifetimeRedeemed: 0,
      tier: 'Bronze',
      status: 'Active',
      expiryDate,
      joinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    accounts.unshift(acc);
    saveLoyaltyAccounts(accounts);

    // If welcome bonus was given, record transaction & notify
    if (initialPoints > 0) {
      recordLoyaltyTransaction({
        accountId: acc.id,
        customerId: acc.customerId,
        customerName: acc.customerName,
        type: 'Welcome Bonus',
        points: initialPoints,
        balanceAfter: initialPoints,
        referenceType: 'Welcome Bonus',
        notes: `Awarded ${initialPoints} welcome reward points upon loyalty enrollment.`
      });

      sendLoyaltyNotification({
        customerId: acc.customerId,
        customerPhone: acc.customerPhone,
        type: 'WELCOME_BONUS',
        channel: 'SMS',
        message: `Welcome to Corner Cafe Rewards, ${acc.customerName}! You've received ${initialPoints} bonus points ready to redeem on your next visit.`
      });
    }
  }

  return acc;
}

/**
 * Helper to record a transaction and sync to storage
 */
function recordLoyaltyTransaction(data: Omit<LoyaltyTransaction, 'id' | 'createdAt'>): LoyaltyTransaction {
  const txns = loadLoyaltyTransactions();
  const newTxn: LoyaltyTransaction = {
    ...data,
    id: `LTX-${new Date().getFullYear()}-${String(txns.length + 1).padStart(4, '0')}`,
    createdAt: new Date().toISOString()
  };
  txns.unshift(newTxn);
  saveLoyaltyTransactions(txns);
  return newTxn;
}

/**
 * Helper to log and record simulated customer notifications (FR-LOY-012, FR-LOY-013)
 */
export function sendLoyaltyNotification(
  notif: Omit<LoyaltyNotification, 'id' | 'sentAt' | 'status'>
): LoyaltyNotification {
  const notifs = loadLoyaltyNotifications();
  const record: LoyaltyNotification = {
    ...notif,
    id: `LNOT-${Date.now()}`,
    sentAt: new Date().toISOString(),
    status: 'Delivered'
  };
  notifs.unshift(record);
  saveLoyaltyNotifications(notifs);
  return record;
}

/**
 * Calculate Tier based on lifetime spend
 */
export function calculateTierForSpend(lifetimeSpend: number, program: LoyaltyProgram): LoyaltyTier {
  const sorted = [...program.tiers].sort((a, b) => b.minLifetimeSpend - a.minLifetimeSpend);
  for (const t of sorted) {
    if (lifetimeSpend >= t.minLifetimeSpend) {
      return t.tier;
    }
  }
  return 'Bronze';
}

/**
 * FR-LOY-003 & FR-LOY-004: Automatically award loyalty points for qualifying customer purchases
 */
export function awardLoyaltyPointsForPurchase(params: {
  orderId?: string;
  invoiceId?: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  amountSpent: number;
  branchName?: string;
  membershipMultiplierBonus?: number; // integrated with Membership module!
  performer?: string;
}): { pointsEarned: number; newBalance: number; account: CustomerLoyaltyAccount } | null {
  const program = loadLoyaltyProgram();
  if (program.status !== 'Active') return null;

  // Check minimum spend requirement
  if (params.amountSpent < program.minSpendToEarn) {
    return null;
  }

  // Prevent duplicate awards for the same order/invoice
  const txns = loadLoyaltyTransactions();
  const existingAward = txns.find(
    t => t.type === 'Earned' &&
    ((params.orderId && t.referenceId === params.orderId) ||
     (params.invoiceId && t.referenceId === params.invoiceId))
  );
  if (existingAward) {
    const acc = getOrCreateLoyaltyAccount(params.customerId, params.customerName, params.customerPhone, params.customerEmail);
    return { pointsEarned: 0, newBalance: acc.currentPoints, account: acc };
  }

  const account = getOrCreateLoyaltyAccount(
    params.customerId,
    params.customerName,
    params.customerPhone,
    params.customerEmail
  );

  // Determine tier multiplier
  const tierConfig = program.tiers.find(t => t.tier === account.tier) || program.tiers[0];
  const baseMultiplier = tierConfig.multiplier || 1.0;
  const membershipBonus = params.membershipMultiplierBonus || 1.0;
  const totalMultiplier = baseMultiplier * membershipBonus;

  // Base points = amountSpent / spendPerPoint
  const rawPoints = Math.floor(params.amountSpent / program.spendPerPoint);
  const pointsEarned = Math.round(rawPoints * totalMultiplier);

  if (pointsEarned <= 0) return null;

  // Update account balance
  const accounts = loadLoyaltyAccounts();
  const idx = accounts.findIndex(a => a.id === account.id);
  const newBalance = account.currentPoints + pointsEarned;
  const newLifetime = account.lifetimeEarned + pointsEarned;

  account.currentPoints = newBalance;
  account.lifetimeEarned = newLifetime;
  account.updatedAt = new Date().toISOString();
  // Extend expiry if rule configured
  if (program.expiryDays > 0) {
    account.expiryDate = new Date(Date.now() + program.expiryDays * 86400000).toISOString();
  }

  if (idx !== -1) accounts[idx] = account;
  else accounts.unshift(account);
  saveLoyaltyAccounts(accounts);

  // Record Transaction (FR-LOY-008)
  const refId = params.orderNumber || params.orderId || params.invoiceId || 'Purchase';
  recordLoyaltyTransaction({
    accountId: account.id,
    customerId: account.customerId,
    customerName: account.customerName,
    type: 'Earned',
    points: pointsEarned,
    balanceAfter: newBalance,
    referenceType: 'Order',
    referenceId: refId,
    notes: `Earned ${pointsEarned} points on spend of ₹${params.amountSpent} (${account.tier} tier ${totalMultiplier.toFixed(2)}x rate)`,
    branchName: params.branchName,
    performer: params.performer || 'POS System'
  });

  // FR-LOY-012: Notify customer
  sendLoyaltyNotification({
    customerId: account.customerId,
    customerPhone: account.customerPhone,
    type: 'POINTS_EARNED',
    channel: 'SMS',
    message: `Dear ${account.customerName}, you've earned ${pointsEarned} loyalty points at Corner Cafe on your bill of ₹${params.amountSpent}! Your total points balance is now ${newBalance}.`
  });

  return { pointsEarned, newBalance, account };
}

/**
 * FR-LOY-005 & FR-LOY-006: Securely redeem loyalty points during checkout
 */
export function redeemLoyaltyPointsForInvoice(params: {
  invoiceId: string;
  customerId: string;
  pointsToRedeem: number;
  billSubtotal: number;
  performer?: string;
  branchName?: string;
}): { success: boolean; discountAmount: number; remainingPoints: number; message: string } {
  const program = loadLoyaltyProgram();
  const accounts = loadLoyaltyAccounts();
  const account = accounts.find(a => a.customerId === params.customerId);

  if (!account) {
    return { success: false, discountAmount: 0, remainingPoints: 0, message: 'Loyalty account not found for this customer.' };
  }

  if (account.status !== 'Active') {
    return { success: false, discountAmount: 0, remainingPoints: account.currentPoints, message: `Loyalty account is currently ${account.status}.` };
  }

  if (params.pointsToRedeem < program.minPointsToRedeem) {
    return {
      success: false,
      discountAmount: 0,
      remainingPoints: account.currentPoints,
      message: `Minimum ${program.minPointsToRedeem} points required to redeem.`
    };
  }

  if (account.currentPoints < params.pointsToRedeem) {
    return {
      success: false,
      discountAmount: 0,
      remainingPoints: account.currentPoints,
      message: `Insufficient points balance. Available: ${account.currentPoints}`
    };
  }

  // Maximum allowed discount based on maxRedemptionPercent
  const maxDiscountAllowed = (params.billSubtotal * program.maxRedemptionPercent) / 100;
  const requestedDiscount = params.pointsToRedeem * program.valuePerPoint;

  if (requestedDiscount > maxDiscountAllowed) {
    const maxPoints = Math.floor(maxDiscountAllowed / program.valuePerPoint);
    return {
      success: false,
      discountAmount: 0,
      remainingPoints: account.currentPoints,
      message: `Points redemption exceeds maximum allowed (${program.maxRedemptionPercent}% of bill = ₹${maxDiscountAllowed}). Maximum redeemable points: ${maxPoints}.`
    };
  }

  // Apply redemption
  account.currentPoints -= params.pointsToRedeem;
  account.lifetimeRedeemed += params.pointsToRedeem;
  account.updatedAt = new Date().toISOString();
  saveLoyaltyAccounts(accounts);

  // Record Transaction (FR-LOY-008)
  recordLoyaltyTransaction({
    accountId: account.id,
    customerId: account.customerId,
    customerName: account.customerName,
    type: 'Redeemed',
    points: -params.pointsToRedeem,
    balanceAfter: account.currentPoints,
    referenceType: 'Invoice',
    referenceId: params.invoiceId,
    notes: `Redeemed ${params.pointsToRedeem} points for ₹${requestedDiscount.toFixed(2)} instant discount on invoice ${params.invoiceId}`,
    branchName: params.branchName,
    performer: params.performer || 'Cashier'
  });

  // Notify customer
  sendLoyaltyNotification({
    customerId: account.customerId,
    customerPhone: account.customerPhone,
    type: 'POINTS_REDEEMED',
    channel: 'SMS',
    message: `Dear ${account.customerName}, ${params.pointsToRedeem} points (value ₹${requestedDiscount}) were redeemed on your Corner Cafe bill. Remaining balance: ${account.currentPoints}.`
  });

  return {
    success: true,
    discountAmount: requestedDiscount,
    remainingPoints: account.currentPoints,
    message: `Successfully redeemed ${params.pointsToRedeem} points for ₹${requestedDiscount.toFixed(2)} discount!`
  };
}

/**
 * FR-LOY-010: Automatically reverse earned points for refunds and cancelled orders
 */
export function reverseLoyaltyPointsForRefund(params: {
  referenceId: string; // Order or Invoice ID
  customerId: string;
  refundAmount: number;
  reason: string;
  performer: string;
}): { success: boolean; pointsReversed: number; newBalance: number } {
  const txns = loadLoyaltyTransactions();
  // Find original earn transaction
  const earnTxn = txns.find(
    t => t.type === 'Earned' && (t.referenceId === params.referenceId || t.customerId === params.customerId)
  );

  const program = loadLoyaltyProgram();
  const accounts = loadLoyaltyAccounts();
  const account = accounts.find(a => a.customerId === params.customerId);

  if (!account) return { success: false, pointsReversed: 0, newBalance: 0 };

  // Calculate points to reverse based on refund amount or full original earn
  let pointsToReverse = earnTxn ? earnTxn.points : Math.floor(params.refundAmount / program.spendPerPoint);
  if (pointsToReverse <= 0) pointsToReverse = 10; // minimal sanity check

  // Deduct from current balance (can go to 0 minimum)
  const actualReversed = Math.min(account.currentPoints, pointsToReverse);
  account.currentPoints = Math.max(0, account.currentPoints - actualReversed);
  account.updatedAt = new Date().toISOString();
  saveLoyaltyAccounts(accounts);

  // Record reversal transaction
  recordLoyaltyTransaction({
    accountId: account.id,
    customerId: account.customerId,
    customerName: account.customerName,
    type: 'Reversed',
    points: -actualReversed,
    balanceAfter: account.currentPoints,
    referenceType: 'Refund',
    referenceId: params.referenceId,
    notes: `Points reversed due to refund (${params.reason}) on order/invoice ${params.referenceId}`,
    performer: params.performer
  });

  return { success: true, pointsReversed: actualReversed, newBalance: account.currentPoints };
}

/**
 * FR-LOY-011: Prevent unauthorized manual adjustments. Require permissions and log audit record.
 */
export function adjustLoyaltyPointsManual(params: {
  accountId: string;
  pointsDelta: number; // positive or negative
  reason: string;
  performer: string;
  userRole: string; // must be SUPER_ADMIN or RESTAURANT_ADMIN
}): { success: boolean; message: string; newBalance: number } {
  // Permission guard
  const allowedRoles = ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'ADMIN'];
  if (!allowedRoles.includes(params.userRole?.toUpperCase())) {
    return {
      success: false,
      message: 'Unauthorized: Manual points adjustment requires Restaurant Administrator or Super Admin permissions.',
      newBalance: 0
    };
  }

  if (!params.reason || params.reason.trim().length < 5) {
    return {
      success: false,
      message: 'A detailed justification reason (min 5 characters) is required for manual points adjustment.',
      newBalance: 0
    };
  }

  const accounts = loadLoyaltyAccounts();
  const account = accounts.find(a => a.id === params.accountId);
  if (!account) {
    return { success: false, message: 'Loyalty account not found.', newBalance: 0 };
  }

  const previousPoints = account.currentPoints;
  const newBalance = Math.max(0, previousPoints + params.pointsDelta);

  account.currentPoints = newBalance;
  if (params.pointsDelta > 0) {
    account.lifetimeEarned += params.pointsDelta;
  }
  account.updatedAt = new Date().toISOString();
  saveLoyaltyAccounts(accounts);

  // Record Transaction
  recordLoyaltyTransaction({
    accountId: account.id,
    customerId: account.customerId,
    customerName: account.customerName,
    type: 'Manual Adjustment',
    points: params.pointsDelta,
    balanceAfter: newBalance,
    referenceType: 'Admin',
    notes: `Manual adjustment by ${params.performer} (${params.userRole}): ${params.reason}`,
    performer: params.performer
  });

  // Log to Audit table
  const auditLogs = loadLoyaltyAuditLogs();
  auditLogs.unshift({
    id: `LAUD-${Date.now()}`,
    accountId: account.id,
    customerId: account.customerId,
    action: 'MANUAL_ADJUSTMENT',
    performedBy: params.performer,
    userRole: params.userRole,
    reason: params.reason,
    previousPoints,
    newPoints: newBalance,
    timestamp: new Date().toISOString()
  });
  saveLoyaltyAuditLogs(auditLogs);

  return {
    success: true,
    message: `Successfully adjusted balance by ${params.pointsDelta > 0 ? '+' : ''}${params.pointsDelta} points. New balance: ${newBalance}.`,
    newBalance
  };
}

/**
 * FR-LOY-013: Scan accounts and send reminders for points expiring soon (within 30 days)
 */
export function checkAndNotifyExpiringPoints(): number {
  const accounts = loadLoyaltyAccounts();
  const now = Date.now();
  const thirtyDays = 30 * 86400000;
  let notifiedCount = 0;

  for (const acc of accounts) {
    if (acc.currentPoints > 0 && acc.expiryDate) {
      const expTime = new Date(acc.expiryDate).getTime();
      const timeLeft = expTime - now;
      if (timeLeft > 0 && timeLeft <= thirtyDays) {
        const daysLeft = Math.ceil(timeLeft / 86400000);
        sendLoyaltyNotification({
          customerId: acc.customerId,
          customerPhone: acc.customerPhone,
          type: 'EXPIRY_REMINDER',
          channel: 'WhatsApp',
          message: `Notice from Corner Cafe: You have ${acc.currentPoints} reward points expiring in ${daysLeft} days! Visit us or order online before ${new Date(acc.expiryDate).toLocaleDateString()} to redeem them.`
        });
        notifiedCount++;
      }
    }
  }

  return notifiedCount;
}

/**
 * FR-LOY-014: Generate consolidated loyalty reports and program performance metrics
 */
export function getLoyaltyMetrics(): LoyaltyMetrics {
  const accounts = loadLoyaltyAccounts();
  const txns = loadLoyaltyTransactions();
  const program = loadLoyaltyProgram();

  let totalPointsEarned = 0;
  let totalPointsRedeemed = 0;
  let totalPointsExpired = 0;

  txns.forEach(t => {
    if (t.type === 'Earned' || t.type === 'Welcome Bonus') {
      totalPointsEarned += t.points;
    } else if (t.type === 'Redeemed') {
      totalPointsRedeemed += Math.abs(t.points);
    } else if (t.type === 'Expired') {
      totalPointsExpired += Math.abs(t.points);
    }
  });

  const totalMembers = accounts.length;
  const activeMembers = accounts.filter(a => a.status === 'Active' && a.currentPoints > 0).length;
  const outstandingBalance = accounts.reduce((acc, a) => acc + a.currentPoints, 0);
  const outstandingValueLiability = outstandingBalance * program.valuePerPoint;

  const redemptionRate = totalPointsEarned > 0
    ? parseFloat(((totalPointsRedeemed / totalPointsEarned) * 100).toFixed(1))
    : 0;

  const tierBreakdown: Record<LoyaltyTier, number> = {
    Bronze: 0,
    Silver: 0,
    Gold: 0,
    Platinum: 0
  };

  accounts.forEach(a => {
    if (tierBreakdown[a.tier] !== undefined) {
      tierBreakdown[a.tier]++;
    }
  });

  return {
    totalMembers,
    activeMembers,
    totalPointsEarned,
    totalPointsRedeemed,
    totalPointsExpired,
    outstandingBalance,
    outstandingValueLiability,
    redemptionRate,
    tierBreakdown
  };
}

/**
 * Export transactions to CSV
 */
export function exportLoyaltyTransactionsCSV(): string {
  const txns = loadLoyaltyTransactions();
  const headers = ['Transaction ID', 'Account ID', 'Customer Name', 'Type', 'Points', 'Balance After', 'Reference Type', 'Reference ID', 'Branch', 'Performer', 'Date'];
  const rows = txns.map(t => [
    t.id,
    t.accountId,
    `"${t.customerName}"`,
    t.type,
    t.points,
    t.balanceAfter,
    t.referenceType,
    t.referenceId || '',
    t.branchName || 'Main',
    `"${t.performer || ''}"`,
    new Date(t.createdAt).toLocaleDateString()
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
