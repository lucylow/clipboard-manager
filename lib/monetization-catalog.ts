export type CatalogBillingPeriod = 'month' | 'year';

export type LocalEntitlement = {
  plan: 'free' | 'pro';
  status: 'active' | 'inactive';
  source: 'local-preview' | 'store';
  validation: 'unverified' | 'validated';
};

export function parseEntitlementRecord(candidate: unknown): LocalEntitlement | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const value = candidate as Partial<LocalEntitlement>;
  if (value.plan !== 'free' && value.plan !== 'pro') return null;
  return {
    plan: value.plan,
    status: value.status === 'active' ? 'active' : 'inactive',
    source: value.source === 'store' ? 'store' : 'local-preview',
    validation: value.validation === 'validated' ? 'validated' : 'unverified',
  };
}

export function getEntitlementSummary(entitlement: LocalEntitlement) {
  const isActive = entitlement.plan === 'pro' && entitlement.status === 'active';
  return {
    isActive,
    label: isActive ? 'Clipboard Pro active' : 'Free plan · core tools included',
    sourceLabel: entitlement.source === 'store' ? 'store entitlement' : 'local preview',
    validationLabel: entitlement.validation === 'validated' ? 'validated' : 'validation pending',
  } as const;
}

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

export type MonetizationSignal = 'plan-interest' | 'billing-notice';

export function shouldRecordMonetizationSignal(signal: MonetizationSignal, telemetryEnabled: boolean): boolean {
  return telemetryEnabled && (signal === 'plan-interest' || signal === 'billing-notice');
}

export type UpgradePreviewInput = {
  isPremium: boolean;
  planInterestSaved: boolean;
  billingNoticeRequested: boolean;
  catalogReady: boolean;
};

export function getUpgradePreviewModel(input: UpgradePreviewInput) {
  if (input.isPremium) {
    return {
      title: 'Your Pro tools are ready',
      primaryLabel: 'Manage local preview',
      statusLabel: 'Clipboard Pro active',
      purchaseEnabled: false,
    } as const;
  }
  if (input.catalogReady) {
    return {
      title: 'Move faster with Clipboard Pro',
      primaryLabel: 'Continue to purchase',
      statusLabel: 'Store products ready',
      purchaseEnabled: true,
    } as const;
  }
  return {
    title: 'Move faster with Clipboard Pro',
    primaryLabel: input.planInterestSaved || input.billingNoticeRequested ? 'Billing setup requested' : 'Review billing checklist',
    statusLabel: input.planInterestSaved || input.billingNoticeRequested ? 'We will keep your interest locally' : 'Billing setup in progress',
    purchaseEnabled: false,
  } as const;
}

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
