import React, { useState } from 'react';
import { ArrowLeft, Layers, ShoppingBag, Plus, Minus, CreditCard, Check, Truck, Globe, PackageCheck, Boxes, Sparkles } from 'lucide-react';
import { Product, Currency, PriceMode, ProductPackagingOption } from '../types';
import { ProductBagIllustration } from '../components/ProductBagIllustration';
import { ProductSpecTable } from '../components/ProductSpecTable';
import { getProductDisplayPrice } from '../utils/pricing';

interface ProductDetailProps {
  product: Product;
  allProducts?: Product[];
  currency: Currency;
  priceMode?: PriceMode;
  onBack: () => void;
  onSelectProduct?: (p: Product) => void;
  onAddToCart?: (product: Product, quantity: number, selectedSize?: ProductPackagingOption) => void;
  onBuyNow?: (product: Product, quantity: number, selectedSize?: ProductPackagingOption) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  currency,
  priceMode = 'retail',
  onBack,
  onAddToCart,
  onBuyNow,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Initialize selected size with the default option if available
  const defaultSizeOpt = product.availableSizes?.find((s) => s.isDefault) || product.availableSizes?.[0];
  const [selectedSize, setSelectedSize] = useState<string>(defaultSizeOpt?.size || product.selectedSize || '');

  const activeSizeOpt = product.availableSizes?.find((s) => s.size === selectedSize) || defaultSizeOpt;

  const { priceUSD, priceKHR } = getProductDisplayPrice(product, priceMode, currency, selectedSize);
  const totalUSD = priceUSD * quantity;
  const totalKHR = priceKHR * quantity;

  const currentPackagingLabel = activeSizeOpt?.labelKh || product.packagingSize || 'បាវ';
  const currentWeightLabel = activeSizeOpt?.weight || product.weight;

  const isOverseasStock = product.stockStatus === 'overseas_stock';
  const stockQuantity = product.stockQty ?? 100;
  const stockUnitName = product.stockUnit || (product.groupId === 'machinery' ? 'គ្រឿង' : 'បាវ');

  const handleAdd = () => {
    if (onAddToCart) {
      const customizedProduct: Product = {
        ...product,
        selectedSize: selectedSize || undefined,
        packagingSize: currentPackagingLabel,
        weight: currentWeightLabel,
        price: activeSizeOpt ? activeSizeOpt.price : product.price,
      };
      onAddToCart(customizedProduct, quantity, activeSizeOpt);
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 2000);
    }
  };

  const handleBuy = () => {
    const customizedProduct: Product = {
      ...product,
      selectedSize: selectedSize || undefined,
      packagingSize: currentPackagingLabel,
      weight: currentWeightLabel,
      price: activeSizeOpt ? activeSizeOpt.price : product.price,
    };
    if (onBuyNow) {
      onBuyNow(customizedProduct, quantity, activeSizeOpt);
    } else if (onAddToCart) {
      onAddToCart(customizedProduct, quantity, activeSizeOpt);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-['Battambang']">
      {/* Top Back Bar & Category Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ត្រឡប់ទៅម៉ឺនុយទំនិញ</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-['Battambang']">
          {/* Stock Status Badge */}
          {isOverseasStock ? (
            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 border border-blue-300 font-bold px-3 py-1 rounded-full shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>មានស្ដុកនៅក្រៅប្រទេស</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-3 py-1 rounded-full shadow-2xs">
              <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>មានស្ដុកក្នុងស្រុក ({stockQuantity} {stockUnitName})</span>
            </span>
          )}

          {priceMode === 'wholesale' && (
            <span className="bg-amber-400 text-slate-900 font-bold px-3 py-1 rounded-full border border-amber-300 shadow-2xs">
              តម្លៃបោះដុំ (Wholesale)
            </span>
          )}
          <span className="bg-blue-50 text-[#1E5FA8] font-bold px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
            {product.categoryKh}
          </span>
        </div>
      </div>

      {/* Main Content: Product Image & Details / Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Image & Purchase Action Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col items-center justify-center shadow-xs overflow-hidden relative">
            {/* Stock Ribbon Badge */}
            <div className="absolute top-3 left-3 z-10">
              {isOverseasStock ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-600 text-white px-2.5 py-1 rounded-lg shadow-sm">
                  <Globe className="w-3 h-3" /> មានស្ដុកនៅក្រៅប្រទេស
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg shadow-sm">
                  <Check className="w-3 h-3" /> មានក្នុងស្តុក ({stockQuantity} {stockUnitName})
                </span>
              )}
            </div>

            <div className="w-full aspect-square max-w-sm rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-100 shadow-2xs mt-4">
              <ProductBagIllustration product={product} size="hero" className="w-full h-full" />
            </div>
          </div>

          {/* Quick Buy Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            
            {/* 1. Size / Packaging Selection (if available) */}
            {product.availableSizes && product.availableSizes.length > 0 && (
              <div className="space-y-2 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-['Battambang']">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>ជ្រើសរើសទំហំវេចខ្ចប់ (Select Size):</span>
                  </label>
                  <span className="text-[11px] font-mono text-blue-600 font-bold">
                    {currentPackagingLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {product.availableSizes.map((sizeOpt) => {
                    const isSelected = (selectedSize || defaultSizeOpt?.size) === sizeOpt.size;
                    const optDisplay = getProductDisplayPrice(product, priceMode, currency, sizeOpt.size);

                    return (
                      <button
                        key={sizeOpt.size}
                        type="button"
                        onClick={() => setSelectedSize(sizeOpt.size)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-400/50 shadow-xs'
                            : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className={`text-xs font-bold font-mono ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                          {sizeOpt.size}
                        </span>
                        <span className="text-[10px] text-slate-500 font-['Kantumruy_Pro'] truncate max-w-full">
                          {sizeOpt.weight || sizeOpt.size}
                        </span>
                        <span className={`text-[11px] font-bold font-mono mt-0.5 ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                          {currency === 'KHR'
                            ? `${optDisplay.priceKHR.toLocaleString()} ៛`
                            : `$${optDisplay.priceUSD.toFixed(2)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Price and Quantity */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  {priceMode === 'wholesale' ? 'តម្លៃបោះដុំ' : 'តម្លៃលក់រាយ'} ក្នុង ១ {currentPackagingLabel} ({currentWeightLabel}):
                </span>
                <div className={`text-2xl font-bold font-mono ${priceMode === 'wholesale' ? 'text-amber-600' : 'text-[#1E5FA8]'}`}>
                  {currency === 'KHR'
                    ? `${priceKHR.toLocaleString()} ៛`
                    : `$${priceUSD.toFixed(2)}`}
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-1 font-mono font-bold text-sm text-slate-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Total Preview */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between text-xs font-['Kantumruy_Pro']">
              <span className="text-slate-600">
                សរុប ({quantity} {currentPackagingLabel}):
              </span>
              <span className={`font-mono font-bold text-sm ${priceMode === 'wholesale' ? 'text-amber-700' : 'text-[#1E5FA8]'}`}>
                ${totalUSD.toFixed(2)} ({totalKHR.toLocaleString()} ៛)
              </span>
            </div>

            {/* Stock Information Notice */}
            <div className={`p-3 rounded-xl border text-xs font-['Kantumruy_Pro'] flex items-start gap-2.5 ${
              isOverseasStock
                ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}>
              {isOverseasStock ? (
                <>
                  <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">ទំនិញមានស្ដុកនៅក្រៅប្រទេស (Overseas Partner Stock)</span>
                    <span className="text-[11px] text-blue-700">
                      ស្តុកបច្ចុប្បន្ន៖ <strong>{stockQuantity} {stockUnitName}</strong> | រយៈពេលដឹកជញ្ជូនរហ័ស 3-7 ថ្ងៃមកដល់កម្ពុជា
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Boxes className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">ទំនិញមានក្នុងស្តុកឃ្លាំង (Local Warehouse Ready)</span>
                    <span className="text-[11px] text-emerald-700">
                      ស្តុកបច្ចុប្បន្ន៖ <strong>{stockQuantity} {stockUnitName}</strong> | អាចដឹកជញ្ជូនជូនភ្លាមៗទូទាំងប្រទេស
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleAdd}
                className="py-3 px-4 bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>បានដាក់ក្នុងកន្ត្រក!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>ដាក់ក្នុងកន្ត្រក</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuy}
                className="py-3 px-4 bg-[#1E5FA8] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>ទិញឥឡូវនេះ (Buy Now)</span>
              </button>
            </div>

            {/* Delivery Assurance Notice */}
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 font-['Kantumruy_Pro'] border-t border-slate-100">
              <Truck className="w-4 h-4 text-[#1E5FA8] shrink-0" />
              <span>
                ដឹកជញ្ជូនលឿនរហ័សទូទាំង ២៤ ខេត្ត និងរាជធានីភ្នំពេញ តាមរយៈ វីរៈប៊ុនថាំ (VET Express)
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: ព័ត៌មានលម្អិត និងលក្ខណៈបច្ចេកទេស */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-['Battambang'] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#1E5FA8]" />
            ព័ត៌មានលម្អិត និងលក្ខណៈបច្ចេកទេស
          </h2>
          <ProductSpecTable product={product} currency={currency} />
        </div>
      </div>
    </div>
  );
};



