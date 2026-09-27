import React from 'react';
import { Product, Currency } from '../types';
import { EXCHANGE_RATE_KHR, PRODUCT_GROUPS } from '../data/initialProducts';
import {
  Tractor,
  FlaskConical,
  Sprout,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Leaf,
  Wheat,
} from 'lucide-react';

interface ProductSpecTableProps {
  product: Product;
  currency?: Currency;
}

export const ProductSpecTable: React.FC<ProductSpecTableProps> = ({ product }) => {
  const priceUSD = product.price || 0;
  const priceKHR = Math.round(priceUSD * EXCHANGE_RATE_KHR);
  const groupId = product.groupId || 'chemical_fertilizer';
  const groupObj = PRODUCT_GROUPS.find((g) => g.id === groupId);

  // Build group-specific specification rows
  const getGroupSpecRows = () => {
    switch (groupId) {
      case 'machinery': {
        const m = product.machinerySpecs || {};
        return [
          {
            label: 'ឈ្មោះគ្រឿងចក្រ/ឧបករណ៍',
            value: <span className="font-bold text-slate-900 text-sm">{product.nameKh || product.name}</span>,
          },
          {
            label: 'ប្រភេទរង (Sub-category)',
            value: <span className="text-slate-800 font-medium">{product.categoryKh || product.category}</span>,
          },
          {
            label: 'ម៉ាក & ម៉ូដែល (Model)',
            value: <span className="font-mono font-bold text-[#1E5FA8]">{m.brandModel || product.name || product.npk}</span>,
          },
          {
            label: 'កម្លាំងម៉ាស៊ីន (Horsepower)',
            value: (
              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 inline-block">
                ⚡ {m.horsepower || product.npk || '50 HP'}
              </span>
            ),
          },
          {
            label: 'ប្រភេទម៉ាស៊ីន (Engine)',
            value: <span className="text-slate-800">{m.engineType || 'Diesel 4 ស៊ីឡាំង Direct Injection'}</span>,
          },
          {
            label: 'ប្រព័ន្ធបញ្ជា & បង្វិលកង់ (Transmission/Drive)',
            value: <span className="text-slate-800">{m.driveSystem || m.transmission || 'Synchro-Shuttle 8F x 8R / 4WD'}</span>,
          },
          {
            label: 'កម្រិតស៊ីប្រេង (Fuel Consumption)',
            value: <span className="font-mono text-emerald-700 font-semibold">{m.fuelConsumption || '3.5 - 4.8 L/ម៉ោង'}</span>,
          },
          {
            label: 'សមត្ថភាពការងារ (Working Capacity)',
            value: <span className="text-slate-800">{m.workingCapacity || product.usage}</span>,
          },
          {
            label: 'ការធានា & សេវាកម្ម (Warranty)',
            value: (
              <span className="text-blue-900 font-bold bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                {m.warranty || 'ធានា ១ ឆ្នាំ គ្រឿងបន្លាស់គ្រប់គ្រាន់'}
              </span>
            ),
          },
          {
            label: 'ស្ថានភាពទំនិញ (Condition)',
            value: <span className="text-emerald-700 font-bold">{m.condition || 'ទំនិញថ្មី ១០០% (New Factory)'}</span>,
          },
          {
            label: 'ទម្ងន់ & វិមាត្រ (Weight & Size)',
            value: <span className="font-mono text-slate-800">{m.dimensions || m.dimensionsWeight || product.weight || '1,850 kg'}</span>,
          },
          {
            label: 'តម្លៃលក់ (Price / Unit)',
            value: (
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#1E5FA8] text-base sm:text-lg">
                  ${priceUSD.toLocaleString()}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-['Battambang']">
                  / {priceKHR.toLocaleString()} ៛ ({product.packagingSize || '១ គ្រឿង'})
                </span>
              </div>
            ),
          },
        ];
      }

      case 'organic_fertilizer':
      case 'compost_fertilizer': {
        const o = product.organicSpecs || {};
        const isCompost = groupId === 'compost_fertilizer';
        return [
          {
            label: isCompost ? 'ឈ្មោះជីកំប៉ុស' : 'ឈ្មោះជីសរីរាង្គ',
            value: <span className="font-bold text-slate-900 text-sm">{product.nameKh || product.name}</span>,
          },
          {
            label: 'ប្រភេទរង (Sub-category)',
            value: <span className="text-slate-800 font-medium">{product.categoryKh || product.category}</span>,
          },
          {
            label: 'សារធាតុសរីរាង្គ (Organic Matter OM)',
            value: (
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                🌿 {o.organicMatter || o.organicMatterOM || product.npk || '≥ 45% (High OM)'}
              </span>
            ),
          },
          {
            label: 'អាស៊ីត Humic & Fulvic',
            value: <span className="font-mono font-bold text-slate-800">{o.humicFulvic || o.humicFulvicAcid || '15% Humic + 3% Fulvic Acid'}</span>,
          },
          {
            label: 'មីក្រូសារពាង្គកាយមានប្រយោជន៍ (Microbes)',
            value: <span className="text-slate-800">{o.microorganisms || 'Trichoderma & Bacillus (1x10^8 CFU/g)'}</span>,
          },
          {
            label: 'កម្រិត pH ដី & សំណើម',
            value: <span className="text-slate-800">{o.phAndMoisture || `${o.phLevel || 'pH 6.5 - 7.5'} (សំណើម: ${o.moistureContent || '≤ 20%'})`}</span>,
          },
          {
            label: 'ទម្រង់រូបវន្ត (Physical Form)',
            value: <span className="text-slate-800">{o.physicalForm || o.formType || (isCompost ? 'ម្សៅកំប៉ុសម៉ត់ផុសល្អ' : 'គ្រាប់មូល Pellet (ទំហំ 3-4mm)')}</span>,
          },
          {
            label: 'ខ្នាតវេចខ្ចប់ & ទម្ងន់',
            value: <span className="font-mono text-slate-800">{product.packagingSize} ({product.weight})</span>,
          },
          {
            label: 'វិញ្ញាបនបត្រស្តង់ដារ',
            value: (
              <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-xs font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {o.certification || 'Organic Standard GAP / ISO'}
              </span>
            ),
          },
          {
            label: 'អត្ថប្រយោជន៍ចម្បង',
            value: <span className="text-slate-800 leading-relaxed">{product.usage}</span>,
          },
          {
            label: 'តម្លៃលក់ (Price)',
            value: (
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#1E5FA8] text-sm sm:text-base">
                  ${priceUSD.toFixed(2)}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-['Battambang']">
                  / {priceKHR.toLocaleString()} ៛
                </span>
              </div>
            ),
          },
        ];
      }

      case 'raw_material':
      case 'soil_raw_material':
      case 'feed_raw_material':
      case 'mushroom_nutrient': {
        const r = product.rawMaterialSpecs || {};
        const nameLabel =
          groupId === 'feed_raw_material'
            ? 'ឈ្មោះវត្ថុធាតុដើមចំណីសត្វ'
            : groupId === 'mushroom_nutrient'
            ? 'ឈ្មោះអាហារបំប៉ន / សម្ភារៈផ្សិត'
            : 'ឈ្មោះវត្ថុធាតុដើមដី / សារធាតុរ៉ែ';
        const purityLabel =
          groupId === 'feed_raw_material'
            ? 'កម្រិតប្រូតេអ៊ីន / គុណភាព (Protein / Grade)'
            : groupId === 'mushroom_nutrient'
            ? 'កម្រិតសារធាតុបំប៉ន / ភាពសុទ្ធ (Grade)'
            : 'កម្រិតភាពបរិសុទ្ធ (Purity % / Grade)';

        return [
          {
            label: nameLabel,
            value: <span className="font-bold text-slate-900 text-sm">{product.nameKh || product.name}</span>,
          },
          {
            label: 'ប្រភេទរង (Sub-category)',
            value: <span className="text-slate-800 font-medium">{product.categoryKh || product.category}</span>,
          },
          {
            label: purityLabel,
            value: (
              <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                💎 {r.purity || r.purityGrade || product.npk || '98.5% Pure Grade'}
              </span>
            ),
          },
          {
            label: 'រូបមន្ត / សមាសធាតុចម្បង (Formula)',
            value: <span className="font-mono font-bold text-slate-800">{r.chemicalFormula || product.npk || 'ស្តង់ដារកសិកម្ម'}</span>,
          },
          {
            label: 'ទំហំគ្រាប់ / កម្រិតម៉ដ្ឋ (Mesh / Form)',
            value: <span className="text-slate-800 font-mono">{r.particleSize || r.particleMeshSize || '100 - 200 Mesh Powder / Fine'}</span>,
          },
          {
            label: 'កម្រិតរលាយ & pH / សំណើម',
            value: <span className="text-slate-800">{r.solubility || r.solubilityPH || 'គុណភាពស្តង់ដារ / សំណើមទាប'}</span>,
          },
          {
            label: 'ប្រភេទវេចខ្ចប់ (Packaging)',
            value: <span className="text-slate-800 font-medium">{r.packagingType || `${product.packagingSize} (${product.weight})`}</span>,
          },
          {
            label: 'ស្តង់ដារវិញ្ញាបនបត្រគុណភាព (COA)',
            value: (
              <span className="text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-xs font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                {r.standardGrade || r.standardCOA || 'COA Inspection Standard Passed'}
              </span>
            ),
          },
          {
            label: 'ប្រភពនាំចូល / ផលិតកម្ម (Origin)',
            value: <span className="text-slate-800">{r.origin || r.originCountry || 'នាំចូលផ្ទាល់ពីរោងចក្រស្តង់ដារអន្តរជាតិ'}</span>,
          },
          {
            label: 'អត្ថប្រយោជន៍ចម្បង',
            value: <span className="text-slate-800 leading-relaxed">{product.usage}</span>,
          },
          {
            label: 'តម្លៃលក់ (Price)',
            value: (
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#1E5FA8] text-sm sm:text-base">
                  ${priceUSD.toFixed(2)}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-['Battambang']">
                  / {priceKHR.toLocaleString()} ៛ ({product.packagingSize || 'ឯកតា'})
                </span>
              </div>
            ),
          },
        ];
      }

      case 'chemical_fertilizer':
      default: {
        const c = product.chemicalSpecs || {};
        const hasNutrients =
          product.nutrients &&
          (product.nutrients.n ||
            product.nutrients.p ||
            product.nutrients.k ||
            product.nutrients.zn ||
            product.nutrients.mg ||
            product.nutrients.s ||
            product.nutrients.other);

        return [
          {
            label: 'ឈ្មោះជីគីមី',
            value: <span className="font-bold text-slate-900 text-sm">{product.nameKh || product.name}</span>,
          },
          {
            label: 'រូបមន្ត NPK (Formula)',
            value: <span className="font-mono font-bold text-[#1E5FA8] text-sm">{c.npkRatio || product.npk}</span>,
          },
          {
            label: 'ប្រភេទជី (Sub-category)',
            value: <span className="text-slate-800">{product.categoryKh || product.category}</span>,
          },
          {
            label: 'អត្ថប្រយោជន៍ចម្បង',
            value: <span className="text-slate-800 leading-relaxed">{product.usage}</span>,
          },
          {
            label: 'សមាសធាតុចិញ្ចឹម (Nutrients)',
            value: hasNutrients ? (
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {product.nutrients?.n && <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">N: {product.nutrients.n}%</span>}
                {product.nutrients?.p && <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">P2O5: {product.nutrients.p}%</span>}
                {product.nutrients?.k && <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded border border-red-200">K2O: {product.nutrients.k}%</span>}
                {product.nutrients?.zn && <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">Zn: {product.nutrients.zn}%</span>}
                {product.nutrients?.mg && <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">MgO: {product.nutrients.mg}%</span>}
                {product.nutrients?.s && <span className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200">S: {product.nutrients.s}%</span>}
                {product.nutrients?.other && <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">{product.nutrients.other}</span>}
              </div>
            ) : (
              <span className="text-slate-700 font-mono text-xs">{c.microNutrientsTE || product.npk || 'សមាសធាតុស្តង់ដារ NPK'}</span>
            ),
          },
          {
            label: 'ពណ៌គ្រាប់ជី & ទម្រង់',
            value: <span className="text-slate-800">{c.granuleColorShape || product.granuleColor || 'គ្រាប់ចម្រុះគុណភាពខ្ពស់'}</span>,
          },
          ...(c.applicationRate
            ? [
                {
                  label: 'កម្រិតប្រើប្រាស់ណែនាំ',
                  value: <span className="text-emerald-700 font-semibold">{c.applicationRate}</span>,
                },
              ]
            : []),
          {
            label: 'ខ្នាតវេចខ្ចប់ & ទម្ងន់',
            value: <span className="text-slate-800 font-mono">{product.packagingSize} ({product.weight})</span>,
          },
          {
            label: 'តម្លៃលក់ (Price / Bag)',
            value: (
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#1E5FA8] text-sm sm:text-base">
                  ${priceUSD.toFixed(2)}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-['Battambang']">
                  / {priceKHR.toLocaleString()} ៛
                </span>
              </div>
            ),
          },
          {
            label: 'លេខបញ្ជីការផ្លូវការ (MAFF)',
            value: <span className="font-mono text-slate-700 text-xs sm:text-sm">{c.registrationNo || product.registrationNo}</span>,
          },
          {
            label: 'ដំណាំស័ក្តិសម',
            value: (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {(product.suitableCrops || []).map((crop, i) => (
                  <span
                    key={i}
                    className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1"
                  >
                    🌱 {crop}
                  </span>
                ))}
              </div>
            ),
          },
        ];
      }
    }
  };

  // Combine standard group rows with any custom specifications added by Admin
  const customSpecRows = (product.specifications || [])
    .filter((s) => s.labelKh && s.value)
    .map((s) => ({
      label: s.labelKh,
      value: <span className="text-slate-800 font-medium">{s.value}</span>,
    }));

  const specRows = [...getGroupSpecRows(), ...customSpecRows];

  const getHeaderIcon = () => {
    switch (groupId) {
      case 'machinery':
        return <Tractor className="w-4 h-4 text-white" />;
      case 'organic_fertilizer':
        return <Sprout className="w-4 h-4 text-white" />;
      case 'compost_fertilizer':
        return <Leaf className="w-4 h-4 text-white" />;
      case 'feed_raw_material':
        return <Wheat className="w-4 h-4 text-white" />;
      case 'mushroom_nutrient':
        return <Sparkles className="w-4 h-4 text-white" />;
      case 'raw_material':
      case 'soil_raw_material':
        return <Layers className="w-4 h-4 text-white" />;
      case 'chemical_fertilizer':
      default:
        return <FlaskConical className="w-4 h-4 text-white" />;
    }
  };

  const getHeaderTitle = () => {
    switch (groupId) {
      case 'machinery':
        return 'តារាងលក្ខណៈបច្ចេកទេសគ្រឿងចក្រកសិកម្ម (Machinery Specs)';
      case 'organic_fertilizer':
        return 'តារាងលក្ខណៈបច្ចេកទេសជីសរីរាង្គ (Organic Fertilizer Specs)';
      case 'compost_fertilizer':
        return 'តារាងលក្ខណៈបច្ចេកទេសជីកំប៉ុស (Compost Fertilizer Specs)';
      case 'soil_raw_material':
        return 'តារាងលក្ខណៈបច្ចេកទេសវត្ថុធាតុដើមដី (Soil Raw Material Specs)';
      case 'feed_raw_material':
        return 'តារាងលក្ខណៈបច្ចេកទេសវត្ថុធាតុដើមចំណី (Feed Raw Material Specs)';
      case 'mushroom_nutrient':
        return 'តារាងលក្ខណៈបច្ចេកទេសអាហារផ្សិត (Mushroom Nutrient Specs)';
      case 'raw_material':
        return 'តារាងលក្ខណៈបច្ចេកទេសវត្ថុធាតុដើម (Raw Material Specs)';
      case 'chemical_fertilizer':
      default:
        return 'តារាងលក្ខណៈបច្ចេកទេសជីគីមីកសិកម្ម (Chemical Fertilizer Specs)';
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs font-['Kantumruy_Pro']">
      {/* Dynamic Header Banner */}
      <div className="bg-[#1E5FA8] px-4 py-3 text-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {getHeaderIcon()}
          <h3 className="font-['Battambang'] text-xs sm:text-sm md:text-base font-bold tracking-tight text-white truncate">
            {getHeaderTitle()}
          </h3>
        </div>
        <span className="text-[11px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold shrink-0">
          {product.groupKh || groupObj?.nameKh || 'កាតាឡុក ទីវ ហៃ'}
        </span>
      </div>

      {/* Specification Table Rows */}
      <div className="divide-y divide-slate-100">
        {specRows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 py-3 text-xs sm:text-sm hover:bg-slate-50/60 transition-colors"
          >
            <div className="sm:col-span-4 font-bold text-slate-600 font-['Battambang'] flex items-center">
              {row.label}
            </div>
            <div className="sm:col-span-8 text-slate-800 font-['Battambang'] flex items-center flex-wrap">
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
