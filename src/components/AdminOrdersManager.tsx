import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Eye,
  Send,
  Search,
  Filter,
  FileText,
  DollarSign,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Download,
  Building2,
  FileSpreadsheet,
  TableProperties
} from 'lucide-react';
import { Order, CompanyProfile, Currency, Product } from '../types';
import { CAMBODIA_PROVINCES } from '../data/cambodiaProvinces';
import { sendOrderToTelegram } from '../lib/telegram';
import { OrderReceiptModal } from './OrderReceiptModal';
import { generateAndPrintPdfReport } from '../utils/pdfReportGenerator';
import { ProductCostReportModal } from './ProductCostReportModal';

interface AdminOrdersManagerProps {
  orders: Order[];
  products?: Product[];
  companyProfile?: CompanyProfile;
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void;
  currency?: Currency;
}

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({
  orders = [],
  products = [],
  companyProfile,
  onUpdateOrderStatus,
  currency = 'USD',
}) => {
  const [statusTab, setStatusTab] = useState<'all' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [isSendingTelegramId, setIsSendingTelegramId] = useState<string | null>(null);
  const [telegramNotice, setTelegramNotice] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [isProductCostReportModalOpen, setIsProductCostReportModalOpen] = useState(false);

  // Filtered orders
  const filteredOrders = orders.filter((ord) => {
    // Status filter
    if (statusTab !== 'all' && ord.status !== statusTab) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCustomer = ord.customer.fullName.toLowerCase().includes(q);
      const matchPhone = ord.customer.phone.includes(q);
      const matchId = ord.id.toLowerCase().includes(q);
      const matchBank = (ord.selectedBankName || '').toLowerCase().includes(q);
      return matchCustomer || matchPhone || matchId || matchBank;
    }
    return true;
  });

  // Counters
  const pendingCount = orders.filter((o) => o.status === 'pending_payment').length;
  const paidCount = orders.filter((o) => o.status === 'paid' || o.status === 'completed').length;
  const shippedCount = orders.filter((o) => o.status === 'shipped' || o.status === 'processing').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  const totalSalesUSD = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalUSD || 0), 0);

  const getProvinceName = (provinceId?: string) => {
    if (!provinceId) return '-';
    if (provinceId === 'direct-store') return 'ទិញផ្ទាល់នៅហាង/ដេប៉ូ';
    const prov = CAMBODIA_PROVINCES.find((p) => p.id === provinceId);
    return prov ? prov.nameKh : provinceId;
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, newStatus);
    }
  };

  const handleResendTelegram = async (order: Order) => {
    setIsSendingTelegramId(order.id);
    setTelegramNotice(null);
    try {
      const res = await sendOrderToTelegram(order, companyProfile);
      if (res.success) {
        setTelegramNotice({
          id: order.id,
          success: true,
          message: 'បានផ្ញើទៅ Telegram Bot ដោយជោគជ័យ!',
        });
      } else {
        setTelegramNotice({
          id: order.id,
          success: false,
          message: res.message || 'មិនអាចផ្ញើទៅ Telegram បានទេ សូមពិនិត្យ Bot Token!',
        });
      }
    } catch (e: any) {
      setTelegramNotice({
        id: order.id,
        success: false,
        message: e?.message || 'កំហុសបណ្តាញ Telegram',
      });
    } finally {
      setIsSendingTelegramId(null);
    }
  };

  return (
    <div className="space-y-6 font-['Battambang']">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1E5FA8] flex items-center justify-center font-bold shadow-2xs">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                គ្រប់គ្រងការកុម្ម៉ង់ & វិក្កយបត្រ (Order Approvals & Invoices)
              </h3>
              <p className="text-xs text-slate-500 font-['Kantumruy_Pro'] mt-0.5">
                ពិនិត្យមើលរូបភាពបង្កាន់ដៃបង់ប្រាក់ (Invoice Slip) បញ្ជាក់ការកុម្ម៉ង់ (Confirm Order) និងផ្ញើទៅ Telegram Manager
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsProductCostReportModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="ទាញយករបាយការណ៍គំរូ [កូដ, ឈ្មោះ, បានលក់, ថ្លៃដើម] ជា Excel & PDF (ដកជួរឈរ ចំណូល & ចំណេញ)"
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>របាយការណ៍ កូដ & ថ្លៃដើម</span>
            </button>
            <button
              onClick={() => {
                generateAndPrintPdfReport({
                  orders: filteredOrders,
                  title: 'បញ្ជីការកុម្ម៉ង់ & វិក្កយបត្រ (Orders & Invoices)',
                  periodLabel: `តម្រង: ${statusTab === 'all' ? 'ទាំងអស់' : statusTab} (${filteredOrders.length} orders)`,
                  companyProfile,
                });
              }}
              className="px-3.5 py-1.5 bg-[#107c41] hover:bg-[#0d6434] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="ទាញយកជាតារាង PDF Excel (Download Excel Table PDF)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ទាញយក PDF Excel Table</span>
            </button>
            <span className="text-xs px-3 py-1 bg-blue-50 text-[#1E5FA8] font-bold rounded-full border border-blue-200">
              សរុប {orders.length} ការកុម្ម៉ង់
            </span>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">រង់ចាំពិនិត្យវិក្កយបត្រ</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-900">{pendingCount}</span>
              <span className="text-[11px] text-amber-700 font-semibold">អតិថិជនបានផ្ញើ Slip</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">បានបញ្ជាក់ / បានបង់</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-900">{paidCount}</span>
              <span className="text-[11px] text-emerald-700 font-semibold">បានយល់ព្រម</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800">កំពុងរៀបចំ & ដឹកជញ្ជូន</span>
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-900">{shippedCount}</span>
              <span className="text-[11px] text-blue-700 font-semibold">ដឹកតាម VET</span>
            </div>
          </div>

          <div className="p-4 bg-purple-50/80 border border-purple-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800">ចំណូលសរុប</span>
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-purple-900">${totalSalesUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              statusTab === 'all'
                ? 'bg-[#1E5FA8] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ទាំងអស់ ({orders.length})
          </button>

          <button
            onClick={() => setStatusTab('pending_payment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusTab === 'pending_payment'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>រង់ចាំ Manager ពិនិត្យ ({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusTab('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusTab === 'paid'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>បានបញ្ជាក់បង់ប្រាក់ ({paidCount})</span>
          </button>

          <button
            onClick={() => setStatusTab('shipped')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusTab === 'shipped'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>កំពុងដឹកជញ្ជូន ({shippedCount})</span>
          </button>

          <button
            onClick={() => setStatusTab('cancelled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusTab === 'cancelled'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>បានបដិសេធ ({cancelledCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកតាមលេខកូដ, ឈ្មោះ, ទូរស័ព្ទ..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1E5FA8] focus:bg-white"
          />
        </div>
      </div>

      {/* Orders List Table / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800">មិនមានទិន្នន័យការកុម្ម៉ង់នោះទេ</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'មិនមានការកុម្ម៉ង់ដែលត្រូវនឹងពាក្យស្វែងរកនេះទេ' : 'នៅពេលអតិថិជនធ្វើការកុម្ម៉ង់ និងបង់ប្រាក់តាម QR ទិន្នន័យនឹងបង្ហាញនៅទីនេះ'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'pending_payment';
            const isPaid = order.status === 'paid' || order.status === 'completed';
            const isShipped = order.status === 'shipped';
            const isCancelled = order.status === 'cancelled';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                  isPending
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : isPaid
                    ? 'border-emerald-200'
                    : isCancelled
                    ? 'border-red-200 opacity-75'
                    : 'border-slate-200'
                }`}
              >
                {/* Order Item Header */}
                <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isPending
                          ? 'bg-amber-100 text-amber-800'
                          : isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCancelled
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isPending ? (
                        <Clock className="w-5 h-5" />
                      ) : isPaid ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isCancelled ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Truck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          #{order.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                              : isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : isCancelled
                              ? 'bg-red-50 text-red-700 border-red-300'
                              : 'bg-blue-50 text-blue-700 border-blue-300'
                          }`}
                        >
                          {isPending
                            ? '⏳ រង់ចាំ Manager ពិនិត្យបង្កាន់ដៃ'
                            : isPaid
                            ? '✓ បានបញ្ជាក់ការបង់ប្រាក់'
                            : isCancelled
                            ? '✕ បានបដិសេធ'
                            : '🚚 កំពុងដឹកជញ្ជូន'}
                        </span>

                        {order.telegramNotified && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/20 flex items-center gap-1">
                            <span>Telegram Bot ✓</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-['Kantumruy_Pro'] flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(order.createdAt).toLocaleString('km-KH')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-black text-[#1E5FA8]">
                      ${order.totalUSD.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 font-bold">
                      {order.totalKHR.toLocaleString()} ៛
                    </div>
                  </div>
                </div>

                {/* Order Main Content: 3 Columns Grid */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Column 1: Customer & Delivery Info (4 cols) */}
                  <div className="md:col-span-4 space-y-2.5 text-xs text-slate-700 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <User className="w-4 h-4 text-[#1E5FA8]" />
                      <span>ព័ត៌មានអតិថិជន (Customer)</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">ឈ្មោះ:</span>
                        <span className="font-bold text-slate-900">{order.customer.fullName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">លេខទូរស័ព្ទ:</span>
                        <a
                          href={`tel:${order.customer.phone}`}
                          className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{order.customer.phone}</span>
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">ប្រភេទការទិញ:</span>
                        <span className="font-bold text-[#1E5FA8]">
                          {order.purchaseChannel === 'direct' ? '🏪 ទិញផ្ទាល់' : '🌐 ទិញតាមរយះ Online'}
                        </span>
                      </div>
                      {order.purchaseChannel !== 'direct' && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">ខេត្ត/ក្រុង:</span>
                            <span className="font-bold text-slate-800">
                              {getProvinceName(order.customer.provinceId)}
                            </span>
                          </div>
                          {order.customer.districtVillage && (
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-500 shrink-0">ទីតាំង:</span>
                              <span className="font-medium text-slate-800 text-right">
                                {order.customer.districtVillage}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                            <span className="text-slate-500">ការដឹក VET:</span>
                            <span className="font-bold text-emerald-700">
                              {order.customer.deliveryMethod === 'branch'
                                ? `ទទួលនៅសាខា VET (${order.customer.selectedBranch || ''})`
                                : 'ដឹកដល់ទីតាំងផ្ទាល់'}
                            </span>
                          </div>
                        </>
                      )}
                      {order.purchaseChannel === 'direct' && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                          <span className="text-slate-500">ការទទួល:</span>
                          <span className="font-bold text-emerald-700">
                            ទទួលទំនិញផ្ទាល់នៅហាង/ដេប៉ូ
                          </span>
                        </div>
                      )}
                      {order.customer.notes && (
                        <div className="pt-1 border-t border-slate-200 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg">
                          <span className="font-bold">ចំណាំ:</span> {order.customer.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Order Items (4 cols) */}
                  <div className="md:col-span-4 space-y-2.5 text-xs text-slate-700 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
                    <div className="font-bold text-slate-900 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#1E5FA8]" />
                        <span>មុខទំនិញកុម្ម៉ង់ ({order.items.length})</span>
                      </span>
                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="text-[11px] text-[#1E5FA8] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>មើលវិក្កយបត្រ</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 truncate">
                              {item.product.nameKh || item.product.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ${item.product.price.toFixed(2)} x {item.quantity} បាវ
                            </div>
                          </div>
                          <div className="font-bold text-slate-900 shrink-0">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Payment Method Details */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">វិធីទូទាត់:</span>
                        <span
                          className={`font-bold ${
                            order.paymentType === 'credit_unpaid'
                              ? 'text-amber-700 font-black'
                              : order.paymentType === 'cash'
                              ? 'text-emerald-700'
                              : 'text-[#1E5FA8]'
                          }`}
                        >
                          {order.paymentType === 'cash'
                            ? '💵 ទូទាត់លុយសុទ្ធ (Cash)'
                            : order.paymentType === 'scan_qr'
                            ? '📱 Scan QR (Bank Transfer)'
                            : order.paymentType === 'credit_unpaid'
                            ? '📝 ជំពាក់ មិនទាន់ទូទាត់ (Credit)'
                            : '💵 ទូទាត់លុយសុទ្ធ'}
                        </span>
                      </div>

                      {order.selectedBankName && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span>ធនាគារ:</span>
                          <span className="font-bold text-[#1E5FA8]">
                            {order.selectedBankName} ({order.bankAccountName || ''})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Payment Slip & Manager Actions (4 cols) */}
                  <div className="md:col-span-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center justify-between text-xs mb-2">
                        <span>រូបភាពបង្កាន់ដៃបង់ប្រាក់ (Invoice Slip)</span>
                        {order.paymentProofUrl && (
                          <button
                            onClick={() => setSelectedProofOrder(order)}
                            className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ពង្រីកមើលរូប</span>
                          </button>
                        )}
                      </div>

                      {order.paymentProofUrl ? (
                        <div
                          onClick={() => setSelectedProofOrder(order)}
                          className="relative h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-300 hover:border-blue-500 cursor-pointer group transition-all"
                        >
                          <img
                            src={order.paymentProofUrl}
                            alt="Payment Receipt Slip"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                            ចុចដើម្បីមើលធំ
                          </div>
                        </div>
                      ) : (
                        <div className="h-20 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-2">
                          <AlertCircle className="w-4 h-4 mb-1" />
                          <span>អតិថិជនមិនបានភ្ជាប់រូបវិក្កយបត្រ</span>
                        </div>
                      )}
                    </div>

                    {/* Telegram Notice feedback */}
                    {telegramNotice && telegramNotice.id === order.id && (
                      <div
                        className={`text-[11px] p-2 rounded-lg font-bold ${
                          telegramNotice.success
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {telegramNotice.message}
                      </div>
                    )}

                    {/* Manager Approval & Status Controls */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {isPending ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleStatusChange(order.id, 'paid')}
                            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-['Battambang']"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✓ យល់ព្រមបង់ប្រាក់</span>
                          </button>

                          <button
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                            className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-['Battambang']"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>✕ បដិសេធ</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1E5FA8]"
                          >
                            <option value="pending_payment">រង់ចាំពិនិត្យ (Pending)</option>
                            <option value="paid">បានបង់ប្រាក់ (Paid)</option>
                            <option value="processing">កំពុងរៀបចំ (Processing)</option>
                            <option value="shipped">កំពុងដឹកជញ្ជូន (Shipped)</option>
                            <option value="completed">បានប្រគល់រួច (Completed)</option>
                            <option value="cancelled">បានបដិសេធ (Cancelled)</option>
                          </select>
                        </div>
                      )}

                      {/* Telegram Resend Button */}
                      <button
                        type="button"
                        disabled={isSendingTelegramId === order.id}
                        onClick={() => handleResendTelegram(order)}
                        className="w-full py-1.5 px-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isSendingTelegramId === order.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>កំពុងផ្ញើ...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>ផ្ញើទិន្នន័យ & រូបភាពទៅ Telegram Bot</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof Viewer Modal */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#1E5FA8] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">បង្កាន់ដៃបង់ប្រាក់ #{selectedProofOrder.id}</h4>
                <p className="text-[11px] text-blue-100">{selectedProofOrder.customer.fullName} - {selectedProofOrder.customer.phone}</p>
              </div>
              <button
                onClick={() => setSelectedProofOrder(null)}
                className="text-white/80 hover:text-white font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-900 flex items-center justify-center min-h-[320px] max-h-[70vh] overflow-auto">
              <img
                src={selectedProofOrder.paymentProofUrl}
                alt="Payment Slip Proof"
                referrerPolicy="no-referrer"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                ទឹកប្រាក់: ${selectedProofOrder.totalUSD.toFixed(2)} ({selectedProofOrder.totalKHR.toLocaleString()} ៛)
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedProofOrder.paymentProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>បើកទំព័រថ្មី</span>
                </a>
                <button
                  onClick={() => {
                    handleStatusChange(selectedProofOrder.id, 'paid');
                    setSelectedProofOrder(null);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>បញ្ជាក់ការបង់ប្រាក់</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceiptOrder && (
        <OrderReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
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
