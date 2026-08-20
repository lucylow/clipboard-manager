import { describe, expect, it } from 'vitest';

import {
  MOCK_PRODUCT_CATALOG,
  formatProductPreview,
  getCatalogReadiness,
  getEntitlementSummary,
  getMonetizationRecoveryModel,
  getProBenefitSummary,
  getProUpgradePrompt,
  getStoreReadinessSummary,
  getUpgradePreviewModel,
  parseEntitlementRecord,
  resolveRestoreOutcome,
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

  it('keeps monetization recovery messaging safe across healthy and failed states', () => {
    expect(getMonetizationRecoveryModel({ hydrationFailed: false, recoveryFailureCount: 0, isPremium: false })).toMatchObject({ visible: false, message: 'The free plan remains available while billing is not connected.' });
    expect(getMonetizationRecoveryModel({ hydrationFailed: true, recoveryFailureCount: 1, isPremium: false })).toMatchObject({ visible: true, message: 'The free plan remains safe. Retry to reload local details or reset safely.' });
    expect(getMonetizationRecoveryModel({ hydrationFailed: true, recoveryFailureCount: 2, isPremium: true })).toMatchObject({ visible: true, title: 'Local monetization state still needs attention', message: 'Your last known Pro state is preserved. Retry to reload local details or reset safely.' });
  });

  it('keeps the Pro benefit hierarchy clear for free and active plans', () => {
    expect(getProBenefitSummary(false)).toMatchObject({
      primary: 'Batch export turns multiple clipboard items into one clean share.',
      secondary: 'Pro also prepares richer media workflows for the connected-store release.',
      freeCore: 'History, favorites, OCR, and local storage remain part of the free core.',
    });
    expect(getProBenefitSummary(true)).toMatchObject({
      primary: 'Batch export is unlocked for faster sharing.',
      freeCore: 'Your entitlement is local preview state until store validation is connected.',
    });
  });

  it('creates contextual Pro prompts for selected exports', () => {
    expect(getProUpgradePrompt(1, false)).toEqual({
      label: 'Unlock batch export',
      message: 'Batch export for 1 selected item is available in Clipboard Pro.',
      destination: 'settings',
    });
    expect(getProUpgradePrompt(3, false)?.message).toContain('3 selected items');
    expect(getProUpgradePrompt(0, false)?.label).toBe('Explore Clipboard Pro');
    expect(getProUpgradePrompt(3, true)).toBeNull();
  });

  it('summarizes store readiness without enabling preview purchases', () => {
    expect(getStoreReadinessSummary(MOCK_PRODUCT_CATALOG)).toEqual({
      statusLabel: 'Preview products loaded · prices unavailable',
      nextStep: 'Configure product prices, renewal terms, and receipt validation',
      purchaseEnabled: false,
    });
    expect(getStoreReadinessSummary([{ ...MOCK_PRODUCT_CATALOG[0], purchasable: true }])).toEqual({
      statusLabel: 'Store products ready · purchase controls available',
      nextStep: 'Review the selected plan before purchase',
      purchaseEnabled: true,
    });
  });

  it('resolves restore outcomes with explicit active and free-plan feedback', () => {
    const active = resolveRestoreOutcome(false, { plan: 'pro', status: 'active', source: 'store', validation: 'validated' });
    expect(active.isActive).toBe(true);
    expect(active.message).toContain('store entitlement');
    expect(active.message).toContain('validated');

    const legacy = resolveRestoreOutcome(true, null);
    expect(legacy.entitlement).toEqual({ plan: 'pro', status: 'active', source: 'local-preview', validation: 'unverified' });

    const free = resolveRestoreOutcome(false, { plan: 'pro', status: 'inactive', source: 'store', validation: 'validated' });
    expect(free.isActive).toBe(false);
    expect(free.message).toBe('No active purchase found · free plan remains available');
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
