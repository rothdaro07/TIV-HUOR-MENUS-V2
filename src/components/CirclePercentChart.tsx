import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Layers, 
  DollarSign, 
  Package, 
  CreditCard, 
  ShoppingBag, 
  Truck,
  TrendingUp,
  Percent
} from 'lucide-react';
import { Order, Product } from '../types';
import { EXCHANGE_RATE_KHR } from '../data/initialProducts';

interface CirclePercentChartProps {
  orders: Order[];
  products: Product[];
  exchangeRateKHR?: number;
}

type MetricMode = 'category' | 'payment' | 'channel' | 'products';

interface SliceData {
  id: string;
  nameKh: string;
  nameEn: string;
  valueUSD: number;
  count: number;
  percentage: number;
  color: string;
  subColor: string;
}

const PALETTE = [
  { color: '#1E5FA8', sub: '#60A5FA' }, // Deep Blue
  { color: '#10B981', sub: '#34D399' }, // Emerald
  { color: '#F59E0B', sub: '#FBBF24' }, // Amber
  { color: '#8B5CF6', sub: '#A78BFA' }, // Violet
  { color: '#EC4899', sub: '#F472B6' }, // Pink
  { color: '#06B6D4', sub: '#22D3EE' }, // Cyan
  { color: '#F97316', sub: '#FB923C' }, // Orange
  { color: '#64748B', sub: '#94A3B8' }, // Slate
];

export const CirclePercentChart: React.FC<CirclePercentChartProps> = ({
  orders = [],
  products = [],
  exchangeRateKHR = 4100,
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('category');
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);

  // Compute slices based on active metricMode
  const { slices, totalValueUSD, totalCount } = useMemo(() => {
    let totalUSD = 0;
    let countTotal = 0;
    const map: Record<string, { nameKh: string; nameEn: string; valueUSD: number; count: number }> = {};

    if (metricMode === 'category') {
      orders.forEach((o) => {
        (o.items || []).forEach((it) => {
          const cat = it.product.category || 'ទូទៅ';
          const itemTotal = (it.product.price || 0) * (it.quantity || 1);
          const bags = it.quantity || 1;
          totalUSD += itemTotal;
          countTotal += bags;

          if (!map[cat]) {
            map[cat] = {
              nameKh: `ប្រភេទ ${cat}`,
              nameEn: cat,
              valueUSD: 0,
              count: 0,
            };
          }
          map[cat].valueUSD += itemTotal;
          map[cat].count += bags;
        });
      });
    } else if (metricMode === 'payment') {
      orders.forEach((o) => {
        totalUSD += o.totalUSD || 0;
        countTotal += 1;

        const pKey =
          o.paymentType === 'cash'
            ? 'cash'
            : o.paymentType === 'scan_qr'
            ? 'scan_qr'
            : 'credit';

        const labels: Record<string, { kh: string; en: string }> = {
          cash: { kh: 'លុយសុទ្ធ (Cash)', en: 'Cash Payment' },
          scan_qr: { kh: 'Scan QR (KHQR)', en: 'KHQR / Bakong' },
          credit: { kh: 'ជំពាក់ (Credit)', en: 'Unpaid / Credit' },
        };

        if (!map[pKey]) {
          map[pKey] = {
            nameKh: labels[pKey].kh,
            nameEn: labels[pKey].en,
            valueUSD: 0,
            count: 0,
          };
        }
        map[pKey].valueUSD += o.totalUSD || 0;
        map[pKey].count += 1;
      });
    } else if (metricMode === 'channel') {
      orders.forEach((o) => {
        totalUSD += o.totalUSD || 0;
        countTotal += 1;
        const chKey = o.purchaseChannel === 'direct' ? 'direct' : 'online';

        const labels: Record<string, { kh: string; en: string }> = {
          direct: { kh: 'ទិញផ្ទាល់នៅដេប៉ូ', en: 'In-Store Purchase' },
          online: { kh: 'កុម្ម៉ង់តាម Online', en: 'Online Order' },
        };

        if (!map[chKey]) {
          map[chKey] = {
            nameKh: labels[chKey].kh,
            nameEn: labels[chKey].en,
            valueUSD: 0,
            count: 0,
          };
        }
        map[chKey].valueUSD += o.totalUSD || 0;
        map[chKey].count += 1;
      });
    } else {
      // Top Products
      orders.forEach((o) => {
        (o.items || []).forEach((it) => {
          const pName = it.product.nameKh || it.product.name;
          const itemTotal = (it.product.price || 0) * (it.quantity || 1);
          const bags = it.quantity || 1;
          totalUSD += itemTotal;
          countTotal += bags;

          if (!map[pName]) {
            map[pName] = {
              nameKh: pName,
              nameEn: it.product.name,
              valueUSD: 0,
              count: 0,
            };
          }
          map[pName].valueUSD += itemTotal;
          map[pName].count += bags;
        });
      });
    }

    const sorted = Object.entries(map)
      .map(([id, val], idx) => {
        const pct = totalUSD > 0 ? (val.valueUSD / totalUSD) * 100 : 0;
        const colorEntry = PALETTE[idx % PALETTE.length];
        return {
          id,
          nameKh: val.nameKh,
          nameEn: val.nameEn,
          valueUSD: val.valueUSD,
          count: val.count,
          percentage: pct,
          color: colorEntry.color,
          subColor: colorEntry.sub,
        };
      })
      .sort((a, b) => b.valueUSD - a.valueUSD);

    return {
      slices: sorted,
      totalValueUSD: totalUSD,
      totalCount: countTotal,
    };
  }, [orders, metricMode]);

  // Compute SVG arc angles for Donut Chart
  const radius = 95;
  const strokeWidth = 32;
  const center = 130;
  const circumference = 2 * Math.PI * radius;

  // Cumulative offset calculations for SVG stroke-dasharray
  const arcs = useMemo(() => {
    let currentOffset = 0;
    return slices.map((s) => {
      const strokeDash = (s.percentage / 100) * circumference;
      const arc = {
        ...s,
        strokeDash,
        strokeOffset: -currentOffset,
      };
      currentOffset += strokeDash;
      return arc;
    });
  }, [slices, circumference]);

  const activeSlice = hoveredSliceId
    ? slices.find((s) => s.id === hoveredSliceId) || null
    : null;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4 font-['Battambang']">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                ក្រាហ្វិកភាគរយរង្វង់ (Circle % Donut Chart)
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#1E5FA8] font-bold border border-blue-200">
                100% PERCENTAGE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-['Kantumruy_Pro']">
              បែងចែកភាគរយ (%) តាមក្រុមជី វិធីទូទាត់ប្រាក់ និងបណ្តាញលក់
            </p>
          </div>
        </div>

        {/* Metric Mode Pill Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          {[
            { id: 'category', label: 'ក្រុមជី (Category)', icon: Layers },
            { id: 'payment', label: 'វិធីទូទាត់ (Payment)', icon: CreditCard },
            { id: 'channel', label: 'បណ្តាញលក់ (Channel)', icon: ShoppingBag },
            { id: 'products', label: 'មុខជី (Products)', icon: Package },
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setMetricMode(btn.id as MetricMode)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  metricMode === btn.id
                    ? 'bg-white text-[#1E5FA8] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{btn.label}</span>
                <span className="sm:hidden">{btn.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Donut Chart on Left, Detailed Percent Breakdown on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Circle / Donut (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 relative">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg
              viewBox="0 0 260 260"
              className="w-full h-full transform -rotate-90 select-none"
            >
              {/* Background Track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
              />

              {/* Arc Segments */}
              {arcs.map((arc) => {
                const isHovered = hoveredSliceId === arc.id;
                return (
                  <circle
                    key={arc.id}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={arc.color}
                    strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                    strokeDasharray={`${arc.strokeDash} ${circumference}`}
                    strokeDashoffset={arc.strokeOffset}
                    strokeLinecap="butt"
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredSliceId(arc.id)}
                    onMouseLeave={() => setHoveredSliceId(null)}
                    opacity={hoveredSliceId !== null && !isHovered ? 0.45 : 1}
                  />
                );
              })}
            </svg>

            {/* Center Dynamic Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
              {activeSlice ? (
                <>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {activeSlice.nameEn}
                  </span>
                  <span className="text-2xl font-mono font-bold text-slate-900 leading-tight">
                    {activeSlice.percentage.toFixed(1)}%
                  </span>
                  <span className="text-xs font-mono font-bold text-[#1E5FA8]">
                    ${activeSlice.valueUSD.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans">
                    {activeSlice.count} {metricMode === 'payment' || metricMode === 'channel' ? 'កុម្ម៉ង់' : 'បាវ'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    សរុបទាំងអស់ (Total)
                  </span>
                  <span className="text-xl sm:text-2xl font-mono font-bold text-slate-900 leading-tight">
                    ${totalValueUSD.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-blue-600 font-mono">
                    ≈ {Math.round(totalValueUSD * exchangeRateKHR).toLocaleString()} ៛
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                    {slices.length} ប្រភេទផ្សេងគ្នា
                  </span>
                </>
              )}
            </div>
          </div>

          <span className="text-[11px] text-slate-400 mt-2 font-['Kantumruy_Pro'] text-center">
            យក Mouse ចង្អុលលើរង្វង់ដើម្បីមើលភាគរយ (%) លម្អិត
          </span>
        </div>

        {/* Breakdown Progress Bars & Legend (7 cols) */}
        <div className="md:col-span-7 space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {slices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              មិនទាន់មានទិន្នន័យសម្រាប់ចន្លោះពេលនេះ
            </div>
          ) : (
            slices.map((slice) => {
              const isHovered = hoveredSliceId === slice.id;
              return (
                <div
                  key={slice.id}
                  onMouseEnter={() => setHoveredSliceId(slice.id)}
                  onMouseLeave={() => setHoveredSliceId(null)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-blue-50/70 border-[#1E5FA8] shadow-xs'
                      : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {slice.nameKh}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="text-xs font-bold text-slate-700">
                        ${slice.valueUSD.toFixed(2)}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: slice.color }}
                      >
                        {slice.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(slice.percentage, 1)}%`,
                        backgroundColor: slice.color,
                      }}
                    />
                  </div>

                  {/* Sub-label count */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-['Kantumruy_Pro']">
                    <span>
                      បរិមាណ: <strong className="text-slate-600 font-mono">{slice.count}</strong>{' '}
                      {metricMode === 'payment' || metricMode === 'channel' ? 'ការកុម្ម៉ង់' : 'បាវជី'}
                    </span>
                    <span className="font-mono">
                      ≈ {Math.round(slice.valueUSD * exchangeRateKHR).toLocaleString()} ៛
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
