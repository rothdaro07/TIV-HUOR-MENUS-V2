import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Truck,
  MapPin,
  Phone,
  User,
  CheckSquare,
  Square,
  CreditCard,
  Building2,
  Home,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileText,
  DollarSign,
  QrCode,
  Clock,
  Send,
} from 'lucide-react';
import {
  CartItem,
  Currency,
  CompanyProfile,
  DeliveryMethod,
  OrderCustomerInfo,
  Order,
  BankPaymentAccount,
  PurchaseChannel,
  PaymentTypeOption,
} from '../types';
import { CAMBODIA_PROVINCES } from '../data/cambodiaProvinces';
import { calculateVetDeliveryFee } from '../utils/deliveryCalculator';
import { EXCHANGE_RATE_KHR, INITIAL_BANK_ACCOUNTS } from '../data/initialProducts';
import { ProductBagIllustration } from './ProductBagIllustration';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems?: CartItem[];
  items?: CartItem[];
  currency: Currency;
  companyProfile?: CompanyProfile;
  bankAccounts?: BankPaymentAccount[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderCompleted: (order: Order) => void;
}

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  cartItems: propCartItems,
  items: propItems,
  currency,
  companyProfile,
  bankAccounts = INITIAL_BANK_ACCOUNTS,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
}) => {
  const cartItems = useMemo(() => propCartItems || propItems || [], [propCartItems, propItems]);

  // Checkbox 1: Purchase Type / Channel
  // 'online' = ទិញតាមរយះ Online
  // 'direct' = ផ្ទាល់ (ទិញផ្ទាល់នៅហាង/ដេប៉ូ)
  const [purchaseChannel, setPurchaseChannel] = useState<PurchaseChannel>('online');

  // Checkbox 2: Payment Method
  // 'cash' = ទូទាត់លុយសុទ្ធ
  // 'scan_qr' = Scan QR
  // 'credit_unpaid' = ជំពាក់ មិនទាន់ទូទាត់
  const [paymentType, setPaymentType] = useState<PaymentTypeOption>('cash');

  // Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState('phnom-penh');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('branch');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [districtVillage, setDistrictVillage] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Selected Province Object
  const currentProvince = useMemo(() => {
    return CAMBODIA_PROVINCES.find((p) => p.id === selectedProvinceId) || CAMBODIA_PROVINCES[0];
  }, [selectedProvinceId]);

  // Set default branch when province changes
  React.useEffect(() => {
    if (currentProvince.popularBranches.length > 0) {
      setSelectedBranch(currentProvince.popularBranches[0]);
    }
  }, [currentProvince]);

  // Products Subtotal
  const subtotalUSD = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const subtotalKHR = Math.round(subtotalUSD * EXCHANGE_RATE_KHR);

  // Delivery Fee Calculation (Only applies if Online purchase)
  const deliveryCalc = useMemo(() => {
    if (purchaseChannel === 'direct') {
      return {
        totalActualWeightKg: cartItems.reduce(
          (acc, item) => acc + (parseFloat(item.product.weight) || 50) * item.quantity,
          0
        ),
        totalVolumetricWeightKg: 0,
        billableWeightKg: 0,
        weightTier: 'small' as const,
        baseRateUSD: 0,
        weightFeeUSD: 0,
        doorDeliveryFeeUSD: 0,
        totalFeeUSD: 0,
        totalFeeKHR: 0,
        ratePerKgUSD: 0,
        breakdownKh: 'ទិញផ្ទាល់នៅដេប៉ូ/ហាង (មិនគិតសេវាដឹក)',
        estimatedDeliveryTime: 'ភ្លាមៗ (ទទួលទំនិញផ្ទាល់)',
      };
    }
    return calculateVetDeliveryFee(cartItems, selectedProvinceId, deliveryMethod);
  }, [cartItems, selectedProvinceId, deliveryMethod, purchaseChannel]);

  const grandTotalUSD = Math.round((subtotalUSD + deliveryCalc.totalFeeUSD) * 100) / 100;
  const grandTotalKHR = Math.round(grandTotalUSD * EXCHANGE_RATE_KHR);

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (!isOpen) return null;

  // Handle finalize order submission and receipt generation
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (cartItems.length === 0) {
      setFormError('កន្ត្រកទំនិញនៅទទេ សូមជ្រើសរើសទំនិញជាមុនសិន!');
      return;
    }

    finalizeAndGenerateReceipt();
  };

  const finalizeAndGenerateReceipt = () => {
    const orderId = `TH-${Date.now().toString().slice(-6)}`;

    const customerInfo: OrderCustomerInfo = {
      fullName: customerName.trim() || 'អតិថិជនទូទៅ (Customer)',
      phone: customerPhone.trim() || 'មិនបានបញ្ជាក់ (N/A)',
      provinceId: purchaseChannel === 'online' ? selectedProvinceId : 'direct-store',
      districtVillage: purchaseChannel === 'online' ? (districtVillage.trim() || 'ទិញតាមអនឡាញ') : 'ទិញផ្ទាល់នៅហាង/ដេប៉ូ',
      deliveryMethod: purchaseChannel === 'online' ? deliveryMethod : 'branch',
      selectedBranch: (purchaseChannel === 'online' && deliveryMethod === 'branch' && selectedBranch) ? selectedBranch : '',
      notes: notes || '',
    };

    // Determine status:
    // - If 'cash': status is 'paid'
    // - If 'credit_unpaid': pending_payment (marked as credit/unpaid)
    let orderStatus: Order['status'] = 'paid';
    if (paymentType === 'credit_unpaid') {
      orderStatus = 'pending_payment';
    } else {
      orderStatus = 'paid';
    }

    const newOrder: Order = {
      id: orderId,
      items: [...cartItems],
      customer: customerInfo,
      deliveryFee: deliveryCalc,
      subtotalUSD,
      subtotalKHR,
      totalUSD: grandTotalUSD,
      totalKHR: grandTotalKHR,
      status: orderStatus,
      purchaseChannel,
      paymentType,
      paymentMethod:
        paymentType === 'cash'
          ? 'cash'
          : paymentType === 'scan_qr'
          ? 'bakong_khqr'
          : 'credit',
      khqrRef: paymentType === 'scan_qr' ? `QR-${orderId}` : `REF-${orderId}`,
      createdAt: new Date().toISOString(),
    };

    onClearCart();
    onOrderCompleted(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-['Battambang']">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 bg-[#1E5FA8] text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-['Battambang'] leading-tight">
                  កន្ត្រកទំនិញ & បញ្ជាក់ការទិញ
                </h2>
                <p className="text-[11px] text-blue-100 font-['Kantumruy_Pro']">
                  ជ្រើសរើសប្រភេទការទិញ និងវិធីទូទាត់ប្រាក់ ព្រមទាំងចេញវិក្កយបត្រជូនអតិថិជន
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Empty State */}
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 bg-blue-50 text-[#1E5FA8] rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-10 h-10 opacity-70" />
                </div>
                <h3 className="text-base font-bold text-slate-800 font-['Battambang']">
                  កន្ត្រកទំនិញរបស់អ្នកនៅទទេ
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto font-['Kantumruy_Pro']">
                  សូមជ្រើសរើសមុខជីកសិកម្ម ឬជីសរីរាង្គដែលលោកអ្នកត្រូវការដើម្បីបន្ថែមក្នុងកន្ត្រក
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#1E5FA8] hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  ទៅកាន់កាតាឡុកទំនិញ
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="space-y-6">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-['Kantumruy_Pro']">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. CART ITEMS LIST */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-['Battambang'] flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#1E5FA8]" />
                      <span>មុខទំនិញដែលបានជ្រើសរើស ({totalItemsCount} បាវ)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="text-[11px] text-red-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>សម្អាតកន្ត្រក</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs max-h-56 overflow-y-auto">
                    {cartItems.map((item) => {
                      const priceUSD = item.product.price;
                      const priceKHR = Math.round(priceUSD * EXCHANGE_RATE_KHR);
                      const itemTotalUSD = priceUSD * item.quantity;
                      const itemTotalKHR = Math.round(itemTotalUSD * EXCHANGE_RATE_KHR);

                      return (
                        <div
                          key={item.product.id}
                          className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="w-12 h-14 bg-slate-100 rounded-xl border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
                            <ProductBagIllustration
                              product={item.product}
                              size="sm"
                              showGranulesBadge={false}
                              className="w-full h-full"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#1E5FA8] text-xs sm:text-sm font-['Battambang'] truncate">
                              {item.product.nameKh}
                            </h4>
                            <p className="text-[10px] font-mono text-slate-500 font-semibold truncate">
                              {item.product.npk} • {item.product.packagingSize || item.product.weight}
                            </p>
                            <div className="mt-0.5 font-mono font-bold text-xs text-slate-800">
                              {currency === 'KHR'
                                ? `${priceKHR.toLocaleString()} ៛`
                                : `$${priceUSD.toFixed(2)}`}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.product.id, -1)}
                                className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 py-0.5 text-xs font-mono font-bold text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.product.id, 1)}
                                className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#1E5FA8]">
                              ${itemTotalUSD.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. CHECKBOX SECTION 1: PURCHASE CHANNEL (ទិញតាមរយះ Online ឬ ផ្ទាល់) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider font-['Battambang'] flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#1E5FA8]" />
                      <span>ប្រភេទការទិញ (Purchase Option)</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-semibold">ជ្រើសរើសមួយ</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-['Battambang']">
                    {/* Checkbox: ទិញតាមរយះ Online */}
                    <div
                      onClick={() => setPurchaseChannel('online')}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        purchaseChannel === 'online'
                          ? 'border-[#1E5FA8] bg-blue-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 text-[#1E5FA8]">
                        {purchaseChannel === 'online' ? (
                          <CheckSquare className="w-5 h-5 fill-[#1E5FA8] text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          ទិញតាមរយះ Online
                        </div>
                        <p className="text-[11px] text-slate-500 font-['Kantumruy_Pro'] mt-0.5">
                          ដឹកជញ្ជូនតាម VET Express ទៅកាន់ ២៥ ខេត្ត/ក្រុង
                        </p>
                      </div>
                    </div>

                    {/* Checkbox: ផ្ទាល់ */}
                    <div
                      onClick={() => setPurchaseChannel('direct')}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        purchaseChannel === 'direct'
                          ? 'border-[#1E5FA8] bg-blue-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 text-[#1E5FA8]">
                        {purchaseChannel === 'direct' ? (
                          <CheckSquare className="w-5 h-5 fill-[#1E5FA8] text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          ផ្ទាល់ (In-Person Store)
                        </div>
                        <p className="text-[11px] text-slate-500 font-['Kantumruy_Pro'] mt-0.5">
                          ទិញផ្ទាល់នៅដេប៉ូ ឬហាង (មិនគិតសេវាដឹក)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. CHECKBOX SECTION 2: PAYMENT METHOD (ទូទាត់លុយសុទ្ធ, Scan QR, ជំពាក់ មិនទាន់ទូទាត់) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider font-['Battambang'] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#1E5FA8]" />
                      <span>វិធីទូទាត់ប្រាក់ (Payment Method)</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-semibold">ជ្រើសរើសមួយ</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-['Battambang']">
                    {/* Checkbox: ទូទាត់លុយសុទ្ធ */}
                    <div
                      onClick={() => setPaymentType('cash')}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        paymentType === 'cash'
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 text-emerald-600">
                        {paymentType === 'cash' ? (
                          <CheckSquare className="w-5 h-5 fill-emerald-600 text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          ទូទាត់លុយសុទ្ធ (Cash)
                        </div>
                        <p className="text-[11px] text-slate-500 font-['Kantumruy_Pro'] mt-0.5">
                          ទូទាត់ជាសាច់ប្រាក់សុទ្ធផ្ទាល់
                        </p>
                      </div>
                    </div>

                    {/* Checkbox: Scan QR */}
                    <div
                      onClick={() => setPaymentType('scan_qr')}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        paymentType === 'scan_qr'
                          ? 'border-[#1E5FA8] bg-blue-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 text-[#1E5FA8]">
                        {paymentType === 'scan_qr' ? (
                          <CheckSquare className="w-5 h-5 fill-[#1E5FA8] text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          Scan QR (KHQR)
                        </div>
                        <p className="text-[11px] text-slate-500 font-['Kantumruy_Pro'] mt-0.5">
                          ទូទាត់តាម Scan QR / KHQR
                        </p>
                      </div>
                    </div>

                    {/* Checkbox: ជំពាក់ មិនទាន់ទូទាត់ */}
                    <div
                      onClick={() => setPaymentType('credit_unpaid')}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        paymentType === 'credit_unpaid'
                          ? 'border-amber-600 bg-amber-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 text-amber-600">
                        {paymentType === 'credit_unpaid' ? (
                          <CheckSquare className="w-5 h-5 fill-amber-600 text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          ជំពាក់ (Credit)
                        </div>
                        <p className="text-[11px] text-slate-500 font-['Kantumruy_Pro'] mt-0.5">
                          កត់ត្រាជំពាក់ មិនទាន់ទូទាត់
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* If Scan QR selected, show helper info */}
                  {paymentType === 'scan_qr' && (
                    <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2 font-['Kantumruy_Pro']">
                      <QrCode className="w-4 h-4 shrink-0 text-[#1E5FA8]" />
                      <span>
                        ការកុម្ម៉ង់នឹងត្រូវកត់ត្រាជា <strong>«ទូទាត់តាម Scan QR»</strong> និងបញ្ចេញវិក្កយបត្រជូនអតិថិជនភ្លាមៗ។
                      </span>
                    </div>
                  )}

                  {/* If Credit/Unpaid selected, show warning note */}
                  {paymentType === 'credit_unpaid' && (
                    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 font-['Kantumruy_Pro']">
                      <Clock className="w-4 h-4 shrink-0 text-amber-700" />
                      <span>
                        ការកុម្ម៉ង់នេះនឹងត្រូវកត់ត្រាជា <strong>«ជំពាក់ មិនទាន់ទូទាត់»</strong> នៅក្នុងប្រព័ន្ធ និងបញ្ចេញវិក្កយបត្រជំពាក់ជូនអតិថិជន។
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. PRICE & TOTAL SUMMARY */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-['Kantumruy_Pro']">
                  <div className="flex justify-between text-slate-600">
                    <span>តម្លៃទំនិញសរុប (Subtotal):</span>
                    <span className="font-mono font-bold text-slate-800">
                      ${subtotalUSD.toFixed(2)} ({subtotalKHR.toLocaleString()} ៛)
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>
                      {purchaseChannel === 'direct'
                        ? 'សេវាដឹកជញ្ជូន (ទិញផ្ទាល់):'
                        : `សេវាដឹក VET Express (${deliveryCalc.totalActualWeightKg} kg):`}
                    </span>
                    <span className="font-mono font-bold text-[#1E5FA8]">
                      {purchaseChannel === 'direct'
                        ? '$0.00 (ឥតគិតថ្លៃ)'
                        : `$${deliveryCalc.totalFeeUSD.toFixed(2)} (${deliveryCalc.totalFeeKHR.toLocaleString()} ៛)`}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2 font-['Battambang']">
                    <span>ទឹកប្រាក់សរុបរួម (Grand Total):</span>
                    <div className="text-right font-mono text-[#1E5FA8]">
                      <div>${grandTotalUSD.toFixed(2)}</div>
                      <div className="text-xs text-slate-500 font-semibold">
                        ~ {grandTotalKHR.toLocaleString()} ៛ KHR
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. SUBMIT BUTTON & GENERATE RECEIPT */}
                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#1E5FA8] hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 font-['Battambang'] cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>
                      បញ្ជាក់ការកុម្ម៉ង់ & ចេញវិក្កយបត្រ (${grandTotalUSD.toFixed(2)})
                    </span>
                  </button>

                  <p className="text-center text-[11px] text-slate-400 font-['Kantumruy_Pro']">
                    ប្រព័ន្ធនឹងបង្កើតវិក្កយបត្រ (Receipt) ផ្លូវការជូនអតិថិជន និងកត់ត្រាទុកភ្លាមៗ
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
