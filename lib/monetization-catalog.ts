export type CatalogBillingPeriod = 'month' | 'year';

export type MonetizationProductPreview = {
  id: string;
  title: string;
  billingPeriod: CatalogBillingPeriod;
  priceLabel: string;
  renewalLabel: string;
  purchasable: boolean;
};

/**
 * Store-facing product metadata used by the preview until a real store catalog is connected.
 * Price values stay unavailable rather than presenting placeholder numbers as real offers.
 */
export const MOCK_PRODUCT_CATALOG: readonly MonetizationProductPreview[] = [
  {
    id: 'clipboard.pro.monthly',
    title: 'Clipboard Pro monthly',
    billingPeriod: 'month',
    priceLabel: 'Price pending',
    renewalLabel: 'Monthly renewal terms pending',
    purchasable: false,
  },
  {
    id: 'clipboard.pro.annual',
    title: 'Clipboard Pro annual',
    billingPeriod: 'year',
    priceLabel: 'Price pending',
    renewalLabel: 'Annual renewal terms pending',
    purchasable: false,
  },
];

export function getCatalogReadiness(products: readonly MonetizationProductPreview[]) {
  const hasProducts = products.length > 0;
  const hasPurchasableProduct = products.some((product) => product.purchasable);
  return {
    hasProducts,
    hasPurchasableProduct,
    purchaseControlsEnabled: hasProducts && hasPurchasableProduct,
  } as const;
}

export function formatProductPreview(product: MonetizationProductPreview): string {
  return `${product.title} · ${product.priceLabel} · ${product.renewalLabel}`;
}
