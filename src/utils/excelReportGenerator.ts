import * as XLSX from 'xlsx';
import { Order, CompanyProfile, Product } from '../types';
import { CAMBODIA_PROVINCES } from '../data/cambodiaProvinces';
import { EXCHANGE_RATE_KHR } from '../data/initialProducts';
import { calculateProductCostReportData } from './productCostReportGenerator';

export interface ExportExcelOptions {
  orders: Order[];
  products: Product[];
  companyProfile?: CompanyProfile;
  periodLabel: string;
}

// Helpers for clean cell generation
function strCell(val: any): XLSX.CellObject {
  return {
    t: 's',
    v: val === null || val === undefined ? '' : String(val),
  };
}

function numCell(val: number, format?: string): XLSX.CellObject {
  const safeVal = isNaN(val) ? 0 : Number(val);
  return {
    t: 'n',
    v: safeVal,
    z: format || (Number.isInteger(safeVal) ? '#,##0' : '#,##0.00'),
  };
}

// Helper to calculate auto-fit column widths while ignoring merged banner rows
function autoFitColumns(ws: XLSX.WorkSheet, minW = 12, maxW = 60) {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const merges = ws['!merges'] || [];
  const colWidths: { wch: number }[] = [];

  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxLen = 0;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      // Check if this cell is part of a multi-column merged row (like title banner)
      const isMultiColMerged = merges.some(
        (m) => m.s.r === R && m.s.c !== m.e.c
      );
      if (isMultiColMerged) continue;

      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (!cell || cell.v === undefined || cell.v === null) continue;

      const valStr = cell.w || String(cell.v);
      const strLen = valStr.length;
      if (strLen > maxLen) {
        maxLen = strLen;
      }
    }
    // Give generous padding for Khmer characters and currency formatting
    colWidths[C] = { wch: Math.min(Math.max(maxLen + 4, minW), maxW) };
  }

  ws['!cols'] = colWidths;
}

export function exportOrdersToExcel({
  orders = [],
  products = [],
  companyProfile,
  periodLabel,
}: ExportExcelOptions) {
  const brandName = companyProfile?.brandName || companyProfile?.nameKh || 'ទីវ ហៃ (TIV HAI CO., LTD)';
  const brandPhone = companyProfile?.phones?.join(' / ') || '012 850 635 / 097 785 0635';
  const brandAddress = companyProfile?.address || 'ផ្លូវជាតិលេខ ៥, ខេត្តកំពង់ឆ្នាំង';
  
  const now = new Date();
  const dateDownloaded = now.toLocaleDateString('km-KH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeDownloaded = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate Product Sales map for stock & distribution
  const productSalesMap: Record<string, { bagsSold: number; revenueUSD: number; orderCount: number }> = {};
  let grandRev = 0;
  let grandBags = 0;
  let grandWeightKg = 0;
  let grandSubtotalUSD = 0;
  let grandDeliveryUSD = 0;

  orders.forEach((o) => {
    if (o.status === 'cancelled') return;
    grandRev += o.totalUSD || 0;
    const dFee = o.deliveryFee?.totalFeeUSD || 0;
    grandDeliveryUSD += dFee;
    grandSubtotalUSD += (o.subtotalUSD ?? (o.totalUSD - dFee));

    (o.items || []).forEach((it) => {
      const pId = it.product.id;
      const qty = it.quantity || 0;
      const rev = (it.unitPrice || it.product.price || 0) * qty;
      const parsedWeight = it.product.weight ? parseFloat(it.product.weight) : 50;
      const weight = isNaN(parsedWeight) ? 50 : parsedWeight;
      
      grandBags += qty;
      grandWeightKg += weight * qty;

      if (!productSalesMap[pId]) {
        productSalesMap[pId] = { bagsSold: 0, revenueUSD: 0, orderCount: 0 };
      }
      productSalesMap[pId].bagsSold += qty;
      productSalesMap[pId].revenueUSD += rev;
      productSalesMap[pId].orderCount += 1;
    });
  });

  // =========================================================================
  // SHEET 1: សង្ខេប_Summary (Executive KPI Dashboard)
  // =========================================================================
  const paidOrders = orders.filter((o) => o.status === 'paid');
  const paidRev = paidOrders.reduce((s, o) => s + (o.totalUSD || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending_payment');
  const pendingRev = pendingOrders.reduce((s, o) => s + (o.totalUSD || 0), 0);
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
  const shippedOrders = orders.filter((o) => o.status === 'shipped');
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled');

  // Inventory Aggregates
  let totalStockBags = 0;
  let totalStockValUSD = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  products.forEach((p) => {
    const qty = typeof p.stockQty === 'number' ? p.stockQty : (p.inStock ? 50 : 0);
    const val = (p.price || 0) * qty;
    totalStockBags += qty;
    totalStockValUSD += val;

    if (p.stockStatus === 'out_of_stock' || p.inStock === false || qty <= 0) {
      outOfStockCount++;
    } else if (qty <= 20) {
      lowStockCount++;
    } else {
      inStockCount++;
    }
  });

  const aovUSD = orders.length > 0 ? grandRev / orders.length : 0;

  const summaryData: (XLSX.CellObject | null)[][] = [
    // Row 1: Title Banner
    [strCell(`របាយការណ៍សង្ខេបប្រតិបត្តិការលក់ និងស្តុកទំនិញ - ${brandName}`), null, null, null],
    // Row 2: Subtitle Info
    [strCell(`ចន្លោះពេល: ${periodLabel} | កាលបរិច្ឆេទបង្កើត: ${dateDownloaded} ម៉ោង ${timeDownloaded} | ទំនាក់ទំនង: ${brandPhone}`), null, null, null],
    // Row 3: Blank separator
    [strCell(''), null, null, null],

    // Section 1: Financial Performance KPIs
    [strCell('១. សូចនាករសំខាន់ៗផ្នែកហិរញ្ញវត្ថុ (FINANCIAL PERFORMANCE METRICS)'), null, null, null],
    [strCell('សូចនាករ (Metric Name)'), strCell('ការពិពណ៌នា (Description)'), strCell('តម្លៃជាដុល្លារ ($ USD)'), strCell('តម្លៃជាប្រាក់រៀល (KHR ៛)')],
    [strCell('ចំណូលលក់សរុប (Total Revenue)'), strCell('ទឹកប្រាក់សរុបពីការលក់ទាំងអស់'), numCell(grandRev, '$#,##0.00'), numCell(Math.round(grandRev * EXCHANGE_RATE_KHR), '#,##0 ៛')],
    [strCell('ចំណូលទូទាត់រួច (Paid Revenue)'), strCell('ទឹកប្រាក់ដែលទទួលបានជាក់ស្តែង'), numCell(paidRev, '$#,##0.00'), numCell(Math.round(paidRev * EXCHANGE_RATE_KHR), '#,##0 ៛')],
    [strCell('ចំណូលរង់ចាំ/ជំពាក់ (Pending/Credit)'), strCell('ទឹកប្រាក់ជំពាក់ ឬរង់ចាំការទូទាត់'), numCell(pendingRev, '$#,##0.00'), numCell(Math.round(pendingRev * EXCHANGE_RATE_KHR), '#,##0 ៛')],
    [strCell('ចំណូលទំនិញសុទ្ធ (Net Product Subtotal)'), strCell('ចំណូលដកថ្លៃដឹកជញ្ជូនរួច'), numCell(grandSubtotalUSD, '$#,##0.00'), numCell(Math.round(grandSubtotalUSD * EXCHANGE_RATE_KHR), '#,##0 ៛')],
    [strCell('ថ្លៃដឹកជញ្ជូនសរុប (Total Delivery Fees)'), strCell('ថ្លៃសេវាដឹកជញ្ជូនដល់គោលដៅ'), numCell(grandDeliveryUSD, '$#,##0.00'), numCell(Math.round(grandDeliveryUSD * EXCHANGE_RATE_KHR), '#,##0 ៛')],
    [strCell('ចំណូលមធ្យមក្នុងមួយកុម្ម៉ង់ (AOV)'), strCell('ចំណូលសរុបធៀបនឹងចំនួនកុម្ម៉ង់'), numCell(aovUSD, '$#,##0.00'), numCell(Math.round(aovUSD * EXCHANGE_RATE_KHR), '#,##0 ៛')],

    // Row: Blank separator
    [strCell(''), null, null, null],

    // Section 2: Volume & Operations KPIs
    [strCell('២. សូចនាករបរិមាណ និងប្រតិបត្តិការកុម្ម៉ង់ (VOLUME & ORDER OPERATIONS)'), null, null, null],
    [strCell('សូចនាករ (Metric Name)'), strCell('ការពិពណ៌នា (Description)'), strCell('បរិមាណ (Quantity)'), strCell('ឯកតា (Unit)')],
    [strCell('ចំនួនការកុម្ម៉ង់សរុប (Total Orders)'), strCell('ចំនួនវិក្កយបត្រកុម្ម៉ង់ទាំងអស់'), numCell(orders.length), strCell('កុម្ម៉ង់ (Orders)')],
    [strCell('កុម្ម៉ង់បានទូទាត់ (Paid Orders)'), strCell('អតិថិជនបានទូទាត់ប្រាក់ជោគជ័យ'), numCell(paidOrders.length), strCell('កុម្ម៉ង់ (Orders)')],
    [strCell('កុម្ម៉ង់បានបញ្ជាក់ (Confirmed Orders)'), strCell('ដេប៉ូបានបញ្ជាក់ទទួលការបញ្ជាទិញ'), numCell(confirmedOrders.length), strCell('កុម្ម៉ង់ (Orders)')],
    [strCell('កុម្ម៉ង់កំពុងដឹក (Shipped Orders)'), strCell('ទំនិញកំពុងធ្វើដំណើរទៅកាន់អតិថិជន'), numCell(shippedOrders.length), strCell('កុម្ម៉ង់ (Orders)')],
    [strCell('កុម្ម៉ង់រង់ចាំទូទាត់ (Pending Orders)'), strCell('រង់ចាំការផ្ទេរប្រាក់ ឬទូទាត់ពេលដឹកដល់'), numCell(pendingOrders.length), strCell('កុម្ម៉ង់ (Orders)')],
    [strCell('កុម្ម៉ង់បានលុបចោល (Cancelled Orders)'), strCell('កុម្ម៉ង់ដែលត្រូវបានបដិសេធ ឬលុបចោល'), numCell(cancelledOrders.length), strCell('កុម្ម៉ង់ (Orders)')],
    [strCell('ចំនួនបាវជីលក់សរុប (Total Bags Sold)'), strCell('បរិមាណជីដែលបានលក់ចេញសរុប'), numCell(grandBags), strCell('បាវ (Bags)')],
    [strCell('ទម្ងន់ជីសរុប (Total Sold Weight)'), strCell('ទម្ងន់ជីគិតជាគីឡូក្រាម'), numCell(grandWeightKg), strCell('គីឡូក្រាម (Kg)')],

    // Row: Blank separator
    [strCell(''), null, null, null],

    // Section 3: Warehouse Inventory Metrics
    [strCell('៣. សូចនាករស្តុកទំនិញក្នុងឃ្លាំង (WAREHOUSE INVENTORY METRICS)'), null, null, null],
    [strCell('សូចនាករ (Metric Name)'), strCell('ការពិពណ៌នា (Description)'), strCell('តម្លៃ/បរិមាណ ($/Qty)'), strCell('ស្ថានភាព/កំណត់សម្គាល់ (Status)')],
    [strCell('មុខទំនិញសរុប (Catalog Items)'), strCell('ចំនួនផលិតផលទាំងអស់ក្នុងប្រព័ន្ធ'), numCell(products.length), strCell('មុខទំនិញ (Items)')],
    [strCell('មានស្តុកគ្រប់គ្រាន់ (In-Stock)'), strCell('ទំនិញមានស្តុកលើសពី ២០ បាវ'), numCell(inStockCount), strCell('🟢 មានស្តុកគ្រប់គ្រាន់ (Healthy)')],
    [strCell('ជិតអស់ពីស្តុក (Low-Stock Alert)'), strCell('ទំនិញនៅសល់តិចជាង ឬស្មើ ២០ បាវ'), numCell(lowStockCount), strCell('🟡 ជិតអស់ (ទាមទារទិញថែម)')],
    [strCell('ដាច់ស្តុក (Out-of-Stock)'), strCell('ទំនិញអស់ពីស្តុកទាំងស្រុង (ស្មើ ០)'), numCell(outOfStockCount), strCell('🔴 ដាច់ស្តុក (ត្រូវបញ្ជាទិញបន្ទាន់)')],
    [strCell('បរិមាណស្តុកសរុប (Total Stock Bags)'), strCell('ចំនួនបាវទំនិញជាក់ស្តែងក្នុងឃ្លាំង'), numCell(totalStockBags), strCell('បាវ/គ្រឿង (Bags/Units)')],
    [strCell('តម្លៃស្តុកសរុប ($ USD)'), strCell('តម្លៃដើមស្តុកទំនិញក្នុងឃ្លាំង'), numCell(totalStockValUSD, '$#,##0.00'), strCell(`≈ ${Math.round(totalStockValUSD * EXCHANGE_RATE_KHR).toLocaleString()} ៛`)],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Subtitle
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // Section 1 Title
    { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } }, // Section 2 Title
    { s: { r: 23, c: 0 }, e: { r: 23, c: 3 } }, // Section 3 Title
  ];
  wsSummary['!rows'] = [
    { hpt: 26 }, // Title
    { hpt: 18 }, // Subtitle
    { hpt: 12 }, // blank
    { hpt: 22 }, // Section 1
    { hpt: 20 }, // Header
  ];
  autoFitColumns(wsSummary, 16, 50);

  // =========================================================================
  // SHEET 2: បញ្ជីកុម្ម៉ង់_Orders (Clean Orders Register Table)
  // =========================================================================
  const ordersHeaders = [
    'ល.រ (No.)',
    'កាលបរិច្ឆេទ (Date)',
    'ម៉ោង (Time)',
    'លេខវិក្កយបត្រ (Invoice ID)',
    'ឈ្មោះអតិថិជន (Customer Name)',
    'លេខទូរស័ព្ទ (Phone Number)',
    'ប្រភពលក់ (Channel)',
    'វិធីទូទាត់ (Payment Method)',
    'រាជធានី-ខេត្ត (Province)',
    'អាសយដ្ឋាន/ទីតាំង (Address)',
    'សាខាដឹក VET (Branch)',
    'មុខទំនិញបានទិញ (Purchased Items)',
    'ចំនួនបាវ (Bags)',
    'ទម្ងន់សរុប (Weight kg)',
    'តម្លៃទំនិញ ($ USD)',
    'ថ្លៃដឹកជញ្ជូន ($ USD)',
    'សរុបទឹកប្រាក់ ($ USD)',
    'សរុបប្រាក់រៀល (Total KHR ៛)',
    'ស្ថានភាព (Status)',
    'កំណត់សម្គាល់ (Notes)',
  ];

  const ordersData: (XLSX.CellObject | null)[][] = [
    // Row 1: Title Banner
    [strCell(`${brandName} - បញ្ជីការកុម្ម៉ង់លម្អិត (SALES ORDERS REGISTER)`), ...Array(ordersHeaders.length - 1).fill(null)],
    // Row 2: Subtitle
    [strCell(`របាយការណ៍ប្រចាំ: ${periodLabel} | កាលបរិច្ឆេទបង្កើត: ${dateDownloaded} ${timeDownloaded} | ចំនួនកុម្ម៉ង់សរុប: ${orders.length} កុម្ម៉ង់ | ទីតាំង: ${brandAddress}`), ...Array(ordersHeaders.length - 1).fill(null)],
    // Row 3: Blank separator
    [strCell(''), ...Array(ordersHeaders.length - 1).fill(null)],
    // Row 4: Table Headers
    ordersHeaders.map((h) => strCell(h)),
  ];

  let sumOrderBags = 0;
  let sumOrderWeight = 0;
  let sumOrderSubtotalUSD = 0;
  let sumOrderDeliveryUSD = 0;
  let sumOrderTotalUSD = 0;
  let sumOrderTotalKHR = 0;

  orders.forEach((order, index) => {
    const prov = CAMBODIA_PROVINCES.find((p) => p.id === order.customer.provinceId);
    const provName = prov ? prov.nameKh : order.customer.provinceId || 'មិនបញ្ជាក់';

    const itemsSummary = (order.items || [])
      .map((it) => `${it.product.nameKh || it.product.name} (x${it.quantity})`)
      .join(', ');

    const totalBags = (order.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalWeightKg = (order.items || []).reduce((sum, it) => {
      const parsedWeight = it.product.weight ? parseFloat(it.product.weight) : 50;
      const weight = isNaN(parsedWeight) ? 50 : parsedWeight;
      return sum + weight * (it.quantity || 0);
    }, 0);

    const channelLabel =
      order.purchaseChannel === 'direct' ? 'ទិញផ្ទាល់នៅដេប៉ូ (Store)' : 'កុម្ម៉ង់ Online';

    const paymentLabel =
      order.paymentType === 'cash'
        ? 'លុយសុទ្ធ (Cash)'
        : order.paymentType === 'scan_qr'
        ? `Scan QR (${order.selectedBankName || 'KHQR'})`
        : order.paymentType === 'credit_unpaid'
        ? 'ជំពាក់ (Credit)'
        : order.paymentMethod === 'cash'
        ? 'លុយសុទ្ធ (Cash)'
        : 'Scan QR';

    const statusLabel =
      order.status === 'paid'
        ? 'បានទូទាត់រួច'
        : order.status === 'confirmed'
        ? 'បានបញ្ជាក់'
        : order.status === 'shipped'
        ? 'កំពុងដឹកជញ្ជូន'
        : order.status === 'pending_payment'
        ? 'រង់ចាំទូទាត់'
        : 'បានលុបចោល';

    const dObj = new Date(order.createdAt);
    const dateFormatted = dObj.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeFormatted = dObj.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const deliveryFeeUSD = order.deliveryFee?.totalFeeUSD || 0;
    const subtotalUSD = order.subtotalUSD ?? (order.totalUSD - deliveryFeeUSD);
    const totalUSD = order.totalUSD || 0;
    const totalKHR = order.totalKHR || Math.round(totalUSD * EXCHANGE_RATE_KHR);

    // Sum totals if not cancelled
    if (order.status !== 'cancelled') {
      sumOrderBags += totalBags;
      sumOrderWeight += totalWeightKg;
      sumOrderSubtotalUSD += subtotalUSD;
      sumOrderDeliveryUSD += deliveryFeeUSD;
      sumOrderTotalUSD += totalUSD;
      sumOrderTotalKHR += totalKHR;
    }

    ordersData.push([
      numCell(index + 1),
      strCell(dateFormatted),
      strCell(timeFormatted),
      strCell(order.id),
      strCell(order.customer.fullName),
      strCell(order.customer.phone),
      strCell(channelLabel),
      strCell(paymentLabel),
      strCell(provName),
      strCell(order.customer.districtVillage || '-'),
      strCell(order.customer.selectedBranch || '-'),
      strCell(itemsSummary),
      numCell(totalBags),
      numCell(totalWeightKg),
      numCell(subtotalUSD, '$#,##0.00'),
      numCell(deliveryFeeUSD, '$#,##0.00'),
      numCell(totalUSD, '$#,##0.00'),
      numCell(totalKHR, '#,##0'),
      strCell(statusLabel),
      strCell(order.customer.notes || ''),
    ]);
  });

  // Add Summary / Total Row at bottom
  ordersData.push([
    strCell('សរុបទាំងអស់ (GRAND TOTAL)'),
    strCell(`${orders.length} កុម្ម៉ង់`),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    numCell(sumOrderBags),
    numCell(sumOrderWeight),
    numCell(sumOrderSubtotalUSD, '$#,##0.00'),
    numCell(sumOrderDeliveryUSD, '$#,##0.00'),
    numCell(sumOrderTotalUSD, '$#,##0.00'),
    numCell(sumOrderTotalKHR, '#,##0'),
    strCell(''),
    strCell(''),
  ]);

  const wsOrders = XLSX.utils.aoa_to_sheet(ordersData);
  wsOrders['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: ordersHeaders.length - 1 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: ordersHeaders.length - 1 } }, // Subtitle
  ];

  // Set row heights
  const orderRowHeights: XLSX.RowInfo[] = [
    { hpt: 26 }, // Title
    { hpt: 20 }, // Subtitle
    { hpt: 12 }, // Blank
    { hpt: 24 }, // Header
  ];
  for (let i = 0; i < orders.length; i++) {
    orderRowHeights.push({ hpt: 20 });
  }
  orderRowHeights.push({ hpt: 24 }); // Total row
  wsOrders['!rows'] = orderRowHeights;

  // Add native Excel AutoFilter on row 4 (0-indexed row 3)
  if (orders.length > 0) {
    const lastColLetter = XLSX.utils.encode_col(ordersHeaders.length - 1);
    wsOrders['!autofilter'] = { ref: `A4:${lastColLetter}${4 + orders.length}` };
  }

  autoFitColumns(wsOrders, 10, 50);

  // =========================================================================
  // SHEET 3: ស្តុកទំនិញ_Stock_Inventory (Clean Product Stock & Inventory Table)
  // =========================================================================
  const stockHeaders = [
    'ល.រ (No.)',
    'ឈ្មោះទំនិញជាភាសាខ្មែរ (Product Name Kh)',
    'ឈ្មោះជាអង់គ្លេស (Product Name En)',
    'ឈ្មោះហៅក្រៅ (Nickname)',
    'ក្រុមទំនិញ (Group)',
    'ប្រភេទជី (Category)',
    'រូបមន្ត/លក្ខណៈ (NPK / Specs)',
    'ខ្នាតវេចខ្ចប់ (Packaging)',
    'តម្លៃលក់រាយ ($ USD)',
    'តម្លៃបោះដុំ ($ USD)',
    'ចំនួនក្នុងស្តុក (Stock Qty)',
    'ខ្នាត (Unit)',
    'ស្ថានភាពស្តុក (Health Status)',
    'តម្លៃស្តុកសរុប ($ USD)',
    'តម្លៃស្តុកសរុប (KHR ៛)',
    'បានលក់ចេញ (Bags Sold)',
    'ចំណូលលក់បាន ($ USD)',
    'ចំនួនកុម្ម៉ង់ (Orders Count)',
    'អនុសាសន៍ស្តុក (Recommendation & Action)',
  ];

  const stockData: (XLSX.CellObject | null)[][] = [
    // Row 1: Title Banner
    [strCell(`${brandName} - របាយការណ៍ស្តុកទំនិញក្នុងឃ្លាំង (WAREHOUSE PRODUCT STOCK & INVENTORY)`), ...Array(stockHeaders.length - 1).fill(null)],
    // Row 2: Subtitle
    [strCell(`កាលបរិច្ឆេទត្រួតពិនិត្យ: ${dateDownloaded} ${timeDownloaded} | មុខទំនិញសរុប: ${products.length} មុខ | ទីតាំងឃ្លាំង: ${brandAddress}`), ...Array(stockHeaders.length - 1).fill(null)],
    // Row 3: Blank separator
    [strCell(''), ...Array(stockHeaders.length - 1).fill(null)],
    // Row 4: Headers
    stockHeaders.map((h) => strCell(h)),
  ];

  let sumStockQty = 0;
  let sumStockValUSD = 0;
  let sumStockValKHR = 0;
  let sumSoldBags = 0;
  let sumSoldRevUSD = 0;

  products.forEach((p, index) => {
    const qty = typeof p.stockQty === 'number' ? p.stockQty : (p.inStock ? 50 : 0);
    const unitPrice = p.price || 0;
    const wholesale = p.wholesalePrice || unitPrice * 0.92;
    const stockValUSD = unitPrice * qty;
    const stockValKHR = Math.round(stockValUSD * EXCHANGE_RATE_KHR);
    const unit = p.stockUnit || (p.groupId === 'machinery' ? 'គ្រឿង' : 'បាវ');
    const sales = productSalesMap[p.id] || { bagsSold: 0, revenueUSD: 0, orderCount: 0 };

    sumStockQty += qty;
    sumStockValUSD += stockValUSD;
    sumStockValKHR += stockValKHR;
    sumSoldBags += sales.bagsSold;
    sumSoldRevUSD += sales.revenueUSD;

    let healthStatus = 'មានស្តុកគ្រប់គ្រាន់ (In Stock)';
    let alertAdvice = '✓ ស្តុកមានតុល្យភាពល្អ (Healthy Balance)';
    if (p.stockStatus === 'out_of_stock' || p.inStock === false || qty <= 0) {
      healthStatus = 'ដាច់ស្តុក / អស់ពីស្តុក (Out of Stock)';
      alertAdvice = '🚨 ដាច់ស្តុក! ត្រូវបញ្ជាទិញចូលឃ្លាំងជាបន្ទាន់';
    } else if (qty <= 20) {
      healthStatus = 'ជិតអស់ពីស្តុក (Low Stock Alert)';
      alertAdvice = '⚠️ ស្តុកនៅសល់តិច! គួរទំនាក់ទំនងរោងចក្រទិញថែម';
    }

    stockData.push([
      numCell(index + 1),
      strCell(p.nameKh),
      strCell(p.name),
      strCell(p.nicknameKh || '-'),
      strCell(p.groupKh || 'ជីកសិកម្ម'),
      strCell(p.categoryKh || p.category || 'ទូទៅ'),
      strCell(p.npk || '-'),
      strCell(p.packagingSize || p.weight || '50kg'),
      numCell(unitPrice, '$#,##0.00'),
      numCell(wholesale, '$#,##0.00'),
      numCell(qty),
      strCell(unit),
      strCell(healthStatus),
      numCell(stockValUSD, '$#,##0.00'),
      numCell(stockValKHR, '#,##0'),
      numCell(sales.bagsSold),
      numCell(sales.revenueUSD, '$#,##0.00'),
      numCell(sales.orderCount),
      strCell(alertAdvice),
    ]);
  });

  // Bottom Total Row for Stock
  stockData.push([
    strCell('សរុបស្តុកក្នុងឃ្លាំង (TOTAL INVENTORY)'),
    strCell(`${products.length} មុខទំនិញ`),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    strCell(''),
    numCell(sumStockQty),
    strCell('បាវ/គ្រឿង'),
    strCell(''),
    numCell(sumStockValUSD, '$#,##0.00'),
    numCell(sumStockValKHR, '#,##0'),
    numCell(sumSoldBags),
    numCell(sumSoldRevUSD, '$#,##0.00'),
    strCell(''),
    strCell(''),
  ]);

  const wsStock = XLSX.utils.aoa_to_sheet(stockData);
  wsStock['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: stockHeaders.length - 1 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: stockHeaders.length - 1 } }, // Subtitle
  ];

  // Set row heights
  const stockRowHeights: XLSX.RowInfo[] = [
    { hpt: 26 }, // Title
    { hpt: 20 }, // Subtitle
    { hpt: 12 }, // Blank
    { hpt: 24 }, // Header
  ];
  for (let i = 0; i < products.length; i++) {
    stockRowHeights.push({ hpt: 20 });
  }
  stockRowHeights.push({ hpt: 24 }); // Total row
  wsStock['!rows'] = stockRowHeights;

  if (products.length > 0) {
    const lastStockCol = XLSX.utils.encode_col(stockHeaders.length - 1);
    wsStock['!autofilter'] = { ref: `A4:${lastStockCol}${4 + products.length}` };
  }

  autoFitColumns(wsStock, 11, 55);

  // =========================================================================
  // SHEET 4: ការបែងចែក_Distribution (Clean Distribution Analysis Table)
  // =========================================================================
  // 1. By Product
  const productDistMap: { [prod: string]: { nameKh: string; category: string; bags: number; revenueUSD: number } } = {};
  // 2. By Category
  const categoryDistMap: { [cat: string]: { bags: number; revenueUSD: number; ordersCount: number } } = {};
  // 3. By Payment
  const paymentDistMap: { [pay: string]: { count: number; revenueUSD: number } } = {
    'លុយសុទ្ធ (Cash)': { count: 0, revenueUSD: 0 },
    'Scan QR (KHQR)': { count: 0, revenueUSD: 0 },
    'ជំពាក់ (Credit)': { count: 0, revenueUSD: 0 },
  };
  // 4. By Channel
  const channelDistMap: { [chan: string]: { count: number; revenueUSD: number } } = {
    'ទិញផ្ទាល់នៅដេប៉ូ (Store)': { count: 0, revenueUSD: 0 },
    'កុម្ម៉ង់តាម Online (Online)': { count: 0, revenueUSD: 0 },
  };

  orders.forEach((o) => {
    if (o.status === 'cancelled') return;

    const pKey =
      o.paymentType === 'cash'
        ? 'លុយសុទ្ធ (Cash)'
        : o.paymentType === 'scan_qr'
        ? 'Scan QR (KHQR)'
        : 'ជំពាក់ (Credit)';
    if (!paymentDistMap[pKey]) paymentDistMap[pKey] = { count: 0, revenueUSD: 0 };
    paymentDistMap[pKey].count += 1;
    paymentDistMap[pKey].revenueUSD += o.totalUSD || 0;

    const cKey = o.purchaseChannel === 'direct' ? 'ទិញផ្ទាល់នៅដេប៉ូ (Store)' : 'កុម្ម៉ង់តាម Online (Online)';
    if (!channelDistMap[cKey]) channelDistMap[cKey] = { count: 0, revenueUSD: 0 };
    channelDistMap[cKey].count += 1;
    channelDistMap[cKey].revenueUSD += o.totalUSD || 0;

    (o.items || []).forEach((it) => {
      const pName = it.product.nameKh || it.product.name;
      const cat = it.product.categoryKh || it.product.category || 'ទូទៅ';
      const qty = it.quantity || 1;
      const itemTotal = (it.unitPrice || it.product.price || 0) * qty;

      if (!categoryDistMap[cat]) categoryDistMap[cat] = { bags: 0, revenueUSD: 0, ordersCount: 0 };
      categoryDistMap[cat].bags += qty;
      categoryDistMap[cat].revenueUSD += itemTotal;
      categoryDistMap[cat].ordersCount += 1;

      if (!productDistMap[pName]) productDistMap[pName] = { nameKh: pName, category: cat, bags: 0, revenueUSD: 0 };
      productDistMap[pName].bags += qty;
      productDistMap[pName].revenueUSD += itemTotal;
    });
  });

  const distData: (XLSX.CellObject | null)[][] = [
    // Banner
    [strCell(`${brandName} - ការវិភាគបែងចែកភាគរយនៃការលក់ (SALES DISTRIBUTION & SHARE)`), null, null, null, null, null, null],
    [strCell(`ចន្លោះពេល: ${periodLabel} | កាលបរិច្ឆេទបង្កើត: ${dateDownloaded} | ចំណូលសរុប: $${grandRev.toFixed(2)} | បរិមាណសរុប: ${grandBags} បាវ`), null, null, null, null, null, null],
    [strCell(''), null, null, null, null, null, null],

    // Section 1: Sales Share by Product
    [strCell('១. ការបែងចែកការលក់តាមមុខទំនិញជី (SALES SHARE BY FERTILIZER PRODUCT)'), null, null, null, null, null, null],
    [
      strCell('ល.រ (No.)'),
      strCell('ឈ្មោះទំនិញ (Product Name)'),
      strCell('ប្រភេទជី (Category)'),
      strCell('ចំនួនបាវលក់ (Bags Sold)'),
      strCell('ចំណូល ($ USD)'),
      strCell('ចំណូលជាប្រាក់រៀល (KHR ៛)'),
      strCell('ចំណែកចំណូល (% Revenue)'),
      strCell('ចំណែកបរិមាណ (% Bags)'),
    ],
  ];

  let pIdx = 1;
  Object.values(productDistMap)
    .sort((a, b) => b.revenueUSD - a.revenueUSD)
    .forEach((val) => {
      const pctRev = grandRev > 0 ? (val.revenueUSD / grandRev) * 100 : 0;
      const pctBags = grandBags > 0 ? (val.bags / grandBags) * 100 : 0;

      distData.push([
        numCell(pIdx++),
        strCell(val.nameKh),
        strCell(val.category),
        numCell(val.bags),
        numCell(val.revenueUSD, '$#,##0.00'),
        numCell(Math.round(val.revenueUSD * EXCHANGE_RATE_KHR), '#,##0'),
        strCell(`${pctRev.toFixed(1)}%`),
        strCell(`${pctBags.toFixed(1)}%`),
      ]);
    });

  // Section 2: By Category
  distData.push([strCell(''), null, null, null, null, null, null]);
  distData.push([strCell('២. ការបែងចែកតាមក្រុម/ប្រភេទជី (SALES SHARE BY CATEGORY)'), null, null, null, null, null, null]);
  distData.push([
    strCell('ល.រ (No.)'),
    strCell('ប្រភេទជី (Category Name)'),
    strCell('ចំនួនកុម្ម៉ង់ (Transactions)'),
    strCell('ចំនួនបាវសរុប (Total Bags)'),
    strCell('ចំណូល ($ USD)'),
    strCell('ចំណូលជាប្រាក់រៀល (KHR ៛)'),
    strCell('ចំណែកចំណូល (% Revenue)'),
  ]);

  let cIdx = 1;
  Object.entries(categoryDistMap)
    .sort((a, b) => b[1].revenueUSD - a[1].revenueUSD)
    .forEach(([catName, val]) => {
      const pctRev = grandRev > 0 ? (val.revenueUSD / grandRev) * 100 : 0;
      distData.push([
        numCell(cIdx++),
        strCell(catName),
        numCell(val.ordersCount),
        numCell(val.bags),
        numCell(val.revenueUSD, '$#,##0.00'),
        numCell(Math.round(val.revenueUSD * EXCHANGE_RATE_KHR), '#,##0'),
        strCell(`${pctRev.toFixed(1)}%`),
      ]);
    });

  // Section 3: By Payment Method
  distData.push([strCell(''), null, null, null, null, null, null]);
  distData.push([strCell('៣. ការបែងចែកតាមវិធីទូទាត់ប្រាក់ (PAYMENT METHOD SHARE)'), null, null, null, null, null, null]);
  distData.push([
    strCell('ល.រ (No.)'),
    strCell('វិធីទូទាត់ប្រាក់ (Payment Method)'),
    strCell('ចំនួនកុម្ម៉ង់ (Orders Count)'),
    strCell('ចំណូលសរុប ($ USD)'),
    strCell('ចំណូលជាប្រាក់រៀល (KHR ៛)'),
    strCell('ចំណែកនៃចំណូល (% Revenue)'),
  ]);

  let payIdx = 1;
  Object.entries(paymentDistMap).forEach(([payName, val]) => {
    const pctRev = grandRev > 0 ? (val.revenueUSD / grandRev) * 100 : 0;
    distData.push([
      numCell(payIdx++),
      strCell(payName),
      numCell(val.count),
      numCell(val.revenueUSD, '$#,##0.00'),
      numCell(Math.round(val.revenueUSD * EXCHANGE_RATE_KHR), '#,##0'),
      strCell(`${pctRev.toFixed(1)}%`),
    ]);
  });

  // Section 4: By Sales Channel
  distData.push([strCell(''), null, null, null, null, null, null]);
  distData.push([strCell('៤. ការបែងចែកតាមមធ្យោបាយលក់ (SALES CHANNEL SHARE)'), null, null, null, null, null, null]);
  distData.push([
    strCell('ល.រ (No.)'),
    strCell('មធ្យោបាយលក់ (Sales Channel)'),
    strCell('ចំនួនកុម្ម៉ង់ (Orders Count)'),
    strCell('ចំណូលសរុប ($ USD)'),
    strCell('ចំណូលជាប្រាក់រៀល (KHR ៛)'),
    strCell('ចំណែកនៃចំណូល (% Revenue)'),
  ]);

  let chanIdx = 1;
  Object.entries(channelDistMap).forEach(([chanName, val]) => {
    const pctRev = grandRev > 0 ? (val.revenueUSD / grandRev) * 100 : 0;
    distData.push([
      numCell(chanIdx++),
      strCell(chanName),
      numCell(val.count),
      numCell(val.revenueUSD, '$#,##0.00'),
      numCell(Math.round(val.revenueUSD * EXCHANGE_RATE_KHR), '#,##0'),
      strCell(`${pctRev.toFixed(1)}%`),
    ]);
  });

  const wsPercent = XLSX.utils.aoa_to_sheet(distData);
  wsPercent['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Subtitle
  ];
  autoFitColumns(wsPercent, 12, 50);

  // =========================================================================
  // SHEET 5: គំរូ_កូដ_ថ្លៃដើម (Clean Code & Cost Sales Report - Without Revenue & Profit)
  // =========================================================================
  const productCostReport = calculateProductCostReportData(products, orders, periodLabel);
  const costReportHeaders = ['កូដ', 'ឈ្មោះ', 'បានលក់', 'ថ្លៃដើម'];
  const costAoa: (XLSX.CellObject | null)[][] = [
    [strCell(productCostReport.dateLabel), null, null, null],
    costReportHeaders.map((h) => strCell(h)),
  ];

  productCostReport.items.forEach((it) => {
    costAoa.push([
      strCell(it.code),
      strCell(it.name),
      numCell(it.qtySold),
      numCell(it.costTotal, '$#,##0.00'),
    ]);
  });

  // Total summary row
  costAoa.push([
    strCell(''),
    strCell(''),
    numCell(productCostReport.totalSold),
    numCell(productCostReport.totalCost, '$#,##0.00'),
  ]);

  const wsProductCost = XLSX.utils.aoa_to_sheet(costAoa);
  wsProductCost['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Date title merge
  ];
  wsProductCost['!cols'] = [
    { wch: 12 }, // កូដ
    { wch: 32 }, // ឈ្មោះ
    { wch: 16 }, // បានលក់
    { wch: 20 }, // ថ្លៃដើម
  ];

  // =========================================================================
  // Create Workbook and append all sheets in logical order
  // =========================================================================
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsProductCost, 'គំរូ_កូដ_ថ្លៃដើម');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'សង្ខេប_KPI_Summary');
  XLSX.utils.book_append_sheet(wb, wsOrders, 'បញ្ជីកុម្ម៉ង់_Orders');
  XLSX.utils.book_append_sheet(wb, wsStock, 'ស្តុកទំនិញ_Stock_Inventory');
  XLSX.utils.book_append_sheet(wb, wsPercent, 'ការបែងចែក_Distribution');

  // Generate clean timestamped filename
  const cleanDateStr = now.toISOString().split('T')[0];
  const filename = `TIV_HAI_Fertilizer_Sales_Stock_Report_${cleanDateStr}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(wb, filename);
}
