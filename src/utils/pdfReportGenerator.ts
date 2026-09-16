import { Order, CompanyProfile } from '../types';
import { CAMBODIA_PROVINCES } from '../data/cambodiaProvinces';

export { generateAndPrintProductCostPdf } from './productCostReportGenerator';

interface GeneratePdfReportOptions {
  title: string;
  periodLabel: string;
  orders: Order[];
  companyProfile?: CompanyProfile;
}

export function generateAndPrintPdfReport({
  title,
  periodLabel,
  orders,
  companyProfile,
}: GeneratePdfReportOptions) {
  const brandName = companyProfile?.brandName || companyProfile?.nameKh || 'ក្រុមហ៊ុន ទីវ ហៃ (ខេមបូឌា)';
  const phone = companyProfile?.phones?.join(' / ') || '012 345 678 / 097 888 999';
  const telegramHandle = companyProfile?.telegram || '@tivhuor_official';
  const address = companyProfile?.address || 'រាជធានីភ្នំពេញ, ព្រះរាជាណាចក្រកម្ពុជា';

  // Metrics calculation
  const totalOrders = orders.length;
  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
  
  const grandTotalUSD = orders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);
  const grandTotalKHR = orders.reduce((sum, o) => sum + (o.totalKHR || 0), 0);
  const totalBags = orders.reduce(
    (sum, o) => sum + (o.items || []).reduce((isum, it) => isum + (it.quantity || 0), 0),
    0
  );

  // Purchase Channel breakdown
  const onlineOrders = orders.filter((o) => o.purchaseChannel !== 'direct');
  const directOrders = orders.filter((o) => o.purchaseChannel === 'direct');
  const onlineRevUSD = onlineOrders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);
  const directRevUSD = directOrders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);

  // Payment Type breakdown
  const cashOrders = orders.filter((o) => o.paymentType === 'cash' || (!o.paymentType && o.paymentMethod === 'cash'));
  const scanQrOrders = orders.filter((o) => o.paymentType === 'scan_qr' || (!o.paymentType && o.paymentMethod === 'bakong_khqr'));
  const creditOrders = orders.filter((o) => o.paymentType === 'credit_unpaid' || (!o.paymentType && o.paymentMethod === 'credit'));

  const cashRevUSD = cashOrders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);
  const scanQrRevUSD = scanQrOrders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);
  const creditRevUSD = creditOrders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);

  const getProvinceName = (provId?: string) => {
    if (!provId) return '-';
    if (provId === 'direct-store') return 'ទិញផ្ទាល់នៅហាង/ដេប៉ូ';
    const found = CAMBODIA_PROVINCES.find((p) => p.id === provId);
    return found ? found.nameKh : provId;
  };

  const getPurchaseChannelLabel = (channel?: string) => {
    return channel === 'direct' ? '🏪 ផ្ទាល់ (Store)' : '🌐 Online';
  };

  const getPaymentTypeLabel = (pType?: string, pMethod?: string) => {
    if (pType === 'cash' || pMethod === 'cash') return '💵 ទូទាត់លុយសុទ្ធ';
    if (pType === 'scan_qr' || pMethod === 'bakong_khqr') return '📱 Scan QR';
    if (pType === 'credit_unpaid' || pMethod === 'credit') return '📝 ជំពាក់ មិនទាន់ទូទាត់';
    return '💵 ទូទាត់លុយសុទ្ធ';
  };

  const getStatusBadgeHtml = (status: string) => {
    switch (status) {
      case 'paid':
        return '<span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:10px;">✓ បានទូទាត់ (Paid)</span>';
      case 'confirmed':
        return '<span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:10px;">✓ បានបញ្ជាក់ (Confirmed)</span>';
      case 'shipped':
        return '<span style="background:#f3e8ff;color:#7e22ce;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:10px;">🚚 កំពុងដឹក (Shipped)</span>';
      case 'pending_payment':
        return '<span style="background:#fef3c7;color:#b45309;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:10px;">⏳ រង់ចាំ (Pending)</span>';
      case 'cancelled':
        return '<span style="background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:10px;">✕ បោះបង់ (Cancelled)</span>';
      default:
        return `<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:10px;">${status}</span>`;
    }
  };

  // Generate Excel Spreadsheet styled table rows
  const tableRowsHtml = orders.map((o, index) => {
    const d = new Date(o.createdAt);
    const dateFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    const itemsSummary = (o.items || [])
      .map((it) => `${it.product.nameKh || it.product.name} (${it.quantity}បាវ)`)
      .join(', ');

    const orderBags = (o.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const provName = getProvinceName(o.customer?.provinceId);
    const purchaseChannelText = getPurchaseChannelLabel(o.purchaseChannel);
    const paymentTypeText = getPaymentTypeLabel(o.paymentType, o.paymentMethod);
    const rowBg = index % 2 === 1 ? '#f8fafc' : '#ffffff';

    return `
      <tr style="background-color: ${rowBg};">
        <td class="excel-cell text-center excel-row-num">${index + 1}</td>
        <td class="excel-cell text-center font-mono font-bold" style="color: #1E5FA8;">#${o.id.slice(-8)}</td>
        <td class="excel-cell text-center font-mono text-muted">${dateFormatted}</td>
        <td class="excel-cell">
          <div style="font-weight: 600; color: #0f172a;">${o.customer?.fullName || '-'}</div>
          ${o.customer?.phone && o.customer.phone !== '-' && o.customer.phone !== 'មិនបានបញ្ជាក់ (N/A)' ? `<div class="font-mono text-muted" style="font-size: 9px;">${o.customer.phone}</div>` : ''}
        </td>
        <td class="excel-cell">
          <div>${purchaseChannelText}</div>
          <div class="text-muted" style="font-size: 9px;">${provName}</div>
        </td>
        <td class="excel-cell">
          <div style="font-weight: 600; color: ${
            o.paymentType === 'credit_unpaid' ? '#b45309' : o.paymentType === 'cash' ? '#15803d' : '#1E5FA8'
          };">${paymentTypeText}</div>
          ${o.selectedBankName ? `<div class="text-muted" style="font-size: 9px;">(${o.selectedBankName})</div>` : ''}
        </td>
        <td class="excel-cell">
          <div style="line-height: 1.35; font-size: 10px;">${itemsSummary || '-'}</div>
        </td>
        <td class="excel-cell text-center font-bold font-mono" style="color: #0f172a;">
          ${orderBags}
        </td>
        <td class="excel-cell text-right font-mono font-bold" style="color: #1E5FA8;">
          $${(o.totalUSD || 0).toFixed(2)}
        </td>
        <td class="excel-cell text-right font-mono text-muted" style="font-size: 9.5px;">
          ${(o.totalKHR || 0).toLocaleString()} ៛
        </td>
        <td class="excel-cell text-center">
          ${getStatusBadgeHtml(o.status)}
        </td>
      </tr>
    `;
  }).join('');

  const reportWindow = window.open('', '_blank');
  if (!reportWindow) {
    alert('សូមអនុញ្ញាត Popup នៅក្នុង Browser ដើម្បីទាញយក ឬបោះពុម្ព PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="km">
    <head>
      <meta charset="UTF-8">
      <title>${title} - ${brandName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700;900&family=Kantumruy+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Moul&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 landscape;
          margin: 8mm 10mm 10mm 10mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Kantumruy Pro', 'Battambang', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          font-size: 10.5px;
          line-height: 1.4;
          padding: 12px;
        }
        
        /* Action Bar */
        .action-bar {
          background: #107c41; /* Microsoft Excel Green */
          color: white;
          padding: 10px 18px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.15);
        }
        .excel-tag {
          background: #0d5f32;
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-right: 8px;
        }
        .btn {
          background: #ffffff;
          color: #107c41;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          font-weight: 700;
          font-family: 'Battambang', sans-serif;
          font-size: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .btn:hover {
          background: #f0fdf4;
        }

        /* Header */
        .header-section {
          border-bottom: 2px solid #107c41;
          padding-bottom: 10px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .brand-title {
          font-family: 'Moul', cursive;
          font-size: 16px;
          color: #107c41;
          margin-bottom: 3px;
        }
        .company-meta {
          font-size: 9.5px;
          color: #475569;
          line-height: 1.45;
        }
        .report-title-badge {
          text-align: right;
        }
        .report-title {
          font-family: 'Battambang', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .period-tag {
          display: inline-block;
          background: #ecfdf5;
          color: #107c41;
          padding: 2px 10px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 10px;
          border: 1px solid #a7f3d0;
        }

        /* Summary Cards - Excel Metric Blocks */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 12px;
        }
        .summary-card {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-left: 4px solid #107c41;
          border-radius: 4px;
          padding: 8px 12px;
        }
        .summary-label {
          font-size: 9px;
          color: #475569;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .summary-value {
          font-size: 15px;
          font-weight: bold;
          color: #0f172a;
          font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
        }
        .summary-sub {
          font-size: 9px;
          color: #64748b;
          margin-top: 1px;
        }

        /* Breakdown Cards */
        .breakdowns-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .breakdown-box {
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 8px 12px;
        }
        .breakdown-title {
          font-family: 'Battambang', sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          color: #107c41;
          margin-bottom: 6px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 3px;
        }
        .breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2px 0;
          font-size: 10px;
        }

        /* EXCEL SPREADSHEET TABLE STYLING */
        .excel-table-wrapper {
          border: 1.5px solid #94a3b8;
          border-radius: 2px;
          margin-bottom: 14px;
          overflow: hidden;
          background: #ffffff;
        }
        .excel-table {
          width: 100%;
          border-collapse: collapse;
          border-spacing: 0;
          table-layout: auto;
        }
        
        /* Excel Header Row (A, B, C, ... style or Header Label) */
        .excel-col-letters th {
          background: #f1f5f9;
          color: #64748b;
          font-size: 8.5px;
          font-weight: bold;
          text-align: center;
          padding: 2px 4px;
          border: 1px solid #cbd5e1;
          font-family: monospace;
        }
        .excel-header th {
          background: #107c41; /* Excel Table Header Green */
          color: #ffffff;
          padding: 7px 6px;
          text-align: left;
          font-size: 9.5px;
          font-weight: 700;
          border: 1px solid #0d5f32;
          white-space: nowrap;
        }
        .excel-header th.text-center {
          text-align: center;
        }
        .excel-header th.text-right {
          text-align: right;
        }

        /* Excel Cells */
        .excel-cell {
          border: 1px solid #cbd5e1;
          padding: 6px 6px;
          font-size: 10px;
          vertical-align: middle;
        }
        .excel-row-num {
          background: #f8fafc;
          color: #64748b;
          font-weight: bold;
          font-family: monospace;
          border-right: 1.5px solid #94a3b8;
          width: 32px;
        }

        /* Excel Table Footer Total Row */
        .excel-total-row td {
          background: #ecfdf5;
          border-top: 2px solid #107c41;
          border-bottom: 2px solid #107c41;
          border-left: 1px solid #a7f3d0;
          border-right: 1px solid #a7f3d0;
          padding: 8px 6px;
          font-weight: bold;
          font-size: 11px;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-mono { font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace; }
        .font-bold { font-weight: bold; }
        .text-muted { color: #64748b; }

        /* Signatures */
        .footer-signatures {
          margin-top: 25px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          text-align: center;
          page-break-inside: avoid;
        }
        .sign-line {
          margin-top: 40px;
          border-top: 1px dashed #94a3b8;
          width: 60%;
          margin-left: auto;
          margin-right: auto;
        }
      </style>
    </head>
    <body>
      <div class="action-bar no-print">
        <div style="display: flex; align-items: center;">
          <span class="excel-tag">📊 EXCEL TABLE FORMAT</span>
          <div>
            <strong>របាយការណ៍ត្រូវបានរៀបចំជាតារាង Excel យ៉ាងស្អាត</strong>
            <div style="font-size: 11px; opacity: 0.9;">ទម្រង់ A4 Landscape ងាយស្រួលមើលគ្រប់ជួរឈរ (Columns) និងក្រឡា (Grid Cells)</div>
          </div>
        </div>
        <div>
          <button class="btn" onclick="window.print()">
            🖨️ បោះពុម្ព / ទាញយកជា PDF (Download PDF)
          </button>
        </div>
      </div>

      <!-- Header Section -->
      <div class="header-section">
        <div>
          <div class="brand-title">${brandName}</div>
          <div class="company-meta">
            <div>📍 ${address}</div>
            <div>📞 ទូរស័ព្ទ: ${phone} | ✈️ Telegram: ${telegramHandle}</div>
          </div>
        </div>
        <div class="report-title-badge">
          <div class="report-title">${title}</div>
          <div class="period-tag">${periodLabel}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 3px;">
            កាលបរិច្ឆេទបង្កើត: ${new Date().toLocaleString('km-KH')}
          </div>
        </div>
      </div>

      <!-- Top Summary Metrics -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">ទឹកប្រាក់សរុបរួម (Grand Total)</div>
          <div class="summary-value" style="color: #107c41;">$${grandTotalUSD.toFixed(2)}</div>
          <div class="summary-sub">~ ${grandTotalKHR.toLocaleString()} ៛ KHR</div>
        </div>

        <div class="summary-card">
          <div class="summary-label">ការកុម្ម៉ង់សរុប (Total Orders)</div>
          <div class="summary-value">${totalOrders} <span style="font-size: 11px; font-weight: normal;">Orders</span></div>
          <div class="summary-sub">${nonCancelledOrders.length} បានទទួលជោគជ័យ</div>
        </div>

        <div class="summary-card">
          <div class="summary-label">បរិមាណជីសរុប (Total Bags)</div>
          <div class="summary-value" style="color: #107c41;">${totalBags} <span style="font-size: 11px; font-weight: normal;">បាវ</span></div>
          <div class="summary-sub">ជាមធ្យម ${(totalOrders > 0 ? totalBags / totalOrders : 0).toFixed(1)} បាវ/ការទិញ</div>
        </div>

        <div class="summary-card">
          <div class="summary-label">ចំណូលមធ្យម/Order (AOV)</div>
          <div class="summary-value">$${(totalOrders > 0 ? grandTotalUSD / totalOrders : 0).toFixed(2)}</div>
          <div class="summary-sub">អត្រាប្តូរប្រាក់ 4,100 ៛/$</div>
        </div>
      </div>

      <!-- Breakdowns: Purchase Channel & Payment Method -->
      <div class="breakdowns-container">
        <!-- 1. ប្រភេទការទិញ (Purchase Option) -->
        <div class="breakdown-box">
          <div class="breakdown-title">🛒 ប្រភេទការទិញ (Purchase Channel Breakdown)</div>
          <div class="breakdown-row">
            <span>🌐 ទិញតាមរយះ Online (VET Delivery):</span>
            <strong>${onlineOrders.length} Orders (${((onlineOrders.length / (totalOrders || 1)) * 100).toFixed(0)}%) — <span style="color: #107c41; font-family: monospace;">$${onlineRevUSD.toFixed(2)}</span></strong>
          </div>
          <div class="breakdown-row">
            <span>🏪 ផ្ទាល់ (In-Person / Depot Store):</span>
            <strong>${directOrders.length} Orders (${((directOrders.length / (totalOrders || 1)) * 100).toFixed(0)}%) — <span style="color: #107c41; font-family: monospace;">$${directRevUSD.toFixed(2)}</span></strong>
          </div>
        </div>

        <!-- 2. វិធីទូទាត់ប្រាក់ (Payment Method) -->
        <div class="breakdown-box">
          <div class="breakdown-title">💳 វិធីទូទាត់ប្រាក់ (Payment Methods Breakdown)</div>
          <div class="breakdown-row">
            <span>💵 ទូទាត់លុយសុទ្ធ (Cash):</span>
            <strong>${cashOrders.length} Orders — <span style="color: #15803d; font-family: monospace;">$${cashRevUSD.toFixed(2)}</span></strong>
          </div>
          <div class="breakdown-row">
            <span>📱 Scan QR (Bakong KHQR / Bank):</span>
            <strong>${scanQrOrders.length} Orders — <span style="color: #107c41; font-family: monospace;">$${scanQrRevUSD.toFixed(2)}</span></strong>
          </div>
          <div class="breakdown-row">
            <span>📝 ជំពាក់ មិនទាន់ទូទាត់ (Credit):</span>
            <strong>${creditOrders.length} Orders — <span style="color: #b45309; font-family: monospace;">$${creditRevUSD.toFixed(2)}</span></strong>
          </div>
        </div>
      </div>

      <!-- EXCEL SPREADSHEET GRID TABLE -->
      <div class="excel-table-wrapper">
        <table class="excel-table">
          <thead>
            <!-- Excel Column Reference Bar (A, B, C, ...) -->
            <tr class="excel-col-letters">
              <th style="width: 35px;">#</th>
              <th style="width: 80px;">A</th>
              <th style="width: 110px;">B</th>
              <th style="width: 130px;">C</th>
              <th style="width: 100px;">D</th>
              <th style="width: 110px;">E</th>
              <th>F</th>
              <th style="width: 65px;">G</th>
              <th style="width: 85px;">H</th>
              <th style="width: 95px;">I</th>
              <th style="width: 90px;">J</th>
            </tr>
            <!-- Main Data Header -->
            <tr class="excel-header">
              <th class="text-center" style="width: 35px;">ល.រ</th>
              <th class="text-center" style="width: 80px;">លេខកូដ</th>
              <th class="text-center" style="width: 110px;">កាលបរិច្ឆេទ</th>
              <th style="width: 130px;">អតិថិជន & លេខទូរស័ព្ទ</th>
              <th style="width: 100px;">ប្រភេទការទិញ</th>
              <th style="width: 110px;">វិធីទូទាត់</th>
              <th>មុខទំនិញ & ចំនួនបាវ</th>
              <th class="text-center" style="width: 65px;">សរុបបាវ</th>
              <th class="text-right" style="width: 85px;">សរុប (USD)</th>
              <th class="text-right" style="width: 95px;">សរុប (KHR)</th>
              <th class="text-center" style="width: 90px;">ស្ថានភាព</th>
            </tr>
          </thead>
          <tbody>
            ${orders.length === 0 ? `
              <tr>
                <td colspan="11" class="excel-cell text-center" style="padding: 24px; color: #94a3b8;">
                  មិនមានទិន្នន័យការកុម្ម៉ង់នៅក្នុងចន្លោះពេលនេះឡើយ (No order records found)
                </td>
              </tr>
            ` : tableRowsHtml}
          </tbody>
          <tfoot>
            <!-- Excel Grand Total Row -->
            <tr class="excel-total-row">
              <td class="text-center font-mono">Σ</td>
              <td colspan="6" style="color: #107c41; font-family: 'Battambang', sans-serif;">
                សរុបរួមទាំងអស់ (Grand Total Summary - ${orders.length} ប្រតិបត្តិការ)
              </td>
              <td class="text-center font-mono font-bold" style="color: #0f172a;">
                ${totalBags} បាវ
              </td>
              <td class="text-right font-mono font-bold" style="color: #107c41; font-size: 12px;">
                $${grandTotalUSD.toFixed(2)}
              </td>
              <td class="text-right font-mono font-bold" style="color: #107c41; font-size: 11px;">
                ${grandTotalKHR.toLocaleString()} ៛
              </td>
              <td class="text-center text-muted font-mono" style="font-size: 9px;">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Signatures -->
      <div class="footer-signatures">
        <div>
          <strong>អ្នករៀបចំរបាយការណ៍</strong>
          <div style="font-size: 9px; color: #64748b;">(Prepared By)</div>
          <div class="sign-line"></div>
        </div>
        <div>
          <strong>ប្រធានផ្នែកគណនេយ្យ</strong>
          <div style="font-size: 9px; color: #64748b;">(Accounting Lead)</div>
          <div class="sign-line"></div>
        </div>
        <div>
          <strong>ប្រធានគ្រប់គ្រងទូទៅ</strong>
          <div style="font-size: 9px; color: #64748b;">(General Manager / Director)</div>
          <div class="sign-line"></div>
        </div>
      </div>

      <script>
        // Auto-print option available
      </script>
    </body>
    </html>
  `;

  reportWindow.document.open();
  reportWindow.document.write(htmlContent);
  reportWindow.document.close();
}
