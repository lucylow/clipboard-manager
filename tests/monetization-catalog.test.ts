import { describe, expect, it } from 'vitest';

import {
  MOCK_PRODUCT_CATALOG,
  formatProductPreview,
  getCatalogReadiness,
  getEntitlementSummary,
  getUpgradePreviewModel,
  parseEntitlementRecord,
  shouldRecordMonetizationSignal,
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

  it('normalizes valid entitlements and rejects malformed records safely', () => {
    const active = parseEntitlementRecord({ plan: 'pro', status: 'active', source: 'store', validation: 'validated', extra: 'ignored' });
    expect(active).toEqual({ plan: 'pro', status: 'active', source: 'store', validation: 'validated' });
    expect(getEntitlementSummary(active!)).toEqual({
      isActive: true,
      label: 'Clipboard Pro active',
      sourceLabel: 'store entitlement',
      validationLabel: 'validated',
    });
    expect(parseEntitlementRecord(null)).toBeNull();
    expect(parseEntitlementRecord({ plan: 'trial' })).toBeNull();
  });

  it('records optional monetization signals only when local measurement is enabled', () => {
    expect(shouldRecordMonetizationSignal('plan-interest', false)).toBe(false);
    expect(shouldRecordMonetizationSignal('billing-notice', false)).toBe(false);
    expect(shouldRecordMonetizationSignal('plan-interest', true)).toBe(true);
    expect(shouldRecordMonetizationSignal('billing-notice', true)).toBe(true);
  });

  it('keeps upgrade CTAs honest across entitlement and catalog states', () => {
    expect(getUpgradePreviewModel({ isPremium: false, planInterestSaved: false, billingNoticeRequested: false, catalogReady: false })).toMatchObject({
      primaryLabel: 'Review billing checklist',
      statusLabel: 'Billing setup in progress',
      purchaseEnabled: false,
    });
    expect(getUpgradePreviewModel({ isPremium: false, planInterestSaved: true, billingNoticeRequested: false, catalogReady: false })).toMatchObject({
      primaryLabel: 'Billing setup requested',
      statusLabel: 'We will keep your interest locally',
      purchaseEnabled: false,
    });
    expect(getUpgradePreviewModel({ isPremium: false, planInterestSaved: false, billingNoticeRequested: false, catalogReady: true })).toMatchObject({
      primaryLabel: 'Continue to purchase',
      purchaseEnabled: true,
    });
    expect(getUpgradePreviewModel({ isPremium: true, planInterestSaved: false, billingNoticeRequested: false, catalogReady: true })).toMatchObject({
      primaryLabel: 'Manage local preview',
      statusLabel: 'Clipboard Pro active',
      purchaseEnabled: false,
    });
  });

  it('does not fabricate a price or renewal term in the preview', () => {
    expect(formatProductPreview(MOCK_PRODUCT_CATALOG[0])).toBe(
      'Clipboard Pro monthly · Price pending · Monthly renewal terms pending',
    );
  });
});
