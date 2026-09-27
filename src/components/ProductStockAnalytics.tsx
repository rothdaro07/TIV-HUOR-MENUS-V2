import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  DollarSign,
  Boxes,
  PieChart as PieChartIcon,
  BarChart3,
  TableProperties,
  Edit2,
  Check,
  Plus,
  Globe,
  RotateCcw,
} from 'lucide-react';
import { Product, Order, Category, ProductGroupId } from '../types';
import { EXCHANGE_RATE_KHR, PRODUCT_GROUPS, INITIAL_CATEGORIES } from '../data/initialProducts';
import { ProductCostReportModal } from './ProductCostReportModal';
import { ProductBagIllustration } from './ProductBagIllustration';

interface ProductStockAnalyticsProps {
  products: Product[];
  orders: Order[];
  categories?: Category[];
  exchangeRateKHR?: number;
  hideInventoryTable?: boolean;
  onUpdateProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onAddProductClick?: () => void;
}

export type StockHealth = 'in_stock' | 'low_stock' | 'out_of_stock';
export type StockFilterOption = 'all' | StockHealth | 'overseas_stock';

export const ProductStockAnalytics: React.FC<ProductStockAnalyticsProps> = ({
  products = [],
  orders = [],
  categories = INITIAL_CATEGORIES,
  exchangeRateKHR = EXCHANGE_RATE_KHR,
  hideInventoryTable = false,
  onUpdateProduct,
  onEditProduct,
  onAddProductClick,
}) => {
  // Search and Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<StockFilterOption>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<ProductGroupId>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'stockAsc' | 'stockDesc' | 'valDesc' | 'soldDesc' | 'name'>('stockAsc');

  // Inline quick stock edit state
  const [quickStockEditId, setQuickStockEditId] = useState<string | null>(null);
  const [quickStockValue, setQuickStockValue] = useState<string>('');

  // Active chart tab inside stock module: 'status_donut' or 'category_bar'
  const [activeChartMode, setActiveChartMode] = useState<'status_donut' | 'category_bar'>('status_donut');
  const [barGroupBy, setBarGroupBy] = useState<'group' | 'subcategory'>('group');
  const [isCostReportModalOpen, setIsCostReportModalOpen] = useState(false);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<StockHealth | null>(null);

  // Merge categories with INITIAL_CATEGORIES so all 26 subcategories are always available
  const allCategories = useMemo(() => {
    const map = new Map<string, Category>();
    INITIAL_CATEGORIES.forEach((c) => map.set(c.id, c));
    categories.forEach((c) => {
      const existing = map.get(c.id);
      map.set(c.id, { ...existing, ...c });
    });
    return Array.from(map.values());
  }, [categories]);

  // Helper to resolve a product's groupId reliably
  const getProductGroupId = (p: Product): string => {
    if (p.groupId) return p.groupId;
    const cat = allCategories.find((c) => c.id === p.category || c.nameKh === p.categoryKh);
    return cat?.groupId || 'chemical_fertilizer';
  };

  // Helper to determine stock health for any product
  const getProductHealth = (p: Product): StockHealth => {
    const qty = typeof p.stockQty === 'number' ? p.stockQty : p.inStock ? 50 : 0;
    if (p.stockStatus === 'out_of_stock' || p.inStock === false || qty <= 0) {
      return 'out_of_stock';
    }
    if (qty <= 20) {
      return 'low_stock';
    }
    return 'in_stock';
  };

  // Available sub-categories based on selectedGroupFilter
  const availableSubCategories = useMemo(() => {
    if (selectedGroupFilter === 'all') {
      return allCategories;
    }
    return allCategories.filter(
      (c) => (c.groupId || 'chemical_fertilizer') === selectedGroupFilter
    );
  }, [allCategories, selectedGroupFilter]);

  // Pre-calculate sales velocity per product from orders
  const salesMap = useMemo(() => {
    const map: Record<string, { bagsSold: number; totalRevenueUSD: number; orderCount: number }> = {};
    orders.forEach((o) => {
      if (o.status === 'cancelled') return;
      (o.items || []).forEach((it) => {
        const pId = it.product.id;
        const qty = it.quantity || 0;
        const rev = (it.unitPrice || it.product.price || 0) * qty;
        if (!map[pId]) {
          map[pId] = { bagsSold: 0, totalRevenueUSD: 0, orderCount: 0 };
        }
        map[pId].bagsSold += qty;
        map[pId].totalRevenueUSD += rev;
        map[pId].orderCount += 1;
      });
    });
    return map;
  }, [orders]);

  // Aggregate Product Stock Metrics
  const stockSummary = useMemo(() => {
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let overseasCount = 0;
    let totalStockBags = 0;
    let totalStockValueUSD = 0;

    let inStockValUSD = 0;
    let lowStockValUSD = 0;
    let outOfStockValUSD = 0;

    products.forEach((p) => {
      const health = getProductHealth(p);
      const qty = typeof p.stockQty === 'number' ? p.stockQty : p.inStock ? 50 : 0;
      const val = (p.price || 0) * qty;

      totalStockBags += qty;
      totalStockValueUSD += val;

      if (p.stockStatus === 'overseas_stock' && qty > 0) {
        overseasCount++;
      }

      if (health === 'in_stock') {
        inStockCount++;
        inStockValUSD += val;
      } else if (health === 'low_stock') {
        lowStockCount++;
        lowStockValUSD += val;
      } else {
        outOfStockCount++;
        outOfStockValUSD += val;
      }
    });

    const totalCount = products.length || 1;

    return {
      totalProducts: products.length,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      overseasCount,
      inStockPct: (inStockCount / totalCount) * 100,
      lowStockPct: (lowStockCount / totalCount) * 100,
      outOfStockPct: (outOfStockCount / totalCount) * 100,
      totalStockBags,
      totalStockValueUSD,
      totalStockValueKHR: Math.round(totalStockValueUSD * exchangeRateKHR),
      inStockValUSD,
      lowStockValUSD,
      outOfStockValUSD,
    };
  }, [products, exchangeRateKHR]);

  // Stock aggregation by Group or Sub-category for Bar Chart
  const categoryStockData = useMemo(() => {
    const map: Record<
      string,
      { labelKh: string; labelEn: string; count: number; totalBags: number; totalValUSD: number; outCount: number }
    > = {};

    products.forEach((p) => {
      const grpId = getProductGroupId(p);
      const grpObj = PRODUCT_GROUPS.find((g) => g.id === grpId);
      const catObj = allCategories.find((c) => c.id === p.category || c.nameKh === p.categoryKh);

      const key = barGroupBy === 'group' ? grpId : catObj?.id || p.category || 'other';
      const labelKh =
        barGroupBy === 'group'
          ? grpObj?.nameKh || p.groupKh || 'ជីគីមី'
          : catObj?.nameKh || p.categoryKh || 'ទូទៅ';
      const labelEn =
        barGroupBy === 'group'
          ? grpObj?.name || ''
          : catObj?.name || p.category || '';

      const qty = typeof p.stockQty === 'number' ? p.stockQty : p.inStock ? 50 : 0;
      const val = (p.price || 0) * qty;
      const isOut = getProductHealth(p) === 'out_of_stock';

      if (!map[key]) {
        map[key] = {
          labelKh,
          labelEn,
          count: 0,
          totalBags: 0,
          totalValUSD: 0,
          outCount: 0,
        };
      }
      map[key].count += 1;
      map[key].totalBags += qty;
      map[key].totalValUSD += val;
      if (isOut) map[key].outCount += 1;
    });

    return Object.values(map).sort((a, b) => b.totalBags - a.totalBags);
  }, [products, barGroupBy, allCategories]);

  // Filtered and Sorted Products List
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const health = getProductHealth(p);
        const qty = typeof p.stockQty === 'number' ? p.stockQty : p.inStock ? 50 : 0;

        if (selectedHealthFilter !== 'all') {
          if (selectedHealthFilter === 'overseas_stock') {
            if (p.stockStatus !== 'overseas_stock' || qty <= 0) return false;
          } else if (health !== selectedHealthFilter) {
            return false;
          }
        }

        // Group filter match
        if (selectedGroupFilter !== 'all') {
          const prodGroupId = getProductGroupId(p);
          if (prodGroupId !== selectedGroupFilter) {
            return false;
          }
        }

        // Sub-category filter match
        if (selectedCategoryFilter !== 'all') {
          const catObj = allCategories.find((c) => c.id === selectedCategoryFilter);
          const matchCatId = p.category === selectedCategoryFilter;
          const matchCatKh =
            p.categoryKh === selectedCategoryFilter ||
            (catObj && p.categoryKh === catObj.nameKh);
          if (!matchCatId && !matchCatKh) {
            return false;
          }
        }

        // Search query match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchKh = (p.nameKh || '').toLowerCase().includes(q);
          const matchEn = (p.name || '').toLowerCase().includes(q);
          const matchCode = (p.code || '').toLowerCase().includes(q);
          const matchNick = (p.nicknameKh || '').toLowerCase().includes(q);
          const matchCategory = (p.categoryKh || '').toLowerCase().includes(q);
          const matchGroup = (p.groupKh || '').toLowerCase().includes(q);
          const matchNpk = (p.npk || '').toLowerCase().includes(q);
          if (
            !matchKh &&
            !matchEn &&
            !matchCode &&
            !matchNick &&
            !matchCategory &&
            !matchGroup &&
            !matchNpk
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const qtyA = typeof a.stockQty === 'number' ? a.stockQty : a.inStock ? 50 : 0;
        const qtyB = typeof b.stockQty === 'number' ? b.stockQty : b.inStock ? 50 : 0;
        const valA = (a.price || 0) * qtyA;
        const valB = (b.price || 0) * qtyB;
        const soldA = salesMap[a.id]?.bagsSold || 0;
        const soldB = salesMap[b.id]?.bagsSold || 0;

        if (sortBy === 'stockAsc') return qtyA - qtyB;
        if (sortBy === 'stockDesc') return qtyB - qtyA;
        if (sortBy === 'valDesc') return valB - valA;
        if (sortBy === 'soldDesc') return soldB - soldA;
        return (a.nameKh || '').localeCompare(b.nameKh || '');
      });
  }, [
    products,
    selectedHealthFilter,
    selectedGroupFilter,
    selectedCategoryFilter,
    searchQuery,
    sortBy,
    salesMap,
    allCategories,
  ]);

  const handleSaveQuickStock = (product: Product) => {
    if (!onUpdateProduct) {
      setQuickStockEditId(null);
      return;
    }
    const parsed = parseInt(quickStockValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateProduct({
        ...product,
        stockQty: parsed,
        inStock: parsed > 0,
        stockStatus:
          parsed <= 0
            ? 'out_of_stock'
            : product.stockStatus === 'out_of_stock'
            ? 'in_stock'
            : product.stockStatus || 'in_stock',
        updatedAt: new Date().toISOString(),
      });
    }
    setQuickStockEditId(null);
  };

  // Donut SVG Math Constants
  const donutRadius = 68;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const inStockStroke = (stockSummary.inStockPct / 100) * donutCircumference;
  const lowStockStroke = (stockSummary.lowStockPct / 100) * donutCircumference;
  const outOfStockStroke = (stockSummary.outOfStockPct / 100) * donutCircumference;

  const maxCategoryBags = Math.max(...categoryStockData.map((c) => c.totalBags), 10);

  const hasActiveFilters =
    selectedGroupFilter !== 'all' ||
    selectedCategoryFilter !== 'all' ||
    selectedHealthFilter !== 'all' ||
    Boolean(searchQuery.trim());

  return (
    <div className="space-y-6 font-['Battambang']">
      {/* ========================================================================= */}
      {/* 1. TOP SUMMARY KPI CARDS (ផ្ទាំងសង្ខេបស្តុកទំនិញក្នុងឃ្លាំង)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Catalog Products */}
        <div
          onClick={() => setSelectedHealthFilter('all')}
          className={`rounded-2xl p-4 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
            selectedHealthFilter === 'all'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/15'
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 font-['Kantumruy_Pro']">
              មុខទំនិញសរុប
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1E5FA8] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-slate-900">
              {stockSummary.totalProducts}
            </div>
            <span className="text-[10px] text-slate-500 font-['Kantumruy_Pro']">
              ទាំងអស់ក្នុងប្រព័ន្ធ
            </span>
          </div>
        </div>

        {/* Card 2: Total Stock Quantity */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 font-['Kantumruy_Pro']">
              បរិមាណស្តុកសរុប
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-purple-800">
              {stockSummary.totalStockBags.toLocaleString()}{' '}
              <span className="text-xs font-sans text-slate-500">បាវ/គ្រឿង</span>
            </div>
            <span className="text-[10px] text-slate-400 font-['Kantumruy_Pro']">
              ទំនិញជាក់ស្តែងក្នុងឃ្លាំង
            </span>
          </div>
        </div>

        {/* Card 3: Total Inventory Valuation */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 font-['Kantumruy_Pro']">
              តម្លៃស្តុកសរុប (Value)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-[#1E5FA8]">
              $
              {stockSummary.totalStockValueUSD.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
            <span className="text-[10px] text-slate-400 font-mono truncate block">
              ≈ {stockSummary.totalStockValueKHR.toLocaleString()} ៛
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MASTER PRODUCT STOCK INVENTORY TABLE WITH GROUP & SUB-CATEGORY SELECTS */}
      {/* ========================================================================= */}
      {!hideInventoryTable && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-['Kantumruy_Pro']">
            {onAddProductClick && (
              <button
                type="button"
                onClick={onAddProductClick}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ បន្ថែមទំនិញថ្មី (Add Product)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCostReportModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="ទាញយករបាយការណ៍គំរូ [កូដ, ឈ្មោះ, បានលក់, ថ្លៃដើម] ជា Excel & PDF"
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>របាយការណ៍ កូដ & ថ្លៃដើម</span>
            </button>
          </div>

          {/* 🌟 SELECT FILTERS FOR VIEWING PRODUCT STOCK: SEARCH + GROUP + SUB-CATEGORY */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Search Box */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ស្វែងរកទំនិញ (Search Product)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ឈ្មោះខ្មែរ/អង់គ្លេស, កូដ, NPK..."
                    className="w-full pl-9 pr-3 py-2 bg-white text-xs sm:text-sm font-['Battambang'] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#1E5FA8] transition-all"
                  />
                </div>
              </div>

              {/* 2. Group Select Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ក្រុមទំនិញធំ (Select Group)
                </label>
                <select
                  value={selectedGroupFilter}
                  onChange={(e) => {
                    setSelectedGroupFilter(e.target.value as ProductGroupId);
                    setSelectedCategoryFilter('all');
                  }}
                  className="w-full px-3 py-2 bg-white text-xs sm:text-sm font-['Battambang'] font-semibold text-slate-800 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#1E5FA8] cursor-pointer"
                >
                  <option value="all">គ្រប់ក្រុមទំនិញទាំង ៧ (All Groups - {products.length})</option>
                  {PRODUCT_GROUPS.map((grp) => {
                    const count = products.filter((p) => getProductGroupId(p) === grp.id).length;
                    return (
                      <option key={grp.id} value={grp.id}>
                        {grp.nameKh} ({grp.name.replace('Agricultural ', '')}) [{count}]
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 3. Sub-category Select Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ប្រភេទទំនិញរង (Select Sub-category)
                </label>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-xs sm:text-sm font-['Battambang'] font-semibold text-slate-800 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#1E5FA8] cursor-pointer"
                >
                  <option value="all">
                    {selectedGroupFilter === 'all'
                      ? `គ្រប់ប្រភេទរងទាំងអស់ (All Sub-categories)`
                      : `គ្រប់ប្រភេទរងក្នុងក្រុមនេះ (${availableSubCategories.length})`}
                  </option>
                  {availableSubCategories.map((cat) => {
                    const count = products.filter(
                      (p) => p.category === cat.id || p.categoryKh === cat.nameKh
                    ).length;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameKh} ({cat.name}) [{count}]
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

          {/* Quick Group Filter Pills for 1-click switching */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedGroupFilter('all');
                  setSelectedCategoryFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedGroupFilter === 'all'
                    ? 'bg-[#1E5FA8] text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ទាំងអស់ ({products.length})
              </button>
              {PRODUCT_GROUPS.map((grp) => {
                const isActive = selectedGroupFilter === grp.id;
                const count = products.filter((p) => getProductGroupId(p) === grp.id).length;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupFilter(grp.id);
                      setSelectedCategoryFilter('all');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#1E5FA8] text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {grp.nameKh} ({count})
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGroupFilter('all');
                  setSelectedCategoryFilter('all');
                  setSelectedHealthFilter('all');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>សម្អាតតម្រង (Reset)</span>
              </button>
            )}
          </div>
        </div>

        {/* Products Stock Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-3 w-10 text-center">ល.រ</th>
                <th className="py-3 px-3 min-w-[230px]">មុខទំនិញ (Product)</th>
                <th className="py-3 px-3 min-w-[175px]">ក្រុមទំនិញ / ប្រភេទរង (Group & Sub-category)</th>
                <th className="py-3 px-3 text-right">តម្លៃរាយ ($)</th>
                <th className="py-3 px-3 text-center">ចំនួនក្នុងស្តុក (Stock)</th>
                <th className="py-3 px-3 text-center">ស្ថានភាពស្តុក</th>
                <th className="py-3 px-3 text-right">តម្លៃស្តុកសរុប ($)</th>
                <th className="py-3 px-3 text-center">លក់បាន</th>
                {(onEditProduct || onUpdateProduct) && (
                  <th className="py-3 px-3 text-right">សកម្មភាព</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-['Kantumruy_Pro']">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span className="text-sm font-['Battambang'] block">
                      មិនមានទំនិញត្រូវនឹងលក្ខខណ្ឌជ្រើសរើសនេះទេ
                    </span>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const health = getProductHealth(p);
                  const qty = typeof p.stockQty === 'number' ? p.stockQty : p.inStock ? 50 : 0;
                  const valUSD = (p.price || 0) * qty;
                  const sales = salesMap[p.id] || { bagsSold: 0 };
                  const prodGroupId = getProductGroupId(p);
                  const grpObj = PRODUCT_GROUPS.find((g) => g.id === prodGroupId);
                  const catObj = allCategories.find(
                    (c) => c.id === p.category || c.nameKh === p.categoryKh
                  );
                  const unit =
                    p.stockUnit || (prodGroupId === 'machinery' ? 'គ្រឿង' : 'បាវ');
                  const isEditingStock = quickStockEditId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* No. */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
                            <ProductBagIllustration
                              product={p}
                              size="sm"
                              showGranulesBadge={false}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 font-['Battambang'] truncate max-w-[200px]">
                              {p.nameKh}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                              {p.code ? `[#${p.code}] ` : ''}
                              {p.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Group & Sub-category */}
                      <td className="py-3 px-3">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#1E5FA8] text-[11px] font-bold font-['Battambang']">
                          {grpObj?.nameKh || p.groupKh || 'ជីគីមី'}
                        </div>
                        <div className="text-xs text-slate-700 font-['Battambang'] mt-0.5 truncate max-w-[180px]">
                          ↳ {catObj?.nameKh || p.categoryKh}
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        ${p.price.toFixed(2)}
                      </td>

                      {/* Stock Quantity (with quick inline edit) */}
                      <td className="py-3 px-3 text-center">
                        {isEditingStock ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={quickStockValue}
                              onChange={(e) => setQuickStockValue(e.target.value)}
                              className="w-16 px-2 py-1 bg-white border border-[#1E5FA8] rounded-lg text-xs font-mono font-bold text-center outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveQuickStock(p);
                                if (e.key === 'Escape') setQuickStockEditId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveQuickStock(p)}
                              className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer"
                              title="រក្សាទុកចំនួនស្តុក"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateProduct) {
                                setQuickStockEditId(p.id);
                                setQuickStockValue(String(qty));
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                              onUpdateProduct ? 'hover:bg-slate-100 cursor-pointer' : ''
                            }`}
                            title={onUpdateProduct ? 'ចុចដើម្បីកែចំនួនស្តុកភ្លាមៗ' : ''}
                          >
                            <span
                              className={`font-mono font-bold text-sm ${
                                health === 'in_stock'
                                  ? 'text-emerald-700'
                                  : health === 'low_stock'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {qty.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400">{unit}</span>
                          </button>
                        )}
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3 px-3 text-center">
                        {p.stockStatus === 'overseas_stock' && qty > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            <Globe className="w-3 h-3" />
                            <span>ស្តុកក្រៅប្រទេស</span>
                          </span>
                        ) : health === 'in_stock' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>មានស្តុក</span>
                          </span>
                        ) : health === 'low_stock' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>ជិតអស់ ({qty})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" />
                            <span>ដាច់ស្តុក</span>
                          </span>
                        )}
                      </td>

                      {/* Stock Total Value */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ${valUSD.toFixed(2)}
                      </td>

                      {/* Quantity Sold */}
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="text-slate-700 font-bold">{sales.bagsSold}</span>{' '}
                        <span className="text-[10px] text-slate-400">{unit}</span>
                      </td>

                      {/* Actions */}
                      {(onEditProduct || onUpdateProduct) && (
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {onUpdateProduct && !isEditingStock && (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickStockEditId(p.id);
                                  setQuickStockValue(String(qty));
                                }}
                                className="px-2 py-1 text-[11px] font-bold text-[#1E5FA8] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                title="កែចំនួនស្តុករហ័ស"
                              >
                                កែស្តុក
                              </button>
                            )}
                            {onEditProduct && (
                              <button
                                type="button"
                                onClick={() => onEditProduct(p)}
                                className="p-1.5 text-slate-500 hover:text-[#1E5FA8] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="កែប្រែព័ត៌មានទំនិញ & តារាងលក្ខណៈ"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Product Cost Report Modal */}
      <ProductCostReportModal
        isOpen={isCostReportModalOpen}
        onClose={() => setIsCostReportModalOpen(false)}
        products={products}
        orders={orders}
      />
    </div>
  );
};
