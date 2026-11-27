import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Search, Filter, RefreshCw, TrendingUp, Clock, CheckCircle2,
  AlertCircle, XCircle, ShoppingCart, ChefHat, Truck, Users, DollarSign,
  ArrowUpRight, ChevronDown, Eye, Printer, RotateCcw, Download,
  Flame, Package
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type OrderStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
type OrderType = 'Dine-In' | 'Takeaway' | 'Delivery' | 'QR Order';
type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Wallet' | 'Online';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface POSOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  branch: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  itemsSummary: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  tableNumber?: string;
  createdAt: string;
  updatedAt: string;
  prepTime?: number; // minutes
  notes?: string;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────
const SEED_ORDERS: POSOrder[] = [
  {
    id: 'ord-001', orderNumber: 'ORD-2024-001', customerName: 'Arjun Sharma', customerPhone: '9876543210',
    branch: 'Main Branch', orderType: 'Dine-In', status: 'RECEIVED',
    items: [{ name: 'Butter Chicken', qty: 2, price: 320 }, { name: 'Garlic Naan', qty: 4, price: 60 }],
    itemsSummary: '2× Butter Chicken, 4× Garlic Naan',
    totalAmount: 880, paymentMethod: 'Card', tableNumber: 'T-05',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(), updatedAt: new Date().toISOString(), prepTime: 20
  },
  {
    id: 'ord-002', orderNumber: 'ORD-2024-002', customerName: 'Priya Mehta', customerPhone: '9823456781',
    branch: 'City Center', orderType: 'Delivery', status: 'PREPARING',
    items: [{ name: 'Paneer Tikka', qty: 1, price: 280 }, { name: 'Dal Makhani', qty: 1, price: 240 }, { name: 'Roti', qty: 3, price: 30 }],
    itemsSummary: '1× Paneer Tikka, 1× Dal Makhani, 3× Roti',
    totalAmount: 610, paymentMethod: 'UPI',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(), updatedAt: new Date(Date.now() - 5 * 60000).toISOString(), prepTime: 25
  },
  {
    id: 'ord-003', orderNumber: 'ORD-2024-003', customerName: 'Rohit Kumar', customerPhone: '9712345678',
    branch: 'Main Branch', orderType: 'Takeaway', status: 'READY',
    items: [{ name: 'Chicken Biryani', qty: 2, price: 350 }, { name: 'Raita', qty: 2, price: 60 }],
    itemsSummary: '2× Chicken Biryani, 2× Raita',
    totalAmount: 820, paymentMethod: 'Cash',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(), updatedAt: new Date(Date.now() - 2 * 60000).toISOString(), prepTime: 18
  },
  {
    id: 'ord-004', orderNumber: 'ORD-2024-004', customerName: 'Anjali Singh', customerPhone: '9634567890',
    branch: 'Airport Road', orderType: 'QR Order', status: 'COMPLETED',
    items: [{ name: 'Veg Thali', qty: 3, price: 220 }, { name: 'Lassi', qty: 3, price: 80 }],
    itemsSummary: '3× Veg Thali, 3× Lassi',
    totalAmount: 900, paymentMethod: 'Online', tableNumber: 'T-12',
    createdAt: new Date(Date.now() - 65 * 60000).toISOString(), updatedAt: new Date(Date.now() - 30 * 60000).toISOString()
  },
  {
    id: 'ord-005', orderNumber: 'ORD-2024-005', customerName: 'Vikram Nair', customerPhone: '9545678901',
    branch: 'City Center', orderType: 'Dine-In', status: 'PREPARING',
    items: [{ name: 'Fish Curry', qty: 2, price: 380 }, { name: 'Steamed Rice', qty: 2, price: 100 }, { name: 'Papad', qty: 2, price: 40 }],
    itemsSummary: '2× Fish Curry, 2× Steamed Rice',
    totalAmount: 1000, paymentMethod: 'Card', tableNumber: 'T-03',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(), updatedAt: new Date(Date.now() - 3 * 60000).toISOString(), prepTime: 22
  },
  {
    id: 'ord-006', orderNumber: 'ORD-2024-006', customerName: 'Deepika Rao', customerPhone: '9456789012',
    branch: 'Main Branch', orderType: 'Delivery', status: 'COMPLETED',
    items: [{ name: 'Prawn Masala', qty: 1, price: 450 }, { name: 'Appam', qty: 4, price: 50 }],
    itemsSummary: '1× Prawn Masala, 4× Appam',
    totalAmount: 650, paymentMethod: 'Wallet',
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(), updatedAt: new Date(Date.now() - 45 * 60000).toISOString()
  },
  {
    id: 'ord-007', orderNumber: 'ORD-2024-007', customerName: 'Suresh Pillai', customerPhone: '9367890123',
    branch: 'Highway Hub', orderType: 'Dine-In', status: 'CANCELLED',
    items: [{ name: 'Mutton Rogan Josh', qty: 2, price: 420 }],
    itemsSummary: '2× Mutton Rogan Josh',
    totalAmount: 840, paymentMethod: 'Card', tableNumber: 'T-08',
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(), updatedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    notes: 'Customer cancelled — unavailable item'
  },
  {
    id: 'ord-008', orderNumber: 'ORD-2024-008', customerName: 'Meera Joshi', customerPhone: '9278901234',
    branch: 'Main Branch', orderType: 'QR Order', status: 'RECEIVED',
    items: [{ name: 'Idli Vada', qty: 4, price: 80 }, { name: 'Filter Coffee', qty: 4, price: 60 }, { name: 'Sambar', qty: 1, price: 40 }],
    itemsSummary: '4× Idli Vada, 4× Filter Coffee',
    totalAmount: 580, paymentMethod: 'UPI', tableNumber: 'T-02',
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(), updatedAt: new Date().toISOString(), prepTime: 10
  },
  {
    id: 'ord-009', orderNumber: 'ORD-2024-009', customerName: 'Kabir Verma', customerPhone: '9189012345',
    branch: 'City Center', orderType: 'Takeaway', status: 'READY',
    items: [{ name: 'Chole Bhature', qty: 3, price: 160 }, { name: 'Mango Lassi', qty: 3, price: 90 }],
    itemsSummary: '3× Chole Bhature, 3× Mango Lassi',
    totalAmount: 750, paymentMethod: 'Cash',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(), updatedAt: new Date(Date.now() - 5 * 60000).toISOString(), prepTime: 15
  },
  {
    id: 'ord-010', orderNumber: 'ORD-2024-010', customerName: 'Lavanya Das', customerPhone: '9090123456',
    branch: 'Airport Road', orderType: 'Delivery', status: 'PREPARING',
    items: [{ name: 'Mixed Veg Curry', qty: 1, price: 200 }, { name: 'Jeera Rice', qty: 2, price: 150 }, { name: 'Naan', qty: 2, price: 60 }],
    itemsSummary: '1× Mixed Veg Curry, 2× Jeera Rice, 2× Naan',
    totalAmount: 620, paymentMethod: 'Online',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(), updatedAt: new Date(Date.now() - 8 * 60000).toISOString(), prepTime: 20
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'crm_pos_orders_v1';

function loadOrders(): POSOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ORDERS));
  return SEED_ORDERS;
}

function saveOrders(orders: POSOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  RECEIVED:  { label: 'Received',  color: 'text-blue-800',   bg: 'bg-blue-100',   icon: ShoppingCart },
  PREPARING: { label: 'Preparing', color: 'text-amber-800',  bg: 'bg-amber-100',  icon: ChefHat },
  READY:     { label: 'Ready',     color: 'text-emerald-800',bg: 'bg-emerald-100',icon: CheckCircle2 },
  COMPLETED: { label: 'Completed', color: 'text-gray-600',   bg: 'bg-gray-100',   icon: Package },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-800',   bg: 'bg-rose-100',   icon: XCircle },
};

const ORDER_TYPE_COLORS: Record<OrderType, string> = {
  'Dine-In':  'bg-[#79415A]/10 text-[#79415A]',
  'Takeaway': 'bg-[#82401D]/10 text-[#82401D]',
  'Delivery': 'bg-indigo-100 text-indigo-800',
  'QR Order': 'bg-teal-100 text-teal-800',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function minutesAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface OrdersLivePOSViewProps { orgId?: string; }

export const OrdersLivePOSView: React.FC<OrdersLivePOSViewProps> = () => {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<OrderType | 'ALL'>('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<POSOrder | null>(null);
  const [view, setView] = useState<'live' | 'all' | 'analytics'>('live');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { setOrders(loadOrders()); }, []);

  const refresh = useCallback(() => {
    setOrders(loadOrders());
    setLastRefresh(new Date());
  }, []);

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o);
      saveOrders(updated);
      return updated;
    });
    if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, status } : null);
  };

  const branches = ['ALL', ...Array.from(new Set(orders.map(o => o.branch)))];

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.branch.toLowerCase().includes(q) || o.itemsSummary.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchType = typeFilter === 'ALL' || o.orderType === typeFilter;
    const matchBranch = branchFilter === 'ALL' || o.branch === branchFilter;
    return matchSearch && matchStatus && matchType && matchBranch;
  });

  // Live orders = active (not completed/cancelled)
  const liveOrders = filtered.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const displayOrders = view === 'live' ? liveOrders : filtered;

  // KPIs
  const totalToday = orders.length;
  const liveCount = orders.filter(o => o.status === 'RECEIVED' || o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY').length;
  const completedToday = orders.filter(o => o.status === 'COMPLETED').length;
  const revenue = orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + o.totalAmount, 0);
  const avgOrder = completedToday > 0 ? revenue / completedToday : 0;

  const kpis = [
    { label: 'Total Orders Today', value: totalToday.toString(), icon: Receipt, color: 'text-[#1F313D]', bg: 'bg-[#1F313D]' },
    { label: 'Live Active', value: liveCount.toString(), icon: Flame, color: 'text-amber-700', bg: 'bg-amber-100' },
    { label: 'Ready to Serve', value: readyCount.toString(), icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { label: 'Revenue Today', value: `₹${revenue.toLocaleString()}`, icon: DollarSign, color: 'text-[#79415A]', bg: 'bg-[#79415A]/10' },
    { label: 'Avg Order Value', value: `₹${Math.round(avgOrder)}`, icon: TrendingUp, color: 'text-indigo-700', bg: 'bg-indigo-100' },
    { label: 'Completed', value: completedToday.toString(), icon: Package, color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    RECEIVED: 'PREPARING', PREPARING: 'READY', READY: 'COMPLETED'
  };

  const exportCSV = () => {
    const rows = [
      ['Order #', 'Customer', 'Branch', 'Type', 'Status', 'Items', 'Amount', 'Payment', 'Time'],
      ...filtered.map(o => [o.orderNumber, o.customerName, o.branch, o.orderType, o.status, o.itemsSummary, o.totalAmount, o.paymentMethod, formatTime(o.createdAt)])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Analytics data
  const statusBreakdown = (['RECEIVED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).map(s => ({
    status: s, count: orders.filter(o => o.status === s).length
  }));
  const typeBreakdown = (['Dine-In', 'Takeaway', 'Delivery', 'QR Order'] as OrderType[]).map(t => ({
    type: t, count: orders.filter(o => o.orderType === t).length,
    revenue: orders.filter(o => o.orderType === t && o.status === 'COMPLETED').reduce((s, o) => s + o.totalAmount, 0)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1F313D]">Orders & Live POS</h1>
          <p className="text-sm text-[#7A7268] mt-0.5">Real-time order management across all branches</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7A7268]">Last updated: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={refresh} className="p-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-[#79415A] transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E5DDD2] shadow-xs">
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className="text-lg font-black text-[#1F313D]">{k.value}</div>
              <div className="text-[11px] text-[#7A7268] font-medium">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        {(['live', 'all', 'analytics'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${view === v ? 'bg-[#79415A] text-white' : 'bg-[#EFE9DF] text-[#5C5549] hover:bg-[#E5DDD2]'}`}>
            {v === 'live' ? '🔴 Live Queue' : v === 'all' ? 'All Orders' : '📊 Analytics'}
          </button>
        ))}
        {view !== 'analytics' && (
          <span className="ml-2 text-xs text-[#7A7268]">{displayOrders.length} orders shown</span>
        )}
      </div>

      {view === 'analytics' ? (
        /* ── Analytics Tab ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="bg-[#FAF7F2] rounded-[24px] p-6 border border-[#E5DDD2]">
            <h3 className="font-serif font-bold text-base text-[#1F313D] mb-4">Order Status Breakdown</h3>
            <div className="space-y-3">
              {statusBreakdown.map(s => {
                const cfg = STATUS_CONFIG[s.status];
                const pct = totalToday > 0 ? Math.round((s.count / totalToday) * 100) : 0;
                return (
                  <div key={s.status}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#1F313D]">{cfg.label}</span>
                      <span className="text-[#7A7268]">{s.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EAE4D9] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.bg.replace('bg-', 'bg-')} opacity-80`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Type Breakdown */}
          <div className="bg-[#FAF7F2] rounded-[24px] p-6 border border-[#E5DDD2]">
            <h3 className="font-serif font-bold text-base text-[#1F313D] mb-4">Order Type Performance</h3>
            <div className="space-y-3">
              {typeBreakdown.map(t => {
                const pct = totalToday > 0 ? Math.round((t.count / totalToday) * 100) : 0;
                return (
                  <div key={t.type} className="p-3 bg-[#EFE9DF] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ORDER_TYPE_COLORS[t.type as OrderType]}`}>{t.type}</span>
                      <span className="text-xs text-[#1F313D] font-semibold">{t.count} orders</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-[#1F313D]">₹{t.revenue.toLocaleString()}</div>
                      <div className="text-[10px] text-[#7A7268]">{pct}% share</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue by Branch */}
          <div className="bg-[#FAF7F2] rounded-[24px] p-6 border border-[#E5DDD2] lg:col-span-2">
            <h3 className="font-serif font-bold text-base text-[#1F313D] mb-4">Revenue by Branch</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from(new Set(orders.map(o => o.branch))).map(b => {
                const branchOrders = orders.filter(o => o.branch === b && o.status === 'COMPLETED');
                const branchRev = branchOrders.reduce((s, o) => s + o.totalAmount, 0);
                return (
                  <div key={b} className="p-4 bg-[#EFE9DF] rounded-2xl">
                    <div className="text-xs font-bold text-[#1F313D] mb-1">{b}</div>
                    <div className="text-lg font-black text-[#79415A]">₹{branchRev.toLocaleString()}</div>
                    <div className="text-[11px] text-[#7A7268]">{branchOrders.length} completed orders</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ── Orders List ── */
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Filters + Table */}
          <div className="flex-1 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7268]" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search order, customer, item…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#79415A]/30" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                <option value="ALL">All Statuses</option>
                {(['RECEIVED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                <option value="ALL">All Types</option>
                {(['Dine-In', 'Takeaway', 'Delivery', 'QR Order'] as OrderType[]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                {branches.map(b => <option key={b} value={b}>{b === 'ALL' ? 'All Branches' : b}</option>)}
              </select>
            </div>

            {/* Orders */}
            <div className="space-y-3">
              {displayOrders.length === 0 ? (
                <div className="text-center py-16 bg-[#FAF7F2] rounded-2xl border border-[#E5DDD2]">
                  <Receipt className="w-10 h-10 text-[#DDD5C7] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#5C5549]">No orders found</p>
                  <p className="text-xs text-[#7A7268] mt-1">Adjust filters or switch to All Orders view</p>
                </div>
              ) : displayOrders.map(order => {
                const sc = STATUS_CONFIG[order.status];
                const StatusIcon = sc.icon;
                const isSelected = selectedOrder?.id === order.id;
                const elapsed = minutesAgo(order.createdAt);
                const isUrgent = order.status === 'RECEIVED' && (Date.now() - new Date(order.createdAt).getTime()) > 10 * 60000;

                return (
                  <div key={order.id}
                    onClick={() => setSelectedOrder(isSelected ? null : order)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'border-[#79415A] bg-white shadow-md' : isUrgent ? 'border-rose-200 bg-rose-50 hover:bg-white' : 'border-[#DDD5C7] bg-[#FAF7F2] hover:bg-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-[#1F313D]">{order.orderNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${sc.bg} ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" /> {sc.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ORDER_TYPE_COLORS[order.orderType]}`}>
                            {order.orderType}
                          </span>
                          {order.tableNumber && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1F313D]/10 text-[#1F313D]">
                              Table {order.tableNumber}
                            </span>
                          )}
                          {isUrgent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 animate-pulse">⚠ Waiting</span>}
                        </div>
                        <h4 className="text-xs font-bold text-[#1F313D]">{order.customerName} · {order.branch}</h4>
                        <p className="text-[11px] text-[#5C5549] mt-0.5 truncate">{order.itemsSummary}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-[#7A7268]">
                          <span><Clock className="w-3 h-3 inline mr-0.5" />{elapsed}</span>
                          <span>{order.paymentMethod}</span>
                          {order.prepTime && <span>Est. {order.prepTime}m prep</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-[#1F313D]">₹{order.totalAmount.toLocaleString()}</div>
                        {nextStatus[order.status] && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(order.id, nextStatus[order.status]!); }}
                            className="mt-1.5 px-2.5 py-1 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-[10px] font-bold transition">
                            → {STATUS_CONFIG[nextStatus[order.status]!].label}
                          </button>
                        )}
                        {order.status === 'RECEIVED' && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(order.id, 'CANCELLED'); }}
                            className="mt-1 ml-1 px-2.5 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold transition">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Detail Panel */}
          {selectedOrder && (
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-sm text-[#1F313D]">Order Detail</h3>
                  <button onClick={() => setSelectedOrder(null)} className="text-[#7A7268] hover:text-[#1F313D] text-xs">✕</button>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-[#EFE9DF] rounded-xl">
                    <div className="text-[11px] text-[#7A7268] font-medium">Order Number</div>
                    <div className="font-mono text-xs font-bold text-[#1F313D]">{selectedOrder.orderNumber}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-[#EFE9DF] rounded-xl">
                      <div className="text-[11px] text-[#7A7268]">Customer</div>
                      <div className="text-xs font-bold text-[#1F313D]">{selectedOrder.customerName}</div>
                    </div>
                    <div className="p-3 bg-[#EFE9DF] rounded-xl">
                      <div className="text-[11px] text-[#7A7268]">Branch</div>
                      <div className="text-xs font-bold text-[#1F313D]">{selectedOrder.branch}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#EFE9DF] rounded-xl">
                    <div className="text-[11px] text-[#7A7268] font-medium mb-2">Items Ordered</div>
                    <div className="space-y-1.5">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-[#1F313D]">{item.qty}× {item.name}</span>
                          <span className="font-bold text-[#1F313D]">₹{(item.qty * item.price).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="pt-1.5 border-t border-[#DDD5C7] flex justify-between font-black text-xs text-[#1F313D]">
                        <span>Total</span>
                        <span>₹{selectedOrder.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-[#EFE9DF] rounded-xl">
                      <div className="text-[11px] text-[#7A7268]">Payment</div>
                      <div className="font-bold text-[#1F313D]">{selectedOrder.paymentMethod}</div>
                    </div>
                    <div className="p-2.5 bg-[#EFE9DF] rounded-xl">
                      <div className="text-[11px] text-[#7A7268]">Time</div>
                      <div className="font-bold text-[#1F313D]">{formatTime(selectedOrder.createdAt)}</div>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <strong>Note:</strong> {selectedOrder.notes}
                    </div>
                  )}

                  {/* Status Stepper */}
                  <div className="p-3 bg-[#EFE9DF] rounded-xl">
                    <div className="text-[11px] text-[#7A7268] font-medium mb-2">Status Timeline</div>
                    <div className="flex items-center gap-1 justify-between">
                      {(['RECEIVED', 'PREPARING', 'READY', 'COMPLETED'] as OrderStatus[]).map((s, i) => {
                        const statuses = ['RECEIVED', 'PREPARING', 'READY', 'COMPLETED'];
                        const currentIdx = statuses.indexOf(selectedOrder.status);
                        const stepIdx = statuses.indexOf(s);
                        const done = stepIdx <= currentIdx;
                        const cfg = STATUS_CONFIG[s];
                        return (
                          <React.Fragment key={s}>
                            <div className="text-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-0.5 ${done ? cfg.bg : 'bg-[#DDD5C7]'}`}>
                                <cfg.icon className={`w-3 h-3 ${done ? cfg.color : 'text-[#9A8E82]'}`} />
                              </div>
                              <div className={`text-[9px] font-semibold ${done ? cfg.color : 'text-[#9A8E82]'}`}>{cfg.label.substring(0, 4)}</div>
                            </div>
                            {i < 3 && <div className={`flex-1 h-0.5 rounded ${stepIdx < currentIdx ? 'bg-[#79415A]' : 'bg-[#DDD5C7]'}`} />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => alert(`Printing receipt for ${selectedOrder.orderNumber}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition">
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    {nextStatus[selectedOrder.status] && (
                      <button onClick={() => updateStatus(selectedOrder.id, nextStatus[selectedOrder.status]!)}
                        className="flex-1 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition">
                        Mark {STATUS_CONFIG[nextStatus[selectedOrder.status]!].label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
