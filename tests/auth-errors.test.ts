import { describe, expect, it } from 'vitest';

import { getAuthError } from '../lib/_core/auth-errors';

describe('auth errors', () => {
  it('preserves useful Error and string messages', () => {
    expect(getAuthError(new Error('session unavailable')).message).toBe('session unavailable');
    expect(getAuthError('keychain unavailable').message).toBe('keychain unavailable');
  });

  it('returns a safe fallback for unknown failures', () => {
    expect(getAuthError({ code: 'E_KEYCHAIN' }).message).toBe('Failed to load the local session. Please try again.');
  });
});
