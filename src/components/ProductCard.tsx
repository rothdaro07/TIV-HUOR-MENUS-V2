import React from 'react';
import { Eye, Plus, Layers } from 'lucide-react';
import { Product, Currency, PriceMode } from '../types';
import { ProductBagIllustration } from './ProductBagIllustration';
import { getProductDisplayPrice } from '../utils/pricing';

interface ProductCardProps {
  product: Product;
  currency: Currency;
  priceMode?: PriceMode;
  onSelect: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  priceMode = 'retail',
  onSelect,
  onAddToCart,
}) => {
  const { priceUSD, priceKHR } = getProductDisplayPrice(product, priceMode, currency);

  const sizeCount = product.availableSizes?.length || 0;

  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-blue-400 hover:shadow-md transition-all">
      {/* Product Bag / Photo Image (Full frame edge-to-edge) */}
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-square w-full bg-slate-100 flex items-center justify-center cursor-pointer overflow-hidden border-b border-slate-100 group-hover:bg-blue-50/40 transition-colors"
      >
        <ProductBagIllustration product={product} size="md" className="w-full h-full" />
        
        {/* Size Options Badge (Top-Left) */}
        {sizeCount > 1 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-xs text-slate-800 border border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded-md font-['Kantumruy_Pro'] shadow-xs">
              <Layers className="w-2.5 h-2.5 text-blue-600" />
              <span>{sizeCount} ខ្នាតទំហំ</span>
            </span>
          </div>
        )}

        {/* Wholesale Badge (Top-Right) */}
        {priceMode === 'wholesale' && (
          <div className="absolute top-2 right-2 bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-md font-['Battambang'] shadow-xs border border-amber-300 z-10">
            បោះដុំ
          </div>
        )}
      </div>

      {/* Card Content: Name, Weight, Price, Action Buttons */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-3">
        <div>
          {/* Product Name */}
          <h3
            onClick={() => onSelect(product)}
            className="font-bold text-[#1E5FA8] text-xs sm:text-base font-['Battambang'] cursor-pointer hover:text-blue-700 transition-colors line-clamp-1"
          >
            {product.nameKh}
          </h3>

          {/* Product English / NPK Name */}
          <p className="font-mono text-[10px] sm:text-xs font-semibold text-slate-600 truncate mt-0.5">
            {product.name}
          </p>
        </div>

        {/* Weight & Price */}
        <div className="pt-1.5 sm:pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
          <div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-['Battambang'] block">
              ទម្ងន់: <span className="font-bold font-mono text-slate-700">{product.weight}</span>
            </span>
          </div>

          <div className="text-right">
            {currency === 'KHR' ? (
              <>
                <div className={`text-xs sm:text-base font-bold font-mono ${priceMode === 'wholesale' ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {priceKHR.toLocaleString()} ៛
                </div>
                <div className="text-[9px] sm:text-[10px] font-mono text-slate-400">
                  ~${priceUSD.toFixed(2)}
                </div>
              </>
            ) : (
              <>
                <div className={`text-xs sm:text-base font-bold font-mono ${priceMode === 'wholesale' ? 'text-amber-600' : 'text-[#1E5FA8]'}`}>
                  ${priceUSD.toFixed(2)}
                </div>
                <div className="text-[9px] sm:text-[10px] font-mono text-slate-400">
                  ~{priceKHR.toLocaleString()} ៛
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons: Add to Cart & View Details */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product);
            }}
            className="py-1.5 sm:py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs font-['Battambang'] cursor-pointer"
            title="ដាក់ក្នុងកន្ត្រកទំនិញ"
          >
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>កុម្ម៉ង់ទិញ</span>
          </button>

          <button
            type="button"
            onClick={() => onSelect(product)}
            className="py-1.5 sm:py-2 px-2 bg-[#1E5FA8] hover:bg-blue-800 text-white text-[10px] sm:text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs font-['Battambang'] cursor-pointer"
          >
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>លម្អិត</span>
          </button>
        </div>
      </div>
    </div>
  );
};

