import { describe, expect, it, vi } from 'vitest';
import { createHistoryRecoveryCoordinator } from '../lib/history-recovery-coordinator';

describe('history recovery coordinator', () => {
  it('shares the in-flight recovery promise across repeated triggers', async () => {
    let resolveOperation!: () => void;
    const operation = vi.fn(() => new Promise<void>((resolve) => { resolveOperation = resolve; }));
    const coordinator = createHistoryRecoveryCoordinator(operation);

    const first = coordinator.run();
    const second = coordinator.run();

    expect(first).toBe(second);
    await Promise.resolve();
    expect(operation).toHaveBeenCalledTimes(1);
    expect(coordinator.isRunning()).toBe(true);
    resolveOperation();
    await first;
    expect(coordinator.isRunning()).toBe(false);
  });

  it('clears the guard after failure so a later resume can recover', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('resume failed'))
      .mockResolvedValueOnce(undefined);
    const coordinator = createHistoryRecoveryCoordinator(operation);

    await expect(coordinator.run()).rejects.toThrow('resume failed');
    await expect(coordinator.run()).resolves.toBeUndefined();
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('recovers when the operation throws synchronously', async () => {
    const operation = vi.fn()
      .mockImplementationOnce(() => { throw new Error('sync resume failure'); })
      .mockResolvedValueOnce(undefined);
    const coordinator = createHistoryRecoveryCoordinator(operation);

    await expect(coordinator.run()).rejects.toThrow('sync resume failure');
    await expect(coordinator.run()).resolves.toBeUndefined();
    expect(operation).toHaveBeenCalledTimes(2);
  });
});
