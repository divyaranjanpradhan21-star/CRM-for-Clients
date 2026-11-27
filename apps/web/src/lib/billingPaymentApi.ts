import { supabase } from './supabase';
import { OrderRecord, loadOrders, updateOrderStatus } from './orderManagementApi';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Partially Paid' | 'Cancelled' | 'Refunded';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Online Gateway' | 'Split' | 'Wallet';
export type TransactionStatus = 'Success' | 'Pending' | 'Failed' | 'Refunded';
export type ReconciliationStatus = 'Matched' | 'Discrepancy' | 'Pending Gateway';

export interface SplitPaymentEntry {
  id: string;
  method: 'Cash' | 'UPI' | 'Card' | 'Online Gateway' | 'Wallet';
  amount: number;
  reference?: string;
  timestamp: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?: string;
}

export interface InvoiceRefundRecord {
  id: string;
  amount: number;
  reason: string;
  approvedBy: string;
  method: PaymentMethod;
  processedAt: string;
  reference?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2024-001"
  orderId?: string;
  orderNumber?: string;
  orderType: 'Dine-in' | 'Takeaway' | 'Delivery';
  tableNumber?: string;

  // Restaurant details (branding & taxation)
  restaurantName: string;
  branchName: string;
  gstin: string;
  fssaiNumber: string;
  address: string;
  phone: string;

  // Customer details
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;

  // Items
  items: InvoiceItem[];

  // Calculation details (FR-PAY-003, FR-PAY-004, FR-PAY-006)
  subtotal: number;
  discountType?: 'Percentage' | 'Fixed';
  discountAmount: number;
  discountReason?: string;
  serviceChargeAmount: number; // e.g. optional 5%
  cgst: number; // 2.5%
  sgst: number; // 2.5%
  totalTax: number; // 5% total GST
  deliveryFee: number;
  roundOff: number;
  totalAmount: number;

  // Settlement & Balances (FR-PAY-009, FR-PAY-010, FR-PAY-011)
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  primaryPaymentMethod: PaymentMethod;
  payments: SplitPaymentEntry[];
  refunds: InvoiceRefundRecord[];

  // Reconciliation & Gateway
  reconciliationStatus: ReconciliationStatus;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;

  // Timestamps & Audit
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  issuedBy: string;
  notes?: string;
}

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  orderNumber?: string;
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  transactionRef: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  splitEntries?: SplitPaymentEntry[];
  failureReason?: string;
  timestamp: string;
  processedBy: string;
  reconciliationStatus: ReconciliationStatus;
}

export interface BillingMetrics {
  totalRevenue: number;
  todayCollections: number;
  totalInvoices: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  partiallyPaidCount: number;
  pendingAmount: number;
  failedTransactionsCount: number;
  totalRefundsAmount: number;
  totalRefundsCount: number;
  cashRevenue: number;
  upiRevenue: number;
  cardRevenue: number;
  onlineGatewayRevenue: number;
  cgstCollected: number;
  sgstCollected: number;
}

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────────

const STORAGE_INVOICES_KEY = 'crm_billing_invoices_v1';
const STORAGE_TRANSACTIONS_KEY = 'crm_billing_transactions_v1';
const STORAGE_INVOICE_COUNTER_KEY = 'crm_billing_invoice_counter_v1';

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-2024-001',
    orderId: 'om-004',
    orderNumber: 'ORD-5004',
    orderType: 'Dine-in',
    tableNumber: 'T-12',
    restaurantName: "Cafe's Corner & Dining Lounge",
    branchName: 'Rooftop Bistro',
    gstin: '29ABCDE1234F1Z5',
    fssaiNumber: '11223344556677',
    address: '88 MG Road, Central District, Bangalore 560001',
    phone: '+91 98200 88210',
    customerName: 'Anjali Singh',
    customerPhone: '9634567890',
    customerEmail: 'anjali@email.com',
    items: [
      { id: 'ii-1', name: 'Royal Heritage Veg Thali', quantity: 3, unitPrice: 220, totalPrice: 660 },
      { id: 'ii-2', name: 'Alphonso Mango Lassi', quantity: 3, unitPrice: 90, totalPrice: 270 }
    ],
    subtotal: 930,
    discountType: 'Percentage',
    discountAmount: 46.5,
    discountReason: 'Welcome Diner 5%',
    serviceChargeAmount: 0,
    cgst: 22.09,
    sgst: 22.09,
    totalTax: 44.18,
    deliveryFee: 0,
    roundOff: 0,
    totalAmount: 927.68,
    amountPaid: 927.68,
    balanceDue: 0,
    status: 'Paid',
    primaryPaymentMethod: 'UPI',
    payments: [
      { id: 'sp-1', method: 'UPI', amount: 927.68, reference: 'UPI/402819281920', timestamp: new Date(Date.now() - 30 * 60000).toISOString() }
    ],
    refunds: [],
    reconciliationStatus: 'Matched',
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    paidAt: new Date(Date.now() - 30 * 60000).toISOString(),
    issuedBy: 'Arun Nair (Staff)'
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-2024-002',
    orderId: 'om-003',
    orderNumber: 'ORD-5003',
    orderType: 'Takeaway',
    restaurantName: "Cafe's Corner & Dining Lounge",
    branchName: 'Main Branch',
    gstin: '29ABCDE1234F1Z5',
    fssaiNumber: '11223344556677',
    address: '88 MG Road, Central District, Bangalore 560001',
    phone: '+91 98200 88210',
    customerName: 'Rohit Kumar',
    customerPhone: '9712345678',
    items: [
      { id: 'ii-3', name: 'Awadhi Chicken Biryani', quantity: 2, unitPrice: 350, totalPrice: 700 },
      { id: 'ii-4', name: 'Gulab Jamun Flambé', quantity: 1, unitPrice: 120, totalPrice: 120 }
    ],
    subtotal: 820,
    discountAmount: 0,
    serviceChargeAmount: 0,
    cgst: 20.5,
    sgst: 20.5,
    totalTax: 41,
    deliveryFee: 0,
    roundOff: 0,
    totalAmount: 861,
    amountPaid: 861,
    balanceDue: 0,
    status: 'Paid',
    primaryPaymentMethod: 'Cash',
    payments: [
      { id: 'sp-2', method: 'Cash', amount: 861, reference: 'CASH-POS-102', timestamp: new Date(Date.now() - 15 * 60000).toISOString() }
    ],
    refunds: [],
    reconciliationStatus: 'Matched',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    paidAt: new Date(Date.now() - 15 * 60000).toISOString(),
    issuedBy: 'Deepa Suresh (Cashier)'
  },
  {
    id: 'inv-1003',
    invoiceNumber: 'INV-2024-003',
    orderId: 'om-001',
    orderNumber: 'ORD-5001',
    orderType: 'Dine-in',
    tableNumber: 'T-03',
    restaurantName: "Cafe's Corner & Dining Lounge",
    branchName: 'Main Branch',
    gstin: '29ABCDE1234F1Z5',
    fssaiNumber: '11223344556677',
    address: '88 MG Road, Central District, Bangalore 560001',
    phone: '+91 98200 88210',
    customerName: 'Alexander Wright',
    customerPhone: '+91 98200 88210',
    customerEmail: 'alex.wright@executive-advisors.com',
    items: [
      { id: 'ii-5', name: 'Kashmiri Mutton Rogan Josh', quantity: 2, unitPrice: 420, totalPrice: 840 },
      { id: 'ii-6', name: 'Garlic Butter Naan', quantity: 4, unitPrice: 60, totalPrice: 240 },
      { id: 'ii-7', name: 'Gulab Jamun Flambé', quantity: 2, unitPrice: 120, totalPrice: 240 }
    ],
    subtotal: 1320,
    discountType: 'Percentage',
    discountAmount: 132,
    discountReason: 'VIP Patron 10%',
    serviceChargeAmount: 0,
    cgst: 29.7,
    sgst: 29.7,
    totalTax: 59.4,
    deliveryFee: 0,
    roundOff: 0,
    totalAmount: 1247.4,
    amountPaid: 0,
    balanceDue: 1247.4,
    status: 'Unpaid',
    primaryPaymentMethod: 'Card',
    payments: [],
    refunds: [],
    reconciliationStatus: 'Pending Gateway',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    issuedBy: 'Arun Nair (Staff)'
  },
  {
    id: 'inv-1004',
    invoiceNumber: 'INV-2024-004',
    orderId: 'om-002',
    orderNumber: 'ORD-5002',
    orderType: 'Delivery',
    restaurantName: "Cafe's Corner & Dining Lounge",
    branchName: 'City Center',
    gstin: '29ABCDE1234F1Z5',
    fssaiNumber: '11223344556677',
    address: '88 MG Road, Central District, Bangalore 560001',
    phone: '+91 98200 88210',
    customerName: 'Priya Mehta',
    customerPhone: '9823456781',
    deliveryAddress: '12 MG Road, Bangalore 560001',
    items: [
      { id: 'ii-8', name: 'Tandoori Paneer Tikka', quantity: 1, unitPrice: 280, totalPrice: 280 },
      { id: 'ii-9', name: 'Dal Makhani Bukhara Style', quantity: 1, unitPrice: 240, totalPrice: 240 }
    ],
    subtotal: 520,
    discountAmount: 0,
    serviceChargeAmount: 0,
    cgst: 13,
    sgst: 13,
    totalTax: 26,
    deliveryFee: 40,
    roundOff: 0,
    totalAmount: 586,
    amountPaid: 300,
    balanceDue: 286,
    status: 'Partially Paid',
    primaryPaymentMethod: 'Split',
    payments: [
      { id: 'sp-3', method: 'Cash', amount: 300, reference: 'CASH-PARTIAL-101', timestamp: new Date(Date.now() - 20 * 60000).toISOString() }
    ],
    refunds: [],
    reconciliationStatus: 'Discrepancy',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    issuedBy: 'Deepa Suresh (Cashier)',
    notes: 'Partial payment received on delivery. Remaining ₹286 due via UPI.'
  }
];

const SEED_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: 'tx-101',
    invoiceId: 'inv-1001',
    invoiceNumber: 'INV-2024-001',
    orderNumber: 'ORD-5004',
    amount: 927.68,
    method: 'UPI',
    status: 'Success',
    transactionRef: 'UPI/402819281920',
    gatewayPaymentId: 'pay_NzY219827391',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    processedBy: 'Arun Nair',
    reconciliationStatus: 'Matched'
  },
  {
    id: 'tx-102',
    invoiceId: 'inv-1002',
    invoiceNumber: 'INV-2024-002',
    orderNumber: 'ORD-5003',
    amount: 861,
    method: 'Cash',
    status: 'Success',
    transactionRef: 'CASH-POS-102',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    processedBy: 'Deepa Suresh',
    reconciliationStatus: 'Matched'
  },
  {
    id: 'tx-103',
    invoiceId: 'inv-1004',
    invoiceNumber: 'INV-2024-004',
    orderNumber: 'ORD-5002',
    amount: 300,
    method: 'Cash',
    status: 'Success',
    transactionRef: 'CASH-PARTIAL-101',
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    processedBy: 'Deepa Suresh',
    reconciliationStatus: 'Matched'
  },
  {
    id: 'tx-104',
    invoiceId: 'inv-1003',
    invoiceNumber: 'INV-2024-003',
    orderNumber: 'ORD-5001',
    amount: 1247.4,
    method: 'Card',
    status: 'Failed',
    transactionRef: 'TXN-FAIL-991',
    failureReason: 'Card Declined: Insufficient balance / Pin timeout',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    processedBy: 'Arun Nair',
    reconciliationStatus: 'Discrepancy'
  }
];

// ─── STORAGE OPERATIONS ───────────────────────────────────────────────────────

export function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_INVOICES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(SEED_INVOICES));
  return SEED_INVOICES;
}

export function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(invoices));
  // Non-blocking sync with Supabase table
  supabase.from('invoices').upsert(
    invoices.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoiceNumber,
      order_id: inv.orderId,
      amount: inv.totalAmount,
      status: inv.status,
      payment_method: inv.primaryPaymentMethod,
      updated_at: inv.updatedAt
    }))
  ).then(() => {});
}

export function loadPaymentTransactions(): PaymentTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_TRANSACTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(SEED_TRANSACTIONS));
  return SEED_TRANSACTIONS;
}

export function savePaymentTransactions(txns: PaymentTransaction[]): void {
  localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(txns));
}

export function generateNextInvoiceNumber(): string {
  const currentCount = parseInt(localStorage.getItem(STORAGE_INVOICE_COUNTER_KEY) || '5', 10);
  const nextCount = currentCount + 1;
  localStorage.setItem(STORAGE_INVOICE_COUNTER_KEY, nextCount.toString());
  return `INV-${new Date().getFullYear()}-${nextCount.toString().padStart(3, '0')}`;
}

// ─── INVOICE GENERATION (FR-PAY-001, FR-PAY-002, FR-PAY-003) ──────────────────

export function generateInvoiceForOrder(
  order: OrderRecord,
  performer = 'Staff / POS'
): Invoice {
  const existingInvoices = loadInvoices();
  // Check if invoice already exists for this order to prevent duplicate bills
  const existing = existingInvoices.find(inv => inv.orderId === order.id && inv.status !== 'Cancelled');
  if (existing) return existing;

  const invoiceNumber = generateNextInvoiceNumber();
  const subtotal = order.subtotal;
  const discountAmount = order.discountAmount || 0;
  const taxable = Math.max(0, subtotal - discountAmount);
  const cgst = parseFloat(((taxable * 2.5) / 100).toFixed(2));
  const sgst = parseFloat(((taxable * 2.5) / 100).toFixed(2));
  const totalTax = cgst + sgst;
  const totalAmount = parseFloat((taxable + totalTax + (order.deliveryFee || 0)).toFixed(2));

  const newInvoice: Invoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    restaurantName: "Cafe's Corner & Dining Lounge",
    branchName: order.branchName || 'Main Branch',
    gstin: '29ABCDE1234F1Z5',
    fssaiNumber: '11223344556677',
    address: '88 MG Road, Central District, Bangalore 560001',
    phone: '+91 98200 88210',
    customerId: order.customerId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    deliveryAddress: order.deliveryAddress,
    items: order.items.map(i => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.basePrice,
      totalPrice: i.totalPrice,
      customizations: i.customizations?.map(c => `${c.name}: ${c.value}`).join(', ')
    })),
    subtotal,
    discountType: order.discountType,
    discountAmount,
    discountReason: order.couponCode ? `Coupon: ${order.couponCode}` : undefined,
    serviceChargeAmount: 0,
    cgst,
    sgst,
    totalTax,
    deliveryFee: order.deliveryFee || 0,
    roundOff: 0,
    totalAmount,
    amountPaid: order.paymentStatus === 'Paid' ? totalAmount : 0,
    balanceDue: order.paymentStatus === 'Paid' ? 0 : totalAmount,
    status: order.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid',
    primaryPaymentMethod: (order.paymentMethod === 'Online' ? 'Online Gateway' : (order.paymentMethod !== 'Pending' ? order.paymentMethod : 'Cash')) as PaymentMethod,
    payments: order.paymentStatus === 'Paid' ? [
      { 
        id: `sp-${Date.now()}`, 
        method: (order.paymentMethod === 'Online' ? 'Online Gateway' : (order.paymentMethod !== 'Pending' ? order.paymentMethod : 'Cash')) as 'Cash' | 'UPI' | 'Card' | 'Online Gateway' | 'Wallet', 
        amount: totalAmount, 
        timestamp: new Date().toISOString() 
      }
    ] : [],
    refunds: [],
    reconciliationStatus: order.paymentStatus === 'Paid' ? 'Matched' : 'Pending Gateway',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paidAt: order.paymentStatus === 'Paid' ? new Date().toISOString() : undefined,
    issuedBy: performer
  };

  existingInvoices.unshift(newInvoice);
  saveInvoices(existingInvoices);

  // If already paid, record transaction
  if (order.paymentStatus === 'Paid') {
    const txns = loadPaymentTransactions();
    txns.unshift({
      id: `tx-${Date.now()}`,
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      orderNumber: newInvoice.orderNumber,
      amount: totalAmount,
      method: newInvoice.primaryPaymentMethod,
      status: 'Success',
      transactionRef: `REF-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      processedBy: performer,
      reconciliationStatus: 'Matched'
    });
    savePaymentTransactions(txns);
  }

  return newInvoice;
}

// ─── PAYMENT SETTLEMENT & SPLIT (FR-PAY-005 to FR-PAY-010) ────────────────────

export function recordPayment(
  invoiceId: string,
  paymentData: {
    method: PaymentMethod;
    amount: number;
    reference?: string;
    splitEntries?: SplitPaymentEntry[];
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
  },
  performer = 'Cashier'
): Invoice {
  const invoices = loadInvoices();
  const idx = invoices.findIndex(i => i.id === invoiceId);
  if (idx === -1) throw new Error('Invoice not found');

  const inv = invoices[idx];
  if (inv.status === 'Paid') throw new Error('Invoice is already fully settled');

  const payAmount = paymentData.amount;
  if (payAmount <= 0) throw new Error('Payment amount must be greater than zero');
  if (payAmount > inv.balanceDue) throw new Error(`Payment cannot exceed outstanding balance of ₹${inv.balanceDue.toFixed(2)}`);

  const now = new Date().toISOString();
  const newAmountPaid = parseFloat((inv.amountPaid + payAmount).toFixed(2));
  const newBalanceDue = parseFloat((inv.totalAmount - newAmountPaid).toFixed(2));
  const isFullySettled = newBalanceDue <= 0.01;

  // New payment entry
  const newEntries: SplitPaymentEntry[] = paymentData.splitEntries && paymentData.splitEntries.length > 0
    ? paymentData.splitEntries
    : [{
        id: `sp-${Date.now()}`,
        method: paymentData.method === 'Split' ? 'Cash' : paymentData.method,
        amount: payAmount,
        reference: paymentData.reference || `REF-${Date.now().toString().slice(-6)}`,
        timestamp: now
      }];

  const updated: Invoice = {
    ...inv,
    amountPaid: newAmountPaid,
    balanceDue: Math.max(0, newBalanceDue),
    status: isFullySettled ? 'Paid' : 'Partially Paid',
    primaryPaymentMethod: paymentData.method,
    payments: [...inv.payments, ...newEntries],
    reconciliationStatus: 'Matched',
    gatewayOrderId: paymentData.gatewayOrderId || inv.gatewayOrderId,
    gatewayPaymentId: paymentData.gatewayPaymentId || inv.gatewayPaymentId,
    paidAt: isFullySettled ? now : inv.paidAt,
    updatedAt: now
  };

  invoices[idx] = updated;
  saveInvoices(invoices);

  // Record successful transaction log (FR-PAY-015)
  const txns = loadPaymentTransactions();
  txns.unshift({
    id: `tx-${Date.now()}`,
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    orderNumber: inv.orderNumber,
    amount: payAmount,
    method: paymentData.method,
    status: 'Success',
    transactionRef: paymentData.reference || `TXN-${Date.now().toString().slice(-6)}`,
    gatewayOrderId: paymentData.gatewayOrderId,
    gatewayPaymentId: paymentData.gatewayPaymentId,
    splitEntries: paymentData.splitEntries,
    timestamp: now,
    processedBy: performer,
    reconciliationStatus: 'Matched'
  });
  savePaymentTransactions(txns);

  // Sync back to order status if completed
  if (isFullySettled && inv.orderId) {
    try {
      updateOrderStatus(inv.orderId, 'Completed', performer, 'Payment settled in full');
    } catch {}
  }

  return updated;
}

// ─── RECORD FAILED TRANSACTION (FR-PAY-016) ──────────────────────────────────

export function recordFailedTransaction(
  invoiceId: string,
  amount: number,
  method: PaymentMethod,
  failureReason: string,
  performer = 'POS Terminal'
): void {
  const invoices = loadInvoices();
  const inv = invoices.find(i => i.id === invoiceId);
  const txns = loadPaymentTransactions();

  txns.unshift({
    id: `tx-fail-${Date.now()}`,
    invoiceId,
    invoiceNumber: inv?.invoiceNumber || 'INV-NA',
    orderNumber: inv?.orderNumber,
    amount,
    method,
    status: 'Failed',
    transactionRef: `FAIL-${Date.now().toString().slice(-6)}`,
    failureReason,
    timestamp: new Date().toISOString(),
    processedBy: performer,
    reconciliationStatus: 'Discrepancy'
  });

  savePaymentTransactions(txns);
}

// ─── REFUNDS (FR-PAY-014) ─────────────────────────────────────────────────────

export function processInvoiceRefund(
  invoiceId: string,
  refundData: {
    amount: number;
    reason: string;
    approvedBy: string;
    method: PaymentMethod;
  }
): Invoice {
  const invoices = loadInvoices();
  const idx = invoices.findIndex(i => i.id === invoiceId);
  if (idx === -1) throw new Error('Invoice not found');

  const inv = invoices[idx];
  if (inv.amountPaid <= 0) throw new Error('Cannot refund an unpaid invoice');
  if (refundData.amount > inv.amountPaid) throw new Error(`Refund cannot exceed collected amount of ₹${inv.amountPaid}`);

  const refundEntry: InvoiceRefundRecord = {
    id: `ref-${Date.now()}`,
    amount: refundData.amount,
    reason: refundData.reason,
    approvedBy: refundData.approvedBy,
    method: refundData.method,
    processedAt: new Date().toISOString(),
    reference: `REFUND-${Date.now().toString().slice(-6)}`
  };

  const now = new Date().toISOString();
  const totalRefunded = [...inv.refunds, refundEntry].reduce((s, r) => s + r.amount, 0);
  const isFullyRefunded = totalRefunded >= inv.totalAmount;

  const updated: Invoice = {
    ...inv,
    refunds: [...inv.refunds, refundEntry],
    status: isFullyRefunded ? 'Refunded' : inv.status,
    updatedAt: now
  };

  invoices[idx] = updated;
  saveInvoices(invoices);

  // Record transaction log
  const txns = loadPaymentTransactions();
  txns.unshift({
    id: `tx-ref-${Date.now()}`,
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    orderNumber: inv.orderNumber,
    amount: refundData.amount,
    method: refundData.method,
    status: 'Refunded',
    transactionRef: refundEntry.reference || `REF-${Date.now().toString().slice(-6)}`,
    timestamp: now,
    processedBy: refundData.approvedBy,
    reconciliationStatus: 'Matched'
  });
  savePaymentTransactions(txns);

  return updated;
}

// ─── RECONCILIATION (FR-PAY-017) ──────────────────────────────────────────────

export function reconcileTransaction(
  transactionId: string,
  reconciliationStatus: ReconciliationStatus
): void {
  const txns = loadPaymentTransactions();
  const tx = txns.find(t => t.id === transactionId);
  if (!tx) return;

  tx.reconciliationStatus = reconciliationStatus;
  savePaymentTransactions(txns);

  // Update parent invoice if matched
  if (reconciliationStatus === 'Matched') {
    const invoices = loadInvoices();
    const inv = invoices.find(i => i.id === tx.invoiceId);
    if (inv) {
      inv.reconciliationStatus = 'Matched';
      inv.updatedAt = new Date().toISOString();
      saveInvoices(invoices);
    }
  }
}

// ─── METRICS & REPORTS (FR-PAY-018) ───────────────────────────────────────────

export function getBillingMetrics(): BillingMetrics {
  const invoices = loadInvoices();
  const txns = loadPaymentTransactions();
  const today = new Date().toDateString();

  const totalRevenue = invoices
    .filter(i => i.status === 'Paid' || i.status === 'Partially Paid')
    .reduce((s, i) => s + i.amountPaid, 0);

  const todayCollections = txns
    .filter(t => t.status === 'Success' && new Date(t.timestamp).toDateString() === today)
    .reduce((s, t) => s + t.amount, 0);

  const paidInvoicesCount = invoices.filter(i => i.status === 'Paid').length;
  const unpaidInvoicesCount = invoices.filter(i => i.status === 'Unpaid').length;
  const partiallyPaidCount = invoices.filter(i => i.status === 'Partially Paid').length;
  const pendingAmount = invoices.reduce((s, i) => s + i.balanceDue, 0);

  const failedTransactionsCount = txns.filter(t => t.status === 'Failed').length;
  const allRefunds = invoices.flatMap(i => i.refunds);
  const totalRefundsAmount = allRefunds.reduce((s, r) => s + r.amount, 0);

  // Revenue breakdown by payment method
  const cashRevenue = txns.filter(t => t.status === 'Success' && t.method === 'Cash').reduce((s, t) => s + t.amount, 0);
  const upiRevenue = txns.filter(t => t.status === 'Success' && t.method === 'UPI').reduce((s, t) => s + t.amount, 0);
  const cardRevenue = txns.filter(t => t.status === 'Success' && t.method === 'Card').reduce((s, t) => s + t.amount, 0);
  const onlineGatewayRevenue = txns.filter(t => t.status === 'Success' && t.method === 'Online Gateway').reduce((s, t) => s + t.amount, 0);

  // Taxes
  const cgstCollected = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.cgst, 0);
  const sgstCollected = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.sgst, 0);

  return {
    totalRevenue,
    todayCollections,
    totalInvoices: invoices.length,
    paidInvoicesCount,
    unpaidInvoicesCount,
    partiallyPaidCount,
    pendingAmount,
    failedTransactionsCount,
    totalRefundsAmount,
    totalRefundsCount: allRefunds.length,
    cashRevenue,
    upiRevenue,
    cardRevenue,
    onlineGatewayRevenue,
    cgstCollected,
    sgstCollected
  };
}

// ─── DIGITAL RECEIPT TEXT (FR-PAY-012) ────────────────────────────────────────

export function generateDigitalReceiptText(invoice: Invoice): string {
  const lineItems = invoice.items.map(i => `• ${i.quantity}x ${i.name} - ₹${i.totalPrice.toFixed(2)}`).join('\n');
  return `🧾 *RECEIPT: ${invoice.restaurantName}*
--------------------------------
Invoice: *${invoice.invoiceNumber}*
Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
Branch: ${invoice.branchName}
Customer: ${invoice.customerName}
${invoice.tableNumber ? `Table: ${invoice.tableNumber}\n` : ''}--------------------------------
ITEMS:
${lineItems}
--------------------------------
Subtotal: ₹${invoice.subtotal.toFixed(2)}
${invoice.discountAmount > 0 ? `Discount: -₹${invoice.discountAmount.toFixed(2)}\n` : ''}GST (5%): ₹${invoice.totalTax.toFixed(2)}
*TOTAL PAID: ₹${invoice.amountPaid.toFixed(2)}*
Payment Method: ${invoice.primaryPaymentMethod}
Status: *PAID (Confirmed)*
GSTIN: ${invoice.gstin}
--------------------------------
Thank you for dining with us! 🙏`;
}

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────

export function exportInvoicesCSV(invoices: Invoice[]): void {
  const headers = [
    'Invoice Number',
    'Order Number',
    'Date',
    'Customer Name',
    'Phone',
    'Branch',
    'Subtotal',
    'Discount',
    'CGST (2.5%)',
    'SGST (2.5%)',
    'Total Amount',
    'Amount Paid',
    'Balance Due',
    'Status',
    'Payment Method'
  ];

  const rows = invoices.map(i => [
    i.invoiceNumber,
    i.orderNumber || '—',
    new Date(i.createdAt).toLocaleDateString('en-IN'),
    `"${i.customerName}"`,
    i.customerPhone,
    `"${i.branchName}"`,
    i.subtotal.toFixed(2),
    i.discountAmount.toFixed(2),
    i.cgst.toFixed(2),
    i.sgst.toFixed(2),
    i.totalAmount.toFixed(2),
    i.amountPaid.toFixed(2),
    i.balanceDue.toFixed(2),
    i.status,
    i.primaryPaymentMethod
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}
