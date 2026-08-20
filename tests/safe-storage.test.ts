import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    multiRemove: vi.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { removeStorageValues, writeStorageValue } from '../lib/safe-storage';

describe('safe storage writes', () => {
  it('writes successfully through the bounded helper', async () => {
    const setItem = vi.mocked(AsyncStorage.setItem);
    setItem.mockReset().mockResolvedValue(undefined);
    await expect(writeStorageValue('settings', '{"darkMode":true}')).resolves.toBeUndefined();
    expect(setItem).toHaveBeenCalledWith('settings', '{"darkMode":true}');
  });

  it('rejects stalled writes and cleanup operations with actionable errors', async () => {
    vi.useFakeTimers();
    const setItem = vi.mocked(AsyncStorage.setItem);
    const multiRemove = vi.mocked(AsyncStorage.multiRemove);
    setItem.mockReset().mockImplementation(() => new Promise<void>(() => undefined));
    multiRemove.mockReset().mockImplementation(() => new Promise<void>(() => undefined));
    const write = writeStorageValue('settings', '{}');
    const remove = removeStorageValues(['settings']);
    const writeAssertion = expect(write).rejects.toThrow('Local settings save timed out');
    const removeAssertion = expect(remove).rejects.toThrow('Local settings cleanup timed out');
    await vi.advanceTimersByTimeAsync(5000);
    await writeAssertion;
    await removeAssertion;
    vi.useRealTimers();
  });
});
