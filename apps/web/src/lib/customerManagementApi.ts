import { supabase } from './supabase';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type CustomerCategory = 'NEW' | 'REGULAR' | 'VIP' | 'INACTIVE';
export type CustomerStatus = 'Active' | 'Inactive';
export type CustomerGender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';
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

export interface CustomerActivityItem {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  performer?: string;
}

export interface CustomerConsentPreferences {
  marketingSms: boolean;
  marketingEmail: boolean;
  whatsappUpdates: boolean;
  dataSharingConsent: boolean;
  consentTimestamp: string;
}

export interface CustomerProfile {
  id: string; // e.g. "CUST-10491"
  organizationId?: string;
  fullName: string;
  email: string;
  mobile: string;
  alternateMobile?: string;
  gender?: CustomerGender;
  avatarUrl?: string;
  address: CustomerAddress;
  dateOfBirth?: string; // YYYY-MM-DD
  anniversary?: string; // YYYY-MM-DD

  // Operational Status & Notes
  status: CustomerStatus;
  customerNotes?: string;
  preferredFoodItems?: string[];

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
  activityHistory: CustomerActivityItem[];

  // Consent & Compliance
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
  status?: CustomerStatus | 'ALL';
  category?: CustomerCategory | 'ALL';
  loyaltyTier?: LoyaltyTier | 'ALL';
  city?: string | 'ALL';
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
    alternateMobile: '+91 98200 88211',
    gender: 'Male',
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
    status: 'Active',
    customerNotes: 'VIP patron. Enjoys fine wines and asks for quiet corner booths. Celebrates anniversary in late Nov.',
    preferredFoodItems: ['Pan-seared Chilean Seabass', 'Truffle Sourdough', 'Sparkling San Pellegrino'],
    dietaryPreferences: ['Pescatarian', 'Organic Only'],
    foodAllergies: ['Shellfish', 'Lactose Intolerant'],
    favoriteFoodCategory: 'Continental & Grills',
    specialInstructions: 'Prefers quiet corner booth. Sparkling water without ice.',
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
    ],
    communications: [
      {
        id: 'comm-101',
        type: 'WhatsApp',
        title: 'Table Confirmed RES-9824',
        sentAt: '2026-11-18T10:00:00.000Z',
        status: 'Delivered',
        preview: 'Hi Alexander, table for 4 at Downtown Flagship is confirmed for 20 Nov at 8:00 PM.',
      },
    ],
    complaints: [],
    activityHistory: [
      { id: 'act-1', action: 'Table Reservation Completed', timestamp: '2026-11-20T20:00:00.000Z', details: 'Dined at Downtown Flagship #01 (Table T-04)' },
      { id: 'act-2', action: 'Order POS-8902 Paid', timestamp: '2026-11-16T20:15:00.000Z', details: 'Paid $184.50 via Amex Card' },
      { id: 'act-3', action: 'Profile Created', timestamp: '2023-02-14T18:00:00.000Z', details: 'Auto-registered via Table Reservation' },
    ],
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
    fullName: 'Meera Kapadia',
    email: 'meera.kapadia@designstudio.in',
    mobile: '+91 98200 44122',
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    address: {
      street: '72 Pali Hill, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
      country: 'India',
    },
    dateOfBirth: '1992-09-05',
    status: 'Active',
    customerNotes: 'Regular weekend patron. Loves oat milk cappuccinos and gluten-free pastries.',
    preferredFoodItems: ['Oat Milk Cappuccino', 'Almond Croissant', 'Avocado Sourdough Toast'],
    dietaryPreferences: ['Vegan', 'Gluten-Free'],
    foodAllergies: ['Gluten / Celiac'],
    favoriteFoodCategory: 'Artisanal Bakery & Specialty Coffee',
    specialInstructions: 'Strictly gluten-free cross-contamination protocol requested.',
    category: 'REGULAR',
    loyaltyTier: 'Gold',
    loyaltyPoints: 680,
    lifetimePointsEarned: 1420,
    totalSpend: 1640.0,
    totalOrders: 24,
    totalVisits: 22,
    averageOrderValue: 68.33,
    firstVisitDate: '2023-08-10T11:00:00.000Z',
    lastVisitDate: '2026-11-17T15:30:00.000Z',
    registeredAt: '2023-08-10T10:45:00.000Z',
    registeredSource: 'QR Dine-In',
    favoriteBranch: 'Downtown Flagship #01',
    orders: [
      {
        id: 'ord-804',
        orderNumber: 'POS-8941',
        date: '2026-11-17T15:30:00.000Z',
        orderType: 'Takeaway',
        itemsSummary: 'Oat Milk Flat White (x2), Gluten-free Raspberry Tart',
        totalAmount: 28.5,
        paymentMethod: 'UPI',
        status: 'Completed',
      },
    ],
    reservations: [],
    communications: [],
    complaints: [],
    activityHistory: [
      { id: 'act-21', action: 'Takeaway Order POS-8941', timestamp: '2026-11-17T15:30:00.000Z', details: '$28.50 paid via UPI' },
      { id: 'act-22', action: 'Profile Created', timestamp: '2023-08-10T10:45:00.000Z', details: 'Registered via QR Dine-in' },
    ],
    consent: {
      marketingSms: true,
      marketingEmail: true,
      whatsappUpdates: true,
      dataSharingConsent: true,
      consentTimestamp: '2023-08-10T10:45:00.000Z',
    },
    isArchived: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'CUST-10493',
    fullName: 'Rajesh Chawla',
    email: 'rajesh.chawla@globalfoods.com',
    mobile: '+91 98200 77112',
    alternateMobile: '+91 98200 77119',
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    address: {
      street: '402 High Street, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'India',
    },
    dateOfBirth: '1978-12-03',
    status: 'Active',
    customerNotes: 'Corporate account diner. Hosts business luncheons.',
    preferredFoodItems: ['Butter Chicken Ravioli', 'Smoked Garlic Naan', 'Masala Chai Gelato'],
    dietaryPreferences: ['Non-Vegetarian'],
    foodAllergies: [],
    favoriteFoodCategory: 'Modern Indian Fusion',
    specialInstructions: 'Prefers quiet seating and itemized tax invoice for corporate claims.',
    category: 'VIP',
    loyaltyTier: 'Gold',
    loyaltyPoints: 890,
    lifetimePointsEarned: 2150,
    totalSpend: 2890.0,
    totalOrders: 18,
    totalVisits: 16,
    averageOrderValue: 160.55,
    firstVisitDate: '2024-01-20T13:00:00.000Z',
    lastVisitDate: '2026-11-10T14:00:00.000Z',
    registeredAt: '2024-01-20T12:30:00.000Z',
    registeredSource: 'Online Order',
    favoriteBranch: 'Downtown Flagship #01',
    orders: [],
    reservations: [],
    communications: [],
    complaints: [],
    activityHistory: [
      { id: 'act-31', action: 'Business Lunch Order', timestamp: '2026-11-10T14:00:00.000Z', details: '$180.00 order completed' },
    ],
    consent: {
      marketingSms: true,
      marketingEmail: true,
      whatsappUpdates: true,
      dataSharingConsent: true,
      consentTimestamp: '2024-01-20T12:30:00.000Z',
    },
    isArchived: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'CUST-10494',
    fullName: 'Sara Al-Mansoor',
    email: 'sara.almansoor@gulfcapital.ae',
    mobile: '+971 50 123 4567',
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    address: {
      street: 'Villa 18, Palm Jumeirah Crescent',
      city: 'Dubai',
      state: 'Dubai',
      postalCode: '00000',
      country: 'UAE',
    },
    dateOfBirth: '1989-04-22',
    status: 'Active',
    customerNotes: 'International diner. Prefers halal preparation.',
    preferredFoodItems: ['Saffron Risotto', 'Pistachio Baklava Crème'],
    dietaryPreferences: ['Halal'],
    foodAllergies: [],
    favoriteFoodCategory: 'Mediterranean & Pastry',
    specialInstructions: 'Strictly Halal ingredients required.',
    category: 'NEW',
    loyaltyTier: 'Silver',
    loyaltyPoints: 120,
    lifetimePointsEarned: 120,
    totalSpend: 340.0,
    totalOrders: 3,
    totalVisits: 3,
    averageOrderValue: 113.33,
    firstVisitDate: '2026-11-01T20:00:00.000Z',
    lastVisitDate: '2026-11-15T21:00:00.000Z',
    registeredAt: '2026-11-01T19:30:00.000Z',
    registeredSource: 'Online Order',
    favoriteBranch: 'Downtown Flagship #01',
    orders: [],
    reservations: [],
    communications: [],
    complaints: [],
    activityHistory: [
      { id: 'act-41', action: 'Online Order Delivered', timestamp: '2026-11-15T21:00:00.000Z', details: '$115.00 order delivered' },
    ],
    consent: {
      marketingSms: true,
      marketingEmail: true,
      whatsappUpdates: true,
      dataSharingConsent: true,
      consentTimestamp: '2026-11-01T19:30:00.000Z',
    },
    isArchived: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'CUST-10495',
    fullName: 'Vikramaditya Singhania',
    email: 'vikram.singhania@heritage.org',
    mobile: '+91 98200 66554',
    gender: 'Male',
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
    status: 'Active',
    customerNotes: 'Top spender in the network. Sommelier wine pairing consultation requested for dinner bookings.',
    preferredFoodItems: ['Grilled Wagyu Tenderloin', 'Reserve Cabernet Sauvignon'],
    dietaryPreferences: ['Non-Vegetarian', 'Continental'],
    foodAllergies: [],
    favoriteFoodCategory: 'Fine Wine & Continental Steaks',
    specialInstructions: 'VIP table hosting. Sommelier consultation.',
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
    activityHistory: [
      { id: 'act-51', action: 'Fine Dining Dinner', timestamp: '2026-11-15T21:00:00.000Z', details: '$320.00 check settled' },
    ],
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
    gender: 'Male',
    address: {
      street: 'Campus Hostel 4, Powai Tech Gate',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400076',
      country: 'India',
    },
    dateOfBirth: '2001-08-19',
    status: 'Inactive',
    customerNotes: 'Dormant student patron. Last visited over 5 months ago.',
    preferredFoodItems: ['Iced Americano', 'Cheese Garlic Bread'],
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
    activityHistory: [
      { id: 'act-61', action: 'Account Marked Inactive', timestamp: '2025-09-01T00:00:00.000Z', details: 'Dormant for over 90 days' },
    ],
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: any) => ({
          ...c,
          status: c.status || (c.isArchived || c.category === 'INACTIVE' ? 'Inactive' : 'Active'),
          activityHistory: c.activityHistory || [],
        }));
      }
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

// ─── DUPLICATE DETECTION & VALIDATION ─────────────────────────────────────────

export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-10);
}

export function findDuplicateCustomers(customers: CustomerProfile[]): DuplicateGroup[] {
  const duplicates: DuplicateGroup[] = [];
  const activeOnly = customers.filter((c) => !c.isArchived);

  // Group by phone
  const phoneMap: Record<string, CustomerProfile[]> = {};
  for (const c of activeOnly) {
    const cleanPhone = normalizePhone(c.mobile);
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

  // Group by email
  const emailMap: Record<string, CustomerProfile[]> = {};
  for (const c of activeOnly) {
    const cleanEmail = c.email?.trim().toLowerCase();
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

  // Try live Supabase sync in background
  try {
    const { data: remoteData } = await supabase.from('Client').select('*').limit(100);
    if (remoteData && remoteData.length > 0) {
      for (const r of remoteData) {
        if (!list.some((l) => l.id === r.clientCode || l.email === r.email)) {
          list.push({
            id: r.clientCode || `CUST-${r.id.substring(0, 6)}`,
            organizationId: r.organizationId,
            fullName: r.name || 'Patron',
            email: r.email || '',
            mobile: r.phone || '',
            status: r.status === 'ACTIVE' ? 'Active' : 'Inactive',
            address: {
              street: r.address || '',
              city: r.city || 'Mumbai',
              state: r.state || '',
              postalCode: '',
              country: r.country || 'India',
            },
            category: (r.category as any) || 'REGULAR',
            loyaltyTier: 'Bronze',
            loyaltyPoints: 0,
            lifetimePointsEarned: 0,
            totalSpend: Number(r.lifetimeValue) || 0,
            totalOrders: 1,
            totalVisits: 1,
            averageOrderValue: Number(r.lifetimeValue) || 0,
            firstVisitDate: r.createdAt || new Date().toISOString(),
            lastVisitDate: r.updatedAt || new Date().toISOString(),
            registeredAt: r.createdAt || new Date().toISOString(),
            registeredSource: 'Manual Admin',
            favoriteBranch: 'Downtown Flagship #01',
            dietaryPreferences: [],
            foodAllergies: [],
            orders: [],
            reservations: [],
            communications: [],
            complaints: [],
            activityHistory: [],
            consent: {
              marketingSms: true,
              marketingEmail: true,
              whatsappUpdates: true,
              dataSharingConsent: true,
              consentTimestamp: r.createdAt || new Date().toISOString(),
            },
            isArchived: false,
            updatedAt: r.updatedAt || new Date().toISOString(),
          });
        }
      }
      saveCustomersToStorage(list);
    }
  } catch {
    // Graceful fallback to storage
  }

  if (!filters) return list;

  if (!filters.includeArchived) {
    list = list.filter((c) => !c.isArchived);
  }

  if (filters.status && filters.status !== 'ALL') {
    list = list.filter((c) => c.status === filters.status);
  }

  if (filters.searchQuery?.trim()) {
    const q = filters.searchQuery.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.alternateMobile && c.alternateMobile.includes(q)) ||
        c.id.toLowerCase().includes(q) ||
        (c.address.city && c.address.city.toLowerCase().includes(q))
    );
  }

  if (filters.category && filters.category !== 'ALL') {
    list = list.filter((c) => c.category === filters.category);
  }

  if (filters.loyaltyTier && filters.loyaltyTier !== 'ALL') {
    list = list.filter((c) => c.loyaltyTier === filters.loyaltyTier);
  }

  if (filters.city && filters.city !== 'ALL') {
    list = list.filter((c) => c.address.city.toLowerCase() === filters.city!.toLowerCase());
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
 * Save or update customer profile with duplicate validation
 */
export async function saveCustomer(
  customer: Partial<CustomerProfile>
): Promise<{ success: boolean; customer?: CustomerProfile; error?: string }> {
  try {
    if (!customer.fullName?.trim()) {
      return { success: false, error: 'Full name is mandatory.' };
    }
    if (!customer.mobile?.trim() && !customer.email?.trim()) {
      return { success: false, error: 'At least one contact method (phone or email) is mandatory.' };
    }

    const customers = loadCustomersFromStorage();
    const isNew = !customer.id;
    const customerId = customer.id || generateCustomerId();

    // ─── Duplicate validation check (Phone and Email) ───
    const inputPhoneClean = normalizePhone(customer.mobile);
    const inputEmailClean = customer.email?.trim().toLowerCase();

    const dupPhone = customers.find(
      (c) => c.id !== customerId && !c.isArchived && inputPhoneClean && normalizePhone(c.mobile) === inputPhoneClean
    );
    if (dupPhone) {
      return {
        success: false,
        error: `Duplicate Error: Mobile number ${customer.mobile} is already registered to ${dupPhone.fullName} (${dupPhone.id}).`,
      };
    }

    const dupEmail = customers.find(
      (c) => c.id !== customerId && !c.isArchived && inputEmailClean && c.email.trim().toLowerCase() === inputEmailClean
    );
    if (dupEmail) {
      return {
        success: false,
        error: `Duplicate Error: Email address ${customer.email} is already registered to ${dupEmail.fullName} (${dupEmail.id}).`,
      };
    }

    const existingIdx = customers.findIndex((c) => c.id === customerId);
    const existing = existingIdx >= 0 ? customers[existingIdx] : null;

    const activityHistory: CustomerActivityItem[] = existing?.activityHistory ? [...existing.activityHistory] : [];
    if (isNew) {
      activityHistory.unshift({
        id: `act-${Date.now()}`,
        action: 'Account Created',
        timestamp: new Date().toISOString(),
        details: `Customer registered via ${customer.registeredSource || 'Manual Admin'}.`,
      });
    } else {
      activityHistory.unshift({
        id: `act-${Date.now()}`,
        action: 'Profile Updated',
        timestamp: new Date().toISOString(),
        details: 'Customer profile details updated in CRM.',
      });
    }

    const record: CustomerProfile = {
      id: customerId,
      organizationId: customer.organizationId || existing?.organizationId,
      fullName: customer.fullName.trim(),
      email: customer.email?.trim().toLowerCase() || '',
      mobile: customer.mobile?.trim() || '',
      alternateMobile: customer.alternateMobile?.trim() || '',
      gender: customer.gender || existing?.gender || 'Prefer not to say',
      avatarUrl: customer.avatarUrl || existing?.avatarUrl,
      address: customer.address || existing?.address || { street: '', city: 'Mumbai', state: 'Maharashtra', postalCode: '', country: 'India' },
      dateOfBirth: customer.dateOfBirth || existing?.dateOfBirth,
      anniversary: customer.anniversary || existing?.anniversary,

      status: customer.status || existing?.status || 'Active',
      customerNotes: customer.customerNotes ?? existing?.customerNotes ?? '',
      preferredFoodItems: customer.preferredFoodItems || existing?.preferredFoodItems || [],

      dietaryPreferences: customer.dietaryPreferences || existing?.dietaryPreferences || [],
      foodAllergies: customer.foodAllergies || existing?.foodAllergies || [],
      favoriteFoodCategory: customer.favoriteFoodCategory || existing?.favoriteFoodCategory || 'Continental & Grills',
      specialInstructions: customer.specialInstructions ?? existing?.specialInstructions ?? '',

      category: customer.category || existing?.category || 'NEW',
      loyaltyTier: customer.loyaltyTier || existing?.loyaltyTier || 'Bronze',
      loyaltyPoints: customer.loyaltyPoints ?? existing?.loyaltyPoints ?? 0,
      lifetimePointsEarned: customer.lifetimePointsEarned ?? existing?.lifetimePointsEarned ?? customer.loyaltyPoints ?? 0,
      totalSpend: customer.totalSpend ?? existing?.totalSpend ?? 0,
      totalOrders: customer.totalOrders ?? existing?.totalOrders ?? 0,
      totalVisits: customer.totalVisits ?? existing?.totalVisits ?? 0,
      averageOrderValue:
        customer.totalOrders && customer.totalSpend
          ? Number((customer.totalSpend / customer.totalOrders).toFixed(2))
          : existing?.averageOrderValue ?? 0,
      firstVisitDate: customer.firstVisitDate || existing?.firstVisitDate || new Date().toISOString(),
      lastVisitDate: customer.lastVisitDate || existing?.lastVisitDate || new Date().toISOString(),
      registeredAt: customer.registeredAt || existing?.registeredAt || new Date().toISOString(),
      registeredSource: customer.registeredSource || existing?.registeredSource || 'Manual Admin',
      favoriteBranch: customer.favoriteBranch || existing?.favoriteBranch || 'Downtown Flagship #01',

      orders: customer.orders || existing?.orders || [],
      reservations: customer.reservations || existing?.reservations || [],
      communications: customer.communications || existing?.communications || [],
      complaints: customer.complaints || existing?.complaints || [],
      activityHistory,

      consent: customer.consent || existing?.consent || {
        marketingSms: true,
        marketingEmail: true,
        whatsappUpdates: true,
        dataSharingConsent: true,
        consentTimestamp: new Date().toISOString(),
      },
      isArchived: customer.isArchived ?? existing?.isArchived ?? false,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      customers[existingIdx] = record;
    } else {
      customers.unshift(record);
    }

    saveCustomersToStorage(customers);

    // Sync to Supabase non-blocking
    Promise.resolve(
      supabase.from('Client').upsert({
        id: record.id.startsWith('CUST-') ? '00000000-0000-0000-0000-' + record.id.replace('CUST-', '').padStart(12, '0') : record.id,
        clientCode: record.id,
        name: record.fullName,
        email: record.email,
        phone: record.mobile,
        address: record.address.street,
        city: record.address.city,
        state: record.address.state,
        country: record.address.country,
        status: record.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
        updatedAt: record.updatedAt,
      })
    ).catch(() => {});

    return { success: true, customer: record };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save customer' };
  }
}

/**
 * Toggle Active / Inactive Status
 */
export async function toggleCustomerStatus(
  id: string
): Promise<{ success: boolean; customer?: CustomerProfile; error?: string }> {
  try {
    const customers = loadCustomersFromStorage();
    const idx = customers.findIndex((c) => c.id === id);
    if (idx < 0) return { success: false, error: 'Customer not found' };

    const newStatus: CustomerStatus = customers[idx].status === 'Active' ? 'Inactive' : 'Active';
    customers[idx].status = newStatus;
    customers[idx].updatedAt = new Date().toISOString();

    if (!customers[idx].activityHistory) customers[idx].activityHistory = [];
    customers[idx].activityHistory.unshift({
      id: `act-${Date.now()}`,
      action: `Status changed to ${newStatus}`,
      timestamp: new Date().toISOString(),
      details: `Account status updated to ${newStatus}.`,
    });

    saveCustomersToStorage(customers);
    return { success: true, customer: customers[idx] };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to toggle status' };
  }
}

/**
 * Delete a customer profile with dependency checks
 */
export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const customers = loadCustomersFromStorage();
    const idx = customers.findIndex((c) => c.id === id);
    if (idx < 0) return { success: false, error: 'Customer not found' };

    const target = customers[idx];
    const hasActiveReservations = target.reservations?.some((r) => r.status === 'Seated');
    if (hasActiveReservations) {
      return {
        success: false,
        error: `Cannot delete patron ${target.fullName}: Customer currently has an active seated reservation on the floor.`,
      };
    }

    const filtered = customers.filter((c) => c.id !== id);
    saveCustomersToStorage(filtered);

    // Sync deletion to Supabase
    Promise.resolve(
      supabase.from('Client').delete().eq('clientCode', id)
    ).catch(() => {});

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete customer' };
  }
}

/**
 * Import customers from raw CSV text
 */
export async function importCustomersFromCSV(
  csvText: string
): Promise<{ success: boolean; importedCount: number; errors: string[] }> {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { success: false, importedCount: 0, errors: ['CSV file is empty or missing data rows.'] };
  }

  const header = lines[0].toLowerCase();
  const errors: string[] = [];
  let importedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser supporting quotes
    const parts = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
    const fullName = parts[0] || parts[1];
    const email = parts.find((p) => p.includes('@')) || '';
    const mobile = parts.find((p) => /^[+0-9\s-]{8,15}$/.test(p)) || '';
    const city = parts[3] || 'Mumbai';

    if (!fullName) {
      errors.push(`Row ${i + 1}: Missing customer name.`);
      continue;
    }
    if (!email && !mobile) {
      errors.push(`Row ${i + 1} (${fullName}): Missing both email and mobile.`);
      continue;
    }

    const res = await saveCustomer({
      fullName,
      email,
      mobile,
      address: { street: '', city, state: '', postalCode: '', country: 'India' },
      registeredSource: 'Manual Admin',
      status: 'Active',
      category: 'NEW',
    });

    if (res.success) {
      importedCount++;
    } else {
      errors.push(`Row ${i + 1} (${fullName}): ${res.error}`);
    }
  }

  return {
    success: importedCount > 0,
    importedCount,
    errors,
  };
}

/**
 * Export customers to CSV
 */
export function exportCustomersToCSV(customers: CustomerProfile[]): string {
  const headers = [
    'Customer ID',
    'Full Name',
    'Status',
    'Email',
    'Mobile',
    'Alternate Mobile',
    'Gender',
    'City',
    'Category',
    'Loyalty Tier',
    'Loyalty Points',
    'Total Spend ($)',
    'Total Orders',
    'Total Visits',
    'AOV ($)',
    'Registered Date',
    'Last Visit Date',
    'Dietary Preferences',
    'Food Allergies',
    'Customer Notes',
  ];

  const rows = customers.map((c) => [
    c.id,
    `"${c.fullName.replace(/"/g, '""')}"`,
    c.status,
    c.email,
    c.mobile,
    c.alternateMobile || '',
    c.gender || '',
    `"${c.address.city.replace(/"/g, '""')}"`,
    c.category,
    c.loyaltyTier,
    c.loyaltyPoints,
    c.totalSpend.toFixed(2),
    c.totalOrders,
    c.totalVisits,
    c.averageOrderValue.toFixed(2),
    c.registeredAt.split('T')[0],
    c.lastVisitDate ? c.lastVisitDate.split('T')[0] : '',
    `"${c.dietaryPreferences.join(', ')}"`,
    `"${c.foodAllergies.join(', ')}"`,
    `"${(c.customerNotes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
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

    const combinedSpend = Number((primary.totalSpend + duplicate.totalSpend).toFixed(2));
    const combinedOrders = primary.totalOrders + duplicate.totalOrders;
    const combinedPoints = primary.loyaltyPoints + duplicate.loyaltyPoints;

    const mergedCustomer: CustomerProfile = {
      ...primary,
      email: primary.email || duplicate.email,
      mobile: primary.mobile || duplicate.mobile,
      alternateMobile: primary.alternateMobile || duplicate.alternateMobile,
      dateOfBirth: primary.dateOfBirth || duplicate.dateOfBirth,
      anniversary: primary.anniversary || duplicate.anniversary,
      loyaltyPoints: combinedPoints,
      totalSpend: combinedSpend,
      totalOrders: combinedOrders,
      totalVisits: primary.totalVisits + duplicate.totalVisits,
      averageOrderValue: combinedOrders > 0 ? Number((combinedSpend / combinedOrders).toFixed(2)) : 0,
      customerNotes: [primary.customerNotes, duplicate.customerNotes].filter(Boolean).join(' | '),
      activityHistory: [
        {
          id: `act-merge-${Date.now()}`,
          action: 'Profiles Merged',
          timestamp: new Date().toISOString(),
          details: `Merged with duplicate profile #${duplicateId} authorized by ${authorizedBy}.`,
        },
        ...(primary.activityHistory || []),
      ],
      updatedAt: new Date().toISOString(),
    };

    const updatedList = customers.filter((c) => c.id !== duplicateId).map((c) => (c.id === primaryId ? mergedCustomer : c));
    saveCustomersToStorage(updatedList);

    return { success: true, mergedCustomer };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Merge operation failed' };
  }
}

/**
 * Archive a customer
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
 * Anonymize customer profile (Right to be Forgotten)
 */
export async function anonymizeCustomerProfile(id: string): Promise<boolean> {
  try {
    const customers = loadCustomersFromStorage();
    const idx = customers.findIndex((c) => c.id === id);
    if (idx >= 0) {
      customers[idx].fullName = `Anonymized Patron #${id.slice(-4)}`;
      customers[idx].email = `anonymized+${id.toLowerCase()}@privacy.local`;
      customers[idx].mobile = '+91 00000 00000';
      customers[idx].alternateMobile = undefined;
      customers[idx].avatarUrl = undefined;
      customers[idx].address = { street: 'Redacted', city: 'Redacted', state: 'Redacted', postalCode: '', country: 'India' };
      customers[idx].customerNotes = 'Details redacted per privacy request.';
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
 * Automatically ingest and register customers from recent orders and table reservations
 */
export async function ingestCustomersFromTransactions(): Promise<{ ingestedCount: number; customers: CustomerProfile[] }> {
  const customers = loadCustomersFromStorage();
  let count = 0;

  try {
    const { data: reservations } = await supabase.from('reservations').select('*').limit(25);
    if (reservations && reservations.length > 0) {
      for (const r of reservations) {
        const guestName = r.guest_name || r.customer_name;
        const phone = r.guest_phone || r.phone;
        const email = r.guest_email || r.email || '';
        if (guestName && phone && !customers.some((c) => normalizePhone(c.mobile) === normalizePhone(phone))) {
          const res = await saveCustomer({
            fullName: guestName,
            email,
            mobile: phone,
            status: 'Active',
            category: 'NEW',
            loyaltyTier: 'Bronze',
            loyaltyPoints: 50,
            totalSpend: r.total_amount || 0,
            totalOrders: 1,
            totalVisits: 1,
            registeredSource: 'Table Reservation',
            favoriteBranch: r.branch_name || 'Downtown Flagship #01',
          });
          if (res.success) count++;
        }
      }
    }
  } catch {}

  return { ingestedCount: count, customers: loadCustomersFromStorage() };
}
