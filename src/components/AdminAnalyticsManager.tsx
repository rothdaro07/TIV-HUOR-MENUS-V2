import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  ChevronRight, 
  Building2, 
  CreditCard,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileDown,
  CheckSquare,
  PieChart,
  Activity,
  BarChart2,
  TableProperties
} from 'lucide-react';
import { Order, Currency, Product, CompanyProfile } from '../types';
import { EXCHANGE_RATE_KHR } from '../data/initialProducts';
import { CAMBODIA_PROVINCES } from '../data/cambodiaProvinces';
import { OrderReceiptModal } from './OrderReceiptModal';
import { generateAndPrintPdfReport } from '../utils/pdfReportGenerator';
import { exportOrdersToExcel } from '../utils/excelReportGenerator';
import { CirclePercentChart } from './CirclePercentChart';
import { ProductCostReportModal } from './ProductCostReportModal';

interface AdminAnalyticsManagerProps {
  orders: Order[];
  products: Product[];
  companyProfile?: CompanyProfile;
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void;
  currency?: Currency;
}

type DateFilterType = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom' | 'all';

export const AdminAnalyticsManager: React.FC<AdminAnalyticsManagerProps> = ({
  orders = [],
  products = [],
  companyProfile,
  onUpdateOrderStatus,
  currency = 'USD',
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);

  // Helper date calculators
  const now = new Date();

  // Filter orders based on dateFilter and custom dates
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      
      // Match status
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Match search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCustomer = order.customer.fullName.toLowerCase().includes(q);
        const matchPhone = order.customer.phone.includes(q);
        const matchId = order.id.toLowerCase().includes(q);
        const matchBank = (order.selectedBankName || '').toLowerCase().includes(q);
        if (!matchCustomer && !matchPhone && !matchId && !matchBank) {
          return false;
        }
      }

      // Match Date filter
      if (dateFilter === 'all') return true;

      const orderYear = orderDate.getFullYear();
      const orderMonth = orderDate.getMonth();
      const orderDay = orderDate.getDate();

      const todayYear = now.getFullYear();
      const todayMonth = now.getMonth();
      const todayDay = now.getDate();

      if (dateFilter === 'today') {
        return orderYear === todayYear && orderMonth === todayMonth && orderDay === todayDay;
      }

      if (dateFilter === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return (
          orderYear === yesterday.getFullYear() &&
          orderMonth === yesterday.getMonth() &&
          orderDay === yesterday.getDate()
        );
      }

      if (dateFilter === 'this_week') {
        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return orderDate >= startOfWeek;
      }

      if (dateFilter === 'last_week') {
        const startOfThisWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startOfThisWeek.setDate(diff);
        startOfThisWeek.setHours(0, 0, 0, 0);

        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

        return orderDate >= startOfLastWeek && orderDate < startOfThisWeek;
      }

      if (dateFilter === 'this_month') {
        return orderYear === todayYear && orderMonth === todayMonth;
      }

      if (dateFilter === 'last_month') {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return orderYear === lastMonthDate.getFullYear() && orderMonth === lastMonthDate.getMonth();
      }

      if (dateFilter === 'custom') {
        const start = new Date(customStartDate + 'T00:00:00');
        const end = new Date(customEndDate + 'T23:59:59');
        return orderDate >= start && orderDate <= end;
      }

      return true;
    });
  }, [orders, dateFilter, customStartDate, customEndDate, statusFilter, searchQuery, now]);

  // Overall Financial Calculations
  const stats = useMemo(() => {
    let totalRevenueUSD = 0;
    let totalRevenueKHR = 0;
    let totalBagsSold = 0;
    let totalWeightKg = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let shippedCount = 0;

    // Channel breakdowns
    let onlineCount = 0;
    let onlineRevUSD = 0;
    let directCount = 0;
    let directRevUSD = 0;

    // Payment breakdowns
    let cashCount = 0;
    let cashRevUSD = 0;
    let scanQrCount = 0;
    let scanQrRevUSD = 0;
    let creditCount = 0;
    let creditRevUSD = 0;

    filteredOrders.forEach((o) => {
      const orderTotal = o.totalUSD || 0;
      totalRevenueUSD += orderTotal;
      totalRevenueKHR += o.totalKHR || 0;
      totalWeightKg += o.deliveryFee?.totalActualWeightKg || 0;

      (o.items || []).forEach((item) => {
        totalBagsSold += item.quantity || 0;
      });

      if (o.status === 'paid' || o.status === 'confirmed') paidCount++;
      else if (o.status === 'pending_payment') pendingCount++;
      else if (o.status === 'shipped') shippedCount++;

      // Purchase channel
      if (o.purchaseChannel === 'direct') {
        directCount++;
        directRevUSD += orderTotal;
      } else {
        onlineCount++;
        onlineRevUSD += orderTotal;
      }

      // Payment type
      const pType = o.paymentType;
      const pMethod = o.paymentMethod;
      if (pType === 'credit_unpaid' || (!pType && pMethod === 'credit')) {
        creditCount++;
        creditRevUSD += orderTotal;
      } else if (pType === 'scan_qr' || (!pType && (pMethod === 'bakong_khqr' || o.selectedBankName))) {
        scanQrCount++;
        scanQrRevUSD += orderTotal;
      } else {
        cashCount++;
        cashRevUSD += orderTotal;
      }
    });

    const averageOrderValueUSD = filteredOrders.length > 0 ? totalRevenueUSD / filteredOrders.length : 0;

    return {
      totalOrders: filteredOrders.length,
      totalRevenueUSD,
      totalRevenueKHR,
      totalBagsSold,
      totalWeightKg,
      paidCount,
      pendingCount,
      shippedCount,
      averageOrderValueUSD,
      // Breakdowns
      onlineCount,
      onlineRevUSD,
      directCount,
      directRevUSD,
      cashCount,
      cashRevUSD,
      scanQrCount,
      scanQrRevUSD,
      creditCount,
      creditRevUSD,
    };
  }, [filteredOrders]);

  // Compare Today vs Yesterday or This Month vs Last Month
  const comparisonStats = useMemo(() => {
    const todayOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });

    const todayRevUSD = todayOrders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);

    const thisMonthOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const thisMonthRevUSD = thisMonthOrders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return (
        d.getFullYear() === lastMonthDate.getFullYear() &&
        d.getMonth() === lastMonthDate.getMonth()
      );
    });
    const lastMonthRevUSD = lastMonthOrders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);

    return {
      todayCount: todayOrders.length,
      todayRevUSD,
      thisMonthCount: thisMonthOrders.length,
      thisMonthRevUSD,
      lastMonthCount: lastMonthOrders.length,
      lastMonthRevUSD,
    };
  }, [orders, now]);

  // Product sales breakdown
  const productSalesMap = useMemo(() => {
    const map: { [prodName: string]: { nameKh: string; count: number; totalUSD: number } } = {};
    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const name = item.product.nameKh || item.product.name;
        if (!map[name]) {
          map[name] = { nameKh: name, count: 0, totalUSD: 0 };
        }
        map[name].count += item.quantity || 1;
        map[name].totalUSD += (item.product.price || 0) * (item.quantity || 1);
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredOrders]);

  // Province distribution breakdown
  const provinceSalesMap = useMemo(() => {
    const map: { [provName: string]: { nameKh: string; count: number; totalUSD: number } } = {};
    filteredOrders.forEach((order) => {
      const provObj = CAMBODIA_PROVINCES.find((p) => p.id === order.customer.provinceId);
      const provName = provObj ? provObj.nameKh : order.customer.provinceId || 'មិនបញ្ជាក់';
      if (!map[provName]) {
        map[provName] = { nameKh: provName, count: 0, totalUSD: 0 };
      }
      map[provName].count += 1;
      map[provName].totalUSD += order.totalUSD || 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredOrders]);

  // Daily Chart Controls State
  const [chartRange, setChartRange] = useState<'7days' | '14days' | '30days' | 'this_month'>('7days');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'bags' | 'orders'>('revenue');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Daily Trend Chart calculation with continuous timeline
  const dailyTimelineData = useMemo(() => {
    let daysCount = 7;
    if (chartRange === '14days') daysCount = 14;
    if (chartRange === '30days') daysCount = 30;

    const result: Array<{
      dateStr: string;
      labelKh: string;
      dayOfWeek: string;
      revenueUSD: number;
      revenueKHR: number;
      bags: number;
      ordersCount: number;
    }> = [];

    const dayNamesKh = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

    if (chartRange === 'this_month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dateStr = d.toISOString().split('T')[0];
        const labelKh = `${day}/${month + 1}`;
        const dayOfWeek = dayNamesKh[d.getDay()];

        // Find orders matching this date
        const matchingOrders = orders.filter((o) => {
          if (o.status === 'cancelled') return false;
          const od = new Date(o.createdAt);
          return od.toISOString().split('T')[0] === dateStr;
        });

        let revenueUSD = 0;
        let bags = 0;
        matchingOrders.forEach((o) => {
          revenueUSD += o.totalUSD || 0;
          (o.items || []).forEach((it) => {
            bags += it.quantity || 0;
          });
        });

        result.push({
          dateStr,
          labelKh,
          dayOfWeek,
          revenueUSD,
          revenueKHR: Math.round(revenueUSD * EXCHANGE_RATE_KHR),
          bags,
          ordersCount: matchingOrders.length,
        });
      }
    } else {
      // Last N days
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const labelKh = `${d.getDate()}/${d.getMonth() + 1}`;
        const dayOfWeek = dayNamesKh[d.getDay()];

        // Find orders matching this date
        const matchingOrders = orders.filter((o) => {
          if (o.status === 'cancelled') return false;
          const od = new Date(o.createdAt);
          return od.toISOString().split('T')[0] === dateStr;
        });

        let revenueUSD = 0;
        let bags = 0;
        matchingOrders.forEach((o) => {
          revenueUSD += o.totalUSD || 0;
          (o.items || []).forEach((it) => {
            bags += it.quantity || 0;
          });
        });

        result.push({
          dateStr,
          labelKh,
          dayOfWeek,
          revenueUSD,
          revenueKHR: Math.round(revenueUSD * EXCHANGE_RATE_KHR),
          bags,
          ordersCount: matchingOrders.length,
        });
      }
    }

    return result;
  }, [orders, chartRange, now]);

  // Chart summary metrics
  const chartMaxRevenue = Math.max(...dailyTimelineData.map((d) => d.revenueUSD), 10);
  const chartMaxBags = Math.max(...dailyTimelineData.map((d) => d.bags), 5);
  const chartMaxOrders = Math.max(...dailyTimelineData.map((d) => d.ordersCount), 3);

  const totalPeriodRevenue = dailyTimelineData.reduce((acc, d) => acc + d.revenueUSD, 0);
  const totalPeriodBags = dailyTimelineData.reduce((acc, d) => acc + d.bags, 0);
  const totalPeriodOrders = dailyTimelineData.reduce((acc, d) => acc + d.ordersCount, 0);
  const avgDailyRevenue = dailyTimelineData.length > 0 ? totalPeriodRevenue / dailyTimelineData.length : 0;
  
  const peakDay = dailyTimelineData.reduce((max, d) => (d.revenueUSD > max.revenueUSD ? d : max), dailyTimelineData[0] || {
    dateStr: '',
    labelKh: '',
    revenueUSD: 0,
    bags: 0,
    ordersCount: 0,
  });

  // Visual Chart View Tab (Circle % Donut or Daily Bar)
  const [visualChartTab, setVisualChartTab] = useState<'circle' | 'bar'>('circle');
  const [isProductCostReportModalOpen, setIsProductCostReportModalOpen] = useState(false);

  // Export to authentic multi-sheet Excel (.xlsx) file
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      alert('មិនមានទិន្នន័យការកុម្ម៉ង់សម្រាប់ទាញយកឡើយ');
      return;
    }
    const periodNames: Record<DateFilterType, string> = {
      today: 'ថ្ងៃនេះ (Today)',
      yesterday: 'ម្សិលមិញ (Yesterday)',
      this_week: 'សប្តាហ៍នេះ (This Week)',
      last_week: 'សប្តាហ៍មុន (Last Week)',
      this_month: 'ខែនេះ (This Month)',
      last_month: 'ខែមុន (Last Month)',
      custom: `ចន្លោះ ${customStartDate} ដល់ ${customEndDate}`,
      all: 'ទាំងអស់ (All Time)',
    };
    exportOrdersToExcel({
      orders: filteredOrders,
      products,
      companyProfile,
      periodLabel: periodNames[dateFilter] || dateFilter,
    });
  };

  // Export to Excel/CSV with UTF-8 BOM for Khmer fonts
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('មិនមានទិន្នន័យការកុម្ម៉ង់សម្រាប់ទាញយកឡើយ');
      return;
    }

    const headers = [
      'កាលបរិច្ឆេទ (Date)',
      'លេខកូដកុម្ម៉ង់ (Order ID)',
      'ឈ្មោះអតិថិជន (Customer)',
      'លេខទូរស័ព្ទ (Phone)',
      'ប្រភេទការទិញ (Channel)',
      'វិធីទូទាត់ (Payment Type)',
      'រាជធានី/ខេត្ត (Province)',
      'អាសយដ្ឋាន/ភូមិ-ឃុំ (Address)',
      'មធ្យោបាយដឹកជញ្ជូន (Delivery)',
      'សាខា VET (Branch)',
      'មុខទំនិញដែលបានទិញ (Items & Quantities)',
      'ចំនួនបាវសរុប (Total Bags)',
      'ទម្ងន់សរុបគីឡូ (Weight Kg)',
      'តម្លៃទំនិញ ($)',
      'សេវាដឹកជញ្ជូន VET ($)',
      'សរុបចុងក្រោយ ($ USD)',
      'សរុបជាប្រាក់រៀល (KHR)',
      'ធនាគារទូទាត់ (Bank Paid)',
      'ស្ថានភាព (Status)',
    ];

    const rows = filteredOrders.map((o) => {
      const prov = CAMBODIA_PROVINCES.find((p) => p.id === o.customer.provinceId)?.nameKh || o.customer.provinceId;
      const itemsStr = (o.items || [])
        .map((i) => `${i.product.nameKh} (${i.product.weight || '50kg'}) x ${i.quantity}`)
        .join('; ');
      const totalBags = (o.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
      const channelLabel = o.purchaseChannel === 'direct' ? 'ផ្ទាល់ (Store)' : 'ទិញតាមរយះ Online (VET)';
      const paymentLabel = o.paymentType === 'credit_unpaid' 
        ? 'ជំពាក់ មិនទាន់ទូទាត់' 
        : o.paymentType === 'scan_qr' 
        ? 'Scan QR' 
        : 'ទូទាត់លុយសុទ្ធ';

      return [
        `"${new Date(o.createdAt).toLocaleString('km-KH')}"`,
        `"${o.id}"`,
        `"${o.customer.fullName.replace(/"/g, '""')}"`,
        `"${o.customer.phone}"`,
        `"${channelLabel}"`,
        `"${paymentLabel}"`,
        `"${prov}"`,
        `"${(o.customer.districtVillage || '').replace(/"/g, '""')}"`,
        `"${o.purchaseChannel === 'direct' ? 'ផ្ទាល់' : o.customer.deliveryMethod === 'door' ? 'ដឹកដល់ផ្ទះ' : 'ទទួលនៅសាខា'}"`,
        `"${(o.customer.selectedBranch || '').replace(/"/g, '""')}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        totalBags,
        o.deliveryFee?.totalActualWeightKg || 0,
        (o.subtotalUSD || 0).toFixed(2),
        (o.deliveryFee?.totalFeeUSD || 0).toFixed(2),
        (o.totalUSD || 0).toFixed(2),
        (o.totalKHR || 0).toLocaleString(),
        `"${o.selectedBankName || o.paymentMethod || 'Bank QR'}"`,
        `"${o.status}"`,
      ].join(',');
    });

    // Add UTF-8 BOM so Excel opens Khmer font perfectly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tivhuor_sales_report_${dateFilter}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-['Kantumruy_Pro']">
      {/* Header & Quick Summary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Battambang'] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1E5FA8]" />
            វិភាគចំណូល & គ្រប់គ្រងការកុម្ម៉ង់ទិញប្រចាំថ្ងៃ (Sales & Orders Analytics)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            តាមដានចំណូលលក់ប្រចាំថ្ងៃ សប្តាហ៍ ខែ ចំនួនបាវដែលបានលក់ និងទាញយករបាយការណ៍ជា Excel/CSV
          </p>
        </div>

        {/* Action buttons: Export Excel (.xlsx), PDF & Print */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsProductCostReportModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:shadow cursor-pointer ring-2 ring-blue-400/30"
            title="ទាញយករបាយការណ៍គំរូ [កូដ, ឈ្មោះ, បានលក់, ថ្លៃដើម] ជា Excel & PDF (ដកជួរឈរ ចំណូល & ចំណេញ)"
          >
            <TableProperties className="w-4 h-4 text-blue-100" />
            <span>របាយការណ៍ កូដ & ថ្លៃដើម</span>
            <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded font-mono font-bold">
              គំរូរូបភាព
            </span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:shadow cursor-pointer"
            title="ទាញយករបាយការណ៍ជាឯកសារ Excel (.xlsx) ពេញលេញគ្រប់សន្លឹក (Sheets)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>ទាញយក Excel Report (.xlsx)</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">
              XLSX
            </span>
          </button>

          <button
            onClick={() => {
              const periodNames: Record<DateFilterType, string> = {
                today: 'ថ្ងៃនេះ (Today)',
                yesterday: 'ម្សិលមិញ (Yesterday)',
                this_week: 'សប្តាហ៍នេះ (This Week)',
                last_week: 'សប្តាហ៍មុន (Last Week)',
                this_month: 'ខែនេះ (This Month)',
                last_month: 'ខែមុន (Last Month)',
                custom: `ចន្លោះ ${customStartDate} ដល់ ${customEndDate}`,
                all: 'ទាំងអស់ (All Time)',
              };
              generateAndPrintPdfReport({
                orders: filteredOrders,
                title: 'វិភាគចំណូល & គ្រប់គ្រងការកុម្ម៉ង់ទិញប្រចាំថ្ងៃ',
                periodLabel: periodNames[dateFilter] || dateFilter,
                companyProfile,
              });
            }}
            className="px-3.5 py-2.5 bg-[#107c41] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            title="ទាញយក ឬបោះពុម្ពរបាយការណ៍ជា PDF តារាង Excel"
          >
            <FileDown className="w-4 h-4" />
            <span>PDF Table</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="ទាញយករបាយការណ៍ជា CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="បោះពុម្ពរបាយការណ៍"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-[#1E5FA8]" />
            <span>ជ្រើសរើសចន្លោះពេលវិភាគ (Filter By Date):</span>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: 'ថ្ងៃនេះ (Today)' },
              { id: 'yesterday', label: 'ម្សិលមិញ' },
              { id: 'this_week', label: 'សប្តាហ៍នេះ' },
              { id: 'last_week', label: 'សប្តាហ៍មុន' },
              { id: 'this_month', label: 'ខែនេះ' },
              { id: 'last_month', label: 'ខែមុន' },
              { id: 'custom', label: 'កាលបរិច្ឆេទជាក់លាក់' },
              { id: 'all', label: 'ទាំងអស់ (All)' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setDateFilter(btn.id as DateFilterType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilter === btn.id
                    ? 'bg-[#1E5FA8] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Pickers when 'custom' is selected */}
        {dateFilter === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">ចាប់ពីថ្ងៃ (From):</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none font-mono font-bold"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">ដល់ថ្ងៃ (To):</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none font-mono font-bold"
              />
            </div>
            <button
              onClick={() => {
                // Trigger refresh by updating custom state
                setCustomEndDate(customEndDate);
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs"
            >
              អនុវត្ត (Apply)
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards: Revenue, Orders, Bags Sold, Average */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-[#1E5FA8] to-blue-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-100 font-bold">ចំណូលសរុប (Total Revenue)</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono">
              ${stats.totalRevenueUSD.toFixed(2)}
            </div>
            <div className="text-xs text-blue-200 font-mono">
              ≈ {stats.totalRevenueKHR.toLocaleString()} ៛
            </div>
          </div>
          <div className="text-[10px] text-blue-200/80 pt-1 border-t border-white/10">
            {dateFilter === 'today' ? 'ចំណូលថ្ងៃនេះ' : dateFilter === 'this_month' ? 'ចំណូលខែនេះ' : 'តាមចន្លោះពេលជ្រើសរើស'}
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">ចំនួនកុម្ម៉ង់ (Total Orders)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E5FA8] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
            {stats.totalOrders} <span className="text-xs text-slate-400 font-sans">ការកុម្ម៉ង់</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="text-emerald-600 font-bold">✓ {stats.paidCount} បានទូទាត់</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">⏳ {stats.pendingCount} រង់ចាំ</span>
          </div>
        </div>

        {/* Total Bags & Weight Sold */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">បរិមាណជីដែលបានលក់</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
            {stats.totalBagsSold} <span className="text-xs text-slate-400 font-sans">បាវ</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            ទម្ងន់សរុប: <strong className="text-slate-800">{stats.totalWeightKg.toLocaleString()} kg</strong>
          </div>
        </div>

        {/* Comparison: Today vs Month */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">ប្រៀបធៀបចំណូល (Comparison)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">ថ្ងៃនេះ (Today):</span>
              <strong className="text-blue-700">${comparisonStats.todayRevUSD.toFixed(2)} ({comparisonStats.todayCount})</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">ខែនេះ (This M):</span>
              <strong className="text-emerald-700">${comparisonStats.thisMonthRevUSD.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-sans">ខែមុន (Last M):</span>
              <span>${comparisonStats.lastMonthRevUSD.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Cards: ប្រភេទការទិញ (Purchase Channel) & វិធីទូទាត់ប្រាក់ (Payment Method) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. ប្រភេទការទិញ (Purchase Channel Breakdown) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E5FA8] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-['Battambang']">
                  ប្រភេទការទិញ (Purchase Channel)
                </h4>
                <p className="text-[10px] text-slate-500">ទិញតាមរយះ Online ឬ ផ្ទាល់នៅដេប៉ូ</p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#1E5FA8] bg-blue-50 px-2 py-0.5 rounded-full">
              {stats.totalOrders} ការកុម្ម៉ង់
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Online Channel */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#1E5FA8]" />
                  <span>🌐 ទិញតាមរយះ Online</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-[#1E5FA8] px-1.5 py-0.5 rounded">
                  {stats.onlineCount} ({stats.totalOrders > 0 ? ((stats.onlineCount / stats.totalOrders) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="text-base font-bold font-mono text-[#1E5FA8]">
                ${stats.onlineRevUSD.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">
                ដឹកជញ្ជូនតាម VET Express
              </div>
            </div>

            {/* Direct Channel */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>🏪 ផ្ទាល់ (ដេប៉ូ/Store)</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  {stats.directCount} ({stats.totalOrders > 0 ? ((stats.directCount / stats.totalOrders) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="text-base font-bold font-mono text-emerald-700">
                ${stats.directRevUSD.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">
                ទទួលទំនិញផ្ទាល់នៅទីតាំង
              </div>
            </div>
          </div>
        </div>

        {/* 2. វិធីទូទាត់ប្រាក់ (Payment Method Breakdown) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-['Battambang']">
                  វិធីទូទាត់ប្រាក់ (Payment Methods)
                </h4>
                <p className="text-[10px] text-slate-500">លុយសុទ្ធ, Scan QR, និង ជំពាក់មិនទាន់ទូទាត់</p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              ${stats.totalRevenueUSD.toFixed(2)} សរុប
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* Cash */}
            <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">💵 លុយសុទ្ធ</span>
                <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">
                  {stats.cashCount}
                </span>
              </div>
              <div className="text-sm font-bold font-mono text-emerald-700">
                ${stats.cashRevUSD.toFixed(2)}
              </div>
              <div className="text-[9px] text-slate-400">ទូទាត់លុយសុទ្ធ</div>
            </div>

            {/* Scan QR */}
            <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">📱 Scan QR</span>
                <span className="text-[9px] font-mono font-bold bg-blue-100 text-[#1E5FA8] px-1 py-0.2 rounded">
                  {stats.scanQrCount}
                </span>
              </div>
              <div className="text-sm font-bold font-mono text-[#1E5FA8]">
                ${stats.scanQrRevUSD.toFixed(2)}
              </div>
              <div className="text-[9px] text-slate-400">Bakong / KHQR</div>
            </div>

            {/* Credit / Unpaid */}
            <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">📝 ជំពាក់</span>
                <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded">
                  {stats.creditCount}
                </span>
              </div>
              <div className="text-sm font-bold font-mono text-amber-700">
                ${stats.creditRevUSD.toFixed(2)}
              </div>
              <div className="text-[9px] text-slate-400">មិនទាន់ទូទាត់</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ក្រាហ្វិកទំនើប៖ ទៀន OHLC, ភាគរយរង្វង់ & សសរប្រចាំថ្ងៃ (MODERN CHARTS HUB)     */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Navigation Selector between Candles, Circle %, and Bar Chart */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-800 font-['Battambang'] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>រចនាបថក្រាហ្វិកទំនើប (Modern Visual Analytics):</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-['Battambang'] flex-wrap">
            <button
              type="button"
              onClick={() => setVisualChartTab('circle')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                visualChartTab === 'circle'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>ក្រាហ្វិកភាគរយរង្វង់ (Circle % Chart)</span>
            </button>

            <button
              type="button"
              onClick={() => setVisualChartTab('bar')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                visualChartTab === 'bar'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>ក្រាហ្វិកសសរ (Daily Bar)</span>
            </button>
          </div>
        </div>

        {/* 1. Circle Percent Donut Chart View */}
        {visualChartTab === 'circle' && (
          <CirclePercentChart
            orders={filteredOrders}
            products={products}
            exchangeRateKHR={EXCHANGE_RATE_KHR}
          />
        )}

        {/* 2. Daily Bar Chart View */}
        {visualChartTab === 'bar' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 font-['Battambang']">
            {/* Chart Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E5FA8] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                      ក្រាហ្វិកចំណូលលក់ប្រចាំថ្ងៃ (Daily Revenue Chart)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-['Kantumruy_Pro']">
                      តាមដាននិន្នាការនៃការលក់ និងចំណូលលម្អិតតាមថ្ងៃនីមួយៗ
                    </p>
                  </div>
                </div>
              </div>

              {/* Range & Metric Toggles */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Metric Toggle */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setChartMetric('revenue')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartMetric === 'revenue'
                        ? 'bg-white text-[#1E5FA8] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ចំណូល ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('bags')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartMetric === 'bags'
                        ? 'bg-white text-[#1E5FA8] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ចំនួនបាវ (Bags)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('orders')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartMetric === 'orders'
                        ? 'bg-white text-[#1E5FA8] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    កុម្ម៉ង់ (Orders)
                  </button>
                </div>

                {/* Range Toggle */}
                <div className="bg-blue-50 border border-blue-100 p-1 rounded-xl flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setChartRange('7days')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartRange === '7days'
                        ? 'bg-[#1E5FA8] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-blue-100/50'
                    }`}
                  >
                    7 ថ្ងៃចុងក្រោយ
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartRange('14days')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartRange === '14days'
                        ? 'bg-[#1E5FA8] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-blue-100/50'
                    }`}
                  >
                    14 ថ្ងៃ
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartRange('30days')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartRange === '30days'
                        ? 'bg-[#1E5FA8] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-blue-100/50'
                    }`}
                  >
                    30 ថ្ងៃ
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartRange('this_month')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartRange === 'this_month'
                        ? 'bg-[#1E5FA8] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-blue-100/50'
                    }`}
                  >
                    ខែនេះ
                  </button>
                </div>
              </div>
            </div>

            {/* Chart Period Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-['Kantumruy_Pro']">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">ចំណូលសរុបក្នុងកំឡុងពេល</span>
                <div className="text-sm sm:text-base font-bold font-mono text-[#1E5FA8]">
                  ${totalPeriodRevenue.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  ≈ {Math.round(totalPeriodRevenue * EXCHANGE_RATE_KHR).toLocaleString()} ៛
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">ចំណូលមធ្យមប្រចាំថ្ងៃ</span>
                <div className="text-sm sm:text-base font-bold font-mono text-emerald-700">
                  ${avgDailyRevenue.toFixed(2)} / ថ្ងៃ
                </div>
                <span className="text-[10px] text-slate-400">
                  {dailyTimelineData.length} ថ្ងៃក្នុងតារាង
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">ជីលក់ចេញសរុប</span>
                <div className="text-sm sm:text-base font-bold font-mono text-slate-800">
                  {totalPeriodBags} <span className="text-xs font-sans text-slate-500">បាវ</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  ពី {totalPeriodOrders} ការកុម្ម៉ង់
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">ថ្ងៃលក់ដាច់បំផុត (Peak Day)</span>
                <div className="text-sm sm:text-base font-bold font-mono text-purple-700 truncate">
                  {peakDay.revenueUSD > 0 ? `$${peakDay.revenueUSD.toFixed(2)}` : '$0.00'}
                </div>
                <span className="text-[10px] text-slate-500 font-mono truncate block">
                  {peakDay.revenueUSD > 0 ? `${peakDay.labelKh} (${peakDay.dayOfWeek})` : 'មិនទាន់មាន'}
                </span>
              </div>
            </div>

            {/* The Graphic Bar Chart View */}
            <div className="relative pt-4 pb-2 px-3 bg-gradient-to-b from-slate-50/60 to-slate-100/40 rounded-2xl border border-slate-200/80">
              {/* Axis Scale Legend */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-2 px-1">
                <span>
                  {chartMetric === 'revenue'
                    ? `អតិបរមា: $${chartMaxRevenue.toFixed(0)}`
                    : chartMetric === 'bags'
                    ? `អតិបរមា: ${chartMaxBags} បាវ`
                    : `អតិបរមា: ${chartMaxOrders} កុម្ម៉ង់`}
                </span>
                <span className="flex items-center gap-1.5 text-[#1E5FA8] font-bold">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#1E5FA8] inline-block" />
                  <span>
                    {chartMetric === 'revenue' ? 'ចំណូលលក់ ($)' : chartMetric === 'bags' ? 'ចំនួនបាវ' : 'ចំនួនកុម្ម៉ង់'}
                  </span>
                </span>
              </div>

              {/* Bar Chart Container */}
              <div className="h-48 sm:h-56 w-full flex items-end gap-1.5 sm:gap-2.5 overflow-x-auto pb-6 pt-6 px-1">
                {dailyTimelineData.map((d, idx) => {
                  const currentVal =
                    chartMetric === 'revenue' ? d.revenueUSD : chartMetric === 'bags' ? d.bags : d.ordersCount;
                  const maxVal =
                    chartMetric === 'revenue' ? chartMaxRevenue : chartMetric === 'bags' ? chartMaxBags : chartMaxOrders;
                  const heightPercent = maxVal > 0 ? Math.max((currentVal / maxVal) * 100, 6) : 6;
                  const isHovered = hoveredPointIndex === idx;
                  const isPeak = d.revenueUSD === peakDay.revenueUSD && d.revenueUSD > 0;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                      className="flex-1 min-w-[34px] max-w-[60px] h-full flex flex-col justify-end items-center gap-1 group relative cursor-pointer"
                    >
                      {/* Floating Interactive Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-20 bg-slate-900/95 text-white text-[11px] p-2.5 rounded-xl font-mono font-bold shadow-2xl pointer-events-none whitespace-nowrap z-30 border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                          <div className="text-amber-400 font-sans text-xs flex items-center justify-between gap-3 border-b border-slate-700 pb-1 mb-1">
                            <span>ថ្ងៃ {d.dayOfWeek}</span>
                            <span>{d.dateStr}</span>
                          </div>
                          <div className="space-y-0.5 font-['Kantumruy_Pro']">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-300 font-normal">ចំណូលសរុប:</span>
                              <span className="text-emerald-400">${d.revenueUSD.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-300 font-normal">គិតជាប្រាក់រៀល:</span>
                              <span className="text-cyan-300">{d.revenueKHR.toLocaleString()} ៛</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-300 font-normal">ចំនួនជីលក់បាន:</span>
                              <span className="text-white">{d.bags} បាវ</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-300 font-normal">ការកុម្ម៉ង់:</span>
                              <span className="text-white">{d.ordersCount} កុម្ម៉ង់</span>
                            </div>
                          </div>
                          {/* Arrow tail */}
                          <div className="w-2 h-2 bg-slate-900/95 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                        </div>
                      )}

                      {/* Top Value Label if has value */}
                      {currentVal > 0 && (
                        <span
                          className={`text-[9px] font-mono font-bold transition-all ${
                            isHovered || isPeak ? 'text-[#1E5FA8] scale-110' : 'text-slate-400'
                          }`}
                        >
                          {chartMetric === 'revenue' ? `$${Math.round(currentVal)}` : currentVal}
                        </span>
                      )}

                      {/* Bar Element with Animated Gradient */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 relative ${
                          isHovered
                            ? 'bg-gradient-to-t from-[#1E5FA8] to-blue-300 shadow-md scale-105'
                            : isPeak
                            ? 'bg-gradient-to-t from-purple-700 to-indigo-400 shadow-xs'
                            : currentVal > 0
                            ? 'bg-gradient-to-t from-[#1E5FA8] to-blue-400 opacity-90 hover:opacity-100'
                            : 'bg-slate-200/80 rounded-xs'
                        }`}
                      >
                        {isPeak && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-purple-600 text-white rounded-full px-1 py-0 font-bold scale-75">
                            ★
                          </span>
                        )}
                      </div>

                      {/* Bottom Date & Day Label */}
                      <div className="text-center w-full min-w-0">
                        <span
                          className={`text-[10px] font-mono block truncate ${
                            isHovered ? 'text-[#1E5FA8] font-bold' : 'text-slate-600 font-medium'
                          }`}
                        >
                          {d.labelKh}
                        </span>
                        <span className="text-[8px] text-slate-400 block truncate font-sans">
                          {d.dayOfWeek.slice(0, 3)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout: Top Selling Products & Province Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Selling Fertilizers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-['Battambang'] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#1E5FA8]" />
            មុខជីលក់ដាច់ជាងគេ (Top Selling Products)
          </h4>

          {productSalesMap.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              មិនទាន់មានទិន្នន័យមុខជីក្នុងចន្លោះពេលនេះ
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {productSalesMap.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 truncate">{item.nameKh}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 font-mono">{item.count} បាវ</span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      ${item.totalUSD.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Province Delivery Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-['Battambang'] flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#1E5FA8]" />
            ការដឹកជញ្ជូនតាមបណ្តាខេត្ត (Province Distribution)
          </h4>

          {provinceSalesMap.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              មិនទាន់មានទិន្នន័យដឹកជញ្ជូនក្នុងចន្លោះពេលនេះ
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {provinceSalesMap.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 truncate">{item.nameKh}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 font-mono">{item.count} កុម្ម៉ង់</span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      ${item.totalUSD.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders List Table with Search & Status Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
        {/* Table Search & Status Filter Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះអតិថិជន លេខទូរស័ព្ទ ឬកូដ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1E5FA8]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-bold">ស្ថានភាព:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-bold"
            >
              <option value="all">ទាំងអស់ (All Status)</option>
              <option value="paid">បានទូទាត់រួច (Paid)</option>
              <option value="confirmed">បានបញ្ជាក់ (Confirmed)</option>
              <option value="shipped">កំពុងដឹកជញ្ជូន (Shipped)</option>
              <option value="pending_payment">រង់ចាំទូទាត់ (Pending)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">កាលបរិច្ឆេទ & កូដ</th>
                <th className="p-3.5">អតិថិជន & ទូរស័ព្ទ</th>
                <th className="p-3.5">ប្រភេទការទិញ</th>
                <th className="p-3.5">វិធីទូទាត់</th>
                <th className="p-3.5">ខេត្ត / ទីតាំងដឹក</th>
                <th className="p-3.5">មុខទំនិញ</th>
                <th className="p-3.5 text-right">សរុប ($ USD)</th>
                <th className="p-3.5 text-center">ស្ថានភាព</th>
                <th className="p-3.5 text-center">វិក្កយបត្រ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    មិនមានទិន្នន័យការកុម្ម៉ង់ក្នុងចន្លោះពេលនេះទេ
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const prov = CAMBODIA_PROVINCES.find((p) => p.id === order.customer.provinceId)?.nameKh || order.customer.provinceId;
                  const totalBags = (order.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
                  const isDirect = order.purchaseChannel === 'direct';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date & ID */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-900">
                          #{order.id.slice(-6)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(order.createdAt).toLocaleDateString('km-KH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Customer & Phone */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 font-['Battambang']">
                          {order.customer.fullName}
                        </div>
                        <div className="font-mono text-blue-700 text-[11px] font-bold">
                          {order.customer.phone}
                        </div>
                      </td>

                      {/* ប្រភេទការទិញ (Purchase Channel) */}
                      <td className="p-3.5">
                        {isDirect ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10.5px] font-bold font-['Battambang']">
                            <Building2 className="w-3 h-3 text-emerald-600" />
                            ផ្ទាល់
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-[#1E5FA8] border border-blue-200 px-2 py-0.5 rounded-full text-[10.5px] font-bold font-['Battambang']">
                            <Truck className="w-3 h-3 text-[#1E5FA8]" />
                            ទិញតាមរយះ Online
                          </span>
                        )}
                      </td>

                      {/* វិធីទូទាត់ប្រាក់ (Payment Method) */}
                      <td className="p-3.5">
                        {order.paymentType === 'credit_unpaid' || (!order.paymentType && order.paymentMethod === 'credit') ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10.5px] font-bold font-['Battambang']">
                            📝 ជំពាក់ មិនទាន់ទូទាត់
                          </span>
                        ) : order.paymentType === 'scan_qr' || (!order.paymentType && (order.paymentMethod === 'bakong_khqr' || order.selectedBankName)) ? (
                          <div className="inline-flex flex-col items-start">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#1E5FA8] border border-blue-200 px-2 py-0.5 rounded-full text-[10.5px] font-bold font-['Battambang']">
                              📱 Scan QR
                            </span>
                            {order.selectedBankName && (
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5 pl-1">
                                {order.selectedBankName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10.5px] font-bold font-['Battambang']">
                            💵 ទូទាត់លុយសុទ្ធ
                          </span>
                        )}
                      </td>

                      {/* Province & Delivery Method */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{prov}</div>
                        <div className="text-[10px] text-slate-500">
                          {isDirect
                            ? '🏪 ទទួលទំនិញផ្ទាល់'
                            : order.customer.deliveryMethod === 'door'
                            ? '🚚 ដឹកដល់ផ្ទះ'
                            : `🏢 VET: ${order.customer.selectedBranch || ''}`}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">
                          {totalBags} បាវ ({order.deliveryFee?.totalActualWeightKg || 0} kg)
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                          {(order.items || []).map((i) => i.product.nameKh).join(', ')}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="p-3.5 text-right font-mono">
                        <div className="font-bold text-emerald-700 text-sm">
                          ${(order.totalUSD || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {(order.totalKHR || 0).toLocaleString()} ៛
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-3.5 text-center">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            onUpdateOrderStatus &&
                            onUpdateOrderStatus(order.id, e.target.value as Order['status'])
                          }
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border outline-none cursor-pointer ${
                            order.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : order.status === 'confirmed'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : order.status === 'shipped'
                              ? 'bg-purple-50 text-purple-700 border-purple-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}
                        >
                          <option value="paid">✓ បានទូទាត់ (Paid)</option>
                          <option value="confirmed">✓ បានបញ្ជាក់ (Confirmed)</option>
                          <option value="shipped">🚚 កំពុងដឹក (Shipped)</option>
                          <option value="pending_payment">⏳ រង់ចាំ (Pending)</option>
                          <option value="cancelled">✕ បោះបង់ (Cancelled)</option>
                        </select>
                      </td>

                      {/* View Receipt */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedOrderForReceipt(order)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="មើលវិក្កយបត្រ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Receipt Modal */}
      {selectedOrderForReceipt && (
        <OrderReceiptModal
          order={selectedOrderForReceipt}
          isOpen={true}
          onClose={() => setSelectedOrderForReceipt(null)}
          companyProfile={companyProfile}
        />
      )}

      {/* Product Cost Report Modal (Image layout without Revenue & Profit) */}
      <ProductCostReportModal
        isOpen={isProductCostReportModalOpen}
        onClose={() => setIsProductCostReportModalOpen(false)}
        products={products}
        orders={filteredOrders}
        companyProfile={companyProfile}
      />
    </div>
  );
};
