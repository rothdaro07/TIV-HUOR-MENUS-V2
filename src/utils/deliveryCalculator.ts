import { CartItem, CambodiaProvince, DeliveryMethod, DeliveryFeeCalculation, ProvinceTier } from '../types';
import { EXCHANGE_RATE_KHR } from '../data/initialProducts';
import { CAMBODIA_PROVINCES } from '../data/cambodiaProvinces';

/**
 * Parses weight string (e.g., "50kg", "25 kg", "1L", "500g") into numeric kilograms (kg).
 */
export function parseProductWeightToKg(weightStr?: string, packagingSize?: string): number {
  if (!weightStr && !packagingSize) return 50; // default fertilizer bag nominal weight

  const target = (weightStr || packagingSize || '').toLowerCase().trim();

  // Check grams e.g. "500g", "500 g"
  if (target.includes('g') && !target.includes('kg')) {
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      return num / 1000;
    }
  }

  // Check liters e.g. "1L", "5L", "1 liter"
  if (target.includes('l') || target.includes('លីត្រ')) {
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      // 1 liter fertilizer liquid is approx 1.2 kg density
      return num * 1.2;
    }
  }

  // Standard kg e.g. "50kg", "50 គីឡូក្រាម"
  const match = target.match(/([0-9.]+)\s*(?:kg|គីឡូ|គក)?/i);
  if (match && match[1]) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }

  return 50; // standard bag default
}

/**
 * Calculate Volumetric Weight: (L cm * W cm * H cm) / 5000
 */
export function calculateVolumetricWeightKg(
  lengthCm: number = 75,
  widthCm: number = 45,
  heightCm: number = 15
): number {
  return (lengthCm * widthCm * heightCm) / 5000;
}

/**
 * Calculates VET Logistics (Vireak Buntham Express) Domestic Delivery Fee
 * across all 24 provinces + 1 capital city.
 */
export function calculateVetDeliveryFee(
  items: CartItem[] = [],
  provinceId: string,
  deliveryMethod: DeliveryMethod = 'branch'
): DeliveryFeeCalculation {
  const province =
    CAMBODIA_PROVINCES.find((p) => p.id === provinceId) || CAMBODIA_PROVINCES[0];
  const tier: ProvinceTier = province.tier;

  // 1. Calculate Total Actual Weight
  let totalActualWeightKg = 0;
  let totalVolumetricWeightKg = 0;

  (items || []).forEach((item) => {
    if (!item || !item.product) return;
    const singleKg = parseProductWeightToKg(item.product.weight, item.product.packagingSize);
    totalActualWeightKg += singleKg * (item.quantity || 1);

    // Approximate volume for standard fertilizer packaging
    // 50kg bag is ~ 75x45x15 cm = 10.125 kg volumetric
    const singleVolumetricKg =
      singleKg >= 40
        ? calculateVolumetricWeightKg(75, 45, 15)
        : singleKg >= 20
        ? calculateVolumetricWeightKg(55, 35, 12)
        : calculateVolumetricWeightKg(25, 20, 10);

    totalVolumetricWeightKg += singleVolumetricKg * (item.quantity || 1);
  });

  // Minimum package weight safety
  if (totalActualWeightKg <= 0) {
    totalActualWeightKg = 1;
  }

  // Billable weight is maximum of actual vs volumetric
  const billableWeightKg = Math.max(totalActualWeightKg, totalVolumetricWeightKg);

  let weightTier: 'small' | 'medium' | 'bulk' = 'small';
  let baseRateUSD = 0;
  let weightFeeUSD = 0;
  let ratePerKgUSD = 0;
  let breakdownKh = '';

  // 2. Pricing Tiers based on VET Logistics rules
  if (billableWeightKg <= 3) {
    // Small Packages (0.5 kg to 3 kg): $1.00 – $2.50 flat fee for standard provincial branch delivery
    weightTier = 'small';
    if (tier === 'central') {
      baseRateUSD = 1.0;
    } else if (tier === 'main') {
      baseRateUSD = 1.5;
    } else if (tier === 'regional') {
      baseRateUSD = 2.0;
    } else {
      // remote (Mondulkiri, Ratanakiri, Koh Kong, etc.)
      baseRateUSD = 2.5;
    }
    weightFeeUSD = baseRateUSD;
    ratePerKgUSD = baseRateUSD / billableWeightKg;
    breakdownKh = `កញ្ចប់តូច (០.៥-៣ គីឡូក្រាម) តម្លៃសេវាថេរ ${province.nameKh}: $${baseRateUSD.toFixed(2)}`;
  } else if (billableWeightKg <= 20) {
    // Medium/Heavy Packages (3 kg to 20 kg): $0.30 – $0.60 per kg
    weightTier = 'medium';
    let baseSmall = 1.0;
    let perExtraKg = 0.3;

    if (tier === 'central') {
      baseSmall = 1.0;
      perExtraKg = 0.3;
    } else if (tier === 'main') {
      baseSmall = 1.5;
      perExtraKg = 0.35;
    } else if (tier === 'regional') {
      baseSmall = 2.0;
      perExtraKg = 0.45;
    } else {
      baseSmall = 2.5;
      perExtraKg = 0.6;
    }

    const extraKg = billableWeightKg - 3;
    weightFeeUSD = baseSmall + extraKg * perExtraKg;
    baseRateUSD = baseSmall;
    ratePerKgUSD = weightFeeUSD / billableWeightKg;
    breakdownKh = `កញ្ចប់មធ្យម (${billableWeightKg.toFixed(1)} គក): $${baseSmall.toFixed(2)} + ${extraKg.toFixed(1)} គក × $${perExtraKg.toFixed(2)}/គក`;
  } else {
    // Bulk Cargo (20+ kg e.g. fertilizer bags 50kg, 100kg, bulk cargo): $0.20 – $0.40 per kg
    weightTier = 'bulk';
    if (tier === 'central') {
      ratePerKgUSD = 0.18; // Phnom Penh / Kandal
    } else if (tier === 'main') {
      ratePerKgUSD = 0.22; // Battambang, Siem Reap, Kampong Cham, Sihanoukville, etc.
    } else if (tier === 'regional') {
      ratePerKgUSD = 0.28; // Pailin, Kratie, Oddar Meanchey
    } else {
      ratePerKgUSD = 0.36; // Mondulkiri, Ratanakiri, Stung Treng, Preah Vihear, Koh Kong
    }

    weightFeeUSD = billableWeightKg * ratePerKgUSD;
    baseRateUSD = 0;
    breakdownKh = `ទំនិញធំ/ជីកសិកម្ម (${billableWeightKg.toFixed(0)} គីឡូក្រាម): $${ratePerKgUSD.toFixed(2)} / គីឡូក្រាម`;
  }

  // 3. Door-to-Door Home Delivery Extra Surcharge ($0.50 - $1.50)
  let doorDeliveryFeeUSD = 0;
  if (deliveryMethod === 'door') {
    if (tier === 'central') {
      doorDeliveryFeeUSD = 0.5;
    } else if (tier === 'main') {
      doorDeliveryFeeUSD = 1.0;
    } else {
      doorDeliveryFeeUSD = 1.5;
    }
  }

  const totalFeeUSD = Math.round((weightFeeUSD + doorDeliveryFeeUSD) * 100) / 100;
  const totalFeeKHR = Math.round(totalFeeUSD * EXCHANGE_RATE_KHR);

  return {
    totalActualWeightKg,
    totalVolumetricWeightKg,
    billableWeightKg,
    weightTier,
    baseRateUSD,
    weightFeeUSD,
    doorDeliveryFeeUSD,
    totalFeeUSD,
    totalFeeKHR,
    ratePerKgUSD,
    breakdownKh,
    estimatedDeliveryTime: province.estimatedHours,
  };
}
