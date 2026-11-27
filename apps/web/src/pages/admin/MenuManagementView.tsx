import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UtensilsCrossed, Search, Filter, Plus, Edit2, Trash2, Archive,
  Star, TrendingUp, TrendingDown, Clock, Download, Upload, Eye,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, ChevronRight,
  DollarSign, Sparkles, Tag, ShieldCheck, History, Calendar,
  SlidersHorizontal, ChefHat, Check, X, Layers, Image as ImageIcon,
  Flame, Info
} from 'lucide-react';
import {
  MenuItem, MenuCategoryRecord, DietType, ItemAvailability, Allergen,
  ItemVariant, ItemAddon, BranchPrice, MenuSchedule, ItemTag, MenuChangeLog,
  loadMenuItems, saveMenuItem, archiveMenuItem, restoreMenuItem, deleteMenuItem,
  loadMenuCategories, saveCategory, deleteCategory, loadMenuAuditLogs,
  getMenuMetrics, exportMenuToCSV, importMenuFromCSV
} from '../../lib/menuManagementApi';

interface MenuManagementViewProps {
  orgId?: string;
  userRole?: string; // 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STAFF'
}

const ALLERGEN_OPTIONS: Allergen[] = [
  'Dairy', 'Nuts', 'Gluten', 'Soy', 'Eggs', 'Shellfish', 'Fish', 'Peanuts', 'Sesame', 'Mustard'
];

const DIET_COLORS: Record<DietType, { label: string; bg: string; text: string; icon: string }> = {
  Veg: { label: 'Vegetarian', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: '🟢' },
  'Non-Veg': { label: 'Non-Vegetarian', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: '🔴' },
  Vegan: { label: 'Vegan', bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: '🌱' },
};

const STATUS_BADGES: Record<ItemAvailability, { label: string; bg: string; text: string; dot: string }> = {
  Available: { label: 'Available', bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  Unavailable: { label: 'Unavailable', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  'Out of Stock': { label: 'Out of Stock', bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500 animate-pulse' },
};

export const MenuManagementView: React.FC<MenuManagementViewProps> = ({ userRole = 'RESTAURANT_ADMIN' }) => {
  const isReadOnly = userRole === 'STAFF';

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategoryRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<MenuChangeLog[]>([]);
  const [metrics, setMetrics] = useState(getMenuMetrics());

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'categories' | 'analytics' | 'schedule' | 'audit'>('catalog');
  const [viewStyle, setViewStyle] = useState<'grid' | 'table'>('grid');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dietFilter, setDietFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'orders' | 'revenue' | 'rating'>('orders');

  // Modals & Panels
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    itemCode: '',
    category: 'Main Course',
    description: '',
    imageUrl: '',
    diet: 'Veg',
    basePrice: 0,
    costPrice: 0,
    status: 'Available',
    allergens: [],
    variants: [],
    addons: [],
    branchPricing: [],
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '11:00', endTime: '23:00', isActive: true },
    tags: []
  });

  // Variant/Addon input helpers inside modal
  const [tempVariantName, setTempVariantName] = useState('');
  const [tempVariantPrice, setTempVariantPrice] = useState<number>(0);
  const [tempAddonName, setTempAddonName] = useState('');
  const [tempAddonPrice, setTempAddonPrice] = useState<number>(0);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // CSV Import State
  const [importCsvText, setImportCsvText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ imported: number; updated: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    setItems(loadMenuItems());
    setCategories(loadMenuCategories());
    setAuditLogs(loadMenuAuditLogs());
    setMetrics(getMenuMetrics());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!showArchived && item.isArchived) return false;
      if (showArchived && !item.isArchived) return false;

      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchDiet = dietFilter === 'ALL' || item.diet === dietFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchTag = tagFilter === 'ALL' || item.tags.includes(tagFilter as ItemTag);

      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      return matchCategory && matchDiet && matchStatus && matchTag && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return b.basePrice - a.basePrice;
      if (sortBy === 'orders') return b.ordersCount - a.ordersCount;
      if (sortBy === 'revenue') return b.revenue - a.revenue;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [items, showArchived, selectedCategory, dietFilter, statusFilter, tagFilter, searchQuery, sortBy]);

  // Open Form for Create
  const handleOpenCreate = () => {
    const nextCodeNum = items.length + 101;
    setFormData({
      name: '',
      itemCode: `MN-${nextCodeNum}`,
      category: categories[0]?.name || 'Main Course',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop',
      diet: 'Veg',
      basePrice: 200,
      costPrice: 70,
      status: 'Available',
      allergens: [],
      variants: [{ id: `v-${Date.now()}`, name: 'Regular', price: 200, isDefault: true }],
      addons: [],
      branchPricing: [
        { branchId: 'b1', branchName: 'Downtown Flagship', price: 200, isAvailable: true },
        { branchId: 'b2', branchName: 'Airport Express', price: 240, isAvailable: true }
      ],
      schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '11:00', endTime: '23:00', isActive: true },
      tags: ['New']
    });
    setTempVariantName('');
    setTempVariantPrice(0);
    setTempAddonName('');
    setTempAddonPrice(0);
    setIsFormModalOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (item: MenuItem) => {
    setFormData({ ...item });
    setTempVariantName('');
    setTempVariantPrice(0);
    setTempAddonName('');
    setTempAddonPrice(0);
    setIsFormModalOpen(true);
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Item name is required');
      return;
    }
    try {
      saveMenuItem(formData as any, 'Admin', userRole);
      setIsFormModalOpen(false);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to save menu item');
    }
  };

  // Archive / Restore Item
  const handleToggleArchive = (item: MenuItem) => {
    try {
      if (item.isArchived) {
        restoreMenuItem(item.id, 'Admin', userRole);
      } else {
        archiveMenuItem(item.id, 'Admin', userRole);
      }
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Permanent Delete
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    try {
      deleteMenuItem(itemToDelete.id, 'Admin', userRole);
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Stock Status Switcher
  const handleQuickStatusChange = (item: MenuItem, newStatus: ItemAvailability) => {
    try {
      saveMenuItem({ ...item, status: newStatus }, 'Admin', userRole);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Category Actions
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      saveCategory(newCatName.trim(), newCatDesc.trim());
      setNewCatName('');
      setNewCatDesc('');
      setIsCategoryModalOpen(false);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = (catId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      deleteCategory(catId);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // CSV Import execution
  const handleExecuteImport = () => {
    if (!importCsvText.trim()) return;
    try {
      const res = importMenuFromCSV(importCsvText, 'Admin');
      setImportFeedback(res);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to parse CSV');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setImportCsvText(ev.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#79415A]/10 text-[#79415A]">
              <UtensilsCrossed className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#1F313D]">Menu Management</h1>
          </div>
          <p className="text-xs text-[#7A7268] mt-1">
            Configure food items, variants, add-ons, branch prices, allergen warnings, schedule timings, and sales performance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportMenuToCSV(items.filter(i => !i.isArchived))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition border border-[#DDD5C7]"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          {!isReadOnly && (
            <>
              <button
                onClick={() => {
                  setImportFeedback(null);
                  setImportCsvText('');
                  setIsImportModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition border border-[#DDD5C7]"
              >
                <Upload className="w-3.5 h-3.5" />
                Import CSV
              </button>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add Menu Item
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
          <div className="text-[11px] font-semibold text-[#7A7268]">Active Items</div>
          <div className="text-2xl font-black text-[#1F313D] mt-1">{metrics.totalItems}</div>
          <div className="text-[10px] text-[#79415A] mt-1 font-medium">{metrics.totalCategories} Categories</div>
        </div>
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-800">Available Now</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.availableItems}</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">Ready to Order</div>
        </div>
        <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-800">Out of Stock</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{metrics.outOfStockItems}</div>
          <div className="text-[10px] text-rose-600 mt-1 font-medium">Action Required</div>
        </div>
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-800">Popular / Bestsellers</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{metrics.popularItemsCount}</div>
          <div className="text-[10px] text-amber-600 mt-1 font-medium">High Demand</div>
        </div>
        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-800">Avg Profit Margin</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{metrics.avgProfitMargin}%</div>
          <div className="text-[10px] text-blue-600 mt-1 font-medium">Markup Index</div>
        </div>
        <div className="bg-[#1F313D] text-white p-4 rounded-2xl border border-[#1F313D] shadow-xs">
          <div className="text-[11px] font-semibold text-[#E5C9B3]">Menu Revenue</div>
          <div className="text-2xl font-black text-white mt-1">₹{(metrics.totalMenuRevenue / 1000).toFixed(0)}k</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">Cumulative POS Sales</div>
        </div>
      </div>

      {/* ── NAVIGATION TABS & CONTROLS ── */}
      <div className="bg-[#FAF7F2] p-4 rounded-[24px] border border-[#E5DDD2] space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Main Module Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EFE9DF] rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                activeTab === 'catalog' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Menu Items ({filteredItems.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                activeTab === 'categories' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                activeTab === 'analytics' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Sales Analytics (Best vs Low)
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                activeTab === 'schedule' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Timing Schedules
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                activeTab === 'audit' ? 'bg-[#79415A] text-white shadow-xs' : 'text-[#5C5549] hover:text-[#1F313D]'
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
          </div>

          {/* Quick Search & Sort */}
          {activeTab === 'catalog' && (
            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7268]" />
                <input
                  type="text"
                  placeholder="Search name, code, ingredient..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#79415A]"
                />
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-[#DDD5C7] text-xs bg-white text-[#1F313D] focus:outline-none font-medium"
              >
                <option value="orders">Sort: Most Ordered</option>
                <option value="revenue">Sort: Highest Revenue</option>
                <option value="price">Sort: Price (High-Low)</option>
                <option value="rating">Sort: Top Rated</option>
                <option value="name">Sort: Alphabetical</option>
              </select>

              <div className="flex items-center gap-1 bg-[#EFE9DF] p-1 rounded-xl">
                <button
                  onClick={() => setViewStyle('grid')}
                  className={`p-1.5 rounded-lg text-xs ${viewStyle === 'grid' ? 'bg-[#79415A] text-white' : 'text-[#5C5549]'}`}
                  title="Grid View"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewStyle('table')}
                  className={`p-1.5 rounded-lg text-xs ${viewStyle === 'table' ? 'bg-[#79415A] text-white' : 'text-[#5C5549]'}`}
                  title="Table View"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Catalog Sub-filter pills */}
        {activeTab === 'catalog' && (
          <div className="pt-2 border-t border-[#DDD5C7]/50 flex items-center justify-between gap-3 flex-wrap text-xs">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <span className="text-[#7A7268] font-bold text-[11px] shrink-0">Category:</span>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#1F313D] text-white'
                    : 'bg-white border border-[#DDD5C7] text-[#5C5549] hover:bg-[#EFE9DF]'
                }`}
              >
                All
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
                    selectedCategory === c.name
                      ? 'bg-[#79415A] text-white font-bold'
                      : 'bg-white border border-[#DDD5C7] text-[#5C5549] hover:bg-[#EFE9DF]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Diet & Status Selectors */}
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={dietFilter}
                onChange={e => setDietFilter(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-[#DDD5C7] text-xs bg-white text-[#1F313D] focus:outline-none"
              >
                <option value="ALL">All Diets</option>
                <option value="Veg">🟢 Veg</option>
                <option value="Non-Veg">🔴 Non-Veg</option>
                <option value="Vegan">🌱 Vegan</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-[#DDD5C7] text-xs bg-white text-[#1F313D] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>

              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                  showArchived ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-[#7A7268] border-[#DDD5C7]'
                }`}
              >
                {showArchived ? 'Showing Archived' : 'Archived'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── TAB 1: MENU CATALOG ITEMS (GRID & TABLE) ── */}
      {activeTab === 'catalog' && (
        <>
          {viewStyle === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-[#FAF7F2] rounded-2xl border border-[#E5DDD2] text-[#7A7268]">
                  <UtensilsCrossed className="w-10 h-10 text-[#DDD5C7] mx-auto mb-2" />
                  <h4 className="font-bold text-sm text-[#1F313D]">No menu items found</h4>
                  <p className="text-xs text-[#7A7268] mt-1">Try resetting your category or search filter.</p>
                </div>
              ) : (
                filteredItems.map(item => {
                  const dietInfo = DIET_COLORS[item.diet];
                  const statusInfo = STATUS_BADGES[item.status];
                  const profitMargin = item.basePrice > 0 ? Math.round(((item.basePrice - item.costPrice) / item.basePrice) * 100) : 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-[24px] border border-[#E5DDD2] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                    >
                      {/* Photo & Badges */}
                      <div className="relative h-44 overflow-hidden bg-gray-100">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-xs ${dietInfo.bg} ${dietInfo.text}`}>
                            {dietInfo.icon} {item.diet}
                          </span>
                          {item.tags.slice(0, 1).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F313D]/80 text-white">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Status chip */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${statusInfo.bg} ${statusInfo.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                            {item.status}
                          </span>
                        </div>

                        {/* Item Code Overlay */}
                        <div className="absolute bottom-2 left-2.5 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
                          {item.itemCode}
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#79415A]">{item.category}</span>
                              <h3 className="font-serif font-bold text-sm text-[#1F313D] leading-snug">{item.name}</h3>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-base font-black text-[#1F313D]">₹{item.basePrice}</span>
                              <span className="block text-[9px] text-emerald-700 font-bold">+{profitMargin}% margin</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-[#7A7268] line-clamp-2 mt-1 leading-relaxed">
                            {item.description}
                          </p>

                          {/* Allergens & Variants chips */}
                          <div className="flex flex-wrap gap-1 pt-2">
                            {item.allergens.map(a => (
                              <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                ⚠ {a}
                              </span>
                            ))}
                            {item.variants.length > 1 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                {item.variants.length} Sizes
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer & Actions */}
                        <div className="pt-3 border-t border-[#EAE4D9] flex items-center justify-between text-xs">
                          <div className="text-[10px] text-[#7A7268]">
                            <strong>{item.ordersCount}</strong> sold (₹{item.revenue.toLocaleString()})
                          </div>

                          {!isReadOnly ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DDD2] text-[#1F313D]"
                                title="Edit Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleArchive(item)}
                                className={`p-1.5 rounded-lg transition ${
                                  item.isArchived ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}
                                title={item.isArchived ? 'Restore' : 'Archive'}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setItemToDelete(item);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#7A7268] italic">View Only</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Table View */
            <div className="bg-[#FAF7F2] rounded-[28px] border border-[#E5DDD2] p-5 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#DDD5C7] text-left text-[#7A7268] font-bold">
                      <th className="pb-3 pl-2">Item</th>
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Diet</th>
                      <th className="pb-3 text-right">Price</th>
                      <th className="pb-3 text-right">Cost</th>
                      <th className="pb-3 text-right">Margin</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Orders</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE4D9]">
                    {filteredItems.map(item => {
                      const dietInfo = DIET_COLORS[item.diet];
                      const statusInfo = STATUS_BADGES[item.status];
                      const margin = item.basePrice > 0 ? Math.round(((item.basePrice - item.costPrice) / item.basePrice) * 100) : 0;

                      return (
                        <tr key={item.id} className="hover:bg-white/70 transition">
                          <td className="py-3 pl-2">
                            <div className="flex items-center gap-2.5">
                              <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                              <div>
                                <span className="font-bold text-[#1F313D] block">{item.name}</span>
                                {item.allergens.length > 0 && (
                                  <span className="text-[9px] text-amber-700">Contains: {item.allergens.join(', ')}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-mono font-bold text-[#7A7268]">{item.itemCode}</td>
                          <td className="py-3 text-[#5C5549]">{item.category}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${dietInfo.bg} ${dietInfo.text}`}>
                              {dietInfo.icon} {item.diet}
                            </span>
                          </td>
                          <td className="py-3 text-right font-black text-[#1F313D]">₹{item.basePrice}</td>
                          <td className="py-3 text-right font-mono text-[#7A7268]">₹{item.costPrice}</td>
                          <td className="py-3 text-right font-bold text-emerald-700">+{margin}%</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.bg} ${statusInfo.text}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-bold text-[#1F313D]">{item.ordersCount}</td>
                          <td className="py-3 pr-2 text-right">
                            {!isReadOnly ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  className="p-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DDD2] text-[#1F313D]"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleArchive(item)}
                                  className="p-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DDD2] text-amber-700"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setItemToDelete(item);
                                    setIsDeleteConfirmOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[#7A7268]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: CATEGORY MANAGEMENT (FR-MENU-004) ── */}
      {activeTab === 'categories' && (
        <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1F313D]">Menu Categories</h3>
              <p className="text-xs text-[#7A7268]">Organize your dining catalog into logical meal courses and sections.</p>
            </div>
            {!isReadOnly && (
              <button
                onClick={() => {
                  setNewCatName('');
                  setNewCatDesc('');
                  setIsCategoryModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#79415A] text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat, idx) => {
              const count = items.filter(i => i.category.toLowerCase() === cat.name.toLowerCase() && !i.isArchived).length;
              return (
                <div key={cat.id} className="p-4 bg-white rounded-2xl border border-[#DDD5C7] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#79415A] bg-[#79415A]/10 px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-[#1F313D]">{cat.name}</h4>
                    </div>
                    <p className="text-[11px] text-[#7A7268] mt-1">{cat.description || 'No description provided'}</p>
                    <span className="text-[10px] font-bold text-[#5C5549] bg-[#EFE9DF] px-2 py-0.5 rounded-full inline-block mt-2">
                      {count} active menu items
                    </span>
                  </div>

                  {!isReadOnly && (
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: SALES ANALYTICS (FR-MENU-015, FR-MENU-016) ── */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best Sellers */}
          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1F313D] flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600" />
                  Top Best-Selling Menu Items
                </h3>
                <p className="text-xs text-[#7A7268]">Calculated from actual completed order volumes</p>
              </div>
            </div>

            <div className="space-y-3">
              {metrics.bestSellers.map((item, idx) => (
                <div key={item.id} className="p-3 bg-white rounded-2xl border border-[#DDD5C7] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center font-mono text-xs">
                      #{idx + 1}
                    </span>
                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-xs text-[#1F313D]">{item.name}</h4>
                      <span className="text-[10px] text-[#7A7268]">{item.category} · ₹{item.basePrice}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-sm text-[#1F313D]">{item.ordersCount} sold</div>
                    <div className="text-[10px] text-emerald-700 font-bold">₹{item.revenue.toLocaleString()} sales</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Performers */}
          <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1F313D] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Low-Performing / Stale Menu Items
                </h3>
                <p className="text-xs text-[#7A7268]">Lowest ordered dishes needing promotion or reformulation</p>
              </div>
            </div>

            <div className="space-y-3">
              {metrics.lowPerformers.map((item, idx) => (
                <div key={item.id} className="p-3 bg-white rounded-2xl border border-[#DDD5C7] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-xs text-[#1F313D]">{item.name}</h4>
                      <span className="text-[10px] text-[#7A7268]">{item.category} · Base ₹{item.basePrice}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-xs text-rose-700">{item.ordersCount} orders</div>
                    <div className="text-[10px] text-[#7A7268]">₹{item.revenue.toLocaleString()} revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: TIMING SCHEDULES (FR-MENU-013) ── */}
      {activeTab === 'schedule' && (
        <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1F313D]">Menu Availability Schedule</h3>
              <p className="text-xs text-[#7A7268]">Day-wise and time-slot scheduling (Breakfast, Lunch, Dinner windows)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.filter(i => !i.isArchived).map(item => (
              <div key={item.id} className="p-4 bg-white rounded-2xl border border-[#DDD5C7] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#1F313D]">{item.name}</h4>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.schedule.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                    {item.schedule.isActive ? 'Scheduled' : 'Always On'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#7A7268]">
                  <Clock className="w-3 h-3 text-[#79415A]" />
                  <span>{item.schedule.startTime} — {item.schedule.endTime}</span>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => {
                    const active = item.schedule.days.includes(d as any);
                    return (
                      <span
                        key={d}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          active ? 'bg-[#79415A] text-white' : 'bg-[#EFE9DF] text-[#7A7268]'
                        }`}
                      >
                        {d}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: AUDIT LOGS (FR-MENU-018) ── */}
      {activeTab === 'audit' && (
        <div className="bg-[#FAF7F2] p-6 rounded-[28px] border border-[#E5DDD2] shadow-xs space-y-3">
          <div>
            <h3 className="font-serif font-bold text-base text-[#1F313D]">Menu Change History & Audit Logs</h3>
            <p className="text-xs text-[#7A7268]">Full traceability of who created, edited, priced, or archived catalog items.</p>
          </div>

          <div className="divide-y divide-[#EAE4D9] bg-white rounded-2xl border border-[#DDD5C7] overflow-hidden">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1F313D]">{log.itemName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFE9DF] text-[#79415A]">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C5549]">{log.details}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#7A7268] block">By: <strong>{log.changedBy}</strong> ({log.role})</span>
                  <span className="text-[9px] text-[#7A7268]">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADD / EDIT ITEM MODAL (FR-MENU-001, FR-MENU-006, FR-MENU-010, FR-MENU-011, FR-MENU-012) ── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-[#DDD5C7] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1F313D]">
                  {formData.id ? `Edit Menu Item: ${formData.name}` : 'Add Food & Beverage Item'}
                </h3>
                <p className="text-xs text-[#7A7268]">Configure details, pricing, variants, add-ons, and availability.</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-[#7A7268] hover:text-[#1F313D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-white rounded-2xl border border-[#DDD5C7]">
                <div className="md:col-span-2">
                  <label className="font-bold text-[#1F313D] block mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Truffle Paneer Tikka"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs font-bold text-[#1F313D] focus:outline-none focus:ring-1 focus:ring-[#79415A]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Item Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="MN-101"
                    value={formData.itemCode}
                    onChange={e => setFormData({ ...formData, itemCode: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#DDD5C7] font-mono font-bold text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Category, Diet, Photo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-white rounded-2xl border border-[#DDD5C7]">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#DDD5C7] text-xs"
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Diet Classification *</label>
                  <select
                    value={formData.diet}
                    onChange={e => setFormData({ ...formData, diet: e.target.value as DietType })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#DDD5C7] text-xs"
                  >
                    <option value="Veg">🟢 Vegetarian</option>
                    <option value="Non-Veg">🔴 Non-Vegetarian</option>
                    <option value="Vegan">🌱 Vegan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Availability *</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as ItemAvailability })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#DDD5C7] text-xs"
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload & Preview (FR-MENU-005) */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7] space-y-2">
                <label className="font-bold text-[#1F313D] block">Photograph (Supabase Storage / Web URL)</label>
                <div className="flex items-center gap-3">
                  <img
                    src={formData.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100&h=100&fit=crop'}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border border-[#DDD5C7] shrink-0"
                  />
                  <input
                    type="url"
                    placeholder="Paste image URL or upload to Supabase Storage..."
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#DDD5C7] text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing & Cost */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-white rounded-2xl border border-[#DDD5C7]">
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.basePrice}
                    onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1F313D] block mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.costPrice}
                    onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <div className="text-[10px] text-[#7A7268] font-bold">Estimated Markup</div>
                  <div className="text-sm font-black text-emerald-700">
                    +{formData.basePrice && formData.basePrice > 0 ? Math.round(((formData.basePrice - (formData.costPrice || 0)) / formData.basePrice) * 100) : 0}% Margin
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7]">
                <label className="font-bold text-[#1F313D] block mb-1">Description & Culinary Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Appetizing description of ingredients and preparation method..."
                  className="w-full px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs resize-none focus:outline-none"
                />
              </div>

              {/* Allergen Information (FR-MENU-009) */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7] space-y-2">
                <label className="font-bold text-[#1F313D] block">Allergen Flags</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALLERGEN_OPTIONS.map(allergen => {
                    const isSelected = formData.allergens?.includes(allergen);
                    return (
                      <button
                        key={allergen}
                        type="button"
                        onClick={() => {
                          const current = formData.allergens || [];
                          const updated = isSelected ? current.filter(a => a !== allergen) : [...current, allergen];
                          setFormData({ ...formData, allergens: updated });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
                          isSelected
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-[#FAF7F2] text-[#7A7268] border-[#DDD5C7]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {allergen}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Variants Builder (FR-MENU-010) */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#1F313D]">Size Variants (Small, Medium, Large, Custom)</label>
                  <span className="text-[10px] text-[#7A7268]">Total: {formData.variants?.length || 0}</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Variant name (e.g. Large / Full)"
                    value={tempVariantName}
                    onChange={e => setTempVariantName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={tempVariantPrice || ''}
                    onChange={e => setTempVariantPrice(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 rounded-xl border border-[#DDD5C7] text-xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!tempVariantName.trim()) return;
                      const newVar: ItemVariant = {
                        id: `v-${Date.now()}`,
                        name: tempVariantName.trim(),
                        price: tempVariantPrice || formData.basePrice || 0
                      };
                      setFormData({ ...formData, variants: [...(formData.variants || []), newVar] });
                      setTempVariantName('');
                      setTempVariantPrice(0);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#79415A] text-white font-bold text-xs"
                  >
                    + Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.variants?.map((v, idx) => (
                    <span key={v.id} className="inline-flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DDD5C7] px-2.5 py-1 rounded-lg text-[11px]">
                      <strong>{v.name}</strong>: ₹{v.price}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(formData.variants || [])];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, variants: updated });
                        }}
                        className="text-rose-600 hover:text-rose-800 ml-1"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Add-ons Builder (FR-MENU-011) */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#1F313D]">Customization Add-ons</label>
                  <span className="text-[10px] text-[#7A7268]">Extra toppings, sauces, sides</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add-on name (e.g. Extra Cheese)"
                    value={tempAddonName}
                    onChange={e => setTempAddonName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#DDD5C7] text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={tempAddonPrice || ''}
                    onChange={e => setTempAddonPrice(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 rounded-xl border border-[#DDD5C7] text-xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!tempAddonName.trim()) return;
                      const newAddon: ItemAddon = {
                        id: `a-${Date.now()}`,
                        name: tempAddonName.trim(),
                        price: tempAddonPrice || 0
                      };
                      setFormData({ ...formData, addons: [...(formData.addons || []), newAddon] });
                      setTempAddonName('');
                      setTempAddonPrice(0);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#79415A] text-white font-bold text-xs"
                  >
                    + Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.addons?.map((a, idx) => (
                    <span key={a.id} className="inline-flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DDD5C7] px-2.5 py-1 rounded-lg text-[11px]">
                      <strong>{a.name}</strong> (+₹{a.price})
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(formData.addons || [])];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, addons: updated });
                        }}
                        className="text-rose-600 hover:text-rose-800 ml-1"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Branch-Specific Prices (FR-MENU-012) */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#DDD5C7] space-y-2">
                <label className="font-bold text-[#1F313D] block">Branch-Specific Pricing Overrides</label>
                <div className="space-y-1.5">
                  {formData.branchPricing?.map((bp, idx) => (
                    <div key={bp.branchId} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7]">
                      <span className="font-bold text-[#1F313D]">{bp.branchName}</span>
                      <div className="flex items-center gap-3">
                        <label className="text-[10px] text-[#7A7268] flex items-center gap-1">
                          Price: ₹
                          <input
                            type="number"
                            value={bp.price}
                            onChange={e => {
                              const updated = [...(formData.branchPricing || [])];
                              updated[idx].price = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, branchPricing: updated });
                            }}
                            className="w-16 px-1.5 py-0.5 rounded border border-[#DDD5C7] text-xs font-mono font-bold"
                          />
                        </label>
                        <label className="text-[10px] text-[#7A7268] flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bp.isAvailable}
                            onChange={e => {
                              const updated = [...(formData.branchPricing || [])];
                              updated[idx].isAvailable = e.target.checked;
                              setFormData({ ...formData, branchPricing: updated });
                            }}
                          />
                          Available
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white font-bold transition shadow-xs"
                >
                  {formData.id ? 'Save Item Changes' : 'Create Menu Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CATEGORY MODAL ── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-serif font-bold text-lg text-[#1F313D]">Add New Menu Category</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sizzlers & Grills"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-[#1F313D] block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Freshly seasoned cuts on hot iron plates"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#79415A] text-white font-bold hover:bg-[#68334b]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CSV IMPORT MODAL (FR-MENU-017) ── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#1F313D]">Import Menu Catalog from CSV</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-[#7A7268] hover:text-[#1F313D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[#7A7268]">
              Upload a CSV file or paste raw CSV text. Existing items with matching item codes or names will be updated; new items will be created.
            </p>

            <div className="p-3 bg-white rounded-xl border border-dashed border-[#DDD5C7] text-center cursor-pointer hover:bg-gray-50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#79415A] font-bold text-xs"
              >
                📁 Click to choose .CSV file
              </button>
            </div>

            <div>
              <label className="font-bold text-[#1F313D] block mb-1">Or Paste CSV Content:</label>
              <textarea
                rows={4}
                value={importCsvText}
                onChange={e => setImportCsvText(e.target.value)}
                placeholder="Item Code,Name,Category,Diet,Base Price,Cost Price..."
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white font-mono text-[10px] resize-none focus:outline-none"
              />
            </div>

            {importFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                <strong>Import Result:</strong> {importFeedback.imported} added, {importFeedback.updated} updated.
                {importFeedback.errors.length > 0 && (
                  <div className="text-rose-700 text-[10px] mt-1">
                    Errors: {importFeedback.errors.join('; ')}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!importCsvText.trim()}
                onClick={handleExecuteImport}
                className="flex-1 py-2.5 rounded-xl bg-[#79415A] disabled:opacity-50 text-white font-bold hover:bg-[#68334b]"
              >
                Execute Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG (FR-MENU-003) ── */}
      {isDeleteConfirmOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#DDD5C7] p-6 max-w-sm w-full shadow-2xl space-y-3 text-xs">
            <h3 className="font-serif font-bold text-base text-rose-800">
              Permanently Delete Menu Item?
            </h3>
            <p className="text-[#7A7268]">
              Are you sure you want to delete <strong>{itemToDelete.name}</strong>?
              If this item was ever ordered by customers, deletion is forbidden to preserve historical financial integrity.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] text-[#5C5549] font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-700 text-white font-bold hover:bg-rose-800"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
