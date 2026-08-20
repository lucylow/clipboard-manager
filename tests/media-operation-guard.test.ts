import { describe, expect, it } from 'vitest';

import { createMediaOperationGuard } from '../lib/media-operation-guard';

describe('media operation guard', () => {
  it('allows one active image operation at a time', () => {
    const guard = createMediaOperationGuard();
    expect(guard.acquire()).toBe(true);
    expect(guard.isActive).toBe(true);
    expect(guard.acquire()).toBe(false);
    guard.release();
    expect(guard.isActive).toBe(false);
    expect(guard.acquire()).toBe(true);
  });
});
