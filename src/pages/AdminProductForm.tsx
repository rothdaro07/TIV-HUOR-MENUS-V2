import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Trash2,
  Loader2,
  ImageOff,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TableProperties,
  Plus,
  Eye,
  Tractor,
  FlaskConical,
  Sprout,
  Leaf,
  Layers,
  Wheat,
  Sparkles,
} from 'lucide-react';
import { Product, Category, ProductGroupId, StockStatus } from '../types';
import { ProductBagIllustration, isValidProductImageUrl } from '../components/ProductBagIllustration';
import { ProductSpecTable } from '../components/ProductSpecTable';
import { INITIAL_CATEGORIES, PRODUCT_GROUPS } from '../data/initialProducts';
import { uploadToCloudinary } from '../lib/cloudinary';
import { getDefaultChemicalSizes } from '../utils/pricing';

interface AdminProductFormProps {
  initialProduct?: Product | null;
  categories?: Category[];
  onSave: (product: Product) => void;
  onCancel: () => void;
  onQuickAddCategory?: (category: Category) => void;
}

const GROUP_DISPLAY_LABELS: Record<string, string> = {
  machinery: 'Machinery (គ្រឿងចក្រកសិកម្ម)',
  chemical_fertilizer: 'Chemical Fertilizer (ជីគីមី)',
  organic_fertilizer: 'Organic Fertilizer (ជីសរីរាង្គ)',
  compost_fertilizer: 'Compost Fertilizer (ជីកំប៉ុស)',
  soil_raw_material: 'Soil Raw Material (វត្ថុធាតុដើមដី)',
  feed_raw_material: 'Feed Raw Material (វត្ថុធាតុដើមចំណី)',
  mushroom_nutrient: 'Mushroom Nutrients (អាហារផ្សិត)',
};

const SUBCATEGORY_SHORT_EN: Record<string, string> = {
  tractor: 'Tractor',
  harvester: 'Harvester',
  sprayer: 'Sprayer',
  machinery_parts: 'Parts & Tools',
  NPK: 'NPK',
  Single: 'Single',
  Special: 'Soil Improver',
  Foliar: 'Foliar',
  SuperHumic: 'SuperHumic',
  Organic: 'Organic Pellet',
  LiquidOrganic: 'Liquid Organic',
  BioCompost: 'BioCompost',
  MicrobialCompost: 'Microbial Compost',
  CompostInoculant: 'EM Inoculant',
  Dolomite: 'Dolomite',
  Zeolite: 'Zeolite',
  AgriLime: 'Agri Lime',
  RockPhosphate: 'Rock Phosphate',
  SoybeanMeal: 'Soybean Meal',
  RiceBran: 'Rice Bran',
  FishMeal: 'Fish Meal',
  FeedPremix: 'Feed Premix',
  MushroomBran: 'Substrate Bran',
  MushroomLime: 'Mushroom Lime',
  MushroomSpawn: 'Spawn',
  MushroomTools: 'Mushroom Tools',
};

function compressImageToDataUrl(file: File, maxDim = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function getInitialUnitPackage(product?: Product | null): string {
  if (!product) return '';
  if (product.packagingSize) {
    const pkg = product.packagingSize.trim();
    if (/^[a-zA-Z0-9\s./-]+$/.test(pkg)) {
      return pkg.replace(/^\/\s*/, '');
    }
  }
  if (product.groupId === 'machinery') {
    return 'unit';
  }
  const w = (product.weight || '').trim();
  if (w && w !== '1,950kg' && w !== '3,650kg' && w !== '420kg') {
    if (w.toLowerCase().includes('bag') || w.toLowerCase().includes('unit') || w.toLowerCase().includes('bottle')) {
      return w;
    }
    return `${w} bag`;
  }
  return '50kg bag';
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  initialProduct,
  categories = INITIAL_CATEGORIES,
  onSave,
  onCancel,
}) => {
  const isEditing = Boolean(initialProduct);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Merge categories with INITIAL_CATEGORIES so all 26 subcategories are always available
  const allCategories = React.useMemo(() => {
    const map = new Map<string, Category>();
    INITIAL_CATEGORIES.forEach((c) => map.set(c.id, c));
    categories.forEach((c) => {
      const existing = map.get(c.id);
      map.set(c.id, { ...existing, ...c });
    });
    return Array.from(map.values());
  }, [categories]);

  const initialGroup: ProductGroupId =
    (initialProduct?.groupId as ProductGroupId) || 'machinery';

  const initialGroupCategories = allCategories.filter(
    (c) => (c.groupId || 'chemical_fertilizer') === initialGroup
  );

  const [nameKh, setNameKh] = useState(initialProduct?.nameKh || '');
  const [nameEn, setNameEn] = useState(initialProduct?.name || '');
  const [groupId, setGroupId] = useState<ProductGroupId>(initialGroup);
  const [categoryId, setCategoryId] = useState<string>(
    initialProduct?.category || initialGroupCategories[0]?.id || 'tractor'
  );
  const [priceStr, setPriceStr] = useState<string>(
    initialProduct?.price !== undefined ? String(initialProduct.price) : ''
  );
  const [wholesalePriceStr, setWholesalePriceStr] = useState(
    initialProduct?.wholesalePrice !== undefined ? String(initialProduct.wholesalePrice) : ''
  );
  const [costPriceStr, setCostPriceStr] = useState(
    initialProduct?.costPrice !== undefined ? String(initialProduct.costPrice) : ''
  );
  const [productCode, setProductCode] = useState(initialProduct?.code || '');
  const [unitPackage, setUnitPackage] = useState<string>(
    getInitialUnitPackage(initialProduct)
  );
  const [stockQtyStr, setStockQtyStr] = useState<string>(
    initialProduct?.stockQty !== undefined ? String(initialProduct.stockQty) : '20'
  );
  const [stockType, setStockType] = useState<StockStatus>(
    initialProduct?.stockStatus === 'overseas_stock'
      ? 'overseas_stock'
      : initialProduct?.stockStatus === 'out_of_stock'
      ? 'out_of_stock'
      : 'in_stock'
  );
  const [imageUrl, setImageUrl] = useState<string>(
    isValidProductImageUrl(initialProduct?.imageUrl) ? initialProduct!.imageUrl.trim() : ''
  );

  // =========================================================================
  // តារាងលក្ខណៈ (Specification Table State by Group)
  // =========================================================================
  const [showSpecTableEditor, setShowSpecTableEditor] = useState(true);
  const [showSpecPreview, setShowSpecPreview] = useState(false);

  // Common Spec fields
  const [npk, setNpk] = useState(initialProduct?.npk || '');
  const [usage, setUsage] = useState(initialProduct?.usage || '');
  const [registrationNo, setRegistrationNo] = useState(
    initialProduct?.registrationNo || 'TH-STD-2026'
  );
  const [suitableCropsStr, setSuitableCropsStr] = useState(
    (initialProduct?.suitableCrops || ['ស្រូវ', 'ដំណាំហូបផ្លែ', 'បន្លែគ្រប់ប្រភេទ']).join(', ')
  );

  // 1. Machinery Specs (គ្រឿងចក្រកសិកម្ម)
  const [machBrandModel, setMachBrandModel] = useState(
    initialProduct?.machinerySpecs?.brandModel || initialProduct?.name || ''
  );
  const [machHorsepower, setMachHorsepower] = useState(
    initialProduct?.machinerySpecs?.horsepower || initialProduct?.npk || '50 HP / 4WD'
  );
  const [machEngineType, setMachEngineType] = useState(
    initialProduct?.machinerySpecs?.engineType || 'Diesel 4 ស៊ីឡាំង Direct Injection'
  );
  const [machDriveSystem, setMachDriveSystem] = useState(
    initialProduct?.machinerySpecs?.driveSystem ||
      initialProduct?.machinerySpecs?.transmission ||
      'Synchro-Shuttle 8F x 8R / 4WD'
  );
  const [machFuelConsumption, setMachFuelConsumption] = useState(
    initialProduct?.machinerySpecs?.fuelConsumption || '3.5 - 4.8 L/ម៉ោង'
  );
  const [machWorkingCapacity, setMachWorkingCapacity] = useState(
    initialProduct?.machinerySpecs?.workingCapacity || initialProduct?.usage || '1.5 - 2.5 ហិកតា/ថ្ងៃ'
  );
  const [machWarranty, setMachWarranty] = useState(
    initialProduct?.machinerySpecs?.warranty || 'ធានា ១ ឆ្នាំ គ្រឿងបន្លាស់គ្រប់គ្រាន់'
  );
  const [machCondition, setMachCondition] = useState(
    initialProduct?.machinerySpecs?.condition || 'ទំនិញថ្មី ១០០% (New Factory)'
  );
  const [machDimensions, setMachDimensions] = useState(
    initialProduct?.machinerySpecs?.dimensions ||
      initialProduct?.machinerySpecs?.dimensionsWeight ||
      initialProduct?.weight ||
      '1,850 kg'
  );

  // 2. Chemical Fertilizer Specs (ជីគីមី)
  const [chemNutrientN, setChemNutrientN] = useState(initialProduct?.nutrients?.n || '');
  const [chemNutrientP, setChemNutrientP] = useState(initialProduct?.nutrients?.p || '');
  const [chemNutrientK, setChemNutrientK] = useState(initialProduct?.nutrients?.k || '');
  const [chemNutrientTE, setChemNutrientTE] = useState(
    initialProduct?.nutrients?.other ||
      initialProduct?.chemicalSpecs?.microNutrientsTE ||
      ''
  );
  const [chemGranuleShape, setChemGranuleShape] = useState(
    initialProduct?.chemicalSpecs?.granuleColorShape || 'គ្រាប់ចម្រុះគុណភាពខ្ពស់ រលាយសព្វល្អ'
  );
  const [chemAppRate, setChemAppRate] = useState(
    initialProduct?.chemicalSpecs?.applicationRate || '150 - 250 គីឡូក្រាម / ហិកតា'
  );

  // 3. Organic & Compost Specs (ជីសរីរាង្គ & ជីកំប៉ុស)
  const [orgMatter, setOrgMatter] = useState(
    initialProduct?.organicSpecs?.organicMatter ||
      initialProduct?.organicSpecs?.organicMatterOM ||
      '≥ 45% (High Organic Matter)'
  );
  const [orgHumicFulvic, setOrgHumicFulvic] = useState(
    initialProduct?.organicSpecs?.humicFulvic ||
      initialProduct?.organicSpecs?.humicFulvicAcid ||
      '15% Humic + 3% Fulvic Acid'
  );
  const [orgMicrobes, setOrgMicrobes] = useState(
    initialProduct?.organicSpecs?.microorganisms ||
      'Trichoderma & Bacillus (1x10^8 CFU/g)'
  );
  const [orgPhMoisture, setOrgPhMoisture] = useState(
    initialProduct?.organicSpecs?.phAndMoisture || 'pH 6.5 - 7.5 (សំណើម ≤ 20%)'
  );
  const [orgPhysicalForm, setOrgPhysicalForm] = useState(
    initialProduct?.organicSpecs?.physicalForm ||
      initialProduct?.organicSpecs?.formType ||
      'គ្រាប់មូល Pellet (ទំហំ 3-4mm)'
  );
  const [orgCertification, setOrgCertification] = useState(
    initialProduct?.organicSpecs?.certification || 'Organic Standard GAP / ISO'
  );

  // 4. Raw Materials & Mushroom Nutrients (វត្ថុធាតុដើមដី, ចំណី, អាហារផ្សិត)
  const [rawPurity, setRawPurity] = useState(
    initialProduct?.rawMaterialSpecs?.purity ||
      initialProduct?.rawMaterialSpecs?.purityGrade ||
      '98.5% Pure Grade'
  );
  const [rawFormula, setRawFormula] = useState(
    initialProduct?.rawMaterialSpecs?.chemicalFormula || initialProduct?.npk || ''
  );
  const [rawParticleSize, setRawParticleSize] = useState(
    initialProduct?.rawMaterialSpecs?.particleSize ||
      initialProduct?.rawMaterialSpecs?.particleMeshSize ||
      '100 - 200 Mesh Powder / Fine'
  );
  const [rawSolubility, setRawSolubility] = useState(
    initialProduct?.rawMaterialSpecs?.solubility ||
      initialProduct?.rawMaterialSpecs?.solubilityPH ||
      'គុណភាពស្តង់ដារ / សំណើមទាប'
  );
  const [rawStandardGrade, setRawStandardGrade] = useState(
    initialProduct?.rawMaterialSpecs?.standardGrade ||
      initialProduct?.rawMaterialSpecs?.standardCOA ||
      'COA Inspection Standard Passed'
  );
  const [rawOrigin, setRawOrigin] = useState(
    initialProduct?.rawMaterialSpecs?.origin ||
      initialProduct?.rawMaterialSpecs?.originCountry ||
      'នាំចូលផ្ទាល់ពីរោងចក្រស្តង់ដារអន្តរជាតិ'
  );

  // Custom extra rows in តារាងលក្ខណៈ
  const [customSpecs, setCustomSpecs] = useState<{ labelKh: string; value: string }[]>(
    initialProduct?.specifications && initialProduct.specifications.length > 0
      ? initialProduct.specifications
      : []
  );

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const groupCategories = allCategories.filter(
    (c) => (c.groupId || 'chemical_fertilizer') === groupId
  );

  const handleGroupChange = (newGroupId: ProductGroupId) => {
    setGroupId(newGroupId);
    const matching = allCategories.filter(
      (c) => (c.groupId || 'chemical_fertilizer') === newGroupId
    );
    if (matching.length > 0) {
      setCategoryId(matching[0].id);
    }
    if (!unitPackage || unitPackage === 'unit' || unitPackage === '50kg bag' || unitPackage === 'bag') {
      if (newGroupId === 'machinery') {
        setUnitPackage('unit');
      } else if (newGroupId === 'mushroom_nutrient') {
        setUnitPackage('bag');
      } else {
        setUnitPackage('50kg bag');
      }
    }
  };

  const handleAddCustomSpecRow = () => {
    setCustomSpecs((prev) => [...prev, { labelKh: '', value: '' }]);
  };

  const handleUpdateCustomSpecRow = (index: number, field: 'labelKh' | 'value', val: string) => {
    setCustomSpecs((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: val } : row))
    );
  };

  const handleRemoveCustomSpecRow = (index: number) => {
    setCustomSpecs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(15);
    setUploadError(null);

    try {
      const uploadedUrl = await uploadToCloudinary(file, (pct) => {
        setUploadProgress(pct);
      });
      setImageUrl(uploadedUrl);
    } catch (err: any) {
      console.warn('Cloudinary upload failed, using compressed local image:', err);
      try {
        const compressed = await compressImageToDataUrl(file);
        setImageUrl(compressed);
      } catch {
        setUploadError('មិនអាចបញ្ចូលរូបភាពបានទេ សូមសាកល្បងម្តងទៀត');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const buildConstructedProduct = (): Product => {
    const trimmedKh = nameKh.trim();
    const trimmedEn = nameEn.trim();
    const parsedPrice = parseFloat(priceStr);
    const finalPrice = !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;

    const parsedStock = parseInt(stockQtyStr, 10);
    const finalStockQty =
      stockType === 'out_of_stock'
        ? 0
        : !isNaN(parsedStock) && parsedStock >= 0
        ? parsedStock
        : 0;

    const parsedWholesale = parseFloat(wholesalePriceStr);
    const finalWholesale =
      !isNaN(parsedWholesale) && parsedWholesale > 0 ? parsedWholesale : undefined;

    const parsedCost = parseFloat(costPriceStr);
    const finalCostPrice =
      !isNaN(parsedCost) && parsedCost >= 0 ? parsedCost : initialProduct?.costPrice;

    const groupObj = PRODUCT_GROUPS.find((g) => g.id === groupId);
    const catObj =
      allCategories.find((c) => c.id === categoryId) || groupCategories[0] || allCategories[0];

    const cleanUnitPkg =
      unitPackage.trim().replace(/^\/\s*/, '') ||
      (groupId === 'machinery' ? 'unit' : '50kg bag');

    const weightMatch = cleanUnitPkg.match(/(\d+(?:\.\d+)?\s*(?:kg|g|l|ml|ton))/i);
    const extractedWeight =
      groupId === 'machinery' && machDimensions.trim()
        ? machDimensions.trim()
        : weightMatch
        ? weightMatch[1].replace(/\s+/g, '')
        : initialProduct?.weight || cleanUnitPkg;

    const extractedStockUnit = weightMatch
      ? weightMatch[1].replace(/\s+/g, '')
      : cleanUnitPkg;

    const resolvedNpk =
      groupId === 'machinery'
        ? machHorsepower.trim() || npk.trim() || trimmedEn || trimmedKh
        : groupId === 'soil_raw_material' ||
          groupId === 'feed_raw_material' ||
          groupId === 'mushroom_nutrient'
        ? rawFormula.trim() || rawPurity.trim() || npk.trim() || trimmedEn || trimmedKh
        : groupId === 'organic_fertilizer' || groupId === 'compost_fertilizer'
        ? orgMatter.trim() || npk.trim() || trimmedEn || trimmedKh
        : npk.trim() || trimmedEn || trimmedKh;

    const parsedCrops = suitableCropsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanedCustomSpecs = customSpecs
      .map((s) => ({ labelKh: s.labelKh.trim(), value: s.value.trim() }))
      .filter((s) => s.labelKh && s.value);

    return {
      ...(initialProduct || {}),
      id: initialProduct?.id || `prod-${Date.now()}`,
      code: productCode.trim() || initialProduct?.code,
      nameKh: trimmedKh || trimmedEn || 'ទំនិញថ្មី',
      name: trimmedEn || trimmedKh || 'New Product',
      nicknameKh: initialProduct?.nicknameKh || '',
      groupId,
      groupKh: groupObj?.nameKh || 'ជីគីមី',
      category: catObj?.id || categoryId,
      categoryKh: catObj?.nameKh || 'ជីគីមី NPK',
      npk: resolvedNpk,
      usage:
        usage.trim() ||
        (groupId === 'machinery' ? machWorkingCapacity.trim() : '') ||
        initialProduct?.usage ||
        `${trimmedKh || trimmedEn} គុណភាពខ្ពស់សម្រាប់កសិកម្មទំនើប`,
      detailedUsage: initialProduct?.detailedUsage || usage.trim() || '',
      packagingSize: cleanUnitPkg,
      weight: extractedWeight,
      price: finalPrice,
      wholesalePrice: finalWholesale,
      costPrice: finalCostPrice,
      imageUrl: isValidProductImageUrl(imageUrl) ? imageUrl.trim() : '',
      order: initialProduct?.order ?? 1,
      registrationNo: registrationNo.trim() || 'TH-STD-2026',
      bagColorTheme: initialProduct?.bagColorTheme || 'blue',
      granuleColor: initialProduct?.granuleColor || 'white-pearl',
      nutrients: {
        ...(initialProduct?.nutrients || {}),
        n: chemNutrientN.trim() || undefined,
        p: chemNutrientP.trim() || undefined,
        k: chemNutrientK.trim() || undefined,
        other: chemNutrientTE.trim() || initialProduct?.nutrients?.other || undefined,
      },
      machinerySpecs:
        groupId === 'machinery'
          ? {
              brandModel: machBrandModel.trim() || trimmedEn || trimmedKh,
              horsepower: machHorsepower.trim(),
              engineType: machEngineType.trim(),
              driveSystem: machDriveSystem.trim(),
              transmission: machDriveSystem.trim(),
              fuelConsumption: machFuelConsumption.trim(),
              workingCapacity: machWorkingCapacity.trim() || usage.trim(),
              warranty: machWarranty.trim(),
              condition: machCondition.trim(),
              dimensions: machDimensions.trim(),
              dimensionsWeight: machDimensions.trim(),
            }
          : initialProduct?.machinerySpecs,
      chemicalSpecs:
        groupId === 'chemical_fertilizer'
          ? {
              npkRatio: npk.trim() || trimmedEn,
              microNutrientsTE: chemNutrientTE.trim(),
              granuleColorShape: chemGranuleShape.trim(),
              bagWeight: cleanUnitPkg,
              registrationNo: registrationNo.trim(),
              applicationRate: chemAppRate.trim(),
            }
          : initialProduct?.chemicalSpecs,
      organicSpecs:
        groupId === 'organic_fertilizer' || groupId === 'compost_fertilizer'
          ? {
              organicMatter: orgMatter.trim(),
              organicMatterOM: orgMatter.trim(),
              humicFulvic: orgHumicFulvic.trim(),
              humicFulvicAcid: orgHumicFulvic.trim(),
              microorganisms: orgMicrobes.trim(),
              phAndMoisture: orgPhMoisture.trim(),
              physicalForm: orgPhysicalForm.trim(),
              formType: orgPhysicalForm.trim(),
              certification: orgCertification.trim(),
            }
          : initialProduct?.organicSpecs,
      rawMaterialSpecs:
        groupId === 'soil_raw_material' ||
        groupId === 'feed_raw_material' ||
        groupId === 'mushroom_nutrient' ||
        groupId === 'raw_material'
          ? {
              purity: rawPurity.trim(),
              purityGrade: rawPurity.trim(),
              chemicalFormula: rawFormula.trim() || npk.trim(),
              particleSize: rawParticleSize.trim(),
              particleMeshSize: rawParticleSize.trim(),
              solubility: rawSolubility.trim(),
              solubilityPH: rawSolubility.trim(),
              packagingType: cleanUnitPkg,
              standardGrade: rawStandardGrade.trim(),
              standardCOA: rawStandardGrade.trim(),
              origin: rawOrigin.trim(),
              originCountry: rawOrigin.trim(),
            }
          : initialProduct?.rawMaterialSpecs,
      specifications: cleanedCustomSpecs,
      benefits: initialProduct?.benefits || [
        'គុណភាពស្តង់ដារក្រុមហ៊ុន ទីវ ហៃ',
        'បង្កើនទិន្នផល និងសន្សំសំចៃខ្ពស់',
      ],
      suitableCrops:
        parsedCrops.length > 0
          ? parsedCrops
          : ['ស្រូវ', 'ដំណាំហូបផ្លែ', 'បន្លែគ្រប់ប្រភេទ'],
      availableSizes:
        initialProduct?.availableSizes && initialProduct.availableSizes.length > 0
          ? initialProduct.availableSizes
          : groupId === 'chemical_fertilizer' && finalPrice > 0
          ? getDefaultChemicalSizes(finalPrice)
          : [],
      isPopular: initialProduct?.isPopular ?? false,
      isNew: initialProduct?.isNew ?? false,
      inStock: finalStockQty > 0 && stockType !== 'out_of_stock',
      stockStatus: finalStockQty <= 0 ? 'out_of_stock' : stockType,
      stockQty: finalStockQty,
      stockUnit: extractedStockUnit,
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedKh = nameKh.trim();
    const trimmedEn = nameEn.trim();
    if (!trimmedKh && !trimmedEn) {
      setFormError('សូមបញ្ចូលឈ្មោះទំនិញ (Name Khmer ឬ Name English)');
      return;
    }

    const finalProduct = buildConstructedProduct();
    onSave(finalProduct);
  };

  const previewProduct = buildConstructedProduct();
  const currentGroupObj = PRODUCT_GROUPS.find((g) => g.id === groupId);

  const getGroupBadgeIcon = () => {
    switch (groupId) {
      case 'machinery':
        return <Tractor className="w-4 h-4 text-amber-600" />;
      case 'organic_fertilizer':
        return <Sprout className="w-4 h-4 text-emerald-600" />;
      case 'compost_fertilizer':
        return <Leaf className="w-4 h-4 text-lime-600" />;
      case 'soil_raw_material':
        return <Layers className="w-4 h-4 text-yellow-600" />;
      case 'feed_raw_material':
        return <Wheat className="w-4 h-4 text-orange-600" />;
      case 'mushroom_nutrient':
        return <Sparkles className="w-4 h-4 text-teal-600" />;
      default:
        return <FlaskConical className="w-4 h-4 text-[#165b9e]" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200/90 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 font-['Plus_Jakarta_Sans','Battambang',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {isEditing ? 'Edit product (កែប្រែទំនិញ)' : 'Add product (បន្ថែមទំនិញថ្មី)'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ជ្រើសរើសក្រុមទំនិញ (Group) ដើម្បីបំពេញតារាងលក្ខណៈបច្ចេកទេសដោយស្វ័យប្រវត្តិ
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name (Khmer) & Name (English) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Name (Khmer) / ឈ្មោះខ្មែរ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nameKh}
                onChange={(e) => setNameKh(e.target.value)}
                placeholder="ឧ. ត្រាក់ទ័រ 50 សេះ ឬ ជី NPK 16-16-8"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-900 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Name (English) / ឈ្មោះអង់គ្លេស
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Tractor 50HP or NPK 16-16-8"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-900 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Row 2: Group & Sub-category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Group (ក្រុមទំនិញធំ)
              </label>
              <select
                value={groupId}
                onChange={(e) => handleGroupChange(e.target.value as ProductGroupId)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-900 font-medium outline-none transition-colors cursor-pointer"
              >
                {PRODUCT_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {GROUP_DISPLAY_LABELS[g.id] || `${g.name} (${g.nameKh})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Sub-category (ប្រភេទទំនិញរង)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-900 outline-none transition-colors cursor-pointer"
              >
                {groupCategories.map((cat) => {
                  const shortEn = SUBCATEGORY_SHORT_EN[cat.id] || cat.name;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {shortEn} ({cat.nameKh})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Row 3: Price (USD) & Unit / package */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Price (USD) / តម្លៃលក់រាយ ($)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="e.g. 32.50"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-900 outline-none transition-colors tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Unit / package (ខ្នាតវេចខ្ចប់)
              </label>
              <input
                type="text"
                value={unitPackage}
                onChange={(e) => setUnitPackage(e.target.value)}
                placeholder="e.g. 50kg bag, 25kg bag, unit"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Row 4: Stock quantity & Stock type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Stock quantity (ចំនួនក្នុងស្តុក)
              </label>
              <input
                type="number"
                min="0"
                value={stockQtyStr}
                onChange={(e) => {
                  const val = e.target.value;
                  setStockQtyStr(val);
                  const num = parseInt(val, 10);
                  if (num === 0) {
                    setStockType('out_of_stock');
                  } else if (stockType === 'out_of_stock' && num > 0) {
                    setStockType('in_stock');
                  }
                }}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-900 outline-none transition-colors tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Stock status (ស្ថានភាពស្តុក)
              </label>
              <select
                value={stockType}
                onChange={(e) => {
                  const newStatus = e.target.value as StockStatus;
                  setStockType(newStatus);
                  if (newStatus === 'out_of_stock') {
                    setStockQtyStr('0');
                  } else if (parseInt(stockQtyStr, 10) <= 0) {
                    setStockQtyStr('20');
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-900 outline-none transition-colors cursor-pointer"
              >
                <option value="in_stock">In Stock - Local (មានស្តុកក្នុងស្រុក)</option>
                <option value="overseas_stock">Overseas Stock (ស្តុកក្រៅប្រទេស)</option>
                <option value="out_of_stock">Out of Stock (ដាច់ស្តុក = 0)</option>
              </select>
            </div>
          </div>

          {/* Row 5: Product Image Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
              Product image (រូបភាពទំនិញ)
            </label>
            <div className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {isValidProductImageUrl(imageUrl) ? (
                  <ProductBagIllustration
                    product={previewProduct}
                    size="sm"
                    className="w-full h-full"
                  />
                ) : (
                  <ImageOff className="w-5 h-5 text-slate-400 stroke-[1.5]" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#165b9e]" />
                        <span>Uploading {uploadProgress}%...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-[#165b9e]" />
                        <span>Upload image</span>
                      </>
                    )}
                  </button>

                  {isValidProductImageUrl(imageUrl) && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={imageUrl.startsWith('data:image') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={
                    imageUrl.startsWith('data:image')
                      ? 'Uploaded image ready ✓ (or paste image URL here)'
                      : 'Or paste image URL (https://...)'
                  }
                  className="w-full px-2.5 py-1 bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                />

                {uploadError && (
                  <p className="text-[11px] text-amber-600">{uploadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 🌟 ROW 6: តារាងលក្ខណៈតាមក្រុមទំនិញ (SPECIFICATION TABLE BY PRODUCT GROUP)   */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/30 overflow-hidden">
            {/* Spec Table Section Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#1E5FA8]/10 to-blue-50 border-b border-blue-200/80 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowSpecTableEditor(!showSpecTableEditor)}
                className="flex items-center gap-2 text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center shadow-2xs">
                  {getGroupBadgeIcon()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 font-['Battambang']">
                      តារាងលក្ខណៈបច្ចេកទេស (Specification Table)
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1E5FA8] text-white font-['Battambang']">
                      {currentGroupObj?.nameKh || 'ជីគីមី'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    ទម្រង់តារាងលក្ខណៈប្តូរដោយស្វ័យប្រវត្តិទៅតាមក្រុមទំនិញ (Group) ដែលបានជ្រើសរើស
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowSpecPreview(!showSpecPreview)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                    showSpecPreview
                      ? 'bg-[#1E5FA8] text-white border-[#1E5FA8]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showSpecPreview ? 'កែប្រែតារាង' : 'មើលគំរូតារាង'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpecTableEditor(!showSpecTableEditor)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {showSpecTableEditor ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {showSpecTableEditor && (
              <div className="p-4 space-y-4">
                {showSpecPreview ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                      <span>គំរូតារាងលក្ខណៈដែលនឹងបង្ហាញលើទំព័រលម្អិតទំនិញ៖</span>
                      <button
                        type="button"
                        onClick={() => setShowSpecPreview(false)}
                        className="text-[#1E5FA8] underline cursor-pointer"
                      >
                        ត្រឡប់ទៅកែប្រែទិន្នន័យ
                      </button>
                    </div>
                    <ProductSpecTable product={previewProduct} />
                  </div>
                ) : (
                  <>
                    {/* GROUP 1: MACHINERY (គ្រឿងចក្រកសិកម្ម) */}
                    {groupId === 'machinery' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ម៉ាក & ម៉ូដែល (Brand & Model)
                          </label>
                          <input
                            type="text"
                            value={machBrandModel}
                            onChange={(e) => setMachBrandModel(e.target.value)}
                            placeholder="ឧ. Kubota L5018 / TH-500"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            កម្លាំងម៉ាស៊ីន (Horsepower HP)
                          </label>
                          <input
                            type="text"
                            value={machHorsepower}
                            onChange={(e) => {
                              setMachHorsepower(e.target.value);
                              setNpk(e.target.value);
                            }}
                            placeholder="ឧ. 50 HP / 4WD"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ប្រភេទម៉ាស៊ីន (Engine Type)
                          </label>
                          <input
                            type="text"
                            value={machEngineType}
                            onChange={(e) => setMachEngineType(e.target.value)}
                            placeholder="ឧ. Diesel 4 ស៊ីឡាំង Direct Injection"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ប្រព័ន្ធបញ្ជា & បង្វិលកង់ (Transmission / Drive)
                          </label>
                          <input
                            type="text"
                            value={machDriveSystem}
                            onChange={(e) => setMachDriveSystem(e.target.value)}
                            placeholder="ឧ. Synchro-Shuttle 8F x 8R / 4WD"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            កម្រិតស៊ីប្រេង (Fuel Consumption)
                          </label>
                          <input
                            type="text"
                            value={machFuelConsumption}
                            onChange={(e) => setMachFuelConsumption(e.target.value)}
                            placeholder="ឧ. 3.5 - 4.8 L/ម៉ោង"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ទម្ងន់ & វិមាត្រ (Weight & Dimensions)
                          </label>
                          <input
                            type="text"
                            value={machDimensions}
                            onChange={(e) => setMachDimensions(e.target.value)}
                            placeholder="ឧ. 1,850 kg"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ការធានា & សេវាកម្ម (Warranty)
                          </label>
                          <input
                            type="text"
                            value={machWarranty}
                            onChange={(e) => setMachWarranty(e.target.value)}
                            placeholder="ឧ. ធានា ១ ឆ្នាំ គ្រឿងបន្លាស់គ្រប់គ្រាន់"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ស្ថានភាពទំនិញ (Condition)
                          </label>
                          <input
                            type="text"
                            value={machCondition}
                            onChange={(e) => setMachCondition(e.target.value)}
                            placeholder="ឧ. ទំនិញថ្មី ១០០% (New Factory)"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            សមត្ថភាពការងារ & អត្ថប្រយោជន៍ (Working Capacity / Usage)
                          </label>
                          <input
                            type="text"
                            value={machWorkingCapacity}
                            onChange={(e) => {
                              setMachWorkingCapacity(e.target.value);
                              setUsage(e.target.value);
                            }}
                            placeholder="ឧ. ភ្ជួរដី ជ្រោយដី និងដឹកជញ្ជូនកសិផលគ្រប់ស្ថានភាពដី (1.5-2.0 ហិកតា/ថ្ងៃ)"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* GROUP 2: CHEMICAL FERTILIZER (ជីគីមី) */}
                    {groupId === 'chemical_fertilizer' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            រូបមន្ត NPK (NPK Formula)
                          </label>
                          <input
                            type="text"
                            value={npk}
                            onChange={(e) => setNpk(e.target.value)}
                            placeholder="ឧ. 16-16-8+TE ឬ 46-0-0"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            លេខបញ្ជីការផ្លូវការ (MAFF Reg. No)
                          </label>
                          <input
                            type="text"
                            value={registrationNo}
                            onChange={(e) => setRegistrationNo(e.target.value)}
                            placeholder="ឧ. FR02 1584/0525 TZAT-GDA"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none font-mono"
                          />
                        </div>

                        {/* Nutrients N-P-K-TE */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            សមាសធាតុចិញ្ចឹម (Nutrients %: N, P2O5, K2O, TE)
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={chemNutrientN}
                              onChange={(e) => setChemNutrientN(e.target.value)}
                              placeholder="N % (ឧ. 16)"
                              className="px-2.5 py-1.5 bg-blue-50/50 border border-blue-200 rounded-lg text-xs text-slate-900 outline-none font-mono"
                            />
                            <input
                              type="text"
                              value={chemNutrientP}
                              onChange={(e) => setChemNutrientP(e.target.value)}
                              placeholder="P2O5 % (ឧ. 16)"
                              className="px-2.5 py-1.5 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-slate-900 outline-none font-mono"
                            />
                            <input
                              type="text"
                              value={chemNutrientK}
                              onChange={(e) => setChemNutrientK(e.target.value)}
                              placeholder="K2O % (ឧ. 8)"
                              className="px-2.5 py-1.5 bg-rose-50/50 border border-rose-200 rounded-lg text-xs text-slate-900 outline-none font-mono"
                            />
                            <input
                              type="text"
                              value={chemNutrientTE}
                              onChange={(e) => setChemNutrientTE(e.target.value)}
                              placeholder="TE / S / MgO"
                              className="px-2.5 py-1.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs text-slate-900 outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ពណ៌គ្រាប់ជី & ទម្រង់ (Granule Color & Form)
                          </label>
                          <input
                            type="text"
                            value={chemGranuleShape}
                            onChange={(e) => setChemGranuleShape(e.target.value)}
                            placeholder="ឧ. គ្រាប់ចម្រុះគុណភាពខ្ពស់ រលាយសព្វល្អ"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            កម្រិតប្រើប្រាស់ណែនាំ (Application Rate)
                          </label>
                          <input
                            type="text"
                            value={chemAppRate}
                            onChange={(e) => setChemAppRate(e.target.value)}
                            placeholder="ឧ. 150 - 250 គីឡូក្រាម / ហិកតា"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ដំណាំស័ក្តិសម (Suitable Crops - បំបែកដោយសញ្ញាក្បៀស ,)
                          </label>
                          <input
                            type="text"
                            value={suitableCropsStr}
                            onChange={(e) => setSuitableCropsStr(e.target.value)}
                            placeholder="ឧ. ស្រូវ, ដំណាំហូបផ្លែ, បន្លែគ្រប់ប្រភេទ, ពោត, ដំឡូងមី"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            អត្ថប្រយោជន៍ចម្បង (Main Benefits & Usage)
                          </label>
                          <input
                            type="text"
                            value={usage}
                            onChange={(e) => setUsage(e.target.value)}
                            placeholder="ឧ. ជួយបែកគុម្ពស្រូវ ដើមរឹងមាំ ស្លឹកបៃតងក្រាស់ និងបង្កើនទិន្នផលខ្ពស់"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* GROUP 3 & 4: ORGANIC & COMPOST FERTILIZER (ជីសរីរាង្គ & ជីកំប៉ុស) */}
                    {(groupId === 'organic_fertilizer' || groupId === 'compost_fertilizer') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            សារធាតុសរីរាង្គ (Organic Matter OM %)
                          </label>
                          <input
                            type="text"
                            value={orgMatter}
                            onChange={(e) => {
                              setOrgMatter(e.target.value);
                              setNpk(e.target.value);
                            }}
                            placeholder="ឧ. ≥ 45% (High OM)"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            អាស៊ីត Humic & Fulvic
                          </label>
                          <input
                            type="text"
                            value={orgHumicFulvic}
                            onChange={(e) => setOrgHumicFulvic(e.target.value)}
                            placeholder="ឧ. 15% Humic + 3% Fulvic Acid"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            មីក្រូសារពាង្គកាយមានប្រយោជន៍ (Microbes / EM)
                          </label>
                          <input
                            type="text"
                            value={orgMicrobes}
                            onChange={(e) => setOrgMicrobes(e.target.value)}
                            placeholder="ឧ. Trichoderma & Bacillus (1x10^8 CFU/g)"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            កម្រិត pH ដី & សំណើម (pH & Moisture)
                          </label>
                          <input
                            type="text"
                            value={orgPhMoisture}
                            onChange={(e) => setOrgPhMoisture(e.target.value)}
                            placeholder="ឧ. pH 6.5 - 7.5 (សំណើម ≤ 20%)"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ទម្រង់រូបវន្ត (Physical Form)
                          </label>
                          <input
                            type="text"
                            value={orgPhysicalForm}
                            onChange={(e) => setOrgPhysicalForm(e.target.value)}
                            placeholder="ឧ. គ្រាប់មូល Pellet (3-4mm) ឬ ម្សៅកំប៉ុសម៉ត់"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            វិញ្ញាបនបត្រស្តង់ដារ (Certification)
                          </label>
                          <input
                            type="text"
                            value={orgCertification}
                            onChange={(e) => setOrgCertification(e.target.value)}
                            placeholder="ឧ. Organic Standard GAP / ISO"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            អត្ថប្រយោជន៍ចម្បង (Main Benefits & Usage)
                          </label>
                          <input
                            type="text"
                            value={usage}
                            onChange={(e) => setUsage(e.target.value)}
                            placeholder="ឧ. កែលម្អដីខូច ធ្វើឱ្យដីផុសល្អ បង្កើនឫសថ្មី និងរក្សាសំណើមដីបានយូរ"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* GROUP 5, 6, 7: SOIL RAW MATERIAL, FEED RAW MATERIAL, MUSHROOM NUTRIENT */}
                    {(groupId === 'soil_raw_material' ||
                      groupId === 'feed_raw_material' ||
                      groupId === 'mushroom_nutrient' ||
                      groupId === 'raw_material') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {groupId === 'feed_raw_material'
                              ? 'កម្រិតប្រូតេអ៊ីន / គុណភាព (Protein / Grade %)'
                              : groupId === 'mushroom_nutrient'
                              ? 'កម្រិតសារធាតុបំប៉ន / ភាពសុទ្ធ (Grade %)'
                              : 'កម្រិតភាពបរិសុទ្ធ (Purity % / Grade)'}
                          </label>
                          <input
                            type="text"
                            value={rawPurity}
                            onChange={(e) => {
                              setRawPurity(e.target.value);
                              setNpk(e.target.value);
                            }}
                            placeholder={
                              groupId === 'feed_raw_material'
                                ? 'ឧ. Protein 46-48% Feed Grade'
                                : 'ឧ. 98.5% Pure Grade'
                            }
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            រូបមន្ត / សមាសធាតុចម្បង (Formula / Main Nutrient)
                          </label>
                          <input
                            type="text"
                            value={rawFormula}
                            onChange={(e) => setRawFormula(e.target.value)}
                            placeholder="ឧ. CaMg(CO3)2 ឬ Amino + Vitamin B"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ទំហំគ្រាប់ / កម្រិតម៉ដ្ឋ (Mesh Size / Form)
                          </label>
                          <input
                            type="text"
                            value={rawParticleSize}
                            onChange={(e) => setRawParticleSize(e.target.value)}
                            placeholder="ឧ. 100 - 200 Mesh Powder / គ្រាប់ម៉ត់"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            កម្រិតរលាយ & pH / សំណើម (Solubility & pH)
                          </label>
                          <input
                            type="text"
                            value={rawSolubility}
                            onChange={(e) => setRawSolubility(e.target.value)}
                            placeholder="ឧ. រលាយក្នុងទឹក / pH 7.5 - 8.5 / សំណើម ≤ 12%"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ស្តង់ដារវិញ្ញាបនបត្រគុណភាព (COA Standard)
                          </label>
                          <input
                            type="text"
                            value={rawStandardGrade}
                            onChange={(e) => setRawStandardGrade(e.target.value)}
                            placeholder="ឧ. COA Inspection Standard Passed"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ប្រភពនាំចូល / ផលិតកម្ម (Origin)
                          </label>
                          <input
                            type="text"
                            value={rawOrigin}
                            onChange={(e) => setRawOrigin(e.target.value)}
                            placeholder="ឧ. នាំចូលផ្ទាល់ពីរោងចក្រស្តង់ដារអន្តរជាតិ"
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            អត្ថប្រយោជន៍ចម្បង & របៀបប្រើប្រាស់ (Usage)
                          </label>
                          <input
                            type="text"
                            value={usage}
                            onChange={(e) => setUsage(e.target.value)}
                            placeholder="ពិពណ៌នាខ្លីអំពីការប្រើប្រាស់ និងអត្ថប្រយោជន៍..."
                            className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Optional Extra Custom Rows for តារាងលក្ខណៈ */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                          <TableProperties className="w-3.5 h-3.5 text-[#1E5FA8]" />
                          <span>ជួរលក្ខណៈបន្ថែមក្នុងតារាង (Custom Spec Rows - Optional)</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleAddCustomSpecRow}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 text-[#1E5FA8] border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>បន្ថែមជួរថ្មី</span>
                        </button>
                      </div>

                      {customSpecs.length > 0 && (
                        <div className="space-y-2">
                          {customSpecs.map((row, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={row.labelKh}
                                onChange={(e) =>
                                  handleUpdateCustomSpecRow(idx, 'labelKh', e.target.value)
                                }
                                placeholder="ចំណងជើងជួរ (ឧ. ប្រទេសផលិត)"
                                className="w-2/5 px-3 py-1.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                              />
                              <input
                                type="text"
                                value={row.value}
                                onChange={(e) =>
                                  handleUpdateCustomSpecRow(idx, 'value', e.target.value)
                                }
                                placeholder="តម្លៃបង្ហាញ (ឧ. បច្ចេកវិទ្យាជប៉ុន)"
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomSpecRow(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="លុបជួរនេះ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Optional Wholesale, Cost Price & Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-blue-200/60">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          កូដទំនិញ (Product Code)
                        </label>
                        <input
                          type="text"
                          value={productCode}
                          onChange={(e) => setProductCode(e.target.value)}
                          placeholder="ឧ. 012 ឬ TH-01"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          តម្លៃបោះដុំ (Wholesale $)
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={wholesalePriceStr}
                          onChange={(e) => setWholesalePriceStr(e.target.value)}
                          placeholder="Optional $"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          ថ្លៃដើម (Cost Price $)
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={costPriceStr}
                          onChange={(e) => setCostPriceStr(e.target.value)}
                          placeholder="Optional $"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-lg text-xs text-slate-900 outline-none tabular-nums"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer Buttons: Cancel (left) & Save product (right) */}
          <div className="pt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 bg-[#165b9e] hover:bg-[#124b82] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              Save product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
