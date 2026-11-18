import { supabase } from './supabase';

export interface BranchOperatingDay {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isOpen: boolean;
  openTime: string;   // e.g. '08:00'
  closeTime: string;  // e.g. '23:00'
  hasSplitShift?: boolean;
  splitOpenTime?: string;
  splitCloseTime?: string;
}

export interface BranchHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  isFullDayClosed: boolean;
  partialOpenTime?: string;
  partialCloseTime?: string;
  notes?: string;
}

export interface BranchMenuOverride {
  itemId: string;
  itemName: string;
  category: string;
  basePrice: number;
  branchPrice: number;
  isAvailable: boolean;
  taxRatePercent?: number;
}

export interface BranchStaffAssignment {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Branch Manager' | 'Head Chef' | 'Sous Chef' | 'Senior Barista' | 'Floor Host' | 'Cashier' | 'Server';
  branchId: string;
  isPrimaryBranch: boolean;
  shiftTiming: string;
}

export interface BranchRecord {
  id: string;
  organizationId?: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  isActive: boolean;
  seatingCapacity: number;
  establishedDate: string;
  operatingHours: BranchOperatingDay[];
  holidays: BranchHoliday[];
  menuOverrides: BranchMenuOverride[];
  assignedStaff: BranchStaffAssignment[];
  // Analytics rollup
  monthlyRevenue: number;
  monthlyOrders: number;
  activeStaffCount: number;
  avgOrderValue: number;
  customerSatisfaction: number;
}

export interface BranchSalesReport {
  branchId: string;
  branchName: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  uniqueCustomers: number;
  dineInSharePercent: number;
  deliverySharePercent: number;
  takeawaySharePercent: number;
  topSellingItem: string;
}

// ─── Default Operating Hours Template ─────────────────────────────────────────

export const DEFAULT_OPERATING_HOURS: BranchOperatingDay[] = [
  { day: 'Monday', isOpen: true, openTime: '08:00', closeTime: '23:00' },
  { day: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '23:00' },
  { day: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '23:00' },
  { day: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '23:00' },
  { day: 'Friday', isOpen: true, openTime: '08:00', closeTime: '00:00' },
  { day: 'Saturday', isOpen: true, openTime: '08:00', closeTime: '00:30' },
  { day: 'Sunday', isOpen: true, openTime: '08:30', closeTime: '23:00' },
];

// ─── Mock Branch Data ─────────────────────────────────────────────────────────

const INITIAL_BRANCHES: BranchRecord[] = [
  {
    id: 'br-downtown',
    code: 'DF-01',
    name: 'Downtown Flagship #01',
    address: '42 Heritage Boulevard, Central Commercial Square',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '+91 22 2490 8820',
    email: 'downtown@cafescorner.com',
    managerName: 'George Daniel',
    managerEmail: 'george.d@cafescorner.com',
    managerPhone: '+91 98200 44101',
    isActive: true,
    seatingCapacity: 95,
    establishedDate: '2021-04-12',
    operatingHours: DEFAULT_OPERATING_HOURS,
    holidays: [
      { id: 'hol-1', name: 'Diwali Deep Clean & Holiday', date: '2024-11-01', isFullDayClosed: true, notes: 'Annual festival closure' },
      { id: 'hol-2', name: 'New Year Early Eve', date: '2024-12-31', isFullDayClosed: false, partialOpenTime: '08:00', partialCloseTime: '18:00', notes: 'Private dinner party from 7 PM' },
    ],
    menuOverrides: [
      { itemId: 'menu-1', itemName: 'British Fish & Chips', category: 'Mains', basePrice: 18.5, branchPrice: 18.5, isAvailable: true },
      { itemId: 'menu-2', itemName: 'Truffle Mushroom Pasta', category: 'Mains', basePrice: 22.0, branchPrice: 22.0, isAvailable: true },
      { itemId: 'menu-3', itemName: 'Buffalo Mozzarella Margherita', category: 'Pizzas', basePrice: 16.0, branchPrice: 16.0, isAvailable: true },
      { itemId: 'menu-4', itemName: 'Single Origin Espresso & Cold Brew', category: 'Beverages', basePrice: 6.5, branchPrice: 6.5, isAvailable: true },
      { itemId: 'menu-5', itemName: 'Baked Basque Blueberry Cheesecake', category: 'Desserts', basePrice: 9.5, branchPrice: 9.5, isAvailable: true },
    ],
    assignedStaff: [
      { id: 'st-1', name: 'Aarav Nair', email: 'aarav.n@cafescorner.com', phone: '+91 98201 11029', role: 'Head Chef', branchId: 'br-downtown', isPrimaryBranch: true, shiftTiming: 'Morning (07:30 - 16:30)' },
      { id: 'st-2', name: 'Simran Kaur', email: 'simran.k@cafescorner.com', phone: '+91 98114 99012', role: 'Floor Host', branchId: 'br-downtown', isPrimaryBranch: true, shiftTiming: 'Evening (15:00 - 00:00)' },
      { id: 'st-5', name: 'Rohan Deshpande', email: 'rohan.d@cafescorner.com', phone: '+91 98334 00987', role: 'Cashier', branchId: 'br-downtown', isPrimaryBranch: true, shiftTiming: 'Full Day (09:00 - 18:00)' },
    ],
    monthlyRevenue: 38450,
    monthlyOrders: 820,
    activeStaffCount: 14,
    avgOrderValue: 46.8,
    customerSatisfaction: 4.88,
  },
  {
    id: 'br-uptown',
    code: 'UP-02',
    name: 'Uptown Promenade #02',
    address: '88 Galleria Avenue, Near Skyview Heights',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    phone: '+91 22 2640 1190',
    email: 'uptown@cafescorner.com',
    managerName: 'Pooja Kashyap',
    managerEmail: 'pooja.k@cafescorner.com',
    managerPhone: '+91 98199 88320',
    isActive: true,
    seatingCapacity: 70,
    establishedDate: '2022-09-18',
    operatingHours: [
      ...DEFAULT_OPERATING_HOURS.map(d => (d.day === 'Sunday' ? { ...d, openTime: '09:00', closeTime: '22:30' } : d))
    ],
    holidays: [
      { id: 'hol-3', name: 'Renovation Day', date: '2024-11-20', isFullDayClosed: true, notes: 'Kitchen exhaust upgrade' },
    ],
    menuOverrides: [
      { itemId: 'menu-1', itemName: 'British Fish & Chips', category: 'Mains', basePrice: 18.5, branchPrice: 19.5, isAvailable: true }, // Uptown premium +$1
      { itemId: 'menu-2', itemName: 'Truffle Mushroom Pasta', category: 'Mains', basePrice: 22.0, branchPrice: 23.5, isAvailable: true },
      { itemId: 'menu-3', itemName: 'Buffalo Mozzarella Margherita', category: 'Pizzas', basePrice: 16.0, branchPrice: 16.0, isAvailable: true },
      { itemId: 'menu-4', itemName: 'Single Origin Espresso & Cold Brew', category: 'Beverages', basePrice: 6.5, branchPrice: 7.0, isAvailable: true },
      { itemId: 'menu-5', itemName: 'Baked Basque Blueberry Cheesecake', category: 'Desserts', basePrice: 9.5, branchPrice: 10.0, isAvailable: true },
    ],
    assignedStaff: [
      { id: 'st-4', name: 'Meera Pillai', email: 'meera.p@cafescorner.com', phone: '+91 98220 77112', role: 'Senior Barista', branchId: 'br-uptown', isPrimaryBranch: true, shiftTiming: 'Morning (08:00 - 17:00)' },
      { id: 'st-6', name: 'Kunal Singhania', email: 'kunal.s@cafescorner.com', phone: '+91 97722 11990', role: 'Sous Chef', branchId: 'br-uptown', isPrimaryBranch: true, shiftTiming: 'Evening (14:00 - 23:00)' },
    ],
    monthlyRevenue: 28900,
    monthlyOrders: 640,
    activeStaffCount: 10,
    avgOrderValue: 45.1,
    customerSatisfaction: 4.82,
  },
  {
    id: 'br-waterfront',
    code: 'WT-03',
    name: 'Waterfront Terrace #03',
    address: '15 Marine Bay Harbor Boardwalk',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400021',
    phone: '+91 22 2280 5500',
    email: 'waterfront@cafescorner.com',
    managerName: 'Arjun Dasgupta',
    managerEmail: 'arjun.d@cafescorner.com',
    managerPhone: '+91 98210 33491',
    isActive: true,
    seatingCapacity: 120,
    establishedDate: '2023-02-14',
    operatingHours: [
      ...DEFAULT_OPERATING_HOURS.map(d => ({ ...d, closeTime: '01:00' })) // Late night harbor deck
    ],
    holidays: [],
    menuOverrides: [
      { itemId: 'menu-1', itemName: 'British Fish & Chips', category: 'Mains', basePrice: 18.5, branchPrice: 20.0, isAvailable: true }, // Harbor deck pricing
      { itemId: 'menu-2', itemName: 'Truffle Mushroom Pasta', category: 'Mains', basePrice: 22.0, branchPrice: 24.0, isAvailable: true },
      { itemId: 'menu-3', itemName: 'Buffalo Mozzarella Margherita', category: 'Pizzas', basePrice: 16.0, branchPrice: 17.5, isAvailable: true },
      { itemId: 'menu-4', itemName: 'Single Origin Espresso & Cold Brew', category: 'Beverages', basePrice: 6.5, branchPrice: 7.5, isAvailable: true },
      { itemId: 'menu-5', itemName: 'Baked Basque Blueberry Cheesecake', category: 'Desserts', basePrice: 9.5, branchPrice: 10.5, isAvailable: true },
    ],
    assignedStaff: [
      { id: 'st-3', name: 'David Reynolds', email: 'david.r@cafescorner.com', phone: '+91 99100 88223', role: 'Sous Chef', branchId: 'br-waterfront', isPrimaryBranch: true, shiftTiming: 'Evening (16:00 - 01:00)' },
    ],
    monthlyRevenue: 34200,
    monthlyOrders: 710,
    activeStaffCount: 16,
    avgOrderValue: 48.2,
    customerSatisfaction: 4.91,
  },
  {
    id: 'br-airport',
    code: 'AE-04',
    name: 'Airport Express Bistro #04',
    address: 'Terminal 2 Departures, Concourse Hall B',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400099',
    phone: '+91 22 6685 9940',
    email: 'airport@cafescorner.com',
    managerName: 'Sanjay Rawat',
    managerEmail: 'sanjay.r@cafescorner.com',
    managerPhone: '+91 98331 44556',
    isActive: true,
    seatingCapacity: 45,
    establishedDate: '2023-10-05',
    operatingHours: [
      ...DEFAULT_OPERATING_HOURS.map(d => ({ ...d, openTime: '04:00', closeTime: '02:00' })) // Extended airport hours
    ],
    holidays: [],
    menuOverrides: [
      { itemId: 'menu-1', itemName: 'British Fish & Chips', category: 'Mains', basePrice: 18.5, branchPrice: 21.0, isAvailable: false }, // Heavy fried food not served at express
      { itemId: 'menu-2', itemName: 'Truffle Mushroom Pasta', category: 'Mains', basePrice: 22.0, branchPrice: 24.5, isAvailable: true },
      { itemId: 'menu-3', itemName: 'Buffalo Mozzarella Margherita', category: 'Pizzas', basePrice: 16.0, branchPrice: 18.0, isAvailable: true },
      { itemId: 'menu-4', itemName: 'Single Origin Espresso & Cold Brew', category: 'Beverages', basePrice: 6.5, branchPrice: 8.0, isAvailable: true },
      { itemId: 'menu-5', itemName: 'Baked Basque Blueberry Cheesecake', category: 'Desserts', basePrice: 9.5, branchPrice: 11.0, isAvailable: true },
    ],
    assignedStaff: [
      { id: 'st-7', name: 'Tanvi Joshi', email: 'tanvi.j@cafescorner.com', phone: '+91 98450 12345', role: 'Floor Host', branchId: 'br-airport', isPrimaryBranch: true, shiftTiming: 'Graveyard / Early (03:30 - 12:30)' },
    ],
    monthlyRevenue: 24100,
    monthlyOrders: 590,
    activeStaffCount: 8,
    avgOrderValue: 40.8,
    customerSatisfaction: 4.75,
  },
];

const LOCAL_STORAGE_KEY = 'cafes_corner_branches_v2';

function loadBranchesFromStorage(): BranchRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse branches from storage:', err);
  }
  return INITIAL_BRANCHES;
}

function saveBranchesToStorage(branches: BranchRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(branches));
  } catch (err) {
    console.warn('Failed to save branches to storage:', err);
  }
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function fetchAllBranches(orgId?: string): Promise<BranchRecord[]> {
  try {
    let query = supabase.from('org_branches').select('*').order('created_at', { ascending: true });
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      const stored = loadBranchesFromStorage();
      // Merge with stored details for operating hours, holidays, etc.
      return data.map((d: any) => {
        const found = stored.find(s => s.id === d.id || s.name.toLowerCase() === d.name.toLowerCase());
        return {
          id: d.id,
          organizationId: d.organization_id,
          code: found?.code || `BR-${d.id.substring(0, 4).toUpperCase()}`,
          name: d.name,
          address: d.address || found?.address || 'City Commercial Center',
          city: d.city || found?.city || 'Mumbai',
          state: found?.state || 'Maharashtra',
          pincode: found?.pincode || '400001',
          phone: d.phone || found?.phone || '+91 22 2490 8800',
          email: found?.email || `${d.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@cafescorner.com`,
          managerName: d.manager_name || found?.managerName || 'Operations Lead',
          managerEmail: found?.managerEmail || 'manager@cafescorner.com',
          managerPhone: found?.managerPhone || '+91 98000 11223',
          isActive: d.is_active !== undefined ? d.is_active : (found?.isActive ?? true),
          seatingCapacity: found?.seatingCapacity || 80,
          establishedDate: found?.establishedDate || '2022-01-01',
          operatingHours: found?.operatingHours || DEFAULT_OPERATING_HOURS,
          holidays: found?.holidays || [],
          menuOverrides: found?.menuOverrides || [],
          assignedStaff: found?.assignedStaff || [],
          monthlyRevenue: found?.monthlyRevenue || 30000,
          monthlyOrders: found?.monthlyOrders || 600,
          activeStaffCount: found?.activeStaffCount || 10,
          avgOrderValue: found?.avgOrderValue || 45.0,
          customerSatisfaction: found?.customerSatisfaction || 4.8,
        };
      });
    }
  } catch (err) {
    console.warn('Fallback to local branch storage:', err);
  }
  return loadBranchesFromStorage();
}

export async function saveBranch(branch: Partial<BranchRecord>): Promise<BranchRecord> {
  const branches = loadBranchesFromStorage();
  const existingIdx = branches.findIndex(b => b.id === branch.id);

  let updatedBranch: BranchRecord;

  if (existingIdx >= 0) {
    updatedBranch = {
      ...branches[existingIdx],
      ...branch,
    } as BranchRecord;
    branches[existingIdx] = updatedBranch;
  } else {
    const newId = branch.id || `br-${Date.now()}`;
    updatedBranch = {
      id: newId,
      code: branch.code || `BR-${Math.floor(10 + Math.random() * 90)}`,
      name: branch.name || 'New Branch',
      address: branch.address || 'Commercial Hub',
      city: branch.city || 'Mumbai',
      state: branch.state || 'Maharashtra',
      pincode: branch.pincode || '400001',
      phone: branch.phone || '+91 22 2490 0000',
      email: branch.email || 'outlet@cafescorner.com',
      managerName: branch.managerName || 'Manager Assigned',
      managerEmail: branch.managerEmail || 'manager@cafescorner.com',
      managerPhone: branch.managerPhone || '+91 98000 00000',
      isActive: branch.isActive !== undefined ? branch.isActive : true,
      seatingCapacity: branch.seatingCapacity || 60,
      establishedDate: branch.establishedDate || new Date().toISOString().split('T')[0],
      operatingHours: branch.operatingHours || DEFAULT_OPERATING_HOURS,
      holidays: branch.holidays || [],
      menuOverrides: branch.menuOverrides || [],
      assignedStaff: branch.assignedStaff || [],
      monthlyRevenue: 0,
      monthlyOrders: 0,
      activeStaffCount: 0,
      avgOrderValue: 45.0,
      customerSatisfaction: 5.0,
    };
    branches.push(updatedBranch);
  }

  saveBranchesToStorage(branches);

  // Sync with Supabase org_branches if table is accessible
  try {
    await supabase.from('org_branches').upsert({
      id: updatedBranch.id,
      name: updatedBranch.name,
      address: updatedBranch.address,
      city: updatedBranch.city,
      phone: updatedBranch.phone,
      manager_name: updatedBranch.managerName,
      is_active: updatedBranch.isActive,
    });
  } catch (err) {
    console.warn('Supabase org_branches upsert notice:', err);
  }

  return updatedBranch;
}

export async function toggleBranchStatus(branchId: string, isActive: boolean): Promise<void> {
  const branches = loadBranchesFromStorage();
  const branch = branches.find(b => b.id === branchId);
  if (branch) {
    branch.isActive = isActive;
    saveBranchesToStorage(branches);
    try {
      await supabase.from('org_branches').update({ is_active: isActive }).eq('id', branchId);
    } catch {
      // ignore
    }
  }
}

export async function deleteBranch(branchId: string): Promise<void> {
  const branches = loadBranchesFromStorage();
  const filtered = branches.filter(b => b.id !== branchId);
  saveBranchesToStorage(filtered);
  try {
    await supabase.from('org_branches').delete().eq('id', branchId);
  } catch {
    // ignore
  }
}

export async function getBranchReports(): Promise<BranchSalesReport[]> {
  const branches = loadBranchesFromStorage();
  return branches.map(b => ({
    branchId: b.id,
    branchName: b.name,
    totalRevenue: b.monthlyRevenue,
    totalOrders: b.monthlyOrders,
    avgOrderValue: b.avgOrderValue,
    uniqueCustomers: Math.round(b.monthlyOrders * 0.72),
    dineInSharePercent: 62,
    deliverySharePercent: 24,
    takeawaySharePercent: 14,
    topSellingItem: b.id === 'br-airport' ? 'Artisanal Cold Brew' : 'British Fish & Chips',
  }));
}

// ─── Authorization / Restriction Helpers ─────────────────────────────────────

export function getAuthorizedBranchesForUser(userRole: string, userBranch?: string, allBranches: BranchRecord[] = []): BranchRecord[] {
  // Super Admin and Restaurant Admin have access to all branches
  if (userRole === 'SUPER_ADMIN' || userRole === 'RESTAURANT_ADMIN') {
    return allBranches;
  }
  // Restricted user: Floor Staff / Branch Manager restricted only to their assigned branch
  if (userBranch) {
    const matched = allBranches.filter(b =>
      b.id.toLowerCase() === userBranch.toLowerCase() ||
      b.name.toLowerCase().includes(userBranch.toLowerCase()) ||
      b.code.toLowerCase() === userBranch.toLowerCase()
    );
    return matched.length > 0 ? matched : [allBranches[0]];
  }
  return allBranches.slice(0, 1);
}
