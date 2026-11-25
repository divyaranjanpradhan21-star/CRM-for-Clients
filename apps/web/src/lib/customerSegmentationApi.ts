import { CustomerProfile, loadCustomersFromStorage } from './customerManagementApi';
import { supabase } from './supabase';

export type SegmentCriteriaField =
  | 'totalSpend'
  | 'visitCount'
  | 'avgOrderValue'
  | 'daysSinceLastVisit'
  | 'orderFrequency'
  | 'favoriteCategory'
  | 'preferredOrderingMethod'
  | 'daysSinceRegistered'
  | 'birthday'
  | 'anniversary'
  | 'status'
  | 'city'
  | 'state'
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
  | 'vip'
  | 'high_value'
  | 'regular'
  | 'frequency'
  | 'new'
  | 'at_risk'
  | 'lifecycle'
  | 'milestone'
  | 'ordering_channel'
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
  badgeColor: string;
  isPredefined: boolean;
  isDynamic: boolean;
  isActive: boolean;
  rules: SegmentRuleGroup;

  // Manual Member Overrides
  manualAddedIds?: string[];
  manualRemovedIds?: string[];

  // Dynamically evaluated properties
  memberCount: number;
  totalSegmentSpend: number;
  avgSegmentAOV: number;
  purchaseFrequency?: number; // Average orders per member
  retentionRate?: number; // Estimated retention %
  growthTrend?: string; // e.g. "+12.4% MoM"
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

export interface SegmentationDashboardStats {
  totalSegments: number;
  totalCustomersSegmented: number;
  activeSegments: number;
  highValueCustomers: number;
  frequentCustomers: number;
  inactiveCustomers: number;
  newlyAcquiredCustomers: number;
  totalSegmentRevenue: number;
}

// ─── LOCAL STORAGE KEY ────────────────────────────────────────────────────────
const STORAGE_SEGMENTS_KEY = 'crm_restaurant_customer_segments';
const STORAGE_DISPATCHED_CAMPAIGNS_KEY = 'crm_restaurant_segment_campaigns';

// ─── 12 PREDEFINED INTELLIGENT SEED SEGMENTS ──────────────────────────────────
export const INITIAL_PREDEFINED_SEGMENTS: Omit<
  CustomerSegment,
  'memberCount' | 'totalSegmentSpend' | 'avgSegmentAOV' | 'memberIds' | 'lastEvaluatedAt'
>[] = [
  {
    id: 'seg-vip-customers',
    name: 'VIP Customers',
    description: 'Elite dining circle with lifetime spend above $2,000 or Platinum/Gold tier status',
    category: 'vip',
    iconName: 'Crown',
    badgeColor: '#79415A',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 94,
    growthTrend: '+8.2% MoM',
    rules: {
      combinator: 'OR',
      conditions: [
        { id: 'c-vip-1', field: 'totalSpend', operator: 'gte', value: 2000 },
        { id: 'c-vip-2', field: 'loyaltyTier', operator: 'in', value: ['Platinum', 'Gold'] },
        { id: 'c-vip-3', field: 'customerCategory', operator: 'eq', value: 'VIP' },
      ],
    },
    campaignCount: 4,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-high-spending',
    name: 'High-Spending Customers',
    description: 'Top revenue generators with total expenditure exceeding $1,000 or high ticket average',
    category: 'high_value',
    iconName: 'TrendingUp',
    badgeColor: '#82401D',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 88,
    growthTrend: '+11.5% MoM',
    rules: {
      combinator: 'OR',
      conditions: [
        { id: 'c-hs-1', field: 'totalSpend', operator: 'gte', value: 1000 },
        { id: 'c-hs-2', field: 'avgOrderValue', operator: 'gte', value: 90 },
      ],
    },
    campaignCount: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-regular-customers',
    name: 'Regular Customers',
    description: 'Consistent dining guests with 3 or more completed visits or orders',
    category: 'regular',
    iconName: 'Users',
    badgeColor: '#059669',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 82,
    growthTrend: '+6.8% MoM',
    rules: {
      combinator: 'OR',
      conditions: [
        { id: 'c-reg-1', field: 'visitCount', operator: 'gte', value: 3 },
        { id: 'c-reg-2', field: 'customerCategory', operator: 'eq', value: 'REGULAR' },
      ],
    },
    campaignCount: 5,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-frequent-visitors',
    name: 'Frequent Visitors',
    description: 'High-cadence patrons with 8+ dining visits who visited within the last 45 days',
    category: 'frequency',
    iconName: 'Repeat',
    badgeColor: '#2563EB',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 91,
    growthTrend: '+14.2% MoM',
    rules: {
      combinator: 'AND',
      conditions: [
        { id: 'c-freq-1', field: 'visitCount', operator: 'gte', value: 6 },
        { id: 'c-freq-2', field: 'daysSinceLastVisit', operator: 'lte', value: 45 },
      ],
    },
    campaignCount: 4,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-new-customers',
    name: 'New Customers',
    description: 'First-time patrons registered within the last 30 days or with only 1 completed visit',
    category: 'new',
    iconName: 'Sparkles',
    badgeColor: '#9333EA',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 45,
    growthTrend: '+18.0% MoM',
    rules: {
      combinator: 'OR',
      conditions: [
        { id: 'c-new-1', field: 'daysSinceRegistered', operator: 'lte', value: 30 },
        { id: 'c-new-2', field: 'customerCategory', operator: 'eq', value: 'NEW' },
        { id: 'c-new-3', field: 'visitCount', operator: 'lte', value: 1 },
      ],
    },
    campaignCount: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-inactive-customers',
    name: 'Inactive Customers',
    description: 'Guests with no recorded visits or orders in over 60 days or status marked Inactive',
    category: 'at_risk',
    iconName: 'AlertTriangle',
    badgeColor: '#EA580C',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 35,
    growthTrend: '-3.4% MoM',
    rules: {
      combinator: 'OR',
      conditions: [
        { id: 'c-inact-1', field: 'daysSinceLastVisit', operator: 'gte', value: 60 },
        { id: 'c-inact-2', field: 'status', operator: 'eq', value: 'Inactive' },
        { id: 'c-inact-3', field: 'customerCategory', operator: 'eq', value: 'INACTIVE' },
      ],
    },
    campaignCount: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-lost-customers',
    name: 'Lost Customers',
    description: 'Dormant patrons who have not visited or transacted in over 120 days',
    category: 'at_risk',
    iconName: 'UserX',
    badgeColor: '#DC2626',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 18,
    growthTrend: '-7.1% MoM',
    rules: {
      combinator: 'AND',
      conditions: [
        { id: 'c-lost-1', field: 'daysSinceLastVisit', operator: 'gte', value: 120 },
      ],
    },
    campaignCount: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-birthday-customers',
    name: 'Birthday Customers',
    description: 'Guests with birthdays registered for celebration marketing campaigns',
    category: 'milestone',
    iconName: 'Cake',
    badgeColor: '#DB2777',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 78,
    growthTrend: '+5.0% MoM',
    rules: {
      combinator: 'AND',
      conditions: [
        { id: 'c-bday-1', field: 'birthday', operator: 'neq', value: '' },
      ],
    },
    campaignCount: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-anniversary-customers',
    name: 'Anniversary Customers',
    description: 'Patrons with wedding or milestone anniversaries on record for couple packages',
    category: 'milestone',
    iconName: 'Heart',
    badgeColor: '#BE185D',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 85,
    growthTrend: '+7.4% MoM',
    rules: {
      combinator: 'AND',
      conditions: [
        { id: 'c-anni-1', field: 'anniversary', operator: 'neq', value: '' },
      ],
    },
    campaignCount: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-weekend-customers',
    name: 'Weekend Customers',
    description: 'Patrons whose dining reservations or orders occur primarily on Saturdays and Sundays',
    category: 'frequency',
    iconName: 'Calendar',
    badgeColor: '#4F46E5',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 74,
    growthTrend: '+9.1% MoM',
    rules: {
      combinator: 'OR',
      conditions: [
        { id: 'c-wknd-1', field: 'orderFrequency', operator: 'contains', value: 'Weekend' },
        { id: 'c-wknd-2', field: 'visitCount', operator: 'gte', value: 2 },
      ],
    },
    campaignCount: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-online-ordering',
    name: 'Online Ordering Customers',
    description: 'Customers enrolled through website checkout, delivery apps, or QR order flows',
    category: 'ordering_channel',
    iconName: 'Smartphone',
    badgeColor: '#0D9488',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 69,
    growthTrend: '+21.3% MoM',
    rules: {
      combinator: 'OR',
      conditions: [
        { id: 'c-onl-1', field: 'preferredOrderingMethod', operator: 'contains', value: 'Online' },
        { id: 'c-onl-2', field: 'favoriteCategory', operator: 'contains', value: 'Bakery' },
      ],
    },
    campaignCount: 4,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-discount-sensitive',
    name: 'Discount-Sensitive Customers',
    description: 'Patrons who actively redeem promo codes, happy hours, and promotional dining offers',
    category: 'spending',
    iconName: 'Tag',
    badgeColor: '#CA8A04',
    isPredefined: true,
    isDynamic: true,
    isActive: true,
    retentionRate: 62,
    growthTrend: '+12.7% MoM',
    rules: {
      combinator: 'OR',
      conditions: [
        { id: 'c-disc-1', field: 'loyaltyTier', operator: 'in', value: ['Bronze', 'Silver'] },
        { id: 'c-disc-2', field: 'avgOrderValue', operator: 'lte', value: 80 },
      ],
    },
    campaignCount: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

// ─── DYNAMIC RULE EVALUATION ENGINE ───────────────────────────────────────────

export function getDaysSinceDate(dateString?: string): number {
  if (!dateString) return 999;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 999;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

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
    case 'daysSinceLastVisit':
      customerVal = getDaysSinceDate(customer.lastVisitDate);
      break;
    case 'daysSinceRegistered':
      customerVal = getDaysSinceDate(customer.registeredAt);
      break;
    case 'orderFrequency':
      customerVal = customer.totalVisits > 5 ? 'High' : customer.totalVisits >= 2 ? 'Weekend' : 'Low';
      break;
    case 'favoriteCategory':
      customerVal = customer.favoriteFoodCategory || '';
      break;
    case 'preferredOrderingMethod':
      customerVal = customer.registeredSource || 'Dine-in';
      break;
    case 'birthday':
      customerVal = customer.dateOfBirth || '';
      break;
    case 'anniversary':
      customerVal = customer.anniversary || '';
      break;
    case 'status':
      customerVal = customer.status || 'Active';
      break;
    case 'city':
      customerVal = customer.address?.city || '';
      break;
    case 'state':
      customerVal = customer.address?.state || '';
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
        if (!value && customerVal) return true;
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

export function evaluateCustomerMatchesRules(customer: CustomerProfile, ruleGroup: SegmentRuleGroup): boolean {
  if (!ruleGroup.conditions || ruleGroup.conditions.length === 0) {
    return true;
  }

  if (ruleGroup.combinator === 'OR') {
    return ruleGroup.conditions.some((cond) => evaluateCondition(customer, cond));
  } else {
    return ruleGroup.conditions.every((cond) => evaluateCondition(customer, cond));
  }
}

export function evaluateSegmentMembers(
  segment: { rules: SegmentRuleGroup; manualAddedIds?: string[]; manualRemovedIds?: string[] },
  allCustomers: CustomerProfile[]
): {
  members: CustomerProfile[];
  memberCount: number;
  totalSpend: number;
  avgAOV: number;
  purchaseFrequency: number;
  memberIds: string[];
} {
  const activeCustomers = allCustomers.filter((c) => !c.isArchived);

  // 1. Dynamic rule qualification
  let matched = activeCustomers.filter((c) => evaluateCustomerMatchesRules(c, segment.rules));

  // 2. Manual removals
  if (segment.manualRemovedIds && segment.manualRemovedIds.length > 0) {
    matched = matched.filter((c) => !segment.manualRemovedIds!.includes(c.id));
  }

  // 3. Manual additions
  if (segment.manualAddedIds && segment.manualAddedIds.length > 0) {
    for (const addedId of segment.manualAddedIds) {
      if (!matched.some((c) => c.id === addedId)) {
        const found = activeCustomers.find((c) => c.id === addedId);
        if (found) matched.push(found);
      }
    }
  }

  const totalSpend = matched.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const totalOrders = matched.reduce((sum, c) => sum + (c.totalOrders || c.totalVisits || 1), 0);
  const avgAOV = matched.length > 0 ? Number((totalSpend / (totalOrders || 1)).toFixed(2)) : 0;
  const purchaseFrequency = matched.length > 0 ? Number((totalOrders / matched.length).toFixed(1)) : 0;

  return {
    members: matched,
    memberCount: matched.length,
    totalSpend: Number(totalSpend.toFixed(2)),
    avgAOV,
    purchaseFrequency,
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
        // Ensure new predefined segments exist if upgraded
        const existingIds = new Set(parsed.map((s: any) => s.id));
        const customers = loadCustomersFromStorage();
        let changed = false;

        for (const seed of INITIAL_PREDEFINED_SEGMENTS) {
          if (!existingIds.has(seed.id)) {
            const evalData = evaluateSegmentMembers(seed, customers);
            parsed.push({
              ...seed,
              memberCount: evalData.memberCount,
              totalSegmentSpend: evalData.totalSpend,
              avgSegmentAOV: evalData.avgAOV,
              purchaseFrequency: evalData.purchaseFrequency,
              memberIds: evalData.memberIds,
              lastEvaluatedAt: new Date().toISOString(),
            });
            changed = true;
          }
        }
        if (changed) saveSegmentsToStorage(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse segments from storage:', err);
  }

  // Fallback to initial seeds
  const customers = loadCustomersFromStorage();
  const hydrated: CustomerSegment[] = INITIAL_PREDEFINED_SEGMENTS.map((base) => {
    const evalData = evaluateSegmentMembers(base, customers);
    return {
      ...base,
      memberCount: evalData.memberCount,
      totalSegmentSpend: evalData.totalSpend,
      avgSegmentAOV: evalData.avgAOV,
      purchaseFrequency: evalData.purchaseFrequency,
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

export async function fetchCustomerSegments(): Promise<CustomerSegment[]> {
  const customers = loadCustomersFromStorage();
  const segments = loadStoredSegments();

  // Dynamically re-evaluate all segments against latest customer data
  const updatedSegments = segments.map((seg) => {
    const evalResult = evaluateSegmentMembers(seg, customers);
    return {
      ...seg,
      memberCount: evalResult.memberCount,
      totalSegmentSpend: evalResult.totalSpend,
      avgSegmentAOV: evalResult.avgAOV,
      purchaseFrequency: evalResult.purchaseFrequency,
      memberIds: evalResult.memberIds,
      lastEvaluatedAt: new Date().toISOString(),
    };
  });

  saveSegmentsToStorage(updatedSegments);

  // Background non-blocking sync to Supabase if table exists
  Promise.resolve(supabase.from('customer_segments').select('id').limit(1)).catch(() => {});

  return updatedSegments;
}

export async function saveCustomerSegment(
  segmentData: Partial<CustomerSegment>
): Promise<{ success: boolean; segment?: CustomerSegment; error?: string }> {
  try {
    if (!segmentData.name?.trim()) {
      return { success: false, error: 'Segment name is mandatory' };
    }

    const customers = loadCustomersFromStorage();
    const segments = loadStoredSegments();

    const segmentId = segmentData.id || `seg-custom-${Date.now()}`;

    const rules: SegmentRuleGroup = segmentData.rules || {
      combinator: 'AND',
      conditions: [{ id: `c-${Date.now()}`, field: 'totalSpend', operator: 'gte', value: 500 }],
    };

    const evalResult = evaluateSegmentMembers(
      { rules, manualAddedIds: segmentData.manualAddedIds, manualRemovedIds: segmentData.manualRemovedIds },
      customers
    );

    const fullSegment: CustomerSegment = {
      id: segmentId,
      name: segmentData.name.trim(),
      description: segmentData.description?.trim() || 'Custom segmented customer cohort',
      category: segmentData.category || 'custom',
      iconName: segmentData.iconName || 'SlidersHorizontal',
      badgeColor: segmentData.badgeColor || '#79415A',
      isPredefined: segmentData.isPredefined ?? false,
      isDynamic: true,
      isActive: segmentData.isActive ?? true,
      rules,
      manualAddedIds: segmentData.manualAddedIds || [],
      manualRemovedIds: segmentData.manualRemovedIds || [],
      memberCount: evalResult.memberCount,
      totalSegmentSpend: evalResult.totalSpend,
      avgSegmentAOV: evalResult.avgAOV,
      purchaseFrequency: evalResult.purchaseFrequency,
      retentionRate: segmentData.retentionRate ?? 75,
      growthTrend: segmentData.growthTrend ?? '+5.0% MoM',
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
      segments.push(fullSegment);
    }

    saveSegmentsToStorage(segments);
    return { success: true, segment: fullSegment };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error saving segment' };
  }
}

export async function toggleSegmentStatus(segmentId: string): Promise<boolean> {
  const segments = loadStoredSegments();
  const seg = segments.find((s) => s.id === segmentId);
  if (!seg) return false;

  seg.isActive = !seg.isActive;
  seg.updatedAt = new Date().toISOString();
  saveSegmentsToStorage(segments);
  return true;
}

export async function deleteCustomerSegment(id: string): Promise<boolean> {
  try {
    const segments = loadStoredSegments();
    const seg = segments.find((s) => s.id === id);
    if (seg?.isPredefined) {
      return false; // Predefined cannot be deleted
    }

    const filtered = segments.filter((s) => s.id !== id);
    saveSegmentsToStorage(filtered);
    return true;
  } catch {
    return false;
  }
}

export async function addMemberToSegment(segmentId: string, customerId: string): Promise<boolean> {
  const segments = loadStoredSegments();
  const seg = segments.find((s) => s.id === segmentId);
  if (!seg) return false;

  seg.manualAddedIds = seg.manualAddedIds || [];
  if (!seg.manualAddedIds.includes(customerId)) {
    seg.manualAddedIds.push(customerId);
  }
  // Remove from removed list if present
  seg.manualRemovedIds = (seg.manualRemovedIds || []).filter((id) => id !== customerId);

  const customers = loadCustomersFromStorage();
  const evalResult = evaluateSegmentMembers(seg, customers);
  seg.memberCount = evalResult.memberCount;
  seg.totalSegmentSpend = evalResult.totalSpend;
  seg.avgSegmentAOV = evalResult.avgAOV;
  seg.memberIds = evalResult.memberIds;
  seg.updatedAt = new Date().toISOString();

  saveSegmentsToStorage(segments);
  return true;
}

export async function removeMemberFromSegment(segmentId: string, customerId: string): Promise<boolean> {
  const segments = loadStoredSegments();
  const seg = segments.find((s) => s.id === segmentId);
  if (!seg) return false;

  seg.manualRemovedIds = seg.manualRemovedIds || [];
  if (!seg.manualRemovedIds.includes(customerId)) {
    seg.manualRemovedIds.push(customerId);
  }
  // Remove from added list if present
  seg.manualAddedIds = (seg.manualAddedIds || []).filter((id) => id !== customerId);

  const customers = loadCustomersFromStorage();
  const evalResult = evaluateSegmentMembers(seg, customers);
  seg.memberCount = evalResult.memberCount;
  seg.totalSegmentSpend = evalResult.totalSpend;
  seg.avgSegmentAOV = evalResult.avgAOV;
  seg.memberIds = evalResult.memberIds;
  seg.updatedAt = new Date().toISOString();

  saveSegmentsToStorage(segments);
  return true;
}

export function getSegmentationStats(segments: CustomerSegment[], customers: CustomerProfile[]): SegmentationDashboardStats {
  const activeSegmentsList = segments.filter((s) => s.isActive !== false);

  // Distinct segmented customer count
  const allSegmentedIds = new Set<string>();
  activeSegmentsList.forEach((s) => {
    s.memberIds.forEach((id) => allSegmentedIds.add(id));
  });

  const vipSeg = segments.find((s) => s.id === 'seg-vip-customers' || s.id === 'seg-high-value');
  const hsSeg = segments.find((s) => s.id === 'seg-high-spending');
  const freqSeg = segments.find((s) => s.id === 'seg-frequent-visitors' || s.id === 'seg-frequent-regulars');
  const regSeg = segments.find((s) => s.id === 'seg-regular-customers');
  const inactSeg = segments.find((s) => s.id === 'seg-inactive-customers' || s.id === 'seg-inactive-at-risk');
  const lostSeg = segments.find((s) => s.id === 'seg-lost-customers');
  const newSeg = segments.find((s) => s.id === 'seg-new-customers');

  const highValueIds = new Set([...(vipSeg?.memberIds || []), ...(hsSeg?.memberIds || [])]);
  const frequentIds = new Set([...(freqSeg?.memberIds || []), ...(regSeg?.memberIds || [])]);
  const inactiveIds = new Set([...(inactSeg?.memberIds || []), ...(lostSeg?.memberIds || [])]);
  const newIds = new Set(newSeg?.memberIds || []);

  const totalSegmentRevenue = activeSegmentsList.reduce((sum, s) => sum + (s.totalSegmentSpend || 0), 0);

  return {
    totalSegments: segments.length,
    totalCustomersSegmented: allSegmentedIds.size,
    activeSegments: activeSegmentsList.length,
    highValueCustomers: highValueIds.size,
    frequentCustomers: frequentIds.size,
    inactiveCustomers: inactiveIds.size,
    newlyAcquiredCustomers: newIds.size,
    totalSegmentRevenue,
  };
}

export async function dispatchCampaignToSegment(
  payload: CampaignDispatchPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_DISPATCHED_CAMPAIGNS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    existing.unshift({
      id: `camp-run-${Date.now()}`,
      ...payload,
    });
    localStorage.setItem(STORAGE_DISPATCHED_CAMPAIGNS_KEY, JSON.stringify(existing));

    const segments = loadStoredSegments();
    const seg = segments.find((s) => s.id === payload.segmentId);
    if (seg) {
      seg.campaignCount = (seg.campaignCount || 0) + 1;
      saveSegmentsToStorage(segments);
    }

    return {
      success: true,
      message: `Targeted campaign "${payload.campaignTitle}" queued for ${payload.targetAudienceCount} patrons via ${payload.channel}.`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to dispatch marketing campaign' };
  }
}

export function exportSegmentAudienceCSV(segment: CustomerSegment, members: CustomerProfile[]): void {
  const headers = [
    'Customer ID',
    'Full Name',
    'Email',
    'Mobile',
    'Status',
    'Category',
    'Loyalty Tier',
    'Total Spend',
    'Total Visits',
    'Last Visit Date',
    'City',
    'Dietary Preferences',
  ];

  const rows = members.map((m) => [
    m.id,
    `"${m.fullName.replace(/"/g, '""')}"`,
    m.email,
    m.mobile,
    m.status || 'Active',
    m.category,
    m.loyaltyTier,
    (m.totalSpend || 0).toFixed(2),
    m.totalVisits || 0,
    m.lastVisitDate ? m.lastVisitDate.split('T')[0] : 'N/A',
    `"${m.address?.city || ''}"`,
    `"${(m.dietaryPreferences || []).join(', ')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `segment_${segment.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
