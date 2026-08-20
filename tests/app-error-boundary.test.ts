import { describe, expect, it } from 'vitest';

import { getAppErrorMessage } from '../lib/app-error-message';

describe('app error boundary', () => {
  it('keeps useful Error messages while trimming whitespace', () => {
    expect(getAppErrorMessage(new Error('  render failed  '))).toBe('render failed');
  });

  it('uses a safe fallback for unknown thrown values', () => {
    expect(getAppErrorMessage({ reason: 'unknown' })).toBe('The app encountered an unexpected problem.');
    expect(getAppErrorMessage(new Error(''))).toBe('The app encountered an unexpected problem.');
  });
});
