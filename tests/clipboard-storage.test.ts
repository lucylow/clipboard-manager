import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseStoredArray, queueClipboardWrite, repairStoredPayload } from '../lib/clipboard-storage';

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

  it('repairs partially corrupted arrays without discarding valid items', () => {
    const result = repairStoredPayload<{ id: string }>(JSON.stringify([{ id: 'one' }, null, { id: 2 }, { id: 'two' }]), (item): item is { id: string } => Boolean(item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string'));
    expect(result).toEqual({ items: [{ id: 'one' }, { id: 'two' }], repaired: true });
    expect(repairStoredPayload('{broken', (_item: unknown): _item is unknown => true)).toEqual({ items: [], repaired: true });
    expect(repairStoredPayload('{"items":[]}', (_item: unknown): _item is unknown => true)).toEqual({ items: [], repaired: true });
  });

  it('continues serialized writes after a rejected storage write', async () => {
    const setItem = vi.mocked(AsyncStorage.setItem);
    setItem.mockReset();
    setItem.mockRejectedValueOnce(new Error('storage locked')).mockResolvedValue(undefined);

    await expect(queueClipboardWrite([{ id: 'first' }])).rejects.toThrow('storage locked');
    await expect(queueClipboardWrite([{ id: 'second' }])).resolves.toBeUndefined();
    expect(setItem).toHaveBeenCalledTimes(2);
  });

  it('rejects a stalled write and allows a later write to proceed', async () => {
    vi.useFakeTimers();
    const setItem = vi.mocked(AsyncStorage.setItem);
    setItem.mockReset();
    setItem.mockImplementationOnce(() => new Promise<void>(() => undefined));
    setItem.mockResolvedValue(undefined);

    const stalled = queueClipboardWrite([{ id: 'stalled' }]);
    await vi.advanceTimersByTimeAsync(5000);
    await expect(stalled).rejects.toThrow('Clipboard storage write timed out');
    await expect(queueClipboardWrite([{ id: 'recovered' }])).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
