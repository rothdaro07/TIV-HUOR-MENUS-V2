import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

export const CategoryBarSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 sm:px-5 py-2.5 sm:py-3 flex gap-2 sm:gap-3 shrink-0 items-center overflow-x-auto no-scrollbar shadow-xs">
      <div className="h-4 w-14 bg-slate-200 rounded-md animate-pulse shrink-0 mr-1" />
      {[...Array(7)].map((_, idx) => (
        <div
          key={idx}
          className="shrink-0 h-8 w-24 sm:w-28 rounded-full bg-slate-200/80 animate-pulse border border-slate-200/60"
        />
      ))}
    </div>
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Image Box Skeleton */}
      <div className="relative aspect-square w-full bg-slate-100 animate-pulse flex items-center justify-center border-b border-slate-100">
        {/* Top-Left Stock Badge Skeleton */}
        <div className="absolute top-2 left-2 h-4 w-20 bg-slate-200 rounded-md" />
        {/* Center Image Icon Skeleton */}
        <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 stroke-[1.5]" />
      </div>

      {/* Card Body Skeleton */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2.5 sm:gap-3">
        <div className="space-y-1.5">
          <div className="h-4 sm:h-5 bg-slate-200 rounded-md w-4/5 animate-pulse" />
          <div className="h-3 bg-slate-100 rounded-md w-1/2 animate-pulse" />
        </div>

        {/* Weight & Price Skeleton */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="h-3.5 w-16 bg-slate-200/80 rounded-md animate-pulse" />
          <div className="space-y-1 flex flex-col items-end">
            <div className="h-4 sm:h-5 w-16 bg-slate-200 rounded-md animate-pulse" />
            <div className="h-2.5 w-12 bg-slate-100 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Buttons Skeleton */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <div className="h-7 sm:h-8 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-7 sm:h-8 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
      {[...Array(count)].map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export const ProductListSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Mobile Compact List Skeleton */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {[...Array(rows)].map((_, idx) => (
          <div key={idx} className="p-3 flex items-center gap-3">
            <div className="w-14 h-16 shrink-0 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center border border-slate-200">
              <ImageIcon className="w-5 h-5 text-slate-300 stroke-[1.5]" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-3.5 w-14 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
              <div className="flex items-center gap-2 pt-0.5">
                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                <div className="h-3.5 w-14 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Skeleton */}
      <div className="hidden sm:block overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#1E5FA8] text-white font-bold uppercase text-[10px] font-['Battambang']">
            <tr>
              <th className="p-3 text-center w-16">រូបភាព</th>
              <th className="p-3">ឈ្មោះទំនិញ</th>
              <th className="p-3">មុខទំនិញ & ប្រភេទ</th>
              <th className="p-3 text-center">ទម្ងន់</th>
              <th className="p-3 text-right">តម្លៃ</th>
              <th className="p-3 text-center">បញ្ជាទិញ & លម្អិត</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {[...Array(rows)].map((_, idx) => (
              <tr key={idx}>
                <td className="p-2 text-center">
                  <div className="w-12 h-14 mx-auto bg-slate-100 rounded-lg border border-slate-200 animate-pulse flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-slate-300 stroke-[1.5]" />
                  </div>
                </td>
                <td className="p-3 space-y-1.5">
                  <div className="h-4 w-44 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
                </td>
                <td className="p-3 space-y-1.5">
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
                </td>
                <td className="p-3 text-center">
                  <div className="h-4 w-14 mx-auto bg-slate-200 rounded animate-pulse" />
                </td>
                <td className="p-3 text-right space-y-1">
                  <div className="h-4 w-16 ml-auto bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-20 ml-auto bg-slate-100 rounded animate-pulse" />
                </td>
                <td className="p-3 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <div className="h-7 w-18 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-7 w-18 bg-slate-200 rounded-lg animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ProductDetailSkeleton: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  return (
    <div className="space-y-6 pb-12 font-['Battambang']">
      {/* Top Bar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <span>← ត្រឡប់ទៅម៉ឺនុយទំនិញ</span>
          </button>
        ) : (
          <div className="h-9 w-40 bg-slate-200 rounded-xl animate-pulse" />
        )}
        <div className="flex items-center gap-2">
          <div className="h-7 w-36 bg-slate-200 rounded-full animate-pulse" />
          <div className="h-7 w-28 bg-slate-200 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col items-center justify-center shadow-xs">
            <div className="w-full aspect-square max-w-sm rounded-xl bg-slate-100 border border-slate-200 animate-pulse flex items-center justify-center">
              <ImageIcon className="w-14 h-14 text-slate-300 stroke-[1.5]" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-36 bg-slate-200 rounded animate-pulse" />
                <div className="h-7 w-24 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="h-9 w-28 bg-slate-200 rounded-xl animate-pulse" />
            </div>
            <div className="h-11 w-full bg-slate-100 rounded-xl animate-pulse" />
            <div className="grid grid-cols-2 gap-2.5">
              <div className="h-11 bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-11 bg-slate-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="h-7 w-64 bg-slate-200 rounded-lg animate-pulse" />
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-4">
                <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminTableRowSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 6,
  cols = 9,
}) => {
  return (
    <>
      {[...Array(rows)].map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-slate-100">
          {[...Array(cols)].map((__, cIdx) => (
            <td key={cIdx} className="p-3.5">
              {cIdx === 1 ? (
                <div className="w-10 h-12 mx-auto bg-slate-100 rounded-lg border border-slate-200 animate-pulse flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-slate-300 stroke-[1.5]" />
                </div>
              ) : (
                <div
                  className={`h-4 bg-slate-200/80 rounded animate-pulse ${
                    cIdx === 0
                      ? 'w-6 mx-auto'
                      : cIdx === 2
                      ? 'w-44'
                      : 'w-20 mx-auto'
                  }`}
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};
