import { describe, expect, it } from 'vitest';
import { createLightboxOperationGuard } from '../lib/lightbox-operation-guard';

describe('createLightboxOperationGuard', () => {
  it('rejects a competing action while OCR or sharing is active', () => {
    const guard = createLightboxOperationGuard();

    expect(guard.acquire('ocr')).toBe(true);
    expect(guard.active).toBe('ocr');
    expect(guard.acquire('share')).toBe(false);
    expect(guard.active).toBe('ocr');
  });

  it('only releases the operation that owns the guard', () => {
    const guard = createLightboxOperationGuard();

    expect(guard.acquire('share')).toBe(true);
    guard.release('ocr');
    expect(guard.active).toBe('share');
    guard.release('share');
    expect(guard.active).toBeNull();
  });

  it('allows a retry after the previous action completes or fails', () => {
    const guard = createLightboxOperationGuard();

    expect(guard.acquire('ocr')).toBe(true);
    guard.release('ocr');
    expect(guard.acquire('share')).toBe(true);
    guard.release('share');
    expect(guard.acquire('ocr')).toBe(true);
  });
});


  it('rejects malformed runtime operation names without changing the lock', () => {
    const guard = createLightboxOperationGuard();
    const malformed = 'delete' as 'ocr';

    expect(guard.acquire(malformed)).toBe(false);
    expect(guard.active).toBeNull();
    expect(guard.acquire('ocr')).toBe(true);
    expect(guard.release(malformed)).toBe(false);
    expect(guard.active).toBe('ocr');
  });

  it('reports ownership-safe release results and remains stable after repeated release', () => {
    const guard = createLightboxOperationGuard();

    expect(guard.release('ocr')).toBe(false);
    expect(guard.acquire('share')).toBe(true);
    expect(guard.release('ocr')).toBe(false);
    expect(guard.release('share')).toBe(true);
    expect(guard.release('share')).toBe(false);
    expect(guard.active).toBeNull();
  });
