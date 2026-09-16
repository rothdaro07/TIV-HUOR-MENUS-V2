import React from 'react';
import { Product, Currency } from '../types';
import { EXCHANGE_RATE_KHR } from '../data/initialProducts';
import { Tractor, FlaskConical, Sprout, Layers, CheckCircle2, ShieldCheck, Wrench, Sparkles } from 'lucide-react';

interface ProductSpecTableProps {
  product: Product;
  currency?: Currency;
}

export const ProductSpecTable: React.FC<ProductSpecTableProps> = ({ product }) => {
  const priceUSD = product.price;
  const priceKHR = Math.round(product.price * EXCHANGE_RATE_KHR);
  const groupId = product.groupId || 'chemical_fertilizer';

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

      case 'organic_fertilizer': {
        const o = product.organicSpecs || {};
        return [
          {
            label: 'ឈ្មោះជីសរីរាង្គ',
            value: <span className="font-bold text-slate-900 text-sm">{product.nameKh || product.name}</span>,
          },
          {
            label: 'ប្រភេទរង (Category)',
            value: <span className="text-slate-800 font-medium">{product.categoryKh}</span>,
          },
          {
            label: 'សារធាតុសរីរាង្គ (Organic Matter OM)',
            value: (
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                🌿 {o.organicMatter || o.organicMatterOM || '≥ 45% (High OM)'}
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
            value: <span className="text-slate-800">{o.physicalForm || o.formType || 'គ្រាប់មូល Pellet (ទំហំ 3-4mm)'}</span>,
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

      case 'raw_material': {
        const r = product.rawMaterialSpecs || {};
        return [
          {
            label: 'ឈ្មោះវត្ថុធាតុដើម / សារធាតុរ៉ែ',
            value: <span className="font-bold text-slate-900 text-sm">{product.nameKh || product.name}</span>,
          },
          {
            label: 'កម្រិតភាពបរិសុទ្ធ (Purity % / Grade)',
            value: (
              <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                💎 {r.purity || r.purityGrade || '98.5% Technical Pure Grade'}
              </span>
            ),
          },
          {
            label: 'រូបមន្តគីមី / លេខកូដ CAS (Formula)',
            value: <span className="font-mono font-bold text-slate-800">{r.chemicalFormula || product.npk || 'CaMg(CO3)2'}</span>,
          },
          {
            label: 'ទំហំគ្រាប់ / កម្រិតម៉ដ្ឋ (Mesh Size)',
            value: <span className="text-slate-800 font-mono">{r.particleSize || r.particleMeshSize || '100 - 200 Mesh Powder / Granular'}</span>,
          },
          {
            label: 'កម្រិតរលាយ & pH (Solubility & pH)',
            value: <span className="text-slate-800">{r.solubility || r.solubilityPH || 'រលាយក្នុងទឹក / pH 7.5 - 8.5'}</span>,
          },
          {
            label: 'ប្រភេទវេចខ្ចប់ (Packaging)',
            value: <span className="text-slate-800 font-medium">{r.packagingType || product.packagingSize || 'Big Bag 1,000 kg (Jumbo)'}</span>,
          },
          {
            label: 'ស្តង់ដារវិញ្ញាបនបត្រ COA',
            value: (
              <span className="text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-xs font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                {r.standardGrade || r.standardCOA || 'COA Inspection Standard Passed'}
              </span>
            ),
          },
          {
            label: 'ប្រភពនាំចូល (Origin)',
            value: <span className="text-slate-800">{r.origin || r.originCountry || 'នាំចូលផ្ទាល់ពីរោងចក្រស្តង់ដារអន្តរជាតិ'}</span>,
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
        return [
          {
            label: 'ឈ្មោះជីគីមី',
            value: <span className="font-bold text-slate-900 text-sm">{product.nameKh || product.name}</span>,
          },
          {
            label: 'រូបមន្ត NPK (Formula)',
            value: <span className="font-mono font-bold text-[#1E5FA8] text-sm">{product.npk}</span>,
          },
          {
            label: 'ប្រភេទជី',
            value: <span className="text-slate-800">{product.categoryKh}</span>,
          },
          {
            label: 'អត្ថប្រយោជន៍ចម្បង',
            value: <span className="text-slate-800 leading-relaxed">{product.usage}</span>,
          },
          {
            label: 'សមាសធាតុចិញ្ចឹម (Nutrients)',
            value: (
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {product.nutrients?.n && <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">N: {product.nutrients.n}%</span>}
                {product.nutrients?.p && <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">P2O5: {product.nutrients.p}%</span>}
                {product.nutrients?.k && <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded border border-red-200">K2O: {product.nutrients.k}%</span>}
                {product.nutrients?.zn && <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">Zn: {product.nutrients.zn}%</span>}
                {product.nutrients?.mg && <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">MgO: {product.nutrients.mg}%</span>}
                {product.nutrients?.s && <span className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200">S: {product.nutrients.s}%</span>}
              </div>
            ),
          },
          {
            label: 'ពណ៌គ្រាប់ជី & ទម្រង់',
            value: <span className="text-slate-800">{c.granuleColorShape || product.granuleColor || 'គ្រាប់ចម្រុះគុណភាពខ្ពស់'}</span>,
          },
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
            value: <span className="font-mono text-slate-700 text-xs sm:text-sm">{product.registrationNo}</span>,
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

  const specRows = getGroupSpecRows();

  const getHeaderIcon = () => {
    switch (groupId) {
      case 'machinery':
        return <Tractor className="w-4 h-4 text-white" />;
      case 'organic_fertilizer':
        return <Sprout className="w-4 h-4 text-white" />;
      case 'raw_material':
        return <Layers className="w-4 h-4 text-white" />;
      case 'chemical_fertilizer':
      default:
        return <FlaskConical className="w-4 h-4 text-white" />;
    }
  };

  const getHeaderTitle = () => {
    switch (groupId) {
      case 'machinery':
        return 'តារាងលក្ខណៈបច្ចេកទេសគ្រឿងចក្រកសិកម្ម (Technical Machinery Specs)';
      case 'organic_fertilizer':
        return 'តារាងលក្ខណៈបច្ចេកទេសជីសរីរាង្គ & ដី (Organic Fertilizer Specs)';
      case 'raw_material':
        return 'តារាងលក្ខណៈបច្ចេកទេសវត្ថុធាតុដើម & សារធាតុរ៉ែ (Raw Material & Mineral Specs)';
      case 'chemical_fertilizer':
      default:
        return 'តារាងលក្ខណៈបច្ចេកទេសជីគីមីកសិកម្ម (Chemical Fertilizer Specs)';
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs font-['Kantumruy_Pro']">
      {/* Dynamic Header Banner */}
      <div className="bg-[#1E5FA8] px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getHeaderIcon()}
          <h3 className="font-['Battambang'] text-sm sm:text-base font-bold tracking-tight text-white">
            {getHeaderTitle()}
          </h3>
        </div>
        <span className="text-[11px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">
          {product.groupKh || 'កាតាឡុក ទីវ ហៃ'}
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

