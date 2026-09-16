import { Product, PriceMode, Currency, ProductPackagingOption } from '../types';
import { EXCHANGE_RATE_KHR } from '../data/initialProducts';

/**
 * Generates default size options for chemical fertilizers if not explicitly configured.
 */
export function getDefaultChemicalSizes(basePrice50kg: number = 35.0): ProductPackagingOption[] {
  const p50 = Number(basePrice50kg.toFixed(2));
  const p25 = Number((basePrice50kg * 0.53).toFixed(2));
  const p10 = Number((basePrice50kg * 0.23).toFixed(2));
  const p5 = Number((basePrice50kg * 0.13).toFixed(2));

  return [
    {
      size: '50kg',
      labelKh: 'បាវ ៥០ គីឡូក្រាម (50kg)',
      weight: '50kg',
      price: p50,
      wholesalePrice: Number((p50 * 0.92).toFixed(2)),
      isDefault: true,
    },
    {
      size: '25kg',
      labelKh: 'បាវ ២៥ គីឡូក្រាម (25kg)',
      weight: '25kg',
      price: p25,
      wholesalePrice: Number((p25 * 0.92).toFixed(2)),
    },
    {
      size: '10kg',
      labelKh: 'កញ្ចប់ ១០ គីឡូក្រាម (10kg)',
      weight: '10kg',
      price: p10,
      wholesalePrice: Number((p10 * 0.92).toFixed(2)),
    },
    {
      size: '5kg',
      labelKh: 'កញ្ចប់ ៥ គីឡូក្រាម (5kg)',
      weight: '5kg',
      price: p5,
      wholesalePrice: Number((p5 * 0.92).toFixed(2)),
    },
  ];
}

/**
 * Returns the effective price of a product in USD based on selected PriceMode (retail vs wholesale) and optional selected size.
 */
export function getProductPriceUSD(
  product: Product,
  priceMode: PriceMode | string = 'retail',
  selectedSize?: string
): number {
  let basePrice = product.price;
  let customWholesalePrice = product.wholesalePrice;

  // If a specific packaging size is selected and available
  if (selectedSize && product.availableSizes && product.availableSizes.length > 0) {
    const matchedSize = product.availableSizes.find((s) => s.size === selectedSize);
    if (matchedSize) {
      basePrice = matchedSize.price;
      if (typeof matchedSize.wholesalePrice === 'number' && matchedSize.wholesalePrice > 0) {
        customWholesalePrice = matchedSize.wholesalePrice;
      } else {
        customWholesalePrice = Number((matchedSize.price * 0.92).toFixed(2));
      }
    }
  }

  if (priceMode === 'wholesale') {
    if (typeof customWholesalePrice === 'number' && customWholesalePrice > 0) {
      return customWholesalePrice;
    }
    // Fallback: Default 8% wholesale bulk discount
    return Number((basePrice * 0.92).toFixed(2));
  }
  return basePrice;
}

/**
 * Returns formatted prices in both USD and KHR for a product under the current price mode, currency, and selected size.
 */
export function getProductDisplayPrice(
  product: Product,
  priceMode: PriceMode | string = 'retail',
  currency: Currency | string = 'USD',
  selectedSize?: string
) {
  const mode = (priceMode === 'wholesale' ? 'wholesale' : 'retail') as PriceMode;
  const curr = (currency === 'KHR' ? 'KHR' : 'USD') as Currency;

  const priceUSD = getProductPriceUSD(product, mode, selectedSize);
  const priceKHR = Math.round(priceUSD * EXCHANGE_RATE_KHR);
  
  let retailPriceUSD = product.price;
  if (selectedSize && product.availableSizes && product.availableSizes.length > 0) {
    const matched = product.availableSizes.find((s) => s.size === selectedSize);
    if (matched) {
      retailPriceUSD = matched.price;
    }
  }
  const retailPriceKHR = Math.round(retailPriceUSD * EXCHANGE_RATE_KHR);

  return {
    priceUSD,
    priceKHR,
    retailPriceUSD,
    retailPriceKHR,
    isWholesaleDiscount: mode === 'wholesale' && priceUSD < retailPriceUSD,
    formattedCurrent: curr === 'KHR' ? `${priceKHR.toLocaleString()} ៛` : `$${priceUSD.toFixed(2)}`,
    formattedSecondary: curr === 'KHR' ? `~$${priceUSD.toFixed(2)}` : `~${priceKHR.toLocaleString()} ៛`,
  };
}

