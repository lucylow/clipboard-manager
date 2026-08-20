import { describe, expect, it } from 'vitest';

import {
  MOCK_PRODUCT_CATALOG,
  formatProductPreview,
  getCatalogReadiness,
} from '../lib/monetization-catalog';

describe('monetization catalog preview', () => {
  it('exposes stable monthly and annual product identifiers', () => {
    expect(MOCK_PRODUCT_CATALOG.map((product) => product.id)).toEqual([
      'clipboard.pro.monthly',
      'clipboard.pro.annual',
    ]);
    expect(MOCK_PRODUCT_CATALOG.map((product) => product.billingPeriod)).toEqual(['month', 'year']);
  });

  it('keeps purchase controls disabled until a real purchasable product exists', () => {
    expect(getCatalogReadiness(MOCK_PRODUCT_CATALOG)).toEqual({
      hasProducts: true,
      hasPurchasableProduct: false,
      purchaseControlsEnabled: false,
    });
    expect(getCatalogReadiness([{ ...MOCK_PRODUCT_CATALOG[0], purchasable: true }])).toEqual({
      hasProducts: true,
      hasPurchasableProduct: true,
      purchaseControlsEnabled: true,
    });
  });

  it('does not fabricate a price or renewal term in the preview', () => {
    expect(formatProductPreview(MOCK_PRODUCT_CATALOG[0])).toBe(
      'Clipboard Pro monthly · Price pending · Monthly renewal terms pending',
    );
  });
});
