import { describe, expect, it } from 'vitest';
import { getLightboxVisibilityState } from '../lib/lightbox-visibility-state';

describe('getLightboxVisibilityState', () => {
  it('keeps the closed modal hidden and content unavailable', () => {
    expect(getLightboxVisibilityState(false)).toEqual({
      visible: false,
      contentReady: false,
      closeLabel: 'Close image preview',
    });
  });

  it('opens with content ready and a stable accessible close label', () => {
    expect(getLightboxVisibilityState(true)).toEqual({
      visible: true,
      contentReady: true,
      closeLabel: 'Close image preview',
    });
  });

  it('returns the same closed state after repeated dismissal requests', () => {
    expect(getLightboxVisibilityState(false)).toEqual(getLightboxVisibilityState(false));
  });
});
