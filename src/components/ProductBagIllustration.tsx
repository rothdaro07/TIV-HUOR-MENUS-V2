import React from 'react';
import { Product } from '../types';
import { Tractor, FlaskConical, Sprout, Layers, Wrench, Sparkles, ShieldCheck } from 'lucide-react';

interface ProductBagIllustrationProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showGranulesBadge?: boolean;
  className?: string;
}

export const ProductBagIllustration: React.FC<ProductBagIllustrationProps> = ({
  product,
  size = 'md',
  showGranulesBadge = true,
  className = '',
}) => {
  // If product has a direct custom image URL that starts with http or data:
  if (product.imageUrl && (product.imageUrl.startsWith('http') || product.imageUrl.startsWith('data:image'))) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden w-full h-full bg-slate-50 ${className}`}>
        <img
          src={product.imageUrl}
          alt={product.nameKh}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    );
  }

  // Dimension presets with clean aspect ratios
  const sizeStyles = {
    sm: 'w-14 h-20 sm:w-20 sm:h-28 text-[7px]',
    md: 'w-28 h-38 sm:w-36 sm:h-48 md:w-40 md:h-52 text-[8px] sm:text-[9px]',
    lg: 'w-44 h-58 sm:w-56 sm:h-72 text-xs',
    hero: 'w-56 h-76 sm:w-72 sm:h-96 md:w-80 md:h-[420px] text-sm',
  }[size];

  // Specific visual for Agricultural Machinery (គ្រឿងចក្រកសិកម្ម)
  if (product.groupId === 'machinery') {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <div
          className={`relative ${sizeStyles} rounded-xl sm:rounded-2xl shadow-md flex flex-col justify-between overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 text-white border border-amber-300/40 p-2 sm:p-3 transition-all duration-300`}
        >
          {/* Top Brand Banner */}
          <div className="flex items-center justify-between text-[7px] sm:text-[9px] border-b border-amber-300/30 pb-1">
            <span className="font-bold font-['Battambang'] flex items-center gap-1 text-white">
              <Tractor className="w-3 h-3 text-amber-100" />
              គ្រឿងចក្រ
            </span>
            <span className="font-mono font-bold bg-black/30 px-1.5 py-0.2 rounded text-[7px]">
              TIV HAI
            </span>
          </div>

          {/* Center Graphic */}
          <div className="my-auto flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner border border-white/30 mb-1 sm:mb-2">
              <Tractor className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-md" />
            </div>
            <div className="font-black font-mono text-[9px] sm:text-xs bg-slate-950/80 text-amber-300 px-2 py-0.5 rounded-md shadow-xs border border-amber-400/40">
              {product.npk || 'MACHINERY'}
            </div>
          </div>

          {/* Bottom Info */}
          <div className="border-t border-amber-300/30 pt-1 flex items-center justify-between text-[6.5px] sm:text-[8px] font-['Battambang']">
            <span className="truncate text-amber-100 max-w-[65%] font-bold">
              {product.categoryKh}
            </span>
            <span className="font-mono bg-white text-slate-900 font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
              {product.weight}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Specific visual for Raw Materials (វត្ថុធាតុដើម)
  if (product.groupId === 'raw_material') {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <div
          className={`relative ${sizeStyles} rounded-xl sm:rounded-2xl shadow-md flex flex-col justify-between overflow-hidden bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-950 text-white border border-purple-400/30 p-2 sm:p-3 transition-all duration-300`}
        >
          {/* Top Brand Banner */}
          <div className="flex items-center justify-between text-[7px] sm:text-[9px] border-b border-purple-400/30 pb-1">
            <span className="font-bold font-['Battambang'] flex items-center gap-1 text-purple-200">
              <Layers className="w-3 h-3 text-purple-300" />
              វត្ថុធាតុដើម
            </span>
            <span className="font-mono font-bold bg-white/10 px-1.5 py-0.2 rounded text-[7px]">
              GRADE-A
            </span>
          </div>

          {/* Center Graphic */}
          <div className="my-auto flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-purple-500/20 backdrop-blur-xs flex items-center justify-center shadow-inner border border-purple-400/30 mb-1 sm:mb-2">
              <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-purple-200 drop-shadow-md" />
            </div>
            <div className="font-black font-mono text-[9px] sm:text-xs bg-slate-950/80 text-purple-300 px-2 py-0.5 rounded-md shadow-xs border border-purple-400/40">
              {product.npk}
            </div>
          </div>

          {/* Bottom Info */}
          <div className="border-t border-purple-400/30 pt-1 flex items-center justify-between text-[6.5px] sm:text-[8px] font-['Battambang']">
            <span className="truncate text-purple-200 max-w-[65%] font-bold">
              {product.categoryKh}
            </span>
            <span className="font-mono bg-white text-slate-900 font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
              {product.weight}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Bag color themes based on the authentic Tiv Huor package styles for Fertilizers
  const theme = product.bagColorTheme || 'rainbow';

  const bagBg = {
    rainbow: 'from-sky-700 via-sky-600 to-blue-800',
    green: 'from-emerald-700 via-emerald-800 to-teal-950',
    yellow: 'from-amber-500 via-yellow-500 to-amber-600',
    black: 'from-zinc-800 via-neutral-900 to-zinc-950',
    red: 'from-rose-700 via-red-600 to-red-800',
    blue: 'from-blue-700 via-indigo-800 to-blue-950',
    purple: 'from-purple-800 via-indigo-900 to-slate-900',
  }[theme];

  // Granule appearance colors
  const granuleColorMap: Record<string, string> = {
    'mixed-pink-white': 'from-rose-300 via-stone-300 to-emerald-200',
    'white-pearl': 'from-slate-100 via-white to-sky-100',
    'green-granule': 'from-emerald-500 via-teal-600 to-lime-400',
    'red-potash': 'from-red-600 via-rose-500 to-amber-700',
    'black-dap': 'from-zinc-700 via-slate-800 to-stone-900',
    'grey-pellet': 'from-stone-300 via-slate-400 to-zinc-500',
    'organic-brown': 'from-amber-900 via-stone-800 to-yellow-950',
  };

  const granuleGrad = granuleColorMap[product.granuleColor] || 'from-rose-300 via-stone-300 to-emerald-200';

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Outer 3D Fertilizer Bag Container */}
      <div
        className={`relative ${sizeStyles} rounded-xl sm:rounded-2xl shadow-md flex flex-col justify-between overflow-hidden border border-white/30 transition-all duration-300`}
        style={{
          boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(255,255,255,0.3) inset',
        }}
      >
        {/* Top Bag Seal crimp line */}
        <div className="h-2 sm:h-2.5 w-full bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 flex items-center justify-center border-b border-black/20 shrink-0">
          <div className="flex space-x-1 opacity-40">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-1 h-1 bg-black/40 rounded-xs"></div>
            ))}
          </div>
        </div>

        {/* Bag Main Body */}
        <div className={`relative flex-1 bg-gradient-to-b ${bagBg} p-1 sm:p-2 flex flex-col justify-between overflow-hidden text-white`}>
          {/* Authentic Rainbow colored stripes header (present on Tiv Huor NPK bags) */}
          {theme === 'rainbow' && (
            <div className="absolute top-0 left-0 right-0 h-2.5 sm:h-3.5 flex opacity-95">
              <div className="flex-1 bg-purple-600"></div>
              <div className="flex-1 bg-blue-600"></div>
              <div className="flex-1 bg-cyan-400"></div>
              <div className="flex-1 bg-emerald-500"></div>
              <div className="flex-1 bg-yellow-400"></div>
              <div className="flex-1 bg-orange-500"></div>
              <div className="flex-1 bg-red-600"></div>
            </div>
          )}

          {/* White Center Label Card */}
          <div className={`${theme === 'rainbow' ? 'mt-2 sm:mt-2.5' : 'mt-0.5'} relative z-10 bg-white/95 rounded-lg sm:rounded-xl p-1 sm:p-1.5 text-slate-900 shadow-sm border border-slate-200/80 text-center flex flex-col items-center justify-center`}>
            {/* Brand Logo & Title: ទីវ ហៃ TIV HAI */}
            <div className="flex items-center justify-center gap-1">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#1E5FA8] flex items-center justify-center text-white text-[7px] sm:text-[8px] shadow-2xs font-black shrink-0">
                TH
              </div>
              <span className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-800 font-['Battambang'] leading-tight">
                ទីវ ហៃ TIV HAI
              </span>
            </div>

            {/* Prominent NPK Name Banner */}
            <div className="mt-1 w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-md py-0.5 px-1 shadow-2xs">
              <div className="text-[8px] sm:text-[11px] font-black tracking-tight leading-none uppercase font-mono">
                {product.npk}
              </div>
            </div>

            {/* Key Nutrients Mini Pill Table (Shown on md, lg, hero) */}
            {size !== 'sm' && product.nutrients && (
              <div className="mt-1 w-full grid grid-cols-3 gap-0.5 text-[6.5px] sm:text-[7.5px] font-bold bg-slate-100/90 rounded p-0.5 text-slate-700 border border-slate-200">
                <div className="bg-white rounded px-0.5 py-0.2 shadow-2xs">
                  <span className="text-blue-700">N:</span>{product.nutrients.n || '0%'}
                </div>
                <div className="bg-white rounded px-0.5 py-0.2 shadow-2xs">
                  <span className="text-amber-700">P:</span>{product.nutrients.p || '0%'}
                </div>
                <div className="bg-white rounded px-0.5 py-0.2 shadow-2xs">
                  <span className="text-emerald-700">K:</span>{product.nutrients.k || '0%'}
                </div>
              </div>
            )}
          </div>

          {/* Bag Bottom Row: Weight Seal & Brand */}
          <div className="relative z-10 mt-auto pt-1 flex items-center justify-between px-0.5 text-[6.5px] sm:text-[7.5px]">
            <span className="text-white font-bold font-['Battambang'] truncate opacity-90">
              {product.categoryKh}
            </span>
            <span className="bg-white text-slate-900 font-extrabold rounded-full px-1.5 py-0.2 text-[6.5px] sm:text-[7.5px] shadow-2xs shrink-0 font-mono">
              {product.weight}
            </span>
          </div>

          {/* Bottom Rainbow Stripe (if rainbow theme) */}
          {theme === 'rainbow' && (
            <div className="mt-0.5 h-1 sm:h-1.5 w-full rounded-xs flex overflow-hidden opacity-90 shadow-inner shrink-0">
              <div className="flex-1 bg-red-600"></div>
              <div className="flex-1 bg-orange-500"></div>
              <div className="flex-1 bg-yellow-400"></div>
              <div className="flex-1 bg-emerald-500"></div>
              <div className="flex-1 bg-blue-600"></div>
              <div className="flex-1 bg-purple-600"></div>
            </div>
          )}
        </div>

        {/* Bottom Bag Seal crimp */}
        <div className="h-1.5 sm:h-2 w-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border-t border-black/20 shrink-0"></div>

        {/* Fertilizer Granules Badge (Bottom Right circle) - shown on md/lg */}
        {showGranulesBadge && size !== 'sm' && product.granuleColor && (
          <div
            className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-11 sm:h-11 rounded-full p-0.5 sm:p-1 bg-white shadow-lg border border-emerald-500 z-20"
            title="គ្រាប់ជីពិតប្រាកដ"
          >
            <div className={`w-full h-full rounded-full bg-gradient-to-br ${granuleGrad} flex items-center justify-center overflow-hidden relative shadow-inner`}>
              <div className="absolute inset-0 flex flex-wrap gap-0.5 p-0.5 opacity-90 justify-center items-center">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-white/80 shadow-2xs"
                    style={{
                      transform: `scale(${0.7 + (i % 4) * 0.15})`,
                      backgroundColor:
                        i % 3 === 0
                          ? '#f87171'
                          : i % 3 === 1
                          ? '#ffffff'
                          : '#4ade80',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
