import { describe, expect, it } from 'vitest';

import { createMonetizationOperationGuard } from '../lib/monetization-operation-guard';

describe('monetization operation guard', () => {
  it('rejects restore while reset is active', () => {
    const guard = createMonetizationOperationGuard();

    expect(guard.acquire('reset')).toBe(true);
    expect(guard.active).toBe('reset');
    expect(guard.acquire('restore')).toBe(false);
    expect(guard.active).toBe('reset');
  });

  it('rejects reset while restore is active', () => {
    const guard = createMonetizationOperationGuard();

    expect(guard.acquire('restore')).toBe(true);
    expect(guard.active).toBe('restore');
    expect(guard.acquire('reset')).toBe(false);
    expect(guard.active).toBe('restore');
  });

  it('releases only the operation that owns the guard', () => {
    const guard = createMonetizationOperationGuard();

    expect(guard.acquire('reset')).toBe(true);
    guard.release('restore');
    expect(guard.active).toBe('reset');
    guard.release('reset');
    expect(guard.active).toBeNull();
    expect(guard.acquire('restore')).toBe(true);
  });

  it('can be reacquired after a failed operation is released', () => {
    const guard = createMonetizationOperationGuard();

    expect(guard.acquire('restore')).toBe(true);
    guard.release('restore');
    expect(guard.acquire('reset')).toBe(true);
  });
});
