import { describe, expect, it, vi } from 'vitest';
import { withTimeout } from '../lib/with-timeout';

describe('withTimeout', () => {
  it('resolves and clears its timer when the operation completes', async () => {
    vi.useFakeTimers();
    const result = withTimeout(Promise.resolve('ready'), 1000);
    await expect(result).resolves.toBe('ready');
    vi.advanceTimersByTime(1000);
    await expect(result).resolves.toBe('ready');
    vi.useRealTimers();
  });

  it('propagates an operation rejection before the timeout', async () => {
    await expect(withTimeout(Promise.reject(new Error('storage unavailable')), 1000)).rejects.toThrow('storage unavailable');
  });

  it('rejects a stalled operation with the supplied message', async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise<string>(() => undefined), 250, 'History read timed out');
    vi.advanceTimersByTime(250);
    await expect(result).rejects.toThrow('History read timed out');
    vi.useRealTimers();
  });
});
