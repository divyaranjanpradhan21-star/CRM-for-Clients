import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed, Search, TrendingUp, TrendingDown, Star, Download,
  Flame, Package, Eye, Edit2, Plus, Filter, BarChart2, DollarSign,
  ArrowUpRight, ChefHat, AlertTriangle
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type MenuCategory = 'Starters' | 'Main Course' | 'Breads' | 'Rice & Biryani' | 'Desserts' | 'Beverages' | 'Soups' | 'Salads';
type DietType = 'Veg' | 'Non-Veg' | 'Vegan';
type ItemStatus = 'Available' | 'Out of Stock' | 'Seasonal';

interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  diet: DietType;
  price: number;
  costPrice: number;
  status: ItemStatus;
  imageUrl: string;
  ordersThisMonth: number;
  ordersLastMonth: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  rank: number;
  tags: string[];
  branch: string[];
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Butter Chicken', category: 'Main Course', diet: 'Non-Veg', price: 320, costPrice: 110, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=80&h=80&fit=crop', ordersThisMonth: 248, ordersLastMonth: 210, revenue: 79360, rating: 4.8, reviewCount: 142, rank: 1, tags: ['Bestseller', 'Chef Special'], branch: ['Main Branch', 'City Center', 'Airport Road', 'Highway Hub'] },
  { id: 'm2', name: 'Chicken Biryani', category: 'Rice & Biryani', diet: 'Non-Veg', price: 350, costPrice: 130, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=80&h=80&fit=crop', ordersThisMonth: 231, ordersLastMonth: 198, revenue: 80850, rating: 4.7, reviewCount: 128, rank: 2, tags: ['Popular', 'Bestseller'], branch: ['Main Branch', 'City Center'] },
  { id: 'm3', name: 'Paneer Tikka', category: 'Starters', diet: 'Veg', price: 280, costPrice: 95, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=80&h=80&fit=crop', ordersThisMonth: 189, ordersLastMonth: 201, revenue: 52920, rating: 4.6, reviewCount: 97, rank: 3, tags: ['Veg Favourite'], branch: ['Main Branch', 'City Center', 'Highway Hub'] },
  { id: 'm4', name: 'Dal Makhani', category: 'Main Course', diet: 'Veg', price: 240, costPrice: 70, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=80&h=80&fit=crop', ordersThisMonth: 165, ordersLastMonth: 171, revenue: 39600, rating: 4.5, reviewCount: 84, rank: 4, tags: ['Classic'], branch: ['Main Branch', 'City Center', 'Airport Road', 'Highway Hub'] },
  { id: 'm5', name: 'Garlic Naan', category: 'Breads', diet: 'Veg', price: 60, costPrice: 15, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=80&h=80&fit=crop', ordersThisMonth: 412, ordersLastMonth: 395, revenue: 24720, rating: 4.4, reviewCount: 203, rank: 5, tags: ['Addon Essential'], branch: ['Main Branch', 'City Center', 'Airport Road', 'Highway Hub'] },
  { id: 'm6', name: 'Mutton Rogan Josh', category: 'Main Course', diet: 'Non-Veg', price: 420, costPrice: 160, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=80&h=80&fit=crop', ordersThisMonth: 112, ordersLastMonth: 125, revenue: 47040, rating: 4.6, reviewCount: 67, rank: 6, tags: ['Premium', 'Chef Special'], branch: ['Main Branch', 'City Center'] },
  { id: 'm7', name: 'Mango Lassi', category: 'Beverages', diet: 'Veg', price: 90, costPrice: 25, status: 'Seasonal', imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=80&h=80&fit=crop', ordersThisMonth: 198, ordersLastMonth: 42, revenue: 17820, rating: 4.5, reviewCount: 88, rank: 7, tags: ['Seasonal', 'Summer Special'], branch: ['Main Branch', 'City Center', 'Airport Road'] },
  { id: 'm8', name: 'Fish Curry', category: 'Main Course', diet: 'Non-Veg', price: 380, costPrice: 140, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=80&h=80&fit=crop', ordersThisMonth: 98, ordersLastMonth: 88, revenue: 37240, rating: 4.4, reviewCount: 55, rank: 8, tags: ['Coastal Special'], branch: ['Main Branch', 'Highway Hub'] },
  { id: 'm9', name: 'Veg Thali', category: 'Main Course', diet: 'Veg', price: 220, costPrice: 75, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop', ordersThisMonth: 142, ordersLastMonth: 138, revenue: 31240, rating: 4.3, reviewCount: 71, rank: 9, tags: ['Value Meal', 'Complete Meal'], branch: ['Main Branch', 'City Center', 'Airport Road', 'Highway Hub'] },
  { id: 'm10', name: 'Gulab Jamun', category: 'Desserts', diet: 'Veg', price: 120, costPrice: 35, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?w=80&h=80&fit=crop', ordersThisMonth: 178, ordersLastMonth: 155, revenue: 21360, rating: 4.6, reviewCount: 92, rank: 10, tags: ['Dessert Classic'], branch: ['Main Branch', 'City Center', 'Airport Road', 'Highway Hub'] },
  { id: 'm11', name: 'Prawn Masala', category: 'Main Course', diet: 'Non-Veg', price: 450, costPrice: 180, status: 'Out of Stock', imageUrl: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=80&h=80&fit=crop', ordersThisMonth: 0, ordersLastMonth: 72, revenue: 0, rating: 4.7, reviewCount: 44, rank: 11, tags: ['Premium', 'Seafood'], branch: ['Main Branch', 'Highway Hub'] },
  { id: 'm12', name: 'Chole Bhature', category: 'Main Course', diet: 'Veg', price: 160, costPrice: 50, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=80&h=80&fit=crop', ordersThisMonth: 134, ordersLastMonth: 119, revenue: 21440, rating: 4.4, reviewCount: 63, rank: 12, tags: ['North Indian', 'Popular'], branch: ['Main Branch', 'City Center', 'Airport Road'] },
];

const STORAGE_KEY = 'crm_menu_items_v1';
function loadItems(): MenuItem[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ITEMS));
  return SEED_ITEMS;
}
function saveItems(items: MenuItem[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

const DIET_COLOR: Record<DietType, string> = {
  'Veg': 'bg-emerald-100 text-emerald-800',
  'Non-Veg': 'bg-rose-100 text-rose-800',
  'Vegan': 'bg-green-100 text-green-800',
};
const STATUS_COLOR: Record<ItemStatus, string> = {
  'Available': 'bg-emerald-100 text-emerald-800',
  'Out of Stock': 'bg-rose-100 text-rose-800',
  'Seasonal': 'bg-amber-100 text-amber-800',
};

interface MenuPerformanceViewProps { orgId?: string; }

export const MenuPerformanceView: React.FC<MenuPerformanceViewProps> = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MenuCategory | 'ALL'>('ALL');
  const [dietFilter, setDietFilter] = useState<DietType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'rating' | 'rank'>('revenue');
  const [view, setView] = useState<'table' | 'grid' | 'analytics'>('table');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  useEffect(() => { setItems(loadItems()); }, []);

  const categories = Array.from(new Set(SEED_ITEMS.map(i => i.category)));

  const filtered = items
    .filter(i => {
      const q = search.toLowerCase();
      return (!q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))) &&
        (categoryFilter === 'ALL' || i.category === categoryFilter) &&
        (dietFilter === 'ALL' || i.diet === dietFilter) &&
        (statusFilter === 'ALL' || i.status === statusFilter);
    })
    .sort((a, b) => {
      if (sortBy === 'revenue') return b.revenue - a.revenue;
      if (sortBy === 'orders') return b.ordersThisMonth - a.ordersThisMonth;
      if (sortBy === 'rating') return b.rating - a.rating;
      return a.rank - b.rank;
    });

  const toggleStatus = (id: string, status: ItemStatus) => {
    setItems(prev => { const u = prev.map(i => i.id === id ? { ...i, status } : i); saveItems(u); return u; });
    setEditingStatus(null);
  };

  const totalRevenue = items.reduce((s, i) => s + i.revenue, 0);
  const totalOrders = items.reduce((s, i) => s + i.ordersThisMonth, 0);
  const avgRating = items.length > 0 ? (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1) : '0';
  const outOfStock = items.filter(i => i.status === 'Out of Stock').length;
  const topItem = [...items].sort((a, b) => b.revenue - a.revenue)[0];

  const exportCSV = () => {
    const rows = [
      ['Name', 'Category', 'Diet', 'Price', 'Cost', 'Margin%', 'Orders (Month)', 'Revenue', 'Rating', 'Status'],
      ...filtered.map(i => [i.name, i.category, i.diet, i.price, i.costPrice, Math.round(((i.price - i.costPrice) / i.price) * 100), i.ordersThisMonth, i.revenue, i.rating, i.status])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `menu_performance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Category breakdown for analytics
  const categoryStats = categories.map(cat => ({
    cat,
    items: items.filter(i => i.category === cat).length,
    revenue: items.filter(i => i.category === cat).reduce((s, i) => s + i.revenue, 0),
    orders: items.filter(i => i.category === cat).reduce((s, i) => s + i.ordersThisMonth, 0),
  })).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1F313D]">Menu Performance</h1>
          <p className="text-sm text-[#7A7268] mt-0.5">Track menu item sales, revenue, and customer ratings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Menu Items', value: items.length.toString(), icon: UtensilsCrossed, color: 'text-[#1F313D]', bg: 'bg-[#1F313D]/10' },
          { label: 'Monthly Revenue', value: `₹${(totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-[#79415A]', bg: 'bg-[#79415A]/10' },
          { label: 'Total Orders', value: totalOrders.toString(), icon: Package, color: 'text-indigo-700', bg: 'bg-indigo-100' },
          { label: 'Avg Rating', value: `${avgRating} ★`, icon: Star, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Out of Stock', value: outOfStock.toString(), icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-100' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E5DDD2] shadow-xs">
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className="text-lg font-black text-[#1F313D]">{k.value}</div>
              <div className="text-[11px] text-[#7A7268]">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Top Performer Banner */}
      {topItem && (
        <div className="bg-[#1F313D] text-white rounded-[24px] p-5 flex flex-wrap items-center gap-4">
          <img src={topItem.imageUrl} alt={topItem.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold bg-amber-400 text-black px-2 py-0.5 rounded-full">🏆 Top Performer</span>
            </div>
            <h3 className="font-serif font-bold text-base">{topItem.name}</h3>
            <p className="text-xs text-[#E5C9B3]/80">{topItem.category} · {topItem.ordersThisMonth} orders this month</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-black">₹{topItem.revenue.toLocaleString()}</div>
            <div className="text-xs text-[#E5C9B3]/80">Monthly Revenue</div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {(['table', 'grid', 'analytics'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${view === v ? 'bg-[#79415A] text-white' : 'bg-[#EFE9DF] text-[#5C5549] hover:bg-[#E5DDD2]'}`}>
            {v === 'table' ? '📋 Table View' : v === 'grid' ? '🧱 Grid View' : '📊 Category Analytics'}
          </button>
        ))}
      </div>

      {view === 'analytics' ? (
        /* ── Analytics ── */
        <div className="space-y-6">
          <div className="bg-[#FAF7F2] rounded-[24px] p-6 border border-[#E5DDD2]">
            <h3 className="font-serif font-bold text-base text-[#1F313D] mb-4">Revenue by Category</h3>
            <div className="space-y-3">
              {categoryStats.map(c => {
                const pct = totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0;
                return (
                  <div key={c.cat}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#1F313D]">{c.cat}</span>
                      <div className="flex items-center gap-4 text-[#7A7268]">
                        <span>{c.items} items</span>
                        <span>{c.orders} orders</span>
                        <span className="text-[#1F313D] font-black">₹{c.revenue.toLocaleString()} ({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-[#EAE4D9] rounded-full overflow-hidden">
                      <div className="h-full bg-[#79415A] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Margin Analysis */}
          <div className="bg-[#FAF7F2] rounded-[24px] p-6 border border-[#E5DDD2]">
            <h3 className="font-serif font-bold text-base text-[#1F313D] mb-4">Profit Margin Analysis (Top 8)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...items].sort((a, b) => ((b.price - b.costPrice) / b.price) - ((a.price - a.costPrice) / a.price)).slice(0, 8).map(item => {
                const margin = Math.round(((item.price - item.costPrice) / item.price) * 100);
                return (
                  <div key={item.id} className="p-3 bg-[#EFE9DF] rounded-2xl">
                    <div className="text-xs font-bold text-[#1F313D] truncate">{item.name}</div>
                    <div className={`text-lg font-black mt-1 ${margin >= 65 ? 'text-emerald-700' : margin >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{margin}%</div>
                    <div className="text-[11px] text-[#7A7268]">₹{item.price - item.costPrice} margin</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ── Table / Grid ── */
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7268]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search menu items…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#79415A]/30" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
              <option value="ALL">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={dietFilter} onChange={e => setDietFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
              <option value="ALL">All Diet Types</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Vegan">Vegan</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Seasonal">Seasonal</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
              <option value="revenue">Sort: Revenue</option>
              <option value="orders">Sort: Orders</option>
              <option value="rating">Sort: Rating</option>
              <option value="rank">Sort: Rank</option>
            </select>
          </div>

          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(item => {
                const margin = Math.round(((item.price - item.costPrice) / item.price) * 100);
                const growth = item.ordersLastMonth > 0 ? Math.round(((item.ordersThisMonth - item.ordersLastMonth) / item.ordersLastMonth) * 100) : 0;
                return (
                  <div key={item.id} className="bg-[#FAF7F2] rounded-2xl border border-[#E5DDD2] overflow-hidden hover:shadow-md transition">
                    <div className="relative">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-36 object-cover" />
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {item.tags.slice(0, 1).map(t => (
                          <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1F313D]/80 text-white">{t}</span>
                        ))}
                      </div>
                      <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[item.status]}`}>{item.status}</span>
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-xs font-bold text-[#1F313D]">{item.name}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${DIET_COLOR[item.diet]}`}>{item.diet === 'Veg' ? '🟢' : '🔴'}</span>
                      </div>
                      <p className="text-[11px] text-[#7A7268] mb-2">{item.category}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-[#79415A]">₹{item.price}</span>
                        <div className="flex items-center gap-0.5 text-amber-600">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span className="font-bold">{item.rating}</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#DDD5C7] flex items-center justify-between text-[11px]">
                        <span className="text-[#5C5549]">{item.ordersThisMonth} orders</span>
                        <span className={`font-bold flex items-center gap-0.5 ${growth >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {growth >= 0 ? '+' : ''}{growth}%
                        </span>
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        <button onClick={() => setSelectedItem(item)}
                          className="flex-1 py-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition">
                          View
                        </button>
                        <select value={item.status} onChange={e => toggleStatus(item.id, e.target.value as ItemStatus)}
                          className="flex-1 py-1.5 rounded-lg border border-[#DDD5C7] bg-white text-[10px] font-semibold text-[#1F313D] focus:outline-none">
                          <option value="Available">Available</option>
                          <option value="Out of Stock">Out of Stock</option>
                          <option value="Seasonal">Seasonal</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#DDD5C7] bg-[#EFE9DF]">
                      <th className="text-left px-4 py-3 font-bold text-[#5C5549]">Rank</th>
                      <th className="text-left px-4 py-3 font-bold text-[#5C5549]">Item</th>
                      <th className="text-left px-4 py-3 font-bold text-[#5C5549]">Category</th>
                      <th className="text-right px-4 py-3 font-bold text-[#5C5549]">Price</th>
                      <th className="text-right px-4 py-3 font-bold text-[#5C5549]">Margin</th>
                      <th className="text-right px-4 py-3 font-bold text-[#5C5549]">Orders</th>
                      <th className="text-right px-4 py-3 font-bold text-[#5C5549]">Revenue</th>
                      <th className="text-center px-4 py-3 font-bold text-[#5C5549]">Rating</th>
                      <th className="text-center px-4 py-3 font-bold text-[#5C5549]">Trend</th>
                      <th className="text-center px-4 py-3 font-bold text-[#5C5549]">Status</th>
                      <th className="text-center px-4 py-3 font-bold text-[#5C5549]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE4D9]">
                    {filtered.map((item, idx) => {
                      const margin = Math.round(((item.price - item.costPrice) / item.price) * 100);
                      const growth = item.ordersLastMonth > 0 ? Math.round(((item.ordersThisMonth - item.ordersLastMonth) / item.ordersLastMonth) * 100) : 0;
                      return (
                        <tr key={item.id} className="hover:bg-[#EFE9DF]/50 transition">
                          <td className="px-4 py-3">
                            <span className="w-6 h-6 rounded-full bg-[#1F313D]/10 flex items-center justify-center font-mono font-bold text-[#1F313D]">{idx + 1}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-xl object-cover" />
                              <div>
                                <div className="font-bold text-[#1F313D]">{item.name}</div>
                                <div className="flex gap-1 mt-0.5">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${DIET_COLOR[item.diet]}`}>{item.diet}</span>
                                  {item.tags.slice(0, 1).map(t => <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#EFE9DF] text-[#5C5549]">{t}</span>)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#5C5549]">{item.category}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#1F313D]">₹{item.price}</td>
                          <td className={`px-4 py-3 text-right font-bold ${margin >= 65 ? 'text-emerald-700' : margin >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{margin}%</td>
                          <td className="px-4 py-3 text-right font-semibold text-[#1F313D]">{item.ordersThisMonth.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#1F313D]">₹{item.revenue.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="flex items-center justify-center gap-0.5 text-amber-600 font-bold">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />{item.rating}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`flex items-center justify-center gap-0.5 font-bold ${growth >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {growth >= 0 ? '+' : ''}{growth}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <select value={item.status} onChange={e => toggleStatus(item.id, e.target.value as ItemStatus)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${STATUS_COLOR[item.status]}`}>
                              <option value="Available">Available</option>
                              <option value="Out of Stock">Out of Stock</option>
                              <option value="Seasonal">Seasonal</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => setSelectedItem(item)}
                              className="px-2.5 py-1 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-[#1F313D] font-bold transition flex items-center gap-1 mx-auto">
                              <Eye className="w-3 h-3" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-16">
                    <UtensilsCrossed className="w-10 h-10 text-[#DDD5C7] mx-auto mb-3" />
                    <p className="text-sm font-bold text-[#5C5549]">No menu items found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-48 object-cover" />
              <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition">✕</button>
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[selectedItem.status]}`}>{selectedItem.status}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIET_COLOR[selectedItem.diet]}`}>{selectedItem.diet}</span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1F313D]">{selectedItem.name}</h3>
                  <p className="text-xs text-[#7A7268]">{selectedItem.category}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-[#79415A]">₹{selectedItem.price}</div>
                  <div className="text-xs text-[#7A7268]">Cost: ₹{selectedItem.costPrice}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#EFE9DF] rounded-xl text-center">
                  <div className="text-sm font-black text-[#1F313D]">{selectedItem.ordersThisMonth}</div>
                  <div className="text-[10px] text-[#7A7268]">Orders / Month</div>
                </div>
                <div className="p-3 bg-[#EFE9DF] rounded-xl text-center">
                  <div className="text-sm font-black text-[#79415A]">₹{(selectedItem.revenue / 1000).toFixed(1)}K</div>
                  <div className="text-[10px] text-[#7A7268]">Monthly Revenue</div>
                </div>
                <div className="p-3 bg-[#EFE9DF] rounded-xl text-center">
                  <div className="text-sm font-black text-amber-600 flex items-center justify-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />{selectedItem.rating}
                  </div>
                  <div className="text-[10px] text-[#7A7268]">{selectedItem.reviewCount} reviews</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedItem.tags.map(t => (
                  <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFE9DF] text-[#5C5549]">{t}</span>
                ))}
              </div>
              <div>
                <div className="text-[11px] text-[#7A7268] mb-1 font-medium">Available at Branches</div>
                <div className="flex flex-wrap gap-1">
                  {selectedItem.branch.map(b => <span key={b} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1F313D]/10 text-[#1F313D]">{b}</span>)}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { toggleStatus(selectedItem.id, selectedItem.status === 'Available' ? 'Out of Stock' : 'Available'); setSelectedItem(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition">
                  {selectedItem.status === 'Available' ? 'Mark Out of Stock' : 'Mark Available'}
                </button>
                <button onClick={() => setSelectedItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
