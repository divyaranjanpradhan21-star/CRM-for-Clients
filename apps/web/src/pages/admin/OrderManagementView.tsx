import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt, Search, Filter, Plus, Edit2, XCircle, CheckCircle2,
  Clock, DollarSign, Download, Users, Eye, Sparkles, ChefHat,
  Truck, ShoppingBag, ArrowUpRight, ChevronRight, X, RotateCcw,
  Tag, ShieldAlert, History, AlertTriangle, Printer, Phone, MapPin
} from 'lucide-react';
import {
  OrderRecord, OrderStatus, OrderType, PaymentMethod, PaymentStatus, OrderItem,
  loadOrders, saveOrders, createOrder, updateOrderStatus, modifyOrderItems,
  applyDiscount, processRefund, getOrderMetrics, exportOrdersCSV, loadMenuCatalog,
  CatalogMenuItem, getValidNextStatuses
} from '../../lib/orderManagementApi';
import { loadTables, TableRecord } from '../../lib/tableManagementApi';
import { loadCustomersFromStorage, CustomerProfile } from '../../lib/customerManagementApi';

interface OrderManagementViewProps {
  orgId?: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string; border: string }> = {
  New: { label: 'New', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Accepted: { label: 'Accepted', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  Preparing: { label: 'Preparing', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Ready: { label: 'Ready', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Served: { label: 'Served', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  Dispatched: { label: 'Dispatched', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Completed: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  Cancelled: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  Refunded: { label: 'Refunded', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

const ORDER_TYPE_ICONS: Record<OrderType, React.ElementType> = {
  'Dine-in': UtensilsCrossedIcon,
  'Takeaway': ShoppingBag,
  'Delivery': Truck,
};

function UtensilsCrossedIcon(props: any) {
  return <ChefHat {...props} />;
}

export const OrderManagementView: React.FC<OrderManagementViewProps> = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [menuCatalog, setMenuCatalog] = useState<CatalogMenuItem[]>([]);
  const [metrics, setMetrics] = useState(getOrderMetrics());

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'completed'>('live');

  // Modals & Panels
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [refundType, setRefundType] = useState<'Partial' | 'Full'>('Full');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('Cash');

  // Order Creation Form State
  const [createOrderType, setCreateOrderType] = useState<OrderType>('Dine-in');
  const [createCustomerId, setCreateCustomerId] = useState<string>('');
  const [createCustomerName, setCreateCustomerName] = useState<string>('');
  const [createCustomerPhone, setCreateCustomerPhone] = useState<string>('');
  const [createCustomerEmail, setCreateCustomerEmail] = useState<string>('');
  const [createTableId, setCreateTableId] = useState<string>('');
  const [createDeliveryAddress, setCreateDeliveryAddress] = useState<string>('');
  const [createOrderItems, setCreateOrderItems] = useState<OrderItem[]>([]);
  const [createDiscountType, setCreateDiscountType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [createDiscountVal, setCreateDiscountVal] = useState<number>(0);
  const [createCoupon, setCreateCoupon] = useState<string>('');
  const [createPaymentMethod, setCreatePaymentMethod] = useState<PaymentMethod>('Pending');
  const [createSpecialInstructions, setCreateSpecialInstructions] = useState<string>('');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('ALL');

  const refreshData = () => {
    setOrders(loadOrders());
    setTables(loadTables().filter(t => t.isActive));
    setCustomers(loadCustomersFromStorage());
    setMenuCatalog(loadMenuCatalog());
    setMetrics(getOrderMetrics());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchType = typeFilter === 'ALL' || o.orderType === typeFilter;
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const matchPayment = paymentFilter === 'ALL' || o.paymentMethod === paymentFilter;
      const matchTab =
        activeTab === 'all'
          ? true
          : activeTab === 'live'
          ? ['New', 'Accepted', 'Preparing', 'Ready', 'Served', 'Dispatched'].includes(o.status)
          : ['Completed', 'Cancelled', 'Rejected', 'Refunded'].includes(o.status);

      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.tableNumber && o.tableNumber.toLowerCase().includes(q)) ||
        o.items.some(i => i.name.toLowerCase().includes(q));

      return matchType && matchStatus && matchPayment && matchTab && matchSearch;
    });
  }, [orders, typeFilter, statusFilter, paymentFilter, activeTab, searchQuery]);

  // Handle status step transition
  const handleTransitionStatus = (orderId: string, nextStatus: OrderStatus) => {
    try {
      const updated = updateOrderStatus(orderId, nextStatus, 'Staff / Admin');
      refreshData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Status transition failed');
    }
  };

  // Handle cancellation
  const handleConfirmCancel = () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    try {
      const updated = updateOrderStatus(selectedOrder.id, 'Cancelled', 'Admin', cancelReason.trim());
      setIsCancelModalOpen(false);
      setCancelReason('');
      refreshData();
      setSelectedOrder(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle refund
  const handleConfirmRefund = () => {
    if (!selectedOrder || refundAmount <= 0) return;
    try {
      const updated = processRefund(
        selectedOrder.id,
        refundAmount,
        refundReason || 'Customer requested refund',
        refundType,
        refundMethod,
        'Admin'
      );
      setIsRefundModalOpen(false);
      setRefundAmount(0);
      setRefundReason('');
      refreshData();
      setSelectedOrder(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Order creation item additions
  const handleAddItemToOrder = (menuItem: CatalogMenuItem) => {
    const existingIndex = createOrderItems.findIndex(i => i.menuItemId === menuItem.id);
    if (existingIndex > -1) {
      const updated = [...createOrderItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * updated[existingIndex].basePrice;
      setCreateOrderItems(updated);
    } else {
      const newItem: OrderItem = {
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        menuItemId: menuItem.id,
        name: menuItem.name,
        category: menuItem.category,
        basePrice: menuItem.price,
        quantity: 1,
        customizations: [],
        addOns: [],
        totalPrice: menuItem.price,
        dietType: menuItem.diet,
      };
      setCreateOrderItems([...createOrderItems, newItem]);
    }
  };

  const handleUpdateItemQty = (index: number, delta: number) => {
    const updated = [...createOrderItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
      updated[index].totalPrice = newQty * updated[index].basePrice;
    }
    setCreateOrderItems(updated);
  };

  // Live bill calculation for creation modal
  const liveBill = useMemo(() => {
    const subtotal = createOrderItems.reduce((s, i) => s + i.totalPrice, 0);
    const discountAmount = createDiscountType === 'Percentage' ? (subtotal * createDiscountVal) / 100 : createDiscountVal;
    const taxable = Math.max(0, subtotal - discountAmount);
    const taxRate = 5; // 5% GST
    const taxAmount = (taxable * taxRate) / 100;
    const deliveryFee = createOrderType === 'Delivery' ? 40 : 0;
    const totalAmount = taxable + taxAmount + deliveryFee;
    return { subtotal, discountAmount, taxAmount, deliveryFee, totalAmount };
  }, [createOrderItems, createDiscountType, createDiscountVal, createOrderType]);

  // Customer autofill in create form
  const handleSelectCustomer = (custId: string) => {
    setCreateCustomerId(custId);
    const found = customers.find(c => c.id === custId);
    if (found) {
      setCreateCustomerName(found.fullName);
      setCreateCustomerPhone(found.mobile);
      setCreateCustomerEmail(found.email);
      if (found.address?.street) {
        setCreateDeliveryAddress(`${found.address.street}, ${found.address.city}`);
      }
    }
  };

  // Handle Submit Order
  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createOrderItems.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }
    if (createOrderType === 'Dine-in' && !createTableId) {
      alert('Please select a dining table for Dine-in orders');
      return;
    }

    try {
      const selectedTableObj = tables.find(t => t.id === createTableId);
      const created = createOrder({
        orderType: createOrderType,
        customerId: createCustomerId || undefined,
        customerName: createCustomerName.trim() || 'Guest',
        customerPhone: createCustomerPhone.trim() || '—',
        customerEmail: createCustomerEmail.trim() || undefined,
        tableId: createOrderType === 'Dine-in' ? createTableId : undefined,
        tableNumber: createOrderType === 'Dine-in' ? selectedTableObj?.tableNumber : undefined,
        items: createOrderItems,
        subtotal: liveBill.subtotal,
        discountType: createDiscountType,
        discountValue: createDiscountVal,
        discountAmount: liveBill.discountAmount,
        couponCode: createCoupon.trim() || undefined,
        taxRate: 5,
        taxAmount: liveBill.taxAmount,
        deliveryFee: liveBill.deliveryFee,
        totalAmount: liveBill.totalAmount,
        paymentMethod: createPaymentMethod,
        paymentStatus: createPaymentMethod === 'Pending' ? 'Pending' : 'Paid',
        deliveryAddress: createOrderType === 'Delivery' ? createDeliveryAddress : undefined,
        specialInstructions: createSpecialInstructions.trim() || undefined,
        branchName: selectedTableObj?.section || 'Main Branch',
      });

      setIsCreateModalOpen(false);
      // Reset form
      setCreateOrderItems([]);
      setCreateCustomerName('');
      setCreateCustomerPhone('');
      setCreateCustomerEmail('');
      setCreateCustomerId('');
      setCreateTableId('');
      setCreateDeliveryAddress('');
      setCreateDiscountVal(0);
      setCreateCoupon('');
      refreshData();
      setSelectedOrder(created);
    } catch (err: any) {
      alert(err.message || 'Failed to create order');
    }
  };

  // Categories from menu
  const menuCategories = useMemo(() => {
    const cats = Array.from(new Set(menuCatalog.map(m => m.category)));
    return ['ALL', ...cats];
  }, [menuCatalog]);

  const filteredMenuItems = useMemo(() => {
    return menuCatalog.filter(m => {
      const matchCat = selectedMenuCategory === 'ALL' || m.category === selectedMenuCategory;
      return matchCat && m.status !== 'Out of Stock';
    });
  }, [menuCatalog, selectedMenuCategory]);

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#79415A]/10 text-[#79415A]">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#1F313D]">Order Management</h1>
          </div>
          <p className="text-xs text-[#7A7268] mt-1">
            Complete lifecycle management: Dine-in, Takeaway, and Delivery orders with live kitchen status and POS billing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportOrdersCSV(filteredOrders)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition border border-[#DDD5C7]"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setCreateOrderItems([]);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
          <div className="text-[11px] font-semibold text-[#7A7268]">Total Orders</div>
          <div className="text-2xl font-black text-[#1F313D] mt-1">{metrics.total}</div>
          <div className="text-[10px] text-[#79415A] mt-1 font-medium">{metrics.todayTotal} Today</div>
        </div>
        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-800">New & Accepted</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{metrics.newOrders + metrics.accepted}</div>
          <div className="text-[10px] text-blue-600 mt-1 font-medium">Pending Kitchen</div>
        </div>
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-800">Preparing</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{metrics.preparing}</div>
          <div className="text-[10px] text-amber-600 mt-1 font-medium">Cooking Live</div>
        </div>
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-800">Ready to Serve</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.ready}</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">At Pass / Dispatch</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-700">Completed</div>
          <div className="text-2xl font-black text-gray-800 mt-1">{metrics.completed}</div>
          <div className="text-[10px] text-gray-500 mt-1 font-medium">Settled bills</div>
        </div>
        <div className="bg-[#1F313D] text-white p-4 rounded-2xl border border-[#1F313D] shadow-xs">
          <div className="text-[11px] font-semibold text-[#E5C9B3]">Today's Revenue</div>
          <div className="text-2xl font-black text-white mt-1">₹{metrics.todayRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">Avg ₹{Math.round(metrics.avgOrderValue)} / order</div>
        </div>
      </div>

      {/* ── CONTROLS & FILTER BAR ── */}
      <div className="bg-[#FAF7F2] p-4 rounded-[24px] border border-[#E5DDD2] space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Main Tab Switch */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EFE9DF] rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'live' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Live Kitchen & POS Queue
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'completed' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Completed / Settled
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'all' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              All Orders ({orders.length})
            </button>
          </div>

          {/* Search & dropdown filters */}
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7268]" />
              <input
                type="text"
                placeholder="Search order #, customer, item..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#79415A]"
              />
            </div>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white text-[#1F313D] focus:outline-none font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="Dine-in">Dine-in</option>
              <option value="Takeaway">Takeaway</option>
              <option value="Delivery">Delivery</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white text-[#1F313D] focus:outline-none font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Accepted">Accepted</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Served">Served</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── ORDERS LISTING & INSPECTION DRAWER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Orders Table (7 or 8 cols) */}
        <div className={`${selectedOrder ? 'lg:col-span-7' : 'lg:col-span-12'} bg-[#FAF7F2] p-5 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-3`}>
          <div className="flex items-center justify-between text-xs text-[#7A7268] font-semibold px-1">
            <span>Showing {filteredOrders.length} orders</span>
            <span>Click any order to inspect details or advance workflow</span>
          </div>

          <div className="space-y-2.5">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#DDD5C7] text-[#7A7268]">
                <Receipt className="w-10 h-10 text-[#DDD5C7] mx-auto mb-2" />
                <h4 className="font-bold text-sm text-[#1F313D]">No orders match your filter</h4>
                <p className="text-xs text-[#7A7268] mt-1">Try switching tabs or adjusting search query.</p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const cfg = STATUS_CONFIG[order.status];
                const TypeIcon = ORDER_TYPE_ICONS[order.orderType];
                const isSelected = selectedOrder?.id === order.id;
                const nextOptions = getValidNextStatuses(order.status);

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-white border-[#79415A] shadow-md ring-1 ring-[#79415A]/30'
                        : 'bg-white hover:bg-white/80 border-[#DDD5C7]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#1F313D]">{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {order.status}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#5C5549] bg-[#EFE9DF] px-2 py-0.5 rounded-full">
                          <TypeIcon className="w-3 h-3 text-[#79415A]" />
                          {order.orderType}
                          {order.tableNumber && ` · ${order.tableNumber}`}
                        </span>
                      </div>

                      <div className="text-xs text-[#1F313D] font-medium">
                        <strong>{order.customerName}</strong> ({order.customerPhone})
                      </div>

                      <div className="text-[11px] text-[#7A7268] line-clamp-1">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#DDD5C7]/50 gap-1.5 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-[#1F313D]">₹{order.totalAmount.toFixed(2)}</div>
                        <div className="text-[10px] text-[#7A7268]">
                          {order.paymentMethod} · {order.paymentStatus}
                        </div>
                      </div>

                      {/* Quick Next Workflow Action Button */}
                      {nextOptions.length > 0 && nextOptions[0] && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleTransitionStatus(order.id, nextOptions[0]);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-[11px] font-bold transition flex items-center gap-1"
                        >
                          → {nextOptions[0]}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Order Detailed Drawer (5 cols) */}
        {selectedOrder && (
          <div className="lg:col-span-5 bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl font-bold text-[#1F313D]">{selectedOrder.orderNumber}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[selectedOrder.status].bg} ${STATUS_CONFIG[selectedOrder.status].text}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="text-xs text-[#7A7268] mt-0.5">
                  Placed at {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-[#7A7268] hover:bg-[#EFE9DF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Workflow Transition Stepper */}
            <div className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7] space-y-2">
              <div className="text-[11px] font-bold text-[#7A7268] uppercase tracking-wider">Workflow Transitions</div>
              <div className="flex flex-wrap gap-1.5">
                {getValidNextStatuses(selectedOrder.status).map(st => (
                  <button
                    key={st}
                    onClick={() => handleTransitionStatus(selectedOrder.id, st)}
                    className="px-3 py-1.5 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition flex items-center gap-1"
                  >
                    Advance to <strong>{st}</strong>
                  </button>
                ))}

                {['New', 'Accepted', 'Preparing'].includes(selectedOrder.status) && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition"
                  >
                    Cancel Order
                  </button>
                )}

                {['Completed', 'Cancelled'].includes(selectedOrder.status) && selectedOrder.paymentStatus !== 'Fully Refunded' && (
                  <button
                    onClick={() => {
                      setRefundAmount(selectedOrder.totalAmount);
                      setIsRefundModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Issue Refund
                  </button>
                )}
              </div>
            </div>

            {/* Customer & Location Details */}
            <div className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#7A7268]">
                <span>Customer</span>
                <strong className="text-[#1F313D]">{selectedOrder.customerName}</strong>
              </div>
              <div className="flex justify-between text-[#7A7268]">
                <span>Phone</span>
                <span className="text-[#1F313D] font-mono">{selectedOrder.customerPhone}</span>
              </div>
              {selectedOrder.tableNumber && (
                <div className="flex justify-between text-[#7A7268]">
                  <span>Dining Table</span>
                  <strong className="text-[#79415A] font-mono">{selectedOrder.tableNumber}</strong>
                </div>
              )}
              {selectedOrder.deliveryAddress && (
                <div className="pt-1 text-[#7A7268]">
                  <span className="font-bold text-[#1F313D]">Delivery Address:</span>
                  <div className="text-[11px] text-[#5C5549] mt-0.5">{selectedOrder.deliveryAddress}</div>
                </div>
              )}
            </div>

            {/* Item Breakdown */}
            <div className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7] space-y-2 text-xs">
              <div className="text-[11px] font-bold text-[#7A7268] uppercase tracking-wider">Item Details</div>
              <div className="divide-y divide-[#EAE4D9]">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#1F313D]">
                        {item.quantity}x {item.name}
                      </div>
                      {item.customizations.length > 0 && (
                        <div className="text-[10px] text-[#79415A]">
                          {item.customizations.map(c => `${c.name}: ${c.value}`).join(', ')}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <div className="text-[10px] text-amber-700 italic">
                          "{item.specialInstructions}"
                        </div>
                      )}
                    </div>
                    <div className="font-mono font-bold text-[#1F313D] shrink-0">
                      ₹{item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing breakdown */}
              <div className="pt-2 border-t border-[#DDD5C7] space-y-1 text-xs text-[#7A7268]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                    <span className="font-mono">-₹{selectedOrder.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST Taxes ({selectedOrder.taxRate}%)</span>
                  <span className="font-mono">₹{selectedOrder.taxAmount.toFixed(2)}</span>
                </div>
                {selectedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-mono">₹{selectedOrder.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-[#1F313D] pt-1 border-t border-[#DDD5C7]">
                  <span>Total Payable</span>
                  <span className="font-mono">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Refunds Section if any */}
            {selectedOrder.refunds.length > 0 && (
              <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl space-y-1 text-xs">
                <div className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">Refund History</div>
                {selectedOrder.refunds.map(ref => (
                  <div key={ref.id} className="flex justify-between text-orange-950 text-[11px]">
                    <span>₹{ref.amount} ({ref.reason})</span>
                    <span className="font-mono">{new Date(ref.processedAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Audit Log Timeline */}
            <div className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7] space-y-2 text-xs">
              <div className="text-[11px] font-bold text-[#7A7268] uppercase tracking-wider">Order Audit Trail</div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedOrder.auditLog.map(al => (
                  <div key={al.id} className="flex items-start justify-between text-[11px] border-b border-[#EFE9DF] pb-1">
                    <div>
                      <strong className="text-[#1F313D]">{al.action}</strong>
                      <div className="text-[#7A7268] text-[10px]">{al.details}</div>
                    </div>
                    <span className="text-[9px] text-[#7A7268] font-mono">
                      {new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE ORDER MODAL (FR-ORD-001 to FR-ORD-015) ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-[#DDD5C7] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1F313D]">Create New Order</h3>
                <p className="text-xs text-[#7A7268]">Dine-in table booking, takeaway counter receipt, or home delivery</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#7A7268] hover:text-[#1F313D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
              {/* Order Type Selector */}
              <div>
                <label className="font-bold text-[#1F313D] block mb-1.5">Order Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Dine-in', 'Takeaway', 'Delivery'] as OrderType[]).map(ot => {
                    const Icon = ORDER_TYPE_ICONS[ot];
                    return (
                      <button
                        key={ot}
                        type="button"
                        onClick={() => setCreateOrderType(ot)}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition border ${
                          createOrderType === ot
                            ? 'bg-[#79415A] text-white border-[#79415A]'
                            : 'bg-white text-[#5C5549] border-[#DDD5C7] hover:bg-[#EFE9DF]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {ot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer selection / input */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white rounded-2xl border border-[#DDD5C7]">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Existing Customer (Optional)</label>
                  <select
                    value={createCustomerId}
                    onChange={e => handleSelectCustomer(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#DDD5C7] text-xs focus:outline-none"
                  >
                    <option value="">-- Guest / New Diner --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.mobile})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Guest Name"
                    value={createCustomerName}
                    onChange={e => setCreateCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#DDD5C7] text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91..."
                    value={createCustomerPhone}
                    onChange={e => setCreateCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#DDD5C7] text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Conditional Table Selector for Dine-in */}
              {createOrderType === 'Dine-in' && (
                <div className="p-3 bg-white rounded-2xl border border-[#DDD5C7]">
                  <label className="font-bold text-[#1F313D] block mb-1">Assign Restaurant Table *</label>
                  <select
                    required
                    value={createTableId}
                    onChange={e => setCreateTableId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] text-xs focus:outline-none"
                  >
                    <option value="">-- Choose Dining Table --</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id} disabled={t.status === 'Unavailable'}>
                        {t.tableNumber} ({t.section} · {t.capacity} seats) — {t.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Delivery Address */}
              {createOrderType === 'Delivery' && (
                <div className="p-3 bg-white rounded-2xl border border-[#DDD5C7]">
                  <label className="font-bold text-[#1F313D] block mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Street address, apartment, landmarks"
                    value={createDeliveryAddress}
                    onChange={e => setCreateDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] text-xs focus:outline-none"
                  />
                </div>
              )}

              {/* Menu Item Catalog Selection */}
              <div className="p-4 bg-white rounded-2xl border border-[#DDD5C7] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#1F313D]">Select Menu Items</span>
                  {/* Category Filter */}
                  <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                    {menuCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedMenuCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${
                          selectedMenuCategory === cat
                            ? 'bg-[#79415A] text-white'
                            : 'bg-[#EFE9DF] text-[#5C5549] hover:bg-[#E5DDD2]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {filteredMenuItems.map(m => (
                    <div
                      key={m.id}
                      onClick={() => handleAddItemToOrder(m)}
                      className="p-2 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] hover:border-[#79415A] cursor-pointer transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-bold text-[11px] text-[#1F313D] line-clamp-1">{m.name}</div>
                        <div className="text-[10px] text-[#7A7268]">{m.category}</div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#DDD5C7]/60">
                        <span className="font-mono font-bold text-[#79415A]">₹{m.price}</span>
                        <span className="text-[10px] font-bold text-white bg-[#79415A] px-1.5 py-0.5 rounded">
                          + Add
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items Basket */}
              <div className="p-4 bg-white rounded-2xl border border-[#DDD5C7] space-y-2">
                <div className="font-bold text-sm text-[#1F313D]">
                  Order Items ({createOrderItems.length})
                </div>

                {createOrderItems.length === 0 ? (
                  <div className="text-center py-6 text-[#7A7268] italic">
                    Click items in the menu catalog above to add them to this order.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {createOrderItems.map((item, idx) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7]">
                        <div className="flex-1">
                          <span className="font-bold text-[#1F313D]">{item.name}</span>
                          <span className="text-[10px] text-[#7A7268] ml-2">₹{item.basePrice} each</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-white border border-[#DDD5C7] rounded-lg px-2 py-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, -1)}
                              className="font-bold text-sm text-[#79415A] px-1"
                            >
                              -
                            </button>
                            <span className="font-bold font-mono">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, 1)}
                              className="font-bold text-sm text-[#79415A] px-1"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-mono font-bold text-[#1F313D] w-16 text-right">
                            ₹{item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discounts & Bill Breakdown Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-2xl border border-[#DDD5C7]">
                <div className="space-y-2">
                  <label className="font-bold text-[#1F313D] block">Discounts & Coupons</label>
                  <div className="flex gap-2">
                    <select
                      value={createDiscountType}
                      onChange={e => setCreateDiscountType(e.target.value as any)}
                      className="px-2 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white"
                    >
                      <option value="Percentage">% Percent</option>
                      <option value="Fixed">₹ Fixed</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Discount val"
                      value={createDiscountVal || ''}
                      onChange={e => setCreateDiscountVal(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1.5 rounded-xl border border-[#DDD5C7] text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={createCoupon}
                      onChange={e => setCreateCoupon(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-xl border border-[#DDD5C7] text-xs uppercase"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#1F313D] block mb-1">Payment Method</label>
                    <select
                      value={createPaymentMethod}
                      onChange={e => setCreatePaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white"
                    >
                      <option value="Pending">Pay on Checkout / Cash</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Wallet">Digital Wallet</option>
                      <option value="Cash">Cash Settled</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#DDD5C7] space-y-1 font-mono text-xs text-[#7A7268]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{liveBill.subtotal.toFixed(2)}</span>
                  </div>
                  {liveBill.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount:</span>
                      <span>-₹{liveBill.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST Tax (5%):</span>
                    <span>₹{liveBill.taxAmount.toFixed(2)}</span>
                  </div>
                  {liveBill.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>₹{liveBill.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-[#1F313D] pt-1.5 border-t border-[#DDD5C7]">
                    <span>Total Amount:</span>
                    <span>₹{liveBill.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold text-xs hover:bg-[#E5DDD2] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white font-bold text-xs transition shadow-xs"
                >
                  Confirm & Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CANCELLATION REASON MODAL ── */}
      {isCancelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-serif font-bold text-lg text-rose-800">
              Cancel Order {selectedOrder.orderNumber}
            </h3>
            <p className="text-[#7A7268]">
              Please state the mandatory reason for cancelling this order. If linked to a dining table, the table will be cleared.
            </p>

            <div>
              <label className="font-bold text-[#1F313D] block mb-1">Reason for Cancellation *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Guest walked out, duplicate ticket, customer changed mind"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={!cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-700 disabled:opacity-50 text-white font-bold hover:bg-rose-800 transition"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REFUND MODAL ── */}
      {isRefundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-serif font-bold text-lg text-orange-900">
              Process Refund for {selectedOrder.orderNumber}
            </h3>
            <p className="text-[#7A7268]">
              Order total: ₹{selectedOrder.totalAmount.toFixed(2)}. Process an authorized partial or full refund.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Refund Type</label>
                <select
                  value={refundType}
                  onChange={e => {
                    const t = e.target.value as any;
                    setRefundType(t);
                    if (t === 'Full') setRefundAmount(selectedOrder.totalAmount);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs"
                >
                  <option value="Full">Full Refund (₹{selectedOrder.totalAmount})</option>
                  <option value="Partial">Partial Refund</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Refund Amount (₹) *</label>
                <input
                  type="number"
                  min={1}
                  max={selectedOrder.totalAmount}
                  value={refundAmount}
                  onChange={e => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#1F313D] block mb-1">Refund Method</label>
              <select
                value={refundMethod}
                onChange={e => setRefundMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Original Card</option>
                <option value="UPI">UPI Account</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#1F313D] block mb-1">Reason for Refund</label>
              <input
                type="text"
                placeholder="e.g. Food quality issue, delayed delivery"
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={refundAmount <= 0}
                onClick={handleConfirmRefund}
                className="flex-1 py-2.5 rounded-xl bg-orange-700 disabled:opacity-50 text-white font-bold hover:bg-orange-800 transition"
              >
                Execute Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
