export interface TelegramBotConfig {
  botToken: string;                 // Telegram Bot Token e.g. "1234567890:AAFxxxxxxxxx"
  chatId: string;                   // Chat ID, Group ID, or Channel username e.g. "-1001234567890" or "@my_orders"
  topicId?: string;                 // Optional topic thread ID in supergroups
  isEnabled: boolean;               // Enable/disable automated bot dispatch
  managerName?: string;             // Manager contact name
  managerPhone?: string;            // Manager phone number
  managerTelegram?: string;         // Manager Telegram handle e.g. "@tivhai_manager"
  notifyOnNewOrder?: boolean;       // Notify when customer places order & uploads receipt
  lastTestedAt?: string;            // Last successful test timestamp
}

export interface CompanyProfile {
  nameKh: string;
  nameEn: string;
  brandName: string;
  brandSlogan: string;
  logoUrl?: string;          // Custom uploaded logo image URL
  logoText?: string;         // Short monogram e.g. "TH"
  phones: string[];
  telegram?: string;
  telegramConfig?: TelegramBotConfig; // Telegram Bot automated ordering dispatcher config
  address: string;
  workingHours?: string;
  updatedAt?: string;
}

export type ProductGroupId =
  | 'all'
  | 'machinery'
  | 'chemical_fertilizer'
  | 'organic_fertilizer'
  | 'compost_fertilizer'
  | 'soil_raw_material'
  | 'feed_raw_material'
  | 'mushroom_nutrient'
  | 'raw_material';

export interface ProductGroup {
  id:
    | 'machinery'
    | 'chemical_fertilizer'
    | 'organic_fertilizer'
    | 'compost_fertilizer'
    | 'soil_raw_material'
    | 'feed_raw_material'
    | 'mushroom_nutrient'
    | 'raw_material';
  name: string;
  nameKh: string;              // e.g. "គ្រឿងចក្រកសិកម្ម", "ជីគីមី", "ជីសរីរាង្គ", "ជីកំប៉ុស", "វត្ថុធាតុដើមដី", "វត្ថុធាតុដើមចំណី", "អាហារផ្សិត"
  description?: string;
  icon?: string;
  badgeColor?: string;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  nameKh: string;              // ឈ្មោះប្រភេទ e.g. "ត្រាក់ទ័រ & គោយន្ត", "ជីគីមី NPK", "ជីទោល"
  groupId?: 'machinery' | 'chemical_fertilizer' | 'organic_fertilizer' | 'raw_material' | string; // Parent មុខទំនិញ group ID
  groupKh?: string;            // ឈ្មោះមុខទំនិញ e.g. "គ្រឿងចក្រកសិកម្ម", "ជីគីមី", "ជីសរីរាង្គ", "វត្ថុធាតុដើម"
  description?: string;
  order?: number;
}

export interface MachinerySpecs {
  brandModel?: string;         // ម៉ាក & ម៉ូដែល e.g. "Kubota L5018 / TH-500"
  horsepower?: string;         // កម្លាំងសេះ HP e.g. "50 HP (37.3 kW)"
  engineType?: string;         // ប្រភេទម៉ាស៊ីន e.g. "Diesel 4 ស៊ីឡាំង Direct Injection"
  transmission?: string;       // ប្រព័ន្ធបញ្ជា / ចង្កឹះលេខ e.g. "Synchro-Shuttle 8F x 8R / 4WD"
  driveSystem?: string;        // e.g. "កង់ ៤ (4WD) Power Steering"
  fuelConsumption?: string;    // កម្រិតស៊ីប្រេង e.g. "3.5 - 4.8 លីត្រ/ម៉ោង"
  workingCapacity?: string;    // សមត្ថភាពការងារ e.g. "ទទឹងភ្ជួរ 2.0 ម៉ែត្រ / 1.5-2.0 ហិកតា/ថ្ងៃ"
  warranty?: string;           // ការធានា e.g. "ធានា ១ ឆ្នាំ ឬ ១,២០០ ម៉ោង"
  condition?: string;          // ស្ថានភាព e.g. "ទំនិញថ្មី ១០០% (New Factory)"
  dimensionsWeight?: string;   // វិមាត្រ & ទម្ងន់ e.g. "1,850 kg (3,250 x 1,495 x 2,050 mm)"
  dimensions?: string;
}

export interface OrganicSpecs {
  organicMatterOM?: string;    // សារធាតុសរីរាង្គ OM % e.g. "≥ 45% (Organic Matter)"
  organicMatter?: string;
  humicFulvicAcid?: string;    // អាស៊ីត Humic & Fulvic % e.g. "15% Humic + 3% Fulvic"
  humicFulvic?: string;
  microorganisms?: string;     // មីក្រូសារពាង្គកាយ CFU/g e.g. "Trichoderma & Bacillus 1x10^8 CFU/g"
  phLevel?: string;            // កម្រិត pH e.g. "pH 6.5 - 7.5 (តុល្យភាពដី)"
  phAndMoisture?: string;
  moistureContent?: string;    // កម្រិតសំណើម e.g. "≤ 20%"
  formType?: string;           // ទម្រង់រូបវន្ត e.g. "គ្រាប់មូល Pellet (ទំហំ 3-4mm)"
  physicalForm?: string;
  certification?: string;      // វិញ្ញាបនបត្រសរីរាង្គ e.g. "Organic Standard CAM-GAP / IFOAM"
}

export interface RawMaterialSpecs {
  purityGrade?: string;        // កម្រិតភាពបរិសុទ្ធ Purity % e.g. "98.5% Pure Technical Grade"
  purity?: string;
  chemicalFormula?: string;    // រូបមន្តគីមី / CAS No e.g. "(NH4)2HPO4 / CAS 7783-28-0"
  particleMeshSize?: string;   // ទំហំគ្រាប់ / Mesh e.g. "100 - 200 Mesh / Powder"
  particleSize?: string;
  solubilityPH?: string;       // កម្រិតរលាយ & pH e.g. "រលាយក្នុងទឹក 100% (pH 7.8)"
  solubility?: string;
  packagingType?: string;      // ការវេចខ្ចប់ e.g. "Big Bag 1,000kg (Jumbo) / បាវ 50kg"
  standardCOA?: string;        // ស្តង់ដារ COA / គុណភាព e.g. "COA Standard Inspection Passed"
  standardGrade?: string;
  originCountry?: string;      // ប្រភពនាំចូល e.g. "នាំចូលផ្ទាល់ពីរោងចក្រស្តង់ដារអន្តរជាតិ"
  origin?: string;
}

export interface ChemicalSpecs {
  npkRatio?: string;           // រូបមន្ត NPK e.g. "27-12-6+TE"
  totalNutrient?: string;
  microNutrientsTE?: string;   // មីក្រូសារធាតុ TE e.g. "MgO 2%, S 4%, Zn 0.1%, B 0.05%"
  microElements?: string;
  granuleColorShape?: string;  // ពណ៌គ្រាប់ & ទម្រង់ e.g. "គ្រាប់ចម្រុះផ្កាឈូក-ស-បៃតង (High Density)"
  granuleAppearance?: string;
  bagWeight?: string;          // ទម្ងន់បាវ e.g. "50 គីឡូក្រាម / បាវ"
  registrationNo?: string;     // លេខបញ្ជីការ MAFF e.g. "FR02 1584/0525 TZAT-GDA"
  applicationRate?: string;    // កម្រិតប្រើប្រាស់ e.g. "150 - 250 kg / ហិកតា"
}

export interface ProductNutrients {
  n?: string;
  p?: string;
  k?: string;
  zn?: string;
  mg?: string;
  ca?: string;
  s?: string;
  fulvicAcid?: string;
  other?: string;
}

export type StockStatus = 'in_stock' | 'overseas_stock' | 'out_of_stock';

export interface ProductPackagingOption {
  size: string;             // e.g. "50kg", "25kg", "10kg", "5kg", "1kg", "1L"
  labelKh: string;          // e.g. "បាវ ៥០ គីឡូក្រាម", "បាវ ២៥ គីឡូក្រាម", "កញ្ចប់ ១០ គីឡូក្រាម"
  weight: string;           // e.g. "50kg", "25kg", "10kg"
  price: number;            // e.g. 35.37
  wholesalePrice?: number;  // e.g. 32.00
  isDefault?: boolean;
}

export interface Product {
  id: string;
  code?: string;             // លេខកូដទំនិញ e.g. "012", "011", "109", "0105", "008", "005", "001"
  name: string;              // English/internal name e.g. "NPK 27-12-6+TE" or "Tractor 50HP TH-500"
  nameKh: string;            // ឈ្មោះទំនិញ e.g. "ត្រាក់ទ័រ 50 សេះ TH-500" or "ជី NPK 27-12-6+TE"
  nicknameKh?: string;       // e.g. "ជីគូ ១", "ជំនាញភ្ជួររាស់ខ្លាំង", "ជីទ្រាប់បាត"
  groupId?: 'machinery' | 'chemical_fertilizer' | 'organic_fertilizer' | 'raw_material' | string; // មុខទំនិញ (Group)
  groupKh?: string;          // e.g. "គ្រឿងចក្រកសិកម្ម", "ជីគីមី", "ជីសរីរាង្គ", "វត្ថុធាតុដើម"
  category: string;          // Category ID e.g. 'tractor' | 'NPK' | 'SuperHumic' | 'Single' | 'RawMaterials'
  categoryKh: string;        // e.g. "ត្រាក់ទ័រ & គោយន្ត", "ជីគីមី NPK", "វត្ថុធាតុដើមផ្សំជី"
  npk: string;               // e.g. "27-12-6+TE" or "50 HP / 4WD" or "P2O5 28%"
  usage: string;             // ការប្រើប្រាស់ (Short headline/usage)
  detailedUsage?: string;    // សេចក្តីលម្អិតពីការប្រើប្រាស់
  packagingSize: string;     // ខ្នាតវេចខ្ចប់ / ខ្នាតម៉ាស៊ីន e.g. "បាវ ៥០ គីឡូក្រាម" or "១ គ្រឿង (Set)"
  weight: string;            // ទម្ងន់ e.g. "50kg" or "1,850kg"
  price: number;             // តម្លៃលក់រាយជាដុល្លារ ($ USD Retail)
  wholesalePrice?: number;   // តម្លៃបោះដុំជាដុល្លារ ($ USD Wholesale)
  costPrice?: number;        // ថ្លៃដើមទំនិញជាដុល្លារ ($ USD Cost Price)
  imageUrl: string;          // Main image URL or preset identifier
  granuleImageUrl?: string;  // Granule/Closeup image URL
  order: number;             // Sort order
  registrationNo: string;    // លេខបញ្ជីការ / លេខស្តង់ដារ e.g. "R-FR02 1584/0525 TZAT-GDA" or "ISO-9001 / TH-MECH-2026"
  bagColorTheme: 'rainbow' | 'green' | 'yellow' | 'black' | 'red' | 'blue' | 'purple';
  granuleColor: string;      // e.g. 'mixed-pink-white', 'white-pearl', 'brown-granule', 'grey-pellet', 'metallic-blue', 'iron-grey'
  nutrients: ProductNutrients;
  benefits: string[];        // អត្ថប្រយោជន៍ចម្បងៗ
  suitableCrops: string[];   // ដំណាំសមស្រប ឬ ប្រភេទដី/ការងារ
  machinerySpecs?: MachinerySpecs;       // ព័ត៌មានជាក់លាក់គ្រឿងយន្តកសិកម្ម
  organicSpecs?: OrganicSpecs;           // ព័ត៌មានជាក់លាក់ជីសរីរាង្គ
  rawMaterialSpecs?: RawMaterialSpecs;   // ព័ត៌មានជាក់លាក់វត្ថុធាតុដើម
  chemicalSpecs?: ChemicalSpecs;         // ព័ត៌មានជាក់លាក់ជីគីមី
  applicationRates?: {
    crop: string;
    stage: string;
    rate: string;
  }[];
  specifications?: {
    labelKh: string;
    value: string;
  }[];                       // Flexible specs for Machinery & Raw Materials
  isPopular?: boolean;
  isNew?: boolean;
  inStock?: boolean;
  stockStatus?: StockStatus; // 'in_stock' (មានស្ដុក - ក្នុងស្រុក) | 'overseas_stock' (មានស្ដុកនៅក្រៅប្រទេស) | 'out_of_stock' (អស់ពីស្តុក)
  stockQty?: number;         // ចំនួនទំនិញក្នុងស្តុក e.g. 150
  stockUnit?: string;        // ឯកតាក្នុងស្តុក e.g. 'បាវ', 'គ្រឿង', 'ឈុត', 'តោន', 'ដប', 'កញ្ចប់'
  availableSizes?: ProductPackagingOption[]; // ជម្រើសខ្នាតវេចខ្ចប់សម្រាប់ជ្រើសរើស (e.g. 50kg, 25kg, 10kg, 5kg)
  selectedSize?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ViewMode = 'grid' | 'list';
export type Currency = 'USD' | 'KHR';
export type PriceMode = 'retail' | 'wholesale'; // លក់រាយ (Retail) ឬ បោះដុំ (Wholesale)

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedWeight?: string;
  selectedPackaging?: string;
  unitPrice?: number;
}

export type DeliveryMethod = 'branch' | 'door';

export type ProvinceTier = 'central' | 'main' | 'regional' | 'remote';

export interface CambodiaProvince {
  id: string;
  nameKh: string;
  nameEn: string;
  isCapital?: boolean;
  tier: ProvinceTier;
  estimatedHours: string;
  popularBranches: string[];
}

export interface BankPaymentAccount {
  id: string;
  bankId: 'aba' | 'acleda' | 'wing' | 'canadia' | 'sathapana' | 'vattanac' | 'bakong' | 'custom';
  bankName: string;
  bankNameKh: string;
  accountName: string;
  accountNumber: string;
  currency: 'USD' | 'KHR' | 'BOTH';
  qrImageUrl: string; // Static image QR uploaded by admin or preset
  logoBgColor?: string;
  logoTextColor?: string;
  badgeText?: string;
  descriptionKh?: string;
  isDefault?: boolean;
  isEnabled: boolean;
  order: number;
  updatedAt?: string;
}

export type PurchaseChannel = 'online' | 'direct'; // ទិញតាមរយះ Online ឬ ផ្ទាល់
export type PaymentTypeOption = 'cash' | 'scan_qr' | 'credit_unpaid'; // ទូទាត់លុយសុទ្ធ, Scan QR, ជំពាក់ មិនទាន់ទូទាត់

export interface OrderCustomerInfo {
  fullName: string;
  phone: string;
  provinceId?: string;
  districtVillage?: string;
  deliveryMethod?: DeliveryMethod;
  selectedBranch?: string;
  notes?: string;
}

export interface DeliveryFeeCalculation {
  totalActualWeightKg: number;
  totalVolumetricWeightKg: number;
  billableWeightKg: number;
  weightTier: 'small' | 'medium' | 'bulk';
  baseRateUSD: number;
  weightFeeUSD: number;
  doorDeliveryFeeUSD: number;
  totalFeeUSD: number;
  totalFeeKHR: number;
  ratePerKgUSD: number;
  breakdownKh: string;
  estimatedDeliveryTime: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: OrderCustomerInfo;
  deliveryFee: DeliveryFeeCalculation;
  subtotalUSD: number;
  subtotalKHR: number;
  totalUSD: number;
  totalKHR: number;
  status: 'pending_payment' | 'paid' | 'confirmed' | 'shipped' | 'cancelled';
  purchaseChannel?: PurchaseChannel; // 'online' (ទិញតាមរយះ Online) | 'direct' (ទិញផ្ទាល់)
  paymentType?: PaymentTypeOption; // 'cash' (ទូទាត់លុយសុទ្ធ) | 'scan_qr' (Scan QR) | 'credit_unpaid' (ជំពាក់ មិនទាន់ទូទាត់)
  paymentMethod: 'bank_qr' | 'bakong_khqr' | 'cash' | 'credit';
  selectedBankId?: string;
  selectedBankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  khqrRef: string;
  paymentProofUrl?: string;     // Uploaded invoice / transfer slip image URL or base64
  paymentProofName?: string;
  managerNotes?: string;
  confirmedAt?: string;
  telegramNotified?: boolean;
  telegramMessageId?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminAuthSettings {
  email: string;
  isEmailVerified: boolean;
  password?: string;
  updatedAt?: string;
}

export interface SystemBackupData {
  version: string;
  exportedAt: string;
  companyProfile?: CompanyProfile;
  categories: Category[];
  products: Product[];
  bankAccounts?: BankPaymentAccount[];
  orders?: Order[];
}
