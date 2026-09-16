import React from 'react';
import {
  CheckCircle2,
  Printer,
  Send,
  ShoppingBag,
  Truck,
  MapPin,
  Phone,
  User,
  Calendar,
  ArrowRight,
  Share2,
  CreditCard,
  Clock,
  CheckSquare,
  Building2,
} from 'lucide-react';
import { Order, CompanyProfile } from '../types';
import { CAMBODIA_PROVINCES } from '../data/cambodiaProvinces';
import { ProductBagIllustration } from './ProductBagIllustration';

interface OrderReceiptModalProps {
  order: Order;
  companyProfile?: CompanyProfile;
  isOpen?: boolean;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  companyProfile,
  isOpen = true,
  onClose,
}) => {
  if (isOpen === false) return null;
  const province = CAMBODIA_PROVINCES.find((p) => p.id === order.customer?.provinceId);

  const purchaseTypeLabel =
    order.purchaseChannel === 'direct'
      ? 'ទិញផ្ទាល់ (In-Person / Store)'
      : 'ទិញតាមរយះ Online (VET Express)';

  const paymentTypeLabel =
    order.paymentType === 'cash'
      ? 'ទូទាត់លុយសុទ្ធ (Cash)'
      : order.paymentType === 'credit_unpaid'
      ? 'ជំពាក់ មិនទាន់ទូទាត់ (Credit/Unpaid)'
      : order.paymentType === 'scan_qr'
      ? (order.selectedBankName ? `Scan QR (${order.selectedBankName})` : 'ទូទាត់តាម Scan QR (KHQR)')
      : 'ទូទាត់លុយសុទ្ធ (Cash)';

  const isCreditUnpaid = order.paymentType === 'credit_unpaid';

  const handlePrint = () => {
    window.print();
  };

  const handleSendTelegram = () => {
    const telegramUrl = companyProfile?.telegram || 'https://t.me/loy_media';
    const lines = [
      `🌾 *វិក្កយបត្របញ្ជាទិញជីកសិកម្ម (Fertilizer Receipt)*`,
      `📄 លេខកូដវិក្កយបត្រ: \`${order.id}\``,
      `👤 អតិថិជន: ${order.customer?.fullName || 'អតិថិជន'}`,
      `📞 លេខទូរស័ព្ទ: ${order.customer?.phone || '-'}`,
      `🛒 ប្រភេទការទិញ: ${purchaseTypeLabel}`,
      order.purchaseChannel === 'direct'
        ? `📍 ទីតាំង: ទទួលទំនិញផ្ទាល់នៅហាង/ដេប៉ូ`
        : `📍 ទីតាំងដឹក: ${province?.nameKh || ''} ${order.customer?.districtVillage ? `- ${order.customer.districtVillage}` : ''}`,
      `💳 វិធីទូទាត់: ${paymentTypeLabel}`,
      `-----------------------------`,
      ...((order?.items || []).map(
        (i) =>
          `• ${i.product.nameKh} (${i.product.weight || ''}) x ${i.quantity} = $${(i.product.price * i.quantity).toFixed(2)}`
      )),
      `-----------------------------`,
      `💰 តម្លៃទំនិញ: $${order.subtotalUSD.toFixed(2)}`,
      order.purchaseChannel === 'direct'
        ? `🚛 សេវាដឹក: $0.00 (ទិញផ្ទាល់)`
        : `🚛 សេវាដឹក VET: $${order.deliveryFee?.totalFeeUSD?.toFixed(2) || '0.00'}`,
      `💵 សរុបរួម: *$${order.totalUSD.toFixed(2)} (${order.totalKHR.toLocaleString()} ៛)*`,
      `📊 ស្ថានភាព: ${isCreditUnpaid ? '⚠️ ជំពាក់ មិនទាន់ទូទាត់' : '✅ បានទូទាត់រួចរាល់'}`,
    ];

    const message = encodeURIComponent(lines.join('\n'));
    window.open(`${telegramUrl}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-['Battambang']">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-200 animate-scale-in my-auto">
        {/* Header with Success / Status Badge */}
        <div className="text-center space-y-2">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-inner ${
              isCreditUnpaid
                ? 'bg-amber-100 text-amber-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {isCreditUnpaid ? <Clock className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-['Battambang']">
            {isCreditUnpaid
              ? 'វិក្កយបត្រកត់ត្រាជំពាក់ (Credit Invoice)'
              : 'ការបញ្ជាទិញត្រូវបានជោគជ័យ!'}
          </h3>
          <p className="text-xs text-slate-500 font-['Kantumruy_Pro']">
            {companyProfile?.nameKh || 'ក្រុមហ៊ុន ទីវ ហៃ (ខេមបូឌា)'} • វិក្កយបត្រ & បង្កាន់ដៃទទួលទំនិញ
          </p>

          {/* Status Tag */}
          <div className="flex flex-wrap justify-center items-center gap-2 pt-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-['Kantumruy_Pro'] border ${
                isCreditUnpaid
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}
            >
              {isCreditUnpaid ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{isCreditUnpaid ? 'ជំពាក់ មិនទាន់ទូទាត់' : 'បានបញ្ជាក់ការទូទាត់រួចរាល់'}</span>
            </span>

            {order.telegramNotified && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#0088cc] border border-blue-200 rounded-full text-xs font-bold font-['Kantumruy_Pro']">
                <Send className="w-3.5 h-3.5" />
                <span>Telegram Bot ✓</span>
              </span>
            )}
          </div>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-3 font-['Kantumruy_Pro']">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <span className="text-slate-400 text-[10px] block">លេខវិក្កយបត្រ (Invoice No):</span>
              <span className="font-mono font-bold text-[#1E5FA8] text-sm">#{order.id}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[10px] block">កាលបរិច្ឆេទ:</span>
              <span className="text-slate-700 font-medium">
                {new Date(order.createdAt).toLocaleDateString('km-KH')}
              </span>
            </div>
          </div>

          {/* Purchase Type & Payment Type Highlights */}
          <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-slate-400 block text-[10px]">ប្រភេទការទិញ:</span>
              <span className="font-bold text-slate-800 font-['Battambang'] flex items-center gap-1 mt-0.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#1E5FA8]" />
                <span>{order.purchaseChannel === 'direct' ? 'ទិញផ្ទាល់' : 'ទិញតាមរយះ Online'}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">វិធីទូទាត់:</span>
              <span
                className={`font-bold font-['Battambang'] flex items-center gap-1 mt-0.5 ${
                  isCreditUnpaid
                    ? 'text-amber-700'
                    : order.paymentType === 'cash'
                    ? 'text-emerald-700'
                    : 'text-[#1E5FA8]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>
                  {order.paymentType === 'cash'
                    ? 'ទូទាត់លុយសុទ្ធ'
                    : order.paymentType === 'scan_qr'
                    ? 'Scan QR'
                    : order.paymentType === 'credit_unpaid'
                    ? 'ជំពាក់ មិនទាន់ទូទាត់'
                    : 'ទូទាត់លុយសុទ្ធ'}
                </span>
              </span>
            </div>
          </div>

          {/* Customer & Delivery location info (shown if provided) */}
          <div className="grid grid-cols-2 gap-2 text-slate-700">
            {order.customer?.fullName && order.customer.fullName !== 'អតិថិជនទូទៅ (Customer)' && (
              <div>
                <span className="text-slate-400 block text-[10px]">អតិថិជន:</span>
                <span className="font-bold font-['Battambang']">{order.customer.fullName}</span>
              </div>
            )}
            {order.customer?.phone && order.customer.phone !== 'មិនបានបញ្ជាក់ (N/A)' && (
              <div>
                <span className="text-slate-400 block text-[10px]">លេខទូរស័ព្ទ:</span>
                <span className="font-mono font-bold">{order.customer.phone}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-slate-400 block text-[10px]">
                {order.purchaseChannel === 'direct' ? 'ទីតាំងទទួលទំនិញ:' : 'ទីតាំងដឹកជញ្ជូន (Logistics):'}
              </span>
              <span className="font-medium font-['Battambang'] text-slate-800">
                {order.purchaseChannel === 'direct' ? (
                  'ទទួលទំនិញផ្ទាល់នៅហាង/ដេប៉ូ'
                ) : (
                  <>
                    {province?.nameKh || 'ដឹកជញ្ជូនទូទាំងប្រទេស (VET Express)'}{' '}
                    {order.customer?.districtVillage && order.customer.districtVillage !== 'ទិញតាមអនឡាញ' && `- ${order.customer.districtVillage}`}
                    {order.customer?.deliveryMethod === 'branch' && order.customer.selectedBranch && (
                      <span className="text-[#1E5FA8] block text-[11px]">
                        (សាខា VET ទទួល: {order.customer.selectedBranch})
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-['Battambang']">
            មុខទំនិញដែលបានកុម្ម៉ង់ ({((order?.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0))} មុខ)
          </h4>
          <div className="max-h-44 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {(order?.items || []).map((item, idx) => (
              <div key={idx} className="pt-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                    <ProductBagIllustration
                      product={item.product}
                      size="sm"
                      showGranulesBadge={false}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate font-['Battambang'] text-[11px]">
                      {item.product.nameKh}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.product.weight} × {item.quantity} បាវ
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-slate-800 shrink-0">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Totals */}
        <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 text-xs space-y-1.5 font-['Kantumruy_Pro']">
          <div className="flex justify-between text-slate-600">
            <span>តម្លៃទំនិញសរុប (Subtotal):</span>
            <span className="font-mono font-semibold">${order.subtotalUSD.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>
              {order.purchaseChannel === 'direct'
                ? 'សេវាដឹក (ទិញផ្ទាល់):'
                : `សេវាដឹកជញ្ជូន VET (${order.deliveryFee?.totalActualWeightKg || 0} kg):`}
            </span>
            <span className="font-mono font-semibold">
              {order.purchaseChannel === 'direct'
                ? '$0.00'
                : `$${order.deliveryFee?.totalFeeUSD?.toFixed(2) || '0.00'}`}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-blue-200 pt-1.5 font-['Battambang']">
            <span>ទឹកប្រាក់សរុបរួម (Grand Total):</span>
            <div className="text-right font-mono text-[#1E5FA8]">
              <div>${order.totalUSD.toFixed(2)}</div>
              <div className="text-[11px] text-slate-500 font-normal">
                ~ {order.totalKHR.toLocaleString()} ៛
              </div>
            </div>
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="space-y-2 pt-1 font-['Kantumruy_Pro']">
          <button
            type="button"
            onClick={handleSendTelegram}
            className="w-full py-2.5 bg-[#229ED9] hover:bg-[#1e8bc0] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>ផ្ញើបង្កាន់ដៃ/វិក្កយបត្រទៅ Telegram ក្រុមហ៊ុន</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>បោះពុម្ពវិក្កយបត្រ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 bg-[#1E5FA8] hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer font-['Battambang']"
            >
              <span>បន្តទិញទំនិញ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
