import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  Check, 
  Settings2, 
  HelpCircle,
  Eye
} from 'lucide-react';
import { Product, Order, CompanyProfile } from '../types';
import { 
  calculateProductCostReportData, 
  exportProductCostToExcel, 
  generateAndPrintProductCostPdf 
} from '../utils/productCostReportGenerator';

interface ProductCostReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  companyProfile?: CompanyProfile;
  initialDateLabel?: string;
}

export const ProductCostReportModal: React.FC<ProductCostReportModalProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  companyProfile,
  initialDateLabel,
}) => {
  const now = new Date();
  const defaultDateStr = initialDateLabel || `${now.getDate()}/${now.getMonth() + 1}/${String(now.getFullYear()).slice(-2)}`;

  const [dateLabel, setDateLabel] = useState(defaultDateStr);
  // Default hideRevenueProfit = true, as requested by user ("remove to calums isចំណូល and ចំណេញ")
  const [hideRevenueProfit, setHideRevenueProfit] = useState(true);

  // Calculate live report data
  const reportData = useMemo(() => {
    return calculateProductCostReportData(products, orders, dateLabel);
  }, [products, orders, dateLabel]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    exportProductCostToExcel({
      products,
      orders,
      companyProfile,
      customDateLabel: dateLabel,
      hideRevenueProfit,
    });
  };

  const handlePrintPdf = () => {
    generateAndPrintProductCostPdf({
      products,
      orders,
      companyProfile,
      customDateLabel: dateLabel,
      hideRevenueProfit,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-[#107c41] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>របាយការណ៍លក់តាមមុខទំនិញ (គំរូ កូដ & ថ្លៃដើម)</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Excel & PDF Clean Table
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                ទម្រង់តារាងស្អាតបាត កូដ ឈ្មោះ បានលក់ និងថ្លៃដើម (អាចដកជួរឈរ ចំណូល & ចំណេញ)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date Input */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
              <Calendar className="w-4 h-4 text-slate-500" />
              <label className="text-xs font-semibold text-slate-700">កាលបរិច្ឆេទ:</label>
              <input
                type="text"
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                placeholder="15/9/26"
                className="w-24 text-xs font-mono font-bold text-slate-900 border-none bg-transparent focus:outline-hidden"
              />
            </div>

            {/* Toggle Columns: Remove ចំណូល & ចំណេញ */}
            <label className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-300 shadow-2xs cursor-pointer select-none hover:border-emerald-500 transition-colors">
              <input
                type="checkbox"
                checked={hideRevenueProfit}
                onChange={(e) => setHideRevenueProfit(e.target.checked)}
                className="w-4 h-4 text-[#107c41] rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                លុបជួរឈរ ចំណូល & ចំណេញ
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                {hideRevenueProfit ? 'សល់ ៤ ជួរឈរ' : 'បង្ហាញ ៦ ជួរឈរ'}
              </span>
            </label>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-[#107c41] hover:bg-[#0d6334] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:shadow cursor-pointer"
              title="ទាញយកជាឯកសារ Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>ទាញយក Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:shadow cursor-pointer"
              title="បោះពុម្ព ឬរក្សាទុកជា PDF (Print / Save as PDF)"
            >
              <Printer className="w-4 h-4" />
              <span>ទាញយក PDF Table</span>
            </button>
          </div>
        </div>

        {/* Live Preview Box (matches user image layout) */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-100 flex flex-col items-center">
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5 self-start">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>ទិដ្ឋភាពជាក់ស្តែង (Live Preview) ដូចក្នុងរូបភាពគំរូ៖</span>
          </div>

          {/* Paper Canvas */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-slate-300 w-full max-w-2xl font-['Kantumruy_Pro']">
            {/* Centered Date Header */}
            <div className="text-center font-bold text-base text-slate-900 mb-4 tracking-wide font-mono">
              {dateLabel}
            </div>

            {/* Clean Bordered Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs text-black">
                <thead>
                  <tr className="bg-white">
                    <th className="border border-black px-3 py-2 text-center font-bold font-mono w-16">
                      កូដ
                    </th>
                    <th className="border border-black px-3 py-2 text-left font-bold">
                      ឈ្មោះ
                    </th>
                    <th className="border border-black px-3 py-2 text-center font-bold font-mono w-20">
                      បានលក់
                    </th>
                    <th className="border border-black px-3 py-2 text-right font-bold font-mono w-28">
                      ថ្លៃដើម
                    </th>
                    {!hideRevenueProfit && (
                      <>
                        <th className="border border-black px-3 py-2 text-right font-bold font-mono w-28">
                          ចំណូល
                        </th>
                        <th className="border border-black px-3 py-2 text-right font-bold font-mono w-28">
                          ចំណេញ
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reportData.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="border border-black px-3 py-1.5 text-center font-mono font-medium">
                        {item.code}
                      </td>
                      <td className="border border-black px-3 py-1.5 text-left font-['Battambang']">
                        {item.name}
                      </td>
                      <td className="border border-black px-3 py-1.5 text-center font-mono">
                        {item.qtySold}
                      </td>
                      <td className="border border-black px-3 py-1.5 text-right font-mono font-semibold">
                        ${item.costTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {!hideRevenueProfit && (
                        <>
                          <td className="border border-black px-3 py-1.5 text-right font-mono font-semibold text-emerald-700">
                            ${item.revenueTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="border border-black px-3 py-1.5 text-right font-mono font-semibold text-blue-700">
                            ${item.profitTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}

                  {/* Summary Total Row */}
                  <tr className="bg-slate-50 font-bold border-t-2 border-black">
                    <td className="border border-black px-3 py-2"></td>
                    <td className="border border-black px-3 py-2"></td>
                    <td className="border border-black px-3 py-2 text-center font-mono text-sm">
                      {reportData.totalSold}
                    </td>
                    <td className="border border-black px-3 py-2 text-right font-mono text-sm">
                      ${reportData.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {!hideRevenueProfit && (
                      <>
                        <td className="border border-black px-3 py-2 text-right font-mono text-sm text-emerald-700">
                          ${reportData.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border border-black px-3 py-2 text-right font-mono text-sm text-blue-700">
                          ${reportData.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note indicator */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>សរុបមុខទំនិញ: {reportData.items.length} មុខ</span>
              <span>
                {hideRevenueProfit 
                  ? '✓ បានដកជួរឈរ ចំណូល & ចំណេញ រួចរាល់' 
                  : 'បង្ហាញជួរឈរ ចំណូល & ចំណេញ ពេញលេញ'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>ឯកសារ Excel & PDF នឹងត្រូវទាញយកដោយស្វ័យប្រវត្តិតាមការកំណត់ខាងលើ</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
