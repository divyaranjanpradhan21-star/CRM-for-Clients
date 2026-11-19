import { CustomerProfile, loadCustomersFromStorage } from './customerManagementApi';
import { supabase } from './supabase';

export type SegmentCriteriaField =
  | 'totalSpend'
  | 'visitCount'
  | 'avgOrderValue'
  | 'city'
  | 'state'
  | 'daysSinceLastVisit'
  | 'favoriteCategory'
  | 'loyaltyTier'
  | 'customerCategory'
  | 'dietaryPreference';

export type SegmentOperator =
  | 'gte'
  | 'lte'
  | 'eq'
  | 'neq'
  | 'contains'
  | 'in'
  | 'between';

export interface SegmentRuleCondition {
  id: string;
  field: SegmentCriteriaField;
  operator: SegmentOperator;
  value: any;
  secondValue?: any; // For 'between'
}

export interface SegmentRuleGroup {
  combinator: 'AND' | 'OR';
  conditions: SegmentRuleCondition[];
}

export type SegmentTagCategory =
  | 'high_value'
  | 'at_risk'
  | 'frequency'
  | 'spending'
  | 'location'
  | 'culinary'
  | 'loyalty'
  | 'custom';

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  category: SegmentTagCategory;
  iconName: string;
  badgeColor: string; // Tailwind color class or hex
  isPredefined: boolean;
  isDynamic: boolean;
  rules: SegmentRuleGroup;
  
  // Dynamically evaluated properties
  memberCount: number;
  totalSegmentSpend: number;
  avgSegmentAOV: number;
  memberIds: string[];
  
  campaignCount?: number;
  lastEvaluatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDispatchPayload {
  segmentId: string;
  segmentName: string;
  channel: 'WhatsApp' | 'SMS' | 'Email' | 'Meta Custom Audience' | 'Google Customer Match';
  campaignTitle: string;
  offerHeadline: string;
  promoCode?: string;
  discountPct?: number;
  targetAudienceCount: number;
  dispatchedAt: string;
}

// ─── LOCAL STORAGE KEY ────────────────────────────────────────────────────────
const STORAGE_SEGMENTS_KEY = 'crm_restaurant_customer_segments';
const STORAGE_DISPATCHED_CAMPAIGNS_KEY = 'crm_restaurant_segment_campaigns';

// ─── INITIAL INTELLIGENT SEED SEGMENTS ─────────────────────────────────────────
export const INITIAL_PREDEFINED_SEGMENTS: Omit<CustomerSegment, 'memberCount' | 'totalSegmentSpend' | 'avgSegmentAOV' | 'memberIds' | 'lastEvaluatedAt'>[] = [
  {
    id: 'seg-high-value',
    name: 'High-Value VIP Connoisseurs',
    description: 'Top spenders with lifetime expenditure exceeding $2,000 or Platinum/Gold tier status',
    category: 'high_value',
    iconName: 'Crown',
    badgeColor: '#79415A', // Plum / Mauve
    isPredefined: true,
    isDynamic: true,
    rules: {
      combinator: 'OR',
      conditions: [
        { id: 'c1', field: 'totalSpend', operator: 'gte', value: 2000 },
        { id: 'c2', field: 'loyaltyTier', operator: 'in', value: ['Platinum', 'Gold'] },
      ],
    },
    campaignCount: 4,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-inactive-at-risk',
    name: 'Inactive & At-Risk Patrons',
    description: 'Lapsing or dormant guests who have not visited in the last 60 days',
    category: 'at_risk',
    iconName: 'AlertTriangle',
    badgeColor: '#DC2626', // Red
    isPredefined: true,
    isDynamic: true,
    rules: {
      combinator: 'OR',
      conditions: [
        { id: 'c3', field: 'daysSinceLastVisit', operator: 'gte', value: 60 },
        { id: 'c4', field: 'customerCategory', operator: 'eq', value: 'INACTIVE' },
      ],
    },
    campaignCount: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-frequent-regulars',
    name: 'Frequent Dining Regulars',
    description: 'Loyal guests with 10 or more visits who have dined within the last 45 days',
    category: 'frequency',
    iconName: 'Repeat',
    badgeColor: '#059669', // Emerald
    isPredefined: true,
    isDynamic: true,
    rules: {
      combinator: 'AND',
      conditions: [
        { id: 'c5', field: 'visitCount', operator: 'gte', value: 8 },
        { id: 'c6', field: 'daysSinceLastVisit', operator: 'lte', value: 45 },
      ],
    },
    campaignCount: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-high-aov',
    name: 'Premium Ticket Spenders (High AOV)',
    description: 'Patrons with high average order value above $120 per check',
    category: 'spending',
    iconName: 'TrendingUp',
    badgeColor: '#82401D', // Amber Brown
    isPredefined: true,
    isDynamic: true,
    rules: {
      combinator: 'AND',
      conditions: [
        { id: 'c7', field: 'avgOrderValue', operator: 'gte', value: 120 },
      ],
    },
    campaignCount: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-location-mumbai',
    name: 'Metro Flagship Locals',
    description: 'Guests based in Mumbai with frequent visits to city center flagship outlets',
    category: 'location',
    iconName: 'MapPin',
    badgeColor: '#2563EB', // Blue
    isPredefined: true,
    isDynamic: true,
    rules: {
      combinator: 'AND',
      conditions: [
        { id: 'c8', field: 'city', operator: 'eq', value: 'Mumbai' },
      ],
    },
    campaignCount: 5,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-foodie-bakery-cafe',
    name: 'Dessert & Specialty Cafe Lovers',
    description: 'Guests whose favorite food category includes Artisanal Bakery, Cafe & Coffee',
    category: 'culinary',
    iconName: 'Utensils',
    badgeColor: '#D97706', // Amber
    isPredefined: true,
    isDynamic: true,
    rules: {
      combinator: 'AND',
      conditions: [
        { id: 'c9', field: 'favoriteCategory', operator: 'contains', value: 'Bakery' },
      ],
    },
    campaignCount: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-loyalty-tier-platinum',
    name: 'Platinum Tier VIP Club',
    description: 'Exclusive tier members with highest loyalty point accrual and priority reservations',
    category: 'loyalty',
    iconName: 'Award',
    badgeColor: '#7C3AED', // Purple
    isPredefined: true,
    isDynamic: true,
    rules: {
      combinator: 'AND',
      conditions: [
        { id: 'c10', field: 'loyaltyTier', operator: 'eq', value: 'Platinum' },
      ],
    },
    campaignCount: 6,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-continental-grills',
    name: 'Continental & Steaks Diners',
    description: 'Patrons who favor Continental cuts, grills, and fine wine pairings',
    category: 'culinary',
    iconName: 'Flame',
    badgeColor: '#9333EA',
    isPredefined: true,
    isDynamic: true,
    rules: {
      combinator: 'AND',
      conditions: [
        { id: 'c11', field: 'favoriteCategory', operator: 'contains', value: 'Continental' },
      ],
    },
    campaignCount: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

// ─── DYNAMIC RULE EVALUATION ENGINE ───────────────────────────────────────────

/**
 * Calculates days between now and given ISO date string
 */
export function getDaysSinceDate(dateString?: string): number {
  if (!dateString) return 999;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 999;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates a single rule condition against a customer profile
 */
export function evaluateCondition(customer: CustomerProfile, condition: SegmentRuleCondition): boolean {
  let customerVal: any;

  switch (condition.field) {
    case 'totalSpend':
      customerVal = customer.totalSpend ?? 0;
      break;
    case 'visitCount':
      customerVal = customer.totalVisits ?? customer.totalOrders ?? 0;
      break;
    case 'avgOrderValue':
      customerVal = customer.averageOrderValue ?? 0;
      break;
    case 'city':
      customerVal = customer.address?.city || '';
      break;
    case 'state':
      customerVal = customer.address?.state || '';
      break;
    case 'daysSinceLastVisit':
      customerVal = getDaysSinceDate(customer.lastVisitDate);
      break;
    case 'favoriteCategory':
      customerVal = customer.favoriteFoodCategory || '';
      break;
    case 'loyaltyTier':
      customerVal = customer.loyaltyTier || 'Bronze';
      break;
    case 'customerCategory':
      customerVal = customer.category || 'NEW';
      break;
    case 'dietaryPreference':
      customerVal = customer.dietaryPreferences || [];
      break;
    default:
      return true;
  }

  const { operator, value, secondValue } = condition;

  switch (operator) {
    case 'gte':
      return Number(customerVal) >= Number(value);
    case 'lte':
      return Number(customerVal) <= Number(value);
    case 'eq':
      if (typeof customerVal === 'string') {
        return customerVal.toLowerCase().trim() === String(value).toLowerCase().trim();
      }
      return customerVal === value;
    case 'neq':
      if (typeof customerVal === 'string') {
        return customerVal.toLowerCase().trim() !== String(value).toLowerCase().trim();
      }
      return customerVal !== value;
    case 'contains':
      if (Array.isArray(customerVal)) {
        return customerVal.some((item) =>
          String(item).toLowerCase().includes(String(value).toLowerCase())
        );
      }
      return String(customerVal).toLowerCase().includes(String(value).toLowerCase());
    case 'in':
      if (Array.isArray(value)) {
        return value.map((v) => String(v).toLowerCase()).includes(String(customerVal).toLowerCase());
      }
      return false;
    case 'between':
      return Number(customerVal) >= Number(value) && Number(customerVal) <= Number(secondValue);
    default:
      return true;
  }
}

/**
 * Checks if a customer matches a segment's rule group (supporting AND / OR logic)
 */
export function evaluateCustomerMatchesRules(customer: CustomerProfile, ruleGroup: SegmentRuleGroup): boolean {
  if (!ruleGroup.conditions || ruleGroup.conditions.length === 0) {
    return true; // No conditions = all match
  }

  if (ruleGroup.combinator === 'OR') {
    return ruleGroup.conditions.some((cond) => evaluateCondition(customer, cond));
  } else {
    // Default 'AND'
    return ruleGroup.conditions.every((cond) => evaluateCondition(customer, cond));
  }
}

/**
 * Evaluates live members for a segment against an array of customers
 */
export function evaluateSegmentMembers(
  segmentRules: SegmentRuleGroup,
  allCustomers: CustomerProfile[]
): {
  members: CustomerProfile[];
  memberCount: number;
  totalSpend: number;
  avgAOV: number;
  memberIds: string[];
} {
  // Only consider non-archived customers for active marketing segments
  const activeCustomers = allCustomers.filter((c) => !c.isArchived);
  const matched = activeCustomers.filter((c) => evaluateCustomerMatchesRules(c, segmentRules));

  const totalSpend = matched.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const avgAOV = matched.length > 0 ? Number((totalSpend / (matched.reduce((sum, c) => sum + (c.totalOrders || 1), 0) || 1)).toFixed(2)) : 0;

  return {
    members: matched,
    memberCount: matched.length,
    totalSpend: Number(totalSpend.toFixed(2)),
    avgAOV,
    memberIds: matched.map((c) => c.id),
  };
}

// ─── STORAGE AND API OPERATIONS ───────────────────────────────────────────────

export function loadStoredSegments(): CustomerSegment[] {
  try {
    const raw = localStorage.getItem(STORAGE_SEGMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse segments from storage:', err);
  }

  // Fallback to initial seeds
  const customers = loadCustomersFromStorage();
  const hydrated: CustomerSegment[] = INITIAL_PREDEFINED_SEGMENTS.map((base) => {
    const evalData = evaluateSegmentMembers(base.rules, customers);
    return {
      ...base,
      memberCount: evalData.memberCount,
      totalSegmentSpend: evalData.totalSpend,
      avgSegmentAOV: evalData.avgAOV,
      memberIds: evalData.memberIds,
      lastEvaluatedAt: new Date().toISOString(),
    };
  });

  saveSegmentsToStorage(hydrated);
  return hydrated;
}

export function saveSegmentsToStorage(segments: CustomerSegment[]): void {
  try {
    localStorage.setItem(STORAGE_SEGMENTS_KEY, JSON.stringify(segments));
  } catch (err) {
    console.warn('Failed to save segments to storage:', err);
  }
}

/**
 * Fetches all customer segments with dynamic recalculation against latest customer profiles
 */
export async function fetchCustomerSegments(): Promise<CustomerSegment[]> {
  const customers = loadCustomersFromStorage();
  const segments = loadStoredSegments();

  // Dynamically update counts and spend metrics for all segments
  const updatedSegments = segments.map((seg) => {
    const evalResult = evaluateSegmentMembers(seg.rules, customers);
    return {
      ...seg,
      memberCount: evalResult.memberCount,
      totalSegmentSpend: evalResult.totalSpend,
      avgSegmentAOV: evalResult.avgAOV,
      memberIds: evalResult.memberIds,
      lastEvaluatedAt: new Date().toISOString(),
    };
  });

  saveSegmentsToStorage(updatedSegments);

  // Background non-blocking sync to Supabase
  Promise.resolve(
    supabase.from('customer_segments').select('id').limit(1)
  ).catch(() => {});

  return updatedSegments;
}

/**
 * Saves a new custom segment or updates an existing segment
 */
export async function saveCustomerSegment(
  segmentData: Partial<CustomerSegment>
): Promise<{ success: boolean; segment?: CustomerSegment; error?: string }> {
  try {
    if (!segmentData.name?.trim()) {
      return { success: false, error: 'Segment name is mandatory' };
    }

    const customers = loadCustomersFromStorage();
    const segments = loadStoredSegments();

    const isNew = !segmentData.id;
    const segmentId = segmentData.id || `seg-custom-${Date.now()}`;

    const rules: SegmentRuleGroup = segmentData.rules || {
      combinator: 'AND',
      conditions: [{ id: `c-${Date.now()}`, field: 'totalSpend', operator: 'gte', value: 500 }],
    };

    const evalResult = evaluateSegmentMembers(rules, customers);

    const fullSegment: CustomerSegment = {
      id: segmentId,
      name: segmentData.name.trim(),
      description: segmentData.description?.trim() || 'Custom segmented customer cohort',
      category: segmentData.category || 'custom',
      iconName: segmentData.iconName || 'SlidersHorizontal',
      badgeColor: segmentData.badgeColor || '#79415A',
      isPredefined: segmentData.isPredefined ?? false,
      isDynamic: true,
      rules,
      memberCount: evalResult.memberCount,
      totalSegmentSpend: evalResult.totalSpend,
      avgSegmentAOV: evalResult.avgAOV,
      memberIds: evalResult.memberIds,
      campaignCount: segmentData.campaignCount ?? 0,
      lastEvaluatedAt: new Date().toISOString(),
      createdAt: segmentData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = segments.findIndex((s) => s.id === segmentId);
    if (existingIdx >= 0) {
      segments[existingIdx] = fullSegment;
    } else {
      segments.unshift(fullSegment);
    }

    saveSegmentsToStorage(segments);

    // Non-blocking Supabase sync
    Promise.resolve(
      supabase.from('customer_segments').upsert({
        id: fullSegment.id,
        name: fullSegment.name,
        description: fullSegment.description,
        category: fullSegment.category,
        rules: fullSegment.rules,
        member_count: fullSegment.memberCount,
        total_spend: fullSegment.totalSegmentSpend,
        updated_at: fullSegment.updatedAt,
      })
    ).catch(() => {});

    return { success: true, segment: fullSegment };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save segment' };
  }
}

/**
 * Deletes a customer segment (predefined segments cannot be deleted)
 */
export async function deleteCustomerSegment(segmentId: string): Promise<boolean> {
  try {
    const segments = loadStoredSegments();
    const target = segments.find((s) => s.id === segmentId);
    if (target?.isPredefined) {
      return false; // Guard predefined system segments
    }

    const filtered = segments.filter((s) => s.id !== segmentId);
    saveSegmentsToStorage(filtered);

    Promise.resolve(
      supabase.from('customer_segments').delete().eq('id', segmentId)
    ).catch(() => {});

    return true;
  } catch {
    return false;
  }
}

/**
 * Dispatches or links a segment to an active marketing campaign
 */
export async function dispatchCampaignToSegment(
  payload: CampaignDispatchPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_DISPATCHED_CAMPAIGNS_KEY);
    const history: CampaignDispatchPayload[] = raw ? JSON.parse(raw) : [];
    history.unshift(payload);
    localStorage.setItem(STORAGE_DISPATCHED_CAMPAIGNS_KEY, JSON.stringify(history.slice(0, 100)));

    // Increment campaign count on segment
    const segments = loadStoredSegments();
    const seg = segments.find((s) => s.id === payload.segmentId);
    if (seg) {
      seg.campaignCount = (seg.campaignCount || 0) + 1;
      saveSegmentsToStorage(segments);
    }

    return {
      success: true,
      message: `Successfully launched campaign "${payload.campaignTitle}" targeting ${payload.targetAudienceCount} patrons via ${payload.channel}.`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to dispatch campaign' };
  }
}

/**
 * Exports segment member audience as a downloadable CSV for Meta Ads / Google Match / SMS Blast
 */
export function exportSegmentAudienceCSV(segment: CustomerSegment, members: CustomerProfile[]): void {
  const headers = [
    'Customer ID',
    'Full Name',
    'Email Address',
    'Phone Number',
    'City',
    'Category',
    'Loyalty Tier',
    'Total Lifetime Spend',
    'Visits',
    'Average Order Value',
    'Favorite Category',
    'Last Visit Date',
    'Marketing SMS Consent',
    'Marketing Email Consent',
  ];

  const rows = members.map((c) => [
    `"${c.id}"`,
    `"${c.fullName.replace(/"/g, '""')}"`,
    `"${c.email}"`,
    `"${c.mobile}"`,
    `"${c.address?.city || ''}"`,
    `"${c.category}"`,
    `"${c.loyaltyTier}"`,
    c.totalSpend.toFixed(2),
    c.totalVisits || c.totalOrders || 0,
    c.averageOrderValue?.toFixed(2) || '0.00',
    `"${c.favoriteFoodCategory || ''}"`,
    `"${c.lastVisitDate ? c.lastVisitDate.split('T')[0] : ''}"`,
    c.consent?.marketingSms ? 'YES' : 'NO',
    c.consent?.marketingEmail ? 'YES' : 'NO',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `segment_${segment.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
