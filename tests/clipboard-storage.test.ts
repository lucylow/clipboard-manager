import { describe, expect, it } from 'vitest';

import { parseStoredArray } from '../lib/clipboard-storage';

describe('parseStoredArray', () => {
  it('returns an empty list for missing storage', () => {
    expect(parseStoredArray(null)).toEqual([]);
  });

  it('returns an empty list for malformed JSON', () => {
    expect(parseStoredArray('{not-json')).toEqual([]);
  });

  it('returns an empty list for valid non-array JSON', () => {
    expect(parseStoredArray('{"items":[]}')).toEqual([]);
  });

  it('preserves valid array payloads', () => {
    expect(parseStoredArray<{ id: string }>(JSON.stringify([{ id: 'one' }]))).toEqual([{ id: 'one' }]);
  });
});
