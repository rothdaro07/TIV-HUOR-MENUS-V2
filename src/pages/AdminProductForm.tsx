import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Plus,
  Trash2,
  Tractor,
  FlaskConical,
  Sprout,
  Layers,
  Leaf,
  Mountain,
  Wheat,
  Wrench,
  ShieldCheck,
  Zap,
  Boxes,
  Globe,
  PackageCheck,
  Check,
} from 'lucide-react';
import { Product, Category, ProductGroupId, ProductPackagingOption, StockStatus } from '../types';
import { ImageUploader } from '../components/ImageUploader';
import { ProductBagIllustration } from '../components/ProductBagIllustration';
import { INITIAL_CATEGORIES, PRODUCT_GROUPS } from '../data/initialProducts';
import { getDefaultChemicalSizes } from '../utils/pricing';

interface AdminProductFormProps {
  initialProduct?: Product | null;
  categories?: Category[];
  onSave: (product: Product) => void;
  onCancel: () => void;
  onQuickAddCategory?: (category: Category) => void;
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  initialProduct,
  categories = INITIAL_CATEGORIES,
  onSave,
  onCancel,
  onQuickAddCategory,
}) => {
  const isEditing = Boolean(initialProduct);

  const [isAddingNewCatModal, setIsAddingNewCatModal] = useState(false);
  const [newCatKh, setNewCatKh] = useState('');
  const [newCatEn, setNewCatEn] = useState('');

  const currentGroup = initialProduct?.groupId || 'chemical_fertilizer';
  const matchingGroupObj = PRODUCT_GROUPS.find((g) => g.id === currentGroup);

  const [formData, setFormData] = useState<Partial<Product>>({
    id: initialProduct?.id || `sku-${Date.now()}`,
    name: initialProduct?.name || '',
    nameKh: initialProduct?.nameKh || '',
    nicknameKh: initialProduct?.nicknameKh || '',
    groupId: currentGroup,
    groupKh: initialProduct?.groupKh || matchingGroupObj?.nameKh || 'ជីគីមី',
    category: initialProduct?.category || categories[0]?.id || 'NPK',
    categoryKh: initialProduct?.categoryKh || categories[0]?.nameKh || 'ជីគីមី NPK',
    npk: initialProduct?.npk || '',
    usage: initialProduct?.usage || '',
    detailedUsage: initialProduct?.detailedUsage || '',
    packagingSize: initialProduct?.packagingSize || (currentGroup === 'machinery' ? '១ គ្រឿង (Full Set)' : currentGroup === 'raw_material' ? 'Big Bag 1,000kg (Jumbo)' : 'បាវ ៥០ គីឡូក្រាម'),
    weight: initialProduct?.weight || (currentGroup === 'machinery' ? '1,950kg' : currentGroup === 'raw_material' ? '1,000kg' : '50kg'),
    price: initialProduct?.price || (currentGroup === 'machinery' ? 12000 : 25),
    imageUrl: initialProduct?.imageUrl || '',
    order: initialProduct?.order || 99,
    registrationNo: initialProduct?.registrationNo || '',
    bagColorTheme: initialProduct?.bagColorTheme || 'rainbow',
    granuleColor: initialProduct?.granuleColor || 'mixed-pink-white',

    // Stock & Inventory
    stockStatus: initialProduct?.stockStatus || 'in_stock',
    stockQty: initialProduct?.stockQty ?? (currentGroup === 'machinery' ? 10 : 200),
    stockUnit: initialProduct?.stockUnit || (currentGroup === 'machinery' ? 'គ្រឿង' : 'បាវ'),

    // Packaging Sizes
    availableSizes: initialProduct?.availableSizes && initialProduct.availableSizes.length > 0
      ? initialProduct.availableSizes
      : currentGroup === 'chemical_fertilizer'
      ? getDefaultChemicalSizes(initialProduct?.price || 35)
      : [],

    // Specific Specs
    machinerySpecs: {
      brandModel: initialProduct?.machinerySpecs?.brandModel || '',
      horsepower: initialProduct?.machinerySpecs?.horsepower || '',
      engineType: initialProduct?.machinerySpecs?.engineType || '',
      driveSystem: initialProduct?.machinerySpecs?.driveSystem || '',
      fuelConsumption: initialProduct?.machinerySpecs?.fuelConsumption || '',
      workingCapacity: initialProduct?.machinerySpecs?.workingCapacity || '',
      warranty: initialProduct?.machinerySpecs?.warranty || 'ធានា ១២ ខែ និងសេវាថែទាំ',
      condition: initialProduct?.machinerySpecs?.condition || 'ទំនិញថ្មី ១០០% (New Factory)',
      dimensions: initialProduct?.machinerySpecs?.dimensions || '',
    },
    organicSpecs: {
      organicMatter: initialProduct?.organicSpecs?.organicMatter || '≥ 45%',
      humicFulvic: initialProduct?.organicSpecs?.humicFulvic || '15% Humic + 3% Fulvic',
      microorganisms: initialProduct?.organicSpecs?.microorganisms || 'Trichoderma & Bacillus',
      phAndMoisture: initialProduct?.organicSpecs?.phAndMoisture || 'pH 6.5 - 7.5, សំណើម ≤ 20%',
      physicalForm: initialProduct?.organicSpecs?.physicalForm || 'គ្រាប់មូល Pellet 3-4mm',
      certification: initialProduct?.organicSpecs?.certification || 'Organic Standard Passed',
    },
    rawMaterialSpecs: {
      purity: initialProduct?.rawMaterialSpecs?.purity || '98.5% Pure Technical Grade',
      chemicalFormula: initialProduct?.rawMaterialSpecs?.chemicalFormula || '',
      particleSize: initialProduct?.rawMaterialSpecs?.particleSize || '100-200 Mesh Powder',
      solubility: initialProduct?.rawMaterialSpecs?.solubility || 'រលាយក្នុងទឹកបានល្អ / pH 8.0',
      standardGrade: initialProduct?.rawMaterialSpecs?.standardGrade || 'COA Inspection Passed',
      origin: initialProduct?.rawMaterialSpecs?.origin || 'នាំចូលពីរោងចក្រស្តង់ដារអន្តរជាតិ',
    },
    chemicalSpecs: {
      npkRatio: initialProduct?.chemicalSpecs?.npkRatio || '',
      totalNutrient: initialProduct?.chemicalSpecs?.totalNutrient || '',
      microElements: initialProduct?.chemicalSpecs?.microElements || '',
      applicationRate: initialProduct?.chemicalSpecs?.applicationRate || '150 - 250 kg / ហិកតា',
      granuleAppearance: initialProduct?.chemicalSpecs?.granuleAppearance || 'គ្រាប់ចម្រុះផ្កាឈូក-ស-បៃតង',
    },
    nutrients: {
      n: initialProduct?.nutrients?.n || '',
      p: initialProduct?.nutrients?.p || '',
      k: initialProduct?.nutrients?.k || '',
      zn: initialProduct?.nutrients?.zn || '',
      mg: initialProduct?.nutrients?.mg || '',
      ca: initialProduct?.nutrients?.ca || '',
      s: initialProduct?.nutrients?.s || '',
      fulvicAcid: initialProduct?.nutrients?.fulvicAcid || '',
      other: initialProduct?.nutrients?.other || '',
    },
    benefits: initialProduct?.benefits || ['បង្កើនទិន្នផលខ្ពស់', 'ធន់រឹងមាំ និងមានប្រសិទ្ធភាពយូរអង្វែង'],
    suitableCrops: initialProduct?.suitableCrops || ['ស្រូវ', 'ទុរេន', 'ស្វាយ', 'ដំឡូងមី', 'បន្លែ'],
    isPopular: initialProduct?.isPopular ?? false,
    isNew: initialProduct?.isNew ?? false,
    inStock: initialProduct?.inStock ?? true,
  });

  const [benefitInput, setBenefitInput] = useState('');
  const [cropInput, setCropInput] = useState('');

  const handleGroupChange = (nextGroupId: ProductGroupId) => {
    const groupObj = PRODUCT_GROUPS.find((g) => g.id === nextGroupId);
    const matchingCats = categories.filter((c) => (c.groupId || 'chemical_fertilizer') === nextGroupId);
    const firstMatchingCat = matchingCats[0] || categories[0];

    // Adjust defaults based on new group
    let defaultPackaging = formData.packagingSize;
    let defaultWeight = formData.weight;
    let defaultPrice = formData.price;
    let defaultNpk = formData.npk;
    let defaultUnit = formData.stockUnit || 'បាវ';
    let defaultSizes = formData.availableSizes || [];

    if (nextGroupId === 'machinery') {
      defaultPackaging = '១ គ្រឿង (Full Set)';
      defaultWeight = '1,950kg';
      defaultPrice = formData.price && formData.price < 500 ? 12500 : formData.price;
      defaultNpk = formData.npk?.includes('HP') ? formData.npk : '50 HP / 4WD';
      defaultUnit = 'គ្រឿង';
      defaultSizes = [];
    } else if (nextGroupId === 'raw_material') {
      defaultPackaging = 'Big Bag 1,000kg (Jumbo)';
      defaultWeight = '1,000kg';
      defaultPrice = formData.price && formData.price > 1000 ? 250 : formData.price;
      defaultNpk = formData.npk || 'Dolomite CaMg(CO3)2';
      defaultUnit = 'បាវ';
    } else if (nextGroupId === 'organic_fertilizer') {
      defaultPackaging = 'បាវ ៥០ គីឡូក្រាម';
      defaultWeight = '50kg';
      defaultPrice = formData.price && formData.price > 1000 ? 22.5 : formData.price;
      defaultNpk = formData.npk || 'Super Humic + OM 45%';
      defaultUnit = 'បាវ';
    } else {
      defaultPackaging = 'បាវ ៥០ គីឡូក្រាម';
      defaultWeight = '50kg';
      defaultPrice = formData.price && formData.price > 1000 ? 28.0 : formData.price;
      defaultNpk = formData.npk || '27-12-6+TE';
      defaultUnit = 'បាវ';
      if (!defaultSizes || defaultSizes.length === 0) {
        defaultSizes = getDefaultChemicalSizes(defaultPrice || 35);
      }
    }

    setFormData((prev) => ({
      ...prev,
      groupId: nextGroupId,
      groupKh: groupObj?.nameKh || 'ជីគីមី',
      category: firstMatchingCat ? firstMatchingCat.id : prev.category,
      categoryKh: firstMatchingCat ? firstMatchingCat.nameKh : prev.categoryKh,
      packagingSize: defaultPackaging,
      weight: defaultWeight,
      price: defaultPrice,
      npk: defaultNpk,
      stockUnit: defaultUnit,
      availableSizes: defaultSizes,
    }));
  };

  // Size Options Handlers
  const handleAddSizeOption = () => {
    const basePrice = formData.price || 30;
    const newOption: ProductPackagingOption = {
      size: '10kg',
      labelKh: 'កញ្ចប់ ១០ គីឡូក្រាម',
      weight: '10kg',
      price: Number((basePrice * 0.25).toFixed(2)),
      wholesalePrice: Number((basePrice * 0.25 * 0.92).toFixed(2)),
      isDefault: false,
    };
    setFormData((prev) => ({
      ...prev,
      availableSizes: [...(prev.availableSizes || []), newOption],
    }));
  };

  const handleRemoveSizeOption = (index: number) => {
    setFormData((prev) => {
      const updated = (prev.availableSizes || []).filter((_, i) => i !== index);
      // Ensure at least one is default if list is not empty
      if (updated.length > 0 && !updated.some((s) => s.isDefault)) {
        updated[0].isDefault = true;
      }
      return { ...prev, availableSizes: updated };
    });
  };

  const handleUpdateSizeOption = (index: number, field: keyof ProductPackagingOption, value: any) => {
    setFormData((prev) => {
      const updated = [...(prev.availableSizes || [])];
      if (field === 'isDefault' && value === true) {
        updated.forEach((s, i) => {
          s.isDefault = i === index;
        });
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, availableSizes: updated };
    });
  };

  const handleGenerateStandardSizes = () => {
    const basePrice = formData.price || 35;
    const standardSizes = getDefaultChemicalSizes(basePrice);
    setFormData((prev) => ({
      ...prev,
      availableSizes: standardSizes,
    }));
  };

  const handleCategoryChange = (catId: string) => {
    const selectedCat = categories.find((c) => c.id === catId);
    setFormData((prev) => ({
      ...prev,
      category: catId,
      categoryKh: selectedCat ? selectedCat.nameKh : catId,
    }));
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...(prev.benefits || []), benefitInput.trim()],
      }));
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: (prev.benefits || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddCrop = () => {
    if (cropInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        suitableCrops: [...(prev.suitableCrops || []), cropInput.trim()],
      }));
      setCropInput('');
    }
  };

  const handleRemoveCrop = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      suitableCrops: (prev.suitableCrops || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameKh || !formData.price) {
      alert('សូមបំពេញឈ្មោះទំនិញ និងតម្លៃឱ្យបានត្រឹមត្រូវ');
      return;
    }

    onSave(formData as Product);
  };

  const activeGroup = formData.groupId || 'chemical_fertilizer';

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-['Battambang'] text-[#1E5FA8] flex items-center gap-2">
              {activeGroup === 'machinery' && <Tractor className="w-5 h-5 text-amber-500" />}
              {activeGroup === 'chemical_fertilizer' && <FlaskConical className="w-5 h-5 text-blue-600" />}
              {activeGroup === 'organic_fertilizer' && <Sprout className="w-5 h-5 text-emerald-600" />}
              {activeGroup === 'raw_material' && <Layers className="w-5 h-5 text-purple-600" />}
              <span>
                {isEditing
                  ? `កែប្រែទិន្នន័យ (${formData.groupKh || 'ទំនិញ'})`
                  : `បន្ថែមទំនិញថ្មី (${formData.groupKh || 'ទំនិញ'})`}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-['Kantumruy_Pro']">
              {isEditing ? `កូដ SKU: ${formData.id}` : 'បង្កើតទិន្នន័យមុខទំនិញថ្មីក្នុងកាតាឡុក ទីវ ហៃ'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors font-['Kantumruy_Pro']"
          >
            បោះបង់
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors font-['Kantumruy_Pro'] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>រក្សាទុកទិន្នន័យ</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Fields (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. Main Group Selector Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold font-['Battambang'] text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                ជ្រើសរើសមុខទំនិញធំ (Main Product Group)
              </h3>
              <span className="text-[11px] font-medium text-slate-500 font-['Kantumruy_Pro']">
                ព័ត៌មានទូទៅ និងលក្ខណៈបច្ចេកទេសនឹងផ្លាស់ប្តូរទៅតាមមុខទំនិញនេះ
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
              {PRODUCT_GROUPS.map((grp) => {
                const isSelected = activeGroup === grp.id;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => handleGroupChange(grp.id)}
                    className={`flex flex-col items-center text-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-2 ring-blue-300 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="mb-1.5 p-2 rounded-xl bg-white shadow-2xs border border-slate-200">
                      {grp.id === 'machinery' && <Tractor className="w-4 h-4 text-amber-600" />}
                      {grp.id === 'chemical_fertilizer' && <FlaskConical className="w-4 h-4 text-blue-600" />}
                      {grp.id === 'organic_fertilizer' && <Sprout className="w-4 h-4 text-emerald-600" />}
                      {grp.id === 'compost_fertilizer' && <Leaf className="w-4 h-4 text-lime-600" />}
                      {grp.id === 'soil_raw_material' && <Mountain className="w-4 h-4 text-yellow-600" />}
                      {grp.id === 'feed_raw_material' && <Wheat className="w-4 h-4 text-orange-600" />}
                      {grp.id === 'mushroom_nutrient' && <Sparkles className="w-4 h-4 text-teal-600" />}
                      {grp.id === 'raw_material' && <Layers className="w-4 h-4 text-purple-600" />}
                    </div>
                    <span className="text-[11px] font-['Battambang'] leading-tight truncate w-full">{grp.nameKh}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. GENERAL INFORMATION (ព័ត៌មានទូទៅនៃមុខទំនិញ) - Tailored for each group */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold font-['Battambang'] text-slate-900 flex items-center gap-2">
                {activeGroup === 'machinery' && <Tractor className="w-4 h-4 text-amber-500" />}
                {activeGroup === 'chemical_fertilizer' && <FlaskConical className="w-4 h-4 text-blue-600" />}
                {activeGroup === 'organic_fertilizer' && <Sprout className="w-4 h-4 text-emerald-600" />}
                {activeGroup === 'raw_material' && <Layers className="w-4 h-4 text-purple-600" />}
                <span>
                  ព័ត៌មានទូទៅនៃមុខទំនិញ ({formData.groupKh})
                </span>
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold">
                Group: {activeGroup}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-['Kantumruy_Pro'] text-xs">
              
              {/* Product Name (Khmer) */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery'
                    ? 'ឈ្មោះគ្រឿងចក្រ / ឧបករណ៍ជាភាសាខ្មែរ *'
                    : activeGroup === 'raw_material'
                    ? 'ឈ្មោះវត្ថុធាតុដើម / សារធាតុរ៉ែជាភាសាខ្មែរ *'
                    : activeGroup === 'organic_fertilizer'
                    ? 'ឈ្មោះជីសរីរាង្គជាភាសាខ្មែរ *'
                    : 'ឈ្មោះជីគីមីជាភាសាខ្មែរ *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.nameKh}
                  onChange={(e) => setFormData({ ...formData, nameKh: e.target.value })}
                  placeholder={
                    activeGroup === 'machinery'
                      ? 'ឧ. ត្រាក់ទ័រ 50 សេះ TH-500 កង់ ៤ ជំនាន់ថ្មី'
                      : activeGroup === 'raw_material'
                      ? 'ឧ. ម្សៅដូឡូមីត កម្ចាត់ជាតិជូរ គុណភាពខ្ពស់'
                      : activeGroup === 'organic_fertilizer'
                      ? 'ឧ. ជីសរីរាង្គ Super Humic ដីមាស'
                      : 'ឧ. ជីគីមី NPK 27-12-6+TE'
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 font-medium outline-none"
                />
              </div>

              {/* Product Code / English / Formula */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery'
                    ? 'ម៉ាក & ម៉ូដែល / Model Code *'
                    : activeGroup === 'raw_material'
                    ? 'រូបមន្តគីមី / Chemical Code *'
                    : activeGroup === 'organic_fertilizer'
                    ? 'ឈ្មោះកូដ / English Brand *'
                    : 'ឈ្មោះកូដ / NPK Formula *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={
                    activeGroup === 'machinery'
                      ? 'ឧ. Tractor 50HP TH-500 4WD'
                      : activeGroup === 'raw_material'
                      ? 'ឧ. Dolomite CaMg(CO3)2 Tech'
                      : activeGroup === 'organic_fertilizer'
                      ? 'ឧ. ECO Super Humic Plus'
                      : 'ឧ. NPK 27-12-6+TE'
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 font-mono font-bold outline-none"
                />
              </div>

              {/* Nickname / Specialization */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery'
                    ? 'ឈ្មោះហៅក្រៅ / ជំនាញការងារ'
                    : activeGroup === 'raw_material'
                    ? 'ឈ្មោះហៅក្រៅ / ការប្រើប្រាស់ចម្បង'
                    : 'ឈ្មោះហៅក្រៅ / ជំនាញ'}
                </label>
                <input
                  type="text"
                  value={formData.nicknameKh}
                  onChange={(e) => setFormData({ ...formData, nicknameKh: e.target.value })}
                  placeholder={
                    activeGroup === 'machinery'
                      ? 'ឧ. ស្តេចភ្ជួររាស់ កម្លាំងខ្លាំង សន្សំប្រេង'
                      : activeGroup === 'raw_material'
                      ? 'ឧ. មេកែដីជូរ និងផ្សំជីកម្រិតខ្ពស់'
                      : activeGroup === 'organic_fertilizer'
                      ? 'ឧ. ជំនាញបំប៉នដី និងពន្លឿនឫស'
                      : 'ឧ. ជីគូ ១, ជីជំនាញស្រូវ, ជីទ្រាប់បាត'
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 font-medium outline-none"
                />
              </div>

              {/* Sub-Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    ប្រភេទរង (Sub-Category) *
                  </label>
                  {onQuickAddCategory && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCatModal(true)}
                      className="text-[11px] font-bold text-[#1E5FA8] hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ បង្កើតប្រភេទថ្មី</span>
                    </button>
                  )}
                </div>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 font-bold outline-none cursor-pointer"
                >
                  {categories
                    .filter((cat) => !formData.groupId || cat.groupId === formData.groupId || !cat.groupId)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameKh} {cat.groupKh ? `(${cat.groupKh})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Specific Header Tag / Formula Display */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery'
                    ? 'កម្លាំងម៉ាស៊ីន / លក្ខណៈសំគាល់ (e.g. 50 HP / 4WD) *'
                    : activeGroup === 'raw_material'
                    ? 'កម្រិតកំហាប់ / ស្តង់ដារ (e.g. 98.5% Pure / CaCO3) *'
                    : activeGroup === 'organic_fertilizer'
                    ? 'រូបមន្ត / កម្រិត OM (e.g. OM 45% + Humic) *'
                    : 'រូបមន្ត NPK (e.g. 27-12-6+TE) *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.npk}
                  onChange={(e) => setFormData({ ...formData, npk: e.target.value })}
                  placeholder={
                    activeGroup === 'machinery'
                      ? 'ឧ. 50 HP / 4WD'
                      : activeGroup === 'raw_material'
                      ? 'ឧ. 98.5% Pure / Dolomite'
                      : activeGroup === 'organic_fertilizer'
                      ? 'ឧ. OM 45% + Humic 15%'
                      : 'ឧ. 27-12-6+TE'
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 font-mono font-bold outline-none"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery'
                    ? 'តម្លៃលក់ ($ USD / គ្រឿង ឬ ឈុត) *'
                    : activeGroup === 'raw_material'
                    ? 'តម្លៃលក់ ($ USD / Jumbo Bag ឬ តោន) *'
                    : 'តម្លៃលក់គោល ($ USD / បាវ ឬ ដប) *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 font-mono font-bold text-blue-700 outline-none"
                />
              </div>

              {/* Packaging Size */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery'
                    ? 'ខ្នាតវេចខ្ចប់ / ឈុត (Packaging)'
                    : activeGroup === 'raw_material'
                    ? 'ខ្នាតវេចខ្ចប់ (Packaging / Bag)'
                    : 'ខ្នាតវេចខ្ចប់គោល (Default Packaging)'}
                </label>
                <input
                  type="text"
                  value={formData.packagingSize}
                  onChange={(e) => setFormData({ ...formData, packagingSize: e.target.value })}
                  placeholder={
                    activeGroup === 'machinery'
                      ? 'ឧ. ១ គ្រឿង (Set ពេញលេញ)'
                      : activeGroup === 'raw_material'
                      ? 'ឧ. Big Bag 1,000kg (Jumbo) ឬ បាវ 50kg'
                      : 'ឧ. បាវ ៥០ គីឡូក្រាម'
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 outline-none"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery' ? 'ទម្ងន់ម៉ាស៊ីន (Weight)' : 'ទម្ងន់សុទ្ធ (Net Weight)'}
                </label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder={
                    activeGroup === 'machinery'
                      ? 'ឧ. 1,950kg'
                      : activeGroup === 'raw_material'
                      ? 'ឧ. 1,000kg ឬ 50kg'
                      : 'ឧ. 50kg'
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 font-mono outline-none"
                />
              </div>

              {/* Official Registration No / Serial No */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery'
                    ? 'លេខកូដស៊េរី / ស្តង់ដារ (Serial / ISO)'
                    : activeGroup === 'raw_material'
                    ? 'លេខកូដស្តង់ដារវិភាគ (COA Standard)'
                    : 'លេខបញ្ជីការផ្លូវការ (Registration No)'}
                </label>
                <input
                  type="text"
                  value={formData.registrationNo}
                  onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                  placeholder={
                    activeGroup === 'machinery'
                      ? 'ឧ. TH-MECH-50HP-2026'
                      : activeGroup === 'raw_material'
                      ? 'ឧ. COA-TH-DOL-2026'
                      : 'ឧ. FR02 1584/0525 TZAT-GDA'
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. STOCK & INVENTORY MANAGEMENT (ការគ្រប់គ្រងស្ដុកទំនិញ) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold font-['Battambang'] text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                <span>ការគ្រប់គ្រងស្ដុកទំនិញ (Stock & Inventory)</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500 font-['Kantumruy_Pro']">
                កំណត់ស្ថានភាព និងចំនួនទំនិញក្នុងស្តុក
              </span>
            </div>

            <div className="space-y-4 font-['Kantumruy_Pro'] text-xs">
              {/* Stock Status Selector (2 options: មានស្ដុក vs មានស្ដុកនៅក្រៅប្រទេស) */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  ស្ថានភាពស្តុកទំនិញ (Stock Status) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: មានស្ដុក (in_stock) */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, stockStatus: 'in_stock', inStock: true })}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                      formData.stockStatus === 'in_stock'
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        formData.stockStatus === 'in_stock'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <PackageCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-['Battambang'] text-sm text-emerald-900">
                          មានស្ដុក (In Stock)
                        </span>
                        {formData.stockStatus === 'in_stock' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> បានជ្រើស
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        ទំនិញមានស្រាប់នៅក្នុងឃ្លាំងក្នុងស្រុក អាចដឹកជញ្ជូនជូនអតិថិជនបានភ្លាមៗ
                      </p>
                    </div>
                  </button>

                  {/* Option 2: មានស្ដុកនៅក្រៅប្រទេស (overseas_stock) */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, stockStatus: 'overseas_stock', inStock: true })}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                      formData.stockStatus === 'overseas_stock'
                        ? 'border-blue-500 bg-blue-50/80 text-blue-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        formData.stockStatus === 'overseas_stock'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-['Battambang'] text-sm text-blue-900">
                          មានស្ដុកនៅក្រៅប្រទេស (Overseas Stock)
                        </span>
                        {formData.stockStatus === 'overseas_stock' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> បានជ្រើស
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        ទំនិញមានក្នុងស្តុករោងចក្រដៃគូក្រៅប្រទេស ដឹកជញ្ជូនរហ័ស 3-7 ថ្ងៃតាមការកុម្ម៉ង់
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Stock Quantity and Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ចំនួនក្នុងស្តុកបច្ចុប្បន្ន (Quantity in Stock) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQty ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQty: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    placeholder="ឧ. 100"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 font-mono font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ខ្នាតរាប់ស្តុក (Stock Unit) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.stockUnit || ''}
                      onChange={(e) => setFormData({ ...formData, stockUnit: e.target.value })}
                      placeholder="ឧ. បាវ, គ្រឿង, ឈុត, កញ្ចប់, តោន"
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 font-bold outline-none"
                    />
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormData({ ...formData, stockUnit: e.target.value });
                        }
                      }}
                      className="bg-slate-100 border border-slate-300 rounded-xl px-2 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="">ជ្រើសខ្នាត</option>
                      <option value="បាវ">បាវ (Bags)</option>
                      <option value="គ្រឿង">គ្រឿង (Units)</option>
                      <option value="ឈុត">ឈុត (Sets)</option>
                      <option value="កញ្ចប់">កញ្ចប់ (Packs)</option>
                      <option value="ដប">ដប (Bottles)</option>
                      <option value="តោន">តោន (Tons)</option>
                      <option value="ធុង">ធុង (Buckets)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. PACKAGING SIZES & DYNAMIC PRICING (ជម្រើសទំហំវេចខ្ចប់ និងតម្លៃតាមខ្នាត) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs font-['Kantumruy_Pro']">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold font-['Battambang'] text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-blue-600" />
                  <span>ជម្រើសទំហំវេចខ្ចប់ & តម្លៃតាមខ្នាត (Packaging Sizes & Pricing)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  អនុញ្ញាតឱ្យអតិថិជនជ្រើសរើសទំហំ (ឧទាហរណ៍៖ 50kg, 25kg, 10kg, 5kg សម្រាប់ជីគីមី)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateStandardSizes}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>បង្កើតទំហំស្តង់ដារស្វ័យប្រវត្តិ</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddSizeOption}
                  className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-green-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-green-600" />
                  <span>+ បន្ថែមទំហំ</span>
                </button>
              </div>
            </div>

            {formData.availableSizes && formData.availableSizes.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 px-3 py-1 bg-slate-50 rounded-lg">
                  <div className="col-span-2">កូដទំហំ (Size)</div>
                  <div className="col-span-4">ឈ្មោះខ្នាតភាសាខ្មែរ (Khmer Label)</div>
                  <div className="col-span-2">តម្លៃរាយ ($ USD)</div>
                  <div className="col-span-2">តម្លៃបោះដុំ ($ USD)</div>
                  <div className="col-span-1 text-center">ខ្នាតគោល</div>
                  <div className="col-span-1 text-right">លុប</div>
                </div>

                {formData.availableSizes.map((sizeOpt, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 gap-2 items-center p-3 rounded-2xl border transition-all ${
                      sizeOpt.isDefault
                        ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Size Key */}
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={sizeOpt.size}
                        onChange={(e) => handleUpdateSizeOption(idx, 'size', e.target.value)}
                        placeholder="50kg"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold outline-none"
                      />
                    </div>

                    {/* Label Kh */}
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={sizeOpt.labelKh}
                        onChange={(e) => handleUpdateSizeOption(idx, 'labelKh', e.target.value)}
                        placeholder="បាវ ៥០ គីឡូក្រាម"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none"
                      />
                    </div>

                    {/* Price */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={sizeOpt.price}
                        onChange={(e) =>
                          handleUpdateSizeOption(idx, 'price', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-blue-700 outline-none"
                      />
                    </div>

                    {/* Wholesale Price */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={sizeOpt.wholesalePrice ?? (sizeOpt.price * 0.92)}
                        onChange={(e) =>
                          handleUpdateSizeOption(idx, 'wholesalePrice', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 outline-none"
                      />
                    </div>

                    {/* Default Radio */}
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="radio"
                        name="defaultSizeOption"
                        checked={Boolean(sizeOpt.isDefault)}
                        onChange={() => {
                          handleUpdateSizeOption(idx, 'isDefault', true);
                          // Sync main price & packaging size
                          setFormData((prev) => ({
                            ...prev,
                            price: sizeOpt.price,
                            packagingSize: sizeOpt.labelKh,
                            weight: sizeOpt.weight || sizeOpt.size,
                          }));
                        }}
                        title="កំណត់ជាខ្នាតគោល"
                        className="w-4 h-4 text-blue-600 cursor-pointer"
                      />
                    </div>

                    {/* Delete */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveSizeOption(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-500 mb-2">មិនទាន់មានជម្រើសទំហំវេចខ្ចប់នៅឡើយទេ</p>
                <button
                  type="button"
                  onClick={handleGenerateStandardSizes}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>បង្កើតទំហំស្តង់ដារ 50kg, 25kg, 10kg, 5kg</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. GROUP-SPECIFIC TECHNICAL SPECIFICATIONS (លក្ខណៈបច្ចេកទេសជាក់លាក់តាមមុខទំនិញ) */}

          {/* 3A. MACHINERY SPECIFICATIONS */}
          {activeGroup === 'machinery' && (
            <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-200 space-y-4 shadow-xs">
              <div className="border-b border-amber-200/60 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold font-['Battambang'] text-amber-950 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  លក្ខណៈបច្ចេកទេសគ្រឿងយន្តកសិកម្ម (Machinery Specifications)
                </h3>
                <span className="text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  គ្រឿងចក្រ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-['Kantumruy_Pro'] text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    កម្លាំងសេះម៉ាស៊ីន (Horsepower / kW)
                  </label>
                  <input
                    type="text"
                    value={formData.machinerySpecs?.horsepower || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        machinerySpecs: { ...formData.machinerySpecs, horsepower: e.target.value },
                      })
                    }
                    placeholder="ឧ. 50 HP (37.3 kW) @ 2,400 RPM"
                    className="w-full bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3.5 py-2 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ប្រភេទម៉ាស៊ីន (Engine Type / Fuel)
                  </label>
                  <input
                    type="text"
                    value={formData.machinerySpecs?.engineType || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        machinerySpecs: { ...formData.machinerySpecs, engineType: e.target.value },
                      })
                    }
                    placeholder="ឧ. Diesel 4 ស៊ីឡាំង Direct Injection ត្រជាក់ដោយទឹក"
                    className="w-full bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ប្រព័ន្ធបញ្ជា & ចង្កឹះលេខ (Drive & Transmission)
                  </label>
                  <input
                    type="text"
                    value={formData.machinerySpecs?.driveSystem || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        machinerySpecs: { ...formData.machinerySpecs, driveSystem: e.target.value },
                      })
                    }
                    placeholder="ឧ. កង់ ៤ (4WD) / Synchro-Shuttle 8F x 8R"
                    className="w-full bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    កម្រិតស៊ីប្រេងជាមធ្យម (Fuel Consumption)
                  </label>
                  <input
                    type="text"
                    value={formData.machinerySpecs?.fuelConsumption || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        machinerySpecs: { ...formData.machinerySpecs, fuelConsumption: e.target.value },
                      })
                    }
                    placeholder="ឧ. 3.5 - 4.8 លីត្រ / ម៉ោង (សន្សំប្រេងខ្ពស់)"
                    className="w-full bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    សមត្ថភាពការងារ (Working Capacity / Speed)
                  </label>
                  <input
                    type="text"
                    value={formData.machinerySpecs?.workingCapacity || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        machinerySpecs: { ...formData.machinerySpecs, workingCapacity: e.target.value },
                      })
                    }
                    placeholder="ឧ. ទទឹងភ្ជួរ 2.0 ម៉ែត្រ / 1.5-2.0 ហិកតា/ថ្ងៃ"
                    className="w-full bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ការធានា & សេវាកម្ម (Warranty & Maintenance)
                  </label>
                  <input
                    type="text"
                    value={formData.machinerySpecs?.warranty || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        machinerySpecs: { ...formData.machinerySpecs, warranty: e.target.value },
                      })
                    }
                    placeholder="ឧ. ធានា ១២ ខែ ឬ ១,២០០ ម៉ោង មានគ្រឿងបន្លាស់សុទ្ធ"
                    className="w-full bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ស្ថានភាពទំនិញ (Condition)
                  </label>
                  <input
                    type="text"
                    value={formData.machinerySpecs?.condition || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        machinerySpecs: { ...formData.machinerySpecs, condition: e.target.value },
                      })
                    }
                    placeholder="ឧ. ទំនិញថ្មី ១០០% (New Factory Imported)"
                    className="w-full bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    វិមាត្រ & ទំហំ (Dimensions L x W x H)
                  </label>
                  <input
                    type="text"
                    value={formData.machinerySpecs?.dimensions || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        machinerySpecs: { ...formData.machinerySpecs, dimensions: e.target.value },
                      })
                    }
                    placeholder="ឧ. 3,250 x 1,495 x 2,050 មម (1,950 kg)"
                    className="w-full bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3B. ORGANIC FERTILIZER SPECIFICATIONS */}
          {activeGroup === 'organic_fertilizer' && (
            <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-200 space-y-4 shadow-xs">
              <div className="border-b border-emerald-200/60 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold font-['Battambang'] text-emerald-950 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  លក្ខណៈបច្ចេកទេសជីសរីរាង្គ (Organic Fertilizer Specifications)
                </h3>
                <span className="text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  ជីសរីរាង្គ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-['Kantumruy_Pro'] text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    សារធាតុសរីរាង្គ (Organic Matter OM %)
                  </label>
                  <input
                    type="text"
                    value={formData.organicSpecs?.organicMatter || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organicSpecs: { ...formData.organicSpecs, organicMatter: e.target.value },
                      })
                    }
                    placeholder="ឧ. ≥ 45% (កម្រិតសរីរាង្គខ្ពស់)"
                    className="w-full bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl px-3.5 py-2 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    អាស៊ីត Humic & Fulvic Acid %
                  </label>
                  <input
                    type="text"
                    value={formData.organicSpecs?.humicFulvic || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organicSpecs: { ...formData.organicSpecs, humicFulvic: e.target.value },
                      })
                    }
                    placeholder="ឧ. 15% Humic + 3% Fulvic Acid"
                    className="w-full bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    មីក្រូសារពាង្គកាយមានប្រយោជន៍ (Microbes CFU/g)
                  </label>
                  <input
                    type="text"
                    value={formData.organicSpecs?.microorganisms || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organicSpecs: { ...formData.organicSpecs, microorganisms: e.target.value },
                      })
                    }
                    placeholder="ឧ. Trichoderma & Bacillus 1x10^8 CFU/g"
                    className="w-full bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    កម្រិត pH ដី & សំណើម (pH & Moisture)
                  </label>
                  <input
                    type="text"
                    value={formData.organicSpecs?.phAndMoisture || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organicSpecs: { ...formData.organicSpecs, phAndMoisture: e.target.value },
                      })
                    }
                    placeholder="ឧ. pH 6.5 - 7.5, សំណើម ≤ 20%"
                    className="w-full bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ទម្រង់រូបវន្តជី (Physical Appearance / Form)
                  </label>
                  <input
                    type="text"
                    value={formData.organicSpecs?.physicalForm || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organicSpecs: { ...formData.organicSpecs, physicalForm: e.target.value },
                      })
                    }
                    placeholder="ឧ. គ្រាប់មូល Pellet 3-4mm ឬ រាវ Liquid"
                    className="w-full bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    វិញ្ញាបនបត្រស្តង់ដារសរីរាង្គ (Standard Certification)
                  </label>
                  <input
                    type="text"
                    value={formData.organicSpecs?.certification || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organicSpecs: { ...formData.organicSpecs, certification: e.target.value },
                      })
                    }
                    placeholder="ឧ. Organic Standard CAM-GAP / IFOAM"
                    className="w-full bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3C. RAW MATERIAL SPECIFICATIONS */}
          {activeGroup === 'raw_material' && (
            <div className="bg-purple-50/50 p-6 rounded-3xl border border-purple-200 space-y-4 shadow-xs">
              <div className="border-b border-purple-200/60 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold font-['Battambang'] text-purple-950 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  លក្ខណៈបច្ចេកទេសវត្ថុធាតុដើម & សារធាតុរ៉ែ (Raw Material Specifications)
                </h3>
                <span className="text-[11px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                  វត្ថុធាតុដើម
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-['Kantumruy_Pro'] text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    កម្រិតភាពបរិសុទ្ធ (Purity % / Grade)
                  </label>
                  <input
                    type="text"
                    value={formData.rawMaterialSpecs?.purity || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rawMaterialSpecs: { ...formData.rawMaterialSpecs, purity: e.target.value },
                      })
                    }
                    placeholder="ឧ. 98.5% Pure Technical Grade"
                    className="w-full bg-white border border-purple-300 focus:border-purple-500 rounded-xl px-3.5 py-2 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    រូបមន្តគីមី / CAS No (Chemical Formula)
                  </label>
                  <input
                    type="text"
                    value={formData.rawMaterialSpecs?.chemicalFormula || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rawMaterialSpecs: { ...formData.rawMaterialSpecs, chemicalFormula: e.target.value },
                      })
                    }
                    placeholder="ឧ. CaCO3·MgCO3 / CAS 16389-88-1"
                    className="w-full bg-white border border-purple-300 focus:border-purple-500 rounded-xl px-3.5 py-2 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ទំហំគ្រាប់ / កម្រិតម៉ដ្ឋ (Mesh Size / Particle Size)
                  </label>
                  <input
                    type="text"
                    value={formData.rawMaterialSpecs?.particleSize || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rawMaterialSpecs: { ...formData.rawMaterialSpecs, particleSize: e.target.value },
                      })
                    }
                    placeholder="ឧ. 100 - 200 Mesh Powder ឬ 2-4mm Granule"
                    className="w-full bg-white border border-purple-300 focus:border-purple-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    កម្រិតរលាយ & pH (Solubility & pH)
                  </label>
                  <input
                    type="text"
                    value={formData.rawMaterialSpecs?.solubility || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rawMaterialSpecs: { ...formData.rawMaterialSpecs, solubility: e.target.value },
                      })
                    }
                    placeholder="ឧ. រលាយក្នុងទឹក / pH 8.0 - 8.5"
                    className="w-full bg-white border border-purple-300 focus:border-purple-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ស្តង់ដារវិញ្ញាបនបត្រគុណភាព (COA Standard)
                  </label>
                  <input
                    type="text"
                    value={formData.rawMaterialSpecs?.standardGrade || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rawMaterialSpecs: { ...formData.rawMaterialSpecs, standardGrade: e.target.value },
                      })
                    }
                    placeholder="ឧ. COA Inspection Standard Passed"
                    className="w-full bg-white border border-purple-300 focus:border-purple-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ប្រភពនាំចូល (Country of Origin)
                  </label>
                  <input
                    type="text"
                    value={formData.rawMaterialSpecs?.origin || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rawMaterialSpecs: { ...formData.rawMaterialSpecs, origin: e.target.value },
                      })
                    }
                    placeholder="ឧ. នាំចូលផ្ទាល់ពីរោងចក្រស្តង់ដារអន្តរជាតិ"
                    className="w-full bg-white border border-purple-300 focus:border-purple-500 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3D. CHEMICAL FERTILIZER NUTRIENTS (NPK & Micro-nutrients) */}
          {activeGroup === 'chemical_fertilizer' && (
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-200 space-y-4 shadow-xs">
              <div className="border-b border-blue-200/60 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold font-['Battambang'] text-blue-950 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-blue-600" />
                  សមាសធាតុចិញ្ចឹម & រូបមន្ត NPK (Chemical Nutrient Composition)
                </h3>
                <span className="text-[11px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                  ជីគីមី NPK
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 font-['Kantumruy_Pro'] text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">អាសូត N (%)</label>
                  <input
                    type="text"
                    value={formData.nutrients?.n || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nutrients: { ...formData.nutrients, n: e.target.value },
                      })
                    }
                    placeholder="ឧ. 27%"
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-1.5 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ផូស្វ័រ P₂O₅ (%)</label>
                  <input
                    type="text"
                    value={formData.nutrients?.p || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nutrients: { ...formData.nutrients, p: e.target.value },
                      })
                    }
                    placeholder="ឧ. 12%"
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-1.5 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ប៉ូតាស្យូម K₂O (%)</label>
                  <input
                    type="text"
                    value={formData.nutrients?.k || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nutrients: { ...formData.nutrients, k: e.target.value },
                      })
                    }
                    placeholder="ឧ. 6%"
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-1.5 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ស័ង្កសី Zn (%)</label>
                  <input
                    type="text"
                    value={formData.nutrients?.zn || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nutrients: { ...formData.nutrients, zn: e.target.value },
                      })
                    }
                    placeholder="ឧ. 0.5%"
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-1.5 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ម៉ាញ៉េស្យូម MgO (%)</label>
                  <input
                    type="text"
                    value={formData.nutrients?.mg || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nutrients: { ...formData.nutrients, mg: e.target.value },
                      })
                    }
                    placeholder="ឧ. 1.0%"
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-1.5 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">កាល់ស្យូម CaO (%)</label>
                  <input
                    type="text"
                    value={formData.nutrients?.ca || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nutrients: { ...formData.nutrients, ca: e.target.value },
                      })
                    }
                    placeholder="ឧ. 2.0%"
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-1.5 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ស្ពាន់ធ័រ S (%)</label>
                  <input
                    type="text"
                    value={formData.nutrients?.s || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nutrients: { ...formData.nutrients, s: e.target.value },
                      })
                    }
                    placeholder="ឧ. 4.0%"
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-1.5 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fulvic Acid (%)</label>
                  <input
                    type="text"
                    value={formData.nutrients?.fulvicAcid || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nutrients: { ...formData.nutrients, fulvicAcid: e.target.value },
                      })
                    }
                    placeholder="ឧ. 3.0%"
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-1.5 font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. USAGE & DETAILED INSTRUCTIONS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold font-['Battambang'] text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              {activeGroup === 'machinery'
                ? 'របៀបប្រើប្រាស់ & ការណែនាំបច្ចេកទេស'
                : 'ការណែនាំអំពីការប្រើប្រាស់ និងអត្ថប្រយោជន៍'}
            </h3>

            <div className="space-y-4 font-['Kantumruy_Pro'] text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery'
                    ? 'មុខងារការងារចម្បង (Summary Usage)'
                    : 'របៀបប្រើប្រាស់សង្ខេប (Summary Usage)'}
                </label>
                <input
                  type="text"
                  value={formData.usage}
                  onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                  placeholder={
                    activeGroup === 'machinery'
                      ? 'ឧ. ភ្ជួរដី ជ្រោយដី និងដឹកជញ្ជូនកសិផលគ្រប់ស្ថានភាពដី'
                      : activeGroup === 'raw_material'
                      ? 'ឧ. បាចកែដីជូរ ឬប្រើសម្រាប់លាយរូបមន្តជីកសិកម្ម'
                      : 'ឧ. ប្រើសម្រាប់បាចទ្រាប់បាត ឬបំប៉នដើម និងស្លឹក'
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery'
                    ? 'ការពិពណ៌នាលម្អិតអំពីគ្រឿងចក្រ (Detailed Description)'
                    : 'របៀបប្រើប្រាស់លម្អិត & កម្រិតប្រើប្រាស់ (Detailed Usage)'}
                </label>
                <textarea
                  rows={3}
                  value={formData.detailedUsage}
                  onChange={(e) => setFormData({ ...formData, detailedUsage: e.target.value })}
                  placeholder={
                    activeGroup === 'machinery'
                      ? 'ឧ. ត្រាក់ទ័រម៉ាស៊ីនម៉ាស៊ូត ៤ ស៊ីឡាំង កម្លាំង 50 សេះ កង់ ៤ ជំនាន់ថ្មី ស័ក្តិសមបំផុតសម្រាប់ភ្ជួរដីស្រែ ដីចម្ការដំឡូងមី ពោត និងចម្ការទុរេន ធន់រឹងមាំ សន្សំសំចៃប្រេងខ្ពស់។'
                      : 'ឧ. ប្រើប្រាស់កម្រិត ១៥០-២៥០ គីឡូក្រាមក្នុងមួយហិកតា ក្នុងដំណាក់កាលលូតលាស់ដំបូង...'
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl p-3 outline-none"
                />
              </div>

              {/* Key Benefits Tags */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery' ? 'អត្ថប្រយោជន៍ និងលក្ខណៈពិសេសចម្បង' : 'អត្ថប្រយោជន៍ចម្បង (Key Benefits)'}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                    placeholder="បញ្ចូលអត្ថប្រយោជន៍ រួចចុច Enter ឬ ចុចប៊ូតុងបន្ថែម"
                    className="flex-1 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-1.5 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="px-4 py-1.5 bg-[#1E5FA8] hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    + បន្ថែម
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.benefits?.map((b, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-800 rounded-lg text-xs font-medium border border-blue-200"
                    >
                      {b}
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="text-blue-500 hover:text-red-600 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Suitable Crops / Applications */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {activeGroup === 'machinery' ? 'ប្រភេទដី & ការងារសមស្រប' : 'ដំណាំសមស្រប (Suitable Crops)'}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={cropInput}
                    onChange={(e) => setCropInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCrop())}
                    placeholder={
                      activeGroup === 'machinery'
                        ? 'ឧ. ដីស្រែ, ដីចម្ការដំឡូងមី, ចម្ការទុរេន, ដឹកជញ្ជូន...'
                        : 'ឧ. ស្រូវ, ទុរេន, ស្វាយ, ដំឡូងមី, ពោត...'
                    }
                    className="flex-1 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-1.5 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCrop}
                    className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    + បន្ថែម
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.suitableCrops?.map((c, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => handleRemoveCrop(idx)}
                        className="text-emerald-500 hover:text-red-600 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Visual Styles & Image Upload (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Visual Appearance & Image Upload */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs font-['Kantumruy_Pro']">
            <h3 className="text-sm font-bold font-['Battambang'] text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>រូបភាព & គំរូទំនិញ</span>
              <span className="text-[10px] text-blue-600 font-bold">Live Preview</span>
            </h3>

            {/* Bag / Machine Theme Selector */}
            {activeGroup === 'chemical_fertilizer' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ពណ៌បាវជី (Bag Theme):
                </label>
                <select
                  value={formData.bagColorTheme}
                  onChange={(e) => setFormData({ ...formData, bagColorTheme: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                >
                  <option value="rainbow">Rainbow Header (NPK Classic)</option>
                  <option value="green">Green (Rice & Nature)</option>
                  <option value="yellow">Yellow (ECO Super Humic)</option>
                  <option value="black">Black (Organic Humic)</option>
                  <option value="red">Red (Urea & Kali)</option>
                  <option value="purple">Purple (DAP & Special)</option>
                  <option value="blue">Blue (Tiv Huor Standard)</option>
                </select>
              </div>
            )}

            {/* Granule Color Selector for Fertilizers */}
            {(activeGroup === 'chemical_fertilizer' || activeGroup === 'organic_fertilizer') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ពណ៌គ្រាប់ជី (Granule Style):
                </label>
                <select
                  value={formData.granuleColor}
                  onChange={(e) => setFormData({ ...formData, granuleColor: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                >
                  <option value="mixed-pink-white">គ្រាប់ចម្រុះផ្កាឈូក-ស-បៃតង</option>
                  <option value="white-pearl">គ្រាប់សគុជ (White Pearl)</option>
                  <option value="green-granule">គ្រាប់បៃតង (Green Granules)</option>
                  <option value="red-potash">គ្រាប់ក្រហម (Potash MOP)</option>
                  <option value="black-dap">គ្រាប់ប្រផេះចាស់/ខ្មៅ (DAP)</option>
                  <option value="grey-pellet">គ្រាប់ប្រផេះ (Ammonium Sulfate)</option>
                  <option value="organic-brown">គ្រាប់ត្នោតសរីរាង្គ (Organic)</option>
                </select>
              </div>
            )}

            {/* Image Uploader & Presets */}
            <ImageUploader
              currentImageUrl={formData.imageUrl || ''}
              onImageSelected={(url) => setFormData({ ...formData, imageUrl: url })}
            />

            {/* Live Visual Illustration Preview */}
            <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-500 mb-2">
                ទិដ្ឋភាពបង្ហាញជាក់ស្តែងលើវេបសាយ:
              </span>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 w-full flex items-center justify-center">
                <ProductBagIllustration
                  product={formData as Product}
                  size="md"
                  showGranulesBadge={true}
                  className="w-40 h-40 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Badges & Status Switches */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-xs text-xs font-['Kantumruy_Pro']">
            <h3 className="text-sm font-bold font-['Battambang'] text-slate-900 border-b border-slate-100 pb-2">
              ស្ថានភាព និងផ្លាកសញ្ញា
            </h3>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
              <span className="font-bold text-slate-700">★ ដាក់ផ្លាកពេញនិយម (Popular)</span>
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
              <span className="font-bold text-slate-700">✨ ដាក់ផ្លាកទំនិញថ្មី (New Arrival)</span>
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
              <span className="font-bold text-slate-700">✓ មានទំនិញក្នុងស្តុក (In Stock)</span>
              <input
                type="checkbox"
                checked={formData.inStock}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>
          </div>
        </div>
      </form>

      {/* Quick Add Category Modal */}
      {isAddingNewCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 animate-in fade-in zoom-in duration-150 font-['Kantumruy_Pro']">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-bold font-['Battambang'] text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#1E5FA8]" />
                បង្កើតប្រភេទថ្មី (Category)
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingNewCatModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ស្ថិតក្នុងមុខទំនិញ (Main Group) *
                </label>
                <select
                  value={formData.groupId || 'chemical_fertilizer'}
                  onChange={(e) => {
                    const nextG = e.target.value as ProductGroupId;
                    const gObj = PRODUCT_GROUPS.find((g) => g.id === nextG);
                    setFormData((prev) => ({
                      ...prev,
                      groupId: nextG,
                      groupKh: gObj?.nameKh || 'ជីគីមី',
                    }));
                  }}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                >
                  {PRODUCT_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nameKh} ({g.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះប្រភេទ (ខ្មែរ) *
                </label>
                <input
                  type="text"
                  required
                  value={newCatKh}
                  onChange={(e) => setNewCatKh(e.target.value)}
                  placeholder="ឧ. ត្រាក់ទ័រ & គោយន្ត, ជីគីមី NPK, ជីបំប៉នផ្កាផ្លែ..."
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះកូដ / English Slug (ជម្រើស)
                </label>
                <input
                  type="text"
                  value={newCatEn}
                  onChange={(e) => setNewCatEn(e.target.value)}
                  placeholder="ឧ. Tractor, Foliar, Booster, Bio..."
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddingNewCatModal(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newCatKh.trim()) {
                    alert('សូមបញ្ចូលឈ្មោះប្រភេទ');
                    return;
                  }
                  const activeGroupId = formData.groupId || 'chemical_fertilizer';
                  const activeGroupObj = PRODUCT_GROUPS.find((g) => g.id === activeGroupId);
                  const newId = newCatEn.trim().replace(/\s+/g, '_') || `cat_${Date.now()}`;
                  const createdCat: Category = {
                    id: newId,
                    name: newCatEn.trim() || newCatKh.trim(),
                    nameKh: newCatKh.trim(),
                    groupId: activeGroupId,
                    groupKh: activeGroupObj?.nameKh || 'ជីគីមី',
                    order: categories.length + 1,
                  };
                  if (onQuickAddCategory) {
                    onQuickAddCategory(createdCat);
                  }
                  setFormData((prev) => ({
                    ...prev,
                    category: createdCat.id,
                    categoryKh: createdCat.nameKh,
                    groupId: activeGroupId,
                    groupKh: activeGroupObj?.nameKh || 'ជីគីមី',
                  }));
                  setIsAddingNewCatModal(false);
                  setNewCatKh('');
                  setNewCatEn('');
                }}
                className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                បង្កើត & ជ្រើសរើស
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
