import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  DollarSign,
  Layers,
  ArrowUpDown,
  Boxes,
  ShoppingBag,
  Info,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  TableProperties
} from 'lucide-react';
import { Product, Order } from '../types';
import { EXCHANGE_RATE_KHR } from '../data/initialProducts';
import { ProductCostReportModal } from './ProductCostReportModal';

interface ProductStockAnalyticsProps {
  products: Product[];
  orders: Order[];
  exchangeRateKHR?: number;
}

export type StockHealth = 'in_stock' | 'low_stock' | 'out_of_stock';

export const ProductStockAnalytics: React.FC<ProductStockAnalyticsProps> = ({
  products = [],
  orders = [],
  exchangeRateKHR = EXCHANGE_RATE_KHR,
}) => {
  // Search and Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<'all' | StockHealth>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'stockAsc' | 'stockDesc' | 'valDesc' | 'soldDesc' | 'name'>('stockAsc');
  
  // Active chart tab inside stock module: 'status_donut' or 'category_bar'
  const [activeChartMode, setActiveChartMode] = useState<'status_donut' | 'category_bar'>('status_donut');
  const [isCostReportModalOpen, setIsCostReportModalOpen] = useState(false);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<StockHealth | null>(null);

  // Helper to determine stock health for any product
  const getProductHealth = (p: Product): StockHealth => {
    const qty = typeof p.stockQty === 'number' ? p.stockQty : (p.inStock ? 50 : 0);
    if (p.stockStatus === 'out_of_stock' || p.inStock === false || qty <= 0) {
      return 'out_of_stock';
    }
    if (qty <= 20) {
      return 'low_stock';
    }
    return 'in_stock';
  };

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
    let totalStockBags = 0;
    let totalStockValueUSD = 0;

    let inStockValUSD = 0;
    let lowStockValUSD = 0;
    let outOfStockValUSD = 0;

    products.forEach((p) => {
      const health = getProductHealth(p);
      const qty = typeof p.stockQty === 'number' ? p.stockQty : (p.inStock ? 50 : 0);
      const val = (p.price || 0) * qty;

      totalStockBags += qty;
      totalStockValueUSD += val;

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

  // Stock aggregation by Category / Group
  const categoryStockData = useMemo(() => {
    const map: Record<
      string,
      { labelKh: string; count: number; totalBags: number; totalValUSD: number; outCount: number }
    > = {};

    products.forEach((p) => {
      const catKey = p.categoryKh || p.category || 'ទូទៅ';
      const qty = typeof p.stockQty === 'number' ? p.stockQty : (p.inStock ? 50 : 0);
      const val = (p.price || 0) * qty;
      const isOut = getProductHealth(p) === 'out_of_stock';

      if (!map[catKey]) {
        map[catKey] = {
          labelKh: catKey,
          count: 0,
          totalBags: 0,
          totalValUSD: 0,
          outCount: 0,
        };
      }
      map[catKey].count += 1;
      map[catKey].totalBags += qty;
      map[catKey].totalValUSD += val;
      if (isOut) map[catKey].outCount += 1;
    });

    return Object.values(map).sort((a, b) => b.totalBags - a.totalBags);
  }, [products]);

  // Unique category and group filters
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryKh) set.add(p.categoryKh);
    });
    return Array.from(set);
  }, [products]);

  const groupsList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.groupKh) set.add(p.groupKh);
    });
    return Array.from(set);
  }, [products]);

  // Filtered and Sorted Products List
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const health = getProductHealth(p);
        if (selectedHealthFilter !== 'all' && health !== selectedHealthFilter) {
          return false;
        }

        if (selectedCategoryFilter !== 'all' && p.categoryKh !== selectedCategoryFilter) {
          return false;
        }

        if (selectedGroupFilter !== 'all' && p.groupKh !== selectedGroupFilter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchKh = (p.nameKh || '').toLowerCase().includes(q);
          const matchEn = (p.name || '').toLowerCase().includes(q);
          const matchNick = (p.nicknameKh || '').toLowerCase().includes(q);
          const matchCategory = (p.categoryKh || '').toLowerCase().includes(q);
          const matchNpk = (p.npk || '').toLowerCase().includes(q);
          if (!matchKh && !matchEn && !matchNick && !matchCategory && !matchNpk) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const qtyA = typeof a.stockQty === 'number' ? a.stockQty : (a.inStock ? 50 : 0);
        const qtyB = typeof b.stockQty === 'number' ? b.stockQty : (b.inStock ? 50 : 0);
        const valA = (a.price || 0) * qtyA;
        const valB = (b.price || 0) * qtyB;
        const soldA = salesMap[a.id]?.bagsSold || 0;
        const soldB = salesMap[b.id]?.bagsSold || 0;

        if (sortBy === 'stockAsc') return qtyA - qtyB; // Show lowest stock / out of stock first
        if (sortBy === 'stockDesc') return qtyB - qtyA;
        if (sortBy === 'valDesc') return valB - valA;
        if (sortBy === 'soldDesc') return soldB - soldA;
        return (a.nameKh || '').localeCompare(b.nameKh || '');
      });
  }, [
    products,
    selectedHealthFilter,
    selectedCategoryFilter,
    selectedGroupFilter,
    searchQuery,
    sortBy,
    salesMap,
  ]);

  // Donut SVG Math Constants
  const donutRadius = 68;
  const donutCircumference = 2 * Math.PI * donutRadius; // ≈ 427.25
  const inStockStroke = (stockSummary.inStockPct / 100) * donutCircumference;
  const lowStockStroke = (stockSummary.lowStockPct / 100) * donutCircumference;
  const outOfStockStroke = (stockSummary.outOfStockPct / 100) * donutCircumference;

  // Max bags in category for bar chart
  const maxCategoryBags = Math.max(...categoryStockData.map((c) => c.totalBags), 10);

  return (
    <div className="space-y-6 font-['Battambang']">
      {/* ========================================================================= */}
      {/* 1. TOP SUMMARY KPI CARDS (ផ្ទាំងសង្ខេបស្តុកទំនិញក្នុងឃ្លាំង)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Catalog Products */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 font-['Kantumruy_Pro']">
              មុខទំនិញសរុប
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E5FA8] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-slate-900">
              {stockSummary.totalProducts}
            </div>
            <span className="text-[10px] text-slate-400 font-['Kantumruy_Pro']">
              មុខទំនិញក្នុងប្រព័ន្ធ
            </span>
          </div>
        </div>

        {/* Card 2: In Stock */}
        <div
          onClick={() => setSelectedHealthFilter(selectedHealthFilter === 'in_stock' ? 'all' : 'in_stock')}
          className={`rounded-2xl p-4 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
            selectedHealthFilter === 'in_stock'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 font-['Kantumruy_Pro']">
              មានស្តុកគ្រប់គ្រាន់
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-emerald-700">
              {stockSummary.inStockCount}
            </div>
            <div className="flex items-center justify-between text-[10px] text-emerald-600 font-mono">
              <span>{stockSummary.inStockPct.toFixed(1)}%</span>
              <span>${stockSummary.inStockValUSD.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock Warning */}
        <div
          onClick={() => setSelectedHealthFilter(selectedHealthFilter === 'low_stock' ? 'all' : 'low_stock')}
          className={`rounded-2xl p-4 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
            selectedHealthFilter === 'low_stock'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 font-['Kantumruy_Pro']">
              ជិតអស់ពីស្តុក (≤20)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-amber-700">
              {stockSummary.lowStockCount}
            </div>
            <div className="flex items-center justify-between text-[10px] text-amber-600 font-mono">
              <span>{stockSummary.lowStockPct.toFixed(1)}%</span>
              <span className="text-amber-700 font-bold">គួរទិញថែម</span>
            </div>
          </div>
        </div>

        {/* Card 4: Out of Stock Alert */}
        <div
          onClick={() => setSelectedHealthFilter(selectedHealthFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
          className={`rounded-2xl p-4 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
            selectedHealthFilter === 'out_of_stock'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 font-['Kantumruy_Pro']">
              ដាច់ស្តុក / អស់ពីស្តុក
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-rose-700">
              {stockSummary.outOfStockCount}
            </div>
            <div className="flex items-center justify-between text-[10px] text-rose-600 font-mono">
              <span>{stockSummary.outOfStockPct.toFixed(1)}%</span>
              <span className="text-rose-700 font-bold">ទាមទារបញ្ជាទិញ</span>
            </div>
          </div>
        </div>

        {/* Card 5: Total Stock Quantity */}
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

        {/* Card 6: Total Inventory Valuation */}
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
              ${stockSummary.totalStockValueUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-slate-400 font-mono truncate block">
              ≈ {stockSummary.totalStockValueKHR.toLocaleString()} ៛
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VISUAL CHARTS SECTION: DONUT % OR CATEGORY BAR (ក្រាហ្វិកស្តុកទំនិញ)     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Chart View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E5FA8] flex items-center justify-center">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                ក្រាហ្វិកវិភាគស្តុកទំនិញ (Product Stock Visual Analytics)
              </h4>
              <p className="text-[11px] text-slate-500 font-['Kantumruy_Pro']">
                មើលសមាមាត្រទំនិញមានស្តុក ជិតអស់ និងដាច់ស្តុក ព្រមទាំងបរិមាណស្តុកតាមក្រុមនីមួយៗ
              </p>
            </div>
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveChartMode('status_donut')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartMode === 'status_donut'
                  ? 'bg-white text-[#1E5FA8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>សមាមាត្រស្ថានភាព (% Donut)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChartMode('category_bar')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartMode === 'category_bar'
                  ? 'bg-white text-[#1E5FA8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>ស្តុកតាមក្រុមទំនិញ (Category Bars)</span>
            </button>
          </div>
        </div>

        {/* Chart View 1: Stock Status Donut Chart */}
        {activeChartMode === 'status_donut' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-3">
            {/* SVG Donut Circle */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r={donutRadius}
                    fill="transparent"
                    stroke="#E2E8F0"
                    strokeWidth="16"
                  />

                  {/* Segment 1: In Stock (Emerald) */}
                  {stockSummary.inStockPct > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth={hoveredDonutSegment === 'in_stock' ? 20 : 16}
                      strokeDasharray={`${inStockStroke} ${donutCircumference}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutSegment('in_stock')}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                    />
                  )}

                  {/* Segment 2: Low Stock (Amber) */}
                  {stockSummary.lowStockPct > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#F59E0B"
                      strokeWidth={hoveredDonutSegment === 'low_stock' ? 20 : 16}
                      strokeDasharray={`${lowStockStroke} ${donutCircumference}`}
                      strokeDashoffset={-inStockStroke}
                      strokeLinecap="round"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutSegment('low_stock')}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                    />
                  )}

                  {/* Segment 3: Out of Stock (Rose) */}
                  {stockSummary.outOfStockPct > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#EF4444"
                      strokeWidth={hoveredDonutSegment === 'out_of_stock' ? 20 : 16}
                      strokeDasharray={`${outOfStockStroke} ${donutCircumference}`}
                      strokeDashoffset={-(inStockStroke + lowStockStroke)}
                      strokeLinecap="round"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutSegment('out_of_stock')}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                    />
                  )}
                </svg>

                {/* Center Stats Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                  {hoveredDonutSegment === 'in_stock' ? (
                    <>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                        មានស្តុកគ្រប់គ្រាន់
                      </span>
                      <span className="text-2xl font-bold font-mono text-emerald-700 leading-none my-0.5">
                        {stockSummary.inStockCount}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {stockSummary.inStockPct.toFixed(1)}% នៃទំនិញ
                      </span>
                    </>
                  ) : hoveredDonutSegment === 'low_stock' ? (
                    <>
                      <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                        ជិតអស់ពីស្តុក
                      </span>
                      <span className="text-2xl font-bold font-mono text-amber-700 leading-none my-0.5">
                        {stockSummary.lowStockCount}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {stockSummary.lowStockPct.toFixed(1)}% នៃទំនិញ
                      </span>
                    </>
                  ) : hoveredDonutSegment === 'out_of_stock' ? (
                    <>
                      <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                        ដាច់ស្តុក
                      </span>
                      <span className="text-2xl font-bold font-mono text-rose-700 leading-none my-0.5">
                        {stockSummary.outOfStockCount}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {stockSummary.outOfStockPct.toFixed(1)}% នៃទំនិញ
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-['Kantumruy_Pro']">
                        មុខទំនិញសរុប
                      </span>
                      <span className="text-2xl font-bold font-mono text-slate-800 leading-none my-0.5">
                        {stockSummary.totalProducts}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {stockSummary.totalStockBags.toLocaleString()} បាវ
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Segment Cards & Breakdown (7 cols) */}
            <div className="md:col-span-7 space-y-3 font-['Kantumruy_Pro']">
              {/* Healthy In Stock */}
              <div
                onMouseEnter={() => setHoveredDonutSegment('in_stock')}
                onMouseLeave={() => setHoveredDonutSegment(null)}
                onClick={() => setSelectedHealthFilter(selectedHealthFilter === 'in_stock' ? 'all' : 'in_stock')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  hoveredDonutSegment === 'in_stock' || selectedHealthFilter === 'in_stock'
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-emerald-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800 font-['Battambang']">
                      មានស្តុកគ្រប់គ្រាន់ (Healthy In Stock &gt;20)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-emerald-700">
                      {stockSummary.inStockCount} មុខ
                    </span>
                    <span className="text-xs font-bold font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {stockSummary.inStockPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${stockSummary.inStockPct}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                  <span>តម្លៃស្តុកសរុប: ${stockSummary.inStockValUSD.toFixed(2)}</span>
                  <span>ចុចដើម្បីច្រោះទំនិញ</span>
                </div>
              </div>

              {/* Low Stock Warning */}
              <div
                onMouseEnter={() => setHoveredDonutSegment('low_stock')}
                onMouseLeave={() => setHoveredDonutSegment(null)}
                onClick={() => setSelectedHealthFilter(selectedHealthFilter === 'low_stock' ? 'all' : 'low_stock')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  hoveredDonutSegment === 'low_stock' || selectedHealthFilter === 'low_stock'
                    ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-amber-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-slate-800 font-['Battambang']">
                      ជិតអស់ពីស្តុក (Low Stock Alert ≤ 20)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-amber-700">
                      {stockSummary.lowStockCount} មុខ
                    </span>
                    <span className="text-xs font-bold font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {stockSummary.lowStockPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${stockSummary.lowStockPct}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                  <span>តម្លៃស្តុកសរុប: ${stockSummary.lowStockValUSD.toFixed(2)}</span>
                  <span className="text-amber-700 font-bold">ទាមទារការបញ្ជាទិញបន្ថែម</span>
                </div>
              </div>

              {/* Out of Stock Alert */}
              <div
                onMouseEnter={() => setHoveredDonutSegment('out_of_stock')}
                onMouseLeave={() => setHoveredDonutSegment(null)}
                onClick={() => setSelectedHealthFilter(selectedHealthFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  hoveredDonutSegment === 'out_of_stock' || selectedHealthFilter === 'out_of_stock'
                    ? 'bg-rose-50/80 border-rose-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-rose-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-slate-800 font-['Battambang']">
                      ដាច់ស្តុក / អស់ពីស្តុក (Out of Stock = 0)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-rose-700">
                      {stockSummary.outOfStockCount} មុខ
                    </span>
                    <span className="text-xs font-bold font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                      {stockSummary.outOfStockPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${stockSummary.outOfStockPct}%` }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                  <span>ចំនួនទំនិញដាច់ស្តុក: {stockSummary.outOfStockCount} មុខ</span>
                  <span className="text-rose-700 font-bold">ត្រូវបញ្ជាទិញចូលឃ្លាំងជាបន្ទាន់</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart View 2: Category Stock Bar Chart */}
        {activeChartMode === 'category_bar' && (
          <div className="space-y-3 py-2 font-['Kantumruy_Pro']">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>ក្រុមទំនិញ / ប្រភេទជី</span>
              <span className="font-mono">បរិមាណបាវក្នុងស្តុក (Bags) / តម្លៃសរុប ($)</span>
            </div>

            <div className="space-y-3">
              {categoryStockData.map((cat, idx) => {
                const widthPercent = maxCategoryBags > 0 ? (cat.totalBags / maxCategoryBags) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 font-['Battambang']">
                          {cat.labelKh}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                          {cat.count} មុខ
                        </span>
                        {cat.outCount > 0 && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-bold">
                            ដាច់ {cat.outCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="font-bold text-[#1E5FA8]">
                          {cat.totalBags.toLocaleString()} បាវ
                        </span>
                        <span className="text-slate-400">
                          ${cat.totalValUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div
                        style={{ width: `${Math.max(widthPercent, 3)}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-[#1E5FA8] to-blue-400 transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MASTER PRODUCT STOCK INVENTORY TABLE (តារាងពិនិត្យស្តុកទំនិញគ្រប់មុខ)       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        {/* Table Header & Search/Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 font-['Battambang'] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#1E5FA8]" />
              <span>តារាងគ្រប់គ្រងស្តុកទំនិញទាំងអស់ (All Products Stock Inventory)</span>
            </h4>
            <p className="text-xs text-slate-500 font-['Kantumruy_Pro']">
              បង្ហាញ {filteredProducts.length} នៃមុខទំនិញសរុប {products.length} - ចុច "ពិនិត្យស្តុក" ដើម្បីមើលព័ត៌មានលម្អិត
            </p>
          </div>

          {/* Quick Health Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-['Kantumruy_Pro']">
            <button
              type="button"
              onClick={() => setIsCostReportModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer mr-1"
              title="ទាញយករបាយការណ៍គំរូ [កូដ, ឈ្មោះ, បានលក់, ថ្លៃដើម] ជា Excel & PDF (ដកជួរឈរ ចំណូល & ចំណេញ)"
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>របាយការណ៍ កូដ & ថ្លៃដើម</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedHealthFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedHealthFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ទាំងអស់ ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedHealthFilter('in_stock')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedHealthFilter === 'in_stock'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>មានស្តុក ({stockSummary.inStockCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedHealthFilter('low_stock')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedHealthFilter === 'low_stock'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>ជិតអស់ ({stockSummary.lowStockCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedHealthFilter('out_of_stock')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedHealthFilter === 'out_of_stock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>ដាច់ស្តុក ({stockSummary.outOfStockCount})</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Dropdown Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ស្វែងរកឈ្មោះទំនិញ, រូបមន្ត NPK, ប្រភេទ..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white text-xs sm:text-sm font-['Battambang'] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#1E5FA8] focus:ring-2 focus:ring-[#1E5FA8]/10 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-4">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-xs sm:text-sm font-['Battambang'] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#1E5FA8] cursor-pointer"
            >
              <option value="all">គ្រប់ប្រភេទទាំងអស់ (All Categories)</option>
              {categoriesList.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 text-xs sm:text-sm font-['Battambang'] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#1E5FA8] cursor-pointer"
            >
              <option value="stockAsc">ស្តុកតិចជាងគេមុន (Lowest First)</option>
              <option value="stockDesc">ស្តុកច្រើនជាងគេមុន (Highest First)</option>
              <option value="valDesc">តម្លៃស្តុកច្រើនជាងគេ ($)</option>
              <option value="soldDesc">លក់ដាច់ជាងគេ (Bags Sold)</option>
              <option value="name">តាមឈ្មោះទំនិញ (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-3 w-12 text-center">ល.រ</th>
                <th className="py-3 px-3 min-w-[220px]">មុខទំនិញ (Product)</th>
                <th className="py-3 px-3">ប្រភេទ (Category)</th>
                <th className="py-3 px-3 text-right">តម្លៃរាយ ($)</th>
                <th className="py-3 px-3 text-center">ចំនួនក្នុងស្តុក</th>
                <th className="py-3 px-3 text-center">ស្ថានភាពស្តុក</th>
                <th className="py-3 px-3 text-right">តម្លៃស្តុកសរុប ($)</th>
                <th className="py-3 px-3 text-center">លក់បាន</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-['Kantumruy_Pro']">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span className="text-sm font-['Battambang']">
                      មិនមានទំនិញត្រូវនឹងលក្ខខណ្ឌស្វែងរកនេះទេ
                    </span>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const health = getProductHealth(p);
                  const qty = typeof p.stockQty === 'number' ? p.stockQty : (p.inStock ? 50 : 0);
                  const valUSD = (p.price || 0) * qty;
                  const sales = salesMap[p.id] || { bagsSold: 0 };
                  const unit = p.stockUnit || (p.groupId === 'machinery' ? 'គ្រឿង' : 'បាវ');

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      {/* No. */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                            {p.npk ? p.npk.slice(0, 5) : p.nameKh.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 font-['Battambang'] truncate">
                              {p.nameKh}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {p.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="text-slate-700 font-['Battambang'] block truncate max-w-[140px]">
                          {p.categoryKh}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {p.groupKh || 'ជីគីមី'}
                        </span>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        ${p.price.toFixed(2)}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-3 text-center">
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
                        </span>{' '}
                        <span className="text-[10px] text-slate-400">{unit}</span>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3 px-3 text-center">
                        {health === 'in_stock' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>មានស្តុក</span>
                          </span>
                        ) : health === 'low_stock' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
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
                        <span className="text-slate-700 font-bold">
                          {sales.bagsSold}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400">{unit}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Cost Report Modal (Image layout without Revenue & Profit) */}
      <ProductCostReportModal
        isOpen={isCostReportModalOpen}
        onClose={() => setIsCostReportModalOpen(false)}
        products={products}
        orders={orders}
      />
    </div>
  );
};
