import { supabase } from './supabase';
import { CustomerProfile, loadCustomersFromStorage } from './customerManagementApi';
import { loadTables, updateTableStatus, releaseTable } from './tableManagementApi';

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type OrderType = 'Dine-in' | 'Takeaway' | 'Delivery';
export type OrderStatus =
  | 'New'
  | 'Accepted'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'Dispatched'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected'
  | 'Refunded';

export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Wallet' | 'Online' | 'Pending';
export type PaymentStatus = 'Pending' | 'Paid' | 'Partially Refunded' | 'Fully Refunded' | 'Failed';

export interface OrderItemCustomization {
  name: string;
  value: string;
  priceAdjustment: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  category: string;
  basePrice: number;
  quantity: number;
  customizations: OrderItemCustomization[];
  addOns: string[];
  specialInstructions?: string;
  totalPrice: number;
  dietType: 'Veg' | 'Non-Veg' | 'Vegan';
}

export interface RefundRecord {
  id: string;
  amount: number;
  reason: string;
  type: 'Partial' | 'Full';
  method: PaymentMethod;
  processedAt: string;
  processedBy: string;
  approved: boolean;
}

export interface OrderAuditEntry {
  id: string;
  action: string;
  fromStatus?: OrderStatus;
  toStatus?: OrderStatus;
  performer: string;
  details: string;
  timestamp: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;

  // Customer
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  // Table (Dine-in only)
  tableId?: string;
  tableNumber?: string;

  // Items
  items: OrderItem[];

  // Pricing
  subtotal: number;
  discountType?: 'Percentage' | 'Fixed';
  discountValue: number;
  discountAmount: number;
  couponCode?: string;
  taxRate: number;      // e.g. 5 for 5%
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;

  // Payment
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: string;

  // Delivery (Delivery orders)
  deliveryAddress?: string;
  deliveryNotes?: string;
  estimatedDeliveryTime?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;

  // Special
  specialInstructions?: string;
  branchName: string;
  assignedTo?: string;    // kitchen/server staff

  // Refunds
  refunds: RefundRecord[];

  // Audit
  auditLog: OrderAuditEntry[];

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

// ─── MENU CATALOG (shared with MenuPerformanceView) ───────────────────────────
export interface CatalogMenuItem {
  id: string;
  name: string;
  category: string;
  diet: 'Veg' | 'Non-Veg' | 'Vegan';
  price: number;
  status: 'Available' | 'Out of Stock' | 'Seasonal';
  tags: string[];
  customizationOptions?: { name: string; choices: { label: string; priceAdj: number }[] }[];
  addOnOptions?: { name: string; price: number }[];
}

const MENU_STORAGE_KEY = 'crm_menu_items_v1';

export function loadMenuCatalog(): CatalogMenuItem[] {
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    if (raw) {
      const items = JSON.parse(raw);
      return items.map((i: any) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        diet: i.diet,
        price: i.price,
        status: i.status,
        tags: i.tags || [],
        customizationOptions: [
          { name: 'Spice Level', choices: [{ label: 'Mild', priceAdj: 0 }, { label: 'Medium', priceAdj: 0 }, { label: 'Hot', priceAdj: 0 }, { label: 'Extra Hot', priceAdj: 0 }] },
          { name: 'Portion Size', choices: [{ label: 'Regular', priceAdj: 0 }, { label: 'Large', priceAdj: 60 }, { label: 'Half', priceAdj: -50 }] },
        ],
        addOnOptions: [
          { name: 'Extra Bread', price: 30 },
          { name: 'Extra Sauce', price: 20 },
          { name: 'Pickle', price: 15 },
        ],
      }));
    }
  } catch {}
  return [];
}

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const STORAGE_ORDERS_KEY = 'crm_order_management_v2';

// ─── SEED ORDERS ──────────────────────────────────────────────────────────────
const SEED_ORDERS: OrderRecord[] = [
  {
    id: 'om-001', orderNumber: 'ORD-5001', orderType: 'Dine-in', status: 'Preparing',
    customerId: 'CUST-10491', customerName: 'Alexander Wright', customerPhone: '+91 98200 88210', customerEmail: 'alex.wright@executive-advisors.com',
    tableId: 'tbl-3', tableNumber: 'T-03',
    items: [
      { id: 'oi-1', menuItemId: 'm6', name: 'Mutton Rogan Josh', category: 'Main Course', basePrice: 420, quantity: 2, customizations: [{ name: 'Spice Level', value: 'Medium', priceAdjustment: 0 }], addOns: ['Extra Bread'], specialInstructions: 'No garlic please', totalPrice: 870, dietType: 'Non-Veg' },
      { id: 'oi-2', menuItemId: 'm5', name: 'Garlic Naan', category: 'Breads', basePrice: 60, quantity: 4, customizations: [], addOns: [], totalPrice: 240, dietType: 'Veg' },
      { id: 'oi-3', menuItemId: 'm10', name: 'Gulab Jamun', category: 'Desserts', basePrice: 120, quantity: 2, customizations: [], addOns: [], totalPrice: 240, dietType: 'Veg' },
    ],
    subtotal: 1350, discountValue: 10, discountType: 'Percentage', discountAmount: 135, couponCode: 'VIP10', taxRate: 5, taxAmount: 60.75, deliveryFee: 0, totalAmount: 1275.75,
    paymentMethod: 'Card', paymentStatus: 'Pending',
    branchName: 'Main Branch',
    specialInstructions: 'VIP Guest — Anniversary dinner',
    refunds: [],
    auditLog: [
      { id: 'al-1', action: 'Order Created', toStatus: 'New', performer: 'Receptionist', details: 'Dine-in order created for T-03', timestamp: new Date(Date.now() - 40 * 60000).toISOString() },
      { id: 'al-2', action: 'Order Accepted', fromStatus: 'New', toStatus: 'Accepted', performer: 'Kitchen', details: 'Order accepted by kitchen', timestamp: new Date(Date.now() - 38 * 60000).toISOString() },
      { id: 'al-3', action: 'Preparing', fromStatus: 'Accepted', toStatus: 'Preparing', performer: 'Kitchen', details: 'Cooking in progress', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(), updatedAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'om-002', orderNumber: 'ORD-5002', orderType: 'Delivery', status: 'Dispatched',
    customerName: 'Priya Mehta', customerPhone: '9823456781', customerEmail: 'priya@email.com',
    items: [
      { id: 'oi-4', menuItemId: 'm3', name: 'Paneer Tikka', category: 'Starters', basePrice: 280, quantity: 1, customizations: [], addOns: [], totalPrice: 280, dietType: 'Veg' },
      { id: 'oi-5', menuItemId: 'm4', name: 'Dal Makhani', category: 'Main Course', basePrice: 240, quantity: 1, customizations: [{ name: 'Spice Level', value: 'Mild', priceAdjustment: 0 }], addOns: ['Extra Bread'], totalPrice: 270, dietType: 'Veg' },
    ],
    subtotal: 550, discountValue: 0, discountAmount: 0, taxRate: 5, taxAmount: 27.5, deliveryFee: 40, totalAmount: 617.5,
    paymentMethod: 'UPI', paymentStatus: 'Paid', paidAt: new Date(Date.now() - 60 * 60000).toISOString(),
    deliveryAddress: '12 MG Road, Bangalore 560001', deliveryNotes: 'Ring doorbell twice', estimatedDeliveryTime: '30-40 minutes', deliveryPersonName: 'Karthik Reddy', deliveryPersonPhone: '9189012345',
    branchName: 'City Center',
    refunds: [],
    auditLog: [
      { id: 'al-5', action: 'Order Created', toStatus: 'New', performer: 'Online', details: 'Delivery order placed via website', timestamp: new Date(Date.now() - 75 * 60000).toISOString() },
      { id: 'al-6', action: 'Dispatched', fromStatus: 'Ready', toStatus: 'Dispatched', performer: 'Karthik', details: 'Out for delivery', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 75 * 60000).toISOString(), updatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: 'om-003', orderNumber: 'ORD-5003', orderType: 'Takeaway', status: 'Ready',
    customerName: 'Rohit Kumar', customerPhone: '9712345678',
    items: [
      { id: 'oi-7', menuItemId: 'm2', name: 'Chicken Biryani', category: 'Rice & Biryani', basePrice: 350, quantity: 2, customizations: [], addOns: [], totalPrice: 700, dietType: 'Non-Veg' },
      { id: 'oi-8', menuItemId: 'm10', name: 'Gulab Jamun', category: 'Desserts', basePrice: 120, quantity: 1, customizations: [], addOns: [], totalPrice: 120, dietType: 'Veg' },
    ],
    subtotal: 820, discountValue: 0, discountAmount: 0, taxRate: 5, taxAmount: 41, deliveryFee: 0, totalAmount: 861,
    paymentMethod: 'Cash', paymentStatus: 'Paid', paidAt: new Date(Date.now() - 15 * 60000).toISOString(),
    branchName: 'Main Branch',
    refunds: [],
    auditLog: [
      { id: 'al-9', action: 'Order Created', toStatus: 'New', performer: 'Counter', details: 'Walk-in takeaway order', timestamp: new Date(Date.now() - 35 * 60000).toISOString() },
      { id: 'al-10', action: 'Ready', fromStatus: 'Preparing', toStatus: 'Ready', performer: 'Kitchen', details: 'Order ready for pickup', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(), updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'om-004', orderNumber: 'ORD-5004', orderType: 'Dine-in', status: 'Completed',
    customerName: 'Anjali Singh', customerPhone: '9634567890',
    tableId: 'tbl-12', tableNumber: 'T-12',
    items: [
      { id: 'oi-11', menuItemId: 'm9', name: 'Veg Thali', category: 'Main Course', basePrice: 220, quantity: 3, customizations: [], addOns: [], totalPrice: 660, dietType: 'Veg' },
      { id: 'oi-12', menuItemId: 'm7', name: 'Mango Lassi', category: 'Beverages', basePrice: 90, quantity: 3, customizations: [], addOns: [], totalPrice: 270, dietType: 'Veg' },
    ],
    subtotal: 930, discountValue: 5, discountType: 'Percentage', discountAmount: 46.5, taxRate: 5, taxAmount: 44.18, deliveryFee: 0, totalAmount: 927.68,
    paymentMethod: 'UPI', paymentStatus: 'Paid', paidAt: new Date(Date.now() - 30 * 60000).toISOString(),
    branchName: 'Rooftop',
    refunds: [],
    auditLog: [
      { id: 'al-13', action: 'Order Completed', fromStatus: 'Served', toStatus: 'Completed', performer: 'Waiter', details: 'Bill settled and guests departed', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(), updatedAt: new Date(Date.now() - 30 * 60000).toISOString(), completedAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'om-005', orderNumber: 'ORD-5005', orderType: 'Dine-in', status: 'New',
    customerName: 'Vikram Nair', customerPhone: '9545678901',
    tableId: 'tbl-5', tableNumber: 'T-05',
    items: [
      { id: 'oi-14', menuItemId: 'm8', name: 'Fish Curry', category: 'Main Course', basePrice: 380, quantity: 2, customizations: [{ name: 'Spice Level', value: 'Hot', priceAdjustment: 0 }], addOns: [], totalPrice: 760, dietType: 'Non-Veg' },
      { id: 'oi-15', menuItemId: 'm5', name: 'Garlic Naan', category: 'Breads', basePrice: 60, quantity: 6, customizations: [], addOns: [], totalPrice: 360, dietType: 'Veg' },
    ],
    subtotal: 1120, discountValue: 0, discountAmount: 0, taxRate: 5, taxAmount: 56, deliveryFee: 0, totalAmount: 1176,
    paymentMethod: 'Pending', paymentStatus: 'Pending',
    branchName: 'Main Branch',
    refunds: [],
    auditLog: [
      { id: 'al-16', action: 'Order Created', toStatus: 'New', performer: 'Waiter', details: 'Dine-in order at T-05', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(), updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

// ─── VALID STATUS TRANSITIONS ─────────────────────────────────────────────────
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  New:         ['Accepted', 'Rejected', 'Cancelled'],
  Accepted:    ['Preparing', 'Cancelled'],
  Preparing:   ['Ready', 'Cancelled'],
  Ready:       ['Served', 'Dispatched', 'Completed'],
  Served:      ['Completed'],
  Dispatched:  ['Completed'],
  Completed:   ['Refunded'],
  Cancelled:   [],
  Rejected:    [],
  Refunded:    [],
};

export function getValidNextStatuses(current: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[current] || [];
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function loadOrders(): OrderRecord[] {
  try { const r = localStorage.getItem(STORAGE_ORDERS_KEY); if (r) return JSON.parse(r); } catch {}
  localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(SEED_ORDERS));
  return SEED_ORDERS;
}

export function saveOrders(orders: OrderRecord[]): void {
  localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  supabase.from('orders').upsert(orders.map(o => ({ id: o.id, order_number: o.orderNumber, status: o.status, updated_at: o.updatedAt }))).then(() => {});
}

export function generateOrderNumber(): string {
  return `ORD-${5000 + Math.floor(Math.random() * 5000)}`;
}

function calcOrderPricing(items: OrderItem[], discountType: 'Percentage' | 'Fixed' | undefined, discountValue: number, taxRate: number, deliveryFee: number) {
  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  const discountAmount = discountType === 'Percentage' ? (subtotal * discountValue) / 100 : discountValue;
  const taxable = subtotal - discountAmount;
  const taxAmount = (taxable * taxRate) / 100;
  const totalAmount = taxable + taxAmount + deliveryFee;
  return { subtotal, discountAmount, taxAmount, totalAmount };
}

// ─── ORDER CRUD ───────────────────────────────────────────────────────────────
export function createOrder(data: Omit<OrderRecord, 'id' | 'orderNumber' | 'status' | 'refunds' | 'auditLog' | 'createdAt' | 'updatedAt'>): OrderRecord {
  const orders = loadOrders();

  // Check table availability for Dine-in
  if (data.orderType === 'Dine-in' && data.tableId) {
    const tables = loadTables();
    const table = tables.find(t => t.id === data.tableId);
    if (!table) throw new Error('Selected table not found');
    if (table.status === 'Occupied' && table.currentOrderId) {
      throw new Error(`Table ${table.tableNumber} already has an active order`);
    }
  }

  const pricing = calcOrderPricing(data.items, data.discountType, data.discountValue, data.taxRate, data.deliveryFee);
  const now = new Date().toISOString();
  const order: OrderRecord = {
    ...data,
    ...pricing,
    id: `om-${Date.now()}`,
    orderNumber: generateOrderNumber(),
    status: 'New',
    refunds: [],
    auditLog: [{ id: `al-${Date.now()}`, action: 'Order Created', toStatus: 'New', performer: data.assignedTo || 'Staff', details: `${data.orderType} order created`, timestamp: now }],
    createdAt: now,
    updatedAt: now,
  };

  orders.unshift(order);
  saveOrders(orders);

  // Update table status to Occupied
  if (data.orderType === 'Dine-in' && data.tableId) {
    try {
      updateTableStatus(data.tableId, 'Occupied', data.assignedTo || 'Staff', {
        guestName: data.customerName,
        orderId: order.id,
      });
    } catch {}
  }

  // Update customer stats non-blocking
  if (data.customerId) {
    try {
      const { loadCustomersFromStorage, saveCustomer } = require('./customerManagementApi');
      const customers: CustomerProfile[] = loadCustomersFromStorage();
      const c = customers.find(c => c.id === data.customerId);
      if (c) {
        saveCustomer({ ...c, totalOrders: c.totalOrders + 1, updatedAt: now });
      }
    } catch {}
  }

  return order;
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus, performer: string, reason?: string): OrderRecord {
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new Error('Order not found');

  const order = orders[idx];
  const valid = getValidNextStatuses(order.status);
  if (!valid.includes(newStatus)) {
    throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
  }

  const now = new Date().toISOString();
  const auditEntry: OrderAuditEntry = {
    id: `al-${Date.now()}`,
    action: newStatus,
    fromStatus: order.status,
    toStatus: newStatus,
    performer,
    details: reason || `Status updated to ${newStatus}`,
    timestamp: now,
  };

  const updated: OrderRecord = {
    ...order,
    status: newStatus,
    updatedAt: now,
    auditLog: [...order.auditLog, auditEntry],
    ...(newStatus === 'Completed' ? { completedAt: now } : {}),
    ...(newStatus === 'Cancelled' ? { cancelledAt: now, cancellationReason: reason } : {}),
  };

  orders[idx] = updated;
  saveOrders(orders);

  // Table management side-effects
  if (order.tableId) {
    if (newStatus === 'Completed' || newStatus === 'Cancelled') {
      try { releaseTable(order.tableId, performer); } catch {}
    }
  }

  // Update customer totalSpend on completion
  if (newStatus === 'Completed' && order.customerId) {
    try {
      const { loadCustomersFromStorage, saveCustomer } = require('./customerManagementApi');
      const customers: CustomerProfile[] = loadCustomersFromStorage();
      const c = customers.find(c => c.id === order.customerId);
      if (c) {
        saveCustomer({ ...c, totalSpend: c.totalSpend + order.totalAmount, lastVisitDate: now, updatedAt: now });
      }
    } catch {}
  }

  return updated;
}

export function modifyOrderItems(orderId: string, items: OrderItem[], performer: string): OrderRecord {
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new Error('Order not found');

  const order = orders[idx];
  if (!['New', 'Accepted'].includes(order.status)) {
    throw new Error('Cannot modify items — order is already being prepared');
  }

  const pricing = calcOrderPricing(items, order.discountType, order.discountValue, order.taxRate, order.deliveryFee);
  const now = new Date().toISOString();
  const updated: OrderRecord = {
    ...order, ...pricing, items, updatedAt: now,
    auditLog: [...order.auditLog, { id: `al-${Date.now()}`, action: 'Items Modified', performer, details: `Order items updated (${items.length} items)`, timestamp: now }],
  };

  orders[idx] = updated;
  saveOrders(orders);
  return updated;
}

export function applyDiscount(orderId: string, discountType: 'Percentage' | 'Fixed', discountValue: number, couponCode: string | undefined, performer: string): OrderRecord {
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new Error('Order not found');

  const order = orders[idx];
  const pricing = calcOrderPricing(order.items, discountType, discountValue, order.taxRate, order.deliveryFee);
  const now = new Date().toISOString();
  const updated: OrderRecord = {
    ...order, ...pricing, discountType, discountValue, couponCode, updatedAt: now,
    auditLog: [...order.auditLog, { id: `al-${Date.now()}`, action: 'Discount Applied', performer, details: `${discountType === 'Percentage' ? discountValue + '%' : '₹' + discountValue} discount applied${couponCode ? ' (coupon: ' + couponCode + ')' : ''}`, timestamp: now }],
  };

  orders[idx] = updated;
  saveOrders(orders);
  return updated;
}

export function processRefund(orderId: string, amount: number, reason: string, type: 'Partial' | 'Full', method: PaymentMethod, performer: string): OrderRecord {
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new Error('Order not found');

  const order = orders[idx];
  if (!['Completed', 'Cancelled'].includes(order.status) && type !== 'Partial') {
    throw new Error('Full refund requires Completed or Cancelled status');
  }
  if (amount > order.totalAmount) throw new Error('Refund amount cannot exceed order total');

  const refund: RefundRecord = {
    id: `ref-${Date.now()}`, amount, reason, type, method,
    processedAt: new Date().toISOString(), processedBy: performer, approved: true,
  };
  const now = new Date().toISOString();
  const totalRefunded = [...order.refunds, refund].reduce((s, r) => s + r.amount, 0);
  const paymentStatus: PaymentStatus = totalRefunded >= order.totalAmount ? 'Fully Refunded' : 'Partially Refunded';

  const updated: OrderRecord = {
    ...order,
    refunds: [...order.refunds, refund],
    paymentStatus,
    status: type === 'Full' ? 'Refunded' : order.status,
    updatedAt: now,
    auditLog: [...order.auditLog, { id: `al-${Date.now()}`, action: 'Refund Processed', fromStatus: order.status, toStatus: type === 'Full' ? 'Refunded' : order.status, performer, details: `₹${amount} ${type} refund — ${reason}`, timestamp: now }],
  };

  orders[idx] = updated;
  saveOrders(orders);
  return updated;
}

export function getOrderMetrics() {
  const orders = loadOrders();
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const revenue = todayOrders.filter(o => o.status === 'Completed').reduce((s, o) => s + o.totalAmount, 0);

  return {
    total: orders.length,
    todayTotal: todayOrders.length,
    newOrders: orders.filter(o => o.status === 'New').length,
    accepted: orders.filter(o => o.status === 'Accepted').length,
    preparing: orders.filter(o => o.status === 'Preparing').length,
    ready: orders.filter(o => o.status === 'Ready').length,
    served: orders.filter(o => o.status === 'Served').length,
    dispatched: orders.filter(o => o.status === 'Dispatched').length,
    completed: orders.filter(o => o.status === 'Completed').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length,
    rejected: orders.filter(o => o.status === 'Rejected').length,
    refunded: orders.filter(o => o.status === 'Refunded').length,
    todayRevenue: revenue,
    avgOrderValue: todayOrders.length > 0 ? revenue / Math.max(1, todayOrders.filter(o => o.status === 'Completed').length) : 0,
    byType: {
      'Dine-in': orders.filter(o => o.orderType === 'Dine-in').length,
      'Takeaway': orders.filter(o => o.orderType === 'Takeaway').length,
      'Delivery': orders.filter(o => o.orderType === 'Delivery').length,
    }
  };
}

export function exportOrdersCSV(orders: OrderRecord[]): void {
  const rows = [
    ['Order #', 'Type', 'Status', 'Customer', 'Phone', 'Table', 'Items', 'Total', 'Payment', 'Date'],
    ...orders.map(o => [o.orderNumber, o.orderType, o.status, o.customerName, o.customerPhone, o.tableNumber || '—', o.items.map(i => `${i.quantity}x ${i.name}`).join('; '), o.totalAmount.toFixed(2), o.paymentMethod, new Date(o.createdAt).toLocaleDateString('en-IN')])
  ];
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}
