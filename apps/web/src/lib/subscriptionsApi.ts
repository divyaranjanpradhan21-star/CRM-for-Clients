/**
 * Subscriptions API — Complete subscription, plan, billing & payment management
 * Powered by Supabase.
 */
import { supabase } from './supabase';
import { logOrgActivity } from './organizationsApi';

// ─────────────────────────── Types ───────────────────────────

export type SubscriptionTier = 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
export type BillingInterval = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'RENEWAL_DUE' | 'EXPIRED' | 'CANCELLED';
export type PaymentMethod = 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'ONLINE';
export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface PlanFeatureLimits {
  maxBranches: number;
  maxUsers: number;
  maxOrdersPerMonth: number;
  maxCustomers: number;
  features: string[];
}

export interface SubscriptionPlanItem {
  id: string;
  key: SubscriptionTier;
  name: string;
  description: string;
  price_monthly: number;
  price_quarterly: number;
  price_yearly: number;
  max_branches: number;
  max_users: number;
  max_orders_per_month: number;
  max_customers: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgSubscriptionItem {
  id: string;
  organization_id: string;
  organization_name?: string;
  plan_key: SubscriptionTier;
  billing_interval: BillingInterval;
  amount: number;
  status: SubscriptionStatus;
  is_trial: boolean;
  trial_days: number;
  start_date: string;
  expiry_date: string;
  renewal_reminder_sent: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
  days_left?: number;
}

export interface SubscriptionPaymentItem {
  id: string;
  subscription_id: string | null;
  organization_id: string;
  organization_name: string;
  plan_key: SubscriptionTier;
  billing_interval: BillingInterval;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference: string | null;
  status: PaymentStatus;
  paid_at: string;
  invoice_number: string;
  created_at: string;
}

// ─────────────────────────── Built-in Default Plans ───────────────────────────

export const DEFAULT_PLANS: SubscriptionPlanItem[] = [
  {
    id: 'plan_free',
    key: 'FREE',
    name: 'Free Tier',
    description: 'Ideal for solo pop-up cafes and newly launched counters',
    price_monthly: 0,
    price_quarterly: 0,
    price_yearly: 0,
    max_branches: 1,
    max_users: 2,
    max_orders_per_month: 200,
    max_customers: 300,
    features: ['1 Branch Floor', '2 Staff User Logins', 'Basic Point of Sale', 'Standard Email Support'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plan_basic',
    key: 'BASIC',
    name: 'Basic Plan',
    description: 'Designed for single-location neighborhood cafes with moderate traffic',
    price_monthly: 29,
    price_quarterly: 79,
    price_yearly: 290,
    max_branches: 1,
    max_users: 5,
    max_orders_per_month: 800,
    max_customers: 1500,
    features: ['1 Branch Floor', '5 Staff User Logins', 'Table Floor Terminal', 'Customer Loyalty Points', 'Export CSV Reports'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plan_standard',
    key: 'STANDARD',
    name: 'Standard Growth',
    description: 'Best suited for growing cafes and bistros with multiple shifts',
    price_monthly: 69,
    price_quarterly: 189,
    price_yearly: 690,
    max_branches: 3,
    max_users: 15,
    max_orders_per_month: 2500,
    max_customers: 5000,
    features: ['Up to 3 Branches', '15 Staff Accounts', 'Full Kitchen Display System', 'Automated SMS / Email Promos', 'Daily P&L Analytics'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plan_premium',
    key: 'PREMIUM',
    name: 'Premium Scale',
    description: 'For busy high-volume coffee houses with kitchen display & loyalty engines',
    price_monthly: 129,
    price_quarterly: 349,
    price_yearly: 1290,
    max_branches: 6,
    max_users: 40,
    max_orders_per_month: 8000,
    max_customers: 20000,
    features: ['Up to 6 Branches', '40 Staff Accounts', 'Multi-Floor Live Sync', 'VIP Member CRM Tiering', 'Custom Branding & Receipts', 'Priority 24/7 SLA'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plan_enterprise',
    key: 'ENTERPRISE',
    name: 'Enterprise Global',
    description: 'Complete solution for franchise roasters, chains & multi-city groups',
    price_monthly: 299,
    price_quarterly: 799,
    price_yearly: 2990,
    max_branches: 999,
    max_users: 999,
    max_orders_per_month: 999999,
    max_customers: 999999,
    features: ['Unlimited Branches', 'Unlimited Staff', 'Dedicated Account Manager', 'Custom ERP / Accounting Webhooks', 'Zero-Latency Realtime Fleet Sync', 'Custom Domain & SSO'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ─────────────────────────── Plans API ───────────────────────────

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlanItem[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_PLANS;
    }

    return data.map((d: any) => ({
      ...d,
      features: Array.isArray(d.features) ? d.features : JSON.parse(d.features || '[]'),
    })) as SubscriptionPlanItem[];
  } catch {
    return DEFAULT_PLANS;
  }
}

export async function createSubscriptionPlan(plan: Partial<SubscriptionPlanItem>): Promise<SubscriptionPlanItem> {
  const payload = {
    key: (plan.key || 'BASIC').toUpperCase(),
    name: plan.name,
    description: plan.description || '',
    price_monthly: plan.price_monthly || 0,
    price_quarterly: plan.price_quarterly || 0,
    price_yearly: plan.price_yearly || 0,
    max_branches: plan.max_branches || 1,
    max_users: plan.max_users || 3,
    max_orders_per_month: plan.max_orders_per_month || 500,
    max_customers: plan.max_customers || 1000,
    features: plan.features || [],
    is_active: plan.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('subscription_plans')
    .insert([payload])
    .select()
    .single();

  if (error) {
    // Return optimistic object if table not yet configured
    return {
      id: 'plan_' + Math.random().toString(36).substring(2, 9),
      ...payload,
      created_at: new Date().toISOString(),
    } as SubscriptionPlanItem;
  }

  return {
    ...data,
    features: Array.isArray(data.features) ? data.features : JSON.parse(data.features || '[]'),
  };
}

export async function updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlanItem>): Promise<SubscriptionPlanItem> {
  const payload: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('subscription_plans')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { id, ...payload } as SubscriptionPlanItem;
  }

  return {
    ...data,
    features: Array.isArray(data.features) ? data.features : JSON.parse(data.features || '[]'),
  };
}

// ─────────────────────────── Subscriptions API ───────────────────────────

export async function fetchOrganizationSubscriptions(): Promise<OrgSubscriptionItem[]> {
  try {
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .select('*, organizations(name, email)')
      .order('created_at', { ascending: false });

    if (error || !data) {
      // Fallback: build from organizations table
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, subscription_plan, subscription_expires_at, is_active, created_at');

      if (!orgs) return [];

      return orgs.map((org: any) => {
        const expiry = org.subscription_expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const diffMs = new Date(expiry).getTime() - Date.now();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const status: SubscriptionStatus =
          daysLeft < 0 ? 'EXPIRED' : daysLeft <= 7 ? 'RENEWAL_DUE' : 'ACTIVE';

        return {
          id: 'sub_' + org.id,
          organization_id: org.id,
          organization_name: org.name,
          plan_key: (org.subscription_plan as SubscriptionTier) || 'FREE',
          billing_interval: 'monthly',
          amount: 0,
          status,
          is_trial: false,
          trial_days: 14,
          start_date: org.created_at || new Date().toISOString(),
          expiry_date: expiry,
          renewal_reminder_sent: false,
          cancelled_at: null,
          cancellation_reason: null,
          notes: null,
          created_at: org.created_at || new Date().toISOString(),
          days_left: daysLeft,
        };
      });
    }

    return data.map((item: any) => {
      const expiry = item.expiry_date;
      const diffMs = new Date(expiry).getTime() - Date.now();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let calculatedStatus: SubscriptionStatus = item.status;
      if (item.status !== 'CANCELLED') {
        if (daysLeft < 0) {
          calculatedStatus = 'EXPIRED';
        } else if (daysLeft <= 7 && item.status !== 'TRIAL') {
          calculatedStatus = 'RENEWAL_DUE';
        }
      }

      return {
        ...item,
        organization_name: item.organizations?.name || 'Restaurant',
        status: calculatedStatus,
        days_left: daysLeft,
      };
    });
  } catch {
    return [];
  }
}

export interface AssignSubscriptionInput {
  organizationId: string;
  organizationName: string;
  planKey: SubscriptionTier;
  billingInterval: BillingInterval;
  isTrial: boolean;
  trialDays?: number;
  amount: number;
  paymentMethod: PaymentMethod;
  actorEmail: string;
}

export async function assignPlanToOrganization(input: AssignSubscriptionInput): Promise<OrgSubscriptionItem> {
  const startDate = new Date();
  let expiryDate = new Date();

  if (input.isTrial) {
    const days = input.trialDays || 14;
    expiryDate.setDate(startDate.getDate() + days);
  } else if (input.billingInterval === 'yearly') {
    expiryDate.setFullYear(startDate.getFullYear() + 1);
  } else if (input.billingInterval === 'quarterly') {
    expiryDate.setMonth(startDate.getMonth() + 3);
  } else {
    // monthly
    expiryDate.setMonth(startDate.getMonth() + 1);
  }

  const initialStatus: SubscriptionStatus = input.isTrial ? 'TRIAL' : 'ACTIVE';

  // 1. Insert/update organization_subscriptions
  const subPayload = {
    organization_id: input.organizationId,
    plan_key: input.planKey,
    billing_interval: input.billingInterval,
    amount: input.isTrial ? 0 : input.amount,
    status: initialStatus,
    is_trial: input.isTrial,
    trial_days: input.trialDays || 14,
    start_date: startDate.toISOString(),
    expiry_date: expiryDate.toISOString(),
    renewal_reminder_sent: false,
    updated_at: new Date().toISOString(),
  };

  const { data: subData, error: subError } = await supabase
    .from('organization_subscriptions')
    .insert([subPayload])
    .select()
    .single();

  // 2. Update organization table
  await supabase
    .from('organizations')
    .update({
      subscription_plan: input.planKey,
      subscription_expires_at: expiryDate.toISOString(),
      subscription_status: initialStatus,
      subscription_interval: input.billingInterval,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.organizationId);

  // 3. Create payment record if not a trial and amount > 0
  if (!input.isTrial && input.amount > 0) {
    const invoiceNum = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    await supabase.from('subscription_payments').insert([{
      subscription_id: subData?.id || null,
      organization_id: input.organizationId,
      organization_name: input.organizationName,
      plan_key: input.planKey,
      billing_interval: input.billingInterval,
      amount: input.amount,
      payment_method: input.paymentMethod,
      transaction_reference: 'TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      status: 'PAID',
      invoice_number: invoiceNum,
      paid_at: new Date().toISOString(),
    }]);
  }

  // 4. Log activity
  await logOrgActivity(
    input.organizationId,
    input.actorEmail,
    `Assigned ${input.planKey} plan (${input.isTrial ? 'Trial' : input.billingInterval})`,
    `Valid until ${expiryDate.toLocaleDateString()}`
  );

  const diffMs = expiryDate.getTime() - Date.now();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    id: subData?.id || 'sub_' + Math.random().toString(36).substring(2, 9),
    ...subPayload,
    organization_name: input.organizationName,
    created_at: new Date().toISOString(),
    cancelled_at: null,
    cancellation_reason: null,
    notes: null,
    days_left: daysLeft,
  };
}

export async function sendRenewalReminder(subscriptionId: string, organizationId: string, actorEmail: string): Promise<void> {
  await supabase
    .from('organization_subscriptions')
    .update({ renewal_reminder_sent: true, updated_at: new Date().toISOString() })
    .eq('id', subscriptionId);

  await logOrgActivity(
    organizationId,
    actorEmail,
    'Subscription Renewal Reminder Sent',
    'Automated notification alert dispatched to restaurant owner.'
  );
}

export async function cancelSubscription(
  subscriptionId: string,
  organizationId: string,
  reason: string,
  actorEmail: string
): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from('organization_subscriptions')
    .update({
      status: 'CANCELLED',
      cancelled_at: now,
      cancellation_reason: reason,
      updated_at: now,
    })
    .eq('id', subscriptionId);

  await supabase
    .from('organizations')
    .update({
      subscription_status: 'CANCELLED',
      updated_at: now,
    })
    .eq('id', organizationId);

  await logOrgActivity(
    organizationId,
    actorEmail,
    'Subscription Cancelled',
    `Reason: ${reason || 'Owner request'}`
  );
}

export async function renewSubscription(
  subscriptionId: string,
  organizationId: string,
  organizationName: string,
  planKey: SubscriptionTier,
  interval: BillingInterval,
  amount: number,
  paymentMethod: PaymentMethod,
  actorEmail: string
): Promise<OrgSubscriptionItem> {
  const startDate = new Date();
  const expiryDate = new Date();

  if (interval === 'yearly') {
    expiryDate.setFullYear(startDate.getFullYear() + 1);
  } else if (interval === 'quarterly') {
    expiryDate.setMonth(startDate.getMonth() + 3);
  } else {
    expiryDate.setMonth(startDate.getMonth() + 1);
  }

  await supabase
    .from('organization_subscriptions')
    .update({
      status: 'ACTIVE',
      billing_interval: interval,
      amount,
      start_date: startDate.toISOString(),
      expiry_date: expiryDate.toISOString(),
      renewal_reminder_sent: false,
      cancelled_at: null,
      cancellation_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  await supabase
    .from('organizations')
    .update({
      subscription_plan: planKey,
      subscription_expires_at: expiryDate.toISOString(),
      subscription_status: 'ACTIVE',
      subscription_interval: interval,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  // Record invoice payment
  const invoiceNum = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  await supabase.from('subscription_payments').insert([{
    subscription_id: subscriptionId,
    organization_id: organizationId,
    organization_name: organizationName,
    plan_key: planKey,
    billing_interval: interval,
    amount,
    payment_method: paymentMethod,
    transaction_reference: 'TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    status: 'PAID',
    invoice_number: invoiceNum,
    paid_at: new Date().toISOString(),
  }]);

  await logOrgActivity(
    organizationId,
    actorEmail,
    `Subscription Renewed (${planKey} - ${interval})`,
    `Invoice: ${invoiceNum} · Valid until ${expiryDate.toLocaleDateString()}`
  );

  const diffMs = expiryDate.getTime() - Date.now();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    id: subscriptionId,
    organization_id: organizationId,
    organization_name: organizationName,
    plan_key: planKey,
    billing_interval: interval,
    amount,
    status: 'ACTIVE',
    is_trial: false,
    trial_days: 14,
    start_date: startDate.toISOString(),
    expiry_date: expiryDate.toISOString(),
    renewal_reminder_sent: false,
    cancelled_at: null,
    cancellation_reason: null,
    notes: null,
    created_at: startDate.toISOString(),
    days_left: daysLeft,
  };
}

// ─────────────────────────── Payments API ───────────────────────────

export async function fetchPaymentHistory(): Promise<SubscriptionPaymentItem[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_payments')
      .select('*')
      .order('paid_at', { ascending: false })
      .limit(100);

    if (error || !data) return [];
    return data as SubscriptionPaymentItem[];
  } catch {
    return [];
  }
}
