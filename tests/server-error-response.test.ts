import { describe, expect, it } from 'vitest';

import { getSafeServerErrorMessage, PUBLIC_SERVER_ERROR } from '../server/_core/error-response';

describe('server error response', () => {
  it('keeps a bounded diagnostic message for logs', () => {
    expect(getSafeServerErrorMessage(new Error('database unavailable'))).toBe('database unavailable');
    expect(getSafeServerErrorMessage({ code: 'E_FAIL' })).toBe('Unknown server error');
    expect(getSafeServerErrorMessage(new Error('x'.repeat(400))).length).toBe(240);
  });

  it('uses a generic public message', () => {
    expect(PUBLIC_SERVER_ERROR).not.toContain('database');
    expect(PUBLIC_SERVER_ERROR).toContain('try again');
  });
});
