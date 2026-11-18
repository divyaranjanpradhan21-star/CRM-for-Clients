import { supabase } from './supabase';

export type DateFilterType = 'today' | 'week' | 'month' | 'year' | 'custom';
export type OrderTypeFilter = 'all' | 'dine_in' | 'takeaway' | 'delivery' | 'catering';
export type CustomerSegmentFilter = 'all' | 'vip' | 'regular' | 'first_time' | 'at_risk' | 'loyalty_gold';

export interface DashboardFilterState {
  branch: string;
  dateRange: DateFilterType;
  customStartDate?: string;
  customEndDate?: string;
  orderType: OrderTypeFilter;
  customerSegment: CustomerSegmentFilter;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: 'VIP' | 'Regular' | 'First-timer' | 'At-risk';
  loyaltyTier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  loyaltyPoints: number;
  totalOrders: number;
  totalSpend: number;
  lastVisit: string;
  registeredAt: string;
  favoriteBranch: string;
}

export interface ReservationRecord {
  id: string;
  bookingNumber: string;
  guestName: string;
  guestPhone: string;
  guestsCount: number;
  tableNumber: string;
  branch: string;
  reservationTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  specialRequests?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  branch: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'CATERING';
  status: 'RECEIVED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  itemsSummary: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
}

export interface ComplaintRecord {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  orderNumber?: string;
  branch: string;
  category: 'Food Quality' | 'Late Delivery' | 'Staff Service' | 'Billing Error' | 'Ambiance';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED';
  description: string;
  createdAt: string;
}

export interface CampaignRecord {
  id: string;
  title: string;
  channel: 'Email' | 'SMS' | 'WhatsApp' | 'Instagram / Social' | 'In-Store';
  status: 'ACTIVE' | 'SCHEDULED' | 'COMPLETED';
  budget: number;
  spent: number;
  reach: number;
  conversions: number;
  roiMultiplier: number;
  startDate: string;
  endDate: string;
}

export interface MenuItemRecord {
  id: string;
  name: string;
  category: string;
  price: number;
  ordersCount: number;
  revenue: number;
  rating: number;
  profitMargin: number;
  imageUrl: string;
  isPopular: boolean;
}

export interface StaffPerformanceRecord {
  id: string;
  name: string;
  role: string;
  branch: string;
  shiftsCompleted: number;
  ordersHandled: number;
  customerRating: number;
  efficiencyScore: number;
  status: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY';
  avatarUrl: string;
}

export interface RevenueDataPoint {
  label: string;
  revenue: number;
  cost: number;
  orders: number;
}

export interface CustomerTrendPoint {
  label: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface DashboardMetrics {
  // Customer KPIs
  totalCustomers: number;
  newCustomersToday: number;
  newCustomersThisWeek: number;
  newCustomersThisMonth: number;
  repeatCustomerPercentage: number;
  customerRetentionRate: number;
  activeLoyaltyMembers: number;

  // Reservation KPIs
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  completedReservations: number;
  cancelledReservations: number;

  // Order KPIs
  totalOrders: number;
  ordersReceived: number;
  ordersPreparing: number;
  ordersReady: number;
  ordersCompleted: number;
  ordersCancelled: number;

  // Financial KPIs
  totalSalesRevenue: number;
  averageOrderValue: number;

  // Feedback & Marketing KPIs
  pendingComplaints: number;
  activeCampaignsCount: number;

  // Charts
  revenueChart: RevenueDataPoint[];
  customerAcquisitionTrends: CustomerTrendPoint[];

  // Lists for preview & drilldown
  topMenuItems: MenuItemRecord[];
  topCustomers: CustomerRecord[];
  staffPerformance: StaffPerformanceRecord[];
  activeCampaigns: CampaignRecord[];
  pendingFeedbackList: ComplaintRecord[];
  recentOrdersList: OrderRecord[];
  reservationsList: ReservationRecord[];
  customersList: CustomerRecord[];
}

// ─── Mock Fallback Data ────────────────────────────────────────────────────────

const MOCK_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'c-1',
    name: 'Eleanor Vance',
    email: 'eleanor.vance@gmail.com',
    phone: '+91 98230 44123',
    segment: 'VIP',
    loyaltyTier: 'Platinum',
    loyaltyPoints: 3450,
    totalOrders: 42,
    totalSpend: 1845.0,
    lastVisit: '2 hours ago',
    registeredAt: '2024-01-15',
    favoriteBranch: 'Downtown Flagship',
  },
  {
    id: 'c-2',
    name: 'Marcus Sterling',
    email: 'm.sterling@capitalcorp.com',
    phone: '+91 98711 02938',
    segment: 'VIP',
    loyaltyTier: 'Platinum',
    loyaltyPoints: 2890,
    totalOrders: 35,
    totalSpend: 1520.5,
    lastVisit: 'Yesterday',
    registeredAt: '2024-02-10',
    favoriteBranch: 'Downtown Flagship',
  },
  {
    id: 'c-3',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@techverse.io',
    phone: '+91 99401 88321',
    segment: 'Regular',
    loyaltyTier: 'Gold',
    loyaltyPoints: 1720,
    totalOrders: 24,
    totalSpend: 980.0,
    lastVisit: '3 days ago',
    registeredAt: '2024-03-22',
    favoriteBranch: 'Uptown Promenade',
  },
  {
    id: 'c-4',
    name: 'Liam Hemsworth-Park',
    email: 'liam.hp@designstudio.co',
    phone: '+91 97120 33491',
    segment: 'VIP',
    loyaltyTier: 'Gold',
    loyaltyPoints: 1440,
    totalOrders: 19,
    totalSpend: 865.0,
    lastVisit: 'Today',
    registeredAt: '2024-04-05',
    favoriteBranch: 'Waterfront Terrace',
  },
  {
    id: 'c-5',
    name: 'Zoe Montgomery',
    email: 'zoe.m@pulsecreative.in',
    phone: '+91 98114 99012',
    segment: 'Regular',
    loyaltyTier: 'Silver',
    loyaltyPoints: 920,
    totalOrders: 14,
    totalSpend: 540.0,
    lastVisit: 'Today',
    registeredAt: '2024-05-18',
    favoriteBranch: 'Downtown Flagship',
  },
  {
    id: 'c-6',
    name: 'Rohit Verma',
    email: 'rohit.v@innovate.net',
    phone: '+91 98331 44556',
    segment: 'First-timer',
    loyaltyTier: 'Bronze',
    loyaltyPoints: 100,
    totalOrders: 1,
    totalSpend: 62.0,
    lastVisit: 'Today',
    registeredAt: new Date().toISOString().split('T')[0],
    favoriteBranch: 'Airport Bistro',
  },
  {
    id: 'c-7',
    name: 'Priya Iyer',
    email: 'priya.iyer@fintech.co',
    phone: '+91 98450 12345',
    segment: 'First-timer',
    loyaltyTier: 'Bronze',
    loyaltyPoints: 120,
    totalOrders: 1,
    totalSpend: 84.0,
    lastVisit: 'Today',
    registeredAt: new Date().toISOString().split('T')[0],
    favoriteBranch: 'Downtown Flagship',
  },
  {
    id: 'c-8',
    name: 'Devraj Chauhan',
    email: 'devraj@royalmotors.in',
    phone: '+91 99220 77112',
    segment: 'At-risk',
    loyaltyTier: 'Silver',
    loyaltyPoints: 610,
    totalOrders: 9,
    totalSpend: 410.0,
    lastVisit: '45 days ago',
    registeredAt: '2023-11-04',
    favoriteBranch: 'Uptown Promenade',
  },
];

const MOCK_RESERVATIONS: ReservationRecord[] = [
  {
    id: 'res-1',
    bookingNumber: 'RES-8491',
    guestName: 'Eleanor Vance',
    guestPhone: '+91 98230 44123',
    guestsCount: 4,
    tableNumber: 'Table T-04 (Window Bay)',
    branch: 'Downtown Flagship',
    reservationTime: 'Today, 07:30 PM',
    status: 'CONFIRMED',
    specialRequests: 'Anniversary cake arrangement and corner table',
  },
  {
    id: 'res-2',
    bookingNumber: 'RES-8492',
    guestName: 'Rajesh Kulkarni',
    guestPhone: '+91 98110 55432',
    guestsCount: 6,
    tableNumber: 'Table T-12 (Private Booth)',
    branch: 'Downtown Flagship',
    reservationTime: 'Today, 08:00 PM',
    status: 'PENDING',
    specialRequests: 'High chair for toddler requested',
  },
  {
    id: 'res-3',
    bookingNumber: 'RES-8493',
    guestName: 'Chloe Bennett',
    guestPhone: '+91 97722 11990',
    guestsCount: 2,
    tableNumber: 'Table T-02 (Garden Patio)',
    branch: 'Waterfront Terrace',
    reservationTime: 'Today, 06:45 PM',
    status: 'CONFIRMED',
    specialRequests: 'Candlelight setup',
  },
  {
    id: 'res-4',
    bookingNumber: 'RES-8490',
    guestName: 'Arjun Mehta',
    guestPhone: '+91 98334 00987',
    guestsCount: 8,
    tableNumber: 'Table T-18 (Mezzanine Deck)',
    branch: 'Uptown Promenade',
    reservationTime: 'Today, 01:30 PM',
    status: 'COMPLETED',
  },
  {
    id: 'res-5',
    bookingNumber: 'RES-8488',
    guestName: 'Sarah Jenkins',
    guestPhone: '+91 99100 88223',
    guestsCount: 3,
    tableNumber: 'Table T-07',
    branch: 'Downtown Flagship',
    reservationTime: 'Yesterday, 08:30 PM',
    status: 'CANCELLED',
    specialRequests: 'Guest called to reschedule due to flight delay',
  },
  {
    id: 'res-6',
    bookingNumber: 'RES-8495',
    guestName: 'Kunal Singhania',
    guestPhone: '+91 98200 99441',
    guestsCount: 5,
    tableNumber: 'Table T-09',
    branch: 'Airport Bistro',
    reservationTime: 'Tomorrow, 12:30 PM',
    status: 'PENDING',
    specialRequests: 'Expedited lunch service needed',
  },
];

const MOCK_ORDERS: OrderRecord[] = [
  {
    id: 'ord-101',
    orderNumber: 'POS-29401',
    customerName: 'Eleanor Vance',
    branch: 'Downtown Flagship',
    orderType: 'DINE_IN',
    status: 'PREPARING',
    itemsSummary: '1x Truffle Pasta, 1x British Fish & Chips, 2x Cold Brew',
    totalAmount: 64.5,
    paymentMethod: 'Credit Card',
    createdAt: '12 mins ago',
  },
  {
    id: 'ord-102',
    orderNumber: 'POS-29402',
    customerName: 'Marcus Sterling',
    branch: 'Downtown Flagship',
    orderType: 'TAKEAWAY',
    status: 'READY',
    itemsSummary: '2x Woodfired Margherita, 2x Artisanal Cappuccino',
    totalAmount: 48.0,
    paymentMethod: 'Apple Pay / UPI',
    createdAt: '22 mins ago',
  },
  {
    id: 'ord-103',
    orderNumber: 'POS-29403',
    customerName: 'Zoe Montgomery',
    branch: 'Waterfront Terrace',
    orderType: 'DELIVERY',
    status: 'RECEIVED',
    itemsSummary: '1x Sourdough Avocado Tartine, 1x Berry Cheesecake',
    totalAmount: 32.0,
    paymentMethod: 'Cash on Delivery',
    createdAt: '5 mins ago',
  },
  {
    id: 'ord-104',
    orderNumber: 'POS-29398',
    customerName: 'Liam Hemsworth-Park',
    branch: 'Downtown Flagship',
    orderType: 'DINE_IN',
    status: 'DELIVERED',
    itemsSummary: '2x Herb Crusted Salmon, 1x Sparkling San Pellegrino',
    totalAmount: 78.0,
    paymentMethod: 'Corporate Card',
    createdAt: '45 mins ago',
  },
  {
    id: 'ord-105',
    orderNumber: 'POS-29395',
    customerName: 'Priya Iyer',
    branch: 'Uptown Promenade',
    orderType: 'DELIVERY',
    status: 'DELIVERED',
    itemsSummary: '1x Mezze Platter, 2x Mint Lime Frappe',
    totalAmount: 42.5,
    paymentMethod: 'UPI',
    createdAt: '1 hour ago',
  },
  {
    id: 'ord-106',
    orderNumber: 'POS-29390',
    customerName: 'Guest #419',
    branch: 'Airport Bistro',
    orderType: 'TAKEAWAY',
    status: 'CANCELLED',
    itemsSummary: '1x Grilled Panini, 1x Flat White',
    totalAmount: 21.0,
    paymentMethod: 'Voided',
    createdAt: '2 hours ago',
  },
];

const MOCK_COMPLAINTS: ComplaintRecord[] = [
  {
    id: 'comp-1',
    ticketNumber: 'TKT-1042',
    customerName: 'Vikram Batra',
    customerPhone: '+91 98201 11223',
    orderNumber: 'POS-29388',
    branch: 'Downtown Flagship',
    category: 'Late Delivery',
    severity: 'HIGH',
    status: 'PENDING',
    description: 'Delivery arrived 45 minutes late, truffle fries were cold. Requested refund or replacement.',
    createdAt: '40 mins ago',
  },
  {
    id: 'comp-2',
    ticketNumber: 'TKT-1041',
    customerName: 'Sneha Deshmukh',
    customerPhone: '+91 97660 33412',
    orderNumber: 'POS-29370',
    branch: 'Uptown Promenade',
    category: 'Billing Error',
    severity: 'MEDIUM',
    status: 'UNDER_REVIEW',
    description: 'Charged twice for sparkling water on POS split bill.',
    createdAt: '3 hours ago',
  },
  {
    id: 'comp-3',
    ticketNumber: 'TKT-1039',
    customerName: 'Aman Tandon',
    customerPhone: '+91 98118 77654',
    branch: 'Waterfront Terrace',
    category: 'Staff Service',
    severity: 'LOW',
    status: 'PENDING',
    description: 'Table was not ready at reserved time of 8:00 PM, waited 20 minutes in lobby.',
    createdAt: 'Yesterday',
  },
  {
    id: 'comp-4',
    ticketNumber: 'TKT-1035',
    customerName: 'Natasha Romanov',
    customerPhone: '+91 99300 44556',
    orderNumber: 'POS-29312',
    branch: 'Airport Bistro',
    category: 'Food Quality',
    severity: 'MEDIUM',
    status: 'UNDER_REVIEW',
    description: 'Salad dressing missing from lunch box meal.',
    createdAt: '2 days ago',
  },
];

const MOCK_CAMPAIGNS: CampaignRecord[] = [
  {
    id: 'cmp-1',
    title: 'Weekend Artisanal Brunch Extravaganza',
    channel: 'Instagram / Social',
    status: 'ACTIVE',
    budget: 1500,
    spent: 850,
    reach: 48500,
    conversions: 320,
    roiMultiplier: 4.8,
    startDate: '2024-11-01',
    endDate: '2024-11-30',
  },
  {
    id: 'cmp-2',
    title: 'Loyalty Club Double Points Weekend',
    channel: 'WhatsApp',
    status: 'ACTIVE',
    budget: 600,
    spent: 420,
    reach: 12400,
    conversions: 410,
    roiMultiplier: 6.2,
    startDate: '2024-11-10',
    endDate: '2024-11-20',
  },
  {
    id: 'cmp-3',
    title: 'Corporate Lunch Delivery Perks',
    channel: 'Email',
    status: 'ACTIVE',
    budget: 800,
    spent: 310,
    reach: 18200,
    conversions: 145,
    roiMultiplier: 3.9,
    startDate: '2024-11-05',
    endDate: '2024-12-05',
  },
  {
    id: 'cmp-4',
    title: 'Monsoon Hot Brews & Desserts Combo',
    channel: 'In-Store',
    status: 'ACTIVE',
    budget: 500,
    spent: 490,
    reach: 9500,
    conversions: 280,
    roiMultiplier: 5.1,
    startDate: '2024-10-15',
    endDate: '2024-11-25',
  },
];

const MOCK_TOP_MENU_ITEMS: MenuItemRecord[] = [
  {
    id: 'menu-1',
    name: 'Fish & Chips (Crispy British Classic)',
    category: 'Mains / Seafood',
    price: 18.5,
    ordersCount: 420,
    revenue: 7770,
    rating: 4.8,
    profitMargin: 64,
    imageUrl: 'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'menu-2',
    name: 'Truffle & Porcini Wild Mushroom Pasta',
    category: 'Artisanal Pasta',
    price: 22.0,
    ordersCount: 385,
    revenue: 8470,
    rating: 4.9,
    profitMargin: 71,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'menu-3',
    name: 'Woodfired Buffalo Mozzarella Margherita',
    category: 'Gourmet Pizzas',
    price: 16.0,
    ordersCount: 340,
    revenue: 5440,
    rating: 4.7,
    profitMargin: 68,
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'menu-4',
    name: 'Single Origin Espresso & Cold Brew',
    category: 'Beverages',
    price: 6.5,
    ordersCount: 610,
    revenue: 3965,
    rating: 4.9,
    profitMargin: 82,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'menu-5',
    name: 'Baked Basque Blueberry Cheesecake',
    category: 'Desserts',
    price: 9.5,
    ordersCount: 295,
    revenue: 2802,
    rating: 4.8,
    profitMargin: 76,
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80',
    isPopular: false,
  },
];

const MOCK_STAFF: StaffPerformanceRecord[] = [
  {
    id: 'st-1',
    name: 'Aarav Nair',
    role: 'Head Bartender & Mixologist',
    branch: 'Downtown Flagship',
    shiftsCompleted: 26,
    ordersHandled: 412,
    customerRating: 4.9,
    efficiencyScore: 96,
    status: 'ON_DUTY',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'st-2',
    name: 'Simran Kaur',
    role: 'Front of House Lead',
    branch: 'Downtown Flagship',
    shiftsCompleted: 24,
    ordersHandled: 388,
    customerRating: 4.85,
    efficiencyScore: 94,
    status: 'ON_DUTY',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'st-3',
    name: 'David Reynolds',
    role: 'Sous Chef (Line 1)',
    branch: 'Waterfront Terrace',
    shiftsCompleted: 25,
    ordersHandled: 345,
    customerRating: 4.8,
    efficiencyScore: 91,
    status: 'ON_BREAK',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'st-4',
    name: 'Meera Pillai',
    role: 'Senior Barista',
    branch: 'Uptown Promenade',
    shiftsCompleted: 22,
    ordersHandled: 490,
    customerRating: 4.95,
    efficiencyScore: 98,
    status: 'ON_DUTY',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'st-5',
    name: 'Rohan Deshpande',
    role: 'Floor Host / Reservations',
    branch: 'Downtown Flagship',
    shiftsCompleted: 20,
    ordersHandled: 260,
    customerRating: 4.75,
    efficiencyScore: 89,
    status: 'OFF_DUTY',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  },
];

// Revenue charts by timeframe
export const REVENUE_TIMEFRAME_DATA: Record<DateFilterType, RevenueDataPoint[]> = {
  today: [
    { label: '08:00', revenue: 420, cost: 160, orders: 12 },
    { label: '10:00', revenue: 890, cost: 280, orders: 28 },
    { label: '12:00', revenue: 2150, cost: 650, orders: 62 },
    { label: '14:00', revenue: 1680, cost: 510, orders: 44 },
    { label: '16:00', revenue: 950, cost: 320, orders: 30 },
    { label: '18:00', revenue: 1980, cost: 610, orders: 58 },
    { label: '20:00', revenue: 3420, cost: 980, orders: 94 },
    { label: '22:00', revenue: 1840, cost: 520, orders: 48 },
  ],
  week: [
    { label: 'Mon', revenue: 4820, cost: 1540, orders: 142 },
    { label: 'Tue', revenue: 5210, cost: 1620, orders: 158 },
    { label: 'Wed', revenue: 6100, cost: 1890, orders: 184 },
    { label: 'Thu', revenue: 6950, cost: 2100, orders: 202 },
    { label: 'Fri', revenue: 9840, cost: 2950, orders: 288 },
    { label: 'Sat', revenue: 12450, cost: 3680, orders: 365 },
    { label: 'Sun', revenue: 11200, cost: 3340, orders: 324 },
  ],
  month: [
    { label: 'Week 1', revenue: 38400, cost: 11800, orders: 1140 },
    { label: 'Week 2', revenue: 42100, cost: 12600, orders: 1260 },
    { label: 'Week 3', revenue: 46800, cost: 13900, orders: 1390 },
    { label: 'Week 4', revenue: 51200, cost: 15100, orders: 1510 },
  ],
  year: [
    { label: 'Q1 2024', revenue: 145000, cost: 44000, orders: 4280 },
    { label: 'Q2 2024', revenue: 168000, cost: 49500, orders: 4920 },
    { label: 'Q3 2024', revenue: 184000, cost: 53200, orders: 5380 },
    { label: 'Q4 2024 (Proj)', revenue: 215000, cost: 61000, orders: 6240 },
  ],
  custom: [
    { label: 'Day 1-5', revenue: 28400, cost: 8600, orders: 840 },
    { label: 'Day 6-10', revenue: 32100, cost: 9400, orders: 950 },
    { label: 'Day 11-15', revenue: 34900, cost: 10200, orders: 1020 },
  ],
};

// Customer acquisition trend data
export const CUSTOMER_TREND_DATA: Record<DateFilterType, CustomerTrendPoint[]> = {
  today: [
    { label: '08:00', newCustomers: 2, returningCustomers: 8 },
    { label: '11:00', newCustomers: 4, returningCustomers: 18 },
    { label: '14:00', newCustomers: 3, returningCustomers: 26 },
    { label: '17:00', newCustomers: 2, returningCustomers: 19 },
    { label: '20:00', newCustomers: 5, returningCustomers: 38 },
  ],
  week: [
    { label: 'Mon', newCustomers: 12, returningCustomers: 54 },
    { label: 'Tue', newCustomers: 15, returningCustomers: 62 },
    { label: 'Wed', newCustomers: 18, returningCustomers: 74 },
    { label: 'Thu', newCustomers: 21, returningCustomers: 88 },
    { label: 'Fri', newCustomers: 28, returningCustomers: 114 },
    { label: 'Sat', newCustomers: 38, returningCustomers: 148 },
    { label: 'Sun', newCustomers: 32, returningCustomers: 132 },
  ],
  month: [
    { label: 'Wk 1', newCustomers: 58, returningCustomers: 240 },
    { label: 'Wk 2', newCustomers: 64, returningCustomers: 275 },
    { label: 'Wk 3', newCustomers: 72, returningCustomers: 310 },
    { label: 'Wk 4', newCustomers: 86, returningCustomers: 355 },
  ],
  year: [
    { label: 'Jan', newCustomers: 180, returningCustomers: 720 },
    { label: 'Feb', newCustomers: 210, returningCustomers: 810 },
    { label: 'Mar', newCustomers: 245, returningCustomers: 940 },
    { label: 'Apr', newCustomers: 230, returningCustomers: 910 },
    { label: 'May', newCustomers: 275, returningCustomers: 1060 },
    { label: 'Jun', newCustomers: 290, returningCustomers: 1120 },
    { label: 'Jul', newCustomers: 310, returningCustomers: 1190 },
    { label: 'Aug', newCustomers: 325, returningCustomers: 1240 },
    { label: 'Sep', newCustomers: 340, returningCustomers: 1310 },
    { label: 'Oct', newCustomers: 360, returningCustomers: 1390 },
    { label: 'Nov', newCustomers: 380, returningCustomers: 1460 },
    { label: 'Dec', newCustomers: 410, returningCustomers: 1590 },
  ],
  custom: [
    { label: 'P-1', newCustomers: 45, returningCustomers: 180 },
    { label: 'P-2', newCustomers: 52, returningCustomers: 210 },
    { label: 'P-3', newCustomers: 61, returningCustomers: 245 },
  ],
};

// ─── Fetch Dashboard Metrics API ──────────────────────────────────────────────

export async function fetchAdminDashboardMetrics(
  filters: DashboardFilterState,
  orgId?: string
): Promise<DashboardMetrics> {
  try {
    // 1. Fetch live orders from Supabase if available
    let ordersQuery = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (orgId) {
      ordersQuery = ordersQuery.eq('organization_id', orgId);
    }
    if (filters.branch && filters.branch !== 'all') {
      ordersQuery = ordersQuery.ilike('branch', `%${filters.branch}%`);
    }

    const { data: dbOrders } = await ordersQuery.limit(200);

    // 2. Fetch live reservations if table exists
    let reservationsQuery = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (orgId) {
      reservationsQuery = reservationsQuery.eq('organization_id', orgId);
    }
    const { data: dbReservations } = await reservationsQuery.limit(100);

    // 3. Fetch live clients/customers if available
    let clientsQuery = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (orgId) {
      clientsQuery = clientsQuery.eq('organization_id', orgId);
    }
    const { data: dbClients } = await clientsQuery.limit(200);

    // Merge or fallback
    const ordersList: OrderRecord[] = (dbOrders && dbOrders.length > 0)
      ? dbOrders.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number || `POS-${o.id.substring(0, 6)}`,
          customerName: o.customer_name || 'Guest Patron',
          branch: o.branch || 'Downtown Flagship',
          orderType: (o.order_type || 'DINE_IN').toUpperCase(),
          status: (o.status || 'RECEIVED').toUpperCase(),
          itemsSummary: o.item_summary || 'Chef Selected Specials',
          totalAmount: Number(o.total_amount) || 45.0,
          paymentMethod: o.payment_method || 'Card',
          createdAt: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }))
      : MOCK_ORDERS;

    const reservationsList: ReservationRecord[] = (dbReservations && dbReservations.length > 0)
      ? dbReservations.map((r: any) => ({
          id: r.id,
          bookingNumber: r.booking_number || `RES-${r.id.substring(0, 4)}`,
          guestName: r.guest_name || 'Guest',
          guestPhone: r.guest_phone || '+91 98000 00000',
          guestsCount: r.guests_count || 2,
          tableNumber: r.table_number || 'T-01',
          branch: r.branch || 'Downtown Flagship',
          reservationTime: r.reservation_time || 'Today 7:00 PM',
          status: (r.status || 'CONFIRMED').toUpperCase(),
          specialRequests: r.special_requests,
        }))
      : MOCK_RESERVATIONS;

    const customersList: CustomerRecord[] = (dbClients && dbClients.length > 0)
      ? dbClients.map((c: any) => ({
          id: c.id,
          name: c.name || 'Valued Patron',
          email: c.email || 'customer@cafescorner.com',
          phone: c.phone || '+91 98000 00000',
          segment: c.segment || 'Regular',
          loyaltyTier: c.loyalty_tier || 'Gold',
          loyaltyPoints: c.loyalty_points || 450,
          totalOrders: c.total_orders || 8,
          totalSpend: Number(c.total_spend) || 380,
          lastVisit: 'Recent',
          registeredAt: c.created_at || '2024-01-01',
          favoriteBranch: c.favorite_branch || 'Downtown Flagship',
        }))
      : MOCK_CUSTOMERS;

    // Filter calculations
    const filteredOrders = ordersList.filter(o => {
      if (filters.orderType !== 'all' && o.orderType.toLowerCase() !== filters.orderType.toLowerCase()) {
        return false;
      }
      if (filters.branch !== 'all' && !o.branch.toLowerCase().includes(filters.branch.toLowerCase())) {
        return false;
      }
      return true;
    });

    const filteredReservations = reservationsList.filter(r => {
      if (filters.branch !== 'all' && !r.branch.toLowerCase().includes(filters.branch.toLowerCase())) {
        return false;
      }
      return true;
    });

    const filteredCustomers = customersList.filter(c => {
      if (filters.customerSegment !== 'all') {
        if (filters.customerSegment === 'vip' && c.segment !== 'VIP') return false;
        if (filters.customerSegment === 'regular' && c.segment !== 'Regular') return false;
        if (filters.customerSegment === 'first_time' && c.segment !== 'First-timer') return false;
        if (filters.customerSegment === 'at_risk' && c.segment !== 'At-risk') return false;
        if (filters.customerSegment === 'loyalty_gold' && c.loyaltyTier !== 'Gold' && c.loyaltyTier !== 'Platinum') return false;
      }
      return true;
    });

    // Compute metrics
    const totalOrders = filteredOrders.length;
    const totalSalesRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0) || 56570;
    const averageOrderValue = totalOrders > 0 ? Math.round((totalSalesRevenue / totalOrders) * 10) / 10 : 46.5;

    const ordersReceived = filteredOrders.filter(o => o.status === 'RECEIVED').length;
    const ordersPreparing = filteredOrders.filter(o => o.status === 'PREPARING').length;
    const ordersReady = filteredOrders.filter(o => o.status === 'READY').length;
    const ordersCompleted = filteredOrders.filter(o => o.status === 'DELIVERED').length;
    const ordersCancelled = filteredOrders.filter(o => o.status === 'CANCELLED').length;

    const totalReservations = filteredReservations.length;
    const pendingReservations = filteredReservations.filter(r => r.status === 'PENDING').length;
    const confirmedReservations = filteredReservations.filter(r => r.status === 'CONFIRMED').length;
    const completedReservations = filteredReservations.filter(r => r.status === 'COMPLETED').length;
    const cancelledReservations = filteredReservations.filter(r => r.status === 'CANCELLED').length;

    const totalCustomers = 4850;
    const newCustomersToday = 14;
    const newCustomersThisWeek = 68;
    const newCustomersThisMonth = 245;
    const repeatCustomerPercentage = 68.4;
    const customerRetentionRate = 84.2;
    const activeLoyaltyMembers = 1420;

    const revenueChart = REVENUE_TIMEFRAME_DATA[filters.dateRange] || REVENUE_TIMEFRAME_DATA.week;
    const customerAcquisitionTrends = CUSTOMER_TREND_DATA[filters.dateRange] || CUSTOMER_TREND_DATA.week;

    return {
      totalCustomers,
      newCustomersToday,
      newCustomersThisWeek,
      newCustomersThisMonth,
      repeatCustomerPercentage,
      customerRetentionRate,
      activeLoyaltyMembers,

      totalReservations: totalReservations || 180,
      pendingReservations: pendingReservations || 12,
      confirmedReservations: confirmedReservations || 54,
      completedReservations: completedReservations || 108,
      cancelledReservations: cancelledReservations || 6,

      totalOrders: totalOrders || 1240,
      ordersReceived: ordersReceived || 42,
      ordersPreparing: ordersPreparing || 28,
      ordersReady: ordersReady || 19,
      ordersCompleted: ordersCompleted || 1135,
      ordersCancelled: ordersCancelled || 16,

      totalSalesRevenue,
      averageOrderValue,

      pendingComplaints: MOCK_COMPLAINTS.filter(c => c.status !== 'RESOLVED').length,
      activeCampaignsCount: MOCK_CAMPAIGNS.filter(c => c.status === 'ACTIVE').length,

      revenueChart,
      customerAcquisitionTrends,

      topMenuItems: MOCK_TOP_MENU_ITEMS,
      topCustomers: filteredCustomers,
      staffPerformance: MOCK_STAFF,
      activeCampaigns: MOCK_CAMPAIGNS,
      pendingFeedbackList: MOCK_COMPLAINTS,
      recentOrdersList: filteredOrders,
      reservationsList: filteredReservations,
      customersList: filteredCustomers,
    };
  } catch (err) {
    console.warn('Fallback to mock admin metrics:', err);
    return {
      totalCustomers: 4850,
      newCustomersToday: 14,
      newCustomersThisWeek: 68,
      newCustomersThisMonth: 245,
      repeatCustomerPercentage: 68.4,
      customerRetentionRate: 84.2,
      activeLoyaltyMembers: 1420,

      totalReservations: 180,
      pendingReservations: 12,
      confirmedReservations: 54,
      completedReservations: 108,
      cancelledReservations: 6,

      totalOrders: 1240,
      ordersReceived: 42,
      ordersPreparing: 28,
      ordersReady: 19,
      ordersCompleted: 1135,
      ordersCancelled: 16,

      totalSalesRevenue: 56570,
      averageOrderValue: 46.5,

      pendingComplaints: 4,
      activeCampaignsCount: 4,

      revenueChart: REVENUE_TIMEFRAME_DATA[filters.dateRange] || REVENUE_TIMEFRAME_DATA.week,
      customerAcquisitionTrends: CUSTOMER_TREND_DATA[filters.dateRange] || CUSTOMER_TREND_DATA.week,

      topMenuItems: MOCK_TOP_MENU_ITEMS,
      topCustomers: MOCK_CUSTOMERS,
      staffPerformance: MOCK_STAFF,
      activeCampaigns: MOCK_CAMPAIGNS,
      pendingFeedbackList: MOCK_COMPLAINTS,
      recentOrdersList: MOCK_ORDERS,
      reservationsList: MOCK_RESERVATIONS,
      customersList: MOCK_CUSTOMERS,
    };
  }
}
