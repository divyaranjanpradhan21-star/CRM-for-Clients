import { supabase } from './supabase';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type CustomerCategory = 'NEW' | 'REGULAR' | 'VIP' | 'INACTIVE';
export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CustomerOrderHistoryItem {
  id: string;
  orderNumber: string;
  date: string;
  orderType: 'Dine-in' | 'Takeaway' | 'Delivery' | 'Catering';
  itemsSummary: string;
  totalAmount: number;
  paymentMethod: string;
  status: 'Completed' | 'Refunded' | 'Cancelled';
}

export interface CustomerReservationHistoryItem {
  id: string;
  bookingCode: string;
  date: string;
  time: string;
  partySize: number;
  tableNumber: string;
  branchName: string;
  status: 'Seated' | 'Completed' | 'Cancelled' | 'No-Show';
  notes?: string;
}

export interface CustomerCommunicationItem {
  id: string;
  type: 'SMS' | 'WhatsApp' | 'Email';
  title: string;
  sentAt: string;
  status: 'Delivered' | 'Opened' | 'Failed';
  preview: string;
}

export interface CustomerComplaintItem {
  id: string;
  ticketNumber: string;
  date: string;
  issue: string;
  rating: number; // 1 to 5
  status: 'Resolved' | 'Pending' | 'Escalated';
  resolutionNotes?: string;
}

export interface CustomerConsentPreferences {
  marketingSms: boolean;
  marketingEmail: boolean;
  whatsappUpdates: boolean;
  dataSharingConsent: boolean;
  consentTimestamp: string;
}

export interface CustomerProfile {
  id: string; // e.g. "CUST-10492"
  organizationId?: string;
  fullName: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
  address: CustomerAddress;
  dateOfBirth?: string; // YYYY-MM-DD
  anniversary?: string; // YYYY-MM-DD

  // Culinary & Hospitality
  dietaryPreferences: string[];
  foodAllergies: string[];
  favoriteFoodCategory?: string;
  specialInstructions?: string;

  // Lifecycle & Metrics
  category: CustomerCategory;
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
  lifetimePointsEarned: number;
  totalSpend: number;
  totalOrders: number;
  totalVisits: number;
  averageOrderValue: number;
  firstVisitDate: string;
  lastVisitDate: string;
  registeredAt: string;
  registeredSource: 'Manual Admin' | 'Online Order' | 'Table Reservation' | 'QR Dine-In';
  favoriteBranch: string;

  // History & Logs
  orders: CustomerOrderHistoryItem[];
  reservations: CustomerReservationHistoryItem[];
  communications: CustomerCommunicationItem[];
  complaints: CustomerComplaintItem[];

  // Consent & Status
  consent: CustomerConsentPreferences;
  isArchived: boolean;
  archivedAt?: string;
  anonymizedAt?: string;
  updatedAt: string;
}

export interface DuplicateGroup {
  id: string;
  reason: 'phone' | 'email' | 'name';
  matchValue: string;
  customers: CustomerProfile[];
}

export interface CustomerFilterOptions {
  searchQuery?: string;
  category?: CustomerCategory | 'ALL';
  loyaltyTier?: LoyaltyTier | 'ALL';
  registeredDateRange?: 'ALL' | 'today' | 'week' | 'month' | 'past_90_days' | 'year';
  activityRange?: 'ALL' | 'active_30' | 'active_90' | 'inactive_90' | 'never_ordered';
  dietaryFilter?: string;
  allergyFilter?: string;
  includeArchived?: boolean;
}

// ─── LOCAL STORAGE KEY ────────────────────────────────────────────────────────
const STORAGE_CUSTOMERS_KEY = 'crm_restaurant_customers';

// ─── INITIAL SEED DATA ────────────────────────────────────────────────────────
const INITIAL_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'CUST-10491',
    fullName: 'Alexander Wright',
    email: 'alex.wright@executive-advisors.com',
    mobile: '+91 98200 88210',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    address: {
      street: 'Flat 14A, Seaface Horizon Towers, Worli',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400018',
      country: 'India',
    },
    dateOfBirth: '1984-06-14',
    anniversary: '2012-11-20',
    dietaryPreferences: ['Pescatarian', 'Organic Only'],
    foodAllergies: ['Shellfish', 'Lactose Intolerant'],
    favoriteFoodCategory: 'Continental & Grills',
    specialInstructions: 'Prefers quiet corner booth. Prefers sparkling water without ice. Celebrates wedding anniversary on Nov 20.',
    category: 'VIP',
    loyaltyTier: 'Platinum',
    loyaltyPoints: 1250,
    lifetimePointsEarned: 3450,
    totalSpend: 4280.5,
    totalOrders: 32,
    totalVisits: 28,
    averageOrderValue: 133.76,
    firstVisitDate: '2023-02-14T19:30:00.000Z',
    lastVisitDate: '2026-11-16T20:15:00.000Z',
    registeredAt: '2023-02-14T18:00:00.000Z',
    registeredSource: 'Table Reservation',
    favoriteBranch: 'Downtown Flagship #01',
    orders: [
      {
        id: 'ord-801',
        orderNumber: 'POS-8902',
        date: '2026-11-16T20:15:00.000Z',
        orderType: 'Dine-in',
        itemsSummary: 'Pan-seared Chilean Seabass, Truffle Sourdough, Sparkling San Pellegrino (x2)',
        totalAmount: 184.5,
        paymentMethod: 'Amex Card',
        status: 'Completed',
      },
      {
        id: 'ord-802',
        orderNumber: 'POS-8740',
        date: '2026-10-28T13:45:00.000Z',
        orderType: 'Dine-in',
        itemsSummary: 'Grilled Salmon Bowl, Fresh Mint Lemonade, Espresso',
        totalAmount: 92.0,
        paymentMethod: 'Credit Card',
        status: 'Completed',
      },
      {
        id: 'ord-803',
        orderNumber: 'POS-8412',
        date: '2026-09-14T20:30:00.000Z',
        orderType: 'Dine-in',
        itemsSummary: 'Chef Tasting Menu for 2, French Chablis Reserve',
        totalAmount: 265.0,
        paymentMethod: 'Credit Card',
        status: 'Completed',
      },
    ],
    reservations: [
      {
        id: 'res-401',
        bookingCode: 'RES-9824',
        date: '2026-11-20',
        time: '08:00 PM',
        partySize: 4,
        tableNumber: 'T-04',
        branchName: 'Downtown Flagship #01',
        status: 'Seated',
        notes: 'Anniversary celebration dinner. Window table reserved.',
      },
      {
        id: 'res-402',
        bookingCode: 'RES-8410',
        date: '2026-10-28',
        time: '01:30 PM',
        partySize: 2,
        tableNumber: 'T-02',
        branchName: 'Downtown Flagship #01',
        status: 'Completed',
      },
      {
        id: 'res-403',
        bookingCode: 'RES-7690',
        date: '2026-08-15',
        time: '08:00 PM',
        partySize: 6,
        tableNumber: 'T-10',
        branchName: 'Downtown Flagship #01',
        status: 'Completed',
      },
    ],
    communications: [
      {
        id: 'comm-101',
        type: 'WhatsApp',
        title: 'Table Confirmed RES-9824',
        sentAt: '2026-11-18T10:00:00.000Z',
        status: 'Delivered',
        preview: 'Hi Alexander, your table for 4 at Cafe\'s Corner Downtown is confirmed for 20 Nov at 8:00 PM.',
      },
      {
        id: 'comm-102',
        type: 'SMS',
        title: 'Loyalty Points Accrued (+184 pts)',
        sentAt: '2026-11-16T21:45:00.000Z',
        status: 'Delivered',
        preview: 'You earned +184 points! Your current balance is 1,250 points.',
      },
    ],
    complaints: [],
    consent: {
      marketingSms: true,
      marketingEmail: true,
      whatsappUpdates: true,
      dataSharingConsent: true,
      consentTimestamp: '2023-02-14T18:00:00.000Z',
    },
    isArchived: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'CUST-10492',
    fullName: 'Sophia Chen-Kapoor',
    email: 'sophia.chen@modernstudio.design',
    mobile: '+91 98200 44102',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    address: {
      street: 'Penthouse 7, The Oberoi Enclave, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
      country: 'India',
    },
    dateOfBirth: '1992-04-22',
    anniversary: '2019-12-08',
    dietaryPreferences: ['Vegan', 'Plant-Based'],
    foodAllergies: ['Gluten / Celiac', 'Peanuts'],
    favoriteFoodCategory: 'Artisanal Bakery & Cafe',
    specialInstructions: 'Strict celiac. Please ensure dedicated fryer & pan for all food preparation.',
    category: 'VIP',
    loyaltyTier: 'Gold',
    loyaltyPoints: 680,
    lifetimePointsEarned: 1840,
    totalSpend: 2450.0,
    totalOrders: 19,
    totalVisits: 16,
    averageOrderValue: 128.94,
    firstVisitDate: '2023-06-10T12:00:00.000Z',
    lastVisitDate: '2026-11-10T13:30:00.000Z',
    registeredAt: '2023-06-10T11:45:00.000Z',
    registeredSource: 'Online Order',
    favoriteBranch: 'Uptown Express Outlet',
    orders: [
      {
        id: 'ord-810',
        orderNumber: 'POS-8620',
        date: '2026-11-10T13:30:00.000Z',
        orderType: 'Takeaway',
        itemsSummary: 'Avocado Tartine (GF Bread), Oat Milk Flat White, Açai Smoothie Bowl',
        totalAmount: 48.0,
        paymentMethod: 'Apple Pay',
        status: 'Completed',
      },
    ],
    reservations: [
      {
        id: 'res-410',
        bookingCode: 'RES-8910',
        date: '2026-10-15',
        time: '01:00 PM',
        partySize: 2,
        tableNumber: 'T-08',
        branchName: 'Uptown Express Outlet',
        status: 'Completed',
      },
    ],
    communications: [
      {
        id: 'comm-103',
        type: 'Email',
        title: 'New Gluten-Free Autumn Menu Announcement',
        sentAt: '2026-10-01T09:00:00.000Z',
        status: 'Opened',
        preview: 'Hi Sophia, discover our new 100% certified gluten-free brunch additions.',
      },
    ],
    complaints: [],
    consent: {
      marketingSms: true,
      marketingEmail: true,
      whatsappUpdates: true,
      dataSharingConsent: true,
      consentTimestamp: '2023-06-10T11:45:00.000Z',
    },
    isArchived: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'CUST-10493',
    fullName: 'Rajesh Mehra',
    email: 'rajesh.mehra@globaltech.in',
    mobile: '+91 98200 33405',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    address: {
      street: 'B-302, Green Acres, Powai Central',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400076',
      country: 'India',
    },
    dateOfBirth: '1979-11-04',
    anniversary: '2005-02-18',
    dietaryPreferences: ['Vegetarian', 'Jain Option Required'],
    foodAllergies: ['No Onion / No Garlic', 'Mushroom'],
    favoriteFoodCategory: 'Authentic Indian & Jain Special',
    specialInstructions: 'Jain preparation only. Table should be sanitized thoroughly prior to seating.',
    category: 'REGULAR',
    loyaltyTier: 'Silver',
    loyaltyPoints: 340,
    lifetimePointsEarned: 890,
    totalSpend: 1120.0,
    totalOrders: 11,
    totalVisits: 9,
    averageOrderValue: 101.81,
    firstVisitDate: '2024-01-20T19:00:00.000Z',
    lastVisitDate: '2026-11-04T20:00:00.000Z',
    registeredAt: '2024-01-20T18:30:00.000Z',
    registeredSource: 'QR Dine-In',
    favoriteBranch: 'Downtown Flagship #01',
    orders: [
      {
        id: 'ord-820',
        orderNumber: 'POS-8501',
        date: '2026-11-04T20:00:00.000Z',
        orderType: 'Dine-in',
        itemsSummary: 'Jain Wild Mushroom Risotto substitute, Paneer Tikka Platter, Mocktail Spritz',
        totalAmount: 115.0,
        paymentMethod: 'UPI QR',
        status: 'Completed',
      },
    ],
    reservations: [],
    communications: [
      {
        id: 'comm-104',
        type: 'SMS',
        title: 'Happy Birthday from Cafe\'s Corner!',
        sentAt: '2026-11-04T08:00:00.000Z',
        status: 'Delivered',
        preview: 'Happy Birthday Rajesh! Enjoy +100 bonus loyalty points on your visit today.',
      },
    ],
    complaints: [
      {
        id: 'comp-01',
        ticketNumber: 'CMP-202',
        date: '2026-08-12T21:00:00.000Z',
        issue: 'Slow starter service during Saturday peak dinner rush.',
        rating: 3,
        status: 'Resolved',
        resolutionNotes: 'Complimentary dessert offered on table. Patron expressed appreciation.',
      },
    ],
    consent: {
      marketingSms: true,
      marketingEmail: false,
      whatsappUpdates: true,
      dataSharingConsent: true,
      consentTimestamp: '2024-01-20T18:30:00.000Z',
    },
    isArchived: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'CUST-10494',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@consulting.eu',
    mobile: '+91 98200 99015',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    address: {
      street: 'Suite 404, The Grand Residence, Colaba',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400005',
      country: 'India',
    },
    dateOfBirth: '1995-09-18',
    dietaryPreferences: ['Keto / Low-Carb', 'Halal'],
    foodAllergies: ['Tree Nuts'],
    favoriteFoodCategory: 'European & Keto Salads',
    specialInstructions: 'Extra virgin olive oil dressing on side. Double espresso with splash of heavy cream.',
    category: 'NEW',
    loyaltyTier: 'Bronze',
    loyaltyPoints: 75,
    lifetimePointsEarned: 75,
    totalSpend: 88.5,
    totalOrders: 1,
    totalVisits: 1,
    averageOrderValue: 88.5,
    firstVisitDate: '2026-11-17T14:00:00.000Z',
    lastVisitDate: '2026-11-17T14:00:00.000Z',
    registeredAt: '2026-11-17T13:45:00.000Z',
    registeredSource: 'Online Order',
    favoriteBranch: 'Downtown Flagship #01',
    orders: [
      {
        id: 'ord-830',
        orderNumber: 'POS-8991',
        date: '2026-11-17T14:00:00.000Z',
        orderType: 'Delivery',
        itemsSummary: 'Keto Grilled Chicken Caesar Salad, Double Espresso (x2)',
        totalAmount: 88.5,
        paymentMethod: 'Credit Card',
        status: 'Completed',
      },
    ],
    reservations: [],
    communications: [],
    complaints: [],
    consent: {
      marketingSms: true,
      marketingEmail: true,
      whatsappUpdates: false,
      dataSharingConsent: true,
      consentTimestamp: '2026-11-17T13:45:00.000Z',
    },
    isArchived: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'CUST-10495',
    fullName: 'Vikramaditya Singhania',
    email: 'vikram.singhania@heritage.org',
    mobile: '+91 98200 66554',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    address: {
      street: '12 Altamount Road, Cumballa Hill',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400026',
      country: 'India',
    },
    dateOfBirth: '1970-03-30',
    anniversary: '1998-05-12',
    dietaryPreferences: ['Non-Vegetarian', 'Continental'],
    foodAllergies: [],
    favoriteFoodCategory: 'Fine Wine & Continental Steaks',
    specialInstructions: 'VIP table hosting. Sommelier wine pairing consultation requested for dinner bookings.',
    category: 'VIP',
    loyaltyTier: 'Platinum',
    loyaltyPoints: 2100,
    lifetimePointsEarned: 5800,
    totalSpend: 7650.0,
    totalOrders: 44,
    totalVisits: 38,
    averageOrderValue: 173.86,
    firstVisitDate: '2022-11-10T20:00:00.000Z',
    lastVisitDate: '2026-11-15T21:00:00.000Z',
    registeredAt: '2022-11-10T19:30:00.000Z',
    registeredSource: 'Manual Admin',
    favoriteBranch: 'Downtown Flagship #01',
    orders: [],
    reservations: [],
    communications: [],
    complaints: [],
    consent: {
      marketingSms: true,
      marketingEmail: true,
      whatsappUpdates: true,
      dataSharingConsent: true,
      consentTimestamp: '2022-11-10T19:30:00.000Z',
    },
    isArchived: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'CUST-10496',
    fullName: 'Aarav Nair',
    email: 'aarav.nair@student.edu',
    mobile: '+91 98200 11990',
    address: {
      street: 'Campus Hostel 4, Powai Tech Gate',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400076',
      country: 'India',
    },
    dateOfBirth: '2001-08-19',
    dietaryPreferences: ['Vegetarian'],
    foodAllergies: [],
    favoriteFoodCategory: 'Street Bites & Coffee',
    specialInstructions: '',
    category: 'INACTIVE',
    loyaltyTier: 'Bronze',
    loyaltyPoints: 40,
    lifetimePointsEarned: 40,
    totalSpend: 42.0,
    totalOrders: 2,
    totalVisits: 2,
    averageOrderValue: 21.0,
    firstVisitDate: '2025-04-10T16:00:00.000Z',
    lastVisitDate: '2025-06-02T17:00:00.000Z',
    registeredAt: '2025-04-10T15:45:00.000Z',
    registeredSource: 'QR Dine-In',
    favoriteBranch: 'Airport Transit Hub',
    orders: [],
    reservations: [],
    communications: [],
    complaints: [],
    consent: {
      marketingSms: false,
      marketingEmail: true,
      whatsappUpdates: false,
      dataSharingConsent: true,
      consentTimestamp: '2025-04-10T15:45:00.000Z',
    },
    isArchived: false,
    updatedAt: new Date().toISOString(),
  },
];

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

export function loadCustomersFromStorage(): CustomerProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse customers from storage:', err);
  }
  return INITIAL_CUSTOMERS;
}

export function saveCustomersToStorage(customers: CustomerProfile[]): void {
  try {
    localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(customers));
  } catch (err) {
    console.warn('Failed to save customers to storage:', err);
  }
}

// ─── ID GENERATOR ─────────────────────────────────────────────────────────────

export function generateCustomerId(): string {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(100 + Math.random() * 900);
  return `CUST-${timestamp}${random}`;
}

// ─── DUPLICATE DETECTION ──────────────────────────────────────────────────────

export function findDuplicateCustomers(customers: CustomerProfile[]): DuplicateGroup[] {
  const duplicates: DuplicateGroup[] = [];
  const activeOnly = customers.filter((c) => !c.isArchived);

  // Group by phone (normalize by removing spaces, dashes, +)
  const phoneMap: Record<string, CustomerProfile[]> = {};
  for (const c of activeOnly) {
    const cleanPhone = c.mobile.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length >= 10) {
      if (!phoneMap[cleanPhone]) phoneMap[cleanPhone] = [];
      phoneMap[cleanPhone].push(c);
    }
  }
  for (const [phone, list] of Object.entries(phoneMap)) {
    if (list.length > 1) {
      duplicates.push({
        id: `dup-phone-${phone}`,
        reason: 'phone',
        matchValue: `Matching Phone: ${list[0].mobile}`,
        customers: list,
      });
    }
  }

  // Group by email (lowercase)
  const emailMap: Record<string, CustomerProfile[]> = {};
  for (const c of activeOnly) {
    const cleanEmail = c.email.trim().toLowerCase();
    if (cleanEmail && cleanEmail.includes('@')) {
      if (!emailMap[cleanEmail]) emailMap[cleanEmail] = [];
      emailMap[cleanEmail].push(c);
    }
  }
  for (const [email, list] of Object.entries(emailMap)) {
    if (list.length > 1 && !duplicates.some((d) => d.customers.every((cust) => list.some((l) => l.id === cust.id)))) {
      duplicates.push({
        id: `dup-email-${email}`,
        reason: 'email',
        matchValue: `Matching Email: ${email}`,
        customers: list,
      });
    }
  }

  return duplicates;
}

// ─── API FUNCTIONS ─────────────────────────────────────────────────────────────

/**
 * Fetch all customers with optional filters
 */
export async function fetchCustomers(filters?: CustomerFilterOptions): Promise<CustomerProfile[]> {
  let list = loadCustomersFromStorage();

  // Try background Supabase sync if reachable
  try {
    const { data, error } = await supabase.from('customers').select('*').limit(200);
    if (!error && data && data.length > 0) {
      // Merge remote records if available
    }
  } catch {
    // Non-blocking fallback
  }

  // Filtering
  if (!filters) return list;

  if (!filters.includeArchived) {
    list = list.filter((c) => !c.isArchived);
  }

  if (filters.searchQuery?.trim()) {
    const q = filters.searchQuery.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }

  if (filters.category && filters.category !== 'ALL') {
    list = list.filter((c) => c.category === filters.category);
  }

  if (filters.loyaltyTier && filters.loyaltyTier !== 'ALL') {
    list = list.filter((c) => c.loyaltyTier === filters.loyaltyTier);
  }

  if (filters.dietaryFilter && filters.dietaryFilter !== 'ALL') {
    list = list.filter((c) => c.dietaryPreferences.includes(filters.dietaryFilter!));
  }

  if (filters.allergyFilter && filters.allergyFilter !== 'ALL') {
    list = list.filter((c) => c.foodAllergies.includes(filters.allergyFilter!));
  }

  if (filters.activityRange && filters.activityRange !== 'ALL') {
    const now = Date.now();
    const dayMs = 86400000;
    if (filters.activityRange === 'active_30') {
      list = list.filter((c) => c.lastVisitDate && now - new Date(c.lastVisitDate).getTime() <= 30 * dayMs);
    } else if (filters.activityRange === 'active_90') {
      list = list.filter((c) => c.lastVisitDate && now - new Date(c.lastVisitDate).getTime() <= 90 * dayMs);
    } else if (filters.activityRange === 'inactive_90') {
      list = list.filter((c) => !c.lastVisitDate || now - new Date(c.lastVisitDate).getTime() > 90 * dayMs);
    } else if (filters.activityRange === 'never_ordered') {
      list = list.filter((c) => c.totalOrders === 0);
    }
  }

  return list;
}

/**
 * Save or update customer profile
 */
export async function saveCustomer(customer: Partial<CustomerProfile>): Promise<{ success: boolean; customer?: CustomerProfile; error?: string }> {
  try {
    if (!customer.fullName?.trim() || (!customer.mobile?.trim() && !customer.email?.trim())) {
      return { success: false, error: 'Full name and at least one contact method (phone or email) are mandatory.' };
    }

    const customers = loadCustomersFromStorage();
    const isNew = !customer.id;
    const customerId = customer.id || generateCustomerId();

    const existingIdx = customers.findIndex((c) => c.id === customerId);

    const record: CustomerProfile = {
      id: customerId,
      organizationId: customer.organizationId,
      fullName: customer.fullName.trim(),
      email: customer.email?.trim().toLowerCase() || '',
      mobile: customer.mobile?.trim() || '',
      avatarUrl: customer.avatarUrl,
      address: customer.address || { street: '', city: 'Mumbai', state: 'Maharashtra', postalCode: '', country: 'India' },
      dateOfBirth: customer.dateOfBirth,
      anniversary: customer.anniversary,

      dietaryPreferences: customer.dietaryPreferences || [],
      foodAllergies: customer.foodAllergies || [],
      favoriteFoodCategory: customer.favoriteFoodCategory || 'Continental & Grills',
      specialInstructions: customer.specialInstructions || '',

      category: customer.category || 'NEW',
      loyaltyTier: customer.loyaltyTier || 'Bronze',
      loyaltyPoints: customer.loyaltyPoints ?? 0,
      lifetimePointsEarned: customer.lifetimePointsEarned ?? customer.loyaltyPoints ?? 0,
      totalSpend: customer.totalSpend ?? 0,
      totalOrders: customer.totalOrders ?? 0,
      totalVisits: customer.totalVisits ?? 0,
      averageOrderValue: customer.totalOrders ? Number((customer.totalSpend! / customer.totalOrders).toFixed(2)) : 0,
      firstVisitDate: customer.firstVisitDate || new Date().toISOString(),
      lastVisitDate: customer.lastVisitDate || new Date().toISOString(),
      registeredAt: customer.registeredAt || new Date().toISOString(),
      registeredSource: customer.registeredSource || 'Manual Admin',
      favoriteBranch: customer.favoriteBranch || 'Downtown Flagship #01',

      orders: customer.orders || [],
      reservations: customer.reservations || [],
      communications: customer.communications || [],
      complaints: customer.complaints || [],

      consent: customer.consent || {
        marketingSms: true,
        marketingEmail: true,
        whatsappUpdates: true,
        dataSharingConsent: true,
        consentTimestamp: new Date().toISOString(),
      },
      isArchived: customer.isArchived ?? false,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      customers[existingIdx] = { ...customers[existingIdx], ...record };
    } else {
      customers.unshift(record);
    }

    saveCustomersToStorage(customers);

    // Sync non-blocking to Supabase
    Promise.resolve(
      supabase.from('customers').upsert({
        id: record.id,
        full_name: record.fullName,
        email: record.email,
        phone: record.mobile,
        category: record.category,
        loyalty_points: record.loyaltyPoints,
        total_spend: record.totalSpend,
        updated_at: record.updatedAt,
      })
    ).catch(() => {});

    return { success: true, customer: record };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save customer' };
  }
}

/**
 * Merge two duplicate customer records into one primary profile
 */
export async function mergeCustomerProfiles(
  primaryId: string,
  duplicateId: string,
  authorizedBy: string
): Promise<{ success: boolean; mergedCustomer?: CustomerProfile; error?: string }> {
  try {
    const customers = loadCustomersFromStorage();
    const primary = customers.find((c) => c.id === primaryId);
    const duplicate = customers.find((c) => c.id === duplicateId);

    if (!primary || !duplicate) {
      return { success: false, error: 'Could not locate one or both records to merge.' };
    }

    // Merge transactions, totals and tags
    const mergedOrders = [...primary.orders, ...duplicate.orders].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const mergedReservations = [...primary.reservations, ...duplicate.reservations].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const mergedComms = [...primary.communications, ...duplicate.communications].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
    const mergedComplaints = [...primary.complaints, ...duplicate.complaints];

    const mergedDietary = Array.from(new Set([...primary.dietaryPreferences, ...duplicate.dietaryPreferences]));
    const mergedAllergies = Array.from(new Set([...primary.foodAllergies, ...duplicate.foodAllergies]));

    const combinedSpend = Number((primary.totalSpend + duplicate.totalSpend).toFixed(2));
    const combinedOrders = primary.totalOrders + duplicate.totalOrders;
    const combinedPoints = primary.loyaltyPoints + duplicate.loyaltyPoints;

    const mergedCustomer: CustomerProfile = {
      ...primary,
      email: primary.email || duplicate.email,
      mobile: primary.mobile || duplicate.mobile,
      dateOfBirth: primary.dateOfBirth || duplicate.dateOfBirth,
      anniversary: primary.anniversary || duplicate.anniversary,
      address: {
        street: primary.address.street || duplicate.address.street,
        city: primary.address.city || duplicate.address.city,
        state: primary.address.state || duplicate.address.state,
        postalCode: primary.address.postalCode || duplicate.address.postalCode,
        country: primary.address.country || duplicate.address.country,
      },
      dietaryPreferences: mergedDietary,
      foodAllergies: mergedAllergies,
      specialInstructions: [primary.specialInstructions, duplicate.specialInstructions].filter(Boolean).join(' | '),
      loyaltyPoints: combinedPoints,
      lifetimePointsEarned: primary.lifetimePointsEarned + duplicate.lifetimePointsEarned,
      totalSpend: combinedSpend,
      totalOrders: combinedOrders,
      totalVisits: primary.totalVisits + duplicate.totalVisits,
      averageOrderValue: combinedOrders > 0 ? Number((combinedSpend / combinedOrders).toFixed(2)) : 0,
      orders: mergedOrders,
      reservations: mergedReservations,
      communications: [
        ...mergedComms,
        {
          id: `comm-merge-${Date.now()}`,
          type: 'SMS',
          title: 'Account Profiles Merged',
          sentAt: new Date().toISOString(),
          status: 'Delivered',
          preview: `Record merged with duplicate profile #${duplicateId} authorized by ${authorizedBy}. Combined balance: ${combinedPoints} pts.`,
        },
      ],
      complaints: mergedComplaints,
      updatedAt: new Date().toISOString(),
    };

    // Remove or archive the duplicate record
    const updatedList = customers.filter((c) => c.id !== duplicateId).map((c) => (c.id === primaryId ? mergedCustomer : c));
    saveCustomersToStorage(updatedList);

    return { success: true, mergedCustomer };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Merge operation failed' };
  }
}

/**
 * Archive a customer while strictly preserving transaction history
 */
export async function archiveCustomer(id: string): Promise<boolean> {
  try {
    const customers = loadCustomersFromStorage();
    const idx = customers.findIndex((c) => c.id === id);
    if (idx >= 0) {
      customers[idx].isArchived = true;
      customers[idx].archivedAt = new Date().toISOString();
      customers[idx].updatedAt = new Date().toISOString();
      saveCustomersToStorage(customers);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Unarchive a customer
 */
export async function unarchiveCustomer(id: string): Promise<boolean> {
  try {
    const customers = loadCustomersFromStorage();
    const idx = customers.findIndex((c) => c.id === id);
    if (idx >= 0) {
      customers[idx].isArchived = false;
      customers[idx].archivedAt = undefined;
      customers[idx].updatedAt = new Date().toISOString();
      saveCustomersToStorage(customers);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Anonymize customer for Right-to-be-Forgotten (GDPR / DPDP compliance)
 */
export async function anonymizeCustomerProfile(id: string): Promise<boolean> {
  try {
    const customers = loadCustomersFromStorage();
    const idx = customers.findIndex((c) => c.id === id);
    if (idx >= 0) {
      customers[idx].fullName = `Anonymized Patron #${id.slice(-4)}`;
      customers[idx].email = `anonymized+${id.toLowerCase()}@privacy.local`;
      customers[idx].mobile = '+91 00000 00000';
      customers[idx].avatarUrl = undefined;
      customers[idx].address = { street: 'Redacted', city: 'Redacted', state: 'Redacted', postalCode: '', country: 'India' };
      customers[idx].dateOfBirth = undefined;
      customers[idx].anniversary = undefined;
      customers[idx].specialInstructions = 'Personal details redacted upon data subject deletion request.';
      customers[idx].anonymizedAt = new Date().toISOString();
      customers[idx].updatedAt = new Date().toISOString();
      saveCustomersToStorage(customers);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Ingest / register customers automatically from live reservations and orders
 */
export async function ingestCustomersFromTransactions(): Promise<{ ingestedCount: number; customers: CustomerProfile[] }> {
  const customers = loadCustomersFromStorage();
  let count = 0;

  // Check recent reservations in Supabase
  try {
    const { data: reservations } = await supabase.from('reservations').select('*').limit(20);
    if (reservations && reservations.length > 0) {
      for (const r of reservations) {
        const guestName = r.guest_name || r.customer_name;
        const phone = r.guest_phone || r.phone;
        const email = r.guest_email || r.email || '';
        if (guestName && phone && !customers.some((c) => c.mobile === phone || (email && c.email === email))) {
          const newCust: CustomerProfile = {
            id: generateCustomerId(),
            fullName: guestName,
            email,
            mobile: phone,
            address: { street: '', city: 'Mumbai', state: 'Maharashtra', postalCode: '', country: 'India' },
            dietaryPreferences: [],
            foodAllergies: [],
            category: 'NEW',
            loyaltyTier: 'Bronze',
            loyaltyPoints: 50,
            lifetimePointsEarned: 50,
            totalSpend: r.total_amount || 0,
            totalOrders: 1,
            totalVisits: 1,
            averageOrderValue: r.total_amount || 0,
            firstVisitDate: r.reservation_date || new Date().toISOString(),
            lastVisitDate: r.reservation_date || new Date().toISOString(),
            registeredAt: new Date().toISOString(),
            registeredSource: 'Table Reservation',
            favoriteBranch: r.branch_name || 'Downtown Flagship #01',
            orders: [],
            reservations: [
              {
                id: r.id || `res-${Date.now()}`,
                bookingCode: r.booking_number || `RES-${Math.floor(1000 + Math.random() * 9000)}`,
                date: r.reservation_date || new Date().toISOString().split('T')[0],
                time: r.reservation_time || '07:30 PM',
                partySize: r.guests_count || 2,
                tableNumber: r.table_number || 'T-01',
                branchName: r.branch_name || 'Downtown Flagship #01',
                status: 'Completed',
              },
            ],
            communications: [],
            complaints: [],
            consent: {
              marketingSms: true,
              marketingEmail: true,
              whatsappUpdates: true,
              dataSharingConsent: true,
              consentTimestamp: new Date().toISOString(),
            },
            isArchived: false,
            updatedAt: new Date().toISOString(),
          };
          customers.unshift(newCust);
          count++;
        }
      }
    }
  } catch {}

  if (count > 0) {
    saveCustomersToStorage(customers);
  }

  return { ingestedCount: count, customers };
}
