import { describe, expect, it } from 'vitest';

import { getApiErrorMessage, parseApiTextPayload } from '../lib/api-error-utils';

describe('api error utilities', () => {
  it('normalizes Error, string, and unknown failures safely', () => {
    expect(getApiErrorMessage(new Error('  timeout  '))).toBe('timeout');
    expect(getApiErrorMessage('  offline  ')).toBe('offline');
    expect(getApiErrorMessage({ code: 'E_UNKNOWN' })).toBe('Network request failed. Please try again.');
  });

  it('parses JSON payloads and rejects malformed or unsupported responses clearly', () => {
    expect(parseApiTextPayload<{ ok: boolean }>(' {"ok":true} ', 'application/json')).toEqual({ ok: true });
    expect(parseApiTextPayload<{ ok: boolean }>(' {"ok":true} ', 'text/plain')).toEqual({ ok: true });
    expect(() => parseApiTextPayload('{broken', 'application/json')).toThrow('malformed JSON');
    expect(() => parseApiTextPayload('not-json', 'text/plain')).toThrow('unsupported response format');
    expect(parseApiTextPayload<Record<string, never>>('   ', 'application/json')).toEqual({});
  });
});
