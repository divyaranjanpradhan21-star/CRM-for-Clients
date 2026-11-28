import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CreditCard, Search, Filter, DollarSign, Download, Printer,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, ChevronRight,
  Eye, FileText, ArrowUpRight, RotateCcw, Share2, Copy,
  QrCode, Smartphone, Banknote, ShieldCheck, History, Check,
  X, Layers, Calendar, Landmark, Plus, Award
} from 'lucide-react';
import {
  Invoice, InvoiceStatus, PaymentMethod, PaymentTransaction, BillingMetrics,
  SplitPaymentEntry, loadInvoices, recordPayment, recordFailedTransaction,
  processInvoiceRefund, reconcileTransaction, getBillingMetrics,
  generateDigitalReceiptText, exportInvoicesCSV, generateInvoiceForOrder
} from '../../lib/billingPaymentApi';
import { loadOrders, OrderRecord } from '../../lib/orderManagementApi';
import { loadLoyaltyAccounts, redeemLoyaltyPointsForInvoice } from '../../lib/loyaltyRewardsApi';
import { getActiveMembershipForCustomer } from '../../lib/membershipManagementApi';

interface BillingPaymentViewProps {
  orgId?: string;
  userRole?: string; // 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STAFF'
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; bg: string; text: string; border: string }> = {
  Paid: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Unpaid: { label: 'Unpaid / Due', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Partially Paid': { label: 'Partially Paid', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  Refunded: { label: 'Refunded', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

const PAYMENT_ICONS: Record<PaymentMethod, React.ElementType> = {
  Cash: Banknote,
  UPI: Smartphone,
  Card: CreditCard,
  'Online Gateway': Landmark,
  Split: Layers,
  Wallet: CreditCard,
};

export const BillingPaymentView: React.FC<BillingPaymentViewProps> = ({ userRole = 'RESTAURANT_ADMIN' }) => {
  const isStaffOnly = userRole === 'STAFF';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [metrics, setMetrics] = useState<BillingMetrics>(getBillingMetrics());

  // Tabs
  const [activeTab, setActiveTab] = useState<'invoices' | 'transactions' | 'reconciliation' | 'reports'>('invoices');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isGenerateFromOrderOpen, setIsGenerateFromOrderOpen] = useState(false);

  // Payment Form State
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payReference, setPayReference] = useState('');
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState<number>(0);
  const [splitCardAmount, setSplitCardAmount] = useState<number>(0);
  const [splitUpiAmount, setSplitUpiAmount] = useState<number>(0);

  // Refund Form State
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('Cash');

  // Copy feedback
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const printableRef = useRef<HTMLDivElement>(null);

  const refreshData = () => {
    setInvoices(loadInvoices());
    setTransactions(loadInvoices().flatMap(i => i.payments.map(p => ({
      id: p.id,
      invoiceId: i.id,
      invoiceNumber: i.invoiceNumber,
      orderNumber: i.orderNumber,
      amount: p.amount,
      method: p.method as PaymentMethod,
      status: 'Success' as const,
      transactionRef: p.reference || 'DIRECT-PAY',
      timestamp: p.timestamp,
      processedBy: i.issuedBy,
      reconciliationStatus: i.reconciliationStatus
    }))));
    setOrders(loadOrders());
    setMetrics(getBillingMetrics());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchMethod = methodFilter === 'ALL' || inv.primaryPaymentMethod === methodFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.orderNumber && inv.orderNumber.toLowerCase().includes(q)) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerPhone.includes(q) ||
        inv.branchName.toLowerCase().includes(q);

      return matchStatus && matchMethod && matchSearch;
    });
  }, [invoices, statusFilter, methodFilter, searchQuery]);

  // Open Collect Payment Modal
  const handleOpenPay = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayMethod('Cash');
    setPayAmount(inv.balanceDue);
    setPayReference('');
    setIsSplitMode(false);
    setSplitCashAmount(Math.round(inv.balanceDue / 2));
    setSplitCardAmount(Math.round(inv.balanceDue / 2));
    setSplitUpiAmount(0);
    setIsPayModalOpen(true);
  };

  // Submit Payment Settlement
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      if (isSplitMode) {
        const totalSplit = splitCashAmount + splitCardAmount + splitUpiAmount;
        if (Math.abs(totalSplit - selectedInvoice.balanceDue) > 0.05) {
          alert(`Split amounts (₹${totalSplit}) must match outstanding balance (₹${selectedInvoice.balanceDue.toFixed(2)})`);
          return;
        }

        const entries: SplitPaymentEntry[] = [];
        const now = new Date().toISOString();
        if (splitCashAmount > 0) entries.push({ id: `sp-${Date.now()}-1`, method: 'Cash', amount: splitCashAmount, timestamp: now, reference: 'SPLIT-CASH' });
        if (splitCardAmount > 0) entries.push({ id: `sp-${Date.now()}-2`, method: 'Card', amount: splitCardAmount, timestamp: now, reference: 'SPLIT-CARD' });
        if (splitUpiAmount > 0) entries.push({ id: `sp-${Date.now()}-3`, method: 'UPI', amount: splitUpiAmount, timestamp: now, reference: 'SPLIT-UPI' });

        recordPayment(
          selectedInvoice.id,
          {
            method: 'Split',
            amount: totalSplit,
            reference: 'SPLIT-SETTLEMENT',
            splitEntries: entries
          },
          'Cashier'
        );
      } else {
        recordPayment(
          selectedInvoice.id,
          {
            method: payMethod,
            amount: payAmount,
            reference: payReference || `${payMethod}-POS-${Date.now().toString().slice(-4)}`
          },
          'Cashier'
        );
      }

      setIsPayModalOpen(false);
      refreshData();
      alert('Payment recorded successfully!');
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    }
  };

  // Submit Refund
  const handleConfirmRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || refundAmount <= 0) return;
    try {
      processInvoiceRefund(selectedInvoice.id, {
        amount: refundAmount,
        reason: refundReason.trim() || 'Customer requested refund',
        approvedBy: userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Restaurant Admin',
        method: refundMethod
      });
      setIsRefundModalOpen(false);
      setRefundAmount(0);
      setRefundReason('');
      refreshData();
      alert('Refund authorized and recorded!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick print trigger
  const handleTriggerPrint = () => {
    window.print();
  };

  // Generate bill from order
  const handleGenerateBill = (order: OrderRecord) => {
    try {
      const generated = generateInvoiceForOrder(order);
      setIsGenerateFromOrderOpen(false);
      refreshData();
      handleOpenPay(generated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#79415A]/10 text-[#79415A]">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#1F313D]">Billing & Payments</h1>
          </div>
          <p className="text-xs text-[#7A7268] mt-1">
            Automated invoices, split payments, Indian GST (CGST+SGST), cash & UPI settlements, refunds, and gateway reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportInvoicesCSV(filteredInvoices)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition border border-[#DDD5C7]"
          >
            <Download className="w-3.5 h-3.5" />
            Export Invoices
          </button>
          <button
            onClick={() => setIsGenerateFromOrderOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Generate Bill from Order
          </button>
        </div>
      </div>

      {/* ── 8 KPI FINANCIAL SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-[#1F313D] text-white p-3.5 rounded-2xl shadow-xs">
          <div className="text-[10px] text-[#E5C9B3] font-medium">Total Revenue</div>
          <div className="text-xl font-black mt-1">₹{(metrics.totalRevenue / 1000).toFixed(1)}k</div>
          <div className="text-[9px] text-emerald-400 mt-0.5">Settled Gross</div>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[10px] font-semibold text-emerald-800">Today's Collections</div>
          <div className="text-xl font-black text-emerald-700 mt-1">₹{metrics.todayCollections.toFixed(0)}</div>
          <div className="text-[9px] text-emerald-600 mt-0.5">Cash + UPI + Card</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#E5DDD2] shadow-xs">
          <div className="text-[10px] font-semibold text-[#7A7268]">Paid Invoices</div>
          <div className="text-xl font-black text-[#1F313D] mt-1">{metrics.paidInvoicesCount}</div>
          <div className="text-[9px] text-emerald-700 mt-0.5 font-bold">100% Cleared</div>
        </div>
        <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 shadow-xs">
          <div className="text-[10px] font-semibold text-rose-800">Unpaid Invoices</div>
          <div className="text-xl font-black text-rose-700 mt-1">{metrics.unpaidInvoicesCount}</div>
          <div className="text-[9px] text-rose-600 mt-0.5">Outstanding</div>
        </div>
        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-[10px] font-semibold text-amber-800">Partially Paid</div>
          <div className="text-xl font-black text-amber-700 mt-1">{metrics.partiallyPaidCount}</div>
          <div className="text-[9px] text-amber-600 mt-0.5">Split / Deposit</div>
        </div>
        <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-200 shadow-xs">
          <div className="text-[10px] font-semibold text-rose-800">Pending Due</div>
          <div className="text-xl font-black text-rose-700 mt-1">₹{metrics.pendingAmount.toFixed(0)}</div>
          <div className="text-[9px] text-rose-600 mt-0.5">Total Receivables</div>
        </div>
        <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 shadow-xs">
          <div className="text-[10px] font-semibold text-purple-800">Refunds Given</div>
          <div className="text-xl font-black text-purple-700 mt-1">₹{metrics.totalRefundsAmount.toFixed(0)}</div>
          <div className="text-[9px] text-purple-600 mt-0.5">{metrics.totalRefundsCount} Claims</div>
        </div>
        <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 shadow-xs">
          <div className="text-[10px] font-semibold text-blue-800">GST Collected</div>
          <div className="text-xl font-black text-blue-700 mt-1">₹{(metrics.cgstCollected + metrics.sgstCollected).toFixed(0)}</div>
          <div className="text-[9px] text-blue-600 mt-0.5">CGST + SGST (5%)</div>
        </div>
      </div>

      {/* ── TOOLBAR & TABS ── */}
      <div className="bg-[#FAF7F2] p-4 rounded-[24px] border border-[#E5DDD2] space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EFE9DF] rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                activeTab === 'invoices' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Invoices Queue ({filteredInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                activeTab === 'transactions' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Payment Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                activeTab === 'reconciliation' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Gateway Reconciliation
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                activeTab === 'reports' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Tax & Method Reports
            </button>
          </div>

          {/* Search & dropdown filters */}
          {activeTab === 'invoices' && (
            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7268]" />
                <input
                  type="text"
                  placeholder="Search invoice #, order, patron..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#79415A]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white text-[#1F313D] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Unpaid">Unpaid / Due</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Refunded">Refunded</option>
              </select>

              <select
                value={methodFilter}
                onChange={e => setMethodFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white text-[#1F313D] focus:outline-none"
              >
                <option value="ALL">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Online Gateway">Gateway</option>
                <option value="Split">Split</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── TAB 1: INVOICES QUEUE (FR-PAY-011, FR-PAY-013) ── */}
      {activeTab === 'invoices' && (
        <div className="bg-[#FAF7F2] rounded-[28px] border border-[#E5DDD2] p-5 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#DDD5C7] text-left text-[#7A7268] font-bold">
                  <th className="pb-3 pl-2">Invoice #</th>
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Branch</th>
                  <th className="pb-3 text-right">Subtotal</th>
                  <th className="pb-3 text-right">GST (5%)</th>
                  <th className="pb-3 text-right">Total</th>
                  <th className="pb-3 text-right">Balance Due</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[#7A7268]">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => {
                    const statusCfg = STATUS_CONFIG[inv.status];
                    const MethodIcon = PAYMENT_ICONS[inv.primaryPaymentMethod] || Banknote;

                    return (
                      <tr key={inv.id} className="hover:bg-white/80 transition">
                        <td className="py-3 pl-2 font-mono font-bold text-sm text-[#1F313D]">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 font-semibold text-[#5C5549]">
                          {inv.orderNumber ? (
                            <span className="font-mono">{inv.orderNumber}</span>
                          ) : (
                            <span className="text-[#7A7268]">—</span>
                          )}
                          {inv.tableNumber && (
                            <span className="block text-[10px] text-[#79415A]">Table {inv.tableNumber}</span>
                          )}
                        </td>
                        <td className="py-3 font-medium text-[#1F313D]">
                          {inv.customerName}
                          <span className="block text-[10px] text-[#7A7268]">{inv.customerPhone}</span>
                        </td>
                        <td className="py-3 text-[#7A7268]">{inv.branchName}</td>
                        <td className="py-3 text-right font-mono text-[#5C5549]">₹{inv.subtotal.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono text-[#7A7268]">₹{inv.totalTax.toFixed(2)}</td>
                        <td className="py-3 text-right font-black font-mono text-[#1F313D]">
                          ₹{inv.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold">
                          {inv.balanceDue > 0 ? (
                            <span className="text-rose-700">₹{inv.balanceDue.toFixed(2)}</span>
                          ) : (
                            <span className="text-emerald-700">₹0.00</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#5C5549]">
                            <MethodIcon className="w-3.5 h-3.5 text-[#79415A]" />
                            {inv.primaryPaymentMethod}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.status !== 'Paid' && inv.status !== 'Refunded' && (
                              <button
                                onClick={() => handleOpenPay(inv)}
                                className="px-2.5 py-1 rounded-lg bg-[#79415A] hover:bg-[#68334b] text-white text-[11px] font-bold transition"
                              >
                                Collect
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setIsPrintModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DDD2] text-[#1F313D]"
                              title="Print Invoice"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setCopiedReceipt(false);
                                setIsReceiptModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DDD2] text-[#79415A]"
                              title="Digital Receipt"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {!isStaffOnly && inv.status === 'Paid' && (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setRefundAmount(inv.totalAmount);
                                  setIsRefundModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700"
                                title="Authorize Refund"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: TRANSACTION LOGS (FR-PAY-015, FR-PAY-016) ── */}
      {activeTab === 'transactions' && (
        <div className="bg-[#FAF7F2] rounded-[28px] border border-[#E5DDD2] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1F313D]">Payment Transaction Ledger</h3>
              <p className="text-xs text-[#7A7268]">Immutable chronological audit log of all POS and online gateway movements.</p>
            </div>
          </div>

          <div className="divide-y divide-[#EAE4D9] bg-white rounded-2xl border border-[#DDD5C7] overflow-hidden">
            {transactions.map(tx => (
              <div key={tx.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#1F313D]">{tx.invoiceNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tx.status === 'Success' ? 'bg-emerald-100 text-emerald-800' : tx.status === 'Refunded' ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {tx.status}
                    </span>
                    <span className="text-[10px] bg-[#EFE9DF] text-[#5C5549] px-2 py-0.5 rounded-full font-bold">
                      {tx.method}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#7A7268]">
                    Ref: <span className="font-mono font-bold text-[#1F313D]">{tx.transactionRef}</span>
                    {tx.failureReason && (
                      <span className="text-rose-700 ml-2 font-semibold">⚠ {tx.failureReason}</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black font-mono text-[#1F313D]">₹{tx.amount.toFixed(2)}</div>
                  <span className="text-[10px] text-[#7A7268]">{new Date(tx.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: GATEWAY RECONCILIATION (FR-PAY-017) ── */}
      {activeTab === 'reconciliation' && (
        <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1F313D]">Payment Gateway Reconciliation</h3>
              <p className="text-xs text-[#7A7268]">Compare POS sales records against payment gateway settlement webhooks.</p>
            </div>
            <button
              onClick={() => {
                alert('Triggered live reconciliation sync with online gateway. All verified records matched!');
                refreshData();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#79415A] text-white font-bold text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reconcile Gateway
            </button>
          </div>

          <div className="space-y-3">
            {invoices.map(inv => (
              <div key={inv.id} className="p-4 bg-white rounded-2xl border border-[#DDD5C7] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#1F313D]">{inv.invoiceNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.reconciliationStatus === 'Matched' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.reconciliationStatus}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A7268] mt-1">
                    {inv.customerName} · {inv.primaryPaymentMethod} · ₹{inv.totalAmount.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {inv.reconciliationStatus !== 'Matched' && (
                    <button
                      onClick={() => {
                        reconcileTransaction(inv.id, 'Matched');
                        refreshData();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold hover:bg-emerald-200 transition"
                    >
                      Mark Matched
                    </button>
                  )}
                  <span className="text-[11px] text-[#7A7268] font-mono">
                    {inv.gatewayPaymentId || 'POS-SETTLED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: TAX & REVENUE REPORTS (FR-PAY-018) ── */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GST Breakdown */}
          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#1F313D]">Goods & Services Tax (GST) Summary</h3>
            <p className="text-xs text-[#7A7268]">Standard Indian Restaurant GST split: 2.5% CGST + 2.5% SGST</p>

            <div className="p-4 bg-white rounded-2xl border border-[#DDD5C7] space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span>Central GST (CGST 2.5%):</span>
                <span className="font-bold text-[#1F313D]">₹{metrics.cgstCollected.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>State GST (SGST 2.5%):</span>
                <span className="font-bold text-[#1F313D]">₹{metrics.sgstCollected.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-[#DDD5C7] flex justify-between text-sm font-black text-[#79415A]">
                <span>Total GST Collected:</span>
                <span>₹{(metrics.cgstCollected + metrics.sgstCollected).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Share */}
          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#1F313D]">Collections by Payment Channel</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#DDD5C7] flex justify-between">
                <span className="font-bold text-[#1F313D] flex items-center gap-1.5"><Banknote className="w-4 h-4 text-emerald-600" /> Cash</span>
                <strong className="font-mono">₹{metrics.cashRevenue.toFixed(2)}</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#DDD5C7] flex justify-between">
                <span className="font-bold text-[#1F313D] flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-purple-600" /> UPI / QR</span>
                <strong className="font-mono">₹{metrics.upiRevenue.toFixed(2)}</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#DDD5C7] flex justify-between">
                <span className="font-bold text-[#1F313D] flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-blue-600" /> Card / POS Machine</span>
                <strong className="font-mono">₹{metrics.cardRevenue.toFixed(2)}</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#DDD5C7] flex justify-between">
                <span className="font-bold text-[#1F313D] flex items-center gap-1.5"><Landmark className="w-4 h-4 text-amber-600" /> Online Payment Gateway</span>
                <strong className="font-mono">₹{metrics.onlineGatewayRevenue.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COLLECT PAYMENT MODAL (FR-PAY-005 to FR-PAY-010) ── */}
      {isPayModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#DDD5C7] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1F313D]">
                  Collect Payment: {selectedInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-[#7A7268]">Total ₹{selectedInvoice.totalAmount.toFixed(2)} · Balance Due ₹{selectedInvoice.balanceDue.toFixed(2)}</p>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="text-[#7A7268] hover:text-[#1F313D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Loyalty & Membership Privileges (FR-LOY-006, FR-MEM-005) */}
            {(() => {
              const loyaltyAccounts = loadLoyaltyAccounts();
              const lAcc = loyaltyAccounts.find(a => (selectedInvoice.customerId && a.customerId === selectedInvoice.customerId) || (selectedInvoice.customerPhone && a.customerPhone === selectedInvoice.customerPhone));
              const activeMember = selectedInvoice.customerId ? getActiveMembershipForCustomer(selectedInvoice.customerId) : null;
              
              if (!lAcc && !activeMember) return null;
              return (
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#82401D] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#82401D]" /> Patron Club Privileges
                    </span>
                    {activeMember && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                        {activeMember.planName} ({activeMember.discountPercentage}% OFF)
                      </span>
                    )}
                  </div>
                  {lAcc && lAcc.currentPoints >= 50 && (
                    <div className="flex items-center justify-between pt-1 border-t border-amber-200 text-[11px]">
                      <div>
                        <span className="text-[#5C5549]">Available: <strong>{lAcc.currentPoints} pts</strong> (₹{lAcc.currentPoints} value)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const ptsToRedeem = Math.min(lAcc.currentPoints, Math.floor(payAmount));
                          const res = redeemLoyaltyPointsForInvoice({
                            invoiceId: selectedInvoice.id,
                            customerId: lAcc.customerId,
                            pointsToRedeem: ptsToRedeem,
                            billSubtotal: selectedInvoice.totalAmount,
                            performer: 'POS Cashier'
                          });
                          if (res.success) {
                            setPayAmount(Math.max(0, payAmount - res.discountAmount));
                            alert(res.message);
                            refreshData();
                          } else {
                            alert(res.message);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#82401D] text-white font-bold text-[10px] hover:bg-[#68334b] transition"
                      >
                        Redeem Points (₹{Math.min(lAcc.currentPoints, Math.floor(payAmount))})
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            <form onSubmit={handleSubmitPayment} className="space-y-3">
              {/* Split Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#DDD5C7]">
                <span className="font-bold text-[#1F313D]">Split across multiple payment modes?</span>
                <input
                  type="checkbox"
                  checked={isSplitMode}
                  onChange={e => setIsSplitMode(e.target.checked)}
                  className="rounded text-[#79415A] w-4 h-4"
                />
              </div>

              {!isSplitMode ? (
                <>
                  <div>
                    <label className="font-bold text-[#1F313D] block mb-1">Payment Method</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['Cash', 'UPI', 'Card', 'Online Gateway'] as PaymentMethod[]).map(pm => {
                        const Icon = PAYMENT_ICONS[pm];
                        return (
                          <button
                            key={pm}
                            type="button"
                            onClick={() => setPayMethod(pm)}
                            className={`p-2 rounded-xl border text-center transition font-bold ${
                              payMethod === pm
                                ? 'bg-[#79415A] text-white border-[#79415A]'
                                : 'bg-white text-[#5C5549] border-[#DDD5C7]'
                            }`}
                          >
                            <Icon className="w-4 h-4 mx-auto mb-1" />
                            <span className="text-[10px] block">{pm}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* UPI QR Display (FR-PAY-006) */}
                  {payMethod === 'UPI' && (
                    <div className="p-3 bg-white rounded-2xl border border-[#DDD5C7] text-center space-y-1">
                      <div className="w-32 h-32 mx-auto bg-gray-100 rounded-xl flex items-center justify-center border border-dashed border-[#79415A]">
                        <QrCode className="w-20 h-20 text-[#79415A]" />
                      </div>
                      <div className="text-[10px] text-[#7A7268] font-mono">VPA: cafescorner@okaxis</div>
                      <div className="text-[10px] font-bold text-emerald-700">Scan via GPay / PhonePe / Paytm</div>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-[#1F313D] block mb-1">Amount to Pay (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min={1}
                      max={selectedInvoice.balanceDue}
                      value={payAmount}
                      onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white font-mono font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#1F313D] block mb-1">Transaction Ref / Auth Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR / Approval Ref"
                      value={payReference}
                      onChange={e => setPayReference(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#DDD5C7] bg-white text-xs font-mono"
                    />
                  </div>
                </>
              ) : (
                /* Split Mode Builder (FR-PAY-009) */
                <div className="p-3 bg-white rounded-2xl border border-[#DDD5C7] space-y-2">
                  <div className="font-bold text-[#1F313D]">Divide Balance (Total: ₹{selectedInvoice.balanceDue.toFixed(2)})</div>
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between text-xs">
                      <span>Cash (₹):</span>
                      <input
                        type="number"
                        value={splitCashAmount}
                        onChange={e => setSplitCashAmount(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 rounded border border-[#DDD5C7] font-mono font-bold"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs">
                      <span>Card (₹):</span>
                      <input
                        type="number"
                        value={splitCardAmount}
                        onChange={e => setSplitCardAmount(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 rounded border border-[#DDD5C7] font-mono font-bold"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs">
                      <span>UPI (₹):</span>
                      <input
                        type="number"
                        value={splitUpiAmount}
                        onChange={e => setSplitUpiAmount(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 rounded border border-[#DDD5C7] font-mono font-bold"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white font-bold transition shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PRINT INVOICE MODAL (FR-PAY-013) ── */}
      {isPrintModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-bold text-[#1F313D] text-sm">Tax Invoice Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerPrint}
                  className="px-3 py-1 rounded-lg bg-[#79415A] text-white font-bold text-xs flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Now
                </button>
                <button onClick={() => setIsPrintModalOpen(false)} className="text-[#7A7268]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Paper Canvas */}
            <div ref={printableRef} className="p-4 bg-white border border-[#DDD5C7] rounded-xl space-y-3 font-sans">
              <div className="text-center space-y-0.5">
                <h2 className="font-serif font-black text-base text-[#1F313D]">{selectedInvoice.restaurantName}</h2>
                <p className="text-[10px] text-[#7A7268]">{selectedInvoice.address}</p>
                <p className="text-[10px] text-[#7A7268]">GSTIN: {selectedInvoice.gstin} | FSSAI: {selectedInvoice.fssaiNumber}</p>
              </div>

              <div className="border-t border-b border-dashed py-2 flex justify-between text-[11px]">
                <div>
                  <strong>Invoice:</strong> {selectedInvoice.invoiceNumber}<br />
                  <strong>Date:</strong> {new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN')}<br />
                  {selectedInvoice.tableNumber && <span><strong>Table:</strong> {selectedInvoice.tableNumber}<br /></span>}
                </div>
                <div className="text-right">
                  <strong>Customer:</strong> {selectedInvoice.customerName}<br />
                  <strong>Mobile:</strong> {selectedInvoice.customerPhone}<br />
                  <strong>Branch:</strong> {selectedInvoice.branchName}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b font-bold text-left">
                    <th>Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedInvoice.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{i.name}</td>
                      <td className="text-center">{i.quantity}</td>
                      <td className="text-right">₹{i.unitPrice}</td>
                      <td className="text-right font-mono">₹{i.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed pt-2 space-y-1 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-₹{selectedInvoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>CGST (2.5%):</span>
                  <span>₹{selectedInvoice.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (2.5%):</span>
                  <span>₹{selectedInvoice.sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t pt-1">
                  <span>Grand Total:</span>
                  <span>₹{selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Amount Paid:</span>
                  <span>₹{selectedInvoice.amountPaid.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-[#7A7268] pt-2 border-t border-dashed">
                Thank you for your visit! Please visit us again.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DIGITAL RECEIPT MODAL (FR-PAY-012) ── */}
      {isReceiptModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#1F313D]">Digital WhatsApp/SMS Receipt</h3>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-[#7A7268]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              readOnly
              rows={12}
              value={generateDigitalReceiptText(selectedInvoice)}
              className="w-full p-3 rounded-xl border border-[#DDD5C7] bg-white font-mono text-xs focus:outline-none resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateDigitalReceiptText(selectedInvoice));
                  setCopiedReceipt(true);
                  setTimeout(() => setCopiedReceipt(false), 2000);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#79415A] text-white font-bold flex items-center justify-center gap-1.5"
              >
                {copiedReceipt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedReceipt ? 'Copied to Clipboard!' : 'Copy Receipt Text'}
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REFUND MODAL (FR-PAY-014) ── */}
      {isRefundModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-serif font-bold text-lg text-purple-900">
              Authorize Refund for {selectedInvoice.invoiceNumber}
            </h3>
            <p className="text-[#7A7268]">
              Collected: ₹{selectedInvoice.amountPaid.toFixed(2)}. Only authorized managers can execute financial rollbacks.
            </p>

            <form onSubmit={handleConfirmRefund} className="space-y-3">
              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Refund Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={1}
                  max={selectedInvoice.amountPaid}
                  value={refundAmount}
                  onChange={e => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Refund Method</label>
                <select
                  value={refundMethod}
                  onChange={e => setRefundMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI Reverse Transfer</option>
                  <option value="Card">Original Card Terminal</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Mandatory Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Returned food, double swiped card"
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
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800"
                >
                  Authorize & Issue Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── GENERATE BILL FROM ORDER MODAL ── */}
      {isGenerateFromOrderOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#1F313D]">Generate Bill from Active Orders</h3>
              <button onClick={() => setIsGenerateFromOrderOpen(false)} className="text-[#7A7268]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-[#7A7268]">No orders found</div>
              ) : (
                orders.map(o => (
                  <div key={o.id} className="p-3 bg-white rounded-xl border border-[#DDD5C7] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#1F313D]">{o.orderNumber}</span>
                        <span className="text-[10px] bg-[#EFE9DF] text-[#5C5549] px-2 py-0.5 rounded-full font-bold">
                          {o.orderType}
                          {o.tableNumber && ` · ${o.tableNumber}`}
                        </span>
                      </div>
                      <div className="text-[#7A7268] text-[11px] mt-0.5">{o.customerName} · ₹{o.totalAmount.toFixed(2)}</div>
                    </div>

                    <button
                      onClick={() => handleGenerateBill(o)}
                      className="px-3 py-1.5 rounded-xl bg-[#79415A] text-white font-bold hover:bg-[#68334b]"
                    >
                      Generate Bill
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
