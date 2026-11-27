import { supabase } from './supabase';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type DietType = 'Veg' | 'Non-Veg' | 'Vegan';
export type ItemAvailability = 'Available' | 'Unavailable' | 'Out of Stock';
export type ItemTag = 'Popular' | 'Recommended' | 'Featured' | 'Bestseller' | 'Chef Special' | 'Seasonal' | 'New';

export type Allergen =
  | 'Dairy'
  | 'Nuts'
  | 'Gluten'
  | 'Soy'
  | 'Eggs'
  | 'Shellfish'
  | 'Fish'
  | 'Peanuts'
  | 'Sesame'
  | 'Mustard';

export interface ItemVariant {
  id: string;
  name: string; // e.g. "Small", "Regular", "Large", "Full", "Half"
  price: number;
  isDefault?: boolean;
}

export interface ItemAddon {
  id: string;
  name: string; // e.g. "Extra Cheese", "Garlic Butter", "Truffle Oil"
  price: number;
  maxQuantity?: number;
}

export interface BranchPrice {
  branchId: string;
  branchName: string;
  price: number;
  isAvailable: boolean;
}

export interface MenuSchedule {
  days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  startTime: string; // HH:mm format, e.g. "11:00"
  endTime: string;   // HH:mm format, e.g. "23:00"
  isActive: boolean;
}

export interface MenuCategoryRecord {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  icon?: string;
  isActive: boolean;
}

export interface MenuChangeLog {
  id: string;
  itemId: string;
  itemName: string;
  action: 'Created' | 'Updated' | 'Archived' | 'Price Changed' | 'Stock Toggled' | 'Restored';
  changedBy: string;
  role: string;
  details: string;
  timestamp: string;
}

export interface MenuItem {
  id: string;
  itemCode: string; // e.g. "MN-101"
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  diet: DietType;
  basePrice: number;
  costPrice: number;
  status: ItemAvailability;
  isArchived: boolean;
  allergens: Allergen[];
  variants: ItemVariant[];
  addons: ItemAddon[];
  branchPricing: BranchPrice[];
  schedule: MenuSchedule;
  tags: ItemTag[];
  ordersCount: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuMetrics {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  outOfStockItems: number;
  totalCategories: number;
  popularItemsCount: number;
  avgProfitMargin: number;
  totalMenuRevenue: number;
  bestSellers: MenuItem[];
  lowPerformers: MenuItem[];
}

// ─── LOCAL STORAGE KEYS ───────────────────────────────────────────────────────

const STORAGE_MENU_ITEMS_KEY = 'crm_menu_items_v2';
const STORAGE_MENU_CATEGORIES_KEY = 'crm_menu_categories_v2';
const STORAGE_MENU_LOGS_KEY = 'crm_menu_audit_logs_v2';

// ─── INITIAL SEED DATA ────────────────────────────────────────────────────────

export const INITIAL_CATEGORIES: MenuCategoryRecord[] = [
  { id: 'cat-1', name: 'Starters', description: 'Appetizers, crisps, and finger food', displayOrder: 1, isActive: true },
  { id: 'cat-2', name: 'Main Course', description: 'Curries, sizzlers, and chef specialties', displayOrder: 2, isActive: true },
  { id: 'cat-3', name: 'Breads', description: 'Naans, rotis, parathas, and kulchas', displayOrder: 3, isActive: true },
  { id: 'cat-4', name: 'Rice & Biryani', description: 'Dum biryanis, pulao, and fragrant rice', displayOrder: 4, isActive: true },
  { id: 'cat-5', name: 'Desserts', description: 'Traditional sweets, pastries, and ice creams', displayOrder: 5, isActive: true },
  { id: 'cat-6', name: 'Beverages', description: 'Mocktails, lassis, teas, and specialty coffees', displayOrder: 6, isActive: true },
  { id: 'cat-7', name: 'Soups & Salads', description: 'Healthy bowls and aromatic broths', displayOrder: 7, isActive: true },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    itemCode: 'MN-101',
    name: 'Butter Chicken',
    category: 'Main Course',
    description: 'Tender chicken simmered in a velvety tomato, butter, and cashew gravy infused with fenugreek.',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop',
    diet: 'Non-Veg',
    basePrice: 320,
    costPrice: 110,
    status: 'Available',
    isArchived: false,
    allergens: ['Dairy', 'Nuts'],
    variants: [
      { id: 'v1', name: 'Regular (Half)', price: 320, isDefault: true },
      { id: 'v2', name: 'Large (Full)', price: 540 }
    ],
    addons: [
      { id: 'a1', name: 'Extra Butter / Cream', price: 30 },
      { id: 'a2', name: 'Extra Gravy', price: 60 }
    ],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 320, isAvailable: true },
      { branchId: 'b2', branchName: 'Airport Express', price: 380, isAvailable: true },
      { branchId: 'b3', branchName: 'Uptown Promenade', price: 330, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '11:00', endTime: '23:30', isActive: true },
    tags: ['Bestseller', 'Chef Special', 'Popular'],
    ordersCount: 248,
    revenue: 79360,
    rating: 4.8,
    reviewCount: 142,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm2',
    itemCode: 'MN-102',
    name: 'Awadhi Chicken Biryani',
    category: 'Rice & Biryani',
    description: 'Fragrant aged basmati rice cooked on dum with marinated chicken cuts, saffron, and whole spices.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=400&fit=crop',
    diet: 'Non-Veg',
    basePrice: 350,
    costPrice: 130,
    status: 'Available',
    isArchived: false,
    allergens: ['Dairy'],
    variants: [
      { id: 'v3', name: 'Regular (1 Person)', price: 350, isDefault: true },
      { id: 'v4', name: 'Family Pack (3 Persons)', price: 890 }
    ],
    addons: [
      { id: 'a3', name: 'Extra Mirchi Ka Salan', price: 40 },
      { id: 'a4', name: 'Burani Raita', price: 50 },
      { id: 'a5', name: 'Boiled Egg', price: 25 }
    ],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 350, isAvailable: true },
      { branchId: 'b2', branchName: 'Airport Express', price: 410, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '12:00', endTime: '23:00', isActive: true },
    tags: ['Bestseller', 'Popular'],
    ordersCount: 231,
    revenue: 80850,
    rating: 4.7,
    reviewCount: 128,
    createdAt: '2024-01-11T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm3',
    itemCode: 'MN-103',
    name: 'Tandoori Paneer Tikka',
    category: 'Starters',
    description: 'Fresh malai cottage cheese cubes marinated in spiced mustard oil and hung yogurt, charred in clay oven.',
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop',
    diet: 'Veg',
    basePrice: 280,
    costPrice: 95,
    status: 'Available',
    isArchived: false,
    allergens: ['Dairy', 'Mustard'],
    variants: [
      { id: 'v5', name: 'Standard (6 pcs)', price: 280, isDefault: true }
    ],
    addons: [
      { id: 'a6', name: 'Mint Chutney Dip', price: 20 },
      { id: 'a7', name: 'Masala Lachha Onion', price: 25 }
    ],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 280, isAvailable: true },
      { branchId: 'b2', branchName: 'Airport Express', price: 320, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '11:00', endTime: '23:30', isActive: true },
    tags: ['Recommended', 'Popular'],
    ordersCount: 189,
    revenue: 52920,
    rating: 4.6,
    reviewCount: 97,
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm4',
    itemCode: 'MN-104',
    name: 'Dal Makhani Bukhara Style',
    category: 'Main Course',
    description: 'Black lentils slow-cooked for 18 hours over charcoal with plum tomatoes, butter, and mild spices.',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop',
    diet: 'Veg',
    basePrice: 240,
    costPrice: 70,
    status: 'Available',
    isArchived: false,
    allergens: ['Dairy'],
    variants: [
      { id: 'v6', name: 'Regular Bowl', price: 240, isDefault: true }
    ],
    addons: [
      { id: 'a8', name: 'Extra White Butter', price: 30 }
    ],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 240, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '11:00', endTime: '23:30', isActive: true },
    tags: ['Popular'],
    ordersCount: 165,
    revenue: 39600,
    rating: 4.5,
    reviewCount: 84,
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm5',
    itemCode: 'MN-105',
    name: 'Garlic Butter Naan',
    category: 'Breads',
    description: 'Leavened clay oven bread topped with crushed garlic, fresh coriander, and melted butter.',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=400&fit=crop',
    diet: 'Veg',
    basePrice: 60,
    costPrice: 15,
    status: 'Available',
    isArchived: false,
    allergens: ['Dairy', 'Gluten'],
    variants: [
      { id: 'v7', name: 'Single Piece', price: 60, isDefault: true }
    ],
    addons: [],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 60, isAvailable: true },
      { branchId: 'b2', branchName: 'Airport Express', price: 85, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '11:00', endTime: '23:30', isActive: true },
    tags: ['Popular'],
    ordersCount: 412,
    revenue: 24720,
    rating: 4.4,
    reviewCount: 203,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm6',
    itemCode: 'MN-106',
    name: 'Kashmiri Mutton Rogan Josh',
    category: 'Main Course',
    description: 'Prime baby mutton shanks braised in Kashmiri chili, ratanjot essence, fennel, and ginger broth.',
    imageUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&h=400&fit=crop',
    diet: 'Non-Veg',
    basePrice: 420,
    costPrice: 160,
    status: 'Available',
    isArchived: false,
    allergens: [],
    variants: [
      { id: 'v8', name: 'Regular (2 Shakes)', price: 420, isDefault: true },
      { id: 'v9', name: 'Grand Portion (4 Shakes)', price: 780 }
    ],
    addons: [],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 420, isAvailable: true },
      { branchId: 'b2', branchName: 'Airport Express', price: 490, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '12:00', endTime: '23:00', isActive: true },
    tags: ['Chef Special', 'Featured'],
    ordersCount: 112,
    revenue: 47040,
    rating: 4.6,
    reviewCount: 67,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm7',
    itemCode: 'MN-107',
    name: 'Alphonso Mango Lassi',
    category: 'Beverages',
    description: 'Thick churned farm yogurt blended with pure Ratnagiri Alphonso mango pulp and cardamom.',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop',
    diet: 'Veg',
    basePrice: 90,
    costPrice: 25,
    status: 'Available',
    isArchived: false,
    allergens: ['Dairy'],
    variants: [
      { id: 'v10', name: '300ml Glass', price: 90, isDefault: true },
      { id: 'v11', name: '500ml Jumbo', price: 140 }
    ],
    addons: [
      { id: 'a9', name: 'Toasted Pistachio Slivers', price: 20 }
    ],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 90, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '10:00', endTime: '23:30', isActive: true },
    tags: ['Seasonal', 'Popular'],
    ordersCount: 198,
    revenue: 17820,
    rating: 4.5,
    reviewCount: 88,
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm8',
    itemCode: 'MN-108',
    name: 'Malabar Fish Curry',
    category: 'Main Course',
    description: 'Seer fish cutlets stewed in golden coconut milk, kudampuli tamarind, green chilies, and curry leaves.',
    imageUrl: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&h=400&fit=crop',
    diet: 'Non-Veg',
    basePrice: 380,
    costPrice: 140,
    status: 'Available',
    isArchived: false,
    allergens: ['Fish'],
    variants: [
      { id: 'v12', name: 'Standard Bowl', price: 380, isDefault: true }
    ],
    addons: [
      { id: 'a10', name: 'Steamed Appam (2 pcs)', price: 40 }
    ],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 380, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '12:00', endTime: '22:30', isActive: true },
    tags: ['Featured'],
    ordersCount: 98,
    revenue: 37240,
    rating: 4.4,
    reviewCount: 55,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm9',
    itemCode: 'MN-109',
    name: 'Royal Heritage Veg Thali',
    category: 'Main Course',
    description: 'Complete meal with paneer dish, dal, 2 seasonal vegetables, basmati pulao, 2 rotis, raita, and gulab jamun.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
    diet: 'Veg',
    basePrice: 220,
    costPrice: 75,
    status: 'Available',
    isArchived: false,
    allergens: ['Dairy', 'Gluten'],
    variants: [
      { id: 'v13', name: 'Standard Thali', price: 220, isDefault: true }
    ],
    addons: [
      { id: 'a11', name: 'Sweet Lassi Shot', price: 30 }
    ],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 220, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '11:30', endTime: '16:00', isActive: true },
    tags: ['Recommended'],
    ordersCount: 142,
    revenue: 31240,
    rating: 4.3,
    reviewCount: 71,
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm10',
    itemCode: 'MN-110',
    name: 'Gulab Jamun Flambé',
    category: 'Desserts',
    description: 'Hot evaporated milk dumplings steeped in rose saffron sugar syrup, finished with pistachio praline.',
    imageUrl: 'https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?w=400&h=400&fit=crop',
    diet: 'Veg',
    basePrice: 120,
    costPrice: 35,
    status: 'Available',
    isArchived: false,
    allergens: ['Dairy', 'Nuts', 'Gluten'],
    variants: [
      { id: 'v14', name: '2 Pieces', price: 120, isDefault: true },
      { id: 'v15', name: 'With Vanilla Bean Gelato', price: 180 }
    ],
    addons: [],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 120, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '11:00', endTime: '23:30', isActive: true },
    tags: ['Popular'],
    ordersCount: 178,
    revenue: 21360,
    rating: 4.6,
    reviewCount: 92,
    createdAt: '2024-01-25T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm11',
    itemCode: 'MN-111',
    name: 'Tandoori Tiger Prawns',
    category: 'Starters',
    description: 'Jumbo tiger prawns marinated with ajwain seeds, degi mirch, and Greek yogurt, crisped over high heat.',
    imageUrl: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400&h=400&fit=crop',
    diet: 'Non-Veg',
    basePrice: 480,
    costPrice: 220,
    status: 'Out of Stock',
    isArchived: false,
    allergens: ['Shellfish', 'Dairy'],
    variants: [
      { id: 'v16', name: 'Plate of 6 Prawns', price: 480, isDefault: true }
    ],
    addons: [],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 480, isAvailable: false }
    ],
    schedule: { days: ['Thu', 'Fri', 'Sat', 'Sun'], startTime: '18:00', endTime: '23:00', isActive: true },
    tags: ['Chef Special'],
    ordersCount: 12,
    revenue: 5760,
    rating: 4.7,
    reviewCount: 14,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm12',
    itemCode: 'MN-112',
    name: 'Delhi Style Chole Bhature',
    category: 'Main Course',
    description: 'Piquant pindi chickpeas seasoned with amchur, served with two puffed leavened bhaturas and pickles.',
    imageUrl: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=400&fit=crop',
    diet: 'Veg',
    basePrice: 160,
    costPrice: 50,
    status: 'Available',
    isArchived: false,
    allergens: ['Gluten'],
    variants: [
      { id: 'v17', name: '2 Bhature + Chole', price: 160, isDefault: true }
    ],
    addons: [
      { id: 'a12', name: 'Extra Bhatura', price: 40 }
    ],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 160, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '08:00', endTime: '15:00', isActive: true },
    tags: ['Popular'],
    ordersCount: 134,
    revenue: 21440,
    rating: 4.4,
    reviewCount: 63,
    createdAt: '2024-02-05T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'm13',
    itemCode: 'MN-113',
    name: 'Tofu Quinoa Superfood Bowl',
    category: 'Soups & Salads',
    description: 'Organic white quinoa, grilled organic tofu, avocado, cherry tomatoes, and lemon tahini dressing.',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
    diet: 'Vegan',
    basePrice: 260,
    costPrice: 105,
    status: 'Available',
    isArchived: false,
    allergens: ['Soy', 'Sesame'],
    variants: [
      { id: 'v18', name: 'Regular Bowl', price: 260, isDefault: true }
    ],
    addons: [
      { id: 'a13', name: 'Chia & Hemp Seed Crunch', price: 30 }
    ],
    branchPricing: [
      { branchId: 'b1', branchName: 'Downtown Flagship', price: 260, isAvailable: true }
    ],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '10:00', endTime: '22:00', isActive: true },
    tags: ['New'],
    ordersCount: 22,
    revenue: 5720,
    rating: 4.2,
    reviewCount: 18,
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_LOGS: MenuChangeLog[] = [
  { id: 'log-1', itemId: 'm1', itemName: 'Butter Chicken', action: 'Created', changedBy: 'Admin (Master)', role: 'RESTAURANT_ADMIN', details: 'Added new flagship item with 2 variants', timestamp: '2024-01-10T10:00:00Z' },
  { id: 'log-2', itemId: 'm11', itemName: 'Tandoori Tiger Prawns', action: 'Stock Toggled', changedBy: 'Head Chef Rajan', role: 'HEAD_CHEF', details: 'Status changed to Out of Stock due to fresh seafood vendor delay', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'log-3', itemId: 'm2', itemName: 'Awadhi Chicken Biryani', action: 'Price Changed', changedBy: 'Admin (Master)', role: 'RESTAURANT_ADMIN', details: 'Base price updated from ₹330 to ₹350 due to basmati grain inflation', timestamp: new Date(Date.now() - 86400000).toISOString() },
];

// ─── STORAGE OPERATIONS ───────────────────────────────────────────────────────

export function loadMenuItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_MENU_ITEMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_MENU_ITEMS_KEY, JSON.stringify(INITIAL_MENU_ITEMS));
  return INITIAL_MENU_ITEMS;
}

export function saveMenuItems(items: MenuItem[]): void {
  localStorage.setItem(STORAGE_MENU_ITEMS_KEY, JSON.stringify(items));
  // Backward compatibility with previous catalog reader
  localStorage.setItem('crm_menu_items_v1', JSON.stringify(items));
  // Non-blocking sync with Supabase table
  supabase.from('menu_items').upsert(
    items.map(i => ({
      id: i.id,
      item_code: i.itemCode,
      name: i.name,
      category: i.category,
      price: i.basePrice,
      status: i.status,
      is_archived: i.isArchived,
      updated_at: i.updatedAt
    }))
  ).then(() => {});
}

export function loadMenuCategories(): MenuCategoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_MENU_CATEGORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_MENU_CATEGORIES_KEY, JSON.stringify(INITIAL_CATEGORIES));
  return INITIAL_CATEGORIES;
}

export function saveMenuCategories(cats: MenuCategoryRecord[]): void {
  localStorage.setItem(STORAGE_MENU_CATEGORIES_KEY, JSON.stringify(cats));
}

export function loadMenuAuditLogs(): MenuChangeLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_MENU_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_MENU_LOGS_KEY, JSON.stringify(INITIAL_LOGS));
  return INITIAL_LOGS;
}

export function addMenuAuditLog(log: Omit<MenuChangeLog, 'id' | 'timestamp'>): void {
  const logs = loadMenuAuditLogs();
  const newLog: MenuChangeLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString()
  };
  logs.unshift(newLog);
  localStorage.setItem(STORAGE_MENU_LOGS_KEY, JSON.stringify(logs.slice(0, 300)));
}

// ─── CRUD FUNCTIONS (FR-MENU-001, FR-MENU-002, FR-MENU-003) ───────────────────

export function saveMenuItem(
  itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt' | 'ordersCount' | 'revenue' | 'rating' | 'reviewCount'> & { id?: string },
  performer = 'Admin',
  performerRole = 'RESTAURANT_ADMIN'
): MenuItem {
  const items = loadMenuItems();
  const now = new Date().toISOString();

  if (itemData.id) {
    // Update existing item
    const idx = items.findIndex(i => i.id === itemData.id);
    if (idx === -1) throw new Error('Menu item not found');

    const prev = items[idx];
    const isPriceChanged = prev.basePrice !== itemData.basePrice;
    const isStatusChanged = prev.status !== itemData.status;

    const updated: MenuItem = {
      ...prev,
      ...itemData,
      id: itemData.id,
      updatedAt: now
    };

    items[idx] = updated;
    saveMenuItems(items);

    let action: MenuChangeLog['action'] = 'Updated';
    let details = `Updated item fields: ${updated.name}`;
    if (isPriceChanged) {
      action = 'Price Changed';
      details = `Base price changed from ₹${prev.basePrice} to ₹${updated.basePrice}`;
    } else if (isStatusChanged) {
      action = 'Stock Toggled';
      details = `Availability changed from ${prev.status} to ${updated.status}`;
    }

    addMenuAuditLog({
      itemId: updated.id,
      itemName: updated.name,
      action,
      changedBy: performer,
      role: performerRole,
      details
    });

    return updated;
  } else {
    // Create new item
    // Generate unique code if not provided
    const code = itemData.itemCode?.trim() || `MN-${items.length + 101}`;
    if (items.some(i => i.itemCode.toLowerCase() === code.toLowerCase() && !i.isArchived)) {
      throw new Error(`Item code "${code}" already exists in the active catalog`);
    }

    const newItem: MenuItem = {
      ...itemData,
      id: `m-${Date.now()}`,
      itemCode: code,
      isArchived: false,
      ordersCount: 0,
      revenue: 0,
      rating: 5.0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now
    };

    items.unshift(newItem);
    saveMenuItems(items);

    addMenuAuditLog({
      itemId: newItem.id,
      itemName: newItem.name,
      action: 'Created',
      changedBy: performer,
      role: performerRole,
      details: `Created new menu item in ${newItem.category} (Base: ₹${newItem.basePrice})`
    });

    return newItem;
  }
}

export function archiveMenuItem(
  id: string,
  performer = 'Admin',
  performerRole = 'RESTAURANT_ADMIN'
): void {
  const items = loadMenuItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) throw new Error('Menu item not found');

  const item = items[idx];
  items[idx] = { ...item, isArchived: true, status: 'Unavailable', updatedAt: new Date().toISOString() };
  saveMenuItems(items);

  addMenuAuditLog({
    itemId: item.id,
    itemName: item.name,
    action: 'Archived',
    changedBy: performer,
    role: performerRole,
    details: `Item archived from active catalog to preserve order historical integrity`
  });
}

export function restoreMenuItem(
  id: string,
  performer = 'Admin',
  performerRole = 'RESTAURANT_ADMIN'
): void {
  const items = loadMenuItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) throw new Error('Menu item not found');

  const item = items[idx];
  items[idx] = { ...item, isArchived: false, status: 'Available', updatedAt: new Date().toISOString() };
  saveMenuItems(items);

  addMenuAuditLog({
    itemId: item.id,
    itemName: item.name,
    action: 'Restored',
    changedBy: performer,
    role: performerRole,
    details: `Archived item restored to active catalog`
  });
}

export function deleteMenuItem(
  id: string,
  performer = 'Admin',
  performerRole = 'RESTAURANT_ADMIN'
): void {
  const items = loadMenuItems();
  const item = items.find(i => i.id === id);
  if (!item) throw new Error('Item not found');

  // If item has recorded orders, forbid hard deletion to preserve records (FR-MENU-003)
  if (item.ordersCount > 0) {
    throw new Error(`Cannot permanently delete "${item.name}" because it has ${item.ordersCount} historical order transactions. Please Archive it instead.`);
  }

  const updated = items.filter(i => i.id !== id);
  saveMenuItems(updated);

  addMenuAuditLog({
    itemId: id,
    itemName: item.name,
    action: 'Archived',
    changedBy: performer,
    role: performerRole,
    details: `Permanently removed zero-order menu record`
  });
}

// ─── CATEGORY MANAGEMENT (FR-MENU-004) ────────────────────────────────────────

export function saveCategory(name: string, description = ''): MenuCategoryRecord {
  const cats = loadMenuCategories();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name cannot be empty');

  const existing = cats.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    existing.description = description;
    saveMenuCategories(cats);
    return existing;
  }

  const newCat: MenuCategoryRecord = {
    id: `cat-${Date.now()}`,
    name: trimmed,
    description,
    displayOrder: cats.length + 1,
    isActive: true
  };
  cats.push(newCat);
  saveMenuCategories(cats);
  return newCat;
}

export function deleteCategory(id: string): void {
  const cats = loadMenuCategories();
  const cat = cats.find(c => c.id === id);
  if (!cat) return;

  const items = loadMenuItems();
  const isUsed = items.some(i => i.category.toLowerCase() === cat.name.toLowerCase() && !i.isArchived);
  if (isUsed) {
    throw new Error(`Cannot delete category "${cat.name}" because active menu items belong to it. Reassign items first.`);
  }

  saveMenuCategories(cats.filter(c => c.id !== id));
}

// ─── ANALYTICS & METRICS (FR-MENU-015, FR-MENU-016) ───────────────────────────

export function getMenuMetrics(): MenuMetrics {
  const items = loadMenuItems().filter(i => !i.isArchived);
  const categories = loadMenuCategories().filter(c => c.isActive);

  const availableItems = items.filter(i => i.status === 'Available').length;
  const unavailableItems = items.filter(i => i.status === 'Unavailable').length;
  const outOfStockItems = items.filter(i => i.status === 'Out of Stock').length;
  const popularItemsCount = items.filter(i => i.tags.includes('Popular') || i.tags.includes('Bestseller')).length;

  const totalRevenue = items.reduce((s, i) => s + i.revenue, 0);

  // Profit margin calculation
  const totalMargin = items.reduce((s, i) => {
    const margin = i.basePrice > 0 ? ((i.basePrice - i.costPrice) / i.basePrice) * 100 : 0;
    return s + margin;
  }, 0);
  const avgProfitMargin = items.length > 0 ? Math.round(totalMargin / items.length) : 0;

  // Best-sellers (sorted by ordersCount desc)
  const bestSellers = [...items].sort((a, b) => b.ordersCount - a.ordersCount).slice(0, 5);

  // Low-performing (items with lowest ordersCount, excluding brand new items)
  const lowPerformers = [...items].sort((a, b) => a.ordersCount - b.ordersCount).slice(0, 5);

  return {
    totalItems: items.length,
    availableItems,
    unavailableItems,
    outOfStockItems,
    totalCategories: categories.length,
    popularItemsCount,
    avgProfitMargin,
    totalMenuRevenue: totalRevenue,
    bestSellers,
    lowPerformers
  };
}

// ─── CSV EXPORT & IMPORT (FR-MENU-017) ────────────────────────────────────────

export function exportMenuToCSV(items: MenuItem[]): void {
  const headers = [
    'Item Code',
    'Name',
    'Category',
    'Diet',
    'Base Price',
    'Cost Price',
    'Status',
    'Allergens',
    'Tags',
    'Orders Handled',
    'Total Revenue',
    'Description'
  ];

  const rows = items.map(i => [
    i.itemCode,
    `"${i.name.replace(/"/g, '""')}"`,
    `"${i.category}"`,
    i.diet,
    i.basePrice,
    i.costPrice,
    i.status,
    `"${i.allergens.join('; ')}"`,
    `"${i.tags.join('; ')}"`,
    i.ordersCount,
    i.revenue,
    `"${i.description.replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `menu_catalog_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export function importMenuFromCSV(
  csvText: string,
  performer = 'Admin'
): { imported: number; updated: number; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file is empty or missing headers');
  }

  const existingItems = loadMenuItems();
  let imported = 0;
  let updated = 0;
  const errors: string[] = [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const codeIdx = headers.findIndex(h => h.includes('code'));
  const nameIdx = headers.findIndex(h => h.includes('name'));
  const catIdx = headers.findIndex(h => h.includes('category'));
  const priceIdx = headers.findIndex(h => h.includes('price') && !h.includes('cost'));
  const costIdx = headers.findIndex(h => h.includes('cost'));
  const dietIdx = headers.findIndex(h => h.includes('diet'));
  const descIdx = headers.findIndex(h => h.includes('desc'));

  if (nameIdx === -1 || priceIdx === -1) {
    throw new Error('CSV must contain at least "Name" and "Base Price" columns.');
  }

  for (let i = 1; i < lines.length; i++) {
    try {
      // Split by comma ignoring commas inside quotes
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
      const name = values[nameIdx];
      const basePrice = parseFloat(values[priceIdx]);

      if (!name || isNaN(basePrice) || basePrice < 0) {
        errors.push(`Row ${i + 1}: Missing name or valid base price.`);
        continue;
      }

      const itemCode = codeIdx > -1 && values[codeIdx] ? values[codeIdx] : `MN-${Date.now().toString().slice(-4)}`;
      const category = catIdx > -1 && values[catIdx] ? values[catIdx] : 'Main Course';
      const costPrice = costIdx > -1 && !isNaN(parseFloat(values[costIdx])) ? parseFloat(values[costIdx]) : Math.round(basePrice * 0.35);
      const diet = dietIdx > -1 && ['Veg', 'Non-Veg', 'Vegan'].includes(values[dietIdx]) ? (values[dietIdx] as DietType) : 'Veg';
      const description = descIdx > -1 && values[descIdx] ? values[descIdx] : '';

      const matchIdx = existingItems.findIndex(
        it => it.itemCode.toLowerCase() === itemCode.toLowerCase() || it.name.toLowerCase() === name.toLowerCase()
      );

      if (matchIdx > -1) {
        // Update existing item
        existingItems[matchIdx] = {
          ...existingItems[matchIdx],
          name,
          category,
          basePrice,
          costPrice,
          diet,
          description: description || existingItems[matchIdx].description,
          updatedAt: new Date().toISOString()
        };
        updated++;
      } else {
        // Insert new item
        const newItem: MenuItem = {
          id: `m-${Date.now()}-${i}`,
          itemCode,
          name,
          category,
          description,
          imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop',
          diet,
          basePrice,
          costPrice,
          status: 'Available',
          isArchived: false,
          allergens: [],
          variants: [{ id: `v-${Date.now()}`, name: 'Regular', price: basePrice, isDefault: true }],
          addons: [],
          branchPricing: [],
          schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '11:00', endTime: '23:00', isActive: true },
          tags: ['New'],
          ordersCount: 0,
          revenue: 0,
          rating: 5.0,
          reviewCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        existingItems.unshift(newItem);
        imported++;
      }
    } catch (err: any) {
      errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  saveMenuItems(existingItems);
  addMenuAuditLog({
    itemId: 'batch-import',
    itemName: 'CSV Import Batch',
    action: 'Created',
    changedBy: performer,
    role: 'RESTAURANT_ADMIN',
    details: `Imported ${imported} new items, updated ${updated} existing records via CSV`
  });

  return { imported, updated, errors };
}
